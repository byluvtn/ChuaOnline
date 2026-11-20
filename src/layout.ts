/** Shared layout constants + height/blocking queries for the temple compound. */
import { WALL, LAKE, BRIDGE, LOTUS, LOTUS_PAVILION, RIVER, RIVER_BRIDGES, RIVER_EAST_WALK_X, riverBridgeY, DUOC_SU, NGOC, NGOC_EAST_LANE, NGOC_TERRACE, NORTH_WALK_Z, TINH_THAT, TINH_THAT_LANE_Z, PHONG_CD, PHONG_CD_DOOR, FARM_POND, expansionGroundY, expansionWaterBlocked, inEllipse, resolveExpansionWater, clampCampus } from '../shared/campus';
export * from '../shared/campus';
import { onWestGateWalk } from '../shared/campus';
import { riverDockY } from '../shared/river-tour';
export const HALL = { x: 0, z: -32, hx: 17, hz: 10, h: 1.35, ramp: 1.1 };
export const DECK = { x0: 4.6, x1: 17.2, z0: -18.6, z1: -4, y: 0.2 };
export const CORR = { x: 20.5, z0: -19, z1: -1, half: 2.6, y: 0.12 };
export const BELL = { x: 34, z: -6 };
export const DRUM = { x: -34, z: -6 };
export const DEN_TRINH = { x: 11, z: 39 };
// Sàn Đền Trình: temple.ts:1130-1131, dtStone(4.4, 0.35, 3.6), mặt sàn y = 0.35
export const DEN_TRINH_FLOOR = { x: 11, z: 39, hx: 1.8, hz: 2.2, y: 0.35 };
/** Sân tượng Quan Âm (Đông), đối xứng BUDDHA_YARD (Tây). */
export const QUAN = { x: 28, z: 14 };
export const PIER = { x0: -10.6, x1: -4.4, z: 23, hw: 1.6, y: 0.55 };
export const PIER_RAMP = 1.3;
export const PIER_FLOOR = { x: -6.7, z: 23, hx: 2.2, hz: 1.7, y: 0.77 };
export const PATH_Z = 2;
export const SIDE_X = 28;
export const PAGODA = { x: 34, z: -15 };
export const TAM_THE = { x: 0, z: -68 };
/** A3: Bảo Tháp moved north-west of Động Thiền, clear of Gác Trống and Thiền Đường. */
export const BAO_THAP = { x: -46, z: -102 };
/**
 * Nền Điện Tam Thế: mặt nền đi được cao 3.0 (hx/hz theo trục thế giới), sườn dốc thoải 1.2 quanh nền;
 * thang lớn giữa trục (|x| <= stairW) dốc đều từ y 0 ở zStart lên y 3.0 ở stairTop (world z của bậc trên cùng).
 */
export const TAM_THE_PLAT = {
  x: TAM_THE.x, z: TAM_THE.z,
  hx: 20, hz: 12, y: 3.0, ramp: 1.2,
  stairW: 4.2, zStart: -50, stairTop: -57.6,
};
/**
 * Nền + bậc thềm Bảo Tháp: mặt nền đi được cao 0.9, bậc thềm thấp dần về phía Nam
 * (cửa của tháp quay về hướng Nam) để khách hành hương đi tới được cửa.
 */
