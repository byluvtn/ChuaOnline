import * as THREE from 'three';
import { DRAGON_SHAPE, PHOENIX_SHAPE, type FireworkShape } from './data/firework-shapes';

/**
 * Pháo hoa shader (kiểu Bruno Simon - Three.js Journey bài 34) + vệt sáng kiểu Pablo Mesquida.
 *
 * - Mỗi quả pháo = 1 THREE.Points = 1 draw call. Riêng crackle dùng 2 Points (vụ nổ chính + vụ nổ con trễ).
 * - Mỗi hạt gồm `trail` vertex: vertex aTrail = 0 là đầu hạt, aTrail → 1 là đuôi vệt. Vertex shader tính
 *   vị trí của điểm vệt tại thời điểm (t − aTrail × trailTime), nên vệt bám đúng quỹ đạo hạt.
 * - Toàn bộ chuyển động nằm trong vertex shader theo uniform tiến trình uProgress 0→1. Mỗi frame chỉ
 *   tăng uniform, không cấp phát gì.
 *
 * Hai nhóm kiểu nổ:
 *   - Thường (RegularBurstType): sphere, ring, willow, crackle. Hạt bay theo hướng + ma sát + trọng lực.
 *     Thêm kiểu mới: thêm tên vào RegularBurstType, 1 hàm vào DIRECTIONS, 1 entry vào BURST_STYLE.
 *   - Hình (ShapeBurstType): dragon, phoenix. Mỗi hạt bay tới 1 điểm trên silhouette, giữ hình rồi cả đàn
 *     chìm xuống và mờ dần. Shader riêng, tham số ở SHAPE_STYLE. Mặt phẳng hình vuông góc hướng nhìn camera.
 */

export type RegularBurstType = 'sphere' | 'ring' | 'willow' | 'crackle';
export type ShapeBurstType = 'dragon' | 'phoenix';
export type BurstType = RegularBurstType | ShapeBurstType;

export const isShapeType = (type: BurstType): type is ShapeBurstType =>
  type === 'dragon' || type === 'phoenix';

/**
 * Kiểu nổ của 10 quả đầu trong show rồng: 8 quả thường xoay vòng, quả 9 = rồng, quả 10 = phượng.
 * Finale (các quả thêm sau) không nằm trong bảng này, vẫn là sphere.
 */
export const DRAGON_SHOW_TYPES: readonly BurstType[] = [
  'sphere', 'ring', 'willow', 'crackle', 'ring', 'willow', 'crackle', 'ring',
  'dragon', 'phoenix',
];

export interface BurstOptions {
  x: number;
  y: number;
  z: number;
  /** Màu quả thường. Quả hình (dragon/phoenix) bỏ qua, dùng gradient đỏ → vàng cố định. */
  color: number;
  type: BurstType;
  /** renderer.getPixelRatio() lúc tạo burst. */
  pixelRatio: number;
  /** Camera lúc nổ, dùng cho quả hình để dựng mặt phẳng vuông góc hướng nhìn. Thiếu thì dùng mặt phẳng XY. */
  camera?: THREE.Camera | null;
}

export interface ShaderBurst {
  /** Tiến thời gian. Trả false khi quả pháo đã tàn hẳn (lúc đó gọi dispose()). */
  update(dt: number): boolean;
  /** Gỡ khỏi scene và giải phóng geometry/material. Gọi nhiều lần vẫn an toàn. */
  dispose(): void;
}

/** Tham số của 1 lớp hạt (1 THREE.Points). */
export interface LayerStyle {
  /** Số hạt. */
  count: number;
  /** Số vertex mỗi hạt: 1 đầu hạt + (trail − 1) điểm vệt. Phải >= 2. */
  trail: number;
  /** Đời lớp (s): hạt sống lâu nhất tàn đúng lúc này. */
  life: number;
  /** Đời từng hạt = life × [lifeMin, 1], để các hạt không tắt cùng lúc. */
  lifeMin: number;
  /** Tốc độ ban đầu [min, max]. */
  speed: readonly [number, number];
  /** Trọng lực: y -= 0.5 × g × t². */
  gravity: number;
  /** Hệ số ma sát k (> 0). Quãng bay tối đa theo hướng nổ = speed / k. */
  drag: number;
  /** Độ dài vệt tính theo thời gian (s). */
  trailTime: number;
  /** Kích cỡ điểm [min, max]. Đây là hệ số trong công thức gl_PointSize, không phải đơn vị thế giới. */
  size: readonly [number, number];
  /** Độ mạnh nhấp nháy 0..1, đạt tối đa ở cuối đời hạt. */
  twinkle: number;
  /** Tần số nhấp nháy (rad/s). */
  twinkleSpeed: number;
  /** Tuổi hạt (0..1) bắt đầu nhấp nháy. */
  twinkleFrom: number;
}

