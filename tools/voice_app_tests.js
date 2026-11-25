// The men's voices by Deepgram, the app's side (app/voice.js), headless, in seconds, with no Electron, no key and no
// network: stand-ins for ipcMain and for the system's key store (its asynchronous calls, as Electron 45 has them, and the
// synchronous ones), and a Deepgram on this PC (tools/fake_deepgram.js).
//   node tools/voice_app_tests.js
// docs/DESIGN_spoken_bridge_v1_2026-11-23.md, section 7 ("A voice"). Every row is a MUST unless it says CHECK:
//   1. the voices' table; off by default, at Deepgram's own address; the settings, each field checked, a refused patch
//      changing nothing; a file edited by hand checked as if typed
//   2. the key: kept encrypted by the ASYNCHRONOUS store (the synchronous calls left alone while it is there), never in
//      the clear in the file, never in an answer; read again when the app starts again, the window's calls waiting for
//      it; sealed again when the store asks; the synchronous store only where the asynchronous one is absent; a PC that
//      cannot protect a key keeps it for the run only; under another user's store there is no key; "Forget" (also once
//      the opening of the key kept has begun; with the settings unwritable, said so); a store that will not seal (kept for
//      the run only, and said so) or that comes to be after the start (asked again at Save)
//   3. off, no key: an answer, and no request made
//   4. a line: one request, to the one host, POST /v2/speak with the exact query, the key in the Authorization header and
//      nowhere else, the text as the body; the WAV back as it was sent
//   5. each man to his voice; an unknown man (or one named as a model) to the default; the page names no model, no host
//   6. Deepgram's errors, each to its kind; an answer that is not a WAV, or is too large, refused; the key struck out
//   7. a Deepgram that never answers: timeout, within its bound; two at once and no more; the run's limit of characters
//   8. one host: the guard; a redirect not followed; a stand-in not on this PC refused
//   9. "Try it": GET /v1/auth/token with the key in its header; a refused key
//  10. the player's own word: the switch going on and a higher limit asked of him; nothing passes behind a question
//  11. the window's calls and no other; a call from anywhere else is refused; a request of the wrong shape is refused
// The ears (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 5), against the stand-in's /v1/listen socket:
//  12. off by default and at every start, whatever the file says; the key terms; the socket: the one host, the query
//      (mip_opt_out=true among it: the player's voice is not kept to improve Deepgram's models; the men's lines carry
//      none), no encoding and no sample rate, the key as the subprotocol and nowhere in the address or the handshake
//  13. a transmission: the sound queued before the socket opens, bounded, sent in order; the words heard, as they come
//      and at the end; FINAL WORDS ONLY: finish's ends (Metadata, a close 1000: the final words; its bound, counted from
//      the CloseStream itself, or a stream ending with words still interim, by its Metadata or by a close 1000 alone:
//      "unsure", the words carried as not final)
//  14. its faults: a refused key, a dropped socket, a socket that never opens, sound Deepgram cannot read; one at a
//      time; the 30 s bound and the run's limit, which CUT a transmission held past them ("cut", nothing given), the bound
//      kept while the last words are awaited ("unsure"); words
//      never asked for let go; cancel, the ears off, the key forgotten, the page gone; a socket given up while it
//      connects closed on its own opening; the settings unwritable and the transmission closed all the same; the
//      review's mutations that no row held (sound while finishing, the open bound alone, a key that is not a token)
//  15. off, no key, the run's limit in seconds; the shape of every call
//  16. the player's own word for the ears; the microphone's rule (main.js's two permission handlers); the socket's guard
//  17. the key struck out of what Deepgram says, whole and in part (a close's own reason too); a message past 64 kB
//      not read; the words in no file; every timer cleared
//  18. nothing is printed, the key is in no answer and no message to the page, and no DEEPGRAM_* variable is read
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');

// The environment, watched from here on (row 12): no DEEPGRAM_* variable may be read. Markers are put there first, so
// that a read which found one and used it would also carry it to the stand-in, where row 12 looks for it too
const envReads = [], realEnv = process.env;
realEnv.DEEPGRAM_API_KEY = 'env-key-that-must-not-be-used'; realEnv.DEEPGRAM_ACCESS_TOKEN = 'env-token-that-must-not-be-used';
const watched = (k) => typeof k === 'string' && /^DEEPGRAM/i.test(k);
process.env = new Proxy(realEnv, {
  get(t, k) { if (watched(k)) envReads.push('read ' + k); return t[k]; },
  has(t, k) { if (watched(k)) envReads.push('asked for ' + k); return k in t; },
});

