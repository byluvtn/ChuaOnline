import type { Socket } from 'socket.io-client';
import { h, openCustomPanel, closePanel } from '../panels';
import type { MenuCtx } from '../menu';
import { ITEM_BY_ID } from '../../shared/game';
import { BOND_BY_ID } from '../../shared/bonds';
import {
  BODHI_GROVE, BODHI_SLOTS, BODHI_STAGE_NAMES, BODHI_STAGE_WATERS, BOND_CHAPTER_POINTS, BOND_GIFT_ITEMS, BOND_GIFTS_PER_DAY, GROUP_NEED_SEC, RETREAT_THEMES, bodhiSlotPos,
  type BodhiAck, type BodhiFeed, type BodhiTree, type BondAck, type BondState, type FestivalStateMsg, type GroupState, type JournalAck, type RetreatAck, type RetreatState,
} from '../../shared/rituals';
import { DIALOGUES } from '../data/dialogues';
import { SEASON_NAME, WEATHER_NAME, seasonNow, weatherAt } from '../../shared/seasons';

type Ctx = Pick<MenuCtx, 'socket' | 'profile' | 'toast' | 'myPos' | 'goTo'>;

let festival: FestivalStateMsg | null = null;
let group: GroupState | null = null;
let groupAura = new Set<string>();
let trees: BodhiTree[] = [];
let myPid = 0;
let onTrees: (() => void) | null = null;
let onGroup: (() => void) | null = null;
let onFestival: (() => void) | null = null;

export const getFestivalState = () => festival;
export const getGroupState = () => group;
export const getBodhiTrees = () => trees;
export const getMyBodhi = () => trees.find((t) => t.pid === myPid);
export const hasGroupAura = (id: string) => !!group && Date.now() < group.endsAt && groupAura.has(id);

export function initRituals(ctx: Pick<MenuCtx, 'socket' | 'toast'>, refresh: () => void, setTrees: (t: BodhiTree[], me: number) => void) {
  const s = ctx.socket;
  s.on('festival', (m: FestivalStateMsg) => { festival = m; onFestival?.(); refresh(); });
  const receiveGroup = (m: GroupState) => { group = m; groupAura = new Set(m.auraIds); onGroup?.(); refresh(); };
  s.on('group:state', receiveGroup);
  s.on('disconnect', () => { group = null; groupAura.clear(); onGroup?.(); refresh(); });
  s.on('group:done', (m: { merit: number; coins: number; label: string }) =>
    ctx.toast(`Khóa thiền ${m.label} hoàn thành: +${m.merit} công đức, +${m.coins} xu và hào quang chung`));
  s.on('bell:ritual', (m: { merit: number; coins: number }) =>
    ctx.toast(`Lễ thỉnh chuông: bạn có mặt lúc chuông điểm, +${m.merit} công đức, +${m.coins} xu`));
  s.on('bodhi:trees', (f: BodhiFeed) => { trees = f.trees; myPid = f.me; setTrees(f.trees, f.me); onTrees?.(); });
  s.emit('festival:get', (m: FestivalStateMsg) => { festival = m; onFestival?.(); refresh(); });
  s.emit('group:get', receiveGroup);
  s.emit('bodhi:list', (r: BodhiAck) => {
    if (!r.ok || !r.trees) return;
    trees = r.trees;
    if (r.me) myPid = r.me;
    setTrees(r.trees, myPid);
    onTrees?.();
  });
}

export const festivalPending = () => !!festival?.key && !festival.claimed;
export const groupOpen = () => !!group?.active && !group.claimed;

const fmtMin = (sec: number) => `${Math.floor(sec / 60)} phút`;
const emit = <T,>(s: Socket, ev: string, ...a: unknown[]) => new Promise<T>((res) => {
  s.timeout(8000).emit(ev, ...a, (err: Error | null, data: T) => res(err ? { ok: false, error: 'Mất kết nối. Hãy thử lại.' } as T : data));
});

