// Nghiệm thu R1.2 (hòm thư + quà chào mừng). Chạy trên DB tạm (DB_FILE); không đụng DB thật / Turso.
// usage: node tools/steps-verify-mail.mjs
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createClient } from '@libsql/client';
import { io } from 'socket.io-client';

const dir = mkdtempSync(join(tmpdir(), 'co-mail-'));
const file = join(dir, 'test.db');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const baseEnv = { ...process.env, DB_FILE: file };
delete baseEnv.TURSO_DATABASE_URL; delete baseEnv.TURSO_AUTH_TOKEN;

const dbUrl = resolve('server/db.ts');
const helper = join(dir, 'helper.mts');
writeFileSync(helper, `
const db = await import(${JSON.stringify(dbUrl)});
const cmd = process.argv[2];
let out = {};
if (cmd === 'boot') out = { ok: true };
if (cmd === 'guest') out = { id: (await db.createGuest()).id };
if (cmd === 'nogift') out = { id: await db.sendMail(Number(process.argv[3]), 'system', 'Thư thường', 'Không có quà', null) };
console.log('@@' + JSON.stringify(out));
process.exit(0);
`);
const runHelper = (...args) => {
  const r = spawnSync('npx', ['tsx', helper, ...args], { env: baseEnv, encoding: 'utf8' });
  const m = /@@(.*)/.exec(r.stdout ?? '');
  if (!m) throw new Error('helper lỗi: ' + (r.stdout ?? '') + (r.stderr ?? ''));
  return { out: JSON.parse(m[1]), log: r.stdout };
};

let srv;
const cleanup = () => { try { srv?.kill(); } catch {} try { rmSync(dir, { recursive: true, force: true }); } catch {} };

