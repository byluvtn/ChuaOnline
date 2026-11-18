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

/** Replace only the architectural shell; gameplay objects remain in the parent. */
export function replaceRoof(parent: THREE.Group, fallback: THREE.Group, name: string): void {
  fallback.userData.asset = name;
  fallback.userData.source = 'procedural-fallback';
  void loadModel(name).then(model => {
    if (!model || !fallback.parent) return;
    const instance = model.clone(true);
    instance.name = name;
    instance.userData.source = 'blender';
    parent.add(instance);
    parent.remove(fallback);
    fallback.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
  }).catch(error => console.warn(`Roof ${name}: keeping fallback`, error));
}

/** Replace a complete static model while preserving an immediately visible fallback. */
export function replaceModel(parent: THREE.Group, fallback: THREE.Object3D, name: string, height?: number, material?: THREE.Material, anchor?: 'base'): void {
  fallback.userData.asset = name;
  fallback.userData.source = 'procedural-fallback';
  void loadModel(name).then(model => {
    if (!model || fallback.parent !== parent) return;
    const instance = height === undefined ? model.clone(true) : fitModel(model.clone(true), height, anchor);
    instance.name = name;
    instance.position.copy(fallback.position);
    instance.rotation.copy(fallback.rotation);
    if (height === undefined) instance.scale.copy(fallback.scale);
    if (material) instance.traverse(o => { if (o instanceof THREE.Mesh) o.material = material; });
    instance.userData.source = 'blender';
    parent.add(instance);
    parent.remove(fallback);
    // Procedural geometry can be shared by other instances; leave its buffers cached.
  }).catch(error => console.warn(`Model ${name}: keeping fallback`, error));
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
export function fitModel(model: THREE.Object3D, height: number, anchor?: 'base'): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(model, anchor === 'base');
  const size = box.getSize(new THREE.Vector3());
  const k = size.y > 0 ? height / size.y : 1;
  model.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(model, anchor === 'base');
  if (anchor === 'base') {
    // Center the contact area, not the silhouette (which may include an outstretched hand).
    const base = new THREE.Box3();
    const point = new THREE.Vector3();
    model.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return;
      const positions = o.geometry.getAttribute('position');
      if (!positions) return;
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(o.matrixWorld);
        if (point.y <= b2.min.y + 0.15) base.expandByPoint(point);
      }
    });
    if (!base.isEmpty()) {
      const center = base.getCenter(point);
      model.position.x -= center.x;
      model.position.z -= center.z;
    }
  }
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
