// Nghiệm thu R1.3 Bước 2: khung chat + nút Mở rộng trên điện thoại (viewport cảm ứng).
// usage: STEPS=./steps-r13-mobile.mjs node tools/shot.mjs shots/r13-m "http://localhost:5173/?touch=1" 390 844 mobile
export default async ({ ev, shot, sleep, send }) => {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await sleep(1500);
  await ev(`localStorage.removeItem('co:menuCollapsed'); localStorage.removeItem('co:joyPos'); 1`);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  await ev(`window.__co.freeze = true; 1`);
  console.log('touch =', await ev(`String(document.body.classList.contains('touch'))`), '| chat collapsed =', await ev(`String(document.getElementById('chat').classList.contains('collapsed'))`));
  const rect = (sel) => ev(`JSON.stringify((() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; })())`).then(JSON.parse);
  const tap = async (x, y) => {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  console.log('chatToggle =', JSON.stringify(await rect('#chatToggle')));
  const tg = await rect('#chatToggle');
  await tap(tg.l + tg.w / 2, tg.t + tg.h / 2);
  await sleep(400);
  for (let i = 1; i <= 12; i++) {
    await ev(`(() => { const i = document.getElementById('chatInput'); i.value = 'Nam mô A Di Đà Phật — lời chúc số ${i}'; document.getElementById('chatForm').requestSubmit(); return 1; })()`);
    await sleep(900);
  }
  await sleep(500);
  const chat = await rect('#chat'), input = await rect('#chatInput'), joy = await rect('#joystick');
  console.log('chat =', JSON.stringify(chat), '| input =', JSON.stringify(input), '| joystick =', JSON.stringify(joy));
  console.log('khoảng cách chat.bottom -> joystick.top =', joy.t - chat.b, 'px; input nằm trong khung chat =', input.b <= chat.b && input.t >= chat.t);
  console.log('msgs scrollHeight/clientHeight =', await ev(`(() => { const m = document.getElementById('msgs'); return m.scrollHeight + '/' + m.clientHeight; })()`));
  console.log('elementFromPoint(tâm ô nhập) =', await ev(`document.elementFromPoint(${input.l + input.w / 2}, ${input.t + input.h / 2})?.id`));
  await shot('chat-open');

  await tap(input.l + input.w / 2, input.t + input.h / 2);
  await sleep(300);
  console.log('focus sau khi chạm =', await ev(`document.activeElement?.id`));
  await send('Input.insertText', { text: 'Con xin gõ thử trên điện thoại' });
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await sleep(1200);
  console.log('tin cuối trong danh sách =', await ev(`[...document.querySelectorAll('#msgs p')].pop()?.textContent`));
  await ev(`document.activeElement?.blur?.(); 1`);
  await sleep(300);
  await shot('chat-typing');

  const p0 = await ev(`JSON.stringify({ x: +window.__co.me().char.root.position.x.toFixed(2), z: +window.__co.me().char.root.position.z.toFixed(2) })`);
  const jx = joy.l + joy.w / 2, jy = joy.t + joy.h / 2;
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jx, y: jy }] });
  for (let k = 1; k <= 6; k++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jx, y: jy - 8 * k }] }); await sleep(60); }
  await sleep(1500);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(300);
  const p1 = await ev(`JSON.stringify({ x: +window.__co.me().char.root.position.x.toFixed(2), z: +window.__co.me().char.root.position.z.toFixed(2) })`);
  console.log('joystick khi chat mở: vị trí', p0, '->', p1, '| di chuyển =', p0 !== p1);

  const mt = await rect('#menu .mtoggle');
  await tap(mt.l + mt.w / 2, mt.t + mt.h / 2);
  await sleep(500);
  const mt2 = await rect('#menu .mtoggle'), joy2 = await rect('#joystick'), chat2 = await rect('#chat');
  console.log('menu collapsed =', await ev(`String(document.getElementById('menu').classList.contains('collapsed'))`), '| nhãn =', await ev(`document.querySelector('#menu .mtoggle .lb').textContent`));
  console.log('nút Mở rộng =', JSON.stringify(mt2), '| joystick =', JSON.stringify(joy2), '| khe nút->joystick =', joy2.t - mt2.b, 'px | khe chat->nút =', mt2.t - chat2.b, 'px');
  console.log('elementFromPoint(tâm nút) =', await ev(`document.elementFromPoint(${mt2.l + mt2.w / 2}, ${mt2.t + mt2.h / 2})?.closest('button')?.className`));
  await shot('bar');
  await tap(mt2.l + mt2.w / 2, mt2.t + mt2.h / 2);
  await sleep(400);
  console.log('bấm lại -> collapsed =', await ev(`String(document.getElementById('menu').classList.contains('collapsed'))`));
  await ev(`localStorage.removeItem('co:menuCollapsed'); 1`);
};
