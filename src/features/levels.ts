import { levelOf, meritForLevel } from '../../shared/types';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';
import { renderStatsSection } from './stats';
import { TITLES, defaultTitle, titleName } from '../../shared/game';

const TIERS = ['Sơ phát tâm', 'Cư sĩ', 'Thiện nam tín nữ', 'Hộ pháp', 'Tịnh tín', 'Tinh tấn', 'Minh tâm', 'Giác hạnh', 'Từ bi', 'Trí tuệ'];
export const levelTitle = (lv: number) => TIERS[Math.min(TIERS.length - 1, Math.floor((lv - 1) / 3))];

function renderTitles(ctx: MenuCtx, box: HTMLElement) {
  box.replaceChildren();
  const p = ctx.profile();
  const earned = new Set(p?.titles ?? []);
  const cur = p?.title ?? defaultTitle(p?.titles ?? []);
  box.append(h('div', { style: 'color:#f4cd6e;font-size:20px;font-weight:700;margin:4px 0 8px' }, cur ? titleName(cur) : 'Chưa có danh hiệu'));
  for (const r of TITLES) {
    if (!earned.has(r.id)) {
      box.append(h('div', { style: 'opacity:.55;margin:4px 0' }, h('b', {}, r.name), h('small', { style: 'display:block' }, r.desc)));
      continue;
    }
    const on = cur === r.id;
    const b = h('button', { style: `display:block;margin:3px 0;padding:4px 10px;border-radius:14px;cursor:pointer;border:2px solid ${on ? '#f4cd6e' : 'transparent'}`, title: r.desc }, r.name);
    b.addEventListener('click', () => {
      ctx.socket.emit('title:select', r.id, (res: { ok: boolean; error?: string }) => {
        if (!res?.ok) { ctx.toast(res?.error ?? 'Không đổi được danh hiệu'); return; }
        const pr = ctx.profile();
        if (pr) pr.title = r.id;
        renderTitles(ctx, box);
      });
    });
    box.append(b);
  }
}

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
    const tbox = h('div', { class: 'ttbox' });
    body.append(h('h4', { class: 'sttitle' }, 'Danh hiệu'), tbox);
    renderTitles(ctx, tbox);
    renderStatsSection(ctx, body);
  });
}
