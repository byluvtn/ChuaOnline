import type { ActionKind } from './types';

export const ACTION_RULES: Record<ActionKind, { merit: number; cooldownMs: number; boostItems?: string[] }> = {
  incense: { merit: 1, cooldownMs: 3000, boostItems: ['huong_tram'] },
  bow: { merit: 1, cooldownMs: 2000, boostItems: ['hoa_sen', 'hoa_dang_phat'] },
  chant: { merit: 2, cooldownMs: 10000, boostItems: ['nen_sap_ong', 'trang_hat'] },
  lantern: { merit: 5, cooldownMs: 5000, boostItems: ['den_hoa_dang'] },
  palms: { merit: 0, cooldownMs: 1500 },
  beads: { merit: 0, cooldownMs: 2400 },
};

export type ShopCategory =
  | 'le_vat' | 'cay_phat' | 'ao_trang' | 'trang_hat' | 'bo_doan'
  | 'mu' | 'phap_khi' | 'may' | 'linh_thu' | 'dieu' | 'do_linh_thu';

export const SHOP_CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: 'le_vat', label: 'Lễ vật' },
  { id: 'cay_phat', label: 'Cây Phật' },
  { id: 'ao_trang', label: 'Áo tràng' },
  { id: 'trang_hat', label: 'Tràng hạt' },
  { id: 'bo_doan', label: 'Bồ đoàn' },
  { id: 'mu', label: 'Mũ' },
  { id: 'phap_khi', label: 'Pháp khí' },
  { id: 'may', label: 'Mây' },
  { id: 'linh_thu', label: 'Linh thú' },
  { id: 'dieu', label: 'Diều' },
  { id: 'do_linh_thu', label: 'Đồ linh thú' },
];

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  kind: 'consumable' | 'accessory';
  icon: string;
  category: ShopCategory;
  /** cấp tối thiểu để mua (≥1); chưa đủ cấp thì khoá */
  minLevel?: number;
  /** consumable: công đức nhận được khi hành lễ (mặc định theo ACTION_RULES) */
  boostMerit?: number;
}

