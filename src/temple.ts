import * as THREE from 'three';
import { COUPLETS } from './couplets';
import { buildHall } from './hall';
import {
  NHA_TO, NHA_TO_PLAT, DIEN_MAU, DIEN_MAU_PLAT, NHA_KHACH, NHA_KHACH_PLAT, THIEN_DUONG, THIEN_DUONG_PLAT, TANG_XA, TANG_XA_PLAT, AM_CO, AM_CO_PLAT, VUON_THAP, VUON_THAP_PLAT, BAO_THAP, BAO_THAP_PLAT, BELL, BRIDGE, BUDDHA_YARD, CORR, DECK, DEN_TRINH, DRUM, LAKE, PAGODA, PATH_Z, PIER, PIER_FLOOR, PIER_RAMP, PLAZA, QUAN, QUAN_PLAT, QUAN_ROT, REST, SIDE_X, WALL, ZEN, bridgeY, groundY, inLake, resolveWater,
} from './layout';
import { buildArhat, buildBuddha, buildQuanAm } from './statues';
import { createKoi, swimKoi, type Koi, type KoiVariety } from './koi';
import { buildFlowerBeds, buildRestArea, buildZenGarden, placeKoiPond, relabelColumns, sealArchitectureJoints } from './compound';
import { glowTexture, signTexture, stoneTexture, sutraPillarTexture, vietnameseColumnTexture, woodTexture } from './textures';

export interface Seat { x: number; z: number; ry: number; rest?: boolean }
export interface Zone { x: number; z: number; r: number; id: string }
export interface TempleCtx {
  scene: THREE.Scene;
  colliders: { x: number; z: number; r: number }[];
  lamb: (c: number, extra?: Partial<THREE.MeshStandardMaterialParameters>) => THREE.MeshStandardMaterial;
  roofGeometry: (w: number, d: number, h: number, lift?: number) => THREE.BufferGeometry;
  tileM: THREE.Material;
  redM: THREE.Material;
  goldM: THREE.Material;
  wallM: THREE.Material;
  redBase: THREE.Material;
  glowSprites: THREE.Sprite[];
}
export { groundY, resolveWater };

/** Bảng chữ Việt trên các cột chùa (thay chữ Hán cũ). */
const COLUMN_LABELS = {
  tamQuan: ['Cửa từ bi mở rộng đón khách mười phương', 'Lòng hỷ xả bao dung độ khắp muôn loài'],
  chuong: ['Tiếng chuông ngân tỉnh giấc mộng trần gian', 'Hương trầm thoảng dẫn lối về cõi tịnh'],
  trong: ['Tiếng trống vọng sân thiền tan phiền não', 'Âm vang cửa Phật tỏ rõ lòng thành'],
  denTrinh: ['Dừng chân trình diện gột bụi trần', 'Thắp nén hương lành mở lối vào chùa'],
  thap: ['Tháp ngọc vươn mây ngàn thu vững chãi', 'Thân vàng soi nắng muôn thuở lung linh'],
  hanhLang: ['Dừng chân bên hiên vắng nghe gió hát', 'Rửa lòng nơi cửa Phật ngắm sen hồng'],
};

