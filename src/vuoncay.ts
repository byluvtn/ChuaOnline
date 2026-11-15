import * as THREE from 'three';
import { toon } from './toon';
import { signTexture } from './textures';
import { groundY } from './layout';
import { fitModel, loadModel } from './models';
import { GARDEN_PLOTS, GARDEN_SEEDS, type GardenPlotState, type GardenSpecies } from '../shared/game.js';

type Collider = { x: number; z: number; r: number; x2?: number; z2?: number };

const X0 = -55;
const X1 = -41;
const Z0 = 11;
const Z1 = 23;
const GATE_X = -48;
const GATE_HALF = 1.5;
const POST_STEP = 1.1;
const LINE_R = 0.15;

const BOARD_X = -46.3;
const BOARD_Z = 23.8;

// Bảng đếm: canvas + texture ở module-level để vòng D vẽ lại.
const boardCanvas = document.createElement('canvas');
boardCanvas.width = 320;
boardCanvas.height = 180;
const boardTex = new THREE.CanvasTexture(boardCanvas);
boardTex.colorSpace = THREE.SRGBColorSpace;

export function setGardenGateBoard(growing: number): void {
  const ctx = boardCanvas.getContext('2d');
  if (!ctx) return;
  const w = boardCanvas.width;
  const h = boardCanvas.height;
  ctx.fillStyle = '#5a1a12';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#e8c050';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = '#e8c050';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Đang lớn: ${growing}/8`, w / 2, h / 2);
  boardTex.needsUpdate = true;
}

