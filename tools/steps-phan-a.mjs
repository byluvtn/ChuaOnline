export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  await ev(`(()=>{const p=document.getElementById('chat');return 1})()`);
  const look = (px, py, pz, tx, ty, tz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${tx},${ty},${tz});return 1})()`);
  await look(-30, 5, -1, -42.6, 2, -1); await sleep(900); await shot('traiduong-close');
  await look(0, 70, 78, 0, 0, -8); await sleep(1200); await shot('pano-south');
  await look(0, 70, -110, 0, 0, -8); await sleep(1200); await shot('pano-north');
  await look(95, 70, -8, 0, 0, -8); await sleep(1200); await shot('pano-east');
  await look(-95, 70, -8, 0, 0, -8); await sleep(1200); await shot('pano-west');
  await look(0, 40, 62, 0, 4, -60); await sleep(1200); await shot('axis');
};
