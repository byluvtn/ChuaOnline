/**
 * Danh mục chỗ ngồi dùng chung cho client và máy chủ (K1, N1).
 *
 * Một nguồn duy nhất cho toạ độ, hướng mặt và chiều cao mặt ngồi của ghế THẬT
 * trong chùa (băng ghế gỗ, ghế đá). Client dựng nút "Ngồi"/"Đứng dậy" và đặt
 * nhân vật; máy chủ giữ độc quyền theo phòng.
 *
 * Chỉ ghi ở đây những chỗ có mesh ghế thật trong cảnh. Bồ đoàn thiền (đệm sen)
 * vẫn nằm trong `world.seats` vì chúng có luồng thiền/công đức riêng; ngồi trên
 * ghế ở đây KHÔNG tính công đức.
 *
 * Toạ độ là mét, hệ trục thế giới. `ry` là hướng mặt người ngồi, cùng quy ước
 * với `PlayerState.ry`: 0 = nhìn +Z, PI/2 = nhìn +X.
 */
import { BAMBOO, EAST_BANK_SHIFT, LOTUS_PAVILION, NGOC } from './campus.js';

export type SeatKind = 'bench' | 'stone';

export interface CatalogSeat {
  /** id ổn định, duy nhất — dùng làm tham số `seat:sit` phía máy chủ. */
  id: string;
  x: number;
  z: number;
  ry: number;
  kind: SeatKind;
  /** khu vực, chỉ để hiện trong thông báo. */
  area: string;
  /** chiều cao mặt ngồi so với mặt đất đi bộ tại chỗ (mét). */
  sitH: number;
  /**
   * Khoá độc quyền trong `NpcRoom.seats`. Ghế hành lang dùng đúng khoá
   * `bench:<x>,<z>` của NPC (server/npcs.ts) để người chơi và NPC không
   * bao giờ ngồi cùng một chỗ; ghế khác dùng `seat:<id>`.
   */
  holderKey: string;
}

/** Ghế gỗ hành lang Đông/Tây — mỗi ghế 2 chỗ, NPC nghỉ cũng dùng đúng chỗ này. */
export const CORRIDOR_BENCH_SEATS: readonly CatalogSeat[] = [
  { id: 'corr-e1', x: 18.8, z: -17.0, ry: -Math.PI / 2, kind: 'bench', area: 'Hành lang Đông', sitH: 0.619, holderKey: 'bench:18.8,-17' },
  { id: 'corr-e1b', x: 18.8, z: -16.2, ry: -Math.PI / 2, kind: 'bench', area: 'Hành lang Đông', sitH: 0.619, holderKey: 'bench:18.8,-16.2' },
  { id: 'corr-e2', x: 18.8, z: -9.8, ry: -Math.PI / 2, kind: 'bench', area: 'Hành lang Đông', sitH: 0.619, holderKey: 'bench:18.8,-9.8' },
  { id: 'corr-e2b', x: 18.8, z: -9.0, ry: -Math.PI / 2, kind: 'bench', area: 'Hành lang Đông', sitH: 0.619, holderKey: 'bench:18.8,-9' },
  { id: 'corr-e3', x: 18.8, z: -2.6, ry: -Math.PI / 2, kind: 'bench', area: 'Hành lang Đông', sitH: 0.619, holderKey: 'bench:18.8,-2.6' },
  { id: 'corr-e3b', x: 18.8, z: -1.8, ry: -Math.PI / 2, kind: 'bench', area: 'Hành lang Đông', sitH: 0.619, holderKey: 'bench:18.8,-1.8' },
  { id: 'corr-w1', x: -18.8, z: -17.0, ry: Math.PI / 2, kind: 'bench', area: 'Hành lang Tây', sitH: 0.619, holderKey: 'bench:-18.8,-17' },
  { id: 'corr-w1b', x: -18.8, z: -16.2, ry: Math.PI / 2, kind: 'bench', area: 'Hành lang Tây', sitH: 0.619, holderKey: 'bench:-18.8,-16.2' },
  { id: 'corr-w2', x: -18.8, z: -9.8, ry: Math.PI / 2, kind: 'bench', area: 'Hành lang Tây', sitH: 0.619, holderKey: 'bench:-18.8,-9.8' },
  { id: 'corr-w2b', x: -18.8, z: -9.0, ry: Math.PI / 2, kind: 'bench', area: 'Hành lang Tây', sitH: 0.619, holderKey: 'bench:-18.8,-9' },
  { id: 'corr-w3', x: -18.8, z: -2.6, ry: Math.PI / 2, kind: 'bench', area: 'Hành lang Tây', sitH: 0.619, holderKey: 'bench:-18.8,-2.6' },
  { id: 'corr-w3b', x: -18.8, z: -1.8, ry: Math.PI / 2, kind: 'bench', area: 'Hành lang Tây', sitH: 0.619, holderKey: 'bench:-18.8,-1.8' },
];

