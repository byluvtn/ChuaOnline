export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) }); })()`);
  const setPos = (x, z) => ev(`(()=>{ const r = window.__co.me().char.root; r.position.set(${x}, 0, ${z}); })()`);
  const frames = () => ev(`new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2)};requestAnimationFrame(f)})`);
  const key = async (code, ms) => {
    await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}' }))`);
    await sleep(ms);
    await ev(`window.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}' }))`);
  };
  const walkTo = async (x, z, ms) => {
    await ev(`(()=>{ window.__co.walkTo && window.__co.walkTo(${x}, ${z}); })()`);
    await sleep(ms);
  };
  console.log('fps', await frames());
  await cam(1.6, 2.6, 19.5, -6.7, 2.0, 23.2); await sleep(1500); await shot('a-from-bridge');
  await cam(-6.7, 2.0, 21.8, 0, 1.8, 30); await sleep(1500); await shot('b-from-pavilion');
  await cam(-14.5, 3.2, 25.5, -7.0, 1.4, 23); await sleep(1500); await shot('b2-west-bank-entry');
  await cam(-11.5, 6, 26, -10.6, 0, 23); await sleep(1500); await shot('b3-pier-anchor-vs-flowerbed');

  await ev(`window.__co.freeze = false`);
  await setPos(-12.4, 23); await sleep(1500);
  console.log('start west bank', await pos());
  await walkTo(-6.7, 23.8, 9000);
  console.log('after walking from west bank to pavilion floor (expect y~0.77)', await pos());
  console.log('zone', await ev(`window.__co.world.zoneAt(-6.7, 23)`));
  console.log('couplet visible', await ev(`document.getElementById('couplet').classList.contains('show')`));
  await ev(`document.getElementById('sitBtn').click()`); await sleep(2500);
  console.log('after sit (expect seat -6.7,23.8 ry 0)', await pos(), await ev(`window.__co.me().ry`));
  await cam(-9.6, 3.0, 26.6, -6.4, 0.9, 23.2); await sleep(1500); await shot('c-walk-and-sit');
  await ev(`window.__co.freeze = false`);
  await walkTo(-3.0, 23.0, 6000);
  console.log('walk east past pavilion rail (expect stop near x~-5.1)', await pos());
  await walkTo(-6.7, 19.0, 6000);
  console.log('walk north past rail (expect z>=21.7)', await pos());

  await walkTo(-12.4, 23, 9000);
  await walkTo(-12.4, 20, 4000);
  await walkTo(-6.0, 20, 6000);
  console.log('walk from shore into water at (-6,20): expect pushed to rim, never inside lake', await pos());
  await setPos(0, 32); await sleep(1500);
  await walkTo(0, 22, 8000);
  console.log('bridge from south end to apex (expect x~0, z~22, y>1)', await pos());
  await ev(`window.__co.freeze = true`);
  await cam(-4.5, 3.0, 28.5, -1.0, 1.2, 21.0); await sleep(1500); await shot('d-bridge-and-water');
};
