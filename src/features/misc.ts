import { ACTION_RULES } from '../../shared/game';
import { CONFIG } from '../config';
import { NEWS, LATEST_NEWS_ID } from '../data/news';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';

const SEEN = 'co:news';
export const newsUnread = () => Number(localStorage.getItem(SEEN) ?? 0) < LATEST_NEWS_ID;

export function openNews() {
  localStorage.setItem(SEEN, String(LATEST_NEWS_ID));
  openCustomPanel('Có gì mới', (body) => {
    for (const n of NEWS) {
      body.append(h('div', { class: 'news' }, h('div', { class: 'news-h' }, h('b', {}, n.title), h('small', {}, n.date.split('-').reverse().join('/'))),
        h('ul', {}, ...n.items.map((i) => h('li', {}, i)))));
    }
  });
}

function tabs(body: HTMLElement, defs: { id: string; label: string; build: (el: HTMLElement) => void }[]) {
  const bar = h('div', { class: 'rtabs' });
  const view = h('div', {});
  const pick = (id: string) => {
    bar.replaceChildren(...defs.map((d) => h('button', { class: d.id === id ? 'on' : '', onclick: () => pick(d.id) }, d.label)));
    view.replaceChildren();
    defs.find((d) => d.id === id)!.build(view);
  };
  body.append(bar, view);
  pick(defs[0].id);
}

export function openCommunity(ctx: MenuCtx) {
  openCustomPanel('Cộng đồng', (body) => {
    tabs(body, [
      { id: 'on', label: 'Đang online', build: (v) => {
        const list = ctx.players();
        v.append(h('p', { class: 'hint', style: 'margin:0 0 8px' }, `${list.length} người trong chùa này. Bấm vào tên để đi tới.`));
        for (const p of [...list].sort((a, b) => (b.level ?? 0) - (a.level ?? 0))) {
          const row = h('div', { class: 'prow' }, h('div', {}, h('b', {}, p.name), h('small', {}, p.level ? ` · Cấp ${p.level}` : '')));
          const go = h('button', { class: 'chip', onclick: () => { ctx.goTo(p.x, p.z); ctx.toast(`Đang đi tới ${p.name}`); } }, 'Đi tới');
          go.hidden = true;
          row.append(go);
          row.onclick = (e) => { if (e.target !== go) go.hidden = !go.hidden; };
          v.append(row);
        }
      } },
      { id: 'log', label: 'Lịch sử chat', build: (v) => {
        const log = ctx.chatLog();
        if (!log.length) v.append(h('p', { class: 'hint' }, 'Chưa có lời nhắn nào.'));
        for (const m of log) {
          const t = new Date(m.t);
          v.append(h('p', { class: 'cl' }, h('small', {}, `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} `), h('b', {}, m.name + ': '), m.text));
        }
      } },
      { id: 'rules', label: 'Nội quy', build: (v) => {
        v.append(h('ul', { class: 'rules' },
          h('li', {}, 'Giữ lời nói hiền, không chửi bới hay xúc phạm.'),
          h('li', {}, 'Tôn trọng không gian thanh tịnh, không spam.'),
          h('li', {}, 'Không quảng cáo, không chia sẻ thông tin cá nhân.'),
          h('li', {}, 'Giúp đỡ người mới, chia sẻ điều lành.'),
          h('li', {}, 'Đặt tên (pháp danh) lịch sự, phù hợp với chốn chùa.')));
      } },
    ]);
  });
}

