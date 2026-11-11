export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  console.log('dot hidden =', await ev(`String(document.querySelector('.checkinDot')?.hidden)`));
  await shot('menu-dot');
  await ev(`document.querySelector('#menu [data-menu=checkin]').click()`);
  await sleep(1200);
  await shot('panel-before');
  await ev(`document.querySelector('#panelBody button.gold').click()`);
  await sleep(1500);
  console.log('dot hidden after claim =', await ev(`String(document.querySelector('.checkinDot')?.hidden)`));
  console.log('btn =', await ev(`document.querySelector('#panelBody button.gold')?.textContent`));
  await shot('panel-after');
};
