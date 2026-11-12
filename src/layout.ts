/** Shared layout constants + height/blocking queries for the temple compound. */
export const HALL = { x: 0, z: -32, hx: 17, hz: 10, h: 1.35, ramp: 1.1 };
export const DECK = { x0: 4.6, x1: 17.2, z0: -18.6, z1: -4, y: 0.2 };
export const CORR = { x: 20.5, z0: -19, z1: -1, half: 2.6, y: 0.12 };
/** Hồ cá koi nay nằm giữa khuôn viên, trên trục Bắc–Nam giữa sân chùa và tam quan. */
export const LAKE = { x: 0, z: 22, a: 9, b: 6.5 };
/** Cầu cong bắc qua hồ theo trục z (lối đi chính từ sân chùa ra cổng). */
export const BRIDGE = { x: 0, z0: 14.2, z1: 29.8, hw: 1.15, peak: 1.4 };
export const WALL = { x: 62, zN: -82, zS: 45, gate: 4.4 };
export const BELL = { x: -34, z: -6 };
export const DRUM = { x: 34, z: -6 };
export const DEN_TRINH = { x: 11, z: 39 };
/** Sân tượng Quan Âm (Đông), đối xứng BUDDHA_YARD (Tây). */
export const QUAN = { x: 28, z: 14 };
export const PIER = { x0: -10.6, x1: -4.4, z: 23, hw: 1.6, y: 0.55 };
export const PIER_RAMP = 1.3;
export const PIER_FLOOR = { x: -6.7, z: 23, hx: 2.2, hz: 1.7, y: 0.77 };
export const PATH_Z = 2;
export const SIDE_X = 28;
export const PAGODA = { x: 34, z: -15 };
export const TAM_THE = { x: 0, z: -54 };
export const BAO_THAP = { x: -17, z: -52 };
/**
 * Nền Điện Tam Thế: mặt nền đi được cao 3.0 (hx/hz theo trục thế giới), sườn dốc thoải 1.2 quanh nền;
 * thang lớn giữa trục (|x| <= stairW) dốc đều từ y 0 ở zStart lên y 3.0 ở mép Nam nền điện.
 */
export const TAM_THE_PLAT = {
  x: TAM_THE.x, z: TAM_THE.z,
  hx: 20, hz: 12, y: 3.0, ramp: 1.2,
  stairW: 4.2, zStart: -40.2,
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
  step2: { z0: 5.9, z1: 6.8, y: 0.3 },
};
export const NHA_TO = { x: 36, z: -68 };
export const NHA_TO_PLAT = { x: NHA_TO.x, z: NHA_TO.z, hx: 6.0, hz: 4.25, y: 0.3, ramp: 0.8 };
export const TANG_XA = { x: -41, z: -71 };
export const TANG_XA_PLAT = { x: TANG_XA.x, z: TANG_XA.z, hx: 7.5, hz: 4.0, y: 0.25, ramp: 0.8 };
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
export const VUON_THAP = { x: 49, z: -63 };
export const VUON_THAP_PLAT = { x: VUON_THAP.x, z: VUON_THAP.z, hx: 7.0, hz: 5.0, y: 0.2, ramp: 0.8 };
export const PHONG_CD = { x: -42, z: 35 };
export const PHONG_CD_PLAT = { x: PHONG_CD.x, z: PHONG_CD.z, hx: 6.5, hz: 4.5, y: 0.25, ramp: 0.8 };
/** Viện Khách Tăng (Tây) và Viện Tổ (Đông): hình chữ nhật có rào, cổng ở mặt Nam tại gateX. */
export const VIEN_KT = { x0: -58, x1: -22, z0: -80, z1: -54, gateX: -30 };
export const VIEN_TO = { x0: 24, x1: 58, z0: -80, z1: -54, gateX: 30 };
/** Vườn Phóng Sinh: ô đất, ao elip và bến thả cá ở bờ Tây của ao. */
export const PS = { x: 41, z: -31, w: 30, d: 22 };
export const PS_POND = { x: 41, z: -31, a: 7.5, b: 5.5 };
export const PS_PIER = { x0: 25.5, x1: 34, z: -31, hw: 1.5, y: 0.35, ramp: 1.3 };
export const BUDDHA_YARD = { x: -28, z: 14 };
/** Sân trước chùa (quảng trường nhỏ) — thu gọn để nhường chỗ cho hồ sen giữa khuôn viên. */
export const PLAZA = { x: 0, z: 6, r: 8.4 };
/** Vườn Thiền (góc Tây–Bắc), khu nghỉ bóng cây (Đông–Nam) và hai bồn hoa bên bờ hồ. */
export const ZEN = { x: -34, z: -26 };
export const REST = { x: 27, z: 31 };
export const FLOWER_BEDS = [{ x: 16.5, z: 23, a: 5, b: 3.5 }, { x: -16.5, z: 23, a: 5, b: 3.5 }];

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
  if (x >= PIER.x0 && x <= PIER.x1 && Math.abs(z - PIER.z) <= PIER.hw) y = Math.max(y, PIER.y * Math.min(1, (x - PIER.x0) / PIER_RAMP));
  if (Math.abs(x - PIER_FLOOR.x) <= PIER_FLOOR.hx && Math.abs(z - PIER_FLOOR.z) <= PIER_FLOOR.hz) y = Math.max(y, PIER_FLOOR.y);
  // nền Bảo Tháp + bậc thềm phía Nam
  const bp = BAO_THAP_PLAT;
  if (Math.hypot(x - bp.x, z - bp.z) < bp.r) y = Math.max(y, bp.y);
  if (Math.abs(x - bp.x) <= bp.stepW) {
    const dz = z - bp.z;
    if (dz > bp.step1.z0 && dz <= bp.step1.z1) y = Math.max(y, bp.step1.y);
    else if (dz > bp.step2.z0 && dz <= bp.step2.z1) y = Math.max(y, bp.step2.y);
  }
  const tp = TAM_THE_PLAT;
  const tdx = Math.max(Math.abs(x - tp.x) - tp.hx, 0), tdz = Math.max(Math.abs(z - tp.z) - tp.hz, 0);
  const td = Math.hypot(tdx, tdz);
  if (td < tp.ramp) {
    const onAxis = Math.abs(x - tp.x) <= tp.stairW && z > tp.z + tp.hz;
    if (!onAxis) y = Math.max(y, tp.y * (1 - td / tp.ramp));
  }
  if (Math.abs(x - tp.x) <= tp.stairW && z > tp.z + tp.hz - 0.01 && z < tp.zStart) {
    const u = (tp.zStart - z) / (tp.zStart - (tp.z + tp.hz));
    y = Math.max(y, tp.y * Math.max(0, Math.min(1, u)));
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
  return Math.max(y, bridgeY(x, z));
}

