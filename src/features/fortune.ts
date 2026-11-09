import { h, openCustomPanel } from '../panels';
import { FORTUNES } from '../data/fortunes';
import { iconSvg } from '../icons';
import type { MenuCtx } from '../menu';

const KEY = 'co:fortune';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function saved(): number | null {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (r && r.day === today() && Number.isInteger(r.n) && r.n >= 0 && r.n < FORTUNES.length) return r.n;
  } catch { /* ignore */ }
  return null;
}
const textOf = (n: number) => {
  const f = FORTUNES[n];
  return `Quẻ số ${n + 1} – ${f.grade}\n${f.poem.join('\n')}\nSự nghiệp: ${f.career}\nTình duyên: ${f.love}\nSức khỏe: ${f.health}\nTài lộc: ${f.wealth}\n(Chùa Online, chỉ để giải trí và suy ngẫm)`;
};

export function openFortune(ctx: MenuCtx) {
  openCustomPanel('Xin xăm', (body) => {
    const timers: number[] = [];
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
    const n0 = saved();
    if (n0 !== null) { show(n0); return; }
    const tube = h('div', { class: 'tube', 'aria-hidden': 'true' },
      ...[0, 1, 2, 3, 4].map((i) => h('i', { style: `--i:${i}` })), h('span', {}));
    const btn = h('button', { class: 'gold' }, 'Lắc ống xăm');
    btn.onclick = () => {
      btn.disabled = true;
      tube.classList.add('shake');
      timers.push(window.setTimeout(() => {
        const n = Math.floor(Math.random() * FORTUNES.length);
        localStorage.setItem(KEY, JSON.stringify({ day: today(), n }));
        show(n);
      }, 2200));
    };
    const ic = h('div', { class: 'ic' });
    ic.innerHTML = iconSvg('fortune');
    body.append(h('div', { class: 'tube-wrap' }, tube), h('p', { class: 'hint', style: 'text-align:center' }, 'Thành tâm nghĩ về điều bạn muốn hỏi, rồi lắc ống xăm.'), btn);
    return () => timers.forEach(clearTimeout);
  });
}
