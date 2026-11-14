import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Anim, Outfit } from '../shared/types';
import { shadowBlobTexture } from './textures';
import { geo, outlined, toon } from './toon';

interface FadeFrom {
  t0: number;
  arms: THREE.Quaternion[];
  fores: THREE.Quaternion[];
  legPos: THREE.Vector3[];
  legRot: THREE.Quaternion[];
  shinRot?: THREE.Quaternion[];
  bodyPos: THREE.Vector3;
  bodyRot: THREE.Quaternion;
}

export interface Character {
  root: THREE.Group;
  body: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  shinL: THREE.Group;
  shinR: THREE.Group;
  foreL: THREE.Group;
  foreR: THREE.Group;
  hold: THREE.Group;
  holdInc: THREE.Group;
  holdLotus: THREE.Group;
  holdBroom: THREE.Group;
  role?: 'abbot' | 'novice' | 'lay';
  poseW: number;
  poseKind: 'abbot' | 'sweep' | 'ring';
  prayW: number;
  lastT: number;
  face: THREE.Mesh;
  faceOpen: THREE.Texture;
  faceShut: THREE.Texture;
  blinkNext: number;
  blinkUntil: number;
  fade: FadeFrom | null;
  animCalls: number;
  lap: THREE.Mesh;
  curAnim: string;
  t0: number;
  gait: number;
  label: THREE.Sprite;
  bubble: THREE.Sprite;
  bubbleUntil: number;
  setLabel(name: string, level?: number, isMe?: boolean, title?: string): void;
  setAccessory(id: string | null): void;
  say(text: string): void;
  dispose(): void;
}

const SKIN = 0xf7dfc0;
const HAIR = 0x2b2a2e;
const matCache = new Map<string, THREE.Material>();
const tmat = (c: number | string, extra: Record<string, unknown> = {}) => {
  const key = c + JSON.stringify(extra);
  let m = matCache.get(key);
  if (!m) { m = toon(c, extra as any); matCache.set(key, m); }
  return m as THREE.MeshToonMaterial;
};
const MUTE = new THREE.MeshBasicMaterial({ color: 0x2a1610 });
const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });
const BLUSH = new THREE.MeshBasicMaterial({ color: 0xff9a8a, transparent: true, opacity: 0.75 });
let blobTex: THREE.Texture | null = null;

function mesh(g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, shadow = true) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = shadow;
  parent.add(o);
  return o;
}

function makeLabelSprite(tall?: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = tall ? 144 : 96;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false, toneMapped: false }));
  sprite.scale.set(0.045 * (512 / 96), tall ? 0.0675 : 0.045, 1);
  sprite.renderOrder = 20;
  return { sprite, canvas, tex };
}

function drawLabel(canvas: HTMLCanvasElement, tex: THREE.CanvasTexture, name: string, level?: number, isMe?: boolean, title?: string): number {
  const g = canvas.getContext('2d')!;
  g.clearRect(0, 0, 512, canvas.height);
  const oy = canvas.height - 96; // nhãn cao: chip tên bám đáy canvas, dòng danh hiệu nằm phía trên
  const text = name.length > 20 ? name.slice(0, 19) + '…' : name;
  g.font = '700 38px system-ui, "Segoe UI", sans-serif';
  const tw = g.measureText(text).width;
  const chip = level ? 58 : 0;
  const w = Math.min(500, tw + 44 + chip), x0 = (512 - w) / 2;
  g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8;
  g.fillStyle = isMe ? 'rgba(92,58,16,.9)' : 'rgba(34,22,14,.78)';
  g.beginPath(); g.roundRect(x0, 18 + oy, w, 58, 29); g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = isMe ? 'rgba(244,205,110,.95)' : 'rgba(255,255,255,.18)';
  g.lineWidth = 3; g.stroke();
  if (level) {
    g.fillStyle = '#e8b64a';
    g.beginPath(); g.arc(x0 + 34, 47 + oy, 20, 0, 7); g.fill();
    g.fillStyle = '#3b2414'; g.font = '800 26px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(level), x0 + 34, 49 + oy);
  }
  g.fillStyle = isMe ? '#ffe9ad' : '#fff';
  g.font = '700 38px system-ui, "Segoe UI", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, x0 + chip / 2 + w / 2 + (level ? 6 : 0) - (level ? 0 : 0) - (level ? 6 : 0), 49 + oy);
  if (title && oy > 0) {
    g.save();
    g.font = '700 28px system-ui, "Segoe UI", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = 6;
    g.fillStyle = '#f4cd6e';
    g.fillText(title.length > 24 ? title.slice(0, 23) + '…' : title, 256, 34);
    g.restore();
  }
  tex.needsUpdate = true;
  return w;
}


/** Height reference (head top). Head diameter = 0.5H, head centre = 0.75H. */
const H = 2.12;
const HR = 0.53; // head radius
const HEAD_Y = 0.75 * H;
const ARM_X = 0.34, ARM_Y = 1.0; // shoulder pivot
const HAND_R = 0.09 * H / 2, HAND_SX = 0.97; // hand ball: 0.09H across, near-uniform 3D sphere
// Short arm (hanging): sleeve mouth ends at ~0.30H, hand centre ~0.277H (1/4 of the ball tucked into the sleeve).
const AL1 = 0.17; // shoulder -> elbow
const CUFF = 0.203; // elbow -> sleeve mouth
const AL2 = CUFF + 0.5 * HAND_R; // elbow -> hand centre (ball centre sits HAND_R/2 below the mouth => 1/4 inside)
const HALF_T = HAND_R * HAND_SX; // half thickness: joined palms touch with zero gap
const faceCache = new Map<string, THREE.CanvasTexture>();

