import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { Server, type Socket } from 'socket.io';
import {
  ACTION_RULES, CHECKIN_REWARDS, GROUP_MEDITATE_MIN, ITEM_BY_ID, LEVEL_BONUS, MEDITATE_GOAL_MIN, MEDITATE_TICK_MS,
  QUESTS, ROOMS, ROOM_CAPACITY, SPIN_SEGMENTS, SUTRAS, WEEKLY_QUESTS, drawSpinSegment,
  type CheckinAck, type MailAck, type QuestEvent, type QuestState, type RankRow, type RoomInfo, type SpinAck, type SpinState,
} from '../shared/game.js';
import {
  MAP_HALF, levelOf, meritForLevel, type ActionKind, type Anim, type ChatMessage, type Lantern, type Outfit, type PlayerState,
} from '../shared/types.js';
import { meritBoost } from '../shared/time.js';
import * as db from './db.js';
import { createNpcRoom, resumeNpcs, tickNpcs, type NpcRoom } from './npcs.js';

const PORT = Number(process.env.PORT ?? 3001);
const DIST = resolve('dist');

// ---------------- HTTP: auth API + static ----------------
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string, max = 20): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) { hits.set(ip, { n: 1, reset: now + 60_000 }); return false; }
  return ++h.n > max;
}
setInterval(() => { const n = Date.now(); hits.forEach((v, k) => v.reset < n && hits.delete(k)); }, 60_000);

