export default async ({ ev, shot, sleep, send }) => {
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const settle = async (ms = 5000) => { await metrics(320, 200); await sleep(ms); await metrics(1280, 800); await sleep(3000); };
  const openMap = async () => { await ev(`document.querySelector('#menu [data-menu="map"]').click()`); await sleep(1200); };

  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  await ev(`window.__co.freeze = true`);
  await settle(8000);

  console.log('gold count', await ev(`(()=>{ const g = window.__co.world.scene.getObjectByName('arhats'); if (!g) return 'missing'; let meshes = 0, gold = 0, tris = 0; g.traverse((o) => { if (o.isMesh) { meshes++; const gm = o.geometry; tris += gm.index ? gm.index.count / 3 : gm.attributes.position.count / 3; if (o.material && o.material.metalness === 1) gold++; } }); return JSON.stringify({ children: g.children.length, meshes, gold, tris: Math.round(tris) }); })()`));

  await cam(20.5, 2.2, 1.5, 20.5, 0.9, -19); await sleep(4000); await shot('wide-east');
  await cam(-20.5, 2.2, 1.5, -20.5, 0.9, -19); await sleep(4000); await shot('wide-west');
  await cam(0, 6, 4, 0, 0.5, -10); await sleep(4000); await shot('wide');

  const names = ['arhat-binh', 'monk-go', 'guanyin-ngoi', 'guanyin-go-minh'];
  // west side (side=-1): idx = k % 4 -> k=0..3 ; x = -22.5 ; z = -16.5 + 3k ; camera at x=-19.2 looks toward -x
  for (let k = 0; k < 4; k++) {
    const z = -16.5 + 3 * k;
    await cam(-18.8, 1.1, z, -22.5, 0.95, z); await sleep(3500);
    await shot(`close-${names[k]}`);
  }
  // east side (side=+1): idx = (k+2)%4 ; x = 22.5 ; camera at x=19.2 looks toward +x
  for (let k = 0; k < 4; k++) {
    const z = -16.5 + 3 * k;
    await cam(18.8, 1.1, z, 22.5, 0.95, z); await sleep(3500);
    await shot(`east-k${k}-${names[(k + 2) % 4]}`);
  }
  await ev(`window.__co.freeze = false`);
  await openMap();
  await shot('map');
};
