// Frame the chibi statues along their own world-space forward axis (+z local).
export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(4500);
  // dựng helper trong trang: chọn group theo tên + chỉ số, tính hướng trước của tượng
  await ev(`window.__shotFrame = (name, idx, mode, dist, lift) => {
    const T = window.__co.THREE, cam = window.__co.camera;
    const found = []; window.__co.world.scene.traverse((x) => { if (x.name === name) found.push(x); });
    const g = found[idx]; if (!g) return 'missing ' + found.length;
    g.updateWorldMatrix(true, true);
    const fwd = new T.Vector3(0, 0, 1).transformDirection(g.matrixWorld).setY(0).normalize();
    const side = new T.Vector3(fwd.z, 0, -fwd.x);
    const b = new T.Box3().setFromObject(g);
    const c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3());
    const fig = g.children[0];
    const sc = fig.getWorldScale(new T.Vector3()).x;
    let target, pos;
    if (mode === 'full') {
      const d = (Math.max(s.y, s.x) * 1.15) / (2 * Math.tan((cam.fov * Math.PI) / 360)) / Math.min(1, cam.aspect * 0.9) + 1.5;
      target = c.clone();
      pos = c.clone().addScaledVector(fwd, d).addScaledVector(side, dist || 0); pos.y = c.y + (lift || 0);
    } else {
      const head = g.getObjectByName('head');
      const hp = head.getWorldPosition(new T.Vector3());
      target = hp.clone();
      pos = hp.clone().addScaledVector(fwd, dist).addScaledVector(side, 0.25 * dist); pos.y = hp.y + (lift || 0);
    }
    window.__co.freeze = true;
    cam.position.copy(pos); cam.lookAt(target);
    return JSON.stringify({ fwd: fwd.toArray().map((v) => +v.toFixed(2)), n: found.length, sc: +sc.toFixed(2) });
  }`);
  const run = async (label, name, idx, mode, dist, lift) => {
    console.log(label, await ev(`window.__shotFrame('${name}', ${idx}, '${mode}', ${dist}, ${lift})`));
    await sleep(900); await shot(label);
  };
  await run('buddha', 'buddhaGroup', 0, 'full', 0, 0);
  await run('buddha-face', 'buddhaGroup', 0, 'face', 3.6, 0.1);
  await run('buddha-side', 'buddhaGroup', 0, 'full', 4.5, 0);
  await run('guanyin', 'guanyinGroup', 0, 'full', 0, 0);
  await run('guanyin-face', 'guanyinGroup', 0, 'face', 3.2, 0.1);
  await run('guanyin-side', 'guanyinGroup', 0, 'full', 4.5, 0);
};
