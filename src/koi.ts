import * as THREE from 'three';

/* =====================================================================
 * CÁ KOI (cá chép Nishikigoi) — mô hình + hoa văn CanvasTexture
 * ---------------------------------------------------------------------
 * Mỗi con cá là một THREE.Group hướng +z (đầu ở +z, đuôi ở -z):
 *   body   — sphere kéo dài, dẹt hai bên, đầu tù
 *   head   — chỏm cầu nối liền thân cho mõm tròn
 *   tail   — 2 vây đuôi dẹt xòe, vẫy quanh trục y
 *   dorsal — vây lưng mỏng
 *   pect   — 2 vây ngực nhỏ hai bên
 *   eyes   — 2 cầu đen nhỏ hai bên đầu
 *   barbels— 2 râu mảnh trước miệng
 * Hoa văn đốm vẽ bằng CanvasTexture (4 mẫu koi thật), dùng chung cho thân + đầu.
 * ===================================================================== */

export type KoiVariety = 'kohaku' | 'yamabuki' | 'shiroUtsuri' | 'hi';

export interface Koi {
  root: THREE.Group;
  /** hai vây đuôi (con lắc) */
  tails: THREE.Object3D[];
  /** pha dao động để mỗi con vẫy lệch nhịp */
  phase: number;
  /** điểm neo đường bơi ellipse trong hệ toạ độ hồ */
  a: number;
  rx: number;
  rz: number;
  /** chiều + tốc độ bơi */
  s: number;
  wiggle: number;
}

const VAR: Record<KoiVariety, { base: string; spots: string[]; fin: string }> = {
  kohaku: { base: '#fdfbf5', spots: ['#e8452a', '#f0603a', '#d93a24'], fin: '#fff8f0' },
  yamabuki: { base: '#f7b733', spots: ['#f2a91f', '#ffc74d', '#e89812'], fin: '#ffd066' },
  shiroUtsuri: { base: '#f8f8f4', spots: ['#1f1f22', '#333338', '#141416'], fin: '#f2f2ee' },
  hi: { base: '#f2622e', spots: ['#e04a1c', '#ff7a45', '#d23a12'], fin: '#ff8b5a' },
};

const texCache = new Map<KoiVariety, THREE.CanvasTexture>();

