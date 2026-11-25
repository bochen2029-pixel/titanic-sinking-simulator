// One check of the stage's layout (QC C-4's step 0; docs/DESIGN_page_layout_authority_v1_2026-11-21.md, section 3; D78):
// every pair of overlays that overlap, anything outside the stage, any content cut by its own box, and every overlay a
// state must show that is not shown. A pure function of the page's DOM, kept in tools/ so that no page code needs it: a
// suite evaluates it in the page (tools/layout_site_test.js; any part's suite may call it in its own states, one line).
//   const L = require('./layout_check');  const r = await b.ev(L.expr({ expect: ['readouts', 'bridge'] }));
//   node tools/layout_check.js        the geometry's own rows, headless (a second)
// The overlays are the stage's (BEFORE, below: the list step 0 named them by), by their names wherever they stand, and
// whatever else stands in a slot of the page's grid (#hud, its slots [data-area]: C-4's steps 1 and 2), named by its
// data-name, id or first class, its kind by data-kind ('must' or 'last').
// What it returns: { faults, notes, boxes, stage, device, free }. A fault is { kind, a, b?, w?, h?, side?, by?, what? }:
// - overlap: two shown overlays whose boxes meet by more than 1 px both ways (w x h, CSS px);
// - outside: a shown overlay past the stage's edge by more than 0.5 px (side, by);
// - clipped: content cut by its own box (overflow neither visible nor scrolling), or button labels wider than their buttons;
// - missing: an overlay the state must show (expect) that is not shown.
// A note is not a fault: an overlay whose content spills out of its box (its box is then taken as far as the content
// reaches, for the faults above), one that scrolls, buttons under 40 px tall on a touch device, a 'last' overlay hidden
// for want of room (the director's caption: the layout's fit pass hides it where the musts need its room).
'use strict';

// the stage's overlays: [name, selector, kind]. 'must': whole wherever its state shows it; 'last': may be hidden for want
// of room (a note). The modal layers (no WebGL, the walk's veil) and the phone's sheet are not overlays here
const BEFORE = [
  ['readouts', '#readout', 'must'], ['views', '.views', 'must'], ['count', '#boatsChip', ''], ['card', '#endCard', 'must'],
  ['caption', '#dirCaption', 'last'], ['deep', '#deepStrip', ''], ['walkPad', '.walk-pad', ''], ['bridge', '#bridge', 'must'],
  ['diagram', '.strip', 'must'], ['notice', '#toast', ''], ['rpNotice', '#rpToast', '']];

// The geometry, pure (it runs in the page and in Node). items: [{ name, kind, present, r: [l, t, r, b] or null (not
// shown), spill: [dx, dy], cut, scrolls, labels, small }]; stage: [l, t, r, b]; expect: the names that must be shown.
function faultsOf(items, stage, expect, opts) {
  opts = opts || {};
  const tol = opts.tol === undefined ? 1 : opts.tol, faults = [], notes = [];
  const shown = items.filter(it => it.r);
  const box = (it) => { const s = it.spill || [0, 0]; return [it.r[0], it.r[1], it.r[2] + Math.max(0, s[0]), it.r[3] + Math.max(0, s[1])]; };
  for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
    const p = box(shown[i]), q = box(shown[j]);
    const w = Math.min(p[2], q[2]) - Math.max(p[0], q[0]), h = Math.min(p[3], q[3]) - Math.max(p[1], q[1]);
    if (w > tol && h > tol) faults.push({ kind: 'overlap', a: shown[i].name, b: shown[j].name, w: Math.round(w), h: Math.round(h) });
  }
  for (const it of shown) {
    const p = box(it), side = [];
    if (p[0] < stage[0] - 0.5) side.push('left');
    if (p[1] < stage[1] - 0.5) side.push('top');
    if (p[2] > stage[2] + 0.5) side.push('right');
    if (p[3] > stage[3] + 0.5) side.push('bottom');
    if (side.length) faults.push({ kind: 'outside', a: it.name, side: side.join('+'), by: Math.round(Math.max(stage[0] - p[0], stage[1] - p[1], p[2] - stage[2], p[3] - stage[3])) });
    if (it.cut) faults.push({ kind: 'clipped', a: it.name, what: 'its content' });
    if (it.labels) faults.push({ kind: 'clipped', a: it.name, what: it.labels + ' button label' + (it.labels > 1 ? 's' : '') });
    const s = it.spill || [0, 0];
    if (s[0] > tol || s[1] > tol) notes.push({ kind: 'spills', a: it.name, w: Math.round(s[0]), h: Math.round(s[1]) });
    if (it.scrolls) notes.push({ kind: 'scrolls', a: it.name });
    if (it.small) notes.push({ kind: 'small targets', a: it.name, n: it.small });
  }
  for (const n of expect || []) { const it = items.find(x => x.name === n); if (!it || !it.r) faults.push({ kind: 'missing', a: n }); }
  for (const it of items) if (!it.r && it.kind === 'last' && it.present) notes.push({ kind: 'hidden', a: it.name });
  const order = (f) => f.kind + '|' + f.a + '|' + (f.b || '') + '|' + (f.what || '');
  faults.sort((x, y) => (order(x) < order(y) ? -1 : order(x) > order(y) ? 1 : 0));
  notes.sort((x, y) => (order(x) < order(y) ? -1 : order(x) > order(y) ? 1 : 0));
  return { faults, notes };
}

