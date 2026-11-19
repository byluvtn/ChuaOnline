// bench-sim.mjs — sim for the corridor-bench NPC rest package (news 149).
// Drives server/npcs.ts headless: NPCs must sit exactly on bench seats,
// never double-book a seat, rotate off within 30-60 s, walk to the bench
// without cutting through arhat pedestals / pillars, and other NPC
// behaviours must keep running (regression).
// Usage: ./node_modules/.bin/tsx tools/bench-sim.mjs
import { createNpcRoom, tickNpcs, CORRIDOR_BENCH_SEATS } from '../server/npcs.ts';

// Arhat pedestals (src/temple.ts): x=±22.35, z=-16.6+3.6k, r=0.85.
// Corridor pillars: x=cx±2.4 (18.1/22.9 east, -18.1/-22.9 west),
// z=-18.4+3.6k, r=0.22.
const PEDESTALS = [];
for (const s of [-1, 1]) for (let k = 0; k < 5; k++) PEDESTALS.push({ x: s * 22.35, z: -16.6 + 3.6 * k, r: 0.85 });
const PILLARS = [];
for (const cx of [20.5, -20.5]) for (const off of [-2.4, 2.4]) for (let z = -18.4; z <= -0.4; z += 3.6) PILLARS.push({ x: cx + off, z, r: 0.22 });
const BENCH_CENTERS = [];
for (const sx of [18.8, -18.8]) for (const sz of [-16.6, -9.4, -2.2]) BENCH_CENTERS.push({ x: sx, z: sz });

const base = Date.UTC(2026, 10, 16, 21, 50, 0); // 04:50 VN — crosses the 05:00 session start, so outbox chats fire
const room = createNpcRoom(base);
const fmt = (t) => new Date(t + 7 * 3600_000).toISOString().slice(11, 19) + ' VN';

let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!cond) failures++;
};

const sits = []; // {id,name,seat,start,end,durMs}
const active = new Map(); // npcId -> sit record in progress
const toBenchStart = new Map(); // npcId -> t when toBenchRest began
const toBenchMinClear = new Map(); // npcId -> min pedestal clearance during current toBenchRest walk
let maxToBenchMs = 0, stuckToBench = [];
let benchWalkEpisodes = 0, benchWalkGraze = 0, benchWalkPenetrate = 0; // clearance <0.4 / <0 per walk episode
let minPedestalD = Infinity, minPillarD = Infinity;
let otherMinPedestalD = Infinity, otherClipTicks = 0; // control: clearance during NON-bench walks
const modesSeen = new Set();
let chats = 0, visitorArrivals = 0;
const seatUsers = new Map(); // seatKey -> npcId at this tick (exclusivity)
let doubleBooked = [];

for (let t = base; t < base + 90 * 60_000; t += 100) {
  tickNpcs(room, t, 3);
  chats += room.outbox.splice(0).length;
  for (const n of room.npcs) {
    modesSeen.add(n.mode);
    if (n.mode === 'toBenchRest') {
      if (!toBenchStart.has(n.def.id)) { toBenchStart.set(n.def.id, t); toBenchMinClear.set(n.def.id, Infinity); }
      // clearance while walking to the bench
      for (const p of PEDESTALS) {
        const d = Math.hypot(n.state.x - p.x, n.state.z - p.z) - p.r;
        if (d < toBenchMinClear.get(n.def.id)) toBenchMinClear.set(n.def.id, d);
        if (d < minPedestalD) {
          minPedestalD = d;
          if (d < 0.3) console.log(`CLIP? ${fmt(t)} ${n.def.id} (${n.state.x.toFixed(2)},${n.state.z.toFixed(2)}) near pedestal (${p.x},${p.z}) clearance ${d.toFixed(2)} route0=${n.route[0] ? `(${n.route[0].x},${n.route[0].z})` : 'none'} routeLen=${n.route.length} seat=(${n.benchSeat?.x},${n.benchSeat?.z})`);
        }
      }
      for (const p of PILLARS) minPillarD = Math.min(minPillarD, Math.hypot(n.state.x - p.x, n.state.z - p.z) - p.r);
    } else {
      if (toBenchStart.has(n.def.id)) {
        const dur = t - toBenchStart.get(n.def.id);
        maxToBenchMs = Math.max(maxToBenchMs, dur);
        benchWalkEpisodes++;
        const mc = toBenchMinClear.get(n.def.id);
        if (mc < 0.4) benchWalkGraze++;
        if (mc < 0) benchWalkPenetrate++;
        toBenchStart.delete(n.def.id);
        toBenchMinClear.delete(n.def.id);
      }
      // control: pedestal clearance during all other walking (mode != toBenchRest, moving)
      if (n.route.length && (n.state.anim === 'walk' || n.state.anim === 'run')) {
        for (const p of PEDESTALS) {
          const d = Math.hypot(n.state.x - p.x, n.state.z - p.z) - p.r;
          if (d < otherMinPedestalD) otherMinPedestalD = d;
          if (d < 0.4) otherClipTicks++;
        }
      }
    }
    if (n.mode === 'benchRest') {
      if (!active.has(n.def.id)) {
        const seat = n.benchSeat;
        const rec = { id: n.def.id, name: n.def.name, seat, start: t, end: 0, durMs: 0 };
        active.set(n.def.id, rec);
        sits.push(rec);
        // snap: exactly on the seat, facing the seat ry
        const dx = Math.abs(n.state.x - seat.x), dz = Math.abs(n.state.z - seat.z);
        if (dx > 0.01 || dz > 0.01) console.log(`FAIL snap ${n.def.id} off seat by (${dx.toFixed(3)},${dz.toFixed(3)})`);
        if (Math.abs(n.state.ry - seat.ry) > 0.01) console.log(`FAIL ry ${n.def.id} ry=${n.state.ry.toFixed(3)} seat ry=${seat.ry.toFixed(3)}`);
        if (n.state.anim !== 'bench') console.log(`FAIL anim ${n.def.id} anim=${n.state.anim} mode=benchRest`);
        // seat must be one of the 12 defined seats and on a real bench (<=0.45 from a bench centre)
        const known = CORRIDOR_BENCH_SEATS.some((s) => s.x === seat.x && s.z === seat.z && s.ry === seat.ry);
        if (!known) console.log(`FAIL seat ${n.def.id} seat (${seat.x},${seat.z}) not in CORRIDOR_BENCH_SEATS`);
        const bc = Math.min(...BENCH_CENTERS.map((b) => Math.hypot(seat.x - b.x, seat.z - b.z)));
        if (bc > 0.45) console.log(`FAIL seat ${n.def.id} ${bc.toFixed(2)} m from nearest bench centre`);
      }
      // exclusivity: no two NPCs on the same seat key at the same tick
      const k = `bench:${n.benchSeat.x},${n.benchSeat.z}`;
      if (seatUsers.has(k) && seatUsers.get(k) !== n.def.id) doubleBooked.push(`${fmt(t)} ${k}: ${seatUsers.get(k)} + ${n.def.id}`);
      seatUsers.set(k, n.def.id);
    } else if (active.has(n.def.id)) {
      const rec = active.get(n.def.id);
      rec.end = t; rec.durMs = t - rec.start;
      active.delete(n.def.id);
    }
    if (n.stage === 'toBench' && n.mode === 'toBenchRest') visitorArrivals++;
  }
  seatUsers.clear();
}
// anyone still walking to a bench at the end: only "stuck" if the walk already exceeds 180 s
for (const [id, t0] of toBenchStart) {
  const dur = base + 90 * 60_000 - t0;
  benchWalkEpisodes++;
  const mc = toBenchMinClear.get(id);
  if (mc < 0.4) benchWalkGraze++;
  if (mc < 0) benchWalkPenetrate++;
  if (dur > 180_000) stuckToBench.push(`${id} ${(dur / 1000).toFixed(0)}s`);
}
// anyone still sitting at the end: duration censored, count separately
const stillSitting = [...active.values()].map((r) => `${r.id} (${((base + 90 * 60_000 - r.start) / 1000).toFixed(0)}s)`);

