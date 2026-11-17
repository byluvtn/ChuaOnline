import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

const base = process.env.API_URL || 'http://127.0.0.1:3001';
const response = await fetch(`${base}/api/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
assert(response.ok, `Guest creation failed ${response.status}`);
const { token } = await response.json();
const socket = io(base, { auth: { token }, transports: ['websocket'], autoConnect: false });
const waitEvent = (event, predicate = () => true) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { socket.off(event, handler); reject(new Error(`Timeout ${event}`)); }, 15000);
  function handler(value) { if (!predicate(value)) return; clearTimeout(timeout); socket.off(event, handler); resolve(value); }
  socket.on(event, handler);
});
const emitAck = (name, payload) => new Promise((resolve, reject) => {
  socket.timeout(10000).emit(name, payload, (error, result) => error ? reject(error) : resolve(result));
});
const move = (x, z) => socket.emit('move', { x, z, ry: 0, anim: 'walk' });
try {
  const connected = waitEvent('connect'); socket.connect(); await connected;
  const welcomePromise = waitEvent('welcome');
  const resume = `expansion-${Date.now()}`;
  const join = { name: 'Expansion Test', outfit: 'monk', color: '#d9a62b', room: 'vo-luong', resume };
  socket.emit('join', join);
  const welcome = await welcomePromise;
  const self = welcome.players.find(p => p.id === welcome.id);
  assert(self && self.z >= 28, 'Player spawned inside old plaza / new pond');
  const listPromise = waitEvent('quests', qs => qs.some(q => q.id === 'nq_ngoc_pilgrimage'));
  const all = await listPromise;
  for (const id of ['nq_ngoc_pilgrimage', 'nq_bamboo_walk', 'nq_river_walk', 'nq_duocsu_prayer']) {
    assert(all.some(q => q.id === id), `Missing quest ${id}`);
    assert((await emitAck('quest:accept', id)).ok, `Could not accept ${id}`);
  }
  const complete = waitEvent('quests', qs => qs.find(q => q.id === 'nq_ngoc_pilgrimage')?.progress === 1);
  move(0, -112); await complete;
  // Existing visit checks are throttled to one per second. Use an event-driven timer,
  // not repeated polling or a server state edit, between the two locations.
  await new Promise(resolve => setTimeout(resolve, 1100));
  const bamboo = waitEvent('quests', qs => qs.find(q => q.id === 'nq_bamboo_walk')?.progress === 1);
  move(80, -8); await bamboo;
  await new Promise(resolve => setTimeout(resolve, 1100));
  const river = waitEvent('quests', qs => qs.find(q => q.id === 'nq_river_walk')?.progress === 1);
  move(69, -20); await river;
  // Offering outside the hall must not advance its zone-scoped quest.
  const outsidePromise = waitEvent('quests', qs => qs.some(q => q.id === 'nq_duocsu_prayer'));
  socket.emit('action', 'lantern', 'Test outside Dược Sư');
  const outside = await outsidePromise;
  assert.equal(outside.find(q => q.id === 'nq_duocsu_prayer').progress, 0);
  await new Promise(resolve => setTimeout(resolve, 5100));
  move(77, -35);
  const prayer = waitEvent('quests', qs => qs.find(q => q.id === 'nq_duocsu_prayer')?.progress === 1);
  const lamp = waitEvent('lantern', l => l.wish === 'Test Dược Sư');
  socket.emit('action', 'lantern', 'Test Dược Sư');
  await prayer;
  const placed = await lamp;
  assert.equal(placed.x, 77); assert.equal(placed.z, -35);
  move(65, 2);
  move(65, -20);
  await new Promise(resolve => setTimeout(resolve, 150));
  socket.disconnect();
  await new Promise(resolve => setTimeout(resolve, 150));
  const reconnect = waitEvent('connect'); socket.connect(); await reconnect;
  const resumedPromise = waitEvent('welcome'); socket.emit('join', join);
  const resumed = await resumedPromise;
  const resumedSelf = resumed.players.find(p => p.id === resumed.id);
  assert.equal(resumedSelf.x, 65); assert.equal(resumedSelf.z, 2);
  const distribution = { north: 0, west: 0, east: 0, central: 0 };
  for (const player of welcome.players.filter(p => p.npc)) {
    if (player.z < -82) distribution.north++;
    else if (player.x < -62) distribution.west++;
    else if (player.x > 62) distribution.east++;
    else distribution.central++;
  }
  console.log('NPC initial sample', JSON.stringify(distribution));
  console.log('PASS: southern spawn; 4 quests visible/accepted; 3 visit completions; Dược Sư zone check; shared lamp origin; invalid river move rejected and dry bridge point resumed. Test uses a new local guest, not an existing account.');
} finally { socket.disconnect(); }
