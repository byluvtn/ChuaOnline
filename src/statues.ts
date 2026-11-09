import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cap, clamp, ell, meshField, mix, smax, smin, type ColorFn, type Field } from './sdf';
import { glowTexture } from './textures';

const C = (h: number) => new THREE.Color(h);
const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mat = (c: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...extra });

const SKIN = C(0xe9bd52), SKIN_Q = C(0xf7ddc2), ROBE = C(0xd88b25), ROBE_D = C(0xa8590f), HAIR = C(0x1a2347), HAIR_Q = C(0x1c1a22);
const LIP = C(0xb4482c), EYE = C(0x2a1208), GOLD = C(0xf2c85a), WHITE = C(0xf6f3ea), WHITE_D = C(0xd9d3c3);

// ---------------------------------------------------------------- head
function headField(fem: boolean): Field {
  return (x, y, z) => {
    let d = ell(x, y, z, 0, 0.1, 0, 0.6, 0.68, 0.62);
    d = smin(d, ell(x, y, z, 0, -0.3, 0.12, 0.45, 0.42, 0.45), 0.25);
    for (const s of [-1, 1]) d = smin(d, ell(x, y, z, s * 0.3, -0.18, 0.38, 0.2, 0.18, 0.18), 0.12);
    d = smin(d, ell(x, y, z, 0, 0.14, 0.52, 0.5, 0.07, 0.15), 0.1);
    d = smin(d, ell(x, y, z, 0, -0.1, 0.6, 0.085, 0.2, 0.12), 0.08);
    d = smin(d, ell(x, y, z, 0, -0.36, 0.5, 0.15, 0.045, 0.09), 0.04);
    d = smin(d, ell(x, y, z, 0, -0.55, 0.38, 0.2, 0.12, 0.16), 0.1);
    for (const s of [-1, 1]) {
      d = smax(d, -ell(x, y, z, s * 0.21, 0.0, 0.6, 0.13, 0.022, 0.07), 0.015);
      d = smin(d, cap(x, y, z, s * 0.6, 0.08, -0.02, s * 0.64, fem ? -0.15 : -0.42, 0.0, 0.075, 0.045), 0.05);
    }
    d = smax(d, -ell(x, y, z, 0, -0.325, 0.57, 0.1, 0.012, 0.05), 0.01);
    if (!fem) {
      d = smin(d, ell(x, y, z, 0, 0.72, -0.04, 0.36, 0.3, 0.36), 0.2);
      const r = Math.hypot(x, y, z) || 1;
      const t = y - 0.3 - 0.35 * Math.max(z, 0) + 0.8 * Math.max(-z - 0.1, 0);
      const hm = clamp(t / 0.06, 0, 1);
      if (hm > 0) {
        const th = Math.atan2(z, x), ph = Math.acos(clamp(y / r, -1, 1));
        d -= 0.03 * hm * Math.max(0, Math.sin(th * 15)) * Math.max(0, Math.sin(ph * 17));
      }
    }
    return d;
  };
}
const headColor = (fem: boolean): ColorFn => (x, y, z, o) => {
  const skin = fem ? SKIN_Q : SKIN;
  o.copy(skin);
  const t = y - 0.3 - 0.35 * Math.max(z, 0) + 0.8 * Math.max(-z - 0.1, 0);
  if (t > 0.03) o.copy(fem ? HAIR_Q : HAIR);
  if (z > 0.5 && Math.abs(Math.abs(x) - 0.21) < 0.14 && Math.abs(y) < 0.045) o.copy(EYE);
  if (z > 0.42 && Math.abs(y - 0.215) < 0.014 && Math.abs(x) > 0.08 && Math.abs(x) < 0.36) o.copy(EYE);
  if (z > 0.44 && y > -0.41 && y < -0.3 && Math.abs(x) < 0.17) o.copy(LIP);
  if (z > 0.55 && Math.abs(x) < 0.045 && Math.abs(y - 0.27) < 0.045) o.copy(GOLD);
  if (z > 0.3 && Math.abs(x) > 0.28 && Math.abs(x) < 0.5 && y < -0.1 && y > -0.35) o.lerp(C(0xe58a6a), 0.18);
};

