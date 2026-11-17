// Diagnostic-only changes to a live Note20 Chrome tab; restored in finally.
import WebSocket from 'ws';
import { writeFileSync } from 'node:fs';

const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = pages.find(p => p.type === 'page' && p.url === 'http://127.0.0.1:5173/');
if (!page) throw new Error('Note20 game tab not found');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
let id = 0;
const pending = new Map();
ws.on('message', data => {
  const message = JSON.parse(data);
  const done = pending.get(message.id);
  if (done) { pending.delete(message.id); done(message); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id;
  const timer = setTimeout(() => { pending.delete(n); reject(new Error(`${method} timed out`)); }, 90000);
  pending.set(n, value => { clearTimeout(timer); resolve(value); });
  ws.send(JSON.stringify({ id:n, method, params }));
});
const evaluate = async expression => {
  const reply = await send('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true });
  if (reply.error || reply.result?.exceptionDetails) throw new Error(JSON.stringify(reply.error ?? reply.result.exceptionDetails).slice(0, 800));
  return reply.result?.result?.value;
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
await send('Runtime.enable');
for (let i=0;i<50 && !(await evaluate('Boolean(window.__co?.me())'));i++) {
  if(i%5===0) await evaluate("document.getElementById('enter')?.click()");
  await sleep(1000);
}
const init = await evaluate(`(()=>{
  const c=window.__co;if(!c?.me())throw Error('Game not running');
  c.freeze=true;
  c.camera.position.set(0,10,32);c.camera.lookAt(0,2,-10);c.camera.updateMatrixWorld(true);
  const scene=c.world.scene,r=c.renderer, sun=c.world.sun;
  const arhatCasters=new Map();
  scene.getObjectByName('arhats')?.traverse(o=>{if(o.isMesh)arhatCasters.set(o.id,o.castShadow)});
  window.__courtOriginal={ratio:r.getPixelRatio(),shadow:sun.castShadow,shadowAutoUpdate:r.shadowMap.autoUpdate,post:c.post.enabled,bloom:c.post.bloom.enabled,npc:new Map([...c.remotes].map(([id,p])=>[id,p.char.root.visible])),arhatCasters,hall:scene.getObjectByName('hall')?.visible,tamThe:scene.getObjectByName('tamThe')?.visible};
  const nodes={meshes:0,visibleMeshes:0,casters:0,transparent:0,objects:0,geometry:new Set(),material:new Set()};
  scene.traverse(o=>{nodes.objects++;if(!o.isMesh)return;nodes.meshes++;if(o.visible)nodes.visibleMeshes++;if(o.castShadow)nodes.casters++;if(o.material?.transparent)nodes.transparent++;nodes.geometry.add(o.geometry);nodes.material.add(o.material)});
  return {agent:navigator.userAgent,hidden:document.hidden,viewport:[innerWidth,innerHeight],ratio:r.getPixelRatio(),buffer:[r.domElement.width,r.domElement.height],shadow:sun.castShadow,shadowSize:[sun.shadow.mapSize.x,sun.shadow.mapSize.y],nodes:{...nodes,geometry:nodes.geometry.size,material:nodes.material.size},memory:r.info.memory};
})()`);
if (init.hidden || !init.agent.includes('Android')) throw new Error('Android tab not visible');
console.log('INIT', JSON.stringify(init));
const cases = [
  ['baseline-1', {}],
  ['hide-main-hall', { hall:false }],
  ['baseline-hall', {}],
  ['hide-tam-the', { tamThe:false }],
  ['baseline-tam-the', {}],
  ['freeze-shadow-map', { frozen:true }],
  ['baseline-shadow', {}],
  ['no-arhat-shadows', { arhatShadow:false }],
  ['baseline-arhats', {}],
  ['no-shadow', { shadow:false }],
  ['baseline-2', {}],
  ['half-pixels', { ratio:.75 }],
  ['baseline-3', {}],
  ['no-post', { post:false }],
  ['baseline-4', {}],
  ['no-npc', { npc:false }],
  ['baseline-5', {}],
  ['no-bloom', { bloom:false }],
  ['baseline-6', {}],
  ['no-shadow-no-bloom', { shadow:false, bloom:false }],
];
const rows=[];
try {
  for (const [name, options] of cases) {
    await evaluate(`(()=>{
      const c=window.__co,r=c.renderer,sun=c.world.sun;
      const opts=${JSON.stringify(options)};
      sun.castShadow=opts.shadow!==false;
      r.shadowMap.autoUpdate=opts.frozen!==true;
      const arhats=c.world.scene.getObjectByName('arhats');
      arhats?.traverse(o=>{if(o.isMesh)o.castShadow=opts.arhatShadow!==false && window.__courtOriginal.arhatCasters.get(o.id)});
      c.world.scene.getObjectByName('hall').visible=opts.hall!==false;
      c.world.scene.getObjectByName('tamThe').visible=opts.tamThe!==false;
      r.setPixelRatio(opts.ratio??window.__courtOriginal.ratio);r.setSize(innerWidth,innerHeight,false);c.post.resize(innerWidth,innerHeight);
      c.post.enabled=opts.post!==false;c.post.bloom.enabled=opts.bloom!==false;
      c.remotes.forEach(p=>{if(p.data.npc)p.char.root.visible=opts.npc!==false});
      c.camera.position.set(0,10,32);c.camera.lookAt(0,2,-10);c.camera.updateMatrixWorld(true);
      return true;
    })()`);
    await sleep(1500);
    const row=await evaluate(`new Promise(resolve=>{
      const c=window.__co,r=c.renderer,scene=c.world.scene,duration=6000,start=performance.now();
      let last=0,frames=0,sceneFrames=0,renderCpu=0,sceneCpu=0,sceneCalls=0,sceneTris=0;
      const intervals=[],original=r.render;
      r.render=function(s,camera){const before=performance.now();try{return original.call(this,s,camera)}finally{
        const elapsed=performance.now()-before;renderCpu+=elapsed;
        if(s===scene){sceneFrames++;sceneCpu+=elapsed;sceneCalls+=r.info.render.calls;sceneTris+=r.info.render.triangles}
      }};
      function tick(t){if(last)intervals.push(t-last);last=t;frames++;
        if(t-start>=duration){r.render=original;intervals.sort((a,b)=>a-b);
          resolve({name:${JSON.stringify(name)},elapsed:+(t-start).toFixed(0),frames,
            fps:+((frames-1)*1000/(t-start)).toFixed(2),sceneFps:+(sceneFrames*1000/(t-start)).toFixed(2),
            renderCpuMs:+(renderCpu/sceneFrames).toFixed(2),sceneCpuMs:+(sceneCpu/sceneFrames).toFixed(2),
            updateBudgetMs:+((t-start-renderCpu)/sceneFrames).toFixed(2),
            calls:+(sceneCalls/sceneFrames).toFixed(0),tris:+(sceneTris/sceneFrames).toFixed(0),
            p95Ms:+intervals[Math.floor(intervals.length*.95)].toFixed(1),buffer:[r.domElement.width,r.domElement.height],hidden:document.hidden});return;
        }requestAnimationFrame(tick)}requestAnimationFrame(tick)
    })`);
    if (row.hidden || row.frames<2) throw new Error(`Invalid sample ${name}`);
    rows.push(row);
    console.log('CASE', JSON.stringify(row));
  }
  writeFileSync('../shots/note20-court-profile.json', JSON.stringify({init,cases:rows},null,2));
} finally {
  await evaluate(`(()=>{const c=window.__co,o=window.__courtOriginal;c.world.sun.castShadow=o.shadow;c.renderer.shadowMap.autoUpdate=o.shadowAutoUpdate;c.world.scene.getObjectByName('hall').visible=o.hall;c.world.scene.getObjectByName('tamThe').visible=o.tamThe;c.world.scene.getObjectByName('arhats')?.traverse(v=>{if(v.isMesh)v.castShadow=o.arhatCasters.get(v.id)});c.renderer.setPixelRatio(o.ratio);c.renderer.setSize(innerWidth,innerHeight,false);c.post.resize(innerWidth,innerHeight);c.post.enabled=o.post;c.post.bloom.enabled=o.bloom;c.remotes.forEach((p,id)=>{if(o.npc.has(id))p.char.root.visible=o.npc.get(id)});delete window.__courtOriginal;delete c.freeze;return true})()`).catch(()=>{});
  ws.close();
}
