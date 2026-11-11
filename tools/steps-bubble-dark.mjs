// Chụp ảnh bong bóng chat tông tối (gửi tin qua form chat thật). Cần server DB tạm cổng 3001 + vite cổng 5173; chạy ở 390x844 mobile.
export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 60 && (await ev(`String(!!(window.__co && window.__co.me()))`)) !== 'true'; i++) await sleep(1000);
  await sleep(2500);
  await ev(`(() => { const t = document.getElementById('chatToggle'); const c = document.getElementById('chat'); if (c.classList.contains('collapsed')) t.click(); return 1; })()`);
  await sleep(400);
  await ev(`(() => { const i = document.getElementById('chatInput'); i.value = 'Nam mô A Di Đà Phật, chúc mọi người bình an'; document.getElementById('chatForm').requestSubmit(); return 1; })()`);
  await sleep(1200);
  console.log('bubble visible =', await ev(`String(window.__co.me().char.bubble.visible)`));
  await ev(`(() => { const c = document.getElementById('chat'); if (!c.classList.contains('collapsed')) document.getElementById('chatToggle').click(); return 1; })()`);
  await sleep(600);
  await shot('dark');
};
