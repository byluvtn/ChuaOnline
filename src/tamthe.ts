import * as THREE from 'three';
import { TAM_THE, TAM_THE_PLAT } from './layout';
import { buildBuddha } from './statues';
import { sealArchitectureJoints } from './compound';
import { glowTexture, vietnameseColumnTexture, vietnamesePlaqueTexture, stoneTexture, woodTexture } from './textures';
import type { Seat, TempleCtx, Zone } from './temple';

const BASE = TAM_THE_PLAT.y;
const HX = 15, HZ = 9;

const COLUMN_LABELS = [
  'Quá khứ hiện tại vị lai, ba đời chư Phật cùng một ánh từ quang',
  'Một niệm tỉnh thức sáng soi, mười phương muôn cõi về nương cửa thiền',
];

/** Điện Tam Thế: điện lớn nhất chùa, nền cao 3.0, mái 3 tầng, thờ A Di Đà - Thích Ca - Di Lặc. */
export function buildTamThe(c: TempleCtx) {
  const { scene, colliders, lamb } = c;
  const g = new THREE.Group();
  g.name = 'tamThe';
  g.position.set(TAM_THE.x, 0, TAM_THE.z);
  const seats: Seat[] = [];
  const zones: Zone[] = [];
  const W = HX * 2, D = HZ * 2;
  const PW = TAM_THE_PLAT.hx * 2, PD = TAM_THE_PLAT.hz * 2;

  const stoneM = lamb(0xcfc4ae, { map: stoneTexture([200, 192, 174], [8, 1]) });
  const add = <T extends THREE.Object3D>(o: T, parent: THREE.Object3D = g) => { parent.add(o); return o; };
  const box = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, shadow = true, seal = false) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true;
    if (seal) o.userData.sealable = true;
    return add(o);
  };

  // Thềm bệ bằng gỗ (đồng bộ bậc thang). Texture riêng để không đổi repeat của sàn/bậc.
  const ledgeTopM = lamb(0xffffff, { map: woodTexture([10, 6]), roughness: 0.7 });
  const ledgeSideM = lamb(0xffffff, { map: woodTexture([10, 1]), roughness: 0.7 });
  // thứ tự mặt BoxGeometry: +x, -x, +y, -y, +z, -z
  const ledgeMats = [ledgeSideM, ledgeSideM, ledgeTopM, ledgeTopM, ledgeSideM, ledgeSideM];
  box(PW, BASE * 0.34, PD, ledgeMats, 0, BASE * 0.17, 0);
  box(PW - 1.6, BASE * 0.34, PD - 1.6, ledgeMats, 0, BASE * 0.34 + BASE * 0.17, 0);
  box(PW - 3.2, BASE * 0.32, PD - 3.2, ledgeMats, 0, BASE * 0.68 + BASE * 0.16, 0);
  const woodFloorM = lamb(0xffffff, { map: woodTexture([14, 7]), roughness: 0.7 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 2, D + 2), woodFloorM);
  floor.rotation.x = -Math.PI / 2; floor.position.y = BASE + 0.01; floor.receiveShadow = true; add(floor);

  const sz0 = TAM_THE_PLAT.zStart - TAM_THE.z;
  const sz1 = TAM_THE_PLAT.stairTop - TAM_THE.z; // = 10.4: mép Nam bệ trên L3 (local z), bậc trên cùng chồng lên mép này
  const nSteps = 20;
  // Gỗ riêng cho bậc: cùng ảnh gỗ sàn điện nhưng repeat theo kích thước bậc (9 m ngang, ~0.3 m sâu)
  // → mật độ vân ≈ sàn điện (~0.44 ô/m ngang), không bị nén thành sọc sẫm.
  const stairTop = woodFloorM.clone();
  stairTop.map = woodFloorM.map!.clone();
  stairTop.map.repeat.set(4, 1);
  stairTop.map.needsUpdate = true;
  const stairRiser = woodFloorM.clone();
  stairRiser.map = woodFloorM.map!.clone();
  stairRiser.map.repeat.set(4, 1);
  stairRiser.map.needsUpdate = true;
  const stairSide = woodFloorM.clone();
  stairSide.map = woodFloorM.map!.clone();
  stairSide.map.repeat.set(1, 1);
  stairSide.map.needsUpdate = true;
  // Thứ tự mặt BoxGeometry: +x, -x, +y(bước), -y, +z(đứng, hướng lên bệ), -z
  const stairMats = [stairSide, stairSide, stairTop, stairTop, stairRiser, stairRiser];
  const stairW = TAM_THE_PLAT.stairW * 2 + 0.6;
  // sz1 < sz0 (stairs ascend northward, z decreases), so use Math.abs to keep depth positive (negative depth inverts winding and culls faces under FrontSide).
  const stairD = Math.abs(sz1 - sz0) / nSteps + 0.02; // = 0.40
  for (let i = 0; i < nSteps; i++) {
    const t0 = i / nSteps, t1 = (i + 1) / nSteps;
    const h = BASE * t1;
    const zc = sz0 + (sz1 - sz0) * (t0 + t1) / 2;
    const step = new THREE.Mesh(new THREE.BoxGeometry(stairW, h, stairD), stairMats);
    step.position.set(0, h / 2, zc);
    step.castShadow = false; step.receiveShadow = true;
    add(step);
  }
  // Tay vịn cùng tông gỗ sáng (repeat theo chiều dài thanh)
  const railWoodM = woodFloorM.clone();
  railWoodM.map = woodFloorM.map!.clone();
  railWoodM.map.repeat.set(3, 1);
  railWoodM.map.needsUpdate = true;
  for (const s of [-1, 1]) {
    const len = Math.hypot(sz1 - sz0, BASE);
    const rail = box(0.5, 0.9, len, railWoodM, s * (TAM_THE_PLAT.stairW + 0.55), BASE * 0.5 + 0.45, (sz0 + sz1) / 2, false);
    rail.rotation.x = Math.atan2(BASE, sz0 - sz1);
  }

  const colH = 9.4;
  const colG = new THREE.CylinderGeometry(0.5, 0.6, colH + 0.34, 18);
  const baseG = new THREE.CylinderGeometry(0.82, 0.92, 0.34, 16);
  const stoneBase = lamb(0x7a7466);
  const capG = new THREE.BoxGeometry(1.7, 0.4, 1.7);
  const addCol = (x: number, z: number) => {
    const col = new THREE.Mesh(colG, c.redM);
    col.position.set(x, BASE + colH / 2 - 0.08, z); col.castShadow = true; col.userData.sealable = true; add(col);
    const b = new THREE.Mesh(baseG, stoneBase); b.position.set(x, BASE + 0.17, z); b.userData.sealable = true; add(b);
    const cap = new THREE.Mesh(capG, c.goldM); cap.position.set(x, BASE + colH + 0.14, z); cap.userData.sealable = true; add(cap);
    colliders.push({ x: TAM_THE.x + x, z: TAM_THE.z + z, r: 0.6 });
  };
  const fz = HZ - 0.7, bz = -HZ + 0.7, sx = HX - 0.7;
  const ENT = 5.6;
  for (const x of [-sx, -ENT, ENT, sx]) { addCol(x, fz); addCol(x, bz); }

  const beamY = BASE + colH + 0.55;
  box(W + 0.8, 0.65, 1.1, c.redM, 0, beamY, fz, true, true); box(W + 0.8, 0.65, 1.1, c.redM, 0, beamY, bz, true, true);
  box(1.1, 0.65, D + 0.8, c.redM, -sx, beamY, 0, true, true); box(1.1, 0.65, D + 0.8, c.redM, sx, beamY, 0, true, true);
  box(0.8, 0.55, D + 0.8, c.redM, 0, beamY - 0.04, 0, false);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lamb(0x4a1c12, { map: woodTexture([8, 4]) }));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = beamY - 0.28; add(ceiling);

  const purY = beamY + 0.33 + 0.2;
  const purW = W + 0.8 - 1.8, purD = D + 0.8 - 1.8;
  box(purW, 0.4, 0.4, c.redM, 0, purY, purD / 2, false); box(purW, 0.4, 0.4, c.redM, 0, purY, -purD / 2, false);
  box(0.4, 0.4, purD, c.redM, purW / 2, purY, 0, false); box(0.4, 0.4, purD, c.redM, -purW / 2, purY, 0, false);
  const roofBaseY = purY + 0.2;

  const darkTile = lamb(0x6a2a1a, { roughness: 0.7 });
  const soffitM = lamb(0x3a1710, { map: woodTexture([6, 2]) });
  const tier = (w: number, d: number, h: number, lift: number, y0: number) => {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(c.roofGeometry(w, d, h, lift), c.tileM);
    body.position.y = y0 + h / 2; body.castShadow = true; grp.add(body);
    const fw = w * 0.7071 * Math.SQRT2 * 0.5, fd = d * 0.7071 * Math.SQRT2 * 0.5;
    const fh = 0.4, ft = 0.2, fy = y0 + fh / 2 - 0.05;
    const fas = (bw: number, bd: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, fh, bd), darkTile); m.position.set(x, fy, z); m.castShadow = true; grp.add(m);
    };
    fas(fw * 2, ft, 0, fd); fas(fw * 2, ft, 0, -fd); fas(ft, fd * 2, fw, 0); fas(ft, fd * 2, -fw, 0);
    const sof = new THREE.Mesh(new THREE.PlaneGeometry(fw * 2, fd * 2), soffitM);
    sof.rotation.x = Math.PI / 2; sof.position.y = y0 + 0.02; grp.add(sof);
    add(grp);
    return y0 + h;
  };
  const goldBar = lamb(0xe8b64a, { emissive: 0x3a2a08 });
  const clerestory = (w: number, d: number, yBase: number, hgt: number) => {
    const grp = new THREE.Group();
    const t = 0.38;
    const mk = (bw: number, bd: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, hgt, bd), c.redM); m.position.set(x, yBase + hgt / 2, z); m.castShadow = true; grp.add(m);
      const n = Math.max(2, Math.floor(Math.max(bw, bd) / 0.9));
      for (let i = 0; i < n; i++) {
        const k = ((i + 0.5) / n - 0.5) * (Math.max(bw, bd) - 0.8);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(bw > bd ? 0.08 : bd + 0.02, hgt * 0.6, bw > bd ? bd + 0.02 : 0.08), goldBar);
        bar.position.set(x + (bw > bd ? k : 0), yBase + hgt / 2, z + (bw > bd ? 0 : k)); grp.add(bar);
      }
    };
    mk(w, t, 0, d / 2); mk(w, t, 0, -d / 2); mk(t, d, w / 2, 0); mk(t, d, -w / 2, 0);
    add(grp);
  };

  const h1 = 6.0, lift1 = 0.7;
  const top1 = tier(W + 5.5, D + 5, h1, lift1, roofBaseY);
  const cw1 = (W + 5.5) * 0.2, cd1 = (D + 5) * 0.2;
  const yc1 = top1 - h1 * 0.2 - 0.3;
  clerestory(cw1 * 0.78, cd1 * 0.78, yc1, 1.5);
  const y2 = yc1 + 1.5;
  const top2 = tier(W * 0.36, D * 0.36, 4.4, 0.55, y2 - 0.1);
  const cw2 = W * 0.36 * 0.2, cd2 = D * 0.36 * 0.2;
  const yc2 = top2 - 4.4 * 0.2 - 0.3;
  clerestory(cw2 * 0.7, cd2 * 0.7, yc2, 1.1);
  const y3 = yc2 + 1.1;
  const top3 = tier(W * 0.17, D * 0.17, 3.2, 0.5, y3 - 0.1);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(W * 0.17 * 0.5, 0.34, 0.45), c.goldM); ridge.position.y = top3 - 0.1; add(ridge);
  for (const sgn of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.1, 6), c.goldM);
    horn.position.set(sgn * W * 0.17 * 0.25, top3 + 0.25, 0); horn.rotation.z = -sgn * 0.5; add(horn);
  }
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 8), c.goldM); fin.position.y = top3 + 0.85; add(fin);
  g.userData.topY = top3 + 2.05;

  const hpFront = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 2.4), new THREE.MeshBasicMaterial({ map: vietnamesePlaqueTexture('ĐIỆN TAM THẾ'), toneMapped: false }));
  hpFront.position.set(0, beamY - 1.6, fz + 0.66); add(hpFront);
  const hpBack = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 2.1), new THREE.MeshBasicMaterial({ map: vietnamesePlaqueTexture('BA ĐỜI CHƯ PHẬT'), toneMapped: false }));
  hpBack.position.set(0, BASE + 8.2, -HZ + 0.3); add(hpBack);
  const board = (text: string, x: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 5.8), new THREE.MeshBasicMaterial({ map: vietnameseColumnTexture(text, 200, 1105), toneMapped: false }));
    m.position.set(x, BASE + 4.8, fz + 0.64);
    m.userData.inscription = { text };
    add(m);
  };
  board(COLUMN_LABELS[0], ENT);
  board(COLUMN_LABELS[1], -ENT);
  zones.push({ x: TAM_THE.x, z: TAM_THE.z + fz - 1, r: 6.5, id: 'tamThe' });

  const AW = 24;
  const backdrop = box(AW + 1.5, 9.0, 0.3, lamb(0x5a120c, { roughness: 0.6 }), 0, BASE + 4.5, -HZ + 0.15, false);
  backdrop.receiveShadow = true;
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(AW, 8.0), new THREE.MeshBasicMaterial({ color: 0x7a1c12 }));
  frame.position.set(0, BASE + 4.45, -HZ + 0.33); add(frame);
  for (const [w, h, y, x] of [[AW + 0.2, 0.12, 8.5, 0], [AW + 0.2, 0.12, 0.45, 0], [0.12, 8.1, 4.45, -AW / 2 - 0.05], [0.12, 8.1, 4.45, AW / 2 + 0.05]] as const) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8b64a).multiplyScalar(1.1) }));
    t.position.set(x, BASE + y, -HZ + 0.34); add(t);
  }
  const altarY = BASE + 0.9, altarZ = -HZ + 2.3;
  box(AW - 1, 0.9, 3.6, lamb(0x6d2a16, { roughness: 0.55 }), 0, BASE + 0.45, altarZ);
  box(AW - 0.7, 0.1, 3.9, c.goldM, 0, altarY + 0.05, altarZ, false);
  for (let i = -5; i <= 5; i++) colliders.push({ x: TAM_THE.x + i * 2.2, z: TAM_THE.z + altarZ, r: 1.6 });

  const lead = buildBuddha();
  const place = (x: number, s: number, ry: number) => { const b = lead.clone(true); b.scale.setScalar(s); b.position.set(x, altarY, altarZ); b.rotation.y = ry; add(b); return b; };
  const mainB = place(0, 1.2, 0);
  const amidaB = place(-7.6, 0.92, 0.12);
  const diLacB = place(7.6, 0.92, -0.12);
  amidaB.name = 'amida'; diLacB.name = 'dilac';
  const diLacBelly = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 16), lamb(0xe9c987, { roughness: 0.55 }));
  diLacBelly.scale.set(1.15, 0.9, 0.8); diLacBelly.position.set(7.6, altarY + 2.05 * 0.92, altarZ + 0.95 * 0.92 - 0.1); add(diLacBelly);

  const tableZ = -HZ + 6.2;
  box(10, 0.16, 1.6, lamb(0x7a1c12), 0, BASE + 1.1, tableZ);
  for (const x of [-4.7, 4.7]) for (const z of [-0.65, 0.65]) box(0.18, 1.1, 0.18, lamb(0x5a1410), x, BASE + 0.55, tableZ + z, false);
  for (const x of [-3.2, 3.2]) {
    const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 8), lamb(0xf5e8d0)); cand.position.set(x, BASE + 1.46, tableZ); add(cand);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc060).multiplyScalar(2) }));
    flame.scale.y = 1.6; flame.position.set(x, BASE + 1.82, tableZ); add(flame);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffb040, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(1.4); spr.position.set(x, BASE + 1.82, tableZ); add(spr); c.glowSprites.push(spr);
  }
  const bronze = lamb(0xa8741f, { metalness: 0.7, roughness: 0.38 });
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.3, 0.5, 14), bronze); burner.position.set(0, BASE + 1.42, tableZ); add(burner);
  const fruitM = [lamb(0xf08a24), lamb(0xd8352a), lamb(0xf5d24a)];
  [[-1.5, 0], [-1.25, 0.26], [-1.75, 0.24], [-1.5, 0.12]].forEach(([dx, dz], i) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), fruitM[i % 3]); f.position.set(dx, BASE + 1.33 + (i === 3 ? 0.25 : 0), tableZ + dz); add(f);
  });
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.19, 0.46, 10), lamb(0x7fc4a8, { emissive: 0x143026 })); vase.position.set(1.7, BASE + 1.4, tableZ); add(vase);
  for (let k = 0; k < 5; k++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), lamb([0xff8fb6, 0xffffff, 0xffd35a][k % 3], { emissive: 0x201010 }));
    fl.position.set(1.7 + (k - 2) * 0.1, BASE + 1.78 + (k % 2) * 0.12, tableZ + (k % 2 - 0.5) * 0.1); add(fl);
  }
  for (const x of [-3, 0, 3]) colliders.push({ x: TAM_THE.x + x, z: TAM_THE.z + tableZ, r: 1.05 });

  const lanterns = new THREE.InstancedMesh(new THREE.SphereGeometry(0.36, 12, 10), c.redBase, 18);
  const d = new THREE.Object3D(); let li = 0;
  for (const x of [-12, -7.5, 7.5, 12]) for (const z of [-2, 3, 7]) {
    if (li >= 18) break;
    d.position.set(x, BASE + 7.6, z); d.scale.set(1, 1.2, 1); d.updateMatrix(); lanterns.setMatrixAt(li++, d.matrix);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff4a28, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(2.2); spr.position.set(x, BASE + 7.6, z); add(spr); c.glowSprites.push(spr);
  }
  lanterns.count = li; add(lanterns);

  const matM = lamb(0xe8b83a, { roughness: 0.95 }), cushM = lamb(0xa0201a, { roughness: 0.8 });
  const rows = [-0.4, 1.4, 3.2, 5.0], cols = [3.2, 4.7, 6.2, 7.7, 9.2, 10.7];
  const n = rows.length * cols.length * 2;
  const mats = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.04, 1.05), matM, n);
  const cush = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.38, 0.1, 16), cushM, n);
  let k2 = 0;
  for (const s of [-1, 1]) for (const z of rows) for (const x of cols) {
    d.scale.setScalar(1);
    d.position.set(s * x, BASE + 0.03, z); d.updateMatrix(); mats.setMatrixAt(k2, d.matrix);
    d.position.set(s * x, BASE + 0.1, z); d.updateMatrix(); cush.setMatrixAt(k2, d.matrix);
    seats.push({ x: TAM_THE.x + s * x, z: TAM_THE.z + z, ry: Math.PI }); k2++;
  }
  mats.receiveShadow = cush.receiveShadow = true; add(mats); add(cush);

  scene.add(g);
  const seal = sealArchitectureJoints(g, { maxGap: 0.9, minOverlap: 0.05 });
  if (seal.remaining.length > 8) {
    console.warn(`điện Tam Thế: ${seal.filled} khe đã bù, ${seal.remaining.length} khe lớn còn lại`);
    if (import.meta.env.DEV) console.warn('gapdump ' + JSON.stringify(seal.remaining));
  }
  const halos = [mainB, amidaB, diLacB].map((b) => b.getObjectByName('halo')).filter((x): x is THREE.Object3D => !!x);
  return { group: g, seats, zones, halos };
}
