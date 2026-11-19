/**
 * E2E thiền cộng dồn trong ngày trên server thật, DB tạm, cổng riêng.
 *
 * Kịch bản (rút ngắn thời gian bằng cách nạp sẵn số giây của ngày):
 *  1. Nạp 590 giây cho hôm nay -> ngồi 2 tick (~20 giây) là vượt mốc 600 -> phải nhận
 *     event `halo` grant tầng 1 và `meditation:daily` tăng dần.
 *  2. Đứng dậy: số giây được chốt xuống DB (số trong DB không nhỏ hơn số client thấy).
 *  3. Ngắt kết nối rồi vào lại: `meditation:daily` lúc join phải giữ số giây đã cộng dồn
 *     (không reset), chứng minh tiến độ do server lưu chứ không phải client.
 *  4. Kiểm tra `halo_daily` có cột `sec`/`level` đúng và không có dòng ngày cũ bị ghi đè.
 *
 * Chạy (tự bật server riêng):
 *   npx tsx tools/verify-meditation-e2e.mjs
 */
import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { io } from 'socket.io-client';
import { dayKeyICT } from '../shared/time.ts';
import { HALO_TIER1_SEC, HALO_TIER2_SEC, MEDITATE_TICK_MS } from '../shared/game.ts';

const PORT = Number(process.env.MED_PORT || 3021);
const base = `http://127.0.0.1:${PORT}`;
const dir = join(tmpdir(), `chua-med-e2e-${Date.now()}`);
mkdirSync(dir, { recursive: true });
const dbFile = join(dir, 'chuaonline.db');
const today = dayKeyICT();
const env = { ...process.env, PORT: String(PORT), DB_FILE: dbFile };
delete env.TURSO_DATABASE_URL;
delete env.TURSO_AUTH_TOKEN;

const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
server.stdout.on('data', (b) => { log += String(b); });
server.stderr.on('data', (b) => { log += String(b); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitServer() {
  for (let i = 0; i < 120; i++) {
    if (log.includes('Server chạy tại')) return;
    if (server.exitCode !== null) throw new Error(`server thoát sớm:\n${log}`);
    await sleep(250);
  }
  throw new Error(`server không lên:\n${log}`);
}

const waitEvent = (socket, event, predicate = () => true, ms = 20000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { socket.off(event, handler); reject(new Error(`Timeout ${event}\n${log}`)); }, ms);
  function handler(value) { if (!predicate(value)) return; clearTimeout(timer); socket.off(event, handler); resolve(value); }
  socket.on(event, handler);
});

