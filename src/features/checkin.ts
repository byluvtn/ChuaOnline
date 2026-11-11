import { CHECKIN_REWARDS, ITEM_BY_ID, type CheckinAck, type CheckinState } from '../../shared/game';
import { audio } from '../audio';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';

let state: CheckinState | null = null;
let onChange: () => void = () => {};

export const checkinPending = () => !!state && !state.claimedToday;

/** Nghe trạng thái điểm danh server đẩy khi vào chùa; onDot được gọi mỗi khi trạng thái đổi. */
export function initCheckin(ctx: MenuCtx, onDot: () => void) {
  onChange = onDot;
  ctx.socket.on('checkin', (s: CheckinState) => { state = s; onChange(); });
}

const rewardText = (i: number) => {
  const r = CHECKIN_REWARDS[i];
  return `${r.merit} công đức · ${r.coins} xu`;
};

function render(body: HTMLElement, ctx: MenuCtx, busy = false) {
  const st = state ?? { streak: 0, claimedToday: false, total: 0 };
  const cur = st.claimedToday ? ((st.streak - 1) % 7) + 1 : (st.streak % 7) + 1;
  const cells = CHECKIN_REWARDS.map((r, i) => {
    const day = i + 1;
    const cls = day < cur || (day === cur && st.claimedToday) ? 'done' : day === cur ? 'now' : 'next';
    const kids: (string | HTMLElement)[] = [h('small', {}, `Ngày ${day}`)];
    if (cls === 'done') kids.push(h('i', { class: 'tick', 'aria-label': 'Đã nhận' }, '✓'));
    kids.push(h('b', {}, `${r.merit} công đức`), h('span', {}, `${r.coins} xu`));
    if (r.item) kids.push(h('span', { class: 'itm' }, `${ITEM_BY_ID[r.item]?.icon ?? ''} ${ITEM_BY_ID[r.item]?.name ?? r.item}`));
    return h('div', { class: `ckcell ${cls}${day === 7 ? ' big' : ''}` }, ...kids);
  });
  const btn = h('button', { class: 'gold' }, st.claimedToday ? 'Đã nhận hôm nay' : `Nhận quà ngày ${cur}`);
  if (st.claimedToday || busy) btn.disabled = true;
  btn.onclick = () => {
    btn.disabled = true;
    ctx.socket.emit('checkin:claim', (r: CheckinAck) => {
      if (r?.state) state = r.state;
      onChange();
      if (r?.ok) {
        audio.play('coin');
        const it = r.item ? `, +1 ${ITEM_BY_ID[r.item]?.name ?? r.item}` : '';
        ctx.toast(`Điểm danh ngày ${r.cycleDay}: +${r.merit} công đức, +${r.coins} xu${it}`);
      } else ctx.toast(r?.error ?? 'Không điểm danh được');
      if (body.isConnected) render(body, ctx);
    });
  };
  body.replaceChildren(
    h('div', { class: 'fcard' }, h('small', {}, 'Điểm danh mỗi ngày'),
      h('h3', {}, `Chuỗi điểm danh: ${st.streak} ngày · Tổng lượt: ${st.total}`)),
    h('div', { class: 'ckgrid' }, ...cells),
    btn,
    h('p', { class: 'hint' }, `Hôm nay: ${rewardText(cur - 1)}. Bỏ lỡ một ngày thì chuỗi tính lại từ ngày 1. Ngày mới bắt đầu lúc 07:00 giờ Việt Nam.`));
}

export function openCheckin(ctx: MenuCtx) {
  openCustomPanel('Điểm danh', (body) => {
    render(body, ctx, true);
    ctx.socket.emit('checkin:get', (r: CheckinAck) => {
      if (r?.state) { state = r.state; onChange(); }
      if (body.isConnected) render(body, ctx);
    });
  });
}
