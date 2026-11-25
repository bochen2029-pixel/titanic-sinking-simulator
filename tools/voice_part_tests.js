// The bridge heard (site/parts/89_voice.js): each line a man says on the bridge spoken aloud by this PC's own voices,
// held in plain Node on a stand-in for the page (tools/toy_page.js) with a stand-in for the browser's speech:
//   node tools/voice_part_tests.js
// What it holds: off by default; only LOCAL English voices are ever chosen (never one made by a service on the network),
// British first; a named man's line is spoken, the captain's own lines and the notices are not; a man keeps his voice
// and his pitch; nothing above four times her pace; three lines wait at most; a reset and her foundering hush it; with
// no local English voice nothing is spoken and the section says so; the crew's own words (imagined) are spoken too.
// Then Deepgram's voices, with a stand-in for the app's titanicVoice and one for the page's player: with no transport
// the part is the floor alone; with its switch off, the floor as before; on, a man's line is asked of the app by his name
// and words alone and played, never by both voices; one plays at a time, the next asked for while it plays; three wait
// at most; a fault is said once and the line goes to this PC's voice when its switch is on, else nowhere; a lasting
// fault stands Deepgram down until the player changes something; nothing for the captain's lines, notices, or above four
// times her pace; a new run, her foundering and the switch going off stop it; the key's field read once and cleared at
// once; the page's own bound on an answer that never comes.
// Then the ears (speaking to the bridge), with a stand-in for the app's ears (open, audio, finish, cancel, onHeard) and
// stand-ins for the browser's getUserMedia and MediaRecorder: the public page shows no microphone; held and let go (Space
// in the empty line, or the button), the words go to the order line as typed words do and the order is logged as the
// same order typed; the recorder's last slice is sent before the app is asked to finish; Space in a line with words is a
// space; Escape gives it up; a failed or empty transmission gives nothing and is said once; the men's voices wait while
// it is held; the microphone is closed 20 s after its last use, at a new run and when the ears go off; the page's own
// 35 s bound. And the review of the ears: words the app says are not final shown greyed and never given; a spoken
// question (Deepgram's "?") given as no order, and Deepgram's punctuation on a plain order the typed order; a recorder
// stopped by the browser while the key is held gives nothing; a key let go before the transmission has begun records
// nothing. And its second review: Deepgram's commas taken out where the words as they came are no order and without them
// are one (a question never tried again; the order line's reading for it gives nothing); the track ended and the key
// let go before the recorder's own stop gives nothing; words left greyed are cleared at a new run, at her end and with
// the ears off; a fault's words after Forget.
// It is NOT the page, and no sound is made: what a browser's own speech does with an utterance is the browser's, and
// what the app and Deepgram do with a line is tools/voice_app_tests.js's.
'use strict';
const toyPage = require('./toy_page.js');
const P = toyPage({ minutes: 2, parts: ['86_crew.js', '88_minds.js', '89_voice.js'] });
const { A, byId, lines, last, step, tick, store, errors } = P;
const out = []; let fails = 0;
const row = (what, ok, detail) => { if (!ok) fails++; out.push((ok ? 'PASS ' : 'FAIL ') + what + (detail ? '  [' + String(detail).slice(0, 220) + ']' : '')); };

// a stand-in for the browser's speech: it keeps what it is given, and can be told its voices
function fakeSynth(list) {
  const s = { voices: list, given: [], cancels: 0, getVoices() { return this.voices; }, speak(u) { this.given.push(u); }, cancel() { this.cancels++; },
    addEventListener() {}, finish(n) { for (const u of this.given.slice(-(n || this.given.length))) if (typeof u.onend === 'function') u.onend(); } };
  return s;
}
function Utter(text) { this.text = text; this.voice = null; this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.onend = null; this.onerror = null; }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const settle = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r)); };
// a stand-in for the app's titanicVoice (app/voice.js): it keeps what it is asked and answers a line with a WAV of its
// own (its first bytes RIFF and WAVE; nothing plays it here) or with the fault it is told (mode), at once or when the
// test releases it (hold); decline: the player does not confirm the switch
function fakeVoice() {
  const st = { on: false, hasKey: true, chars: 0, lines: 0 };
  const T = { asked: [], sets: [], keys: [], clears: 0, tests: 0, testWhy: null, mode: 'ok', decline: false, hold: false, pending: [], wavs: [] };
  const status = () => ({ ok: true, available: true, on: st.on, provider: 'Deepgram', origin: 'https://api.deepgram.com', hasKey: st.hasKey, keyKept: st.hasKey ? 'disk' : null, canProtect: true,
    limits: { chars: 40000 }, used: { chars: st.chars, lines: st.lines }, hosts: [] });
  const answer = (r) => {
    if (T.mode !== 'ok') return { ok: false, kind: T.mode, why: 'Deepgram says no (' + T.mode + ').' };
    st.chars += r.text.length; st.lines++;
    const b = new Uint8Array(64); 'RIFF'.split('').forEach((c, i) => { b[i] = c.charCodeAt(0); }); 'WAVE'.split('').forEach((c, i) => { b[8 + i] = c.charCodeAt(0); });
    T.wavs.push(b.buffer);
    return { ok: true, wav: b.buffer, voice: 'flux-test-en', ms: 5, chars: r.text.length };
  };
  return Object.assign(T, {
    state: st,
    status: () => Promise.resolve(status()),
    set(p) { T.sets.push(p); if (T.decline && p && p.on === true && !st.on) return Promise.resolve({ ok: false, kind: 'declined', why: 'You did not confirm it: nothing was changed.' }); if (p && typeof p.on === 'boolean') st.on = p.on; return Promise.resolve(status()); },
    setKey(k) { T.keys.push(k); st.hasKey = true; return Promise.resolve(status()); },
    clearKey() { T.clears++; st.hasKey = false; return Promise.resolve(status()); },
    test() { T.tests++; return Promise.resolve(T.testWhy ? { ok: false, kind: 'auth', why: T.testWhy } : { ok: true, ms: 420 }); },
    speak(r) { const q = Object.assign({}, r); T.asked.push(q); if (T.hold) return new Promise((res) => T.pending.push(() => res(answer(q)))); return Promise.resolve(answer(q)); },
    release(n) { for (let i = 0; i < (n || 1) && T.pending.length; i++) T.pending.shift()(); },
  });
}
// a stand-in for the page's player: it plays nothing, and a line ends when the test says (finish)
function fakePlayer() {
  const P = { plays: [] };
  P.play = (wav, done) => { const h = { wav, done, stopped: false, ended: false, stop() { h.stopped = true; } }; P.plays.push(h); return h; };
  P.now = () => P.plays.filter(h => !h.ended && !h.stopped);
  P.finish = () => { const h = P.now()[0]; if (h) { h.ended = true; h.done(true); } return h; };
  return P;
}
// a stand-in for the app's ears (and its voices): it keeps every call in order (calls), opens a transmission (or refuses,
// mode 'refuse'), takes slices, and at finish answers the words it is told (words), a fault (mode 'fail') or nothing
// heard (mode 'empty'), at once or when the test releases it (holdFinish); hear(text) sends the words heard so far to
// the page's listener. Its voices answer a WAV of its own, as fakeVoice's do
function fakeEars() {
  const st = { on: false, ears: false, hasKey: true, n: 0 };
  // busy: the app's own question to the player is open (app/voice.js refuses setKey, clearKey, test, speak and open then).
  // clearFault: the fault clearKey answers, the key forgotten all the same (app/voice.js: 'unsaved', the settings unwritable)
  const E = { calls: [], asked: [], sets: [], ids: 0, cur: 0, words: 'hard a starboard', mode: 'ok', holdFinish: false, pending: [], heardFn: null, onHeardCalls: 0, busy: false, clearFault: null };
  const BUSY = { ok: false, kind: 'busy', why: 'An earlier change is waiting for your answer.' };
  const status = () => ({ ok: true, available: true, on: st.on, ears: st.ears, provider: 'Deepgram', origin: 'https://api.deepgram.com', earsOrigin: 'wss://api.deepgram.com',
    hasKey: st.hasKey, keyKept: st.hasKey ? 'disk' : null, canProtect: true, limits: { chars: 40000, secs: 1800 }, used: { chars: 0, lines: 0, secs: 3 * st.n, transmissions: st.n }, hosts: [] });
  const wavOf = () => { const b = new Uint8Array(64); 'RIFF'.split('').forEach((c, i) => { b[i] = c.charCodeAt(0); }); 'WAVE'.split('').forEach((c, i) => { b[8 + i] = c.charCodeAt(0); }); return b.buffer; };
  return Object.assign(E, {
    state: st,
    status: () => Promise.resolve(status()),
    set(p) { E.sets.push(p); if (p && typeof p.on === 'boolean') st.on = p.on; if (p && typeof p.ears === 'boolean') st.ears = p.ears; return Promise.resolve(status()); },
    setKey() { if (E.busy) return Promise.resolve(BUSY); st.hasKey = true; return Promise.resolve(status()); },
    clearKey() { if (E.busy) return Promise.resolve(BUSY); st.hasKey = false; return Promise.resolve(E.clearFault ? Object.assign({}, E.clearFault) : status()); },
    test() { return Promise.resolve(E.busy ? BUSY : { ok: true, ms: 10 }); },
    speak(r) { E.asked.push(Object.assign({}, r)); if (E.busy) return Promise.resolve(BUSY); return Promise.resolve({ ok: true, wav: wavOf(), voice: 'flux-test-en', ms: 5, chars: r.text.length }); },
    open(o) {
      E.calls.push(['open', JSON.stringify(o)]);
      if (E.busy) return Promise.resolve(BUSY);
      if (E.mode === 'refuse') return Promise.resolve({ ok: false, kind: 'auth', why: 'Deepgram did not open the connection: the key may be refused.' });
      E.cur = ++E.ids; st.n++;
      return Promise.resolve({ ok: true, id: E.cur });
    },
    audio(id, buf) { const ab = buf instanceof ArrayBuffer; E.calls.push(['audio', id, ab ? buf.byteLength : 'not an ArrayBuffer', ab && buf.byteLength ? new Uint8Array(buf)[0] : -1]); },
    finish(id) {
      E.calls.push(['finish', id]);
      // (modes 'unsure' and 'cut': words the app says are not final, carried with the fault as app/voice.js carries them)
      const notFinal = (kind, why) => ({ ok: false, kind, why, words: E.words, final: false });
      const answer = () => (E.mode === 'fail' ? { ok: false, kind: 'network', why: 'The connection to Deepgram dropped (1006).' } : (E.mode === 'empty' ? { ok: true, text: '' }
        : (E.mode === 'unsure' ? notFinal('unsure', 'Deepgram had not made the words final when the wait for them ended.')
          : (E.mode === 'cut' ? notFinal('cut', 'The transmission reached its longest, 30 seconds, and was cut off.') : { ok: true, text: E.words }))));
      if (E.holdFinish) return new Promise((res) => E.pending.push(() => res(answer())));
      return Promise.resolve(answer());
    },
    cancel(id) { E.calls.push(['cancel', id]); },
    onHeard(fn) { E.onHeardCalls++; E.heardFn = typeof fn === 'function' ? fn : null; },
    hear(text) { if (E.heardFn) E.heardFn(E.cur, text); },
  });
}
// stand-ins for the browser's microphone and recorder. getUserMedia answers a stream of one live track (or refuses with
// the error named in deny); the recorder keeps its options and its timeslice, and the test pushes its slices (each byte
// of a slice its number). Its stop() is the browser's: asynchronous, the last slice first, then the stop event; and the
// last slice's bytes are read late (a Blob read on a later turn), so that a page that asked the app to finish at the stop
// event itself would send that slice after it
function fakeMedia() {
  const M = { gets: 0, constraints: [], streams: [], recs: [], deny: '', mimeOk: true };
  M.getUserMedia = (c) => {
    M.gets++; M.constraints.push(c);
    if (M.deny) return Promise.reject({ name: M.deny });
    const tracks = [{ kind: 'audio', readyState: 'live', stop() { this.readyState = 'ended'; } }];
    const s = { tracks, getTracks: () => tracks, getAudioTracks: () => tracks };
    M.streams.push(s);
    return Promise.resolve(s);
  };
  class Rec {
    constructor(stream, opts) { this.stream = stream; this.opts = opts; this.state = 'inactive'; this.on = {}; this.n = 0; this.timeslice = null; M.recs.push(this); }
    static isTypeSupported(t) { return M.mimeOk && t === 'audio/webm;codecs=opus'; }
    addEventListener(t, f) { (this.on[t] = this.on[t] || []).push(f); }
    emit(t, e) { for (const f of this.on[t] || []) f(e); }
    start(ms) { this.timeslice = ms; this.state = 'recording'; }
    slice(n, late) { const v = ++this.n, ab = new Uint8Array(n).fill(v).buffer; this.emit('dataavailable', { data: { size: n, arrayBuffer: () => (late ? new Promise((r) => setTimeout(() => r(ab), 30)) : Promise.resolve(ab)) } }); }
    stop() { if (this.state === 'inactive') throw new Error('InvalidStateError'); this.state = 'inactive'; Promise.resolve().then(() => { this.slice(40, true); this.emit('stop', {}); }); }
  }
  M.MediaRecorder = Rec;
  return M;
}
const VOICES = [
  { name: 'Microsoft David', lang: 'en-US', localService: true },
  { name: 'Microsoft Sonia Online (Natural)', lang: 'en-GB', localService: false },     // made by a service on the network: never chosen
  { name: 'Microsoft Hazel', lang: 'en-GB', localService: true },
  { name: 'Microsoft Hedda', lang: 'de-DE', localService: true },
  { name: 'Microsoft George', lang: 'en-GB', localService: true },
  { name: 'Google UK English Male', lang: 'en-GB', localService: false },
];

