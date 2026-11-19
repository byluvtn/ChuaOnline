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
const TREE_COLORS = [[0x2f5d3c, 0x4a8a46, 0x74a652], [0x2d5a46, 0x4a8a6a, 0x7bb08a], [0x4f7a3a, 0x7fa54c, 0xb4c460], [0x335f3e, 0x4c8548, 0x6aa150]];
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
    const v = variant % TREE_COLORS.length;
    const colors = TREE_COLORS[v];
    const bark = v === 1 ? 0x7a644c : v === 2 ? 0x5e4733 : 0x58402d;
    const lean = h * 0.07;
    const dx = Math.cos(a) * lean, dz = Math.sin(a) * lean;
    const trunkH = h * (v === 1 ? 0.62 : 0.5);
    for (let i = 0; i < 4; i++) {
      const t = a + i * 1.7 + 0.4;
      this.stem(x + Math.cos(t) * h * 0.045, y - 0.02, z + Math.sin(t) * h * 0.045,
        Math.cos(t) * h * 0.05, h * 0.07, Math.sin(t) * h * 0.05, h * 0.026, bark);
    }
    this.stem(x, y - 0.03, z, dx, trunkH, dz, h * 0.05, bark);
    const fx = x + dx, fy = y + trunkH * 0.96, fz = z + dz;
    const limbs = v === 1 ? 3 : 4;
    const reach = h * (v === 1 ? 0.12 : v === 2 ? 0.26 : 0.22);
    for (let i = 0; i < limbs; i++) {
      const t = a + i * (tau / limbs) + 0.5, rise = h * (0.2 + (i % 2) * 0.07);
      const lx = Math.cos(t) * reach, lz = Math.sin(t) * reach;
      this.stem(fx, fy, fz, lx, rise, lz, h * 0.024, bark);
      const cx = fx + lx, cy = fy + rise, cz = fz + lz;
      const r = h * (v === 1 ? 0.14 : 0.17 + (i % 2) * 0.025);
      this.shape(crown, solid, colors[i % 3], cx, cy + r * 0.2, cz, r * 1.2, r * 0.8, r * 1.1, 0.2, t, 0.15);
      this.shape(crown, solid, colors[(i + 1) % 3], cx + lx * 0.28, cy + r * 0.62, cz + lz * 0.28, r * 0.78, r * 0.58, r * 0.74, -0.12, t + 0.9);
      if (v === 2) {
        this.shape(small, petals, 0xf4b6cb, cx + lx * 0.4, cy + r * 0.92, cz + lz * 0.4, r * 0.34, r * 0.26, r * 0.34);
        this.shape(small, petals, 0xffd7e3, cx - lx * 0.3, cy + r * 0.78, cz - lz * 0.3, r * 0.28, r * 0.22, r * 0.28);
      }
    }
    const top = h * (v === 1 ? 0.2 : 0.17);
    this.shape(crown, solid, colors[2], fx, fy + h * (v === 1 ? 0.42 : 0.34), fz, top * 1.15, top * 0.9, top, 0.1, a);
    this.shape(crown, solid, colors[1], fx - dx * 0.2, fy + h * 0.2, fz - dz * 0.2, top * 1.3, top * 0.72, top * 1.2, 0, a + 1.1);
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
