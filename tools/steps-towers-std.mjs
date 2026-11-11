export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  const look = (px, py, pz, tx, ty, tz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${tx},${ty},${tz});return 1})()`);
  await look(28, 8, 34, 28, 6, 14); await sleep(900); await shot('quanam-front');
  await look(14, 7, 24, 28, 6, 14); await sleep(900); await shot('quanam-3q');
  await look(38, 9, 2, 38, 6, -14); await sleep(900); await shot('pagoda-front');
};