export const ITEMS: ShopItem[] = [
  // ---- Lễ vật
  { id: 'huong_tram', name: 'Hương trầm', desc: 'Thắp hương nhận 5 công đức thay vì 1. Dùng 1 lần.', price: 10, kind: 'consumable', icon: '🕯', category: 'le_vat', boostMerit: 5 },
  { id: 'hoa_sen', name: 'Hoa sen', desc: 'Lạy Phật nhận 4 công đức. Dùng 1 lần.', price: 15, kind: 'consumable', icon: '🪷', category: 'le_vat', boostMerit: 4 },
  { id: 'den_hoa_dang', name: 'Đèn hoa đăng', desc: 'Thả đèn nhận 15 công đức. Dùng 1 lần.', price: 25, kind: 'consumable', icon: '🏮', category: 'le_vat', boostMerit: 15 },
  { id: 'nen_sap_ong', name: 'Nến sáp ong', desc: 'Tụng kinh nhận 7 công đức thay vì 2. Dùng 1 lần.', price: 10, kind: 'consumable', icon: '🕯', category: 'le_vat', boostMerit: 5 },
  { id: 'hoa_dang_phat', name: 'Hoa dâng Phật', desc: 'Lạy Phật nhận 8 công đức. Dùng 1 lần.', price: 20, kind: 'consumable', icon: '🌸', category: 'le_vat', boostMerit: 4 },
  // ---- Cây Phật
  { id: 'cay_bo_de', name: 'Cây Bồ Đề', desc: 'Cây bồ đề mini đặt trong Túi đồ.', price: 60, kind: 'accessory', icon: '🌳', category: 'cay_phat', minLevel: 2 },
  { id: 'cay_truc', name: 'Khóm trúc', desc: 'Khóm trúc xanh trong Túi đồ.', price: 45, kind: 'accessory', icon: '🎋', category: 'cay_phat' },
  // ---- Áo tràng
  { id: 'ao_trang_nau', name: 'Áo tràng nâu', desc: 'Áo tràng màu nâu đất.', price: 120, kind: 'accessory', icon: '🧘', category: 'ao_trang', minLevel: 2 },
  { id: 'ao_trang_vang', name: 'Áo tràng vàng', desc: 'Áo tràng vàng kim — chỉ dành cho bậc cao cấp.', price: 320, kind: 'accessory', icon: '✨', category: 'ao_trang', minLevel: 4 },
  { id: 'ao_trang_truc', name: 'Áo tràng trúc xanh', desc: 'Áo tràng xanh lam.', price: 150, kind: 'accessory', icon: '🟦', category: 'ao_trang', minLevel: 3 },
  // ---- Tràng hạt
  { id: 'trang_hat', name: 'Tràng hạt 108', desc: 'Mỗi lần tụng kinh nhận thêm công đức. Dùng 1 lần.', price: 30, kind: 'consumable', icon: '📿', category: 'trang_hat', boostMerit: 2 },
  { id: 'trang_hat_ngoc', name: 'Tràng hạt ngọc', desc: 'Tràng hạt ngọc trai — vật phẩm quý.', price: 200, kind: 'accessory', icon: '📿', category: 'trang_hat', minLevel: 3 },
  // ---- Bồ đoàn
  { id: 'bo_doan_do', name: 'Bồ đoàn đỏ hoa văn', desc: 'Bồ đoàn đỏ thêu hoa văn.', price: 90, kind: 'accessory', icon: '💺', category: 'bo_doan' },
  { id: 'bo_doan_vang', name: 'Bồ đoàn vàng kim', desc: 'Bồ đoàn viền vàng kim.', price: 180, kind: 'accessory', icon: '💺', category: 'bo_doan', minLevel: 3 },
  // ---- Mũ
  { id: 'mu_sen', name: 'Mũ sen', desc: 'Búp sen hồng trên đầu.', price: 120, kind: 'accessory', icon: '🌸', category: 'mu' },
  { id: 'khan_do', name: 'Khăn đỏ', desc: 'Khăn quàng cổ màu đỏ may mắn.', price: 80, kind: 'accessory', icon: '🧣', category: 'mu' },
  { id: 'mu_truc', name: 'Mũ trúc', desc: 'Mũ nan trúc.', price: 95, kind: 'accessory', icon: '🎩', category: 'mu', minLevel: 2 },
  // ---- Pháp khí
  { id: 'chuong_nho', name: 'Chuông nhỏ', desc: 'Chuông đồng nhỏ trong tay.', price: 110, kind: 'accessory', icon: '🔔', category: 'phap_khi' },
  { id: 'mo_go', name: 'Mõ gỗ', desc: 'Mõ gỗ cầm tay.', price: 100, kind: 'accessory', icon: '🥁', category: 'phap_khi' },
  // ---- Mây
  { id: 'may_lan', name: 'Mây lành', desc: 'Dải mây trắng quanh người.', price: 140, kind: 'accessory', icon: '☁️', category: 'may', minLevel: 3 },
  // ---- Linh thú
  { id: 'hao_quang', name: 'Hào quang', desc: 'Vòng sáng vàng sau đầu.', price: 300, kind: 'accessory', icon: '✨', category: 'linh_thu', minLevel: 4 },
  { id: 'linh_thu_ky_lan', name: 'Kỳ lân', desc: 'Linh thú kỳ lân đi theo.', price: 500, kind: 'accessory', icon: '🦄', category: 'linh_thu', minLevel: 5 },
  // ---- Diều
  { id: 'dieu_sen', name: 'Diều sen', desc: 'Diều hình hoa sen.', price: 75, kind: 'accessory', icon: '🪁', category: 'dieu' },
  // ---- Đồ linh thú
  { id: 'vong_co_lan', name: 'Vòng cổ kỳ lân', desc: 'Vòng cổ cho linh thú.', price: 130, kind: 'accessory', icon: '💎', category: 'do_linh_thu', minLevel: 4 },
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export type QuestEvent = ActionKind | 'chat' | 'meditate' | 'sutra' | 'buy' | 'room' | 'merit';
export interface QuestDef { id: string; label: string; event: QuestEvent; target: number; coins: number; merit: number }

export const QUESTS: QuestDef[] = [
  { id: 'q_bow', label: 'Lạy Phật 5 lần', event: 'bow', target: 5, coins: 10, merit: 5 },
  { id: 'q_incense', label: 'Thắp hương 3 lần', event: 'incense', target: 3, coins: 10, merit: 5 },
  { id: 'q_chant', label: 'Tụng kinh 2 lần', event: 'chant', target: 2, coins: 15, merit: 8 },
  { id: 'q_lantern', label: 'Thả 1 đèn nguyện', event: 'lantern', target: 1, coins: 20, merit: 10 },
  { id: 'q_chat', label: 'Chia sẻ 3 lời hiền', event: 'chat', target: 3, coins: 10, merit: 5 },
  { id: 'q_meditate', label: 'Thiền 2 phút', event: 'meditate', target: 12, coins: 30, merit: 15 },
  { id: 'q_sutra', label: 'Tụng xong 1 bài kinh', event: 'sutra', target: 1, coins: 25, merit: 12 },
  { id: 'q_lantern3', label: 'Thả 3 đèn nguyện', event: 'lantern', target: 3, coins: 30, merit: 15 },
  { id: 'q_meditate5', label: 'Thiền 5 phút', event: 'meditate', target: 30, coins: 45, merit: 20 },
  { id: 'q_buy', label: 'Mua 1 vật phẩm ở cửa hàng', event: 'buy', target: 1, coins: 15, merit: 8 },
  { id: 'q_rooms', label: 'Viếng 3 chùa khác nhau', event: 'room', target: 3, coins: 30, merit: 15 },
  { id: 'q_bow10', label: 'Lạy Phật 10 lần', event: 'bow', target: 10, coins: 25, merit: 12 },
  { id: 'q_incense5', label: 'Thắp hương 5 lần', event: 'incense', target: 5, coins: 20, merit: 10 },
  { id: 'q_chat5', label: 'Chia sẻ 5 lời hiền', event: 'chat', target: 5, coins: 18, merit: 8 },
];

/** Nhiệm vụ tuần — reset thứ Hai (dùng week_key thay day_key, id tiền tố `w_`). */
export const WEEKLY_QUESTS: QuestDef[] = [
  { id: 'w_merit100', label: 'Tích 100 công đức trong tuần', event: 'merit', target: 100, coins: 60, merit: 30 },
  { id: 'w_bow50', label: 'Lạy Phật 50 lần trong tuần', event: 'bow', target: 50, coins: 80, merit: 40 },
  { id: 'w_sutra10', label: 'Tụng 10 bài kinh trong tuần', event: 'sutra', target: 10, coins: 100, merit: 50 },
];

/** Thưởng mốc cấp: lên cấp nhận xu + công đức (server tự cộng khi lên cấp). */
export const LEVEL_BONUS = { coinsPerLevel: 10, meritPerLevel: 5 };

/** Bài kinh cho cửa sổ tụng kinh — chỉ lấy kinh truyền thống, lời gốc. */
export interface Sutra {
  id: string;
  name: string;
  /** số biến/lần đọc mặc định */
  reps: number;
  /** từng câu kinh, hiển thị và đọc theo dòng */
  lines: string[];
}

export const SUTRAS: Sutra[] = [
  {
    id: 'tam_kinh',
    name: 'Bát Nhã Tâm Kinh',
    reps: 1,
    lines: [
      'Quán Tự Tại Bồ Tát, hành thâm Bát Nhã Ba La Mật Đa thời,',
      'chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.',
      'Xá Lợi Tử! Sắc bất dị không, không bất dị sắc;',
      'sắc tức thị không, không tức thị sắc.',
      'Thọ, tưởng, hành, thức, diệc phục như thị.',
      'Xá Lợi Tử! Thị chư pháp không tướng, bất sinh bất diệt,',
      'bất cấu bất tịnh, bất tăng bất giảm.',
      'Cho nên, trong không mà không sắc, thọ tưởng hành thức;',
      'nhãn nhĩ tỷ thiệt thân ý; sắc thanh hương vị xúc pháp;',
      'nhãn giới, cho đến ý thức giới; vô vô minh, diệc vô vô minh tận;',
      'cho đến vô lão tử, diệc vô lão tử tận;',
      'vô khổ tập diệt đạo, vô trí diệc vô đắc.',
      'Dĩ vô sở đắc cố, Bồ Đề Tát Đề; y Bát Nhã Ba La Mật Đa cố, tâm vô quái ngại;',
      'vô quái ngại cố, vô hữu khủng bố, viễn ly điên đảo mộng tưởng, cứu cánh Niết Bàn.',
      'Tam thế chư Phật, y Bát Nhã Ba La Mật Đa cố, đắc A Nậu Đa La Tam Miệu Tam Bồ Đề.',
      'Cho nên tri Bát Nhã Ba La Mật Đa, thị đại thần chú, thị đại minh chú,',
      'thị vô thượng chú, thị vô đẳng đẳng chú, năng trừ nhất thiết khổ, chân thật bất hư.',
      'Cố thuyết Bát Nhã Ba La Mật Đa chú, tức thuyết chú viết:',
      'Yết Đế Yết Đế, Ba La Yết Đế, Ba La Tăng Yết Đế, Bồ Đề Tát Bà Ha.',
    ],
  },
  {
    id: 'dai_bi',
    name: 'Chú Đại Bi',
    reps: 1,
    lines: [
      'Nam mô Đại Bi Hội Thượng Phật Bồ tát (3 lần)',
      'Thiên thủ thiên nhãn vô ngại đại bi tâm đà la ni.',
      'Nam mô hắc ra đát na đa ra dạ da.',
      'Nam mô a rị da, bà lô yết đế, thước bát ra da,',
      'bồ đề tát đỏa bà da, ma ha tát đỏa bà da,',
      'ma ha ca lô ni ca da.',
      'Án, tát bàn ra phạt duệ, số đát na đát tỏa.',
      'Nam mô tát phạt đát, bạt đà phạt duệ, bạt đà bát đà, đà ra ni.',
      'Mông á rị, đà ra ni.',
      'Bà lô cát đế, thước bàn ra dạ, ta bà ha.',
      'Nam mô na ra cẩn trì.',
      'Hê rị, ma ha bàn đa sa mế, tát bà a tha đậu du bằng,',
      'a thệ dựng, tát bà tát đa, na ma bà dà, ma phạt đạt đậu,',
      'đát điệt tha: án, a bà lô hê, lô ca đế, ca ra đế, di hê rị.',
      'Ma ha bồ đề tát đỏa, tát bà tát bà, ma ra ma ra, ma hê ma hê, rị đà dựng.',
      'Cu lô cu lô, yết mông, độ lô độ lô, phạt xà da đế, ma ha phạt xà da đế.',
      'Đà ra đà ra, địa rị ni, thất Phật ra da, dá ra dá ra.',
      'Mạ mạ phạt ma ra, mục đế lệ, y hê di hê, thất na thất na,',
      'a ra sám Phật ra xá lợi, phạt sa phạt sám, Phật ra xá da,',
      'hô lô hô lô, ma ra, hô lô hô lô, hô lô hô lô, ta bà ha.',
      'Tát bà hê hê, tồ lô tồ lô, phạt xà da đế, ta bà ha.',
      'Nam mô a rị da, bà lô yết đế, thước bát ra da, bồ đề tát đỏa, ta bà ha.',
    ],
  },
  {
    id: 'niem_phat',
    name: 'Niệm Phật A Di Đà (108 lần)',
    reps: 1,
    lines: (() => {
      const out: string[] = ['Nam Mô Bổn Sư Thích Ca Mâu Ni Phật (3 lần)', 'Nam Mô A Di Đà Phật'];
      for (let i = 2; i < 108; i++) out.push('Nam Mô A Di Đà Phật');
      out.push('Nguyện dứt trầm luân khổ, đồng lên cõi Cực Lạc.');
      return out;
    })(),
  },
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

/** Thưởng điểm danh theo ngày chu kỳ 1..7 (streak vẫn tăng tiếp sau ngày 7). */
export const CHECKIN_REWARDS: { merit: number; coins: number; item?: string }[] = [
  { merit: 3, coins: 5 },
  { merit: 5, coins: 5 },
  { merit: 8, coins: 10 },
  { merit: 10, coins: 10 },
  { merit: 12, coins: 15 },
  { merit: 15, coins: 15 },
  { merit: 30, coins: 30, item: 'den_hoa_dang' },
];
export interface CheckinState { streak: number; claimedToday: boolean; total: number }
export interface CheckinAck {
  ok: boolean; error?: string; state?: CheckinState;
  streak?: number; cycleDay?: number; merit?: number; coins?: number; item?: string;
}

export interface MailGift { merit: number; coins: number; items?: Record<string, number> }
export interface MailItem {
  id: number; kind: string; title: string; body: string;
  gift: MailGift | null; read: boolean; claimed: boolean; createdAt: number;
}
export interface MailAck {
  ok: boolean; error?: string; unread?: number; mails?: MailItem[];
  merit?: number; coins?: number; items?: Record<string, number>;
}

export type StatKey = 'bows' | 'chants' | 'lanterns' | 'meditate_sec' | 'beads_rounds';
export interface StatMilestone { id: string; stat: StatKey; threshold: number; title: string; coins: number; item?: string }
export const STAT_MILESTONES: StatMilestone[] = [
  { id: 'bow100', stat: 'bows', threshold: 100, title: 'Chắp tay thành kính', coins: 20 },
  { id: 'bow300', stat: 'bows', threshold: 300, title: 'Lễ Phật tinh tấn', coins: 50, item: 'nen_sap_ong' },
  { id: 'bow1000', stat: 'bows', threshold: 1000, title: 'Nhất tâm lễ Phật', coins: 120, item: 'den_hoa_dang' },
  { id: 'chant50', stat: 'chants', threshold: 50, title: 'Tụng niệm hằng ngày', coins: 20 },
  { id: 'chant200', stat: 'chants', threshold: 200, title: 'Kinh âm vang xa', coins: 50, item: 'huong_tram' },
  { id: 'chant500', stat: 'chants', threshold: 500, title: 'Tâm kinh thuần thục', coins: 120, item: 'den_hoa_dang' },
  { id: 'lamp20', stat: 'lanterns', threshold: 20, title: 'Thắp sáng ước nguyện', coins: 20 },
  { id: 'lamp50', stat: 'lanterns', threshold: 50, title: 'Hoa đăng rực rỡ', coins: 50, item: 'huong_tram' },
  { id: 'lamp150', stat: 'lanterns', threshold: 150, title: 'Trăm đèn soi tâm', coins: 120, item: 'hoa_dang_phat' },
  { id: 'med30', stat: 'meditate_sec', threshold: 1800, title: 'An trú hơi thở', coins: 20 },
  { id: 'med60', stat: 'meditate_sec', threshold: 3600, title: 'Tâm như mặt hồ', coins: 50, item: 'nen_sap_ong' },
  { id: 'med180', stat: 'meditate_sec', threshold: 10800, title: 'Định tĩnh như núi', coins: 120, item: 'den_hoa_dang' },
  { id: 'bead5', stat: 'beads_rounds', threshold: 5, title: 'Khởi tâm lần hạt', coins: 20 },
  { id: 'bead25', stat: 'beads_rounds', threshold: 25, title: 'Tràng hạt không rời tay', coins: 50, item: 'huong_tram' },
  { id: 'bead100', stat: 'beads_rounds', threshold: 100, title: 'Một trăm vòng an nhiên', coins: 120, item: 'den_hoa_dang' },
];
export interface PlayerStats { bows: number; chants: number; lanterns: number; meditateSec: number; beadsRounds: number }
export interface StatsState { stats: PlayerStats; claimed: string[] }
export interface StatsAck { ok: boolean; error?: string; state?: StatsState }
export interface MilestoneEvent { id: string; title: string; coins: number; item?: string }

export interface BeadsState { rewarded: number }
export interface BeadsAck { ok: boolean; rewarded?: boolean; merit?: number }

export interface SpinState { used: boolean }
export interface SpinAck {
  ok: boolean; error?: string;
  segment?: number; merit?: number; coins?: number; item?: string;
  used?: boolean;
}

export interface SpinSegment {
  /** Nhãn ngắn in trên ô vòng quay. */
  label: string;
  merit: number;
  coins: number;
  /** Vật phẩm tặng kèm (id trong ITEMS), nếu có. */
  item?: string;
  /** Trọng số rút thăm; tổng cả bảng = 100. */
  weight: number;
}

export const SPIN_SEGMENTS: SpinSegment[] = [
  { label: '+10',       merit: 10,  coins: 0,   weight: 22 },
  { label: '15 xu',     merit: 0,   coins: 15,  weight: 16 },
  { label: '+15',       merit: 15,  coins: 0,   weight: 18 },
  { label: '30 xu',     merit: 0,   coins: 30,  weight: 12 },
  { label: '+25',       merit: 25,  coins: 0,   weight: 12 },
  { label: 'Hương trầm', merit: 0,  coins: 0,   item: 'huong_tram', weight: 7 },
  { label: '+40',       merit: 40,  coins: 0,   weight: 8 },
  { label: 'ĐẠI CÁT',   merit: 100, coins: 100, weight: 5 },
];

/** Rút thăm ô quay theo trọng số. Thuần, không chạm DB — server gọi, client KHÔNG BAO GIỜ được tự rút. */
export function drawSpinSegment(rng: () => number = Math.random): number {
  const total = SPIN_SEGMENTS.reduce((s, x) => s + x.weight, 0);
  let r = rng() * total;
  for (let i = 0; i < SPIN_SEGMENTS.length; i++) {
    r -= SPIN_SEGMENTS[i].weight;
    if (r < 0) return i;
  }
  return SPIN_SEGMENTS.length - 1;
}
