import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { AnimalAnim, AnimalState } from '../shared/types';
import { loadGltf } from './models';

type Kind = AnimalState['kind'];

interface Ent {
  id: string;
  kind: Kind;
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  clips: Map<string, THREE.AnimationClip>;
  cur: THREE.AnimationAction | null;
  curName: string;
  placed: boolean;
  label: THREE.Sprite | null;
  clipMap?: Record<string, string>;
}

interface Spec { id: string; kind: Kind; file: string; name?: string; dark?: boolean; scale?: number; labelY?: number; clipMap?: Record<string, string> }

const ROBIN_CLIPS: Record<string, string> = { walk: 'A_Hop_01', eat: 'A_PeckGround_01', idle: 'A_Idle_01' };
const COLLIE_CLIPS: Record<string, string> = { walk: 'Walk', eat: 'Idle', idle: 'Idle' };
const MUNCHKIN_CLIPS: Record<string, string> = { walk: 'Walk', eat: 'Eat', idle: 'Idle' };
const LABRADOR_CLIPS: Record<string, string> = { walk: 'Walk', eat: 'Sit', idle: 'Idle' };

const SPECS: Spec[] = [
  { id: 'vang', kind: 'dog', file: 'polyfork-dog', name: 'Vàng', scale: 0.91, clipMap: COLLIE_CLIPS },
  { id: 'den', kind: 'dog', file: 'munchkin-dog', name: 'Đen', scale: 0.62, clipMap: MUNCHKIN_CLIPS },
  { id: 'muop', kind: 'cat', file: 'animal-cat', name: 'Mướp', scale: 2, labelY: 1.6 },
  { id: 'lab', kind: 'dog', file: 'labrador-lite', name: 'Labrador', scale: 0.45, clipMap: LABRADOR_CLIPS },
  { id: 'owl1', kind: 'owl', file: 'animal-owl' },
  { id: 'owl2', kind: 'owl', file: 'animal-owl' },
  { id: 'owl3', kind: 'owl', file: 'animal-owl' },
  { id: 'parrot', kind: 'parrot', file: 'american-robin', clipMap: ROBIN_CLIPS },
  { id: 'chick', kind: 'chick', file: 'american-robin', clipMap: ROBIN_CLIPS },
  { id: 'parrot2', kind: 'parrot', file: 'american-robin', clipMap: ROBIN_CLIPS },
  { id: 'parrot3', kind: 'parrot', file: 'american-robin', clipMap: ROBIN_CLIPS },
  { id: 'chick2', kind: 'chick', file: 'american-robin', clipMap: ROBIN_CLIPS },
  { id: 'chick3', kind: 'chick', file: 'american-robin', clipMap: ROBIN_CLIPS },
];

const LABEL_Y = 1.0;
const SNAP_DIST = 8;

const ents = new Map<string, Ent>();
let snap = new Map<string, AnimalState>();
let namesOn: () => boolean = () => true;

function makeLabel(text: string, y = LABEL_Y): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.beginPath();
    g.roundRect(8, 8, 240, 48, 16);
    g.fill();
    g.fillStyle = '#fff';
    g.font = 'bold 34px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 128, 33);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(0.9, 0.225, 1);
  sp.position.y = y;
  return sp;
}

function darken(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const tint = (mat: THREE.Material): THREE.Material => {
      const c = mat.clone();
      const col = (c as THREE.MeshStandardMaterial).color;
      if (col) col.multiplyScalar(0.35);
      return c;
    };
    m.material = Array.isArray(m.material) ? m.material.map(tint) : tint(m.material);
  });
}

/** Clip names to try for a server anim, in order. Falls back to 'idle'. */
function candidates(kind: Kind, anim: AnimalAnim): string[] {
  if (kind === 'owl') return anim === 'fly' ? ['fly'] : anim === 'sit' || anim === 'sleep' ? ['sit'] : ['idle'];
  if (anim === 'walk' || anim === 'run') return ['walk'];
  if (anim === 'eat') return ['eat'];
  if (kind === 'cat' && (anim === 'sit' || anim === 'sleep')) return [anim];
  return ['idle'];
}

