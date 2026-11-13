import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Group | null>>();

/**
 * Loads /models/<name>.glb. Resolves null when the file is missing or invalid,
 * so callers keep their procedural fallback. Result is cached; use clone().
 */
export function loadModel(name: string): Promise<THREE.Group | null> {
  let p = cache.get(name);
  if (!p) {
    p = fetch(`/models/${name}.glb`, { method: 'HEAD' })
      .then((r) => (r.ok && !(r.headers.get('content-type') ?? '').includes('text/html') ? loader.loadAsync(`/models/${name}.glb`) : null))
      .then((g) => {
        if (!g) return null;
        g.scene.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });
        return g.scene;
      })
      .catch(() => null)
      .then((g) => {
        if (!g) cache.delete(name); // lỗi mạng thoáng qua: cho phép thử lại ở lần gọi sau
        return g;
      });
    cache.set(name, p);
  }
  return p;
}

/** Scales model so its bounding-box height equals `height`, and sits it on y=0. */
export function fitModel(model: THREE.Object3D, height: number): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const k = size.y > 0 ? height / size.y : 1;
  model.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(model);
  model.position.y -= b2.min.y;
  const wrap = new THREE.Group();
  wrap.add(model);
  return wrap;
}
