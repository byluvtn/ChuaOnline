// Nghiệm thu R1.1 (điểm danh + streak). Chạy server riêng với DB test tạm; không đụng DB thật / Turso.
// usage: node tools/steps-verify-checkin.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { io } from 'socket.io-client';

const dir = mkdtempSync(join(tmpdir(), 'co-checkin-'));
const file = join(dir, 'test.db');
const PORT = 3100 + Math.floor(Math.random() * 400);
const base = `http://localhost:${PORT}`;
const env = { ...process.env, DB_FILE: file, PORT: String(PORT) };
delete env.TURSO_DATABASE_URL; delete env.TURSO_AUTH_TOKEN;
const srv = spawn('npx', ['tsx', 'server/index.ts'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let out = '';
srv.stdout.on('data', (d) => (out += d)); srv.stderr.on('data', (d) => (out += d));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const cleanup = () => { srv.kill(); try { rmSync(dir, { recursive: true, force: true }); } catch {} };

try {
  for (let i = 0; i < 60 && !/mode: /.test(out); i++) await sleep(250);
  if (!/mode: local file/.test(out)) throw new Error('server khong o che do local file:\n' + out);
  for (let i = 0; i < 40; i++) { try { await fetch(base + '/api/guest', { method: 'OPTIONS' }); break; } catch { await sleep(250); } }
  console.log('DB test:', file);

  const tdb = createClient({ url: `file:${file}` });
  const dk = (off) => new Date(Date.now() + off * 86_400_000).toISOString().slice(0, 10);
  const merit = async (id) => Number((await tdb.execute({ sql: 'SELECT merit, coins FROM players WHERE id = ?', args: [id] })).rows[0].merit);
  const coins = async (id) => Number((await tdb.execute({ sql: 'SELECT merit, coins FROM players WHERE id = ?', args: [id] })).rows[0].coins);

  const newPlayer = async () => {
    const { token } = await (await fetch(base + '/api/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
    const id = Number((await tdb.execute('SELECT MAX(id) AS m FROM players')).rows[0].m);
    const s = io(base, { auth: { token } });
    const st = { profile: null, pushed: null };
    s.on('profile', (p) => (st.profile = p));
    s.on('checkin', (c) => (st.pushed = c));
    await new Promise((r) => { s.on('welcome', r); s.on('connect', () => s.emit('join', { name: 'Test', outfit: 'male', color: '#72818e', room: 'vo-luong' })); });
    await sleep(500);
    return { id, s, st };
  };
  const claim = (p) => new Promise((r) => p.s.emit('checkin:claim', r));
  const get = (p) => new Promise((r) => p.s.emit('checkin:get', r));
  const setRow = (id, last_day, streak) => tdb.execute({ sql: 'INSERT INTO checkins (player_id, last_day, streak, total) VALUES (?,?,?,?) ON CONFLICT(player_id) DO UPDATE SET last_day=?, streak=?', args: [id, last_day, streak, streak, last_day, streak] });

  // --- Tài khoản A: 1 -> 2 ---
  const A = await newPlayer();
  check('join: server đẩy event checkin (chưa nhận)', A.st.pushed && A.st.pushed.claimedToday === false && A.st.pushed.streak === 0, JSON.stringify(A.st.pushed));
  let m0 = await merit(A.id), c0 = await coins(A.id);
  let r = await claim(A);
  check('1. claim lần đầu ok, streak 1, cycleDay 1', r.ok && r.streak === 1 && r.cycleDay === 1, JSON.stringify(r));
  check('1. profile +3 công đức / +5 xu', (await merit(A.id)) - m0 === 3 && (await coins(A.id)) - c0 === 5, `merit ${m0}->${await merit(A.id)}, coins ${c0}->${await coins(A.id)}`);
  check('1. profile push tới client', A.st.profile && A.st.profile.merit === m0 + 3 && A.st.profile.coins === c0 + 5);
  check('1. state sau claim: claimedToday', r.state?.claimedToday === true && r.state?.streak === 1 && r.state?.total === 1);

  m0 = await merit(A.id); c0 = await coins(A.id);
  r = await claim(A);
  check('2. claim lần 2 cùng ngày bị chặn', r.ok === false && /đã điểm danh/.test(r.error ?? ''), JSON.stringify(r));
  check('2. profile không đổi', (await merit(A.id)) === m0 && (await coins(A.id)) === c0);
  const g = await get(A);
  check('2. checkin:get trả state đúng', g.ok && g.state.claimedToday === true && g.state.streak === 1 && g.state.total === 1, JSON.stringify(g));
  // chạy 5 lệnh claim song song: chỉ được tối đa 0 thành công (đã nhận)
  const par = await Promise.all([1, 2, 3, 4, 5].map(() => claim(A)));
  check('2. 5 claim song song cùng ngày: không cái nào thành công', par.every((x) => !x.ok));

  await tdb.execute({ sql: 'UPDATE checkins SET last_day = ? WHERE player_id = ?', args: [dk(-1), A.id] });
  m0 = await merit(A.id); c0 = await coins(A.id);
  r = await claim(A);
  check('3. last_day=hôm qua -> streak 2, cycleDay 2', r.ok && r.streak === 2 && r.cycleDay === 2, JSON.stringify(r));
  check('3. thưởng ngày 2: +5 công đức / +5 xu', (await merit(A.id)) - m0 === 5 && (await coins(A.id)) - c0 === 5, `+${(await merit(A.id)) - m0} / +${(await coins(A.id)) - c0}`);

  // --- Tài khoản B: đứt chuỗi ---
  const B = await newPlayer();
  await setRow(B.id, dk(-2), 5);
  const gb = await get(B);
  check('4. state trước claim: chuỗi đã đứt hiển thị 0', gb.ok && gb.state.streak === 0 && gb.state.claimedToday === false, JSON.stringify(gb.state));
  m0 = await merit(B.id); c0 = await coins(B.id);
  r = await claim(B);
  check('4. last_day=2 ngày trước (streak 5) -> streak 1, cycleDay 1', r.ok && r.streak === 1 && r.cycleDay === 1, JSON.stringify(r));
  check('4. thưởng ngày 1: +3 công đức / +5 xu', (await merit(B.id)) - m0 === 3 && (await coins(B.id)) - c0 === 5);

  // --- Tài khoản C: ngày 7 + vật phẩm ---
  const C = await newPlayer();
  await tdb.execute({ sql: 'UPDATE players SET merit = 40 WHERE id = ?', args: [C.id] }); // 40 -> 70 không qua mốc cấp, tránh cộng thưởng lên cấp
  await setRow(C.id, dk(-1), 6);
  const qty = async () => Number((await tdb.execute({ sql: "SELECT qty FROM inventory WHERE player_id = ? AND item_id = 'den_hoa_dang'", args: [C.id] })).rows[0]?.qty ?? 0);
  m0 = await merit(C.id); c0 = await coins(C.id); const q0 = await qty();
  r = await claim(C);
  check('5. streak 6 + hôm qua -> cycleDay 7, streak 7', r.ok && r.streak === 7 && r.cycleDay === 7 && r.item === 'den_hoa_dang', JSON.stringify(r));
  check('5. +30 công đức / +30 xu', (await merit(C.id)) - m0 === 30 && (await coins(C.id)) - c0 === 30, `+${(await merit(C.id)) - m0} / +${(await coins(C.id)) - c0}`);
  check('5. túi có thêm đúng 1 den_hoa_dang', (await qty()) - q0 === 1, `${q0}->${await qty()}`);
  check('5. profile client thấy inventory', C.st.profile?.inventory?.den_hoa_dang === 1);

  // sau ngày 7, chu kỳ mới: ngày 8 -> cycleDay 1, streak 8
  await tdb.execute({ sql: 'UPDATE checkins SET last_day = ? WHERE player_id = ?', args: [dk(-1), C.id] });
  r = await claim(C);
  check('6. streak 7 + hôm qua -> streak 8, cycleDay 1 (chu kỳ mới)', r.ok && r.streak === 8 && r.cycleDay === 1, JSON.stringify(r));

  [A, B, C].forEach((p) => p.s.close());
  console.log(fails ? `\n${fails} FAIL` : '\nTẤT CẢ PASS');
} catch (e) {
  fails++;
  console.error('LỖI:', e.message);
} finally {
  cleanup();
  process.exit(fails ? 1 : 0);
}