export function inLake(x: number, z: number, pad = 0) {
  const a = LAKE.a + pad, b = LAKE.b + pad;
  return ((x - LAKE.x) / a) ** 2 + ((z - LAKE.z) / b) ** 2 < 1;
}

export function inPsPond(x: number, z: number, pad = 0) {
  const a = PS_POND.a + pad, b = PS_POND.b + pad;
  return ((x - PS_POND.x) / a) ** 2 + ((z - PS_POND.z) / b) ** 2 < 1;
}

/** Areas where scenery (trees, flowers) must not spawn. */
export function blocked(x: number, z: number) {
  const ax = Math.abs(x);
  if (ax < 6 && z > -22) return true;
  if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.r + 3.5) return true;
  if (ax < HALL.hx + 5 && Math.abs(z - HALL.z) < HALL.hz + 5) return true;
  if (ax < 24.5 && z > -21 && z < 1.5) return true;
  if (inLake(x, z, 3.5) || (Math.abs(x - BRIDGE.x) < 4 && z > BRIDGE.z0 - 2 && z < BRIDGE.z1 + 2)) return true;
  if (Math.hypot(x - BELL.x, z - BELL.z) < 7 || Math.hypot(x - QUAN.x, z - QUAN.z) < 9) return true;
  if (Math.hypot(x - DRUM.x, z - DRUM.z) < 7) return true;
  if (Math.hypot(x - DEN_TRINH.x, z - DEN_TRINH.z) < 5.5) return true;
  if (Math.hypot(x - PAGODA.x, z - PAGODA.z) < 6) return true;
  if (Math.hypot(x - BUDDHA_YARD.x, z - BUDDHA_YARD.z) < 9) return true;
  if (Math.abs(z - PATH_Z) < 2.5 && ax < 40) return true;
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
  if (inPsPond(x, z, 1)) return true;
  if (x >= PS_PIER.x0 - 1 && x <= PS_PIER.x1 + 1 && Math.abs(z - PS_PIER.z) <= PS_PIER.hw + 1) return true;
  if (x > PS.x - PS.w / 2 - 1 && x < PS.x + PS.w / 2 + 1 && z > PS.z - PS.d / 2 - 1 && z < PS.z + PS.d / 2 + 1 && (Math.abs(x - PS.x) > PS.w / 2 - 0.3 || Math.abs(z - PS.z) > PS.d / 2 - 0.3)) return true;
  if (Math.abs(x) < 63 && z > 44 && z < 59.5) return true;
  if (z > -48 && z < -43 && ax < 57) return true;
  if ((Math.abs(x - 59) < 2.2 && z > -79 && z < 42) || (ax < 59 && z > 39.5 && z < 42.5)) return true;
  if (ax < 2.2 && z > -51 && z < -41) return true;
  for (const gx of [VIEN_KT.gateX, VIEN_TO.gateX]) if (Math.abs(x - gx) < 2.2 && z > -55 && z < -43) return true;
  if (x >= 19.8 && x <= 25.5 && z >= -32.5 && z <= -29.5) return true;
  if ((x >= 48.5 && x <= 50.5 && z >= -31.5 && z <= -23) || (x >= 32.5 && x <= 50.5 && z >= -25.1 && z <= -23.1)) return true;
  if (Math.abs(x - 21) < 2.2 && z > -32 && z < -18) return true;
  if (Math.abs(x + 59) < 2.2 && z > -79 && z < 42) return true;
  if (Math.abs(x - BAO_THAP.x) < 2.2 && z > -48 && z < -44) return true;
  if (x < -27 && x > -41 && Math.abs(z + 27) < 2.2) return true;
  if (x > 27 && x < 36 && Math.abs(z - DIEN_MAU.z) < 2.2) return true;
  if (Math.abs(x - PHONG_CD.x) < 2.2 && z > 38.5 && z < 43) return true;
  return false;
}

