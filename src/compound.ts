import * as THREE from 'three';
import { LAKE, WALL, PLAZA, HALL, SIDE_X, ZEN, REST, FLOWER_BEDS } from './layout';
import { stoneTexture, vietnameseColumnTexture } from './textures';

/* =====================================================================
 * SỬA CHỮA KIẾN TRÚC & CẢNH QUAN KHUÔN VIÊN CHÙA
 * ---------------------------------------------------------------------
 *  Gồm 5 nhóm việc, mỗi nhóm là một hàm độc lập có thể gọi lại nhiều lần:
 *   1. sealArchitectureJoints() — khít khe hở cột / kèo / mái
 *   2. sereneSky()               — bảng màu bầu trời xanh yên bình
 *   3. placeKoiPond()            — đưa hồ cá về trung tâm khuôn viên
 *   4. paveCompound()            — mặt sân lát gạch sạch sẽ (thay cỏ khối)
 *   5. relabelColumns()          — render lại chữ Việt lên bảng cột
 * ===================================================================== */

// ------------------------------------------------------------------ 1. khít khe kiến trúc
export interface SealReport {
  /** số khe đã được bù */
  filled: number;
  /** các khe còn lớn hơn ngưỡng (cần chỉnh tay) */
  remaining: { dist: number; a: string; b: string }[];
}

interface SealOpts {
  /** khe lớn nhất được tự động bù (m) */
  maxGap?: number;
  /** hai mảnh phải chồng nhau ít nhất bao nhiêu theo 2 trục còn lại (m) */
  minOverlap?: number;
  /** màu vật liệu dùng cho miếng bù (mặc định lấy vật liệu của mảnh thứ nhất) */
  material?: THREE.Material;
}

const _boxA = new THREE.Box3(), _boxB = new THREE.Box3();

/**
 * Quét các mesh được đánh dấu `userData.sealable = true` trong một nhóm kiến trúc,
 * tìm các cặp kề nhau bị hở (chồng nhau theo 2 trục, hở theo trục thứ ba) rồi bù
 * bằng một khối hộp mỏng đúng tiết diện tiếp xúc. Nhờ vậy cột, kèo và mái luôn
 * liền khối dù toạ độ đặt tay có lệch vài phân.
 */
