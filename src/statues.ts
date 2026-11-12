import * as THREE from 'three';
import { faceTexture, glowTexture } from './textures';

/* =====================================================================
 * TƯỢNG PHẬT TỔ & QUAN THẾ ÂM — phong cách 3D Chibi Toy / Clay
 * ---------------------------------------------------------------------
 *  - Chỉ dùng primitive (Sphere, Cylinder, Cone, Torus, Capsule, Lathe, Tube)
 *  - 100% MeshStandardMaterial, roughness 0.4 – 0.7, tránh phản chiếu kim loại gắt
 *  - Mọi mesh chính đều castShadow + receiveShadow
 *  - Vật liệu và geometry dùng chung (cache) nên clone nhiều lần rất nhẹ
 *  - Gốc tượng tại y = 0, mặt hướng +z; kích thước ngoài được nhân với hệ số
 *    FIG_SCALE để giữ nguyên "dấu chân" của tượng cũ trong sân chùa.
 * ===================================================================== */

// ---------------------------------------------------------------- bảng màu
const COL = {
  bronze: 0xd4a373,      // đế đài sen vàng đồng mờ
  petal: 0xf4978e,       // cánh sen hồng phấn
  lotusPad: 0xe6b566,
  skinBody: 0xf3d5b5,    // da chân / tay
  skinHead: 0xfde2b6,    // da đầu
  hairBuddha: 0xa89f91,  // tóc xám be
  hairGuanyin: 0x6b4f3f,
  robeGold: 0xe0a93b,    // cà sa vàng kim mờ
  white: 0xedf2f4,       // trắng sứ
  jade: 0x2a9d8f,        // cành liễu xanh ngọc
  leaf: 0x70e000,        // lá xanh mạ
  haloGold: 0xffe066,
  haloEmissive: 0xffb703,
  red: 0xd62828,
  eyeDark: 0x2b2b2b,     // mắt / mày Quan Âm
  smileRed: 0x8d3b3b,    // miệng cười Quan Âm
  stemBrown: 0x7a4a2b,   // thân liễu nâu gỗ
  leafRound: 0x5aa469,   // lá liễu tròn
};

// ---------------------------------------------------------------- vật liệu (cache)
const matCache = new Map<string, THREE.MeshStandardMaterial>();
/** MeshStandardMaterial dùng chung theo khoá; roughness mặc định nằm trong dải 0.4–0.7. */
function std(color: number, roughness = 0.55, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const key = `${color}|${roughness}|${JSON.stringify(extra)}`;
  let m = matCache.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra }); matCache.set(key, m); }
  return m;
}

// ---------------------------------------------------------------- geometry (cache)
const geoCache = new Map<string, THREE.BufferGeometry>();
function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g as T;
}
const unitSphere = () => geo('sphere1', () => new THREE.SphereGeometry(1, 28, 18));

// ---------------------------------------------------------------- helper dựng mesh
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function add(parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, opts: { cast?: boolean; name?: string } = {}) {
  const o = new THREE.Mesh(g, m);
  o.castShadow = opts.cast ?? true;
  o.receiveShadow = true;
  if (opts.name) o.name = opts.name;
  parent.add(o);
  return o;
}

/** Khối cầu bị nén thành ellipsoid: dùng cho cánh sen, đùi, vai, lá... */
function blob(parent: THREE.Object3D, m: THREE.Material, pos: [number, number, number], scale: [number, number, number]) {
  const o = add(parent, unitSphere(), m);
  o.position.set(...pos);
  o.scale.set(...scale);
  return o;
}

/** Capsule nối hai điểm a→b (tay, chân, thân cành). */
function limb(parent: THREE.Object3D, m: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const len = a.distanceTo(b);
  const o = add(parent, new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 6, 14), m);
  o.position.copy(a).add(b).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(Y_AXIS, b.clone().sub(a).normalize());
  return o;
}
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- đài sen dùng chung
/**
 * Đài sen: đế tròn (Cylinder 24 segments, bán kính trên 1.2k / dưới 1.3k, cao 0.35)
 * + vòng cánh sen (SphereGeometry dẹt scale 0.28·0.45·0.14), xoay đều quanh tâm và ngửa nhẹ ra ngoài.
 * Trả về độ cao mặt trên đài (để đặt tượng).
 */
