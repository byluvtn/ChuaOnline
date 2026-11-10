import * as THREE from 'three';
import { MAP_HALF } from '../shared/types';
import { fitModel, loadModel } from './models';
import { applySkyPalette, paveCompound, removeSolidGrassClumps, SERENE_SKY } from './compound';
import { glowTexture, grassTexture, petalTexture, signTexture, stoneTexture } from './textures';
import { geo, outlined, toon } from './toon';
import { blocked, LAKE, HALL, PLAZA } from './layout';
import { buildTemple, groundY, resolveWater, type Seat } from './temple';

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
  setMood(room: string): void;
  altar: THREE.Vector3;
  sun: THREE.DirectionalLight;
  seats: Seat[];
  zoneAt(x: number, z: number): string | null;
  resolveWater(p: { x: number; z: number }): void;
  groundY(x: number, z: number): number;
  ringBell(): void;
  ringDrum(): void;
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

export function createWorld(): World {
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
  // Lối đi chính chia làm hai đoạn, chừa hẳn lòng hồ sen ở giữa khuôn viên
  const pathN = new THREE.Mesh(new THREE.PlaneGeometry(6, PLAZA.z + PLAZA.r - (LAKE.z - LAKE.b - 0.8)), lamb(0xffffff, { map: pave }));
  pathN.rotation.x = -Math.PI / 2;
  pathN.position.set(0, 0.02, (PLAZA.z + PLAZA.r + (LAKE.z - LAKE.b - 0.8)) / 2);
  pathN.receiveShadow = true; scene.add(pathN);
  const pathS = new THREE.Mesh(new THREE.PlaneGeometry(6, 45 - (LAKE.z + LAKE.b + 0.8)), lamb(0xffffff, { map: pave }));
  pathS.rotation.x = -Math.PI / 2;
  pathS.position.set(0, 0.02, (45 + (LAKE.z + LAKE.b + 0.8)) / 2);
  pathS.receiveShadow = true; scene.add(pathS);
  const plazaT = stoneTexture([166, 158, 142], [5, 5], 6);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA.r, 48), lamb(0xffffff, { map: plazaT }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(PLAZA.x, 0.03, PLAZA.z); plaza.receiveShadow = true;
  scene.add(plaza);
  // inner mandala ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.75, 48), lamb(0xb78a3a, { emissive: 0x3a2808 }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(PLAZA.x, 0.045, PLAZA.z);
  scene.add(ring);
  const lotusFlat = new THREE.Mesh(new THREE.CircleGeometry(3.3, 8), lamb(0xdba3b6, { emissive: 0x30121c }));
  lotusFlat.rotation.x = -Math.PI / 2; lotusFlat.position.set(PLAZA.x, 0.04, PLAZA.z);
  scene.add(lotusFlat);

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
  const blossomM = lamb(0xf4a3bc, { flatShading: true, emissive: 0x2b0f18 });
  const treeSpots: { x: number; z: number; s: number; v: number }[] = [];
  for (let i = 0; i < 400 && treeSpots.length < 90; i++) {
    const x = (rngSeed(i) - 0.5) * 2 * (MAP_HALF + 24), z = (rngSeed(i + 100) - 0.5) * 2 * (MAP_HALF + 24);
    if (blocked(x, z)) continue;
    treeSpots.push({ x, z, s: 0.85 + rngSeed(i + 7) * 0.9, v: i % 4 });
  }
  treeSpots.forEach(({ x, z, s, v }) => {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(trunkG, trunkM); trunk.position.y = 1.1; trunk.castShadow = true; t.add(trunk);
    const mat = v === 3 ? blossomM : canopyMs[v % 3];
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

  // ---- Stone lamps (path edge) with glow ----
  const glowers: THREE.MeshStandardMaterial[] = [];
  const glowSprites: THREE.Sprite[] = [];
  const lampStone = lamb(0x9a9387);
  const addLamp = (x: number, z: number) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.35, 8), lampStone); base.position.y = 0.17; g.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 8), lampStone); post.position.y = 0.95; post.castShadow = true; g.add(post);
    const m = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xff9c2a, emissiveIntensity: 1.6 });
    glowers.push(m);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.5, 0.58), m); box.position.y = 1.8; g.add(box);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.4, 4), lamb(0x4a3020)); cap.position.y = 2.28; cap.rotation.y = Math.PI / 4; cap.castShadow = true; g.add(cap);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffb040, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    spr.scale.setScalar(2.6); spr.position.y = 1.8; g.add(spr); glowSprites.push(spr);
    g.position.set(x, 0, z); scene.add(g);
    colliders.push({ x, z, r: 0.35 });
  };
  for (let z = 40; z > -19; z -= 7) { addLamp(-4, z); addLamp(4, z); }

  // ---- Hanging red lanterns ----
  const redGeo = new THREE.SphereGeometry(0.34, 14, 12);
  const redBase = new THREE.MeshStandardMaterial({ color: 0xd8321c, emissive: 0xc02010, emissiveIntensity: 1.2, roughness: 0.5 });
  const redLanterns: THREE.Mesh[] = [];
  const stringPts: THREE.Vector3[] = [];
  const N = 20;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
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

  const temple = buildTemple({ scene, colliders, lamb, roofGeometry, tileM, redM, goldM, wallM, redBase, glowSprites });

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
  const floaters: { m: THREE.Object3D; vy: number; life: number; max: number; light?: THREE.Sprite }[] = [];
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
  // always-on smoke from the urn
  let urnT = 0;

  // ---- Mood ----
  let nightK = 0, nightTarget = 0;
  /** Áp bảng màu trời + sương + đèn cho một phòng (vo-luong / tu-bi / an-lac). */
  const setMood = (room: string) => {
    const m = MOODS[room] ?? MOODS['vo-luong'];
    // dựng palette từ mood rồi áp qua helper chung của compound.ts
    const pal = {
      horizon: new THREE.Color(m.sky).getHex(), zenith: new THREE.Color(m.zenith).getHex(),
      sun: new THREE.Color(m.sun).getHex(), hemi: new THREE.Color(m.hemi).getHex(),
      fog: new THREE.Color(m.sky).getHex(), fogDensity: m.fog, night: m.night,
    };
    applySkyPalette(scene, skyU, pal);
    skyU.sunCol.value.set(m.sun);
    sun.color.set(m.sun); sun.intensity = m.sunI; hemi.color.set(m.hemi);
    hemi.intensity = m.night ? 0.85 : 1.05;
    mtnMats.forEach((mm, i) => mm.color.set(m.sky).lerp(new THREE.Color(m.zenith), 0.35 + i * 0.12).multiplyScalar(0.9 - i * 0.06));
    nightTarget = m.night ? 1 : 0;
  };
  setMood('vo-luong');

  let last = 0;
  const update = (t: number, focus: THREE.Vector3) => {
    const dt = Math.min(0.1, t - last); last = t;
    nightK += (nightTarget - nightK) * Math.min(1, dt * 2);
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
      if (f.light) (f.light.material as THREE.SpriteMaterial).opacity = Math.min(0.9, f.life / 3) * (0.8 + Math.sin(t * 6 + i) * 0.2);
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
    // keep the shadow frustum centered on the player
    sun.target.position.set(focus.x, 0, focus.z);
    sun.position.set(focus.x - 26, 38, focus.z + 22);
  };

  return { scene, ground, colliders, update, spawnLantern, spawnIncense, spawnBurst, setMood, altar: altar.position.clone(), sun, seats: temple.seats, zoneAt: temple.zoneAt, resolveWater, groundY, ringBell: temple.ringBell, ringDrum: temple.ringDrum };
}
