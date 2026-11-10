// Frame each statue from its own world bounding box so the whole figure fits at 390x844.
const COLLECT = `(() => { const gs = []; const walk = (o) => { if (o.userData && o.userData.glow) gs.push(o); o.children && o.children.forEach(walk); }; walk(window.__co.world.scene); return gs; })()`;

export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const frame = (pred, pad = 1.06) => ev(`(()=>{
    const T = window.__co.THREE, cam = window.__co.camera;
    const g = (${COLLECT}).find(${pred});
    if (!g) return 'missing';
    const b = new T.Box3().setFromObject(g);
    const c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3());
    const d = (Math.max(s.y, s.x / cam.aspect) * ${pad}) / (2 * Math.tan((cam.fov * Math.PI) / 360));
    window.__co.freeze = true;
    cam.position.set(c.x, c.y + s.y * 0.02, c.z + d);
    cam.lookAt(c.x, c.y, c.z);
    return JSON.stringify({ c: [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2)], s: [+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)], d: +d.toFixed(2) });
  })()`);
  const head = (pred, yFrac, dist, side = 0, back = 0) => ev(`(()=>{
    const T = window.__co.THREE, cam = window.__co.camera;
    const g = (${COLLECT}).find(${pred});
    if (!g) return 'missing';
    const b = new T.Box3().setFromObject(g);
    const c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3());
    const y = b.min.y + s.y * ${yFrac};
    window.__co.freeze = true;
    cam.position.set(c.x + ${side}, y + 0.1, c.z + ${dist} + ${back});
    cam.lookAt(c.x, y - 0.45, c.z + ${back});
    return 'ok';
  })()`);
  const BUDDHA = `(x) => x.position.x > -10 && x.position.x < 10 && x.position.z < -30`;
  const QUAN = `(x) => x.position.x < -10`;

  console.log('buddha', await frame(BUDDHA));
  await sleep(900); await shot('buddha');
  console.log('quanam', await frame(QUAN));
  await sleep(900); await shot('quanam');
  console.log('buddha-face', await head(BUDDHA, 0.66, 4.4, 0.9));
  await sleep(900); await shot('buddha-face');
  console.log('quanam-face', await head(QUAN, 0.72, 3.4, 1.0));
  await sleep(900); await shot('quanam-face');
};
