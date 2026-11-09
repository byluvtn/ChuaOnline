// Dev tool: headless Chrome screenshots of the running game via CDP.
// usage: node tools/shot.mjs <outPrefix> [url] [width] [height] [mobile]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import WebSocket from 'ws';

const [prefix = '/tmp/shots/s', url = 'http://localhost:5173/', W = '1280', H = '800', mobile = ''] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const CHROME = process.env.CHROME ?? (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'co-chrome-'))}`,
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-first-run', `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://localhost:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.on('open', r));
let id = 0; const pending = new Map(); const logs = [];
ws.on('message', (m) => {
  const d = JSON.parse(m);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Runtime.consoleAPICalled') logs.push(d.params.type + ': ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
  if (d.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + (d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: !!mobile });
if (mobile) await send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }] });
await send('Page.navigate', { url });
await sleep(2500);
const shot = async (name) => {
  let r = await send('Page.captureScreenshot', { format: 'png' });
  for (let i = 0; i < 5 && !r.result; i++) { await sleep(800); r = await send('Page.captureScreenshot', { format: 'png' }); }
  writeFileSync(`${prefix}-${name}.png`, Buffer.from(r.result.data, 'base64'));
  console.log('saved', `${prefix}-${name}.png`);
};
mkdirSync(dirname(prefix), { recursive: true });
// steps from stdin-less script file: tools/steps.mjs exports async (ctx)
const steps = (await import(process.env.STEPS ?? './steps-default.mjs')).default;
await steps({ ev, shot, sleep, send });
console.log(logs.filter((l) => /^(error|EXC|warning)/.test(l)).slice(0, 15).join('\n') || 'no console errors');
ws.close(); chrome.kill();
process.exit(0);
