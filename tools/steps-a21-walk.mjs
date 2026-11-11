export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 30 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(2000);
  await ev(`window.__co.freeze = true`);
  await ev(`(()=>{
    const co = window.__co, w = co.world;
    const WALL = { x: 62, zN: -82, zS: 45, gate: 4.4 };
    const clamp = (p) => {
      p.x = Math.max(-WALL.x + 0.8, Math.min(WALL.x - 0.8, p.x));
      p.z = Math.max(WALL.zN + 0.8, Math.min(WALL.zS + 13, p.z));
      if (Math.abs(p.x) > WALL.gate && p.z > WALL.zS - 0.8 && p.z < WALL.zS + 0.8) p.z = p.z < WALL.zS ? WALL.zS - 0.8 : WALL.zS + 0.8;
    };
    const collide = (p) => {
      for (const c of w.colliders) {
        const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = c.r + 0.4;
        if (d < min && d > 0.0001) { p.x = c.x + (dx / d) * min; p.z = c.z + (dz / d) * min; }
      }
      w.resolveWater(p, true);
      clamp(p);
    };
    window.__sim = (sx, sz, pts, tol) => {
      const p = { x: sx, z: sz };
      for (const [tx, tz] of pts) {
        for (let i = 0; i < 4000; i++) {
          const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
          if (d < 0.2) break;
          const s = Math.min(d, 3.8 * 0.05);
          p.x += (dx / d) * s; p.z += (dz / d) * s;
          collide(p);
        }
      }
      const [fx, fz] = pts[pts.length - 1];
      const dist = Math.hypot(p.x - fx, p.z - fz);
      return JSON.stringify({ ok: dist <= tol, x: +p.x.toFixed(2), z: +p.z.toFixed(2), dist: +dist.toFixed(2) });
    };
  })()`);
  const sim = async (name, start, pts, tol = 1.2) => {
    const r = JSON.parse(await ev(`window.__sim(${start[0]}, ${start[1]}, ${JSON.stringify(pts)}, ${tol})`));
    console.log(`@@W ${r.ok ? 'PASS' : 'FAIL'}  ${name}  end=(${r.x},${r.z}) dist=${r.dist}`);
  };
  const blockedCheck = async (name, start, pts, test) => {
    const r = JSON.parse(await ev(`window.__sim(${start[0]}, ${start[1]}, ${JSON.stringify(pts)}, 99)`));
    console.log(`@@W ${test(r) ? 'PASS' : 'FAIL'}  ${name}  end=(${r.x},${r.z})`);
  };

  await sim('cổng Nam ra phố (0,40)->(0,52)', [0, 40], [[0, 44], [0, 52]]);
  await sim('quay vào từ phố (0,52)->(0,38)', [0, 52], [[0, 46], [0, 38]]);
  await sim('vào cổng Viện Khách Tăng', [0, -45], [[-30, -45], [-30, -52], [-30, -60]]);
  await sim('vào cổng Viện Tổ', [0, -45], [[30, -45], [30, -52], [30, -60]]);
  await sim('cửa Nhà khách (-47,-57.5)', [-30, -60], [[-36, -62], [-47, -62], [-47, -57.5]]);
  await sim('cửa Tăng xá (-41,-65.5)', [-30, -60], [[-36, -63], [-41, -65.5]]);
  await sim('cửa Trai đường (-29,-55.5)', [-30, -60], [[-29, -55.5]]);
  await sim('cửa Nhà Tổ (36,-62.5)', [30, -60], [[33, -60], [36, -62.5]]);
  await sim('cửa Am Cổ (50,-72)', [30, -60], [[44, -58], [50, -66], [50, -72]]);
  await sim('cửa Thiền đường (-39.5,-27)', [0, -45], [[-20, -45], [-36, -44], [-39.5, -34], [-39.5, -27]]);
  await sim('cửa Phòng Ghi Công Đức (-42,41.5)', [0, 40], [[-30, 41], [-42, 41.5]]);
  await sim('cửa Điện Mẫu (39,13)', [0, 2], [[45, 2], [45, 14], [39, 14], [39, 13]]);
  await sim('cửa Đền Trình (11,39)', [0, 40], [[11, 40], [11, 39]]);
  await sim('bến Vườn Phóng Sinh (28,-31)', [21, -17], [[21, -31], [28, -31]]);
  await sim('đứng trên bến (33,-31)', [28, -31], [[33, -31]], 1.5);
  await blockedCheck('không xuyên tường Nam (trong ra, x=40)', [40, 40], [[40, 44.5], [40, 52]], (r) => r.z < 46);
  await blockedCheck('không xuyên tường Nam (phố vào, x=40)', [40, 52], [[40, 44.5]], (r) => r.z > 45.4);
  await blockedCheck('không xuyên rào Viện KT (ngoài vào, x=-45)', [-45, -50], [[-45, -53], [-45, -58]], (r) => r.z > -54.5);
  await blockedCheck('không xuyên rào Viện Tổ (ngoài vào, x=45)', [45, -50], [[45, -53], [45, -58]], (r) => r.z > -54.5);
};
