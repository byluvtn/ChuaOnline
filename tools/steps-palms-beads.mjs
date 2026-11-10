export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(4500);
  console.log('buttons', await ev(`JSON.stringify([...document.querySelectorAll('#actions [data-act]')].map(b=>b.dataset.act+':'+b.querySelector('.lb').textContent))`));
  await ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;const r=window.__co.me().char.root;const p=r.position;const f=r.rotation.y;c.position.set(p.x+Math.sin(f)*2.6+Math.cos(f)*0.5,1.5,p.z+Math.cos(f)*2.6-Math.sin(f)*0.5);c.lookAt(p.x,1.1,p.z);})()`);
  for (const act of ['palms', 'beads']) {
    await ev(`document.querySelector('#actions [data-act="${act}"]').click()`);
    const samples = [];
    for (let i = 0; i < 14; i++) { samples.push(await ev(`window.__co.me().anim`)); if (i === 3) await shot(act); await sleep(250); }
    console.log(act, 'anim samples', samples.join(','));
  }
  await sleep(500);
  console.log('final anim', await ev(`window.__co.me().anim`));
};