export interface BurstStyle extends LayerStyle {
  /**
   * Vụ nổ con (crackle). Tia con thứ i bung ra từ vị trí của hạt chính (i % count) tại thời điểm `delay` (s).
   * `count` ở đây là tổng số tia con.
   */
  sub?: LayerStyle & { delay: number };
}

/** Tham số quả hình. Mỗi hạt = 2 vertex (đầu + 1 điểm vệt ngắn). */
export interface ShapeStyle {
  shape: FireworkShape;
  /** Hết pha bay ra (s). */
  flyEnd: number;
  /** Hết pha giữ hình (s). */
  holdEnd: number;
  /** Tổng đời quả (s). Pha tan chạy từ holdEnd tới life. */
  life: number;
  /** Độ chìm tổng của cả đàn trong pha tan (m). */
  sink: number;
  /** Nhiễu vị trí đích mỗi trục, ±jitter (m). */
  jitter: number;
  /** Độ lệch sâu dọc hướng nhìn, ±depth (m). */
  depth: number;
  /** Độ dài điểm vệt theo thời gian (s). */
  trailTime: number;
  /** Kích cỡ điểm [min, max], cùng hệ số với LayerStyle.size nhưng nhỏ hơn nhiều vì hạt dày đặc. */
  size: readonly [number, number];
  /** Hệ số phóng to điểm mắt. */
  eyeScale: number;
  /** Độ mạnh nhấp nháy ở pha bay và pha tan. */
  twinkle: number;
  /** Độ mạnh nhấp nháy ở pha giữ hình (nhẹ hơn). */
  twinkleHold: number;
  twinkleSpeed: number;
  /** Nhân vào alpha, giảm bão hòa khi hơn 1000 hạt cộng dồn (additive). */
  intensity: number;
}

type Rand = () => number;
type DirectionFn = (count: number, rand: Rand) => Float32Array;

// ---------------------------------------------------------------------------
// Phân phối hướng theo kiểu nổ thường. Mỗi hàm trả về Float32Array dài count×3 gồm các vector đơn vị.
// ---------------------------------------------------------------------------

/** Đều trên mặt cầu. */
const sphereDirections: DirectionFn = (count, rand) => {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const up = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - up * up);
    out[i * 3] = r * Math.cos(a);
    out[i * 3 + 1] = up;
    out[i * 3 + 2] = r * Math.sin(a);
  }
  return out;
};

/** Vòng tròn trong mặt phẳng ngang, cả vòng nghiêng ngẫu nhiên tối đa ~17° quanh trục X và Z. */
const ringDirections: DirectionFn = (count, rand) => {
  const out = new Float32Array(count * 3);
  const tx = (rand() - 0.5) * 0.6, tz = (rand() - 0.5) * 0.6;
  const cx = Math.cos(tx), sx = Math.sin(tx), cz = Math.cos(tz), sz = Math.sin(tz);
  for (let i = 0; i < count; i++) {
    const a = ((i + rand() * 0.3) / count) * Math.PI * 2;
    const x = Math.cos(a), y = (rand() - 0.5) * 0.04, z = Math.sin(a);
    // Xoay quanh trục X rồi quanh trục Z.
    const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
    out[i * 3] = x * cz - y1 * sz;
    out[i * 3 + 1] = x * sz + y1 * cz;
    out[i * 3 + 2] = z1;
  }
  return out;
};

/** Liễu rủ: nghiêng về nửa trên để tia vồng lên trước rồi mới rủ xuống. */
const willowDirections: DirectionFn = (count, rand) => {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const up = rand() * 1.4 - 0.4;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - up * up);
    out[i * 3] = r * Math.cos(a);
    out[i * 3 + 1] = up;
    out[i * 3 + 2] = r * Math.sin(a);
  }
  return out;
};

const DIRECTIONS: Record<RegularBurstType, DirectionFn> = {
  sphere: sphereDirections,
  ring: ringDirections,
  willow: willowDirections,
  crackle: sphereDirections,
};

