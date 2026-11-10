export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) }); })()`);
  const setPos = (x, z) => ev(`(()=>{ const r = window.__co.me().char.root; r.position.set(${x}, 0, ${z}); })()`);
  const walkTo = async (x, z, maxMs = 120000) => {
    await ev(`window.__co.walkTo(${x}, ${z})`);
    const t0 = Date.now(); let last = '', still = 0;
    while (Date.now() - t0 < maxMs) {
      await sleep(1500);
      const p = await pos();
      if (p === last) { if (++still >= 2) break; } else still = 0;
      last = p;
    }
    return pos();
  };
  await ev(`window.__co.freeze = true`);
  await cam(20.5, 1.7, 0.2, 20.5, 0.9, -19); await sleep(4000); await shot('a-east-corridor-length');
  await cam(-20.5, 1.7, 0.2, -20.5, 0.9, -19); await sleep(4000); await shot('a2-west-corridor-length');
  await cam(16.6, 1.2, -12.1, 19, 0.85, -12.1); await sleep(4000); await shot('b-closeup-inner');
  await cam(18.5, 1.0, -5.8, 22, 0.8, -5.8); await sleep(4000); await shot('b2-closeup-outer');
  await cam(14.6, 1.1, -17.5, 19, 0.85, -16.4); await sleep(4000); await shot('b3-closeup-variants');

  await setPos(20.5, -0.4); await sleep(2000);
  console.log('start east corridor', await pos());
  console.log('walk down east corridor to z=-18.5, expect arrives', await walkTo(20.5, -18.5));
  await shot('c-walk-east');
  console.log('walk back to z=-0.4', await walkTo(20.5, -0.4));
  await setPos(-20.5, -0.4); await sleep(2000);
  console.log('walk down west corridor to z=-18.5, expect arrives', await walkTo(-20.5, -18.5));
  await shot('c2-walk-west');
};
