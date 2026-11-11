import { createClient } from '@libsql/client';

export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  console.log('mailDot hidden =', await ev(`String(document.querySelector('.mailDot')?.hidden)`));
  await shot('menu-dot');
  if (process.env.DB_FILE) {
    const tdb = createClient({ url: `file:${process.env.DB_FILE}` });
    const id = Number((await tdb.execute('SELECT MAX(id) AS m FROM players')).rows[0].m);
    await tdb.execute({ sql: "INSERT INTO mail (player_id, kind, title, body, gift, created_at) VALUES (?, 'system', 'Thông báo bảo trì', 'Nhà chùa sẽ đóng cửa ngắn để tu sửa. Mong bạn thông cảm.', NULL, ?)", args: [id, Date.now() + 1000] });
  }
  await ev(`document.querySelector('#menu [data-menu=mail]').click()`);
  await sleep(1200);
  await shot('list');
  await ev(`[...document.querySelectorAll('#panelBody .mrow')].find((b) => /chào mừng/.test(b.textContent)).click()`);
  await sleep(800);
  console.log('dot hidden after read =', await ev(`String(document.querySelector('.mailDot')?.hidden)`));
  await shot('open');
  await ev(`document.querySelector('#panelBody button.gold').click()`);
  await sleep(1500);
  console.log('btn =', await ev(`document.querySelector('#panelBody button.gold')?.textContent`));
  await shot('claimed');
};