function tabs(items: { id: string; label: string }[], cur: string, set: (id: string) => void) {
  return h('div', { class: 'rtabs' }, ...items.map((t) => h('button', { class: t.id === cur ? 'on' : '', onclick: () => set(t.id) }, t.label)));
}

let tab = 'fest';
export function openJourney(ctx: Ctx, start?: string) {
  if (start) tab = start;
  openCustomPanel('Hành trình tu tập', (body) => {
    const views: Record<string, (c: Ctx, b: HTMLElement) => void> = {
      fest: renderFest, group: renderGroup, bodhi: renderBodhi, journal: renderJournal, bond: renderBond, retreat: renderRetreat,
    };
    const draw = () => {
      onTrees = null; onGroup = null; onFestival = null;
      const box = h('div', {});
      body.replaceChildren(tabs([
        { id: 'fest', label: 'Lễ hội' }, { id: 'group', label: 'Thiền nhóm' }, { id: 'bodhi', label: 'Cây bồ đề' },
        { id: 'journal', label: 'Nhật ký' }, { id: 'bond', label: 'Thân thiết' }, { id: 'retreat', label: 'Tịnh thất' },
      ], tab, (id) => { tab = id; draw(); }), box);
      views[tab](ctx, box);
    };
    draw();
    return () => { onTrees = null; onGroup = null; onFestival = null; };
  });
}

function renderFest(ctx: Ctx, box: HTMLElement) {
  const draw = () => {
    box.replaceChildren();
    box.append(h('p', { class: 'hint' }, `Mùa ${SEASON_NAME[seasonNow()]} · ${WEATHER_NAME[weatherAt()]}`));
    const f = festival;
    if (!f?.key) {
      box.append(h('p', { class: 'hint' }, 'Hôm nay chưa có lễ hội âm lịch. Các lễ hội sắp tới: Tết Nguyên Đán (29 tháng Chạp đến mùng 5), Phật Đản (14-16/4), Vu Lan (14-16/7), Trung Thu (14-16/8). Khi đến ngày, chùa trang hoàng đèn lồng và có quà cho người có mặt.'));
      return;
    }
    const btn = h('button', {
      class: 'gold', style: 'width:100%', disabled: f.claimed || undefined,
      onclick: () => ctx.socket.emit('festival:claim', (r: { ok: boolean; error?: string; merit?: number; coins?: number }) => {
        ctx.toast(r.ok ? `Nhận quà ${f.name}: +${r.merit} công đức, +${r.coins} xu` : r.error ?? 'Lỗi');
      }),
    }, f.claimed ? 'Đã nhận quà dịp này' : `Nhận quà: +${f.gift?.merit} công đức, +${f.gift?.coins} xu`);
    box.append(h('div', { class: 'fest today' },
      h('div', { class: 'fest-h' }, h('b', {}, f.name), h('span', { class: 'badge' }, 'Đang diễn ra')),
      h('div', { class: 'hint', style: 'margin:6px 0 10px' }, f.desc), btn));
  };
  onFestival = draw;
  draw();
}

