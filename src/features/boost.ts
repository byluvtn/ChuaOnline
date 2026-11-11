import { meritBoost, type MeritBoost } from '../../shared/time';
import type { MenuCtx } from '../menu';

const fmtMult = (m: number) => String(m).replace('.', ',');

export function boostText(b: MeritBoost): string {
  if (b.mult <= 1) return '';
  const parts: string[] = [];
  if (b.session) parts.push('Giờ tụng kinh');
  if (b.holy) parts.push(b.lunarDay === 1 ? 'Ngày Mùng 1' : 'Ngày Rằm');
  parts.push(`Công đức ×${fmtMult(b.mult)}`);
  return parts.join(' · ');
}

function render(b: MeritBoost) {
  const el = document.getElementById('boostBanner');
  if (!el) return;
  const t = boostText(b);
  el.hidden = !t;
  el.textContent = t;
}

/** Hiển thị hệ số công đức: lấy mỏ neo từ server lúc join, rồi tự tính lại mỗi 30 giây (chỉ để hiển thị). */
export function initBoost(ctx: MenuCtx) {
  ctx.socket.on('boost', (b: MeritBoost) => render(b));
  render(meritBoost(new Date()));
  setInterval(() => render(meritBoost(new Date())), 30_000);
}
