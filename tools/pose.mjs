import * as THREE from 'three';
const H = 2.12, ARM_X = 0.34, ARM_Y = 1.0, HIP_Y = 0.45;
const HAND_R = 0.09 * H / 2, AL1 = 0.17, CUFF = 0.203, AL2 = CUFF + 0.5 * HAND_R;
const ease = (x) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
for (const th of [0.7, 0.85, 0.95, 1.05]) {
  for (const hyBase of [0.45, 0.39]) {
    const kneel = 1, hy = hyBase - 0.10 * kneel;
    const bodyY = hy - HIP_Y * Math.cos(th), bodyZ = -HIP_Y * Math.sin(th);
    const R = new THREE.Matrix4().makeRotationX(th);
    const toWorld = (v) => v.clone().applyMatrix4(R).add(new THREE.Vector3(0, bodyY, bodyZ));
    const shoulder = toWorld(new THREE.Vector3(ARM_X, ARM_Y, 0));
    const hipW = toWorld(new THREE.Vector3(0, HIP_Y, 0));
    const headC = toWorld(new THREE.Vector3(0, 0.75 * H, 0));
    const headBottom = headC.y - 0.53;
    for (const [ty, tz] of [[0.75, 0.16], [0.72, 0.30], [0.70, 0.36]]) {
      const tgt = toWorld(new THREE.Vector3(0, ty, tz));
      const reach = shoulder.distanceTo(tgt);
      console.log(`th=${th} hyBase=${hyBase} tgt(y=${ty},z=${tz}) hip=${hipW.y.toFixed(2)} head=${headC.y.toFixed(2)} headBot=${headBottom.toFixed(2)} handY=${tgt.y.toFixed(3)} reach=${reach.toFixed(3)}/${(AL1+AL2).toFixed(3)}`);
    }
  }
}
