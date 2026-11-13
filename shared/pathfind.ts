import { ROAD_NODES, ROAD_EDGES, HOUSE_DOORS, type Pt } from './roads';

export type Collider = { x: number; z: number; r: number };
export interface Pathfinder {
  findPath(from: Pt, to: Pt): Pt[];
  segmentClear(ax: number, az: number, bx: number, bz: number): boolean;
  readonly lastFallback: boolean;
}

// Must agree with collide() in main.ts: body radius 0.4 + 0.15 margin.
const CLEARANCE = 0.4 + 0.15;
const CELL = 4;

export function createPathfinder(colliders: Collider[]): Pathfinder {
  // Spatial hash: each collider is stored in every cell touched by its inflated bbox.
  const grid = new Map<number, number[]>();
  const key = (cx: number, cz: number) => (cx + 4096) * 8192 + (cz + 4096);
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    const R = c.r + CLEARANCE;
    const x0 = Math.floor((c.x - R) / CELL), x1 = Math.floor((c.x + R) / CELL);
    const z0 = Math.floor((c.z - R) / CELL), z1 = Math.floor((c.z + R) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const k = key(cx, cz);
        const cell = grid.get(k);
        if (cell) cell.push(i); else grid.set(k, [i]);
      }
    }
  }
  const stamp = new Int32Array(colliders.length);
  let stampId = 0;

  function segmentClear(ax: number, az: number, bx: number, bz: number): boolean {
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz;
    stampId++;
    const x0 = Math.floor(Math.min(ax, bx) / CELL), x1 = Math.floor(Math.max(ax, bx) / CELL);
    const z0 = Math.floor(Math.min(az, bz) / CELL), z1 = Math.floor(Math.max(az, bz) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const cell = grid.get(key(cx, cz));
        if (!cell) continue;
        for (let n = 0; n < cell.length; n++) {
          const i = cell[n];
          if (stamp[i] === stampId) continue;
          stamp[i] = stampId;
          const c = colliders[i];
          const t = len2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((c.x - ax) * dx + (c.z - az) * dz) / len2));
          const px = ax + dx * t, pz = az + dz * t;
          if (Math.hypot(c.x - px, c.z - pz) < c.r + CLEARANCE) return false;
        }
      }
    }
    return true;
  }

  // Road graph (normalised defensively: nodes are {x,z} with optional id; edges are [a,b] or {a,b}/{from,to}).
  const rawNodes = ROAD_NODES as unknown as any[];
  const pts: Pt[] = rawNodes.map((n) => ({ x: n.x, z: n.z }));
  const ids: string[] = rawNodes.map((n, i) => String(n?.id ?? i));
  const idIndex = new Map<string, number>();
  ids.forEach((id, i) => idIndex.set(id, i));
  const resolve = (v: any): number => idIndex.get(String(v)) ?? (typeof v === 'number' ? v : -1);
  const N = pts.length;
  const adj: { to: number; w: number }[][] = pts.map(() => []);
  for (const e of ROAD_EDGES as unknown as any[]) {
    const a = resolve(Array.isArray(e) ? e[0] : (e.a ?? e.from));
    const b = resolve(Array.isArray(e) ? e[1] : (e.b ?? e.to));
    if (a < 0 || b < 0 || a >= N || b >= N || a === b) continue;
    if (!segmentClear(pts[a].x, pts[a].z, pts[b].x, pts[b].z)) {
      console.warn('pathfind: dropping unclear edge ' + ids[a] + '->' + ids[b]);
      continue;
    }
    const w = Math.hypot(pts[a].x - pts[b].x, pts[a].z - pts[b].z);
    adj[a].push({ to: b, w });
    adj[b].push({ to: a, w });
  }

  let lastFallback = false;

  // Nearest road node; prefers nodes with a clear straight segment to p.
  function nearestNode(p: Pt): number {
    let bestVis = -1, bestVisD = Infinity, bestAny = -1, bestAnyD = Infinity;
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(pts[i].x - p.x, pts[i].z - p.z);
      if (d < bestAnyD) { bestAnyD = d; bestAny = i; }
      if (d < bestVisD && segmentClear(p.x, p.z, pts[i].x, pts[i].z)) { bestVisD = d; bestVis = i; }
    }
    return bestVis >= 0 ? bestVis : bestAny;
  }

  function findPath(from: Pt, to: Pt): Pt[] {
    lastFallback = false;
    if (segmentClear(from.x, from.z, to.x, to.z)) return [{ x: to.x, z: to.z }];
    if (N === 0) {
      lastFallback = true;
      console.warn('planPath: no road nodes, staying in place');
      return [];
    }
    // Limitation: if `from` is inside an enclosed area, segmentClear(from, A) is false.
    // We still start the path at A; the walk loop + collide() slides the player along walls toward A.
    const A = nearestNode(from);
    let B = nearestNode(to);

    const dist = new Array<number>(N).fill(Infinity);
    const prev = new Array<number>(N).fill(-1);
    const done = new Array<boolean>(N).fill(false);
    dist[A] = 0;
    for (let it = 0; it < N; it++) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break;
      done[u] = true;
      for (const e of adj[u]) {
        if (!done[e.to] && dist[u] + e.w < dist[e.to]) { dist[e.to] = dist[u] + e.w; prev[e.to] = u; }
      }
    }

    if (dist[B] === Infinity) {
      let best = A, bestD = Infinity;
      for (let i = 0; i < N; i++) {
        if (dist[i] === Infinity) continue;
        const d = Math.hypot(pts[i].x - pts[B].x, pts[i].z - pts[B].z);
        if (d < bestD) { bestD = d; best = i; }
      }
      B = best;
      console.warn('planPath: target unreachable, stopping at node ' + ids[B]);
    }

    const buildChain = (end: number): Pt[] => {
      const chain: number[] = [];
      for (let i = end; i !== -1; i = prev[i]) chain.push(i);
      chain.reverse();
      return chain.map((i) => ({ x: pts[i].x, z: pts[i].z }));
    };
    let out = buildChain(B);

    if (segmentClear(pts[B].x, pts[B].z, to.x, to.z)) {
      out.push({ x: to.x, z: to.z });
    } else {
      // Target inside a house: go through the nearest door (within 8 m) instead of stopping outside the wall.
      let door: { id: string; x: number; z: number } | null = null;
      let doorD = 8;
      for (const d of HOUSE_DOORS) {
        const dd = Math.hypot(d.x - to.x, d.z - to.z);
        if (dd < doorD) { doorD = dd; door = d; }
      }
      let viaDoor = false;
      if (door) {
        let B2 = nearestNode(door);
        if (dist[B2] === Infinity) {
          let best = A, bestD = Infinity;
          for (let i = 0; i < N; i++) {
            if (dist[i] === Infinity) continue;
            const d = Math.hypot(pts[i].x - pts[B2].x, pts[i].z - pts[B2].z);
            if (d < bestD) { bestD = d; best = i; }
          }
          B2 = best;
        }
        if (segmentClear(pts[B2].x, pts[B2].z, door.x, door.z)) {
          out = buildChain(B2);
          out.push({ x: door.x, z: door.z });
          if (segmentClear(door.x, door.z, to.x, to.z)) out.push({ x: to.x, z: to.z });
          viaDoor = true;
        }
      }
      if (!viaDoor) console.warn('planPath: target blocked (' + to.x + ', ' + to.z + '), stopping at node ' + ids[B]);
    }
    const last = out[out.length - 1];
    lastFallback = !(last.x === to.x && last.z === to.z);
    return out;
  }

  return {
    findPath,
    segmentClear,
    get lastFallback() { return lastFallback; },
  };
}
