export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(4500);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const setMe = (x, z) => ev(`(()=>{const r=window.__co.me().char.root;r.position.set(${x},0,${z});r.rotation.y=Math.PI;})()`);
  await cam(0, 6.5, 64, 0, 6.0, 45); await sleep(1200); await shot('a-front');
  await cam(16, 5.5, 34, 0, 6.0, 45); await sleep(1200); await shot('b-threequarter-inside');
  await setMe(7.6, 44.2); await ev(`window.__co.me().ry=Math.PI`); await sleep(800);
  await cam(12.5, 1.9, 40.5, 7.6, 1.3, 45); await sleep(1000); await shot('c-in-side-passage');
};
