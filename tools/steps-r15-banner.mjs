// Chụp ảnh nghiệm thu R1.5 (rider): banner giờ lễ vs khung chat trên điện thoại. Đồng hồ client giả lập 05:30 ICT 11/11/2026.
export default async ({ ev, shot, sleep, send }) => {
  const fakeNow = Date.UTC(2026, 10, 11, 5 - 7, 30);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const RealDate = Date; const off = ${fakeNow} - RealDate.now();
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + off); }
      static now() { return RealDate.now() + off; }
    }
    window.Date = FakeDate;
  })()` });
  await send('Page.reload');
  await sleep(5000);
  for (let i = 0; i < 40 && (await ev(`String(!!(window.__co && window.__co.me()))`)) !== 'true'; i++) {
    if (i % 8 === 0) await ev(`document.getElementById('enter')?.click()`);
    await sleep(1000);
  }
  let waited = 0;
  for (; waited < 120 && (await ev(`String(document.getElementById('boostBanner').hidden)`)) === 'true'; waited++) await sleep(1000);
  console.log('chờ banner hiện (giây):', waited);
  const state = () => ev(`(() => { const b = document.getElementById('boostBanner'); const c = document.getElementById('chat'); return 'chat collapsed=' + c.classList.contains('collapsed') + ' | banner hidden=' + b.hidden + ' | text=' + b.textContent + ' | width=' + innerWidth; })()`);
  console.log('vào chùa =', await ev(`String(!!(window.__co && window.__co.me()))`));
  console.log('đồng hồ giả (ICT):', await ev(`new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })`));
  console.log('ban đầu:', await state());
  await ev(`(() => { const c = document.getElementById('chat'); if (c.classList.contains('collapsed')) document.getElementById('chatToggle').click(); })()`);
  await sleep(500);
  console.log('chat MỞ:', await state());
  await shot('m-banner-chat-open');
  await ev(`document.getElementById('chatToggle').click()`);
  await sleep(500);
  console.log('chat THU GỌN:', await state());
  const b = JSON.parse(await ev(`JSON.stringify(document.getElementById('boostBanner').getBoundingClientRect())`));
  const c = JSON.parse(await ev(`JSON.stringify(document.getElementById('chat').getBoundingClientRect())`));
  console.log(`banner top=${b.top.toFixed(0)} bottom=${b.bottom.toFixed(0)} | chat top=${c.top.toFixed(0)} bottom=${c.bottom.toFixed(0)}`, b.top >= c.bottom || b.bottom <= c.top ? 'KHÔNG CHỒNG' : 'CHỒNG!');
  await shot('m-banner-chat-closed');
};
