export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  const pos = () => ev(`(()=>{const p=window.__co.me().char.root.position;return [+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)].join(',')})()`);
  await ev(`window.__co.me().char.root.position.set(0,0,6)`);
  await sleep(500);
  console.log('before bow', await pos());
  await ev(`document.querySelector('#actions [data-act="bow"]').click()`);
  for (let i = 0; i < 6; i++) { await sleep(1500); console.log('bow t+' + (i + 1) * 1.5, await pos(), await ev(`window.__co.me().anim`)); }
  await shot('bow-end');
  await ev(`window.__co.openPanel('shop', window.__co.panelCtx())`);
  await sleep(600);
  const n = await ev(`document.querySelectorAll('#panel button, .panel button').length`);
  console.log('buttons', n);
  const tabs = await ev(`(()=>{const out=[];const bs=[...document.querySelectorAll('button')].filter(b=>b.parentElement&&b.parentElement.className&&/tabs/.test(b.parentElement.className));return bs.length})()`);
  console.log('tabs', tabs);
  for (let i = 0; i < 11; i++) {
    const r = await ev(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.parentElement&&/tabs/.test(b.parentElement.className||''));const b=bs[${i}];if(!b)return 'none';b.click();const g=document.querySelectorAll('.shop-grid > *, .grid > *').length;return b.textContent+' items='+g})()`);
    console.log('tab', i, r);
    await sleep(250);
    if (i === 0 || i === 10) await shot('shop-tab' + i);
  }
  await ev(`window.__co.me().char.root.position.set(-34,0,-1)`);
  await sleep(800);
  console.log('zone btn bell', await ev(`(()=>{const b=document.getElementById('zoneBtn');return b.hidden+':'+b.textContent})()`));
  await ev(`document.getElementById('zoneBtn').click()`);
  await shot('zonebtn-bell');
  await ev(`window.__co.me().char.root.position.set(34,0,-1)`);
  await sleep(800);
  console.log('zone btn drum', await ev(`(()=>{const b=document.getElementById('zoneBtn');return b.hidden+':'+b.textContent})()`));
  await ev(`window.__co.me().char.root.position.set(-6.7,0.77,23)`);
  await sleep(800);
  console.log('zone btn thuydinh', await ev(`(()=>{const b=document.getElementById('zoneBtn');return b.hidden+':'+b.textContent})()`));
};
