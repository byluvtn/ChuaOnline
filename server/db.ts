import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Outfit, Profile } from '../shared/types.js';
import { ITEM_BY_ID, type MailGift, type MailItem, type PlayerStats, type StatKey } from '../shared/game.js';

const localFile = process.env.DB_FILE ? process.env.DB_FILE : 'data/chuaonline.db';
if (!process.env.TURSO_DATABASE_URL) {
  try { mkdirSync(dirname(resolve(localFile)), { recursive: true }); } catch (err) {
    console.warn(`[db] cannot create dir for ${localFile}: ${(err as Error).message}`);
  }
}
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? (process.env.DB_FILE ? `file:${process.env.DB_FILE}` : 'file:data/chuaonline.db'),
  authToken: process.env.TURSO_AUTH_TOKEN,
});
console.log(`[db] mode: ${process.env.TURSO_DATABASE_URL ? 'turso' : 'local file'}`);

await db.executeMultiple(`
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE COLLATE NOCASE,
  pass_hash TEXT,
  name TEXT NOT NULL,
  outfit TEXT NOT NULL DEFAULT 'monk',
  color TEXT NOT NULL DEFAULT '#d99a1e',
  merit INTEGER NOT NULL DEFAULT 0,
  weekly_merit INTEGER NOT NULL DEFAULT 0,
  week_key TEXT NOT NULL DEFAULT '',
  coins INTEGER NOT NULL DEFAULT 0,
  accessory TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS inventory (
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  qty INTEGER NOT NULL,
  PRIMARY KEY (player_id, item_id)
);
CREATE TABLE IF NOT EXISTS quest_progress (
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  claimed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, day_key, quest_id)
);
CREATE TABLE IF NOT EXISTS minigame_daily (
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  game TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, day_key, game)
);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_merit ON players(merit DESC);
CREATE INDEX IF NOT EXISTS idx_weekly ON players(week_key, weekly_merit DESC);
`);
try { await db.execute('ALTER TABLE players ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0'); } catch { /* cột đã tồn tại */ }
try {
  const fk = await db.execute('PRAGMA foreign_keys');
  console.log(`[db] PRAGMA foreign_keys = ${JSON.stringify(fk.rows[0] ?? null)}`);
} catch (err) {
  console.warn(`[db] cannot read PRAGMA foreign_keys: ${(err as Error).message}`);
}
/** Cấp quyền quản trị theo biến môi trường ADMIN_USERNAMES (phân tách bằng dấu phẩy); không hardcode mật khẩu. */
export async function syncAdmins() {
  const names = String(process.env.ADMIN_USERNAMES ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  await db.execute('UPDATE players SET is_admin = 0');
  for (const n of names) await db.execute({ sql: 'UPDATE players SET is_admin = 1 WHERE username = ?', args: [n] });
}
await syncAdmins();

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const now = () => Date.now();
export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
export const weekKey = (d = new Date()) => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${Math.ceil(((+t - +y0) / 86400000 + 1) / 7)}`;
};

// ---- passwords ----
const hashPw = (pw: string) => {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(pw, salt, 64).toString('hex')}`;
};
const checkPw = (pw: string, stored: string) => {
  const [s, h] = stored.split(':');
  const a = scryptSync(pw, Buffer.from(s, 'hex'), 64);
  const b = Buffer.from(h, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
};

// ---- sessions ----
export async function newSession(playerId: number): Promise<string> {
  await syncAdmins();
  const token = randomBytes(32).toString('hex');
  await db.execute({ sql: 'INSERT INTO sessions (token_hash, player_id, created_at) VALUES (?,?,?)', args: [sha(token), playerId, now()] });
  return token;
}
export async function playerIdByToken(token: unknown): Promise<number | null> {
  if (typeof token !== 'string' || token.length < 32 || token.length > 128) return null;
  const r = (await db.execute({ sql: 'SELECT player_id FROM sessions WHERE token_hash = ?', args: [sha(token)] })).rows[0] as unknown as { player_id: number } | undefined;
  return r ? Number(r.player_id) : null;
}

// ---- accounts ----
const GUEST_NAMES = ['Chân Hạnh', 'Thiện Tâm', 'Minh Đạt', 'Từ Bi', 'An Nhiên', 'Tịnh Hòa', 'Diệu Hạnh', 'Hỷ Xả'];
export async function createGuest(): Promise<{ token: string; id: number }> {
  const name = `${GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)]} ${Math.floor(Math.random() * 99) + 1}`;
  const r = await db.execute({ sql: 'INSERT INTO players (name, created_at) VALUES (?,?)', args: [name, now()] });
  const id = Number(r.lastInsertRowid);
  await sendWelcomeMail(id);
  return { id, token: await newSession(id) };
}

export const validUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
export const validPassword = (p: string) => typeof p === 'string' && p.length >= 6 && p.length <= 100;

/** Upgrade an existing guest (by id) or create a fresh account. */
export async function register(username: string, password: string, guestId: number | null): Promise<{ token: string } | { error: string }> {
  if (!validUsername(username)) return { error: 'Tên đăng nhập 3-20 ký tự: chữ, số, gạch dưới' };
  if (!validPassword(password)) return { error: 'Mật khẩu tối thiểu 6 ký tự' };
  if ((await db.execute({ sql: 'SELECT 1 FROM players WHERE username = ?', args: [username] })).rows[0]) return { error: 'Tên đăng nhập đã tồn tại' };
  const hash = hashPw(password);
  if (guestId != null) {
    const g = (await db.execute({ sql: 'SELECT username FROM players WHERE id = ?', args: [guestId] })).rows[0] as unknown as { username: string | null } | undefined;
    if (g && g.username === null) {
      await db.execute({ sql: 'UPDATE players SET username = ?, pass_hash = ? WHERE id = ?', args: [username, hash, guestId] });
      return { token: await newSession(guestId) };
    }
  }
  const r = await db.execute({ sql: 'INSERT INTO players (username, pass_hash, name, created_at) VALUES (?,?,?,?)', args: [username, hash, username, now()] });
  const newId = Number(r.lastInsertRowid);
  await sendWelcomeMail(newId);
  return { token: await newSession(newId) };
}

export async function login(username: string, password: string): Promise<{ token: string } | { error: string }> {
  const r = (await db.execute({ sql: 'SELECT id, pass_hash FROM players WHERE username = ?', args: [String(username)] })).rows[0] as unknown as { id: number; pass_hash: string } | undefined;
  // constant-ish work even if user is missing
  const ok = r ? checkPw(String(password), r.pass_hash) : (scryptSync('x', 'y', 64), false);
  if (!r || !ok) return { error: 'Sai tên đăng nhập hoặc mật khẩu' };
  return { token: await newSession(Number(r.id)) };
}

export async function logoutToken(token: string) {
  await db.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [sha(token)] });
}

