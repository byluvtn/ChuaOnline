import * as THREE from 'three';

const tau = Math.PI * 2;
const cylinder = new THREE.CylinderGeometry(0.55, 1, 1, 7);
const crown = new THREE.IcosahedronGeometry(1, 1);
const small = new THREE.SphereGeometry(1, 7, 5);
const leaf = new THREE.BufferGeometry();
leaf.setAttribute('position', new THREE.Float32BufferAttribute([
  0, 0, 0, -0.52, 0.32, 0.06, -0.43, 0.75, -0.2, 0, 1, -0.5,
  0.43, 0.75, -0.2, 0.52, 0.32, 0.06, 0, 0.52, 0.27,
], 3));
leaf.setIndex([0, 6, 1, 1, 6, 2, 2, 6, 3, 3, 6, 4, 4, 6, 5, 5, 6, 0]);
leaf.computeVertexNormals();

const solid = new THREE.MeshStandardMaterial({ roughness: 0.88 });
const foliage = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide });
const petals = new THREE.MeshStandardMaterial({ roughness: 0.75, emissive: 0x140a10 });
const up = new THREE.Vector3(0, 1, 0);

export const FLOWER_COLORS = [0xff9bab, 0xffe2c0, 0xffc954, 0xd77ecb, 0x9b91e8];
const TREE_COLORS = [[0x315e40, 0x4a8047, 0x66984f], [0x315d48, 0x458267, 0x639571], [0x54703b, 0x78964b, 0xa7b55e]];
const LEAF_COLORS = [0x3f722f, 0x598f3b, 0x74a44c, 0x91b95c];

/** Static vegetation batched by shape and material, rather than one draw call per plant part. */
export class PlantBatch {
  private readonly part = new THREE.Object3D();
  private readonly direction = new THREE.Vector3();
  private readonly batches = new Map<THREE.BufferGeometry, Map<THREE.Material, { matrix: THREE.Matrix4; color: number }[]>>();

  private add(geometry: THREE.BufferGeometry, mat: THREE.Material, color: number) {
    let byMat = this.batches.get(geometry);
    if (!byMat) this.batches.set(geometry, byMat = new Map());
    let entries = byMat.get(mat);
    if (!entries) byMat.set(mat, entries = []);
    this.part.updateMatrix();
    entries.push({ matrix: this.part.matrix.clone(), color });
  }

  private shape(geometry: THREE.BufferGeometry, mat: THREE.Material, color: number,
    x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0) {
    this.part.position.set(x, y, z);
    this.part.rotation.set(rx, ry, rz, 'YXZ');
    this.part.scale.set(sx, sy, sz);
    this.add(geometry, mat, color);
  }

  private stem(x: number, y: number, z: number, dx: number, dy: number, dz: number, r: number, color: number) {
    this.part.position.set(x + dx / 2, y + dy / 2, z + dz / 2);
    this.part.scale.set(r, Math.hypot(dx, dy, dz), r);
    this.part.quaternion.setFromUnitVectors(up, this.direction.set(dx, dy, dz).normalize());
    this.add(cylinder, solid, color);
  }

  tree(x: number, y: number, z: number, h: number, variant: number, a: number) {
    const colors = TREE_COLORS[variant % TREE_COLORS.length];
    const dx = Math.cos(a) * h * 0.085, dz = Math.sin(a) * h * 0.085;
    const bark = variant === 1 ? 0x79634b : 0x58402d;
    this.stem(x, y - 0.03, z, dx, h * 0.57, dz, h * 0.052, bark);
    this.stem(x + dx, y + h * 0.56, z + dz, -dx * 0.45, h * 0.24, -dz * 0.45, h * 0.029, bark);
    for (let i = 0; i < 5; i++) {
      const t = a + i * 2.4, spread = h * (0.17 + (i % 3) * 0.026);
      const bx = Math.cos(t) * spread, bz = Math.sin(t) * spread;
      const by = h * (0.65 + (i % 3) * 0.055), r = h * (0.16 + (i % 2) * 0.022);
      this.stem(x + dx * 0.75, y + h * 0.42, z + dz * 0.75, bx, by - h * 0.42, bz, h * 0.022, bark);
      this.shape(crown, solid, colors[i % 3], x + dx * 0.75 + bx, y + by, z + dz * 0.75 + bz,
        r * 1.18, r * 0.82, r, 0.22, t, 0.18);
      this.shape(crown, solid, colors[(i + 1) % 3], x + dx * 0.75 + bx * 1.24, y + by + h * 0.035, z + dz * 0.75 + bz * 1.24,
        r * 0.67, r * 0.55, r * 0.75, -0.15, t + 0.8);
    }
    this.shape(crown, solid, colors[2], x + dx * 0.45, y + h * 0.83, z + dz * 0.45,
      h * 0.18, h * 0.17, h * 0.16, 0.12, a);
  }

  flower(x: number, y: number, z: number, h: number, color: number, a: number, petalsCount = 5) {
    const dx = Math.cos(a) * h * 0.14, dz = Math.sin(a) * h * 0.14;
    this.stem(x, y, z, dx, h, dz, h * 0.034, 0x477a39);
    for (let i = 0; i < 2; i++) {
      const level = 0.28 + i * 0.28;
      this.shape(leaf, foliage, LEAF_COLORS[i + 1], x + dx * level, y + h * level, z + dz * level,
        h * 0.14, h * 0.42, h * 0.35, 0.85, a + i * 2.7);
    }
    for (let i = 0; i < petalsCount; i++) {
      const t = a + i * tau / petalsCount;
      this.shape(small, petals, color, x + dx + Math.sin(t) * h * 0.18, y + h * 1.03, z + dz + Math.cos(t) * h * 0.18,
        h * 0.105, h * 0.052, h * 0.16, -0.32, t);
    }
    this.shape(small, petals, 0xe8ad41, x + dx, y + h * 1.06, z + dz, h * 0.12, h * 0.075, h * 0.12);
  }

  crop(x: number, y: number, z: number, type: 'cabbage' | 'mustard' | 'onion', size: number, a: number) {
    if (type === 'cabbage') {
      for (let i = 0; i < 9; i++) {
        const inner = i >= 6, s = size * (inner ? 0.65 : 1);
        this.shape(leaf, foliage, LEAF_COLORS[inner ? 3 : i % 3], x, y + size * 0.06, z,
          s * 0.75, s * 0.8, s * 0.68, inner ? 0.23 : 0.94, a + i * 2.4);
      }
      this.shape(small, solid, 0xa2bd62, x, y + size * 0.42, z, size * 0.34, size * 0.36, size * 0.34);
      return;
    }
    for (let i = 0; i < (type === 'onion' ? 5 : 7); i++) {
      const onion = type === 'onion', h = size * (1.17 + (i % 3) * 0.16);
      this.shape(leaf, foliage, onion ? [0x507c47, 0x7e9b5c][i % 2] : LEAF_COLORS[i % 4], x, y, z,
        size * (onion ? 0.14 : 0.51), h, size * 0.58, (onion ? 0.16 : 0.48) + (i % 3) * 0.15, a + i * 2.4);
    }
  }

  build(name: string, castShadow = false) {
    const group = new THREE.Group(); group.name = name;
    const color = new THREE.Color();
    for (const [geometry, byMat] of this.batches) for (const [mat, entries] of byMat) {
      const mesh = new THREE.InstancedMesh(geometry, mat, entries.length);
      entries.forEach((p, i) => { mesh.setMatrixAt(i, p.matrix); mesh.setColorAt(i, color.setHex(p.color)); });
      mesh.castShadow = castShadow; mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }
}
