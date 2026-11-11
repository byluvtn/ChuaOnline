// Nghiệm thu R2.2 (lần hạt 108: beads:start / beads:done, thưởng vòng, trần ngày, mốc bead5). DB tạm (DB_FILE); không đụng DB thật / Turso.
// usage: node tools/steps-verify-beads.mjs
// Các ca cần chờ thật (~32 giây, sàn là 30 giây) được khởi động song song nên chỉ tốn một lần chờ.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createClient } from '@libsql/client';
import { io } from 'socket.io-client';

const dir = mkdtempSync(join(tmpdir(), 'co-beads-'));
const file = join(dir, 'test.db');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const baseEnv = { ...process.env, DB_FILE: file };
delete baseEnv.TURSO_DATABASE_URL; delete baseEnv.TURSO_AUTH_TOKEN;

const helper = join(dir, 'helper.mts');
writeFileSync(helper, `
const db = await import(${JSON.stringify(resolve('server/db.ts'))});
const time = await import(${JSON.stringify(resolve('shared/time.ts'))});
const a = process.argv.slice(2);
let out = {};
if (a[0] === 'bump') out = { value: await db.bumpStat(Number(a[1]), a[2], Number(a[3])) };
if (a[0] === 'claim') out = { got: await db.claimStatReward(Number(a[1]), a[2]) };
if (a[0] === 'stats') out = await db.getStats(Number(a[1]));
if (a[0] === 'now') out = time.meritBoost(new Date());
console.log('@@' + JSON.stringify(out));
process.exit(0);
`);
const runHelper = (...args) => {
  const r = spawnSync('npx', ['tsx', helper, ...args.map(String)], { env: baseEnv, encoding: 'utf8' });
  const m = /@@(.*)/.exec(r.stdout ?? '');
  if (!m) throw new Error('helper lỗi: ' + (r.stdout ?? '') + (r.stderr ?? ''));
  return JSON.parse(m[1]);
};

let srv;
const cleanup = () => { try { srv?.kill(); } catch {} try { rmSync(dir, { recursive: true, force: true }); } catch {} };

