import { MAP_HALF } from '../../shared/types';
import { BELL, BRIDGE, BUDDHA_YARD, CORR, DECK, HALL, LAKE, PAGODA, PATH_Z, PLAZA, QUAN, WALL } from '../layout';
import { h, openCustomPanel, closePanel } from '../panels';
import type { MenuCtx } from '../menu';

interface Place { name: string; x: number; z: number; r: number; ly?: number }
const PLACES: Place[] = [
  { name: 'Chánh điện', x: HALL.x, z: HALL.z, r: 8 },
  { name: 'Sân thiền trái', x: -(DECK.x0 + DECK.x1) / 2, z: (DECK.z0 + DECK.z1) / 2, r: 5 },
  { name: 'Sân thiền phải', x: (DECK.x0 + DECK.x1) / 2, z: (DECK.z0 + DECK.z1) / 2, r: 5 },
  { name: 'Sân chùa', x: PLAZA.x, z: PLAZA.z, r: 8 },
  { name: 'Gác chuông', x: BELL.x, z: BELL.z, r: 4 },
  { name: 'Tháp Quan Âm', x: QUAN.x, z: QUAN.z, r: 4 },
  { name: 'Đại Phật', x: BUDDHA_YARD.x, z: BUDDHA_YARD.z, r: 5 },
  { name: 'Bảo tháp', x: PAGODA.x, z: PAGODA.z, r: 4 },
  { name: 'Hồ cá koi', x: LAKE.x, z: LAKE.z + 8.5, r: 4 },
  { name: 'Cầu cong', x: BRIDGE.x, z: (BRIDGE.z0 + BRIDGE.z1) / 2, r: 3 },
  { name: 'Tam quan', x: 0, z: WALL.zS - 4, r: 4 },
];

