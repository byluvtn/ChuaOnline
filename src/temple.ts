import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COUPLETS } from './couplets';
import { buildHall } from './hall';
import { buildTamThe } from './tamthe';
import {
  NHA_TO, NHA_TO_PLAT, DIEN_MAU, DIEN_MAU_PLAT, NHA_KHACH, NHA_KHACH_PLAT, THIEN_DUONG, THIEN_DUONG_PLAT, TRAI_DUONG, TRAI_DUONG_PLAT, PHONG_CD, PHONG_CD_PLAT, VIEN_KT, VIEN_TO, PS, PS_POND, PS_PIER, TANG_XA, TANG_XA_PLAT, AM_CO, AM_CO_PLAT, VUON_THAP, VUON_THAP_PLAT, BAO_THAP, BAO_THAP_PLAT, BELL, BRIDGE, BUDDHA_YARD, CORR, DECK, DEN_TRINH, DRUM, LAKE, PAGODA, PATH_Z, PIER, PIER_FLOOR, PIER_RAMP, PLAZA, QUAN, REST, SIDE_X, WALL, ZEN, bridgeY, groundY, inLake, inPsPond, resolveWater,
} from './layout';
import { buildArhat, buildBuddha, buildQuanAm } from './statues';
import { buildCorridorStatues, CORRIDOR_STATUE_NAMES } from './statue-corridor';
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
  renderer: THREE.WebGLRenderer;
}
export { groundY, resolveWater };

