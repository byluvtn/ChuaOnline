// Diagnose the door-probe detour: why did findPath send the character 45m away for a 3.3m walk?
// Uses the game's own colliders + the shipped pathfind module, run inside the page via CDP.
// Runs on the PC: node tools/diag-pathfind.mjs
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
const ev = async (expression, ms = 15000) => {
  const r = await Promise.race([send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }), sleep(ms).then(() => ({ timeout: true }))]);
  if (r.timeout) return { __timeout: true };
  if (r.result?.exceptionDetails) return { __exc: (r.result.exceptionDetails.exception?.description || '').slice(0, 300) };
  return r.result?.result?.value;
};
await send('Runtime.enable');

const expr = `(() => {
  const out = {};
  const W = window.__co.world;
  out.colliderCount = W.colliders.length;
  const m = window.__co.me(); const p = m.char.root.position;
  out.curPos = { x: +p.x.toFixed(2), z: +p.z.toFixed(2) };
  return out;
})()`;
log('world:', JSON.stringify(await ev(expr)));

const diag = `await (async () => {
  const pf = await import('/shared/pathfind.ts');
  const W = window.__co.world;
  const P = pf.createPathfinder(W.colliders);
  const out = {};
  // 1. the door-probe segment: start (-29.58,-27.73) -> door (-30,-31)
  out.segStartToDoorClear = P.segmentClear(-29.58, -27.73, -30, -31);
  // find the collider closest to that segment (the blocker, if any)
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
  // 2. what path does findPath return for that walk?
  const path = P.findPath({ x: -29.58, z: -27.73 }, { x: -30, z: -31 });
  out.pathStartToDoor = path.map((q) => [ +q.x.toFixed(1), +q.z.toFixed(1) ]);
  out.lastFallback = P.lastFallback;
  // 3. route lengths for the slow legs (from the CURRENT position)
  const cur = { x: window.__co.me().char.root.position.x, z: window.__co.me().char.root.position.z };
  const legs = { amCoDoor: [56.25, -75], tangXaDoor: [-41, -68], phongCDDoor: [-42, 38.5], psPond: [41, -23.5] };
  out.routeLengthsFromCur = {};
  for (const [k, [tx, tz]] of Object.entries(legs)) {
    const pp = P.findPath(cur, { x: tx, z: tz });
    let len = 0; let prev = cur;
    for (const q of pp) { len += Math.hypot(q.x - prev.x, q.z - prev.z); prev = q; }
    out.routeLengthsFromCur[k] = { direct: +Math.hypot(tx - cur.x, tz - cur.z).toFixed(1), route: +len.toFixed(1), waypoints: pp.length, fallback: P.lastFallback };
  }
  return out;
})()`;
const res = await ev(diag, 20000);
log('DIAG:', JSON.stringify(res, null, 1));
log('DIAG_DONE');
ws.close();
process.exit(0);
