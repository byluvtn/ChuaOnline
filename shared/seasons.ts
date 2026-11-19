import { ictParts, solarToLunar, type LunarDate } from './time.js';

export type SeasonKey = 'xuan' | 'ha' | 'thu' | 'dong';
export type WeatherKey = 'clear' | 'mist' | 'drizzle' | 'rain';
export type FestivalKey = 'tet' | 'phatDan' | 'vuLan' | 'trungThu';

export const SEASON_NAME: Record<SeasonKey, string> = { xuan: 'Xuân', ha: 'Hạ', thu: 'Thu', dong: 'Đông' };
export const WEATHER_NAME: Record<WeatherKey, string> = { clear: 'Trời quang', mist: 'Sương sớm', drizzle: 'Mưa phùn', rain: 'Mưa' };

export const seasonOfLunarMonth = (month: number): SeasonKey =>
  month <= 3 ? 'xuan' : month <= 6 ? 'ha' : month <= 9 ? 'thu' : 'dong';

export interface FestivalDef {
  key: FestivalKey;
  name: string;
  desc: string;
  gift: { merit: number; coins: number };
  match(l: LunarDate): boolean;
}

export const FESTIVAL_DEFS: FestivalDef[] = [
  {
    key: 'tet', name: 'Tết Nguyên Đán', desc: 'Chùa treo đèn đỏ, hoa mai hoa đào nở khắp sân. Xin quà đầu năm.',
    gift: { merit: 50, coins: 100 }, match: (l) => (l.month === 12 && l.day >= 29) || (l.month === 1 && l.day <= 5),
  },
  {
    key: 'phatDan', name: 'Đại lễ Phật Đản', desc: 'Đèn hoa sen đủ sắc, cờ Phật giáo bay trên sân chùa.',
    gift: { merit: 60, coins: 80 }, match: (l) => l.month === 4 && l.day >= 14 && l.day <= 16,
  },
  {
    key: 'vuLan', name: 'Lễ Vu Lan báo hiếu', desc: 'Đèn hoa đăng thả trên hồ, hoa hồng cài áo cho mẹ cha.',
    gift: { merit: 60, coins: 80 }, match: (l) => l.month === 7 && l.day >= 14 && l.day <= 16,
  },
  {
    key: 'trungThu', name: 'Tết Trung Thu', desc: 'Đèn ông sao, đèn lồng treo dọc lối đi, trăng rằm sáng tỏ.',
    gift: { merit: 40, coins: 80 }, match: (l) => l.month === 8 && l.day >= 14 && l.day <= 16,
  },
];

let lunarCache: { key: string; lunar: LunarDate } | null = null;

export function lunarOf(d = new Date()): LunarDate {
  const p = ictParts(d);
  const key = `${p.year}-${p.month}-${p.day}`;
  if (lunarCache && lunarCache.key === key) return lunarCache.lunar;
  const lunar = solarToLunar(p.day, p.month, p.year);
  lunarCache = { key, lunar };
  return lunar;
}

export const seasonNow = (d = new Date()): SeasonKey => seasonOfLunarMonth(lunarOf(d).month);

export function activeFestival(d = new Date()): FestivalDef | null {
  const l = lunarOf(d);
  if (l.leap) return null;
  return FESTIVAL_DEFS.find((f) => f.match(l)) ?? null;
}

export const festivalKeyNow = (d = new Date()): string | null => {
  const f = activeFestival(d);
  if (!f) return null;
  const l = lunarOf(d);
  const lunarYear = l.month === 12 && f.key === 'tet' ? l.year + 1 : l.year;
  return `${f.key}:${lunarYear}`;
};

function hash32(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

const WEATHER_BLOCK_MS = 3 * 3600_000;

/** Thời tiết xác định theo khối 3 giờ giờ VN và mùa: client và máy chủ tự tính, không cần đồng bộ. */
export function weatherAt(d = new Date()): WeatherKey {
  const ict = d.getTime() + 7 * 3600_000;
  const block = Math.floor(ict / WEATHER_BLOCK_MS);
  const roll = hash32(block) / 0xffffffff;
  const hour = ((block % 8 + 8) % 8) * 3;
  const season = seasonNow(d);
  const rain = season === 'ha' ? 0.2 : season === 'thu' ? 0.1 : season === 'xuan' ? 0.07 : 0.05;
  const drizzle = season === 'xuan' ? 0.2 : season === 'dong' ? 0.08 : 0.07;
  const mist = (season === 'dong' ? 0.3 : 0.14) + (hour === 6 ? 0.25 : 0);
  if (roll < rain) return 'rain';
  if (roll < rain + drizzle) return 'drizzle';
  if (roll < rain + drizzle + mist) return 'mist';
  return 'clear';
}
