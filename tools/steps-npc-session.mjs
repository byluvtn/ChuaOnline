export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(5000);
  const info = () => ev(`JSON.stringify(['npc1','npc4','npc5'].map(id=>{const r=window.__co.remotes.get(id);return [id,r.anim,+r.char.root.position.x.toFixed(1),+r.char.root.position.z.toFixed(1)]}))`);
  console.log('npcs', await info());
  console.log('chat', await ev(`[...document.querySelectorAll('#chatLog *, #chat *')].map(e=>e.textContent).filter(t=>/thời khóa|Hết thời/.test(t)).slice(0,2).join(' | ')`));
  await ev(`(()=>{const co=window.__co;co.freeze=true;co.camera.position.set(-2,3.2,-22);co.camera.lookAt(0,1,-34.5);})()`);
  await sleep(1500); await shot('hall-abbot-sit');
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) { const a = await ev(`window.__co.remotes.get('npc5').anim`); if (a === 'bow' || a === 'chant') break; await sleep(500); }
  console.log('npc5', await info());
  await sleep(300); await shot('hall-visitor');
};