/** Bảng chữ Việt trên các cột chùa (thay chữ Hán cũ). */
const COLUMN_LABELS = {
  tamQuan: ['Cửa từ bi mở rộng đón khách mười phương', 'Lòng hỷ xả bao dung độ khắp muôn loài'],
  chuong: ['Tiếng chuông ngân tỉnh giấc mộng trần gian', 'Hương trầm thoảng dẫn lối về cõi tịnh'],
  trong: ['Tiếng trống vọng sân thiền tan phiền não', 'Âm vang cửa Phật tỏ rõ lòng thành'],
  denTrinh: ['Dừng chân trình diện gột bụi trần', 'Thắp nén hương lành mở lối vào chùa'],
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
  const slabG = new THREE.BoxGeometry(3.4, 0.16, CORR.z1 - CORR.z0 + 1.2);
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
    for (const off of [-2.4, 2.4]) {
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
      slab.position.set(cx + s * 1.62, CORR.y + 3.86, zc); slab.rotation.z = -s * 0.45; slab.castShadow = true;
      slab.userData.sealable = true; corridor.add(slab);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, len + 1.3), c.goldM);
    ridge.position.set(cx, CORR.y + 4.54, zc); ridge.userData.sealable = true; corridor.add(ridge);
    for (const z of zs) for (const off of [-1.65, 1.65]) {
      d.position.set(cx + off, CORR.y + 2.75, z + spacing / 2); d.scale.set(1, 1.2, 1); d.updateMatrix(); lanterns.setMatrixAt(li++, d.matrix);
    }
    for (let z = CORR.z0 + 2.4; z < CORR.z1 - 1; z += spacing * 2) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 1.8), lamb(0x6d4426));
      bench.position.set(cx - side * 1.7, CORR.y + 0.5, z); bench.castShadow = true; corridor.add(bench);
      colliders.push({ x: bench.position.x, z, r: 0.5 });
      for (const lz of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), lamb(0x4a2e18));
        leg.position.set(bench.position.x, CORR.y + 0.25, z + lz); corridor.add(leg);
      }
    }
  }
  d.scale.setScalar(1); lanterns.count = li; scene.add(lanterns);
  // bảng chữ Việt treo trên hai cột đầu hành lang
  for (const side of [-1, 1]) {
    labelBoard(corridor, COLUMN_LABELS.hanhLang[side > 0 ? 0 : 1], 0.5, 2.4, side * (CORR.x - 2.4), CORR.y + 1.9, CORR.z1 - 1.2, side > 0 ? 0 : Math.PI);
  }
  sealArchitectureJoints(corridor, { maxGap: 0.4 });

  // ---- tượng La Hán dọc hai hành lang: 5 tượng mỗi bên, cách nhau 3.6, đặt giữa các cột (bệ không chồng đế cột), quay mặt vào trục ----
  const arhatGroup = new THREE.Group(); arhatGroup.name = 'arhats'; scene.add(arhatGroup);
  const arhatModels = ([0, 1, 2] as const).map((v) => buildArhat(v));
  const arhatPedM = lamb(0x9a8f7a, { map: stoneTexture([170, 160, 140], [1, 1], 2) });
  const corridorSlots: { x: number; z: number; side: number; idx: number; fallback: THREE.Object3D }[] = [];
  for (const side of [-1, 1] as const) {
    for (let k = 0; k < 5; k++) {
      const z = -16.6 + 3.6 * k;
      const x = side * CORR.x + side * 1.85;
      const ped = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.5), arhatPedM);
      ped.position.set(x, CORR.y + 0.275, z); ped.castShadow = ped.receiveShadow = true; ped.userData.sealable = true; arhatGroup.add(ped);
      const a = arhatModels[(k + (side > 0 ? 1 : 0)) % 3].clone(true);
      a.position.set(x, CORR.y + 0.55, z); a.rotation.y = -side * Math.PI / 2;
      arhatGroup.add(a);
      corridorSlots.push({ x, z, side, idx: (k + (side > 0 ? 2 : 0)) % 4, fallback: a });
      colliders.push({ x, z, r: 0.85 });
    }
  }
  const corridorStatuesP = buildCorridorStatues(c.renderer);
  corridorStatuesP.then((models) => {
    for (const s of corridorSlots) {
      const m = models[s.idx];
      if (!m) continue;
      const inst = m.clone(true);
      inst.position.set(s.x, CORR.y + 0.55, s.z);
      inst.rotation.y = -s.side * Math.PI / 2;
      arhatGroup.add(inst);
      arhatGroup.remove(s.fallback);
    }
  }).catch((e) => { console.warn('statue-corridor: lỗi dựng, giữ tượng chibi', e); });
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
  const prof = [[0.78, 0.03], [0.95, 0], [0.9, 0.1], [0.7, 0.5], [0.62, 1.05], [0.5, 1.5], [0.2, 1.55]].map(([x, y]) => new THREE.Vector2(x, y));
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

  // ---- Quan Âm statue in the eastern yard (đối xứng sân tượng Phật Tổ phía Tây) ----
  const qyard = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(4.2 - i * 0.5, 4.5 - i * 0.5, 0.4, 8), stoneM);
    t.position.y = 0.2 + i * 0.4; t.castShadow = t.receiveShadow = true; t.userData.sealable = true; qyard.add(t);
  }
  const quanAm = buildQuanAm(); quanAm.scale.setScalar(1.15); quanAm.position.y = 1.2; qyard.add(quanAm);
  qyard.position.set(QUAN.x, 0, QUAN.z); qyard.rotation.y = -Math.PI * 0.5 - 0.3; scene.add(qyard);
  sealArchitectureJoints(qyard, { maxGap: 0.3 });
  colliders.push({ x: QUAN.x, z: QUAN.z, r: 4 });

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

  const tamThe = buildTamThe(c);
  seats.push(...tamThe.seats); zones.push(...tamThe.zones);

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

  /** Gộp các mesh tĩnh dùng chung một vật liệu thành một mesh (giảm draw call). Chạy SAU khi seal xong. */
  const mergeStaticByMaterial = (root: THREE.Group) => {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map<THREE.Material, THREE.Mesh[]>();
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material) || m.userData.inscription) return;
      const list = buckets.get(m.material) ?? [];
      list.push(m); buckets.set(m.material, list);
    });
    for (const [mat, list] of buckets) {
      if (list.length < 2) continue;
      const geos = list.map((m) => {
        const gg = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone());
        gg.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
        for (const k of Object.keys(gg.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') gg.deleteAttribute(k);
        return gg;
      });
      const merged = mergeGeometries(geos);
      if (!merged) continue;
      for (const m of list) m.removeFromParent();
      const mm = new THREE.Mesh(merged, mat);
      mm.castShadow = list.some((m) => m.castShadow); mm.receiveShadow = list.some((m) => m.receiveShadow);
      root.add(mm);
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
  // Nhóm amCo xoay -90 độ, nên nền dựng hoán đổi hx/hz để mặt nền ngoài đời vẫn là
  // 6.5 (x) x 5.5 (z), khớp groundY() dùng AM_CO_PLAT.
  acStone(AP.hz * 2, AP.y, AP.hx * 2, 0, AP.y / 2, 0);
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
  const acSign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), new THREE.MeshBasicMaterial({ map: signTexture('AM CỔ') }));
  acSign.position.set(acHx + 0.2, acBeamY - 0.4, 0); acSign.rotation.y = Math.PI / 2; amCo.add(acSign);
  for (let i = 0; i < 2; i++) labelBoard(amCo, COUPLETS.amCo.am[i].split(',')[0], 0.4, 2.0, acHx + 0.22, acBase + 1.5, i ? acHz : -acHz, Math.PI / 2);
  amCo.position.set(AM_CO.x, 0, AM_CO.z); scene.add(amCo);
  // R_y(-90 độ): local +x (mặt mở) -> world +z (Nam, sân chùa)
  amCo.rotation.y = -Math.PI / 2;
  const acSeal = sealArchitectureJoints(amCo, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump amCo: filled=${acSeal.filled} remaining=${acSeal.remaining.length}`);
  {
    // nội thất am cổ: giường nhỏ, bồ đoàn, bàn trà mini (dùng chung vật liệu để merge gộp được)
    const acB = (w: number, h: number, dp: number, x: number, y: number, z: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), mat);
      m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; amCo.add(m); return m;
    };
    const acPaper = lamb(0xf4efe2, { roughness: 0.95 });
    const bedX = -acHx + 0.9;
    acB(0.8, 0.3, 1.7, bedX, acBase + 0.15, 0, woodM);
    acB(0.72, 0.05, 1.6, bedX, acBase + 0.325, 0, matM);
    acB(0.3, 0.12, 0.5, bedX, acBase + 0.41, -0.6, acPaper);
    acB(0.9, 0.04, 0.9, -1.2, acBase + 0.02, 0.3, matM);
    const acCu = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.1, 18), cushM);
    acCu.position.set(-1.2, acBase + 0.09, 0.3); acCu.castShadow = true; amCo.add(acCu);
    acB(0.7, 0.05, 0.5, 0.8, acBase + 0.5, -0.9, woodM);
    for (const [lx, lz] of [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]] as [number, number][]) acB(0.06, 0.5, 0.06, 0.8 + lx, acBase + 0.25, -0.9 + lz, woodM);
    const acPot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), c.goldM);
    acPot.scale.set(1, 0.85, 1); acPot.position.set(0.8, acBase + 0.63, -0.9); acPot.castShadow = true; amCo.add(acPot);
    colliders.push({ x: AM_CO.x + 0.5, z: AM_CO.z - 1.0, r: 0.1 }, { x: AM_CO.x - 0.5, z: AM_CO.z - 1.0, r: 0.1 }, { x: AM_CO.x + 0.9, z: AM_CO.z + 0.9, r: 0.15 });
  }
  mergeStaticByMaterial(amCo);
  colliders.push({ x: AM_CO.x, z: AM_CO.z - acHx, r: 0.3 });
  for (const sx of [-acHz, acHz]) for (const sz of [-acHx, 0, acHx]) colliders.push({ x: AM_CO.x + sx, z: AM_CO.z + sz, r: 0.7 });
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
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: signTexture(sign) }));
    sg.position.set(0, beamY - 0.5, hz + 0.25); g.add(sg);
    return { g, hx, hz, corners };
  };
  const nt = buildHouse('nha-to', NHA_TO, NHA_TO_PLAT, 'NHÀ TỔ', 'nhaTo', 4.6, 3.25, true);
  for (let i = 0; i < 2; i++) labelBoard(nt.g, COUPLETS.nhaTo.am[i].split(',')[0], 0.42, 2.2, i ? nt.hx : -nt.hx, NHA_TO_PLAT.y + 1.7, nt.hz + 0.22);
  nt.g.position.set(NHA_TO.x, 0, NHA_TO.z); scene.add(nt.g);
  const ntSeal = sealArchitectureJoints(nt.g, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump nhaTo: filled=${ntSeal.filled} remaining=${ntSeal.remaining.length}`);
  mergeStaticByMaterial(nt.g);
  {
    const n = Math.round(nt.hx / 0.9), sn = (2 * nt.hx) / n, rn = sn / 2 - 0.4;
    const k = Math.max(1, Math.round((2 * nt.hz - sn / 2) / 2.2 - 0.5)), sw = (2 * nt.hz - sn / 2) / (k + 0.5), rw = sw / 2 - 0.4;
    for (let i = 0; i <= n; i++) colliders.push({ x: NHA_TO.x - nt.hx + i * sn, z: NHA_TO.z - nt.hz, r: rn });
    for (let j = 0; j <= k; j++) { const lz = -nt.hz + sn / 2 + sw / 2 + j * sw; colliders.push({ x: NHA_TO.x - nt.hx, z: NHA_TO.z + lz, r: rw }, { x: NHA_TO.x + nt.hx, z: NHA_TO.z + lz, r: rw }); }
  }
  zones.push({ x: NHA_TO.x, z: NHA_TO.z, r: 7, id: 'nhaTo' });

  const tx = buildHouse('tang-xa', TANG_XA, TANG_XA_PLAT, 'TĂNG XÁ', 'tangXa', 6.1, 3.0);
  for (let i = 0; i < 2; i++) labelBoard(tx.g, COUPLETS.tangXa.am[i].split(',')[0], 0.42, 2.2, i ? 1.2 : -1.2, TANG_XA_PLAT.y + 1.7, tx.hz + 0.2);
  tx.g.position.set(TANG_XA.x, 0, TANG_XA.z); scene.add(tx.g);
  const txSeal = sealArchitectureJoints(tx.g, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump tangXa: filled=${txSeal.filled} remaining=${txSeal.remaining.length}`);
  mergeStaticByMaterial(tx.g);
  {
    const n = Math.round(tx.hx / 0.9), sn = (2 * tx.hx) / n, rn = sn / 2 - 0.4;
    const k = Math.max(1, Math.round((2 * tx.hz - sn / 2) / 2.2 - 0.5)), sw = (2 * tx.hz - sn / 2) / (k + 0.5), rw = sw / 2 - 0.4;
    for (let i = 0; i <= n; i++) colliders.push({ x: TANG_XA.x - tx.hx + i * sn, z: TANG_XA.z - tx.hz, r: rn });
    for (let j = 0; j <= k; j++) { const lz = -tx.hz + sn / 2 + sw / 2 + j * sw; colliders.push({ x: TANG_XA.x - tx.hx, z: TANG_XA.z + lz, r: rw }, { x: TANG_XA.x + tx.hx, z: TANG_XA.z + lz, r: rw }); }
  }
  zones.push({ x: TANG_XA.x, z: TANG_XA.z, r: 7, id: 'tangXa' });

  const extraHouse = (name: string, at: { x: number; z: number }, plat: { hx: number; hz: number; y: number }, sign: string, zoneId: string, wide: number, deep: number, openFront: boolean) => {
    const h = buildHouse(name, at, plat, sign, zoneId, wide, deep, openFront);
    h.g.position.set(at.x, 0, at.z); scene.add(h.g);
    const sl = sealArchitectureJoints(h.g, { maxGap: 0.5 });
    if (import.meta.env.DEV) console.warn(`gapdump ${name}: filled=${sl.filled} remaining=${sl.remaining.length}`);
    mergeStaticByMaterial(h.g);
    {
      const n = Math.round(wide / 0.9), sn = (2 * wide) / n, rn = sn / 2 - 0.4;
      const k = Math.max(1, Math.round((2 * h.hz - sn / 2) / 2.2 - 0.5)), sw = (2 * h.hz - sn / 2) / (k + 0.5), rw = sw / 2 - 0.4;
      for (let i = 0; i <= n; i++) colliders.push({ x: at.x - wide + i * sn, z: at.z - h.hz, r: rn });
      for (let j = 0; j <= k; j++) { const lz = -h.hz + sn / 2 + sw / 2 + j * sw; colliders.push({ x: at.x - h.hx, z: at.z + lz, r: rw }, { x: at.x + h.hx, z: at.z + lz, r: rw }); }
    }
    zones.push({ x: at.x, z: at.z, r: 7, id: zoneId });
    return h;
  };
  const dm = extraHouse('dien-mau', DIEN_MAU, DIEN_MAU_PLAT, 'ĐIỆN MẪU', 'dienMau', 2.6, 2.2, true);
  for (let i = 0; i < 2; i++) labelBoard(dm.g, COUPLETS.dienMau.am[i].split(',')[0], 0.42, 2.2, i ? dm.hx : -dm.hx, DIEN_MAU_PLAT.y + 1.7, dm.hz + 0.22);
  // 2 bồ đoàn tụng kinh ở CHANT_SEATS Điện Mẫu (quest v1) — Điện Mẫu trước đây không có bồ đoàn
  {
    const y0 = DIEN_MAU_PLAT.y;
    const cushG2 = new THREE.CylinderGeometry(0.44, 0.49, 0.12, 20);
    for (const [wx, wz] of [[37, 10], [39, 10]] as const) {
      const lx = wx - DIEN_MAU.x, lz = wz - DIEN_MAU.z;
      const mat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 1.0), matM);
      mat.position.set(lx, y0 + 0.1, lz); mat.receiveShadow = true; dm.g.add(mat);
      const cu = new THREE.Mesh(cushG2, cushM);
      cu.position.set(lx, y0 + 0.18, lz); cu.castShadow = true; dm.g.add(cu);
      seats.push({ x: wx, z: wz, ry: Math.PI });
    }
    // Tượng Quan Âm ngồi (GLB guanyin-ngoi, cùng pipeline tượng hành lang) trên bệ đá sau 2 bồ đoàn, mặt ra cửa (+z).
    const gmZ = 8.65;
    const gmLz = gmZ - DIEN_MAU.z;
    const gmPed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.5), arhatPedM);
    gmPed.position.set(0, y0 + 0.275, gmLz); gmPed.castShadow = gmPed.receiveShadow = true; dm.g.add(gmPed);
    const gmFallback = buildQuanAm();
    gmFallback.position.set(0, y0 + 0.55, gmLz);
    dm.g.add(gmFallback);
    colliders.push({ x: DIEN_MAU.x, z: gmZ, r: 0.85 });
    const gmIdx = CORRIDOR_STATUE_NAMES.indexOf('guanyin-ngoi');
    corridorStatuesP.then((models) => {
      const m = models[gmIdx];
      if (!m) { console.warn('dien-mau: guanyin-ngoi không có, giữ tượng chibi buildQuanAm'); return; }
      const inst = m.clone(true);
      inst.position.set(0, y0 + 0.55, gmLz);
      inst.rotation.y = 0;
      dm.g.add(inst);
      dm.g.remove(gmFallback);
    }).catch((e) => { console.warn('dien-mau: lỗi dựng tượng, giữ tượng chibi', e); });
  }
  const nk = extraHouse('nha-khach', NHA_KHACH, NHA_KHACH_PLAT, 'NHÀ KHÁCH', 'nhaKhach', 4.6, 3.25, true);
  for (let i = 0; i < 2; i++) labelBoard(nk.g, COUPLETS.nhaKhach.am[i].split(',')[0], 0.42, 2.2, i ? nk.hx : -nk.hx, NHA_KHACH_PLAT.y + 1.7, nk.hz + 0.22);
  const tdH = buildHouse('thien-duong', THIEN_DUONG, { hx: THIEN_DUONG_PLAT.hz, hz: THIEN_DUONG_PLAT.hx, y: THIEN_DUONG_PLAT.y }, 'THIỀN ĐƯỜNG', 'thienDuong', 3.1, 5.1, true);
  for (let i = 0; i < 2; i++) labelBoard(tdH.g, COUPLETS.thienDuong.am[i].split(',')[0], 0.42, 2.2, i ? tdH.hx : -tdH.hx, THIEN_DUONG_PLAT.y + 1.7, tdH.hz + 0.22);
  tdH.g.rotation.y = Math.PI / 2;
  tdH.g.position.set(THIEN_DUONG.x, 0, THIEN_DUONG.z); scene.add(tdH.g);
  const tdSealH = sealArchitectureJoints(tdH.g, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump thien-duong: filled=${tdSealH.filled} remaining=${tdSealH.remaining.length}`);
  mergeStaticByMaterial(tdH.g);
  {
    const tw = (lx: number, lz: number) => ({ x: THIEN_DUONG.x + lz, z: THIEN_DUONG.z - lx });
    {
      const n = Math.round(tdH.hx / 0.9), sn = (2 * tdH.hx) / n, rn = sn / 2 - 0.4;
      const k = Math.max(1, Math.round((2 * tdH.hz - sn / 2) / 2.2 - 0.5)), sw = (2 * tdH.hz - sn / 2) / (k + 0.5), rw = sw / 2 - 0.4;
      for (let i = 0; i <= n; i++) colliders.push({ ...tw(-tdH.hx + i * sn, -tdH.hz), r: rn });
      for (let j = 0; j <= k; j++) { const lz = -tdH.hz + sn / 2 + sw / 2 + j * sw; colliders.push({ ...tw(-tdH.hx, lz), r: rw }, { ...tw(tdH.hx, lz), r: rw }); }
    }
    zones.push({ x: THIEN_DUONG.x, z: THIEN_DUONG.z, r: 7, id: 'thienDuong' });
  }
  const td = tdH;
  void td;
  const trd = extraHouse('trai-duong', TRAI_DUONG, TRAI_DUONG_PLAT, 'TRAI ĐƯỜNG', 'traiDuong', 4.6, 2.75, true);
  for (let i = 0; i < 2; i++) labelBoard(trd.g, COUPLETS.traiDuong.am[i].split(',')[0], 0.42, 2.2, i ? trd.hx : -trd.hx, TRAI_DUONG_PLAT.y + 1.7, trd.hz + 0.22);
  const pcd = buildHouse('phong-cong-duc', PHONG_CD, PHONG_CD_PLAT, 'PHÒNG GHI CÔNG ĐỨC', 'phongCongDuc', 5.1, 3.5, true);
  // Mặt mở xoay 180 độ về hướng Bắc (sân chính); nhà 10.2 x 7.0 vẫn vừa nền 13 x 9.
  pcd.g.rotation.y = Math.PI;
  pcd.g.position.set(PHONG_CD.x, 0, PHONG_CD.z); scene.add(pcd.g);
  const pcdSeal = sealArchitectureJoints(pcd.g, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump phong-cong-duc: filled=${pcdSeal.filled} remaining=${pcdSeal.remaining.length}`);
  mergeStaticByMaterial(pcd.g);
  {
    const tw = (lx: number, lz: number) => ({ x: PHONG_CD.x - lx, z: PHONG_CD.z - lz });
    const n = Math.round(pcd.hx / 0.9), sn = (2 * pcd.hx) / n, rn = sn / 2 - 0.4;
    const k = Math.max(1, Math.round((2 * pcd.hz - sn / 2) / 2.2 - 0.5)), sw = (2 * pcd.hz - sn / 2) / (k + 0.5), rw = sw / 2 - 0.4;
    for (let i = 0; i <= n; i++) colliders.push({ ...tw(-pcd.hx + i * sn, -pcd.hz), r: rn });
    for (let j = 0; j <= k; j++) { const lz = -pcd.hz + sn / 2 + sw / 2 + j * sw; colliders.push({ ...tw(-pcd.hx, lz), r: rw }, { ...tw(pcd.hx, lz), r: rw }); }
  }
  zones.push({ x: PHONG_CD.x, z: PHONG_CD.z, r: 7, id: 'phongCongDuc' });
  void pcd;

  // ---- A2.3 interiors ----
  {
    const twd = (lx: number, lz: number) => ({ x: THIEN_DUONG.x + lz, z: THIEN_DUONG.z - lx });
    const mk = (root: THREE.Group) => (
      w: number, h: number, dp: number, x: number, y: number, z: number, mat: THREE.Material,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), mat);
      m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; root.add(m); return m;
    };
    const cyl = (root: THREE.Group, rt: number, rb: number, h: number, x: number, y: number, z: number, mat: THREE.Material, seg = 12) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z); m.castShadow = true; root.add(m); return m;
    };
    const paperM = lamb(0xf4efe2, { roughness: 0.95 });
    const inkM = lamb(0x1a1612, { roughness: 0.6 });
    const mkIn = (name: string, at: { x: number; z: number }) => {
      const g = new THREE.Group(); g.name = name; g.position.set(at.x, 0, at.z); return g;
    };

    // --- Nhà khách: bàn trà + 4 đôn + băng ghế dài ---
    {
      const g = mkIn('nha-khach-in', NHA_KHACH), b = mk(g), y0 = NHA_KHACH_PLAT.y, hz = nk.hz, hx = nk.hx, tz = -1.6; // tz: dời bộ bàn trà về Bắc, chừa lối từ cửa tới tâm nhà
      b(1.6, 0.06, 0.9, 0, y0 + 0.72, tz, woodM);
      for (const [lx, lz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]] as [number, number][]) b(0.08, 0.72, 0.08, lx, y0 + 0.36, tz + lz, woodM);
      cyl(g, 0.09, 0.09, 0.12, 0, y0 + 0.81, tz, c.goldM, 12);
      b(0.14, 0.04, 0.04, 0.13, y0 + 0.83, tz, c.goldM);
      for (const [lx, lz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]] as [number, number][]) cyl(g, 0.04, 0.04, 0.05, lx, y0 + 0.78, tz + lz, paperM, 10);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b(0.45, 0.4, 0.45, sx * 1.1, y0 + 0.2, tz + sz * 0.7, woodM);
      const bx = -hx + 0.35; // băng ghế dài dời sát tường Tây, xoay dọc theo trục z
      b(0.45, 0.06, 2.4, bx, y0 + 0.42, 0.6, woodM);
      for (const lz of [-0.4, 1.6]) b(0.38, 0.4, 0.1, bx, y0 + 0.2, lz, woodM);
      mergeStaticByMaterial(g); scene.add(g);
      colliders.push({ x: NHA_KHACH.x, z: NHA_KHACH.z + tz, r: 0.9 });
    }

    // --- Tăng xá: 2 giường + bàn nhỏ + đèn dầu ---
    {
      const g = mkIn('tang-xa-in', TANG_XA), b = mk(g), y0 = TANG_XA_PLAT.y, bz = -tx.hz + 0.95;
      for (const bx of [-3.0, 3.0]) {
        b(2.0, 0.3, 0.9, bx, y0 + 0.15, bz, woodM);
        b(1.9, 0.05, 0.8, bx, y0 + 0.325, bz, matM);
        b(0.5, 0.12, 0.3, bx, y0 + 0.41, -tx.hz + 0.6, paperM);
      }
      b(0.5, 0.5, 0.5, 0, y0 + 0.25, bz, woodM);
      cyl(g, 0.06, 0.07, 0.1, 0, y0 + 0.55, bz, c.goldM, 10);
      mergeStaticByMaterial(g); scene.add(g);
      for (const sx of [-1, 1]) { colliders.push({ x: TANG_XA.x + sx * 2.1, z: TANG_XA.z + bz + 0.33, r: 0.1 }); colliders.push({ x: TANG_XA.x + sx * 3.485, z: TANG_XA.z + bz + 0.25, r: 0.2 }); }
      colliders.push({ x: TANG_XA.x, z: TANG_XA.z + bz + 0.2, r: 0.15 });
    }

    // --- Trai đường: bàn ăn dài + 2 băng ghế (không bếp) ---
    {
      const g = mkIn('trai-duong-in', TRAI_DUONG), b = mk(g), y0 = TRAI_DUONG_PLAT.y;
      b(3.6, 0.06, 1.1, 0, y0 + 0.72, 0, woodM);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b(0.1, 0.72, 0.1, sx * 1.7, y0 + 0.36, sz * 0.5, woodM);
      for (const lx of [-1.0, 1.0]) cyl(g, 0.25, 0.25, 0.03, lx, y0 + 0.77, 0, c.goldM, 16);
      for (const [lx, lz] of [[-1.5, -0.3], [-0.5, 0.3], [0.5, -0.3], [1.5, 0.3]] as [number, number][]) cyl(g, 0.07, 0.07, 0.05, lx, y0 + 0.78, lz, paperM, 10);
      b(3.2, 0.06, 0.4, 0, y0 + 0.42, -1.15, woodM);
      for (const lx of [-1.4, 1.4]) b(0.1, 0.4, 0.34, lx, y0 + 0.2, -1.15, woodM);
      for (const sx of [-1, 1]) { // băng ghế Nam chẻ đôi, chừa lối rộng 1.8 m ở giữa
        b(0.9, 0.06, 0.4, sx * 1.35, y0 + 0.42, 1.15, woodM);
        for (const lx of [1.0, 1.7]) b(0.1, 0.4, 0.34, sx * lx, y0 + 0.2, 1.15, woodM);
      }
      mergeStaticByMaterial(g); scene.add(g);
      for (const lx of [-1.8, -0.6, 0.6, 1.8]) colliders.push({ x: TRAI_DUONG.x + lx, z: TRAI_DUONG.z - 1.2, r: 0.2 });
      for (const lx of [-1.6, -1.1, 1.1, 1.6]) colliders.push({ x: TRAI_DUONG.x + lx, z: TRAI_DUONG.z + 1.2, r: 0.2 });
      for (const lx of [-1.8, 1.8]) colliders.push({ x: TRAI_DUONG.x + lx, z: TRAI_DUONG.z, r: 0.2 });
    }

    // --- Nhà tổ: ban thờ tổ trước bàn thờ có sẵn ---
    {
      const g = mkIn('nha-to-in', NHA_TO), b = mk(g), y0 = NHA_TO_PLAT.y, az = -nt.hz + 1.4;
      b(3.0, 0.9, 0.8, 0, y0 + 0.45, az, lamb(0x6d2a16, { roughness: 0.55 }));
      b(3.1, 0.05, 0.9, 0, y0 + 0.925, az, c.goldM);
      labelBoard(g, 'BÀI VỊ TỔ SƯ', 0.5, 0.9, 0, y0 + 1.4, az, 0);
      cyl(g, 0.28, 0.28, 0.1, 0, y0 + 0.98, az + 0.2, c.goldM, 14);
      for (const lx of [-1.2, 1.2]) cyl(g, 0.12, 0.12, 0.35, lx, y0 + 1.12, az, c.goldM, 12);
      for (const sx of [-1, 1]) b(0.5, 0.45, 0.5, sx * 2.8, y0 + 0.225, 0.6, woodM);
      mergeStaticByMaterial(g); scene.add(g);
      for (const lx of [-1, 1]) colliders.push({ x: NHA_TO.x + lx, z: NHA_TO.z + az + 0.08, r: 0.1 });
      colliders.push({ x: NHA_TO.x, z: NHA_TO.z + az + 0.08, r: 0.1 });
    }

    // --- Thiền đường: sàn gỗ nâng + 2 dãy 5 bồ đoàn, mõ gỗ ---
    {
      const g = mkIn('thien-duong-in', THIEN_DUONG); g.rotation.y = Math.PI / 2;
      const b = mk(g), y0 = THIEN_DUONG_PLAT.y, hxL = tdH.hx, hzL = tdH.hz;
      b(hxL * 2, 0.08, (hzL - 0.8) - (-hzL + 0.1), 0, y0 + 0.04, ((hzL - 0.8) + (-hzL + 0.1)) / 2, woodM);
      const cushG = new THREE.CylinderGeometry(0.44, 0.49, 0.12, 20);
      for (const lx of [-1.2, 1.2]) for (const lz of [-3.4, -1.9, -0.4, 1.1, 2.6]) {
        b(1.0, 0.04, 1.0, lx, y0 + 0.1, lz, matM);
        const cu = new THREE.Mesh(cushG, cushM);
        cu.position.set(lx, y0 + 0.18, lz); cu.castShadow = true; g.add(cu);
        const w = twd(lx, lz);
        seats.push({ x: w.x, z: w.z, ry: 3 * Math.PI / 2 });
      }
      // 2 bồ đoàn tụng kinh ở CHANT_SEATS (quest v1) — không trùng 10 bồ đoàn có sẵn
      for (const [lx, lz] of [[0, 2], [0, 4]] as const) {
        b(1.0, 0.04, 1.0, lx, y0 + 0.1, lz, matM);
        const cu2 = new THREE.Mesh(cushG, cushM);
        cu2.position.set(lx, y0 + 0.18, lz); cu2.castShadow = true; g.add(cu2);
        const w2 = twd(lx, lz);
        seats.push({ x: w2.x, z: w2.z, ry: Math.PI / 2 });
      }
      const mohM = lamb(0x5a3a22, { roughness: 0.8 });
      b(0.5, 0.12, 0.35, 0.95, y0 + 0.06, -hzL + 1.2, mohM);
      const moh = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mohM);
      moh.scale.set(0.45, 0.3, 0.3); moh.position.set(0.95, y0 + 0.27, -hzL + 1.2); moh.castShadow = true; g.add(moh);
      mergeStaticByMaterial(g); scene.add(g);
      colliders.push({ ...twd(1.0, -hzL + 1.6), r: 0.15 });
    }

    // --- Phòng ghi công đức: bàn dài + ghế trực + kệ sổ ---
    {
      const g = mkIn('phong-cong-duc-in', PHONG_CD), b = mk(g), y0 = PHONG_CD_PLAT.y, hxp = pcd.hx;
      g.rotation.y = Math.PI;
      b(3.0, 0.06, 1.0, 0, y0 + 0.72, -1.5, woodM);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b(0.1, 0.72, 0.1, sx * 1.4, y0 + 0.36, -1.5 + sz * 0.4, woodM);
      b(0.4, 0.05, 0.3, -0.6, y0 + 0.78, -1.5, paperM);
      cyl(g, 0.08, 0.08, 0.04, 0.2, y0 + 0.77, -1.5, inkM, 12);
      cyl(g, 0.07, 0.07, 0.18, 1.0, y0 + 0.84, -1.5, c.goldM, 10);
      b(0.5, 0.45, 0.5, 0, y0 + 0.225, -2.4, woodM);
      const kx = -hxp + 0.6;
      b(0.5, 0.06, 1.8, kx, y0 + 0.5, 0, woodM);
      b(0.5, 0.06, 1.8, kx, y0 + 1.1, 0, woodM);
      for (const sz of [-0.85, 0.85]) b(0.5, 1.1, 0.06, kx, y0 + 0.55, sz, woodM);
      for (let i = 0; i < 6; i++) b(0.2, 0.05, 0.28, kx, y0 + 0.55 + (i % 2) * 0.6 + 0.02, -0.7 + i * 0.28, paperM);
      cyl(g, 0.06, 0.06, 0.12, kx, y0 + 1.19, 0.75, inkM, 10);
      // Hòm công đức: thùng gỗ cạnh bàn (phía phải bàn khi nhìn từ cửa), nắp có khe bỏ xu + khóa vàng
      b(0.6, 0.5, 0.4, 2.2, y0 + 0.25, -1.5, woodM);
      b(0.3, 0.02, 0.06, 2.2, y0 + 0.51, -1.5, inkM);
      b(0.12, 0.12, 0.04, 2.2, y0 + 0.3, -1.28, c.goldM);
      mergeStaticByMaterial(g); scene.add(g);
      for (const lx of [-1.5, -0.5, 0.5, 1.5]) for (const lz of [1.0, 2.0]) colliders.push({ x: PHONG_CD.x + lx, z: PHONG_CD.z + lz, r: 0.1 });
      // Collider hòm công đức: mesh ở local (2.2, -1.5) trong g xoay π → world (-44.2, 36.5) = PHONG_CD − local (khác diff gốc +2.2/−1.5 vì Phòng CD đã xoay 180° ở news 32)
      colliders.push({ x: PHONG_CD.x - 2.2, z: PHONG_CD.z + 1.5, r: 0.4 });
    }
  }

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
  // ---- honor board (donation top 10) next to the gate, west side of the path ----
  {
    const board = new THREE.Group();
    const postM = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.85 });
    for (const px of [-1.2, 1.2]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.0, 0.14), postM);
      p.position.set(px, 1.0, 0); p.castShadow = true; board.add(p);
    }
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 0.15), new THREE.MeshStandardMaterial({ color: 0x9a6a35, roughness: 0.8 }));
    panel.position.set(0, 1.15, 0); panel.castShadow = true; board.add(panel);
    const title = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: signTexture('BẢNG VINH DANH') }));
    title.position.set(0, 1.7, 0.09); board.add(title);
    const note = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshBasicMaterial({ map: signTexture('TOP 10 CÔNG ĐỨC') }));
    note.position.set(0, 0.55, 0.09); board.add(note);
    board.position.set(-7, 0, 42);
    scene.add(board);
    colliders.push({ x: -7, z: 42, r: 1.0 });
  }
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

  // ---- Hàng rào + cổng hai viện (Viện Khách Tăng, Viện Tổ) ----
  const buildVienFence = (v: { x0: number; x1: number; z0: number; z1: number; gateX: number }, signText: string) => {
    const fence = new THREE.Group();
    fence.name = `rao-vien-${signText}`;
    const gateHalf = 1.6;
    const postStep = 1.1;
    const posts: { x: number; z: number }[] = [];
    const fenceCols: { x: number; z: number; r: number; x2?: number; z2?: number }[] = [];
    const rails: { x: number; z: number; len: number; ang: number }[] = [];
    const addLine = (xa: number, za: number, xb: number, zb: number) => {
      const len = Math.hypot(xb - xa, zb - za);
      if (len < 0.01) return;
      const n = Math.max(1, Math.ceil(len / postStep));
      const ang = Math.atan2(zb - za, xb - xa);
      for (let i = 0; i <= n; i++) posts.push({ x: xa + ((xb - xa) * i) / n, z: za + ((zb - za) * i) / n });
      const wr = len / n / 2 + 0.002 - 0.4;
      for (let i = 0; i <= n; i++) {
        const wall: { x: number; z: number; r: number; x2?: number; z2?: number } = {
          x: xa + ((xb - xa) * i) / n, z: za + ((zb - za) * i) / n, r: wr,
        };
        if (i < n) { wall.x2 = xa + ((xb - xa) * (i + 1)) / n; wall.z2 = za + ((zb - za) * (i + 1)) / n; }
        fenceCols.push(wall);
      }
      rails.push({ x: (xa + xb) / 2, z: (za + zb) / 2, len, ang });
    };
    addLine(v.x0, v.z0, v.x1, v.z0);
    addLine(v.x0, v.z0, v.x0, v.z1);
    addLine(v.x1, v.z0, v.x1, v.z1);
    addLine(v.x0, v.z1, v.gateX - gateHalf, v.z1);
    addLine(v.gateX + gateHalf, v.z1, v.x1, v.z1);
    const postGeo = new THREE.BoxGeometry(0.16, 1.1, 0.16);
    const postIM = new THREE.InstancedMesh(postGeo, woodM, posts.length);
    postIM.castShadow = true;
    const mtx = new THREE.Matrix4();
    posts.forEach((p, i) => {
      mtx.makeTranslation(p.x, groundY(p.x, p.z) + 0.55, p.z);
      postIM.setMatrixAt(i, mtx);
    });
    postIM.instanceMatrix.needsUpdate = true;
    fence.add(postIM);
    const railGeo = new THREE.BoxGeometry(1, 0.07, 0.07);
    const railIM = new THREE.InstancedMesh(railGeo, woodM, rails.length * 2);
    railIM.castShadow = true;
    const qm = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    let ri = 0;
    for (const r of rails) {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -r.ang);
      sc.set(r.len, 1, 1);
      for (const h of [0.45, 0.9]) {
        ps.set(r.x, groundY(r.x, r.z) + h, r.z);
        qm.compose(ps, q, sc);
        railIM.setMatrixAt(ri++, qm);
      }
    }
    railIM.instanceMatrix.needsUpdate = true;
    fence.add(railIM);
    scene.add(fence);
    for (const w of fenceCols) colliders.push(w);
    const gp = new THREE.Group();
    for (const sx of [-gateHalf, gateHalf]) {
      const gpost = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.4), c.redM);
      gpost.position.set(sx, 1.1, 0); gpost.castShadow = true; gpost.userData.sealable = true; gp.add(gpost);
      const gbase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.6), stoneM);
      gbase.position.set(sx, 0.125, 0); gbase.userData.sealable = true; gp.add(gbase);
    }
    const gbeam = new THREE.Mesh(new THREE.BoxGeometry(gateHalf * 2 + 0.6, 0.28, 0.4), c.redM);
    gbeam.position.set(0, 2.1, 0); gbeam.castShadow = true; gbeam.userData.sealable = true; gp.add(gbeam);
    const gsign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), new THREE.MeshBasicMaterial({ map: signTexture(signText) }));
    gsign.position.set(0, 2.55, 0.22); gp.add(gsign);
    gp.position.set(v.gateX, 0, v.z1); scene.add(gp);
    sealArchitectureJoints(gp, { maxGap: 0.5 });
    zones.push({ x: v.gateX, z: v.z1, r: 5, id: signText === 'VIỆN TỔ' ? 'vienToGate' : 'vienKtGate' });
  };
  buildVienFence(VIEN_KT, 'VIỆN KHÁCH TĂNG');
  buildVienFence(VIEN_TO, 'VIỆN TỔ');

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
  pathRect(-58, -48, 58, -43);
  pathRect(-1.2, -51, 1.2, -41);
  pathRect(VIEN_KT.gateX - 1.2, VIEN_KT.z1, VIEN_KT.gateX + 1.2, -43);
  pathRect(VIEN_TO.gateX - 1.2, VIEN_TO.z1, VIEN_TO.gateX + 1.2, -43);
  pathRect(-60.3, -78, -57.7, 41);
  pathRect(57.7, -78, 60.3, 41);
  pathRect(-58, 39.8, 58, 42.2);
  pathRect(PHONG_CD.x - 1.2, 27, PHONG_CD.x + 1.2, 31.5);
  pathRect(19.8, -31, 22.2, -19);
  pathRect(19.8, -32.2, 25.5, -29.8);
  pathRect(48.8, -31, 50.2, -23.4);
  pathRect(33, -24.8, 50.2, -23.4);
  pathRect(BAO_THAP.x - 1.2, BAO_THAP.z + BAO_THAP_PLAT.step2.z1, BAO_THAP.x + 1.2, ZEN.z - 1);
  pathRect(THIEN_DUONG.x + THIEN_DUONG_PLAT.hx, THIEN_DUONG.z - 1.2, -SIDE_X - 1.2, THIEN_DUONG.z + 1.2);
  pathRect(28, 8.8, 35, 11.2);
  pathRect(-43.2, 39.5, -40.8, 42.2);
  pathRect(-48, -59.2, -27, -56.8);
  pathRect(-42.2, -67, -39.8, -58);
  pathRect(27, -59.2, 50, -56.8);
  pathRect(34.8, -63.75, 37.2, -58);
  pathRect(VIEN_KT.gateX - 1.2, -58, VIEN_KT.gateX + 1.2, VIEN_KT.z1);
  pathRect(VIEN_TO.gateX - 1.2, -58, VIEN_TO.gateX + 1.2, VIEN_TO.z1);
  const gardenCtx = { scene, colliders, lamb, stoneM, woodM, glowSpr, addZone: (x: number, z: number, r: number, id: string) => { zones.push({ x, z, r, id }); } };
  buildZenGarden(gardenCtx);
  buildFlowerBeds(gardenCtx);
  pathRect(BRIDGE.x + 1.4, REST.z - 1.2, REST.x - 2, REST.z + 1.2);
  buildRestArea(gardenCtx);

  const psGroup = new THREE.Group(); psGroup.name = 'vuon-phong-sinh'; scene.add(psGroup);
  const psGrass = new THREE.Mesh(new THREE.PlaneGeometry(PS.w, PS.d), lamb(0x5f9a4a, { roughness: 1 }));
  psGrass.rotation.x = -Math.PI / 2; psGrass.position.set(PS.x, 0.02, PS.z); psGrass.receiveShadow = true; psGroup.add(psGrass);
  const psBed = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: 0x1d4f66, roughness: 1 }));
  psBed.scale.set(PS_POND.a, PS_POND.b, 1); psBed.rotation.x = -Math.PI / 2; psBed.position.set(PS_POND.x, 0.03, PS_POND.z); psGroup.add(psBed);
  const psWaterMat = new THREE.MeshStandardMaterial({ color: 0x46a8c4, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.82 });
  const psWater = new THREE.Mesh(new THREE.CircleGeometry(1, 48), psWaterMat);
  psWater.scale.set(PS_POND.a, PS_POND.b, 1); psWater.rotation.x = -Math.PI / 2; psWater.position.set(PS_POND.x, 0.1, PS_POND.z); psGroup.add(psWater);
  // ---- cá koi ao Phóng Sinh: 6 con, tái dùng createKoi/swimKoi (chỉ để nhìn) ----
  const psKoi: Koi[] = [];
  for (let i = 0; i < 6; i++) {
    const k = createKoi(KOI_VARIETIES[i % 4], 0.85 + (i % 3) * 0.12);
    k.a = i * 1.1;
    k.rx = PS_POND.a * (0.35 + (i % 3) * 0.15);
    k.rz = PS_POND.b * (0.35 + (i % 3) * 0.15);
    k.s = (i % 2 ? 1 : -1) * (0.25 + (i % 3) * 0.1);
    k.phase = (i / 6) * Math.PI * 2;
    k.root.position.set(PS_POND.x + Math.cos(k.a) * k.rx, 0.16, PS_POND.z + Math.sin(k.a) * k.rz);
    psGroup.add(k.root);
    psKoi.push(k);
  }
  const psRimStone = lamb(0x8b7a64, { map: stoneTexture([140, 128, 110], [10, 1], 3) });
  const psRimPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; psRimPts.push(new THREE.Vector3(PS_POND.x + Math.cos(a) * (PS_POND.a + 0.3), 0, PS_POND.z + Math.sin(a) * (PS_POND.b + 0.3))); }
  const psRim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(psRimPts, true), 96, 0.36, 8, true), psRimStone);
  psRim.scale.y = 0.8; psRim.position.y = 0.16; psRim.castShadow = psRim.receiveShadow = true; psGroup.add(psRim);
  const psRocks = lamb(0x6e675c, { flatShading: true });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3, rr = 0.4 + ((i * 37) % 10) / 18;
    const rx = PS_POND.x + Math.cos(a) * (PS_POND.a + 0.9), rz = PS_POND.z + Math.sin(a) * (PS_POND.b + 0.9);
    if (rx < PS_PIER.x1 + 1 && Math.abs(rz - PS_PIER.z) < PS_PIER.hw + rr + 0.6) continue;
    if (rz > PS.z + PS.d / 2 - 0.5 || rz < PS.z - PS.d / 2 + 0.5) continue;
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rr, 0), psRocks);
    r.position.set(rx, rr * 0.3, rz); r.scale.y = 0.65; r.rotation.set(i, i * 2, 0); r.castShadow = true; psGroup.add(r);
  }
  {
    const hedgeM = lamb(0x2f7a40, { flatShading: true });
    const hx0 = PS.x - PS.w / 2, hx1 = PS.x + PS.w / 2, hz0 = PS.z - PS.d / 2, hz1 = PS.z + PS.d / 2;
    const hedgePts: { x: number; z: number }[] = [];
    for (let x = hx0 + 0.6; x <= hx1 - 0.5; x += 1.2) {
      hedgePts.push({ x, z: hz0 + 0.4 });
      if (!(x >= 47 && x <= 51.5)) hedgePts.push({ x, z: hz1 - 0.4 });
    }
    for (let z = hz0 + 1.8; z <= hz1 - 1.8; z += 1.2) {
      hedgePts.push({ x: hx1 - 0.4, z });
      if (Math.abs(z - PS.z) > PS_PIER.hw + 1.2) hedgePts.push({ x: hx0 + 0.4, z });
    }
    const hedgeIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.62, 1), hedgeM, hedgePts.length);
    hedgeIM.castShadow = true;
    const hm = new THREE.Matrix4(), hq = new THREE.Quaternion(), hs = new THREE.Vector3(1, 1.15, 1), hp = new THREE.Vector3();
    hedgePts.forEach((p, i) => { hp.set(p.x, 0.5, p.z); hm.compose(hp, hq, hs); hedgeIM.setMatrixAt(i, hm); });
    hedgeIM.instanceMatrix.needsUpdate = true;
    psGroup.add(hedgeIM);
    const psTrunkM = lamb(0x6b4a2b), psCanopyM = lamb(0x3f8a3e, { flatShading: true }), psBlossomM = lamb(0xf4a3bc, { flatShading: true, emissive: 0x2b0f18 });
    const psTrees: [number, number, number][] = [[hx0 + 3.5, hz0 + 3, 1.1], [hx1 - 3.5, hz0 + 3, 1.2], [hx1 - 3.5, hz1 - 3, 1.0], [hx0 + 4.5, hz1 - 3, 0.95]];
    psTrees.forEach(([x, z, s], i) => {
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 2.2, 8), psTrunkM); trunk.position.y = 1.1; trunk.castShadow = true; t.add(trunk);
      for (let k = 0; k < 3; k++) {
        const cn = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), i === 1 ? psBlossomM : psCanopyM);
        cn.scale.setScalar(1.5 - k * 0.22); cn.position.set((k - 1) * 0.5 * (k % 2 ? 1 : -1), 2.9 + k * 0.7, k * 0.2 - 0.2); cn.castShadow = true; t.add(cn);
      }
      t.position.set(x, 0, z); t.scale.setScalar(s); scene.add(t);
      colliders.push({ x, z, r: 0.5 * s });
    });
  }
  {
    const P = PS_PIER, ppierW = lamb(0x8a5a32, { map: woodTexture([4, 1]) }), ppierD = lamb(0x4a2e18, { roughness: 0.85 });
    const flatX = P.x0 + P.ramp;
    const prm = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(P.ramp, P.y), 0.16, P.hw * 2), ppierW);
    const pang = Math.atan2(P.y, P.ramp);
    prm.position.set(P.x0 + P.ramp / 2, P.y / 2 - 0.08 / Math.cos(pang), P.z); prm.rotation.z = pang; prm.castShadow = prm.receiveShadow = true; psGroup.add(prm);
    const pfl = new THREE.Mesh(new THREE.BoxGeometry(P.x1 - flatX, 0.16, P.hw * 2), ppierW);
    pfl.position.set((flatX + P.x1) / 2, P.y - 0.08, P.z); pfl.castShadow = pfl.receiveShadow = true; psGroup.add(pfl);
    for (let px = P.x0 + 0.1; px <= P.x1; px += 1.5) for (const s of [-1, 1]) {
      const top = px < flatX ? P.y * Math.max(0.2, (px - P.x0) / P.ramp) - 0.16 : P.y - 0.16;
      const bottom = inPsPond(px, P.z + s * (P.hw - 0.05)) ? 0.03 : 0;
      if (top <= bottom + 0.05) continue;
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, top - bottom, 8), ppierD);
      pile.position.set(px, (top + bottom) / 2, P.z + s * (P.hw - 0.05)); pile.castShadow = true; psGroup.add(pile);
    }
    const railM2 = c.redM;
    const prY = P.y + 0.55;
    for (const s of [-1, 1]) {
      const rl = new THREE.Mesh(new THREE.BoxGeometry(P.x1 - flatX, 0.08, 0.08), railM2);
      rl.position.set((flatX + P.x1) / 2, prY, P.z + s * (P.hw - 0.05)); rl.castShadow = true; psGroup.add(rl);
      for (let px = flatX + 0.3; px <= P.x1 - 0.1; px += 1.2) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 6), railM2);
        post.position.set(px, P.y + 0.3, P.z + s * (P.hw - 0.05)); psGroup.add(post);
      }
      for (let px = flatX; px <= P.x1; px += 0.8) colliders.push({ x: px, z: P.z + s * P.hw, r: 0.2 });
    }
  }
  zones.push({ x: PS.x, z: PS.z, r: 13, id: 'vuonPhongSinh' });
  const psSeal = sealArchitectureJoints(psGroup, { maxGap: 0.5 });
  if (import.meta.env.DEV) console.warn(`gapdump vuonPhongSinh: filled=${psSeal.filled} remaining=${psSeal.remaining.length}`);

  type StallKind = 'com' | 'tra' | 'chim' | 'pho' | 'ca';
  const buildStall = (x: number, z: number, sign: string, kind: StallKind) => {
    const g = new THREE.Group(); g.name = `sap-${sign}`;
    const wood = lamb(0x6b4426), roofM = lamb(0x8a3a24, { roughness: 0.8 }), cloth = lamb(0xd9c9a3, { roughness: 0.95 });
    const hw = 1.8, hd = 1.1;
    for (const [px, pz] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]] as [number, number][]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.14), wood); p.position.set(px, 1.3, pz); p.castShadow = true; g.add(p);
      colliders.push({ x: x + px, z: z + pz, r: 0.35 });
    }
    const counter = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.9, 0.7), wood);
    counter.position.set(0, 0.45, hd - 0.1); counter.castShadow = counter.receiveShadow = true; g.add(counter);
    const top = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 0.2, 0.08, 0.85), cloth); top.position.set(0, 0.92, hd - 0.1); g.add(top);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 0.8, 0.12, hd * 2 + 0.8), roofM);
    roof.position.set(0, 2.66, 0); roof.rotation.x = 0.12; roof.castShadow = true; g.add(roof);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.6), new THREE.MeshBasicMaterial({ map: signTexture(sign) }));
    sg.position.set(0, 2.2, hd + 0.5); sg.rotation.x = 0.12; g.add(sg);
    const py = 0.96, pz = hd - 0.1;
    if (kind === 'com' || kind === 'pho') {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.34, 14), lamb(0x3a3a3a, { metalness: 0.5 }));
      pot.position.set(-0.9, py + 0.17, pz); pot.castShadow = true; g.add(pot);
      for (let i = 0; i < 2; i++) {
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.2 + i * 0.06, 12), lamb(0xf4f0e6));
        stack.position.set(0.3 + i * 0.5, py + 0.1, pz); g.add(stack);
      }
    } else if (kind === 'tra') {
      const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), lamb(0x9a6a2a, { metalness: 0.4 }));
      kettle.scale.set(1, 0.9, 1); kettle.position.set(-0.7, py + 0.2, pz); kettle.castShadow = true; g.add(kettle);
      for (let i = 0; i < 4; i++) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.12, 10), lamb(0xeeeeee));
        cup.position.set(0.1 + i * 0.3, py + 0.06, pz); g.add(cup);
      }
    } else if (kind === 'chim') {
      const cageM = lamb(0x8a6a3a), birdM = lamb(0xe8c84a);
      for (let i = 0; i < 3; i++) {
        const cg = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 10, 1, true), cageM); body.position.y = 0.21; cg.add(body);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.16, 10), cageM); cap.position.y = 0.5; cg.add(cap);
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.42, 0.015), cageM); bar.position.set(Math.cos(a) * 0.22, 0.21, Math.sin(a) * 0.22); cg.add(bar);
        }
        const bird = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), birdM); bird.position.y = 0.12; cg.add(bird);
        cg.position.set(-1.0 + i * 0.95, py, pz); g.add(cg);
      }
    } else {
      const tank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xaad8ee, transparent: true, opacity: 0.4, roughness: 0.1 }));
      tank.position.set(-0.5, py + 0.25, pz); g.add(tank);
      const wtr = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.36, 0.44), new THREE.MeshStandardMaterial({ color: 0x46a8c4, transparent: true, opacity: 0.7 }));
      wtr.position.set(-0.5, py + 0.2, pz); g.add(wtr);
      const fish = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), lamb(0xff7a2a)); fish.scale.set(1.6, 1, 1); fish.position.set(-0.4, py + 0.22, pz); g.add(fish);
    }
    g.position.set(x, 0, z); g.rotation.y = Math.PI; scene.add(g);
    for (let lx = -hw; lx <= hw + 0.01; lx += 1.0) colliders.push({ x: x + lx, z: z - hd - 0.6, r: 0.5 });
  };
  const STALLS: [number, string, StallKind][] = [
    [-42, 'CƠM CHAY', 'com'], [-26, 'TRÀ ĐÁ', 'tra'], [-10, 'BÁN CHIM PHÓNG SINH', 'chim'],
    [10, 'PHỞ CHAY', 'pho'], [26, 'TRÀ ĐÁ', 'tra'], [42, 'BÁN CÁ PHÓNG SINH', 'ca'],
  ];
  for (const [sx, name, kind] of STALLS) buildStall(sx, 54.5, name, kind);
  pathRect(-62, 45, 62, 58);

  // ---- animation ----
  let ring = 0, drumHit = 0;
  const ringBell = () => { ring = 1; };
  const ringDrum = () => { drumHit = 1; };
  const halos = [...hall.halos, ...tamThe.halos, bigB.getObjectByName('halo')!, quanAm.getObjectByName('halo')!].filter(Boolean);
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
    // cá ao Phóng Sinh: bơi bằng tọa độ tuyệt đối (psGroup ở gốc thế giới)
    psKoi.forEach((kk) => {
      kk.a += dt * kk.s;
      const x = PS_POND.x + Math.cos(kk.a) * kk.rx, z = PS_POND.z + Math.sin(kk.a) * kk.rz;
      kk.root.position.set(x, 0.16 + Math.sin(t * 2 + kk.a * 3) * 0.012, z);
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
