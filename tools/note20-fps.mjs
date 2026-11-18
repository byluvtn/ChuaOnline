import WebSocket from 'ws';
import { writeFileSync } from 'node:fs';

const host = 'http://127.0.0.1:9222';
const targets = await (await fetch(`${host}/json`)).json();
const target = targets.find(t => t.type === 'page' && t.url === 'http://127.0.0.1:5173/');
if (!target) throw new Error('Note20 Chrome game tab unavailable');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
let serial = 0;
const pending = new Map();
ws.on('message', data => {
  const message = JSON.parse(data);
  if (!pending.has(message.id)) return;
  pending.get(message.id)(message);
  pending.delete(message.id);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++serial;
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP ${method} timed out`)); }, 120000);
  pending.set(id, result => { clearTimeout(timeout); resolve(result); });
  ws.send(JSON.stringify({ id, method, params }));
});
const evalPhone = async expression => {
  const answer = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (answer.error || answer.result.exceptionDetails) throw new Error(JSON.stringify(answer.error ?? answer.result.exceptionDetails).slice(0, 600));
  return answer.result.result.value;
};
await send('Page.enable');
await send('Runtime.enable');
const fallback = process.env.ARCH_FALLBACK === '1';
if (fallback) {
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*dien-duoc-su-blender.glb*', '*tinh-that-blender.glb*'] });
  await send('Page.reload', { ignoreCache: true });
} else if (process.env.FORCE_RELOAD === '1') {
  await send('Page.reload', { ignoreCache: true });
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const phone = await evalPhone(`({agent:navigator.userAgent,screen:[screen.width,screen.height],viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,hidden:document.hidden,webgl:!!document.createElement('canvas').getContext('webgl2')})`);
console.log('PHONE', JSON.stringify(phone));
if (!phone.agent.includes('Android') || phone.hidden) throw new Error('No visible Android Chrome page');
for (let attempt = 0; attempt < 50 && !(await evalPhone(`Boolean(window.__co?.me())`)); attempt++) {
  if (attempt % 5 === 0) await evalPhone(`document.getElementById('enter')?.click()`);
  await sleep(1000);
}
if (!(await evalPhone(`Boolean(window.__co?.me())`))) throw new Error('Game session not ready on Note20: ' + await evalPhone('document.body.innerText.slice(0,1200)'));
if (fallback) await sleep(10000);
const loaded = await evalPhone(`(()=>{const result=[];window.__co.world.scene.traverse(o=>{if(o.userData.source===${JSON.stringify(fallback ? 'procedural-fallback' : 'blender')})result.push(o.userData.asset ?? o.name)});return result})()`);
if (loaded.length !== 4) throw new Error(`Expected 4 ${fallback ? 'procedural' : 'Blender'} models, got ${loaded.join(',')}`);
console.log('LOADED', JSON.stringify(loaded));

const spots = [
  { name:'main-court', camera:[0,10,32], target:[0,2,-10] },
  { name:'duoc-su-near', camera:[84,8,-25], target:[77,3,-38] },
  { name:'duoc-su-far', camera:[94,12,-14], target:[77,4,-38] },
  { name:'tinh-that-near', camera:[-60,5,-55], target:[-64,2,-65] },
  { name:'tinh-that-far', camera:[-52,9,-47], target:[-64,2,-65] },
  { name:'ngoc-stairs', camera:[0,13,-95], target:[0,6,-120] },
];
if (process.env.QUICK === '1') spots.splice(0, spots.length,
  { name:'duoc-su-near', camera:[84,8,-25], target:[77,3,-38] },
  { name:'tinh-that-near', camera:[-60,5,-55], target:[-64,2,-65] });
const samples = [];
for (const spot of spots) {
  await evalPhone(`(()=>{const co=window.__co;co.freeze=true;co.camera.position.set(...${JSON.stringify(spot.camera)});co.camera.lookAt(...${JSON.stringify(spot.target)});return true})()`);
  await sleep(2000);
  const cost = process.env.QUICK === '1' ? null : await evalPhone(`(()=>{const c=window.__co;c.renderer.render(c.world.scene,c.camera);return {calls:c.renderer.info.render.calls,triangles:c.renderer.info.render.triangles}})()`);
  const result = await evalPhone(`new Promise(resolve=>{
    const c=window.__co, duration=${process.env.QUICK === '1' ? 3500 : 8000}, samples=[], start=performance.now();let last=0,frames=0,sceneFrames=0;
    const original=c.renderer.render;c.renderer.render=function(scene,camera){if(scene===c.world.scene)sceneFrames++;return original.call(this,scene,camera)};
    function tick(t){if(last) samples.push(t-last);last=t;frames++;if(t-start>=duration){
      c.renderer.render=original;
      samples.sort((a,b)=>a-b);const n=samples.length;
      resolve({name:${JSON.stringify(spot.name)},elapsedMs:t-start,frames,fps:+((frames-1)*1000/(t-start)).toFixed(2),
        sceneFrames,renderFps:+(sceneFrames*1000/(t-start)).toFixed(2),
        avgMs:+((t-start)/(frames-1)).toFixed(2),p95Ms:+samples[Math.floor(n*.95)].toFixed(2),
        p99Ms:+samples[Math.floor(n*.99)].toFixed(2),maxMs:+samples[n-1].toFixed(2),
        over33:samples.filter(v=>v>33.3).length,over50:samples.filter(v=>v>50).length,
        calls:c.renderer.info.render.calls,triangles:c.renderer.info.render.triangles,
        buffer:[c.renderer.domElement.width,c.renderer.domElement.height],hidden:document.hidden});return;
      }requestAnimationFrame(tick)}requestAnimationFrame(tick)})`);
  if (result.hidden || result.frames < 2) throw new Error(`Invalid phone sample: ${spot.name}`);
  samples.push({ ...result, sceneRender:cost });
  console.log('FPS', JSON.stringify({ ...result, sceneRender:cost }));
  if (!fallback && (spot.name === 'duoc-su-near' || spot.name === 'tinh-that-near')) {
    const shot = await send('Page.captureScreenshot', { format:'png', fromSurface:true });
    writeFileSync(`../shots/note20-${spot.name}.png`, Buffer.from(shot.result.data,'base64'));
  }
}
const report = { device:phone, loaded, variant:fallback ? 'procedural fallback' : 'Blender GLB', conditions:`Note20 Chrome, screen on, USB reverse, dev Vite, stationary camera, 2s warmup + ${process.env.QUICK === '1' ? '3.5' : '8'}s requestAnimationFrame samples per location; sceneFrames counts actual renderer.render calls for the game scene; one-off sceneRender counts include shadow pass when present; not a GPU timer`, spots:samples };
writeFileSync(`../shots/note20-fps${fallback ? '-procedural' : '-blender'}${process.env.QUICK === '1' ? '-quick' : process.env.FORCE_RELOAD === '1' ? '-repeat' : ''}.json`, JSON.stringify(report, null, 2));
if (fallback) await send('Network.setBlockedURLs', { urls: [] });
ws.close();
