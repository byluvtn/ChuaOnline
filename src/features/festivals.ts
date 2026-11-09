import { h, openCustomPanel } from '../panels';
import { FESTIVALS, type Festival } from '../data/festivals';

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
  }
  return null;
}
const lunarText = (f: Festival) => (f.monthly ? `${f.lunarDay} âm lịch hằng tháng` : `${f.lunarDay}/${f.lunarMonth} âm lịch`);

export function openFestivals() {
  openCustomPanel('Lễ hội', (body) => {
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