// ---- profile ----
interface Row { id: number; username: string | null; name: string; outfit: Outfit; color: string; merit: number; coins: number; accessory: string | null; is_admin: number }
export async function getProfile(id: number): Promise<Profile | null> {
  const r = (await db.execute({ sql: 'SELECT id, username, name, outfit, color, merit, coins, accessory, is_admin FROM players WHERE id = ?', args: [id] })).rows[0] as unknown as Row | undefined;
  if (!r) return null;
  const inv: Record<string, number> = {};
  for (const i of (await db.execute({ sql: 'SELECT item_id, qty FROM inventory WHERE player_id = ? AND qty > 0', args: [id] })).rows as unknown as { item_id: string; qty: number }[]) inv[i.item_id] = Number(i.qty);
  return { name: r.name, outfit: r.outfit, color: r.color, merit: Number(r.merit), coins: Number(r.coins), accessory: r.accessory, username: r.username, inventory: inv, admin: Number(r.is_admin) === 1 };
}

export async function saveLook(id: number, name: string, outfit: Outfit, color: string) {
  await db.execute({ sql: 'UPDATE players SET name = ?, outfit = ?, color = ? WHERE id = ?', args: [name, outfit, color, id] });
}

export async function addRewards(id: number, merit: number, coins: number) {
  const wk = weekKey();
  await db.execute({
    sql: `UPDATE players SET
      weekly_merit = CASE WHEN week_key = ? THEN weekly_merit + ? ELSE ? END,
      week_key = ?, merit = merit + ?, coins = coins + ? WHERE id = ?`,
    args: [wk, merit, merit, wk, merit, coins, id],
  });
}

