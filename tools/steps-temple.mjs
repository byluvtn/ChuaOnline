export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  await cam(0, 4.5, -26, 0, 3.4, -35); await sleep(800); await shot('altar');
  await cam(0, 4.6, -33.2, 0, 3.0, -35.5); await sleep(800); await shot('buddha');
  await cam(-26, 6, -16, -34, 5, -26); await sleep(800); await shot('quanam');
  await cam(-20, 6, 20, -28, 4, 14); await sleep(800); await shot('yard');
  await cam(30, 9, 36, 30, 0, 18); await sleep(800); await shot('lake');
};
