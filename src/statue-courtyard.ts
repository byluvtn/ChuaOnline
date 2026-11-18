import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type Point = [number, number, number];
type Section = [number, number];
const TAU = Math.PI * 2;
const vec = (p: Point) => new THREE.Vector3(...p);
const matte = (color: number, roughness = 0.72, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const skin = matte(0xeeb981), peach = matte(0xf6cdaa);
const brows = matte(0xc99460), lightBrows = matte(0xecc994);
const ink = matte(0x35241d), smile = matte(0xac6c4d);
const ivory = matte(0xf7ead4), veil = matte(0xfff1dd), hair = matte(0xe6ceae);
const trim = matte(0xe5ba72, 0.57, 0.09), porcelain = matte(0xfff8eb, 0.42);
const bronze = matte(0xd69540, 0.54, 0.21), foldGold = matte(0xeab057, 0.54, 0.21);
const haloGold = matte(0xd9a04d, 0.57, 0.18), bowl = matte(0x302823, 0.53);
const lotusPink = matte(0xd9778b), petals = [matte(0xf29eaa), matte(0xec909f), matte(0xf6a8b4)];
const stem = matte(0x718049), leaves = [matte(0x859751), matte(0x6e8645), matte(0x9aaa64)];

function grid(rows: number, cols: number, wrap: boolean, point: (u: number, v: number) => THREE.Vector3, flip = false) {
  const positions: number[] = [], indices: number[] = [];
  const stride = wrap ? cols : cols + 1;
  for (let i = 0; i <= rows; i++) for (let j = 0; j < stride; j++) {
    const p = point(i / rows, j / cols);
    positions.push(p.x, p.y, p.z);
    if (i === rows || j === cols) continue;
    const a = i * stride + j, b = a + stride;
    const c = i * stride + (j + 1) % stride, d = c + stride;
    indices.push(...(flip ? [a, c, b, b, c, d] : [a, b, c, b, d, c]));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function sectionAt(sections: Section[], t: number): Section {
  const i = Math.min(Math.floor(t), sections.length - 2);
  const a = sections[Math.max(0, i - 1)], b = sections[i];
  const c = sections[i + 1], d = sections[Math.min(i + 2, sections.length - 1)];
  const f = t - i;
  const r = (j: 0 | 1) => Math.max(0, THREE.MathUtils.lerp(b[j], c[j], f)
    + f * (1 - f) * ((1 - f) * (2 * b[j] - a[j] - c[j]) - f * (2 * c[j] - b[j] - d[j])) * 0.5);
  return [r(0), r(1)];
}

class Sculpture {
  private batches = new Map<THREE.Material, THREE.BufferGeometry[]>();

  add(g: THREE.BufferGeometry, m: THREE.Material) {
    g.deleteAttribute('uv');
    let batch = this.batches.get(m);
    if (!batch) this.batches.set(m, batch = []);
    batch.push(g);
  }

  oval(m: THREE.Material, p: Point, scale: Point, tilt = 0, yaw = 0) {
    const size = Math.max(...scale);
    const g = new THREE.SphereGeometry(1, size > 0.45 ? 32 : 18, size > 0.45 ? 20 : 12);
    this.add(g.scale(...scale).rotateZ(tilt).rotateY(yaw).translate(...p), m);
  }

  lathe(m: THREE.Material, p: Point, profile: Section[], flatten = 1) {
    const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
    const g = new THREE.LatheGeometry(curve.getPoints(36).map(({ x, y }) => new THREE.Vector2(Math.max(x, 0), y)), 32);
    this.add(g.scale(1, 1, flatten).translate(...p), m);
  }

  // Flattening the cross-section turns the same sweep into cloth folds or leaves.
  sweep(m: THREE.Material, points: Point[], sections: Section[], rows = 24, sides = 14) {
    const curve = new THREE.CatmullRomCurve3(points.map(vec));
    this.add(grid(rows, sides, true, (u, v) => {
      const center = curve.getPoint(u), tangent = curve.getTangent(u);
      const axis = new THREE.Vector3(tangent.y, -tangent.x, 0);
      if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0);
      axis.normalize();
      const front = axis.clone().cross(tangent);
      const [w, d] = sectionAt(sections, u * (sections.length - 1));
      return center.addScaledVector(axis, w * Math.cos(TAU * v)).addScaledVector(front, d * Math.sin(TAU * v));
    }), m);
  }

  stroke(m: THREE.Material, points: Point[], radius: number) {
    const full: Section = [radius, radius];
    this.sweep(m, points, [[0, 0], full, full, full, full, full, full, full, [0, 0]], Math.max(24, points.length * 2), 10);
  }

  finish(name: string, radius: number) {
    const group = new THREE.Group();
    group.name = name;
    let radiusSq = 0;
    for (const [m, parts] of this.batches) {
      const geometry = mergeGeometries(parts)!;
      parts.forEach((g) => g.dispose());
      const p = geometry.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        radiusSq = Math.max(radiusSq, x * x + z * z);
      }
      const mesh = new THREE.Mesh(geometry, m);
      mesh.castShadow = m !== ink && m !== smile && m !== brows && m !== lightBrows;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    const bounds = new THREE.Box3().setFromObject(group);
    for (const mesh of group.children as THREE.Mesh[]) mesh.geometry.translate(0, -bounds.min.y, 0);
    group.scale.setScalar(radius / Math.sqrt(radiusSq));
    return group;
  }
}

function lotus(s: Sculpture, seated: boolean) {
  const lower = (count: number, r: number, y: number, lift: number, spread: number, width: number, phase: number) => {
    for (let i = 0; i < count; i++) {
      const angle = TAU * (i + phase) / count;
      const p = (h: number, depth: number): Point => [Math.sin(angle) * depth, h, Math.cos(angle) * depth];
      // Local petal width is tangential, independent of its radial tilt.
      s.add(grid(16, 14, true, (u, v) => {
        const t = Math.sin(Math.PI * u) ** 0.59;
        const a = TAU * v, out = spread * u + 0.105 * t * Math.sin(a);
        const center = vec(p(y + lift * u - 0.025 * Math.sin(TAU * u), r + out));
        const w = width * t * (0.78 + 0.42 * u) * Math.cos(a);
        return center.add(new THREE.Vector3(Math.cos(angle) * w,
          -0.107 * t * Math.sin(a) * spread / Math.hypot(lift, spread), -Math.sin(angle) * w));
      }), petals[i % petals.length]);
    }
  };
  if (seated) {
    lower(12, 0.59, 0.22, -0.14, 0.64, 0.30, 0.5);
    s.lathe(lotusPink, [0, 0, 0], [[0, 0.025], [0.67, 0.025], [0.92, 0.11], [0.95, 0.23], [0.79, 0.32], [0, 0.32]]);
  }
  const offset = seated ? 0.23 : 0;
  lower(11, 0.67, offset + 0.078, 0.35, 0.41, 0.29, 0);
  s.lathe(lotusPink, [0, offset, 0], [[0, 0.015], [0.58, 0.015], [0.77, 0.07], [0.90, 0.22], [0.88, 0.31], [0.68, 0.35], [0, 0.35]]);
}

const signedPow = (x: number, n: number) => Math.sign(x) * Math.abs(x) ** n;

function face(s: Sculpture, seated: boolean, y: number, z: number) {
  const w = seated ? 0.78 : 0.75, h = seated ? 0.70 : 0.64, d = seated ? 0.59 : 0.55;
  const m = seated ? skin : peach;
  const ring = (v: number) => Math.max(0, 1 - Math.abs(v) ** 2.63) ** 0.34;
  s.add(grid(40, 64, true, (u, v) => {
    const a = (u - 0.5) * Math.PI, b = TAU * v, yy = signedPow(Math.sin(a), 2 / 2.63);
    const r = ring(yy);
    return new THREE.Vector3(r * w * signedPow(Math.sin(b), 0.94), y + yy * h, z + r * d * signedPow(Math.cos(b), 0.79));
  }, true), m);
  const onFace = (x: number, dy: number, lift = 0): Point => {
    const r = ring(dy / h);
    const c = Math.sqrt(Math.max(0, 1 - (Math.abs(x) / (r * w)) ** (2 / 0.94)));
    return [x, y + dy, z + r * d * c ** 0.79 + lift];
  };
  for (const side of [-1, 1]) {
    s.stroke(ink, [[0.17, -0.12], [0.25, -0.157], [0.35, -0.164], [0.45, -0.145], [0.52, -0.096]]
      .map(([x, dy]) => onFace(side * x, dy, 0.008)), seated ? 0.018 : 0.014);
    s.stroke(seated ? brows : lightBrows, [[0.17, 0.115], [0.24, 0.151], [0.33, 0.156], [0.43, 0.133], [0.50, 0.083]]
      .map(([x, dy]) => onFace(side * x, dy, 0.006)), seated ? 0.031 : 0.027);
  }
  s.oval(m, onFace(0, -0.225, -0.027), [0.100, 0.074, 0.048]);
  s.stroke(smile, [[-0.085, -0.334], [-0.045, -0.354], [0, -0.36], [0.045, -0.354], [0.085, -0.334]]
    .map(([x, dy]) => onFace(x, dy, 0.004)), 0.010);
  if (seated) s.oval(porcelain, onFace(0, 0.147, 0.003), [0.037, 0.037, 0.021]);
}

export function buildCourtyardBuddha(radius: number) {
  const s = new Sculpture();
  lotus(s, true);

  s.oval(haloGold, [0, 2.20, -0.46], [0.99, 0.95, 0.10]);
  const rim = new THREE.TorusGeometry(0.958, 0.014, 12, 72);
  s.add(rim.scale(1.018, 0.977, 1).translate(0, 2.20, -0.437), trim);
  s.oval(skin, [0, 2.79, 0], [0.28, 0.23, 0.25]);
  face(s, true, 2.08, 0.10);
  for (const side of [-1, 1]) {
    s.sweep(skin, [[side * 0.70, 2.05, 0.11], [side * 0.84, 1.94, 0.15], [side * 0.79, 1.74, 0.15],
      [side * 0.77, 1.57, 0.20], [side * 0.785, 1.48, 0.23], [side * 0.784, 1.417, 0.23]],
    [[0.03, 0.04], [0.126, 0.113], [0.086, 0.078], [0.097, 0.084], [0.073, 0.065], [0, 0]], 32);
  }

  s.oval(skin, [0, 1.28, 0.01], [0.42, 0.34, 0.31]);
  s.oval(bronze, [0, 0.90, 0], [0.57, 0.37, 0.36]);
  for (const side of [-1, 1]) {
    s.oval(bronze, [side * 0.34, 0.73, 0.16], [0.46, 0.22, 0.43], side * 0.19, side * 0.1);
    s.stroke(foldGold, [[side * 0.68, 0.68, 0.38], [side * 0.50, 0.63, 0.52], [side * 0.24, 0.67, 0.58], [0, 0.79, 0.55]], 0.024);
  }
  s.sweep(bronze, [[0.26, 1.49, -0.14], [0.37, 1.45, 0.09], [0.28, 1.30, 0.30], [0.06, 1.13, 0.35],
    [-0.20, 0.98, 0.36], [-0.45, 0.88, 0.26]], [[0, 0], [0.17, 0.12], [0.17, 0.11], [0.16, 0.10], [0.15, 0.10], [0, 0]]);
  for (let i = 0; i < 3; i++) {
    const a = (i - 1) * 0.085;
    s.sweep(i === 1 ? bronze : foldGold, [[0.36 + a * 0.6, 1.49 - a * 0.4, 0.02], [0.32 + a, 1.34 - a * 0.5, 0.34],
      [0.17 + a, 1.22 - a * 0.7, 0.40], [-0.05 + a, 1.09 - a * 0.8, 0.43], [-0.32, 0.99 - a, 0.34]],
    [[0, 0], [0.049, 0.047], [0.045, 0.036], [0.044, 0.03], [0, 0]], 22, 12);
  }
  s.sweep(bronze, [[0.41, 1.39, 0.01], [0.48, 1.28, 0.15], [0.53, 1.12, 0.23], [0.51, 1.01, 0.37],
    [0.25, 0.92, 0.51]], [[0, 0], [0.14, 0.14], [0.13, 0.12], [0.14, 0.10], [0.075, 0.06]]);
  s.sweep(skin, [[-0.30, 1.43, 0.03], [-0.40, 1.30, 0.11], [-0.48, 1.13, 0.20], [-0.44, 1.02, 0.33],
    [-0.23, 0.92, 0.53]], [[0, 0], [0.121, 0.117], [0.12, 0.12], [0.104, 0.10], [0.074, 0.065]]);
  s.lathe(bowl, [0, 0.86, 0.49], [[0, 0], [0.10, 0.004], [0.159, 0.047], [0.174, 0.13], [0.153, 0.194],
    [0.143, 0.211], [0.121, 0.200], [0.133, 0.161], [0.136, 0.095], [0.073, 0.052], [0, 0.051]]);
  for (const side of [-1, 1]) {
    s.oval(skin, [side * 0.19, 0.91, 0.57], [0.147, 0.078, 0.085], side * 0.28);
    s.oval(skin, [side * 0.135, 0.964, 0.563], [0.081, 0.039, 0.051], -side * 0.38);
  }
  return s.finish('courtyard-buddha', radius);
}

export function buildCourtyardGuanyin(radius: number) {
  const s = new Sculpture();
  lotus(s, false);

  // Floor-length robe, with broad folds formed directly in the silhouette.
  const robe = new THREE.CatmullRomCurve3([
    [0.04, 0.35, 0.08], [0.58, 0.36, 0.34], [0.70, 0.41, 0.37], [0.66, 0.52, 0.37], [0.56, 0.83, 0.33],
    [0.47, 1.20, 0.28], [0.38, 1.60, 0.26], [0.34, 1.98, 0.28], [0.24, 2.18, 0.22], [0.10, 2.24, 0.11],
  ].map((p) => vec(p as Point)));
  const cloth = (u: number, a: number, lift = 0) => {
    const { x: w, y, z: d } = robe.getPoint(u);
    const ripple = Math.min(w, 0.57) * (1 - u) * (0.09 * Math.cos(a * 7) + 0.045 * Math.sin(a * 4 + u * 4));
    return new THREE.Vector3((w + ripple + lift) * Math.sin(a), y + (1 - u) ** 3 * 0.028 * Math.cos(a * 6),
      (d + ripple + lift) * Math.cos(a));
  };
  s.add(grid(46, 64, true, (u, v) => cloth(u, TAU * v), true), ivory);
  for (const side of [-1, 1]) {
    const path: Point[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, a = side * (0.85 - 0.29 * t + 0.9 * (1 - t) ** 8);
      path.push(cloth(0.15 + t * 0.72, a, 0.011).toArray());
    }
    s.stroke(trim, path, 0.028);
  }

  s.oval(peach, [0, 2.21, 0.02], [0.19, 0.21, 0.16]);
  s.sweep(veil, [[-0.25, 2.18, 0.12], [-0.17, 2.11, 0.235], [-0.06, 1.99, 0.285], [0.09, 1.91, 0.277]],
    [[0.04, 0.03], [0.080, 0.045], [0.079, 0.036], [0, 0]]);
  s.sweep(veil, [[0.26, 2.18, 0.12], [0.17, 2.10, 0.25], [0.037, 1.99, 0.31], [-0.13, 1.88, 0.29]],
    [[0.04, 0.03], [0.080, 0.045], [0.08, 0.034], [0, 0]]);
  s.stroke(trim, [[0.208, 2.211, 0.146], [0.125, 2.139, 0.275], [-0.007, 2.018, 0.316], [-0.134, 1.927, 0.301]], 0.020);
  s.stroke(trim, [[-0.21, 2.204, 0.151], [-0.137, 2.133, 0.258], [-0.049, 2.045, 0.304]], 0.018);

  // Bell sleeves, each sweeping from the shoulder to a rounded gold-bound cuff.
  s.sweep(ivory, [[-0.22, 2.13, 0.02], [-0.35, 1.96, 0.08], [-0.42, 1.73, 0.23], [-0.32, 1.59, 0.36], [-0.23, 1.61, 0.39]],
    [[0.04, 0.05], [0.15, 0.16], [0.19, 0.17], [0.188, 0.168], [0, 0]]);
  s.sweep(ivory, [[-0.26, 1.67, 0.35], [-0.35, 1.40, 0.34], [-0.44, 1.12, 0.32], [-0.55, 0.91, 0.33], [-0.62, 0.81, 0.38]],
    [[0.10, 0.08], [0.17, 0.12], [0.164, 0.10], [0.10, 0.069], [0, 0]]);
  s.stroke(trim, [[-0.247, 1.68, 0.46], [-0.254, 1.48, 0.459], [-0.328, 1.18, 0.445], [-0.447, 0.935, 0.41], [-0.613, 0.824, 0.389]], 0.027);
  s.sweep(ivory, [[0.26, 2.12, 0.01], [0.40, 1.92, 0.045], [0.49, 1.61, 0.09], [0.61, 1.35, 0.16], [0.66, 1.22, 0.225]],
    [[0.04, 0.04], [0.15, 0.16], [0.167, 0.17], [0.19, 0.18], [0.145, 0.128]]);
  s.sweep(trim, [[0.61, 1.32, 0.175], [0.637, 1.267, 0.204], [0.668, 1.211, 0.226], [0.684, 1.185, 0.237]],
    [[0.14, 0.137], [0.178, 0.162], [0.16, 0.145], [0.091, 0.083]], 18);
  s.oval(peach, [0.708, 1.165, 0.247], [0.095, 0.126, 0.085], 0.37);
  s.oval(peach, [0.771, 1.137, 0.30], [0.053, 0.082, 0.044], 0.44);

  s.lathe(porcelain, [-0.012, 1.56, 0.445], [[0, 0], [0.075, 0.005], [0.098, 0.075], [0.122, 0.151], [0.103, 0.226],
    [0.056, 0.282], [0.051, 0.325], [0.079, 0.365], [0.075, 0.381], [0.050, 0.375], [0.034, 0.333], [0, 0.295]]);
  s.oval(peach, [-0.135, 1.614, 0.502], [0.147, 0.083, 0.071], 0.36);
  s.oval(peach, [-0.097, 1.665, 0.525], [0.080, 0.042, 0.044], 0.70);

  s.stroke(stem, [[0.695, 1.179, 0.31], [0.829, 1.08, 0.338], [0.960, 0.91, 0.313], [1.016, 0.68, 0.27], [1.004, 0.43, 0.23]], 0.026);
  const branch: [Point, Point, Point][] = [
    [[0.831, 1.081, 0.339], [0.981, 1.02, 0.321], [1.134, 0.812, 0.282]],
    [[0.87, 1.036, 0.335], [0.858, 0.873, 0.366], [0.768, 0.672, 0.362]],
    [[0.935, 0.971, 0.324], [1.054, 0.851, 0.314], [1.141, 0.602, 0.277]],
    [[0.961, 0.881, 0.314], [0.909, 0.713, 0.353], [0.807, 0.528, 0.354]],
    [[1.002, 0.774, 0.29], [1.066, 0.605, 0.291], [1.092, 0.405, 0.253]],
    [[1.019, 0.677, 0.271], [0.941, 0.532, 0.313], [0.900, 0.339, 0.296]],
    [[1.016, 0.553, 0.253], [0.995, 0.401, 0.270], [1.026, 0.229, 0.247]],
  ];
  branch.forEach((p, i) => s.sweep(leaves[i % leaves.length], p, [[0.009, 0.008], [0.043, 0.025], [0.047, 0.025], [0.025, 0.018], [0, 0]], 18, 10));

  face(s, false, 2.808, 0.103);
  s.oval(ivory, [0, 3.281, -0.015], [0.802, 0.38, 0.586]);

  // The veil is a shell: inner and outer silk surfaces meet along a gold-bound opening.
  const outline = new THREE.CatmullRomCurve3([
    [0, 3.802, 0.204], [0.39, 3.730, 0.343], [0.61, 3.516, 0.396], [0.80, 3.337, 0.297],
    [0.90, 3.154, 0.164], [0.899, 2.941, 0.104], [0.951, 2.707, 0.105], [0.879, 2.477, 0.066],
    [0.843, 2.227, 0.038], [0.916, 1.963, 0.061], [0.907, 1.733, 0.102], [0.778, 1.601, 0.076],
  ].map((p) => vec(p as Point)));
  const silk = (u: number, v: number, thick: number) => {
    const { x: w, y, z } = outline.getPoint(u), a = Math.PI * v;
    const back = Math.sin(a);
    return new THREE.Vector3((w + thick * Math.sin(Math.PI * u * 0.9)) * Math.cos(a),
      y - u ** 3 * 0.1 * back, z - (0.73 * Math.min(1, u * 5) + thick) * back);
  };
  s.add(grid(48, 38, false, (u, v) => silk(u, v, 0.043)), veil);
  s.add(grid(48, 38, false, (u, v) => silk(u, v, -0.033), true), ivory);
  s.add(grid(38, 4, false, (u, v) => silk(1, u, THREE.MathUtils.lerp(-0.033, 0.043, v))), veil);
  const edge: Point[] = [];
  for (let i = 24; i >= -24; i--) {
    const u = Math.abs(i) / 24;
    edge.push(silk(u, i < 0 ? 1 : 0, 0.005).toArray());
  }
  s.stroke(trim, edge, 0.044);

  for (const side of [-1, 1]) {
    s.sweep(hair, [[side * 0.65, 3.06, 0.246], [side * 0.737, 2.82, 0.249], [side * 0.715, 2.53, 0.226],
      [side * 0.728, 2.19, 0.218], [side * 0.81, 1.945, 0.242], [side * 0.843, 1.735, 0.268], [side * 0.781, 1.575, 0.268]],
    [[0, 0], [0.115, 0.104], [0.105, 0.102], [0.117, 0.114], [0.144, 0.113], [0.105, 0.076], [0, 0]]);
    s.oval(trim, [side * 0.221, 3.535, 0.431], [0.107, 0.153, 0.054], -side * 0.49);
  }
  s.oval(trim, [0, 3.471, 0.438], [0.312, 0.063, 0.072]);
  s.sweep(trim, [[0, 3.475, 0.458], [0, 3.57, 0.465], [0, 3.686, 0.455], [0, 3.768, 0.431]],
    [[0.13, 0.07], [0.178, 0.071], [0.119, 0.060], [0, 0]]);
  // The tiny seated Buddha relief is built into the crown instead of painted on.
  s.oval(lightBrows, [0, 3.636, 0.519], [0.047, 0.047, 0.028]);
  s.oval(lightBrows, [0, 3.674, 0.519], [0.022, 0.023, 0.017]);
  s.oval(lightBrows, [0, 3.562, 0.522], [0.056, 0.064, 0.034]);
  s.oval(lightBrows, [0, 3.516, 0.526], [0.092, 0.028, 0.043]);
  s.stroke(trim, [[0.033, 3.599, 0.547], [0.016, 3.572, 0.557], [-0.03, 3.551, 0.552]], 0.008);
  return s.finish('courtyard-guanyin', radius);
}