export const BAO_THAP_PLAT = {
  x: BAO_THAP.x, z: BAO_THAP.z,
  r: 5.0,          // bán kính mặt nền đi được (nằm trong bệ đá 2 tầng)
  y: 0.9,          // cao độ mặt nền
  stepW: 1.3,      // nửa rộng bậc thềm
  step1: { z0: 5.0, z1: 5.9, y: 0.6 },
  step2: { z0: 5.9, z1: 6.8, y: 0.45 }, // 0.45 = mặt bệ base1 (đo raycast: seal-filler phủ bậc 2 ở 0.47, bậc hộp 0.3 bị chôn; 0.45 khớp filler ±0.02, mesh+groundY đồng bộ qua hằng này)
};
export const NHA_TO = { x: 36, z: -68 };
export const NHA_TO_PLAT = { x: NHA_TO.x, z: NHA_TO.z, hx: 6.0, hz: 4.25, y: 0.3, ramp: 0.8 };
export const TANG_XA = { x: -64, z: -74 };
export const TANG_XA_PLAT = { x: TANG_XA.x, z: TANG_XA.z, hx: 6, hz: 4.0, y: 0.25, ramp: 0.8 };
export const AM_CO = { x: 53, z: -75 };
export const AM_CO_PLAT = { x: AM_CO.x, z: AM_CO.z, hx: 3.25, hz: 2.75, y: 0.35, ramp: 0.8 };
export const DIEN_MAU = { x: 39, z: 10 };
export const DIEN_MAU_PLAT = { x: DIEN_MAU.x, z: DIEN_MAU.z, hx: 4.0, hz: 3.2, y: 0.25, ramp: 0.8 };
export const NHA_KHACH = { x: -47, z: -61 };
export const NHA_KHACH_PLAT = { x: NHA_KHACH.x, z: NHA_KHACH.z, hx: 6.0, hz: 4.25, y: 0.25, ramp: 0.8 };
/** Thiền đường: mặt tiền hướng Đông, hx/hz theo trục THẾ GIỚI của bệ nền. */
export const THIEN_DUONG = { x: -47, z: -27 };
export const THIEN_DUONG_PLAT = { x: THIEN_DUONG.x, z: THIEN_DUONG.z, hx: 6.5, hz: 4.5, y: 0.25, ramp: 0.8 };
export const TRAI_DUONG = { x: -29, z: -61 };
export const TRAI_DUONG_PLAT = { x: TRAI_DUONG.x, z: TRAI_DUONG.z, hx: 6.0, hz: 3.75, y: 0.25, ramp: 0.8 };
export const VUON_THAP = { x: 50, z: -94 };
export const VUON_THAP_PLAT = { x: VUON_THAP.x, z: VUON_THAP.z, hx: 7.0, hz: 5.0, y: 0.2, ramp: 0.8 };
export const PHONG_CD_PLAT = { x: PHONG_CD.x, z: PHONG_CD.z, hx: 4.0, hz: 5.5, y: 0.25, ramp: 0.8 };
/** Viện Khách Tăng (Tây) và Viện Tổ (Đông): hình chữ nhật có rào, cổng ở mặt Nam tại gateX. */
export const VIEN_KT = { x0: -58, x1: -22, z0: -80, z1: -54, gateX: -30 };
export const VIEN_TO = { x0: 24, x1: 58, z0: -80, z1: -54, gateX: 30 };
/** Vườn Phóng Sinh: ô đất, ao elip và bến thả cá ở bờ Tây của ao. */
export const PS = { x: 41, z: -31, w: 30, d: 22 };
export const PS_POND = { x: 41, z: -31, a: 7.5, b: 5.5 };
export const PS_PIER = { x0: 25.5, x1: 34, z: -31, hw: 1.5, y: 0.35, ramp: 1.3 };
export const BUDDHA_YARD = { x: -28, z: 14 };
/** Southern forecourt reference only; the circular plaza has been removed. */
export const PLAZA = { x: 0, z: 1, r: 0 };
/** Meditation garden, south-west rest area and the two retained flower beds. */
export const ZEN = { x: -34, z: -26 };
// Vườn cát thiền: zen_sand_garden.glb, đế 3.0x2.0 m, scale 2.0, mặt cát GLB y 0.34 x 2 = 0.68
export const ZEN_GARDEN = { x: ZEN.x, z: ZEN.z, hx: 3.0, hz: 2.0, ry: 0.2, y: 0.68 };
export const REST = { x: -35, z: 33 };
export const FLOWER_BEDS = [{ x: 16.5, z: 23, a: 5, b: 3.5 }, { x: -16.5, z: 23, a: 5, b: 3.5 }];