/** Hoa văn đốm loang kiểu koi: nền + vài mảng đốm lớn, mép mềm, thêm vảy mờ. */
function koiSkin(v: KoiVariety): THREE.CanvasTexture {
  const cached = texCache.get(v);
  if (cached) return cached;

  const W = 512, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const cfg = VAR[v];

  g.fillStyle = cfg.base;
  g.fillRect(0, 0, W, H);

  // gradient sáng dọc sống lưng → bụng tối hơn ở hai mép (v: 0 trên, 1 dưới)
  const shade = g.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, 'rgba(255,255,255,.35)');
  shade.addColorStop(0.55, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(0,0,0,.16)');
  g.fillStyle = shade; g.fillRect(0, 0, W, H);

  // đốm: rải dọc thân (u = dọc thân 0 đuôi → 1 đầu), đối xứng nhẹ để không lộ đường ghép
  const rnd = (n: number) => {
    const s = Math.sin(n * 91.7 + 13.3) * 43758.5453;
    return s - Math.floor(s);
  };
  const blob = (cx: number, cy: number, rx: number, ry: number, color: string, rot: number) => {
    g.save();
    g.translate(cx, cy);
    g.rotate(rot);
    g.beginPath();
    // mép đốm gồ ghề như vẩy cá
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const k = 0.82 + rnd(i + cx * 3.1 + cy * 1.7) * 0.36;
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fillStyle = color;
    g.fill();
    g.restore();
  };
  const n = v === 'yamabuki' ? 3 : v === 'hi' ? 4 : 6;
  for (let i = 0; i < n; i++) {
    const u = 0.14 + i * (0.72 / n) + rnd(i * 5) * 0.05;   // dọc thân
    const vv = 0.2 + rnd(i * 7) * 0.6;                      // quanh thân
    const rx = (0.05 + rnd(i * 11) * 0.07) * W;
    const ry = (0.11 + rnd(i * 13) * 0.14) * H;
    const color = cfg.spots[i % cfg.spots.length];
    // vẽ ở vị trí chính và bản sao lệch ±W để texture wrap liền mạch
    for (const off of [-W, 0, W]) {
      blob(u * W + off, vv * H, rx, ry, color, rnd(i * 3) * 0.8 - 0.4);
      blob(u * W + off, (1 - vv) * H, rx * 0.8, ry * 0.8, color, -rnd(i * 4) * 0.8);
    }
  }

  // vảy mờ (mạng lưới nhỏ) cho cảm giác vải nhung thay vì nhựa trơn
  g.strokeStyle = 'rgba(120,110,100,.10)';
  g.lineWidth = 1;
  for (let y = 0; y < H; y += 11) {
    for (let x = ((y / 11) % 2) * 11; x < W; x += 22) {
      g.beginPath(); g.arc(x, y, 8, 0.15, Math.PI - 0.15); g.stroke();
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  texCache.set(v, t);
  return t;
}

/** Vây: mặt phẳng dẹt hơi cong, hai mặt. */
function finGeometry(kind: 'tail' | 'dorsal' | 'pectoral') {
  const g = new THREE.PlaneGeometry(1, 1, 6, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    // vuốt thon về đuôi + hơi cong
    const k = kind === 'tail' ? 1 - 0.45 * (y + 0.5) : 1;
    p.setX(i, x * k);
    p.setZ(i, Math.sin((x + 0.5) * Math.PI) * (kind === 'tail' ? 0.06 : 0.02));
  }
  g.computeVertexNormals();
  return g;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function finMat(color: string) {
  const key = `fin${color}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    matCache.set(key, m);
  }
  return m;
}

const bodyGeo = new THREE.SphereGeometry(1, 20, 14);
const eyeGeo = new THREE.SphereGeometry(0.028, 8, 6);
const barbelGeo = new THREE.CylinderGeometry(0.006, 0.009, 0.09, 5);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x14100e, roughness: 0.35 });

/** Dựng một con koi. `scale` là hệ số phóng so với mô hình chuẩn (dài ~0.9). */
export function createKoi(variety: KoiVariety, scale = 1): Koi {
  const cfg = VAR[variety];
  const root = new THREE.Group();
  root.name = `koi-${variety}`;
  root.scale.setScalar(scale);

  const skinTex = koiSkin(variety);
  const skin = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.5, metalness: 0 });

  // thân chép: kéo dài dọc z, dẹt hai bên, đầu tù / đuôi thon
  const body = new THREE.Mesh(bodyGeo, skin);
  body.scale.set(0.13, 0.17, 0.4);
  body.position.z = 0.02;
  body.name = 'koi-body';
  root.add(body);

  // đầu: chỏm cầu nhỏ hơn nối liền thân cho mõm tròn
  const head = new THREE.Mesh(bodyGeo, skin);
  head.scale.set(0.115, 0.135, 0.16);
  head.position.z = 0.33;
  root.add(head);

  // mắt hai bên
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(s * 0.075, 0.045, 0.4);
    root.add(eye);
  }
  // râu (2 sợi mỗi bên trước miệng)
  for (const s of [-1, 1]) for (const k of [0, 1]) {
    const bar = new THREE.Mesh(barbelGeo, finMat('#e9d6bb'));
    bar.position.set(s * 0.045, -0.04 - k * 0.02, 0.44);
    bar.rotation.set(1.25 + k * 0.2, 0, s * 0.25);
    root.add(bar);
  }

  // đuôi: hai vây dẹt xòe sau, gắn vào group riêng để vẫy
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0, -0.36);
  root.add(tailPivot);
  const tails: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(finGeometry('tail'), finMat(cfg.fin));
    t.scale.set(0.26, 0.3, 1);
    t.position.set(s * 0.05, 0, -0.12);
    t.rotation.set(0, s * 0.35, s * 0.15);
    tailPivot.add(t);
    tails.push(t);
  }

  // vây lưng mỏng trên sống lưng
  const dorsal = new THREE.Mesh(finGeometry('dorsal'), finMat(cfg.fin));
  dorsal.scale.set(0.28, 0.11, 1);
  dorsal.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
  dorsal.position.set(0, 0.155, -0.05);
  root.add(dorsal);

  // hai vây ngực nhỏ hai bên
  for (const s of [-1, 1]) {
    const pec = new THREE.Mesh(finGeometry('pectoral'), finMat(cfg.fin));
    pec.scale.set(0.13, 0.1, 1);
    pec.position.set(s * 0.1, -0.03, 0.18);
    pec.rotation.set(0.4, s * 0.9, 0);
    root.add(pec);
  }

  return { root, tails, phase: Math.random() * Math.PI * 2, a: 0, rx: 1, rz: 1, s: 1, wiggle: 1 };
}

/** Cập nhật dáng bơi: đuôi vẫy + vặn thân nhẹ, giữ nguyên công thức hướng cũ. */
export function swimKoi(k: Koi, t: number) {
  const ph = k.phase;
  const w = Math.sin(t * 6.5 + ph) * k.wiggle;
  k.tails[0].rotation.y = 0.35 + w * 0.45;
  k.tails[1].rotation.y = -0.35 + w * 0.45;
  k.root.rotation.z = Math.sin(t * 3.2 + ph) * 0.06;
}
