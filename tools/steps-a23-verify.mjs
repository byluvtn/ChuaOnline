export default async ({ ev, sleep, send }) => {
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: false });
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 30 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(2000);

  // 1) Đi bộ từ cửa vào prop chính của từng nhà (tọa độ cửa/tâm từ layout.ts)
  const houses = [
    { name: 'nha-to', door: [36, -64.75], main: [36, -68] },
    { name: 'tang-xa', door: [-41, -68], main: [-41, -71] },
    { name: 'am-co', door: [56.25, -75], main: [53, -75] },
    { name: 'nha-khach', door: [-47, -57.75], main: [-47, -61] },
    { name: 'thien-duong', door: [-40.5, -27], main: [-47, -27] },
    { name: 'trai-duong', door: [-29, -58.25], main: [-29, -61] },
    { name: 'phong-cong-duc', door: [-42, 38.5], main: [-42, 35] },
  ];
  for (const h of houses) {
    await ev(`window.__co.walkTo(${h.door[0]}, ${h.door[1] + (h.name === 'thien-duong' ? 0 : 1.2)})`);
    await sleep(14000);
    await ev(`window.__co.walkTo(${h.main[0]}, ${h.main[1]})`);
    await sleep(8000);
    const p = JSON.parse(await ev(`JSON.stringify({x: window.__co.me().char.root.position.x, z: window.__co.me().char.root.position.z})`));
    console.log('walk', h.name, 'target', JSON.stringify(h.main), 'end', JSON.stringify({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) }));
  }

  // 2) Kiểm xâm nhập collider quanh prop mới (thân người BODY 0.4)
  const res = await ev(`(()=>{
    const cols = window.__co.world.colliders;
    const BODY = 0.4;
    const push = (p) => { for (const c of cols) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + BODY; if (d < m && d > 1e-6) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } } };
    const centers = ${JSON.stringify(houses.map((h) => ({ name: h.name, x: h.main[0], z: h.main[1] })))};
    const out = {};
    for (const c0 of centers) {
      let steps = 0, inside = 0;
      for (const c of cols) {
        if (Math.hypot(c.x - c0.x, c.z - c0.z) > 6) continue;
        for (let a = 0; a < Math.PI * 2; a += 0.05) {
          for (let r = 1.5; r >= 0.1; r -= 0.1) {
            const p = { x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r };
            push(p); push(p);
            steps++;
            if (Math.hypot(p.x - c.x, p.z - c.z) < c.r + BODY - 0.02) inside++;
          }
        }
      }
      out[c0.name] = { steps, inside };
    }
    return JSON.stringify(out);
  })()`);
  console.log('collider penetration (muc tieu inside = 0)', res);

  // 3) Ngồi thử 1 bồ đoàn thiền đường
  await ev(`window.__co.walkTo(-49, -26)`);
  await sleep(12000);
  const sit = await ev(`(()=>{
    const co = window.__co, m = co.me();
    const r = m.char.root;
    return JSON.stringify({ x: +r.position.x.toFixed(2), y: +r.position.y.toFixed(2), z: +r.position.z.toFixed(2), ry: +r.rotation.y.toFixed(3), anim: m.anim, sitApi: typeof co.sit });
  })()`);
  console.log('thien-duong sit state', sit);
  const sit2 = await ev(`(()=>{
    const co = window.__co;
    if (typeof co.sit === 'function') { try { co.sit(); } catch (e) { return 'sit error ' + e; } }
    return 'done';
  })()`);
  console.log('sit call', sit2);
  await sleep(3000);
  console.log('thien-duong after sit', await ev(`(()=>{
    const m = window.__co.me(), r = m.char.root;
    const fx = Math.sin(r.rotation.y), fz = Math.cos(r.rotation.y);
    return JSON.stringify({ x: +r.position.x.toFixed(2), y: +r.position.y.toFixed(2), z: +r.position.z.toFixed(2), ry: +r.rotation.y.toFixed(3), fwd: [+fx.toFixed(2), +fz.toFixed(2)], anim: m.anim, note: 'mo/lu huong o world (-52.3,-27.95), tuc local -z' });
  })()`));

  // 4) Bảng mesh/tri từng nhà + nội thất
  const cost = (names) => ev(`JSON.stringify((()=>{const sc=window.__co.world.scene;const names=${JSON.stringify(names)};let m=0,t=0;
    const tri=(o)=>{const g=o.geometry;return g.index?g.index.count/3:g.attributes.position.count/3};
    for(const n of names){const r=sc.getObjectByName(n);if(!r)continue;r.traverse(o=>{if(o.isMesh){m+=1;t+=tri(o)*(o.isInstancedMesh?o.count:1)}})}
    return {meshes:m,tris:Math.round(t)}})())`);
  const all = await ev(`JSON.stringify((()=>{const sc=window.__co.world.scene;let m=0,t=0;sc.traverse(o=>{if(o.isMesh&&o.visible){m++;const g=o.geometry;t+=(g.index?g.index.count/3:g.attributes.position.count/3)*(o.isInstancedMesh?o.count:1)}});return {meshes:m,tris:Math.round(t)}})())`);
  console.log('SCENE total', all);
  for (const n of ['nha-to', 'tang-xa', 'dien-mau', 'nha-khach', 'thien-duong', 'trai-duong', 'phong-cong-duc', 'am-co']) {
    console.log(n, await cost([n]));
  }
  // Nội thất am cổ đã gộp vào group 'am-co' (không có group 'am-co-in').
  for (const n of ['nha-to', 'tang-xa', 'nha-khach', 'thien-duong', 'trai-duong', 'phong-cong-duc']) {
    console.log(n + '-in', await cost([n + '-in']));
  }
};
