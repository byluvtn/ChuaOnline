// Headless shots of the Bao Thap tower area (before/after the tree move).
// STEPS=./tools/steps-baothap-shots.mjs node tools/shot.mjs shots/baothap http://localhost:5174/ 1280 800
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

  // 2. Wait for garden meshes near the tower (bamboo + maple)
  const countExpr = `(() => { let n = 0; const pts = [[-34,-33],[-38,-31]]; window.__co.world.scene.traverse((o) => { if (!o.isMesh) return; const p = new window.__co.THREE.Vector3(); o.getWorldPosition(p); for (const [x, z] of pts) { if (Math.hypot(p.x - x, p.z - z) < 2) { n++; break; } } }); return n; })()`;
  let found = false;
  for (let t = 0; t < 15; t++) {
    const n = await ev(countExpr);
    console.log(`tower garden meshes near bamboo/maple: ${n}`);
    if (n > 0) { found = true; break; }
    await sleep(2000);
  }
  if (!found) console.log('tower garden meshes NOT FOUND');

  // 3. South view — the user's angle (from the south, character height, looking up)
  await cam(-29, 2.5, -15, -30, 10, -38);
  await sleep(4000);
  await shot('baothap-south');

  // 4. East view
  await cam(-8, 6, -38, -30, 8, -38);
  await sleep(4000);
  await shot('baothap-east');

  // 5. North view
  await cam(-30, 6, -60, -30, 8, -38);
  await sleep(4000);
  await shot('baothap-north');

  // 6. West view
  await cam(-52, 6, -38, -30, 8, -38);
  await sleep(4000);
  await shot('baothap-west');

  // 7. Close-up of the bamboo base from the southwest
  await cam(-40, 2, -26, -33, 1.2, -33.5);
  await sleep(4000);
  await shot('baothap-bamboo-close');

  // 8. Release camera
  await ev(`window.__co.freeze = false`);
};
