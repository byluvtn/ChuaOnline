export default async ({ ev, shot, sleep }) => {
  await sleep(2500);
  await ev(`document.getElementById('enter').click()`); await sleep(4000);
  const out = await ev(`(()=>{
    const c = window.__co.build('monk');
    const rows = [];
    for (let i = 0; i <= 40; i++) { const t = 100 + i * 1.24 / 40; window.__co.anim(c, 'walk', t); if (i === 0) c.t0 = 100; window.__co.anim(c, 'walk', t);
      rows.push([+(i/40).toFixed(3), +c.armL.rotation.x.toFixed(3), +c.armR.rotation.x.toFixed(3), +c.legL.position.z.toFixed(3), +c.legR.position.z.toFixed(3), +c.body.position.y.toFixed(3)]); }
    return JSON.stringify(rows);
  })()`);
  const rows = JSON.parse(out);
  let bounces = 0;
  for (let i = 1; i < rows.length - 1; i++) if (rows[i][5] < rows[i - 1][5] && rows[i][5] <= rows[i + 1][5]) bounces++;
  console.log('phase armL armR legL legR bodyY'); for (const r of rows.filter((_, i) => i % 5 === 0)) console.log(r.join('\t'));
  console.log('bounce minima per cycle', bounces, 'armL*armR sign opposite', rows.every((r) => (r[1] + 0.1) * (r[2] + 0.1) <= 1e-9));
};
