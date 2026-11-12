export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const pos = () => ev(`(()=>{const p=window.__co.me().char.root.position;return p.x.toFixed(2)+','+p.z.toFixed(2)})()`);
  const tp = (x, z) => ev(`(()=>{window.__co.me().char.root.position.set(${x},0,${z});return 1})()`);
  await tp(53, -68);
  await sleep(800);
  console.log('path start', await pos());
  await ev(`window.__co.walkTo(53,-72)`);
  for (let i = 0; i < 12; i++) { await sleep(2500); console.log('path t' + i, await pos()); }
  await tp(53, -69);
  await sleep(800);
  await ev(`window.__co.walkTo(53,-71)`);
  for (let i = 0; i < 6; i++) { await sleep(2500); console.log('path2 t' + i, await pos()); }
  await tp(53, -60);
  await sleep(800);
  await ev(`window.__co.walkTo(53,-72)`);
  for (let i = 0; i < 12; i++) { await sleep(3000); console.log('path3 t' + i, await pos()); }
};
