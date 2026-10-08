// pages_test.js: the device matrix (site_test.js) against the build served by Cloudflare's local Pages
// runtime, so the Content Security Policy and the other headers in dist/_headers are in force during
// the test. Usage: node tools/pages_test.js [port=8790]
'use strict';
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const port = +(process.argv[2] || 8790);
const root = path.join(__dirname, '..');
const win = process.platform === 'win32';
const child = spawn(win ? 'npx.cmd' : 'npx', ['wrangler', 'pages', 'dev', 'dist', '--port', String(port), '--ip', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: win });
let log = '';
child.stdout.on('data', (d) => { log += d; });
child.stderr.on('data', (d) => { log += d; });
const base = `http://127.0.0.1:${port}/`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const stop = () => { child.kill(); if (win) spawn('taskkill', ['/F', '/T', '/PID', String(child.pid)], { stdio: 'ignore' }); };

(async () => {
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    await wait(1000);
    try { up = (await fetch(base + 'version.json')).ok; } catch (e) { /* not yet */ }
  }
  if (!up) { console.error('wrangler pages dev did not come up:\n' + log.slice(-2000)); stop(); process.exit(1); }
  const r = spawnSync(process.execPath, [path.join(__dirname, 'site_test.js'), 'dist', 'index.html', 'docs/site', 'v2-pages'],
    { cwd: root, stdio: 'inherit', env: { ...process.env, SITE_URL: base } });
  stop();
  process.exit(r.status === null ? 2 : r.status);
})().catch((e) => { console.error(e); stop(); process.exit(2); });