/** Actual stone footprints, shared by the renderer and scenery placement. */
export const MAIN_COURT = [-20, -42, 20, 2] as const;
export const NGOC_APPROACH = [NGOC.x - NGOC.approachHalf, NGOC.stairStart, NGOC.x + NGOC.approachHalf, NORTH_WALK_Z - 1.2] as const;
export const NGOC_EAST_PAVING = [NGOC_EAST_LANE.x - NGOC_EAST_LANE.half, NORTH_WALK_Z + 1.2, NGOC_EAST_LANE.x + NGOC_EAST_LANE.half, -48] as const;
export const NGOC_EAST_MAP_RECTS = [NGOC_EAST_PAVING, [NGOC.x, NORTH_WALK_Z - 1.2, NGOC_EAST_PAVING[2], NORTH_WALK_Z + 1.2], NGOC_APPROACH] as const;
const bridgeApproachHalf = BRIDGE.hw + 0.25;
export const WALKWAY_RECTS = [
  [WALL.xW - 4, PATH_Z - 1.1, WALL.xE + 4, PATH_Z + 1.1],
  [SIDE_X - 1.2, PATH_Z, SIDE_X + 1.2, QUAN.z],
  [PAGODA.x - 1.2, PAGODA.z, PAGODA.x + 1.2, PATH_Z],
  [-SIDE_X - 1.2, PATH_Z, -SIDE_X + 1.2, BUDDHA_YARD.z],
  [DRUM.x, DRUM.z - 1.2, -SIDE_X, DRUM.z + 1.2],
  [SIDE_X, BELL.z - 1.2, BELL.x, BELL.z + 1.2],
  [SIDE_X - 1.2, BELL.z, SIDE_X + 1.2, PATH_Z],
  [BRIDGE.x - bridgeApproachHalf, 24.8, BRIDGE.x + bridgeApproachHalf, WALL.zS],
  // Paved alternatives around both banks of the lake, in addition to the bridge.
  [-BRIDGE.x - (LAKE.a + 3.4), 24.8, BRIDGE.x + LAKE.a + 3.4, 26.6],
  [LAKE.a + 1.4, PATH_Z, LAKE.a + 3.4, 26.6],
  [-LAKE.a - 3.4, PATH_Z, -LAKE.a - 1.4, 26.6],
  [BRIDGE.x + bridgeApproachHalf, DEN_TRINH.z - 1.2, DEN_TRINH.x - 2.6, DEN_TRINH.z + 1.2],
  [-SIDE_X - 1.2, ZEN.z, -SIDE_X + 1.2, PATH_Z],
  // A4: west gate straight walk is now ordinary paving — no lake to bridge at z = 2.
  [WALL.xW, PATH_Z - 1.4, 0, PATH_Z + 1.4],
  // A4: small flat landing at the relocated pavilion's south-east approach.
  [LOTUS_PAVILION.x - 2.7, LOTUS_PAVILION.z - 4.2, LOTUS_PAVILION.x + 2.7, LOTUS_PAVILION.z - 2.2],
  [LOTUS_PAVILION.x + 2.7, LOTUS.z - LOTUS.b, LOTUS_PAVILION.x + 4.7, LOTUS_PAVILION.z],
  [-58, -48, 58, -43], [-1.2, -51, 1.2, -42],
  [VIEN_KT.gateX - 1.2, -58, VIEN_KT.gateX + 1.2, -43],
  [VIEN_TO.gateX - 1.2, -58, VIEN_TO.gateX + 1.2, -43],
  [-60.3, -78, -57.7, 41], [57.7, -78, 60.3, 41], [-58, 39.8, 58, 42.2],
  [PHONG_CD_DOOR.x - 3.2, PHONG_CD.z - 1.2, PHONG_CD_PLAT.x - PHONG_CD_PLAT.hx, PHONG_CD.z + 1.2],
  [PHONG_CD_DOOR.x - 4.2, PHONG_CD.z, PHONG_CD_DOOR.x - 2.2, 41],
  [19.8, -31, 22.2, -19], [19.8, -32.2, 25.5, -29.8],
  [50.3, -31, 52.7, -23], [33, -25.2, 52.7, -22.8],
  [BAO_THAP.x - 1.2, BAO_THAP.z + 5, BAO_THAP.x + 1.2, BAO_THAP.z + BAO_THAP_PLAT.r + 6],
  [BAO_THAP.x - 1.2, -88, BAO_THAP.x + 1.2, -82],
  [THIEN_DUONG.x + THIEN_DUONG_PLAT.hx, THIEN_DUONG.z - 1.2, -SIDE_X - 1.2, THIEN_DUONG.z + 1.2],
  [28, 8.8, 35, 11.2], [-48, -59.2, -27, -56.8], [-42.2, -67, -39.8, -58],
  [27, -59.2, 50, -56.8], [34.8, -63.75, 37.2, -58],
  [REST.x + 2, REST.z - 1.2, BRIDGE.x - bridgeApproachHalf, REST.z + 1.2],
  [-65.2, -70.5, -62.8, -67.3], [-72.5, -69.5, -58.5, -67.3],
  [TINH_THAT[0].x - 1, TINH_THAT_LANE_Z - 1, -70.5, TINH_THAT_LANE_Z + 1],
  ...TINH_THAT.map(({ x, z }): [number, number, number, number] => [x - 0.72, z + 1.25, x + 0.72, TINH_THAT_LANE_Z]),
  [-72.5, -79, -70.5, -59.5], [-77.2, -67.1, -74.8, 1], [-76, -43.2, -59, -40.8],
  [59, RIVER_BRIDGES[0].z - 1.2, RIVER_BRIDGES[0].x - RIVER_BRIDGES[0].halfSpan + 0.1, RIVER_BRIDGES[0].z + 1.2],
  [RIVER_EAST_WALK_X - 1.1, DUOC_SU.z, RIVER_EAST_WALK_X + 1.1, PATH_Z - 1.1],
  [RIVER_EAST_WALK_X - 1.1, PATH_Z + 1.1, RIVER_EAST_WALK_X + 1.1, 28],
  [RIVER_EAST_WALK_X, DUOC_SU.z - 1.1, DUOC_SU.x - DUOC_SU.hx, DUOC_SU.z + 1.1],
  [-59, NORTH_WALK_Z - 1.2, 59, NORTH_WALK_Z + 1.2],
  NGOC_EAST_PAVING,
  NGOC_APPROACH,
  [-60.2, NORTH_WALK_Z, -57.8, -77], [57.8, NORTH_WALK_Z, 60.2, -77],
  [48.8, -89, 51.2, -82], [WALL.xW, WALL.zS, WALL.xE, WALL.zS + 13],
] as const;
const PLANT_FREE_RECTS = [MAIN_COURT, ...WALKWAY_RECTS,
  [NGOC.x - NGOC.stairHalf - 1, NGOC.stairTop, NGOC.x + NGOC.stairHalf + 1, NGOC.stairStart],
  [NGOC.x - NGOC_TERRACE.half, NGOC_TERRACE.north, NGOC.x + NGOC_TERRACE.half, NGOC.stairTop],
] as const;

