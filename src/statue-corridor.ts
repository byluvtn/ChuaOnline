import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { duocSuStyle } from './duoc-su-style';
import { fitModel, loadModel } from './models';
import { buildArhat, buildQuanAm } from './statues';
import { buildHalo, hideBakedHalo } from './statue-halo';

export const CORRIDOR_STATUE_NAMES = ['chibi-quan-am', 'chibi-van-thu', 'chibi-pho-hien', 'chibi-dia-tang'] as const;
const TARGET_HEIGHT = 1.6;
const RETRY_AFTER_MS = 20_000;

/** Mặt trên bệ đá — tượng đứng đúng cao độ này, không đổi so với bệ hộp cũ. */
export const PEDESTAL_HEIGHT = 0.55;

// Hình học dùng chung cho cả 10 bệ: 10 lần clone chỉ tốn thêm mesh, không sinh geometry mới.
const PED_GEOM = {
  base: new RoundedBoxGeometry(1.54, 0.24, 1.54, 2, 0.065),
  step: new RoundedBoxGeometry(1.26, 0.16, 1.26, 2, 0.04),
  trim: new RoundedBoxGeometry(1.30, 0.04, 1.30, 1, 0.015),
  disc: new THREE.CylinderGeometry(0.60, 0.66, 0.06, 20),
  pad: new THREE.CylinderGeometry(0.44, 0.50, 0.09, 20),
  petal: new THREE.SphereGeometry(0.13, 10, 8),
};
const PED_PETAL_M = new THREE.MeshStandardMaterial({ color: 0xb9ae97, roughness: 0.9 });

/**
 * Bệ đá 2 tầng (tầng dưới rộng, tầng trên hẹp hơn, bo cạnh) + đài sen nhỏ đỡ tượng.
 * Đá xám, viền vàng mỏng ở mép tầng trên; cao tổng đúng PEDESTAL_HEIGHT nên
 * hạ tượng/bệ không đổi cao độ, hào quang (gắn ở slot) không bị đè.
 */
export function createCorridorPedestal(stone: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.name = 'corridor-pedestal';
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, y: number, sealable = false) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y; m.castShadow = true; m.receiveShadow = true;
    if (sealable) m.userData.sealable = true;
    g.add(m);
    return m;
  };
  add(PED_GEOM.base, stone, 0.12, true);       // tầng dưới: 0 → 0,24
  add(PED_GEOM.step, stone, 0.32, true);       // tầng trên: 0,24 → 0,40
  add(PED_GEOM.trim, duocSuStyle.gold, 0.42);  // viền vàng mép tầng trên
  add(PED_GEOM.disc, stone, 0.455);            // đài sen: đế tròn
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const petal = add(PED_GEOM.petal, PED_PETAL_M, 0.50);
    petal.scale.set(1.15, 0.5, 1.7);
    petal.position.set(Math.cos(a) * 0.47, 0.50, Math.sin(a) * 0.47);
    petal.rotation.set(0, -a, 0);
    petal.rotateX(0.5);
  }
  add(PED_GEOM.pad, stone, 0.505);             // nhụy sen: mặt trên 0,55 = đáy tượng
  return g;
}

/** Each slot owns its halo; swapping the figure never moves the plinth or duplicates the light. */
export function createCorridorStatues() {
  const fallback = [buildQuanAm(false), buildArhat(0), buildArhat(1), buildArhat(2)]
    .map(model => fitModel(model, TARGET_HEIGHT, 'base'));
  const models = CORRIDOR_STATUE_NAMES.map(async (name, index) => {
    // The standing Quan Am is already available as a colored chibi mesh; no missing GLB request.
    if (index === 0) return null;
    const model = await loadModel(name) ?? await new Promise<THREE.Group | null>(resolve => {
      setTimeout(() => resolve(loadModel(name)), RETRY_AFTER_MS);
    });
    if (!model) return null;
    const figure = fitModel(model.clone(true), TARGET_HEIGHT, 'base');
    hideBakedHalo(figure, name);
    return figure;
  });

  return (index: number) => {
    const slot = new THREE.Group();
    slot.name = CORRIDOR_STATUE_NAMES[index];
    const initial = fallback[index].clone(true);
    initial.name = 'corridor-figure';
    initial.userData.source = index === 0 ? 'procedural-quan-am' : 'procedural-fallback';
    const halo = index === 0 ? buildHalo(0.46, 1.15, -0.24) : buildHalo(0.38, 1.23, -0.24);
    slot.add(initial, halo);
    void models[index].then(model => {
      if (!model) return;
      const figure = model.clone(true);
      figure.name = initial.name;
      figure.userData.source = 'blender';
      slot.remove(initial);
      slot.add(figure);
      halo.position.z = -0.30;
    }).catch(error => console.warn(`${slot.name}: keeping corridor fallback`, error));
    return { slot, halo };
  };
}
