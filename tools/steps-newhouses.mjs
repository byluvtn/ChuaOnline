export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  const look = (px, py, pz, tx, ty, tz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${tx},${ty},${tz});return 1})()`);
  await look(39, 4, 22, 39, 2, 10); await sleep(900); await shot('dienmau');
  await look(30, 4, -12, 30, 2, -26); await sleep(900); await shot('nhakhach');
  await look(-40, 4, -24, -40, 2, -39); await sleep(900); await shot('thienduong');
  await look(-10, 25, 20, -10, 0, -30); await sleep(900); await shot('overview-w');
};
