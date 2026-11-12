export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  await ev(`(()=>{window.__co.me().char.root.position.set(48,0,-75);return 1})()`);
  await sleep(4000);
  await shot('amco-inside');
};