export const itemQty = async (id: number, item: string): Promise<number> => {
  const r = (await db.execute({ sql: 'SELECT qty FROM inventory WHERE player_id = ? AND item_id = ?', args: [id, item] })).rows[0] as unknown as { qty: number } | undefined;
  return r ? Number(r.qty) : 0;
};
export async function addItem(id: number, item: string, delta: number) {
  await db.execute({
    sql: `INSERT INTO inventory (player_id, item_id, qty) VALUES (?,?,MAX(?,0))
    ON CONFLICT(player_id, item_id) DO UPDATE SET qty = MAX(qty + ?, 0)`,
    args: [id, item, delta, delta],
  });
}
export async function spendCoins(id: number, amount: number): Promise<boolean> {
  const r = await db.execute({ sql: 'UPDATE players SET coins = coins - ? WHERE id = ? AND coins >= ?', args: [amount, id, amount] });
  return r.rowsAffected === 1;
}
/**
 * Trừ xu và cộng vật phẩm trong cùng một transaction: hoặc cả hai thành công, hoặc không gì thay đổi.
 * Trả về false khi không đủ xu (không ghi gì cả).
 */
export async function purchase(id: number, item: string, qty: number, cost: number): Promise<boolean> {
  const tx = await db.transaction('write');
  try {
    const r = await tx.execute({ sql: 'UPDATE players SET coins = coins - ? WHERE id = ? AND coins >= ?', args: [cost, id, cost] });
    if (r.rowsAffected !== 1) { await tx.rollback(); return false; }
    await tx.execute({
      sql: `INSERT INTO inventory (player_id, item_id, qty) VALUES (?,?,MAX(?,0))
    ON CONFLICT(player_id, item_id) DO UPDATE SET qty = MAX(qty + ?, 0)`,
      args: [id, item, qty, qty],
    });
    await tx.commit();
    return true;
  } catch (err) {
    try { await tx.rollback(); } catch { /* đã đóng */ }
    throw err;
  } finally {
    tx.close();
  }
}
export async function setAccessory(id: number, item: string | null) {
  await db.execute({ sql: 'UPDATE players SET accessory = ? WHERE id = ?', args: [item, id] });
}

// ---- quests ----
/** Khoá phiên nhiệm vụ: nhiệm vụ ngày dùng day_key, nhiệm vụ tuần (id `w_…`) dùng week_key. */
export const questKey = (questId: string, d = new Date()) => (questId.startsWith('w_') ? weekKey(d) : dayKey(d));
export async function questRows(id: number) {
  const rows = (await db.execute({ sql: 'SELECT quest_id, progress, claimed FROM quest_progress WHERE player_id = ? AND day_key IN (?, ?)', args: [id, dayKey(), weekKey()] })).rows as unknown as { quest_id: string; progress: number; claimed: number }[];
  return rows.map((r) => ({ quest_id: r.quest_id, progress: Number(r.progress), claimed: Number(r.claimed) }));
}
export async function bumpQuest(id: number, questId: string, target: number, by = 1) {
  await db.execute({
    sql: `INSERT INTO quest_progress (player_id, day_key, quest_id, progress) VALUES (?,?,?,MIN(?,?))
    ON CONFLICT(player_id, day_key, quest_id) DO UPDATE SET progress = MIN(progress + ?, ?) WHERE claimed = 0`,
    args: [id, questKey(questId), questId, by, target, by, target],
  });
}
/** Returns true if the claim was valid (done and not claimed yet). */
export async function claimQuest(id: number, questId: string, target: number): Promise<boolean> {
  const r = await db.execute({
    sql: `UPDATE quest_progress SET claimed = 1
    WHERE player_id = ? AND day_key = ? AND quest_id = ? AND progress >= ? AND claimed = 0`,
    args: [id, questKey(questId), questId, target],
  });
  return r.rowsAffected === 1;
}

