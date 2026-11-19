import * as THREE from 'three';

/**
 * Dense, batched scenery for the expansion's bamboo grove and pine hillside.
 *
 * Every part is queued into a `VegetationBatch` and emitted as one InstancedMesh
 * per (part, material) pair, so hundreds of culms, boughs and undergrowth tufts
 * cost a handful of draw calls instead of thousands. Callers pass the materials
 * so the scene keeps one shared palette; each material must be a neutral base
 * colour because per-instance tints arrive through `instanceColor`.
 */
export interface VegetationPartOptions {
  /** Receives a part key, e.g. 'bamboo-stem': only those cast shadows. */
  castShadow?: boolean | ((key: string) => boolean);
  receiveShadow?: boolean;
}

export class VegetationBatch {
  private readonly part = new THREE.Object3D();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly direction = new THREE.Vector3();
  private readonly batches = new Map<string, {
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
    transforms: THREE.Matrix4[];
    colors: (number | undefined)[];
  }>();

  private push(key: string, geometry: THREE.BufferGeometry, material: THREE.Material, color?: number) {
    let batch = this.batches.get(key);
    if (!batch) {
      batch = { geometry, material, transforms: [], colors: [] };
      this.batches.set(key, batch);
    }
    this.part.updateMatrix();
    batch.transforms.push(this.part.matrix.clone());
    batch.colors.push(color);
  }

  private shade(key: string, geometry: THREE.BufferGeometry, material: THREE.Material,
    x: number, y: number, z: number, sx: number, sy: number, sz: number,
    color?: number, rx = 0, ry = 0, rz = 0) {
    this.part.position.set(x, y, z);
    this.part.rotation.set(rx, ry, rz, 'YXZ');
    this.part.scale.set(sx, sy, sz);
    this.push(key, geometry, material, color);
  }

  private segment(key: string, geometry: THREE.BufferGeometry, material: THREE.Material,
    x: number, y: number, z: number, dx: number, dy: number, dz: number, radius: number, color?: number) {
    this.part.position.set(x + dx / 2, y + dy / 2, z + dz / 2);
    this.part.scale.set(radius, Math.hypot(dx, dy, dz), radius);
    this.part.quaternion.setFromUnitVectors(this.up, this.direction.set(dx, dy, dz).normalize());
    this.push(key, geometry, material, color);
  }

  /**
   * One culm: jointed, slightly curved internodes with node rings, side sprays of
   * leaf fans above mid-height, and a small fan at the tip. `lean` makes a whole
   * stand read as one wind-bent grove instead of a field of vertical sticks.
   */
  bambooCulm(x: number, y: number, z: number, height: number, radius: number, leanX: number, leanZ: number,
    stems: { geo: THREE.BufferGeometry; mat: THREE.Material },
    leaf: { geo: THREE.BufferGeometry; mat: THREE.Material },
    nodes: { geo: THREE.BufferGeometry; mat: THREE.Material },
    stemColors: readonly number[], leafColors: readonly number[], seed = 0, nodeCount = 6) {
    const stemColor = stemColors[seed % stemColors.length];
    const leafColor = leafColors[seed % leafColors.length];
    for (let i = 0; i < nodeCount; i++) {
      const t0 = i / nodeCount, t1 = (i + 1) / nodeCount;
      const r = radius * (1 - 0.44 * t0);
      this.segment('bamboo-stem', stems.geo, stems.mat,
        x + leanX * t0, y + height * t0, z + leanZ * t0,
        leanX / nodeCount, height / nodeCount, leanZ / nodeCount,
        r, shadeColor(stemColor, 1 - 0.11 * ((i + seed) % 3)));
      if (i > 0 && i < nodeCount - 1) {
        this.shade('bamboo-node', nodes.geo, nodes.mat,
          x + leanX * t0, y + height * t0, z + leanZ * t0,
          r * 1.12, radius * 0.34, r * 1.12, shadeColor(stemColor, 0.7));
      }
      if (i < 2) continue;
      for (const side of [-1, 1]) {
        const a = seed * 1.7 + i * 1.9 + (side > 0 ? 0 : Math.PI);
        const spread = 0.4 + 0.18 * ((i + seed) % 3);
        const ax = x + leanX * t1, ay = y + height * t1, az = z + leanZ * t1;
        const bx = ax + Math.cos(a) * spread, bz = az + Math.sin(a) * spread;
        const by = ay + 0.13;
        this.segment('bamboo-branch', nodes.geo, nodes.mat, ax, ay, az,
          bx - ax, by - ay, bz - az, radius * 0.19, shadeColor(stemColor, 0.66));
        for (let j = 0; j < 3; j++) {
          this.shade('bamboo-leaf', leaf.geo, leaf.mat,
            bx, by + (j - 1) * 0.09, bz,
            0.34 + j * 0.06, 0.9 + (j % 2) * 0.24, 0.18,
            shadeColor(leafColor, j === 1 ? 1 : j === 0 ? 0.86 : 1.12),
            Math.PI / 2 - 0.48, a + (j - 1) * 0.75, 0.16);
        }
      }
    }
    this.shade('bamboo-leaf', leaf.geo, leaf.mat, x + leanX, y + height + 0.24, z + leanZ,
      0.24, 1.1, 0.12, shadeColor(leafColor, 1.1), 0.18, seed * 1.7, 0.3);
  }

