// M1 focused harness: does a visitor's ngoc tour run Approach -> Base -> Mid -> Top -> Court,
// and what are the exact x/z/y the client renders at each stop?
import { ROAD_NODES, ROAD_EDGES } from '../shared/roads.ts';
import { createNpcRoom, tickNpcs } from '../server/npcs.ts';
import { NGOC, expansionWaterBlocked } from '../shared/campus.ts';
import { groundY, inLake, clampToCompound } from '../src/layout.ts';

const CHAIN = ['ngocApproach', 'ngocBase', 'ngocMid', 'ngocTop', 'ngocCourt'];
const NODE = Object.fromEntries(ROAD_NODES.map((n) => [n.id, n]));
const near = (p, n) => Math.hypot(p.x - n.x, p.z - n.z) < 0.6;
let fail = 0;
const check = (name, ok, detail = '') => {
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};

for (let i = 1; i < CHAIN.length; i++) {
  check(`edge ${CHAIN[i - 1]}--${CHAIN[i]}`, ROAD_EDGES.some(([a, b]) =>
    (a === CHAIN[i - 1] && b === CHAIN[i]) || (b === CHAIN[i - 1] && a === CHAIN[i])));
}
const ys = CHAIN.map((id) => groundY(NODE[id].x, NODE[id].z));
check('client elevation along the chain', ys[0] < 0.1 && ys[1] < 0.1 && ys[2] > 3 && ys[3] > 8 && ys[4] > 8,
  CHAIN.map((id, i) => `${id}=${groundY(NODE[id].x, NODE[id].z).toFixed(2)}`).join(' '));
let badStep = 0;
for (let z = NGOC.stairStart; z >= NGOC.z; z -= 0.25) {
  const p = { x: NGOC.x, z }, q = { ...p };
  clampToCompound(q);
  if (inLake(q.x, q.z) || expansionWaterBlocked(q.x, q.z) || q.x !== p.x || q.z !== p.z) badStep++;
}
check('server step gate accepts the Ngoc axis', badStep === 0, `${badStep} bad samples`);

// Real room, many opening hours: which visitors pick 'ngoc' and do they finish the chain?
const runs = [];
for (const hour of [0, 3, 6, 9, 12, 15, 18, 21]) {
  const base = Date.UTC(2026, 10, 19, hour, 0, 0);
  const room = createNpcRoom(base);
  const tours = new Map();
  for (let t = base; t < base + 5 * 3600_000; t += 100) {
    const before = new Map(room.npcs.map((n) => [n.def.id, n.route.length]));
    tickNpcs(room, t, 3);
    for (const n of room.npcs) {
      const st = n.tourStops[n.tourIdx];
      if (!st || st.kind !== 'ngoc' || (n.stage !== 'toStroll' && n.stage !== 'stroll')) continue;
      let r = tours.get(n.def.id);
      if (!r) { r = { visited: new Set(), aborts: 0, end: null, stopXZ: null }; tours.set(n.def.id, r); }
      if (before.get(n.def.id) > 0 && n.route.length === 0 && n.phase === 'idle') r.aborts++;
      for (const id of CHAIN) if (near(n.state, NODE[id])) r.visited.add(id);
      if (n.stage === 'stroll' && near(n.state, NODE.ngocCourt)) r.stopXZ = { x: n.state.x, z: n.state.z };
      r.end = n.state;
    }
  }
  runs.push({ hour, tours });
}

const all = [];
for (const { hour, tours } of runs) {
  for (const [id, r] of tours) all.push({ hour, id, ...r });
}
check('visitors tour Ngoc in the real room', all.length > 0, `${all.length} tours across 8x5h windows`);
const incomplete = all.filter((r) => CHAIN.some((c) => !r.visited.has(c)));
check('every Ngoc tour visits all 5 stops', incomplete.length === 0,
  incomplete.length
    ? incomplete.slice(0, 3).map((r) => `${r.id}@${r.hour}h missing ${CHAIN.filter((c) => !r.visited.has(c)).join(',')}`).join(' | ')
    : `${all.length}/${all.length} complete`);
const withAborts = all.filter((r) => r.aborts > 0);
check('no route abort on a Ngoc tour', withAborts.length === 0,
  withAborts.length ? withAborts.slice(0, 3).map((r) => `${r.id}@${r.hour}h=${r.aborts}`).join(' ') : '0 aborts');

const n19 = all.filter((r) => r.id === 'npc19');
check('npc19 specifically tours Ngoc', n19.length > 0, n19.length
  ? n19.map((r) => `@${r.hour}h visited=${[...r.visited].join('>')} stop=(${r.stopXZ?.x.toFixed(2)},${r.stopXZ?.z.toFixed(2)}) y=${groundY(r.stopXZ?.x ?? 0, r.stopXZ?.z ?? 0).toFixed(2)}`).join(' | ')
  : 'never in 40 h');

console.log(fail ? `\n=== ${fail} FAIL ===` : '\n=== ALL PASS ===');
process.exitCode = fail ? 1 : 0;
