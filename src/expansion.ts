/**
 * Khu mở rộng 24/7 — dựng hình cho bản mặt bằng đã chốt (public/quy-hoach-chua-24-7.svg).
 *
 * Toạ độ lấy từ shared/campus.ts (LOTUS, FARM, BAMBOO, RIVER, DUOC_SU, NGOC, TINH_THAT, CAVE,
 * FLOWER_HILL). Cao độ đi bộ lấy từ expansionGroundY() — cùng nguồn với groundYBase() trong
 * layout.ts — nên nền/ghế/bậc luôn khớp mặt đất mà người chơi thực sự đứng.
 *
 * Hình khối tĩnh gộp theo (khu, vật liệu): mỗi hạng mục tốn vài draw call thay vì hàng trăm.
 * Biển chữ Việt giữ material riêng (không gộp) để còn đổi nội dung. Cây gộp vào cùng mesh của
 * khu nên không phát sinh hàng trăm draw call.
 *
 * Không sửa cơ chế game / server: module chỉ trả { seats, zones } và đẩy collider vào mảng dùng
 * chung theo đúng định dạng vòng tròn { x, z, r }.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  BAMBOO, CAVE, DUOC_SU, FARM, FARM_POND, FLOWER_HILL, LOTUS, LOTUS_PAVILION, NGOC, NGOC_HALL, NGOC_TERRACE, NORTH_WALK_Z, RIVER, TINH_THAT,
  expansionGroundY, ngocHillGroundY, ngocStepProfile,
} from '../shared/campus';
import { buildBuddha } from './statues';
import { fitModel, loadModel } from './models';
import { grassTexture, glowTexture, signTexture, stoneTexture, woodTexture } from './textures';
import { pavingMaterial } from './compound';
import { nearWalkway } from './layout';
import { duocSuRoof, duocSuStyle } from './duoc-su-style';
import { buildRiverWaterfall } from './river-waterfall';
import type { Seat, TempleCtx, Zone } from './temple';

const MAT_KEYS = [
  'stone', 'paving', 'stoneDark', 'granite', 'graniteDark', 'tile', 'red', 'gold', 'wall', 'wood', 'darkWood',
  'trunk', 'pine', 'bamboo', 'bambooLeaf', 'leaf', 'veg', 'soil', 'flowerA', 'flowerB', 'flowerC',
  'pad', 'lamp', 'rock', 'dark', 'dsStone', 'dsTimber', 'dsPlaster', 'dsGold', 'dsDarkwood',
] as const;
type MatKey = (typeof MAT_KEYS)[number];

/** Vật liệu không đổ bóng (lá sen, ngọn rau, lòng hang). */
const NO_SHADOW = new Set<MatKey>(['pad', 'dark', 'veg']);

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** Khoảng cách từ điểm tới đoạn thẳng: né đường đi của NPC / người chơi. */
const distToSeg = (px: number, pz: number, ax: number, az: number, bx: number, bz: number) => {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
};