/** Hướng bay của `count` hạt theo kiểu nổ thường. Quả hình không dùng hướng (xem SHAPE_STYLE). */
export const burstDirections = (type: RegularBurstType, count: number, rand: Rand = Math.random): Float32Array =>
  DIRECTIONS[type](count, rand);

// ---------------------------------------------------------------------------
// Bảng tham số theo kiểu nổ.
// Ngân sách mobile: count × trail (cộng cả lớp con nếu có) <= ~1600 vertex mỗi quả thường.
//   sphere 140×9 = 1260 | ring 120×9 = 1080 | willow 100×14 = 1400 | crackle 60×7 + 240×4 = 1380
// Quả hình: dragon 1300×2 = 2600 | phoenix 1056×2 = 2112 (vẫn 1 draw call).
// ---------------------------------------------------------------------------
export const BURST_STYLE: Record<RegularBurstType, BurstStyle> = {
  sphere: {
    count: 140, trail: 9, life: 2.0, lifeMin: 0.8,
    speed: [4.5, 6.5], gravity: 1.4, drag: 1.5, trailTime: 0.22,
    size: [1.4, 2.0], twinkle: 0.8, twinkleSpeed: 28, twinkleFrom: 0.35,
  },
  ring: {
    count: 120, trail: 9, life: 2.0, lifeMin: 0.85,
    speed: [5.2, 5.8], gravity: 1.1, drag: 1.6, trailTime: 0.2,
    size: [1.4, 1.9], twinkle: 0.6, twinkleSpeed: 24, twinkleFrom: 0.4,
  },
  // Tốc độ thấp, trọng lực trội so với tốc độ, vệt dài: hạt vồng nhẹ rồi rủ xuống chậm như cành liễu.
  willow: {
    count: 100, trail: 14, life: 3.0, lifeMin: 0.8,
    speed: [2.6, 4.0], gravity: 1.1, drag: 1.3, trailTime: 0.6,
    size: [1.2, 1.7], twinkle: 0.35, twinkleSpeed: 18, twinkleFrom: 0.5,
  },
  // Vụ nổ chính nhỏ. Ở giây 0,6 (50% đời chính) mỗi hạt bung ra 4 tia con nhỏ, nhanh, nhấp nháy dày.
  // Tổng thời lượng = 0,6 + 1,8 = 2,4s.
  crackle: {
    count: 60, trail: 7, life: 1.2, lifeMin: 0.85,
    speed: [3.5, 5.5], gravity: 1.2, drag: 1.8, trailTime: 0.15,
    size: [1.2, 1.6], twinkle: 0.5, twinkleSpeed: 30, twinkleFrom: 0.3,
    sub: {
      delay: 0.6,
      count: 240, trail: 4, life: 1.8, lifeMin: 0.6,
      speed: [1.5, 3.5], gravity: 1.5, drag: 3.5, trailTime: 0.06,
      size: [0.6, 1.0], twinkle: 1.0, twinkleSpeed: 55, twinkleFrom: 0.0,
    },
  },
};

// Pha thời gian chung của quả hình: bay 0–0.9s, giữ 0.9–2.1s, tan 2.1–3.1s.
// Kích cỡ điểm + intensity đã chỉnh sau ảnh chụp headless 2026-11-18: size [0.35, 0.5]
// cháy trắng (điểm ~13px ở 10m, cách nhau chỉ ~2px) làm nhòe silhouette; [0.15, 0.22]
// cho điểm ~5px, khe hở trong hình mới đọc được.
const SHAPE_COMMON = {
  flyEnd: 0.9, holdEnd: 2.1, life: 3.1,
  sink: 0.9, jitter: 0.05, depth: 0.15,
  trailTime: 0.07, size: [0.15, 0.22] as const, eyeScale: 2.2,
  twinkle: 0.5, twinkleHold: 0.15, twinkleSpeed: 26, intensity: 0.7,
};

export const SHAPE_STYLE: Record<ShapeBurstType, ShapeStyle> = {
  dragon: { ...SHAPE_COMMON, shape: DRAGON_SHAPE },
  phoenix: { ...SHAPE_COMMON, shape: PHOENIX_SHAPE },
};

// Màu quả hình: đuôi (tint 0) đỏ → đầu (tint 1) vàng; mắt trắng-xanh.
const SHAPE_COLOR_TAIL = 0xff4a2a;
const SHAPE_COLOR_HEAD = 0xffd36b;
const SHAPE_COLOR_EYE = 0x9fe8ff;

