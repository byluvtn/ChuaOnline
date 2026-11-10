export type Outfit = 'monk' | 'nun' | 'male' | 'female';
/** Default robe colour per character (hex, lowercase). */
export const OUTFIT_COLOR: Record<Outfit, string> = { monk: '#d9a62b', nun: '#778c96', male: '#72818e', female: '#bc7672' };
export const OUTFIT_LABEL: Record<Outfit, string> = { monk: 'Tiểu tăng', nun: 'Tiểu ni', male: 'Phật tử nam', female: 'Phật tử nữ' };
export type ActionKind = 'incense' | 'bow' | 'chant' | 'lantern';
export type Anim = 'idle' | 'walk' | 'run' | 'sit' | 'sweep' | 'ring' | ActionKind;

export interface PlayerState {
  id: string;
  name: string;
  outfit: Outfit;
  color: string;
  accessory: string | null;
  x: number;
  z: number;
  ry: number;
  anim: Anim;
  merit: number;
  /** nhân vật do máy chủ điều khiển (không phải phiên người chơi) */
  npc?: boolean;
  role?: 'abbot' | 'novice';
}

export interface ChatMessage { id: number; sid?: string; name: string; text: string; t: number }
export interface Lantern { id: number; name: string; wish: string; t: number }

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
}

export const MAP_HALF = 68;
export const levelOf = (merit: number) => Math.floor(Math.sqrt(merit / 10)) + 1;
export const meritForLevel = (lv: number) => (lv - 1) * (lv - 1) * 10;
