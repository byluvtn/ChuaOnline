export default async ({ ev, sleep }) => {
  await sleep(1500);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 20 && (await ev(`String(!!window.__co.me())`)) !== 'true'; i++) await sleep(1000);
  await sleep(1000);
  const cost = (names) => ev(`JSON.stringify((()=>{const sc=window.__co.world.scene;const names=${JSON.stringify(names)};let m=0,t=0;
    const tri=(o)=>{const g=o.geometry;return g.index?g.index.count/3:g.attributes.position.count/3};
    for(const n of names){const r=sc.getObjectByName(n);if(!r)continue;r.traverse(o=>{if(o.isMesh){m+=1;t+=tri(o)*(o.isInstancedMesh?o.count:1)}})}
    return {meshes:m,tris:Math.round(t)}})())`);
  const all = await ev(`JSON.stringify((()=>{const sc=window.__co.world.scene;let m=0,t=0;sc.traverse(o=>{if(o.isMesh&&o.visible){m++;const g=o.geometry;t+=(g.index?g.index.count/3:g.attributes.position.count/3)*(o.isInstancedMesh?o.count:1)}});return {meshes:m,tris:Math.round(t)}})())`);
  console.log('SCENE total', all);
  console.log('tang-xa-tay', await cost(['tang-xa-tay']));
  console.log('trai-duong', await cost(['trai-duong']));
  console.log('nha-to (reference)', await cost(['nha-to']));
  console.log('tang-xa (reference)', await cost(['tang-xa']));
};