// ---------------------------------------------------------------------------
// GLSL dùng chung: điểm tròn mềm, nhấp nháy, lõi nóng sáng.
// ---------------------------------------------------------------------------

const POINT_GLSL = /* glsl */ `
// Vẽ điểm tròn mềm: bỏ pixel ngoài vòng tròn, trả độ sáng 0..1 (đậm ở tâm).
float softPoint() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float g = 1.0 - smoothstep(0.0, 0.5, d);
  return g * g;
}
// Nhấp nháy bằng sin. amount = 0 thì không nhấp nháy, 1 thì tắt hẳn ở đáy sóng.
float twinkleFactor(float time, float speed, float phase, float amount) {
  float s = 0.5 + 0.5 * sin(time * speed + phase);
  return mix(1.0, s, amount);
}
// Lõi ngả trắng cho cảm giác nóng sáng.
vec3 hotCore(vec3 col, float glow, float amount) {
  return mix(col, vec3(1.0), smoothstep(0.55, 1.0, glow) * amount);
}
`;

// ---------------------------------------------------------------------------
// Shader quả thường
// ---------------------------------------------------------------------------

const VERTEX_SHADER = /* glsl */ `
uniform float uProgress;
uniform float uLife;
uniform float uGravity;
uniform float uDrag;
uniform float uTrailTime;
uniform float uPixelRatio;

attribute vec3 aDir;
attribute float aSpeed;
attribute float aSize;
attribute float aPhase;
attribute float aLife;
attribute float aTrail;

varying float vAlpha;
varying float vAge;
varying float vPhase;

void main() {
  float t = uProgress * uLife;
  float age = t / (uLife * aLife);
  // Thời điểm của điểm vệt này: trễ hơn đầu hạt aTrail × trailTime.
  float te = t - aTrail * uTrailTime;
  vAge = age;
  vPhase = aPhase;
  vAlpha = 0.0;
  if (te < 0.0 || age >= 1.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }
  // position = điểm gốc (0 với vụ nổ chính, vị trí hạt cha với vụ nổ con).
  // Ma sát kéo theo hàm mũ + trọng lực. PHẢI khớp parentPositionsAt() phía CPU.
  vec3 p = position + aDir * aSpeed * (1.0 - exp(-uDrag * te)) / uDrag;
  p.y -= 0.5 * uGravity * te * te;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float flash = 1.0 + 0.8 * (1.0 - smoothstep(0.0, 0.08, age)); // chớp sáng lúc vừa nổ
  float trailFade = 1.0 - aTrail;
  gl_PointSize = max(0.0, aSize * mix(1.0, 0.3, aTrail) * flash * uPixelRatio * (300.0 / -mv.z));
  vAlpha = (1.0 - smoothstep(0.65, 1.0, age)) * trailFade * trailFade;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uColor;
uniform float uProgress;
uniform float uLife;
uniform float uTwinkle;
uniform float uTwinkleSpeed;
uniform float uTwinkleFrom;

varying float vAlpha;
varying float vAge;
varying float vPhase;

${POINT_GLSL}

void main() {
  float glow = softPoint();
  // Nhấp nháy mạnh dần về cuối đời hạt.
  float tw = twinkleFactor(
    uProgress * uLife, uTwinkleSpeed, vPhase,
    smoothstep(uTwinkleFrom, 1.0, vAge) * uTwinkle
  );
  vec3 col = hotCore(uColor, glow, 0.7);
  gl_FragColor = vec4(col, glow * vAlpha * tw);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// ---------------------------------------------------------------------------
// Shader quả hình (rồng, phượng)
// ---------------------------------------------------------------------------

const SHAPE_VERTEX_SHADER = /* glsl */ `
uniform float uProgress;
uniform float uLife;
uniform float uFlyEnd;
uniform float uHoldEnd;
uniform float uSink;
uniform float uTrailTime;
uniform float uPixelRatio;
uniform float uTwinkle;
uniform float uTwinkleHold;
uniform vec3 uRight;
uniform vec3 uUp;

attribute vec2 aTarget;
attribute float aDepth;
attribute float aTint;
attribute float aEye;
attribute float aSize;
attribute float aPhase;
attribute float aTrail;

varying float vAlpha;
varying float vTint;
varying float vEye;
varying float vPhase;
varying float vTwAmp;

