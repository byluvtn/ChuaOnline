import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadModel } from './models';

export const CORRIDOR_STATUE_NAMES = ['arhat-binh', 'monk-go', 'guanyin-ngoi', 'guanyin-go-minh'] as const;

export const TARGET_HEIGHT = 1.6;

// Bbox tính từ POSITION của mọi đỉnh qua matrixWorld (không dùng Box3.setFromObject vì nó
// biến đổi bbox cục bộ của geometry nên có thể cao hơn thực tế khi node bị xoay/tịnh tiến).
function vertexBox(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const pos = (m.geometry as THREE.BufferGeometry).getAttribute('position');
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      box.expandByPoint(v);
    }
  });
  return box;
}

const FACE_OFFSET: Record<(typeof CORRIDOR_STATUE_NAMES)[number], number> = {
  'arhat-binh': 0,
  'monk-go': 0,
  'guanyin-ngoi': 0,
  'guanyin-go-minh': 0,
};

const UPRIGHT_X: Partial<Record<(typeof CORRIDOR_STATUE_NAMES)[number], number>> = {
  'arhat-binh': -Math.PI / 2,
};

let goldEnv: THREE.Texture | null = null;

function getGoldEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  if (!goldEnv) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    goldEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  return goldEnv;
}

function prepare(model: THREE.Group, gold: THREE.Material, offset: number, uprightX = 0): THREE.Group {
  const inst = model.clone(true);
  inst.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) { m.material = gold; m.castShadow = true; m.receiveShadow = true; }
  });
  if (uprightX) inst.rotation.x = uprightX;
  inst.updateMatrixWorld(true);
  const box = vertexBox(inst);
  const h = box.max.y - box.min.y;
  const k = h > 0 && Number.isFinite(h) ? TARGET_HEIGHT / h : 1;
  inst.scale.multiplyScalar(k);
  inst.updateMatrixWorld(true);
  const box2 = vertexBox(inst);
  if (!box2.isEmpty()) {
    const center = box2.getCenter(new THREE.Vector3());
    inst.position.x -= center.x;
    inst.position.z -= center.z;
    inst.position.y -= box2.min.y;
  }
  inst.updateMatrixWorld(true);
  const turn = new THREE.Group();
  turn.add(inst);
  turn.rotation.y = offset;
  const wrap = new THREE.Group();
  wrap.add(turn);
  return wrap;
}

/**
 * Tải 4 tượng scan, đổ vàng bóng. Trả về 4 mẫu (null nếu lỗi) để temple.ts clone;
 * mẫu null → temple.ts dùng tượng chibi buildArhat làm fallback.
 */
export function buildCorridorStatues(renderer: THREE.WebGLRenderer): Promise<(THREE.Group | null)[]> {
  const gold = new THREE.MeshStandardMaterial({
    color: 0xd4af37, metalness: 1.0, roughness: 0.2, envMap: getGoldEnv(renderer), envMapIntensity: 1.0,
  });
  return Promise.all(CORRIDOR_STATUE_NAMES.map(async (name) => {
    try {
      const model = await loadModel(name);
      if (!model) { console.warn(`${name}.glb không tải được, dùng tượng chibi dự phòng`); return null; }
      return prepare(model, gold, FACE_OFFSET[name], UPRIGHT_X[name] ?? 0);
    } catch (e) {
      console.warn(`${name}: lỗi dựng tượng`, e);
      return null;
    }
  }));
}
