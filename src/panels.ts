import type { Socket } from 'socket.io-client';
import { ITEMS, ITEM_BY_ID, SHOP_CATEGORIES, SUTRAS, type QuestState, type RankRow, type RoomInfo, type ShopCategory, type ShopItem } from '../shared/game';
import { levelOf, meritForLevel, type Profile } from '../shared/types';
import { iconSvg } from './icons';
import { audio } from './audio';

export interface PanelCtx {
  socket: Socket;
  profile: () => Profile | null;
  quests: () => QuestState[];
  room: () => string;
  switchRoom: (id: string) => void;
  toast: (t: string) => void;
}
export type PanelKind = 'shop' | 'bag' | 'quests' | 'rank' | 'rooms' | 'chant' | 'teacher';
type Cur = PanelKind | 'custom';

type Child = Node | string;
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, any> = {}, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) (el as any)[k] = v;
    else if (v !== undefined && v !== false) el.setAttribute(k, String(v));
  }
  for (const c of kids) el.append(c); // strings become text nodes, never HTML
  return el;
}

const ITEM_ICON: Record<string, string> = {
  huong_tram: 'incense', hoa_sen: 'lotus', den_hoa_dang: 'lantern', mu_sen: 'lotus', hao_quang: 'halo', khan_do: 'scarf',
};
/** Icon tile from the static, trusted SVG table (never user input). */
function ic(itemId: string): HTMLElement {
  const d = document.createElement('div');
  d.className = 'ic';
  d.innerHTML = iconSvg(ITEM_ICON[itemId] ?? 'lotus');
  return d;
}
function price(n: number): HTMLElement {
  const s = document.createElement('span');
  s.className = 'price';
  s.innerHTML = iconSvg('coin');
  s.append(String(n));
  return s;
}

export const TITLES: Record<PanelKind, string> = { shop: 'Cửa hàng', bag: 'Túi đồ', quests: 'Nhiệm vụ', rank: 'Xếp hạng công đức', rooms: 'Chọn chùa', chant: 'Tụng kinh', teacher: 'Sư Thầy' };
let current: Cur | null = null;
let cleanup: (() => void) | null = null;
let ctxRef: PanelCtx | null = null;

export const panelOpen = () => current !== null;
export function closePanel() {
  current = null;
  const c = cleanup;
  cleanup = null;
  c?.();
  (document.getElementById('panel') as HTMLElement).hidden = true;
}
/** Opens the shared overlay with arbitrary content. `build` may return a cleanup fn (run on close). */
export function openCustomPanel(title: string, build: (body: HTMLElement) => void | (() => void)) {
  closePanel();
  current = 'custom';
  (document.getElementById('panel') as HTMLElement).hidden = false;
  document.getElementById('panelTitle')!.textContent = title;
  const body = document.getElementById('panelBody')!;
  body.replaceChildren();
  body.scrollTop = 0;
  cleanup = build(body) ?? null;
}
export function openPanel(kind: PanelKind, ctx: PanelCtx) {
  closePanel();
  ctxRef = ctx;
  current = kind;
  (document.getElementById('panel') as HTMLElement).hidden = false;
  document.getElementById('panelTitle')!.textContent = TITLES[kind];
  document.getElementById('panelBody')!.scrollTop = 0;
  render();
}
/** Re-render when live data (profile/quests) changes while a panel is open. */
export function refreshPanel() { if (current && current !== 'custom' && current !== 'rank' && current !== 'rooms' && current !== 'chant' && current !== 'teacher') render(); }

function render() {
  const body = document.getElementById('panelBody')!;
  const ctx = ctxRef!;
  if (current === 'custom') return;
  body.replaceChildren();
  if (current === 'shop') renderShop(body, ctx);
  else if (current === 'bag') renderBag(body, ctx);
  else if (current === 'quests') renderQuests(body, ctx);
  else if (current === 'rank') renderRank(body, ctx);
  else if (current === 'rooms') renderRooms(body, ctx);
  else if (current === 'chant') renderChant(body, ctx);
  else if (current === 'teacher') renderTeacher(body);
}

// ------------------------------------------------------------------ cửa hàng (tab category)
let shopTab: ShopCategory = 'le_vat';