// ---------------------------------------------------------------- Buddha body (figure coords: lap at y~0.3, faces +z)
const buddhaBody: Field = (x, y, z) => {
  const ax = Math.abs(x), sx = x < 0 ? -1 : 1;
  const val = x + 0.5 * (y - 2.2) + 0.25;
  const w = y < 1.0 ? 1 : sstep(-0.05, 0.12, val);
  const fold = 0.016 * (Math.sin(11 * x + 3 * y + 5 * z) * 0.6 + Math.sin(17 * x - 6 * y)) * w;
  let d = ell(x, y, z, 0, 0.3, 0.3, 1.9, 0.34, 1.05);
  d = smin(d, ell(x, y, z, sx * 1.65, 0.35, 0.62, 0.5, 0.3, 0.55), 0.18);
  d = smin(d, ell(x, y, z, 0, 1.3, 0, 0.95, 1.2, 0.65), 0.35);
  d = smin(d, ell(x, y, z, 0, 2.2, 0, 1.1, 0.55, 0.6), 0.25);
  d = smin(d, ell(x, y, z, 0, 0.3, 0.95, 0.75, 0.2, 0.4), 0.2);
  d = smin(d, cap(x, y, z, 0, 2.45, 0.05, 0, 2.85, 0.05, 0.32), 0.15);
  d += 0.014 * Math.max(0, Math.sin(y * 34)) * sstep(2.5, 2.6, y) * (1 - sstep(2.8, 2.9, y));
  for (const s of [-1, 1]) {
    d = smin(d, cap(x, y, z, s * 1.0, 2.35, 0, s * 1.25, 1.5, 0.25, 0.3, 0.26), 0.18);
    d = smin(d, cap(x, y, z, s * 1.25, 1.5, 0.25, s * 0.38, 0.8, 0.92, 0.24, 0.17), 0.12);
    d = smin(d, ell(x, y, z, s * 0.3, 0.78, 0.98, 0.34, 0.1, 0.3), 0.08);
  }
  // fingers on the hands
  const fr = Math.max(0, Math.sin(x * 55)) * 0.012 * (y > 0.65 && z > 1.05 && ax < 0.8 ? 1 : 0);
  return d - fold + fr;
};
const buddhaColor: ColorFn = (x, y, z, o) => {
  const ax = Math.abs(x);
  const val = x + 0.5 * (y - 2.2) + 0.25;
  const lapSkin = ax < 1.0 && z > 0.62 && y > 0.45 && y < 1.1;
  const neck = y > 2.55;
  const rightArm = x < -0.85 && y > 0.75 && y < 2.6;
  const robe = !(lapSkin || neck || rightArm) && (y < 1.0 || val > 0);
  const f = 0.5 + 0.5 * Math.sin(11 * x + 3 * y + 5 * z);
  if (robe) {
    o.copy(ROBE).lerp(ROBE_D, 0.25 + 0.45 * f * f);
    if (Math.abs(val) < 0.07 && y > 1.0) o.copy(ROBE_D).multiplyScalar(0.9);
    if (y > 1.0 && Math.abs(val - 0.12) < 0.02) o.copy(GOLD);
  } else {
    o.copy(SKIN).lerp(C(0xc99636), 0.12 * f);
    if (neck) o.lerp(C(0xc99636), 0.15);
  }
};

