export default async ({ ev, shot, sleep, send }) => {
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: +p.z.toFixed(1) }); })()`);
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const openMap = async () => { await ev(`document.querySelector('#menu [data-menu="map"]').click()`); await sleep(1200); };
  const arrivedAt = (p) => p.y > 2.5 && Math.abs(p.x) < 14 && p.z < -51 && p.z > -68;

  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  console.log('start', await pos());

  await openMap();
  await shot('tamthe-map');
  console.log('chips', await ev(`JSON.stringify([...document.querySelectorAll('.chips .chip')].map((c) => c.textContent))`));
  await ev(`[...document.querySelectorAll('.chips .chip')].find((c) => c.textContent === 'Điện Tam Thế').click()`);
  await sleep(300);
  console.log('toast', await ev(`document.getElementById('toast')?.textContent ?? ''`));

  await metrics(320, 200);
  await sleep(1500);

  let arrived = false, last = '';
  const t0 = Date.now();
  for (let i = 1; i <= 150; i++) {
    await sleep(4000);
    const raw = await pos();
    const p = JSON.parse(raw);
    if (i % 5 === 0) console.log(`t=${Math.round((Date.now() - t0) / 1000)}s`, raw);
    last = raw;
    if (arrivedAt(p)) { arrived = true; break; }
  }
  console.log('arrived on tam the platform:', arrived, last);

  await metrics(1280, 800);
  await sleep(2500);
  console.log('zone', await ev(`window.__co.world.zoneAt(window.__co.me().char.root.position.x, window.__co.me().char.root.position.z)`));
  console.log('couplet shown', await ev(`document.getElementById('couplet').classList.contains('show')`));
  await shot('tamthe-inside');
  await openMap();
  await shot('tamthe-map-after');
};
