// The men's voices by Deepgram, the app's side: each line a man says on the bridge spoken in one of Deepgram's British
// male voices, a voice of his own (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, sections 3, 4 and 7). And the
// bridge's ears (section 5): what the player says while he holds the key, sent to Deepgram as sound and given back as
// words (below, "the ears"). The microphone itself is the page's; no sound is made or heard here. Electron's main process
// requires this file; the page reaches it only through the preload's second object, titanicVoice, whose ten calls are
// the eight handlers and two listeners below, and its one message back, 'voice:heard'.
//
//   - The player brings his own Deepgram key. It is typed once in the page, passed here, kept encrypted by the system's
//     key store in the app's settings folder, and never given back: no call returns it, nothing logs it. The store, the
//     seal ("deepgram:" and the key) and the striking of a key out of a text are app/keystore.js's, shared with the
//     crew's minds; this file keeps no copy of them.
//   - The window sends TEXT ONLY: who speaks, by his name as the bridge's talk gives it, and what he says. The voice is
//     this file's: a fixed table from the man's name to one of Deepgram's voices (VOICES), so the page can choose neither
//     an address nor a model. The address, the path, the query and the key are this process's own.
//   - ONE HOST: https://api.deepgram.com. Every request passes minds.js's guard: that one origin, by https, and no
//     redirect followed. hosts() says where this run has called.
//   - OFF BY DEFAULT, AND OFF AT EVERY START: the switch is neither read from the settings file nor written to it.
//     With the switch off, or no key, speak() and test() answer without calling anyone.
//   - THE SWITCH IS THE PLAYER'S OWN. Before it goes on, and before the run's limit is raised while it is on, this
//     process asks him in a window of the system's own (create's confirm, with consentText's words, made here); while
//     that question is open no setting moves.
//   - A LIMIT for the run, in characters (what Deepgram bills), at most two requests at once, and a bounded wait.
//   - No SDK, and nothing is read from the environment: Deepgram's SDK would read DEEPGRAM_API_KEY and
//     DEEPGRAM_ACCESS_TOKEN from it (the lane's research note on the voice, A4). It prints nothing.
//
// The request, as Deepgram's reference gives it (read 2026-11-23: https://developers.deepgram.com/reference/speak/v-2/audio/generate.md):
//   POST https://api.deepgram.com/v2/speak?model=flux-<voice>-en&encoding=linear16&container=wav&sample_rate=24000
//   with Authorization: Token <key> and Content-Type: application/json, the body {"text": "..."}; the 200 answer is the
//   audio itself. Every format field is given: the batch form's own default encoding is mp3. Its errors' bodies are a
//   string, { err_code, err_msg, request_id } or { category, message, details, request_id }. It states no limit on the
//   text: 600 characters a line here (the research note, D.2), Aura's being 2,000.
//   GET https://api.deepgram.com/v1/auth/token with the same header tries a key (Deepgram's guide to authenticating,
//   read by the research note the same day: a key refused is an error of invalid credentials).
//
// The ears' socket, as Deepgram's reference gives it (read 2026-11-23 by the lane's research note on the voice, A1):
//   wss://api.deepgram.com/v1/listen?model=nova-3&language=en&interim_results=true&punctuate=true&smart_format=false
//   &keyterm=...&mip_opt_out=true   with the key as the subprotocol pair ['token', key] (Deepgram's form for a client
//   that cannot set a header: never in the address). mip_opt_out: the player's own voice is not kept by Deepgram to
//   improve its models (listenQuery, below). No encoding and no sample_rate: the page sends WebM with Opus, a container, and
//   Deepgram reads a container's own header (the research note, A1's table, row "encoding"). The client sends binary
//   audio and, at the end, {"type":"CloseStream"}; the server answers Results (is_final false while a segment may still
//   change, true when it is final), then a Metadata, then closes. What was said is the final segments joined, and only
//   those: words still interim when the wait ends are no order (the review of the ears: an interim "full astern" of
//   "full astern then stop" was given). punctuate=true so that a spoken question comes back with its "?", which the
//   order line's grammar reads as a question, never an order; smart_format stays false, so that numbers stay words.
//   Opened with Node's own global WebSocket (the research note, B4): Electron's net.WebSocket would pass through the
//   window's session, whose rule cancels every ws and wss request.
//
// Nothing here knows Electron by name: create() is given ipcMain, safeStorage and the folder, so that
// tools/voice_app_tests.js runs it in plain Node with stand-ins and a Deepgram on this PC (tools/fake_deepgram.js).
'use strict';
const fs = require('fs'), path = require('path');
const { guard, checkBase, MindsError } = require('./minds.js');
const KS = require('./keystore.js');

const BASE = 'https://api.deepgram.com';
const LOOPBACK = { localhost: 1, '127.0.0.1': 1, '[::1]': 1 };
// what a sealed key of this file's says it is for (app/keystore.js's PURPOSES): a seal that opens to anything else is no
// key here. The same text the build before the shared key store sealed with, so that its seals still open
const PURPOSE = 'deepgram:';

// ---------------------------------------------------------------- the voices
// Flux's seven British men (Deepgram's list of Flux voices, read 2026-11-23 by the research note, A3: kit a young adult,
// colin, jack, rufus and tanner adults, sean and conor mature), one to each man of the cast, so that each keeps his own.
// No Scottish, Cornish or Ulster voice exists in any of Deepgram's lists: no accent is claimed. [appearance: the casting
// is the research note's, section D, to be judged by ear]
const CAST = Object.freeze({
  'Captain Smith': 'flux-sean-en',                 // mature, calm: the persona note's quiet, pleasant voice
  'Mr Murdoch': 'flux-conor-en',                   // mature, deep
  'Mr Boxhall': 'flux-jack-en',                    // an adult's, professional
  'Mr Moody': 'flux-kit-en',                       // the one young man's among them: he was twenty-four
  'Quartermaster Hichens': 'flux-rufus-en',
  'Mr Andrews': 'flux-colin-en',                   // warm, authoritative
  'Mr Bell': 'flux-tanner-en',
});
// The men as the order line names them (site/parts/85_crew_words.js, readback; 86_crew.js, the night's own orders), each
// given the voice of the man who held that post on the night [appearance]
const POSTS = Object.freeze({
  'The officer of the watch': CAST['Mr Murdoch'],          // Mr Murdoch had the watch from ten
  'The quartermaster': CAST['Quartermaster Hichens'],      // Hichens had the wheel from ten
  // the Fourth Officer assisted the officer of the watch (his card's words), and the telegraphs stand on the open bridge
  // beside him: an order and its answer are then two men's voices, not one
  'The officer at the telegraph': CAST['Mr Boxhall'],
  // the junior officer of the watch kept the wheelhouse and its telephones (Mr Moody's card: he answers the crow's nest's
  // telephone); the order line's junior officer speaks by telephone to the engine room and takes word to the wireless room
  'The junior officer': CAST['Mr Moody'],
  'The fourth officer': CAST['Mr Boxhall'],               // the rockets and the Morse lamp were his on the night
});
const VOICES = Object.freeze(Object.assign({}, CAST, POSTS));
// Captain Smith's voice is no line's as the talk stands: the player is the captain, and his own lines are never
// spoken. It is kept in the table for the day the captain is a man of the cast. [appearance]
const DEFAULT_VOICE = CAST['Captain Smith'];
const norm = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
const BY_NAME = new Map(Object.keys(VOICES).map(k => [norm(k), VOICES[k]]));
// A name that is not in the table has no voice here: nothing is sent for it (the review of this file: this process
// voiced any name it was given, the captain's own "You" among them, in Captain Smith's voice; only the page held the
// rule that the captain's lines and a notice are never spoken). The page then speaks such a line with the PC's own.
const voiceOf = (who) => BY_NAME.get(norm(who)) || null;