void main() {
  float t = uProgress * uLife;
  // Điểm vệt trễ hơn đầu hạt aTrail × trailTime.
  float te = t - aTrail * uTrailTime;
  vTint = aTint;
  vEye = aEye;
  vPhase = aPhase;
  vAlpha = 0.0;
  vTwAmp = 0.0;
  if (te < 0.0 || t >= uLife) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  // Pha bay: ease-out bậc 3, không trọng lực. Sau flyEnd k = 1 nên hạt đứng yên ở đích.
  float q = 1.0 - clamp(te / uFlyEnd, 0.0, 1.0);
  float k = 1.0 - q * q * q;
  // Mặt phẳng hình = (right, up) của camera; độ sâu dọc pháp tuyến (hướng nhìn).
  vec3 normal = cross(uRight, uUp);
  vec3 p = position + (uRight * aTarget.x + uUp * aTarget.y + normal * aDepth) * k;

  // Pha tan: cả đàn chìm cùng một độ rơi theo thời gian (không phụ thuộc hạt) nên hình không méo.
  float s = clamp((te - uHoldEnd) / (uLife - uHoldEnd), 0.0, 1.0);
  p.y -= uSink * s * s;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // Pha giữ hình nhấp nháy nhẹ hơn; chuyển mượt ở hai đầu.
  float holdMask = smoothstep(uFlyEnd - 0.1, uFlyEnd, t) * (1.0 - smoothstep(uHoldEnd, uHoldEnd + 0.2, t));
  vTwAmp = mix(uTwinkle, uTwinkleHold, holdMask);

  gl_PointSize = max(0.0, aSize * mix(1.0, 0.6, aTrail) * uPixelRatio * (300.0 / -mv.z));

  // Fade-in ngắn để hàng nghìn hạt chồng nhau ở tâm không chớp trắng; mờ dần suốt pha tan.
  float fadeIn = smoothstep(0.0, 0.1, t);
  float fadeOut = 1.0 - smoothstep(uHoldEnd, uLife, t);
  vAlpha = fadeIn * fadeOut * mix(1.0, 0.35, aTrail);
}
`;

const SHAPE_FRAGMENT_SHADER = /* glsl */ `
uniform float uProgress;
uniform float uLife;
uniform float uTwinkleSpeed;
uniform float uIntensity;
uniform vec3 uColorTail;
uniform vec3 uColorHead;
uniform vec3 uColorEye;

varying float vAlpha;
varying float vTint;
varying float vEye;
varying float vPhase;
varying float vTwAmp;

${POINT_GLSL}

