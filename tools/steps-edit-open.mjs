export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const shots = [
    { name: 'amco-front', p: [-30, 3.2, -49, -38, 1.8, -50] },
    { name: 'amco-side', p: [-36, 2.4, -41, -38, 1.8, -50] },
    { name: 'nhato-front', p: [10, 3.2, -47, 10, 1.8, -56] },
    { name: 'nhato-side', p: [19, 2.6, -53, 10, 1.8, -56] },
  ];
  for (const s of shots) { await cam(...s.p); await sleep(2500); await shot(s.name); }
};
