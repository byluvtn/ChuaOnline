import WebSocket from 'ws';
import { writeFileSync } from 'node:fs';

const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = pages.find(p => p.type === 'page' && p.url === 'http://127.0.0.1:5173/');
if (!page) throw new Error('Note20 game tab unavailable');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
let id = 0;
const pending = new Map();
ws.on('message', data => {
  const reply = JSON.parse(data);
  const cb = pending.get(reply.id);
  if (cb) { pending.delete(reply.id); cb(reply); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(new Error('CDP timeout')); }, 30000);
  pending.set(n, r => { clearTimeout(timer); resolve(r); });
  ws.send(JSON.stringify({ id:n, method, params }));
});
const evaluate = async expression => {
  const answer = await send('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true });
  if (answer.result?.exceptionDetails) throw new Error(JSON.stringify(answer.result.exceptionDetails).slice(0, 800));
  return answer.result?.result?.value;
};
await send('Runtime.enable');
const results=[];
for (const [name, position, target] of [
  ['court', [0,10,32], [0,2,-10]],
  ['near-tam-the', [27,17,-45], [0,10,-68]],
]) {
  const result = await evaluate(`(()=>{
    const c=window.__co,r=c.renderer,scene=c.world.scene,camera=c.camera;
    if(!c.me())throw Error('Enter game first');
    c.freeze=true;camera.position.set(...${JSON.stringify(position)});camera.lookAt(...${JSON.stringify(target)});camera.updateMatrixWorld(true);
    const actors=new Set([...c.remotes.values()].map(v=>v.char.root));
    const stats=new Map();
    const old=r.renderBufferDirect;
    r.renderBufferDirect=function(cam,sc,geo,mat,obj,group){
      let category='',item=obj;
      for(let p=obj;p&&p!==scene;p=p.parent){
        if(actors.has(p)){category='actors';break}
        if(p.parent===scene){item=p;break}
      }
      if(!category)category=item.name || (item.type+'#'+item.id);
      const pass=cam===camera?'color':'shadow';
      const key=pass+':'+category;
      const s=stats.get(key)??{calls:0,tris:0,meshes:new Set()};
      s.calls++;s.tris+=(geo.index?.count??geo.attributes.position.count)/3;s.meshes.add(obj.id);stats.set(key,s);
      return old.call(this,cam,sc,geo,mat,obj,group);
    };
    try{r.render(scene,camera)}finally{r.renderBufferDirect=old}
    const list=[...stats].map(([key,s])=>({key,calls:s.calls,tris:Math.round(s.tris),meshes:s.meshes.size}));
    list.sort((a,b)=>b.calls-a.calls);
    const totals={calls:r.info.render.calls,tris:r.info.render.triangles};
    return {name:${JSON.stringify(name)},totals,groups:list.slice(0,35),lightCount:scene.children.filter(o=>o.isLight).map(o=>({name:o.name,type:o.type,shadow:o.castShadow}))};
  })()`);
  results.push(result);
  console.log('DRAWS', JSON.stringify(result));
}
writeFileSync('../shots/note20-court-draws.json', JSON.stringify(results, null, 2));
ws.close();
