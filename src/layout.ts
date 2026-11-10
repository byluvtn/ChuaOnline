/** Shared layout constants + height/blocking queries for the temple compound. */
export const HALL = { x: 0, z: -32, hx: 17, hz: 10, h: 1.35, ramp: 1.1 };
export const DECK = { x0: 4.6, x1: 17.2, z0: -18.6, z1: -4, y: 0.2 };
export const CORR = { x: 20.5, z0: -19, z1: -1, half: 1.9, y: 0.12 };
/** Hồ cá koi nay nằm giữa khuôn viên, trên trục Bắc–Nam giữa sân chùa và tam quan. */
export const LAKE = { x: 0, z: 22, a: 9, b: 6.5 };
/** Cầu cong bắc qua hồ theo trục z (lối đi chính từ sân chùa ra cổng). */
export const BRIDGE = { x: 0, z0: 14.2, z1: 29.8, hw: 1.15, peak: 1.4 };
export const WALL = { x: 47, zN: -45, zS: 45, gate: 4.4 };
export const BELL = { x: -34, z: -6 };
export const QUAN = { x: -34, z: -26 };
export const PATH_Z = 2;
export const SIDE_X = 28;
export const PAGODA = { x: 38, z: -14 };
export const BUDDHA_YARD = { x: -28, z: 14 };
/** Sân trước chùa (quảng trường nhỏ) — thu gọn để nhường chỗ cho hồ sen giữa khuôn viên. */
export const PLAZA = { x: 0, z: 6, r: 8.4 };

export function bridgeY(x: number, z: number) {
  if (Math.abs(x - BRIDGE.x) > BRIDGE.hw + 0.3) return 0;
  const c = (BRIDGE.z0 + BRIDGE.z1) / 2, half = (BRIDGE.z1 - BRIDGE.z0) / 2;
  const u = (z - c) / half;
  if (Math.abs(u) > 1) return 0;
  return 0.12 + BRIDGE.peak * (1 - u * u);
}

/** Ground height under (x, z): hall platform, meditation decks, corridors and bridge are raised. */
export function groundY(x: number, z: number) {
  let y = 0;
  const dx = Math.max(Math.abs(x - HALL.x) - HALL.hx, 0), dz = Math.max(Math.abs(z - HALL.z) - HALL.hz, 0);
  const d = Math.hypot(dx, dz);
  if (d < HALL.ramp) y = HALL.h * (1 - d / HALL.ramp);
  const ax = Math.abs(x);
  if (ax >= DECK.x0 && ax <= DECK.x1 && z >= DECK.z0 && z <= DECK.z1) y = Math.max(y, DECK.y);
  if (Math.abs(ax - CORR.x) <= CORR.half && z >= CORR.z0 && z <= CORR.z1) y = Math.max(y, CORR.y);
  return Math.max(y, bridgeY(x, z));
}

export function inLake(x: number, z: number, pad = 0) {
  const a = LAKE.a + pad, b = LAKE.b + pad;
  return ((x - LAKE.x) / a) ** 2 + ((z - LAKE.z) / b) ** 2 < 1;
}

/** Areas where scenery (trees, flowers) must not spawn. */
export function blocked(x: number, z: number) {
  const ax = Math.abs(x);
  if (ax < 6 && z > -22) return true;
  if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.r + 3.5) return true;
  if (ax < HALL.hx + 5 && Math.abs(z - HALL.z) < HALL.hz + 5) return true;
  if (ax < 24.5 && z > -21 && z < 1.5) return true;
  if (inLake(x, z, 3.5) || (Math.abs(x - BRIDGE.x) < 4 && z > BRIDGE.z0 - 2 && z < BRIDGE.z1 + 2)) return true;
  if (Math.hypot(x - BELL.x, z - BELL.z) < 7 || Math.hypot(x - QUAN.x, z - QUAN.z) < 7) return true;
  if (Math.hypot(x - PAGODA.x, z - PAGODA.z) < 6) return true;
  if (Math.hypot(x - BUDDHA_YARD.x, z - BUDDHA_YARD.z) < 9) return true;
  if (Math.abs(z - PATH_Z) < 2.5 && ax < 40) return true;
  if (Math.abs(x + SIDE_X) < 2.5 && z > QUAN.z - 6 && z < PATH_Z + 2.5) return true;
  if (Math.abs(x - PAGODA.x) < 2.5 && z > PAGODA.z - 3 && z < PATH_Z + 2.5) return true;
  return false;
}

/** Keep walkers inside the compound walls (the south gate stays open). */
export function clampToCompound(p: { x: number; z: number }) {
  p.x = Math.max(-WALL.x + 0.8, Math.min(WALL.x - 0.8, p.x));
  p.z = Math.max(WALL.zN + 0.8, p.z);
  if (Math.abs(p.x) > WALL.gate && p.z > WALL.zS - 0.8 && p.z < WALL.zS + 1.5) p.z = WALL.zS - 0.8;
}

/** Keep walkers out of the lake except on the bridge deck. */
export function resolveWater(p: { x: number; z: number }) {
  if (!inLake(p.x, p.z)) return;
  if (Math.abs(p.x - BRIDGE.x) < BRIDGE.hw + 0.6) {
    p.x = Math.max(BRIDGE.x - BRIDGE.hw + 0.1, Math.min(BRIDGE.x + BRIDGE.hw - 0.1, p.x));
    return;
  }
  const ux = (p.x - LAKE.x) / LAKE.a, uz = (p.z - LAKE.z) / LAKE.b;
  const l = Math.hypot(ux, uz) || 1;
  const k = 1.02 / l;
  p.x = LAKE.x + ux * k * LAKE.a; p.z = LAKE.z + uz * k * LAKE.b;
}
