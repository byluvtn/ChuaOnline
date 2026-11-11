export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const look = (px, py, pz, tx, ty, tz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${tx},${ty},${tz});return 1})()`);
  const fps = (secs = 3) => ev(`new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;const t=performance.now()-t0;if(t>${secs * 1000})r((n*1000/t).toFixed(1));else requestAnimationFrame(f)};requestAnimationFrame(f)})`);
  const vis = (names, v) => ev(`(()=>{for(const n of ${JSON.stringify(names)}){const o=window.__co.world.scene.getObjectByName(n);if(o)o.visible=${v}}return 1})()`);
  const H = ['tang-xa-tay', 'trai-duong'];
  const spots = { plaza: [0, 8, 24, 0, 2, 4], baseline: [0, 12, -2, 0, 2, -30] };
  for (let round = 0; round < 2; round++) {
    for (const [k, v] of Object.entries(spots)) {
      await look(...v); await sleep(600);
      await vis(H, true); const on = await fps();
      await vis(H, false); const off = await fps();
      await vis(H, true);
      console.log(`FPS r${round} ${k}: on=${on} off=${off}`);
    }
  }
};
