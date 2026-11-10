import { h, openCustomPanel } from '../panels';
import { setSetting, settings, type Settings } from '../settings';
import type { MenuCtx } from '../menu';

export function openSettings(ctx: MenuCtx) {
  openCustomPanel('Cài đặt', (body) => {
    const toggle = (key: 'sound' | 'showCouplets' | 'showNames' | 'showBubbles' | 'showTips' | 'showNpcs', label: string, hint?: string) => {
      const cb = h('input', { type: 'checkbox', role: 'switch', id: `st-${key}` });
      cb.checked = settings[key];
      cb.onchange = () => setSetting(key, cb.checked);
      return h('label', { class: 'srow', for: `st-${key}` }, h('span', {}, h('b', {}, label), hint ? h('small', {}, hint) : ''), cb);
    };
    const vol = h('input', { type: 'range', min: 0, max: 100, step: 5, id: 'st-vol', 'aria-label': 'Âm lượng' });
    vol.value = String(Math.round(settings.volume * 100));
    vol.oninput = () => setSetting('volume', Number(vol.value) / 100);
    const q = h('div', { class: 'rtabs' });
    const drawQ = () => q.replaceChildren(...([['low', 'Thấp'], ['medium', 'Vừa'], ['high', 'Cao']] as [Settings['quality'], string][]).map(([k, l]) =>
      h('button', { class: settings.quality === k ? 'on' : '', onclick: () => { setSetting('quality', k); drawQ(); } }, l)));
    drawQ();
    body.append(
      toggle('sound', 'Âm thanh'),
      h('label', { class: 'srow', for: 'st-vol' }, h('span', {}, h('b', {}, 'Âm lượng')), vol),
      h('div', { class: 'srow col' }, h('span', {}, h('b', {}, 'Chất lượng đồ họa'), h('small', {}, 'Chọn thấp nếu máy chậm hoặc nóng')), q),
      toggle('showCouplets', 'Hiện câu đối', 'Phụ đề câu đối Hán Việt khi đến gần'),
      toggle('showNames', 'Hiện tên người chơi'),
      toggle('showBubbles', 'Hiện bóng chat'),
      toggle('showTips', 'Hiện gợi ý'),
      toggle('showNpcs', 'Hiện NPC sư thầy/chú tiểu'),
      h('button', { class: 'ghost wide danger', onclick: () => ctx.logout() }, 'Đăng xuất'));
  });
}
