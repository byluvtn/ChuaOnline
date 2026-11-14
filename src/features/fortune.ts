import type { Socket } from 'socket.io-client';
import { h, openCustomPanel } from '../panels';
import { FORTUNES, type FortuneAck } from '../data/fortunes';
import { iconSvg } from '../icons';

const validN = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < FORTUNES.length;
const textOf = (n: number) => {
  const f = FORTUNES[n];
  return `Quẻ số ${n + 1} – ${f.grade}\n${f.poem.join('\n')}\nSự nghiệp: ${f.career}\nTình duyên: ${f.love}\nSức khỏe: ${f.health}\nTài lộc: ${f.wealth}\n(Chùa Online, chỉ để giải trí và suy ngẫm)`;
};

export function openFortune(ctx: { socket: Socket; toast: (t: string) => void }) {
  openCustomPanel('Xin xăm', (body) => {
    const timers: number[] = [];
    let closed = false;
    const show = (n: number) => {
      const f = FORTUNES[n];
      const row = (k: string, v: string) => h('div', { class: 'fq' }, h('b', {}, k), h('span', {}, v));
      body.replaceChildren(
        h('div', { class: 'fcard' },
          h('small', {}, `Quẻ số ${n + 1}`), h('h3', {}, f.grade),
          h('div', { class: 'poem' }, ...f.poem.map((l) => h('p', {}, l)))),
        row('Sự nghiệp', f.career), row('Tình duyên', f.love), row('Sức khỏe', f.health), row('Tài lộc', f.wealth),
        h('button', { class: 'gold', onclick: async () => {
          try { await navigator.clipboard.writeText(textOf(n)); ctx.toast('Đã sao chép quẻ xăm'); } catch { ctx.toast('Không thể sao chép'); }
        } }, 'Sao chép / chia sẻ'),
        h('p', { class: 'hint' }, 'Quẻ xăm chỉ mang tính giải trí và gợi ý suy ngẫm, không thay thế lời khuyên chuyên môn. Mỗi ngày được xin một quẻ miễn phí; hãy sống hiền, làm lành.'));
    };
    const tube = h('div', { class: 'tube', 'aria-hidden': 'true' },
      ...[0, 1, 2, 3, 4].map((i) => h('i', { style: `--i:${i}` })), h('span', {}));
    const btn = h('button', { class: 'gold' }, 'Lắc ống xăm');
    const ic = h('div', { class: 'ic' });
    ic.innerHTML = iconSvg('fortune');
    const loadSaved = () => {
      ctx.socket.emit('fortune:get', (r?: FortuneAck) => {
        if (closed) return;
        if (r?.ok && validN(r.n)) show(r.n);
      });
    };
    btn.onclick = () => {
      btn.disabled = true;
      tube.classList.add('shake');
      timers.push(window.setTimeout(() => {
        ctx.socket.emit('fortune:draw', (r?: FortuneAck) => {
          if (closed) return;
          if (r?.ok && validN(r.n)) { show(r.n); return; }
          tube.classList.remove('shake');
          btn.disabled = false;
          if (r?.used) { loadSaved(); return; }
          ctx.toast(r?.error ?? 'Không xin được quẻ, thử lại nhé');
        });
      }, 2200));
    };
    body.append(h('div', { class: 'tube-wrap' }, tube), h('p', { class: 'hint', style: 'text-align:center' }, 'Thành tâm nghĩ về điều bạn muốn hỏi, rồi lắc ống xăm.'), btn);
    loadSaved();
    return () => { closed = true; timers.forEach(clearTimeout); };
  });
}