try {
  console.log('DB test:', file);
  const tdb = createClient({ url: `file:${file}` });

  // --- Cơ chế ra mắt: 2 người chơi "cũ" (chưa có bảng mail/app_meta) ---
  await tdb.executeMultiple(`
    CREATE TABLE players (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE COLLATE NOCASE, pass_hash TEXT, name TEXT NOT NULL,
      outfit TEXT NOT NULL DEFAULT 'monk', color TEXT NOT NULL DEFAULT '#d99a1e', merit INTEGER NOT NULL DEFAULT 0,
      weekly_merit INTEGER NOT NULL DEFAULT 0, week_key TEXT NOT NULL DEFAULT '', coins INTEGER NOT NULL DEFAULT 0, accessory TEXT, created_at INTEGER NOT NULL);
    INSERT INTO players (name, created_at) VALUES ('Cu 1', 1), ('Cu 2', 2);
  `);
  const launchCount = async (id) => Number((await tdb.execute({ sql: "SELECT COUNT(*) AS n FROM mail WHERE player_id = ? AND kind = 'launch'", args: [id] })).rows[0].n);
  const boot1 = runHelper('boot');
  check('7. boot 1: log phát 2 thư ra mắt', /mail launch grant: 2 /.test(boot1.log), boot1.log.match(/mail launch grant.*/)?.[0]);
  const boot2 = runHelper('boot');
  check('7. boot 2: bỏ qua (0 thư)', /mail launch grant: 0 /.test(boot2.log), boot2.log.match(/mail launch grant.*/)?.[0]);
  check('7. mỗi người chơi cũ đúng 1 thư launch sau 2 lần boot', (await launchCount(1)) === 1 && (await launchCount(2)) === 1, `${await launchCount(1)}, ${await launchCount(2)}`);
  const flag = (await tdb.execute("SELECT value FROM app_meta WHERE key = 'mail_launch_v1'")).rows[0];
  check('7. cờ app_meta mail_launch_v1 = done', flag?.value === 'done');
  const lg = JSON.parse((await tdb.execute("SELECT gift FROM mail WHERE kind = 'launch' LIMIT 1")).rows[0].gift);
  check('7. gói quà launch đúng', lg.merit === 20 && lg.coins === 30 && lg.items.huong_tram === 2 && lg.items.nen_sap_ong === 1 && lg.items.den_hoa_dang === 1, JSON.stringify(lg));
  const g3 = runHelper('guest').out.id;
  check('7. người chơi tạo sau khi cờ set: không có thư launch', (await launchCount(g3)) === 0);
  runHelper('boot');
  check('7. boot lần 3 vẫn không phát thêm', (await launchCount(1)) === 1 && (await launchCount(g3)) === 0);

  // --- Server thật ---
  const PORT = 3100 + Math.floor(Math.random() * 400);
  const base = `http://localhost:${PORT}`;
  srv = spawn('npx', ['tsx', 'server/index.ts'], { env: { ...baseEnv, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  srv.stdout.on('data', (d) => (out += d)); srv.stderr.on('data', (d) => (out += d));
  for (let i = 0; i < 60 && !/mode: /.test(out); i++) await sleep(250);
  if (!/mode: local file/.test(out)) throw new Error('server khong o che do local file:\n' + out);
  for (let i = 0; i < 40; i++) { try { await fetch(base + '/api/guest', { method: 'OPTIONS' }); break; } catch { await sleep(250); } }

  const post = async (path, body, token) => (await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body ?? {}) })).json();
  const maxId = async () => Number((await tdb.execute('SELECT MAX(id) AS m FROM players')).rows[0].m);
  const mailsOf = async (id) => (await tdb.execute({ sql: 'SELECT * FROM mail WHERE player_id = ? ORDER BY id', args: [id] })).rows;
  const prof = async (id) => { const r = (await tdb.execute({ sql: 'SELECT merit, coins FROM players WHERE id = ?', args: [id] })).rows[0]; return { merit: Number(r.merit), coins: Number(r.coins) }; };
  const inv = async (id) => Object.fromEntries((await tdb.execute({ sql: 'SELECT item_id, qty FROM inventory WHERE player_id = ?', args: [id] })).rows.map((r) => [r.item_id, Number(r.qty)]));
  const connect = async (token) => {
    const s = io(base, { auth: { token } });
    const st = { mailEvt: null, profile: null };
    s.on('mail', (m) => (st.mailEvt = m));
    s.on('profile', (p) => (st.profile = p));
    await new Promise((r) => { s.on('welcome', r); s.on('connect', () => s.emit('join', { name: 'Test', outfit: 'male', color: '#72818e', room: 'vo-luong' })); });
    await sleep(500);
    return { s, st };
  };
  const ask = (c, ev, ...args) => new Promise((r) => c.s.emit(ev, ...args, r));

  // 1. Khách mới
  const gt = (await post('/api/guest')).token;
  const gid = await maxId();
  let ms = await mailsOf(gid);
  check('1. khách mới: đúng 1 thư welcome', ms.length === 1 && ms[0].kind === 'welcome', `${ms.length} thư`);
  const G = await connect(gt);
  check('1. event mail lúc join: unread = 1', G.st.mailEvt?.unread === 1, JSON.stringify(G.st.mailEvt));

  // 2. Đăng ký mới (không qua khách)
  const reg = await post('/api/register', { username: 'mailtest_a', password: 'secret123' });
  const rid = await maxId();
  ms = await mailsOf(rid);
  check('2. đăng ký mới: đúng 1 thư welcome', !reg.error && rid !== gid && ms.length === 1 && ms[0].kind === 'welcome', `${ms.length} thư`);

  // 3. Khách nâng cấp
  const up = await post('/api/register', { username: 'mailtest_b', password: 'secret123' }, gt);
  ms = await mailsOf(gid);
  check('3. khách nâng cấp: vẫn đúng 1 thư welcome', !up.error && (await maxId()) === rid && ms.length === 1 && ms[0].kind === 'welcome', `${ms.length} thư`);
  G.s.close();

  // 4. Nhận quà (đặt công đức 40 -> 60 để không qua mốc cấp)
  const A = await connect(reg.token);
  const list = await ask(A, 'mail:list');
  check('4. mail:list ok, 1 thư, unread 1, gift đúng', list.ok && list.mails.length === 1 && list.unread === 1 && list.mails[0].gift?.merit === 20 && list.mails[0].claimed === false && list.mails[0].read === false, JSON.stringify(list.mails?.[0]?.gift));
  const mid = list.mails[0].id;
  await tdb.execute({ sql: 'UPDATE players SET merit = 40, coins = 0 WHERE id = ?', args: [rid] });
  let p0 = await prof(rid);
  let r = await ask(A, 'mail:claim', mid);
  let p1 = await prof(rid);
  check('4. claim ok, ack đúng gói', r.ok && r.merit === 20 && r.coins === 30 && r.items.huong_tram === 2, JSON.stringify(r));
  check('4. profile +20 công đức / +30 xu', p1.merit - p0.merit === 20 && p1.coins - p0.coins === 30, `merit ${p0.merit}->${p1.merit}, coins ${p0.coins}->${p1.coins}`);
  const iv = await inv(rid);
  check('4. túi có đủ 3 món theo gói', iv.huong_tram === 2 && iv.nen_sap_ong === 1 && iv.den_hoa_dang === 1, JSON.stringify(iv));
  check('4. DB: claimed = 1', Number((await mailsOf(rid))[0].claimed) === 1);
  r = await ask(A, 'mail:claim', mid);
  const p2 = await prof(rid);
  check('4. nhận lần 2 bị chặn, profile không đổi', r.ok === false && /đã được nhận/.test(r.error ?? '') && p2.merit === p1.merit && p2.coins === p1.coins && JSON.stringify(await inv(rid)) === JSON.stringify(iv), JSON.stringify(r));
  const par = await Promise.all([1, 2, 3, 4].map(() => ask(A, 'mail:claim', mid)));
  check('4. 4 claim song song sau khi nhận: không cái nào thành công', par.every((x) => !x.ok));

  // 5. Chéo người chơi: B dùng id thư của A
  const B = await connect((await post('/api/guest')).token);
  const bid = await maxId();
  const A2 = await post('/api/register', { username: 'mailtest_c', password: 'secret123' });
  const cid = await maxId();
  const C = await connect(A2.token);
  const cMail = (await mailsOf(cid))[0];
  const cBefore = await prof(cid);
  const bBefore = await prof(bid);
  const rc = await ask(B, 'mail:claim', Number(cMail.id));
  const rr = await ask(B, 'mail:read', Number(cMail.id));
  const after = (await mailsOf(cid))[0];
  check('5. B claim thư của C: bị chặn', rc.ok === false, JSON.stringify(rc));
  check('5. B read thư của C: không tác dụng (read_at vẫn NULL, claimed = 0)', after.read_at === null && Number(after.claimed) === 0);
  check('5. profile B và C không đổi, B không nhận quà', JSON.stringify(await prof(cid)) === JSON.stringify(cBefore) && JSON.stringify(await prof(bid)) === JSON.stringify(bBefore) && Object.keys(await inv(bid)).length === 0);
  check('5. unread của C vẫn 1 (qua mail:read của C)', (await ask(C, 'mail:read', 999999)).unread === 1);

  // 6. Đọc thư
  const lst = await ask(B, 'mail:list');
  const bm = lst.mails[0].id;
  check('6. trước khi đọc unread = 1', lst.unread === 1);
  r = await ask(B, 'mail:read', bm);
  check('6. đọc thư: unread giảm về 0', r.ok && r.unread === 0, JSON.stringify(r));
  r = await ask(B, 'mail:read', bm);
  check('6. đọc lại không lỗi, unread vẫn 0', r.ok && r.unread === 0);
  r = await ask(B, 'mail:read', 'abc');
  check('6. mailId không phải số: lỗi gọn, không văng', r.ok === false);
  check('6. mail:list sau khi đọc: read = true', (await ask(B, 'mail:list')).mails[0].read === true);

  // 8. Thư không quà
  const ng = runHelper('nogift', String(bid)).out.id;
  const lst2 = await ask(B, 'mail:list');
  const nm = lst2.mails.find((m) => m.id === ng);
  check('8. thư không quà: gift = null, unread = 1', nm && nm.gift === null && lst2.unread === 1);
  const pb = await prof(bid);
  r = await ask(B, 'mail:claim', ng);
  check('8. claim thư không quà bị chặn, profile không đổi', r.ok === false && JSON.stringify(await prof(bid)) === JSON.stringify(pb), JSON.stringify(r));
  r = await ask(B, 'mail:read', ng);
  check('8. đọc thư không quà bình thường', r.ok && r.unread === 0);
  check('mail:list sắp xếp mới nhất trước', lst2.mails[0].id === ng, lst2.mails.map((m) => m.id).join(','));

  [A, B, C].forEach((p) => p.s.close());
  console.log(fails ? `\n${fails} FAIL` : '\nTẤT CẢ PASS');
} catch (e) {
  fails++;
  console.error('LỖI:', e.stack ?? e.message);
} finally {
  cleanup();
  process.exit(fails ? 1 : 0);
}
