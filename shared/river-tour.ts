import { riverAt } from './campus.js';

const dockZ = -10;
const { x, hw } = riverAt(dockZ);
export const RIVER_DOCK = { x: x - hw - 0.65, z: dockZ, r: 2.4, edge: x - hw, y: 0.103, north: -26.35, south: -7.65 };
export function nearRiverDock(x: number, z: number) {
  return Math.abs(x - RIVER_DOCK.x) <= RIVER_DOCK.r && z >= RIVER_DOCK.north - .4 && z <= RIVER_DOCK.south + .4;
}
export function riverDockY(x: number, z: number) {
  if (x < RIVER_DOCK.edge - 1.705 || x > RIVER_DOCK.edge + 0.745 || z < RIVER_DOCK.north || z > RIVER_DOCK.south) return 0;
  return RIVER_DOCK.y;
}
export const RIVER_BOAT_SEAT_Y = 0.225;
export const RIVER_BOAT_SEAT_Z = 0.55;
export const RIVER_BOAT_HEIGHT = 1.8;
export const RIVER_BOATS = [
  { id: 0, z: -10, color: 0x487269 },
  { id: 1, z: -17, color: 0x864e46 },
  { id: 2, z: -24, color: 0x445d79 },
] as const;
export type RiverBoatId = typeof RIVER_BOATS[number]['id'];
export type RiverBoatState = { id: RiverBoatId; elapsed: number; rider?: string };

type Point = { x: number; z: number };
const lane = (z: number, dx: number): Point => ({ x: riverAt(z).x + dx, z });
const interpolate = (a: number, b: number, c: number, d: number, t: number) =>
  b + .5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
const speed = 2.55;
const routes = RIVER_BOATS.map(({ z }) => {
  const berth = lane(z, -riverAt(z).hw + 2.3);
  const waypoints = [berth, lane(z - 6, -5.9), lane(-34, -2.1), lane(-48, -2.1), lane(-65, -2.6), lane(-72, 0),
    lane(-66, 2.8), lane(-47, 2.05), lane(-25, 2.05), lane(-2, 2.05), lane(8.5, 2.7),
    lane(10.5, -0.8), lane(7, -2), lane(-2, -2.1), lane(z + 4, -6.5), berth];
  // Bake each smooth course by distance so boats share the same cruising speed.
  const samples: (Point & { distance: number })[] = [{ ...berth, distance: 0 }];
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
  return { samples, length, duration: Math.ceil(1000 * (length / speed + 2)) };
});
export const riverTourDuration = (id: RiverBoatId) => routes[id].duration;
export function riverBoatAt(elapsedMs: number, id: RiverBoatId) {
  const { samples, length, duration } = routes[id];
  elapsedMs = Math.max(0, Math.min(duration, elapsedMs));
  const sec = Math.min(duration - elapsedMs, elapsedMs) / 1000;
  const easing = Math.max(0, 1 - sec / 2) ** 2;
  const distance = Math.max(0, Math.min(length, (elapsedMs / 1000 - 1 + (elapsedMs < duration / 2 ? easing : -easing)) * speed));
  let lo = 0, hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    if (samples[mid].distance < distance) lo = mid; else hi = mid;
  }
  const a = samples[lo], b = samples[hi], t = (distance - a.distance) / (b.distance - a.distance);
  const before = samples[lo - 1] ?? samples[samples.length - 2], after = samples[hi + 1] ?? samples[1];
  return { x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z), ry: Math.atan2(after.x - before.x, after.z - before.z) };
}

export type RiverBoatTrip = { id: RiverBoatId; start: number; rider?: string };

// Slightly inflate each hull for bobbing and the distance it can travel between checks.
export function riverBoatsOverlap(a: ReturnType<typeof riverBoatAt>, b: ReturnType<typeof riverBoatAt>) {
  const halfLength = 2.4, halfWidth = 1.03;
  const dx = b.x - a.x, dz = b.z - a.z;
  if (dx * dx + dz * dz > 5.23 ** 2) return false;
  const sin = Math.abs(Math.sin(a.ry - b.ry)), cos = Math.abs(Math.cos(a.ry - b.ry));
  for (const angle of [a.ry, b.ry]) {
    const s = Math.sin(angle), c = Math.cos(angle);
    if (Math.abs(dx * s + dz * c) > halfLength * (1 + cos) + halfWidth * sin
      || Math.abs(dx * c - dz * s) > halfWidth * (1 + cos) + halfLength * sin) return false;
  }
  return true;
}

/** Find a departure that keeps a moving hull clear of other trips and their berths. */
export function riverDeparture(id: RiverBoatId, now: number, trips: readonly RiverBoatTrip[]) {
  const duration = riverTourDuration(id);
  const lastArrival = Math.max(now, ...trips.map(trip => trip.start + riverTourDuration(trip.id)));
  const otherBoats = RIVER_BOATS.filter(boat => boat.id !== id).map(({ id }) => ({ id, trip: trips.find(t => t.id === id) }));
  for (let start = now; ; start = Math.min(start + 750, lastArrival)) {
    const clear = otherBoats.every(({ id: other, trip }) => {
      // Include time before departure and after return, while this boat is at its berth.
      const end = Math.max(start + duration, trip ? trip.start + riverTourDuration(other) : now);
      for (let t = now; t <= end + 100; t += 100) {
        if (riverBoatsOverlap(riverBoatAt(t - start, id), riverBoatAt(trip ? t - trip.start : 0, other))) return false;
      }
      return true;
    });
    if (clear) return start;
    if (start === lastArrival) return undefined;
  }
}
