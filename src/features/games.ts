import { audio } from '../audio';
import { iconSvg } from '../icons';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';

type Reward = { ok: boolean; merit?: number; coins?: number; left?: number; error?: string };

function claim(ctx: MenuCtx, game: 'moh' | 'memory', done: (r: Reward) => void) {
  ctx.socket.emit('minigame:reward', game, (r: Reward) => {
    if (r?.ok) { audio.play('coin'); ctx.toast(`+${r.merit} công đức, +${r.coins} xu`); } else ctx.toast(r?.error ?? 'Không nhận được phần thưởng');
    done(r ?? { ok: false });
  });
}

export function openGames(ctx: MenuCtx) {
  openCustomPanel('Trò chơi', (body) => {
    body.append(
      h('p', { class: 'hint' }, 'Thư giãn với các trò chơi nhỏ. Phần thưởng do máy chủ quyết định, có giới hạn mỗi ngày.'),
      gameCard('Gõ mõ', 'Gõ nhịp mõ theo tiếng niệm. Mỗi 108 nhịp nhận công đức và xu.', 'chant', () => openMoh(ctx)),
      gameCard('Lật thẻ biểu tượng', 'Tìm các cặp biểu tượng nhà Phật. Hoàn thành để nhận xu.', 'lotus', () => openMemory(ctx)),
    );
  });
}
function gameCard(title: string, desc: string, icon: string, go: () => void) {
  const ic = h('div', { class: 'ic' });
  ic.innerHTML = iconSvg(icon);
  return h('div', { class: 'room' }, ic, h('div', { class: 'grow' }, h('b', {}, title), h('div', { class: 'hint', style: 'margin:2px 0 0' }, desc)), h('button', { onclick: go }, 'Chơi'));
}
const backBtn = (ctx: MenuCtx) => h('button', { class: 'ghost back', onclick: () => openGames(ctx) }, '← Trò chơi');

function openMoh(ctx: MenuCtx) {
  openCustomPanel('Gõ mõ', (body) => {
    let taps = 0, total = 0;
    const key = 'co:moh:total';
    total = Number(localStorage.getItem(key) ?? 0) || 0;
    const count = h('b', { class: 'moh-count' }, '0 / 108');
    const sum = h('div', { class: 'hint' }, `Tổng số nhịp đã gõ: ${total}`);
    const prog = h('progress', { max: 108, value: 0 });
    const fish = h('button', { class: 'moh', 'aria-label': 'Gõ mõ' }, h('span', { class: 'moh-face' }, 'mõ'));
    const tap = () => {
      audio.unlock();
      audio.play('moh');
      fish.classList.remove('hit'); void fish.offsetWidth; fish.classList.add('hit');
      taps++; total++;
      if (total % 10 === 0) localStorage.setItem(key, String(total));
      if (taps >= 108) { taps = 0; claim(ctx, 'moh', () => {}); }
      count.textContent = `${taps} / 108`;
      prog.value = taps;
      sum.textContent = `Tổng số nhịp đã gõ: ${total}`;
    };
    fish.onpointerdown = (e) => { e.preventDefault(); tap(); };
    fish.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) tap(); } };
    body.append(backBtn(ctx), h('div', { class: 'moh-wrap' }, fish, count, prog, sum,
      h('p', { class: 'hint' }, 'Mỗi lần đủ 108 nhịp nhận 3 công đức và 2 xu (tối đa 10 lần mỗi ngày, cách nhau ít nhất 20 giây).')));
    return () => localStorage.setItem(key, String(total));
  });
}

const SYMBOLS = [
  { n: 'Hoa sen', i: 'lotus' }, { n: 'Hương', i: 'incense' }, { n: 'Đèn', i: 'lantern' }, { n: 'Chùa', i: 'temple' },
  { n: 'Chuỗi hạt', i: 'chant' }, { n: 'Ngồi thiền', i: 'meditate' }, { n: 'Lạy', i: 'bow' }, { n: 'Hào quang', i: 'halo' },
];
function openMemory(ctx: MenuCtx) {
  openCustomPanel('Lật thẻ biểu tượng', (body) => {
    const deck = [...SYMBOLS, ...SYMBOLS].map((s, k) => ({ ...s, k })).sort(() => Math.random() - 0.5);
    const grid = h('div', { class: 'mem' });
    const status = h('div', { class: 'hint' }, 'Lượt: 0');
    let open: HTMLElement[] = [], moves = 0, matched = 0, lock = false;
    const timers: number[] = [];
    deck.forEach((c) => {
      const face = h('span', { class: 'mf' });
      face.innerHTML = iconSvg(c.i);
      const card = h('button', { class: 'mc', 'aria-label': 'Thẻ úp' }, h('span', { class: 'mb' }, '☸'), face);
      card.onclick = () => {
        if (lock || card.classList.contains('up') || card.classList.contains('done')) return;
        card.classList.add('up');
        card.setAttribute('aria-label', c.n);
        audio.play('click');
        open.push(card);
        (card as any)._s = c.i;
        if (open.length < 2) return;
        moves++;
        status.textContent = `Lượt: ${moves}`;
        const [a, b] = open;
        open = [];
        if ((a as any)._s === (b as any)._s) {
          a.classList.add('done'); b.classList.add('done'); matched++;
          if (matched === SYMBOLS.length) {
            status.textContent = `Hoàn thành sau ${moves} lượt!`;
            claim(ctx, 'memory', (r) => { if (!r.ok) status.textContent += ' ' + (r.error ?? ''); });
          }
        } else {
          lock = true;
          timers.push(window.setTimeout(() => { for (const x of [a, b]) { x.classList.remove('up'); x.setAttribute('aria-label', 'Thẻ úp'); } lock = false; }, 800));
        }
      };
      grid.append(card);
    });
    body.append(backBtn(ctx), grid, status,
      h('button', { class: 'gold', onclick: () => openMemory(ctx) }, 'Chơi ván mới'),
      h('p', { class: 'hint' }, 'Hoàn thành nhận 2 công đức và 5 xu (tối đa 5 lần mỗi ngày).'));
    return () => timers.forEach(clearTimeout);
  });
}