function play(e: Ent, anim: AnimalAnim): void {
  const map = e.clipMap;
  const name = candidates(e.kind, anim).map((n) => map?.[n] ?? n).find((n) => e.clips.has(n)) ?? [map?.idle, 'idle'].find((n) => n !== undefined && e.clips.has(n)) ?? null;
  if (!name || name === e.curName) return;
  const next = e.mixer.clipAction(e.clips.get(name) as THREE.AnimationClip);
  next.reset().fadeIn(0.2).play();
  if (e.cur) e.cur.fadeOut(0.2);
  e.cur = next;
  e.curName = name;
}

export function initAnimals(scene: THREE.Scene, showNames?: () => boolean): void {
  if (showNames) namesOn = showNames;
  const files = [...new Set(SPECS.map((s) => s.file))];
  Promise.all(files.map((f) => loadGltf(f))).then((list) => {
    const gltfs = new Map(files.map((f, i) => [f, list[i]]));
    for (const sp of SPECS) {
      const gltf = gltfs.get(sp.file);
      if (!gltf || ents.has(sp.id)) continue;
      const root = new THREE.Group();
      const model = SkeletonUtils.clone(gltf.scene);
      if (sp.dark) darken(model);
      if (sp.scale) model.scale.setScalar(sp.scale);
      root.add(model);
      root.visible = false;
      const clips = new Map<string, THREE.AnimationClip>();
      for (const c of gltf.animations) clips.set(c.name, c);
      let label: THREE.Sprite | null = null;
      if (sp.name) {
        label = makeLabel(sp.name, sp.labelY);
        root.add(label);
      }
      scene.add(root);
      ents.set(sp.id, { id: sp.id, kind: sp.kind, root, mixer: new THREE.AnimationMixer(model), clips, cur: null, curName: '', placed: false, label, clipMap: sp.clipMap });
    }
  });
}

export function updateAnimals(states: AnimalState[] | undefined, dt: number): void {
  snap = new Map((states ?? []).map((s) => [s.id, s]));
  const k = 1 - Math.pow(0.0005, dt);
  const showLabel = namesOn();
  for (const e of ents.values()) {
    const s = snap.get(e.id);
    e.root.visible = s !== undefined;
    if (!s) continue;
    const p = e.root.position;
    if (!e.placed || Math.hypot(s.x - p.x, s.z - p.z) > SNAP_DIST) {
      p.set(s.x, s.y, s.z);
      e.root.rotation.y = s.ry;
      e.placed = true;
    } else {
      p.x += (s.x - p.x) * k;
      p.z += (s.z - p.z) * k;
      p.y = s.y;
      const d = THREE.MathUtils.euclideanModulo(s.ry - e.root.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      e.root.rotation.y += d * Math.min(1, dt * 12);
    }
    play(e, s.anim);
    e.mixer.update(dt);
    if (e.label) e.label.visible = showLabel;
  }
}

export function animalPos(id: string): { x: number; z: number } | null {
  const e = ents.get(id);
  if (e && e.root.visible) return { x: e.root.position.x, z: e.root.position.z };
  const s = snap.get(id);
  return s ? { x: s.x, z: s.z } : null;
}

export function nearestFeedable(pos: { x: number; z: number }): { id: string; x: number; z: number } | null {
  let best: { id: string; x: number; z: number } | null = null;
  let bd = Infinity;
  for (const e of ents.values()) {
    if ((e.kind !== 'dog' && e.kind !== 'cat') || !e.root.visible) continue;
    const x = e.root.position.x;
    const z = e.root.position.z;
    const d = Math.hypot(x - pos.x, z - pos.z);
    if (d < bd) { bd = d; best = { id: e.id, x, z }; }
  }
  return best;
}

export function flockPos(): { x: number; z: number } | null {
  let n = 0, sx = 0, sz = 0;
  for (const e of ents.values()) {
    if ((e.kind !== 'parrot' && e.kind !== 'chick') || !e.root.visible) continue;
    sx += e.root.position.x; sz += e.root.position.z; n++;
  }
  return n ? { x: sx / n, z: sz / n } : null;
}

export function lostAnimal(): { id: string; x: number; z: number } | null {
  for (const s of snap.values()) {
    if (s.lost === true) {
      const p = animalPos(s.id);
      return { id: s.id, x: p ? p.x : s.x, z: p ? p.z : s.z };
    }
  }
  return null;
}
