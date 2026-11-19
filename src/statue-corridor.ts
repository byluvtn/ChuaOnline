import * as THREE from 'three';
import { fitModel, loadModel } from './models';
import { buildArhat, buildQuanAm } from './statues';
import { buildHalo, hideBakedHalo } from './statue-halo';

export const CORRIDOR_STATUE_NAMES = ['chibi-quan-am', 'chibi-van-thu', 'chibi-pho-hien', 'chibi-dia-tang'] as const;
const TARGET_HEIGHT = 1.6;
const RETRY_AFTER_MS = 20_000;

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
