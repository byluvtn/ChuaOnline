import { db } from './db.js';
import { dayKeyICT } from '../shared/time.js';
import {
  GARDEN_STAGE_MS, GARDEN_STAGE_MS_GOOD, GARDEN_HEAD_START, GARDEN_WILT_MS, GARDEN_VANISH_MS, GARDEN_REST_MS,
  GARDEN_PLOTS, GARDEN_SEEDS, type GardenPlotState, type GardenQuality, type GardenSpecies,
} from '../shared/game.js';

export interface GardenRow {
  player_id: number; plot_id: number; species: GardenSpecies; quality: GardenQuality; stage: number;
  planted_at: number; last_watered_at: number; watered_day_vn: string;
  harvested: number; stage_at: number; wilted: number; grow_counted: number; harvested_at: number; waters: number;
}

type Result = { ok: true; grew: number[] } | { ok: false; error: string; grew: number[] };

const today = (nowMs: number) => dayKeyICT(new Date(nowMs));
const validPlot = (plot: number) => GARDEN_PLOTS.some((p) => p.id === plot);
const validSpecies = (s: string): s is GardenSpecies => Object.hasOwn(GARDEN_SEEDS, s);
const stageMsFor = (q: GardenQuality) => q === 'good' ? GARDEN_STAGE_MS_GOOD : GARDEN_STAGE_MS;

/** Ghi DB có thử lại khi SQLITE_BUSY: 2 client cùng ghi (người chơi + tua nhanh test, hoặc
 *  2 người chơi cùng tưới/thu hoạch) có thể kẹt khóa; 1 lần va chạm không được làm chết server
 *  (async socket handler không bắt → crash cả tiến trình). Thử lại tối đa 8 lần, mỗi lần 250 ms. */
async function gdb(sql: string, args: unknown[]) {
  for (let i = 0; ; i++) {
    try { return await db.execute({ sql, args: args as never[] }); }
    catch (e: unknown) {
      if (/SQLITE_BUSY|database is locked/i.test(String(e)) && i < 7) { await new Promise((r) => setTimeout(r, 250)); continue; }
      throw e;
    }
  }
}

// Ham thuan: tinh trang thai luong tai thoi diem nowMs, khong cham DB
export function computePlot(row: GardenRow, nowMs: number): { row: GardenRow; deleteRow: boolean; grewTo4: boolean } {
  const r: GardenRow = { ...row };
  if (r.harvested) return { row: r, deleteRow: nowMs - r.harvested_at >= GARDEN_REST_MS, grewTo4: false };
  const idle = nowMs - r.last_watered_at;
  if (idle > GARDEN_VANISH_MS) return { row: r, deleteRow: true, grewTo4: false };
  if (idle > GARDEN_WILT_MS) { r.wilted = 1; return { row: r, deleteRow: false, grewTo4: false }; }
  r.wilted = 0;
  let grewTo4 = false;
  // Cửa tưới: cây chỉ lớn khi giai đoạn hiện tại đã có lần tưới của nó.
  // Mỗi lần tưới mở 1 giai đoạn (hạt tốt gieo ở stage 2 nên chỉ cần 2 lần tưới).
  // Không tưới thì cây đứng yên, dù thời gian có trôi.
  {
    const quality: GardenQuality = r.quality ?? 'normal';
    const stageMs = stageMsFor(quality);
    const waters = r.waters ?? 0;
    const before = r.stage;
    while (r.stage < 4 && nowMs - r.stage_at >= stageMs && waters + GARDEN_HEAD_START[quality] > r.stage - 1) { r.stage++; r.stage_at += stageMs; }
    if (before < 4 && r.stage === 4 && r.grow_counted === 0) { r.grow_counted = 1; grewTo4 = true; }
  }
  return { row: r, deleteRow: false, grewTo4 };
}

// Doc het luong cua nguoi choi, don dong het han, ghi lai thay doi
async function syncRows(pid: number, nowMs: number): Promise<{ rows: Map<number, GardenRow>; grew: number[] }> {
  const res = await db.execute({ sql: 'SELECT * FROM garden_plots WHERE player_id = ?', args: [pid] });
  const rows = new Map<number, GardenRow>();
  const grew: number[] = [];
  for (const raw of res.rows as unknown as GardenRow[]) {
    const old: GardenRow = { ...raw };
    const { row, deleteRow, grewTo4 } = computePlot(old, nowMs);
    if (deleteRow) {
      await gdb('DELETE FROM garden_plots WHERE player_id = ? AND plot_id = ?', [pid, old.plot_id]);
      continue;
    }
    if (row.stage !== old.stage || row.stage_at !== old.stage_at || row.wilted !== old.wilted || row.grow_counted !== old.grow_counted) {
      await gdb('UPDATE garden_plots SET stage = ?, stage_at = ?, wilted = ?, grow_counted = ? WHERE player_id = ? AND plot_id = ?',
        [row.stage, row.stage_at, row.wilted, row.grow_counted, pid, row.plot_id]);
    }
    if (grewTo4) grew.push(row.plot_id);
    rows.set(row.plot_id, row);
  }
  return { rows, grew };
}

