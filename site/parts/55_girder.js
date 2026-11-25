// The hull girder's gauge. A part of the viewer (site/app.js, "parts").
//
//   - A line in the readouts: the bending moment of her hull where it is greatest over boiler room 1 (the break band,
//     bulkhead K to J), relieved by her inertia, in GN m, and where: "Hull 4.3 GN m, hogging at bulkhead J"
//     (core/readers/girder.js). A bar from 0 to 6 GN m carries the studies' range of what her hull could bear, 4.0 to
//     5.4 GN m, marked on it: teal below the range, amber within it, red only past its top. The title says what the
//     range is, where the published analyses' break (11 to 17 degrees of trim; no witness gave an angle) falls on the
//     model's own curve (the library's RECORD, which tools/girder_tests.js checks), and that the onset's line under it
//     says where her strength is reached.
//   - In the X-ray look, a thin band round her hull at that station, in the same three colours.
//   - [appearance]: the bar's length (6 GN m), its marks' look, the band's width and the three colours; every figure is
//     the model's.
//   - It reads TitanicApp.state.sim each drawn frame, at most four times a second, and only when the model has moved (the
//     computation over her 4,408 columns is not free: what it costs is measured here and shown by
//     tools/girder_site_test.js). It feeds nothing back, and keeps nothing in the sim. Nothing breaks in this step.
//   - The onset (stage B2, core/readers/onset.js): the first step at which the gauge's moment and shear somewhere along
//     her reach what her hull could bear there (core/readers/section.js). A line under the gauge appears then, "She would
//     break here, now", with the station and the clock, and in the X-ray look a red ring round her hull at that station.
//     The line itself breaks nothing. On a watch handed over at the onset (D98's default) the night hands her to the fall
//     at that step, and her pieces part at that station; a preset, or a watch handed over at her flag, goes on to her
//     foundering. The line's title says which. On a watch the reader keeps its state in the sim (sim.onset); on a
//     damage preset this part keeps it, outside the sim, and looks after each step (cheaply: the library looks every step
//     only near the onset). [appearance]: the line's words and colour, the ring's width.
(function () {
  'use strict';
  const A = window.TitanicApp, GD = window.TitanicGirder, C = window.TitanicCore, OS = window.TitanicOnset;
  if (!A || !GD || !C || !A.state) return;
  const S = A.state;
  const EVERY = 250;                                  // ms of real time between readings [appearance]
  const BAR_MAX = 6.0e9;                              // N m at the bar's end, a little past the range's top [appearance]
  const LOW = GD.CAP.low, HIGH = GD.CAP.high;         // the studies' range (core/readers/girder.js, CAP)
  const COLOR = { below: 0x8fd3c9, within: 0xffb547, above: 0xff6b6b };   // the page's teal, warn and crit [appearance]
  const gn = (v) => (v / 1e9).toFixed(1);
  const SAYS = { below: 'below the range of what the studies say her hull could bear', within: 'within the range of what the studies say her hull could bear', above: 'past the top of the range of what the studies say her hull could bear' };

  // ------------------------------------------------------------------ the line in the readouts
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const box = el('div', 'girder'); box.id = 'girderGauge'; box.setAttribute('role', 'group');   // not a live region: it changes four times a second
  const k = el('span', 'girder-k', 'Hull'), v = el('span', 'girder-v', '–'), bar = el('span', 'girder-bar'), range = el('span', 'girder-range'), fill = el('i'), where = el('span', 'girder-t', '');
  v.id = 'girderValue'; where.id = 'girderWhere'; bar.id = 'girderBar'; range.id = 'girderRange';
  range.style.left = (100 * LOW / BAR_MAX).toFixed(2) + '%'; range.style.width = (100 * (HIGH - LOW) / BAR_MAX).toFixed(2) + '%';
  bar.append(range, fill); box.append(k, v, bar, where);
  const R = GD.RECORD;
  box.title = 'The marked band, ' + gn(LOW) + ' to ' + gn(HIGH) + ' GN m, is the range the studies give for what her hull could bear over boiler room 1, where she broke. ' +
    'The published analyses put her break at ' + R.trim[0] + ' to ' + R.trim[1] + ' degrees of trim (no witness gave an angle), where this model\'s 1912 run has ' + gn(R.M[0]) + ' to ' + gn(R.M[1]) + ' GN m. ' +
    'When her moment and shear reach what her hull could bear somewhere along her, a line under this gauge says where.';
  const ro = document.getElementById('readout'), fc = document.getElementById('fcLine');
  if (ro) { if (fc && fc.parentNode === ro) ro.insertBefore(box, fc); else ro.appendChild(box); }

  // ------------------------------------------------------------------ the band round her hull (X-ray only)
  const T3 = window.THREE;
  let band = null, bandX = null;
  const bandMat = T3 ? new T3.MeshBasicMaterial({ color: COLOR.below, transparent: true, opacity: 0.9, side: T3.DoubleSide, depthWrite: false }) : null;
  function ring(x) {                                   // the hull's section at x, a little proud of the plating [appearance]
    const zt = C.zTopAt(x), pts = [], P = A.ship && A.ship.hull;   // the model's hull, its ends with it (D4)
    let z0 = 0; while (z0 < zt && C.halfBreadth(x, z0, P) < 0.02) z0 += 0.05;
    const NZ = 24, pad = 0.12;
    for (let j = 0; j <= NZ; j++) { const z = z0 + (zt - z0) * j / NZ; pts.push([C.halfBreadth(x, Math.min(z, zt - 0.001), P) + pad, z]); }
    for (let j = NZ; j >= 0; j--) { const z = z0 + (zt - z0) * j / NZ; pts.push([-(C.halfBreadth(x, Math.min(z, zt - 0.001), P) + pad), z]); }
    pts.push([pts[0][0], pts[0][1]]);
    return { pts, zt, z0 };
  }
  function buildBand(x) {
    if (!T3 || !A.shipGroup) return;
    if (band) { A.shipGroup.remove(band); band.geometry.dispose(); }
    const r = ring(x), w = 0.35, n = r.pts.length, pos = new Float32Array(n * 2 * 3), idx = [];   // 0.7 m wide [appearance]
    for (let i = 0; i < n; i++) {
      const [y, z] = r.pts[i];
      for (let s = 0; s < 2; s++) { const o = (i * 2 + s) * 3; pos[o] = x + (s ? w : -w); pos[o + 1] = z; pos[o + 2] = -y; }   // three: (x, z, -y)
      if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setIndex(idx);
    band = new T3.Mesh(g, bandMat); band.renderOrder = 8; band.name = 'girder-band'; band.visible = false;
    A.shipGroup.add(band); bandX = x;
  }

  // ------------------------------------------------------------------ reading the model
  let res = null, lastAt = -1e9, lastT = null, lastSim = null;
  const cost = { calls: 0, sum: 0, max: 0, frames: 0 };
  function show() {
    box.classList.remove('below', 'within', 'above');
    if (!res) { v.textContent = '–'; where.textContent = ''; fill.style.width = '0%'; if (band) band.visible = false; return; }
    const g = res.gov;
    v.textContent = gn(g.M) + ' GN m';
    where.textContent = GD.placeOf(g);
    fill.style.width = Math.min(100, Math.max(0, 100 * Math.abs(g.M) / BAR_MAX)).toFixed(1) + '%';
    box.classList.add(g.zone);
    box.setAttribute('aria-label', 'Hull girder: ' + gn(g.M) + ' GN m, ' + GD.placeOf(g) + ': ' + SAYS[g.zone] + ', ' + gn(LOW) + ' to ' + gn(HIGH) + ' GN m');
    if (T3 && A.shipGroup) {
      if (bandX !== g.x) buildBand(g.x);
      if (band) bandMat.color.setHex(COLOR[g.zone]);
    }
  }
  function read(now) {
    const sim = S.sim; if (!sim) return;
    const t0 = performance.now();
    res = GD.moment(sim);                          // the library's defaults: a = 0.40, relieved by her inertia, no knock-down
    const dt = performance.now() - t0;
    cost.calls++; cost.sum += dt; if (dt > cost.max) cost.max = dt;
    lastAt = now; lastT = sim.t; lastSim = sim;
    show();
  }
  A.on('reset', () => { res = null; lastT = null; lastSim = null; lastAt = -1e9; show(); });
  A.on('frame', () => {
    const now = performance.now(), sim = S.sim;
    cost.frames++;
    if (sim && (sim !== lastSim || sim.t !== lastT) && now - lastAt >= EVERY) read(now);
    if (band) band.visible = !!(S.xray && res);
  });

  // ------------------------------------------------------------------ the onset's mark (stage B2)
  // her strength at every station of the gauge, computed once here, as the page loads (about 80 ms), so that the first
  // look of a run (the reader's on a watch, this part's on a preset) costs one look and not a frame's stall at its start
  const SL = window.TitanicSection;
  if (OS && SL && A.ship && GD.shipData) { const D = GD.shipData(A.ship); SL.along(A.ship, Array.from(D.e).concat(Array.from(D.band))); }
  const mark = el('div', 'girder-onset'); mark.id = 'girderOnset'; mark.hidden = true;
  if (ro) { if (fc && fc.parentNode === ro) ro.insertBefore(mark, fc); else ro.appendChild(mark); }
  const ONSET_RED = 0xff6b6b;                          // the page's crit [appearance]
  let pre = null, preSim = null, shown = null, ringMesh = null, ringX = null;
  const ringMat = T3 ? new T3.MeshBasicMaterial({ color: ONSET_RED, transparent: true, opacity: 0.95, side: T3.DoubleSide, depthWrite: false }) : null;
  // the state of a damage preset's run: this part's, outside the sim; a new one for each new run
  const preOf = (sim) => { if (!OS || !sim || sim.night) return null; if (preSim !== sim) { pre = OS.start(); preSim = sim; } return pre; };
  const onsetOf = (sim) => (!sim ? null : (sim.night ? (sim.onset ? sim.onset.found : null) : (preSim === sim && pre ? pre.found : null)));
  const fmtX = (x) => (x < 0 ? '−' : '+') + Math.abs(x).toFixed(1);
  const clockAt = (t) => A.clockOf(t, true) || ('T+' + (t / 60).toFixed(1) + ' min');
  function buildRing(x) {
    if (!T3 || !A.shipGroup) return;
    if (ringMesh) { A.shipGroup.remove(ringMesh); ringMesh.geometry.dispose(); }
    const r = ring(x), w = 0.6, n = r.pts.length, pos = new Float32Array(n * 2 * 3), idx = [];   // 1.2 m wide: it frames the gauge's band [appearance]
    for (let i = 0; i < n; i++) {
      const [y, z] = r.pts[i];
      for (let s = 0; s < 2; s++) { const o = (i * 2 + s) * 3; pos[o] = x + (s ? w : -w); pos[o + 1] = z; pos[o + 2] = -(y + (y >= 0 ? 0.08 : -0.08)); }
      if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setIndex(idx);
    ringMesh = new T3.Mesh(g, ringMat); ringMesh.renderOrder = 9; ringMesh.name = 'onset-ring'; ringMesh.visible = false;
    A.shipGroup.add(ringMesh); ringX = x;
  }
  function showOnset(o) {
    shown = o;
    if (!o) { mark.hidden = true; mark.textContent = ''; mark.removeAttribute('title'); if (ringMesh) ringMesh.visible = false; return; }
    const at = clockAt(o.t), where = o.where;
    mark.textContent = 'She would break here, now: x ' + fmtX(o.x) + ' m, ' + where + ', ' + at;
    const sense = o.sense, list = Math.abs(o.listDeg);
    mark.title = 'At ' + at + ' the hull girder\'s ' + sense + ' moment reached what her hull could bear at x ' + fmtX(o.x) + ' m (' + where + '): ' +
      (Math.abs(o.M) / 1e9).toFixed(2) + ' of ' + (o.Mu / 1e9).toFixed(2) + ' GN m, with the shear ' + (Math.abs(o.V) / 1e6).toFixed(0) + ' of ' + (o.Vu / 1e6).toFixed(0) + ' MN. ' +
      'Trim ' + o.trimDeg.toFixed(1) + '°, list ' + list.toFixed(1) + '°' + (list > 20 ? ' (her roll in the last minutes is a known fault of this model)' : '') + '. ' +
      // the run's kind, as the page tells it (site/app.js): a watch handed over at the onset (D98's default) parts her
      // here; a preset, or a watch handed over at her flag (the what-if), goes on to her foundering
      (S.sim && S.sim.night && S.sim.night.handover === 'onset' ? 'On this watch she is handed to the fall here, and her pieces part at this station.' : 'On this run nothing parts her now: it goes on to her foundering.');
    mark.setAttribute('aria-label', mark.textContent);
    mark.hidden = false;
    if (T3 && A.shipGroup && ringX !== o.x) buildRing(o.x);
  }
  A.on('reset', (sim) => { preOf(sim || S.sim); showOnset(null); });
  A.on('step', (sim) => { const st = preOf(sim); if (st && !st.found) OS.look(sim, st); });
  A.on('frame', () => {
    const o = onsetOf(S.sim);
    if (o !== shown) showOnset(o);
    if (ringMesh) ringMesh.visible = !!(S.xray && shown && ringX === shown.x);
  });

  // for the tests (tools/girder_site_test.js) and for exploring
  A.girder = {
    result: () => res, at: () => lastT,
    shown: () => ({ value: v.textContent, where: where.textContent, level: ['below', 'within', 'above'].find(c => box.classList.contains(c)) || null, fill: fill.style.width, title: box.title, aria: box.getAttribute('aria-label') }),
    band: () => (band ? { visible: band.visible, x: bandX, color: bandMat.color.getHex() } : null),
    colorOf: (zone) => COLOR[zone], cssColorOf: (zone) => { const e = el('span', 'girder ' + zone); const t = el('span', 'girder-v'); e.appendChild(t); document.body.appendChild(e); const c = getComputedStyle(t).color; e.remove(); return c; },
    cost: () => ({ calls: cost.calls, mean: cost.calls ? cost.sum / cost.calls : 0, max: cost.max, frames: cost.frames, perFrame: cost.frames ? cost.sum / cost.frames : 0 }),
    resetCost: () => { cost.calls = 0; cost.sum = 0; cost.max = 0; cost.frames = 0; },
    // the onset (stage B2): what the model found, what the line shows, and the ring in the X-ray look
    onset: () => onsetOf(S.sim), onsetShown: () => ({ hidden: mark.hidden, text: mark.textContent, title: mark.title || '' }),
    onsetRing: () => (ringMesh ? { visible: ringMesh.visible, x: ringX, color: ringMat.color.getHex() } : null),
    onsetLooks: () => (S.sim && S.sim.night ? (S.sim.onset ? S.sim.onset.looks : null) : (pre ? pre.looks : null)),
    EVERY, BAR_MAX,
  };
})();
