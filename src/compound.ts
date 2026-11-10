import * as THREE from 'three';
import { LAKE, WALL, PLAZA, HALL } from './layout';
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
