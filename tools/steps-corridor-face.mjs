export default async ({ ev, shot, sleep, send }) => {
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  await ev(`window.__co.freeze = true`);
  await metrics(320, 200); await sleep(8000); await metrics(1280, 800); await sleep(3000);
  const names = ['arhat-binh', 'monk-go', 'guanyin-ngoi', 'guanyin-go-minh'];
  for (let k = 0; k < 4; k++) {
    const z = -16.5 + 3 * k;
    await cam(-24.5, 1.4, z + 0.01, -22.5, 0.9, z); await sleep(3000);
    await shot(`back-${names[k]}`);
    await cam(-20.5, 1.4, z + 0.01, -22.5, 0.9, z); await sleep(3000);
    await shot(`front-${names[k]}`);
    await cam(-22.5, 1.4, z - 2.2, -22.5, 0.9, z); await sleep(3000);
    await shot(`left-${names[k]}`);
    await cam(-22.5, 1.4, z + 2.2, -22.5, 0.9, z); await sleep(3000);
    await shot(`right-${names[k]}`);
  }
};
