import { io } from 'socket.io-client';
export default async ({ ev, shot, sleep }) => {
  // second player via socket, standing near the first spawn
  const g = await (await fetch('http://localhost:3001/api/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
  const s = io('http://localhost:3001', { auth: { token: g.token } });
  await new Promise((r) => s.on('connect', r));
  s.emit('join', { name: 'Thiện Tâm', outfit: 'female', color: '#a3343f', room: 'vo-luong' });
  await sleep(500);
  s.emit('move', { x: 2.5, z: 9, ry: 3.3, anim: 'idle' });
  await ev(`document.getElementById('enter').click()`);
  await sleep(3500);
  s.emit('chat', 'A di đà Phật, chúc mọi người bình an!');
  await sleep(600);
  await ev(`document.querySelector('[data-act=incense]').click()`);
  await sleep(1200);
  await shot('social');
  await ev(`document.querySelector('[data-panel=quests]').click()`);
  await sleep(700);
  await shot('quests');
  s.close();
};