/** Face decal 512x512 drawn on a front-facing sphere patch: eyes, brows, cheeks, mouth. */
function faceTexture(outfit: Outfit, closed = false, whiteBrows = false): THREE.CanvasTexture {
  const cacheKey = (closed ? `${outfit}:closed` : outfit) + (whiteBrows ? ':white' : '');
  const hit = faceCache.get(cacheKey);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const g = cv.getContext('2d')!;
  const fem = outfit === 'nun' || outfit === 'female';
  const eyeK = fem ? 1.1 : 1;
  const ey = 281, ex = 87; // eyes at 55% height, spacing 0.34 of the face width
  for (const s of [-1, 1]) {
    const cx = 256 + s * ex, rx = 33.5 * eyeK, ry = 41 * eyeK;
    // cheeks
    g.save(); g.translate(256 + s * 128, 342); g.scale(1, 0.62);
    const rg = g.createRadialGradient(0, 0, 4, 0, 0, 40);
    const a = outfit === 'nun' ? 0.65 : 0.55;
    const col = outfit === 'nun' ? '242,140,140' : '245,163,163';
    rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(0.7, `rgba(${col},${a * 0.75})`); rg.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 40, 0, 7); g.fill(); g.restore();
    // brows
    g.strokeStyle = whiteBrows ? '#fdfcf8' : outfit === 'male' ? '#2b2a2e' : outfit === 'female' ? '#3b2a24' : '#7a5a46';
    g.lineWidth = whiteBrows ? 17 : outfit === 'male' ? 9 : outfit === 'female' ? 4.5 : 3.5; g.lineCap = 'round';
    const bl = whiteBrows ? 32 : outfit === 'male' ? 30 : 24, by = ey - 72 - (outfit === 'male' ? 2 : 0);
    g.beginPath();
    g.moveTo(cx - s * bl * 0.9, by + (outfit === 'male' ? 6 : 4));
    g.quadraticCurveTo(cx, by - (outfit === 'male' ? 8 : 6), cx + s * bl, by + (outfit === 'male' ? 3 : 4));
    if (whiteBrows) { g.save(); g.strokeStyle = 'rgba(150,140,125,.6)'; g.lineWidth = 21; g.stroke(); g.restore(); }
    g.stroke();
    if (whiteBrows) { // second parallel stroke, offset upward, for a bushier brow
      g.beginPath();
      g.moveTo(cx - s * bl * 0.9, by - 3);
      g.quadraticCurveTo(cx, by - 13, cx + s * bl, by - 3);
      g.stroke();
    }
    if (closed) { // closed lid: a single downward-bowed brown curve across the eye width
      g.strokeStyle = '#2e211a'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx - rx, ey);
      g.quadraticCurveTo(cx, ey + ry * 0.45, cx + rx, ey);
      g.stroke();
      if (fem) {
        g.lineWidth = 3.4;
        for (let i = 0; i < 3; i++) {
          const px = cx + s * rx * (0.72 + i * 0.14), py = ey + ry * 0.2 * (1 - i * 0.2);
          g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + s * 8, py + 3 + i, px + s * (12 + i * 3), py - 2 - i * 3); g.stroke();
        }
      }
      continue;
    }
    // eye: dark brown iris filling the eye, soft lower glow, top lid line, two highlights
    g.save(); g.beginPath(); g.ellipse(cx, ey, rx, ry, 0, 0, 7); g.clip();
    const ig = g.createLinearGradient(0, ey - ry, 0, ey + ry);
    ig.addColorStop(0, '#2a1810'); ig.addColorStop(0.55, '#3a241a'); ig.addColorStop(1, '#7a4a38');
    g.fillStyle = ig; g.fillRect(cx - rx, ey - ry, rx * 2, ry * 2); g.restore();
    g.strokeStyle = '#2e211a'; g.lineWidth = 5;
    g.beginPath(); g.ellipse(cx, ey, rx, ry, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(cx - rx * 0.28, ey - ry * 0.32, 13 * eyeK, 0, 7); g.fill();
    g.beginPath(); g.arc(cx + rx * 0.36, ey + ry * 0.42, 6 * eyeK, 0, 7); g.fill();
    if (fem) { // three curled lashes on the outer upper corner
      g.strokeStyle = '#2e211a'; g.lineWidth = 3.4;
      for (let i = 0; i < 3; i++) {
        const t = -0.2 + i * 0.28, px = cx + s * rx * Math.cos(Math.PI * (0.18 + t * 0.4)) * 0.98, py = ey - ry * Math.sin(Math.PI * (0.18 + t * 0.4)) * 0.98;
        g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + s * 11, py - 4 - i * 2, px + s * (15 + i * 3), py - 13 - i * 4); g.stroke();
      }
    }
  }
  // nose hint + mouth
  g.strokeStyle = 'rgba(138,75,56,.35)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(252, 352); g.quadraticCurveTo(256, 358, 260, 352); g.stroke();
  const mw = (outfit === 'male' ? 43 : 36), my = 396;
  g.strokeStyle = '#8a4b38'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(256 - mw / 2, my); g.quadraticCurveTo(256, my + (outfit === 'male' ? 24 : 15), 256 + mw / 2, my);
  if (outfit === 'male') { g.closePath(); g.fillStyle = '#c4574a'; g.fill(); }
  g.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  faceCache.set(cacheKey, t);
  return t;
}

let lotusEmbroidery: THREE.CanvasTexture | null = null;
function embroideryTexture() {
  if (lotusEmbroidery) return lotusEmbroidery;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d')!;
  g.translate(64, 78);
  for (const [ang, len, col] of [[-1.0, 40, '#efa8bc'], [1.0, 40, '#efa8bc'], [-0.5, 50, '#f4b9ca'], [0.5, 50, '#f4b9ca'], [0, 56, '#f8c9d6']] as [number, number, string][]) {
    g.save(); g.rotate(ang); g.fillStyle = col; g.strokeStyle = '#c97a92'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, -len * 0.55, 15, len * 0.55, 0, 0, 7); g.fill(); g.stroke(); g.restore();
  }
  g.fillStyle = '#e8c36a'; g.beginPath(); g.arc(0, -8, 7, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  lotusEmbroidery = t; return t;
}

