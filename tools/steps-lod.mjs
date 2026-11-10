export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(4500);
  const info = () => ev(`JSON.stringify([...window.__co.remotes.entries()].filter(([id,r])=>r.data.npc).map(([id,r])=>({id,calls:r.char.animCalls,anim:r.anim,auto:r.char.root.matrixWorldAutoUpdate,d:+r.char.root.position.distanceTo(window.__co.camera.position).toFixed(1)})))`);
  await ev(`(()=>{ const co=window.__co; co.freeze=true; co.camera.position.set(0,60,120); co.camera.lookAt(0,0,0); })()`);
  await sleep(1500);
  const a = JSON.parse(await info());
  await sleep(10000);
  const b = JSON.parse(await info());
  console.log('FAR 10s:');
  for (const x of b) { const p = a.find((y) => y.id === x.id); console.log(x.id, 'dist', x.d, 'calls', x.calls - p.calls, 'anim', x.anim, 'matrixAuto', x.auto); }
  await ev(`(()=>{ const co=window.__co; const p=co.remotes.get('npc1').char.root.position; co.camera.position.set(p.x+3,2.5,p.z+4); co.camera.lookAt(p.x,1.2,p.z); })()`);
  await sleep(1500);
  const c = JSON.parse(await info());
  await sleep(3000);
  const d = JSON.parse(await info());
  console.log('NEAR 3s:');
  for (const x of d) { const p = c.find((y) => y.id === x.id); console.log(x.id, 'dist', x.d, 'calls', x.calls - p.calls, 'matrixAuto', x.auto); }
};