export function sealArchitectureJoints(root: THREE.Object3D, opts: SealOpts = {}): SealReport {
  const maxGap = opts.maxGap ?? 0.32;
  const minOverlap = opts.minOverlap ?? 0.06;
  const parts: THREE.Mesh[] = [];
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.userData.sealable && !m.userData.sealFiller) parts.push(m);
  });
  // gán tên duy nhất để log khe còn lại xác định được cặp (phân biệt theo root)
  const tag = root.name || root.type || 'seal';
  for (let i = 0; i < parts.length; i++) if (!parts[i].name) parts[i].name = `${tag}-${i}`;

  const fillers: { geo: THREE.BoxGeometry; mat: THREE.Material }[] = [];
  const remaining: SealReport['remaining'] = [];
  const seen = new Set<string>();

  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j];
      _boxA.setFromObject(a);
      _boxB.setFromObject(b);
      const gapX = Math.max(_boxB.min.x - _boxA.max.x, _boxA.min.x - _boxB.max.x);
      const gapY = Math.max(_boxB.min.y - _boxA.max.y, _boxA.min.y - _boxB.max.y);
      const gapZ = Math.max(_boxB.min.z - _boxA.max.z, _boxA.min.z - _boxB.max.z);
      const ox = Math.min(_boxA.max.x, _boxB.max.x) - Math.max(_boxA.min.x, _boxB.min.x);
      const oy = Math.min(_boxA.max.y, _boxB.max.y) - Math.max(_boxA.min.y, _boxB.min.y);
      const oz = Math.min(_boxA.max.z, _boxB.max.z) - Math.max(_boxA.min.z, _boxB.min.z);

      // hở theo đúng một trục, hai trục còn lại phải chồng nhau đủ rộng
      const openX = gapX > 0 && oy > minOverlap && oz > minOverlap;
      const openY = gapY > 0 && ox > minOverlap && oz > minOverlap;
      const openZ = gapZ > 0 && ox > minOverlap && oy > minOverlap;
      const gap = Math.max(gapX, gapY, gapZ);
      if (gap <= 0.0005) continue;
      if (!(openX || openY || openZ)) continue;
      // chỉ xét các cặp thực sự kề nhau; cặp ở xa nhau không phải "khe"
      const near = Math.hypot(Math.max(gapX, 0), Math.max(gapY, 0), Math.max(gapZ, 0));
      if (near > maxGap * 2.2) continue;

      /*
       * Hai cấu kiện song song đặt cạnh nhau (vd. hai cột đứng cách nhau 1.5 m)
       * cũng "hở theo một trục và chồng theo hai trục" y như một mối nối hở.
       * Phân biệt: mối nối thật thì khe rất nhỏ so với tiết diện tiếp xúc; còn
       * khoảng cách giữa hai cấu kiện thì lớn hơn nhiều so với bề dày của chúng.
       */
      const positiveOverlaps = [ox, oy, oz].filter((v) => v > 0);
      const minCross = positiveOverlaps.length ? Math.min(...positiveOverlaps) : 0;
      if (gap > maxGap && gap > 0.6 * minCross) continue;

      const key = `${Math.round(gap * 1000)}:${Math.round(Math.min(_boxA.min.x, _boxB.min.x) * 100)}`;
      if (seen.has(key) && gap > maxGap) continue;

      if (gap > maxGap) {
        // chỉ báo những khe "gần khít" (có thể chỉnh tay), bỏ qua các cặp ở xa nhau
        if (gap < maxGap * 4) remaining.push({ dist: +gap.toFixed(3), a: a.name || 'mesh', b: b.name || 'mesh' });
        continue;
      }

      const lo = new THREE.Vector3(
        Math.max(_boxA.min.x, _boxB.min.x), Math.max(_boxA.min.y, _boxB.min.y), Math.max(_boxA.min.z, _boxB.min.z),
      );
      const hi = new THREE.Vector3(
        Math.min(_boxA.max.x, _boxB.max.x), Math.min(_boxA.max.y, _boxB.max.y), Math.min(_boxA.max.z, _boxB.max.z),
      );
      // mở rộng tiết diện tiếp xúc một chút để miếng bù ăn sâu vào hai mảnh
      const pad = 0.01;
      let sx = Math.max(0.02, hi.x - lo.x + pad * 2);
      let sy = Math.max(0.02, hi.y - lo.y + pad * 2);
      let sz = Math.max(0.02, hi.z - lo.z + pad * 2);
      if (openX) sx = gap + 0.04;
      if (openY) sy = gap + 0.04;
      if (openZ) sz = gap + 0.04;

      const geo = new THREE.BoxGeometry(sx, sy, sz);
      geo.translate((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, (lo.z + hi.z) / 2);
      // geo ở toạ độ thế giới → đổi về không gian của root
      geo.applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert());
      fillers.push({ geo, mat: opts.material ?? (a.material as THREE.Material) });
      seen.add(key);
    }
  }

  if (fillers.length) {
    const g = new THREE.Group();
    g.name = 'joint-seals';
    for (const f of fillers) {
      const m = new THREE.Mesh(f.geo, f.mat);
      m.castShadow = true; m.receiveShadow = true;
      m.userData.sealFiller = true;
      g.add(m);
    }
    root.add(g);
  }
  return { filled: fillers.length, remaining };
}

// ------------------------------------------------------------------ 2. bầu trời xanh yên bình
export interface SkyPalette {
  horizon: number; zenith: number; sun: number; hemi: number;
  fog: number; fogDensity: number; night?: boolean;
}