const fmtSec = (ms: number) => `${ms / 1000} giây`;
export function openGuide() {
  openCustomPanel('Cách chơi', (body) => {
    const sec = (title: string, ...lines: (string | Node)[]) => h('section', { class: 'guide' }, h('h3', {}, title), ...lines);
    const ul = (...items: string[]) => h('ul', {}, ...items.map((i) => h('li', {}, i)));
    const A = ACTION_RULES;
    tabs(body, [
      { id: 'c', label: 'Điều khiển', build: (v) => v.append(sec('Di chuyển', ul(
        'Máy tính: phím W A S D hoặc mũi tên để đi, giữ Shift để chạy.',
        'Kéo chuột để xoay camera, lăn chuột để phóng to / thu nhỏ.',
        'Bấm vào mặt đất để nhân vật tự đi tới đó.',
        'Điện thoại: dùng cần điều khiển bên trái, chạm để đi, kéo một ngón để xoay.',
        'Mở Bản đồ chùa để đi nhanh tới một địa điểm.'))) },
      { id: 'a', label: 'Hành lễ', build: (v) => v.append(sec('Hành lễ nhận công đức', ul(
        `Lạy Phật: +${A.bow.merit} công đức, chờ ${fmtSec(A.bow.cooldownMs)} (hoa sen: +${A.bow.boostMerit}).`,
        `Thắp hương: +${A.incense.merit} công đức, chờ ${fmtSec(A.incense.cooldownMs)} (hương trầm: +${A.incense.boostMerit}).`,
        `Tụng kinh: +${A.chant.merit} công đức, chờ ${fmtSec(A.chant.cooldownMs)}.`,
        `Thả đèn nguyện: +${A.lantern.merit} công đức, chờ ${fmtSec(A.lantern.cooldownMs)} (đèn hoa đăng: +${A.lantern.boostMerit}).`,
        'Thiền: ngồi yên để tích lũy công đức theo thời gian.',
        'Thiền chung từ 3 người trở lên trong cùng một chùa sẽ được nhân đôi công đức.')),
        sec('Nhiệm vụ & cửa hàng', ul('Nhiệm vụ làm mới mỗi ngày, hoàn thành để nhận xu và công đức.', 'Dùng xu mua hương, hoa, đèn và phụ kiện ở Cửa hàng.', 'Công đức tăng thì lên cấp, xem ở mục Cấp độ.'))) },
      { id: 'e', label: 'Lễ nghi', build: (v) => v.append(sec('Giữ nếp chùa', ul(
        'Giữ lời nói hiền, chào hỏi nhẹ nhàng.', 'Không làm ồn nơi chánh điện và sân thiền.', 'Tôn trọng mọi người, không spam hay quảng cáo.', 'Các trò chơi và xin xăm chỉ để giải trí, thư giãn.'))) },
    ]);
  });
}

export function openFeedback(ctx: MenuCtx) {
  openCustomPanel('Góp ý & ủng hộ', (body) => {
    const ta = h('textarea', { maxlength: 500, placeholder: 'Bạn muốn góp ý điều gì? (5-500 ký tự)', 'aria-label': 'Nội dung góp ý' });
    const contact = h('input', { maxlength: 100, placeholder: 'Liên hệ (không bắt buộc)', 'aria-label': 'Thông tin liên hệ', autocomplete: 'off' });
    const err = h('p', { class: 'err' });
    const send = h('button', { class: 'gold' }, 'Gửi góp ý');
    const form = h('div', {}, ta, contact, err, send);
    send.onclick = () => {
      const text = ta.value.trim();
      if (text.length < 5) { err.textContent = 'Góp ý cần tối thiểu 5 ký tự.'; return; }
      err.textContent = '';
      send.disabled = true;
      ctx.socket.emit('feedback:send', { text, contact: contact.value.trim() }, (r: { ok: boolean; error?: string }) => {
        if (r?.ok) form.replaceChildren(h('div', { class: 'thanks' }, h('b', {}, 'Xin cảm ơn bạn!'), h('p', {}, 'Góp ý của bạn đã được ghi nhận. Chúc bạn một ngày an lạc.')));
        else { err.textContent = r?.error ?? 'Không gửi được, thử lại sau.'; send.disabled = false; }
      });
    };
    body.append(form, h('hr', {}), supportBlock());
  });
}

function supportBlock(): HTMLElement {
  const box = h('div', { class: 'support' });
  box.append(h('p', {}, 'Chùa Online được xây dựng với tấm lòng, miễn phí cho mọi người. Nếu thấy hữu ích, bạn có thể góp một chút để duy trì máy chủ và phát triển thêm.'));
  const any = CONFIG.donateText || CONFIG.donateQrUrl || CONFIG.supportEmail;
  if (!any) { box.append(h('p', { class: 'hint' }, 'Thông tin ủng hộ sẽ sớm được cập nhật')); return box; }
  if (CONFIG.donateQrUrl) box.append(h('img', { class: 'qr', src: CONFIG.donateQrUrl, alt: 'Mã QR ủng hộ', referrerpolicy: 'no-referrer' }));
  if (CONFIG.donateText) box.append(h('pre', { class: 'donate' }, CONFIG.donateText));
  if (CONFIG.supportEmail) box.append(h('p', { class: 'hint' }, `Liên hệ: ${CONFIG.supportEmail}`));
  return box;
}
export function openDonate() {
  openCustomPanel('Ủng hộ', (body) => body.append(h('p', {}, 'Xin chân thành cảm ơn tấm lòng của bạn. Mọi sự ủng hộ đều là tùy tâm, không bắt buộc.'), supportBlock()));
}
export function openFacebook(ctx: MenuCtx) {
  if (!CONFIG.facebookUrl) return ctx.toast('Chưa cấu hình trang Facebook');
  window.open(CONFIG.facebookUrl, '_blank', 'noopener,noreferrer');
}
