export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const pos = () => ev(`(()=>{const p=window.__co.me().char.root.position;return p.x.toFixed(2)+','+p.z.toFixed(2)})()`);
  const tp = (x, z) => ev(`(()=>{window.__co.me().char.root.position.set(${x},0,${z});return 1})()`);
  for (const z of [-66, -67, -68, -69, -70, -72]) {
    await tp(53, z);
    await sleep(1200);
    console.log('probe tp', z, '->', await pos());
  }
  await tp(40, -70);
  await sleep(1200);
  console.log('probe tp 40,-70 ->', await pos());
  await tp(60, -70);
  await sleep(1200);
  console.log('probe tp 60,-70 ->', await pos());
};
