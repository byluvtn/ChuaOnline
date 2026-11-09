import * as THREE from 'three';
import { COUPLETS } from './couplets';
import { buildHall } from './hall';
import {
  BELL, BRIDGE, BUDDHA_YARD, CORR, DECK, LAKE, PAGODA, PATH_Z, QUAN, SIDE_X, WALL, bridgeY, groundY, inLake, resolveWater,
} from './layout';
import { buildBuddha, buildQuanAm } from './statues';
import { coupletTexture, glowTexture, hoanhPhiTexture, signTexture, stoneTexture, woodTexture } from './textures';
import { outlined, toon } from './toon';

export interface Seat { x: number; z: number; ry: number }
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

  // ---- main hall (open pavilion) ----
  const hall = buildHall(c);
  seats.push(...hall.seats); zones.push(...hall.zones);

  // ---- meditation decks (mở rộng) ----
  const woodM = lamb(0xffffff, { map: woodTexture([5, 3]) });
  const matM = lamb(0xe8b83a, { roughness: 0.95 }), cushM = lamb(0xa0201a, { roughness: 0.8 });
  const rows = [-17.6, -16.1, -14.6, -13.1, -11.6, -10.1, -8.6, -7.1, -5.6];
  const cols = [5.7, 7.0, 8.3, 9.6, 10.9, 12.2, 13.5, 14.8, 16.1];
  const nSeats = rows.length * cols.length * 2;
  const mats = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.04, 1.05), matM, nSeats);
  const cush = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.38, 0.1, 16), cushM, nSeats);
  mats.receiveShadow = cush.receiveShadow = true;
  let k = 0;
  for (const side of [-1, 1]) {
    const w = DECK.x1 - DECK.x0, dz = DECK.z1 - DECK.z0;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, dz), woodM);
    deck.position.set(side * (DECK.x0 + w / 2), 0.1, (DECK.z0 + DECK.z1) / 2); deck.receiveShadow = deck.castShadow = true; scene.add(deck);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.08, dz + 0.3), lamb(0x5a3a22));
    edge.position.set(deck.position.x, 0.04, deck.position.z); scene.add(edge);
    for (const z of rows) for (const cx of cols) {
      const x = side * cx;
      d.position.set(x, DECK.y + 0.02, z); d.updateMatrix(); mats.setMatrixAt(k, d.matrix);
      d.position.set(x, DECK.y + 0.09, z); d.updateMatrix(); cush.setMatrixAt(k, d.matrix);
      seats.push({ x, z, ry: Math.PI }); k++;
    }
  }
  scene.add(mats, cush);

  // ---- covered corridors (hành lang) ----
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
    floor.position.set(cx, 0.06, zc); floor.receiveShadow = true; scene.add(floor);
    for (const off of [-1.7, 1.7]) {
      for (const z of zs) {
        const p = new THREE.Mesh(pillarG, c.redM); p.position.set(cx + off, CORR.y + 1.65, z); p.castShadow = true; scene.add(p);
        const b = new THREE.Mesh(baseG, stoneBase); b.position.set(cx + off, CORR.y + 0.11, z); scene.add(b);
        colliders.push({ x: cx + off, z, r: 0.22 });
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, len + 0.6), c.redM);
      rail.position.set(cx + off, CORR.y + 3.3, zc); rail.castShadow = true; scene.add(rail);
    }
    for (const s of [-1, 1]) {
      const slab = new THREE.Mesh(slabG, roofM);
      slab.position.set(cx + s * 1.18, CORR.y + 3.95, zc); slab.rotation.z = -s * 0.45; slab.castShadow = true; scene.add(slab);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, len + 1.3), c.goldM);
    ridge.position.set(cx, CORR.y + 4.62, zc); scene.add(ridge);
    for (const z of zs) for (const off of [-1.15, 1.15]) {
      d.position.set(cx + off, CORR.y + 2.75, z + spacing / 2); d.scale.set(1, 1.2, 1); d.updateMatrix(); lanterns.setMatrixAt(li++, d.matrix);
    }
    for (let z = CORR.z0 + 2.4; z < CORR.z1 - 1; z += spacing * 2) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 1.8), lamb(0x6d4426));
      bench.position.set(cx - side * 1.3, CORR.y + 0.5, z); bench.castShadow = true; scene.add(bench);
      for (const lz of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), lamb(0x4a2e18));
        leg.position.set(bench.position.x, CORR.y + 0.25, z + lz); scene.add(leg);
      }
    }
  }
  d.scale.setScalar(1); lanterns.count = li; scene.add(lanterns);

  // ---- bell tower ----
  const tower = (x: number, z: number, ry: number, sign: string, coupletId?: keyof typeof COUPLETS) => {
    const t = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(5.6 - i * 0.7, 0.4, 5.6 - i * 0.7), stoneM);
      st.position.y = 0.2 + i * 0.4; st.castShadow = st.receiveShadow = true; t.add(st);
    }
    const by = 0.8, P: [number, number][] = [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]];
    for (const [px, pz] of P) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 4.6, 12), c.redM);
      p.position.set(px, by + 2.3, pz); p.castShadow = true; t.add(p);
    }
    for (const y of [by + 4.5, by + 3.3]) for (const s of [-1.9, 1.9]) {
      const bx = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.2, 0.22), c.redM); bx.position.set(0, y, s); t.add(bx);
      const bz = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 4.3), c.redM); bz.position.set(s, y, 0); t.add(bz);
    }
    const r1 = new THREE.Mesh(c.roofGeometry(8.2, 8.2, 2.1, 0.8), c.tileM); r1.position.y = by + 5.7; r1.castShadow = true; t.add(r1);
    const r2 = new THREE.Mesh(c.roofGeometry(5.4, 5.4, 1.5, 0.55), c.tileM); r2.position.y = by + 7.0; r2.castShadow = true; t.add(r2);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 8), c.goldM); fin.position.y = by + 8.2; t.add(fin);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.7), new THREE.MeshBasicMaterial({ map: signTexture(sign) }));
    sg.position.set(0, by + 5.0, 2.2); t.add(sg);
    if (coupletId) {
      for (let i = 0; i < 2; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 2.6), new THREE.MeshBasicMaterial({ map: coupletTexture(COUPLETS[coupletId].han[i]) }));
        m.position.set(i ? -1.9 : 1.9, by + 2.3, 2.19); t.add(m);
      }
    }
    t.position.set(x, 0, z); t.rotation.y = ry; scene.add(t);
    for (const [px, pz] of P) {
      const v = new THREE.Vector3(px, 0, pz).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
      colliders.push({ x: x + v.x, z: z + v.z, r: 0.3 });
    }
    return { t, by };
  };
  const bt = tower(BELL.x, BELL.z, Math.PI / 2, 'THÁP CHUÔNG', 'chuong');
  const bronze = lamb(0xa8741f, { metalness: 0.7, roughness: 0.38, side: THREE.DoubleSide });
  const prof = [[0.2, 0], [0.5, 0.05], [0.62, 0.5], [0.7, 1.05], [0.9, 1.45], [0.95, 1.55], [0.78, 1.52]].map(([x, y]) => new THREE.Vector2(x, y));
  const bellPivot = new THREE.Group(); bellPivot.position.set(0, bt.by + 4.3, 0);
  const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), bronze); bell.position.y = -1.6; bell.scale.setScalar(1.05); bell.castShadow = true; bellPivot.add(bell);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), bronze); chain.position.y = -0.1; bellPivot.add(chain);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), bronze); clapper.position.y = -1.55; bellPivot.add(clapper);
  bt.t.add(bellPivot);
  glowSpr(0, bt.by + 3.2, 0, 3, 0xffb040, 0.45, bt.t);
  zones.push({ x: BELL.x, z: BELL.z, r: 7, id: 'chuong' });

  // ---- Quan Âm tower ----
  const qa = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(4.6 - i * 0.55, 4.8 - i * 0.55, 0.45, 8), stoneM);
    tier.position.y = 0.22 + i * 0.45; tier.castShadow = tier.receiveShadow = true; qa.add(tier);
  }
  const qy = 1.35, QR = 3.4, QH = 7.2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, QH, 12), c.redM);
    p.position.set(Math.cos(a) * QR, qy + QH / 2, Math.sin(a) * QR); p.castShadow = true; qa.add(p);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.16), c.redM);
    rail.position.set(Math.cos(a + Math.PI / 8) * QR * 0.93, qy + QH - 0.3, Math.sin(a + Math.PI / 8) * QR * 0.93); rail.rotation.y = -(a + Math.PI / 8) + Math.PI / 2;
    qa.add(rail);
    colliders.push({ x: QUAN.x + Math.cos(a) * QR, z: QUAN.z + Math.sin(a) * QR, r: 0.3 });
  }
  const q1 = new THREE.Mesh(c.roofGeometry(11.5, 11.5, 2.8, 0.9), c.tileM); q1.position.y = qy + QH + 1.4; q1.rotation.y = Math.PI / 4; q1.castShadow = true; qa.add(q1);
  const q2 = new THREE.Mesh(c.roofGeometry(7, 7, 2.2, 0.6), c.tileM); q2.position.y = qy + QH + 3.0; q2.rotation.y = Math.PI / 4; q2.castShadow = true; qa.add(q2);
  const qf = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), c.goldM); qf.position.y = qy + QH + 4.5; qa.add(qf);
  const quanAm = buildQuanAm(); quanAm.position.y = qy; quanAm.scale.setScalar(0.92); qa.add(quanAm);
  const qSign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.76), new THREE.MeshBasicMaterial({ map: signTexture('THÁP QUAN ÂM') }));
  qSign.position.set(0, qy + QH + 0.2, QR + 0.35); qa.add(qSign);
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 2.8), new THREE.MeshBasicMaterial({ map: coupletTexture(COUPLETS.thap.han[i]) }));
    m.position.set(i ? -1.6 : 1.6, qy + 3.4, QR + 0.1); qa.add(m);
  }
  qa.position.set(QUAN.x, 0, QUAN.z); qa.rotation.y = Math.PI / 2 + 0.2; scene.add(qa);
  zones.push({ x: QUAN.x, z: QUAN.z, r: 6.5, id: 'thap' });

  // ---- big Buddha in the western yard ----
  const yard = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(4.2 - i * 0.5, 4.5 - i * 0.5, 0.4, 8), stoneM);
    t.position.y = 0.2 + i * 0.4; t.castShadow = t.receiveShadow = true; yard.add(t);
  }
  const bigB = buildBuddha(); bigB.scale.setScalar(1.15); bigB.position.y = 1.2; yard.add(bigB);
  yard.position.set(BUDDHA_YARD.x, 0, BUDDHA_YARD.z); yard.rotation.y = Math.PI * 0.5 + 0.3; scene.add(yard);
  colliders.push({ x: BUDDHA_YARD.x, z: BUDDHA_YARD.z, r: 4 });

  // ---- pagoda (moved east) ----
  const pagoda = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const w = 5.2 - i * 0.7;
    const f = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 1.3, w - 1), i % 2 ? c.wallM : c.redM); f.position.y = 0.9 + i * 2.6; f.castShadow = true; pagoda.add(f);
    const r = new THREE.Mesh(c.roofGeometry(w * 1.45, w * 1.45, 1.1, 0.5), c.tileM); r.position.y = 2.0 + i * 2.6; r.castShadow = true; pagoda.add(r);
  }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 2.2, 8), c.goldM); spire.position.y = 14.4; pagoda.add(spire);
  pagoda.position.set(PAGODA.x, 0, PAGODA.z); scene.add(pagoda);
  colliders.push({ x: PAGODA.x, z: PAGODA.z, r: 3.4 });

  // ---- koi lake + arched bridge ----
  const lakeBed = new THREE.Mesh(new THREE.CircleGeometry(1, 56), new THREE.MeshStandardMaterial({ color: 0x1d4f66, roughness: 1 }));
  lakeBed.scale.set(LAKE.a, LAKE.b, 1); lakeBed.rotation.x = -Math.PI / 2; lakeBed.position.set(LAKE.x, 0.03, LAKE.z); scene.add(lakeBed);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x3f98b3, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.82 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 56), waterMat);
  water.scale.set(LAKE.a, LAKE.b, 1); water.rotation.x = -Math.PI / 2; water.position.set(LAKE.x, 0.14, LAKE.z); scene.add(water);
  const rimStone = lamb(0x8b7a64, { map: stoneTexture([140, 128, 110], [14, 1], 3) });
  const rimPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; rimPts.push(new THREE.Vector3(Math.cos(a) * (LAKE.a + 0.3), 0, Math.sin(a) * (LAKE.b + 0.3))); }
  const rimCurve = new THREE.CatmullRomCurve3(rimPts, true);
  const rim = new THREE.Mesh(new THREE.TubeGeometry(rimCurve, 128, 0.42, 8, true), rimStone);
  rim.scale.y = 0.8; rim.position.set(LAKE.x, 0.2, LAKE.z); rim.castShadow = true; scene.add(rim);
  const rocks = lamb(0x6e675c, { flatShading: true });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2, rr = 0.5 + ((i * 37) % 10) / 14;
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rr, 0), rocks);
    r.position.set(LAKE.x + Math.cos(a) * (LAKE.a + 0.9), rr * 0.3, LAKE.z + Math.sin(a) * (LAKE.b + 0.9)); r.scale.y = 0.65; r.rotation.set(i, i * 2, 0); r.castShadow = true; scene.add(r);
  }
  const padM = lamb(0x2f8f45), flM = lamb(0xff93b8, { emissive: 0x401324 });
  for (let i = 0; i < 22; i++) {
    const a = ((i * 2.399) % (Math.PI * 2)), rr = Math.sqrt(((i * 0.618) % 1)) * 0.82;
    const x = LAKE.x + Math.cos(a) * rr * LAKE.a, z = LAKE.z + Math.sin(a) * rr * LAKE.b;
    if (Math.abs(z - BRIDGE.z) < 1.8) continue;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.55, 14, 0.4, 5.6), padM);
    pad.rotation.x = -Math.PI / 2; pad.position.set(x, 0.16, z); scene.add(pad);
    if (i % 2 === 0) for (let q = 0; q < 6; q++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), flM); p.scale.set(0.5, 1.3, 0.5);
      const ka = (q / 6) * Math.PI * 2; p.position.set(x + Math.cos(ka) * 0.1, 0.34, z + Math.sin(ka) * 0.1); p.rotation.set(Math.sin(ka) * 0.6, 0, -Math.cos(ka) * 0.6); scene.add(p);
    }
  }
  const koi: { m: THREE.Mesh; a: number; rx: number; rz: number; s: number }[] = [];
  const koiGeo = new THREE.SphereGeometry(0.24, 8, 6);
  [0xff7a2a, 0xffffff, 0xff5030, 0xffb050, 0xf6e0d0, 0xff7a2a, 0xffffff, 0xe84a20, 0xffa040].forEach((col, i) => {
    const m = new THREE.Mesh(koiGeo, new THREE.MeshBasicMaterial({ color: col }));
    m.scale.set(2.0, 0.35, 0.7);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 4), m.material as THREE.Material); tail.rotation.z = Math.PI / 2; tail.position.x = -0.32; tail.scale.set(1, 3, 1); m.add(tail);
    scene.add(m); koi.push({ m, a: i * 0.7, rx: LAKE.a * (0.35 + (i % 4) * 0.15), rz: LAKE.b * (0.35 + (i % 4) * 0.15), s: (i % 2 ? 1 : -1) * (0.25 + (i % 3) * 0.1) });
  });
  // bridge: arched deck from short boards, railings, posts, lanterns
  const deckM = lamb(0x8a4a28), railM = c.redM;
  const nSeg = 28, bw = BRIDGE.hw;
  const segLen = (BRIDGE.x1 - BRIDGE.x0) / nSeg;
  for (let i = 0; i < nSeg; i++) {
    const x = BRIDGE.x0 + (i + 0.5) * segLen, x2 = x + segLen * 0.5, x1 = x - segLen * 0.5;
    const y1 = bridgeY(x1, BRIDGE.z), y2 = bridgeY(x2, BRIDGE.z), ym = (y1 + y2) / 2;
    const slope = Math.atan2(y2 - y1, segLen);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.06, 0.2, bw * 2), deckM);
    seg.position.set(x, ym - 0.1, BRIDGE.z); seg.rotation.z = slope; seg.castShadow = seg.receiveShadow = true; scene.add(seg);
    for (const s of [-1, 1]) {
      const rl = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.04, 0.12, 0.14), railM);
      rl.position.set(x, ym + 0.95, BRIDGE.z + s * (bw + 0.02)); rl.rotation.z = slope; scene.add(rl);
      if (i % 3 === 0) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.05, 8), railM);
        post.position.set(x, ym + 0.45, BRIDGE.z + s * (bw + 0.02)); scene.add(post);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), c.goldM); knob.position.set(x, ym + 1.05, BRIDGE.z + s * (bw + 0.02)); scene.add(knob);
      }
    }
  }
  for (const sx of [-1, 1]) { // piers
    const px = (BRIDGE.x0 + BRIDGE.x1) / 2 + sx * 4.6;
    for (const s of [-1, 1]) {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 8), lamb(0x6b6458));
      pier.position.set(px, bridgeY(px, BRIDGE.z) - 0.8, BRIDGE.z + s * (bw - 0.2)); scene.add(pier);
    }
  }
  const apex = (BRIDGE.x0 + BRIDGE.x1) / 2;
  for (const s of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), c.redBase);
    lamp.scale.set(1, 1.2, 1); lamp.position.set(apex, bridgeY(apex, BRIDGE.z) + 1.7, BRIDGE.z + s * (bw + 0.02)); scene.add(lamp);
    glowSpr(lamp.position.x, lamp.position.y, lamp.position.z, 2, 0xff4a28, 0.5);
  }
  // path from plaza to the bridge end-caps
  const bridgePath = new THREE.Mesh(new THREE.PlaneGeometry(BRIDGE.x0 - 6 + 4, 2.4), lamb(0xffffff, { map: stoneTexture([150, 144, 134], [6, 1]) }));
  bridgePath.rotation.x = -Math.PI / 2; bridgePath.position.set((BRIDGE.x0 + 6) / 2 - 2, 0.025, BRIDGE.z); bridgePath.receiveShadow = true; scene.add(bridgePath);

  // ---- perimeter wall + tam quan gate ----
  const wallStone = lamb(0xe9dcc0, { roughness: 0.9 });
  const cap = lamb(0xb4502c);
  const wallSeg = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
    const w = new THREE.Mesh(new THREE.BoxGeometry(len, 1.6, 0.5), wallStone);
    w.position.set((x0 + x1) / 2, 0.8, (z0 + z1) / 2); w.rotation.y = -ang; w.castShadow = w.receiveShadow = true; scene.add(w);
    const t = new THREE.Mesh(new THREE.BoxGeometry(len + 0.1, 0.18, 0.7), cap);
    t.position.set(w.position.x, 1.7, w.position.z); t.rotation.y = -ang; scene.add(t);
    const n = Math.ceil(len / 3);
    for (let i = 0; i <= n; i++) colliders.push({ x: x0 + ((x1 - x0) * i) / n, z: z0 + ((z1 - z0) * i) / n, r: 0.55 });
  };
  wallSeg(-WALL.x, WALL.zN, WALL.x, WALL.zN);
  wallSeg(-WALL.x, WALL.zN, -WALL.x, WALL.zS); wallSeg(WALL.x, WALL.zN, WALL.x, WALL.zS);
  wallSeg(-WALL.x, WALL.zS, -WALL.gate - 1.6, WALL.zS); wallSeg(WALL.gate + 1.6, WALL.zS, WALL.x, WALL.zS);
  const gate = new THREE.Group();
  for (const x of [-WALL.gate, WALL.gate]) {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.4, 1.2), c.redM); pl.position.set(x, 3.2, 0); pl.castShadow = true; gate.add(pl);
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 1.7), stoneBase); b.position.set(x, 0.25, 0); gate.add(b);
    colliders.push({ x, z: WALL.zS, r: 0.9 });
    const side = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, 1.0), c.redM); side.position.set(x + Math.sign(x) * 1.8, 2.1, 0); gate.add(side);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(WALL.gate * 2 + 4.6, 0.8, 1.5), c.redM); lintel.position.y = 6.5; lintel.castShadow = true; gate.add(lintel);
  const gRoof = new THREE.Mesh(c.roofGeometry(WALL.gate * 2 + 7.5, 5, 2.0, 0.8), c.tileM); gRoof.position.y = 7.6; gRoof.castShadow = true; gate.add(gRoof);
  const gSign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), new THREE.MeshBasicMaterial({ map: signTexture('CHÙA ONLINE') }));
  gSign.position.set(0, 5.4, 0.85); gate.add(gSign);
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4.2), new THREE.MeshBasicMaterial({ map: coupletTexture(COUPLETS.tamQuan.han[i]) }));
    m.position.set((i ? -1 : 1) * (WALL.gate - 0.9), 3.2, 0.64); gate.add(m);
  }
  gate.position.set(0, 0, WALL.zS); scene.add(gate);
  zones.push({ x: 0, z: WALL.zS, r: 6, id: 'tamQuan' });

  // ---- paved side paths to towers, yard, pagoda ----
  const pave = lamb(0xffffff, { map: stoneTexture([150, 144, 134], [10, 1]) });
  const pathRect = (x0: number, z0: number, x1: number, z1: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0) || 2.4, Math.abs(z1 - z0) || 2.4), pave);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.024, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m);
  };
  pathRect(-SIDE_X - 6, PATH_Z - 1.2, SIDE_X + 6, PATH_Z + 1.2);
  pathRect(-SIDE_X - 1.2, QUAN.z, -SIDE_X + 1.2, PATH_Z);
  pathRect(PAGODA.x - 1.2, PAGODA.z, PAGODA.x + 1.2, PATH_Z);
  pathRect(-SIDE_X - 1.2, PATH_Z, -SIDE_X + 1.2, BUDDHA_YARD.z);
  pathRect(-SIDE_X - 7, BELL.z - 1.2, -SIDE_X, BELL.z + 1.2);
  pathRect(-SIDE_X + 1, BELL.z - 1.2, -SIDE_X + 1.3, BELL.z + 1.2);

  // ---- animation ----
  let ring = 0;
  const ringBell = () => { ring = 1; };
  const halos = [...hall.halos, bigB.getObjectByName('halo')!, quanAm.getObjectByName('halo')!].filter(Boolean);
  const update = (t: number, dt: number) => {
    ring = Math.max(0, ring - dt * 0.25);
    bellPivot.rotation.z = Math.sin(t * 2.6) * 0.5 * ring * ring + Math.sin(t * 0.5) * 0.015;
    halos.forEach((h, i) => { h.rotation.z = t * (0.12 + i * 0.02); });
    koi.forEach((kk) => {
      kk.a += dt * kk.s;
      const x = LAKE.x + Math.cos(kk.a) * kk.rx, z = LAKE.z + Math.sin(kk.a) * kk.rz;
      kk.m.position.set(x, 0.15 + Math.sin(t * 2 + kk.a * 3) * 0.01, z);
      kk.m.rotation.y = -(kk.a + (kk.s > 0 ? Math.PI / 2 : -Math.PI / 2)) + Math.atan2(kk.rz / kk.rx - 1, 1) * 0;
      kk.m.rotation.y = Math.atan2(-(kk.rz * Math.cos(kk.a)) * Math.sign(kk.s), -(kk.rx * Math.sin(kk.a)) * Math.sign(kk.s)) + Math.PI;
    });
    waterMat.opacity = 0.8 + Math.sin(t * 0.8) * 0.03;
  };

  const zoneAt = (x: number, z: number): string | null => {
    let best: Zone | null = null, bd = Infinity;
    for (const zn of zones) {
      const dd = Math.hypot(x - zn.x, z - zn.z);
      if (dd < zn.r && zn.r < bd) { best = zn; bd = zn.r; }
    }
    return best ? best.id : null;
  };

  return { seats, update, ringBell, zoneAt, inLake };
}
