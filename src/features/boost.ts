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

let current: MeritBoost = meritBoost(new Date());

/** Trên điện thoại, khung chat đang mở phủ vùng banner nên ẩn banner cho tới khi chat thu gọn lại. */
const chatCoversBanner = () => {
  const chat = document.getElementById('chat');
  return window.matchMedia('(max-width: 760px)').matches && !!chat && !chat.classList.contains('collapsed');
};

function render(b: MeritBoost = current) {
  current = b;
  const el = document.getElementById('boostBanner');
  if (!el) return;
  const t = boostText(b);
  el.hidden = !t || chatCoversBanner();
  el.textContent = t;
}

/** Hiển thị hệ số công đức: lấy mỏ neo từ server lúc join, rồi tự tính lại mỗi 30 giây (chỉ để hiển thị). */
export function initBoost(ctx: MenuCtx) {
  ctx.socket.on('boost', (b: MeritBoost) => render(b));
  render(meritBoost(new Date()));
  setInterval(() => render(meritBoost(new Date())), 30_000);
  const chat = document.getElementById('chat');
  if (chat) new MutationObserver(() => render()).observe(chat, { attributes: true, attributeFilter: ['class'] });
  window.matchMedia('(max-width: 760px)').addEventListener('change', () => render());
}
