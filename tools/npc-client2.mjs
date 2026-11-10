import { io } from 'socket.io-client';
const base = 'http://localhost:3001', secs = Number(process.argv[2] ?? 60);
const { token } = await (await fetch(base + '/api/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
const s = io(base, { auth: { token } });
const npc = {}; const events = []; const chats = []; let online = 0, welcomeNpcs = 0, joinNpc = 0;
const t0 = Date.now(); const ts = () => ((Date.now() - t0) / 1000).toFixed(0).padStart(3) + 's';
s.on('connect', () => s.emit('join', { name: 'Khach3', outfit: 'male', color: '#72818e', room: 'vo-luong' }));
s.on('welcome', (w) => { welcomeNpcs = w.players.filter((p) => p.npc).length; console.log('WELCOME npcs', welcomeNpcs, w.players.filter((p) => p.npc).map((p) => p.id + ':' + p.role).join(' ')); });
s.on('player:join', (p) => { if (p.npc) joinNpc++; });
s.on('chat', (m) => chats.push(`${ts()} ${m.name}: ${m.text}`));
s.on('state', (st) => {
  online = st.online;
  for (const p of st.players) if (p.id.startsWith('npc')) {
    const prev = npc[p.id]; npc[p.id] = p;
    if (prev?.anim !== p.anim && ['npc1', 'npc4', 'npc5'].includes(p.id)) events.push(`${ts()} ${p.id} ${prev?.anim ?? '-'} -> ${p.anim} @(${p.x.toFixed(1)},${p.z.toFixed(1)})`);
  }
});
setTimeout(() => {
  console.log('online', online, 'npc player:join', joinNpc);
  console.log(events.join('\n')); console.log('CHAT'); console.log(chats.join('\n'));
  s.close(); process.exit(0);
}, secs * 1000);
