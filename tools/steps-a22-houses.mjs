export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const look = (px, py, pz, tx, ty, tz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${tx},${ty},${tz});return 1})()`);
  const spots = {
    'nha-khach': [-47, 4, -50, -47, 2, -61],
    'tang-xa': [-41, 4, -60, -41, 2, -71],
    'nha-to': [36, 4, -57, 36, 2, -68],
    'am-co': [64, 4, -75, 53, 2, -75],
    'thien-duong': [-36, 4, -27, -47, 2, -27],
  };
  for (const [k, v] of Object.entries(spots)) {
    await look(...v); await sleep(1500);
    await shot('house-' + k);
  }
};
