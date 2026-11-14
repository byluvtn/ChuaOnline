import * as THREE from 'three';
import { MARKET_STALLS } from '../shared/game.js';
import { groundY } from './layout';
import { signTexture } from './textures';
import { geo, outlined, toon } from './toon';

type Goods = 'fruit' | 'cake' | 'tea' | 'incense' | 'phongsinh';

const STALL_STYLE: Record<string, { name: string; awning: number; goods: Goods }> = {
  stall_fruit: { name: 'HOA QUẢ', awning: 0x4a9a4a, goods: 'fruit' },
  stall_cake: { name: 'BÁNH', awning: 0xd9a62b, goods: 'cake' },
  stall_tea: { name: 'TRÀ', awning: 0x5a7ab8, goods: 'tea' },
  stall_incense: { name: 'HƯƠNG HOA', awning: 0xc95a7a, goods: 'incense' },
  stall_phongsinh: { name: 'CHIM CÁ', awning: 0x3a7a5a, goods: 'phongsinh' },
};

export const MARKET_COLLIDERS: { x: number; z: number; r: number }[] =
  MARKET_STALLS.map((s) => ({ x: s.x, z: s.z, r: 1.6 }));

function box(
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
  outline = false,
): THREE.Mesh {
  const m = new THREE.Mesh(
    geo(`mk_box_${w}_${h}_${d}`, () => new THREE.BoxGeometry(w, h, d)),
    toon(color),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (outline) outlined(m);
  return m;
}

function ball(r: number, color: number, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(
    geo(`mk_ball_${r}`, () => new THREE.SphereGeometry(r, 10, 8)),
    toon(color),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(r: number, h: number, color: number, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(
    geo(`mk_cyl_${r}_${h}`, () => new THREE.CylinderGeometry(r, r, h, 12)),
    toon(color),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function addGoods(g: THREE.Group, kind: Goods): void {
  const topY = 0.98;
  if (kind === 'fruit') {
    const cols = [0xe87a2a, 0xc93a3a, 0x6aa84a];
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        const r = 0.09 + ((i + row) % 3) * 0.015;
        g.add(ball(r, cols[(i + row) % 3], -0.9 + i * 0.6, topY + r, 0.35 + row * 0.35));
      }
    }
  } else if (kind === 'cake') {
    const cols = [0x8a5a2b, 0xd9a62b];
    for (let i = 0; i < 5; i++) {
      g.add(cyl(0.11, 0.09, cols[i % 2], -0.95 + i * 0.47, topY + 0.045, 0.4 + (i % 2) * 0.3));
    }
    for (let i = 0; i < 3; i++) {
      g.add(box(0.14, 0.08, 0.14, cols[(i + 1) % 2], -0.6 + i * 0.6, topY + 0.04, 0.8));
    }
  } else if (kind === 'tea') {
    for (let i = 0; i < 3; i++) {
      g.add(cyl(0.08, 0.16, 0x4a7a8a, -0.9 + i * 0.8, topY + 0.08, 0.4));
    }
    for (let i = 0; i < 4; i++) {
      g.add(cyl(0.05, 0.06, 0xf4f4f4, -0.9 + i * 0.6, topY + 0.03, 0.8));
    }
  } else if (kind === 'phongsinh') {
    // 2 lồng chim
    for (let i = 0; i < 2; i++) {
      const cx = -0.6 + i * 0.7;
      g.add(cyl(0.18, 0.4, 0x8a5a2b, cx, topY + 0.2, 0.4));
      g.add(ball(0.07, 0xe8c84a, cx, topY + 0.2, 0.4));
    }
    // chậu cá
    g.add(cyl(0.3, 0.2, 0x4a90b8, 0.8, topY + 0.1, 0.45));
    g.add(ball(0.08, 0xe87a2a, 0.8, topY + 0.2, 0.45));
  } else {
    g.add(box(0.4, 0.1, 0.2, 0x8a5a2b, -0.7, topY + 0.05, 0.5));
    for (let i = 0; i < 6; i++) {
      g.add(cyl(0.015, 0.5, 0xb83a2a, -0.84 + i * 0.056, topY + 0.1 + 0.25, 0.5));
    }
    const fl = [0xe08ab0, 0xf4f4f4, 0xe08ab0, 0xf4f4f4];
    for (let i = 0; i < 4; i++) {
      g.add(ball(0.08, fl[i], 0.1 + i * 0.4, topY + 0.08, 0.5 + (i % 2) * 0.25));
    }
  }
}

function buildStall(id: string): THREE.Group {
  const style = STALL_STYLE[id];
  const g = new THREE.Group();
  const wood = 0x8a5a2b;

  // 4 posts
  for (const sx of [-1.3, 1.3]) {
    for (const sz of [-0.8, 0.8]) {
      g.add(box(0.12, 2.2, 0.12, wood, sx, 1.1, sz));
    }
  }

  // Counter + top slab
  g.add(box(2.6, 0.9, 1.0, 0x9a6a35, 0, 0.45, 0.55, true));
  g.add(box(2.7, 0.08, 1.1, 0xb98a4a, 0, 0.94, 0.55));

  // Back shelf
  g.add(box(2.6, 0.5, 0.5, wood, 0, 0.9, -0.75));

  // Awning: 5 stripes, alternating white / stall colour
  const stripeW = 3.1 / 5;
  const awning = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const col = i % 2 === 0 ? 0xf4ead2 : style.awning;
    awning.add(box(stripeW, 0.06, 1.9, col, -1.55 + stripeW * (i + 0.5), 0, 0));
  }
  awning.position.set(0, 2.35, 0.1);
  awning.rotation.x = 0.28; // front edge (+z) lower
  g.add(awning);

  // Sign on the awning's front edge
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.55),
    new THREE.MeshBasicMaterial({ map: signTexture(style.name) }),
  );
  sign.position.set(0, 1.95, 1.05);
  g.add(sign);
  const frame = box(2.3, 0.65, 0.04, 0x5a3a1b, 0, 1.95, 1.02, true);
  g.add(frame);

  addGoods(g, style.goods);
  return g;
}

export function buildMarket(
  scene: THREE.Scene,
  colliders: { x: number; z: number; r: number }[],
): void {
  for (const c of MARKET_COLLIDERS) colliders.push(c);
  for (const s of MARKET_STALLS) {
    if (!STALL_STYLE[s.id]) continue;
    const stall = buildStall(s.id);
    stall.position.set(s.x, groundY(s.x, s.z), s.z);
    // front (+z local) faces north, into the temple
    stall.rotation.y = Math.PI;
    scene.add(stall);
  }
}
