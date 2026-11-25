// Ask the bridge, stage A: the page's two parts on the order line (site/parts/86_crew.js, 88_minds.js) run in plain Node
// against a stand-in for the page, so that their own logic is held without a browser:
//   node tools/minds_part_tests.js
// The stand-in is a toy: elements that keep their children, their text, their data and their listeners, and a
// TitanicApp with the hooks, the page's clock and its timers, on a real 1912 watch stepped by the model. It is NOT the
// page: what the page shows, where it stands and what a real click does are tools/minds_site_test.js's, in a browser.
// What it holds is that each path of the parts runs to its end and leaves what it should in the talk, the tape and the
// watch's log: a question asked and answered; an order offered, given, declined, overtaken, withdrawn, lapsed; a helm
// order without her head, or one that does not agree; a man gone on his own errand; a reply that fails twice; a line
// that looks like a key; the key's field; a provider's fault; a transport that throws, answers nonsense, or never
// answers; two awaited; a reset; an answer after she has gone. And that nothing reached console.error.
'use strict';
const W = require('path').join(__dirname, '..').replace(/\\/g, '/');
const C = require(W + '/core/core.js'), N = require(W + '/core/night.js'), Mo = require(W + '/core/motion.js');
for (const f of ['people', 'world', 'reports']) require(W + '/core/readers/' + f + '.js');

// ---------------------------------------------------------------- a toy DOM
const all = [];
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.nodes = []; this.parentNode = null; this.dataset = {}; this.attrs = {}; this.listeners = {}; this.hidden = false; this._text = '';
    this.className = ''; this.value = ''; this.checked = false; this.disabled = false; this.id = ''; this.title = ''; this.style = {}; this.type = ''; this.placeholder = ''; this.open = false;
    const cls = () => this.className.split(/\s+/).filter(Boolean), self = this;
    this.classList = { add(c) { if (!cls().includes(c)) self.className = cls().concat(c).join(' '); }, remove(c) { self.className = cls().filter(x => x !== c).join(' '); },
      toggle(c, on) { if (on === undefined ? !cls().includes(c) : on) this.add(c); else this.remove(c); }, contains(c) { return cls().includes(c); } };
    all.push(this);
  }
  get children() { return this.nodes.filter(n => n.tagName !== '#TEXT'); }
  get textContent() { return this._text + this.nodes.map(c => c.textContent).join(''); }
  set textContent(v) { for (const c of this.nodes) c.parentNode = null; this.nodes = []; this._text = String(v); }
  append(...kids) { for (const k of kids) this.appendChild(typeof k === 'string' ? Object.assign(new El('#text'), { _text: k }) : k); }
  appendChild(k) { if (k.parentNode) k.parentNode.removeChild(k); k.parentNode = this; this.nodes.push(k); return k; }
  insertBefore(k, ref) { if (k.parentNode) k.parentNode.removeChild(k); k.parentNode = this; const i = ref ? this.nodes.indexOf(ref) : -1; if (i < 0) this.nodes.push(k); else this.nodes.splice(i, 0, k); return k; }
  removeChild(k) { const i = this.nodes.indexOf(k); if (i < 0) throw new Error('removeChild: not a child'); this.nodes.splice(i, 1); k.parentNode = null; return k; }
  replaceChild(n, o) { const i = this.nodes.indexOf(o); if (i < 0) throw new Error('replaceChild: not a child'); if (n.parentNode) n.parentNode.removeChild(n); this.nodes[this.nodes.indexOf(o)] = n; n.parentNode = this; o.parentNode = null; return o; }
  get firstElementChild() { return this.children[0] || null; }
  get lastElementChild() { const c = this.children; return c[c.length - 1] || null; }
  get nextSibling() { const p = this.parentNode; if (!p) return null; return p.nodes[p.nodes.indexOf(this) + 1] || null; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] === undefined ? null : this.attrs[k]; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  fire(t, e) { for (const f of this.listeners[t] || []) f(Object.assign({ preventDefault() {}, stopPropagation() {}, key: '', isComposing: false }, e || {})); }
  click() { this.fire('click'); }
  focus() {}
}
const byId = (id) => all.filter(e => e.id === id).pop() || null;
const stage = new El('div'); stage.id = 'panel';
const watchSec = new El('div'); watchSec.id = 'watchSec'; stage.appendChild(watchSec);
const store = {};
global.window = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } } };
global.document = { createElement: (t) => new El(t), createTextNode: (s) => Object.assign(new El('#text'), { _text: String(s) }), getElementById: byId, activeElement: null };
global.location = { hash: '' };
global.Option = function (label, value) { const o = new El('option'); o._text = label; o.value = value; return o; };

// ---------------------------------------------------------------- a toy TitanicApp on a real watch
const sim = N.create(C.buildShip(), N.spec(1912), { auto: true });
while (!(sim.night.tTouch >= 0 && sim.t >= sim.night.tTouch + 120)) N.step(sim);
const hooks = {}, toasts = [], holds = [], timers = [];
let now = 0, scrubNow = false;
const A = {
  // a stand-in for NH4's scrubber (the page's own, not yet on main): the parts' keepers by name, and whether a scrub is under way
  keepers: [], keeper(name, k) { A.keepers.push({ name, k }); }, scrubbing() { return scrubNow; },
  state: { sim, night: { mode: 'auto', seed: 1912 }, playing: true, speed: 1 },
  on(kind, fn) { (hooks[kind] = hooks[kind] || []).push(fn); return fn; },
  emit(kind, ...a) { for (const f of hooks[kind] || []) f(...a); },
  order(type, value, arg) { const r = N.act(sim, type, value, arg); A.state.night.mode = 'you'; A.emit('event', 'order'); return r; },
  toast(t) { toasts.push(String(t)); },
  clockOf(t) { const s = (sim.night.spec.clock0 + t) % 86400, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + (h >= 12 ? ' pm' : ' am'); },
  gone(s) { return N.over(s); },
  now() { return now; },
  after(ms, fn) { timers.push({ at: now + ms, fn }); },
  holdPace(sec, owner) { holds.push([sec, owner]); },
  pace() { return 1; },
};
const tick = (ms) => { now += ms; for (;;) { const due = timers.filter(t => t.at <= now); if (!due.length) break; for (const t of due) { timers.splice(timers.indexOf(t), 1); t.fn(); } } A.emit('frame', now); };
const step = (n) => { for (let i = 0; i < n; i++) { N.step(sim); A.emit('step', sim); } A.emit('frame', now); };
window.TitanicApp = A; window.TitanicNight = N; window.TitanicMotion = Mo;
window.TitanicCrewWords = require(W + '/site/parts/85_crew_words.js');
window.TitanicMindsWords = require(W + '/site/parts/87_minds_words.js');
const errors = [], cerr = console.error; console.error = (...a) => { errors.push(a.map(x => (x && x.stack) || String(x)).join(' ')); };
require(W + '/site/parts/86_crew.js');
require(W + '/site/parts/88_minds.js');

