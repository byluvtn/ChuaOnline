import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface ZafuParts {
  body: THREE.InstancedMesh;
  ring: THREE.InstancedMesh;
  button: THREE.InstancedMesh;
}

interface ZafuGeo {
  body: THREE.BufferGeometry;
  ring: THREE.BufferGeometry;
  button: THREE.BufferGeometry;
}

const RED = 0xa0201a;
const GOLD = 0xe8b83a;
const BASE_DISC_H = 0.02;

// Vật liệu và geometry dùng chung ở cấp module.
const bodyMat = new THREE.MeshStandardMaterial({ color: RED, roughness: 0.8 });
const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.6 });
const geoCache = new Map<string, ZafuGeo>();

function getGeo(radius: number, height: number): ZafuGeo {
  const key = `${radius}|${height}`;
  const hit = geoCache.get(key);
  if (hit) return hit;

  const half = height / 2;

  // Thân: cầu dẹt, tâm tại gốc local. Cộng đĩa đáy mỏng để không hở khe với chiếu.
  const sphere = new THREE.SphereGeometry(radius, 24, 16);
  sphere.scale(1, half / radius, 1);
  const disc = new THREE.CylinderGeometry(radius, radius, BASE_DISC_H, 24);
  disc.translate(0, -half + BASE_DISC_H / 2, 0);
  const body = mergeGeometries([sphere, disc], false);
  sphere.dispose();
  disc.dispose();
  if (!body) throw new Error('zafu: mergeGeometries failed');

  // Vòng khâu: nằm ngang tại mặt phẳng rộng nhất của thân.
  const ring = new THREE.TorusGeometry(radius * 0.97, 0.018, 8, 32);
  ring.rotateX(Math.PI / 2);

  // Nút giữa mặt trên.
  const button = new THREE.SphereGeometry(radius * 0.12, 12, 8);
  button.scale(1, 0.5, 1);

  const geo: ZafuGeo = { body, ring, button };
  geoCache.set(key, geo);
  return geo;
}

/**
 * Tạo bộ 3 InstancedMesh (thân, vòng khâu, nút) cho một site.
 * radius/height: họ A (0.38, 0.10) hoặc họ B (0.49, 0.12).
 * topY: cao độ mặt đệm (cùng giá trị top của đệm trụ cũ).
 * positions: tọa độ x/z từng đệm (giữ nguyên như đệm cũ).
 * Lưu ý: nếu add vào group có mergeStaticByMaterial thì phải add SAU lệnh merge.
 */
export function buildZafuParts(
  radius: number,
  height: number,
  topY: number,
  positions: { x: number; z: number }[],
): ZafuParts {
  const geo = getGeo(radius, height);
  const n = positions.length;

  const body = new THREE.InstancedMesh(geo.body, bodyMat, n);
  const ring = new THREE.InstancedMesh(geo.ring, goldMat, n);
  const button = new THREE.InstancedMesh(geo.button, goldMat, n);

  const bodyY = topY - height / 2;
  const buttonY = topY - 0.005;
  const m = new THREE.Matrix4();

  for (let i = 0; i < n; i++) {
    const { x, z } = positions[i];
    body.setMatrixAt(i, m.makeTranslation(x, bodyY, z));
    ring.setMatrixAt(i, m.makeTranslation(x, bodyY, z));
    button.setMatrixAt(i, m.makeTranslation(x, buttonY, z));
  }
  body.instanceMatrix.needsUpdate = true;
  ring.instanceMatrix.needsUpdate = true;
  button.instanceMatrix.needsUpdate = true;

  body.receiveShadow = true;
  ring.receiveShadow = true;
  button.receiveShadow = true;
  return { body, ring, button };
}
