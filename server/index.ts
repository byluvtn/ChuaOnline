import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { Server, type Socket } from 'socket.io';
import {
  ACTION_RULES, GROUP_MEDITATE_MIN, ITEM_BY_ID, MEDITATE_GOAL_MIN, MEDITATE_TICK_MS, QUESTS, ROOMS, ROOM_CAPACITY,
  type QuestEvent, type QuestState, type RankRow, type RoomInfo,
} from '../shared/game.js';
import {
  MAP_HALF, levelOf, type ActionKind, type Anim, type ChatMessage, type Lantern, type Outfit, type PlayerState,
} from '../shared/types.js';
import * as db from './db.js';

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
      case '/api/guest': return send(res, 200, { token: db.createGuest().token });
      case '/api/register': {
        const r = db.register(String(b.username ?? ''), String(b.password ?? ''), db.playerIdByToken(bearer));
        return send(res, 'error' in r ? 400 : 200, r);
      }
      case '/api/login': {
        const r = db.login(String(b.username ?? ''), String(b.password ?? ''));
        return send(res, 'error' in r ? 401 : 200, r);
      }
      case '/api/logout': db.logoutToken(bearer); return send(res, 200, {});
      case '/api/me': {
        const id = db.playerIdByToken(bearer);
        const p = id ? db.getProfile(id) : null;
        return p ? send(res, 200, p) : send(res, 401, { error: 'invalid session' });
      }
    }
    return send(res, 404, { error: 'not found' });
  }
  // static (production)
  if (!existsSync(DIST)) { res.writeHead(200); return res.end('chuaonline server (chạy `npm run dev` để dùng client)'); }
  let file = normalize(join(DIST, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
  if (file !== DIST && !file.startsWith(DIST + '/')) { res.writeHead(403); return res.end(); }
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
  last: Partial<Record<ActionKind | 'chat' | 'buy' | 'feedback' | 'mg:moh' | 'mg:memory', number>>;
}
const sessions = new Map<string, Session>();
const roomChat = new Map<string, ChatMessage[]>();
const roomLanterns = new Map<string, Lantern[]>();
const roomMinutes = new Map<string, number>();
let seq = 1;

const OUTFITS: Outfit[] = ['monk', 'nun', 'male', 'female'];
const ANIMS: Anim[] = ['idle', 'walk', 'run', 'sit', 'incense', 'bow', 'chant', 'lantern'];
const clean = (s: unknown, max: number) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
const cleanColor = (c: unknown) => (/^#[0-9a-fA-F]{6}$/.test(String(c)) ? String(c) : '#d99a1e');
const roomSessions = (room: string) => [...sessions.values()].filter((s) => s.room === room);
const roomOk = (id: string) => ROOMS.some((r) => r.id === id);

function roomList(): RoomInfo[] {
  return ROOMS.map((r) => ({ id: r.id, name: r.name, online: roomSessions(r.id).length, capacity: ROOM_CAPACITY }));
}
function questList(pid: number): QuestState[] {
  const rows = new Map(db.questRows(pid).map((r) => [r.quest_id, r]));
  return QUESTS.map((q) => ({
    id: q.id, label: q.label, target: q.target, coins: q.coins, merit: q.merit,
    progress: rows.get(q.id)?.progress ?? 0, claimed: !!rows.get(q.id)?.claimed,
  }));
}
function pushProfile(s: Session) {
  const p = db.getProfile(s.pid);
  if (!p) return;
  s.state.merit = p.merit;
  s.state.accessory = p.accessory;
  s.socket.emit('profile', p);
}
function pushQuests(s: Session) { s.socket.emit('quests', questList(s.pid)); }
function questEvent(s: Session, ev: QuestEvent, by = 1) {
  for (const q of QUESTS) if (q.event === ev) db.bumpQuest(s.pid, q.id, q.target, by);
  pushQuests(s);
}
function meditationInfo(room: string) {
  const sitting = roomSessions(room).filter((s) => s.state.anim === 'sit').length;
  return { sitting, minutes: Math.floor(roomMinutes.get(room) ?? 0), goal: MEDITATE_GOAL_MIN, bonus: sitting >= GROUP_MEDITATE_MIN };
}
function rankings(): { weekly: RankRow[]; all: RankRow[] } {
  const f = (r: { name: string; merit: number }): RankRow => ({ name: r.name, merit: r.merit, level: levelOf(r.merit) });
  return { weekly: db.topWeekly().map(f), all: db.topAllTime().map(f) };
}

function leaveRoom(s: Session) {
  s.socket.leave(s.room);
  s.socket.to(s.room).emit('player:leave', s.state.id);
}

io.use((socket, next) => {
  const pid = db.playerIdByToken(socket.handshake.auth?.token);
  if (!pid) return next(new Error('unauthorized'));
  socket.data.pid = pid;
  next();
});

io.on('connection', (socket) => {
  const pid: number = socket.data.pid;
  // one live connection per account
  for (const [id, other] of sessions) {
    if (other.pid === pid) { other.socket.emit('kicked'); other.socket.disconnect(true); sessions.delete(id); }
  }

  socket.on('join', (p: { name?: string; outfit?: Outfit; color?: string; room?: string }) => {
    const prof = db.getProfile(pid);
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
    db.saveLook(pid, name, outfit, color);

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
      players: roomSessions(room).map((x) => x.state),
      chat: (roomChat.get(room) ?? []).slice(-30),
      lanterns: (roomLanterns.get(room) ?? []).slice(-20),
      meditation: meditationInfo(room),
    });
    socket.to(room).emit('player:join', state);
    pushProfile(s);
    pushQuests(s);
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

  socket.on('chat', (text: string) => {
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
    questEvent(s, 'chat');
  });

  socket.on('action', (kind: ActionKind, wish?: string) => {
    const s = me();
    const rule = ACTION_RULES[kind];
    if (!s || !rule) return;
    const now = Date.now();
    if (now - (s.last[kind] ?? 0) < rule.cooldownMs) return;
    s.last[kind] = now;

    let merit = rule.merit;
    if (rule.boostItem && db.itemQty(pid, rule.boostItem) > 0) {
      db.addItem(pid, rule.boostItem, -1);
      merit = rule.boostMerit ?? merit;
    }
    db.addRewards(pid, merit, 1);
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
    questEvent(s, kind);
    pushProfile(s);
  });

  socket.on('shop:buy', (itemId: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const item = ITEM_BY_ID[String(itemId)];
    if (!s || !item) return cb?.({ ok: false, error: 'Vật phẩm không tồn tại' });
    if (item.kind === 'accessory' && db.itemQty(pid, item.id) > 0) return cb?.({ ok: false, error: 'Bạn đã sở hữu' });
    if (!db.spendCoins(pid, item.price)) return cb?.({ ok: false, error: 'Không đủ xu' });
    db.addItem(pid, item.id, 1);
    pushProfile(s);
    cb?.({ ok: true });
  });

  socket.on('inv:equip', (itemId: string | null) => {
    const s = me();
    if (!s) return;
    if (itemId === null) db.setAccessory(pid, null);
    else {
      const item = ITEM_BY_ID[String(itemId)];
      if (!item || item.kind !== 'accessory' || db.itemQty(pid, item.id) < 1) return;
      db.setAccessory(pid, item.id);
    }
    pushProfile(s);
    io.to(s.room).emit('player:look', { id: s.state.id, accessory: s.state.accessory });
  });

  socket.on('quest:claim', (qid: string) => {
    const s = me();
    const q = QUESTS.find((x) => x.id === qid);
    if (!s || !q) return;
    if (db.claimQuest(pid, q.id, q.target)) {
      db.addRewards(pid, q.merit, q.coins);
      pushProfile(s);
      pushQuests(s);
    }
  });

  // Mini-game rewards: amounts/caps are decided here only; the client just says which game finished.
  const MINIGAMES = {
    moh: { merit: 3, coins: 2, cap: 10 },
    memory: { merit: 2, coins: 5, cap: 5 },
  } as const;
  const MG_COOLDOWN_MS = 20_000;
  socket.on('minigame:reward', (game: string, cb?: (r: { ok: boolean; merit?: number; coins?: number; left?: number; error?: string }) => void) => {
    const s = me();
    if (!s || (game !== 'moh' && game !== 'memory')) return cb?.({ ok: false, error: 'Trò chơi không hợp lệ' });
    const rule = MINIGAMES[game];
    const key = `mg:${game}` as const;
    const now = Date.now();
    if (now - (s.last[key] ?? 0) < MG_COOLDOWN_MS) return cb?.({ ok: false, error: 'Bạn thao tác hơi nhanh, hãy thong thả' });
    if (!db.claimMinigame(pid, game, rule.cap)) return cb?.({ ok: false, error: 'Hôm nay bạn đã nhận đủ phần thưởng trò chơi này', left: 0 });
    s.last[key] = now;
    db.addRewards(pid, rule.merit, rule.coins);
    pushProfile(s);
    cb?.({ ok: true, merit: rule.merit, coins: rule.coins, left: rule.cap - db.minigameCount(pid, game) });
  });

  socket.on('feedback:send', (p: { text?: string; contact?: string }, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const text = clean(p?.text, 500);
    const contact = clean(p?.contact, 100);
    if (text.length < 5) return cb?.({ ok: false, error: 'Góp ý cần tối thiểu 5 ký tự' });
    const now = Date.now();
    if (now - (s.last.feedback ?? 0) < 60_000) return cb?.({ ok: false, error: 'Vui lòng đợi một phút trước khi gửi tiếp' });
    if (!db.saveFeedback(pid, text, contact)) return cb?.({ ok: false, error: 'Hôm nay bạn đã gửi nhiều góp ý, mai hãy gửi tiếp nhé' });
    s.last.feedback = now;
    cb?.({ ok: true });
  });

  socket.on('rank:get', (cb?: (r: ReturnType<typeof rankings>) => void) => cb?.(rankings()));
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
    if (!list.length) continue;
    io.to(r.id).volatile.emit('state', {
      online: list.length,
      players: list.map(({ state: p }) => ({ id: p.id, x: p.x, z: p.z, ry: p.ry, anim: p.anim })),
    });
  }
}, 100);

// meditation: every tick, seated players earn merit; group bonus doubles it
setInterval(() => {
  for (const r of ROOMS) {
    const sitting = roomSessions(r.id).filter((s) => s.state.anim === 'sit');
    if (!sitting.length) { io.to(r.id).emit('meditation', meditationInfo(r.id)); continue; }
    const bonus = sitting.length >= GROUP_MEDITATE_MIN;
    roomMinutes.set(r.id, (roomMinutes.get(r.id) ?? 0) + (sitting.length * MEDITATE_TICK_MS) / 60_000);
    for (const s of sitting) {
      db.addRewards(s.pid, bonus ? 2 : 1, bonus ? 1 : 0);
      questEvent(s, 'meditate');
      pushProfile(s);
    }
    io.to(r.id).emit('meditation', meditationInfo(r.id));
  }
}, MEDITATE_TICK_MS);

httpServer.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
