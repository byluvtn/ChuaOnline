import * as THREE from 'three';
const H = 2.12, ARM_X = 0.34, ARM_Y = 1.0, HIP_Y = 0.45;
const HAND_R = 0.09 * H / 2, AL1 = 0.17, CUFF = 0.203, AL2 = CUFF + 0.5 * HAND_R;
const MAXR = (AL1 + AL2) * 0.97;
console.log('handR', HAND_R.toFixed(4), 'reach', (AL1+AL2).toFixed(4), 'max', MAXR.toFixed(4));
const th = 0.95, hyBase = 0.45, kneelDrop = 0.10;
const hy = hyBase - kneelDrop;
const bodyY = hy - HIP_Y * Math.cos(th), bodyZ = -HIP_Y * Math.sin(th);
const R = new THREE.Matrix4().makeRotationX(th);
const toWorld = (v) => v.clone().applyMatrix4(R).add(new THREE.Vector3(0, bodyY, bodyZ));
const sh = toWorld(new THREE.Vector3(ARM_X, ARM_Y, 0));
const head = toWorld(new THREE.Vector3(0, 0.75 * H, 0));
console.log('bodyY', bodyY.toFixed(3), 'bodyZ', bodyZ.toFixed(3));
console.log('shoulder world', sh.toArray().map(n=>n.toFixed(3)).join(','), 'headC y', head.y.toFixed(3), 'headBottom', (head.y-0.53).toFixed(3));
let best = null;
for (let ty = 0.55; ty <= 0.95; ty += 0.01) for (let tz = 0.05; tz <= 0.45; tz += 0.01) {
  const w = toWorld(new THREE.Vector3(0, ty, tz));
  const reach = sh.distanceTo(w);
  if (reach > MAXR) continue;
  const score = Math.abs(w.y - (HAND_R + 0.005)) * 6 + Math.abs(reach - MAXR * 0.985);
  if (!best || score < best.score) best = { ty, tz, wy: w.y, wz: w.z, reach, score };
}
console.log('best', best);
