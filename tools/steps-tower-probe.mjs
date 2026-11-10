export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const info = await ev(`(()=>{
    const w = window.__co.world, THREE = window.__co.THREE;
    const out = [];
    w.scene.traverse((o) => {
      if (o.userData && o.userData.sealFiller) {
        const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
        if (Math.abs(c.x - 34) < 7 && Math.abs(c.z + 6) < 7) out.push({ c: [+c.x.toFixed(1), +c.y.toFixed(1), +c.z.toFixed(1)], s: [+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)] });
      }
    });
    out.sort((a, b) => Math.max(...b.s) - Math.max(...a.s));
    return JSON.stringify({ n: out.length, biggest: out.slice(0, 8) });
  })()`);
  console.log('drum fillers', info);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  await cam(34, 9, 22, 34, 4.5, -6); await sleep(1200); await shot('drum-from-south');
  await cam(10, 9, 14, 0, 4.5, -6); await sleep(1200); await shot('plaza-wide');
  await cam(34, 4, -22, 34, 4.5, -6); await sleep(1200); await shot('drum-from-north');
};
