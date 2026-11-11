export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const look = (px, py, pz, tx, ty, tz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${tx},${ty},${tz});return 1})()`);
  const fps = (secs = 3) => ev(`new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;const t=performance.now()-t0;if(t>${secs * 1000})r((n*1000/t).toFixed(1));else requestAnimationFrame(f)};requestAnimationFrame(f)})`);
  const vis = (v) => ev(`(()=>{for(const n of ['tang-xa-tay','trai-duong']){const o=window.__co.world.scene.getObjectByName(n);if(o)o.visible=${v}}return 1})()`);
  const spots = { plaza: [0, 8, 24, 0, 2, 4], west: [-26, 9, -8, -42, 2, -8], westWide: [-10, 25, 20, -40, 0, -8], baseline: [0, 12, -2, 0, 2, -30] };
  for (const [k, v] of Object.entries(spots)) {
    await look(...v); await sleep(800);
    console.log('FPS', k, 'houses on :', await fps(3));
  }
  await vis(false);
  for (const k of ['west', 'westWide']) {
    await look(...spots[k]); await sleep(800);
    console.log('FPS', k, 'houses off:', await fps(3));
  }
  await vis(true);
  console.log('draw calls / triangles:', await ev(`JSON.stringify((()=>{const i=window.__co.world.scene;let m=0;i.traverse(o=>{if(o.isMesh)m++});return {meshes:m}})())`));
  await look(30, 8, 26, 28, 2, 14); await sleep(900); await shot('quanam-yard-front');
  await look(0, 40, 8, 0, 0, 10); await sleep(900); await shot('yards-both');
  await look(8, 12, 14, -28, 3, 14); await sleep(900); await shot('buddha-from-east');
  await look(-8, 12, 14, 28, 3, 14); await sleep(900); await shot('quanam-from-west');
};
