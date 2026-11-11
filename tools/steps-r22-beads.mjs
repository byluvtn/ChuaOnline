// Chụp ảnh nghiệm thu R2.2: panel Lần hạt. Cần server DB tạm cổng 3001 (DB_FILE=/tmp/co-r22/db.db) và vite cổng 5173.
// MODE=desktop: r22-panel (54/108) + r22-done. MODE=mobile: r22-m-panel (54/108, 390x844).
export default async ({ ev, shot, sleep, send }) => {
  const mobile = process.env.MODE === 'mobile';
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 60 && (await ev(`String(!!(window.__co && window.__co.me()))`)) !== 'true'; i++) await sleep(1000);
  console.log('vào chùa =', await ev(`String(!!(window.__co && window.__co.me()))`));
  await sleep(1500);
  console.log('chấm đỏ nút Lần hạt hiện =', await ev(`String(!document.querySelector('#menu .beadsDot').hidden)`));
  await ev(`document.querySelector('#menu [data-menu=beads]').click()`);
  await sleep(600);
  const tap = (k) => ev(`(() => { const b = document.querySelector('.bd-bead'); for (let i = 0; i < ${k}; i++) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); return document.querySelector('.bd-count').textContent; })()`);
  const t0 = Date.now();
  console.log('đếm =', await tap(54));
  await sleep(500);
  const rect = JSON.parse(await ev(`JSON.stringify({ vw: innerWidth, vh: innerHeight, bead: document.querySelector('.bd-bead').getBoundingClientRect(), card: document.querySelector('#panel .card').getBoundingClientRect(), sw: document.documentElement.scrollWidth, pw: document.getElementById('panelBody').scrollWidth, pcw: document.getElementById('panelBody').clientWidth })`));
  console.log('đo:', JSON.stringify(rect));
  await shot(mobile ? 'm-panel' : 'panel');
  if (mobile) return;
  const wait = 46_500 - (Date.now() - t0);
  console.log(`chờ ${Math.ceil(wait / 1000)}s cho đủ 45s...`);
  await sleep(Math.max(0, wait));
  console.log('đếm =', await tap(54));
  await sleep(1500);
  console.log('kết quả =', await ev(`document.querySelector('.bd-result').textContent`));
  await shot('done');
};
