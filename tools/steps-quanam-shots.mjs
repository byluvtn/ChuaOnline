// QuanAm v4 screenshots: close-up face + yard wide + 3/4 side.
// Camera-based (no walking) — same pattern as steps-a23-shots.mjs.
// QuanAm at (28,14); qyard.rotation.y = -PI/2 - 0.3 -> face points West (-x) + a bit North.
// Face is local +z (eyes/smile/blush at surfZ > 0) -> camera must sit West of the statue.
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

  // Close-up mat tuong (tu phia Tay, ngang tam mat ~y 4.0)
  await cam(22.3, 4.2, 12.2, 28, 4.0, 14); await sleep(4000); await shot('quanam');
  // Toan canh san tu phia Tay (thay mat + san)
  await cam(13, 6, 9, 28, 2.5, 14); await sleep(4000); await shot('yard');
  // 3/4 tu phia Nam-Tay (du phong neu huong mat lech)
  await cam(24, 3.5, 21, 28, 3.5, 14); await sleep(4000); await shot('quanam-side');

  await ev(`window.__co.freeze = false`);
};