// The page's side: the overlays read from the DOM, then faultsOf. opts: { expect, extra: [[name, selector, kind]], only
// (the extra overlays alone: for a test of the check itself), tol }
function collect(opts) {
  opts = opts || {};
  const stageEl = document.getElementById('stage'), s = stageEl.getBoundingClientRect();
  const hud = document.getElementById('hud');
  let list = [];
  if (!opts.only) {
    // the stage's overlays by their names, wherever they stand (each in a slot of the grid since C-4's step 2), then
    // whatever else stands in a slot, named by its data-name, id or first class
    const seen = new Set();
    for (const [n, sel, k] of BEFORE_LIST) { const el = document.querySelector(sel); list.push([n, el, k]); if (el) seen.add(el); }
    if (hud) for (const area of hud.querySelectorAll('[data-area]')) for (const el of area.children) if (!seen.has(el)) list.push([el.dataset.name || el.id || String(el.className).split(' ')[0], el, el.dataset.kind || '']);
  }
  for (const [n, sel, k] of opts.extra || []) list.push([n, document.querySelector(sel), k || '']);
  const touch = document.documentElement.dataset.device !== 'desktop';
  const items = list.map(([name, el, kind]) => {
    const it = { name, kind, present: !!(el && !el.hidden), r: null };
    if (!el || el.hidden || !el.isConnected || !el.getClientRects().length) return it;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity <= 0.05) return it;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return it;
    it.r = [r.left, r.top, r.right, r.bottom];
    const vis = (o) => o === 'visible', scr = (o) => o === 'auto' || o === 'scroll';
    const dx = el.scrollWidth - el.clientWidth, dy = el.scrollHeight - el.clientHeight;
    it.spill = [vis(cs.overflowX) && dx > 1 ? dx : 0, vis(cs.overflowY) && dy > 1 ? dy : 0];
    it.cut = (!vis(cs.overflowX) && !scr(cs.overflowX) && dx > 1) || (!vis(cs.overflowY) && !scr(cs.overflowY) && dy > 1);
    it.scrolls = (scr(cs.overflowX) && dx > 1) || (scr(cs.overflowY) && dy > 1);
    let labels = 0, small = 0;
    for (const bt of el.querySelectorAll('button')) {
      if (!bt.getClientRects().length || getComputedStyle(bt).visibility === 'hidden') continue;
      if (bt.scrollWidth > bt.clientWidth + 1) labels++;
      if (touch && bt.getBoundingClientRect().height < 39.5) small++;
    }
    it.labels = labels; it.small = small;
    return it;
  });
  const stage = [s.left, s.top, s.right, s.bottom];
  const res = faultsOf(items, stage, opts.expect, opts);
  res.boxes = {};
  for (const it of items) res.boxes[it.name] = it.r ? [Math.round(it.r[0] - s.left), Math.round(it.r[1] - s.top), Math.round(it.r[2] - it.r[0]), Math.round(it.r[3] - it.r[1])] : null;
  res.stage = [Math.round(s.width), Math.round(s.height)];
  res.device = document.documentElement.dataset.device || null;
  // the free share of the stage: cells of 8 px under no overlay
  let n = 0, free = 0;
  const on = items.filter(it => it.r);
  for (let y = s.top + 4; y < s.bottom; y += 8) for (let x = s.left + 4; x < s.right; x += 8) { n++; if (!on.some(it => x >= it.r[0] && x < it.r[2] && y >= it.r[1] && y < it.r[3])) free++; }
  res.free = n ? Math.round(100 * free / n) : 0;
  return res;
}

