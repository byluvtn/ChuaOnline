import { ITEM_BY_ID, SPIN_SEGMENTS, type SpinAck, type SpinState } from '../../shared/game';
import { audio } from '../audio';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';

let spinUsed: boolean | null = null;
let onChange: () => void = () => {};

export const spinPending = () => spinUsed === false;
export const spinDone = () => spinUsed === true;

/** Nghe trạng thái vòng quay server đẩy khi vào chùa; onDot được gọi mỗi khi trạng thái đổi. */
export function initSpin(ctx: MenuCtx, onDot: () => void) {
  onChange = onDot;
  ctx.socket.on('spin', (s: SpinState) => { spinUsed = !!s?.used; onChange(); });
}

const N = SPIN_SEGMENTS.length;
const ARC = 360 / N;
const TONES = ['#f7e6b5', '#d9893f', '#a9672e'];
const JACKPOT = N - 1;
const SPIN_MS = 4500;

const sliceColor = (i: number) => (i === JACKPOT ? '#8f1d14' : TONES[i % 3]);
const sliceInk = (i: number) => (i === JACKPOT ? '#ffe28a' : i % 3 === 0 ? '#5a3410' : '#fff6dc');

function resultText(r: SpinAck): string {
  if (r.merit && r.coins) return `ĐẠI CÁT: +${r.merit} công đức, +${r.coins} xu!`;
  if (r.merit) return `Chúc mừng: +${r.merit} công đức!`;
  if (r.coins) return `Chúc mừng: ${r.coins} xu!`;
  if (r.item) return `Chúc mừng: ${ITEM_BY_ID[r.item]?.name ?? r.item} ×1!`;
  return 'Chúc mừng!';
}

const USED_TEXT = 'Hôm nay bạn đã quay rồi · Mai quay tiếp nhé';

export function openSpin(ctx: MenuCtx, back?: () => void) {
  openCustomPanel('Vòng quay may mắn', (body) => {
    const stops = SPIN_SEGMENTS.map((_, i) => `${sliceColor(i)} ${i * ARC}deg ${(i + 1) * ARC}deg`).join(', ');
    const wheel = h('div', { class: 'spin-wheel' });
    wheel.style.background = `conic-gradient(from 0deg, ${stops})`;
    SPIN_SEGMENTS.forEach((seg, i) => {
      const lb = h('span', { class: `spin-lb${i === JACKPOT ? ' jp' : ''}` }, seg.label);
      lb.style.transform = `rotate(${i * ARC + ARC / 2}deg)`;
      lb.style.color = sliceInk(i);
      wheel.append(lb);
    });
    const ring = h('div', { class: 'spin-ring' }, wheel);
    const pointer = h('div', { class: 'spin-pointer', 'aria-hidden': 'true' });
    const btn = h('button', { class: 'spin-go', type: 'button' }, 'QUAY');
    const note = h('div', { class: 'spin-note', role: 'status' });
    const stage = h('div', { class: 'spin-stage' }, ring, pointer, btn);
    const used = h('div', { class: 'spin-used' }, USED_TEXT);

    const showUsed = () => { btn.hidden = true; used.hidden = false; };
    used.hidden = true;
    if (spinUsed) showUsed();
    else if (spinUsed === null) {
      btn.disabled = true;
      ctx.socket.emit('spin:get', (r: SpinAck) => {
        if (r?.ok) { spinUsed = !!r.used; onChange(); }
        if (!stage.isConnected) return;
        if (spinUsed) showUsed(); else btn.disabled = false;
      });
    }

    btn.onclick = () => {
      if (btn.disabled) return;
      btn.disabled = true;
      note.textContent = '';
      ctx.socket.emit('spin:play', (r: SpinAck) => {
        if (!r?.ok || typeof r.segment !== 'number') {
          if (r?.used) { spinUsed = true; onChange(); }
          if (!stage.isConnected) return;
          if (r?.used) { showUsed(); return; }
          note.textContent = r?.error ?? 'Không quay được, thử lại nhé';
          btn.disabled = false;
          return;
        }
        const a = r.segment * ARC + ARC / 2;
        const target = 360 * 5 + (360 - a);
        wheel.style.transition = `transform ${SPIN_MS / 1000}s cubic-bezier(0.12, 0.8, 0.08, 1)`;
        void wheel.offsetWidth;
        wheel.style.transform = `rotate(${target}deg)`;
        audio.play('click');
        window.setTimeout(() => {
          spinUsed = true;
          audio.play('coin');
          const txt = resultText(r);
          ctx.toast(txt);
          onChange();
          if (!stage.isConnected) return;
          note.textContent = txt;
          note.classList.add('win');
          showUsed();
        }, SPIN_MS + 100);
      });
    };

    body.append(
      h('button', { class: 'ghost back', onclick: () => back?.() }, '← Trò chơi'),
      stage, used, note,
      h('p', { class: 'hint' }, 'Mỗi ngày quay 1 lượt miễn phí. Kết quả do máy chủ quyết định. Ngày mới bắt đầu lúc 07:00 giờ Việt Nam.'));
  });
}