try {
  console.log('DB test:', file);
  const PORT = 3100 + Math.floor(Math.random() * 400);
  const base = `http://localhost:${PORT}`;
  srv = spawn('npx', ['tsx', 'server/index.ts'], { env: { ...baseEnv, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  srv.stdout.on('data', (d) => (out += d)); srv.stderr.on('data', (d) => (out += d));
  for (let i = 0; i < 60 && !/mode: /.test(out); i++) await sleep(250);
  if (!/mode: local file/.test(out)) throw new Error('server khong o che do local file:\n' + out);
  for (let i = 0; i < 40; i++) { try { await fetch(base + '/api/guest', { method: 'OPTIONS' }); break; } catch { await sleep(250); } }
  const tdb = createClient({ url: `file:${file}` });

  const post = async (path, body) => (await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })).json();
  const maxId = async () => Number((await tdb.execute('SELECT MAX(id) AS m FROM players')).rows[0].m);
  const prof = async (id) => { const r = (await tdb.execute({ sql: 'SELECT merit, coins FROM players WHERE id = ?', args: [id] })).rows[0]; return { merit: Number(r.merit), coins: Number(r.coins) }; };
  const connect = async (token) => {
    const s = io(base, { auth: { token }, forceNew: true });
    const st = { milestones: [], stats: null, beads: [] };
    s.on('milestone', (m) => st.milestones.push(m));
    s.on('stats', (m) => (st.stats = m));
    s.on('beads', (m) => st.beads.push(m));
    await new Promise((r) => { s.on('welcome', r); s.on('connect', () => s.emit('join', { name: 'Test', outfit: 'male', color: '#72818e', room: 'vo-luong' })); });
    await sleep(500);
    return { s, st };
  };
  const ask = (c, ev, ...args) => new Promise((r) => c.s.emit(ev, ...args, r));
  const newGuest = async () => {
    const t = (await post('/api/guest')).token; const id = await maxId();
    await tdb.execute({ sql: 'UPDATE players SET merit = 100, coins = 0 WHERE id = ?', args: [id] });
    return { t, id, c: await connect(t) };
  };
  const rounds = (id) => runHelper('stats', id).beadsRounds;
  const today = new Date().toISOString().slice(0, 10);

  // 1. Khách mới: lúc join có event beads { rewarded: 0 }
  const A = await newGuest();
  check('1. join đẩy event beads { rewarded: 0 }', A.c.st.beads.length === 1 && A.c.st.beads[0].rewarded === 0, JSON.stringify(A.c.st.beads));

  // 2. done khi chưa start
  const r2 = await ask(A.c, 'beads:done');
  check('2. beads:done khi chưa beads:start -> { ok: false }, beads_rounds = 0', r2?.ok === false && rounds(A.id) === 0, JSON.stringify(r2));

  // 3. start rồi done ngay
  const s3 = await ask(A.c, 'beads:start');
  const r3 = await ask(A.c, 'beads:done');
  const p3 = await prof(A.id);
  check('3. start rồi done ngay -> { ok: false }, stats vẫn 0, công đức/xu không đổi', s3?.ok === true && r3?.ok === false && rounds(A.id) === 0 && p3.merit === 100 && p3.coins === 0, JSON.stringify({ s3, r3, p3 }));
  const r3b = await ask(A.c, 'beads:done');
  check('3. mốc bắt đầu bị xóa sau lần done hỏng (done lần nữa vẫn false)', r3b?.ok === false);

  // 4-6: khởi động song song ba vòng cần chờ thật
  const B = await newGuest();            // vòng hợp lệ
  const M = await newGuest();            // mốc bead5
  const C = await newGuest();            // hết lượt ngày
  runHelper('bump', M.id, 'beads_rounds', 4);
  await tdb.execute({ sql: 'INSERT INTO minigame_daily (player_id, day_key, game, count) VALUES (?,?,?,5)', args: [C.id, today, 'lanhat'] });
  const mC = await newGuest();           // trùng lặp start (ghi đè mốc) - dùng khách riêng
  const E = await newGuest();            // ca biên: done ở ~29 giây vẫn bị chặn
  const startedAt = Date.now();
  for (const G of [B, M, C]) check('   start ok', (await ask(G.c, 'beads:start'))?.ok === true);
  await ask(mC.c, 'beads:start');
  await ask(E.c, 'beads:start');
  const until = async (ms) => sleep(Math.max(0, ms - (Date.now() - startedAt)));
  await until(29_000);
  const rE = await ask(E.c, 'beads:done');
  check('4a. ca biên: done ở ~29 giây (< 30s) -> { ok: false }, beads_rounds = 0', rE?.ok === false && rounds(E.id) === 0, JSON.stringify(rE));
  await until(31_000);
  await ask(mC.c, 'beads:start'); // ghi đè: mốc mới
  const rEarly = await ask(mC.c, 'beads:done');
  check('4b. start lại giữa chừng ghi đè mốc: done ngay sau đó -> { ok: false } dù đã trôi ~31s từ lần start đầu', rEarly?.ok === false && rounds(mC.id) === 0, JSON.stringify(rEarly));
  const wait = 32_500 - (Date.now() - startedAt);
  console.log(`   chờ thêm ${Math.max(0, Math.ceil(wait / 1000))}s cho đủ ngưỡng 30s (done ở ~32 giây)...`);
  await sleep(Math.max(0, wait));

  // 4. Vòng hợp lệ
  const b0 = await prof(B.id);
  const m1 = runHelper('now').mult;
  const rB = await ask(B.c, 'beads:done');
  const m2 = runHelper('now').mult;
  await sleep(300);
  const b1 = await prof(B.id);
  const dm = b1.merit - b0.merit;
  const okMerit = dm === Math.round(10 * m1) || dm === Math.round(10 * m2);
  check('4. vòng hợp lệ (done ở ~32 giây, sàn 30s) -> { ok: true, rewarded: true }', rB?.ok === true && rB?.rewarded === true, JSON.stringify(rB));
  check(`4. công đức +Math.round(10 x ${m1}) = ${Math.round(10 * m1)}, ack.merit khớp DB`, okMerit && rB.merit === dm, `dm=${dm}, ack=${rB?.merit}`);
  check('4. xu +5', b1.coins - b0.coins === 5, `xu ${b0.coins}->${b1.coins}`);
  check('4. beads_rounds = 1', rounds(B.id) === 1);
  check('4. emit beads { rewarded: 1 } sau done', B.c.st.beads.at(-1)?.rewarded === 1, JSON.stringify(B.c.st.beads));
  const rB2 = await ask(B.c, 'beads:done');
  check('4. done lần nữa không có start -> { ok: false }, không đếm thêm', rB2?.ok === false && rounds(B.id) === 1);

  // 5. Mốc bead5
  const mm0 = await prof(M.id);
  const rM = await ask(M.c, 'beads:done');
  await sleep(500);
  const mm1 = await prof(M.id);
  const hits = M.c.st.milestones.filter((x) => x.id === 'bead5');
  check('5. vòng thứ 5 -> { ok: true, rewarded: true }, beads_rounds = 5', rM?.ok === true && rM?.rewarded === true && rounds(M.id) === 5, JSON.stringify(rM));
  check('5. đúng một event milestone bead5', hits.length === 1 && M.c.st.milestones.length === 1, JSON.stringify(M.c.st.milestones));
  check('5. xu +25 (5 của vòng + 20 của mốc)', mm1.coins - mm0.coins === 25, `xu ${mm0.coins}->${mm1.coins}`);
  const g2 = runHelper('claim', M.id, 'bead5').got;
  check('5. claimStatReward(bead5) gọi lại -> false', g2 === false);

  // 6. Hết lượt ngày
  const c0 = await prof(C.id);
  const rC = await ask(C.c, 'beads:done');
  await sleep(500);
  const c1 = await prof(C.id);
  check('6. hết lượt -> { ok: true, rewarded: false, merit: 0 }', rC?.ok === true && rC?.rewarded === false && rC?.merit === 0, JSON.stringify(rC));
  check('6. beads_rounds vẫn +1', rounds(C.id) === 1);
  check('6. công đức/xu không đổi', c1.merit === c0.merit && c1.coins === c0.coins, JSON.stringify({ c0, c1 }));
  check('6. emit beads vẫn báo rewarded: 5', C.c.st.beads.at(-1)?.rewarded === 5, JSON.stringify(C.c.st.beads));

  // 7. Bền vững
  const before = await ask(M.c, 'stats:get');
  M.c.s.close();
  await sleep(500);
  const M2 = { c: await connect(M.t) };
  const after = await ask(M2.c, 'stats:get');
  check('7. reconnect: stats:get thấy beadsRounds = 5 và claimed chứa bead5', after.ok && after.state.stats.beadsRounds === 5 && after.state.claimed.includes('bead5'), JSON.stringify(after.state));
  check('7. stats giữ nguyên so với trước khi ngắt', JSON.stringify(before.state) === JSON.stringify(after.state));
  check('7. join đẩy beads { rewarded: 1 }', M2.c.st.beads.at(-1)?.rewarded === 1, JSON.stringify(M2.c.st.beads));
  M2.c.s.close();

  // 8. Hồi quy
  let reg = null;
  for (let i = 0; i < 3 && !reg; i++) {
    const G = await newGuest();
    const x1 = runHelper('now').mult;
    const p0 = await prof(G.id);
    G.c.s.emit('action', 'incense'); await sleep(900);
    const p1 = await prof(G.id);
    G.c.s.close();
    if (runHelper('now').mult === x1) reg = { x1, dm: p1.merit - p0.merit, dc: p1.coins - p0.coins };
  }
  check(`8. hồi quy: thắp hương công đức == Math.round(1 x ${reg?.x1}), xu +1`, reg && reg.dm === Math.round(1 * reg.x1) && reg.dc === 1, JSON.stringify(reg));
  const G2 = await newGuest();
  const q0 = await prof(G2.id);
  G2.c.s.emit('action', 'beads'); await sleep(900);
  const q1 = await prof(G2.id);
  check('8. hồi quy: action animation beads không cho công đức/xu, không đếm vòng', q1.merit === q0.merit && q1.coins === q0.coins && rounds(G2.id) === 0, JSON.stringify({ q0, q1 }));
  G2.c.s.close();

  for (const G of [A, B, C, mC, E]) G.c.s.close();
  console.log(fails ? `\n${fails} FAIL` : '\nTẤT CẢ PASS');
} catch (e) {
  fails++;
  console.error('LỖI:', e.stack ?? e.message);
} finally {
  cleanup();
  process.exit(fails ? 1 : 0);
}