/**
 * Bảng màu thiền tự: xanh da trời dịu ở đỉnh, trắng ngà ở chân trời, sương mờ
 * rất nhẹ. Dùng thay cho tông "bão cát sa mạc" (cam đục) trước đây.
 */
export const SERENE_SKY: Record<'day' | 'dusk' | 'night', SkyPalette> = {
  day:   { horizon: 0xdcefff, zenith: 0x5aa7e0, sun: 0xfff6e2, hemi: 0xeaf4ff, fog: 0xd8ecfb, fogDensity: 0.0062 },
  dusk:  { horizon: 0xffe9d2, zenith: 0x7fa8d8, sun: 0xffe2b8, hemi: 0xf3e9ff, fog: 0xe6ecf8, fogDensity: 0.0058 },
  night: { horizon: 0x8fa7d8, zenith: 0x2a3a6b, sun: 0xbcd0ff, hemi: 0xc9d8ff, fog: 0x6f86b8, fogDensity: 0.0078, night: true },
};

export function sereneSky(kind: 'day' | 'dusk' | 'night' = 'day'): SkyPalette {
  return SERENE_SKY[kind];
}

/** Áp bảng màu trời lên scene + sương + dome shader (uniform đã tạo ở world.ts). */
export function applySkyPalette(
  scene: THREE.Scene,
  uniforms: { horizon: { value: THREE.Color }; zenith: { value: THREE.Color }; sunCol: { value: THREE.Color } },
  pal: SkyPalette,
) {
  if (scene.background instanceof THREE.Color) scene.background.set(pal.fog);
  if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set(pal.fog); scene.fog.density = pal.fogDensity; }
  uniforms.horizon.value.set(pal.horizon);
  uniforms.zenith.value.set(pal.zenith);
  uniforms.sunCol.value.set(pal.sun);
}

// ------------------------------------------------------------------ 3. hồ cá về trung tâm
export interface PondHandle {
  root: THREE.Object3D;
  /** đưa hồ về đúng tâm khuôn viên (mặc định LAKE) trong 1 bước */
  place(center?: { x: number; z: number }): void;
  readonly center: THREE.Vector3;
}

/**
 * Bọc hồ cá thành một nhóm và cung cấp hàm `place()` đưa cả nhóm về toạ độ tâm.
 * Trước đây hồ bị dựng lệch trục (x = 30) nên nằm tận rìa đông; nay hồ nằm trên
 * trục Bắc–Nam giữa sân chùa và tam quan.
 */
export function placeKoiPond(root: THREE.Object3D, center: { x: number; z: number } = LAKE): PondHandle {
  root.name = 'koi-pond';
  const c = new THREE.Vector3(center.x, 0, center.z);
  const handle: PondHandle = {
    root,
    center: c,
    place(target = center) {
      root.position.set(target.x, 0, target.z);
      root.updateMatrixWorld(true);
    },
  };
  handle.place();
  return handle;
}

// ------------------------------------------------------------------ 4. mặt sân sạch
/**
 * Gỡ toàn bộ "bụi cỏ" dạng khối cứng (Icosahedron/Box/Sphere gắn thẻ grass-clump)
 * nằm trong khuôn viên. Trả về số mesh đã loại bỏ.
 */
export function removeSolidGrassClumps(scene: THREE.Object3D): number {
  const doomed: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.userData.grassClump) doomed.push(o);
  });
  for (const o of doomed) {
    o.parent?.remove(o);
    const m = o as THREE.Mesh;
    if (m.isMesh) { m.geometry?.dispose(); }
  }
  return doomed.length;
}

/**
 * Mặt sân lát gạch sạch sẽ: một tấm nền đá lớn phủ kín lòng khuôn viên (thay cỏ
 * mọc lổn nhổn), cộng sân quảng trường hình tròn và thảm cỏ phẳng quanh hồ.
 */