// ---------------------------------------------------------------- Quan Am body (figure coords: hem y=0, head centre 5.35)
const quanBody: Field = (x, y, z) => {
  const th = Math.atan2(z, x);
  const k = 1 - sstep(0.0, 4.3, y);
  const fold = (0.045 * k + 0.012) * (Math.sin(th * 9 + y * 1.4) * 0.65 + Math.sin(th * 15 - y * 2.2) * 0.35);
  let d = ell(x, y, z, 0, 0.9, 0, 0.98, 0.98, 0.82);
  d = smin(d, ell(x, y, z, 0, 2.2, 0, 0.6, 1.5, 0.5), 0.5);
  d = smin(d, ell(x, y, z, 0, 3.5, 0, 0.5, 1.2, 0.38), 0.4);
  d = smin(d, ell(x, y, z, 0, 4.5, 0, 0.62, 0.3, 0.36), 0.25);
  d = smin(d, cap(x, y, z, 0, 4.55, 0.05, 0, 4.95, 0.05, 0.15), 0.1);
  for (const s of [-1, 1]) d = smin(d, ell(x, y, z, s * 0.5, 4.15, 0.12, 0.2, 0.75, 0.28), 0.2); // veil over the shoulders
  // right arm (+x): holds the vase at chest height
  d = smin(d, cap(x, y, z, 0.62, 4.5, 0, 0.7, 3.7, 0.12, 0.13, 0.12), 0.1);
  d = smin(d, cap(x, y, z, 0.7, 3.7, 0.12, 0.4, 3.85, 0.75, 0.12, 0.2), 0.08);
  d = smin(d, ell(x, y, z, 0.36, 3.9, 0.86, 0.1, 0.1, 0.12), 0.05);
  // left arm (-x): holds the willow branch low
  d = smin(d, cap(x, y, z, -0.62, 4.5, 0, -0.72, 3.7, 0.1, 0.13, 0.12), 0.1);
  d = smin(d, cap(x, y, z, -0.72, 3.7, 0.1, -0.6, 3.0, 0.55, 0.12, 0.2), 0.08);
  d = smin(d, ell(x, y, z, -0.58, 2.86, 0.64, 0.1, 0.1, 0.12), 0.05);
  // hair-thin pleats on the front hem
  return d - fold;
};
const quanColor: ColorFn = (x, y, z, o) => {
  const th = Math.atan2(z, x);
  const f = 0.5 + 0.5 * Math.sin(th * 9 + y * 1.4);
  o.copy(WHITE).lerp(WHITE_D, 0.18 + 0.4 * f * f * (1 - y / 6));
  const hand = (Math.hypot(x - 0.36, y - 3.9, z - 0.86) < 0.15) || (Math.hypot(x + 0.58, y - 2.86, z - 0.64) < 0.15);
  if (hand || (y > 4.68 && y < 5.1 && z > -0.1 && Math.abs(x) < 0.2) || (y > 4.42 && Math.abs(x) < 0.13 && z > 0.28 && y < 4.7)) o.copy(SKIN_Q);
  if (y < 0.12) o.lerp(GOLD, 0.5);
};
const quanVeil: Field = (x, y, z) => {
  let h = Math.abs(ell(x, y, z, 0, 5.4, -0.03, 0.5, 0.56, 0.5)) - 0.05;
  h = smax(h, -ell(x, y, z, 0, 5.2, 0.42, 0.34, 0.55, 0.36), 0.02);
  h = smax(h, -(y - 5.55 - 0.0) * 0 - (z > 0.25 && y < 5.0 ? 1 : -1) * 0, 0.01);
  let b = Math.abs(ell(x, y, z, 0, 3.9, -0.16, 0.8, 2.0, 0.36)) - 0.05;
  b = smax(b, z - 0.03, 0.04);
  b = smax(b, y - 5.2, 0.05);
  return smin(h, b, 0.08);
};

// ---------------------------------------------------------------- lotus + halo helpers
function petalGeometry(rings: { n: number; r: number; y: number; sx: number; sy: number; tilt: number; off: number }[]) {
  const parts: THREE.BufferGeometry[] = [];
  for (const ring of rings) for (let i = 0; i < ring.n; i++) {
    const a = (i / ring.n) * Math.PI * 2 + ring.off;
    const g = new THREE.SphereGeometry(0.5, 10, 8);
    g.scale(ring.sx, ring.sy, 0.2);
    g.translate(0, ring.sy * 0.5 * 0.6, ring.r);
    g.rotateX(ring.tilt);
    g.rotateY(a);
    g.translate(0, ring.y, 0);
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}
function buildHalo(r: number, y: number, z: number, spikes: number, glow: number): THREE.Group {
  const h = new THREE.Group(); h.name = 'halo'; h.position.set(0, y, z);
  h.add(new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })));
  h.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd36b).multiplyScalar(1.8) })));
  h.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.8, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa84a).multiplyScalar(1.6) })));
  const flame = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc24a).multiplyScalar(1.5) });
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.09, i % 2 ? 0.3 : 0.5, 6), flame);
    fl.position.set(Math.cos(a) * (r + 0.22), Math.sin(a) * (r + 0.22), 0); fl.rotation.z = a - Math.PI / 2; h.add(fl);
  }
  void glow;
  return h;
}

// ---------------------------------------------------------------- cached geometry
interface Cache { b: THREE.BufferGeometry; head: THREE.BufferGeometry; extra?: THREE.BufferGeometry; petals: THREE.BufferGeometry; petalsW: THREE.BufferGeometry; slab: THREE.BufferGeometry }
let buddhaCache: Cache | null = null, quanCache: Cache | null = null;

