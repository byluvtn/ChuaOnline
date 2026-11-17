import { writeFileSync } from 'node:fs';

export default async ({ ev, sleep, send, shot }) => {
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: false });
  // Fixed noon for readable acceptance images; production keeps the real clock.
  await ev(`Date.prototype.getHours=function(){return 12};Date.prototype.getMinutes=function(){return 0}`);
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 35 && !(await ev(`Boolean(window.__co?.me())`)); i++) await sleep(1000);
  if (!(await ev(`Boolean(window.__co?.me())`))) throw new Error('No player session');
  await ev(`window.__co.freeze=true`);
  await sleep(6000);
  await ev(`(()=>{const style=document.createElement('style');style.textContent='#hud,#topbar,#menu,#chat,#actionBar,#zoneAction,#minimap,#welcome,#actions,#playersOnline,#playerCard{visibility:hidden!important}';style.id='expansion-capture-style';document.head.append(style);for(const [id,r] of window.__co.remotes){r.char.root.traverse(o=>{if(o.isSprite)o.visible=false})}})()`);
  const sceneCounts = await ev(`(()=>{let meshes=0,triangles=0;window.__co.world.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)}});return {meshes,triangles}})()`);
  const geometry = await ev(`(()=>{const {world,THREE}=window.__co;const root=world.scene.getObjectByName('expansion');if(!root)throw new Error('No expansion group');return root.children.map(g=>{let meshes=0,triangles=0;g.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1)}});return {name:g.name,meshes,triangles}})})()`);
  console.log('EXPANSION_GEOMETRY', JSON.stringify(geometry));
  const walkResults = await ev(`(()=>{
    const {world,THREE,collide,pathfinder}=window.__co;
    const legs=[
      ['lotus bridge',-90,2,-66,2],['east bridge',60,2,72,2],['river north bridge',60,-38,69,-38],
      ['west gate',-90,2,-96,2],['east gate',90,2,96,2],['ngoc stairs',0,-82,0,-112]
    ];
    return legs.map(([name,x0,z0,x1,z1])=>{
      let maxPush=0,minClearance=Infinity,heightJump=0,lastY=world.groundY(x0,z0),samples=0;
      const count=Math.ceil(Math.hypot(x1-x0,z1-z0)/.08);
      for(let i=0;i<=count;i++){
        const x=x0+(x1-x0)*i/count,z=z0+(z1-z0)*i/count,p=new THREE.Vector3(x,world.groundY(x,z),z);
        collide(p);maxPush=Math.max(maxPush,Math.hypot(p.x-x,p.z-z));
        const y=world.groundY(p.x,p.z);heightJump=Math.max(heightJump,Math.abs(y-lastY));lastY=y;samples++;
        for(const c of world.colliders){let cx=c.x,cz=c.z;if(c.x2!==undefined){const dx=c.x2-c.x,dz=c.z2-c.z,t=Math.max(0,Math.min(1,((p.x-c.x)*dx+(p.z-c.z)*dz)/(dx*dx+dz*dz)));cx+=dx*t;cz+=dz*t}minClearance=Math.min(minClearance,Math.hypot(p.x-cx,p.z-cz)-c.r-.4)}
      }
      return {name,samples,maxPush,minClearance,heightJump};
    });
  })()`);
  console.log('EXPANSION_WALK', JSON.stringify(walkResults));
  const bad = walkResults.filter(r => r.maxPush > 0.06 || r.minClearance < -0.02);
  console.log('EXPANSION_WALK_FAILURES', JSON.stringify(bad));
  const routes = await ev(`(()=>{const {pathfinder}=window.__co;const targets=[['farm',-76,-42],['lotus',-78,2],['bamboo',80,-8],['duocsu',77,-32],['flowers',79,28],['ngoc',0,-112],['cave',-26,-102],['cemetery',50,-90],['tangxa',-64,-69.5],['riverwalk',69,-20]];return targets.map(([name,x,z])=>{const path=pathfinder.findPath({x:0,z:30},{x,z});let from={x:0,z:30},clear=true;for(const p of path){clear=clear&&pathfinder.segmentClear(from.x,from.z,p.x,p.z);from=p}return {name,points:path.length,fallback:pathfinder.lastFallback,clear,end:path.at(-1)}})})()`);
  console.log('EXPANSION_ROUTES', JSON.stringify(routes));
   await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
   await ev(`(()=>{const c=window.__co;c.renderer.setSize(1280,800,false);c.camera.aspect=1280/800;c.camera.updateProjectionMatrix()})()`);
  const cameras = [
    ['wide',[0,158,110],[0,0,-40]],
    ['west',[-104,59,5],[-73,0,-32]],
    ['east',[117,63,9],[73,0,-31]],
    ['north',[0,65,-51],[0,4,-100]],
    ['farm',[-94,20,-22],[-76,0,-42]],
    ['monastery',[-85,19,-54],[-64,0,-71]],
    ['lotus',[-100,16,18],[-78,0,-2]],
    ['bamboo',[101,17,19],[80,0,-3]],
    ['duocsu',[94,17,-18],[77,2,-38]],
    ['flowers',[101,17,44],[79,0,28]],
    ['ngoc',[13,19,-92],[0,8,-112]],
    ['cave',[-43,14,-86],[-26,4,-104]],
    ['pine',[47,20,-80],[25,4,-102]],
    ['cemetery',[68,18,-74],[50,1,-94]],
    ['river',[79,17,-2],[65,0,-22]],
    ['koi',[25,23,43],[0,0,14]],
  ];
  const renderStats=[];
  for (const [name,pos,look] of cameras) {
    const rendered = await ev(`(()=>{const c=window.__co;c.freeze=true;c.camera.position.set(${pos.join(',')});c.camera.lookAt(${look.join(',')});const fog=c.world.scene.fog;c.world.scene.fog=null;const lights=[];c.world.scene.traverse(o=>{if(o.isHemisphereLight){lights.push([o,o.intensity]);o.intensity=2.2}if(o.isDirectionalLight){lights.push([o,o.intensity]);o.intensity=3;o.position.set(30,80,-40);o.target.position.set(0,0,-40)}});c.renderer.render(c.world.scene,c.camera);const i=c.renderer.info,stats={calls:i.render.calls,triangles:i.render.triangles,geometries:i.memory.geometries,textures:i.memory.textures};const png=c.renderer.domElement.toDataURL('image/png').split(',')[1];c.world.scene.fog=fog;for(const [l,v] of lights)l.intensity=v;return {stats,png}})()`);
    if (!rendered?.png) throw new Error('No rendered image: '+name);
    writeFileSync('../shots/expansion-'+name+'.png', Buffer.from(rendered.png,'base64'));
    console.log('saved canvas',name);
    renderStats.push({name,...rendered.stats});
  }
  console.log('EXPANSION_RENDER', JSON.stringify(renderStats));
  writeFileSync('../shots/expansion-metrics.json', JSON.stringify({ scene: sceneCounts, geometry, walk: walkResults, routes, render: renderStats, realDeviceFrameTime: null }, null, 2));
  console.log('EXPANSION_EFFECTS', await ev(`(()=>{const c=window.__co;const take=(x,z)=>{const before=new Set(c.world.scene.children);c.world.spawnLantern(x,z);const g=c.world.scene.children.find(o=>!before.has(o));return {x:g.position.x,y:g.position.y,z:g.position.z}};return {lotus:take(-78,2),river:take(65,2),offering:take(77,-35)}})()`));
  await ev(`document.querySelector('[data-menu="map"]').click()`);
  await sleep(300);
  await shot('map');
  const desktopMap = await ev(`(()=>{const w=document.querySelector('.tmap-wrap');return w&&{width:w.clientWidth,content:w.scrollWidth}})()`);
  if (!desktopMap || desktopMap.content > desktopMap.width + 1) throw new Error('Desktop map is horizontally clipped');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(200);
  await shot('mobile-map');
  const mobileMap = await ev(`(()=>{const w=document.querySelector('.tmap-wrap');w.scrollLeft=w.scrollWidth;return {scroll:w.scrollLeft,width:w.clientWidth,content:w.scrollWidth,body:document.documentElement.scrollWidth}})()`);
  if (mobileMap.body > 390 || mobileMap.scroll <= 0) throw new Error('Mobile map scrolling failed');
  await shot('mobile-map-east');
  if(bad.length)throw new Error('Walk collision failures: '+bad.map(r=>r.name).join(', '));
  if(routes.some(r=>r.fallback || !r.clear))throw new Error('Routes not clear: '+routes.filter(r=>r.fallback || !r.clear).map(r=>r.name).join(', '));
};
