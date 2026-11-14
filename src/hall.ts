import * as THREE from 'three';
import { HALL } from './layout';
import { buildBuddha } from './statues';
import { sealArchitectureJoints } from './compound';
import { glowTexture, vietnameseColumnTexture, vietnamesePlaqueTexture, stoneTexture, woodTexture } from './textures';
import { buildZafuParts } from './zafu';
import type { Seat, TempleCtx, Zone } from './temple';

const BASE = HALL.h; // top of platform

/** Câu đối tiếng Việt treo trên hai cột tiền đường (thay chữ Hán). */
const COLUMN_LABELS = ['Cửa thiền rộng mở đón người về nương Phật', 'Lòng tịnh an nhiên nghe chuông vọng núi xa'];

/** Open-sided main hall (chính điện): columns + roof only, meditation seating inside, altar with Tam Thế Phật. */
export function buildHall(c: TempleCtx) {
  const { scene, colliders, lamb } = c;
  const g = new THREE.Group();
  g.name = 'hall';
  g.position.set(HALL.x, 0, HALL.z);
  const seats: Seat[] = [];
  const zones: Zone[] = [];
  const W = HALL.hx * 2, D = HALL.hz * 2;

  const stoneM = lamb(0xcfc4ae, { map: stoneTexture([200, 192, 174], [8, 1]) });
  const add = <T extends THREE.Object3D>(o: T, parent: THREE.Object3D = g) => { parent.add(o); return o; };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, shadow = true, seal = false) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true;
    if (seal) o.userData.sealable = true;
    return add(o);
  };

  // platform tiers (match groundY ramp) + wooden floor
  const tiers: [number, number][] = [[0.8, 0.45], [0.45, 0.9], [0, BASE]];
  for (const [e, h] of tiers) box(W + e * 2, h, D + e * 2, stoneM, 0, h / 2, 0);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, D - 0.2), lamb(0xffffff, { map: woodTexture([12, 6]), roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = BASE + 0.01; floor.receiveShadow = true; add(floor);
  for (let i = 0; i < 3; i++) box(10.4 - i * 0.7, 0.45, 1.0, lamb(0xb9ae98), 0, 0.225, D / 2 + 1.1 - i * 0.3, false);

  // ---- columns (no middle columns in front of the altar) ----
  const colH = 7.6;
  // thân cột dài hơn khoảng thông thuỷ để ăn sâu vào bệ đá (dưới) và đấu gỗ (trên)
  const colG = new THREE.CylinderGeometry(0.42, 0.5, colH + 0.34, 18);
  const baseG = new THREE.CylinderGeometry(0.7, 0.8, 0.34, 16);
  const stoneBase = lamb(0x7a7466);
  const capG = new THREE.BoxGeometry(1.5, 0.38, 1.5);
  const addCol = (x: number, z: number) => {
    // cột hạ thấp 0.16 vào bệ đá và vươn lên 0.3 vào đấu (cap) → không còn khe sáng chân/đầu cột
    const col = new THREE.Mesh(colG, c.redM);
    col.position.set(x, BASE + colH / 2 - 0.08, z); col.castShadow = true; col.userData.sealable = true; add(col);
    const b = new THREE.Mesh(baseG, stoneBase); b.position.set(x, BASE + 0.17, z); b.userData.sealable = true; add(b);
    const cap = new THREE.Mesh(capG, c.goldM); cap.position.set(x, BASE + colH + 0.14, z); cap.userData.sealable = true; add(cap);
    colliders.push({ x: HALL.x + x, z: HALL.z + z, r: 0.5 });
  };
  const fz = HALL.hz - 0.7, bz = -HALL.hz + 0.7, sx = HALL.hx - 0.7;
  const ENT = 4.9; // hai cột tiền đường mang câu đối
  // 8 cột chính: 2 cột tiền đường + 2 cột hậu + 4 cột góc (hàng trước và sau)
  const frontX = [-sx, -ENT, ENT, sx];
  for (const x of frontX) { addCol(x, fz); addCol(x, bz); }

  // ---- hệ xà: vành chu vi + xà dọc trục giữa ----
  const beamY = BASE + colH + 0.5;
  box(W + 0.8, 0.6, 1.0, c.redM, 0, beamY, fz, true, true); box(W + 0.8, 0.6, 1.0, c.redM, 0, beamY, bz, true, true);
  box(1.0, 0.6, D + 0.8, c.redM, -sx, beamY, 0, true, true); box(1.0, 0.6, D + 0.8, c.redM, sx, beamY, 0, true, true);
  box(0.7, 0.5, D + 0.8, c.redM, 0, beamY - 0.04, 0, false);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lamb(0x4a1c12, { map: woodTexture([8, 4]) }));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = beamY - 0.25; add(ceiling);

  // vành đòn tay lùi vào 0.8 so với mặt xà, nằm trên xà: mái tầng 1 tựa lên vành này
  const purY = beamY + 0.3 + 0.2;
  const purW = W + 0.8 - 1.6, purD = D + 0.8 - 1.6;
  box(purW, 0.4, 0.4, c.redM, 0, purY, purD / 2, false); box(purW, 0.4, 0.4, c.redM, 0, purY, -purD / 2, false);
  box(0.4, 0.4, purD, c.redM, purW / 2, purY, 0, false); box(0.4, 0.4, purD, c.redM, -purW / 2, purY, 0, false);
  const roofBaseY = purY + 0.2;

  // ---- mái 3 tầng dạng khối đặc ----
  // hàm cao độ sườn mái tại tỉ lệ t (0 = đỉnh, 1 = chân) — theo đúng roofGeometry
  const roofGeo = (w: number, d: number, h: number, lift: number) => c.roofGeometry(w, d, h, lift);
  const darkTile = lamb(0x6a2a1a, { roughness: 0.7 });
  const soffitM = lamb(0x3a1710, { map: woodTexture([6, 2]) });
  /** Dựng 1 tầng mái: thân + diềm + soffit. y0 = cao độ chân mái. Trả về cao độ đỉnh. */
  const tier = (w: number, d: number, h: number, lift: number, y0: number) => {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(roofGeo(w, d, h, lift), c.tileM);
    body.position.y = y0 + h / 2; body.castShadow = true; grp.add(body);
    // diềm mái quanh chu vi chân
    const fw = w * 0.7071 * 1.0 * Math.SQRT2 * 0.5, fd = d * 0.7071 * Math.SQRT2 * 0.5;
    const fh = 0.38, ft = 0.18, fy = y0 + fh / 2 - 0.05;
    const fas = (bw: number, bd: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, fh, bd), darkTile); m.position.set(x, fy, z); m.castShadow = true; grp.add(m);
    };
    fas(fw * 2, ft, 0, fd); fas(fw * 2, ft, 0, -fd); fas(ft, fd * 2, fw, 0); fas(ft, fd * 2, -fw, 0);
    // soffit: mặt ngang nối diềm vào vành đòn tay
    const sof = new THREE.Mesh(new THREE.PlaneGeometry(fw * 2, fd * 2), soffitM);
    sof.rotation.x = Math.PI / 2; sof.position.y = y0 + 0.02; grp.add(sof);
    add(grp);
    return y0 + h;
  };
  // cổ diêm: vành tường đứng đỏ + cửa sổ hoa, chôn 0.3 vào sườn mái dưới, đỉnh đỡ chân mái trên
  const goldBar = lamb(0xe8b64a, { emissive: 0x3a2a08 });
  const clerestory = (w: number, d: number, yBase: number, hgt: number) => {
    const grp = new THREE.Group();
    const t = 0.35;
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

  // tầng 1
  const h1 = 4.8, lift1 = 0.6;
  const top1 = tier(W + 5, D + 4.5, h1, lift1, roofBaseY);
  // sườn tầng 1 tại t=0.18 → thu về chu vi còn ~0.2 của chân
  const cw1 = (W + 5) * 0.2, cd1 = (D + 4.5) * 0.2;
  const yc1 = top1 - h1 * 0.2 - 0.3;
  clerestory(cw1 * 0.78, cd1 * 0.78, yc1, 1.2);
  // tầng 2
  const y2 = yc1 + 1.2;
  const top2 = tier(W * 0.34, D * 0.34, 3.6, 0.5, y2 - 0.1);
  const cw2 = W * 0.34 * 0.2, cd2 = D * 0.34 * 0.2;
  const yc2 = top2 - 3.6 * 0.2 - 0.3;
  clerestory(cw2 * 0.7, cd2 * 0.7, yc2, 0.9);
  // tầng 3
  const y3 = yc2 + 0.9;
  const top3 = tier(W * 0.16, D * 0.16, 2.6, 0.45, y3 - 0.1);
  // nóc: xà nóc vàng + 2 đầu đao + chóp
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(W * 0.16 * 0.5, 0.3, 0.4), c.goldM); ridge.position.y = top3 - 0.1; add(ridge);
  for (const sgn of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 6), c.goldM);
    horn.position.set(sgn * W * 0.16 * 0.25, top3 + 0.2, 0); horn.rotation.z = -sgn * 0.5; add(horn);
  }
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.0, 8), c.goldM); fin.position.y = top3 + 0.7; add(fin);

  // ---- hoành phi ----
  const hpFront = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 2.25), new THREE.MeshBasicMaterial({ map: vietnamesePlaqueTexture('ĐẠI HÙNG BẢO ĐIỆN'), toneMapped: false }));
  hpFront.position.set(0, beamY - 1.5, fz + 0.62); add(hpFront);
  const hpBack = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.05), new THREE.MeshBasicMaterial({ map: vietnamesePlaqueTexture('PHẬT NHẬT TĂNG HUY'), toneMapped: false }));
  hpBack.position.set(0, BASE + 7.0, -HALL.hz + 0.3); add(hpBack);

  // ---- câu đối on the two entrance columns only ----
  // ---- câu đối tiếng Việt trên hai cột tiền đường ----
  const board = (text: string, x: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 5.2), new THREE.MeshBasicMaterial({ map: vietnameseColumnTexture(text, 200, 1090), toneMapped: false }));
    m.position.set(x, BASE + 4.15, fz + 0.54);
    m.userData.inscription = { text };
    add(m);
  };
  board(COLUMN_LABELS[0], ENT);
  board(COLUMN_LABELS[1], -ENT);
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
  const matM = lamb(0xe8b83a, { roughness: 0.95 });
  const rows = [-3.2, -1.4, 0.4, 2.2, 4.0, 5.8], cols = [3.4, 4.9, 6.4, 7.9, 9.4, 10.9, 12.4, 13.9];
  const n = rows.length * cols.length * 2;
  const mats = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.04, 1.05), matM, n);
  const zafuPos: { x: number; z: number }[] = [];
  let k = 0;
  for (const s of [-1, 1]) for (const z of rows) for (const x of cols) {
    d.scale.setScalar(1);
    d.position.set(s * x, BASE + 0.03, z); d.updateMatrix(); mats.setMatrixAt(k, d.matrix);
    zafuPos.push({ x: s * x, z });
    seats.push({ x: HALL.x + s * x, z: HALL.z + z, ry: Math.PI }); k++;
  }
  mats.receiveShadow = true; add(mats);
  const zafu = buildZafuParts(0.38, 0.10, BASE + 0.15, zafuPos);
  for (const zm of [zafu.body, zafu.ring, zafu.button]) { zm.castShadow = false; add(zm); }

  scene.add(g);
  // khít mọi khe cột–kèo–mái trong chánh điện
  const seal = sealArchitectureJoints(g, { maxGap: 0.9, minOverlap: 0.05 });
  if (seal.remaining.length > 8) {
    console.warn(`chánh điện: ${seal.filled} khe đã bù, ${seal.remaining.length} khe lớn còn lại`);
    if (import.meta.env.DEV) console.warn('gapdump ' + JSON.stringify(seal.remaining));
  }
  const halos = [mainB, ...sideBs].map((b) => b.getObjectByName('halo')).filter((x): x is THREE.Object3D => !!x);
  return { group: g, seats, zones, halos };
}
