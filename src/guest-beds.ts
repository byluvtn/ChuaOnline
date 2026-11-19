/**
 * Nhà Khách (NHA_KHACH): bốn giường khách, hai bên lối đi giữa.
 *
 * Một nguồn duy nhất cho cả nội thất (src/temple.ts dựng mesh + collider) và
 * logic nghỉ của NPC (server/npcs.ts giữ giường, đi tới, nằm, dậy), nên hai
 * phía không thể lệch toạ độ. Đầu giường quay Bắc (−Z) nên NPC nằm với ry = 0,
 * đúng tư thế 'lie' của src/character.ts (đầu về local −Z, thân dịch +Z).
 */
import { NHA_KHACH, NHA_KHACH_PLAT } from './layout';

/** Nửa kích thước lòng nhà — trùng tham số buildHouse của Nhà Khách trong src/temple.ts. */
export const GUEST_HOUSE = { hx: 4.6, hz: 3.25 } as const;
/** Giường 2,0 m (trục Z) × 0,9 m (trục X), khung 0,3 m + chiếu 0,05 m như giường Tăng Xá. */
export const GUEST_BED_SIZE = { w: 0.9, d: 2.0, frameH: 0.3, matH: 0.05 } as const;
/** Mặt chiếu so với gốc nhân vật; tư thế 'lie' (character.ts) canh theo đúng số này. */
export const GUEST_MATTRESS_TOP = GUEST_BED_SIZE.frameH + GUEST_BED_SIZE.matH;
/** Bán kính vòng collider dọc giường (nửa bề ngang) và số vòng mỗi giường. */
export const GUEST_BED_COLLIDER_R = GUEST_BED_SIZE.w / 2;

/**
 * Tâm giường: hai giường mỗi bên, cùng x, khác z; chừa lối đi giữa rộng 6,0 m.
 * 3,0 m từ tim nhà: giường (nửa rộng 0,45) cách băng ghế dài phía Tây (collider r 0,5
 * ở x −51,25) và vách Đông (collider tới x −43,19) một khoảng trống, không chồng.
 */
const BED_OFFSET_X = 3.0;
/** Hai giường mỗi bên nằm trong nửa Nam của nhà (chừa bộ bàn trà phía Bắc và lối vào). */
const BED_OFFSET_Z = [1.9, -1.1] as const;
/** Điểm đứng cạnh giường, phía lối đi giữa (NPC bước ngang vào giường). */
const STAND_GAP = GUEST_BED_SIZE.w / 2 + 0.55;

export interface GuestBed {
  id: number;
  /** Tâm giường (world). */
  x: number;
  z: number;
  /** Hướng nằm: 0 = đầu quay Bắc (−Z). */
  ry: number;
  /** Điểm đứng cạnh giường trước khi nằm (world), phía lối đi giữa. */
  standX: number;
  standZ: number;
}

export const GUEST_BEDS: readonly GuestBed[] = ([-1, 1] as const).flatMap((side, si) =>
  BED_OFFSET_Z.map((dz, i) => ({
    id: si * 2 + i,
    x: NHA_KHACH.x + side * BED_OFFSET_X,
    z: NHA_KHACH.z + dz,
    ry: 0,
    // Đứng cạnh giường phía lối đi giữa, cùng z với tâm giường (bước ngang vào giường).
    standX: NHA_KHACH.x + side * (BED_OFFSET_X - STAND_GAP),
    standZ: NHA_KHACH.z + dz,
  })),
);

/** Điểm vừa qua cửa Nhà Khách (world), dùng cho tuyến đi vào/ra. */
export const GUEST_DOOR_IN: { x: number; z: number } = {
  x: NHA_KHACH.x,
  z: NHA_KHACH.z + GUEST_HOUSE.hz - 0.85,
};

/** Lối đi giữa nhà: dải x = tâm nhà ±(BED_OFFSET_X − nửa giường − 0,55) mà không giường nào chạm. */
export const GUEST_AISLE_HALF = BED_OFFSET_X - GUEST_BED_SIZE.w / 2 - 0.55;

/** Collider giường (đồ nội thất lớn bắt buộc chặn người chơi): 3 vòng r 0,45 dọc giường. */
export function guestBedColliders(): { x: number; z: number; r: number }[] {
  return GUEST_BEDS.flatMap((b) =>
    [-0.7, 0, 0.7].map((dz) => ({ x: b.x, z: b.z + dz, r: GUEST_BED_COLLIDER_R })),
  );
}

/** Nền Nhà Khách — để đối chiếu cao độ khi kiểm tra (NPC đứng trên nền này). */
export const GUEST_FLOOR_Y = NHA_KHACH_PLAT.y;