const finished = sits.filter((s) => s.durMs > 0);
const durs = finished.map((s) => s.durMs / 1000);
console.log(`--- sits: ${sits.length} total, ${finished.length} finished, ${stillSitting.length} still sitting at end`);
console.log('sitters:', sits.map((s) => `${s.id}@(${s.seat.x},${s.seat.z}) ${s.durMs ? (s.durMs / 1000).toFixed(0) + 's' : 'open'}`).join(', ') || '(none)');
console.log('durations (s):', durs.map((d) => d.toFixed(0)).join(', ') || '(none)');
console.log('modes seen:', [...modesSeen].sort().join(', '));
console.log(`chats: ${chats}, npc count: ${room.npcs.length}, min pedestal clearance while toBenchRest: ${minPedestalD === Infinity ? 'n/a' : minPedestalD.toFixed(2)} m, min pillar clearance: ${minPillarD === Infinity ? 'n/a' : minPillarD.toFixed(2)} m`);
console.log(`bench walks: ${benchWalkEpisodes} episodes, ${benchWalkGraze} grazed pedestal (<0.4 m), ${benchWalkPenetrate} penetrated (<0 m); control (non-bench walks): min pedestal clearance ${otherMinPedestalD === Infinity ? 'n/a' : otherMinPedestalD.toFixed(2)} m, ${otherClipTicks} ticks <0.4 m`);
console.log('max toBenchRest walk:', (maxToBenchMs / 1000).toFixed(1), 's; stuck at end:', stuckToBench.join(', ') || 'none');
console.log('still sitting at end:', stillSitting.join(', ') || 'none');
console.log('double-booked seats:', doubleBooked.join(' | ') || 'none');

check('at least 1 NPC sat on a bench in 90 sim-min', sits.length >= 1, `${sits.length} sits`);
check('all finished sits lasted 30-60 s', finished.length > 0 && durs.every((d) => d >= 28 && d <= 65), durs.length ? `min ${Math.min(...durs).toFixed(0)}s max ${Math.max(...durs).toFixed(0)}s` : 'no finished sits');
check('no seat double-booked', doubleBooked.length === 0);
check('no NPC stuck walking to bench (>180 s)', stuckToBench.length === 0 && maxToBenchMs <= 180_000, `max ${(maxToBenchMs / 1000).toFixed(1)}s`);
check('no bench walk penetrates an arhat pedestal (<0 m)', benchWalkPenetrate === 0, `${benchWalkPenetrate}/${benchWalkEpisodes} walks penetrated`);
check('bench walks keep >=0.4 m (body radius) clear of arhat pedestals', benchWalkGraze === 0, `${benchWalkGraze}/${benchWalkEpisodes} walks grazed`);
check('bench walks keep >=0.3 m clear of corridor pillars', minPillarD === Infinity || minPillarD >= 0.3, minPillarD === Infinity ? 'no walks sampled' : `${minPillarD.toFixed(2)} m`);
check('regression: visitors/chant/stroll modes still exercised', modesSeen.has('normal') && (modesSeen.has('toSeatChant') || modesSeen.has('seatChant') || modesSeen.has('chanting')), [...modesSeen].join(','));
check('regression: NPCs still chat', chats > 0, `${chats} chats`);
check('regression: NPC count stable', room.npcs.length >= 30, `${room.npcs.length} NPCs`);

console.log(`BENCH SIM FAILURES: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