export function paveCompound(scene: THREE.Scene, opts: { y?: number; material?: THREE.Material } = {}) {
  const y = opts.y ?? 0.045;
  const tileM = opts.material ?? new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.72, metalness: 0,
    map: stoneTexture([178, 170, 156], [26, 26], 8),
  });
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(WALL.x * 2 - 2, WALL.zS - WALL.zN - 2), tileM);
  pave.name = 'compound-paving';
  pave.rotation.x = -Math.PI / 2;
  pave.position.set(0, y, (WALL.zS + WALL.zN) / 2);
  pave.receiveShadow = true;
  scene.add(pave);

  // quảng trường trước chánh điện: viền đá sáng hơn
  const plazaM = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.68, metalness: 0,
    map: stoneTexture([196, 186, 168], [8, 8], 6),
  });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA.r, 56), plazaM);
  plaza.name = 'compound-plaza';
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(PLAZA.x, y + 0.004, PLAZA.z);
  plaza.receiveShadow = true;
  scene.add(plaza);

  // thảm cỏ phẳng (không khối) quanh hồ sen và sau chánh điện
  const lawnM = new THREE.MeshStandardMaterial({ color: 0x6f9a58, roughness: 0.95, metalness: 0 });
  const lawn = (x: number, z: number, rx: number, rz: number) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 48), lawnM);
    m.name = 'compound-lawn';
    m.scale.set(rx, rz, 1);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y + 0.002, z);
    m.receiveShadow = true;
    scene.add(m);
  };
  lawn(LAKE.x - 16, LAKE.z + 2, 7.5, 5.5);
  lawn(LAKE.x + 16, LAKE.z + 2, 7.5, 5.5);
  lawn(HALL.x, HALL.z - HALL.hz - 7, 20, 4.5);
  return { pave, plaza };
}

// ------------------------------------------------------------------ 5. cột chữ Việt
export interface ColumnLabel { text: string; title?: string }

/**
 * Thay toàn bộ bảng chữ trên cột: quét mesh có `userData.inscription` (do hall.ts /
 * temple.ts gắn) và render lại bằng CanvasTexture tiếng Việt. Nếu truyền `labels`
 * thì dùng theo thứ tự thẻ, không thì dùng nhãn mặc định đã đặt trong userData.
 */
export function relabelColumns(root: THREE.Object3D, labels?: ColumnLabel[]): number {
  const targets: { m: THREE.Mesh; g: THREE.BufferGeometry }[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.userData.inscription) targets.push({ m, g: m.geometry });
  });
  let n = 0;
  targets.forEach(({ m, g }, i) => {
    const meta = m.userData.inscription as ColumnLabel;
    const label = labels?.[i] ?? meta;
    if (!label?.text) return;
    const size = g instanceof THREE.PlaneGeometry ? (g.parameters as { width: number; height: number }) : { width: 0.9, height: 4.8 };
    const tex = vietnameseColumnTexture(label.text, 200, Math.round(200 * (size.height / Math.max(0.1, size.width))), { title: label.title });
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: false, toneMapped: false });
    (m.material as THREE.Material).dispose();
    m.material = mat;
    m.userData.inscription = label;
    n++;
  });
  return n;
}

// ------------------------------------------------------------------ 6. ba khu vườn
export interface GardenCtx {
  scene: THREE.Scene;
  colliders: { x: number; z: number; r: number }[];
  lamb: (c: number, extra?: Partial<THREE.MeshStandardMaterialParameters>) => THREE.MeshStandardMaterial;
  stoneM: THREE.Material;
  woodM: THREE.Material;
  glowSpr: (x: number, y: number, z: number, s: number, color?: number, op?: number, parent?: THREE.Object3D) => THREE.Sprite;
  addZone: (x: number, z: number, r: number, id: string) => void;
}

const GY = 0.06;

function stoneSeat(g: GardenCtx, parent: THREE.Object3D, x: number, z: number, ry: number, len = 1.8) {
  const s = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.18, 0.55), g.stoneM); top.position.y = 0.52; top.castShadow = top.receiveShadow = true; s.add(top);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.5), g.stoneM); leg.position.set(sx * (len / 2 - 0.25), 0.25, 0); leg.castShadow = true; s.add(leg);
  }
  s.position.set(x, GY, z); s.rotation.y = ry; parent.add(s);
}

