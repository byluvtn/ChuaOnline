export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  await ev(`window.__co.openPanel('shop', window.__co.panelCtx())`);
  await sleep(800);
  const n = Number(await ev(`document.querySelectorAll('.rtabs button').length`));
  console.log('tabs', n);
  for (let i = 0; i < n; i++) {
    const r = await ev(`(()=>{const b=document.querySelectorAll('.rtabs button')[${i}];b.click();const t=[...document.querySelectorAll('.grid .tile')];return b.textContent+' | tiles='+t.length+' | locked='+t.filter(x=>x.classList.contains('locked')).length+' | blankIcons='+t.filter(x=>!x.firstChild||!x.firstChild.innerHTML).length+' | '+t.map(x=>x.querySelector('b').textContent).join(',')})()`);
    console.log(i, r);
    await sleep(200);
    if (i % 4 === 0) await shot('shop-' + i);
  }
};
