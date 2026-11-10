import { BELL, BRIDGE, BUDDHA_YARD, DEN_TRINH, HALL, PLAZA, QUAN, WALL, ZEN, clampToCompound, inLake } from '../src/layout.js';
import type { Anim, Outfit, PlayerState } from '../shared/types.js';

type Behavior = 'wander' | 'sweepPlaza' | 'sweepBridge' | 'bell' | 'visitor';
type Phase = 'idle' | 'walk' | 'act';
type Pt = { x: number; z: number };

export interface NpcDef {
  id: string; name: string; outfit: Outfit; color: string; scale: number; role: 'abbot' | 'novice' | 'lay'; behavior: Behavior;
}

export const NPC_DEFS: NpcDef[] = [
  { id: 'npc1', name: 'Sư Thầy', outfit: 'monk', color: '#d9a62b', scale: 1.15, role: 'abbot', behavior: 'wander' },
  { id: 'npc2', name: 'Tiểu Quét Lá', outfit: 'monk', color: '#8a5a2b', scale: 0.9, role: 'novice', behavior: 'sweepPlaza' },
  { id: 'npc3', name: 'Tiểu Quét Lá', outfit: 'monk', color: '#8c8c90', scale: 0.9, role: 'novice', behavior: 'sweepBridge' },
  { id: 'npc4', name: 'Tiểu Đánh Chuông', outfit: 'monk', color: '#8a5a2b', scale: 0.9, role: 'novice', behavior: 'bell' },
  { id: 'npc5', name: 'Phật Tử Đi Lễ', outfit: 'female', color: '#bc7672', scale: 1.0, role: 'lay', behavior: 'visitor' },
];

/*
 * blocked() trong layout.ts là mặt nạ "không đặt cây cối" (đúng ở mọi điểm neo), không phải vật cản,
 * còn collider chỉ có ở client. Vì vậy sư thầy đi theo các "nan hoa" từ sân chùa tới từng điểm neo;
 * mỗi nan hoa đã được kiểm tra không cắt hồ, tháp, cột hay tường. Điểm neo bị collider chiếm
 * (sân tượng Phật r=4, Đền Trình) được dời ra sát mép để không đứng trong vật cản.
 */
const HUB: Pt = { x: PLAZA.x, z: PLAZA.z };
const SPOKES: { name: string; to: Pt; via: Pt[] }[] = [
  { name: 'plaza', to: HUB, via: [] },
  { name: 'bell', to: { x: BELL.x, z: BELL.z }, via: [{ x: -6, z: 6 }] },
  { name: 'quan', to: { x: QUAN.x, z: QUAN.z + 5.5 }, via: [] },
  { name: 'buddha', to: { x: BUDDHA_YARD.x + 5.4, z: BUDDHA_YARD.z }, via: [] },
  { name: 'denTrinh', to: { x: DEN_TRINH.x - 1, z: DEN_TRINH.z }, via: [{ x: 1, z: 32 }] },
  { name: 'zen', to: { x: ZEN.x, z: ZEN.z }, via: [{ x: -19, z: -9 }, { x: -22, z: -10 }, { x: -23, z: -11 }, { x: -28, z: -16 }] },
  { name: 'hall', to: { x: 0, z: -20 }, via: [{ x: 3, z: -17 }] },
];

/*
 * Thời khóa: tính theo giờ Việt Nam (UTC+7, không có giờ mùa hè), không dùng giờ local của máy chủ.
 * NPC_CLOCK_OFFSET_MIN chỉ để thử: lệch đồng hồ NPC đi số phút đó.
 */
const VN_OFFSET_MS = 7 * 3600_000;
const CLOCK_SKEW_MS = Number(process.env.NPC_CLOCK_OFFSET_MIN ?? 0) * 60_000;
const DAY_MS = 86_400_000;
const MIN = 60_000;
export const SESSIONS = [
  { id: 'sang', start: 5 * 60, end: 5 * 60 + 20 },
  { id: 'trua', start: 12 * 60, end: 12 * 60 + 30 },
  { id: 'toi', start: 20 * 60, end: 20 * 60 + 30 },
];
/** Chuông đầu mỗi thời khóa + chuông chiều 18:00; mỗi lần thỉnh khoảng 1 phút. */
export const BELL_TIMES = [5 * 60, 12 * 60, 18 * 60, 20 * 60];
const BELL_MS = 60_000;
const CHAT_EVERY_MS = 10 * MIN;

