export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  const res = await ev(`(()=>{
    const cols = window.__co.world.colliders;
    const BODY = 0.4;
    const push = (p) => { for (const c of cols) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + BODY; if (d < m && d > 1e-6) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } } };
    const out = {};
    for (const side of [-1, 1]) {
      let minD = Infinity, steps = 0, inside = 0;
      for (let k = 0; k < 6; k++) {
        const sx = side * 22.5, sz = -16.5 + 3 * k;
        for (let a = 0; a < Math.PI * 2; a += 0.05) {
          for (let r = 3; r >= 0.2; r -= 0.1) {
            const p = { x: sx + Math.cos(a) * r, z: sz + Math.sin(a) * r };
            push(p); push(p);
            const d = Math.hypot(p.x - sx, p.z - sz);
            minD = Math.min(minD, d); steps++;
            if (d < 0.42) inside++;
          }
        }
      }
      out[side > 0 ? 'east' : 'west'] = { steps, minD: +minD.toFixed(2), inside, limit: 0.42 };
    }
    return JSON.stringify(out);
  })()`);
  console.log('corridor walk-sim', res);
};
