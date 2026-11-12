export default async ({ ev, sleep, send }) => {
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  await ev(`window.__co.freeze = true`);
  await metrics(320, 200); await sleep(8000); await metrics(1280, 800); await sleep(3000);
  const res = await ev(`(()=>{
    const g = window.__co.world.scene.getObjectByName('arhats');
    const out = [];
    for (const c of g.children) {
      let gold = 0, meshes = 0, tris = 0;
      c.traverse((o) => { if (o.isMesh) { meshes++; tris += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; if (o.material && o.material.metalness === 1) gold++; } });
      out.push({ x: +c.position.x.toFixed(2), y: +c.position.y.toFixed(2), z: +c.position.z.toFixed(2), meshes, gold, tris: Math.round(tris) });
    }
    return JSON.stringify(out);
  })()`);
  console.log('slots', res);
};