function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => { size += c.length; if (size > 4096) { fail(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { fail(e); } });
    req.on('error', fail);
  });
}
const send = (res: ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.glb': 'model/gltf-binary', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.pathname.startsWith('/api/')) {
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });
    const ip = req.socket.remoteAddress ?? '?';
    if (limited(ip)) return send(res, 429, { error: 'Thao tác quá nhanh, thử lại sau' });
    let b: any;
    try { b = await readJson(req); } catch { return send(res, 400, { error: 'bad request' }); }
    const bearer = String(req.headers.authorization ?? '').replace(/^Bearer /, '');
    switch (url.pathname) {
      case '/api/guest': return send(res, 200, { token: (await db.createGuest()).token });
      case '/api/register': {
        const r = await db.register(String(b.username ?? ''), String(b.password ?? ''), await db.playerIdByToken(bearer));
        return send(res, 'error' in r ? 400 : 200, r);
      }
      case '/api/login': {
        const r = await db.login(String(b.username ?? ''), String(b.password ?? ''));
        return send(res, 'error' in r ? 401 : 200, r);
      }
      case '/api/logout': await db.logoutToken(bearer); return send(res, 200, {});
      case '/api/me': {
        const id = await db.playerIdByToken(bearer);
        const p = id ? await db.getProfile(id) : null;
        return p ? send(res, 200, p) : send(res, 401, { error: 'invalid session' });
      }
    }
    return send(res, 404, { error: 'not found' });
  }
  // static (production)
  if (!existsSync(DIST)) { res.writeHead(200); return res.end('chuaonline server (chạy `npm run dev` để dùng client)'); }
  let file = normalize(join(DIST, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
  if (file !== DIST && !file.startsWith(DIST + sep)) { res.writeHead(403); return res.end(); }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}

const httpServer = createServer((req, res) => { handle(req, res).catch(() => { if (!res.headersSent) send(res, 500, { error: 'server' }); }); });
const io = new Server(httpServer, { cors: { origin: true }, maxHttpBufferSize: 4096 });

// ---------------- Realtime ----------------
interface Session {
  pid: number;
  state: PlayerState;
  room: string;
  socket: Socket;
  last: Partial<Record<ActionKind | 'chat' | 'buy' | 'feedback' | 'sutra' | 'mg:moh' | 'mg:memory', number>>;
  /** phòng gần nhất để đếm nhiệm vụ 'room' */
  lastRoom?: string;
}
const sessions = new Map<string, Session>();
const roomChat = new Map<string, ChatMessage[]>();
const roomLanterns = new Map<string, Lantern[]>();
const roomMinutes = new Map<string, number>();
let seq = 1;

const OUTFITS: Outfit[] = ['monk', 'nun', 'male', 'female'];
const ANIMS: Anim[] = ['idle', 'walk', 'run', 'sit', 'sweep', 'ring', 'incense', 'bow', 'chant', 'lantern', 'palms', 'beads'];
/** Mỗi phòng có bộ NPC riêng (cùng id npc1..npc5); NPC không phải phiên nên không tính vào số người online. */
const npcRooms = new Map<string, NpcRoom>();
const npcRoom = (room: string) => { let r = npcRooms.get(room); if (!r) { r = createNpcRoom(); npcRooms.set(room, r); } return r; };
const clean = (s: unknown, max: number) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
const cleanColor = (c: unknown) => (/^#[0-9a-fA-F]{6}$/.test(String(c)) ? String(c) : '#d99a1e');
const roomSessions = (room: string) => [...sessions.values()].filter((s) => s.room === room);
const roomOk = (id: string) => ROOMS.some((r) => r.id === id);
function npcStates(room: string): PlayerState[] {
  const nr = npcRoom(room);
  resumeNpcs(nr);
  return nr.npcs.map((n) => n.state);
}

function roomList(): RoomInfo[] {
  return ROOMS.map((r) => ({ id: r.id, name: r.name, online: roomSessions(r.id).length, capacity: ROOM_CAPACITY }));
}
async function questList(pid: number): Promise<QuestState[]> {
  const rows = new Map((await db.questRows(pid)).map((r) => [r.quest_id, r]));
  const map = (q: (typeof QUESTS)[number]) => ({
    id: q.id, label: q.label, target: q.target, coins: q.coins, merit: q.merit,
    progress: rows.get(q.id)?.progress ?? 0, claimed: !!rows.get(q.id)?.claimed,
  });
  return [...QUESTS, ...WEEKLY_QUESTS].map(map);
}
async function pushProfile(s: Session) {
  const p = await db.getProfile(s.pid);
  if (!p) return;
  s.state.merit = p.merit;
  s.state.accessory = p.accessory;
  s.socket.emit('profile', p);
}
async function pushQuests(s: Session) { s.socket.emit('quests', await questList(s.pid)); }
async function questEvent(s: Session, ev: QuestEvent, by = 1) {
  for (const q of [...QUESTS, ...WEEKLY_QUESTS]) if (q.event === ev) await db.bumpQuest(s.pid, q.id, q.target, by);
  await pushQuests(s);
}
/** Cộng thưởng + đếm quest 'merit' (nhiệm vụ tuần tích công đức). */
async function grantRewards(s: Session, merit: number, coins: number) {
  const before = (await db.getProfile(s.pid))?.merit ?? 0;
  const lvBefore = levelOf(before);
  await db.addRewards(s.pid, merit, coins);
  await questEvent(s, 'merit', merit);
  const after = (await db.getProfile(s.pid))?.merit ?? 0;
  const lvAfter = levelOf(after);
  if (lvAfter > lvBefore && (await db.claimLevelReward(s.pid, lvAfter))) {
    await db.addRewards(s.pid, LEVEL_BONUS.meritPerLevel * (lvAfter - lvBefore), LEVEL_BONUS.coinsPerLevel * (lvAfter - lvBefore));
    s.socket.emit('level:bonus', { level: lvAfter, coins: LEVEL_BONUS.coinsPerLevel * (lvAfter - lvBefore), merit: LEVEL_BONUS.meritPerLevel * (lvAfter - lvBefore) });
  }
  await pushProfile(s);
}
function meditationInfo(room: string) {
  const sitting = roomSessions(room).filter((s) => s.state.anim === 'sit').length;
  return { sitting, minutes: Math.floor(roomMinutes.get(room) ?? 0), goal: MEDITATE_GOAL_MIN, bonus: sitting >= GROUP_MEDITATE_MIN };
}
async function rankings(): Promise<{ weekly: RankRow[]; all: RankRow[] }> {
  const f = (r: { name: string; merit: number }): RankRow => ({ name: r.name, merit: r.merit, level: levelOf(r.merit) });
  return { weekly: (await db.topWeekly()).map(f), all: (await db.topAllTime()).map(f) };
}

function leaveRoom(s: Session) {
  s.socket.leave(s.room);
  s.socket.to(s.room).emit('player:leave', s.state.id);
}

io.use((socket, next) => {
  db.playerIdByToken(socket.handshake.auth?.token).then((pid) => {
    if (!pid) return next(new Error('unauthorized'));
    socket.data.pid = pid;
    next();
  }).catch(() => next(new Error('unauthorized')));
});

io.on('connection', (socket) => {
  const pid: number = socket.data.pid;
  // one live connection per account
  for (const [id, other] of sessions) {
    if (other.pid === pid) { other.socket.emit('kicked'); other.socket.disconnect(true); sessions.delete(id); }
  }

  socket.on('join', async (p: { name?: string; outfit?: Outfit; color?: string; room?: string }) => {
    const prof = await db.getProfile(pid);
    if (!prof) return socket.disconnect(true);
    const old = sessions.get(socket.id);
    if (old) leaveRoom(old);

    let room = roomOk(String(p?.room)) ? String(p.room) : ROOMS[0].id;
    if (roomSessions(room).filter((s) => s.pid !== pid).length >= ROOM_CAPACITY) {
      const alt = roomList().find((r) => r.online < r.capacity);
      if (!alt) return socket.emit('join:error', 'Các chùa đều đã đầy');
      room = alt.id;
    }
    const name = clean(p?.name, 24) || prof.name;
    const outfit = OUTFITS.includes(p?.outfit as Outfit) ? (p!.outfit as Outfit) : prof.outfit;
    const color = cleanColor(p?.color ?? prof.color);
    await db.saveLook(pid, name, outfit, color);

    const state: PlayerState = {
      id: socket.id, name, outfit, color, accessory: prof.accessory,
      x: (Math.random() - 0.5) * 6, z: 8 + Math.random() * 3, ry: Math.PI, anim: 'idle', merit: prof.merit,
    };
    const s: Session = old ?? { pid, state, room, socket, last: {} };
    s.state = state;
    s.room = room;
    sessions.set(socket.id, s);
    socket.join(room);

    socket.emit('welcome', {
      id: socket.id, room,
      players: [...roomSessions(room).map((x) => x.state), ...npcStates(room)],
      chat: (roomChat.get(room) ?? []).slice(-30),
      lanterns: (roomLanterns.get(room) ?? []).slice(-20),
      meditation: meditationInfo(room),
    });
    socket.to(room).emit('player:join', state);
    await pushProfile(s);
    await pushQuests(s);
    socket.emit('checkin', await db.checkinState(pid));
    socket.emit('mail', { unread: await db.mailUnread(pid) });
    socket.emit('spin', { used: (await db.minigameCount(pid, 'quay')) > 0 } satisfies SpinState);
    socket.emit('boost', meritBoost(new Date()));
    // nhiệm vụ "viếng 3 chùa": đếm mỗi lần vào một phòng khác phòng gần nhất
    if (s.lastRoom !== room) { s.lastRoom = room; await questEvent(s, 'room'); }
  });

  const me = () => sessions.get(socket.id);

  socket.on('move', (m: { x: number; z: number; ry: number; anim: Anim }) => {
    const s = me();
    if (!s || !Number.isFinite(m?.x) || !Number.isFinite(m?.z)) return;
    s.state.x = Math.max(-MAP_HALF, Math.min(MAP_HALF, m.x));
    s.state.z = Math.max(-MAP_HALF, Math.min(MAP_HALF, m.z));
    s.state.ry = Number.isFinite(m.ry) ? m.ry : 0;
    if (ANIMS.includes(m.anim)) s.state.anim = m.anim;
  });

  socket.on('chat', async (text: string) => {
    const s = me();
    const t = clean(text, 200);
    if (!s || !t || Date.now() - (s.last.chat ?? 0) < 800) return;
    s.last.chat = Date.now();
    const msg: ChatMessage = { id: seq++, sid: s.state.id, name: s.state.name, text: t, t: Date.now() };
    const arr = roomChat.get(s.room) ?? [];
    arr.push(msg);
    if (arr.length > 100) arr.shift();
    roomChat.set(s.room, arr);
    io.to(s.room).emit('chat', msg);
    await questEvent(s, 'chat');
  });

  socket.on('action', async (kind: ActionKind, wish?: string) => {
    const s = me();
    const rule = ACTION_RULES[kind];
    if (!s || !rule) return;
    const now = Date.now();
    if (now - (s.last[kind] ?? 0) < rule.cooldownMs) return;
    s.last[kind] = now;

    if (kind === 'palms' || kind === 'beads') {
      s.state.anim = kind;
      io.to(s.room).emit('player:action', { id: s.state.id, kind });
      return;
    }

    let merit = rule.merit;
    // vật phẩm tăng công đức: dùng món boost đang có (ưu tiên món đầu tiên trong danh sách)
    for (const boostId of rule.boostItems ?? []) {
      const boost = ITEM_BY_ID[boostId];
      if (boost && (await db.itemQty(pid, boostId)) > 0) {
        await db.addItem(pid, boostId, -1);
        merit = Math.max(merit, boost.boostMerit ?? merit);
        break;
      }
    }
    s.state.anim = kind;
    io.to(s.room).emit('player:action', { id: s.state.id, kind });
    if (kind === 'lantern') {
      const l: Lantern = { id: seq++, name: s.state.name, wish: clean(wish, 120) || 'Cầu bình an', t: now };
      const arr = roomLanterns.get(s.room) ?? [];
      arr.push(l);
      if (arr.length > 200) arr.shift();
      roomLanterns.set(s.room, arr);
      io.to(s.room).emit('lantern', l);
    }
    const finalMerit = Math.round(merit * meritBoost(new Date()).mult);
    await grantRewards(s, finalMerit, 1);
    await questEvent(s, kind);
  });

  /** Hoàn thành một bài kinh trong cửa sổ tụng kinh: cộng đức theo ACTION_RULES.chant. */
  socket.on('sutra:done', async (sutraId: string, cb?: (r: { ok: boolean; merit?: number; error?: string }) => void) => {
    const s = me();
    const sutra = SUTRAS.find((x) => x.id === sutraId);
    if (!s || !sutra) return cb?.({ ok: false, error: 'Bài kinh không hợp lệ' });
    const now = Date.now();
    if (now - (s.last.sutra ?? 0) < 12_000) return cb?.({ ok: false, error: 'Hãy thong thả, đọc xong bài tiếp theo nhé' });
    s.last.sutra = now;
    const rule = ACTION_RULES.chant;
    let merit = rule.merit;
    for (const boostId of rule.boostItems ?? []) {
      const boost = ITEM_BY_ID[boostId];
      if (boost && (await db.itemQty(pid, boostId)) > 0) {
        await db.addItem(pid, boostId, -1);
        merit = Math.max(merit, boost.boostMerit ?? merit);
        break;
      }
    }
    s.state.anim = 'chant';
    io.to(s.room).emit('player:action', { id: s.state.id, kind: 'chant' });
    const finalMerit = Math.round(merit * meritBoost(new Date()).mult);
    await grantRewards(s, finalMerit, 0);
    await questEvent(s, 'chant');
    await questEvent(s, 'sutra');
    cb?.({ ok: true, merit: finalMerit });
  });

  const buyItem = async (itemId: string, qty: number) => {
    const item = ITEM_BY_ID[String(itemId)];
    if (!item) return { ok: false as const, error: 'Vật phẩm không tồn tại' };
    const lvl = levelOf((await db.getProfile(pid))?.merit ?? 0);
    if (item.minLevel && lvl < item.minLevel) return { ok: false as const, error: `Cần cấp ${item.minLevel} để mua` };
    if (item.kind === 'accessory' && (await db.itemQty(pid, item.id)) > 0) return { ok: false as const, error: 'Bạn đã sở hữu' };
    const cost = item.price * qty;
    if (!(await db.purchase(pid, item.id, qty, cost))) return { ok: false as const, error: 'Không đủ xu' };
    return { ok: true as const };
  };

  socket.on('shop:buy', async (itemId: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const r = await buyItem(itemId, 1);
    if (r.ok) { await questEvent(s, 'buy'); await pushProfile(s); }
    cb?.(r.ok ? { ok: true } : { ok: false, error: r.error });
  });

  /** Mua 5 món consumable: giá = 5 × giá lẻ. */
  socket.on('shop:buy5', async (itemId: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const item = ITEM_BY_ID[String(itemId)];
    if (!item) return cb?.({ ok: false, error: 'Vật phẩm không tồn tại' });
    if (item.kind !== 'consumable') return cb?.({ ok: false, error: 'Mua 5 chỉ áp dụng cho vật phẩm tiêu hao' });
    const r = await buyItem(itemId, 5);
    if (r.ok) { await questEvent(s, 'buy', 1); await pushProfile(s); }
    cb?.(r.ok ? { ok: true } : { ok: false, error: r.error });
  });

  socket.on('inv:equip', async (itemId: string | null) => {
    const s = me();
    if (!s) return;
    if (itemId === null) await db.setAccessory(pid, null);
    else {
      const item = ITEM_BY_ID[String(itemId)];
      if (!item || item.kind !== 'accessory' || (await db.itemQty(pid, item.id)) < 1) return;
      await db.setAccessory(pid, item.id);
    }
    await pushProfile(s);
    io.to(s.room).emit('player:look', { id: s.state.id, accessory: s.state.accessory });
  });

  socket.on('quest:claim', async (qid: string) => {
    const s = me();
    const q = [...QUESTS, ...WEEKLY_QUESTS].find((x) => x.id === qid);
    if (!s || !q) return;
    if (await db.claimQuest(pid, q.id, q.target)) {
      await db.addRewards(pid, q.merit, q.coins);
      await pushProfile(s);
      await pushQuests(s);
    }
  });

  // Mini-game rewards: amounts/caps are decided here only; the client just says which game finished.
  const MINIGAMES = {
    moh: { merit: 3, coins: 2, cap: 10 },
    memory: { merit: 2, coins: 5, cap: 5 },
  } as const;
  const MG_COOLDOWN_MS = 20_000;
  socket.on('minigame:reward', async (game: string, cb?: (r: { ok: boolean; merit?: number; coins?: number; left?: number; error?: string }) => void) => {
    const s = me();
    if (!s || (game !== 'moh' && game !== 'memory')) return cb?.({ ok: false, error: 'Trò chơi không hợp lệ' });
    const rule = MINIGAMES[game];
    const key = `mg:${game}` as const;
    const now = Date.now();
    if (now - (s.last[key] ?? 0) < MG_COOLDOWN_MS) return cb?.({ ok: false, error: 'Bạn thao tác hơi nhanh, hãy thong thả' });
    if (!(await db.claimMinigame(pid, game, rule.cap))) return cb?.({ ok: false, error: 'Hôm nay bạn đã nhận đủ phần thưởng trò chơi này', left: 0 });
    s.last[key] = now;
    await db.addRewards(pid, rule.merit, rule.coins);
    await pushProfile(s);
    cb?.({ ok: true, merit: rule.merit, coins: rule.coins, left: rule.cap - (await db.minigameCount(pid, game)) });
  });

  socket.on('checkin:get', async (cb?: (r: CheckinAck) => void) => {
    if (!me()) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    cb?.({ ok: true, state: await db.checkinState(pid) });
  });
  socket.on('checkin:claim', async (cb?: (r: CheckinAck) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const got = await db.claimCheckin(pid);
    if (!got) return cb?.({ ok: false, error: 'Hôm nay bạn đã điểm danh rồi', state: await db.checkinState(pid) });
    const rw = CHECKIN_REWARDS[got.cycleDay - 1];
    if (rw.item) await db.addItem(pid, rw.item, 1);
    await grantRewards(s, rw.merit, rw.coins);
    cb?.({ ok: true, streak: got.streak, cycleDay: got.cycleDay, merit: rw.merit, coins: rw.coins, item: rw.item, state: await db.checkinState(pid) });
  });

  socket.on('mail:list', async (cb?: (r: MailAck) => void) => {
    if (!me()) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    cb?.({ ok: true, mails: await db.mailList(pid), unread: await db.mailUnread(pid) });
  });
  socket.on('mail:read', async (mailId: unknown, cb?: (r: MailAck) => void) => {
    if (!me()) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    if (typeof mailId !== 'number' || !Number.isFinite(mailId)) return cb?.({ ok: false, error: 'Thư không hợp lệ', unread: await db.mailUnread(pid) });
    await db.markMailRead(pid, mailId);
    cb?.({ ok: true, unread: await db.mailUnread(pid) });
  });
  socket.on('mail:claim', async (mailId: unknown, cb?: (r: MailAck) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    if (typeof mailId !== 'number' || !Number.isFinite(mailId)) return cb?.({ ok: false, error: 'Thư không hợp lệ', unread: await db.mailUnread(pid) });
    const got = await db.claimMail(pid, mailId);
    if (!got) return cb?.({ ok: false, error: 'Quà đã được nhận hoặc thư không có quà', unread: await db.mailUnread(pid) });
    const { merit, coins, items } = got.gift;
    for (const [item, qty] of Object.entries(items ?? {})) await db.addItem(pid, item, qty);
    await grantRewards(s, merit, coins);
    cb?.({ ok: true, merit, coins, items: items ?? {}, unread: await db.mailUnread(pid) });
  });

  socket.on('spin:get', async (cb?: (r: SpinAck) => void) => {
    if (!me()) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    cb?.({ ok: true, used: (await db.minigameCount(pid, 'quay')) > 0 });
  });
  socket.on('spin:play', async (cb?: (r: SpinAck) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    if (!(await db.claimMinigame(pid, 'quay', 1)))
      return cb?.({ ok: false, error: 'Hôm nay bạn đã quay rồi, mai quay tiếp nhé', used: true });
    const seg = SPIN_SEGMENTS[drawSpinSegment()];
    if (seg.item) await db.addItem(pid, seg.item, 1);
    await grantRewards(s, seg.merit, seg.coins);
    cb?.({ ok: true, segment: SPIN_SEGMENTS.indexOf(seg), merit: seg.merit, coins: seg.coins, item: seg.item, used: true });
  });

  socket.on('feedback:send', async (p: { text?: string; contact?: string }, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const text = clean(p?.text, 500);
    const contact = clean(p?.contact, 100);
    if (text.length < 5) return cb?.({ ok: false, error: 'Góp ý cần tối thiểu 5 ký tự' });
    const now = Date.now();
    if (now - (s.last.feedback ?? 0) < 60_000) return cb?.({ ok: false, error: 'Vui lòng đợi một phút trước khi gửi tiếp' });
    if (!(await db.saveFeedback(pid, text, contact))) return cb?.({ ok: false, error: 'Hôm nay bạn đã gửi nhiều góp ý, mai hãy gửi tiếp nhé' });
    s.last.feedback = now;
    cb?.({ ok: true });
  });

  socket.on('rank:get', async (cb?: (r: Awaited<ReturnType<typeof rankings>>) => void) => cb?.(await rankings()));
  socket.on('rooms:list', (cb?: (r: RoomInfo[]) => void) => cb?.(roomList()));

  socket.on('disconnect', () => {
    const s = sessions.get(socket.id);
    if (!s) return;
    sessions.delete(socket.id);
    io.to(s.room).emit('player:leave', socket.id);
  });
});

// position broadcast per room
setInterval(() => {
  for (const r of ROOMS) {
    const list = roomSessions(r.id);
    const nr = npcRoom(r.id);
    if (!list.length) { nr.sleeping = true; continue; }
    resumeNpcs(nr);
    const npcs = tickNpcs(nr, Date.now(), list.length);
    for (const c of nr.outbox.splice(0)) {
      const msg: ChatMessage = { id: seq++, sid: c.npcId, name: c.name, text: c.text, t: Date.now() };
      const arr = roomChat.get(r.id) ?? [];
      arr.push(msg);
      if (arr.length > 100) arr.shift();
      roomChat.set(r.id, arr);
      io.to(r.id).emit('chat', msg);
    }
    io.to(r.id).volatile.emit('state', {
      online: list.length,
      players: [...list.map(({ state: p }) => p), ...npcs].map((p) => ({ id: p.id, x: p.x, z: p.z, ry: p.ry, anim: p.anim })),
    });
  }
}, 100);

// meditation: every tick, seated players earn merit; group bonus doubles it
setInterval(async () => {
  for (const r of ROOMS) {
    const sitting = roomSessions(r.id).filter((s) => s.state.anim === 'sit');
    if (!sitting.length) { io.to(r.id).emit('meditation', meditationInfo(r.id)); continue; }
    const bonus = sitting.length >= GROUP_MEDITATE_MIN;
    roomMinutes.set(r.id, (roomMinutes.get(r.id) ?? 0) + (sitting.length * MEDITATE_TICK_MS) / 60_000);
    for (const s of sitting) {
      await grantRewards(s, bonus ? 2 : 1, bonus ? 1 : 0).catch((e) => console.warn('[meditate]', (e as Error).message));
      await questEvent(s, 'meditate').catch((e) => console.warn('[meditate]', (e as Error).message));
    }
    io.to(r.id).emit('meditation', meditationInfo(r.id));
  }
}, MEDITATE_TICK_MS);

httpServer.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
