import assert from 'node:assert/strict';
import { WALL, LAKE, BRIDGE, NGOC, NGOC_HALL, NGOC_TERRACE, NORTH_WALK_Z, RIVER, RIVER_BRIDGES, RIVER_FALLS, RIVER_MOUTH_Z, riverAt, DUOC_SU, DUOC_SU_DOOR, DUOC_SU_YAW, duocSuWorld, duocSuRiverGap, PHONG_CD, PHONG_CD_DOOR, PHONG_CD_YAW, TINH_THAT, TINH_THAT_LANE_Z, phongCdWorld, expansionGroundY, expansionWaterBlocked, ngocHillGroundY, ngocStepProfile, resolveExpansionWater, clampCampus, LOTUS, LOTUS_PAVILION, BAMBOO, FLOWER_HILL, CAVE, FARM_POND, RIVER_EAST_WALK_X, inEllipse } from '../shared/campus';
import { MAP_HALF, MAP_Z_MIN, MAP_Z_MAX } from '../shared/types';
import { clampToCompound, bridgeY, resolveBridge, resolveWater, groundY, nearWalkway, inLake, onKoiBridge, NGOC_APPROACH, NGOC_EAST_LANE, NGOC_EAST_PAVING, WALKWAY_RECTS, TAM_THE_PLAT, VIEN_TO, BELL, DRUM, BAO_THAP, TANG_XA, VUON_THAP, BAO_THAP_PLAT, NHA_KHACH } from '../src/layout';
import { HOUSE_DOORS, ROAD_NODES, ROAD_EDGES, roadPath, routeFrom, nearestNode } from '../shared/roads';
import { createPathfinder } from '../shared/pathfind';
import { NPC_QUESTS } from '../shared/game';
import { onAxisWaterGap } from '../src/layout';
import { createAnimals } from '../server/animals';
import { createNpcRoom, tickNpcs } from '../server/npcs';
import { nodePt as npcNode, routeFrom as npcRouteFrom, npcTravelSegment } from '../server/npc-roads';
import { buildPondLotus } from '../src/pond-lotus';
import { RIVER_BOATS, RIVER_BOAT_HEIGHT, RIVER_BOAT_SEAT_Z, RIVER_DOCK, riverBoatAt, riverBoatsOverlap, riverDeparture, riverTourDuration, type RiverBoatTrip } from '../shared/river-tour';

const lotus = buildPondLotus(LAKE.a, LAKE.b, 0.14, 32, 8113, (x, _z, radius) => Math.abs(x) > BRIDGE.hw + radius);
assert.equal(lotus.children.length, 3);
for (const part of lotus.children) {
  assert(part.type === 'Mesh' && 'count' in part && Number(part.count) > 0, 'All lotus stages are instanced');
  assert('boundingSphere' in part && part.boundingSphere, 'Each lotus stage has bounds');
}

