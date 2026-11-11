/*
 * Bottom feature menu + all feature panels.
 *
 * main.ts must, after login (once):
 *   import { initMenu } from './menu';
 *   initMenu({ socket, profile: () => profile, quests: () => quests, room: () => roomId, switchRoom, toast, logout,
 *              myPos: () => me ? { x: me.x, z: me.z } : null,
 *              players: () => [...others.values()].map(...)  (including yourself is optional),
 *              goTo: (x, z) => walkTo(x, z), changeLook: (name, outfit, color) => ..., chatLog: () => chatMessages });
 * - It takes over the children of #menu (rebuilds them). The elements #questDot and #logoutBtn are kept
 *   so existing main.ts code that touches them keeps working; remove main.ts' own click binding of
 *   '#menu [data-panel]' / '#logoutBtn' (they are replaced by this module).
 * - Settings live in ./settings (settings / onSettings / setSetting). This module applies sound+volume to ./audio;
 *   main.ts should honour quality / showCouplets / showNames / showBubbles / showTips.
 * - Server events used: minigame:reward, feedback:send (plus the existing shop/rank/rooms ones).
 */
import type { Socket } from 'socket.io-client';
import type { QuestState } from '../shared/game';
import type { ChatMessage, Outfit, Profile } from '../shared/types';
import { audio } from './audio';
import { hydrateIcons, iconSvg } from './icons';
import { openPanel, type PanelKind } from './panels';
import { onSettings } from './settings';
import { openGames } from './features/games';
import { openFestivals } from './features/festivals';
import { openLevels } from './features/levels';
import { openMap } from './features/map';
import { openFortune } from './features/fortune';
import { checkinPending, initCheckin, openCheckin } from './features/checkin';
import { initMail, mailPending, openMail } from './features/mail';
import { initBoost } from './features/boost';
import { initStats } from './features/stats';
import { initSpin, spinPending } from './features/spin';
import { newsUnread, openCommunity, openDonate, openFacebook, openFeedback, openGuide, openNews } from './features/misc';
import { openCharacter } from './features/character';
import { openSettings } from './features/settings';
import { initInstallCapture, openInstall } from './features/install';
import './menu.css';

export interface MenuCtx {
  socket: Socket;
  profile(): Profile | null;
  quests(): QuestState[];
  room(): string;
  switchRoom(id: string): void;
  toast(t: string): void;
  logout(): void;
  myPos(): { x: number; z: number } | null;
  players(): { id: string; name: string; x: number; z: number; level?: number }[];
  goTo(x: number, z: number): void;
  changeLook(name: string, outfit: Outfit, color: string): void;
  chatLog(): ChatMessage[];
}

const COLLAPSE_KEY = 'co:menuCollapsed';
let started = false;
initInstallCapture(); // capture beforeinstallprompt as early as possible