export function nearWalkway(x: number, z: number, clearance: number) {
  return PLANT_FREE_RECTS.some(([x0, z0, x1, z1]) =>
    Math.hypot(Math.max(x0 - x, x - x1, 0), Math.max(z0 - z, z - z1, 0)) <= clearance);
}

export function onKoiBridge(x: number, z: number, half = BRIDGE.hw) {
  return Math.abs(x - BRIDGE.x) <= half && z >= BRIDGE.z0 && z <= BRIDGE.z1;
}

export const KOI_BRIDGE_WALK_HALF = BRIDGE.hw - 0.15;

export function onKoiBridgeRail(x: number, z: number) {
  return z > BRIDGE.z0 + 0.35 && z < BRIDGE.z1 - 0.35 && Math.abs(Math.abs(x - BRIDGE.x) - BRIDGE.hw) < 0.15;
}

export function bridgeY(x: number, z: number) {
  if (!onKoiBridge(x, z)) return 0;
  const mid = (BRIDGE.z0 + BRIDGE.z1) / 2;
  const u = (z - mid) / ((BRIDGE.z1 - BRIDGE.z0) / 2);
  return 0.12 + BRIDGE.peak * (1 - u * u);
}

/** Ground height under (x, z): hall platform, meditation decks, corridors and bridge are raised. */
export function groundYBase(x: number, z: number) {
  let y = expansionGroundY(x, z);
  if (Math.abs(x - DUOC_SU.x) <= DUOC_SU.hx && Math.abs(z - DUOC_SU.z) <= DUOC_SU.hz) y = Math.max(y, DUOC_SU.y);
  for (const h of TINH_THAT) if (Math.abs(x - h.x) <= 1.6 && Math.abs(z - h.z) <= 1.25) y = Math.max(y, 0.16);
  if (x >= -90 && x <= -66 && Math.abs(z - 2) <= 1.1) y = Math.max(y, 0.28);
  y = Math.max(y, riverBridgeY(x, z), riverDockY(x, z));
  const dx = Math.max(Math.abs(x - HALL.x) - HALL.hx, 0), dz = Math.max(Math.abs(z - HALL.z) - HALL.hz, 0);
  // Chính Điện: ba bậc nền hình chữ nhật khớp mesh hall.ts (nền 1.35, tầng 2 cao 0.9, tầng 1 cao 0.45).
  const hm = Math.max(dx, dz);
  if (hm <= 0) y = HALL.h;
  else if (hm <= 0.45) y = 0.9;
  else if (hm <= 0.8) y = 0.45;
  // Ba bậc thềm phía Nam (world z -22 đến -20.4), cao 0.45.
  if (Math.abs(x - HALL.x) <= 5.2 && z > HALL.z + HALL.hz && z <= -20.4) y = Math.max(y, 0.45);
  const ax = Math.abs(x);
  if (ax >= DECK.x0 && ax <= DECK.x1 && z >= DECK.z0 && z <= DECK.z1) y = Math.max(y, DECK.y);
  if (Math.abs(ax - CORR.x) <= CORR.half && z >= CORR.z0 && z <= CORR.z1) y = Math.max(y, CORR.y);
  if (x >= PIER.x0 && x <= PIER.x1 && Math.abs(z - PIER.z) <= PIER.hw) y = Math.max(y, PIER.y * Math.min(1, (x - PIER.x0) / PIER_RAMP));
  if (Math.abs(x - PIER_FLOOR.x) <= PIER_FLOOR.hx && Math.abs(z - PIER_FLOOR.z) <= PIER_FLOOR.hz) y = Math.max(y, PIER_FLOOR.y);
  // nền Bảo Tháp + bậc thềm phía Nam
  const bp = BAO_THAP_PLAT;
  // Vành đế Bảo Tháp: hai tầng bát giác (mặt phẳng hướng 0/45/90/135 độ). m là khoảng cách bát giác (apothem),
  // bR = m / cos(pi/8) là bán kính ngoại tiếp tương đương, khớp CylinderGeometry xoay pi/8.
  const bdx = x - bp.x, bdz = z - bp.z;
  const bm = Math.max(Math.abs(bdx), Math.abs(bdz), Math.abs(bdx + bdz) * Math.SQRT1_2, Math.abs(bdx - bdz) * Math.SQRT1_2);
  const bR = bm / Math.cos(Math.PI / 8);
  // Hop bu seal (sealArchitectureJoints noi base1 voi than tang 0) top 0.92,
  // nua canh 4.34 do bbox xoay phong dai (goc cylinder r 3.312 xoay pi/8).
  if (Math.abs(bdx) <= 4.34 && Math.abs(bdz) <= 4.34) y = Math.max(y, 0.92);
  if (bR <= 5.6) y = Math.max(y, bp.y);
  else if (bR <= 6.0) y = Math.max(y, bp.y - (bp.y / 2) * (bR - 5.6) / 0.4);
  else if (bR <= 6.5) y = Math.max(y, bp.y / 2);
  else if (bR <= 6.8) y = Math.max(y, (bp.y / 2) * (6.8 - bR) / 0.3);
  if (Math.abs(x - bp.x) <= bp.stepW) {
    const dz = z - bp.z;
    if (dz > bp.step1.z0 && dz <= bp.step1.z1) y = Math.max(y, bp.step1.y);
    else if (dz > bp.step2.z0 && dz <= bp.step2.z1) y = Math.max(y, bp.step2.y);
  }
  const tp = TAM_THE_PLAT;
  const tax = Math.abs(x - tp.x), taz = Math.abs(z - tp.z);
  const onAxis = tax <= tp.stairW && z > tp.stairTop;
  // Ba tầng ledge tính theo từng trục (3.0 / 2.04 / 1.02); ngoài tầng 1 là đất trống nên không có sườn dốc.
  if (!onAxis) {
    if (tax <= 18.4 && taz <= 10.4) y = Math.max(y, tp.y);
    else if (tax <= 19.2 && taz <= 11.2) y = Math.max(y, 2.04);
    else if (tax <= 20 && taz <= 12) y = Math.max(y, 1.02);
  }
  // Cầu thang 20 bậc, bước sâu thật 0.38 (= 7.6 / 20), mỗi bậc cao tp.y / 20.
  if (tax <= tp.stairW && z > tp.stairTop - 0.01 && z <= tp.zStart) {
    const k = Math.min(20, Math.floor((tp.zStart - z) / ((tp.zStart - tp.stairTop) / 20)) + 1);
    y = Math.max(y, tp.y * k / 20);
  }
  const ap = AM_CO_PLAT;
  const adx = Math.max(Math.abs(x - ap.x) - ap.hx, 0), adz = Math.max(Math.abs(z - ap.z) - ap.hz, 0);
  const ad = Math.hypot(adx, adz);
  if (ad < ap.ramp) y = Math.max(y, ap.y * (1 - ad / ap.ramp));
  if (x >= PS_PIER.x0 && x <= PS_PIER.x1 && Math.abs(z - PS_PIER.z) <= PS_PIER.hw) y = Math.max(y, PS_PIER.y * Math.min(1, (x - PS_PIER.x0) / PS_PIER.ramp));
  for (const np of [NHA_TO_PLAT, TANG_XA_PLAT, DIEN_MAU_PLAT, NHA_KHACH_PLAT, THIEN_DUONG_PLAT, TRAI_DUONG_PLAT, PHONG_CD_PLAT]) {
    const ndx = Math.max(Math.abs(x - np.x) - np.hx, 0), ndz = Math.max(Math.abs(z - np.z) - np.hz, 0);
    const nd = Math.hypot(ndx, ndz);
    if (nd < np.ramp) y = Math.max(y, np.y * (1 - nd / np.ramp));
  }
  const vp = VUON_THAP_PLAT;
  const vdx = Math.max(Math.abs(x - vp.x) - vp.hx, 0), vdz = Math.max(Math.abs(z - vp.z) - vp.hz, 0);
  const vd = Math.hypot(vdx, vdz);
  if (vd < vp.ramp) y = Math.max(y, vp.y * (1 - vd / vp.ramp));
  // Bệ tháp chuông và tháp trống: hai bậc vuông cứng (mesh tower() trong temple.ts, không vát).
  for (const tw of [BELL, DRUM]) {
    const tdx = Math.abs(x - tw.x), tdz = Math.abs(z - tw.z);
    if (tdx <= 2.45 && tdz <= 2.45) y = Math.max(y, 0.8);
    else if (tdx <= 2.8 && tdz <= 2.8) y = Math.max(y, 0.4);
  }
  // Sàn Đền Trình
  if (Math.abs(x - DEN_TRINH_FLOOR.x) <= DEN_TRINH_FLOOR.hx && Math.abs(z - DEN_TRINH_FLOOR.z) <= DEN_TRINH_FLOOR.hz) {
    y = Math.max(y, DEN_TRINH_FLOOR.y);
  }
  return Math.max(y, bridgeY(x, z));
}

