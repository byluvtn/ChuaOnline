// Run a step module (tools/steps-*.mjs) against the local dev server in headless Chrome.
// Usage: node tools/run-steps-pc.mjs <step-name-without-ext>
// Spawns headless Chrome with CDP 9222, opens http://127.0.0.1:5173/, waits for #enter,
// then calls the step's default export with { ev, send, sleep }.
// Geometry-only: do NOT set WALK_INPUT=1 (real click-to-walk timing in headless Chrome
// is an environment artifact, not a game signal).
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import WebSocket from 'ws';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const stepName = process.argv[2];
if (!stepName) { console.error('usage: node tools/run-steps-pc.mjs <step>'); process.exit(2); }

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!existsSync(CHROME)) { console.error('NO_CHROME_EXE'); process.exit(1); }

const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\Administrator\\co-chrome-steps',
  '--window-size=1280,800',
  'http://127.0.0.1:5173/',
], { stdio: 'ignore' });
log('chrome pid', chrome.pid);

let targets = null;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch('http://127.0.0.1:9222/json'); targets = await r.json(); if (targets.some((t) => t.type === 'page')) break; } catch {}
  await sleep(1000);
}
if (!targets || !targets.some((t) => t.type === 'page')) { log('NO_CDP_PAGE'); chrome.kill(); process.exit(1); }
const page = targets.find((t) => t.type === 'page');
log('page:', page.url);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); setTimeout(() => rej(new Error('ws timeout')), 15000); });
let id = 0; const pending = new Map();
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression, ms = 60000) => {
  const r = await Promise.race([send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }), sleep(ms).then(() => ({ timeout: true }))]);
  if (r.timeout) return { __timeout: true };
  if (r.result?.exceptionDetails) return { __error: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text };
  return r.result?.result?.value;
};
let enterOk = false;
for (let i = 0; i < 60; i++) {
  if (await ev(`!!document.getElementById('enter')`)) { enterOk = true; break; }
  await sleep(1000);
}
if (!enterOk) { log('NO_ENTER_BUTTON'); try { ws.close(); } catch {} chrome.kill(); process.exit(1); }
log('enter button present, running step', stepName);
try {
  const step = (await import(`./${stepName}.mjs`)).default;
  await step({ ev, send, sleep });
  log('STEP_DONE');
} catch (e) {
  log('STEP_FAIL', e?.message || e);
  process.exitCode = 1;
} finally {
  try { ws.close(); } catch {}
  chrome.kill();
  process.exit(process.exitCode ?? 0);
}
