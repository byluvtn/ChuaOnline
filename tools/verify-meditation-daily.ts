/**
 * Kiểm chứng cô lập cơ chế thiền cộng dồn theo ngày:
 * - 5 phút + 5 phút (ngắt giữa chừng / disconnect) = 10 phút -> hào quang tầng 1
 * - cộng đủ 20 phút -> tầng 2, mốc system chat chỉ phát một lần
 * - ghi trùng / retry không làm tăng số giây
 * - qua 00:00 VN reset về 0, ngày mới không thừa kế giây cũ
 * Chạy: npx tsx tools/verify-meditation-daily.ts
 */
import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dayKeyICT } from '../shared/time.js';
import { HALO_TIER1_SEC, HALO_TIER2_SEC, MEDITATE_TICK_MS } from '../shared/game.js';
import {
  creditSitting, flushAbort, flushBegin, flushCommit, haloForSec, medTotalSec, newMeditationDay, pauseSitting, rollMeditationDay,
  type MeditationDayState,
} from '../server/meditation.js';

const dir = join(tmpdir(), `chua-med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
mkdirSync(dir, { recursive: true });
process.env.DB_FILE = join(dir, 'test.db');
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
const db = await import('../server/db.js');

const today = dayKeyICT();
const tomorrow = dayKeyICT(new Date(Date.now() + 24 * 3600_000));
// Khách thử nghiệm mới trong DB tạm — không đụng tài khoản có sẵn.
const guest = await db.createGuest();
const guestId = await db.playerIdByToken(guest.token);
assert.ok(guestId, 'phải tạo được người chơi thử nghiệm');

let sysMessages = 0;
let level: 0 | 1 | 2 = 0;

/** Một tick của vòng lặp thiền phía máy chủ: cộng giây, flush DB, rồi cấp hào quang theo tổng. */
async function serverTick(st: MeditationDayState, nowMs: number) {
  creditSitting(st, nowMs);
  const snap = flushBegin(st);
  if (snap) flushCommit(st, snap, (await db.accrueMeditationDaily(guestId, snap.total, snap.day)).sec);
  const target = haloForSec(medTotalSec(st, st.day));
  if (target > level) {
    level = target;
    await db.raiseHaloLevel(guestId, target, st.day);
    if (target === 2) sysMessages++;
  }
}

/** Ngồi thiền `minutes` phút, tick mỗi 10 giây đúng như máy chủ thật. */
async function sitFor(st: MeditationDayState, startMs: number, minutes: number): Promise<number> {
  const ticks = (minutes * 60_000) / MEDITATE_TICK_MS;
  let t = startMs;
  await serverTick(st, t);                       // tick đầu chỉ ghi mốc, chưa cộng bù
  for (let i = 0; i < ticks; i++) { t += MEDITATE_TICK_MS; await serverTick(st, t); }
  return t;
}

try {
  // --- Phiên 1: 5 phút, chưa đủ mốc ---
  const st = newMeditationDay(today);
  let t = await sitFor(st, 0, 5);
  assert.equal(medTotalSec(st, today), 300, 'ngồi 5 phút cộng đúng 300 giây');
  assert.equal(level, 0, '5 phút chưa đủ hào quang tầng 1');

  // --- Đứng dậy / thoát game, rồi ngồi tiếp 5 phút buổi chiều ---
  pauseSitting(st);                              // đứng dậy: ngắt mốc
  t = await sitFor(st, 12 * 3600_000, 5);        // 6 tiếng sau ngồi lại, không cộng bù lúc đứng
  assert.equal(medTotalSec(st, today), HALO_TIER1_SEC, '5 + 5 phút phải cộng dồn thành 10 phút');
  assert.equal(level, 1, 'cộng dồn 10 phút phải đạt hào quang tầng 1');
  assert.equal((await db.getMeditationDaily(guestId, today)).sec, HALO_TIER1_SEC);
  assert.equal(await db.getHaloLevel(guestId), 1);

  // --- Ghi trùng / retry: DB giữ MAX nên số giây không tăng ---
  const dupe = await db.accrueMeditationDaily(guestId, HALO_TIER1_SEC, today);
  assert.equal(dupe.sec, HALO_TIER1_SEC, 'ghi lại tổng cũ không làm tăng giây');
  const stale = await db.accrueMeditationDaily(guestId, 10, today);
  assert.equal(stale.sec, HALO_TIER1_SEC, 'giá trị nhỏ hơn bị bỏ qua');

  // --- DB lỗi trong lúc flush: phần giữ chỗ trả về hàng chờ, retry ghi lại đúng tổng ---
  creditSitting(st, t + MEDITATE_TICK_MS);        // +10 giây
  const retrySnap = flushBegin(st)!;
  flushAbort(st, retrySnap);
  const hangCho = medTotalSec(st, today);
  assert.equal(hangCho, HALO_TIER1_SEC + 10, 'giây không mất khi DB lỗi');
  const flushNow = flushBegin(st)!;
  const stored = await db.accrueMeditationDaily(guestId, flushNow.total, flushNow.day);
  flushCommit(st, flushNow, stored.sec);
  assert.equal(flushNow.total, hangCho, 'retry ghi đúng tổng đang giữ, không cộng đôi');
  assert.equal(stored.sec, hangCho, 'DB nhận đúng tổng sau retry');
  assert.equal(medTotalSec(st, today), hangCho, 'bộ nhớ và DB khớp sau retry');

  // --- Ngồi tiếp 10 phút nữa (phiên thứ ba) vẫn vượt mốc 20 phút ---
  pauseSitting(st);
  t = await sitFor(st, 20 * 3600_000, 10);
  assert.equal(medTotalSec(st, today), hangCho + 600, 'cộng dồn tiếp 10 phút từ tổng hiện tại');
  assert.equal(level, 2, 'đủ 20 phút cộng dồn phải đạt hào quang tầng 2');
  assert.equal(sysMessages, 1, 'tin hệ thống mốc 20 phút chỉ được gửi một lần');
  assert.equal(await db.raiseHaloLevel(guestId, 2, today), false); // retry cấp tầng
  assert.equal(sysMessages, 1, 'retry không gửi thêm tin hệ thống');
  assert.equal(await db.getHaloLevel(guestId), 2);

  // --- Qua 00:00 VN: reset về 0, không mang giây cũ sang ngày mới ---
  assert.notEqual(today, tomorrow, 'phải chọn được ngày khác để thử rollover');
  const midnight = Date.parse(`${tomorrow}T00:00:00+07:00`);
  st.creditAt = midnight - 2_000;
  const next = rollMeditationDay(st, tomorrow);
  assert.equal(medTotalSec(next, tomorrow), 0, 'ngày mới bắt đầu từ 0 giây');
  assert.equal(medTotalSec(st, today), HALO_TIER2_SEC + 12, 'hai giây trước 00:00 thuộc ngày cũ');
  creditSitting(next, midnight + 3_000);
  assert.equal(medTotalSec(next, tomorrow), 3, 'ba giây sau 00:00 thuộc ngày mới');
  const fresh = await db.getMeditationDaily(guestId, tomorrow);
  assert.equal(fresh.sec, 0, 'ngày mới trong DB bắt đầu từ 0');
  assert.equal(fresh.level, 0, 'hào quang ngày mới tắt');
  assert.equal((await db.getMeditationDaily(guestId, today)).sec, HALO_TIER2_SEC + 10, 'số liệu hôm qua vẫn giữ nguyên');

  // --- Hôm sau thiền 5 phút: mốc tính lại từ 0, chưa đủ tầng 1 ---
  const st2 = newMeditationDay(tomorrow);
  await sitFor(st2, 0, 5);
  assert.equal(medTotalSec(st2, tomorrow), 300);
  assert.equal(haloForSec(medTotalSec(st2, tomorrow)), 0, '5 phút của ngày mới chưa đủ tầng 1');

  console.log('PASS: cộng dồn 5+5=10 phút, retry/ghi trùng, mốc 20 phút một lần, reset 00:00 VN.');
} finally {
  // Windows giữ handle file SQLite thêm một nhịp: dọn tối đa, lỗi thì bỏ qua.
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch { /* DB tạm, không quan trọng */ }
}
