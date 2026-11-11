export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  const pos = () => ev(`(()=>{const p=window.__co.me().char.root.position;return p.x.toFixed(2)+','+p.z.toFixed(2)+','+p.y.toFixed(2)})()`);
  const tp = (x, z) => ev(`(()=>{window.__co.me().char.root.position.set(${x},0,${z});return 1})()`);
  for (const [name, dx, z] of [['tangxa', -35, -14.5], ['traiduong', -35, -1]]) {
    await tp(dx, z); await sleep(400);
    await ev(`window.__co.walkTo(-42.6, ${z})`);
    await sleep(6000);
    console.log(name, 'toward center ->', await pos());
    await ev(`window.__co.walkTo(-44.5, ${z})`);
    await sleep(3000);
    console.log(name, 'toward back wall ->', await pos());
    await ev(`window.__co.walkTo(-39.4, ${z - 5})`);
    await sleep(5000);
    console.log(name, 'toward front wall off-door ->', await pos());
  }
  await ev(`(()=>{const c=window.__co.camera;window.__co.freeze=false;return 1})()`);
  await sleep(500);
  await shot('walk-inside');
};
