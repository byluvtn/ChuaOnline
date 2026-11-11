export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`localStorage.removeItem('co:menuCollapsed'); 1`);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  await ev(`window.__co.freeze = true; 1`);
  console.log('touch =', await ev(`String(document.body.classList.contains('touch'))`), '| chat =', await ev(`JSON.stringify(document.getElementById('chat').getBoundingClientRect())`));
  await shot('desktop');
};
