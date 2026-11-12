export default async ({ ev, shot, sleep, send }) => {
  const metrics = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const settle = async (ms = 5000) => { await metrics(320, 200); await sleep(ms); await metrics(1280, 800); await sleep(3000); };

  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  await ev(`window.__co.freeze = true`);
  await settle(8000);

  // Nhà Khách (-47, -61), cửa (-47, -57.75): đứng sát cửa, nhìn vào tâm nhà (bàn trà)
  await cam(-47, 1.6, -58.2, -47, 0.5, -61); await sleep(4000); await shot('a23-nha-khach-tea');

  // Tăng Xá (-41, -71), giường ở z = -73.05: đứng phía Nam, nhìn dọc tường hậu
  await cam(-41, 1.6, -68.4, -41, 0.5, -73.05); await sleep(4000); await shot('a23-tang-xa-beds');

  // Trai Đường (-29, -61), cửa (-29, -58.25): nhìn dọc bàn ăn dài
  await cam(-29, 1.6, -58.6, -29, 0.6, -61); await sleep(4000); await shot('a23-trai-duong-table');

  // Nhà Tổ (36, -68), cửa (36, -64.75): nhìn án gian, bài vị, lư hương, bình hoa, 2 ghế
  await cam(36, 1.6, -65.2, 36, 0.9, -68); await sleep(4000); await shot('a23-nha-to-altar');

  // Am Cổ (53, -75), mở mặt Đông: nhìn vào giường nhỏ (51.7, -75), bồ đoàn, bàn trà mini
  await cam(55.8, 1.6, -75, 51.7, 0.7, -75); await sleep(4000); await shot('a23-am-co');

  // Thiền Đường (-47, -27), cửa world (-40.5, -27): nhìn dọc 2 dãy bồ đoàn về phía mõ/lư hương (-52.3, -27.95)
  await cam(-41, 1.6, -27, -52.3, 0.5, -27.95); await sleep(4000); await shot('a23-thien-duong-rows');

  // Thiền Đường: đi tới 1 bồ đoàn rồi đợi nhân vật ngồi, sau đó chụp
  await ev(`window.__co.freeze = false`);
  await ev(`window.__co.walkTo(-49, -26)`);
  await sleep(12000);
  await ev(`window.__co.freeze = true`);
  const me = JSON.parse(await ev(`JSON.stringify({x: window.__co.me().char.root.position.x, z: window.__co.me().char.root.position.z, anim: window.__co.me().anim})`));
  console.log('a23-thien-duong-sit char', JSON.stringify(me));
  await cam(me.x + 2.2, 1.5, me.z + 1.6, me.x, 0.6, me.z); await sleep(4000); await shot('a23-thien-duong-sit');

  // Phòng Công Đức (-42, 35), cửa (-42, 38.5): nhìn bàn dài + ghế trực (-42, 32.6) + kệ sổ ghi
  await cam(-42, 1.6, 38.0, -42, 0.8, 33); await sleep(4000); await shot('a23-phong-cd');

  await ev(`window.__co.freeze = false`);
};