let socket;
let db;
try {
  await waitServer();
  db = createClient({ url: `file:${dbFile}` });

  // Khách mới, DB tạm — không đụng tài khoản thật.
  const res = await fetch(`${base}/api/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert(res.ok, `guest ${res.status}`);
  const { token } = await res.json();
  const pidRow = (await db.execute({ sql: 'SELECT id FROM players ORDER BY id DESC LIMIT 1', args: [] })).rows[0];
  const pid = Number(pidRow.id);

  // Nạp 590 giây cộng dồn của hôm nay: chỉ còn ~10 giây là chạm mốc tầng 1.
  const seed = HALO_TIER1_SEC - 10;
  await db.execute({ sql: 'INSERT OR REPLACE INTO halo_daily (player_id, day_key, level, sec) VALUES (?,?,0,?)', args: [pid, today, seed] });

  socket = io(base, { auth: { token }, transports: ['websocket'], autoConnect: false });
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); socket.connect(); });

  const join = { name: 'Med E2E', outfit: 'monk', color: '#d9a62b', room: 'vo-luong', resume: `med-${Date.now()}` };
  const welcomeP = waitEvent(socket, 'welcome');
  const dailyJoinP = waitEvent(socket, 'meditation:daily');
  socket.emit('join', join);
  const welcome = await welcomeP;
  const dailyJoin = await dailyJoinP;
  assert.equal(dailyJoin.sec, seed, 'lúc join phải thấy số giây đã cộng dồn của hôm nay');
  assert.equal(dailyJoin.dayKey, today);
  assert.equal(welcome.players.find((p) => p.id === welcome.id)?.halo ?? 0, 0, 'chưa đủ mốc thì chưa có hào quang');

  // Ngồi thiền: gửi vị trí với anim 'sit' (đúng đường client dùng).
  const grantP = waitEvent(socket, 'halo', (h) => h.reason === 'grant', 45000);
  const progressP = waitEvent(socket, 'meditation:daily', (d) => d.sec >= HALO_TIER1_SEC && d.level === 1, 45000);
  socket.emit('move', { x: 0, z: 20, ry: 0, anim: 'sit' });
  const grant = await grantP;
  assert.equal(grant.level, 1, 'cộng dồn vượt 600 giây phải cấp hào quang tầng 1');
  const progress = await progressP;
  assert(progress.sec > seed, 'số giây hôm nay phải tăng khi đang ngồi');
  assert(progress.level === 1, `thông tin ngày phải phản ánh tầng vừa cấp (sec=${progress.sec}, level=${progress.level})`);

  // Ngồi thêm 1 tick nữa rồi đứng dậy: DB phải giữ số giây đã cộng.
  await sleep(MEDITATE_TICK_MS + 500);
  socket.emit('move', { x: 0, z: 20, ry: 0, anim: 'idle' });
  await sleep(1200);
  const rowAfterStand = (await db.execute({ sql: 'SELECT sec, level FROM halo_daily WHERE player_id = ? AND day_key = ?', args: [pid, today] })).rows[0];
  assert(Number(rowAfterStand.sec) >= progress.sec, `đứng dậy phải chốt giây xuống DB (DB ${rowAfterStand.sec} < client ${progress.sec})`);
  assert.equal(Number(rowAfterStand.level), 1, 'DB phải giữ tầng hào quang của ngày');
  const secAfterStand = Number(rowAfterStand.sec);

  // Vào lại sau khi đứng dậy: số giây không reset, hào quang vẫn giữ nguyên.
  socket.disconnect();
  await sleep(800);
  socket = io(base, { auth: { token }, transports: ['websocket'], autoConnect: false });
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); socket.connect(); });
  const welcome2P = waitEvent(socket, 'welcome');
  const daily2P = waitEvent(socket, 'meditation:daily');
  const halo2P = waitEvent(socket, 'halo');
  socket.emit('join', { ...join, resume: `med2-${Date.now()}` });
  await welcome2P;
  const daily2 = await daily2P;
  const halo2 = await halo2P;
  assert.equal(halo2.reason, 'join');
  assert.equal(halo2.level, 1, 'vào lại trong ngày vẫn giữ hào quang tầng 1');
  assert(daily2.sec >= secAfterStand, `vào lại phải giữ số giây đã cộng dồn (${daily2.sec} < ${secAfterStand})`);

  // Ngắt kết nối NGAY KHI ĐANG NGỒI: phần giây đã ngồi phải được chốt xuống DB.
  const beforeSitOut = daily2.sec;
  const sitOutDailyP = waitEvent(socket, 'meditation:daily', (d) => d.sec > beforeSitOut, 45000);
  socket.emit('move', { x: 0, z: 20, ry: 0, anim: 'sit' });
  const sitOutDaily = await sitOutDailyP;
  socket.disconnect();
  await sleep(1500);
  const rowAfterQuit = (await db.execute({ sql: 'SELECT sec FROM halo_daily WHERE player_id = ? AND day_key = ?', args: [pid, today] })).rows[0];
  const secAfterQuit = Number(rowAfterQuit.sec);
  assert(secAfterQuit >= sitOutDaily.sec, `thoát game khi đang ngồi phải chốt giây (DB ${secAfterQuit} < client ${sitOutDaily.sec})`);

  // Vào lại lần 3: vẫn giữ đủ số giây vừa chốt.
  socket = io(base, { auth: { token }, transports: ['websocket'], autoConnect: false });
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); socket.connect(); });
  const welcome3P = waitEvent(socket, 'welcome');
  const daily3P = waitEvent(socket, 'meditation:daily');
  socket.emit('join', { ...join, resume: `med3-${Date.now()}` });
  await welcome3P;
  const daily3 = await daily3P;
  assert(daily3.sec >= secAfterQuit, `vào lại sau khi thoát lúc đang ngồi phải giữ ${secAfterQuit}s (thấy ${daily3.sec})`);
  socket.disconnect();
  await sleep(600);

  // --- Khách thứ hai: mốc 20 phút chỉ phát MỘT tin hệ thống ---
  const res2 = await fetch(`${base}/api/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const { token: token2 } = await res2.json();
  const pid2 = Number((await db.execute({ sql: 'SELECT id FROM players ORDER BY id DESC LIMIT 1', args: [] })).rows[0].id);
  // Nạp sẵn 1190 giây + tầng 1 TRƯỚC khi join (server đọc số giây lúc join).
  await db.execute({ sql: 'INSERT OR REPLACE INTO halo_daily (player_id, day_key, level, sec) VALUES (?,?,1,?)', args: [pid2, today, HALO_TIER2_SEC - 10] });
  const socket2 = io(base, { auth: { token: token2 }, transports: ['websocket'], autoConnect: false });
  await new Promise((resolve, reject) => { socket2.once('connect', resolve); socket2.once('connect_error', reject); socket2.connect(); });
  const sysHits = [];
  socket2.on('chat', (m) => { if (m.sys && /hào quang lớn/.test(m.text)) sysHits.push(m.text); });
  const welcomeB = waitEvent(socket2, 'welcome');
  socket2.emit('join', { ...join, name: 'Med E2E B', resume: `medb-${Date.now()}` });
  await welcomeB;
  const grant2P = waitEvent(socket2, 'halo', (h) => h.reason === 'grant' && h.level === 2, 45000);
  socket2.emit('move', { x: 0, z: 20, ry: 0, anim: 'sit' });
  await grant2P;
  await sleep(MEDITATE_TICK_MS + 500);   // thêm tick để chắc chắn không phát lại
  assert.equal(sysHits.length, 1, `tin hệ thống mốc 20 phút phải đúng 1 lần (thấy ${sysHits.length})`);
  const rowB = (await db.execute({ sql: 'SELECT level FROM halo_daily WHERE player_id = ? AND day_key = ?', args: [pid2, today] })).rows[0];
  assert.equal(Number(rowB.level), 2, 'DB phải ghi tầng 2');
  socket2.disconnect();

  // Không có dòng ngày cũ nào bị tạo thêm.
  const days = (await db.execute({ sql: 'SELECT COUNT(*) AS n FROM halo_daily WHERE player_id = ?', args: [pid] })).rows[0];
  assert.equal(Number(days.n), 1, 'chỉ ghi đúng ngày hiện tại');

  console.log(`PASS: E2E thiền cộng dồn (port ${PORT}) — join thấy ${seed}s, ngồi cấp tầng 1, đứng dậy chốt ${secAfterStand}s, vào lại giữ ${daily2.sec}s, thoát lúc đang ngồi chốt ${secAfterQuit}s, mốc 20 phút báo đúng 1 lần.`);
} finally {
  try { socket?.disconnect(); } catch { /* bỏ qua */ }
  try { db?.close?.(); } catch { /* bỏ qua */ }
  server.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch { /* DB tạm */ }
}
