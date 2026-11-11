// Chụp ảnh nghiệm thu R1.4. Giả lập đồng hồ PHÍA CLIENT (chỉ trong phiên chụp) về 05:30 ICT ngày 11/11/2026.
export default async ({ ev, shot, sleep, send }) => {
  const fakeNow = Date.UTC(2026, 10, 11, 5 - 7, 30);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const RealDate = Date; const off = ${fakeNow} - RealDate.now(); const t0 = RealDate.now();
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + off); }
      static now() { return RealDate.now() + off; }
    }
    window.Date = FakeDate;
  })()` });
  await send('Page.reload');
  await sleep(3500);
  await ev(`localStorage.removeItem('co:menuCollapsed'); 1`);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 60 && (await ev(`String(!!(window.__co && window.__co.me()))`)) !== 'true'; i++) await sleep(1000);
  console.log('vào chùa =', await ev(`String(!!(window.__co && window.__co.me()))`), '| hud hidden =', await ev(`String(document.getElementById('hud').hidden)`));
  console.log('đồng hồ giả (ICT):', await ev(`new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })`));
  await sleep(35000);
  const rect = (id) => ev(`JSON.stringify(document.getElementById('${id}').getBoundingClientRect())`);
  console.log('boostBanner =', await ev(`document.getElementById('boostBanner').hidden + ' | ' + document.getElementById('boostBanner').textContent`));
  await shot('banner');
  await ev(`(() => { const m = document.getElementById('medBanner'); m.hidden = false; m.classList.add('bonus'); m.textContent = 'Tĩnh lặng cả chùa: 3 người đang thiền · 12/30 phút · Thiền tập thể x2'; })()`);
  await sleep(300);
  const m = JSON.parse(await rect('medBanner')), b = JSON.parse(await rect('boostBanner'));
  console.log(`medBanner bottom=${m.bottom.toFixed(1)} boostBanner top=${b.top.toFixed(1)} khoảng cách=${(b.top - m.bottom).toFixed(1)}px`, b.top >= m.bottom + 4 ? 'KHÔNG CHỒNG' : 'CHỒNG!');
  await shot('banner-with-meditation');
  await ev(`document.getElementById('medBanner').hidden = true`);
  await ev(`document.querySelector('#menu [data-menu=news]').click()`);
  await sleep(700);
  console.log('news đầu tiên =', await ev(`document.querySelector('#panelBody .news b')?.textContent`));
  await shot('news');
};
