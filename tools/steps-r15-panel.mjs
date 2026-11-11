// Chụp ảnh nghiệm thu R1.5: panel Cấp độ có mục Thành tựu tích lũy. Cần server chạy với DB_FILE=/tmp/co-r15/db.db (DB tạm) cổng 3001.
import { createClient } from '@libsql/client';
export default async ({ ev, shot, sleep, send }) => {
  const guest = await (await fetch('http://localhost:3001/api/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
  const tdb = createClient({ url: 'file:/tmp/co-r15/db.db' });
  const id = Number((await tdb.execute('SELECT MAX(id) AS m FROM players')).rows[0].m);
  await tdb.execute({ sql: 'UPDATE players SET merit = 260, coins = 40 WHERE id = ?', args: [id] });
  await tdb.execute({ sql: 'INSERT INTO player_stats (player_id, bows, chants, lanterns, meditate_sec, beads_rounds) VALUES (?,?,?,?,?,0)', args: [id, 137, 62, 8, 2400] });
  for (const m of ['bow100', 'chant50', 'med30']) await tdb.execute({ sql: 'INSERT INTO stat_rewards (player_id, milestone_id, claimed_at) VALUES (?,?,?)', args: [id, m, Date.now()] });
  await ev(`localStorage.setItem('co:session', ${JSON.stringify(guest.token)}); 1`);
  await send('Page.reload');
  await sleep(3500);
  await ev(`localStorage.removeItem('co:menuCollapsed'); 1`);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 60 && (await ev(`String(!!(window.__co && window.__co.me()))`)) !== 'true'; i++) await sleep(1000);
  console.log('vào chùa =', await ev(`String(!!(window.__co && window.__co.me()))`));
  await sleep(1500);
  await ev(`document.querySelector('#menu [data-menu=level]').click()`);
  await sleep(800);
  await ev(`(() => { const p = document.querySelector('.sttitle'); p && p.scrollIntoView({ block: 'start' }); })()`);
  await sleep(400);
  console.log('mục thành tựu =', await ev(`[...document.querySelectorAll('.strow')].map((r) => r.querySelector('.sthead').textContent + ' | ' + r.querySelector('.stnote').textContent + ' | ' + [...r.querySelectorAll('.stchip')].map((c) => c.className.replace('stchip','').trim() + ':' + c.textContent).join(',')).join('\\n')`));
  await shot('panel');
};
