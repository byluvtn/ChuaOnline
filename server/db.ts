import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Outfit, Profile } from '../shared/types.js';

mkdirSync('data', { recursive: true });
export const db = new DatabaseSync(process.env.DB_FILE ?? 'data/chuaonline.db');
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
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
export function newSession(playerId: number): string {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token_hash, player_id, created_at) VALUES (?,?,?)').run(sha(token), playerId, now());
  return token;
}
export function playerIdByToken(token: unknown): number | null {
  if (typeof token !== 'string' || token.length < 32 || token.length > 128) return null;
  const r = db.prepare('SELECT player_id FROM sessions WHERE token_hash = ?').get(sha(token)) as { player_id: number } | undefined;
  return r?.player_id ?? null;
}

// ---- accounts ----
const GUEST_NAMES = ['Chân Hạnh', 'Thiện Tâm', 'Minh Đạt', 'Từ Bi', 'An Nhiên', 'Tịnh Hòa', 'Diệu Hạnh', 'Hỷ Xả'];
export function createGuest(): { token: string; id: number } {
  const name = `${GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)]} ${Math.floor(Math.random() * 99) + 1}`;
  const r = db.prepare('INSERT INTO players (name, created_at) VALUES (?,?)').run(name, now());
  const id = Number(r.lastInsertRowid);
  return { id, token: newSession(id) };
}

export const validUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
export const validPassword = (p: string) => typeof p === 'string' && p.length >= 6 && p.length <= 100;

/** Upgrade an existing guest (by id) or create a fresh account. */
export function register(username: string, password: string, guestId: number | null): { token: string } | { error: string } {
  if (!validUsername(username)) return { error: 'Tên đăng nhập 3-20 ký tự: chữ, số, gạch dưới' };
  if (!validPassword(password)) return { error: 'Mật khẩu tối thiểu 6 ký tự' };
  if (db.prepare('SELECT 1 FROM players WHERE username = ?').get(username)) return { error: 'Tên đăng nhập đã tồn tại' };
  const hash = hashPw(password);
  if (guestId != null) {
    const g = db.prepare('SELECT username FROM players WHERE id = ?').get(guestId) as { username: string | null } | undefined;
    if (g && g.username === null) {
      db.prepare('UPDATE players SET username = ?, pass_hash = ? WHERE id = ?').run(username, hash, guestId);
      return { token: newSession(guestId) };
    }
  }
  const r = db.prepare('INSERT INTO players (username, pass_hash, name, created_at) VALUES (?,?,?,?)').run(username, hash, username, now());
  return { token: newSession(Number(r.lastInsertRowid)) };
}

export function login(username: string, password: string): { token: string } | { error: string } {
  const r = db.prepare('SELECT id, pass_hash FROM players WHERE username = ?').get(String(username)) as { id: number; pass_hash: string } | undefined;
  // constant-ish work even if user is missing
  const ok = r ? checkPw(String(password), r.pass_hash) : (scryptSync('x', 'y', 64), false);
  if (!r || !ok) return { error: 'Sai tên đăng nhập hoặc mật khẩu' };
  return { token: newSession(r.id) };
}

export function logoutToken(token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
}

// ---- profile ----
interface Row { id: number; username: string | null; name: string; outfit: Outfit; color: string; merit: number; coins: number; accessory: string | null }
export function getProfile(id: number): Profile | null {
  const r = db.prepare('SELECT id, username, name, outfit, color, merit, coins, accessory FROM players WHERE id = ?').get(id) as Row | undefined;
  if (!r) return null;
  const inv: Record<string, number> = {};
  for (const i of db.prepare('SELECT item_id, qty FROM inventory WHERE player_id = ? AND qty > 0').all(id) as { item_id: string; qty: number }[]) inv[i.item_id] = i.qty;
  return { name: r.name, outfit: r.outfit, color: r.color, merit: r.merit, coins: r.coins, accessory: r.accessory, username: r.username, inventory: inv };
}

export function saveLook(id: number, name: string, outfit: Outfit, color: string) {
  db.prepare('UPDATE players SET name = ?, outfit = ?, color = ? WHERE id = ?').run(name, outfit, color, id);
}

