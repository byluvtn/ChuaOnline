import { ROAD_NODES } from '../shared/roads.ts';
import { createNpcRoom, tickNpcs } from '../server/npcs.ts';

const SCENARIOS = {
  a: { name: 'A: dawn session + closing line', base: Date.UTC(2026, 10, 12, 21, 50), mins: 45 },
  // The spec's base is 2026-11-12 10:50 UTC. Only the time of day (VN 17:50) matters here.
  b: { name: 'B: 18:00 bell', base: Date.UTC(2026, 10, 12, 10, 50), mins: 25 },
  c: { name: 'C: rest cycle', base: Date.UTC(2026, 10, 13, 2, 0), mins: 40 },
};

const BELL_TOWER = { x: -34, z: -6 };
const BED_X = [-44, -38];
/** Where each rest-pool NPC returns after waking — must match server/npcs.ts HOME_NODE. */
const HOME_NODE = { npc2: 'plaza', npc3: 'bridgeS', npc7: 'zenGarden', npc8: 'rearKT', npc4: 'bellTower' };
const NODE_BY_ID = Object.fromEntries(ROAD_NODES.map((n) => [n.id, n]));
const BED_Z = -73.05;
const REST_POOL = ['npc2', 'npc3', 'npc4', 'npc7', 'npc8'];
const VISITORS = ['npc5', 'npc9', 'npc10', 'npc11', 'npc12'];
const LOG_CAP = 400;

const fmt = (t) => new Date(t + 7 * 3600_000).toISOString().slice(11, 19) + ' VN';
const fmtFull = (t) => new Date(t + 7 * 3600_000).toISOString().slice(0, 19).replace('T', ' ') + ' VN';
const dist = (x1, z1, x2, z2) => Math.hypot(x1 - x2, z1 - z2);
const pos = (n) => `(${n.state.x.toFixed(1)},${n.state.z.toFixed(1)})`;

