import assert from 'node:assert/strict';

export default async ({ ev, send, sleep }) => {
  if (process.env.BLOCK_MAIN_ROOFS === '1') {
    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls: ['*chinh-dien-roof.glb*', '*dien-tam-the-roof.glb*'] });
    await send('Page.reload', { ignoreCache: true });
    for (let i = 0; i < 30 && !(await ev("Boolean(document.getElementById('enter'))")); i++) await sleep(500);
    await sleep(2500);
  }
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 35 && !(await ev('Boolean(window.__co?.me())')); i++) await sleep(1000);
  assert(await ev('Boolean(window.__co?.me())'), 'Game did not start: ' + await ev("JSON.stringify({body:document.body?.innerText.slice(0,500),button:document.getElementById('enter')?.outerHTML,ready:document.readyState,co:!!window.__co})"));
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: false });
  for (let i = 0; i < 20; i++) {
    const n = await ev(`(()=>{let n=0;window.__co.world.scene.traverse(o=>{if(o.name==='chinh-dien-roof'||o.name==='dien-tam-the-roof')n++});return n})()`);
    if (n === 2 || process.env.BLOCK_MAIN_ROOFS === '1') break;
    await sleep(1000);
  }
  const result = await ev(`(()=>{
    const {world,THREE}=window.__co, roofs=[];
    world.scene.traverse(o=>{
      if(o.name!=='chinh-dien-roof'&&o.name!=='dien-tam-the-roof'&&o.name!=='hall-roof-fallback'&&o.name!=='tam-the-roof-fallback')return;
      const box=new THREE.Box3().setFromObject(o), size=box.getSize(new THREE.Vector3());
      let triangles=0,meshes=0;
      o.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3}});
      roofs.push({name:o.name,source:o.userData.source,meshes,triangles,position:box.min.toArray(),size:size.toArray()});
    });
    return {roofs, floors:[world.groundY(0,-32),world.groundY(0,-68)],zones:[world.zoneAt(0,-23),world.zoneAt(0,-60)]};
  })()`);
  console.log('MAIN_ROOFS', JSON.stringify(result));
  assert.equal(result.roofs.length, 2);
  if (process.env.BLOCK_MAIN_ROOFS === '1') {
    assert(result.roofs.every(r => r.source === 'procedural-fallback'));
    return;
  }
  assert(result.roofs.every(r => r.source === 'blender' && r.meshes === 5));
  assert.deepEqual(result.floors, [1.35, 3]);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  for (const [name, pos, target] of [
    ['chinh-dien', [28, 18, -8], [0, 8, -32]],
    ['tam-the', [27, 22, -44], [0, 12, -68]],
  ]) {
    const image = await ev(`(()=>{const c=window.__co;c.world.scene.fog=null;c.camera.position.set(...${JSON.stringify(pos)});c.camera.lookAt(...${JSON.stringify(target)});c.camera.updateMatrixWorld(true);c.renderer.render(c.world.scene,c.camera);return c.renderer.domElement.toDataURL('image/png')})()`);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(`../shots/${name}-blender-roof.png`, Buffer.from(image.split(',')[1], 'base64'));
  }
};
