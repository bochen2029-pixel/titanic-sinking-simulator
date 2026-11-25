// The crew's minds, the app's side: the ONE channel between the window and a language model's provider
// (docs/DESIGN_ask_the_bridge_v1_2026-11-23.md, sections 9 to 11). Electron's main process requires this file; the page
// reaches it only through the preload's one object, titanicMinds, whose seven calls are the seven handlers below.
//
//   - The player brings his own key. It is typed once in the page, passed here, kept encrypted by the system's key store
//     (Electron's safeStorage, by its asynchronous calls, through app/keystore.js: sealed with what it is for) in the
//     app's settings folder, and never given back: no call returns it, nothing logs it, and it is struck out of every
//     text a provider sends, whole or in part.
//   - The window sends TEXT ONLY: a seat's name and the two parts of a request. The provider, the model, the address and
//     the key are this process's own settings. The window cannot name a host, a path or a header.
//   - ONE HOST. Every request passes guard(): its address must have the origin of the provider that is set, by https,
//     or by http only to this PC itself; no redirect is followed. hosts() says where this run has called.
//   - OFF BY DEFAULT. With the switch off, or no key where one is needed, ask() answers without calling anyone.
//   - THE SWITCH IS THE PLAYER'S OWN. What would make the app call out, call out elsewhere or spend more is asked of
//     him by this process itself, in a window of the system's own that the page can neither word nor answer (the app
//     lane's review, B2: "the player's own word", below). So that she connects to nothing unless he switches it on
//     does not rest on the page's code.
//   - A LIMIT for the run (questions and tokens), and at most two requests at once.
//   - It prints nothing: no request, no reply and no key ever reaches a console or a log.
//
// Nothing here knows Electron by name: attach() is given ipcMain, safeStorage and the folder, so that
// tools/minds_app_tests.js runs it in plain Node with stand-ins. The adapters are beside it: minds_openai.js (the
// chat-completions form, by fetch) and, when it is there, minds_anthropic.js (Claude).
'use strict';
const fs = require('fs'), path = require('path');
const KS = require('./keystore.js');
const openai = require('./minds_openai.js');

