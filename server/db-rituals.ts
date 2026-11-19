import type { Transaction } from '@libsql/client';
import { db } from './db.js';
import { dayKeyICT, weekKey } from '../shared/time.js';
import { BODHI_SLOTS, BODHI_STALE_DAYS, BODHI_WILT_DAYS, BODHI_WATER_REWARD, bodhiStageOf, type BodhiTree, type BondChapterDef, type JournalDay, type JournalState } from '../shared/rituals.js';

await db.executeMultiple(`
CREATE TABLE IF NOT EXISTS ritual_claims (
  player_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  claim_key TEXT NOT NULL,
  PRIMARY KEY (player_id, kind, claim_key)
);
CREATE TABLE IF NOT EXISTS visit_days (
  player_id INTEGER NOT NULL,
  day_key TEXT NOT NULL,
  PRIMARY KEY (player_id, day_key)
);
CREATE TABLE IF NOT EXISTS bodhi_trees (
  player_id INTEGER PRIMARY KEY,
  slot INTEGER NOT NULL UNIQUE,
  waters INTEGER NOT NULL DEFAULT 0,
  last_water_day TEXT NOT NULL DEFAULT '',
  planted_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS npc_bond (
  player_id INTEGER NOT NULL,
  npc_id TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  talk_day TEXT NOT NULL DEFAULT '',
  gift_day TEXT NOT NULL DEFAULT '',
  gifts_today INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, npc_id)
);
CREATE TABLE IF NOT EXISTS retreat_room (
  player_id INTEGER PRIMARY KEY,
  theme INTEGER NOT NULL DEFAULT 0,
  placed TEXT NOT NULL DEFAULT '[]'
);
`);

async function inWrite<T>(run: (tx: Transaction) => Promise<T | null>): Promise<T | null> {
  const tx = await db.transaction('write');
  try {
    const result = await run(tx);
    if (result === null) await tx.rollback();
    else await tx.commit();
    return result;
  } finally { tx.close(); }
}

async function credit(tx: Transaction, pid: number, merit: number, coins: number): Promise<number> {
  const wk = weekKey();
  const r = await tx.execute({ sql: `UPDATE players SET
    weekly_merit = CASE WHEN week_key = ? THEN weekly_merit + ? ELSE ? END,
    week_key = ?, merit = merit + ?, coins = coins + ? WHERE id = ? RETURNING merit - ? AS before`,
    args: [wk, merit, merit, wk, merit, coins, pid, merit] });
  if (!r.rows.length) throw new Error('Missing ritual player');
  return Number(r.rows[0].before);
}

export async function claimReward(pid: number, kind: string, key: string, reward: { merit: number; coins: number }): Promise<number | null> {
  return inWrite(async (tx) => {
    const r = await tx.execute({ sql: 'INSERT OR IGNORE INTO ritual_claims (player_id, kind, claim_key) VALUES (?,?,?)', args: [pid, kind, key] });
    return r.rowsAffected === 1 ? credit(tx, pid, reward.merit, reward.coins) : null;
  });
}
export async function hasClaimed(pid: number, kind: string, key: string): Promise<boolean> {
  const r = await db.execute({ sql: 'SELECT 1 FROM ritual_claims WHERE player_id = ? AND claim_key = ? AND kind = ?', args: [pid, key, kind] });
  return r.rows.length > 0;
}

// ---- nhật ký tu tập ----
export async function markVisit(pid: number, day = dayKeyICT()): Promise<void> {
  await db.execute({ sql: 'INSERT OR IGNORE INTO visit_days (player_id, day_key) VALUES (?,?)', args: [pid, day] });
}

const shiftDay = (key: string, delta: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + delta));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
};

