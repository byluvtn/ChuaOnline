// QuanAm v4 FACE retake: the first close-up was too tight (eyes/mouth cut off).
// Camera farther back (8m) + higher (y 5.0) so the whole head/face is in frame.
// Face points West (-x) + a bit North -> camera West of the statue.
export default async ({ ev, shot, sleep, send }) => {
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const settle = async (ms = 5000) => { await metrics(320, 200); await sleep(ms); await metrics(1280, 800); await sleep(3000); };

  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  await ev(`window.__co.freeze = true`);
  await settle(8000);

  // Whole head in frame: 8m out, y 5.0, looking slightly down at face (y 3.8)
  await cam(20.5, 5.0, 11.0, 28, 3.8, 14); await sleep(4000); await shot('face');

  await ev(`window.__co.freeze = false`);
};
