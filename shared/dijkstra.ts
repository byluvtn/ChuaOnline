/** Dijkstra chung cho cả hai phía (Fable #56). Node là số nguyên 0..N-1; adjacency
 *  là danh sách kề theo index. Tie-break mặc định: index nhỏ thắng; truyền `less`
 *  để giữ tie-break cũ của roads (id nhỏ thắng). Epsilon relax 1e-9 (theo roads).
 *  `to` tùy chọn: có thì dừng sớm khi settle đích; không có thì tính đủ dist[]
 *  (planRoute cần dist đầy đủ cho fallback đích không tới được). */
export interface DijkstraEdge { to: number; w: number }
export interface DijkstraResult { dist: number[]; prev: number[] }
export function dijkstra(
  adj: DijkstraEdge[][],
  from: number,
  to = -1,
  less: (a: number, b: number) => boolean = (a, b) => a < b,
): DijkstraResult {
  const N = adj.length;
  const dist = new Array<number>(N).fill(Infinity);
  const prev = new Array<number>(N).fill(-1);
  const done = new Array<boolean>(N).fill(false);
  if (from < 0 || from >= N) return { dist, prev };
  dist[from] = 0;
  for (let it = 0; it < N; it++) {
    let u = -1;
    for (let i = 0; i < N; i++) {
      if (done[i] || dist[i] === Infinity) continue;
      if (u < 0 || dist[i] < dist[u] - 1e-9 || (Math.abs(dist[i] - dist[u]) <= 1e-9 && less(i, u))) u = i;
    }
    if (u < 0 || dist[u] === Infinity) break;
    if (u === to) break;
    done[u] = true;
    for (const e of adj[u]) {
      if (!done[e.to] && dist[u] + e.w < dist[e.to] - 1e-9) { dist[e.to] = dist[u] + e.w; prev[e.to] = u; }
    }
  }
  return { dist, prev };
}
/** Dựng chuỗi node từ from tới to qua prev; [] nếu không tới được. */
export function reconstructPath(prev: number[], from: number, to: number): number[] {
  if (to < 0 || to >= prev.length || (to !== from && prev[to] === -1)) return [];
  const chain: number[] = [];
  for (let i = to; i !== -1; i = prev[i]) chain.push(i);
  chain.reverse();
  return chain[0] === from ? chain : [];
}
