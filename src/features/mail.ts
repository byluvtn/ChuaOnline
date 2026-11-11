import { ITEM_BY_ID, type MailAck, type MailGift, type MailItem } from '../../shared/game';
import { audio } from '../audio';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';

let unread = 0;
let mails: MailItem[] = [];
let onChange: () => void = () => {};

export const mailPending = () => unread > 0;

/** Nghe số thư chưa đọc server đẩy khi vào chùa; onDot được gọi mỗi khi số này đổi. */
export function initMail(ctx: MenuCtx, onDot: () => void) {
  onChange = onDot;
  ctx.socket.on('mail', (s: { unread: number }) => { unread = Number(s?.unread) || 0; onChange(); });
}

const setUnread = (r: MailAck | undefined) => {
  if (r && typeof r.unread === 'number') { unread = r.unread; onChange(); }
};

export function giftText(g: MailGift): string {
  const parts: string[] = [];
  if (g.merit) parts.push(`+${g.merit} công đức`);
  if (g.coins) parts.push(`+${g.coins} xu`);
  for (const [id, qty] of Object.entries(g.items ?? {})) parts.push(`${ITEM_BY_ID[id]?.name ?? id} ×${qty}`);
  return parts.join(' · ');
}

const fmtTime = (t: number) => new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

function renderList(body: HTMLElement, ctx: MenuCtx) {
  if (!mails.length) {
    body.replaceChildren(h('p', { class: 'hint' }, 'Hòm thư đang trống.'));
    return;
  }
  const rows = mails.map((m) => {
    const kids: (string | HTMLElement)[] = [
      h('div', { class: 'mtitle' }, ...(m.read ? [] : [h('i', { class: 'mdot', 'aria-label': 'Chưa đọc' })]), m.title),
      h('small', {}, fmtTime(m.createdAt)),
    ];
    if (m.gift) kids.push(h('span', { class: 'mgift' }, m.claimed ? 'Đã nhận quà' : giftText(m.gift)));
    const row = h('button', { class: `mrow${m.read ? '' : ' unread'}`, type: 'button' }, ...kids);
    row.onclick = () => openMailDetail(body, ctx, m);
    return row;
  });
  body.replaceChildren(...rows);
}

function openMailDetail(body: HTMLElement, ctx: MenuCtx, m: MailItem) {
  if (!m.read) {
    m.read = true;
    ctx.socket.emit('mail:read', m.id, (r: MailAck) => setUnread(r));
  }
  const back = h('button', { class: 'mback', type: 'button' }, '← Hòm thư');
  back.onclick = () => renderList(body, ctx);
  const kids: (string | HTMLElement)[] = [
    back,
    h('div', { class: 'fcard' }, h('small', {}, fmtTime(m.createdAt)), h('h3', {}, m.title)),
    h('p', { class: 'mbody' }, m.body),
  ];
  if (m.gift) {
    kids.push(h('p', { class: 'mgift' }, giftText(m.gift)));
    const btn = h('button', { class: 'gold' }, m.claimed ? 'Đã nhận quà' : 'Nhận quà');
    if (m.claimed) btn.disabled = true;
    btn.onclick = () => {
      btn.disabled = true;
      ctx.socket.emit('mail:claim', m.id, (r: MailAck) => {
        setUnread(r);
        if (r?.ok) {
          m.claimed = true;
          audio.play('coin');
          const its = Object.entries(r.items ?? {}).map(([id, q]) => `, +${q} ${ITEM_BY_ID[id]?.name ?? id}`).join('');
          ctx.toast(`Nhận quà thư: +${r.merit} công đức, +${r.coins} xu${its}`);
        } else {
          if (r?.error && /đã được nhận/.test(r.error)) m.claimed = true;
          ctx.toast(r?.error ?? 'Không nhận được quà');
        }
        if (body.isConnected) openMailDetail(body, ctx, m);
      });
    };
    kids.push(btn);
  }
  body.replaceChildren(...kids);
}

export function openMail(ctx: MenuCtx) {
  openCustomPanel('Hòm thư', (body) => {
    body.replaceChildren(h('p', { class: 'hint' }, 'Đang tải...'));
    ctx.socket.emit('mail:list', (r: MailAck) => {
      if (r?.ok) { mails = r.mails ?? []; setUnread(r); }
      if (!body.isConnected) return;
      if (!r?.ok) { body.replaceChildren(h('p', { class: 'hint' }, r?.error ?? 'Không tải được hòm thư')); return; }
      renderList(body, ctx);
    });
  });
}
