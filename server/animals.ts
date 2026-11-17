import type { AnimalState, AnimalAnim } from '../shared/types';
import { routeFrom, nearestNode, ROAD_NODES, HOUSE_DOORS } from '../shared/roads';
import {
  HALL, TAM_THE_PLAT, DIEN_MAU_PLAT, THIEN_DUONG_PLAT, TRAI_DUONG_PLAT,
  NHA_TO_PLAT, TANG_XA_PLAT, NHA_KHACH_PLAT, AM_CO_PLAT, VUON_THAP_PLAT,
  PHONG_CD_PLAT, BAO_THAP, DECK, LAKE, inLake, BRIDGE,
} from '../src/layout.js';

type P = { x: number; z: number };
type Mode = 'orbit' | 'toPerch' | 'perch' | 'rise';
interface A {
  s: AnimalState; speed: number; cat: boolean; home?: P; feedTo?: P; feedEat?: number;
  path: P[]; wait: number; eatT: number;
  owl?: { R: number; H: number; ang: number; mode: Mode; target: P; perch: number };
}

const SAFE = ['plaza', 'bridgeN', 'bridgeS', 'axisMid', 'hallFront', 'westMid', 'eastMid', 'rearW', 'rearE',
  'rearKT', 'rearTO', 'westNorth', 'eastNorth', 'zenW', 'thienDuong', 'hallWestWp', 'hallEastWp'];
// Cat-only wander pool: the 3 southern nodes (plaza/bridgeN/bridgeS, z>0) appear 5x each,
// so the cat picks a southern destination ~52% of the time (was 3/17 ~ 18%) and spends
// much more time in the yard/pond area where players actually play. Dogs keep SAFE.
const CAT_SPOTS = [...SAFE, 'plaza', 'bridgeN', 'bridgeS', 'plaza', 'bridgeN', 'bridgeS', 'plaza', 'bridgeN', 'bridgeS', 'plaza', 'bridgeN', 'bridgeS'];
// Lost spots must be OUTDOORS and walkable (keep-out rule: not inside any INDOOR_RECT,
// DECK or zafu ring). Old (-47,-27) = Thien Duong centre and (39,10) = Dien Mau centre
// were indoors, so they are replaced by outdoor points right in front of each door.
const LOST_SPOTS: P[] = [
  { x: -30, z: -33 }, // cách tâm Bảo Tháp 5 m (> r+0.4=3.3, người chơi tới trong 2.5 m được), cách node baoThap 5 m
  { x: -37, z: -23.5 }, // outside Thien Duong, south-east of the door (-40.5,-27)
  { x: 30, z: -31 },    // release bridge (kept)
  { x: 39, z: 16 }, // sân Điện Mẫu, ngoài biên indoors (|z-10|=6 >= 4.2), cách node dienMau 1.5 m, cách bồ đoàn 6 m
  { x: -46, z: -46 },   // back yard (kept)
];
// Old first spot (-47,-27) = Thien Duong centre (indoors), moved outside; door is at (-40.5,-27).
const PERCH_SPOTS: P[] = [{ x: -37, z: -23.5 }, { x: 30, z: -31 }];
const PLAZA: P = { x: 0, z: 6 };
const OWL_SPEED = 5;
const OWL_VY = 3;

const rooms = new Map<string, A[]>();
let lostToggle = 0;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(l: T[]): T => l[Math.floor(Math.random() * l.length)];
const jitter = (p: P, r: number): P => ({ x: p.x + rnd(-r, r), z: p.z + rnd(-r, r) });
const nodePt = (id: string): P => { const n = ROAD_NODES.find((n) => n.id === id)!; return { x: n.x, z: n.z }; };
const route = (from: P, toId: string): P[] =>
  sanitizePath(from, [...routeFrom(from, toId), walkerJitter(nodePt(toId), 1.5)]);
const INDOOR_RECTS = [
  HALL, TAM_THE_PLAT, DIEN_MAU_PLAT, THIEN_DUONG_PLAT, TRAI_DUONG_PLAT,
  NHA_TO_PLAT, TANG_XA_PLAT, NHA_KHACH_PLAT, AM_CO_PLAT, VUON_THAP_PLAT,
  PHONG_CD_PLAT,
];

export function isIndoors(x: number, z: number): boolean {
  for (const p of INDOOR_RECTS) if (inRect(x, z, p, 1)) return true;
  return false;
}

