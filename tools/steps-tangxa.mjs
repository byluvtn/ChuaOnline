export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  const look = (px, py, pz, tx, ty, tz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${tx},${ty},${tz});return 1})()`);
  await look(-26, 9, -8, -42, 2, -8); await sleep(900); await shot('front');
  await look(-30, 5, -14, -42.6, 2, -14.5); await sleep(900); await shot('tangxa-close');
  await look(-30, 5, -1, -42.6, 2, -1); await sleep(900); await shot('traiduong-close');
  await look(-30, 14, 8, -44, 0, -8); await sleep(900); await shot('oblique-s');
  await look(-38, 22, -40, -44, 0, -8); await sleep(900); await shot('oblique-n');
  await look(-5, 30, 10, -40, 0, -8); await sleep(900); await shot('overview-e');
};
