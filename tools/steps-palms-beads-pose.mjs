export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(4500);
  await ev(`(()=>{
    const co = window.__co; co.freeze = true;
    const me = co.me().char.root.position;
    window.__pc = [];
    [['palms', -0.9], ['beads', 0.9]].forEach(([a, dx]) => {
      const c = co.build('monk'); c.root.position.set(me.x + dx, 0, me.z + 2.2); c.root.rotation.y = 0;
      co.world.scene.add(c.root); window.__pc.push([c, a]);
    });
    const cam = co.camera; cam.position.set(me.x, 1.5, me.z + 5.4); cam.lookAt(me.x, 1.1, me.z + 2.2);
  })()`);
  const drive = (tStart, tEnd) => ev(`(()=>{ for (let t = ${tStart}; t <= ${tEnd}; t += 0.03) for (const [c, a] of window.__pc) window.__co.anim(c, a, t); })()`);
  await ev(`for (const [c] of window.__pc) window.__co.anim(c, 'idle', 50)`);
  await ev(`for (const [c, a] of window.__pc) { window.__co.anim(c, a, 100); }`);
  await drive(100, 100.8);
  await shot('mid');
  await drive(100.8, 101.2);
  await ev(`window.__pc.forEach(([c, a]) => window.__co.anim(c, a, 101.2))`);
  console.log('palms armR/foreR', await ev(`JSON.stringify([window.__pc[0][0].armR.quaternion.toArray().map(v=>+v.toFixed(2)), window.__pc[0][0].foreR.quaternion.toArray().map(v=>+v.toFixed(2))])`));
  console.log('beads armR/foreR', await ev(`JSON.stringify([window.__pc[1][0].armR.quaternion.toArray().map(v=>+v.toFixed(2)), window.__pc[1][0].foreR.quaternion.toArray().map(v=>+v.toFixed(2))])`));
};