export async function journalState(pid: number, spanDays = 30): Promise<JournalState> {
  const today = dayKeyICT();
  const from = shiftDay(today, -(spanDays - 1));
  const visits = new Set((await db.execute({ sql: `SELECT day_key FROM visit_days WHERE player_id = ?
    UNION SELECT day_key FROM halo_daily WHERE player_id = ? AND sec > 0`, args: [pid, pid] })).rows.map((r) => String(r.day_key)));
  const med = new Map((await db.execute({ sql: 'SELECT day_key, sec FROM halo_daily WHERE player_id = ? AND day_key >= ?', args: [pid, from] })).rows.map((r) => [String((r as any).day_key), Number((r as any).sec)]));
  const totalMed = Number(((await db.execute({ sql: 'SELECT COALESCE(SUM(sec),0) AS s FROM halo_daily WHERE player_id = ?', args: [pid] })).rows[0] as any)?.s ?? 0);
  const days: JournalDay[] = [];
  for (let i = spanDays - 1; i >= 0; i--) {
    const day = shiftDay(today, -i);
    days.push({ day, visited: visits.has(day), medSec: med.get(day) ?? 0 });
  }
  let streak = 0;
  let cursor = visits.has(today) ? today : shiftDay(today, -1);
  while (visits.has(cursor)) { streak++; cursor = shiftDay(cursor, -1); }
  const sorted = [...visits].sort();
  let best = 0, run = 0, prev = '';
  for (const d of sorted) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return { days, streak, best, totalDays: visits.size, totalMedSec: totalMed };
}

