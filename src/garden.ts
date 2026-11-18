import * as THREE from 'three';
import { loadModel, fitModel } from './models';
import { toon } from './toon';
import { groundYBase, nearWalkway } from './layout';

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
  p('oak-natural', -24.8, -4.5, 0, 9.0, null, 0.4),
  p('oak-natural', 23, 6, Math.PI, 9.0, null, 0.4),
  p('birch_nt', -40, -22, 0.5, 9.7, null, 0.4),
  p('birch_nt', -42, -34, 3.0, 9.7, null, 0.4),
  p('bamboo_cluster', -41, -36.5, 1.1, 4.4, null, 0.4),
  p('bamboo_cluster', 54.5, -20, 2.4, 4.4, null, 0.4),
  p('stone_lantern', -37.5, -26, 0, 2.15, null, 0.3),
  p('stone_lantern', -30.5, -26, 0, 2.15, null, 0.3),
  p('stone_lantern', 45, -66, 0, 2.15, null, 0.3),
  p('stone_lantern', 15.5, 17, 0, 2.15, null, 0.3),
  p('stone_lantern', -15.5, 17, 0, 2.15, null, 0.3),
  p('stone_lantern', -26, -18, 0, 2.15, null, 0.3),
  p('stone_lantern', 26, -18, 0, 2.15, null, 0.3),
  p('stone_lantern', -25, -32, 0, 2.15, null, 0.3),
  p('stone_lantern', 28, -30, 0, 2.15, null, 0.3),
  p('pagoda', 53, -66, 0, 5.1, null, 1.3),
  p('zen_sand_garden', -34, -26, 0.2, null, 2.0, null),
  p('oak-natural', 42, 36.5, 2.1, 9.1, null, 0.5),
  p('oak_nt', 10, 28, 0.9, 8.9, null, 0.8),
  p('oak-natural', -48, -15, 0, 9.0, null, 0.4),
  p('cenji-ancient-tree', 40, 20, 0.4, null, 1.0, 1.5),
  p('wooden_bench', 35.5, 20, Math.PI / 2, null, 1.125, 0.5),
  p('willow-sketchfab-S', -14, 30, 0.4, 13, null, 1.0),
];

const ZEN_STONES: { x: number; z: number; r: number }[] = [
  // Đá thiền vườn cát (vườn cát GLB không có collider, chỉ đá)
  { x: -34, z: -26, r: 0.65 },
  { x: -33.3, z: -25.6, r: 0.45 },
  { x: -34.5, z: -25.45, r: 0.38 },
];

function toToon(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const src = (Array.isArray(m.material) ? m.material[0] : m.material) as
      | (THREE.Material & {
          color?: THREE.Color;
          map?: THREE.Texture | null;
          alphaMap?: THREE.Texture | null;
        })
      | undefined;
    const color = src && src.color ? src.color.clone() : new THREE.Color(0xffffff);
    // Giữ alpha cắt (lá liễu: alphaMode MASK) và hai mặt, nếu không lá thành tấm đặc.
    const extra: Partial<THREE.MeshToonMaterialParameters> = {};
    if (src && src.alphaTest > 0) extra.alphaTest = src.alphaTest;
    if (src && src.side === THREE.DoubleSide) extra.side = THREE.DoubleSide;
    if (src && src.alphaMap) extra.alphaMap = src.alphaMap;
    // Model chỉ có màu đỉnh (COLOR_0, không map) phải bật vertexColors, nếu không sẽ render trắng.
    const hasVtxColor = !!m.geometry.getAttribute('color');
    m.material =
      src && src.map
        ? toon(color, { map: src.map, ...extra })
        : hasVtxColor
          ? toon(color, { vertexColors: true, ...extra })
          : toon(color, extra);
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
  outer.position.set(g.x, groundYBase(g.x, g.z), g.z);
  return outer;
}

export function buildGarden(
  scene: THREE.Scene,
  colliders: { x: number; z: number; r: number }[],
): void {
  // Collider vườn chỉ được thêm khi GLB tương ứng đã tải xong, nên GLB lỗi không để lại tường vô hình.
  // Đánh đổi: pathfinder dựng ngay sau createWorld nên không gồm các collider này (giống collider
  // cây vườn dynColliders thêm lúc chạy); collide() vẫn chặn di chuyển.

  const names = Array.from(new Set(GARDEN_PLACEMENTS.map((g) => g.name)));
  for (const name of names) {
    loadModel(name)
      .then(async (loaded) => {
        const base = loaded ?? (name === 'oak-natural' ? await loadModel('swing-oak') : null);
        if (!base) {
          console.warn(name + '.glb khong tai duoc');
          return;
        }
        for (const g of GARDEN_PLACEMENTS) {
          if (g.name !== name) continue;
          if (/^(oak|birch|bamboo|willow|cenji)/.test(name) && nearWalkway(g.x, g.z, (g.colliderR ?? 0) + 0.7)) continue;
          scene.add(buildInstance(base, g));
          if (g.colliderR !== null) colliders.push({ x: g.x, z: g.z, r: g.colliderR });
        }
        if (name === 'zen_sand_garden') for (const s of ZEN_STONES) colliders.push({ x: s.x, z: s.z, r: s.r });
      })
      .catch(() => {
        console.warn(name + '.glb khong tai duoc');
      });
  }
}
