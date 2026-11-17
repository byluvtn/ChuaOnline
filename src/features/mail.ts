import { ITEM_BY_ID, ITEMS, type GiftAck, type MailAck, type MailGift, type MailItem } from '../../shared/game';
import { audio } from '../audio';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';
import { emitAck } from '../emitAck';

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
  const giftBtn = h('button', { class: 'mgift-btn', type: 'button' }, 'Tặng quà');
  giftBtn.onclick = () => openGiftForm(body, ctx);

  if (!mails.length) {
    body.replaceChildren(giftBtn, h('p', { class: 'hint' }, 'Hòm thư đang trống.'));
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
  body.replaceChildren(giftBtn, ...rows);
}

function openGiftForm(body: HTMLElement, ctx: MenuCtx) {
  const players = ctx.players().filter(p => p.id !== ctx.socket.id);

  const back = h('button', { class: 'mback', type: 'button' }, '← Hòm thư');
  back.onclick = () => renderList(body, ctx);

  const kids: (string | HTMLElement)[] = [back];

  if (!players.length) {
    kids.push(h('p', { class: 'hint' }, 'Không có người chơi nào khác trong phòng'));
    body.replaceChildren(...kids);
    return;
  }

  const gifts = ITEMS.filter(it => it.category === 'le_vat' && (ctx.profile()?.inventory[it.id] ?? 0) > 0);

  if (!gifts.length) {
    kids.push(h('p', { class: 'hint' }, 'Bạn chưa có lễ vật nào trong túi'));
    body.replaceChildren(...kids);
    return;
  }

  const selTo = h('select', { class: 'gift-to' },
    h('option', { value: '' }, '-- Chọn người nhận --'),
    ...players.map(p => h('option', { value: String(p.pid) }, `${p.name} · Cấp ${p.level ?? '?'}`))
  );
  const selItem = h('select', { class: 'gift-item' },
    h('option', { value: '' }, '-- Chọn lễ vật --'),
    ...gifts.map(it => h('option', { value: it.id }, `${it.name} (×${ctx.profile()?.inventory[it.id] ?? 0})`))
  );
  const inpNote = h('input', { class: 'gift-note', maxlength: '120', placeholder: 'Tặng bạn một lễ vật' });

  const btnSend = h('button', { class: 'gold', type: 'button' }, 'Gửi');
  btnSend.disabled = true;

  const checkValid = () => { btnSend.disabled = !selTo.value || !selItem.value; };
  selTo.onchange = checkValid;
  selItem.onchange = checkValid;

  btnSend.onclick = () => {
    btnSend.disabled = true;
    emitAck<GiftAck>(ctx.socket, 'gift:send', [{ toPid: Number(selTo.value), item: selItem.value, note: inpNote.value }], (r, timedOut) => {
      if (timedOut) {
        ctx.toast('Mất kết nối — không rõ quà đã gửi chưa, kiểm tra lại nhé');
        btnSend.disabled = false;
        return;
      }
      if (r?.ok) {
        ctx.toast(`Đã gửi quà. Còn ${r.left} lượt tặng hôm nay.`);
        if (body.isConnected) renderList(body, ctx);
      } else {
        ctx.toast(r?.error ?? 'Gửi quà thất bại');
        btnSend.disabled = false;
      }
    });
  };

  kids.push(
    h('div', { class: 'fcard' },
      h('label', {}, 'Người nhận'), selTo,
      h('label', {}, 'Lễ vật'), selItem,
      h('label', {}, 'Lời nhắn'), inpNote,
      btnSend
    )
  );

  body.replaceChildren(...kids);
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
      emitAck<MailAck>(ctx.socket, 'mail:claim', [m.id], (r, timedOut) => {
        if (timedOut) {
          ctx.toast('Mất kết nối, thử lại nhé');
          if (body.isConnected) openMailDetail(body, ctx, m);
          return;
        }
        setUnread(r);
        if (r?.ok) {
          m.claimed = true;
          audio.play('coin');
          ctx.toast('Nhận quà thư: ' + giftText({ merit: r.merit ?? 0, coins: r.coins ?? 0, items: r.items ?? {} }));
        } else {
          if (r?.reason === 'claimed') m.claimed = true;
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
    emitAck<MailAck>(ctx.socket, 'mail:list', [], (r, timedOut) => {
      if (timedOut) {
        if (body.isConnected) body.replaceChildren(h('p', { class: 'hint' }, 'Không tải được hòm thư — mất kết nối, mở lại thử nhé'));
        return;
      }
      if (r?.ok) { mails = r.mails ?? []; setUnread(r); }
      if (!body.isConnected) return;
      if (!r?.ok) { body.replaceChildren(h('p', { class: 'hint' }, r?.error ?? 'Không tải được hòm thư')); return; }
      renderList(body, ctx);
    });
  });
}