export function buildCharacter(outfit: Outfit, color: string, name: string, opts?: { scale?: number; role?: 'abbot' | 'novice' | 'lay' }): Character {
  const root = new THREE.Group();
  if (opts?.scale) root.scale.setScalar(opts.scale);
  const body = new THREE.Group();
  root.add(body);

  // soft blob shadow
  blobTex ??= shadowBlobTexture();
  const blob = new THREE.Mesh(geo('blob', () => new THREE.PlaneGeometry(1.5, 1.5)),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.07; blob.renderOrder = 1;
  root.add(blob);

  const robeC = new THREE.Color(color);
  const robe = tmat(color);
  const robeDark = tmat(robeC.clone().multiplyScalar(0.72).getHex());
  const robeLight = tmat(robeC.clone().lerp(new THREE.Color(0xffffff), 0.22).getHex());
  const skin = tmat(SKIN, { emissive: 0x4a2c16 });
  // Hands share the head's toon skin material: MeshBasicMaterial made them read as flat white
  // balls against the shaded face, so they now pick up the same light falloff.
  const handM = skin;
  const hairM = tmat(HAIR);
  const cream = tmat(outfit === 'female' ? 0xf3e6ce : 0xf5efe2);
  const lay = outfit === 'male' || outfit === 'female';
  const rAt = (y: number) => 0.37 - 0.1 * ((y - 0.17) / 0.93); // robe radius at height y

  // ---- torso: bell-shaped robe, rounded shoulders, hem band ----
  outlined(mesh(geo('torso2', () => new THREE.CylinderGeometry(0.27, 0.37, 0.93, 22)), robe, body, 0, 0.635, 0));
  const sh = mesh(geo('shoulder', () => new THREE.SphereGeometry(1, 18, 12)), robe, body, 0, 1.0, 0, false);
  sh.scale.set(0.34, 0.14, 0.27);
  mesh(geo('hem2', () => new THREE.CylinderGeometry(0.372, 0.376, 0.07, 22)), robeDark, body, 0, 0.205, 0, false);
  if (outfit === 'monk' || outfit === 'nun') { // cross-collar (Ã¡o cá»• chÃ©o)
    for (const sd of [-1, 1]) {
      const st = mesh(geo('lapel', () => new THREE.CapsuleGeometry(0.022, 0.3, 4, 8)), robeDark, body, sd * 0.07, 0.94, rAt(0.94) + 0.012, false);
      st.rotation.z = -sd * 0.46; st.scale.z = 0.5;
    }
  } else { // lay devotees: V collar + inner collar ring
    const lc = outfit === 'female' ? 0.034 : 0.026;
    for (const sd of [-1, 1]) {
      const st = mesh(geo(`lapel${outfit}`, () => new THREE.CapsuleGeometry(lc, 0.3, 4, 8)), cream, body, sd * 0.07, 0.94, rAt(0.94) + 0.012, false);
      st.rotation.z = -sd * 0.46; st.scale.z = 0.5;
    }
    mesh(geo('neckring', () => new THREE.TorusGeometry(0.255, 0.034, 8, 22)), cream, body, 0, 1.075, 0.0, false).rotation.x = Math.PI / 2;
  }
  if (outfit === 'male') { // narrow belt at 0.30H
    const belt = mesh(geo('belt', () => new THREE.CylinderGeometry(rAt(0.64) + 0.012, rAt(0.64) + 0.014, 0.075, 22)), tmat(0x2a384d), body, 0, 0.64, 0, false);
    mesh(geo('buckle', () => new THREE.BoxGeometry(0.06, 0.07, 0.02)), tmat(0xc9a14a), belt, 0, 0, rAt(0.64) + 0.02, false);
  }
  if (outfit === 'female') { // lotus embroidery on the wearer's left chest
    const dec = new THREE.Mesh(geo('embroidery', () => new THREE.PlaneGeometry(0.15, 0.15)),
      new THREE.MeshToonMaterial({ map: embroideryTexture(), transparent: true, gradientMap: null as any }));
    dec.position.set(0.125, 0.8, rAt(0.8) * Math.cos(0.4) + 0.006); dec.rotation.y = 0.4;
    body.add(dec);
  }

  // ---- head ----
  const head = outlined(mesh(geo('head2', () => new THREE.SphereGeometry(HR, 34, 28)), skin, body, 0, HEAD_Y, 0), 0.026);
  if (outfit === 'nun') head.scale.x = 1.04;
  const face = new THREE.Mesh(geo('faceCap', () => new THREE.SphereGeometry(HR * 1.004, 40, 30, Math.PI / 2 - 0.85, 1.7, 0.7, 1.7)),
    new THREE.MeshToonMaterial({ map: faceTexture(outfit, false, opts?.role === 'abbot'), emissive: 0x4a2c16, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  face.renderOrder = 2; face.raycast = () => {};
  head.add(face);
  const faceOpen = faceTexture(outfit, false, opts?.role === 'abbot'), faceShut = faceTexture(outfit, true, opts?.role === 'abbot');
  // ears
  const earR = outfit === 'monk' ? 0.095 : outfit === 'nun' ? 0.065 : 0.055;
  for (const sd of [-1, 1]) {
    const ear = mesh(geo(`ear${outfit}`, () => new THREE.SphereGeometry(earR, 12, 10)), skin, head, sd * HR * 0.97, -0.02, 0.02, false);
    ear.scale.set(0.5, 1.05, 0.8); ear.rotation.z = sd * (outfit === 'monk' ? 0.32 : 0.12);
  }

  const dome = (rad: number, theta: number, tilt: number, key: string) => {
    const m = mesh(geo(key, () => new THREE.SphereGeometry(rad, 30, 18, 0, Math.PI * 2, 0, theta)), hairM, head, 0, 0.02, -0.02);
    m.rotation.x = tilt; outlined(m, 0.016); return m;
  };
  const blob2 = (x: number, y: number, z: number, rx: number, ry: number, rz: number, rotZ = 0, outline = true) => {
    const m = mesh(geo('hairBlob', () => new THREE.SphereGeometry(1, 16, 12)), hairM, head, x, y, z, false);
    m.scale.set(rx, ry, rz); m.rotation.z = rotZ; if (outline) outlined(m, 0.03); return m;
  };

  if (opts?.role === 'abbot') { // white moustache and long white beard, head-local (front = +Z)
    const whiteM = tmat(0xffffff);
    const blob = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const m = mesh(geo('abbotBlob', () => new THREE.SphereGeometry(1, 16, 12)), whiteM, head, x, y, z, false);
      m.scale.set(sx, sy, sz); return m;
    };
    const taper = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const m = mesh(geo('abbotTaper', () => new THREE.ConeGeometry(1, 1, 16)), whiteM, head, x, y, z, false);
      m.scale.set(sx, sy, sz); m.rotation.x = Math.PI; return m;
    };
    for (const sd of [-1, 1]) {
      const mo = blob(sd * 0.08, -0.165, 0.5, 0.1, 0.035, 0.05);
      mo.rotation.set(0, sd * 0.35, -sd * 0.3);
      outlined(mo, 0.014);
      blob(sd * 0.25, -0.45, 0.39, 0.09, 0.15, 0.09);
      taper(sd * 0.25, -0.62, 0.39, 0.09, 0.2, 0.09);
    }
    blob(0, -0.5, 0.4, 0.23, 0.15, 0.085);
    taper(0, -0.68, 0.4, 0.23, 0.36, 0.085);
  }

  if (outfit === 'monk') { // five incense scars on the crown
    const dotM = tmat(0xb08968);
    const c = new THREE.Vector3(0, 1, 0.55).normalize();
    const u = new THREE.Vector3(1, 0, 0), v = new THREE.Vector3().crossVectors(c, u).normalize();
    for (const [dx, dy] of [[0, 0], [-0.12, -0.11], [0.12, -0.11], [-0.12, 0.11], [0.12, 0.11]] as [number, number][]) {
      const n = c.clone().addScaledVector(u, dx).addScaledVector(v, dy).normalize();
      const d = mesh(geo('incDot', () => new THREE.SphereGeometry(0.03, 10, 6)), dotM, head, n.x * HR, n.y * HR, n.z * HR, false);
      d.scale.set(1, 0.3, 1); d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    }
  } else if (outfit === 'male') { // side-parted 7/3, swept fringe, light volume on top
    dome(HR * 1.045, Math.PI * 0.5, -0.5, 'hairDomeM');
    blob2(0.12, 0.36, 0.34, 0.3, 0.1, 0.17, -0.3);
    blob2(-0.27, 0.37, 0.3, 0.14, 0.075, 0.13, 0.45);
    blob2(0.02, 0.5, 0.1, 0.3, 0.1, 0.28, -0.1);
    blob2(0.0, 0.2, -0.3, 0.46, 0.34, 0.26, 0, false);
    for (const sd of [-1, 1]) blob2(sd * 0.47, 0.1, 0.0, 0.06, 0.2, 0.22, 0, false);
    const part = mesh(geo('part', () => new THREE.BoxGeometry(0.012, 0.012, 0.24)), tmat(0x4a4a50), head, -0.2, 0.5, 0.18, false);
    part.rotation.x = 0.55;
  } else if (outfit === 'female') { // centre parting, side locks, high bun with lotus pin
    dome(HR * 1.045, Math.PI * 0.5, -0.5, 'hairDomeF');
    for (const sd of [-1, 1]) {
      blob2(sd * 0.2, 0.37, 0.37, 0.2, 0.08, 0.12, -sd * 0.5);
      blob2(sd * 0.47, 0.0, 0.1, 0.06, 0.26, 0.17, 0, false);
    }
    const bun = outlined(mesh(geo('bun2', () => new THREE.SphereGeometry(0.159, 18, 14)), hairM, head, 0, HR + 0.06, -0.15), 0.016);
    void bun;
    const pin = mesh(geo('pinStick', () => new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6)), tmat(0xe8b64a), head, 0.1, HR + 0.07, -0.15, false);
    pin.rotation.z = -0.95;
    const fl = new THREE.Group(); fl.position.set(0.25, HR + 0.2, -0.13); fl.rotation.z = -0.5; head.add(fl);
    const pm = tmat(0xf0aec4, { emissive: 0x3a1020 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const pt = mesh(geo('pinPetal', () => new THREE.SphereGeometry(0.045, 10, 8)), pm, fl, Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0, false);
      pt.scale.set(1, 1.3, 0.5); pt.rotation.z = a - Math.PI / 2;
    }
    mesh(geo('pinCore', () => new THREE.SphereGeometry(0.022, 8, 6)), tmat(0xffd35a), fl, 0, 0, 0.012, false);
  }

  // ---- prayer beads (monk: 14 solid dark beads on a hanging loop; nun: small light wood) ----
  if (outfit === 'monk') {
    const curve = (a: number) => { // closed loop over the shoulders, sagging to mid-chest at the front
      const f = Math.max(0, Math.sin(a));
      return new THREE.Vector3(Math.cos(a) * 0.32, 1.07 - 0.31 * f * f, Math.sin(a) * 0.27 + 0.075 * f * f);
    };
    const N = 14, SAMPLES = 600, pts: THREE.Vector3[] = [], cum = [0];
    for (let i = 0; i <= SAMPLES; i++) pts.push(curve((i / SAMPLES) * Math.PI * 2));
    for (let i = 1; i <= SAMPLES; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const parts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < N; k++) { // evenly spaced by arc length, starting at the chest centre
      const target = ((k / N) * cum[SAMPLES] + cum[SAMPLES] * (0.25)) % cum[SAMPLES];
      let i = 0; while (cum[i] < target) i++;
      const b = new THREE.SphereGeometry(0.052, 14, 10);
      b.translate(pts[i].x, pts[i].y, pts[i].z);
      parts.push(b);
    }
    const beads = mesh(mergeGeometries(parts), tmat(0x5c3421), body, 0, 0, 0, false);
    outlined(beads, 0.008);
    const cord = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.filter((_, i) => i % 15 === 0), true), 120, 0.008, 5, true);
    mesh(cord, tmat(0x3a2012), body, 0, 0, 0, false);
  } else if (outfit === 'nun') {
    const n = 16, rad = 0.047 / 2;
    const bm = tmat(0xc89a68);
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b = new THREE.SphereGeometry(rad, 10, 8);
      const front = Math.max(0, Math.sin(a));
      b.translate(Math.cos(a) * 0.27, 1.03 - 0.17 * front * front - 0.02 * (1 - front), Math.sin(a) * 0.2 + 0.07);
      parts.push(b);
    }
    mesh(mergeGeometries(parts), bm, body, 0, 0, 0, false);
  }

  // ---- arms: shoulder pivot -> upper sleeve -> elbow -> short round wrist sleeve + round flat hand (no fingers) ----
  const mkArm = (side: number) => {
    const g = new THREE.Group();
    g.position.set(side * ARM_X, ARM_Y, 0.0);
    const upper = outlined(mesh(geo('upper', () => new THREE.CylinderGeometry(0.125, 0.125, AL1, 16)), robe, g, 0, -AL1 / 2, 0), 0.016);
    // rounded shoulder cap: sleeve flows out of the curved shoulder with no square joint
    outlined(mesh(geo('shCap', () => new THREE.SphereGeometry(0.125, 18, 14)), robe, g, 0, 0, 0), 0.016);
    const fore = new THREE.Group(); fore.position.y = -AL1; g.add(fore);
    const FH = CUFF - 0.045;
    const foreS = outlined(mesh(geo('foreT', () => new THREE.CylinderGeometry(0.125, 0.135, FH, 14)), robe, fore, 0, -FH / 2, 0), 0.016);
    const cuff = mesh(geo('cuffT', () => new THREE.CylinderGeometry(0.137, 0.14, 0.045, 14)), robeDark, fore, 0, -CUFF + 0.0225, 0, false);
    // hand: solid skin-coloured ball, centre HAND_R/2 below the sleeve mouth
    const hand = outlined(mesh(geo('handBall', () => new THREE.SphereGeometry(HAND_R, 20, 16)), handM, fore, 0, -AL2, 0), 0.012);
    hand.scale.set(HAND_SX, 1, 1);
    body.add(g);
    return { g, fore };
  };
  const aL = mkArm(-1), aR = mkArm(1);
  const armL = aL.g, armR = aR.g;

  // legs + footwear (only the bottom shows under the robe)
  const mkLeg = (side: number) => {
    // leg = thigh node at the old capsule centre; shin pivots at that same point (knee)
    const leg = mesh(geo('thigh', () => new THREE.CapsuleGeometry(0.1, 0.06, 4, 8).translate(0, 0.03, 0)), tmat(0xf1e6d2), body, side * 0.16, 0.18, 0, false);
    const shin = new THREE.Group();
    leg.add(shin);
    mesh(geo('shin', () => new THREE.CapsuleGeometry(0.1, 0.06, 4, 8).translate(0, -0.03, 0)), tmat(0xf1e6d2), shin, 0, 0, 0, false);
    if (outfit === 'nun') {
      const sole = mesh(geo('sandal', () => new THREE.SphereGeometry(0.135, 12, 8)), tmat(0xb5895c), shin, 0, -0.14, 0.06, false);
      sole.scale.set(1, 0.3, 1.45);
      const strap = mesh(geo('strap', () => new THREE.TorusGeometry(0.095, 0.022, 6, 12)), tmat(0x6e3b26), shin, 0, -0.1, 0.07, false);
      strap.rotation.x = Math.PI / 2 - 0.3; strap.scale.set(1, 1.2, 1);
    } else {
      mesh(geo('shoe2', () => new THREE.SphereGeometry(0.135, 12, 8)), tmat(0x6e3b26), shin, 0, -0.1, 0.06, false).scale.set(1, 0.62, 1.4);
    }
    return { leg, shin };
  };
  const { leg: legL, shin: shinL } = mkLeg(-1);
  const { leg: legR, shin: shinR } = mkLeg(1);

  // lap of the robe, only visible when sitting cross-legged
  const lap = mesh(geo('lap', () => new THREE.SphereGeometry(1, 20, 12)), robe, body, 0, 0.3, 0.22, false);
  lap.scale.set(0.58, 0.05, 0.5);
  lap.visible = false;

  // ---- held items, only visible during ritual actions; sit between the two palms ----
  const hold = new THREE.Group();
  hold.position.set(0, 0.848, 0.4);
  body.add(hold);
  const holdInc = new THREE.Group(); holdInc.visible = false; hold.add(holdInc);
  const holdLotus = new THREE.Group(); holdLotus.visible = false; hold.add(holdLotus);
  // chá»•i quÃ©t lÃ¡: cÃ¡n nghiÃªng ra trÆ°á»›c, Ä‘áº§u chá»•i cháº¡m Ä‘áº¥t; chá»‰ hiá»‡n khi anim = sweep
  const holdBroom = new THREE.Group(); holdBroom.visible = false; holdBroom.rotation.x = -0.5; hold.add(holdBroom);
  mesh(geo('broomHandle', () => new THREE.CylinderGeometry(0.018, 0.018, 1.25, 6)), tmat(0x6b4423), holdBroom, 0, -0.32, 0, false);
  mesh(geo('broomHead', () => new THREE.ConeGeometry(0.15, 0.4, 8)), tmat(0x9a6b35), holdBroom, 0, -0.84, 0, false);
  for (let i = -1; i <= 1; i++) { // three incense sticks, red glowing tips
    const st = new THREE.Group(); st.position.set(i * 0.016, 0.02, 0); st.rotation.z = -i * 0.1; holdInc.add(st);
    mesh(geo('stick', () => new THREE.CylinderGeometry(0.0065, 0.0065, 0.212, 5)), tmat(0x8a4b2a), st, 0, 0.106, 0, false);
    mesh(geo('stickTip', () => new THREE.CylinderGeometry(0.0085, 0.0085, 0.04, 5)), new THREE.MeshBasicMaterial({ color: 0xc8372d }), st, 0, 0.205, 0, false);
  }
  const petalM = tmat(0xf0aec4, { emissive: 0x3a1020 });
  if (outfit === 'nun' || outfit === 'monk') { // lotus bud: three curved petals
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const pt = mesh(geo('budPetal', () => new THREE.SphereGeometry(0.036, 10, 8)), petalM, holdLotus, Math.cos(a) * 0.016, 0.062, Math.sin(a) * 0.016, false);
      pt.scale.set(0.8, 1.45, 0.55); pt.rotation.y = -a; pt.rotateZ(0.22);
    }
    mesh(geo('budBase', () => new THREE.SphereGeometry(0.02, 8, 6)), tmat(0x6aa860), holdLotus, 0, 0.02, 0, false);
  } else { // small open lotus
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const pt = mesh(geo('lotPetal', () => new THREE.SphereGeometry(0.034, 10, 8)), petalM, holdLotus, Math.cos(a) * 0.04, 0.05, Math.sin(a) * 0.04, false);
      pt.scale.set(0.6, 1.4, 0.45); pt.rotation.y = -a; pt.rotateZ(0.95);
    }
    mesh(geo('lotCore', () => new THREE.SphereGeometry(0.026, 8, 6)), tmat(0xffd35a), holdLotus, 0, 0.05, 0, false);
  }

  // Accessories
  let accGroup: THREE.Group | null = null;
  const setAccessory = (id: string | null) => {
    if (accGroup) { body.remove(accGroup); accGroup = null; }
    if (!id) return;
    const g = new THREE.Group();
    if (id === 'mu_sen') {
      const pink = tmat(0xff8fb6, { emissive: 0x4a1020 });
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const petal = mesh(geo('petal', () => new THREE.SphereGeometry(0.13, 10, 8)), pink, g, Math.cos(a) * 0.13, 2.17, Math.sin(a) * 0.13, false);
        petal.scale.set(0.55, 1.35, 0.55);
        petal.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
      }
      mesh(geo('petalC', () => new THREE.SphereGeometry(0.1, 10, 8)), tmat(0xffd35a, { emissive: 0x553300 }), g, 0, 2.13, 0, false);
    } else if (id === 'hao_quang') {
      const ring = mesh(geo('halo', () => new THREE.TorusGeometry(0.78, 0.04, 8, 40)),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd36b).multiplyScalar(2.2) }), g, 0, 1.68, -0.55, false);
      mesh(geo('haloD', () => new THREE.CircleGeometry(0.76, 32)), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.22, side: THREE.DoubleSide }), ring, 0, 0, -0.01, false);
    } else if (id === 'khan_do') {
      const red = tmat(0xcc2a1e);
      const sc = mesh(geo('scarf', () => new THREE.TorusGeometry(0.31, 0.085, 10, 24)), red, g, 0, 1.12, 0, false);
      sc.rotation.x = Math.PI / 2;
      mesh(geo('scarfT', () => new THREE.BoxGeometry(0.15, 0.4, 0.06)), red, g, 0.14, 0.9, 0.31, false).rotation.z = 0.12;
    }
    accGroup = g;
    body.add(g);
  };

  // Name label + chat bubble (constant on-screen size)
  const L = makeLabelSprite(!opts?.role); // người chơi: nhãn cao có dòng danh hiệu; NPC: nhãn thường
  if (!opts?.role) L.sprite.center.set(0.5, 1 / 3); // neo tại điểm giữa của nhãn cũ (48/144 từ đáy) để chip tên không dịch chỗ
  L.sprite.position.y = 2.65;
  root.add(L.sprite);
  const setLabel = (n: string, level?: number, isMe?: boolean, title?: string) => {
    L.sprite.userData.chipFrac = drawLabel(L.canvas, L.tex, n, level, isMe, title) / 512;
    // Rect dọc của nhãn, tính bằng phần của chiều cao sprite (dùng cho updateLabelLayout):
    // nhãn thường (canvas 96): chip 18-76, neo ở giữa (48). Nhãn cao của người chơi
    // (canvas 144): chip 66-124, dòng danh hiệu 20-48, neo ở 96 (1/3 từ đáy).
    const tall = L.canvas.height > 96;
    const anchorY = tall ? 96 : 48;
    const topY = tall ? 20 : 18;
    const botY = 76 + (L.canvas.height - 96);
    L.sprite.userData.chipTop = (anchorY - topY) / L.canvas.height;
    L.sprite.userData.chipBot = (botY - anchorY) / L.canvas.height;
  };
  setLabel(name);

  const B = makeLabelSprite();
  B.sprite.center.set(0.5, 0);
  B.sprite.position.y = 2.9;
  B.sprite.visible = false;
  B.sprite.renderOrder = 21;
  root.add(B.sprite);

  const c: Character = {
    root, body, armL, armR, foreL: aL.fore, foreR: aR.fore, hold, holdInc, holdLotus, holdBroom, role: opts?.role, poseW: 0, poseKind: 'abbot', prayW: 0, lastT: 0, face, faceOpen, faceShut, blinkNext: 0, blinkUntil: 0, fade: null, animCalls: 0, legL, legR, shinL, shinR, lap, curAnim: 'idle', t0: 0, gait: -1, label: L.sprite, bubble: B.sprite, bubbleUntil: 0,
    setLabel, setAccessory,
    say(text: string) {
      const g = B.canvas.getContext('2d')!;
      const font = '700 30px system-ui, "Segoe UI", sans-serif';
      g.font = font;
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (g.measureText(t).width > 380 && cur) { lines.push(cur); cur = w; } else cur = t;
      }
      if (cur) lines.push(cur);
      const shown = lines.slice(0, 3);
      if (lines.length > 3) shown[2] = shown[2].slice(0, -1) + '…';
      const lh = 38, h = shown.length * lh + 30;
      B.canvas.width = 420; B.canvas.height = h + 16;
      g.font = font;
      g.fillStyle = 'rgba(38,24,14,.88)';
      g.strokeStyle = 'rgba(246,217,138,.75)'; g.lineWidth = 3;
      g.beginPath(); g.roundRect(6, 4, 408, h, 20); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(200, h + 3); g.lineTo(210, h + 15); g.lineTo(222, h + 3); g.closePath(); g.fill();
      g.fillStyle = '#FAF3E3'; g.textAlign = 'center'; g.textBaseline = 'middle';
      shown.forEach((l, i) => g.fillText(l, 210, 4 + 15 + lh / 2 + i * lh));
      B.tex.dispose();
      B.tex.needsUpdate = true;
      const k = 0.27 / 420;
      B.sprite.scale.set(420 * k, B.canvas.height * k, 1);
      B.sprite.visible = true;
      c.bubbleUntil = performance.now() + 5500 + shown.join('').length * 40;
    },
    dispose() { L.tex.dispose(); B.tex.dispose(); (L.sprite.material as THREE.Material).dispose(); (B.sprite.material as THREE.Material).dispose(); blob.material.dispose(); },
  };
  return c;
}

