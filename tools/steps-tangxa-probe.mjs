export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  const pos = () => ev(`(()=>{const p=window.__co.me().char.root.position;return p.x.toFixed(2)+','+p.z.toFixed(2)+',y='+p.y.toFixed(2)})()`);
  const tp = (x, z) => ev(`(()=>{window.__co.me().char.root.position.set(${x},0,${z});return 1})()`);
  const run = async (label, sx, sz, tx, tz, secs) => {
    await tp(sx, sz); await sleep(300);
    await ev(`window.__co.walkTo(${tx}, ${tz})`);
    await sleep(secs * 1000);
    console.log(label, `[${sx},${sz}]->[${tx},${tz}]`, await pos());
  };
  await run('tangxa off-door wall A', -41.0, -11.0, -44.5, -11.0, 20);
  await run('tangxa off-door wall B', -41.0, -18.0, -44.5, -18.0, 20);
  await run('tangxa side (north end)', -42.6, -19.5, -42.6, -24, 25);
};