// ---------------------------------------------------------------- the limits
// who, text: characters of a name and of a line. chars: the run's limit's range, in characters sent [bet: 1,000 to
// 400,000; at Flux's list price, $0.045 a thousand on 2026-11-23, 400,000 is about $18]. wavMax: the largest answer
// taken, 8 MiB [bet]: at 24 kHz, 16 bits, one channel (48,000 bytes a second) that is about 175 s of speech, where 600
// characters take about 40 s at Deepgram's own pace and 80 at its slowest. errMax: what is read of an error's body.
// The ears': audio, the most bytes one call of the window's may carry (64 kB, as the brief has it: a slice of 100 ms of
// WebM with Opus is some kilobytes); queue, the most bytes kept while the socket is opening (1 MB); sound, the most
// bytes one transmission takes in all, 2 MB [bet: 30 s at Opus's highest rate is 1.9 MB; at the recorder's usual rate
// some 0.5 MB]; heard, the most characters of words given back; message, the longest message of Deepgram's that is read;
// secs, the run's limit's range in seconds heard [bet: 1 minute to 4 hours; at Deepgram's list price with key terms,
// $0.0061 a minute on 2026-11-23, 4 hours is about $1.50].
const LIMITS = Object.freeze({ who: 60, text: 600, keyMin: 8, keyMax: 512, atOnce: 2, wavMax: 8 * 1048576, errMax: 65536,
  timeoutMs: [1000, 60000], chars: [1000, 400000],
  audio: 65536, queue: 1048576, sound: 2 * 1048576, heard: 1000, message: 65536, secs: [60, 14400] });
// timeoutMs: how long one line's voice is awaited, 15 s [bet: Deepgram's latency page gives 0.6 to 0.9 s for Aura-2 by
// REST; nothing is published for Flux's batch form, and nothing has been timed on a real key]. chars: 40,000 a run of
// the app [bet: a night's talk is some thousands of characters; a new run of the app starts the count again]. secs:
// 1,800 (30 minutes) heard a run [the design note, section 6: 100 transmissions of 3 s is 5 minutes]. ears: off, and
// off at every start, as on is
const DEFAULTS = Object.freeze({ v: 1, on: false, ears: false, timeoutMs: 15000, limits: Object.freeze({ chars: 40000, secs: 1800 }) });
// the window's calls: NAMES are asked and answered (ipcMain.handle), SENDS are sent and not answered (ipcMain.on)
const NAMES = Object.freeze(['status', 'set', 'setKey', 'clearKey', 'test', 'speak', 'open', 'finish']);
const SENDS = Object.freeze(['audio', 'cancel']);
// The bounds of one transmission of the ears, in ms: 3 s for the socket to open [the two earlier apps' own, the research
// note, C1 and C2]; 3.5 s for the last words once the key is let go [the same, and the brief]; 30 s for a transmission
// in all, past which this process finishes it itself [the brief]; and 10 s for words of a transmission that ended by
// itself to be asked for by the page's finish, past which they are let go [bet: the page's own bound is 35 s from the
// press, five past this one's]. A test may give shorter ones (create's bounds), never longer.
const BOUNDS = Object.freeze({ openMs: 3000, finishMs: 3500, maxMs: 30000, keepMs: 10000 });
// Key terms (Nova-3's keyterm prompting; the research note, A1: 20 to 50 advised, 500 tokens at most in all): the order
// line's words that are not everyday English, and the men's names (site/parts/85_crew_words.js, VOCAB and ADDRESS). A
// fixed list: the page names none.
const KEYTERMS = Object.freeze([
  'hard a-starboard', 'hard a-port', 'midships', 'amidships', 'astern', 'stokehold', 'forepeak', 'bulkhead', 'reciprocating',
  'watertight doors', 'sound the wells', 'CQD', 'Morse lamp', 'quartermaster',
  'Murdoch', 'Boxhall', 'Moody', 'Hichens', 'Andrews', 'Mr Bell', 'Lightoller', 'Pitman', 'Wilde', 'Olliver',
]);
// a subprotocol must be a token of RFC 6455 (RFC 2616's token): a key with any other character cannot be offered as one,
// and Node's WebSocket would refuse it with an error of its own. It is checked first, and nothing of that error repeated
const TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const CLOSE_STREAM = JSON.stringify({ type: 'CloseStream' });

// an answer that is not a voice: kind says which, why in plain words for the page's note
class VoiceError extends Error { constructor(kind, why) { super(why); this.kind = kind; } }
const fail = (kind, why) => ({ ok: false, kind, why });
const WHY = Object.freeze({
  off: 'Deepgram\'s voices are switched off.',
  'no-key': 'No Deepgram key is kept.',
  budget: 'This run\'s limit of characters for Deepgram is spent.',
  busy: 'Two lines are awaited from Deepgram already.',
  declined: 'You did not confirm it: nothing was changed.',
  moved: 'The settings changed while you were asked: nothing was changed.',
  asking: 'An earlier change is waiting for your answer.',
  unsaved: 'The key is forgotten for this run, but the settings file could not be written: it may still be kept there.',
  unsavedRun: 'The key is kept for this run only, but the settings file could not be written: a key kept before may still be kept there.',
  earsOff: 'Speaking to the bridge is switched off.',
  earsBudget: 'This run\'s limit of minutes heard by Deepgram is spent.',
  earsBusy: 'A transmission is open already: one at a time.',
  two: 'One question at a time: switch on, or raise the limit of, the voices or speaking to the bridge, not both at once.',
});

// ---------------------------------------------------------------- the player's own word
// The words of the question this process asks the player before the switch goes on, or the run's limit is raised while
// it is on. Made here and shown by the main process in the system's own message box: the page words none of it.
// w: { kind: 'on' | 'limits' | 'ears' | 'ears-limits', origin, limits: { chars, secs }, was: { chars, secs } }
const count = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');   // thousands, the same in every runtime
// seconds as the player reads a limit: whole minutes, else to a tenth
const minutes = (secs) => { const m = secs / 60, s = Number.isInteger(m) ? String(m) : m.toFixed(1); return s + (s === '1' ? ' minute' : ' minutes'); };
function consentText(w) {
  // the ears: what the player says, as sound, while he holds the key (and only then)
  if (w.kind === 'ears') {
    return { title: 'Speaking to the bridge', no: 'Cancel', message: 'Switch on speaking to the bridge?', yes: 'Switch on',
      detail: 'While it is on, what you say while you hold the key (Space in the empty order line, or the button beside it) is sent to Deepgram at ' + w.origin + ', as sound, to be turned into words. '
        + 'Nothing is sent while you do not hold it. The app asks Deepgram to leave what you say out of its programme for improving its models. It sends Deepgram nothing else for it, and for it calls nobody else. Deepgram bills your key per minute heard: this run may send up to ' + minutes(w.limits.secs) + ' of what you say.' };
  }
  if (w.kind === 'ears-limits') {
    return { title: 'Speaking to the bridge', no: 'Cancel', message: 'Raise this run\'s limit for speaking to the bridge?', yes: 'Raise',
      detail: 'Speaking to the bridge is on, at ' + w.origin + '. This run could then send Deepgram up to ' + minutes(w.limits.secs) + ' of what you say (now ' + minutes(w.was.secs) + '). '
        + 'Deepgram bills your key per minute heard.' };
  }
  const t = { title: 'The men\'s voices', no: 'Cancel' };
  if (w.kind === 'on') return Object.assign(t, { message: 'Switch on Deepgram\'s voices?', yes: 'Switch on',
    detail: 'While they are on, the app sends each line a man says, as text, to Deepgram at ' + w.origin + ', which speaks it in one of its voices. '
      + 'It sends Deepgram nothing else, and for the voices it calls nobody else. Deepgram bills your key per character: this run may send up to ' + count(w.limits.chars) + ' characters.' });
  return Object.assign(t, { message: 'Raise this run\'s limit?', yes: 'Raise',
    detail: 'Deepgram\'s voices are on, at ' + w.origin + '. This run could then send up to ' + count(w.limits.chars) + ' characters (now ' + count(w.was.chars) + '). '
      + 'Deepgram bills your key per character.' });
}

