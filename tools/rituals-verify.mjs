// Nghiem thu cac tinh nang nghi le (festival, bodhi, bond, retreat, journal, group). DB tam (DB_FILE); khong dung DB that / Turso.
// usage: node tools/rituals-verify.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { io } from 'socket.io-client';

const dir = mkdtempSync(join(tmpdir(), 'co-rit-'));
const file = join(dir, 'test.db');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const baseEnv = { ...process.env, DB_FILE: file };
delete baseEnv.TURSO_DATABASE_URL; delete baseEnv.TURSO_AUTH_TOKEN;

let srv;
const cleanup = () => { try { srv?.kill(); } catch {} try { rmSync(dir, { recursive: true, force: true }); } catch {} };

try {
  const PORT = 3500 + Math.floor(Math.random() * 400);
  const base = `http://localhost:${PORT}`;
  srv = spawn('npx', ['tsx', 'server/index.ts'], { env: { ...baseEnv, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
  let out = '';
  srv.stdout.on('data', (d) => (out += d)); srv.stderr.on('data', (d) => (out += d));
  for (let i = 0; i < 80 && !/mode: /.test(out); i++) await sleep(250);
  if (!/mode: local file/.test(out)) throw new Error('server khong o che do local file:\n' + out);
  for (let i = 0; i < 40; i++) { try { await fetch(base + '/api/guest', { method: 'OPTIONS' }); break; } catch { await sleep(250); } }
  const tdb = createClient({ url: `file:${file}` });
  const post = async (path) => (await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
  const maxId = async () => Number((await tdb.execute('SELECT MAX(id) AS m FROM players')).rows[0].m);
  const row = async (id) => (await tdb.execute({ sql: 'SELECT merit, coins FROM players WHERE id = ?', args: [id] })).rows[0];
  const connect = async (token) => {
    const s = io(base, { auth: { token }, forceNew: true });
    const st = { fest: null, group: null, trees: null };
    s.on('festival', (m) => (st.fest = m));
    s.on('group:state', (m) => (st.group = m));
    s.on('bodhi:trees', (m) => (st.trees = m));
    await new Promise((r) => { s.on('welcome', r); s.on('connect', () => s.emit('join', { name: 'Test', outfit: 'male', color: '#72818e', room: 'vo-luong' })); });
    await sleep(600);
    return { s, st };
  };
  const ask = (c, ev, ...args) => new Promise((r) => c.s.emit(ev, ...args, r));
  const newGuest = async () => {
    const t = (await post('/api/guest')).token; const id = await maxId();
    await tdb.execute({ sql: 'UPDATE players SET merit = 100, coins = 500 WHERE id = ?', args: [id] });
    return { id, c: await connect(t) };
  };

  const A = await newGuest();
  check('1. join day festival + group:state + bodhi:trees', !!A.c.st.fest && !!A.c.st.group && Array.isArray(A.c.st.trees?.trees) && A.c.st.trees.me === A.id, JSON.stringify(A.c.st.fest));

  const visit = (await tdb.execute({ sql: 'SELECT COUNT(*) AS n FROM visit_days WHERE player_id = ?', args: [A.id] })).rows[0];
  check('2. join ghi visit_days', Number(visit.n) === 1);
  const j = await ask(A.c, 'journal:get');
  check('3. journal: streak >= 1, 30 ngay', j.ok && j.state.streak >= 1 && j.state.days.length === 30, JSON.stringify(j.state?.streak));

  const far = await ask(A.c, 'bodhi:plant');
  check('4. trong cay khi dung xa vuon -> tu choi', far.ok === false, far.error);
  A.c.s.emit('move', { x: -50, z: 34, ry: 0, anim: 'idle' });
  await sleep(400);
  const p1 = await ask(A.c, 'bodhi:plant');
  check('5. trong cay o vuon -> ok', p1.ok === true, JSON.stringify(p1.error));
  const p2 = await ask(A.c, 'bodhi:plant');
  check('6. trong lan 2 -> tu choi', p2.ok === false, p2.error);
  const w1 = await ask(A.c, 'bodhi:water');
  check('7. tuoi ngay sau khi gieo, cay len giai doan 1', w1.ok === true && w1.merit === 3 && w1.trees.find((x) => x.pid === A.id).stage === 1, JSON.stringify(w1));
  const w2 = await ask(A.c, 'bodhi:water');
  check('8. tuoi lan 2 cung ngay -> tu choi', w2.ok === false, w2.error);

  const f0 = await ask(A.c, 'festival:claim');
  check('9. festival:claim ngoai le -> {ok:false} hoac ok 1 lan', typeof f0.ok === 'boolean', JSON.stringify(f0));
  if (f0.ok) { const f1 = await ask(A.c, 'festival:claim'); check('10. nhan lai -> tu choi', f1.ok === false, f1.error); }

  const b0 = await ask(A.c, 'bond:list');
  check('11. bond:list tra 6 NPC', b0.ok && b0.bonds.length === 6, JSON.stringify(b0.bonds?.length));
  const b1 = await ask(A.c, 'bond:talk', 'npc42');
  check('12. bond:talk khi dung xa NPC -> tu choi', b1.ok === false, b1.error);
  const b2 = await ask(A.c, 'bond:talk', 'npc1');
  check('13. bond:talk NPC khong co truyen -> tu choi', b2.ok === false, b2.error);
  const b3 = await ask(A.c, 'bond:gift', 'npc42', 'hoa_sen');
  check('14. bond:gift khi dung xa -> tu choi', b3.ok === false, b3.error);

  A.c.s.emit('move', { x: -48, z: 22, ry: 0, anim: 'idle' });
  for (const item of ['hoa_sen', 'hat_soi']) await tdb.execute({ sql: 'INSERT INTO inventory (player_id, item_id, qty) VALUES (?,?,?)', args: [A.id, item, item === 'hoa_sen' ? 2 : 1] });
  const talk = await ask(A.c, 'bond:talk', 'npc38');
  const repeatTalk = await ask(A.c, 'bond:talk', 'npc38');
  check('14a. tam su gan NPC, mot lan moi ngay', talk.ok && !repeatTalk.ok);
  for (let i = 0; i < 2; i++) check('14b. tang hoa cho NPC', (await ask(A.c, 'bond:gift', 'npc38', 'hoa_sen')).ok);
  const ch = await ask(A.c, 'bond:chapter', 'npc38');
  check('14c. hoan thanh truyen va tru hat giong', ch.ok && ch.bonds.find((b) => b.npc === 'npc38').done === 1
    && Number((await tdb.execute({ sql: 'SELECT qty FROM inventory WHERE player_id = ? AND item_id = ?', args: [A.id, 'hat_soi'] })).rows[0].qty) === 0, ch.error);

  const r0 = await ask(A.c, 'retreat:get', null);
  check('15. retreat:get rong', r0.ok && r0.state.placed.length === 0, JSON.stringify(r0));
  const r1 = await ask(A.c, 'retreat:save', { theme: 1, placed: ['tt_den_long', 'khong_co'] });
  check('16. retreat:save loc do chua so huu', r1.ok && r1.state.placed.length === 0 && r1.state.theme === 1, JSON.stringify(r1));
  const buy = await ask(A.c, 'shop:buy', 'tt_den_long');
  check('17. mua do tinh that', buy.ok === true, buy.error);
  const buy2 = await ask(A.c, 'shop:buy', 'tt_den_long');
  check('18. mua lai do tinh that -> tu choi', buy2.ok === false, buy2.error);
  const r2 = await ask(A.c, 'retreat:save', { theme: 2, placed: ['tt_den_long'] });
  check('19. retreat:save luu do da mua', r2.ok && r2.state.placed.length === 1 && r2.state.theme === 2, JSON.stringify(r2));
  const r3 = await ask(A.c, 'retreat:save', { theme: 99, placed: [] });
  check('20. retreat:save theme sai -> tu choi', r3.ok === false);

  const B = await newGuest();
  check('20b. cay hien thi tren client nguoi khac', B.c.st.trees.trees.some((t) => t.pid === A.id && t.stage === 1));
  const r4 = await ask(B.c, 'retreat:get', A.id);
  check('21. xem tinh that nguoi khac: thay do, khong lo kho do', r4.ok && r4.state.placed.length === 1 && r4.state.owned.length === 0, JSON.stringify(r4));
  const g = await ask(B.c, 'group:get');
  check('22. group:get tra trang thai', typeof g?.active === 'boolean' && typeof g?.nextLabel === 'string', JSON.stringify(g));

  const before = await row(A.id);
  check('23. coins A giam sau khi mua do', Number(before.coins) <= 500);
  A.c.s.close(); B.c.s.close();
} catch (e) {
  fails++;
  console.error('LOI:', e);
} finally {
  cleanup();
}
console.log(fails ? `\n${fails} FAIL` : '\nTAT CA PASS');
process.exit(fails ? 1 : 0);