/** Vườn cát thiền: viền khung ở 0.6, thấp hơn cát 0.08, dùng chung 0.68 cho cả footprint. Khi đặt chính vườn, dùng groundYBase. */
export function groundY(x: number, z: number) {
  const y = groundYBase(x, z);
  const dx = x - ZEN_GARDEN.x, dz = z - ZEN_GARDEN.z;
  const c = Math.cos(ZEN_GARDEN.ry), s = Math.sin(ZEN_GARDEN.ry);
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  if (Math.abs(lx) <= ZEN_GARDEN.hx && Math.abs(lz) <= ZEN_GARDEN.hz) return Math.max(y, ZEN_GARDEN.y);
  return y;
}

export function inLake(x: number, z: number, pad = 0) {
  const a = LAKE.a + pad, b = LAKE.b + pad;
  return ((x - LAKE.x) / a) ** 2 + ((z - LAKE.z) / b) ** 2 < 1;
}

export function onPsPier(x: number, z: number) {
  return x >= PS_PIER.x0 && x <= PS_PIER.x1 && Math.abs(z - PS_PIER.z) <= PS_PIER.hw;
}

export function inPsPond(x: number, z: number, pad = 0) {
  const a = PS_POND.a + pad, b = PS_POND.b + pad;
  return ((x - PS_POND.x) / a) ** 2 + ((z - PS_POND.z) / b) ** 2 < 1;
}

