// Run from tools/ with Note20 Chrome visible, adb reverse 5173/3001 and CDP forward 9222.
import WebSocket from 'ws';
import { writeFileSync } from 'node:fs';

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const target = targets.find(t => t.type === 'page' && t.url === 'http://127.0.0.1:5173/');
if (!target) throw new Error('Note20 Chrome game tab unavailable');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
let serial = 0;
const pending = new Map();
ws.on('message', data => {
  const message = JSON.parse(data);
  const callback = pending.get(message.id);
  if (callback) { pending.delete(message.id); callback(message); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++serial;
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP ${method} timed out`)); }, 90000);
  pending.set(id, result => { clearTimeout(timeout); resolve(result); });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const reply = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (reply.error || reply.result?.exceptionDetails) throw new Error(JSON.stringify(reply.error ?? reply.result.exceptionDetails).slice(0, 600));
  return reply.result?.result?.value;
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
const variant = process.env.ROOF_FALLBACK === '1' ? 'procedural' : 'blender';
try {
  await send('Network.setBlockedURLs', { urls: variant === 'procedural'
    ? ['*chinh-dien-roof.glb*', '*dien-tam-the-roof.glb*'] : [] });
  await send('Page.reload', { ignoreCache: true });
  await sleep(3000);
  for (let attempt = 0; attempt < 60 && !(await evaluate('Boolean(window.__co?.me())')); attempt++) {
    if (attempt % 5 === 0) await evaluate("document.getElementById('enter')?.click()");
    await sleep(1000);
  }
  if (!(await evaluate('Boolean(window.__co?.me())'))) throw new Error('Game did not start on Note20');
  // Let remote GLB fetch/retries settle, including the blocked-asset case.
  await sleep(8000);
  const device = await evaluate(`({agent:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,hidden:document.hidden,screen:[screen.width,screen.height]})`);
  if (!device.agent.includes('Android') || device.hidden) throw new Error('Note20 Chrome is not visible');
  const roofs = await evaluate(`(()=>{const roofs=[];window.__co.world.scene.traverse(o=>{if(['chinh-dien-roof','dien-tam-the-roof','hall-roof-fallback','tam-the-roof-fallback'].includes(o.name))roofs.push({name:o.name,source:o.userData.source})});return roofs})()`);
  if (roofs.length !== 2 || roofs.some(r => r.source !== variant && !(variant === 'procedural' && r.source === 'procedural-fallback')))
    throw new Error(`Wrong roofs for ${variant}: ${JSON.stringify(roofs)}`);
  console.log('DEVICE', JSON.stringify(device));
  console.log('ROOFS', JSON.stringify(roofs));
  const spots = [
    { name:'main-court', camera:[0,10,32], target:[0,2,-10] },
    { name:'chinh-dien-near', camera:[24,13,-12], target:[0,8,-32] },
    { name:'tam-the-near', camera:[27,17,-45], target:[0,10,-68] },
  ];
  const samples = [];
  for (const spot of spots) {
    await evaluate(`(()=>{const c=window.__co;c.freeze=true;c.camera.position.set(...${JSON.stringify(spot.camera)});c.camera.lookAt(...${JSON.stringify(spot.target)});c.camera.updateMatrixWorld(true);return true})()`);
    await sleep(2000);
    const result = await evaluate(`new Promise(resolve=>{
      const c=window.__co,duration=8000,deltas=[],start=performance.now();let previous=0,frames=0,sceneFrames=0;
      const original=c.renderer.render;
      c.renderer.render=function(scene,camera){if(scene===c.world.scene)sceneFrames++;return original.call(this,scene,camera)};
      function tick(t){if(previous)deltas.push(t-previous);previous=t;frames++;
        if(t-start>=duration){c.renderer.render=original;deltas.sort((a,b)=>a-b);const n=deltas.length;
          resolve({frames,elapsedMs:+(t-start).toFixed(0),fps:+((frames-1)*1000/(t-start)).toFixed(2),
            sceneFrames,renderFps:+(sceneFrames*1000/(t-start)).toFixed(2),
            p95Ms:+deltas[Math.floor(n*.95)].toFixed(2),p99Ms:+deltas[Math.floor(n*.99)].toFixed(2),
            over50:deltas.filter(v=>v>50).length,buffer:[c.renderer.domElement.width,c.renderer.domElement.height],hidden:document.hidden});return;
        }requestAnimationFrame(tick)}requestAnimationFrame(tick)})`);
    if (result.hidden || result.frames < 2) throw new Error(`Invalid frame sample at ${spot.name}`);
    const cost = await evaluate(`(()=>{const c=window.__co;c.renderer.render(c.world.scene,c.camera);return {calls:c.renderer.info.render.calls,triangles:c.renderer.info.render.triangles}})()`);
    samples.push({ name:spot.name, ...result, sceneRender:cost });
    console.log('FPS', JSON.stringify(samples.at(-1)));
  }
  const suffix = process.env.REPEAT === '1' ? '-repeat' : '';
  writeFileSync(`../shots/note20-main-roofs-${variant}${suffix}.json`, JSON.stringify({ variant, device, roofs, conditions:'Note20 Chrome, USB reverse, same static camera, 2s warmup and 8s rAF sample per spot; renderer.render counted for scene, not a GPU timer', spots:samples }, null, 2));
} finally {
  await send('Network.setBlockedURLs', { urls: [] }).catch(() => {});
  ws.close();
}