  /** Pine: leaning trunk, offset bough tiers and a broken crown. */
  pine(x: number, y: number, z: number, height: number, radius: number,
    trunk: { geo: THREE.BufferGeometry; mat: THREE.Material },
    needle: { geo: THREE.BufferGeometry; mat: THREE.Material },
    barkColors: readonly number[], needleColors: readonly number[], seed: number, tiers = 3) {
    const lean = height * (seed % 2 ? 0.05 : -0.035);
    const ax = Math.cos(seed * 2.1) * lean, az = Math.sin(seed * 2.1) * lean;
    const trunkH = height * 0.74;
    const bark = barkColors[seed % barkColors.length];
    this.segment('pine-trunk', trunk.geo, trunk.mat, x, y, z, ax, trunkH, az, radius, bark);
    for (let k = 0; k < tiers; k++) {
      const t = 0.24 + k * (0.46 / Math.max(1, tiers - 1));
      const bx = x + ax * t, by = y + trunkH * t, bz = z + az * t;
      const phase = seed + k * 2.1;
      const reach = radius * 1.6 * (1 - k * 0.22);
      const tx = bx + Math.cos(phase) * reach, tz = bz + Math.sin(phase) * reach;
      const tierR = radius * (5.2 - k * 1.15);
      this.shade('pine-needles', needle.geo, needle.mat,
        tx, by + height * 0.06, tz,
        tierR, height * (0.3 - t * 0.1), tierR,
        needleColors[(seed + k) % needleColors.length], 0, phase);
      this.segment('pine-limb', trunk.geo, trunk.mat, bx, by, bz,
        tx - bx, 0.12, tz - bz, radius * 0.34, shadeColor(bark, 0.9));
    }
    this.shade('pine-needles', needle.geo, needle.mat, x + ax, y + height * 0.83, z + az,
      radius * 1.7, height * 0.22, radius * 1.7,
      needleColors[(seed + 1) % needleColors.length], 0, seed * 1.9);
  }

  /** Old-growth hardwood: buttress roots, a heavy leaning trunk and wide crown lobes. */
  ancientTree(x: number, y: number, z: number, height: number, radius: number,
    trunk: { geo: THREE.BufferGeometry; mat: THREE.Material },
    crown: { geo: THREE.BufferGeometry; mat: THREE.Material },
    barkColors: readonly number[], leafColors: readonly number[], seed: number) {
    const bark = barkColors[seed % barkColors.length];
    this.segment('ancient-trunk', trunk.geo, trunk.mat, x, y, z,
      radius * 0.5, height * 0.6, -radius * 0.3, radius, bark);
    for (let i = 0; i < 5; i++) {
      const a = seed + (i / 5) * Math.PI * 2;
      this.segment('ancient-root', trunk.geo, trunk.mat,
        x + Math.cos(a) * radius * 0.2, y + 0.06, z + Math.sin(a) * radius * 0.2,
        Math.cos(a) * radius * 2.4, -0.3, Math.sin(a) * radius * 2.4,
        radius * 0.4, shadeColor(bark, 0.88));
    }
    const topX = x + radius * 0.5, topZ = z - radius * 0.3, topY = y + height * 0.58;
    const lobes: [number, number, number, number, number][] = [
      [0, 0, 1.0, 1.0, 0], [1, 0.4, 0.62, 0.72, 1], [-1, -0.5, 0.58, 0.7, 2],
      [0.5, -1, 0.55, 0.66, 3], [-0.6, 0.9, 0.5, 0.62, 1],
    ];
    for (const [ox, oz, sxz, sy, ci] of lobes) {
      const wx = topX + ox * radius * 3.2, wz = topZ + oz * radius * 3.2;
      this.segment('ancient-limb', trunk.geo, trunk.mat, topX, topY, topZ,
        wx - topX, height * 0.22 * sy, wz - topZ, radius * 0.34, shadeColor(bark, 0.97));
      this.shade('ancient-crown', crown.geo, crown.mat,
        wx, topY + height * 0.24 * sy, wz,
        radius * (4.4 + sxz * 1.4) * sxz, height * 0.28 * sy, radius * (4.4 + sxz * 1.4) * sxz,
        leafColors[ci % leafColors.length], 0.16 * (ci % 2 ? 1 : -1), seed + ci);
    }
    this.shade('ancient-crown', crown.geo, crown.mat, topX, topY + height * 0.36, topZ,
      radius * 5.2, height * 0.4, radius * 5.2,
      leafColors[(seed + 2) % leafColors.length], 0.1, seed + 4);
  }

