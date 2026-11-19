import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ZAFU_SCALE } from '../shared/campus';

export interface ZafuPosition {
  x: number;
  z: number;
  y?: number;
  depthRadius?: number;
  radius?: number;
  height?: number;
  ry?: number;
}

const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.84 });
let geometry: THREE.BufferGeometry | undefined;

function lotusCushion() {
  if (geometry) return geometry;
  const parts: THREE.BufferGeometry[] = [];
  const tint = (g: THREE.BufferGeometry, hex: number) => {
    const c = new THREE.Color(hex);
    const color = new Float32Array(g.getAttribute('position').count * 3);
    for (let i = 0; i < color.length; i += 3) c.toArray(color, i);
    g.setAttribute('color', new THREE.BufferAttribute(color, 3));
    parts.push(g);
  };
  const turn = (profile: [number, number][], hex: number) => {
    tint(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 24), hex);
  };
  turn([[0,0],[.70,0],[.84,.10],[.90,.32],[.83,.49],[0,.49]], 0x8f3d52);
  turn([[.80,.20],[.91,.22],[.92,.27],[.84,.28]], 0xe3b84f);
  turn([[0,.40],[.69,.40],[.79,.58],[.76,.80],[.65,.96],[.46,1],[0,1]], 0xe99fb0);
  turn([[0,.99],[.30,.99],[.33,1.05],[.24,1.10],[0,1.10]], 0xe9c96a);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * 2 * Math.PI, bead = new THREE.SphereGeometry(.045, 6, 4);
    bead.translate(Math.cos(a) * .17, 1.09, Math.sin(a) * .17);
    tint(bead, 0x8c6a2a);
  }
  for (const row of [0, 1]) {
    const count = row === 0 ? 12 : 10;
    for (let i = 0; i < count; i++) {
      const a = (i + row * 0.5) / count * 2 * Math.PI;
      const petal = new THREE.SphereGeometry(1, 8, 4);
      const p = petal.getAttribute('position');
      for (let j = 0; j < p.count; j++) {
        const u = (p.getZ(j) + 1) / 2;
        p.setXYZ(j, p.getX(j) * (.235 - .09 * u),
          p.getY(j) * .13 + (row === 0 ? .38 - .16 * u : .48 + .39 * u),
          row === 0 ? .60 + .4 * u : .59 + .31 * u);
      }
      p.needsUpdate = true;
      petal.computeVertexNormals();
      petal.rotateY(a);
      tint(petal, row === 0 ? (i % 2 ? 0xc86880 : 0xd9778b) : (i % 2 ? 0xf29eaa : 0xf6a8b4));
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (i + .25) / 8 * 2 * Math.PI, petal = new THREE.SphereGeometry(1, 8, 4), p = petal.getAttribute('position');
    for (let j = 0; j < p.count; j++) {
      const u = (p.getZ(j) + 1) / 2;
      p.setXYZ(j, p.getX(j) * (.15 - .06 * u), p.getY(j) * .1 + .86 + .1 * u, .2 + .26 * u);
    }
    p.needsUpdate = true;
    petal.computeVertexNormals();
    petal.rotateY(a);
    tint(petal, i % 2 ? 0xfcc3cc : 0xf8b0bb);
  }
  geometry = mergeGeometries(parts)!;
  parts.forEach(g => g.dispose());
  return geometry;
}

/** Sizes refer to the old cushion. Scale from its floor contact, not its center. */
export function buildZafu(radius: number, height: number, baseY: number, positions: readonly ZafuPosition[]) {
  const cushions = new THREE.InstancedMesh(lotusCushion(), material, positions.length);
  cushions.name = 'zafu-lotus';
  cushions.receiveShadow = true;
  const transform = new THREE.Object3D();
  positions.forEach((p, i) => {
    const r = p.radius ?? radius;
    transform.position.set(p.x, p.y ?? baseY, p.z);
    transform.rotation.y = p.ry ?? 0;
    transform.scale.set(r * ZAFU_SCALE, (p.height ?? height) * ZAFU_SCALE, (p.depthRadius ?? r) * ZAFU_SCALE);
    transform.updateMatrix();
    cushions.setMatrixAt(i, transform.matrix);
  });
  cushions.instanceMatrix.needsUpdate = true;
  return cushions;
}
