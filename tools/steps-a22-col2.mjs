export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  const q = (x0, x1, z0, z1) => ev(`JSON.stringify(window.__co.world.colliders.filter(c=>c.x>=${x0}&&c.x<=${x1}&&c.z>=${z0}&&c.z<=${z1}).map(c=>({x:+c.x.toFixed(1),z:+c.z.toFixed(1),r:+c.r.toFixed(2)})))`);
  console.log('col amco box', await q(44, 62, -84, -62));
  console.log('col z-68 line', await q(36, 56, -69.5, -66.5));
};
