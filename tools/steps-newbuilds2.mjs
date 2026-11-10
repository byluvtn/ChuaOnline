export default async ({ ev, shot, sleep, send }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const shots = [
    { name: 'amco-front', p: [-30, 3.2, -49, -38, 1.8, -50] },
    { name: 'amco-oblique', p: [-32, 5, -44, -38, 1.5, -50] },
    { name: 'nhato-front', p: [10, 3.2, -47, 10, 1.8, -56] },
    { name: 'nhato-oblique', p: [17, 5, -49, 10, 1.5, -56] },
    { name: 'tangxa-front', p: [22, 3.2, -47, 22, 1.8, -56] },
    { name: 'vuonthap-front', p: [36, 3.5, -38, 36, 1.8, -48] },
    { name: 'vuonthap-oblique', p: [29, 4.5, -42, 36, 1.5, -48] },
  ];
  for (const s of shots) {
    await cam(s.p[0], s.p[1], s.p[2], s.p[3], s.p[4], s.p[5]);
    await sleep(2500);
    await shot(s.name);
  }
};