export function buildTemple(c: TempleCtx) {
  const { scene, colliders, lamb } = c;
  const seats: Seat[] = [];
  const zones: Zone[] = [];
  const d = new THREE.Object3D();
  const stoneM = lamb(0xcfc4ae, { map: stoneTexture([200, 192, 174], [3, 1]) });
  const glowSpr = (x: number, y: number, z: number, s: number, color = 0xffb040, op = 0.5, parent: THREE.Object3D = scene) => {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(s); spr.position.set(x, y, z); parent.add(spr); c.glowSprites.push(spr); return spr;
  };
  /** Bảng chữ Việt gắn lên cột; userData.inscription cho phép relabelColumns() đổi nội dung sau. */
  const labelBoard = (parent: THREE.Object3D, text: string, w: number, h: number, x: number, y: number, z: number, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: vietnameseColumnTexture(text, 200, Math.round(200 * h / w)), toneMapped: false }));
    m.position.set(x, y, z); m.rotation.y = ry;
    m.userData.inscription = { text };
    parent.add(m);
    return m;
  };

  // ---- main hall (open pavilion) ----
  const hall = buildHall(c);
  seats.push(...hall.seats); zones.push(...hall.zones);

  // ---- meditation decks: bồ đoàn rộng hơn 30%, xếp thưa, viền cánh sen ----
  const woodM = lamb(0xffffff, { map: woodTexture([5, 3]) });
  const matM = lamb(0xe8b83a, { roughness: 0.95 }), cushM = lamb(0xa0201a, { roughness: 0.8 });
  // bước hàng 1.5 → 1.9, bước cột 1.3 → 1.7 → 7×7 chỗ mỗi dãy (98 chỗ cả hai dãy)
  const rows = [-17.6, -15.7, -13.8, -11.9, -10.0, -8.1, -6.2];
  const cols = [5.7, 7.4, 9.1, 10.8, 12.5, 14.2, 15.9];
  const PETALS = 8;
  const nSeats = rows.length * cols.length * 2;
  const mats = new THREE.InstancedMesh(new THREE.BoxGeometry(1.43, 0.04, 1.36), matM, nSeats);
  const cush = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.44, 0.49, 0.12, 20), cushM, nSeats);
  // 8 cánh sen quanh mỗi bồ đoàn, màu hồng/trắng xen kẽ — 1 draw call cho toàn bộ
  const petalM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0 });
  const petalMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), petalM, nSeats * PETALS);
  const petalCols = [new THREE.Color(0xf4978e), new THREE.Color(0xffe3e6)];
  mats.receiveShadow = cush.receiveShadow = petalMesh.receiveShadow = true;
  cush.castShadow = petalMesh.castShadow = true;
  let k = 0, pk = 0;
  const up = new THREE.Object3D();
  for (const side of [-1, 1]) {
    const w = DECK.x1 - DECK.x0, dz = DECK.z1 - DECK.z0;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, dz), woodM);
    deck.position.set(side * (DECK.x0 + w / 2), 0.1, (DECK.z0 + DECK.z1) / 2); deck.receiveShadow = deck.castShadow = true; scene.add(deck);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.08, dz + 0.3), lamb(0x5a3a22));
    edge.position.set(deck.position.x, 0.04, deck.position.z); scene.add(edge);
    for (const z of rows) for (const cx of cols) {
      const x = side * cx;
      d.position.set(x, DECK.y + 0.02, z); d.updateMatrix(); mats.setMatrixAt(k, d.matrix);
      d.position.set(x, DECK.y + 0.1, z); d.updateMatrix(); cush.setMatrixAt(k, d.matrix);
      // vành cánh sen ngửa nhẹ ra ngoài, hơi chồng nhau như đài sen thật
      for (let p = 0; p < PETALS; p++) {
        const a = (p / PETALS) * Math.PI * 2 + 0.2;
        up.position.set(x + Math.cos(a) * 0.47, DECK.y + 0.14, z + Math.sin(a) * 0.47);
        up.scale.set(0.15, 0.235, 0.075);
        up.rotation.set(0, -a + Math.PI / 2, 0);
        up.rotateX(0.55);                 // ngửa ra ngoài
        up.updateMatrix();
        petalMesh.setMatrixAt(pk, up.matrix);
        petalMesh.setColorAt(pk, petalCols[p % 2]);
        pk++;
      }
      seats.push({ x, z, ry: Math.PI }); k++;
    }
  }
  mats.instanceMatrix.needsUpdate = true;
  cush.instanceMatrix.needsUpdate = true;
  petalMesh.instanceMatrix.needsUpdate = true;
  if (petalMesh.instanceColor) petalMesh.instanceColor.needsUpdate = true;
  scene.add(mats, cush, petalMesh);

  // ---- covered corridors (hành lang) ----
  const corridor = new THREE.Group(); corridor.name = 'corridors'; scene.add(corridor);
  const pillarG = new THREE.CylinderGeometry(0.17, 0.2, 3.3, 10), baseG = new THREE.BoxGeometry(0.5, 0.22, 0.5);
  const slabG = new THREE.BoxGeometry(2.7, 0.16, CORR.z1 - CORR.z0 + 1.2);
  const roofM = lamb(0xb4502c, { roughness: 0.6 }), stoneBase = lamb(0x6b6458);
  const floorT = stoneTexture([158, 150, 138], [2, 8]);
  const spacing = 3.6, zs: number[] = [];
  for (let z = CORR.z0 + 0.6; z <= CORR.z1 - 0.4; z += spacing) zs.push(z);
  const lanterns = new THREE.InstancedMesh(new THREE.SphereGeometry(0.26, 12, 10), c.redBase, zs.length * 4);
  let li = 0;
  for (const side of [-1, 1]) {
    const cx = side * CORR.x, zc = (CORR.z0 + CORR.z1) / 2, len = CORR.z1 - CORR.z0;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(CORR.half * 2, 0.12, len), lamb(0xffffff, { map: floorT }));
    floor.position.set(cx, 0.06, zc); floor.receiveShadow = true; corridor.add(floor);
    for (const off of [-1.7, 1.7]) {
      for (const z of zs) {
        // cột ăn sâu vào nền 0.22 để không hở chân cột, và chạm đáy xà phía trên
        const p = new THREE.Mesh(pillarG, c.redM); p.position.set(cx + off, CORR.y + 1.55, z); p.castShadow = true;
        p.userData.sealable = true; p.name = 'corridor-pillar'; corridor.add(p);
        const b = new THREE.Mesh(baseG, stoneBase); b.position.set(cx + off, CORR.y + 0.11, z);
        b.userData.sealable = true; corridor.add(b);
        colliders.push({ x: cx + off, z, r: 0.22 });
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, len + 0.6), c.redM);
      rail.position.set(cx + off, CORR.y + 3.24, zc); rail.castShadow = true; rail.userData.sealable = true; corridor.add(rail);
    }
    for (const s of [-1, 1]) {
      const slab = new THREE.Mesh(slabG, roofM);
      slab.position.set(cx + s * 1.18, CORR.y + 3.86, zc); slab.rotation.z = -s * 0.45; slab.castShadow = true;
      slab.userData.sealable = true; corridor.add(slab);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, len + 1.3), c.goldM);
    ridge.position.set(cx, CORR.y + 4.54, zc); ridge.userData.sealable = true; corridor.add(ridge);
    for (const z of zs) for (const off of [-1.15, 1.15]) {
      d.position.set(cx + off, CORR.y + 2.75, z + spacing / 2); d.scale.set(1, 1.2, 1); d.updateMatrix(); lanterns.setMatrixAt(li++, d.matrix);
    }
    for (let z = CORR.z0 + 2.4; z < CORR.z1 - 1; z += spacing * 2) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 1.8), lamb(0x6d4426));
      bench.position.set(cx - side * 1.3, CORR.y + 0.5, z); bench.castShadow = true; corridor.add(bench);
      for (const lz of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), lamb(0x4a2e18));
        leg.position.set(bench.position.x, CORR.y + 0.25, z + lz); corridor.add(leg);
      }
    }
  }
  d.scale.setScalar(1); lanterns.count = li; scene.add(lanterns);
  // bảng chữ Việt treo trên hai cột đầu hành lang
  for (const side of [-1, 1]) {
    labelBoard(corridor, COLUMN_LABELS.hanhLang[side > 0 ? 0 : 1], 0.5, 2.4, side * (CORR.x - 1.7), CORR.y + 1.9, CORR.z1 - 1.2, side > 0 ? 0 : Math.PI);
  }
  sealArchitectureJoints(corridor, { maxGap: 0.4 });

  // ---- tượng La Hán dọc hai hành lang: 10 tượng mỗi bên, quay mặt vào trục ----
  /*
   * z = -17.5 + 1.8k (k = 0..9): luôn cách cột hành lang (z = -18.4 + 3.6j) đúng 0.9.
   * Ghế dài nằm ở hàng trong (lệch -side × 1.3) tại z = -16.6, -9.4, -2.2, nên các slot trùng ghế
   * (k = 0, 1, 4, 5, 8, 9) đặt ở hàng ngoài; k = 2, 3, 6, 7 đặt ở hàng trong → thứ tự ngoài-ngoài-trong-trong.
   */
  const arhatGroup = new THREE.Group(); arhatGroup.name = 'arhats'; scene.add(arhatGroup);
  const arhatModels = ([0, 1, 2] as const).map((v) => buildArhat(v));
  const arhatPedM = lamb(0x9a8f7a, { map: stoneTexture([170, 160, 140], [1, 1], 2) });
  const ARHAT_INNER = new Set([2, 3, 6, 7]);
  for (const side of [-1, 1] as const) {
    for (let k = 0; k < 10; k++) {
      const z = -17.5 + 1.8 * k;
      const x = side * CORR.x + (ARHAT_INNER.has(k) ? -side : side) * 1.5;
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.8), arhatPedM);
      ped.position.set(x, CORR.y + 0.275, z); ped.castShadow = ped.receiveShadow = true; ped.userData.sealable = true; arhatGroup.add(ped);
      const a = arhatModels[(k + (side > 0 ? 1 : 0)) % 3].clone(true);
      a.position.set(x, CORR.y + 0.55, z); a.rotation.y = -side * Math.PI / 2;
      arhatGroup.add(a);
      colliders.push({ x, z, r: 0.42 });
    }
  }
  const arhatSeal = sealArchitectureJoints(arhatGroup, { maxGap: 0.3 });
  if (import.meta.env.DEV) console.warn(`gapdump arhats: filled=${arhatSeal.filled} remaining=${arhatSeal.remaining.length} ` + JSON.stringify(arhatSeal.remaining));

  // ---- bell tower ----
  const tower = (x: number, z: number, ry: number, sign: string, coupletId?: keyof typeof COUPLETS) => {
    const t = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(5.6 - i * 0.7, 0.4, 5.6 - i * 0.7), stoneM);
      st.position.y = 0.2 + i * 0.4; st.castShadow = st.receiveShadow = true; st.userData.sealable = true; t.add(st);
    }
    /*
     * NGÔN NGỮ KẾT CẤU CHUẨN CHO MỌI THÁP (chuông, trống và các tháp sau này):
     *   bệ đá 2 tầng → chân cột đá → cột đỏ → xà dưới → xà trên → đấu củng (khối đỡ)
     *   → vành xà đỡ mái → mái tầng 1 → cổ mái vuông → mái tầng 2 → cổ chóp → chóp vàng.
     * Quy tắc: mỗi cấu kiện phải CHẠM (hoặc ăn sâu vào) cấu kiện liền kề theo chiều đứng,
     * không cấu kiện nào lơ lửng; mọi mối nối đều đánh dấu sealable để sealArchitectureJoints bù.
     */
    const by = 0.8, H = 1.9, P: [number, number][] = [[-H, -H], [H, -H], [-H, H], [H, H]];
    const stone = (w: number, h: number, dp: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), stoneM);
      m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; m.userData.sealable = true; t.add(m); return m;
    };
    const red = (w: number, h: number, dp: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), c.redM);
      m.position.set(x, y, z); m.castShadow = true; m.userData.sealable = true; t.add(m); return m;
    };
    const colBase = by + 0.3, colTop = by + 4.5;
    for (const [px, pz] of P) {
      stone(0.72, 0.4, 0.72, px, by + 0.2, pz);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, colTop - colBase + 0.1, 12), c.redM);
      p.position.set(px, (colBase + colTop) / 2, pz); p.castShadow = true; p.userData.sealable = true; t.add(p);
    }
    const beamLow = by + 3.3, beamHigh = by + 4.45;
    for (const y of [beamLow, beamHigh]) for (const s of [-H, H]) {
      red(2 * H + 0.5, 0.24, 0.26, 0, y, s);
      red(0.26, 0.24, 2 * H + 0.5, s, y, 0);
    }
    for (const [px, pz] of P) red(0.6, 0.3, 0.6, px, beamHigh + 0.26, pz);
    const ringY = beamHigh + 0.55;
    for (const s of [-H, H]) {
      red(2 * H + 1.2, 0.2, 0.34, 0, ringY, s);
      red(0.34, 0.2, 2 * H + 1.2, s, ringY, 0);
    }
    const r1H = 2.1, r1Y = ringY + 0.1 + r1H / 2 - 0.2;
    const r1 = new THREE.Mesh(c.roofGeometry(8.2, 8.2, r1H, 0.8), c.tileM); r1.position.y = r1Y; r1.castShadow = true; r1.userData.sealable = true; t.add(r1);
    const NK = 1.3, neckH = 1.5, neckY = r1Y + r1H / 2 - 0.2 + neckH / 2;
    for (const [px, pz] of [[-NK, -NK], [NK, -NK], [-NK, NK], [NK, NK]] as [number, number][]) {
      const nc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, neckH + 0.1, 10), c.redM);
      nc.position.set(px, neckY, pz); nc.castShadow = true; nc.userData.sealable = true; t.add(nc);
    }
    for (const y of [neckY - neckH / 2 + 0.12, neckY + neckH / 2 - 0.12]) for (const s of [-NK, NK]) {
      red(2 * NK + 0.4, 0.2, 0.22, 0, y, s);
      red(0.22, 0.2, 2 * NK + 0.4, s, y, 0);
    }
    const panelH = neckH * 0.42, panelY = neckY - neckH / 2 + 0.12 + panelH / 2 + 0.1;
    for (const s of [-NK, NK]) {
      red(2 * NK, panelH, 0.12, 0, panelY, s);
      red(0.12, panelH, 2 * NK, s, panelY, 0);
    }
    const r2H = 1.5, r2Y = neckY + neckH / 2 + r2H / 2 - 0.3;
    const r2 = new THREE.Mesh(c.roofGeometry(5.4, 5.4, r2H, 0.55), c.tileM); r2.position.y = r2Y; r2.castShadow = true; r2.userData.sealable = true; t.add(r2);
    const finBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.4, 8), c.goldM);
    finBase.position.y = r2Y + r2H / 2 + 0.1; finBase.userData.sealable = true; t.add(finBase);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 8), c.goldM);
    fin.position.y = r2Y + r2H / 2 + 0.6; fin.userData.sealable = true; t.add(fin);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.7), new THREE.MeshBasicMaterial({ map: signTexture(sign) }));
    sg.position.set(0, beamHigh - 0.55, H + 0.3); t.add(sg);
    if (coupletId) {
      for (let i = 0; i < 2; i++) {
        labelBoard(t, COLUMN_LABELS[coupletId as 'chuong' | 'trong'][i], 0.46, 2.6, i ? -1.9 : 1.9, by + 2.25, 2.19);
      }
    }
    t.position.set(x, 0, z); t.rotation.y = ry; scene.add(t);
    const seal = sealArchitectureJoints(t, { maxGap: 0.5 });
    if (import.meta.env.DEV) console.warn(`gapdump tower ${sign}: filled=${seal.filled} remaining=${seal.remaining.length} ` + JSON.stringify(seal.remaining));
    for (const [px, pz] of P) {
      const v = new THREE.Vector3(px, 0, pz).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
      colliders.push({ x: x + v.x, z: z + v.z, r: 0.3 });
    }
    return { t, by };
  };
  const bt = tower(BELL.x, BELL.z, Math.PI / 2, 'THÁP CHUÔNG', 'chuong');
  const bronze = lamb(0xa8741f, { metalness: 0.7, roughness: 0.38, side: THREE.DoubleSide });
  const prof = [[0.2, 0], [0.5, 0.05], [0.62, 0.5], [0.7, 1.05], [0.9, 1.45], [0.95, 1.55], [0.78, 1.52]].map(([x, y]) => new THREE.Vector2(x, y));
  const bellPivot = new THREE.Group(); bellPivot.position.set(0, bt.by + 3.55, 0);
  const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), bronze); bell.position.y = -1.6; bell.scale.setScalar(1.05); bell.castShadow = true; bellPivot.add(bell);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6), bronze); chain.position.y = 0.1; bellPivot.add(chain);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), bronze); clapper.position.y = -1.55; bellPivot.add(clapper);
  bt.t.add(bellPivot);
  glowSpr(0, bt.by + 2.2, 0, 3, 0xffb040, 0.45, bt.t);
  zones.push({ x: BELL.x, z: BELL.z, r: 7, id: 'chuong' });

  // ---- drum tower (đối xứng tháp chuông) ----
  const drumTower = tower(DRUM.x, DRUM.z, -Math.PI / 2, 'THÁP TRỐNG', 'trong');
  const drumBodyM = lamb(0x6e1a14, { roughness: 0.65 });
  const drumSkinM = lamb(0xd9b98a, { roughness: 0.85 });
  const drumWoodM = lamb(0x4a2e18, { roughness: 0.8 });
  const drumPivot = new THREE.Group(); drumPivot.position.set(0, drumTower.by + 1.7, 0);
  const DR = 0.85, DL = 1.1;
  const drumBody = new THREE.Mesh(new THREE.CylinderGeometry(DR, DR, DL, 28), drumBodyM);
  drumBody.rotation.x = Math.PI / 2; drumBody.castShadow = true; drumPivot.add(drumBody);
  for (const s of [-1, 1]) {
    const face = new THREE.Mesh(new THREE.CircleGeometry(DR * 0.97, 28), drumSkinM);
    face.position.z = s * (DL / 2 + 0.005); face.rotation.y = s > 0 ? 0 : Math.PI; drumPivot.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(DR * 0.97, 0.05, 8, 28), c.goldM);
    rim.position.z = s * (DL / 2); drumPivot.add(rim);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), c.goldM);
      stud.position.set(Math.cos(a) * DR * 0.97, Math.sin(a) * DR * 0.97, s * (DL / 2 + 0.02)); drumPivot.add(stud);
    }
  }
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.2), drumWoodM);
    leg.position.set(0, -DR - 0.05, s * 0.45); leg.castShadow = true; drumPivot.add(leg);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.2), drumWoodM);
    leg2.position.set(0, -DR - 0.05, s * 0.45); leg2.rotation.z = 0.5; leg2.castShadow = true; drumPivot.add(leg2);
  }
  const drumBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.16, 1.4), drumWoodM);
  drumBase.position.set(0, -DR - 0.6, 0); drumPivot.add(drumBase);
  drumTower.t.add(drumPivot);
  glowSpr(0, drumTower.by + 3.2, 0, 3, 0xffb040, 0.45, drumTower.t);
  zones.push({ x: DRUM.x, z: DRUM.z, r: 7, id: 'trong' });

  // ---- Quan Âm tower ----
  const qa = new THREE.Group();
  for (let i = 0; i < QUAN_PLAT.length; i++) {
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(4.6 - i * 0.55, 4.8 - i * 0.55, 0.45, 4), stoneM);
    tier.position.y = 0.22 + i * 0.45; tier.rotation.y = Math.PI / 4; tier.castShadow = tier.receiveShadow = true; tier.userData.sealable = true; qa.add(tier);
  }
  const qy = QUAN_PLAT[QUAN_PLAT.length - 1].y, QR = 3.4, QH = 7.2, QA = QR / Math.SQRT2;
  const qCorners: [number, number][] = [[-QA, -QA], [QA, -QA], [QA, QA], [-QA, QA]];
  for (let i = 0; i < 4; i++) {
    const [px, pz] = qCorners[i], [nx, nz] = qCorners[(i + 1) % 4];
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, QH, 12), c.redM);
    p.position.set(px, qy + QH / 2, pz); p.castShadow = true; p.userData.sealable = true; qa.add(p);
    const len = Math.hypot(nx - px, nz - pz);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.18, 0.18), c.redM);
    rail.position.set((px + nx) / 2, qy + QH - 0.3, (pz + nz) / 2); rail.rotation.y = -Math.atan2(nz - pz, nx - px);
    rail.userData.sealable = true; qa.add(rail);
    const rail2 = rail.clone(); rail2.position.y = qy + 1.0; qa.add(rail2);
    colliders.push({ x: QUAN.x + Math.cos(QUAN_ROT) * px + Math.sin(QUAN_ROT) * pz, z: QUAN.z - Math.sin(QUAN_ROT) * px + Math.cos(QUAN_ROT) * pz, r: 0.32 });
  }
  const q1 = new THREE.Mesh(c.roofGeometry(11.5, 11.5, 2.8, 0.9), c.tileM); q1.position.y = qy + QH + 1.3; q1.rotation.y = 0; q1.castShadow = true; q1.userData.sealable = true; qa.add(q1);
  const qBox = (mat: THREE.Material, w: number, h: number, dp: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; m.userData.sealable = true; qa.add(m); return m;
  };
  for (const [px, pz] of qCorners) {
    qBox(stoneM, 0.72, 0.4, 0.72, px, qy + 0.2, pz);
    qBox(c.redM, 0.6, 0.3, 0.6, px, qy + QH + 0.1, pz);
  }
  for (const s of [-QA, QA]) {
    qBox(c.redM, 2 * QA + 1.2, 0.2, 0.34, 0, qy + QH + 0.35, s);
    qBox(c.redM, 0.34, 0.2, 2 * QA + 1.2, s, qy + QH + 0.35, 0);
  }
  const qNK = 1.5, qNeckH = 1.4, qNeckY = qy + QH + 2.55 + qNeckH / 2 - 0.2;
  for (const [px, pz] of [[-qNK, -qNK], [qNK, -qNK], [-qNK, qNK], [qNK, qNK]] as [number, number][]) {
    const nc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, qNeckH + 0.1, 10), c.redM);
    nc.position.set(px, qNeckY, pz); nc.castShadow = true; nc.userData.sealable = true; qa.add(nc);
  }
  for (const y of [qNeckY - qNeckH / 2 + 0.12, qNeckY + qNeckH / 2 - 0.12]) for (const s of [-qNK, qNK]) {
    qBox(c.redM, 2 * qNK + 0.4, 0.2, 0.22, 0, y, s);
    qBox(c.redM, 0.22, 0.2, 2 * qNK + 0.4, s, y, 0);
  }
  const qPanelH = qNeckH * 0.42;
  for (const s of [-qNK, qNK]) {
    qBox(c.redM, 2 * qNK, qPanelH, 0.12, 0, qNeckY - qNeckH / 2 + 0.12 + qPanelH / 2 + 0.1, s);
    qBox(c.redM, 0.12, qPanelH, 2 * qNK, s, qNeckY - qNeckH / 2 + 0.12 + qPanelH / 2 + 0.1, 0);
  }
  const q2 = new THREE.Mesh(c.roofGeometry(7, 7, 2.2, 0.6), c.tileM); q2.position.y = qNeckY + qNeckH / 2 + 1.1 - 0.3; q2.rotation.y = 0; q2.castShadow = true; q2.userData.sealable = true; qa.add(q2);
  const qFinBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.4, 8), c.goldM);
  qFinBase.position.y = q2.position.y + 1.2; qFinBase.userData.sealable = true; qa.add(qFinBase);
  const qf = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), c.goldM); qf.position.y = q2.position.y + 1.6; qf.userData.sealable = true; qa.add(qf);
  const quanAm = buildQuanAm(); quanAm.position.y = qy; quanAm.scale.setScalar(0.92); qa.add(quanAm);
  const qSign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.76), new THREE.MeshBasicMaterial({ map: signTexture('THÁP QUAN ÂM') }));
  qSign.position.set(0, qy + QH + 0.15, QA + 0.35); qa.add(qSign);
  for (let i = 0; i < 2; i++) {
    labelBoard(qa, COLUMN_LABELS.thap[i], 0.46, 2.8, i ? -QA : QA, qy + 3.3, QA + 0.1);
  }
  qa.position.set(QUAN.x, 0, QUAN.z); qa.rotation.y = QUAN_ROT; scene.add(qa);
  colliders.push({ x: QUAN.x, z: QUAN.z, r: 1.1 });
  const qaSeal = sealArchitectureJoints(qa, { maxGap: 0.6 });
  if (import.meta.env.DEV) console.warn(`gapdump quanAm: filled=${qaSeal.filled} remaining=${qaSeal.remaining.length} ` + JSON.stringify(qaSeal.remaining));
  zones.push({ x: QUAN.x, z: QUAN.z, r: 6.5, id: 'thap' });

  // ---- big Buddha in the western yard ----
  const yard = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(4.2 - i * 0.5, 4.5 - i * 0.5, 0.4, 8), stoneM);
    t.position.y = 0.2 + i * 0.4; t.castShadow = t.receiveShadow = true; t.userData.sealable = true; yard.add(t);
  }
  const bigB = buildBuddha(); bigB.scale.setScalar(1.15); bigB.position.y = 1.2; yard.add(bigB);
  yard.position.set(BUDDHA_YARD.x, 0, BUDDHA_YARD.z); yard.rotation.y = Math.PI * 0.5 + 0.3; scene.add(yard);
  sealArchitectureJoints(yard, { maxGap: 0.3 });
  colliders.push({ x: BUDDHA_YARD.x, z: BUDDHA_YARD.z, r: 4 });

  // ---- pagoda (moved east) ----
  const pagoda = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const w = 5.2 - i * 0.7;
    const f = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 1.3, w - 1), i % 2 ? c.wallM : c.redM); f.position.y = 0.9 + i * 2.6; f.castShadow = true; f.userData.sealable = true; pagoda.add(f);
    const r = new THREE.Mesh(c.roofGeometry(w * 1.45, w * 1.45, 1.1, 0.5), c.tileM); r.position.y = 2.0 + i * 2.6; r.castShadow = true; r.userData.sealable = true; pagoda.add(r);
  }
  for (let i = 0; i < 2; i++) {
    const pb = new THREE.Mesh(new THREE.BoxGeometry(6.2 - i * 0.8, 0.3, 6.2 - i * 0.8), stoneM);
    pb.position.y = 0.15 + i * 0.3 - 0.0; pb.castShadow = pb.receiveShadow = true; pb.userData.sealable = true; pagoda.add(pb);
  }
  const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.5, 8), c.goldM); spireBase.position.y = 13.1; spireBase.userData.sealable = true; pagoda.add(spireBase);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 2.2, 8), c.goldM); spire.position.y = 14.4; spire.userData.sealable = true; pagoda.add(spire);
  pagoda.position.set(PAGODA.x, 0, PAGODA.z); scene.add(pagoda);
  const pgSeal = sealArchitectureJoints(pagoda, { maxGap: 1.4 });
  if (import.meta.env.DEV) console.warn(`gapdump pagoda: filled=${pgSeal.filled} remaining=${pgSeal.remaining.length} ` + JSON.stringify(pgSeal.remaining));
  colliders.push({ x: PAGODA.x, z: PAGODA.z, r: 3.4 });

  // ---- Bảo Tháp thờ xá lợi (phía Tây Điện Tam Thế) — tháp đá bát giác nhiều tầng, cao ~26 m ----
  const baoThap = new THREE.Group();
  baoThap.name = 'bao-thap';
  const btSeal = <T extends THREE.Mesh>(m: T) => { m.castShadow = m.receiveShadow = true; m.userData.sealable = true; baoThap.add(m); return m; };
  /*
   * Nền 2 tầng thấp + bậc thềm phía Nam: mặt nền đi được cao 0.9 (đúng BAO_THAP_PLAT.y),
   * hai bậc thấm dần xuống phía Nam để khách đi tới được cửa tháp.
   */
  const BT = BAO_THAP_PLAT;
  const btBase1 = btSeal(new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.8, BT.y / 2, 8), stoneM));
  btBase1.position.y = BT.y / 4; btBase1.rotation.y = Math.PI / 8;
  const btBase2 = btSeal(new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.0, BT.y / 2, 8), stoneM));
  btBase2.position.y = BT.y * 0.75; btBase2.rotation.y = Math.PI / 8;
  const btFloorY = BT.y;
  for (const s of [BT.step1, BT.step2]) {
    const st = btSeal(new THREE.Mesh(new THREE.BoxGeometry(BT.stepW * 2, s.y, s.z1 - s.z0), stoneM));
    st.position.set(BT.x, s.y / 2, BT.z + (s.z0 + s.z1) / 2);
  }
  const BT_TIERS = 7;
  const btTierH = 2.5;
  let btY = btFloorY;
  for (let i = 0; i < BT_TIERS; i++) {
    const r = 3.6 - i * 0.34;
    const body = btSeal(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r * 0.92, btTierH * 0.62, 8), stoneM));
    body.position.y = btY + btTierH * 0.31; body.rotation.y = Math.PI / 8;
    const band = btSeal(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.16, 8), c.goldM));
    band.position.y = btY + btTierH * 0.62 + 0.08; band.rotation.y = Math.PI / 8;
    const roof = btSeal(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.52, r * 1.28, btTierH * 0.34, 8), c.tileM));
    roof.position.y = btY + btTierH * 0.62 + 0.16 + btTierH * 0.17; roof.rotation.y = Math.PI / 8;
    btY += btTierH;
  }
  const btTopR = 3.6 - (BT_TIERS - 1) * 0.34;
  const btKnob = btSeal(new THREE.Mesh(new THREE.CylinderGeometry(btTopR * 0.22, btTopR * 0.4, 0.5, 8), c.goldM));
  btKnob.position.y = btY + 0.25;
  const btOrb = btSeal(new THREE.Mesh(new THREE.SphereGeometry(btTopR * 0.34, 14, 10), c.goldM));
  btOrb.position.y = btY + 0.5 + btTopR * 0.28;
  const btSpire = btSeal(new THREE.Mesh(new THREE.ConeGeometry(btTopR * 0.2, 3.4, 8), c.goldM));
  btSpire.position.y = btY + 0.5 + btTopR * 0.56 + 1.4;
  // cửa nhỏ duy nhất ở tầng trệt, quay về hướng Nam (+z)
  const btDoorR = 3.6 * 0.92;
  const btDoorFrame = btSeal(new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.7, 0.3), c.redM));
  btDoorFrame.position.set(0, btFloorY + 0.85, btDoorR * Math.cos(Math.PI / 8) - 0.02);
  const btDoor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.12), lamb(0x1a1410));
  btDoor.position.set(0, btFloorY + 0.78, btDoorR * Math.cos(Math.PI / 8) + 0.16);
  baoThap.add(btDoor);
  baoThap.position.set(BAO_THAP.x, 0, BAO_THAP.z); scene.add(baoThap);
  sealArchitectureJoints(baoThap, { maxGap: 0.5 });
  // collider thân tháp: vòng các trụ sát thân, chừa hẳn lối vào cửa Nam (|x| <= stepW, z > 0)
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    const lx = Math.sin(a) * 3.9, lz = Math.cos(a) * 3.9;
    if (Math.abs(lx) < BT.stepW + 0.1 && lz > 0) continue;
    colliders.push({ x: BAO_THAP.x + lx, z: BAO_THAP.z + lz, r: 0.45 });
  }
  zones.push({ x: BAO_THAP.x, z: BAO_THAP.z, r: 8, id: 'baoThap' });

  type BoxAdd = (w: number, h: number, dp: number, x: number, y: number, z: number, mat?: THREE.Material) => unknown;
  /** Tường có một ô cửa sổ chấn song: tường chạy dọc trục `axis` tại toạ độ `fixed`, dài `len`, dày `thick`, từ y0 đến y1. */
  const windowWall = (add: BoxAdd, axis: 'x' | 'z', fixed: number, len: number, thick: number, y0: number, y1: number,
    win: { c: number; w: number; s: number; t: number }, wallMat: THREE.Material, frameMat: THREE.Material) => {
    const put = (u0: number, u1: number, ya: number, yb: number, mat: THREE.Material, t = thick) => {
      const uw = u1 - u0, uc = (u0 + u1) / 2, h = yb - ya, yc = (ya + yb) / 2;
      if (axis === 'x') add(uw, h, t, uc, yc, fixed, mat); else add(t, h, uw, fixed, yc, uc, mat);
    };
    const a = win.c - win.w / 2, b = win.c + win.w / 2;
    put(-len / 2, len / 2, y0, win.s, wallMat);
    put(-len / 2, len / 2, win.t, y1, wallMat);
    put(-len / 2, a, win.s, win.t, wallMat);
    put(b, len / 2, win.s, win.t, wallMat);
    const ft = thick + 0.08, fw = 0.1;
    put(a - 0.02, b + 0.02, win.s - 0.04, win.s + fw - 0.04, frameMat, ft);
    put(a - 0.02, b + 0.02, win.t - fw + 0.04, win.t + 0.04, frameMat, ft);
    put(a - 0.02, a + fw - 0.02, win.s, win.t, frameMat, ft);
    put(b - fw + 0.02, b + 0.02, win.s, win.t, frameMat, ft);
    for (let i = 1; i <= 3; i++) {
      const u = a + (win.w * i) / 4;
      put(u - 0.025, u + 0.025, win.s, win.t, frameMat, thick * 0.5);
    }
  };

  // ---- Am Cổ (góc Tây–Bắc): am nhỏ mái ngói rêu phong, mở mặt Đông (lối vào từ vườn Thiền), tường hậu + hai tường bên có cửa sổ ----
  const amCo = new THREE.Group();
  amCo.name = 'am-co';
  const acStone = (w: number, h: number, dp: number, x: number, y: number, z: number, mat: THREE.Material = stoneM) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; m.userData.sealable = true; amCo.add(m); return m;
  };
  const acWood = lamb(0x5a3a22, { roughness: 0.85 });
  const acMoss = lamb(0x5f7a4a, { roughness: 1 });
  const AP = AM_CO_PLAT;
  acStone(AP.hx * 2, AP.y, AP.hz * 2, 0, AP.y / 2, 0);
  const acBase = AP.y;
  const acH = 2.6, acHx = 2.2, acHz = 1.8;
  for (const [px, pz] of [[-acHx, -acHz], [acHx, -acHz], [-acHx, acHz], [acHx, acHz]] as [number, number][]) {
    acStone(0.5, 0.2, 0.5, px, acBase + 0.1, pz);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, acH + 0.1, 10), acWood);
    pl.position.set(px, acBase + 0.2 + acH / 2 - 0.05, pz); pl.castShadow = true; pl.userData.sealable = true; amCo.add(pl);
  }
  const acY0 = acBase + 0.2 - 0.05, acY1 = acY0 + acH;
  const acWin = { c: 0, w: 1.2, s: acY0 + 0.9, t: acY0 + 2.0 };
  for (const sz of [-acHz, acHz]) windowWall(acStone, 'x', sz, 2 * acHx - 0.2, 0.2, acY0, acY1, acWin, c.wallM, acWood);
  acStone(0.2, acH, 2 * acHz - 0.2, -acHx, acBase + 0.2 + acH / 2 - 0.05, 0, c.wallM);
  const acBeamY = acBase + 0.2 + acH + 0.05;
  for (const s of [-acHz, acHz]) { const b = new THREE.Mesh(new THREE.BoxGeometry(2 * acHx + 0.6, 0.24, 0.26), acWood); b.position.set(0, acBeamY, s); b.castShadow = true; b.userData.sealable = true; amCo.add(b); }
  for (const s of [-acHx, acHx]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 2 * acHz + 0.6), acWood); b.position.set(s, acBeamY, 0); b.castShadow = true; b.userData.sealable = true; amCo.add(b); }
  const acRoofH = 1.7, acRoofY = acBeamY + 0.12 + acRoofH / 2 - 0.2;
  const acRoof = new THREE.Mesh(c.roofGeometry(6.4, 5.2, acRoofH, 0.5), c.tileM);
  acRoof.position.y = acRoofY; acRoof.castShadow = true; acRoof.userData.sealable = true; amCo.add(acRoof);
  const acMossCap = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 1.2), acMoss);
  acMossCap.position.set(0.4, acRoofY + acRoofH / 2 - 0.35, 0.3); amCo.add(acMossCap);
  const acFin = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.7, 8), c.goldM);
  acFin.position.y = acRoofY + acRoofH / 2 + 0.25; acFin.userData.sealable = true; amCo.add(acFin);
  acStone(1.0, 0.6, 0.7, -1.2, acBase + 0.5, -0.8);
  const acCenser = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.24, 12), c.goldM);
  acCenser.position.set(-1.2, acBase + 0.92, -0.8); acCenser.castShadow = true; amCo.add(acCenser);
  const acSign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), new THREE.MeshBasicMaterial({ map: signTexture('AM CỔ') }));
  acSign.position.set(acHx + 0.2, acBeamY - 0.4, 0); acSign.rotation.y = Math.PI / 2; amCo.add(acSign);
  for (let i = 0; i < 2; i++) labelBoard(amCo, COUPLETS.amCo.am[i].split(',')[0], 0.4, 2.0, acHx + 0.22, acBase + 1.5, i ? acHz : -acHz, Math.PI / 2);
  amCo.position.set(AM_CO.x, 0, AM_CO.z); scene.add(amCo);
  const acSeal = sealArchitectureJoints(amCo, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump amCo: filled=${acSeal.filled} remaining=${acSeal.remaining.length}`);
  for (const [px, pz] of [[-acHx, -acHz], [acHx, -acHz], [-acHx, acHz], [acHx, acHz]] as [number, number][]) colliders.push({ x: AM_CO.x + px, z: AM_CO.z + pz, r: 0.3 });
  for (const lz of [-1.2, 0, 1.2]) colliders.push({ x: AM_CO.x - acHx, z: AM_CO.z + lz, r: 0.7 });
  for (const sz of [-acHz, acHz]) colliders.push({ x: AM_CO.x, z: AM_CO.z + sz, r: 1.4 }, { x: AM_CO.x + 1.4, z: AM_CO.z + sz, r: 1.0 }, { x: AM_CO.x - 1.4, z: AM_CO.z + sz, r: 1.0 });
  zones.push({ x: AM_CO.x, z: AM_CO.z, r: 7, id: 'amCo' });

  // ---- Vườn Tháp (góc Đông–Bắc): sân đá nhỏ với các tháp mộ chư tăng nhiều cỡ, lối vào từ phía Nam ----
  const vuon = new THREE.Group();
  vuon.name = 'vuon-thap';
  const vtStone = (w: number, h: number, dp: number, x: number, y: number, z: number, mat: THREE.Material = stoneM) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; m.userData.sealable = true; vuon.add(m); return m;
  };
  const VP = VUON_THAP_PLAT;
  vtStone(VP.hx * 2, VP.y, VP.hz * 2, 0, VP.y / 2, 0);
  const vtCapM = lamb(0xb9ad94, { map: stoneTexture([190, 180, 160], [1, 1], 2) });
  const vtSlots: { x: number; z: number; tiers: number }[] = [
    { x: -4.2, z: -2.6, tiers: 5 }, { x: -1.4, z: -2.8, tiers: 7 }, { x: 1.4, z: -2.8, tiers: 7 }, { x: 4.2, z: -2.6, tiers: 5 },
    { x: -3.4, z: 0.4, tiers: 3 }, { x: 0, z: 0.2, tiers: 5 }, { x: 3.4, z: 0.4, tiers: 3 },
  ];
  for (const s of vtSlots) {
    const bw = 1.5;
    vtStone(bw, 0.4, bw, s.x, VP.y + 0.2, s.z);
    let y = VP.y + 0.4, r = 0.62;
    for (let i = 0; i < s.tiers; i++) {
      const h = i === 0 ? 0.9 : 0.62;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, h, 8), stoneM);
      body.position.set(s.x, y + h / 2, s.z); body.rotation.y = Math.PI / 8; body.castShadow = body.receiveShadow = true; body.userData.sealable = true; vuon.add(body);
      y += h;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 1.12, 0.16, 8), vtCapM);
      cap.position.set(s.x, y + 0.08, s.z); cap.rotation.y = Math.PI / 8; cap.castShadow = true; cap.userData.sealable = true; vuon.add(cap);
      y += 0.16; r *= 0.86;
    }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 10, 8), c.goldM);
    knob.position.set(s.x, y + r * 0.45, s.z); knob.userData.sealable = true; vuon.add(knob);
    colliders.push({ x: VUON_THAP.x + s.x, z: VUON_THAP.z + s.z, r: 0.85 });
  }
  for (const sx of [-1, 1]) {
    vtStone(0.5, 0.5, 0.5, sx * 3.2, VP.y + 0.25, 3.6);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), lamb(0xffd27a, { emissive: 0xff9a2a, emissiveIntensity: 0.9, roughness: 0.6 }));
    lamp.scale.set(1, 1.25, 1); lamp.position.set(sx * 3.2, VP.y + 0.8, 3.6); vuon.add(lamp);
    glowSpr(VUON_THAP.x + sx * 3.2, VP.y + 0.8, VUON_THAP.z + 3.6, 1.4, 0xffb040, 0.4);
    colliders.push({ x: VUON_THAP.x + sx * 3.2, z: VUON_THAP.z + 3.6, r: 0.35 });
  }
  const vtSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: signTexture('VƯỜN THÁP') }));
  vtSign.position.set(0, 1.4, VP.hz + 0.05); vuon.add(vtSign);
  const vtPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), lamb(0x5a3a22));
  vtPost.position.set(0, 0.7, VP.hz); vtPost.userData.sealable = true; vuon.add(vtPost);
  vuon.position.set(VUON_THAP.x, 0, VUON_THAP.z); scene.add(vuon);
  const vtSeal = sealArchitectureJoints(vuon, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump vuonThap: filled=${vtSeal.filled} remaining=${vtSeal.remaining.length}`);
  zones.push({ x: VUON_THAP.x, z: VUON_THAP.z, r: 8, id: 'vuonThap' });

  // ---- Nhà Tổ + Tăng xá (sau Điện Tam Thế): hai dãy nhà mái ngói, cửa quay về hướng Nam ----
  const buildHouse = (name: string, at: { x: number; z: number }, plat: { hx: number; hz: number; y: number }, sign: string, zoneId: string, wide: number, deep: number, openFront = false) => {
    const g = new THREE.Group(); g.name = name;
    const st = (w: number, h: number, dp: number, x: number, y: number, z: number, mat: THREE.Material = stoneM) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), mat);
      m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; m.userData.sealable = true; g.add(m); return m;
    };
    st(plat.hx * 2, plat.y, plat.hz * 2, 0, plat.y / 2, 0);
    const base = plat.y, colH = 3.0, hx = wide, hz = deep;
    const corners: [number, number][] = [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]];
    for (const [px, pz] of corners) {
      st(0.55, 0.2, 0.55, px, base + 0.1, pz);
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, colH + 0.1, 10), c.redM);
      pl.position.set(px, base + 0.2 + colH / 2 - 0.05, pz); pl.castShadow = true; pl.userData.sealable = true; g.add(pl);
    }
    const wy = base + 0.2 + colH / 2 - 0.05;
    st(2 * hx - 0.2, colH, 0.22, 0, wy, -hz, c.wallM);
    if (openFront) {
      const y0 = base + 0.2 - 0.05;
      const win = { c: 0, w: 1.6, s: y0 + 1.0, t: y0 + 2.2 };
      for (const sx of [-hx, hx]) windowWall(st, 'z', sx, 2 * hz - 0.2, 0.22, y0, y0 + colH, win, c.wallM, c.redM);
    } else {
      st(0.22, colH, 2 * hz - 0.2, -hx, wy, 0, c.wallM);
      st(0.22, colH, 2 * hz - 0.2, hx, wy, 0, c.wallM);
      st(hx - 0.9, colH, 0.22, -(hx + 0.9) / 2, wy, hz, c.wallM);
      st(hx - 0.9, colH, 0.22, (hx + 0.9) / 2, wy, hz, c.wallM);
      st(1.8, 0.7, 0.22, 0, base + 0.2 + colH - 0.4, hz, c.wallM);
    }
    const beamY = base + 0.2 + colH + 0.05;
    for (const s of [-hz, hz]) { const b = new THREE.Mesh(new THREE.BoxGeometry(2 * hx + 0.7, 0.26, 0.28), c.redM); b.position.set(0, beamY, s); b.castShadow = true; b.userData.sealable = true; g.add(b); }
    for (const s of [-hx, hx]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 2 * hz + 0.7), c.redM); b.position.set(s, beamY, 0); b.castShadow = true; b.userData.sealable = true; g.add(b); }
    const roofH = 1.9, roofY = beamY + 0.13 + roofH / 2 - 0.2;
    const roof = new THREE.Mesh(c.roofGeometry(2 * hx + 2.4, 2 * hz + 2.0, roofH, 0.6), c.tileM);
    roof.position.y = roofY; roof.castShadow = true; roof.userData.sealable = true; g.add(roof);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(2 * hx - 0.6, 0.2, 0.3), c.goldM);
    ridge.position.y = roofY + roofH / 2 - 0.05; ridge.userData.sealable = true; g.add(ridge);
    st(1.2, 0.7, 0.7, 0, base + 0.55, -hz + 0.9);
    const cen = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.28, 12), c.goldM);
    cen.position.set(0, base + 1.04, -hz + 0.9); cen.castShadow = true; g.add(cen);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: signTexture(sign) }));
    sg.position.set(0, beamY - 0.5, hz + 0.25); g.add(sg);
    return { g, hx, hz, corners };
  };
  const nt = buildHouse('nha-to', NHA_TO, NHA_TO_PLAT, 'NHÀ TỔ', 'nhaTo', 3.6, 2.6, true);
  for (let i = 0; i < 2; i++) labelBoard(nt.g, COUPLETS.nhaTo.am[i].split(',')[0], 0.42, 2.2, i ? nt.hx : -nt.hx, NHA_TO_PLAT.y + 1.7, nt.hz + 0.22);
  nt.g.position.set(NHA_TO.x, 0, NHA_TO.z); scene.add(nt.g);
  const ntSeal = sealArchitectureJoints(nt.g, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump nhaTo: filled=${ntSeal.filled} remaining=${ntSeal.remaining.length}`);
  for (const [px, pz] of nt.corners) colliders.push({ x: NHA_TO.x + px, z: NHA_TO.z + pz, r: 0.32 });
  for (const lx of [-2.4, -0.8, 0.8, 2.4]) colliders.push({ x: NHA_TO.x + lx, z: NHA_TO.z - nt.hz, r: 0.9 });
  for (const lz of [-1.2, 1.2]) colliders.push({ x: NHA_TO.x - nt.hx, z: NHA_TO.z + lz, r: 0.9 }, { x: NHA_TO.x + nt.hx, z: NHA_TO.z + lz, r: 0.9 });
  zones.push({ x: NHA_TO.x, z: NHA_TO.z, r: 7, id: 'nhaTo' });

  const tx = buildHouse('tang-xa', TANG_XA, TANG_XA_PLAT, 'TĂNG XÁ', 'tangXa', 3.6, 2.6);
  for (let i = 0; i < 2; i++) labelBoard(tx.g, COUPLETS.tangXa.am[i].split(',')[0], 0.42, 2.2, i ? 1.2 : -1.2, TANG_XA_PLAT.y + 1.7, tx.hz + 0.2);
  tx.g.position.set(TANG_XA.x, 0, TANG_XA.z); scene.add(tx.g);
  const txSeal = sealArchitectureJoints(tx.g, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump tangXa: filled=${txSeal.filled} remaining=${txSeal.remaining.length}`);
  for (const [px, pz] of tx.corners) colliders.push({ x: TANG_XA.x + px, z: TANG_XA.z + pz, r: 0.32 });
  for (const lx of [-2.4, -0.8, 0.8, 2.4]) colliders.push({ x: TANG_XA.x + lx, z: TANG_XA.z - tx.hz, r: 0.9 });
  for (const lz of [-1.2, 1.2]) colliders.push({ x: TANG_XA.x - tx.hx, z: TANG_XA.z + lz, r: 0.9 }, { x: TANG_XA.x + tx.hx, z: TANG_XA.z + lz, r: 0.9 });
  zones.push({ x: TANG_XA.x, z: TANG_XA.z, r: 7, id: 'tangXa' });

  const extraHouse = (name: string, at: { x: number; z: number }, plat: { hx: number; hz: number; y: number }, sign: string, zoneId: string, wide: number, deep: number, openFront: boolean) => {
    const h = buildHouse(name, at, plat, sign, zoneId, wide, deep, openFront);
    h.g.position.set(at.x, 0, at.z); scene.add(h.g);
    const sl = sealArchitectureJoints(h.g, { maxGap: 0.5 });
    if (import.meta.env.DEV) console.warn(`gapdump ${name}: filled=${sl.filled} remaining=${sl.remaining.length}`);
    for (const [px, pz] of h.corners) colliders.push({ x: at.x + px, z: at.z + pz, r: 0.32 });
    for (let lx = -wide + 1.2; lx <= wide - 1.2 + 0.01; lx += 1.6) colliders.push({ x: at.x + lx, z: at.z - h.hz, r: 0.9 });
    for (const lz of [-1.2, 1.2]) colliders.push({ x: at.x - h.hx, z: at.z + lz, r: 0.9 }, { x: at.x + h.hx, z: at.z + lz, r: 0.9 });
    zones.push({ x: at.x, z: at.z, r: 7, id: zoneId });
    return h;
  };
  const dm = extraHouse('dien-mau', DIEN_MAU, DIEN_MAU_PLAT, 'ĐIỆN MẪU', 'dienMau', 2.6, 2.2, true);
  for (let i = 0; i < 2; i++) labelBoard(dm.g, COUPLETS.dienMau.am[i].split(',')[0], 0.42, 2.2, i ? dm.hx : -dm.hx, DIEN_MAU_PLAT.y + 1.7, dm.hz + 0.22);
  const nk = extraHouse('nha-khach', NHA_KHACH, NHA_KHACH_PLAT, 'NHÀ KHÁCH', 'nhaKhach', 3.0, 2.4, true);
  for (let i = 0; i < 2; i++) labelBoard(nk.g, COUPLETS.nhaKhach.am[i].split(',')[0], 0.42, 2.2, i ? nk.hx : -nk.hx, NHA_KHACH_PLAT.y + 1.7, nk.hz + 0.22);
  const td = extraHouse('thien-duong', THIEN_DUONG, THIEN_DUONG_PLAT, 'THIỀN ĐƯỜNG', 'thienDuong', 2.6, 2.2, true);
  for (let i = 0; i < 2; i++) labelBoard(td.g, COUPLETS.thienDuong.am[i].split(',')[0], 0.42, 2.2, i ? td.hx : -td.hx, THIEN_DUONG_PLAT.y + 1.7, td.hz + 0.22);

  // ---- koi lake + arched bridge (hồ nằm giữa khuôn viên, cầu bắc dọc Bắc–Nam) ----
  const pond = new THREE.Group();            // toàn bộ hồ trong một nhóm → dễ dời tâm
  pond.name = 'koi-pond';
  pond.position.set(LAKE.x, 0, LAKE.z);       // placeKoiPond() xác nhận lại vị trí tâm
  scene.add(pond);

  const lakeBed = new THREE.Mesh(new THREE.CircleGeometry(1, 56), new THREE.MeshStandardMaterial({ color: 0x1d4f66, roughness: 1 }));
  lakeBed.scale.set(LAKE.a, LAKE.b, 1); lakeBed.rotation.x = -Math.PI / 2; lakeBed.position.y = 0.03; pond.add(lakeBed);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x46a8c4, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.82 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 56), waterMat);
  water.scale.set(LAKE.a, LAKE.b, 1); water.rotation.x = -Math.PI / 2; water.position.y = 0.14; pond.add(water);
  const rimStone = lamb(0x8b7a64, { map: stoneTexture([140, 128, 110], [14, 1], 3) });
  const rimPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; rimPts.push(new THREE.Vector3(Math.cos(a) * (LAKE.a + 0.3), 0, Math.sin(a) * (LAKE.b + 0.3))); }
  const rimCurve = new THREE.CatmullRomCurve3(rimPts, true);
  const rim = new THREE.Mesh(new THREE.TubeGeometry(rimCurve, 128, 0.42, 8, true), rimStone);
  rim.scale.y = 0.8; rim.position.y = 0.2; rim.castShadow = true; rim.receiveShadow = true; pond.add(rim);
  const rocks = lamb(0x6e675c, { flatShading: true });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2, rr = 0.5 + ((i * 37) % 10) / 14;
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rr, 0), rocks);
    const rx = Math.cos(a) * (LAKE.a + 0.9), rz = Math.sin(a) * (LAKE.b + 0.9);
    if (LAKE.x + rx < PIER.x1 && Math.abs(LAKE.z + rz - PIER.z) < PIER.hw + rr + 0.6) continue;
    r.position.set(rx, rr * 0.3, rz); r.scale.y = 0.65; r.rotation.set(i, i * 2, 0); r.castShadow = true; pond.add(r);
  }
  const padM = lamb(0x2f8f45), flM = lamb(0xff93b8, { emissive: 0x401324 });
  for (let i = 0; i < 22; i++) {
    const a = ((i * 2.399) % (Math.PI * 2)), rr = Math.sqrt(((i * 0.618) % 1)) * 0.82;
    const x = Math.cos(a) * rr * LAKE.a, z = Math.sin(a) * rr * LAKE.b;
    if (Math.abs(x - BRIDGE.x) < 1.8) continue;      // chừa lối cầu
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.55, 14, 0.4, 5.6), padM);
    pad.rotation.x = -Math.PI / 2; pad.position.set(x, 0.16, z); pond.add(pad);
    if (i % 2 === 0) for (let q = 0; q < 6; q++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), flM); p.scale.set(0.5, 1.3, 0.5);
      const ka = (q / 6) * Math.PI * 2; p.position.set(x + Math.cos(ka) * 0.1, 0.34, z + Math.sin(ka) * 0.1); p.rotation.set(Math.sin(ka) * 0.6, 0, -Math.cos(ka) * 0.6); pond.add(p);
    }
  }
  // ---- cá koi: 4 mẫu thật (Kohaku, Yamabuki, Shiro Utsuri, Hi), đuôi vẫy ----
  const koi: Koi[] = [];
  const KOI_VARIETIES: KoiVariety[] = ['kohaku', 'yamabuki', 'shiroUtsuri', 'hi'];
  for (let i = 0; i < 9; i++) {
    const k = createKoi(KOI_VARIETIES[i % 4], 0.85 + (i % 3) * 0.12);
    k.a = i * 0.7;
    k.rx = LAKE.a * (0.35 + (i % 4) * 0.15);
    k.rz = LAKE.b * (0.35 + (i % 4) * 0.15);
    k.s = (i % 2 ? 1 : -1) * (0.25 + (i % 3) * 0.1);
    k.phase = (i / 9) * Math.PI * 2;
    k.root.position.y = 0.16;
    pond.add(k.root);
    koi.push(k);
  }
  // xác nhận hồ nằm đúng tâm khuôn viên
  const pondHandle = placeKoiPond(pond, LAKE);

  // cầu cong: ván ghép, lan can, trụ, đèn — chạy dọc trục z qua hồ
  const bridge = new THREE.Group(); bridge.name = 'arched-bridge'; scene.add(bridge);
  const deckM = lamb(0x8a4a28), railM = c.redM;
  const nSeg = 28, bw = BRIDGE.hw;
  const segLen = (BRIDGE.z1 - BRIDGE.z0) / nSeg;
  for (let i = 0; i < nSeg; i++) {
    const z = BRIDGE.z0 + (i + 0.5) * segLen, z2 = z + segLen * 0.5, z1 = z - segLen * 0.5;
    const y1 = bridgeY(BRIDGE.x, z1), y2 = bridgeY(BRIDGE.x, z2), ym = (y1 + y2) / 2;
    const slope = Math.atan2(y2 - y1, segLen);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(bw * 2, 0.2, segLen + 0.06), deckM);
    seg.position.set(BRIDGE.x, ym - 0.1, z); seg.rotation.x = -slope; seg.castShadow = seg.receiveShadow = true; bridge.add(seg);
    for (const s of [-1, 1]) {
      const rl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, segLen + 0.04), railM);
      rl.position.set(BRIDGE.x + s * (bw + 0.02), ym + 0.95, z); rl.rotation.x = -slope; bridge.add(rl);
      if (i % 3 === 0) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.05, 8), railM);
        post.position.set(BRIDGE.x + s * (bw + 0.02), ym + 0.45, z); bridge.add(post);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), c.goldM); knob.position.set(BRIDGE.x + s * (bw + 0.02), ym + 1.05, z); bridge.add(knob);
      }
    }
  }
  for (const sz of [-1, 1]) { // piers
    const pz = (BRIDGE.z0 + BRIDGE.z1) / 2 + sz * 4.6;
    for (const s of [-1, 1]) {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 8), lamb(0x6b6458));
      pier.position.set(BRIDGE.x + s * (bw - 0.2), bridgeY(BRIDGE.x, pz) - 0.8, pz); bridge.add(pier);
    }
  }
  const apexZ = (BRIDGE.z0 + BRIDGE.z1) / 2;
  for (const s of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), c.redBase);
    lamp.scale.set(1, 1.2, 1); lamp.position.set(BRIDGE.x + s * (bw + 0.02), bridgeY(BRIDGE.x, apexZ) + 1.7, apexZ); bridge.add(lamp);
    glowSpr(lamp.position.x, lamp.position.y, lamp.position.z, 2, 0xff4a28, 0.5);
  }

  // ---- Thủy Đình: đình nhỏ trên mặt hồ, phía Tây cầu trục, nối bờ Tây bằng cầu gỗ ----
  const thuy = new THREE.Group(); thuy.name = 'thuy-dinh'; scene.add(thuy);
  const pierWoodM = lamb(0x8a5a32, { map: woodTexture([4, 1]) }), pierDarkM = lamb(0x4a2e18, { roughness: 0.85 });
  const tdSeal = <T extends THREE.Mesh>(m: T) => { m.castShadow = m.receiveShadow = true; m.userData.sealable = true; thuy.add(m); return m; };
  const pierLen = PIER.x1 - PIER.x0, flatX0 = PIER.x0 + PIER_RAMP;
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(PIER_RAMP, PIER.y), 0.18, PIER.hw * 2), pierWoodM);
  const rampAng = Math.atan2(PIER.y, PIER_RAMP);
  ramp.position.set(PIER.x0 + PIER_RAMP / 2, PIER.y / 2 - 0.09 / Math.cos(rampAng), PIER.z); ramp.rotation.z = rampAng;
  ramp.castShadow = ramp.receiveShadow = true; thuy.add(ramp);
  const flat = new THREE.Mesh(new THREE.BoxGeometry(PIER.x1 - flatX0, 0.18, PIER.hw * 2), pierWoodM);
  flat.position.set((flatX0 + PIER.x1) / 2, PIER.y - 0.09, PIER.z); flat.castShadow = flat.receiveShadow = true; thuy.add(flat);
  for (const px of [PIER.x0 + 0.1, -9.6, -8.6, -7.1, -5.6, -4.6]) for (const s of [-1, 1]) {
    const bottom = inLake(px, PIER.z + s * 1.45) ? 0.03 : 0;
    const top = px < flatX0 ? PIER.y * Math.max(0.2, (px - PIER.x0) / PIER_RAMP) - 0.18 : PIER.y - 0.18;
    if (top <= bottom + 0.05) continue;
    const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, top - bottom, 8), pierDarkM);
    pile.position.set(px, (top + bottom) / 2, PIER.z + s * 1.45); pile.castShadow = true; thuy.add(pile);
  }
  const FL = PIER_FLOOR, flTop = FL.y;
  tdSeal(new THREE.Mesh(new THREE.BoxGeometry(FL.hx * 2, flTop - PIER.y, FL.hz * 2), stoneM)).position.set(FL.x, (flTop + PIER.y) / 2, FL.z);
  const tdCols: [number, number][] = [[-1.9, -1.4], [1.9, -1.4], [-1.9, 1.4], [1.9, 1.4]];
  const tdColH = 2.6;
  for (const [px, pz] of tdCols) {
    const col = tdSeal(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, tdColH, 12), c.redM));
    col.position.set(FL.x + px, flTop + tdColH / 2, FL.z + pz);
    tdSeal(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), stoneM)).position.set(FL.x + px, flTop + 0.09, FL.z + pz);
    colliders.push({ x: FL.x + px, z: FL.z + pz, r: 0.25 });
  }
  const tdBeamY = flTop + tdColH + 0.12;
  for (const s of [-1.4, 1.4]) tdSeal(new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.24, 0.26), c.redM)).position.set(FL.x, tdBeamY, FL.z + s);
  for (const s of [-1.9, 1.9]) tdSeal(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 3.3), c.redM)).position.set(FL.x + s, tdBeamY, FL.z);
  const tdRoofH = 1.6, tdRoofY = tdBeamY + 0.12 + tdRoofH / 2 - 0.2;
  tdSeal(new THREE.Mesh(c.roofGeometry(5.8, 5.0, tdRoofH, 0.6), c.tileM)).position.set(FL.x, tdRoofY, FL.z);
  tdSeal(new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.9, 8), c.goldM)).position.set(FL.x, tdRoofY + tdRoofH / 2 + 0.3, FL.z);
  const tdSign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.55), new THREE.MeshBasicMaterial({ map: signTexture('THỦY ĐÌNH') }));
  tdSign.position.set(FL.x + 1.95, tdBeamY - 0.45, FL.z); tdSign.rotation.y = Math.PI / 2; thuy.add(tdSign);
  const tdLamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), c.redBase);
  tdLamp.scale.set(1, 1.2, 1); tdLamp.position.set(FL.x, tdBeamY - 0.5, FL.z); thuy.add(tdLamp);
  glowSpr(tdLamp.position.x, tdLamp.position.y, tdLamp.position.z, 2, 0xff4a28, 0.5);
  const railY = flTop + 0.55;
  const rail = (x: number, z: number, w: number, dp: number) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, dp), c.redM);
    r.position.set(x, railY, z); r.castShadow = true; thuy.add(r);
  };
  rail(FL.x + 0.2, FL.z - FL.hz + 0.05, FL.hx * 2 - 0.4, 0.1);
  rail(FL.x + 0.2, FL.z + FL.hz - 0.05, FL.hx * 2 - 0.4, 0.1);
  rail(FL.x + FL.hx - 0.05, FL.z, 0.1, FL.hz * 2);
  for (let px = FL.x - FL.hx + 0.6; px <= FL.x + FL.hx - 0.1; px += 1.2) for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 6), c.redM);
    post.position.set(px, flTop + 0.3, FL.z + s * (FL.hz - 0.05)); thuy.add(post);
  }
  for (let pz = FL.z - FL.hz + 0.6; pz <= FL.z + FL.hz - 0.5; pz += 1.2) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 6), c.redM);
    post.position.set(FL.x + FL.hx - 0.05, flTop + 0.3, pz); thuy.add(post);
  }
  for (let px = FL.x - FL.hx + 0.6; px <= FL.x + FL.hx; px += 0.8) for (const s of [-1, 1]) colliders.push({ x: px, z: FL.z + s * FL.hz, r: 0.2 });
  for (let pz = FL.z - FL.hz + 0.8; pz < FL.z + FL.hz; pz += 0.8) colliders.push({ x: FL.x + FL.hx, z: pz, r: 0.2 });
  const tdSeats: Seat[] = [
    { x: FL.x + 1.4, z: FL.z, ry: Math.PI / 2, rest: true },
    { x: FL.x, z: FL.z - 0.8, ry: Math.PI, rest: true },
    { x: FL.x, z: FL.z + 0.8, ry: 0, rest: true },
  ];
  for (const s of tdSeats) {
    const mat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.9), matM); mat.position.set(s.x, flTop + 0.02, s.z); mat.receiveShadow = true; thuy.add(mat);
    const cu = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.1, 18), cushM); cu.position.set(s.x, flTop + 0.09, s.z); cu.castShadow = true; thuy.add(cu);
    seats.push(s);
  }
  const tdSeal2 = sealArchitectureJoints(thuy, { maxGap: 0.4 });
  if (import.meta.env.DEV) console.warn(`gapdump thuyDinh: filled=${tdSeal2.filled} remaining=${tdSeal2.remaining.length} ` + JSON.stringify(tdSeal2.remaining));
  zones.push({ x: FL.x, z: FL.z, r: 4.5, id: 'thuyDinh' });
  void pierLen;

  // ---- perimeter wall + tam quan gate ----
  const wallStone = lamb(0xe9dcc0, { roughness: 0.9 });
  const capM = lamb(0xb4502c);
  const wallSeg = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
    const w = new THREE.Mesh(new THREE.BoxGeometry(len, 1.6, 0.5), wallStone);
    w.position.set((x0 + x1) / 2, 0.8, (z0 + z1) / 2); w.rotation.y = -ang; w.castShadow = w.receiveShadow = true; scene.add(w);
    const t = new THREE.Mesh(new THREE.BoxGeometry(len + 0.1, 0.18, 0.7), capM);
    t.position.set(w.position.x, 1.7, w.position.z); t.rotation.y = -ang; scene.add(t);
    const n = Math.ceil(len / 3);
    for (let i = 0; i <= n; i++) colliders.push({ x: x0 + ((x1 - x0) * i) / n, z: z0 + ((z1 - z0) * i) / n, r: 0.55 });
  };
  wallSeg(-WALL.x, WALL.zN, WALL.x, WALL.zN);
  wallSeg(-WALL.x, WALL.zN, -WALL.x, WALL.zS); wallSeg(WALL.x, WALL.zN, WALL.x, WALL.zS);
  wallSeg(-WALL.x, WALL.zS, -WALL.gate - 5.1, WALL.zS); wallSeg(WALL.gate + 5.1, WALL.zS, WALL.x, WALL.zS);
  wallSeg(-WALL.gate - 1.7, WALL.zS, -WALL.gate - 0.6, WALL.zS); wallSeg(WALL.gate + 0.6, WALL.zS, WALL.gate + 1.7, WALL.zS);
  const gate = new THREE.Group();
  for (const x of [-WALL.gate, WALL.gate]) {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.4, 1.2), c.redM); pl.position.set(x, 3.2, 0); pl.castShadow = true; pl.userData.sealable = true; gate.add(pl);
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 1.7), stoneBase); b.position.set(x, 0.25, 0); b.userData.sealable = true; gate.add(b);
    colliders.push({ x, z: WALL.zS, r: 0.9 });
    const sx = x + Math.sign(x) * 3.2;
    for (const px of [sx - 1.5, sx + 1.5]) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.6, 0.8), c.redM); sp.position.set(px, 2.3, 0); sp.castShadow = true; sp.userData.sealable = true; gate.add(sp);
      const sb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), stoneBase); sb.position.set(px, 0.2, 0); sb.userData.sealable = true; gate.add(sb);
      colliders.push({ x: px, z: WALL.zS, r: 0.55 });
    }
    const sl = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 1.1), c.redM); sl.position.set(sx, 4.7, 0); sl.castShadow = true; sl.userData.sealable = true; gate.add(sl);
    const sr = new THREE.Mesh(c.roofGeometry(5.4, 3.6, 1.2, 0.5), c.tileM); sr.position.set(sx, 5.4, 0); sr.castShadow = true; sr.userData.sealable = true; gate.add(sr);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(WALL.gate * 2 + 4.6, 0.8, 1.5), c.redM); lintel.position.y = 6.45; lintel.castShadow = true; lintel.userData.sealable = true; gate.add(lintel);
  const gRoof = new THREE.Mesh(c.roofGeometry(WALL.gate * 2 + 7.5, 5, 2.0, 0.8), c.tileM); gRoof.position.y = 7.45; gRoof.castShadow = true; gRoof.userData.sealable = true; gate.add(gRoof);
  const gNeck = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.2, 2.0), c.redM); gNeck.position.y = 7.95; gNeck.castShadow = true; gNeck.userData.sealable = true; gate.add(gNeck);
  const gRoof2 = new THREE.Mesh(c.roofGeometry(WALL.gate * 2 + 4.2, 4.2, 1.5, 0.6), c.tileM); gRoof2.position.y = 8.85; gRoof2.castShadow = true; gRoof2.userData.sealable = true; gate.add(gRoof2);
  const gFin = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.2, 8), c.goldM); gFin.position.y = 10.45; gFin.userData.sealable = true; gate.add(gFin);
  const gSign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), new THREE.MeshBasicMaterial({ map: signTexture('CHÙA ONLINE') }));
  gSign.position.set(0, 5.35, 0.85); gate.add(gSign);
  for (let i = 0; i < 2; i++) {
    labelBoard(gate, COLUMN_LABELS.tamQuan[i], 0.5, 4.2, (i ? -1 : 1) * (WALL.gate - 0.9), 3.2, 0.64);
  }
  gate.position.set(0, 0, WALL.zS); scene.add(gate);
  const gateSeal = sealArchitectureJoints(gate, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump gate: filled=${gateSeal.filled} remaining=${gateSeal.remaining.length} ` + JSON.stringify(gateSeal.remaining));
  zones.push({ x: 0, z: WALL.zS, r: 6, id: 'tamQuan' });

  // ---- Đền Trình (đền nhỏ một gian trong cổng, phía Đông) ----
  const denT = new THREE.Group();
  const dtStone = (w: number, h: number, dp: number, x: number, y: number, z: number, mat: THREE.Material = stoneM) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; m.userData.sealable = true; denT.add(m); return m;
  };
  dtStone(4.4, 0.35, 3.6, 0, 0.175, 0);
  const dtBase = 0.35, dtColH = 2.4;
  for (const [px, pz] of [[-1.9, -1.5], [1.9, -1.5], [-1.9, 1.5], [1.9, 1.5]] as [number, number][]) {
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, dtColH, 12), c.redM);
    pl.position.set(px, dtBase + dtColH / 2, pz); pl.castShadow = true; pl.userData.sealable = true; denT.add(pl);
    dtStone(0.5, 0.18, 0.5, px, dtBase + 0.09, pz);
    const v = new THREE.Vector3(px, 0, pz).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    colliders.push({ x: DEN_TRINH.x + v.x, z: DEN_TRINH.z + v.z, r: 0.25 });
  }
  dtStone(4.0, dtColH, 0.2, 0, dtBase + dtColH / 2, -1.6, c.wallM);
  dtStone(0.2, 1.1, 3.0, -2.0, dtBase + 0.55, 0, c.wallM);
  dtStone(0.2, 1.1, 3.0, 2.0, dtBase + 0.55, 0, c.wallM);
  const dtBeam = dtBase + dtColH + 0.12;
  for (const s of [-1.5, 1.5]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.24, 0.26), c.redM);
    b.position.set(0, dtBeam, s); b.castShadow = true; b.userData.sealable = true; denT.add(b);
  }
  for (const s of [-1.9, 1.9]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 3.3), c.redM);
    b.position.set(s, dtBeam, 0); b.castShadow = true; b.userData.sealable = true; denT.add(b);
  }
  const dtRoofH = 1.5, dtRoofY = dtBeam + 0.12 + dtRoofH / 2 - 0.2;
  const dtRoof = new THREE.Mesh(c.roofGeometry(5.6, 4.6, dtRoofH, 0.6), c.tileM);
  dtRoof.position.y = dtRoofY; dtRoof.castShadow = true; dtRoof.userData.sealable = true; denT.add(dtRoof);
  const dtFin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.8, 8), c.goldM);
  dtFin.position.y = dtRoofY + dtRoofH / 2 + 0.3; dtFin.userData.sealable = true; denT.add(dtFin);
  dtStone(1.3, 0.7, 0.7, 0, dtBase + 0.35, -1.0);
  const dtCenser = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.28, 14), c.goldM);
  dtCenser.position.set(0, dtBase + 0.84, -1.0); dtCenser.castShadow = true; denT.add(dtCenser);
  const dtRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16), c.goldM);
  dtRim.rotation.x = Math.PI / 2; dtRim.position.set(0, dtBase + 0.98, -1.0); denT.add(dtRim);
  for (const s of [-1, 1]) dtStone(0.4, 0.42, 0.4, s * 1.3, dtBase + 0.21, 0.5);
  const dtSign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.55), new THREE.MeshBasicMaterial({ map: signTexture('ĐỀN TRÌNH') }));
  dtSign.position.set(0, dtBeam - 0.45, 1.65); denT.add(dtSign);
  for (let i = 0; i < 2; i++) labelBoard(denT, COLUMN_LABELS.denTrinh[i], 0.4, 2.0, i ? 1.9 : -1.9, dtBase + 1.3, 1.69);
  denT.position.set(DEN_TRINH.x, 0, DEN_TRINH.z); denT.rotation.y = -Math.PI / 2; scene.add(denT);
  const dtSeal = sealArchitectureJoints(denT, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump denTrinh: filled=${dtSeal.filled} remaining=${dtSeal.remaining.length} ` + JSON.stringify(dtSeal.remaining));
  colliders.push({ x: DEN_TRINH.x + 1.0, z: DEN_TRINH.z, r: 0.8 });
  zones.push({ x: DEN_TRINH.x, z: DEN_TRINH.z, r: 5, id: 'denTrinh' });

  // ---- Vườn Cột Kinh: hai hàng cột đá khắc kinh dọc trục, từ quảng trường lên chính điện ----
  const sutra = new THREE.Group();
  sutra.name = 'sutra-pillars';
  const SUTRA_X = 3.4;
  const SUTRA_Z = [-3.2, -5.0, -6.8, -8.6, -10.4];
  const SUTRA_TEXT: Record<'-1' | '1', string[]> = {
    '-1': ['Nam mô A Di Đà Phật', 'Tâm tịnh Phật tịnh', 'Từ bi hỷ xả', 'Giới định tuệ', 'Sen nở an lạc'],
    '1': ['Nam mô Bổn Sư Thích Ca', 'Buông bỏ phiền não', 'Hương trầm lòng tịnh', 'Gieo duyên lành', 'Thương yêu muôn loài'],
  };
  const sutraBaseM = lamb(0x9a8f7a, { map: stoneTexture([170, 160, 140], [1, 1], 2) });
  const sutraCapM = lamb(0xb9ad94, { map: stoneTexture([190, 180, 160], [1, 1], 2) });
  const sutraLampM = lamb(0xffd27a, { emissive: 0xff9a2a, emissiveIntensity: 0.9, roughness: 0.6 });
  for (const side of [-1, 1] as const) {
    SUTRA_Z.forEach((z, i) => {
      const x = side * SUTRA_X;
      const gy = groundY(x, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.1), sutraBaseM);
      base.position.set(x, gy + 0.25, z);
      const bodyM = lamb(0xffffff, { map: sutraPillarTexture(SUTRA_TEXT[String(side) as '-1' | '1'][i]) });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 4.2, 0.72), bodyM);
      body.position.set(x, gy + 0.5 + 2.1, z);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.95), sutraCapM);
      cap.position.set(x, gy + 4.7 + 0.09, z);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), c.goldM);
      ball.position.set(x, gy + 4.88 + 0.14, z);
      for (const m of [base, body, cap, ball]) { m.castShadow = m.receiveShadow = true; m.userData.sealable = true; sutra.add(m); }
      colliders.push({ x, z, r: 0.6 });
      if (i === 0) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), sutraLampM);
        lamp.scale.set(1, 1.25, 1); lamp.position.set(x - side * 0.52, gy + 3.2, z);
        sutra.add(lamp);
        glowSpr(lamp.position.x, lamp.position.y, lamp.position.z, 1.6, 0xffb040, 0.4);
      }
    });
  }
  scene.add(sutra);
  const sutraSeal = sealArchitectureJoints(sutra, { maxGap: 0.3 });
  if (import.meta.env.DEV) console.warn(`gapdump sutraPillars: filled=${sutraSeal.filled} remaining=${sutraSeal.remaining.length} ` + JSON.stringify(sutraSeal.remaining));

  // ---- paved side paths to towers, yard, pagoda ----
  const pave = lamb(0xffffff, { map: stoneTexture([150, 144, 134], [10, 1]) });
  const pathRect = (x0: number, z0: number, x1: number, z1: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0) || 2.4, Math.abs(z1 - z0) || 2.4), pave);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.028, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m);
  };
  pathRect(-SIDE_X - 6, PATH_Z - 1.2, SIDE_X + 6, PATH_Z + 1.2);
  pathRect(SIDE_X - 1.2, PATH_Z, SIDE_X + 1.2, QUAN.z);
  pathRect(PAGODA.x - 1.2, PAGODA.z, PAGODA.x + 1.2, PATH_Z);
  pathRect(-SIDE_X - 1.2, PATH_Z, -SIDE_X + 1.2, BUDDHA_YARD.z);
  pathRect(-SIDE_X - 7, BELL.z - 1.2, -SIDE_X, BELL.z + 1.2);
  pathRect(-SIDE_X + 1, BELL.z - 1.2, -SIDE_X + 1.3, BELL.z + 1.2);
  pathRect(SIDE_X, DRUM.z - 1.2, SIDE_X + 7, DRUM.z + 1.2);
  pathRect(SIDE_X - 1.3, DRUM.z - 1.2, SIDE_X - 1, DRUM.z + 1.2);
  pathRect(SIDE_X - 1.2, DRUM.z, SIDE_X + 1.2, PATH_Z);
  // lối từ quảng trường ra đầu cầu (bắc) và từ đầu cầu (nam) tới tam quan
  pathRect(PLAZA.x - 1.4, PLAZA.z + PLAZA.r - 1.2, PLAZA.x + 1.4, BRIDGE.z0 + 0.4);
  pathRect(BRIDGE.x - 1.4, BRIDGE.z1 - 0.4, BRIDGE.x + 1.4, WALL.zS - 0.6);
  pathRect(BRIDGE.x + 1.4, DEN_TRINH.z - 1.2, DEN_TRINH.x - 2.6, DEN_TRINH.z + 1.2);

  pathRect(-SIDE_X - 1.2, ZEN.z, -SIDE_X + 1.2, PATH_Z);
  pathRect(NHA_TO.x - 1.2, NHA_TO.z + NHA_TO_PLAT.hz, NHA_TO.x + 1.2, PATH_Z);
  pathRect(TANG_XA.x - 1.2, TANG_XA.z + TANG_XA_PLAT.hz, TANG_XA.x + 1.2, PATH_Z);
  pathRect(AM_CO.x + AM_CO_PLAT.hx, AM_CO.z - 1.2, -SIDE_X - 1.2, AM_CO.z + 1.2);
  pathRect(-SIDE_X - 1.2, AM_CO.z, -SIDE_X + 1.2, ZEN.z);
  pathRect(VUON_THAP.x - 1.2, VUON_THAP.z + VUON_THAP_PLAT.hz, VUON_THAP.x + 1.2, PATH_Z);
  const gardenCtx = { scene, colliders, lamb, stoneM, woodM, glowSpr, addZone: (x: number, z: number, r: number, id: string) => { zones.push({ x, z, r, id }); } };
  buildZenGarden(gardenCtx);
  buildFlowerBeds(gardenCtx);
  pathRect(BRIDGE.x + 1.4, REST.z - 1.2, REST.x - 2, REST.z + 1.2);
  buildRestArea(gardenCtx);

  // ---- animation ----
  let ring = 0, drumHit = 0;
  const ringBell = () => { ring = 1; };
  const ringDrum = () => { drumHit = 1; };
  const halos = [...hall.halos, bigB.getObjectByName('halo')!, quanAm.getObjectByName('halo')!].filter(Boolean);
  const update = (t: number, dt: number) => {
    ring = Math.max(0, ring - dt * 0.25);
    bellPivot.rotation.z = Math.sin(t * 2.6) * 0.5 * ring * ring + Math.sin(t * 0.5) * 0.015;
    drumHit = Math.max(0, drumHit - dt * 2.5);
    drumPivot.rotation.z = Math.sin(t * 38) * 0.035 * drumHit;
    drumPivot.position.y = drumTower.by + 1.7 + Math.abs(Math.sin(t * 24)) * 0.05 * drumHit;
    drumPivot.scale.setScalar(1 + Math.sin(t * 38) * 0.018 * drumHit);
    halos.forEach((h, i) => { h.rotation.z = t * (0.12 + i * 0.02); });
    // cá bơi trong hệ toạ độ của nhóm hồ (nhóm đã được đặt về tâm khuôn viên)
    koi.forEach((kk) => {
      kk.a += dt * kk.s;
      const x = Math.cos(kk.a) * kk.rx, z = Math.sin(kk.a) * kk.rz;
      kk.root.position.set(x, 0.16 + Math.sin(t * 2 + kk.a * 3) * 0.012, z);
      // hướng đầu (+z cục bộ) trùng tiếp tuyến đường bơi
      const tx = -Math.sin(kk.a) * kk.rx * Math.sign(kk.s);
      const tz = Math.cos(kk.a) * kk.rz * Math.sign(kk.s);
      kk.root.rotation.y = Math.atan2(tx, tz);
      swimKoi(kk, t);
    });
    waterMat.opacity = 0.8 + Math.sin(t * 0.8) * 0.03;
    void pondHandle;
  };

  const zoneAt = (x: number, z: number): string | null => {
    let best: Zone | null = null, bd = Infinity;
    for (const zn of zones) {
      const dd = Math.hypot(x - zn.x, z - zn.z);
      if (dd < zn.r && zn.r < bd) { best = zn; bd = zn.r; }
    }
    return best ? best.id : null;
  };

  // bảng chữ Việt trên mọi cột đã gắn inscription (kể cả cột do hall.ts dựng)
  relabelColumns(scene);

  return { seats, update, ringBell, ringDrum, zoneAt, inLake, pond: pondHandle };
}
