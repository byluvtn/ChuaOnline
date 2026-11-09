import type { ActionKind } from './types';

export const ACTION_RULES: Record<ActionKind, { merit: number; cooldownMs: number; boostItem?: string; boostMerit?: number }> = {
  incense: { merit: 1, cooldownMs: 3000, boostItem: 'huong_tram', boostMerit: 5 },
  bow: { merit: 1, cooldownMs: 2000, boostItem: 'hoa_sen', boostMerit: 4 },
  chant: { merit: 2, cooldownMs: 10000 },
  lantern: { merit: 5, cooldownMs: 5000, boostItem: 'den_hoa_dang', boostMerit: 15 },
};

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  kind: 'consumable' | 'accessory';
  icon: string;
}

export const ITEMS: ShopItem[] = [
  { id: 'huong_tram', name: 'Hương trầm', desc: 'Thắp hương nhận 5 công đức thay vì 1. Dùng 1 lần.', price: 10, kind: 'consumable', icon: '🕯' },
  { id: 'hoa_sen', name: 'Hoa sen', desc: 'Lạy Phật nhận 4 công đức. Dùng 1 lần.', price: 15, kind: 'consumable', icon: '🪷' },
  { id: 'den_hoa_dang', name: 'Đèn hoa đăng', desc: 'Thả đèn nhận 15 công đức. Dùng 1 lần.', price: 25, kind: 'consumable', icon: '🏮' },
  { id: 'mu_sen', name: 'Mũ sen', desc: 'Búp sen hồng trên đầu.', price: 120, kind: 'accessory', icon: '🌸' },
  { id: 'hao_quang', name: 'Hào quang', desc: 'Vòng sáng vàng sau đầu.', price: 300, kind: 'accessory', icon: '✨' },
  { id: 'khan_do', name: 'Khăn đỏ', desc: 'Khăn quàng cổ màu đỏ may mắn.', price: 80, kind: 'accessory', icon: '🧣' },
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export type QuestEvent = ActionKind | 'chat' | 'meditate';
export interface QuestDef { id: string; label: string; event: QuestEvent; target: number; coins: number; merit: number }

export const QUESTS: QuestDef[] = [
  { id: 'q_bow', label: 'Lạy Phật 5 lần', event: 'bow', target: 5, coins: 10, merit: 5 },
  { id: 'q_incense', label: 'Thắp hương 3 lần', event: 'incense', target: 3, coins: 10, merit: 5 },
  { id: 'q_chant', label: 'Tụng kinh 2 lần', event: 'chant', target: 2, coins: 15, merit: 8 },
  { id: 'q_lantern', label: 'Thả 1 đèn nguyện', event: 'lantern', target: 1, coins: 20, merit: 10 },
  { id: 'q_chat', label: 'Chia sẻ 3 lời hiền', event: 'chat', target: 3, coins: 10, merit: 5 },
  { id: 'q_meditate', label: 'Thiền 2 phút', event: 'meditate', target: 12, coins: 30, merit: 15 },
];

export interface QuestState { id: string; label: string; progress: number; target: number; coins: number; merit: number; claimed: boolean }

export interface RoomInfo { id: string; name: string; online: number; capacity: number }
export const ROOMS = [
  { id: 'vo-luong', name: 'Chùa Vô Lượng', sky: '#f4c98a' },
  { id: 'tu-bi', name: 'Chùa Từ Bi', sky: '#bcd7ee' },
  { id: 'an-lac', name: 'Chùa An Lạc', sky: '#d9a7c7' },
];
export const ROOM_CAPACITY = 60;

export const MEDITATE_TICK_MS = 10_000;
export const GROUP_MEDITATE_MIN = 3;
export const MEDITATE_GOAL_MIN = 500;

export interface RankRow { name: string; merit: number; level: number }
export interface MeditationInfo { sitting: number; minutes: number; goal: number; bonus: boolean }