function vnClock(now: number) {
  const vn = now + CLOCK_SKEW_MS + VN_OFFSET_MS;
  const day = Math.floor(vn / DAY_MS);
  return { day, dayMs: vn - day * DAY_MS };
}
export function activeSession(now: number): { key: string; endsAt: number } | null {
  const { day, dayMs } = vnClock(now);
  for (const s of SESSIONS) {
    if (dayMs >= s.start * MIN && dayMs < s.end * MIN) return { key: `${day}:${s.id}`, endsAt: now + (s.end * MIN - dayMs) };
  }
  return null;
}
export function activeBell(now: number): { key: string; endsAt: number } | null {
  const { day, dayMs } = vnClock(now);
  for (const b of BELL_TIMES) {
    const e = dayMs - b * MIN;
    if (e >= 0 && e < BELL_MS) return { key: `${day}:${b}`, endsAt: now + (BELL_MS - e) };
  }
  return null;
}

const OPENING_LINES = [
  'Đến giờ thời khóa rồi. Mọi người cùng chắp tay niệm Nam mô A Di Đà Phật.',
  'Hít vào thật sâu, thở ra thật nhẹ. Mỗi câu Phật hiệu giúp tâm lắng lại.',
  'Nam mô A Di Đà Phật. Niệm chậm rãi, từng chữ rõ ràng, để lòng được bình an.',
  'Thân ngồi yên, tâm buông nhẹ. Ai bận rộn cũng cứ thong thả niệm một câu Phật hiệu.',
];
const CLOSING_LINES = [
  'Chúc mọi người một ngày an lạc, giữ tâm lành trong từng việc nhỏ.',
  'Công phu đều đặn mỗi ngày sẽ nuôi lớn thiện tâm. Hẹn gặp lại ở thời khóa sau.',
  'Mang sự bình an này về với gia đình và bạn bè. A Di Đà Phật.',
];

/** Tuyến đi dọc trục chính: cổng tam quan, cầu, sân chùa, tiền sảnh chính điện. */
const TABLE_Z = HALL.z - HALL.hz + 5.3;
const HALL_IN: Pt = { x: HALL.x, z: HALL.z + HALL.hz - 2 };
const ABBOT_SEAT: Pt = { x: HALL.x + 1.8, z: TABLE_Z + 2.1 };
const VISITOR_SPOT: Pt = { x: HALL.x - 1.8, z: TABLE_Z + 2.7 };
const PLAZA_SPOT: Pt = { x: PLAZA.x - 2.5, z: PLAZA.z + 2 };
const AXIS: Pt[] = [
  { x: BRIDGE.x, z: WALL.zS - 1.5 }, { x: BRIDGE.x, z: BRIDGE.z1 + 0.4 }, { x: BRIDGE.x, z: BRIDGE.z0 - 0.4 },
  HUB, { x: 3, z: -17 }, { x: 0, z: -20 }, HALL_IN,
];
const AXIS_HUB = 3;

const PLAZA_LAMPS: Pt[] = [{ x: -4, z: 12 }, { x: 4, z: 12 }, { x: -4, z: 5 }, { x: 4, z: 5 }];
const SOUTH_END = { x: BRIDGE.x, z: BRIDGE.z0 - 1.2 }, NORTH_END = { x: BRIDGE.x, z: BRIDGE.z1 + 1.2 };

const R = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.z - b.z);

