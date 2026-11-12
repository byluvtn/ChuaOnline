export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  const near = (px, pz) => ev(`(()=>{try{const out=[];for(const c of window.__co.world.colliders){const d=Math.hypot(c.x-${px},c.z-${pz});if(d<c.r+1.0)out.push(c.x.toFixed(1)+','+c.z.toFixed(1)+',r'+c.r.toFixed(2)+',d'+d.toFixed(2))}return out.join(' | ')||'none'}catch(e){return 'ERR '+e.message}})()`);
  for (const [x, z] of [[53, -68], [53, -70], [53, -72], [53, -74]]) console.log('col near', x, z, await near(x, z));
};