// ---- Keep-out for dogs/cats (walkers) ----
// Rule: no destination and no path segment may lie inside
//   (a) an INDOOR_RECT (house rectangle), except by passing through its door,
//   (b) a raised meditation DECK (no door: walkers go around the nearest corner),
//   (c) a zafu ring (radius ZAFU_R = 0.38 + 0.4 = 0.78).
// The Bao Thap circle is NOT keep-out (it is an outdoor courtyard).
const ZAFU_R = 0.38 + 0.4;

// Rect -> door (only the 7 rects that have a door in HOUSE_DOORS).
const door = (id: string): P => { const d = HOUSE_DOORS.find((d) => d.id === id)!; return { x: d.x, z: d.z }; };
const RECT_DOOR = new Map<object, P>([
  [TRAI_DUONG_PLAT, door('traiDuong')],
  [NHA_KHACH_PLAT, door('nhaKhach')],
  [AM_CO_PLAT, door('amCo')],
  [TANG_XA_PLAT, door('tangXa')],
  [THIEN_DUONG_PLAT, door('thienDuong')],
  [PHONG_CD_PLAT, door('phongCongDuc')],
  [NHA_TO_PLAT, door('nhaTo')],
]);

// Two raised meditation decks at x = +-(4.6..17.2), z = -18.6..-4 (no door).
const DECK_RECTS = [1, -1].map((side) => {
  const x0 = Math.min(side * DECK.x0, side * DECK.x1), x1 = Math.max(side * DECK.x0, side * DECK.x1);
  return { x: (x0 + x1) / 2, z: (DECK.z0 + DECK.z1) / 2, hx: (x1 - x0) / 2, hz: (DECK.z1 - DECK.z0) / 2 };
});

// All 212 zafu: Chinh Dien 96 + decks 98 + Thien Duong 12 + Dien Mau 2 + Am Co 1 + Thuy Dinh 3.
const ZAFU_RINGS: P[] = (() => {
  const out: P[] = [];
  // Chinh Dien (src/hall.ts): 6 rows x 8 cols x 2 sides = 96
  for (const s of [-1, 1]) for (const z of [-3.2, -1.4, 0.4, 2.2, 4.0, 5.8])
    for (const x of [3.4, 4.9, 6.4, 7.9, 9.4, 10.9, 12.4, 13.9]) out.push({ x: HALL.x + s * x, z: HALL.z + z });
  // Outdoor decks (src/temple.ts): 7 x 7 x 2 sides = 98
  for (const s of [-1, 1]) for (const z of [-17.6, -15.7, -13.8, -11.9, -10.0, -8.1, -6.2])
    for (const x of [5.7, 7.4, 9.1, 10.8, 12.5, 14.2, 15.9]) out.push({ x: s * x, z });
  // Thien Duong: twd(lx,lz) = { x: THIEN_DUONG.x + lz, z: THIEN_DUONG.z - lx } -> 10 + 2 = 12
  const TD = { x: THIEN_DUONG_PLAT.x, z: THIEN_DUONG_PLAT.z };
  const tdLocal: [number, number][] = [];
  for (const lx of [-1.2, 1.2]) for (const lz of [-3.4, -1.9, -0.4, 1.1, 2.6]) tdLocal.push([lx, lz]);
  tdLocal.push([0, 2], [0, 4]);
  for (const [lx, lz] of tdLocal) out.push({ x: TD.x + lz, z: TD.z - lx });
  // Dien Mau: 2 (world coords)
  out.push({ x: 37, z: 10 }, { x: 39, z: 10 });
  // Am Co: 1 (local (-1.2, 0.3) in group at AM_CO)
  out.push({ x: 52.7, z: -76.2 }); // Am Co: 1 (local (-1.2, 0.3), group rotated -90 deg)
  // Thuy Dinh: 3 (PIER_FLOOR x=-6.7 z=23)
  out.push({ x: -5.3, z: 23 }, { x: -6.7, z: 22.2 }, { x: -6.7, z: 23.8 });
  return out;
})();

type Rect = { x: number; z: number; hx: number; hz: number };
const inRect = (x: number, z: number, r: Rect, m: number) => Math.abs(x - r.x) < r.hx + m && Math.abs(z - r.z) < r.hz + m;