function renderGroup(_ctx: Ctx, box: HTMLElement) {
  const draw = () => {
    box.replaceChildren();
    const g = group;
    box.append(h('p', { class: 'hint' }, `Thiền nhóm mở lúc 06:00, 12:00 và 20:00 giờ Việt Nam, kéo dài 15 phút. Ngồi thiền đủ ${fmtMin(GROUP_NEED_SEC)} cùng ít nhất một người khác trong chùa để nhận công đức và hào quang chung.`));
    if (!g) return;
    if (g.active) {
      const left = Math.max(0, Math.ceil((g.endsAt - Date.now()) / 1000));
      box.append(h('div', { class: 'fest today' },
        h('div', { class: 'fest-h' }, h('b', {}, `Khóa ${g.label} đang mở`), h('span', { class: 'badge' }, `${g.sitting} người đang ngồi`)),
        h('div', { class: 'fest-d' }, g.claimed ? 'Bạn đã hoàn thành khóa này.' : `Bạn đã ngồi ${fmtMin(g.mySec)} / ${fmtMin(g.need)}`),
        h('progress', { max: g.need, value: Math.min(g.need, g.mySec), style: 'width:100%;height:8px;margin-top:8px' }),
        h('div', { class: 'hint' }, `Còn ${Math.floor(left / 60)} phút ${left % 60} giây`)));
    } else {
      const wait = Math.max(0, Math.ceil((g.nextAt - Date.now()) / 60000));
      box.append(h('div', { class: 'fest' }, h('b', {}, `Khóa kế tiếp: ${g.nextLabel}`),
        h('div', { class: 'fest-d' }, `Còn khoảng ${wait >= 60 ? `${Math.floor(wait / 60)} giờ ${wait % 60} phút` : `${wait} phút`}`)));
    }
  };
  onGroup = draw;
  draw();
}

function renderBodhi(ctx: Ctx, box: HTMLElement) {
  const draw = () => {
    box.replaceChildren();
    const mine = trees.find((t) => t.pid === myPid);
    box.append(h('p', { class: 'hint' }, `Mỗi người có một cây bồ đề trong vườn phía Tây (${trees.length}/${BODHI_SLOTS} chỗ). Tưới mỗi ngày một lần, cây lớn dần và mọi người đều thấy. Bỏ quên 3 ngày cây héo, quá 21 ngày cây biến mất.`));
    const toGrove = () => { const p = mine ? bodhiSlotPos(mine.slot) : BODHI_GROVE; ctx.goTo(p.x, p.z); closePanel(); };
    box.append(h('button', { onclick: toGrove }, mine ? 'Đến cây của tôi' : 'Đến vườn bồ đề'));
    if (!mine) {
      box.append(h('button', { class: 'gold', style: 'width:100%', onclick: async () => {
        const r = await emit<BodhiAck>(ctx.socket, 'bodhi:plant');
        if (r.ok) { ctx.toast('Bạn đã gieo một cây bồ đề'); return; }
        ctx.toast(r.error ?? 'Lỗi');
        if (r.error?.includes('tới vườn')) toGrove();
      } }, 'Gieo cây bồ đề'));
      return;
    }
    const next = BODHI_STAGE_WATERS[mine.stage];
    box.append(h('div', { class: 'fest today' },
      h('div', { class: 'fest-h' }, h('b', {}, BODHI_STAGE_NAMES[mine.stage]), h('span', { class: 'badge' }, mine.wilted ? 'Đang héo' : `${mine.waters} lần tưới`)),
      h('div', { class: 'fest-d' }, next ? `Cần ${next - mine.waters} lần tưới nữa để lớn thêm` : 'Cây đã đạt giai đoạn cao nhất'),
      h('button', { class: 'gold', style: 'margin-top:8px;width:100%', disabled: mine.wateredToday || undefined, onclick: async () => {
        const r = await emit<BodhiAck>(ctx.socket, 'bodhi:water');
        ctx.toast(r.ok ? `Đã tưới cây, +${r.merit ?? 0} công đức` : r.error ?? 'Lỗi');
        if (!r.ok && r.error?.includes('đứng gần')) toGrove();
      } }, mine.wateredToday ? 'Hôm nay đã tưới' : 'Tưới cây hôm nay')));
    box.append(h('h4', { class: 'sttitle' }, 'Các cây lớn nhất trong vườn'));
    for (const t of [...trees].sort((a, b) => b.waters - a.waters).slice(0, 12)) {
      box.append(h('div', { class: 'fest' }, h('div', { class: 'fest-h' }, h('b', {}, t.name), h('span', { class: 'badge' }, BODHI_STAGE_NAMES[t.stage]))));
    }
  };
  onTrees = draw;
  draw();
}