// ---- level milestone rewards ----
await db.execute(`CREATE TABLE IF NOT EXISTS level_rewards (
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  PRIMARY KEY (player_id, level)
)`);
/** Ghi nhận mốc cấp đã thưởng; true nếu lần đầu đạt cấp này. */
export async function claimLevelReward(id: number, level: number): Promise<boolean> {
  const r = await db.execute({ sql: 'INSERT OR IGNORE INTO level_rewards (player_id, level) VALUES (?,?)', args: [id, level] });
  return r.rowsAffected === 1;
}

// ---- lifetime stats & achievement milestones (R1.5) ----
await db.executeMultiple(`
CREATE TABLE IF NOT EXISTS player_stats (
  player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  bows INTEGER NOT NULL DEFAULT 0,
  chants INTEGER NOT NULL DEFAULT 0,
  lanterns INTEGER NOT NULL DEFAULT 0,
  meditate_sec INTEGER NOT NULL DEFAULT 0,
  beads_rounds INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS stat_rewards (
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL,
  claimed_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, milestone_id)
);
`);
const STAT_COLUMNS: Record<StatKey, string> = {
  bows: 'bows', chants: 'chants', lanterns: 'lanterns', meditate_sec: 'meditate_sec', beads_rounds: 'beads_rounds',
};
/** Tăng bộ đếm trọn đời nguyên tử; trả về giá trị mới của cột. Tên cột chỉ lấy từ bảng cố định ở trên. */
export async function bumpStat(id: number, key: StatKey, delta: number): Promise<number> {
  const col = STAT_COLUMNS[key];
  if (!col) throw new Error(`stat key không hợp lệ: ${String(key)}`);
  const by = Math.max(0, Math.floor(delta));
  const r = await db.execute({
    sql: `INSERT INTO player_stats (player_id, ${col}) VALUES (?, ?)
    ON CONFLICT(player_id) DO UPDATE SET ${col} = ${col} + ?
    RETURNING ${col} AS v`,
    args: [id, by, by],
  });
  return Number((r.rows[0] as unknown as { v: number }).v);
}
export async function getStatValue(id: number, key: StatKey): Promise<number> {
  const col = STAT_COLUMNS[key];
  if (!col) throw new Error(`stat key không hợp lệ: ${String(key)}`);
  const r = (await db.execute({ sql: `SELECT ${col} AS v FROM player_stats WHERE player_id = ?`, args: [id] })).rows[0] as unknown as { v: number } | undefined;
  return r ? Number(r.v) : 0;
}
export async function getStats(id: number): Promise<PlayerStats> {
  const r = (await db.execute({ sql: 'SELECT bows, chants, lanterns, meditate_sec, beads_rounds FROM player_stats WHERE player_id = ?', args: [id] })).rows[0] as unknown as
    { bows: number; chants: number; lanterns: number; meditate_sec: number; beads_rounds: number } | undefined;
  return {
    bows: Number(r?.bows ?? 0), chants: Number(r?.chants ?? 0), lanterns: Number(r?.lanterns ?? 0),
    meditateSec: Number(r?.meditate_sec ?? 0), beadsRounds: Number(r?.beads_rounds ?? 0),
  };
}
/** Ghi nhận mốc thành tựu đã thưởng; true nếu lần đầu đạt mốc này. */
export async function claimStatReward(id: number, milestoneId: string): Promise<boolean> {
  const r = await db.execute({ sql: 'INSERT OR IGNORE INTO stat_rewards (player_id, milestone_id, claimed_at) VALUES (?,?,?)', args: [id, milestoneId, now()] });
  return r.rowsAffected === 1;
}
export async function claimedStatRewards(id: number): Promise<string[]> {
  const rows = (await db.execute({ sql: 'SELECT milestone_id FROM stat_rewards WHERE player_id = ? ORDER BY claimed_at, milestone_id', args: [id] })).rows as unknown as { milestone_id: string }[];
  return rows.map((r) => r.milestone_id);
}

