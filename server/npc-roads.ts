import { BUDDHA_YARD, CORR, DEN_TRINH, DIEN_MAU, KOI_BRIDGE_WALK_HALF, NHA_KHACH, REST, TAM_THE, TANG_XA, clampToCompound, inLake, onKoiBridge, onKoiBridgeRail, resolveBridge } from '../src/layout.js';
import { BAMBOO, DUOC_SU, LOTUS_PAVILION, TINH_THAT, expansionWaterBlocked } from '../shared/campus.js';
import { ROAD_NODES, roadPath, type Pt } from '../shared/roads.js';

// NPCs follow authored roads without the player's prop collision resolver.
// Keep these measured clearances local to NPCs.
const positions = new Map<string, Pt>(ROAD_NODES.map(({ id, x, z }) => [id, { x, z }]));
positions.set('bridgeE', { x: 16.65, z: 14 });
positions.set('baoSouthTurn', { x: -46, z: -97.4 });
positions.set('baoEastTurn', { x: -37.6, z: -98.7 });

const detours = new Map<string, readonly Pt[]>([
  ['bridgeS/lakeNE', [{ x: 9.45, z: 26.99 }]],
  ['lakeNE/lakeNW', [{ x: 9.69, z: 26.97 }, { x: -9.5, z: 26.99 }]],
  ['lakeNW/lakeSW', [{ x: -16.55, z: 19 }, { x: -16.55, z: 11.9 }]],
  ['lakeNE/lakeSE', [{ x: 16.55, z: 19.1 }, { x: 16.85, z: 14.5 }, { x: 16.5, z: 11.8 }, { x: 15.2, z: 5.8 }]],
  ['lakeSE/bridgeE', [{ x: 15.2, z: 5.8 }, { x: 16.5, z: 11.8 }]],
  ['bridgeE/lakeNE', [{ x: 16.85, z: 14.5 }, { x: 16.55, z: 19.1 }]],
  ['lakeSW/bridgeW', [{ x: -16.55, z: 11.9 }]],
  ['bridgeW/lakeNW', [{ x: -16.55, z: 19 }]],
  ['lakeSW/bridgeN', [{ x: -9, z: 1.95 }]],
  ['lakeSE/bridgeN', [{ x: 9, z: 1.95 }]],
  ['hallIn/hallAisleE', [{ x: 9, z: -24 }, { x: 14, z: -27 }]],
  ['hallSE/eastMid', [{ x: CORR.x, z: CORR.z0 - 2 }]],
  ['lotusPavE/lotusPavS', [{ x: -66.75, z: -15.75 }, { x: -68.25, z: -16.5 }]],
  ['lotusBridgeS/lotusPavS', [{ x: LOTUS_PAVILION.x - 3, z: LOTUS_PAVILION.z - 3.6 }]],
  ['lotusPavS/lotusPavilion', [{ x: -72.75, z: -16.5 }, { x: -73.5, z: -15 }, { x: -72, z: -13.5 }]],
  ['restArea/restTurn', [{ x: REST.x, z: REST.z + 1.3 }]],
  ['farmGate/farm', [{ x: -66, z: -43 }, { x: -74.1, z: -43 }]],
  ['riverBankE/bamboo', [{ x: 93, z: 2 }]],
  ['bambooS2/bambooS', [{ x: 87.3, z: 2 }]],
  ['baoSouthTurn/baoEastTurn', [{ x: -43.8, z: -96.9 }, { x: -40.1, z: -96.9 }, { x: -39.7, z: -98.65 }]],
  ['baoEastTurn/baoE', [{ x: -35.9, z: -96.8 }]],
  ['baoE/caveBypass', [{ x: -32.12, z: -93.26 }, { x: -26.98, z: -90.79 }]],
  ['caveElbow/pineRestW', [{ x: -28.5, z: -97.5 }, { x: -30, z: -96 }]],
]);

export function nodePt(id: string): Pt {
  const p = positions.get(id);
  if (!p) throw new Error(`unknown road node ${id}`);
  return { ...p };
}

export function roadRoute(fromId: string, toId: string): Pt[] {
  const ids = roadPath(fromId, toId, true);
  const route: Pt[] = [];
  for (let i = 1; i < ids.length; i++) {
    const a = ids[i - 1], b = ids[i];
    const points = detours.get(`${a}/${b}`) ?? [...(detours.get(`${b}/${a}`) ?? [])].reverse();
    for (const p of points) route.push({ ...p });
    route.push(nodePt(b));
  }
  return route;
}

export function npcTravelPoint(p: Pt): boolean {
  if (onKoiBridgeRail(p.x, p.z) || (inLake(p.x, p.z) && !onKoiBridge(p.x, p.z, KOI_BRIDGE_WALK_HALF)) ||
    expansionWaterBlocked(p.x, p.z)) return false;
  const q = { ...p };
  clampToCompound(q);
  return p.x === q.x && p.z === q.z;
}