function shopTile(it: ShopItem, ctx: PanelCtx, p: Profile | null) {
  const lvl = levelOf(p?.merit ?? 0);
  const owned = (p?.inventory[it.id] ?? 0) > 0 && it.kind === 'accessory';
  const locked = !!it.minLevel && lvl < it.minLevel;
  const can = !locked && (p?.coins ?? 0) >= it.price && !owned;
  const buy = (n: number) => ctx.socket.emit(n > 1 ? 'shop:buy5' : 'shop:buy', it.id, (r: { ok: boolean; error?: string }) => ctx.toast(r.ok ? `Đã mua ${it.name}${n > 1 ? ` ×${n}` : ''}` : r.error ?? 'Lỗi'));
  const btn = h('button', { disabled: !can || undefined, onclick: () => buy(1) },
    locked ? `🔒 Cần cấp ${it.minLevel}` : owned ? 'Đã sở hữu' : price(it.price));
  const tile = h('div', { class: 'tile' + (locked ? ' locked' : '') },
    ic(it.id), h('b', {}, it.name), h('small', {}, it.desc), btn);
  if (it.kind === 'consumable' && !locked && !owned) {
    tile.append(h('button', { class: 'ghost', disabled: (p?.coins ?? 0) < it.price * 5 || undefined, onclick: () => buy(5) }, `Mua 5 · ${it.price * 5}`));
  }
  return tile;
}

function renderShop(body: HTMLElement, ctx: PanelCtx) {
  const p = ctx.profile();
  body.append(h('p', { class: 'hint' }, `Bạn có ${p?.coins ?? 0} xu · cấp ${levelOf(p?.merit ?? 0)}. Nhận xu khi hành lễ và hoàn thành nhiệm vụ.`));
  const tabs = h('div', { class: 'rtabs' });
  const grid = h('div', { class: 'grid' });
  const draw = () => {
    tabs.replaceChildren(...SHOP_CATEGORIES.map((c) => h('button', {
      class: shopTab === c.id ? 'on' : '',
      onclick: () => { shopTab = c.id; draw(); },
    }, c.label)));
    grid.replaceChildren(...ITEMS.filter((it) => it.category === shopTab).map((it) => shopTile(it, ctx, p)));
  };
  draw();
  body.append(tabs, grid);
}

function renderBag(body: HTMLElement, ctx: PanelCtx) {
  const p = ctx.profile();
  const inv = p?.inventory ?? {};
  const ids = Object.keys(inv).filter((k) => ITEM_BY_ID[k] && inv[k] > 0);
  if (!ids.length) { body.append(h('p', { class: 'hint' }, 'Túi đồ trống. Ghé cửa hàng để mua vật phẩm.')); return; }
  const grid = h('div', { class: 'grid' });
  for (const id of ids) {
    const it = ITEM_BY_ID[id];
    const tile = h('div', { class: 'tile' }, ic(it.id), h('b', {}, it.kind === 'consumable' ? `${it.name} ×${inv[id]}` : it.name), h('small', {}, it.desc));
    if (it.kind === 'accessory') {
      const worn = p?.accessory === id;
      tile.append(h('button', { onclick: () => ctx.socket.emit('inv:equip', worn ? null : id) }, worn ? 'Tháo ra' : 'Đeo'));
    } else tile.append(h('small', {}, 'Tự dùng khi hành lễ'));
    grid.append(tile);
  }
  body.append(grid);
}

// ------------------------------------------------------------------ nhiệm vụ (ngày + tuần + cấp)
function questRows(list: QuestState[], ctx: PanelCtx) {
  return list.map((q) => {
    const done = q.progress >= q.target;
    return h('div', { class: 'qrow' },
      h('div', { class: 'qi' }, h('b', {}, q.label), h('div', {}, `${q.progress}/${q.target} · +${q.coins} xu · +${q.merit} công đức`),
        h('progress', { max: q.target, value: q.progress })),
      h('button', { disabled: !done || q.claimed || undefined, onclick: () => ctx.socket.emit('quest:claim', q.id) }, q.claimed ? 'Đã nhận' : 'Nhận'));
  });
}

function renderQuests(body: HTMLElement, ctx: PanelCtx) {
  const all = ctx.quests();
  const daily = all.filter((q) => !q.id.startsWith('w_'));
  const weekly = all.filter((q) => q.id.startsWith('w_'));

  // thanh tiến độ cấp
  const p = ctx.profile();
  const merit = p?.merit ?? 0;
  const lv = levelOf(merit);
  const lvBase = meritForLevel(lv), lvNext = meritForLevel(lv + 1);
  const pct = Math.max(0, Math.min(100, ((merit - lvBase) / Math.max(1, lvNext - lvBase)) * 100));
  body.append(h('div', { class: 'qrow' },
    h('div', { class: 'qi' },
      h('b', {}, `Cấp ${lv}`),
      h('div', {}, `Còn ${Math.max(0, lvNext - merit)} công đức nữa lên cấp ${lv + 1}`),
      h('progress', { max: 100, value: pct.toFixed(0) }))),
    h('small', { class: 'hint', style: 'margin:0' }, 'Lên cấp nhận thưởng xu + công đức và mở khóa vật phẩm mới.'));

  body.append(h('h3', { style: 'margin:8px 0 4px' }, 'Mỗi ngày'), h('p', { class: 'hint', style: 'margin:0 0 6px' }, 'Làm mới mỗi ngày (giờ UTC).'));
  body.append(...questRows(daily, ctx));
  body.append(h('h3', { style: 'margin:14px 0 4px' }, 'Mỗi tuần'), h('p', { class: 'hint', style: 'margin:0 0 6px' }, 'Làm mới vào thứ Hai hằng tuần — thưởng lớn hơn.'));
  body.append(...questRows(weekly, ctx));
}

