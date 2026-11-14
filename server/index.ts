import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { Server, type Socket } from 'socket.io';
import {
  ACTION_RULES, CHAIN_QUESTS, CHECKIN_REWARDS, GROUP_MEDITATE_MIN, ITEM_BY_ID, LEVEL_BONUS, MARKET_STALLS, MEDITATE_GOAL_MIN, MEDITATE_TICK_MS,
  NPC_QUESTS, QUESTS, ROOMS, ROOM_CAPACITY, SPIN_SEGMENTS, STAT_MILESTONES, SUTRAS, WEEKLY_QUESTS, drawSpinSegment, defaultTitle, titleName,
  type BeadsAck, type BeadsState, type CheckinAck, type MailAck, type MilestoneEvent, type QuestEvent, type QuestState, type RankRow, type RoomInfo, type SpinAck, type SpinState,
  type StatKey, type StatsAck, type StatsState,
} from '../shared/game.js';
import {
  MAP_HALF, MAP_Z_MIN, levelOf, meritForLevel, type ActionKind, type Anim, type ChatMessage, type Lantern, type Outfit, type PlayerState,
} from '../shared/types.js';
import { meritBoost } from '../shared/time.js';
import * as db from './db.js';
import { createNpcRoom, presentNpcStates, resumeNpcs, tickNpcs, type NpcRoom } from './npcs.js';
import { PHONG_CD } from '../src/layout.js';
import { tickAnimals, getAnimalStates, setAnimalEating, triggerLost, resolveLost, flockCenter, feedFlock } from './animals.js';

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
  last: Partial<Record<ActionKind | 'chat' | 'buy' | 'feedback' | 'sutra' | 'mg:moh' | 'mg:memory' | 'donate' | 'animal:feed', number>>;
  /** phòng gần nhất để đếm nhiệm vụ 'room' */
  lastRoom?: string;
  /** mốc bắt đầu vòng lần hạt đang dở (chỉ trong bộ nhớ) */
  beadStart?: number;
}
const sessions = new Map<string, Session>();
const roomChat = new Map<string, ChatMessage[]>();
const roomLanterns = new Map<string, Lantern[]>();
const roomMinutes = new Map<string, number>();
let seq = 1;

const DONATE_TEMPLATES: ((name: string, amt: string) => string)[] = [
  (n, a) => `🙏 Cảm ơn phật tử ${n} đã đóng góp ${a} xu giúp xây dựng chùa`,
  (n, a) => `🙏 Cảm ơn phật tử ${n} đã phát tâm ${a} xu, công đức vô lượng`,
  (n, a) => `🙏 Phật tử ${n} vừa gieo duyên ${a} xu, nguyện cầu bình an cho gia đình`,
  (n, a) => `🙏 Cảm ơn phật tử ${n} đã đóng góp ${a} xu, nhờ tấm lòng của bạn chùa thêm khang trang`,
  (n, a) => `🙏 Phật tử ${n} vừa đóng góp ${a} xu xây chùa, chúc bạn thân tâm an lạc`,
];

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
  return presentNpcStates(nr);
}

async function refreshQuestGuard(room: string): Promise<void> {
  try {
    const next = new Set<string>();
    for (const s of roomSessions(room)) {
      const rows = await db.questRows(s.pid);
      const byId = new Map(rows.map((r) => [r.quest_id, r]));
      for (const q of [...NPC_QUESTS, ...CHAIN_QUESTS]) {
        const req = (q as any).requires as string | undefined;
        if (req && !byId.get(req)?.claimed) continue;
        const giver = (q as any).giver as string | undefined;
        const receiver = (q as any).receiver as string | undefined;
        const row = byId.get(q.id);
        if (!row) { if (giver) next.add(giver); }
        else if (!row.claimed) { if (giver) next.add(giver); if (receiver) next.add(receiver); }
      }
    }
    npcRoom(room).questGuard = next;
  } catch (e) {
    console.warn('refreshQuestGuard failed:', (e as Error)?.message ?? e);
  }
}

