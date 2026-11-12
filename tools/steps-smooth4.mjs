export default async ({ ev, shot, sleep, send }) => {
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: false });
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 30 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(2000);
  const p0 = JSON.parse(await ev(`JSON.stringify({x: window.__co.me().char.root.position.x, z: window.__co.me().char.root.position.z})`));
  await ev(`(()=>{
    const co = window.__co, p = co.me().char.root.position;
    window.__tr = [];
    let n = 0;
    const tick = () => {
      window.__tr.push({ f: n++, s: +co.speedNow().toFixed(2), g: +co.gaitNow().toFixed(3), x: +p.x.toFixed(2), z: +p.z.toFixed(2), anim: co.me().anim });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })()`);
  await ev(`window.__co.walkTo(${p0.x}, ${p0.z + 12})`);
  await sleep(9000);
  await ev(`window.__co.walkTo(${p0.x}, ${p0.z - 6})`);
  await sleep(25000);
  const tr = JSON.parse(await ev(`JSON.stringify(window.__tr)`));
  const sp = tr.map((r) => r.s);
  let maxStep = 0, flips = 0;
  for (let i = 1; i < sp.length; i++) maxStep = Math.max(maxStep, Math.abs(sp[i] - sp[i - 1]));
  for (let i = 2; i < sp.length; i++) if ((sp[i] - sp[i - 1]) * (sp[i - 1] - sp[i - 2]) < -0.01 && Math.abs(sp[i] - sp[i - 1]) > 0.3) flips++;
  console.log('frames', tr.length, 'maxSpeed', Math.max(...sp), 'maxSpeedStep', maxStep.toFixed(2), 'oscillations', flips);
  const minIdx = sp.findIndex((s, i) => i > 5 && i < sp.length - 1 && s < 0.3 && sp[i + 1] >= 0 && tr[i - 3] && tr[i - 3].s > 2);
  console.log('turn-brake sample', JSON.stringify(tr.slice(Math.max(0, minIdx - 8), minIdx + 12)));
  const end = JSON.parse(await ev(`JSON.stringify({x: window.__co.me().char.root.position.x, z: window.__co.me().char.root.position.z, anim: window.__co.me().anim, speed: window.__co.speedNow()})`));
  console.log('end', JSON.stringify(end), 'target z', p0.z - 6);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await ev(`window.__co.camera.position.set(${end.x} + 3, 3, ${end.z} + 6)`);
  await sleep(3000);
  await shot('turn-end');
};