async function renderJournal(ctx: Ctx, box: HTMLElement) {
  const r = await emit<JournalAck>(ctx.socket, 'journal:get');
  box.replaceChildren();
  if (!r.ok || !r.state) { box.append(h('p', { class: 'hint' }, r.error ?? 'Không tải được nhật ký')); return; }
  const s = r.state;
  box.append(h('div', { class: 'fest' },
    h('div', { class: 'fest-h' }, h('b', {}, `Chuỗi ngày: ${s.streak}`), h('span', { class: 'badge' }, `Dài nhất: ${s.best}`)),
    h('div', { class: 'fest-d' }, `Tổng ${s.totalDays} ngày vào chùa · ${Math.floor(s.totalMedSec / 60)} phút thiền`)));
  const max = Math.max(600, ...s.days.map((d) => d.medSec));
  const cols = s.days.map((d) => {
    const hh = Math.max(3, Math.round((d.medSec / max) * 80));
    return h('div', { title: `${d.day}: ${Math.floor(d.medSec / 60)} phút thiền`, style: 'flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:2px' },
      h('div', { style: `width:70%;height:${hh}px;border-radius:3px;background:${d.medSec ? 'linear-gradient(#f2c14e,#c9962a)' : '#e0d2ae'}` }),
      h('div', { style: `width:6px;height:6px;border-radius:50%;background:${d.visited ? '#4f9a48' : '#d9cfb4'}` }));
  });
  box.append(h('h4', { class: 'sttitle' }, '30 ngày gần nhất'),
    h('div', { style: 'display:flex;align-items:flex-end;gap:2px;height:100px;padding:8px;background:#f1e8d0;border-radius:12px' }, ...cols),
    h('p', { class: 'hint' }, 'Cột vàng là số phút thiền mỗi ngày, chấm xanh là ngày có vào chùa.'));
}

async function renderBond(ctx: Ctx, box: HTMLElement) {
  const draw = (bonds: BondState[]) => {
    box.replaceChildren(h('p', { class: 'hint' }, `Đến gần từng người để tâm sự (mỗi ngày một lần) hoặc tặng lễ vật (tối đa ${BOND_GIFTS_PER_DAY} lần mỗi ngày) để tăng thân thiết và nghe truyện riêng.`));
    for (const b of bonds) {
      const def = BOND_BY_ID[b.npc];
      const name = DIALOGUES[b.npc]?.name ?? b.npc;
      const ch = def.chapters[b.done];
      const need = BOND_CHAPTER_POINTS[b.done];
      const card = h('div', { class: 'fest' },
        h('div', { class: 'fest-h' }, h('b', {}, name), h('span', { class: 'badge' }, `${b.points} điểm · chương ${b.done}/3`)));
      if (!ch) card.append(h('div', { class: 'fest-d' }, 'Bạn đã nghe hết truyện của người này.'));
      else {
        const open = b.points >= need;
        card.append(h('div', { class: 'hint', style: 'margin:4px 0' }, open ? ch.story : `Cần ${need} điểm thân thiết để nghe chương "${ch.title}".`));
        if (open) card.append(h('div', { class: 'fest-d' }, `Cần mang: ${ch.ask.qty} ${ITEM_BY_ID[ch.ask.item]?.name ?? ch.ask.item}`));
        const act = async (ev: string, ...args: unknown[]) => {
          const r = await emit<BondAck>(ctx.socket, ev, b.npc, ...args);
          ctx.toast(r.ok ? r.msg ?? 'Xong' : r.error ?? 'Lỗi');
          if (r.bonds) draw(r.bonds);
        };
        const row = h('div', { class: 'qrow', style: 'flex-wrap:wrap' });
        row.append(h('button', { disabled: b.talkedToday || undefined, onclick: () => act('bond:talk') }, b.talkedToday ? 'Đã tâm sự' : 'Tâm sự'));
        for (const it of BOND_GIFT_ITEMS.filter((id) => (ctx.profile()?.inventory[id] ?? 0) > 0)) {
          row.append(h('button', { disabled: b.giftsToday >= BOND_GIFTS_PER_DAY || undefined, onclick: () => act('bond:gift', it) }, `Tặng ${ITEM_BY_ID[it]?.name ?? it}`));
        }
        if (open) row.append(h('button', { class: 'gold', onclick: () => act('bond:chapter') }, 'Hoàn thành chương'));
        card.append(row);
      }
      box.append(card);
    }
  };
  const r = await emit<BondAck>(ctx.socket, 'bond:list');
  if (r.ok && r.bonds) draw(r.bonds); else box.append(h('p', { class: 'hint' }, r.error ?? 'Lỗi'));
}