export function buildVuonCay(scene: THREE.Scene, colliders: Collider[]): void {
  dynScene = scene;
  dynColliders = colliders;
  const wood = toon(0x7a4a26);
  const red = toon(0xa8281a);
  const stone = toon(0x9a9a9a);
  const soil = toon(0x4a2f1d);
  const gravel = toon(0xb8a88a);
  const leaf = toon(0x3f7a35);
  const bark = toon(0x5a3a20);

  const add = (m: THREE.Object3D, shadow = true): void => {
    m.castShadow = shadow;
    scene.add(m);
  };
  const box = (
    w: number, h: number, d: number, mat: THREE.Material,
    x: number, y: number, z: number,
  ): THREE.Mesh => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    add(m);
    return m;
  };
  const addLine = (x1: number, z1: number, x2: number, z2: number): void => {
    colliders.push({ x: x1, z: z1, r: LINE_R, x2, z2 });
  };

  // ---- Rào (theo mẫu buildVienFence) ----
  const postPos: [number, number][] = [];
  const fenceLine = (x1: number, z1: number, x2: number, z2: number): void => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const n = Math.max(1, Math.round(len / POST_STEP));
    for (let i = 0; i <= n; i++) {
      postPos.push([x1 + (dx * i) / n, z1 + (dz * i) / n]);
    }
    const mx = (x1 + x2) / 2;
    const mz = (z1 + z2) / 2;
    const railGeo = new THREE.BoxGeometry(len, 0.07, 0.05);
    for (const y of [0.45, 0.9]) {
      const rail = new THREE.Mesh(railGeo, wood);
      rail.position.set(mx, groundY(mx, mz) + y, mz);
      rail.rotation.y = -Math.atan2(dz, dx);
      add(rail);
    }
    addLine(x1, z1, x2, z2);
  };

  fenceLine(X0, Z0, X1, Z0); // Bắc
  fenceLine(X0, Z0, X0, Z1); // Tây
  fenceLine(X1, Z0, X1, Z1); // Đông
  fenceLine(X0, Z1, GATE_X - GATE_HALF, Z1); // Nam, trái cổng
  fenceLine(GATE_X + GATE_HALF, Z1, X1, Z1); // Nam, phải cổng

  const posts = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.16, 1.1, 0.16), wood, postPos.length,
  );
  const dummy = new THREE.Object3D();
  postPos.forEach(([x, z], i) => {
    dummy.position.set(x, groundY(x, z) + 0.55, z);
    dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix);
  });
  posts.instanceMatrix.needsUpdate = true;
  add(posts);

  // ---- Cổng Nam (nhóm tại (-48,0,23), không xoay) ----
  const gate = new THREE.Group();
  gate.position.set(GATE_X, 0, Z1);
  for (const sx of [-1.7, 1.7]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), stone);
    base.position.set(sx, 0.1, 0);
    base.castShadow = true;
    gate.add(base);
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.4), red);
    pillar.position.set(sx, 0.2 + 1.1, 0);
    pillar.castShadow = true;
    gate.add(pillar);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.3, 0.4), red);
  beam.position.set(0, 2.3, 0);
  beam.castShadow = true;
  gate.add(beam);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.6),
    new THREE.MeshBasicMaterial({ map: signTexture('VƯỜN CÂY') }),
  );
  sign.position.set(0, 2.55, 0.22);
  gate.add(sign);
  scene.add(gate);
  colliders.push({ x: GATE_X - 1.7, z: Z1, r: 0.3 });
  colliders.push({ x: GATE_X + 1.7, z: Z1, r: 0.3 });

  // ---- Lối sỏi ----
  box(12.6, 0.04, 2.4, gravel, GATE_X, 0.02, 18.1);

  // ---- Luống ----
  for (const p of GARDEN_PLOTS) {
    box(2.6, 0.22, 1.2, soil, p.x, 0.11, p.z);
    box(2.6, 0.25, 0.1, wood, p.x, 0.125, p.z - 0.55);
    box(2.6, 0.25, 0.1, wood, p.x, 0.125, p.z + 0.55);
    box(0.1, 0.25, 1.0, wood, p.x - 1.25, 0.125, p.z);
    box(0.1, 0.25, 1.0, wood, p.x + 1.25, 0.125, p.z);
    const hx = 1.3;
    const hz = 0.6;
    addLine(p.x - hx, p.z - hz, p.x + hx, p.z - hz);
    addLine(p.x + hx, p.z - hz, p.x + hx, p.z + hz);
    addLine(p.x + hx, p.z + hz, p.x - hx, p.z + hz);
    addLine(p.x - hx, p.z + hz, p.x - hx, p.z - hz);
  }

  // ---- Giếng đá (-42,12) ----
  const wx = -42;
  const wz = 12;
  const well = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.9, 12), stone);
  well.position.set(wx, 0.45, wz);
  add(well);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 8, 16), stone);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(wx, 0.9, wz);
  add(rim);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 16),
    new THREE.MeshBasicMaterial({ color: 0x1a3a4a }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(wx, 0.92, wz);
  scene.add(water);
  for (const sx of [-0.95, 0.95]) {
    box(0.12, 1.7, 0.12, wood, wx + sx, 0.85, wz);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 4), red);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(wx, 2.05, wz);
  add(roof);
  colliders.push({ x: wx, z: wz, r: 0.8 });

  // ---- Cây bóng mát (cố định) ----
  const tree = (x: number, z: number): void => {
    const g = new THREE.Group();
    g.position.set(x, groundY(x, z), z);
    g.scale.setScalar(1.3);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 4.1, 8), bark);
    trunk.position.y = 2.05;
    trunk.castShadow = true;
    g.add(trunk);
    const tiers: [number, number, number, number][] = [
      [0, 4.2, 0, 1.2],
      [0.1, 4.85, -0.05, 1.0],
      [-0.05, 5.4, 0.05, 0.75],
    ];
    for (const [ox, oy, oz, s] of tiers) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), leaf);
      c.position.set(ox, oy, oz);
      c.scale.setScalar(s);
      c.castShadow = true;
      g.add(c);
    }
    scene.add(g);
    colliders.push({ x, z, r: 0.5 });
  };
  tree(-43.1, 14.3);
  tree(-42.5, 12.7);
  tree(-57, 25);

  // ---- Bảng đếm ----
  for (const sx of [-0.7, 0.7]) {
    box(0.1, 1.5, 0.1, wood, BOARD_X + sx, 0.75, BOARD_Z);
  }
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.9),
    new THREE.MeshBasicMaterial({ map: boardTex }),
  );
  board.position.set(BOARD_X, 1.1, BOARD_Z + 0.06);
  scene.add(board);
  colliders.push({ x: BOARD_X, z: BOARD_Z, r: 0.5 });
  setGardenGateBoard(0);
}

