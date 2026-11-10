export default async ({ ev, shot, sleep, send }) => {
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: +p.z.toFixed(1) }); })()`);
  const frames = () => ev(`new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r(+(n/3).toFixed(1))};requestAnimationFrame(f)})`);
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const openMap = async () => { await ev(`document.querySelector('#menu [data-menu="map"]').click()`); await sleep(1200); };
  const arrivedAt = (p) => Math.hypot(p.x + 17, p.z + 52) < 1.5 || (p.z <= -50.5 && Math.abs(p.x + 17) < 2.5);

  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  console.log('start', await pos(), 'fps@1280x800', await frames());

  await openMap();
  await shot('map-before');
  console.log('chips', await ev(`JSON.stringify([...document.querySelectorAll('.chips .chip')].map((c) => c.textContent))`));
  await ev(`[...document.querySelectorAll('.chips .chip')].find((c) => c.textContent === 'Bảo tháp').click()`);
  await sleep(300);
  console.log('toast', await ev(`document.getElementById('toast')?.textContent ?? ''`));

  await metrics(320, 200);
  await sleep(1500);
  console.log('fps@320x200', await frames());

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
  console.log('arrived near (-17,-52):', arrived, last);

  await metrics(1280, 800);
  await sleep(2500);
  console.log('zone', await ev(`window.__co.world.zoneAt(window.__co.me().char.root.position.x, window.__co.me().char.root.position.z)`));
  console.log('couplet shown', await ev(`document.getElementById('couplet').classList.contains('show')`));
  await shot('game-at-baothap');
  await openMap();
  await shot('map-after');
};
