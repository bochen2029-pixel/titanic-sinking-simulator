// The crew's minds, the app's side (app/minds.js, app/minds_openai.js), headless, in seconds, with no Electron, no key
// and no network: stand-ins for ipcMain and safeStorage, and a provider on this PC (tools/minds_fake_server.js).
//   node tools/minds_app_tests.js
// docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, sections 9 to 11 and 13 (the self-test's rows A to F, as far as they can
// be shown without the app itself). Every row is a MUST unless it says CHECK:
//   1. the providers' table; off by default; the settings, each field checked, a refused patch changing nothing
//   2. the key: kept encrypted, never in the clear in the file, never in an answer; a PC that cannot protect it keeps it
//      for the run only; forgotten on request
//   3. off, no key, no model, no adapter: an answer, and no request made
//   4. a question: one request, to the one host, the key in its header, the two parts as sent, the fixed schema, no
//      sampling setting; what comes back; what is counted
//   5. a server that refuses the schema, any form, or the limit's name is asked again in the form it takes
//   6. the provider's errors, each to its kind; the key is in no answer
//   7. one host: the guard; a redirect is not followed; where this run has called
//   8. a provider that never answers: timeout, within its bound; two at once and no more; the limits
//   9. the window's seven calls and no other; a call from anywhere else is refused; a request of the wrong shape is refused
//  9b. the player's own word: the switch going on, another address or provider while on and a higher limit are each
//      asked of him by the main process (a stand-in here); declined, nothing changes; nothing passes behind a question
//  10. Claude, through Anthropic's own SDK (app/minds_anthropic.js), when the SDK is installed in this checkout
//      (tools/app_packages.js says which npm command installs it): the request as Anthropic's reference asks, the
//      environment never used, the errors
//  11. nothing is printed; the page's library and the app hold the same schema
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const M = require('../app/minds.js');
const openai = require('../app/minds_openai.js');
const Fake = require('./minds_fake_server.js');
const rows = []; let fails = 0;
const out = (s) => process.stdout.write(s + '\n');           // the suite's own lines: console.* is watched (row 10)
function row(what, value, ref, ok, check) { rows.push(ok); if (!ok && !check) fails++; out((ok ? 'PASS ' : (check ? 'CHECK ' : 'FAIL ')) + what.padEnd(96) + ' ' + String(value).padEnd(52) + ' ' + ref); }
const printed = [];
for (const k of ['log', 'info', 'warn', 'error', 'debug', 'trace']) console[k] = (...a) => { printed.push(k + ': ' + a.map(String).join(' ')); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clip = (s, n) => (s.length > n ? s.slice(0, n - 3) + '...' : s);

// a key that is plainly not one, and a stand-in for the system's key store whose output does not hold its input
const KEY = 'test-key-0123456789-not-a-secret';
const mkSafe = (on) => ({ on, isEncryptionAvailable() { return this.on; },
  encryptString(s) { return Buffer.from('enc:' + Buffer.from(s, 'utf8').toString('hex').split('').reverse().join(''), 'utf8'); },
  decryptString(b) { const t = b.toString('utf8'); if (!t.startsWith('enc:')) throw new Error('not this store\'s'); return Buffer.from(t.slice(4).split('').reverse().join(''), 'hex').toString('utf8'); } });
const mkIpc = () => ({ handlers: {}, handle(name, fn) { this.handlers[name] = fn; } });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'titanic-minds-'));
const dirOf = (name) => { const d = path.join(tmp, name); fs.mkdirSync(d, { recursive: true }); return d; };
const answers = [];                                          // every answer the app's side gave, to search for the key
const keep = (x) => { answers.push(JSON.stringify(x)); return x; };
const STABLE = 'You are the quartermaster at the wheel. Answer with a JSON object and nothing else.', CHANGING = 'THE FACTS\nThe time: 11:41 pm.\nTHE CAPTAIN SAYS TO YOU: How does she answer?';
const Q = { seat: 'quartermaster', stable: STABLE, changing: CHANGING };