export function addRewards(id: number, merit: number, coins: number) {
  const wk = weekKey();
  db.prepare(`UPDATE players SET
      weekly_merit = CASE WHEN week_key = ? THEN weekly_merit + ? ELSE ? END,
      week_key = ?, merit = merit + ?, coins = coins + ? WHERE id = ?`).run(wk, merit, merit, wk, merit, coins, id);
}

export const itemQty = (id: number, item: string) =>
  ((db.prepare('SELECT qty FROM inventory WHERE player_id = ? AND item_id = ?').get(id, item) as { qty: number } | undefined)?.qty ?? 0);
export function addItem(id: number, item: string, delta: number) {
  db.prepare(`INSERT INTO inventory (player_id, item_id, qty) VALUES (?,?,MAX(?,0))
    ON CONFLICT(player_id, item_id) DO UPDATE SET qty = MAX(qty + ?, 0)`).run(id, item, delta, delta);
}
export function spendCoins(id: number, amount: number): boolean {
  const r = db.prepare('UPDATE players SET coins = coins - ? WHERE id = ? AND coins >= ?').run(amount, id, amount);
  return Number(r.changes) === 1;
}
export function setAccessory(id: number, item: string | null) {
  db.prepare('UPDATE players SET accessory = ? WHERE id = ?').run(item, id);
}

// ---- quests ----
export function questRows(id: number) {
  return db.prepare('SELECT quest_id, progress, claimed FROM quest_progress WHERE player_id = ? AND day_key = ?').all(id, dayKey()) as
    { quest_id: string; progress: number; claimed: number }[];
}
export function bumpQuest(id: number, questId: string, target: number, by = 1) {
  db.prepare(`INSERT INTO quest_progress (player_id, day_key, quest_id, progress) VALUES (?,?,?,MIN(?,?))
    ON CONFLICT(player_id, day_key, quest_id) DO UPDATE SET progress = MIN(progress + ?, ?) WHERE claimed = 0`)
    .run(id, dayKey(), questId, by, target, by, target);
}
/** Returns true if the claim was valid (done and not claimed yet). */
export function claimQuest(id: number, questId: string, target: number): boolean {
  const r = db.prepare(`UPDATE quest_progress SET claimed = 1
    WHERE player_id = ? AND day_key = ? AND quest_id = ? AND progress >= ? AND claimed = 0`).run(id, dayKey(), questId, target);
  return Number(r.changes) === 1;
}

// ---- ranking ----
export function topAllTime(limit = 20) {
  return db.prepare('SELECT name, merit FROM players WHERE merit > 0 ORDER BY merit DESC LIMIT ?').all(limit) as { name: string; merit: number }[];
}
export function topWeekly(limit = 20) {
  return db.prepare('SELECT name, weekly_merit AS merit FROM players WHERE week_key = ? AND weekly_merit > 0 ORDER BY weekly_merit DESC LIMIT ?')
    .all(weekKey(), limit) as { name: string; merit: number }[];
}

// ---- mini-games ----
/** Atomically consume one daily reward slot; false when the daily cap is reached. */
export function claimMinigame(id: number, game: string, cap: number): boolean {
  const r = db.prepare(`INSERT INTO minigame_daily (player_id, day_key, game, count) VALUES (?,?,?,1)
    ON CONFLICT(player_id, day_key, game) DO UPDATE SET count = count + 1 WHERE count < ?`).run(id, dayKey(), game, cap);
  return Number(r.changes) === 1;
}
export const minigameCount = (id: number, game: string) =>
  ((db.prepare('SELECT count FROM minigame_daily WHERE player_id = ? AND day_key = ? AND game = ?').get(id, dayKey(), game) as { count: number } | undefined)?.count ?? 0);

// ---- feedback ----
export function saveFeedback(id: number, text: string, contact: string): boolean {
  // at most 5 messages per player per 24h, bounded size
  const n = db.prepare('SELECT COUNT(*) AS n FROM feedback WHERE player_id = ? AND created_at > ?').get(id, now() - 86_400_000) as { n: number };
  if (n.n >= 5) return false;
  db.prepare('INSERT INTO feedback (player_id, text, contact, created_at) VALUES (?,?,?,?)').run(id, text.slice(0, 500), contact.slice(0, 100), now());
  return true;
}
