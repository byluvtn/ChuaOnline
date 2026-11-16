import { levelOf } from '../../shared/types';
import { h, openCustomPanel } from '../panels';
import type { PanelCtx } from '../panels';
import { levelTitle } from './levels';
import { getStatsCache } from './stats';
import { TITLES, defaultTitle, titleName, titleProgress } from '../../shared/game';
import type { TitleRule, TitleInput } from '../../shared/game';

const nf = new Intl.NumberFormat('vi-VN');
const fmt = (n: number) => nf.format(n);

function progressLine(r: TitleRule, v: number): string {
  if (r.kind === 'level') return `Cấp ${v}/${r.need}`;
  if (r.kind === 'quests') return `Nhiệm vụ ${v}/${r.need}`;
  if (r.kind === 'donated') return `Đóng góp ${fmt(v)}/${fmt(r.need)} xu`;
  switch (r.stat) {
    case 'bows': return `Lạy Phật ${v}/${r.need}`;
    case 'chants': return `Tụng kinh ${v}/${r.need}`;
    case 'lanterns': return `Thả đèn ${v}/${r.need}`;
    case 'incense': return `Thắp hương ${v}/${r.need}`;
    case 'beadsRounds': return `Lần hạt ${v}/${r.need} vòng`;
    case 'meditateSec': return `${Math.floor(v / 60)}/${Math.round(r.need / 60)} phút thiền`;
  }
  return '';
}

function render(ctx: PanelCtx, body: HTMLElement) {
  body.replaceChildren();
  const p = ctx.profile();
  if (!p) return;
  const lv = levelOf(p.merit);
  const earned = new Set(p.titles ?? []);
  const cur = p.title ?? defaultTitle(p.titles ?? []);
  const stats = getStatsCache()?.stats ?? { bows: 0, chants: 0, lanterns: 0, meditateSec: 0, beadsRounds: 0, incense: 0 };
  const input: TitleInput = { level: lv, questsDone: p.questsDone, donated: p.donated, stats };

  const bio = h('textarea', { maxlength: '200', placeholder: 'Tiểu sử: đôi lời về bạn (không bắt buộc)', style: 'width:100%;min-height:64px;margin-top:10px;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:inherit;font:inherit;resize:vertical' });
  bio.value = p.bio ?? '';
  const age = h('input', { type: 'text', inputmode: 'numeric', placeholder: 'Tuổi (không bắt buộc)', style: 'width:100%;margin-top:8px;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:inherit;font:inherit' });
  age.value = p.age != null ? String(p.age) : '';
  const save = h('button', { style: 'background:#f4cd6e;color:#3a2410;border:none;border-radius:14px;padding:6px 16px;font-weight:700;cursor:pointer;margin-top:8px' }, 'Lưu hồ sơ');
  save.addEventListener('click', () => {
    const b = bio.value.trim();
    if (b.length > 200) { ctx.toast('Tiểu sử tối đa 200 ký tự'); return; }
    const raw = age.value.trim();
    let a: number | null = null;
    if (raw) {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 120) { ctx.toast('Tuổi phải từ 1 đến 120'); return; }
      a = n;
    }
    ctx.socket.emit('profile:save', { bio: b || null, age: a }, (r: { ok: boolean; error?: string }) => {
      if (r?.ok) ctx.toast('Đã lưu hồ sơ');
      else ctx.toast(r?.error ?? 'Không lưu được hồ sơ');
    });
  });

  body.append(
    h('div', { style: 'display:flex;gap:10px;align-items:center;margin:4px 0 6px' },
      h('div', { class: 'avatar' }, (p.name || '?').charAt(0).toUpperCase()),
      h('div', {},
        h('b', {}, p.name),
        h('div', { style: 'font-size:13px;opacity:.85' }, `Cấp ${lv} · ${levelTitle(lv)}`),
        h('div', { style: 'font-size:12px;opacity:.7' }, `${fmt(p.merit)} công đức · ${fmt(p.coins)} xu`))),
    bio, age, save,
    h('div', { style: 'font-size:12px;opacity:.7;margin-top:4px' }, 'Tất cả đều không bắt buộc.'));

  body.append(h('div', { style: 'color:#f4cd6e;font-size:20px;font-weight:700;margin:16px 0 8px' }, cur ? titleName(cur) : 'Chưa có danh hiệu'));
  body.append(h('p', { style: 'font-size:12px;opacity:.8;line-height:1.5;margin:0 0 6px' }, 'Làm đủ điều kiện trên thẻ là nhận được. Ai làm đủ cũng nhận được, không giới hạn suất. Danh hiệu không bán. Có nhiều danh hiệu thì chọn mang một cái, đổi lúc nào cũng được.'));
  body.append(h('div', { style: 'font-size:12px;opacity:.7;margin-bottom:8px' }, `Danh hiệu tu tập · Đã nhận ${earned.size}/24 danh hiệu · không giới hạn suất`));

  for (const r of TITLES) {
    const v = titleProgress(r, input);
    const done = earned.has(r.id);
    const on = done && cur === r.id;
    const card = h('div', { style: `border:2px solid ${on ? '#f4cd6e' : 'rgba(255,255,255,.12)'};border-radius:12px;padding:8px 10px;margin:6px 0;opacity:${done ? 1 : 0.55}` },
      h('div', { style: 'font-weight:700' }, `🏆 ${r.name}`),
      h('div', { style: 'font-size:12px;opacity:.8' }, r.desc),
      h('div', { style: 'font-size:12px;opacity:.9;margin-top:2px' }, progressLine(r, v)));
    if (on) {
      card.append(h('div', { style: 'color:#f4cd6e;font-size:12px;font-weight:700;margin-top:4px' }, 'Đang mang'));
    } else if (done) {
      const btn = h('button', { style: 'margin-top:6px;padding:4px 12px;border-radius:14px;cursor:pointer;background:#f4cd6e;color:#3a2410;border:none;font-weight:700' }, 'Mang danh hiệu');
      btn.addEventListener('click', () => {
        ctx.socket.emit('title:select', r.id, (res: { ok: boolean; error?: string }) => {
          if (!res?.ok) { ctx.toast(res?.error ?? 'Không đổi được danh hiệu'); return; }
          const pr = ctx.profile();
          if (pr) pr.title = r.id;
          render(ctx, body);
        });
      });
      card.append(btn);
    }
    body.append(card);
  }
}

export function openProfilePanel(ctx: PanelCtx) {
  if (!ctx.profile()) { ctx.toast('Chưa đăng nhập'); return; }
  openCustomPanel('Hồ sơ & danh hiệu', (body) => {
    const rerender = () => render(ctx, body);
    ctx.socket.on('profile', rerender);
    render(ctx, body);
    ctx.socket.emit('stats:get', () => rerender());
    return () => ctx.socket.off('profile', rerender);
  });
}