// ------------------------------------------------------------------ tụng kinh
function renderChant(body: HTMLElement, ctx: PanelCtx) {
  let sutra: (typeof SUTRAS)[number] | null = null;
  let rep = 0;
  let line = 0;
  let timer: number | null = null;
  let mohTimer: number | null = null;
  let bpm = 60;
  let mohOn = true;

  const stop = () => {
    if (timer !== null) { clearInterval(timer); timer = null; }
    if (mohTimer !== null) { clearInterval(mohTimer); mohTimer = null; }
  };
  cleanup = stop;

  const reader = h('div', { class: 'chant-reader', style: 'max-height:50vh;overflow:auto;padding:8px;border-radius:10px;background:rgba(0,0,0,.25)' });
  const head = h('div', {});
  const controls = h('div', { class: 'row', style: 'gap:8px;margin-top:10px;flex-wrap:wrap' });
  const drawReader = () => {
    if (!sutra) return;
    reader.replaceChildren(...sutra.lines.map((ln, i) => h('p', {
      style: `margin:4px 0;padding:2px 6px;border-radius:6px;${i === line ? 'background:rgba(255,214,90,.28);color:#ffe9a8;font-weight:600' : i < line ? 'opacity:.55' : 'opacity:.85'}`,
    }, ln)));
    const cur = reader.children[line] as HTMLElement | undefined;
    cur?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const finishRep = () => {
    rep++;
    ctx.toast(`Hoàn thành biến thứ ${rep} — được cộng công đức`);
    ctx.socket.emit('sutra:done', sutra!.id, (r: { ok: boolean; merit?: number; error?: string }) => {
      if (r.ok) ctx.toast(`Công đức +${r.merit}`);
      else if (r.error) ctx.toast(r.error);
    });
    if (rep >= sutra!.reps) { stop(); drawHome(); }
  };
  const start = () => {
    line = 0;
    drawReader();
    timer = window.setInterval(() => {
      line++;
      if (line >= sutra!.lines.length) { finishRep(); line = sutra!.lines.length - 1; }
      drawReader();
    }, 4200);
    audio.unlock();
    restartMoh();
    drawControls();
  };
  const restartMoh = () => {
    if (mohTimer !== null) clearInterval(mohTimer);
    mohTimer = mohOn ? window.setInterval(() => audio.play('moh'), Math.round(60000 / bpm)) : null;
  };
  const drawControls = () => {
    const lbl = h('span', {}, `${bpm}/phút`);
    controls.replaceChildren(
      h('button', { onclick: () => { mohOn = !mohOn; restartMoh(); drawControls(); } }, mohOn ? '🔇 Tắt mõ' : '🥁 Bật mõ'),
      h('label', { style: 'display:flex;align-items:center;gap:6px' }, 'Nhịp',
        h('input', { type: 'range', min: '40', max: '120', value: String(bpm), oninput: (e: Event) => { bpm = +(e.target as HTMLInputElement).value; restartMoh(); lbl.textContent = `${bpm}/phút`; } }),
        lbl),
      h('button', { class: 'ghost', onclick: () => { stop(); drawHome(); } }, 'Dừng lại'));
  };
  const drawHome = () => {
    head.replaceChildren(h('p', { class: 'hint' }, 'Chọn bài kinh, bấm Bắt đầu để đọc theo nhịp. Mỗi biến hoàn thành được cộng công đức.'));
    reader.replaceChildren(...SUTRAS.map((s) => h('div', { class: 'qrow' },
      h('div', { class: 'qi' }, h('b', {}, s.name), h('div', {}, `${s.lines.length} câu · ${s.reps} biến`)),
      h('button', { onclick: () => { sutra = s; rep = 0; start(); } }, 'Bắt đầu'))));
    controls.replaceChildren();
  };
  drawHome();
  body.append(head, reader, controls);
}

function renderRank(body: HTMLElement, ctx: PanelCtx) {
  let data: { weekly: RankRow[]; all: RankRow[] } | null = null;
  let tab: 'weekly' | 'all' = 'weekly';
  const tabs = h('div', { class: 'rtabs' });
  const list = h('div', {}, h('p', { class: 'hint' }, 'Đang tải...'));
  const draw = () => {
    tabs.replaceChildren(
      h('button', { class: tab === 'weekly' ? 'on' : '', onclick: () => { tab = 'weekly'; draw(); } }, 'Tuần này'),
      h('button', { class: tab === 'all' ? 'on' : '', onclick: () => { tab = 'all'; draw(); } }, 'Mọi thời đại'));
    if (!data) return;
    const rows = data[tab];
    const t = h('table', { class: 'rank' });
    rows.forEach((r, i) => t.append(h('tr', {}, h('td', {}, String(i + 1)), h('td', {}, r.name), h('td', {}, `Cấp ${r.level}`), h('td', {}, String(r.merit)))));
    list.replaceChildren(rows.length ? t : h('p', { class: 'hint' }, 'Chưa có dữ liệu.'));
  };
  body.append(tabs, list);
  draw();
  ctx.socket.emit('rank:get', (r: { weekly: RankRow[]; all: RankRow[] }) => { data = r; if (current === 'rank') draw(); });
}

function renderRooms(body: HTMLElement, ctx: PanelCtx) {
  const list = h('div', {}, h('p', { class: 'hint' }, 'Đang tải...'));
  body.append(list);
  ctx.socket.emit('rooms:list', (rooms: RoomInfo[]) => {
    if (current !== 'rooms') return;
    list.replaceChildren(...rooms.map((r) => h('div', { class: 'room' + (r.id === ctx.room() ? ' cur' : '') },
      h('div', {}, h('b', {}, r.name), h('div', { class: 'hint', style: 'margin:0' }, `${r.online}/${r.capacity} người`)),
      h('button', { disabled: r.id === ctx.room() || r.online >= r.capacity || undefined, onclick: () => { closePanel(); ctx.switchRoom(r.id); } },
        r.id === ctx.room() ? 'Đang ở đây' : r.online >= r.capacity ? 'Đầy' : 'Vào chùa'))));
  });
}

export { levelOf };

// ------------------------------------------------------------------ sư thầy (NPC)
const TEACHER_SECTIONS: { title: string; lines: string[] }[] = [
  { title: 'Chào mừng bạn', lines: [
    'A Di Đà Phật. Chùa Online là nơi bạn có thể dừng chân giữa ngày bận rộn, đi dạo, lễ Phật và trò chuyện cùng mọi người.',
    'Bạn hãy bắt đầu từ việc nhỏ: đi qua cầu cong vào sân chùa, rồi thắp một nén hương trước chánh điện. Nhiệm vụ đầu tiên trong mục Nhiệm vụ sẽ được ghi nhận ngay.',
  ] },
  { title: 'Cách tu tập', lines: [
    'Thắp hương: đứng gần bàn thờ rồi bấm "Thắp hương". Ba nén hương tượng trưng cho giới, định, tuệ.',
    'Lạy Phật: bấm "Lạy Phật" hoặc chạm vào bồ đoàn để ngồi xuống rồi lạy. Lạy chậm, giữ tâm lắng.',
    'Tụng kinh: mở "Tụng kinh", chọn một bài và đọc theo từng câu được sáng lên. Mỗi biến hoàn thành đều được cộng công đức.',
    'Thiền: bấm "Thiền" để ngồi yên. Nhiều người cùng ngồi một lúc sẽ nhận thêm công đức.',
  ] },
  { title: 'Công đức là gì', lines: [
    'Công đức ghi lại sự đều đặn trong việc tu tập của bạn, không dùng để so bì. Mỗi lần thắp hương, lạy, tụng hay thiền đều góp phần.',
    'Đủ công đức thì bạn lên cấp, nhận xu thưởng để mua lễ vật, hoa và vật phẩm trong Cửa hàng. Cấp càng cao thì cần càng nhiều công đức hơn cấp trước.',
    'Hãy đến đều đặn mỗi ngày một chút, như vậy tốt hơn một lần làm thật nhiều.',
  ] },
];
function renderTeacher(body: HTMLElement) {
  body.replaceChildren(...TEACHER_SECTIONS.map((s) => h('section', { class: 'tile', style: 'display:block;margin-bottom:10px' },
    h('h3', { style: 'margin:0 0 6px' }, s.title),
    ...s.lines.map((ln) => h('p', { style: 'margin:4px 0;line-height:1.55;font-size:14px' }, ln)))));
}
