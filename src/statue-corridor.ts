import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadModel } from './models';

export const CORRIDOR_STATUE_NAMES = ['arhat-binh', 'monk-go', 'guanyin-ngoi', 'guanyin-go-minh'] as const;

const TARGET_HEIGHT = 0.8;

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
  const box = new THREE.Box3().setFromObject(inst);
  const size = box.getSize(new THREE.Vector3());
  const k = size.y > 0 ? TARGET_HEIGHT / size.y : 1;
  inst.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(inst);
  const center = b2.getCenter(new THREE.Vector3());
  inst.position.x -= center.x;
  inst.position.z -= center.z;
  inst.position.y -= b2.min.y;
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