const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const BOW_MS = 3000;
const BOW_T = BOW_MS / 1000;

// Joined-palms target in body space (hand centre) at the chest; in a deep bow the target slides
// down with the torso instead of being pinned to a fixed world point on the floor.
const CHEST = new THREE.Vector3(0, 0.4 * H, 0.39);
const HIP_Y = 0.45; // hip pivot in body space: the body group rotates about this height
// Deep-bow target, in BODY space: the joined palms stay attached to the torso and only drop a
// little below the chest, so when the body folds forward the hands travel with it instead of
// being stretched toward a fixed point on the floor. Height is referenced to the hip, not y=0.
const BOW_HAND = new THREE.Vector3(0, HIP_Y + 0.30, 0.16);
const _tg = new THREE.Vector3(), _sh = new THREE.Vector3(), _u = new THREE.Vector3(), _p = new THREE.Vector3();
const _e = new THREE.Vector3(), _fd = new THREE.Vector3(), _DOWN = new THREE.Vector3(0, -1, 0);
const _qa = new THREE.Quaternion(), _qf = new THREE.Quaternion();

/** Two-bone IK: put the hand centre of one arm on `target` (body space); hand points along the forearm. */
function solveArm(arm: THREE.Group, fore: THREE.Group, side: number, target: THREE.Vector3, w: number) {
  const L1 = AL1, L2 = AL2;
  _sh.set(side * ARM_X, ARM_Y, 0);
  _u.copy(target).sub(_sh);
  const dist = Math.min(_u.length(), (L1 + L2) * 0.999);
  _u.normalize();
  const cosA = Math.max(-1, Math.min(1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist)));
  const A = Math.acos(cosA);
  _p.set(side * 0.5, -1, -0.3); _p.addScaledVector(_u, -_p.dot(_u)).normalize(); // elbow drops outward
  _e.copy(_u).multiplyScalar(cosA).addScaledVector(_p, Math.sin(A)); // upper-arm direction
  _qa.setFromUnitVectors(_DOWN, _e);
  _fd.copy(target).sub(_sh).addScaledVector(_e, -L1).normalize();
  _qf.setFromUnitVectors(_DOWN, _fd);
  _qf.premultiply(_qa.clone().invert());
  arm.quaternion.slerp(_qa, w);
  fore.quaternion.slerp(_qf, w);
}