function runScenario(key) {
  const sc = SCENARIOS[key];
  const { base } = sc;
  const end = base + sc.mins * 60_000;
  const offset = process.env.NPC_CLOCK_OFFSET_MIN ?? '0';
  console.log(`\n##### Scenario ${sc.name}`);
  console.log(`start ${fmtFull(base)}  end ${fmtFull(end)}  NPC_CLOCK_OFFSET_MIN=${offset}`);

  const room = createNpcRoom(base);

  // t=0 checks
  const ids = room.npcs.map((n) => n.def.id);
  const names = room.npcs.map((n) => n.def.name);
  const expectedIds = Array.from({ length: 12 }, (_, i) => `npc${i + 1}`);
  const rosterOk =
    room.npcs.length === 12 &&
    expectedIds.every((id) => ids.includes(id)) &&
    new Set(names).size === names.length;
  const n2 = room.npcs.find((n) => n.def.id === 'npc2');
  const n3 = room.npcs.find((n) => n.def.id === 'npc3');
  const rosterDetail = `${room.npcs.length} npcs, ${new Set(names).size} unique names, npc2 ${n2 ? n2.def.name : '?'} vs npc3 ${n3 ? n3.def.name : '?'}`;
  const rosterPass = rosterOk && !!n2 && !!n3 && n2.def.name !== n3.def.name;

  const n6 = room.npcs.find((n) => n.def.id === 'npc6');
  const n6d = n6 ? dist(n6.state.x, n6.state.z, -42, 32.6) : Infinity;
  const n6Pass = !!n6 && n6d <= 0.2 && n6.state.ry === 0 && n6.state.anim === 'sit';
  const n6Detail = n6 ? `d=${n6d.toFixed(2)} ry=${n6.state.ry} anim=${n6.state.anim}` : 'missing';

  // Spawn positions serve as each NPC's home slot for the "returned home" check.
  const spawn = {};
  for (const n of room.npcs) spawn[n.def.id] = { x: n.state.x, z: n.state.z };

  const entries = [];
  let transitions = 0;
  let transitionsDropped = 0;
  const lastKey = {};
  let lastBeds = room.beds.slice();
  let maxResting = 0;
  let bedViolation = null;
  let cancels = 0;
  const cancelLog = [];
  let abbotClosing = null;
  const visitorBranch = {};
  const visitorReturn = {};

  // bell
  const bellWinStart = base + 10 * 60_000;
  const bellWinEnd = bellWinStart + 60_000;
  let bellPre = null;
  let ringStart = null;
  let ringEnd = null;
  let walkAfterRing = null;

  // rest cycle
  const prevMode = {};
  const rest = {};
  for (const id of REST_POOL) rest[id] = { step: 0, bed: null, dist: null, ok: false, enteredToRest: false };

  for (let t = base; t < end; t += 100) {
    const before = new Map(room.npcs.map((n) => [n.def.id, n.route ? n.route.length : 0]));
    tickNpcs(room, t, 3);

    for (const c of room.outbox.splice(0)) {
      entries.push(`${fmt(t)} CHAT ${c.npcId} ${c.name}: ${c.text}`);
      if (c.npcId === 'npc1' && c.text.includes('Hiện có ') && c.text.includes(' đạo hữu') && !abbotClosing) {
        abbotClosing = `${fmt(t)} ${c.text}`;
      }
    }

    // beds
    for (let i = 0; i < room.beds.length; i++) {
      if (room.beds[i] !== lastBeds[i]) {
        entries.push(`${fmt(t)} BED beds[${i}]: ${lastBeds[i]} -> ${room.beds[i]}`);
      }
    }
    lastBeds = room.beds.slice();
    const held = room.beds.filter((b) => b !== null);
    if (new Set(held).size !== held.length && !bedViolation) bedViolation = `${fmt(t)} duplicate holder in ${JSON.stringify(room.beds)}`;

    let resting = 0;
    for (const n of room.npcs) {
      const id = n.def.id;
      if (n.mode === 'resting') resting++;

      if (n.bedId !== null && n.bedId !== undefined && room.beds[n.bedId] !== id && !bedViolation) {
        bedViolation = `${fmt(t)} ${id}.bedId=${n.bedId} but beds=${JSON.stringify(room.beds)}`;
      }
      if ((n.bedId === null || n.bedId === undefined) && room.beds.includes(id) && !bedViolation) {
        bedViolation = `${fmt(t)} ${id} holds a bed in room.beds but bedId=${n.bedId}`;
      }

      // route cancel signature
      const prevLen = before.get(id) || 0;
      const nowLen = n.route ? n.route.length : 0;
      if (prevLen > 0 && nowLen === 0 && n.phase === 'idle' && n.until === t + 1500) {
        cancels++;
        const line = `${fmt(t)} CANCEL ${id} at ${pos(n)}`;
        cancelLog.push(line);
        entries.push(line);
      }

      // transitions
      const k = `${n.state.anim}|${n.mode}|${n.stage}`;
      if (lastKey[id] !== k) {
        lastKey[id] = k;
        if (transitions < LOG_CAP) {
          entries.push(`${fmt(t)} ${id} anim=${n.state.anim} mode=${n.mode} stage=${n.stage ?? '-'} ${pos(n)}`);
        } else {
          transitionsDropped++;
        }
        transitions++;
      }

      // npc4 bell
      if (id === 'npc4') {
        if (t < bellWinStart - 2 * 60_000) {
          bellPre = Math.max(bellPre ?? 0, dist(n.state.x, n.state.z, BELL_TOWER.x, BELL_TOWER.z));
        }
        if (n.state.anim === 'ring') {
          if (ringStart === null) ringStart = t;
        } else if (ringStart !== null && ringEnd === null) {
          ringEnd = t;
        }
        if (ringEnd !== null && walkAfterRing === null && n.state.anim === 'walk' && t - ringEnd <= 120_000) {
          walkAfterRing = t;
        }
      }

      // rest cycle
      if (REST_POOL.includes(id)) {
        const r = rest[id];
        if (r.step === 0 && n.mode === 'toRest' && prevMode[id] === 'normal') {
          r.step = 1;
          r.enteredToRest = true;
        } else if (r.step === 1 && n.mode === 'resting' && n.state.anim === 'lie') {
          const bi = BED_X.findIndex((bx) => Math.abs(n.state.x - bx) <= 0.2);
          if (bi >= 0 && Math.abs(n.state.z - BED_Z) <= 0.2) {
            r.step = 2;
            r.bed = bi;
          }
        } else if (r.step === 2 && n.mode === 'toWork') {
          r.step = 3;
        } else if (r.step === 3 && n.mode === 'normal') {
          const h = NODE_BY_ID[HOME_NODE[id]];
          r.home = HOME_NODE[id];
          r.dist = dist(n.state.x, n.state.z, h.x, h.z);
          r.ok = r.dist <= 3;
          r.step = 4;
        }
      }
      prevMode[id] = n.mode;

      // visitors
      if (VISITORS.includes(id)) {
        if (n.stage === 'branch') visitorBranch[id] = true;
        else if (visitorBranch[id] && (n.stage === 'plaza' || n.stage === 'toGate')) visitorReturn[id] = true;
      }
    }
    if (resting > maxResting) maxResting = resting;
  }

  console.log('--- log');
  for (const e of entries) console.log(e);
  if (transitionsDropped > 0) console.log(`... (${transitionsDropped} more)`);

  // checks
  const checks = [];
  checks.push(['roster 12 unique names', rosterPass, rosterDetail]);
  checks.push(['npc6 desk spawn', n6Pass, n6Detail]);

  if (key === 'b') {
    const roaming = bellPre !== null && bellPre > 5;
    const startOk = ringStart !== null && ringStart >= bellWinStart && ringStart <= bellWinEnd;
    const durS = ringStart !== null && ringEnd !== null ? (ringEnd - ringStart) / 1000 : null;
    const durOk = durS !== null && durS >= 55 && durS <= 65;
    const walkOk = walkAfterRing !== null;
    checks.push([
      'npc4 bell',
      roaming && startOk && durOk && walkOk,
      `maxDistPre=${bellPre === null ? 'n/a' : bellPre.toFixed(1)} ringStart=${ringStart === null ? 'none' : fmt(ringStart)} ringSecs=${durS} walkAfter=${walkAfterRing === null ? 'none' : fmt(walkAfterRing)}`,
    ]);
  } else {
    checks.push(['npc4 bell', true, 'n/a, scenario B only']);
  }

  const anyToRest = REST_POOL.some((id) => rest[id].enteredToRest);
  const completed = REST_POOL.filter((id) => rest[id].step === 4);
  const okIds = REST_POOL.filter((id) => rest[id].ok);
  const restDetail = REST_POOL.map((id) => `${id}:step${rest[id].step}${rest[id].dist !== null ? ` d=${rest[id].dist.toFixed(1)} home=${rest[id].home}` : ''}`).join(' ');
  if (key === 'b' && !anyToRest) {
    checks.push(['rest cycle', true, 'n/a, no rest started in this 25 min window']);
  } else {
    checks.push(['rest cycle', okIds.length > 0, `completed=${completed.length} home-ok=${okIds.join(',') || 'none'} [${restDetail}]`]);
  }

  checks.push([
    'bed invariants',
    maxResting <= 2 && !bedViolation,
    `maxResting=${maxResting}${bedViolation ? ' ' + bedViolation : ''}`,
  ]);
  checks.push(['route cancels', cancels === 0, `count=${cancels}${cancelLog.length ? ' first: ' + cancelLog[0] : ''}`]);

  if (key === 'a') {
    checks.push(['abbot closing line', !!abbotClosing, abbotClosing || 'none']);
  } else {
    checks.push(['abbot closing line', true, 'n/a, scenario A only']);
  }

  const branchIds = VISITORS.filter((id) => visitorBranch[id]);
  const returnIds = VISITORS.filter((id) => visitorReturn[id]);
  checks.push([
    'visitor branch',
    returnIds.length > 0,
    `reached branch=${branchIds.join(',') || 'none'} returned=${returnIds.join(',') || 'none'}`,
  ]);

  console.log(`--- ${checks.every((c) => c[1]) ? 'PASS' : 'FAIL'} (scenario ${key.toUpperCase()}) ---`);
  for (const [name, ok, detail] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name} (${detail})`);

  console.log('--- final roster');
  for (const n of room.npcs) {
    console.log(`${n.def.id} ${n.def.name} ${n.def.behavior} ${n.state.anim} ${n.mode} ${pos(n)}`);
  }

  return checks;
}

const arg = (process.argv[2] || '').toLowerCase();
const keys = arg ? [arg] : ['a', 'b', 'c'];
if (keys.some((k) => !SCENARIOS[k])) {
  console.error(`unknown scenario "${arg}", use a, b or c`);
  process.exit(2);
}

let total = 0;
let passed = 0;
for (const k of keys) {
  for (const [, ok] of runScenario(k)) {
    total++;
    if (ok) passed++;
  }
}
const failures = total - passed;
console.log(`\n=== TOTAL: ${passed}/${total} PASS ===`);
process.exitCode = failures ? 1 : 0;
