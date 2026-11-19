import assert from 'node:assert/strict';
import { WALL, LAKE, BRIDGE, NGOC, NGOC_HALL, NGOC_TERRACE, NORTH_WALK_Z, RIVER, RIVER_BRIDGES, RIVER_FALLS, RIVER_MOUTH_Z, riverAt, DUOC_SU, DUOC_SU_DOOR, DUOC_SU_YAW, duocSuWorld, PHONG_CD, PHONG_CD_DOOR, PHONG_CD_YAW, TINH_THAT, TINH_THAT_LANE_Z, phongCdWorld, expansionGroundY, expansionWaterBlocked, ngocHillGroundY, ngocStepProfile, resolveExpansionWater, clampCampus } from '../shared/campus';
import { MAP_HALF, MAP_Z_MIN, MAP_Z_MAX } from '../shared/types';
import { clampToCompound, resolveBridge, resolveWater, groundY, nearWalkway, NGOC_APPROACH, WALKWAY_RECTS, TAM_THE_PLAT, BELL, DRUM, BAO_THAP, TANG_XA, VUON_THAP } from '../src/layout';
import { HOUSE_DOORS, ROAD_NODES, ROAD_EDGES, roadPath } from '../shared/roads';
import { createPathfinder } from '../shared/pathfind';
import { NPC_QUESTS } from '../shared/game';
import { createAnimals } from '../server/animals';
import { buildPondLotus } from '../src/pond-lotus';

const lotus = buildPondLotus(LAKE.a, LAKE.b, 0.14, 32, 8113, (x, _z, radius) => Math.abs(x) > BRIDGE.hw + radius);
assert.equal(lotus.children.length, 3);
for (const part of lotus.children) {
  assert(part.type === 'Mesh' && 'count' in part && Number(part.count) > 0, 'All lotus stages are instanced');
  assert('boundingSphere' in part && part.boundingSphere, 'Each lotus stage has bounds');
}

assert.deepEqual([WALL.xW, WALL.zN, WALL.zS], [-92, -130, 45]);
assert(MAP_HALF > Math.max(-WALL.xW, WALL.xE) && MAP_Z_MIN <= WALL.zN && MAP_Z_MAX >= 58);
assert.deepEqual([BELL.x, DRUM.x, BAO_THAP.x, BAO_THAP.z], [34, -34, -34, -15]);
assert.deepEqual(TANG_XA, { x: -64, z: -74 });
assert.deepEqual(VUON_THAP, { x: 50, z: -94 });
assert.deepEqual([LAKE.z, LAKE.a, LAKE.b, BRIDGE.z0, BRIDGE.z1], [14, 14, 10, 2, 26]);
assert.equal(BRIDGE.hw * 2, 4.6);
for (const side of [-1, 1]) {
  const x = BRIDGE.x + side * (BRIDGE.hw - 0.3);
  const prev = { x, z: LAKE.z - 0.1 }, step = { x, z: LAKE.z };
  resolveWater(step, resolveBridge(step, prev), prev);
  assert.deepEqual(step, { x, z: LAKE.z }, 'the widened deck stays walkable close to either rail');
  assert.equal(groundY(x, LAKE.z), groundY(BRIDGE.x, LAKE.z));
  assert(nearWalkway(x, BRIDGE.z0, 0) && nearWalkway(x, BRIDGE.z1 + 0.5, 0));
  const overRail = { x: BRIDGE.x + side * (BRIDGE.hw + 0.05), z: LAKE.z };
  assert(resolveBridge(overRail, step));
  assert(Math.abs(overRail.x - BRIDGE.x) < BRIDGE.hw, 'the new rail still keeps walkers on the deck');
}
const profile = ngocStepProfile();
assert.equal(NGOC.y, 8.4);
const offDeck = { x: -78, z: 2.91 }, onDeck = { x: -78, z: 2.89 };
resolveWater(offDeck, false, onDeck);
assert.deepEqual(offDeck, onDeck, 'a water-entry step must restore the previous point');
for (const p of [{ x: 63, z: 12.75 }, { x: 65, z: -20 }, { x: -78, z: -5 }]) {
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
const transverse = { x: 8, z: 2 }; resolveBridge(transverse, { x: 0, z: 2 }); assert.equal(transverse.x, 8);
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
  const onBridge = Math.abs(p.x - BRIDGE.x) < BRIDGE.hw && p.z >= BRIDGE.z0 && p.z <= BRIDGE.z1;
  const inKoi = ((p.x - LAKE.x) / LAKE.a) ** 2 + ((p.z - LAKE.z) / LAKE.b) ** 2 < 1;
  assert(!inKoi || onBridge, `Quest point drowned: ${quest.id}`);
}
for (const animal of createAnimals('expansion-invariant-test')) {
  if (animal.kind === 'owl') continue;
  const onBridge = Math.abs(animal.x) < BRIDGE.hw && animal.z >= BRIDGE.z0 && animal.z <= BRIDGE.z1;
  assert(!(((animal.x - LAKE.x) / LAKE.a) ** 2 + ((animal.z - LAKE.z) / LAKE.b) ** 2 < 1) || onBridge, `Animal spawned in koi pond: ${animal.id}`);
}
for (const x of [WALL.xW - 4, WALL.xE + 4]) {
  const gate = { x, z: WALL.sideGateZ }; clampToCompound(gate); assert.equal(gate.x, x);
  const wall = { x, z: 12 }; clampToCompound(wall); assert(wall.x > WALL.xW && wall.x < WALL.xE);
}
const north = { x: 0, z: -130 }; clampToCompound(north); assert(north.z > WALL.zN);
const southGate = { x: 0, z: 45 }; clampToCompound(southGate); assert.equal(southGate.z, 45);
const southWall = { x: 20, z: 45 }; clampToCompound(southWall); assert(southWall.z > 45.5);
for (let x = -95; x <= -60; x += 0.1) assert(!expansionWaterBlocked(x, 2), `Lotus bridge blocked at ${x}`);
for (const { x: center, z, halfSpan } of RIVER_BRIDGES) for (let x = center - halfSpan + 0.01; x < center + halfSpan; x += 0.1) {
  assert(!expansionWaterBlocked(x, z), `River bridge blocked at ${x},${z}`);
  assert.equal(groundY(x, z), RIVER.bridgeY);
}
for (const pos of [{ x: -78, z: -2 }, { x: riverAt(-20).x, z: -20 }, { x: RIVER.pond.x, z: RIVER.pond.z + 2 }, { x: -70, z: -35 }]) {
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
console.log(`PASS: 299 steps / 2 landings; height alignment; wall/gate crossings; water escapes; ${ROAD_NODES.length} connected road nodes; ${ROAD_EDGES.length} edges outside expansion water.`);
