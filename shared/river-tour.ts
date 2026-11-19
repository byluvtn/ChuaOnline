import { riverAt } from './campus.js';

const dockZ = -10;
const { x, hw } = riverAt(dockZ);
export const RIVER_DOCK = { x: x - hw - 0.65, z: dockZ, r: 2.4, edge: x - hw, y: 0.103 };
export function riverDockY(x: number, z: number) {
  if (x < RIVER_DOCK.edge - 1.705 || x > RIVER_DOCK.edge + 0.745 || Math.abs(z - RIVER_DOCK.z) > 2.305) return 0;
  return RIVER_DOCK.y;
}
export const RIVER_BOAT_SEAT_Y = 0.225;
export const RIVER_BOAT_SEAT_Z = 0.55;
export const RIVER_BOAT_HEIGHT = 1.8;

type Point = { x: number; z: number };
const lane = (z: number, dx: number): Point => ({ x: riverAt(z).x + dx, z });
const berth = lane(dockZ, -hw + 1.85);
const waypoints = [berth, lane(-17, -7), lane(-28, -2.1), lane(-48, -2.1), lane(-65, -2.6), lane(-72, 0),
  lane(-66, 2.8), lane(-47, 2.05), lane(-25, 2.05), lane(-2, 2.05), lane(8.5, 2.7),
  lane(10.5, -0.8), lane(7, -2), lane(-2, -2.1), lane(-6.5, -7), berth];

// Bake a smooth course and its lengths once so the skiff moves at a steady speed on both ends.
const samples: (Point & { distance: number })[] = [{ ...berth, distance: 0 }];
const interpolate = (a: number, b: number, c: number, d: number, t: number) =>
  b + .5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
for (let i = 0; i < waypoints.length - 1; i++) {
  const b = waypoints[i], c = waypoints[i + 1];
  const a = waypoints[i - 1] ?? waypoints[waypoints.length - 2];
  const d = waypoints[i + 2] ?? waypoints[1];
  for (let j = 1; j <= 32; j++) {
    const t = j / 32, prev = samples[samples.length - 1];
    const x = interpolate(a.x, b.x, c.x, d.x, t), z = interpolate(a.z, b.z, c.z, d.z, t);
    samples.push({ x, z, distance: prev.distance + Math.hypot(x - prev.x, z - prev.z) });
  }
}
const length = samples[samples.length - 1].distance;
const speed = 2.55;
export const RIVER_TOUR_MS = Math.ceil(1000 * (length / speed + 2));
export function riverBoatAt(elapsedMs: number) {
  elapsedMs = Math.max(0, Math.min(RIVER_TOUR_MS, elapsedMs));
  const sec = Math.min(RIVER_TOUR_MS - elapsedMs, elapsedMs) / 1000;
  const easing = Math.max(0, 1 - sec / 2) ** 2;
  const distance = Math.max(0, Math.min(length, (elapsedMs / 1000 - 1 + (elapsedMs < RIVER_TOUR_MS / 2 ? easing : -easing)) * speed));
  let lo = 0, hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    if (samples[mid].distance < distance) lo = mid; else hi = mid;
  }
  const a = samples[lo], b = samples[hi], t = (distance - a.distance) / (b.distance - a.distance);
  const before = samples[lo - 1] ?? samples[samples.length - 2], after = samples[hi + 1] ?? samples[1];
  return { x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z), ry: Math.atan2(after.x - before.x, after.z - before.z) };
}
