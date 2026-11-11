// Nghiệm thu UI mobile compact. UIM=portrait|chat|landscape|desktop
export default async ({ ev, shot, sleep, send }) => {
  const mode = process.env.UIM ?? 'portrait';
  if (mode === 'chat') {
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
  }
  for (let i = 0; i < 40 && (await ev(`String(!!(window.__co && window.__co.me()))`)) !== 'true'; i++) {
    if (i % 8 === 0) await ev(`document.getElementById('enter')?.click()`);
    await sleep(1000);
  }
  await sleep(1500);
  if (mode === 'chat') {
    for (let w = 0; w < 120 && (await ev(`String(document.getElementById('boostBanner').hidden)`)) === 'true'; w++) await sleep(1000);
    console.log('boost banner hidden (chat collapsed):', await ev(`String(document.getElementById('boostBanner').hidden)`));
    await ev(`(() => { const c = document.getElementById('chat'); if (c.classList.contains('collapsed')) document.getElementById('chatToggle').click(); })()`);
    await sleep(500);
    console.log('chat OPEN: boost banner hidden =', await ev(`String(document.getElementById('boostBanner').hidden)`), '| display =', await ev(`getComputedStyle(document.getElementById('boostBanner')).display`));
    await ev(`(() => { const i = document.getElementById('chatInput'); i.focus(); })()`);
    await send('Input.insertText', { text: 'xin chao' });
    await sleep(300);
    console.log('input value:', await ev(`document.getElementById('chatInput').value`));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await sleep(800);
    console.log('last msg:', await ev(`(document.querySelector('#msgs p:last-child')||{}).textContent`));
  } else if (mode !== 'desktop') {
    await ev(`(() => { const c = document.getElementById('chat'); if (!c.classList.contains('collapsed')) document.getElementById('chatToggle').click(); })()`);
    await sleep(500);
  }
  const m = JSON.parse(await ev(`JSON.stringify((() => {
    const ids = ['marquee','profile','online','topright','soundBtn','medBanner','boostBanner','chat','chatInput','chatToggle','actions','joystick','stick','menu','couplet','toast'];
    const out = {};
    for (const id of ids) { const e = document.getElementById(id); if (!e) continue; const cs = getComputedStyle(e); if (cs.display === 'none' || e.hidden) { out[id] = 'hidden'; continue; } const r = e.getBoundingClientRect(); out[id] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }
    out.acts = [...document.querySelectorAll('#actions .act')].filter((b) => getComputedStyle(b).display !== 'none').map((b) => { const r = b.getBoundingClientRect(); return [b.textContent.trim(), Math.round(r.width), Math.round(r.height), Math.round(r.top), Math.round(r.bottom), b.scrollWidth > b.clientWidth]; });
    out.menuBtns = [...document.querySelectorAll('#menu button')].slice(0, 3).map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    out.chatInputFont = getComputedStyle(document.getElementById('chatInput')).fontSize;
    out.dim = [innerWidth, innerHeight];
    out.body = document.body.className;
    return out; })())`));
  console.log(JSON.stringify(m));
  const rect = (k) => (Array.isArray(m[k]) ? { l: m[k][0], t: m[k][1], r: m[k][0] + m[k][2], b: m[k][1] + m[k][3] } : null);
  const names = ['profile', 'online', 'topright', 'medBanner', 'boostBanner', 'chat', 'actions', 'joystick', 'menu', 'couplet'];
  const rs = names.map((n) => [n, rect(n)]).filter(([, r]) => r);
  const overlaps = [];
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const a = rs[i][1], b = rs[j][1];
    if (a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b) overlaps.push(`${rs[i][0]}x${rs[j][0]}`);
  }
  console.log('OVERLAPS:', overlaps.join(', ') || 'none');
  if (Array.isArray(m.actions)) console.log('actions height', m.actions[3], 'bottom', m.actions[1] + m.actions[3], 'of', m.dim[1]);
  await shot(mode);
};
