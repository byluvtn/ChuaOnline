export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const pos = () => ev(`(()=>{const p=window.__co.me().char.root.position;return p.x.toFixed(2)+','+p.z.toFixed(2)})()`);
  const tp = (x, z) => ev(`(()=>{window.__co.me().char.root.position.set(${x},0,${z});return 1})()`);
  for (const z of [-70, -75, -80, -85]) {
    await tp(53, z);
    await sleep(1200);
    console.log('verify tp', z, '->', await pos());
  }
  await tp(53, -66);
  await sleep(800);
  await ev(`window.__co.walkTo(48,-75)`);
  for (let i = 0; i < 8; i++) { await sleep(3000); console.log('verify walk t' + i, await pos()); }
};
