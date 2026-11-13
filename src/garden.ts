import * as THREE from 'three';
import { loadModel, fitModel } from './models';
import { toon } from './toon';
import { groundY } from './layout';

export interface GardenPlacement {
  name: string;
  x: number;
  z: number;
  ry: number;
  height: number | null;
  scale: number | null;
  colliderR: number | null;
}

function p(
  name: string, x: number, z: number, ry: number,
  height: number | null, scale: number | null, colliderR: number | null,
): GardenPlacement {
  return { name, x, z, ry, height, scale, colliderR };
}

export const GARDEN_PLACEMENTS: GardenPlacement[] = [
  p('cherry_tree', -8.5, 12, 0, 4.7, null, 0.4),
  p('cherry_tree', 8.5, 12, 2.1, 4.7, null, 0.4),
  p('cherry_tree', -7.5, -1, 4.2, 4.7, null, 0.4),
  p('maple_tree', -40, -22, 0.5, 4.5, null, 0.4),
  p('maple_tree', -42, -34, 3.0, 4.5, null, 0.4),
  p('bamboo_cluster', -41, -36.5, 1.1, 4.4, null, 0.4),
  p('bamboo_cluster', 48, -24, 2.4, 4.4, null, 0.4),
  p('stone_lantern', -37.5, -26, 0, 2.15, null, 0.3),
  p('stone_lantern', -30.5, -26, 0, 2.15, null, 0.3),
  p('stone_lantern', 45, -66, 0, 2.15, null, 0.3),
  p('pagoda', 53, -66, 0, 5.1, null, 0.6),
  p('zen_sand_garden', -34, -26, 0.2, null, 1.5, null),
];

export const GARDEN_COLLIDERS: { x: number; z: number; r: number }[] = GARDEN_PLACEMENTS
  .filter((g) => g.colliderR !== null)
  .map((g) => ({ x: g.x, z: g.z, r: g.colliderR as number }));

function toToon(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const src = (Array.isArray(m.material) ? m.material[0] : m.material) as
      | (THREE.Material & { color?: THREE.Color; map?: THREE.Texture | null })
      | undefined;
    const color = src && src.color ? src.color.clone() : new THREE.Color(0xffffff);
    m.material = src && src.map ? toon(color, { map: src.map }) : toon(color);
    m.castShadow = true;
    m.receiveShadow = true;
  });
}

function buildInstance(base: THREE.Object3D, g: GardenPlacement): THREE.Object3D {
  const clone = base.clone(true);
  toToon(clone);

  let inner: THREE.Object3D;
  if (g.height !== null) {
    inner = fitModel(clone, g.height);
  } else {
    const s = g.scale ?? 1;
    clone.scale.multiplyScalar(s);
    inner = new THREE.Group();
    inner.add(clone);
    const b = new THREE.Box3().setFromObject(inner);
    clone.position.y -= b.min.y;
  }

  // Center the bounding box on x/z so rotation happens around the middle.
  const box = new THREE.Box3().setFromObject(inner);
  const c = box.getCenter(new THREE.Vector3());
  inner.position.x -= c.x;
  inner.position.z -= c.z;

  const outer = new THREE.Group();
  outer.add(inner);
  outer.rotation.y = g.ry;
  outer.position.set(g.x, groundY(g.x, g.z), g.z);
  return outer;
}

export function buildGarden(
  scene: THREE.Scene,
  colliders: { x: number; z: number; r: number }[],
): void {
  // Synchronous: the pathfinder is built right after createWorld returns.
  for (const c of GARDEN_COLLIDERS) colliders.push({ x: c.x, z: c.z, r: c.r });

  const names = Array.from(new Set(GARDEN_PLACEMENTS.map((g) => g.name)));
  for (const name of names) {
    loadModel(name)
      .then((base) => {
        if (!base) {
          console.warn(name + '.glb khong tai duoc');
          return;
        }
        for (const g of GARDEN_PLACEMENTS) {
          if (g.name !== name) continue;
          scene.add(buildInstance(base, g));
        }
      })
      .catch(() => {
        console.warn(name + '.glb khong tai duoc');
      });
  }
}