const lines = () => A.crew.lines().map(l => (l.who ? l.who + ': ' : '') + l.words + ' [' + l.kind + (l.imagined ? ', imagined' : '') + (l.floor ? ', floor' : '') + ']');
const last = (n) => lines().slice(-(n || 1));
const out = []; let fails = 0;
const say = (what, ok, detail) => { if (!ok) fails++; out.push((ok ? 'PASS ' : 'FAIL ') + what + (detail ? '  [' + String(detail).slice(0, 200) + ']' : '')); };
const TABLE = [
  { seat: 'murdoch', when: 'what did you see', replies: [{ say: 'Ice, sir, close ahead, and she went by it on the starboard side.', order: null }] },
  { seat: 'murdoch', when: 'what now', replies: [{ say: 'Yes, sir. Stop her.', order: 'stop' }] },
  { seat: 'murdoch', when: 'bare helm', replies: [{ say: 'Yes, sir. Hard a-port.', order: 'hard a-port' }] },
  { seat: 'murdoch', when: 'reversed', replies: [{ say: 'Yes, sir.', order: 'hard to starboard, her head to starboard' }] },
  { seat: 'murdoch', when: 'what of the helm', replies: [{ say: 'Yes, sir. Hard a-starboard.', order: 'Hard a-starboard, her head to port' }] },
  { seat: 'boxhall', when: 'go and look', replies: [{ say: 'Yes, sir. I will go to the mail room and look.', order: 'go to the mail room and look' }] },
  { seat: 'murdoch', when: 'how deep', replies: [{ say: 'Okay, sir: there are 37 feet of water in her.', order: null }] },
  { replies: [{ say: 'All right, sir.', order: null }] },
];
(async () => {
  try {
    say('the parts loaded: TitanicApp.crew and TitanicApp.minds are there', !!A.crew && !!A.minds && typeof A.crew.hear === 'function');
    say('"They speak up unasked" is on unless the player has switched it off', A.minds.speaks() === true && store['titanic.minds.speaks'] === undefined);
    A.minds.setSpeaks(false);                            // off for the rows below, which count the questions asked; its own rows switch it on again
    A.emit('frame', now);
    say('no transport: the fold says the desktop app is needed', byId('mindsNone').hidden === false && byId('mindsCtl').hidden === true, byId('mindsNone').textContent.slice(0, 50));
    // WHAT A NEWCOMER MEETS (the public release): the words before any key goes in, and three orders to try
    {
      const chips = all.filter(e => e.className === 'chip crew-try-chip'), line = byId('crewLine'), n0 = sim.night.log.length, t0 = A.crew.lines().length;
      const stop = chips.filter(c => c.dataset.words === 'Stop')[0];
      if (stop) stop.click();
      const filled = line.value, given = sim.night.log.length - n0, talked = A.crew.lines().length - t0;
      line.value = '';
      say('a newcomer\'s first lines: the intro says the order line needs no key and sends nothing; three orders to try, each one the order line reads as an order, and a chip writes its words into the line and gives nothing',
        /needs no key and sends nothing anywhere/.test(byId('crewIntro').textContent) && byId('crewIntro').hidden === false && chips.length === 3 && byId('crewTry').hidden === false && filled === 'Stop' && given === 0 && talked === 0
        && chips.every(c => A.crew.reads(c.dataset.words) === true) && /Nothing has been said yet/.test(byId('crewEmpty').textContent) && byId('crewEmpty').hidden === false,
        chips.map(c => c.dataset.words).join(' | ') + '; a click wrote "' + filled + '", gave ' + given);
      say('  the words before any key goes in, on a page with no app: optional, only in the desktop app, with a key of your own that stays on your PC',
        /^Optional, and only in the desktop app/.test(byId('mindsNone').textContent) && /a key of your own that stays on your PC/.test(byId('mindsNone').textContent), byId('mindsNone').textContent.slice(0, 60));
    }
    A.crew.give('Mr Murdoch, what did you see?');
    say('no transport: step 1 answers', /couldn't say/.test(last()[0]), last()[0]);
    const T = A.minds.fake({ on: false, delay: 0, table: TABLE, needsKey: true });
    await A.minds.useTransport(T); A.emit('frame', now);
    say('a transport switched off: the controls show, off', byId('mindsCtl').hidden === false && A.minds.on() === false);
    {
      const t = byId('mindsAbout').textContent;
      say('  in the app, before any key goes in, the controls begin with what this is: optional and off at each start; the key the player\'s own, kept on this PC and sent only to the provider he chooses, who bills him; the app asks first',
        /^Optional, and off each time the app starts/.test(t) && /key of your own/.test(t) && /kept on this PC, encrypted by Windows/.test(t) && /sent only to the provider you choose, who bills you/.test(t) && /the app asks you, in a message box of its own/.test(t)
        && /needs no key/.test(t), t.slice(0, 60));
    }
    {
      // THE RED TEAM'S ROW 9 (release candidate 1): the men's own words are their testimony. The lines here are a language
      // model's, and the fold, its switch and "They speak up unasked" say so; this row fails on the words before
      const fold = byId('mindsFold').textContent;
      const ok9 = !/their own words|in the words of the man/.test(fold) && /The men on the bridge answer \(written by a language model, from what each man knows\)/.test(fold)
        && /in words a language model you choose writes for them, in character, each line marked imagined/.test(byId('mindsNone').textContent)
        && /in words a language model writes for them, in character, each line marked imagined/.test(byId('mindsAbout').textContent) && /given by the man who brings it, in words the model writes/.test(fold);
      say('  the fold, its switch and "They speak up unasked" call the lines a language model\'s, in character, each marked imagined: never the men\'s own words',
        ok9, (fold.match(/their own words|in the words of the man/) || ['no "own words"'])[0] + '; ' + fold.slice(fold.indexOf('The men on the bridge answer'), fold.indexOf('The men on the bridge answer') + 80));
    }
    byId('mindsOn').checked = true; byId('mindsOn').fire('change'); await new Promise(r => setImmediate(r)); await A.minds.refresh(); A.emit('frame', now);
    say('switched on by its box', A.minds.on() === true && byId('mindsWho').hidden === false, 'who: ' + byId('mindsWhere').textContent.slice(0, 70));
    // a question
    A.crew.give('Mr Murdoch, what did you see?');
    say('asked: the line says so; awaited', /has been asked/.test(last()[0]) && A.minds.awaited().join() === 'murdoch', last()[0]);
    tick(10);
    say('answered: marked as imagined', /Mr Murdoch: Ice, sir/.test(last()[0]) && /imagined/.test(last()[0]) && A.minds.awaited().length === 0, last()[0]);
    // an offer, given
    const n0 = sim.night.log.length;
    A.crew.give('Mr Murdoch, what now?'); tick(10);
    say('an order offered', !!A.minds.offer() && byId('mindsOffer').hidden === false, byId('mindsOfferText').textContent + ' / ' + byId('mindsGive').textContent);
    A.crew.give('Mr Phillips, yes');
    say('"Mr Phillips, yes": the offer stands, a notice', !!A.minds.offer() && /no line to the bridge/.test(last()[0]), last()[0]);
    A.crew.give('Mr Moody, yes'); tick(10);
    say('"Mr Moody, yes" is a question to Mr Moody, and Mr Murdoch\'s offer stands', !!A.minds.offer(), last()[0]);
    // (the second review) the captain is now speaking with Mr Moody: a bare "yes" is a word to HIM. It gave Mr Murdoch's
    // offered order before, an order to the ship the captain had not meant
    const q1 = T.requests.length;
    A.crew.give('yes'); tick(10);
    say('a bare "yes" once the captain has spoken to Mr Moody goes to Mr Moody: Mr Murdoch\'s offered order is not given by it', !!A.minds.offer() && sim.night.log.length === n0 && T.requests.length === q1 + 1 && /Mr Moody: All right, sir/.test(last()[0]),
      last()[0] + '; log +' + (sim.night.log.length - n0));
    A.crew.give('very well'); tick(10);
    say('  nor by "very well", which is his too', !!A.minds.offer() && sim.night.log.length === n0, last()[0]);
    byId('mindsGive').click();
    const e1 = sim.night.log[sim.night.log.length - 1];
    say('given by "Give it": in the log, step 1 answers', sim.night.log.length === n0 + 1 && e1.type === 'telegraph' && e1.value === 'stop' && A.minds.offer() === null, last(2).join(' / '));
    // a bare helm order is dropped with a notice; a reversed one too; one that names her head is offered and given
    A.crew.give('Mr Murdoch, the bare helm if you please'); tick(10);
    say('a helm order without her head: dropped, said in a notice', A.minds.offer() === null && /order is not given: a helm order must say/.test(last()[0]), last()[0].slice(0, 120));
    A.crew.give('Mr Murdoch, the reversed one'); tick(10);
    say('helm words and head that do not agree: dropped', A.minds.offer() === null && /do not agree/.test(last()[0]), last()[0].slice(0, 130));
    A.crew.give('Mr Murdoch, what of the helm?'); tick(10);
    say('named and agreeing: offered with her head', !!A.minds.offer() && /her head to port/.test(byId('mindsGive').textContent), byId('mindsGive').textContent);
    // overtaken by a typed order of its kind
    A.crew.give('midships');
    say('a typed helm order overtakes the helm offer', A.minds.offer() === null && lines().some(l => /Not given: Hard a-starboard \(another order/.test(l)), lines().filter(l => /Not given/.test(l)).pop());
    // "no"
    A.crew.give('Mr Murdoch, what now?'); tick(10);
    A.crew.give('no');
    say('"no" declines', A.minds.offer() === null && /Not given: Stop\./.test(last()[0]) && A.minds.tape().slice(-1)[0].end === 'declined', last()[0]);
    // a captain's other words for yes, to the man who offered it: the order is given, and no question is spent on it
    A.crew.give('Mr Murdoch, what now?'); tick(10);
    const q2 = T.requests.length;
    A.crew.give('Very well.');
    say('"Very well." to the man who offered it gives his order, and asks nobody anything', A.minds.offer() === null && A.minds.tape().slice(-1)[0].end === 'given' && T.requests.length === q2, last(2).join(' / '));
    // act on my word; Boxhall goes himself and is then away
    byId('mindsAct').children[1].click();
    say('"Act on my word" chosen', A.minds.act() === 'act');
    for (let i = 0; i < 6000 && !A.minds.reach().boxhall.in; i++) step(1);           // (on the 1912 night he is forward until about T+9)
    const reach0 = A.minds.reach().boxhall;
    A.crew.give('Mr Boxhall, go and look at the mail room'); tick(10);
    const e2 = sim.night.log[sim.night.log.length - 1], reach1 = A.minds.reach().boxhall;
    say('Mr Boxhall goes by his own answer: the order is given, and he is then away', reach0.in && e2.type === 'report:look' && !reach1.in, JSON.stringify(A.minds.sent()) + ' ' + reach1.where + ' (before: ' + reach0.where + ')');
    A.crew.give('Mr Boxhall, what do you see?');
    say('asked again, he is not there: a notice, no request', /has gone/.test(last()[0]), last()[0]);
    byId('mindsAct').children[0].click();
    // a reply that fails its checks twice: the floor
    const q0 = T.requests.length;
    A.crew.give('Mr Murdoch, how deep is it?'); tick(10); tick(10);
    say('fails twice: two requests, then the authored line', T.requests.length === q0 + 2 && /Mr Murdoch: I couldn't say, sir\. \[mind, floor\]/.test(last()[0]), last()[0] + '; ' + (T.requests.length - q0) + ' requests');
    // a key-like line
    const kept0 = A.crew.kept().length;
    A.crew.give('sk-test-0123456789abcdefghijklmnopqrstuv');
    say('a key-like line: a notice, not kept, not sent', /looks like a key/.test(last()[0]) && A.crew.kept().length === kept0 && !JSON.stringify(T.requests).includes('sk-test'), last()[0].slice(0, 60));
    // the key field, "Try it", the limits, the provider's list
    byId('mindsKey').value = 'test-key-0123456789-not-a-secret'; byId('mindsKeySave').click(); await new Promise(r => setImmediate(r)); await A.minds.refresh(); A.emit('frame', now);
    say('the key field is cleared and a key is kept', byId('mindsKey').value === '' && A.minds.status().hasKey === true, byId('mindsKeyNote').textContent.slice(0, 60));
    byId('mindsTry').click(); tick(10);
    say('"Try it" says it answered', /It answered in/.test(byId('mindsTryOut').textContent), byId('mindsTryOut').textContent);
    // an offer withdrawn when the minds are switched off; a never-answering transport is bounded
    A.crew.give('Mr Murdoch, what now?'); tick(10);
    byId('mindsOn').checked = false; byId('mindsOn').fire('change'); await new Promise(r => setImmediate(r)); await A.minds.refresh(); A.emit('frame', now);
    say('switched off, the offer is withdrawn', A.minds.offer() === null && lines().some(l => /were switched off/.test(l)), lines().filter(l => /Not given/.test(l)).pop());
    await A.minds.useTransport({ status: () => Promise.resolve({ ok: true, on: true, provider: 'x', providers: [], limits: { questions: 9, tokens: 9000 }, used: { questions: 0, tokens: 0 } }), ask: () => new Promise(() => {}), usage: () => Promise.resolve(null) });
    A.emit('frame', now);
    A.crew.give('Mr Murdoch, anything?');
    const aw = A.minds.awaited().length; tick(91000);
    say('a transport that never answers: awaited, then a notice after the page\'s own bound', aw === 1 && A.minds.awaited().length === 0 && /No answer from Mr Murdoch/.test(last()[0]), last()[0]);
    // ---- the paths the review listed as untested
    const T2 = A.minds.fake({ on: true, delay: 5000, table: TABLE });
    await A.minds.useTransport(T2); A.emit('frame', now);
    for (let i = 0; i < 6000 && !(A.minds.reach().boxhall.in && A.minds.reach().moody.in); i++) step(1);
    // two awaited; a second question to a man awaited; a third man
    A.crew.give('Mr Murdoch, what did you see?'); A.crew.give('Mr Murdoch, and then?');
    const again = last()[0];
    A.crew.give('Mr Moody, anything?'); A.crew.give('Mr Boxhall, anything?');
    say('one question to a man at a time; two awaited at most', /has not answered yet/.test(again) && /Two answers are awaited already/.test(last()[0]) && A.minds.awaited().length === 2, again + ' / ' + last()[0]);
    say('the pace is held while they are awaited', holds.length > 0 && holds[holds.length - 1][1] === 'minds' && holds[holds.length - 1][0] > 0, JSON.stringify(holds[holds.length - 1]));
    tick(5001);
    say('both answered; the hold given back', A.minds.awaited().length === 0 && holds[holds.length - 1][0] === 0, last(2).join(' / '));
    // a second offer takes the place of the first; then it lapses after a minute of her time
    A.crew.give('Mr Murdoch, what now?'); tick(5001);
    const first = A.minds.offer();
    A.crew.give('Mr Murdoch, what of the helm?'); tick(5001);
    const second = A.minds.offer(), ends = A.minds.tape().slice(-2).map(t => t.end);
    say('a second offer takes the place of the first', !!first && !!second && first.order.type === 'telegraph' && second.order.type === 'helm' && /another order was offered/.test(ends[0]) && ends[1] === 'offered', ends.join(' | '));
    step(239); const before = !!A.minds.offer(); step(2);
    say('an offer lapses after a minute of her time', before && A.minds.offer() === null && lines().some(l => /The offer lapsed after a minute/.test(l)), lines().filter(l => /lapsed/.test(l)).pop());
    // a provider's fault is a notice nobody says
    await A.minds.useTransport({ status: () => Promise.resolve({ ok: true, on: true, provider: 'x', providers: [], limits: { questions: 9, tokens: 9000 }, used: { questions: 0, tokens: 0 } }),
      ask: () => Promise.resolve({ ok: false, kind: 'auth', why: 'The provider refused the key (401).' }), usage: () => Promise.resolve(null) });
    A.emit('frame', now);
    A.crew.give('Mr Murdoch, anything?'); await new Promise(r => setImmediate(r)); await new Promise(r => setImmediate(r)); A.emit('frame', now);
    say('a fault is a notice, nobody\'s words', /^No answer from Mr Murdoch \(The provider refused the key \(401\)\)\. The watch was not stopped\. \[notice\]$/.test(last()[0]) && A.minds.tape().slice(-1)[0].end === 'dropped: auth', last()[0]);
    // a transport that throws, and one that answers nonsense
    await A.minds.useTransport({ status: () => Promise.resolve({ ok: true, on: true, provider: 'x', providers: [], limits: {}, used: {} }), ask: () => { throw new Error('boom'); } });
    A.emit('frame', now);
    A.crew.give('Mr Murdoch, anything?');
    say('a transport that throws: a notice, nothing awaited', /^No answer from Mr Murdoch/.test(last()[0]) && A.minds.awaited().length === 0, last()[0]);
    await A.minds.useTransport({ status: () => Promise.resolve({ ok: true, on: true, provider: 'x', providers: [], limits: {}, used: {} }), ask: () => Promise.resolve({ ok: true, text: 12345, usage: 'x' }) });
    A.emit('frame', now);
    A.crew.give('Mr Murdoch, anything?'); for (let i = 0; i < 6; i++) await new Promise(r => setImmediate(r)); A.emit('frame', now);
    say('an answer that is not text: asked once more, then the authored line', /I couldn't say, sir\. \[mind, floor\]/.test(last()[0]), last()[0]);
    // a reset while an answer is awaited: the late answer is dropped
    await A.minds.useTransport(T2); A.emit('frame', now);
    A.crew.give('Mr Murdoch, what did you see?');
    A.emit('reset'); const n1 = lines().length; tick(5001);
    say('a reset while awaited: the late answer shows nothing', A.minds.awaited().length === 0 && lines().length === n1 && A.minds.tape().length === 0, lines().length + ' lines');
    // an answer that comes after she has gone
    A.crew.give('Mr Murdoch, what did you see?');
    const realGone = A.gone; A.gone = () => true; tick(5001); A.gone = realGone;
    say('an answer after she has gone is not shown', lines().some(l => /answer came after she had gone/.test(l)) && A.minds.tape().slice(-1)[0].end === 'dropped: she has gone', lines().filter(l => /had gone/.test(l)).pop());
    // ---- the bridge speaks (design 14, stage C): a switch of its own, on by default (held, then switched off, at the
    // top); on, a report that reaches the bridge by a man is given unasked, in the words of the man who brings it
    A.emit('reset');
    {
    const MW = window.TitanicMindsWords;
    const T3 = A.minds.fake({ on: true, delay: 500, table: TABLE.concat([{ report: true, when: 'sounding once more', replies: [{ say: 'Okay, sir: 99 feet of it.', order: null }] }]) });
    await A.minds.useTransport(T3); A.emit('frame', now);
    const newest = () => { const v = MW.gather(sim), F = v.reports.feed; return F.length ? MW.speaker(v, F[F.length - 1], A.minds.sent()) : null; };
    // the model's own steps until a report a man of the cast would give has reached the bridge
    const untilReport = (max) => { let n = sim.reports.feed.length; for (let i = 0; i < max; i++) { step(1); if (sim.reports.feed.length > n) { const sp = newest(); if (sp) return sp; n = sim.reports.feed.length; } } return null; };
    const bring = (words) => { sim.reports.feed.push({ n: sim.reports.feed.length, t: sim.t, tFact: sim.t, ch: 'runner', who: 'The carpenter', by: 'in person', words, kind: 'report', rule: 'holds', qty: '', data: null }); step(1); };
    const said = () => A.minds.tape().filter(t => t.kind === 'report');
    const r0 = T3.requests.length, l0 = lines().length;
    const sp1 = untilReport(8000);
    say('switched off: a report reaches the bridge and nothing is asked of anyone', A.minds.speaks() === false && !!sp1 && T3.requests.length === r0 && lines().length === l0, sp1 ? sp1.seat + ' would have given it (' + sp1.how + ')' : 'no report came');
    byId('mindsSpeaks').checked = true; byId('mindsSpeaks').fire('change'); step(1);
    const h0 = holds.length, sp2 = untilReport(8000), e2 = sim.reports.feed[sim.reports.feed.length - 1];
    const t2 = said().slice(-1)[0] || {};
    say('switched on: the next report is asked of the man who would give it, with no line and no hold while it is awaited', A.minds.speaks() === true && !!sp2 && T3.requests.length === r0 + 1 && t2.kind === 'report' && t2.seat === sp2.seat
      && A.minds.awaited().join() === sp2.seat && lines().length === l0 && !holds.slice(h0).some(h => h[1] === 'minds' && h[0] > 0), sp2 ? sp2.seat + ' (' + sp2.how + '): ' + String(e2.words).slice(0, 60) : 'no report came');
    const cue = (T3.requests[T3.requests.length - 1] || {}).changing || '';
    say('  the request ends with the report itself and what to do with it; its stable part is a question\'s own', cue.indexOf(String(e2.words)) > 0 && /Give it to the captain now in your own words/.test(cue.split('\n').pop())
      && (T3.requests[T3.requests.length - 1] || {}).stable === MW.stable(sp2.seat, { convention: '1912' }), cue.split('\n').slice(-2)[0].slice(0, 90));
    tick(600);
    const l2 = A.crew.lines().slice(-1)[0] || {};
    say('  his words come: a line of his own in the talk, marked as imagined', lines().length === l0 + 1 && l2.who === MW.BY[sp2.seat].name && l2.imagined === true && l2.kind === 'mind' && said().slice(-1)[0].end === 'said' && A.minds.awaited().length === 0, last()[0]);
    // one such line in half a minute of her time at most; none at a fast pace; a line that fails the checks is not shown
    const r1 = T3.requests.length;
    bring('Sounding again: 16 ft in No. 1 hold.');
    const soon = T3.requests.length - r1;
    step(125); bring('Sounding again: 17 ft in No. 1 hold.');
    const later = T3.requests.length - r1; tick(600);
    const l3 = A.crew.lines().slice(-1)[0] || {};
    say('  one such line in half a minute of her time at most: a second report at once is not given, one after it is', soon === 0 && later === 1 && /17 ft in No\. 1 hold/.test(l3.words || '') && l3.imagined === true, soon + ' at once; ' + later + ' after 31 s: ' + last()[0]);
    const realPace = A.pace; A.pace = () => 8; step(125); const r2 = T3.requests.length; bring('Sounding again: 18 ft in No. 1 hold.'); const fast = T3.requests.length - r2; A.pace = realPace;
    step(2); bring('Sounding once more: 19 ft in No. 1 hold.'); const r3 = T3.requests.length - r2, l4 = lines().length; tick(600);
    say('  none at a fast pace; back at her own pace it begins with the reports still to come', fast === 0 && r3 === 1, fast + ' at pace 8; ' + r3 + ' after');
    say('  words that fail the checks are not shown, and nothing is said of it', lines().length === l4 && said().slice(-1)[0].end === 'dropped: his words failed the checks', said().slice(-1)[0].end);
    // the captain's question comes first: a report the man is giving unasked gives way to it, and its words are not shown
    step(125); bring('Sounding again: 21 ft in No. 1 hold.');
    const giving = said().slice(-1)[0], rq = T3.requests.length, nl = lines().length;
    A.crew.give('Mr ' + (giving.seat === 'murdoch' ? 'Murdoch' : (giving.seat === 'moody' ? 'Moody' : 'Boxhall')) + ', what did you see?');
    const after = said().slice(-1)[0], waitLine = last()[0];
    tick(600);
    say('  the captain\'s question comes first: the report he was giving unasked gives way, and only his answer is shown', giving.end === null && after.end === 'dropped: the captain spoke to him' && T3.requests.length === rq + 1
      && /has been asked/.test(waitLine) && A.minds.awaited().length === 0 && !lines().slice(nl).some(l => /21 ft in No\. 1 hold, sir/.test(l)) && lines().slice(nl).some(l => /\[mind, imagined\]/.test(l)), after.end + '; ' + last()[0]);
    // ---- a night taken back (NH4's scrubber, D102), on a stand-in for it. The page keeps a minute (each keeper's keep);
    // scrub goes back to it in NH4's own order: scrubbing() true, the sim put back in the same object with the later
    // orders queued as the night's own script, 'reset', each keeper's scrub, scrubbing() false, the event 'scrub'.
    {
      const saveSim = () => { const o = {}; for (const k of Object.keys(sim)) if (k !== 'ship') o[k] = sim[k]; return structuredClone(o); };
      const keepAll = () => ({ sim: saveSim(), mode: A.state.night.mode, states: A.keepers.map(x => ({ name: x.name, state: JSON.parse(JSON.stringify(x.k.keep(sim))) })) });
      let queued = 0;
      const scrubTo = (K, later) => {
        scrubNow = true;
        for (const k of Object.keys(sim)) if (k !== 'ship') delete sim[k];
        Object.assign(sim, structuredClone(K.sim));
        const w = sim.night, had = w.script || [], did = new Uint8Array(had.length + later.length);
        if (w.did) did.set(w.did);
        w.script = had.concat(later.map(o => ({ k: o.k, type: o.type, value: o.value, arg: o.arg }))); w.did = did; queued = later.length;
        A.state.night.mode = K.mode;
        A.emit('reset');
        for (const x of A.keepers) { const s = K.states.find(y => y.name === x.name); x.k.scrub(sim, s ? JSON.parse(JSON.stringify(s.state)) : undefined); }
        scrubNow = false;
        A.emit('event', 'scrub', { m: 0, t: sim.t });
        A.emit('frame', now);
      };
      let orderEvents = 0; A.on('event', (n) => { if (n === 'order') orderEvents++; });
      const saidNow = () => A.crew.talkLog(24).map(e => e.who + ': ' + e.words + (e.imagined ? ' (imagined)' : ''));
      say('both parts gave the page a keeper: the talk, and the crew\'s minds', A.keepers.map(x => x.name).join(', ') === 'crew, minds', A.keepers.map(x => x.name).join(', '));
      tick(600); step(125);                                  // nothing awaited, and half a minute of her time since the last unasked line
      const K = keepAll(), kept = lines().slice(), log0 = sim.night.log.length, tK = sim.t, asks = () => saidNow().filter(l => /what did you see/.test(l)).length, q0 = asks();
      // after the kept minute: a typed order, an order at the page's own controls, a report given unasked, a question
      A.crew.give('half ahead');
      A.order('telegraph', 'stop');
      const rep = { n: sim.reports.feed.length, t: sim.t, tFact: sim.t, ch: 'runner', who: 'The carpenter', by: 'in person', words: 'Sounding again: 25 ft in No. 1 hold.', kind: 'report', rule: 'holds', qty: '', data: null };
      sim.reports.feed.push(Object.assign({}, rep)); step(1); tick(600);
      const given = A.crew.lines().slice(-1)[0] || {};
      A.crew.give('Mr Murdoch, what did you see?'); tick(600);
      const q1 = asks();
      step(20);
      const later = sim.night.log.slice(log0), reqs = T3.requests.length, tapeN = A.minds.tape().length, played = A.minds.played(), logN = sim.night.log.length;
      say('  (the stretch to be taken back: two orders of the player\'s, one report given unasked in a man\'s words, one question answered)', later.length === 2 && given.imagined === true && /25 ft in No\. 1 hold/.test(given.words || '')
        && A.crew.remembered().filter(i => i >= log0).join() === [log0, log0 + 1].join() && A.minds.remembered() >= 1 && played === sim.t, later.map(o => o.type + ':' + o.value).join(', ') + '; ' + (given.who || '?') + ': ' + (given.words || ''));
      orderEvents = 0;
      scrubTo(K, later);
      say('a night taken back: the talk stands as it stood at that minute; nothing is awaited or offered, nobody is asked, and the tape is kept',
        JSON.stringify(lines()) === JSON.stringify(kept) && A.minds.awaited().length === 0 && A.minds.offer() === null && T3.requests.length === reqs && A.minds.tape().length === tapeN && A.minds.played() === played
        && sim.t === tK && sim.night.log.length === log0, lines().length + ' lines as kept; t ' + sim.t + '; ' + (T3.requests.length - reqs) + ' requests');
      // it plays on: the two orders come again by the night's own script on the first step, and the report reaches the bridge again
      sim.reports.feed.push(Object.assign({}, rep)); step(1); tick(600);
      const on1 = saidNow();
      say('  it plays on: the later orders are given again by the night\'s own script, and each is shown with the lines it was first shown with (the captain\'s own, not the officer of the watch\'s)',
        sim.night.log.length === logN && orderEvents === 0 && on1.filter(l => l === 'You: half ahead').length === 1 && on1.filter(l => l === 'You: Stop.').length === 1 && !on1.slice(-6).some(l => /^The officer of the watch: (Half ahead|Stop)!/.test(l)),
        on1.slice(-5).join(' / ') + '; order events: ' + orderEvents);
      say('  the report reaches the bridge again: the line it was given with is shown again, marked as imagined, and nobody is asked',
        on1.filter(l => l === given.who + ': ' + given.words + ' (imagined)').length === 1 && T3.requests.length === reqs && A.minds.tape().length === tapeN && A.minds.awaited().length === 0, (T3.requests.length - reqs) + ' requests; ' + on1.slice(-1)[0]);
      say('  the question the captain asked after that minute is not asked again by anything: it is gone from the talk with its answer', q1 === q0 + 1 && asks() === q0 && T3.requests.length === reqs, 'in the talk: ' + q0 + ' before that minute, ' + q1 + ' when asked, ' + asks() + ' now');
      let guard = 0; while (sim.t <= played && guard++ < 4000) step(1);
      const rqA = T3.requests.length, nA = A.minds.tape().length;
      say('  until the furthest moment played is passed, no report is asked for, whatever comes', rqA === reqs && nA === tapeN && A.minds.played() === sim.t, 'played to ' + A.minds.played());
      step(125); sim.reports.feed.push(Object.assign({}, rep, { n: sim.reports.feed.length, t: sim.t, tFact: sim.t, words: 'Sounding again: 26 ft in No. 1 hold.' })); step(1);
      say('  past it, it is a night like any other: the next report is asked of the man who would give it', T3.requests.length === rqA + 1 && A.minds.awaited().length === 1, (T3.requests.length - rqA) + ' request');
      tick(600);
      // a new order in a night taken back: the page drops the later ones (its takeOver says so), and from there the night is new
      const later2 = sim.night.log.slice(log0);
      scrubTo(K, later2);
      const w2 = sim.night; w2.script = w2.script.slice(0, w2.script.length - queued); w2.did = w2.did.slice(0, w2.script.length);
      A.emit('event', 'ordersDropped', { index: sim.night.log.length, t: sim.t });
      const rqB = T3.requests.length;
      A.crew.give('slow ahead');
      const e3 = sim.night.log[sim.night.log.length - 1];
      say('  a new order in a night taken back: what was remembered from there on is forgotten, and the moments after it are new ones', sim.night.log.length === log0 + 1 && e3.type === 'telegraph'
        && A.crew.remembered().filter(i => i >= log0).join() === String(log0) && A.minds.played() === sim.t && T3.requests.length === rqB, 'remembered from ' + log0 + ' on: ' + A.crew.remembered().filter(i => i >= log0).join() + '; played to ' + A.minds.played() + ', t ' + sim.t);
      step(125); sim.reports.feed.push(Object.assign({}, rep, { n: sim.reports.feed.length, t: sim.t, tFact: sim.t, words: 'Sounding again: 27 ft in No. 1 hold.' })); step(1);
      say('  and there a report is asked for again, as on any night', T3.requests.length === rqB + 1, (T3.requests.length - rqB) + ' request');
      tick(600);

      // ---- THE REVIEW OF THE KEEPERS (an independent reviewer, 2026-11-24): each of its findings, held
      const push = (words) => { const e = { n: sim.reports.feed.length, t: sim.t, tFact: sim.t, ch: 'runner', who: 'The carpenter', by: 'in person', words, kind: 'report', rule: 'holds', qty: '', data: null }; sim.reports.feed.push(Object.assign({}, e)); return e; };
      const count = (words) => saidNow().filter(l => l.indexOf(words) >= 0).length;
      // (1) a new order in a night taken back does NOT forget the line a report was given: the same report (its time, its
      // words) comes again whatever the order was, and it was asked for a second time
      step(125);
      const K1 = keepAll();
      const r1 = push('Sounding again: 31 ft in No. 1 hold.'); step(1); tick(600);
      const had1 = count('31 ft in No. 1 hold, sir'); step(10);
      scrubTo(K1, []);
      const rq1 = T3.requests.length, tp1 = A.minds.tape().length, mem1 = A.minds.remembered();
      A.order('help:lamp', 'cqd');                           // an order that changes nothing the reports read
      const memAfter = A.minds.remembered();
      sim.reports.feed.push(Object.assign({}, r1)); step(1); tick(600);
      say('a new order in a night taken back does not forget what a report was given: the same report comes again, is shown with its line, and nobody is asked a second time',
        had1 === 1 && memAfter === mem1 && count('31 ft in No. 1 hold, sir') === 1 && T3.requests.length === rq1 && A.minds.tape().length === tp1,
        `remembered ${mem1} -> ${memAfter}; shown ${count('31 ft in No. 1 hold, sir')}; requests +${T3.requests.length - rq1}; turns +${A.minds.tape().length - tp1}`);
      // (2) a line that comes just AFTER a kept minute, for a report that reached the bridge just before it
      await T3.set({ delay: 5000 }); step(125);
      const r2 = push('Sounding again: 32 ft in No. 1 hold.'); step(1);
      const awaitedAtKeep = A.minds.awaited().length, K2 = keepAll();          // the minute is kept while his words are awaited
      tick(6000); const had2 = count('32 ft in No. 1 hold, sir');
      await T3.set({ delay: 500 }); step(5);
      scrubTo(K2, []);
      const rq2 = T3.requests.length, at0 = count('32 ft in No. 1 hold, sir');
      step(1); tick(600);
      say('  a line that came just after a kept minute, for a report that reached the bridge just before it, is shown again when the night is taken back to that minute (the report is read again), and nobody is asked',
        awaitedAtKeep === 1 && had2 === 1 && at0 === 0 && count('32 ft in No. 1 hold, sir') === 1 && T3.requests.length === rq2, `awaited at the keep: ${awaitedAtKeep}; at the kept minute ${at0}, one step on ${count('32 ft in No. 1 hold, sir')}; requests +${T3.requests.length - rq2}`);
      // (3) the same with "They speak up unasked" switched off before the night plays on: a line given is the night's own
      scrubTo(K2, []);
      byId('mindsSpeaks').checked = false; byId('mindsSpeaks').fire('change');
      step(1); tick(600);
      const offShown = count('32 ft in No. 1 hold, sir');
      byId('mindsSpeaks').checked = true; byId('mindsSpeaks').fire('change');
      say('  it is shown again whatever "They speak up unasked" says now: the line was given, and showing it asks nobody', offShown === 1 && T3.requests.length === rq2, `shown ${offShown} with the switch off; requests +${T3.requests.length - rq2}`);
      // (4) an offer that stands across a kept minute: the man's own words are in the talk at that minute, and the order
      // given on them is remembered with them. Played on, they are shown once, not twice
      let g4 = 0; while (sim.t <= A.minds.played() && g4++ < 4000) step(1);
      tick(600); step(245);                                  // past any offer's minute
      A.crew.give('Mr Murdoch, what now?'); tick(600);
      const offered4 = !!A.minds.offer(), K4 = keepAll(), log4 = sim.night.log.length;
      byId('mindsGive').click();
      const later4 = sim.night.log.slice(log4), before4 = count('Yes, sir. Stop her.');
      step(4);
      // (5) ... and a question still awaited at the scrub, with that offer's order to come again
      await T3.set({ delay: 5000 }); A.crew.give('Mr Murdoch, what did you see?');
      const awaited5 = A.minds.awaited().length, rq5 = T3.requests.length;
      scrubTo(K4, later4);
      const atScrub = { awaited: A.minds.awaited().length, offer: A.minds.offer(), hold: holds[holds.length - 1], lines: lines().length, words: count('Yes, sir. Stop her.') };
      tick(6000); const lateLines = lines().length; await T3.set({ delay: 500 });
      step(1); tick(600);
      const e4 = sim.night.log[sim.night.log.length - 1] || {};
      say('  a question awaited and an offer standing at the scrub: both end there (the pace\'s hold given back), and the answer that comes late shows nothing', offered4 && awaited5 === 1 && atScrub.awaited === 0 && atScrub.offer === null
        && atScrub.hold[0] === 0 && atScrub.hold[1] === 'minds' && lateLines === atScrub.lines && T3.requests.length === rq5, `awaited ${awaited5} -> ${atScrub.awaited}; offer ${atScrub.offer === null ? 'withdrawn' : 'STANDS'}; lines ${atScrub.lines} -> ${lateLines} after the late answer`);
      say('  the order given on a man\'s word after a kept minute comes again by the night\'s own script, and his words, which stood in the talk at that minute, are shown once, not twice',
        later4.length === 1 && before4 === 1 && atScrub.words === 1 && sim.night.log.length === log4 + 1 && e4.type === 'telegraph' && e4.value === 'stop' && count('Yes, sir. Stop her.') === 1 && count('Stop, sir') >= 1,
        `his words: ${before4} before, ${atScrub.words} at the kept minute, ${count('Yes, sir. Stop her.')} after the order came again; the log +${sim.night.log.length - log4}`);
      // (6) a man's errand is noted again when the night reaches the order by which he went
      let g6 = 0; while (sim.t <= A.minds.played() && g6++ < 4000) step(1);
      for (let i = 0; i < 6000 && !A.minds.reach().boxhall.in; i++) step(1);
      tick(600);
      const K6 = keepAll(), log6 = sim.night.log.length, in6 = A.minds.reach().boxhall.in;
      const lookAft = String(window.TitanicCrewWords.phrase({ type: 'report:look', value: 'aft' })).replace(/[.!]+$/, '');
      A.crew.give('Mr Boxhall, ' + lookAft.charAt(0).toLowerCase() + lookAft.slice(1));
      const went = sim.night.log.length === log6 + 1 && !A.minds.reach().boxhall.in, later6 = sim.night.log.slice(log6);
      step(4); scrubTo(K6, later6);
      const back6 = A.minds.reach().boxhall.in; step(1);
      const again6 = A.minds.reach().boxhall, rq6 = T3.requests.length;
      A.crew.give('Mr Boxhall, what do you see?'); tick(600);
      say('  a man\'s errand is noted again when the night reaches the order by which he went: taken back, he is on the bridge; one step on he has gone again, and a question to him asks nobody',
        in6 && went && back6 === true && again6.in === false && T3.requests.length === rq6, `sent: ${went}; at the kept minute: ${back6 ? 'on the bridge' : 'AWAY'}; one step on: ${again6.in ? 'ON THE BRIDGE' : again6.where}; requests +${T3.requests.length - rq6}`);
      // (7) taken back twice in a row, with nothing played between: as once
      scrubTo(K6, later6); scrubTo(K6, later6);
      const twice = { lines: JSON.stringify(lines()), awaited: A.minds.awaited().length };
      scrubTo(K6, later6);
      say('  taken back twice in a row is as once: the same talk, nothing awaited, nobody asked', JSON.stringify(lines()) === twice.lines && twice.awaited === 0 && T3.requests.length === rq6, lines().length + ' lines');
      step(1); tick(600);
    }
    byId('mindsSpeaks').checked = false; byId('mindsSpeaks').fire('change');
    }
    // steps, a reset
    step(8);
    A.emit('reset');
    say('a reset: nothing awaited, no offer, the tape empty', A.minds.awaited().length === 0 && A.minds.offer() === null && A.minds.tape().length === 0);
    say('console.error was never called', errors.length === 0, errors.slice(0, 2).join(' || ').slice(0, 300));
  } catch (e) {
    fails++; out.push('FAIL the suite could not finish: ' + (e && e.stack || e));
  }
  console.error = cerr;
  console.log(out.join('\n'));
  if (errors.length) console.log('\nconsole.error calls:\n' + errors.slice(0, 4).join('\n---\n').slice(0, 2000));
  console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${out.length} rows`);
  process.exit(fails ? 1 : 0);
})();