export function initMenu(ctx: MenuCtx): void {
  const bar = document.getElementById('menu');
  if (!bar || started) return;
  started = true;

  const legacy = (k: PanelKind) => () => openPanel(k, ctx);
  type Def = { id: string; icon: string; label: string; run?: () => void };
  const defs: Def[] = [
    { id: 'games', icon: 'game', label: 'Trò chơi', run: () => openGames(ctx) },
    { id: 'fest', icon: 'festival', label: 'Lễ hội', run: openFestivals },
    { id: 'checkin', icon: 'checkin', label: 'Điểm danh', run: () => openCheckin(ctx) },
    { id: 'mail', icon: 'mail', label: 'Hòm thư', run: () => openMail(ctx) },
    { id: 'news', icon: 'news', label: 'Có gì mới', run: () => { openNews(); refreshDots(); } },
    { id: 'quests', icon: 'scroll', label: 'Nhiệm vụ', run: legacy('quests') },
    { id: 'bag', icon: 'bag', label: 'Túi đồ', run: legacy('bag') },
    { id: 'shop', icon: 'shop', label: 'Cửa hàng', run: legacy('shop') },
    { id: 'community', icon: 'community', label: 'Cộng đồng', run: () => openCommunity(ctx) },
    { id: 'level', icon: 'level', label: 'Cấp độ', run: () => openLevels(ctx) },
    { id: 'rank', icon: 'trophy', label: 'Xếp hạng', run: legacy('rank') },
    { id: 'rooms', icon: 'temple', label: 'Chọn chùa', run: legacy('rooms') },
    { id: 'map', icon: 'map', label: 'Bản đồ chùa', run: () => openMap(ctx) },
    { id: 'fortune', icon: 'fortune', label: 'Xin xăm', run: () => openFortune(ctx) },
    { id: 'guide', icon: 'guide', label: 'Cách chơi', run: openGuide },
    { id: 'feedback', icon: 'feedback', label: 'Góp ý & ủng hộ', run: () => openFeedback(ctx) },
    { id: 'donate', icon: 'donate', label: 'Ủng hộ', run: openDonate },
    { id: 'fb', icon: 'facebook', label: 'Facebook', run: () => openFacebook(ctx) },
    { id: 'char', icon: 'user', label: 'Nhân vật', run: () => openCharacter(ctx) },
    { id: 'settings', icon: 'settings', label: 'Cài đặt', run: () => openSettings(ctx) },
    { id: 'logout', icon: 'exit', label: 'Thoát', run: () => ctx.logout() },
    { id: 'install', icon: 'install', label: 'Cài vào màn hình', run: openInstall },
  ];

  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Thanh tính năng');
  const scroller = document.createElement('div');
  scroller.className = 'mscroll';
  const toggle = document.createElement('button');
  toggle.className = 'mtoggle';
  toggle.type = 'button';

  const mk = (d: Def) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.menu = d.id;
    b.setAttribute('aria-label', d.label);
    const ic = document.createElement('span');
    ic.className = 'ico';
    ic.innerHTML = iconSvg(d.icon);
    const lb = document.createElement('span');
    lb.className = 'lb';
    lb.textContent = d.label;
    b.append(ic, lb);
    b.onclick = () => { audio.play('click'); d.run?.(); };
    if (d.id === 'quests') { const em = document.createElement('em'); em.id = 'questDot'; em.hidden = true; b.append(em); }
    if (d.id === 'checkin') { const em = document.createElement('em'); em.className = 'dot checkinDot'; em.hidden = true; b.append(em); }
    if (d.id === 'mail') { const em = document.createElement('em'); em.className = 'dot mailDot'; em.hidden = true; b.append(em); }
    if (d.id === 'games') { const em = document.createElement('em'); em.className = 'dot gamesDot'; em.hidden = true; b.append(em); }
    if (d.id === 'news') { const em = document.createElement('em'); em.className = 'dot newsDot'; em.hidden = true; b.append(em); }
    if (d.id === 'logout') b.id = 'logoutBtn';
    return b;
  };
  scroller.append(...defs.map(mk));
  bar.replaceChildren(toggle, scroller);

  const refreshDots = () => {
    const d = bar.querySelector<HTMLElement>('.newsDot');
    if (d) d.hidden = !newsUnread();
    const c = bar.querySelector<HTMLElement>('.checkinDot');
    if (c) c.hidden = !checkinPending();
    const m = bar.querySelector<HTMLElement>('.mailDot');
    if (m) m.hidden = !mailPending();
    const g = bar.querySelector<HTMLElement>('.gamesDot');
    if (g) g.hidden = !spinPending();
  };
  refreshDots();
  initCheckin(ctx, refreshDots);
  initMail(ctx, refreshDots);
  initSpin(ctx, refreshDots);
  initBoost(ctx);
  initStats(ctx);

  const setCollapsed = (c: boolean) => {
    bar.classList.toggle('collapsed', c);
    document.body.classList.toggle('menu-collapsed', c);
    toggle.replaceChildren();
    const ic = document.createElement('span'); ic.className = 'ico'; ic.innerHTML = iconSvg(c ? 'expand' : 'collapse');
    const lb = document.createElement('span'); lb.className = 'lb'; lb.textContent = c ? 'Mở rộng' : 'Thu gọn';
    toggle.append(ic, lb);
    toggle.setAttribute('aria-label', c ? 'Mở rộng' : 'Thu gọn');
    toggle.setAttribute('aria-expanded', String(!c));
    localStorage.setItem(COLLAPSE_KEY, c ? '1' : '0');
  };
  toggle.onclick = () => { audio.play('click'); setCollapsed(!bar.classList.contains('collapsed')); };
  setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');

  // vertical wheel scrolls the bar sideways on desktop
  scroller.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { scroller.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });

  // settings -> audio
  onSettings((s, changed) => {
    audio.setVolume(s.volume);
    if (changed === 'sound') audio.setMuted(!s.sound);
  });

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
    if (document.readyState === 'complete') navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  hydrateIcons(bar);
}