// ---- Cây động (vòng D1) ----
let dynScene: THREE.Scene | null = null;
let dynColliders: Collider[] = [];
const treeGroup = new THREE.Group();
const treeCols: Collider[] = [];
let lastTreeKey = '';
let treeRenderBusy = false;
let pendingStates: GardenPlotState[] | null = null;

const STAGE_FILE: Record<GardenSpecies, [string, string]> = {
  // [file giai đoạn 2 (non, 1.4 m), file giai đoạn 3–4 (nhỡ 2.4 m / lớn 3.5 m)]
  soi: ['oak-sapling', 'oak-tree'],
  thong: ['pine-sapling', 'pine-tree'],
  anh_dao: ['cherry_tree', 'cherry_tree'],
  bo_de: ['oak-sapling', 'oak-tree'],
};
const STAGE_HEIGHT = [0, 0.35, 1.4, 2.4, 3.5];
const SPROUT_LEAF: Record<GardenSpecies, number> = {
  soi: 0x4e9c45, thong: 0x2f7a40, anh_dao: 0xf4a3bc, bo_de: 0x9ab84a,
};

function treeStatus(st: GardenPlotState): string {
  if (!st.species) return 'Trống';
  if (st.harvested) return 'Đã thu hoạch';
  if (st.wilted) return 'Héo';
  if (st.stage >= 4) return 'Lớn';
  return st.wateredToday ? 'Đang lớn' : 'Cần tưới';
}

/** Recolor lá của bản clone GLB: lá → leafColor, thân → nâu. Chỉ gọi trên bản clone
 *  (geometry đã `.clone()` nên không đụng cache loadModel). Rule tương đối theo bbox
 *  riêng của từng geometry: lá là đỉnh cao hơn 35% chiều cao VÀ xa trục hơn 12%
 *  nửa rộng lớn nhất. Mesh recolor được đánh dấu userData.own để dọn đúng. */
function recolorLeaves(model: THREE.Object3D, leafColor: number): void {
  const leaf = new THREE.Color(leafColor);
  const trunk = new THREE.Color(0x6b4a2b);
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    mesh.geometry = mesh.geometry.clone();
    const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox!;
    const h = Math.max(0.001, bb.max.y - bb.min.y);
    const half = Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x), Math.abs(bb.min.z), Math.abs(bb.max.z));
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const isLeaf = (y - bb.min.y) > 0.35 * h && Math.hypot(x, z) > 0.12 * half;
      c.copy(isLeaf ? leaf : trunk);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    mesh.material = toon(0xffffff, { vertexColors: true });
    mesh.userData.own = true;
  });
}

function makeSprout(species: GardenSpecies): THREE.Group {
  const g = new THREE.Group();
  const leafM = toon(SPROUT_LEAF[species]);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.25, 6), toon(0x5a7a35));
  stem.position.y = 0.125; stem.castShadow = true; stem.userData.own = true; g.add(stem);
  for (const [x, y, s] of [[-0.07, 0.3, 0.09], [0.07, 0.32, 0.09], [0, 0.36, 0.07]] as const) {
    const leafMesh = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), leafM);
    leafMesh.position.set(x, y, 0); leafMesh.scale.y = 0.6; leafMesh.castShadow = true;
    leafMesh.userData.own = true; g.add(leafMesh);
  }
  return g;
}

