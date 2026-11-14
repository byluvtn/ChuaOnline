import { BRIDGE, HALL, PLAZA, clampToCompound, inLake } from '../src/layout.js';
import { ROAD_NODES, roadRoute, routeFrom } from '../shared/roads.js';
import type { Anim, Outfit, PlayerState } from '../shared/types.js';
import type { Pt } from '../shared/roads.js';

type Behavior = 'wander' | 'sweepPlaza' | 'sweepBridge' | 'sweepZen' | 'sweepRoad' | 'bell' | 'visitor' | 'desk' | 'post' | 'chant';
type Phase = 'idle' | 'walk' | 'act';

export interface NpcDef {
  id: string; name: string; outfit: Outfit; color: string; scale: number; role: 'abbot' | 'novice' | 'lay'; behavior: Behavior;
  post?: Pt;
  accessory?: string | null;
}

export const NPC_DEFS: NpcDef[] = [
  { id: 'npc1', name: 'Sư Thầy', outfit: 'monk', color: '#d9a62b', scale: 1.15, role: 'abbot', behavior: 'wander' },
  { id: 'npc2', name: 'Tiểu Quét Sân', outfit: 'monk', color: '#8a5a2b', scale: 0.9, role: 'novice', behavior: 'sweepPlaza' },
  { id: 'npc3', name: 'Tiểu Quét Cầu', outfit: 'monk', color: '#8c8c90', scale: 0.9, role: 'novice', behavior: 'sweepBridge' },
  { id: 'npc4', name: 'Tiểu Đánh Chuông', outfit: 'monk', color: '#7a4a6a', scale: 0.9, role: 'novice', behavior: 'bell' },
  { id: 'npc5', name: 'Phật Tử Đi Lễ', outfit: 'female', color: '#bc7672', scale: 1.0, role: 'lay', behavior: 'visitor' },
  { id: 'npc6', name: 'Sư Thầy Trực Ban', outfit: 'monk', color: '#b98a2e', scale: 1.15, role: 'abbot', behavior: 'desk' },
  { id: 'npc7', name: 'Tiểu Quét Vườn', outfit: 'monk', color: '#7a6a8a', scale: 0.9, role: 'novice', behavior: 'sweepZen' },
  { id: 'npc8', name: 'Tiểu Quét Đường', outfit: 'monk', color: '#5a7a5a', scale: 0.9, role: 'novice', behavior: 'sweepRoad' },
  { id: 'npc9', name: 'Cô Đồng', outfit: 'female', color: '#72818e', scale: 1.0, role: 'lay', behavior: 'visitor' },
  { id: 'npc10', name: 'Cô Ba Đi Lễ', outfit: 'female', color: '#a86a7a', scale: 1.0, role: 'lay', behavior: 'visitor' },
  { id: 'npc11', name: 'Cô Gái Trẻ', outfit: 'female', color: '#d98a7a', scale: 1.0, role: 'lay', behavior: 'visitor' },
  { id: 'npc12', name: 'Bác Nông Dân', outfit: 'male', color: '#5a7a8a', scale: 1.0, role: 'lay', behavior: 'visitor' },
  { id: 'npc13', name: 'Sư Cô Trông Điện Mẫu', outfit: 'nun', color: '#9a7a8a', scale: 1.0, role: 'novice', behavior: 'post', post: { x: 39, z: 12.5 } },
  { id: 'npc14', name: 'Tiểu Quản Trai Đường', outfit: 'monk', color: '#7a6a5a', scale: 1.0, role: 'novice', behavior: 'post', post: { x: -29, z: -60 } },
  { id: 'npc15', name: 'Cô Bán Hoa Quả', outfit: 'female', color: '#d97a5a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 7, z: 57 } },
  { id: 'npc16', name: 'Bác Bán Bánh', outfit: 'male', color: '#8a6a3a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 10.5, z: 57 } },
  { id: 'npc17', name: 'Cô Bán Trà', outfit: 'female', color: '#5a8a7a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 14, z: 57 } },
  { id: 'npc18', name: 'Bác Bán Hương Hoa', outfit: 'male', color: '#a86a9a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 26.5, z: 57 } },
  { id: 'npc19', name: 'Học sinh nam', outfit: 'male', color: '#4a7ab8', scale: 0.85, role: 'lay', behavior: 'visitor', accessory: 'backpack' },
  { id: 'npc20', name: 'Sinh viên nữ', outfit: 'female', color: '#d98ab8', scale: 1.0, role: 'lay', behavior: 'visitor' },
  { id: 'npc21', name: 'Nhân viên văn phòng nam', outfit: 'male', color: '#3a5a7a', scale: 1.0, role: 'lay', behavior: 'visitor', accessory: 'briefcase' },
  { id: 'npc22', name: 'Nhân viên văn phòng nữ', outfit: 'female', color: '#7a5a8a', scale: 1.0, role: 'lay', behavior: 'visitor', accessory: 'briefcase' },
  { id: 'npc23', name: 'Bà cụ', outfit: 'female', color: '#8a7a5a', scale: 1.0, role: 'lay', behavior: 'visitor' },
  { id: 'npc24', name: 'Ông cụ', outfit: 'male', color: '#5a5a5a', scale: 1.0, role: 'lay', behavior: 'visitor', accessory: 'cane' },
  { id: 'npc25', name: 'Du khách nước ngoài', outfit: 'male', color: '#c9a13a', scale: 1.0, role: 'lay', behavior: 'visitor', accessory: 'camera' },
  { id: 'npc26', name: 'Mẹ trẻ bồng con', outfit: 'female', color: '#e08a7a', scale: 1.0, role: 'lay', behavior: 'visitor', accessory: 'baby' },
  { id: 'npc27', name: 'Sư Ni Diệu An', outfit: 'nun', color: '#778c96', scale: 1.0, role: 'novice', behavior: 'chant' },
  { id: 'npc28', name: 'Sư Ni Diệu Tâm', outfit: 'nun', color: '#7a8a7a', scale: 1.0, role: 'novice', behavior: 'chant' },
  { id: 'npc29', name: 'Sư Phó', outfit: 'monk', color: '#a86a2e', scale: 1.15, role: 'abbot', behavior: 'wander' },
  { id: 'npc30', name: 'Bác Bán Chim Cá', outfit: 'male', color: '#6a8a4a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 30, z: 57 } },
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

/** Mỗi khách viếng có một chỗ đứng riêng quanh điểm chung (tránh chồng nhau). */
function visitorSpot(base: Pt, def: { id: string }): Pt {
  const vs = NPC_DEFS.filter((d) => d.behavior === 'visitor');
  const k = Math.max(0, vs.findIndex((d) => d.id === def.id));
  const a = (k / Math.max(1, vs.length)) * Math.PI * 2;
  return { x: base.x + Math.cos(a) * 1.4, z: base.z + Math.sin(a) * 1.4 };
}

/** Tốc độ đi riêng của mỗi khách (tránh đi thành đoàn dính nhau trên cùng tuyến đường). */
function visitorSpeed(def: { id: string }): number {
  const vs = NPC_DEFS.filter((d) => d.behavior === 'visitor');
  const k = Math.max(0, vs.findIndex((d) => d.id === def.id));
  return 1.0 + k * 0.04; // 1.00–1.48 m/s cho 13 khách; hai khách kề nhau lệch 0.04 m/s → tách ~1.4 m sau 35 s đi bộ
}

const PLAZA_LAMPS: Pt[] = [{ x: -4, z: 12 }, { x: 4, z: 12 }, { x: -4, z: 5 }, { x: 4, z: 5 }];
const SOUTH_END = { x: BRIDGE.x, z: BRIDGE.z0 - 1.2 }, NORTH_END = { x: BRIDGE.x, z: BRIDGE.z1 + 1.2 };

const R = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.z - b.z);

interface Npc {
  def: NpcDef; state: PlayerState; phase: Phase; until: number; speed: number;
  route: Pt[]; roam: number; side: number;
  mode: 'normal' | 'toAltar' | 'sitting' | 'leaving' | 'toRest' | 'resting' | 'toWork' | 'toChant' | 'chanting' | 'toSeatChant' | 'seatChant' | 'toLeave'; nextChat: number; chatIdx: number; rungKey: string; chantKey: string;
  stage: 'gate' | 'toAltar' | 'bow' | 'chant' | 'toPlaza' | 'plaza' | 'toGate' | 'toBranch' | 'branch' | 'toSeat' | 'seatChant' | 'toStroll' | 'stroll';
  shiftEnd: number; restEnd: number; bedId: 0 | 1 | null; chantSeat: ChantSeat | null; homeSlot: Behavior;
  strollStops: string[]; strollIdx: number;
  gone: boolean; goneUntil: number;
}
export interface NpcChat { npcId: string; name: string; text: string }
export interface NpcRoom {
  npcs: Npc[]; lastTick: number; sleeping: boolean; outbox: NpcChat[]; beds: (string | null)[]; seats: Map<string, string>;
  questGuard: Set<string>; left: string[]; joined: PlayerState[];
}

/** Ghế tụng: hàng đầu mỗi điện (đo từ code thật). S6 sẽ đặt đệm 3D đúng các tọa độ này. */
export interface ChantSeat { hall: 'chinhDien' | 'tamThe' | 'thienDuong' | 'dienMau'; x: number; z: number; ry: number }
export const CHANT_SEATS: ChantSeat[] = [
  { hall: 'chinhDien', x: -4.9, z: -35.2, ry: Math.PI },
  { hall: 'chinhDien', x: -3.4, z: -35.2, ry: Math.PI },
  { hall: 'chinhDien', x: 3.4, z: -35.2, ry: Math.PI },
  { hall: 'chinhDien', x: 4.9, z: -35.2, ry: Math.PI },
  { hall: 'tamThe', x: -4.7, z: -68.4, ry: Math.PI },
  { hall: 'tamThe', x: -3.2, z: -68.4, ry: Math.PI },
  { hall: 'tamThe', x: 3.2, z: -68.4, ry: Math.PI },
  { hall: 'tamThe', x: 4.7, z: -68.4, ry: Math.PI },
  { hall: 'thienDuong', x: -45, z: -27, ry: Math.PI / 2 },
  { hall: 'thienDuong', x: -43, z: -27, ry: Math.PI / 2 },
  { hall: 'dienMau', x: 37, z: 10, ry: Math.PI },
  { hall: 'dienMau', x: 39, z: 10, ry: Math.PI },
];
const seatKey = (s: ChantSeat) => `${s.hall}:${s.x},${s.z}`;
function takeSeat(room: NpcRoom, seat: ChantSeat, npcId: string): boolean {
  const k = seatKey(seat);
  const holder = room.seats.get(k);
  if (holder && holder !== npcId) return false;
  room.seats.set(k, npcId);
  return true;
}
function releaseSeat(room: NpcRoom, npcId: string) {
  for (const [k, v] of room.seats) if (v === npcId) room.seats.delete(k);
}
function freeSeat(room: NpcRoom, hall: ChantSeat['hall']): ChantSeat | undefined {
  return CHANT_SEATS.find((s) => s.hall === hall && !room.seats.has(seatKey(s)));
}

/** Road node coordinates by id (no bare coordinates for graph nodes in NPC code). */
function nodePt(id: string): Pt {
  const n = ROAD_NODES.find((r) => r.id === id);
  if (!n) throw new Error(`unknown road node ${id}`);
  return { x: n.x, z: n.z };
}

/** Ca truc: 20 phut lam, 10 phut nghi (mac dinh cua prompt, khong phai spec). */
const SHIFT_MS = 20 * MIN;
const REST_MS = 10 * MIN;
/** NPC duoc nghi giuong: 4 chu tieu quet + tieu danh chuong. */
const REST_POOL = new Set<Behavior>(['sweepPlaza', 'sweepBridge', 'sweepZen', 'sweepRoad', 'bell']);
/** Hai giuong tang xa: giuong 0 o x = -44, giuong 1 o x = -38 (tam giuong z = -73.05). */
const BED_X = [-44, -38];
const BED_STAND_Z = -72.0;
const BED_Z = -73.05;
/** Nut do thi de quay ve slot quet sau khi nghi. */
const HOME_NODE: Partial<Record<Behavior, string>> = { sweepPlaza: 'plaza', sweepBridge: 'bridgeS', sweepZen: 'zenGarden', sweepRoad: 'rearKT', bell: 'bellTower' };

export function createNpcRoom(now = Date.now()): NpcRoom {
  const npcs = NPC_DEFS.map((def, i): Npc => {
    const start: Pt = def.behavior === 'chant' ? (def.id === 'npc27' ? { x: -45, z: -27 } : { x: 37, z: 10 })
      : def.behavior === 'post' ? (def.post ?? (() => { throw new Error(`post NPC ${def.id} has no post`); })())
      : def.behavior === 'visitor' ? visitorSpot(nodePt('gate'), def)
      : def.behavior === 'wander' ? nodePt('plaza')
      : def.behavior === 'bell' ? nodePt('bellTower')
      : def.behavior === 'desk' ? { x: -44.4, z: 35 } // duty chair in Phong Ghi Cong Duc, rotated +90 deg to face East (chair box local (0, -2.4) -> world (-44.4, 35)), npc faces East (ry PI/2)
      : def.behavior === 'sweepZen' ? nodePt('zenGarden')
      : def.behavior === 'sweepRoad' ? nodePt('rearKT')
      : def.behavior === 'sweepBridge' ? { x: SOUTH_END.x - 1.5, z: SOUTH_END.z }
      : { x: PLAZA.x + 3, z: PLAZA.z - 2 };
    const inPool = REST_POOL.has(def.behavior);
    return {
      def, phase: 'idle', until: def.behavior === 'chant' ? now : now + R(1000, 3000) + i * 700, speed: 1.2, route: [], roam: 0, side: 0,
      mode: 'normal', nextChat: 0, chatIdx: 0, rungKey: '', chantKey: '', stage: 'gate',
      shiftEnd: inPool ? now + SHIFT_MS + i * 5 * MIN : 0, restEnd: 0, bedId: null, chantSeat: null, strollStops: [], strollIdx: 0, homeSlot: def.behavior, gone: false, goneUntil: 0,
      state: { id: def.id, name: def.name, outfit: def.outfit, color: def.color, accessory: def.accessory ?? null, x: start.x, z: start.z, ry: def.behavior === 'desk' ? Math.PI / 2 : def.behavior === 'chant' ? (def.id === 'npc27' ? Math.PI / 2 : Math.PI) : def.behavior === 'post' ? (def.post && def.post.z >= 47 ? Math.PI : def.post?.x === -11 ? Math.PI / 2 : def.post?.x === 11 ? -Math.PI / 2 : def.post?.x === 0 ? Math.PI : 0) : Math.PI, anim: def.behavior === 'desk' || def.behavior === 'chant' ? 'sit' : 'idle', merit: 0, npc: true, role: def.role },
    };
  });
  spreadVisitors(npcs, now);
  const room: NpcRoom = { npcs, lastTick: now, sleeping: false, outbox: [], beds: [null, null], seats: new Map(), questGuard: new Set(), left: [], joined: [] };
  for (const n of npcs) {
    if (n.def.behavior !== 'chant') continue;
    const homeHall = n.def.id === 'npc27' ? 'thienDuong' : 'dienMau';
    const seat = CHANT_SEATS.find((s) => s.hall === homeHall);
    if (seat && takeSeat(room, seat, n.def.id)) n.chantSeat = seat;
  }
  return room;
}

/** Rải sẵn khách viếng qua các chặng của flow lúc tạo phòng. Chỉ đổi trạng thái khởi tạo (vị trí, stage, anim, until); logic chuyển stage giữ nguyên. i = chỉ số trong NPC_DEFS. */
const SPREAD_ROUTE_NODES = ['bridgeS', 'plaza', 'hallFront', 'axisMid'];
const SPREAD_INSIDE: Npc['stage'][] = ['bow', 'chant', 'bow', 'branch'];
function spreadVisitors(npcs: Npc[], now: number) {
  let onRoute = 0, inside = 0;
  npcs.forEach((n, i) => {
    if (n.def.behavior !== 'visitor' || i % 3 === 0) return; // i % 3 === 0: ở lại cổng như cũ
    const s = n.state;
    if (i % 3 === 1) {
      // Đang đi trên tuyến: đứng ở node giữa đường; visitorDecide tính tuyến còn lại tới bàn thờ từ vị trí hiện tại.
      const p = nodePt(SPREAD_ROUTE_NODES[onRoute % SPREAD_ROUTE_NODES.length]);
      s.x = p.x + (onRoute >= SPREAD_ROUTE_NODES.length ? 0.9 : 0); s.z = p.z;
      n.stage = 'gate'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(0, 2000);
      onRoute++;
      return;
    }
    // Đã ở trong chùa: bàn thờ (bow/chant) hoặc đi dạo quanh sân (branch).
    const stage = SPREAD_INSIDE[inside++ % SPREAD_INSIDE.length];
    const p = visitorSpot(stage === 'branch' ? PLAZA_SPOT : VISITOR_SPOT, n.def);
    s.x = p.x; s.z = p.z; s.ry = Math.PI; n.stage = stage;
    if (stage === 'branch') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(0, 5000); }
    else { n.phase = 'act'; s.anim = stage === 'bow' ? 'bow' : 'chant'; n.until = now + R(5000, 15000); }
  });
}

/** Vị trí hợp lệ: ngoài hồ, trong tường, không dính cột đèn ở sân chùa. */
function walkable(p: Pt): boolean {
  if (inLake(p.x, p.z)) return false;
  const q = { x: p.x, z: p.z };
  clampToCompound(q);
  return q.x === p.x && q.z === p.z && PLAZA_LAMPS.every((l) => dist(l, p) > 1.1);
}

/** Public nodes the abbot wanders to (no transit nodes, no garden interior). */
const WANDER_NODES = ['gate', 'bridgeS', 'bridgeN', 'plaza', 'axisMid', 'hallFront', 'corrW', 'pillars', 'drumTower', 'bellTower', 'quanYard', 'buddhaYard', 'denTrinh', 'restArea', 'dienMau', 'baoThap', 'tamThe', 'zenGarden', 'thienDuong', 'psPier', 'rearKT', 'rearTO', 'rearW', 'rearE', 'westMid', 'westNorth', 'eastMid', 'eastNorth'];
/** Bell-roam cycle destinations (npc4 spawns at bellTower, so the cycle starts by leaving it). */
const BELL_ROAM = ['corrW', 'pillars', 'corrW', 'bellTower'];
/** ms until the next time in BELL_TIMES (VN clock); wraps to tomorrow's first bell. */
function nextBellIn(now: number): number {
  const { dayMs } = vnClock(now);
  for (const b of BELL_TIMES) { const d = b * MIN - dayMs; if (d > 0) return d; }
  return (BELL_TIMES[0] + 24 * 60) * MIN - dayMs;
}

function pickDest(n: Npc): { to: Pt; route: Pt[] } | null {
  const cur = n.state;
  for (let tries = 0; tries < 12; tries++) {
    switch (n.def.behavior) {
      case 'wander': {
        const id = WANDER_NODES[Math.floor(Math.random() * WANDER_NODES.length)];
        const to = nodePt(id);
        if (dist(to, cur) < 0.8) continue;
        return { to, route: routeFrom(cur, id) };
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
      case 'sweepZen': {
        const c = nodePt('zenGarden');
        const a = R(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 3;
        const p = { x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r };
        if (dist(p, cur) < 0.8 || !walkable(p)) continue;
        return { to: p, route: [p] };
      }
      case 'sweepRoad': {
        // Sweep the rear road z = -46 on the side the NPC is already on (the middle
        // of the rear road does not exist: the Tam The platform occupies x -20..20).
        const west = cur.x < 0;
        const sideNode = west ? 'rearKT' : 'rearTO';
        const x = west ? R(-46, -22) : R(22, 46);
        const p = { x, z: -46 + R(-1, 1) };
        if (dist(p, cur) < 0.8 || !walkable(p)) continue;
        return { to: p, route: [...routeFrom(cur, sideNode), p] };
      }
      default: return null;
    }
  }
  return null;
}

function startWalk(n: Npc, route: Pt[], speed: number) {
  n.route = route; n.speed = speed; n.phase = 'walk'; n.state.anim = 'walk';
}

function abbotRouteIn(n: Npc): Pt[] {
  return [...routeFrom(n.state, 'hallIn'), ABBOT_SEAT];
}
function abbotRouteOut(): Pt[] {
  return [HALL_IN, ...roadRoute('hallIn', 'plaza')];
}

function abbotArrive(n: Npc, now: number) {
  const s = n.state;
  if (n.mode === 'toAltar') { n.mode = 'sitting'; n.phase = 'act'; s.anim = 'sit'; s.ry = Math.PI; n.until = now + 5000; n.nextChat = now; return; }
  n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(1000, 3000);
}
function abbotDecide(n: Npc, now: number) {
  if (n.mode === 'toAltar') startWalk(n, abbotRouteIn(n), 1.2);
  else if (n.mode === 'leaving') startWalk(n, abbotRouteOut(), 1.2);
  else n.until = now + 5000;
}

/** Visitor branch points after chant: pier, merit desk door, Tam The platform, north-east and north-west rear roads. */
const VISITOR_BRANCH = ['psPier', 'phongCDDoor', 'tamThe', 'rearKT', 'rearTO'] as const;

/** Chinh Dien bounds (HALL x -17..17, z -42..-22): inside it a visitor walks straight to a cushion. */
function inChinhDien(p: Pt): boolean {
  return p.x >= -17 && p.x <= 17 && p.z >= -42 && p.z <= -22;
}
/** Cushion nearest to `from` among the free ones of one hall. */
function nearestFreeSeat(room: NpcRoom, hall: ChantSeat['hall'], from: Pt): ChantSeat | undefined {
  let best: ChantSeat | undefined;
  let bestD = Infinity;
  for (const s of CHANT_SEATS) {
    if (s.hall !== hall || room.seats.has(seatKey(s))) continue;
    const d = dist(from, s);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}
function seatRoute(n: Npc, seat: ChantSeat): Pt[] {
  const p = { x: seat.x, z: seat.z };
  if (seat.hall === 'chinhDien' && inChinhDien(n.state)) return [p];
  return [...routeFrom(n.state, seat.hall === 'chinhDien' ? 'hallIn' : 'tamThe'), p];
}
/** Leave through the Tam Quan gate; despawn happens on arrival (visitorArrive). */
function leaveToGate(n: Npc) {
  n.mode = 'toLeave'; n.stage = 'toGate';
  startWalk(n, [...routeFrom(n.state, 'gate'), visitorSpot(nodePt('gate'), n.def)], visitorSpeed(n.def));
}

function visitorArrive(room: NpcRoom, n: Npc, now: number) {
  const s = n.state;
  if (n.stage === 'toAltar') { n.stage = 'bow'; n.phase = 'act'; s.anim = 'bow'; n.until = now + 3200; s.ry = Math.PI; }
  else if (n.stage === 'toBranch') { n.stage = 'branch'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 10000); }
  else if (n.stage === 'toPlaza') { n.stage = 'plaza'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(4000, 8000); }
  else if (n.stage === 'toSeat') {
    n.stage = 'seatChant'; n.mode = 'seatChant'; n.phase = 'act'; s.anim = 'chant';
    s.ry = n.chantSeat ? n.chantSeat.ry : Math.PI;
    n.until = now + 30_000;
  }
  else if (n.stage === 'toStroll') {
    if (room.questGuard.has(n.def.id)) {
      // Got a quest while strolling: cancel and stay.
      n.strollStops = []; n.strollIdx = 0;
      n.mode = 'normal'; n.stage = 'gate'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 9000);
    } else {
      n.stage = 'stroll'; n.phase = 'idle'; s.anim = 'idle'; s.ry = R(0, Math.PI * 2);
      n.until = now + R(STROLL_IDLE_MIN_MS, STROLL_IDLE_MAX_MS);
    }
  }
  else if (n.stage === 'toGate' && n.mode === 'toLeave') {
    if (room.questGuard.has(n.def.id)) {
      // Got a quest while walking out: cancel leaving.
      n.mode = 'normal'; n.stage = 'gate'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 9000);
    } else {
      releaseSeat(room, n.def.id); n.chantSeat = null;
      n.gone = true; n.goneUntil = now + R(60_000, 120_000);
      room.left.push(n.def.id);
      n.phase = 'idle'; n.route = [];
    }
  }
  else { n.stage = 'gate'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 9000); }
}
/** Diem dao choi ngoai troi cho khach sau khi tung xong (chi dung node ngoai troi, khong vao dien): vuon Thien, Bao Thap, ben phong sinh, san Dien Mau, hanh lang, san truoc. */
const STROLL_SPOTS = ['zenGarden', 'baoThap', 'thienDuong', 'psPier', 'quanYard', 'dienMau', 'buddhaYard', 'corrW', 'westMid', 'eastMid', 'restArea', 'denTrinh', 'bridgeN', 'pillars', 'drumTower', 'bellTower'] as const;
const STROLL_CHANCE = 0.6; // ~60% khach dao choi, 40% ve thang nhu cu de cong khong vang
const STROLL_STOP_MIN = 1;
const STROLL_STOP_MAX = 3;
const STROLL_IDLE_MIN_MS = 4000;
const STROLL_IDLE_MAX_MS = 9000;

function startStroll(room: NpcRoom, n: Npc, _now: number) {
  if (room.questGuard.has(n.def.id) || Math.random() >= STROLL_CHANCE) { leaveToGate(n); return; }
  const s = n.state;
  const pool = [...STROLL_SPOTS];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const want = STROLL_STOP_MIN + Math.floor(Math.random() * (STROLL_STOP_MAX - STROLL_STOP_MIN + 1));
  const stops: string[] = [];
  for (const id of pool) {
    if (stops.length >= want) break;
    if (dist(s, nodePt(id)) > 5) stops.push(id);
  }
  if (!stops.length) { leaveToGate(n); return; }
  const route = routeFrom(s, stops[0]);
  if (!route.length) { leaveToGate(n); return; }
  n.mode = 'normal'; n.strollStops = stops; n.strollIdx = 0; n.stage = 'toStroll';
  startWalk(n, route, visitorSpeed(n.def));
}

function visitorDecide(room: NpcRoom, n: Npc, now: number) {
  const s = n.state;
  switch (n.stage) {
    case 'gate': case 'toAltar': n.stage = 'toAltar'; startWalk(n, [...routeFrom(s, 'hallIn'), visitorSpot(VISITOR_SPOT, n.def)], visitorSpeed(n.def)); break;
    case 'bow': {
      if (room.questGuard.has(n.def.id)) { n.stage = 'chant'; n.phase = 'act'; s.anim = 'chant'; n.until = now + R(5000, 8000); break; }
      const seat = nearestFreeSeat(room, 'chinhDien', s) ?? nearestFreeSeat(room, 'tamThe', s);
      if (seat && takeSeat(room, seat, n.def.id)) {
        n.chantSeat = seat; n.mode = 'toSeatChant'; n.stage = 'toSeat';
        startWalk(n, seatRoute(n, seat), visitorSpeed(n.def));
      } else leaveToGate(n);
      break;
    }
    case 'toSeat': {
      // Walk to the cushion was aborted (blocked): give the cushion back and go home.
      releaseSeat(room, n.def.id); n.chantSeat = null;
      leaveToGate(n);
      break;
    }
    case 'seatChant':
      releaseSeat(room, n.def.id); n.chantSeat = null;
      startStroll(room, n, now);
      break;
    case 'chant': {
      if (Math.random() < 0.3) {
        const t = VISITOR_BRANCH[Math.floor(Math.random() * VISITOR_BRANCH.length)];
        n.stage = 'toBranch'; startWalk(n, routeFrom(s, t), 1.2);
      } else { n.stage = 'toPlaza'; startWalk(n, [...routeFrom(s, 'plaza'), visitorSpot(PLAZA_SPOT, n.def)], visitorSpeed(n.def)); }
      break;
    }
    case 'toPlaza': n.stage = 'toPlaza'; startWalk(n, [...routeFrom(s, 'plaza'), visitorSpot(PLAZA_SPOT, n.def)], visitorSpeed(n.def)); break;
    case 'branch': n.stage = 'toPlaza'; startWalk(n, [...routeFrom(s, 'plaza'), visitorSpot(PLAZA_SPOT, n.def)], visitorSpeed(n.def)); break;
    case 'stroll': {
      if (room.questGuard.has(n.def.id)) {
        n.strollStops = []; n.strollIdx = 0;
        n.mode = 'normal'; n.stage = 'gate'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 9000);
        break;
      }
      n.strollIdx++;
      const route = n.strollIdx < n.strollStops.length ? routeFrom(s, n.strollStops[n.strollIdx]) : [];
      if (route.length) { n.stage = 'toStroll'; startWalk(n, route, visitorSpeed(n.def)); }
      else { n.strollStops = []; n.strollIdx = 0; leaveToGate(n); }
      break;
    }
    case 'toStroll': {
      if (room.questGuard.has(n.def.id)) {
        n.strollStops = []; n.strollIdx = 0;
        n.mode = 'normal'; n.stage = 'gate'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 9000);
        break;
      }
      const id = n.strollStops[n.strollIdx];
      const route = id ? routeFrom(s, id) : [];
      if (route.length) startWalk(n, route, visitorSpeed(n.def));
      else { n.strollStops = []; n.strollIdx = 0; leaveToGate(n); }
      break;
    }
    case 'plaza': case 'toGate': n.stage = 'toGate'; startWalk(n, [...routeFrom(s, 'gate'), visitorSpot(nodePt('gate'), n.def)], visitorSpeed(n.def)); break;
  }
}

/** Tuyen di nghi: theo do thi toi cong vien, qua san chung toi cua tang xa, roi toi diem dung canh giuong va tam giuong. */
function restRoute(n: Npc): Pt[] {
  const bedX = BED_X[n.bedId ?? 0];
  return [...routeFrom(n.state, 'ktGate'), nodePt('ktYard'), nodePt('tangXaDoor'), { x: bedX, z: BED_STAND_Z }, { x: bedX, z: BED_Z }];
}
/** Tuyen di lam: nguoc lai, tu tam giuong ra cong vien roi theo do thi ve slot quet. */
function workRoute(n: Npc, bedX: number): Pt[] {
  return [{ x: bedX, z: BED_STAND_Z }, nodePt('tangXaDoor'), nodePt('ktYard'), ...routeFrom(nodePt('ktGate'), HOME_NODE[n.homeSlot] ?? 'plaza')];
}
/** Het ca: giu 1 giuong (neu con) roi di nghi; het giuong thi lam tiep, thu lai sau 60 giay. */
function tryRest(room: NpcRoom, n: Npc, now: number) {
  if (n.def.behavior === 'bell' && (activeBell(now) || nextBellIn(now) < 4 * MIN)) { n.shiftEnd = now + 60_000; return; }
  const free = room.beds.indexOf(null);
  if (free < 0) { n.shiftEnd = now + 60_000; return; }
  room.beds[free] = n.def.id;
  n.bedId = free as 0 | 1;
  n.mode = 'toRest';
  startWalk(n, restRoute(n), 1.2);
}
/** Day khoi giuong: tra giuong, di ve slot quet (tieu danh chuong ve thap). */
function wakeNpc(room: NpcRoom, n: Npc, now: number) {
  const bedX = BED_X[n.bedId ?? 0];
  if (n.bedId !== null) { room.beds[n.bedId] = null; n.bedId = null; }
  n.mode = 'toWork';
  startWalk(n, workRoute(n, bedX), 1.2);
}

function arrive(room: NpcRoom, n: Npc, now: number) {
  const s = n.state;
  if (n.mode === 'toRest') {
    // Da toi tam giuong: nam nghi 10 phut. Giuong tang xa dai 2.0 m theo truc X,
    // sau chi 0.9 m, nen NPC nam doc truc X. Tu the nga NGUA (mat huong len), dau ve
    // local -Z; ry = +PI/2 anh xa local -Z sang phia Tay (-X).
    n.mode = 'resting'; n.phase = 'act'; s.anim = 'lie'; s.ry = Math.PI / 2;
    n.restEnd = now + REST_MS; n.until = n.restEnd;
    return;
  }
  if (n.mode === 'toWork') { n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(1000, 3000); n.shiftEnd = now + SHIFT_MS; return; }
  if (n.def.behavior === 'visitor') return visitorArrive(room, n, now);
  if (n.def.behavior === 'desk') { n.phase = 'idle'; s.anim = 'sit'; s.ry = Math.PI / 2; n.until = now + 5000; return; }
  if (n.def.behavior === 'post') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 5000; return; }
  if (n.mode === 'toChant') {
    const seat = n.chantSeat;
    n.mode = 'chanting'; n.phase = 'act'; s.anim = 'chant';
    s.ry = seat ? seat.ry : Math.PI;
    n.until = now + R(300_000, 600_000);
    return;
  }
  if (n.def.behavior === 'wander' && n.mode !== 'normal') return abbotArrive(n, now);
  if (n.def.behavior === 'wander') { n.phase = 'act'; s.anim = Math.random() < 0.5 ? 'chant' : 'bow'; n.until = now + (s.anim === 'bow' ? 3000 : 2500); return; }
  if (n.def.behavior === 'bell') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 15000); return; }
  n.phase = 'act'; s.anim = 'sweep'; n.until = now + R(6000, 12000);
}

