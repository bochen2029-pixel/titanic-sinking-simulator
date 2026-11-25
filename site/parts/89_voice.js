// The bridge heard: each line a man says on the bridge spoken aloud (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md,
// sections 3 and 4). A part of the viewer (site/app.js, "parts"), on the order line (site/parts/86_crew.js,
// TitanicApp.crew.onSaid). Two voices, and never both for one line. They have their own switches: the ship's sound
// (site/parts/30_sound.js, its switch and its volume) is the ship's, and does not reach them.
//
// THE FLOOR: the voices are this PC's own.
//   - NO KEY AND NO NETWORK. Only voices the system says are local are used (SpeechSynthesisVoice.localService). A
//     browser may also list voices that are made by a service on the network: those are never chosen, so a line is
//     never sent anywhere to be spoken. With no local English voice, nothing is spoken and the section says so.
//   - Off by default; a switch in the order line's section, kept in the page's storage.
//   - What is spoken: a line a NAMED man says in the bridge's talk: the bridge's own answers (step 1's, authored), the
//     officer of the watch's orders on the night's own script, and the crew's own words (imagined, where the crew's
//     minds are on). Never the captain's own lines (the player said them), and never a notice: a notice is nobody's.
//   - The caption always stands in the talk: the voice is beside it, never instead of it.
//   - Each man keeps one voice and one pitch through a night, chosen by his name, so the same on every run. British
//     voices first, then other English ones.
//   - Nothing is spoken above four times her pace (the lines then come faster than they can be said), and at most
//     three lines wait: beyond that the waiting ones give way to the newest.
// DEEPGRAM'S VOICES (the desktop app, with the player's own key): each man in a voice of Deepgram's, his own.
//   - The transport is window.titanicVoice, the app's second object (status, set, setKey, clearKey, test, speak, each a
//     Promise; app/voice.js), looked up when needed; a test may set another (TitanicApp.voice.useTransport). With none
//     (the public page), or with Deepgram's voices off, the part is the floor above and nothing else.
//   - Folded under the switch, "Deepgram's voices (your own key)": the key's field (read once, passed once to the app
//     and cleared at once: the page never keeps it), Save, Forget, their switch (the app itself asks the player before
//     it goes on, and the page cannot answer for him), "Try it", and the run's characters against its limit.
//   - While they are on, a line the floor would speak (the same rules: a named man's, never the captain's own, never a
//     notice, nothing above four times her pace) is asked of the app by the man's name and his words alone
//     (speak({ who, text }): the voice is the app's to choose), and the WAV that comes back is decoded and played (an
//     AudioContext of the page's; a test may set another player, TitanicApp.voice.usePlayer). One line plays at a time
//     and at most three wait: beyond that the oldest waiting gives way. The next line's voice is asked for while the
//     one before it plays, one request at a time. A new run, her foundering and their switch going off stop it.
//   - A line that cannot be had (a fault, the run's limit) is said ONCE in the part's own note (again only after a
//     line has been had, or in a new run), and that line is spoken by the floor's voice if the floor's own switch is
//     on, else not at all. A fault that will not pass by itself (the key refused, the limit spent, the switch off, no
//     key) stands Deepgram down for the run, until the player changes something in the fold: a refused key is not sent
//     again and again.
// THE EARS (the desktop app, with the player's own key; the design note, section 5): speaking to the bridge.
//   - Its own switch, in the same fold ("Speak to the bridge"), off at every start of the app (the app itself asks the
//     player before it goes on), with its own limit of the run in minutes heard. Shown only where the app's object has
//     open (window.titanicVoice in the desktop app): the public page shows no microphone.
//   - Push to talk: hold Space in the order line while it has the focus and is EMPTY (a space typed into words is a
//     space), or hold the microphone button beside the line (letting go, the pointer leaving it, a cancelled pointer or
//     the window losing the focus lets go). Escape while held gives it up.
//   - On the press the app is asked to open a transmission (open), and the microphone is opened (getUserMedia, one
//     channel, echo cancelled and noise suppressed) and recorded by the browser's own MediaRecorder as WebM with Opus, a
//     slice every 100 ms; each slice goes to the app (audio). No audio worklet: none ships in dist/ (the lane's brief).
//   - The words heard so far (the app's 'voice:heard', through onHeard) show greyed under the line while it is held; they
//     are never put into the line. On letting go the recorder is stopped; the part waits for the recorder's own stop
//     event (its last slice comes before it), sends that last slice, and only then asks the app to finish (fathom's
//     in-app path asked at once and could lose the end: the research note, C3). The words that come back are given by
//     TitanicApp.crew.give(text), the one way a typed line is given: a spoken order is the same order typed, logged as
//     one, and its link replays with no microphone. Neither sound nor words are kept.
//   - A transmission that fails, or brings no words, gives nothing and says why, once, in the ears' own note under the line.
//     Only FINAL words are given: words the app says are not final (Deepgram had not made them final when its wait
//     ended, or the app cut the transmission at its bound while the key was held) stay greyed under the line with the
//     note, and nothing is given. A spoken question comes back with its "?" (the app asks for punctuation) and is a
//     question to the order line, as typed. A recorder that the browser stops by itself while the key is held (its
//     track ended) gives nothing either; the app is asked to finish only once the key is let go.
//   - The men's voices wait while the key is held, so that the microphone does not hear them: no new line starts (a line
//     already playing is not cut off; lines the browser's speech holds already are its own), and they go on when it is let go.
//   - The microphone is kept open 20 s of the page's clock after its last use, so that the next press is quick, and is
//     closed (its tracks ended) then, at a new run, and when the ears go off. A transmission has a bound of its own on
//     the page's clock, 35 s from the press (the app's own is 30), so that a release that is never seen cannot hold the
//     microphone open, and 10 s more for the words once let go.
// HER END: once the page says she is gone (TitanicApp.gone(sim): the founder flag, or the hand-over where she breaks, at
// which a default watch now ends with no 'foundered' event), nothing more is spoken, asked for or heard (the voices
// hushed, a transmission given up, none opened, the microphone closed), until a new run. The 'foundered' event hushes too.
// [appearance]: every voice here, its pitch, its rate and its level. The floor's are this PC's, not the men's;
// Deepgram's are Deepgram's (none of them is Scots, Cornish or Ulster: no accent is claimed).
// The page reads no wall clock, and keeps no timer of its own but the bounds on a line awaited and on a transmission,
// and the microphone's 20 s, on the page's own clock (TitanicApp.after). The speaking, the recording and the audio's
// clock are the browser's own.
(function () {
  'use strict';
  const A = window.TitanicApp;
  if (!A || !A.crew || typeof A.crew.onSaid !== 'function') return;
  const sec = document.getElementById('crewSec');
  if (!sec) return;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const KEY = 'titanic.voice.on';
  const PACE = 4;                                   // nothing is spoken above this pace
  const QUEUE = 3;                                  // lines waiting at most
  const PITCH = [0.8, 0.9, 1.0, 0.85, 0.95];        // [appearance] a man's pitch, by his name
  const RATE = 1.0;                                 // [appearance]
  const YOU = 'You';
  // s of the page's clock a line's voice is awaited at most: the app bounds its own wait (60 s at most), and the page
  // does not rest on that (a transport that never answers must not hold the lines all night)
  const AWAIT = 75;
  const LASTING = { auth: 1, budget: 1, off: 1, 'no-key': 1 };   // faults that do not pass by themselves
  // the ears': s of the page's clock a transmission may be held (the app's own bound is 30 s), s its words are awaited
  // once let go (the app answers within 3.5), s the microphone is kept open after its last use; ms of a recorder's slice;
  // the most bytes sent to the app at once (its own bound); what the recorder makes, and what is asked of the microphone
  const EARS_HOLD = 35, EARS_WAIT = 10, EARS_WARM = 20, SLICE_MS = 100, PIECE = 65536;
  const MIME = 'audio/webm;codecs=opus';
  const MIC = { audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } };
  const clip = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 3) + '...' : s; };
  const unstop = (s) => String(s).replace(/[.!?]+$/, '');
  const cnt = (x) => (typeof x === 'number' && isFinite(x) && x > 0 ? Math.round(x) : 0);
  const count = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // the speech and its utterances: the browser's own, looked up when needed; a test may set others (useSynth)
  let synth0 = null, Utter0 = null;
  const synth = () => synth0 || window.speechSynthesis || null;
  const Utter = () => Utter0 || window.SpeechSynthesisUtterance || null;

  let on = false;
  try { on = window.localStorage.getItem(KEY) === '1'; } catch (e) { /* no storage */ }

  // ------------------------------------------------------------------ the switch, in the order line's section
  const box = el('input'); box.type = 'checkbox'; box.id = 'voiceOn';
  const lab = el('label', 'check mt8 voice-row'); lab.id = 'voiceRow';
  lab.append(box, el('span', null, 'Hear the bridge: each line a man says is spoken aloud, by a voice of this PC\'s own'));
  const note = el('p', 'hint voice-note'); note.id = 'voiceNote';

  // ------------------------------------------------------------------ Deepgram's voices, folded under it (the app only)
  // a fault, said once, outside the fold so that it is seen while the fold is shut
  const dgNote = el('p', 'hint voice-note'); dgNote.id = 'voiceDgNote'; dgNote.hidden = true;
  const fold = el('details', 'minds-fold voice-fold mt6'); fold.id = 'voiceDgFold'; fold.hidden = true;
  const foldSum = el('summary', null, 'Deepgram\'s voices (your own key)'); foldSum.id = 'voiceDgSum';
  fold.appendChild(foldSum);
  const ctl = el('div', 'minds-ctl voice-ctl'); ctl.id = 'voiceDgCtl';
  const dgBox = el('input'); dgBox.type = 'checkbox'; dgBox.id = 'voiceDgOn';
  const dgLab = el('label', 'check'); dgLab.append(dgBox, el('span', null, 'Each man speaks in a voice of Deepgram\'s, his own. The app sends Deepgram each line he says, as text, and Deepgram bills your key for every character'));
  const keyIn = el('input', 'minds-in'); keyIn.id = 'voiceDgKey'; keyIn.type = 'password'; keyIn.autocomplete = 'off'; keyIn.spellcheck = false; keyIn.placeholder = 'Your Deepgram key';
  keyIn.setAttribute('aria-label', 'Your Deepgram key, read once and cleared');
  const keySave = el('button', 'chip', 'Save'); keySave.id = 'voiceDgSave'; keySave.type = 'button';
  const keyForget = el('button', 'chip', 'Forget'); keyForget.id = 'voiceDgForget'; keyForget.type = 'button';
  const keyRow = el('div', 'kv mt6 minds-row'), keyVal = el('span', 'minds-val');
  keyVal.append(keyIn, keySave, keyForget); keyRow.append(el('span', null, 'Key'), keyVal);
  const keyNote = el('p', 'hint'); keyNote.id = 'voiceDgKeyNote';
  const tryBtn = el('button', 'chip', 'Try it'); tryBtn.id = 'voiceDgTry'; tryBtn.type = 'button';
  const tryOut = el('span', 'hint'); tryOut.id = 'voiceDgTryOut';
  const tryRow = el('div', 'row mt6'); tryRow.append(tryBtn, tryOut);
  const useLine = el('p', 'hint'); useLine.id = 'voiceDgUse';
  // the run's limit, the player's to set (the app itself asks him before it is raised while the voices are on)
  const limC = el('input', 'minds-num'); limC.id = 'voiceDgLimit'; limC.type = 'number'; limC.min = '1000'; limC.step = '1000'; limC.setAttribute('aria-label', 'The most characters sent to Deepgram in a run of the app');
  const limPair = el('span', 'minds-pair'); limPair.append(limC, el('span', 'hint', 'characters a run'));
  const limRow = el('div', 'kv mt6 minds-row'), limVal = el('span', 'minds-val'); limVal.append(limPair); limRow.append(el('span', null, 'Limit'), limVal);
  const msg = el('p', 'hint minds-msg'); msg.id = 'voiceDgMsg';
  // (what a stranger reads before any key goes in)
  const dgAbout = el('p', 'hint voice-about', 'Optional, and off each time the app starts. With a Deepgram key of your own, each man speaks in a voice of his own, and you can speak your orders '
    + 'instead of typing them. Your key is kept on this PC, encrypted by Windows, and is sent only to Deepgram, which bills you for each character spoken and each minute heard. What you say is '
    + 'sent, as sound, only while you hold the key to speak. Before either is switched on the app asks you, in a message box of its own.');
  dgAbout.id = 'voiceDgAbout';
  ctl.append(dgAbout, dgLab, keyRow, keyNote, tryRow, useLine, limRow, msg);
  // the ears, in the same fold (the same key): their switch (the app itself asks the player before it goes on), their
  // limit in minutes heard a run, and their use; shown only where the app's object can open a transmission
  const earsBox = el('input'); earsBox.type = 'checkbox'; earsBox.id = 'voiceEarsOn';
  const earsLab = el('label', 'check mt8'); earsLab.id = 'voiceEarsRow';
  earsLab.append(earsBox, el('span', null, 'Speak to the bridge: hold the key and say an order or a question'));
  const earsHint = el('p', 'hint'); earsHint.id = 'voiceEarsHint';
  earsHint.textContent = 'Hold Space in the empty order line, or the button beside it, and speak; let go, and the words are given as if typed (Escape gives them up). '
    + 'While you hold it the app sends what you say to Deepgram, as sound, to be turned into words, and Deepgram bills your key for each minute heard. '
    + 'Nothing is sent while you do not hold it, and the men wait to speak until you let go.';
  const earsLim = el('input', 'minds-num'); earsLim.id = 'voiceEarsLimit'; earsLim.type = 'number'; earsLim.min = '1'; earsLim.max = '240'; earsLim.step = '1';
  earsLim.setAttribute('aria-label', 'The most minutes of what you say sent to Deepgram in a run of the app');
  const earsPair = el('span', 'minds-pair'); earsPair.append(earsLim, el('span', 'hint', 'minutes heard a run'));
  const earsLimRow = el('div', 'kv mt6 minds-row'), earsLimVal = el('span', 'minds-val'); earsLimVal.append(earsPair); earsLimRow.append(el('span', null, 'Limit'), earsLimVal);
  earsLimRow.id = 'voiceEarsLimitRow';
  const earsUse = el('p', 'hint'); earsUse.id = 'voiceEarsUse';
  for (const x of [earsLab, earsHint, earsLimRow, earsUse]) { x.hidden = true; ctl.insertBefore(x, msg); }
  fold.append(ctl);
  // ... and by the order line: the microphone button in its row, and under it the words heard so far (greyed) and the
  // ears' own note (why a transmission gave nothing)
  const line = document.getElementById('crewLine'), lineRow = line && line.parentNode ? line.parentNode : null;
  const mic = el('button', 'chip voice-mic', 'Hold to speak'); mic.id = 'voiceMic'; mic.type = 'button'; mic.hidden = true;
  mic.setAttribute('aria-pressed', 'false'); mic.setAttribute('aria-label', 'Hold to speak an order or a question to the bridge');
  mic.title = 'Hold it, or Space in the empty order line, and speak; let go to give it, Escape to give it up';
  const heardEl = el('p', 'hint voice-heard'); heardEl.id = 'voiceHeard'; heardEl.hidden = true; heardEl.setAttribute('aria-live', 'polite');
  const earsNote = el('p', 'hint voice-note'); earsNote.id = 'voiceEarsNote'; earsNote.hidden = true;
  if (lineRow && lineRow.parentNode) {
    lineRow.appendChild(mic);
    const below = lineRow.nextSibling;
    lineRow.parentNode.insertBefore(heardEl, below); lineRow.parentNode.insertBefore(earsNote, below);
  }

  const before = document.getElementById('mindsFold');
  if (before && before.parentNode === sec) { for (const x of [lab, note, dgNote, fold]) sec.insertBefore(x, before); } else sec.append(lab, note, dgNote, fold);

  // ------------------------------------------------------------------ the voices: local ones only, English, British first
  const rank = (v) => (/^en[-_]GB/i.test(v.lang) ? 0 : (/^en[-_](IE|AU|NZ|ZA|IN)/i.test(v.lang) ? 1 : 2));
  function voices() {
    const s = synth();
    let V = [];
    try { V = s && typeof s.getVoices === 'function' ? Array.from(s.getVoices() || []) : []; } catch (e) { V = []; }
    V = V.filter(v => v && v.localService === true && /^en([-_]|$)/i.test(String(v.lang || '')));
    return V.sort((a, b) => rank(a) - rank(b) || (String(a.name) < String(b.name) ? -1 : (String(a.name) > String(b.name) ? 1 : 0)));
  }
  const hashOf = (s) => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
  // The speech's voices carry no word of whether they are a man's or a woman's, only a name. The people on her bridge
  // are men: a voice whose name is a woman's is passed over while any other local English voice is there [appearance:
  // a list of the names the systems' voices are sold under; a voice not on it is taken for a man's]
  const WOMAN = /\b(zira|hazel|susan|heera|catherine|linda|sonia|libby|maisie|jenny|aria|michelle|samantha|karen|moira|tessa|fiona|kate|serena|victoria|allison|ava|veena|martha|emma|amy|joanna|salli|kendra|kimberly|ivy|nicole|raveena|clara|molly|abbi|bella|hollie|olivia|mia|natasha|annette|elsie|female|woman)\b/i;
  // a man's voice: among the local English voices that are not a woman's (all of them, if there is no other), the
  // best-ranked by language, and of those the one his name picks
  function voiceFor(who) {
    let V = voices();
    if (!V.length) return null;
    const men = V.filter(v => !WOMAN.test(String(v.name)));
    if (men.length) V = men;
    const best = V.filter(v => rank(v) === rank(V[0]));
    return best[hashOf(who) % best.length];
  }
  // the voices the men are given here: what voiceFor chooses among
  function used() { let V = voices(); const men = V.filter(v => !WOMAN.test(String(v.name))); if (men.length) V = men; return V.filter(v => rank(v) === rank(V[0])); }

  // ------------------------------------------------------------------ the floor's speaking
  let waiting = 0;
  const log = [];                                   // what was given to the speech, for the tests (the last 40)
  // held: the ears' key held ('key', 'button', 'button-key' or 'test'; '' when not), so that the microphone does not
  // hear the men: a line said meanwhile waits here (three at most, the oldest giving way) and is spoken when it is let go
  let held = '';
  const floorWait = [];
  function speak(e) {
    const s = synth(), U = Utter();
    if (!on || !s || !U || !e || !e.who || e.who === YOU || !e.words) return false;
    if (typeof A.pace === 'function' && A.pace() > PACE) return false;
    if (held) { floorWait.push({ who: e.who, words: e.words, kind: e.kind }); while (floorWait.length > QUEUE) floorWait.shift(); return true; }
    const v = voiceFor(e.who);
    if (!v) return false;
    let u;
    try {
      u = new U(String(e.words));
      u.voice = v; u.lang = v.lang; u.rate = RATE; u.pitch = PITCH[hashOf(e.who) % PITCH.length]; u.volume = 1;
      const done = () => { if (waiting > 0) waiting--; };
      u.onend = done; u.onerror = done;
      if (waiting >= QUEUE) { s.cancel(); waiting = 0; }           // the waiting lines give way to the newest
      waiting++;
      s.speak(u);
    } catch (err) { return false; }
    log.push({ who: e.who, words: String(e.words), kind: e.kind, voice: String(v.name), lang: String(v.lang), pitch: u.pitch });
    if (log.length > 40) log.shift();
    return true;
  }
  function hushFloor() { const s = synth(); waiting = 0; floorWait.length = 0; try { if (s) s.cancel(); } catch (e) { /* nothing was speaking */ } }

  // ------------------------------------------------------------------ Deepgram's: the transport, looked up when needed
  let override = null, stat = null, shownFor;
  const transport = () => override || window.titanicVoice || null;
  let down = '';                                    // a lasting fault's kind: Deepgram stood down for the run
  const dgOn = () => !!(transport() && stat && stat.on === true && stat.hasKey === true && !down);

  // The player of a line's WAV: an AudioContext of the page's own, made at the first line, at the WAV's own level
  // [appearance]; a test may set another (usePlayer). play(wav, done) calls done(true) once the line has been played,
  // done(false) if it could not be, and answers a handle whose stop() silences it (done is then not called)
  let player0 = null, ctx0 = null;
  function audio() {
    if (ctx0) return ctx0;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (typeof AC !== 'function') return null;
    try { ctx0 = new AC(); } catch (e) { ctx0 = null; }
    return ctx0;
  }
  const audioPlayer = {
    play(wav, done) {
      const ctx = audio();
      const buf = wav instanceof ArrayBuffer ? wav : (wav && ArrayBuffer.isView(wav) ? wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength) : null);
      if (!ctx || !buf) { done(false); return null; }
      let src = null, stopped = false;
      try { if (ctx.state === 'suspended' && typeof ctx.resume === 'function') { const r = ctx.resume(); if (r && typeof r.catch === 'function') r.catch(() => {}); } } catch (e) { /* it plays as it can */ }
      let p = null;
      try { p = ctx.decodeAudioData(buf); } catch (e) { done(false); return null; }
      Promise.resolve(p).then((audioBuf) => {
        if (stopped) return;
        // (the sound's own node is let go as it ends: its buffer is the decoded line, some megabytes of it)
        try { src = ctx.createBufferSource(); src.buffer = audioBuf; src.connect(ctx.destination); src.onended = () => { src = null; if (!stopped) done(true); }; src.start(); } catch (e) { src = null; done(false); }
      }, () => { if (!stopped) done(false); });
      return { stop() { stopped = true; const s0 = src; src = null; try { if (s0) s0.stop(); } catch (e) { /* not started, or ended */ } } };
    },
  };
  const player = () => player0 || audioPlayer;
  // with nothing to play the page's audio is let rest (the next line wakes it): no stream is held open between lines
  function rest() {
    if (playing || asking || dgq.length || !ctx0) return;
    try { if (ctx0.state === 'running' && typeof ctx0.suspend === 'function') { const r = ctx0.suspend(); if (r && typeof r.catch === 'function') r.catch(() => {}); } } catch (e) { /* it rests as it can */ }
  }

  // ------------------------------------------------------------------ Deepgram's: the lines, in the order said
  // a line: { n, gen, who, words, kind, state: 'new' | 'asking' | 'got' | 'failed' | 'playing', wav, res, voice, end }
  // (After the review of this part: a line is asked for ONE AHEAD and no more, since each asked for is billed whether or
  // not it is then heard; room in the queue is made by a line not yet asked for; a line's sound has a bound of its own;
  // a request of an older run still out is counted, so that the app is never asked for a third at once.)
  let gen = 0, dgN = 0, asking = null, playing = null, pumping = false, again = false, stale = 0;
  const dgq = [];                                   // the lines waiting, oldest first
  const dgLog = [];                                 // for the tests: the lines given to Deepgram's path, and what became of each (the last 40)
  let faultSaid = '', faultLasting = false, faultNotes = 0;
  const unsay = () => { faultSaid = ''; faultLasting = false; };   // the fault said is no longer so
  const PLAY0 = 15, PLAY_PER = 0.25;                // s of the page's clock a line's sound may last: PLAY0 and PLAY_PER a character [bet: thrice a slow voice]
  function queueLine(e) {
    const it = { n: ++dgN, gen, who: String(e.who), words: String(e.words), kind: e.kind, state: 'new', wav: null, res: null, voice: '', end: null };
    // room is made by the oldest line not yet asked for (it has cost nothing); only when every waiting line has been
    // asked for does the oldest of them give way
    while (dgq.length >= QUEUE) {
      let i = dgq.findIndex(x => x.state === 'new'); if (i < 0) i = 0;
      const old = dgq.splice(i, 1)[0]; old.end = 'gave way'; old.wav = null;
    }
    dgq.push(it);
    dgLog.push(it); if (dgLog.length > 40) dgLog.shift();
    pump();
    return true;
  }
  // the next line's voice is asked for one ahead (one request at a time, the oldest waiting first, and only while no
  // voice already had waits to be played); the oldest waiting plays once its voice has come and nothing plays; one that
  // could not be had goes to the floor
  function pump() {
    if (pumping) { again = true; return; }
    pumping = true;
    try {
      do {
        again = false;
        // above four times her pace nothing more is asked for: the lines not yet asked for give way (they have cost nothing)
        if (typeof A.pace === 'function' && A.pace() > PACE) for (let i = dgq.length - 1; i >= 0; i--) if (dgq[i].state === 'new') { dgq[i].end = 'too fast'; dgq.splice(i, 1); }
        // (while the ears' key is held no line starts: the next voice is still asked for, one ahead)
        while (!playing && !held && dgq.length) {
          const head = dgq[0];
          if (head.state === 'got') { dgq.shift(); play(head); }
          else if (head.state === 'failed') { dgq.shift(); fallback(head); }
          else break;
        }
        if (!asking && stale < 2 && !dgq.some(x => x.state === 'got')) { const next = dgq.find(x => x.state === 'new'); if (next) ask(next); }
      } while (again);
    } finally { pumping = false; }
    rest();
  }
  function ask(it) {
    const T = transport();
    asking = it; it.state = 'asking';
    let once = false, timer = null;
    const done = (res) => {
      if (once) return; once = true;
      if (timer && typeof A.cancelAfter === 'function') A.cancelAfter(timer);
      if (asking === it) asking = null;
      else if (it.staled) { it.staled = false; if (stale > 0) stale--; }       // an older run's request has come back
      if (it.gen === gen && !it.end) {             // not a line of an older run, nor one that gave way
        const ok = !!(res && res.ok === true && res.wav);
        it.res = { ok, kind: res && typeof res.kind === 'string' ? clip(res.kind, 20) : (ok ? '' : 'fault'), why: res && typeof res.why === 'string' ? res.why : '' };
        if (ok) { it.state = 'got'; it.wav = res.wav; it.voice = typeof res.voice === 'string' ? clip(res.voice, 40) : ''; if (faultSaid) { unsay(); paintDg(); } }
        else {
          it.state = 'failed';
          // a fault that will not pass by itself: Deepgram stands down, and the lines waiting are not asked for either
          if (LASTING[it.res.kind]) { down = it.res.kind; for (const x of dgq) if (x.state === 'new') { x.state = 'failed'; x.res = it.res; } }
        }
      }
      refreshStatus();                              // the run's use, as the app counts it
      pump();
    };
    let p = null;
    try { p = T && typeof T.speak === 'function' ? T.speak({ who: it.who, text: it.words }) : null; } catch (e) { p = null; }
    if (p && typeof p.then === 'function') {
      p.then(done, () => done({ ok: false, kind: 'network', why: 'the call to the app failed' }));
      if (!once && typeof A.after === 'function') timer = A.after(AWAIT * 1000, () => done({ ok: false, kind: 'timeout', why: 'no answer came in ' + AWAIT + ' seconds' }));
    } else done(p && typeof p === 'object' ? p : { ok: false, kind: 'network', why: 'there is no app to ask' });
  }
  const letGo = (it) => { const h = it.handle; it.handle = null; try { if (h && typeof h.stop === 'function') h.stop(); } catch (e) { /* it had ended */ } };
  function play(it) {
    const P = player(), wav = it.wav;
    it.wav = null; it.state = 'playing'; playing = it;
    let over = false, bound = null;
    const done = (ok) => {
      if (over) return; over = true;
      if (bound && typeof A.cancelAfter === 'function') A.cancelAfter(bound);
      it.handle = null;                             // the sound's own handle is let go with it (it holds the decoded line)
      if (playing === it) playing = null;
      if (it.gen === gen && !it.end) {
        if (ok === true) it.end = 'played';
        else { it.res = { ok: false, kind: 'audio', why: 'its sound could not be played' }; fallback(it); }
      }
      pump();
    };
    if (!P || typeof P.play !== 'function') { done(false); return; }
    let h = null;
    try { h = P.play(wav, done); } catch (e) { done(false); return; }
    if (over) return;
    it.handle = h;
    // A sound that never says it has ended must not hold the lines behind it for good. Past its bound it is stopped and
    // the line is over: said once, and NOT given to the floor, since it has most likely been heard
    if (typeof A.after === 'function') bound = A.after((PLAY0 + it.words.length * PLAY_PER) * 1000, () => {
      if (over) return; over = true;
      letGo(it);
      if (playing === it) playing = null;
      if (it.gen === gen && !it.end) {
        it.end = 'cut short'; it.res = { ok: false, kind: 'audio', why: 'its sound did not end' };
        if (!faultSaid) { faultSaid = 'A line\'s sound did not end, and was stopped.'; faultLasting = false; faultNotes++; paintDg(); }
      }
      pump();
    });
  }
  // a line that could not be had: said once (a fault that stands Deepgram down is said over one that did not: it is other
  // news), and spoken by the floor's own voice if its switch is on, else not at all
  function fallback(it) {
    const lasting = !!LASTING[it.res && it.res.kind];
    if (!faultSaid || (lasting && !faultLasting)) {
      const why = it.res && it.res.why ? unstop(clip(it.res.why, 200)) : 'no answer came';
      faultSaid = (lasting ? 'Deepgram\'s voices stand down for this run: ' : 'Deepgram\'s voice could not be had for a line: ') + why + '.';
      faultLasting = lasting; faultNotes++;
      paintDg();
    }
    it.end = on && speak({ who: it.who, words: it.words, kind: it.kind }) ? 'floor' : 'silent';
  }
  // a new run, her foundering, their switch going off: nothing more of what was asked is played
  function stopDg() {
    gen++;
    for (const it of dgq) { it.end = 'hushed'; it.wav = null; }
    dgq.length = 0;
    const p = playing; playing = null;
    if (p) { p.end = 'hushed'; letGo(p); }
    // a request still out is an older run's now: its answer, when it comes, is not played. It is counted until it comes
    // back, so that with the next line's request the app is never asked for a third at once (it takes two)
    if (asking) { asking.staled = true; stale++; asking = null; }
    rest();
  }
  function hush() { hushFloor(); stopDg(); }

  // ------------------------------------------------------------------ her end, as the page reads it
  // TitanicApp.gone(sim) is the page's own word for "she is gone": the founder flag, or the hand-over where she breaks.
  // A default watch now ends where she breaks, and the 'foundered' event never comes then (the coordinator's condition
  // 4). Once it is true nothing more is spoken, asked for or heard: the voices are hushed, a transmission open is given
  // up, none is opened, and the microphone is closed. Checked on each step (acted on once, when it turns true, and again
  // after a new run), and before each line and each press
  let goneSeen = false;
  const isGone = () => { const sim = A.state && A.state.sim; if (!sim || typeof A.gone !== 'function') return false; try { return !!A.gone(sim); } catch (e) { return false; } };
  // (words left greyed under the line by an earlier transmission go with it: the second review of the ears)
  function sheIsGone() { goneSeen = true; hush(); earsStop(tx ? 'She has gone: nothing was given.' : ''); showHeard(''); stopStream(); paintMic(); }

  // ------------------------------------------------------------------ what is said on the bridge
  function said(e) {
    if (!e || !e.who || e.who === YOU || !e.words) return false;
    if (isGone()) return false;                     // she is gone: nothing more is spoken or asked for
    if (typeof A.pace === 'function' && A.pace() > PACE) return false;
    if (dgOn()) return queueLine(e);
    return speak(e);
  }
  A.crew.onSaid(said);

  // ------------------------------------------------------------------ Deepgram's settings: the transport's own
  // (the ears going off, or their key gone: a transmission is given up and the microphone closed at once)
  function took(s) {
    const was = dgOn(), wasEars = earsOn();
    stat = s && typeof s === 'object' && s.ok !== false ? s : null;
    if (was && !dgOn()) stopDg();
    if (wasEars && !earsOn()) { earsStop(''); showHeard(''); earsSay(''); stopStream(); }
    paintAll();
    return stat;
  }
  function refreshStatus() {
    const T = transport();
    if (!T || typeof T.status !== 'function') { took(null); return Promise.resolve(null); }
    let p = null;
    try { p = T.status(); } catch (e) { p = null; }
    return Promise.resolve(p).then((s) => (transport() === T ? took(s) : stat), () => (transport() === T ? took(null) : stat));
  }
  function setT(patch) {
    const T = transport();
    if (!T || typeof T.set !== 'function') return Promise.resolve(null);
    let p = null;
    try { p = T.set(patch); } catch (e) { p = null; }
    return Promise.resolve(p).then((s) => {
      if (s && s.ok === false) { msg.textContent = unstop(clip(s.why || 'The setting was refused', 200)) + '.'; return refreshStatus(); }
      msg.textContent = '';
      return s && typeof s === 'object' ? took(s) : refreshStatus();
    }, () => refreshStatus());
  }
  function call(name, arg) {                               // setKey, clearKey: their answer is a status, or a fault
    const T = transport();
    if (!T || typeof T[name] !== 'function') return Promise.resolve(null);
    let p = null;
    try { p = arg === undefined ? T[name]() : T[name](arg); } catch (e) { p = null; }
    return Promise.resolve(p).then((s) => { msg.textContent = s && s.ok === false ? unstop(clip(s.why || 'Refused', 200)) + '.' : ''; return refreshStatus(); }, () => refreshStatus());
  }
  // what the player changes in the fold lifts a stand-down, and the fault said of it
  const lift = () => { down = ''; unsay(); };
  dgBox.addEventListener('change', () => { lift(); setT({ on: dgBox.checked }); });
  // the key: read once, passed once to the app, and the field cleared at once; it is never kept in the page
  function saveKey() { const v = keyIn.value; keyIn.value = ''; if (v) { lift(); call('setKey', v); } }
  keySave.addEventListener('click', saveKey);
  keyIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveKey(); } e.stopPropagation(); });
  keyForget.addEventListener('click', () => { keyIn.value = ''; lift(); call('clearKey'); });
  limC.addEventListener('change', () => { const v = Math.round(+limC.value); if (v > 0) { lift(); setT({ limits: { chars: v } }); } });
  limC.addEventListener('keydown', (e) => e.stopPropagation());   // the page's own keys stay out of the field
  tryBtn.addEventListener('click', () => {
    const T = transport();
    if (!T || typeof T.test !== 'function') return;
    tryOut.textContent = 'Asking Deepgram...';
    let p = null;
    try { p = T.test(); } catch (e) { p = null; }
    const shown = (r) => {
      if (r && r.ok === true) { lift(); tryOut.textContent = 'Deepgram answered in ' + (cnt(r.ms) / 1000).toFixed(1) + ' s: the key is taken.'; }
      else tryOut.textContent = 'No answer: ' + unstop(clip(r && r.why ? r.why : 'the call failed', 240)) + '.';
      refreshStatus();
    };
    if (p && typeof p.then === 'function') p.then(shown, () => shown(null)); else shown(p);
  });

  // ------------------------------------------------------------------ the ears: speaking to the bridge
  // the app's object, when it can hear (it has open); on, with a key kept, as the app says
  const earsT = () => { const T = transport(); return T && typeof T.open === 'function' ? T : null; };
  const earsOn = () => !!(earsT() && stat && stat.ears === true && stat.hasKey === true);
  earsBox.addEventListener('change', () => setT({ ears: earsBox.checked }));
  earsLim.addEventListener('change', () => { const v = Math.round(+earsLim.value); if (v > 0) setT({ limits: { secs: v * 60 } }); });
  earsLim.addEventListener('keydown', (e) => e.stopPropagation());   // the page's own keys stay out of the field
  // the microphone and the recorder: the browser's own, looked up when needed; a test may set others (useMedia)
  let media0 = null, stream = null, warm = null;
  const gum = () => {
    if (media0 && typeof media0.getUserMedia === 'function') return media0.getUserMedia;
    const n = window.navigator, d = n && n.mediaDevices;
    return d && typeof d.getUserMedia === 'function' ? (c) => d.getUserMedia(c) : null;
  };
  const Recorder = () => (media0 && media0.MediaRecorder) || window.MediaRecorder || null;
  const live = (s) => { try { return !!s && s.getAudioTracks().some(t => t.readyState === 'live'); } catch (e) { return false; } };
  const stopTracks = (s) => { try { for (const t of s.getTracks()) t.stop(); } catch (e) { /* ended already */ } };
  // the microphone closed: its tracks ended (the system's own sign that it is in use goes out)
  function stopStream() { if (warm) { A.cancelAfter(warm); warm = null; } const s = stream; stream = null; if (s) stopTracks(s); }
  // kept open EARS_WARM s of the page's clock after its last use, so that the next press is quick; then closed
  function cool() {
    if (warm) { A.cancelAfter(warm); warm = null; }
    if (stream && typeof A.after === 'function') warm = A.after(EARS_WARM * 1000, () => { warm = null; if (!tx) stopStream(); });
  }
  function micStream() {
    if (live(stream)) return Promise.resolve(stream);
    stopStream();
    const g = gum();
    if (!g) return Promise.reject({ name: 'NoMicrophone' });
    let p = null;
    try { p = g(MIC); } catch (e) { return Promise.reject(e); }
    return Promise.resolve(p).then((s) => { if (stream && stream !== s) stopTracks(stream); stream = s; return s; });
  }
  // why the microphone could not be had, in plain words (the browser's own error's name only)
  function micWhy(err) {
    const n = err && typeof err.name === 'string' ? err.name : '';
    if (n === 'NotAllowedError' || n === 'SecurityError') return 'The microphone was refused to this window (Windows: Settings, Privacy and security, Microphone): nothing was given.';
    if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No microphone was found: nothing was given.';
    if (n === 'NotReadableError' || n === 'AbortError') return 'The microphone could not be started (another program may hold it): nothing was given.';
    return 'The microphone could not be had: nothing was given.';
  }
  const why = (r, dflt) => (r && typeof r.why === 'string' && r.why ? unstop(clip(r.why, 220)) : dflt);

  // A transmission (tx, one at a time): { n, gen (the run's), T (the app's object it began on), id (the app's, once
  // open answers), phase: 'opening' | 'recording' | 'stopping' | 'finishing', released, cancelled, told (the app told
  // it is given up), rec, chain (the slices in their order, each sent once it is read), bound, words, sent, pieces }
  let tx = null, txN = 0, earGen = 0, earsNotes = 0, heardT = null, micShown = '';
  function showHeard(t) { heardEl.textContent = t || ''; heardEl.hidden = !t; }
  function earsSay(t) { earsNote.textContent = t || ''; earsNote.hidden = !t; if (t) earsNotes++; }
  function tellApp(it) { if (it.id === null || it.told) return; it.told = true; try { it.T.cancel(it.id); } catch (e) { /* the app's own */ } }
  // the key pressed: the app asked to open a transmission and the microphone opened, at once; the recording starts when both are there
  function hold(src) {
    if (held || tx || !earsOn() || typeof A.after !== 'function' || isGone()) return false;
    if (A.crew && typeof A.crew.enabled === 'function' && !A.crew.enabled()) return false;
    const T = earsT();
    const it = { n: ++txN, gen: earGen, T, id: null, phase: 'opening', released: false, cancelled: false, told: false, rec: null, chain: Promise.resolve(), bound: null, words: '', sent: 0, pieces: 0 };
    tx = it; held = src;
    if (warm) { A.cancelAfter(warm); warm = null; }
    earsSay(''); showHeard('');
    // the page's own bound: a release never seen (the key's going up lost, a pointer never let go) cannot hold the microphone open
    it.bound = A.after(EARS_HOLD * 1000, () => { it.bound = null; if (tx === it && !it.released) release(); });
    paintMic();
    let p = null;
    try { p = T.open({}); } catch (e) { p = null; }
    const pOpen = p && typeof p.then === 'function' ? p.then((r) => r, () => null) : Promise.resolve(p && typeof p === 'object' ? p : null);
    const pMic = micStream().then((s) => ({ s }), (err) => ({ err }));
    Promise.all([pOpen, pMic]).then(([r, m]) => started(it, r, m));
    return true;
  }
  function started(it, r, m) {
    const opened = !!(r && r.ok === true && Number.isInteger(r.id));
    if (opened) it.id = r.id;
    if (tx !== it) {                                // given up, or a new run, before it began: nothing is recorded
      if (opened) tellApp(it);
      if (m && m.s && (!earsOn() || it.gen !== earGen)) stopStream(); else if (!tx) cool();
      return;
    }
    if (!opened) { over(it, 'Nothing was given: ' + why(r, 'the app did not open a transmission') + '.'); return; }
    if (!m || !m.s) { tellApp(it); over(it, micWhy(m && m.err)); return; }
    if (it.released) { tellApp(it); over(it, 'Nothing was recorded: hold the key while you speak, and let go once you have said it.'); return; }
    const R = Recorder();
    let rec = null;
    try {
      if (typeof R !== 'function') throw new Error('no recorder');
      if (typeof R.isTypeSupported === 'function' && !R.isTypeSupported(MIME)) throw new Error('no such form');
      rec = new R(m.s, { mimeType: MIME });
    } catch (e) { tellApp(it); over(it, 'This window cannot record the microphone in the form Deepgram is sent (WebM with Opus): nothing was given.'); return; }
    it.rec = rec; it.stream = m.s; it.phase = 'recording';
    // each slice read and sent in its order; the last comes before the recorder's own stop event, and only after that
    // is the app asked to finish (the research note, C3: asked at once, the end could be lost)
    rec.addEventListener('dataavailable', (e) => {
      const b = e && e.data;
      if (!b || !b.size || tx !== it || it.cancelled) return;
      it.chain = it.chain.then(() => b.arrayBuffer()).then((buf) => { if (tx === it && !it.cancelled) sendAudio(it, buf); }, () => { /* a slice that cannot be read is not sent */ });
    });
    // (a recorder the browser stops by itself while the key is still held, its track ended: a microphone unplugged, a
    // headset lost, the system's privacy switch, gives nothing: the review of the ears found it gave the words heard so far)
    rec.addEventListener('stop', () => {
      if (tx !== it || it.cancelled) return;
      if (!it.released) { it.cancelled = true; tellApp(it); over(it, 'The microphone stopped: nothing was given.'); return; }
      it.chain.then(() => finish(it));
    });
    rec.addEventListener('error', () => { if (tx === it && !it.cancelled) { tellApp(it); over(it, 'The recording failed: nothing was given.'); } });
    try { rec.start(SLICE_MS); } catch (e) { it.rec = null; tellApp(it); over(it, 'The microphone could not be recorded: nothing was given.'); }
  }
  function sendAudio(it, buf) {
    const ab = buf instanceof ArrayBuffer ? buf : (buf && ArrayBuffer.isView(buf) ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : null);
    if (!ab || !ab.byteLength) return;
    for (let at = 0; at < ab.byteLength; at += PIECE) {
      const piece = at === 0 && ab.byteLength <= PIECE ? ab : ab.slice(at, Math.min(ab.byteLength, at + PIECE));
      try { it.T.audio(it.id, piece); } catch (e) { /* the app's own: it drops what it cannot take */ }
      it.pieces++; it.sent += piece.byteLength;
    }
  }
  // the key let go: the recorder stopped (its stop event then asks the app to finish); the men may speak again
  function release() {
    if (!held) return false;
    held = '';
    const it = tx;
    paintMic(); resumeVoices();
    if (!it || it.released) return false;
    it.released = true;
    // the microphone lost while the key was held (its track ended), and the key let go before the recorder's own stop
    // has come: nothing is given, as when the stop comes first (the second review of the ears: the words were given)
    if (it.phase === 'recording' && it.stream && !live(it.stream)) { it.cancelled = true; tellApp(it); over(it, 'The microphone stopped: nothing was given.'); return true; }
    if (it.bound) A.cancelAfter(it.bound);
    it.bound = A.after(EARS_WAIT * 1000, () => { it.bound = null; if (tx === it) { tellApp(it); over(it, 'No words came back in ' + EARS_WAIT + ' seconds: nothing was given.'); } });
    if (it.phase === 'recording') {
      it.phase = 'stopping';
      let stopping = false;
      try { it.rec.stop(); stopping = true; } catch (e) { stopping = false; }
      if (!stopping) it.chain.then(() => finish(it));
    }
    return true;
  }
  // (the app is asked to finish only once the key has been let go)
  function finish(it) {
    if (tx !== it || it.cancelled || !it.released || it.phase === 'finishing') return;
    it.phase = 'finishing';
    let p = null;
    try { p = it.T.finish(it.id); } catch (e) { p = null; }
    const back = (r) => heardBack(it, r);
    if (p && typeof p.then === 'function') p.then(back, () => back(null)); else back(p && typeof p === 'object' ? p : null);
  }
  // the words, given as a typed line is given; or nothing, and why, once. Words the app says are not final ('unsure':
  // Deepgram had not made them final; 'cut': the app ended the transmission at its bound while the key was held) are
  // shown greyed under the line with the note, and never given
  function heardBack(it, r) {
    if (tx !== it) return;
    if (r && r.ok === false && (r.kind === 'unsure' || r.kind === 'cut')) {
      const words = typeof r.words === 'string' ? clip(r.words, 300) : '';
      over(it, r.kind === 'cut' ? why(r, 'The transmission was cut off') + ': nothing was given.'
        : (words ? 'The bridge did not catch the end of that: nothing was given.' : 'The bridge did not catch that: nothing was given.'), words);
      return;
    }
    if (!r || r.ok !== true) { over(it, 'Nothing was given: ' + why(r, 'no words came back') + '.'); return; }
    const text = typeof r.text === 'string' ? r.text.replace(/\s+/g, ' ').trim() : '';
    if (!text) { over(it, 'Nothing was heard: nothing was given.'); return; }
    if (it.gen !== earGen) { over(it, ''); return; }
    const max = line && Number(line.maxLength) > 0 ? Number(line.maxLength) : 160;
    if (text.length > max) { over(it, 'What was heard is longer than the order line takes (' + max + ' characters): nothing was given. Say it in fewer words.'); return; }
    if (A.crew && typeof A.crew.enabled === 'function' && !A.crew.enabled()) { over(it, 'The order line is closed: nothing was given.'); return; }
    // Deepgram's punctuation is its guess, not the captain's word, and it can split an order the grammar reads whole:
    // its commas ("Half astern, both engines.") and its full stops and exclamation marks ("Hard. A starboard.": heard so
    // on a real key, 2026-11-24, from "Hard a-starboard." spoken in one of Deepgram's own voices). The words are tried AS
    // THEY CAME first (so two orders read whole as they came, "Stop. Full astern.", are given so); only where the order
    // line does not read them as an order, and they are no question (no "?" anywhere: a question is never tried again),
    // are they tried once more with those marks taken out (its commas, and the full stops and exclamation marks that
    // have words after them: the line's own last mark stays), and if THAT reads as an order it is what is given, and
    // shown as the captain's line (so the talk holds a line that typed gives the same order). The grammar itself is not
    // touched: the order line's own reading decides (A.crew.reads)
    let given = text;
    if (typeof A.crew.reads === 'function' && text.indexOf('?') < 0 && /,|[.!](?=\s*\S)/.test(text) && !A.crew.reads(text)) {
      const plain = text.replace(/,|[.!](?=\s*\S)/g, ' ').replace(/\s+/g, ' ').trim();
      if (A.crew.reads(plain)) given = plain;
    }
    over(it, '');
    A.crew.give(given);
  }
  // a transmission's end, whatever it was: its bound taken back, a recorder still going stopped (its slices then go
  // nowhere), the heard words cleared (or, given as shown, left greyed under the line with the note), why said once,
  // the microphone kept warm, the app's count asked again
  function over(it, said, shown) {
    if (tx !== it) return;
    tx = null;
    if (it.bound) { A.cancelAfter(it.bound); it.bound = null; }
    const rec = it.rec; it.rec = null;
    if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch (e) { /* stopped already */ } }
    if (held) { held = ''; resumeVoices(); }
    showHeard(shown || '');
    if (said) earsSay(said);
    cool();
    paintMic();
    refreshStatus();
  }
  // Escape while held: given up, and nothing given
  function cancelHeld() {
    const it = tx;
    if (!it || !held) return false;
    it.cancelled = true; tellApp(it);
    over(it, 'Given up: nothing was given.');
    return true;
  }
  // given up quietly (a new run, her foundering, the ears off, another app's object), with why if there is one
  function earsStop(said) { const it = tx; if (it) { it.cancelled = true; tellApp(it); over(it, said || ''); } held = ''; }
  // the men's lines said while the key was held: spoken now
  function resumeVoices() { const w = floorWait.splice(0); for (const e of w) speak(e); pump(); }
  // the words heard so far, from the app (onHeard): shown greyed under the line, never put into it
  function heardFromApp(id, words) {
    const it = tx;
    if (!it || it.id !== id || it.cancelled || typeof words !== 'string') return;
    it.words = clip(words, 300);
    showHeard(it.words);
  }
  // the app's object told where to send the words heard: one listener, on the object in use
  function listenTo(T) {
    if (heardT && heardT !== T && typeof heardT.onHeard === 'function') { try { heardT.onHeard(null); } catch (e) { /* gone */ } }
    heardT = T || null;
    if (T && typeof T.onHeard === 'function') { try { T.onHeard(heardFromApp); } catch (e) { /* it cannot tell */ } }
  }
  // the keys: Space held in the EMPTY order line (a space typed into words is a space), Escape to give it up; the
  // button held by a pointer (or by Space or Enter while it has the focus); letting go of the window lets go of it
  if (line) {
    line.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      const space = e.key === ' ' || e.code === 'Space';
      if (space && (held === 'key' || (line.value === '' && earsOn()))) { e.preventDefault(); if (!e.repeat && !held && !tx) hold('key'); return; }
      if (e.key === 'Escape' && held) cancelHeld();
    });
    line.addEventListener('keyup', (e) => { if ((e.key === ' ' || e.code === 'Space') && held === 'key') release(); });
    line.addEventListener('blur', () => { if (held === 'key') release(); });
  }
  mic.addEventListener('pointerdown', (e) => { if (e && typeof e.button === 'number' && e.button !== 0) return; if (e && typeof e.preventDefault === 'function') e.preventDefault(); hold('button'); });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) mic.addEventListener(t, () => { if (held === 'button') release(); });
  mic.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); if (!held && !tx) hold('button-key'); }
    else if (e.key === 'Escape' && held) cancelHeld();
  });
  mic.addEventListener('keyup', (e) => { if ((e.key === ' ' || e.key === 'Enter') && held === 'button-key') { e.preventDefault(); release(); } });
  mic.addEventListener('blur', () => { if (held === 'button-key') release(); });
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('blur', () => { if (held) release(); });
    window.addEventListener('keydown', (e) => { if (e && e.key === 'Escape' && held) cancelHeld(); });
  }
  // the button: shown while the ears are on with a key kept; pressed while held; waiting while the words come
  function paintMic() {
    const r = earsOn(), open = !A.crew || typeof A.crew.enabled !== 'function' || A.crew.enabled();
    const sig = [r, open, held, !!tx].join();
    if (sig === micShown) return;
    micShown = sig;
    mic.hidden = !r;
    mic.disabled = !r || (!open && !held) || (!!tx && !held);
    mic.textContent = held ? 'Listening...' : (tx ? 'Hearing...' : 'Hold to speak');
    mic.setAttribute('aria-pressed', String(!!held));
    mic.classList.toggle('voice-mic-on', !!held);
  }
  // the ears' part of the fold: shown where the app's object can hear
  const secsSaid = (n) => (n < 60 ? n + ' s' : (n / 60).toFixed(1) + ' min');
  function paintEars() {
    const T = earsT(), s = stat;
    for (const x of [earsLab, earsHint, earsLimRow, earsUse]) x.hidden = !T;
    paintMic();
    if (!T) { showHeard(''); earsNote.hidden = true; return; }
    earsBox.disabled = !s; earsLim.disabled = !s;
    if (!s) { earsUse.textContent = ''; return; }
    earsBox.checked = s.ears === true;
    const L = s.limits || {}, U = s.used || {}, n = cnt(U.transmissions);
    if (document.activeElement !== earsLim && cnt(L.secs)) earsLim.value = String(Math.round(cnt(L.secs) / 60));
    earsUse.textContent = 'This run of the app: ' + secsSaid(cnt(U.secs)) + ' of ' + Math.round(cnt(L.secs) / 60) + ' min heard by Deepgram, in ' + n + (n === 1 ? ' transmission.' : ' transmissions.')
      + (s.ears === true && s.hasKey !== true ? ' No key is kept: nothing can be heard.' : '');
  }

  // ------------------------------------------------------------------ the switch and its note
  function paint() {
    const s = synth(), V = voices();
    box.checked = on;
    box.disabled = !s || !Utter();
    const names = () => used().map(v => String(v.name)).join(', ');
    // Deepgram's voices on while this PC's own is off: said here, outside the fold, so that it is seen with the fold shut
    // (the review: nothing outside it showed that the lines were being sent)
    if (dgOn() && !on) {
      note.hidden = false;
      note.textContent = 'Deepgram\'s voices speak the lines (below): each line a man says is sent to Deepgram, as text. This PC\'s own voice is switched off, so a line Deepgram cannot give is not spoken.';
      return;
    }
    note.hidden = !on && !!s;
    note.textContent = !s || !Utter() ? 'This browser cannot speak.'
      : (!V.length ? 'This PC has no English voice of its own installed: nothing is spoken. (Windows: Settings, Time and language, Speech.)'
        : (on ? (dgOn() ? 'Deepgram\'s voices speak the lines (below); this PC\'s own (' + names() + ') speak only a line that Deepgram\'s cannot give, and nothing of that line is sent anywhere. Not above four times her pace.'
          : 'Spoken by this PC\'s own voice' + (used().length === 1 ? '' : 's') + ' (' + names() + '; ' + (rank(used()[0]) === 0 ? 'British English' : 'English, not British: this PC has no British voice installed')
          + '). Nothing is sent anywhere. Not above four times her pace.') : ''));
  }
  function paintDg() {
    const T = transport();
    fold.hidden = !T;
    dgNote.hidden = !T || !faultSaid;
    dgNote.textContent = T && faultSaid ? faultSaid + ' ' + (on ? 'This PC\'s own voice speaks such lines instead.' : 'Nothing is spoken instead: this PC\'s own voice is switched off.') : '';
    if (!T) return;
    const s = stat;
    // seen with the fold shut (the ears' state is added while they are on)
    foldSum.textContent = 'Deepgram\'s voices (your own key)' + (s ? (s.on === true ? (down ? ': on, standing down' : ': ON') : ': off') : '')
      + (s && s.ears === true && earsT() ? '; speaking to the bridge: ON' : '');
    for (const f of [dgBox, keyIn, keySave, keyForget, tryBtn, limC]) f.disabled = !s;
    if (!s) { useLine.textContent = 'The app does not answer.'; keyNote.textContent = ''; return; }
    if (document.activeElement !== limC && s.limits && cnt(s.limits.chars)) limC.value = String(cnt(s.limits.chars));
    dgBox.checked = s.on === true;
    keyNote.textContent = (s.hasKey ? 'A key is kept' + (s.keyKept === 'run' ? ' for this run of the app only.' : ', encrypted by the system\'s own key store on this PC.') : 'No key is kept: nothing is sent to Deepgram.')
      + ' The system keeps it from other users of this PC, not from your own programs.' + (s.canProtect === false ? ' This PC cannot protect a key: it is kept for the run only.' : '');
    const L = s.limits || {}, U = s.used || {};
    useLine.textContent = 'This run of the app: ' + count(cnt(U.chars)) + ' of ' + count(cnt(L.chars)) + ' characters sent to Deepgram, in ' + cnt(U.lines) + (cnt(U.lines) === 1 ? ' line.' : ' lines.');
  }
  function paintAll() { paint(); paintDg(); paintEars(); }
  function set(v) {
    on = v === true;
    try { window.localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* a private window: not kept */ }
    if (!on) hushFloor();                           // the floor's own: Deepgram's voices, if on, go on
    paintAll();
  }
  box.addEventListener('change', () => set(box.checked));
  // the voices come when the browser has listed them
  try { const s = synth(); if (s && typeof s.addEventListener === 'function') s.addEventListener('voiceschanged', paint); } catch (e) { /* no such event here */ }
  // a new run: the voices hushed, a transmission given up (its words, if they come, are not given to the new run) and
  // the microphone closed; her foundering: the same, and why
  A.on('reset', () => { hush(); down = ''; unsay(); earGen++; earsStop(''); stopStream(); earsSay(''); showHeard(''); goneSeen = false; refreshStatus(); });
  A.on('event', (name) => { if (name === 'foundered') { hush(); if (tx) earsStop('She has gone: nothing was given.'); showHeard(''); } });
  A.on('step', () => { if (!goneSeen && isGone()) sheIsGone(); });
  // the transport looked up on the page's frames: the app's object is there from the start; a test may set another.
  // The ears' button follows the order line (closed off a watch, or once she has gone)
  A.on('frame', () => {
    const T = transport();
    if (T !== shownFor) { if (tx && tx.T !== T) earsStop(''); shownFor = T; stat = null; down = ''; unsay(); listenTo(earsT()); refreshStatus(); }
    paintMic();
  });

  // for the tests and for exploring
  A.voice = {
    on: () => on, set,
    voices: () => voices().map(v => ({ name: String(v.name), lang: String(v.lang) })),
    voiceOf: (who) => { const v = voiceFor(who); return v ? String(v.name) : null; },
    spoken: () => log.map(x => Object.assign({}, x)), waiting: () => waiting,
    useSynth(s, U) { synth0 = s || null; Utter0 = U || null; waiting = 0; log.length = 0; paint(); },
    hush,
    // Deepgram's
    useTransport(obj) { earsStop(''); stopStream(); override = obj || null; stopDg(); shownFor = transport(); stat = null; down = ''; unsay(); listenTo(earsT()); return refreshStatus(); },
    usePlayer(p) { player0 = p || null; },
    transport, deepgram: () => dgOn(), down: () => down,
    status: () => (stat ? JSON.parse(JSON.stringify(stat)) : null),
    lines: () => dgLog.map(x => ({ n: x.n, who: x.who, words: x.words, state: x.state, end: x.end, voice: x.voice, kind: x.res ? x.res.kind : '' })),
    queue: () => dgq.map(x => ({ who: x.who, words: x.words, state: x.state })),
    playing: () => (playing ? { who: playing.who, words: playing.words } : null),
    fault: () => faultSaid, faultNotes: () => faultNotes,
    held: () => dgLog.filter(x => x.handle).length,          // the sounds' handles still held (one while a line plays, none after)
    // the ears: stand-ins for the browser's microphone and recorder ({ getUserMedia, MediaRecorder }); the key held and
    // let go as the player would, Escape; the words shown under the line; whether the key is held; the transmission in
    // hand (never its sound or words); the ears' own note and how often it has been said; whether the microphone is open
    useMedia(m) { earsStop(''); stopStream(); media0 = m && typeof m === 'object' ? m : null; },
    hold: () => hold('test'), release: () => release(), cancel: () => cancelHeld(),
    heard: () => (heardEl.hidden ? '' : heardEl.textContent), listening: () => !!held, ears: () => earsOn(),
    transmission: () => (tx ? { n: tx.n, id: tx.id, phase: tx.phase, released: tx.released, sent: tx.sent, pieces: tx.pieces } : null),
    earsNote: () => (earsNote.hidden ? '' : earsNote.textContent), earsNotes: () => earsNotes, micOpen: () => live(stream),
    gone: () => goneSeen,                                    // her end seen on a step (TitanicApp.gone), until a new run
  };
  listenTo(earsT());
  paintAll();
})();