/** Areas where scenery (trees, flowers) must not spawn. */
export function blocked(x: number, z: number) {
  const ax = Math.abs(x);
  if (nearWalkway(x, z, 0.18)) return true;
  // Expansion scenery is authored per landmark; keep random scatter off its paths and water.
  if (ax > 60 || z < -80) return true;
  if (ax < 7 && z >= 25) return true;
  if (ax < 6 && z > -22) return true;
  if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.r + 3.5) return true;
  if (ax < HALL.hx + 5 && Math.abs(z - HALL.z) < HALL.hz + 5) return true;
  if (ax < 24.5 && z > -21 && z < 1.5) return true;
  if (inLake(x, z, 3.5) || (Math.abs(x - BRIDGE.x) < BRIDGE.hw + 1.7 && z > BRIDGE.z0 - 2 && z < BRIDGE.z1 + 2)) return true;
  if (Math.hypot(x - BELL.x, z - BELL.z) < 7 || Math.hypot(x - QUAN.x, z - QUAN.z) < 9) return true;
  if (Math.hypot(x - DRUM.x, z - DRUM.z) < 7) return true;
  if (Math.hypot(x - DEN_TRINH.x, z - DEN_TRINH.z) < 5.5) return true;
  if (Math.hypot(x - PAGODA.x, z - PAGODA.z) < 6) return true;
  if (Math.hypot(x - BUDDHA_YARD.x, z - BUDDHA_YARD.z) < 9) return true;
  if (Math.abs(z - PATH_Z) < 2.5) return true;
  if (Math.abs(x + SIDE_X) < 2.5 && z > -32 && z < PATH_Z + 2.5) return true;
  if (Math.abs(x - SIDE_X) < 2.5 && z > PATH_Z - 2.5 && z < QUAN.z + 2.5) return true;
  if (Math.hypot(x - ZEN.x, z - ZEN.z) < 10.5 || (x < ZEN.x + 11 && z < ZEN.z - 11) || (x < ZEN.x - 9 && z < ZEN.z + 11)) return true;
  for (const f of FLOWER_BEDS) if (((x - f.x) / (f.a + 1)) ** 2 + ((z - f.z) / (f.b + 1)) ** 2 < 1) return true;
  if (Math.hypot(x - REST.x, z - REST.z) < 9 || (x > 0 && x < 20 && Math.abs(z - REST.z) < 2.5)) return true;
  if (Math.abs(x - PAGODA.x) < 2.5 && z > PAGODA.z - 3 && z < PATH_Z + 2.5) return true;
  if (ax < 24 && z < HALL.z - HALL.hz - 2 && z > WALL.zN + 6) return true;
  if (Math.hypot(x - BAO_THAP.x, z - BAO_THAP.z) < 9) return true;
  if (Math.abs(x - TAM_THE.x) < TAM_THE_PLAT.hx + 4 && Math.abs(z - TAM_THE.z) < TAM_THE_PLAT.hz + 4) return true;
  if (Math.hypot(x - AM_CO.x, z - AM_CO.z) < 8) return true;
  if (Math.abs(x - NHA_TO.x) < 8 && Math.abs(z - NHA_TO.z) < 6.5) return true;
  if (Math.abs(x - TANG_XA.x) < 8 && Math.abs(z - TANG_XA.z) < 6.5) return true;
  if (Math.abs(x - DIEN_MAU.x) < 7 && Math.abs(z - DIEN_MAU.z) < 6) return true;
  if (Math.abs(x - NHA_KHACH.x) < 7.5 && Math.abs(z - NHA_KHACH.z) < 6) return true;
  if (Math.abs(x - THIEN_DUONG.x) < 7 && Math.abs(z - THIEN_DUONG.z) < 6) return true;
  if (Math.hypot(x - VUON_THAP.x, z - VUON_THAP.z) < 10) return true;
  for (const v of [VIEN_KT, VIEN_TO]) if (x > v.x0 - 1 && x < v.x1 + 1 && z > v.z0 - 1 && z < v.z1 + 1) return true;
  if (Math.abs(x + 50) < 8.5 && Math.abs(z - 34) < 6) return true;
  if (inPsPond(x, z, 1)) return true;
  if (x >= PS_PIER.x0 - 1 && x <= PS_PIER.x1 + 1 && Math.abs(z - PS_PIER.z) <= PS_PIER.hw + 1) return true;
  if (x > PS.x - PS.w / 2 - 1 && x < PS.x + PS.w / 2 + 1 && z > PS.z - PS.d / 2 - 1 && z < PS.z + PS.d / 2 + 1 && (Math.abs(x - PS.x) > PS.w / 2 - 0.3 || Math.abs(z - PS.z) > PS.d / 2 - 0.3)) return true;
  if (Math.abs(x) < 63 && z > 44 && z < 59.5) return true;
  if (z > -48 && z < -43 && ax < 57) return true;
  if ((Math.abs(x - 59) < 2.2 && z > -79 && z < 42) || (ax < 59 && z > 39.5 && z < 42.5)) return true;
  if (ax < 2.2 && z > -57 && z < -41) return true;
  for (const gx of [VIEN_KT.gateX, VIEN_TO.gateX]) if (Math.abs(x - gx) < 2.2 && z > -55 && z < -43) return true;
  if (x >= 19.8 && x <= 25.5 && z >= -32.5 && z <= -29.5) return true;
  if ((x >= 48.5 && x <= 50.5 && z >= -31.5 && z <= -23) || (x >= 32.5 && x <= 50.5 && z >= -25.1 && z <= -23.1)) return true;
  if (Math.abs(x - 21) < 2.2 && z > -32 && z < -18) return true;
  if (Math.abs(x + 59) < 2.2 && z > -79 && z < 42) return true;
  // A4: keep the new west-gate walk and the relocated pavilion clear of random scenery.
  if (onWestGateWalk(x, z)) return true;
  if (inEllipse(x, z, LOTUS, 2)) return true;
  if (Math.abs(x - BAO_THAP.x) < 2.2 && z > BAO_THAP.z + BAO_THAP_PLAT.step1.z0 - 1 && z < BAO_THAP.z + BAO_THAP_PLAT.step2.z1 + 1) return true;
  if (Math.abs(x - BAO_THAP.x) < 2.2 && z > BAO_THAP.z && z < -82) return true; // A3 tower lane
  if (x < -27 && x > -41 && Math.abs(z + 27) < 2.2) return true;
  if (x > 27 && x < 36 && Math.abs(z - DIEN_MAU.z) < 2.2) return true;
  if (x > PHONG_CD_DOOR.x - 5 && x < PHONG_CD.x - 3 && Math.abs(z - PHONG_CD.z) < 2.2) return true;
  return false;
}

