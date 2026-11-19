import { HALO_TIER1_SEC, HALO_TIER2_SEC, MEDITATE_TICK_MS } from '../shared/game.js';

/**
 * Trạng thái cộng dồn thiền định trong MỘT ngày VN của một người chơi.
 * Toàn bộ được tính từ đồng hồ máy chủ; client không gửi số giây đã ngồi.
 */
export interface MeditationDayState {
  /** khóa ngày VN (dayKeyICT) mà các con số dưới đây thuộc về */
  day: string;
  /** số giây đã ghi xuống DB của ngày này */
  baseSec: number;
  /** số giây đã cộng nhưng chưa ghi xuống DB */
  pendingSec: number;
  /** mốc đồng hồ máy chủ (ms) của lần cộng giây gần nhất trong phiên đang ngồi */
  creditAt?: number;
}

export const newMeditationDay = (day: string): MeditationDayState => ({ day, baseSec: 0, pendingSec: 0 });

/** Tổng số giây đã thiền trong `day`; ngày khác thì coi như 0 (không mang số qua ngày). */
export function medTotalSec(st: MeditationDayState, day: string): number {
  if (st.day !== day) return 0;
  return Math.max(0, Math.floor((st.baseSec ?? 0) + (st.pendingSec ?? 0)));
}

/** Tầng hào quang theo TỔNG số giây cộng dồn trong ngày (không phải ngồi liên tục). */
export function haloForSec(sec: number): 0 | 1 | 2 {
  return sec >= HALO_TIER2_SEC ? 2 : sec >= HALO_TIER1_SEC ? 1 : 0;
}

/** Giây tối đa được cộng cho một lần tick: chặn đồng hồ nhảy (máy ngủ, treo) thổi phồng số giây. */
export const MAX_CREDIT_STEP_MS = MEDITATE_TICK_MS * 2;

/**
 * Chia phiên đang ngồi tại 00:00 giờ VN. Giữ riêng trạng thái cũ để lần ghi
 * đang chờ không thể thay đổi tổng của ngày mới.
 */
export function rollMeditationDay(st: MeditationDayState, today: string): MeditationDayState {
  if (st.day === today) return st;
  const next = newMeditationDay(today);
  const midnight = Date.parse(`${today}T00:00:00+07:00`);
  if (st.creditAt !== undefined) {
    creditSitting(st, midnight);
    pauseSitting(st);
    next.creditAt = midnight;
  }
  return next;
}

/**
 * Cộng giây cho một lần tick khi người chơi đang ngồi. Lần đầu thấy ngồi (hoặc sau khi
 * đứng dậy) không cộng bù thời gian đã đứng: chỉ cộng phần trôi qua kể từ mốc trước đó,
 * tối đa `MAX_CREDIT_STEP_MS`. Trả về số giây vừa cộng.
 */
export function creditSitting(st: MeditationDayState, nowMs: number, maxStepMs = MAX_CREDIT_STEP_MS): number {
  const prev = st.creditAt;
  st.creditAt = nowMs;
  if (prev === undefined) return 0;
  const dt = Math.min(Math.max(0, nowMs - prev), Math.max(0, maxStepMs));
  if (dt <= 0) return 0;
  const sec = dt / 1000;
  st.pendingSec = (st.pendingSec ?? 0) + sec;
  return sec;
}

/** Người chơi đứng dậy / thoát: ngắt mốc cộng để lần ngồi sau không cộng bù thời gian đứng. */
export function pauseSitting(st: MeditationDayState): void {
  st.creditAt = undefined;
}

export interface FlushSnapshot { day: string; total: number; pending: number }

/**
 * Bắt đầu một lần ghi: chốt tổng mới của ngày và GIỮ CHỖ phần giây sắp ghi bằng cách trừ
 * khỏi `pendingSec` ngay. Nhờ vậy hai lần flush chồng nhau không bao giờ ghi trùng cùng
 * số giây, kể cả khi lần trước còn đang chạy. `null` khi chưa có gì để ghi (dưới 1 giây).
 */
export function flushBegin(st: MeditationDayState): FlushSnapshot | null {
  const pending = Math.floor(st.pendingSec ?? 0);
  if (!st.day || pending < 1) return null;
  const total = Math.floor(st.baseSec ?? 0) + pending;
  st.pendingSec = Math.max(0, (st.pendingSec ?? 0) - pending);
  return { day: st.day, total, pending };
}

/** Ghi thành công: nâng `baseSec` theo giá trị DB trả về (DB chỉ giữ MAX nên ghi trùng vô hại). */
export function flushCommit(st: MeditationDayState, snap: FlushSnapshot, storedSec: number): void {
  if (st.day !== snap.day) return; // đã sang ngày khác: kết quả của ngày cũ bị bỏ
  st.baseSec = Math.max(st.baseSec ?? 0, Number.isFinite(storedSec) ? storedSec : 0);
}

/** Ghi lỗi: trả phần đã giữ chỗ về `pendingSec` để lần flush sau thử lại, không mất giây. */
export function flushAbort(st: MeditationDayState, snap: FlushSnapshot): void {
  if (st.day !== snap.day) return;
  st.pendingSec = (st.pendingSec ?? 0) + snap.pending;
}