// ---------------------------------------------------------------- the providers
// form: which adapter speaks to it. base: its address, fixed here (null: the player's own, checked by checkBase).
// key: true (needed), false (a server on this PC needs none), 'optional'. cap: the name it gives the output's limit.
// Addresses read in each provider's own reference on 2026-11-23.
const PROVIDERS = Object.freeze({
  // models: the current models' names, offered under the model's field (Anthropic's models list, read 2026-11-23; the
  // first is the default). A faster one answers a short line sooner, and the watch waits for the answer
  anthropic: Object.freeze({ label: 'Claude (Anthropic)', form: 'anthropic', base: 'https://api.anthropic.com', key: true, model: 'claude-opus-5-5',
    models: Object.freeze(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-2']) }),
  openai: Object.freeze({ label: 'OpenAI', form: 'openai', base: 'https://api.openai.com/v1', key: true, cap: 'max_completion_tokens' }),
  gemini: Object.freeze({ label: 'Google Gemini (its OpenAI-compatible endpoint)', form: 'openai', base: 'https://generativelanguage.googleapis.com/v1beta/openai', key: true, cap: 'max_tokens' }),
  cerebras: Object.freeze({ label: 'Cerebras', form: 'openai', base: 'https://api.cerebras.ai/v1', key: true, cap: 'max_tokens' }),
  lmstudio: Object.freeze({ label: 'LM Studio on this PC', form: 'openai', base: 'http://localhost:1234/v1', key: false, cap: 'max_tokens' }),
  ollama: Object.freeze({ label: 'Ollama on this PC', form: 'openai', base: 'http://localhost:11434/v1', key: false, cap: 'max_tokens' }),
  custom: Object.freeze({ label: 'Another server that speaks chat completions', form: 'openai', base: null, key: 'optional', cap: 'max_tokens' }),
});

// The typed turn (design 6.2), one fixed schema for every man and every turn. The page's library holds the same one
// (site/parts/87_minds_words.js); tools/minds_app_tests.js holds the two equal.
const TURN_SCHEMA = Object.freeze({
  type: 'object',
  properties: Object.freeze({ say: Object.freeze({ type: 'string' }), order: Object.freeze({ anyOf: Object.freeze([Object.freeze({ type: 'string' }), Object.freeze({ type: 'null' })]) }) }),
  required: Object.freeze(['say', 'order']),
  additionalProperties: false,
});

// maxTokens: the most one answer may cost, its thinking included (a line is a few dozen tokens; a model that thinks
// before a short line needs the room, and an answer cut off is an answer lost)
// maxTokensClaude: Claude's current models always think, their thinking counts inside the cap, and a cut-off answer is
// lost; unused tokens are not billed and the run's token limit bounds the spend, so the cap is Anthropic's usual one
// for a call without streaming (the app lane's B4). Count the cut-offs when a real key is tried.
// (the chat-completions form's 8,000: a model that reasons spends its thinking inside the cap there too, and an answer
// "cut off before it began" is the commonest way a first question fails [bet: 4,000 until a real key showed otherwise])
const LIMITS = Object.freeze({ part: 24000, seat: 40, model: 100, base: 200, keyMin: 8, keyMax: 512, atOnce: 2, maxTokens: 8000, maxTokensClaude: 16000,
  timeoutMs: [1000, 60000], questions: [1, 5000], tokens: [1000, 5000000] });
// timeoutMs: how long one answer is awaited. 45 s [bet]: a large model that thinks before a short line can take tens of
// seconds on its first question, and "no answer came" is a worse first meeting than a wait (the watch runs on at her
// own pace meanwhile). A fast model answers in a second or two whatever this says. Nothing has been timed on a real key.
const DEFAULTS = Object.freeze({ v: 1, on: false, provider: 'anthropic', model: '', base: '', effort: 'low', timeoutMs: 45000, limits: Object.freeze({ questions: 200, tokens: 300000 }) });
const EFFORTS = ['low', 'medium', 'high'];
const NAMES = Object.freeze(['status', 'set', 'setKey', 'clearKey', 'test', 'ask', 'usage']);

// an answer that is not a reply: kind says which (design 9), why in plain words for the notice
class MindsError extends Error { constructor(kind, why) { super(why); this.kind = kind; } }
const fail = (kind, why) => ({ ok: false, kind, why });
const WHY = Object.freeze({
  off: 'The crew\'s minds are switched off.',
  'no-key': 'No key is kept for this provider.',
  'no-model': 'No model is named for this provider.',
  'no-adapter': 'This build cannot speak to that provider yet.',
  budget: 'This run\'s limit for the language model is spent.',
  busy: 'Two answers are awaited already.',
  declined: 'You did not confirm it: nothing was changed.',
  moved: 'The settings changed while you were asked: nothing was changed.',
  asking: 'An earlier change is waiting for your answer.',
});

// ---------------------------------------------------------------- the player's own word (the app lane's review, B2)
// The words of the question this process asks the player before it will call out, call out elsewhere, or spend more
// (create's wants, below, says when). They are made here and shown by the main process in the system's own message
// box: the page words none of it. w: { kind: 'on' | 'address' | 'limits', label, origin, limits, was }.
const count = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');   // thousands, the same in every runtime
function consentText(w) {
  const where = w.label + (w.origin ? ' at ' + w.origin : ' (no address is set for it yet)');
  const lim = 'up to ' + count(w.limits.questions) + ' questions and ' + count(w.limits.tokens) + ' tokens';
  const t = { title: 'The crew\'s minds', no: 'Cancel' };
  if (w.kind === 'on') return Object.assign(t, { message: 'Switch on the crew\'s minds?', yes: 'Switch on',
    detail: 'While they are on, the app sends what you ask the bridge, and what the bridge has been told, to ' + where + '. It calls nobody else. This run may ask ' + lim + '; a provider that bills a key bills yours for them.' });
  if (w.kind === 'address') return Object.assign(t, { message: 'Ask another provider?', yes: 'Change',
    detail: 'The crew\'s minds are on. From now on the app would send what you ask the bridge to ' + where + ', and to nobody else. This run may ask ' + lim + '.' });
  return Object.assign(t, { message: 'Raise this run\'s limits?', yes: 'Raise',
    detail: 'The crew\'s minds are on, for ' + where + '. This run could then ask ' + lim + ' (now ' + count(w.was.questions) + ' and ' + count(w.was.tokens) + ').' });
}

// ---------------------------------------------------------------- the one host
const LOOPBACK = { localhost: 1, '127.0.0.1': 1, '[::1]': 1 };
// a base address the player typed: https, or http to this PC itself; no name and password, no query, no fragment
function checkBase(s) {
  if (typeof s !== 'string' || !s.trim() || s.length > LIMITS.base) throw new MindsError('shape', 'The address is empty or too long.');
  let u;
  try { u = new URL(s.trim()); } catch (e) { throw new MindsError('shape', 'That is not an address.'); }
  if (u.username || u.password) throw new MindsError('shape', 'An address may not carry a name or a password.');
  if (u.search || u.hash) throw new MindsError('shape', 'An address may not carry a query or a fragment.');
  if (u.protocol === 'http:' ? !LOOPBACK[u.hostname] : u.protocol !== 'https:') throw new MindsError('shape', 'The address must begin with https://, or with http:// only for a server on this PC (localhost).');
  return u.origin + u.pathname.replace(/\/+$/, '');
}
// fetch, held to one origin: a request anywhere else is refused before it is made, and no redirect is followed
function guard(origin, fetchImpl, seen) {
  return async function guardedFetch(url, init) {
    let u;
    try { u = new URL(typeof url === 'string' ? url : String(url && url.url ? url.url : url)); } catch (e) { throw new MindsError('guard', 'A request with no address was refused.'); }
    if (u.origin !== origin) throw new MindsError('guard', 'A request to another host than the one set was refused.');
    if (u.protocol === 'http:' ? !LOOPBACK[u.hostname] : u.protocol !== 'https:') throw new MindsError('guard', 'A request not by https was refused.');
    if (seen) { seen.push(u.origin); if (seen.length > 200) seen.shift(); }
    return fetchImpl(url, Object.assign({}, init, { redirect: 'error' }));
  };
}

// ---------------------------------------------------------------- the settings and the key
// o: { ipcMain, safeStorage, dir, isOwn(event), confirm(question), fetch, anthropic, anthropicBase }.
//   dir: the app's settings folder (minds.json lives there). isOwn: is this call from the app's own page.
//   confirm: asks the player a question (consentText's words) and answers true or false; the window's "set" passes
//   by it (attach, below). With none given nothing is asked: plain Node, where there is no window either.
//   fetch: the fetch to call out with (default: this process's own). anthropic: the Claude adapter, when built.
//   anthropicBase: for the self-test only, a server on this PC standing in for Claude's (checked: loopback).
function create(o) {
  o = o || {};
  const safe = o.safeStorage, file = o.dir ? path.join(o.dir, 'minds.json') : null, fetchImpl = o.fetch || globalThis.fetch;
  const adapters = { openai, anthropic: o.anthropic || null };
  const anthropicBase = o.anthropicBase ? checkLoopback(checkBase(o.anthropicBase)) : null;
  const S = { v: 1, on: DEFAULTS.on, provider: DEFAULTS.provider, model: DEFAULTS.model, base: DEFAULTS.base, effort: DEFAULTS.effort, timeoutMs: DEFAULTS.timeoutMs,
    limits: { questions: DEFAULTS.limits.questions, tokens: DEFAULTS.limits.tokens }, keys: {}, keyAt: {} };
  const volatile = {};                              // keys kept for the run only (a PC that cannot protect one)
  // The system's key store (app/keystore.js: its asynchronous calls, and a seal that says what it is for). A key kept
  // on disk is opened ONCE, as the run starts (ready, at the end), and held in memory by its provider: opening takes
  // time, and a question must not wait on it each time. gen: each word about a provider's key (kept, forgotten) takes
  // a number as it is given, so that the later word stands whatever the sealing's delay
  const store = KS.create(safe), plain = {}, gen = {};
  let protect = 'none';
  const purposeOf = (p) => 'minds:' + p + ':';
  // What is sealed for the player's own server ('custom') is its ADDRESS and the key, "origin|key": the address a key is
  // for must not rest on a line of the settings file that anyone who can write the file can change (the review of this
  // file: keyAt edited to another address, and the key went there). For every other provider the address is this file's own.
  const pack = (p, at, key) => (p === 'custom' ? at + '|' + key : key);
  function unpack(p, text) {
    if (p !== 'custom') return { key: text, at: null };
    const i = text.indexOf('|');
    if (i <= 0 || i === text.length - 1) return null;
    let at = null; try { at = new URL(text.slice(0, i)).origin; } catch (e) { return null; }
    return at === text.slice(0, i) ? { key: text.slice(i + 1), at } : null;
  }
  // A seal with no purpose (the bare key: what the first build wrote) is taken only in the place of a provider whose
  // address is this file's own and who needs a key, and only where that same seal does not also stand in another place:
  // moved by hand into the player's-own-server's place it would otherwise go wherever the file's address says.
  const legacyOk = (p, b64) => !!PROVIDERS[p].base && PROVIDERS[p].key === true && Object.keys(PROVIDERS).filter(q => S.keys[q] === b64).length === 1;
  const used = { questions: 0, tokens: 0 }, seen = [];
  let atOnce = 0;

  function checkLoopback(base) { if (!LOOPBACK[new URL(base).hostname]) throw new MindsError('shape', 'The stand-in for a provider must be on this PC.'); return base; }
  // what the file holds, each field checked as if it were typed (a file edited by hand is not trusted either).
  // THE SWITCH IS NOT AMONG THEM: every run of the app starts with the crew's minds off, whatever the file says. The
  // question the player answers says "This run may ask ...", and the men speak up unasked while it is on: a run must
  // not begin spending because an earlier one was allowed to, nor because a file says so (the second review: a
  // minds.json written by hand with the switch on and an address of its own called out at once, with no question).
  function load() {
    if (!file) return;
    let j = null;
    try { j = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return; }
    if (!j || typeof j !== 'object' || j.v !== 1) return;
    for (const k of ['provider', 'model', 'base', 'effort', 'timeoutMs', 'limits']) { if (j[k] === undefined) continue; try { apply({ [k]: j[k] }); } catch (e) { /* that field keeps its default */ } }
    if (j.keys && typeof j.keys === 'object') for (const p of Object.keys(PROVIDERS)) if (typeof j.keys[p] === 'string' && /^[A-Za-z0-9+/=]{8,4096}$/.test(j.keys[p])) S.keys[p] = j.keys[p];
    if (j.keyAt && typeof j.keyAt === 'object') for (const p of Object.keys(PROVIDERS)) if (typeof j.keyAt[p] === 'string' && j.keyAt[p].length <= LIMITS.base) S.keyAt[p] = j.keyAt[p];
  }
  function save() {
    if (!file) return;
    const tmp = file + '.tmp';
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(Object.assign({}, S, { on: false }), null, 1) + '\n');   // the switch is the run's, never the file's
    fs.renameSync(tmp, file);
  }
  // one field of a patch, checked; throws MindsError('shape') on anything else
  function apply(patch) {
    for (const k of Object.keys(patch)) {
      const v = patch[k];
      if (k === 'on') { if (typeof v !== 'boolean') throw new MindsError('shape', 'The switch is on or off.'); S.on = v; }
      else if (k === 'provider') { if (typeof v !== 'string' || !Object.prototype.hasOwnProperty.call(PROVIDERS, v)) throw new MindsError('shape', 'No such provider.'); if (v !== S.provider) { S.provider = v; S.model = ''; } }
      else if (k === 'model') { if (typeof v !== 'string' || v.length > LIMITS.model || !/^[A-Za-z0-9._:\/@-]*$/.test(v)) throw new MindsError('shape', 'A model\'s name is letters, digits and . _ : / @ -'); S.model = v; }
      else if (k === 'base') { S.base = v === '' ? '' : checkBase(v); }
      else if (k === 'effort') { if (EFFORTS.indexOf(v) < 0) throw new MindsError('shape', 'The effort is low, medium or high.'); S.effort = v; }
      else if (k === 'timeoutMs') { if (!Number.isInteger(v) || v < LIMITS.timeoutMs[0] || v > LIMITS.timeoutMs[1]) throw new MindsError('shape', 'The wait is 1 to 60 seconds.'); S.timeoutMs = v; }
      else if (k === 'limits') {
        if (!v || typeof v !== 'object' || Object.keys(v).some(x => x !== 'questions' && x !== 'tokens')) throw new MindsError('shape', 'The limits are questions and tokens.');
        for (const x of ['questions', 'tokens']) { if (v[x] === undefined) continue; if (!Number.isInteger(v[x]) || v[x] < LIMITS[x][0] || v[x] > LIMITS[x][1]) throw new MindsError('shape', 'A limit out of range: ' + x + '.'); }
        if (v.questions !== undefined) S.limits.questions = v.questions;
        if (v.tokens !== undefined) S.limits.tokens = v.tokens;
      } else throw new MindsError('shape', 'No such setting: ' + String(k).slice(0, 40) + '.');
    }
  }
  const canProtect = () => protect !== 'none';      // (found when ready, and again at each key kept)
  const baseOf = () => { const P = PROVIDERS[S.provider]; return P.form === 'anthropic' ? (anthropicBase || P.base) : (P.base || S.base || null); };
  const originNow = () => { const b = baseOf(); try { return b ? new URL(b).origin : ''; } catch (e) { return ''; } };
  // A key is for the address it was entered for. The player's own server ('custom') is the one provider whose address
  // can change: a key entered for one address is never sent to another (it is kept, and usable again at its own)
  const elsewhere = (p) => p === 'custom' && !!(volatile[p] || S.keys[p]) && S.keyAt[p] !== originNow();
  function keyOf(p) {
    if (elsewhere(p)) return null;
    return volatile[p] || plain[p] || null;         // (a key sealed by another user, or on another PC, was not opened: no key)
  }
  // the provider's words, short, on one line, with the key struck out wherever it stands
  function clean(text, key) {
    // struck out FIRST, whole or in part (any run of eight of its characters: app/keystore.js), and only then cut
    const s = KS.strike(String(text === undefined || text === null ? '' : text).replace(/\s+/g, ' ').trim(), key);
    return s.length > 240 ? s.slice(0, 237) + '...' : s;
  }
  // a provider's answer, as it came, with the key struck out wherever it stands (a server that echoes what it was sent)
  const strike = KS.strike;

  // ---------------------------------------------------------------- the seven calls
  function status() {
    const P = PROVIDERS[S.provider], key = keyOf(S.provider);
    return { ok: true, available: true, on: S.on, provider: S.provider, model: S.model, modelUsed: S.model || P.model || '', base: S.provider === 'custom' ? S.base : '', effort: S.effort, timeoutMs: S.timeoutMs,
      limits: { questions: S.limits.questions, tokens: S.limits.tokens }, used: { questions: used.questions, tokens: used.tokens },
      hasKey: !!key, keyKept: !key ? null : (volatile[S.provider] ? 'run' : 'disk'), keyElsewhere: elsewhere(S.provider), canProtect: canProtect(), needsKey: P.key, ready: !!adapters[P.form],
      providers: Object.keys(PROVIDERS).map(id => ({ id, label: PROVIDERS[id].label, key: PROVIDERS[id].key, fixed: !!PROVIDERS[id].base, ready: !!adapters[PROVIDERS[id].form],
        models: PROVIDERS[id].models ? PROVIDERS[id].models.slice() : [] })),
      hosts: Array.from(new Set(seen)) };
  }
  function set(patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return fail('shape', 'The settings are not an object.');
    const before = JSON.stringify(S);
    try { apply(patch); } catch (e) { Object.assign(S, JSON.parse(before)); return fail('shape', e instanceof MindsError ? e.message : 'The settings were refused.'); }
    save();
    return status();
  }
  async function setKey(key) {
    if (typeof key !== 'string') return fail('shape', 'The key is not text.');
    key = key.trim();
    if (key.length < LIMITS.keyMin || key.length > LIMITS.keyMax || !/^[\x21-\x7e]+$/.test(key)) return fail('shape', 'That does not look like a key.');
    // whose key it is, the address it is for (see keyOf) and its number: each taken AT ONCE, before anything is waited
    // for. A Forget that comes after it is the later word, and the provider shown may change while the key is sealed
    const p = S.provider, at = originNow(), g = gen[p] = (gen[p] || 0) + 1;
    await ready;
    protect = await store.kind();                   // asked again: a store can come to be after the start
    const enc = await store.seal(purposeOf(p), pack(p, at, key));
    if (g !== gen[p]) return status();              // forgotten, or another key given, meanwhile: the later word stands
    S.keyAt[p] = at;
    if (enc) { S.keys[p] = enc; plain[p] = key; delete volatile[p]; }
    else { protect = 'none'; delete S.keys[p]; delete plain[p]; volatile[p] = key; }   // it could not be sealed: kept for the run only, never written
    save();
    return status();
  }
  function clearKey() { const p = S.provider; gen[p] = (gen[p] || 0) + 1; delete S.keys[p]; delete S.keyAt[p]; delete volatile[p]; delete plain[p]; save(); return status(); }
  function usage() { return { ok: true, used: { questions: used.questions, tokens: used.tokens }, limits: { questions: S.limits.questions, tokens: S.limits.tokens } }; }

  async function ask(req) {
    if (!req || typeof req !== 'object' || Array.isArray(req)) return fail('shape', 'The request is not an object.');
    if (Object.keys(req).some(k => k !== 'seat' && k !== 'stable' && k !== 'changing')) return fail('shape', 'The request holds more than a seat and two parts.');
    const { seat, stable, changing } = req;
    if (typeof seat !== 'string' || !/^[a-z][a-z0-9_-]{0,39}$/.test(seat)) return fail('shape', 'The seat is not a name.');
    for (const part of [stable, changing]) if (typeof part !== 'string' || !part || part.length > LIMITS.part) return fail('shape', 'A part of the request is empty, not text, or too long.');
    await ready;                                    // the key kept from an earlier run is read by now
    if (!S.on) return fail('off', WHY.off);
    const P = PROVIDERS[S.provider], adapter = adapters[P.form], key = keyOf(S.provider), model = S.model || P.model || '', base = baseOf();
    if (!adapter) return fail('no-adapter', WHY['no-adapter']);
    if (P.key === true && !key) return fail('no-key', WHY['no-key']);
    if (!model) return fail('no-model', WHY['no-model']);
    if (!base) return fail('shape', 'No address is set for this provider.');
    if (used.questions >= S.limits.questions || used.tokens >= S.limits.tokens) return fail('budget', WHY.budget);
    if (atOnce >= LIMITS.atOnce) return fail('busy', WHY.busy);
    atOnce++; used.questions++;
    const t0 = Date.now(), stop = new AbortController(), timer = setTimeout(() => stop.abort(), S.timeoutMs);
    try {
      const r = await adapter.call({ base, key, model, stable, changing, schema: TURN_SCHEMA, cap: P.cap, effort: S.effort, maxTokens: P.form === 'anthropic' ? LIMITS.maxTokensClaude : LIMITS.maxTokens, timeoutMs: S.timeoutMs, signal: stop.signal,
        fetch: guard(new URL(base).origin, fetchImpl, seen), MindsError });
      const u = r.usage || {}, n = (x) => (Number.isFinite(x) && x > 0 ? Math.round(x) : 0);
      used.tokens += n(u.in) + n(u.out);
      return { ok: true, text: strike(r.text, key).slice(0, 8000), usage: { in: n(u.in), out: n(u.out), cached: n(u.cached) }, ms: Date.now() - t0, model: clean(r.model || model, key) };
    } catch (e) {
      if (stop.signal.aborted) return fail('timeout', 'No answer came in ' + Math.round(S.timeoutMs / 1000) + ' seconds.');
      if (e instanceof MindsError) return fail(e.kind, clean(e.message, key));
      return fail('network', 'The provider could not be reached.');
    } finally { clearTimeout(timer); atOnce--; }
  }
  // With no model named, which models the provider offers (the chat-completions form's list of them): one request, under
  // the same switch, key, limit and guard as a question, and counted as one. null: there is nothing to say of it (no
  // list, or it could not be had), and the question's own answer stands ("no-model").
  async function offered() {
    await ready;
    const P = PROVIDERS[S.provider], adapter = adapters[P.form], key = keyOf(S.provider), base = baseOf();
    if (!S.on || S.model || P.model || !adapter || typeof adapter.models !== 'function' || !base || (P.key === true && !key)) return null;
    if (used.questions >= S.limits.questions || used.tokens >= S.limits.tokens || atOnce >= LIMITS.atOnce) return null;
    atOnce++; used.questions++;
    const stop = new AbortController(), timer = setTimeout(() => stop.abort(), S.timeoutMs);
    try {
      const got = await adapter.models({ base, key, signal: stop.signal, fetch: guard(new URL(base).origin, fetchImpl, seen), MindsError });
      // names only, as a model's name may be set here; never anything that holds the key, or a piece of it (the second
      // review: a server could hand the key back in two halves, as two models' names; the review of the key store: with
      // one more letter on each half the halves passed). A name the striking would change is dropped whole
      const ids = (Array.isArray(got) ? got : []).map(String).filter(s => s.length <= LIMITS.model && /^[A-Za-z0-9._:\/@-]+$/.test(s) && !(key && (KS.strike(s, key) !== s || (s.length >= 8 && key.indexOf(s) >= 0)))).slice(0, 200);
      if (!ids.length) return null;
      const shown = ids.slice(0, 12).join(', ') + (ids.length > 12 ? ', and ' + (ids.length - 12) + ' more' : '');
      return Object.assign(fail('no-model', 'No model is named for this provider. It offers: ' + shown + '.'), { models: ids });
    } catch (e) {
      if (stop.signal.aborted) return fail('timeout', 'No answer came in ' + Math.round(S.timeoutMs / 1000) + ' seconds.');
      if (e instanceof MindsError) return fail(e.kind, clean(e.message, key));
      return fail('network', 'The provider could not be reached.');
    } finally { clearTimeout(timer); atOnce--; }
  }
  // one small question, to try the key and the model; with no model named, the answer says which the provider offers
  async function test() {
    const list = await offered();
    if (list) return list;
    return ask({ seat: 'test', stable: 'You are the quartermaster at a ship\'s wheel in 1912. Answer with a JSON object and nothing else: {"say": "...", "order": null}.', changing: 'THE CAPTAIN SAYS TO YOU: Are you at the wheel?' });
  }

  // ---------------------------------------------------------------- the player's own word
  // What a patch from the window would change that the player must be asked about first; null when nothing is:
  //   - the switch going on (with whatever else the patch sets: the question says the provider, its address, the limits);
  //   - the provider, or the address, changing while it is on;
  //   - a limit of the run raised while it is on.
  // Off, nothing can be called, so nothing is asked: the question comes when the switch goes on, and says it all.
  // It is found on the settings themselves and undone, so that a patch is judged exactly as set() would take it.
  function wants(patch) {
    const before = JSON.stringify(S), read = () => ({ on: S.on, provider: S.provider, origin: originNow(), q: S.limits.questions, t: S.limits.tokens });
    const b = read();
    let a = null;
    try { apply(patch); a = read(); } catch (e) { a = null; }
    Object.assign(S, JSON.parse(before));
    if (!a || !a.on) return null;                   // refused as it stands (set says why), or off afterwards
    const kind = !b.on ? 'on' : (a.provider !== b.provider || a.origin !== b.origin) ? 'address' : (a.q > b.q || a.t > b.t) ? 'limits' : null;
    return kind ? { kind, provider: a.provider, label: PROVIDERS[a.provider].label, origin: a.origin, limits: { questions: a.q, tokens: a.t }, was: { questions: b.q, tokens: b.t } } : null;
  }
  let asking = false;                               // a question to the player is open

  const api = { status, set, setKey, clearKey, test, ask, usage };
  // the window's seven calls, each refused unless it comes from the app's own page
  function attach() {
    for (const name of NAMES) {
      o.ipcMain.handle('minds:' + name, async (event, arg) => {
        if (!o.isOwn || !o.isOwn(event)) return fail('shape', 'Only the app\'s own page may call this.');
        try {
          await ready;                              // every call of the window's waits until a kept key has been read
          // While a question to the player is open nothing else moves either: not the key (a key saved then would be
          // tied to the address in force BEFORE his answer, and sent there), and no question goes out (the review of
          // the key store). The status and the count may still be read.
          if (asking && (name === 'setKey' || name === 'clearKey' || name === 'test' || name === 'ask')) return fail('busy', WHY.asking);
          if (name === 'set' && o.confirm) {
            // While a question is open no setting moves: the player answers for what the question said, and nothing
            // can be slipped in behind it (an address changed while the switch is still off would need no question)
            if (asking) return fail('busy', WHY.asking);
            const w = arg && typeof arg === 'object' && !Array.isArray(arg) ? wants(arg) : null;
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
  // The keys kept from an earlier run, opened once (the store's asynchronous calls). A seal made before purposes were
  // written holds the bare key: it is taken, and sealed again with its purpose. A key forgotten, or another given, while
  // it was being opened is not taken back (gen).
  const ready = (async () => {
    protect = await store.kind();
    if (protect === 'none') return;
    for (const p of Object.keys(PROVIDERS)) {
      const b64 = S.keys[p];
      if (!b64) continue;
      const g = gen[p] || 0, r = await store.open(purposeOf(p), b64, legacyOk(p, b64));
      if (!r || g !== (gen[p] || 0) || S.keys[p] !== b64) continue;
      const u = unpack(p, r.key);
      if (!u) continue;                             // the player's own server's key with no address sealed beside it: no key
      plain[p] = u.key;
      let changed = false;
      if (u.at && S.keyAt[p] !== u.at) { S.keyAt[p] = u.at; changed = true; }   // the sealed address is the one that counts
      if (r.again) { S.keys[p] = r.again; changed = true; }
      if (changed) { try { save(); } catch (e) { /* the file could not be written: the key is still this run's */ } }
    }
  })().catch(() => { /* no store: no key */ });
  return Object.assign({ attach, hosts: () => Array.from(new Set(seen)), ready }, api);
}

module.exports = { create, guard, checkBase, consentText, PROVIDERS, TURN_SCHEMA, LIMITS, DEFAULTS, NAMES, MindsError };