const PAGE = 'const BEFORE_LIST = ' + JSON.stringify(BEFORE) + ';\n' + faultsOf.toString() + '\n' + collect.toString();
// the expression a suite evaluates in the page (b.ev): the check with these options, its result as plain data
function expr(opts) { return '(() => {\n' + PAGE + '\nreturn collect(' + JSON.stringify(opts || {}) + ');\n})()'; }
// a fault in words (the table's form: no pixel counts, which a browser's update may move by one)
function say(f) { return f.kind + ': ' + f.a + (f.b ? ' x ' + f.b : '') + (f.side ? ' (' + f.side + ')' : '') + (f.what ? ' (' + f.what + ')' : ''); }
// and its size, for the printed rows
function size(f) { return f.w !== undefined ? ' ' + f.w + ' x ' + f.h + ' px' : (f.by !== undefined ? ' by ' + f.by + ' px' : (f.n !== undefined ? ' ' + f.n : '')); }

module.exports = { BEFORE, faultsOf, expr, say, size };

// ---------------------------------------------------------------------------------------------- the geometry's own rows
if (require.main === module) {
  let bad = 0;
  const row = (what, got, want) => { const ok = got === want; if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(78) + ' ' + got + (ok ? '' : '   (wanted ' + want + ')')); };
  const st = [0, 0, 400, 300];
  const it = (name, r, o) => Object.assign({ name, kind: '', present: true, r, spill: [0, 0] }, o || {});
  const words = (res) => res.faults.map(f => say(f) + size(f)).join('; ') || 'none';
  row('two boxes meeting 30 x 30 px: one overlap', words(faultsOf([it('A', [20, 20, 80, 60]), it('B', [50, 30, 110, 70])], st)), 'overlap: A x B 30 x 30 px');
  row('boxes meeting by 1 px or less, or only touching: no fault', words(faultsOf([it('A', [0, 0, 100, 50]), it('B', [99, 0, 200, 50]), it('C', [0, 50, 100, 90])], st)), 'none');
  row('a box past the stage\'s right edge by 25 px', words(faultsOf([it('C', [375, 200, 425, 220])], st)), 'outside: C (right) by 25 px');
  row('content spilling 40 px out of its box reaches the next box', words(faultsOf([it('A', [0, 0, 100, 50], { spill: [40, 0] }), it('B', [120, 0, 200, 50])], st)), 'overlap: A x B 20 x 50 px');
  row('a box whose content is cut, and a button label wider than its button', words(faultsOf([it('D', [10, 100, 60, 120], { cut: true, labels: 1 })], st)), 'clipped: D (1 button label); clipped: D (its content)');
  row('an overlay the state must show, not shown', words(faultsOf([it('card', null, { present: false })], st, ['card', 'bridge'])), 'missing: bridge; missing: card');
  const hid = faultsOf([it('caption', null, { kind: 'last' }), it('readouts', [0, 0, 100, 100], { scrolls: true, small: 3 })], st);
  row('a last overlay hidden for want of room, a scrolling one, small targets: notes, not faults', words(hid) + ' | ' + hid.notes.map(n => n.kind + ' ' + n.a + size(n)).join('; '), 'none | hidden caption; scrolls readouts; small targets readouts 3');
  row('the page\'s expression is one function of the DOM, with today\'s overlays named', String(/function collect/.test(expr({})) && /#dirCaption/.test(expr({})) && BEFORE.length), '11');
  console.log((bad ? 'FAIL' : 'PASS') + ': layout_check: the geometry\'s ' + (bad ? bad + ' row(s) failed' : 'rows hold'));
  process.exit(bad ? 1 : 0);
}
