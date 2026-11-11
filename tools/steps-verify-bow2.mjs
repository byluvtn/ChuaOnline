export default async ({ ev, shot, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  await sleep(5000);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1500);
  const st = await ev(`(()=>{const s=window.__co.world.seats[0];const r=window.__co.me().char.root;r.position.set(s.x+1.0,0,s.z+1.5);return JSON.stringify(s)+' now '+r.position.x+','+r.position.z})()`);
  console.log('seat', st);
  await ev(`document.querySelector('#actions [data-act="bow"]').click()`);
  for (let i = 0; i < 8; i++) { await sleep(1500); console.log(i, await ev(`(()=>{const m=window.__co.me();const p=m.char.root.position;return [p.x.toFixed(2),p.y.toFixed(2),p.z.toFixed(2),m.anim,document.getElementById('sitBtn').className].join(' ')})()`)); }
  await shot('bow-seat');
};