(async () => {
  const fake = await Fake.start();
  try {
    // ---------------------------------------------------------------- 1. the table, the defaults, the settings
    out('1. the providers, the defaults and the settings');
    {
      const P = M.PROVIDERS, bad = [];
      for (const id of Object.keys(P)) {
        const p = P[id];
        if (['anthropic', 'openai'].indexOf(p.form) < 0 || typeof p.label !== 'string') bad.push(id + ': form or label');
        if (p.base !== null) { try { const u = new URL(M.checkBase(p.base)); if (u.protocol !== 'https:' && !(u.protocol === 'http:' && u.hostname === 'localhost' && p.key === false)) bad.push(id + ': ' + p.base); } catch (e) { bad.push(id + ': ' + e.message); } }
        else if (id !== 'custom') bad.push(id + ': no address');
      }
      row('every provider has a form and a fixed address by https (a server on this PC by http, and no key); one is the player\'s own', bad.length ? bad.join('; ') : Object.keys(P).join(', '), 'https, or localhost', bad.length === 0);
    }
    const dir = dirOf('a'), ipc = mkIpc(), safe = mkSafe(true);
    let own = true;
    const m = M.create({ ipcMain: ipc, safeStorage: safe, dir, isOwn: () => own });
    {
      // the models the app knows by name are offered with the status (Claude's; the others' names are the player's, or
      // the provider's own list by "Try it"), the default first; and the wait for one answer has room for a model that thinks
      const ps = m.status().providers, claudeP = ps.find(p => p.id === 'anthropic') || {}, others = ps.filter(p => p.id !== 'anthropic' && p.models.length);
      row('Claude\'s current models are offered by name, the default first; an answer is awaited 45 s by default, 60 at most', `${(claudeP.models || []).join(', ')}; others with a list: ${others.length}; ${M.DEFAULTS.timeoutMs / 1000} s of ${M.LIMITS.timeoutMs[1] / 1000}`,
        'claude-opus-5-5 first; 0; 45 of 60', Array.isArray(claudeP.models) && claudeP.models[0] === M.PROVIDERS.anthropic.model && claudeP.models.length >= 3 && claudeP.models.every(x => /^claude-[a-z0-9-]+$/.test(x)) && others.length === 0
        && M.DEFAULTS.timeoutMs === 45000 && M.LIMITS.timeoutMs[1] === 60000 && m.status().timeoutMs === 45000);
    }
    {
      const s = keep(m.status());
      row('off by default: the switch off, no key, nothing called, no file written until something is set', `on ${s.on}, key ${s.hasKey}, ${s.provider}, ${s.used.questions} questions, file ${fs.existsSync(path.join(dir, 'minds.json'))}`,
        'off, no key, anthropic, 0, no file', s.ok && s.on === false && s.hasKey === false && s.provider === 'anthropic' && s.used.questions === 0 && s.hosts.length === 0 && !fs.existsSync(path.join(dir, 'minds.json')));
      const before = JSON.stringify(m.status());
      const BAD = [{ on: 'yes' }, { provider: 'nobody' }, { model: 'a b' }, { model: 'x'.repeat(101) }, { base: 'http://example.com/v1' }, { base: 'ftp://localhost/v1' }, { base: 'https://user:pw@example.com/v1' },
        { base: 'https://example.com/v1?x=1' }, { base: 'not an address' }, { effort: 'max' }, { timeoutMs: 10 }, { timeoutMs: 1.5 }, { limits: { questions: 0 } }, { limits: { tokens: 1e9 } }, { limits: { other: 1 } },
        { nonsense: 1 }, { on: true, provider: 'nobody' }, null, 'x', [], 7];
      const wrong = BAD.filter(p => { const r = keep(m.set(p)); return !(r.ok === false && r.kind === 'shape' && typeof r.why === 'string') || JSON.stringify(m.status()) !== before; });
      row('a patch with any field wrong is refused whole, with a reason, and changes nothing', wrong.length ? clip(JSON.stringify(wrong), 60) : BAD.length + ' patches refused', 'each refused; the settings as before', wrong.length === 0);
      const s2 = keep(m.set({ provider: 'custom', base: fake.base + '/', model: 'fake-1', timeoutMs: 1000, effort: 'low', limits: { questions: 50 } }));
      const f = JSON.parse(fs.readFileSync(path.join(dir, 'minds.json'), 'utf8'));
      row('a good patch is taken and kept in the settings folder: the player\'s own address, by http only to this PC', `${s2.provider}, ${s2.base}, ${s2.modelUsed}, ${s2.timeoutMs} ms; file v ${f.v}, on ${f.on}`, `custom, ${fake.base}, fake-1, 1000; v 1, off`,
        s2.ok && s2.provider === 'custom' && s2.base === fake.base && s2.modelUsed === 'fake-1' && s2.timeoutMs === 1000 && s2.limits.questions === 50 && f.v === 1 && f.on === false && f.base === fake.base);
    }

    // ---------------------------------------------------------------- 2. the key
    out('\n2. the key');
    {
      const short = keep(await m.setKey('short')), spaced = keep(await m.setKey('has a space in it')), notText = keep(await m.setKey({ key: KEY }));
      const s = keep(await m.setKey('  ' + KEY + '  '));
      const text = fs.readFileSync(path.join(dir, 'minds.json'), 'utf8');
      row('a key is kept encrypted by the system\'s store; the file does not hold it in the clear; what is not a key is refused', `kept: ${s.keyKept}, has ${s.hasKey}; in the file: ${text.includes(KEY) ? 'IN THE CLEAR' : 'not in the clear'}; refused ${[short, spaced, notText].filter(r => r.ok === false).length} of 3`,
        'disk; not in the clear; 3 of 3', s.ok && s.hasKey && s.keyKept === 'disk' && !text.includes(KEY) && /"custom": "/.test(text) && short.ok === false && spaced.ok === false && notText.ok === false);
      const again = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir, isOwn: () => true });
      const other = M.create({ ipcMain: mkIpc(), safeStorage: { isEncryptionAvailable: () => true, encryptString: (x) => Buffer.from(x), decryptString: () => { throw new Error('another user\'s'); } }, dir, isOwn: () => true });
      await again.ready; await other.ready;        // a kept key is opened as the run starts: the window's calls wait for it, and so does this
      row('the app started again has the key; under another user\'s store (which cannot open it) there is no key', `again: ${keep(again.status()).hasKey}; another: ${keep(other.status()).hasKey}`, 'true; false', again.status().hasKey === true && other.status().hasKey === false);
      // every run starts off, whatever an earlier run did or a file says (the second review: a minds.json written by hand
      // with the switch on and an address of its own called out at once, with no question to the player)
      const d6 = dirOf('g'), r1 = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: d6, isOwn: () => true });
      r1.set({ provider: 'custom', base: fake.base, model: 'fake-1', on: true, limits: { questions: 500 } });
      const fOn = JSON.parse(fs.readFileSync(path.join(d6, 'minds.json'), 'utf8'));
      const r2 = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: d6, isOwn: () => true }), sAgain = keep(r2.status());
      const d7 = dirOf('h'); fs.writeFileSync(path.join(d7, 'minds.json'), JSON.stringify({ v: 1, on: true, provider: 'custom', base: fake.base, model: 'fake-1', limits: { questions: 5000 } }));
      const r3 = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: d7, isOwn: () => true }), nHand = fake.seen.length, aHand = keep(await r3.ask(Q));
      row('  every run of the app starts off: one switched on is off when started again (its other settings kept), and a file written by hand with the switch on calls nobody',
        `while it ran: on ${r1.status().on}, the file on ${fOn.on}; started again: on ${sAgain.on}, ${sAgain.provider}, limit ${sAgain.limits.questions}; by hand: on ${r3.status().on}, asked: ${aHand.kind}, ${fake.seen.length - nHand} requests`,
        'true, false; false, custom, 500; false, off, 0', r1.status().on === true && fOn.on === false && sAgain.on === false && sAgain.provider === 'custom' && sAgain.limits.questions === 500 && r3.status().on === false
        && r3.status().limits.questions === 5000 && aHand.ok === false && aHand.kind === 'off' && fake.seen.length === nHand);
      const d2 = dirOf('b'), v = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(false), dir: d2, isOwn: () => true });
      const sv = keep(await v.setKey(KEY)), f2 = path.join(d2, 'minds.json'), t2 = fs.existsSync(f2) ? fs.readFileSync(f2, 'utf8') : '';
      row('a PC that cannot protect a key keeps it for the run only: nothing of it is written', `kept: ${sv.keyKept}, can protect ${sv.canProtect}; file ${t2 ? 'holds ' + (t2.includes(KEY) ? 'THE KEY' : 'no key') : 'not written'}`, 'run; false; no key', sv.hasKey && sv.keyKept === 'run' && sv.canProtect === false && !t2.includes(KEY) && !/"keys": \{[^}]*"anthropic"/.test(t2));
      const d3 = dirOf('c'), c = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: d3, isOwn: () => true });
      await c.setKey(KEY); const sc = keep(c.clearKey()), t3 = fs.readFileSync(path.join(d3, 'minds.json'), 'utf8');
      row('"Forget" removes it from the run and from the file', `has ${sc.hasKey}; the file's keys: ${JSON.stringify(JSON.parse(t3).keys)}`, 'false; {}', sc.hasKey === false && same(JSON.parse(t3).keys, {}));
      // ... the key of the provider shown, and no other: a key kept for another provider stays (the README says so)
      const d5 = dirOf('f'), two = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: d5, isOwn: () => true });
      await two.setKey(KEY); two.set({ provider: 'openai' }); await two.setKey(KEY + '-second');
      const gone1 = keep(two.clearKey()), back1 = keep(two.set({ provider: 'anthropic' })), kept5 = Object.keys(JSON.parse(fs.readFileSync(path.join(d5, 'minds.json'), 'utf8')).keys);
      row('  it is the key of the provider shown: one kept for another provider stays', `openai's forgotten: has ${gone1.hasKey}; anthropic's: has ${back1.hasKey}; keys in the file: ${kept5.join(', ')}`, 'false; true; anthropic', gone1.hasKey === false && back1.hasKey === true && same(kept5, ['anthropic']));
    }

    // ---------------------------------------------------------------- 2b. the system's key store, by its asynchronous calls
    out('\n2b. the key store by its asynchronous calls (app/keystore.js): what the two reviews found, held');
    {
      // a stand-in with BOTH sets of calls, whose seal is not its input: a<version>:<hex>. o: { on, delay (ms to open),
      // sealDelay (ms to seal), rotate (the store asks for the key to be sealed again, once), foreign (it opens nothing) }
      // syncOn (as on): what the synchronous calls say; sealFails: the asynchronous seal rejects; sealDelay may be a
      // function of the seal's number (1, 2, ...)
      const mkAsync = (o) => {
        o = Object.assign({ on: true, delay: 0, sealDelay: 0, rotate: false, foreign: false, sealFails: false }, o || {});
        const syncOn = o.syncOn === undefined ? o.on : o.syncOn;
        const st = { calls: { enc: 0, dec: 0, sync: 0, syncSeal: 0 }, ver: 1 };
        st.isAsyncEncryptionAvailable = () => Promise.resolve(o.on);
        st.encryptStringAsync = (t) => { const n = ++st.calls.enc; return new Promise((res, rej) => setTimeout(() => (o.sealFails ? rej(new Error('the store would not')) : res(Buffer.from('a' + st.ver + ':' + Buffer.from(t, 'utf8').toString('hex'), 'utf8'))),
          typeof o.sealDelay === 'function' ? o.sealDelay(n) : o.sealDelay)); };
        st.decryptStringAsync = (b) => { st.calls.dec++; return new Promise((res, rej) => setTimeout(() => {
          try { if (o.foreign) throw new Error('another user\'s'); const mm = /^a(\d+):([0-9a-f]*)$/.exec(Buffer.from(b).toString('utf8')); if (!mm) throw new Error('not this store\'s');
            const r = { result: Buffer.from(mm[2], 'hex').toString('utf8'), shouldReEncrypt: o.rotate === true }; if (o.rotate) { st.ver++; o.rotate = false; } res(r); } catch (e) { rej(e); } }, o.delay)); };
        st.isEncryptionAvailable = () => { st.calls.sync++; return syncOn; };
        st.encryptString = (t) => { st.calls.sync++; st.calls.syncSeal++; return Buffer.from('s1:' + Buffer.from(t, 'utf8').toString('hex'), 'utf8'); };
        st.decryptString = (b) => { st.calls.sync++; const mm = /^[as]\d+:([0-9a-f]*)$/.exec(Buffer.from(b).toString('utf8')); if (!mm) throw new Error('not this store\'s'); return Buffer.from(mm[1], 'hex').toString('utf8'); };
        return st;
      };
      const fileOf = (d) => path.join(d, 'minds.json'), sealOf = (d, p) => { try { return JSON.parse(fs.readFileSync(fileOf(d), 'utf8')).keys[p] || ''; } catch (e) { return ''; } };
      const opened = (b64) => Buffer.from(Buffer.from(b64, 'base64').toString('utf8').replace(/^[as]\d+:/, ''), 'hex').toString('utf8');   // what the stand-in sealed
      const mkM = (d, safeS, more) => M.create(Object.assign({ ipcMain: mkIpc(), safeStorage: safeS, dir: d, isOwn: () => true }, more || {}));
      // where the asynchronous calls are there they are the ones used, and the seal says what the key is for
      const da = dirOf('ks-a'), sa = mkAsync(), ka = mkM(da, sa); await ka.ready;
      ka.set({ provider: 'custom', base: fake.base, model: 'fake-1' });
      const kept = keep(await ka.setKey(KEY)), textA = fs.readFileSync(fileOf(da), 'utf8'), whatA = opened(sealOf(da, 'custom'));
      const sb = mkAsync({ delay: 30 }), kb = mkM(da, sb), atOnce = kb.status().hasKey; await kb.ready;
      kb.set({ on: true, timeoutMs: 1000 }); const nKb = fake.seen.length, q1 = await kb.ask(Q), q2 = await kb.ask(Q);
      const sentKb = fake.seen.slice(nKb).map(q => q.headers.authorization === 'Bearer ' + KEY);
      row('where the store has its asynchronous calls and they can protect, they are the ones used (the deprecated synchronous ones are never called); the key is not in the file in the clear; what is sealed says what it is for and, for the player\'s own server, the address it is for',
        `kept: ${kept.keyKept}; async seals ${sa.calls.enc}, sync calls ${sa.calls.sync}; in the clear: ${textA.includes(KEY)}; sealed: "${whatA.replace(KEY, '<the key>').replace(fake.origin, '<its address>')}"`, 'disk; 1, 0; false; "minds:custom:<its address>|<the key>"',
        kept.ok && kept.hasKey && kept.keyKept === 'disk' && sa.calls.enc === 1 && sa.calls.sync === 0 && !textA.includes(KEY) && whatA === 'minds:custom:' + fake.origin + '|' + KEY);
      row('  the app started again opens it by the asynchronous call ONCE, however many questions are then asked with it (it was opened at every question before); until it has been opened (in this process, straight after the start) no key is claimed',
        `at once: has ${atOnce}; when ready: has ${kb.status().hasKey}; two questions: ${q1.ok}, ${q2.ok}, the key sent ${sentKb.filter(Boolean).length} times; opened ${sb.calls.dec} time(s), sync calls ${sb.calls.sync}`,
        'false; true; true, true, 2; 1, 0', atOnce === false && kb.status().hasKey === true && q1.ok === true && q2.ok === true && sentKb.length === 2 && sentKb.every(Boolean) && sb.calls.dec === 1 && sb.calls.sync === 0);
      // the store asks for the key to be sealed again: it is, and it still opens
      const was = sealOf(da, 'custom'), sr = mkAsync({ rotate: true }), kr = mkM(da, sr); await kr.ready;
      const now = sealOf(da, 'custom'), kr2 = mkM(da, mkAsync()); await kr2.ready;
      row('  when the store says the key should be sealed again, it is: the file\'s seal changes, the key is the same, and the app started again opens it', `seal ${now !== was ? 'changed' : 'THE SAME'}; has ${kr.status().hasKey}; again: has ${kr2.status().hasKey}`,
        'changed; true; true', now !== was && opened(now) === 'minds:custom:' + fake.origin + '|' + KEY && kr.status().hasKey === true && kr2.status().hasKey === true);
      // ... and when that sealing again fails, the old seal stays and still opens
      const wasF = sealOf(da, 'custom'), sf = mkAsync({ rotate: true, sealFails: true }), kfail = mkM(da, sf); await kfail.ready;
      const kfail2 = mkM(da, mkAsync()); await kfail2.ready;
      row('  when the sealing again fails, the old seal stays in the file and still opens', `seal ${sealOf(da, 'custom') === wasF ? 'the same' : 'CHANGED'}; has ${kfail.status().hasKey}; again: has ${kfail2.status().hasKey}`, 'the same; true; true',
        sealOf(da, 'custom') === wasF && kfail.status().hasKey === true && kfail2.status().hasKey === true);
      // a store that says it cannot protect: for the run only, nothing written, the synchronous calls not tried
      const dn = dirOf('ks-n'), sn = mkAsync({ on: false }), kn = mkM(dn, sn); await kn.ready;
      const run = keep(await kn.setKey(KEY)), textN = fs.existsSync(fileOf(dn)) ? fs.readFileSync(fileOf(dn), 'utf8') : '';
      row('  a store that says, by both sets of calls, that it cannot protect a key: the key is kept for the run only, and nothing of it is written or sealed', `kept: ${run.keyKept}, can protect ${run.canProtect}; the file ${textN.includes(KEY) ? 'HOLDS THE KEY' : 'holds no key'}; seals: async ${sn.calls.enc}, sync ${sn.calls.syncSeal}`,
        'run, false; no key; 0, 0', run.hasKey && run.keyKept === 'run' && run.canProtect === false && !textN.includes(KEY) && sealOf(dn, 'anthropic') === '' && sn.calls.enc === 0 && sn.calls.syncSeal === 0);
      // the asynchronous calls say they cannot (not yet, as the app starts) while the synchronous ones still can: the key is not lost
      const dsy = dirOf('ks-sync'), ssy = mkAsync({ on: false, syncOn: true }), ksy = mkM(dsy, ssy); await ksy.ready;
      const bySync = keep(await ksy.setKey(KEY)), ksy2 = mkM(dsy, mkAsync({ on: false, syncOn: true })); await ksy2.ready;
      row('  where the asynchronous calls say they cannot protect and the synchronous ones still can (this Electron has both), the key is sealed by those and kept: a store that answers "not yet" does not lose every kept key',
        `kept: ${bySync.keyKept}, can protect ${bySync.canProtect}; seals: async ${ssy.calls.enc}, sync ${ssy.calls.syncSeal}; in the clear: ${fs.readFileSync(fileOf(dsy), 'utf8').includes(KEY)}; started again: has ${ksy2.status().hasKey}`,
        'disk, true; 0, 1; false; true', bySync.keyKept === 'disk' && bySync.canProtect === true && ssy.calls.enc === 0 && ssy.calls.syncSeal === 1 && !fs.readFileSync(fileOf(dsy), 'utf8').includes(KEY) && ksy2.status().hasKey === true);
      // another user's store opens nothing
      const kf = mkM(da, mkAsync({ foreign: true })); await kf.ready;
      row('  under another user\'s store (which cannot open it) there is no key', `has ${keep(kf.status()).hasKey}`, 'false', kf.status().hasKey === false);
      // Save, then Forget at once; two keys saved together
      const dr = dirOf('ks-race'), ipcR = mkIpc(), race = mkM(dr, mkAsync({ sealDelay: 50 }), { ipcMain: ipcR }); race.attach();
      const callR = (name, arg) => ipcR.handlers['minds:' + name]({ sender: {} }, arg);
      const both = await Promise.all([callR('setKey', KEY), callR('clearKey')]);
      // (the FIRST seal comes back last: an implementation with no numbering would keep the first key)
      const two2 = mkM(dirOf('ks-two'), mkAsync({ sealDelay: (n) => (n === 1 ? 120 : 10) })); await two2.ready; two2.set({ provider: 'custom', base: fake.base, model: 'fake-1', on: true });
      await Promise.all([two2.setKey('another-key-0123456789-first'), two2.setKey(KEY)]);
      const nTwo = fake.seen.length, aTwo = await two2.ask(Q), sentTwo = (fake.seen[fake.seen.length - 1] || { headers: {} }).headers.authorization;
      row('  Save, then Forget at once: the later word stands and no key is kept; of two keys saved together the second is the key that is sent, though the first one\'s sealing finished last',
        `Save answered has ${both[0].hasKey}, Forget has ${both[1].hasKey}; afterwards has ${race.status().hasKey}, the file ${sealOf(dr, 'anthropic') ? 'KEEPS A KEY' : 'holds none'}; two keys: ${sentTwo === 'Bearer ' + KEY ? 'the second sent' : 'NOT the second'} (${aTwo.ok ? 'answered' : aTwo.kind + ': ' + aTwo.why}; ${fake.seen.length - nTwo} request)`,
        'no key, none; the second sent', race.status().hasKey === false && sealOf(dr, 'anthropic') === '' && aTwo.ok === true && fake.seen.length === nTwo + 1 && sentTwo === 'Bearer ' + KEY);
      // a seal made before purposes were written holds the bare key: it is taken, and sealed again with its purpose
      const dl = dirOf('ks-legacy'), bare = mkAsync();
      fs.writeFileSync(fileOf(dl), JSON.stringify({ v: 1, provider: 'openai', keys: { openai: Buffer.from('a1:' + Buffer.from(KEY, 'utf8').toString('hex'), 'utf8').toString('base64') }, keyAt: { openai: 'https://api.openai.com' } }));
      const kl = mkM(dl, bare); await kl.ready;
      const afterL = opened(sealOf(dl, 'openai')), kl2 = mkM(dl, mkAsync()); await kl2.ready;
      row('  a key sealed before seals said what they were for (the first build of the crew\'s minds) is still the key, and is sealed again with its purpose', `has ${kl.status().hasKey}; now sealed as "${afterL.replace(KEY, '<the key>')}"; started again: has ${kl2.status().hasKey}`,
        'true; "minds:openai:<the key>"; true', kl.status().hasKey === true && afterL === 'minds:openai:' + KEY && kl2.status().hasKey === true);
      // a seal that says it is for something else is no key here: another provider's, or the voices'
      const dx = dirOf('ks-other'), sealFor = (text) => Buffer.from('a1:' + Buffer.from(text, 'utf8').toString('hex'), 'utf8').toString('base64');
      fs.writeFileSync(fileOf(dx), JSON.stringify({ v: 1, provider: 'openai', keys: { openai: sealFor('minds:anthropic:' + KEY), cerebras: sealFor('deepgram:' + KEY) }, keyAt: {} }));
      const gone = [], spy = async (url) => { gone.push(String(url)); throw new Error('no request may be made in this row'); };
      const kx = mkM(dx, mkAsync(), { fetch: spy }); await kx.ready; kx.set({ on: true, model: 'm' });
      const hasO = kx.status().hasKey, askO = await kx.ask(Q); kx.set({ provider: 'cerebras', model: 'm' }); const hasC = kx.status().hasKey, askC = await kx.ask(Q);
      row('  a seal that says it is for another provider, or for the voices, is no key here: a question is answered "no key" and nothing is sent to anyone', `openai's place, anthropic's seal: has ${hasO}, asked: ${askO.kind}; cerebras's place, the voices' seal: has ${hasC}, asked: ${askC.kind}; requests ${gone.length}`,
        'false, no-key; false, no-key; 0', hasO === false && hasC === false && askO.kind === 'no-key' && askC.kind === 'no-key' && gone.length === 0);
      // a seal with no purpose (the first build's) is taken only where the address is the app's own: never in the player's own server's place, and never when it stands in two places
      const dm = dirOf('ks-moved'), bareSeal = sealFor(KEY);
      fs.writeFileSync(fileOf(dm), JSON.stringify({ v: 1, provider: 'custom', base: 'https://elsewhere.example/v1', model: 'm', keys: { custom: bareSeal }, keyAt: { custom: 'https://elsewhere.example' } }));
      const gone2 = [], spy2 = async (url, init) => { gone2.push({ url: String(url), auth: init && init.headers && init.headers.authorization }); throw new Error('refused by the row'); };
      const km = mkM(dm, mkAsync(), { fetch: spy2 }); await km.ready; km.set({ on: true }); const askM = await km.ask(Q);
      const d2p = dirOf('ks-twice'); fs.writeFileSync(fileOf(d2p), JSON.stringify({ v: 1, provider: 'openai', keys: { openai: bareSeal, cerebras: bareSeal }, keyAt: {} }));
      const k2p = mkM(d2p, mkAsync()); await k2p.ready; const twiceO = k2p.status().hasKey; k2p.set({ provider: 'cerebras' }); const twiceC = k2p.status().hasKey;
      row('  a seal with no purpose is taken only in the place of a provider whose address is the app\'s own: moved into the player\'s own server\'s place it is no key (the question goes there without it), and standing in two places it is no key in either',
        `the player's own server's place: has ${km.status().hasKey}, a question sent ${gone2.length} with the key ${gone2.some(g => g.auth) ? 'SENT' : 'not sent'}; two places: has ${twiceO}, ${twiceC}; the file's seal there ${sealOf(dm, 'custom') === bareSeal ? 'left as it was' : 'CHANGED'}`,
        'false, not sent; false, false; left as it was', km.status().hasKey === false && askM.ok === false && !gone2.some(g => g.auth) && twiceO === false && twiceC === false && sealOf(dm, 'custom') === bareSeal);
      // the address a key is for is sealed with it: the settings file's own line for it, edited, sends the key nowhere
      const other3 = await Fake.start(), de = dirOf('ks-edit'), ke = mkM(de, mkAsync()); await ke.ready;
      ke.set({ provider: 'custom', base: fake.base, model: 'fake-1' }); await ke.setKey(KEY);
      const je = JSON.parse(fs.readFileSync(fileOf(de), 'utf8')); je.base = other3.base; je.keyAt.custom = other3.origin; fs.writeFileSync(fileOf(de), JSON.stringify(je));
      const ke2 = mkM(de, mkAsync()); await ke2.ready; ke2.set({ on: true, timeoutMs: 1000 });
      const se = keep(ke2.status()), ae = await ke2.ask(Q), sentE = other3.seen.length ? other3.seen[other3.seen.length - 1].headers.authorization : 'NOT ASKED';
      await other3.close();
      row('  the address a key is for is sealed with the key: with the settings file\'s own lines edited to another address, the key is not sent there (the question goes without it)',
        `has ${se.hasKey}, elsewhere ${se.keyElsewhere}; asked there: ${ae.ok ? 'answered' : ae.kind}, the key ${sentE === undefined ? 'not sent' : 'SENT'}`, 'false, true; not sent', se.hasKey === false && se.keyElsewhere === true && sentE === undefined);
      // while a question to the player is open nothing else moves: not the key, and no question goes out
      let answer = null; const ipcQ = mkIpc(), kq = mkM(dirOf('ks-open'), mkAsync(), { ipcMain: ipcQ, confirm: () => new Promise((res) => { answer = res; }) }); kq.attach();
      const callQ = (name, arg) => ipcQ.handlers['minds:' + name]({ sender: {} }, arg);
      await callQ('set', { provider: 'custom', base: fake.base, model: 'fake-1', timeoutMs: 1000 }); await callQ('setKey', KEY);
      const pOn = callQ('set', { on: true }); await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
      const nOpen = fake.seen.length, during = [await callQ('setKey', 'another-key-0123456789-zz'), await callQ('clearKey'), await callQ('test'), await callQ('ask', Q)], stat2 = await callQ('status');
      answer(false); const saidNo = await pOn;
      row('  while a question to the player is open nothing else moves: a key is neither kept nor forgotten, and no question goes out (the status can still be read)',
        `open: ${!!answer}; meanwhile: ${during.map(r => r.kind).join(', ')}; status ${stat2.ok}; then ${saidNo.kind}; the key ${kq.status().hasKey ? 'as it was' : 'GONE'}; requests ${fake.seen.length - nOpen}`,
        'busy x4; true; declined; as it was; 0', !!answer && during.every(r => r.ok === false && r.kind === 'busy') && stat2.ok === true && saidNo.kind === 'declined' && kq.status().hasKey === true && kq.status().on === false && fake.seen.length === nOpen);
      // a provider that prints only the key's first and last characters, or the key far into a long text
      const kp = mkM(dirOf('ks-part'), mkAsync()); await kp.ready; kp.set({ provider: 'custom', base: fake.base, model: 'fake-1', on: true, timeoutMs: 1000 }); await kp.setKey(KEY);
      const leaks = (t) => { for (let i = 0; i + 8 <= KEY.length; i++) if (String(t).indexOf(KEY.slice(i, i + 8)) >= 0) return true; return false; };
      const part = {};
      for (const mode of ['echopart', 'echolong']) { fake.mode = mode; part[mode] = keep(await kp.ask(Q)); }
      fake.mode = 'ok';
      row('  no part of the key reaches the window: struck out where a provider prints only its first and last characters, and out of a long text BEFORE the text is cut (the key stands across the cut)', Object.keys(part).map(k => k + ' ' + (leaks(part[k].why) ? 'LEAKS' : 'clean')).join(', ') + '; ' + clip(String(part.echopart.why), 80),
        'each clean', Object.keys(part).every(k => part[k].ok === false && part[k].why && !leaks(part[k].why)) && /\[the key\]/.test(part.echopart.why));
      // the provider's list of models: a name that holds eight of the key's characters is dropped whole (halves with a letter more passed)
      kp.set({ model: '' }); fake.models = ['fake-1', 'm' + KEY.slice(0, 18), 'n' + KEY.slice(18), KEY.slice(4, 14)];
      const listed = keep(await kp.test()); fake.models = null; kp.set({ model: 'fake-1' });
      row('  a provider\'s list of models that carries the key in pieces, each with a letter more: only the other names are offered, and none of the key is in what the window is told', `${listed.kind}: ${JSON.stringify(listed.models)}; ${leaks(JSON.stringify(listed)) ? 'LEAKS' : 'clean'}`,
        'no-model: ["fake-1"]; clean', listed.ok === false && listed.kind === 'no-model' && same(listed.models, ['fake-1']) && !leaks(JSON.stringify(listed)));
      // striking takes time with the text's length, not its square: a megabyte of key pieces, as a provider that means harm would send
      const KSm = require('../app/keystore.js'), k512 = Array.from({ length: 512 }, (_, i) => String.fromCharCode(33 + (i * 7 + (i >> 3)) % 90)).join('');
      let bigT = ''; for (let i = 0; bigT.length < 1000000; i++) bigT += k512.slice(i % 500, i % 500 + 8) + '.';
      const grams = new Set(); for (let i = 0; i + 8 <= k512.length; i++) grams.add(k512.slice(i, i + 8));
      const tS = Date.now(), struck = KSm.strike(bigT, k512), msS = Date.now() - tS;
      let left = 0; for (let i = 0; i + 8 <= struck.length; i++) if (grams.has(struck.substr(i, 8))) { left++; break; }
      const tH = Date.now(); KSm.strike(bigT.slice(0, 500000), k512); const msH = Date.now() - tH;
      row('  striking a megabyte of key pieces (a key of 512 characters) takes a moment, not a minute, and leaves none of them', `${msS} ms for 1 MB, ${msH} ms for half of it; pieces left: ${left}; ${struck.length} characters out`, 'under 2 s; none',
        msS < 2000 && left === 0 && struck.length > 0 && struck.length < bigT.length * 2);
    }

    // ---------------------------------------------------------------- 3. no request without the switch, a key, a model, an adapter
    out('\n3. nothing is asked without the switch, a key where one is needed, a model and an adapter');
    {
      const n0 = fake.seen.length;
      const off = keep(await m.ask(Q));
      const d = dirOf('d'), a = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: d, isOwn: () => true });
      a.set({ on: true });
      const noAdapter = keep(await a.ask(Q));                    // Claude's adapter is not in this build yet
      a.set({ provider: 'openai' }); const noKey = keep(await a.ask(Q));
      await a.setKey(KEY); const noModel = keep(await a.ask(Q));
      row('off; no adapter; no key; no model: each an answer of its kind, in plain words, and no request made', [off, noAdapter, noKey, noModel].map(r => r.kind).join(', ') + `; ${fake.seen.length - n0} requests; hosts ${JSON.stringify(a.hosts())}`,
        'off, no-adapter, no-key, no-model; 0 requests; []', off.kind === 'off' && noAdapter.kind === 'no-adapter' && noKey.kind === 'no-key' && noModel.kind === 'no-model' && [off, noAdapter, noKey, noModel].every(r => r.ok === false && r.why) && fake.seen.length === n0 && a.hosts().length === 0);
    }

    // ---------------------------------------------------------------- 4. a question
    out('\n4. a question');
    m.set({ on: true });
    {
      const n0 = fake.seen.length, r = keep(await m.ask(Q)), q = fake.seen[fake.seen.length - 1] || {}, b = q.body || {};
      row('one request, to the one host, with the key in its header and the two parts as they were sent', `${fake.seen.length - n0} request to ${q.path}; ${q.headers && q.headers.authorization === 'Bearer ' + KEY ? 'Bearer, the key' : 'NO KEY IN THE HEADER'}; ${(b.messages || []).map(x => x.role).join(', ')}`,
        '1; /v1/chat/completions; Bearer, the key; system, user', fake.seen.length - n0 === 1 && q.method === 'POST' && q.path === '/v1/chat/completions' && q.headers.authorization === 'Bearer ' + KEY && b.model === 'fake-1'
        && b.messages.length === 2 && b.messages[0].role === 'system' && b.messages[0].content === STABLE && b.messages[1].role === 'user' && b.messages[1].content === CHANGING && !q.raw.includes(KEY));
      const f = b.response_format || {};
      row('  the form asked for is the fixed schema of a turn; no sampling setting; the output\'s limit under the server\'s name', `${f.type}, strict ${f.json_schema && f.json_schema.strict}; temperature ${b.temperature}; max_tokens ${b.max_tokens}`,
        'json_schema, the turn\'s, strict; undefined; ' + M.LIMITS.maxTokens, f.type === 'json_schema' && f.json_schema.strict === true && same(f.json_schema.schema, M.TURN_SCHEMA) && b.temperature === undefined && b.top_p === undefined && b.max_tokens === M.LIMITS.maxTokens && b.max_completion_tokens === undefined);
      const u = keep(m.usage());
      row('  the answer: the text, the tokens in, out and cached, the model, how long; the run\'s count', `${r.text}; ${r.usage.in}/${r.usage.out}/${r.usage.cached}; ${r.model}; ${r.ms} ms; ${u.used.questions} question, ${u.used.tokens} tokens`,
        '{"say":"Aye, sir.","order":null}; 321/17/300; fake-1; 1 question, 338 tokens', r.ok && r.text === '{"say":"Aye, sir.","order":null}' && r.usage.in === 321 && r.usage.out === 17 && r.usage.cached === 300 && r.model === 'fake-1' && r.ms >= 0 && u.used.questions === 1 && u.used.tokens === 338);
      const t = keep(await m.test());
      row('  "Try it" asks one small question the same way', `${t.ok ? t.text : t.kind}; ${fake.seen.length - n0} requests so far`, 'an answer; 2', t.ok === true && fake.seen.length - n0 === 2);
      // with no model named, "Try it" asks the provider which it offers (a local server's models have names nobody can
      // guess): one GET under the same switch, key, limit and guard as a question; off, nothing is asked
      const tm = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: dirOf('models'), isOwn: () => true });
      tm.set({ provider: 'custom', base: fake.base, timeoutMs: 1000 }); await tm.setKey(KEY);
      const n1 = fake.seen.length, offT = keep(await tm.test()), nOff = fake.seen.length - n1;
      tm.set({ on: true });
      const lst = keep(await tm.test()), g = fake.seen[fake.seen.length - 1] || { headers: {} }, uq = tm.usage().used.questions, nList = fake.seen.length - n1;
      fake.mode = '401'; const refusedKey = keep(await tm.test()); fake.mode = '500'; const noList = keep(await tm.test()); fake.mode = 'ok';
      tm.set({ model: 'fake-2' });
      const named = keep(await tm.test()), p = fake.seen[fake.seen.length - 1] || { body: {} };
      row('  with no model named it asks the provider which it offers and says so (one GET, the key in its header); with one named it asks the question',
        `off: ${offT.kind}, ${nOff} requests; on: ${lst.kind}, "${clip(String(lst.why), 62)}", ${g.method} ${g.path}, ${nList} request; a refused key: ${refusedKey.kind}; no list: ${noList.kind}; named: ${named.ok ? 'an answer, model ' + p.body.model : named.kind}`,
        'off, 0; no-model, It offers: fake-1, fake-2., GET /v1/models, 1; auth; no-model; an answer, model fake-2',
        offT.kind === 'off' && nOff === 0 && lst.ok === false && lst.kind === 'no-model' && same(lst.models, ['fake-1', 'fake-2']) && /It offers: fake-1, fake-2\.$/.test(lst.why) && g.method === 'GET' && g.path === '/v1/models'
        && g.headers.authorization === 'Bearer ' + KEY && nList === 1 && uq === 1 && refusedKey.kind === 'auth' && noList.kind === 'no-model' && noList.models === undefined && named.ok === true && p.method === 'POST' && p.body.model === 'fake-2' && same(tm.hosts(), [fake.origin]));
      // a server that hands the key back as models' names, whole or in pieces (the second review): none reaches the window
      tm.set({ model: '' }); fake.models = ['fake-1', KEY.slice(0, 16), KEY.slice(16), 'x' + KEY + 'y', KEY];
      const halves = keep(await tm.test()); fake.models = null;
      row('  a provider\'s list that holds the key as names, whole or in pieces: only the other names are offered', `${halves.kind}: ${JSON.stringify(halves.models)}`, 'no-model: ["fake-1"]',
        halves.ok === false && halves.kind === 'no-model' && same(halves.models, ['fake-1']) && !JSON.stringify(halves).includes(KEY.slice(0, 16)) && !JSON.stringify(halves).includes(KEY.slice(16)));
      // an answer's body is read no further than its limit: a server that never stops sending cannot fill the process
      let pulls = 0;
      const endless = new Response(new ReadableStream({ pull(c) { pulls++; c.enqueue(new Uint8Array(65536).fill(32)); } }));
      const cut = await openai.bodyText(endless, openai.MAX_BODY), whole = await openai.bodyText(new Response('{"a": 1}'), openai.MAX_BODY), plain = await openai.bodyText({ text: async () => 'abc' }, 2);
      row('  an answer\'s body is read no further than one megabyte: a server that never stops sending is let go', `${cut.length} characters after ${pulls} pieces of 65,536; a short one whole: ${whole}; with no stream: ${plain}`, '1,000,000 after about 16; {"a": 1}; ab',
        cut.length === openai.MAX_BODY && pulls >= 16 && pulls <= 20 && whole === '{"a": 1}' && plain === 'ab');
    }

    // ---------------------------------------------------------------- 5. the form a server takes
    out('\n5. a server that refuses the schema, any form, or the limit\'s name');
    {
      let n0 = fake.seen.length; fake.mode = 'noschema';
      const a = keep(await m.ask(Q)), fa = fake.seen.slice(n0).map(q => (q.body.response_format ? q.body.response_format.type : 'none'));
      n0 = fake.seen.length; fake.mode = 'noform';
      const b = keep(await m.ask(Q)), fb = fake.seen.slice(n0).map(q => (q.body.response_format ? q.body.response_format.type : 'none'));
      n0 = fake.seen.length; fake.mode = 'nocap';
      const c = await openai.call({ base: fake.base, key: KEY, model: 'fake-1', stable: STABLE, changing: CHANGING, schema: M.TURN_SCHEMA, cap: 'max_completion_tokens', maxTokens: 500, fetch: globalThis.fetch, MindsError: M.MindsError });
      const fc = fake.seen.slice(n0).map(q => (q.body.max_completion_tokens !== undefined ? 'max_completion_tokens' : 'max_tokens'));
      fake.mode = 'ok';
      row('it is asked again in the form it takes: a JSON object, then no form; the other name for the limit', `${a.ok}: ${fa.join(' > ')}; ${b.ok}: ${fb.join(' > ')}; ${!!c.text}: ${fc.join(' > ')}`,
        'true: json_schema > json_object; true: json_schema > json_object > none; true: max_completion_tokens > max_tokens', a.ok && same(fa, ['json_schema', 'json_object']) && b.ok && same(fb, ['json_schema', 'json_object', 'none']) && !!c.text && same(fc, ['max_completion_tokens', 'max_tokens']));
    }

    // ---------------------------------------------------------------- 6. the provider's errors
    out('\n6. the provider\'s errors, each to its kind');
    {
      const got = {};
      for (const mode of ['401', '429', '500', 'badjson', 'empty', 'refusal']) { fake.mode = mode; got[mode] = keep(await m.ask(Q)); }
      fake.mode = 'ok';
      const want = { 401: 'auth', 429: 'rate', 500: 'server', badjson: 'server', empty: 'server', refusal: 'refused' };
      const off = Object.keys(want).filter(k => !(got[k].ok === false && got[k].kind === want[k] && got[k].why && !got[k].why.includes(KEY)));
      row('the key refused, too many requests, a server\'s error, an answer that is not JSON, no text, a refusal', Object.keys(want).map(k => k + ' ' + got[k].kind).join(', '), 'auth, rate, server, server, server, refused', off.length === 0);
      // a provider that repeats the key in its error: the key is struck out of what the window is told
      fake.mode = 'echo'; const n0 = fake.seen.length, echo = keep(await m.ask(Q)); fake.mode = 'ok';
      row('  a provider that repeats the key in its error: the key is struck out of what the window is told', `${echo.kind}: ${clip(String(echo.why), 90)}; ${fake.seen.length - n0} requests`, 'shape: ... [the key] ...; 3 requests (each form tried)',
        echo.ok === false && echo.kind === 'shape' && /\[the key\]/.test(echo.why) && !echo.why.includes(KEY) && fake.seen.length - n0 === 3);
      // ... and one that repeats it in its ANSWER (the second review): struck out of the text the window is given
      const was = fake.reply; fake.reply = '{"say":"Your key is ' + KEY + ', sir.","order":null}';
      const told = keep(await m.ask(Q)); fake.reply = was;
      row('  a provider that repeats the key in its answer: the key is struck out of the text the window is given', clip(String(told.text), 70), '... [the key] ...', told.ok === true && /\[the key\]/.test(told.text) && !told.text.includes(KEY));
      const err = await openai.call({ base: fake.base + '/nowhere', key: KEY, model: 'm', stable: STABLE, changing: CHANGING, schema: M.TURN_SCHEMA, cap: 'max_tokens', maxTokens: 10, fetch: globalThis.fetch, MindsError: M.MindsError }).then(() => null, (e) => e);
      row('  the adapter\'s faults are MindsErrors with a kind (a wrong address: 404)', `${err && err.kind}: ${err && clip(err.message, 70)}`, 'shape; no key in it', !!err && err instanceof M.MindsError && err.kind === 'shape' && !err.message.includes(KEY));
    }

    // ---------------------------------------------------------------- 7. one host
    out('\n7. one host');
    {
      const calls = [], spy = async (url, init) => { calls.push({ url: String(url), init }); return { ok: true, status: 200, text: async () => '{}' }; };
      const g = M.guard('https://api.example-provider.test', spy, []);
      const tries = ['https://other.example.test/v1/chat/completions', 'http://api.example-provider.test/v1', 'https://api.example-provider.test.evil.test/v1', 'https://api.example-provider.test:8443/v1', 'file:///c:/x', 'not an address'];
      const through = [];
      for (const u of tries) { try { await g(u, {}); through.push(u); } catch (e) { if (!(e instanceof M.MindsError && e.kind === 'guard')) through.push('threw otherwise: ' + u); } }
      await g('https://api.example-provider.test/v1/chat/completions', { method: 'POST', redirect: 'follow' });
      const gh = M.guard('http://203.0.113.5:8080', spy, []); let far = 'let through';
      try { await gh('http://203.0.113.5:8080/v1', {}); } catch (e) { far = e.kind; }
      row('the guard: another host, another port, another scheme, a look-alike name: refused before any request; http only to this PC', `${through.length} of ${tries.length} let through; ${calls.length} request made, redirect: ${calls[0] && calls[0].init.redirect}; http to another PC: ${far}`,
        '0 let through; 1 request, redirect: error; guard', through.length === 0 && calls.length === 1 && calls[0].init.redirect === 'error' && far === 'guard');
      fake.mode = 'redirect'; const r = keep(await m.ask(Q)); fake.mode = 'ok';
      row('  a redirect is not followed: the answer is a fault, and this run has called the one host only', `${r.ok === false ? r.kind : 'FOLLOWED'}; hosts ${JSON.stringify(m.hosts())}`, `network; ["${fake.origin}"]`, r.ok === false && r.kind === 'network' && same(m.hosts(), [fake.origin]) && same(keep(m.status()).hosts, [fake.origin]));
      // a key is for the address it was entered for: the player's own server, its address changed, is asked WITHOUT it
      const other = await Fake.start(), k = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: dirOf('e'), isOwn: () => true });
      k.set({ provider: 'custom', base: fake.base, model: 'fake-1', on: true }); await k.setKey(KEY);
      keep(await k.ask(Q)); const sentHome = fake.seen[fake.seen.length - 1].headers.authorization;
      const moved = keep(k.set({ base: other.base })); keep(await k.ask(Q));
      const sentAway = other.seen.length ? other.seen[other.seen.length - 1].headers.authorization : 'NOT ASKED', back = keep(k.set({ base: fake.base }));
      const k2 = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: path.join(tmp, 'e'), isOwn: () => true }); await k2.ready;
      const again2 = k2.status();
      await other.close();
      row('  a key entered for one address is not sent to another: the player\'s own server, moved, is asked without it; back at its own address the key serves again', `at its address: ${sentHome === 'Bearer ' + KEY ? 'sent' : 'NOT SENT'}; moved: ${sentAway === undefined ? 'not sent' : 'SENT'}, has ${moved.hasKey}, elsewhere ${moved.keyElsewhere}; back: has ${back.hasKey}; after a restart: has ${again2.hasKey}`,
        'sent; not sent, has false, elsewhere true; back: true; restart: true', sentHome === 'Bearer ' + KEY && sentAway === undefined && moved.hasKey === false && moved.keyElsewhere === true && back.hasKey === true && back.keyElsewhere === false && again2.hasKey === true);
    }

    // ---------------------------------------------------------------- 8. time, two at once, the limits
    out('\n8. a provider that never answers; two at once; the limits');
    {
      fake.mode = 'slow';
      const t0 = Date.now(), three = await Promise.all([m.ask(Q), m.ask(Q), m.ask(Q)]), ms = Date.now() - t0;
      fake.mode = 'ok'; three.forEach(keep);
      row('no answer: "timeout" within the wait that is set (1 s here); a third question while two are awaited is refused at once', `${three.map(r => r.kind).join(', ')} in ${ms} ms`, 'timeout, timeout, busy in about 1000 ms',
        three[0].kind === 'timeout' && three[1].kind === 'timeout' && three[2].kind === 'busy' && ms >= 900 && ms < 4000);
      const u = m.usage().used, n0 = fake.seen.length;
      m.set({ limits: { questions: u.questions + 1 } });
      const last = keep(await m.ask(Q)), over = keep(await m.ask(Q));
      m.set({ limits: { questions: 5000, tokens: 1000 } });
      const overT = m.usage().used.tokens >= 1000 ? keep(await m.ask(Q)) : { kind: 'the tokens used are under the smallest limit: ' + m.usage().used.tokens };
      row('past the limit of questions, or of tokens, no request is made and the answer says so', `${last.ok}, then ${over.kind}; tokens: ${overT.kind}; ${fake.seen.length - n0} request`, 'true, then budget; budget; 1 request', last.ok === true && over.kind === 'budget' && overT.kind === 'budget' && fake.seen.length - n0 === 1);
      m.set({ limits: { questions: 5000, tokens: 5000000 } });
    }

    // ---------------------------------------------------------------- 9. the window's calls
    out('\n9. the window\'s seven calls');
    {
      m.attach();
      const names = Object.keys(ipc.handlers).sort();
      row('seven handlers and no other: status, set, setKey, clearKey, test, ask, usage', names.join(' '), M.NAMES.map(n => 'minds:' + n).sort().join(' '), same(names, M.NAMES.map(n => 'minds:' + n).sort()) && names.length === 7);
      own = false;
      const n0 = fake.seen.length, refused = [];
      for (const n of names) { const r = keep(await ipc.handlers[n]({ sender: {} }, n === 'minds:ask' ? Q : (n === 'minds:setKey' ? 'another-key-000000' : (n === 'minds:set' ? { on: false } : undefined)))); if (r.ok === false && r.kind === 'shape') refused.push(n); }
      own = true;
      const s = keep(await ipc.handlers['minds:status']({ sender: {} }));
      row('a call that is not from the app\'s own page is refused, whichever it is, and does nothing', `${refused.length} of 7 refused; ${fake.seen.length - n0} requests; still on ${s.on}, key ${s.hasKey}`, '7 of 7; 0; on, the key kept', refused.length === 7 && fake.seen.length === n0 && s.on === true && s.hasKey === true);
      const BADQ = [null, 'x', [], {}, { seat: 'quartermaster' }, { seat: 'Quartermaster', stable: STABLE, changing: CHANGING }, { seat: 'q', stable: '', changing: CHANGING }, { seat: 'q', stable: STABLE, changing: 7 },
        { seat: 'q', stable: 'x'.repeat(M.LIMITS.part + 1), changing: CHANGING }, { seat: 'q', stable: STABLE, changing: CHANGING, url: 'https://example.com' }, { seat: 'q', stable: STABLE, changing: CHANGING, headers: {} }];
      const n1 = fake.seen.length, wrong = [];
      for (const q of BADQ) { const r = keep(await ipc.handlers['minds:ask']({ sender: {} }, q)); if (!(r.ok === false && r.kind === 'shape')) wrong.push(JSON.stringify(q).slice(0, 40)); }
      row('a request of the wrong shape (no parts, too long, a field more: an address, headers) is refused, and nothing is asked', wrong.length ? wrong.join('; ') : BADQ.length + ' refused; ' + (fake.seen.length - n1) + ' requests', 'each refused; 0 requests', wrong.length === 0 && fake.seen.length === n1);
    }

    // ---------------------------------------------------------------- 9b. the player's own word
    // (the app lane's review, B2) what would make the app call out, call out elsewhere or spend more is asked of the
    // player by the main process: here a stand-in for its question, which answers from a list
    out('\n9b. the player\'s own word: what the window cannot switch by itself');
    {
      const ipc2 = mkIpc(), asked = [], say = [];             // say: the answers to give, in turn (none left: yes)
      let hold = null;                                         // 'next': keep the next question open, to be answered by hand
      const w = M.create({ ipcMain: ipc2, safeStorage: mkSafe(true), dir: dirOf('word'), isOwn: () => true,
        confirm: (q) => { asked.push(q); if (hold === 'next') return new Promise((res) => { hold = res; }); return Promise.resolve(say.length ? say.shift() : true); } });
      w.attach();
      const call = (name, arg) => ipc2.handlers['minds:' + name]({ sender: {} }, arg).then(keep);
      const n0 = fake.seen.length;
      // off: nothing is asked for anything (an address, a limit), since nothing can be called
      await call('set', { provider: 'custom', base: fake.base, model: 'fake-1', timeoutMs: 1000, limits: { questions: 300 } });
      const quiet = asked.length;
      // the switch: declined, then confirmed
      say.push(false);
      const no = await call('set', { on: true }), offStill = w.status(), offAsk = await call('ask', Q);
      const yes = await call('set', { on: true });
      row('off, nothing is asked; the switch going on is: declined, nothing changes and nobody is called; confirmed, it is on',
        `${quiet} asked while off; declined: ${no.kind}, on ${offStill.on}, a question then: ${offAsk.kind}, ${fake.seen.length - n0} requests; confirmed: on ${yes.on}; asked: ${asked.map(q => q.kind).join(', ')}`,
        '0; declined, false, off, 0; true; on, on',
        quiet === 0 && no.ok === false && no.kind === 'declined' && offStill.on === false && offAsk.kind === 'off' && fake.seen.length === n0 && yes.ok === true && yes.on === true && same(asked.map(q => q.kind), ['on', 'on']));
      const q0 = asked[0] || {};
      row('  the question names the provider, the one address that would be called and the run\'s limits; its other answer is "Cancel"',
        clip(String(q0.message) + ' ' + String(q0.detail), 130), 'the provider at ' + fake.origin + '; 300 questions, 300,000 tokens',
        q0.title === 'The crew\'s minds' && q0.message === 'Switch on the crew\'s minds?' && String(q0.detail).includes(M.PROVIDERS.custom.label + ' at ' + fake.origin + '.') && String(q0.detail).includes('up to 300 questions and 300,000 tokens') && q0.yes === 'Switch on' && q0.no === 'Cancel');
      // on: another address, a higher limit and another provider are each asked; what changes none of the three is not
      const other = await Fake.start();
      try {
        say.push(false);
        const a1 = await call('set', { base: other.base }), at1 = w.status().base;
        const a2 = await call('set', { base: other.base }), at2 = w.status().base;
        const k1 = asked.length;
        await call('set', { model: 'fake-2', effort: 'medium', timeoutMs: 2000 }); await call('set', { limits: { questions: 100, tokens: 200000 } });
        const k2 = asked.length;
        say.push(false);
        const l1 = await call('set', { limits: { tokens: 400000 } }), lim1 = w.status().limits.tokens;
        const l2 = await call('set', { limits: { tokens: 400000 } }), lim2 = w.status().limits.tokens;
        const p1 = await call('set', { provider: 'ollama' });
        const kinds = asked.slice(2).map(q => q.kind);
        row('on: another address is asked (declined, the first stays); a model, the effort, the wait and a LOWER limit are not; a higher limit is; another provider is',
          `${a1.kind}, still ${at1 === fake.base ? 'the first' : at1}; then ${at2 === other.base ? 'the second' : at2}; ${k2 - k1} asked for the four; ${l1.kind}, ${lim1}; then ${lim2}; ${p1.provider}; asked: ${kinds.join(', ')}`,
          'declined, the first; the second; 0; declined, 200000; 400000; ollama; address, address, limits, limits, address',
          a1.ok === false && a1.kind === 'declined' && at1 === fake.base && a2.ok === true && at2 === other.base && k2 === k1 && l1.kind === 'declined' && lim1 === 200000 && l2.ok === true && lim2 === 400000
          && p1.ok === true && p1.provider === 'ollama' && same(kinds, ['address', 'address', 'limits', 'limits', 'address']));
        const qa = asked[2] || {}, ql = asked[4] || {}, qp = asked[6] || {};
        row('  each of those questions says where the app would then call, or what the run could then spend',
          clip([qa.message, ql.message, qp.message].join(' | '), 100), 'the second address; 400,000 (now 200,000); Ollama on this PC',
          qa.message === 'Ask another provider?' && String(qa.detail).includes(' at ' + other.origin + ',') && ql.message === 'Raise this run\'s limits?' && String(ql.detail).includes('up to 100 questions and 400,000 tokens (now 100 and 200,000)')
          && qp.message === 'Ask another provider?' && String(qp.detail).includes(M.PROVIDERS.ollama.label + ' at http://localhost:11434,'));
      } finally { await other.close(); }
      // while a question is open no setting moves, so nothing can be slipped in behind it
      await call('set', { on: false }); await call('set', { provider: 'custom', base: fake.base, model: 'fake-1' });
      const k3 = asked.length;
      hold = 'next';
      const open = call('set', { on: true });
      await new Promise((r) => setTimeout(r, 20));
      const behind = await call('set', { base: 'https://example.com/v1' }), baseThen = w.status().base, onThen = w.status().on;
      const answer = hold; hold = null; if (typeof answer === 'function') answer(true);
      const opened = typeof answer === 'function' ? await open : { ok: false, kind: 'the question was never asked' }, shown = asked[asked.length - 1] || {};
      row('while a question is open every other change from the window is refused: the answer is for what the question said, and that is what goes on',
        `${asked.length - k3} asked; behind it: ${behind.kind}, the address still ${baseThen === fake.base ? 'the one shown' : baseThen}, on ${onThen}; answered: on ${opened.on} at ${opened.base === fake.base ? 'the one shown' : opened.base}`,
        '1; busy, the one shown, false; true at the one shown',
        asked.length - k3 === 1 && behind.ok === false && behind.kind === 'busy' && baseThen === fake.base && onThen === false && opened.ok === true && opened.on === true && opened.base === fake.base && String(shown.detail).includes(' at ' + fake.origin + '.'));
      // an answer that is not a plain yes is no, and so is a question that could not be put
      await call('set', { on: false });
      say.push('yes');
      const notTrue = await call('set', { on: true });
      const ipc3 = mkIpc(), wt = M.create({ ipcMain: ipc3, safeStorage: mkSafe(true), dir: dirOf('word2'), isOwn: () => true, confirm: () => { throw new Error('no window'); } });
      wt.attach();
      const thrown = keep(await ipc3.handlers['minds:set']({ sender: {} }, { on: true }));
      row('an answer that is not a plain yes is no, and so is a question that could not be put', `${notTrue.kind}, on ${w.status().on}; ${thrown.kind}, on ${wt.status().on}`, 'declined, false; declined, false',
        notTrue.ok === false && notTrue.kind === 'declined' && w.status().on === false && thrown.ok === false && thrown.kind === 'declined' && wt.status().on === false);
    }

    // ---------------------------------------------------------------- 9c. the app's runtime packages
    // (tools/app_packages.js: what the packager copies and the self-test holds) the npm command that fits a checkout,
    // and a digest that tells one file changed, added or renamed
    out('\n9c. the app\'s runtime packages: the command that installs them, and a digest of their files');
    {
      const Pk = require('./app_packages.js');
      const bare = dirOf('bare'), full = dirOf('full');
      for (const d of [bare, full]) fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify({ dependencies: { a: '1.0.0' }, devDependencies: { three: '^0.128.0', playwright: '^1.64.0' } }));
      fs.mkdirSync(path.join(full, 'node_modules', 'playwright'), { recursive: true }); fs.writeFileSync(path.join(full, 'node_modules', 'playwright', 'package.json'), '{"version":"1.64.0"}');
      fs.mkdirSync(path.join(bare, 'node_modules', 'a'), { recursive: true }); fs.writeFileSync(path.join(bare, 'node_modules', 'a', 'package.json'), '{"version":"1.0.0"}');
      const ab = Pk.advice(bare), af = Pk.advice(full);
      row('a checkout kept without the development packages is told --omit=dev (only the runtime packages are added); one that has them is not (it would take them off the disk)',
        `without: ${ab.cmd}; with: ${af.cmd}`, 'npm install --omit=dev --ignore-scripts; npm install --ignore-scripts',
        ab.cmd === 'npm install --omit=dev --ignore-scripts' && ab.hasDev === false && af.cmd === 'npm install --ignore-scripts' && af.hasDev === true);
      const mk = (name, list) => { const d = dirOf(name); for (const [f, text] of list) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), text); } return d; };
      const base = [['package.json', '{"version":"1.0.0"}'], ['lib/a.js', 'one'], ['lib/b.js', 'two']];
      const d1 = Pk.digest(mk('p1', base)), d2 = Pk.digest(mk('p2', base.slice().reverse()));
      const dByte = Pk.digest(mk('p3', [base[0], ['lib/a.js', 'onE'], base[2]])), dMore = Pk.digest(mk('p4', base.concat([['lib/c.js', '']]))), dName = Pk.digest(mk('p5', [base[0], ['lib/A2.js', 'one'], base[2]]));
      const dMove = Pk.digest(mk('p6', [base[0], ['lib/a.js', 'on'], ['lib/b.js', 'etwo']]));
      const differ = [dByte, dMore, dName, dMove].filter(d => d.sha256 !== d1.sha256).length;
      row('a package\'s digest is of its files\' paths, sizes and bytes: the same for the same files, another for a byte changed, a file added, a file renamed, a byte moved from one file to the next',
        `${d1.files} files, ${d1.bytes} bytes; the same again: ${d1.sha256 === d2.sha256}; ${differ} of 4 changes seen; no folder: ${Pk.digest(path.join(tmp, 'nowhere'))}`, '3 files; true; 4 of 4; null',
        d1.files === 3 && d1.sha256 === d2.sha256 && differ === 4 && Pk.digest(path.join(tmp, 'nowhere')) === null && /^[0-9a-f]{64}$/.test(d1.sha256));
    }

    // ---------------------------------------------------------------- 10. Claude, through Anthropic's own SDK
    out('\n10. Claude, through Anthropic\'s own SDK (when it is installed in this checkout)');
    {
      let claude = null, whyNot = '';
      try { claude = require('../app/minds_anthropic.js'); } catch (e) { whyNot = String((e && e.code) || (e && e.message) || e).slice(0, 80); }
      if (!claude) row('Anthropic\'s SDK is not installed in this checkout (' + require('./app_packages.js').advice(path.join(__dirname, '..')).cmd + '): Claude\'s rows cannot run here', whyNot, 'CHECK until it is', false, true);
      else {
        // the environment must not be able to steer it: an address, keys, and above all ANTHROPIC_CUSTOM_HEADERS (which the
        // SDK adds to every request whatever key is passed: the app lane's review, A1) set there are never used
        const envKeys = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_PROFILE', 'ANTHROPIC_CUSTOM_HEADERS'], saved = {};
        for (const k of envKeys) saved[k] = process.env[k];
        process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9'; process.env.ANTHROPIC_API_KEY = 'env-key-that-must-not-be-used'; process.env.ANTHROPIC_AUTH_TOKEN = 'env-token-that-must-not-be-used'; delete process.env.ANTHROPIC_PROFILE;
        process.env.ANTHROPIC_CUSTOM_HEADERS = 'X-Leak: 1\nX-Gateway-Key: env-gateway-key-that-must-not-be-used';
        try {
          const c = M.create({ ipcMain: mkIpc(), safeStorage: mkSafe(true), dir: dirOf('claude'), isOwn: () => true, anthropic: claude, anthropicBase: fake.origin });
          c.set({ on: true, timeoutMs: 1000 }); await c.setKey(KEY);
          let n0 = fake.seen.length;
          const r = keep(await c.ask(Q)), q = fake.seen[fake.seen.length - 1] || {}, b = q.body || {}, h = q.headers || {};
          const keyIn = Object.keys(h).filter(k => String(h[k]).includes(KEY)), envIn = JSON.stringify(h).includes('must-not-be-used') || (q.raw || '').includes('must-not-be-used');
          const leaked = Object.keys(h).filter(k => k === 'x-leak' || k === 'x-gateway-key'), left = Object.keys(process.env).filter(k => /^ANTHROPIC_/i.test(k));
          row('one request to the one host, by the SDK: the player\'s key in one header and nowhere else; nothing of the environment\'s', `${fake.seen.length - n0} request to ${q.path}; the key in: ${keyIn.join(', ') || 'NO HEADER'}; the environment's: ${envIn ? 'USED' : 'not used'}; API version ${h['anthropic-version']}`,
            '1; /v1/messages; one header; not used; 2026-10-21', fake.seen.length - n0 === 1 && q.method === 'POST' && q.path === '/v1/messages' && keyIn.length === 1 && !envIn && !(q.raw || '').includes(KEY) && h['anthropic-version'] === '2026-10-21' && same(c.hosts(), [fake.origin]));
          row('  ANTHROPIC_CUSTOM_HEADERS, which the SDK would add to every request: none of its headers is sent, and no ANTHROPIC_* variable is left for it to read', `headers of the environment's sent: ${leaked.join(', ') || 'none'}; ANTHROPIC_* left in the environment: ${left.length}`,
            'none; 0', leaked.length === 0 && left.length === 0);
          const sys = Array.isArray(b.system) ? b.system[0] : null, oc = b.output_config || {};
          row('  the stable part is the system prompt, marked for the cache; the changing part is the user\'s turn', `${sys ? sys.type + ', cache ' + (sys.cache_control && sys.cache_control.type) : 'no system block'}; ${(b.messages || []).map(x => x.role).join(', ')}`, 'text, cache ephemeral; user',
            !!sys && sys.type === 'text' && sys.text === STABLE && !!sys.cache_control && sys.cache_control.type === 'ephemeral' && Array.isArray(b.messages) && b.messages.length === 1 && b.messages[0].role === 'user' && b.messages[0].content === CHANGING);
          row('  the form is a structured output with the fixed schema; effort low; the default model; no sampling or thinking setting', `${oc.format && oc.format.type}; effort ${oc.effort}; ${b.model}; max_tokens ${b.max_tokens}; temperature ${b.temperature}, thinking ${b.thinking}`,
            'json_schema; low; claude-opus-5-5; ' + M.LIMITS.maxTokensClaude + '; undefined, undefined', !!oc.format && oc.format.type === 'json_schema' && same(oc.format.schema, M.TURN_SCHEMA) && oc.effort === 'low' && b.model === 'claude-opus-5-5' && b.max_tokens === M.LIMITS.maxTokensClaude
            && b.temperature === undefined && b.top_p === undefined && b.top_k === undefined && b.thinking === undefined);
          row('  the server\'s own fallback is asked for, under its beta\'s name', `fallbacks ${JSON.stringify(b.fallbacks)}; anthropic-beta: ${h['anthropic-beta']}`, '"default"; ' + claude.FALLBACK_BETA,
            b.fallbacks === 'default' && String(h['anthropic-beta'] || '').split(',').map(s => s.trim()).includes(claude.FALLBACK_BETA) && b.betas === undefined);
          row('  the answer: the text; the tokens in (the cached ones counted), out and cached; the model', `${r.ok ? r.text : r.kind + ': ' + r.why}; ${r.usage ? r.usage.in + '/' + r.usage.out + '/' + r.usage.cached : ''}; ${r.model}`, '{"say":"Aye, sir.","order":null}; 321/17/300; claude-opus-5-5',
            r.ok === true && r.text === '{"say":"Aye, sir.","order":null}' && r.usage.in === 321 && r.usage.out === 17 && r.usage.cached === 300 && r.model === 'claude-opus-5-5');
          c.set({ model: 'claude-haiku-5-5' }); keep(await c.ask(Q));
          const asked = (fake.seen[fake.seen.length - 1].body || {}).model; c.set({ model: '' });
          row('  the model is the player\'s to set', asked, 'claude-haiku-5-5', asked === 'claude-haiku-5-5');
          const got = {};
          for (const mode of ['refusal', '401', '429', '500', 'empty', 'redirect', 'slow']) { fake.mode = mode; got[mode] = keep(await c.ask(Q)); }
          fake.mode = 'ok';
          const want = { refusal: 'refused', 401: 'auth', 429: 'rate', 500: 'server', empty: 'server', redirect: 'network', slow: 'timeout' };
          const off = Object.keys(want).filter(k => !(got[k].ok === false && got[k].kind === want[k] && got[k].why && !got[k].why.includes(KEY)));
          row('  a refusal (read from the stop reason), the key refused, too many requests, a server\'s error, no text, a redirect, no answer', Object.keys(want).map(k => k + ' ' + got[k].kind).join(', '), 'refused, auth, rate, server, server, network, timeout', off.length === 0);
          n0 = fake.seen.length; fake.mode = 'noeffort'; const e1 = keep(await c.ask(Q)), s1 = fake.seen.slice(n0).map(x => Object.keys(x.body.output_config || {}).sort().join('+') || 'none');
          n0 = fake.seen.length; fake.mode = 'noconfig'; const e2 = keep(await c.ask(Q)), s2 = fake.seen.slice(n0).map(x => Object.keys(x.body.output_config || {}).sort().join('+') || 'none');
          fake.mode = 'ok';
          row('  a model that refuses the effort, or the form, is asked again without it', `${e1.ok}: ${s1.join(' > ')}; ${e2.ok}: ${s2.join(' > ')}`, 'true: effort+format > format; true: effort+format > format > none',
            e1.ok === true && same(s1, ['effort+format', 'format']) && e2.ok === true && same(s2, ['effort+format', 'format', 'none']));
          row('  through all of it the SDK called the one host only', JSON.stringify(c.hosts()), `["${fake.origin}"]`, same(c.hosts(), [fake.origin]));
        } finally { for (const k of envKeys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } }
      }
    }

    // ---------------------------------------------------------------- 11. nothing printed; the key in no answer; one schema
    out('\n11. nothing is printed, the key is in no answer, and the page and the app hold one schema');
    {
      const leaks = answers.filter(a => a.includes(KEY));
      row('through all of it nothing was printed to a console, and no answer of the seven calls holds the key', `${printed.length} lines printed; ${leaks.length} of ${answers.length} answers hold the key`, '0; 0', printed.length === 0 && leaks.length === 0);
      const lib = path.join(__dirname, '..', 'site', 'parts', '87_minds_words.js');
      let L = null; try { L = fs.existsSync(lib) ? require(lib) : null; } catch (e) { L = { error: e.message }; }
      if (!L) row('the page\'s library is not built yet: its schema cannot be held to the app\'s', 'site/parts/87_minds_words.js is not there', 'CHECK until it is', false, true);
      else row('the page\'s library and the app hold the same schema of a turn', L.error ? 'the library did not load: ' + L.error : JSON.stringify(L.SCHEMA || null).slice(0, 60), JSON.stringify(M.TURN_SCHEMA).slice(0, 60), !L.error && same(L.SCHEMA, M.TURN_SCHEMA));
    }
  } catch (e) {
    fails++; out('FAIL the suite could not finish: ' + (e && e.stack || e));
  } finally {
    await fake.close();
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* the system clears its temporary folder */ }
    out(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
    process.exit(fails ? 1 : 0);
  }
})();
