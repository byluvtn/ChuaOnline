// Read-only CDP probe of the running headless Chrome (A2.3 verification).
// Finds the remote-debugging port, then reports page state. Never navigates.
import WebSocket from 'ws';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Find the debug port (parallel scan, short timeout each).
const found = await Promise.all(Array.from({ length: 500 }, (_, i) => 9300 + i).map(async (p) => {
  try {
    const r = await fetch(`http://localhost:${p}/json`, { signal: AbortSignal.timeout(400) });
    if (!r.ok) return null;
    const j = await r.json();
    return j.length ? { port: p, targets: j } : null;
  } catch { return null; }
})).then((arr) => arr.find(Boolean));
if (!found) { console.log('NO_CHROME_DEBUG_PORT'); process.exit(1); }
console.log('DEBUG_PORT', found.port);
const page = found.targets.find((t) => t.type === 'page' && (t.url || '').includes('5173'))
  || found.targets.find((t) => t.type === 'page');
if (!page) { console.log('NO_PAGE_TARGET', JSON.stringify(found.targets.map((t) => ({ type: t.type, url: t.url })))); process.exit(1); }
console.log('PAGE_URL', page.url);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); setTimeout(() => j(new Error('ws timeout')), 10000); });
let id = 0; const pending = new Map();
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const sendT = (method, params, ms = 15000) => Promise.race([
  send(method, params),
  sleep(ms).then(() => ({ timeout: true })),
]);
const ev = async (expr) => {
  const r = await sendT('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.timeout) return 'TIMEOUT(15s)';
  if (r.result?.exceptionDetails) return 'EXC: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text || '').slice(0, 300);
  return JSON.stringify(r.result?.result?.value);
};
console.log('title=', await ev('document.title'));
console.log('readyState=', await ev('document.readyState'));
console.log('hasEnter=', await ev(`!!document.getElementById('enter')`));
console.log('hasCo=', await ev(`!!window.__co`));
console.log('hasMe=', await ev(`!!(window.__co && window.__co.me())`));
console.log('bodyText=', await ev(`(document.body.innerText||'').slice(0,300)`));
console.log('coKeys=', await ev(`window.__co ? Object.keys(window.__co).slice(0,20).join(',') : 'n/a'`));
ws.close();
process.exit(0);
