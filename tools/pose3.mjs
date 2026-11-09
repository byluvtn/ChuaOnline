import * as THREE from 'three';
const H = 2.12, ARM_X = 0.34, ARM_Y = 1.0, HIP_Y = 0.45;
const HAND_R = 0.09 * H / 2, AL1 = 0.17, CUFF = 0.203, AL2 = CUFF + 0.5 * HAND_R;
const MAXR = (AL1 + AL2) * 0.999;
const th = 0.95, hy = 0.45 - 0.10;
const bodyY = hy - HIP_Y * Math.cos(th), bodyZ = -HIP_Y * Math.sin(th);
const R = new THREE.Matrix4().makeRotationX(th);
const toWorld = (v) => v.clone().applyMatrix4(R).add(new THREE.Vector3(0, bodyY, bodyZ));
const sh = toWorld(new THREE.Vector3(ARM_X, ARM_Y, 0));
console.log('shoulder world', sh.toArray().map(n=>+n.toFixed(3)));
// want hand centre world y as low as possible with relaxed elbows, palms joined at x=HALF_T
let best = null;
for (let ty = 0.4; ty <= 1.1; ty += 0.005) for (let tz = -0.1; tz <= 0.6; tz += 0.005) {
  const w = toWorld(new THREE.Vector3(0.0925, ty, tz));
  const reach = sh.distanceTo(w);
  if (reach > 0.40) continue;
  // prefer low hand, forward of the shoulder, and elbow bend around 0.35-0.38
  const score = w.y * 5 - w.z * 1.5 + Math.abs(reach - 0.385) * 4;
  if (!best || score < best.score) best = { ty, tz, wy: w.y, wz: w.z, reach, score };
}
console.log('best', JSON.stringify(best, null, 1));
const w = toWorld(new THREE.Vector3(0.0925, best.ty, best.tz));
console.log('handBottom', (w.y - HAND_R).toFixed(3), 'bodyY', bodyY.toFixed(3), 'bodyZ', bodyZ.toFixed(3));

