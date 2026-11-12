export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  const near = (px, pz) => ev(`JSON.stringify(window.__co.world.colliders.filter(c=>Math.hypot(c.x-${px},c.z-${pz})<c.r+0.4+0.6).map(c=>({x:+c.x.toFixed(1),z:+c.z.toFixed(1),r:+c.r.toFixed(2),d:+Math.hypot(c.x-${px},c.z-${pz}).toFixed(2)})))`);
  console.log('col near 53,-68', await near(53, -68));
  console.log('col near 53,-70', await near(53, -70));
  console.log('col near 53,-72', await near(53, -72));
  console.log('col near 53,-74', await near(53, -74));
};