/**
 * Ghế đá vườn thiền (src/compound.ts `stoneSeat`, dài 1,8 m, không tựa).
 * Mặt ghế: GY 0,06 + tấm 0,52 + nửa dày 0,09 = 0,67 m trên mặt đất vườn.
 * Ghế không tựa nên hướng ngồi quay về vườn cát ở tâm (-34, -26).
 */
export const ZEN_STONE_SEATS: readonly CatalogSeat[] = [
  { id: 'zen-stone-w', x: -38.5, z: -20.5, ry: 2.4559, kind: 'stone', area: 'Vườn Thiền', sitH: 0.67, holderKey: 'seat:zen-stone-w' },
  { id: 'zen-stone-e', x: -35.5, z: -19.0, ry: 2.9305, kind: 'stone', area: 'Vườn Thiền', sitH: 0.67, holderKey: 'seat:zen-stone-e' },
];

/**
 * Băng ghế gỗ quanh hai bồn hoa hồ sen (src/compound.ts `woodBench`, dài 2,2 m)
 * và ba băng ghế khu nghỉ chân (dài 2,6 m). Mặt ghế: GY 0,06 + 0,5 + nửa dày
 * 0,05 = 0,61 m. Hướng mặt lấy đúng công thức dựng mesh: băng quay về tâm bồn
 * hoa / tâm khu nghỉ.
 */
export const GARDEN_WOOD_SEATS: readonly CatalogSeat[] = [
  { id: 'bed-e-n', x: 13.6, z: 27.8, ry: -2.3633, kind: 'bench', area: 'Bồn hoa Đông', sitH: 0.61, holderKey: 'seat:bed-e-n' },
  { id: 'bed-e-s', x: 13.6, z: 18.2, ry: -1.8712, kind: 'bench', area: 'Bồn hoa Đông', sitH: 0.61, holderKey: 'seat:bed-e-s' },
  { id: 'bed-w-n', x: -13.6, z: 27.8, ry: 2.3633, kind: 'bench', area: 'Bồn hoa Tây', sitH: 0.61, holderKey: 'seat:bed-w-n' },
  { id: 'bed-w-s', x: -13.6, z: 18.2, ry: 1.8712, kind: 'bench', area: 'Bồn hoa Tây', sitH: 0.61, holderKey: 'seat:bed-w-s' },
  { id: 'rest-a', x: -29.631, z: 29.9, ry: -1.0468, kind: 'bench', area: 'Khu nghỉ chân', sitH: 0.61, holderKey: 'seat:rest-a' },
  { id: 'rest-b', x: -35.0, z: 39.2, ry: Math.PI, kind: 'bench', area: 'Khu nghỉ chân', sitH: 0.61, holderKey: 'seat:rest-b' },
  { id: 'rest-c', x: -40.369, z: 29.9, ry: 1.0468, kind: 'bench', area: 'Khu nghỉ chân', sitH: 0.61, holderKey: 'seat:rest-c' },
];

/**
 * Băng ghế gỗ bồ đề (src/garden.ts `wooden_bench`, scale 1,125). Cao 0,619 m
 * đúng bằng hằng số NPC đang dùng cho cùng băng ghế.
 */
export const BODHI_WOOD_SEATS: readonly CatalogSeat[] = [
  { id: 'bodhi-bench', x: 35.5, z: 20, ry: -Math.PI / 2, kind: 'bench', area: 'Cây bồ đề', sitH: 0.619, holderKey: 'seat:bodhi-bench' },
];

function lowSeat(id: string, x: number, z: number, ry: number, area: string, wood = false): CatalogSeat {
  return { id, x, z, ry, area, sitH: 0.14, kind: wood ? 'bench' : 'stone', holderKey: `seat:${id}` };
}

