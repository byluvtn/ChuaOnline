import type { Socket } from 'socket.io-client';
import { ITEMS, ITEM_BY_ID, type QuestState, type RankRow, type RoomInfo } from '../shared/game';
import { levelOf, type Profile } from '../shared/types';
import { iconSvg } from './icons';

export interface PanelCtx {
  socket: Socket;
  profile: () => Profile | null;
  quests: () => QuestState[];
  room: () => string;
  switchRoom: (id: string) => void;
  toast: (t: string) => void;
}
export type PanelKind = 'shop' | 'bag' | 'quests' | 'rank' | 'rooms';
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

export const TITLES: Record<PanelKind, string> = { shop: 'Cửa hàng', bag: 'Túi đồ', quests: 'Nhiệm vụ hằng ngày', rank: 'Xếp hạng công đức', rooms: 'Chọn chùa' };
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
export function refreshPanel() { if (current && current !== 'custom' && current !== 'rank' && current !== 'rooms') render(); }

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
}

function renderShop(body: HTMLElement, ctx: PanelCtx) {
  const p = ctx.profile();
  body.append(h('p', { class: 'hint' }, `Bạn có ${p?.coins ?? 0} xu. Nhận xu khi hành lễ và hoàn thành nhiệm vụ.`));
  const grid = h('div', { class: 'grid' });
  for (const it of ITEMS) {
    const owned = (p?.inventory[it.id] ?? 0) > 0 && it.kind === 'accessory';
    const can = (p?.coins ?? 0) >= it.price && !owned;
    grid.append(h('div', { class: 'tile' },
      ic(it.id), h('b', {}, it.name), h('small', {}, it.desc),
      h('button', {
        disabled: !can || undefined,
        onclick: () => ctx.socket.emit('shop:buy', it.id, (r: { ok: boolean; error?: string }) => ctx.toast(r.ok ? `Đã mua ${it.name}` : r.error ?? 'Lỗi')),
      }, owned ? 'Đã sở hữu' : price(it.price))));
  }
  body.append(grid);
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

function renderQuests(body: HTMLElement, ctx: PanelCtx) {
  body.append(h('p', { class: 'hint' }, 'Nhiệm vụ làm mới mỗi ngày (giờ UTC).'));
  for (const q of ctx.quests()) {
    const done = q.progress >= q.target;
    body.append(h('div', { class: 'qrow' },
      h('div', { class: 'qi' }, h('b', {}, q.label), h('div', {}, `${q.progress}/${q.target} · +${q.coins} xu · +${q.merit} công đức`),
        h('progress', { max: q.target, value: q.progress })),
      h('button', { disabled: !done || q.claimed || undefined, onclick: () => ctx.socket.emit('quest:claim', q.id) }, q.claimed ? 'Đã nhận' : 'Nhận')));
  }
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
