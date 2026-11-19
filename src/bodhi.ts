import * as THREE from 'three';
import { BODHI_GROVE, BODHI_SLOTS, BODHI_STAGE_NAMES, bodhiSlotPos, type BodhiTree } from '../shared/rituals';
import { groundYBase } from './layout';

const trunkMat = new THREE.MeshToonMaterial({ color: 0x7a5a3a });
const leafMats = [0x4f9a48, 0x6cb04e, 0x3e8442].map((c) => new THREE.MeshToonMaterial({ color: c }));
const wiltMat = new THREE.MeshToonMaterial({ color: 0xb59a52 });
const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.8 });
const soilMat = new THREE.MeshToonMaterial({ color: 0x5a3d26 });
const emptyMat = new THREE.MeshToonMaterial({ color: 0x7a5d3a, transparent: true, opacity: 0.55 });
const trunkGeo = new THREE.CylinderGeometry(0.6, 1, 1, 8);
const crownGeo = new THREE.IcosahedronGeometry(1, 1);
const moundGeo = new THREE.CylinderGeometry(0.52, 0.66, 0.14, 12);
const sparkGeo = new THREE.OctahedronGeometry(0.1);

/** Chiều cao thân và bán kính tán lá theo giai đoạn 0..6. */
const STAGE_SIZE = [
  { h: 0.28, r: 0.22 }, { h: 0.62, r: 0.38 }, { h: 1.05, r: 0.58 }, { h: 1.6, r: 0.82 },
  { h: 2.2, r: 1.05 }, { h: 2.9, r: 1.28 }, { h: 3.5, r: 1.5 },
];

interface Slot { group: THREE.Group; tree?: BodhiTree; key: string; spark?: THREE.Mesh }

export interface BodhiGrove {
  group: THREE.Group;
  setTrees(trees: BodhiTree[]): void;
  mine(pid: number): BodhiTree | undefined;
  slotPos(slot: number): { x: number; z: number };
  update(t: number): void;
  nearestFreeSlot(x: number, z: number): number | null;
}

function buildTree(tree: BodhiTree): THREE.Group {
  const g = new THREE.Group();
  const sz = STAGE_SIZE[Math.min(STAGE_SIZE.length - 1, tree.stage)];
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.scale.set(0.08 + tree.stage * 0.03, sz.h, 0.08 + tree.stage * 0.03);
  trunk.position.y = sz.h / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const leaves = tree.wilted ? [wiltMat] : leafMats;
  const blobs = tree.stage <= 1 ? 1 : tree.stage <= 3 ? 3 : 5;
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + 0.6;
    const spread = blobs === 1 ? 0 : sz.r * 0.55;
    const c = new THREE.Mesh(crownGeo, leaves[i % leaves.length]);
    const rr = sz.r * (blobs === 1 ? 1 : 0.72 + (i % 2) * 0.12);
    c.scale.set(rr, rr * 0.82, rr);
    c.position.set(Math.cos(a) * spread, sz.h + rr * 0.42 + (i % 2) * 0.12 * sz.r, Math.sin(a) * spread);
    c.castShadow = true;
    g.add(c);
  }
  if (tree.stage >= 6 && !tree.wilted) {
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(sparkGeo, sparkMat);
      s.name = 'spark';
      s.position.set(0, sz.h + sz.r, 0);
      s.userData.i = i;
      g.add(s);
    }
  }
  return g;
}

function makeNameSprite(name: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const g = canvas.getContext('2d')!;
  const text = name.length > 14 ? name.slice(0, 13) + '…' : name;
  g.font = '700 28px system-ui, "Segoe UI", sans-serif';
  const w = Math.min(248, g.measureText(text).width + 28);
  g.fillStyle = 'rgba(34,22,14,.72)';
  g.beginPath(); g.roundRect((256 - w) / 2, 10, w, 44, 22); g.fill();
  g.fillStyle = '#e9f5d0'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  sp.scale.set(1.6, 0.4, 1);
  sp.renderOrder = 18;
  return sp;
}

export function createBodhiGrove(scene: THREE.Scene): BodhiGrove {
  const group = new THREE.Group();
  scene.add(group);
  const slots: Slot[] = [];
  for (let i = 0; i < BODHI_SLOTS; i++) {
    const p = bodhiSlotPos(i);
    const g = new THREE.Group();
    g.position.set(p.x, groundYBase(p.x, p.z), p.z);
    const mound = new THREE.Mesh(moundGeo, emptyMat);
    mound.position.y = 0.07;
    mound.name = 'mound';
    g.add(mound);
    group.add(g);
    slots.push({ group: g, key: '' });
  }
  const trees = new Map<number, BodhiTree>();
  const mount = (slot: Slot, tree?: BodhiTree) => {
    const key = tree ? JSON.stringify([tree.pid, tree.name, tree.stage, tree.wilted]) : '';
    slot.tree = tree;
    if (key === slot.key) return;
    slot.key = key;
    for (const c of [...slot.group.children]) {
      if (c.name === 'mound') continue;
      if (c instanceof THREE.Sprite) { c.material.map?.dispose(); c.material.dispose(); }
      slot.group.remove(c);
    }
    const mound = slot.group.getObjectByName('mound') as THREE.Mesh;
    mound.material = tree ? soilMat : emptyMat;
    if (!tree) return;
    slot.group.add(buildTree(tree));
    const sprite = makeNameSprite(tree.name);
    sprite.position.y = STAGE_SIZE[Math.min(STAGE_SIZE.length - 1, tree.stage)].h + STAGE_SIZE[Math.min(STAGE_SIZE.length - 1, tree.stage)].r * 2 + 0.5;
    slot.group.add(sprite);
  };

  return {
    group,
    setTrees(list) {
      trees.clear();
      for (const t of list) trees.set(t.slot, t);
      for (let i = 0; i < slots.length; i++) mount(slots[i], trees.get(i));
    },
    mine(pid) { return [...trees.values()].find((t) => t.pid === pid); },
    slotPos: (slot) => bodhiSlotPos(slot),
    nearestFreeSlot(x, z) {
      let best: number | null = null, bd = Infinity;
      for (let i = 0; i < BODHI_SLOTS; i++) {
        if (trees.has(i)) continue;
        const p = bodhiSlotPos(i), d = Math.hypot(p.x - x, p.z - z);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    },
    update(t) {
      for (const s of slots) {
        if (!s.tree) continue;
        const crown = s.group.children[1];
        if (!crown) continue;
        crown.rotation.z = Math.sin(t * 0.6 + s.group.position.x) * 0.01;
        for (const c of crown.children) {
          if (c.name !== 'spark') continue;
          const i = Number(c.userData.i), a = t * 0.8 + i * 2.1, sz = STAGE_SIZE[6];
          c.position.set(Math.cos(a) * sz.r * 0.9, sz.h + sz.r * (0.6 + 0.5 * Math.sin(t + i)), Math.sin(a) * sz.r * 0.9);
        }
      }
    },
  };
}

export const bodhiStageLabel = (stage: number) => BODHI_STAGE_NAMES[Math.min(BODHI_STAGE_NAMES.length - 1, stage)];
export const BODHI_CENTER = { x: BODHI_GROVE.x, z: BODHI_GROVE.z };
