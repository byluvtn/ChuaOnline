export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const pos = () => ev(`(()=>{const p=window.__co.me().char.root.position;return JSON.stringify({x:+p.x.toFixed(1),z:+p.z.toFixed(1)})})()`);
  const tp = (x, z) => ev(`(()=>{window.__co.me().char.root.position.set(${x},0,${z});return 1})()`);
  const walk = async (name, sx, sz, tx, tz, ms) => {
    await tp(sx, sz);
    await sleep(500);
    await ev(`window.__co.walkTo(${tx},${tz})`);
    await sleep(ms);
    console.log('walk', name, 'target', tx, tz, 'end', await pos());
  };
  const bx = 27 + Math.cos(Math.PI / 2) * 6.2, bz = 31 + Math.sin(Math.PI / 2) * 6.2;
  await walk('bench-near', 27, 24, bx, bz - 1.2, 20000);
  await walk('bench-through', 27, bz - 3, bx, bz + 2, 20000);
  await walk('am-co-enter', 46, -75, 53, -75, 25000);
  await walk('am-co-wall', 53, -70, 53, -80, 25000);
};
