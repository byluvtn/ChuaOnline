import { db } from './db.js';
import { dayKeyICT } from '../shared/time.js';
import {
  GARDEN_STAGE_MS, GARDEN_WILT_MS, GARDEN_VANISH_MS, GARDEN_REST_MS,
  GARDEN_PLOTS, GARDEN_SEEDS, type GardenPlotState, type GardenSpecies,
} from '../shared/game.js';

export interface GardenRow {
  player_id: number; plot_id: number; species: GardenSpecies; stage: number;
  planted_at: number; last_watered_at: number; watered_day_vn: string;
  harvested: number; stage_at: number; wilted: number; grow_counted: number; harvested_at: number;
}

type Result = { ok: true; grew: number[] } | { ok: false; error: string; grew: number[] };

const today = (nowMs: number) => dayKeyICT(new Date(nowMs));
const validPlot = (plot: number) => GARDEN_PLOTS.some((p) => p.id === plot);
const validSpecies = (s: string): s is GardenSpecies => Object.hasOwn(GARDEN_SEEDS, s);

// Ham thuan: tinh trang thai luong tai thoi diem nowMs, khong cham DB
export function computePlot(row: GardenRow, nowMs: number): { row: GardenRow; deleteRow: boolean; grewTo4: boolean } {
  const r: GardenRow = { ...row };
  if (r.harvested) return { row: r, deleteRow: nowMs - r.harvested_at >= GARDEN_REST_MS, grewTo4: false };
  const idle = nowMs - r.last_watered_at;
  if (idle > GARDEN_VANISH_MS) return { row: r, deleteRow: true, grewTo4: false };
  if (idle > GARDEN_WILT_MS) { r.wilted = 1; return { row: r, deleteRow: false, grewTo4: false }; }
  r.wilted = 0;
  let grewTo4 = false;
  if (r.watered_day_vn === today(nowMs)) {
    const before = r.stage;
    while (r.stage < 4 && nowMs - r.stage_at >= GARDEN_STAGE_MS) { r.stage++; r.stage_at += GARDEN_STAGE_MS; }
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
      await db.execute({ sql: 'DELETE FROM garden_plots WHERE player_id = ? AND plot_id = ?', args: [pid, old.plot_id] });
      continue;
    }
    if (row.stage !== old.stage || row.stage_at !== old.stage_at || row.wilted !== old.wilted || row.grow_counted !== old.grow_counted) {
      await db.execute({
        sql: 'UPDATE garden_plots SET stage = ?, stage_at = ?, wilted = ?, grow_counted = ? WHERE player_id = ? AND plot_id = ?',
        args: [row.stage, row.stage_at, row.wilted, row.grow_counted, pid, row.plot_id],
      });
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
    if (!r) return { plot: p.id, species: null, stage: 0, wilted: false, wateredToday: false, harvestable: false, harvested: false, progress: 0 };
    const wateredToday = r.watered_day_vn === day;
    const progress = r.stage >= 4 ? 1 : (wateredToday ? Math.min(1, (nowMs - r.stage_at) / GARDEN_STAGE_MS) : 0);
    return {
      plot: p.id, species: r.species, stage: r.stage, wilted: !!r.wilted,
      wateredToday, harvestable: r.stage === 4 && !r.harvested, harvested: !!r.harvested, progress,
    };
  });
  return { states, grewTo4Plots: grew };
}

export async function plantGardenRow(pid: number, plot: number, species: string, nowMs: number): Promise<Result> {
  if (!validPlot(plot)) return { ok: false, error: 'Luống không hợp lệ', grew: [] };
  if (!validSpecies(species)) return { ok: false, error: 'Loại hạt không hợp lệ', grew: [] };
  const { rows, grew } = await syncRows(pid, nowMs);
  if (rows.has(plot)) return { ok: false, error: 'Luống đã có cây', grew };
  await db.execute({
    sql: `INSERT INTO garden_plots (player_id, plot_id, species, stage, planted_at, last_watered_at, watered_day_vn, harvested, stage_at, wilted, grow_counted, harvested_at)
          VALUES (?, ?, ?, 1, ?, ?, ?, 0, ?, 0, 0, 0)`,
    args: [pid, plot, species, nowMs, nowMs, today(nowMs), nowMs],
  });
  return { ok: true, grew };
}

export async function waterGardenRow(pid: number, plot: number, nowMs: number): Promise<Result> {
  const { rows, grew } = await syncRows(pid, nowMs);
  const row = rows.get(plot);
  if (!row) return { ok: false, error: 'Luống trống', grew };
  if (row.harvested) return { ok: false, error: 'Cây đã thu hoạch', grew };
  if (row.watered_day_vn === today(nowMs)) return { ok: false, error: 'Đã tưới hôm nay', grew };
  await db.execute({
    sql: 'UPDATE garden_plots SET last_watered_at = ?, watered_day_vn = ?, wilted = 0, stage_at = ? WHERE player_id = ? AND plot_id = ?',
    args: [nowMs, today(nowMs), nowMs, pid, plot],
  });
  return { ok: true, grew };
}

export async function harvestGardenRow(pid: number, plot: number, nowMs: number): Promise<{ ok: true; species: GardenSpecies; grew: number[] } | { ok: false; error: string; grew: number[] }> {
  const { rows, grew } = await syncRows(pid, nowMs);
  const row = rows.get(plot);
  if (!row) return { ok: false, error: 'Luống trống', grew };
  if (row.harvested) return { ok: false, error: 'Cây đã thu hoạch', grew };
  if (row.stage < 4) return { ok: false, error: 'Cây chưa lớn', grew };
  await db.execute({
    sql: 'UPDATE garden_plots SET harvested = 1, harvested_at = ? WHERE player_id = ? AND plot_id = ?',
    args: [nowMs, pid, plot],
  });
  return { ok: true, species: row.species, grew };
}

export async function gardenSeedGiftSent(pid: number): Promise<boolean> {
  const res = await db.execute({ sql: "SELECT 1 FROM mail WHERE player_id = ? AND kind = 'garden_seed' LIMIT 1", args: [pid] });
  return res.rows.length > 0;
}