export const CAVE_REST_SHELTERS = [[-30, -95], [28, -100]] as const;
export const BAMBOO_LOOP = { x0: BAMBOO.x - 3, x1: BAMBOO.x + 3.4, z0: -17.6, z1: -5.6, r: 1.8 };
export const LOTUS_LOW_SEATS = [
  lowSeat('lotus-s', LOTUS_PAVILION.x, LOTUS_PAVILION.z + 1.4, Math.PI, 'Đình ngắm sen', true),
  lowSeat('lotus-e', LOTUS_PAVILION.x + 1.1, LOTUS_PAVILION.z, -Math.PI / 2, 'Đình ngắm sen', true),
];
export const FARM_LOW_SEAT = lowSeat('farm-rest', -82.8, -41.9, Math.PI / 2, 'Vườn rau');
export const BAMBOO_LOW_SEATS = [
  lowSeat('bamboo-w', BAMBOO_LOOP.x0 - 1.1, (BAMBOO_LOOP.z0 + BAMBOO_LOOP.z1) / 2, Math.PI / 2, 'Rừng trúc'),
  lowSeat('bamboo-e', BAMBOO_LOOP.x1 + 1.1, (BAMBOO_LOOP.z0 + BAMBOO_LOOP.z1) / 2, -Math.PI / 2, 'Rừng trúc'),
];
export const FLOWER_LOW_SEATS = [
  lowSeat('flower-w', 71.6 + EAST_BANK_SHIFT, 28.0, Math.PI / 2, 'Vườn hoa'),
  lowSeat('flower-e', 86.6 + EAST_BANK_SHIFT, 29.4, -Math.PI / 2, 'Vườn hoa'),
  lowSeat('flower-s', 79 + EAST_BANK_SHIFT, 38.0, Math.PI, 'Vườn hoa'),
];
export const NGOC_LOW_SEATS = [-1, 1].map(side => lowSeat(`ngoc-${side}`, NGOC.x + side * 8.7, NGOC.stairTop - 2.45, Math.PI, 'Chùa Ngọc'));
export const CAVE_LOW_SEATS = CAVE_REST_SHELTERS.map(([x, z], i) =>
  [-1, 1].map(side => lowSeat(`cave-${i}-${side}`, x + side * 0.9, z, 0, 'Nhà nghỉ chân', true)));

/** Toàn bộ ghế thật người chơi ngồi được (không tính bồ đoàn thiền). */
export const SEAT_CATALOG: readonly CatalogSeat[] = [
  ...CORRIDOR_BENCH_SEATS, ...ZEN_STONE_SEATS, ...GARDEN_WOOD_SEATS, ...BODHI_WOOD_SEATS,
  ...LOTUS_LOW_SEATS, FARM_LOW_SEAT, ...BAMBOO_LOW_SEATS, ...FLOWER_LOW_SEATS, ...NGOC_LOW_SEATS, ...CAVE_LOW_SEATS.flat(),
];

const BY_ID = new Map(SEAT_CATALOG.map((s) => [s.id, s]));

export function seatById(id: string | null | undefined): CatalogSeat | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Khoảng cách tối đa để hiện nút "Ngồi" (máy chủ nới thêm một chút). */
export const SEAT_REACH_M = 1.5;

/** Ghế gần nhất trong bán kính `maxDist` quanh (x, z); null nếu không có. */
export function nearestSeat(x: number, z: number, maxDist = SEAT_REACH_M): CatalogSeat | null {
  let best: CatalogSeat | null = null;
  let bd = maxDist;
  for (const s of SEAT_CATALOG) {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d <= bd) { best = s; bd = d; }
  }
  return best;
}

/**
 * Độ cao thân tuyệt đối khi ngồi ghế thật, để gấu áo (body.y + 0,17) chạm mặt ghế
 * cao `sitH` so với chân nhân vật. Gán thẳng sau khi chạy dáng 'sit' thay vì cộng
 * thêm, nên không phụ thuộc giá trị body.y mà dáng ngồi để lại.
 * Kiểm chứng: ghế hành lang sitH 0,619 → 0,449, đúng BENCH_BODY_Y của NPC.
 */
export function seatBodyY(sitH: number): number {
  return sitH - 0.17;
}

/**
 * Chỗ đứng dậy: lùi về sau lưng người ngồi `out` mét. Ghế hành lang và băng ghế
 * vườn đều có collider bán kính 0,5 m, thân người 0,4 m, nên 1,05 m luôn ở
 * ngoài collider — đứng dậy không bị đẩy hay kẹt.
 */
export function seatStandAt(seat: { x: number; z: number; ry: number }, out = 1.05): { x: number; z: number } {
  return { x: seat.x - Math.sin(seat.ry) * out, z: seat.z - Math.cos(seat.ry) * out };
}
