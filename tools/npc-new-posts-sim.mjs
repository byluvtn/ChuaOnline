import { createNpcRoom, tickNpcs } from '../server/npcs.ts';
import assert from 'node:assert/strict';
import { inLake } from '../src/layout.ts';
import { LOTUS_PAVILION, expansionWaterBlocked } from '../shared/campus.ts';

const base = Date.UTC(2026, 10, 9, 3, 0, 0);
const room = createNpcRoom(base);
const IDS = ['npc42', 'npc40', 'npc41', 'npc39'];
const stat = Object.fromEntries(IDS.map((id) => [id, { anims: {}, minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9, bad: 0, steps: 0, lastMove: 0, stuck: 0 }]));
const prev = {};
const FENCE = { x0: -88, x1: -63.5, z0: -49, z1: -37 };
let fenceCross = 0;
for (let t = base; t < base + 2 * 3600_000; t += 100) {
  tickNpcs(room, t, 3);
  for (const n of room.npcs) {
    if (!IDS.includes(n.def.id)) continue;
    const s = n.state, st = stat[n.def.id];
    if (n.def.id === 'npc42') {
      assert.ok(Math.hypot(s.x - LOTUS_PAVILION.x, s.z - LOTUS_PAVILION.z) < 2,
        `npc42 patrol is not at the pavilion: (${s.x}, ${s.z})`);
    }
    st.anims[s.anim] = (st.anims[s.anim] ?? 0) + 1;
    st.minX = Math.min(st.minX, s.x); st.maxX = Math.max(st.maxX, s.x);
    st.minZ = Math.min(st.minZ, s.z); st.maxZ = Math.max(st.maxZ, s.z);
    if (inLake(s.x, s.z) || expansionWaterBlocked(s.x, s.z)) st.bad++;
    const p = prev[n.def.id];
    if (p) {
      const moved = Math.hypot(s.x - p.x, s.z - p.z);
      if (moved > 0.001) st.lastMove = t;
      if (s.anim === 'walk' || s.anim === 'carry') { if (moved > 0.001) st.walkStill = 0; else st.walkStill = (st.walkStill ?? 0) + 100; if (st.walkStill === 5000) st.stuck++; } else st.walkStill = 0;
      if (n.def.id === 'npc40') {
        const inside = (q) => q.x > FENCE.x0 && q.x < FENCE.x1 && q.z > FENCE.z0 && q.z < FENCE.z1;
        if (inside(p) !== inside(s) && !(Math.abs((s.z + p.z) / 2 + 42) < 2.2 && Math.abs(Math.max(s.x, p.x) + 63.5) < 1.5)) fenceCross++;
      }
    }
    prev[n.def.id] = { x: s.x, z: s.z };
  }
}
for (const id of IDS) {
  const st = stat[id];
  console.log(id, JSON.stringify(st.anims), `x ${st.minX.toFixed(1)}..${st.maxX.toFixed(1)} z ${st.minZ.toFixed(1)}..${st.maxZ.toFixed(1)}`, 'water', st.bad, 'stuck', st.stuck);
}
console.log('npc40 fence crossings outside gate:', fenceCross);
assert.equal(fenceCross, 0);
for (const [id, actions] of Object.entries({ npc42: ['walk', 'sweep'], npc40: ['scoop', 'carry', 'water'], npc41: ['walk', 'sweep'], npc39: ['walk', 'incense', 'sweep'] })) {
  assert.equal(stat[id].bad, 0, `${id}: entered water`);
  assert.equal(stat[id].stuck, 0, `${id}: stopped during a walk`);
  for (const action of actions) assert.ok(stat[id].anims[action], `${id}: missing ${action}`);
}