function buildLotusBase(parent: THREE.Group, k: number, petalCount: number): number {
  const baseM = std(COL.bronze, 0.6);
  const petalM = std(COL.petal, 0.6);

  const base = add(parent, geo(`lotus-base-${k}`, () => new THREE.CylinderGeometry(1.2 * k, 1.3 * k, 0.35, 24)), baseM);
  base.position.y = 0.175;

  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2;
    const pivot = new THREE.Group();            // xoay đều quanh tâm
    pivot.rotation.y = a;
    parent.add(pivot);
    const tilt = new THREE.Group();             // ngửa nhẹ ra ngoài
    tilt.position.set(0, 0.28, 1.16 * k);
    tilt.rotation.x = 0.4;
    pivot.add(tilt);
    blob(tilt, petalM, [0, 0.4, 0], [0.28 * (1.35 * k), 0.45, 0.14 * 1.6]);
  }

  // nhụy sen che phần hở giữa các cánh
  const pad = add(parent, geo(`lotus-pad-${k}`, () => new THREE.CylinderGeometry(1.12 * k, 1.16 * k, 0.12, 24)), std(COL.lotusPad, 0.6));
  pad.position.y = 0.4;
  return 0.46;
}

// ---------------------------------------------------------------- vòng hào quang dùng chung
/** Ngọn lửa ConeGeometry vuốt cong (uốn đỉnh về một phía, dẹt theo z). */
function flameGeometry() {
  return geo('flame', () => {
    const g = new THREE.ConeGeometry(0.075, 0.26, 10, 8);
    g.translate(0, 0.13, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / 0.26;
      p.setX(i, p.getX(i) + 0.09 * t * t);
      p.setZ(i, p.getZ(i) * 0.55);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Hào quang: Torus (R 1.3, ống 0.08, 16×32) + 8 ngọn lửa cách đều trên vành. Emissive nhẹ. */
function buildHalo(radius: number, y: number, z: number, flames = 8): THREE.Group {
  const halo = new THREE.Group();
  halo.name = 'halo';
  halo.position.set(0, y, z);
  const hm = std(COL.haloGold, 0.5, { emissive: COL.haloEmissive, emissiveIntensity: 0.5 });
  add(halo, geo(`halo-torus-${radius}`, () => new THREE.TorusGeometry(radius, 0.08, 16, 32)), hm);
  for (let i = 0; i < flames; i++) {
    const a = (i / flames) * Math.PI * 2 + Math.PI / 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * (radius + 0.06), Math.sin(a) * (radius + 0.06), 0);
    pivot.rotation.z = a - Math.PI / 2;
    halo.add(pivot);
    add(pivot, flameGeometry(), hm);
  }
  return halo;
}

function addGlow(g: THREE.Group, x: number, y: number, z: number, size: number, color: number) {
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
  spr.scale.setScalar(size); spr.position.set(x, y, z); g.add(spr);
  g.userData.glow = spr;
}

// ---------------------------------------------------------------- đầu chibi + khuôn mặt CanvasTexture
const HEAD_R = 0.65;

/** Mặt phẳng vẽ 2D (mắt cong, miệng cười, má hồng) dán lên chỏm cầu bọc sát đầu. */
function faceDecal(parent: THREE.Object3D, kind: 'buddha' | 'guanyin') {
  const half = 0.78;
  const g = geo('face-cap', () => new THREE.SphereGeometry(HEAD_R + 0.006, 40, 28, Math.PI / 2 - half, half * 2, Math.PI / 2 - half, half * 2));
  const m = new THREE.MeshStandardMaterial({
    map: faceTexture(kind), transparent: true, roughness: 0.6, metalness: 0,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const o = add(parent, g, m, { cast: false, name: 'face' });
  o.renderOrder = 2;
  return o;
}

function buildHead(kind: 'buddha' | 'guanyin'): THREE.Group {
  const head = new THREE.Group();
  head.name = 'head';
  add(head, geo('head', () => new THREE.SphereGeometry(HEAD_R, 40, 28)), std(COL.skinHead, 0.55));
  faceDecal(head, kind);

  // tai: hai khối dẹt dài rủ hai bên thái dương
  for (const s of [-1, 1]) {
    const ear = blob(head, std(COL.skinHead, 0.55), [s * (HEAD_R + 0.005), -0.04, 0.02], [0.07, 0.24, 0.13]);
    ear.rotation.z = -s * 0.08;
  }

  if (kind === 'buddha') {
    // tóc Ushnisha: chỏm tóc trên đầu + búi tròn + hạt ngọc (không tạo gai ốc)
    const hairM = std(COL.hairBuddha, 0.65);
    const cap = add(head, geo('hair-cap-b', () => new THREE.SphereGeometry(HEAD_R + 0.03, 36, 20, 0, Math.PI * 2, 0, 0.98)), hairM);
    cap.rotation.x = -0.1;
    blob(head, hairM, [0, 0.78, -0.03], [0.4, 0.34, 0.4]);
    blob(head, hairM, [0, 1.06, -0.03], [0.14, 0.12, 0.14]);
    const pearl = blob(head, std(COL.robeGold, 0.45), [0, 1.2, -0.03], [0.085, 0.085, 0.085]);
    pearl.name = 'pearl';
    blob(head, std(COL.red, 0.45, { emissive: 0x5a0a0a, emissiveIntensity: 0.4 }), [0, 1.2, 0.045], [0.04, 0.04, 0.04]);
  }
  return head;
}

// =====================================================================
//  PHẬT TỔ CHIBI — tọa đài sen, kiết già, Dhyana Mudra
// =====================================================================
const BUDDHA_SCALE = 1.62;

/** Tượng Phật Tổ. Gốc y=0, mặt hướng +z. Trả về `buddhaGroup`. */
export function buildBuddha(): THREE.Group {
  const buddhaGroup = new THREE.Group();
  buddhaGroup.name = 'buddhaGroup';
  const fig = new THREE.Group();
  fig.scale.setScalar(BUDDHA_SCALE);
  buddhaGroup.add(fig);

  const skin = std(COL.skinBody, 0.55);
  const robe = std(COL.robeGold, 0.4, { metalness: 0.4 });

  // ---- đài sen
  const top = buildLotusBase(fig, 1, 12);

  // ---- chân kiết già: đùi (ellipsoid) + hai cẳng chân bắt chéo + hai bàn chân
  const lapY = top + 0.28;
  blob(fig, skin, [0, lapY, 0.04], [0.98, 0.33, 0.82]);
  limb(fig, skin, v3(-0.85, lapY - 0.02, 0.3), v3(0.5, lapY + 0.02, 0.84), 0.2);
  limb(fig, skin, v3(0.85, lapY - 0.02, 0.3), v3(-0.35, lapY + 0.2, 0.86), 0.2);
  blob(fig, skin, [0.6, lapY + 0.02, 0.9], [0.2, 0.15, 0.26]);
  blob(fig, skin, [-0.46, lapY + 0.2, 0.93], [0.2, 0.15, 0.26]);

  // ---- thân: Cylinder vát đỉnh bo tròn bằng chỏm vai
  const torso = add(fig, geo('b-torso', () => new THREE.CylinderGeometry(0.5, 0.72, 0.95, 28)), skin);
  torso.position.y = 1.3; torso.scale.z = 0.86;
  blob(fig, skin, [0, 1.74, 0], [0.64, 0.3, 0.46]);

  // ---- áo cà sa: vỏ nón mỏng ôm thân, hở trọn mặt trước ngực (khe 1.7 rad về phía +z), cộng dải quấn chéo ----
  const robeShell = add(fig, geo('b-robe-shell', () => new THREE.CylinderGeometry(0.515, 0.735, 0.95, 28, 1, true, 0.85, Math.PI * 2 - 1.7)), robe);
  robeShell.position.y = 1.3; robeShell.scale.z = 0.88;
  const sashCurve = new THREE.CatmullRomCurve3([
    v3(-0.46, 1.72, 0.22), v3(-0.3, 1.6, 0.42), v3(0.02, 1.42, 0.5),
    v3(0.36, 1.28, 0.44), v3(0.56, 1.14, 0.26),
  ]);
  const sashTube = add(fig, new THREE.TubeGeometry(sashCurve, 26, 0.095, 8, false), robe);
  sashTube.scale.z = 0.7;
  // vạt cà sa phủ lên đùi
  blob(fig, robe, [-0.2, lapY + 0.24, 0.5], [0.56, 0.09, 0.42]).rotation.y = 0.3;

  // ---- hai tay: ôm trước bụng, lồng vào nhau (Dhyana Mudra)
  for (const s of [-1, 1]) {
    limb(fig, skin, v3(s * 0.62, 1.68, 0), v3(s * 0.74, 1.2, 0.14), 0.15);
    limb(fig, skin, v3(s * 0.74, 1.2, 0.14), v3(s * 0.2, 1.08, 0.66), 0.14);
  }
  const handA = limb(fig, skin, v3(-0.24, 1.1, 0.7), v3(0.2, 1.1, 0.72), 0.1);
  handA.rotation.z += 0.05;
  const handB = limb(fig, skin, v3(-0.2, 1.17, 0.74), v3(0.24, 1.15, 0.76), 0.095);
  handB.rotation.z -= 0.05;
  blob(fig, skin, [0, 1.22, 0.78], [0.1, 0.06, 0.07]); // hai ngón cái chạm nhau

  // ---- đầu
  const head = buildHead('buddha');
  head.position.set(0, 2.42, 0.04);
  fig.add(head);

  // ---- hào quang
  fig.add(buildHalo(1.3, 2.42, -0.6, 8));
  addGlow(buddhaGroup, 0, 2.42 * BUDDHA_SCALE, -0.4, 6.4, 0xffd890);
  return buddhaGroup;
}

// =====================================================================
//  ĐẦU QUAN ÂM v4 — mặt 3D bằng mesh (không dùng texture 2D)
// =====================================================================
function buildGuanyinHead(): THREE.Group {
  const R = 0.88;
  const head = new THREE.Group();
  head.name = 'head';
  const skin = std(COL.skinHead, 0.55);
  add(head, geo('g-head-v4', () => new THREE.SphereGeometry(R, 40, 28)), skin);

  // tai: hai khối dẹt dài rủ hai bên thái dương
  for (const s of [-1, 1]) {
    const ear = blob(head, skin, [s * (R + 0.005), -0.05, 0.02], [0.09, 0.3, 0.16]);
    ear.rotation.z = -s * 0.08;
  }

  // tóc: chỏm cầu che đỉnh đầu + 2 búi tròn nhỏ hai bên thái dương (rẽ ngôi giữa)
  const hairM = std(COL.hairGuanyin, 0.65);
  const hair = add(head, geo('g-hair-cap-v4', () => new THREE.SphereGeometry(R + 0.025, 36, 20, 0, Math.PI * 2, 0, 1.0)), hairM);
  hair.rotation.x = -0.12;
  for (const s of [-1, 1]) {
    blob(head, hairM, [s * (R * 0.78), R * 0.5, -0.05], [0.16, 0.16, 0.16]);
  }

  // ---- mặt 3D: mọi chi tiết nằm sát trên mặt cầu, z = sqrt(R^2 - x^2 - y^2)
  const eyeM = std(COL.eyeDark, 0.5);
  const smileM = std(COL.smileRed, 0.5);
  const surfZ = (x: number, y: number) => Math.sqrt(Math.max(R * R - x * x - y * y, 0.01));

  // mắt nhắm cong vui vẻ: cung ∩
  for (const s of [-1, 1]) {
    const x = s * 0.24, y = 0.1;
    const eye = add(head, geo('g-eye-v4', () => new THREE.TorusGeometry(0.17, 0.03, 8, 20, (Math.PI * 2) / 3)), eyeM, { cast: false });
    eye.rotation.z = Math.PI / 2 - Math.PI / 3;
    eye.position.set(x, y, surfZ(x, y) + 0.005);
    eye.rotation.y = s * 0.3;
  }
  // lông mày: cung mỏng
  for (const s of [-1, 1]) {
    const x = s * 0.24, y = 0.3;
    const brow = add(head, geo('g-brow-v4', () => new THREE.TorusGeometry(0.17, 0.015, 6, 20, Math.PI / 2)), eyeM, { cast: false });
    brow.rotation.z = Math.PI / 2 - Math.PI / 4;
    brow.position.set(x, y, surfZ(x, y) + 0.003);
    brow.rotation.y = s * 0.3;
  }
  // miệng cười: cung ∪
  const mouth = add(head, geo('g-mouth-v4', () => new THREE.TorusGeometry(0.15, 0.02, 8, 20, (Math.PI * 100) / 180)), smileM, { cast: false });
  mouth.rotation.z = -Math.PI / 2 - (Math.PI * 50) / 180;
  mouth.position.set(0, -0.2, surfZ(0, -0.2) + 0.005);
  // má hồng to
  for (const s of [-1, 1]) {
    const x = s * 0.4, y = -0.1;
    const cheek = blob(head, std(COL.petal, 0.6), [x, y, surfZ(x, y) - 0.01], [0.18, 0.13, 0.05]);
    cheek.rotation.y = s * 0.45;
  }
  // mũi gợi ý
  blob(head, skin, [0, -0.02, surfZ(0, -0.02) + 0.005], [0.05, 0.045, 0.04]);

  // ---- khăn trùm đầu: chỏm cầu úp + tà rủ sau lưng (hở 2.0 rad phía trước)
  const veilM = new THREE.MeshStandardMaterial({ color: COL.white, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
  const gap = 0.85;
  const veilHead = add(head, geo('g-veil-head-v4', () => new THREE.SphereGeometry(R + 0.11, 36, 24, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, 0, 2.15)), veilM);
  veilHead.position.y = 0.04;
  const veilDrape = add(head, geo('g-veil-drape-v4', () => new THREE.CylinderGeometry(0.52, 0.62, 1.0, 28, 1, true, 1.0, Math.PI * 2 - 2.0)), veilM);
  veilDrape.position.set(0, -0.82, -0.06);

  // ---- vương miện: vành cong vàng + 5 gai
  const crownR = R + 0.045;
  const crown = add(head, geo('g-crown-v4', () => new THREE.SphereGeometry(crownR, 32, 8, Math.PI / 2 - 0.95, 1.9, 0.62, 0.3)), std(COL.robeGold, 0.45, { metalness: 0.3, side: THREE.DoubleSide }));
  crown.name = 'crown';
  const crownGold = std(COL.robeGold, 0.45, { metalness: 0.3 });
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 - 0.78 + (i / 4) * 1.56;   // phi
    const th = 0.62;
    const tall = i === 2;
    const spike = add(head, geo(tall ? 'g-spike-tall-v4' : 'g-spike-v4', () => new THREE.ConeGeometry(0.055, tall ? 0.2 : 0.14, 8)), crownGold);
    spike.position.set(-Math.cos(a) * Math.sin(th) * crownR, Math.cos(th) * crownR + 0.05, Math.sin(a) * Math.sin(th) * crownR);
    spike.rotation.x = 0.35;
  }
  // tượng Phật A Di Đà nhỏ ngồi phía trước giữa vương miện
  const mini = new THREE.Group();
  mini.position.set(0, Math.cos(0.62) * crownR + 0.17, Math.sin(0.62) * crownR + 0.04);
  head.add(mini);
  blob(mini, crownGold, [0, 0.0, 0], [0.1, 0.045, 0.07]);
  blob(mini, crownGold, [0, 0.07, 0], [0.065, 0.075, 0.055]);
  blob(mini, std(COL.skinHead, 0.5), [0, 0.16, 0.005], [0.048, 0.048, 0.048]);
  // khung vòm mỏng ôm quanh tượng Phật nhỏ
  const arch = add(mini, geo('g-arch-v4', () => new THREE.TorusGeometry(0.16, 0.02, 8, 24, Math.PI)), crownGold, { cast: false });
  arch.position.set(0, 0.06, -0.01);

  return head;
}

// =====================================================================
//  QUAN THẾ ÂM CHIBI — đứng trên đài sen
// =====================================================================
const GUANYIN_SCALE = 1.6;

/** Thân áo: Cylinder (0.35 → 0.85, cao 1.8, 24 segments) uốn nhẹ eo. */
function robeBodyGeometry() {
  return geo('g-robe-v4', () => {
    const g = new THREE.CylinderGeometry(0.34, 0.52, 1.45, 24, 8);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + 0.725) / 1.45;            // 0 đáy … 1 đỉnh
      const waist = 1 - 0.12 * Math.sin(Math.PI * Math.min(1, t * 1.15));
      p.setX(i, p.getX(i) * waist);
      p.setZ(i, p.getZ(i) * waist);
    }
    g.computeVertexNormals();
    return g;
  });
}

/** Bình cam lộ dáng hồ lô (LatheGeometry). */
function vaseGeometry() {
  return geo('g-vase', () => {
    const pts: [number, number][] = [[0, 0], [0.1, 0.01], [0.17, 0.07], [0.21, 0.17], [0.19, 0.27], [0.11, 0.33], [0.075, 0.4], [0.1, 0.48], [0.135, 0.55], [0.12, 0.61], [0.07, 0.62]];
    return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 20);
  });
}

/** Tượng Quan Thế Âm. Gốc y=0, mặt hướng +z. Trả về `guanyinGroup`. */
export function buildQuanAm(): THREE.Group {
  const guanyinGroup = new THREE.Group();
  guanyinGroup.name = 'guanyinGroup';
  const fig = new THREE.Group();
  fig.scale.setScalar(GUANYIN_SCALE);
  guanyinGroup.add(fig);

  const white = std(COL.white, 0.5);
  const skin = std(COL.skinBody, 0.55);
  const gold = std(COL.robeGold, 0.45, { metalness: 0.3 });

  // ---- đài sen (tỷ lệ gọn hơn cho dáng đứng)
  const top = buildLotusBase(fig, 0.82, 10);

  // ---- thân áo trắng + vai
  const bodyBottom = top - 0.04;
  const body = add(fig, robeBodyGeometry(), white);
  body.position.y = bodyBottom + 0.725;
  blob(fig, white, [0, bodyBottom + 1.38, 0], [0.5, 0.22, 0.36]);
  blob(fig, skin, [0, bodyBottom + 1.55, 0.02], [0.16, 0.14, 0.16]);
  // viền vàng ở gấu áo
  const hem = add(fig, geo('g-hem-v4', () => new THREE.TorusGeometry(0.52, 0.05, 8, 40)), gold);
  hem.rotation.x = Math.PI / 2; hem.position.y = bodyBottom + 0.05;

  // cổ chữ V trước ngực: 2 dải trắng bắt chéo + dải vàng mép trong
  const vCollarY = bodyBottom + 1.2;
  const vCollarZ = 0.43;
  for (const s of [-1, 1]) {
    const flap = add(fig, geo('g-vflap', () => new THREE.BoxGeometry(0.1, 0.5, 0.03)), white);
    flap.position.set(s * 0.1, vCollarY, vCollarZ);
    flap.rotation.z = s * 0.6;
    const edge = add(fig, geo('g-vedge', () => new THREE.BoxGeometry(0.03, 0.5, 0.03)), gold);
    edge.position.set(s * 0.1 - s * 0.045, vCollarY, vCollarZ + 0.012);
    edge.rotation.z = s * 0.6;
  }

  // bàn chân lộ dưới gấu áo
  for (const s of [-1, 1]) {
    blob(fig, skin, [s * 0.18, bodyBottom + 0.06, 0.44], [0.1, 0.07, 0.16]);
  }

  // ---- hai tay: tay phải (bên trái người xem) cầm liễu, tay trái nâng bình
  const shoulderY = bodyBottom + 1.35;
  const R = -1, L = 1; // R: -x, L: +x
  const handR = v3(R * 0.42, shoulderY - 0.62, 0.62);
  const handL = v3(L * 0.42, shoulderY - 0.62, 0.62);
  for (const [s, hand] of [[R, handR], [L, handL]] as const) {
    limb(fig, white, v3(s * 0.36, shoulderY, 0.02), v3(s * 0.58, shoulderY - 0.5, 0.16), 0.15);   // tay áo rộng, ngắn lại
    limb(fig, white, v3(s * 0.58, shoulderY - 0.5, 0.16), hand.clone().add(v3(s * 0.04, 0.04, -0.06)), 0.17);
    blob(fig, skin, [hand.x, hand.y, hand.z], [0.16, 0.15, 0.17]);   // bàn tay to
    // 3 ngón nhỏ xếp khum như đang cầm
    for (let k = 0; k < 3; k++) {
      const finger = add(fig, geo('g-finger', () => new THREE.CapsuleGeometry(0.035, 0.12, 4, 8)), skin);
      finger.position.set(hand.x + (k - 1) * 0.07, hand.y + 0.01 - (k === 1 ? 0.02 : 0), hand.z + 0.12);
      finger.rotation.x = Math.PI / 2 - 0.3;
    }
  }

  // nhành liễu: thân nâu gỗ + 5 lá tròn to xen kẽ + 1 lá ở ngọn
  const willow = new THREE.Group();
  willow.position.copy(handR); willow.rotation.set(0.1, 0, 0.32);
  fig.add(willow);
  const stem = add(willow, geo('g-stem', () => new THREE.CylinderGeometry(0.018, 0.026, 1.0, 8)), std(COL.stemBrown, 0.7));
  stem.position.y = 0.34;
  const leafM = std(COL.leafRound, 0.55);
  for (let i = 0; i < 5; i++) {
    const side = i % 2 ? 1 : -1;
    const leaf = blob(willow, leafM, [side * 0.11, 0.38 + i * 0.12, 0], [0.16, 0.16, 0.03]);
    leaf.rotation.z = -side * 0.4;
  }
  blob(willow, leafM, [0, 0.92, 0], [0.16, 0.16, 0.03]);

  // bình cam lộ ngọc xanh
  const vase = add(fig, vaseGeometry(), std(COL.jade, 0.35));
  vase.position.copy(handL).add(v3(0, 0.1, 0.01)); vase.scale.setScalar(0.85);

  // ---- dải lụa vàng bay: TubeGeometry theo CatmullRomCurve3 chữ U vòng sau lưng, lượn hai vai rồi rủ xuống chân
  const ribbonY = bodyBottom;
  const curve = new THREE.CatmullRomCurve3([
    v3(-0.98, ribbonY + 0.18, 0.46), v3(-1.08, ribbonY + 0.7, 0.3), v3(-0.95, ribbonY + 1.35, 0.1),
    v3(-0.72, ribbonY + 1.92, -0.12), v3(-0.38, ribbonY + 2.18, -0.42), v3(0, ribbonY + 2.22, -0.54),
    v3(0.38, ribbonY + 2.18, -0.42), v3(0.72, ribbonY + 1.92, -0.12), v3(0.95, ribbonY + 1.35, 0.1),
    v3(1.08, ribbonY + 0.7, 0.3), v3(0.98, ribbonY + 0.18, 0.46),
  ], false, 'catmullrom', 0.5);
  add(fig, new THREE.TubeGeometry(curve, 90, 0.07, 10, false), gold, { name: 'ribbon' });

  // ---- đầu + tóc
  const head = buildGuanyinHead();
  const headY = bodyBottom + 2.05;
  head.position.set(0, headY, 0.04);
  fig.add(head);

  // ---- hào quang
  fig.add(buildHalo(1.3, headY, -0.62, 8));
  addGlow(guanyinGroup, 0, headY * GUANYIN_SCALE, -0.4, 6.6, 0xfff2d0);
  return guanyinGroup;
}
// =====================================================================
//  LA HÁN CHIBI — ngồi xếp bằng, áo tràng trầm, 3 biến thể tay
// =====================================================================
const ARHAT_SCALE = 0.434;
const ARHAT_ROBE = [0xc8963e, 0x6f8394, 0x8a5a3a];
const ARHAT_SASH = [0x8a5a3a, 0xc9d3da, 0xd8b36a];

/**
 * Tượng La Hán ngồi, cao ~1.15. Gốc y=0 (mặt ngồi), mặt hướng +z.
 * variant 0: hai tay để trong lòng · 1: một tay nâng · 2: hai tay ôm bát.
 * Đầu trọc, mặt vẽ bằng texture (mắt cong nhắm, miệng cười), không tạc hốc mắt/sống mũi.
 */
export function buildArhat(variant: 0 | 1 | 2 = 0): THREE.Group {
  const arhatGroup = new THREE.Group();
  arhatGroup.name = 'arhatGroup';
  const fig = new THREE.Group();
  fig.scale.setScalar(ARHAT_SCALE);
  arhatGroup.add(fig);

  const skin = std(COL.skinBody, 0.55);
  const robe = std(ARHAT_ROBE[variant], 0.6, { side: THREE.DoubleSide });
  const sash = std(ARHAT_SASH[variant], 0.6);

  blob(fig, robe, [0, 0.3, 0.05], [1.02, 0.34, 0.86]);
  const body = add(fig, geo('a-robe', () => new THREE.LatheGeometry(
    ([[0, 0.05], [0.9, 0.08], [0.98, 0.3], [0.84, 0.7], [0.66, 1.1], [0.56, 1.4], [0.42, 1.58], [0, 1.62]] as [number, number][]).map(([x, y]) => new THREE.Vector2(x, y)), 28)), robe);
  body.scale.z = 0.88;
  blob(fig, robe, [0, 1.5, 0], [0.58, 0.26, 0.44]);

  const sashCurve = new THREE.CatmullRomCurve3([
    v3(-0.42, 1.55, 0.12), v3(-0.24, 1.3, 0.52), v3(0.06, 1.02, 0.66), v3(0.36, 0.76, 0.72), v3(0.62, 0.5, 0.62),
  ]);
  add(fig, new THREE.TubeGeometry(sashCurve, 24, 0.075, 8, false), sash);
  const collar = add(fig, geo('a-collar', () => new THREE.TorusGeometry(0.4, 0.07, 8, 24)), sash);
  collar.rotation.x = Math.PI / 2; collar.position.y = 1.6;

  const arm = (s: number, elbow: THREE.Vector3, hand: THREE.Vector3, palm: [number, number, number] = [0.14, 0.12, 0.14]) => {
    const shoulder = v3(s * 0.55, 1.4, 0.02);
    limb(fig, robe, shoulder, elbow, 0.17);
    limb(fig, robe, elbow, hand, 0.15);
    blob(fig, skin, [hand.x, hand.y, hand.z], palm);
  };
  if (variant === 0) {
    arm(-1, v3(-0.8, 0.95, 0.3), v3(-0.14, 0.68, 0.78));
    arm(1, v3(0.8, 0.95, 0.3), v3(0.14, 0.68, 0.78));
  } else if (variant === 1) {
    arm(-1, v3(-0.8, 0.95, 0.3), v3(-0.2, 0.68, 0.76));
    arm(1, v3(0.9, 1.15, 0.3), v3(0.74, 1.72, 0.62), [0.17, 0.2, 0.08]);
  } else {
    const bowM = std(0x3a2a22, 0.5, { side: THREE.DoubleSide });
    const bowPts = ([[0, 0], [0.18, 0.02], [0.3, 0.1], [0.36, 0.22], [0.34, 0.27]] as [number, number][]).map(([x, y]) => new THREE.Vector2(x, y));
    const bowl = add(fig, geo('a-bowl', () => new THREE.LatheGeometry(bowPts, 20)), bowM);
    bowl.position.set(0, 0.7, 0.8);
    arm(-1, v3(-0.82, 0.95, 0.32), v3(-0.34, 0.82, 0.8));
    arm(1, v3(0.82, 0.95, 0.32), v3(0.34, 0.82, 0.8));
  }

  const head = buildHead('guanyin');
  head.position.set(0, 2.0, 0.05);
  fig.add(head);
  return arhatGroup;
}