import { ictParts } from './time.js';

/** Khóa thiền nhóm cố định theo giờ VN: mở 15 phút đầu mỗi mốc. */
export const GROUP_SLOTS = [
  { id: 'sang', hour: 6, label: '06:00' },
  { id: 'trua', hour: 12, label: '12:00' },
  { id: 'toi', hour: 20, label: '20:00' },
] as const;
export const GROUP_WINDOW_MIN = 15;
export const GROUP_NEED_SEC = 300;
export const GROUP_MIN_PLAYERS = 2;
export const GROUP_REWARD = { merit: 25, coins: 10 };

export interface GroupWindow { id: string; label: string; key: string; endsAt: number }

/** Cửa sổ thiền nhóm đang mở tại thời điểm `d`, hoặc null. */
export function groupWindowAt(d: Date): GroupWindow | null {
  const p = ictParts(d);
  const slot = GROUP_SLOTS.find((s) => s.hour === p.hour);
  if (!slot || p.minute >= GROUP_WINDOW_MIN) return null;
  const left = (GROUP_WINDOW_MIN - p.minute) * 60 - p.second;
  const day = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  return { id: slot.id, label: slot.label, key: `${day}|${slot.id}`, endsAt: d.getTime() - d.getUTCMilliseconds() + left * 1000 };
}

/** Lần tới một khóa thiền nhóm mở cửa (ms epoch). */
export function nextGroupStart(d: Date): { label: string; at: number } {
  const p = ictParts(d);
  const nowSec = p.hour * 3600 + p.minute * 60 + p.second;
  let best: { label: string; secs: number } | null = null;
  for (const s of GROUP_SLOTS) {
    let diff = s.hour * 3600 - nowSec;
    if (diff <= 0) diff += 86400;
    if (!best || diff < best.secs) best = { label: s.label, secs: diff };
  }
  return { label: best!.label, at: d.getTime() - d.getUTCMilliseconds() + best!.secs * 1000 };
}

export interface GroupState {
  active: boolean;
  label: string;
  endsAt: number;
  sitting: number;
  auraIds: string[];
  nextLabel: string;
  nextAt: number;
  need: number;
  /** số giây người chơi này đã ngồi trong khóa hiện tại (chỉ gửi riêng từng người) */
  mySec: number;
  claimed: boolean;
}

/** Lễ thỉnh chuông toàn server: công đức cho ai có mặt lúc chuông điểm. */
export const BELL_RITUAL_REWARD = { merit: 12, coins: 5 };

export interface FestivalStateMsg {
  key: string | null;
  name: string;
  desc: string;
  gift: { merit: number; coins: number } | null;
  claimed: boolean;
}

/** Vườn bồ đề: lưới 8 x 5 chỗ trồng, mỗi người một cây. */
export const BODHI_GROVE = { x: -50, z: 34, cols: 8, rows: 5, dx: 1.4, dz: 1.8 };
export const BODHI_SLOTS = BODHI_GROVE.cols * BODHI_GROVE.rows;
export const BODHI_REACH = 12;
export const BODHI_STALE_DAYS = 21;
export const BODHI_WILT_DAYS = 3;
export const BODHI_WATER_REWARD = { merit: 3, coins: 0 };
/** Số lần tưới cần để lên từng giai đoạn (giai đoạn 0 = vừa trồng). */
export const BODHI_STAGE_WATERS = [1, 3, 7, 14, 25, 40];
export const BODHI_STAGE_NAMES = ['Mầm non', 'Cây con', 'Cây nhỏ', 'Cây trẻ', 'Cây lớn', 'Cây cổ thụ', 'Cây thiêng'];
export const bodhiStageOf = (waters: number) => BODHI_STAGE_WATERS.filter((w) => waters >= w).length;
export const bodhiSlotPos = (slot: number) => ({
  x: BODHI_GROVE.x + ((slot % BODHI_GROVE.cols) - (BODHI_GROVE.cols - 1) / 2) * BODHI_GROVE.dx,
  z: BODHI_GROVE.z + (Math.floor(slot / BODHI_GROVE.cols) - (BODHI_GROVE.rows - 1) / 2) * BODHI_GROVE.dz,
});

export interface BodhiTree { pid: number; name: string; slot: number; waters: number; stage: number; wilted: boolean; wateredToday: boolean }
/** Gửi riêng cho từng người: kèm pid của chính họ để client biết cây nào là của mình. */
export interface BodhiFeed { me: number; trees: BodhiTree[] }
export interface BodhiAck { ok: boolean; error?: string; merit?: number; trees?: BodhiTree[]; me?: number }

/** Nhật ký tu tập. */
export interface JournalDay { day: string; visited: boolean; medSec: number }
export interface JournalState {
  days: JournalDay[];
  streak: number;
  best: number;
  totalDays: number;
  totalMedSec: number;
}
export interface JournalAck { ok: boolean; error?: string; state?: JournalState }

/** NPC thân thiết. */
export const BOND_TALK_POINTS = 1;
export const BOND_GIFT_POINTS = 2;
export const BOND_GIFTS_PER_DAY = 2;
export const BOND_REACH = 3.5;
/** Điểm thân thiết cần để mở chương 1, 2, 3. */
export const BOND_CHAPTER_POINTS = [4, 12, 26];
/** Quà tặng được chấp nhận: lễ vật rẻ trong cửa hàng. */
export const BOND_GIFT_ITEMS = ['huong_tram', 'hoa_sen', 'den_hoa_dang', 'nen_sap_ong', 'hoa_dang_phat'];

export interface BondChapterDef {
  title: string;
  story: string;
  /** vật phẩm NPC nhờ mang tới để hoàn thành chương */
  ask: { item: string; qty: number };
  reward: { merit: number; coins: number; item?: string };
}
export interface BondNpcDef { id: string; chapters: BondChapterDef[] }
export interface BondState { npc: string; points: number; done: number; talkedToday: boolean; giftsToday: number }
export interface BondAck { ok: boolean; error?: string; msg?: string; bonds?: BondState[] }

/** Tịnh thất riêng. */
export const RETREAT_THEMES = [
  { name: 'Tường kem', wall: '#e9dcc0', floor: '#a4784a' },
  { name: 'Tường xanh lá nhạt', wall: '#cfdcc0', floor: '#8c6a44' },
  { name: 'Tường hồng sen', wall: '#ecd1cd', floor: '#9a6e50' },
  { name: 'Tường xám trà', wall: '#d3d0c4', floor: '#7d6048' },
];
export interface RetreatState { placed: string[]; theme: number; owned: string[] }
export interface RetreatAck { ok: boolean; error?: string; state?: RetreatState; ownerName?: string }
