// Follow-up probe: can the player walk up to the Bao Thap DOOR (south side, (-30,-31))?
// The main test's bao-thap leg targeted the pagoda CENTRE (-30,-38), which is inside the
// collider ring, so the new pathfind correctly stopped at the nearest node (8.04m out).
// This probe checks the door itself is reachable. Runs on the PC: node tools/probe-door.mjs
import WebSocket from 'ws';
import { writeFileSync } from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const targets = await (await fetch('http://localhost:9222/json')).json();
const pages = targets.filter((t) => t.type === 'page' && (t.url || '').includes('5173'));
if (!pages.length) { log('NO_GAME_PAGE'); process.exit(1); }
let ws = null;
for (const p of pages) {
  try {
    const w = new WebSocket(p.webSocketDebuggerUrl);
    await new Promise((r, j) => { w.on('open', r); w.on('error', j); setTimeout(() => j(new Error('ws timeout')), 10000); });
    let id = 0; const pending = new Map();
    w.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); w.send(JSON.stringify({ id: i, method, params })); });
    const r = await Promise.race([send('Runtime.evaluate', { expression: `!!(window.__co && window.__co.me())`, returnByValue: true }), sleep(5000).then(() => ({ timeout: true }))]);
    if (!r.timeout && r.result?.result?.value === true) { ws = w; log('in-world page:', p.url); break; }
    w.close();
  } catch (e) { log('page probe fail:', e.message); }
}
if (!ws) { log('NO_IN_WORLD_PAGE'); process.exit(1); }
let id = 0; const pending = new Map();
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression, ms = 8000) => {
  const r = await Promise.race([send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }), sleep(ms).then(() => ({ timeout: true }))]);
  if (r.timeout) return { __timeout: true };
  if (r.result?.exceptionDetails) return { __exc: (r.result.exceptionDetails.exception?.description || '').slice(0, 150) };
  return r.result?.result?.value;
};
await send('Runtime.enable'); await send('Page.enable');
const pos = async () => {
  const v = await ev(`(()=>{ const m = window.__co.me(); if (!m) return null; const r = m.char.root; return { x: +r.position.x.toFixed(2), z: +r.position.z.toFixed(2), anim: m.anim }; })()`);
  return v && !v.__timeout && !v.__exc ? v : null;
};
log('start pos:', JSON.stringify(await pos()));
const t0 = Date.now();
const r0 = await ev(`window.__co.walkTo(-30, -31)`, 15000);
log('walkTo call ms:', Date.now() - t0, 'timeout:', !!(r0 && r0.__timeout));
let lastPos = null, lastMove = Date.now(); const stalls = [];
const t1 = Date.now();
while (Date.now() - t1 < 30000) {
  const p = await pos();
  if (p) {
    const d = Math.hypot(p.x + 30, p.z + 31);
    if (d < 1.2) { log(`ARRIVED bao-thap-door dist=${d.toFixed(2)} t=${((Date.now() - t0) / 1000).toFixed(1)}s stalls=${stalls.length}`); break; }
    if (lastPos && Math.hypot(p.x - lastPos.x, p.z - lastPos.z) < 0.05) {
      if (Date.now() - lastMove > 2000) { stalls.push(`${((Date.now() - t0) / 1000).toFixed(0)}s@(${p.x},${p.z})`); lastMove = Date.now(); }
    } else lastMove = Date.now();
    lastPos = p;
  } else { stalls.push(`${((Date.now() - t0) / 1000).toFixed(0)}s:EVAL_TIMEOUT`); lastMove = Date.now(); }
  await sleep(1000);
}
const p = await pos();
log('final pos:', JSON.stringify(p), 'dist to door:', p ? Math.hypot(p.x + 30, p.z + 31).toFixed(2) : '?', 'stalls:', JSON.stringify(stalls));
try {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  if (r.result?.data) { writeFileSync('E:/Code/ChuaOnline-main/shots/phone-test2-bao-thap-door.png', Buffer.from(r.result.data, 'base64')); log('shot bao-thap-door'); }
} catch (e) { log('shot ERR', e.message); }
log('PROBE_DONE');
ws.close();
process.exit(0);
