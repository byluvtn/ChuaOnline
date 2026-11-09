import { io } from 'socket.io-client';
export default async ({ ev, shot, sleep }) => {
  const g = await (await fetch('http://localhost:3001/api/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
  const s = io('http://localhost:3001', { auth: { token: g.token } });
  await new Promise((r) => s.on('connect', r));
  s.emit('join', { name: 'Thiện Tâm', outfit: 'female', color: '#a3343f', room: 'vo-luong' });
  await sleep(500);
  s.emit('move', { x: 1.2, z: 13, ry: 3.3, anim: 'idle' });
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 40 && !(await ev(`window.__co && __co.remotes.size >= 2`)); i++) await sleep(500);
  await sleep(500);
  s.emit('chat', 'A di đà Phật, chúc mọi người bình an!');
  await sleep(700);
  console.log(await ev(`JSON.stringify([...__co.remotes.values()].map(r => ({ n: r.data.name, vis: r.char.bubble.visible, left: Math.round(r.char.bubbleUntil - performance.now()), sc: r.char.bubble.scale.toArray(), cw: r.char.bubble.material.map.image.width, ch: r.char.bubble.material.map.image.height })))`));
  await shot('bubble');
  s.close();
};
