export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(3000);
  console.log(await ev(`(()=>{const s=window.__co.world.seats;return s.length+' '+JSON.stringify(s.slice(0,3))+' fps?'})()`));
};
