import { ITEM_BY_ID, STAT_MILESTONES, type MilestoneEvent, type StatKey, type StatsAck, type StatsState } from '../../shared/game';
import { h } from '../panels';
import type { MenuCtx } from '../menu';

let cache: StatsState | null = null;
let onChange: (() => void) | null = null;

export function initStats(ctx: MenuCtx) {
  ctx.socket.on('stats', (s: StatsState) => { cache = s; onChange?.(); });
  ctx.socket.on('milestone', (m: MilestoneEvent) => {
    ctx.toast(`Đạt mốc thành tựu: ${m.title} (+${m.coins} xu${m.item ? ' + quà' : ''})`);
  });
}

interface Row { stat: StatKey; label: string; icon: string; value: (s: StatsState) => number }
const ROWS: Row[] = [
  { stat: 'bows', label: 'Lạy Phật', icon: '🙏', value: (s) => s.stats.bows },
  { stat: 'chants', label: 'Tụng kinh', icon: '📿', value: (s) => s.stats.chants },
  { stat: 'lanterns', label: 'Thả đèn', icon: '🏮', value: (s) => s.stats.lanterns },
  { stat: 'meditate_sec', label: 'Ngồi thiền', icon: '🧘', value: (s) => s.stats.meditateSec },
  { stat: 'beads_rounds', label: 'Vòng hạt', icon: '📿', value: (s) => s.stats.beadsRounds },
];

const nf = new Intl.NumberFormat('vi-VN');
const fmtTotal = (stat: StatKey, v: number) => (stat === 'meditate_sec' ? `${nf.format(Math.floor(v / 60))} phút` : nf.format(v));
const fmtThreshold = (stat: StatKey, t: number) => (stat === 'meditate_sec' ? `${Math.round(t / 60)}p` : nf.format(t));

function renderRows(box: HTMLElement) {
  box.replaceChildren();
  const st: StatsState = cache ?? { stats: { bows: 0, chants: 0, lanterns: 0, meditateSec: 0, beadsRounds: 0 }, claimed: [] };
  for (const row of ROWS) {
    const ms = STAT_MILESTONES.filter((m) => m.stat === row.stat).sort((a, b) => a.threshold - b.threshold);
    const v = row.value(st);
    const nextIdx = ms.findIndex((m) => !st.claimed.includes(m.id) && v < m.threshold);
    const next = nextIdx >= 0 ? ms[nextIdx] : undefined;
    const prev = nextIdx > 0 ? ms[nextIdx - 1].threshold : 0;
    const chips = ms.map((m, i) => {
      const done = st.claimed.includes(m.id);
      const cls = done ? 'stchip done' : i === nextIdx ? 'stchip next' : 'stchip';
      const gift = `${m.coins} xu${m.item ? ` + ${ITEM_BY_ID[m.item]?.name ?? m.item}` : ''}`;
      return h('span', { class: cls, title: `${m.title}: ${gift}` }, done ? `✓ ${fmtThreshold(row.stat, m.threshold)}` : fmtThreshold(row.stat, m.threshold));
    });
    const bar = next
      ? h('progress', { class: 'stbar', max: next.threshold - prev, value: Math.max(0, Math.min(next.threshold - prev, v - prev)) })
      : h('progress', { class: 'stbar', max: 1, value: 1 });
    const note = next
      ? `Mốc tiếp theo: ${next.title} (${fmtTotal(row.stat, next.threshold)})`
      : 'Đã đạt tất cả các mốc';
    box.append(h('div', { class: 'strow' },
      h('div', { class: 'sthead' }, h('span', {}, `${row.icon} ${row.label}`), h('b', {}, fmtTotal(row.stat, v))),
      bar,
      h('div', { class: 'stnote' }, note),
      h('div', { class: 'stchips' }, ...chips)));
  }
}

/** Mục "Thành tựu tích lũy" cho panel Cấp độ: vẽ từ cache ngay, rồi làm mới bằng stats:get. */
export function renderStatsSection(ctx: MenuCtx, body: HTMLElement) {
  const box = h('div', { class: 'stbox' });
  body.append(h('h4', { class: 'sttitle' }, 'Thành tựu tích lũy'), box);
  renderRows(box);
  const redraw = () => { if (box.isConnected) renderRows(box); else if (onChange === redraw) onChange = null; };
  onChange = redraw;
  ctx.socket.emit('stats:get', (r: StatsAck) => {
    if (r?.ok && r.state) { cache = r.state; redraw(); }
  });
}
