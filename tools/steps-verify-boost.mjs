// Nghiệm thu R1.4 (hệ số công đức theo giờ lễ & ngày âm lịch). Chạy trên DB tạm (DB_FILE); không đụng DB thật / Turso.
// usage: node tools/steps-verify-boost.mjs
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createClient } from '@libsql/client';
import { io } from 'socket.io-client';

const dir = mkdtempSync(join(tmpdir(), 'co-boost-'));
const file = join(dir, 'test.db');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const baseEnv = { ...process.env, DB_FILE: file };
delete baseEnv.TURSO_DATABASE_URL; delete baseEnv.TURSO_AUTH_TOKEN;

const dbUrl = resolve('server/db.ts');
const gameUrl = resolve('shared/game.ts');
const timeUrl = resolve('shared/time.ts');
const helper = join(dir, 'helper.mts');
writeFileSync(helper, `
const db = await import(${JSON.stringify(dbUrl)});
const game = await import(${JSON.stringify(gameUrl)});
const time = await import(${JSON.stringify(timeUrl)});
const cmd = process.argv[2];
let out = {};
if (cmd === 'boot') out = { ok: true };
if (cmd === 'lunar') out = time.solarToLunar(Number(process.argv[3]), Number(process.argv[4]), Number(process.argv[5]));
if (cmd === 'boost') out = time.meritBoost(new Date(Number(process.argv[3])));
if (cmd === 'now') out = time.meritBoost(new Date());
if (cmd === 'give') { await db.addItem(Number(process.argv[3]), process.argv[4], 1); out = { ok: true }; }
if (cmd === 'sutra') out = { id: game.SUTRAS[0].id };
console.log('@@' + JSON.stringify(out));
process.exit(0);
`);
const runHelper = (...args) => {
  const r = spawnSync('npx', ['tsx', helper, ...args], { env: baseEnv, encoding: 'utf8' });
  const m = /@@(.*)/.exec(r.stdout ?? '');
  if (!m) throw new Error('helper lỗi: ' + (r.stdout ?? '') + (r.stderr ?? ''));
  return JSON.parse(m[1]);
};
const ict = (y, mo, d, h, mi) => Date.UTC(y, mo - 1, d, h - 7, mi);

let srv;
const cleanup = () => { try { srv?.kill(); } catch {} try { rmSync(dir, { recursive: true, force: true }); } catch {} };

