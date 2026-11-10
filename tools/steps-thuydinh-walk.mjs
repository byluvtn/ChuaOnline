export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) }); })()`);
  const setPos = (x, z) => ev(`(()=>{ const r = window.__co.me().char.root; r.position.set(${x}, 0, ${z}); })()`);
  const walkTo = async (x, z, maxMs = 90000) => {
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
  await setPos(-12.4, 23); await sleep(2000);
  console.log('start west bank', await pos());
  console.log('walk onto ramp/pier to (-8.2,23)', await walkTo(-8.2, 23));
  console.log('walk onto pavilion floor (-6.7,23.8), expect y=0.77', await walkTo(-6.7, 23.8));
  console.log('zone', await ev(`window.__co.world.zoneAt(-6.7, 23.8)`));
  console.log('couplet visible', await ev(`document.getElementById('couplet').classList.contains('show')`));
  await ev(`document.getElementById('sitBtn').click()`); await sleep(3000);
  console.log('after sit: pos/ry/anim', await pos(), (await ev(`window.__co.me().ry`)).toFixed(2), await ev(`window.__co.me().anim`));
  await cam(-9.4, 2.8, 26.4, -6.5, 0.9, 23.3); await sleep(4000); await shot('c-walk-and-sit');
  console.log('walk east toward bridge (-2,23), expect stop at rail x<=-4.7', await walkTo(-2, 23));
  console.log('walk north out of pavilion (-6.7,19), expect z>=21.6', await walkTo(-6.7, 19));
  console.log('walk south out of pavilion (-6.7,27), expect z<=24.4', await walkTo(-6.7, 27));
  console.log('back to bank', await walkTo(-12.4, 23));
  console.log('walk along bank north', await walkTo(-12.4, 19.5));
  console.log('walk into open water (-5,19.5), expect stop at shore (outside ellipse)', await walkTo(-5, 19.5));
  console.log('inLake after water test', await ev(`(()=>{const p=window.__co.me().char.root.position;return ((p.x)/9)**2+((p.z-22)/6.5)**2})()`));
  await setPos(0, 31); await sleep(2000);
  console.log('walk onto bridge to apex (0,22), expect x~0, y~1.5', await walkTo(0, 22));
  await shot('d-walk-bridge');
};
