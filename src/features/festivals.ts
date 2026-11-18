import { h, openCustomPanel, closePanel } from '../panels';
import { FESTIVALS, type Festival } from '../data/festivals';
import type { MenuCtx } from '../menu';
import { SKY_LANTERN_COST, FIREWORKS, SKY_LANTERN_WISH_MAX } from '../../shared/game';
import { audio } from '../audio';
import { ictParts, solarToLunar, dayKeyICT } from '../../shared/time';

/** Bảng âm lịch 402 ngày (hôm nay + 400 ngày + 1 ngày dự phòng cho fallback ngày 30),
 * tính một lần theo ngày ICT rồi tra — thay cho 400 lần formatToParts mỗi lễ. */
interface LunarRow { day: number; month: number; leap: boolean }
let lunarTable: { key: string; rows: LunarRow[] } | null = null;
function getLunarTable(): LunarRow[] {
  const key = dayKeyICT();
  if (lunarTable && lunarTable.key === key) return lunarTable.rows;
  const p = ictParts(new Date());
  const rows: LunarRow[] = [];
  for (let i = 0; i <= 401; i++) {
    const t = new Date(Date.UTC(p.year, p.month - 1, p.day + i));
    const l = solarToLunar(t.getUTCDate(), t.getUTCMonth() + 1, t.getUTCFullYear());
    rows.push({ day: l.day, month: l.month, leap: l.leap });
  }
  lunarTable = { key, rows };
  return rows;
}

/** Days from today (ICT) until the next lunar occurrence, or null if not found within 400 days. */
export function daysUntil(f: Festival): number | null {
  const rows = getLunarTable();
  for (let i = 0; i <= 400; i++) {
    const l = rows[i];
    if (!l.leap && l.day === f.lunarDay && (f.monthly || l.month === f.lunarMonth)) return i;
    if (f.lunarDay === 30 && !f.monthly && !l.leap && l.day === 29 && l.month === f.lunarMonth) {
      const next = rows[i + 1];
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
      audio.unlock();
      ctx.socket.emit('firework:launch', kind, (a: Ack) => {
        if (!a.ok) { ctx.toast(a.error ?? 'Không bắn được pháo hoa'); return; }
        syncCoins(a);
        ctx.toast('Đã đặt hộp pháo hoa ngoài sân');
        closePanel();
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
          closePanel();
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