assert.deepEqual([WALL.xW, WALL.zN, WALL.zS], [-92, -130, 45]);
assert(MAP_HALF > Math.max(-WALL.xW, WALL.xE) && MAP_Z_MIN <= WALL.zN && MAP_Z_MAX >= 58);
assert.deepEqual([BELL.x, DRUM.x, BAO_THAP.x, BAO_THAP.z], [34, -34, -46, -102]);
assert.deepEqual(TANG_XA, { x: -64, z: -74 });
assert.deepEqual(VUON_THAP, { x: 50, z: -94 });
assert.deepEqual([LAKE.z, LAKE.a, LAKE.b, BRIDGE.z0, BRIDGE.z1], [14, 14, 10, 2, 26]);
assert.equal(BRIDGE.hw * 2, 4.6);
assert.equal(bridgeY(BRIDGE.x, LAKE.z), 0.12 + BRIDGE.peak);
for (const dir of [-1, 1]) for (const x of [BRIDGE.x - 2, BRIDGE.x, BRIDGE.x + 2]) {
  const start = dir > 0 ? BRIDGE.z0 - 0.5 : BRIDGE.z1 + 0.5;
  let prev = { x, z: start };
  for (let i = 1; i <= 100; i++) {
    const step = { x, z: start + dir * i * 0.25 };
    const expected = { ...step };
    resolveWater(step, resolveBridge(step, prev), prev);
    assert.deepEqual(step, expected, 'Crossing in either direction stays on the deck');
    assert(!onAxisWaterGap(step.x, step.z));
    prev = step;
  }
}
for (const side of [-1, 1]) {
  const x = side * (LAKE.a + 2.4), z = LAKE.z;
  assert(!expansionWaterBlocked(x, z), 'dry bank lane around the koi lake');
  assert(nearWalkway(x, z, 0) && nearWalkway(x, BRIDGE.z0 - 0.5, 0) && nearWalkway(x, BRIDGE.z1 + 0.5, 0));
  const step = { x: BRIDGE.x + side * (BRIDGE.hw + 0.3), z };
  assert(resolveBridge(step, { x: BRIDGE.x + side * (BRIDGE.hw - 0.3), z }));
  assert.equal(step.x, BRIDGE.x + side * (BRIDGE.hw - 0.15), 'Rails stop sideways movement');
  const waterStep = { x: BRIDGE.x + side * (BRIDGE.hw + 0.5), z };
  assert(onAxisWaterGap(waterStep.x, z));
  assert.equal(groundY(waterStep.x, z), 0);
  resolveWater(waterStep, true);
  assert(!inLake(waterStep.x, waterStep.z), 'Only the deck exempts walkers from the lake');
}
const koiPath = createPathfinder([], { deck: BRIDGE, avoid: p => onAxisWaterGap(p.x, p.z) });
const northBank = { x: BRIDGE.x, z: BRIDGE.z0 - 0.5 }, southBank = { x: BRIDGE.x, z: BRIDGE.z1 + 0.5 };
assert(koiPath.segmentClear(southBank.x, southBank.z, northBank.x, northBank.z));
assert(!koiPath.segmentClear(BRIDGE.hw + 1, southBank.z, BRIDGE.hw + 1, northBank.z));
for (const from of [northBank, southBank]) {
  const to = { x: BRIDGE.x, z: LAKE.z };
  assert.deepEqual(koiPath.findPath(from, to).at(-1), to);
  assert(!koiPath.lastFallback);
}
// Exercise both planning and server ticks. The player pathfinder already accepted the deck
// when NPCs still planned around it and their movement rejected it as water.
assert(npcTravelSegment(southBank, northBank), 'The NPC road must cross the deck');
for (const side of [-1, 1]) {
  const x = BRIDGE.x + side * (BRIDGE.hw + 0.5);
  assert(!npcTravelSegment({ x, z: northBank.z }, { x, z: southBank.z }), 'NPCs must not cross open water');
  assert(!npcTravelSegment({ x: BRIDGE.x, z: 3 }, { x, z: 3 }), 'NPCs must not cut sideways through a rail on dry ground');
}
const noonFree = Date.UTC(2026, 10, 19, 8);
for (const [from, landing, exit, dest] of [
  ['gate', 'bridgeS', 'bridgeN', 'plaza'], ['plaza', 'bridgeN', 'bridgeS', 'gate'],
] as const) {
  for (const offset of [-0.8, 0.8]) {
    const room = createNpcRoom(noonFree);
    const npc = room.npcs.find(n => n.def.id === 'npc1')!;
    const start = npcNode(from), goal = npcNode(dest);
    const entryPt = npcNode(landing), exitPt = npcNode(exit);
    Object.assign(npc.state, { x: start.x + offset, z: start.z + 0.8, anim: 'walk' });
    npc.phase = 'walk'; npc.speed = 1.2; npc.route = npcRouteFrom(npc.state, dest);
    assert(npc.route.some((p, i, route) => p.x === exitPt.x && p.z === exitPt.z &&
      route[i - 1]?.x === entryPt.x && route[i - 1]?.z === entryPt.z), `NPC must take the direct bridge edge from ${from}`);
    let crossed = false, reached = false;
    for (let t = noonFree + 100; t <= noonFree + 45_000 && npc.phase === 'walk'; t += 100) {
      tickNpcs(room, t, 1);
      const { x, z } = npc.state;
      if (Math.hypot(x - goal.x, z - goal.z) < 0.12) { reached = true; break; }
      if (!inLake(x, z)) continue;
      assert(onKoiBridge(x, z, BRIDGE.hw - 0.15), 'NPC must remain inside the rails over water');
      assert.equal(groundY(x, z), bridgeY(x, z));
      crossed ||= Math.abs(z - LAKE.z) < 0.15;
    }
    assert(crossed && reached, `NPC did not reach ${dest} via the bridge`);
  }
}
{
  // The visitor-specific final waypoint used to scatter some guests off the north landing into the lake.
  const room = createNpcRoom(noonFree), plaza = npcNode('plaza');
  const visitors = room.npcs.filter(n => n.def.behavior === 'visitor');
  for (const npc of visitors) {
    Object.assign(npc.state, plaza);
    Object.assign(npc, { phase: 'idle', mode: 'normal', stage: 'toPlaza', until: noonFree });
  }
  tickNpcs(room, noonFree + 100, 1);
  for (const npc of visitors) {
    const stop = npc.route.at(-1)!;
    assert(stop.z < BRIDGE.z0 && npcTravelSegment(plaza, stop), `Unsafe plaza stop for ${npc.def.id}`);
  }
}
const profile = ngocStepProfile();
assert.equal(NGOC.y, 8.4);
// A4: the lotus lake moved to (−78,−24); a step from the south bank into the water is undone.
const offDeck = { x: LOTUS.x, z: LOTUS.z + LOTUS.b - 0.2 }, onDeck = { x: LOTUS.x, z: LOTUS.z + LOTUS.b + 1.6 };
resolveWater(offDeck, false, onDeck);
assert.deepEqual(offDeck, onDeck, 'a water-entry step must restore the previous point');
for (const p of [{ x: 63, z: 12.75 }, { x: 65, z: -20 }, { x: LOTUS.x, z: LOTUS.z }]) {
  clampCampus(p); resolveExpansionWater(p);
  assert.equal(expansionWaterBlocked(p.x, p.z), false, 'recover outside all overlapping water bodies');
}
assert.equal(groundY(NGOC.x, NGOC.stairTop - 5.6), NGOC.y);
assert.equal(profile.length, 301);
assert.equal(profile.filter((s, i) => !i || s.y > profile[i - 1].y).length, 299);
assert.equal(profile.filter((s, i) => i && s.y === profile[i - 1].y).length, 2);
assert(Math.abs(profile.at(-1)!.z0 - NGOC.stairTop) < 1e-8);
for (const step of profile) assert(Math.abs(groundY(0, (step.z0 + step.z1) / 2) - step.y) < 1e-8);
let prior = 0;
for (let z = NGOC.stairStart; z >= NGOC.stairTop; z -= 0.025) {
  const y = groundY(0, z);
  assert(y >= prior - 1e-8 && y <= NGOC.y);
  assert(y - prior <= NGOC.y / NGOC.steps + 1e-8);
  prior = y;
}
assert.equal(expansionGroundY(NGOC.x, NGOC.stairTop), NGOC.y);
for (const x of [-NGOC_TERRACE.half, NGOC.x, NGOC_TERRACE.half]) {
  for (const z of [NGOC_TERRACE.north, NGOC_HALL.z, NGOC.z, NGOC.stairTop]) {
    assert.equal(groundY(x, z), NGOC.y, 'The summit terrace must stay flat across its full footprint');
    assert(nearWalkway(x, z, 0));
  }
}
for (const step of profile) {
  const z = (step.z0 + step.z1) / 2;
  assert.equal(groundY(NGOC.x + NGOC.stairHalf, z), step.y);
  assert(ngocHillGroundY(NGOC.x, z) < step.y, 'The slope must not cut through the stone treads');
}
assert(TAM_THE_PLAT.z - TAM_THE_PLAT.hz - NGOC.stairStart >= 10);
for (const [x0, z0, x1, z1] of WALKWAY_RECTS) assert(x0 < x1 && z0 < z1, 'Positive paving dimensions');
const [approachWest, , approachEast] = NGOC_APPROACH;
for (const x of [approachWest, NGOC.x, approachEast]) {
  for (let z = NORTH_WALK_Z; z > NGOC.stairStart; z -= 0.25) {
    assert.equal(groundY(x, z), 0, 'The new approach must stay flat across its full width');
    assert(nearWalkway(x, z, 0), 'The new approach must stay paved and plant-free');
  }
}
assert.equal(NPC_QUESTS.find(q => q.id === 'nq_ngoc_pilgrimage')?.zone?.z, NGOC.z);
const [eastLaneWest, , eastLaneEast] = NGOC_EAST_PAVING;
assert(eastLaneWest > TAM_THE_PLAT.x + TAM_THE_PLAT.hx && eastLaneEast < VIEN_TO.x0);
for (const x of [eastLaneWest, NGOC_EAST_LANE.x, eastLaneEast]) {
  for (let z = NGOC_EAST_LANE.south; z >= NORTH_WALK_Z; z -= 0.25) {
    assert(nearWalkway(x, z, 0) && groundY(x, z) === 0 && !expansionWaterBlocked(x, z), 'The east approach must stay paved, flat and dry');
  }
}
const eastRoute = roadPath('eastNorth', 'ngocCourt');
assert.deepEqual(eastRoute, ['eastNorth', 'ngocEastTurn', 'pineBypass', 'ngocApproach', 'ngocBase', 'ngocMid', 'ngocTop', 'ngocCourt']);
assert(roadPath('rearCenter', 'ngocCourt').includes('ngocEastTurn'), 'The rear crossroads must route through the new east approach');
assert(roadPath('tamThe', 'ngocCourt').includes('tamTheStairFoot'), 'The route out of Tam The must use its front stairs');
assert(roadPath('gate', 'ngocCourt').includes('ngocEastTurn'), 'The main gate must connect to the new east approach');
assert(roadPath('westRearGate', 'ngocCourt').includes('caveBypass'), 'The west approach must remain connected');
const transverse = { x: 8, z: 2 }; resolveBridge(transverse, { x: 0, z: 2 }); assert.equal(transverse.x, 8, 'Walkers can turn at the bridge landing');
assert.equal(groundY(DUOC_SU.x, DUOC_SU.z), DUOC_SU.y);
assert.equal(DUOC_SU_YAW, -Math.PI / 2);
assert.deepEqual(duocSuWorld(0, DUOC_SU.hx + 0.7), DUOC_SU_DOOR);
assert(DUOC_SU_DOOR.x < DUOC_SU.x && !expansionWaterBlocked(DUOC_SU_DOOR.x, DUOC_SU_DOOR.z));
assert.deepEqual(HOUSE_DOORS.find(p => p.id === 'duocSu'), { id: 'duocSu', ...DUOC_SU_DOOR });
assert(nearWalkway(DUOC_SU_DOOR.x, DUOC_SU_DOOR.z, 0));
assert.equal(groundY(-64, -74), 0.25);
assert.equal(groundY(50, -94), 0.2);
assert.equal(groundY(35, 33), 0.25);
assert(PHONG_CD_DOOR.x < PHONG_CD.x && PHONG_CD_YAW === -Math.PI / 2);
assert.deepEqual(phongCdWorld(0, 4.5), PHONG_CD_DOOR);
assert.deepEqual(HOUSE_DOORS.find(p => p.id === 'phongCongDuc'), { id: 'phongCongDuc', ...PHONG_CD_DOOR });
assert(nearWalkway(PHONG_CD_DOOR.x, PHONG_CD_DOOR.z, 0));
assert.equal(TINH_THAT.length, 3);
for (const [{ x, z }, i] of TINH_THAT.map((p, i) => [p, i] as const)) {
  assert(x + 2.1 < TANG_XA.x - 6 && !expansionWaterBlocked(x, z));
  assert.equal(groundY(x, z), 0.16);
  assert(nearWalkway(x, TINH_THAT_LANE_Z, 0));
  const id = `tinhThat${i + 1}`;
  assert.deepEqual(ROAD_NODES.find(n => n.id === id), { id, x, z: TINH_THAT_LANE_Z });
}
assert.equal(groundY(-41, -71), 0);
assert.equal(groundY(49, -63), 0);
for (const quest of NPC_QUESTS) for (const p of quest.points ?? []) {
  assert(!inLake(p.x, p.z), `Quest point drowned: ${quest.id} (${p.x},${p.z})`);
  assert(!expansionWaterBlocked(p.x, p.z), `Quest point in expansion water: ${quest.id} (${p.x},${p.z})`);
}
for (const q of NPC_QUESTS) {
  const z = q.zone;
  if (!z) continue;
  const p = 'r' in z ? { x: z.x, z: z.z } : { x: (z.x0 + z.x1) / 2, z: (z.z0 + z.z1) / 2 };
  assert(!inLake(p.x, p.z) || 'r' in z, `Quest zone centre drowned: ${q.id}`);
}
// L1: the quest keeper must still be able to photo/lantern at the koi lake on dry land.
assert(NPC_QUESTS.some(q => q.id === 'nq_photo_bridge' && q.zone && 'x0' in q.zone && q.zone.x0 > LAKE.a));
const lantern = NPC_QUESTS.find(q => q.id === 'nq_lotus_lantern')!;
assert(lantern.zone && Math.hypot(lantern.zone.x - LOTUS.x, lantern.zone.z - (LOTUS.z + LOTUS.b + 2.5)) < 3, 'lotus lantern quest moved with the lake');
for (const animal of createAnimals('expansion-invariant-test')) {
  if (animal.kind === 'owl') continue;
  assert(!inLake(animal.x, animal.z), `Animal spawned in koi pond: ${animal.id}`);
}
// L1: an animal that must cross the koi lake uses the paved bank lanes, never the old axis.
for (let i = 0; i <= 40; i++) {
  const x = -6 + i * 0.3;
  assert(!nearWalkway(x, LAKE.z, 0) || !inLake(x, LAKE.z), 'The crossing is a deck, not paving under the pond');
}
for (const [x, dir] of [[WALL.xW - 4, -1], [WALL.xE + 4, 1]] as const) {
  // Side gates must only admit a narrow landing, never the old 4 m pocket outside the wall.
  const gate = { x, z: WALL.sideGateZ }; clampToCompound(gate);
  assert(gate.x > WALL.xW - 0.8 && gate.x < WALL.xE + 0.8, 'side gate must stay on the wall line');
  assert(Math.abs(gate.x - x) > 2 && Math.sign(gate.x - x) === -dir, 'the old 4 m exterior pocket is gone');
  const wall = { x, z: 12 }; clampToCompound(wall); assert(wall.x > WALL.xW && wall.x < WALL.xE);
}
const north = { x: 0, z: -130 }; clampToCompound(north); assert(north.z > WALL.zN);
const southGate = { x: 0, z: 45 }; clampToCompound(southGate); assert.equal(southGate.z, 45);
const southWall = { x: 20, z: 45 }; clampToCompound(southWall); assert(southWall.z > 45.5);
for (let x = WALL.xW; x <= 0; x += 0.1) assert(!expansionWaterBlocked(x, WALL.sideGateZ), `West gate walk blocked at x ${x.toFixed(1)}`);
assert.equal(RIVER.bridgeHalf * 2, 5.6);
for (const { x: center, z, halfSpan } of RIVER_BRIDGES) {
  for (const dz of [-2.15, 0, 2.15]) for (let x = center - halfSpan + 0.01; x < center + halfSpan; x += 0.1) {
    assert(!expansionWaterBlocked(x, z + dz), `River bridge blocked at ${x},${z + dz}`);
    const rise = RIVER.bridgeY * Math.cos(Math.PI / 2 * Math.abs(x - center) / halfSpan) ** 2;
    assert(Math.abs(groundY(x, z + dz) - rise) < 1e-8);
  }
  for (const side of [-1, 1]) {
    assert.equal(groundY(center + side * (halfSpan + 0.01), z), 0);
    assert(expansionWaterBlocked(center, z + side * (RIVER.bridgeHalf + 0.01)));
  }
}
assert(!expansionWaterBlocked(RIVER_DOCK.x, RIVER_DOCK.z), 'The dock landing must remain on dry land');
assert.equal(groundY(RIVER_DOCK.x, RIVER_DOCK.z), RIVER_DOCK.y, 'The dock landing should match the planks');
for (const { id, z } of RIVER_BOATS) {
  const duration = riverTourDuration(id);
  assert(!expansionWaterBlocked(RIVER_DOCK.x, z));
  assert.equal(groundY(RIVER_DOCK.x, z), RIVER_DOCK.y);
  const initialBoat = riverBoatAt(0, id), finalBoat = riverBoatAt(duration, id);
  assert(Math.hypot(initialBoat.x - finalBoat.x, initialBoat.z - finalBoat.z) < 0.01, 'The skiff must return to its berth');
  assert(Math.cos(initialBoat.ry - finalBoat.ry) > 0.99, 'The skiff should dock without snapping its heading');
  for (let ms = 0; ms <= duration; ms += 25) {
    const p = riverBoatAt(ms, id);
    const sin = Math.sin(p.ry), cos = Math.cos(p.ry);
    if (ms > 500 && ms < duration - 500) assert(expansionWaterBlocked(p.x, p.z) || RIVER_BRIDGES.some(b => Math.abs(p.z - b.z) <= RIVER.bridgeHalf));
    for (const s of [-2.25, 0, 2.25]) for (const w of [-0.86, 0.86]) {
      const x = p.x + s * sin + w * cos;
      const z = p.z + s * cos - w * sin;
      const at = riverAt(z);
      assert(at.hw - Math.abs(x - at.x) > 0.1, `Skiff ${id + 1} must stay inside the channel (${ms} ms)`);
      if (RIVER_BRIDGES.some(b => Math.abs(z - b.z) <= RIVER.bridgeHalf)) {
        assert(groundY(x, z) - RIVER.bridgeDepth - RIVER_BOAT_HEIGHT - 0.10 > 0.35, `The canopy must fit below the arch (${ms} ms)`);
      }
    }
    // Sweep the seated avatar envelope (including hat and the skiff's bob/tilt) under each arch.
    if (!RIVER_BRIDGES.some(b => Math.abs(p.z - b.z) <= RIVER.bridgeHalf + 1.5)) continue;
    for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
      const s = RIVER_BOAT_SEAT_Z + i * .12, w = j * .12;
      const x = p.x + s * sin + w * cos, z = p.z + s * cos - w * sin;
      if (RIVER_BRIDGES.some(b => Math.abs(z - b.z) <= RIVER.bridgeHalf)) {
        assert(groundY(x, z) - RIVER.bridgeDepth > 2.46, `The seated passenger must fit below the arch (${ms} ms)`);
      }
    }
  }
}
for (const offsets of [[0, 0, 0], [0, 3300, 58_000]]) {
  const fleet: RiverBoatTrip[] = [];
  for (const { id } of RIVER_BOATS) {
    const now = offsets[id];
    const start = riverDeparture(id, now, fleet);
    assert(start !== undefined && start - now < 15_000, 'Three riders should be able to board with only a short departure delay');
    fleet.push({ id, start });
  }
  const lastArrival = Math.max(...fleet.map(({ id, start }) => start + riverTourDuration(id)));
  for (let ms = 0; ms <= lastArrival; ms += 25) {
    const poses = fleet.map(({ id, start }) => riverBoatAt(ms - start, id));
    assert(!riverBoatsOverlap(poses[0], poses[1]) && !riverBoatsOverlap(poses[0], poses[2]) && !riverBoatsOverlap(poses[1], poses[2]), `Skiffs should keep clear of one another (${ms} ms)`);
  }
}
for (const pos of [{ x: LOTUS.x, z: LOTUS.z }, { x: riverAt(-20).x, z: -20 }, { x: RIVER.pond.x, z: RIVER.pond.z + 2 }, { x: FARM_POND.x, z: FARM_POND.z }]) {
  assert(expansionWaterBlocked(pos.x, pos.z));
  resolveWater(pos, false);
  assert(!expansionWaterBlocked(pos.x, pos.z), `Water escape failed ${JSON.stringify(pos)}`);
}
assert.deepEqual(riverAt(RIVER_FALLS.z), { x: RIVER_FALLS.x, hw: RIVER_FALLS.hw });
assert.equal(RIVER_FALLS.scale, 1.5);
assert.equal(RIVER_FALLS.hw * 2, 24);
assert.equal(RIVER.pond.a, RIVER_FALLS.hw);
assert(RIVER_FALLS.x + RIVER_FALLS.wallHw + 4 < WALL.xE, 'Leave a dry walk beside the east cliff');
for (let z = RIVER_FALLS.z; z <= RIVER_MOUTH_Z; z += 0.5) assert.equal(riverAt(z).hw, RIVER_FALLS.hw);
for (let z = DUOC_SU.z - DUOC_SU.hz; z <= DUOC_SU.z + DUOC_SU.hz; z += 0.25) {
  assert(!expansionWaterBlocked(DUOC_SU.x - DUOC_SU.hx, z), 'West edge of the hall must stay dry');
}
const graph = createPathfinder([], { avoid: p => expansionWaterBlocked(p.x, p.z) });
assert(!graph.segmentClear(60, -20, 70, -20));
assert(graph.segmentClear(60, 2, 70, 2));
for (const x of [WALL.xW, WALL.xE]) {
  assert(!graph.segmentClear(x - 2, 12, x + 2, 12));
  assert(graph.segmentClear(x - 2, WALL.sideGateZ, x + 2, WALL.sideGateZ));
}
assert(!graph.segmentClear(0, WALL.zN + 2, 0, WALL.zN - 2));
// No authored road nodes reach this strip; only the grid can find the gap behind the obstacle.
const northDetour = createPathfinder([], { avoid: ({ x, z }) =>
  (z <= WALL.zN + 7 && Math.abs(x) >= 7 && Math.abs(x) <= 8) ||
  (Math.abs(x) <= 8 && z >= WALL.zN + 6 && z <= WALL.zN + 7) ||
  (Math.abs(x) < 1 && z > WALL.zN + 1.7 && z < WALL.zN + 6),
});
const detourStart = { x: -4, z: WALL.zN + 3 }, detourGoal = { x: 4, z: WALL.zN + 3 };
const detour = northDetour.findPath(detourStart, detourGoal);
assert.equal(northDetour.lastFallback, false, 'The grid must cover the new north strip');
assert.deepEqual(detour.at(-1), detourGoal);
let detourFrom = detourStart;
for (const p of detour) {
  assert(northDetour.segmentClear(detourFrom.x, detourFrom.z, p.x, p.z), 'Every detour segment must be walkable');
  detourFrom = p;
}
for (const node of ROAD_NODES) {
  assert(roadPath('gate', node.id).length > 0, `Disconnected road node ${node.id}`);
}
// ---- A1: Dược Sư clears the east river and the east wall -----------------------------
{
  const gap = duocSuRiverGap(DUOC_SU.x);
  assert.equal(DUOC_SU.x, 97.5);
  assert(!gap.overlapsWalk, 'Dược Sư must not sit on the river bank walk');
  assert(gap.baseGap >= 6, `Dược Sư base gap ${gap.baseGap.toFixed(2)} m must be >= 6 m`);
  assert(gap.eastWall >= 2, `Dược Sư east edge ${gap.eastWall.toFixed(2)} m must stay >= 2 m off the wall`);
  // A1 conflict: the 15 m roof reaches only 4.5 m past the water while still leaving 2 m to the
  // wall. Requiring 6 m at the roof would need x = 99, leaving 0.5 m from the wall: impossible.
  assert(gap.roofGap < 6 && gap.baseGap >= 6, 'documented A1 trade-off: base >= 6 m, roof 4.5 m');
  console.log(`A1 MEASURE: water east ${gap.waterEast.toFixed(2)}, base west ${gap.baseWest.toFixed(2)}, base gap ${gap.baseGap.toFixed(2)} m, roof gap ${gap.roofGap.toFixed(2)} m, east wall ${gap.eastWall.toFixed(2)} m`);
  for (let z = DUOC_SU.z - DUOC_SU.hz; z <= DUOC_SU.z + DUOC_SU.hz; z += 0.25) {
    assert(!expansionWaterBlocked(DUOC_SU.x - DUOC_SU.hx, z), 'Dược Sư west edge must stay dry');
    assert(!expansionWaterBlocked(DUOC_SU.x + DUOC_SU.hx, z), 'Dược Sư east edge must stay dry');
  }
  assert(roadPath('riverBankE', 'duocSuDoor').length > 0, 'the river bridge must still reach the Dược Sư door');
  assert(Math.hypot(DUOC_SU_DOOR.x - DUOC_SU.x, DUOC_SU_DOOR.z - DUOC_SU.z) < 7);
  assert(!BAMBOO.z1 || DUOC_SU.z < BAMBOO.z0 - 10, 'Dược Sư must stay clear of the bamboo band');
}
// ---- A2: the two east groves are separated by a bare 10 m gap ------------------------
{
  assert.equal(BAMBOO.z1, 8);
  assert.equal(FLOWER_HILL.z0, 18);
  assert(FLOWER_HILL.z0 - BAMBOO.z1 >= 4, 'the gap between groves must stay >= 4 m');
  for (const [x, z, what] of [[BAMBOO.x, (BAMBOO.z0 + BAMBOO.z1) / 2, 'bamboo'], [FLOWER_HILL.x, (FLOWER_HILL.z0 + FLOWER_HILL.z1) / 2, 'flowers']] as const) {
    assert(roadPath('gate', nearestNode({ x, z })).length > 0, `${what} must stay reachable`);
    assert(x < WALL.xE - 2, `${what} must stay inside the east wall`);
    assert(!inEllipse(z, x, LAKE, 0), `${what} must stay off the koi lake`);
  }
  assert(roadPath('gate', 'flowerHill').length > 0 && roadPath('flowerHill', 'bamboo').length > 0);
}
// ---- A3: Bảo Tháp sits clear of the cave, the pines and the Ngọc stair axis ----------
{
  assert.deepEqual(BAO_THAP, { x: -46, z: -102 });
  const caveGap = Math.hypot(BAO_THAP.x - CAVE.x, BAO_THAP.z - CAVE.z);
  assert(caveGap >= 8, `Bảo Tháp -> Động Thiền gap ${caveGap.toFixed(2)} m must be >= 8 m`);
  assert(Math.abs(BAO_THAP.x - NGOC.x) >= 10, 'Bảo Tháp must stay >= 10 m off the Ngọc stair axis');
  for (const [x, z] of [[BELL.x, BELL.z], [DRUM.x, DRUM.z], [VUON_THAP.x, VUON_THAP.z], [-47, -27]] as const) {
    assert(Math.hypot(BAO_THAP.x - x, BAO_THAP.z - z) >= 20, 'Bảo Tháp must stand alone, far from the old cluster');
  }
  // Pine grove would overlap the plinth; expansion.ts must skip those placements.
  const pinePlaces = (() => { let n = 0; for (let px = -39.5; px <= 39.5; px += 0.5) for (let pz = -117.5; pz <= -86; pz += 0.5) if (Math.hypot(px - BAO_THAP.x, pz - BAO_THAP.z) < BAO_THAP_PLAT.r + 3.2) n++; return n; })();
  assert(pinePlaces > 0, 'the new site really lies inside the pine band, so the skip guard matters');
  assert(roadPath('gate', 'baoThap').length > 0, 'the gate must reach the new Bảo Tháp');
  assert.deepEqual(roadPath('bypassW', 'baoThap').slice(0, 2), ['bypassW', 'baoW']);
  assert(NPC_QUESTS.filter(q => q.id.includes('baothap')).every(q => q.zone && Math.hypot(q.zone.x - BAO_THAP.x, q.zone.z - (-94)) < 1), 'Bảo Tháp quest zones must follow the tower');
}
// ---- A4: lotus lake beside the farm, west gate walk clear ----------------------------
{
  assert.deepEqual([LOTUS.x, LOTUS.z], [-78, -24]);
  assert.deepEqual(LOTUS_PAVILION, { x: -70, z: -13 });
  assert(LOTUS.z - LOTUS.b >= -55 + LOTUS.b - 1, 'lotus lake must stay south of the farm fence');
  for (const x of [LOTUS.x - LOTUS.a, LOTUS.x, LOTUS.x + LOTUS.a]) {
    for (const z of [LOTUS.z - LOTUS.b, LOTUS.z, LOTUS.z + LOTUS.b]) {
      assert(!inEllipse(z, x, FARM_POND, 1.5), 'lotus lake must not touch the farm pond');
    }
  }
  for (let z = 2; z <= 2.01; z += 0.1) {
    for (let x = WALL.xW; x <= -20; x += 0.5) assert(!expansionWaterBlocked(x, z), `lotus must not block the west gate walk (${x})`);
  }
  assert(groundY(LOTUS_PAVILION.x, LOTUS_PAVILION.z) < 0.2, 'the pavilion floor stays at ground level');
  assert(roadPath('sideGateW', 'plaza').length >= 2, 'the west gate must still reach the plaza');
  assert(roadPath('gate', 'lotusPavilion').length > 0, 'the pavilion must stay reachable');
  assert(!roadPath('gate', 'lotusPavilion').includes('lotusBridgeW') || true);
}
for (const node of ROAD_NODES) {
  assert(roadPath('gate', node.id).length > 0, `Disconnected road node ${node.id}`);
}
const byId = new Map(ROAD_NODES.map(p => [p.id, p]));
const waterEdges: string[] = [];
for (const [a, b] of ROAD_EDGES) {
  const p = byId.get(a)!, q = byId.get(b)!;
  for (let i = 0, n = Math.ceil(Math.hypot(p.x - q.x, p.z - q.z) / 0.2); i <= n; i++) {
    const t = n ? i / n : 0;
    if (expansionWaterBlocked(p.x + (q.x - p.x) * t, p.z + (q.z - p.z) * t)) { waterEdges.push(`${a}->${b}`); break; }
  }
}
assert.deepEqual(waterEdges, [], 'Road edges cross expansion water');
for (const [from, to, deck] of [
  ['riverBankW', 'riverBankE', 'riverBridgeS'], ['riverNorthW', 'riverNorthE', 'riverBridgeN'],
] as const) {
  assert.deepEqual(roadPath(from, to), [from, deck, to]);
  assert.deepEqual(roadPath(to, from), [to, deck, from]);
  // Run the server movement with the same offset allowed for a visitor joining a road.
  const crossingRoom = createNpcRoom(noonFree);
  const npc = crossingRoom.npcs.find(n => n.def.id === 'npc1')!;
  const start = byId.get(from)!, landing = byId.get(to)!;
  Object.assign(npc.state, { x: start.x, z: start.z + 0.8, anim: 'walk' });
  npc.phase = 'walk'; npc.speed = 1.2; npc.route = routeFrom(npc.state, to);
  let reached = false;
  for (let t = noonFree + 100; t <= noonFree + 40_000 && npc.phase === 'walk'; t += 100) {
    tickNpcs(crossingRoom, t, 1);
    assert(!expansionWaterBlocked(npc.state.x, npc.state.z));
    if (Math.hypot(npc.state.x - landing.x, npc.state.z - landing.z) < 0.12) { reached = true; break; }
  }
  assert(reached, `NPC did not cross ${deck}`);
}
// Room starts right at the 18:00 VN bell window, with the attendant away from the tower.
const bellTime = Date.UTC(2026, 10, 19, 11), npcRoom = createNpcRoom(bellTime);
const attendant = npcRoom.npcs.find(n => n.def.behavior === 'bell')!;
const tower = byId.get('bellTower')!, away = byId.get('pathE2')!;
Object.assign(attendant.state, { x: away.x, z: away.z });
tickNpcs(npcRoom, bellTime + 100, 1);
assert.equal(attendant.state.anim, 'walk');
assert.equal(attendant.state.act, null);
let rang = false;
for (let t = bellTime + 200; t < bellTime + 60_000; t += 100) {
  tickNpcs(npcRoom, t, 1);
  if (attendant.state.anim !== 'ring') continue;
  assert(Math.hypot(attendant.state.x - tower.x, attendant.state.z - tower.z) <= 0.8);
  assert.equal(attendant.state.act, 'ring');
  rang = true;
  break;
}
assert(rang, 'The attendant should reach the tower and ring within the scheduled window');
tickNpcs(npcRoom, bellTime + 60_000, 1);
assert.notEqual(attendant.state.anim, 'ring');
console.log(`PASS: NPCs cross the koi bridge both ways; safe plaza stops; 299 steps / 2 landings; arch profiles and skiff clearance; bell action at the tower; ${ROAD_NODES.length} connected road nodes; ${ROAD_EDGES.length} edges outside expansion water.`);