try {
  console.log('DB test:', file);

  // ---- Unit: âm lịch
  const lunarVec = [
    [[17, 2, 2026], [1, 1, 2026]], [[29, 1, 2025], [1, 1, 2025]], [[10, 2, 2024], [1, 1, 2024]],
    [[6, 10, 2025], [15, 8, 2025]], [[17, 9, 2024], [15, 8, 2024]],
  ];
  for (const [sol, lun] of lunarVec) {
    const r = runHelper('lunar', ...sol.map(String));
    check(`lunar ${sol.join('/')} -> ${lun.join('/')}`, r.day === lun[0] && r.month === lun[1] && r.year === lun[2] && r.leap === false, JSON.stringify(r));
  }
  const l11 = runHelper('lunar', '11', '11', '2026');
  check('lunar 11/11/2026 không thuộc {1,15}', l11.day !== 1 && l11.day !== 15, JSON.stringify(l11));

  // ---- Unit: meritBoost
  const bv = [
    [[2026, 11, 11, 4, 59], 1], [[2026, 11, 11, 5, 0], 2], [[2026, 11, 11, 5, 59], 2], [[2026, 11, 11, 6, 0], 1],
    [[2026, 11, 11, 12, 30], 2], [[2026, 11, 11, 20, 0], 2], [[2026, 11, 11, 21, 0], 1],
    [[2026, 2, 17, 8, 0], 1.5], [[2026, 2, 17, 5, 15], 3], [[2025, 10, 6, 13, 0], 1.5],
  ];
  for (const [t, want] of bv) {
    const r = runHelper('boost', String(ict(...t)));
    check(`meritBoost ICT ${t.join('-')} -> x${want}`, r.mult === want, JSON.stringify(r));
  }
  // ranh giới ngày ICT vs UTC: 17/02/2026 00:30 ICT = 16/02 17:30 UTC, vẫn Mùng 1
  check('meritBoost 17/02/2026 00:30 ICT (còn là 16/02 UTC) -> Mùng 1 x1.5', runHelper('boost', String(ict(2026, 2, 17, 0, 30))).mult === 1.5);
  check('meritBoost 16/02/2026 23:30 ICT -> không phải Mùng 1 (x1)', runHelper('boost', String(ict(2026, 2, 16, 23, 30))).mult === 1);

  // ---- Unit: bảng làm tròn
  const table = { 1: [2, 2, 3], 2: [3, 4, 6], 5: [8, 10, 15], 15: [23, 30, 45] };
  for (const [base, want] of Object.entries(table)) {
    const got = [1.5, 2, 3].map((m) => Math.round(Number(base) * m));
    check(`làm tròn gốc ${base}: ${want.join('/')}`, got.join() === want.join(), got.join('/'));
  }

  // ---- E2E
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
  const qty = async (id, item) => Number((await tdb.execute({ sql: 'SELECT qty FROM inventory WHERE player_id = ? AND item_id = ?', args: [id, item] })).rows[0]?.qty ?? 0);
  const connect = async (token) => {
    const s = io(base, { auth: { token } });
    const st = { boost: null };
    s.on('boost', (m) => (st.boost = m));
    await new Promise((r) => { s.on('welcome', r); s.on('connect', () => s.emit('join', { name: 'Test', outfit: 'male', color: '#72818e', room: 'vo-luong' })); });
    await sleep(500);
    return { s, st };
  };
  const ask = (c, ev, ...args) => new Promise((r) => c.s.emit(ev, ...args, r));
  const newGuest = async () => { const t = (await post('/api/guest')).token; const id = await maxId(); await tdb.execute({ sql: 'UPDATE players SET merit = 100, coins = 0 WHERE id = ?', args: [id] }); return { t, id, c: await connect(t) }; };
  /** Chạy fn; nếu hệ số đổi giữa chừng (qua mốc phút/giờ) thì làm lại bằng phần chuẩn bị mới. */
  const stable = async (prepare, fn) => {
    for (let i = 0; i < 3; i++) {
      const ctx = await prepare();
      const m1 = runHelper('now').mult;
      const res = await fn(ctx, m1);
      if (runHelper('now').mult === m1) return { ...res, m1 };
      console.log('   (hệ số đổi giữa chừng, thử lại)');
    }
    throw new Error('hệ số không ổn định');
  };

  const A = await newGuest();
  check('join: server đẩy event boost khớp meritBoost hiện tại', A.c.st.boost && A.c.st.boost.mult === runHelper('now').mult && typeof A.c.st.boost.session === 'boolean' && typeof A.c.st.boost.holy === 'boolean', JSON.stringify(A.c.st.boost));
  A.c.s.close();

  // 1. Thắp hương (gốc 1)
  const doAction = async (G, kind) => { G.c.s.emit('action', kind); await sleep(900); };
  const e1 = await stable(newGuest, async (G, m) => {
    const p0 = await prof(G.id);
    await doAction(G, 'incense');
    const p1 = await prof(G.id);
    G.c.s.close();
    return { dm: p1.merit - p0.merit, dc: p1.coins - p0.coins };
  });
  check(`1. thắp hương: công đức == round(1 x ${e1.m1})`, e1.dm === Math.round(1 * e1.m1), `delta=${e1.dm}`);
  check('1. thắp hương: xu +1', e1.dc === 1, `delta=${e1.dc}`);

  // 2. Thắp hương với Hương trầm (gốc 5)
  const e2 = await stable(async () => { const G = await newGuest(); runHelper('give', String(G.id), 'huong_tram'); return G; }, async (G, m) => {
    const p0 = await prof(G.id);
    const q0 = await qty(G.id, 'huong_tram');
    await doAction(G, 'incense');
    const p1 = await prof(G.id);
    const q1 = await qty(G.id, 'huong_tram');
    G.c.s.close();
    return { dm: p1.merit - p0.merit, dc: p1.coins - p0.coins, q0, q1 };
  });
  check(`2. Hương trầm: công đức == round(5 x ${e2.m1})`, e2.dm === Math.round(5 * e2.m1), `delta=${e2.dm}`);
  check('2. Hương trầm bị tiêu (1 -> 0), xu +1', e2.q0 === 1 && e2.q1 === 0 && e2.dc === 1, `qty ${e2.q0}->${e2.q1}, xu +${e2.dc}`);

  // 3. sutra:done (gốc 2)
  const sutraId = runHelper('sutra').id;
  const e3 = await stable(newGuest, async (G, m) => {
    const p0 = await prof(G.id);
    const ack = await ask(G.c, 'sutra:done', sutraId);
    await sleep(300);
    const p1 = await prof(G.id);
    G.c.s.close();
    return { ack, dm: p1.merit - p0.merit, dc: p1.coins - p0.coins };
  });
  check(`3. sutra:done ack.merit == round(2 x ${e3.m1})`, e3.ack.ok && e3.ack.merit === Math.round(2 * e3.m1), JSON.stringify(e3.ack));
  check('3. sutra:done: công đức DB khớp ack, xu +0', e3.dm === e3.ack.merit && e3.dc === 0, `merit +${e3.dm}, xu +${e3.dc}`);

  // 4. Hồi quy: điểm danh không bị nhân. Khách mới (merit đặt 100 nên không lên cấp) nhận ngày 1 = +3 công đức / +5 xu
  const G4 = await newGuest();
  const p40 = await prof(G4.id);
  const ck = await ask(G4.c, 'checkin:claim');
  await sleep(300);
  const p41 = await prof(G4.id);
  check('4. điểm danh ngày 1: ack 3 công đức / 5 xu (CHECKIN_REWARDS[0])', ck.ok && ck.merit === 3 && ck.coins === 5, JSON.stringify({ merit: ck.merit, coins: ck.coins }));
  check('4. điểm danh: DB +3 công đức / +5 xu (100 -> 103, không lên cấp nên không có bonus cấp)', p41.merit - p40.merit === 3 && p41.coins - p40.coins === 5, `merit ${p40.merit}->${p41.merit}, xu ${p40.coins}->${p41.coins}`);
  G4.c.s.close();

  console.log(fails ? `\n${fails} FAIL` : '\nTẤT CẢ PASS');
} catch (e) {
  fails++;
  console.error('LỖI:', e.stack ?? e.message);
} finally {
  cleanup();
  process.exit(fails ? 1 : 0);
}
