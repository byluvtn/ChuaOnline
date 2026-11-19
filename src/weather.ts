import * as THREE from 'three';
import { activeFestival, seasonNow, weatherAt, type FestivalKey, type SeasonKey, type WeatherKey } from '../shared/seasons';
import { blocked, groundYBase } from './layout';

const RAIN_N = 900;
const RAIN_BOX = { x: 44, y: 22, z: 44 };

const SEASON_BLOSSOM: Record<SeasonKey, { count: number; colors: number[] }> = {
  xuan: { count: 260, colors: [0xf7a8c4, 0xf4c2d4, 0xffd6e3, 0xf08fb0] },
  ha: { count: 200, colors: [0xff8a5a, 0xf2543c, 0xffb34a, 0xf59ac0] },
  thu: { count: 240, colors: [0xf2b632, 0xe88a2a, 0xffd25a, 0xd9722a] },
  dong: { count: 140, colors: [0xffffff, 0xeef4fb, 0xf4f0e6] },
};

const FESTIVAL_LANTERNS: Record<FestivalKey, number[]> = {
  tet: [0xd8321c, 0xf2b632, 0xc0241a],
  phatDan: [0xf2b632, 0xf59ac0, 0x7cc4e8, 0xa6d86a, 0xffffff],
  vuLan: [0xf59ac0, 0xff8aa8, 0xffd6e3],
  trungThu: [0xffd25a, 0xf2a032, 0xffe58a],
};

