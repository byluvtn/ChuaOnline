import { BRIDGE, HALL, PLAZA, clampToCompound, inLake } from '../src/layout.js';
import { LOTUS, RIVER, expansionWaterBlocked } from '../shared/campus.js';
import { ROAD_NODES, roadRoute, routeFrom } from '../shared/roads.js';
import type { ActionKind, Anim, NpcAct, Outfit, PlayerState } from '../shared/types.js';
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
  { id: 'npc16', name: 'Bác Bán Bánh', outfit: 'male', color: '#8a6a3a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 12, z: 57 } },
  { id: 'npc17', name: 'Cô Bán Trà', outfit: 'female', color: '#5a8a7a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 17, z: 57 } },
  { id: 'npc18', name: 'Bác Bán Hương Hoa', outfit: 'male', color: '#a86a9a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 32, z: 57 } },
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
  { id: 'npc30', name: 'Bác Bán Chim Cá', outfit: 'male', color: '#6a8a4a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 37, z: 57 } },
  { id: 'npc31', name: 'Cô Bán Phở Chay', outfit: 'female', color: '#c9684a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 22, z: 57 } },
  { id: 'npc32', name: 'Bác Bán Trà Đá', outfit: 'male', color: '#4a8a9a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 27, z: 57 } },
  { id: 'npc33', name: 'Cô Bán Cơm Chay', outfit: 'female', color: '#8aa84a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 42, z: 57 } },
  { id: 'npc34', name: 'Bác Bán Phóng Sinh', outfit: 'male', color: '#9a5a3a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 47, z: 57 } },
  { id: 'npc36', name: 'Bà Bán Trà Đá', outfit: 'female', color: '#b88a9a', scale: 1.0, role: 'lay', behavior: 'post', post: { x: 52, z: 57 } },
  { id: 'npc37', name: 'Sư Ông', outfit: 'monk', color: '#7a2a20', scale: 1.15, role: 'abbot', behavior: 'wander', accessory: 'cane' },
  { id: 'npc38', name: 'Tiểu Trồng Cây', outfit: 'monk', color: '#5a7a5a', scale: 0.9, role: 'novice', behavior: 'post', post: { x: -48, z: 22 } },
];

/*
 * Thời khóa: tính theo giờ Việt Nam (UTC+7, không có giờ mùa hè), không dùng giờ local của máy chủ.
 * NPC_CLOCK_OFFSET_MIN chỉ để thử: lệch đồng hồ NPC đi số phút đó.
 */
const VN_OFFSET_MS = 7 * 3600_000;
const CLOCK_SKEW_MIN = Number(process.env.NPC_CLOCK_OFFSET_MIN ?? 0);
const CLOCK_SKEW_MS = (Number.isFinite(CLOCK_SKEW_MIN) ? CLOCK_SKEW_MIN : 0) * 60_000;
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
// Điểm "ngồi chơi/chờ" (stage branch): 1 ở sân chùa + các điểm cũ + các điểm mở rộng 24/7,
// để khách tái sinh không rủ nhau đứng chơi ở sân chùa nữa (news 96).
// 'plaza' giờ là ngã tư (0,2) trên đường ngang; các điểm mở rộng đều là road node.
const BRANCH_SPOTS: Pt[] = [
  PLAZA_SPOT,
  { x: 28, z: 19.5 },  // quanYard — sân Quan Âm (Đông)
  { x: -35, z: 33 },   // restArea — khu nghỉ (Tây)
  { x: 11, z: 39 },    // denTrinh — Đền Trình (Nam, gần chợ)
  { x: -22, z: -26 },  // westMid — lối giữa (Tây)
  { x: -35.75, z: -27.25 },  // zenGarden — vườn Thiền (Tây)
  { x: -70, z: 5.5 },  // pavilion — đình ngắm sen
  { x: 80, z: -3 },    // bamboo — rừng trúc
  { x: 79, z: 28 },    // flowers — vườn hoa
];

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

// Đèn sân chùa cũ (-4/4, z 5/12) nằm trong hồ sen mở rộng (hồ z 4…24) nên đã bỏ;
// danh sách giữ rỗng để walkable() không phải đổi hình dạng.
const PLAZA_LAMPS: Pt[] = [];
const SOUTH_END = { x: BRIDGE.x, z: BRIDGE.z0 - 1.2 }, NORTH_END = { x: BRIDGE.x, z: BRIDGE.z1 + 1.2 };

/** Bán kính quét sân: quảng trường tròn cũ (PLAZA r 8.4) đã thành hồ sen, nên tiểu quét
 *  sân nay quét dải đường ngang z = 2 hai bên hồ (PATH_Z trong layout.ts). */
const SWEEP_PATH_Z = 2;
const SWEEP_PATH_X = 14;

const R = (a: number, b: number) => a + Math.random() * (b - a);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.z - b.z);

interface Npc {
  def: NpcDef; state: PlayerState; phase: Phase; until: number; speed: number;
  route: Pt[]; roam: number; side: number;
  mode: 'normal' | 'toAltar' | 'sitting' | 'leaving' | 'toRest' | 'resting' | 'toWork' | 'toChant' | 'chanting' | 'toSeatChant' | 'seatChant' | 'toLeave' | 'toIdleSeat' | 'idleSeat' | 'toIdleIncense' | 'idleIncense' | 'toIdleRest' | 'idleRest' | 'toDesk'; nextChat: number; chatIdx: number; rungKey: string; chantKey: string;
  stage: 'gate' | 'toAltar' | 'bow' | 'chant' | 'toPlaza' | 'plaza' | 'toGate' | 'toBranch' | 'branch' | 'toSeat' | 'seatChant' | 'toStroll' | 'stroll';
  shiftEnd: number; restEnd: number; bedId: 0 | 1 | null; chantSeat: ChantSeat | null; homeSlot: Behavior;
  tourStops: TourStop[]; tourIdx: number; tourPhase: number;
  gone: boolean; goneUntil: number;
}
export interface NpcChat { npcId: string; name: string; text: string }
export interface NpcRoom {
  npcs: Npc[]; lastTick: number; sleeping: boolean; outbox: NpcChat[]; fx: ({ id: string; kind: ActionKind; type?: 'action' } | { id: string; kind: 'bird' | 'fish'; type: 'release' })[]; lastTourBellAt: number; beds: (string | null)[]; seats: Map<string, string>;
  questGuard: Set<string>; chantRosterKey: string; chantRoster: Set<string>; left: string[]; joined: PlayerState[];
}

/** Ghế tụng: hàng đầu mỗi điện (đo từ code thật). S6 sẽ đặt đệm 3D đúng các tọa độ này. */
export interface ChantSeat { hall: 'chinhDien' | 'tamThe' | 'thienDuong' | 'dienMau' | 'nhaKhach'; x: number; z: number; ry: number }
export type TourKind = 'bell' | 'zen' | 'guest' | 'release' | 'nhaTo' | 'tower' | 'lotus' | 'bamboo' | 'duocSu' | 'ngoc';
export interface TourStop { kind: TourKind; seat?: ChantSeat }
export const CHANT_SEATS: ChantSeat[] = [
  { hall: 'chinhDien', x: -4.9, z: -35.2, ry: Math.PI },
  { hall: 'chinhDien', x: -3.4, z: -35.2, ry: Math.PI },
  { hall: 'chinhDien', x: 3.4, z: -35.2, ry: Math.PI },
  { hall: 'chinhDien', x: 4.9, z: -35.2, ry: Math.PI },
  { hall: 'chinhDien', x: -4.9, z: -33.4, ry: Math.PI },
  { hall: 'chinhDien', x: -3.4, z: -33.4, ry: Math.PI },
  { hall: 'chinhDien', x: 3.4, z: -33.4, ry: Math.PI },
  { hall: 'chinhDien', x: 4.9, z: -33.4, ry: Math.PI },
  { hall: 'tamThe', x: -4.7, z: -68.4, ry: Math.PI },
  { hall: 'tamThe', x: -3.2, z: -68.4, ry: Math.PI },
  { hall: 'tamThe', x: 3.2, z: -68.4, ry: Math.PI },
  { hall: 'tamThe', x: 4.7, z: -68.4, ry: Math.PI },
  { hall: 'thienDuong', x: -45, z: -27, ry: Math.PI / 2 },
  { hall: 'thienDuong', x: -43, z: -27, ry: Math.PI / 2 },
  { hall: 'dienMau', x: 37, z: 10, ry: Math.PI },
  { hall: 'dienMau', x: 39, z: 10, ry: Math.PI },
  { hall: 'nhaKhach', x: -48.1, z: -63.3, ry: Math.PI / 2 },
  { hall: 'nhaKhach', x: -45.9, z: -63.3, ry: -Math.PI / 2 },
  { hall: 'nhaKhach', x: -48.1, z: -61.9, ry: Math.PI / 2 },
  { hall: 'nhaKhach', x: -45.9, z: -61.9, ry: -Math.PI / 2 },
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

/** Bốc 1 phần tử theo trọng số. Dùng Math.random() để sim ghi đè theo seed vẫn đúng. */
function pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r < 0) return items[i]; }
  return items[items.length - 1];
}

/** Ca truc: 20 phut lam, 10 phut nghi (mac dinh cua prompt, khong phai spec). */
const SHIFT_MS = 20 * MIN;
const REST_MS = 10 * MIN;
/** NPC duoc nghi giuong: 4 chu tieu quet + tieu danh chuong. */
const REST_POOL = new Set<Behavior>(['sweepPlaza', 'sweepBridge', 'sweepZen', 'sweepRoad', 'bell']);
/** Hai giuong tang xa: giuong 0 o x = -67, giuong 1 o x = -61 (tam giuong z = -76.05).
 *  Nhà Tăng Xá nay ở (-64,-74) (layout.ts TANG_XA), nội thất giường ở local x ±3.0
 *  → đời world (-67, -61), z = TANG_XA.z - hz + 0.95 = -76.05. */
const BED_X = [-67, -61];
const BED_STAND_Z = -75.0;
const BED_Z = -76.05;
/** Deck corridors of the 24/7 water: lotus boardwalk on z = 2 (LOTUS) and the two
 *  east-river bridges (RIVER.bridges). Đi trên mặt cầu không bị coi là lội nước. */
const expansionRiverBridges: readonly number[] = RIVER.bridges;
const LOTUS_DECK_Z = 2;
const LOTUS_DECK_X0 = LOTUS.x - LOTUS.a - 2;
const LOTUS_DECK_X1 = LOTUS.x + LOTUS.a + 2;
/** Nut do thi de quay ve slot quet sau khi nghi. */
const HOME_NODE: Partial<Record<Behavior, string>> = { sweepPlaza: 'plaza', sweepBridge: 'bridgeS', sweepZen: 'zenGarden', sweepRoad: 'rearKT', bell: 'bellTower' };

export function createNpcRoom(now = Date.now()): NpcRoom {
  const npcs = NPC_DEFS.map((def, i): Npc => {
    const start: Pt = def.behavior === 'chant' ? (def.id === 'npc27' ? { x: -45, z: -27 } : { x: 37, z: 10 })
      : def.behavior === 'post' ? (def.post ?? (() => { throw new Error(`post NPC ${def.id} has no post`); })())
      : def.behavior === 'visitor' ? visitorSpot(nodePt('gate'), def)
      : def.behavior === 'wander' ? nodePt('plaza')
       : def.behavior === 'bell' ? nodePt('bellTower')
      : def.behavior === 'desk' ? { x: 32.6, z: 33 } // duty chair in Phong Ghi Cong Duc at (35,33), rotated +90 deg to face East (chair box local (0, -2.4) -> world (32.6, 33)), npc faces East (ry PI/2)
      : def.behavior === 'sweepZen' ? nodePt('zenGarden')
      : def.behavior === 'sweepRoad' ? nodePt('rearKT')
      : def.behavior === 'sweepBridge' ? { x: SOUTH_END.x - 1.5, z: SOUTH_END.z }
      : { x: PLAZA.x + 3, z: PLAZA.z - 2 };
    const inPool = REST_POOL.has(def.behavior);
    return {
      def, phase: 'idle', until: def.behavior === 'chant' ? now : now + R(1000, 3000) + i * 700, speed: 1.2, route: [], roam: 0, side: 0,
      mode: 'normal', nextChat: 0, chatIdx: 0, rungKey: '', chantKey: '', stage: 'gate',
      shiftEnd: inPool ? now + SHIFT_MS + i * 5 * MIN : 0, restEnd: 0, bedId: null, chantSeat: null, tourStops: [], tourIdx: 0, tourPhase: 0, homeSlot: def.behavior, gone: false, goneUntil: 0,
      state: { id: def.id, name: def.name, outfit: def.outfit, color: def.color, accessory: def.accessory ?? null, x: start.x, z: start.z, ry: def.behavior === 'desk' ? Math.PI / 2 : def.behavior === 'chant' ? (def.id === 'npc27' ? Math.PI / 2 : Math.PI) : def.behavior === 'post' ? (def.post && def.post.z >= 47 ? Math.PI : def.post?.x === -11 ? Math.PI / 2 : def.post?.x === 11 ? -Math.PI / 2 : def.post?.x === 0 ? Math.PI : 0) : Math.PI, anim: def.behavior === 'desk' || def.behavior === 'chant' ? 'sit' : 'idle', merit: 0, npc: true, role: def.role },
    };
  });
  spreadVisitors(npcs, now);
  const room: NpcRoom = { npcs, lastTick: now, sleeping: false, outbox: [], fx: [], lastTourBellAt: 0, beds: [null, null], seats: new Map(), questGuard: new Set(), chantRosterKey: '', chantRoster: new Set(), left: [], joined: [] };
  for (const n of npcs) {
    if (n.def.behavior !== 'chant') continue;
    const homeHall = n.def.id === 'npc27' ? 'thienDuong' : 'dienMau';
    const seat = CHANT_SEATS.find((s) => s.hall === homeHall);
    if (seat && takeSeat(room, seat, n.def.id)) n.chantSeat = seat;
  }
  return room;
}

// Rải NPC ngẫu nhiên lúc TẠO PHÒNG (mỗi lần tạo phòng = 1 bố cục khác; join không gọi lại).
// - Visitor: bốc thăm chặng khởi đầu: cổng (≤ 2 người) / trên tuyến (node ngoài trời + offset ±0,8 m)
//   / trong điện (bow|chant ở Chính Điện, hoặc branch ở sân). Tách ≥ 1,2 m với mọi NPC khác.
// - Wanderer (npc1/npc29): mỗi người 1 node WANDER_NODES khác nhau (bỏ 'gate'), cách nhau ≥ 3 m.
// Không đụng NPC cố định (vendor, desk, bell, chant, tiểu quét...).
// Rải khách đến cả các vùng mở rộng: mọi id ở đây đều là ROAD_NODES (gate-reachable).
// Các node trục giữ trọng số 1, node ngoại vi / Bắc / mở rộng ×3 (kéo ra khỏi trục).
const SPREAD_ROUTE_POOL = [
  'bridgeS', 'bridgeN', 'plaza', 'hallFront', 'axisMid', 'pillars', 'corrW', 'dienMau',
  'restArea', 'denTrinh', 'psPier', 'zenGarden', 'thienDuong', 'baoThap', 'tamThe',
  'westMid', 'eastMid', 'quanYard', 'buddhaYard', 'vuonCay',
  // Bổ sung 24/7: vườn rau, tăng xá/hộ tu, hồ sen + đình, sông/đồi hoa, Bắc núi.
  'farm', 'tinhThat1', 'tinhThat2', 'tinhThat3', 'tangXaDoor', 'lotusPavilion',
  'lotusBridgeS', 'bamboo', 'riverPathN', 'riverBridgeN', 'riverBridgeS',
  'duocSuDoor', 'flowerHill', 'ngocBase', 'ngocTop', 'cave', 'cemetery',
];
/** Node trục giữa: trọng số 1. Mọi node khác trong pool (Bắc/ngoại vi) có trọng số 3. */
const SPREAD_ROUTE_CENTER = ['bridgeS', 'bridgeN', 'plaza', 'hallFront', 'axisMid', 'pillars'];
/** Trọng số bốc node: giữa ×1, Bắc/ngoại vi ×3 (kéo visitor/wanderer mới sinh ra khỏi trục giữa). */
const spreadRouteWeight = (id: string): number => (SPREAD_ROUTE_CENTER.includes(id) ? 1 : 3);
/** Trọng số song song với SPREAD_ROUTE_POOL. */
const SPREAD_ROUTE_WEIGHTS = SPREAD_ROUTE_POOL.map(spreadRouteWeight);
const SPREAD_GATE_MAX = 2;
const SPREAD_MIN_GAP = 1.2;
/** Đặt 1 visitor vào chặng khởi đầu (cổng 10% / tuyến 40% / trong điện 50%). Trả true nếu đặt ở cổng. gateOk = còn chỗ ở cổng. */
function placeVisitor(npcs: Npc[], n: Npc, now: number, gateOk: boolean): boolean {
  const near = (x: number, z: number, self: Npc) =>
    npcs.some(o => o !== self && o.state && dist({ x, z }, { x: o.state.x, z: o.state.z }) < SPREAD_MIN_GAP);
  const okPt = (x: number, z: number, self: Npc) =>
    walkable({ x, z }) && !near(x, z, self);
  const toGate = (n: Npc) => {
    const p = visitorSpot(nodePt('gate'), n.def);
    n.state.x = p.x; n.state.z = p.z;
    n.stage = 'gate'; n.phase = 'idle'; n.state.anim = 'idle'; n.until = now + R(0, 2000);
  };
  const toInside = (n: Npc): void => {
    const s = n.state;
    // Chặng trong điện: branch 50%, bow 25%, chant 25% (bớt dồn về Chính Điện).
    const stage: Npc['stage'] = pickWeighted<Npc['stage']>(['branch', 'bow', 'chant'], [50, 25, 25]);
    // Điểm branch: plaza ×1, 5 điểm còn lại ×2.
    const branchWeights = BRANCH_SPOTS.map((b) => (dist(b, PLAZA_SPOT) < 1 ? 1 : 2));
    const p = visitorSpot(stage === 'branch' ? pickWeighted(BRANCH_SPOTS, branchWeights) : VISITOR_SPOT, n.def);
    s.x = p.x; s.z = p.z; s.ry = Math.PI; n.stage = stage;
    if (stage === 'branch') { n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(0, 5000); }
    else { n.phase = 'act'; s.anim = stage === 'bow' ? 'bow' : 'chant'; n.until = now + R(5000, 15000); }
  };
  const placeRoute = (n: Npc, id: string): boolean => {
    let base: { x: number; z: number };
    try { base = nodePt(id); } catch { return false; }
    if (!base) return false;
    for (let t = 0; t < 10; t++) {
      let x: number, z: number;
      if (t === 0) { x = base.x + R(-0.8, 0.8); z = base.z + R(-0.8, 0.8); }
      else { const a = Math.random() * Math.PI * 2; x = base.x + R(-0.8, 0.8) + Math.cos(a) * SPREAD_MIN_GAP * t * 0.5; z = base.z + R(-0.8, 0.8) + Math.sin(a) * SPREAD_MIN_GAP * t * 0.5; }
      if (okPt(x, z, n)) {
        n.state.x = x; n.state.z = z;
        n.stage = 'gate'; n.phase = 'idle'; n.state.anim = 'idle'; n.until = now + R(0, 2000);
        return true;
      }
    }
    return false;
  };
  const r = Math.random();
  const want = r < 0.1 ? 'gate' : r < 0.5 ? 'route' : 'inside';
  if (want === 'gate' && gateOk) { toGate(n); return true; }
  if (want === 'inside' || want === 'gate') { toInside(n); return false; }
  // trên tuyến
  if (placeRoute(n, pickWeighted(SPREAD_ROUTE_POOL, SPREAD_ROUTE_WEIGHTS))) return false;
  if (gateOk) { toGate(n); return true; }
  // Fallback cuối luôn thành công: visitorSpot cấp góc RIÊNG theo từng NPC,
  // nên không bao giờ trùng điểm với visitor khác và không để NPC kẹt ở cổng.
  toInside(n);
  return false;
}

function spreadVisitors(npcs: Npc[], now: number) {
  const near = (x: number, z: number, self: Npc) =>
    npcs.some(o => o !== self && o.state && dist({ x, z }, { x: o.state.x, z: o.state.z }) < SPREAD_MIN_GAP);

  // 1) Wanderer: 2 node khác nhau, cách nhau ≥ 3 m, bỏ 'gate'
  const wanderers = npcs.filter(n => n.def.behavior === 'wander');
  const wPool = WANDER_NODES.filter(id => id !== 'gate');
  // Node khởi đầu của wanderer: giữa ×1, Bắc/ngoại vi ×3 (như SPREAD_ROUTE_POOL).
  const wPoolWeights = wPool.map(spreadRouteWeight);
  const used: { x: number; z: number }[] = [];
  wanderers.forEach(n => {
    for (let t = 0; t < 20; t++) {
      const p = nodePt(pickWeighted(wPool, wPoolWeights));
      if (used.some(u => dist(u, p) < 3)) continue;
      if (!walkable(p)) continue;
      // Tách ≥ 1,2 m với MỌI NPC khác (kể cả NPC cố định như bell/sweepZen/sweepRoad)
      if (near(p.x, p.z, n)) continue;
      n.state.x = p.x; n.state.z = p.z; n.phase = 'idle';
      used.push(p);
      return;
    }
    // Hết 20 lần thử mà không có node hợp lệ: NPC giữ nguyên vị trí plaza mặc định.
    // Trường hợp này gần như không xảy ra vì còn nhiều node trống trong WANDER_NODES.
  });

  // 2) Visitor: bốc thăm chặng khởi đầu
  let atGate = 0;
  npcs.forEach(n => {
    if (n.def.behavior !== 'visitor') return;
    if (placeVisitor(npcs, n, now, atGate < SPREAD_GATE_MAX)) atGate++;
  });
}

/**
 * Vị trí hợp lệ: ngoài hồ sen / ao / sông, trong tường (có cổng bên ±92,z2),
 * và tránh vệt lát đèn ở sân trước điện. clampToCompound() đã xử lý tường mới
 * (WALL.x = 92, sideGateHalf = 2.2 ở shared/campus.ts) nên không hardcode ở đây.
 */
function walkable(p: Pt): boolean {
  if (inLake(p.x, p.z) || expansionWaterBlocked(p.x, p.z)) return false;
  const q = { x: p.x, z: p.z };
  clampToCompound(q);
  return q.x === p.x && q.z === p.z && PLAZA_LAMPS.every((l) => dist(l, p) > 1.1);
}

/** Public nodes the abbot wanders to (no transit nodes, no garden interior). */
const WANDER_NODES = [
  'gate', 'bridgeS', 'bridgeN', 'plaza', 'axisMid', 'hallFront', 'corrW', 'pillars',
  'drumTower', 'bellTower', 'quanYard', 'buddhaYard', 'denTrinh', 'restArea', 'dienMau',
  'baoThap', 'tamThe', 'zenGarden', 'thienDuong', 'psPier', 'rearKT', 'rearTO', 'rearW',
  'rearE', 'westMid', 'westNorth', 'eastMid', 'eastNorth',
  // 24/7 campus: destinations outside the old wall.
  'farm', 'farmGate', 'tinhThat1', 'tinhThat3', 'tangXaDoor', 'lotusPavilion',
  'lotusBridgeS', 'sideGateW', 'sideGateE', 'bamboo', 'riverPathN', 'riverBridgeN',
  'duocSuDoor', 'flowerHill', 'ngocBase', 'ngocTop', 'cave', 'cemetery',
];
/** Bell-roam cycle destinations (npc4 spawns at bellTower, so the cycle starts by leaving it). */
const BELL_ROAM = ['corrW', 'pillars', 'corrW', 'bellTower'];
/** ms until the next time in BELL_TIMES (VN clock); wraps to tomorrow's first bell. */
function nextBellIn(now: number): number {
  const { dayMs } = vnClock(now);
  for (const b of BELL_TIMES) { const d = b * MIN - dayMs; if (d > 0) return d; }
  return (BELL_TIMES[0] + 24 * 60) * MIN - dayMs;
}

const WANDER_WEST = ['drumTower', 'zenGarden', 'thienDuong', 'westMid', 'westNorth', 'rearKT', 'rearW', 'baoThap', 'buddhaYard', 'farm', 'tangXaDoor', 'tinhThat1', 'tinhThat3', 'lotusPavilion', 'sideGateW', 'cave'];
const WANDER_EAST = ['bellTower', 'denTrinh', 'restArea', 'dienMau', 'psPier', 'eastMid', 'eastNorth', 'rearTO', 'rearE', 'quanYard', 'bamboo', 'riverBridgeS', 'riverBridgeN', 'duocSuDoor', 'flowerHill', 'sideGateE', 'cemetery', 'ngocTop'];
/** Node phía Bắc (không tính tamThe): wanderer ở giữa bốc các node này ×3. */
const WANDER_NORTH = ['baoThap', 'zenGarden', 'thienDuong', 'rearKT', 'rearTO', 'westNorth', 'eastNorth', 'ngocBase', 'ngocTop', 'cave', 'cemetery'];
/** NPC cư trú phía Bắc (Sư Phó): node Bắc và tamThe ×4 bất kể đang đứng ở đâu. */
const WANDER_NORTH_RESIDENT_ID = 'npc29';
/** Bốc node đích cho wanderer: ở Tây/Đông thì node cùng bên ×6, tamThe ×2, node giữa ×1, node bên kia ×1; ở giữa thì tamThe ×4, node Bắc ×3, node Tây/Đông còn lại ×2, node giữa ×1. npc29 luôn ưu tiên node Bắc ×4. */
function pickWanderNode(cur: Pt, npcId = ''): string {
  const side = cur.x < -8 ? 'west' : cur.x > 8 ? 'east' : 'mid';
  const weight = (id: string): number => {
    const isNorth = id === 'tamThe' || WANDER_NORTH.includes(id);
    const inW = WANDER_WEST.includes(id);
    const inE = WANDER_EAST.includes(id);
    // Trọng số gốc: giữ nguyên mọi thiên vị bên / Bắc / cư trú như trước.
    let base: number;
    if (npcId === WANDER_NORTH_RESIDENT_ID && isNorth) base = 4;
    else if (side === 'west') base = id === 'tamThe' ? 2 : inW ? 6 : 1;
    else if (side === 'east') base = id === 'tamThe' ? 2 : inE ? 6 : 1;
    else if (id === 'tamThe') base = 4;
    else if (WANDER_NORTH.includes(id)) base = 3;
    else base = inW || inE ? 2 : 1;
    // Hệ số gần 30/(30 + khoảng cách): node cách 10 m ~0,75, cách 60 m ~0,33. Ưu tiên node gần để chặng đi bộ ngắn, ít cắt qua trục giữa.
    return base * (30 / (30 + dist(cur, nodePt(id))));
  };
  const w = WANDER_NODES.map(weight);
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return WANDER_NODES[i]; }
  return WANDER_NODES[WANDER_NODES.length - 1];
}

function pickDest(n: Npc): { to: Pt; route: Pt[] } | null {
  const cur = n.state;
  for (let tries = 0; tries < 12; tries++) {
    switch (n.def.behavior) {
      case 'wander': {
        const id = pickWanderNode(cur, n.def.id);
        const to = nodePt(id);
        if (dist(to, cur) < 0.8) continue;
        return { to, route: routeFrom(cur, id) };
      }
      case 'sweepPlaza': {
        // Quảng trường tròn đã bị hồ sen lấn; quét dải đường ngang z=2 trong khuôn viên,
        // bỏ vùng hồ và giữ trong ±SWEEP_PATH_X để không rơi vào bãi cỏ ngoài đường.
        const a = R(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 6;
        const p = { x: Math.cos(a) * r * 2.2, z: SWEEP_PATH_Z + Math.sin(a) * r * 0.18 };
        if (Math.abs(p.x) > SWEEP_PATH_X || dist(p, cur) < 0.8 || !walkable(p)) continue;
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
        // The garden ring moved out to x = ±59 with the 24/7 campus.
        const west = cur.x < 0;
        const sideNode = west ? 'rearKT' : 'rearTO';
        const x = west ? R(-57, -22) : R(22, 57);
        const p = { x, z: -46 + R(-1, 1) };
        if (dist(p, cur) < 0.8 || !walkable(p)) continue;
        return { to: p, route: [...routeFrom(cur, sideNode), p] };
      }
      default: return null;
    }
  }
  return null;
}

/** Ghế gỗ bồ đề ở (35.5, 20). seatY = đỉnh tấm ngồi của wooden_bench.glb (0.55)
 *  × scale buildInstance (1.125) = 0.61875 ≈ 0.619. Đây là cao độ tuyệt đối để
 *  NPC ngồi đúng mặt ghế thay vì xếp bằng dưới đất. */
const BODHI_BENCH = { x: 35.5, z: 20, seatY: 0.619 };

function startWalk(n: Npc, route: Pt[], speed: number) {
  n.route = route; n.speed = speed; n.phase = 'walk'; n.state.anim = 'walk';
  // rời khỏi ghế/bục: bỏ cao độ đặc biệt để không lơ lửng khi đứng dậy
  n.state.y = undefined;
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

/** Visitor branch points after chant: pier, merit desk, Tam The, north-east and
 *  north-west rear roads, Quan Âm, and the 24/7 expansion (lotus / bamboo / summit).
 *  Tất cả là ROAD_NODES, đi lại bằng routeFrom() nên không cắt qua hồ hay tường. */
const VISITOR_BRANCH = [
  'psPier', 'phongCDDoor', 'tamThe', 'rearKT', 'rearTO', 'quanYard',
  'restArea', 'lotusPavilion', 'bamboo', 'flowerHill', 'duocSuDoor', 'ngocBase',
] as const;
/** Trọng số song song với VISITOR_BRANCH: tamThe ×3, rearKT/rearTO/quanYard ×2, psPier/phongCDDoor ×1. Các điểm mở rộng ×1–2 để không lấn át khu cũ. */
const VISITOR_BRANCH_WEIGHTS = [1, 1, 3, 2, 2, 2, 1, 2, 2, 1, 1, 1];
/** Trọng số điểm branch từ vị trí s: trọng số gốc × 30/(30 + khoảng cách từ s). Điểm gần được ưu tiên để chặng đi bộ tới branch ngắn lại, ít cắt qua trục giữa; thiên vị Bắc (tamThe ×3) vẫn giữ. Hằng 30 (m) là khoảng cách mà tại đó hệ số gần giảm còn một nửa. */
function branchWeight(s: Pt, id: (typeof VISITOR_BRANCH)[number]): number {
  return VISITOR_BRANCH_WEIGHTS[VISITOR_BRANCH.indexOf(id)] * (30 / (30 + dist(s, nodePt(id))));
}

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
  const walk = inNhaKhach(n.state) ? nkExit('gate') : routeFrom(n.state, 'gate');
  // Về cổng thì đi nhanh hơn (×1,5) để rút ngắn thời gian đi bộ qua trục giữa.
  startWalk(n, [...walk, visitorSpot(nodePt('gate'), n.def)], visitorSpeed(n.def) * 1.5);
}

function visitorArrive(room: NpcRoom, n: Npc, now: number) {
  const s = n.state;
  if (n.stage === 'toAltar') { n.stage = 'bow'; n.phase = 'act'; s.anim = 'bow'; n.until = now + 3200; s.ry = Math.PI; }
  else if (n.stage === 'toBranch') { n.stage = 'branch'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(20_000, 45_000); }
  else if (n.stage === 'toPlaza') { n.stage = 'plaza'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(4000, 8000); }
  else if (n.stage === 'toSeat') {
    n.stage = 'seatChant'; n.mode = 'seatChant'; n.phase = 'act'; s.anim = 'chant';
    s.ry = n.chantSeat ? n.chantSeat.ry : Math.PI;
    n.until = now + 30_000;
  }
  else if (n.stage === 'toStroll') {
    if (room.questGuard.has(n.def.id)) cancelTour(room, n, now);
    else tourBegin(room, n, now);
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
/** Tour sau khi tung: các điểm cũ + mở rộng 24/7 (hồ sen, rừng trúc, Điện Dược Sư, Chùa Ngọc). */
const STROLL_CHANCE = 0.9; // ~90% khách đi tour, 10% về thẳng để cổng không vắng (vòng 2: tăng từ 0.75 để kéo dài thời gian ở ngoại vi)
const TOUR_STOP_MIN = 3; // số điểm dừng tối thiểu mỗi tour (vòng 2: từ 2)
const TOUR_STOP_MAX = 4; // số điểm dừng tối đa mỗi tour (vòng 2: từ 3)
const TOUR_BELL_GAP_MS = 20_000;
const BELL_SPOT: Pt = { x: 34, z: -6 }; // BELL moved to +34,-6 in layout.ts
let tourReleaseBird = false;
const via = (from: Pt, id: string, ...tail: Pt[]): Pt[] => { const r = routeFrom(from, id); return r.length ? [...r, ...tail] : []; };
function bellOk(room: NpcRoom, now: number): boolean {
  if (now - room.lastTourBellAt < TOUR_BELL_GAP_MS || activeBell(now)) return false;
  const bell = room.npcs.find((m) => m.def.id === 'npc4');
  return !(bell && !bell.gone && dist(bell.state, BELL_SPOT) < 1.5);
}
function pickFreeSeat(room: NpcRoom, hall: ChantSeat['hall']): ChantSeat | undefined {
  const free = CHANT_SEATS.filter((s) => s.hall === hall && !room.seats.has(seatKey(s)));
  return free.length ? free[Math.floor(Math.random() * free.length)] : undefined;
}
const NK_DOOR: Pt = { x: -47, z: -56.55 };
const NK_OUT: Pt = { x: -47, z: -55.5 };
const NK_MID: Pt = { x: -34, z: -56 };
const inNhaKhach = (p: Pt) => p.x > -51.6 && p.x < -42.4 && p.z > -64.25 && p.z < -57.75;
const nkVia = (id: string, ...tail: Pt[]): Pt[] => { const r = routeFrom(NK_MID, id); return r.length ? [NK_DOOR, NK_OUT, NK_MID, ...r, ...tail] : []; };
const nkExit = (id: string): Pt[] => [NK_DOOR, NK_OUT, NK_MID, ...routeFrom(NK_MID, id)];
function tourRoute(from: Pt, st: TourStop): Pt[] {
  const inside = inNhaKhach(from);
  const go = (id: string, ...tail: Pt[]): Pt[] => (inside ? nkVia(id, ...tail) : via(from, id, ...tail));
  switch (st.kind) {
    case 'bell': return go('bellTower');
    case 'zen': return st.seat ? go('thienDuong', { x: st.seat.x, z: st.seat.z }) : [];
    case 'guest': return st.seat ? (inside ? [{ x: st.seat.x, z: st.seat.z }] : via(from, 'ktIn', { x: -47, z: -55.5 }, { x: -47, z: -56.55 }, { x: st.seat.x, z: st.seat.z })) : [];
    case 'release': return go('psPier');
    case 'nhaTo': return go('toYard', { x: 36, z: -67.5 });
    case 'tower': return go('toYard', { x: 43.6, z: -58.6 });
    // 24/7: walk to the new landmarks on the shared road graph (no straight cut).
    case 'lotus': return go('lotusPavilion');
    case 'bamboo': return go('bamboo');
    case 'duocSu': return go('duocSuDoor');
    case 'ngoc': return go('ngocTop');
  }
}
function dropSeat(room: NpcRoom, n: Npc, st: TourStop) {
  if (st.seat && room.seats.get(seatKey(st.seat)) === n.def.id) room.seats.delete(seatKey(st.seat));
}
function resetTour(n: Npc) { n.tourStops = []; n.tourIdx = 0; n.tourPhase = 0; }
/** Leave the tour for the gate; gives back every cushion still held. */
function endTour(room: NpcRoom, n: Npc) {
  releaseSeat(room, n.def.id); resetTour(n);
  leaveToGate(n);
}
/** Quest arrived mid-tour: cancel and stay at the gate, like the old stroll. */
function cancelTour(room: NpcRoom, n: Npc, now: number) {
  releaseSeat(room, n.def.id); resetTour(n);
  n.mode = 'normal'; n.stage = 'gate'; n.phase = 'idle'; n.state.anim = 'idle'; n.until = now + R(5000, 9000);
}
/** Walk to the current stop; stops with no route are skipped. */
function tourGo(room: NpcRoom, n: Npc) {
  while (n.tourIdx < n.tourStops.length) {
    const st = n.tourStops[n.tourIdx];
    const route = tourRoute(n.state, st);
    if (route.length) { n.mode = 'normal'; n.stage = 'toStroll'; startWalk(n, route, visitorSpeed(n.def)); return; }
    dropSeat(room, n, st); n.tourIdx++;
  }
  endTour(room, n);
}
function tourNext(room: NpcRoom, n: Npc) {
  const st = n.tourStops[n.tourIdx];
  if (st) dropSeat(room, n, st);
  n.tourIdx++; n.tourPhase = 0;
  tourGo(room, n);
}
/** Arrived at the stop: start its activity. */
function tourBegin(room: NpcRoom, n: Npc, now: number) {
  const s = n.state, st = n.tourStops[n.tourIdx];
  if (!st) { endTour(room, n); return; }
  n.stage = 'stroll'; n.mode = 'normal'; n.tourPhase = 0;
  if (st.kind === 'bell') {
    if (!bellOk(room, now)) { tourNext(room, n); return; }
    room.lastTourBellAt = now; n.phase = 'act'; s.anim = 'ring'; n.until = now + 10_000;
  } else if (st.kind === 'zen' || st.kind === 'guest') {
    n.phase = 'act'; s.anim = 'sit'; if (st.seat) s.ry = st.seat.ry; n.until = now + R(30_000, 60_000);
  } else {
    s.ry = st.kind === 'release' ? Math.PI / 2 : Math.PI;
    n.phase = 'act'; s.anim = 'bow'; n.until = now + (st.kind === 'release' ? 2000 : 3000);
  }
}
function startStroll(room: NpcRoom, n: Npc, now: number) {
  if (room.questGuard.has(n.def.id) || Math.random() >= STROLL_CHANCE) { leaveToGate(n); return; }
  const west: TourKind[] = ['bell', 'zen', 'guest', 'lotus', 'ngoc'];
  const east: TourKind[] = ['release', 'nhaTo', 'tower', 'bamboo', 'duocSu'];
  const shuffle = (a: TourKind[]): TourKind[] => {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const westFirst = Math.random() < 0.5;
  const kinds: TourKind[] = westFirst ? shuffle(west).concat(shuffle(east)) : shuffle(east).concat(shuffle(west));
  const want = TOUR_STOP_MIN + Math.floor(Math.random() * (TOUR_STOP_MAX - TOUR_STOP_MIN + 1));
  const stops: TourStop[] = [];
  for (const kind of kinds) {
    if (stops.length >= want) break;
    if (kind === 'bell') { if (bellOk(room, now)) stops.push({ kind }); }
    else if (kind === 'zen' || kind === 'guest') {
      const seat = pickFreeSeat(room, kind === 'zen' ? 'thienDuong' : 'nhaKhach');
      if (seat && takeSeat(room, seat, n.def.id)) stops.push({ kind, seat });
    } else stops.push({ kind });
  }
  if (!stops.length) { leaveToGate(n); return; }
  n.tourStops = stops; n.tourIdx = 0; n.tourPhase = 0;
  tourGo(room, n);
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
      if (Math.random() < 0.6) {
        const t = pickWeighted(VISITOR_BRANCH, VISITOR_BRANCH.map((id) => branchWeight(s, id)));
        n.stage = 'toBranch'; startWalk(n, routeFrom(s, t), 1.2);
      } else { n.stage = 'toPlaza'; startWalk(n, [...routeFrom(s, 'plaza'), visitorSpot(PLAZA_SPOT, n.def)], visitorSpeed(n.def)); }
      break;
    }
    case 'toPlaza': n.stage = 'toPlaza'; startWalk(n, [...routeFrom(s, 'plaza'), visitorSpot(PLAZA_SPOT, n.def)], visitorSpeed(n.def)); break;
    case 'branch': {
      // Điểm vừa ở = điểm branch cách NPC ≤ 3 m; bỏ nó khi bốc điểm kế tiếp.
      const others = VISITOR_BRANCH.filter((id) => dist(nodePt(id), s) > 3);
      if (others.length > 0 && Math.random() < 0.5) {
        // 50%: đi tiếp 1 branch point khác (không về cổng ở bước này).
        const t = pickWeighted(others, others.map((id) => branchWeight(s, id)));
        n.stage = 'toBranch'; startWalk(n, routeFrom(s, t), 1.2);
      } else { n.stage = 'toPlaza'; startWalk(n, [...routeFrom(s, 'plaza'), visitorSpot(PLAZA_SPOT, n.def)], visitorSpeed(n.def)); }
      break;
    }
    case 'stroll': {
      if (room.questGuard.has(n.def.id)) { cancelTour(room, n, now); break; }
      const st = n.tourStops[n.tourIdx];
      if (st && n.tourPhase === 0 && (st.kind === 'release' || st.kind === 'nhaTo' || st.kind === 'tower'
        || st.kind === 'duocSu' || st.kind === 'ngoc')) {
        n.tourPhase = 1; n.phase = 'act';
        if (st.kind === 'release') {
          tourReleaseBird = !tourReleaseBird;
          s.anim = 'idle'; n.until = now + 3000;
          room.fx.push({ id: n.def.id, kind: tourReleaseBird ? 'bird' : 'fish', type: 'release' });
        } else {
          s.anim = 'incense'; n.until = now + 7000;
          room.fx.push({ id: n.def.id, kind: 'incense' });
        }
        break;
      }
      tourNext(room, n);
      break;
    }
    case 'toStroll': {
      if (room.questGuard.has(n.def.id)) { cancelTour(room, n, now); break; }
      // Walk to the stop was aborted (blocked): drop the stop and move on.
      tourNext(room, n);
      break;
    }
    case 'plaza':
      // 50% đi thêm 1 vòng branch ở ngoại vi trước khi về cổng (vòng 2)
      if (Math.random() < 0.5) {
        const bid = pickWeighted(VISITOR_BRANCH, VISITOR_BRANCH.map((id) => branchWeight(s, id)));
        n.stage = 'toBranch';
        startWalk(n, [...routeFrom(s, bid), visitorSpot(nodePt(bid), n.def)], visitorSpeed(n.def));
        break;
      }
      n.stage = 'toGate'; startWalk(n, [...routeFrom(s, 'gate'), visitorSpot(nodePt('gate'), n.def)], visitorSpeed(n.def)); break;
    case 'toGate': n.stage = 'toGate'; startWalk(n, [...routeFrom(s, 'gate'), visitorSpot(nodePt('gate'), n.def)], visitorSpeed(n.def)); break;
  }
}

/** Tuyen di nghi: theo do thi toi xa dac ngang (-59,-59.5), vao Tang Xa moi
 *  qua tangXaJct (-59,-68.3) → cua Nam (-64,-70.5), roi toi giuong. */
function restRoute(n: Npc): Pt[] {
  const bedX = BED_X[n.bedId ?? 0];
  return [...routeFrom(n.state, 'tangxaMid'), nodePt('tangXaJct'), nodePt('tangXaDoor'), { x: bedX, z: BED_STAND_Z }, { x: bedX, z: BED_Z }];
}
/** Tuyen di lam: nguoc lai, tu tam giuong ra cua Nam roi theo do thi ve slot quet. */
function workRoute(n: Npc, bedX: number): Pt[] {
  return [{ x: bedX, z: BED_STAND_Z }, nodePt('tangXaDoor'), nodePt('tangXaJct'), ...routeFrom(nodePt('tangxaMid'), HOME_NODE[n.homeSlot] ?? 'plaza')];
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
/** Trả giường nếu NPC đang giữ (dùng khi tuyến đi nghỉ/làm bị chặn). */
function releaseBed(room: NpcRoom, n: Npc) {
  if (n.bedId !== null) { room.beds[n.bedId] = null; n.bedId = null; }
}
/** Day khoi giuong: tra giuong, di ve slot quet (tieu danh chuong ve thap). */
function wakeNpc(room: NpcRoom, n: Npc, now: number) {
  const bedX = BED_X[n.bedId ?? 0];
  releaseBed(room, n);
  n.mode = 'toWork';
  startWalk(n, workRoute(n, bedX), 1.2);
}

/** In-place random action for a post NPC (vendor / hall keeper). Never walks away. */
function postIdleAct(n: Npc, now: number) {
  const s = n.state;
  const r = Math.random();
  if (r < 0.5) { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 5000; }
  else if (r < 0.7) { n.phase = 'act'; s.anim = 'bow'; n.until = now + 3000; }
  else if (r < 0.9) { n.phase = 'act'; s.anim = 'chant'; n.until = now + R(5000, 8000); }
  else { n.phase = 'idle'; s.anim = 'idle'; s.ry = R(0, Math.PI * 2); n.until = now + R(4000, 9000); }
}

/** Diem thap huong cho NPC ranh (via = road node di toi truoc, roi di thang). Nha To
    chua co vi tri nay vi chua xac minh duoc duong vao trong nha. */
interface IdleIncenseSpot { x: number; z: number; via: string }
const IDLE_INCENSE: IdleIncenseSpot[] = [
  { x: -1.8, z: -34, via: 'hallIn' },
  { x: 0, z: -11.3, via: 'plaza' },
  { x: 0, z: -71.3, via: 'tamThe' },
  { x: 43.6, z: -58.6, via: 'toYard' },
];
/** Diem ngoi nghi mat dat phang (khong dung zenGarden: mat cat cao hon groundY). */
const IDLE_REST_NODES = ['restArea', 'restEast', 'restSE', 'quanYard', 'buddhaYard'];
function incenseRoute(n: Npc, spot: IdleIncenseSpot): Pt[] {
  const p = { x: spot.x + (n.def.id === 'npc29' ? -1.4 : 1.4), z: spot.z };
  if (spot.via === 'hallIn' && inChinhDien(n.state)) return [p];
  return [...routeFrom(n.state, spot.via), p];
}

// Phòng Ghi Công Đức nay ở (35,33) (layout.ts PHONG_CD) và giữ nguyên phép quay +π/2,
// nên cả vòng đi và ghế trực chỉ dịch theo (+77, −2) so với vị trí cũ (−42,35).
const NPC6_SPOTS = {
  ring: [
    { x: 31.8, z: 29.0 }, { x: 36.0, z: 28.8 }, { x: 38.0, z: 29.2 }, { x: 38.0, z: 32.5 },
    { x: 40.5, z: 33.0 }, { x: 35.5, z: 33.6 }, { x: 35.0, z: 36.6 }, { x: 31.8, z: 36.2 },
  ], // 0 A, 1 B, 2 C, 3 D, 4 E porch (east door), 5 F, 6 F2, 7 G
  chair: { x: 32.6, z: 33 },
  sitAt: [0, 1, 5, 6, 7],
  // waypoints (ring indices) from a sit spot to the nearer of A/G, none cross the desk rect
  via: { 0: [], 1: [0], 5: [6, 7], 6: [7], 7: [] } as Record<number, number[]>,
  porchP: 0.2,
};
const npc6State = new WeakMap<Npc, { i: number; porchDone: boolean; seated: boolean; toChair: boolean; sitIn: number }>();
function npc6St(n: Npc) {
  let st = npc6State.get(n);
  if (!st) { st = { i: -1, porchDone: false, seated: true, toChair: false, sitIn: R(6, 10) }; npc6State.set(n, st); } // spawns seated
  return st;
}
function npc6Arrive(n: Npc, s: PlayerState, now: number) {
  const st = npc6St(n);
  n.phase = 'idle';
  if (st.toChair) {
    st.toChair = false; st.seated = true; n.mode = 'sitting';
    s.anim = 'sit'; s.ry = Math.PI / 2; n.until = now + R(40000, 60000);
    return;
  }
  n.mode = 'normal'; s.anim = 'idle'; n.until = now + R(5000, 10000);
}
function npc6Decide(n: Npc, s: PlayerState, now: number) {
  const st = npc6St(n), P = NPC6_SPOTS, ring = P.ring;
  if (st.seated) { // leave the chair via the nearer of A/G
    st.seated = false;
    st.i = dist(P.chair, ring[0]) < dist(P.chair, ring[7]) ? 0 : 7;
    n.mode = 'normal';
    startWalk(n, [ring[st.i]], 1.0);
    return;
  }
  if (P.sitAt.includes(st.i)) {
    st.sitIn--;
    if (st.sitIn <= 0) {
      st.sitIn = R(6, 10);
      st.toChair = true; n.mode = 'toDesk';
      startWalk(n, [...P.via[st.i].map(k => ring[k]), P.chair], 1.0);
      return;
    }
  }
  let next: number;
  if (st.i === 3) {
    if (!st.porchDone && Math.random() < P.porchP) { st.porchDone = true; next = 4; } else next = 5;
  } else if (st.i === 4) next = 3;
  else next = (st.i + 1) % 8;
  if (next === 0) st.porchDone = false;
  st.i = next; n.mode = 'normal';
  startWalk(n, [ring[next]], 1.0);
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
  if (n.def.behavior === 'desk') { npc6Arrive(n, s, now); return; }
  if (n.def.behavior === 'post' && n.mode !== 'toChant') { postIdleAct(n, now); return; }
  if (n.mode === 'toChant') {
    const seat = n.chantSeat;
    n.mode = 'chanting'; n.phase = 'act'; s.anim = 'chant';
    s.ry = seat ? seat.ry : Math.PI;
    // Đang trong buổi tụng: ngồi đến hết buổi để chính điện đông suốt thời khóa.
    const ses = activeSession(now);
    n.until = ses ? ses.endsAt : now + R(300_000, 600_000);
    return;
  }
  if (n.def.behavior === 'wander' && n.mode === 'toIdleSeat') {
    const seat = n.chantSeat;
    n.mode = 'idleSeat'; n.phase = 'act'; s.anim = 'chant';
    s.ry = seat ? seat.ry : Math.PI; n.until = now + R(30_000, 60_000);
    return;
  }
  if (n.def.behavior === 'wander' && n.mode === 'toIdleIncense') {
    n.mode = 'idleIncense'; n.phase = 'act'; s.anim = 'incense';
    s.ry = Math.PI; n.until = now + 7000;
    room.fx.push({ id: n.def.id, kind: 'incense' });
    return;
  }
  if (n.def.behavior === 'wander' && n.mode === 'toIdleRest') {
    n.mode = 'idleRest'; n.phase = 'act'; s.anim = 'sit'; n.until = now + R(30_000, 60_000);
    // Ghế bồ đề (35.5, 20): snap đúng tâm ghế, quay mặt ra hồ (hướng Tây),
    // và nâng lên đúng mặt ghế. Các điểm nghỉ mặt đất khác KHÔNG đặt y.
    if (Math.hypot(s.x - BODHI_BENCH.x, s.z - BODHI_BENCH.z) < 0.6) {
      s.x = BODHI_BENCH.x; s.z = BODHI_BENCH.z; s.ry = -Math.PI / 2; s.y = BODHI_BENCH.seatY;
    }
    return;
  }
  if (n.def.behavior === 'wander' && n.mode !== 'normal') return abbotArrive(n, now);
  if (n.def.behavior === 'wander') {
    const r = Math.random();
    if (r < 0.25) { n.phase = 'act'; s.anim = 'bow'; n.until = now + 3000; }
    else if (r < 0.5) { n.phase = 'act'; s.anim = 'chant'; n.until = now + 2500; }
    else if (r < 0.6) {
      const halls = ['chinhDien', 'tamThe', 'thienDuong', 'dienMau'] as const;
      const start = Math.floor(Math.random() * halls.length);
      let seat: ChantSeat | undefined;
      for (let i = 0; i < halls.length && !seat; i++) seat = nearestFreeSeat(room, halls[(start + i) % halls.length], n.state);
      if (seat && takeSeat(room, seat, n.def.id)) {
        n.chantSeat = seat; n.mode = 'toIdleSeat';
        startWalk(n, seatRoute(n, seat), 1.2);
      } else { n.phase = 'act'; s.anim = 'bow'; n.until = now + 3000; }
    }
    else if (r < 0.75) {
      const spot = IDLE_INCENSE[Math.floor(Math.random() * IDLE_INCENSE.length)];
      n.mode = 'toIdleIncense';
      startWalk(n, incenseRoute(n, spot), 1.2);
    }
    else if (r < 0.85) {
      const node = (n.def.id === 'npc37' && Math.random() < 0.6)
        ? 'bodhiTree'
        : IDLE_REST_NODES[Math.floor(Math.random() * IDLE_REST_NODES.length)];
      n.mode = 'toIdleRest';
      startWalk(n, routeFrom(n.state, node), 1.2);
    }
    else { n.phase = 'idle'; s.anim = 'idle'; s.ry = R(0, Math.PI * 2); n.until = now + R(10_000, 20_000); }
    // Đang đứng/làm hành động tại chỗ trong 3 m quanh Tam Thế thì ở lại thêm 20-60 s.
    // Chỉ áp dụng khi không đi bộ tới ghế/hương/nghỉ (mode vẫn 'normal').
    if (n.mode === 'normal' && (n.phase === 'act' || n.phase === 'idle') && dist(s, nodePt('tamThe')) < 3) n.until += R(20_000, 60_000);
    return;
  }
  if (n.def.behavior === 'bell') {
    const r = Math.random();
    if (r < 0.25) { n.phase = 'act'; s.anim = 'bow'; n.until = now + 3000; }
    else if (r < 0.5) { n.phase = 'act'; s.anim = 'chant'; n.until = now + R(5000, 8000); }
    else { n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(5000, 15000); }
    return;
  }
  if (n.def.behavior === 'sweepPlaza' || n.def.behavior === 'sweepBridge' || n.def.behavior === 'sweepZen' || n.def.behavior === 'sweepRoad') {
    const r = Math.random();
    if (r < 0.15) { n.phase = 'act'; s.anim = 'bow'; n.until = now + 3000; }
    else if (r < 0.3) { n.phase = 'act'; s.anim = 'chant'; n.until = now + R(5000, 8000); }
    else { n.phase = 'act'; s.anim = 'sweep'; n.until = now + R(6000, 12000); }
  } else {
    n.phase = 'act'; s.anim = 'sweep'; n.until = now + R(6000, 12000);
  }
}

function decide(room: NpcRoom, n: Npc, now: number) {
  const s = n.state;
  // #6: tuyến đi tụng/nghỉ/làm bị chặn (step() đã xóa route, phase về idle)
  // mà mode vẫn kẹt ở toChant/toRest/toWork → nhả ghế/giường, về normal.
  // phase 'idle' + mode đang đi chỉ xảy ra sau abort: startWalk luôn đặt
  // phase 'walk', arrive() luôn đổi mode.
  if (n.phase === 'idle' && (n.mode === 'toChant' || n.mode === 'toRest' || n.mode === 'toWork')) {
    if (n.mode === 'toChant') { releaseSeat(room, n.def.id); n.chantSeat = null; }
    if (n.mode === 'toRest' || n.mode === 'toWork') releaseBed(room, n);
    // toRest: như trường hợp hết giường trong tryRest — thử lại sau 60 giây,
    // không để runSchedule gọi tryRest lại ngay tick sau (vòng lặp abort).
    if (n.mode === 'toRest') n.shiftEnd = now + 60_000;
    // toWork: như arrive() của toWork — bắt đầu ca mới.
    if (n.mode === 'toWork') n.shiftEnd = now + SHIFT_MS;
    n.route = []; n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(1000, 3000);
    return;
  }
  if (n.def.behavior === 'desk') { npc6Decide(n, s, now); return; }
  if (n.def.behavior === 'post') { postIdleAct(n, now); return; }
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
  if (n.def.behavior === 'wander' && (n.mode === 'toIdleSeat' || n.mode === 'idleSeat' || n.mode === 'toIdleIncense' || n.mode === 'idleIncense' || n.mode === 'toIdleRest' || n.mode === 'idleRest')) {
    if (n.chantSeat) { releaseSeat(room, n.def.id); n.chantSeat = null; }
    n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(1000, 3000);
    s.y = undefined; // rời ghế bồ đề: trả về cao độ mặt đất
    return;
  }
  if (n.def.behavior === 'wander' && n.mode !== 'normal') return abbotDecide(n, now);
  const slow = n.def.behavior !== 'wander';
  if (n.phase === 'act' && !slow) { n.phase = 'idle'; s.anim = 'idle'; n.until = now + R(3000, 8000); return; }
  const d = pickDest(n);
  if (!d) { n.phase = 'idle'; s.anim = 'idle'; n.until = now + 2000; return; }
  startWalk(n, d.route, slow ? 0.6 : 1.2);
}

/** Luân phiên tụng kinh: mỗi buổi một nhóm tăng ni + người bán khác nhau (deterministic). */
const MONK_POOL = ['npc2', 'npc3', 'npc7', 'npc8', 'npc13', 'npc14'];
const VENDOR_POOL = ['npc15', 'npc16', 'npc17', 'npc18', 'npc30', 'npc31', 'npc32', 'npc33', 'npc34', 'npc36'];
/** Số thứ tự buổi tụng từ key `${day}:${id}`: day*3 + ord (sang 0, trua 1, toi 2). */
function sessionIdxOf(key: string): number {
  const [d, id] = key.split(':');
  const ord = id === 'sang' ? 0 : id === 'trua' ? 1 : 2;
  return (parseInt(d, 10) || 0) * 3 + ord;
}
/** Liệt kê mọi cặp trong pool theo thứ tự từ điển (tăng: 15 cặp, vendor: 45 cặp). */
function pairsOf(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j]);
  return out;
}
const MONK_PAIRS = pairsOf(MONK_POOL.length);
const VENDOR_PAIRS = pairsOf(VENDOR_POOL.length);
/** Roster buổi tụng này: 2 sư ni (luôn) + 2 tăng ni luân phiên + tối đa 2 vendor (buổi chẵn).
    Mỗi buổi lấy đúng 1 cặp theo chỉ số buổi (tăng: chu kỳ 15 buổi, vendor: chu kỳ 45 buổi
    chẵn) nên nhóm tụng không lặp lại sau vài buổi. Bỏ qua NPC đang trong room.questGuard
    (người cho nhiệm vụ đang mở) hoặc đang nghỉ ca — thiếu người thì lấy tiếp trong pool. */
function computeChantRoster(room: NpcRoom, key: string): Set<string> {
  const idx = sessionIdxOf(key);
  const roster = new Set<string>(['npc27', 'npc28']);
  const usable = (id: string) => {
    if (room.questGuard.has(id)) return false;
    const npc = room.npcs.find((o) => o.def.id === id);
    return !!npc && npc.mode !== 'resting' && npc.mode !== 'toRest' && npc.mode !== 'toWork';
  };
  const fill = (pool: string[], first: string[], count: number) => {
    const picked = first.filter(usable);
    for (const id of pool) {
      if (picked.length >= count) break;
      if (!picked.includes(id) && usable(id)) picked.push(id);
    }
    for (const id of picked) roster.add(id);
  };
  const [a, b] = MONK_PAIRS[idx % MONK_PAIRS.length];
  fill(MONK_POOL, [MONK_POOL[a], MONK_POOL[b]], 2);
  if (idx % 2 === 0) {
    const [c, d] = VENDOR_PAIRS[Math.floor(idx / 2) % VENDOR_PAIRS.length];
    fill(VENDOR_POOL, [VENDOR_POOL[c], VENDOR_POOL[d]], 2);
  }
  return roster;
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
  // Roster tụng (người bán / tiểu trực quầy): hết buổi thì về lại quầy theo đường.
  if (n.def.behavior === 'post' && room.chantRoster.has(n.def.id) && n.mode === 'chanting' && !activeSession(now) && now >= n.until) {
    const seat = n.chantSeat;
    releaseSeat(room, n.def.id); n.chantSeat = null;
    n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle';
    const node = n.def.id === 'npc13' ? 'dienMau' : n.def.id === 'npc14' ? 'ktGate' : 'marketS';
    startWalk(n, [...routeFrom(seat ? { x: seat.x, z: seat.z } : n.state, node), ...(n.def.post ? [{ x: n.def.post.x, z: n.def.post.z }] : [])], 1.0);
    n.until = now + 1000;
    return;
  }
  const sesNow = activeSession(now);
  if (sesNow && room.chantRosterKey !== sesNow.key) {
    room.chantRosterKey = sesNow.key;
    room.chantRoster = computeChantRoster(room, sesNow.key);
  }
  if (sesNow && SWEEP_CHANT.includes(n.def.behavior) && n.mode === 'normal' && n.chantKey !== sesNow.key && !room.chantRoster.has(n.def.id) && !room.questGuard.has(n.def.id)) {
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
  // Roster tụng: lấy ghế chính điện đầu tiên còn trống, không cướp ghế.
  // Sư ni có thể đang tụng ở điện phụ lúc buổi bắt đầu (mode chanting) — kéo ra chính
  // điện luôn, nhưng chỉ nhả ghế điện phụ khi đã chắc có ghế chính điện.
  if (sesNow && room.chantRoster.has(n.def.id)
    && (n.mode === 'normal' || (n.def.behavior === 'chant' && n.mode === 'chanting' && n.chantSeat?.hall !== 'chinhDien'))) {
    const seat = freeSeat(room, 'chinhDien');
    if (seat) {
      const old = n.chantSeat;
      n.chantSeat = null;
      if (old) releaseSeat(room, n.def.id);
      if (takeSeat(room, seat, n.def.id)) {
        n.chantSeat = seat; n.mode = 'toChant';
        startWalk(n, [...routeFrom(n.state, 'hallIn'), { x: seat.x, z: seat.z }], 1.0);
        return;
      }
    }
  }
  if (REST_POOL.has(n.def.behavior) && now >= n.shiftEnd) { tryRest(room, n, now); return; }
  if (n.def.behavior === 'chant') {
    const ses = activeSession(now);
    if (n.mode === 'chanting') {
      if (!ses && now >= n.until) {
        // Về từ chính điện thì đi ngay, không nghỉ 2-5 phút ở sai điện.
        const wasMain = n.chantSeat?.hall === 'chinhDien';
        releaseSeat(room, n.def.id); n.chantSeat = null;
        n.mode = 'normal'; n.phase = 'idle'; s.anim = 'idle'; n.until = wasMain ? now : now + R(120_000, 300_000);
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
      // Về điện phụ từ chính điện: đi theo đường, không đi thẳng xuyên tường/hồ.
      const node = n.def.id === 'npc27' ? 'thienDuong' : 'dienMau';
      const far = Math.hypot(n.state.x - seat.x, n.state.z - seat.z) > 8;
      startWalk(n, far ? [...routeFrom(n.state, node), { x: seat.x, z: seat.z }] : [{ x: seat.x, z: seat.z }], 1.0);
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
  if (n.def.id === 'npc37') return; // Sư Ông không dự thời khóa ở Chính Điện, cứ đi lang thang
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
  // 24/7 water: koi lake deck, lotus boardwalk (z=2) and the two east-river bridges.
  const onLotusDeck = Math.abs(q.z - LOTUS_DECK_Z) <= 0.9 && q.x >= LOTUS_DECK_X0 && q.x <= LOTUS_DECK_X1;
  const onRiverDeck = q.x >= 63 && q.x <= 67 && expansionRiverBridges.some((bz) => Math.abs(q.z - bz) <= 1.0);
  const before = { x: q.x, z: q.z };
  clampToCompound(q);
  if ((inLake(q.x, q.z) && !onDeck) || (expansionWaterBlocked(q.x, q.z) && !onLotusDeck && !onRiverDeck)
    || q.x !== before.x || q.z !== before.z) {
    n.route = []; n.phase = 'idle'; s.anim = 'idle'; n.until = now + 1500; return;
  }
  s.ry = Math.atan2(to.x - s.x, to.z - s.z);
  s.x = q.x; s.z = q.z;
}

/** Hoạt động đang làm của 1 NPC, suy ra từ anim + mode + behavior.
 * 'sit' mơ hồ nên phải phân biệt: npc6 trực bàn (desk) → null, trụ trì dẫn thời khóa
 * (mode 'sitting') → tụng kinh, còn lại (ngồi thiền tour...) → thiền. Lạy/thắp hương
 * thoáng qua (3–7 s) cố ý không hiện để khỏi nhấp nháy. */
function npcActivity(n: Npc): NpcAct | null {
  const a = n.state.anim;
  if (a === 'chant') return 'chant';
  if (a === 'sweep') return 'sweep';
  if (a === 'ring') return 'ring';
  if (a === 'lie') return 'rest';
  if (a === 'sit') {
    if (n.def.behavior === 'desk') return null;
    if (n.mode === 'idleRest' || n.mode === 'toIdleRest') return 'rest';
    // Tour news 77: khách ngồi Nhà Khách là NGHỈ ('guest'), ngồi Thiền Đường mới là thiền ('zen').
    if (n.stage === 'stroll' && n.tourStops[n.tourIdx]?.kind === 'guest') return 'rest';
    if (n.mode === 'sitting') return 'chant';
    return 'meditate';
  }
  return null;
}

/** NPC states currently in the world (visitors that left are excluded). */
export function presentNpcStates(room: NpcRoom): PlayerState[] {
  return room.npcs.filter((n) => !n.gone).map((n) => { n.state.act = npcActivity(n); return n.state; });
}

export function tickNpcs(room: NpcRoom, now = Date.now(), online = 0): PlayerState[] {
  if (room.sleeping) return presentNpcStates(room);
  const dt = Math.min(0.5, (now - room.lastTick) / 1000);
  room.lastTick = now;
  for (const n of room.npcs) {
    if (n.gone) {
      if (now >= n.goneUntil) {
        // Cap cổng: đếm visitor đang đứng gần cổng (< 3 m), không tính người đang gone.
        const gp = nodePt('gate');
        const atGate = room.npcs.filter(o => o !== n && o.def.behavior === 'visitor' && !o.gone && o.state && dist(o.state, gp) < 3).length;
        placeVisitor(room.npcs, n, now, atGate < SPREAD_GATE_MAX);
        n.state.ry = Math.PI;
        n.mode = 'normal';
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
