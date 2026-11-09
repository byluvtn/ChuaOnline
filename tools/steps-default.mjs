export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await shot('login');
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  await shot('game');
};
