import { writeFileSync } from 'node:fs';

export default async ({ ev, send, sleep }) => {
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 200, deviceScaleFactor: 1, mobile: false });
  await ev(`document.getElementById('enter').click()`);
  for (let i = 0; i < 30 && !(await ev(`Boolean(window.__co?.me())`)); i++) await sleep(1000);
  if (!(await ev(`Boolean(window.__co?.me())`))) throw new Error('No player session');
  await sleep(6000);
  const result = await ev(`(async()=>{
    const {ROAD_NODES,ROAD_EDGES}=await import('/shared/roads.ts');
    const {world,pathfinder,collide,THREE}=window.__co;
    const nodes=new Map(ROAD_NODES.map(n=>[n.id,n]));
    const hits=ROAD_EDGES.filter(([a,b])=>{const p=nodes.get(a),q=nodes.get(b);return !pathfinder.segmentClear(p.x,p.z,q.x,q.z)}).map(([a,b])=>{
      const p=nodes.get(a),q=nodes.get(b),n=Math.ceil(Math.hypot(p.x-q.x,p.z-q.z)/.2);let worst=null;
      for(let i=0;i<=n;i++){const x=p.x+(q.x-p.x)*i/n,z=p.z+(q.z-p.z)*i/n;const v=new THREE.Vector3(x,world.groundY(x,z),z);collide(v);const push=Math.hypot(v.x-x,v.z-z);if(!worst||push>worst.push)worst={x,z,push,near:world.colliders.filter(c=>Math.hypot(c.x-x,c.z-z)<c.r+.9).map(c=>({x:c.x,z:c.z,r:c.r,x2:c.x2,z2:c.z2}))}}
      const suggested=pathfinder.findPath(p,q);
      return {edge:[a,b],p,q,worst,suggested};
    });
     const {PLACES}=await import('/src/data/places.ts');
     const targets=[['farm',-76,-42],['lotus',-78,2],['bamboo',80,-8],['duocsu',77,-32],['flowers',79,28],['cave',-26,-102],['cemetery',50,-90],['tangxa',-64,-69.5],['riverwalk',69,-20],...PLACES.slice(26).map(p=>[p.name,p.x,p.z]),...PLACES.filter(p=>['Vườn Tháp','Tăng xá','Bảo tháp','Khu nghỉ','Gác chuông','Gác trống','Phòng Ghi Công Đức'].includes(p.name)).map(p=>[p.name,p.x,p.z])];
     const routes=targets.map(([name,x,z])=>{const before=performance.now(),path=pathfinder.findPath({x:0,z:30},{x,z}),ms=performance.now()-before;let prev={x:0,z:30},maxPush=0,worst=null,samples=0,clear=true;for(const p of path){clear=clear&&pathfinder.segmentClear(prev.x,prev.z,p.x,p.z);const n=Math.max(1,Math.ceil(Math.hypot(p.x-prev.x,p.z-prev.z)/.12));for(let i=0;i<=n;i++){const xx=prev.x+(p.x-prev.x)*i/n,zz=prev.z+(p.z-prev.z)*i/n,v=new THREE.Vector3(xx,world.groundY(xx,zz),zz);collide(v);const push=Math.hypot(v.x-xx,v.z-zz);if(push>maxPush){maxPush=push;worst={x:xx,z:zz,after:{x:v.x,z:v.z},near:world.colliders.filter(c=>Math.hypot(c.x-xx,c.z-zz)<c.r+1).map(c=>({...c}))}}samples++}prev=p}return{name,fallback:pathfinder.lastFallback,points:path.length,end:path.at(-1),ms,clear,maxPush,worst,samples}});
     for(let i=0;i<routes.length;i++){const end=routes[i].end;routes[i].reached=Boolean(end&&Math.hypot(end.x-targets[i][1],end.z-targets[i][2])<.05)}
     return {edges:hits,routes};
  })()`);
  writeFileSync('../shots/expansion-path-diagnostics.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify({ unclearEdges: result.edges.length, physicalEdges: result.edges.filter(e => e.worst.push > 0.06).map(e => ({ edge: e.edge, push: e.worst.push })), routes: result.routes }));
  if (!result || result.routes.some(r => r.fallback || !r.clear || !r.reached || r.maxPush > 0.06)) throw new Error('Expansion route acceptance failed');
  if (process.env.WALK_INPUT !== '1') return;
  await send('Page.bringToFront');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    const input = await ev(`(async()=>{const {NGOC,NORTH_WALK_Z}=await import('/shared/campus.ts');const c=window.__co;c.renderer.setSize(160,100,false);const p=c.me().char.root.position;p.set(NGOC.x,c.world.groundY(NGOC.x,NORTH_WALK_Z),NORTH_WALK_Z);c.me().target.copy(p);c.walkTo(NGOC.x,NGOC.stairTop-.5);return await new Promise(resolve=>{const start=performance.now(),timer=setInterval(()=>{const distance=Math.hypot(p.x-NGOC.x,p.z-NGOC.stairTop+.5);if((distance<.8&&Math.abs(p.y-NGOC.y)<.01)||performance.now()-start>90000){clearInterval(timer);resolve({name:'ngoc actual walk loop',distance,x:p.x,y:p.y,z:p.z,expectedY:NGOC.y,elapsed:performance.now()-start})}},250)})})()`);
  console.log('EXPANSION_INPUT', JSON.stringify(input));
  if (input.distance >= .8 || Math.abs(input.y - input.expectedY) >= .01) throw new Error('Ngoc click-to-walk did not arrive');
  for (const [name, x0, z0, x1, z1] of [['lotus', -90, 2, -66, 2], ['river', 60, -38, 70, -38]]) {
    const walked = await ev(`(async()=>{const c=window.__co,p=c.me().char.root.position;p.set(${x0},c.world.groundY(${x0},${z0}),${z0});c.me().target.copy(p);c.walkTo(${x1},${z1});return await new Promise(resolve=>{const start=performance.now(),timer=setInterval(()=>{const distance=Math.hypot(p.x-(${x1}),p.z-(${z1}));if(distance<1||performance.now()-start>60000){clearInterval(timer);resolve({name:${JSON.stringify(name)},distance,x:p.x,z:p.z})}},250)})})()`);
    console.log('EXPANSION_INPUT', JSON.stringify(walked));
    if (walked.distance >= 1) throw new Error(name + ' actual click-to-walk did not arrive');
  }
};
