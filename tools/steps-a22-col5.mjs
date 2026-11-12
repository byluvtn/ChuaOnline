export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  console.log('probe type', await ev(`typeof window.__co.world.colliders + ':' + (window.__co.world.colliders && window.__co.world.colliders.length)`));
  const near = (px, pz) => ev(`JSON.stringify(window.__co.world.colliders.map(c=>[c.x,c.z,c.r,Math.hypot(c.x-(${px}),c.z-(${pz}))]).filter(a=>a[3]<a[2]+1.0).map(a=>a.map(v=>Math.round(v*100)/100)))`);
  for (const [x, z] of [[53, -68], [53, -70], [53, -72], [53, -74]]) console.log('col near', x, z, await near(x, z));
};