/** Keep walkers inside the compound walls (the south gate stays open). */
export function clampToCompound(p: { x: number; z: number }) {
  p.x = Math.max(-WALL.x + 0.8, Math.min(WALL.x - 0.8, p.x));
  p.z = Math.max(WALL.zN + 0.8, Math.min(WALL.zS + 13, p.z));
  if (Math.abs(p.x) > WALL.gate && p.z > WALL.zS - 0.8 && p.z < WALL.zS + 0.8) p.z = p.z < WALL.zS ? WALL.zS - 0.8 : WALL.zS + 0.8;
}

/** Thành cầu: giữ người đi trên mặt cầu, chặn bước ngang qua thành. Trả về true nếu đang trên mặt cầu. */
export function resolveBridge(p: { x: number; z: number }, prev: { x: number; z: number }): boolean {
  const inZ = (z: number) => z >= BRIDGE.z0 && z <= BRIDGE.z1;
  if (!inZ(p.z)) return false;
  const dx = p.x - BRIDGE.x;
  const lim = BRIDGE.hw - 0.15;
  const wasOn = inZ(prev.z) && Math.abs(prev.x - BRIDGE.x) <= BRIDGE.hw + 0.15;
  const enteringFromEnd = !inZ(prev.z) && Math.abs(dx) <= BRIDGE.hw + 0.15;
  if (wasOn || enteringFromEnd) {
    p.x = BRIDGE.x + Math.max(-lim, Math.min(lim, dx));
    return true;
  }
  if (Math.abs(dx) < BRIDGE.hw + 0.15) p.x = BRIDGE.x + (prev.x >= BRIDGE.x ? 1 : -1) * (BRIDGE.hw + 0.15);
  return false;
}

/** Keep walkers out of the lake except on the bridge deck. */
export function resolveWater(p: { x: number; z: number }, onDeck = true) {
  if (inPsPond(p.x, p.z) && !(p.x >= PS_PIER.x0 - 0.2 && p.x <= PS_PIER.x1 + 0.2 && Math.abs(p.z - PS_PIER.z) <= PS_PIER.hw + 0.2)) {
    const ux = (p.x - PS_POND.x) / PS_POND.a, uz = (p.z - PS_POND.z) / PS_POND.b;
    const l = Math.hypot(ux, uz) || 1;
    const k = 1.02 / l;
    p.x = PS_POND.x + ux * k * PS_POND.a; p.z = PS_POND.z + uz * k * PS_POND.b;
    return;
  }
  if (!inLake(p.x, p.z)) return;
  if (p.x >= PIER.x0 - 0.2 && p.x <= PIER.x1 + 0.2 && Math.abs(p.z - PIER.z) <= PIER.hw + 0.2) return;
  if (onDeck && Math.abs(p.x - BRIDGE.x) < BRIDGE.hw + 0.6) {
    p.x = Math.max(BRIDGE.x - BRIDGE.hw + 0.1, Math.min(BRIDGE.x + BRIDGE.hw - 0.1, p.x));
    return;
  }
  const ux = (p.x - LAKE.x) / LAKE.a, uz = (p.z - LAKE.z) / LAKE.b;
  const l = Math.hypot(ux, uz) || 1;
  const k = 1.02 / l;
  p.x = LAKE.x + ux * k * LAKE.a; p.z = LAKE.z + uz * k * LAKE.b;
}
