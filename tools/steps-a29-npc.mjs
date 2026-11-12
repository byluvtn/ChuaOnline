export default async ({ ev, shot, sleep }) => {
  const taken = [], skipped = [];
  const take = async (name) => { await shot(name); taken.push(name); };
  const skip = (name, reason) => { const m = `SKIPPED ${name} (${reason})`; skipped.push(m); console.log(m); };

  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(5000);
  const R = () => ev(`JSON.stringify([...window.__co.remotes.entries()].filter(([id,r])=>r.data.npc).map(([id,r])=>({id,name:r.data.name,role:r.data.role,anim:r.anim,x:+r.char.root.position.x.toFixed(1),z:+r.char.root.position.z.toFixed(1),scale:+r.char.root.scale.x.toFixed(2),vis:r.char.root.visible})))`);
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  const follow = (id, dx, dy, dz, ly = 1.2) => ev(`(()=>{const r=window.__co.remotes.get('${id}');const p=r.char.root.position;const c=window.__co.camera;window.__co.freeze=true;c.position.set(p.x+${dx},${dy},p.z+${dz});c.lookAt(p.x,${ly},p.z);})()`);
  const waitAnim = async (id, anim, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(`window.__co.remotes.get('${id}').anim`) === anim) return true; await sleep(300); } return false; };
  // positions + anim of all NPCs, tolerant of missing remotes
  const snap = async () => JSON.parse(await R());
  const pos = async (id) => (await snap()).find((n) => n.id === id);

  // 1 roster
  const list = await snap();
  console.log('NPCS', JSON.stringify(list));
  await cam(0, 4, 26, 0, 1.5, -10); await sleep(800);
  await take('roster');
  console.log('visible remotes', list.filter((n) => n.vis).length, '/', list.length);

  // 2 bell-roam
  let caught = false;
  for (const t0 = Date.now(); Date.now() - t0 < 90000;) {
    const n = await pos('npc4');
    if (n && n.anim === 'walk' && Math.hypot(n.x + 34, n.z + 6) > 5) { caught = true; break; }
    await sleep(2000);
  }
  if (caught) { await follow('npc4', 2.4, 1.8, 2.6, 1.0); await sleep(600); await take('bell-roam'); }
  else skip('bell-roam', 'npc4 stayed near the tower');

  // 3 bell-ring
  if (await waitAnim('npc4', 'ring', 120000)) {
    await cam(-30, 2.2, -2.5, -34, 1.5, -6); await sleep(700); await take('bell-ring');
  } else skip('bell-ring', 'no bell window in the next 2 min, re-run near 05:00/12:00/18:00/20:00 VN');

  // 4 desk-monk
  await follow('npc6', 0, 1.6, 3.2, 1.0); await sleep(700);
  const d = await pos('npc6');
  console.log('npc6 desk monk', d ? `anim=${d.anim} at (${d.x}, ${d.z})` : 'not found', '(expect sit at -42, 32.6)');
  await take('desk-monk');

  // 5 rest beds
  const sleepers = ['npc2', 'npc3', 'npc4', 'npc7', 'npc8'];
  const beds = [
    { n: 1, cx: -44, test: (n) => Math.abs(n.x + 44) < 0.5 && Math.abs(n.z + 73.05) < 0.5, cam: [-40.5, 1.6, -73.05, -45.5, 0.8, -73.05], done: false },
    { n: 2, cx: -38, test: (n) => Math.abs(n.x + 38) < 0.5 && Math.abs(n.z + 73.05) < 0.5, cam: [-34.5, 1.6, -73.05, -39.5, 0.8, -73.05], done: false },
  ];
  for (const t0 = Date.now(); Date.now() - t0 < 25 * 60000 && beds.some((b) => !b.done);) {
    const all = await snap();
    const lying = all.filter((n) => sleepers.includes(n.id) && n.anim === 'lie');
    const hits = beds.filter((b) => !b.done).map((b) => [b, lying.find(b.test)]).filter(([, n]) => n);
    for (const [b, n] of hits) {
      console.log(`bed ${b.n}: ${n.id} lying at (${n.x}, ${n.z})`);
      await cam(...b.cam); await sleep(700); await take(`rest-bed${b.n}`);
      b.done = true;
    }
    if (!beds.some((b) => !b.done)) break;
    await sleep(5000);
  }
  for (const b of beds) if (!b.done) skip(`rest-bed${b.n}`, `no NPC lay on bed ${b.n} in 25 min`);

  // 6 / 7 visitors near a point
  const visitors = ['npc5', 'npc9', 'npc10', 'npc11', 'npc12'];
  const watchVisitor = async (name, cx, cz, label, ms) => {
    for (const t0 = Date.now(); Date.now() - t0 < ms;) {
      const v = (await snap()).find((n) => visitors.includes(n.id) && Math.hypot(n.x - cx, n.z - cz) < 6);
      if (v) {
        console.log(`${name}: ${v.id} (${v.name}) anim=${v.anim} at (${v.x}, ${v.z})`);
        await follow(v.id, 3, 2.4, 4, 1.2); await sleep(700); await take(name);
        return;
      }
      await sleep(5000);
    }
    skip(name, `no visitor near ${label} in 5 min`);
  };
  await watchVisitor('visitor-tamthe', 0, -54, 'Tam The', 5 * 60000);
  await watchVisitor('visitor-ps-pier', 30, -31, 'the ps pier', 5 * 60000);

  // 8 player rest-route walk
  await ev(`window.__co.freeze = false`); await sleep(500);
  const legs = [['ktGate', -30, -49], ['ktYard', -41, -60], ['tangXaDoor', -41, -68], ['bed1-stand', -44, -72.0]];
  for (const [name, x, z] of legs) {
    await ev(`window.__co.walkTo(${x}, ${z})`);
    let ok = false, p = { x: 0, z: 0 };
    for (const t0 = Date.now(); Date.now() - t0 < 60000;) {
      p = JSON.parse(await ev(`JSON.stringify({x:window.__co.me().char.root.position.x,z:window.__co.me().char.root.position.z})`));
      if (Math.hypot(p.x - x, p.z - z) <= 1.5) { ok = true; break; }
      await sleep(1000);
    }
    console.log(`WALK ${name} ${ok ? 'reached' : 'TIMEOUT at'} (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
  }
  await ev(`window.__co.freeze = true`);

  console.log('SUMMARY taken:', taken.join(', ') || 'none');
  console.log('SUMMARY skipped:', skipped.length ? skipped.join('; ') : 'none');
};
