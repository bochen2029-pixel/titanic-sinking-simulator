// pages_check.js: run the built site under Cloudflare's local Pages runtime (wrangler pages dev) and
// report the response headers it applies from dist/_headers, plus the 404 page. Needs the wrangler
// dev dependency; no account or login is involved.
// Usage: node tools/pages_check.js [port=8788]
'use strict';
const { spawn } = require('child_process');
const path = require('path');

const port = +(process.argv[2] || 8788);
const root = path.join(__dirname, '..');
const wrangler = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(wrangler, ['wrangler', 'pages', 'dev', 'dist', '--port', String(port), '--ip', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
let log = '';
child.stdout.on('data', (d) => { log += d; });
child.stderr.on('data', (d) => { log += d; });

const base = `http://127.0.0.1:${port}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    await wait(1000);
    try { const r = await fetch(base + '/version.json'); up = r.ok; } catch (e) { /* not yet */ }
  }
  if (!up) { console.error('wrangler pages dev did not come up:\n' + log.slice(-2000)); child.kill(); process.exit(1); }
  const show = ['content-type', 'cache-control', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy'];
  const v = await (await fetch(base + '/version.json')).json();
  for (const p of ['/', '/index.html', `/assets/${v.app}`, `/assets/${v.styles}`, '/fonts/ibm-plex-mono-latin-500-normal.woff2', '/icons/icon-192.png', '/manifest.webmanifest', '/no-such-page']) {
    const r = await fetch(base + p);
    const h = show.filter((k) => r.headers.get(k)).map((k) => `${k}: ${r.headers.get(k)}`).join(' | ');
    console.log(`${String(r.status).padEnd(4)} ${p.padEnd(44)} ${h}`);
  }
  child.kill();
  // on Windows the shell wrapper may leave workerd alive; make sure the port is released
  if (process.platform === 'win32') spawn('taskkill', ['/F', '/T', '/PID', String(child.pid)], { stdio: 'ignore' });
  process.exit(0);
})().catch((e) => { console.error(e); child.kill(); process.exit(2); });
