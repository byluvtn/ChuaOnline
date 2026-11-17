// Stair verification shots for Tam The (news 22): side profile + player view from stair base.
// World coords (TAM_THE.z=-68): stair base z=-50 (y=0), platform edge z=-56 (y=3.0), stair centre z=-53.
// Rail at x=+/-(4.2+0.55)=+/-4.75, centre z=-53, y centre 1.95.
export default async ({ ev, shot, sleep, send }) => {
  const cam = (px, py, pz, lx, ly, lz) => ev(`(()=>{const c=window.__co.camera;window.__co.freeze=true;c.position.set(${px},${py},${pz});c.lookAt(${lx},${ly},${lz});})()`);
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(5000);
  await ev(`window.__co.freeze = true`);
  await sleep(1000);
  // (a) side profile, east, close: rail slope vs step slope
  await cam(14, 2.4, -53, 0, 1.5, -53); await sleep(2500);
  await shot('stairs-side');
  // (a2) side profile, wider, with hall context
  await cam(20, 5, -53, 0, 1.5, -53); await sleep(2500);
  await shot('stairs-side-wide');
  // (b) player view from stair base looking up: step material vs hall floor tone
  await cam(0, 1.6, -45, 0, 2.6, -56); await sleep(2500);
  await shot('stairs-base-up');
};
