// NH5, the counterfactual gallery (docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, section 3; BACKLOG section 2k). A
// part of the viewer (site/app.js, "parts").
//
// The Evidence tab gains the gallery of what-ifs on the 1912 watch (tools/gallery.js, out/gallery_1912.json, inlined by the
// build as window.TitanicGallery). First the watch as recorded, then each what-if: head-on, the lookout sooner, the doors
// left open, the bulkheads higher, Californian answering, the boats filled. Each was run by every member of the
// calibration's kept set (N), with the landed member (the model's defaults) beside them, uncounted. Each card gives:
//   - its question, and how it was run;
//   - its result in the table's own words, which keep D22's rule: a result is its robustness table, never "she could have
//     been saved" on one model;
//   - its counts.
// The words and figures are the table's; this file lays them out and adds nothing to them. It reads no sim and writes
// nothing: no fingerprint can move.
(function () {
  'use strict';
  const A = window.TitanicApp, G = window.TitanicGallery;
  if (!A || !G || !Array.isArray(G.cards)) return;
  const pane = document.querySelector('[data-pane="evidence"]');
  if (!pane) return;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const r0 = (v) => Math.round(v), num = (v) => Math.round(v).toLocaleString('en-US');

  const sec = el('div', 'sec gl-sec'); sec.id = 'glSec';
  sec.appendChild(el('h3', null, 'What if: the counterfactual gallery'));
  sec.appendChild(el('p', 'hint gl-lead', 'Each what-if was run on the 1912 watch by every one of the ' + G.N + ' members of the calibration\'s kept set (those the record could not rule out), the landed member, the model\'s defaults, beside them and not counted. T is minutes after the touch.'));
  if (G.rule) sec.appendChild(el('p', 'hint gl-rule', G.rule));
  const list = el('div', 'gl-cards'); list.id = 'glCards';
  sec.appendChild(list);

  // a card's counts, from its table: how many of N founder, float or clear the ice; the founder's band; the landed member's.
  // RC2 (the first ten minutes played cold): a run handed over at the break's onset (the default since G12's cascade, D98)
  // ends as she breaks, and the table counts it among its founders (t.breaks of t.founders), its band then the break's
  // time. It is said in the table's own words (tools/gallery.js: "breaks" where every one counted broke, "ends" where some
  // foundered first), never "founders" for a break: the card above it says "breaks"
  function counts(t) {
    if (!t) return '';
    const parts = [], br = t.breaks || 0, all = !!t.founders && br === t.founders;
    if (t.founders) parts.push((all ? 'breaks' : (br ? 'ends' : 'founders')) + ' in ' + t.founders + ' of ' + t.N + (br && !all ? ' (breaks in ' + br + ', founders first in ' + (t.founders - br) + ')' : ''));
    if (t.afloat) parts.push('afloat in ' + t.afloat + ' of ' + t.N + (t.afloatSteady ? ' (' + t.afloatSteady + ' lying steady)' : ''));
    if (t.clear) parts.push('clear of the ice in ' + t.clear + ' of ' + t.N);
    let s = parts.join(', ');
    if (t.founder && t.founder.n > 0 && t.founder.med !== null) s += '; she ' + (all ? 'breaks' : (br ? 'is gone' : 'founders')) + ' T ' + r0(t.founder.med) + ' (' + r0(t.founder.lo) + ' to ' + r0(t.founder.hi) + ')';
    if (t.afloatWater && t.afloatWater.n > 0 && t.afloatWater.med !== null) s += '; afloat with ' + num(t.afloatWater.med) + ' t of water (' + num(t.afloatWater.lo) + ' to ' + num(t.afloatWater.hi) + ')';
    const L = t.landed;
    if (L && L.outcome) s += '; the landed member ' + (L.outcome === 'founders' || L.outcome === 'breaks' ? L.outcome + ' T ' + (Math.round(L.T * 10) / 10) : (L.outcome === 'afloat' ? 'stays afloat' : (L.outcome === 'clear' ? 'clears the ice' : L.outcome)));
    return s ? s.charAt(0).toUpperCase() + s.slice(1) + '.' : '';
  }
  const cards = [Object.assign({ id: 'baseline' }, G.baseline || {})].concat(G.cards).filter(c => c && c.title);
  for (const c of cards) {
    const a = el('article', 'gl-card'); a.dataset.id = c.id;
    a.appendChild(el('h4', 'gl-title', c.title));
    if (c.question) a.appendChild(el('p', 'gl-q', c.question));
    if (c.say) a.appendChild(el('p', 'gl-say', c.say));
    const n = counts(c.table);
    if (n) a.appendChild(el('p', 'gl-nums', n));
    if (c.how) { const d = el('details', 'gl-how'); d.appendChild(el('summary', null, 'How it was run')); d.appendChild(el('p', null, (c.on ? 'On ' + c.on + '. ' : '') + c.how)); a.appendChild(d); }
    list.appendChild(a);
  }
  // after the ledger's section (NH1) where the page has it, else after the timeline check, else at the tab's end
  const after = document.getElementById('ldSec') || (document.getElementById('evBody') && document.getElementById('evBody').closest('.sec'));
  if (after && after.parentNode) after.parentNode.insertBefore(sec, after.nextSibling); else pane.appendChild(sec);

  // for the tests (tools/gallery_site_test.js) and for exploring
  A.gallery = {
    cards: () => [...list.querySelectorAll('.gl-card')].map(a => ({ id: a.dataset.id, title: (a.querySelector('.gl-title') || {}).textContent, say: (a.querySelector('.gl-say') || {}).textContent || null, nums: (a.querySelector('.gl-nums') || {}).textContent || null })),
    counts,
  };
})();
