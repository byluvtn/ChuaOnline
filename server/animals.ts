import type { AnimalState, AnimalAnim } from '../shared/types';
import { routeFrom, nearestNode, ROAD_NODES } from '../shared/roads';
import {
  HALL, TAM_THE_PLAT, DIEN_MAU_PLAT, THIEN_DUONG_PLAT, TRAI_DUONG_PLAT,
  NHA_TO_PLAT, TANG_XA_PLAT, NHA_KHACH_PLAT, AM_CO_PLAT, VUON_THAP_PLAT,
  PHONG_CD_PLAT, BAO_THAP,
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
const LOST_SPOTS: P[] = [{ x: -30, z: -38 }, { x: -47, z: -27 }, { x: 30, z: -31 }, { x: 39, z: 10 }, { x: -46, z: -46 }];
const PERCH_SPOTS: P[] = [{ x: -47, z: -27 }, { x: 30, z: -31 }];
const PLAZA: P = { x: 0, z: 6 };
const OWL_SPEED = 5;
const OWL_VY = 3;

const rooms = new Map<string, A[]>();
let lostToggle = 0;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(l: T[]): T => l[Math.floor(Math.random() * l.length)];
const jitter = (p: P, r: number): P => ({ x: p.x + rnd(-r, r), z: p.z + rnd(-r, r) });
const nodePt = (id: string): P => { const n = ROAD_NODES.find((n) => n.id === id)!; return { x: n.x, z: n.z }; };
const route = (from: P, toId: string): P[] => [...routeFrom(from, toId), jitter(nodePt(toId), 1.5)];
const INDOOR_RECTS = [
  HALL, TAM_THE_PLAT, DIEN_MAU_PLAT, THIEN_DUONG_PLAT, TRAI_DUONG_PLAT,
  NHA_TO_PLAT, TANG_XA_PLAT, NHA_KHACH_PLAT, AM_CO_PLAT, VUON_THAP_PLAT,
  PHONG_CD_PLAT,
];

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
    if (!indoors(q.x, q.z)) return q;
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
    mk('vang', 'dog', 'Vàng', 0, 6, 1.2), mk('den', 'dog', 'Đen', 4, 8, 1.2), mk('lab', 'dog', 'Labrador', -8, 10, 1.2), mk('muop', 'cat', 'Mướp', -4, 4, 1.0),
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
    const d = step(a, a.feedTo.x, a.feedTo.z, a.speed * dt);
    set(a, 'walk');
    if (d < Math.max(0.3, a.speed * dt)) {
      a.feedTo = undefined;
      a.eatT = a.feedEat ?? 8;
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
  a.path = a.home ? [outdoorJitter(a.home, 3)] : route(s, pick(SAFE));
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
  a.path = routeToPoint(a.s, pick(LOST_SPOTS));
  return id;
}

export function resolveLost(room: string, id: string) {
  const a = get(room).find(x => x.s.id === id);
  if (!a || !a.s.lost) return;
  a.s.lost = false; a.wait = rnd(3, 8);
  a.path = routeToPoint(a.s, PLAZA);
}
