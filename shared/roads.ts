// shared/roads.ts
// Road graph + Dijkstra. Pure data and pure functions (no imports, server + client safe).
//
// Platform note (Tam The, verified from layout.ts groundY + TAM_THE_PLAT):
// footprint x -20..20, z -80..-56, top y = 3.0. The only walkable entry is the central
// stair on the south face (|x| <= 4.2, z -50 -> -56). The other faces are a 3 m wall.
// z = -40 for |x| < 17 is ON the hall floor, so a z = -40 detour is wrong as well.
// => The ground between the hall (north edge z = -42) and the stair foot (z = -50) is open.
// The rear road stays split into a west segment and an east segment (z = -46); no rearMid
// node was added. The middle crossing goes only via the hall east aisle and the stair
// approach (see below).
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
  { id: 'hallWestWp', x: -21, z: -12.5 }, // west of the x=-18.1 colonnade; was (-18,-10), 0.50 from r0.50 column (-18.8,-9.4)
  { id: 'hallEastWp', x: 22.8, z: -12.3 }, // gap between columns (22.5,-13.5) and (22.9,-11.2); was (24,-12.5)
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
  { id: 'stairApp', x: 4, z: -55.8 },
  { id: 'stairTop', x: 0, z: -56 },
  { id: 'tamThe', x: 0, z: -58 },
  // Branch
  { id: 'bellTower', x: -34, z: -6 },
  { id: 'drumTower', x: 34, z: -6 },
  { id: 'quanYard', x: 28, z: 19.5 },
  { id: 'buddhaYard', x: -22.6, z: 14 },
  { id: 'denTrinh', x: 10, z: 39 },
  { id: 'restArea', x: 27, z: 33.5 },
  { id: 'restEast', x: 34.5, z: 26 },
  { id: 'restSE', x: 34.5, z: 36 },
  { id: 'denN', x: 11.5, z: 35.5 },
  { id: 'denE', x: 18, z: 37 },
  { id: 'dienMau', x: 39, z: 14.5 },
  // baoThap stops 2.2 m south of the thap's south steps (z -33..-31.2); the steps
  // no longer sit inside the Tam The platform (platform z -80..-56).
  { id: 'baoThap', x: -30, z: -28 }, // was -29: pillar r0.5 at (-30.2,-29.8) left only 0.33 clearance at the node
  { id: 'phongCDDoor', x: -36, z: 35 },
  { id: 'psPier', x: 30, z: -31 },
  { id: 'thienDuong', x: -39.5, z: -27.5 },
  { id: 'zenGarden', x: -34, z: -26 },
  { id: 'corrW', x: -20.5, z: -6 },
  { id: 'pillars', x: 0, z: -5.9 },
  // Waypoints that route around the zen-garden/drum/pier colliders
  { id: 'zenIn', x: -28.3, z: -27 }, // inside the zen pocket, east of pillar (-29.4,-26); start of the x=-28.3 run to the z=-17 wall gap
  { id: 'zenOut', x: -28.3, z: -8 }, // south of the z=-17 wall gap (-30.3..-26.7), north-east of the bell-tower pillars at z=-7.9
  { id: 'drumTowerW', x: 29, z: -8 },
  { id: 'psW', x: 25.5, z: -31 },
  // Garden (rest route)
  { id: 'ktGate', x: -30, z: -54 },
  { id: 'ktIn', x: -30, z: -57 },
  { id: 'ktMid', x: -34, z: -56 },
  { id: 'ktYard', x: -41, z: -60 },
  { id: 'tangXaDoor', x: -41, z: -68 },
  // East garden (Am Co)
  { id: 'toGate', x: 30, z: -54 },
  { id: 'toIn', x: 30, z: -58 },
  { id: 'toYard', x: 41, z: -58 },
  { id: 'toE', x: 50, z: -58 },
  { id: 'amCoE1', x: 55, z: -58 },
  { id: 'amCoE2', x: 55, z: -68.5 },
  { id: 'amCoDoor', x: 53, z: -71 },
  { id: 'amCoEast', x: 57.2, z: -75 },
  // Zen garden east hedge gap (z = -26.6)
  { id: 'zenE1', x: -18, z: -20 },
  { id: 'zenE2', x: -18, z: -24 },
  { id: 'zenW', x: -26, z: -26.6 },
  // Market outside the south gate (quest v1): stalls at z 47-56, road down the middle.
  { id: 'marketW1', x: -8.5, z: 47 },
  { id: 'marketE1', x: 8.5, z: 47 },
  { id: 'marketW2', x: -8.5, z: 54 },
  { id: 'marketE2', x: 8.5, z: 54 },
  { id: 'marketS', x: 0, z: 56 },
]

