export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const look = (px, py, pz, tx, ty, tz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${tx},${ty},${tz});return 1})()`);
  const fps = (secs = 3) => ev(`new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;const t=performance.now()-t0;if(t>${secs * 1000})r((n*1000/t).toFixed(1));else requestAnimationFrame(f)};requestAnimationFrame(f)})`);
  const spots = {
    plaza: [0, 8, 24, 0, 2, 4],
    west: [-26, 9, -8, -42, 2, -8],
    westWide: [-10, 25, 20, -40, 0, -8],
    baseline: [0, 12, -2, 0, 2, -30],
    nhaKhach: [-47, 6, -50, -47, 2, -61],
    tangXa: [-41, 6, -60, -41, 2, -71],
    nhaTo: [36, 6, -57, 36, 2, -68],
    amCo: [64, 6, -75, 53, 2, -75],
    thienDuong: [-36, 6, -27, -47, 2, -27],
  };
  for (const [k, v] of Object.entries(spots)) {
    await look(...v); await sleep(800);
    console.log('FPS', k, await fps(3));
  }
  console.log('meshes:', await ev(`JSON.stringify((()=>{const i=window.__co.world.scene;let m=0;i.traverse(o=>{if(o.isMesh)m++});return {meshes:m}})())`));
};