function stoneTableSet(g: GardenCtx, parent: THREE.Object3D, x: number, z: number, ry = 0) {
  const t = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.14, 20), g.stoneM); top.position.y = 0.8; top.castShadow = top.receiveShadow = true; t.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.78, 12), g.stoneM); leg.position.y = 0.4; leg.castShadow = true; t.add(leg);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.5, 14), g.stoneM);
    st.position.set(Math.cos(a) * 1.25, 0.25, Math.sin(a) * 1.25); st.castShadow = st.receiveShadow = true; t.add(st);
  }
  t.position.set(x, GY, z); t.rotation.y = ry; parent.add(t);
  g.colliders.push({ x, z, r: 1.55 });
}

function woodBench(g: GardenCtx, parent: THREE.Object3D, x: number, z: number, ry: number, len = 2.2) {
  const b = new THREE.Group();
  const wood = g.lamb(0x7a4e2c);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.55), wood); seat.position.y = 0.5; seat.castShadow = true; b.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(len, 0.4, 0.08), wood); back.position.set(0, 0.85, -0.24); back.rotation.x = -0.12; back.castShadow = true; b.add(back);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), g.lamb(0x4a2e18)); leg.position.set(sx * (len / 2 - 0.2), 0.25, 0); b.add(leg);
  }
  b.position.set(x, GY, z); b.rotation.y = ry; parent.add(b);
}