/** Segment a->b intersects the open rectangle r (exact edge, no margin)? Slab method. */
function segHitsRect(a: P, b: P, r: Rect): boolean {
  let t0 = 0, t1 = 1;
  const d = [b.x - a.x, b.z - a.z], o = [a.x - r.x, a.z - r.z], h = [r.hx, r.hz];
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (Math.abs(o[i]) >= h[i]) return false; continue; }
    let ta = (-h[i] - o[i]) / d[i], tb = (h[i] - o[i]) / d[i];
    if (ta > tb) { const t = ta; ta = tb; tb = t; }
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 >= t1 - 1e-9) return false;
  }
  return true;
}

/** Distance from point c to segment a->b, plus the closest parameter t in [0,1]. */
function segPointDist(a: P, b: P, c: P): { d: number; t: number } {
  const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz;
  const t = L < 1e-12 ? 0 : Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.z - a.z) * dz) / L));
  return { d: Math.hypot(a.x + dx * t - c.x, a.z + dz * t - c.z), t };
}

/** True if (x,z) is a forbidden walker DESTINATION: house (indoors() margin), deck, or zafu ring. */
function keepOut(x: number, z: number): boolean {
  for (const p of INDOOR_RECTS) if (inRect(x, z, p, 1)) return true;
  for (const r of DECK_RECTS) if (inRect(x, z, r, 0)) return true;
  for (const c of ZAFU_RINGS) if (Math.hypot(x - c.x, z - c.z) < ZAFU_R) return true;
  return false;
}

/** Walkable destination near p: re-roll jitter (max 10), fallback road node, then PLAZA. */
function inLakeOffBridge(x: number, z: number): boolean {
  const onBridge = Math.abs(x - BRIDGE.x) < BRIDGE.hw && z >= BRIDGE.z0 && z <= BRIDGE.z1;
  return inLake(x, z) && !onBridge;
}

function segClipsLake(a: P, b: P): boolean {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(len / 0.25));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    // pad 0.3: trigger the detour before the leg actually touches the water;
    // points on the bridge strip are allowed.
    const onBridge = Math.abs(x - BRIDGE.x) < BRIDGE.hw && z >= BRIDGE.z0 && z <= BRIDGE.z1;
    if (!onBridge && inLake(x, z, 0.3)) return true;
  }
  return false;
}

function lakeDetour(cur: P, tgt: P): P[] {
  const north = (p: P) => p.z < LAKE.z;
  const onBridgePt = (p: P) => Math.abs(p.x - BRIDGE.x) < BRIDGE.hw && p.z >= BRIDGE.z0 && p.z <= BRIDGE.z1;
  // Beside the lake (mid-latitude, off the bridge): retreat straight north/south
  // at fixed x to the bridge-end latitude — moving away from the lake centre at
  // fixed x never enters the ellipse.
  const beside = cur.z > LAKE.z - LAKE.b && cur.z < LAKE.z + LAKE.b && !onBridgePt(cur);
  if (beside) {
    const retreat: P = { x: cur.x, z: north(cur) ? BRIDGE.z0 : BRIDGE.z1 };
    return [retreat, ...lakeDetour(retreat, tgt)];
  }
  // Either endpoint near the bridge axis: cross on the bridge.
  if (Math.abs(cur.x - BRIDGE.x) < 2 || Math.abs(tgt.x - BRIDGE.x) < 2) {
    const enter: P = { x: BRIDGE.x, z: north(cur) ? BRIDGE.z0 : BRIDGE.z1 };
    if (north(cur) === north(tgt)) return [enter];
    const exit: P = { x: BRIDGE.x, z: north(tgt) ? BRIDGE.z0 : BRIDGE.z1 };
    return [enter, exit];
  }
  // Off-axis on both ends: around the tip on tgt's side, at both latitudes.
  const sideX = tgt.x < BRIDGE.x ? -(LAKE.a + 0.5) : LAKE.a + 0.5;
  const corner: P = { x: sideX, z: north(cur) ? BRIDGE.z0 : BRIDGE.z1 };
  if (north(cur) === north(tgt)) return [corner];
  return [corner, { x: sideX, z: north(tgt) ? BRIDGE.z0 : BRIDGE.z1 }];
}

function walkerJitter(p: P, r: number): P {
  for (let i = 0; i < 10; i++) {
    const q = jitter(p, r);
    if (!keepOut(q.x, q.z) && !inLakeOffBridge(q.x, q.z)) return q;
  }
  const n = nodePt(nearestNode(p));
  return keepOut(n.x, n.z) || inLakeOffBridge(n.x, n.z) ? { x: PLAZA.x, z: PLAZA.z } : n;
}

