export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) }); })()`);
  const setPos = (x, z) => ev(`(()=>{ const r = window.__co.me().char.root; r.position.set(${x}, 0, ${z}); })()`);
  const key = async (code, ms) => {
    await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}' }))`);
    await sleep(ms);
    await ev(`window.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}' }))`);
  };
  await cam(0, 5.5, 62, 0, 5.5, 45); await sleep(1200); await shot('a-front');
  await cam(14, 4.5, 36, 0, 5.5, 45); await sleep(1200); await shot('b-threequarter-inside');
  await setPos(7.6, 41); await sleep(400);
  await cam(7.6, 2.6, 52, 7.6, 2.0, 45); await sleep(800);
  console.log('start side passage', await pos());
  await key('KeyS', 1800);
  console.log('after S through side passage (should pass)', await pos());
  await setPos(6.5, 47); await sleep(300);
  await key('KeyD', 1200);
  console.log('after D into side pillar from side passage (should be blocked)', await pos());
  await setPos(7.6, 43); await sleep(300);
  await cam(7.6, 2.4, 40, 7.6, 2.2, 46); await sleep(800);
  await setPos(7.6, 45); await sleep(300);
  console.log('zone at gate', await ev(`window.__co.world.zoneAt(0, 45)`));
  await cam(7.6, 2.4, 51, 7.6, 2.6, 45); await sleep(1000); await shot('c-in-side-passage');
};
