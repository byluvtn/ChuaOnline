export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const pos = () => ev(`(()=>{const p=window.__co.me().char.root.position;return JSON.stringify({x:+p.x.toFixed(1),z:+p.z.toFixed(1)})})()`);
  const tp = (x, z) => ev(`(()=>{window.__co.me().char.root.position.set(${x},0,${z});return 1})()`);
  const trace = async (name, sx, sz, tx, tz, n, step) => {
    await tp(sx, sz);
    await sleep(500);
    await ev(`window.__co.walkTo(${tx},${tz})`);
    const out = [];
    for (let i = 0; i < n; i++) { await sleep(step); out.push(await pos()); }
    console.log('trace', name, 'target', tx, tz, out.join(' '));
  };
  await trace('am-co-front', 53, -68, 53, -72, 6, 6000);
  await trace('bench-wall', 27, 33, 27, 38.5, 6, 6000);
  await trace('am-co-wall-n', 53, -70, 53, -62, 6, 6000);
};
