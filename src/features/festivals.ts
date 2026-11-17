import { h, openCustomPanel } from '../panels';
import { FESTIVALS, type Festival } from '../data/festivals';
import type { MenuCtx } from '../menu';
import { SKY_LANTERN_COST, FIREWORKS, SKY_LANTERN_WISH_MAX } from '../../shared/game';
import { audio } from '../audio';

const DAY = 86_400_000;
let fmt: Intl.DateTimeFormat | null | undefined;
function lunarOf(d: Date): { month: number; day: number; leap: boolean } | null {
  if (fmt === undefined) {
    try {
      fmt = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric' });
      if (!fmt.formatToParts(new Date()).some((p) => p.type === 'day')) fmt = null;
    } catch { fmt = null; }
  }
  if (!fmt) return null;
  const parts = fmt.formatToParts(d);
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  const month = parseInt(m, 10);
  if (!month || !day) return null;
  return { month, day, leap: /bis|leap/i.test(m) || m.includes('bis') };
}

/** Days from today (local noon) until the next lunar occurrence, or null if unsupported. */
export function daysUntil(f: Festival): number | null {
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  if (!lunarOf(base)) return null;
  for (let i = 0; i <= 400; i++) {
    const l = lunarOf(new Date(base.getTime() + i * DAY));
    if (l && !l.leap && l.day === f.lunarDay && (f.monthly || l.month === f.lunarMonth)) return i;
    if (f.lunarDay === 30 && !f.monthly && l && !l.leap && l.day === 29 && l.month === f.lunarMonth) {
      const next = lunarOf(new Date(base.getTime() + (i + 1) * DAY));
      if (next && next.day === 1) return i;
    }
  }
  return null;
}
const lunarText = (f: Festival) => (f.monthly ? `${f.lunarDay} âm lịch hằng tháng` : `${f.lunarDay}/${f.lunarMonth} âm lịch`);

export function openFestivals(ctx: Pick<MenuCtx, 'socket' | 'profile' | 'toast'>) {
  openCustomPanel('Lễ hội', (body) => {
    type Ack = { ok: boolean; coins?: number; merit?: number; error?: string };
    let coins = ctx.profile()?.coins ?? 0;
    const coinLine = h('div', { class: 'hint' });
    const syncCoins = (a: Ack) => {
      if (typeof a.coins === 'number') coins = a.coins;
      coinLine.textContent = `Bạn đang có ${coins} xu`;
    };
    syncCoins({ ok: true });
    const wishInput = h('input', {
      type: 'text',
      placeholder: 'Viết một điều ước ngắn…',
      style: 'width:100%;box-sizing:border-box;padding:8px 10px;margin:6px 0 10px;border-radius:8px;border:1px solid #cbb892;font:inherit',
    }) as HTMLInputElement;
    wishInput.maxLength = SKY_LANTERN_WISH_MAX;
    const btn = (label: string, run: () => void) => {
      const b = h('button', { class: 'gold', style: 'display:block;width:100%;margin:6px 0' }, label) as HTMLButtonElement;
      b.onclick = run;
      return b;
    };
    const launch = (kind: 'small' | 'large' | 'dragon') => {
      ctx.socket.emit('firework:launch', kind, (a: Ack) => {
        if (!a.ok) { ctx.toast(a.error ?? 'Không bắn được pháo hoa'); return; }
        audio.play('firework');
        syncCoins(a);
        ctx.toast('Pháo hoa đã nổ trên sân chùa');
      });
    };
    body.append(h('div', { class: 'fest' },
      h('div', { class: 'fest-h' }, h('b', {}, 'Đèn trời & pháo hoa')),
      h('div', { class: 'hint' }, 'Đẹp nhất buổi tối (phòng An Lạc). Chỉ thả/bắn ngoài sân.'),
      coinLine,
      wishInput,
      btn(`Thả đèn trời — ${SKY_LANTERN_COST} xu`, () => {
        const wish = wishInput.value.trim();
        if (!wish) { ctx.toast('Hãy viết một điều ước ngắn'); return; }
        ctx.socket.emit('sky:release', wish, (a: Ack) => {
          if (!a.ok) { ctx.toast(a.error ?? 'Không thả được đèn trời'); return; }
          audio.play('lantern');
          syncCoins(a);
          wishInput.value = '';
          ctx.toast(a.merit ? `Đèn trời đã bay lên · +${a.merit} công đức` : 'Đèn trời đã bay lên');
        });
      }),
      btn(`Pháo hoa nhỏ — ${FIREWORKS.small.cost.toLocaleString('vi-VN')} xu (3 quả)`, () => launch('small')),
      btn(`Pháo hoa lớn — ${FIREWORKS.large.cost.toLocaleString('vi-VN')} xu (6 quả)`, () => launch('large')),
      btn(`Pháo hoa rồng phượng — ${FIREWORKS.dragon.cost.toLocaleString('vi-VN')} xu (10 quả, 1 phút, báo cả chùa)`, () => launch('dragon')),
    ));
    const rows = FESTIVALS.map((f) => ({ f, d: daysUntil(f) }));
    rows.sort((a, b) => (a.d ?? 999) - (b.d ?? 999));
    body.append(h('p', { class: 'hint' }, 'Các ngày lễ Phật giáo theo âm lịch. Số ngày được tính từ hôm nay.'));
    for (const { f, d } of rows) {
      const tag = d === null ? '' : d === 0 ? 'Hôm nay' : `còn ${d} ngày`;
      body.append(h('div', { class: 'fest' + (d === 0 ? ' today' : '') },
        h('div', { class: 'fest-h' }, h('b', {}, f.name), tag ? h('span', { class: 'badge' }, tag) : ''),
        h('div', { class: 'fest-d' }, lunarText(f)),
        h('div', { class: 'hint', style: 'margin:4px 0 0' }, f.desc)));
    }
  });
}
