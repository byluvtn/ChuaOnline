import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { Server, type Socket } from 'socket.io';
import {
  ACTION_RULES, CHAIN_QUESTS, CHECKIN_REWARDS, GARDEN_GOOD_CHANCE, GARDEN_GOOD_HARVEST_COINS, GARDEN_GOOD_SEEDS, GARDEN_HARVEST_MERIT, GARDEN_PLOTS, GARDEN_SEEDS, GROUP_MEDITATE_MIN, ITEM_BY_ID, LEVEL_BONUS, MARKET_STALLS, MEDITATE_GOAL_MIN, MEDITATE_TICK_MS, HALO_TIER1_SEC, HALO_TIER2_SEC,
  NPC_QUESTS, QUESTS, ROOMS, ROOM_CAPACITY, SPIN_SEGMENTS, STAT_MILESTONES, SUTRAS, WEEKLY_QUESTS, drawSpinSegment, gardenSeedOf, defaultTitle, titleName, dqTodayIds,
  type BeadsAck, type BeadsState, type CheckinAck, type GardenPlotState, type GiftAck, type MailAck, type MilestoneEvent, type QuestEvent, type QuestState, type RankRow, type RoomInfo, type SpinAck, type SpinState,
  type StatKey, type StatsAck, type StatsState,
} from '../shared/game.js';
import {
  MAP_HALF, MAP_Z_MIN, MAP_Z_MAX, levelOf, meritForLevel, type ActionKind, type Anim, type ChatMessage, type Lantern, type Outfit, type PlayerState,
} from '../shared/types.js';
import { dayKeyICT, meritBoost } from '../shared/time.js';
import * as db from './db.js';
import { creditSitting, haloForSec, flushAbort, flushBegin, flushCommit, newMeditationDay, pauseSitting, rollMeditationDay, medTotalSec, type MeditationDayState } from './meditation.js';
import { gardenSeedGiftSent, harvestGardenRow, listGardenRows, plantGardenRow, waterGardenRow } from './garden.js';
import { createNpcRoom, presentNpcStates, resumeNpcs, tickNpcs, type NpcRoom } from './npcs.js';
import { BELL, PHONG_CD } from '../src/layout.js';
import { FORTUNES, type FortuneAck } from '../src/data/fortunes.js';
import { tickAnimals, getAnimalStates, setAnimalEating, triggerLost, resolveLost, flockCenter, feedFlock, isIndoors } from './animals.js';
import {
  FIREWORKS, SKY_LANTERN_COST, SKY_LANTERN_MERIT, SKY_LANTERN_COOLDOWN_MS, SKY_LANTERN_WISH_MAX,
} from '../shared/game.js';
import type { BellHeard, FireworkShow, FireworkSize, SkyLantern } from '../shared/types.js';
import { clampCampus, expansionWaterBlocked, resolveExpansionWater } from '../shared/campus.js';
import { bindRitualSocket, ritualOnJoin, startRitualLoops, type RitualEnv, type RtSession } from './rituals.js';

// Lưới cuối, KHÔNG thay cho việc bắt lỗi ở từng handler (safeHandler bên dưới).
// unhandledRejection: chỉ log và tiếp tục chạy (game server phải sống vì người chơi).
// uncaughtException: trạng thái không xác định -> log rồi exit(1), Fly sẽ restart máy.
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[fatal] unhandledRejection:', reason instanceof Error ? (reason.stack ?? reason.message) : reason);
});
process.on('uncaughtException', (err: Error) => {
  console.error('[fatal] uncaughtException:', err?.stack ?? err);
  process.exit(1);
});

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

