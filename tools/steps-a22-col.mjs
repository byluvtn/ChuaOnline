export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  const q = (cx, cz, r) => ev(`JSON.stringify(window.__co.world.colliders.filter(c=>Math.hypot(c.x-${cx},c.z-${cz})<${r}).map(c=>({x:+c.x.toFixed(1),z:+c.z.toFixed(1),r:+c.r.toFixed(2)})))`);
  console.log('col bench', await q(27, 37.2, 3));
  console.log('col amco', await q(53, -70, 6));
  console.log('col total', await ev(`String(window.__co.world.colliders.length)`));
};
