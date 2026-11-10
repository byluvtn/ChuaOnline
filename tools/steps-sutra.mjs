export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(4500);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) }); })()`);
  const setPos = (x, z) => ev(`(()=>{ const r = window.__co.me().char.root; r.position.set(${x}, 0, ${z}); })()`);
  const key = async (code, ms) => {
    await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}' }))`);
    await sleep(ms);
    await ev(`window.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}' }))`);
  };
  await cam(0, 2.6, 3.5, 0, 3.2, -16); await sleep(1500); await shot('a-axis-from-plaza');
  await cam(1.0, 2.0, -3.6, 3.4, 2.1, -6.8); await sleep(1200); await shot('b-pillar-closeup');
  await cam(5.4, 2.4, -13.5, 3.4, 2.0, -8.6); await sleep(1200); await shot('b2-pillar-far-side');

  await ev(window.__co.freeze=false);
  await setPos(2.2, -6.8); await sleep(400);
  await key('KeyD', 6000);
  console.log('hold D into east pillar from x=2.2, expect stop at x=2.4', await pos());
  await setPos(-2.2, -6.8); await sleep(400);
  await key('KeyA', 6000);
  console.log('hold A into west pillar from x=-2.2, expect stop at x=-2.4', await pos());
  await setPos(0, -1.2); await sleep(400);
  await key('KeyW', 14000);
  console.log('hold W along axis between rows from (0,-1.2), expect no x drift', await pos());
  await ev(window.__co.freeze=true);
  await shot('c-walk-between-rows');
};