function getBuddha(): Cache {
  if (buddhaCache) return buddhaCache;
  const b = meshField(buddhaBody, [-2.4, -0.1, -0.9], [2.4, 3.1, 1.6], 0.04, buddhaColor);
  const head = meshField(headField(false), [-0.85, -0.8, -0.8], [0.85, 1.15, 0.85], 0.022, headColor(false));
  const petals = petalGeometry([
    { n: 16, r: 2.1, y: 0.6, sx: 0.62, sy: 1.0, tilt: -0.55, off: 0 },
    { n: 14, r: 1.7, y: 0.8, sx: 0.6, sy: 0.95, tilt: -0.4, off: 0.2 },
  ]);
  const petalsW = petalGeometry([{ n: 12, r: 1.35, y: 0.95, sx: 0.55, sy: 0.85, tilt: -0.28, off: 0.1 }]);
  const slab = mergeGeometries([
    new THREE.LatheGeometry([[0, 0], [2.7, 0], [2.7, 0.2], [2.4, 0.26], [2.5, 0.44], [2.2, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y)), 48),
    new THREE.LatheGeometry([[0, 0.5], [2.0, 0.5], [2.05, 0.62], [1.85, 0.7], [0, 0.7]].map(([x, y]) => new THREE.Vector2(x, y)), 48),
  ])!;
  return (buddhaCache = { b, head, petals, petalsW, slab });
}
function getQuan(): Cache {
  if (quanCache) return quanCache;
  const b = meshField(quanBody, [-1.3, -0.05, -1.0], [1.3, 5.1, 1.2], 0.04, quanColor);
  const head = meshField(headField(true), [-0.85, -0.8, -0.8], [0.85, 1.15, 0.85], 0.022, headColor(true));
  const extra = meshField(quanVeil, [-1.2, 1.8, -0.8], [1.2, 6.1, 0.9], 0.03, () => {});
  const petals = petalGeometry([
    { n: 14, r: 1.65, y: 0.5, sx: 0.58, sy: 0.9, tilt: -0.55, off: 0 },
    { n: 11, r: 1.25, y: 0.7, sx: 0.55, sy: 0.85, tilt: -0.38, off: 0.25 },
  ]);
  const petalsW = petalGeometry([{ n: 9, r: 0.9, y: 0.85, sx: 0.5, sy: 0.75, tilt: -0.25, off: 0.1 }]);
  const slab = new THREE.LatheGeometry([[0, 0], [2.4, 0], [2.4, 0.22], [2.1, 0.3], [2.2, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y)), 40);
  return (quanCache = { b, head, extra, petals, petalsW, slab });
}

const M = {
  vc: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.3, emissive: 0x2a1604, emissiveIntensity: 0.5 }),
  vcQ: () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05, emissive: 0x1c1a16, emissiveIntensity: 0.45 }),
  veil: () => new THREE.MeshStandardMaterial({ color: 0xf7f4ec, roughness: 0.55, emissive: 0x1c1a16, side: THREE.DoubleSide }),
  pink: () => mat(0xf7b9cf, { emissive: 0x3a1623 }),
  white: () => mat(0xfff0f2, { emissive: 0x2a1a1a }),
  stone: () => mat(0xc9bfa8, { roughness: 0.8 }),
  gold: () => mat(0xe3b54a, { metalness: 0.6, roughness: 0.35, emissive: 0x3a2506 }),
};
let shared: ReturnType<typeof makeShared> | null = null;
function makeShared() {
  return { vc: M.vc(), vcQ: M.vcQ(), veil: M.veil(), pink: M.pink(), white: M.white(), stone: M.stone(), gold: M.gold(),
    jade: mat(0x7fc4a8, { emissive: 0x143026, roughness: 0.3, metalness: 0.2 }), leaf: mat(0x5da64a, { emissive: 0x112a0c }), stem: mat(0x4a6a2a),
    jewel: mat(0xff5030, { emissive: 0xaa2210, emissiveIntensity: 1.2 }) };
}
const S = () => (shared ??= makeShared());
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = shadow; parent.add(o); return o; };

/** Shakyamuni Buddha in lotus position, dhyana mudra. Base at y=0, faces +z. */
export function buildBuddha(): THREE.Group {
  const g = new THREE.Group(), m = S(), c = getBuddha();
  mesh(c.slab, m.stone, g);
  mesh(c.petals, m.pink, g);
  mesh(c.petalsW, m.white, g);
  const lotusTop = new THREE.Mesh(new THREE.LatheGeometry([[0, 1.0], [1.5, 1.0], [1.4, 1.14], [0, 1.18]].map(([x, y]) => new THREE.Vector2(x, y)), 36), mat(0xf0a8c4, { emissive: 0x2a1020 }));
  g.add(lotusTop);
  const fig = new THREE.Group(); fig.position.y = 1.18; g.add(fig);
  mesh(c.b, m.vc, fig);
  const head = mesh(c.head, m.vc, fig); head.position.set(0, 3.2, 0.1);
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), m.jewel); jewel.position.set(0, 3.2 + 1.02, 0.06); fig.add(jewel);
  g.add(buildHalo(1.55, 1.18 + 3.3, -0.62, 24, 0));
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd890, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  spr.scale.setScalar(6); spr.position.set(0, 4.3, -0.2); g.add(spr);
  g.userData.glow = spr;
  return g;
}

