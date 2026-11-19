import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Palette and hipped-roof profile from the Dược Sư Blender model.
const material = (color: number, roughness: number, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
export const duocSuStyle = {
  timber: material(0x883e2a, 0.8), darkwood: material(0x4b3022, 0.86),
  plaster: material(0xe5d9bd, 0.95), stone: material(0xcfc4ae, 0.94),
  tile: material(0x784335, 0.9), gold: material(0xbe974b, 0.48, 0.35),
};

export function duocSuRoof(w: number, d: number, base: number, rise: number, finish?: { tile: THREE.Material; single?: boolean; bright?: boolean }) {
  const group = new THREE.Group();
  group.name = 'duoc-su-style-roof';
  const { timber, darkwood } = duocSuStyle;
  const tile = finish?.tile ?? duocSuStyle.tile;
  const gold = finish?.bright ? gateGold : duocSuStyle.gold;
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const add = (m: THREE.Material, g: THREE.BufferGeometry) => {
    g.deleteAttribute('uv');
    if (!batches.has(m)) batches.set(m, []);
    batches.get(m)!.push(g.index ? g.toNonIndexed() : g);
    if (g.index) g.dispose();
  };
  const box = (m: THREE.Material, sx: number, h: number, sz: number, x: number, y: number, z: number) =>
    add(m, new THREE.BoxGeometry(sx, h, sz).translate(x, y, z));
  const tube = (m: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, r: number, sides: number, top = r) => {
    const dir = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    add(m, new THREE.CylinderGeometry(top, r, dir.length() + 0.008, sides).applyQuaternion(q).translate(...a.clone().lerp(b, 0.5).toArray()));
  };
  const rings = [0, 0.1, 0.27, 0.5, 0.75, 1];
  const size = THREE.MathUtils.clamp(Math.min(w, d) / 10, 0.45, 1.2);
  const hip = (width: number, depth: number, y: number, h: number, lift: number) => {
    const divisions = Math.max(5, Math.ceil(width / 0.8));
    const p = (t: number, side: number, u: number, offset = 0) => {
      const x = width * (0.5 - 0.3 * t), z = depth * (1 - t) / 2 + 0.045 * t;
      const v = 2 * u - 1;
      const pt = [[x * v, -z], [x, z * v], [-x * v, z], [-x, -z * v]][side];
      return new THREE.Vector3(pt[0], y + h * t ** 0.72 + lift * (1 - t) ** 4 * Math.abs(v) ** 5 + offset, pt[1]);
    };
    const vertices: number[] = [];
    const face = (...points: THREE.Vector3[]) => points.forEach(v => vertices.push(v.x, v.y, v.z));
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < divisions; i++) {
        const u = i / divisions, v = (i + 1) / divisions;
        for (let j = 0; j < rings.length - 1; j++) {
          const t = rings[j], n = rings[j + 1];
          const a = p(t, side, u), b = p(t, side, v), c = p(n, side, v), d = p(n, side, u);
          face(a, d, b, b, d, c);
          const aa = a.clone().add(new THREE.Vector3(0, -0.09, 0));
          const bb = b.clone().add(new THREE.Vector3(0, -0.09, 0));
          const cc = c.clone().add(new THREE.Vector3(0, -0.09, 0));
          const dd = d.clone().add(new THREE.Vector3(0, -0.09, 0));
          face(aa, bb, dd, bb, cc, dd);
          if (j === 0) face(a, b, aa, b, bb, aa);
          if (i > 0) tube(tile, p(t, side, u, 0.018), p(n, side, u, 0.018), 0.038 * size, 4);
          else tube(gold, p(t, side, 0, 0.038), p(n, side, 0, 0.038), 0.066 * size, 6);
        }
        tube(darkwood, p(0, side, u, -0.05), p(0, side, v, -0.05), 0.069 * size, 6);
      }
      if (finish?.bright) {
        const corner = p(0, side, 0, 0.025);
        const kink = corner.clone().add(new THREE.Vector3(Math.sign(corner.x) * 0.19, 0.18, Math.sign(corner.z) * 0.15));
        tube(gold, corner, kink, 0.095 * size, 8, 0.065 * size);
        tube(gold, kink, kink.clone().add(new THREE.Vector3(Math.sign(corner.x) * 0.08, 0.22, Math.sign(corner.z) * 0.06)), 0.065 * size, 8, 0.012);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.computeVertexNormals();
    add(tile, g);
    tube(gold, new THREE.Vector3(-width * 0.21, y + h + 0.064, 0), new THREE.Vector3(width * 0.21, y + h + 0.064, 0), 0.09 * size, 8);
  };
  hip(w, d, base, rise, 0.62 * size);
  if (!finish?.single) {
    const upper = base + rise;
    box(timber, w * 0.43, rise * 0.44, d * 0.40, 0, upper - rise * 0.04, 0);
    for (const s of [-1, 1]) for (const i of [-2, -1, 0, 1, 2])
      box(darkwood, w * 0.041, rise * 0.135, 0.055, i * w * 0.08, upper + rise * 0.09, s * (d * 0.2 + 0.02));
    hip(w * 0.51, d * 0.51, upper + rise * 0.08, rise * 0.61, 0.5 * size);
    const peak = upper + rise * 0.69;
    tube(gold, new THREE.Vector3(0, peak, 0), new THREE.Vector3(0, peak + 0.85 * size, 0), 0.15 * size, 8, 0.025 * size);
  }
  for (const [m, parts] of batches) {
    const mesh = new THREE.Mesh(mergeGeometries(parts)!, m);
    parts.forEach(g => g.dispose());
    mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
  }
  return group;
}

const gateGold = new THREE.MeshStandardMaterial({ color: 0xffbe40, emissive: 0x6c3307, emissiveIntensity: 0.34, roughness: 0.48, metalness: 0.30 });
export const gateTiles = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.40, 0.11, 0.06), roughness: 0.9 });
