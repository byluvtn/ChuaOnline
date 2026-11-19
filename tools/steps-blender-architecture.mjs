import { writeFileSync } from 'node:fs';

export default async ({ ev, send, sleep, shot }) => {
  if (process.env.BLOCK_ARCH === '1') {
    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls: ['*dien-duoc-su-blender.glb*', '*tinh-that-blender.glb*'] });
    await send('Page.reload', { ignoreCache: true });
    await sleep(3000);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: false });
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 35 && !(await ev('Boolean(window.__co?.me())')); i++) await sleep(1000);
  if (!(await ev('Boolean(window.__co?.me())'))) throw new Error('No player: ' + await ev('document.body.innerText.slice(-1800)'));
  if (process.env.BLOCK_ARCH === '1') {
    await sleep(11000);
    const fallback = await ev(`(()=>{let count=0,meshes=0;window.__co.world.scene.traverse(o=>{if(o.userData.source==='procedural-fallback'){count++;o.traverse(m=>{if(m.isMesh)meshes++})}});return {count,meshes,zone:window.__co.world.zoneAt(77,-35)}})()`);
    if (fallback.count !== 4 || fallback.meshes < 10 || fallback.zone !== 'duocSu') throw new Error('Procedural fallback failed');
    console.log('BLENDER_MISSING_ASSET_FALLBACK', JSON.stringify(fallback));
    return;
  }
  for (let i = 0; i < 30; i++) {
    if (await ev(`(()=>{let n=0;window.__co.world.scene.traverse(o=>{if(o.userData.source==='blender')n++});return n===4})()`)) break;
    await sleep(1000);
  }
  const result = await ev(`(()=>{
    const {world,THREE}=window.__co,instances=[];
    world.scene.traverse(o=>{if(o.userData.source!=='blender')return;let triangles=0,meshes=0;const materials=new Set();o.traverse(m=>{if(m.isMesh){meshes++;triangles+=m.geometry.index.count/3;materials.add(m.material)}});const box=new THREE.Box3().setFromObject(o),size=box.getSize(new THREE.Vector3());instances.push({name:o.name,position:o.position.toArray(),size:size.toArray(),minY:box.min.y,triangles,meshes,materials:materials.size})});
    const fallbacks=[];world.scene.traverse(o=>{if(o.userData.source==='procedural-fallback')fallbacks.push(o.userData.asset)});
    const routes=[['duocSu',77,-32],['tinhThat',-64,-61.4]].map(([name,x,z])=>{const pf=window.__co.pathfinder,path=pf.findPath({x:0,z:30},{x,z});return {name,fallback:pf.lastFallback,end:path.at(-1)}});
    return {instances,fallbacks,routes,seats:world.seats.filter(s=>(s.x>71&&s.x<83&&s.z<-30&&s.z>-43)||(s.x>-70&&s.x<-58&&s.z<-60&&s.z>-70)).length,floor:[world.groundY(77,-38),world.groundY(-64,-63.8)],zone:world.zoneAt(77,-35)};
  })()`);
  console.log('BLENDER_INTEGRATION', JSON.stringify(result));
  if (!result || result.instances.length !== 4 || result.fallbacks.length || result.routes.some(r=>r.fallback)) throw new Error('GLB replacement failed');
  for (const instance of result.instances) {
    const hall = instance.name.startsWith('dien');
    if (instance.meshes !== 6 || instance.materials !== 6 || Math.abs(instance.size[1] - (hall ? 14.07 : 3.95)) > .02 || Math.abs(instance.minY) > .001) throw new Error('Size/material mismatch');
  }
  if (result.floor[0] !== .45 || result.floor[1] !== .16 || result.seats < 7) throw new Error('Floor/seat regression');
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 800, deviceScaleFactor: 1, mobile: false });
  await ev(`(()=>{const c=window.__co;c.renderer.setSize(1100,800,false);c.camera.aspect=1100/800;c.camera.updateProjectionMatrix();document.getElementById('loading')?.remove()})()`);
  const stats = [];
  for (const [name, position, target] of [
    ['duoc-su', [94, 12, -14], [77, 4, -38]],
    ['tinh-that', [-52, 6, -53], [-64, 1.4, -65]],
  ]) {
    const data = await ev(`(()=>{const c=window.__co,{THREE}=c;const scene=new THREE.Scene();scene.background=new THREE.Color('#e5dfcf');scene.add(new THREE.HemisphereLight(0xfff5df,0x777c65,2));const sun=new THREE.DirectionalLight(0xfff2d8,3);sun.position.set(20,40,15);scene.add(sun);const floor=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshStandardMaterial({color:0xc8c7af,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);c.world.scene.traverse(o=>{if(o.userData.source==='blender'&&(${JSON.stringify(name)}==='duoc-su')===o.name.startsWith('dien'))scene.add(o.clone(true))});c.camera.position.set(...${JSON.stringify(position)});c.camera.lookAt(...${JSON.stringify(target)});c.camera.updateMatrixWorld(true);c.renderer.render(scene,c.camera);return {image:c.renderer.domElement.toDataURL('image/png'),calls:c.renderer.info.render.calls,triangles:c.renderer.info.render.triangles}})()`);
    writeFileSync(`../shots/blender-${name}.png`, Buffer.from(data.image.split(',')[1], 'base64'));
    stats.push({ name, calls: data.calls, triangles: data.triangles });
  }
  console.log('BLENDER_ISOLATED_RENDER', JSON.stringify(stats));
  for (const [name, position, target] of [['duoc-su', [91,10,-17],[77,3,-38]], ['tinh-that',[-54,5,-54],[-64,1.5,-65]]]) {
    const image = await ev(`(()=>{const c=window.__co;c.world.scene.fog=null;const ambient=new c.THREE.HemisphereLight(0xfff3da,0x5b7053,1.8);c.world.scene.add(ambient);c.camera.position.set(...${JSON.stringify(position)});c.camera.lookAt(...${JSON.stringify(target)});c.camera.updateMatrixWorld(true);c.renderer.render(c.world.scene,c.camera);const image=c.renderer.domElement.toDataURL('image/png');c.world.scene.remove(ambient);return image})()`);
    writeFileSync(`../shots/blender-${name}-ingame.png`, Buffer.from(image.split(',')[1], 'base64'));
  }
  writeFileSync('../shots/blender-architecture-metrics.json', JSON.stringify({ ...result, isolatedRender: stats }, null, 2));
  await shot('integration');
};
