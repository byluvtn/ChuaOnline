export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  await cam(-3, 3.2, 54, 7, 2.2, 40); await sleep(1200); await shot('a-outside-gate-v2');
  await cam(-1, 2.4, 49, 10, 2.0, 40); await sleep(1200); await shot('a-through-gate');
  await cam(3.2, 2.6, 39, 11, 1.8, 39); await sleep(1200); await shot('b-axis-front-v2');
};