/** Quan Am (Avalokiteshvara) standing on a lotus, white veil, vase and willow branch. Base at y=0, faces +z. */
export function buildQuanAm(): THREE.Group {
  const g = new THREE.Group(), m = S(), c = getQuan();
  mesh(c.slab, m.stone, g);
  mesh(c.petals, m.pink, g);
  mesh(c.petalsW, m.white, g);
  const fig = new THREE.Group(); fig.position.y = 0.82; g.add(fig);
  mesh(c.b, m.vcQ, fig);
  const head = mesh(c.head, m.vcQ, fig); head.scale.setScalar(0.62); head.position.set(0, 5.35, 0.06);
  mesh(c.extra!, m.veil, fig);
  // crown + jewel
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.03, 8, 28), m.gold); crown.position.set(0, 5.62, 0.02); crown.rotation.x = Math.PI / 2 - 0.12; fig.add(crown);
  for (let i = 0; i < 5; i++) {
    const a = -0.95 + i * 0.475;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, i === 2 ? 0.2 : 0.13, 6), m.gold);
    tip.position.set(Math.sin(a) * 0.3, 5.7 + (i === 2 ? 0.05 : 0), 0.04 + Math.cos(a) * 0.3); fig.add(tip);
  }
  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), m.jewel); gem.position.set(0, 5.5, 0.3); fig.add(gem);
  // necklace + sash
  const neck = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 6, 24, Math.PI), m.gold); neck.position.set(0, 4.35, 0.2); neck.rotation.set(Math.PI * 0.6, 0, Math.PI); fig.add(neck);
  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 30), m.gold); sash.position.y = 3.0; sash.rotation.x = Math.PI / 2; sash.scale.set(1, 0.85, 1); fig.add(sash);
  // vase of pure water
  const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.1, 0], [0.17, 0.07], [0.22, 0.24], [0.16, 0.42], [0.07, 0.5], [0.09, 0.62], [0.13, 0.67], [0.07, 0.67], [0.05, 0.62]].map(([x, y]) => new THREE.Vector2(x, y)), 24), m.jade);
  vase.position.set(0.36, 3.86, 0.88); vase.castShadow = true; fig.add(vase);
  const vb = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.014, 6, 20), m.gold); vb.position.set(0.36, 4.1, 0.88); vb.rotation.x = Math.PI / 2; fig.add(vb);
  // willow branch
  const stem = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.58, 2.9, 0.68), new THREE.Vector3(-0.66, 3.5, 0.86), new THREE.Vector3(-0.55, 4.1, 0.95), new THREE.Vector3(-0.3, 4.5, 0.95)]);
  fig.add(new THREE.Mesh(new THREE.TubeGeometry(stem, 16, 0.018, 5), m.stem));
  const leaves = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 6, 5), m.leaf, 44);
  const d = new THREE.Object3D();
  for (let i = 0; i < 44; i++) {
    const p = stem.getPoint(0.3 + (i / 44) * 0.7);
    d.position.set(p.x + Math.sin(i * 7) * 0.09, p.y - (i % 3) * 0.07, p.z + Math.cos(i * 5) * 0.09); d.scale.set(1, 3.0, 0.6); d.rotation.set(0, i, 0.3); d.updateMatrix(); leaves.setMatrixAt(i, d.matrix);
  }
  fig.add(leaves);
  // flowing scarf ends
  for (const s of [-1, 1]) {
    const sc = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.55, 4.45, 0.2), new THREE.Vector3(s * 0.85, 3.5, 0.45), new THREE.Vector3(s * 0.7, 2.4, 0.5), new THREE.Vector3(s * 1.0, 1.4, 0.4), new THREE.Vector3(s * 0.85, 0.5, 0.55)]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(sc, 28, 0.045, 5), m.veil); tube.scale.set(1, 1, 1); fig.add(tube);
  }
  g.add(buildHalo(1.1, 0.82 + 5.45, -0.55, 18, 0));
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff2d0, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  spr.scale.setScalar(7); spr.position.set(0, 4.4, 0); g.add(spr);
  g.userData.glow = spr;
  return g;
}