/** Koi water not covered by either the arched deck or the Thuy Dinh pier. */
export function onAxisWaterGap(x: number, z: number) {
  if (onKoiBridgeRail(x, z)) return true;
  return inLake(x, z) && !onKoiBridge(x, z, KOI_BRIDGE_WALK_HALF) &&
    !(x >= PIER.x0 && x <= PIER.x1 && Math.abs(z - PIER.z) <= PIER.hw);
}

/** Keep walkers inside the compound walls (the south gate stays open). */
export function clampToCompound(p: { x: number; z: number }) {
  clampCampus(p);
}

/** Keep walkers inside the rails, except where the deck meets the two banks. */
export function resolveBridge(p: { x: number; z: number }, prev: { x: number; z: number }): boolean {
  if (p.z < BRIDGE.z0 || p.z > BRIDGE.z1) return false;
  if (p.z <= BRIDGE.z0 + 0.35 || p.z >= BRIDGE.z1 - 0.35) return onKoiBridge(p.x, p.z);
  const dx = p.x - BRIDGE.x;
  const wasOn = onKoiBridge(prev.x, prev.z) && Math.abs(dx) <= BRIDGE.hw + 1;
  const fromEnd = (prev.z < BRIDGE.z0 || prev.z > BRIDGE.z1) && Math.abs(dx) <= BRIDGE.hw;
  if (wasOn || fromEnd) {
    const limit = KOI_BRIDGE_WALK_HALF;
    p.x = BRIDGE.x + Math.max(-limit, Math.min(limit, dx));
    return true;
  }
  if (Math.abs(dx) <= BRIDGE.hw) p.x = BRIDGE.x + (prev.x >= BRIDGE.x ? 1 : -1) * (BRIDGE.hw + 0.15);
  return false;
}

