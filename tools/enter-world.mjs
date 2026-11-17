// One-shot: ensure the game is in-world on the phone (click #enter if on the char screen),
// then verify the served code is the NEW build (news 17) and report the start position.
// Runs on the PC: node tools/enter-world.mjs
import WebSocket from 'ws';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

let targets = null;
for (let i = 0; i < 10; i++) {
  try { targets = await (await fetch('http://localhost:9222/json')).json(); break; }
  catch (e) { await sleep(3000); }
}
if (!targets) { log('NO_CDP'); process.exit(1); }
const pages = targets.filter((t) => t.type === 'page' && (t.url || '').includes('5173'));
log('game pages:', pages.length, pages.map((p) => p.url));
if (!pages.length) { log('NO_GAME_PAGE'); process.exit(1); }

const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); setTimeout(() => j(new Error('ws timeout')), 10000); });
let id = 0; const pending = new Map();
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression, ms = 8000) => {
  const r = await Promise.race([send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }), sleep(ms).then(() => ({ timeout: true }))]);
  if (r.timeout) return { __timeout: true };
  if (r.result?.exceptionDetails) return { __exc: (r.result.exceptionDetails.exception?.description || '').slice(0, 150) };
  return r.result?.result?.value;
};
await send('Runtime.enable');

const state = async () => ({
  enterBtn: await ev(`!!document.getElementById('enter')`),
  inWorld: await ev(`!!(window.__co && window.__co.me())`),
  hasCo: await ev(`!!window.__co`),
});
log('state:', JSON.stringify(await state()));
const st = await state();
if (st.enterBtn === true && st.inWorld !== true) {
  log('clicking #enter ...');
  await ev(`document.getElementById('enter').click()`);
  await sleep(8000);
  log('state after enter:', JSON.stringify(await state()));
}
const pos = await ev(`(()=>{ const m = window.__co && window.__co.me(); if (!m) return null; const r = m.char.root; return { x: +r.position.x.toFixed(2), z: +r.position.z.toFixed(2), anim: m.anim }; })()`);
log('pos:', JSON.stringify(pos));
const news17 = await ev(`fetch('/src/data/news.ts').then(r=>r.text()).then(t=>t.includes('LATEST_NEWS_ID = 17'))`, 12000);
log('served news.ts has LATEST_NEWS_ID = 17:', JSON.stringify(news17));
const pathfind = await ev(`fetch('/src/main.ts').then(r=>r.text()).then(t=>t.includes('pathfind'))`, 12000);
log('served main.ts imports pathfind:', JSON.stringify(pathfind));
const inWorld = await ev(`!!(window.__co && window.__co.me())`);
log(inWorld === true ? 'IN_WORLD_OK' : 'NOT_IN_WORLD');
ws.close();
process.exit(inWorld === true ? 0 : 1);
