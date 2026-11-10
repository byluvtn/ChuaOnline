export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(4000);
  const out = await ev(`(()=>{
    const co = window.__co, c = co.build('monk'), res = {};
    const armX = () => +c.armL.rotation.x.toFixed(3);
    const quatAngle = () => c.armL.quaternion.clone();
    for (let t = 10; t < 10.5; t += 0.02) co.anim(c, 'walk', t);
    co.anim(c, 'walk', 10.5);
    const oldPose = c.armL.quaternion.clone();
    co.anim(c, 'idle', 10.52);
    const newOnly = (() => { const d = co.build('monk'); co.anim(d, 'idle', 0); co.anim(d, 'idle', 5); return d.armL.quaternion.clone(); })();
    const ang = (q, r) => +(2 * Math.acos(Math.min(1, Math.abs(q.dot(r))))).toFixed(3);
    res.total = ang(oldPose, newOnly);
    res.t0 = ang(c.armL.quaternion, oldPose);
    co.anim(c, 'idle', 10.55);
    res.at005_fromOld = ang(c.armL.quaternion, oldPose); res.at005_fromNew = ang(c.armL.quaternion, newOnly);
    co.anim(c, 'idle', 10.62);
    res.at010_fromOld = ang(c.armL.quaternion, oldPose); res.at010_fromNew = ang(c.armL.quaternion, newOnly);
    co.anim(c, 'idle', 10.75);
    res.at023_fromNew = ang(c.armL.quaternion, newOnly);
    return JSON.stringify(res);
  })()`);
  console.log('crossfade', out);
};
