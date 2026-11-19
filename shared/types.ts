import { WALL } from './campus.js';

export type Outfit = 'monk' | 'nun' | 'male' | 'female';
/** Default robe colour per character (hex, lowercase). */
export const OUTFIT_COLOR: Record<Outfit, string> = { monk: '#d9a62b', nun: '#778c96', male: '#72818e', female: '#bc7672' };
export const OUTFIT_LABEL: Record<Outfit, string> = { monk: 'Tiểu tăng', nun: 'Tiểu ni', male: 'Phật tử nam', female: 'Phật tử nữ' };
export type ActionKind = 'incense' | 'bow' | 'chant' | 'lantern' | 'palms' | 'beads';
export type Anim = 'idle' | 'walk' | 'run' | 'sit' | 'lie' | 'sweep' | 'ring' | ActionKind;
/** Hoạt động NPC/người chơi đang làm, máy chủ suy ra — chỉ để hiện dòng trạng thái trên tên. */
export type NpcAct = 'chant' | 'meditate' | 'sweep' | 'ring' | 'rest';

export interface PlayerState {
  id: string;
  name: string;
  outfit: Outfit;
  color: string;
  accessory: string | null;
  x: number;
  z: number;
  /** cao độ render tuyệt đối; chỉ đặt khi NPC ngồi trên ghế/bục có cao độ thật
   *  (ví dụ ghế bồ đề seatY = 0.619). Bỏ trống thì client dùng world.groundY. */
  y?: number;
  ry: number;
  anim: Anim;
  merit: number;
  /** nhân vật do máy chủ điều khiển (không phải phiên người chơi) */
  npc?: boolean;
  role?: 'abbot' | 'novice' | 'lay';
  /** id danh hiệu đang đeo; chỉ người chơi có */
  title?: string | null;
  /** id người chơi trong DB (ổn định qua các lần kết nối lại); chỉ người chơi có, NPC không có */
  pid?: number;
  /** hoạt động đang làm (máy chủ suy ra); chỉ để hiện dòng trạng thái */
  act?: NpcAct | null;
  /** tầng hào quang thiền trong ngày (0 = không có); chỉ người chơi có, NPC không có */
  halo?: 0 | 1 | 2;
}

export interface ChatMessage { id: number; sid?: string; name: string; text: string; t: number; sys?: boolean }
export interface Lantern { id: number; pid: number; name: string; wish: string; t: number; x?: number; z?: number }

/** Đèn trời: khác Lantern ở chỗ có toạ độ người thả để client tự dựng quả đèn bay lên. */
export interface SkyLantern { id: number; pid: number; name: string; wish: string; x: number; z: number; t: number }
/** Cỡ pháo hoa — dùng chung server + client. */
export type FireworkSize = 'small' | 'large' | 'dragon';
export interface FireworkShow { id: number; name: string; size: FireworkSize; x: number; z: number; t: number }
export interface BellHeard { id: number; sid: string }

export interface Profile {
  name: string;
  outfit: Outfit;
  color: string;
  merit: number;
  coins: number;
  accessory: string | null;
  username: string | null; // null = guest
  inventory: Record<string, number>;
  admin?: boolean;
  titles: string[];
  title: string | null;
  /** tiểu sử, tối đa 200 ký tự, có thể để trống */
  bio: string | null;
  /** tuổi, số nguyên 1-120 hoặc null */
  age: number | null;
  /** số nhiệm vụ khác nhau đã hoàn thành */
  questsDone: number;
  /** tổng xu đã đóng góp */
  donated: number;
}

export interface ProfileSave { bio: string | null; age: number | null }
export interface ProfileSaveAck { ok: boolean; error?: string }

export const MAP_HALF = Math.max(-WALL.xW, WALL.xE) + 6;
export { MAP_Z_MIN } from './campus.js';
export const MAP_Z_MAX = 68;
export const levelOf = (merit: number) => Math.floor(Math.sqrt(merit / 10)) + 1;
export const meritForLevel = (lv: number) => (lv - 1) * (lv - 1) * 10;

export type AnimalAnim = 'idle' | 'walk' | 'run' | 'eat' | 'sit' | 'sleep' | 'fly';
export interface AnimalState {
  id: string;
  kind: 'dog' | 'cat' | 'owl' | 'parrot' | 'chick';
  name: string;
  x: number;
  y: number;
  z: number;
  ry: number;
  anim: AnimalAnim;
  lost?: boolean;
}
