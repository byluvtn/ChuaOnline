import * as THREE from 'three';
import { FIREWORKS } from '../shared/game';
import type { FireworkSize } from '../shared/types';
import { fireworkShape, type FireworkShape } from './data/firework-shapes';
import { signTexture } from './textures';

type Regular = 'sphere' | 'ring' | 'willow' | 'crackle';
export type BurstType = Regular | FireworkShape;
const ROCKET_TIME = 1;
const SHAPE_LIFE = 3.1;
const TAU = Math.PI * 2;
const BURST_CYCLE = ['ring', 'willow', 'crackle'] as const;
const FINALE_SHELLS = 3;
const PALETTES = [
  [0xff401e, 0xffd987, 0xfff0bd], [0x7955ff, 0x9ceaff, 0xe7f7ff],
  [0xe34a23, 0xffc651, 0xffedaa], [0xc62367, 0xff8198, 0xffedd5],
  [0x157db5, 0x5be0c8, 0xe2ffec],
] as const;

// One point batch per shell. Each trail sample evaluates the same path at an earlier age.
const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uDpr;
uniform float uMode;
attribute vec3 aVector;
attribute vec4 aSpark; // size, lifetime, delay, trail fraction
attribute vec4 aStyle; // tone, phase, drag/motion, gravity or trail time
varying float vAlpha;
varying float vTone;
varying float vCore;