/** Corner of rect r (expanded by eps) nearest to point p, going around the rect. */
function nearestCorner(r: Rect, p: P, eps = 0.3): P {
  let best: P = { x: r.x + r.hx + eps, z: r.z + r.hz + eps }, bd = Infinity;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const c = { x: r.x + sx * (r.hx + eps), z: r.z + sz * (r.hz + eps) };
    const d = Math.hypot(c.x - p.x, c.z - p.z);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

/** True if the leg a->b is clear of rect r and of every zafu ring. */
function legClear(a: P, b: P, r: Rect): boolean {
  if (segHitsRect(a, b, r)) return false;
  for (const c of ZAFU_RINGS) {
    if (segPointDist(a, b, c).d < ZAFU_R) return false;
  }
  return true;
}

/**
 * Clearance-verified detour around rect r from cur to tgt.
 * Candidates: 4 expanded corners (single via) + 8 ordered pairs of adjacent
 * corners (walk along an edge). Returns the shortest fully clear candidate.
 * Fallback (no clear candidate): shortest single corner that differs from cur.
 * Never returns an empty array, so cur always advances.
 */
function detourAround(r: Rect, cur: P, tgt: P, eps = 0.3): P[] {
  // Corners in ring order so index +-1 (mod 4) = adjacent corner.
  const ring: P[] = [
    { x: r.x - (r.hx + eps), z: r.z - (r.hz + eps) },
    { x: r.x + (r.hx + eps), z: r.z - (r.hz + eps) },
    { x: r.x + (r.hx + eps), z: r.z + (r.hz + eps) },
    { x: r.x - (r.hx + eps), z: r.z + (r.hz + eps) },
  ];
  const cands: P[][] = [];
  for (let i = 0; i < 4; i++) {
    cands.push([ring[i]]);
    cands.push([ring[i], ring[(i + 1) % 4]]);
    cands.push([ring[i], ring[(i + 3) % 4]]);
  }
  const len = (w: P[]): number => {
    let d = 0, p = cur;
    for (const q of w) { d += Math.hypot(q.x - p.x, q.z - p.z); p = q; }
    return d + Math.hypot(tgt.x - p.x, tgt.z - p.z);
  };
  const moves = (w: P[]): boolean =>
    Math.hypot(w[0].x - cur.x, w[0].z - cur.z) > 1e-6;
  const scored = cands.map((w) => ({ w, l: len(w) })).sort((a, b) => a.l - b.l);
  for (const { w } of scored) {
    if (!moves(w)) continue;
    let p = cur, ok = true;
    for (const q of w) {
      if (!legClear(p, q, r)) { ok = false; break; }
      p = q;
    }
    if (ok && legClear(p, tgt, r)) return w;
  }
  // Fallback: shortest single corner that actually moves cur.
  for (const { w } of scored) if (w.length === 1 && moves(w)) return w;
  return [ring[0]];
}

/** Điểm via quanh vòng c, vuông góc đoạn đi (ux,uz là vector đơn vị).
 *  Thử phía sgn, rồi phía đối diện, rồi đẩy xa dần. Luôn trả điểm !keepOut. */
function freeVia(c: P, ux: number, uz: number, sgn: number): P {
  let best: P | null = null;
  for (let k = 0; k < 12; k++) {
    const r = ZAFU_R + 0.05 + k * 0.35;
    for (const sg of [sgn, -sgn]) {
      const p = { x: c.x + sg * ux * r, z: c.z + sg * uz * r };
      if (!keepOut(p.x, p.z)) return p;
      best = p;
    }
  }
  return best!; // không xảy ra với lưới thực tế; vòng guard bên ngoài vẫn kiểm tra đoạn
}

/**
 * Re-routes a walker path so no segment crosses keep-out:
 *  - walker currently inside a house rect -> leave via that rect's door (or nearest corner if it has none);
 *  - segment crossing a house rect -> go via that rect's door (or around the nearest corner if no door);
 *  - segment crossing a deck -> detour via nearest deck corner (no door);
 *  - segment passing within ZAFU_R of a zafu centre -> insert a point on the ring.
 * Bounded loops, so it always terminates; leftovers fall back to PLAZA.
 */
function sanitizePath(from: P, path: P[]): P[] {
  const out: P[] = [];
  let cur: P = { x: from.x, z: from.z };

  // Leave the house first if the animal is already inside one (old state).
  for (const r of INDOOR_RECTS) {
    if (!inRect(cur.x, cur.z, r, 0)) continue;
    const dr = RECT_DOOR.get(r);
    const exit = dr ?? nearestCorner(r, cur);
    out.push(exit); cur = exit;
    break;
  }

  for (const target of path) {
    let guard = 0;
    let tgt: P = target;
    if (keepOut(tgt.x, tgt.z)) tgt = walkerJitter(nodePt(nearestNode(tgt)), 1.5);
    while (guard++ < 20) {
      // 1) houses (exact edge)
      const house = INDOOR_RECTS.find((r) => segHitsRect(cur, tgt, r));
      if (house) {
        const dr = RECT_DOOR.get(house);
        // Door only if both legs are clear of the rect and rings.
        const doorOk = !!dr
          && Math.hypot(dr.x - cur.x, dr.z - cur.z) > 1e-6
          && legClear(cur, dr, house) && legClear(dr, tgt, house);
        const vias = doorOk ? [dr as P] : detourAround(house, cur, tgt);
        for (const v of vias) out.push(v);
        cur = vias[vias.length - 1];
        continue;
      }
      // 2) decks (no door: verified detour around the rect)
      const deck = DECK_RECTS.find((r) => segHitsRect(cur, tgt, r));
      if (deck) {
        const vias = detourAround(deck, cur, tgt);
        for (const v of vias) out.push(v);
        cur = vias[vias.length - 1];
        continue;
      }
      // 3) zafu rings: first ring along the segment that it clips
      let hit: { c: P; t: number; d: number } | null = null;
      for (const c of ZAFU_RINGS) {
        const { d, t } = segPointDist(cur, tgt, c);
        if (d < ZAFU_R && (!hit || t < hit.t)) hit = { c, t, d };
      }
      if (hit) {
        // ring point beside the zafu, perpendicular to the segment direction
        const dx = tgt.x - cur.x, dz = tgt.z - cur.z, L = Math.hypot(dx, dz) || 1;
        const nx = -dz / L, nz = dx / L;
        const sgn = ((cur.x - hit.c.x) * nx + (cur.z - hit.c.z) * nz) >= 0 ? 1 : -1;
        const via = freeVia(hit.c, nx, nz, sgn);
        out.push(via); cur = via; continue;
      }
      // 4) lake: cross only on the bridge, or around a tip — never through the water.
      if (segClipsLake(cur, tgt)) {
        const vias = lakeDetour(cur, tgt);
        for (const v of vias) out.push(v);
        cur = vias[vias.length - 1];
        continue;
      }
      break;
    }
    out.push(tgt); cur = tgt;
  }
  return out;
}

/** True inside any roofed interior (1 m margin) or the tower platform circle. */
function indoors(x: number, z: number): boolean {
  for (const p of INDOOR_RECTS) {
    if (Math.abs(x - p.x) < p.hx + 1 && Math.abs(z - p.z) < p.hz + 1) return true;
  }
  return Math.hypot(x - BAO_THAP.x, z - BAO_THAP.z) < 6;
}

/** Same jitter as `jitter`, but re-rolls (max 10 tries) while the result is indoors. */
function outdoorJitter(p: P, r: number): P {
  for (let i = 0; i < 10; i++) {
    const q = jitter(p, r);
    if (indoors(q.x, q.z)) continue;
    if (keepOut(q.x, q.z)) continue;
    if (inLakeOffBridge(q.x, q.z)) continue;
    return q;
  }
  return { x: 0, z: 6 };
}

const FLOCK_SPOTS = ['plaza', 'bridgeN', 'bridgeS', 'axisMid'];
let flockAnchor: P | null = null;
let flockMoveAt = 0;

function pickFlockAnchor(): P {
  const pt = nodePt(pick(FLOCK_SPOTS));
  return outdoorJitter(pt, 2.5);
}
const routeToPoint = (from: P, pt: P): P[] => [...routeFrom(from, nearestNode(pt)), pt];
const set = (a: A, anim: string) => { a.s.anim = anim as AnimalAnim; };

function mk(id: string, kind: string, name: string, x: number, z: number, speed: number, home?: P): A {
  const s = { id, kind, name, x, y: 0, z, ry: 0, anim: 'idle', lost: false } as unknown as AnimalState;
  return { s, speed, cat: kind === 'cat', home, path: [], wait: rnd(1, 5), eatT: 0 };
}

function mkOwl(id: string, R: number, H: number, ang: number): A {
  const a = mk(id, 'owl', 'Cú', R * Math.cos(ang), R * Math.sin(ang), OWL_SPEED);
  a.s.y = H; set(a, 'fly');
  a.owl = { R, H, ang, mode: 'orbit', target: { x: 0, z: 0 }, perch: 0 };
  return a;
}

export function createAnimals(room: string): A[] {
  const list = [
    mk('vang', 'dog', 'Vàng', 0, 6, 1.2), mk('trang', 'dog', 'Trắng', 8, 10, 1.2), mk('lab', 'dog', 'Labrador', -8, 10, 1.2), mk('nau', 'dog', 'Nâu', -12, 6, 1.2), mk('muop', 'cat', 'Mướp', -4, 4, 1.0), mk('bong', 'cat', 'Bông', 4, 8, 1.0), mk('mun', 'cat', 'Mun', 12, 2, 1.0),
    mkOwl('owl1', 30, 18, 0), mkOwl('owl2', 40, 22, 2.1), mkOwl('owl3', 50, 26, 4.2),
    mk('parrot', 'parrot', 'Vẹt', -47, -27, 1.2, { x: -47, z: -27 }),
    mk('chick', 'chick', 'Gà con', 30, -31, 1.2, { x: 30, z: -31 }),
    mk('parrot2', 'parrot', 'Vẹt', -47, -27, 1.2, { x: -47, z: -27 }),
    mk('parrot3', 'parrot', 'Vẹt', -47, -27, 1.2, { x: -47, z: -27 }),
    mk('chick2', 'chick', 'Gà con', 30, -31, 1.2, { x: 30, z: -31 }),
    mk('chick3', 'chick', 'Gà con', 30, -31, 1.2, { x: 30, z: -31 }),
  ];
  rooms.set(room, list);
  flockAnchor = pickFlockAnchor();
  for (const a of list) {
    if (a.s.kind === 'parrot' || a.s.kind === 'chick') {
      a.home = outdoorJitter(flockAnchor, 2.5);
      a.s.x = a.home.x; a.s.z = a.home.z;
    }
  }
  return list;
}
const get = (room: string) => rooms.get(room) ?? createAnimals(room);

function step(a: A, tx: number, tz: number, mv: number): number {
  const dx = tx - a.s.x, dz = tz - a.s.z, d = Math.hypot(dx, dz);
  if (d > 1e-6) a.s.ry = Math.atan2(dx, dz);
  if (d <= mv) { a.s.x = tx; a.s.z = tz; } else { a.s.x += (dx / d) * mv; a.s.z += (dz / d) * mv; }
  return d;
}

function tickOwl(a: A, dt: number) {
  const o = a.owl!, s = a.s, mv = OWL_SPEED * dt;
  const orbitPt = (): P => ({ x: o.R * Math.cos(o.ang), z: o.R * Math.sin(o.ang) });
  if (o.mode === 'orbit') {
    o.ang += (OWL_SPEED / o.R) * dt;
    const p = orbitPt();
    s.ry = Math.atan2(p.x - s.x, p.z - s.z);
    s.x = p.x; s.z = p.z; s.y = o.H; set(a, 'fly');
    if (Math.random() < dt / 60) { o.target = jitter(pick(PERCH_SPOTS), 2); o.mode = 'toPerch'; }
  } else if (o.mode === 'toPerch') {
    const d = step(a, o.target.x, o.target.z, mv);
    const goalY = o.H * Math.min(1, d / 10), maxDy = OWL_VY * dt;
    s.y += Math.max(-maxDy, Math.min(maxDy, goalY - s.y));
    if (d < Math.max(0.5, mv)) {
      s.x = o.target.x; s.z = o.target.z;
      if (s.y < 0.5) {
        s.y = 0; set(a, 'idle');
        o.perch = rnd(8, 16); o.mode = 'perch';
      }
    }
  } else if (o.mode === 'perch') {
    o.perch -= dt;
    if (o.perch <= 0) { o.ang = Math.atan2(s.z, s.x); o.mode = 'rise'; set(a, 'fly'); }
  } else {
    s.y = Math.min(o.H, s.y + 3 * dt);
    const p = orbitPt();
    step(a, p.x, p.z, mv);
    if (Math.hypot(p.x - s.x, p.z - s.z) < 0.01 && s.y >= o.H) o.mode = 'orbit';
  }
}

function tickWalker(a: A, dt: number) {
  const s = a.s;
  if (a.feedTo) {
    set(a, 'walk');
    if (!a.path || a.path.length === 0) {
      a.path = sanitizePath(a.s, [{ x: a.feedTo.x, z: a.feedTo.z }]);
    }
    const target = a.path[0];
    if (!target) {
      a.feedTo = undefined;
      a.eatT = a.feedEat ?? 8;
      return;
    }
    const d = step(a, target.x, target.z, a.speed * dt);
    const arrive = Math.max(0.3, a.speed * dt);
    if (d < arrive) {
      a.path.shift();
      if (a.path.length === 0) {
        a.feedTo = undefined;
        a.eatT = a.feedEat ?? 8;
      }
    }
    return;
  }
  if (a.eatT > 0) { a.eatT -= dt; set(a, 'eat'); return; }
  if (a.path.length) {
    step(a, a.path[0].x, a.path[0].z, a.speed * dt);
    if (Math.hypot(a.path[0].x - s.x, a.path[0].z - s.z) < 1e-6) a.path.shift();
    set(a, a.path.length ? 'walk' : 'idle');
    return;
  }
  if (s.lost) { set(a, 'idle'); return; }
  a.wait -= dt;
  if (a.wait > 0) return;
  if (a.cat && Math.random() < 0.4) { set(a, Math.random() < 0.5 ? 'sit' : 'sleep'); a.wait = rnd(10, 30); return; }
  // Keep-out: destination via walkerJitter, then sanitizePath (doors/corners/zafu rings).
  a.path = a.home
    ? sanitizePath(a.s, [outdoorJitter(a.home, 3)])
    : route(s, pick(a.cat ? CAT_SPOTS : SAFE));
  a.wait = rnd(3, 8);
}

export function tickAnimals(room: string, dt: number) {
  if (Date.now() > flockMoveAt) {
    flockAnchor = pickFlockAnchor();
    for (const a of get(room)) {
      if (a.s.kind === 'parrot' || a.s.kind === 'chick') a.home = outdoorJitter(flockAnchor, 2.5);
    }
    flockMoveAt = Date.now() + 120_000 + Math.random() * 60_000;
  }
  for (const a of get(room)) (a.owl ? tickOwl : tickWalker)(a, dt);
}

export function getAnimalStates(room: string): AnimalState[] {
  return get(room).map(a => ({ ...a.s }));
}

export function setAnimalEating(room: string, id: string, seconds = 8) {
  const a = get(room).find(x => x.s.id === id);
  if (!a || (a.s.kind as string) !== 'dog' && (a.s.kind as string) !== 'cat') return;
  a.eatT = seconds; a.path = [];
}

export function feedFlock(room: string, x: number, z: number, seconds = 10): void {
  flockAnchor = pickFlockAnchor();
  for (const a of get(room)) {
    if (a.s.kind !== 'parrot' && a.s.kind !== 'chick') continue;
    a.feedTo = outdoorJitter({ x, z }, 1.5);
    a.feedEat = seconds;
    a.path = [];
    a.home = outdoorJitter(flockAnchor, 2.5);
  }
  flockMoveAt = Date.now() + 150_000;
}

export function flockCenter(room: string): { x: number; z: number } | null {
  let n = 0, sx = 0, sz = 0;
  for (const a of get(room)) {
    if (a.s.kind !== 'parrot' && a.s.kind !== 'chick') continue;
    sx += a.s.x; sz += a.s.z; n++;
  }
  return n ? { x: sx / n, z: sz / n } : null;
}

export function triggerLost(room: string): string | null {
  const list = get(room);
  if (list.some(a => a.s.lost)) return null;
  const id = lostToggle++ % 2 === 0 ? 'vang' : 'muop';
  const a = list.find(x => x.s.id === id)!;
  a.s.lost = true; a.eatT = 0;
  // Keep-out: the lost spot is outdoor, the path is sanitized (no house/deck/zafu crossing).
  a.path = sanitizePath(a.s, routeToPoint(a.s, pick(LOST_SPOTS)));
  return id;
}

export function resolveLost(room: string, id: string) {
  const a = get(room).find(x => x.s.id === id);
  if (!a || !a.s.lost) return;
  a.s.lost = false; a.wait = rnd(3, 8);
  // Keep-out: sanitize the walk back to the plaza as well.
  a.path = sanitizePath(a.s, routeToPoint(a.s, PLAZA));
}
