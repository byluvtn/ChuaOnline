// Screenshots of the character select screen (login page preview) for all 4 outfits.
// usage: STEPS=./steps-select.mjs node tools/shot.mjs ./shots/sel http://localhost:5173/ 700 900
export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  const outfits = ['monk', 'nun', 'male', 'female'];
  const labels = { monk: 'Tiểu tăng', nun: 'Tiểu ni', male: 'Phật tử nam', female: 'Phật tử nữ' };
  for (const o of outfits) {
    // pick the outfit via the dev hook then wait for rebuild
    await ev(`window.__co.pick('${o}')`);
    await sleep(900);
    // freeze rotation to face forward
    await ev(`window.__co.pvRot = 0`);
    await sleep(600);
    await shot(o);
    await ev(`window.__co.pvRot = undefined`);
  }
};