export function npcTravelStep(from: Pt, to: Pt): boolean {
  if (!npcTravelPoint(to)) return false;
  // Use the same rail/entrance rules as the player, but reject rather than slide off the route.
  const q = { ...to };
  resolveBridge(q, from);
  return q.x === to.x && q.z === to.z;
}

// Local collision proxies for measured outdoor spawn/attachment failures. The regular
// graph and authored interiors already have routes; do not apply these to seat transitions.
const outdoorProps = [
  ...[-1, 1].map(side => ({ x: side * 4, z: -16, r: 0.35 })), // lamps beside axisMid
  { ...BUDDHA_YARD, r: 4 },
  ...[-1, 1].map(side => ({ x: TANG_XA.x + side * 2.2, z: TANG_XA.z + 2.5, r: 0.45 })),
  { x: REST.x - 1.9, z: REST.z - 0.9, r: 1.55 }, { x: REST.x + 2.3, z: REST.z - 1.1, r: 1.55 },
  { x: DEN_TRINH.x + 1, z: DEN_TRINH.z, r: 1 }, { x: DEN_TRINH.x + 0.2, z: DEN_TRINH.z, r: 0.3 },
  ...[-1.3, 0, 1.3].map(dz => ({ x: DEN_TRINH.x + 1.6, z: DEN_TRINH.z + dz, r: 0.5 })),
  ...[-1, 1].flatMap(side => [-1, 0, 1].map(dx => ({ x: DEN_TRINH.x + dx, z: DEN_TRINH.z + side * 2, r: 0.45 }))),
  { x: NHA_KHACH.x + 4.6, z: NHA_KHACH.z + 3.25, r: 0.791 },
  ...[-1, 1].map(side => ({ x: DUOC_SU.x - DUOC_SU.hx + 0.6, z: DUOC_SU.z + side * 1.8, r: 0.34 })),
];

export function npcOutdoorPoint(p: Pt): boolean {
  return outdoorProps.every(o => Math.hypot(p.x - o.x, p.z - o.z) >= o.r + 0.12) &&
    TINH_THAT.every(h => Math.abs(p.x - h.x) >= 1.65 || Math.abs(p.z - h.z) >= 1.4);
}

export function npcOutdoorSpawn(p: Pt): boolean {
  // The road on the bamboo grove's east edge is clear; radial scatter into its culms is not.
  const dx = Math.abs(p.x - BAMBOO.x);
  const inBambooEdge = dx > 0.5 && p.x >= BAMBOO.x - 7 && p.x <= BAMBOO.x + 6 && p.z >= BAMBOO.z0 && p.z < 0.8;
  return !inBambooEdge && npcOutdoorPoint(p);
}

export function npcTravelSegment(a: Pt, b: Pt): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1));
  let prev = a;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    if (!npcTravelStep(prev, p) || !npcOutdoorPoint(p)) return false;
    prev = p;
  }
  return true;
}

function crossesCorridorProps(a: Pt, b: Pt): boolean {
  if (Math.max(a.z, b.z) < CORR.z0 - 1 || Math.min(a.z, b.z) > CORR.z1 + 1) return false;
  const dx = b.x - a.x, dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  const cuts = (x: number, z: number, r: number) => {
    const t = len2 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2)) : 0;
    return Math.hypot(a.x + t * dx - x, a.z + t * dz - z) < r;
  };
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const z = CORR.z0 + 0.6 + i * 3.6;
    if (cuts(side * (CORR.x + 2.4), z, 0.3) || cuts(side * (CORR.x - 2.4), z, 0.3)
      || cuts(side * (CORR.x + 1.85), z + 1.8, 0.93)) return true;
  }
  return false;
}

export function nearestRoadNode(p: Pt): string {
  // Leave the cushion and incense strips through the same openings used to enter.
  if (Math.abs(p.x) <= 6 && p.z >= -36 && p.z < -30) return 'hallIn';
  if (Math.abs(p.x - TAM_THE.x) <= 6 && p.z >= TAM_THE.z - 0.85 && p.z < -60) return 'tamThe';
  if (Math.abs(p.x - DIEN_MAU.x) <= 1 && p.z >= DIEN_MAU.z - 0.2 && p.z <= DIEN_MAU.z + 2.2) return 'dienMau';
  let best = '', d = Infinity;
  for (const [id, q] of positions) {
    const dist = Math.hypot(p.x - q.x, p.z - q.z);
    if (dist < d && !crossesCorridorProps(p, q) && npcTravelSegment(p, q)) { best = id; d = dist; }
  }
  return best;
}

export function routeFrom(from: Pt, toId: string): Pt[] {
  const startId = nearestRoadNode(from);
  if (!startId || !positions.has(toId)) return [];
  const first = nodePt(startId);
  const route = roadRoute(startId, toId);
  // Always go through the entry node; skipping it cuts across corners.
  return [first, ...route];
}
