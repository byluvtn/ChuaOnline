export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  const res = await ev(`(()=>{
    const cols = window.__co.world.colliders;
    const sx = 43.6, sz = -60.7, R = 1.2, BODY = 0.4;
    const push = (p) => { for (const c of cols) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + BODY; if (d < m && d > 1e-6) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } } };
    let minD = Infinity, inside = 0, steps = 0;
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      for (let r = 6; r >= 0.2; r -= 0.1) {
        const p = { x: sx + Math.cos(a) * r, z: sz + Math.sin(a) * r };
        push(p); push(p);
        const d = Math.hypot(p.x - sx, p.z - sz);
        minD = Math.min(minD, d); steps++;
        if (d < R) inside++;
      }
    }
    return JSON.stringify({ steps, minD: +minD.toFixed(2), inside, limit: R });
  })()`);
  console.log('walk-around', res);
};
