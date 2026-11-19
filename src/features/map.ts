import { TAM_THE_PLAT, AM_CO, AM_CO_PLAT, NHA_TO, NHA_TO_PLAT, TANG_XA, TANG_XA_PLAT, NHA_KHACH, TRAI_DUONG, TRAI_DUONG_PLAT, VUON_THAP_PLAT, THIEN_DUONG, THIEN_DUONG_PLAT, PHONG_CD, PHONG_CD_PLAT, VIEN_KT, VIEN_TO, PS, PS_POND, PS_PIER, DEN_TRINH, DIEN_MAU, BAO_THAP, BELL, BRIDGE, BUDDHA_YARD, CORR, DECK, HALL, LAKE, PAGODA, PATH_Z, QUAN, WALL } from '../layout';
import { h, openCustomPanel, closePanel } from '../panels';
import type { MenuCtx } from '../menu';
import { NGOC_HALL, NGOC_TERRACE, RIVER_BRIDGES } from '../../shared/campus';
import { PLACES, type Place } from '../data/places';
import { LOTUS, RIVER, RIVER_PATH, DUOC_SU, NGOC, NGOC_APPROACH, NORTH_WALK_Z, FARM, BAMBOO, FLOWER_HILL, CAVE, TINH_THAT, DRUM, REST } from '../layout';