function decide(room: NpcRoom, n: Npc, now: number) {
  const s = n.state;
  if (n.def.behavior === 'desk') { n.phase = 'idle'; s.anim = 'sit'; s.ry = Math.PI / 2; n.until = now + 5000; return; }
  if (n.def.behavior === 'post') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 5000; return; }
  if (n.mode === 'chanting' || n.mode === 'toChant') return; // runSchedule owns chanting
  if (n.def.behavior === 'bell') {
    if (activeBell(now)) return; // runSchedule is handling the bell window
    if (nextBellIn(now) < 2 * MIN) { // back to the tower 2 minutes before the bell
      if (dist(n.state, nodePt('bellTower')) < 0.8) { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 1000; return; }
      startWalk(n, routeFrom(n.state, 'bellTower'), 1.2);
      return;
    }
    const next = BELL_ROAM[n.roam % BELL_ROAM.length];
    n.roam++;
    startWalk(n, routeFrom(n.state, next), 1.2);
    return;
  }
  if (n.def.behavior === 'visitor') return visitorDecide(room, n, now);
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
  if (n.mode === 'resting') {
    if (now >= n.restEnd || (n.def.behavior === 'bell' && nextBellIn(now) < 2 * MIN)) wakeNpc(room, n, now);
    return;
  }
  if (n.mode === 'toRest' || n.mode === 'toWork') return;
  // Tieu quet doi khi vao tung trong thoi khoa thay vi quet (25% moi phien, tung tieu).
  const SWEEP_CHANT: Behavior[] = ['sweepPlaza', 'sweepBridge', 'sweepZen', 'sweepRoad'];
  if (SWEEP_CHANT.includes(n.def.behavior) && (n.mode === 'chanting' || n.mode === 'toChant')) {
    const ses = activeSession(now);
    if (n.mode === 'chanting' && !ses && now >= n.until) {
      const seat = n.chantSeat;
      releaseSeat(room, n.def.id); n.chantSeat = null;
      n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle';
      startWalk(n, routeFrom(seat ? { x: seat.x, z: seat.z } : n.state, HOME_NODE[n.homeSlot] ?? 'plaza'), 1.0);
      n.until = now + 1000;
    }
    return;
  }
  const sesNow = activeSession(now);
  if (sesNow && SWEEP_CHANT.includes(n.def.behavior) && n.mode === 'normal' && n.chantKey !== sesNow.key) {
    n.chantKey = sesNow.key;
    if (Math.random() < 0.25) {
      const seat = freeSeat(room, 'chinhDien') ?? freeSeat(room, 'tamThe');
      if (seat && takeSeat(room, seat, n.def.id)) {
        n.chantSeat = seat; n.mode = 'toChant';
        const node = seat.hall === 'chinhDien' ? 'hallIn' : 'tamThe';
        startWalk(n, [...routeFrom(n.state, node), { x: seat.x, z: seat.z }], 1.0);
        return;
      }
    }
  }
  if (REST_POOL.has(n.def.behavior) && now >= n.shiftEnd) { tryRest(room, n, now); return; }
  if (n.def.behavior === 'chant') {
    const ses = activeSession(now);
    if (n.mode === 'chanting') {
      if (!ses && now >= n.until) {
        releaseSeat(room, n.def.id); n.chantSeat = null;
        n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(120_000, 300_000);
      }
      return;
    }
    if (n.mode === 'toChant') return;
    if (ses || now >= n.until) {
      const hall = n.def.id === 'npc27' ? 'thienDuong' : 'dienMau';
      const seat = freeSeat(room, hall) ?? CHANT_SEATS.find((x) => x.hall === hall);
      if (!seat) { n.until = now + 60_000; return; }
      if (!takeSeat(room, seat, n.def.id)) { n.until = now + 60_000; return; }
      n.chantSeat = seat; n.mode = 'toChant';
      startWalk(n, [{ x: seat.x, z: seat.z }], 1.0);
    }
    return;
  }
  if (n.def.behavior === 'bell') {
    const bell = activeBell(now);
    if (bell && n.rungKey !== bell.key) { n.rungKey = bell.key; n.phase = 'act'; s.anim = 'ring'; n.until = bell.endsAt; }
    else if (!bell && n.phase === 'act' && s.anim === 'ring') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 500; }
    return;
  }
  if (n.def.behavior !== 'wander') return;
  const ses = activeSession(now);
  if (n.def.id === 'npc29') {
    if (ses) {
      if (n.mode === 'normal') {
        const seat = freeSeat(room, 'chinhDien');
        if (seat && takeSeat(room, seat, n.def.id)) {
          n.chantSeat = seat; n.mode = 'toChant';
          startWalk(n, [...routeFrom(n.state, 'hallIn'), { x: seat.x, z: seat.z }], 1.2);
        }
      } else if (n.mode === 'chanting') {
        if (now >= n.until) {
          releaseSeat(room, n.def.id); n.chantSeat = null;
          n.route = []; n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(1000, 3000);
        } else if (now >= n.nextChat) {
          room.outbox.push({ npcId: n.def.id, name: n.def.name, text: OPENING_LINES[n.chatIdx++ % OPENING_LINES.length] });
          n.nextChat = now + CHAT_EVERY_MS;
        }
      }
    } else if (n.mode === 'chanting' || n.mode === 'toChant') {
      releaseSeat(room, n.def.id); n.chantSeat = null;
      n.route = []; n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(1000, 3000);
    }
    return;
  }
  if (ses) {
    if (n.mode === 'normal') { n.mode = 'toAltar'; n.route = []; startWalk(n, abbotRouteIn(n), 1.2); }
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

function step(room: NpcRoom, n: Npc, dt: number, now: number) {
  const s = n.state, to = n.route[0];
  if (!to) { arrive(room, n, now); return; }
  const d = dist(s, to);
  if (d < 0.12) { n.route.shift(); if (!n.route.length) arrive(room, n, now); return; }
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

/** NPC states currently in the world (visitors that left are excluded). */
export function presentNpcStates(room: NpcRoom): PlayerState[] {
  return room.npcs.filter((n) => !n.gone).map((n) => n.state);
}

export function tickNpcs(room: NpcRoom, now = Date.now(), online = 0): PlayerState[] {
  if (room.sleeping) return presentNpcStates(room);
  const dt = Math.min(0.5, (now - room.lastTick) / 1000);
  room.lastTick = now;
  for (const n of room.npcs) {
    if (n.gone) {
      if (now >= n.goneUntil) {
        const p = visitorSpot(nodePt('gate'), n.def);
        n.state.x = p.x; n.state.z = p.z; n.state.ry = Math.PI; n.state.anim = 'idle';
        n.mode = 'normal'; n.stage = 'gate'; n.phase = 'idle'; n.until = now + R(1000, 3000);
        n.gone = false; n.route = [];
        room.joined.push({ ...n.state });
      }
      continue;
    }
    runSchedule(room, n, now, online);
    if (n.phase === 'walk') step(room, n, dt, now);
    else if (now >= n.until) decide(room, n, now);
  }
  return presentNpcStates(room);
}

/** Phòng vừa có người quay lại sau lúc trống: bỏ thời gian dồn để NPC tiếp tục từ trạng thái đã đóng băng. */
export function resumeNpcs(room: NpcRoom, now = Date.now()) {
  if (!room.sleeping) return;
  room.sleeping = false;
  const gap = now - room.lastTick;
  room.lastTick = now;
  for (const n of room.npcs) { n.until += gap; n.nextChat += gap; if (n.shiftEnd) n.shiftEnd += gap; if (n.restEnd) n.restEnd += gap; if (n.goneUntil) n.goneUntil += gap; }
}
