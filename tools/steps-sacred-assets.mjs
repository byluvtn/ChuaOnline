import { writeFileSync } from 'node:fs';

export default async ({ ev, send, sleep }) => {
  if (process.env.BLOCK_SACRED === '1') {
    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls: ['*buddha-sculpted.glb*','*guanyin-sculpted.glb*','*bao-thap-blender.glb*','*dinh-sen-blender.glb*','*thien-duong-blender.glb*'] });
  }
  if (process.env.COMPARE_SCANS === '1') {
    const comparison = await ev(`(async()=>{
      const c=window.__co,T=c.THREE, {GLTFLoader}=await import('/node_modules/.vite/deps/three_examples_jsm_loaders_GLTFLoader__js.js');
      const loader=new GLTFLoader(),out=[];
      for(const name of ['seated-buddha','guanyin-ngoi']){
        const gltf=await loader.loadAsync('/models/'+name+'.glb');let source=gltf.scene;
        const b=new T.Box3().setFromObject(source),size=b.getSize(new T.Vector3());
        const scl=4.6/size.y;source.scale.setScalar(scl);
        const bb=new T.Box3().setFromObject(source),ctr=bb.getCenter(new T.Vector3());
        source.position.sub(new T.Vector3(ctr.x,bb.min.y,ctr.z));
        const scene=new T.Scene();scene.background=new T.Color(0xb7c4c1);
        scene.add(new T.HemisphereLight(0xffeed6,0x6d786b,3));
        const sun=new T.DirectionalLight(0xffe8c2,3);sun.position.set(12,25,14);scene.add(sun);
        scene.add(source);
        const camera=new T.PerspectiveCamera(48,1100/760,.1,200);camera.position.set(6,5,9);camera.lookAt(0,2.2,0);
        c.renderer.setSize(1100,760,false);c.renderer.render(scene,camera);
        let tris=0;source.traverse(o=>{if(o.isMesh)tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3});
        out.push({name,triangles:tris,image:c.renderer.domElement.toDataURL('image/png')});
      }
      return out;
    })()`);
    for(const entry of comparison){writeFileSync(`../shots/sacred-scan-${entry.name}.png`,Buffer.from(entry.image.split(',')[1],'base64')); console.log('SCAN',entry.name,entry.triangles)}
    return;
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: false });
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 35 && !(await ev('Boolean(window.__co?.me())')); i++) await sleep(1000);
  if (process.env.BLOCK_SACRED === '1') {
    await sleep(2500);
    const fallback = await ev(`(()=>{let n=0;window.__co.world.scene.traverse(o=>{if(['buddha-sculpted','guanyin-sculpted','bao-thap-blender','dinh-sen-blender','thien-duong-blender'].includes(o.userData.asset)&&o.userData.source==='procedural-fallback')n++});return {n,zone:window.__co.world.zoneAt(-34,-15)}})()`);
    console.log('SACRED_FALLBACK',JSON.stringify(fallback));
    if (fallback.n !== 5 || fallback.zone !== 'baoThap') throw new Error('Model fallback failed');
    return;
  }
  for (let i = 0; i < 25; i++) {
    const ready = await ev(`(()=>{let n=0;window.__co.world.scene.traverse(o=>{if(o.userData.source==='blender'&&['buddha-sculpted','guanyin-sculpted','bao-thap-blender','dinh-sen-blender','thien-duong-blender'].includes(o.name))n++});return n===5})()`);
    if (ready) break;
    await sleep(1000);
  }
  const metrics = await ev(`(()=>{
    const c=window.__co, result=[];
    const corridorMaterials=new Set();
    c.world.scene.getObjectByName('arhats').traverse(o=>{if(o.isMesh) corridorMaterials.add(o.material)});
    c.world.scene.traverse(o=>{
      if(o.userData.source!=='blender'||!['buddha-sculpted','guanyin-sculpted','bao-thap-blender','dinh-sen-blender','thien-duong-blender'].includes(o.name))return;
      const box=new c.THREE.Box3().setFromObject(o,o.name==='guanyin-sculpted'),size=box.getSize(new c.THREE.Vector3());
      let tris=0,draws=0;o.traverse(m=>{if(m.isMesh){draws++;tris+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3}});
      const entry={name:o.name,size:size.toArray(),minY:box.min.y,draws,tris};
      if(o.name.endsWith('-sculpted')){
        entry.position=o.getWorldPosition(new c.THREE.Vector3()).toArray();
        entry.facingX=o.getWorldDirection(new c.THREE.Vector3()).x;
        entry.sharedGold=true;
        o.traverse(m=>{if(m.isMesh) entry.sharedGold&&=corridorMaterials.has(m.material)&&m.material.color.getHex()===0xd4af37});
        if(o.name==='guanyin-sculpted'){
          const pedestal=o.parent.children.filter(m=>m.isMesh&&m.userData.sealable).sort((a,b)=>b.position.y-a.position.y)[0];
          const inverse=o.parent.matrixWorld.clone().invert(), foot=new c.THREE.Box3(), point=new c.THREE.Vector3();
          o.traverse(m=>{
            if(!m.isMesh)return;
            const positions=m.geometry.attributes.position, relative=inverse.clone().multiply(m.matrixWorld);
            for(let i=0;i<positions.count;i++){
              point.fromBufferAttribute(positions,i).applyMatrix4(relative);
              if(point.y<=o.position.y+.15)foot.expandByPoint(point);
            }
          });
          if(foot.isEmpty())throw new Error('Missing Quan Am contact geometry');
          entry.footOffset=foot.getCenter(point).sub(pedestal.position).toArray().filter((_,i)=>i!==1);
          entry.pedestalTop=new c.THREE.Box3().setFromObject(pedestal).max.y;
        }
      }
      result.push(entry);
    });
    const fallback=[];c.world.scene.traverse(o=>{if(o.userData.source==='procedural-fallback'&&result.some(r=>r.name===o.userData.asset))fallback.push(o.userData.asset)});
    let trees=0;c.world.scene.traverse(o=>{if(o.isMesh&&/^(oak-natural|pine-natural)-(bark|leaf|pine)/.test(o.name))trees++});
    return {result,fallback,trees,
      floor:c.world.groundY(-34,-15),zone:c.world.zoneAt(-34,-15)};
  })()`);
  console.log('SACRED_ASSETS', JSON.stringify(metrics));
  if (metrics.result.length !== 5 || metrics.fallback.length || metrics.result.some(r => r.draws > 10 || r.tris > 19000)) throw new Error('Model integration or budget failed');
  if (metrics.trees < 5) throw new Error('Blender trees did not load');
  for (const [name, x] of [['guanyin-sculpted', 28], ['buddha-sculpted', -28]]) {
    const statue = metrics.result.find(r => r.name === name);
    const [sx, sy, sz] = statue.position;
    if (!statue.sharedGold || sx !== x || sy !== 1.2 || sz !== 14 || Math.abs(statue.minY - sy) > .02 || statue.facingX * Math.sign(x) > -.9) throw new Error(`Yard statue finish or placement failed: ${name}`);
  }
  const guanyin = metrics.result.find(r => r.name === 'guanyin-sculpted');
  if (Math.hypot(...guanyin.footOffset) > .02 || Math.abs(guanyin.minY - guanyin.pedestalTop) > .02) throw new Error('Quan Am not centered on pedestal');
  const thap = metrics.result.find(r => r.name === 'bao-thap-blender');
  if (Math.abs(thap.minY - .9) > .03 || Math.abs(metrics.floor - .92) > .001 || metrics.zone !== 'baoThap') throw new Error('Pagoda floor regressed');
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 760, deviceScaleFactor: 1, mobile: false });
  for (const name of ['guanyin-sculpted','buddha-sculpted','bao-thap-blender','dinh-sen-blender','thien-duong-blender']) {
    const image = await ev(`(()=>{
      const c=window.__co,T=c.THREE,scene=new T.Scene();scene.background=new T.Color(0xb7c4c1);
      scene.add(new T.HemisphereLight(0xffeed6,0x6d786b,3));
      const sun=new T.DirectionalLight(0xffe8c2,3);sun.position.set(12,25,14);scene.add(sun);
      const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0xb9afa0,roughness:1}));
      floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
      let model;c.world.scene.traverse(o=>{if(o.name===${JSON.stringify(name)}&&o.userData.source==='blender')model=o});
      model.updateMatrixWorld(true);
      const withPedestal=model.name==='guanyin-sculpted';
      const clone=(withPedestal?model.parent:model).clone(true);
      if(withPedestal){clone.position.set(0,0,0);clone.rotation.set(0,0,0);}
      const box=new T.Box3().setFromObject(clone),center=box.getCenter(new T.Vector3());
      if(!withPedestal)clone.position.sub(new T.Vector3(center.x,box.min.y,center.z));
      scene.add(clone);
      const size=box.getSize(new T.Vector3());const camera=new T.PerspectiveCamera(48,1100/760,.1,200);
      const distance=Math.max(size.x,size.y,size.z)*1.75;
      camera.position.set(distance*.65,size.y*.9,distance);camera.lookAt(0,size.y*.48,0);
      c.renderer.setSize(1100,760,false);c.renderer.render(scene,camera);
      return c.renderer.domElement.toDataURL('image/png');
    })()`);
    const path = name === 'guanyin-sculpted' ? '../shots/sacred-guanyin-pedestal.png' : `../shots/sacred-${name}.png`;
    writeFileSync(path, Buffer.from(image.split(',')[1], 'base64'));
    console.log('saved', path);
  }
};