// Hanging arms splay outward so the hands (centre x ~0.47) clear the robe wall (radius ~0.35 at hand height).
const HANG_Z = 0.22;
const TAU = Math.PI * 2;
/** Pose clips evaluated by phase (0..1 of one cycle). walk: 0.62 s per step, one cycle = two steps (left + right). */
interface Clip { period: number; amp: number }
const CLIPS: Record<string, Clip> = {
  walk: { period: 1.24, amp: 0.65 },
  run: { period: TAU / 14, amp: 0.95 },
  idle: { period: Math.PI, amp: 0 },
  sit: { period: TAU / 1.3, amp: 0 },
  lie: { period: TAU / 0.9, amp: 0 },
};
const phaseOf = (clip: Clip, e: number) => { const p = (e / clip.period) % 1; return p < 0 ? p + 1 : p; };
const RITUAL = /^(incense|chant|bow|palms)$/;
export const PALMS_MS = 1500;
const FADE_S = 0.15;
const _fq = new THREE.Quaternion(), _fv = new THREE.Vector3();
/** Blend cur (the new pose) from old by k, in place: result = old -> cur. */
function fadeQ(cur: THREE.Quaternion, old: THREE.Quaternion, k: number) { _fq.copy(cur); cur.copy(old).slerp(_fq, k); }
function fadeV(cur: THREE.Vector3, old: THREE.Vector3, k: number) { _fv.copy(cur); cur.copy(old).lerp(_fv, k); }
export const BEADS_MS = 2400;