function makeLabel(text: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d')!;
  g.font = '700 30px sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 6; g.strokeStyle = 'rgba(40,20,8,0.9)';
  g.strokeText(text, 128, 34); g.fillStyle = '#fff8e0'; g.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(1.8, 0.45, 1);
  sp.userData.tex = tex;
  return sp;
}

function takePending(): GardenPlotState[] | null {
  const p = pendingStates; pendingStates = null; return p;
}

/** Vẽ lại toàn bộ cây theo trạng thái mới nhất. Key 3D không gồm progress nên
 *  poll định kỳ không dựng lại cây. Yêu cầu đến lúc đang load GLB được xếp hàng
 *  (pendingStates) và chạy sau với states MỚI NHẤT. */
export async function renderGardenTrees(states: GardenPlotState[]): Promise<void> {
  if (treeRenderBusy) { pendingStates = states; return; }
  treeRenderBusy = true;
  try {
    let next: GardenPlotState[] | null = states;
    while (next) {
      const key = JSON.stringify(next.map((s) => [s.plot, s.species, s.stage, s.wilted, s.wateredToday, s.harvestable, s.harvested]));
      if (key !== lastTreeKey) { await renderGardenTreesNow(next); lastTreeKey = key; }
      next = takePending();
    }
  } finally {
    treeRenderBusy = false;
  }
}

async function renderGardenTreesNow(states: GardenPlotState[]): Promise<void> {
  if (!dynScene) return;
  // Dọn cây cũ: dispose sprite texture/material + mesh tự tạo (userData.own).
  // KHÔNG dispose geometry/material của bản clone GLB (chia sẻ với cache loadModel).
  treeGroup.traverse((o) => {
    const sp = o as THREE.Sprite;
    if (sp.isSprite) {
      if (sp.userData.tex) (sp.userData.tex as THREE.CanvasTexture).dispose();
      (sp.material as THREE.Material).dispose();
      return;
    }
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.userData.own) {
      mesh.geometry.dispose();
      const m = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(m)) m.forEach((x) => x.dispose()); else m.dispose();
    }
  });
  treeGroup.clear();
  for (const col of treeCols) {
    const i = dynColliders.indexOf(col);
    if (i >= 0) dynColliders.splice(i, 1);
  }
  treeCols.length = 0;

  for (const st of states) {
    if (!st.species) continue;
    const def = GARDEN_PLOTS.find((p) => p.id === st.plot);
    if (!def) continue;
    const height = STAGE_HEIGHT[st.stage] ?? 0.35;
    const wrap = new THREE.Group();
    wrap.position.set(def.x, 0, def.z);
    let model: THREE.Object3D;
    if (st.stage <= 1) {
      model = makeSprout(st.species);
    } else {
      const [sap, tree] = STAGE_FILE[st.species];
      const file = st.stage === 2 ? sap : tree;
      const src = await loadModel(file);
      if (!src) continue;
      model = src.clone(true);
      const leafColor = st.wilted ? 0x8a6a3a : (st.species === 'bo_de' ? 0x9ab84a : null);
      // Héo nâu lá cho cây dùng GLB Avramania; anh đào giữ nguyên (3 material riêng).
      if (leafColor !== null && st.species !== 'anh_dao') recolorLeaves(model, leafColor);
      model = fitModel(model, height);
    }
    wrap.add(model);
    const label = makeLabel(`${GARDEN_SEEDS[st.species].name} • ${treeStatus(st)}`);
    label.position.set(0, height + 0.7, 0);
    wrap.add(label);
    treeGroup.add(wrap);
    if (st.stage === 4 && !st.harvested) {
      const col: Collider = { x: def.x, z: def.z, r: 1.0 };
      dynColliders.push(col);
      treeCols.push(col);
    }
  }
  if (!treeGroup.parent) dynScene.add(treeGroup);
}

