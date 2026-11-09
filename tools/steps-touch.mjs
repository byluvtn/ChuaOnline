export default async ({ ev, shot, sleep }) => {
  await ev(`document.getElementById('enter').click()`);
  await sleep(3500);
  await ev(`document.getElementById('chatToggle').click()`);
  await sleep(300);
  await shot('touch');
};