// ---- cây bồ đề riêng ----
export async function bodhiList(): Promise<BodhiTree[]> {
  const today = dayKeyICT();
  const rows = (await db.execute(
    `SELECT t.player_id AS pid, t.slot, t.waters, t.last_water_day AS lw, t.planted_at, p.name
     FROM bodhi_trees t JOIN players p ON p.id = t.player_id ORDER BY t.slot`,
  )).rows;
  return rows.map((r) => {
    const waters = Number(r.waters);
    const idle = daysBetween(String(r.lw || dayKeyICT(new Date(Number(r.planted_at)))), today);
    return {
      pid: Number(r.pid), name: String(r.name), slot: Number(r.slot), waters,
      stage: bodhiStageOf(waters), wilted: idle >= BODHI_WILT_DAYS, wateredToday: String(r.lw) === today,
    };
  });
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number), [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Dọn cây bị bỏ quên quá lâu để trả chỗ trống. */
export async function bodhiSweepStale(): Promise<void> {
  const today = dayKeyICT();
  const cutoff = shiftDay(today, -BODHI_STALE_DAYS);
  await db.execute({ sql: `DELETE FROM bodhi_trees WHERE
    (last_water_day != '' AND last_water_day < ?) OR
    (last_water_day = '' AND planted_at < ?)`, args: [cutoff, Date.parse(`${cutoff}T00:00:00+07:00`)] });
}

export async function bodhiPlant(pid: number): Promise<{ ok: true; slot: number } | { ok: false; error: string }> {
  if ((await db.execute({ sql: 'SELECT 1 FROM bodhi_trees WHERE player_id = ?', args: [pid] })).rows.length) return { ok: false, error: 'Bạn đã có cây bồ đề rồi' };
  const used = new Set((await db.execute('SELECT slot FROM bodhi_trees')).rows.map((r) => Number((r as any).slot)));
  let slot = -1;
  for (let i = 0; i < BODHI_SLOTS; i++) if (!used.has(i)) { slot = i; break; }
  if (slot < 0) return { ok: false, error: 'Vườn bồ đề đã kín chỗ' };
  const r = await db.execute({ sql: 'INSERT OR IGNORE INTO bodhi_trees (player_id, slot, planted_at) VALUES (?,?,?)', args: [pid, slot, Date.now()] });
  if (r.rowsAffected !== 1) return { ok: false, error: 'Không trồng được, thử lại nhé' };
  return { ok: true, slot };
}

export async function bodhiWater(pid: number): Promise<number | null> {
  const today = dayKeyICT();
  return inWrite(async (tx) => {
    const r = await tx.execute({ sql: 'UPDATE bodhi_trees SET waters = waters + 1, last_water_day = ? WHERE player_id = ? AND last_water_day != ?', args: [today, pid, today] });
    return r.rowsAffected === 1 ? credit(tx, pid, BODHI_WATER_REWARD.merit, BODHI_WATER_REWARD.coins) : null;
  });
}

// ---- NPC thân thiết ----
export interface BondRow { npc_id: string; points: number; done: number; talk_day: string; gift_day: string; gifts_today: number }
export async function bondRows(pid: number): Promise<BondRow[]> {
  return (await db.execute({ sql: 'SELECT npc_id, points, done, talk_day, gift_day, gifts_today FROM npc_bond WHERE player_id = ?', args: [pid] })).rows.map((r) => ({
    npc_id: String((r as any).npc_id), points: Number((r as any).points), done: Number((r as any).done),
    talk_day: String((r as any).talk_day), gift_day: String((r as any).gift_day), gifts_today: Number((r as any).gifts_today),
  }));
}
export async function bondTalk(pid: number, npc: string, points: number): Promise<boolean> {
  const today = dayKeyICT();
  await db.execute({ sql: 'INSERT OR IGNORE INTO npc_bond (player_id, npc_id) VALUES (?,?)', args: [pid, npc] });
  const r = await db.execute({ sql: `UPDATE npc_bond SET points = points + ?, talk_day = ? WHERE player_id = ? AND npc_id = ? AND talk_day != ?`, args: [points, today, pid, npc, today] });
  return r.rowsAffected === 1;
}
async function takeItem(tx: Transaction, pid: number, item: string, qty: number) {
  return (await tx.execute({ sql: 'UPDATE inventory SET qty = qty - ? WHERE player_id = ? AND item_id = ? AND qty >= ?', args: [qty, pid, item, qty] })).rowsAffected === 1;
}

export async function bondGift(pid: number, npc: string, item: string, points: number, maxPerDay: number) {
  const today = dayKeyICT();
  return inWrite(async (tx) => {
    if (!await takeItem(tx, pid, item, 1)) return null;
    const r = await tx.execute({ sql: `INSERT INTO npc_bond (player_id, npc_id, points, gift_day, gifts_today) VALUES (?,?,?,?,1)
      ON CONFLICT(player_id, npc_id) DO UPDATE SET points = points + excluded.points,
        gifts_today = CASE WHEN gift_day = excluded.gift_day THEN gifts_today + 1 ELSE 1 END, gift_day = excluded.gift_day
      WHERE gift_day != excluded.gift_day OR gifts_today < ?`, args: [pid, npc, points, today, maxPerDay] });
    return r.rowsAffected === 1 ? true : null;
  });
}
export async function bondFinishChapter(pid: number, npc: string, chapterIdx: number, ch: BondChapterDef) {
  return inWrite(async (tx) => {
    const r = await tx.execute({ sql: 'UPDATE npc_bond SET done = done + 1 WHERE player_id = ? AND npc_id = ? AND done = ?', args: [pid, npc, chapterIdx] });
    if (r.rowsAffected !== 1 || !await takeItem(tx, pid, ch.ask.item, ch.ask.qty)) return null;
    if (ch.reward.item) await tx.execute({ sql: `INSERT INTO inventory (player_id, item_id, qty) VALUES (?,?,1)
      ON CONFLICT(player_id, item_id) DO UPDATE SET qty = qty + 1`, args: [pid, ch.reward.item] });
    return credit(tx, pid, ch.reward.merit, ch.reward.coins);
  });
}

// ---- tịnh thất riêng ----
export async function retreatGet(pid: number): Promise<{ theme: number; placed: string[] }> {
  const r = (await db.execute({ sql: 'SELECT theme, placed FROM retreat_room WHERE player_id = ?', args: [pid] })).rows[0] as any;
  if (!r) return { theme: 0, placed: [] };
  let placed: string[] = [];
  try { const p = JSON.parse(String(r.placed)); if (Array.isArray(p)) placed = p.filter((x) => typeof x === 'string'); } catch { /* giữ rỗng */ }
  return { theme: Number(r.theme), placed };
}
export async function retreatSave(pid: number, theme: number, placed: string[]): Promise<void> {
  await db.execute({
    sql: `INSERT INTO retreat_room (player_id, theme, placed) VALUES (?,?,?)
    ON CONFLICT(player_id) DO UPDATE SET theme = excluded.theme, placed = excluded.placed`,
    args: [pid, theme, JSON.stringify(placed)],
  });
}