export function renderRetreatRoom(state: RetreatState, wrap: HTMLElement) {
  const th = RETREAT_THEMES[state.theme] ?? RETREAT_THEMES[0];
  wrap.replaceChildren();
  wrap.style.cssText = `position:relative;height:200px;border-radius:12px;overflow:hidden;background:${th.wall};border:1px solid #cbb892`;
  wrap.append(h('div', { style: `position:absolute;left:0;right:0;bottom:0;height:58px;background:${th.floor}` }));
  const spots = [[8, 40], [27, 46], [46, 40], [65, 48], [84, 38], [18, 12], [38, 14], [58, 10], [78, 16], [92, 50], [3, 52], [50, 56]];
  state.placed.forEach((id, i) => {
    const [x, y] = spots[i % spots.length];
    wrap.append(h('div', { title: ITEM_BY_ID[id]?.name ?? id, style: `position:absolute;left:${x}%;bottom:${y}px;font-size:34px;transform:translateX(-50%)` }, ITEM_BY_ID[id]?.icon ?? '❖'));
  });
}

async function renderRetreat(ctx: Ctx, box: HTMLElement) {
  const r = await emit<RetreatAck>(ctx.socket, 'retreat:get', null);
  if (!r.ok || !r.state) { box.append(h('p', { class: 'hint' }, r.error ?? 'Lỗi')); return; }
  const st: RetreatState = { ...r.state, placed: [...r.state.placed] };
  const preview = h('div', {});
  const list = h('div', { class: 'grid' });
  const themeRow = h('div', { class: 'rtabs', style: 'margin-top:10px' });
  const draw = () => {
    renderRetreatRoom(st, preview);
    themeRow.replaceChildren(...RETREAT_THEMES.map((t, i) => h('button', { class: st.theme === i ? 'on' : '', onclick: () => { st.theme = i; draw(); } }, t.name)));
    list.replaceChildren(...st.owned.map((id) => {
      const on = st.placed.includes(id);
      return h('div', { class: 'tile' }, h('div', { style: 'font-size:30px' }, ITEM_BY_ID[id]?.icon ?? '❖'), h('b', {}, ITEM_BY_ID[id]?.name ?? id),
        h('button', { onclick: () => { if (on) st.placed = st.placed.filter((x) => x !== id); else if (st.placed.length < 12) st.placed.push(id); draw(); } }, on ? 'Cất đi' : 'Đặt vào'));
    }));
  };
  box.append(
    h('p', { class: 'hint' }, 'Tịnh thất là căn phòng riêng của bạn. Mua đồ ở Cửa hàng, mục "Đồ tịnh thất", rồi đặt vào đây.'),
    preview, themeRow,
    st.owned.length ? list : h('p', { class: 'hint' }, 'Bạn chưa có đồ trang trí nào. Hãy ghé Cửa hàng.'),
    h('button', { class: 'gold', style: 'width:100%;margin-top:10px', onclick: async () => {
      const res = await emit<RetreatAck>(ctx.socket, 'retreat:save', { theme: st.theme, placed: st.placed });
      ctx.toast(res.ok ? 'Đã lưu tịnh thất' : res.error ?? 'Lỗi');
    } }, 'Lưu tịnh thất'));
  draw();
}
