// The bridge heard (site/parts/89_voice.js) in a real browser (headless Edge or Chrome), with a stand-in for the app's
// second object and nothing beyond Node.
//   node tools/voice_site_test.js [dist] [screenshot dir] [--real]
// docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, sections 4 and 9c:
//   1. a browser has no app: "Hear the bridge" stands in the order line's section, off; Deepgram's fold is not shown
//   2. the floor: this browser's own speech. Only voices the system says are local, English ones; a man's line is given
//      to it once, the captain's own never; with none, the section says so
//   3. a stand-in for the app's object: the fold shows; the key typed is passed once to the app and is then nowhere in the
//      page; the switch, by a real click; the note outside the fold says that lines are sent
//   4. a man's line: asked of the app once, by his name and his words alone; the WAV decoded by the browser's own Web
//      Audio and played to its end; no audio element, no blob: or data: address, nothing refused by the page's policy
//   5. above four times her pace nothing is asked for
//   6. a key refused stands Deepgram down: the next line asks nothing, until the player changes something in the fold
//   7. the watch, with all of that, has the fingerprint of the model alone
//   8. a new run stops what plays
//   9. nothing on the stage; its one setting in the page's storage; tools/clock_tests.js still passes; no console error
// The stand-in is this suite's own (the app's side is held by tools/voice_app_tests.js and the app's self-test): it
// answers at once, and its WAVs are SILENCE, so that the suite makes no sound on the machine it runs on. For the same
// reason the floor's lines are given to a speaker of this suite's that takes the browser's real voices and utterances and
// voices nothing. Each page is opened with clock=test (QC C-3); a WAV plays on the audio's own clock, which is real, so
// the two rows that wait for a sound's end wait on real time (a second at most). --real runs every row on real time.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const B = require('./cdp');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };
const WARP = 6;                                    // the watch's real time until the ice is passed, multiplied (a test hook)
const KEY = 'not-a-key-0123456789-typed-by-the-suite';
const ASK = 'Mr Murdoch, what did you see?';       // a question: no order, so the watch stays on its recorded orders
const OOW = 'The officer of the watch', ANSWER = 'I couldn\'t say, sir.';
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }

// the stand-in for the app's object, made in the page: six calls, each a Promise, as app/voice.js answers them
const STAND_IN = `(() => {
  const wav = (secs) => { const rate = 24000, n = Math.round(rate * secs), b = new ArrayBuffer(44 + 2 * n), v = new DataView(b);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + 2 * n, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, 2 * rate, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, 2 * n, true); return b; };
  const st = { ok: true, on: false, hasKey: false, keyKept: 'store', canProtect: true, origin: 'https://api.deepgram.com', limits: { chars: 40000 }, used: { chars: 0, lines: 0 } };
  const copy = () => JSON.parse(JSON.stringify(st));
  const D = { calls: [], secs: 0.25, refuse: '', keys: [],
    status: () => Promise.resolve(copy()),
    set: (p) => { D.calls.push(['set', JSON.stringify(p)]); if (p && typeof p.on === 'boolean') st.on = p.on; if (p && p.limits && p.limits.chars > 0) st.limits.chars = p.limits.chars; return Promise.resolve(copy()); },
    setKey: (k) => { D.calls.push(['setKey', String(k).length]); D.keys.push(String(k)); st.hasKey = true; return Promise.resolve(copy()); },
    clearKey: () => { D.calls.push(['clearKey']); st.hasKey = false; return Promise.resolve(copy()); },
    test: () => { D.calls.push(['test']); return Promise.resolve(D.refuse ? { ok: false, kind: D.refuse, why: 'Deepgram refused the key' } : { ok: true, ms: 120 }); },
    speak: (line) => { D.calls.push(['speak', JSON.stringify(line)]);
      if (D.refuse) return Promise.resolve({ ok: false, kind: D.refuse, why: 'Deepgram refused the key' });
      const n = String(line && line.text).length; st.used.chars += n; st.used.lines++;
      return Promise.resolve({ ok: true, wav: wav(D.secs), voice: 'flux-conor-en', chars: n }); } };
  window.__dg = D; return true; })()`;