/** Khu 1 — Vườn Thiền: vòng cát, tre, bonsai, ghế đá, đèn đá, hàng rào cây. */
export function buildZenGarden(g: GardenCtx) {
  const grp = new THREE.Group(); grp.name = 'zen-garden'; g.scene.add(grp);
  const cx = ZEN.x, cz = ZEN.z;
  const flat = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, z: number, y: number) => {
    const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; grp.add(m); return m;
  };
  // cỏ nền + vòng cát
  flat(new THREE.CircleGeometry(10, 48), g.lamb(0x6f9a58, { roughness: 0.95 }), cx, cz, GY);
  flat(new THREE.CircleGeometry(3.5, 48), g.lamb(0xe4dcc8, { roughness: 1 }), cx, cz, GY + 0.01);
  // vân cát: các vòng tròn mảnh
  const rake = g.lamb(0xc9bfa6, { roughness: 1 });
  for (const r of [1.0, 1.8, 2.6]) flat(new THREE.RingGeometry(r, r + 0.07, 48), rake, cx, cz, GY + 0.02);
  const pebM = g.lamb(0x8d877c, { flatShading: true });
  const nPeb = 28;
  const peb = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 8, 6), pebM, nPeb);
  const o = new THREE.Object3D();
  for (let i = 0; i < nPeb; i++) {
    const a = (i / nPeb) * Math.PI * 2, s = 0.8 + ((i * 37) % 7) / 8;
    o.position.set(cx + Math.cos(a) * 3.65, GY + 0.05, cz + Math.sin(a) * 3.65); o.scale.set(s, 0.6, s); o.rotation.y = i; o.updateMatrix(); peb.setMatrixAt(i, o.matrix);
  }
  peb.castShadow = true; grp.add(peb);
  // đá thiền ở giữa
  for (const [dx, dz, s] of [[0, 0, 0.55], [0.7, 0.4, 0.35], [-0.5, 0.55, 0.28]]) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), g.lamb(0x6e675c, { flatShading: true }));
    r.position.set(cx + dx, GY + s * 0.5, cz + dz); r.scale.y = 0.7; r.castShadow = true; grp.add(r);
  }

  // rặng tre dọc tường Bắc (z≈-40) và Tây (x≈-44)
  const boo = g.lamb(0x7fae5a), leaf = g.lamb(0x4e9a3d, { flatShading: true, side: THREE.DoubleSide });
  const clump = (x: number, z: number, seed: number) => {
    const c = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const h = 4 + ((seed * 7 + i * 13) % 20) / 10, a = i * 2.4 + seed;
      const px = Math.cos(a) * 0.22, pz = Math.sin(a) * 0.22;
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, h, 6), boo); st.position.set(px, h / 2, pz); st.rotation.set(Math.sin(a) * 0.05, 0, Math.cos(a) * 0.05); st.castShadow = true; c.add(st);
      for (let k = 0; k < 3; k++) {
        const lf = new THREE.Mesh(new THREE.SphereGeometry(0.55, 7, 5), leaf);
        lf.scale.set(1, 0.3, 1); lf.position.set(px + Math.cos(a + k) * 0.25, h - 0.3 - k * 0.55, pz + Math.sin(a + k) * 0.25); lf.castShadow = true; c.add(lf);
      }
    }
    c.position.set(x, GY, z); grp.add(c);
    g.colliders.push({ x, z, r: 0.4 });
  };
  let sd = 0;
  for (let x = -45; x <= -25; x += 1.7) clump(x, -40 + ((sd++ % 3) - 1) * 0.25, sd);
  for (let z = -38.3; z <= -23; z += 1.7) clump(-44 + ((sd++ % 3) - 1) * 0.25, z, sd);

  // bonsai trên đôn đá (4 chậu quanh vòng cát)
  const trunkM = g.lamb(0x5a3d22), crownM = g.lamb(0x3f8a3e, { flatShading: true });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, x = cx + Math.cos(a) * 5.4, z = cz + Math.sin(a) * 5.4;
    const b = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.8, 12), g.stoneM); ped.position.y = 0.4; ped.castShadow = ped.receiveShadow = true; b.add(ped);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.3, 12), g.lamb(0x9a5a3a)); pot.position.y = 0.95; b.add(pot);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.8, 6), trunkM); tr.position.set(0.05, 1.5, 0); tr.rotation.z = 0.25; tr.castShadow = true; b.add(tr);
    [[0.18, 1.85, 0.42], [-0.15, 2.15, 0.32], [0.1, 2.4, 0.22]].forEach(([px, py, s]) => {
      const cr = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), crownM); cr.scale.y = 0.6; cr.position.set(px, py - 0.1, 0); cr.castShadow = true; b.add(cr);
    });
    b.position.set(x, GY, z); grp.add(b);
    g.colliders.push({ x, z, r: 0.5 });
  }

  // 2 ghế đá hướng vào vòng cát + bộ bàn đá
  stoneSeat(g, grp, cx - 7.0, cz - 1.5, Math.PI / 2 * 0 + Math.PI / 2 * 1, 1.8);
  stoneSeat(g, grp, cx - 1.5, cz + 7.0, 0, 1.8);
  grp.children[grp.children.length - 2].rotation.y = -Math.PI / 2 + Math.PI;
  grp.children[grp.children.length - 1].rotation.y = Math.PI;
  g.colliders.push({ x: cx - 7.0, z: cz - 1.5, r: 0.9 }, { x: cx - 1.5, z: cz + 7.0, r: 0.9 });
  stoneTableSet(g, grp, cx - 5.2, cz - 6.2);

  // 4 đèn đá ở 4 góc vòng cát
  const lampM = g.lamb(0x9a9387);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2, x = cx + Math.cos(a) * 4.6, z = cz + Math.sin(a) * 4.6;
    const l = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.3, 8), lampM); base.position.y = 0.15; l.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 8), lampM); post.position.y = 0.72; post.castShadow = true; l.add(post);
    const lm = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xff9c2a, emissiveIntensity: 1.2 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.46), lm); box.position.y = 1.37; l.add(box);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 4), g.lamb(0x4a3020)); cap.position.y = 1.75; cap.rotation.y = Math.PI / 4; cap.castShadow = true; l.add(cap);
    l.position.set(x, GY, z); grp.add(l);
    g.glowSpr(x, GY + 1.4, z, 2.0, 0xffb040, 0.5);
    g.colliders.push({ x, z, r: 0.3 });
  }

  // hàng rào cây xanh thấp ở cạnh Nam (z=-17) và Đông (x=-24.5), chừa lối ~2.4 tại x=-28
  const hedgeM = g.lamb(0x3f8a3e, { flatShading: true });
  const hedge = (x: number, z: number) => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), hedgeM); h.scale.y = 0.9; h.position.set(x, GY + 0.6, z); h.castShadow = h.receiveShadow = true; grp.add(h);
    g.colliders.push({ x, z, r: 0.7 });
  };
  for (let x = -43.5; x <= -24.5; x += 1.2) { if (Math.abs(x + SIDE_X) < 1.3 || x < -38) continue; hedge(x, -17); }
  for (let z = -18.2; z >= -35; z -= 1.2) hedge(-24.5, z);

  g.addZone(cx, cz, 9, 'vuonThien');
}

