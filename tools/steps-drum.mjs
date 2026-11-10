export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  await cam(0, 5.5, 14, 0, 2.5, -6); await sleep(1200); await shot('plaza-both');
  await cam(34, 3.2, 3.5, 34, 2.4, -6); await sleep(1200); await shot('front');
  await cam(24, 5.5, 4, 34, 2.4, -6); await sleep(1200); await shot('threequarter');
  await ev(`window.__co.world.ringDrum()`); await sleep(150); await shot('hit');
};