  /** Low moss tuft: keeps bare ground between trunks from reading as a lawn. */
  mossClump(x: number, y: number, z: number, radius: number,
    geo: THREE.BufferGeometry, mat: THREE.Material, colors: readonly number[], seed: number) {
    this.shade('moss', geo, mat, x, y + radius * 0.2, z,
      radius * (1.1 + 0.25 * (seed % 3)), radius * 0.5, radius * (1.05 + 0.2 * (seed % 2)),
      colors[seed % colors.length], 0, seed * 2.3);
  }

  /** Upright fern blades fanned around a base point. */
  undergrowth(x: number, y: number, z: number, scale: number,
    blade: THREE.BufferGeometry, mat: THREE.Material, colors: readonly number[], seed: number, blades = 5) {
    for (let i = 0; i < blades; i++) {
      const a = seed * 2.7 + (i / blades) * Math.PI * 2;
      this.shade('undergrowth', blade, mat,
        x + Math.cos(a) * scale * 0.16, y, z + Math.sin(a) * scale * 0.16,
        scale * 0.5, scale * (1.05 + 0.25 * (i % 3)), scale * 0.5,
        colors[(seed + i) % colors.length], 0.32 + (i % 3) * 0.1, a, 0);
    }
  }

  /** Total instances queued; reported in the dev summary. */
  get instances() {
    let total = 0;
    for (const batch of this.batches.values()) total += batch.transforms.length;
    return total;
  }

  /** Draw calls this batch will emit. */
  get drawCalls() {
    let total = 0;
    for (const batch of this.batches.values()) if (batch.transforms.length) total++;
    return total;
  }

  build(name: string, options: VegetationPartOptions = {}) {
    const group = new THREE.Group();
    group.name = name;
    const color = new THREE.Color();
    const shadow = options.castShadow ?? false;
    for (const [key, batch] of this.batches) {
      if (!batch.transforms.length) continue;
      const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.transforms.length);
      mesh.name = `${name}-${key}`;
      const useColor = batch.colors.some(c => c !== undefined);
      batch.transforms.forEach((matrix, i) => {
        mesh.setMatrixAt(i, matrix);
        if (useColor) {
          const hex = batch.colors[i];
          mesh.setColorAt(i, typeof hex === 'number' ? color.setHex(hex) : color.setHex(0xffffff));
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = typeof shadow === 'function' ? shadow(key) : shadow;
      mesh.receiveShadow = options.receiveShadow ?? true;
      group.add(mesh);
    }
    return group;
  }
}

/** Lighten/darken a 0xRRGGBB colour without clipping channels. */
export function shadeColor(hex: number, k: number) {
  const r = Math.min(255, Math.max(0, Math.round(((hex >> 16) & 255) * k)));
  const g = Math.min(255, Math.max(0, Math.round(((hex >> 8) & 255) * k)));
  const b = Math.min(255, Math.max(0, Math.round((hex & 255) * k)));
  return (r << 16) | (g << 8) | b;
}

/**
 * A tapered, slightly curved blade: base at y = 0, tip at y = height, bending
 * along +Z. Used for bamboo leaf fans and fern undergrowth.
 */
export function bladeGeometry(width = 1, height = 1, segments = 3) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const w = width * (0.5 - Math.abs(t - 0.45) * 0.55) * (1 - t * 0.35);
    const bend = t * t * height * 0.16;
    positions.push(-w, t * height, bend, w, t * height, bend);
    if (i) {
      const a = (i - 1) * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
