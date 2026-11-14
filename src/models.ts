import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Group | null>>();

/**
 * Loads /models/<name>.glb. Resolves null when the file is missing or invalid,
 * so callers keep their procedural fallback. Result is cached; use clone().
 */
export function loadModel(name: string): Promise<THREE.Group | null> {
  let p = cache.get(name);
  if (!p) {
    p = loadWithRetry(name).then((g) => {
      if (!g) cache.delete(name); // hết lần thử: cho phép gọi lại ở lần sau
      return g;
    });
    cache.set(name, p);
  }
  return p;
}

const RETRY_DELAYS_MS = [2000, 5000]; // 3 lần thử: ngay, +2 s, +5 s

async function loadOnce(name: string): Promise<THREE.Group | null> {
  try {
    const r = await fetch(`/models/${name}.glb`, { method: 'HEAD' });
    if (!r.ok || (r.headers.get('content-type') ?? '').includes('text/html')) return null;
    const g = await loader.loadAsync(`/models/${name}.glb`);
    g.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    return g.scene;
  } catch {
    return null;
  }
}

async function loadWithRetry(name: string): Promise<THREE.Group | null> {
  for (let i = 0; ; i++) {
    const g = await loadOnce(name);
    if (g || i >= RETRY_DELAYS_MS.length) return g;
    await new Promise((res) => setTimeout(res, RETRY_DELAYS_MS[i]));
  }
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
const gltfCache = new Map<string, Promise<GLTF | null>>();

/**
 * Like loadModel but resolves the whole GLTF (scene + animations).
 * Resolves null when the file is missing or invalid. Clone skinned scenes
 * with SkeletonUtils.clone, not Object3D.clone.
 */
export function loadGltf(name: string): Promise<GLTF | null> {
  let p = gltfCache.get(name);
  if (!p) {
    p = fetch(`/models/${name}.glb`, { method: 'HEAD' })
      .then((r) => (r.ok && !(r.headers.get('content-type') ?? '').includes('text/html') ? loader.loadAsync(`/models/${name}.glb`) : null))
      .then((g) => {
        if (!g) return null;
        g.scene.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });
        return g;
      })
      .catch(() => null)
      .then((g) => {
        if (!g) gltfCache.delete(name);
        return g;
      });
    gltfCache.set(name, p);
  }
  return p;
}
