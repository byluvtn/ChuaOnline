export default async ({ ev, shot, sleep, send }) => {
  await ev(`localStorage.setItem('co:room','an-lac')`);
  await send('Page.navigate', { url: 'http://localhost:5173/' }); await sleep(3500);
  await shot('login');
  await ev(`document.getElementById('enter').click()`);
  await sleep(4000);
  await shot('night');
  await ev(`document.querySelector('[data-act=bow]').click()`);
  await sleep(300);
  await shot('bow');
  await ev(`document.querySelector('[data-panel=shop]').click()`);
  await sleep(600);
  await shot('shop');
};
