// Nghiệm thu R1.3 (vòng quay may mắn). Chạy trên DB tạm (DB_FILE); không đụng DB thật / Turso.
// usage: node tools/steps-verify-spin.mjs
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createClient } from '@libsql/client';
import { io } from 'socket.io-client';

const dir = mkdtempSync(join(tmpdir(), 'co-spin-'));
const file = join(dir, 'test.db');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const baseEnv = { ...process.env, DB_FILE: file };
delete baseEnv.TURSO_DATABASE_URL; delete baseEnv.TURSO_AUTH_TOKEN;

const dbUrl = resolve('server/db.ts');
const gameUrl = resolve('shared/game.ts');
const helper = join(dir, 'helper.mts');
writeFileSync(helper, `
const db = await import(${JSON.stringify(dbUrl)});
const game = await import(${JSON.stringify(gameUrl)});
const cmd = process.argv[2];
let out = {};
if (cmd === 'boot') out = { ok: true };
if (cmd === 'draw') {
  const n = Number(process.argv[3]);
  const counts = new Array(game.SPIN_SEGMENTS.length).fill(0);
  for (let i = 0; i < n; i++) counts[game.drawSpinSegment()]++;
  out = { counts, segments: game.SPIN_SEGMENTS };
}
if (cmd === 'count') out = { n: await db.minigameCount(Number(process.argv[3]), process.argv[4]) };
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
  const PORT = 3100 + Math.floor(Math.random() * 400);
  const base = `http://localhost:${PORT}`;
  srv = spawn('npx', ['tsx', 'server/index.ts'], { env: { ...baseEnv, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  srv.stdout.on('data', (d) => (out += d)); srv.stderr.on('data', (d) => (out += d));
  for (let i = 0; i < 60 && !/mode: /.test(out); i++) await sleep(250);
  if (!/mode: local file/.test(out)) throw new Error('server khong o che do local file:\n' + out);
  for (let i = 0; i < 40; i++) { try { await fetch(base + '/api/guest', { method: 'OPTIONS' }); break; } catch { await sleep(250); } }

  const SEG = runHelper('draw', '1').out.segments;
  const post = async (path, body, token) => (await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body ?? {}) })).json();
  const maxId = async () => Number((await tdb.execute('SELECT MAX(id) AS m FROM players')).rows[0].m);
  const prof = async (id) => { const r = (await tdb.execute({ sql: 'SELECT merit, coins FROM players WHERE id = ?', args: [id] })).rows[0]; return { merit: Number(r.merit), coins: Number(r.coins) }; };
  const inv = async (id) => Object.fromEntries((await tdb.execute({ sql: 'SELECT item_id, qty FROM inventory WHERE player_id = ?', args: [id] })).rows.map((r) => [r.item_id, Number(r.qty)]));
  const connect = async (token) => {
    const s = io(base, { auth: { token } });
    const st = { spinEvt: null };
    s.on('spin', (m) => (st.spinEvt = m));
    await new Promise((r) => { s.on('welcome', r); s.on('connect', () => s.emit('join', { name: 'Test', outfit: 'male', color: '#72818e', room: 'vo-luong' })); });
    await sleep(500);
    return { s, st };
  };
  const ask = (c, ev, ...args) => new Promise((r) => c.s.emit(ev, ...args, r));
  const newGuest = async () => { const t = (await post('/api/guest')).token; const id = await maxId(); return { t, id, c: await connect(t) }; };

  // 1. Khách mới
  const G = await newGuest();
  check('1. event spin lúc join: used = false', G.c.st.spinEvt?.used === false, JSON.stringify(G.c.st.spinEvt));
  let r = await ask(G.c, 'spin:get');
  check('1. spin:get -> ok, used false', r.ok && r.used === false, JSON.stringify(r));

  // 2. Quay lần 1
  await tdb.execute({ sql: 'UPDATE players SET merit = 0, coins = 0 WHERE id = ?', args: [G.id] });
  const p0 = await prof(G.id), i0 = await inv(G.id);
  r = await ask(G.c, 'spin:play');
  await sleep(300);
  const p1 = await prof(G.id), i1 = await inv(G.id);
  const sg = SEG[r.segment];
  check('2. spin:play ok, segment trong [0,7]', r.ok && Number.isInteger(r.segment) && r.segment >= 0 && r.segment <= 7, JSON.stringify(r));
  check('2. ack merit/coins/item khớp SPIN_SEGMENTS[segment]', sg && r.merit === sg.merit && r.coins === sg.coins && r.item === sg.item, `${sg?.label}`);
  check('2. profile tăng >= phần thưởng ô', p1.merit - p0.merit >= sg.merit && p1.coins - p0.coins >= sg.coins, `merit ${p0.merit}->${p1.merit}, coins ${p0.coins}->${p1.coins}`);
  check('2. túi +1 đúng món nếu có item', sg.item ? (i1[sg.item] ?? 0) - (i0[sg.item] ?? 0) === 1 : JSON.stringify(i0) === JSON.stringify(i1), JSON.stringify(i1));
  r = await ask(G.c, 'spin:get');
  check('2. spin:get sau khi quay: used true', r.used === true);

  // 3. Lần 2
  const pb = await prof(G.id);
  r = await ask(G.c, 'spin:play');
  check('3. spin:play lần 2 cùng ngày: ok false', r.ok === false && r.used === true, JSON.stringify(r));
  check('3. profile không đổi sau lần 2', JSON.stringify(await prof(G.id)) === JSON.stringify(pb));

  // 4. Song song
  const P = await newGuest();
  const par = await Promise.all([1, 2, 3, 4].map(() => ask(P.c, 'spin:play')));
  check('4. 4 spin:play song song: đúng 1 ok', par.filter((x) => x.ok).length === 1, par.map((x) => x.ok).join(','));
  check('4. DB minigame_daily quay count = 1', runHelper('count', String(P.id), 'quay').out.n === 1);

  // 5. Phân phối
  const N = 20000;
  const { counts } = runHelper('draw', String(N)).out;
  const share = counts.map((c) => c / N);
  console.log('   phân phối:', SEG.map((s, i) => `${s.label}=${(share[i] * 100).toFixed(1)}%`).join(' | '));
  check('5. mọi ô trúng ít nhất 1 lần', counts.every((c) => c > 0));
  check('5. ĐẠI CÁT 2%-9%', share[7] >= 0.02 && share[7] <= 0.09, `${(share[7] * 100).toFixed(2)}%`);
  check('5. ô weight >= 16 trúng >= nửa kỳ vọng', SEG.every((s, i) => s.weight < 16 || share[i] >= s.weight / 100 / 2));
  check('5. tổng weight = 100', SEG.reduce((a, s) => a + s.weight, 0) === 100);

  // 6. Không ảnh hưởng moh
  check('6. minigameCount(moh) vẫn 0 sau khi quay', runHelper('count', String(G.id), 'moh').out.n === 0);
  r = await ask(G.c, 'minigame:reward', 'moh');
  check('6. minigame:reward moh vẫn nhận bình thường', r.ok === true && r.merit === 3 && r.coins === 2, JSON.stringify(r));

  // 7. Ngày hôm sau
  const Y = await newGuest();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  await tdb.execute({ sql: "INSERT INTO minigame_daily (player_id, day_key, game, count) VALUES (?, ?, 'quay', 1)", args: [Y.id, yesterday] });
  r = await ask(Y.c, 'spin:get');
  check('7. có dòng hôm qua: spin:get used = false', r.ok && r.used === false, JSON.stringify(r));
  r = await ask(Y.c, 'spin:play');
  check('7. ngày hôm sau quay lại được', r.ok === true, JSON.stringify(r));

  [G, P, Y].forEach((p) => p.c.s.close());
  console.log(fails ? `\n${fails} FAIL` : '\nTẤT CẢ PASS');
} catch (e) {
  fails++;
  console.error('LỖI:', e.stack ?? e.message);
} finally {
  cleanup();
  process.exit(fails ? 1 : 0);
}