/** Keep walkers out of the lake unless they're on a walkable deck. */
export function resolveWater(p: { x: number; z: number }, onDeck = true, prev?: { x: number; z: number }) {
  resolveExpansionWater(p, prev);
  if (inPsPond(p.x, p.z) && !(p.x >= PS_PIER.x0 - 0.2 && p.x <= PS_PIER.x1 + 0.2 && Math.abs(p.z - PS_PIER.z) <= PS_PIER.hw + 0.2)) {
    const ux = (p.x - PS_POND.x) / PS_POND.a, uz = (p.z - PS_POND.z) / PS_POND.b;
    const l = Math.hypot(ux, uz) || 1;
    const k = 1.02 / l;
    p.x = PS_POND.x + ux * k * PS_POND.a; p.z = PS_POND.z + uz * k * PS_POND.b;
    return;
  }
  if (!inLake(p.x, p.z)) return;
  if (p.x >= PIER.x0 - 0.2 && p.x <= PIER.x1 + 0.2 && Math.abs(p.z - PIER.z) <= PIER.hw + 0.2) return;
  if (onDeck && onKoiBridge(p.x, p.z)) return;
  if (prev && !inLake(prev.x, prev.z)) { p.x = prev.x; p.z = prev.z; return; }
  const ux = (p.x - LAKE.x) / LAKE.a, uz = (p.z - LAKE.z) / LAKE.b;
  const l = Math.hypot(ux, uz);
  if (l === 0) { p.z = LAKE.z + LAKE.b * 1.02; return; }
  const k = 1.02 / l;
  p.x = LAKE.x + ux * k * LAKE.a; p.z = LAKE.z + uz * k * LAKE.b;
}
