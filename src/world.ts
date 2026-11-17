import * as THREE from 'three';
import { MAP_HALF } from '../shared/types';
import type { FireworkSize } from '../shared/types';
import { FIREWORKS } from '../shared/game';
import { fitModel, loadModel } from './models';
import { paveCompound, removeSolidGrassClumps, SERENE_SKY } from './compound';
import { glowTexture, grassTexture, petalTexture, signTexture, signTexture2Lines, stoneTexture } from './textures';
import { geo, outlined, toon } from './toon';
import { blocked, LAKE, HALL, PLAZA } from './layout';
import { buildTemple, groundY, resolveWater, type Seat } from './temple';
import { buildSeatedBuddhaStatue } from './statue-scan';
import { buildGarden } from './garden';
import { buildVuonCay } from './vuoncay';
import { buildMarket } from './market';

export interface Mood { sky: string; zenith: string; sun: string; sunI: number; hemi: string; fog: number; night?: boolean }
/**
 * Bảng màu không gian thiền tự.
 * Trước đây cả ba phòng đều dùng tông cam đục của "bão cát sa mạc"; nay là bầu trời
 * xanh trong, yên bình: ngày nắng dịu, hoàng hôn tím nhạt, đêm trăng xanh thẫm.
 */
export const MOODS: Record<string, Mood> = {
  'vo-luong': { sky: '#dcefff', zenith: '#5aa7e0', sun: '#fff6e2', sunI: 2.2, hemi: '#eaf4ff', fog: 0.0060 },
  'tu-bi': { sky: '#e7f2ff', zenith: '#4f9bd8', sun: '#ffffff', sunI: 2.4, hemi: '#f0f7ff', fog: 0.0054 },
  'an-lac': { sky: '#ffe9d2', zenith: '#7fa8d8', sun: '#ffe2b8', sunI: 1.6, hemi: '#f3e9ff', fog: 0.0058, night: true },
};

export interface World {
  scene: THREE.Scene;
  ground: THREE.Mesh;
  colliders: { x: number; z: number; r: number }[];
  update(t: number, focus: THREE.Vector3): void;
  spawnLantern(x: number, z: number): void;
  spawnIncense(x: number, z: number): void;
  spawnBurst(x: number, z: number, color?: number): void;
  /** Đèn trời: bay thẳng lên từ (x,z), sống ~45s, mờ dần 5s cuối. */
  spawnSkyLantern(x: number, z: number): void;
  /** Pháo hoa: rocket bay lên rồi nổ thành cầu sprite; size quyết định số quả + nhịp. */
  spawnFirework(x: number, z: number, size: FireworkSize): void;
  setMood(room: string): void;
  altar: THREE.Vector3;
  sun: THREE.DirectionalLight;
  seats: Seat[];
  zoneAt(x: number, z: number): string | null;
  resolveWater(p: { x: number; z: number }, onDeck?: boolean): void;
  groundY(x: number, z: number): number;
  ringBell(): void;
  ringDrum(): void;
  setHonorBoard(rows: { name: string; coins: number; merit: number }[]): void;
  setStele(d: { name: string; merit: number; weekKey: string } | null): void;
  noticeBoard: THREE.Group;
}

const lamb = (c: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, ...extra });

const rngSeed = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Chinese-style tiered roof: pyramid with upturned eaves, built from a lathe-like custom geometry. */
function roofGeometry(w: number, d: number, h: number, lift = 0.55) {
  const g = new THREE.ConeGeometry(1, h, 4, 6, true);
  g.rotateY(Math.PI / 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const t = (h / 2 - y) / h; // 0 top .. 1 eave
    let x = p.getX(i) * w * 0.7071, z = p.getZ(i) * d * 0.7071;
    // curve the slope (concave) and flick up the corners
    const corner = Math.pow(Math.abs(p.getX(i) * p.getZ(i)) * 2, 2.2);
    p.setXYZ(i, x * (0.55 + 0.45 * t) / (0.55 + 0.45 * t) , y - Math.pow(t, 3) * 0.0 + corner * lift * t * t - Math.pow(1 - t, 2) * 0, z);
    const bend = Math.pow(1 - t, 2) * h * 0.12;
    p.setY(i, p.getY(i) - bend + corner * lift * Math.pow(t, 3));
  }
  g.computeVertexNormals();
  return g;
}