// ---------------------------------------------------------------- Deepgram's answers
// Deepgram's own words from an error's body (one of its three shapes), or nothing
function messageOf(text) {
  const s = String(text || '');
  try {
    const j = JSON.parse(s);
    if (typeof j === 'string') return j;
    const m = j && (j.err_msg || j.message || (j.error && (j.error.message || j.error)));
    return typeof m === 'string' ? m : '';
  } catch (e) { return s.length <= 300 && !/[<>]/.test(s) ? s : ''; }
}
// The key struck out of a text wherever it stands, WHOLE OR IN PART (any run of eight or more of its characters), in
// time with the text's length: app/keystore.js's strike, the one striking of the app (this file's own copy, which
// rebuilt the text at every match, is gone). Every text that can reach the page or an error is struck BEFORE it is cut.
const strike = KS.strike;
// Deepgram's words, short, on one line: the key is struck out FIRST, and only then is the text cut
function clean(text, key) {
  const s = strike(String(text === undefined || text === null ? '' : text).replace(/\s+/g, ' ').trim(), key);
  return s.length > 240 ? s.slice(0, 237) + '...' : s;
}
function failure(status, text, key) {
  const said = clean(messageOf(text), key);
  if (status === 401 || status === 403) return new VoiceError('auth', 'Deepgram refused the key (' + status + ').');
  if (status === 402) return new VoiceError('rate', 'Deepgram asks for payment (402): the account\'s credit may be spent.');
  if (status === 429) return new VoiceError('rate', 'Deepgram says too many requests, or the account\'s limit is reached (429).');
  if (status === 404) return new VoiceError('shape', 'Deepgram knows no such voice or address (404).');
  if (status === 400 || status === 413 || status === 422) return new VoiceError('shape', 'Deepgram refused the request (' + status + ')' + (said ? ': ' + said : '.'));
  return new VoiceError('server', 'Deepgram answered with an error (' + status + ').');
}
// WAV by any of its registered names; and an answer that says it is text or JSON, which is not audio whatever it holds
const WAV_TYPE = /^\s*audio\/(wav|wave|x-wav|vnd\.wave)\s*(;|$)/i;
const TEXT_TYPE = /^\s*(application\/(json|xml|problem\+json)|text\/)/i;
const isWav = (b) => !!b && b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WAVE';
const drop = async (res) => { try { if (res && res.body && typeof res.body.cancel === 'function') await res.body.cancel(); } catch (e) { /* gone already */ } };
// an answer's body, read no further than max bytes: { bytes } or { over: true } (a stated length past max is not read)
async function readBytes(res, max) {
  const len = Number(res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-length') : NaN);
  if (Number.isFinite(len) && len > max) { await drop(res); return { bytes: null, over: true }; }
  if (!res.body || typeof res.body.getReader !== 'function') {
    const b = typeof res.arrayBuffer === 'function' ? Buffer.from(await res.arrayBuffer()) : Buffer.from(typeof res.text === 'function' ? String(await res.text()) : '', 'utf8');
    return b.length > max ? { bytes: null, over: true } : { bytes: b, over: false };
  }
  const r = res.body.getReader(), parts = [];
  let n = 0;
  for (;;) {
    const { done, value } = await r.read();
    if (done) break;
    n += value.byteLength;
    if (n > max) { try { await r.cancel(); } catch (e) { /* gone already */ } return { bytes: null, over: true }; }
    parts.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
  }
  return { bytes: Buffer.concat(parts, n), over: false };
}

// the stand-in for Deepgram's address, for the tests only (create's base): a server on this PC, its origin alone (the
// paths are this file's own)
function standIn(s) {
  let u;
  try { u = new URL(checkBase(s)); } catch (e) { throw new VoiceError('shape', 'The stand-in for Deepgram must be an address on this PC.'); }
  if (!LOOPBACK[u.hostname]) throw new VoiceError('shape', 'The stand-in for Deepgram must be on this PC.');
  if (u.pathname !== '/' && u.pathname !== '') throw new VoiceError('shape', 'The stand-in for Deepgram is an origin, with no path.');
  return u.origin;
}

// ---------------------------------------------------------------- the ears' helpers
// A socket, held to one origin as minds.js's guard holds a fetch: wss (ws only to a stand-in on this PC), with no name
// or password, at that origin and no other; refused before it is opened otherwise. seen records where this run called.
function socketGuard(wsOrigin, seen) {
  return function guardedSocket(url) {
    let u;
    try { u = new URL(String(url)); } catch (e) { throw new VoiceError('guard', 'A socket with no address was refused.'); }
    if (u.username || u.password) throw new VoiceError('guard', 'A socket whose address carries a name or a password was refused.');
    if (u.origin !== wsOrigin) throw new VoiceError('guard', 'A socket to another host than the one set was refused.');
    if (u.protocol === 'ws:' ? !LOOPBACK[u.hostname] : u.protocol !== 'wss:') throw new VoiceError('guard', 'A socket not by wss was refused.');
    if (seen) { seen.push(u.origin); if (seen.length > 200) seen.shift(); }
    return u.href;
  };
}
// The microphone, for the app's own page and audio alone, and only while the ears are on: the one rule that main.js's
// two permission handlers (the request's and the check's) both apply (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md,
// section 5; the coordinator's condition 1). permission: the permission asked for ('media' covers the camera, the
// microphone and the speakers); own: the asker is this window's own page; origins: every address the request gives for
// where it comes from (an absent one is passed over; at least one must be given, and each given must be the app's own
// origin); types: the media asked for (a request's mediaTypes, a check's [mediaType]), exactly ['audio']; appOrigin:
// 'titanic://app/'; earsOn: the ears' switch as it stands when the handler is asked (create's earsOn()). With the ears
// off the microphone is refused, whatever the page's policy header allows.
function microphoneAllowed(permission, own, origins, types, appOrigin, earsOn) {
  if (permission !== 'media' || own !== true || earsOn !== true || typeof appOrigin !== 'string' || !/\/$/.test(appOrigin)) return false;
  if (!Array.isArray(types) || types.length !== 1 || types[0] !== 'audio') return false;
  const given = Array.isArray(origins) ? origins.filter(x => x !== undefined && x !== null && x !== '') : [];
  if (!given.length) return false;
  return given.every(x => typeof x === 'string' && (x === appOrigin.slice(0, -1) || x.startsWith(appOrigin)));
}
// what the window sent as sound: the bytes of an ArrayBuffer (from any realm) or of a view on one; null for anything else
function bytesOf(x) {
  if (x instanceof ArrayBuffer || Object.prototype.toString.call(x) === '[object ArrayBuffer]') return Buffer.from(x);
  if (ArrayBuffer.isView(x)) return Buffer.from(x.buffer, x.byteOffset, x.byteLength);
  return null;
}
// a test's bounds, each at most the default; anything else is the default
function boundsOf(b) {
  const out = Object.assign({}, BOUNDS);
  if (b && typeof b === 'object') for (const k of Object.keys(BOUNDS)) if (Number.isInteger(b[k]) && b[k] > 0 && b[k] < BOUNDS[k]) out[k] = b[k];
  return out;
}
// the query of the ears' socket: the brief's, with every key term (URLSearchParams writes a space as +, which Deepgram's
// page on key terms allows), and mip_opt_out=true: what the player says is opted out of Deepgram's Model Improvement
// Program (the owner's word, 2026-11-23; the research note, A1's table: Deepgram warns it may cost more). The men's
// lines (POST /v2/speak) carry no such field: they are the app's own words, not the player's voice. punctuate=true: a
// question comes back with its "?" (with punctuate=false "Fire the rockets?" came back as the order "fire the rockets":
// the review of the ears); smart_format=false: numbers stay words, as the grammar reads them
function listenQuery() {
  const q = new URLSearchParams({ model: 'nova-3', language: 'en', interim_results: 'true', punctuate: 'true', smart_format: 'false' });
  for (const k of KEYTERMS) q.append('keyterm', k);
  q.append('mip_opt_out', 'true');
  return q.toString();
}

// ---------------------------------------------------------------- the settings, the key, the window's calls
// o: { ipcMain, safeStorage, dir, isOwn(event), confirm(question), fetch, base, send(channel, ...args), WebSocket, now, bounds }.
//   dir: the app's settings folder (voice.json lives there). isOwn: is this call from the app's own page.
//   confirm: asks the player a question (consentText's words) and answers true or false; the window's "set" passes by
//   it (attach, below). With none given nothing is asked: plain Node, where there is no window either.
//   fetch: the fetch to call out with (default: this process's own, Node's, which does not pass through the window's
//   session). base: for the tests only, a stand-in for Deepgram on this PC (anything else is refused: create throws).
//   send: the ears' one message back, 'voice:heard' (id, the words heard so far), to the app's own window only (main.js
//   gives it; with none, nothing is sent). WebSocket: the socket to open (default: this process's own, Node's global
//   WebSocket, looked up at each transmission); a test gives one it can watch. now: the clock that counts the seconds
//   heard (default Date.now); a test may give one that jumps. bounds: a test's shorter bounds of a transmission (BOUNDS).
// Answers { attach, hosts, ready, status, set, setKey, clearKey, test, speak, usage, open, audio, finish, cancel, pageGone,
// earsOn, listening, armed }; ready is a Promise that settles once the key kept from an earlier run has been read (the
// window's calls wait for it).
function create(o) {
  o = o || {};
  const safe = o.safeStorage || null, file = o.dir ? path.join(o.dir, 'voice.json') : null, fetchImpl = o.fetch || globalThis.fetch;
  const origin = o.base ? standIn(o.base) : BASE;
  // key: the key sealed, base64. ears: the ears' own switch, as on is the voices'
  const S = { v: 1, on: DEFAULTS.on, ears: DEFAULTS.ears, timeoutMs: DEFAULTS.timeoutMs, limits: { chars: DEFAULTS.limits.chars, secs: DEFAULTS.limits.secs }, key: null };
  // The key, once read, is kept in memory for the run: the system's store opens it asynchronously, and a line must not
  // wait on that each time. volatile: a key kept for the run only (a PC that cannot protect one), never written.
  let plain = null, volatile = null;
  let protect = 'none';                             // the store that protects a key here: 'async', 'sync' or 'none' (found when ready)
  const used = { chars: 0, lines: 0 }, seen = [];
  const guarded = guard(origin, fetchImpl, seen);
  let atOnce = 0;
  // the ears: the socket's origin (https -> wss; http, a stand-in on this PC only, -> ws), its guard, the clock that
  // counts the seconds heard, the bounds, the one transmission open (cur), and the run's count
  const wsOrigin = origin.replace(/^http/, 'ws'), socket = socketGuard(wsOrigin, seen);
  const nowOf = typeof o.now === 'function' ? o.now : Date.now, B = boundsOf(o.bounds);
  const sendPage = typeof o.send === 'function' ? o.send : null;
  let cur = null, ids = 0, heardMs = 0, talks = 0, armed = 0;

  // what the file holds, each field checked as if it were typed (a file edited by hand is not trusted either).
  // THE SWITCHES ARE NOT AMONG THEM: every run of the app starts with Deepgram's voices off, and its ears off, whatever
  // the file says, as the crew's minds do (the design note, section 3). The question the player answers says "this run
  // may send ...": a run must not begin sending because an earlier one was allowed to, nor because a file says so.
  // Each of the two limits is read on its own: one refused keeps its default, and the other is still read.
  function load() {
    if (!file) return;
    let j = null;
    try { j = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return; }
    if (!j || typeof j !== 'object' || j.v !== 1) return;
    if (j.timeoutMs !== undefined) { try { apply({ timeoutMs: j.timeoutMs }); } catch (e) { /* that field keeps its default */ } }
    if (j.limits && typeof j.limits === 'object' && !Array.isArray(j.limits)) {
      for (const x of ['chars', 'secs']) { if (j.limits[x] === undefined) continue; try { apply({ limits: { [x]: j.limits[x] } }); } catch (e) { /* that limit keeps its default */ } }
    }
    if (typeof j.key === 'string' && /^[A-Za-z0-9+/=]{8,4096}$/.test(j.key)) S.key = j.key;
  }
  function save() {
    if (!file) return;
    // the switches are the run's, never the file's: the voices' is written off, the ears' not at all
    const out = { v: 1, on: false, timeoutMs: S.timeoutMs, limits: { chars: S.limits.chars, secs: S.limits.secs } };
    if (S.key) out.key = S.key;
    const tmp = file + '.tmp';
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(out, null, 1) + '\n');
    fs.renameSync(tmp, file);
  }
  // one field of a patch, checked; throws VoiceError('shape') on anything else (the key is set by setKey alone). A field
  // is checked whole before it is taken: limits with one good and one bad figure changes neither
  function apply(patch) {
    for (const k of Object.keys(patch)) {
      const v = patch[k];
      if (k === 'on') { if (typeof v !== 'boolean') throw new VoiceError('shape', 'The switch is on or off.'); S.on = v; }
      else if (k === 'ears') { if (typeof v !== 'boolean') throw new VoiceError('shape', 'The switch is on or off.'); S.ears = v; }
      else if (k === 'timeoutMs') { if (!Number.isInteger(v) || v < LIMITS.timeoutMs[0] || v > LIMITS.timeoutMs[1]) throw new VoiceError('shape', 'The wait is 1 to 60 seconds.'); S.timeoutMs = v; }
      else if (k === 'limits') {
        if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(x => x !== 'chars' && x !== 'secs')) throw new VoiceError('shape', 'The limits are in characters and in seconds.');
        if (v.chars !== undefined && (!Number.isInteger(v.chars) || v.chars < LIMITS.chars[0] || v.chars > LIMITS.chars[1])) throw new VoiceError('shape', 'The limit is ' + count(LIMITS.chars[0]) + ' to ' + count(LIMITS.chars[1]) + ' characters.');
        if (v.secs !== undefined && (!Number.isInteger(v.secs) || v.secs < LIMITS.secs[0] || v.secs > LIMITS.secs[1])) throw new VoiceError('shape', 'The limit heard is ' + minutes(LIMITS.secs[0]) + ' to ' + minutes(LIMITS.secs[1]) + ' a run.');
        if (v.chars !== undefined) S.limits.chars = v.chars;
        if (v.secs !== undefined) S.limits.secs = v.secs;
      } else throw new VoiceError('shape', 'No such setting: ' + String(k).slice(0, 40) + '.');
    }
  }
  const restore = (before) => { const b = JSON.parse(before); S.on = b.on; S.ears = b.ears; S.timeoutMs = b.timeoutMs; S.limits = b.limits; S.key = b.key; };

  // ---------------------------------------------------------------- the system's key store
  // app/keystore.js (KS.create(safe)): Electron's safeStorage by its asynchronous calls, the synchronous ones only where
  // those are absent or say they cannot protect (the key store's own review: a store that answers "not yet" as the app
  // starts must not lose every kept key for the run), and 'none' where neither protects: a key is then kept for the run
  // only, never written (setKey, below). What is sealed says what it is for, PURPOSE and the key: a seal that opens to
  // another purpose is no key here (a key sealed for the crew's minds, copied into voice.json by hand, is never sent to
  // Deepgram), and no seal without a purpose is taken (this file never wrote one). A seal the store asks to have made
  // again (its own key rotated) is made again on opening, and kept.
  const store = KS.create(safe);
  const keyNow = () => volatile || plain || null;
  // Each word about the key (kept, forgotten) is numbered: sealing and opening take time, and what was said last must
  // stand (the review: Save, then Forget at once, kept the key; so did a Forget while an earlier key was being opened)
  let keyGen = 0;

  // ---------------------------------------------------------------- the calls of the voices, and the settings
  // used.secs: the seconds heard this run (an open transmission's so far included), rounded up; transmissions: those
  // whose socket opened
  function status() {
    const key = keyNow();
    return { ok: true, available: true, on: S.on, provider: 'Deepgram', origin, hasKey: !!key, keyKept: !key ? null : (volatile ? 'run' : 'disk'),
      canProtect: protect !== 'none', store: protect, timeoutMs: S.timeoutMs, limits: { chars: S.limits.chars, secs: S.limits.secs },
      used: { chars: used.chars, lines: used.lines, secs: Math.ceil(heardNow() / 1000), transmissions: talks },
      ears: S.ears, earsOrigin: wsOrigin, listening: !!cur, hosts: Array.from(new Set(seen)) };
  }
  function set(patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return fail('shape', 'The settings are not an object.');
    const before = JSON.stringify(S);
    try { apply(patch); } catch (e) { restore(before); return fail('shape', e instanceof VoiceError ? e.message : 'The settings were refused.'); }
    // the ears off: a transmission open is closed at once, BEFORE the settings are written (the review of the ears: a
    // settings file that could not be written left the switch off and the transmission open, still sending)
    if (!S.ears && cur) giveUp(cur, fail('off', WHY.earsOff));
    save();
    return status();
  }
  async function setKey(key) {
    if (typeof key !== 'string') return fail('shape', 'The key is not text.');
    key = key.trim();
    if (key.length < LIMITS.keyMin || key.length > LIMITS.keyMax || !/^[\x21-\x7e]+$/.test(key)) return fail('shape', 'That does not look like a key.');
    const g = ++keyGen;                             // its number is taken AT ONCE, before anything is waited for: a Forget that comes after it is the later word
    await ready;
    protect = await store.kind();                   // asked again: a store can come to be after the start
    const enc = await store.seal(PURPOSE, key);     // the seal (base64), or null where no store protects a key (or it would not seal)
    if (g !== keyGen) return status();              // forgotten, or another key given, while this one was sealed: the later word stands
    if (enc) { S.key = enc; plain = key; volatile = null; save(); return status(); }
    // this PC cannot protect a key (or the store said it could and then would not seal: it is then said so, as the
    // crew's minds say it, app/minds.js): kept for the run only, never written; a key kept on disk before it goes
    protect = 'none';
    S.key = null; plain = null; volatile = key;
    return unsaved(WHY.unsavedRun) || status();
  }
  // (the key forgotten: a transmission open is closed at once, as when the ears go off, and before anything is written)
  function clearKey() { keyGen++; S.key = null; plain = null; volatile = null; if (cur) giveUp(cur, fail('no-key', WHY['no-key'])); return unsaved(WHY.unsaved) || status(); }
  // A key's going written to the settings: where the file cannot be written, the answer says so plainly, since the seal
  // stays in the file and the next run would have that key again (the second review of the ears)
  function unsaved(why) { try { save(); return null; } catch (e) { return fail('unsaved', why); } }
  function usage() {
    return { ok: true, used: { chars: used.chars, lines: used.lines, secs: Math.ceil(heardNow() / 1000), transmissions: talks }, limits: { chars: S.limits.chars, secs: S.limits.secs } };
  }

  // what a failed call says: the timeout, its own kind, a redirect refused, or no answer at all
  function caught(e, stop, key) {
    if (stop.signal.aborted) return fail('timeout', 'No answer came from Deepgram in ' + Math.round(S.timeoutMs / 1000) + ' seconds.');
    if (e instanceof VoiceError || e instanceof MindsError) return fail(e.kind, clean(e.message, key));
    if (e && e.cause && /redirect/i.test(String(e.cause.message || e.cause))) return fail('guard', 'Deepgram answered with a redirect, which is not followed: the app calls one host only.');
    return fail('network', 'Deepgram could not be reached.');
  }
  // one line a man says, in his voice: { ok: true, wav (an ArrayBuffer: the WAV's bytes), voice, ms, chars }, or a fault.
  // Its characters count against the run's limit as the request is made: Deepgram may bill a line whose answer is lost.
  async function speak(req) {
    await ready;
    if (!req || typeof req !== 'object' || Array.isArray(req)) return fail('shape', 'The request is not an object.');
    if (Object.keys(req).some(k => k !== 'who' && k !== 'text')) return fail('shape', 'The request holds more than who speaks and what he says.');
    const { who, text } = req;
    if (typeof who !== 'string' || !who.trim() || who.length > LIMITS.who || /[\x00-\x1f\x7f]/.test(who)) return fail('shape', 'Who speaks is not a name.');
    if (typeof text !== 'string' || text.length < 1 || text.length > LIMITS.text || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) return fail('shape', 'The line is empty, not text, or too long.');
    const words = text.replace(/\s+/g, ' ').trim();
    if (!words) return fail('shape', 'The line is empty.');
    const voice = voiceOf(who);
    if (!voice) return fail('shape', 'No man of that name speaks on the bridge: nothing is sent for it.');
    if (!S.on) return fail('off', WHY.off);
    const key = keyNow();
    if (!key) return fail('no-key', WHY['no-key']);
    if (used.chars + words.length > S.limits.chars) return fail('budget', WHY.budget);
    if (atOnce >= LIMITS.atOnce) return fail('busy', WHY.busy);
    atOnce++; used.chars += words.length; used.lines++;
    // Counted as the request is made: Deepgram may bill a line whose answer is lost on the way. Given back only where it
    // surely was not spoken: Deepgram refused the request (an error's status), or this process refused to make it
    let spent = true;
    const t0 = Date.now(), stop = new AbortController(), timer = setTimeout(() => stop.abort(), S.timeoutMs);
    try {
      const query = new URLSearchParams({ model: voice, encoding: 'linear16', container: 'wav', sample_rate: '24000' }).toString();
      const res = await guarded(origin + '/v2/speak?' + query, { method: 'POST', headers: { Authorization: 'Token ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: words }), signal: stop.signal });
      if (!res.ok) { spent = false; const got = await readBytes(res, LIMITS.errMax); throw failure(res.status, got.bytes ? got.bytes.toString('utf8') : '', key); }
      // The bytes decide what it is. Deepgram's reference says only that the answer is "the synthesized audio ... as a
      // binary stream" and names no content type for it (read 2026-11-23): a WAV under another name (or none) is still
      // the WAV that was asked for, and must not make every line fail. An answer that says it is text is not read.
      // The type itself is never repeated to the page (it is the server's text: the review found the key could ride in it).
      const type = String((res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-type') : '') || '');
      if (TEXT_TYPE.test(type)) { await drop(res); throw new VoiceError('server', 'Deepgram\'s answer was not a WAV file (it says it is text).'); }
      const got = await readBytes(res, LIMITS.wavMax);
      if (got.over) throw new VoiceError('server', 'Deepgram\'s answer was larger than ' + (LIMITS.wavMax / 1048576) + ' MB: it was not taken.');
      if (!isWav(got.bytes)) throw new VoiceError('server', 'Deepgram\'s answer was not a WAV file ' + (WAV_TYPE.test(type) ? '(though it said so)' : (type ? '(under another name)' : '(with no type named)')) + '.');
      const b = got.bytes;
      return { ok: true, wav: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), voice, ms: Date.now() - t0, chars: words.length };
    } catch (e) {
      if (e instanceof MindsError && e.kind === 'guard') spent = false;
      return caught(e, stop, key);
    } finally { clearTimeout(timer); atOnce--; if (!spent) { used.chars -= words.length; used.lines--; } }
  }
  // "Try it": the key tried with Deepgram (GET /v1/auth/token), under the same switch, guard and wait as a line; it
  // speaks nothing and counts no character. Nothing of the answer's body is kept or passed on.
  async function test() {
    await ready;
    if (!S.on) return fail('off', WHY.off);
    const key = keyNow();
    if (!key) return fail('no-key', WHY['no-key']);
    if (atOnce >= LIMITS.atOnce) return fail('busy', WHY.busy);
    atOnce++;
    const t0 = Date.now(), stop = new AbortController(), timer = setTimeout(() => stop.abort(), S.timeoutMs);
    try {
      const res = await guarded(origin + '/v1/auth/token', { method: 'GET', headers: { Authorization: 'Token ' + key }, signal: stop.signal });
      const got = await readBytes(res, LIMITS.errMax);
      if (!res.ok) throw failure(res.status, got.bytes ? got.bytes.toString('utf8') : '', key);
      return { ok: true, ms: Date.now() - t0 };
    } catch (e) { return caught(e, stop, key); } finally { clearTimeout(timer); atOnce--; }
  }

  // ---------------------------------------------------------------- the ears: one transmission, one socket
  // A transmission (cur, one at a time): opened by the window's open() when the player presses the key, its socket opened
  // at once (the window's sound queued meanwhile), fed by audio(), finished by finish() when he lets go, or by this
  // process at its bound; given up by cancel(), by the ears going off, by the key forgotten, or by the page going away.
  // T: { id, key, ws, state: 'opening' | 'open' | 'finishing' | 'done', t0 (open(), Date.now), opened (the socket's
  //   opening, on the clock that counts; null until then), counted, budgetAt (Date.now when the run's limit is reached),
  //   finishAt (the key let go), closeAt (the CloseStream sent: the wait for the last words counts from it), doneAt,
  //   queue (the sound before the socket opened), queued, taken (the bytes taken in all), finals, interim, told (the
  //   words last sent to the page), said (Deepgram's own words of a fault, struck and cut), result, waiters (the page's
  //   finish, awaiting), timer (the one timer armed: the next bound) }
  // Nothing of it is written or logged: the words go to the page alone, and the sound to Deepgram alone.
  const heardNow = () => heardMs + (cur && cur.opened !== null && !cur.counted ? Math.max(0, nowOf() - cur.opened) : 0);
  const wordsOf = (t) => String(t).replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim();
  // the words heard so far (the final segments joined and the last interim), and the final words alone; the key struck
  // out FIRST, then cut
  const joined = (parts, key) => strike(wordsOf(parts.join(' ')), key).slice(0, LIMITS.heard).trim();
  function heardOf(T) { return joined(T.finals.concat([T.interim]), T.key); }
  // What finish answers. FINAL WORDS ONLY (the review of the ears: an interim became an order): ok with the final
  // segments once Deepgram has ended the stream (its Metadata, or a close 1000 after the CloseStream) with no interim
  // left standing. Otherwise a fault that carries the words heard so far, marked not final, for the page to show and
  // give nothing: 'unsure' (the wait ended, or the stream ended, with words not made final) or 'cut' (this process
  // ended the transmission itself while the key was still held: its 30 s, or the run's limit)
  function answerOf(T) { return T.interim ? unsure(T) : { ok: true, text: joined(T.finals, T.key) }; }
  const unsure = (T) => ({ ok: false, kind: 'unsure', why: 'Deepgram had not made the words final when the wait for them ended.', words: heardOf(T), final: false });
  const cut = (T, why) => ({ ok: false, kind: 'cut', why, words: heardOf(T), final: false });
  // the one timer of a transmission, armed for its next bound: the socket's opening (3 s from open), the whole (30 s from
  // open, or the run's limit: the last words are awaited inside it too), the last words (3.5 s from the CloseStream
  // itself, which goes once the socket is open and the sound queued before it has gone), or the words kept for the
  // page (10 s from the end)
  function arm(T) {
    disarm(T);
    let at = Infinity, what = '';
    const near = (t, w) => { if (t < at) { at = t; what = w; } };
    if (T.state === 'done') near(T.doneAt + B.keepMs, 'keep');
    else {
      if (T.opened === null) near(T.t0 + B.openMs, 'open');
      near(Math.min(T.t0 + B.maxMs, T.budgetAt), 'max');
      if (T.state === 'finishing' && T.closeAt !== null) near(T.closeAt + B.finishMs, 'finish');
    }
    if (at === Infinity) return;
    armed++;
    T.timer = setTimeout(() => { T.timer = null; armed--; due(T, what); }, Math.max(0, at - Date.now()));
  }
  function disarm(T) { if (T.timer) { clearTimeout(T.timer); T.timer = null; armed--; } }
  function due(T, what) {
    if (T !== cur) return;
    if (what === 'open') settle(T, fail('timeout', 'Deepgram did not open the connection in ' + (B.openMs / 1000) + ' seconds.'));
    else if (what === 'max') {
      if (T.state === 'finishing') settle(T, unsure(T));                       // let go, and the last words not final inside the transmission's bound
      else settle(T, cut(T, T.budgetAt < T.t0 + B.maxMs ? 'The transmission reached this run\'s limit of minutes heard and was cut off.'
        : 'The transmission reached its longest, ' + (B.maxMs / 1000) + ' seconds, and was cut off.'));   // ended here while the key was held
    } else if (what === 'finish') settle(T, unsure(T));                       // the last words not made final in time
    else if (what === 'keep') end(T);                                          // its words were never asked for: let go
  }
  // the key let go: no more sound is taken, and the CloseStream goes as soon as the socket is open
  function begin(T) {
    if (T.state === 'finishing' || T.state === 'done') return;
    T.state = 'finishing'; T.finishAt = Date.now();
    if (T.ws && T.opened !== null) closeStream(T); else arm(T);
  }
  function closeStream(T) { push(T, CLOSE_STREAM); T.closeAt = Date.now(); arm(T); }
  const push = (T, x) => { try { T.ws.send(x); } catch (e) { /* the close that follows says it */ } };
  // the seconds of an opened socket counted, once, from its opening to its end
  function tally(T) { if (T.opened !== null && !T.counted) { T.counted = true; heardMs += Math.max(0, nowOf() - T.opened); } }
  // the socket let go, its seconds counted and its sound let go. An open socket is closed with a close frame; one still
  // CONNECTING is closed too, which lets its handshake go at once (the second review of the ears: left alone, a handshake
  // never answered held its connection until Node's own header timeout, some 300 s). A socket that opens all the same,
  // with no transmission owning it, is closed then, with a close frame (opened(), below)
  function shut(T) {
    T.queue = []; T.queued = 0;
    tally(T);
    const ws = T.ws; T.ws = null;
    if (ws) { try { if (ws.readyState === 0 || ws.readyState === 1) ws.close(1000); } catch (e) { /* closing already */ } }
  }
  // what came of it: given to the page's finish if it waits, else kept for it (keepMs at most)
  function settle(T, answer) {
    if (T.state === 'done') return;
    T.state = 'done'; T.result = answer; T.doneAt = Date.now();
    shut(T);
    if (T.waiters.length) { const w = T.waiters.splice(0); end(T); for (const f of w) f(answer); } else arm(T);
  }
  function end(T) { disarm(T); shut(T); T.finals = []; T.interim = ''; T.told = ''; if (cur === T) cur = null; }
  // given up: whatever waits is answered with why, and the socket is closed at once (named so as not to hide the
  // module's drop(res), which lets an answer's body go)
  function giveUp(T, answer) {
    if (T.state !== 'done') { T.state = 'done'; T.result = answer; }
    const w = T.waiters.splice(0); end(T);
    for (const f of w) f(answer);
  }
  // the words heard so far, to the app's own window, when they have changed
  function tell(T) {
    const h = heardOf(T);
    if (h === T.told || !sendPage) return;
    T.told = h;
    try { sendPage('voice:heard', T.id, h); } catch (e) { /* the window is gone */ }
  }
  // the socket's own events. Its opening: a socket no transmission owns any more (given up while it connected) is
  // closed now, with a close frame; else the sound queued goes first, then the CloseStream if the key was let go meanwhile
  function opened(T, ws) {
    if (T.ws !== ws || T.state === 'done') { try { ws.close(1000); } catch (e) { /* closing already */ } return; }
    T.opened = nowOf(); talks++;
    if (T.state === 'opening') T.state = 'open';
    T.budgetAt = Date.now() + Math.max(0, S.limits.secs * 1000 - heardMs);
    const q = T.queue; T.queue = []; T.queued = 0;
    for (const b of q) push(T, b);
    if (T.state === 'finishing') closeStream(T); else arm(T);
  }
  function message(T, ws, ev) {
    if (T.ws !== ws || T.state === 'done') return;
    const d = ev ? ev.data : null;
    if (typeof d !== 'string' || d.length > LIMITS.message) return;            // nothing but text is read, and none past its bound
    let m = null;
    try { m = JSON.parse(d); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    if (m.type === 'Results') {
      const alt = m.channel && Array.isArray(m.channel.alternatives) ? m.channel.alternatives[0] : null;
      // (struck BEFORE it is cut: a key across the cut leaves no part of itself standing)
      const t = alt && typeof alt.transcript === 'string' ? strike(wordsOf(alt.transcript), T.key).slice(0, LIMITS.heard) : '';
      if (m.is_final === true) { if (t && T.finals.join(' ').length < 2 * LIMITS.heard) T.finals.push(t); T.interim = ''; } else T.interim = t;
      tell(T);
    } else if (m.type === 'Metadata') {
      if (T.state === 'finishing' && T.closeAt !== null) settle(T, answerOf(T));   // the stream's end: its final words, if final
    } else if (m.type === 'Error') {
      const said = [m.description, m.message, m.err_msg].find(x => typeof x === 'string' && x);
      if (said) T.said = clean(said, T.key);
    }
  }
  function closed(T, ws, ev) {
    if (T.ws !== ws || T.state === 'done') return;
    T.ws = null;                                                               // it is closed already
    const code = ev && Number.isInteger(ev.code) ? ev.code : 0, said = T.said || (ev && typeof ev.reason === 'string' ? clean(ev.reason, T.key) : '');
    const tail = (s) => clean(s + (said ? ': ' + said : '.'), T.key);
    // A close before the socket opened: Node's WebSocket shows neither the status nor the body of a refused handshake,
    // so a refused key and an unreachable host look alike here (the research note, C1): "Try it" tells them apart
    if (T.opened === null) return settle(T, fail('auth', 'Deepgram did not open the connection: the key may be refused, or Deepgram could not be reached. "Try it" tells whether the key is taken.'));
    if (T.state === 'finishing' && T.closeAt !== null && code === 1000) return settle(T, answerOf(T));
    if (code === 1008) return settle(T, fail('shape', tail('Deepgram could not read the sound as audio (1008)')));
    settle(T, fail('network', tail((T.state === 'finishing' ? 'Deepgram closed the connection before the last words came' : 'The connection to Deepgram dropped') + ' (' + (code || 'no code') + ')')));
  }
  // open({}): a transmission begun, { ok: true, id }, or why not. The page names nothing: the address, the model and the
  // key terms are this file's
  async function open(req) {
    await ready;
    if (req !== undefined && (!req || typeof req !== 'object' || Array.isArray(req) || Object.keys(req).length)) return fail('shape', 'A transmission is opened with nothing named: the address, the model and the words listened for are the app\'s own.');
    if (!S.ears) return fail('off', WHY.earsOff);
    const key = keyNow();
    if (!key) return fail('no-key', WHY['no-key']);
    if (cur) return fail('busy', WHY.earsBusy);
    if (S.limits.secs * 1000 - heardMs < 1000) return fail('budget', WHY.earsBudget);
    if (!TOKEN.test(key)) return fail('auth', 'The key kept holds a character that a socket cannot carry, so Deepgram\'s live service cannot be given it: save the key again as Deepgram gave it.');
    const Ctor = o.WebSocket || globalThis.WebSocket;
    if (typeof Ctor !== 'function') return fail('network', 'This app has no socket to open to Deepgram.');
    let url;
    try { url = socket(wsOrigin + '/v1/listen?' + listenQuery()); } catch (e) { return fail('guard', e instanceof VoiceError ? e.message : 'The socket was refused.'); }
    const T = { id: ++ids, key, ws: null, state: 'opening', t0: Date.now(), opened: null, counted: false, budgetAt: Infinity, finishAt: 0, closeAt: null, doneAt: 0,
      queue: [], queued: 0, taken: 0, finals: [], interim: '', told: '', said: '', result: null, waiters: [], timer: null };
    let ws = null;
    // (the constructor's own error is never repeated: it is the runtime's words about the address and the protocols)
    try { ws = new Ctor(url, ['token', key]); } catch (e) { return fail('network', 'The connection to Deepgram could not be begun.'); }
    T.ws = ws; cur = T;
    try { ws.binaryType = 'arraybuffer'; } catch (e) { /* nothing binary is read */ }
    ws.addEventListener('open', () => opened(T, ws));
    ws.addEventListener('message', (ev) => message(T, ws, ev));
    ws.addEventListener('close', (ev) => closed(T, ws, ev));
    ws.addEventListener('error', () => { /* the close that follows says it; nothing here is logged */ });
    arm(T);
    return { ok: true, id: T.id };
  }
  // audio(id, bytes): one slice of the microphone's sound, sent on, or queued while the socket opens; a slice that is
  // not bytes, empty, larger than 64 kB, of another transmission, past the transmission's bound, or after its finish,
  // is dropped. Answers whether it was taken (the window is told nothing)
  function audio(id, buf) {
    const T = cur;
    if (!T || id !== T.id || (T.state !== 'opening' && T.state !== 'open')) return false;
    const b = bytesOf(buf);
    if (!b || b.length === 0 || b.length > LIMITS.audio || T.taken + b.length > LIMITS.sound) return false;
    if (T.ws && T.opened !== null) { T.taken += b.length; push(T, b); return true; }
    if (T.queued + b.length > LIMITS.queue) return false;
    T.taken += b.length; T.queued += b.length; T.queue.push(Buffer.from(b));
    return true;
  }
  // finish(id): the key let go. Answers { ok: true, text } (the FINAL words heard), or a fault: 'unsure' and 'cut' carry
  // the words heard so far, { words, final: false }, to be shown and never given. Within 3.5 s of the CloseStream
  async function finish(id) {
    await ready;
    const T = cur;
    if (!Number.isInteger(id) || !T || T.id !== id) return fail('shape', 'No such transmission is open.');
    if (T.state === 'done') { end(T); return T.result; }
    return new Promise((resolve) => { T.waiters.push(resolve); begin(T); });
  }
  // cancel(id): given up (Escape while held, a new run): nothing is answered
  function cancel(id) {
    const T = cur;
    if (!T || !Number.isInteger(id) || T.id !== id) return false;
    giveUp(T, fail('cancelled', 'The transmission was given up.'));
    return true;
  }
  // the window's page has gone (reloaded, or its process gone): a transmission open is closed
  function pageGone() { if (cur) giveUp(cur, fail('cancelled', 'The page went away.')); }

  // ---------------------------------------------------------------- the player's own word
  // What a patch from the window would change that the player must be asked about first; null when nothing is: a
  // switch going on (the question says the address and the run's limit), or a limit raised while its switch is on: for
  // the voices ('on', 'limits') and for the ears ('ears', 'ears-limits'). Off, nothing can be called, so nothing is
  // asked. One question at a time: a patch that would need two is refused ('two'). Found on the settings themselves and
  // undone, so that a patch is judged exactly as set() would take it.
  function wants(patch) {
    const before = JSON.stringify(S), read = () => ({ on: S.on, chars: S.limits.chars, ears: S.ears, secs: S.limits.secs });
    const b = read();
    let a = null;
    try { apply(patch); a = read(); } catch (e) { a = null; }
    restore(before);
    if (!a) return null;                            // refused as it stands (set says why)
    const kinds = [];
    if (a.on && (!b.on || a.chars > b.chars)) kinds.push(!b.on ? 'on' : 'limits');
    if (a.ears && (!b.ears || a.secs > b.secs)) kinds.push(!b.ears ? 'ears' : 'ears-limits');
    if (!kinds.length) return null;
    if (kinds.length > 1) return { kind: 'two' };
    const ears = kinds[0] === 'ears' || kinds[0] === 'ears-limits';
    return ears ? { kind: kinds[0], provider: 'Deepgram', origin: wsOrigin, limits: { secs: a.secs }, was: { secs: b.secs } }
      : { kind: kinds[0], provider: 'Deepgram', origin, limits: { chars: a.chars }, was: { chars: b.chars } };
  }
  let asking = false;                               // a question to the player is open

  const api = { status, set, setKey, clearKey, test, speak, open, finish };
  // the window's calls, each refused unless it comes from the app's own page, each after the key is read: the eight that
  // are answered (NAMES), and the two that are not (SENDS: audio and cancel, whose refusal is silent)
  function attach() {
    for (const name of SENDS) {
      o.ipcMain.on('voice:' + name, (event, id, buf) => {
        if (!o.isOwn || !o.isOwn(event)) return;
        try { if (name === 'audio') audio(id, buf); else cancel(id); } catch (e) { /* a malformed one is dropped */ }
      });
    }
    for (const name of NAMES) {
      o.ipcMain.handle('voice:' + name, async (event, arg) => {
        if (!o.isOwn || !o.isOwn(event)) return fail('shape', 'Only the app\'s own page may call this.');
        try {
          await ready;
          // While the app's own question to the player is open nothing else moves either, as for the crew's minds
          // (app/minds.js): not the key, and nothing goes out (no line spoken, no key tried, no transmission opened). A
          // transmission already open goes on: its finish, and the sound and the cancel sent, are not refused
          if (asking && (name === 'setKey' || name === 'clearKey' || name === 'test' || name === 'speak' || name === 'open')) return fail('busy', WHY.asking);
          if (name === 'set' && o.confirm) {
            // While a question is open no setting moves: the player answers for what the question said
            if (asking) return fail('busy', WHY.asking);
            const w = arg && typeof arg === 'object' && !Array.isArray(arg) ? wants(arg) : null;
            if (w && w.kind === 'two') return fail('shape', WHY.two);
            if (w) {
              asking = true;
              let yes = false;
              try { yes = (await o.confirm(Object.assign({}, w, consentText(w)))) === true; } catch (e) { yes = false; } finally { asking = false; }
              if (!yes) return fail('declined', WHY.declined);
              if (JSON.stringify(wants(arg)) !== JSON.stringify(w)) return fail('declined', WHY.moved);   // held twice: no set passed meanwhile
            }
          }
          return await api[name](arg);
        } catch (e) { return fail('shape', 'The call could not be carried out.'); }
      });
    }
  }

  load();
  // the key kept from an earlier run, read once (the shared store's open: this file's purpose, no seal without one).
  // Only clearKey can come between (every other call waits for this): a key forgotten, or another given, while it was
  // being opened is not taken back. The store asked for a new seal: it is kept in the old one's place
  const ready = (async () => {
    protect = await store.kind();
    if (!S.key || protect === 'none') return;
    const g = keyGen, b64 = S.key, r = await store.open(PURPOSE, b64, false);
    if (!r || g !== keyGen || S.key !== b64 || volatile || plain !== null) return;
    plain = r.key;
    if (r.again) { S.key = r.again; try { save(); } catch (e) { /* the file could not be written: the old seal still opens */ } }
  })().catch(() => { /* no store: no key */ });
  // for main.js and the tests (none of it reaches the window): the two sends as plain calls, the page gone, whether the
  // ears are switched on just now (main.js's permission handlers ask it each time: microphoneAllowed), the one
  // transmission open (its id, state and queue, never its key or its words), and the timers armed by the ears
  const listening = () => (cur ? { id: cur.id, state: cur.state, queued: cur.queued, opened: cur.opened !== null, waiting: cur.waiters.length } : null);
  const earsOn = () => S.ears === true;
  return Object.assign({ attach, hosts: () => Array.from(new Set(seen)), ready, usage, audio, cancel, pageGone, earsOn, listening, armed: () => armed }, api);
}

module.exports = { create, consentText, voiceOf, socketGuard, microphoneAllowed, listenQuery, VOICES, CAST, POSTS, DEFAULT_VOICE, BASE, LIMITS, DEFAULTS, BOUNDS,
  KEYTERMS, NAMES, SENDS, VoiceError };