void main() {
  float t = uTime - aSpark.z;
  float age = t / aSpark.y;
  float trail = aSpark.w;
  float trailTime = uMode < .5 ? (aStyle.w < .85 ? .57 : .27) : aStyle.w;
  float te = t - trail * trailTime;
  vAlpha = 0.0;
  vTone = aStyle.x;
  vCore = 1.0 - trail;
  if (te < 0.0 || age >= 1.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 1.0;
    return;
  }
  vec4 mv;
  float size = aSpark.x * mix(1.0, 0.48, trail);
  if (uMode > 1.5) {
    // A world-anchored drawing, always facing the viewer. The shape opens in sections.
    float k = smoothstep(0.0, 0.47, te);
    float fall = smoothstep(2.04, 3.1, uTime);
    vec2 p = aVector.xy * k;
    float motion = aStyle.z;
    if (uMode < 2.5) {
      p.y += sin(aVector.x * 2.8 - uTime * 3.6) * .115 * motion * k;
      p.x += cos(aVector.y * 3.8 - uTime * 2.8) * .047 * motion * k;
    } else {
      float wings = smoothstep(.18, 1.8, abs(aVector.x)) * smoothstep(-.65, -.23, aVector.y);
      p.y += sin(uTime * 5.0) * .24 * wings * motion * k;
      p.x *= 1.0 - .075 * wings * (1.0 - cos(uTime * 5.0)) * k;
      p.x += sin(uTime * 4.2 + aVector.y * 5.0) * smoothstep(.25, 1.6, -aVector.y) * .11 * motion * k;
    }
    p += vec2(cos(aStyle.y), sin(aStyle.y)) * fall * (.24 + .24 * motion);
    p.y -= fall * (.44 + .2 * motion);
    mv = modelViewMatrix * vec4(position, 1.0);
    // Keep close-range silhouettes from overflowing short or portrait views.
    float span = min(1.0 / projectionMatrix[0][0], 1.0 / projectionMatrix[1][1]);
    float fit = clamp((-mv.z * span) / 3.0, .28, 1.0);
    mv.xy += p * fit;
    mv.z += aVector.z * k * fit;
    size *= fit;
    vAlpha = smoothstep(.10, .37, te) * (1.0 - fall) * mix(1.0, .28, trail)
      * (.95 + .05 * sin(uTime * 9.0 + aStyle.y));
  } else if (uMode > .5) {
    float q = clamp(te / aSpark.y, 0.0, 1.0);
    float lift = 1.0 - (1.0 - q) * (1.0 - q * .32);
    vec3 p = aVector * lift;
    p.xz *= q * q; // All trajectories start at the box; the fan opens late in the ascent.
    p.x += sin(q * 4.0 + aStyle.y) * trail * .18;
    p.z += cos(q * 4.0 + aStyle.y) * trail * .18;
    mv = modelViewMatrix * vec4(p + position, 1.0);
    vAlpha = (1.0 - trail) * (1.0 - trail) * smoothstep(0.0, .09, q);
  } else {
    float gravity = aStyle.w;
    vec3 p = position + aVector * ((1.0 - exp(-aStyle.z * te)) / aStyle.z);
    p.y -= .5 * gravity * te * te;
    mv = modelViewMatrix * vec4(p, 1.0);
    float twinkle = mix(1.0, .7 + .3 * sin(t * 27.0 + aStyle.y), smoothstep(.28, .9, age));
    vTone *= 1.0 - .39 * smoothstep(.31, 1.0, age);
    float head = 1.0 - smoothstep(.0, .11, trail);
    vAlpha = smoothstep(0.0, .06, te) * (1.0 - smoothstep(.52, 1.0, age)) * (1.0 - trail) * twinkle;
    size *= 1.0 + .34 * head * (1.0 - smoothstep(0.0, .16, age));
  }
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(size * uDpr * 62.0 / max(0.5, -mv.z), 1.0, 15.0 * uDpr);
}
`;

const fragmentShader = /* glsl */ `
uniform float uMode;
uniform vec3 uCool;
uniform vec3 uHot;
uniform vec3 uAccent;
varying float vAlpha;
varying float vTone;
varying float vCore;
void main() {
  float d = length(gl_PointCoord - .5) * 2.0;
  if (d >= 1.0 || vAlpha < .003) discard;
  float halo = pow(1.0 - d, 1.18);
  float kernel = 1.0 - smoothstep(.14, .58, d);
  vec3 col = mix(uCool, uHot, clamp(vTone, 0.0, 1.0));
  col = mix(col, uAccent, clamp((vTone - 1.0) * 1.66, 0.0, 1.0));
  col = mix(col, vec3(1.0, .97, .9), kernel * .31 * vCore);
  if (uMode > 1.5) {
    // A warm, darker rim keeps the bright core readable even against daylight.
    float core = 1.0 - smoothstep(.38, .78, d);
    vec3 rim = mix(uCool * .24, uCool * .66, vCore);
    gl_FragColor = vec4(mix(rim, col, core), (1.0 - smoothstep(.60, 1.0, d)) * vAlpha);
  } else {
    gl_FragColor = vec4(col, min(1.0, halo * .76 + kernel * .40) * vAlpha);
  }
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

type Palette = readonly [number, number, number];
type Batch = { points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>; life: number; age: number };

function batch(mode: number, life: number, palette: Palette, dpr: number, fill: (emit: Emit) => void): Batch {
  const pos: number[] = [], vector: number[] = [], spark: number[] = [], style: number[] = [];
  fill((x, y, z, vx, vy, vz, size, duration, delay, tone, phase, drag, gravity, trail) => {
    for (let j = 0; j < trail; j++) {
      pos.push(x, y, z); vector.push(vx, vy, vz);
      spark.push(size, duration, delay, j / Math.max(1, trail - 1));
      style.push(tone, phase, drag, gravity);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('aVector', new THREE.Float32BufferAttribute(vector, 3));
  geometry.setAttribute('aSpark', new THREE.Float32BufferAttribute(spark, 4));
  geometry.setAttribute('aStyle', new THREE.Float32BufferAttribute(style, 4));
  // Origins alone are not a valid bound for GPU-driven trajectories.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), mode === 0 ? 10 : 6);
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: { uTime: { value: 0 }, uMode: { value: mode }, uDpr: { value: Math.min(dpr, 2) },
      uCool: { value: new THREE.Color(palette[0]) }, uHot: { value: new THREE.Color(palette[1]) },
      uAccent: { value: new THREE.Color(palette[2]) } },
    transparent: true, depthWrite: false, blending: mode > 1 ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
  return { points: new THREE.Points(geometry, material), age: 0, life };
}

type Emit = (x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number,
  life: number, delay: number, tone: number, phase: number, drag: number, gravity: number, trail: number) => void;

export function makeFireworkBurst(kind: BurstType, palette: Palette, dpr: number, rand = Math.random): Batch {
  if (kind === 'dragon' || kind === 'phoenix') {
    const shapePalette: Palette = kind === 'dragon' ? [0xff5737, 0xffdc6e, 0xbdfff0] : [0xff4b99, 0xffcc69, 0xd2f3ff];
    return batch(kind === 'dragon' ? 2 : 3, SHAPE_LIFE, shapePalette, dpr, (emit) => {
      for (const p of fireworkShape(kind)) {
        emit(0, 0, 0, p.x, p.y, (rand() - .5) * .13, .92 * p.weight, SHAPE_LIFE - p.reveal,
          p.reveal, p.tone, rand() * TAU, p.motion, .07, p.weight > 1.1 ? 2 : 1);
      }
    });
  }
  const life = kind === 'willow' ? 2.85 : kind === 'crackle' ? 2.15 : 2;
  return batch(0, life, palette, dpr, (emit) => {
    const count = kind === 'ring' ? 78 : kind === 'crackle' ? 56 : 110;
    const angle = rand() * TAU, tilt = .64 + rand() * .32;
    for (let i = 0; i < count; i++) {
      const inner = i % 5 === 0;
      const a = i * 2.399963 + angle + (rand() - .5) * .12;
      const up = kind === 'willow' ? .16 + rand() * .82 : 2 * (i + .5) / count - 1;
      const r = Math.sqrt(1 - up * up);
      const speed = (inner ? .62 : 1) * (kind === 'willow' ? 3.2 + rand() : 5 + 1.65 * rand());
      const vx = Math.cos(a) * (kind === 'ring' ? 1 : r) * speed;
      const vy = (kind === 'ring' ? Math.sin(a) * tilt : up) * speed;
      const vz = Math.sin(a) * (kind === 'ring' ? Math.sqrt(1 - tilt * tilt) : r) * speed;
      const gravity = kind === 'willow' ? .75 : 1.14;
      const drag = kind === 'willow' ? 1.28 : 1.65;
      const lifespan = (kind === 'crackle' ? 1.15 : life) * (.75 + .25 * rand());
      emit(0, 0, 0, vx, vy, vz, .9 + rand() * .34, lifespan, 0, inner ? 1.26 : .69 + .31 * rand(),
        rand() * TAU, drag, gravity, kind === 'willow' ? 12 : 8);
      if (kind !== 'crackle') continue;
      const delay = .44 + rand() * .26;
      const reach = (1 - Math.exp(-drag * delay)) / drag;
      for (let j = 0; j < 4; j++) {
        const b = a + j * TAU / 4 + rand() * .5, v = 1.3 + rand() * 1.3;
        emit(vx * reach, vy * reach - .5 * gravity * delay * delay, vz * reach,
          v * Math.cos(b), v * Math.sin(b), (rand() - .5) * 2, .49 + rand() * .28,
          .75 + rand() * .58, delay, 1.3, rand() * TAU, 2.9, 1.28, 4);
      }
    }
  });
}

interface Shot {
  delay: number; x: number; y: number; z: number; dx: number; dz: number; rise: number;
  kind: BurstType; palette: Palette; strength: number;
}
export type FireworkCue = (phase: 'launch' | 'burst', x: number, z: number, strength: number, crackle: boolean) => void;

function makeLauncher() {
  const group = new THREE.Group();
  group.name = 'firework-launcher';
  const red = new THREE.MeshStandardMaterial({ color: 0x9f2924, roughness: .84 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xe6b858, roughness: .56, metalness: .28 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a1b1f, roughness: .9 });
  const box = (w: number, h: number, d: number, y: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.y = y;
    group.add(mesh);
  };
  box(.90, .39, .76, .215, red);
  box(.96, .075, .82, .0475, brass);
  box(.94, .065, .80, .4025, brass);
  box(.86, .035, .72, .4525, dark);
  const holes = new THREE.InstancedMesh(new THREE.RingGeometry(.047, .075, 14), brass, 9);
  const transform = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  for (let i = 0; i < 9; i++) {
    transform.setPosition((i % 3 - 1) * .24, .475, (Math.floor(i / 3) - 1) * .19);
    holes.setMatrixAt(i, transform);
  }
  group.add(holes);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.61, .153),
    new THREE.MeshBasicMaterial({ map: signTexture('PHÁO HOA') }));
  label.position.set(0, .23, .383);
  group.add(label);
  return group;
}

export function createFireworks(scene: THREE.Scene, renderer: THREE.WebGLRenderer, groundY: (x: number, z: number) => number,
  onCue?: FireworkCue) {
  const pending: Shot[] = [];
  const active: { batch: Batch; rocket?: Shot }[] = [];
  const launchers: { group: THREE.Group; life: number }[] = [];
  let launcherModel: THREE.Group | undefined;
  const add = (b: Batch, x: number, y: number, z: number, age: number, rocket?: Shot) => {
    if (age >= b.life) { b.points.geometry.dispose(); b.points.material.dispose(); return; }
    b.points.name = rocket ? 'firework-rocket' : 'firework-burst';
    b.points.position.set(x, y, z); b.age = age; b.points.material.uniforms.uTime.value = age;
    scene.add(b.points); active.push({ batch: b, rocket });
  };
  const launch = (s: Shot, age: number) => {
    const dpr = renderer.getPixelRatio();
    const b = batch(1, ROCKET_TIME, s.palette, dpr, (emit) => {
      emit(0, 0, 0, s.dx, s.rise, s.dz, 1.5, ROCKET_TIME, 0, 1.15, 0, 0, .2, 18);
      for (let i = 0; i < 4; i++) emit(0, 0, 0, s.dx, s.rise, s.dz, .65, ROCKET_TIME, 0, .82, i * TAU / 4, 0, .28, 10);
    });
    add(b, s.x, s.y, s.z, age, s);
    if (age < .18) onCue?.('launch', s.x, s.z, s.strength, false);
  };
  const explode = (s: Shot, age: number) => {
    const x = s.x + s.dx, z = s.z + s.dz;
    add(makeFireworkBurst(s.kind, s.palette, renderer.getPixelRatio()), x, s.y + s.rise, z, age);
    if (age < .18) onCue?.('burst', x, z, s.strength, s.kind === 'crackle');
  };
  return {
    spawn(x: number, z: number, size: FireworkSize) {
      const cfg = FIREWORKS[size], gap = cfg.intervalMs / 1000;
      const count = cfg.shells;
      const finaleStart = size === 'dragon' ? count - FINALE_SHELLS : count;
      const ground = groundY(x, z);
      launcherModel ??= makeLauncher();
      const group = launcherModel.clone();
      group.position.set(x, ground, z);
      scene.add(group);
      launchers.push({ group, life: cfg.lockMs / 1000 });
      for (let i = 0; i < count; i++) {
        const finale = i >= finaleStart;
        let kind: BurstType;
        if (size === 'dragon' && i === finaleStart - 2) kind = 'dragon';
        else if (size === 'dragon' && i === finaleStart - 1) kind = 'phoenix';
        else if (finale || i === 0 || i === count - 1) kind = 'sphere';
        else kind = BURST_CYCLE[(i - 1) % BURST_CYCLE.length];
        const wide = finale ? 5.2 : 3.6;
        const isShape = kind === 'dragon' || kind === 'phoenix';
        const ox = (i % 3 - 1) * .24, oz = (Math.floor(i / 3) % 3 - 1) * .19;
        const shot: Shot = { x: x + ox, z: z + oz, y: ground + .477,
          dx: isShape ? -ox : (Math.random() - .5) * wide,
          dz: isShape ? -oz : (Math.random() - .5) * wide,
          rise: isShape ? 3.22 : 4.3 + Math.random() * .58,
          delay: finale ? (finaleStart - 1) * gap + SHAPE_LIFE + (i - finaleStart) * .24 : i * gap,
          kind, palette: PALETTES[i % PALETTES.length], strength: isShape ? 1 : finale ? .72 : size === 'small' ? .62 : .86 };
        if (i === 0) launch(shot, 0);
        else pending.push(shot);
      }
    },
    update(dt: number) {
      for (let i = launchers.length - 1; i >= 0; i--) {
        const box = launchers[i];
        box.life -= dt;
        if (box.life > 0) continue;
        scene.remove(box.group);
        launchers.splice(i, 1);
      }
      for (let i = active.length - 1; i >= 0; i--) {
        const { batch: b, rocket: s } = active[i];
        b.age += dt;
        if (b.age < b.life) { b.points.material.uniforms.uTime.value = b.age; continue; }
        scene.remove(b.points); b.points.geometry.dispose(); b.points.material.dispose(); active.splice(i, 1);
        if (s) explode(s, b.age - b.life);
      }
      for (let i = pending.length - 1; i >= 0; i--) {
        const s = pending[i]; s.delay -= dt;
        if (s.delay > 0) continue;
        pending.splice(i, 1);
        const age = -s.delay;
        if (age < ROCKET_TIME) launch(s, age);
        else explode(s, age - ROCKET_TIME);
      }
    },
    clear() {
      for (const { batch: b } of active) {
        scene.remove(b.points); b.points.geometry.dispose(); b.points.material.dispose();
      }
      for (const { group } of launchers) scene.remove(group);
      active.length = pending.length = launchers.length = 0;
    },
  };
}
