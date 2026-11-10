export default async ({ ev, shot, sleep, send }) => {
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  const spots = [
    { name: 'amco', x: -38, z: -50 },
    { name: 'vuonthap', x: 36, z: -48 },
    { name: 'nhato', x: 10, z: -56 },
    { name: 'tangxa', x: 22, z: -56 },
  ];
  for (const s of spots) {
    await ev(`(()=>{ const r = window.__co.me().char.root; r.position.set(${s.x} - 9, 0, ${s.z} + 14); return 1; })()`);
    await metrics(320, 200);
    await sleep(1500);
    await metrics(1280, 800);
    await sleep(2500);
    console.log(s.name, 'zone', await ev(`window.__co.world.zoneAt(${s.x}, ${s.z})`));
    console.log(s.name, 'groundY', await ev(`window.__co.world.groundY(${s.x}, ${s.z})`));
    await shot(s.name);
  }
};
