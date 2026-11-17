// Phone acceptance test #2 (feedback package, commit 7715556, news 17)
// Runs on the PC: node tools/phone-test2.mjs > C:\Users\Administrator\phone-test2.log 2>&1
// Re-grounded at 7715556: Tam The (0,-62), Bao Thap (-30,-38). Old targets (0,-54)/(-17,-52) STALE.
// Adds: PS pond koi leg, #couplet board measurement after every leg, cushion-distance check on sit.
// Sections: (0) FPS + build proof, (1) freeze repro north, (2) 7 houses, (2b) PS pond, (3) sit test.
import WebSocket from 'ws';
import { writeFileSync, mkdirSync } from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
mkdirSync('E:/Code/ChuaOnline-main/shots', { recursive: true });

// Thien-duong cushion world coords at 7715556 (twd(lx,lz), THIEN_DUONG (-47,-27)):
// local lx {-1.2,1.2} x lz {-3.4,-1.9,-0.4,1.1,2.6} -> x=-47+lz, z=-27-lx
const CUSHIONS = [];
for (const lx of [-1.2, 1.2]) for (const lz of [-3.4, -1.9, -0.4, 1.1, 2.6]) CUSHIONS.push([-47 + lz, -27 - lx]);

// ---- connect to the in-world game page ----
const targets = await (await fetch('http://localhost:9222/json')).json();
const pages = targets.filter((t) => t.type === 'page' && (t.url || '').includes('5173'));
if (!pages.length) { log('NO_GAME_PAGE'); process.exit(1); }
log('game pages:', pages.length);

const connect = async (t) => {
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); setTimeout(() => j(new Error('ws timeout')), 10000); });
  return ws;
};
let ws = null;
for (const p of pages) {
  try {
    const w = await connect(p);
    let id = 0; const pending = new Map();
    w.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); w.send(JSON.stringify({ id: i, method, params })); });
    const r = await Promise.race([
      send('Runtime.evaluate', { expression: `!!(window.__co && window.__co.me())`, returnByValue: true }),
      sleep(5000).then(() => ({ timeout: true })),
    ]);
    if (!r.timeout && r.result?.result?.value === true) { ws = w; log('in-world page:', p.url); break; }
    w.close();
  } catch (e) { log('page probe fail:', e.message); }
}
if (!ws) { log('NO_IN_WORLD_PAGE'); process.exit(1); }

let id = 0; const pending = new Map();
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sendT = (method, params, ms = 8000) => Promise.race([send(method, params), sleep(ms).then(() => ({ timeout: true }))]);
const ev = async (expression, ms = 8000) => {
  const r = await sendT('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, ms);
  if (r.timeout) return { __timeout: true };
  if (r.result?.exceptionDetails) return { __exc: (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text || '').slice(0, 200) };
  return r.result?.result?.value;
};
await send('Runtime.enable'); await send('Page.enable');
const pos = async () => {
  const v = await ev(`(()=>{ const m = window.__co.me(); if (!m) return null; const r = m.char.root; return { x: +r.position.x.toFixed(2), z: +r.position.z.toFixed(2), anim: m.anim }; })()`);
  return v && !v.__timeout && !v.__exc ? v : null;
};
const shot = async (name) => {
  try {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    if (r.result?.data) { writeFileSync(`E:/Code/ChuaOnline-main/shots/phone-test2-${name}.png`, Buffer.from(r.result.data, 'base64')); log('shot', name); }
    else log('shot FAIL', name);
  } catch (e) { log('shot ERR', name, e.message); }
};
// #couplet board measurement (house-info board): width in CSS px vs viewport
const board = async (label) => {
  const v = await ev(`(()=>{ const el = document.getElementById('couplet'); if (!el) return 'NO_COUPLET'; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const x = el.querySelector('.cclose'); const xr = x ? x.getBoundingClientRect() : null; return { show: el.classList.contains('show'), w: +r.width.toFixed(1), h: +r.height.toFixed(1), vw: window.innerWidth, xBtn: xr ? +xr.width.toFixed(1) : null, text: (el.textContent || '').slice(0, 60) }; })()`);
  log(`BOARD ${label}:`, JSON.stringify(v));
  return v;
};

// ---- walkTo with 1s polling: returns ok/dist/stalls; a stall is >2s no-move or an eval timeout ----
async function walkTo(x, z, budgetMs, label) {
  const t0 = Date.now();
  const r0 = await ev(`window.__co.walkTo(${x}, ${z})`, 15000);
  const callMs = Date.now() - t0;
  const stalls = [];
  let lastPos = null, lastMove = Date.now();
  const t1 = Date.now();
  while (Date.now() - t1 < budgetMs) {
    const p = await pos();
    if (p) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < 1.2) { log(`ARRIVED ${label} dist=${d.toFixed(2)} t=${((Date.now() - t0) / 1000).toFixed(1)}s call=${callMs}ms stalls=${stalls.length}`); return { ok: true, dist: d, stalls }; }
      if (lastPos && Math.hypot(p.x - lastPos.x, p.z - lastPos.z) < 0.05) {
        if (Date.now() - lastMove > 2000) { stalls.push(`${((Date.now() - t0) / 1000).toFixed(0)}s@(${p.x},${p.z})`); lastMove = Date.now(); }
      } else lastMove = Date.now();
      lastPos = p;
    } else {
      stalls.push(`${((Date.now() - t0) / 1000).toFixed(0)}s:EVAL_TIMEOUT`);
      lastMove = Date.now();
    }
    await sleep(1000);
  }
  const p = await pos();
  const d = p ? Math.hypot(p.x - x, p.z - z) : null;
  log(`TIMEOUT ${label} dist=${d === null ? '?' : d.toFixed(2)} call=${callMs}ms stalls=[${stalls.join(', ')}]${r0 && r0.__timeout ? ' WALKTO_CALL_TIMEOUT' : ''}`);
  return { ok: false, dist: d, stalls };
}

