export default async ({ ev, shot, sleep, send }) => {
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: +p.z.toFixed(1) }); })()`);
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const openMap = async () => { await ev(`document.querySelector('#menu [data-menu="map"]').click()`); await sleep(1200); };

  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  console.log('start', await pos());

  console.log('statue group', await ev(`(()=>{ const g = window.__co.world.scene.getObjectByName('statue-scan-vuon-thap'); if (!g) return 'missing'; let meshes = 0, gold = 0; g.traverse((o) => { if (o.isMesh) { meshes++; if (o.material && o.material.metalness === 1) gold++; } }); return JSON.stringify({ children: g.children.length, meshes, gold, pos: g.position.toArray().map((v) => +v.toFixed(2)) }); })()`));
  console.log('colliders near statue', await ev(`JSON.stringify(window.__co.world.colliders.filter((c) => Math.hypot(c.x - 43.6, c.z + 60.7) < 0.5))`));

  await ev(`(()=>{ const me = window.__co.me(); me.char.root.position.set(43.6, 0.2, -52.5); })()`);
  await metrics(320, 200);
  await sleep(6000);
  await metrics(1280, 800);
  await sleep(3000);
  console.log('pos wide', await pos());
  await shot('wide');

  await ev(`(()=>{ const me = window.__co.me(); me.char.root.position.set(43.6, 0.2, -57.5); })()`);
  await metrics(320, 200);
  await sleep(5000);
  await metrics(1280, 800);
  await sleep(3000);
  console.log('pos close', await pos());
  console.log('zone', await ev(`window.__co.world.zoneAt(window.__co.me().char.root.position.x, window.__co.me().char.root.position.z)`));
  await shot('close');

  await openMap();
  await shot('map');
};
