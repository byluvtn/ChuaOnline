export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 30 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(2000);
  await ev(`window.__co.freeze = true`);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const pos = () => ev(`(()=>{ const p = window.__co.me().char.root.position; return JSON.stringify({ x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) }); })()`);
  const setPos = (x, z) => ev(`(()=>{ window.__co.me().char.root.position.set(${x}, 0, ${z}); })()`);
  const walkTo = async (x, z, maxMs = 90000) => {
    await ev(`window.__co.walkTo(${x}, ${z})`);
    const t0 = Date.now(); let last = '', still = 0;
    while (Date.now() - t0 < maxMs) {
      await sleep(1500);
      const p = await pos();
      if (p === last) { if (++still >= 2) break; } else still = 0;
      last = p;
    }
    return JSON.parse(await pos());
  };
  const near = (p, x, z, tol = 2.5) => Math.hypot(p.x - x, p.z - z) <= tol;
  const report = (name, ok, extra = '') => console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${extra}`);

  const arhat = await ev(`(()=>{ const g = window.__co.world?.scene?.getObjectByName?.('arhats') ?? null; if (!g) return 'no-group'; const pos = []; g.traverse((o) => { if (o.isGroup && o !== g && o.parent === g) pos.push(o.position.x); }); return JSON.stringify({ west: pos.filter((x) => x < 0).length, east: pos.filter((x) => x > 0).length, total: pos.length }); })()`);
  console.log('ARHAT group (nhóm con trực tiếp, gồm cả bệ):', arhat);

  await cam(75, 62, 70, 0, 0, -20); await sleep(4000); await shot('a21-overview');
  await cam(-40, 14, -42, -40, 1.5, -66); await sleep(4000); await shot('a21-vien-kt');
  await cam(40, 14, -44, 44, 1.5, -68); await sleep(4000); await shot('a21-vien-to');
  await cam(-24, 3.2, -26, -47, 2.2, -27); await sleep(4000); await shot('a21-thien-duong');
  await cam(24, 3, -31, 41, 0.4, -31); await sleep(4000); await shot('a21-phong-sinh');
  await cam(0, 2.2, 43, 0, 2.5, 56); await sleep(4000); await shot('a21-pho');
  await cam(20.5, 1.7, 0.2, 20.5, 0.9, -19); await sleep(4000); await shot('a21-hanh-lang');
  await ev(`document.querySelector('#menu [aria-label="Bản đồ chùa"], #menu [title="Bản đồ chùa"]')?.click()`);
  const hasPanel = await ev(`String(!document.getElementById('panel').hidden)`);
  if (hasPanel !== 'true') await ev(`(()=>{ const b=[...document.querySelectorAll('#menu button')].find(x=>/Bản đồ chùa/.test(x.textContent+x.title+(x.getAttribute('aria-label')||''))); b?.click(); })()`);
  await sleep(1500); await shot('a21-map');
  await ev(`document.getElementById('panel').hidden = true`);

  console.log('--- đi bộ kiểm ---');
  await setPos(0, 40); await sleep(1500);
  let p = await walkTo(0, 52);
  report('cổng Nam ra phố (0,52)', near(p, 0, 52), JSON.stringify(p));
  p = await walkTo(0, 38);
  report('quay vào từ phố (0,38)', near(p, 0, 38), JSON.stringify(p));

  await setPos(0, -45); await sleep(1500);
  p = await walkTo(VIEN_KT_GATE_X(), -60);
  report('vào cổng Viện Khách Tăng (-30,-60)', near(p, -30, -60), JSON.stringify(p));
  await setPos(0, -45); await sleep(1500);
  p = await walkTo(30, -60);
  report('vào cổng Viện Tổ (30,-60)', near(p, 30, -60), JSON.stringify(p));

  const doors = [
    ['Nhà khách', -47, -55.5], ['Tăng xá', -41, -65.5], ['Trai đường', -29, -55.5],
    ['Nhà Tổ', 36, -62.5], ['Am Cổ', 50, -72], ['Thiền đường', -39.5, -27],
    ['Phòng Ghi Công Đức', -42, 41.5], ['Điện Mẫu', 39, 10], ['Đền Trình', 11, 39],
  ];
  for (const [name, x, z] of doors) {
    await setPos(0, 3); await sleep(1000);
    p = await walkTo(x, z, 120000);
    report(`tới cửa ${name} (${x},${z})`, near(p, x, z, 3), JSON.stringify(p));
  }

  await setPos(0, 3); await sleep(1000);
  p = await walkTo(28, -31, 120000);
  report('bến Vườn Phóng Sinh (28,-31)', near(p, 28, -31, 3), JSON.stringify(p));
  p = await walkTo(33, -31, 30000);
  report('đứng trên bến (33,-31)', near(p, 33, -31, 2), JSON.stringify(p));

  await setPos(-30, -50); await sleep(1000);
  p = await walkTo(-30, -75, 20000);
  console.log('xuyên rào Viện KT từ cổng đi thẳng Bắc tới (-30,-75):', JSON.stringify(p));
  await setPos(-45, -50); await sleep(1000);
  p = await walkTo(-45, -75, 20000);
  report('không xuyên rào Viện KT (đứng ngoài, đi thẳng Bắc)', p.z > -54.5, JSON.stringify(p));
  await setPos(0, 40); await sleep(1000);
  p = await walkTo(40, 52, 20000);
  report('không xuyên tường Nam phía Đông cổng', p.z < 46, JSON.stringify(p));
  await setPos(0, 52); await sleep(1000);
  p = await walkTo(40, 40, 20000);
  report('không xuyên tường Nam từ phố vào', p.z > 44, JSON.stringify(p));
};

function VIEN_KT_GATE_X() { return -30; }
