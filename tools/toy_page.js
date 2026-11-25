// A stand-in for the page, for the headless suites of the order line's parts: elements that keep their children, their
// text, their data and their listeners, and a TitanicApp with the hooks, the page's clock and its timers, on a real
// 1912 watch stepped by the model. It is NOT the page: what the page shows, where it stands and what a real click does
// are the browser suites'. (tools/minds_part_tests.js was written first and keeps its own copy of this.)
//
//   const P = require('./toy_page.js')({ minutes: 2, parts: ['86_crew.js', '89_voice.js'] });
//   P.A (TitanicApp), P.sim, P.step(n), P.tick(ms), P.byId(id), P.store, P.lines(), P.last(n), P.toasts, P.holds, P.errors,
//   P.fireWindow(type, event) (the window's own events, such as its blur), P.freshWatch() (a new watch of the same night at
//   the same point, to put in A.state.sim: order, step and clockOf act on whatever watch is there)
'use strict';
const path = require('path');
module.exports = function toyPage(o) {
  o = o || {};
  const root = path.join(__dirname, '..');
  const C = require(path.join(root, 'core', 'core.js')), N = require(path.join(root, 'core', 'night.js')), Mo = require(path.join(root, 'core', 'motion.js'));
  for (const f of ['people', 'world', 'reports']) require(path.join(root, 'core', 'readers', f + '.js'));

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
    replaceChild(n, old) { const i = this.nodes.indexOf(old); if (i < 0) throw new Error('replaceChild: not a child'); if (n.parentNode) n.parentNode.removeChild(n); this.nodes[this.nodes.indexOf(old)] = n; n.parentNode = this; old.parentNode = null; return old; }
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
  const panel = new El('div'); panel.id = 'panel';
  const watchSec = new El('div'); watchSec.id = 'watchSec'; panel.appendChild(watchSec);
  const store = {}, winOn = {};
  global.window = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    addEventListener: (t, f) => { (winOn[t] = winOn[t] || []).push(f); }, removeEventListener: (t, f) => { winOn[t] = (winOn[t] || []).filter(x => x !== f); } };
  const fireWindow = (t, e) => { for (const f of (winOn[t] || []).slice()) f(Object.assign({ preventDefault() {}, stopPropagation() {} }, e || {})); };
  global.document = { createElement: (t) => new El(t), createTextNode: (s) => Object.assign(new El('#text'), { _text: String(s) }), getElementById: byId, activeElement: null };
  global.location = { hash: '' };
  global.Option = function (label, value) { const x = new El('option'); x._text = label; x.value = value; return x; };

  // ---------------------------------------------------------------- a toy TitanicApp on a real watch
  const sim = N.create(C.buildShip(), N.spec(1912), { auto: true });
  const minutes = typeof o.minutes === 'number' ? o.minutes : 2;
  while (!(sim.night.tTouch >= 0 && sim.t >= sim.night.tTouch + minutes * 60)) N.step(sim);
  const hooks = {}, toasts = [], holds = [], timers = [];
  let now = 0, pace = 1;
  const A = {
    state: { sim, night: { mode: 'auto', seed: 1912 }, playing: true, speed: 1 },
    on(kind, fn) { (hooks[kind] = hooks[kind] || []).push(fn); return fn; },
    emit(kind, ...a) { for (const f of hooks[kind] || []) f(...a); },
    // (the watch in A.state.sim: a test may put another night there, as the page does at a new run)
    order(type, value, arg) { const r = N.act(A.state.sim, type, value, arg); A.state.night.mode = 'you'; A.emit('event', 'order'); return r; },
    toast(t) { toasts.push(String(t)); },
    clockOf(t) { const s = (A.state.sim.night.spec.clock0 + t) % 86400, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + (h >= 12 ? ' pm' : ' am'); },
    gone(s) { return N.over(s); },
    now() { return now; },
    after(ms, fn) { const t = { at: now + ms, fn }; timers.push(t); return t; },      // as the page's: a timer that can be taken back
    cancelAfter(t) { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
    holdPace(sec, owner) { holds.push([sec, owner]); },
    pace() { return pace; },
  };
  const tick = (ms) => { now += ms; for (;;) { const due = timers.filter(t => t.at <= now); if (!due.length) break; for (const t of due) { timers.splice(timers.indexOf(t), 1); t.fn(); } } A.emit('frame', now); };
  const step = (n) => { for (let i = 0; i < (n || 1); i++) { const s = A.state.sim; N.step(s); A.emit('step', s); } A.emit('frame', now); };
  // a fresh watch of the same night at the same point as the page's first (the 1912 watch, `minutes` after the touch)
  const freshWatch = () => { const s = N.create(C.buildShip(), N.spec(1912), { auto: true }); while (!(s.night.tTouch >= 0 && s.t >= s.night.tTouch + minutes * 60)) N.step(s); return s; };
  window.TitanicApp = A; window.TitanicNight = N; window.TitanicMotion = Mo;
  window.TitanicCrewWords = require(path.join(root, 'site', 'parts', '85_crew_words.js'));
  window.TitanicMindsWords = require(path.join(root, 'site', 'parts', '87_minds_words.js'));
  const errors = [], cerr = console.error;
  console.error = (...a) => { errors.push(a.map(x => (x && x.stack) || String(x)).join(' ')); };
  for (const p of o.parts || ['86_crew.js']) require(path.join(root, 'site', 'parts', p));
  const lines = () => A.crew.lines().map(l => (l.who ? l.who + ': ' : '') + l.words + ' [' + l.kind + (l.imagined ? ', imagined' : '') + (l.floor ? ', floor' : '') + ']');
  return { A, sim, N, step, tick, byId, store, lines, last: (n) => lines().slice(-(n || 1)), toasts, holds, errors, setPace: (p) => { pace = p; }, restore: () => { console.error = cerr; }, window: global.window, fireWindow, freshWatch };
};
