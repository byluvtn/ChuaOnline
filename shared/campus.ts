// Shared by scene, movement, server rules and pathfinding. Coordinates are metres.
export const ZAFU_SCALE = 1.5;
export const ZAFU_RADIUS = 0.38;
export const ZAFU_HEIGHT = 0.10;
export const WALL = { xW: -92, xE: 104, zN: -130, zS: 45, gate: 4.4, sideGateZ: 2, sideGateHalf: 2.2 };
export const MAP_Z_MIN = WALL.zN;
export const LAKE = { x: 0, z: 14, a: 14, b: 10 };
export const BRIDGE = { x: 0, z0: 2, z1: 26, hw: 2.3, peak: 1.4 };
export const LOTUS = { x: -78, z: -2, a: 10, b: 7 };
export const LOTUS_PAVILION = { x: -70, z: 5 };
const FALLS_SCALE = 1.5;
export const RIVER_FALLS = { x: 80, z: -82, scale: FALLS_SCALE, hw: 8 * FALLS_SCALE, wallHw: 10 * FALLS_SCALE };
// Keep the west bank beside the existing garden ring when widening the river.
const LOWER_RIVER_X = 61.5 + RIVER_FALLS.hw;
export const RIVER = {
  pond: { x: LOWER_RIVER_X, z: 14, a: RIVER_FALLS.hw, b: 3.8 * FALLS_SCALE },
  bridges: [-38, 2], bridgeHalf: 1.4, bridgeY: 0.28,
};
export const RIVER_EAST_WALK_X = LOWER_RIVER_X + RIVER_FALLS.hw + 1.8;
export const EAST_BANK_SHIFT = RIVER_EAST_WALK_X - 79.3;
/**
 * Đường tim Sông Đông, từ bắc (thác) xuống nam (ao), nội suy tuyến tính theo z.
 * `x` là tim sông và `hw` là nửa chiều rộng mặt nước tại z đó.
 * Lòng sông rộng bằng chân thác Bản Giốc trên toàn tuyến.
 */
export const RIVER_PATH = [
  { z: RIVER_FALLS.z, x: RIVER_FALLS.x },
  { z: -70, x: 78.7 },
  { z: -58, x: 76 },
  { z: -48, x: 74.3 },
  { z: -38, x: LOWER_RIVER_X },
  { z: RIVER.pond.z, x: RIVER.pond.x },
].map(p => ({ ...p, hw: RIVER_FALLS.hw }));
export const RIVER_SOURCE_Z = RIVER_PATH[0].z;
export const RIVER_MOUTH_Z = RIVER_PATH[RIVER_PATH.length - 1].z;

/** Tim sông + nửa chiều rộng tại z (kẹp về hai mốc đầu/cuối ngoài khoảng nội suy). */
export function riverAt(z: number): { x: number; hw: number } {
  const first = RIVER_PATH[0], last = RIVER_PATH[RIVER_PATH.length - 1];
  if (z <= first.z) return { x: first.x, hw: first.hw };
  if (z >= last.z) return { x: last.x, hw: last.hw };
  for (let i = 1; i < RIVER_PATH.length; i++) {
    const a = RIVER_PATH[i - 1], b = RIVER_PATH[i];
    if (z <= b.z) {
      const t = (z - a.z) / (b.z - a.z);
      return { x: a.x + (b.x - a.x) * t, hw: a.hw + (b.hw - a.hw) * t };
    }
  }
  return { x: last.x, hw: last.hw };
}
export const FARM = { x: -76, z: -42 };
export const FARM_POND = { x: -70, z: -35, a: 3.2, b: 2.2 };
export const RIVER_BRIDGES = RIVER.bridges.map(z => {
  const { x, hw } = riverAt(z);
  return { x, z, halfSpan: hw + 1.8 }; // includes dry landings on both banks
});
export function onRiverBridge(x: number, z: number, clearance = 0) {
  return RIVER_BRIDGES.some(b => Math.abs(x - b.x) <= b.halfSpan && Math.abs(z - b.z) <= RIVER.bridgeHalf - clearance);
}

export const BAMBOO = { x: 85 + EAST_BANK_SHIFT, z: -3 };
export const FLOWER_HILL = { x: 79 + EAST_BANK_SHIFT, z: 28 };
export const CAVE = { x: -26, z: -104 };
export const DUOC_SU = { x: 85 + EAST_BANK_SHIFT, z: -38, hx: 4.5, hz: 6, y: 0.45 };
export const DUOC_SU_YAW = -Math.PI / 2;
export const duocSuWorld = (x: number, z: number) => ({ x: DUOC_SU.x - z, z: DUOC_SU.z + x });
export const DUOC_SU_DOOR = duocSuWorld(0, DUOC_SU.hx + 0.7);
export const NGOC = { x: 0, z: -120, y: 8.4, stairStart: -90, stairTop: -116, stairHalf: 3.8, steps: 299, landingDepth: 2.5, approachHalf: 5.8 };
export const NGOC_TERRACE = { half: 11.5, north: -128.5 };
export const NGOC_HALL = { x: NGOC.x, z: -123.55, hx: 6.2, hz: 3.6 };
export const NORTH_WALK_Z = -82;
export const NGOC_EAST_LANE = { x: 22, south: -46, half: 1.6 };
export const TINH_THAT = [{ x: -84, z: -74 }, { x: -79, z: -74 }, { x: -74, z: -74 }];
export const TINH_THAT_LANE_Z = TINH_THAT[0].z + 2.6;
export const PHONG_CD = { x: 35, z: 33 };
export const PHONG_CD_YAW = -Math.PI / 2;
export const PHONG_CD_DOOR = { x: PHONG_CD.x - 4.5, z: PHONG_CD.z };
export const phongCdWorld = (x: number, z: number) => ({ x: PHONG_CD.x - z, z: PHONG_CD.z + x });

