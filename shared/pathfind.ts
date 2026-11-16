import { ROAD_NODES, ROAD_EDGES, HOUSE_DOORS, type Pt } from './roads';

export type Collider = { x: number; z: number; r: number; x2?: number; z2?: number };
export interface Pathfinder {
  findPath(from: Pt, to: Pt): Pt[];
  segmentClear(ax: number, az: number, bx: number, bz: number): boolean;
  readonly lastFallback: boolean;
}

// Must agree with collide() in main.ts: body radius 0.4 + 0.15 margin.
const CLEARANCE = 0.4 + 0.15;
const CELL = 4;

// Line-collider (hàng rào, viền luống) có dạng {x,z,r,x2,z2}. Pathfinder chỉ
// hiểu hình tròn, nên mở rộng mỗi đoạn thẳng thành chuỗi hình tròn con cách
// nhau <= 0.5 m (cùng bán kính r) để pathfinder "thấy" cả đoạn thẳng,
// giống cách collide() trong main.ts xử lý line-collider.
function expandColliders(colliders: Collider[]): Collider[] {
  const out: Collider[] = [];
  for (const c of colliders) {
    if (c.x2 === undefined || c.z2 === undefined) {
      out.push(c);
      continue;
    }
    const dx = c.x2 - c.x, dz = c.z2 - c.z;
    const len = Math.hypot(dx, dz);
    const n = Math.max(1, Math.ceil(len / 0.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({ x: c.x + dx * t, z: c.z + dz * t, r: c.r });
    }
  }
  return out;
}

export function createPathfinder(colliders: Collider[], opts?: { deck?: { x: number; z0: number; z1: number; hw: number }; avoid?: (p: Pt) => boolean }): Pathfinder {
  // Mở rộng line-collider TRƯỚC khi dùng colliders.length cho stamp và grid.
  colliders = expandColliders(colliders);

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

  // Ban kinh dung duoc that: collide() o main.ts day nguoi choi ra toi r + 0.4.
  // WALK_CLEAR = 0.40 (= collide, khong cong them) dung de kiem tra "dang dung trong vong" va chan tiep tuyen
  // co di duoc khong — duong tiep tuyen co the sat vong ke ben (1,05 m) ma van
  // di duoc (collide truot qua), trong khi CLEARANCE 0,55 bao khong.
  const WALK_CLEAR = 0.40;

  function segmentWalkable(ax: number, az: number, bx: number, bz: number): boolean {
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
          if (Math.hypot(c.x - px, c.z - pz) < c.r + WALK_CLEAR) return false;
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

  // Tuong compound. PHAI khop voi WALL o src/layout.ts: zS = 45, zN = -82, x = +/-62.
  // Khong import src/ tu shared/ nen hardcode o day.
  const WALL_ZS = 45, WALL_ZN = -82, WALL_X = 62;

  // true neu a va b cung o trong (hoac cung o ngoai) moi tuong cua compound.
  function sameSide(a: Pt, b: Pt): boolean {
    return (a.z <= WALL_ZS) === (b.z <= WALL_ZS)
        && (a.z >= WALL_ZN) === (b.z >= WALL_ZN)
        && (Math.abs(a.x) <= WALL_X) === (Math.abs(b.x) <= WALL_X);
  }

  // Nearest road node; prefers nodes with a clear straight segment to p.
  // Neu khong co node nao co doan sach: uu tien node cung phia tuong voi p,
  // chi khi khong co node cung phia moi lay gan nhat tong the (hanh vi cu).
  function nearestNode(p: Pt): number {
    let bestVis = -1, bestVisD = Infinity, bestAny = -1, bestAnyD = Infinity;
    let bestSide = -1, bestSideD = Infinity;
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(pts[i].x - p.x, pts[i].z - p.z);
      if (d < bestAnyD) { bestAnyD = d; bestAny = i; }
      if (d < bestSideD && sameSide(p, pts[i])) { bestSideD = d; bestSide = i; }
      if (d < bestVisD && segmentClear(p.x, p.z, pts[i].x, pts[i].z)) { bestVisD = d; bestVis = i; }
    }
    if (bestVis >= 0) return bestVis;
    return bestSide >= 0 ? bestSide : bestAny;
  }

  // Collider that only overlaps the start point: first point on from->to outside every inflated collider containing `from`.
  // Returns null if `from` is free, or the ray does not get out before reaching `to`.
  function startExitPoint(from: Pt, to: Pt): Pt | null {
    const dx = to.x - from.x, dz = to.z - from.z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-6) return null;
    const ux = dx / d, uz = dz / d;
    const cell = grid.get(key(Math.floor(from.x / CELL), Math.floor(from.z / CELL)));
    if (!cell) return null;
    let tExit = 0;
    for (const i of cell) {
      const c = colliders[i];
      const R = c.r + CLEARANCE;
      const wx = from.x - c.x, wz = from.z - c.z;
      const w2 = wx * wx + wz * wz;
      if (w2 >= R * R) continue;
      const b = wx * ux + wz * uz;
      const t = -b + Math.sqrt(b * b - (w2 - R * R));
      if (t > tExit) tExit = t;
    }
    if (tExit <= 0) return null;
    tExit += 0.02;
    if (tExit >= d) return null;
    return { x: from.x + ux * tExit, z: from.z + uz * tExit };
  }

  // Collider that only overlaps the target: first point where from->to enters an inflated collider containing `to`.
  // Returns null if no collider contains `to`, or `from` is already inside it.
  function endEntryPoint(from: Pt, to: Pt): Pt | null {
    const dx = to.x - from.x, dz = to.z - from.z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-6) return null;
    const ux = dx / d, uz = dz / d;
    const cell = grid.get(key(Math.floor(to.x / CELL), Math.floor(to.z / CELL)));
    if (!cell) return null;
    let tEntry = Infinity;
    for (const i of cell) {
      const c = colliders[i];
      const R = c.r + CLEARANCE;
      const tx = to.x - c.x, tz = to.z - c.z;
      if (tx * tx + tz * tz >= R * R) continue;
      const wx = from.x - c.x, wz = from.z - c.z;
      const w2 = wx * wx + wz * wz;
      if (w2 < R * R) continue;
      const b = wx * ux + wz * uz;
      const disc = b * b - (w2 - R * R);
      if (disc < 0) continue;
      const t = -b - Math.sqrt(disc);
      if (t > 0 && t < tEntry) tEntry = t;
    }
    if (tEntry === Infinity) return null;
    tEntry -= 0.02;
    if (tEntry <= 0) return null;
    return { x: from.x + ux * tEntry, z: from.z + uz * tEntry };
  }

  // Cac collider chan doan a->b (tra ve index, toi da `max` + 1 de biet la qua nhieu).
  function blockers(a: Pt, b: Pt, max: number): number[] {
    const out: number[] = [];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    stampId++;
    const x0 = Math.floor(Math.min(a.x, b.x) / CELL), x1 = Math.floor(Math.max(a.x, b.x) / CELL);
    const z0 = Math.floor(Math.min(a.z, b.z) / CELL), z1 = Math.floor(Math.max(a.z, b.z) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const cell = grid.get(key(cx, cz));
        if (!cell) continue;
        for (const i of cell) {
          if (stamp[i] === stampId) continue;
          stamp[i] = stampId;
          const c = colliders[i];
          const t = len2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.z - a.z) * dz) / len2));
          if (Math.hypot(c.x - (a.x + dx * t), c.z - (a.z + dz * t)) < c.r + CLEARANCE) {
            out.push(i);
          }
        }
      }
    }
    // Xếp theo tham số chiếu t (gần a nhất lên đầu) RỒI mới cắt max.
    // Trước đây hàm trả sớm khi đủ max theo thứ tự duyệt cell, nên bl[0] sau
    // khi sort ở tangentDetour có thể KHÔNG phải vật cản gần nhất — với nhiều
    // hình tròn con từ line-collider, nhánh "tOf > 0.9 thì đi thẳng" đã bắn
    // nhầm (VD từ (0,43.5) tới (-48,18) trả đường thẳng xuyên hàng rào Đông).
    const tOf2 = (i: number) => (len2 < 1e-6 ? 0 : ((colliders[i].x - a.x) * dx + (colliders[i].z - a.z) * dz) / len2);
    out.sort((i, j) => tOf2(i) - tOf2(j));
    return out.slice(0, max);
  }

  // Di vong cuc bo quanh vat can nho: di tiep tuyen voi vong tron phinh
  // (r + CLEARANCE) o phia gan dich hon, thay vi quay ve lo trinh duong bo.
  // Tra ve null khi khong vong duoc (dang dung trong vong, qua sau).
  function tangentDetour(from: Pt, to: Pt, depth: number): Pt[] | null {
    if (segmentClear(from.x, from.z, to.x, to.z)) return [{ x: to.x, z: to.z }];
    if (depth <= 0) return null;
    const bl = blockers(from, to, 12);
    if (bl.length === 0) return null;
    // Vat chan dau tien doc theo huong di (t nho nhat).
    const dx = to.x - from.x, dz = to.z - from.z, len2 = dx * dx + dz * dz;
    const tOf = (i: number) => ((colliders[i].x - from.x) * dx + (colliders[i].z - from.z) * dz) / len2;
    bl.sort((i, j) => tOf(i) - tOf(j));
    // Vat chan duy nhat nam sat dich (diem quet dat tren cay, r <= 1,2):
    // cu di thang vao, collide() se truot nguoi choi ra khoi vong tron o
    // cach dich ~1 m — trong tam trigger quet 1,5 m. Khong can vong.
    const first = colliders[bl[0]];
    if (tOf(bl[0]) > 0.9 && first.r <= 1.2) return [{ x: to.x, z: to.z }];
    const c = first;
    const R = c.r + CLEARANCE + 0.05;
    const cx = c.x - from.x, cz = c.z - from.z;
    const dc = Math.hypot(cx, cz);
    if (dc <= c.r + WALK_CLEAR) return null; // dang dung trong vong that: de startExitPoint xu ly
    if (dc <= R + 0.25) {
      // Dung sat vong: tiep tuyen gan nhu khong co (buoc 0,4 m, xoay mai
      // quanh cung mot cot) — di vong (orbit) quanh vong tron, moi cap 0,9 rad
      // (~52°), de qua mat xa cua vat can thay vi bo quanh no.
      const angFrom = Math.atan2(from.z - c.z, from.x - c.x);
      let best: Pt[] | null = null, bestLen = Infinity;
      for (const s of [-1, 1]) {
        const a = angFrom + s * 0.9;
        const wp = { x: c.x + Math.cos(a) * R * 1.04, z: c.z + Math.sin(a) * R * 1.04 };
        if (!segmentWalkable(from.x, from.z, wp.x, wp.z)) continue;
        const rest = tangentDetour(wp, to, depth - 1);
        if (!rest) continue;
        const route = [wp, ...rest];
        let L = 0, px = from.x, pz = from.z;
        for (const q of route) { L += Math.hypot(q.x - px, q.z - pz); px = q.x; pz = q.z; }
        if (L < bestLen) { bestLen = L; best = route; }
      }
      // Ca 2 huong orbit deu khong duoc: thu di thang (collide truot qua).
      if (!best && segmentWalkable(from.x, from.z, to.x, to.z)) return [{ x: to.x, z: to.z }];
      return best;
    }
    const base = Math.atan2(cz, cx);
    const ang = Math.asin(Math.min(1, R / dc));
    const tl = Math.sqrt(dc * dc - R * R);
    let best: Pt[] | null = null, bestLen = Infinity;
    for (const s of [-1, 1]) {
      const a = base + s * ang;
      // Diem tiep tuyen that, day ra them mot chut de nam ngoai vong.
      const tx = from.x + Math.cos(a) * tl, tz = from.z + Math.sin(a) * tl;
      const wp = { x: c.x + (tx - c.x) * 1.04, z: c.z + (tz - c.z) * 1.04 };
      // Chan di duoc (WALK_CLEAR), khong doi chan sach tuyet doi: duong tiep
      // tuyen qua cum cot sat nhau se sat vong ke ben nhung collide() truot qua duoc.
      if (!segmentWalkable(from.x, from.z, wp.x, wp.z)) continue;
      const rest = tangentDetour(wp, to, depth - 1);
      if (!rest) continue;
      const route = [wp, ...rest];
      let L = 0, px = from.x, pz = from.z;
      for (const q of route) { L += Math.hypot(q.x - px, q.z - pz); px = q.x; pz = q.z; }
      if (L < bestLen) { bestLen = L; best = route; }
    }
    return best;
  }

  function planRoute(from: Pt, to: Pt): Pt[] {
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

    const endsAt = (q: Pt) => out.length > 0 && Math.hypot(out[out.length - 1].x - q.x, out[out.length - 1].z - q.z) < 0.05;
    if (segmentClear(pts[B].x, pts[B].z, to.x, to.z)) {
      if (!endsAt(to)) out.push({ x: to.x, z: to.z }); // tránh trùng khi B chính là `to`
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
          const endsAt2 = (q: Pt) => out.length > 0 && Math.hypot(out[out.length - 1].x - q.x, out[out.length - 1].z - q.z) < 0.05;
          if (!endsAt2(door)) out.push({ x: door.x, z: door.z });
          if (segmentClear(door.x, door.z, to.x, to.z) && !endsAt2(to)) out.push({ x: to.x, z: to.z });
          viaDoor = true;
        }
      }
      if (!viaDoor) console.warn('planPath: target blocked (' + to.x + ', ' + to.z + '), stopping at node ' + ids[B]);
    }
    const last = out[out.length - 1];
    lastFallback = !(last.x === to.x && last.z === to.z);
    return out;
  }

  // Di vong cuc bo quanh vat can nho truoc, roi moi xet lo trinh duong bo:
  // 1 vat nho chan duong thang khong con bat ca lo trinh phai vong xa nua.
  // Diem co dung duoc khong: khong nam trong vong di duoc (r + WALK_CLEAR)
  // cua bat ky collider nao. Luoi hash luu collider theo bbox phinh CLEARANCE
  // (0,55 > 0,40) nen chi can kiem o cell chua diem.
  function pointStandable(p: Pt): boolean {
    if (opts?.avoid?.(p)) return false; // điểm bị cấm (vd: trong nước) thì không đứng được
    const cell = grid.get(key(Math.floor(p.x / CELL), Math.floor(p.z / CELL)));
    if (!cell) return true;
    for (const i of cell) {
      const c = colliders[i];
      if (Math.hypot(c.x - p.x, c.z - p.z) < c.r + WALK_CLEAR) return false;
    }
    return true;
  }

  // Diem thoat gan nhat khi xuat phat nam trong vat can (cum da, hang rao):
  // quet vong tron mo rong, chon diem dung duoc gan dich nhat. Neu khong co,
  // tra ve null de roi ve hanh vi cu.
  function escapePoint(from: Pt, to: Pt): Pt | null {
    for (const rad of [0.75, 1.25, 1.75, 2.5, 3.25, 4]) {
      let best: Pt | null = null, bestD = Infinity;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const p = { x: from.x + Math.cos(a) * rad, z: from.z + Math.sin(a) * rad };
        if (!pointStandable(p)) continue;
        const d = Math.hypot(p.x - to.x, p.z - to.z);
        if (d < bestD) { bestD = d; best = p; }
      }
      if (best) return best;
    }
    return null;
  }

  function findPath(from: Pt, to: Pt): Pt[] {
    // Dich nam tren mat cau (ben trong vong collider vien ho): di qua loi len
    // cau gan phia xuat phat hon (bridgeN / bridgeS) roi di thang len cau toi dich.
    if (opts?.deck) {
      const dk = opts.deck;
      const onDeck = (p: Pt) =>
        Math.abs(p.x - dk.x) < dk.hw && p.z >= dk.z0 && p.z <= dk.z1;
      if (onDeck(to) && !onDeck(from)) {
        const mid = (dk.z0 + dk.z1) / 2;
        const entry: Pt = from.z < mid
          ? { x: dk.x, z: dk.z0 - 0.4 }   // bridgeN (0, 13.8)
          : { x: dk.x, z: dk.z1 + 0.4 };  // bridgeS (0, 30.2)
        lastFallback = false;
        const head = findPath(from, entry);
        lastFallback = false;
        const last = head[head.length - 1];
        const tail = last && Math.hypot(last.x - to.x, last.z - to.z) < 0.05
          ? [] : [{ x: to.x, z: to.z }];
        // lọc waypoint liên tiếp trùng nhau (< 0.05 m)
        const merged: Pt[] = [];
        for (const w of [...head, ...tail]) {
          const prev = merged[merged.length - 1];
          if (prev && Math.hypot(prev.x - w.x, prev.z - w.z) < 0.05) continue;
          merged.push(w);
        }
        return merged;
      }
    }
    const direct = Math.hypot(to.x - from.x, to.z - from.z);
    // Xuat phat trong vat can: thoat ra diem dung duoc gan nhat truoc khi
    // dinh tuyen — neu khong collide() day qua day lai giua cac vat can
    // va nguoi choi khong bao gio di chuyen (5 start luoi 441 cua v4).
    if (!pointStandable(from)) {
      const esc = escapePoint(from, to);
      if (esc) return [esc, ...findPath(esc, to)];
    }
    const local = tangentDetour(from, to, 6);
    let localLen = Infinity;
    if (local) {
      localLen = 0;
      let px = from.x, pz = from.z;
      for (const p of local) { localLen += Math.hypot(p.x - px, p.z - pz); px = p.x; pz = p.z; }
      // Do vong cuc bo phai o gan duong thang: neu mot diem vong lech qua xa
      // (vuot max(3 m, 30% duong thang)) thi do khong con la "vong cuc bo"
      // nua ma la mot lo trinh khac — de duong bo (duoc thiet ke san) dam nhan.
      const dx = to.x - from.x, dz = to.z - from.z;
      const d2 = dx * dx + dz * dz;
      const cap = Math.max(3, 0.3 * direct);
      for (const p of local) {
        const t = d2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((p.x - from.x) * dx + (p.z - from.z) * dz) / d2));
        if (Math.hypot(p.x - (from.x + dx * t), p.z - (from.z + dz * t)) > cap) { localLen = Infinity; break; }
      }
    }
    const route = planRoute(from, to);
    let len = 0, px = from.x, pz = from.z;
    for (const p of route) { len += Math.hypot(p.x - px, p.z - pz); px = p.x; pz = p.z; }
    // Uu tien di vong cuc bo neu no khong dai hon nhieu so voi duong thang
    // va (duong bo that bai hoac khong ngan hon no).
    if (local && localLen <= 3 * direct && (lastFallback || localLen <= len)) {
      lastFallback = false;
      return local;
    }
    if (len <= 3 * direct) return route;
    // Obstacle only near the start: if the detour is >3x the straight distance and the rest of the
    // straight line is clear, walk straight and let collide() slide the player out.
    const exit = startExitPoint(from, to);
    if (exit && segmentClear(exit.x, exit.z, to.x, to.z)) {
      lastFallback = false;
      return [{ x: to.x, z: to.z }];
    }
    const entry = endEntryPoint(from, to);
    if (entry && segmentClear(from.x, from.z, entry.x, entry.z)) {
      lastFallback = false;
      return [{ x: to.x, z: to.z }];
    }
    return route;
  }

  return {
    findPath,
    segmentClear,
    get lastFallback() { return lastFallback; },
  };
}