export async function listGardenRows(pid: number, nowMs: number): Promise<{ states: GardenPlotState[]; grewTo4Plots: number[] }> {
  const { rows, grew } = await syncRows(pid, nowMs);
  const day = today(nowMs);
  const states = GARDEN_PLOTS.map((p): GardenPlotState => {
    const r = rows.get(p.id);
    if (!r) return { plot: p.id, species: null, stage: 0, quality: 'normal', waters: 0, wilted: false, wateredToday: false, harvestable: false, harvested: false, waterCooldownMs: 0, progress: 0 };
    const wateredToday = r.watered_day_vn === day;
    const quality: GardenQuality = r.quality ?? 'normal';
    const waters = r.waters ?? 0;
    const stageMs = stageMsFor(quality);
    // Đang nấu = giai đoạn hiện tại đã có lần tưới của nó; chưa tưới thì tiến trình đứng 0.
    const cooking = waters + GARDEN_HEAD_START[quality] > r.stage - 1;
    const progress = r.stage >= 4 ? 1 : (cooking ? Math.min(1, (nowMs - r.stage_at) / stageMs) : 0);
    const waterCooldownMs = r.stage >= 4 || r.harvested ? 0 : (waters === 0 ? 0 : Math.max(0, stageMs - (nowMs - r.last_watered_at)));
    return {
      plot: p.id, species: r.species, stage: r.stage, quality, waters, wilted: !!r.wilted,
      wateredToday, harvestable: r.stage === 4 && !r.harvested, harvested: !!r.harvested,
      waterCooldownMs, progress,
    };
  });
  return { states, grewTo4Plots: grew };
}

export async function plantGardenRow(pid: number, plot: number, species: string, quality: GardenQuality, nowMs: number): Promise<Result> {
  if (!validPlot(plot)) return { ok: false, error: 'Luống không hợp lệ', grew: [] };
  if (!validSpecies(species)) return { ok: false, error: 'Loại hạt không hợp lệ', grew: [] };
  const { rows, grew } = await syncRows(pid, nowMs);
  if (rows.has(plot)) return { ok: false, error: 'Luống đã có cây', grew };
  // Hạt tốt gieo ở stage 2 (cây con khỏe); hạt thường ở stage 1.
  // Gieo hạt KHÔNG tính là 1 lần tưới (watered_day_vn để trống, waters = 0).
  const stage = quality === 'good' ? 2 : 1;
  await gdb(`INSERT INTO garden_plots (player_id, plot_id, species, quality, stage, planted_at, last_watered_at, watered_day_vn, harvested, stage_at, wilted, grow_counted, harvested_at, waters)
          VALUES (?, ?, ?, ?, ?, ?, ?, '', 0, ?, 0, 0, 0, 0)`,
    [pid, plot, species, quality, stage, nowMs, nowMs, nowMs]);
  return { ok: true, grew };
}

export async function waterGardenRow(pid: number, plot: number, nowMs: number): Promise<Result> {
  const { rows, grew } = await syncRows(pid, nowMs);
  const row = rows.get(plot);
  if (!row) return { ok: false, error: 'Luống trống', grew };
  if (row.harvested) return { ok: false, error: 'Cây đã thu hoạch', grew };
  if (row.stage >= 4) return { ok: false, error: 'Cây đã lớn, thu hoạch đi', grew };
  // Cooldown theo từng cây: lần tưới đầu sau khi gieo luôn được; các lần sau cách nhau
  // stageMs (thường 15 phút, tốt 10 phút) — tưới cây A không chặn tưới cây B.
  const quality: GardenQuality = row.quality ?? 'normal';
  const waters = row.waters ?? 0;
  const stageMs = stageMsFor(quality);
  if (waters > 0 && nowMs - row.last_watered_at < stageMs) {
    const mins = Math.ceil((stageMs - (nowMs - row.last_watered_at)) / 60000);
    return { ok: false, error: `Tưới lại sau ${mins} phút`, grew };
  }
  await gdb('UPDATE garden_plots SET last_watered_at = ?, watered_day_vn = ?, wilted = 0, stage_at = ?, waters = waters + 1 WHERE player_id = ? AND plot_id = ?',
    [nowMs, today(nowMs), nowMs, pid, plot]);
  return { ok: true, grew };
}

export async function harvestGardenRow(pid: number, plot: number, nowMs: number): Promise<{ ok: true; species: GardenSpecies; quality: GardenQuality; grew: number[] } | { ok: false; error: string; grew: number[] }> {
  const { rows, grew } = await syncRows(pid, nowMs);
  const row = rows.get(plot);
  if (!row) return { ok: false, error: 'Luống trống', grew };
  if (row.harvested) return { ok: false, error: 'Cây đã thu hoạch', grew };
  if (row.stage < 4) return { ok: false, error: 'Cây chưa lớn', grew };
  await gdb('UPDATE garden_plots SET harvested = 1, harvested_at = ? WHERE player_id = ? AND plot_id = ?',
    [nowMs, pid, plot]);
  return { ok: true, species: row.species, quality: row.quality ?? 'normal', grew };
}

export async function gardenSeedGiftSent(pid: number): Promise<boolean> {
  const res = await db.execute({ sql: "SELECT 1 FROM mail WHERE player_id = ? AND kind = 'garden_seed' LIMIT 1", args: [pid] });
  return res.rows.length > 0;
}