export function buildExpansion(c: TempleCtx): { seats: Seat[]; zones: Zone[]; update: (t: number) => void } {
  const seats: Seat[] = [];
  const zones: Zone[] = [];
  const colliders = c.colliders;
  const collidersBefore = colliders.length;

  const root = new THREE.Group();
  root.name = 'expansion';
  const placeTree = (name: string, x: number, z: number, height: number) => {
    const fallback = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, height * 0.45, 6), c.lamb(0x5b4836));
    trunk.position.y = height * 0.225; fallback.add(trunk);
    for (let i = 0; i < 3; i++) {
      const crown = new THREE.Mesh(name === 'pine-natural'
        ? new THREE.ConeGeometry(1.8 - i * 0.35, height * (0.5 - i * 0.08), 7)
        : new THREE.IcosahedronGeometry(1.65, 1), c.lamb(name === 'pine-natural' ? 0x365946 : 0x426d3d));
      crown.position.set(name === 'pine-natural' ? 0 : (i - 1) * 0.9, height * (0.48 + i * 0.18), 0); fallback.add(crown);
    }
    fallback.position.set(x, expansionGroundY(x, z), z);
    root.add(fallback);
    void loadModel(name).then(model => {
      if (!model) return;
      const tree = fitModel(model.clone(true), height);
      tree.position.set(x, expansionGroundY(x, z), z);
      root.add(tree);
      root.remove(fallback);
      fallback.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); } });
    }).catch(() => {});
  };

  // ------------------------------------------------------------------ vật liệu
  const stoneM = c.lamb(0xcfc4ae, { map: stoneTexture([200, 192, 174], [3, 1]) });
  const stoneDarkM = c.lamb(0x9c9484, { map: stoneTexture([150, 144, 132], [2, 2]) });
  const graniteM = c.lamb(0xa5a29a, { map: stoneTexture([158, 156, 148], [2, 2]), roughness: 0.86 });
  const graniteDarkM = c.lamb(0x76736c, { map: stoneTexture([108, 106, 100], [2, 1]), roughness: 0.9 });
  const soilM = c.lamb(0x6b5233, { roughness: 1 });
  const vegM = c.lamb(0x5aa04a, { flatShading: true });
  const padM = c.lamb(0x3f7a4a, { flatShading: true, side: THREE.DoubleSide });
  const flowerAM = c.lamb(0xe4698c, { emissive: 0x1a0a10 });
  const flowerBM = c.lamb(0xf2d05a, { emissive: 0x1a1408 });
  const flowerCM = c.lamb(0xe8f2f8, { emissive: 0x101418 });
  const trunkM = c.lamb(0x6b4a2b);
  const pineM = c.lamb(0x2f6a45, { flatShading: true });
  const bambooStemM = c.lamb(0x9cb84e, { flatShading: true });
  const bambooLeafM = c.lamb(0x6f9c3f, { flatShading: true });
  const leafM = c.lamb(0x4e9c45, { flatShading: true });
  const woodM = c.lamb(0xffffff, { map: woodTexture([5, 3]) });
  const darkWoodM = c.lamb(0x5a3a22);
  const lampM = c.lamb(0xffd27a, { emissive: 0xff9a2a, emissiveIntensity: 0.9, roughness: 0.6 });
  const rockM = c.lamb(0x8d8a80, { flatShading: true });
  const darkM = c.lamb(0x1c1a18, { roughness: 1 });
  const waterM = c.lamb(0x2f6f86, { transparent: true, opacity: 0.86, roughness: 0.28, metalness: 0.05 });
  const grassM = c.lamb(0x6d8548, { map: grassTexture([24, 12]) });

  const materials: Record<MatKey, THREE.Material> = {
    stone: stoneM, paving: pavingMaterial(), stoneDark: stoneDarkM, granite: graniteM, graniteDark: graniteDarkM,
    tile: c.tileM, red: c.redM, gold: c.goldM, wall: c.wallM, wood: woodM, darkWood: darkWoodM,
    trunk: trunkM, pine: pineM, bamboo: bambooStemM, bambooLeaf: bambooLeafM, leaf: leafM,
    veg: vegM, soil: soilM, flowerA: flowerAM, flowerB: flowerBM, flowerC: flowerCM,
    pad: padM, lamp: lampM, rock: rockM, dark: darkM,
    dsStone: duocSuStyle.stone, dsTimber: duocSuStyle.timber, dsPlaster: duocSuStyle.plaster,
    dsGold: duocSuStyle.gold, dsDarkwood: duocSuStyle.darkwood,
  };
  const mergeStatue = (statue: THREE.Group) => {
    statue.updateMatrixWorld(true);
    const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
    statue.traverse(o => {
      if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
      const geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
      const list = parts.get(o.material) ?? [];
      list.push(geometry); parts.set(o.material, list);
    });
    const merged = new THREE.Group();
    for (const [material, geometries] of parts) {
      const geometry = mergeGeometries(geometries);
      geometries.forEach(g => g.dispose());
      if (geometry) { const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true; merged.add(mesh); }
    }
    // Source geometries are shared by other statues and must not be disposed here.
    return merged;
  };

  // ------------------------------------------------------------------ gộp hình khối
  let sinks = new Map<MatKey, THREE.BufferGeometry[]>();
  const m4 = new THREE.Matrix4();
  const mq = new THREE.Quaternion();
  const me = new THREE.Euler();
  const mPos = new THREE.Vector3();
  const ONE = new THREE.Vector3(1, 1, 1);

  const put = (key: MatKey, g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) => {
    if (key === 'paving') {
      const pos = g.getAttribute('position'), normal = g.getAttribute('normal'), uv = g.getAttribute('uv');
      for (let i = 0; i < pos.count; i++) if (normal.getY(i) > 0.5) {
        const px = pos.getX(i), pz = pos.getZ(i);
        uv.setXY(i, (x + Math.cos(ry) * px + Math.sin(ry) * pz) / 12,
          -(z - Math.sin(ry) * px + Math.cos(ry) * pz) / 12);
      }
    }
    me.set(0, ry, 0);
    mq.setFromEuler(me);
    mPos.set(x, y, z);
    m4.compose(mPos, mq, ONE);
    g.applyMatrix4(m4);
    const arr = sinks.get(key);
    if (arr) arr.push(g); else sinks.set(key, [g]);
  };
  const addBox = (key: MatKey, w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) =>
    put(key, new THREE.BoxGeometry(w, h, d), x, y, z, ry);
  const addCyl = (key: MatKey, rt: number, rb: number, h: number, seg: number, x: number, y: number, z: number) =>
    put(key, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z);
  const addCone = (key: MatKey, r: number, h: number, seg: number, x: number, y: number, z: number) =>
    put(key, new THREE.ConeGeometry(r, h, seg), x, y, z);
  const addSphere = (key: MatKey, r: number, x: number, y: number, z: number) =>
    put(key, new THREE.SphereGeometry(r, 8, 6), x, y, z);
  const addDisc = (key: MatKey, r: number, seg: number, x: number, y: number, z: number, ry = 0) => {
    const g = new THREE.CircleGeometry(r, seg);
    g.rotateX(-Math.PI / 2);
    put(key, g, x, y, z, ry);
  };
  const addRoof = (w: number, d: number, h: number, lift: number, x: number, yBase: number, z: number) =>
    put('tile', c.roofGeometry(w, d, h, lift), x, yBase + h / 2, z);

  /** Gộp mọi hình khối đang chờ theo vật liệu → một group `expansion-<area>`. */
  const flush = (area: string, stairs = false) => {
    const g = new THREE.Group();
    g.name = `expansion-${area}`;
    let meshes = 0;
    for (const [key, geos] of sinks) {
      if (!geos.length) continue;
      const merged = mergeGeometries(geos, false);
      for (const gg of geos) gg.dispose();
      if (!merged) continue;
      const isStairs = stairs && key === 'granite';
      const mesh = new THREE.Mesh(merged, materials[key]);
      mesh.name = isStairs ? 'ngoc-stairs' : `${area}-${key}`;
      if (isStairs) mesh.userData.steps = NGOC.steps;
      mesh.castShadow = !NO_SHADOW.has(key);
      mesh.receiveShadow = true;
      g.add(mesh);
      meshes++;
    }
    sinks = new Map();
    root.add(g);
    return { group: g, meshes };
  };

  const replaceArchitecture = (fallback: THREE.Group, name: string, x: number, z: number) => {
    fallback.userData.asset = name;
    fallback.userData.source = 'procedural-fallback';
    void loadModel(name).then(model => {
      if (!model) return;
      const instance = model.clone(true);
      instance.name = name;
      instance.position.set(x, 0, z);
      instance.userData.source = 'blender';
      root.add(instance);
      root.remove(fallback);
      fallback.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    }).catch(error => console.warn(`Architecture ${name}: keeping fallback`, error));
  };

  const waterEllipse = (x: number, z: number, a: number, b: number) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 48), waterM);
    m.rotation.x = -Math.PI / 2;
    m.scale.set(a, b, 1);
    m.position.set(x, 0.06, z);
    m.name = 'expansion-water';
    return m;
  };
  const waterRect = (x0: number, x1: number, z0: number, z1: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.12, z1 - z0), waterM);
    m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    m.name = 'expansion-water';
    return m;
  };

  // ------------------------------------------------------------------ biển chữ Việt
  const signs: THREE.Mesh[] = [];
  const addSign = (text: string, w: number, h: number, x: number, y: number, z: number, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: signTexture(text) }));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.name = 'expansion-sign';
    signs.push(m);
    return m;
  };

  // ------------------------------------------------------------------ cao độ + collider
  /** Cao độ đi bộ: khớp groundYBase() (sân Dược Sư, tịnh thất, mặt cầu đá). */
  const walkY = (x: number, z: number) => {
    let y = expansionGroundY(x, z);
    if (Math.abs(x - DUOC_SU.x) <= DUOC_SU.hx && Math.abs(z - DUOC_SU.z) <= DUOC_SU.hz) y = Math.max(y, DUOC_SU.y);
    for (const h of TINH_THAT) if (Math.abs(x - h.x) <= 1.6 && Math.abs(z - h.z) <= 1.25) y = Math.max(y, 0.16);
    if (x >= -90 && x <= -66 && Math.abs(z - 2) <= 1.1) y = Math.max(y, 0.28);
    if (x >= 60.5 && x <= 69.5 && RIVER.bridges.some((bz) => Math.abs(z - bz) <= RIVER.bridgeHalf)) y = Math.max(y, 0.28);
    return y;
  };
  const solid = (x: number, z: number, r: number) => { colliders.push({ x, z, r }); };
  /** Tường đặc: chuỗi vòng tròn chồng nhau cùng bán kính, không hở khe. */
  const wallLine = (x0: number, z0: number, x1: number, z1: number, r = 0.35, step = 0.55) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.ceil(len / step));
    for (let i = 0; i <= n; i++) colliders.push({ x: x0 + (x1 - x0) * (i / n), z: z0 + (z1 - z0) * (i / n), r });
  };
  /** Ghế ngồi: y do main lấy từ world.groundY, nên đệm/ghế luôn đặt sát đất (như bồ đoàn). */
  const addSeat = (x: number, z: number, ry: number, rest = false) => seats.push({ x, z, ry, rest });
  /** Đệm/ghế thấp sát đất: người ngồi ở cao độ groundY như bồ đoàn trong chùa. */
  const seatPad = (x: number, z: number, ry: number, rest = true, w = 1.1, d = 0.9, key: MatKey = 'stone') => {
    addBox(key, w, 0.14, d, x, walkY(x, z) + 0.07, z, ry);
    addSeat(x, z, ry, rest);
  };
  /** Sprite phát sáng: đẩy vào c.glowSprites để world.update() nhấp nháy cùng đèn cũ. */
  const glow = (x: number, y: number, z: number, s: number, color = 0xffb040, op = 0.45) => {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    spr.scale.setScalar(s);
    spr.position.set(x, y, z);
    c.glowSprites.push(spr);
  };

  /** Gian mở: cột + xà + (tuỳ chọn) tường hậu/hai bên + mái ngói + chóp vàng. */
  const openHall = (
    x: number, z: number, base: number, hw: number, hd: number, colH: number,
    roofW: number, roofD: number, roofH: number, walls: 0 | 1 | 2,
    key: MatKey = 'red', skipCorners: [number, number][] = [],
  ) => {
    const skip = (sx: number, sz: number) => skipCorners.some(([a, b]) => a === sx && b === sz);
    for (const sx of [-hw, hw]) {
      for (const sz of [-hd, hd]) {
        if (skip(sx, sz)) continue;
        addBox('stone', 0.5, 0.18, 0.5, x + sx, base + 0.09, z + sz);
        addCyl(key, 0.16, 0.19, colH, 10, x + sx, base + 0.18 + colH / 2, z + sz);
        solid(x + sx, z + sz, 0.26);
      }
    }
    const beamY = base + 0.18 + colH;
    addBox('red', hw * 2 + 0.5, 0.22, 0.24, x, beamY, z - hd);
    addBox('red', hw * 2 + 0.5, 0.22, 0.24, x, beamY, z + hd);
    addBox('red', 0.24, 0.22, hd * 2 + 0.5, x - hw, beamY, z);
    addBox('red', 0.24, 0.22, hd * 2 + 0.5, x + hw, beamY, z);
    if (walls >= 1) {
      addBox('wall', hw * 2 - 0.16, colH, 0.2, x, base + 0.18 + colH / 2, z - hd);
      wallLine(x - hw + 0.25, z - hd, x + hw - 0.25, z - hd, 0.26, 0.5);
    }
    if (walls >= 2) {
      for (const s of [-1, 1]) {
        addBox('wall', 0.2, colH, hd * 2 - 0.16, x + s * hw, base + 0.18 + colH / 2, z);
        wallLine(x + s * hw, z - hd + 0.25, x + s * hw, z + hd - 0.25, 0.26, 0.5);
      }
    }
    const roofY = beamY + 0.2;
    addRoof(roofW, roofD, roofH, 0.5, x, roofY - 0.1, z);
    addCone('gold', 0.14, 0.8, 8, x, roofY + roofH - 0.2, z);
    return roofY + roofH - 0.1;
  };

  // =====================================================================================
  // 1. Hồ sen Tây, cầu đá z = 2, đình ngắm sen
  // =====================================================================================
  {
    const { x, z, a, b } = LOTUS;
    // vành đá quanh hồ
    for (let i = 0; i < 58; i++) {
      const t = (i / 58) * Math.PI * 2;
      addBox('stone', 0.95, 0.18, 0.62, x + Math.cos(t) * (a + 0.45), 0.09, z + Math.sin(t) * (b + 0.45), -t);
    }
    // lá sen + hoa
    const rand = rng(9174);
    for (let i = 0; i < 130; i++) {
      const ang = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * 0.92;
      const px = x + Math.cos(ang) * a * rr, pz = z + Math.sin(ang) * b * rr;
      if (Math.abs(pz - 2) < 1.7 && px > -90 && px < -66) continue; // chừa lối cầu
      addDisc('pad', 0.34 + rand() * 0.26, 7, px, 0.135, pz, rand() * 6);
      if (i % 4 === 0) addSphere('flowerA', 0.13, px, 0.3, pz);
    }
    flush('lotus-pond');
  }
  {
    // Cầu đá ngang hồ: x -90..-66 tại z = 2, mặt cầu y = 0.28 (khớp groundYBase)
    const zc = 2, y = 0.28;
    addBox('paving', 24, 0.24, 2.8, -78, y - 0.12, zc);
    for (const s of [-1, 1]) {
      addBox('stone', 24, 0.42, 0.2, -78, y + 0.21, zc + s * 1.4);
      for (let px = -88; px <= -68; px += 2) addBox('stoneDark', 0.26, 0.62, 0.26, px, y + 0.28, zc + s * 1.4);
      // lan can mảnh, chạy dọc cầu, chừa hai đầu cầu cho lối vào
      wallLine(-88, zc + s * 1.4, -68, zc + s * 1.4, 0.2, 0.6);
    }
    // trụ đá đỡ cầu (nằm dưới mặt cầu, không tạo collider trên lối đi)
    for (const px of [-84, -78, -72]) addBox('stoneDark', 0.9, 0.9, 2.4, px, -0.15, zc);
    flush('lotus-bridge');
  }
  {
    // Đình ngắm sen: sàn lát sát đất (người chơi đứng ở y = 0), cửa vào góc Tây-Nam
    const px = LOTUS_PAVILION.x, pz = LOTUS_PAVILION.z;
    addBox('stone', 5.2, 0.1, 5.2, px, 0.02, pz);
    addBox('wood', 4.6, 0.06, 4.6, px, 0.1, pz);
    const base = 0.13;
    // lan can ba phía: Bắc, Đông, và đoạn Tây-Bắc; chừa cổng Tây-Nam giáp cầu
    for (const [w, d, ox, oz] of [[4.6, 0.14, 0, -2.3], [0.14, 4.6, 2.3, 0]] as const) {
      addBox('red', w, 0.5, d, px + ox, base + 0.35, pz + oz);
      wallLine(px + ox - w / 2, pz + oz - d / 2, px + ox + w / 2, pz + oz + d / 2, 0.2, 0.55);
    }
    const top = openHall(px, pz, base, 1.9, 1.9, 2.5, 6.4, 6.0, 1.6, 0, 'red', [[-1.9, 1.9]]);
    const { group: pavilionShell } = flush('dinhSen-architecture');
    replaceArchitecture(pavilionShell, 'dinh-sen-blender', px, pz);
    addSign('ĐÌNH SEN', 1.7, 0.44, px, top - 1.0, pz + 2.02);
    seatPad(px, pz + 1.4, Math.PI, true, 1.0, 0.8, 'darkWood');
    seatPad(px + 1.1, pz, -Math.PI / 2, true, 0.9, 0.8, 'darkWood');
    zones.push({ x: px, z: pz, r: 5, id: 'dinhSen' });
  }
  addSign('HỒ SEN', 2.4, 0.6, LOTUS.x, 0.95, LOTUS.z + LOTUS.b + 1.4);
  {
    const { group } = flush('lotus');
    group.add(waterEllipse(LOTUS.x, LOTUS.z, LOTUS.a, LOTUS.b));
    zones.push({ x: LOTUS.x, z: LOTUS.z, r: 13, id: 'lotus' });
  }

  // =====================================================================================
  // 2. Vườn rau + ao sen nhỏ + kho nông cụ
  // =====================================================================================
  {
    const fx0 = -88, fx1 = -64, fz0 = -55, fz1 = -30;
    // hàng rào thấp; cổng phía Đông tại z -44..-40 (khớp lối vào (-76,-42) / (-59,-42))
    const rail = (x0: number, z0: number, x1: number, z1: number) => {
      addBox('stoneDark', Math.max(Math.abs(x1 - x0), 0.16), 0.34, Math.max(Math.abs(z1 - z0), 0.16),
        (x0 + x1) / 2, 0.17, (z0 + z1) / 2);
      wallLine(x0, z0, x1, z1, 0.38, 0.9);
    };
    rail(fx0, fz0, fx1, fz0);
    rail(fx0, fz1, fx1, fz1);
    rail(fx0, fz0, fx0, fz1);
    rail(fx1, fz0, fx1, -44);
    rail(fx1, -40, fx1, fz1);
    for (let px = fx0; px <= fx1; px += 4) for (const pz of [fz0, fz1]) addBox('darkWood', 0.18, 0.95, 0.18, px, 0.47, pz);
    for (let pz = fz0; pz <= fz1; pz += 4) addBox('darkWood', 0.18, 0.95, 0.18, fx0, 0.47, pz);

    // luống rau: chừa lối đi giữa và vệt vào từ cổng Đông tới (-76,-42)
    const beds: { x: number; z: number; w: number; d: number }[] = [
      { x: -85.6, z: -51.6, w: 4.4, d: 1.5 }, { x: -85.6, z: -48.7, w: 4.4, d: 1.5 }, { x: -85.6, z: -45.8, w: 4.4, d: 1.5 },
      { x: -79.8, z: -51.6, w: 4.4, d: 1.5 }, { x: -79.8, z: -48.7, w: 4.4, d: 1.5 }, { x: -79.8, z: -45.8, w: 4.4, d: 1.5 },
      { x: -85.2, z: -37.4, w: 4.0, d: 1.4 }, { x: -74.0, z: -38.0, w: 2.6, d: 1.4 },
    ];
    for (const bd of beds) {
      addBox('soil', bd.w, 0.3, bd.d, bd.x, 0.15, bd.z);
      const cols = Math.max(2, Math.round(bd.w / 0.42));
      for (let i = 0; i < cols; i++) {
        for (let r = 0; r < 2; r++) {
          addSphere('veg', 0.17, bd.x - bd.w / 2 + 0.3 + i * (bd.w - 0.6) / (cols - 1), 0.36 + (r % 2) * 0.03, bd.z - 0.35 + r * 0.7);
        }
      }
    }

    // ao sen nhỏ
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * Math.PI * 2;
      addBox('stone', 0.6, 0.16, 0.45, FARM_POND.x + Math.cos(t) * (FARM_POND.a + 0.3), 0.08,
        FARM_POND.z + Math.sin(t) * (FARM_POND.b + 0.3), -t);
    }
    const rand = rng(4488);
    for (let i = 0; i < 26; i++) {
      const ang = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * 0.9;
      const px = FARM_POND.x + Math.cos(ang) * FARM_POND.a * rr;
      const pz = FARM_POND.z + Math.sin(ang) * FARM_POND.b * rr;
      addDisc('pad', 0.26 + rand() * 0.16, 7, px, 0.13, pz, rand() * 6);
      if (i % 5 === 0) addSphere('flowerA', 0.11, px, 0.26, pz);
    }

    // kho nông cụ: sàn sát đất, cửa quay Nam
    const shedX = -84.2, shedZ = -33.6, shedBase = 0.06;
    addBox('stone', 3.6, shedBase, 3.0, shedX, shedBase / 2, shedZ);
    openHall(shedX, shedZ, shedBase, 1.5, 1.2, 2.2, 4.6, 4.0, 1.2, 2);
    addBox('wall', 3.0, 2.2, 0.18, shedX, shedBase + 1.3, shedZ + 1.2);
    addBox('wall', 1.0, 2.2, 0.18, shedX - 1.0, shedBase + 1.3, shedZ + 1.2);
    addBox('wall', 1.0, 2.2, 0.18, shedX + 1.0, shedBase + 1.3, shedZ + 1.2);
    wallLine(shedX - 1.5, shedZ + 1.2, shedX - 0.75, shedZ + 1.2, 0.22, 0.45);
    wallLine(shedX + 0.75, shedZ + 1.2, shedX + 1.5, shedZ + 1.2, 0.22, 0.45);
    addSign('KHO NÔNG CỤ', 1.8, 0.45, shedX, shedBase + 2.5, shedZ + 1.34);

    addSign('VƯỜN RAU', 2.4, 0.6, fx1 - 0.35, 1.05, -42, Math.PI / 2);
    seatPad(-82.8, -41.9, Math.PI / 2, true);
    zones.push({ x: FARM.x, z: FARM.z, r: 14, id: 'vuonRau' });
    const { group } = flush('farm');
    group.add(waterEllipse(FARM_POND.x, FARM_POND.z, FARM_POND.a, FARM_POND.b));
  }

  // =====================================================================================
  // 3. Ba tịnh thất bên Tây Tăng xá
  // =====================================================================================
  {
    for (const { x, z } of TINH_THAT) {
      // nền 0.16 khớp đúng vùng groundYBase đã khai cho TINH_THAT (±1.6 / ±1.25)
      addBox('dsStone', 3.2, 0.16, 2.5, x, 0.08, z);
      const hw = 1.3, hd = 1.05, beamY = 2.44;
      for (const sx of [-hw, hw]) for (const sz of [-hd, hd]) {
        addBox('dsStone', 0.35, 0.18, 0.35, x + sx, 0.25, z + sz);
        addCyl('dsTimber', 0.116, 0.14, 2.1, 10, x + sx, 1.39, z + sz);
        addBox('dsGold', 0.34, 0.12, 0.34, x + sx, beamY - 0.09, z + sz);
        solid(x + sx, z + sz, 0.26);
      }
      for (const s of [-1, 1]) {
        addBox('dsTimber', 3.0, 0.22, 0.23, x, beamY, z + s * hd);
        addBox('dsTimber', 0.23, 0.22, 2.5, x + s * hw, beamY, z);
        const wx = x + s * hw;
        for (const dz of [-0.74, 0.74]) addBox('dsPlaster', 0.18, 2.2, 0.62, wx, 1.26, z + dz);
        addBox('dsPlaster', 0.18, 0.83, 0.86, wx, 0.575, z);
        addBox('dsPlaster', 0.18, 0.52, 0.86, wx, 2.1, z);
        for (const dz of [-0.4, -0.2, 0, 0.2, 0.4]) addBox('dsDarkwood', 0.075, 0.87, 0.053, wx, 1.415, z + dz);
        wallLine(wx, z - hd, wx, z + hd, 0.26, 0.5);
      }
      addBox('dsPlaster', 2.6, 2.2, 0.18, x, 1.26, z - hd);
      wallLine(x - hw, z - hd, x + hw, z - hd, 0.26, 0.5);
      const { group: architecture } = flush('tinhThat-architecture');
      const roof = duocSuRoof(4.2, 3.6, beamY + 0.09, 0.94);
      roof.position.set(x, 0, z);
      architecture.add(roof);
      addBox('wood', 2.0, 0.05, 1.6, x, 0.19, z);
      seatPad(x, z + 0.5, 0, true, 0.9, 0.8, 'darkWood');
      addSign('TỊNH THẤT', 1.5, 0.4, x, 2.18, z + 1.20);
      zones.push({ x, z, r: 4, id: 'tinhThat' });
      flush('tinhThat-furniture');
    }
  }

  // =====================================================================================
  // 4. Rừng trúc + đường thiền hành vòng + ghế nghỉ
  // =====================================================================================
  {
    const cx = BAMBOO.x, cz = BAMBOO.z;
    // Đường đã chốt với tổ dựng đường: cổng Đông (92,2) → trúc (80,-3) → cầu sông (65,2)
    const roads: [number, number, number, number][] = [[70, 2, 92, 2], [80, -20, 80, 2], [77, -32, 77, 2], [79, 2, 79, 28], [80, -3, 65, 2]];
    const nearRoad = (x: number, z: number, pad: number) => roads.some(([ax, az, bx, bz]) => distToSeg(x, z, ax, az, bx, bz) < pad);

    // vòng chữ nhật bo góc, nằm trọn phía Nam đường z = 2, nối vào điểm trúc bằng nhánh ngắn
    const loop = { x0: 72.4, x1: 87.6, z0: -17.6, z1: -5.6, r: 2.2 };
    const ringPts: { x: number; z: number }[] = [];
    const pushEdge = (ax: number, az: number, bx: number, bz: number) => {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 1.7));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        ringPts.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t });
      }
    };
    const { x0, x1, z0, z1 } = loop, rr = loop.r;
    pushEdge(x0 + rr, z1, x1 - rr, z1);
    pushEdge(x1, z1 + rr, x1, z0 - rr);
    pushEdge(x1 - rr, z0, x0 + rr, z0);
    pushEdge(x0, z0 - rr, x0, z1 + rr);
    for (const [ccx, ccz, a0] of [
      [x1 - rr, z1 - rr, -Math.PI / 2], [x1 - rr, z0 + rr, 0], [x0 + rr, z0 + rr, Math.PI / 2], [x0 + rr, z1 - rr, Math.PI],
    ] as const) {
      for (let i = 0; i <= 5; i++) {
        const a = a0 + (i / 5) * (Math.PI / 2);
        ringPts.push({ x: ccx + Math.cos(a) * rr, z: ccz + Math.sin(a) * rr });
      }
    }
    for (const p of ringPts) {
      if (nearRoad(p.x, p.z, 2.1)) continue;
      addBox('paving', 1.7, 0.12, 1.7, p.x, 0.06, p.z);
    }
    // nhánh nối điểm trúc vào cạnh Bắc của vòng
    for (let i = 0; i <= 2; i++) {
      const t = i / 2;
      addBox('paving', 1.5, 0.12, 1.5, cx, 0.06, cz + (z1 - cz) * t);
    }
    // ghế nghỉ bốn phía, quay vào trong vòng
    const seatSpots: [number, number, number][] = [
      [cx, z1 + 1.1, Math.PI], [cx, z0 - 1.1, 0], [x0 - 1.1, -11.6, Math.PI / 2], [x1 + 1.1, -11.6, -Math.PI / 2],
    ];
    for (const [sx, sz, ry] of seatSpots) {
      if (nearRoad(sx, sz, 2.4)) continue;
      seatPad(sx, sz, ry, true, 1.2, 0.5);
      solid(sx, sz, 0.32);
    }

    const rand = rng(55123);
    let placed = 0;
    for (let i = 0; i < 560 && placed < 78; i++) {
      const x = 70.5 + rand() * 19, z = -19.4 + rand() * 33;
      if (nearRoad(x, z, 2.9) || nearWalkway(x, z, 1.2)) continue;
      let skip = false;
      for (const p of ringPts) if (Math.hypot(x - p.x, z - p.z) < 2.0) { skip = true; break; }
      if (skip) continue;
      for (const [sx, sz] of seatSpots) if (Math.hypot(x - sx, z - sz) < 1.8) { skip = true; break; }
      if (skip) continue;
      if (distToSeg(x, z, cx, cz, cx, z1) < 1.9) continue; // nhánh nối
      placed++;
      for (let k = 0; k < 3; k++) {
        const ox = (rand() - 0.5) * 0.9, oz = (rand() - 0.5) * 0.9;
        const h = 5.2 + rand() * 3.4;
        addCyl('bamboo', 0.06, 0.09, h, 5, x + ox, h / 2, z + oz);
        addCone('bambooLeaf', 0.62, 1.5, 5, x + ox, h - 0.5, z + oz);
        addCone('bambooLeaf', 0.46, 1.1, 5, x + ox, h - 1.5, z + oz);
      }
      solid(x, z, 0.45);
    }
    addSign('RỪNG TRÚC', 2.2, 0.55, 72.2, 1.1, -3.0, -Math.PI / 2);
    zones.push({ x: cx, z: cz, r: 13, id: 'rungTruc' });
    flush('bamboo');
  }

  // =====================================================================================
  // 5. Điện Dược Sư — nền 12 × 9, gian mở, cửa quay Nam
  // =====================================================================================
  {
    const { x, z, hx, hz, y } = DUOC_SU;
    addBox('stone', hx * 2, y, hz * 2, x, y / 2, z);
    const colH = 3.7, fz = hz - 0.6, bz2 = -hz + 0.6;
    for (const sx of [-hx + 1.0, -1.8, 1.8, hx - 1.0]) {
      for (const sz of [fz, bz2]) {
        addBox('stone', 0.62, 0.26, 0.62, x + sx, y + 0.13, z + sz);
        addCyl('red', 0.26, 0.31, colH, 12, x + sx, y + 0.26 + colH / 2, z + sz);
        addBox('gold', 1.05, 0.22, 1.05, x + sx, y + 0.26 + colH + 0.11, z + sz);
        solid(x + sx, z + sz, 0.34);
      }
    }
    const beamY = y + 0.26 + colH + 0.22;
    addBox('red', hx * 2 - 0.6, 0.42, 0.7, x, beamY, z + fz);
    addBox('red', hx * 2 - 0.6, 0.42, 0.7, x, beamY, z + bz2);
    addBox('red', 0.7, 0.42, hz * 2 - 0.6, x - hx + 1.0, beamY, z);
    addBox('red', 0.7, 0.42, hz * 2 - 0.6, x + hx - 1.0, beamY, z);
    // tường hậu + hai bên; mặt trước mở hoàn toàn
    addBox('wall', hx * 2 - 1.4, colH + 0.5, 0.24, x, y + 0.26 + (colH + 0.5) / 2, z + bz2);
    wallLine(x - hx + 1.3, z + bz2, x + hx - 1.3, z + bz2, 0.3, 0.55);
    for (const s of [-1, 1]) {
      addBox('wall', 0.24, colH + 0.5, hz * 2 - 1.4, x + s * (hx - 1.0), y + 0.26 + (colH + 0.5) / 2, z);
      wallLine(x + s * (hx - 1.0), z + bz2 + 0.4, x + s * (hx - 1.0), z + fz - 0.4, 0.3, 0.55);
    }
    const roof1 = beamY + 0.3;
    addRoof(15.0, 11.4, 2.6, 0.62, x, roof1, z);
    addBox('red', 6.4, 1.15, 4.6, x, roof1 + 2.1, z);
    addRoof(7.6, 5.8, 1.6, 0.5, x, roof1 + 2.6, z);
    addCone('gold', 0.2, 1.1, 8, x, roof1 + 4.5, z);
    const { group: architecture } = flush('duocSu-architecture');
    replaceArchitecture(architecture, 'dien-duoc-su-blender', x, z);
    // bệ Phật, tượng, bàn hương
    const altarZ = z + bz2 + 1.2;
    addBox('darkWood', 5.6, 0.95, 1.5, x, y + 0.475, altarZ);
    addBox('gold', 5.2, 0.1, 1.3, x, y + 0.99, altarZ);
    for (const ox of [-1.8, 0, 1.8]) solid(x + ox, altarZ, 1.0);
    const buddha = buildBuddha();
    buddha.scale.setScalar(0.5);
    buddha.position.set(x, y + 1.04, altarZ);
    buddha.name = 'expansion-buddha';
    addBox('darkWood', 2.6, 0.16, 0.9, x, y + 1.05, altarZ + 2.0);
    for (const ox of [-1.05, 1.05]) for (const oz of [-0.3, 0.3]) addBox('darkWood', 0.14, 1.05, 0.14, x + ox, y + 0.52, altarZ + 2.0 + oz);
    solid(x, altarZ + 2.0, 0.9);
    // đèn Dược Sư
    for (const [lx, lz] of [[x - 4.0, z + 2.6], [x + 4.0, z + 2.6], [x - 4.0, z - 1.6], [x + 4.0, z - 1.6]] as const) {
      addBox('stoneDark', 0.4, 0.9, 0.4, lx, y + 0.45, lz);
      addSphere('lamp', 0.26, lx, y + 1.15, lz);
      glow(lx, y + 1.15, lz, 1.9, 0x9fd0ff, 0.42);
      solid(lx, lz, 0.3);
    }
    addSign('ĐIỆN DƯỢC SƯ', 3.4, 0.65, x, beamY - 0.35, z + fz + 0.4);
    seatPad(x - 3.2, z + 0.6, Math.PI, true);
    seatPad(x + 3.2, z + 0.6, Math.PI, true);
    seatPad(x - 3.2, z - 2.2, Math.PI, true);
    seatPad(x + 3.2, z - 2.2, Math.PI, true);
    zones.push({ x, z, r: 8, id: 'duocSu' });
    const { group } = flush('duocSu');
    group.add(mergeStatue(buddha));
  }

  // =====================================================================================
  // 6. Vườn hoa + đồi cỏ
  // =====================================================================================
  {
    const cx = FLOWER_HILL.x, cz = FLOWER_HILL.z;
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(1, 44), grassM);
    lawn.rotation.x = -Math.PI / 2;
    lawn.scale.set(10.6, 11.8, 1);
    lawn.position.set(cx + 0.5, 0.02, cz - 0.5);
    lawn.receiveShadow = true;
    lawn.name = 'flowerHill-lawn';

    const rand = rng(70123);
    const beds: { x: number; z: number; a: number; b: number }[] = [
      { x: 74.0, z: 22.0, a: 3.4, b: 2.4 }, { x: 84.4, z: 23.4, a: 3.0, b: 2.2 },
      { x: 71.4, z: 31.6, a: 2.6, b: 2.2 }, { x: 79.4, z: 33.4, a: 3.6, b: 2.4 },
      { x: 86.0, z: 33.0, a: 2.6, b: 2.0 }, { x: 84.6, z: 16.6, a: 2.4, b: 1.8 },
    ];
    for (const bd of beds) {
      for (let i = 0; i < 20; i++) {
        const t = (i / 20) * Math.PI * 2;
        addBox('stone', 0.55, 0.16, 0.34, bd.x + Math.cos(t) * (bd.a + 0.2), 0.08,
          bd.z + Math.sin(t) * (bd.b + 0.2), -t);
      }
      for (let i = 0; i < 46; i++) {
        const ang = rand() * Math.PI * 2, r2 = Math.sqrt(rand()) * 0.94;
        const px = bd.x + Math.cos(ang) * bd.a * r2, pz = bd.z + Math.sin(ang) * bd.b * r2;
        const key: MatKey = i % 3 === 0 ? 'flowerA' : i % 3 === 1 ? 'flowerB' : 'flowerC';
        addSphere(key, 0.11 + rand() * 0.07, px, 0.24 + rand() * 0.12, pz);
      }
    }
    // ghế đá + cây bóng mát (né điểm hoa (79,28) và lối vào)
    for (const [bx, bz2, ry] of [[71.6, 28.0, Math.PI / 2], [86.6, 29.4, -Math.PI / 2], [79.0, 38.0, Math.PI]] as const) {
      seatPad(bx, bz2, ry, true, 1.3, 0.6);
      for (const s of [-1, 1]) {
        const nx = Math.cos(ry) * 0 - Math.sin(ry) * (s * 0.5), nz = Math.sin(ry) * 0 + Math.cos(ry) * (s * 0.5);
        addBox('stoneDark', 0.26, 0.14, 0.3, bx + nx, 0.07, bz2 + nz);
      }
    }
    for (const [tx, tz] of [[72.6, 26.6], [86.6, 26.0], [84, 17.6]] as const) {
      placeTree('oak-natural', tx, tz, 5.9);
      solid(tx, tz, 0.55);
    }
    // lối lát từ bờ sông vào vườn
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      addBox('paving', 1.5, 0.1, 1.5, 71.6 + t * 6.4, 0.05, 14.6 + t * 7.2);
    }
    addSign('VƯỜN HOA', 2.4, 0.6, 70.6, 1.1, 20.4, -Math.PI / 2);
    zones.push({ x: cx, z: cz, r: 12, id: 'vuonHoa' });
    const { group } = flush('flowerHill');
    group.add(lawn);
  }

  // =====================================================================================
  // 7. Sông Đông + bờ kè, hai cầu đá, thác đầu nguồn và ao cuối sông
  // =====================================================================================
  const waterfall = buildRiverWaterfall();
  {
    const { x0, x1, z0, z1, bridges, bridgeHalf } = RIVER;
    addBox('stone', 0.6, 0.22, z1 - z0, x0 - 0.3, 0.05, (z0 + z1) / 2);
    addBox('stone', 0.6, 0.22, z1 - z0, x1 + 0.3, 0.05, (z0 + z1) / 2);
    for (let pz = z0; pz <= z1; pz += 4) {
      addBox('stoneDark', 0.34, 0.36, 0.34, x0 - 0.55, 0.14, pz);
      addBox('stoneDark', 0.34, 0.36, 0.34, x1 + 0.55, 0.14, pz);
    }
    for (const bz of bridges) {
      // mặt cầu y = 0.28 khớp groundYBase (x 60.5..69.5)
      addBox('paving', 10.6, 0.24, 2.8, RIVER.x, 0.16, bz);
      for (const s of [-1, 1]) {
        addBox('stone', 6, 0.42, 0.2, RIVER.x, 0.28 + 0.21, bz + s * bridgeHalf);
        for (let px = 62.2; px <= 67.8; px += 1.4) addBox('stoneDark', 0.24, 0.6, 0.24, px, 0.28 + 0.28, bz + s * bridgeHalf);
        // lan can: chạy dọc, chừa hai đầu cầu (mép ngoài 60.2..69.8)
        wallLine(62, bz + s * bridgeHalf, 68, bz + s * bridgeHalf, 0.2, 0.6);
      }
      for (const px of [61.6, 68.4]) addBox('stoneDark', 0.8, 1.0, 2.2, px, -0.1, bz);
    }
    // đường thiền hành ven sông (bờ Đông), chừa hai đầu cầu
    for (let pz = -30; pz <= 12; pz += 2.2) {
      if (bridges.some((bz) => Math.abs(pz - bz) < 2.8)) continue;
      addBox('paving', 1.2, 0.1, 1.2, x1 + 1.6, 0.05, pz);
    }
    for (let i = 0; i < 28; i++) {
      const t = (i / 28) * Math.PI * 2;
      addBox('stone', 0.62, 0.16, 0.44, RIVER.pond.x + Math.cos(t) * (RIVER.pond.a + 0.3), 0.08,
        RIVER.pond.z + Math.sin(t) * (RIVER.pond.b + 0.3), -t);
    }
    addSign('SÔNG ĐÔNG', 2.2, 0.55, x1 + 1.7, 1.0, -42.5);
    for (const z of bridges) zones.push({ x: RIVER.x, z, r: 5, id: 'river' });
    const { group } = flush('river');
    group.add(waterRect(x0, x1, z0, z1));
    group.add(waterEllipse(RIVER.pond.x, RIVER.pond.z, RIVER.pond.a, RIVER.pond.b));
    group.add(waterfall.group);
    // Keep the walkable banks out of the footprint except where they meet the cliff.
    wallLine(RIVER.x - 5.6, RIVER.z0 - 1.96, RIVER.x + 5.6, RIVER.z0 - 1.96, 1.12, 1.5);
    for (const dx of [-5.55, 5.65]) wallLine(RIVER.x + dx, RIVER.z0 - 3, RIVER.x + dx, RIVER.z0 - 13.4, 1.55, 1.7);
    wallLine(RIVER.x - 5.55, RIVER.z0 - 13.4, RIVER.x + 5.65, RIVER.z0 - 13.4, 1.55, 1.7);
  }

  // =====================================================================================
  // 8. Trục hành hương: sân chân đồi, 299 bậc và hai chiếu nghỉ.
  // =====================================================================================
  {
    const prof = ngocStepProfile();
    const { x, stairHalf: half, stairStart, stairTop, approachHalf } = NGOC;
    const approachEnd = NORTH_WALK_Z - 1.2;
    for (const side of [-1, 1]) {
      for (const offset of [half - 0.18, approachHalf - 0.18]) {
        addBox('dsTimber', 0.14, 0.016, approachEnd - stairStart, x + side * offset, 0.058, (approachEnd + stairStart) / 2);
      }
    }
    const lantern = (lx: number, ly: number, lz: number) => {
      addBox('dsStone', 0.72, 0.18, 0.72, lx, ly + 0.09, lz);
      addCyl('dsStone', 0.17, 0.26, 0.58, 8, lx, ly + 0.45, lz);
      addBox('dsDarkwood', 0.49, 0.1, 0.49, lx, ly + 0.76, lz);
      addBox('lamp', 0.31, 0.31, 0.31, lx, ly + 0.94, lz);
      addCyl('dsTimber', 0.12, 0.38, 0.24, 4, lx, ly + 1.19, lz);
      glow(lx, ly + 0.95, lz, 1.4, 0xffc070, 0.3);
      solid(lx, lz, 0.39);
    };
    for (const side of [-1, 1]) lantern(x + side * 4.95, 0, stairStart + 4.5);

    let lowerZ = stairStart, lowerY = 0;
    const rails = (z0: number, y0: number, z1: number, y1: number) => {
      const run = z1 - z0, rise = y0 - y1;
      const spans = Math.ceil(run / 1.45);
      for (const side of [-1, 1]) {
        const rx = x + side * (half + 0.23);
        for (const [key, width, h, height] of [['dsStone', 0.44, 0.32, 0.07], ['dsTimber', 0.19, 0.13, 0.87], ['dsDarkwood', 0.12, 0.10, 0.49]] as const) {
          put(key, new THREE.BoxGeometry(width, h, Math.hypot(run, rise) + 0.025).rotateX(Math.atan2(rise, run)), rx, (y0 + y1) / 2 + height, (z0 + z1) / 2);
        }
        for (let i = 0; i < spans; i++) {
          const t = i / spans;
          addBox('dsTimber', 0.19, 0.81, 0.19, rx, y0 - t * rise + 0.52, z0 + t * run);
        }
      }
    };
    for (const [i, s] of prof.entries()) {
      const d = s.z1 - s.z0, zc = (s.z0 + s.z1) / 2;
      const tread = new THREE.BoxGeometry(half * 2, s.y, d);
      const pos = tread.getAttribute('position'), normal = tread.getAttribute('normal'), uv = tread.getAttribute('uv');
      for (let j = 0; j < uv.count; j++) if (normal.getY(j) > 0.5) {
        uv.setXY(j, (pos.getX(j) + x) / 8, -(pos.getZ(j) + zc) / 8);
      }
      put('granite', tread, x, s.y / 2, zc);
      for (const side of [-1, 1]) {
        addBox('graniteDark', 0.21, 0.018, d, x + side * (half - 0.24), s.y + 0.002, zc);
      }
      if (d > 1) {
        rails(s.z1, s.y, lowerZ, lowerY);
        rails(s.z0, s.y, s.z1, s.y);
        for (const side of [-1, 1]) lantern(x + side * (half + 0.31), s.y, zc);
        lowerZ = s.z0;
        lowerY = s.y;
        addBox('paving', half * 2 - 0.9, 0.012, d - 0.22, x, s.y + 0.004, zc);
      } else if (i === prof.length - 1) {
        rails(stairTop, s.y, lowerZ, lowerY);
      }
    }
    for (const side of [-1, 1]) wallLine(x + side * (half + 0.23), stairStart, x + side * (half + 0.23), stairTop, 0.22, 0.4);
    const { group } = flush('ngocStairs', true);
    const gate = duocSuRoof(9.7, 2.45, 3.95, 0.88);
    gate.position.set(x, 0, stairStart + 2.9);
    group.add(gate);
    const gateZ = stairStart + 2.9;
    for (const side of [-1, 1]) {
      const px = x + side * (half + 0.35);
      addBox('dsStone', 0.85, 0.39, 0.85, px, 0.195, gateZ);
      addCyl('dsTimber', 0.26, 0.32, 3.65, 12, px, 2.13, gateZ);
      solid(px, gateZ, 0.46);
    }
    addBox('dsDarkwood', 9.12, 0.24, 0.62, x, 3.91, gateZ);
    addSign('LỐI LÊN CHÙA NGỌC', 3.5, 0.56, x, 3.55, gateZ + 0.37);
    flush('ngocGate');
  }

  // =====================================================================================
  // 9. Sân thượng và gian thờ Chùa Ngọc theo mẫu Điện Dược Sư.
  // =====================================================================================
  {
    const { x: sx, z: bodyZ, hx, hz } = NGOC_HALL;
    const sy = NGOC.y, { half, north } = NGOC_TERRACE, south = NGOC.stairTop;
    const depth = south - north, mid = (south + north) / 2;
    const entryZ = bodyZ + hz, rearZ = bodyZ - hz, altarZ = rearZ + 1.3;
    addBox('granite', half * 2 - 0.32, sy - 0.18, depth - 0.18, sx, (sy - 0.18) / 2, mid);
    addBox('paving', half * 2, 0.18, depth, sx, sy - 0.09, mid);
    for (const side of [-1, 1]) {
      addBox('dsTimber', 0.15, 0.025, depth - 0.65, sx + side * 3.7, sy + 0.01, mid);
      addBox('dsPlaster', 0.24, 0.045, depth - 0.8, sx + side * (half - 0.27), sy + 0.01, mid);
    }
    const balustrade = (x0: number, z0: number, x1: number, z1: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0);
      for (const h of [0.17, 0.75]) addBox('dsStone', 0.26, 0.15, len, (x0 + x1) / 2, sy + h, (z0 + z1) / 2, yaw);
      const n = Math.ceil(len / 0.85);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        addCyl('dsStone', 0.11, 0.14, 0.65, 8, THREE.MathUtils.lerp(x0, x1, t), sy + 0.42, THREE.MathUtils.lerp(z0, z1, t));
      }
      wallLine(x0, z0, x1, z1, 0.24, 0.43);
    };
    const edge = half - 0.25, gateHalf = NGOC.stairHalf + 0.24;
    for (const side of [-1, 1]) {
      balustrade(sx + side * edge, north + 0.24, sx + side * edge, south - 0.14);
      balustrade(sx + side * gateHalf, south - 0.14, sx + side * edge, south - 0.14);
      seatPad(sx + side * 8.7, south - 2.45, Math.PI, true, 1.85, 0.95, 'dsStone');
    }
    balustrade(sx - edge, north + 0.24, sx + edge, north + 0.24);

    const colH = 3.82;
    for (const ox of [-hx, -2.45, 2.45, hx]) for (const z of [entryZ, rearZ]) {
      addBox('dsStone', 0.83, 0.34, 0.83, sx + ox, sy + 0.17, z);
      addCyl('dsTimber', 0.25, 0.32, colH - 0.27, 12, sx + ox, sy + (colH + 0.27) / 2, z);
      addCyl('dsGold', 0.32, 0.32, 0.075, 12, sx + ox, sy + 0.49, z);
      addBox('dsDarkwood', 0.73, 0.28, 0.73, sx + ox, sy + colH, z);
      solid(sx + ox, z, 0.46);
    }
    addBox('dsPlaster', hx * 2, colH, 0.27, sx, sy + colH / 2, rearZ);
    for (const z of [entryZ, rearZ]) {
      addBox('dsDarkwood', hx * 2 + 0.8, 0.37, 0.69, sx, sy + colH + 0.18, z);
      addBox('dsGold', hx * 2 + 0.48, 0.07, 0.74, sx, sy + colH + 0.12, z);
    }
    wallLine(sx - hx, rearZ, sx + hx, rearZ, 0.28, 0.48);
    for (const side of [-1, 1]) {
      const px = sx + side * hx;
      addBox('dsPlaster', 0.24, 1.05, hz * 2, px, sy + 0.525, bodyZ);
      addBox('dsTimber', 0.36, 0.14, hz * 2, px, sy + 1.09, bodyZ);
      addBox('dsDarkwood', 0.56, 0.37, hz * 2, px, sy + colH + 0.18, bodyZ);
      for (let i = -5; i <= 5; i++) addBox('dsTimber', 0.13, 2.62, 0.12, px, sy + 2.44, bodyZ + i * 0.58);
      wallLine(px, rearZ, px, entryZ, 0.26, 0.44);
    }

    addBox('dsDarkwood', 4.35, 0.98, 1.75, sx, sy + 0.49, altarZ);
    addBox('dsGold', 4.45, 0.09, 1.84, sx, sy + 1.01, altarZ);
    wallLine(sx - 1.55, altarZ, sx + 1.55, altarZ, 0.87, 0.65);
    const statue = buildBuddha();
    statue.scale.setScalar(0.68);
    statue.position.set(sx, sy + 1.055, altarZ);
    for (const s of [-1, 1]) {
      for (const z of [entryZ + 0.02, altarZ + 0.48]) {
        const px = sx + s * (z > bodyZ ? 4.15 : 1.58), y = sy + (z > bodyZ ? 3.0 : 1.23);
        addCyl('dsGold', 0.25, 0.17, 0.08, 8, px, y + 0.17, z);
        addCyl('dsGold', 0.17, 0.23, 0.07, 8, px, y - 0.17, z);
        addSphere('lamp', 0.19, px, y, z);
        glow(px, y, z, 1.8, 0xffc070, 0.4);
      }
    }
    addSign('CHÙA NGỌC', 3.55, 0.72, sx, sy + 3.46, entryZ + 0.38);
    zones.push({ x: NGOC.x, z: NGOC.z, r: 10, id: 'chuaNgoc' });
    const { group } = flush('chuaNgoc');
    const roof = duocSuRoof(14.9, 9.3, sy + colH + 0.37, 2.18);
    roof.position.set(sx, 0, bodyZ);
    const mergedStatue = mergeStatue(statue);
    mergedStatue.name = 'expansion-buddha-ngoc';
    group.add(roof, mergedStatue);
  }

  // =====================================================================================
  // 10. Động thiền + đường mòn + hai nhà nghỉ chân
  // =====================================================================================
  const hillPaths: [number, number, number, number][] = [
    [-26, -102.4, -24, -96], [-24, -96, -16, -92], [-16, -92, -16, -86],
    [26, -101, 26, -92], [26, -92, 18, -88],
    [-30, -95, -24, -96], [28, -100, 26, -101],
  ];
  const nearHillPath = (x: number, z: number, pad: number) => hillPaths.some(([ax, az, bx, bz]) => distToSeg(x, z, ax, az, bx, bz) < pad);
  const restSpots: [number, number][] = [[-30, -95], [28, -100]];

  {
    const cx = CAVE.x, cz = CAVE.z, yb = expansionGroundY(cx, cz);
    // khối đá: hậu + hai bên + trần, cửa quay Nam
    addBox('rock', 9.6, 5.4, 5.0, cx, yb + 2.3, cz - 3.2);
    addBox('rock', 3.4, 4.6, 4.2, cx - 5.2, yb + 1.9, cz - 1.0);
    addBox('rock', 3.4, 4.2, 4.2, cx + 5.2, yb + 1.7, cz - 0.6);
    addBox('rock', 7.6, 1.7, 4.8, cx, yb + 4.0, cz - 1.0);
    addBox('rock', 2.4, 2.6, 1.6, cx - 3.2, yb + 4.6, cz + 0.6);
    addBox('rock', 2.0, 2.2, 1.5, cx + 3.4, yb + 4.4, cz + 0.4);
    // lòng hang
    addBox('graniteDark', 4.6, 0.08, 4.6, cx, yb + 0.04, cz - 0.8);
    addBox('dark', 4.4, 3.0, 0.24, cx, yb + 1.5, cz - 2.9);
    addBox('dark', 4.4, 0.24, 4.2, cx, yb + 2.95, cz - 1.0);
    for (const s of [-1, 1]) addBox('dark', 0.24, 3.0, 4.2, cx + s * 2.2, yb + 1.5, cz - 1.0);
    // bàn thờ đá + đèn
    addBox('granite', 1.5, 0.8, 1.0, cx, yb + 0.44, cz - 2.4);
    addSphere('lamp', 0.16, cx, yb + 0.98, cz - 2.4);
    glow(cx, yb + 0.98, cz - 2.4, 1.5, 0xffb060, 0.45);
    // vách chắn hai bên + hậu (cửa Nam để trống)
    wallLine(cx - 2.4, cz - 3.1, cx - 2.4, cz + 0.6, 0.4, 0.6);
    wallLine(cx + 2.4, cz - 3.1, cx + 2.4, cz + 0.6, 0.4, 0.6);
    wallLine(cx - 2.4, cz - 3.1, cx + 2.4, cz - 3.1, 0.4, 0.6);
    solid(cx, cz - 2.9, 0.9);
    seatPad(cx - 1.2, cz - 1.0, 0, true, 0.9, 0.8);
    seatPad(cx + 1.2, cz - 1.0, 0, true, 0.9, 0.8);
    addSign('ĐỘNG THIỀN', 2.2, 0.55, cx, yb + 3.5, cz + 0.8);
    zones.push({ x: cx, z: cz, r: 7, id: 'dongThien' });

    // đường mòn trên đồi, lát theo cao độ thật
    for (const [ax, az, bx, bz] of hillPaths) {
      const n = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / 1.6));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const px = ax + (bx - ax) * t, pz = az + (bz - az) * t;
        addBox('paving', 1.35, 0.1, 1.35, px, expansionGroundY(px, pz) + 0.05, pz);
      }
    }

    // hai nhà nghỉ chân (sàn sát đất theo cao độ đồi)
    for (const [rx, rz] of restSpots) {
      const ry = expansionGroundY(rx, rz);
      addBox('stone', 4.2, 0.12, 3.4, rx, ry + 0.06, rz);
      openHall(rx, rz, ry + 0.12, 1.5, 1.1, 2.2, 4.6, 4.0, 1.2, 0);
      addSign('NHÀ NGHỈ CHÂN', 1.7, 0.42, rx, ry + 2.55, rz + 1.15);
      seatPad(rx - 0.9, rz, 0, true, 0.9, 0.8, 'darkWood');
      seatPad(rx + 0.9, rz, 0, true, 0.9, 0.8, 'darkWood');
      zones.push({ x: rx, z: rz, r: 4, id: 'nhaNghiChan' });
    }
    flush('dongThien');
  }

  // ---- rừng thông hai bên trục thang (gộp cùng mesh pineForest) ----
  {
    const rand = rng(31117);
    let placed = 0;
    for (let i = 0; i < 640 && placed < 120; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const px = side * (13 + rand() * 26.5);
      const pz = -86 - rand() * 31.5;
      if (Math.abs(px - NGOC.x) < NGOC_TERRACE.half + 2.4 && pz < NGOC.stairTop + 4) continue;
      if (nearHillPath(px, pz, 2.6)) continue;
      if (Math.hypot(px - CAVE.x, pz - CAVE.z) < 6.5) continue;
      if (restSpots.some(([rx, rz]) => Math.hypot(px - rx, pz - rz) < 4.8)) continue;
      placed++;
      const h = 5.4 + rand() * 4.2;
      const yb = expansionGroundY(px, pz);
      if (placed <= 8) placeTree('pine-natural', px, pz, h);
      else {
        addCyl('trunk', 0.2, 0.34, h * 0.45, 6, px, yb + h * 0.225, pz);
        for (let k = 0; k < 3; k++) {
          const ch = h * 0.52 * (1 - k * 0.18);
          addCone('pine', 1.85 - k * 0.42, ch, 7, px, yb + h * 0.3 + k * h * 0.22, pz);
        }
      }
      solid(px, pz, 0.42);
    }
    // Frame the silhouette without growing through the terrace or roof.
    const rand2 = rng(88991);
    for (let i = 0; i < 30; i++) {
      const px = -37 + rand2() * 74;
      const pz = NGOC_TERRACE.north + 0.6 + rand2() * 3.1;
      const h = 6.0 + rand2() * 3.4;
      if (Math.abs(px - NGOC.x) < NGOC_TERRACE.half + 2.8) continue;
      const yb = expansionGroundY(px, pz);
      addCyl('trunk', 0.22, 0.36, h * 0.45, 6, px, yb + h * 0.225, pz);
      for (let k = 0; k < 3; k++) {
        const ch = h * 0.52 * (1 - k * 0.18);
        addCone('pine', 2.0 - k * 0.45, ch, 7, px, yb + h * 0.3 + k * h * 0.22, pz);
      }
      solid(px, pz, 0.45);
    }
    flush('pineForest');
  }

  // ---- địa hình tự nhiên dưới phần bậc và sân lát ----
  {
    const hillSouth = NORTH_WALK_Z, hillNorth = NGOC_TERRACE.north - 0.5;
    const geo = new THREE.PlaneGeometry(80, hillSouth - hillNorth, 54, 32);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, (hillSouth + hillNorth) / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, ngocHillGroundY(x, z) - 0.027);
    }
    geo.computeVertexNormals();
    geo.deleteAttribute('uv');
    const uv: number[] = [];
    for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i) / 16, pos.getZ(i) / 16);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const hill = new THREE.Mesh(geo, grassM);
    hill.name = 'expansion-hill-terrain';
    hill.receiveShadow = true;
    hill.castShadow = true;
    const g = new THREE.Group();
    g.name = 'expansion-hill';
    g.add(hill);
    root.add(g);
  }

  // =====================================================================================
  // 11. Nghĩa trang Vườn Tháp mới: cây cổ thụ (khu tháp do temple.ts dựng tại 50,-94)
  // =====================================================================================
  {
    const tx = 56, tz = -88;
    addCyl('trunk', 0.6, 1.05, 6.2, 10, tx, 3.1, tz);
    for (const [ox, oz, r, y] of [[0, 0, 3.5, 7.4], [-2.1, 0.7, 2.5, 6.6], [2.0, -0.6, 2.4, 6.9], [0.4, 1.8, 2.0, 8.4]] as const) {
      addSphere('leaf', r, tx + ox, y, tz + oz);
    }
    for (let i = 0; i < 9; i++) {
      const t = (i / 9) * Math.PI * 2;
      const rz = tz + Math.sin(t) * 2.4;
      if (rz < -88.6) continue; // chừa nền Vườn Tháp ở phía Nam
      addBox('stoneDark', 0.7, 0.2, 0.5, tx + Math.cos(t) * 2.4, 0.1, rz, -t);
    }
    solid(tx, tz, 1.1);
    for (const s of [-1, 1]) {
      addBox('graniteDark', 0.4, 1.3, 0.4, tx + s * 4.2, 0.65, tz + 3.0);
      addBox('granite', 0.7, 0.25, 0.7, tx + s * 4.2, 1.42, tz + 3.0);
      solid(tx + s * 4.2, tz + 3.0, 0.35);
    }
    addSign('CÂY CỔ THỤ', 2.0, 0.5, tx, 1.35, tz + 4.6);
    zones.push({ x: tx, z: tz, r: 7, id: 'nghiaTrang' });
    flush('nghiaTrang');
  }

  // ---- biển chữ: material riêng, không gộp ----
  {
    const g = new THREE.Group();
    g.name = 'expansion-signs';
    for (const s of signs) g.add(s);
    root.add(g);
  }

  c.scene.add(root);
  if (import.meta.env.DEV) {
    const meshes: string[] = [];
    root.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o.name); });
    console.warn(`expansion: colliders +${colliders.length - collidersBefore}, seats ${seats.length}, `
      + `zones ${zones.length}, meshes ${meshes.length}, stairs ${meshes.includes('ngoc-stairs') ? 'ngoc-stairs ok' : 'MISSING'}`);
  }
  return { seats, zones, update: waterfall.update };
}
