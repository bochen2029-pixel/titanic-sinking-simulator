// The system's key store, for every key the app keeps for the player (a language model's provider's, for the crew's
// minds: app/minds.js). One place for how a key is sealed, opened and struck out of a text, after the two independent
// reviews of the crew's minds and of the men's voices (docs/DESIGN_spoken_bridge_voice_v1_2026-11-23.md, section 9b).
//
//   - Electron's safeStorage by its ASYNCHRONOUS calls (isAsyncEncryptionAvailable, encryptStringAsync,
//     decryptStringAsync: the last answers { result, shouldReEncrypt }). "The synchronous API (isEncryptionAvailable/
//     encryptString/decryptString) is deprecated and will be removed in Electron 46" (Electron's safe-storage page and
//     its breaking changes for 45.0, read 2026-11-23); "data encrypted with safeStorage.encryptString can be decrypted
//     with safeStorage.decryptStringAsync". The synchronous calls are used only where the asynchronous ones are absent
//     (an older Electron; the tests' plain stand-in) or say they cannot protect. With neither able, a key is kept for
//     the run only and never written: that is the caller's to do, on a null from seal().
//   - WHAT IS SEALED SAYS WHAT IT IS FOR: a purpose, then the key ("minds:openai:" + key). A sealed thing that opens
//     to another purpose is no key here: a key sealed for one provider, copied by hand into another's place, is never
//     sent to the wrong host. A seal made before purposes were written (the first build of the crew's minds) holds the
//     bare key: open() takes it when the caller allows it (legacy), and asks for it to be sealed again with its purpose.
//   - A key is struck out of a text WHOLE OR IN PART (strike): any run of eight or more of its characters, before the
//     text is cut to length. A server may print a key's first or last characters, or put the key far into a long text.
//
// Nothing here knows Electron by name, prints anything, or keeps a key: create() is given the store, and answers
// functions. tools/minds_app_tests.js runs it in plain Node with stand-ins.
'use strict';

const PART = 8;                                     // the shortest run of a key's characters that is struck out
// In time that grows with the text, not with its square: every place in the text where PART characters of the key
// stand is found against the text AS IT IS, the places are joined, and the answer is built once. (Its first form
// rebuilt the whole text at every match: the review of this file measured 50 s on one megabyte of key pieces, sent by
// a provider that meant harm, with the wait's own bound already over.) A run of the key longer than PART is its
// PART-long pieces overlapping, so the joined places are exactly the runs.
function strike(text, key) {
  const s = String(text === undefined || text === null ? '' : text);
  if (!key) return s;
  key = String(key);
  if (key.length < PART) return s.split(key).join('[the key]');
  if (s.length < PART) return s;
  const pieces = new Set();
  for (let i = 0; i + PART <= key.length; i++) pieces.add(key.slice(i, i + PART));
  const first = new Set(); for (const p of pieces) first.add(p.charCodeAt(0));   // most places are passed on their first character
  let out = '', from = 0, a = -1, b = -1;             // [a, b): the run being gathered
  for (let i = 0; i + PART <= s.length; i++) {
    if (!first.has(s.charCodeAt(i)) || !pieces.has(s.substr(i, PART))) continue;
    if (a >= 0 && i <= b) { b = i + PART; continue; }  // it overlaps or touches the run before it: the same run
    if (a >= 0) { out += s.slice(from, a) + '[the key]'; from = b; }
    a = i; b = i + PART;
  }
  if (a < 0) return s;
  return out + s.slice(from, a) + '[the key]' + s.slice(b);
}

// every purpose a seal may begin with, the app over: a legacy seal is one that begins with none of them
const PURPOSES = /^(minds:[a-z0-9_-]{1,40}:|deepgram:)/;

// safe: Electron's safeStorage, or a stand-in with the same calls, or nothing.
//   kind()                     -> Promise of 'async' | 'sync' | 'none': the store that protects a key here, asked each time
//   seal(purpose, key)         -> Promise of the sealed key (base64), or null where no store protects it
//   open(purpose, b64, legacy) -> Promise of { key, again } or null. key: the key, if the seal is this purpose's (or,
//                                 with legacy true, a seal with no purpose at all). again: a new seal (base64) to keep
//                                 in the old one's place, when the store asked for one or the old one had no purpose;
//                                 else null. null: another user's, another PC's, another purpose's, or not a seal.
function create(safe) {
  const has = (...names) => !!safe && names.every(n => typeof safe[n] === 'function');
  // The asynchronous calls where they are there AND say they can protect. Where they are absent, or say they cannot
  // (or throw), the synchronous ones are asked, while this Electron still has them: a store that answers "not yet" as
  // the app starts must not make every kept key vanish for the run (the review of this file). Neither: 'none'.
  async function kind() {
    if (has('isAsyncEncryptionAvailable', 'encryptStringAsync', 'decryptStringAsync')) {
      try { if ((await safe.isAsyncEncryptionAvailable()) === true) return 'async'; } catch (e) { /* asked of the synchronous calls below */ }
    }
    if (has('isEncryptionAvailable', 'encryptString', 'decryptString')) {
      try { return safe.isEncryptionAvailable() === true ? 'sync' : 'none'; } catch (e) { return 'none'; }
    }
    return 'none';
  }
  async function sealWith(k, text) {
    try {
      if (k === 'async') return Buffer.from(await safe.encryptStringAsync(text)).toString('base64');
      if (k === 'sync') return Buffer.from(safe.encryptString(text)).toString('base64');
    } catch (e) { /* the store would not: no seal */ }
    return null;
  }
  async function seal(purpose, key) {
    if (typeof purpose !== 'string' || !PURPOSES.test(purpose) || typeof key !== 'string' || !key) return null;
    return sealWith(await kind(), purpose + key);
  }
  async function open(purpose, b64, legacy) {
    if (typeof purpose !== 'string' || !PURPOSES.test(purpose) || typeof b64 !== 'string' || !b64) return null;
    const k = await kind();
    let text = null, asked = false;
    try {
      const buf = Buffer.from(b64, 'base64');
      if (k === 'async') { const r = await safe.decryptStringAsync(buf); text = r && typeof r.result === 'string' ? r.result : null; asked = !!(r && r.shouldReEncrypt === true); }
      else if (k === 'sync') { const t = safe.decryptString(buf); text = typeof t === 'string' ? t : null; }
    } catch (e) { return null; }                    // another user's, or another PC's: no key
    if (!text) return null;
    let key = null, bare = false;
    if (text.indexOf(purpose) === 0 && text.length > purpose.length) key = text.slice(purpose.length);
    else if (legacy === true && !PURPOSES.test(text)) { key = text; bare = true; }
    if (!key) return null;
    // sealed again when the store asks for it (its own key rotated), or to give a bare key its purpose
    const again = asked || bare ? await sealWith(k, purpose + key) : null;
    return { key, again };
  }
  return { kind, seal, open };
}

module.exports = { create, strike, PART, PURPOSES };
