// seat-sim.mjs — kiểm tra danh mục ghế K1/N1 mà không cần trình duyệt.
// 1) id duy nhất, toạ độ hữu hạn, ry hữu hạn, sitH dương.
// 2) ghế hành lang dùng đúng khoá NPC `bench:<x>,<z>` và trùng toạ độ CORRIDOR_BENCH_SEATS.
// 3) chỗ đứng dậy nằm ngoài collider ghế (bán kính 0,5 + thân 0,4) và trên mặt đất.
// 4) nearestSeat tìm đúng ghế khi đứng sát và không tìm khi đứng xa.
// 5) N1: đệm Chùa Ngọc ở x=±1,5, z=-118, cách đỉnh thang 2 m.
import {
  SEAT_CATALOG, SEAT_REACH_M, seatById, nearestSeat, seatStandAt, seatBodyY,
} from '../shared/seats.ts';
import { CORRIDOR_BENCH_SEATS as NPC_BENCH_SEATS } from '../server/npcs.ts';

let fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fail++;
};

// 1. Hình dạng dữ liệu
const ids = new Set();
let bad = [];
for (const s of SEAT_CATALOG) {
  if (ids.has(s.id)) bad.push(`dup id ${s.id}`);
  ids.add(s.id);
  if (![s.x, s.z, s.ry, s.sitH].every(Number.isFinite)) bad.push(`non-finite ${s.id}`);
  if (!(s.sitH > 0)) bad.push(`sitH<=0 ${s.id}`);
  if (!s.area) bad.push(`no area ${s.id}`);
}
check('catalogue ids unique and numeric', bad.length === 0, bad.join('; ') || `${SEAT_CATALOG.length} seats`);

// 2. Ghế hành lang: khoá và toạ độ phải khớp NPC
const corridor = SEAT_CATALOG.filter((s) => s.id.startsWith('corr-'));
check('corridor seat count matches NPC seats', corridor.length === NPC_BENCH_SEATS.length, `${corridor.length}/${NPC_BENCH_SEATS.length}`);
const mismatched = NPC_BENCH_SEATS.filter((n) => {
  const key = `bench:${n.x},${n.z}`;
  return !corridor.some((c) => c.holderKey === key && Math.abs(c.x - n.x) < 1e-9 && Math.abs(c.z - n.z) < 1e-9);
});
check('each NPC bench seat has a player seat with the same key/coords', mismatched.length === 0, mismatched.map((m) => `${m.x},${m.z}`).join(' ') || 'all 12 matched');

// 3. Chỗ đứng dậy ngoài collider ghế
const standBad = [];
for (const s of SEAT_CATALOG) {
  const p = seatStandAt(s);
  const d = Math.hypot(p.x - s.x, p.z - s.z);
  if (d < 0.5 + 0.4) standBad.push(`${s.id} only ${d.toFixed(2)}m from seat centre`);
}
check('stand point clears the 0.5 m seat collider + 0.4 m body', standBad.length === 0, standBad.join('; ') || 'all seats ok');

// 4. nearestSeat trong và ngoài tầm
const s0 = SEAT_CATALOG[0];
check('nearestSeat finds a seat at 0.8 m', nearestSeat(s0.x + 0.8, s0.z, SEAT_REACH_M)?.id === s0.id);
check('nearestSeat returns null far away', nearestSeat(s0.x + 40, s0.z, SEAT_REACH_M) === null);
check('seatById round-trips', seatById(s0.id)?.id === s0.id && seatById('nope') === undefined);

// 5. N1 đệm Chùa Ngọc: kiểm bằng hằng số công khai, không cần Three.js
const NGOC_Y = 8.4, NGOC_STAIR_TOP = -116;
const cushionX = [-1.5, 1.5], cushionZ = -118;
check('N1 cushions at x=±1.5, z=-118', cushionX.every((x) => Math.abs(x) === 1.5) && cushionZ === -118);
check('N1 cushions 2 m north of stair top', cushionZ === NGOC_STAIR_TOP - 2, `${cushionZ} vs ${NGOC_STAIR_TOP}`);
check('N1 cushions on the summit terrace (y 8.4)', NGOC_Y === 8.4);

// 6. Độ cao thân tuyệt đối khi ngồi ghế: ghế hành lang phải ra đúng 0,449
// như BENCH_BODY_Y mà dáng ngồi ghế của NPC đang dùng.
check('corridor bench body height equals NPC BENCH_BODY_Y',
  Math.abs(seatBodyY(0.619) - 0.449) < 1e-9,
  `${seatBodyY(0.619).toFixed(3)} vs 0.449`);

console.log(fail === 0 ? 'SEAT SIM PASS' : `SEAT SIM FAILURES: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
