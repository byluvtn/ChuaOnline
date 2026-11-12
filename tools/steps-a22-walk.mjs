export default async ({ ev, shot, sleep }) => {
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
  await walk('nha-khach-wall', -30, -56, -47, -56, 25000);
  await walk('tang-xa-wall', -30, -66, -41, -66, 25000);
  await walk('nha-to-front', 36, -50, 36, -62, 25000);
  await walk('am-co-front', 40, -75, 55, -75, 25000);
  await walk('bench-rest', 0, 20, 17, 30, 25000);
  await walk('arhat-row', 0, -10, 8, -10, 20000);
};