/** Khu 2 — hai bồn hoa cong ôm bờ hồ (Đông + Tây, đối xứng): đất, viền cuội, thảm hoa, bụi cây, cây anh đào, ghế gỗ. */
export function buildFlowerBeds(g: GardenCtx) {
  const grp = new THREE.Group(); grp.name = 'flower-beds'; g.scene.add(grp);
  const soilM = g.lamb(0x6b4a2e, { roughness: 1 });
  const pebM = g.lamb(0xbdb5a6, { flatShading: true });
  const bushM = g.lamb(0x3f8a3e, { flatShading: true });
  const trunkM = g.lamb(0x6b4a2b), blossomM = g.lamb(0xf6b8c1, { flatShading: true, emissive: 0x2b0f18 });
  const flowerM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, emissive: 0x1a0c10 });
  const palette = [0xf4978e, 0xf2c14e, 0x9b7ede].map((c) => new THREE.Color(c));
  const o = new THREE.Object3D();
  const nFl = 130, nPeb = 40;
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 8, 6), flowerM, FLOWER_BEDS.length * nFl);
  const pebbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), pebM, FLOWER_BEDS.length * nPeb);
  let fi = 0, pi = 0;
  const bushes: [number, number, number][] = [[-3, 0.6, 0.7], [-0.5, -2.0, 0.55], [-0.8, 2.1, 0.6], [1.2, 0, 0.5]];
  const trees: [number, number][] = [[3, -2.4], [3, 2.4]];
  for (const bed of FLOWER_BEDS) {
    const side = Math.sign(bed.x);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(1, 56), soilM);
    soil.scale.set(bed.a, bed.b, 1); soil.rotation.x = -Math.PI / 2; soil.position.set(bed.x, GY + 0.005, bed.z); soil.receiveShadow = true; grp.add(soil);
    for (let i = 0; i < nPeb; i++) {
      const t = (i / nPeb) * Math.PI * 2, s = 0.8 + ((i * 37) % 7) / 9;
      o.position.set(bed.x + Math.cos(t) * (bed.a + 0.12), GY + 0.06, bed.z + Math.sin(t) * (bed.b + 0.12));
      o.scale.set(s, 0.65, s); o.rotation.set(0, i, 0); o.updateMatrix(); pebbles.setMatrixAt(pi++, o.matrix);
    }
    const keep: [number, number, number][] = [
      ...bushes.map(([dx, dz, r]): [number, number, number] => [bed.x + dx * side, bed.z + dz, r + 0.25]),
      ...trees.map(([dx, dz]): [number, number, number] => [bed.x + dx * side, bed.z + dz, 1.0]),
    ];
    for (let i = 0; i < nFl; i++) {
      const r = Math.sqrt((i + 0.5) / nFl) * 0.93, ang = i * 2.39996;
      const x = bed.x + Math.cos(ang) * r * bed.a, z = bed.z + Math.sin(ang) * r * bed.b;
      const hit = keep.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr);
      o.position.set(x, hit ? -5 : GY + 0.2, z); o.scale.set(1, hit ? 0.01 : 0.6, 1); o.rotation.set(0, 0, 0); o.updateMatrix();
      flowers.setMatrixAt(fi, o.matrix); flowers.setColorAt(fi, palette[(i * 7 + (i >> 2)) % 3]); fi++;
    }
    for (const [dx, dz, r] of bushes) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), bushM);
      b.scale.y = 0.85; b.position.set(bed.x + dx * side, GY + r * 0.7, bed.z + dz); b.castShadow = b.receiveShadow = true; grp.add(b);
    }
    for (const [dx, dz] of trees) {
      const x = bed.x + dx * side, z = bed.z + dz;
      const t = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 2.3, 8), trunkM); tr.position.y = 1.15; tr.castShadow = true; t.add(tr);
      for (let k = 0; k < 3; k++) {
        const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), blossomM);
        cr.scale.setScalar(1.35 - k * 0.2); cr.position.set((k - 1) * 0.45 * (k % 2 ? 1 : -1), 2.7 + k * 0.6, k * 0.2 - 0.2); cr.castShadow = true; t.add(cr);
      }
      t.position.set(x, GY, z); t.rotation.y = x + z; grp.add(t);
      g.colliders.push({ x, z, r: 0.35 });
    }
    for (const sz of [-1, 1]) {
      const bx = side * 13.6, bz = bed.z + sz * (bed.b + 1.3);
      woodBench(g, grp, bx, bz, Math.atan2(LAKE.x - bx, LAKE.z - bz));
    }
  }
  flowers.instanceMatrix.needsUpdate = true; if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
  pebbles.instanceMatrix.needsUpdate = true;
  pebbles.castShadow = true; grp.add(flowers, pebbles);
}

