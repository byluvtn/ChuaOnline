import { createNpcRoom, tickNpcs, activeSession, activeBell } from '../server/npcs.ts';

const base = Date.UTC(2026, 10, 9, 21, 58, 0);
const room = createNpcRoom(base);
const fmt = (t) => new Date(t + 7 * 3600_000).toISOString().slice(11, 19) + ' VN';
const last = {};
const chats = [];
let bellStart = null, bellEnd = null;
const visitorStages = [];
let minZ = 1e9;
for (let t = base; t < base + 30 * 60_000; t += 100) {
  tickNpcs(room, t, 3);
  for (const c of room.outbox.splice(0)) chats.push(`${fmt(t)} ${c.name}: ${c.text}`);
  for (const n of room.npcs) {
    const k = `${n.state.anim}|${n.mode}|${n.stage}`;
    if (last[n.def.id] !== k) {
      last[n.def.id] = k;
      if (n.def.id === 'npc1' && (n.mode !== 'normal' || n.state.anim === 'sit')) console.log(fmt(t), 'npc1', n.state.anim, n.mode, n.state.x.toFixed(1), n.state.z.toFixed(1));
      if (n.def.id === 'npc4' && n.state.anim === 'ring') bellStart = t;
      if (n.def.id === 'npc4' && n.state.anim !== 'ring' && bellStart && !bellEnd) bellEnd = t;
      if (n.def.id === 'npc5') visitorStages.push(`${fmt(t)} ${n.state.anim} ${n.stage} (${n.state.x.toFixed(1)},${n.state.z.toFixed(1)})`);
    }
    if (n.def.id === 'npc5') minZ = Math.min(minZ, n.state.z);
  }
}
console.log('--- chats'); console.log(chats.join('\n'));
console.log('--- bell', bellStart && fmt(bellStart), bellEnd && fmt(bellEnd), 'secs', bellStart && bellEnd ? (bellEnd - bellStart) / 1000 : null);
console.log('--- npc5 first events'); console.log(visitorStages.slice(0, 14).join('\n'));
console.log('npc5 min z', minZ.toFixed(1), 'defs', room.npcs.length);
console.log('session@22:00UTC', !!activeSession(Date.UTC(2026, 10, 9, 22, 1)), 'session@05:01 local-server-tz-independent', !!activeSession(Date.UTC(2026, 10, 9, 21, 1)));
console.log('bell 18:00 VN', !!activeBell(Date.UTC(2026, 10, 10, 11, 0, 30)), 'no bell 18:05', !!activeBell(Date.UTC(2026, 10, 10, 11, 5)));
