import * as THREE from 'three';
const H = 2.12, HR = 0.53, ARM_X = 0.34, ARM_Y = 1.0, HIP_Y = 0.45;
const HAND_R = 0.09 * H / 2, AL1 = 0.17, CUFF = 0.203, AL2 = CUFF + 0.5 * HAND_R;
const MAXR = (AL1 + AL2) * 0.995, HALF_T = HAND_R * 0.97;
const HEMF = 0.205, HEMZ = 0.37;
const hy = (th) => 0.004 + (HIP_Y - HEMF) * Math.cos(th) - HEMZ * Math.sin(th);
let rows = [];
for (let th = 0.2; th <= 1.0; th += 0.05) {
  const h = hy(th);
  const by = h - HIP_Y * Math.cos(th), bz = -HIP_Y * Math.sin(th);
  const R = new THREE.Matrix4().makeRotationX(th);
  const toW = (v) => v.clone().applyMatrix4(R).add(new THREE.Vector3(0, by, bz));
  const shW = toW(new THREE.Vector3(ARM_X, ARM_Y, 0));
  const headW = toW(new THREE.Vector3(0, 0.75 * H, 0));
  const headBot = headW.y - HR;
  let best = null;
  for (let ty = 0.3; ty <= 1.2; ty += 0.01) for (let tz = -0.2; tz <= 0.7; tz += 0.01) {
    const local = new THREE.Vector3(HALF_T, ty, tz);
    const w = toW(local);
    if (w.y - HAND_R < 0.02) continue; // hand must not sink
    const reach = shW.distanceTo(w);
    if (reach > MAXR) continue;
    const score = w.y;
    if (!best || score < best.score) best = { local, w, reach, score };
  }
  if (best) rows.push({ th: +th.toFixed(2), hy: +h.toFixed(3), handY: +best.w.y.toFixed(3), handZ: +best.w.z.toFixed(3), reach: +best.reach.toFixed(3), headBot: +headBot.toFixed(3), ty: +best.local.y.toFixed(2), tz: +best.local.z.toFixed(2) });
}
rows.forEach(r => console.log(JSON.stringify(r)));
