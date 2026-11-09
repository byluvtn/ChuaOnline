import * as THREE from 'three';

/** Signed distance field helpers + Surface Nets mesher (smooth organic sculpting with per-vertex colour). */
export type Field = (x: number, y: number, z: number) => number;
export type ColorFn = (x: number, y: number, z: number, out: THREE.Color) => void;

const sqrt = Math.sqrt, abs = Math.abs, min = Math.min, max = Math.max;

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const smin = (a: number, b: number, k: number) => { const h = max(k - abs(a - b), 0) / k; return min(a, b) - h * h * k * 0.25; };
export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function ell(x: number, y: number, z: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
  const k0 = sqrt(px * px + py * py + pz * pz);
  const qx = px / rx, qy = py / ry, qz = pz / rz;
  const k1 = sqrt(qx * qx + qy * qy + qz * qz);
  return (k0 * (k0 - 1)) / (k1 || 1e-6);
}
export function cap(x: number, y: number, z: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number, r1: number, r2 = r1) {
  const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
  const t = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  const dx = pax - bax * t, dy = pay - bay * t, dz = paz - baz * t;
  return sqrt(dx * dx + dy * dy + dz * dz) - mix(r1, r2, t);
}

/** Mesh the zero level set of f inside [lo,hi] with voxel size h. */
export function meshField(f: Field, lo: [number, number, number], hi: [number, number, number], h: number, colorFn: ColorFn): THREE.BufferGeometry {
  const nx = Math.ceil((hi[0] - lo[0]) / h) + 1, ny = Math.ceil((hi[1] - lo[1]) / h) + 1, nz = Math.ceil((hi[2] - lo[2]) / h) + 1;
  const F = new Float32Array(nx * ny * nz);
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const B = 6, hd = 0.866 * h * B * 1.35;
  for (let bk = 0; bk < nz - 1; bk += B) for (let bj = 0; bj < ny - 1; bj += B) for (let bi = 0; bi < nx - 1; bi += B) {
    const ei = min(bi + B, nx - 1), ej = min(bj + B, ny - 1), ek = min(bk + B, nz - 1);
    const cd = f(lo[0] + (bi + ei) * 0.5 * h, lo[1] + (bj + ej) * 0.5 * h, lo[2] + (bk + ek) * 0.5 * h);
    const far = abs(cd) > hd;
    for (let k = bk; k <= ek; k++) for (let j = bj; j <= ej; j++) for (let i = bi; i <= ei; i++) {
      F[at(i, j, k)] = far ? cd : f(lo[0] + i * h, lo[1] + j * h, lo[2] + k * h);
    }
  }
  const cx = nx - 1, cy = ny - 1, cz = nz - 1;
  const cell = new Int32Array(cx * cy * cz).fill(-1);
  const ci = (i: number, j: number, k: number) => i + cx * (j + cy * k);
  const pos: number[] = [];
  const corner = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const q = corner[c]; v[c] = F[at(i + q[0], j + q[1], k + q[2])]; if (v[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of edges) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += corner[a][0] + (corner[b][0] - corner[a][0]) * t;
      sy += corner[a][1] + (corner[b][1] - corner[a][1]) * t;
      sz += corner[a][2] + (corner[b][2] - corner[a][2]) * t;
      n++;
    }
    cell[ci(i, j, k)] = pos.length / 3;
    pos.push(lo[0] + (i + sx / n) * h, lo[1] + (j + sy / n) * h, lo[2] + (k + sz / n) * h);
  }
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d);
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const d0 = F[at(i, j, k)] < 0;
    // x edge
    if (i < nx - 1 && j > 0 && k > 0 && j < ny - 1 && k < nz - 1 && i < cx) {
      const d1 = F[at(i + 1, j, k)] < 0;
      if (d0 !== d1) quad(cell[ci(i, j - 1, k - 1)], cell[ci(i, j, k - 1)], cell[ci(i, j, k)], cell[ci(i, j - 1, k)], !d0);
    }
    // y edge (u=z, v=x)
    if (j < ny - 1 && i > 0 && k > 0 && i < nx - 1 && k < nz - 1 && j < cy) {
      const d1 = F[at(i, j + 1, k)] < 0;
      if (d0 !== d1) quad(cell[ci(i - 1, j, k - 1)], cell[ci(i - 1, j, k)], cell[ci(i, j, k)], cell[ci(i, j, k - 1)], !d0);
    }
    // z edge (u=x, v=y)
    if (k < nz - 1 && i > 0 && j > 0 && i < nx - 1 && j < ny - 1 && k < cz) {
      const d1 = F[at(i, j, k + 1)] < 0;
      if (d0 !== d1) quad(cell[ci(i - 1, j - 1, k)], cell[ci(i, j - 1, k)], cell[ci(i, j, k)], cell[ci(i - 1, j, k)], !d0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const col = new Float32Array(pos.length);
  const c = new THREE.Color();
  for (let i = 0; i < pos.length; i += 3) { colorFn(pos[i], pos[i + 1], pos[i + 2], c); col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
