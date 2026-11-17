// Walk sim: no-regression check for the Tam The stair fix (news 22).
// Simulates a 2D walk against world.colliders (same harness as steps-a21-walk.mjs):
// plaza -> stair base -> up the stairs -> platform -> inside the hall (0,-66).
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
    window.__gy = () => {
      const pts = [[0,-48],[0,-50],[0,-53],[0,-56],[0,-58],[0,-66]];
      return pts.map(([x,z]) => z + ':' + (typeof w.groundY === 'function' ? +w.groundY(x,z).toFixed(2) : '?')).join(' ');
    };
  })()`);
  const sim = async (name, start, pts, tol = 1.2) => {
    const r = JSON.parse(await ev(`window.__sim(${start[0]}, ${start[1]}, ${JSON.stringify(pts)}, ${tol})`));
    console.log(`@@W ${r.ok ? 'PASS' : 'FAIL'}  ${name}  end=(${r.x},${r.z}) dist=${r.dist}`);
  };
  await sim('len thang Tam The (0,-44)->(0,-66)', [0, -44], [[0, -50], [0, -53], [0, -58], [0, -66]]);
  await sim('cua Tam The (0,-44)->(0,-68)', [0, -44], [[0, -50], [0, -58], [0, -68]]);
  console.log('@@GY ' + await ev(`window.__gy()`));
};
