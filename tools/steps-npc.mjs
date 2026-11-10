export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(5000);
  const R = () => ev(`JSON.stringify([...window.__co.remotes.entries()].filter(([id,r])=>r.data.npc).map(([id,r])=>({id,name:r.data.name,role:r.data.role,anim:r.anim,x:+r.char.root.position.x.toFixed(1),z:+r.char.root.position.z.toFixed(1),scale:+r.char.root.scale.x.toFixed(2),vis:r.char.root.visible})))`);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const follow = (id, dx, dy, dz, ly = 1.2) => ev(`(()=>{const r=window.__co.remotes.get('${id}');const p=r.char.root.position;const c=window.__co.camera;window.__co.freeze=true;c.position.set(p.x+${dx},${dy},p.z+${dz});c.lookAt(p.x,${ly},p.z);})()`);
  const setMe = (x, z) => ev(`window.__co.me().char.root.position.set(${x},0,${z})`);
  console.log('NPCS', await R());
  console.log('online', await ev(`document.getElementById('onlineN').textContent`), 'mapPlayers', await ev(`window.__co.panelCtx ? 'n/a' : ''`));
  // 1 abbot walking
  const waitAnim = async (id, anim, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(`window.__co.remotes.get('${id}').anim`) === anim) return true; await sleep(300); } return false; };
  console.log('abbot walk seen', await waitAnim('npc1', 'walk', 40000));
  await follow('npc1', 3.2, 2.2, 3.6); await sleep(700); await shot('1-abbot-walk');
  // 2 sweepers: wait for sweep, show both (sweep npc2 near plaza)
  console.log('npc2 sweep seen', await waitAnim('npc2', 'sweep', 40000));
  await follow('npc2', 2.4, 1.8, 2.6, 1.0); await sleep(600); await shot('2a-sweep-plaza');
  console.log('npc3 sweep seen', await waitAnim('npc3', 'sweep', 60000));
  await follow('npc3', 2.4, 1.8, 2.6, 1.0); await sleep(600); await shot('2b-sweep-bridge');
  // 3 bell
  console.log('npc4 ring seen', await waitAnim('npc4', 'ring', 60000));
  await ev(`window.__co.remotes.get('npc4').char.root.rotation.y`);
  await cam(-30, 2.2, -2.5, -34, 1.5, -6); await sleep(700); await shot('3-bell-novice');
  // 5 near abbot -> button
  const a = JSON.parse(await ev(`JSON.stringify(window.__co.remotes.get('npc1').char.root.position)`));
  await setMe(a.x + 2.2, a.z + 0.5); await ev(`window.__co.freeze=false`); await sleep(1200);
  console.log('teacher button hidden when near?', await ev(`document.getElementById('teacherBtn').hidden`));
  await shot('5-near-abbot-button');
  await setMe(a.x + 12, a.z + 12); await sleep(800);
  console.log('teacher button hidden when far?', await ev(`document.getElementById('teacherBtn').hidden`));
  // 4 panel
  await ev(`window.__co.openPanel('teacher', window.__co.panelCtx())`); await sleep(700); await shot('4-teacher-panel');
};
