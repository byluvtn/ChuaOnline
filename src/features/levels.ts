import { levelOf, meritForLevel } from '../../shared/types';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';

const TIERS = ['Sơ phát tâm', 'Cư sĩ', 'Thiện nam tín nữ', 'Hộ pháp', 'Tịnh tín', 'Tinh tấn', 'Minh tâm', 'Giác hạnh', 'Từ bi', 'Trí tuệ'];
export const levelTitle = (lv: number) => TIERS[Math.min(TIERS.length - 1, Math.floor((lv - 1) / 3))];

export function openLevels(ctx: MenuCtx) {
  openCustomPanel('Cấp độ', (body) => {
    const merit = ctx.profile()?.merit ?? 0;
    const lv = levelOf(merit);
    const lo = meritForLevel(lv), hi = meritForLevel(lv + 1);
    body.append(
      h('div', { class: 'lvhero' }, h('small', {}, 'Cấp hiện tại'), h('b', {}, `${lv}`), h('span', {}, levelTitle(lv))),
      h('progress', { max: hi - lo, value: merit - lo, class: 'lvbar' }),
      h('p', { class: 'hint', style: 'margin-top:6px' }, `Công đức: ${merit}. Còn ${hi - merit} để lên cấp ${lv + 1}.`));
    const t = h('table', { class: 'rank lvtable' }, h('tr', {}, h('th', {}, 'Cấp'), h('th', {}, 'Danh hiệu'), h('th', {}, 'Công đức')));
    let cur: HTMLElement | null = null;
    for (let i = 1; i <= 30; i++) {
      const tr = h('tr', { class: i === lv ? 'cur' : '' }, h('td', {}, String(i)), h('td', {}, levelTitle(i)), h('td', {}, String(meritForLevel(i))));
      if (i === lv) cur = tr;
      t.append(tr);
    }
    const wrap = h('div', { class: 'lvwrap' }, t);
    body.append(wrap);
    if (cur) wrap.scrollTop = Math.max(0, cur.offsetTop - wrap.clientHeight / 2);
  });
}