export function openMap(ctx: MenuCtx) {
  openCustomPanel('Bản đồ chùa', (body) => {
    const SIZE = 440;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = h('canvas', { class: 'tmap', width: SIZE * dpr, height: SIZE * dpr, 'aria-label': 'Bản đồ chùa, bấm vào địa điểm để đi tới' });
    const g = cv.getContext('2d')!;
    const k = (SIZE * dpr) / (MAP_HALF * 2);
    const X = (x: number) => (x + MAP_HALF) * k;
    const Z = (z: number) => (z + MAP_HALF) * k;
    const rect = (x0: number, z0: number, x1: number, z1: number, fill: string, stroke?: string) => {
      g.fillStyle = fill; g.fillRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k);
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = dpr; g.strokeRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k); }
    };
    const ellipse = (x: number, z: number, a: number, b: number, fill: string, stroke?: string) => {
      g.beginPath(); g.ellipse(X(x), Z(z), a * k, b * k, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = dpr; g.stroke(); }
    };
    const label = (t: string, x: number, z: number, color = '#4a2e18') => {
      g.font = `600 ${11 * dpr}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 3 * dpr; g.strokeStyle = 'rgba(253,248,234,.85)'; g.strokeText(t, X(x), Z(z));
      g.fillStyle = color; g.fillText(t, X(x), Z(z));
    };
    const drawStatic = () => {
      rect(-MAP_HALF, -MAP_HALF, MAP_HALF, MAP_HALF, '#c9d9a8');
      rect(-WALL.x, WALL.zN, WALL.x, WALL.zS, '#e4e8c4', '#8a5a2b');
      // gate gap
      g.fillStyle = '#e4e8c4'; g.fillRect(X(-WALL.gate), Z(WALL.zS) - 2 * dpr, WALL.gate * 2 * k, 4 * dpr);
      // central path + cross path
      rect(-2, HALL.z + HALL.hz, 2, WALL.zS, '#e8d6a4');
      rect(-40, PATH_Z - 1.5, 40, PATH_Z + 1.5, '#e8d6a4');
      // corridors
      for (const s of [-1, 1]) rect(s * CORR.x - CORR.half, CORR.z0, s * CORR.x + CORR.half, CORR.z1, '#d9b98c', '#a97c4a');
      // plaza
      ellipse(0, 8, 11.5, 11.5, '#efe3bd', '#c9a96a');
      // decks
      for (const s of [-1, 1]) {
        const xa = s > 0 ? DECK.x0 : -DECK.x1, xb = s > 0 ? DECK.x1 : -DECK.x0;
        rect(xa, DECK.z0, xb, DECK.z1, '#c99a62', '#8a5a2b');
      }
      // hall
      rect(HALL.x - HALL.hx, HALL.z - HALL.hz, HALL.x + HALL.hx, HALL.z + HALL.hz, '#b5542f', '#6e2a14');
      // lake + bridge
      ellipse(LAKE.x, LAKE.z, LAKE.a, LAKE.b, '#8ec6e0', '#4f8fb0');
      rect(BRIDGE.x - BRIDGE.hw, BRIDGE.z0, BRIDGE.x + BRIDGE.hw, BRIDGE.z1, '#a9733c', '#6e4a22');
      // towers
      for (const [p, c] of [[BELL, '#8a5a2b'], [QUAN, '#e6e0d0'], [PAGODA, '#b5542f']] as const) ellipse(p.x, p.z, 2.2, 2.2, c, '#4a2e18');
      ellipse(BUDDHA_YARD.x, BUDDHA_YARD.z, 4.5, 4.5, '#e8d9a0', '#c9a96a');
      ellipse(BUDDHA_YARD.x, BUDDHA_YARD.z, 1.4, 1.4, '#e8b64a', '#8a5a2b');
      label('Chánh điện', HALL.x, HALL.z, '#fff3dc');
      for (const p of PLACES.slice(1)) label(p.name, p.x, p.z + (p.name === 'Hồ cá koi' ? 0 : p.name === 'Cầu cong' ? -7 : p.r > 4 ? 0 : 4));
      label('Bắc', 0, -47.5); label('Nam', 0, 48.6);
    };
    const draw = () => {
      drawStatic();
      const players = ctx.players();
      for (const p of players) {
        g.beginPath(); g.arc(X(p.x), Z(p.z), 3 * dpr, 0, Math.PI * 2);
        g.fillStyle = '#2f6fb0'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = dpr; g.stroke();
      }
      const me = ctx.myPos();
      if (me) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 250);
        g.beginPath(); g.arc(X(me.x), Z(me.z), (6 + pulse * 6) * dpr, 0, Math.PI * 2);
        g.fillStyle = `rgba(217,70,122,${0.35 - pulse * 0.2})`; g.fill();
        g.beginPath(); g.arc(X(me.x), Z(me.z), 4.5 * dpr, 0, Math.PI * 2);
        g.fillStyle = '#d9467a'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5 * dpr; g.stroke();
      }
    };
    draw();
    const timer = window.setInterval(draw, 500);
    cv.onclick = (e) => {
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * MAP_HALF * 2 - MAP_HALF;
      const z = ((e.clientY - r.top) / r.height) * MAP_HALF * 2 - MAP_HALF;
      let best: Place | null = null, bd = 1e9;
      for (const p of PLACES) { const d = Math.hypot(p.x - x, p.z - z); if (d < Math.max(p.r, 5) && d < bd) { best = p; bd = d; } }
      if (best) { closePanel(); ctx.goTo(best.x, best.z); ctx.toast(`Đang đi tới ${best.name}`); }
    };
    const chips = h('div', { class: 'chips' }, ...PLACES.map((p) => h('button', { class: 'chip', onclick: () => { closePanel(); ctx.goTo(p.x, p.z); ctx.toast(`Đang đi tới ${p.name}`); } }, p.name)));
    body.append(
      h('p', { class: 'hint', style: 'margin:0 0 8px' }, 'Chấm hồng là bạn, chấm xanh là người khác. Bấm vào địa điểm để đi tới đó.'),
      h('div', { class: 'tmap-wrap' }, cv), chips);
    return () => clearInterval(timer);
  });
}
