import type { BeadsAck, BeadsState } from '../../shared/game';
import { h, openCustomPanel } from '../panels';
import type { MenuCtx } from '../menu';

const TOTAL = 108;
const MARKS = [27, 54, 81];
const DAILY_CAP = 5;
const PRESENCE_MS = 2500;
const NS = 'http://www.w3.org/2000/svg';
const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 134;

let rewardedToday: number | null = null;
let onChange: () => void = () => {};

export const beadsPending = () => rewardedToday !== null && rewardedToday < DAILY_CAP;

export function initBeads(ctx: MenuCtx, onDot: () => void) {
  onChange = onDot;
  ctx.socket.on('beads', (s: BeadsState) => { rewardedToday = Number(s?.rewarded) || 0; onChange(); });
}

function buildRing(): { svg: SVGSVGElement; dots: SVGCircleElement[] } {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('class', 'bd-ring');
  svg.setAttribute('aria-hidden', 'true');
  const dots: SVGCircleElement[] = [];
  for (let i = 1; i <= TOTAL; i++) {
    const a = (-90 + (i * 360) / TOTAL) * (Math.PI / 180);
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', (CENTER + Math.cos(a) * RADIUS).toFixed(2));
    c.setAttribute('cy', (CENTER + Math.sin(a) * RADIUS).toFixed(2));
    c.setAttribute('r', MARKS.includes(i) ? '7.5' : '3.4');
    c.setAttribute('class', MARKS.includes(i) ? 'bd-dot mark' : 'bd-dot');
    svg.append(c);
    dots.push(c);
  }
  return { svg, dots };
}

export function openBeads(ctx: MenuCtx) {
  openCustomPanel('Lần hạt 108', (body) => {
    let n = 0;
    let started = false;
    let finished = false;
    let waiting = false;
    let presence = 0;

    const { svg, dots } = buildRing();
    const count = h('b', { class: 'bd-count' }, `0 / ${TOTAL}`);
    const bead = h('button', { class: 'bd-bead', type: 'button', 'aria-label': 'Lần một hạt' }, h('span', { class: 'bd-face' }, 'Nam mô'));
    const mid = h('div', { class: 'bd-mid' }, bead, count);
    const stage = h('div', { class: 'bd-stage' }, svg, mid);
    const result = h('div', { class: 'bd-result', role: 'status' });
    const again = h('button', { class: 'gold bd-again', type: 'button' }, 'Bắt đầu vòng mới');
    again.hidden = true;

    const stopPresence = () => { if (presence) { window.clearInterval(presence); presence = 0; } };
    const startPresence = () => {
      if (presence) return;
      ctx.act('beads');
      presence = window.setInterval(() => ctx.act('beads'), PRESENCE_MS);
    };

    const paint = () => {
      dots.forEach((d, i) => {
        d.classList.toggle('lit', i < n);
        d.classList.toggle('cur', i === n - 1 && !finished);
      });
      count.textContent = `${n} / ${TOTAL}`;
    };

    const finish = () => {
      finished = true;
      waiting = true;
      stopPresence();
      bead.disabled = true;
      result.textContent = 'Đang ghi nhận vòng hạt...';
      ctx.socket.emit('beads:done', (r: BeadsAck) => {
        waiting = false;
        if (!body.isConnected) return;
        result.classList.toggle('bad', !r?.ok);
        if (!r?.ok) result.textContent = 'Vòng chưa hợp lệ — hãy lần chậm rãi, đủ nhịp.';
        else if (r.rewarded) result.textContent = `Hoàn thành một vòng · +${r.merit ?? 0} công đức · +5 xu`;
        else result.textContent = 'Hoàn thành một vòng · Vòng này tính vào thành tựu (đã hết lượt thưởng hôm nay)';
        again.hidden = false;
      });
    };

    const tap = () => {
      if (finished || waiting) return;
      if (!started) {
        started = true;
        ctx.socket.emit('beads:start', () => {});
        startPresence();
      }
      n++;
      bead.classList.remove('hit');
      void bead.offsetWidth;
      bead.classList.add('hit');
      paint();
      if (n >= TOTAL) finish();
    };

    const reset = () => {
      n = 0; started = false; finished = false; waiting = false;
      bead.disabled = false;
      again.hidden = true;
      result.textContent = '';
      result.classList.remove('bad');
      paint();
    };

    bead.onpointerdown = (e) => { e.preventDefault(); tap(); };
    bead.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (!e.repeat) tap(); } };
    again.onclick = reset;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!e.repeat) tap();
    };
    document.addEventListener('keydown', onKey);

    body.append(
      stage, result, again,
      h('p', { class: 'hint' }, 'Chạm vào hạt lớn (hoặc bấm Space) để lần từng hạt. Đủ 108 hạt là một vòng: +10 công đức, +5 xu, tối đa 5 vòng thưởng mỗi ngày. Hãy lần chậm rãi, đủ nhịp.'));
    paint();

    return () => {
      document.removeEventListener('keydown', onKey);
      stopPresence();
    };
  });
}