interface Npc {
  def: NpcDef; state: PlayerState; phase: Phase; until: number; speed: number;
  route: Pt[]; spoke: number; side: number;
  mode: 'normal' | 'toAltar' | 'sitting' | 'leaving'; nextChat: number; chatIdx: number; rungKey: string;
  stage: 'gate' | 'toAltar' | 'bow' | 'chant' | 'toPlaza' | 'plaza' | 'toGate';
}
export interface NpcChat { npcId: string; name: string; text: string }
export interface NpcRoom { npcs: Npc[]; lastTick: number; sleeping: boolean; outbox: NpcChat[] }

export function createNpcRoom(now = Date.now()): NpcRoom {
  const npcs = NPC_DEFS.map((def, i): Npc => {
    const start: Pt = def.behavior === 'visitor' ? AXIS[0] : def.behavior === 'wander' ? HUB : def.behavior === 'bell' ? SPOKES[1].to
      : def.behavior === 'sweepBridge' ? { x: SOUTH_END.x - 1.5, z: SOUTH_END.z } : { x: PLAZA.x + 3, z: PLAZA.z - 2 };
    return {
      def, phase: 'idle', until: now + R(1000, 3000) + i * 700, speed: 1.2, route: [], spoke: 0, side: 0,
      mode: 'normal', nextChat: 0, chatIdx: 0, rungKey: '', stage: 'gate',
      state: { id: def.id, name: def.name, outfit: def.outfit, color: def.color, accessory: null, x: start.x, z: start.z, ry: Math.PI, anim: 'idle', merit: 0, npc: true, role: def.role },
    };
  });
  return { npcs, lastTick: now, sleeping: false, outbox: [] };
}

/** Vị trí hợp lệ: ngoài hồ, trong tường, không dính cột đèn ở sân chùa. */
function walkable(p: Pt): boolean {
  if (inLake(p.x, p.z)) return false;
  const q = { x: p.x, z: p.z };
  clampToCompound(q);
  return q.x === p.x && q.z === p.z && PLAZA_LAMPS.every((l) => dist(l, p) > 1.1);
}

function routeAnchor(from: Pt, fromSpoke: number, toSpoke: number): Pt[] {
  const out: Pt[] = [];
  const a = SPOKES[fromSpoke];
  for (let i = a.via.length - 1; i >= 0; i--) out.push(a.via[i]);
  if (fromSpoke !== 0) out.push(HUB);
  const b = SPOKES[toSpoke];
  if (toSpoke !== 0) { out.push(...b.via, b.to); } else out.push(HUB);
  return out.filter((p) => dist(p, from) > 0.2);
}