// ---- daily check-in (R1.1) ----
await db.execute(`CREATE TABLE IF NOT EXISTS checkins (
  player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  last_day TEXT NOT NULL,
  streak INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0
)`);
const yesterdayKey = () => dayKey(new Date(Date.now() - 86_400_000));
export async function checkinState(id: number): Promise<{ streak: number; claimedToday: boolean; total: number }> {
  const r = (await db.execute({ sql: 'SELECT last_day, streak, total FROM checkins WHERE player_id = ?', args: [id] })).rows[0] as unknown as { last_day: string; streak: number; total: number } | undefined;
  if (!r) return { streak: 0, claimedToday: false, total: 0 };
  const claimedToday = r.last_day === dayKey();
  const alive = claimedToday || r.last_day === yesterdayKey();
  return { streak: alive ? Number(r.streak) : 0, claimedToday, total: Number(r.total) };
}
/** Điểm danh nguyên tử: null nếu hôm nay đã nhận. Ngày chu kỳ 1..7 tra bảng CHECKIN_REWARDS. */
export async function claimCheckin(id: number): Promise<{ streak: number; cycleDay: number } | null> {
  const today = dayKey();
  const r = await db.execute({
    sql: `INSERT INTO checkins (player_id, last_day, streak, total) VALUES (?, ?, 1, 1)
    ON CONFLICT(player_id) DO UPDATE SET
      streak = CASE WHEN last_day = ? THEN streak + 1 ELSE 1 END,
      total = total + 1,
      last_day = ?
    WHERE last_day != ?`,
    args: [id, today, yesterdayKey(), today, today],
  });
  if (r.rowsAffected !== 1) return null;
  const row = (await db.execute({ sql: 'SELECT streak FROM checkins WHERE player_id = ?', args: [id] })).rows[0] as unknown as { streak: number };
  const streak = Number(row.streak);
  return { streak, cycleDay: ((streak - 1) % 7) + 1 };
}