export function createWorld(renderer: THREE.WebGLRenderer): World {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SERENE_SKY.day.fog);
  scene.fog = new THREE.FogExp2(SERENE_SKY.day.fog, SERENE_SKY.day.fogDensity);

  const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x4a5a38, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e2, 2.2);
  sun.position.set(-26, 38, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 110 });
  scene.add(sun);
  scene.add(sun.target);

  // ---- Sky dome (gradient + sun glow) ----
  const skyU = {
    horizon: { value: new THREE.Color(SERENE_SKY.day.horizon) }, zenith: { value: new THREE.Color(SERENE_SKY.day.zenith) },
    sunDir: { value: sun.position.clone().normalize() }, sunCol: { value: new THREE.Color(SERENE_SKY.day.sun) },
  };
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(220, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 v; void main(){ v = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 horizon; uniform vec3 zenith; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 v;
        void main(){ float h = clamp(v.y,0.0,1.0); vec3 c = mix(horizon, zenith, pow(h,0.55));
          float s = max(dot(normalize(v), sunDir),0.0); c += sunCol * (pow(s,64.0)*0.9 + pow(s,6.0)*0.22);
          gl_FragColor = vec4(c,1.0); }`,
    }),
  ));

  // ---- Mặt trăng (đĩa + halo) và sao: hiện theo nightK, cố định trên trời Bắc-Tây ----
  const MOON_POS = new THREE.Vector3(-70, 100, -140);
  // Viền tối mỏng quanh đĩa trăng để trăng vẫn đọc được trên nền trời nhạt
  // (rạng sáng/hoàng hôn và palette An Lạc) — trên trời đêm tối viền này chìm hẳn.
  const rimMat = new THREE.MeshBasicMaterial({ color: 0x2a3a6b, fog: false, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const moonRim = new THREE.Mesh(new THREE.CircleGeometry(9, 48), rimMat);
  moonRim.position.copy(MOON_POS).multiplyScalar(1.002);
  moonRim.lookAt(0, 0, 0);
  moonRim.visible = false;
  scene.add(moonRim);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xf5f1de, fog: false, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const moon = new THREE.Mesh(new THREE.CircleGeometry(8, 48), moonMat);
  moon.position.copy(MOON_POS);
  moon.lookAt(0, 0, 0);
  moon.visible = false;
  scene.add(moon);
  const haloMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xcdd8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(30);
  halo.position.copy(MOON_POS).multiplyScalar(0.99);
  halo.visible = false;
  scene.add(halo);

  const starMat = new THREE.PointsMaterial({
    size: 1.4, map: glowTexture(), color: 0xffffff, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const stars = (() => {
    const n = 400, R = 200, minY = 25;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = minY / R + rngSeed(i + 2000) * (1 - minY / R);
      const a = rngSeed(i + 3000) * Math.PI * 2, r = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(a) * r * R; pos[i * 3 + 1] = y * R; pos[i * 3 + 2] = Math.sin(a) * r * R;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, starMat);
    pts.frustumCulled = false; pts.visible = false;
    scene.add(pts);
    return pts;
  })();

  const colliders: World['colliders'] = [];

  // ---- Distant mountains (layered silhouettes) ----
  const mtnMats: THREE.MeshBasicMaterial[] = [];
  for (let layer = 0; layer < 3; layer++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x6f8a9e, fog: true });
    mtnMats.push(mat);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + layer * 0.2;
      const r = 120 + layer * 22;
      const m = new THREE.Mesh(new THREE.ConeGeometry(18 + rngSeed(i + layer * 20) * 20, 26 + rngSeed(i * 3 + layer) * 26 - layer * 5, 6), mat);
      m.position.set(Math.cos(a) * r, 8, Math.sin(a) * r);
      m.scale.z = 0.7;
      scene.add(m);
    }
  }

  // ---- Ground ----
  const grassT = grassTexture([48, 48]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), lamb(0xffffff, { map: grassT }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const pave = stoneTexture([150, 144, 134], [3, 14]);
  // Lối đi chính: tấm lát paveCompound phủ tới z=44, chỉ còn dải 1m từ mép tấm lát ra tới cổng
  const pathS = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), lamb(0xffffff, { map: pave }));
  pathS.rotation.x = -Math.PI / 2;
  pathS.position.set(0, 0.02, 44.5);
  pathS.receiveShadow = true; scene.add(pathS);

  const stoneM = lamb(0xcfc4ae, { map: stoneTexture([200, 192, 174], [4, 1]) });
  void stoneM;
  const redM = lamb(0xa8281a, { roughness: 0.6 });
  const wallM = lamb(0xf3e6c6);
  const goldM = lamb(0xd7a93a, { metalness: 0.5, roughness: 0.35, emissive: 0x3a2806 });
  const tileM = lamb(0x7a2a1d, { roughness: 0.55 });

  // ---- Incense urn ----
  const altar = new THREE.Group();
  const bronze = lamb(0xa8741f, { metalness: 0.7, roughness: 0.38 });
  const tbl = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 3.4), lamb(0x6d4426));
  tbl.position.y = 0.25; tbl.castShadow = true; altar.add(tbl);
  const urn = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.75, 1.5, 20), bronze);
  urn.position.y = 1.25; urn.castShadow = true; altar.add(urn);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 24), bronze);
  rim.rotation.x = Math.PI / 2; rim.position.y = 2; altar.add(rim);
  for (const s of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 12), bronze);
    handle.position.set(s * 1.15, 1.8, 0); handle.rotation.y = Math.PI / 2; altar.add(handle);
  }
  const sticks = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.8, 4), lamb(0x8a1f18));
    st.position.set((rngSeed(i) - 0.5) * 1.3, 2.35, (rngSeed(i + 9) - 0.5) * 1.3);
    st.rotation.set((rngSeed(i + 3) - 0.5) * 0.3, 0, (rngSeed(i + 5) - 0.5) * 0.3);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
    tip.position.y = 0.4; st.add(tip); sticks.add(st);
  }
  altar.add(sticks);
  altar.position.set(0, 0, -13);
  scene.add(altar);
  colliders.push({ x: 0, z: -13, r: 1.9 });

  // ---- Trees (rounded canopies) + bushes + flowers (instanced) ----
  const trunkG = new THREE.CylinderGeometry(0.2, 0.34, 2.2, 8);
  const trunkM = lamb(0x6b4a2b);
  const canopyG = new THREE.IcosahedronGeometry(1, 1);
  const canopyMs = [lamb(0x3f8a3e, { flatShading: true }), lamb(0x4e9c45, { flatShading: true }), lamb(0x2f7a40, { flatShading: true })];
  const treeSpots: { x: number; z: number; s: number; v: number }[] = [];
  for (let i = 0; i < 400 && treeSpots.length < 90; i++) {
    const x = (rngSeed(i) - 0.5) * 2 * (MAP_HALF + 24), z = (rngSeed(i + 100) - 0.5) * 2 * (MAP_HALF + 24);
    if (blocked(x, z)) continue;
    // Vườn Cây: không scatter cây trong rào (x −55..−41, z 11..23); cây góc dời ra
    // (−57,25) — giữ trống quanh đó để khỏi trồng đè; cây góc cũ (−53.7,23.4) là
    // scatter i=138, nằm ngoài rect 0.4 m nên loại riêng bằng bán kính (cây bóng mát
    // trong vườn do vuoncay.ts trồng cố định, không qua scatter).
    if (x >= -55 && x <= -41 && z >= 11 && z <= 23) continue;
    if (Math.hypot(x + 57, z - 25) < 2) continue;
    if (Math.hypot(x + 53.7, z - 23.4) < 2) continue;
    treeSpots.push({ x, z, s: 0.85 + rngSeed(i + 7) * 0.9, v: i % 4 });
  }
  treeSpots.forEach(({ x, z, s, v }) => {
    if (v === 3) return;
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(trunkG, trunkM); trunk.position.y = 1.1; trunk.castShadow = true; t.add(trunk);
    const mat = canopyMs[v % 3];
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(canopyG, mat);
      c.scale.setScalar(1.5 - k * 0.22);
      c.position.set((k - 1) * 0.5 * (k % 2 ? 1 : -1), 2.9 + k * 0.7, k * 0.2 - 0.2);
      c.castShadow = true; t.add(c);
    }
    t.position.set(x, 0, z); t.scale.setScalar(s); t.rotation.y = rngSeed(x + z) * 6;
    scene.add(t);
    colliders.push({ x, z, r: 0.5 * s });
  });

  const flowerCount = 420;
  const flowerM = new THREE.MeshStandardMaterial({ roughness: 0.7, emissive: 0x201010 });
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 6, 5), flowerM, flowerCount);
  const dummy = new THREE.Object3D();
  const palette = [0xff8fb6, 0xffffff, 0xffd35a, 0xff7a6a, 0xc79bff].map((c) => new THREE.Color(c));
  for (let i = 0; i < flowerCount; i++) {
    let x: number, z: number, tries = 0;
    do { x = (rngSeed(i + 500 + tries * 1000) - 0.5) * 2 * MAP_HALF * 0.95; z = (rngSeed(i + 900 + tries * 1000) - 0.5) * 2 * MAP_HALF * 0.95; tries++; }
    while (blocked(x, z) && tries < 10);
    dummy.position.set(x, 0.1, z); dummy.scale.setScalar(blocked(x, z) ? 0 : 0.7 + rngSeed(i) * 0.9); dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix); flowers.setColorAt(i, palette[i % palette.length]);
  }
  scene.add(flowers);

  // Bụi cỏ dạng khối cứng quanh quảng trường đã được loại bỏ hoàn toàn (xem paveCompound):
  // mặt sân nay là gạch đá phẳng, không còn các "cục" hình học lổn nhổn giữa khuôn viên.

  // ---- Đèn lồng đỏ treo cột gỗ (dọc lối đi) với glow ----
  const glowers: THREE.MeshStandardMaterial[] = [];
  const glowSprites: THREE.Sprite[] = [];
  const lampSpots: { x: number; z: number }[] = [];
  const addLamp = (x: number, z: number) => {
    lampSpots.push({ x, z });
    colliders.push({ x, z, r: 0.35 });
  };
  // Walkway lamp posts (news 100): z=-11.3 (not -9) clears the sutra pillars by ~0.34 m
  // and keeps the post collider 0.13 m off the pillar collider; z=19,26 moved out to
  // x=±9.5 so the posts stand on dry land (the koi lake spans x ±4 at those z).
  // The lamps at (±9.5) hang at x=±8.5, 0.30 m (z=19) / 1.41 m (z=26) off the water.
  for (const [x, z] of [[-4, 40], [4, 40], [-4, 33], [4, 33], [-9.5, 26], [9.5, 26], [-9.5, 19], [9.5, 19], [-4, 12], [4, 12], [-4, 5], [4, 5], [-4, -2], [4, -2], [-4, -11.3], [4, -11.3], [-4, -16], [4, -16]] as const) addLamp(x, z);
  loadModel('hanging_lantern').then((base) => {
    if (!base) return;
    for (const p of lampSpots) {
      const g = new THREE.Group();
      const inst = base.clone(true);
      inst.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const tint = (mat: THREE.Material): THREE.Material => {
          if (mat.name !== 'vermil') return mat;
          const c = (mat as THREE.MeshStandardMaterial).clone();
          c.emissive.set(0xc02010); c.emissiveIntensity = 1.2;
          glowers.push(c);
          return c;
        };
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(tint) : tint(mesh.material);
      });
      g.add(inst);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffb040, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
      spr.scale.setScalar(2.6); spr.position.set(1.0, 2.0, 0); g.add(spr); glowSprites.push(spr);
      g.rotation.y = p.x < 0 ? 0 : Math.PI;
      g.position.set(p.x, 0, p.z); scene.add(g);
    }
  });

  // ---- Giá treo quẻ gần Chính Điện (prop cho tính năng xin xăm R2.1 sau này, chưa có mechanic) ----
  colliders.push({ x: 24, z: -24, r: 1.1 });
  loadModel('omikuji_rack').then((base) => {
    if (!base) return;
    const inst = base.clone(true);
    inst.rotation.y = -Math.PI / 2;
    inst.position.set(24, 0, -24);
    scene.add(inst);
  });

  // Bảng gỗ chú thích ống xin xăm (đầu nam của ống, mặt quay về hướng tây)
  {
    const omikujiSignPostMat = lamb(0x5a3a22);
    for (const pz of [-22.5, -20.3]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 0.12), omikujiSignPostMat);
      post.position.set(24, 0.95, pz);
      scene.add(post);
      colliders.push({ x: 24, z: pz, r: 0.3 });
    }
    const omikujiSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.65),
      new THREE.MeshBasicMaterial({ map: signTexture2Lines('Xin xăm', '— chạm vào ống để xin quẻ') }),
    );
    omikujiSign.rotation.y = -Math.PI / 2;
    omikujiSign.position.set(23.93, 1.5, -21.4);
    scene.add(omikujiSign);
  }

  // ---- Bảng ước nguyện gần sân plaza (prop trang trí, chưa có mechanic) ----
  colliders.push({ x: 12, z: 6, r: 1.2 });
  loadModel('ema_rack').then((base) => {
    if (!base) return;
    const inst = base.clone(true);
    inst.rotation.y = -Math.PI / 2;
    inst.position.set(12, 0, 6);
    scene.add(inst);
  });

  // ---- Hanging red lanterns ----
  const redGeo = new THREE.SphereGeometry(0.34, 14, 12);
  const redBase = new THREE.MeshStandardMaterial({ color: 0xd8321c, emissive: 0xc02010, emissiveIntensity: 1.2, roughness: 0.5 });
  const redLanterns: THREE.Mesh[] = [];
  const stringPts: THREE.Vector3[] = [];
  const N = 20;
  // Ring lanterns moved off obstacles (news 100): angle offsets in radians, minimal
  // moves that clear by >= 0.20 m — ring-1/9 off the swing-oak hanging foliage
  // (news 93 grew the trees into them), ring-14/16 off the sutra pillars.
  const RING_OFF: Record<number, number> = { 1: 0.092, 9: 0.096, 14: -0.036, 16: 0.048 };
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + (RING_OFF[i] ?? 0);
    const x = Math.cos(a) * 12.5, z = 8 + Math.sin(a) * 12.5, y = 4.6 + Math.sin(i * 1.7) * 0.35;
    const m = new THREE.Mesh(redGeo, redBase); m.scale.set(1, 1.2, 1); m.position.set(x, y, z); scene.add(m); redLanterns.push(m);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 8), goldM); cap.position.set(x, y + 0.43, z); scene.add(cap);
    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 6), lamb(0xe8b64a)); tassel.position.set(x, y - 0.55, z); tassel.rotation.x = Math.PI; scene.add(tassel);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff4a28, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(2.2); spr.position.set(x, y, z); scene.add(spr); glowSprites.push(spr);
    stringPts.push(new THREE.Vector3(x, y + 0.5, z));
    if (i % 4 === 0) { // posts holding the string
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, y + 0.5, 6), lamb(0x5a3a22));
      pole.position.set(x, (y + 0.5) / 2, z); scene.add(pole);
    }
  }
  stringPts.push(stringPts[0].clone());
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(stringPts, true).getPoints(160)),
    new THREE.LineBasicMaterial({ color: 0x3a2412 })));

  const temple = buildTemple({ scene, colliders, lamb, roofGeometry, tileM, redM, goldM, wallM, redBase, glowSprites, renderer });
  buildSeatedBuddhaStatue(scene, renderer, colliders);
  buildGarden(scene, colliders);
  buildVuonCay(scene, colliders);
  buildMarket(scene, colliders);

  // ---- Sửa cảnh quan khuôn viên ----
  // 1) bỏ hết bụi cỏ dạng khối cứng còn sót; 2) lát mặt sân gạch phẳng sạch sẽ
  removeSolidGrassClumps(scene);
  paveCompound(scene);
  void LAKE; void HALL;

  // ---- Clouds ----
  const clouds: THREE.Group[] = [];
  const cloudM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(5 + rngSeed(i * 7 + k) * 5, 10, 8), cloudM);
      p.position.set(k * 6 - 12, rngSeed(k + i) * 3, rngSeed(k * 3 + i) * 4); p.scale.y = 0.45; c.add(p);
    }
    c.position.set((rngSeed(i) - 0.5) * 260, 60 + rngSeed(i + 5) * 25, (rngSeed(i + 30) - 0.5) * 220 - 40);
    scene.add(c); clouds.push(c);
  }

  // ---- Dynamic particles: falling petals + fireflies ----
  const petals = (() => {
    const n = 90;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (rngSeed(i) - 0.5) * 70; pos[i * 3 + 1] = rngSeed(i + 1) * 14; pos[i * 3 + 2] = (rngSeed(i + 2) - 0.5) * 70; seed[i] = rngSeed(i + 3); }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geom, new THREE.PointsMaterial({ size: 0.38, map: petalTexture(), transparent: true, depthWrite: false, alphaTest: 0.05 }));
    pts.frustumCulled = false; scene.add(pts);
    return { pts, pos, seed, n };
  })();
  const flies = (() => {
    const n = 60;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (rngSeed(i + 70) - 0.5) * 60; pos[i * 3 + 1] = 0.6 + rngSeed(i + 71) * 2.6; pos[i * 3 + 2] = (rngSeed(i + 72) - 0.5) * 60; }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size: 0.4, map: glowTexture(), color: 0xfff3a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const pts = new THREE.Points(geom, m); pts.frustumCulled = false; scene.add(pts);
    return { pts, pos, n, m };
  })();

  // ---- Effects: floating lanterns, incense smoke, bursts ----
  const floaters: { m: THREE.Object3D; vy: number; life: number; max: number; light?: THREE.Sprite; fade?: number }[] = [];
  const smoke: { m: THREE.Sprite; life: number; vx: number }[] = [];
  const burst: { m: THREE.Sprite; v: THREE.Vector3; life: number }[] = [];
  const smokeMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xdddddd, transparent: true, opacity: 0.5, depthWrite: false });

  let lanternModel: THREE.Object3D | null = null;
  loadModel('lantern').then((m) => { if (m) lanternModel = fitModel(m, 0.8); });
  const floatGeo = new THREE.CylinderGeometry(0.3, 0.38, 0.6, 10);
  const spawnLantern = (x: number, z: number) => {
    const grp = new THREE.Group();
    if (lanternModel) grp.add(lanternModel.clone(true));
    else {
      const mat = new THREE.MeshStandardMaterial({ color: 0xffa938, emissive: 0xff8c1a, emissiveIntensity: 1.8 });
      grp.add(new THREE.Mesh(floatGeo, mat));
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.2, 10), lamb(0xb85a18)); top.position.y = 0.4; grp.add(top);
    }
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffa030, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(2.4); grp.add(spr);
    grp.position.set(x + (Math.random() - 0.5) * 0.6, 1.6, z + (Math.random() - 0.5) * 0.6);
    scene.add(grp);
    floaters.push({ m: grp, vy: 0.9 + Math.random() * 0.5, life: 16, max: 16, light: spr });
  };
  const spawnIncense = (x: number, z: number) => {
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Sprite(smokeMat.clone());
      s.position.set(x + (Math.random() - 0.5) * 0.5, 1.3 + i * 0.12, z + (Math.random() - 0.5) * 0.5);
      s.scale.setScalar(0.35); scene.add(s);
      smoke.push({ m: s, life: 2.2 + Math.random() * 1.2, vx: (Math.random() - 0.5) * 0.3 });
    }
  };
  const spawnBurst = (x: number, z: number, color = 0xffd36b) => {
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(0.45); s.position.set(x, 1.5, z); scene.add(s);
      const a = Math.random() * Math.PI * 2, sp = 1.2 + Math.random() * 2;
      burst.push({ m: s, v: new THREE.Vector3(Math.cos(a) * sp, 2 + Math.random() * 2, Math.sin(a) * sp), life: 1.1 });
    }
  };

  // ---- Đèn trời + pháo hoa ----
  // Màu quả pháo, luân phiên theo thứ tự quả trong màn.
  const FW_COLORS = [0xffd36b, 0xff5a4a, 0x7ddc6a, 0x6ab8d8, 0xc58cff];
  // Màn có nhịp nổ >= 3s được coi là show lớn (rồng phượng) và có thêm màn kết.
  const FINALE_MIN_GAP_MS = 3000;
  const FINALE_SHELLS = 3;

  /** Đèn trời: bay chậm (vy ~0,8), sống 45s, mờ dần 5s cuối. Tái dùng model + glow của đèn hồ. */
  const spawnSkyLantern = (x: number, z: number) => {
    const grp = new THREE.Group();
    if (lanternModel) grp.add(lanternModel.clone(true));
    else {
      const mat = new THREE.MeshStandardMaterial({ color: 0xffa938, emissive: 0xff8c1a, emissiveIntensity: 1.8 });
      grp.add(new THREE.Mesh(floatGeo, mat));
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.2, 10), lamb(0xb85a18)); top.position.y = 0.4; grp.add(top);
    }
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffb04a, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(2.6); grp.add(spr);
    grp.position.set(x + (Math.random() - 0.5) * 1.4, 2.2, z + (Math.random() - 0.5) * 1.4);
    scene.add(grp);
    floaters.push({ m: grp, vy: 0.7 + Math.random() * 0.2, life: 45, max: 45, fade: 5, light: spr });
  };

  // Rocket materials are shared per color (rockets never mutate opacity).
  // Sparks keep one material per sprite: the update loop fades EACH spark by
  // writing material.opacity from its own remaining life — sharing would make
  // all sparks of one color fade in lockstep.
  const rocketMatCache = new Map<number, THREE.SpriteMaterial>();
  const rocketMat = (color: number) => {
    let m = rocketMatCache.get(color);
    if (!m) {
      m = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
      rocketMatCache.set(color, m);
    }
    return m;
  };

  // Tàn pháo (sprite toả cầu) + rocket đang chờ/bay lên.
  const sparks: { m: THREE.Sprite; v: THREE.Vector3; life: number }[] = [];
  const rockets: { m: THREE.Sprite; x: number; z: number; top: number; vy: number; delay: number; color: number }[] = [];

  /** Một quả nổ tại (x, y, z): 24-40 sprite toả hình cầu, tốc độ 4-9, trọng lực 6, sống 1,5-2,5s. */
  const explodeShell = (x: number, y: number, z: number, color: number) => {
    const n = 24 + Math.floor(Math.random() * 17);
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(0.5 + Math.random() * 0.35);
      s.position.set(x, y, z);
      scene.add(s);
      const up = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.max(0, 1 - up * up));
      const sp = 4 + Math.random() * 5;
      sparks.push({ m: s, v: new THREE.Vector3(rr * Math.cos(a) * sp, up * sp, rr * Math.sin(a) * sp), life: 1.5 + Math.random() });
    }
  };

  /** Bắn 1 màn pháo hoa tại (x, z). Không phát âm thanh - main.ts lo phần âm khi nhận broadcast. */
  const spawnFirework = (x: number, z: number, size: FireworkSize) => {
    const cfg = FIREWORKS[size];
    const shells = Math.max(1, Math.round(cfg.shells));
    const gapMs = cfg.intervalMs;
    const finale = cfg.intervalMs >= FINALE_MIN_GAP_MS ? FINALE_SHELLS : 0;
    const lastAt = ((shells - 1) * gapMs) / 1000;
    for (let i = 0; i < shells + finale; i++) {
      const isFinale = i >= shells;
      const delay = isFinale ? lastAt + 1 : (i * gapMs) / 1000;
      const color = FW_COLORS[i % FW_COLORS.length];
      const spread = isFinale ? 12 : 6;
      const px = x + (Math.random() - 0.5) * spread;
      const pz = z + (Math.random() - 0.5) * spread;
      const y0 = 1.4, top = 25 + Math.random() * 10;
      const spr = new THREE.Sprite(rocketMat(color));
      spr.scale.setScalar(0.7);
      spr.position.set(px, y0, pz);
      spr.visible = delay <= 0;
      scene.add(spr);
      rockets.push({ m: spr, x: px, z: pz, top, vy: (top - y0) / (0.9 + Math.random() * 0.25), delay, color });
    }
  };
  // always-on smoke from the urn
  let urnT = 0;

  // ---- Mood + chu kỳ ngày/đêm theo giờ thật ----
  let nightK = 0, nightTarget = 0;
  let cycleEnabled = true;   // Vô Lượng / Từ Bi chạy theo giờ thật; An Lạc giữ đêm cố định
  let firstFrame = true;     // frame đầu: snap thẳng tới palette mục tiêu, không lerp từ "ngày"

  type SkyHex = (typeof SERENE_SKY)['day'];
  interface Look {
    horizon: THREE.Color; zenith: THREE.Color; sun: THREE.Color; hemi: THREE.Color; fog: THREE.Color;
    fogDensity: number; sunI: number; hemiI: number; night: number; sunOff: THREE.Vector3;
  }
  const newLook = (): Look => ({
    horizon: new THREE.Color(), zenith: new THREE.Color(), sun: new THREE.Color(), hemi: new THREE.Color(), fog: new THREE.Color(),
    fogDensity: 0, sunI: 0, hemiI: 0, night: 0, sunOff: new THREE.Vector3(),
  });
  const makeLook = (p: SkyHex, sunI: number, hemiI: number, night: number, off: [number, number, number]): Look => {
    const L = newLook();
    L.horizon.set(p.horizon); L.zenith.set(p.zenith); L.sun.set(p.sun); L.hemi.set(p.hemi); L.fog.set(p.fog);
    L.fogDensity = p.fogDensity; L.sunI = sunI; L.hemiI = hemiI; L.night = night; L.sunOff.set(off[0], off[1], off[2]);
    return L;
  };
  const mix = (x: number, y: number, s: number) => x + (y - x) * s;
  const lerpLook = (o: Look, a: Look, b: Look, s: number) => {
    o.horizon.lerpColors(a.horizon, b.horizon, s); o.zenith.lerpColors(a.zenith, b.zenith, s);
    o.sun.lerpColors(a.sun, b.sun, s); o.hemi.lerpColors(a.hemi, b.hemi, s); o.fog.lerpColors(a.fog, b.fog, s);
    o.fogDensity = mix(a.fogDensity, b.fogDensity, s); o.sunI = mix(a.sunI, b.sunI, s);
    o.hemiI = mix(a.hemiI, b.hemiI, s); o.night = mix(a.night, b.night, s);
    o.sunOff.lerpVectors(a.sunOff, b.sunOff, s);
  };
  /** Lerp mũ palette "hiện tại" về palette mục tiêu (cùng kiểu với nightK). */
  const approachLook = (c: Look, g: Look, k: number) => {
    c.horizon.lerp(g.horizon, k); c.zenith.lerp(g.zenith, k); c.sun.lerp(g.sun, k);
    c.hemi.lerp(g.hemi, k); c.fog.lerp(g.fog, k);
    c.fogDensity = mix(c.fogDensity, g.fogDensity, k); c.sunI = mix(c.sunI, g.sunI, k);
    c.hemiI = mix(c.hemiI, g.hemiI, k); c.sunOff.lerp(g.sunOff, k);
  };

  const DAWN_SKY: SkyHex = { horizon: 0xffd9e8, zenith: 0x8fb4e0, sun: 0xffd9b0, hemi: 0xffe9f2, fog: 0xf2d9e8, fogDensity: 0.0062 };
  const LOOK_DAY = makeLook(SERENE_SKY.day, 2.2, 1.05, 0, [-26, 38, 22]);
  const LOOK_DAWN = makeLook(DAWN_SKY, 1.5, 1.0, 0.4, [38, 14, 22]);
  const LOOK_DUSK = makeLook(SERENE_SKY.dusk, 1.6, 0.95, 0.3, [-38, 14, 22]);
  // đèn "trăng" đặt cùng hướng với mặt trăng để bóng đổ và quầng sáng trong sky shader khớp
  const LOOK_NIGHT = makeLook(SERENE_SKY.night, 0.8, 0.7, 1, [-18, 26, -36]);
  const KEYS: { h: number; look: Look }[] = [
    { h: 0, look: LOOK_NIGHT }, { h: 5, look: LOOK_NIGHT }, { h: 5.5, look: LOOK_DAWN }, { h: 6.5, look: LOOK_DAY },
    { h: 17, look: LOOK_DAY }, { h: 18, look: LOOK_DUSK }, { h: 19, look: LOOK_NIGHT }, { h: 24, look: LOOK_NIGHT },
  ];
  const clockTarget = newLook();
  /** Giờ địa phương thật (đọc mỗi frame) -> Look mục tiêu, nội suy smoothstep giữa 2 keyframe kề nhau. */
  const clockLook = (d: Date): Look => {
    const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600 + d.getMilliseconds() / 3.6e6;
    let i = 0;
    while (i < KEYS.length - 2 && h >= KEYS[i + 1].h) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const f = Math.min(1, Math.max(0, (h - a.h) / (b.h - a.h)));
    lerpLook(clockTarget, a.look, b.look, f * f * (3 - 2 * f));
    return clockTarget;
  };

  const cur = makeLook(SERENE_SKY.day, 2.2, 1.05, 0, [-26, 38, 22]); // palette "hiện tại"
  const fixedLook = newLook();                                      // palette cố định của An Lạc
  const CLOUD_DAY = new THREE.Color(0xffffff), CLOUD_NIGHT = new THREE.Color(0x93a7cc);

  /** Áp palette hiện tại lên scene / sương / dome / đèn / núi xa (chạy mỗi frame). */
  const applyLook = (L: Look) => {
    if (scene.background instanceof THREE.Color) scene.background.copy(L.fog);
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.copy(L.fog); scene.fog.density = L.fogDensity; }
    skyU.horizon.value.copy(L.horizon); skyU.zenith.value.copy(L.zenith); skyU.sunCol.value.copy(L.sun);
    sun.color.copy(L.sun); sun.intensity = L.sunI;
    hemi.color.copy(L.hemi); hemi.intensity = L.hemiI;
    mtnMats.forEach((mm, i) => mm.color.copy(L.horizon).lerp(L.zenith, 0.35 + i * 0.12).multiplyScalar(0.9 - i * 0.06));
  };

  /** Chọn chế độ cho một phòng: vo-luong / tu-bi chạy chu kỳ theo giờ thật, an-lac giữ đêm cố định. */
  const setMood = (room: string) => {
    const m = MOODS[room] ?? MOODS['vo-luong'];
    cycleEnabled = !m.night;
    if (m.night) {
      fixedLook.horizon.set(m.sky); fixedLook.zenith.set(m.zenith); fixedLook.sun.set(m.sun);
      fixedLook.hemi.set(m.hemi); fixedLook.fog.set(m.sky);
      fixedLook.fogDensity = m.fog; fixedLook.sunI = m.sunI; fixedLook.hemiI = 0.85; fixedLook.night = 1;
      fixedLook.sunOff.set(-18, 26, -36); // cùng hướng trăng để bóng đổ + quầng sáng khớp
      nightTarget = 1;
    }
  };
  setMood('vo-luong');

  let last = 0;
  const update = (t: number, focus: THREE.Vector3) => {
    const dt = Math.min(0.1, t - last); last = t;
    // Driver chu kỳ: đọc giờ thật mỗi frame (không cache); An Lạc dùng palette đêm cố định.
    const goal = cycleEnabled ? clockLook(new Date()) : fixedLook;
    nightTarget = goal.night;
    const k = firstFrame ? 1 : Math.min(1, dt * 2);
    firstFrame = false;
    approachLook(cur, goal, k);
    applyLook(cur);
    nightK += (nightTarget - nightK) * k;
    // mây: trắng 0.85 (ngày) -> xanh xám ánh trăng 0.55 (đêm)
    cloudM.color.copy(CLOUD_DAY).lerp(CLOUD_NIGHT, nightK);
    cloudM.opacity = mix(0.85, 0.55, nightK);
    // trăng: 0 khi nightK ~ 0, đủ 1 khi nightK >= 0.8; sao: nightK * 0.9
    const moonA = Math.min(1, Math.max(0, nightK / 0.8));
    moonMat.opacity = moonA; haloMat.opacity = moonA * 0.6; rimMat.opacity = moonA;
    moon.visible = moonA > 0.01; halo.visible = moonA > 0.01; moonRim.visible = moonA > 0.01;
    starMat.opacity = nightK * 0.9; stars.visible = nightK > 0.01;
    glowers.forEach((m, i) => (m.emissiveIntensity = (1.1 + nightK * 1.4) + Math.sin(t * 3 + i * 1.7) * 0.18));
    glowSprites.forEach((s, i) => ((s.material as THREE.SpriteMaterial).opacity = (0.45 + nightK * 0.4) * (0.85 + Math.sin(t * 2.4 + i) * 0.15)));
    redBase.emissiveIntensity = 0.9 + nightK * 1.1;
    flies.m.opacity = 0.2 + nightK * 0.8;
    redLanterns.forEach((m, i) => { m.position.y += Math.sin(t * 1.5 + i) * 0.0016; m.rotation.z = Math.sin(t * 1.2 + i) * 0.05; });
    clouds.forEach((c, i) => { c.position.x += dt * (0.8 + (i % 3) * 0.3); if (c.position.x > 170) c.position.x = -170; });
    // falling petals, wrapped around the player
    for (let i = 0; i < petals.n; i++) {
      let y = petals.pos[i * 3 + 1] - dt * (0.7 + petals.seed[i] * 0.7);
      let x = petals.pos[i * 3] + Math.sin(t * 0.8 + petals.seed[i] * 20) * dt * 1.2;
      let z = petals.pos[i * 3 + 2] + dt * 0.4;
      if (y < 0.05) y = 12 + petals.seed[i] * 4;
      if (x - focus.x > 35) x -= 70; else if (x - focus.x < -35) x += 70;
      if (z - focus.z > 35) z -= 70; else if (z - focus.z < -35) z += 70;
      petals.pos[i * 3] = x; petals.pos[i * 3 + 1] = y; petals.pos[i * 3 + 2] = z;
    }
    petals.pts.geometry.attributes.position.needsUpdate = true;
    for (let i = 0; i < flies.n; i++) {
      flies.pos[i * 3] += Math.sin(t * 0.7 + i) * dt * 0.6;
      flies.pos[i * 3 + 1] += Math.cos(t * 0.9 + i * 2) * dt * 0.3;
      flies.pos[i * 3 + 2] += Math.cos(t * 0.6 + i * 3) * dt * 0.6;
      if (flies.pos[i * 3] - focus.x > 30) flies.pos[i * 3] -= 60; else if (flies.pos[i * 3] - focus.x < -30) flies.pos[i * 3] += 60;
      if (flies.pos[i * 3 + 2] - focus.z > 30) flies.pos[i * 3 + 2] -= 60; else if (flies.pos[i * 3 + 2] - focus.z < -30) flies.pos[i * 3 + 2] += 60;
    }
    flies.pts.geometry.attributes.position.needsUpdate = true;

    temple.update(t, dt);
    urnT += dt;
    if (urnT > 0.5) { urnT = 0; const s = new THREE.Sprite(smokeMat.clone()); s.position.set(altar.position.x + (Math.random() - 0.5) * 0.5, 2.7, altar.position.z + (Math.random() - 0.5) * 0.5); s.scale.setScalar(0.3); scene.add(s); smoke.push({ m: s, life: 3.2, vx: 0.15 }); }

    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.m.position.y += f.vy * dt;
      f.m.position.x += Math.sin(t + i) * 0.25 * dt;
      f.m.rotation.y += dt * 0.5;
      f.life -= dt;
      if (f.light) (f.light.material as THREE.SpriteMaterial).opacity = Math.min(0.9, f.life / (f.fade ?? 3)) * (0.8 + Math.sin(t * 6 + i) * 0.2);
      if (f.life <= 0) { scene.remove(f.m); floaters.splice(i, 1); }
    }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.m.position.y += 0.6 * dt; s.m.position.x += s.vx * dt;
      s.m.scale.addScalar(dt * 0.55);
      (s.m.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.min(0.5, s.life * 0.18));
      s.life -= dt;
      if (s.life <= 0) { scene.remove(s.m); (s.m.material as THREE.Material).dispose(); smoke.splice(i, 1); }
    }
    for (let i = burst.length - 1; i >= 0; i--) {
      const b = burst[i];
      b.v.y -= 6 * dt;
      b.m.position.addScaledVector(b.v, dt);
      b.life -= dt;
      (b.m.material as THREE.SpriteMaterial).opacity = Math.max(0, b.life);
      if (b.life <= 0) { scene.remove(b.m); (b.m.material as THREE.Material).dispose(); burst.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.v.y -= 6 * dt;
      s.m.position.addScaledVector(s.v, dt);
      s.life -= dt;
      (s.m.material as THREE.SpriteMaterial).opacity = Math.max(0, Math.min(1, s.life));
      if (s.life <= 0) { scene.remove(s.m); (s.m.material as THREE.Material).dispose(); sparks.splice(i, 1); }
    }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      if (r.delay > 0) {
        r.delay -= dt;
        if (r.delay <= 0) r.m.visible = true;
        continue;
      }
      r.m.position.y += r.vy * dt;
      if (r.m.position.y >= r.top) {
        explodeShell(r.x, r.top, r.z, r.color);
        scene.remove(r.m);
        rockets.splice(i, 1);
      }
    }
    // keep the shadow frustum centered on the player; hướng mặt trời theo phase hiện tại
    sun.target.position.set(focus.x, 0, focus.z);
    sun.position.set(focus.x + cur.sunOff.x, cur.sunOff.y, focus.z + cur.sunOff.z);
    skyU.sunDir.value.copy(cur.sunOff).normalize();
  };

  return { scene, ground, colliders, update, spawnLantern, spawnIncense, spawnBurst, spawnSkyLantern, spawnFirework, setMood, altar: altar.position.clone(), sun, seats: temple.seats, zoneAt: temple.zoneAt, resolveWater, groundY, ringBell: temple.ringBell, ringDrum: temple.ringDrum, setHonorBoard: temple.setHonorBoard, setStele: temple.setStele, noticeBoard: temple.noticeBoard };
}
