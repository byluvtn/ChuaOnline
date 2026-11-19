import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function surface(rows: number, cols: number, sample: (u: number, v: number) => [number, number, number, number], dark: number, light: number) {
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const a = new THREE.Color(dark), b = new THREE.Color(light), color = new THREE.Color();
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const [x, y, z, shade] = sample(i / cols, j / rows);
    positions.push(x, y, z);
    color.copy(a).lerp(b, shade).toArray(colors, colors.length);
    if (j && i) {
      const p = j * (cols + 1) + i;
      indices.push(p - cols - 2, p - 1, p - cols - 1, p - 1, p, p - cols - 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function tint(g: THREE.BufferGeometry, hex: number) {
  const colors = new Float32Array(g.getAttribute('position').count * 3);
  const color = new THREE.Color(hex);
  for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
  g.deleteAttribute('uv');
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

function bloom(bud: boolean) {
  const height = bud ? 0.72 : 0.55;
  const parts = [tint(new THREE.CylinderGeometry(0.024, 0.035, height, 7), 0x4e7939).translate(0, height / 2, 0)];
  // [petal count, length, half-width, spread, rise] from the outer ring inwards.
  const rings = bud ? [[7, 0.36, 0.105, 0.10, 0.33], [5, 0.33, 0.078, 0.044, 0.33]]
    : [[9, 0.39, 0.129, 0.36, 0.09], [8, 0.31, 0.106, 0.24, 0.18], [6, 0.23, 0.08, 0.135, 0.18]];
  for (const [ring, [count, length, width, spread, rise]] of rings.entries()) {
    const petal = surface(9, 6, (u, t) => {
      const across = 2 * u - 1, belly = Math.sin(Math.PI * t) ** 0.8;
      const radial = 0.045 + spread * t + (bud ? 0.075 : 0.036) * belly;
      const y = rise * t ** 1.2 + 0.31 * length * t * t + width * 0.48 * across ** 2 * belly;
      return [across * width * belly, y, radial, Math.min(1, 0.37 + 0.58 * belly - 0.19 * t + 0.13 * Math.abs(across))];
    }, ring === 0 ? 0xd74780 : 0xe95e92, ring === 0 ? 0xffc1cf : 0xffe5dd);
    for (let i = 0; i < count; i++) parts.push(petal.clone()
      .rotateY((i + ring * 0.47) * Math.PI * 2 / count).translate(0, height + ring * 0.028, 0));
    petal.dispose();
  }
  if (!bud) {
    parts.push(tint(new THREE.CylinderGeometry(0.093, 0.061, 0.069, 12), 0xc2b64a).translate(0, height + 0.15, 0));
    const seed = tint(new THREE.SphereGeometry(0.011, 6, 4), 0x79863c);
    const stamen = tint(new THREE.SphereGeometry(0.018, 6, 4), 0xffca58).scale(0.72, 1.9, 0.72);
    parts.push(seed.clone().translate(0, height + 0.186, 0));
    for (let i = 0; i < 18; i++) {
      const angle = i * Math.PI / 9;
      parts.push(stamen.clone().translate(Math.cos(angle) * 0.109, height + 0.14 + (i % 2) * 0.014, Math.sin(angle) * 0.109));
      if (i % 3 === 0) parts.push(seed.clone().translate(Math.cos(angle) * 0.055, height + 0.186, Math.sin(angle) * 0.055));
    }
    seed.dispose(); stamen.dispose();
  }
  const result = mergeGeometries(parts)!;
  parts.forEach(p => p.dispose());
  return result;
}

/** One instanced batch per growth stage, seeded placement with shoreline and bridge clearance. */
export function buildPondLotus(a: number, b: number, waterY: number, count: number, seed: number,
  clear: (x: number, z: number, radius: number) => boolean = () => true) {
  const group = new THREE.Group();
  group.name = 'pond-lotus';
  group.position.y = waterY;
  const leaf = surface(6, 72, (u, r) => {
    const angle = 2 * Math.PI * u;
    const wave = 1 + 0.045 * Math.sin(7 * angle) + 0.025 * Math.sin(11 * angle + 1);
    const vein = (0.5 + 0.5 * Math.cos(18 * angle)) ** 8 * r * (1 - r) * 1.8;
    return [r * wave * Math.cos(angle), 0.045 + r ** 3 * (0.09 + 0.04 * Math.sin(7 * angle)),
      -r * wave * Math.sin(angle), 0.18 + 0.44 * (1 - r) + vein];
  }, 0x276545, 0x8ab75b);
  const spots: { x: number; z: number; size: number; angle: number }[][] = [[], [], []];
  const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < count * 16 && spots[0].length < count; i++) {
    const angle = rand() * Math.PI * 2, r = Math.sqrt(rand()), size = 0.31 + rand() * 0.28;
    const x = Math.cos(angle) * r * (a - size - 0.1), z = Math.sin(angle) * r * (b - size - 0.1);
    if (!clear(x, z, Math.max(0.5, size * 1.08)) || spots[0].some(p => Math.hypot(x - p.x, z - p.z) < (size + p.size) * 0.74)) continue;
    const index = spots[0].length;
    const yaw = rand() * Math.PI * 2;
    spots[0].push({ x, z, size, angle: yaw });
    if (index % 3 === 0 || index % 7 === 0) spots[index % 7 === 0 ? 2 : 1].push({ x, z, size: 0.76 + rand() * 0.42, angle: yaw });
  }
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide });
  const transform = new THREE.Object3D();
  for (const [index, geometry] of [leaf, bloom(false), bloom(true)].entries()) {
    const mesh = new THREE.InstancedMesh(geometry, mat, spots[index].length);
    mesh.name = ['lotus-leaves', 'lotus-blossoms', 'lotus-buds'][index];
    mesh.receiveShadow = true;
    spots[index].forEach(({ x, z, size, angle }, i) => {
      transform.position.set(x, index === 0 ? (i % 4) * 0.008 : 0, z);
      transform.rotation.y = angle;
      transform.scale.setScalar(size);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
    });
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  return group;
}
