export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  await cam(34, 4.2, 6.5, 34, 4.8, -6); await sleep(1200); await shot('drum-front');
  await cam(26, 8, 3, 34, 4.8, -6); await sleep(1200); await shot('drum-3q');
  await cam(-34, 4.2, 6.5, -34, 4.8, -6); await sleep(1200); await shot('bell-front');
  await cam(-26, 8, 3, -34, 4.8, -6); await sleep(1200); await shot('bell-3q');
  await cam(0, 9, 22, 0, 4, -6); await sleep(1200); await shot('both-from-plaza');
  await cam(0, 14, 6, 0, 3, -6); await sleep(1200); await shot('both-wide');
};