function roomList(): RoomInfo[] {
  return ROOMS.map((r) => ({ id: r.id, name: r.name, online: roomSessions(r.id).length, capacity: ROOM_CAPACITY }));
}
type AnyQuestDef = (typeof QUESTS)[number] | (typeof NPC_QUESTS)[number] | (typeof CHAIN_QUESTS)[number];
const NPC_QUEST_IDS = new Set<string>([...NPC_QUESTS, ...CHAIN_QUESTS].map((q) => q.id));
const CHAIN_QUEST_IDS = new Set<string>(CHAIN_QUESTS.map((q) => q.id));
function isNpcQuest(q: { id: string }): boolean {
  return NPC_QUEST_IDS.has(q.id);
}
function findQuestDef(qid: string): AnyQuestDef | undefined {
  return [...QUESTS, ...WEEKLY_QUESTS, ...NPC_QUESTS, ...CHAIN_QUESTS].find((x) => x.id === qid) as AnyQuestDef | undefined;
}
// Swept points per session, keyed by `${qid}:${x},${z}`. Lost on reconnect (new Session object).
const sweptPoints = new WeakMap<Session, Set<string>>();
const lastVisitCheck = new WeakMap<Session, number>();
function inZone(zone: any, x: number, z: number): boolean {
  if (!zone) return true;
  if (typeof zone.r === 'number') {
    const dx = x - zone.x;
    const dz = z - zone.z;
    return dx * dx + dz * dz <= zone.r * zone.r;
  }
  return x >= zone.x0 && x <= zone.x1 && z >= zone.z0 && z <= zone.z1;
}
function npcPos(s: Session, npcId: string): { x: number; z: number } | undefined {
  const n = (npcStates(s.room) as any[]).find((e) => e.id === npcId);
  return n ? { x: n.x, z: n.z } : undefined;
}
function distTo(s: Session, x: number, z: number): number {
  return Math.hypot(s.state.x - x, s.state.z - z);
}
async function questList(pid: number): Promise<QuestState[]> {
  const rows = new Map((await db.questRows(pid)).map((r) => [r.quest_id, r]));
  const map = (q: AnyQuestDef) => ({
    id: q.id, label: q.label, target: q.target, coins: q.coins, merit: q.merit,
    progress: rows.get(q.id)?.progress ?? 0, claimed: !!rows.get(q.id)?.claimed,
    accepted: rows.has(q.id),
    giver: (q as any).giver,
  });
  const visibleChain = CHAIN_QUESTS.filter((q) => {
    const req = (q as any).requires as string | undefined;
    return !req || !!rows.get(req)?.claimed;
  });
  return [...QUESTS, ...WEEKLY_QUESTS, ...NPC_QUESTS, ...visibleChain].map(map);
}
// Single place for step / zone / accepted checks of NPC and chain quests.
// Returns true if progress was advanced.
async function advanceNpcQuest(
  s: Session,
  q: AnyQuestDef,
  ev: QuestEvent,
  by = 1,
  rows?: Awaited<ReturnType<typeof db.questRows>>,
): Promise<boolean> {
  const row = (rows ?? (await db.questRows(s.pid))).find((r) => r.quest_id === q.id);
  if (!row || row.claimed) return false; // not accepted or already claimed
  const progress = row.progress ?? 0;
  if (progress >= q.target) return false;
  const steps = (q as any).steps as QuestEvent[] | undefined;
  if (steps) {
    if (steps[progress] !== ev) return false;
  } else if (q.event !== ev) {
    return false;
  }
  if (['bow', 'incense', 'chant', 'sutra', 'visit'].includes(ev) && !inZone((q as any).zone, s.state.x, s.state.z)) return false;
  await db.bumpQuest(s.pid, q.id, q.target, by);
  return true;
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
  const rows = await db.questRows(s.pid);
  for (const q of [...NPC_QUESTS, ...CHAIN_QUESTS]) await advanceNpcQuest(s, q as AnyQuestDef, ev, by, rows);
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
  if (lvAfter > lvBefore) await maybeAwardTitles(s);
}
async function currentStatsState(pid: number): Promise<StatsState> {
  return { stats: await db.getStats(pid), claimed: await db.claimedStatRewards(pid) };
}
/** Tăng bộ đếm trọn đời rồi trao thưởng các mốc vừa đạt (mỗi mốc đúng một lần nhờ claimStatReward). */
async function countStat(s: Session, stat: StatKey, delta = 1) {
  const value = await db.bumpStat(s.pid, stat, delta);
  for (const m of STAT_MILESTONES.filter((x) => x.stat === stat && value >= x.threshold)) {
    if (!(await db.claimStatReward(s.pid, m.id))) continue;
    if (m.item) await db.addItem(s.pid, m.item, 1);
    await db.addRewards(s.pid, 0, m.coins);
    await pushProfile(s);
    s.socket.emit('milestone', { id: m.id, title: m.title, coins: m.coins, item: m.item } satisfies MilestoneEvent);
    s.socket.emit('stats', await currentStatsState(s.pid));
  }
  await maybeAwardTitles(s);
}
async function countStatSafe(s: Session, stat: StatKey, delta = 1) {
  try { await countStat(s, stat, delta); } catch (e) { console.warn('[stats]', (e as Error).message); }
}

