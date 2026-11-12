// shared/roads.ts
// Road graph + Dijkstra. Pure data and pure functions (no imports, server + client safe).
//
// Platform note (Tam The, verified from layout.ts groundY + TAM_THE_PLAT):
// footprint x -20..20, z -66..-42, top y = 3.0. The only walkable entry is the central
// stair on the south face (|x| <= 4.2, z -40.2 -> -42). The other faces are a 3 m wall.
// z = -40 for |x| < 17 is ON the hall floor, so a z = -40 detour is wrong as well.
// => There is NO straight rear road along z = -46 and NO z = -40 detour.
// The rear road is split into a west segment and an east segment. The middle crossing
// goes only via the hall east aisle and the stair approach (see below). Node rearMid
// (0, -46) is deleted.
//
// Corrected coordinates (kept from the old spokes): quanYard, buddhaYard, denTrinh, baoThap,
// dienMau (39, 14.5) and thienDuong (-39.5, -27) are placed in front of their buildings.
// dienMau / thienDuong door sides were taken as given; they were not re-derived from code.
//
// Stair approach finding: the main hall altar is 24 m wide (hall.ts:159-171, AW = 25),
// centred at (0, -40), spanning x -12..12, z -41.65..-38.35, top y = 1.9. The offering
// table sits at z = -36.7. A stair base node at (0, -40) is buried in the altar, so it
// is deleted. The clean approach is only via the east aisle (x = 14) and then west
// along z = -41.8 on the platform skirt, north of the altar, into the stair.
//
// Dropped edges: none. The edges below were not geometrically re-checked against every
// collider here; they are used exactly as specified.

export type Pt = { x: number; z: number }

export interface RoadNode {
  id: string
  x: number
  z: number
}

export const ROAD_NODES: RoadNode[] = [
  // Axis
  { id: 'gate', x: 0, z: 43.5 },
  { id: 'bridgeS', x: 0, z: 30.2 },
  { id: 'bridgeN', x: 0, z: 13.8 },
  { id: 'plaza', x: 0, z: 6 },
  { id: 'axisMid', x: 3, z: -17 },
  { id: 'hallFront', x: 0, z: -20 },
  { id: 'hallIn', x: 0, z: -24 },
  // Rear west / east
  { id: 'rearW', x: -46, z: -46 },
  { id: 'rearKT', x: -30, z: -46 },
  { id: 'rearTO', x: 30, z: -46 },
  { id: 'rearE', x: 46, z: -46 },
  // Bypasses
  { id: 'westMid', x: -22, z: -26 },
  { id: 'westNorth', x: -22, z: -46 },
  { id: 'eastMid', x: 22, z: -26 },
  { id: 'eastNorth', x: 22, z: -46 },
  // Stair route
  // Stair approach (east aisle, around the altar)
  { id: 'hallAisleE', x: 14, z: -38 },
  { id: 'hallAisleN', x: 14, z: -41.8 },
  { id: 'stairApp', x: 4, z: -41.8 },
  { id: 'stairTop', x: 0, z: -42 },
  { id: 'tamThe', x: 0, z: -44 },
  // Branch
  { id: 'bellTower', x: -34, z: -6 },
  { id: 'drumTower', x: 34, z: -6 },
  { id: 'quanYard', x: 28, z: 19.5 },
  { id: 'buddhaYard', x: -22.6, z: 14 },
  { id: 'denTrinh', x: 10, z: 39 },
  { id: 'restArea', x: 27, z: 31 },
  { id: 'dienMau', x: 39, z: 14.5 },
  // baoThap stops south of the Tam The platform edge (z = -42): the thap's steps
  // (z -47..-45.2) sit inside the platform footprint, so the node cannot sit at the steps.
  { id: 'baoThap', x: -17, z: -41 },
  { id: 'phongCDDoor', x: -42, z: 39.5 },
  { id: 'psPier', x: 30, z: -31 },
  { id: 'thienDuong', x: -39.5, z: -27 },
  { id: 'zenGarden', x: -34, z: -26 },
  { id: 'corrW', x: -20.5, z: -6 },
  { id: 'pillars', x: 0, z: -5.9 },
  // Garden (rest route)
  { id: 'ktGate', x: -30, z: -49 },
  { id: 'ktYard', x: -41, z: -60 },
  { id: 'tangXaDoor', x: -41, z: -68 },
]

