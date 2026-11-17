import WebSocket from 'ws';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets = null;
for (let i = 0; i < 10; i++) {
  try { const r = await fetch('http://[::1]:9222/json'); targets = await r.json(); if (targets.some((t) => t.type === 'page')) break; } catch {}
  await sleep(1000);
}
const page = targets.find((t) => t.type === 'page');
console.log('page:', page.url);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); setTimeout(() => rej(new Error('ws timeout')), 10000); });
let id = 0; const pending = new Map();
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) return 'ERR: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
  return r.result?.result?.value;
};
console.log('title:', await ev(`document.title`));
console.log('readyState:', await ev(`document.readyState`));
console.log('enter:', await ev(`!!document.getElementById('enter')`));
console.log('buttons:', await ev(`Array.from(document.querySelectorAll('button')).map(b=>b.id||b.textContent.slice(0,20)).join('|')`));
console.log('canvas:', await ev(`!!document.querySelector('canvas')`));
console.log('__co:', await ev(`typeof window.__co`));
console.log('body:', JSON.stringify(await ev(`document.body ? document.body.innerText.slice(0,500) : 'NO_BODY'`)));
ws.close();
process.exit(0);