/** IP thật của client lấy từ header do proxy nền tảng đặt (Fly, Render); không có thì dùng địa chỉ socket. */
function clientIp(req: IncomingMessage): string {
  for (const name of ['fly-client-ip', 'true-client-ip', 'cf-connecting-ip']) {
    const v = req.headers[name];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return req.socket.remoteAddress ?? '?';
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.pathname.startsWith('/api/')) {
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });
    const ip = clientIp(req);
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
  last: Partial<Record<ActionKind | 'chat' | 'buy' | 'feedback' | 'sutra' | 'mg:moh' | 'mg:memory' | 'donate' | 'animal:feed' | 'fortune' | 'admin' | 'sky' | 'fw:small' | 'fw:large' | 'fw:dragon' | 'release' | 'bell', number>>;
  /** phòng gần nhất để đếm nhiệm vụ 'room' */
  lastRoom?: string;
  /** resume token cua tab (sessionStorage) de khoi phuc vi tri khi vao lai */
  resume?: string;
  /** mốc bắt đầu vòng lần hạt đang dở (chỉ trong bộ nhớ) */
  beadStart?: number;
  questCache?: { rows: Awaited<ReturnType<typeof db.questRows>>; at: number };
  /** số giây thiền cộng dồn trong ngày VN; null/undefined khi chưa join */
  med?: MeditationDayState;
  /** hàng đợi flush tuần tự, tránh 2 lần ghi chồng lên nhau */
  medFlush?: Promise<void>;
  /** khóa ngày của haloLevel đang giữ */
  haloDay?: string;
  /** tầng hào quang thiền trong ngày */
  haloLevel?: 0 | 1 | 2;
  /** trạng thái nghi lễ/khóa thiền nhóm (server/rituals.ts) */
  rt?: RtSession['rt'];
}
const sessions = new Map<string, Session>();
const meditationDepartures = new Map<number, Promise<void>>();
const roomChat = new Map<string, ChatMessage[]>();
const roomLanterns = new Map<string, Lantern[]>();
const roomMinutes = new Map<string, number>();
/** phòng -> mốc hết màn pháo hoa đang chiếu (khoá 1 màn/phòng) */
const roomFireworkUntil = new Map<string, number>();
const lastJoinAnnounce = new Map<number, number>(); // pid -> timestamp ms cua lan thong bao vao chua gan nhat
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
/** Quầy -> vendor đứng quầy (để biết quầy nào vắng khi vendor đi tụng). */
const VENDOR_STALL: Record<string, string> = { stall_fruit: 'npc15', stall_cake: 'npc16', stall_tea: 'npc17', stall_pho: 'npc31', stall_trada: 'npc32', stall_incense: 'npc18', stall_phongsinh: 'npc30', stall_com: 'npc33', stall_chim: 'npc34', stall_trada2: 'npc36' };
/** Món bán bởi vendor ngoài chợ (chỉ những món này mới bị chặn khi vendor vắng; hạt giống npc38 không bao giờ bị chặn). */
const ITEM_VENDORS: Record<string, string[]> = { pho_chay: ['npc31'], tra_da: ['npc32', 'npc36'], com_chay: ['npc33'], chim_phong_sinh: ['npc34'], ca_phong_sinh: ['npc34'], thuc_an_chim: ['npc34'] };
const VENDOR_AWAY_MSG = (name: string) => `Nghỉ bán, vui lòng đợi — ${name} đang đi tụng kinh, quay lại sau giờ tụng nhé`;
/** Vendor có đang đi tụng kinh không (mode toChant/chanting trong phòng này). */
function vendorAway(room: string, npcId: string): boolean {
  const n = npcRoom(room).npcs.find((e) => e.def.id === npcId);
  return !!n && (n.mode === 'toChant' || n.mode === 'chanting');
}
function vendorName(room: string, npcId: string): string {
  return npcRoom(room).npcs.find((e) => e.def.id === npcId)?.def.name ?? 'Người bán';
}
const clean = (s: unknown, max: number) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
/** Như clean nhưng gộp mọi khoảng trắng thành 1 dấu cách — lời nguyện đèn trời hiện trên 1 dòng feed. */
const cleanLine = (s: unknown, max: number) => clean(String(s ?? '').replace(/\s+/g, ' '), max);
const cleanColor = (c: unknown) => (/^#[0-9a-fA-F]{6}$/.test(String(c)) ? String(c) : '#d99a1e');
const roomSessions = (room: string) => [...sessions.values()].filter((s) => s.room === room);
const roomOk = (id: string) => ROOMS.some((r) => r.id === id);
function npcStates(room: string): PlayerState[] {
  const nr = npcRoom(room);
  resumeNpcs(nr);
  return presentNpcStates(nr);
}

async function refreshQuestGuard(room: string): Promise<void> {
  const list = roomSessions(room);
  if (!list.length) {
    // Room trống: không chạm DB, không báo cáo breaker.
    // Vẫn xóa guard cũ (hành vi gốc luôn gán lại tập rỗng).
    const nr = npcRoom(room);
    if (nr.questGuard.size) nr.questGuard = new Set<string>();
    return;
  }
  if (!db.dbBackgroundAllowed()) return; // breaker đang mở / probe đã bị chiếm
  try {
    const next = new Set<string>();
    for (const s of list) {
      const rows = await cachedQuestRows(s);
      const byId = new Map(rows.map((r) => [r.quest_id, r]));
      for (const q of [...NPC_QUESTS, ...CHAIN_QUESTS].filter((x) => !x.id.startsWith('dq_') || dqTodayIds().includes(x.id))) {
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
    db.dbBackgroundResult(); // chỉ báo thành công sau khi đã gọi DB thật
  } catch (e) {
    db.dbBackgroundResult(e);
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
async function questList(pid: number, s?: Session): Promise<QuestState[]> {
  const rows = new Map((await (s ? cachedQuestRows(s) : db.questRows(pid))).map((r) => [r.quest_id, r]));
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
  return [...QUESTS, ...WEEKLY_QUESTS, ...NPC_QUESTS.filter((q) => !q.id.startsWith('dq_') || dqTodayIds().includes(q.id)), ...visibleChain].map(map);
}
const QUEST_CACHE_TTL_MS = 30_000;
async function cachedQuestRows(s: Session) {
  const c = s.questCache;
  if (c && Date.now() - c.at < QUEST_CACHE_TTL_MS) return c.rows;
  const rows = await db.questRows(s.pid);
  s.questCache = { rows, at: Date.now() };
  return rows;
}
function invalidateQuestCache(pid: number) {
  for (const x of sessions.values()) if (x.pid === pid) delete x.questCache;
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
  const row = (rows ?? (await cachedQuestRows(s))).find((r) => r.quest_id === q.id);
  if (!row || row.claimed) return false; // not accepted or already claimed
  const progress = row.progress ?? 0;
  if (progress >= q.target) return false;
  const steps = (q as any).steps as QuestEvent[] | undefined;
  if (steps) {
    if (steps[progress] !== ev) return false;
  } else if (q.event !== ev) {
    return false;
  }
  if (['bow', 'incense', 'chant', 'sutra', 'visit', 'lantern'].includes(ev) && !inZone((q as any).zone, s.state.x, s.state.z)) return false;
  await db.bumpQuest(s.pid, q.id, q.target, by);
  invalidateQuestCache(s.pid);
  return true;
}
async function pushProfile(s: Session) {
  const p = await db.getProfile(s.pid);
  if (!p) return;
  s.state.merit = p.merit;
  s.state.accessory = p.accessory;
  s.socket.emit('profile', p);
}
async function pushQuests(s: Session) { s.socket.emit('quests', await questList(s.pid, s)); }
async function questEvent(s: Session, ev: QuestEvent, by = 1) {
  for (const q of [...QUESTS, ...WEEKLY_QUESTS]) if (q.event === ev) await db.bumpQuest(s.pid, q.id, q.target, by);
  invalidateQuestCache(s.pid);
  const rows = await cachedQuestRows(s);
  for (const q of [...NPC_QUESTS, ...CHAIN_QUESTS]) await advanceNpcQuest(s, q as AnyQuestDef, ev, by, rows);
  await pushQuests(s);
}
function pushSys(room: string, text: string) {
  const sysMsg: ChatMessage = { id: seq++, name: '', text, t: Date.now(), sys: true };
  const arr = roomChat.get(room) ?? [];
  arr.push(sysMsg);
  if (arr.length > 100) arr.shift();
  roomChat.set(room, arr);
  io.to(room).emit('chat', sysMsg);
}

/** Cộng thưởng + đếm quest 'merit' (nhiệm vụ tuần tích công đức). */
async function grantRewards(s: Session, merit: number, coins: number, opts?: { skipAdd?: boolean; beforeMerit?: number }) {
  const before = opts?.beforeMerit ?? (await db.getWallet(s.pid))?.merit ?? 0;
  const lvBefore = levelOf(before);
  if (!opts?.skipAdd) await db.addRewards(s.pid, merit, coins);
  await questEvent(s, 'merit', merit);
  const after = (await db.getWallet(s.pid))?.merit ?? 0;
  const lvAfter = levelOf(after);
  if (lvAfter > lvBefore && (await db.claimLevelReward(s.pid, lvAfter))) {
    await db.addRewards(s.pid, LEVEL_BONUS.meritPerLevel * (lvAfter - lvBefore), LEVEL_BONUS.coinsPerLevel * (lvAfter - lvBefore));
    s.socket.emit('level:bonus', { level: lvAfter, coins: LEVEL_BONUS.coinsPerLevel * (lvAfter - lvBefore), merit: LEVEL_BONUS.meritPerLevel * (lvAfter - lvBefore) });
    pushSys(s.room, `🎉 Phật tử ${s.state.name} vừa lên cấp ${lvAfter}!`);
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

/**
 * Số giây thiền đã cộng dồn HÔM NAY của phiên: phần đã ghi DB + phần đang giữ trong bộ nhớ.
 * Toàn bộ do máy chủ tính từ đồng hồ máy chủ; client không gửi elapsed.
 */
function meditationSecToday(s: Session, today = dayKeyICT()): number {
  return s.med ? medTotalSec(s.med, today) : 0;
}

function meditationDailyInfo(s: Session) {
  const dayKey = dayKeyICT();
  return { dayKey, sec: meditationSecToday(s, dayKey), level: (s.haloLevel ?? 0) as 0 | 1 | 2 };
}

/**
 * Ghi số giây thiền đang giữ trong bộ nhớ xuống `halo_daily`. Tuần tự theo phiên (không có
 * 2 lần ghi chồng nhau) và idempotent ở DB (MAX), nên retry hay ghi trùng đều không làm
 * tăng số giây. Kết quả của ngày cũ bị bỏ nếu đã qua ngày mới trong lúc ghi.
 */
function flushMeditation(s: Session, st = s.med): Promise<void> {
  const run = async () => {
    if (!st) return;
    const snap = flushBegin(st);
    if (!snap) return;
    try {
      const row = await db.accrueMeditationDaily(s.pid, snap.total, snap.day);
      flushCommit(st, snap, row.sec);
    } catch (e) {
      flushAbort(st, snap);   // trả số giây về hàng chờ: lần flush sau ghi tiếp, không mất giây
      throw e;
    }
  };
  const next = (s.medFlush ?? Promise.resolve()).then(run, run);
  s.medFlush = next.catch(() => { /* lỗi đã được báo cho caller */ });
  return next;
}

/**
 * Kết thúc phiên thiền (đứng dậy / mất kết nối / bị kick / đổi phòng / qua ngày):
 * ngắt mốc cộng rồi chốt phần giây còn trong bộ nhớ xuống DB để lần sau cộng tiếp.
 */
async function persistMeditation(s: Session, st: MeditationDayState, room: string): Promise<void> {
  try {
    await flushMeditation(s, st);
    await syncHaloTier(s, st, room);
  } catch (e) {
    console.warn('[meditate] lưu thời gian:', (e as Error).message);
  }
}

function updateMeditationClock(s: Session, now: number, sitting: boolean): Promise<void> | undefined {
  const today = dayKeyICT(new Date(now));
  let st = s.med ??= newMeditationDay(today);
  let saveOld: Promise<void> | undefined;
  if (st.day !== today) {
    const previous = st;
    st = s.med = rollMeditationDay(previous, today);
    saveOld = persistMeditation(s, previous, s.room);
    const hadHalo = (s.haloLevel ?? 0) > 0;
    s.haloDay = today; s.haloLevel = 0; s.state.halo = 0;
    if (hadHalo) {
      s.socket.emit('halo', { level: 0, reason: 'reset' });
      s.socket.to(s.room).emit('player:halo', { id: s.state.id, level: 0 });
    }
    s.socket.emit('meditation:daily', meditationDailyInfo(s));
  }
  if (sitting || st.creditAt !== undefined) creditSitting(st, now);
  if (!sitting) pauseSitting(st);
  return saveOld;
}

async function endMeditationSession(s: Session, now = Date.now()): Promise<void> {
  const old = updateMeditationClock(s, now, false);
  await persistMeditation(s, s.med!, s.room);
  await old;
  if (sessions.get(s.socket.id) === s) s.socket.emit('meditation:daily', meditationDailyInfo(s));
}

function setSessionAnim(s: Session, anim: Anim, now = Date.now()): void {
  const wasSitting = s.state.anim === 'sit';
  s.state.anim = anim;
  if (anim === 'sit' && !wasSitting) void updateMeditationClock(s, now, true);
  else if (wasSitting && anim !== 'sit') void endMeditationSession(s, now);
}

/**
 * Cấp hào quang theo TỔNG cộng dồn trong ngày. Chỉ nâng tầng, không hạ; ghi DB bằng
 * MAX nên nhiều lần gọi (tick, retry, hai thiết bị) vẫn chỉ phát 1 event mỗi mốc.
 */
async function syncHaloTier(s: Session, st: MeditationDayState, room: string): Promise<void> {
  const target = haloForSec(st.baseSec);
  if (target === 0 || (s.haloDay === st.day && target <= (s.haloLevel ?? 0))) return;
  const granted = await db.raiseHaloLevel(s.pid, target, st.day);
  if (s.med !== st || st.day !== dayKeyICT() || target <= (s.haloLevel ?? 0)) return;
  s.haloLevel = target;
  s.haloDay = st.day;
  s.state.halo = target;
  if (granted) s.socket.emit('halo', { level: target, reason: 'grant' });
  if (sessions.get(s.socket.id) === s) s.socket.to(room).emit('player:halo', { id: s.state.id, level: target });
  if (granted && target === 2) pushSys(room, `🧘 Phật tử ${s.state.name} vừa thiền đủ 20 phút, hào quang lớn đã hiện!`);
}

async function rankings(): Promise<{ weekly: RankRow[]; all: RankRow[] }> {
  const f = (r: { name: string; merit: number }): RankRow => ({ name: r.name, merit: r.merit, level: levelOf(r.merit) });
  return { weekly: (await db.topWeekly()).map(f), all: (await db.topAllTime()).map(f) };
}

function leaveRoom(s: Session) {
  s.socket.leave(s.room);
  s.socket.to(s.room).emit('player:leave', s.state.id);
}

const ritualEnv: RitualEnv = {
  io,
  sessions,
  afterReward: (s, merit, coins, beforeMerit) => grantRewards(s as Session, merit, coins, { skipAdd: true, beforeMerit }),
  syncProfile: (s) => pushProfile(s as Session),
  pushSys,
  npcPos: (s, npcId) => npcPos(s as Session, npcId),
  groupHalo: async (s0) => {
    const s = s0 as Session;
    const today = dayKeyICT();
    if (s.haloDay === today && (s.haloLevel ?? 0) >= 1) return;
    const granted = await db.raiseHaloLevel(s.pid, 1, today);
    s.haloLevel = 1;
    s.haloDay = today;
    s.state.halo = s.haloLevel;
    if (granted) s.socket.emit('halo', { level: s.haloLevel, reason: 'grant' });
    s.socket.to(s.room).emit('player:halo', { id: s.state.id, level: s.haloLevel });
  },
  badges: async (s) => { await maybeAwardTitles(s as Session); },
};

io.use((socket, next) => {
  db.playerIdByToken(socket.handshake.auth?.token).then((pid) => {
    if (!pid) return next(new Error('unauthorized'));
    socket.data.pid = pid;
    next();
  }).catch(() => next(new Error('unauthorized')));
});

const RESUME_GRACE_MS = 10 * 60 * 1000;
const lastPos = new Map<number, { x: number; z: number; ry: number; room: string; resume: string; at: number }>();

function saveTombstone(s: Session): void {
  if (!s.resume) return;
  lastPos.set(s.pid, { x: s.state.x, z: s.state.z, ry: s.state.ry, room: s.room, resume: s.resume, at: Date.now() });
}

async function requireAdmin(s: Session | undefined): Promise<boolean> {
  if (!s) return false;
  return await db.isAdmin(s.pid);
}

/** Bọc một socket listener: mọi lỗi throw/reject đều được bắt, log, và trả ack lỗi
 * đúng shape cho client (không bao giờ để thành unhandled rejection giết process).
 * Handler không có ack thì chỉ log. Ack lỗi của chính nó cũng không được làm chết process. */
function safeHandler(event: string, fn: (...args: any[]) => unknown) {
  return async function (this: unknown, ...args: any[]) {
    try {
      await fn.apply(this, args);
    } catch (e) {
      console.warn(`[socket] ${event} lỗi: ${e instanceof Error ? e.message : String(e)}`);
      const ack = args[args.length - 1];
      if (typeof ack === 'function') {
        try {
          if (event === 'rank:get') ack({ weekly: [], all: [] });
          else if (event === 'donors:get') ack([]);
          else ack({ ok: false, error: 'Lỗi máy chủ, thử lại sau' });
        } catch { /* ack lỗi cũng không được làm chết process */ }
      }
    }
  };
}

io.on('connection', (socket) => {
  const pid: number = socket.data.pid;
  // Mọi listener đăng ký sau đây tự động đi qua safeHandler (file không dùng socket.once/off).
  const origOn = socket.on.bind(socket);
  (socket as any).on = (event: string, listener: (...args: any[]) => unknown) =>
    origOn(event as any, safeHandler(event, listener) as any);
  // one live connection per account
  for (const other of sessions.values()) {
    if (other.pid === pid) {
      saveTombstone(other);
      other.socket.emit('kicked'); other.socket.disconnect(true);
    }
  }

  socket.on('join', async (p: { name?: string; outfit?: Outfit; color?: string; room?: string; resume?: string }, ack?: (r: { ok: boolean; error?: string }) => void) => {
    await meditationDepartures.get(pid);
    const prof = await db.getProfile(pid);
    if (!prof) return socket.disconnect(true);
    const old = sessions.get(socket.id);
    // Chốt phiên thiền cũ TRƯỚC khi đọc số giây cộng dồn, tránh đọc phải số liệu cũ
    // (mất vài giây cuối) khi người chơi join lại cùng socket.
    if (old) {
      old.state.anim = 'idle';
      await endMeditationSession(old);
    }
    const daily = await db.getMeditationDaily(pid);

    let room = roomOk(String(p?.room)) ? String(p.room) : ROOMS[0].id;
    if (roomSessions(room).filter((s) => s.pid !== pid).length >= ROOM_CAPACITY) {
      const alt = roomList().find((r) => r.online < r.capacity);
      if (!alt) {
        ack?.({ ok: false, error: 'Các chùa đều đã đầy' });
        return socket.emit('join:error', 'Các chùa đều đã đầy');
      }
      room = alt.id;
    }
    const name = clean(p?.name, 24) || prof.name;
    const outfit = OUTFITS.includes(p?.outfit as Outfit) ? (p!.outfit as Outfit) : prof.outfit;
    const color = cleanColor(p?.color ?? prof.color);
    try {
      await db.saveLook(pid, name, outfit, color);
    } catch {
      ack?.({ ok: false, error: 'Không lưu được nhân vật' });
      return;
    }
    if (!socket.connected) return;
    if (old) leaveRoom(old);
    const today = dayKeyICT();
    const haloLevel = daily.dayKey === today ? daily.level : 0;
    ack?.({ ok: true });

    const saved = lastPos.get(pid);
    lastPos.delete(pid);
    const resume = typeof p?.resume === 'string' && p.resume.length >= 8 && p.resume.length <= 64 ? p.resume : undefined;
    const from = saved && resume !== undefined && resume === saved.resume
      && Date.now() - saved.at < RESUME_GRACE_MS && room === saved.room ? saved : undefined;
    const spawn = { x: from ? from.x : (Math.random() - 0.5) * 6, z: from ? from.z : 28 + Math.random() * 3 };
    clampCampus(spawn);
    resolveExpansionWater(spawn);

    const state: PlayerState = {
      id: socket.id, name, outfit, color, accessory: prof.accessory,
      x: spawn.x,
      z: spawn.z,
      ry: from ? from.ry : Math.PI, anim: 'idle', merit: prof.merit,
      title: prof.title ?? defaultTitle(prof.titles),
      pid,
      halo: haloLevel,
    };
    const s: Session = old ?? { pid, state, room, socket, last: {} };
    s.state = state;
    s.room = room;
    s.resume = resume;
    // Số giây thiền đã cộng dồn đọc lại từ DB: mất kết nối/đăng nhập lại không làm mất tiến độ.
    s.haloDay = today; s.haloLevel = haloLevel;
    const medStart = newMeditationDay(today);
    medStart.baseSec = daily.dayKey === today ? daily.sec : 0;
    s.med = medStart;
    s.medFlush = undefined;
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
    const now = Date.now();
    if (now - (lastJoinAnnounce.get(pid) ?? 0) >= 300_000) {
      lastJoinAnnounce.set(pid, now);
      pushSys(room, `🙏 Phật tử ${state.name} vừa vào chùa.`);
    }
    await pushProfile(s);
    await maybeAwardTitles(s, false);
    await pushQuests(s);
    socket.emit('checkin', await db.checkinState(pid));
    socket.emit('mail', { unread: await db.mailUnread(pid) });
    socket.emit('spin', { used: (await db.minigameCount(pid, 'quay')) > 0 } satisfies SpinState);
    socket.emit('beads', { rewarded: await db.minigameCount(pid, 'lanhat') } satisfies BeadsState);
    socket.emit('boost', meritBoost(new Date()));
    socket.emit('stats', await currentStatsState(pid));
    socket.emit('halo', { level: haloLevel, reason: 'join' });
    socket.emit('meditation:daily', meditationDailyInfo(s));
    void ritualOnJoin(ritualEnv, s).catch((e) => console.warn('[ritual] join:', e));
    // nhiệm vụ "viếng 3 chùa": đếm mỗi lần vào một phòng khác phòng gần nhất
    if (s.lastRoom !== room) { s.lastRoom = room; await questEvent(s, 'room'); }
  });

  const me = () => sessions.get(socket.id);
  bindRitualSocket(ritualEnv, socket, me);

  socket.on('move', async (m: { x: number; z: number; ry: number; anim: Anim }) => {
    const s = me();
    if (!s || !Number.isFinite(m?.x) || !Number.isFinite(m?.z)) return;
    const next = { x: Math.max(-MAP_HALF, Math.min(MAP_HALF, m.x)), z: Math.max(MAP_Z_MIN, Math.min(MAP_Z_MAX, m.z)) };
    clampCampus(next);
    if (expansionWaterBlocked(next.x, next.z)) return;
    s.state.x = next.x;
    s.state.z = next.z;
    s.state.ry = Number.isFinite(m.ry) ? m.ry : 0;
    const now = Date.now();
    if (ANIMS.includes(m.anim)) setSessionAnim(s, m.anim, now);
    if (now - (lastVisitCheck.get(s) ?? 0) >= 1000) {
      lastVisitCheck.set(s, now);
      const rows = await cachedQuestRows(s);
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
    const rule = Object.hasOwn(ACTION_RULES, kind) ? ACTION_RULES[kind] : undefined;
    if (!s || !rule) return;
    const now = Date.now();
    if (now - (s.last[kind] ?? 0) < rule.cooldownMs) return;
    s.last[kind] = now;

    if (kind === 'palms' || kind === 'beads') {
      setSessionAnim(s, kind);
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
    setSessionAnim(s, kind);
    io.to(s.room).emit('player:action', { id: s.state.id, kind });
    if (kind === 'lantern') {
      const l: Lantern = { id: seq++, pid: s.pid, name: s.state.name, wish: clean(wish, 120) || 'Cầu bình an', t: now, x: s.state.x, z: s.state.z };
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

  // ---- Đèn trời: 15 xu, +2 công đức, 60s/người, chỉ ngoài sân ----
  socket.on('sky:release', async (wish: unknown, cb?: (r: { ok: boolean; coins?: number; merit?: number; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; coins?: number; merit?: number; error?: string }) => { if (typeof cb === 'function') cb(r); };
    if (!s) return reply({ ok: false, error: 'Chưa vào chùa' });
    const now = Date.now();
    if (now - (s.last.sky ?? 0) < SKY_LANTERN_COOLDOWN_MS) return reply({ ok: false, error: 'Thả đèn trời từ từ thôi, thử lại sau nhé' });
    if (isIndoors(s.state.x, s.state.z)) return reply({ ok: false, error: 'Ra sân chùa rồi hãy thả đèn' });
    const paid = await db.spendCoins(s.pid, SKY_LANTERN_COST);
    if (!paid) return reply({ ok: false, error: 'Không đủ xu' });
    s.last.sky = now;
    const l: SkyLantern = {
      id: seq++, pid: s.pid, name: s.state.name,
      wish: cleanLine(wish, SKY_LANTERN_WISH_MAX) || 'Cầu bình an',
      x: s.state.x, z: s.state.z, t: now,
    };
    io.to(s.room).emit('sky:lantern', l);
    await grantRewards(s, SKY_LANTERN_MERIT, 0);
    await countStatSafe(s, 'lanterns');
    const p = await db.getWallet(s.pid);
    reply({ ok: true, coins: p?.coins ?? 0, merit: SKY_LANTERN_MERIT });
    await pushProfile(s);
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
    setSessionAnim(s, 'chant');
    io.to(s.room).emit('player:action', { id: s.state.id, kind: 'chant' });
    const finalMerit = Math.round(merit * meritBoost(new Date()).mult);
    await grantRewards(s, finalMerit, 0);
    await questEvent(s, 'chant');
    await questEvent(s, 'sutra');
    await countStatSafe(s, 'chants');
    cb?.({ ok: true, merit: finalMerit });
  });

  const buyItem = async (itemId: string, qty: number) => {
    const item = Object.hasOwn(ITEM_BY_ID, String(itemId)) ? ITEM_BY_ID[String(itemId)] : undefined;
    if (!item) return { ok: false as const, error: 'Vật phẩm không tồn tại' };
    // Hạt tốt chỉ có từ thu hoạch — không bán ở đâu cả (giá 0 nên phải chặn ở server, không chỉ ẩn UI).
    if (item.category === 'hat_giong' && item.price === 0) return { ok: false as const, error: 'Hạt tốt chỉ có từ thu hoạch' };
    const lvl = levelOf((await db.getWallet(pid))?.merit ?? 0);
    if (item.minLevel && lvl < item.minLevel) return { ok: false as const, error: `Cần cấp ${item.minLevel} để mua` };
    if ((item.kind === 'accessory' || item.kind === 'decor') && (await db.itemQty(pid, item.id)) > 0) return { ok: false as const, error: 'Bạn đã sở hữu' };
    const cost = item.price * qty;
    if (!(await db.purchase(pid, item.id, qty, cost))) return { ok: false as const, error: 'Không đủ xu' };
    return { ok: true as const };
  };

  socket.on('shop:buy', async (itemId: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const away = Object.hasOwn(ITEM_VENDORS, String(itemId)) ? ITEM_VENDORS[String(itemId)] : undefined;
    if (away && away.length > 0 && away.every((v) => vendorAway(s.room, v))) {
      return cb?.({ ok: false, error: VENDOR_AWAY_MSG(away.map((v) => vendorName(s.room, v)).join(', ')) });
    }
    const r = await buyItem(itemId, 1);
    if (r.ok) { await questEvent(s, 'buy'); if (itemId === 'chim_phong_sinh') await questEvent(s, 'buyphongsinh', 1); if (itemId === 'thuc_an_chim') await questEvent(s, 'buyfood', 1); await pushProfile(s); }
    cb?.(r.ok ? { ok: true } : { ok: false, error: r.error });
  });

  /** Mua 5 món consumable: giá = 5 × giá lẻ. */
  socket.on('shop:buy5', async (itemId: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const away = Object.hasOwn(ITEM_VENDORS, String(itemId)) ? ITEM_VENDORS[String(itemId)] : undefined;
    if (away && away.length > 0 && away.every((v) => vendorAway(s.room, v))) {
      return cb?.({ ok: false, error: VENDOR_AWAY_MSG(away.map((v) => vendorName(s.room, v)).join(', ')) });
    }
    const item = Object.hasOwn(ITEM_BY_ID, String(itemId)) ? ITEM_BY_ID[String(itemId)] : undefined;
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
      const item = Object.hasOwn(ITEM_BY_ID, String(itemId)) ? ITEM_BY_ID[String(itemId)] : undefined;
      if (!item || item.kind !== 'accessory' || (await db.itemQty(pid, item.id)) < 1) return;
      await db.setAccessory(pid, item.id);
    }
    await pushProfile(s);
    io.to(s.room).emit('player:look', { id: s.state.id, accessory: s.state.accessory });
  });

  type QuestErrorCode = import('../shared/game').QuestErrorCode;
  socket.on('quest:accept', async (qid: string, cb?: (r: { ok: boolean; error?: string; code?: QuestErrorCode }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string; code?: QuestErrorCode }) => { if (typeof cb === 'function') cb(r); };
    const q = typeof qid === 'string' ? findQuestDef(qid) : undefined;
    if (!s || !q || !isNpcQuest(q)) return reply({ ok: false, error: 'Nhiệm vụ không hợp lệ' });
    if (q.id.startsWith('dq_') && !dqTodayIds().includes(q.id)) return reply({ ok: false, error: 'Việc này không phải việc hôm nay' });
    const rows = await cachedQuestRows(s);
    const byId = new Map(rows.map((r) => [r.quest_id, r]));
    const req = (q as any).requires as string | undefined;
    if (req && !byId.get(req)?.claimed) return reply({ ok: false, error: 'Chưa mở khóa nhiệm vụ này' });
    if (byId.has(q.id)) return reply({ ok: false, error: 'Đã nhận hoặc đã hoàn thành nhiệm vụ này', code: 'already_accepted' });
    await db.acceptQuest(s.pid, q.id);
    const steps = (q as any).steps as QuestEvent[] | undefined;
    if (steps?.[0] === 'talk' || (!steps && q.event === 'talk')) await db.bumpQuest(s.pid, q.id, q.target, 1);
    invalidateQuestCache(s.pid);
    if (q.id === 'nq_find_lost_pet') triggerLost(s.room);
    reply({ ok: true });
    await pushQuests(s);
    refreshQuestGuard(s.room).catch(() => {});
  });

  socket.on('quest:sweep', async (
    payload: { qid: string; point: { x: number; z: number } },
    cb?: (r: { ok: boolean; error?: string; progress?: number; code?: QuestErrorCode }) => void,
  ) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string; progress?: number; code?: QuestErrorCode }) => { if (typeof cb === 'function') cb(r); };
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
    if (set.has(key)) {
      const cur = await cachedQuestRows(s);
      return reply({ ok: false, error: 'Điểm này đã quét rồi', code: 'already_swept', progress: cur.find((r) => r.quest_id === q.id)?.progress ?? 0 });
    }
    const rows = await cachedQuestRows(s);
    const ok = await advanceNpcQuest(s, q, 'sweep', 1, rows);
    if (!ok) return reply({ ok: false, error: 'Chưa thể quét lúc này' });
    set.add(key);
    const progress = Math.min((rows.find((r) => r.quest_id === q.id)?.progress ?? 0) + 1, (q as any).target);
    reply({ ok: true, progress });
    await pushQuests(s);
  });

  socket.on('quest:feed', async (payload: { animalId: string }, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const defs = [findQuestDef('nq_feed_pets'), findQuestDef('dq_feed')].filter((x): x is AnyQuestDef => !!x && isNpcQuest(x));
    const animalId = payload && typeof payload.animalId === 'string' ? payload.animalId : undefined;
    const a = s && animalId ? getAnimalStates(s.room).find((x) => x.id === animalId) : undefined;
    if (!s || !defs.length || !a || (a.kind !== 'dog' && a.kind !== 'cat')) {
      return reply({ ok: false, error: 'Yêu cầu không hợp lệ' });
    }
    if (distTo(s, a.x, a.z) > 2.5) return reply({ ok: false, error: 'Bạn đứng quá xa' });
    const rows = await cachedQuestRows(s);
    let ok = false;
    for (const q of defs) if (await advanceNpcQuest(s, q, 'feed', 1, rows)) ok = true;
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
    const rows = await cachedQuestRows(s);
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
    const rows = await cachedQuestRows(s);
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
    const vid = VENDOR_STALL[stallId];
    if (vid && vendorAway(s.room, vid)) return reply({ ok: false, error: VENDOR_AWAY_MSG(vendorName(s.room, vid)) });
    const rows = await cachedQuestRows(s);
    const byId = new Map(rows.map((r) => [r.quest_id, r]));
    const match = [...NPC_QUESTS, ...CHAIN_QUESTS].find((q) => {
      const row = byId.get(q.id);
      if (!row || row.claimed) return false;
      const steps = (q as any).steps as QuestEvent[] | undefined;
      const cur = steps ? steps[row.progress ?? 0] : q.event;
      return cur === 'marketbuy' && (q as any).stall === stallId;
    });
    if (!match) return reply({ ok: false, error: 'Chưa có nhiệm vụ cần mua món này' });
    if (!(await db.spendCoins(s.pid, 10))) return reply({ ok: false, error: 'Không đủ xu' });
    await advanceNpcQuest(s, match as AnyQuestDef, 'marketbuy', 1, rows);
    reply({ ok: true });
    await pushProfile(s);
    await pushQuests(s);
  });

  // ---- Pháo hoa: chỉ ngoài sân, mỗi phòng chạy một màn tại một thời điểm ----
  socket.on('firework:launch', async (size: unknown, cb?: (r: { ok: boolean; coins?: number; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; coins?: number; error?: string }) => { if (typeof cb === 'function') cb(r); };
    if (!s) return reply({ ok: false, error: 'Chưa vào chùa' });
    if (size !== 'small' && size !== 'large' && size !== 'dragon') return reply({ ok: false, error: 'Loại pháo hoa không hợp lệ' });
    const kind = size as FireworkSize;
    const cfg = FIREWORKS[kind];
    const lastKey = kind === 'small' ? 'fw:small' : kind === 'large' ? 'fw:large' : 'fw:dragon';
    const now = Date.now();
    if (now - (s.last[lastKey] ?? 0) < cfg.cooldownMs) return reply({ ok: false, error: 'Từ từ thôi, thử lại sau nhé' });
    if ((roomFireworkUntil.get(s.room) ?? 0) > now) return reply({ ok: false, error: 'Đang có pháo hoa, chờ chút nhé' });
    const until = now + cfg.lockMs;
    roomFireworkUntil.set(s.room, until);
    const unlock = () => { if (roomFireworkUntil.get(s.room) === until) roomFireworkUntil.delete(s.room); };
    if (isIndoors(s.state.x, s.state.z)) { unlock(); return reply({ ok: false, error: 'Ra sân chùa rồi hãy bắn pháo hoa' }); }
    const paid = await db.spendCoins(s.pid, cfg.cost);
    if (!paid) { unlock(); return reply({ ok: false, error: 'Không đủ xu' }); }
    s.last[lastKey] = now;
    const show: FireworkShow = { id: seq++, name: s.state.name, size: kind, x: s.state.x, z: s.state.z, t: now };
    io.to(s.room).emit('firework:show', show);
    if (kind === 'dragon') {
      const msg: ChatMessage = { id: seq++, name: '', text: `🎆 ${s.state.name} vừa bắn pháo hoa rồng phượng!`, t: now, sys: true };
      for (const room of ROOMS) {
        const arr = roomChat.get(room.id) ?? [];
        arr.push(msg);
        if (arr.length > 100) arr.shift();
        roomChat.set(room.id, arr);
        io.to(room.id).emit('chat', msg);
      }
    }
    const p = await db.getWallet(s.pid);
    reply({ ok: true, coins: p?.coins ?? 0 });
    await pushProfile(s);
  });

  socket.on('bell:ring', (cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    if (!s) return reply({ ok: false, error: 'Chưa vào chùa' });
    const now = Date.now();
    if (now - (s.last.bell ?? 0) < 30_000) return reply({ ok: false, error: 'Từ từ thôi, thử lại sau nhé' });
    if (distTo(s, BELL.x, BELL.z) > 7) return reply({ ok: false, error: 'Bạn đứng quá xa tháp chuông' });
    s.last.bell = now;
    pushSys(s.room, `🔔 Phật tử ${s.state.name} vừa thỉnh chuông!`);
    const heard: BellHeard = { id: seq++, sid: s.state.id };
    io.to(s.room).emit('bell:heard', heard);
    reply({ ok: true });
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
    const before = (await db.getWallet(s.pid))?.merit ?? 0;
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
      pushSys(s.room, `🎉 Phật tử ${s.state.name} vừa lên cấp ${lvAfter}!`);
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
    const now = Date.now();
    if (now - (s.last.release ?? 0) < 2000) return cb?.({ ok: false, error: 'Đang xử lý, thử lại sau' });
    s.last.release = now;
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

  // ---- Vườn Cây (trồng cây) ----
  // Lấy trạng thái vườn mới nhất; bump quest 'grow' cho các luống vừa lên stage 4
  // (grow_counted đã set trong DB nên chỉ bump được từ `grew` của chính lần gọi này).
  async function afterGardenOp(s: Session, grew?: number[]): Promise<GardenPlotState[]> {
    if (grew?.length) await questEvent(s, 'grow');
    const { states } = await listGardenRows(s.pid, Date.now());
    return states;
  }

  socket.on('garden:list', async (cb?: (r: { ok: boolean; states?: GardenPlotState[]; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const { states, grewTo4Plots } = await listGardenRows(s.pid, Date.now());
    if (grewTo4Plots.length) await questEvent(s, 'grow');
    // Hạt sồi đầu tiên: tặng 1 lần qua mail khi lần đầu mở vườn
    if (!(await gardenSeedGiftSent(s.pid))) {
      await db.sendMail(s.pid, 'garden_seed', 'Hạt sồi đầu tiên', 'Chào mừng thí chủ đến Vườn Cây! Tặng thí chủ 1 hạt sồi, gieo thử vào luống trống rồi tưới nước nhiều lần cho cây lớn nhé.', { merit: 0, coins: 0, items: { hat_soi: 1 } });
    }
    cb?.({ ok: true, states });
  });

  socket.on('garden:plant', async (p: { plot?: number; seed?: string }, cb?: (r: { ok: boolean; states?: GardenPlotState[]; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const plot = Number(p?.plot);
    const seedItem = String(p?.seed ?? '');
    const parsed = gardenSeedOf(seedItem);
    if (!parsed) return cb?.({ ok: false, error: 'Loại hạt không hợp lệ' });
    const { species, quality } = parsed;
    const def = GARDEN_PLOTS.find((d) => d.id === plot);
    if (!def) return cb?.({ ok: false, error: 'Luống không hợp lệ' });
    if (distTo(s, def.x, def.z) > 4) return cb?.({ ok: false, error: 'Bạn đứng quá xa luống' });
    if ((await db.itemQty(pid, seedItem)) < 1) return cb?.({ ok: false, error: 'Bạn không có hạt giống này' });
    const r = await plantGardenRow(pid, plot, species, quality, Date.now());
    if (!r.ok) {
      if (r.grew?.length) await questEvent(s, 'grow');
      return cb?.({ ok: false, error: r.error });
    }
    await db.addItem(pid, seedItem, -1);
    await questEvent(s, 'plant');
    const states = await afterGardenOp(s, r.grew);
    await pushProfile(s);
    cb?.({ ok: true, states });
  });

  socket.on('garden:water', async (p: { plot?: number }, cb?: (r: { ok: boolean; states?: GardenPlotState[]; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const plot = Number(p?.plot);
    const def = GARDEN_PLOTS.find((d) => d.id === plot);
    if (!def) return cb?.({ ok: false, error: 'Luống không hợp lệ' });
    if (distTo(s, def.x, def.z) > 4) return cb?.({ ok: false, error: 'Bạn đứng quá xa luống' });
    const r = await waterGardenRow(pid, plot, Date.now());
    if (!r.ok) {
      if (r.grew?.length) await questEvent(s, 'grow');
      return cb?.({ ok: false, error: r.error });
    }
    await questEvent(s, 'water');
    const states = await afterGardenOp(s, r.grew);
    cb?.({ ok: true, states });
  });

  socket.on('garden:harvest', async (p: { plot?: number }, cb?: (r: { ok: boolean; states?: GardenPlotState[]; error?: string; merit?: number; coins?: number; seeds?: number; goodSeeds?: number }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const plot = Number(p?.plot);
    const def = GARDEN_PLOTS.find((d) => d.id === plot);
    if (!def) return cb?.({ ok: false, error: 'Luống không hợp lệ' });
    if (distTo(s, def.x, def.z) > 4) return cb?.({ ok: false, error: 'Bạn đứng quá xa luống' });
    const r = await harvestGardenRow(pid, plot, Date.now());
    if (!r.ok) {
      if (r.grew?.length) await questEvent(s, 'grow');
      return cb?.({ ok: false, error: r.error });
    }
    // Thu hoạch: +15 công đức + 1–2 hạt (mỗi hạt 25% là hạt TỐT); cây hạt tốt thêm 15 xu, cây thường 0 xu.
    const quality = r.quality;
    const coins = quality === 'good' ? GARDEN_GOOD_HARVEST_COINS : 0;
    const seeds = 1 + Math.floor(Math.random() * 2); // rơi 1-2 hạt cùng loại
    let goodSeeds = 0;
    for (let i = 0; i < seeds; i++) if (Math.random() < GARDEN_GOOD_CHANCE) goodSeeds++;
    const normalSeeds = seeds - goodSeeds;
    await grantRewards(s, GARDEN_HARVEST_MERIT, coins);
    if (normalSeeds > 0) await db.addItem(pid, GARDEN_SEEDS[r.species].item, normalSeeds);
    if (goodSeeds > 0) await db.addItem(pid, GARDEN_GOOD_SEEDS[r.species].item, goodSeeds);
    await questEvent(s, 'harvest');
    const states = await afterGardenOp(s, r.grew);
    await pushProfile(s);
    cb?.({ ok: true, states, merit: GARDEN_HARVEST_MERIT, coins, seeds, goodSeeds });
  });

  socket.on('quest:claim', async (qid: string, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const q = typeof qid === 'string' ? findQuestDef(qid) : undefined;
    if (!s || !q) return reply({ ok: false, error: 'Nhiệm vụ không hợp lệ' });
    if (isNpcQuest(q)) {
      const giver = (q as any).giver as string | undefined;
      const pos = giver ? npcPos(s, giver) : undefined;
      if (!pos || distTo(s, pos.x, pos.z) > 3) return reply({ ok: false, error: 'Bạn đứng quá xa người giao' });
    }
    if (await db.claimQuestWithRewards(pid, q.id, q.target, q.merit, q.coins)) {
      invalidateQuestCache(pid);
      await pushProfile(s);
      await maybeAwardTitles(s);
      await pushQuests(s);
      refreshQuestGuard(s.room).catch(() => {});
      return reply({ ok: true });
    }
    return reply({ ok: false, error: 'Chưa thể nhận thưởng lúc này' });
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

  socket.on('profile:save', async (payload: unknown, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!s) return reply({ ok: false, error: 'Chưa vào chùa' });
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return reply({ ok: false, error: 'Dữ liệu không hợp lệ' });
    const p = payload as { bio?: unknown; age?: unknown };
    const rawBio = p.bio ?? null;
    if (rawBio !== null && typeof rawBio !== 'string') return reply({ ok: false, error: 'Dữ liệu không hợp lệ' });
    let bio: string | null = typeof rawBio === 'string' ? rawBio.trim() : null;
    if (bio === '') bio = null;
    if (bio !== null && bio.length > 200) return reply({ ok: false, error: 'Tiểu sử tối đa 200 ký tự' });
    const rawAge = p.age ?? null;
    if (rawAge !== null && (typeof rawAge !== 'number' || !Number.isInteger(rawAge) || rawAge < 1 || rawAge > 120)) return reply({ ok: false, error: 'Tuổi phải từ 1 đến 120' });
    const age: number | null = rawAge === null ? null : (rawAge as number);
    await db.saveProfile(s.pid, bio, age);
    await pushProfile(s);
    reply({ ok: true });
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

  socket.on('beads:start', (cb?: (r: { ok: boolean; error?: string }) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    s.beadStart = Date.now();
    cb?.({ ok: true });
  });
  socket.on('beads:done', async (cb?: (r: BeadsAck) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const started = s.beadStart;
    s.beadStart = undefined;
    if (started === undefined) return cb?.({ ok: false, error: 'Vòng chưa bắt đầu — chạm vào hạt để bắt đầu vòng mới' });
    const elapsed = Date.now() - started;
    if (elapsed < BEAD_ROUND_MIN_MS) return cb?.({ ok: false, error: 'Vòng quá nhanh — hãy lần chậm rãi, đủ nhịp' });
    if (elapsed > BEAD_ROUND_MAX_MS) return cb?.({ ok: false, error: 'Vòng quá chậm — đã quá 30 phút, bắt đầu vòng mới nhé' });
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
    const before = (await db.getWallet(pid))?.merit ?? 0;
    const got = await db.claimMail(pid, mailId);
    if (!got) return cb?.({ ok: false, error: 'Máy chủ đang bận, thử lại sau', unread: await db.mailUnread(pid) });
    if (!got.ok) {
      const msg = got.reason === 'claimed' ? 'Quà đã được nhận rồi' : got.reason === 'no_gift' ? 'Thư này không có quà' : 'Không tìm thấy thư';
      return cb?.({ ok: false, error: msg, reason: got.reason, unread: await db.mailUnread(pid) });
    }
    const { merit, coins, items } = got.gift;
    await grantRewards(s, merit, coins, { skipAdd: true, beforeMerit: before });
    cb?.({ ok: true, merit, coins, items: items ?? {}, unread: await db.mailUnread(pid) });
  });
  socket.on('gift:send', async (payload: unknown, cb?: (r: GiftAck) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });

    const p = (payload ?? {}) as { toPid?: number; item?: string; note?: string };
    const toPid = p.toPid;
    if (typeof toPid !== 'number' || !Number.isInteger(toPid) || toPid < 1) return cb?.({ ok: false, error: 'Người nhận không hợp lệ' });
    const itemId = String(p.item ?? '');

    // Resolve người nhận theo player id (socket id đổi mỗi lần kết nối lại)
    const toSession = [...sessions.values()].find((x) => x.pid === toPid);
    if (!toSession) return cb?.({ ok: false, error: 'Người nhận không trực tuyến' });
    if (toSession.room !== s.room) return cb?.({ ok: false, error: 'Người nhận không ở cùng phòng' });
    if (toSession.pid === s.pid) return cb?.({ ok: false, error: 'Không thể tặng cho chính mình' });

    // Validate lễ vật
    const itemDef = Object.hasOwn(ITEM_BY_ID, itemId) ? ITEM_BY_ID[itemId] : undefined;
    if (!itemDef || itemDef.category !== 'le_vat' || itemDef.kind !== 'consumable') {
      return cb?.({ ok: false, error: 'Món quà không hợp lệ' });
    }

    const note = clean(p.note, 120) || 'Tặng bạn một lễ vật';

    const result = await db.sendGift(s.pid, toSession.pid, itemId, note);

    if (result === 'cap') {
      return cb?.({ ok: false, error: 'Hôm nay bạn đã tặng đủ 5 lượt rồi, mai tặng tiếp nhé' });
    }
    if (result === 'no_item') {
      return cb?.({ ok: false, error: 'Bạn không có lễ vật này trong túi' });
    }
    if (result === 'error') {
      return cb?.({ ok: false, error: 'Có lỗi xảy ra, thử lại sau' });
    }

    // Thành công: đẩy số thư chưa đọc cho người nhận, cập nhật túi người gửi
    toSession.socket.emit('mail', { unread: await db.mailUnread(toSession.pid) });
    await pushProfile(s);
    const left = 5 - (await db.minigameCount(s.pid, 'gift'));
    cb?.({ ok: true, left });
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
  socket.on('fortune:get', async (cb?: (r: FortuneAck) => void) => {
    if (!me()) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    cb?.({ ok: true, n: await db.getFortuneToday(pid) });
  });
  socket.on('fortune:draw', async (cb?: (r: FortuneAck) => void) => {
    const s = me();
    if (!s) return cb?.({ ok: false, error: 'Chưa vào chùa' });
    const saved = await db.getFortuneToday(pid);
    if (saved !== null) return cb?.({ ok: true, n: saved, used: true });
    const now = Date.now();
    if (now - (s.last.fortune ?? 0) < 2000) return cb?.({ ok: false, error: 'Thao tác quá nhanh, chờ một chút' });
    s.last.fortune = now;
    if (distTo(s, 24, -24) > 3.5)
      return cb?.({ ok: false, error: 'Hãy tới gần giá treo quẻ (gần Chính Điện) để xin xăm' });
    const n = await db.saveFortune(pid, Math.floor(Math.random() * FORTUNES.length));
    cb?.({ ok: true, n, used: true });
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

  // ---- Admin panel ----
  socket.on('admin:list', async (query: unknown, cb?: (r: { ok: boolean; rows?: db.AdminPlayerRow[]; error?: string }) => void) => {
    const reply = (r: { ok: boolean; rows?: db.AdminPlayerRow[]; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!(await requireAdmin(s))) return reply({ ok: false, error: 'Không có quyền quản trị' });
    const rows = await db.listPlayers(String(query ?? ''), 30);
    reply({ ok: true, rows });
  });

  socket.on('admin:grant', async (payload: unknown, cb?: (r: { ok: boolean; merit?: number; coins?: number; error?: string }) => void) => {
    const reply = (r: { ok: boolean; merit?: number; coins?: number; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!s || !(await requireAdmin(s))) return reply({ ok: false, error: 'Không có quyền quản trị' });
    const p = (payload && typeof payload === 'object' ? payload : {}) as { userId?: unknown; merit?: unknown; coins?: unknown };
    const userId = Number(p.userId);
    const merit = Number(p.merit);
    const coins = Number(p.coins);
    if (!Number.isInteger(userId) || userId <= 0) return reply({ ok: false, error: 'Người nhận không hợp lệ' });
    if (!Number.isInteger(merit) || merit < 0 || merit > 100000) return reply({ ok: false, error: 'Công đức không hợp lệ' });
    if (!Number.isInteger(coins) || coins < 0 || coins > 100000) return reply({ ok: false, error: 'Số xu không hợp lệ' });
    if (merit === 0 && coins === 0) return reply({ ok: false, error: 'Cần tặng ít nhất công đức hoặc xu' });
    if (!(await db.getProfile(userId))) return reply({ ok: false, error: 'Không tìm thấy người chơi' });
    await db.addRewards(userId, merit, coins);
    await db.logAdminGrant(s.pid, userId, merit, coins);
    for (const other of sessions.values()) {
      if (other.pid === userId) await pushProfile(other);
    }
    const after = await db.getWallet(userId);
    reply({ ok: true, merit: after?.merit ?? 0, coins: after?.coins ?? 0 });
  });

  socket.on('admin:selfgrant', async (payload: unknown, cb?: (r: { ok: boolean; merit?: number; coins?: number; error?: string }) => void) => {
    const reply = (r: { ok: boolean; merit?: number; coins?: number; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!s || !(await requireAdmin(s))) return reply({ ok: false, error: 'Không có quyền quản trị' });
    const p = (payload && typeof payload === 'object' ? payload : {}) as { merit?: unknown; coins?: unknown };
    const merit = Number(p.merit);
    const coins = Number(p.coins);
    if (!Number.isInteger(merit) || merit < 0 || merit > 1000000) return reply({ ok: false, error: 'Công đức không hợp lệ' });
    if (!Number.isInteger(coins) || coins < 0 || coins > 1000000) return reply({ ok: false, error: 'Số xu không hợp lệ' });
    if (merit === 0 && coins === 0) return reply({ ok: false, error: 'Cần thêm ít nhất công đức hoặc xu' });
    await db.addRewards(s.pid, merit, coins);
    await db.logAdminGrant(s.pid, s.pid, merit, coins);
    await pushProfile(s);
    const after = await db.getWallet(s.pid);
    reply({ ok: true, merit: after?.merit ?? 0, coins: after?.coins ?? 0 });
  });

  socket.on('admin:log', async (cb?: (r: { ok: boolean; rows?: db.AdminLogRow[]; error?: string }) => void) => {
    const reply = (r: { ok: boolean; rows?: db.AdminLogRow[]; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!(await requireAdmin(s))) return reply({ ok: false, error: 'Không có quyền quản trị' });
    reply({ ok: true, rows: await db.listAdminLog(20) });
  });

  socket.on('admin:ban', async (payload: unknown, cb?: (r: { ok: boolean; banned?: boolean; error?: string }) => void) => {
    const reply = (r: { ok: boolean; banned?: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!s || !(await requireAdmin(s))) return reply({ ok: false, error: 'Không có quyền quản trị' });
    const p = (payload && typeof payload === 'object' ? payload : {}) as { userId?: unknown; banned?: unknown };
    const userId = Number(p.userId);
    if (!Number.isInteger(userId) || userId <= 0) return reply({ ok: false, error: 'Người chơi không hợp lệ' });
    if (typeof p.banned !== 'boolean') return reply({ ok: false, error: 'Trạng thái khóa không hợp lệ' });
    const banned = p.banned;
    if (userId === s.pid) return reply({ ok: false, error: 'Không thể khóa tài khoản của mình' });
    if (await db.isAdmin(userId)) return reply({ ok: false, error: 'Không thể khóa tài khoản quản trị' });
    const changed = await db.setBanned(userId, banned);
    if (!changed) return reply({ ok: false, error: 'Không tìm thấy người chơi' });
    if (banned) {
      for (const [id, other] of sessions) {
        if (other.pid === userId) { saveTombstone(other); other.socket.emit('kicked'); other.socket.disconnect(true); sessions.delete(id); }
      }
    }
    reply({ ok: true, banned });
  });

  socket.on('admin:broadcast', async (payload: unknown, cb?: (r: { ok: boolean; error?: string }) => void) => {
    const reply = (r: { ok: boolean; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!s || !(await requireAdmin(s))) return reply({ ok: false, error: 'Không có quyền quản trị' });
    const now = Date.now();
    if (now - (s.last.admin ?? 0) < 5000) return reply({ ok: false, error: 'Đang xử lý, thử lại sau' });
    s.last.admin = now;
    const p = (payload && typeof payload === 'object' ? payload : {}) as { text?: unknown };
    const text = String(p.text ?? '').trim();
    if (text.length < 1 || text.length > 200) return reply({ ok: false, error: 'Nội dung phải từ 1 đến 200 ký tự' });
    io.emit('announce', { text, t: Date.now() });
    for (const room of roomList()) {
      const sysMsg: ChatMessage = { id: seq++, name: '', text, t: Date.now(), sys: true };
      const arr = roomChat.get(room.id) ?? [];
      arr.push(sysMsg);
      if (arr.length > 100) arr.shift();
      roomChat.set(room.id, arr);
      io.to(room.id).emit('chat', sysMsg);
    }
    reply({ ok: true });
  });

  socket.on('admin:stats', async (cb?: (r: { ok: boolean; online?: number; totalPlayers?: number; newToday?: number; totalDonated?: number; error?: string }) => void) => {
    const reply = (r: { ok: boolean; online?: number; totalPlayers?: number; newToday?: number; totalDonated?: number; error?: string }) => { if (typeof cb === 'function') cb(r); };
    const s = me();
    if (!(await requireAdmin(s))) return reply({ ok: false, error: 'Không có quyền quản trị' });
    const st = await db.adminStats();
    reply({ ok: true, online: sessions.size, totalPlayers: st.totalPlayers, newToday: st.newToday, totalDonated: st.totalDonated });
  });

  socket.on('disconnect', async () => {
    const s = sessions.get(socket.id);
    if (!s) return;
    saveTombstone(s);
    sessions.delete(socket.id);
    io.to(s.room).emit('player:leave', socket.id);
    const departure = endMeditationSession(s);
    meditationDepartures.set(pid, departure);
    try { await departure; }
    finally { if (meditationDepartures.get(pid) === departure) meditationDepartures.delete(pid); }
  });
});

startRitualLoops(ritualEnv);

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
    for (const f of nr.fx.splice(0)) {
      if (f.type === 'release') io.to(r.id).emit('player:release', { id: f.id, kind: f.kind });
      else io.to(r.id).emit('player:action', { id: f.id, kind: f.kind });
    }
    io.to(r.id).volatile.emit('state', {
      online: list.length,
      players: [...list.map(({ state: p }) => p), ...npcs].map((p) => ({ id: p.id, x: p.x, z: p.z, y: p.y, ry: p.ry, anim: p.anim, act: p.npc ? (p.act ?? null) : (p.anim === 'chant' ? 'chant' : p.anim === 'sit' ? 'meditate' : null) })),
      animals: getAnimalStates(r.id),
    });
  }
}, 100);

setInterval(() => {
  for (const r of ROOMS) refreshQuestGuard(r.id).catch(() => {});
}, 10_000);

let meditateTickRunning = false;
// meditation: every tick, seated players earn merit; group bonus doubles it.
// Hào quang cấp theo TỔNG số giây thiền cộng dồn trong ngày VN (không phải liên tục).
setInterval(async () => {
  if (meditateTickRunning) return;
  meditateTickRunning = true;
  try {
    for (const r of ROOMS) {
      const players = roomSessions(r.id);
      const sitting = players.filter((s) => s.state.anim === 'sit');
      for (const s of players) {
        void updateMeditationClock(s, Date.now(), s.state.anim === 'sit');
      }
      for (const s of players) {
        if (!db.dbBackgroundAllowed()) break;
        if (s.state.anim !== 'sit' && !s.med!.pendingSec) continue;
        await persistMeditation(s, s.med!, r.id);
        s.socket.emit('meditation:daily', meditationDailyInfo(s));
      }
      if (!sitting.length) { io.to(r.id).emit('meditation', meditationInfo(r.id)); continue; }
      const bonus = sitting.length >= GROUP_MEDITATE_MIN;
      roomMinutes.set(r.id, (roomMinutes.get(r.id) ?? 0) + (sitting.length * MEDITATE_TICK_MS) / 60_000);
      for (const s of sitting) {
        // Breaker: all players share one DB, so if it is down, skip the rest of this room.
        if (!db.dbBackgroundAllowed()) break;
        if (sessions.get(s.socket.id) !== s || s.room !== r.id || s.state.anim !== 'sit') continue;
        try {
          await grantRewards(s, bonus ? 2 : 1, bonus ? 1 : 0);
          await questEvent(s, 'meditate');
          await countStatSafe(s, 'meditate_sec', MEDITATE_TICK_MS / 1000);
          db.dbBackgroundResult();
        } catch (e) {
          db.dbBackgroundResult(e);
          console.warn('[meditate]', (e as Error).message);
        }
      }
      io.to(r.id).emit('meditation', meditationInfo(r.id));
    }
  } finally {
    meditateTickRunning = false;
  }
}, MEDITATE_TICK_MS);

httpServer.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