try {
  log('start pos:', JSON.stringify(await pos()));
  // (0) build proof + baseline FPS over 3s
  log('served news.ts has LATEST_NEWS_ID = 17:', JSON.stringify(await ev(`fetch('/src/data/news.ts').then(r=>r.text()).then(t=>t.includes('LATEST_NEWS_ID = 17'))`, 12000)));
  log('served main.ts imports pathfind:', JSON.stringify(await ev(`fetch('/src/main.ts').then(r=>r.text()).then(t=>t.includes('pathfind'))`, 12000)));
  log('viewport:', JSON.stringify(await ev(`({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio })`)));
  const fps = await ev(`new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(+(n / ((performance.now() - t0) / 1000)).toFixed(1)); }; requestAnimationFrame(tick); })`, 12000);
  log('baseline FPS:', JSON.stringify(fps));

  // (1) freeze repro: north journey (NEW targets at 7715556)
  log('--- FREEZE REPRO (north, new layout) ---');
  await walkTo(0, -62, 40000, 'dien-tam-the');
  await shot('tam-the');
  await board('tam-the');
  await walkTo(-30, -38, 30000, 'bao-thap');
  await shot('bao-thap');
  await board('bao-thap');
  await walkTo(53, -75, 40000, 'am-co-approach');
  await shot('am-co-outside');

  // (2) walk into all 7 houses (door then interior; order minimizes travel from Am Co)
  log('--- HOUSE WALKS ---');
  const houses = [
    { name: 'am-co', door: [56.25, -75], main: [53, -75] },
    { name: 'nha-to', door: [36, -64.75], main: [36, -68] },
    { name: 'tang-xa', door: [-41, -68], main: [-41, -71] },
    { name: 'trai-duong', door: [-29, -58.25], main: [-29, -61] },
    { name: 'nha-khach', door: [-47, -57.75], main: [-47, -61] },
    { name: 'thien-duong', door: [-40.5, -27], main: [-47, -27] },
    { name: 'phong-cong-duc', door: [-42, 38.5], main: [-42, 35] },
  ];
  for (const h of houses) {
    const dz = h.name === 'thien-duong' ? 0 : 1.2;
    await walkTo(h.door[0], h.door[1] + dz, 30000, `${h.name}-door`);
    const r = await walkTo(h.main[0], h.main[1], 20000, `${h.name}-inside`);
    log(`house ${h.name}: ${r.ok ? 'REACHED' : 'FAILED'} dist=${r.dist === null ? '?' : r.dist.toFixed(2)} stalls=${r.stalls.length}`);
    await shot(`house-${h.name}`);
    await board(`house-${h.name}`);
  }

  // (2b) PS pond koi: south shore, then the pier
  log('--- PS POND KOI ---');
  const ps = await walkTo(41, -23.5, 30000, 'ps-pond-shore');
  log(`ps pond shore: ${ps.ok ? 'REACHED' : 'FAILED'} dist=${ps.dist === null ? '?' : ps.dist.toFixed(2)} stalls=${ps.stalls.length}`);
  await shot('ps-pond');
  const ps2 = await walkTo(30, -31, 20000, 'ps-pier');
  log(`ps pier: ${ps2.ok ? 'REACHED' : 'FAILED'} dist=${ps2.dist === null ? '?' : ps2.dist.toFixed(2)} stalls=${ps2.stalls.length}`);
  await shot('ps-pond-pier');

  // (3) sit test at thien-duong cushions (sitBtn click, NOT co.sit which does not exist)
  log('--- SIT TEST ---');
  await walkTo(-49, -26, 30000, 'cushion-approach');
  log('sitBtn present:', JSON.stringify(await ev(`!!document.getElementById('sitBtn')`)));
  const before = await pos();
  await ev(`document.getElementById('sitBtn').click()`);
  await sleep(3000);
  const after = await pos();
  log('sit before:', JSON.stringify(before), 'after:', JSON.stringify(after));
  if (after && after.x !== undefined) {
    const dmin = Math.min(...CUSHIONS.map(([cx, cz]) => Math.hypot(after.x - cx, after.z - cz)));
    log(`sit cushion check: nearest cushion dist=${dmin.toFixed(2)} ${dmin < 0.6 ? 'ON_CUSHION' : 'NOT_ON_CUSHION'}`);
  }
  await shot('sit');

  log('PHONE_TEST_DONE');
} catch (e) {
  log('FATAL', e.message);
  process.exit(1);
}
ws.close();
process.exit(0);