// the floor's speaker for this suite: the browser's real voices and its real utterances, and no sound
const QUIET = `(() => { const real = window.speechSynthesis, U = window.SpeechSynthesisUtterance;
  if (!real || typeof U !== 'function') return { speech: false, all: 0 };
  const rec = window.__spoke = []; window.__cancels = 0;
  const quiet = { getVoices: () => real.getVoices(), cancel: () => { window.__cancels++; }, addEventListener: (t, f) => real.addEventListener(t, f),
    speak: (u) => { rec.push({ text: u.text, voice: u.voice ? u.voice.name : '', local: !!(u.voice && u.voice.localService), lang: u.lang, isUtterance: u instanceof U }); Promise.resolve().then(() => { if (typeof u.onend === 'function') u.onend(); }); } };
  TitanicApp.voice.useSynth(quiet, U);
  return { speech: true, all: real.getVoices().length }; })()`;

(async () => {
  const b = await B.launch({ dist });
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (REAL) await b.waitFor('window.__held', ms || 180000, what);
    else await b.vrun('window.__held', { maxMs: ms || 180000, held: false, what });
  };
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  const settle = (ms) => (REAL ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
  const picture = async (name) => { if (!shots) return; if (!REAL) await b.vframes(1, { render: true }); await b.shot(path.join(shots, name)); };
  const press = async (key, code, vk) => { for (const type of ['keyDown', 'keyUp']) await b.page.send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk }); };
  // a line typed as a person types it: a real click on the line, the words as typed, Enter
  const type = async (text) => { await b.clickSel('#crewLine'); await b.page.send('Input.insertText', { text }); await press('Enter', 'Enter', 13); };
  const speaks = () => b.ev('window.__dg ? window.__dg.calls.filter(c => c[0] === "speak").map(c => c[1]) : []');
  const dgLines = () => b.ev('TitanicApp.voice.lines()');
  // a line's sound plays on the audio's own clock (real time, whatever the page's clock is): its end is waited for there
  const ended = (n, what) => b.waitFor(`(() => { const L = TitanicApp.voice.lines(); return L.length >= ${n} && L[L.length - 1].end !== null; })()`, 20000, what);
  const text = (id) => b.ev(`(() => { const e = document.getElementById(${JSON.stringify(id)}); return e ? { hidden: !!e.hidden, text: e.textContent } : null; })()`);
  try {
    // ---- 1. a browser has no app
    await b.open('#night=1912', OPEN);
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await b.ev('window.__csp = 0; document.addEventListener("securitypolicyviolation", () => { window.__csp++; }); true');
    const ui = await b.ev(`(() => { const A = TitanicApp, box = document.getElementById('voiceOn'), fold = document.getElementById('voiceDgFold');
      return { part: !!A.voice, on: !!A.voice && A.voice.on(), box: !!box && !box.checked, inRun: !!box && !!box.closest('#crewSec') && !!box.closest('#panel') && !!box.closest('[data-pane="run"]'),
        fold: !!fold && fold.hidden === true, transport: !!A.voice && A.voice.transport() !== null, dg: !!A.voice && A.voice.deepgram(), stored: localStorage.getItem('titanic.voice.on') }; })()`);
    row('1. no app (a browser): "Hear the bridge" in the order line\'s section of the Run tab, off; Deepgram\'s fold not shown', `${ui.inRun ? 'in the Run tab\'s section' : 'NOT IN THE SECTION'}; on ${ui.on}; the fold ${ui.fold ? 'hidden' : 'SHOWN'}; transport ${ui.transport}; stored ${ui.stored}`,
      'in the section; off; hidden; no transport; nothing stored', ui.part && !ui.on && ui.box && ui.inRun && ui.fold && !ui.transport && !ui.dg && ui.stored === null);

    // ---- 2. the floor: this browser's own speech, through a speaker of this suite's that voices nothing
    try { await b.waitFor('!!window.speechSynthesis && speechSynthesis.getVoices().length > 0', 3000, 'the browser\'s voices'); } catch (e) { /* a browser may list none: the row says which */ }
    const q = await b.ev(QUIET);
    const v2 = await b.ev(`({ used: TitanicApp.voice.voices(), disabled: document.getElementById('voiceOn').disabled, all: window.speechSynthesis ? speechSynthesis.getVoices().map(v => ({ name: v.name, lang: v.lang, local: v.localService })) : [] })`);
    const notLocal = v2.used.filter(u => !v2.all.some(a => a.name === u.name && a.local === true && /^en([-_]|$)/i.test(a.lang)));
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await holdWhen('sim.night.tTouch >= 0 && sim.t >= sim.night.tTouch + 120', 'two minutes after the touch');
    if (!v2.disabled) await b.clickSel('#voiceOn');
    const on2 = await b.ev(`({ on: TitanicApp.voice.on(), stored: localStorage.getItem('titanic.voice.on'), note: document.getElementById('voiceNote').textContent, hidden: document.getElementById('voiceNote').hidden })`);
    const n2 = await b.ev('(window.__spoke || []).length');
    await type(ASK);
    await settle(50);
    const s2 = await b.ev(`({ spoke: (window.__spoke || []).slice(${n2}), talk: TitanicApp.crew.lines().slice(-2).map(l => ({ who: l.who, words: l.words })), log: TitanicApp.voice.spoken().slice(-1) })`);
    const talk2 = s2.talk.length === 2 && s2.talk[0].who === 'You' && s2.talk[1].who === OOW && s2.talk[1].words === ANSWER;
    if (!q.speech || v2.disabled) {
      row('2. the floor: this browser cannot speak, and the section says so; nothing is spoken', `speech ${q.speech}; the switch ${v2.disabled ? 'disabled' : 'ENABLED'}; "${on2.note}"`, 'disabled; This browser cannot speak.', v2.disabled && /cannot speak/.test(on2.note) && s2.spoke.length === 0 && talk2);
    } else if (!v2.used.length) {
      row('2. the floor: this browser lists no local English voice (of ' + v2.all.length + '): nothing is spoken, and the section says so', `on ${on2.on}; "${on2.note.slice(0, 60)}"; given ${s2.spoke.length}`, 'on; no English voice of its own; 0',
        on2.on && on2.stored === '1' && !on2.hidden && /no English voice of its own/.test(on2.note) && s2.spoke.length === 0 && talk2);
    } else {
      const g = s2.spoke[0] || {};
      row('2. the floor: this browser\'s own local English voices and no other (' + v2.used.length + ' of ' + v2.all.length + ' listed); switched on by a real click', `on ${on2.on}, stored ${on2.stored}; ${v2.used.map(u => u.name + ' ' + u.lang).join(', ').slice(0, 70)}; not local: ${notLocal.length}`,
        'on; local English ones only', on2.on && on2.stored === '1' && notLocal.length === 0 && !on2.hidden && /Nothing is sent anywhere/.test(on2.note));
      row('  a man\'s line is given to the speech once, in one of those voices; the captain\'s own line is not', `${s2.spoke.length} given: "${g.text}" in ${g.voice} (${g.lang}, local ${g.local}); the talk: ${s2.talk.map(l => l.who).join(' / ')}`, `1: "${ANSWER}" in a local voice; You / ${OOW}`,
        s2.spoke.length === 1 && g.text === ANSWER && g.local === true && g.isUtterance === true && v2.used.some(u => u.name === g.voice) && talk2 && s2.log.length === 1 && s2.log[0].who === OOW);
    }
    if (on2.on) await b.clickSel('#voiceOn');        // the floor off again: Deepgram's rows are about Deepgram's voices alone
    const off2 = await b.ev('({ on: TitanicApp.voice.on(), stored: localStorage.getItem("titanic.voice.on") })');

    // ---- 3. a stand-in for the app's object: the fold, the key, the switch
    await b.ev(STAND_IN);
    await b.ev('TitanicApp.voice.useTransport(window.__dg).then(() => true)');
    await settle(50);
    const f3 = await b.ev(`(() => { const f = document.getElementById('voiceDgFold'); return { shown: !f.hidden, open: f.open, inSec: !!f.closest('#crewSec'), sum: document.getElementById('voiceDgSum').textContent, keyNote: document.getElementById('voiceDgKeyNote').textContent,
      disabled: ['voiceDgOn', 'voiceDgKey', 'voiceDgSave', 'voiceDgForget', 'voiceDgTry', 'voiceDgLimit'].filter(id => document.getElementById(id).disabled).length, limit: document.getElementById('voiceDgLimit').value }; })()`);
    row('3. with the app\'s object there: "Deepgram\'s voices (your own key)" folded under the switch, off, no key kept', `${f3.shown ? 'shown' : 'HIDDEN'}${f3.open ? ', OPEN' : ', folded'}; "${f3.sum}"; "${f3.keyNote.slice(0, 44)}"; limit ${f3.limit}`,
      'shown, folded; ...: off; No key is kept: nothing is sent to Deepgram.; 40000', f3.shown && !f3.open && f3.inSec && /: off$/.test(f3.sum) && /^No key is kept: nothing is sent to Deepgram\./.test(f3.keyNote) && f3.disabled === 0 && f3.limit === '40000' && !off2.on);
    await b.clickSel('#voiceDgFold > summary');
    await b.clickSel('#voiceDgKey');
    await b.page.send('Input.insertText', { text: KEY });
    const typed3 = await b.ev('document.getElementById("voiceDgKey").value.length');
    await b.clickSel('#voiceDgSave');
    await settle(50);
    const k3 = await b.ev(`(() => { const KEY = ${JSON.stringify(KEY)}, D = window.__dg, k = document.getElementById('voiceDgKey');
      return { field: k.type + ':' + k.value.length, calls: D.calls.filter(c => c[0] === 'setKey').map(c => c[1]), same: D.keys.length === 1 && D.keys[0] === KEY, note: document.getElementById('voiceDgKeyNote').textContent,
        inPage: document.documentElement.outerHTML.includes(KEY) || [...document.querySelectorAll('input, textarea')].some(e => String(e.value).includes(KEY)),
        stored: Object.keys(localStorage).some(x => String(localStorage.getItem(x)).includes(KEY)) || Object.keys(sessionStorage).some(x => String(sessionStorage.getItem(x)).includes(KEY)),
        status: JSON.stringify(TitanicApp.voice.status()).includes(KEY), talk: JSON.stringify(TitanicApp.crew.lines()).includes(KEY) }; })()`);
    row('  the key, typed and saved: passed once to the app, the field cleared at once, and then nowhere in the page', `typed ${typed3}; field ${k3.field}; setKey ${k3.calls.join()}; in the page ${k3.inPage}, storage ${k3.stored}, status ${k3.status}, the talk ${k3.talk}`,
      `${KEY.length}; password:0; ${KEY.length}; false, false, false, false`, typed3 === KEY.length && k3.field === 'password:0' && k3.calls.length === 1 && k3.calls[0] === KEY.length && k3.same && /^A key is kept, encrypted/.test(k3.note) && !k3.inPage && !k3.stored && !k3.status && !k3.talk);
    await b.clickSel('#voiceDgOn');
    await settle(50);
    const o3 = await b.ev(`({ dg: TitanicApp.voice.deepgram(), sum: document.getElementById('voiceDgSum').textContent, note: document.getElementById('voiceNote').textContent, hidden: document.getElementById('voiceNote').hidden,
      sets: window.__dg.calls.filter(c => c[0] === 'set').map(c => c[1]) })`);
    row('  switched on by a real click (the app itself asks the player; the stand-in says yes): the fold\'s title says ON, and the note outside it that lines are sent', `deepgram ${o3.dg}; "${o3.sum}"; "${o3.note.slice(0, 74)}"; ${o3.sets.join()}`,
      'true; ...: ON; each line a man says is sent to Deepgram, as text; {"on":true}', o3.dg === true && /: ON$/.test(o3.sum) && !o3.hidden && /each line a man says is sent to Deepgram, as text/.test(o3.note) && o3.sets.length === 1 && o3.sets[0] === '{"on":true}');
    await picture('voice-section.png');

    // ---- 4. a man's line: asked once, decoded by the browser's own Web Audio, played to its end
    await b.ev('window.__dg.secs = 1.0');
    const n4 = (await speaks()).length, L4 = (await dgLines()).length;
    await type(ASK);
    const mid4 = await b.ev('({ playing: TitanicApp.voice.playing(), held: TitanicApp.voice.held(), queue: TitanicApp.voice.queue().length })');
    await ended(L4 + 1, 'the line\'s sound to end');
    const a4 = await b.ev(`(() => { const A = TitanicApp, L = A.voice.lines(), l = L[L.length - 1]; return { line: l, n: L.length, held: A.voice.held(), playing: A.voice.playing(), use: document.getElementById('voiceDgUse').textContent, fault: A.voice.fault(),
      audio: document.querySelectorAll('audio, video').length, addr: performance.getEntriesByType('resource').filter(e => /^(blob|data):/.test(e.name)).length, csp: window.__csp,
      ctx: (() => { try { return typeof (window.AudioContext || window.webkitAudioContext); } catch (e) { return 'none'; } })() }; })()`);
    const asked4 = (await speaks()).slice(n4);
    row('4. a man\'s line is asked of the app once, by his name and his words alone', `${asked4.length} asked: ${asked4.join(' ')}`, `1: {"who":"${OOW}","text":"${ANSWER}"}`, asked4.length === 1 && asked4[0] === JSON.stringify({ who: OOW, text: ANSWER }));
    row('  its WAV is decoded by the browser\'s own Web Audio and played to its end; a handle is held only while it plays', `while playing: ${mid4.playing ? mid4.playing.who : 'NOTHING'}, held ${mid4.held}; then: ${a4.line.state}, ${a4.line.end}, voice ${a4.line.voice}; held ${a4.held}; fault "${a4.fault}"`,
      `${OOW}, 1; playing, played, flux-conor-en; 0; no fault`, !!mid4.playing && mid4.playing.who === OOW && mid4.held === 1 && a4.n === L4 + 1 && a4.line.end === 'played' && a4.line.voice === 'flux-conor-en' && a4.held === 0 && a4.playing === null && a4.fault === '' && a4.ctx === 'function');
    row('  the sound reached the page as bytes: no audio element, no blob: or data: address, nothing refused by the page\'s policy', `${a4.audio} audio elements; ${a4.addr} such addresses; ${a4.csp} refusals`, '0; 0; 0', a4.audio === 0 && a4.addr === 0 && a4.csp === 0);
    row('  the run\'s use is shown as the app counts it', a4.use, `This run of the app: ${ANSWER.length} of 40,000 characters sent to Deepgram, in 1 line.`, a4.use === `This run of the app: ${ANSWER.length} of 40,000 characters sent to Deepgram, in 1 line.`);

    // ---- 5. above four times her pace nothing is asked for (the lines then come faster than they can be said)
    await b.ev('window.__dg.secs = 0.25; TitanicApp.state.speed = 30; TitanicApp.state.playing = true');
    try { await waitPage('TitanicApp.pace() === 30', 20000, 'her pace at thirty'); } catch (e) { /* the row says it */ }
    const n5 = (await speaks()).length, pace5 = await b.ev('TitanicApp.pace()');
    await type(ASK);
    await b.ev('TitanicApp.state.playing = false; TitanicApp.state.speed = 1');
    await settle(50);
    const a5 = (await speaks()).length - n5, t5 = await b.ev('TitanicApp.crew.lines().slice(-1)[0]');
    row('5. above four times her pace nothing is asked for; the caption stands in the talk all the same', `pace ${pace5}: ${a5} asked; the talk: "${t5.who}: ${t5.words}"`, `pace 30: 0; "${OOW}: ${ANSWER}"`, pace5 === 30 && a5 === 0 && t5.who === OOW && t5.words === ANSWER);

    // ---- 6. a key refused stands Deepgram down for the run: said once outside the fold, and the next line asks nothing
    await b.ev('window.__dg.refuse = "auth"');
    const n6 = (await speaks()).length, L6 = (await dgLines()).length;
    await type(ASK);
    await settle(50);
    const d6 = await b.ev(`(() => { const A = TitanicApp, L = A.voice.lines(), n = document.getElementById('voiceDgNote'); return { down: A.voice.down(), dg: A.voice.deepgram(), last: L[L.length - 1], n: L.length, note: n.textContent, hidden: n.hidden, sum: document.getElementById('voiceDgSum').textContent, notes: A.voice.faultNotes() }; })()`);
    await type(ASK);
    await settle(50);
    const a6 = (await speaks()).length - n6, notes6 = await b.ev('TitanicApp.voice.faultNotes()');
    row('6. a key refused: Deepgram\'s voices stand down for the run, said once outside the fold; the next line asks nothing', `down "${d6.down}"; "${d6.note.slice(0, 80)}"; "${d6.sum.slice(-22)}"; the line ${d6.last.end}; asked ${a6} in two lines; said ${notes6 - d6.notes + 1} time`,
      'auth; stand down for this run: Deepgram refused the key; on, standing down; silent; 1; once', d6.down === 'auth' && d6.dg === false && d6.n === L6 + 1 && d6.last.end === 'silent' && !d6.hidden && /^Deepgram's voices stand down for this run: Deepgram refused the key\./.test(d6.note)
      && /Nothing is spoken instead/.test(d6.note) && /: on, standing down$/.test(d6.sum) && a6 === 1 && notes6 === d6.notes);
    // what the player changes in the fold lifts it: "Try it", answered
    await b.ev('window.__dg.refuse = ""');
    await b.clickSel('#voiceDgTry');
    await settle(50);
    const try6 = await text('voiceDgTryOut');
    const n6b = (await speaks()).length, L6b = (await dgLines()).length;
    await type(ASK);
    await ended(L6b + 1, 'the line after "Try it"');
    const b6 = await b.ev('({ down: TitanicApp.voice.down(), last: TitanicApp.voice.lines().slice(-1)[0], note: document.getElementById("voiceDgNote").hidden })');
    row('  "Try it", answered, lifts it: the next line is asked for and played, and the fault is no longer said', `"${try6 ? try6.text : ''}"; asked ${(await speaks()).length - n6b}; ${b6.last.end}; the note ${b6.note ? 'gone' : 'STILL SHOWN'}`,
      'Deepgram answered in 0.1 s: the key is taken.; 1; played; gone', !!try6 && try6.text === 'Deepgram answered in 0.1 s: the key is taken.' && (await speaks()).length - n6b === 1 && b6.down === '' && b6.last.end === 'played' && b6.note === true);

    // ---- 7. the watch, with all of that, has the fingerprint of the model alone (the part reads and feeds nothing back)
    await b.ev('TitanicApp.state.playing = true');
    await holdWhen('true', 'a step to stand on');
    const fp7 = await b.ev(`(() => { const s = TitanicApp.state.sim, k = s.night.k, NN = TitanicNight, m = NN.create(TitanicCore.buildShip(), NN.spec(1912), { auto: true, readers: false });
      while (m.night.k < k) NN.step(m); return { k, fp: NN.fingerprint(s), alone: NN.fingerprint(m), mode: TitanicApp.state.night.mode }; })()`);
    row('7. the 1912 orders\' watch, heard through both voices, has the fingerprint of the model alone', `step ${fp7.k}: ${fp7.fp}; ${fp7.mode}`, `the model alone in the page: ${fp7.alone}`, fp7.fp === fp7.alone && fp7.mode === 'auto');

    // ---- 9 (its part of it, before the run is made new). nothing on the stage; its one setting in the page's storage
    const st9 = await b.ev(`(() => { const all = [...document.querySelectorAll('[id^="voice"], .voice-row, .voice-note, .voice-fold')]; return { onStage: all.filter(e => e.closest('#stage')).length, inSec: all.filter(e => e.closest('#crewSec')).length, n: all.length,
      keys: Object.keys(localStorage).filter(k => /voice/.test(k)).sort(), key: (() => { const k = document.getElementById('voiceDgKey'); return k.type + ':' + k.value.length; })() }; })()`);

    // ---- 8. a new run stops what plays (a long sound, and the page's own Reset)
    await b.ev('window.__dg.secs = 8');
    const L8 = (await dgLines()).length;
    await type(ASK);
    await b.waitFor('TitanicApp.voice.playing() !== null', 5000, 'the long line to play');
    const mid8 = await b.ev('({ playing: TitanicApp.voice.playing(), held: TitanicApp.voice.held() })');
    await b.click('bReset');
    await settle(50);
    const a8 = await b.ev(`(() => { const A = TitanicApp, L = A.voice.lines(); return { n: L.length, last: L[L.length - 1], playing: A.voice.playing(), held: A.voice.held(), queue: A.voice.queue().length, k: A.state.sim.night ? A.state.sim.night.k : A.state.sim.k }; })()`);
    row('8. a new run (the page\'s own Reset) stops what plays: the line is hushed and its sound let go', `while playing: held ${mid8.held}; after Reset: ${a8.last.end}, playing ${a8.playing === null ? 'nothing' : 'STILL'}, held ${a8.held}, waiting ${a8.queue}`,
      'held 1; hushed, nothing, 0, 0', !!mid8.playing && mid8.held === 1 && a8.n === L8 + 1 && a8.last.end === 'hushed' && a8.playing === null && a8.held === 0 && a8.queue === 0);

    // ---- 9. nothing on the stage; the page's clock rules still hold; no error in the console
    const wantKeys = v2.disabled ? '' : 'titanic.voice.on';      // (a browser that cannot speak never has the switch set)
    row('9. nothing of the part on the stage: all of it in the order line\'s section; its storage, one setting; the key\'s field empty', `${st9.onStage} on the stage, ${st9.inSec} of ${st9.n} in the section; ${st9.keys.join(', ')}; key field ${st9.key}`,
      `0; all; ${wantKeys || 'nothing'}; password:0`, st9.onStage === 0 && st9.inSec === st9.n && st9.n > 10 && st9.keys.join() === wantKeys && st9.key === 'password:0');
    const ck = spawnSync(process.execPath, [path.join(__dirname, 'clock_tests.js')], { encoding: 'utf8' });
    const ckLast = (ck.stdout || '').trim().split(/\r?\n/).pop();
    row('  tools/clock_tests.js still passes with the part (no wall clock read, no timer of its own)', ckLast, 'PASS: all 3 rows', ck.status === 0 && /^PASS/.test(ckLast));
    row('  no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