export const ROAD_EDGES: [string, string][] = [
  // Axis chain
  ['gate', 'bridgeS'], ['bridgeS', 'bridgeN'], ['bridgeN', 'plaza'],
  ['plaza', 'axisMid'], ['axisMid', 'hallFront'], ['hallFront', 'hallIn'],
  // Axis to sides
  ['hallFront', 'corrW'], ['hallFront', 'drumTower'], ['plaza', 'pillars'],
  ['pillars', 'axisMid'], ['corrW', 'pillars'], ['drumTower', 'pillars'],
  // West
  ['corrW', 'westMid'], ['westMid', 'westNorth'], ['westNorth', 'rearKT'],
  ['rearKT', 'rearW'], ['rearKT', 'ktGate'], ['ktGate', 'ktYard'], ['ktYard', 'tangXaDoor'],
  // East
  ['drumTower', 'eastMid'], ['eastMid', 'eastNorth'], ['eastNorth', 'rearTO'], ['rearTO', 'rearE'],
  // Stair
  ['hallIn', 'hallAisleE'], ['hallAisleE', 'hallAisleN'], ['hallAisleN', 'stairApp'], ['stairApp', 'stairTop'], ['stairTop', 'tamThe'],
  // Branch
  ['bellTower', 'corrW'], ['bellTower', 'baoThap'], ['baoThap', 'zenGarden'],
  ['zenGarden', 'thienDuong'], ['zenGarden', 'westMid'], ['quanYard', 'plaza'],
  ['quanYard', 'restArea'], ['quanYard', 'dienMau'], ['buddhaYard', 'plaza'],
  ['buddhaYard', 'bridgeN'], ['denTrinh', 'gate'], ['denTrinh', 'restArea'],
  ['restArea', 'plaza'], ['dienMau', 'restArea'], ['phongCDDoor', 'gate'],
  ['phongCDDoor', 'denTrinh'], ['psPier', 'dienMau'], ['psPier', 'eastNorth'],
  ['thienDuong', 'westNorth'],
]

const NODE_BY_ID = new Map<string, RoadNode>(ROAD_NODES.map((n) => [n.id, n]))

// Adjacency lists in ROAD_EDGES order (deterministic tie-breaking).
const ADJ = new Map<string, { id: string; w: number }[]>()
for (const n of ROAD_NODES) ADJ.set(n.id, [])
for (const [a, b] of ROAD_EDGES) {
  const na = NODE_BY_ID.get(a)
  const nb = NODE_BY_ID.get(b)
  if (!na || !nb) continue
  const w = Math.hypot(na.x - nb.x, na.z - nb.z)
  ADJ.get(a)!.push({ id: b, w })
  ADJ.get(b)!.push({ id: a, w })
}

/** Dijkstra over the edge list; node ids from -> to inclusive, [] if unreachable/unknown. */
export function roadPath(fromId: string, toId: string): string[] {
  if (!NODE_BY_ID.has(fromId) || !NODE_BY_ID.has(toId)) return []
  if (fromId === toId) return [fromId]
  const dist = new Map<string, number>()
  const prev = new Map<string, string>()
  const done = new Set<string>()
  for (const n of ROAD_NODES) dist.set(n.id, Infinity)
  dist.set(fromId, 0)
  for (;;) {
    // Pick the unvisited node with the smallest distance (ties: smaller id).
    let cur: string | null = null
    let best = Infinity
    for (const n of ROAD_NODES) {
      if (done.has(n.id)) continue
      const d = dist.get(n.id)!
      if (d < best || (d === best && cur !== null && n.id < cur)) {
        best = d
        cur = n.id
      }
    }
    if (cur === null || best === Infinity) return []
    if (cur === toId) break
    done.add(cur)
    for (const nb of ADJ.get(cur)!) {
      if (done.has(nb.id)) continue
      const nd = best + nb.w
      if (nd < dist.get(nb.id)! - 1e-9) {
        dist.set(nb.id, nd)
        prev.set(nb.id, cur)
      }
    }
  }
  const path: string[] = [toId]
  let c = toId
  while (c !== fromId) {
    const p = prev.get(c)
    if (p === undefined) return []
    path.push(p)
    c = p
  }
  return path.reverse()
}

/** Waypoints of roadPath: excludes the start node, includes the destination. */
export function roadRoute(fromId: string, toId: string): Pt[] {
  return roadPath(fromId, toId)
    .slice(1)
    .map((id) => {
      const n = NODE_BY_ID.get(id)!
      return { x: n.x, z: n.z }
    })
}

/** Id of the node closest to p (first in ROAD_NODES order on ties). */
export function nearestNode(p: Pt): string {
  let bestId = ROAD_NODES[0].id
  let bestD = Infinity
  for (const n of ROAD_NODES) {
    const d = (n.x - p.x) * (n.x - p.x) + (n.z - p.z) * (n.z - p.z)
    if (d < bestD) {
      bestD = d
      bestId = n.id
    }
  }
  return bestId
}

/** Waypoints from an arbitrary point to node toId; never empty for a known toId. */
export function routeFrom(from: Pt, toId: string): Pt[] {
  const dest = NODE_BY_ID.get(toId)
  if (!dest) return []
  const startId = nearestNode(from)
  const start = NODE_BY_ID.get(startId)!
  const near = Math.hypot(start.x - from.x, start.z - from.z) <= 0.5
  const route = roadRoute(startId, toId)
  if (near) {
    return route.length ? route : [{ x: dest.x, z: dest.z }]
  }
  // Away from every node: walk to the nearest node first, then follow the road.
  const out: Pt[] = [{ x: start.x, z: start.z }, ...route]
  return out.length ? out : [{ x: dest.x, z: dest.z }]
}