function rnd(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export interface Weather {
  update(t: number, dt: number, focus: THREE.Vector3, indoorsFactor?: number): void;
  current(): { weather: WeatherKey; season: SeasonKey };
}

export function createWeather(scene: THREE.Scene, enabled: () => boolean): Weather {
  const fog = new THREE.FogExp2(0xdfe8f0, 0);
  scene.fog = fog;

  const rainPos = new Float32Array(RAIN_N * 6);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xcfe0f2, transparent: true, opacity: 0, depthWrite: false });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);
  const drops = new Float32Array(RAIN_N * 3);
  for (let i = 0; i < RAIN_N; i++) {
    drops[i * 3] = (rnd(i) - 0.5) * RAIN_BOX.x;
    drops[i * 3 + 1] = rnd(i + 900) * RAIN_BOX.y;
    drops[i * 3 + 2] = (rnd(i + 1800) - 0.5) * RAIN_BOX.z;
  }

  const bloomGeo = new THREE.IcosahedronGeometry(0.13, 0);
  const bloomMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const bloomMax = 280;
  const blossoms = new THREE.InstancedMesh(bloomGeo, bloomMat, bloomMax);
  blossoms.frustumCulled = false;
  blossoms.count = 0;
  scene.add(blossoms);
  const spots: { x: number; z: number; y: number; s: number }[] = [];
  for (let i = 0, tries = 0; spots.length < bloomMax && tries < 6000; tries++) {
    const x = (rnd(tries * 3 + 11) - 0.5) * 116;
    const z = 42 - rnd(tries * 3 + 12) * 118;
    if (blocked(x, z)) continue;
    spots.push({ x, z, y: groundYBase(x, z), s: 0.7 + rnd(tries + 5) * 0.9 });
    i++;
  }
  const mtx = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  let bloomKey = '';
  const applyBlossoms = (season: SeasonKey, fest: FestivalKey | null) => {
    const key = `${season}|${fest ?? ''}`;
    if (key === bloomKey) return;
    bloomKey = key;
    const def = fest === 'tet' ? { count: 280, colors: [0xffd23c, 0xf7a8c4, 0xffe46a, 0xf08fb0] } : SEASON_BLOSSOM[season];
    const n = Math.min(def.count, spots.length);
    for (let i = 0; i < n; i++) {
      const sp = spots[i];
      ps.set(sp.x, sp.y + 0.12 * sp.s, sp.z);
      sc.set(sp.s, sp.s * 0.8, sp.s);
      mtx.compose(ps, q, sc);
      blossoms.setMatrixAt(i, mtx);
      blossoms.setColorAt(i, col.setHex(def.colors[i % def.colors.length]));
    }
    blossoms.count = n;
    blossoms.instanceMatrix.needsUpdate = true;
    if (blossoms.instanceColor) blossoms.instanceColor.needsUpdate = true;
  };

  const deco = new THREE.Group();
  scene.add(deco);
  let decoKey = '';
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x6a2a18, roughness: 0.8 });
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const stringMat = new THREE.LineBasicMaterial({ color: 0x3a2412 });
  const lanternGeo = new THREE.SphereGeometry(0.3, 10, 8);
  lanternGeo.scale(1, 1.25, 1);
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.18 : 0.4;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i) star.lineTo(x, y); else star.moveTo(x, y);
  }
  star.closePath();
  const starGeo = new THREE.ExtrudeGeometry(star, { depth: 0.1, bevelEnabled: false });
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.8, 6);
  const buildDeco = (fest: FestivalKey | null) => {
    const key = fest ?? '';
    if (key === decoKey) return;
    decoKey = key;
    for (const c of [...deco.children]) {
      deco.remove(c);
      if (c instanceof THREE.InstancedMesh) c.dispose();
      if (c instanceof THREE.LineSegments) c.geometry.dispose();
    }
    if (!fest) return;
    const zs: number[] = [];
    for (let z = 29; z <= 53; z += 4) zs.push(z);
    const sides = [-3.9, 3.9];
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, zs.length * sides.length);
    const per = 3;
    const lanterns = new THREE.InstancedMesh(fest === 'trungThu' ? starGeo : lanternGeo, lanternMat, (zs.length - 1) * sides.length * per);
    const colors = FESTIVAL_LANTERNS[fest];
    let pi = 0, li = 0;
    const lineVerts: number[] = [];
    for (const sx of sides) {
      let prev: THREE.Vector3 | null = null;
      for (let i = 0; i < zs.length; i++) {
        const z = zs[i];
        const gy = groundYBase(sx, z);
        poles.setMatrixAt(pi++, mtx.makeTranslation(sx, gy + 1.9, z));
        const top = new THREE.Vector3(sx, gy + 3.7, z);
        if (prev) lineVerts.push(prev.x, prev.y, prev.z, top.x, top.y, top.z);
        prev = top;
        if (!i) continue;
        for (let k = 0; k < per; k++) {
          const lz = zs[i - 1] + (k + 0.5) * (4 / per);
          lanterns.setMatrixAt(li, mtx.makeTranslation(sx, gy + 3.32, lz));
          lanterns.setColorAt(li, col.setHex(colors[(li + k) % colors.length]));
          li++;
        }
      }
    }
    lanterns.count = li;
    lanterns.instanceMatrix.needsUpdate = true;
    if (lanterns.instanceColor) lanterns.instanceColor.needsUpdate = true;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
    deco.add(poles, lanterns, new THREE.LineSegments(g, stringMat));
  };

  let lastCheck = -9;
  let state = { weather: 'clear' as WeatherKey, season: 'xuan' as SeasonKey };
  let rainK = 0, fogK = 0, drizzleK = 0;
  const tmpBg = new THREE.Color();
  const grey = new THREE.Color(0x8a96a2);

  const update: Weather['update'] = (t, dt, focus, indoors = 0) => {
    if (t - lastCheck > 2) {
      lastCheck = t;
      const d = new Date();
      state = { weather: weatherAt(d), season: seasonNow(d) };
      applyBlossoms(state.season, activeFestival(d)?.key ?? null);
      buildDeco(activeFestival(d)?.key ?? null);
    }
    const on = enabled();
    const w = on ? state.weather : 'clear';
    const rainTarget = w === 'rain' ? 1 : w === 'drizzle' ? 0.45 : 0;
    const fogTarget = w === 'mist' ? 0.016 : w === 'rain' ? 0.008 : w === 'drizzle' ? 0.006 : 0;
    const k = Math.min(1, dt * 0.6);
    rainK += (rainTarget * (1 - indoors) - rainK) * k;
    fogK += (fogTarget - fogK) * k;
    drizzleK = w === 'drizzle' ? 1 : 0;
    fog.density = fogK;
    if (scene.background instanceof THREE.Color) {
      tmpBg.copy(scene.background);
      fog.color.copy(tmpBg).lerp(grey, w === 'mist' ? 0.25 : 0.45 * Math.min(1, rainK * 2));
    }
    rain.visible = rainK > 0.02;
    if (!rain.visible) return;
    rainMat.opacity = 0.42 * Math.min(1, rainK * 1.6);
    const shown = Math.floor(RAIN_N * (drizzleK ? 0.5 : 1));
    const fall = drizzleK ? 14 : 24;
    const len = drizzleK ? 0.5 : 0.85;
    for (let i = 0; i < shown; i++) {
      let y = drops[i * 3 + 1] - fall * dt * (0.85 + rnd(i + 3) * 0.3);
      let x = drops[i * 3] + 1.2 * dt;
      let z = drops[i * 3 + 2];
      if (y < 0) { y += RAIN_BOX.y; x = (rnd(i + t) - 0.5) * RAIN_BOX.x; z = (rnd(i * 7 + t) - 0.5) * RAIN_BOX.z; }
      drops[i * 3] = x; drops[i * 3 + 1] = y; drops[i * 3 + 2] = z;
      const wx = focus.x + x, wz = focus.z + z;
      rainPos[i * 6] = wx; rainPos[i * 6 + 1] = y; rainPos[i * 6 + 2] = wz;
      rainPos[i * 6 + 3] = wx - 0.08 * len; rainPos[i * 6 + 4] = y + len; rainPos[i * 6 + 5] = wz;
    }
    rainGeo.setDrawRange(0, shown * 2);
    rainGeo.attributes.position.needsUpdate = true;
  };

  return { update, current: () => state };
}
