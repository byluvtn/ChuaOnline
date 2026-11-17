// Diag v2: (a) pathfind route for the pagoda-door walk, (b) does walkTo(-30,-31) actually
// move the character now? (v1 died: top-level `await` is not valid in Runtime.evaluate.)
import WebSocket from 'ws';
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
const ev = async (expression, ms = 20000) => {
  const r = await Promise.race([send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }), sleep(ms).then(() => ({ timeout: true }))]);
  if (r.timeout) return { __timeout: true };
  if (r.result?.exceptionDetails) return { __exc: (r.result.exceptionDetails.exception?.description || '').slice(0, 400) };
  return r.result?.result?.value;
};
await send('Runtime.enable');

const posExpr = `(()=>{ const m = window.__co.me(); if (!m) return null; const r = m.char.root; return { x: +r.position.x.toFixed(2), z: +r.position.z.toFixed(2), anim: m.anim }; })()`;
log('curPos:', JSON.stringify(await ev(posExpr)));

// (a) pathfind diagnosis — wrapped as an async IIFE returned as a promise (no top-level await)
const diag = `(async () => {
  const pf = await import('/shared/pathfind.ts');
  const W = window.__co.world;
  const P = pf.createPathfinder(W.colliders);
  const out = { colliders: W.colliders.length };
  out.segStartToDoorClear = P.segmentClear(-29.58, -27.73, -30, -31);
  const seg = { ax: -29.58, az: -27.73, bx: -30, bz: -31 };
  const dx = seg.bx - seg.ax, dz = seg.bz - seg.az, len2 = dx * dx + dz * dz;
  const near = [];
  for (const c of W.colliders) {
    const t = len2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((c.x - seg.ax) * dx + (c.z - seg.az) * dz) / len2));
    const px = seg.ax + dx * t, pz = seg.az + dz * t;
    const d = Math.hypot(c.x - px, c.z - pz);
    if (d < c.r + 0.55 + 1.5) near.push({ x: c.x, z: c.z, r: c.r, dToSeg: +d.toFixed(2) });
  }
  out.blockersNearSeg = near.sort((a, b) => a.dToSeg - b.dToSeg).slice(0, 6);
  const path = P.findPath({ x: -29.58, z: -27.73 }, { x: -30, z: -31 });
  out.pathStartToDoor = path.map((q) => [+q.x.toFixed(1), +q.z.toFixed(1)]);
  out.lastFallback = P.lastFallback;
  // how long is the route from the CURRENT stuck point to the door?
  const cur = { x: window.__co.me().char.root.position.x, z: window.__co.me().char.root.position.z };
  const pp = P.findPath(cur, { x: -30, z: -31 });
  let len = 0; let prev = cur;
  for (const q of pp) { len += Math.hypot(q.x - prev.x, q.z - prev.z); prev = q; }
  out.fromCurToDoor = { direct: +Math.hypot(-30 - cur.x, -31 - cur.z).toFixed(1), route: +len.toFixed(1), waypoints: pp.length, fallback: P.lastFallback, path: pp.map((q) => [+q.x.toFixed(1), +q.z.toFixed(1)]) };
  return out;
})()`;
log('DIAG:', JSON.stringify(await ev(diag), null, 1));

// (b) does walkTo(-30,-31) work now? call it, capture any throw, watch the character 12s
const wt = await ev(`(() => { try { window.__co.walkTo(-30, -31); return { ok: true }; } catch (e) { return { ok: false, err: String(e && e.message || e).slice(0, 200) }; } })()`);
log('walkTo(-30,-31) result:', JSON.stringify(wt));
for (let i = 0; i < 12; i++) {
  await sleep(1000);
  log('t+' + (i + 1) + 's pos:', JSON.stringify(await ev(posExpr)));
}
log('DIAG2_DONE');
ws.close();
process.exit(0);
