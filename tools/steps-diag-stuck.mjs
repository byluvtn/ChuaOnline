export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  const near = await ev(`JSON.stringify(window.__co.world.colliders.filter((c) => Math.hypot(c.x + 3.4, c.z + 2.2) < 4).map((c) => ({ x: +c.x.toFixed(2), z: +c.z.toFixed(2), r: c.r, d: +Math.hypot(c.x + 3.4, c.z + 2.2).toFixed(2) })))`);
  console.log('colliders within 4 of (-3.4,-2.2):', near);
  console.log('colliders total', await ev(`window.__co.world.colliders.length`));
  console.log('groundY at stuck', await ev(`window.__co.world.groundY(-3.4, -2.2)`));
  console.log('zone at stuck', await ev(`window.__co.world.zoneAt(-3.4, -2.2)`));
  await ev(`(()=>{ const r = window.__co.me().char.root; r.position.set(-3.4, 0, -2.2); })()`);
  await sleep(800);
  await ev(`window.__co.walkTo(-17, -52)`);
  for (let i = 0; i < 8; i++) {
    await sleep(3000);
    console.log('pos', await ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) }); })()`));
  }
};
