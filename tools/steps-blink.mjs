export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(5000);
  const sample = () => ev(`JSON.stringify([...window.__co.remotes.entries()].filter(([id,r])=>r.data.npc).map(([id,r])=>[id,r.char.face.material.map.uuid]))`);
  const seen = new Map();
  for (let i = 0; i < 100; i++) {
    for (const [id, u] of JSON.parse(await sample())) { if (!seen.has(id)) seen.set(id, new Set()); seen.get(id).add(u); }
    await sleep(100);
  }
  for (const [id, s] of seen) console.log('maps seen', id, s.size);
  await ev(`(()=>{const r=window.__co.remotes.get('npc1');const p=r.char.root.position;const c=window.__co.camera;window.__co.freeze=true;c.position.set(p.x+0.4,2.5,p.z+1.8);c.lookAt(p.x,2.3,p.z);r.char.blinkNext=1e9;r.char.face.material.map=r.char.faceShut;})()`);
  await sleep(800); await shot('blink-closed');
  await ev(`(()=>{const r=window.__co.remotes.get('npc1');r.char.face.material.map=r.char.faceOpen;})()`);
  await sleep(800); await shot('blink-open');
};