function pickDest(n: Npc): { to: Pt; route: Pt[] } | null {
  const cur = n.state;
  for (let tries = 0; tries < 12; tries++) {
    switch (n.def.behavior) {
      case 'wander': {
        const k = Math.floor(Math.random() * SPOKES.length);
        if (k === n.spoke || dist(SPOKES[k].to, cur) < 0.8) continue;
        const route = routeAnchor(cur, n.spoke, k);
        n.spoke = k;
        return { to: SPOKES[k].to, route };
      }
      case 'sweepPlaza': {
        const a = R(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 6;
        const p = { x: PLAZA.x + Math.cos(a) * r, z: PLAZA.z + Math.sin(a) * r };
        if (dist(p, cur) < 0.8 || !walkable(p)) continue;
        return { to: p, route: [p] };
      }
      case 'sweepBridge': {
        n.side ^= 1;
        const e = n.side ? NORTH_END : SOUTH_END;
        const p = { x: e.x + R(-2.6, 2.6), z: e.z + R(-0.8, 0.8) };
        if (dist(p, cur) < 0.8 || !walkable(p)) continue;
        const wasNorth = cur.z > BRIDGE.z1;
        const wasSouth = cur.z < BRIDGE.z0;
        const route: Pt[] = [];
        if (wasSouth && n.side) route.push({ x: BRIDGE.x, z: BRIDGE.z0 - 0.4 }, { x: BRIDGE.x, z: BRIDGE.z1 + 0.4 });
        if (wasNorth && !n.side) route.push({ x: BRIDGE.x, z: BRIDGE.z1 + 0.4 }, { x: BRIDGE.x, z: BRIDGE.z0 - 0.4 });
        route.push(p);
        return { to: p, route };
      }
      default: return null;
    }
  }
  return null;
}

function startWalk(n: Npc, route: Pt[], speed: number) {
  n.route = route; n.speed = speed; n.phase = 'walk'; n.state.anim = 'walk';
}

function nearestAxis(p: Pt): number {
  let best = 0, bd = Infinity;
  AXIS.forEach((a, i) => { const d = dist(a, p); if (d < bd) { bd = d; best = i; } });
  return best;
}

/** Đi dọc AXIS từ điểm gần nhất tới `goal`, rồi tới `tail`. */
function axisRoute(from: Pt, goal: number, tail: Pt[]): Pt[] {
  const i = nearestAxis(from), out: Pt[] = [];
  for (let k = i; k !== goal; k += Math.sign(goal - i)) out.push(AXIS[k]);
  out.push(AXIS[goal], ...tail);
  return out.filter((p, k) => k > 0 || dist(p, from) > 0.2);
}

function abbotRouteIn(n: Npc): Pt[] {
  return [...routeAnchor(n.state, n.spoke, 6), HALL_IN, ABBOT_SEAT];
}
function abbotRouteOut(): Pt[] {
  return [HALL_IN, ...routeAnchor(HALL_IN, 6, 0)];
}

function abbotArrive(n: Npc, now: number) {
  const s = n.state;
  if (n.mode === 'toAltar') { n.mode = 'sitting'; n.phase = 'act'; s.anim = 'sit'; s.ry = Math.PI; n.until = now + 5000; n.nextChat = now; return; }
  n.mode = 'normal'; n.spoke = 0; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(1000, 3000);
}
function abbotDecide(n: Npc, now: number) {
  if (n.mode === 'toAltar') startWalk(n, abbotRouteIn(n), 1.2);
  else if (n.mode === 'leaving') startWalk(n, abbotRouteOut(), 1.2);
  else n.until = now + 5000;
}

function visitorArrive(n: Npc, now: number) {
  const s = n.state;
  if (n.stage === 'toAltar') { n.stage = 'bow'; n.phase = 'act'; s.anim = 'bow'; n.until = now + 3200; s.ry = Math.PI; }
  else if (n.stage === 'toPlaza') { n.stage = 'plaza'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(4000, 8000); }
  else { n.stage = 'gate'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 9000); }
}
function visitorDecide(n: Npc, now: number) {
  const s = n.state;
  switch (n.stage) {
    case 'gate': case 'toAltar': n.stage = 'toAltar'; startWalk(n, axisRoute(s, AXIS.length - 1, [VISITOR_SPOT]), 1.2); break;
    case 'bow': n.stage = 'chant'; n.phase = 'act'; s.anim = 'chant'; n.until = now + R(5000, 8000); break;
    case 'chant': case 'toPlaza': n.stage = 'toPlaza'; startWalk(n, axisRoute(s, AXIS_HUB, [PLAZA_SPOT]), 1.2); break;
    case 'plaza': case 'toGate': n.stage = 'toGate'; startWalk(n, axisRoute(s, 0, []), 1.2); break;
  }
}

function arrive(n: Npc, now: number) {
  const s = n.state;
  if (n.def.behavior === 'visitor') return visitorArrive(n, now);
  if (n.def.behavior === 'wander' && n.mode !== 'normal') return abbotArrive(n, now);
  if (n.def.behavior === 'wander') { n.phase = 'act'; s.anim = Math.random() < 0.5 ? 'chant' : 'bow'; n.until = now + (s.anim === 'bow' ? 3000 : 2500); return; }
  if (n.def.behavior === 'bell') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 1000; return; }
  n.phase = 'act'; s.anim = 'sweep'; n.until = now + R(6000, 12000);
}