(async () => {
  try {
    row('the part loaded beside the order line: its switch is in the section, off, and nothing is kept in the page\'s storage', !!A.voice && A.voice.on() === false && !!byId('voiceOn') && byId('voiceOn').checked === false && store['titanic.voice.on'] === undefined);
    step(1);
    row('with no transport (the public page) Deepgram\'s fold and its note stand hidden, and the part is the floor alone', byId('voiceDgFold').hidden === true && byId('voiceDgNote').hidden === true && A.voice.deepgram() === false && A.voice.transport() === null
      && byId('crewSec').children.indexOf(byId('voiceDgFold')) === byId('crewSec').children.indexOf(byId('voiceNote')) + 2 && byId('crewSec').children.indexOf(byId('voiceDgFold')) < byId('crewSec').children.indexOf(byId('mindsFold')),
      'fold ' + (byId('voiceDgFold').hidden ? 'hidden' : 'SHOWN') + '; deepgram ' + A.voice.deepgram());
    const S = fakeSynth(VOICES);
    A.voice.useSynth(S, Utter);
    const V = A.voice.voices();
    row('only voices the system says are local are listed, English only, British first: never one made by a service on the network', V.map(v => v.name).join(', ') === 'Microsoft George, Microsoft Hazel, Microsoft David', V.map(v => v.name + ' ' + v.lang).join('; '));
    // off: a line is said and nothing is spoken
    A.crew.give('stop');
    row('off by default: the bridge answers and nothing is given to the speech', S.given.length === 0 && /Stop, sir/.test(last()[0]), last()[0]);
    // on, by its box
    byId('voiceOn').checked = true; byId('voiceOn').fire('change');
    row('switched on by its box, and kept; the note names the voice, says it is this PC\'s own, and that nothing is sent anywhere', A.voice.on() === true && store['titanic.voice.on'] === '1' && /this PC's own voice \(Microsoft George; British English\)\. Nothing is sent anywhere/.test(byId('voiceNote').textContent), byId('voiceNote').textContent);
    const n0 = S.given.length;
    A.crew.give('half ahead');
    const u1 = S.given[S.given.length - 1] || {}, said1 = A.voice.spoken().slice(-1)[0] || {};
    row('a named man\'s line is spoken, once, in a local British voice; the captain\'s own line is not', S.given.length === n0 + 1 && /Half ahead, sir/.test(u1.text || '') && !!u1.voice && u1.voice.localService === true && /^en-GB/.test(u1.voice.lang)
      && said1.who !== 'You' && !S.given.some(u => /^half ahead$/i.test(u.text)), (said1.who || '?') + ' by ' + (said1.voice || 'NO VOICE') + ': ' + (u1.text || ''));
    // a notice is nobody's: never spoken (a line that looks like a key is answered by a notice)
    const n1 = S.given.length;
    A.crew.give('sk-test-0123456789abcdefghijklmnopqrstuv');
    row('a notice is nobody\'s line: it is not spoken', S.given.length === n1 && /looks like a key/.test(last()[0]), last()[0].slice(0, 50));
    // a man keeps his voice and his pitch
    A.crew.give('stop'); A.crew.give('half ahead');
    const mine = A.voice.spoken().filter(x => x.who === said1.who);
    row('a man keeps one voice and one pitch through the night', mine.length >= 3 && mine.every(x => x.voice === mine[0].voice && x.pitch === mine[0].pitch) && A.voice.voiceOf(said1.who) === mine[0].voice, mine.length + ' lines by ' + mine[0].voice + ' at pitch ' + mine[0].pitch);
    S.finish();
    // three lines wait at most: beyond that the waiting ones give way to the newest
    const c0 = S.cancels;
    for (const w of ['stop', 'half ahead', 'stop', 'half ahead', 'stop']) A.crew.give(w);
    row('three lines wait at most: beyond that the waiting ones give way to the newest', S.cancels > c0 && A.voice.waiting() <= 3, (S.cancels - c0) + ' time(s) the waiting lines gave way; ' + A.voice.waiting() + ' waiting');
    S.finish();
    // nothing above four times her pace
    P.setPace(8); const n2 = S.given.length; A.crew.give('stop'); const fast = S.given.length - n2; P.setPace(4); A.crew.give('half ahead'); const four = S.given.length - n2;
    P.setPace(1);
    row('nothing is spoken above four times her pace; at four times it is', fast === 0 && four === 1, fast + ' at pace 8; ' + four + ' at pace 4');
    // the crew's own words (imagined) are spoken too; the awaited line ("has been asked") is a notice and is not
    const T = A.minds.fake({ on: true, delay: 0, table: [{ replies: [{ say: 'All right, sir.', order: null }] }] });
    await A.minds.useTransport(T); A.minds.setSpeaks(false); A.emit('frame', 0);
    const n3 = S.given.length;
    A.crew.give('Mr Murdoch, anything?'); tick(10);
    const u3 = S.given.slice(n3);
    row('a man\'s own words, written for him, are spoken as his; the line that he "has been asked" is not', u3.length === 1 && u3[0].text === 'All right, sir.' && A.voice.spoken().slice(-1)[0].who === 'Mr Murdoch', u3.map(u => u.text).join(' | '));
    const who = A.voice.spoken().slice(-1)[0], other = A.voice.spoken().find(x => x.who !== who.who);
    row('  each man by his own name: Mr Murdoch\'s voice and pitch are his whatever the other men\'s are', !!other && A.voice.voiceOf('Mr Murdoch') === who.voice && [0.8, 0.85, 0.9, 0.95, 1].includes(who.pitch), 'Mr Murdoch: ' + who.voice + ', pitch ' + who.pitch + '; ' + other.who + ': ' + other.voice + ', pitch ' + other.pitch);
    // the people on her bridge are men: a voice with a woman's name is passed over while another is there
    const usedNames = Array.from(new Set(A.voice.spoken().map(x => x.voice)));
    const S3 = fakeSynth([{ name: 'Microsoft Zira', lang: 'en-US', localService: true }, { name: 'Microsoft David', lang: 'en-US', localService: true }, { name: 'Microsoft Mark', lang: 'en-US', localService: true }]);
    A.voice.useSynth(S3, Utter);
    for (const w of ['stop', 'half ahead']) A.crew.give(w);
    A.crew.give('Mr Murdoch, anything?'); tick(10); A.crew.give('Mr Moody, anything?'); tick(10); A.crew.give('Quartermaster, anything?'); tick(10);
    const us = Array.from(new Set(A.voice.spoken().map(x => x.voice))), noteUS = byId('voiceNote').textContent;
    const S4 = fakeSynth([{ name: 'Microsoft Zira', lang: 'en-US', localService: true }]);
    A.voice.useSynth(S4, Utter); A.crew.give('stop');
    row('the men are given men\'s voices: one with a woman\'s name is passed over while another is there (and used when it is the only one); a PC with no British voice is told so',
      usedNames.join() === 'Microsoft George' && us.length >= 1 && us.every(n => n === 'Microsoft David' || n === 'Microsoft Mark') && /English, not British: this PC has no British voice installed/.test(noteUS) && S4.given.length === 1 && S4.given[0].voice.name === 'Microsoft Zira',
      'British: ' + usedNames.join(', ') + '; American only: ' + us.join(', ') + '; Zira alone: ' + (S4.given[0] ? S4.given[0].voice.name : 'nothing'));
    A.voice.useSynth(S, Utter);
    // a reset and her foundering hush it
    const c1 = S.cancels; A.emit('reset'); const c2 = S.cancels; A.emit('event', 'foundered');
    row('a new run hushes it, and so does her foundering', c2 > c1 && S.cancels > c2 && A.voice.waiting() === 0, (S.cancels - c1) + ' hushes');
    // no local English voice: nothing is spoken, and the section says so
    const S2 = fakeSynth(VOICES.filter(v => !v.localService || !/^en/.test(v.lang)));
    A.voice.useSynth(S2, Utter);
    A.crew.give('stop');
    row('with no local English voice nothing is spoken (a voice made on the network is never the fallback), and the section says so', S2.given.length === 0 && A.voice.voices().length === 0 && /no English voice of its own/.test(byId('voiceNote').textContent), byId('voiceNote').textContent.slice(0, 70));
    // no speech at all in this browser
    A.voice.useSynth({ getVoices: null }, null); P.window.speechSynthesis = undefined;
    row('a browser that cannot speak: the switch is not offered', byId('voiceOn').disabled === true || /cannot speak|no English voice/.test(byId('voiceNote').textContent), byId('voiceNote').textContent.slice(0, 50));
    // switched off: hushed, and kept
    A.voice.useSynth(S, Utter);
    const c3 = S.cancels; byId('voiceOn').checked = false; byId('voiceOn').fire('change'); const n4 = S.given.length; A.crew.give('stop');
    row('switched off: what was waiting is hushed, nothing more is spoken, and the choice is kept', S.cancels > c3 && S.given.length === n4 && store['titanic.voice.on'] === '0' && A.voice.on() === false);

    // ---------------------------------------------------------------- Deepgram's voices (the app's, with the player's own key)
    const DG = fakeVoice(), PL = fakePlayer(), KEYT = 'test-key-0123456789-not-a-secret';
    const qs = () => A.voice.queue().map(x => x.state).join(',');
    const drain = async () => { for (let i = 0; i < 12; i++) { DG.release(5); await settle(); PL.finish(); await settle(); } };
    A.voice.useSynth(S, Utter); A.voice.set(true); A.voice.usePlayer(PL);
    await A.voice.useTransport(DG); await settle();
    let g0 = S.given.length;
    A.crew.give('stop'); await settle();
    row('the app\'s transport there, Deepgram\'s voices off: the fold shows, the lines are this PC\'s voice\'s as before, and nothing is asked of the app',
      !byId('voiceDgFold').hidden && byId('voiceDgOn').checked === false && A.voice.deepgram() === false && DG.asked.length === 0 && S.given.length === g0 + 1,
      `fold ${byId('voiceDgFold').hidden ? 'hidden' : 'shown'}; asked ${DG.asked.length}; this PC's voice given ${S.given.length - g0}`);
    byId('voiceDgOn').checked = true; byId('voiceDgOn').fire('change'); await settle();
    g0 = S.given.length;
    A.crew.give('half ahead'); await settle();
    const a1 = DG.asked[DG.asked.length - 1] || {};
    row('switched on in the fold (the app is asked to): a man\'s line is asked of the app by his name and his words alone, and played; this PC\'s voice is not given it',
      same(DG.sets[DG.sets.length - 1], { on: true }) && A.voice.deepgram() === true && DG.asked.length === 1 && a1.who === 'The officer at the telegraph' && /^Half ahead, sir\./.test(a1.text) && Object.keys(a1).sort().join() === 'text,who'
      && PL.plays.length === 1 && PL.plays[0].wav === DG.wavs[0] && S.given.length === g0,
      `asked: ${a1.who}: ${a1.text}; played ${PL.plays.length}, the app's own WAV: ${PL.plays[0] && PL.plays[0].wav === DG.wavs[0]}; this PC's voice given ${S.given.length - g0}`);
    // one at a time: the first plays; the next two are said while it plays
    DG.hold = true;
    A.crew.give('stop'); A.crew.give('half ahead'); await settle();
    const s1 = { asked: DG.asked.length, playing: PL.now().length, q: qs() };
    DG.release(); await settle();
    const s2 = { asked: DG.asked.length, playing: PL.now().length, q: qs() };
    PL.finish(); await settle();
    const s3 = { plays: PL.plays.length, playing: PL.now().length, q: qs() };
    // (the review: every line was asked for as it came, and a line asked for is billed whether or not it is then heard.
    // So one ahead and no more: while one voice already had waits to be played, the next is not asked for)
    row('one line plays at a time; the next line\'s voice is asked for ONE AHEAD while the one before it plays, and no further: with a voice waiting to be played, the next is not asked for until that one plays',
      s1.asked === 2 && s1.playing === 1 && s1.q === 'asking,new' && s2.asked === 2 && s2.playing === 1 && s2.q === 'got,new' && s3.plays === 2 && s3.playing === 1 && s3.q === 'asking' && DG.asked.length === 3,
      JSON.stringify([s1, s2, s3]) + '; asked in all ' + DG.asked.length);
    // five more while one plays and one is asked for: three wait at most
    for (const w of ['stop', 'half ahead', 'stop', 'half ahead', 'stop']) A.crew.give(w);
    await settle();
    const q4 = A.voice.queue(), gave = A.voice.lines().filter(x => x.end === 'gave way').length, plays4 = PL.plays.length;
    DG.release(); await settle();
    const unasked = A.voice.lines().filter(x => x.end === 'gave way').every(x => x.state === 'new');
    row('at most three lines wait: beyond that a line NOT YET ASKED FOR gives way, the oldest of them first (it has cost nothing); none of the five was asked for meanwhile',
      q4.length === 3 && gave === 3 && unasked && PL.now().length === 1 && PL.plays.length === plays4 && DG.asked.length === 3 && !DG.asked.some(q => q.who === 'You'),
      `${q4.length} waiting, ${gave} gave way (each unasked: ${unasked}); asked ${DG.asked.length}; plays ${plays4} -> ${PL.plays.length}`);
    await drain(); DG.hold = false;
    // a fault: said once, and the line to this PC's voice while its switch is on
    DG.mode = 'timeout';
    const f0 = A.voice.faultNotes(), g1 = S.given.length, p1 = PL.plays.length;
    for (const w of ['stop', 'half ahead', 'stop']) A.crew.give(w);
    await settle();
    const fNote = byId('voiceDgNote').textContent;
    row('a line that cannot be had (a fault) is said once in the part\'s own note, and spoken by this PC\'s voice instead while its switch is on; never by both',
      A.voice.faultNotes() === f0 + 1 && S.given.length === g1 + 3 && PL.plays.length === p1 && !byId('voiceDgNote').hidden && /could not be had/.test(fNote) && /This PC's own voice speaks such lines instead/.test(fNote),
      `${A.voice.faultNotes() - f0} said for 3 faults; this PC's voice given ${S.given.length - g1}; played ${PL.plays.length - p1}; "${fNote.slice(0, 90)}"`);
    DG.mode = 'ok'; A.crew.give('stop'); await settle();
    row('  the note is cleared once a line is had again', byId('voiceDgNote').hidden && A.voice.fault() === '' && PL.now().length === 1, byId('voiceDgNote').textContent.slice(0, 60) || 'cleared');
    await drain();
    A.voice.set(false); DG.mode = 'server';
    const g2 = S.given.length, f2 = A.voice.faultNotes();
    A.crew.give('stop'); await settle();
    const last2 = A.voice.lines().slice(-1)[0] || {};
    row('  with this PC\'s voice switched off, a line that cannot be had is not spoken at all, and the note says so',
      S.given.length === g2 && A.voice.faultNotes() === f2 + 1 && /Nothing is spoken instead/.test(byId('voiceDgNote').textContent) && last2.end === 'silent' && PL.now().length === 0,
      `${last2.end}; "${byId('voiceDgNote').textContent.slice(0, 80)}"`);
    A.voice.set(true);
    // a fault that will not pass by itself: Deepgram stands down until the player changes something
    DG.mode = 'auth';
    const n5 = DG.asked.length, g3 = S.given.length;
    A.crew.give('stop'); await settle(); A.crew.give('half ahead'); await settle();
    row('a fault that will not pass by itself (the key refused) stands Deepgram down for the run: the next lines are not asked of the app, and this PC\'s voice speaks them',
      DG.asked.length === n5 + 1 && A.voice.down() === 'auth' && A.voice.deepgram() === false && S.given.length === g3 + 2 && /stand down/.test(byId('voiceDgNote').textContent),
      `asked ${DG.asked.length - n5}; down: ${A.voice.down()}; this PC's voice given ${S.given.length - g3}`);
    const keyIn = byId('voiceDgKey');
    keyIn.value = KEYT; byId('voiceDgSave').click();
    const clearedAtOnce = keyIn.value === '';
    await settle();
    DG.mode = 'ok'; const n6 = DG.asked.length;
    A.crew.give('stop'); await settle();
    keyIn.value = 'another-test-key-0000'; keyIn.fire('keydown', { key: 'Enter' }); const clearedEnter = keyIn.value === ''; await settle();
    keyIn.value = 'typed, then forgotten'; byId('voiceDgForget').click(); const clearedForget = keyIn.value === ''; await settle();
    const allText = byId('crewSec').textContent;
    row('the key\'s field: read once, passed once to the app (Save or Enter), and cleared at once; Forget asks the app to forget; no key is in the page\'s text or storage; a key saved lifts the stand-down',
      clearedAtOnce && clearedEnter && clearedForget && same(DG.keys, [KEYT, 'another-test-key-0000']) && DG.clears === 1 && !allText.includes(KEYT) && !Object.values(store).some(v => String(v).includes(KEYT))
      && DG.asked.length === n6 + 1 && /No key is kept/.test(byId('voiceDgKeyNote').textContent),
      `keys passed ${DG.keys.length}, forgotten ${DG.clears}; cleared ${clearedAtOnce}/${clearedEnter}/${clearedForget}; asked again after the key: ${DG.asked.length - n6}`);
    await drain();
    await DG.setKey(KEYT); A.voice.useTransport(DG); await settle();      // a key again, as the app would keep it
    const n7 = DG.asked.length;
    A.crew.give('sk-test-0123456789abcdefghijklmnopqrstuv'); await settle();
    row('the captain\'s own lines are never asked of the app, nor a notice (a line that looks like a key is answered by one)',
      DG.asked.length === n7 && A.voice.deepgram() === true && !DG.asked.some(q => q.who === 'You') && !DG.asked.some(q => /sk-test/.test(q.text)), `asked ${DG.asked.length - n7}; by "You" ever: ${DG.asked.filter(q => q.who === 'You').length}`);
    P.setPace(8); const n8 = DG.asked.length; A.crew.give('stop'); await settle(); const fastDg = DG.asked.length - n8;
    P.setPace(4); A.crew.give('half ahead'); await settle(); const fourDg = DG.asked.length - n8 - fastDg; P.setPace(1);
    row('nothing is asked of the app above four times her pace; at four times it is', fastDg === 0 && fourDg === 1, fastDg + ' at pace 8; ' + fourDg + ' at pace 4');
    await drain();
    byId('voiceDgTry').click(); await settle(); const t1 = byId('voiceDgTryOut').textContent;
    DG.testWhy = 'Deepgram refused the key (401).'; byId('voiceDgTry').click(); await settle(); const t2 = byId('voiceDgTryOut').textContent; DG.testWhy = null;
    const use = byId('voiceDgUse').textContent;
    row('"Try it" asks the app to try the key and says what came back; the use line says the run\'s characters against its limit', DG.tests === 2 && /^Deepgram answered in 0\.4 s/.test(t1) && t2 === 'No answer: Deepgram refused the key (401).'
      && /^This run of the app: [\d,]+ of 40,000 characters sent to Deepgram, in \d+ lines?\.$/.test(use), t1 + ' | ' + t2 + ' | ' + use);
    // the run's limit is the player's to set (the design note, section 3): the field shows the app's, and a change is
    // asked of the app as a setting, which itself asks the player before it is raised while the voices are on
    const lim0 = byId('voiceDgLimit').value, nSets = DG.sets.length;
    byId('voiceDgLimit').value = '60000'; byId('voiceDgLimit').fire('change'); await settle();
    const asked = DG.sets[DG.sets.length - 1];
    byId('voiceDgLimit').value = 'many'; byId('voiceDgLimit').fire('change'); await settle();
    row('the run\'s limit is the player\'s to set: the field shows the app\'s limit, a change is asked of the app as a setting, and what is not a number is not asked at all', lim0 === '40000' && DG.sets.length === nSets + 1 && same(asked, { limits: { chars: 60000 } }),
      lim0 + ' shown; asked: ' + JSON.stringify(asked) + '; ' + (DG.sets.length - nSets) + ' asked of 2 changes');
    // the switch off in the fold, a line playing; then on again, not confirmed by the player
    A.crew.give('stop'); await settle();
    const h = PL.now()[0];
    byId('voiceDgOn').checked = false; byId('voiceDgOn').fire('change'); await settle();
    const g4 = S.given.length; A.crew.give('half ahead'); await settle();
    row('switched off in the fold: the line playing stops, nothing waits, and the lines are this PC\'s voice\'s again', !!h && h.stopped && PL.now().length === 0 && A.voice.queue().length === 0 && A.voice.deepgram() === false && S.given.length === g4 + 1,
      `stopped ${!!h && h.stopped}; playing ${PL.now().length}; this PC's voice given ${S.given.length - g4}`);
    DG.decline = true; byId('voiceDgOn').checked = true; byId('voiceDgOn').fire('change'); await settle(); DG.decline = false;
    row('  switched on again and the player does not confirm it (the app asks him itself): it stays off, and the fold says nothing was changed', A.voice.deepgram() === false && byId('voiceDgOn').checked === false && /did not confirm/.test(byId('voiceDgMsg').textContent),
      byId('voiceDgMsg').textContent);
    // an answer that never comes: the page's own bound
    byId('voiceDgOn').checked = true; byId('voiceDgOn').fire('change'); await settle();
    DG.hold = true; const g5 = S.given.length, n9 = DG.asked.length;
    A.crew.give('stop'); A.crew.give('half ahead'); await settle();
    P.tick(74000); await settle(); const before75 = S.given.length - g5;
    P.tick(1000); await settle();
    row('an answer that never comes holds the lines no longer than the page\'s own bound (75 s of the page\'s clock): that line goes to this PC\'s voice, and the next is asked for',
      A.voice.deepgram() === true && before75 === 0 && S.given.length === g5 + 1 && DG.asked.length === n9 + 2 && A.voice.lines().some(x => x.kind === 'timeout'), `before 75 s: ${before75}; after: ${S.given.length - g5}; asked ${DG.asked.length - n9}`);
    A.voice.hush(); DG.pending.length = 0; DG.hold = false;
    // a new run, and her foundering, stop it
    A.crew.give('stop'); await settle();
    DG.hold = true; A.crew.give('half ahead'); await settle();
    const hR = PL.now()[0], plays0 = PL.plays.length;
    A.emit('reset'); await settle();
    DG.release(); await settle();
    row('a new run stops it: the line playing is stopped, those waiting are dropped, and a voice asked for before it is not played when it comes',
      !!hR && hR.stopped && PL.now().length === 0 && A.voice.queue().length === 0 && PL.plays.length === plays0 && A.voice.playing() === null, `stopped ${!!hR && hR.stopped}; plays ${plays0} -> ${PL.plays.length}`);
    DG.hold = false; A.crew.give('stop'); await settle();
    const hF = PL.now()[0];
    A.emit('event', 'foundered'); await settle();
    row('  and so does her foundering', !!hF && hF.stopped && PL.now().length === 0 && A.voice.queue().length === 0, `stopped ${!!hF && hF.stopped}`);
    // her end as the page reads it (the coordinator's condition for join 20): TitanicApp.gone(sim) is the founder flag, or
    // the hand-over where she breaks, at which a default watch now ends with no 'foundered' event. Here A.gone is made to
    // answer true, as tools/minds_part_tests.js does
    A.emit('reset'); await settle(); DG.hold = false; A.crew.give('stop'); await settle();
    const hG = PL.now()[0], cancelsG = S.cancels, askedG = DG.asked.length, givenG = S.given.length;
    const realGone = A.gone; A.gone = () => true;
    step(1); await settle();
    const atEnd = { stopped: !!hG && hG.stopped, playing: PL.now().length, queue: A.voice.queue().length, cancels: S.cancels - cancelsG, seen: A.voice.gone() };
    A.crew.say('The officer of the watch', 'Stand by the boats.', 'script'); await settle();
    const cancels2 = S.cancels; step(1); await settle();
    const afterG = { asked: DG.asked.length - askedG, given: S.given.length - givenG, playing: PL.now().length, again: S.cancels - cancels2 };
    A.gone = realGone; A.emit('reset'); step(1); await settle();
    const askedB = DG.asked.length; A.crew.give('stop'); await settle();
    const backG = { asked: DG.asked.length - askedB, playing: PL.now().length, seen: A.voice.gone() };
    row('her end as the page reads it (TitanicApp.gone, with no "foundered" event): seen on the step, once, the voices are hushed (Deepgram\'s line stopped, this PC\'s cancelled); then nothing is spoken or asked for; after a new run the men are heard again',
      atEnd.stopped && atEnd.playing === 0 && atEnd.queue === 0 && atEnd.cancels >= 1 && atEnd.seen === true && afterG.asked === 0 && afterG.given === 0 && afterG.playing === 0 && afterG.again === 0
      && backG.asked >= 1 && backG.playing === 1 && backG.seen === false, `at her end: ${JSON.stringify(atEnd)}; then: ${JSON.stringify(afterG)}; after a new run: ${JSON.stringify(backG)}`);
    // ---- THE REVIEW OF THIS PART (an independent reviewer, 2026-11-23): each of its findings, held
    A.voice.hush(); DG.pending.length = 0; DG.hold = false; P.tick(76000); await settle();      // whatever was still out has come back or run out
    // a sound that never says it has ended (the stand-in's never does until told) is stopped at its own bound
    const g6 = S.given.length, f6 = A.voice.faultNotes();
    A.crew.give('stop'); await settle();
    const hB = PL.now()[0], w6 = (A.voice.playing() || {}).words || '', held1 = A.voice.held();
    A.crew.give('half ahead'); await settle();
    P.tick((15 + w6.length * 0.25) * 1000 - 500); await settle();
    const beforeBound = !!hB && !hB.stopped && PL.now()[0] === hB;
    P.tick(1000); await settle();
    const cut = A.voice.lines().filter(x => x.end === 'cut short');
    row('a sound that never says it has ended is stopped at its own bound (15 s and a quarter of a second a character, on the page\'s clock): the line is over, said once, NOT given to this PC\'s voice, and the next line plays',
      !!hB && w6.length > 0 && beforeBound && hB.stopped && cut.length === 1 && cut[0].words === w6 && S.given.length === g6 && A.voice.faultNotes() === f6 + 1 && /did not end/.test(byId('voiceDgNote').textContent)
      && PL.now().length === 1 && PL.now()[0] !== hB, `before its bound: playing ${beforeBound}; after: stopped ${!!hB && hB.stopped}, ${cut.length} cut short; this PC's voice given ${S.given.length - g6}; next playing ${PL.now().length}`);
    await drain();
    row('  a sound\'s handle is let go as its line ends (it holds the decoded line): one is held while a line plays, none after', held1 === 1 && A.voice.held() === 0, `while playing ${held1}; after ${A.voice.held()}`);
    // a request of an older run still out is counted: the app is never asked for a third at once
    P.tick(76000); await settle();
    DG.hold = true; const n10 = DG.asked.length;
    A.crew.give('stop'); await settle(); const o1 = DG.pending.length;
    A.emit('reset'); await settle(); A.crew.give('half ahead'); await settle(); const o2 = DG.pending.length;
    A.emit('reset'); await settle(); A.crew.give('stop'); await settle(); const o3 = DG.pending.length, a3 = DG.asked.length - n10;
    DG.release(1); await settle(); const a4 = DG.asked.length - n10, o4 = DG.pending.length;
    row('a request of an older run that is still out is counted: the app is never asked for a third at once (it takes two), and the waiting line is asked for as soon as one comes back',
      o1 === 1 && o2 === 2 && o3 === 2 && a3 === 2 && a4 === 3 && o4 === 2, `out: ${o1}, ${o2}, ${o3} (asked ${a3}); one back: asked ${a4}, out ${o4}`);
    DG.release(5); await settle(); DG.hold = false; await drain(); P.tick(76000); await settle();
    // above four times her pace the lines not yet asked for give way
    DG.hold = true; const n11 = DG.asked.length;
    A.crew.give('stop'); A.crew.give('half ahead'); A.crew.give('stop'); await settle();
    const waitingNew = A.voice.queue().filter(x => x.state === 'new').length;
    P.setPace(8); DG.release(1); await settle();
    const tooFast = A.voice.lines().filter(x => x.end === 'too fast').length, askedFast = DG.asked.length - n11;
    P.setPace(1);
    row('above four times her pace the lines not yet asked for give way (they have cost nothing); the one already asked for is played', waitingNew === 2 && tooFast === 2 && askedFast === 1 && PL.now().length === 1,
      `${waitingNew} waiting unasked; at pace 8: ${tooFast} gave way, asked ${askedFast}, playing ${PL.now().length}`);
    DG.hold = false; await drain();
    // Deepgram's voices on while this PC's own is off: said outside the fold, so that it is seen with the fold shut
    A.voice.set(false); await settle();
    const noteOff = byId('voiceNote').textContent, sumOn = byId('voiceDgSum').textContent;
    A.voice.set(true); await settle();
    row('with this PC\'s own voice off and Deepgram\'s on, the note outside the fold says that the lines are being sent, and the fold\'s own title says ON', /is sent to Deepgram, as text/.test(noteOff) && /: ON$/.test(sumOn) && !/is sent to Deepgram, as text/.test(byId('voiceNote').textContent),
      sumOn + ' | ' + noteOff.slice(0, 70));
    {
      // what a stranger reads before any key goes in (the public release): the fold begins with it
      const t = byId('voiceDgAbout') ? byId('voiceDgAbout').textContent : '';
      row('in the app, before any key goes in, Deepgram\'s fold begins with what it is: optional and off at each start; the key the player\'s own, kept on this PC and sent only to Deepgram, which bills him; what he says sent only while he holds the key; the app asks first',
        /^Optional, and off each time the app starts/.test(t) && /Deepgram key of your own/.test(t) && /kept on this PC, encrypted by Windows/.test(t) && /sent only to Deepgram, which bills you for each character spoken and each minute heard/.test(t)
        && /sent, as sound, only while you hold the key to speak/.test(t) && /the app asks you, in a message box of its own/.test(t), t.slice(0, 60));
    }
    await A.voice.useTransport(null); await settle();
    row('the transport taken away: the fold is hidden again and the lines are the floor\'s', byId('voiceDgFold').hidden === true && A.voice.deepgram() === false, byId('voiceDgFold').hidden ? 'hidden' : 'SHOWN');

    // ---------------------------------------------------------------- THE EARS: speaking to the bridge (a block of its own)
    {
    const EA = fakeEars(), MD = fakeMedia(), lineEl = byId('crewLine'), micEl = byId('voiceMic'), sim = P.sim;
    const wait = async (ms) => { await new Promise((r) => setTimeout(r, ms || 60)); await settle(); };
    const key = (type, k, more) => { let prevented = false; lineEl.fire(type, Object.assign({ key: k, code: k === ' ' ? 'Space' : k, preventDefault() { prevented = true; } }, more || {})); return prevented; };
    const recNow = () => MD.recs[MD.recs.length - 1];
    const callsSince = (n) => EA.calls.slice(n).map(c => c[0] + (c[0] === 'audio' ? ':' + c[2] + '/' + c[3] : '')).join(' ');
    A.voice.useMedia(MD);
    // the public page: no app object at all; then the app's object for the voices alone (no open)
    lineEl.value = '';
    const spacePublic = key('keydown', ' '); key('keyup', ' ');
    const pub = { mic: micEl.hidden, row: byId('voiceEarsRow').hidden, gets: MD.gets, listening: A.voice.listening() };
    await A.voice.useTransport(DG); await settle();
    const spaceVoices = key('keydown', ' '); key('keyup', ' ');
    const voicesOnly = { mic: micEl.hidden, row: byId('voiceEarsRow').hidden, gets: MD.gets };
    row('the public page (no app object), and an app object for the voices alone (no open): no microphone button, no switch for the ears, Space in the empty line is a space, and the microphone is never asked for',
      pub.mic && pub.row && !spacePublic && pub.gets === 0 && !pub.listening && voicesOnly.mic && voicesOnly.row && !spaceVoices && voicesOnly.gets === 0,
      JSON.stringify({ pub, spacePublic, voicesOnly, spaceVoices }));
    await A.voice.useTransport(EA); await settle();
    const earsOff = { row: !byId('voiceEarsRow').hidden, box: byId('voiceEarsOn').checked, mic: micEl.hidden, listener: !!EA.heardFn };
    byId('voiceEarsOn').checked = true; byId('voiceEarsOn').fire('change'); await settle();
    row('the app\'s object can hear: the ears\' own switch shows in the fold, off, and the page listens for the words heard; switched on there (the app asks the player itself), the microphone button shows in the order line\'s row, the words\' line under it',
      earsOff.row && !earsOff.box && earsOff.mic && earsOff.listener && same(EA.sets[EA.sets.length - 1], { ears: true }) && A.voice.ears() === true && !micEl.hidden && micEl.parentNode === lineEl.parentNode
      && lineEl.parentNode.nextSibling === byId('voiceHeard') && /speaking to the bridge: ON$/.test(byId('voiceDgSum').textContent) && /0 s of 30 min heard by Deepgram/.test(byId('voiceEarsUse').textContent),
      JSON.stringify(earsOff) + '; ' + byId('voiceDgSum').textContent + '; ' + byId('voiceEarsUse').textContent);
    byId('voiceEarsLimit').value = '10'; byId('voiceEarsLimit').fire('change'); await settle();
    row('  the run\'s limit is the player\'s to set, in minutes, and is asked of the app in seconds (the app asks him before it is raised)', same(EA.sets[EA.sets.length - 1], { limits: { secs: 600 } }), JSON.stringify(EA.sets[EA.sets.length - 1]));
    // held by Space in the empty line, and let go
    const typed0 = sim.night.log.length;
    A.crew.give('hard a starboard');
    const typedOrder = sim.night.log[sim.night.log.length - 1], typedLines = last(2);
    const c0 = EA.calls.length, n0 = sim.night.log.length, g0 = MD.gets;
    lineEl.value = '';
    const pressed = key('keydown', ' ');
    await settle();
    const rec = recNow(), repeat = key('keydown', ' ', { repeat: true }), openedOnce = EA.calls.slice(c0).filter(c => c[0] === 'open').length;
    rec.slice(100); rec.slice(200); await settle();
    EA.hear('hard a');
    const during = { heard: A.voice.heard(), line: lineEl.value, listening: A.voice.listening(), micText: micEl.textContent, pressed: micEl.getAttribute('aria-pressed') };
    key('keyup', ' ');
    await wait();
    const spokenOrder = sim.night.log[sim.night.log.length - 1], spokenLines = last(2);
    row('Space held in the EMPTY order line holds the key (its default prevented, its repeats too, one transmission), opens the microphone as asked (one channel, echo cancelled, noise suppressed) and records it as WebM with Opus in slices of 100 ms',
      pressed && repeat && openedOnce === 1 && MD.gets === g0 + 1 && same(MD.constraints[MD.constraints.length - 1], { audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      && !!rec && rec.opts && rec.opts.mimeType === 'audio/webm;codecs=opus' && rec.timeslice === 100,
      `prevented ${pressed}/${repeat}; opens ${openedOnce}; asked ${JSON.stringify(MD.constraints[MD.constraints.length - 1])}; ${rec ? rec.opts.mimeType + ' every ' + rec.timeslice + ' ms' : 'NO RECORDER'}`);
    row('  while held, the words heard so far show greyed under the line, never in it; the button says so',
      during.heard === 'hard a' && during.line === '' && during.listening && during.micText === 'Listening...' && during.pressed === 'true', JSON.stringify(during));
    const seq = callsSince(c0);
    row('  let go: the recorder is stopped, its LAST slice (read late) is sent, and only then is the app asked to finish; each slice once, in order, as an ArrayBuffer',
      seq === 'open audio:100/1 audio:200/2 audio:40/3 finish', seq);
    row('  the words heard are given to the order line as typed words are: "You: hard a starboard" and the bridge\'s answer, and the order lands in the watch\'s log as the same order typed',
      sim.night.log.length === n0 + 1 && !!spokenOrder && spokenOrder.type === typedOrder.type && spokenOrder.value === typedOrder.value && spokenOrder.arg === typedOrder.arg && same(spokenLines, typedLines)
      && /^You: hard a starboard \[you\]$/.test(spokenLines[0]) && A.crew.kept().slice(-1)[0] === 'hard a starboard' && typed0 + 1 === n0 && !A.voice.listening() && A.voice.heard() === '' && lineEl.value === '',
      `typed: ${JSON.stringify({ type: typedOrder.type, value: typedOrder.value })} ${typedLines.join(' | ')}; spoken: ${JSON.stringify(spokenOrder && { type: spokenOrder.type, value: spokenOrder.value })} ${spokenLines.join(' | ')}`);
    // a space typed into words is a space
    const c1 = EA.calls.length;
    lineEl.value = 'hard'; const inWords = key('keydown', ' '); key('keyup', ' '); await settle(); lineEl.value = '';
    row('  Space in a line that holds words is a space: not prevented, and nothing is opened', !inWords && EA.calls.length === c1 && !A.voice.listening(), `prevented ${inWords}; calls ${callsSince(c1) || 'none'}`);
    // Escape while held gives it up
    const c2 = EA.calls.length, n2 = sim.night.log.length, t2 = A.crew.lines().length, notes2 = A.voice.earsNotes();
    key('keydown', ' '); await settle(); recNow().slice(64); await settle();
    key('keydown', 'Escape'); await wait();
    const esc = callsSince(c2);
    row('  Escape while held gives it up: the app is told (cancel), nothing more is sent, nothing is given, and the note says so once',
      /^open audio:64\/1 cancel$/.test(esc) && sim.night.log.length === n2 && A.crew.lines().length === t2 && !A.voice.listening() && A.voice.earsNotes() === notes2 + 1 && /^Given up/.test(A.voice.earsNote()),
      `${esc}; given ${sim.night.log.length - n2}; note "${A.voice.earsNote()}"`);
    // a transmission that fails, or brings no words, or is refused: nothing given, said once, and no notice of the page's
    const fails = [];
    for (const mode of ['fail', 'empty', 'refuse']) {
      EA.mode = mode;
      const n3 = sim.night.log.length, t3 = A.crew.lines().length, notes3 = A.voice.earsNotes(), toasts3 = P.toasts.length, recs3 = MD.recs.length;
      A.voice.hold(); await settle(); if (MD.recs.length > recs3) recNow().slice(64); await settle(); A.voice.release(); await wait();
      fails.push({ mode, given: sim.night.log.length - n3, talk: A.crew.lines().length - t3, said: A.voice.earsNotes() - notes3, toasts: P.toasts.length - toasts3, note: A.voice.earsNote(), recorded: MD.recs.length - recs3, open: !!A.voice.transmission() });
    }
    EA.mode = 'ok';
    row('a transmission that fails, that brings no words, or that the app will not open gives nothing (no order, no line of the talk, no notice) and says why, once, in the ears\' own note (refused, nothing is recorded)',
      fails.every(f => f.given === 0 && f.talk === 0 && f.said === 1 && f.toasts === 0 && !f.open) && /dropped \(1006\)/.test(fails[0].note) && /^Nothing was heard/.test(fails[1].note) && /did not open the connection/.test(fails[2].note) && fails[2].recorded === 0,
      fails.map(f => f.mode + ': ' + f.said + ' said, ' + f.given + ' given, "' + f.note.slice(0, 60) + '"').join(' | '));
    // words longer than the line takes
    EA.words = 'stop '.repeat(40).trim();
    const n4 = sim.night.log.length;
    A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait();
    EA.words = 'stop';
    row('  words longer than the order line takes (160 characters) are not given, and the note says so', sim.night.log.length === n4 && /longer than the order line takes \(160 characters\)/.test(A.voice.earsNote()), A.voice.earsNote());
    // the men's voices wait while the key is held: this PC's own, then Deepgram's
    const gv = S.given.length;
    A.voice.hold(); await settle(); recNow().slice(64);
    A.crew.give('half ahead'); await settle();
    const gHeld = S.given.length - gv;
    A.voice.release(); await wait();
    const afterFloor = S.given.slice(gv).map(u => u.text);
    row('the men\'s voices wait while the key is held, so that the microphone does not hear them: this PC\'s own speaks nothing meanwhile, and speaks the waiting line when the key is let go',
      gHeld === 0 && afterFloor.length >= 1 && /^Half ahead, sir/.test(afterFloor[0]), `while held: ${gHeld}; after: ${afterFloor.join(' | ')}`);
    byId('voiceDgOn').checked = true; byId('voiceDgOn').fire('change'); await settle();
    A.crew.give('half ahead'); await settle();
    const playingBefore = PL.now()[0], plays0 = PL.plays.length, asked0 = EA.asked.length;
    A.voice.hold(); await settle(); recNow().slice(64);
    A.crew.give('stop'); await settle();
    const askedHeld = EA.asked.length - asked0;
    PL.finish(); await settle();
    const heldState = { cut: !!playingBefore && playingBefore.stopped, newPlays: PL.plays.length - plays0, playing: PL.now().length };
    A.voice.release(); await wait();
    const afterDg = { newPlays: PL.plays.length - plays0, playing: PL.now().length };
    row('  and Deepgram\'s: a line already playing is not cut off, the next is asked for (one ahead) but none starts while held; it plays when the key is let go',
      !!playingBefore && !heldState.cut && askedHeld === 1 && heldState.newPlays === 0 && heldState.playing === 0 && afterDg.newPlays >= 1 && afterDg.playing === 1,
      `held: ${JSON.stringify(heldState)}, asked ${askedHeld}; after: ${JSON.stringify(afterDg)}`);
    for (let i = 0; i < 6; i++) { PL.finish(); await settle(); }
    byId('voiceDgOn').checked = false; byId('voiceDgOn').fire('change'); await settle();
    // the microphone: kept open 20 s of the page's clock after its last use, then closed; at a new run; the ears off
    const sp = async () => { A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait(); };
    await sp();
    const s1 = MD.streams[MD.streams.length - 1], gets1 = MD.gets;
    P.tick(19000); const live19 = s1.tracks[0].readyState;
    await sp(); const reused = MD.gets === gets1;
    P.tick(19999); const live2 = s1.tracks[0].readyState;
    P.tick(1); const ended20 = s1.tracks[0].readyState, open20 = A.voice.micOpen();
    await sp(); const s2 = MD.streams[MD.streams.length - 1], live3 = s2.tracks[0].readyState;
    A.emit('reset'); await settle(); const endedReset = s2.tracks[0].readyState;
    await sp(); const s3 = MD.streams[MD.streams.length - 1], live4 = s3.tracks[0].readyState;
    byId('voiceEarsOn').checked = false; byId('voiceEarsOn').fire('change'); await settle();
    const endedOff = s3.tracks[0].readyState, micOff = micEl.hidden;
    row('the microphone is kept open 20 s of the page\'s clock after its last use (a press within them takes the same one), then closed, its track ended; it is closed at once at a new run, and when the ears go off (the button then hidden)',
      live19 === 'live' && reused && live2 === 'live' && ended20 === 'ended' && !open20 && live3 === 'live' && endedReset === 'ended' && live4 === 'live' && endedOff === 'ended' && micOff && !A.voice.ears(),
      JSON.stringify({ live19, reused, live2, ended20, live3, endedReset, live4, endedOff, micOff }));
    byId('voiceEarsOn').checked = true; byId('voiceEarsOn').fire('change'); await settle();
    // the page's own bound: a release never seen
    const n5 = sim.night.log.length;
    EA.words = 'stop';
    A.voice.hold(); await settle(); recNow().slice(64); await settle();
    P.tick(34999); const still = A.voice.listening();
    P.tick(1); await wait();
    row('a key held and never seen let go is let go by the page\'s own bound, 35 s of its clock from the press: the microphone stops, and the words are given',
      still === true && !A.voice.listening() && sim.night.log.length === n5 + 1 && sim.night.log[sim.night.log.length - 1].type === 'telegraph', `at 34.999 s held ${still}; at 35 s held ${A.voice.listening()}; given ${sim.night.log.length - n5}`);
    // the button: held by the pointer; let go by its release, its leaving, a cancelled pointer, or the window losing the focus
    const how = [];
    for (const end of ['pointerup', 'pointerleave', 'pointercancel', 'window blur']) {
      const n6 = sim.night.log.length;
      micEl.fire('pointerdown', { button: 0 }); await settle(); const heldNow = A.voice.listening(); recNow().slice(64); await settle();
      if (end === 'window blur') P.fireWindow('blur'); else micEl.fire(end);
      await wait();
      how.push(end + ': held ' + heldNow + ', let go ' + !A.voice.listening() + ', given ' + (sim.night.log.length - n6));
    }
    micEl.fire('pointerdown', { button: 2 }); await settle(); const rightButton = A.voice.listening();
    row('the microphone button is held by the pointer and let go by its release, by its leaving the button, by a cancelled pointer, or by the window losing the focus; another mouse button does nothing',
      how.every(h => /held true, let go true, given 1$/.test(h)) && rightButton === false, how.join('; ') + '; right button held ' + rightButton);
    // a new run while the words are awaited: they are not given to the new run
    EA.holdFinish = true;
    const n7 = sim.night.log.length;
    A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait();
    A.emit('reset'); await settle();
    EA.holdFinish = false; for (const f of EA.pending.splice(0)) f(); await settle();
    row('  words that come back after a new run has begun are not given to it, and the app was told the transmission is given up', sim.night.log.length === n7 && EA.calls[EA.calls.length - 1][0] === 'cancel' && !A.voice.transmission(),
      `given ${sim.night.log.length - n7}; last call ${EA.calls[EA.calls.length - 1].join(' ')}`);
    // THE REVIEW OF THE EARS (2026-11-24), on the page's side; each row fails without its mend.
    // Finding 1: words the app says are not final are shown greyed under the line with the note, and nothing is given
    const notFinal = [];
    for (const [mode, words] of [['unsure', 'full astern'], ['cut', 'full astern'], ['unsure', '']]) {
      EA.mode = mode; EA.words = words;
      const nF = sim.night.log.length, tF = A.crew.lines().length;
      A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait();
      notFinal.push({ mode, given: sim.night.log.length - nF, talk: A.crew.lines().length - tF, shown: A.voice.heard(), note: A.voice.earsNote() });
    }
    EA.mode = 'ok'; EA.words = 'stop';
    row('words the app says are not final ("unsure": Deepgram had not made them final when its wait ended; "cut": the app ended the transmission at its bound while the key was held) stay greyed under the line with the note, and nothing is given; an "unsure" with no words at all says so',
      notFinal.every(x => x.given === 0 && x.talk === 0) && notFinal[0].shown === 'full astern' && notFinal[1].shown === 'full astern' && notFinal[2].shown === ''
      && notFinal[0].note === 'The bridge did not catch the end of that: nothing was given.' && notFinal[1].note === 'The transmission reached its longest, 30 seconds, and was cut off: nothing was given.'
      && notFinal[2].note === 'The bridge did not catch that: nothing was given.', JSON.stringify(notFinal));
    // Finding 2: Deepgram is asked for punctuation, so a spoken question comes back with its "?": the captain's line is
    // shown, and the grammar reads it as a question, as typed, never an order; and Deepgram's punctuation and capitals on a
    // plain order read as the same order the typed words give (the order line does nothing to typed punctuation either)
    const nQ = sim.night.log.length;
    EA.words = 'Full astern?';
    A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait(); P.tick(10); await settle();
    const youQ = A.crew.lines().filter(l => l.kind === 'you').slice(-1)[0] || {};
    row('a spoken question as Deepgram punctuates it ("Full astern?") is shown as the captain\'s line and given as no order: the grammar reads it as a question, as typed',
      sim.night.log.length === nQ && youQ.words === 'Full astern?', `orders given ${sim.night.log.length - nQ}; the captain's line "${youQ.words}"`);
    const pun = [], arg = (o) => (o.arg === undefined ? null : o.arg);
    for (const [spoken, typed] of [['Hard a-starboard.', 'hard a-starboard'], ['Mr Murdoch, stop the engines.', 'mr murdoch stop the engines'], ['Full astern!', 'full astern']]) {
      const want = window.TitanicCrewWords.parse(typed, { convention: A.crew.convention(), helm: 0 }).orders.map(o => [o.type, o.value, arg(o)]);
      const nP = sim.night.log.length;
      EA.words = spoken;
      A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait();
      pun.push({ spoken, want, got: sim.night.log.slice(nP).map(o => [o.type, o.value, arg(o)]) });
    }
    EA.words = 'stop';
    row('  Deepgram\'s punctuation and capitals on a plain order ("Hard a-starboard.", "Mr Murdoch, stop the engines.", "Full astern!") give the same order the typed words give',
      pun.every(p => p.got.length === 1 && JSON.stringify(p.got) === JSON.stringify(p.want)), JSON.stringify(pun));
    // THE SECOND REVIEW OF THE EARS (2026-11-24), on the page's side; each row fails without its mend.
    // Deepgram's commas can split an order the order line reads whole. The words are tried as they came; only where the
    // order line does not read them as an order (TitanicApp.crew.reads), and they hold no "?", are they tried once more
    // with their commas taken out, and then THAT is what is given, and shown as the captain's line
    const commas = [], ord3 = (o) => [o.type, o.value, arg(o)];
    const COMMAS = [   // [the words as Deepgram gives them, the captain's line, the orders given]
      ['Half astern, both engines.', 'Half astern both engines.', [['telegraph', 'half astern', null]]],       // the telegraph at half astern, both engines
      ['Starboard, twenty.', 'Starboard twenty.', [['helm', -20, null]]],                                  // the helm at starboard twenty: -20 in 1912's convention
      ['Port engine, full astern.', 'Port engine full astern.', [['telegraph', 'full astern', 'port']]],     // the port engine's telegraph at full astern
      ['Draw the fires, in boiler room six.', 'Draw the fires in boiler room six.', [['fires', 0, null]]],   // the fires drawn in boiler room 6 (the line's first room)
      ['Mr Murdoch, stop the engines.', 'Mr Murdoch, stop the engines.', [['telegraph', 'stop', null]]],    // read whole as it came: given so, its comma kept
      ['Full astern, shall we?', 'Full astern, shall we?', []],                                           // a question: never tried again
      ['What does the chief, say?', 'What does the chief, say?', []],                                     // a question that without its comma reads as an order (the engine room's report asked for): never tried again
    ];
    for (const [spoken, shown, want] of COMMAS) {
      const nC = sim.night.log.length;
      EA.words = spoken;
      A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait(); P.tick(10); await settle();
      const you = A.crew.lines().filter(l => l.kind === 'you').slice(-1)[0] || {};
      commas.push({ spoken, shown, want, got: sim.night.log.slice(nC).map(ord3), you: you.words });
    }
    EA.words = 'stop';
    const cOk = (c) => JSON.stringify(c.got) === JSON.stringify(c.want) && c.you === c.shown;
    const cSay = (cs) => cs.map(c => '"' + c.spoken + '" -> ' + JSON.stringify(c.got) + ' as "' + c.you + '"').join(' | ');
    row('the second review of the ears: commas that split an order ("Half astern, both engines.", "Starboard, twenty.", "Port engine, full astern.", "Draw the fires, in boiler room six.") are taken out where the words as they came are no order: each gives its order (the telegraph at half astern; the helm at starboard twenty, -20 in 1912\'s convention; the port engine\'s telegraph at full astern; the fires drawn in boiler room 6), and the captain\'s line is the words without their commas',
      A.crew.convention() === '1912' && commas.slice(0, 4).every(cOk), cSay(commas.slice(0, 4).filter(c => !cOk(c)).concat(commas.slice(0, 4).filter(cOk))));
    row('  an order the order line reads whole as it came ("Mr Murdoch, stop the engines.") is given as it came, its comma kept in the captain\'s line',
      cOk(commas[4]), cSay(commas.slice(4, 5)));
    row('  a question is never tried again: "Full astern, shall we?" gives no order, nor does "What does the chief, say?", which without its comma the order line reads as the engine room\'s report asked for; each is the captain\'s line as it came',
      cOk(commas[5]) && cOk(commas[6]), cSay(commas.slice(5)));
    // AND ITS FULL STOPS (the pre-check on a real key, 2026-11-24: "Hard a-starboard." spoken in one of Deepgram's own
    // voices came back from its listening as "Hard. A starboard.", which the order line reads as no order). Its full
    // stops and exclamation marks that have words after them are taken out as its commas are, on the same terms (the
    // line's own last mark stays); two orders the order line reads whole as they came are given so. The first row fails
    // without its mend
    const stops = [];
    const STOPS = [   // [the words as Deepgram gives them, the captain's line, the orders given]
      ['Hard. A starboard.', 'Hard A starboard.', [['helm', -40, null]]],                                   // the helm hard a-starboard: -40 in 1912's convention
      ['Hard! A port!', 'Hard A port!', [['helm', 40, null]]],                                              // hard a-port: +40 (the line's own last mark stays)
      ['Half. Astern. Both engines.', 'Half Astern Both engines.', [['telegraph', 'half astern', null]]],    // the telegraph at half astern, both engines
      ['Stop. Full astern.', 'Stop. Full astern.', [['telegraph', 'stop', null], ['telegraph', 'full astern', null]]],   // two orders read whole as they came: given so
      ['Is she making water.', 'Is she making water.', []],                                                // a question that came without its "?": no order
    ];
    for (const [spoken, shown, want] of STOPS) {
      const nC = sim.night.log.length;
      EA.words = spoken;
      A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait(); P.tick(10); await settle();
      const you = A.crew.lines().filter(l => l.kind === 'you').slice(-1)[0] || {};
      stops.push({ spoken, shown, want, got: sim.night.log.slice(nC).map(ord3), you: you.words });
    }
    EA.words = 'stop';
    row('the pre-check on a real key (2026-11-24): Deepgram\'s full stops and exclamation marks that split an order ("Hard. A starboard.", "Hard! A port!", "Half. Astern. Both engines.") are taken out where the words as they came are no order: each gives its order (the helm hard a-starboard, -40 in 1912\'s convention; hard a-port, +40; the telegraph at half astern), and the captain\'s line is the words without them',
      A.crew.convention() === '1912' && stops.slice(0, 3).every(cOk), cSay(stops.slice(0, 3).filter(c => !cOk(c)).concat(stops.slice(0, 3).filter(cOk))));
    row('  two orders the order line reads whole as they came ("Stop. Full astern.") are given as they came, in their order; a question that came without its "?" ("Is she making water.") gives no order; each is the captain\'s line as it came',
      cOk(stops[3]) && cOk(stops[4]), cSay(stops.slice(3)));
    const logR = JSON.stringify(sim.night.log), talkR = A.crew.lines().length, keptR = JSON.stringify(A.crew.kept()), toastsR = P.toasts.length;
    const readsR = { whole: A.crew.reads('Half astern both engines.'), comma: A.crew.reads('Half astern, both engines.'), question: A.crew.reads('Full astern?'), none: A.crew.reads(''),
      keyLike: A.crew.reads('sk-test-0123456789abcdefghijklmnopqrstuv') };
    row('  the order line\'s reading for a part (TitanicApp.crew.reads: does it read this line whole as an order now?) answers and gives nothing: the watch\'s log, the talk, the lines kept and the notices are as they were',
      same(readsR, { whole: true, comma: false, question: false, none: false, keyLike: false }) && JSON.stringify(sim.night.log) === logR && A.crew.lines().length === talkR && JSON.stringify(A.crew.kept()) === keptR && P.toasts.length === toastsR,
      JSON.stringify(readsR) + `; the log ${JSON.stringify(sim.night.log) === logR ? 'as it was' : 'CHANGED'}, the talk +${A.crew.lines().length - talkR}, notices +${P.toasts.length - toastsR}`);
    // Finding 3: the recorder stopped by the browser itself while the key is still held (its track ended: a microphone
    // unplugged, a headset lost, the system's privacy switch) gives nothing, and the app is never asked to finish
    const cR = EA.calls.length, nR = sim.night.log.length, notesR = A.voice.earsNotes();
    lineEl.value = ''; key('keydown', ' '); await settle();
    const recR = recNow(); recR.slice(100); await settle();
    MD.streams[MD.streams.length - 1].tracks[0].readyState = 'ended';
    recR.state = 'inactive'; recR.slice(40); recR.emit('stop', {}); await wait();
    const seqR = callsSince(cR), heldR = A.voice.listening(), noteR = A.voice.earsNote();
    key('keyup', ' '); await settle();
    row('a recorder the browser stops by itself while the key is still held (its track ended) gives nothing: the app is told to give the transmission up, never to finish; no order; the note says why, once',
      /^open audio:100\/1 cancel$/.test(seqR) && sim.night.log.length === nR && !heldR && A.voice.earsNotes() === notesR + 1 && noteR === 'The microphone stopped: nothing was given.' && callsSince(cR) === seqR,
      `${seqR}; given ${sim.night.log.length - nR}; held ${heldR}; "${noteR}"`);
    // ... and the race the second review of the ears found: the track ended, and the key let go BEFORE the recorder's own
    // stop event has come (the words were given): nothing is given either, and the app is never asked to finish
    const cK = EA.calls.length, nK = sim.night.log.length, notesK = A.voice.earsNotes();
    lineEl.value = ''; key('keydown', ' '); await settle();
    const recK = recNow(); recK.slice(100); await settle();
    recK.stream.tracks[0].readyState = 'ended';
    key('keyup', ' '); await wait();
    const seqK = callsSince(cK), noteK = A.voice.earsNote();
    row('  the track ended and the key let go BEFORE the recorder\'s own stop event has come: the same, nothing given: the app is told to give the transmission up (open, audio, cancel, and no finish), no order, and the note says why, once',
      seqK === 'open audio:100/1 cancel' && sim.night.log.length === nK && A.voice.earsNotes() === notesK + 1 && noteK === 'The microphone stopped: nothing was given.' && !A.voice.transmission(),
      `${seqK}; given ${sim.night.log.length - nK}; "${noteK}"`);
    // B01 (a mutation the review found no row for): the key let go before the transmission and the microphone are there
    // (a quick tap) records nothing; without the check the page recorded and sent for up to 10 s after the key was let go
    const cB = EA.calls.length, recsB = MD.recs.length, notesB = A.voice.earsNotes();
    A.voice.hold(); A.voice.release(); await settle(); await wait();
    const seqB = callsSince(cB);
    row('  a key let go before the transmission and the microphone have come (a quick tap) records nothing: no recorder is started, the app is told to give it up, and the note says to hold the key',
      MD.recs.length === recsB && seqB === 'open cancel' && A.voice.earsNotes() === notesB + 1 && /^Nothing was recorded/.test(A.voice.earsNote()) && !A.voice.transmission(),
      `recorders started ${MD.recs.length - recsB}; ${seqB}; "${A.voice.earsNote()}"`);
    // the second review of the ears: words left greyed under the line (an "unsure" answer's, with its note) are cleared at a
    // new run, at her end (the "foundered" event, and TitanicApp.gone seen on a step) and when the ears go off: they do not
    // stand under the line of a run, or a page, they were not heard in
    const greyed = [];
    for (const how of ['a new run', 'foundered', 'gone', 'ears off']) {
      EA.mode = 'unsure'; EA.words = 'full astern';
      A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait();
      const shownW = A.voice.heard(), noteW = A.voice.earsNote();
      EA.mode = 'ok'; EA.words = 'stop';
      const realGoneW = A.gone;
      if (how === 'a new run') A.emit('reset');
      else if (how === 'foundered') A.emit('event', 'foundered');
      else if (how === 'gone') { A.gone = () => true; step(1); }
      else { byId('voiceEarsOn').checked = false; byId('voiceEarsOn').fire('change'); }
      await settle();
      greyed.push({ how, shown: shownW, note: noteW, after: A.voice.heard(), text: byId('voiceHeard').textContent, hidden: byId('voiceHeard').hidden });
      A.gone = realGoneW;
      if (how === 'ears off') { byId('voiceEarsOn').checked = true; byId('voiceEarsOn').fire('change'); await settle(); }
      A.emit('reset'); step(1); await settle();
    }
    row('  words left greyed under the line (an "unsure" answer\'s, with its note) are cleared at a new run, at her end (the "foundered" event, and TitanicApp.gone seen on a step) and when the ears go off',
      greyed.every(g => g.shown === 'full astern' && g.note === 'The bridge did not catch the end of that: nothing was given.' && g.after === '' && g.text === '' && g.hidden === true) && A.voice.ears() === true,
      greyed.map(g => g.how + ': "' + g.shown + '" -> "' + g.text + '"' + (g.hidden ? '' : ' SHOWN')).join('; '));
    // Stage 2, B: while the app's own question to the player is open, it refuses setKey, clearKey, test, speak and open
    // "busy": the page says the app's own words where each is asked (the ears' note, the fold's line, "Try it")
    EA.busy = true;
    const recsU = MD.recs.length, nU = sim.night.log.length;
    A.voice.hold(); await settle(); A.voice.release(); await wait();
    const noteU = A.voice.earsNote();
    byId('voiceDgKey').value = 'test-key-busy-0000000000'; byId('voiceDgSave').click(); await settle();
    const msgU = byId('voiceDgMsg').textContent;
    byId('voiceDgTry').click(); await settle();
    const tryU = byId('voiceDgTryOut').textContent;
    EA.busy = false;
    row('while the app\'s own question to the player is open, what it refuses "busy" is said in its own words where it was asked: a transmission (nothing recorded, nothing given), a key saved, "Try it"',
      noteU === 'Nothing was given: An earlier change is waiting for your answer.' && MD.recs.length === recsU && sim.night.log.length === nU
      && msgU === 'An earlier change is waiting for your answer.' && tryU === 'No answer: An earlier change is waiting for your answer.', `"${noteU}" | "${msgU}" | "${tryU}"`);
    // the second review of the ears: "Forget" answered with a fault (app/voice.js's 'unsaved': the key forgotten for the run,
    // the settings file not written, so its seal may still be kept there) shows the app's own words under the key's field
    const UNSAVED = 'The key is forgotten for this run, but the settings file could not be written: it may still be kept there.';
    EA.clearFault = { ok: false, kind: 'unsaved', why: UNSAVED };
    byId('voiceDgMsg').textContent = '';
    byId('voiceDgKey').value = 'typed, then forgotten'; byId('voiceDgForget').click(); const clearedF = byId('voiceDgKey').value === ''; await settle();
    const msgF = byId('voiceDgMsg').textContent;
    EA.clearFault = null;
    byId('voiceDgKey').value = 'test-key-again-000000000'; byId('voiceDgSave').click(); await settle();
    row('  "Forget" answered with a fault (here "unsaved": the settings file could not be written) shows the app\'s own words under the key\'s field, the field cleared at once; a key saved again clears them',
      clearedF && msgF === UNSAVED && byId('voiceDgMsg').textContent === '' && EA.state.hasKey === true, `"${msgF}"`);
    // the coordinator's condition 3: a spoken night has the typed night's fingerprint. Two fresh watches of the same night
    // at the same point, each in turn the page's (as a new run puts one there): the same lines given at the same steps,
    // once typed and once spoken (the stand-in's words; filler words of address the grammar passes over)
    const N = P.N, ORD = ['mister murdoch hard a starboard', 'mister murdoch full astern', 'mister murdoch midships', 'mister murdoch stop'];
    const nightOf = async (how) => {
      const s = P.freshWatch(); A.state.sim = s; A.emit('reset'); step(1);
      s.k0 = s.night.k;                             // (where the lines begin: the log's orders from here on are theirs)
      for (const w of ORD) {
        if (how === 'typed') A.crew.give(w);
        else { EA.words = w; A.voice.hold(); await settle(); recNow().slice(64); await settle(); A.voice.release(); await wait(); }
        step(40);
      }
      return s;
    };
    const tN = await nightOf('typed'), sN = await nightOf('spoken');
    A.state.sim = sim; A.emit('reset'); step(1);
    const lt = JSON.stringify(tN.night.log), ls = JSON.stringify(sN.night.log);
    const mine = (s) => s.night.log.filter(x => x && x.k >= s.k0).map(x => [x.type, x.value]);
    const want = [['helm', -40], ['telegraph', 'full astern'], ['helm', 0], ['telegraph', 'stop']];
    row('a spoken night has the typed night\'s fingerprint: the same lines given at the same steps once by typing and once by speaking leave the same log (their four orders in it) and the same watch hash, and nothing of the words or the sound is in the log',
      tN !== sN && same(mine(tN), want) && same(mine(sN), want) && lt === ls && tN.night.hash === sN.night.hash && N.fingerprint(tN) === N.fingerprint(sN) && !/mister|murdoch|RIFF|webm|audio/i.test(ls),
      `typed ${N.fingerprint(tN)}: ${JSON.stringify(mine(tN))}; spoken ${N.fingerprint(sN)}: ${JSON.stringify(mine(sN))}; the logs ${lt === ls ? 'the same' : 'DIFFER'} (${tN.night.log.length} entries)`);
    // the coordinator's condition 4: her end as the page reads it, TitanicApp.gone (the founder flag, or the hand-over where
    // she breaks: a default watch now ends there with no 'foundered' event). Here A.gone is made to answer true, as
    // tools/minds_part_tests.js does
    for (let i = 0; i < 6; i++) { PL.finish(); await settle(); }
    byId('voiceDgOn').checked = true; byId('voiceDgOn').fire('change'); await settle();
    A.crew.give('half ahead'); await settle();
    const playG = PL.now()[0];
    A.voice.hold(); await settle(); recNow().slice(64); await settle();
    const callsG = EA.calls.length, cancelsG = S.cancels, n8 = sim.night.log.length, askedG = EA.asked.length, givenG = S.given.length, getsG = MD.gets;
    const realGone = A.gone; A.gone = () => true;
    step(1); await settle();
    const atEnd = { stopped: !!playG && playG.stopped, cancels: S.cancels - cancelsG, calls: EA.calls.slice(callsG).map(c => c[0]).join(' '), held: A.voice.listening(), note: A.voice.earsNote(), mic: A.voice.micOpen(), seen: A.voice.gone() };
    A.crew.say('The officer of the watch', 'Stand by the boats.', 'script'); await settle();
    const pressedG = A.voice.hold(); await settle();
    const cancels2 = S.cancels; step(1); await settle();
    const afterG = { asked: EA.asked.length - askedG, given: S.given.length - givenG, pressed: pressedG, gets: MD.gets - getsG, opens: EA.calls.slice(callsG).filter(c => c[0] === 'open').length, log: sim.night.log.length - n8, again: S.cancels - cancels2 };
    A.gone = realGone; A.emit('reset'); step(1); await settle();
    const askedB = EA.asked.length; A.crew.give('stop'); await settle();
    const backG = { asked: EA.asked.length - askedB, seen: A.voice.gone() };
    for (let i = 0; i < 6; i++) { PL.finish(); await settle(); }
    byId('voiceDgOn').checked = false; byId('voiceDgOn').fire('change'); await settle();
    row('her end as the page reads it (TitanicApp.gone, with no "foundered" event): seen on the step, once, the voices are hushed (Deepgram\'s line stopped, this PC\'s cancelled), the transmission held is given up and said, the microphone closed; then nothing is spoken, asked for or heard and a press opens nothing; after a new run the men are heard again',
      atEnd.stopped && atEnd.cancels >= 1 && atEnd.calls === 'cancel' && !atEnd.held && /^She has gone/.test(atEnd.note) && !atEnd.mic && atEnd.seen
      && afterG.asked === 0 && afterG.given === 0 && afterG.pressed === false && afterG.gets === 0 && afterG.opens === 0 && afterG.log === 0 && afterG.again === 0 && backG.asked >= 1 && backG.seen === false,
      `at her end: ${JSON.stringify(atEnd)}; then: ${JSON.stringify(afterG)}; after a new run: ${JSON.stringify(backG)}`);
    // the confirmation asked for: the men's sound reaches the page only as bytes (an ArrayBuffer) decoded by Web Audio,
    // and the microphone's leaves it only as bytes: no blob: or data: address, no object URL, no audio element
    const src89 = require('fs').readFileSync(require('path').join(__dirname, '..', 'site', 'parts', '89_voice.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    const addr = src89.match(/['"`](blob|data):|createObjectURL|new Audio\(|createElement\(['"]audio|\.src\s*=/g) || [];
    row('  the men\'s sound reaches the page only as bytes (an ArrayBuffer) decoded by Web Audio\'s decodeAudioData, and the microphone\'s leaves only as bytes: no blob: or data: address, no object URL, no audio element, so the page\'s content policy does not move',
      /decodeAudioData\(/.test(src89) && /\.arrayBuffer\(\)/.test(src89) && addr.length === 0, addr.length ? 'FOUND: ' + addr.join(', ') : 'decodeAudioData and arrayBuffer only');
    A.voice.useMedia(null);
    await A.voice.useTransport(null); await settle();
    row('the app\'s object taken away: the button, the ears\' switch and the words\' line are hidden again', micEl.hidden && byId('voiceEarsRow').hidden && byId('voiceHeard').hidden && !A.voice.ears(),
      `button ${micEl.hidden ? 'hidden' : 'SHOWN'}; switch ${byId('voiceEarsRow').hidden ? 'hidden' : 'SHOWN'}`);
    }
    step(4);
    row('nothing reached console.error', errors.length === 0, errors.slice(0, 2).join(' || ').slice(0, 300));
  } catch (e) {
    fails++; out.push('FAIL the suite could not finish: ' + (e && e.stack || e));
  }
  P.restore();
  console.log(out.join('\n'));
  if (errors.length) console.log('\nconsole.error calls:\n' + errors.slice(0, 4).join('\n---\n').slice(0, 2000));
  console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${out.length} rows`);
  process.exit(fails ? 1 : 0);
})();