export function openMap(ctx: MenuCtx) {
  openCustomPanel('Bản đồ chùa', (body) => {
    const SIZE = 700;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = h('canvas', { class: 'tmap', width: SIZE * dpr, height: SIZE * dpr, 'aria-label': 'Bản đồ chùa, bấm vào địa điểm để đi tới' });
    const g = cv.getContext('2d')!;
    const PAD = 16 * dpr;
    const MX0 = WALL.xW - 8, MX1 = WALL.xE + 8, MZ0 = WALL.zN - 6, MZ1 = 68;
    const k = (SIZE * dpr - PAD * 2) / Math.max(MX1 - MX0, MZ1 - MZ0);
    const OX = (SIZE * dpr - (MX1 - MX0) * k) / 2, OZ = (SIZE * dpr - (MZ1 - MZ0) * k) / 2;
    const X = (x: number) => (x - MX0) * k + OX;
    const Z = (z: number) => (z - MZ0) * k + OZ;
    const rect = (x0: number, z0: number, x1: number, z1: number, fill: string, stroke?: string) => {
      g.fillStyle = fill; g.fillRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k);
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = dpr; g.strokeRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k); }
    };
    const ellipse = (x: number, z: number, a: number, b: number, fill: string, stroke?: string) => {
      g.beginPath(); g.ellipse(X(x), Z(z), a * k, b * k, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = dpr; g.stroke(); }
    };
    const label = (t: string, x: number, z: number, color = '#4a2e18') => {
      g.font = `600 ${12 * dpr}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 3 * dpr; g.strokeStyle = color === '#fff3dc' ? '#6e2a14' : 'rgba(253,248,234,.85)'; g.strokeText(t, X(x), Z(z));
      g.fillStyle = color; g.fillText(t, X(x), Z(z));
    };
    const drawStatic = () => {
      g.fillStyle = '#c9d9a8'; g.fillRect(0, 0, SIZE * dpr, SIZE * dpr);
      rect(WALL.xW, WALL.zN, WALL.xE, WALL.zS, '#e4e8c4', '#8a5a2b');
      rect(WALL.xW, WALL.zS, WALL.xE, 58, '#e8d6a4', '#c9a96a');
      g.fillStyle = '#e4e8c4'; g.fillRect(X(-WALL.gate), Z(WALL.zS) - 2 * dpr, WALL.gate * 2 * k, 4 * dpr);
      rect(-2, TAM_THE_PLAT.zStart, 2, WALL.zS, '#e8d6a4');
      rect(-58, PATH_Z - 1.5, 58, PATH_Z + 1.5, '#e8d6a4');
      rect(-58, -47, 58, -45, '#e8d6a4');
      rect(-60.3, -78, -57.7, 41, '#e8d6a4'); rect(57.7, -78, 60.3, 41, '#e8d6a4'); rect(-58, 39.8, 58, 42.2, '#e8d6a4');
      for (const v of [VIEN_KT, VIEN_TO]) {
        rect(v.gateX - 1.2, -58, v.gateX + 1.2, v.z1, '#e8d6a4');
      }
      rect(-48, -59.2, -27, -56.8, '#e8d6a4'); rect(27, -59.2, 50, -56.8, '#e8d6a4');
      rect(PS.x - PS.w / 2, PS.z - PS.d / 2, PS.x + PS.w / 2, PS.z + PS.d / 2, '#bfd99a', '#7a9a52');
      ellipse(PS_POND.x, PS_POND.z, PS_POND.a, PS_POND.b, '#8ec6e0', '#4f8fb0');
      rect(PS_PIER.x0, PS_PIER.z - PS_PIER.hw, PS_PIER.x1, PS_PIER.z + PS_PIER.hw, '#a9733c', '#6e4a22');
      // corridors
      for (const s of [-1, 1]) rect(s * CORR.x - CORR.half, CORR.z0, s * CORR.x + CORR.half, CORR.z1, '#d9b98c', '#a97c4a');
      // Expansion: no circular plaza remains under the enlarged koi pond.
      rect(WALL.xW, PATH_Z - 1.1, WALL.xE, PATH_Z + 1.1, '#e8d6a4');
      for (const x of [WALL.xW, WALL.xE]) rect(x - 1, PATH_Z - WALL.sideGateHalf, x + 1, PATH_Z + WALL.sideGateHalf, '#e8d6a4');
      ellipse(NGOC.x, NGOC.stairStart - 18, 40, 18, '#a8bf8e', '#7d9b6c');
      rect(...NGOC_APPROACH, '#e8d6a4');
      rect(-59, NORTH_WALK_Z - 1.2, 59, NORTH_WALK_Z + 1.2, '#e8d6a4');
      rect(NGOC.x - NGOC.stairHalf, NGOC.stairTop, NGOC.x + NGOC.stairHalf, NGOC.stairStart, '#d4d1bd', '#8b9684');
      rect(NGOC.x - NGOC_TERRACE.half, NGOC_TERRACE.north, NGOC.x + NGOC_TERRACE.half, NGOC.stairTop, '#d4d1bd', '#8b9684');
      ellipse(LOTUS.x, LOTUS.z, LOTUS.a, LOTUS.b, '#8ec6e0', '#4f8fb0');
      rect(-90, 0.9, -66, 3.1, '#d9c6a2', '#8a8270');
      const riverPath = (fill: string, stroke?: string) => {
        g.beginPath();
        for (let i = 0; i < RIVER_PATH.length; i++) {
          const a = RIVER_PATH[i];
          if (i) g.lineTo(X(a.x - a.hw), Z(a.z)); else g.moveTo(X(a.x - a.hw), Z(a.z));
        }
        for (let i = RIVER_PATH.length - 1; i >= 0; i--) {
          const a = RIVER_PATH[i];
          g.lineTo(X(a.x + a.hw), Z(a.z));
        }
        g.closePath();
        g.fillStyle = fill; g.fill();
        if (stroke) { g.strokeStyle = stroke; g.lineWidth = dpr; g.stroke(); }
      };
      ellipse(RIVER.pond.x, RIVER.pond.z, RIVER.pond.a, RIVER.pond.b, '#8ec6e0', '#4f8fb0');
      riverPath('#8ec6e0');
      for (const { x, z, halfSpan } of RIVER_BRIDGES) rect(x - halfSpan, z - RIVER.bridgeHalf, x + halfSpan, z + RIVER.bridgeHalf, '#d9c6a2', '#8a8270');
      rect(FARM.x - 12, -55, FARM.x + 12, -30, '#a3bd79', '#7d9b6c');
      rect(BAMBOO.x - 4.5, -20, BAMBOO.x + 5.3, 14, '#91b690');
      ellipse(FLOWER_HILL.x + 0.5, FLOWER_HILL.z - 0.5, 10.6, 11.8, '#c2d59f');
      ellipse(CAVE.x, CAVE.z, 5, 3, '#879a85');
      for (const p of TINH_THAT) rect(p.x - 1.6, p.z - 1.25, p.x + 1.6, p.z + 1.25, '#9c6648');
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
      for (const [p, c] of [[BELL, '#8a5a2b'], [DRUM, '#8a5a2b'], [QUAN, '#e6e0d0'], [PAGODA, '#b5542f'], [BAO_THAP, '#d9c27a']] as const) ellipse(p.x, p.z, 2.2, 2.2, c, '#4a2e18');
      const plat = (p: { x: number; z: number; hx: number; hz: number }, fill = '#b5542f', stroke = '#6e2a14') =>
        rect(p.x - p.hx, p.z - p.hz, p.x + p.hx, p.z + p.hz, fill, stroke);
      plat(NHA_TO_PLAT); plat(TANG_XA_PLAT); plat(TRAI_DUONG_PLAT);
      plat({ x: NHA_KHACH.x, z: NHA_KHACH.z, hx: 6.0, hz: 4.25 });
      plat(PHONG_CD_PLAT);
      plat(DUOC_SU); plat(NGOC_HALL);
      ellipse(REST.x, REST.z, 6, 4, '#acc895');
      plat({ x: THIEN_DUONG.x, z: THIEN_DUONG.z, hx: 6.5, hz: 4.5 });
      plat(TAM_THE_PLAT, '#b5542f', '#6e2a14');
      plat(AM_CO_PLAT, '#9a7a4a', '#4a2e18');
      plat(VUON_THAP_PLAT, '#cfc4ae', '#8a8270');
      plat({ x: DIEN_MAU.x, z: DIEN_MAU.z, hx: 4, hz: 3.5 });
      plat({ x: DEN_TRINH.x, z: DEN_TRINH.z, hx: 3, hz: 2.5 });
      ellipse(BUDDHA_YARD.x, BUDDHA_YARD.z, 4.5, 4.5, '#e8d9a0', '#c9a96a');
      ellipse(BUDDHA_YARD.x, BUDDHA_YARD.z, 1.4, 1.4, '#e8b64a', '#8a5a2b');
      label('Chánh điện', HALL.x, HALL.z, '#fff3dc');
      const LABEL_DZ: Record<string, number> = { 'Hồ cá koi': 2.5, 'Cầu cong': -7, 'Điện Tam Thế': -7, 'Bảo tháp': -6, 'Tháp cảnh': -5, 'Gác trống': 2, 'Vườn Tháp': -3.5, 'Nhà Tổ': 4, 'Sân thiền trái': -2.5, 'Sân thiền phải': -2.5, 'Chùa Ngọc': -7, 'Rừng thông': -3, 'Động thiền': -5, 'Tăng xá': -6, 'Tịnh thất': 4, 'Rừng trúc': -10, 'Sông Đông': 6 };
      for (const p of PLACES.slice(1)) label(p.name, p.x, p.z + (p.name in LABEL_DZ ? LABEL_DZ[p.name] : p.r > 4 ? 0 : 4));
      label('Bắc', 0, WALL.zN - 2.5); label('Nam', 0, WALL.zS + 3.6);
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
      const x = (((e.clientX - r.left) / r.width) * SIZE * dpr - OX) / k + MX0;
      const z = (((e.clientY - r.top) / r.height) * SIZE * dpr - OZ) / k + MZ0;
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
