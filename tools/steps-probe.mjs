export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  const info = await ev(`(()=>{
    const co = window.__co, T = co.THREE;
    const ch = co.build('male'); ch.label.visible = false;
    co.anim(ch, 'idle', 99);
    for (let s = 0; s <= 1.7 + 1e-6; s += 0.05) co.anim(ch, 'bow', 100 + s);
    ch.root.updateMatrixWorld(true);
    const out = { root: ch.root.position.toArray().map(n=>+n.toFixed(3)) };
    const bodyBox = new T.Box3().setFromObject(ch.body);
    out.body = { minY: +bodyBox.min.y.toFixed(3), maxY: +bodyBox.max.y.toFixed(3) };
    out.legL = { pos: ch.legL.position.toArray().map(n=>+n.toFixed(3)), rotX: +ch.legL.rotation.x.toFixed(3) };
    const lb = new T.Box3().setFromObject(ch.legL); out.legLBox = { minY: +lb.min.y.toFixed(3) };
    out.handR = { minY: +(new T.Box3().setFromObject(ch.foreR)).min.y.toFixed(3) };
    // world positions of key body-space points
    const p = (v) => v.clone().applyMatrix4(ch.body.matrixWorld).toArray().map(n=>+n.toFixed(3));
    out.hip = p(new T.Vector3(0, 0.45, 0));
    out.headC = p(new T.Vector3(0, 1.59, 0));
    out.hemF = p(new T.Vector3(0, 0.205, 0.37));
    out.hemB = p(new T.Vector3(0, 0.205, -0.37));
    out.bodyRot = +ch.body.rotation.x.toFixed(3);
    out.bodyPos = ch.body.position.toArray().map(n=>+n.toFixed(3));
    return out;
  })()`);
  console.log(JSON.stringify(info, null, 1));
  await shot('probe');
};
