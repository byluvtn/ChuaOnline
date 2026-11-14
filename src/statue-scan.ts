import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadModel } from './models';
import { VUON_THAP, VUON_THAP_PLAT } from './layout';
import { stoneTexture } from './textures';

const LOCAL = { x: -5.4, z: 2.3 };
const PED_W = 1.9;
const PED_H = 0.55;
const TARGET_HEIGHT = 1.6;
const COLLIDER_R = 1.2;

let goldEnv: THREE.Texture | null = null;

function getGoldEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  if (!goldEnv) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    goldEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  return goldEnv;
}

export function makeGoldMaterial(renderer: THREE.WebGLRenderer): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1.0, roughness: 0.2, envMap: getGoldEnv(renderer), envMapIntensity: 1.0 });
}

export function buildSeatedBuddhaStatue(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  colliders: { x: number; z: number; r: number }[],
) {
  const root = new THREE.Group();
  root.name = 'statue-scan-vuon-thap';
  const gx = VUON_THAP.x + LOCAL.x;
  const gz = VUON_THAP.z + LOCAL.z;
  const baseY = VUON_THAP_PLAT.y;
  root.position.set(gx, baseY, gz);

  const pedM = new THREE.MeshStandardMaterial({ color: 0x9a9690, roughness: 0.95, map: stoneTexture([158, 154, 148], [1, 1], 2) });
  const ped = new THREE.Mesh(new THREE.BoxGeometry(PED_W, PED_H, PED_W), pedM);
  ped.position.y = PED_H / 2;
  ped.castShadow = ped.receiveShadow = true;
  root.add(ped);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(PED_W + 0.2, 0.12, PED_W + 0.2), pedM);
  cap.position.y = PED_H + 0.06;
  cap.castShadow = cap.receiveShadow = true;
  root.add(cap);
  const topY = PED_H + 0.12;

  const placeholder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.55, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xb9ad94, roughness: 0.95 }),
  );
  placeholder.position.y = topY + 0.55;
  placeholder.castShadow = placeholder.receiveShadow = true;
  root.add(placeholder);

  scene.add(root);
  colliders.push({ x: gx, z: gz, r: COLLIDER_R });

  const loadBuddha = (retry: boolean): Promise<void> => loadModel('seated-buddha')
    .then((model) => {
      if (!model) { console.warn('seated-buddha.glb không tải được, giữ khối đá giữ chỗ'); if (retry) setTimeout(() => { void loadBuddha(false); }, 20000); return; }
      const gold = makeGoldMaterial(renderer);
      const inst = model.clone(true);
      inst.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.material = gold; m.castShadow = true; m.receiveShadow = true; }
      });
      const box = new THREE.Box3().setFromObject(inst);
      const size = box.getSize(new THREE.Vector3());
      const k = size.y > 0 ? TARGET_HEIGHT / size.y : 1;
      inst.scale.multiplyScalar(k);
      const b2 = new THREE.Box3().setFromObject(inst);
      const center = b2.getCenter(new THREE.Vector3());
      inst.position.x -= center.x;
      inst.position.z -= center.z;
      inst.position.y += topY - b2.min.y;
      const wrap = new THREE.Group();
      wrap.add(inst);
      wrap.rotation.y = 0;
      root.add(wrap);
      root.remove(placeholder);
      placeholder.geometry.dispose();
    })
    .catch((e) => { console.warn('seated-buddha: lỗi dựng tượng', e); });
  void loadBuddha(true);

  return root;
}