void main() {
  float glow = softPoint();
  float tw = twinkleFactor(uProgress * uLife, uTwinkleSpeed, vPhase, vTwAmp);
  vec3 base = mix(mix(uColorTail, uColorHead, vTint), uColorEye, vEye);
  // Lõi trắng nhẹ hơn quả thường để gradient đỏ → vàng không bị rửa trắng khi hạt chồng nhau.
  vec3 col = hotCore(base, glow, 0.35);
  gl_FragColor = vec4(col, glow * vAlpha * tw * uIntensity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// ---------------------------------------------------------------------------
// Dựng lớp hạt
// ---------------------------------------------------------------------------

interface Layer {
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  progress: THREE.IUniform<number>;
  delay: number;
  life: number;
}

const pick = (r: readonly [number, number], rand: Rand) => r[0] + (r[1] - r[0]) * rand();

const makeSpeeds = (style: LayerStyle, rand: Rand): Float32Array => {
  const out = new Float32Array(style.count);
  for (let i = 0; i < style.count; i++) out[i] = pick(style.speed, rand);
  return out;
};

/** Vị trí đầu hạt tại thời điểm t (s). Bản CPU của công thức trong VERTEX_SHADER, phải giữ khớp. */
const parentPositionsAt = (style: LayerStyle, dirs: Float32Array, speeds: Float32Array, t: number): Float32Array => {
  const out = new Float32Array(style.count * 3);
  const f = (1 - Math.exp(-style.drag * t)) / style.drag;
  const drop = 0.5 * style.gravity * t * t;
  for (let i = 0; i < style.count; i++) {
    const d = speeds[i] * f;
    out[i * 3] = dirs[i * 3] * d;
    out[i * 3 + 1] = dirs[i * 3 + 1] * d - drop;
    out[i * 3 + 2] = dirs[i * 3 + 2] * d;
  }
  return out;
};

const buildLayer = (
  style: LayerStyle,
  dirs: Float32Array,
  speeds: Float32Array,
  origins: Float32Array | null,
  delay: number,
  color: THREE.Color,
  pixelRatio: number,
  rand: Rand,
): Layer => {
  const n = style.count * style.trail;
  const position = new Float32Array(n * 3);
  const aDir = new Float32Array(n * 3);
  const aSpeed = new Float32Array(n);
  const aSize = new Float32Array(n);
  const aPhase = new Float32Array(n);
  const aLife = new Float32Array(n);
  const aTrail = new Float32Array(n);

  for (let i = 0; i < style.count; i++) {
    const size = pick(style.size, rand);
    const phase = rand() * Math.PI * 2;
    const life = style.lifeMin + (1 - style.lifeMin) * rand();
    for (let j = 0; j < style.trail; j++) {
      const v = i * style.trail + j;
      for (let c = 0; c < 3; c++) {
        aDir[v * 3 + c] = dirs[i * 3 + c];
        position[v * 3 + c] = origins ? origins[i * 3 + c] : 0;
      }
      aSpeed[v] = speeds[i];
      aSize[v] = size;
      aPhase[v] = phase;
      aLife[v] = life;
      aTrail[v] = j / (style.trail - 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aDir', new THREE.BufferAttribute(aDir, 3));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  geometry.setAttribute('aLife', new THREE.BufferAttribute(aLife, 1));
  geometry.setAttribute('aTrail', new THREE.BufferAttribute(aTrail, 1));

  const progress: THREE.IUniform<number> = { value: 0 };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uProgress: progress,
      uLife: { value: style.life },
      uGravity: { value: style.gravity },
      uDrag: { value: style.drag },
      uTrailTime: { value: style.trailTime },
      uPixelRatio: { value: pixelRatio },
      uColor: { value: color },
      uTwinkle: { value: style.twinkle },
      uTwinkleSpeed: { value: style.twinkleSpeed },
      uTwinkleFrom: { value: style.twinkleFrom },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  // Bounding sphere tính từ `position` (điểm gốc) quá nhỏ so với vùng hạt bay thật, nên tắt cull.
  points.frustumCulled = false;
  return { points, progress, delay, life: style.life };
};

/** Vector phải/lên của camera lúc nổ. Không có camera thì dùng mặt phẳng XY. */
const cameraPlane = (camera: THREE.Camera | null | undefined): { right: THREE.Vector3; up: THREE.Vector3 } => {
  const right = new THREE.Vector3(1, 0, 0);
  const up = new THREE.Vector3(0, 1, 0);
  if (camera) {
    const back = new THREE.Vector3();
    camera.matrixWorld.extractBasis(right, up, back);
    right.normalize();
    up.normalize();
  }
  return { right, up };
};

/** Dựng lớp hạt cho quả hình: mỗi hạt = 2 vertex (đầu + 1 điểm vệt). */
const buildShapeLayer = (
  style: ShapeStyle,
  camera: THREE.Camera | null | undefined,
  pixelRatio: number,
  rand: Rand,
): Layer => {
  const shape = style.shape;
  const count = Math.floor(shape.points.length / 2);
  const vertsPerParticle = 2;
  const n = count * vertsPerParticle;

  const eyeSet = new Set<number>(shape.eyes);
  const position = new Float32Array(n * 3); // luôn 0: tâm nổ nằm ở points.position
  const aTarget = new Float32Array(n * 2);
  const aDepth = new Float32Array(n);
  const aTint = new Float32Array(n);
  const aEye = new Float32Array(n);
  const aSize = new Float32Array(n);
  const aPhase = new Float32Array(n);
  const aTrail = new Float32Array(n);

  for (let i = 0; i < count; i++) {
    const sx = shape.points[i * 2];
    const sy = shape.points[i * 2 + 1];
    // Đích = điểm trên silhouette + nhiễu nhỏ để không quá đều.
    const tx = sx + (rand() * 2 - 1) * style.jitter;
    const ty = sy + (rand() * 2 - 1) * style.jitter;
    const depth = (rand() * 2 - 1) * style.depth;
    // Tint theo x đã chuẩn hoá trong khung hình: 0 ở trái (đuôi) → 1 ở phải (đầu).
    const tint = Math.min(1, Math.max(0, sx / shape.width + 0.5));
    const eye = eyeSet.has(i) ? 1 : 0;
    const size = pick(style.size, rand) * (eye ? style.eyeScale : 1);
    const phase = rand() * Math.PI * 2;
    for (let j = 0; j < vertsPerParticle; j++) {
      const v = i * vertsPerParticle + j;
      aTarget[v * 2] = tx;
      aTarget[v * 2 + 1] = ty;
      aDepth[v] = depth;
      aTint[v] = tint;
      aEye[v] = eye;
      aSize[v] = size;
      aPhase[v] = phase;
      aTrail[v] = j; // 0 = đầu hạt, 1 = điểm vệt
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aTarget', new THREE.BufferAttribute(aTarget, 2));
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(aDepth, 1));
  geometry.setAttribute('aTint', new THREE.BufferAttribute(aTint, 1));
  geometry.setAttribute('aEye', new THREE.BufferAttribute(aEye, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  geometry.setAttribute('aTrail', new THREE.BufferAttribute(aTrail, 1));

  const { right, up } = cameraPlane(camera);
  const progress: THREE.IUniform<number> = { value: 0 };
  const material = new THREE.ShaderMaterial({
    vertexShader: SHAPE_VERTEX_SHADER,
    fragmentShader: SHAPE_FRAGMENT_SHADER,
    uniforms: {
      uProgress: progress,
      uLife: { value: style.life },
      uFlyEnd: { value: style.flyEnd },
      uHoldEnd: { value: style.holdEnd },
      uSink: { value: style.sink },
      uTrailTime: { value: style.trailTime },
      uPixelRatio: { value: pixelRatio },
      uTwinkle: { value: style.twinkle },
      uTwinkleHold: { value: style.twinkleHold },
      uTwinkleSpeed: { value: style.twinkleSpeed },
      uIntensity: { value: style.intensity },
      uRight: { value: right },
      uUp: { value: up },
      uColorTail: { value: new THREE.Color(SHAPE_COLOR_TAIL) },
      uColorHead: { value: new THREE.Color(SHAPE_COLOR_HEAD) },
      uColorEye: { value: new THREE.Color(SHAPE_COLOR_EYE) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, progress, delay: 0, life: style.life };
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Các lớp của quả thường. Crackle có thêm lớp vụ nổ con. */
const buildRegularLayers = (type: RegularBurstType, opts: BurstOptions, rand: Rand): Layer[] => {
  const style = BURST_STYLE[type];
  const color = new THREE.Color(opts.color);
  const dirs = burstDirections(type, style.count, rand);
  const speeds = makeSpeeds(style, rand);
  const layers: Layer[] = [buildLayer(style, dirs, speeds, null, 0, color, opts.pixelRatio, rand)];

  if (style.sub) {
    const sub = style.sub;
    const parents = parentPositionsAt(style, dirs, speeds, sub.delay);
    const origins = new Float32Array(sub.count * 3);
    for (let i = 0; i < sub.count; i++) {
      const p = i % style.count;
      origins[i * 3] = parents[p * 3];
      origins[i * 3 + 1] = parents[p * 3 + 1];
      origins[i * 3 + 2] = parents[p * 3 + 2];
    }
    layers.push(buildLayer(sub, sphereDirections(sub.count, rand), makeSpeeds(sub, rand), origins, sub.delay, color, opts.pixelRatio, rand));
  }
  return layers;
};

/** Tạo 1 quả pháo nổ tại (x, y, z) và thêm vào scene. Crackle tự quản lý vụ nổ con bên trong. */
export const createBurst = (scene: THREE.Scene, opts: BurstOptions, rand: Rand = Math.random): ShaderBurst => {
  const type = opts.type;
  const layers: Layer[] = isShapeType(type)
    ? [buildShapeLayer(SHAPE_STYLE[type], opts.camera, opts.pixelRatio, rand)]
    : buildRegularLayers(type, opts, rand);

  let duration = 0;
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    l.points.position.set(opts.x, opts.y, opts.z);
    l.points.visible = l.delay <= 0;
    scene.add(l.points);
    duration = Math.max(duration, l.delay + l.life);
  }

  let elapsed = 0;
  let disposed = false;

  return {
    update(dt: number): boolean {
      elapsed += dt;
      for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        const local = elapsed - l.delay;
        if (local < 0) continue;
        l.points.visible = true;
        l.progress.value = Math.min(1, local / l.life);
      }
      return elapsed < duration;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        scene.remove(l.points);
        l.points.geometry.dispose();
        l.points.material.dispose();
      }
    },
  };
};