// ---- mailbox (R1.2) ----
await db.executeMultiple(`
CREATE TABLE IF NOT EXISTS mail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  gift TEXT,
  read_at INTEGER,
  claimed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mail_player ON mail(player_id, created_at DESC);
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

/** Gói quà dùng chung cho thư chào mừng và thư ra mắt. */
export const MAIL_STARTER_GIFT: MailGift = { merit: 20, coins: 30, items: { huong_tram: 2, nen_sap_ong: 1, den_hoa_dang: 1 } };
const WELCOME_MAIL = {
  kind: 'welcome',
  title: 'Thư chào mừng từ nhà chùa',
  body: 'Nam mô A Di Đà Phật. Nhà chùa xin chào mừng bạn đã ghé thăm. Kèm theo thư là một gói quà nhỏ gồm 20 công đức, 30 xu, 2 hương trầm, 1 nến sáp ong và 1 đèn hoa đăng, để bạn thắp hương, tụng kinh và thả đèn ngay những ngày đầu. Mỗi ngày bạn hãy ghé mục Điểm danh để nhận thêm quà và giữ chuỗi ngày liên tiếp. Chúc bạn một ngày an lạc.',
};
const LAUNCH_MAIL = {
  kind: 'launch',
  title: 'Quà ra mắt hòm thư',
  body: 'Nam mô A Di Đà Phật. Cảm ơn bạn đã đồng hành cùng nhà chùa từ những ngày đầu. Từ nay nhà chùa có hòm thư để gửi đến bạn thông báo và quà tặng. Kèm theo thư là gói quà gồm 20 công đức, 30 xu, 2 hương trầm, 1 nến sáp ong và 1 đèn hoa đăng, công bằng với mọi người chơi. Chúc bạn một ngày an lạc.',
};

/** Chuẩn hóa gói quà: bỏ vật phẩm lạ (log cảnh báo), số lượng không hợp lệ; trả null nếu không có gì. */
function cleanGift(gift: MailGift | null): MailGift | null {
  if (!gift) return null;
  const num = (n: unknown) => (Number.isFinite(n) && Number(n) > 0 ? Math.floor(Number(n)) : 0);
  const items: Record<string, number> = {};
  for (const [k, v] of Object.entries(gift.items ?? {})) {
    if (!ITEM_BY_ID[k]) { console.warn(`[mail] bỏ vật phẩm lạ khỏi gói quà: ${k}`); continue; }
    const q = num(v);
    if (q > 0) items[k] = q;
  }
  const out: MailGift = { merit: num(gift.merit), coins: num(gift.coins) };
  if (Object.keys(items).length) out.items = items;
  return out.merit || out.coins || out.items ? out : null;
}
export async function sendMail(playerId: number, kind: string, title: string, body: string, gift: MailGift | null): Promise<number> {
  const g = cleanGift(gift);
  const r = await db.execute({
    sql: 'INSERT INTO mail (player_id, kind, title, body, gift, created_at) VALUES (?,?,?,?,?,?)',
    args: [playerId, kind, title, body, g ? JSON.stringify(g) : null, now()],
  });
  return Number(r.lastInsertRowid);
}
async function sendWelcomeMail(playerId: number) {
  try { await sendMail(playerId, WELCOME_MAIL.kind, WELCOME_MAIL.title, WELCOME_MAIL.body, MAIL_STARTER_GIFT); } catch (err) {
    console.warn(`[mail] không gửi được thư chào mừng cho ${playerId}: ${(err as Error).message}`);
  }
}
const parseGift = (raw: unknown): MailGift | null => {
  if (typeof raw !== 'string' || !raw) return null;
  try { return JSON.parse(raw) as MailGift; } catch { return null; }
};
export async function mailList(id: number, limit = 50): Promise<MailItem[]> {
  const rows = (await db.execute({
    sql: 'SELECT id, kind, title, body, gift, read_at, claimed, created_at FROM mail WHERE player_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
    args: [id, limit],
  })).rows as unknown as { id: number; kind: string; title: string; body: string; gift: string | null; read_at: number | null; claimed: number; created_at: number }[];
  return rows.map((r) => ({
    id: Number(r.id), kind: r.kind, title: r.title, body: r.body, gift: parseGift(r.gift),
    read: r.read_at != null, claimed: Number(r.claimed) === 1, createdAt: Number(r.created_at),
  }));
}
export async function mailUnread(id: number): Promise<number> {
  const r = (await db.execute({ sql: 'SELECT COUNT(*) AS n FROM mail WHERE player_id = ? AND read_at IS NULL', args: [id] })).rows[0] as unknown as { n: number };
  return Number(r.n);
}
export async function markMailRead(id: number, mailId: number): Promise<boolean> {
  const r = await db.execute({ sql: 'UPDATE mail SET read_at = ? WHERE id = ? AND player_id = ? AND read_at IS NULL', args: [now(), mailId, id] });
  return r.rowsAffected === 1;
}
/** Nhận quà nguyên tử: null nếu thư không thuộc người chơi, không có quà hoặc đã nhận. */
export async function claimMail(id: number, mailId: number): Promise<{ gift: MailGift } | null> {
  const r = await db.execute({ sql: 'UPDATE mail SET claimed = 1 WHERE id = ? AND player_id = ? AND claimed = 0 AND gift IS NOT NULL', args: [mailId, id] });
  if (r.rowsAffected !== 1) return null;
  const row = (await db.execute({ sql: 'SELECT gift FROM mail WHERE id = ? AND player_id = ?', args: [mailId, id] })).rows[0] as unknown as { gift: string } | undefined;
  const gift = parseGift(row?.gift);
  return gift ? { gift } : null;
}
/** Phát thư ra mắt đúng một lần cho mọi người chơi hiện có; idempotent nhờ khóa app_meta. Trả số thư đã phát (0 nếu đã chạy trước đó). */
export async function grantLaunchMail(): Promise<number> {
  const tx = await db.transaction('write');
  try {
    const done = (await tx.execute({ sql: 'SELECT 1 FROM app_meta WHERE key = ?', args: ['mail_launch_v1'] })).rows[0];
    if (done) { await tx.rollback(); return 0; }
    const g = cleanGift(MAIL_STARTER_GIFT);
    const r = await tx.execute({
      sql: 'INSERT INTO mail (player_id, kind, title, body, gift, created_at) SELECT id, ?, ?, ?, ?, ? FROM players',
      args: [LAUNCH_MAIL.kind, LAUNCH_MAIL.title, LAUNCH_MAIL.body, g ? JSON.stringify(g) : null, now()],
    });
    await tx.execute({ sql: 'INSERT INTO app_meta (key, value) VALUES (?, ?)', args: ['mail_launch_v1', 'done'] });
    await tx.commit();
    return r.rowsAffected;
  } catch (err) {
    try { await tx.rollback(); } catch { /* đã đóng */ }
    throw err;
  } finally {
    tx.close();
  }
}
console.log(`[db] mail launch grant: ${await grantLaunchMail()} thư`);

// ---- ranking ----
export async function topAllTime(limit = 20) {
  const rows = (await db.execute({ sql: 'SELECT name, merit FROM players WHERE merit > 0 ORDER BY merit DESC LIMIT ?', args: [limit] })).rows as unknown as { name: string; merit: number }[];
  return rows.map((r) => ({ name: r.name, merit: Number(r.merit) }));
}
export async function topWeekly(limit = 20) {
  const rows = (await db.execute({ sql: 'SELECT name, weekly_merit AS merit FROM players WHERE week_key = ? AND weekly_merit > 0 ORDER BY weekly_merit DESC LIMIT ?', args: [weekKey(), limit] })).rows as unknown as { name: string; merit: number }[];
  return rows.map((r) => ({ name: r.name, merit: Number(r.merit) }));
}

// ---- mini-games ----
/** Atomically consume one daily reward slot; false when the daily cap is reached. */
export async function claimMinigame(id: number, game: string, cap: number): Promise<boolean> {
  const r = await db.execute({
    sql: `INSERT INTO minigame_daily (player_id, day_key, game, count) VALUES (?,?,?,1)
    ON CONFLICT(player_id, day_key, game) DO UPDATE SET count = count + 1 WHERE count < ?`,
    args: [id, dayKey(), game, cap],
  });
  return r.rowsAffected === 1;
}
export const minigameCount = async (id: number, game: string): Promise<number> => {
  const r = (await db.execute({ sql: 'SELECT count FROM minigame_daily WHERE player_id = ? AND day_key = ? AND game = ?', args: [id, dayKey(), game] })).rows[0] as unknown as { count: number } | undefined;
  return r ? Number(r.count) : 0;
};

// ---- feedback ----
export async function saveFeedback(id: number, text: string, contact: string): Promise<boolean> {
  // at most 5 messages per player per 24h, bounded size
  const n = (await db.execute({ sql: 'SELECT COUNT(*) AS n FROM feedback WHERE player_id = ? AND created_at > ?', args: [id, now() - 86_400_000] })).rows[0] as unknown as { n: number };
  if (Number(n.n) >= 5) return false;
  await db.execute({ sql: 'INSERT INTO feedback (player_id, text, contact, created_at) VALUES (?,?,?,?)', args: [id, text.slice(0, 500), contact.slice(0, 100), now()] });
  return true;
}
