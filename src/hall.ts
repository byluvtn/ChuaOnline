import * as THREE from 'three';
import { COUPLETS } from './couplets';
import { HALL } from './layout';
import { buildBuddha } from './statues';
import { coupletTexture, glowTexture, hoanhPhiTexture, stoneTexture, woodTexture } from './textures';
import type { Seat, TempleCtx, Zone } from './temple';

const BASE = HALL.h; // top of platform

/** Open-sided main hall (chính điện): columns + roof only, meditation seating inside, altar with Tam Thế Phật. */
export function buildHall(c: TempleCtx) {
  const { scene, colliders, lamb } = c;
  const g = new THREE.Group();
  g.position.set(HALL.x, 0, HALL.z);
  const seats: Seat[] = [];
  const zones: Zone[] = [];
  const W = HALL.hx * 2, D = HALL.hz * 2;

  const stoneM = lamb(0xcfc4ae, { map: stoneTexture([200, 192, 174], [8, 1]) });
  const add = <T extends THREE.Object3D>(o: T, parent: THREE.Object3D = g) => { parent.add(o); return o; };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; return add(o);
  };

  // platform tiers (match groundY ramp) + wooden floor
  const tiers: [number, number][] = [[0.8, 0.45], [0.45, 0.9], [0, BASE]];
  for (const [e, h] of tiers) box(W + e * 2, h, D + e * 2, stoneM, 0, h / 2, 0);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, D - 0.2), lamb(0xffffff, { map: woodTexture([12, 6]), roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = BASE + 0.01; floor.receiveShadow = true; add(floor);
  for (let i = 0; i < 3; i++) box(10.4 - i * 0.7, 0.45, 1.0, lamb(0xb9ae98), 0, 0.225, D / 2 + 1.1 - i * 0.3, false);

  // ---- columns (no middle columns in front of the altar) ----
  const colH = 7.6;
  const colG = new THREE.CylinderGeometry(0.42, 0.5, colH, 18);
  const baseG = new THREE.CylinderGeometry(0.7, 0.8, 0.34, 16);
  const stoneBase = lamb(0x7a7466);
  const capG = new THREE.BoxGeometry(1.5, 0.38, 1.5);
  const addCol = (x: number, z: number) => {
    const col = new THREE.Mesh(colG, c.redM);
    col.position.set(x, BASE + colH / 2, z); col.castShadow = true; add(col);
    const b = new THREE.Mesh(baseG, stoneBase); b.position.set(x, BASE + 0.17, z); add(b);
    const cap = new THREE.Mesh(capG, c.goldM); cap.position.set(x, BASE + colH + 0.14, z); add(cap);
    colliders.push({ x: HALL.x + x, z: HALL.z + z, r: 0.5 });
  };
  const fz = HALL.hz - 0.7, bz = -HALL.hz + 0.7, sx = HALL.hx - 0.7;
  const ENT = 4.9; // the two entrance columns carry the couplet
  const frontX = [-16, -12.3, -8.6, -ENT, ENT, 8.6, 12.3, 16];
  for (const x of frontX) { addCol(x, fz); addCol(x, bz); }
  for (const z of [-6.4, -2.1, 2.2, 6.5]) { addCol(-sx, z); addCol(sx, z); }

  // beams + ceiling
  const beamY = BASE + colH + 0.5;
  box(W + 0.8, 0.6, 1.0, c.redM, 0, beamY, fz); box(W + 0.8, 0.6, 1.0, c.redM, 0, beamY, bz);
  box(1.0, 0.6, D + 0.8, c.redM, -sx, beamY, 0); box(1.0, 0.6, D + 0.8, c.redM, sx, beamY, 0);
  for (const z of [-6.4, -2.1, 2.2, 6.5]) box(W - 1.4, 0.38, 0.6, c.redM, 0, beamY - 0.06, z, false);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lamb(0x4a1c12, { map: woodTexture([8, 4]) }));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = beamY - 0.25; add(ceiling);

  // ---- roofs (taller, three tiers) ----
  const roof1 = new THREE.Mesh(c.roofGeometry(W + 9, D + 7.5, 5.6, 1.2), c.tileM);
  roof1.position.y = beamY + 0.3 + 2.8; roof1.castShadow = true; add(roof1);
  const roof2 = new THREE.Mesh(c.roofGeometry(W * 0.62, D * 0.6, 4.2, 0.9), c.tileM);
  roof2.position.y = beamY + 3.6 + 2.1; roof2.castShadow = true; add(roof2);
  const roof3 = new THREE.Mesh(c.roofGeometry(W * 0.3, D * 0.3, 3.0, 0.7), c.tileM);
  roof3.position.y = beamY + 7.0 + 1.5; roof3.castShadow = true; add(roof3);
  for (const x of [-9, 9]) for (const z of [-4.5, 4.5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 8), c.redM);
    post.position.set(x, beamY + 2.0, z); add(post);
  }
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.0, 8), c.goldM); fin.position.y = beamY + 8.9 + 1.0; add(fin);

  // ---- hoành phi ----
  const hpFront = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 2.25), new THREE.MeshBasicMaterial({ map: hoanhPhiTexture('大雄寶殿') }));
  hpFront.position.set(0, beamY - 1.5, fz + 0.62); add(hpFront);
  const hpBack = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.05), new THREE.MeshBasicMaterial({ map: hoanhPhiTexture('佛日增輝') }));
  hpBack.position.set(0, BASE + 7.0, -HALL.hz + 0.3); add(hpBack);

  // ---- câu đối on the two entrance columns only ----
  const cd = COUPLETS.tamBao;
  const board = (han: string, x: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 5.2), new THREE.MeshBasicMaterial({ map: coupletTexture(han, 160, 880) }));
    m.position.set(x, BASE + 4.15, fz + 0.54); add(m);
  };
  board(cd.han[0], ENT); // right-hand line (viewer's right when facing the altar from outside = -x ... keep reading order)
  board(cd.han[1], -ENT);
  zones.push({ x: HALL.x, z: HALL.z + fz, r: 6.2, id: 'tamBao' });

  // ---- altar ----
  const AW = 25;
  const backdrop = box(AW + 1.5, 7.4, 0.3, lamb(0x5a120c, { roughness: 0.6 }), 0, BASE + 3.7, -HALL.hz + 0.15, false);
  backdrop.receiveShadow = true;
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(AW, 6.4), new THREE.MeshBasicMaterial({ color: 0x7a1c12 }));
  frame.position.set(0, BASE + 3.65, -HALL.hz + 0.33); add(frame);
  for (const [w, h, y, x] of [[AW + 0.2, 0.12, 6.88, 0], [AW + 0.2, 0.12, 0.45, 0], [0.12, 6.5, 3.65, -AW / 2 - 0.05], [0.12, 6.5, 3.65, AW / 2 + 0.05]] as const) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8b64a).multiplyScalar(1.1) }));
    t.position.set(x, BASE + y, -HALL.hz + 0.34); add(t);
  }
  const altarY = BASE + 0.55, altarZ = -HALL.hz + 2.0;
  box(AW - 1, 0.55, 3.3, lamb(0x6d2a16, { roughness: 0.55 }), 0, BASE + 0.275, altarZ);
  box(AW - 0.7, 0.1, 3.6, c.goldM, 0, altarY + 0.05, altarZ, false);
  for (let i = -5; i <= 5; i++) colliders.push({ x: HALL.x + i * 2.3, z: HALL.z + altarZ, r: 1.6 });

  const lead = buildBuddha();
  const place = (x: number, s: number, ry: number) => { const b = lead.clone(true); b.scale.setScalar(s); b.position.set(x, altarY, altarZ); b.rotation.y = ry; add(b); return b; };
  const mainB = place(0, 0.95, 0);
  const sideBs = [place(-7.2, 0.72, 0.15), place(7.2, 0.72, -0.15), place(-11.2, 0.5, 0.3), place(11.2, 0.5, -0.3)];

  // offering table
  const tableZ = -HALL.hz + 5.3;
  box(9, 0.16, 1.5, lamb(0x7a1c12), 0, BASE + 1.1, tableZ);
  for (const x of [-4.2, 4.2]) for (const z of [-0.6, 0.6]) box(0.18, 1.1, 0.18, lamb(0x5a1410), x, BASE + 0.55, tableZ + z, false);
  for (const x of [-3.0, 3.0]) {
    const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 8), lamb(0xf5e8d0)); cand.position.set(x, BASE + 1.46, tableZ); add(cand);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc060).multiplyScalar(2) }));
    flame.scale.y = 1.6; flame.position.set(x, BASE + 1.82, tableZ); add(flame);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffb040, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(1.4); spr.position.set(x, BASE + 1.82, tableZ); add(spr); c.glowSprites.push(spr);
  }
  const bronze = lamb(0xa8741f, { metalness: 0.7, roughness: 0.38 });
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.28, 0.46, 14), bronze); burner.position.set(0, BASE + 1.4, tableZ); add(burner);
  const fruitM = [lamb(0xf08a24), lamb(0xd8352a), lamb(0xf5d24a)];
  [[-1.4, 0], [-1.15, 0.26], [-1.65, 0.24], [-1.4, 0.12]].forEach(([dx, dz], i) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), fruitM[i % 3]); f.position.set(dx, BASE + 1.33 + (i === 3 ? 0.25 : 0), tableZ + dz); add(f);
  });
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.19, 0.46, 10), lamb(0x7fc4a8, { emissive: 0x143026 })); vase.position.set(1.6, BASE + 1.4, tableZ); add(vase);
  for (let k = 0; k < 5; k++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), lamb([0xff8fb6, 0xffffff, 0xffd35a][k % 3], { emissive: 0x201010 }));
    fl.position.set(1.6 + (k - 2) * 0.1, BASE + 1.78 + (k % 2) * 0.12, tableZ + (k % 2 - 0.5) * 0.1); add(fl);
  }
  for (const x of [-3, 0, 3]) colliders.push({ x: HALL.x + x, z: HALL.z + tableZ, r: 1.05 });

  // hanging lanterns inside
  const lanterns = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 12, 10), c.redBase, 16);
  const d = new THREE.Object3D(); let li = 0;
  for (const x of [-13, -8.5, 8.5, 13]) for (const z of [-1, 4.5, 8]) {
    if (li >= 16) break;
    d.position.set(x, BASE + 6.0, z); d.scale.set(1, 1.2, 1); d.updateMatrix(); lanterns.setMatrixAt(li++, d.matrix);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff4a28, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(2.2); spr.position.set(x, BASE + 6.0, z); add(spr); c.glowSprites.push(spr);
  }
  lanterns.count = li; add(lanterns);

  // ---- meditation seats inside (clear central aisle) ----
  const matM = lamb(0xe8b83a, { roughness: 0.95 }), cushM = lamb(0xa0201a, { roughness: 0.8 });
  const rows = [-3.2, -1.4, 0.4, 2.2, 4.0, 5.8], cols = [3.4, 4.9, 6.4, 7.9, 9.4, 10.9, 12.4, 13.9];
  const n = rows.length * cols.length * 2;
  const mats = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.04, 1.05), matM, n);
  const cush = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.38, 0.1, 16), cushM, n);
  let k = 0;
  for (const s of [-1, 1]) for (const z of rows) for (const x of cols) {
    d.scale.setScalar(1);
    d.position.set(s * x, BASE + 0.03, z); d.updateMatrix(); mats.setMatrixAt(k, d.matrix);
    d.position.set(s * x, BASE + 0.1, z); d.updateMatrix(); cush.setMatrixAt(k, d.matrix);
    seats.push({ x: HALL.x + s * x, z: HALL.z + z, ry: Math.PI }); k++;
  }
  mats.receiveShadow = cush.receiveShadow = true; add(mats); add(cush);

  scene.add(g);
  const halos = [mainB, ...sideBs].map((b) => b.getObjectByName('halo')).filter((x): x is THREE.Object3D => !!x);
  return { group: g, seats, zones, halos };
}
