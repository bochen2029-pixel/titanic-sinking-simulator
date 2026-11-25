// NH4, the scrubber: the night to any kept minute, and on from there exactly (docs/DESIGN_NH4_the_scrubber_v1_2026-11-23.md).
// A part of the viewer (site/app.js, "parts"). The page keeps the whole run every minute of her time while the model steps
// (every fifth on a phone) and goes back to one with TitanicApp.scrub(m): the run as it was there, paused, the parts'
// own histories put back by their keepers, a watch's later orders given again on their steps. This part is its control:
// a bar in the Run tab's Time section from the first kept minute to the furthest, her clock beside it, and the keys ","
// and "." (a minute back and on; with Shift, ten). It reads the page's kept minutes and feeds nothing into the model: a
// run never scrubbed is the run it was. Where it stands and how it looks is [appearance].
(function () {
  'use strict';
  const A = window.TitanicApp;
  if (!A || typeof A.scrub !== 'function' || typeof A.keptState !== 'function') return;
  const S = A.state, $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  // ---------------------------------------------------------------- the bar, under the pace's buttons
  const box = el('div', 'scrub mt8'), head = el('div', 'scrub-head'), lab = el('span', 'scrub-k', 'Back to'), at = el('span', 'scrub-at', '');
  const bar = document.createElement('input');
  bar.type = 'range'; bar.id = 'scrubBar'; bar.min = '0'; bar.max = '0'; bar.step = '1'; bar.value = '0'; bar.disabled = true;
  bar.setAttribute('aria-label', 'Back to a kept minute of this run');
  // what keeping costs, said where the bar is (the coordinator, 2026-11-23): a kept minute is about 300 KB once she is clear
  // of the ice (a Node probe of the 1912 watch: 1.06 MB a minute, the ice's 765 KB of it kept once), so a whole night
  // about 50 MB; every fifth minute on a phone
  const hint = el('p', 'hint scrub-hint', 'Every minute of this run is kept as it plays (about 50 MB of memory for a whole night; every fifth minute on a phone). Drag back to one and press Play: the night goes on from there as it did, unless you give a new order. Keys: "," and "." a minute, with Shift ten.');
  head.append(lab, at); box.append(head, bar, hint);
  const place = $('speedHint') || $('speedSeg');
  if (place && place.parentNode) place.insertAdjacentElement('afterend', box);
  else { const pane = document.querySelector('.pane[data-pane="run"]'); if (pane) pane.appendChild(box); }

  const minuteNow = () => (S.sim ? Math.floor(S.sim.t / 60 + 1e-9) : 0);
  const words = (m) => { const c = A.clockOf ? A.clockOf(m * 60) : null; return (c ? c + ', ' : '') + 'minute ' + m; };
  let dragging = false, shownKey = '';
  // the bar follows the run while nobody holds it: its end the furthest kept minute, its thumb the minute now
  function sync() {
    const k = A.keptState(), m = minuteNow(), furthest = k.furthest === null ? 0 : k.furthest;
    const key = [k.n, furthest, k.every, dragging ? 'd' : m].join('|');
    if (key === shownKey) return;
    shownKey = key;
    bar.disabled = k.n === 0 || !!k.broken;
    bar.max = String(furthest); bar.step = String(Math.max(1, Math.round(k.every / 60)));
    if (!dragging) bar.value = String(Math.min(m, furthest));
    at.textContent = k.n ? words(Number(bar.value)) + (k.queued ? ' (playing the night again)' : '') : 'nothing kept yet';
  }
  function go(m) {
    const k = A.keptState(); if (!k.n) return null;
    const r = A.scrub(Math.max(0, Math.min(k.furthest, m)));
    shownKey = ''; sync();
    return r;
  }
  bar.addEventListener('input', () => { dragging = true; at.textContent = words(Number(bar.value)); });
  bar.addEventListener('change', () => { dragging = false; go(Number(bar.value)); });
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
    if (e.key !== ',' && e.key !== '.' && e.key !== '<' && e.key !== '>') return;
    const back = e.key === ',' || e.key === '<', n = e.shiftKey ? 10 : 1;
    const step = Math.max(1, Math.round(A.keptState().every / 60));
    e.preventDefault();
    go(minuteNow() + (back ? -1 : 1) * Math.max(n, step));
  });
  A.on('frame', () => sync());
  A.on('reset', () => { if (!(A.scrubbing && A.scrubbing())) { shownKey = ''; sync(); } });

  // for the tests (tools/scrub_site_test.js)
  A.scrubBar = { el: bar, go, words, minuteNow };
})();
