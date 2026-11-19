// I1 harness: guest-house beds + occupancy + NPC lie poses + aisle collision.
import assert from 'node:assert/strict';
import { GUEST_BEDS, GUEST_BED_SIZE, GUEST_MATTRESS_TOP, GUEST_DOOR_IN, GUEST_HOUSE, guestBedColliders } from '../src/guest-beds.ts';
import { NHA_KHACH, NHA_KHACH_PLAT } from '../src/layout.ts';
import { createNpcRoom, tickNpcs } from '../server/npcs.ts';
import { ROAD_NODES } from '../shared/roads.ts';

let fail = 0;
const check = (name, ok, detail = '') => {
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};

check('4 guest beds', GUEST_BEDS.length === 4, `${GUEST_BEDS.length} beds`);
check('2 beds each side', [1, -1].every(side => GUEST_BEDS.filter(b => Math.sign(b.x - NHA_KHACH.x) === side).length === 2));
check('head north', GUEST_BEDS.every(b => b.ry === 0));
check('bed size 2.0 x 0.9', GUEST_BED_SIZE.d === 2 && GUEST_BED_SIZE.w === 0.9,
  `${GUEST_BED_SIZE.d} x ${GUEST_BED_SIZE.w}`);
check('inside guest house', GUEST_BEDS.every(b =>
  Math.abs(b.x - NHA_KHACH.x) + GUEST_BED_SIZE.w / 2 < GUEST_HOUSE.hx &&
  Math.abs(b.z - NHA_KHACH.z) + GUEST_BED_SIZE.d / 2 < GUEST_HOUSE.hz),
  GUEST_BEDS.map(b => `(${b.x.toFixed(1)},${b.z.toFixed(1)})`).join(' '));

// Colliders: beds + tea table + bench must not block the centre aisle or the door path.
const obstacles = guestBedColliders().concat([
  { x: NHA_KHACH.x, z: NHA_KHACH.z + -1.6, r: 0.9 },
  { x: NHA_KHACH.x + (-GUEST_HOUSE.hx + 0.35), z: NHA_KHACH.z + 0.6, r: 0.5 },
]);
const blocked = (x, z, radius = 0.4, includeTable = true) => obstacles
  .filter(c => includeTable || Math.hypot(c.x - NHA_KHACH.x, c.z - (NHA_KHACH.z - 1.6)) > 0.01)
  .some(c => Math.hypot(x - c.x, z - c.z) < c.r + radius);
let aisleBlocked = 0;
for (let z = NHA_KHACH.z + 0.4; z < NHA_KHACH.z + GUEST_HOUSE.hz - 0.5; z += 0.25) {
  if (blocked(NHA_KHACH.x, z, 0.4, false)) aisleBlocked++;
}
check('centre aisle clear', aisleBlocked === 0, `${aisleBlocked} blocked samples`);
// Lối từ cửa (phía Nam) tới giường phải đi vòng qua bàn trà, không xuyên qua bàn.
let doorPathBlocked = 0;
const doorLaneX = NHA_KHACH.x - 2.0;
for (let z = GUEST_DOOR_IN.z; z > NHA_KHACH.z + 1; z -= 0.25) {
  if (blocked(doorLaneX, z)) doorPathBlocked++;
}
check('door-to-aisle path clear', doorPathBlocked === 0, `${doorPathBlocked} blocked samples`);
// Từ lối đi giữa bước ngang tới giường (bỏ qua chính collider của giường đó, vì NPC nằm lên giường).
let sideApproachBlocked = 0;
for (const bed of GUEST_BEDS) {
  const other = obstacles.filter(c => !(Math.abs(c.x - bed.x) < 0.01 && Math.abs(c.z - bed.z) < 1));
  const from = bed.standX, to = bed.x;
  const step = Math.sign(to - from) * 0.1;
  for (let x = from; Math.abs(x - to) > 0.01; x += step) {
    if (other.some(c => Math.hypot(x - c.x, bed.z - c.z) < c.r + 0.35)) sideApproachBlocked++;
  }
}
check('bed-side approach clear', sideApproachBlocked === 0, `${sideApproachBlocked} blocked samples`);
check('derived Mattress top matches construction', Math.abs(GUEST_MATTRESS_TOP - (GUEST_BED_SIZE.frameH + GUEST_BED_SIZE.matH)) < 1e-9,
  `${GUEST_MATTRESS_TOP}`);

// Live room: force visitors onto guest beds, verify exclusive occupancy and lie pose.
const base = Date.UTC(2026, 10, 19, 2, 0, 0);
const room = createNpcRoom(base);
const visitors = room.npcs.filter(n => n.def.behavior === 'visitor').slice(0, 4);
for (const n of visitors) n.guestBedId = null;
// Use the same transition function as the real scene: seatChant -> guest rest.
for (const n of visitors) {
  n.stage = 'seatChant'; n.mode = 'seatChant'; n.phase = 'act'; n.until = base;
  n.state.x = ROAD_NODES.find(r => r.id === 'ktMid').x; n.state.z = ROAD_NODES.find(r => r.id === 'ktMid').z;
}
let rests = 0, duplicateHolders = 0, badPose = 0, maxSimultaneous = 0, released = 0;
const prevGuestId = new Map();
for (let t = base; t < base + 40 * 60_000; t += 100) {
  tickNpcs(room, t, 3);
  for (const n of room.npcs) {
    if (prevGuestId.get(n.def.id) !== null && n.guestBedId === null) released++;
    prevGuestId.set(n.def.id, n.guestBedId);
  }
  const holders = room.guestBeds.filter(x => x !== null);
  if (new Set(holders).size !== holders.length) duplicateHolders++;
  for (const n of room.npcs) {
    if (n.guestBedId !== null && room.guestBeds[n.guestBedId] !== n.def.id) duplicateHolders++;
    if (n.mode === 'guestRest') {
      const bed = GUEST_BEDS[n.guestBedId];
      if (!bed || n.state.anim !== 'lie' || n.state.ry !== 0 ||
          Math.hypot(n.state.x - bed.x, n.state.z - bed.z) > 0.01) badPose++;
      rests++;
    }
  }
  maxSimultaneous = Math.max(maxSimultaneous, holders.length);
}
check('visitors actually sleep in guest beds', rests > 0, `${rests} lie samples, max simultaneous ${maxSimultaneous}`);
check('never two visitors on one bed', duplicateHolders === 0, `${duplicateHolders} violations`);
check('sleep pose correct', badPose === 0, `${badPose} bad samples`);
check('beds always end in a wake (last holder rests then releases)',
  room.guestBeds.every((holder, i) => holder === null || room.npcs.some(n => n.def.id === holder && (n.mode === 'guestRest' || n.mode === 'toGuestBed'))),
  JSON.stringify(room.guestBeds));
check('a wake release happened during the run', released > 0, `${released} wake transitions`);
console.log(fail ? `\n=== ${fail} FAIL ===` : '\n=== ALL PASS ===');
process.exitCode = fail ? 1 : 0;
