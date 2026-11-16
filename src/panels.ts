import type { Socket } from 'socket.io-client';
import { ITEMS, ITEM_BY_ID, SHOP_CATEGORIES, SUTRAS, type QuestState, type RankRow, type RoomInfo, type ShopCategory, type ShopItem } from '../shared/game';
import { levelOf, meritForLevel, type Profile } from '../shared/types';
import { iconSvg } from './icons';
import { audio } from './audio';
import { DIALOGUES } from './data/dialogues';

export interface PanelCtx {
  socket: Socket;
  profile: () => Profile | null;
  quests: () => QuestState[];
  room: () => string;
  switchRoom: (id: string) => void;
  toast: (t: string) => void;
  guideTo: (qid: string) => void;
  onDonated?: () => void;
  teleport?: (x: number, z: number) => void;
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
  ao_dai_hong_sen: 'scarf', ao_dai_vang_nhat: 'scarf', ba_ba_nau: 'scarf', ba_ba_tim: 'scarf', ao_lam: 'scarf',
  non_la: 'lotus', khan_dong: 'scarf',
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

export function openDonatePanel(ctx: PanelCtx) {
  openCustomPanel('Đóng góp công đức', (body) => {
    const p = ctx.profile();
    const have = p?.coins ?? 0;
    const amountInput = h('input', {
      type: 'number',
      min: '1',
      step: '1',
      placeholder: 'Nhập số xu',
      class: 'donate-input',
    }) as HTMLInputElement;
    const quickRow = h('div', { class: 'qrow' });
    for (const v of [10, 50, 100, 500]) {
      quickRow.appendChild(h('button', {
        onclick: () => { amountInput.value = String(v); },
      }, String(v)));
    }
    const submitBtn = h('button', {}, 'Đóng góp') as HTMLButtonElement;
    submitBtn.onclick = () => {
      const n = Number(amountInput.value);
      if (!Number.isInteger(n) || n < 1) { ctx.toast('Số xu không hợp lệ'); return; }
      if (n > (ctx.profile()?.coins ?? 0)) { ctx.toast('Không đủ xu'); return; }
      submitBtn.disabled = true;
      ctx.socket.emit('donate', n, (r: { ok: boolean; coins?: number; merit?: number; broadcast?: boolean; error?: string }) => {
        if (!r.ok) {
          ctx.toast(r.error ?? 'Lỗi');
          submitBtn.disabled = false;
          return;
        }
        ctx.toast(`Đã đóng góp ${n} xu · +${n} công đức${r.broadcast ? ' · Mọi người trong chùa đều thấy' : ''}`);
        closePanel();
        ctx.onDonated?.();
      });
    };
    const laterBtn = h('button', { onclick: () => closePanel() }, 'Để sau');
    body.append(
      h('p', { class: 'hint' }, `Bạn có ${have.toLocaleString('vi-VN')} xu.`),
      amountInput,
      quickRow,
      h('p', { class: 'hint' }, '1 xu = 1 công đức · Đóng góp từ 50 xu trở lên sẽ được thông báo cho mọi người trong chùa'),
      h('div', { class: 'qrow' }, submitBtn, laterBtn),
    );
  });
}

export function openDonorsPanel(ctx: PanelCtx) {
  openCustomPanel('Bảng vinh danh', (body) => {
    body.appendChild(h('p', { class: 'hint' }, 'Đang tải...'));
    ctx.socket.emit('donors:get', (rows: { name: string; coins: number; merit: number }[]) => {
      body.replaceChildren();
      if (!rows || rows.length === 0) {
        body.appendChild(h('p', { class: 'hint' }, 'Chưa có ai đóng góp. Bạn sẽ là người đầu tiên?'));
      } else {
        const tbody = h('tbody', {});
        rows.forEach((r, i) => {
          tbody.appendChild(h('tr', {},
            h('td', {}, String(i + 1)),
            h('td', {}, r.name),
            h('td', {}, r.coins.toLocaleString('vi-VN')),
            h('td', {}, r.merit.toLocaleString('vi-VN')),
          ));
        });
        body.appendChild(h('table', { class: 'donor-table' },
          h('thead', {}, h('tr', {},
            h('th', {}, 'Hạng'),
            h('th', {}, 'Tên'),
            h('th', {}, 'Đã đóng góp (xu)'),
            h('th', {}, 'Công đức'),
          )),
          tbody,
        ));
      }
      body.appendChild(h('div', { class: 'qrow' }, h('button', {
        onclick: () => { closePanel(); openDonatePanel(ctx); },
      }, 'Đóng góp ngay')));
    });
  });
}

interface AdminPlayerRow {
  id: number;
  username: string | null;
  name: string;
  merit: number;
  coins: number;
  is_admin: number;
  is_banned: number;
}

type AdminTab = 'players' | 'broadcast' | 'teleport' | 'stats';

const ADMIN_GRANT_MAX = 100000;
const ADMIN_SELF_GRANT_MAX = 1000000;

export function openAdminPanel(ctx: PanelCtx) {
  openCustomPanel('Quản trị', (body) => {
    let tab: AdminTab = 'players';
    let query = '';
    let alive = true;

    const tabsEl = h('div', { class: 'rtabs' });
    const content = h('div', {});
    body.append(tabsEl, content);

    const tabs: { id: AdminTab; label: string }[] = [
      { id: 'players', label: 'Người chơi' },
      { id: 'broadcast', label: 'Thông báo' },
      { id: 'teleport', label: 'Dịch chuyển' },
      { id: 'stats', label: 'Thống kê' },
    ];

    const drawTabs = () => {
      tabsEl.replaceChildren();
      for (const t of tabs) {
        tabsEl.appendChild(h('button', {
          class: t.id === tab ? 'on' : '',
          onclick: () => { tab = t.id; draw(); },
        }, t.label));
      }
    };

    const parseAmount = (raw: string): number | null => {
      const s = raw.trim();
      if (s === '') return 0;
      const n = Number(s);
      if (!Number.isInteger(n) || n < 0 || n > ADMIN_GRANT_MAX) return null;
      return n;
    };
    const parseSelfAmount = (raw: string): number | null => {
      const s = raw.trim();
      if (s === '') return 0;
      const n = Number(s);
      if (!Number.isInteger(n) || n < 0 || n > ADMIN_SELF_GRANT_MAX) return null;
      return n;
    };

    const drawPlayers = () => {
      content.replaceChildren();
      const me = ctx.profile();
      const meritVal = h('b', {}, (me?.merit ?? 0).toLocaleString('vi-VN'));
      const coinsVal = h('b', {}, (me?.coins ?? 0).toLocaleString('vi-VN'));
      const selfCoinsIn = h('input', {
        type: 'number', min: '0', step: '1', placeholder: 'Xu', style: 'width:64px',
      }) as HTMLInputElement;
      const selfMeritIn = h('input', {
        type: 'number', min: '0', step: '1', placeholder: 'Công đức', style: 'width:64px',
      }) as HTMLInputElement;
      const selfBtn = h('button', {}, 'Thêm cho bản thân') as HTMLButtonElement;
      selfBtn.onclick = () => {
        const coins = parseSelfAmount(selfCoinsIn.value);
        const merit = parseSelfAmount(selfMeritIn.value);
        if (coins === null || merit === null) { ctx.toast('Số không hợp lệ (0 - 1.000.000)'); return; }
        if (coins === 0 && merit === 0) { ctx.toast('Nhập số xu hoặc công đức cần thêm'); return; }
        selfBtn.disabled = true;
        ctx.socket.emit('admin:selfgrant', { merit, coins }, (r: { ok: boolean; merit?: number; coins?: number; error?: string }) => {
          selfBtn.disabled = false;
          if (!r?.ok) { ctx.toast(r?.error ?? 'Lỗi'); return; }
          ctx.toast(`Đã thêm ${coins} xu, ${merit} công đức cho bản thân`);
          meritVal.textContent = (r.merit ?? 0).toLocaleString('vi-VN');
          coinsVal.textContent = (r.coins ?? 0).toLocaleString('vi-VN');
          selfCoinsIn.value = '';
          selfMeritIn.value = '';
          if (alive && tab === 'players') load();
        });
      };
      content.append(
        h('div', { class: 'row' }, h('span', {}, 'Công đức của bạn'), meritVal),
        h('div', { class: 'row' }, h('span', {}, 'Xu của bạn'), coinsVal),
        h('div', { class: 'qrow' }, selfCoinsIn, selfMeritIn, selfBtn),
        h('p', { class: 'hint' }, 'Chỉ quản trị viên thấy mục này.'),
      );
      const searchInput = h('input', {
        type: 'text',
        placeholder: 'Tìm tên đăng nhập hoặc pháp danh',
        class: 'donate-input',
      }) as HTMLInputElement;
      searchInput.value = query;
      const searchBtn = h('button', {}, 'Tìm') as HTMLButtonElement;
      const listBox = h('div', {});

      const load = () => {
        query = searchInput.value;
        listBox.replaceChildren(h('p', { class: 'hint' }, 'Đang tải...'));
        ctx.socket.emit('admin:list', query, (r: { ok: boolean; rows?: AdminPlayerRow[]; error?: string }) => {
          if (!alive || tab !== 'players') return;
          if (!r.ok) {
            ctx.toast(r.error ?? 'Lỗi');
            listBox.replaceChildren();
            return;
          }
          renderRows(r.rows ?? []);
        });
      };

      const renderRows = (rows: AdminPlayerRow[]) => {
        listBox.replaceChildren();
        if (rows.length === 0) {
          listBox.appendChild(h('p', { class: 'hint' }, 'Không tìm thấy người chơi nào.'));
          return;
        }
        const tbody = h('tbody', {});
        for (const row of rows) {
          const label = row.username ? `${row.name} (${row.username})` : row.name;
          const status = [row.is_admin === 1 ? 'Quản trị' : '', row.is_banned === 1 ? 'Bị khóa' : '']
            .filter((x) => x !== '').join(' · ');

          const coinsIn = h('input', {
            type: 'number', min: '0', step: '1', placeholder: 'Xu', style: 'width:64px',
          }) as HTMLInputElement;
          const meritIn = h('input', {
            type: 'number', min: '0', step: '1', placeholder: 'Công đức', style: 'width:64px',
          }) as HTMLInputElement;
          const grantBtn = h('button', {}, 'Tặng') as HTMLButtonElement;
          grantBtn.onclick = () => {
            const coins = parseAmount(coinsIn.value);
            const merit = parseAmount(meritIn.value);
            if (coins === null || merit === null) {
              ctx.toast(`Số không hợp lệ (0 - ${ADMIN_GRANT_MAX.toLocaleString('vi-VN')})`);
              return;
            }
            if (coins === 0 && merit === 0) { ctx.toast('Nhập số xu hoặc công đức cần tặng'); return; }
            grantBtn.disabled = true;
            ctx.socket.emit('admin:grant', { userId: row.id, merit, coins }, (r: { ok: boolean; merit?: number; coins?: number; error?: string }) => {
              grantBtn.disabled = false;
              if (!r.ok) { ctx.toast(r.error ?? 'Lỗi'); return; }
              ctx.toast(`Đã tặng ${label}: +${coins} xu, +${merit} công đức`);
              if (alive && tab === 'players') load();
            });
          };

          const banned = row.is_banned === 1;
          const banBtn = h('button', {}, banned ? 'Mở khóa' : 'Khóa') as HTMLButtonElement;
          banBtn.onclick = () => {
            if (!banned && !confirm(`Khóa tài khoản ${label}?`)) return;
            banBtn.disabled = true;
            ctx.socket.emit('admin:ban', { userId: row.id, banned: !banned }, (r: { ok: boolean; banned?: boolean; error?: string }) => {
              banBtn.disabled = false;
              if (!r.ok) { ctx.toast(r.error ?? 'Lỗi'); return; }
              ctx.toast(banned ? `Đã mở khóa ${label}` : `Đã khóa ${label}`);
              if (alive && tab === 'players') load();
            });
          };

          tbody.appendChild(h('tr', {},
            h('td', {}, label),
            h('td', {}, row.merit.toLocaleString('vi-VN')),
            h('td', {}, row.coins.toLocaleString('vi-VN')),
            h('td', {}, status),
            h('td', {}, h('div', { class: 'qrow' }, coinsIn, meritIn, grantBtn, banBtn)),
          ));
        }
        listBox.appendChild(h('table', { class: 'donor-table' },
          h('thead', {}, h('tr', {},
            h('th', {}, 'Tên'),
            h('th', {}, 'Công đức'),
            h('th', {}, 'Xu'),
            h('th', {}, 'Trạng thái'),
            h('th', {}, 'Thao tác'),
          )),
          tbody,
        ));
      };

      searchBtn.onclick = () => load();
      searchInput.onkeydown = (e: KeyboardEvent) => { if (e.key === 'Enter') load(); };
      content.append(h('div', { class: 'qrow' }, searchInput, searchBtn), listBox);
      load();
    };

    const drawBroadcast = () => {
      content.replaceChildren();
      const text = h('textarea', {
        maxlength: '200',
        rows: '4',
        placeholder: 'Tin gửi cho mọi người đang online...',
        class: 'donate-input',
      }) as HTMLTextAreaElement;
      const sendBtn = h('button', {}, 'Gửi cho mọi người') as HTMLButtonElement;
      sendBtn.onclick = () => {
        const t = text.value.trim();
        if (t.length < 1 || t.length > 200) { ctx.toast('Nội dung phải từ 1 đến 200 ký tự'); return; }
        sendBtn.disabled = true;
        ctx.socket.emit('admin:broadcast', { text: t }, (r: { ok: boolean; error?: string }) => {
          sendBtn.disabled = false;
          if (!r.ok) { ctx.toast(r.error ?? 'Lỗi'); return; }
          ctx.toast('Đã gửi thông báo');
          text.value = '';
        });
      };
      content.append(
        h('p', { class: 'hint' }, 'Tin sẽ hiện trên marquee và chat hệ thống của mọi người đang online.'),
        text,
        h('div', { class: 'qrow' }, sendBtn),
      );
    };

    const TELEPORT_DEST: { label: string; x: number; z: number }[] = [
      { label: 'Sân chùa (quảng trường)', x: 0, z: 6 },
      { label: 'Chính Điện (trước thềm)', x: 0, z: -20 },
      { label: 'Điện Tam Thế (chân cầu thang)', x: 0, z: -50 },
      { label: 'Bảo Tháp (phía nam)', x: -30, z: -31 },
      { label: 'Cầu cong giữa hồ', x: 0, z: 22 },
      { label: 'Sân Quan Âm', x: 28, z: 14 },
      { label: 'Sân Phật (phía Tây)', x: -28, z: 14 },
      { label: 'Điện Mẫu', x: 39, z: 10 },
      { label: 'Chợ phiên', x: 47, z: 50 },
      { label: 'Vườn Phóng Sinh (bến thả)', x: 30, z: -31 },
      { label: 'Thiền đường', x: -47, z: -27 },
      { label: 'Vườn Thiền', x: -34, z: -26 },
    ];

    const drawTeleport = () => {
      content.replaceChildren();
      for (const d of TELEPORT_DEST) {
        const btn = h('button', { class: 'btn' }, 'Tới ngay');
        btn.addEventListener('click', () => {
          if (!ctx.teleport) {
            ctx.toast('Không thể dịch chuyển ở đây');
            return;
          }
          ctx.teleport(d.x, d.z);
          closePanel();
          ctx.toast('Đã dịch chuyển tới ' + d.label);
        });
        content.append(h('div', { class: 'row' }, h('span', {}, d.label), btn));
      }
    };

    const drawStats = () => {
      content.replaceChildren(h('div', {}, 'Đang tải...'));
      ctx.socket.emit('admin:stats', (res: {
        ok: boolean;
        online?: number;
        totalPlayers?: number;
        newToday?: number;
        totalDonated?: number;
        error?: string;
      }) => {
        if (!alive || tab !== 'stats') return;
        if (!res || !res.ok) {
          ctx.toast((res && res.error) || 'Không tải được thống kê');
          content.replaceChildren();
          return;
        }
        const fmt = (n?: number) => (n ?? 0).toLocaleString('vi-VN');
        const row = (label: string, value: string) =>
          h('div', { class: 'row' }, h('span', {}, label), h('b', {}, value));
        const logBox = h('div', {}, 'Đang tải nhật ký...');
        content.replaceChildren(
          row('Đang online', fmt(res.online)),
          row('Tổng người chơi', fmt(res.totalPlayers)),
          row('Người mới hôm nay', fmt(res.newToday)),
          row('Tổng quyên góp', fmt(res.totalDonated) + ' xu'),
          h('b', {}, 'Nhật ký quản trị'),
          logBox,
        );
        ctx.socket.emit('admin:log', (logRes: { ok: boolean; rows?: { id: number; adminName: string; targetName: string; merit: number; coins: number; createdAt: number }[]; error?: string }) => {
          if (!alive || tab !== 'stats') return;
          if (!logRes?.ok) {
            logBox.replaceChildren(h('p', { class: 'hint' }, 'Không tải được nhật ký'));
            return;
          }
          const rows = logRes.rows ?? [];
          if (rows.length === 0) {
            logBox.replaceChildren(h('p', { class: 'hint' }, 'Chưa có lần tự tặng nào.'));
            return;
          }
          logBox.replaceChildren(...rows.map((r) => {
            const parts: string[] = [];
            if (r.coins > 0) parts.push(`+${r.coins} xu`);
            if (r.merit > 0) parts.push(`+${r.merit} công đức`);
            return h('div', { class: 'row' },
              h('span', {}, `${r.adminName} tự tặng ${parts.join(', ')} cho bản thân`),
              h('span', {}, new Date(r.createdAt).toLocaleString('vi-VN')),
            );
          }));
        });
      });
    };

    const draw = () => {
      drawTabs();
      switch (tab) {
        case 'players': drawPlayers(); break;
        case 'broadcast': drawBroadcast(); break;
        case 'teleport': drawTeleport(); break;
        case 'stats': drawStats(); break;
      }
    };

    draw();
    return () => { alive = false; };
  });
}

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

// Luật 01:25: hàng đã bán ở quầy chợ thì shop trung tâm không bán nữa (chỉ ẩn UI, def vẫn giữ trong ITEMS).
const MARKET_ONLY: ReadonlySet<string> = new Set([
  'pho_chay', 'com_chay', 'tra_da', 'chim_phong_sinh', 'ca_phong_sinh', 'thuc_an_chim', 'thuc_an_cho_meo',
]);

function renderShop(body: HTMLElement, ctx: PanelCtx) {
  const p = ctx.profile();
  body.append(h('p', { class: 'hint' }, `Bạn có ${p?.coins ?? 0} xu · cấp ${levelOf(p?.merit ?? 0)}. Nhận xu khi hành lễ và hoàn thành nhiệm vụ.`));
  const tabs = h('div', { class: 'rtabs' });
  const grid = h('div', { class: 'grid' });
  const draw = () => {
    const visible = SHOP_CATEGORIES.filter((c) => ITEMS.some((it) => it.category === c.id && !MARKET_ONLY.has(it.id)));
    if (visible.length > 0 && !visible.some((c) => c.id === shopTab)) shopTab = visible[0].id;
    tabs.replaceChildren(...visible.map((c) => h('button', {
      class: shopTab === c.id ? 'on' : '',
      onclick: () => { shopTab = c.id; draw(); },
    }, c.label)));
    grid.replaceChildren(...ITEMS.filter((it) => it.category === shopTab && !MARKET_ONLY.has(it.id)).map((it) => shopTile(it, ctx, p)));
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
    } else tile.append(h('small', {}, (it.id === 'chim_phong_sinh' || it.id === 'ca_phong_sinh') ? 'Mang tới bến thả ở hồ phóng sinh để thả' : 'Tự dùng khi hành lễ'));
    grid.append(tile);
  }
  body.append(grid);
}

