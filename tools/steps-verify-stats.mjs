// Nghiệm thu R1.5 (thống kê tích lũy trọn đời & mốc thành tựu). Chạy trên DB tạm (DB_FILE); không đụng DB thật / Turso.
// usage: node tools/steps-verify-stats.mjs
// Cooldown: mỗi kind hành động dùng một khách riêng (cooldown tính theo phiên), riêng ca "lạy lần 2" chờ đủ 2,2 giây.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createClient } from '@libsql/client';
import { io } from 'socket.io-client';

const dir = mkdtempSync(join(tmpdir(), 'co-stats-'));
const file = join(dir, 'test.db');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const baseEnv = { ...process.env, DB_FILE: file };
delete baseEnv.TURSO_DATABASE_URL; delete baseEnv.TURSO_AUTH_TOKEN;

const helper = join(dir, 'helper.mts');
writeFileSync(helper, `
const db = await import(${JSON.stringify(resolve('server/db.ts'))});
const game = await import(${JSON.stringify(resolve('shared/game.ts'))});
const time = await import(${JSON.stringify(resolve('shared/time.ts'))});
const a = process.argv.slice(2);
let out = {};
if (a[0] === 'bump') out = { value: await db.bumpStat(Number(a[1]), a[2], Number(a[3])) };
if (a[0] === 'claim') out = { got: await db.claimStatReward(Number(a[1]), a[2]) };
if (a[0] === 'stats') out = await db.getStats(Number(a[1]));
if (a[0] === 'now') out = time.meritBoost(new Date());
if (a[0] === 'sutra') out = { id: game.SUTRAS[0].id };
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
  const qty = async (id, item) => Number((await tdb.execute({ sql: 'SELECT qty FROM inventory WHERE player_id = ? AND item_id = ?', args: [id, item] })).rows[0]?.qty ?? 0);
  const connect = async (token) => {
    const s = io(base, { auth: { token }, forceNew: true });
    const st = { milestones: [], stats: null };
    s.on('milestone', (m) => st.milestones.push(m));
    s.on('stats', (m) => (st.stats = m));
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
  const doAction = async (G, kind) => { G.c.s.emit('action', kind); await sleep(900); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const ZERO = { bows: 0, chants: 0, lanterns: 0, meditateSec: 0, beadsRounds: 0 };

  // 1. Khách mới
  const A = await newGuest();
  const a0 = await ask(A.c, 'stats:get');
  check('1. khách mới: stats:get -> 5 số 0, claimed rỗng', a0.ok && same(a0.state.stats, ZERO) && a0.state.claimed.length === 0, JSON.stringify(a0.state));
  check('1. khách mới: event stats lúc join cũng toàn 0', A.c.st.stats && same(A.c.st.stats.stats, ZERO) && A.c.st.stats.claimed.length === 0);

  // 2. Từng kind trên khách riêng
  const kindCases = [['bow', 'bows'], ['chant', 'chants'], ['lantern', 'lanterns']];
  for (const [kind, field] of kindCases) {
    const G = kind === 'bow' ? A : await newGuest();
    await doAction(G, kind);
    const r = await ask(G.c, 'stats:get');
    const want = { ...ZERO, [field]: 1 };
    check(`2. action '${kind}' -> ${field} = 1, các số khác giữ 0`, same(r.state.stats, want), JSON.stringify(r.state.stats));
    if (kind !== 'bow') G.c.s.close();
  }
  const I = await newGuest();
  await doAction(I, 'incense');
  const ri = await ask(I.c, 'stats:get');
  check("2. action 'incense' -> không đếm gì (cả 5 số vẫn 0)", same(ri.state.stats, ZERO), JSON.stringify(ri.state.stats));
  I.c.s.close();

  // 3. sutra:done
  const sutraId = runHelper('sutra').id;
  const S = await newGuest();
  await doAction(S, 'chant');
  const sa = await ask(S.c, 'sutra:done', sutraId);
  await sleep(400);
  const rs = await ask(S.c, 'stats:get');
  check('3. chant + sutra:done -> chants = 2', sa.ok && rs.state.stats.chants === 2, JSON.stringify({ ack: sa, chants: rs.state.stats.chants }));
  S.c.s.close();

  // 4. Thiền
  const M = await newGuest();
  M.c.s.emit('move', { x: 0, z: 8, ry: 0, anim: 'sit' });
  await sleep(26000);
  const rm = await ask(M.c, 'stats:get');
  const sec = rm.state.stats.meditateSec;
  check('4. ngồi thiền ~26s (>= 2 tick) -> meditate_sec là bội số của 10 và >= 20', sec >= 20 && sec % 10 === 0, `meditate_sec=${sec}`);
  M.c.s.emit('move', { x: 0, z: 8, ry: 0, anim: 'idle' });
  M.c.s.close();

  // 5. Mốc đạt đúng 1 lần
  const B = await newGuest();
  check('5. helper bumpStat bows=99', runHelper('bump', B.id, 'bows', 99).value === 99);
  const c0 = (await prof(B.id)).coins;
  const q0 = await qty(B.id, 'nen_sap_ong');
  B.c.s.emit('action', 'bow'); await sleep(1200);
  const c1 = (await prof(B.id)).coins;
  const hit = B.c.st.milestones.filter((m) => m.id === 'bow100');
  check('5. lạy lần thứ 100 -> nhận đúng 1 event milestone bow100', hit.length === 1 && B.c.st.milestones.length === 1, JSON.stringify(B.c.st.milestones));
  check('5. xu +21 (1 xu của hành động lạy + 20 xu mốc)', c1 - c0 === 21, `xu ${c0}->${c1}`);
  const r5 = await ask(B.c, 'stats:get');
  check('5. claimed chứa bow100, bows = 100', r5.state.claimed.includes('bow100') && r5.state.stats.bows === 100, JSON.stringify(r5.state));
  await sleep(1200);
  B.c.s.emit('action', 'bow'); await sleep(1200);
  const c2 = (await prof(B.id)).coins;
  check('5. lạy tiếp -> KHÔNG có milestone mới, xu chỉ +1', B.c.st.milestones.length === 1 && c2 - c1 === 1, `milestones=${B.c.st.milestones.length}, xu ${c1}->${c2}`);
  check('5. mốc bow100 không tặng vật phẩm (nen_sap_ong không đổi)', (await qty(B.id, 'nen_sap_ong')) === q0);

  // 5b. Mốc có quà vật phẩm: bows 299 -> lạy -> bow300 tặng 1 nen_sap_ong (+50 xu); mốc bow100 đã claimed trước đó nên không trả lại
  runHelper('bump', B.id, 'bows', 297);
  await sleep(1200);
  const c3 = (await prof(B.id)).coins;
  B.c.s.emit('action', 'bow'); await sleep(1200);
  const c4 = (await prof(B.id)).coins;
  check('5b. bow300: event + xu +51 + tặng 1 Nến sáp ong', B.c.st.milestones.some((m) => m.id === 'bow300') && c4 - c3 === 51 && (await qty(B.id, 'nen_sap_ong')) === q0 + 1, `xu ${c3}->${c4}, nen=${await qty(B.id, 'nen_sap_ong')}`);

  // 6. claimStatReward 2 lần
  const g1 = runHelper('claim', B.id, 'lamp20').got, g2 = runHelper('claim', B.id, 'lamp20').got;
  check('6. claimStatReward 2 lần cùng 1 mốc -> true rồi false', g1 === true && g2 === false, `${g1},${g2}`);

  // 7. Bền vững
  const before = await ask(B.c, 'stats:get');
  B.c.s.close();
  await sleep(500);
  const B2 = { c: await connect(B.t) };
  const after = await ask(B2.c, 'stats:get');
  check('7. vào lại cùng tài khoản: stats + claimed giữ nguyên', same(before.state, after.state) && after.state.claimed.includes('bow100'), JSON.stringify(after.state));
  check('7. join đẩy event stats khớp stats:get', same(B2.c.st.stats, after.state));
  B2.c.s.close();

  // 8. Hồi quy: thắp hương theo hệ số R1.4
  let reg = null;
  for (let i = 0; i < 3 && !reg; i++) {
    const G = await newGuest();
    const m1 = runHelper('now').mult;
    const p0 = await prof(G.id);
    await doAction(G, 'incense');
    const p1 = await prof(G.id);
    G.c.s.close();
    if (runHelper('now').mult === m1) reg = { m1, dm: p1.merit - p0.merit, dc: p1.coins - p0.coins };
  }
  check(`8. hồi quy: thắp hương công đức == Math.round(1 x ${reg?.m1})`, reg && reg.dm === Math.round(1 * reg.m1) && reg.dc === 1, JSON.stringify(reg));

  A.c.s.close();
  console.log(fails ? `\n${fails} FAIL` : '\nTẤT CẢ PASS');
} catch (e) {
  fails++;
  console.error('LỖI:', e.stack ?? e.message);
} finally {
  cleanup();
  process.exit(fails ? 1 : 0);
}
