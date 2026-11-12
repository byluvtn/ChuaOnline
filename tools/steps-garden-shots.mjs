// Headless shots for the garden.
// STEPS=./tools/steps-garden-shots.mjs node tools/shot.mjs shots/garden http://localhost:5173/ 1280 800
export default async ({ ev, shot, sleep, send }) => {
  const metrics = (w, h) =>
    send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: false,
    });

  const cam = (px, py, pz, lx, ly, lz) =>
    ev(`(() => {
      const c = window.__co.camera;
      c.position.set(${px}, ${py}, ${pz});
      c.lookAt(${lx}, ${ly}, ${lz});
      window.__co.freeze = true;
    })()`);

  const settle = async (ms) => {
    await metrics(320, 200);
    await sleep(ms);
    await metrics(1280, 800);
    await sleep(3000);
  };

  // 1. Enter the world
  await sleep(1500);
  await ev(`document.querySelector('#enter').click()`);
  for (let i = 0; i < 40; i++) {
    const ok = await ev(`!!(window.__co && window.__co.me && window.__co.me())`);
    if (ok) break;
    await sleep(500);
  }
  await sleep(1000);
  await ev(`window.__co.freeze = true`);
  await settle(8000);

  // 2. Wait for garden meshes
  const countExpr = `(() => { let n = 0; const pts = [[-8.5,12],[8.5,12],[-7.5,-1],[-40,-22],[-38,-31],[-34,-33],[48,-24],[-37.5,-26],[-30.5,-26],[45,-66],[53,-66],[-34,-26]]; window.__co.world.scene.traverse((o) => { if (!o.isMesh) return; const p = new window.__co.THREE.Vector3(); o.getWorldPosition(p); for (const [x, z] of pts) { if (Math.hypot(p.x - x, p.z - z) < 2) { n++; break; } } }); return n; })()`;
  let found = false;
  for (let t = 0; t < 15; t++) {
    const n = await ev(countExpr);
    console.log(`garden meshes near placements: ${n}`);
    if (n > 0) { found = true; break; }
    await sleep(2000);
  }
  if (!found) console.log('garden meshes NOT FOUND');

  // 3. Plaza cherry tree
  await cam(2, 2.2, 2, -8.5, 2.5, 12);
  await sleep(4000);
  await shot('garden-plaza-cherry');

  // 4. Zen sand garden
  await cam(-28, 2.0, -20, -34, 1.0, -26);
  await sleep(4000);
  await shot('garden-zen-sand');

  // 5. Release camera
  await ev(`window.__co.freeze = false`);
};