export function ngocStepProfile(): { z0: number; z1: number; y: number }[] {
  const result = [];
  const tread = (NGOC.stairStart - NGOC.stairTop - 2 * NGOC.landingDepth) / NGOC.steps;
  let z = NGOC.stairStart, n = 0;
  for (const count of [99, 100, 100]) {
    for (let i = 0; i < count; i++) {
      n++;
      const next = z - tread;
      result.push({ z0: next, z1: z, y: NGOC.y * n / NGOC.steps });
      z = next;
    }
    if (n < NGOC.steps) {
      result.push({ z0: z - NGOC.landingDepth, z1: z, y: NGOC.y * n / NGOC.steps });
      z -= NGOC.landingDepth;
    }
  }
  return result;
}

const steps = ngocStepProfile();
export function expansionGroundY(x: number, z: number): number {
  const dx = Math.abs(x - NGOC.x);
  if (dx <= NGOC_TERRACE.half && z <= NGOC.stairTop && z >= NGOC_TERRACE.north) return NGOC.y;
  if (dx <= NGOC.stairHalf && z <= NGOC.stairStart && z >= NGOC.stairTop) {
    // Binary search keeps stair sampling cheap for every player/NPC each frame.
    let lo = 0, hi = steps.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (z < steps[mid].z0 - 1e-8) lo = mid + 1;
      else hi = mid;
    }
    return steps[lo].y;
  }
  return ngocHillGroundY(x, z);
}

/** Natural slope, without the built stair and summit surfaces. */
export function ngocHillGroundY(x: number, z: number): number {
  const dx = Math.abs(x - NGOC.x);
  const blend = Math.min(1, Math.max(0, (dx - 6) / 10));
  const south = NGOC.stairStart + (NORTH_WALK_Z - NGOC.stairStart) * blend;
  const north = south - 39;
  if (z > south || z < north || dx > 40) return 0;
  const rise = Math.min(1, (south - z) / 30);
  const taper = Math.max(0, Math.min(1, (40 - dx) / 35));
  const northEdge = Math.min(1, (z - north) / 2);
  // Keep the whole transverse walkway clear of the hill mesh (including its interpolated edge).
  const walkEdge = Math.min(1, Math.max(0, (NORTH_WALK_Z - 2 - z) / 2));
  return NGOC.y * rise * taper * northEdge * walkEdge;
}

export function inEllipse(x: number, z: number, p: { x: number; z: number; a: number; b: number }, pad = 0): boolean {
  return ((x - p.x) / (p.a + pad)) ** 2 + ((z - p.z) / (p.b + pad)) ** 2 < 1;
}

/** Water outside the three traversable bridge decks (body clearance included). */
export function expansionWaterBlocked(x: number, z: number): boolean {
  if (inEllipse(x, z, LOTUS, 0.25) && !(Math.abs(z - 2) <= 0.9 && x >= -90 && x <= -66)) return true;
  if (inEllipse(x, z, FARM_POND, 0.25)) return true;
  if (z >= RIVER_SOURCE_Z - 0.25 && z <= RIVER_MOUTH_Z + 0.25) {
    const { x: cx, hw } = riverAt(z);
    if (Math.abs(x - cx) < hw + 0.25 && !onRiverBridge(x, z, 0.4)) return true;
  }
  return inEllipse(x, z, RIVER.pond, 0.25);
}

/** Reject water-entry steps; recover saved points at the nearest sampled dry spot. */
export function resolveExpansionWater(p: { x: number; z: number }, prev?: { x: number; z: number }) {
  if (!expansionWaterBlocked(p.x, p.z)) return;
  if (prev && !expansionWaterBlocked(prev.x, prev.z)) {
    p.x = prev.x; p.z = prev.z;
    return;
  }
  const x = p.x, z = p.z;
  for (let radius = 0.2; radius <= 24; radius += 0.2) {
    for (let i = 0; i < 64; i++) {
      const angle = i * Math.PI / 32;
      const xx = x + Math.cos(angle) * radius, zz = z + Math.sin(angle) * radius;
      if (!expansionWaterBlocked(xx, zz)) { p.x = xx; p.z = zz; return; }
    }
  }
  p.x = 0; p.z = 30;
}

/** Shared wall limits, including short exterior pockets at the side gates. */
export function clampCampus(p: { x: number; z: number }) {
  const inSideGate = Math.abs(p.z - WALL.sideGateZ) < WALL.sideGateHalf - 0.4;
  const inset = inSideGate ? -4 : 0.8;
  p.x = Math.max(WALL.xW + inset, Math.min(WALL.xE - inset, p.x));
  p.z = Math.max(WALL.zN + 0.8, Math.min(WALL.zS + 13, p.z));
  if (Math.abs(p.x) > WALL.gate && p.z > WALL.zS - 0.8 && p.z < WALL.zS + 0.8) p.z = p.z < WALL.zS ? WALL.zS - 0.8 : WALL.zS + 0.8;
}