/** Khu 3 — khu nghỉ bóng cây (Đông–Nam): 3 cây lớn tam giác, 2 bộ bàn đá, 3 ghế gỗ dài. */
export function buildRestArea(g: GardenCtx) {
  const grp = new THREE.Group(); grp.name = 'rest-area'; g.scene.add(grp);
  const cx = REST.x, cz = REST.z;
  const trunkM = g.lamb(0x5f4026);
  const canopyMs = [g.lamb(0x3f8a3e, { flatShading: true }), g.lamb(0x4e9c45, { flatShading: true }), g.lamb(0x2f7a40, { flatShading: true })];
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3, x = cx + Math.cos(a) * 4.2, z = cz + Math.sin(a) * 4.2;
    const t = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.5, 3.2, 10), trunkM); tr.position.y = 1.6; tr.castShadow = true; t.add(tr);
    const parts: [number, number, number, number][] = [[0, 4.0, 0, 2.5], [1.3, 3.8, 0.5, 1.9], [-1.2, 3.9, -0.6, 2.0], [0.2, 5.0, 0.3, 1.7]];
    parts.forEach(([px, py, pz, r], k) => {
      const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), canopyMs[(i + k) % 3]);
      cr.scale.y = 0.8; cr.position.set(px, py, pz); cr.castShadow = true; cr.receiveShadow = true; t.add(cr);
    });
    t.position.set(x, GY, z); t.rotation.y = i * 2; grp.add(t);
    g.colliders.push({ x, z, r: 0.5 });
  }
  stoneTableSet(g, grp, cx - 1.9, cz - 0.9, 0.3);
  stoneTableSet(g, grp, cx + 2.3, cz - 1.1, 1.1);
  for (const deg of [-30, 90, 210]) {
    const a = (deg * Math.PI) / 180, bx = cx + Math.cos(a) * 6.2, bz = cz + Math.sin(a) * 6.2;
    woodBench(g, grp, bx, bz, Math.atan2(cx - bx, cz - bz), 2.6);
  }
  g.addZone(cx, cz, 8, 'nghiChan');
}