/** Procedural animation. t = seconds. */
export function animateCharacter(c: Character, anim: Anim | string, t: number) {
  c.animCalls++;
  if (c.bubble.visible && performance.now() > c.bubbleUntil) c.bubble.visible = false;
  if (anim !== c.curAnim) {
    // the objects still hold last frame's final pose: snapshot it as the pose to fade out of
    c.fade = {
      t0: t,
      arms: [c.armL.quaternion.clone(), c.armR.quaternion.clone()],
      fores: [c.foreL.quaternion.clone(), c.foreR.quaternion.clone()],
      legPos: [c.legL.position.clone(), c.legR.position.clone()],
      legRot: [c.legL.quaternion.clone(), c.legR.quaternion.clone()],
      shinRot: [c.shinL.quaternion.clone(), c.shinR.quaternion.clone()],
      bodyPos: c.body.position.clone(),
      bodyRot: c.body.quaternion.clone(),
    };
    c.curAnim = anim; c.t0 = t;
  }
  const dt = Math.max(0, Math.min(0.1, t - c.lastT)); c.lastT = t;
  const faceMat = c.face.material as THREE.MeshToonMaterial;
  if (c.blinkNext === 0) c.blinkNext = t + 1 + Math.random() * 4;
  if (anim === 'lie') {
    c.blinkUntil = 0;
    c.blinkNext = t;
    if (faceMat.map !== c.faceShut) { faceMat.map = c.faceShut; }
  } else if (c.blinkUntil > 0) {
    if (t >= c.blinkUntil) {
      c.blinkUntil = 0;
      c.blinkNext = t + 2 + Math.random() * 4;
      if (faceMat.map !== c.faceOpen) { faceMat.map = c.faceOpen; }
    }
  } else if (t >= c.blinkNext) {
    c.blinkUntil = t + 0.12 + Math.random() * 0.03;
    if (faceMat.map !== c.faceShut) { faceMat.map = c.faceShut; }
  }
  const walk = anim === 'walk' || anim === 'run';
  const clip = CLIPS[anim];
  const amp = walk ? clip.amp : 0;
  const gaitPh = walk && c.gait >= 0 ? c.gait % 1 : clip ? phaseOf(clip, t - c.t0) : 0;
  const cycle = Math.sin(TAU * gaitPh); // -1..1 over one gait cycle
  // prayer weight: 1 only while a ritual action (incense / chant / bow) is running, else hands hang free
  const ritual = RITUAL.test(anim) && !(anim === 'bow' && t - c.t0 > BOW_T - 0.4) && !(anim === 'palms' && t - c.t0 > PALMS_MS / 1000 - 0.3);
  c.prayW += ((ritual ? 1 : 0) - c.prayW) * Math.min(1, dt * 9);
  if (!ritual && c.prayW < 0.002) c.prayW = 0;
  const w = ease(c.prayW);

  // base: arms hang loose at the sides (swinging while walking)
  const sw = cycle * amp;
  c.armL.rotation.set(sw - 0.1, 0, -HANG_Z);
  c.armR.rotation.set(-sw - 0.1, 0, HANG_Z);
  c.foreL.rotation.set(-0.1 - Math.max(0, -sw) * 0.5, 0, 0);
  c.foreR.rotation.set(-0.1 - Math.max(0, sw) * 0.5, 0, 0);
  c.legL.position.set(-0.16, 0.18, cycle * amp * 0.25);
  c.legR.position.set(0.16, 0.18, -cycle * amp * 0.25);
  c.legL.rotation.set(0, 0, 0);
  c.legR.rotation.set(0, 0, 0);
  c.shinL.rotation.set(0, 0, 0);
  c.shinR.rotation.set(0, 0, 0);
  c.legL.visible = c.legR.visible = true;
  c.lap.visible = false;
  c.body.position.set(0, walk ? Math.abs(cycle) * 0.09 : Math.sin(TAU * phaseOf(CLIPS.idle, t)) * 0.014, 0);
  c.body.rotation.set(0, 0, walk ? cycle * 0.04 : 0);
  let lift = 0; // 0 = palms at chest, 1 = palms in the lowered bow pose

  if (anim === 'sit') {
    // lotus position (káº¿t giÃ ): body lowered onto a flared lap, hands in dhyana mudra, slow breathing
    const br = cycle * 0.012;
    c.body.position.y = -0.3 + br;
    c.body.rotation.x = -0.03;
    c.lap.visible = true;
    c.lap.scale.set(0.58 + br * 0.5, 0.05, 0.5);
    c.legL.position.set(-0.08, 0.50, 0.34);
    c.legR.position.set(0.08, 0.50, 0.34);
    c.legL.rotation.set(-1.6581, 0, -0.8727);
    c.legR.rotation.set(-1.6581, 0, 0.8727);
    c.shinL.rotation.set(2.2449, 0, 1.2744);
    c.shinR.rotation.set(2.2449, 0, -1.2744);
    c.legL.visible = c.legR.visible = true;
    c.armL.rotation.set(-0.75, 0, 0.62);
    c.armR.rotation.set(-0.75, 0, -0.62);
    c.foreL.rotation.set(-0.95, 0, 0);
    c.foreR.rotation.set(-0.95, 0, 0);
  } else if (anim === 'lie') {
    // sleeping on the tang-xa bed: flat on the back, head toward local -Z (west once the server sets ry = +PI/2), slow breathing
    const br = cycle * 0.012;
    c.body.position.set(0, 0.65 + br, 0.8); // spine high enough that the back rests on the mattress (top +0.35) and the head clears it; z +0.8 centres the body on the 2.0 m bed
    c.body.rotation.set(-Math.PI / 2 + 0.13, 0, 0); // pitch back onto the back, head end slightly raised
    c.lap.visible = false;
    c.legL.visible = c.legR.visible = false; // legs are children of body and would poke through the robe hem when flat
    c.armL.rotation.set(0, 0, -HANG_Z); // arms relaxed at the sides, no forward tilt, so they rest on the mattress beside the torso
    c.armR.rotation.set(0, 0, HANG_Z);
    c.foreL.rotation.set(-0.1, 0, 0);
    c.foreR.rotation.set(-0.1, 0, 0);
  } else if (anim === 'bow') {
    // full prostration (láº¡y nÄƒm vÃ³c sÃ¡t Ä‘áº¥t): palms joined at chest, kneel, lean down, palms to forehead, rise
    const e = t - c.t0;
    const kneel = ease((e - 0.35) / 0.4) * (1 - ease((e - 2.2) / 0.4));
    const down = ease((e - 0.8) / 0.65) * (1 - ease((e - 1.9) / 0.6));
    // Bow: kneel lowers the hips; down folds the torso forward (capped at ~38Â° so the rigid robe
    // hem never clips the floor). body.y is solved directly from the hem constraint.
    const th = 0.66 * Math.min(down, 0.65); // max ~43 degrees
    // front-hem body-space corner: (0, 0.205, 0.37). World y of that point = body.y + 0.205*cos(th) - 0.37*sin(th).
    // Solve body.y so hem touches y = 0.01:
    const bodyYHem = 0.01 - 0.205 * Math.cos(th) + 0.37 * Math.sin(th);
    // When not bowing, body.y = 0 (standing). Blend toward the hem solution as down increases.
    // Also let kneel drop the body a bit extra (but no more than allowed by the hem constraint).
    const bodyYKneel = lerp(0, -0.08, kneel);
    const bodyY = Math.max(bodyYHem, lerp(bodyYKneel, bodyYHem, down));
    c.body.rotation.x = th;
    c.body.position.set(0, bodyY, -HIP_Y * Math.sin(th));
    lift = down;
    // Legs in body space: shift back in body-local z so they tuck behind when bowing; counter-
    // rotate by th so in world space the shins point straight down to the floor.
    const legZ = lerp(0, -0.22, kneel);
    const legY = lerp(0.18, 0.06, kneel);
    c.legL.position.set(-0.16, legY, legZ);
    c.legR.position.set(0.16, legY, legZ);
    c.legL.rotation.x = c.legR.rotation.x = -th;
  } else if (anim === 'chant') {
    c.body.rotation.x = Math.sin(t * 3) * 0.07;
  } else if (anim === 'sweep') {
    const ph = (t * Math.PI * 2) / 1.1;
    c.body.rotation.y = Math.sin(ph) * 0.32;
    c.body.position.y = Math.cos(ph * 2) * 0.03;
  } else if (anim === 'ring') {
    const pull = Math.sin((t * Math.PI * 2) / 1.0) * 0.5 + 0.5;
    c.body.rotation.x = pull * 0.12;
    c.body.position.y = -pull * 0.03;
  } else if (anim === 'lantern') {
    const lf = Math.sin(t * 4) * 0.12;
    c.armL.rotation.set(-2.1 + lf, 0, 0.25); c.armR.rotation.set(-2.1 + lf, 0, -0.25);
    c.foreL.rotation.set(-0.5, 0, 0); c.foreR.rotation.set(-0.5, 0, 0);
  }

  // tay cá»§a NPC: sÆ° tháº§y cháº¯p tay sau lÆ°ng khi Ä‘á»©ng yÃªn, quÃ©t lÃ¡ hai tay cáº§m chá»•i, Ä‘Ã¡nh chuÃ´ng hai tay kÃ©o dÃ¢y
  const npcPose = anim === 'sweep' || anim === 'ring' || (anim === 'idle' && c.role === 'abbot');
  c.poseW += ((npcPose ? 1 : 0) - c.poseW) * Math.min(1, dt * 9);
  if (!npcPose && c.poseW < 0.002) c.poseW = 0;
  if (npcPose) c.poseKind = anim === 'idle' ? 'abbot' : (anim as 'sweep' | 'ring');
  if (c.poseW > 0 && w === 0) {
    const pw = ease(c.poseW);
    if (c.poseKind === 'sweep') {
      _tg.set(0.07, 0.86, 0.4); solveArm(c.armR, c.foreR, 1, _tg, pw);
      _tg.set(-0.07, 0.71, 0.48); solveArm(c.armL, c.foreL, -1, _tg, pw);
    } else if (c.poseKind === 'ring') {
      const pull = Math.sin((t * Math.PI * 2) / 1.0) * 0.5 + 0.5;
      _tg.set(0.1, 1.22 - pull * 0.34, 0.46); solveArm(c.armR, c.foreR, 1, _tg, pw);
      _tg.set(-0.1, 1.22 - pull * 0.34, 0.46); solveArm(c.armL, c.foreL, -1, _tg, pw);
    } else {
      _tg.set(0.05, 0.62, 0.38); solveArm(c.armR, c.foreR, 1, _tg, pw);
      _tg.set(-0.08, 0.66, -0.36); solveArm(c.armL, c.foreL, -1, _tg, pw);
    }
  }
  if (anim === 'beads' && w === 0) {
    // right hand lifts to the chest and rolls the beads at ~2.5 Hz; left hand stays loose. Envelope: 0.3 s in, hold, 0.3 s out.
    const e = t - c.t0, total = BEADS_MS / 1000;
    const env = ease(e / 0.3) * (1 - ease((e - (total - 0.3)) / 0.3));
    if (env > 0) {
      const roll = Math.sin(e * TAU * 2.5);
      _tg.set(0.09, 0.84 + roll * 0.022, 0.36 + roll * 0.012);
      solveArm(c.armR, c.foreR, 1, _tg, env);
    }
  }
  const sweeping = anim === 'sweep' && c.poseW > 0.6;
  if (sweeping) c.hold.position.set(0, 0.86, 0.4);
  c.holdBroom.visible = sweeping;

  // ritual hands: round palms pressed together (gap 0), fingertips up, blended in by the prayer weight
  if (w > 0) {
    _tg.copy(CHEST);
    // Both targets live in body space, so the deep-bow palms simply glide from the chest to the
    // lowered bow pose and follow the torso as it folds — no world-to-body conversion needed.
    if (lift > 0) _tg.lerp(BOW_HAND, lift);
    _tg.x = HALF_T;
    solveArm(c.armR, c.foreR, 1, _tg, w);
    _tg.x = -HALF_T;
    solveArm(c.armL, c.foreL, -1, _tg, w);
    c.hold.position.set(0, _tg.y - 0.01, _tg.z);
  }
  // crossfade out of the previous anim's pose; arms that already have their own blend (prayer / NPC IK / beads) are left alone
  if (c.fade) {
    const k = ease((t - c.fade.t0) / FADE_S);
    if (t - c.fade.t0 >= FADE_S) c.fade = null;
    else {
      const f = c.fade;
      const ownArmBlend = w > 0 || c.prayW > 0 || c.poseW > 0 || anim === 'beads';
      if (!ownArmBlend) {
        fadeQ(c.armL.quaternion, f.arms[0], k);
        fadeQ(c.armR.quaternion, f.arms[1], k);
        fadeQ(c.foreL.quaternion, f.fores[0], k);
        fadeQ(c.foreR.quaternion, f.fores[1], k);
      }
      fadeV(c.legL.position, f.legPos[0], k);
      fadeV(c.legR.position, f.legPos[1], k);
      fadeQ(c.legL.quaternion, f.legRot[0], k);
      fadeQ(c.legR.quaternion, f.legRot[1], k);
      if (f.shinRot) { fadeQ(c.shinL.quaternion, f.shinRot[0], k); fadeQ(c.shinR.quaternion, f.shinRot[1], k); }
      fadeV(c.body.position, f.bodyPos, k);
      fadeQ(c.body.quaternion, f.bodyRot, k);
    }
  }
  const held = w > 0.6;
  c.holdInc.visible = held && anim === 'incense';
  c.holdLotus.visible = held && (anim === 'chant' || anim === 'bow');
  c.hold.visible = held || sweeping;
}