function decide(n: Npc, now: number) {
  const s = n.state;
  if (n.def.behavior === 'bell') {
    if (n.phase === 'act') { n.phase = 'idle'; s.anim = 'idle'; }
    n.until = now + 1000;
    return;
  }
  if (n.def.behavior === 'visitor') return visitorDecide(n, now);
  if (n.def.behavior === 'wander' && n.mode !== 'normal') return abbotDecide(n, now);
  const slow = n.def.behavior !== 'wander';
  if (n.phase === 'act' && !slow) { n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(3000, 8000); return; }
  const d = pickDest(n);
  if (!d) { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 2000; return; }
  startWalk(n, d.route, slow ? 0.6 : 1.2);
}

/** Sư thầy giữ thời khóa; tiểu đánh chuông thỉnh chuông đầu giờ. */
function runSchedule(room: NpcRoom, n: Npc, now: number, online: number) {
  const s = n.state;
  if (n.def.behavior === 'bell') {
    const bell = activeBell(now);
    if (bell && n.rungKey !== bell.key) { n.rungKey = bell.key; n.phase = 'act'; s.anim = 'ring'; n.until = bell.endsAt; }
    else if (!bell && n.phase === 'act' && s.anim === 'ring') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 500; }
    return;
  }
  if (n.def.behavior !== 'wander') return;
  const ses = activeSession(now);
  if (ses) {
    if (n.mode === 'normal') { n.mode = 'toAltar'; n.route = []; startWalk(n, abbotRouteIn(n), 1.2); n.spoke = 6; }
    else if (n.mode === 'sitting' && now >= n.nextChat) {
      room.outbox.push({ npcId: n.def.id, name: n.def.name, text: OPENING_LINES[n.chatIdx++ % OPENING_LINES.length] });
      n.nextChat = now + CHAT_EVERY_MS;
    }
  } else if (n.mode === 'sitting') {
    room.outbox.push({ npcId: n.def.id, name: n.def.name, text: `Hết thời khóa. Hiện có ${online} đạo hữu đang ở trong chùa. ${CLOSING_LINES[n.chatIdx++ % CLOSING_LINES.length]}` });
    n.mode = 'leaving'; startWalk(n, abbotRouteOut(), 1.2);
  } else if (n.mode === 'toAltar') {
    n.mode = 'leaving'; startWalk(n, abbotRouteOut(), 1.2);
  }
}

function step(n: Npc, dt: number, now: number) {
  const s = n.state, to = n.route[0];
  if (!to) { arrive(n, now); return; }
  const d = dist(s, to);
  if (d < 0.12) { n.route.shift(); if (!n.route.length) arrive(n, now); return; }
  const k = Math.min(1, (n.speed * dt) / d);
  const q = { x: s.x + (to.x - s.x) * k, z: s.z + (to.z - s.z) * k };
  const onDeck = Math.abs(q.x - BRIDGE.x) <= BRIDGE.hw && q.z >= BRIDGE.z0 && q.z <= BRIDGE.z1;
  const before = { x: q.x, z: q.z };
  clampToCompound(q);
  if ((inLake(q.x, q.z) && !onDeck) || q.x !== before.x || q.z !== before.z) {
    n.route = []; n.phase = 'idle'; s.anim = 'idle'; n.until = now + 1500; return;
  }
  s.ry = Math.atan2(to.x - s.x, to.z - s.z);
  s.x = q.x; s.z = q.z;
}

export function tickNpcs(room: NpcRoom, now = Date.now(), online = 0): PlayerState[] {
  if (room.sleeping) return room.npcs.map((n) => n.state);
  const dt = Math.min(0.5, (now - room.lastTick) / 1000);
  room.lastTick = now;
  for (const n of room.npcs) {
    runSchedule(room, n, now, online);
    if (n.phase === 'walk') step(n, dt, now);
    else if (now >= n.until) decide(n, now);
  }
  return room.npcs.map((n) => n.state);
}

/** Phòng vừa có người quay lại sau lúc trống: bỏ thời gian dồn để NPC tiếp tục từ trạng thái đã đóng băng. */
export function resumeNpcs(room: NpcRoom, now = Date.now()) {
  if (!room.sleeping) return;
  room.sleeping = false;
  const gap = now - room.lastTick;
  room.lastTick = now;
  for (const n of room.npcs) { n.until += gap; n.nextChat += gap; }
}