const V = require('../app/voice.js');
const M = require('../app/minds.js');
const Fake = require('./fake_deepgram.js');
const rows = []; let fails = 0;
const out = (s) => process.stdout.write(s + '\n');           // the suite's own lines: console.* is watched (row 12)
function row(what, value, ref, ok, check) { rows.push(ok); if (!ok && !check) fails++; out((ok ? 'PASS ' : (check ? 'CHECK ' : 'FAIL ')) + what.padEnd(96) + ' ' + String(value).padEnd(52) + ' ' + ref); }
const printed = [];
for (const k of ['log', 'info', 'warn', 'error', 'debug', 'trace']) console[k] = (...a) => { printed.push(k + ': ' + a.map(String).join(' ')); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clip = (s, n) => (s.length > n ? s.slice(0, n - 3) + '...' : s);

// a key that is plainly not one (the stand-in's own), and stand-ins for the system's key store whose output does not hold
// its input. o: { on (true), syncOn (as on), async (true: the asynchronous calls are there), sync (true), delay (ms before
// a key is opened), rotate (the store asks for the key to be sealed again, once), foreign (it opens nothing: another
// user's store), failSeal (it says it can protect, and then will not seal), gate ({ open }: both its calls say they
// cannot protect until gate.open is set: a store that comes to be after the start) }. calls: how many times each call was made
const KEY = Fake.KEY;
const seal = (s, ver) => Buffer.from('enc' + ver + ':' + Buffer.from(s, 'utf8').toString('hex').split('').reverse().join(''), 'utf8');
const unseal = (b) => { const m = /^enc(\d+):([0-9a-f]*)$/.exec(Buffer.from(b).toString('utf8')); if (!m) throw new Error('not this store\'s'); return Buffer.from(m[2].split('').reverse().join(''), 'hex').toString('utf8'); };
function mkSafe(o) {
  o = Object.assign({ on: true, async: true, sync: true, delay: 0, rotate: false, foreign: false, failSeal: false, gate: null }, o || {});
  const syncOn = o.syncOn === undefined ? o.on : o.syncOn, open = () => !o.gate || o.gate.open === true;
  const s = { calls: { isAsync: 0, encAsync: 0, decAsync: 0, isSync: 0, encSync: 0, decSync: 0 }, ver: 1 };
  if (o.async) {
    s.isAsyncEncryptionAvailable = () => { s.calls.isAsync++; return Promise.resolve(o.on && open()); };
    s.encryptStringAsync = (t) => { s.calls.encAsync++; if (o.failSeal) return Promise.reject(new Error('the store would not')); return new Promise((res) => setTimeout(() => res(seal(t, s.ver)), o.sealDelay || 0)); };
    s.decryptStringAsync = (b) => { s.calls.decAsync++; return new Promise((res, rej) => setTimeout(() => {
      try { if (o.foreign) throw new Error('another user\'s'); const r = { result: unseal(b), shouldReEncrypt: o.rotate === true }; if (o.rotate) { s.ver++; o.rotate = false; } res(r); } catch (e) { rej(e); }
    }, o.delay)); };
  }
  if (o.sync) {
    s.isEncryptionAvailable = () => { s.calls.isSync++; return syncOn && open(); };
    s.encryptString = (t) => { s.calls.encSync++; if (o.failSeal) throw new Error('the store would not'); return seal(t, s.ver); };
    s.decryptString = (b) => { s.calls.decSync++; if (o.foreign) throw new Error('another user\'s'); return unseal(b); };
  }
  return s;
}
const mkIpc = () => ({ handlers: {}, listeners: {}, handle(name, fn) { this.handlers[name] = fn; }, on(name, fn) { this.listeners[name] = fn; } });
// the ears: every 'voice:heard' message any of them sent (row 18 searches them for the key), every socket they opened
// (through a WebSocket that is Node's own, watched), and a little made-up sound
const toPage = [];
const sendTo = (list) => (ch, ...a) => { list.push([ch].concat(a)); toPage.push(JSON.stringify([ch].concat(a))); };
const opened = [];
class Watched extends WebSocket { constructor(url, protocols) { opened.push({ url: String(url), protocols: Array.isArray(protocols) ? protocols.slice() : protocols }); super(url, protocols); } }
const SOUND = (n, v) => new Uint8Array(n).fill(v === undefined ? 7 : v).buffer;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (f, ms) => { const t0 = Date.now(); while (!f() && Date.now() - t0 < (ms || 3000)) await sleep(5); return !!f(); };
// a run's ears, switched on, with the key kept: short bounds unless told (a test's may only be shorter than the app's)
const SHORT = { openMs: 400, finishMs: 400, maxMs: 1500, keepMs: 600 };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-voice-'));
const dirOf = (name) => { const d = path.join(tmp, name); fs.mkdirSync(d, { recursive: true }); return d; };
const fileOf = (d) => path.join(d, 'voice.json');
const readFile = (d) => (fs.existsSync(fileOf(d)) ? fs.readFileSync(fileOf(d), 'utf8') : '');
const answers = [];                                          // every answer the app's side gave, to search for the key
const keep = (x) => { answers.push(JSON.stringify(x)); return x; };
const LINE = { who: 'Mr Murdoch', text: 'Hard a-starboard, sir.' };

(async () => {
  const fake = await Fake.start();
  const mk = (name, o) => V.create(Object.assign({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dirOf(name), isOwn: () => true, base: fake.base }, o || {}));
  try {
    // ---------------------------------------------------------------- 1. the table, the defaults, the settings
    out('1. the voices, the defaults and the settings');
    {
      const BRIT = ['flux-kit-en', 'flux-colin-en', 'flux-sean-en', 'flux-conor-en', 'flux-jack-en', 'flux-rufus-en', 'flux-tanner-en'];
      const C = V.CAST, men = Object.keys(C), theirs = men.map(k => C[k]);
      const want = { 'Captain Smith': 'flux-sean-en', 'Mr Murdoch': 'flux-conor-en', 'Mr Boxhall': 'flux-jack-en', 'Mr Moody': 'flux-kit-en', 'Quartermaster Hichens': 'flux-rufus-en', 'Mr Andrews': 'flux-colin-en', 'Mr Bell': 'flux-tanner-en' };
      const P = V.POSTS, posts = ['The officer of the watch', 'The quartermaster', 'The officer at the telegraph', 'The junior officer', 'The fourth officer'];
      row('each man of the cast has one of Flux\'s seven British men\'s voices, his own (the research note\'s casting); the order line\'s officer of the watch speaks in Mr Murdoch\'s, its quartermaster in Hichens\'s',
        men.map(k => k.replace(/^(Mr|Captain|Quartermaster) /, '') + ' ' + C[k].replace(/^flux-|-en$/g, '')).join(', '), 'seven, each his own; posts as their men',
        same(C, want) && new Set(theirs).size === 7 && theirs.every(x => BRIT.includes(x)) && posts.every(p => BRIT.includes(P[p])) && Object.keys(P).length === posts.length
        && P['The officer of the watch'] === C['Mr Murdoch'] && P['The quartermaster'] === C['Quartermaster Hichens'] && P['The fourth officer'] === C['Mr Boxhall'] && P['The junior officer'] === C['Mr Moody']
        && BRIT.includes(V.DEFAULT_VOICE) && Object.isFrozen(V.VOICES) && Object.isFrozen(V.CAST));
    }
    const dir = dirOf('a'), ipc = mkIpc(), safe = mkSafe();
    let own = true;
    const v = V.create({ ipcMain: ipc, safeStorage: safe, dir, isOwn: () => own, base: fake.base });
    await v.ready;
    {
      const s = keep(v.status()), real = V.create({}).status();
      row('off by default: the switch off, no key, nothing called, no file written until something is set; the address is Deepgram\'s own unless a stand-in on this PC is given',
        `on ${s.on}, key ${s.hasKey}, ${s.used.chars} characters, ${s.hosts.length} hosts, file ${fs.existsSync(fileOf(dir))}; ${real.origin}; ${V.DEFAULTS.limits.chars} characters, ${V.DEFAULTS.timeoutMs / 1000} s`,
        `off, no key, 0, 0, no file; ${V.BASE}; 40000, 15 s`,
        s.ok && s.on === false && s.hasKey === false && s.used.chars === 0 && s.used.lines === 0 && s.hosts.length === 0 && !fs.existsSync(fileOf(dir)) && s.origin === fake.origin
        && real.origin === 'https://api.deepgram.com' && V.BASE === 'https://api.deepgram.com' && V.DEFAULTS.limits.chars === 40000 && V.DEFAULTS.timeoutMs === 15000 && s.limits.chars === 40000);
      const before = JSON.stringify(v.status());
      const BAD = [{ on: 'yes' }, { on: 1 }, { limits: { chars: 0 } }, { limits: { chars: 999 } }, { limits: { chars: 400001 } }, { limits: { chars: 1500.5 } }, { limits: { other: 1 } }, { limits: [] }, { limits: null },
        { timeoutMs: 10 }, { timeoutMs: 1500.5 }, { timeoutMs: 60001 }, { key: KEY }, { base: 'https://example.com' }, { model: 'aura-2-thalia-en' }, { voice: 'flux-kit-en' }, { nonsense: 1 },
        { on: true, limits: { chars: 0 } }, null, 'x', [], 7];
      const wrong = BAD.filter(p => { const r = keep(v.set(p)); return !(r.ok === false && r.kind === 'shape' && typeof r.why === 'string' && r.why) || JSON.stringify(v.status()) !== before; });
      row('a patch with any field wrong is refused whole, with a reason, and changes nothing (the key, a model, a voice and an address are not settings)', wrong.length ? clip(JSON.stringify(wrong), 60) : BAD.length + ' patches refused', 'each refused; the settings as before', wrong.length === 0 && !fs.existsSync(fileOf(dir)));
      const s2 = keep(v.set({ timeoutMs: 1000, limits: { chars: 5000 } })), f = JSON.parse(readFile(dir));
      row('a good patch is taken and kept in the settings folder', `${s2.timeoutMs} ms, ${s2.limits.chars} characters; file v ${f.v}, on ${f.on}, ${f.limits.chars}, key ${f.key === undefined ? 'none' : 'KEPT'}`, '1000, 5000; v 1, off, 5000, none',
        s2.ok && s2.timeoutMs === 1000 && s2.limits.chars === 5000 && f.v === 1 && f.on === false && f.timeoutMs === 1000 && f.limits.chars === 5000 && f.key === undefined);
      // a file edited by hand: each field checked as if typed, a bad one keeping its default; another version ignored whole
      const dh = dirOf('hand'), dv = dirOf('v2');
      fs.writeFileSync(fileOf(dh), JSON.stringify({ v: 1, on: 'yes', timeoutMs: 2500, limits: { chars: 1e12 }, key: 'not a sealed key!' }));
      fs.writeFileSync(fileOf(dv), JSON.stringify({ v: 2, on: true, timeoutMs: 2500 }));
      const h = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dh, base: fake.base }), h2 = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dv, base: fake.base });
      await h.ready; await h2.ready;
      const hs = keep(h.status()), hs2 = keep(h2.status());
      row('  a file edited by hand is checked as if typed: a field that would be refused keeps its default; a file of another version is not read', `on ${hs.on}, ${hs.timeoutMs} ms, ${hs.limits.chars}, key ${hs.hasKey}; v 2: on ${hs2.on}, ${hs2.timeoutMs} ms`,
        'off, 2500, 40000, no key; off, 15000', hs.on === false && hs.timeoutMs === 2500 && hs.limits.chars === 40000 && hs.hasKey === false && hs2.on === false && hs2.timeoutMs === 15000);
      // every run of the app starts off, whatever an earlier run did or a file says (the design note, section 3; the
      // crew's minds' second review found their switch read from the file, and a file written by hand calling out at once)
      const dr = dirOf('runs'), r1 = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dr, base: fake.base });
      await r1.ready; r1.set({ on: true, limits: { chars: 6000 } }); await r1.setKey(KEY);
      const fRun = JSON.parse(readFile(dr));
      const r2 = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dr, base: fake.base }); await r2.ready;
      const sAgain = keep(r2.status()), nRun = fake.seen.length, spAgain = keep(await r2.speak({ who: 'Mr Murdoch', text: 'Hard a-starboard, sir.' }));
      const dby = dirOf('byhand'); fs.writeFileSync(fileOf(dby), JSON.stringify({ v: 1, on: true, limits: { chars: 400000 } }));
      const r3 = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dby, base: fake.base }); await r3.ready;
      const sHand = keep(r3.status());
      row('  every run of the app starts off: one switched on is off when started again (its key and its limit kept), and a file written by hand with the switch on sends nothing',
        `while it ran: on ${r1.status().on}, the file on ${fRun.on}; started again: on ${sAgain.on}, key ${sAgain.hasKey}, limit ${sAgain.limits.chars}, a line: ${spAgain.kind}, ${fake.seen.length - nRun} requests; by hand: on ${sHand.on}, limit ${sHand.limits.chars}`,
        'true, false; false, true, 6000, off, 0; false, 400000', r1.status().on === true && fRun.on === false && sAgain.on === false && sAgain.hasKey === true && sAgain.limits.chars === 6000
        && spAgain.ok === false && spAgain.kind === 'off' && fake.seen.length === nRun && sHand.on === false && sHand.limits.chars === 400000);
    }

    // ---------------------------------------------------------------- 2. the key
    out('\n2. the key');
    {
      const short = keep(await v.setKey('short')), spaced = keep(await v.setKey('has a space in it')), notText = keep(await v.setKey({ key: KEY })), ctl = keep(await v.setKey('test-key-0123\x07-bell'));
      const s = keep(await v.setKey('  ' + KEY + '  ')), text = readFile(dir), c = safe.calls;
      row('a key is kept encrypted by the ASYNCHRONOUS store (encryptStringAsync); the synchronous calls are not touched; the file does not hold it in the clear; what is not a key is refused',
        `kept: ${s.keyKept} by ${s.store}; in the file: ${text.includes(KEY) ? 'IN THE CLEAR' : 'not in the clear'}; async ${c.isAsync}/${c.encAsync}, sync ${c.isSync}/${c.encSync}/${c.decSync}; refused ${[short, spaced, notText, ctl].filter(r => r.ok === false).length} of 4`,
        'disk by async; not in the clear; sync 0/0/0; 4 of 4',
        s.ok && s.hasKey && s.keyKept === 'disk' && s.store === 'async' && s.canProtect === true && !text.includes(KEY) && /"key": "[A-Za-z0-9+/=]{8,}"/.test(text) && c.encAsync === 1 && c.isAsync >= 1
        && c.isSync === 0 && c.encSync === 0 && c.decSync === 0 && [short, spaced, notText, ctl].every(r => r.ok === false && r.kind === 'shape'));
      // started again: the key is opened asynchronously, and the window's calls wait for it
      const safe2 = mkSafe({ delay: 40 }), ipc2 = mkIpc(), again = V.create({ ipcMain: ipc2, safeStorage: safe2, dir, isOwn: () => true, base: fake.base });
      const atOnce = again.status().hasKey;
      again.attach();
      const viaWindow = keep(await ipc2.handlers['voice:status']({ sender: {} }));
      row('the app started again has the key, opened by decryptStringAsync; the window\'s calls wait for it (in this process straight after the start it is not read yet)',
        `at once: ${atOnce}; the window's status: has ${viaWindow.hasKey}, ${viaWindow.keyKept}; async opens ${safe2.calls.decAsync}, sync ${safe2.calls.decSync}`, 'false; true, disk; 1, 0',
        atOnce === false && viaWindow.hasKey === true && viaWindow.keyKept === 'disk' && safe2.calls.decAsync === 1 && safe2.calls.decSync === 0);
      // the store asks for the key to be sealed again (its own key rotated): sealed again and kept, and it still opens
      const dr = dirOf('rotate'); fs.copyFileSync(fileOf(dir), fileOf(dr));
      const was = JSON.parse(readFile(dr)).key, safeR = mkSafe({ rotate: true }), rot = V.create({ ipcMain: mkIpc(), safeStorage: safeR, dir: dr, base: fake.base });
      await rot.ready;
      const now = JSON.parse(readFile(dr)).key, then = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dr, base: fake.base });
      await then.ready;
      row('  when the store says the key should be sealed again, it is: the file\'s seal changes, the key is the same, and the app started again opens it',
        `seal ${now !== was ? 'changed' : 'THE SAME'} (${Buffer.from(was, 'base64').toString('utf8').slice(0, 4)} -> ${Buffer.from(now, 'base64').toString('utf8').slice(0, 4)}); has ${rot.status().hasKey}; again: has ${then.status().hasKey}`,
        'changed (enc1 -> enc2); true; true', now !== was && /^enc2:/.test(Buffer.from(now, 'base64').toString('utf8')) && rot.status().hasKey === true && then.status().hasKey === true && safeR.calls.encAsync === 1);
      // the synchronous store, only where the asynchronous calls are absent; and what it sealed opens by the asynchronous one
      const ds = dirOf('sync'), safeS = mkSafe({ async: false }), sy = V.create({ ipcMain: mkIpc(), safeStorage: safeS, dir: ds, base: fake.base });
      const ss = keep(await sy.setKey(KEY)), sText = readFile(ds);
      const safeA = mkSafe(), later = V.create({ ipcMain: mkIpc(), safeStorage: safeA, dir: ds, base: fake.base }); await later.ready;
      row('  the synchronous store only where the asynchronous one is absent (an Electron before 45, or a stand-in); what it sealed opens by decryptStringAsync (Electron\'s page says so)',
        `kept: ${ss.keyKept} by ${ss.store}, sync seals ${safeS.calls.encSync}; in the file in the clear: ${sText.includes(KEY)}; opened again by async: ${later.status().hasKey} (${safeA.calls.decAsync})`,
        'disk by sync, 1; false; true (1)', ss.hasKey && ss.keyKept === 'disk' && ss.store === 'sync' && safeS.calls.encSync === 1 && !sText.includes(KEY) && later.status().hasKey === true && safeA.calls.decAsync === 1 && safeA.calls.decSync === 0);
      // a PC that cannot protect a key (neither the asynchronous calls nor the synchronous ones able): kept for the run
      // only, nothing of it written. CHANGED with the shared key store (app/keystore.js, kind()): where the asynchronous
      // calls say no and the synchronous ones say yes, the synchronous store now seals it (the key store's own review: a
      // store that answers "not yet" as the app starts must not lose every kept key); this file's own copy said 'none'
      const dn = dirOf('none'), safeN = mkSafe({ on: false, syncOn: false }), nv = V.create({ ipcMain: mkIpc(), safeStorage: safeN, dir: dn, base: fake.base });
      const sn = keep(await nv.setKey(KEY)), nText = readFile(dn), nAgain = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dn, base: fake.base }); await nAgain.ready;
      const dy = dirOf('syncyes'), safeY = mkSafe({ on: false, syncOn: true }), yv = V.create({ ipcMain: mkIpc(), safeStorage: safeY, dir: dy, base: fake.base });
      const sy2 = keep(await yv.setKey(KEY)), yText = readFile(dy);
      row('  a PC that cannot protect a key (neither of the store\'s calls able) keeps it for the run only: nothing of it is written, and the app started again has none; where only the synchronous calls can, they seal it (the shared key store\'s rule)',
        `kept: ${sn.keyKept}, can protect ${sn.canProtect} (${sn.store}); file ${nText ? (nText.includes(KEY) ? 'holds THE KEY' : 'no key') : 'not written'}; again: has ${nAgain.status().hasKey}; the synchronous store able: ${sy2.keyKept} by ${sy2.store}, in the clear ${yText.includes(KEY)}`,
        'run, false (none); no key; false; disk by sync, false', sn.hasKey && sn.keyKept === 'run' && sn.canProtect === false && sn.store === 'none' && !nText.includes(KEY) && !/"key"/.test(nText) && safeN.calls.encSync === 0 && safeN.calls.encAsync === 0
        && nAgain.status().hasKey === false && sy2.hasKey === true && sy2.keyKept === 'disk' && sy2.store === 'sync' && safeY.calls.encSync === 1 && !yText.includes(KEY) && /"key"/.test(yText));
      // a key sealed by the build on main before the shared key store (voice.js's own code then: "deepgram:" and the key,
      // by encryptStringAsync) still opens with the new code, is the key, and is sealed again only when the store asks
      const dOld = dirOf('oldform'), safeO = mkSafe(), oldSeal = Buffer.from(await safeO.encryptStringAsync('deepgram:' + KEY)).toString('base64');
      fs.writeFileSync(fileOf(dOld), JSON.stringify({ v: 1, on: false, timeoutMs: 15000, limits: { chars: 40000 }, key: oldSeal }, null, 1) + '\n');
      const oldApp = V.create({ ipcMain: mkIpc(), safeStorage: safeO, dir: dOld, base: fake.base }); await oldApp.ready;
      const sOld = keep(oldApp.status()), fileOld = JSON.parse(readFile(dOld));
      oldApp.set({ on: true }); const tOld = keep(await oldApp.test());
      const dOldR = dirOf('oldform-rotate'), safeOR = mkSafe({ rotate: true }), oldSealR = Buffer.from(await safeOR.encryptStringAsync('deepgram:' + KEY)).toString('base64');
      fs.writeFileSync(fileOf(dOldR), JSON.stringify({ v: 1, on: false, timeoutMs: 15000, limits: { chars: 40000 }, key: oldSealR }, null, 1) + '\n');
      const oldAppR = V.create({ ipcMain: mkIpc(), safeStorage: safeOR, dir: dOldR, base: fake.base }); await oldAppR.ready;
      const fileOldR = JSON.parse(readFile(dOldR)), againOld = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dOldR, base: fake.base }); await againOld.ready;
      row('  a key sealed by the build before the shared key store (its own form: "deepgram:" and the key, by the asynchronous store) opens with the new code and is the key Deepgram takes; its seal is left as it was, and sealed again only when the store asks for it',
        `has ${sOld.hasKey} (${sOld.keyKept}); the key tried: ${tOld.ok ? 'taken' : tOld.kind}; the seal ${fileOld.key === oldSeal ? 'as it was' : 'CHANGED'} (seals made ${safeO.calls.encAsync - 1}); the store asking: ${fileOldR.key !== oldSealR && /^enc2:/.test(Buffer.from(fileOldR.key, 'base64').toString('utf8')) ? 'sealed again' : 'NOT sealed again'}, then opened: ${againOld.status().hasKey}`,
        'true (disk); taken; as it was (0); sealed again, then opened: true',
        sOld.hasKey === true && sOld.keyKept === 'disk' && tOld.ok === true && fileOld.key === oldSeal && safeO.calls.encAsync === 1
        && fileOldR.key !== oldSealR && /^enc2:/.test(Buffer.from(fileOldR.key, 'base64').toString('utf8')) && oldAppR.status().hasKey === true && againOld.status().hasKey === true);
      const other = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe({ foreign: true }), dir, base: fake.base }); await other.ready;
      row('  under another user\'s store (which cannot open it) there is no key', `has ${keep(other.status()).hasKey}`, 'false', other.status().hasKey === false);
      const dc = dirOf('forget'), fc = mk('forget'); await fc.setKey(KEY);
      const sc = keep(fc.clearKey()), tc = JSON.parse(readFile(dc)), fcAgain = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dc, base: fake.base }); await fcAgain.ready;
      row('"Forget" removes it from the run and from the file', `has ${sc.hasKey}; the file's key: ${tc.key === undefined ? 'none' : 'KEPT'}; started again: has ${fcAgain.status().hasKey}`, 'false; none; false', sc.hasKey === false && tc.key === undefined && fcAgain.status().hasKey === false);
      // THE REVIEW OF THIS FILE. Save, then Forget at once: sealing takes time, and the later word must stand (the key
      // was kept); so must a Forget while a key kept from an earlier run is still being opened
      const ipcR = mkIpc(), dRace = dirOf('race'), race = V.create({ ipcMain: ipcR, safeStorage: mkSafe({ sealDelay: 50 }), dir: dRace, isOwn: () => true, base: fake.base });
      race.attach();
      const callR = (name, arg) => ipcR.handlers['voice:' + name]({ sender: {} }, arg);
      const both = await Promise.all([callR('setKey', KEY), callR('clearKey')]);
      const afterRace = keep(race.status()), fileRace = readFile(dRace);
      const dOpen = dirOf('opening'), first = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dOpen, base: fake.base }); await first.ready; await first.setKey(KEY);
      const slow = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe({ delay: 50 }), dir: dOpen, base: fake.base });
      slow.clearKey(); await slow.ready;
      // ... and two keys saved one after the other: the second is the key
      const two = mk('twokeys', { safeStorage: mkSafe({ sealDelay: 30 }) }); await two.ready;
      await Promise.all([two.setKey(KEY + '-first'), two.setKey(KEY)]);
      const n2 = fake.seen.length; two.set({ on: true }); const t2 = await two.test();
      row('  Save, then Forget at once: the later word stands, and no key is kept; a key forgotten while it is still being opened at the start is not taken back; of two keys saved together the second is the key',
        `Save answered has ${both[0].hasKey}, Forget has ${both[1].hasKey}; afterwards has ${afterRace.hasKey}, the file ${/"key"/.test(fileRace) ? 'KEEPS A KEY' : 'holds none'}; opened late: has ${slow.status().hasKey}; two keys: the second ${t2.ok ? 'taken' : 'NOT taken (' + t2.kind + ')'}`,
        'no key; none; false; taken', afterRace.hasKey === false && !/"key"/.test(fileRace) && slow.status().hasKey === false && !/"key"/.test(readFile(dOpen)) && t2.ok === true && fake.seen.length === n2 + 1);
      // a sealed thing that is not a key of this file's own (another provider's key, copied into voice.json by hand)
      const dAl = dirOf('alien'); fs.writeFileSync(fileOf(dAl), JSON.stringify({ v: 1, key: seal('some-other-providers-key-000', 1).toString('base64') }));
      const alien = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dAl, base: fake.base }); await alien.ready;
      row('  a sealed thing that does not say it is Deepgram\'s (another provider\'s key copied into voice.json by hand) is not taken for the key', `has ${keep(alien.status()).hasKey}`, 'false', alien.status().hasKey === false);
      // THE SECOND REVIEW OF THE EARS (2026-11-24), on the key; each row fails without its mend.
      // M16: a Forget that comes once the opening of the key kept from an earlier run has BEGUN (the store asked, its answer
      // not yet come) stands: the key is not taken back when the opening ends (the row above forgets it before the opening
      // has begun, where the start itself finds no key to open)
      const dM16 = dirOf('opening-begun'), firstM16 = mk('opening-begun'); await firstM16.ready; await firstM16.setKey(KEY);
      const safeM16 = mkSafe({ delay: 150 }), slowM16 = V.create({ ipcMain: mkIpc(), safeStorage: safeM16, dir: dM16, base: fake.base });
      const begunM16 = await until(() => safeM16.calls.decAsync === 1, 1000);
      const sM16 = keep(slowM16.clearKey()); await slowM16.ready;
      const afterM16 = keep(slowM16.status()), fileM16 = readFile(dM16);
      row('  a Forget that comes while the key kept from an earlier run is being opened (the store asked, its answer not yet come) stands: the key is not taken back into memory when the opening ends, and the file keeps none',
        `the opening begun ${begunM16} (${safeM16.calls.decAsync} asked); Forget answered has ${sM16.hasKey}; when the opening ended: has ${afterM16.hasKey}; the file ${/"key"/.test(fileM16) ? 'KEEPS A KEY' : 'holds none'}`,
        'true (1); false; false; none',
        begunM16 && sM16.hasKey === false && afterM16.hasKey === false && afterM16.keyKept === null && !/"key"/.test(fileM16));
      // a store that says it can protect a key and then will not seal it: the key is kept for the run only, and the status
      // says so (it cannot protect; the store 'none'), as the crew's minds' does (app/minds.js); nothing of it is written
      const dF = dirOf('failseal'), safeF = mkSafe({ failSeal: true }), fv = V.create({ ipcMain: mkIpc(), safeStorage: safeF, dir: dF, base: fake.base }); await fv.ready;
      const startF = keep(fv.status()), sF = keep(await fv.setKey(KEY)), fText = readFile(dF);
      row('  a store that says it can protect a key and then will not seal it: the key is kept for the run only, and the status says so (it cannot protect, the store none), as the crew\'s minds\' does; nothing of it is written',
        `at the start: can protect ${startF.canProtect} (${startF.store}); after Save: kept ${sF.keyKept}, can protect ${sF.canProtect} (${sF.store}), seals tried ${safeF.calls.encAsync}; the file ${fText ? (/"key"/.test(fText) ? 'HOLDS A KEY' : 'no key') : 'not written'}`,
        'true (async); run, false (none), 1; no key',
        startF.canProtect === true && startF.store === 'async' && sF.ok === true && sF.hasKey === true && sF.keyKept === 'run' && sF.canProtect === false && sF.store === 'none'
        && safeF.calls.encAsync === 1 && !/"key"/.test(fText) && !fText.includes(KEY));
      // M32: a store that could not protect a key at the start and can when a key is saved (it came to be after the start)
      // is asked again at Save: the key is sealed and kept on disk, and the status says the store protects it
      const gateG = { open: false }, dG = dirOf('cometobe'), safeG = mkSafe({ gate: gateG }), gv = V.create({ ipcMain: mkIpc(), safeStorage: safeG, dir: dG, base: fake.base }); await gv.ready;
      const startG = keep(gv.status());
      gateG.open = true;
      const sG = keep(await gv.setKey(KEY)), gText = readFile(dG);
      row('  a store that could not protect a key at the start and can when a key is saved (it came to be after the start) is asked again at Save: the key is sealed and kept, and the status says the store protects it',
        `at the start: can protect ${startG.canProtect} (${startG.store}); after Save: kept ${sG.keyKept}, can protect ${sG.canProtect} (${sG.store}); the file ${/"key"/.test(gText) ? 'holds the seal' : 'NO KEY'}, in the clear ${gText.includes(KEY)}`,
        'false (none); disk, true (async); holds the seal, false',
        startG.canProtect === false && startG.store === 'none' && sG.hasKey === true && sG.keyKept === 'disk' && sG.canProtect === true && sG.store === 'async' && /"key"/.test(gText) && !gText.includes(KEY));
      // "Forget" with the settings unwritable (the file's temporary made a folder): the key goes from memory, and the answer
      // says plainly that the file could not be written, since the seal stays there for the next run; a key kept for the run
      // only (a PC that cannot protect one) is answered the same way. Each call is caught, so that a throw fails this row
      const dU = dirOf('forget-unsaved'), uv = mk('forget-unsaved'); await uv.ready; await uv.setKey(KEY);
      const dU2 = dirOf('run-unsaved'), uv2 = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe({ on: false, syncOn: false }), dir: dU2, base: fake.base }); await uv2.ready;
      fs.mkdirSync(path.join(dU, 'voice.json.tmp')); fs.mkdirSync(path.join(dU2, 'voice.json.tmp'));
      let aU, aU2;
      try { aU = keep(uv.clearKey()); } catch (e) { aU = { thrown: String(e && e.code || 'an error') }; }
      try { aU2 = keep(await uv2.setKey(KEY)); } catch (e) { aU2 = { thrown: String(e && e.code || 'an error') }; }
      const sU = keep(uv.status()), sU2 = keep(uv2.status());
      fs.rmdirSync(path.join(dU, 'voice.json.tmp')); fs.rmdirSync(path.join(dU2, 'voice.json.tmp'));
      const saidU = (a) => (a.thrown ? 'THREW ' + a.thrown : (a.ok === false ? a.kind + ': "' + clip(String(a.why), 64) + '"' : 'ok'));
      row('  "Forget" with the settings unwritable: the key goes from memory, and the answer, a fault of kind "unsaved", says the settings file could not be written (the seal may still be kept there); a key kept for the run only, the same',
        `Forget: ${saidU(aU)}, has ${sU.hasKey}; for the run only: ${saidU(aU2)}, kept ${sU2.keyKept}`,
        'unsaved, could not be written, false; unsaved, could not be written, run',
        aU.ok === false && aU.kind === 'unsaved' && /forgotten/.test(aU.why) && /settings file could not be written/.test(aU.why) && sU.hasKey === false && sU.keyKept === null
        && aU2.ok === false && aU2.kind === 'unsaved' && /kept for this run only/.test(aU2.why) && /settings file could not be written/.test(aU2.why) && sU2.hasKey === true && sU2.keyKept === 'run');
    }

    // ---------------------------------------------------------------- 3. nothing called while off, or with no key
    out('\n3. nothing is called while the switch is off, or with no key');
    {
      const n0 = fake.seen.length, a = mk('d');
      const off = keep(await v.speak(LINE)), offT = keep(await v.test());
      a.set({ on: true });
      const noKey = keep(await a.speak(LINE)), noKeyT = keep(await a.test());
      row('off (with a key kept); on with no key: each an answer of its kind, in plain words, and no request made', `${[off, offT, noKey, noKeyT].map(r => r.kind).join(', ')}; ${fake.seen.length - n0} requests; hosts ${JSON.stringify(v.hosts().concat(a.hosts()))}`,
        'off, off, no-key, no-key; 0 requests; []', off.kind === 'off' && offT.kind === 'off' && noKey.kind === 'no-key' && noKeyT.kind === 'no-key' && [off, offT, noKey, noKeyT].every(r => r.ok === false && r.why) && fake.seen.length === n0 && v.hosts().length === 0 && a.hosts().length === 0);
    }

    // ---------------------------------------------------------------- 4. a line
    out('\n4. a line');
    v.set({ on: true });
    {
      const n0 = fake.seen.length, r = keep(await v.speak(LINE)), q = fake.seen[fake.seen.length - 1] || { headers: {} }, h = q.headers;
      const keyIn = Object.keys(h).filter(k => String(h[k]).includes(KEY));
      row('one request, to the one host: POST /v2/speak with the exact query (model, encoding, container, sample rate), the key in the Authorization header and nowhere else, the text as the body',
        `${fake.seen.length - n0} ${q.method} ${q.path}${q.search}; the key in: ${keyIn.join(', ') || 'NO HEADER'}; ${q.raw}`,
        '1 POST /v2/speak?model=flux-conor-en&encoding=linear16&container=wav&sample_rate=24000; authorization; {"text":...}',
        fake.seen.length - n0 === 1 && q.method === 'POST' && q.path === '/v2/speak' && q.search === '?model=flux-conor-en&encoding=linear16&container=wav&sample_rate=24000'
        && h.authorization === 'Token ' + KEY && same(keyIn, ['authorization']) && /^application\/json/.test(h['content-type']) && q.raw === '{"text":"Hard a-starboard, sir."}' && same(v.hosts(), [fake.origin]));
      const b = r.wav ? Buffer.from(r.wav) : Buffer.alloc(0), u = v.usage();
      row('  the answer: the WAV as Deepgram sent it (an ArrayBuffer, RIFF and WAVE), the voice, the characters, how long; counted for the run',
        `${r.ok ? b.length + ' bytes, ' + b.toString('ascii', 0, 4) + '/' + b.toString('ascii', 8, 12) + ', the same: ' + (fake.sent && b.equals(fake.sent)) : r.kind + ': ' + r.why}; ${r.voice}; ${r.chars} characters, ${r.ms} ms; run: ${u.used.chars} characters, ${u.used.lines} line`,
        'RIFF/WAVE, the same; flux-conor-en; 22; run: 22, 1',
        r.ok === true && r.wav instanceof ArrayBuffer && b.length > 44 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WAVE' && !!fake.sent && b.equals(fake.sent)
        && r.voice === 'flux-conor-en' && r.chars === 22 && r.ms >= 0 && same(Object.keys(r).sort(), ['chars', 'ms', 'ok', 'voice', 'wav']) && u.used.chars === 22 && u.used.lines === 1);
      const r2 = keep(await v.speak({ who: 'Mr Moody', text: '  Hard   a-starboard,\n sir.  ' })), q2 = fake.seen[fake.seen.length - 1] || {};
      row('  the line is sent as it is said: its spaces and line breaks made one space, and trimmed; that is what is counted', `${q2.raw}; ${r2.chars} characters`, '{"text":"Hard a-starboard, sir."}; 22',
        r2.ok === true && q2.raw === '{"text":"Hard a-starboard, sir."}' && r2.chars === 22);
    }

    // ---------------------------------------------------------------- 5. each man to his voice
    out('\n5. each man to his voice; the page names only the man');
    {
      const wrong = [];
      for (const name of Object.keys(V.VOICES).concat(['mr  MURDOCH ', 'the Quartermaster'])) {
        const r = keep(await v.speak({ who: name, text: 'Aye, sir.' })), q = fake.seen[fake.seen.length - 1] || { query: {} };
        const want = V.VOICES[name] || (name.trim().toLowerCase().indexOf('murdoch') >= 0 ? V.CAST['Mr Murdoch'] : V.POSTS['The quartermaster']);
        if (!(r.ok && r.voice === want && q.query.model === want)) wrong.push(name + ': ' + (r.ok ? q.query.model : r.kind));
      }
      row('each name in the table is spoken in its voice, whatever its case and spaces (the model in the request is the table\'s)', wrong.length ? wrong.join('; ') : Object.keys(V.VOICES).length + ' names and 2 spellings, each its own', 'none wrong', wrong.length === 0);
      // (the review: this process voiced ANY name it was given, the captain's own "You" among them, in Captain Smith's
      // voice; only the page held the rule that the captain's lines are never spoken)
      const unknown = [], nUnk = fake.seen.length, uUnk = v.status().used.chars;
      for (const name of ['Mr Lightoller', 'The carpenter', 'flux-kit-en', 'aura-2-draco-en', 'You', 'you']) {
        const r = keep(await v.speak({ who: name, text: 'Aye, sir.' }));
        unknown.push(name + ' ' + (r.ok ? 'SPOKEN' : r.kind));
      }
      row('  a name not in the table has no voice here: nothing is sent for it and no character is counted, the captain\'s own "You" among them; a "man" named as a model is no man either',
        unknown.join(', ') + '; ' + (fake.seen.length - nUnk) + ' requests', 'each refused (shape); 0 requests', unknown.every(x => x.endsWith(' shape')) && fake.seen.length === nUnk && v.status().used.chars === uUnk);
      const n0 = fake.seen.length;
      const EXTRA = [{ model: 'aura-2-thalia-en' }, { voice: 'flux-kit-en' }, { url: 'https://example.com/v2/speak' }, { base: 'http://127.0.0.1:9' }, { headers: { Authorization: 'Token x' } }, { encoding: 'mp3' }, { speed: 1.5 }];
      const got = [];
      for (const x of EXTRA) got.push(keep(await v.speak(Object.assign({}, LINE, x))));
      row('  the page names no model, voice, address, header or format: a request with any field but who and what he says is refused, and nothing is sent',
        `${got.filter(r => r.ok === false && r.kind === 'shape').length} of ${EXTRA.length} refused; ${fake.seen.length - n0} requests`, `${EXTRA.length} of ${EXTRA.length}; 0`,
        got.every(r => r.ok === false && r.kind === 'shape') && fake.seen.length === n0);
      const BADQ = [null, 'x', [], {}, { who: 'Mr Murdoch' }, { text: 'Aye, sir.' }, { who: '', text: 'Aye.' }, { who: '   ', text: 'Aye.' }, { who: 'x'.repeat(61), text: 'Aye.' }, { who: 'Mr\nMurdoch', text: 'Aye.' }, { who: 7, text: 'Aye.' },
        { who: 'Mr Murdoch', text: '' }, { who: 'Mr Murdoch', text: '   ' }, { who: 'Mr Murdoch', text: 'x'.repeat(601) }, { who: 'Mr Murdoch', text: 7 }, { who: 'Mr Murdoch', text: 'Aye,\x01 sir.' }];
      const n1 = fake.seen.length, badWrong = [];
      for (const q of BADQ) { const r = keep(await v.speak(q)); if (!(r.ok === false && r.kind === 'shape')) badWrong.push(clip(JSON.stringify(q), 30)); }
      row('  who and what he says are checked: a name of 1 to 60 characters with no control character; a line of 1 to 600 characters, not blank', badWrong.length ? badWrong.join('; ') : BADQ.length + ' refused; ' + (fake.seen.length - n1) + ' requests', 'each refused; 0 requests',
        badWrong.length === 0 && fake.seen.length === n1);
    }

    // ---------------------------------------------------------------- 6. Deepgram's errors
    out('\n6. Deepgram\'s errors, each to its kind');
    {
      const want = { 401: 'auth', 403: 'auth', 402: 'rate', 429: 'rate', 400: 'shape', 413: 'shape', 422: 'shape', 404: 'shape', 500: 'server' }, got = {};
      for (const m of Object.keys(want)) { fake.mode = m; got[m] = keep(await v.speak(LINE)); }
      fake.mode = 'ok';
      const off = Object.keys(want).filter(k => !(got[k].ok === false && got[k].kind === want[k] && got[k].why && !got[k].why.includes(KEY)));
      row('the key refused (401, 403), payment asked (402), too many requests (429), the request refused (400, 413, 422, 404), a server\'s error (500)', Object.keys(want).map(k => k + ' ' + got[k].kind).join(', '),
        'auth, auth, rate, rate, shape x4, server', off.length === 0);
      row('  a refused request carries Deepgram\'s own words, from either form of its error', clip(got[400].why + ' | ' + got[422].why, 100), 'its err_msg; its message',
        /The text could not be read\.$/.test(got[400].why) && /The text is not in a form this voice takes\.$/.test(got[422].why));
      fake.mode = 'echo'; const echo = keep(await v.speak(LINE)); fake.mode = 'ok';
      row('  Deepgram repeating the key in its error: the key is struck out of what the window is told', `${echo.kind}: ${clip(String(echo.why), 90)}`, 'shape: ... [the key]',
        echo.ok === false && echo.kind === 'shape' && /\[the key\]/.test(echo.why) && !echo.why.includes(KEY));
      const bad = {};
      for (const m of ['notaudio', 'badwav', 'toolarge', 'toolarge-chunked']) { fake.mode = m; bad[m] = keep(await v.speak(LINE)); }
      fake.mode = 'ok';
      row('  an answer that is not a WAV (another type, or not a WAV inside), or larger than 8 MB (stated, or streamed without a length), is not taken', Object.keys(bad).map(k => k + ' ' + bad[k].kind).join(', '),
        'server each', Object.keys(bad).every(k => bad[k].ok === false && bad[k].kind === 'server' && bad[k].why) && /not a WAV/.test(bad.notaudio.why) && /larger than 8 MB/.test(bad.toolarge.why) && /larger than 8 MB/.test(bad['toolarge-chunked'].why));
      // a true WAV under another name, or under none, is the WAV that was asked for: Deepgram's reference names no
      // content type for its answer, and a name must not make every line fail. The bytes decide
      const named = {};
      for (const m of ['octet', 'notype']) { fake.mode = m; named[m] = await v.speak(LINE); }
      fake.mode = 'ok';
      row('  a true WAV called something else (application/octet-stream), or given no content type, is taken: the bytes decide', Object.keys(named).map(k => k + ' ' + (named[k].ok ? 'taken' : named[k].kind + ': ' + named[k].why)).join(', '), 'octet taken, notype taken',
        Object.keys(named).every(k => named[k].ok === true && named[k].wav instanceof ArrayBuffer && named[k].wav.byteLength === fake.sent.length && Buffer.from(named[k].wav).toString('ascii', 0, 4) === 'RIFF'));
      fake.key = 'another-key-0123456789'; const wrongKey = keep(await v.speak(LINE)); fake.key = KEY;
      row('  a key Deepgram does not know is "auth"', `${wrongKey.kind}: ${wrongKey.why}`, 'auth', wrongKey.ok === false && wrongKey.kind === 'auth');
      // THE REVIEW OF THIS FILE. The key far into Deepgram's own words, where a cut would fall on it; only its first and
      // last characters printed; the key in the answer's content type. No run of eight of its characters reaches the window
      const leaks = (s) => { for (let i = 0; i + 8 <= KEY.length; i++) if (String(s).indexOf(KEY.slice(i, i + 8)) >= 0) return true; return false; };
      const told = {};
      for (const m of ['echolong', 'echopart', 'typekey', 'typekey2', 'plain']) { fake.mode = m; told[m] = keep(await v.speak(LINE)); }
      fake.mode = 'ok';
      const four = ['echolong', 'echopart', 'typekey', 'typekey2'];
      row('  no part of the key reaches the window: it is struck out of a long message BEFORE the message is cut, struck where only its first and last characters are printed, and an answer\'s content type is never repeated',
        four.map(k => k + ' ' + (leaks(told[k].why) ? 'LEAKS' : 'clean')).join(', ') + '; ' + clip(String(told.echopart.why), 90), 'each clean',
        four.every(k => told[k].ok === false && told[k].why && !leaks(told[k].why)) && /\[the key\]/.test(told.echopart.why) && told.typekey.kind === 'server' && told.typekey2.kind === 'server');
      row('  an error that is a bare string (the third of Deepgram\'s shapes) is said in its own words', `${told.plain.kind}: ${told.plain.why}`, 'shape: ... The voice is not one of ours.', told.plain.kind === 'shape' && /The voice is not one of ours\.$/.test(told.plain.why));
      // a line Deepgram refuses was not spoken: its characters are given back to the run's count
      const u0 = v.status().used; fake.mode = '401'; await v.speak(LINE); fake.mode = 'ok'; const u1 = v.status().used;
      row('  the characters of a line Deepgram refused are given back to the run\'s count: it was not spoken', `${u0.chars} characters in ${u0.lines} lines before; ${u1.chars} in ${u1.lines} after a refused line`, 'the same', u1.chars === u0.chars && u1.lines === u0.lines);
    }

    // ---------------------------------------------------------------- 7. time, two at once, the limit
    out('\n7. a Deepgram that never answers; two at once; the run\'s limit');
    {
      fake.mode = 'slow';
      const t0 = Date.now(), three = await Promise.all([v.speak(LINE), v.speak(LINE), v.speak(LINE)]), ms = Date.now() - t0;
      fake.mode = 'ok'; three.forEach(keep);
      row('no answer: "timeout" within the wait that is set (1 s here); a third line while two are awaited is refused at once', `${three.map(r => r.kind).join(', ')} in ${ms} ms`, 'timeout, timeout, busy in about 1000 ms',
        three[0].kind === 'timeout' && three[1].kind === 'timeout' && three[2].kind === 'busy' && ms >= 900 && ms < 4000);
      const lim = mk('limit'); lim.set({ on: true, limits: { chars: 1000 } }); await lim.setKey(KEY);
      const n0 = fake.seen.length, x400 = 'x'.repeat(399) + '.', x200 = 'y'.repeat(199) + '.';
      const a = keep(await lim.speak({ who: 'Mr Bell', text: x400 })), b = keep(await lim.speak({ who: 'Mr Bell', text: x400 })), c = keep(await lim.speak({ who: 'Mr Bell', text: x400 }));
      const d = keep(await lim.speak({ who: 'Mr Bell', text: x200 })), e = keep(await lim.speak({ who: 'Mr Bell', text: 'Aye.' })), u = lim.usage();
      row('the run\'s limit of characters: a line that would pass it is refused and nothing is sent; one that fits it exactly is spoken; then nothing more',
        `${[a, b, c, d, e].map(r => (r.ok ? 'ok' : r.kind)).join(', ')}; ${fake.seen.length - n0} requests; ${u.used.chars} of ${u.limits.chars}`, 'ok, ok, budget, ok, budget; 3 requests; 1000 of 1000',
        a.ok && b.ok && c.kind === 'budget' && d.ok && e.kind === 'budget' && fake.seen.length - n0 === 3 && u.used.chars === 1000 && u.limits.chars === 1000);
    }

    // ---------------------------------------------------------------- 8. one host
    out('\n8. one host');
    {
      // the voice's own requests pass minds.js's guard: they are made with no redirect followed, to the one origin
      const calls = [], wavB = Fake.wav('Aye, sir.');
      const spy = async (url, init) => { calls.push({ url: String(url), init }); return { ok: true, status: 200, headers: { get: (k) => (k === 'content-type' ? 'audio/wav' : null) }, arrayBuffer: async () => wavB.buffer.slice(wavB.byteOffset, wavB.byteOffset + wavB.byteLength) }; };
      const g = V.create({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dirOf('spy'), base: fake.base, fetch: spy });
      g.set({ on: true }); await g.setKey(KEY);
      const r = keep(await g.speak(LINE)), c0 = calls[0] || { init: {} };
      const gd = M.guard(fake.origin, spy, []), tries = ['https://api.deepgram.com/v2/speak', 'http://127.0.0.1:9/v2/speak', 'https://api.deepgram.com.evil.test/v2/speak', 'not an address'];
      let through = 0;
      for (const t of tries) { try { await gd(t, {}); through++; } catch (e) { if (!(e instanceof M.MindsError && e.kind === 'guard')) through++; } }
      row('a line\'s request goes through minds.js\'s guard: to the one origin, with no redirect followed; the guard refuses any other host or port before a request is made',
        `${calls.length} request to ${c0.url.split('?')[0]}, redirect: ${c0.init.redirect}; the answer ${r.ok ? 'taken' : r.kind}; ${through} of ${tries.length} others let through`, '1 to /v2/speak, redirect: error; taken; 0 of 4',
        calls.length === 1 && c0.url.startsWith(fake.origin + '/v2/speak?') && c0.init.redirect === 'error' && r.ok === true && through === 0);
      fake.mode = 'redirect'; const n0 = fake.seen.length, rd = keep(await v.speak(LINE)); fake.mode = 'ok';
      row('  Deepgram answering with a redirect: it is not followed, the answer is a fault, and this run has called the one host only', `${rd.ok === false ? rd.kind + ': ' + clip(rd.why, 60) : 'FOLLOWED'}; ${fake.seen.length - n0} request; hosts ${JSON.stringify(v.hosts())}`,
        `guard; 1; ["${fake.origin}"]`, rd.ok === false && rd.kind === 'guard' && fake.seen.length - n0 === 1 && same(v.hosts(), [fake.origin]) && same(keep(v.status()).hosts, [fake.origin]));
      const refused = [];
      for (const b of ['https://example.com', 'http://203.0.113.5:8080', fake.base + '/v2', 'http://user:pw@127.0.0.1:9', 'not an address']) {
        try { V.create({ base: b }); refused.push(b + ': TAKEN'); } catch (e) { if (!(e instanceof V.VoiceError && e.kind === 'shape')) refused.push(b + ': threw otherwise'); }
      }
      row('  a stand-in for Deepgram is taken only on this PC, as an origin with no path; another address is refused when the app is made', refused.length ? refused.join('; ') : '5 of 5 refused', '5 of 5 refused', refused.length === 0);
    }

    // ---------------------------------------------------------------- 9. Try it
    out('\n9. "Try it": the key tried with Deepgram');
    {
      const n0 = fake.seen.length, u0 = v.usage().used.chars;
      const t = keep(await v.test()), q = fake.seen[fake.seen.length - 1] || { headers: {} };
      fake.key = 'another-key-0123456789'; const no = keep(await v.test()); fake.key = KEY;
      row('one GET of /v1/auth/token with the key in its header, nothing else sent; a key Deepgram refuses is "auth"; no character counted',
        `${t.ok ? 'ok in ' + t.ms + ' ms' : t.kind}; ${q.method} ${q.path}${q.search}, ${q.headers.authorization === 'Token ' + KEY ? 'the key in its header' : 'NO KEY'}, body "${q.raw}"; refused: ${no.kind}; ${fake.seen.length - n0} requests; characters +${v.usage().used.chars - u0}`,
        'ok; GET /v1/auth/token, the key in its header, ""; auth; 2; +0',
        t.ok === true && same(Object.keys(t).sort(), ['ms', 'ok']) && q.method === 'GET' && q.path === '/v1/auth/token' && q.search === '' && q.headers.authorization === 'Token ' + KEY && q.raw === ''
        && no.ok === false && no.kind === 'auth' && fake.seen.length - n0 === 2 && v.usage().used.chars === u0);
    }

    // ---------------------------------------------------------------- 10. the player's own word
    out('\n10. the player\'s own word: what the window cannot switch by itself');
    {
      const ipcW = mkIpc(), asked = [], say = [];          // say: the answers to give, in turn (none left: yes)
      let hold = null;                                     // 'next': keep the next question open, to be answered by hand
      const w = V.create({ ipcMain: ipcW, safeStorage: mkSafe(), dir: dirOf('word'), isOwn: () => true, base: fake.base,
        confirm: (q) => { asked.push(q); if (hold === 'next') return new Promise((res) => { hold = res; }); return Promise.resolve(say.length ? say.shift() : true); } });
      w.attach();
      const call = (name, arg) => ipcW.handlers['voice:' + name]({ sender: {} }, arg).then(keep);
      const n0 = fake.seen.length;
      await call('setKey', KEY);
      await call('set', { timeoutMs: 2000, limits: { chars: 3000 } });
      const quiet = asked.length;
      say.push(false);
      const no = await call('set', { on: true }), offStill = w.status(), offSpeak = await call('speak', LINE);
      const yes = await call('set', { on: true });
      row('off, nothing is asked (a limit, the wait); the switch going on is: declined, nothing changes and nobody is called; confirmed, it is on',
        `${quiet} asked while off; declined: ${no.kind}, on ${offStill.on}, a line then: ${offSpeak.kind}, ${fake.seen.length - n0} requests; confirmed: on ${yes.on}; asked: ${asked.map(q => q.kind).join(', ')}`,
        '0; declined, false, off, 0; true; on, on',
        quiet === 0 && no.ok === false && no.kind === 'declined' && offStill.on === false && offSpeak.kind === 'off' && fake.seen.length === n0 && yes.ok === true && yes.on === true && same(asked.map(q => q.kind), ['on', 'on']));
      const q0 = asked[0] || {};
      row('  the question names Deepgram and the one address that would be called, says what is sent and that the key is billed per character, and the run\'s limit; its other answer is "Cancel"',
        clip(String(q0.message) + ' ' + String(q0.detail), 130), 'Deepgram at ' + fake.origin + '; each line a man says, as text; per character; 3,000',
        q0.title === 'The men\'s voices' && q0.message === 'Switch on Deepgram\'s voices?' && String(q0.detail).includes('to Deepgram at ' + fake.origin + ',') && String(q0.detail).includes('each line a man says, as text')
        && String(q0.detail).includes('bills your key per character') && String(q0.detail).includes('up to 3,000 characters') && q0.yes === 'Switch on' && q0.no === 'Cancel' && q0.origin === fake.origin);
      const k1 = asked.length;
      await call('set', { limits: { chars: 2000 } }); await call('set', { timeoutMs: 3000 }); await call('set', { on: true });
      const k2 = asked.length;
      say.push(false);
      const l1 = await call('set', { limits: { chars: 9000 } }), lim1 = w.status().limits.chars;
      const l2 = await call('set', { limits: { chars: 9000 } }), lim2 = w.status().limits.chars;
      const ql = asked[asked.length - 1] || {};
      row('on: a lower limit, the wait and the switch left on are not asked; a higher limit is (declined, it stays; confirmed, it is raised), and the question says both figures',
        `${k2 - k1} asked for the three; ${l1.kind}, ${lim1}; then ${lim2}; asked: ${asked.slice(2).map(q => q.kind).join(', ')}; "${clip(String(ql.detail), 60)}"`,
        '0; declined, 2000; 9000; limits, limits; up to 9,000 (now 2,000)',
        k2 === k1 && l1.ok === false && l1.kind === 'declined' && lim1 === 2000 && l2.ok === true && lim2 === 9000 && same(asked.slice(2).map(q => q.kind), ['limits', 'limits'])
        && ql.message === 'Raise this run\'s limit?' && String(ql.detail).includes('up to 9,000 characters (now 2,000)') && String(ql.detail).includes(fake.origin));
      // while a question is open no setting moves, so nothing can be slipped in behind it
      await call('set', { on: false });
      const k3 = asked.length;
      hold = 'next';
      const open = call('set', { on: true });
      await new Promise((r) => setTimeout(r, 20));
      const behind = await call('set', { limits: { chars: 1000 } }), limThen = w.status().limits.chars, onThen = w.status().on;
      const answer = hold; hold = null; if (typeof answer === 'function') answer(true);
      const opened = typeof answer === 'function' ? await open : { ok: false, kind: 'the question was never asked' }, shown = asked[asked.length - 1] || {};
      row('while a question is open every other change from the window is refused: the answer is for what the question said, and that is what goes on',
        `${asked.length - k3} asked; behind it: ${behind.kind}, the limit still ${limThen}, on ${onThen}; answered: on ${opened.on} with ${opened.limits ? opened.limits.chars : '?'}`,
        '1; busy, 9000, false; true with 9000',
        asked.length - k3 === 1 && behind.ok === false && behind.kind === 'busy' && limThen === 9000 && onThen === false && opened.ok === true && opened.on === true && opened.limits.chars === 9000 && String(shown.detail).includes('up to 9,000 characters'));
      await call('set', { on: false });
      say.push('yes');
      const notTrue = await call('set', { on: true });
      const ipcT = mkIpc(), wt = V.create({ ipcMain: ipcT, safeStorage: mkSafe(), dir: dirOf('word2'), isOwn: () => true, base: fake.base, confirm: () => { throw new Error('no window'); } });
      wt.attach();
      const thrown = keep(await ipcT.handlers['voice:set']({ sender: {} }, { on: true }));
      row('an answer that is not a plain yes is no, and so is a question that could not be put', `${notTrue.kind}, on ${w.status().on}; ${thrown.kind}, on ${wt.status().on}`, 'declined, false; declined, false',
        notTrue.ok === false && notTrue.kind === 'declined' && w.status().on === false && thrown.ok === false && thrown.kind === 'declined' && wt.status().on === false);
    }

    // ---------------------------------------------------------------- 11. the window's calls
    out('\n11. the window\'s calls');
    {
      v.attach();
      const names = Object.keys(ipc.handlers).sort(), sends = Object.keys(ipc.listeners).sort();
      row('eight calls answered and two sent, and no other: status, set, setKey, clearKey, test, speak, open, finish; audio, cancel (the ears\' four, since the ears)', names.join(' ') + '; ' + sends.join(' '),
        V.NAMES.map(n => 'voice:' + n).sort().join(' ') + '; voice:audio voice:cancel',
        same(names, V.NAMES.map(n => 'voice:' + n).sort()) && names.length === 8 && same(sends, ['voice:audio', 'voice:cancel']) && same(V.SENDS, ['audio', 'cancel']));
      // (the ears are switched on first, the window's way round, so that a refused open is refused for who calls, not for the switch)
      v.set({ ears: true });
      own = false;
      const n0 = fake.seen.length, l0 = fake.listens.length, refused = [];
      for (const n of names) {
        const arg = n === 'voice:speak' ? LINE : (n === 'voice:setKey' ? 'another-key-000000' : (n === 'voice:set' ? { on: false } : (n === 'voice:open' ? {} : (n === 'voice:finish' ? 1 : undefined))));
        const r = keep(await ipc.handlers[n]({ sender: {} }, arg)); if (r.ok === false && r.kind === 'shape' && /app's own page/.test(r.why)) refused.push(n);
      }
      ipc.listeners['voice:audio']({ sender: {} }, 1, SOUND(64)); ipc.listeners['voice:cancel']({ sender: {} }, 1);
      own = true;
      const s = keep(await ipc.handlers['voice:status']({ sender: {} }));
      v.set({ ears: false });
      row('a call that is not from the app\'s own page is refused, whichever it is, and does nothing (a sent one, silently)', `${refused.length} of 8 refused; ${fake.seen.length - n0} requests, ${fake.listens.length - l0} sockets; still on ${s.on}, key ${s.hasKey}, listening ${s.listening}`,
        '8 of 8; 0, 0; on, the key kept, not listening',
        refused.length === 8 && fake.seen.length === n0 && fake.listens.length === l0 && s.on === true && s.hasKey === true && s.listening === false && v.listening() === null);
      const BADW = [null, 'x', [], {}, { who: 'Mr Murdoch' }, Object.assign({ model: 'flux-kit-en' }, LINE), Object.assign({ url: 'https://example.com' }, LINE)];
      const n1 = fake.seen.length, wrong = [];
      for (const q of BADW) { const r = keep(await ipc.handlers['voice:speak']({ sender: {} }, q)); if (!(r.ok === false && r.kind === 'shape')) wrong.push(clip(JSON.stringify(q), 40)); }
      const good = keep(await ipc.handlers['voice:speak']({ sender: {} }, LINE));
      row('  through the window, a line of the wrong shape is refused and nothing is sent; one of the right shape is spoken', wrong.length ? wrong.join('; ') : `${BADW.length} refused; ${fake.seen.length - n1} request; then ${good.ok ? 'spoken' : good.kind}`,
        'each refused; 1 request, for the good one; spoken', wrong.length === 0 && fake.seen.length - n1 === 1 && good.ok === true);
    }

    // ================================================================ THE EARS
    // every app made from here on is kept (section 17 holds each to no timer left and nothing open)
    const earsMade = [], ears = (o) => { const x = V.create(o); earsMade.push(x); return x; }, mkE = (name, o) => { const x = mk(name, o); earsMade.push(x); return x; };
    // a run's ears: made, its key kept, switched on (here, not through the window: section 16 holds the question)
    const mkEars = async (name, o) => {
      const msgs = [], e = mkE(name, Object.assign({ send: sendTo(msgs), WebSocket: Watched, bounds: SHORT }, o || {}));
      await e.ready; await e.setKey(KEY); e.set({ ears: true }); e.msgs = msgs; return e;
    };
    const lastListen = () => fake.listens[fake.listens.length - 1] || { query: {}, headers: {}, protocols: [], audio: Buffer.alloc(0), texts: [] };
    const opensNow = () => fake.listens.length;

    // ---------------------------------------------------------------- 12. the ears: off, the key terms, the socket
    out('\n12. the ears: off by default and at every start; the key terms; the socket');
    {
      const dO = dirOf('earsfile');
      fs.writeFileSync(fileOf(dO), JSON.stringify({ v: 1, on: true, ears: true, limits: { chars: 5000, secs: 600 } }));
      const eO = ears({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dO, base: fake.base, WebSocket: Watched }); await eO.ready; await eO.setKey(KEY);
      const sO = keep(eO.status()), l0 = opensNow(), w0 = opened.length, rO = keep(await eO.open({}));
      eO.set({ ears: true, limits: { secs: 900 } }); const fO = JSON.parse(readFile(dO));
      const eO2 = ears({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dO, base: fake.base, WebSocket: Watched }); await eO2.ready;
      const sO2 = keep(eO2.status());
      row('the ears are off by default and at every start: a file that says they are on is not read for it (its limit is), nothing opens, and the switch is never written to the file',
        `${V.DEFAULTS.ears}, ${V.DEFAULTS.limits.secs} s; from the file: ears ${sO.ears}, limit ${sO.limits.secs} s; open: ${rO.kind}, ${opensNow() - l0} sockets; the file then: ears ${fO.ears === undefined ? 'not written' : fO.ears}, limit ${fO.limits.secs}; again: ears ${sO2.ears}, limit ${sO2.limits.secs}`,
        'false, 1800 s; false, 600; off, 0; not written, 900; false, 900',
        V.DEFAULTS.ears === false && V.DEFAULTS.limits.secs === 1800 && sO.ears === false && sO.limits.secs === 600 && rO.ok === false && rO.kind === 'off' && opensNow() === l0 && opened.length === w0
        && fO.ears === undefined && fO.limits.secs === 900 && fO.on === false && sO2.ears === false && sO2.limits.secs === 900 && sO2.listening === false);
      // the key terms: a fixed list of this file's, each one of the order line's own words or the name of a man the
      // player may speak to (site/parts/85_crew_words.js, VOCAB; 87_minds_words.js, the cast)
      const CW = require('../site/parts/85_crew_words.js'), MW = require('../site/parts/87_minds_words.js');
      const vocab = CW.VOCAB.map(x => x.toLowerCase()), cast = MW.CAST.map(c => c.name.toLowerCase());
      const foreign = V.KEYTERMS.filter(k => { const t = k.toLowerCase(); return !vocab.some(x => x.includes(t) || t.includes(x)) && !cast.includes(t); });
      const chars = V.KEYTERMS.join('').length, src = fs.readFileSync(path.join(__dirname, '..', 'app', 'voice.js'), 'utf8');
      row('  the key terms: about twenty, frozen, each a word of the order line\'s grammar or the name of a man on her bridge; far under Deepgram\'s 500 tokens; app/voice.js requires no page file for them',
        `${V.KEYTERMS.length} terms, ${chars} characters${foreign.length ? '; NOT the grammar\'s: ' + foreign.join(', ') : ''}`, '20 to 30, every one the grammar\'s or a man\'s',
        Object.isFrozen(V.KEYTERMS) && V.KEYTERMS.length >= 18 && V.KEYTERMS.length <= 30 && foreign.length === 0 && chars < 400 && !/require\([^)]*site/.test(src));
      // one transmission, watched: where it goes, and what is said on the way
      const e = await mkEars('sock'), lA = opensNow(), wA = opened.length;
      const r = keep(await e.open({}));
      await until(() => e.listening() && e.listening().opened);
      const L = lastListen(), W = opened[opened.length - 1] || { url: '', protocols: [] }, q = L.query;
      const keyIn = Object.keys(L.headers).filter(k => String(L.headers[k]).includes(KEY));
      const wantQ = { model: 'nova-3', language: 'en', interim_results: 'true', punctuate: 'true', smart_format: 'false', mip_opt_out: 'true' };
      // (the men's lines, POST /v2/speak, carry no mip_opt_out: the owner's word opts out the player's own voice alone)
      const speakMip = fake.seen.filter(x => x.path === '/v2/speak' && 'mip_opt_out' in x.query).length;
      row('one socket a transmission, to the one host (here the stand-in, ws: only on this PC): /v1/listen, model nova-3, language en, interim results, PUNCTUATION ON (a spoken question keeps its "?") and no formatting (numbers stay words), the key terms, and mip_opt_out=true (the player\'s voice not kept to improve Deepgram\'s models; the men\'s lines carry none); NO encoding, sample rate or channels (the page sends WebM with Opus, a container)',
        `${r.ok ? 'open ' + r.id : r.kind}; ${opensNow() - lA} socket: ${L.path}?${Object.keys(q).filter(k => k !== 'keyterm').map(k => k + '=' + q[k]).join('&')} and ${(q.keyterm || []).length} key terms; opted out ${L.mipOptOut}; the men's lines with it: ${speakMip}; hosts ${JSON.stringify(e.hosts())}`,
        `open; 1: /v1/listen?model=nova-3&language=en&interim_results=true&punctuate=true&smart_format=false&mip_opt_out=true and ${V.KEYTERMS.length}; true; 0; ["${fake.origin.replace(/^http/, 'ws')}"]`,
        r.ok === true && Number.isInteger(r.id) && same(Object.keys(r).sort(), ['id', 'ok']) && opensNow() - lA === 1 && opened.length - wA === 1 && L.path === '/v1/listen'
        && same(Object.keys(q).sort(), ['interim_results', 'keyterm', 'language', 'mip_opt_out', 'model', 'punctuate', 'smart_format']) && Object.keys(wantQ).every(k => q[k] === wantQ[k])
        && L.mipOptOut === true && speakMip === 0 && fake.seen.some(x => x.path === '/v2/speak')
        && same(q.keyterm, V.KEYTERMS) && !('encoding' in q) && !('sample_rate' in q) && !('channels' in q) && same(e.hosts(), [fake.origin.replace(/^http/, 'ws')])
        && W.url.startsWith(fake.origin.replace(/^http/, 'ws') + '/v1/listen?model=nova-3&language=en&interim_results=true&punctuate=true&smart_format=false&keyterm=') && W.url.endsWith('&mip_opt_out=true'));
      row('  the key goes as the subprotocol pair ["token", key] (Deepgram\'s form for a client that sets no header), and nowhere in the address nor in any other header of the handshake; the stand-in answered "token"',
        `protocols ${JSON.stringify(W.protocols).replace(KEY, 'KEY')}; the key in the address: ${W.url.includes(KEY) || L.search.includes(KEY)}; in the headers: ${keyIn.join(', ')}; ${Object.keys(L.headers).length} headers`,
        'protocols ["token","KEY"]; false; sec-websocket-protocol',
        same(W.protocols, ['token', KEY]) && same(L.protocols, ['token', KEY]) && !W.url.includes(KEY) && !L.search.includes(KEY) && same(keyIn, ['sec-websocket-protocol']) && L.opened === true
        && !Object.keys(L.headers).some(k => /^authorization$/i.test(k)));
      e.cancel(r.id);
    }

    // ---------------------------------------------------------------- 13. a transmission
    out('\n13. a transmission: the sound, the words as they come, and finish\'s three ends');
    {
      const e = await mkEars('tx'), l0 = opensNow();
      const r = await e.open({});
      // three slices at once, before the socket can have opened: queued, then sent first, in their order
      const a1 = e.audio(r.id, SOUND(100, 1)), a2 = e.audio(r.id, SOUND(200, 2)), a3 = e.audio(r.id, new Uint8Array(50).fill(3));
      const q1 = e.listening() ? e.listening().queued : -1;
      await until(() => e.listening() && e.listening().opened);
      const q2 = e.listening() ? e.listening().queued : -1;
      const a4 = e.audio(r.id, SOUND(300, 4));
      await until(() => e.msgs.length >= 1);
      const before = e.msgs.slice();
      const t0 = Date.now(), f = keep(await e.finish(r.id)), ms = Date.now() - t0, L = lastListen();
      const want = Buffer.concat([Buffer.alloc(100, 1), Buffer.alloc(200, 2), Buffer.alloc(50, 3), Buffer.alloc(300, 4)]);
      row('the sound that comes before the socket opens is queued, then sent first and in its order; what comes after goes straight on (an ArrayBuffer or a view of one); the stand-in hears every byte, and CloseStream once at the finish',
        `taken ${[a1, a2, a3, a4].filter(Boolean).length} of 4; queued ${q1} bytes, then ${q2}; heard ${L.audio.length} bytes, ${L.audio.equals(want) ? 'the same, in order' : 'NOT the same'}; texts ${JSON.stringify(L.texts)}`,
        'taken 4; 350, then 0; 650, the same; [CloseStream]',
        a1 && a2 && a3 && a4 && q1 === 350 && q2 === 0 && L.audio.equals(want) && same(L.texts, [{ type: 'CloseStream' }]) && opensNow() - l0 === 1);
      row('  the words heard so far go to the page as they come, as \'voice:heard\' with the transmission\'s id, and to it alone (no other message); finish answers the final words joined with the last interim, at the Metadata',
        `heard while held: ${JSON.stringify(before.map(m => m.slice(0, 3)))}; finish: ${JSON.stringify(f)} in ${ms} ms; all to the page: ${JSON.stringify(e.msgs.map(m => m[2]))}`,
        `[["voice:heard",${r.id},"hard a"]]; {"ok":true,"text":"hard a starboard"}; ["hard a","hard a starboard"]`,
        same(before.map(m => m.slice(0, 3)), [['voice:heard', r.id, 'hard a']]) && same(f, { ok: true, text: 'hard a starboard' }) && ms < 400 && e.msgs.every(m => m[0] === 'voice:heard' && m[1] === r.id && m.length === 3)
        && same(e.msgs.map(m => m[2]), ['hard a', 'hard a starboard']));
      const s = keep(e.status());
      // (the app's close frame reaching the stand-in; and its seconds, a second or two on a busy machine: the review's runs
      // beside a six-thread join saw 2)
      await until(() => !!L.closed, 3000);
      row('  and then it is over: nothing open, the socket closed by the app (a close 1000), its seconds counted, one transmission in the run, no timer left',
        `listening ${s.listening} (${JSON.stringify(e.listening())}); the stand-in saw the close ${JSON.stringify(L.closed)}; ${s.used.secs} s, ${s.used.transmissions} transmission; timers ${e.armed()}`,
        'false (null); {code: 1000}; 1 or 2 s, 1; 0',
        s.listening === false && e.listening() === null && !!L.closed && L.closed.code === 1000 && s.used.secs >= 1 && s.used.secs <= 3 && s.used.transmissions === 1 && e.armed() === 0);
      // the second end: a close 1000 with no Metadata; the third: nothing at all, and finish's own bound. FINAL WORDS ONLY
      // (the review of the ears): "full astern then stop", of which only the interim "full astern" ever came, is no order
      fake.mode = 'nometa';
      const r2 = await e.open({}); e.audio(r2.id, SOUND(64)); await until(() => e.listening() && e.listening().opened);
      const f2 = keep(await e.finish(r2.id));
      fake.mode = 'silent'; fake.heard = 'full astern then stop';
      const r3 = await e.open({}); e.audio(r3.id, SOUND(64)); await until(() => e.listening() && e.listening().opened); await until(() => e.msgs.some(m => m[1] === r3.id));
      const t3 = Date.now(), f3 = keep(await e.finish(r3.id)), ms3 = Date.now() - t3, L3 = lastListen();
      fake.mode = 'ok'; fake.heard = 'hard a starboard';
      await until(() => !!L3.closed, 1500);
      row('  finish\'s other two ends: a close 1000 with no Metadata answers the final words; a Deepgram that says nothing more after the CloseStream answers, at finish\'s own bound (0.4 s here; the app\'s 3.5), NOT the interim as words but "unsure", the words heard so far carried as not final; the socket closed by the app',
        `close 1000: ${JSON.stringify(f2)}; silent: ${JSON.stringify(f3)} in ${ms3} ms, the stand-in saw the close ${JSON.stringify(L3.closed)}; timers ${e.armed()}`,
        '{"ok":true,"text":"hard a starboard"}; unsure, words "full astern", final false, no text, in about 400 ms; {code: 1000}; 0',
        same(f2, { ok: true, text: 'hard a starboard' }) && f3.ok === false && f3.kind === 'unsure' && f3.words === 'full astern' && f3.final === false && !('text' in f3) && typeof f3.why === 'string'
        && ms3 >= 350 && ms3 < 1500 && !!L3.closed && L3.closed.code === 1000 && e.armed() === 0 && e.listening() === null);
      // the stream ended (its Metadata and a close 1000) with words still interim: no order either
      fake.mode = 'nofinal';
      const r4 = await e.open({}); e.audio(r4.id, SOUND(64)); await until(() => e.listening() && e.listening().opened);
      const t4 = Date.now(), f4 = keep(await e.finish(r4.id)), ms4 = Date.now() - t4;
      fake.mode = 'ok';
      row('  a stream that ends (Metadata, a close 1000) with words never made final answers "unsure" at once, those words carried as not final, and no text',
        `${JSON.stringify(f4)} in ${ms4} ms`, 'unsure, words "hard a starboard", final false, at once',
        f4.ok === false && f4.kind === 'unsure' && f4.words === 'hard a starboard' && f4.final === false && !('text' in f4) && ms4 < 300 && e.listening() === null);
      // ... and a close 1000 after the CloseStream with NO Metadata while words still stand interim (the stand-in's
      // 'interimclose'): no order either (the second review of the ears, M26: that close answered the interim as the words)
      fake.mode = 'interimclose';
      const r5 = await e.open({}); e.audio(r5.id, SOUND(64)); await until(() => e.listening() && e.listening().opened);
      const t5 = Date.now(), f5 = keep(await e.finish(r5.id)), ms5 = Date.now() - t5;
      fake.mode = 'ok';
      row('  a close 1000 after the CloseStream with no Metadata, while words still stand interim, answers "unsure" at once, those words carried as not final, and no text: never the interim as the words',
        `${JSON.stringify(f5)} in ${ms5} ms`, 'unsure, words "hard a starboard", final false, at once',
        f5.ok === false && f5.kind === 'unsure' && f5.words === 'hard a starboard' && f5.final === false && !('text' in f5) && ms5 < 300 && e.listening() === null);
      // the wait for the last words counts from the CloseStream itself, which goes once the socket is open (a socket that
      // opens at 300 ms, the key let go at 50 ms, the final 300 ms after the CloseStream): counted from the key's release,
      // the 0.4 s wait would have ended at 450 ms with the interim alone (the review of the ears, p_slowopen)
      class LateSocket {
        constructor() { this.readyState = 0; this.on = {}; this.sent = []; this.timers = []; this.later(300, () => { if (this.readyState !== 0) return; this.readyState = 1; this.emit('open', {}); }); }
        later(ms, f) { this.timers.push(setTimeout(f, ms)); }
        addEventListener(t, f) { (this.on[t] = this.on[t] || []).push(f); }
        emit(t, ev) { for (const f of this.on[t] || []) f(ev); }
        msg(m) { if (this.readyState === 1) this.emit('message', { data: JSON.stringify(m) }); }
        send(x) {
          this.sent.push(typeof x === 'string' ? JSON.parse(x).type : 'audio');
          if (typeof x === 'string') this.later(300, () => { this.msg({ type: 'Results', is_final: true, channel: { alternatives: [{ transcript: 'full astern then stop' }] } }); this.msg({ type: 'Metadata' }); this.close(1000); });
          else if (!this.interim) { this.interim = true; this.later(20, () => this.msg({ type: 'Results', is_final: false, channel: { alternatives: [{ transcript: 'full astern' }] } })); }
        }
        close(code) { if (this.readyState === 3) return; this.readyState = 3; for (const t of this.timers) clearTimeout(t); this.emit('close', { code: code || 1000, reason: '' }); }
      }
      const eLate = await mkEars('lateopen', { WebSocket: LateSocket });
      const rL = await eLate.open({}); eLate.audio(rL.id, SOUND(64));
      await sleep(50);
      const tLo = Date.now(), fL = keep(await eLate.finish(rL.id)), msL = Date.now() - tLo;
      row('  the wait for the last words counts from the CloseStream itself, once the socket has opened and the sound queued before it has gone: a slow handshake does not eat it, and the final words are answered',
        `${JSON.stringify(fL)} ${msL} ms after the key was let go`, '{"ok":true,"text":"full astern then stop"} about 550 ms after',
        same(fL, { ok: true, text: 'full astern then stop' }) && msL >= 450 && msL < 1500 && eLate.armed() === 0);
      row('  the bounds the app keeps (a test may only shorten them): 3 s for the socket to open, 3.5 s for the last words, 30 s a transmission, 10 s for words never asked for',
        JSON.stringify(V.BOUNDS), '{"openMs":3000,"finishMs":3500,"maxMs":30000,"keepMs":10000}',
        same(V.BOUNDS, { openMs: 3000, finishMs: 3500, maxMs: 30000, keepMs: 10000 }) && Object.isFrozen(V.BOUNDS));
    }

    // ---------------------------------------------------------------- 14. its faults; one at a time; its bounds; given up
    out('\n14. its faults; one at a time; the 30 s bound; given up');
    {
      const e = await mkEars('faults');
      const run = async (mode, sound) => {
        fake.mode = mode;
        const r = await e.open({});
        if (sound !== false) { e.audio(r.id, SOUND(64)); await sleep(60); }
        const t0 = Date.now(), f = keep(await e.finish(r.id));
        fake.mode = 'ok';
        return { r, f, ms: Date.now() - t0, timers: e.armed(), open: e.listening() };
      };
      const k401 = await run('401'), drop = await run('drop'), slow = await run('slow', false), bad = await run('badaudio');
      const all = { '401': k401, drop, slow, badaudio: bad };
      row('a refused key (401 on the upgrade) is "auth", and its words say that "Try it" tells whether the key is taken; a socket dropped mid-stream is "network"; one that never opens is "timeout" at the open\'s bound; sound Deepgram cannot read (1008) is "shape"',
        Object.keys(all).map(k => k + ' ' + all[k].f.kind).join(', ') + '; "' + clip(String(k401.f.why), 70) + '"',
        '401 auth, drop network, slow timeout, badaudio shape',
        k401.f.ok === false && k401.f.kind === 'auth' && /"Try it" tells whether the key is taken/.test(k401.f.why) && drop.f.kind === 'network' && slow.f.kind === 'timeout' && bad.f.kind === 'shape' && /1008/.test(bad.f.why)
        && Object.keys(all).every(k => all[k].f.ok === false && typeof all[k].f.why === 'string' && all[k].f.why && all[k].timers === 0 && all[k].open === null));
      row('  each fault is answered at once or by its bound, leaves nothing open and no timer, and its words are the app\'s own',
        Object.keys(all).map(k => k + ' ' + all[k].ms + ' ms').join(', '), 'each under 1.5 s', Object.keys(all).every(k => all[k].ms < 1500));
      // one at a time
      const a = keep(await e.open({})), b = keep(await e.open({}));
      e.audio(a.id, SOUND(64)); const fa = await e.finish(a.id); const c = keep(await e.open({}));
      row('one transmission at a time: a second open while one is open is "busy", and opens nothing; once the first is over another opens',
        `${a.ok ? 'open' : a.kind}, then ${b.ok ? 'OPENED' : b.kind}; after: ${c.ok ? 'open' : c.kind}`, 'open, then busy; after: open', a.ok === true && b.ok === false && b.kind === 'busy' && fa.ok === true && c.ok === true && c.id !== a.id);
      e.cancel(c.id);
      // the bound of a transmission (here 1.5 s; the app's is 30): ended here while the key is still held, it is CUT, its
      // words shown and never given (the review of the ears: it answered half a sentence as an order)
      // (this transmission's own socket, as the stand-in records it: not the one before it)
      const lm = opensNow(), t0 = Date.now(), m = await e.open({}); e.audio(m.id, SOUND(64));
      await until(() => e.listening() && e.listening().state === 'done', 4000);
      const atCut = Date.now() - t0, late = e.audio(m.id, SOUND(64)), Lm = fake.listens[lm] || { texts: [] };
      await until(() => !!Lm.closed, 1000);
      const fm = keep(await e.finish(m.id));
      row('  a transmission held past its bound is CUT by the app itself: the socket closed (no CloseStream), no more sound taken, and finish answers "cut", the words heard so far carried as not final, no text',
        `cut after ${atCut} ms; sound after it ${late ? 'TAKEN' : 'dropped'}; CloseStream sent ${Lm.texts.some(x => x && x.type === 'CloseStream')}, the close ${JSON.stringify(Lm.closed)}; finish: ${JSON.stringify(fm)}; timers ${e.armed()}`,
        'about 1500 ms; dropped; false, {code: 1000}; cut, words "hard a", final false; 0',
        atCut >= 1400 && atCut < 3000 && late === false && !Lm.texts.some(x => x && x.type === 'CloseStream') && !!Lm.closed && Lm.closed.code === 1000
        && fm.ok === false && fm.kind === 'cut' && fm.words === 'hard a' && fm.final === false && !('text' in fm) && /30|1\.5/.test(fm.why) && e.armed() === 0 && e.listening() === null);
      const k0 = Date.now(), n = await e.open({}); e.audio(n.id, SOUND(64));
      await until(() => e.listening() === null, 5000);
      const gone = Date.now() - k0, fn = keep(await e.finish(n.id)), again = keep(await e.open({}));
      row('  words never asked for are let go after their own bound (here 0.6 s past the end; the app\'s is 10): then that transmission is no more, and the next opens',
        `let go after ${gone} ms; finish then: ${fn.kind}; the next: ${again.ok ? 'open' : again.kind}`, 'about 2.5 s; shape; open',
        gone >= 1900 && gone < 4500 && fn.ok === false && fn.kind === 'shape' && again.ok === true);
      e.cancel(again.id);
      // given up: by cancel, by the ears off, by the key forgotten, by the page gone
      // (the stand-in says nothing at the CloseStream here, so that the finish is still awaited when it is given up)
      const gaveUp = [];
      fake.mode = 'silent';
      for (const how of ['cancel', 'ears off', 'key forgotten', 'page gone']) {
        const x = await e.open({}); e.audio(x.id, SOUND(64)); await until(() => e.listening() && e.listening().opened); const L = lastListen();
        const waiting = e.finish(x.id);
        await until(() => e.listening() && e.listening().waiting === 1, 300);
        const heardBefore = L.audio.length;
        if (how === 'cancel') e.cancel(x.id); else if (how === 'ears off') e.set({ ears: false }); else if (how === 'key forgotten') e.clearKey(); else e.pageGone();
        const w = keep(await waiting), took = e.audio(x.id, SOUND(64));
        await until(() => !!L.closed, 1000);
        gaveUp.push({ how, kind: w.kind, closed: L.closed ? L.closed.code : null, more: L.audio.length - heardBefore, took, open: e.listening(), timers: e.armed() });
        if (how === 'ears off') e.set({ ears: true });
        if (how === 'key forgotten') await e.setKey(KEY);
      }
      fake.mode = 'ok';
      row('given up by cancel, by the ears going off, by the key forgotten, or by the page going away: the socket is closed at once (1000), a finish awaited is answered why, nothing more is taken, no timer is left',
        gaveUp.map(g => g.how + ': ' + g.kind + ', close ' + g.closed + ', +' + g.more + ' bytes').join('; '), 'cancelled, off, no-key, cancelled; each close 1000, +0',
        same(gaveUp.map(g => g.kind), ['cancelled', 'off', 'no-key', 'cancelled']) && gaveUp.every(g => g.closed === 1000 && g.more === 0 && g.took === false && g.open === null && g.timers === 0));
      // the coordinator's condition 2: frames are taken only inside an open transmission, by the window's own send too
      const ipcF = mkIpc(), eF = await mkEars('frames', { ipcMain: ipcF, isOwn: () => true }); eF.attach();
      const sendF = (id, b) => ipcF.listeners['voice:audio']({ sender: {} }, id, b);
      const lF = opensNow(), none = eF.audio(1, SOUND(64)); sendF(1, SOUND(64));
      const f1 = await eF.open({}); eF.audio(f1.id, SOUND(10, 5)); await until(() => eF.listening() && eF.listening().opened);
      const unknown = eF.audio(f1.id + 7, SOUND(64)); sendF(f1.id + 7, SOUND(64));
      await eF.finish(f1.id);
      const afterFinish = eF.audio(f1.id, SOUND(64)); sendF(f1.id, SOUND(64));
      const f2 = await eF.open({}); eF.audio(f2.id, SOUND(10, 6)); await until(() => eF.listening() && eF.listening().opened);
      const L2 = fake.listens[fake.listens.length - 1]; eF.cancel(f2.id);
      const afterCancel = eF.audio(f2.id, SOUND(64)); sendF(f2.id, SOUND(64));
      await until(() => !!L2.closed, 1000);
      const heardF = fake.listens.slice(lF).map(x => x.audio.length), sF = keep(eF.status());
      row('frames are taken only inside an open transmission: with none open, of an unknown id, after its finish or after its cancel (by a plain call or the window\'s own send) a frame is dropped, sent nowhere and counted nowhere',
        `taken: none ${none}, unknown ${unknown}, after finish ${afterFinish}, after cancel ${afterCancel}; the stand-in heard ${JSON.stringify(heardF)} bytes; ${sF.used.transmissions} transmissions; open ${JSON.stringify(eF.listening())}`,
        'all false; [10,10]; 2; null', none === false && unknown === false && afterFinish === false && afterCancel === false && same(heardF, [10, 10]) && sF.used.transmissions === 2 && eF.listening() === null);
      // ... and the run's limit of seconds ends a transmission itself: here 1.4 s are left of 60 when it opens (by a clock
      // that jumped 58.6 s through the one before); its own 30 s bound is left as the app's, so only the limit can end it
      let clockL = 0;
      const eL = await mkEars('limitend', { now: () => clockL, bounds: { openMs: 400, finishMs: 400, keepMs: 3000 } });
      eL.set({ limits: { secs: 60 } });
      const la = await eL.open({}); eL.audio(la.id, SOUND(64)); await until(() => eL.listening() && eL.listening().opened);
      clockL += 58600; await eL.finish(la.id);
      const lL = opensNow(), tL = Date.now(), lb = keep(await eL.open({})); eL.audio(lb.id, SOUND(64));
      await until(() => eL.listening() && eL.listening().opened);
      clockL += 1400;                                                          // (the counting clock, as the socket lives its 1.4 s)
      await until(() => eL.listening() && eL.listening().state === 'done', 5000);
      const endedAt = Date.now() - tL, lateL = eL.audio(lb.id, SOUND(64)), LL = fake.listens[lL] || { texts: [] };
      const flb = keep(await eL.finish(lb.id)), sL = keep(eL.status()), lc = keep(await eL.open({}));
      row('  the run\'s limit of seconds ends a transmission itself: with 1.4 s left when it opens, the app CUTS it then (its 30 s bound untouched; no CloseStream), takes no more sound, and finish answers "cut", the words not final; the limit then spent, the next is "budget"',
        `${lb.ok ? 'open' : lb.kind}; cut after ${endedAt} ms; sound after it ${lateL ? 'TAKEN' : 'dropped'}; CloseStream sent ${LL.texts.some(x => x && x.type === 'CloseStream')}; finish ${JSON.stringify(flb)}; ${sL.used.secs} of ${sL.limits.secs} s; the next: ${lc.ok ? 'OPENED' : lc.kind}`,
        'open; about 1400 ms; dropped; false; cut (the run\'s limit), words "hard a", final false; 60 of 60; budget',
        lb.ok === true && endedAt >= 1300 && endedAt < 3000 && lateL === false && !LL.texts.some(x => x && x.type === 'CloseStream')
        && flb.ok === false && flb.kind === 'cut' && /limit/.test(flb.why) && flb.words === 'hard a' && flb.final === false && sL.used.secs === 60 && lc.ok === false && lc.kind === 'budget' && eL.armed() === 0);
      // the transmission's bound is kept while the last words are awaited (the second review of the ears, M24): a key let go
      // near the bound (here 1 s; the app's 30) whose last words never come (the stand-in says nothing after the CloseStream)
      // is answered at that bound, "unsure", not at the end of the wait for them (here 3 s; the app's 3.5), which runs past it
      fake.mode = 'silent';
      const eM = await mkEars('maxwhilefinishing', { bounds: { openMs: 400, finishMs: 3000, maxMs: 1000, keepMs: 600 } });
      const tM = Date.now(), mM = await eM.open({}); eM.audio(mM.id, SOUND(64)); await until(() => eM.listening() && eM.listening().opened);
      await until(() => eM.msgs.some(x => x[1] === mM.id), 300);
      const letGoM = Date.now() - tM, fM = keep(await eM.finish(mM.id)), atM = Date.now() - tM;
      fake.mode = 'ok';
      row('  a transmission let go near its bound (here 1 s; the app\'s 30) whose last words never come is answered at that bound, "unsure", the words not final: the bound is kept while the last words are awaited (here 3 s; the app\'s 3.5), not only while the key is held',
        `let go at ${letGoM} ms; answered ${fM.ok === false ? fM.kind : 'ok'}, words "${fM.words}", ${atM} ms from the open; open ${JSON.stringify(eM.listening())}, timers ${eM.armed()}`,
        'unsure, "hard a", about 1000 ms from the open (not 3000 after the let-go); null, 0',
        letGoM < 900 && fM.ok === false && fM.kind === 'unsure' && fM.words === 'hard a' && fM.final === false && atM >= 900 && atM < 2500 && eM.listening() === null && eM.armed() === 0);
      // THE REVIEWS OF THE EARS, finding 4 and its regression: a transmission given up while its socket connects leaves no
      // client socket standing, its handshake let go at once (by cancel, or at the open bound), even where the server never
      // answers it (the second review: a handshake left alone held its connection until Node's own header timeout, some
      // 300 s). Counted on a stand-in of its own, so that no other connection to it (the voices' fetches) is counted.
      // And a socket that opens all the same, with no transmission owning it, is closed then, with a close frame
      const fake2 = await Fake.start(); fake2.mode = 'slow';
      const clientSockets = () => process._getActiveHandles().filter(h => h && h.constructor && h.constructor.name === 'Socket' && h.remotePort === fake2.port && !h.destroyed).length;
      const eC = await mkEars('connecting', { base: fake2.base });
      for (let i = 0; i < 3; i++) { const c = await eC.open({}); await until(() => fake2.listens.length > i, 1000); eC.cancel(c.id); }
      const cb = await eC.open({}), fcb = keep(await eC.finish(cb.id));                 // left to the open bound (0.4 s here)
      const atOnce = clientSockets();
      await until(() => clientSockets() === 0, 1500);
      const standing = clientSockets(), heldUp = fake2.listens.length;
      await fake2.close();
      const stub = [];
      class StubbornSocket {        // a socket whose close() while it connects does not stop it opening
        constructor() { this.readyState = 0; this.on = {}; this.rec = { closeWhileConnecting: 0, closedOpen: null }; stub.push(this.rec); setTimeout(() => { if (this.readyState !== 0) return; this.readyState = 1; this.emit('open', {}); }, 120); }
        addEventListener(t, f) { (this.on[t] = this.on[t] || []).push(f); }
        emit(t, ev) { for (const f of this.on[t] || []) f(ev); }
        send() {}
        close(code) { if (this.readyState === 0) { this.rec.closeWhileConnecting++; return; } if (this.readyState === 1) { this.rec.closedOpen = code; this.readyState = 3; this.emit('close', { code, reason: '' }); } }
      }
      const eStub = await mkEars('stubborn', { WebSocket: StubbornSocket }), sx = await eStub.open({}); eStub.cancel(sx.id);
      await until(() => !!stub[0] && stub[0].closedOpen !== null, 1000);
      row('  a transmission given up while its socket connects (by cancel, or at the 3 s open bound), the handshake never answered, leaves no client socket standing; a socket that opens all the same with no owner is closed then, with a close frame (1000)',
        `${heldUp} handshakes held; client sockets ${atOnce} at once, then ${standing} (the open bound: ${fcb.kind}); the socket that opened all the same: close() while connecting ${stub[0] ? stub[0].closeWhileConnecting : '?'}, then closed ${stub[0] ? stub[0].closedOpen : '?'}; open ${JSON.stringify(eC.listening())}, timers ${eC.armed()}`,
        '4 held; 0 (timeout); 1, then 1000; null, 0',
        heldUp === 4 && standing === 0 && fcb.kind === 'timeout' && !!stub[0] && stub[0].closeWhileConnecting === 1 && stub[0].closedOpen === 1000 && eC.listening() === null && eC.armed() === 0 && eStub.listening() === null);
      // finding 5: the settings cannot be written (voice.json.tmp made a folder): the ears off, or the key forgotten, close
      // the transmission all the same, before the settings are written
      const savers = [];
      for (const how of ['ears off', 'key forgotten']) {
        const ipcS = mkIpc(), eS = await mkEars('savefail-' + how.replace(' ', '-'), { ipcMain: ipcS, isOwn: () => true }); eS.attach();
        const dS = dirOf('savefail-' + how.replace(' ', '-'));
        const s1 = await eS.open({}); eS.audio(s1.id, SOUND(10)); await until(() => eS.listening() && eS.listening().opened);
        const LS = lastListen(); await until(() => LS.audio.length >= 10);
        fs.mkdirSync(path.join(dS, 'voice.json.tmp'));
        const ans = how === 'ears off' ? keep(await ipcS.handlers['voice:set']({ sender: {} }, { ears: false })) : keep(await ipcS.handlers['voice:clearKey']({ sender: {} }));
        const before = LS.audio.length; ipcS.listeners['voice:audio']({ sender: {} }, s1.id, SOUND(500));
        await until(() => !!LS.closed, 1000);
        savers.push({ how, answered: ans.ok === false ? ans.kind : 'ok', more: LS.audio.length - before, closed: LS.closed ? LS.closed.code : null, open: eS.listening(), ears: eS.earsOn() });
        fs.rmdirSync(path.join(dS, 'voice.json.tmp'));
      }
      row('  the settings that cannot be written (the file\'s temporary made a folder) do not keep a transmission open: the ears off, or the key forgotten, close it first (1000), and no more sound reaches Deepgram',
        savers.map(x => x.how + ': the call ' + x.answered + ', +' + x.more + ' bytes, close ' + x.closed + ', open ' + JSON.stringify(x.open)).join('; '), 'each: +0 bytes, close 1000, open null',
        savers.every(x => x.more === 0 && x.closed === 1000 && x.open === null) && savers[0].ears === false);
      // the mutations that survived the review: sound while finishing (A06); the state set to 'open' once it is; the 3 s
      // open bound by itself, with no finish to end it (A16); a key that is not a token (A26)
      fake.mode = 'silent';
      const eA = await mkEars('a06'), a1 = await eA.open({}); eA.audio(a1.id, SOUND(10)); await until(() => eA.listening() && eA.listening().opened);
      const stOpen = eA.listening().state, LA = lastListen();
      const waitingA = eA.finish(a1.id); await until(() => eA.listening() && eA.listening().waiting === 1, 300);
      const stFin = eA.listening().state, bytesA = LA.audio.length, tookA = eA.audio(a1.id, SOUND(64));
      await sleep(80); const moreA = LA.audio.length - bytesA;
      eA.cancel(a1.id); await waitingA;
      fake.mode = 'ok';
      row('  the socket open, its transmission is "open"; once the key is let go ("finishing") no more sound is taken, and none reaches Deepgram',
        `${stOpen}, then ${stFin}; sound then ${tookA ? 'TAKEN' : 'dropped'}, +${moreA} bytes`, 'open, then finishing; dropped, +0',
        stOpen === 'open' && stFin === 'finishing' && tookA === false && moreA === 0);
      fake.mode = 'slow';
      const eO3 = await mkEars('a16'), t16 = Date.now(), o16 = await eO3.open({});
      await until(() => eO3.listening() && eO3.listening().state === 'done', 3000);
      const at16 = Date.now() - t16, f16 = keep(await eO3.finish(o16.id));
      fake.mode = 'ok';
      row('  a socket that never opens ends at its own open bound (0.4 s here; the app\'s is 3), with no finish to end it: "timeout"',
        `done after ${at16} ms; finish then: ${f16.kind}`, 'about 400 ms; timeout', at16 >= 350 && at16 < 1200 && f16.kind === 'timeout' && eO3.armed() === 0);
      const eT = mkE('a26', { WebSocket: Watched }); await eT.ready; eT.set({ ears: true });
      const notToken = 'test-key:0123456789-not-a-token', kept26 = keep(await eT.setKey(notToken)), w26 = opened.length, o26 = keep(await eT.open({}));
      row('  a key kept that is not a token of RFC 6455 (a ":" in it) is refused before any socket is made, in the app\'s own words, and the key is not in them',
        `kept ${kept26.hasKey}; open: ${o26.kind}: "${clip(String(o26.why), 70)}"; ${opened.length - w26} sockets made`, 'true; auth: "...cannot carry..."; 0',
        kept26.hasKey === true && o26.ok === false && o26.kind === 'auth' && /cannot carry/.test(o26.why) && !String(o26.why).includes(notToken) && opened.length === w26);
    }

    // ---------------------------------------------------------------- 15. off, no key, the limit in seconds; the shapes
    out('\n15. off, no key, the run\'s limit in seconds; the shape of every call');
    {
      const l0 = opensNow(), w0 = opened.length;
      const eOff = mkE('earsoff', { WebSocket: Watched }); await eOff.ready; await eOff.setKey(KEY);
      const off = keep(await eOff.open({}));
      const eNo = mkE('earsnokey', { WebSocket: Watched }); await eNo.ready; eNo.set({ ears: true });
      const noKey = keep(await eNo.open({}));
      row('the ears off (a key kept), or on with no key: open answers why in plain words, and no socket is opened', `${off.kind}: ${off.why}; ${noKey.kind}: ${noKey.why}; ${opensNow() - l0} sockets`,
        'off; no-key; 0', off.ok === false && off.kind === 'off' && noKey.ok === false && noKey.kind === 'no-key' && opensNow() === l0 && opened.length === w0);
      // the run's limit, in seconds heard from a socket's opening to its end: a clock that jumps 61 s while one is open
      let clock = 0;
      const eB = await mkEars('budget', { now: () => clock });
      eB.set({ limits: { secs: 60 } });
      const b1 = await eB.open({}); eB.audio(b1.id, SOUND(64)); await until(() => eB.listening() && eB.listening().opened);
      clock += 61000;
      const during = keep(eB.status()).used.secs;
      // (sockets counted as they are made, by the watched WebSocket: the stand-in hears of one a moment later)
      const fb = await eB.finish(b1.id), sB = keep(eB.status()), wB = opened.length, b2 = keep(await eB.open({})), wB2 = opened.length;
      eB.set({ limits: { secs: 120 } }); const b3 = keep(await eB.open({}));
      row('the run\'s limit is in seconds heard, counted from a socket\'s opening to its end (an open one\'s so far shown): spent, open answers "budget" and opens nothing; raised, it opens again',
        `while open: ${during} s; after: ${sB.used.secs} of ${sB.limits.secs} s; then ${b2.ok ? 'OPENED' : b2.kind} (${wB2 - wB} sockets); raised to 120: ${b3.ok ? 'open' : b3.kind} (${opened.length - wB2} socket)`,
        '61 s; 61 of 60; budget (0); open (1)',
        fb.ok === true && during === 61 && sB.used.secs === 61 && b2.ok === false && b2.kind === 'budget' && wB2 === wB && b3.ok === true && opened.length === wB2 + 1);
      if (b3.ok) eB.cancel(b3.id);
      const lim = [];
      for (const p of [{ limits: { secs: 59 } }, { limits: { secs: 14401 } }, { limits: { secs: 90.5 } }, { limits: { secs: '600' } }, { ears: 'yes' }, { ears: 1 }]) { const x = keep(eB.set(p)); if (!(x.ok === false && x.kind === 'shape')) lim.push(JSON.stringify(p)); }
      const okL = keep(eB.set({ limits: { secs: 14400 } })), okL2 = keep(eB.set({ limits: { secs: 60 } }));
      row('  the limit is 60 to 14,400 seconds (1 minute to 4 hours), a whole number, kept in the file as the characters\' limit is; the switch is on or off', lim.length ? 'TAKEN: ' + lim.join(' ') : `6 refused; 14400 and 60 taken; the file ${JSON.parse(readFile(dirOf('budget'))).limits.secs}`,
        '6 refused; taken; 60', lim.length === 0 && okL.limits.secs === 14400 && okL2.limits.secs === 60 && JSON.parse(readFile(dirOf('budget'))).limits.secs === 60);
      // the shape of every call
      const e = await mkEars('shapes'), l1 = opensNow();
      const badOpen = [];
      for (const x of [{ keyterm: 'x' }, { url: 'wss://example.com' }, { model: 'nova-2' }, 'x', [], null, 7]) { const r = keep(await e.open(x)); if (!(r.ok === false && r.kind === 'shape')) badOpen.push(JSON.stringify(x)); }
      row('  open takes nothing but an empty object: a key term, an address or a model named by the page, or anything not an object, is refused, and no socket opened', badOpen.length ? 'TAKEN: ' + badOpen.join(' ') : `7 refused; ${opensNow() - l1} sockets`, '7 refused; 0', badOpen.length === 0 && opensNow() === l1);
      fake.mode = 'slow';
      const r = await e.open({});
      const BADA = [[r.id + 1, SOUND(8)], [String(r.id), SOUND(8)], [r.id, 'not bytes'], [r.id, SOUND(0)], [r.id, SOUND(65537)], [r.id, null], [r.id, [1, 2, 3]], [r.id, { byteLength: 8 }]];
      const badA = BADA.filter(([id, b]) => e.audio(id, b) !== false).map(([id, b]) => String(id) + ' ' + Object.prototype.toString.call(b));
      const q0 = e.listening().queued;
      let taken = 0; for (let i = 0; i < 17; i++) if (e.audio(r.id, SOUND(65536))) taken++;
      const q1 = e.listening().queued;
      row('  a slice of sound of another transmission, not bytes, empty, or larger than 64 kB is dropped; while the socket opens at most 1 MB is queued',
        `${badA.length ? 'TAKEN: ' + badA.join(', ') : BADA.length + ' dropped'}; queued ${q0}, then ${taken} of 17 slices of 64 kB (${q1} bytes)`, `${BADA.length} dropped; 0, then 16 (1048576)`,
        badA.length === 0 && q0 === 0 && taken === 16 && q1 === 1048576);
      const fq = keep(await e.finish(r.id));
      fake.mode = 'ok';
      const BADF = ['1', 1.5, null, {}, 999];
      const badF = []; for (const x of BADF) { const y = keep(await e.finish(x)); if (!(y.ok === false && y.kind === 'shape')) badF.push(JSON.stringify(x)); }
      const cx = [e.cancel('1'), e.cancel(999), e.cancel(null)];
      const big = await e.open({}); await until(() => e.listening() && e.listening().opened);
      let bigTaken = 0; for (let i = 0; i < 40; i++) if (e.audio(big.id, SOUND(65536))) bigTaken++;
      const fBig = await e.finish(big.id);
      row('  finish of no transmission open is "shape"; cancel of one not open does nothing; a transmission takes 2 MB of sound in all, no more (a slow socket\'s queue is let go by its fault)',
        `${fq.kind} for the slow one; ${badF.length ? 'TAKEN: ' + badF.join(' ') : BADF.length + ' refused'}; cancels ${JSON.stringify(cx)}; ${bigTaken} of 40 slices of 64 kB (${bigTaken * 64} kB), finished ${fBig.ok}`,
        `timeout; ${BADF.length} refused; [false,false,false]; 32 (2048 kB), true`,
        fq.kind === 'timeout' && badF.length === 0 && same(cx, [false, false, false]) && bigTaken === 32 && fBig.ok === true && e.armed() === 0);
    }

    // ---------------------------------------------------------------- 16. the player's word; the microphone's rule; the guard
    out('\n16. the player\'s own word for the ears; the microphone\'s rule; the socket\'s guard');
    {
      const ipcW = mkIpc(), asked = [], say = [];
      const w = ears({ ipcMain: ipcW, safeStorage: mkSafe(), dir: dirOf('earsword'), isOwn: () => true, base: fake.base, WebSocket: Watched, bounds: SHORT,
        confirm: (q) => { asked.push(q); return Promise.resolve(say.length ? say.shift() : true); } });
      w.attach();
      const call = (name, arg) => ipcW.handlers['voice:' + name]({ sender: {} }, arg).then(keep);
      await call('setKey', KEY);
      await call('set', { limits: { secs: 1200 } });
      const quiet = asked.length, l0 = opensNow();
      say.push(false);
      const no = await call('set', { ears: true }), stillOff = await call('status'), noOpen = await call('open', {});
      const yes = await call('set', { ears: true }), q0 = asked[asked.length - 1] || {};
      row('off, the ears\' limit is not asked; switching them on is: declined, nothing changes and nothing opens; confirmed, they are on',
        `${quiet} asked while off; declined: ${no.kind}, ears ${stillOff.ears}, open: ${noOpen.kind}, ${opensNow() - l0} sockets; confirmed: ears ${yes.ears}; asked: ${asked.map(q => q.kind).join(', ')}`,
        '0; declined, false, off, 0; true; ears, ears',
        quiet === 0 && no.ok === false && no.kind === 'declined' && stillOff.ears === false && noOpen.kind === 'off' && opensNow() === l0 && yes.ok === true && yes.ears === true && same(asked.map(q => q.kind), ['ears', 'ears']));
      const d = String(q0.detail), wsO = fake.origin.replace(/^http/, 'ws');
      row('  the question names Deepgram and the one address, says that what he says while he holds the key is sent as sound to be turned into words, that nothing is sent while he does not hold it, the billing per minute, and the run\'s limit in minutes',
        clip(String(q0.message) + ' ' + d, 140), 'Deepgram at ' + wsO + '; as sound; nothing while not held; per minute; 20 minutes',
        q0.title === 'Speaking to the bridge' && q0.message === 'Switch on speaking to the bridge?' && d.includes('to Deepgram at ' + wsO + ',') && d.includes('while you hold the key') && d.includes('as sound, to be turned into words')
        && d.includes('Nothing is sent while you do not hold it') && d.includes('per minute heard') && d.includes('up to 20 minutes') && q0.yes === 'Switch on' && q0.no === 'Cancel' && q0.origin === wsO);
      const k1 = asked.length;
      await call('set', { limits: { secs: 600 } });
      const k2 = asked.length;
      say.push(false);
      const up1 = await call('set', { limits: { secs: 3600 } }), lim1 = w.status().limits.secs;
      const up2 = await call('set', { limits: { secs: 3600 } }), lim2 = w.status().limits.secs, ql = asked[asked.length - 1] || {};
      const both = await call('set', { on: true, limits: { secs: 7200 } }), k3 = asked.length;
      row('  on: a lower limit is not asked; a higher one is (declined, it stays; confirmed, it is raised; the question says both figures); a patch that would need two questions (the voices and the ears at once) is refused unasked',
        `${k2 - k1} asked for the lower; ${up1.kind}, ${lim1}; then ${lim2}; "${clip(String(ql.detail), 70)}"; both at once: ${both.kind}, asked ${k3 - (k2 + 2)}`,
        '0; declined, 600; 3600; up to 60 minutes (now 10 minutes); shape, 0',
        k2 === k1 && up1.ok === false && up1.kind === 'declined' && lim1 === 600 && up2.ok === true && lim2 === 3600 && ql.kind === 'ears-limits' && ql.message === 'Raise this run\'s limit for speaking to the bridge?'
        && String(ql.detail).includes('up to 60 minutes of what you say (now 10 minutes)') && both.ok === false && both.kind === 'shape' && k3 === k2 + 2 && w.status().on === false);
      // through the window: open, the sound sent, finish; the words heard reach main.js's send (here a stand-in)
      const msgs = [], ipcX = mkIpc(), x = ears({ ipcMain: ipcX, safeStorage: mkSafe(), dir: dirOf('earswin'), isOwn: () => true, base: fake.base, WebSocket: Watched, bounds: SHORT, send: sendTo(msgs) });
      x.attach(); await x.setKey(KEY); x.set({ ears: true });
      const o1 = keep(await ipcX.handlers['voice:open']({ sender: {} }, {}));
      ipcX.listeners['voice:audio']({ sender: {} }, o1.id, SOUND(500));
      ipcX.listeners['voice:audio']({ sender: {} }, o1.id, new Uint8Array(20));
      await until(() => msgs.length >= 1);
      const fx = keep(await ipcX.handlers['voice:finish']({ sender: {} }, o1.id)), Lx = lastListen();
      row('  through the window\'s own calls: open, two slices sent (an ArrayBuffer and a view), finish: the stand-in hears the bytes, the page is told the words',
        `${o1.ok ? 'open' : o1.kind}; heard ${Lx.audio.length} bytes; ${JSON.stringify(fx)}; told ${msgs.length}`, 'open; 520; {"ok":true,"text":"hard a starboard"}; 2',
        o1.ok === true && Lx.audio.length === 520 && same(fx, { ok: true, text: 'hard a starboard' }) && msgs.length === 2);
      // the microphone's rule: main.js's two permission handlers apply it (a request's and a check's), with the ears'
      // switch as it stands when they are asked (the coordinator's condition 1)
      const A = 'titanic://app/', M = (p, own, origins, types, ears) => V.microphoneAllowed(p, own, origins, types, A, ears === undefined ? true : ears);
      const cases = [
        ['a request: audio, the app\'s page, the ears on', M('media', true, [A + 'index.html', A], ['audio']), true],
        ['a check: audio, the origin without its slash, the ears on', M('media', true, ['titanic://app', A + 'index.html', undefined], ['audio']), true],
        ['the same request with the ears off', M('media', true, [A + 'index.html', A], ['audio'], false), false],
        ['the same check with the ears off', M('media', true, ['titanic://app', A + 'index.html', undefined], ['audio'], false), false],
        ['the ears\' switch read as anything but true', M('media', true, [A], ['audio'], 1) || M('media', true, [A], ['audio'], 'true') || M('media', true, [A], ['audio'], null), false],
        ['video', M('media', true, [A], ['video']), false],
        ['audio and video', M('media', true, [A], ['audio', 'video']), false],
        ['no media named', M('media', true, [A], []), false],
        ['a check of unknown media', M('media', true, [A], ['unknown']), false],
        ['another window', M('media', false, [A], ['audio']), false],
        ['another origin', M('media', true, ['https://example.com/'], ['audio']), false],
        ['the app\'s page and another origin', M('media', true, [A + 'index.html', 'https://example.com/'], ['audio']), false],
        ['a look-alike origin', M('media', true, ['titanic://app.evil/'], ['audio']), false],
        ['a longer name', M('media', true, ['titanic://appx/'], ['audio']), false],
        ['no origin given', M('media', true, [undefined, null, ''], ['audio']), false],
        ['display capture', M('display-capture', true, [A], ['audio']), false],
        ['notifications', M('notifications', true, [A], ['audio']), false],
        ['the clipboard', M('clipboard-sanitized-write', true, [A], ['audio']), false],
      ];
      const wrongM = cases.filter(c => c[1] !== c[2]).map(c => c[0]);
      row('the microphone\'s one rule (main.js\'s request and check handlers both): "media" for audio alone, asked by this window\'s own page from titanic://app/, ONLY WHILE THE EARS ARE ON; with them off, video, both, another window or origin, display capture and every other permission refused',
        wrongM.length ? 'WRONG: ' + wrongM.join('; ') : cases.length + ' cases, each as it should be', '2 granted, 16 refused', wrongM.length === 0);
      // ... and the switch it reads: the app's own earsOn(), as it stands at each asking
      const eo = ears({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dirOf('earsonrule'), base: fake.base }); await eo.ready;
      const seq = [eo.earsOn()]; eo.set({ ears: true }); seq.push(eo.earsOn()); eo.set({ limits: { secs: 61 } }); seq.push(eo.earsOn()); eo.set({ ears: false }); seq.push(eo.earsOn());
      const dOn = dirOf('earsonfile'); fs.writeFileSync(fileOf(dOn), JSON.stringify({ v: 1, ears: true }));
      const eoF = ears({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dOn, base: fake.base }); await eoF.ready;
      row('  the switch the handlers read (earsOn) is the ears\' own as it stands: off at the start (whatever a file says), on once switched on, off once switched off; so the microphone is refused again the moment they go off',
        `${JSON.stringify(seq)}; from a file saying on: ${eoF.earsOn()}`, '[false,true,true,false]; false', same(seq, [false, true, true, false]) && eoF.earsOn() === false && typeof eo.earsOn === 'function');
      // the socket's guard: the one origin, wss (ws only to this PC), refused before anything is opened
      const P = fake.port, g = V.socketGuard('ws://127.0.0.1:' + P, []), gd = V.socketGuard('wss://api.deepgram.com', []), gfar = V.socketGuard('ws://203.0.113.5:80', []);
      const tryG = (f, u) => { try { f(u); return 'taken'; } catch (err) { return err instanceof V.VoiceError && err.kind === 'guard' ? 'refused' : 'threw otherwise'; } };
      const gcases = [
        [tryG(g, 'ws://127.0.0.1:' + P + '/v1/listen?model=nova-3'), 'taken'], [tryG(g, 'ws://203.0.113.5:' + P + '/v1/listen'), 'refused'], [tryG(g, 'ws://127.0.0.1:' + (P + 1) + '/v1/listen'), 'refused'],
        [tryG(g, 'wss://api.deepgram.com.evil.test/v1/listen'), 'refused'], [tryG(g, 'ws://user:pw@127.0.0.1:' + P + '/v1/listen'), 'refused'], [tryG(g, 'not an address'), 'refused'],
        [tryG(gd, 'wss://api.deepgram.com/v1/listen?model=nova-3'), 'taken'], [tryG(gd, 'ws://api.deepgram.com/v1/listen'), 'refused'], [tryG(gfar, 'ws://203.0.113.5:80/v1/listen'), 'refused'],
      ];
      // the app made for Deepgram itself opens wss://api.deepgram.com/v1/listen, with a socket that never connects
      const made = [];
      class NoNet { constructor(u, p) { made.push({ url: String(u), protocols: p }); this.readyState = 0; } addEventListener() {} send() {} close() { this.readyState = 3; } }
      const real = ears({ ipcMain: mkIpc(), safeStorage: mkSafe(), dir: dirOf('earsreal'), WebSocket: NoNet }); await real.ready; await real.setKey(KEY); real.set({ ears: true });
      const ro = keep(await real.open({})); real.cancel(ro.id);
      const m0 = made[0] || { url: '', protocols: [] };
      row('  the socket\'s guard: the one origin, by wss, or ws to a stand-in on this PC only; any other host, port or scheme, a name and password, or a ws address not on this PC is refused before anything is opened; Deepgram\'s own is wss://api.deepgram.com',
        `${gcases.filter(c => c[0] === c[1]).length} of ${gcases.length} as they should be; for Deepgram: ${m0.url.split('?')[0]}, hosts ${JSON.stringify(real.hosts())}`,
        `${gcases.length} of ${gcases.length}; wss://api.deepgram.com/v1/listen, ["wss://api.deepgram.com"]`,
        gcases.every(c => c[0] === c[1]) && ro.ok === true && made.length === 1 && m0.url.startsWith('wss://api.deepgram.com/v1/listen?model=nova-3&') && same(m0.protocols, ['token', KEY]) && same(real.hosts(), ['wss://api.deepgram.com']));
      // The ears' question says, in plain words, what mip_opt_out does, and the listen request carries it: the sentence
      // held to the request (the coordinator's addition; if either goes, this row fails)
      const OPT = 'The app asks Deepgram to leave what you say out of its programme for improving its models.';
      const qe = asked.find(q => q.kind === 'ears') || {};
      const lO = opensNow(), oq = keep(await call('open', {}));
      await until(() => fake.listens.length > lO, 1500);
      const LO = fake.listens[lO] || { query: {} };
      if (oq.ok) w.cancel(oq.id);
      row('  the ears\' question says what the request does with what is said ("' + OPT.slice(0, 40) + '..."), and the listen request does it: mip_opt_out=true',
        `the question: ${String(qe.detail || '').includes(OPT) ? 'says it' : 'DOES NOT'}; the request: mip_opt_out=${LO.query.mip_opt_out} (${LO.mipOptOut ? 'opted out' : 'NOT opted out'})`, 'says it; mip_opt_out=true (opted out)',
        String(qe.detail || '').includes(OPT) && /Nothing is sent while you do not hold it\. The app asks Deepgram to leave/.test(String(qe.detail)) && oq.ok === true && LO.mipOptOut === true && LO.query.mip_opt_out === 'true');
      // B. While the app's own question to the player is open (here the voices' switch, held open), the window's setKey,
      // clearKey, test, speak and open are refused "busy", in the crew's minds' words (app/minds.js); a transmission already
      // open goes on: its sound is taken and its finish answered. Once the question is answered the same calls work again
      const ipcB = mkIpc(), askedB = []; let holdB = null;
      const wB = ears({ ipcMain: ipcB, safeStorage: mkSafe(), dir: dirOf('busyask'), isOwn: () => true, base: fake.base, WebSocket: Watched, bounds: SHORT, send: () => {},
        confirm: (q) => { askedB.push(q.kind); if (holdB === 'next') return new Promise((res) => { holdB = res; }); return Promise.resolve(true); } });
      wB.attach();
      const callB = (name, arg) => ipcB.handlers['voice:' + name]({ sender: {} }, arg).then(keep);
      await callB('setKey', KEY); await callB('set', { ears: true });
      const txB = await callB('open', {}); ipcB.listeners['voice:audio']({ sender: {} }, txB.id, SOUND(30));
      await until(() => wB.listening() && wB.listening().opened);
      const LB = lastListen(); await until(() => LB.audio.length >= 30, 1000);
      holdB = 'next';
      const pendingB = callB('set', { on: true });
      await until(() => typeof holdB === 'function', 1000);
      const nReqB = fake.seen.length, nSockB = opened.length, refusedB = {};
      for (const [name, arg] of [['setKey', 'another-key-0000000000'], ['clearKey', undefined], ['test', undefined], ['speak', LINE], ['open', {}]]) refusedB[name] = await callB(name, arg);
      const midB = keep(wB.status());
      ipcB.listeners['voice:audio']({ sender: {} }, txB.id, SOUND(20)); await until(() => LB.audio.length >= 50, 1000);
      const finB = await callB('finish', txB.id);
      row('while the app\'s own question to the player is open, the window\'s setKey, clearKey, test, speak and open are each refused "busy" in the crew\'s minds\' words, and nothing moves (the key kept, no request, no socket); a transmission already open goes on: its sound taken, its finish answered',
        Object.keys(refusedB).map(n => n + ' ' + (refusedB[n].ok === false ? refusedB[n].kind : 'TAKEN')).join(', ') + `; key kept ${midB.hasKey}; ${fake.seen.length - nReqB} requests, ${opened.length - nSockB} sockets; the transmission: ${LB.audio.length} bytes, finish ${finB.ok ? 'answered' : finB.kind}`,
        'each busy; true; 0, 0; 50 bytes, answered',
        Object.keys(refusedB).length === 5 && Object.keys(refusedB).every(n => refusedB[n].ok === false && refusedB[n].kind === 'busy' && refusedB[n].why === 'An earlier change is waiting for your answer.')
        && midB.hasKey === true && fake.seen.length === nReqB && opened.length === nSockB && LB.audio.length === 50 && finB.ok === true && finB.text === 'hard a starboard');
      // (answered only if it was ever asked: a question that never opened, or never closed, fails the row below, not the suite)
      const answerB = holdB; holdB = null; if (typeof answerB === 'function') answerB(true);
      const onB = await pendingB, againB = {};
      againB.test = await callB('test'); againB.speak = await callB('speak', LINE); againB.open = await callB('open', {});
      if (againB.open.ok) wB.cancel(againB.open.id);
      againB.setKey = await callB('setKey', KEY); againB.clearKey = await callB('clearKey');
      row('  once the question is answered, the same calls work again: the key tried, a line spoken, a transmission opened, a key kept and forgotten',
        `on ${onB.on}; test ${againB.test.ok ? 'ok' : againB.test.kind}, speak ${againB.speak.ok ? 'ok' : againB.speak.kind}, open ${againB.open.ok ? 'ok' : againB.open.kind}, setKey has ${againB.setKey.hasKey}, clearKey has ${againB.clearKey.hasKey}`,
        'on true; test ok, speak ok, open ok, setKey has true, clearKey has false',
        onB.on === true && againB.test.ok === true && againB.speak.ok === true && againB.open.ok === true && againB.setKey.hasKey === true && againB.clearKey.hasKey === false && same(askedB, ['ears', 'on']));
    }

    // ---------------------------------------------------------------- 17. the key struck out; the words in no file; the timers
    out('\n17. the key struck out of what Deepgram says; the words in no file; every timer cleared');
    {
      const e = await mkEars('strike');
      const leaks = (s) => { for (let i = 0; i + 8 <= KEY.length; i++) if (String(s).indexOf(KEY.slice(i, i + 8)) >= 0) return true; return false; };
      fake.heard = 'the key is ' + KEY + ' and it begins ' + KEY.slice(0, 12) + ' and ends ' + KEY.slice(-10);
      const r = await e.open({}); e.audio(r.id, SOUND(64)); await until(() => e.msgs.length >= 1);
      const f = keep(await e.finish(r.id));
      fake.heard = 'hard a starboard';
      const echo = {};
      for (const m of ['echo', 'echopart']) { fake.mode = m; const x = await e.open({}); e.audio(x.id, SOUND(64)); await sleep(80); echo[m] = keep(await e.finish(x.id)); }
      fake.mode = 'ok';
      row('the key is struck out of everything Deepgram says, whole and in part, before it reaches the page: the words heard (as they come and at the end), and its error words and close reasons (an Error message, a close 1011)',
        `words: ${leaks(f.text) ? 'LEAK' : 'clean'} ("${clip(f.text, 60)}"); heard messages: ${e.msgs.filter(m => leaks(m[2])).length} leak; echo: ${echo.echo.kind}, ${leaks(echo.echo.why) ? 'LEAK' : 'clean'}; echopart: ${echo.echopart.kind}, ${leaks(echo.echopart.why) ? 'LEAK' : 'clean'}`,
        'clean; 0 leak; network, clean; network, clean',
        f.ok === true && !leaks(f.text) && /\[the key\]/.test(f.text) && e.msgs.length >= 2 && e.msgs.every(m => !leaks(m[2])) && ['echo', 'echopart'].every(k => echo[k].ok === false && echo[k].kind === 'network' && !leaks(echo[k].why))
        && /\[the key\]/.test(echo.echo.why));
      // ... and a close whose REASON repeats the key with no Error message before it (A25: every mode above sends one, so
      // the reason's own striking was never reached)
      fake.mode = 'echoclose';
      const xc = await e.open({}); e.audio(xc.id, SOUND(64)); await sleep(80); const fc = keep(await e.finish(xc.id));
      fake.mode = 'ok';
      row('  a close whose own reason repeats the key, with no Error message before it: the key is struck out of the words the page is told',
        `${fc.kind}: ${leaks(fc.why) ? 'LEAKS' : 'clean'} ("${clip(String(fc.why), 70)}")`, 'network: clean, [the key] in its place',
        fc.ok === false && fc.kind === 'network' && /1011/.test(fc.why) && /\[the key\]/.test(fc.why) && !leaks(fc.why));
      // a message of Deepgram's longer than 64 kB is not read at all (A14): its words never reach the page
      fake.mode = 'bigmsg';
      const mBig = e.msgs.length, xb = await e.open({}); e.audio(xb.id, SOUND(64)); await until(() => e.msgs.length > mBig, 1000); await sleep(50);
      const fb = keep(await e.finish(xb.id)), toldBig = e.msgs.slice(mBig).map(x => x[2]);
      fake.mode = 'ok';
      row('  a message of Deepgram\'s longer than 64 kB is not read: its words reach neither the page nor the answer, and the messages after it are read as before',
        `${toldBig.filter(t => /ZZZ/.test(t)).length} of ${toldBig.length} messages to the page hold its words; told ${JSON.stringify(toldBig.map(t => clip(t, 20)))}; finish ${JSON.stringify(fb).slice(0, 60)}`, '0; ["hard a","hard a starboard"]; ok',
        toldBig.length >= 1 && toldBig.every(t => !/ZZZ/.test(t)) && toldBig[0] === 'hard a' && fb.ok === true && !/ZZZ/.test(fb.text));
      // every text is struck BEFORE it is cut, the words heard too: a key that stands across the cut of the words (1,000
      // characters) leaves none of its characters before the cut (cut first, its first six, "test-k", stood: fewer than
      // eight, so no striking afterwards could see them)
      fake.heard = 'x'.repeat(993) + ' ' + KEY;
      const xs = await e.open({}); e.audio(xs.id, SOUND(64)); await until(() => e.msgs.some(m => m[1] === xs.id), 1000);
      const fs2 = keep(await e.finish(xs.id)), toldS = e.msgs.filter(m => m[1] === xs.id).map(m => m[2]);
      fake.heard = 'hard a starboard';
      row('  the words heard are struck before they are cut: a key standing across the cut leaves none of its first characters in what the page is told or in the answer',
        `the answer ends "${String(fs2.text).slice(-12)}"; the page told ${toldS.length} times, ending "${String(toldS[toldS.length - 1] || '').slice(-12)}"`, 'ends "x [the k", each',
        fs2.ok === true && fs2.text.length === 1000 && !fs2.text.includes(KEY.slice(0, 6)) && /\[the k$/.test(fs2.text) && toldS.length >= 1 && toldS.every(t => !t.includes(KEY.slice(0, 6))));
      // the coordinator's condition 2: after a transmission, every file of its app's settings folder is searched for the
      // words heard and for a frame's own bytes (a marker sent as sound); the folder does hold the app's voice.json
      const eN = await mkEars('nofile'), dN = dirOf('nofile'), MARK = 'FRAME-MARKER-1912-' + 'q'.repeat(30);
      fake.heard = 'quartermaster steady as she goes';
      const xN = await eN.open({}); eN.audio(xN.id, Buffer.from(MARK, 'latin1')); await until(() => eN.listening() && eN.listening().opened);
      const fN = keep(await eN.finish(xN.id));
      fake.heard = 'hard a starboard';
      const inDir = [];
      (function walk(d) { for (const x of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, x.name); if (x.isDirectory()) walk(p); else inDir.push(p); } })(dN);
      const holdsN = inDir.filter(p => { const t = fs.readFileSync(p, 'latin1'); return t.includes('steady as she goes') || t.includes('FRAME-MARKER'); });
      row('  after a transmission, no file of its app\'s settings folder holds the words heard or the sound sent (a frame\'s own bytes searched for); the folder holds the app\'s settings, and the stand-in did hear both',
        `${inDir.length} file(s): ${inDir.map(p => path.basename(p)).join(', ')}; ${holdsN.length} hold them; the words: ${JSON.stringify(fN)}; the stand-in heard the marker: ${lastListen().audio.toString('latin1').includes('FRAME-MARKER')}`,
        'voice.json; 0; {"ok":true,"text":"quartermaster steady as she goes"}; true',
        inDir.some(p => path.basename(p) === 'voice.json') && holdsN.length === 0 && same(fN, { ok: true, text: 'quartermaster steady as she goes' }) && lastListen().audio.toString('latin1').includes('FRAME-MARKER'));
      // the words heard are written nowhere: every file this suite's apps wrote is searched for them
      const files = [];
      (function walk(d) { for (const x of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, x.name); if (x.isDirectory()) walk(p); else files.push(p); } })(tmp);
      const holding = files.filter(p => /starboard|the key is/.test(fs.readFileSync(p, 'latin1')));
      const src = fs.readFileSync(path.join(__dirname, '..', 'app', 'voice.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
      row('  the words heard are in no file (every settings file the suite\'s apps wrote searched), and app/voice.js writes nothing but voice.json and logs nothing',
        `${files.length} files, ${holding.length} hold the words; writes in the source: ${(src.match(/writeFileSync|appendFile|createWriteStream/g) || []).length}; console in the source: ${/console\./.test(src)}`,
        'none hold them; 1 write (voice.json, by its .tmp); false',
        holding.length === 0 && (src.match(/writeFileSync|appendFile|createWriteStream/g) || []).length === 1 && !/console\./.test(src));
      const stillArmed = earsMade.filter(x => x.armed() !== 0 || x.listening() !== null).length;
      row('  every timer of every transmission is cleared at its end: none armed, and nothing open, in any of the apps the ears\' sections made', `${earsMade.length} apps; ${stillArmed} with a timer armed or a transmission open`, '0',
        earsMade.length >= 12 && stillArmed === 0);
    }

    // ---------------------------------------------------------------- 18. nothing printed; the key in no answer; the environment
    out('\n18. nothing is printed, the key is in no answer, and the environment is not read');
    {
      const leaks = answers.filter(a => a.includes(KEY)).concat(toPage.filter(a => a.includes(KEY)));
      row('through all of it nothing was printed to a console, and no answer of any call, nor any message to the page, holds the key', `${printed.length} lines printed; ${leaks.length} of ${answers.length} answers and ${toPage.length} messages hold the key`, '0; 0', printed.length === 0 && leaks.length === 0 && toPage.length > 0);
      const src = fs.readFileSync(path.join(__dirname, '..', 'app', 'voice.js'), 'utf8'), reqs = (src.match(/require\('[^']+'\)/g) || []).sort();
      const marked = fake.seen.filter(q => q.raw.includes('must-not-be-used') || JSON.stringify(q.headers).includes('must-not-be-used')).length;
      // (CHANGED with the shared key store: the source now requires app/keystore.js, the app's one key store and striking)
      row('  no DEEPGRAM_* variable was read (a watch on the environment from the suite\'s first line); none reached Deepgram\'s stand-in; app/voice.js names no environment and requires no SDK, only the app\'s own modules',
        `${envReads.length} reads${envReads.length ? ': ' + envReads.slice(0, 3).join(', ') : ''}; ${marked} requests carried one; process.env in the source: ${src.includes('process.env')}; ${reqs.join(' ')}`,
        "0; 0; false; require('./keystore.js') require('./minds.js') require('fs') require('path')",
        envReads.length === 0 && marked === 0 && !src.includes('process.env') && !/DEEPGRAM_/.test(src.replace(/^\s*\/\/.*$/gm, '')) && same(reqs, ["require('./keystore.js')", "require('./minds.js')", "require('fs')", "require('path')"]));
      // the striking is the shared key store's alone: no copy of its own, no store call of its own (the store's calls and
      // the seal's purpose are app/keystore.js's), and the striking every text gets is KS.strike itself
      const code = src.replace(/^\s*\/\/.*$/gm, ''), ownStore = (code.match(/encryptString|decryptString|isAsyncEncryptionAvailable|isEncryptionAvailable/g) || []).length;
      row('  app/voice.js keeps no key code of its own: its striking is app/keystore.js\'s strike itself, and every seal and every opening goes through the shared store (no call of safeStorage\'s own in its source)',
        `own striking: ${/function strike\(/.test(code) ? 'YES' : 'none'}; strike = KS.strike: ${/const strike = KS\.strike;/.test(code)}; store calls of its own: ${ownStore}; KS.create: ${/KS\.create\(safe\)/.test(code)}`,
        'none; true; 0; true', !/function strike\(/.test(code) && /const strike = KS\.strike;/.test(code) && ownStore === 0 && /KS\.create\(safe\)/.test(code) && /store\.seal\(PURPOSE/.test(code) && /store\.open\(PURPOSE/.test(code));
      const nonAscii = [path.join('app', 'voice.js'), path.join('app', 'preload.js'), path.join('tools', 'fake_deepgram.js'), path.join('tools', 'voice_app_tests.js')].filter(f => /[^\x09\x0a\x0d\x20-\x7e]/.test(fs.readFileSync(path.join(__dirname, '..', f), 'utf8')));
      row('  the sources are plain ASCII (no character a tool might have turned an escape into)', nonAscii.length ? nonAscii.join(', ') : '4 files', 'all ASCII', nonAscii.length === 0);
    }
  } catch (e) {
    fails++; out('FAIL the suite could not finish: ' + (e && e.stack || e));
  } finally {
    await fake.close();
    process.env = realEnv; delete realEnv.DEEPGRAM_API_KEY; delete realEnv.DEEPGRAM_ACCESS_TOKEN;
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* the system clears its temporary folder */ }
    out(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
    process.exit(fails ? 1 : 0);
  }
})();