/** Trao danh hiệu mới đạt (mỗi danh hiệu đúng một lần), báo riêng người chơi và gửi 1 tin hệ thống cho phòng. */
async function maybeAwardTitles(s: Session, announce = true) {
  try {
    const prof = await db.getProfile(s.pid);
    if (!prof) return;
    const have = new Set(await db.awardedTitles(s.pid));
    const fresh: string[] = [];
    for (const id of prof.titles) if (!have.has(id) && (await db.awardTitle(s.pid, id))) fresh.push(id);
    if (!prof.title) {
      const def = defaultTitle(prof.titles);
      if (def !== (s.state.title ?? null)) { s.state.title = def; io.to(s.room).emit('player:title', { id: s.state.id, title: def }); }
    }
    if (!fresh.length) return;
    s.socket.emit('title', { titles: fresh.map((id) => ({ id, title: titleName(id) })) });
    if (!announce) return;
    const top = fresh[fresh.length - 1];
    const sysMsg: ChatMessage = { id: seq++, name: '', text: `🎉 Phật tử ${s.state.name} vừa đạt danh hiệu ${titleName(top)}!`, t: Date.now(), sys: true };
    const arr = roomChat.get(s.room) ?? [];
    arr.push(sysMsg);
    if (arr.length > 100) arr.shift();
    roomChat.set(s.room, arr);
    io.to(s.room).emit('chat', sysMsg);
  } catch (e) { console.warn('[titles]', (e as Error).message); }
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
      title: prof.title ?? defaultTitle(prof.titles),
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
    await maybeAwardTitles(s, false);
    await pushQuests(s);
    socket.emit('checkin', await db.checkinState(pid));
    socket.emit('mail', { unread: await db.mailUnread(pid) });
    socket.emit('spin', { used: (await db.minigameCount(pid, 'quay')) > 0 } satisfies SpinState);
    socket.emit('beads', { rewarded: await db.minigameCount(pid, 'lanhat') } satisfies BeadsState);
    socket.emit('boost', meritBoost(new Date()));
    socket.emit('stats', await currentStatsState(pid));
    // nhiệm vụ "viếng 3 chùa": đếm mỗi lần vào một phòng khác phòng gần nhất
    if (s.lastRoom !== room) { s.lastRoom = room; await questEvent(s, 'room'); }
  });

  const me = () => sessions.get(socket.id);

  socket.on('move', async (m: { x: number; z: number; ry: number; anim: Anim }) => {
    const s = me();
    if (!s || !Number.isFinite(m?.x) || !Number.isFinite(m?.z)) return;
    s.state.x = Math.max(-MAP_HALF, Math.min(MAP_HALF, m.x));
    s.state.z = Math.max(MAP_Z_MIN, Math.min(MAP_HALF, m.z));
    s.state.ry = Number.isFinite(m.ry) ? m.ry : 0;
    if (ANIMS.includes(m.anim)) s.state.anim = m.anim;
    const now = Date.now();
    if (now - (lastVisitCheck.get(s) ?? 0) >= 1000) {
      lastVisitCheck.set(s, now);
      const rows = await db.questRows(s.pid);
      for (const vq of [...NPC_QUESTS, ...CHAIN_QUESTS]) {
        if (await advanceNpcQuest(s, vq as AnyQuestDef, 'visit', 1, rows)) {
          await pushQuests(s);
          break;
        }
      }
    }
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
    if (kind === 'bow') await countStatSafe(s, 'bows');
    else if (kind === 'chant') await countStatSafe(s, 'chants');
    else if (kind === 'lantern') await countStatSafe(s, 'lanterns');
    else if (kind === 'incense') await countStatSafe(s, 'incense');
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
    await countStatSafe(s, 'chants');
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
    if (r.ok) { await questEvent(s, 'buy'); if (itemId === 'chim_phong_sinh') await questEvent(s, 'buyphongsinh', 1); if (itemId === 'thuc_an_chim') await questEvent(s, 'buyfood', 1); await pushProfile(s); }
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
    if (r.ok) { await questEvent(s, 'buy', 1); if (itemId === 'chim_phong_sinh') await questEvent(s, 'buyphongsinh', 1); if (itemId === 'thuc_an_chim') await questEvent(s, 'buyfood', 1); await pushProfile(s); }
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

  socket.on('quest:accept', async (qid: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const q = typeof qid === 'string' ? findQuestDef(qid) : undefined;
    if (!s || !q || !isNpcQuest(q)) return reply({ ok: false, error: 'Nhiệm vụ không hợp lệ' });
    const rows = await db.questRows(s.pid);
    const byId = new Map(rows.map((r) => [r.quest_id, r]));
    const req = (q as any).requires as string | undefined;
    if (req && !byId.get(req)?.claimed) return reply({ ok: false, error: 'Chưa mở khóa nhiệm vụ này' });
    if (byId.has(q.id)) return reply({ ok: false, error: 'Đã nhận hoặc đã hoàn thành nhiệm vụ này' });
    await db.acceptQuest(s.pid, q.id);
    const steps = (q as any).steps as QuestEvent[] | undefined;
    if (steps?.[0] === 'talk' || (!steps && q.event === 'talk')) await db.bumpQuest(s.pid, q.id, q.target, 1);
    if (q.id === 'nq_find_lost_pet') triggerLost(s.room);
    reply({ ok: true });
    await pushQuests(s);
    refreshQuestGuard(s.room).catch(() => {});
  });

  socket.on('quest:sweep', async (
    payload: { qid: string; point: { x: number; z: number } },
    cb?: (r: { ok: boolean; error?: string }) => void,
  ) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const q = payload && typeof payload.qid === 'string' ? findQuestDef(payload.qid) : undefined;
    const pt = payload?.point;
    if (!s || !q || !isNpcQuest(q) || !pt || typeof pt.x !== 'number' || typeof pt.z !== 'number') {
      return reply({ ok: false, error: 'Yêu cầu không hợp lệ' });
    }
    const points = (q as any).points as { x: number; z: number }[] | undefined;
    if (!points || !points.some((p) => p.x === pt.x && p.z === pt.z)) return reply({ ok: false, error: 'Điểm không hợp lệ' });
    if (distTo(s, pt.x, pt.z) > 2.5) return reply({ ok: false, error: 'Bạn đứng quá xa' });
    let set = sweptPoints.get(s);
    if (!set) { set = new Set<string>(); sweptPoints.set(s, set); }
    const key = `${q.id}:${pt.x},${pt.z}`;
    if (set.has(key)) return reply({ ok: false, error: 'Điểm này đã quét rồi' });
    const rows = await db.questRows(s.pid);
    const ok = await advanceNpcQuest(s, q, 'sweep', 1, rows);
    if (!ok) return reply({ ok: false, error: 'Chưa thể quét lúc này' });
    set.add(key);
    reply({ ok: true });
    await pushQuests(s);
  });

  socket.on('quest:feed', async (payload: { animalId: string }, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const q = findQuestDef('nq_feed_pets');
    const animalId = payload && typeof payload.animalId === 'string' ? payload.animalId : undefined;
    const a = s && animalId ? getAnimalStates(s.room).find((x) => x.id === animalId) : undefined;
    if (!s || !q || !isNpcQuest(q) || !a || (a.kind !== 'dog' && a.kind !== 'cat')) {
      return reply({ ok: false, error: 'Yêu cầu không hợp lệ' });
    }
    if (distTo(s, a.x, a.z) > 2.5) return reply({ ok: false, error: 'Bạn đứng quá xa' });
    const rows = await db.questRows(s.pid);
    const ok = await advanceNpcQuest(s, q, 'feed', 1, rows);
    if (!ok) return reply({ ok: false, error: 'Chưa thể cho ăn lúc này' });
    setAnimalEating(s.room, a.id, 3);
    reply({ ok: true });
    await pushQuests(s);
  });

  socket.on('animal:feed', async (payload: { kind: 'bird' | 'pet'; id?: string }, cb?: (r: { ok: boolean; rewarded?: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; rewarded?: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    if (!s) return reply({ ok: false, error: 'Chưa vào chùa' });
    const kind = payload && payload.kind;
    if (kind !== 'bird' && kind !== 'pet') return reply({ ok: false, error: 'Yêu cầu không hợp lệ' });

    const now = Date.now();
    if (now - (s.last['animal:feed'] ?? 0) < 2000) {
      return reply({ ok: false, error: 'Bạn thao tác hơi nhanh, hãy thong thả' });
    }

    let petId: string | undefined;
    if (kind === 'bird') {
      const c = flockCenter(s.room);
      if (!c) return reply({ ok: false, error: 'Không tìm thấy đàn chim' });
      if (distTo(s, c.x, c.z) > 3) return reply({ ok: false, error: 'Bạn đứng quá xa đàn chim' });
    } else {
      const id = typeof payload.id === 'string' ? payload.id : undefined;
      const a = id ? getAnimalStates(s.room).find((x) => x.id === id) : undefined;
      if (!a || (a.kind !== 'dog' && a.kind !== 'cat')) return reply({ ok: false, error: 'Yêu cầu không hợp lệ' });
      if (distTo(s, a.x, a.z) > 3) return reply({ ok: false, error: 'Bạn đứng quá xa' });
      petId = a.id;
    }
    s.last['animal:feed'] = now;

    const foodId = kind === 'bird' ? 'thuc_an_chim' : 'thuc_an_cho_meo';
    if ((await db.itemQty(s.pid, foodId)) < 1) {
      return reply({
        ok: false,
        error: kind === 'bird'
          ? 'Bạn chưa có Túi thức ăn cho chim — mua ở quầy Bác Bán Chim Cá'
          : 'Bạn chưa có Túi thức ăn cho chó mèo — mua ở quầy Bác Bán Chim Cá',
      });
    }
    await db.addItem(s.pid, foodId, -1);

    const rewarded = await db.claimMinigame(s.pid, kind === 'bird' ? 'feed_bird' : 'feed_pet', 3);
    if (rewarded) await grantRewards(s, 5, 0);

    if (kind === 'bird') {
      feedFlock(s.room, s.state.x, s.state.z, 10);
      const q26 = findQuestDef('nq_feed_birds');
      if (q26 && isNpcQuest(q26)) await advanceNpcQuest(s, q26, 'feed', 1);
      await pushQuests(s);
    } else if (petId) {
      setAnimalEating(s.room, petId, 5);
    }

    reply({ ok: true, rewarded });
    await pushProfile(s);
  });

  socket.on('quest:find', async (payload: { animalId: string }, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const q = findQuestDef('nq_find_lost_pet');
    const animalId = payload && typeof payload.animalId === 'string' ? payload.animalId : undefined;
    const a = s && animalId ? getAnimalStates(s.room).find((x) => x.id === animalId) : undefined;
    if (!s || !q || !isNpcQuest(q) || !a || a.lost !== true) {
      return reply({ ok: false, error: 'Yêu cầu không hợp lệ' });
    }
    if (distTo(s, a.x, a.z) > 2.5) return reply({ ok: false, error: 'Bạn đứng quá xa' });
    const rows = await db.questRows(s.pid);
    const ok = await advanceNpcQuest(s, q, 'find', 1, rows);
    if (!ok) return reply({ ok: false, error: 'Chưa thể tìm lúc này' });
    resolveLost(s.room, a.id);
    reply({ ok: true });
    await pushQuests(s);
  });

  socket.on('quest:deliver', async (qid: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const q = typeof qid === 'string' ? findQuestDef(qid) : undefined;
    if (!s || !q || !isNpcQuest(q)) return reply({ ok: false, error: 'Nhiệm vụ không hợp lệ' });
    const receiver = (q as any).receiver as string | undefined;
    const pos = receiver ? npcPos(s, receiver) : undefined;
    if (!pos) return reply({ ok: false, error: 'Không tìm thấy người nhận' });
    if (distTo(s, pos.x, pos.z) > 3) return reply({ ok: false, error: 'Bạn đứng quá xa người nhận' });
    const rows = await db.questRows(s.pid);
    const ok = await advanceNpcQuest(s, q, 'deliver', 1, rows);
    if (!ok) return reply({ ok: false, error: 'Chưa thể giao lúc này' });
    reply({ ok: true });
    await pushQuests(s);
  });

  socket.on('market:buy', async (stallId: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const stall = (MARKET_STALLS as any[]).find((m) => m.id === stallId);
    if (!s || !stall) return reply({ ok: false, error: 'Gian hàng không hợp lệ' });
    if (distTo(s, stall.x, stall.z) > 4) return reply({ ok: false, error: 'Bạn đứng quá xa gian hàng' });
    const rows = await db.questRows(s.pid);
    const byId = new Map(rows.map((r) => [r.quest_id, r]));
    const match = [...NPC_QUESTS, ...CHAIN_QUESTS].find((q) => {
      const row = byId.get(q.id);
      if (!row || row.claimed) return false;
      const steps = (q as any).steps as QuestEvent[] | undefined;
      const cur = steps ? steps[row.progress ?? 0] : q.event;
      return cur === 'marketbuy' && (q as any).stall === stallId;
    });
    if (!match) return reply({ ok: false, error: 'Chưa có nhiệm vụ cần mua món này' });
    const profile: any = await db.getProfile(s.pid);
    if (!profile || (profile.coins ?? 0) < 10) return reply({ ok: false, error: 'Không đủ xu' });
    await db.addRewards(s.pid, 0, -10);
    await advanceNpcQuest(s, match as AnyQuestDef, 'marketbuy', 1, rows);
    reply({ ok: true });
    await pushProfile(s);
    await pushQuests(s);
  });

  socket.on('donate', async (amount: unknown, cb?: (r: { ok: boolean; coins?: number; merit?: number; broadcast?: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; coins?: number; merit?: number; broadcast?: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    if (!s) return reply({ ok: false, error: 'Chưa vào chùa' });
    const now = Date.now();
    if (now - (s.last.donate ?? 0) < 1500) return reply({ ok: false, error: 'Đang xử lý, thử lại sau' });
    s.last.donate = now;
    if (distTo(s, PHONG_CD.x, PHONG_CD.z) > 6) return reply({ ok: false, error: 'Bạn đứng quá xa bàn ghi công đức' });
    const n = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isInteger(n) || n < 1 || n > 100000) return reply({ ok: false, error: 'Số xu không hợp lệ' });
    const before = (await db.getProfile(s.pid))?.merit ?? 0;
    const lvBefore = levelOf(before);
    const r = await db.donate(s.pid, n);
    if (!r.ok) return reply({ ok: false, error: r.error });
    // Cong duc nhiem vu 'merit': KHONG dung grantRewards vi no nhan he so gio le (meritBoost), pha ti le 1 xu = 1 cong duc.
    await questEvent(s, 'merit', n);
    // Xet len cap (giong grantRewards, khong nhan he so)
    const lvAfter = levelOf(r.merit);
    if (lvAfter > lvBefore && (await db.claimLevelReward(s.pid, lvAfter))) {
      await db.addRewards(s.pid, LEVEL_BONUS.meritPerLevel * (lvAfter - lvBefore), LEVEL_BONUS.coinsPerLevel * (lvAfter - lvBefore));
      s.socket.emit('level:bonus', { level: lvAfter, coins: LEVEL_BONUS.coinsPerLevel * (lvAfter - lvBefore), merit: LEVEL_BONUS.meritPerLevel * (lvAfter - lvBefore) });
    }
    await pushProfile(s);
    await maybeAwardTitles(s);
    const broadcast = n >= 50;
    reply({ ok: true, coins: r.coins, merit: r.merit, broadcast });
    // Broadcast SAU commit + pushProfile; fire-and-forget, loi emit khong rollback.
    if (broadcast) {
      const tpl = DONATE_TEMPLATES[Math.floor(Math.random() * DONATE_TEMPLATES.length)];
      const text = tpl(s.state.name, n.toLocaleString('vi-VN'));
      io.to(s.room).emit('donation', { name: s.state.name, amount: n, text });
      const sysMsg: ChatMessage = { id: seq++, name: '', text: text + ' 🙏', t: Date.now(), sys: true };
      const arr = roomChat.get(s.room) ?? [];
      arr.push(sysMsg);
      if (arr.length > 100) arr.shift();
      roomChat.set(s.room, arr);
      io.to(s.room).emit('chat', sysMsg);
    }
  });

  socket.on('release:phongsinh', async (payload: { kind: 'bird' | 'fish' }, cb?: (r: { ok: boolean; error?: string; merit?: number }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const kind = payload?.kind;
    if (kind !== 'bird' && kind !== 'fish') return cb?.({ ok: false, error: 'Loại không hợp lệ' });
    const itemId = kind === 'bird' ? 'chim_phong_sinh' : 'ca_phong_sinh';
    if (distTo(s, 30, -31) > 3.5) return cb?.({ ok: false, error: 'Bạn đứng quá xa bến thả' });
    if ((await db.itemQty(pid, itemId)) < 1) return cb?.({ ok: false, error: 'Bạn không có chim/cá phóng sinh' });
    await db.addItem(pid, itemId, -1);
    const merit = kind === 'bird' ? 20 : 10;
    await grantRewards(s, merit, 0);
    await questEvent(s, 'release');
    await pushProfile(s);
    io.to(s.room).emit('player:release', { id: s.state.id, kind });
    cb?.({ ok: true, merit });
  });

  socket.on('quest:claim', async (qid: string) => {
    const s = me();
    const q = typeof qid === 'string' ? findQuestDef(qid) : undefined;
    if (!s || !q) return;
    if (isNpcQuest(q)) {
      const giver = (q as any).giver as string | undefined;
      const pos = giver ? npcPos(s, giver) : undefined;
      if (!pos || distTo(s, pos.x, pos.z) > 3) return;
    }
    if (await db.claimQuest(pid, q.id, q.target)) {
      await db.addRewards(pid, q.merit, q.coins);
      await db.recordQuestDone(pid, q.id);
      await pushProfile(s);
      await maybeAwardTitles(s);
      await pushQuests(s);
      refreshQuestGuard(s.room).catch(() => {});
    }
  });

  socket.on('title:select', async (titleId: unknown, cb?: (r: { ok: boolean; error?: string; title?: string }) => void) => {
    const reply = (r: { ok: boolean; error?: string; title?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!s) return reply({ ok: false, error: 'Chưa vào chùa' });
    const prof = typeof titleId === 'string' ? await db.getProfile(s.pid) : null;
    if (!prof || typeof titleId !== 'string' || !prof.titles.includes(titleId)) return reply({ ok: false, error: 'Chưa đạt danh hiệu này' });
    await db.saveTitle(s.pid, titleId);
    s.state.title = titleId;
    io.to(s.room).emit('player:title', { id: s.state.id, title: titleId });
    await pushProfile(s);
    reply({ ok: true, title: titleId });
  });

  // Mini-game rewards: amounts/caps are decided here only; the client just says which game finished.
  const MINIGAMES = {
    moh: { merit: 3, coins: 2, cap: 10 },
    memory: { merit: 2, coins: 5, cap: 5 },
  } as const;
  const MG_COOLDOWN_MS = 20_000;
  const BEAD_ROUND_MIN_MS = 30_000;
  const BEAD_ROUND_MAX_MS = 30 * 60_000;
  const BEAD_ROUND_REWARD = { merit: 10, coins: 5 } as const;
  const BEAD_DAILY_CAP = 5;
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

  socket.on('beads:start', (cb?: (r: { ok: boolean }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false });
    s.beadStart = Date.now();
    cb?.({ ok: true });
  });
  socket.on('beads:done', async (cb?: (r: BeadsAck) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false });
    const started = s.beadStart;
    s.beadStart = undefined;
    const elapsed = started === undefined ? -1 : Date.now() - started;
    if (elapsed < BEAD_ROUND_MIN_MS || elapsed > BEAD_ROUND_MAX_MS) return cb?.({ ok: false });
    await countStatSafe(s, 'beads_rounds');
    const rewarded = await db.claimMinigame(pid, 'lanhat', BEAD_DAILY_CAP);
    const merit = rewarded ? Math.round(BEAD_ROUND_REWARD.merit * meritBoost(new Date()).mult) : 0;
    if (rewarded) {
      await grantRewards(s, merit, BEAD_ROUND_REWARD.coins);
      await questEvent(s, 'beads');
    }
    cb?.({ ok: true, rewarded, merit });
    socket.emit('beads', { rewarded: await db.minigameCount(pid, 'lanhat') } satisfies BeadsState);
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

  socket.on('stats:get', async (cb?: (r: StatsAck) => void) => {
    if (!me()) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    cb?.({ ok: true, state: await currentStatsState(pid) });
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
  socket.on('donors:get', async (cb?: (r: { name: string; coins: number; merit: number }[]) => void) => cb?.(await db.topDonors(10)));
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
    tickAnimals(r.id, 0.1);
    for (const id of nr.left.splice(0)) io.to(r.id).emit('player:leave', id);
    for (const st of nr.joined.splice(0)) io.to(r.id).emit('player:join', st);
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
      animals: getAnimalStates(r.id),
    });
  }
}, 100);

setInterval(() => {
  for (const r of ROOMS) refreshQuestGuard(r.id).catch(() => {});
}, 10_000);

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
      await countStatSafe(s, 'meditate_sec', MEDITATE_TICK_MS / 1000);
    }
    io.to(r.id).emit('meditation', meditationInfo(r.id));
  }
}, MEDITATE_TICK_MS);

httpServer.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