export const HOUSE_DOORS: { id: string; x: number; z: number }[] = [
  { id: 'traiDuong', x: -29, z: -58.25 },
  { id: 'nhaKhach', x: -47, z: -56.55 },
  { id: 'amCo', x: 53, z: -72.25 },
  { id: 'tangXa', x: -41, z: -68 },
  { id: 'thienDuong', x: -40.5, z: -27 },
  { id: 'phongCongDuc', x: -38.5, z: 35 },
  { id: 'nhaTo', x: 36, z: -64.75 },
]

export const ROAD_EDGES: [string, string][] = [
  // Axis chain
  ['gate', 'bridgeS'], ['bridgeS', 'bridgeN'], ['bridgeN', 'plaza'],
  ['plaza', 'axisMid'], ['axisMid', 'hallFront'], ['hallFront', 'hallIn'],
  // Axis to sides
  ['plaza', 'pillars'], ['plaza', 'eastMid'],
  ['hallFront', 'eastMid'],
  ['hallFront', 'hallWestWp'], ['hallWestWp', 'corrW'], ['hallFront', 'hallEastWp'], ['hallEastWp', 'drumTowerW'],
  // West
  ['corrW', 'westMid'], ['westMid', 'westNorth'], ['westNorth', 'rearKT'],
  ['rearKT', 'rearW'], ['rearKT', 'ktGate'], ['ktGate', 'ktIn'], ['ktIn', 'ktMid'], ['ktMid', 'ktYard'], ['ktYard', 'tangXaDoor'],
  // East
  ['drumTower', 'drumTowerW'], ['drumTowerW', 'eastMid'], ['eastMid', 'eastNorth'], ['eastNorth', 'rearTO'], ['rearTO', 'rearE'],
  ['psPier', 'psW'], ['psW', 'eastMid'],
  // East garden (Am Co)
  ['rearTO', 'toGate'], ['toGate', 'toIn'], ['toIn', 'toYard'], ['toYard', 'toE'], ['toE', 'amCoE1'], ['amCoE1', 'amCoE2'], ['amCoE2', 'amCoDoor'],
  ['amCoE2', 'amCoEast'],
  // Stair
  ['hallIn', 'hallAisleE'], ['hallAisleE', 'hallAisleN'], ['hallAisleN', 'stairApp'], ['stairApp', 'stairTop'], ['stairTop', 'tamThe'],
  // Branch
  ['bellTower', 'corrW'], ['baoThap', 'zenGarden'],
  ['zenGarden', 'thienDuong'], ['baoThap', 'zenIn'], ['zenIn', 'zenOut'], ['zenOut', 'bellTower'],
  ['quanYard', 'plaza'],
  ['quanYard', 'restEast'], ['restEast', 'restSE'], ['restSE', 'restArea'], ['quanYard', 'dienMau'], ['buddhaYard', 'plaza'],
  ['buddhaYard', 'bridgeN'], ['denTrinh', 'gate'], ['denTrinh', 'denN'], ['denN', 'denE'], ['denE', 'restArea'],
  ['phongCDDoor', 'gate'],
  // Zen garden east hedge gap: hallFront -> east side -> gap -> baoThap / zenIn
  ['hallFront', 'zenE1'], ['zenE1', 'zenE2'], ['zenE2', 'westMid'],
  ['westMid', 'zenW'], ['zenW', 'baoThap'], ['zenW', 'zenIn'],
  // Market: gate gap (|x| < 4.4 at z = 45) to both rows, then south to marketS.
  ['gate', 'marketW1'], ['gate', 'marketE1'],
  ['marketW1', 'marketW2'], ['marketE1', 'marketE2'],
  ['marketW2', 'marketS'], ['marketE2', 'marketS'],
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
