// Client thứ hai (headless): vào cùng phòng, ghi lại trạng thái NPC theo thời gian để đối chiếu với trình duyệt.
import { io } from 'socket.io-client';
const base = process.argv[2] ?? 'http://localhost:3001', secs = Number(process.argv[3] ?? 80);
const { token } = await (await fetch(base + '/api/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
const s = io(base, { auth: { token } });
const npc = {}; const log = []; const rings = []; const stops = new Set(); let online = 0, welcomeNpcs = 0;
const upd = (p) => { const prev = npc[p.id]; npc[p.id] = { ...(prev ?? {}), ...p }; if (p.id === 'npc4' && p.anim === 'ring' && prev?.anim !== 'ring') rings.push(Date.now()); if (p.id === 'npc1' && p.anim !== 'walk' && prev?.anim === 'walk') stops.add(Math.round(p.x) + ',' + Math.round(p.z)); };
s.on('connect', () => s.emit('join', { name: 'Khach2', outfit: 'male', color: '#72818e', room: 'vo-luong' }));
s.on('welcome', (w) => { welcomeNpcs = w.players.filter((p) => p.npc).length; w.players.filter((p) => p.npc).forEach(upd); console.log('WELCOME npcs', welcomeNpcs, 'total players', w.players.length); });
s.on('state', (st) => { online = st.online; for (const p of st.players) if (p.id.startsWith('npc')) upd(p); });
s.on('player:join', (p) => { if (p.npc) console.log('UNEXPECTED player:join for npc', p.id); });
const t0 = Date.now();
const iv = setInterval(() => { log.push({ t: Date.now(), n: Object.fromEntries(Object.entries(npc).map(([k, v]) => [k, [+v.x.toFixed(2), +v.z.toFixed(2), v.anim]])) }); }, 500);
setTimeout(() => { clearInterval(iv); console.log('SUMMARY ' + JSON.stringify({ online, welcomeNpcs, rings, abbotStops: [...stops], samples: log })); s.close(); process.exit(0); }, secs * 1000);