// ------------------------------------------------------------------ nhiệm vụ (ngày + tuần + cấp)
function questRows(list: QuestState[], ctx: PanelCtx) {
  return list.map((q) => {
    const done = q.progress >= q.target;
    const isNpc = q.id.startsWith('nq_') || q.id.startsWith('c_') || q.id.startsWith('dq_');
    const giverName = isNpc && q.giver ? (DIALOGUES[q.giver]?.name ?? '') : '';
    const info = h('div', { class: 'qi' }, h('b', {}, q.label),
      h('div', {}, `${q.progress}/${q.target} · +${q.coins} xu · +${q.merit} công đức`),
      h('progress', { max: q.target, value: q.progress }));
    if (isNpc && giverName) info.append(h('div', { class: 'hint', style: 'margin:0' }, `Người giao: ${giverName}`));
    if (q.id.startsWith('dq_')) info.append(h('div', { class: 'hint', style: 'margin:0' }, 'Việc mới lúc 0h'));
    // Có ack để lỗi từ server (vd: đứng quá xa người giao) hiện qua toast
    const row = h('div', { class: 'qrow' }, info,
      h('button', { disabled: !done || q.claimed || undefined, onclick: () => ctx.socket.emit('quest:claim', q.id, (r: { ok?: boolean; error?: string }) => { if (r && r.ok === false) ctx.toast(r.error ?? 'Lỗi'); }) }, q.claimed ? 'Đã nhận' : 'Nhận'));
    if (isNpc && !q.claimed) {
      row.append(h('button', { class: 'ghost', onclick: () => { closePanel(); ctx.guideTo(q.id); } }, 'Dẫn đường'));
    }
    return row;
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

  body.append(h('h3', { style: 'margin:8px 0 4px' }, 'Mỗi ngày'), h('p', { class: 'hint', style: 'margin:0 0 6px' }, 'Làm mới lúc 7h sáng mỗi ngày.'));
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
