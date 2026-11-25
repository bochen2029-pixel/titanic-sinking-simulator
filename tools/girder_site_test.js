// The hull girder's gauge (site/parts/55_girder.js) in a real browser (headless Edge or Chrome), with nothing beyond Node.
//   node tools/girder_site_test.js [dist] [screenshot dir]
// Checks that the gauge is on the page for a damage preset and for a watch; that its figure is the library's
// (core/readers/girder.js: the moment relieved by her inertia, in GN m) for the page's own sim at that moment, to the digits
// it shows, and Node's for the same state; that the bar carries the studies' range, 4.0 to 5.4 GN m, and the line and the
// band in the X-ray look take its three colours (teal below, amber within, red past the top); that the title says what the
// range is and where the record's break falls; what it costs a frame; that a watch keeps the model's own fingerprint with
// the gauge running (it feeds nothing back); that it fits on a phone; and no error in the console.
// Stage B2 (core/readers/onset.js): no mark before the onset; at the onset the line "She would break here, now" with the
// station and the clock the model found, which Node finds again from the page's own state at that step; the red ring in the
// X-ray look at that station; on a watch the mark from the reader's own state (sim.onset); on a phone the line fits.
'use strict';
const path = require('path');
const B = require('./cdp');
const C = require('../core/core.js');
const N = require('../core/night.js');
const G = require('../core/readers/girder.js');
const O = require('../core/readers/onset.js');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const ship = C.buildShip();
// what the gauge must show for a result: the same rounding and words as site/parts/55_girder.js
const wants = (g) => ({ value: (g.M / 1e9).toFixed(1) + ' GN m', where: G.placeOf(g), level: g.zone });
// the cost the gauge may take [stated]: amortised, under 2 % of a 60 Hz frame (0.33 ms a frame); a reading, on average,
// under a quarter of one (4.2 ms), so that the frame it falls in is not visibly late (the longest is reported: on a
// machine shared with other work one reading in a hundred can be held up by the scheduler)
const FRAME = 1000 / 60, SHARE = 0.02, ONE = 0.25;
const TEAL = 0x8fd3c9, AMBER = 0xffb547, RED = 0xff6b6b, rgb = (h) => 'rgb(' + (h >> 16) + ', ' + ((h >> 8) & 255) + ', ' + (h & 255) + ')';
// the onset line's last sentence by the run's kind (site/parts/55_girder.js): a preset (or a watch handed over at her
// flag) goes on to her foundering; a watch handed over at the onset (D98's default) is handed to the fall there
const PRESET_SAYS = 'On this run nothing parts her now: it goes on to her foundering.';
const WATCH_SAYS = 'On this watch she is handed to the fall here, and her pieces part at this station.';

(async () => {
  const b = await B.launch({ dist });
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    await b.waitFor('window.__held', ms || 180000, what);
  };
  // once the clock is stopped: wait for the gauge to read the sim as it stands, then the gauge, the library in the page,
  // and the sim's state (to be read again in Node)
  const settle = async () => {
    await b.waitFor('TitanicApp.girder.at() === TitanicApp.state.sim.t', 5000, 'the gauge to read the stopped sim');
    return b.ev(`(() => { const A = TitanicApp, s = A.state.sim, r = TitanicGirder.moment(s), g = r.gov;
      return { shown: A.girder.shown(), page: { M: g.M, zone: g.zone, sense: g.sense, where: g.where, x: g.x }, t: s.t, trim: r.trimDeg, band: A.girder.band(), xray: A.state.xray,
        snap: TitanicCore.serialize(s), fp: s.night ? TitanicNight.fingerprint(s) : null, k: s.night ? s.night.k : null }; })()`);
  };
  const node = (snap) => G.moment(C.restore(ship, snap)).gov;
  const same = (s) => { const w = wants(s.page); return s.shown.value === w.value && s.shown.where === w.where && s.shown.level === w.level; };
  try {
    // ---- 1. the 1912 damage preset: the gauge from the start, its bar and its words
    await b.open('#scenario=titanic');
    await b.waitFor('!!document.getElementById("girderGauge") && TitanicApp.girder.at() !== null', 10000, 'the gauge');
    const g0 = await b.ev(`(() => { const e = document.getElementById('girderGauge'), r = e.getBoundingClientRect(), ro = document.getElementById('readout'), bar = document.getElementById('girderBar').getBoundingClientRect(), rg = document.getElementById('girderRange').getBoundingClientRect();
      return { inReadout: ro.contains(e), w: r.width, h: r.height, shown: TitanicApp.girder.shown(), bar: [bar.left, bar.width], range: [rg.left, rg.width], max: TitanicApp.girder.BAR_MAX }; })()`);
    row('the gauge is on the page for a damage preset, in the readouts: the moment in GN m and where', `"${g0.shown.value} ${g0.shown.where}" (${g0.shown.level}); ${Math.round(g0.w)} x ${Math.round(g0.h)} px`, 'a figure in GN m and where, inside #readout', g0.inReadout && g0.w > 100 && g0.h > 8 && /^\d+\.\d GN m$/.test(g0.shown.value) && /^hogging (over|at) /.test(g0.shown.where));
    const at40 = g0.bar[0] + g0.bar[1] * G.CAP.low / g0.max, w14 = g0.bar[1] * (G.CAP.high - G.CAP.low) / g0.max;
    row('  the bar runs from 0 to ' + (g0.max / 1e9).toFixed(1) + ' GN m with the studies\' range marked on it', `the range from ${(g0.range[0] - g0.bar[0]).toFixed(1)} px, ${g0.range[1].toFixed(1)} px wide, in a bar ${g0.bar[1].toFixed(1)} px`,
      `4.0 to 5.4 GN m: from ${(at40 - g0.bar[0]).toFixed(1)} px, ${w14.toFixed(1)} px wide (to a pixel)`, Math.abs(g0.range[0] - at40) <= 1 && Math.abs(g0.range[1] - w14) <= 1 && g0.max > G.CAP.high);
    const R = G.RECORD, gn1 = (v) => (v / 1e9).toFixed(1);
    const want = [gn1(G.CAP.low) + ' to ' + gn1(G.CAP.high) + ' GN m', R.trim[0] + ' to ' + R.trim[1] + ' degrees of trim', gn1(R.M[0]) + ' to ' + gn1(R.M[1]) + ' GN m', 'a line under this gauge says where'];
    row('  its title says what the range is, where the record\'s break falls on the model\'s curve, and that the onset\'s line says where her strength is reached', '"' + g0.shown.title + '"', 'with: ' + want.map(s => '"' + s + '"').join(', '),
      want.every(s => g0.shown.title.includes(s)) && !/nothing breaks/i.test(g0.shown.title));
    // the three colours: the library's thresholds, the line's and the band's colours for each
    const cols = await b.ev(`(() => { const A = TitanicApp.girder, Z = TitanicGirder.zone; return { z: [Z(3.99e9), Z(4.0e9), Z(5.4e9), Z(5.41e9)], css: ['below', 'within', 'above'].map(A.cssColorOf), band: ['below', 'within', 'above'].map(A.colorOf) }; })()`);
    row('  three colours: teal below the range, amber within it, red only past its top; the line and the band alike', `3.99, 4.0, 5.4, 5.41 GN m: ${cols.z.join(', ')}; line ${cols.css.join(' / ')}; band ${cols.band.map(h => '#' + h.toString(16)).join(' / ')}`,
      `below, within, within, above; ${[TEAL, AMBER, RED].map(rgb).join(' / ')}`, cols.z.join() === 'below,within,within,above' && cols.css.join() === [TEAL, AMBER, RED].map(rgb).join() && cols.band.join() === [TEAL, AMBER, RED].join());
    // what it costs: the preset run at 60x for a while, the page drawing as it does
    await b.ev('TitanicApp.girder.resetCost(); TitanicApp.state.speed = 60');
    await B.sleep(8000);
    const cost = await b.ev(`TitanicApp.girder.cost()`);
    row('what the gauge costs a frame (the preset at 60x for 8 s of real time, drawn)', `${cost.calls} readings in ${cost.frames} frames: ${cost.mean.toFixed(2)} ms a reading (at most ${cost.max.toFixed(2)}), ${cost.perFrame.toFixed(3)} ms a frame`,
      `under ${(100 * SHARE).toFixed(0)} % of a 60 Hz frame a frame (${(SHARE * FRAME).toFixed(2)} ms), a reading on average under ${(100 * ONE).toFixed(0)} % of one (${(ONE * FRAME).toFixed(1)} ms) [stated]`, cost.calls > 5 && cost.perFrame < SHARE * FRAME && cost.mean < ONE * FRAME);
    const checkAt = async (label, cond, wantLevel) => {
      await b.ev('TitanicApp.state.speed = 900; TitanicApp.state.playing = true');
      await holdWhen(cond, label);
      const s = await settle(), w = wants(s.page), n = node(s.snap), wn = wants(n);
      row(`  ${label}: the gauge's figure is the library's for the page's sim, and Node's for the same state`, `"${s.shown.value} ${s.shown.where}" (${s.shown.level}) at T ${(s.t / 60).toFixed(2)} min, trim ${s.trim.toFixed(1)} deg`,
        `page ${w.value} ${w.where}; Node ${wn.value} ${wn.where} (${(n.M / 1e9).toFixed(3)} GN m at x ${n.x.toFixed(2)}); ${wantLevel}`, same(s) && wn.value === w.value && wn.where === w.where && s.shown.level === wantLevel);
      return s;
    };
    await checkAt('the 1912 preset at T 145 min', 'sim.t >= 145 * 60', 'below');
    if (shots) await b.shot(path.join(shots, 'girder_preset_145.png'));
    const m145 = await b.ev(`({ shown: TitanicApp.girder.onsetShown(), onset: TitanicApp.girder.onset(), looks: TitanicApp.girder.onsetLooks(), ring: TitanicApp.girder.onsetRing() })`);
    row('  no onset\'s mark before her moment reaches her strength anywhere along her (T 145 min)', `mark ${m145.shown.hidden ? 'hidden' : 'SHOWN: "' + m145.shown.text + '"'}; onset ${m145.onset ? 'FOUND' : 'none'}; ${m145.looks} looks so far`,
      'hidden, none; the part looking on its schedule (a look in many steps)', m145.shown.hidden && !m145.onset && m145.looks > 0 && m145.looks < 145 * 60 * 4 / 10 && !(m145.ring && m145.ring.visible));
    const s2 = await checkAt('the 1912 preset at T 153 min', 'sim.t >= 153 * 60', 'within');
    // the band in the X-ray look: at the governing station, amber within the range; gone in the solid look
    const bandX = s2.band;
    if (shots) { await b.shot(path.join(shots, 'girder_preset_153.png')); await b.ev("TitanicApp.setView('profile')"); await B.sleep(1500); await b.shot(path.join(shots, 'girder_band_xray.png')); }
    await b.click('bXray'); await B.sleep(400);
    const solid = await b.ev('({ band: TitanicApp.girder.band(), xray: TitanicApp.state.xray })');
    await b.click('bXray'); await B.sleep(400);
    const again = await b.ev('TitanicApp.girder.band()');
    row('  in the X-ray look a band round her hull at the governing station, in the line\'s colour; none in the solid look', `X-ray: ${bandX ? 'visible ' + bandX.visible + ' at x ' + bandX.x.toFixed(2) + ', #' + bandX.color.toString(16) : 'none'}; solid: ${solid.band ? 'visible ' + solid.band.visible : 'none'}; X-ray again: ${again && again.visible}`,
      `at x ${s2.page.x.toFixed(2)} (the library's station), #ffb547 (within); hidden; shown`, !!bandX && bandX.visible && bandX.x === s2.page.x && bandX.color === AMBER && s2.xray && !solid.xray && solid.band && !solid.band.visible && again && again.visible);

    // ---- 1b. the onset (stage B2): the 1912 preset run on to it, or to her end
    await b.ev('TitanicApp.state.speed = 900; TitanicApp.state.playing = true');
    await holdWhen('TitanicApp.girder.onset() !== null || sim.foundered', 'the onset, or her end');
    await b.waitFor('TitanicApp.girder.onset() === null || !TitanicApp.girder.onsetShown().hidden', 5000, 'the mark to show');
    const on = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, o = A.girder.onset(); return { o, shown: A.girder.onsetShown(), ring: A.girder.onsetRing(), xray: A.state.xray, t: s.t, k: Math.round(s.t / s.params.dt),
      clock: o ? A.clockOf(o.t, true) : null, snap: TitanicCore.serialize(s), looks: A.girder.onsetLooks() }; })()`);
    if (!on.o) row('the onset on the 1912 preset: the mark', 'NO ONSET: she foundered at T ' + (on.t / 60).toFixed(2) + '; the mark ' + (on.shown.hidden ? 'hidden' : 'shown'), 'an onset (tools/strength_tests.js finds one)', false);
    else {
      const o = on.o, xs = (o.x < 0 ? '−' : '+') + Math.abs(o.x).toFixed(1), nodeC = O.check(C.restore(ship, on.snap)).best;
      row('the onset on the 1912 preset: "She would break here, now", with the station and the clock the model found', `"${on.shown.text}" at step ${o.k} (${on.looks} looks; exact ${o.exact})`,
        `x ${xs} m, ${o.where}, ${on.clock}; found on the step it was looked for, the step before looked at too`, !on.shown.hidden && /^She would break here, now/.test(on.shown.text) && on.shown.text.includes('x ' + xs + ' m') && on.shown.text.includes(o.where) && on.shown.text.includes(on.clock) && o.exact && o.k === on.k);
      row('  Node, from the page\'s own state at that step, finds (M/Mu)^2 + (V/Vu)^2 at 1 or more at that station', `Node ${nodeC.r.toFixed(5)} at x ${nodeC.x.toFixed(2)}: ${(Math.abs(nodeC.M) / 1e9).toFixed(3)} of ${(nodeC.Mu / 1e9).toFixed(3)} GN m`,
        `the page ${o.r.toFixed(5)} at x ${o.x.toFixed(2)}: ${(Math.abs(o.M) / 1e9).toFixed(3)} of ${(o.Mu / 1e9).toFixed(3)}`, nodeC.r >= 1 && nodeC.x === o.x && Math.abs(nodeC.r - o.r) < 1e-9);
      row('  its title gives the moment against what she could bear, her trim and list, and that a preset goes on to her foundering', '"' + on.shown.title + '"', 'with "of ' + (o.Mu / 1e9).toFixed(2) + ' GN m", "Trim" and "' + PRESET_SAYS + '"',
        on.shown.title.includes('of ' + (o.Mu / 1e9).toFixed(2) + ' GN m') && /Trim /.test(on.shown.title) && on.shown.title.endsWith(PRESET_SAYS));
      row('  in the X-ray look a red ring round her hull at that station', on.ring ? `visible ${on.ring.visible} at x ${on.ring.x.toFixed(2)}, #${on.ring.color.toString(16)} (X-ray ${on.xray})` : 'none', `at x ${o.x.toFixed(2)}, #ff6b6b`, !!on.ring && on.xray && on.ring.visible && on.ring.x === o.x && on.ring.color === RED);
      if (shots) { await b.shot(path.join(shots, 'girder_onset_preset.png')); }
    }

    // ---- 2. the 1912 watch on its orders: the gauge, its figure, and the model's own fingerprint
    await b.open('#night=1912');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6');
    await b.waitFor('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    const gw = await b.ev(`({ shown: TitanicApp.girder.shown(), there: !!document.getElementById('girderGauge') && document.getElementById('readout').contains(document.getElementById('girderGauge')) })`);
    row('the gauge is on the page for a watch', `"${gw.shown.value} ${gw.shown.where}" (${gw.shown.level}) once she is clear of the ice`, 'a figure in GN m and where, inside #readout', gw.there && /^\d+\.\d GN m$/.test(gw.shown.value));
    await b.ev('TitanicApp.state.speed = 900; TitanicApp.state.playing = true');
    await holdWhen('sim.night.tTouch >= 0 && sim.t - sim.night.tTouch >= 153 * 60', 'T 153 min after the touch', 240000);
    const sw = await settle(), ww = wants(sw.page), nw = node(sw.snap), wnw = wants(nw);
    row('  the watch at T 153 min after the touch: the gauge\'s figure is the library\'s, and Node\'s for the same state', `"${sw.shown.value} ${sw.shown.where}" (${sw.shown.level}), trim ${sw.trim.toFixed(1)} deg, step ${sw.k}`,
      `page ${ww.value} ${ww.where}; Node ${wnw.value} ${wnw.where}`, same(sw) && wnw.value === ww.value && wnw.where === ww.where);
    if (shots) await b.shot(path.join(shots, 'girder_watch_153.png'));
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${sw.k}) N.step(s); return N.fingerprint(s); })()`);
    const nodeFp = (() => { const s = N.create(ship, N.spec(1912), { auto: true }); while (s.night.k < sw.k) N.step(s); return N.fingerprint(s); })();
    row('  the watch with the gauge running has the model\'s own fingerprint: the part feeds nothing back', `page ${sw.fp} at step ${sw.k}`, `the model alone in the page ${bare}; in Node ${nodeFp}${nodeFp === bare ? '' : ' (another engine\'s Math.pow: README)'}`, sw.fp === bare);
    // the watch's onset: the reader's own state in the sim (sim.onset), shown as the same line
    await b.ev('TitanicApp.state.speed = 900; TitanicApp.state.playing = true');
    await holdWhen('(sim.onset && sim.onset.found) || sim.foundered', 'the watch\'s onset, or her end', 240000);
    await b.waitFor('!(TitanicApp.state.sim.onset && TitanicApp.state.sim.onset.found) || !TitanicApp.girder.onsetShown().hidden', 5000, 'the mark on the watch');
    const ow = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, o = s.onset ? s.onset.found : null; return { attached: !!s.onset, o, shown: A.girder.onsetShown(), clock: o ? A.clockOf(o.t, true) : null, T: o ? o.T : null, k: s.night.k, handover: s.night.handover || 'flag', fp: TitanicNight.fingerprint(s) }; })()`);
    const bare2 = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true, readers: false }); while (s.night.k < ${ow.k}) N.step(s); return N.fingerprint(s); })()`);
    row('the watch: the onset reader keeps its state in the sim (sim.onset), and its onset is the same line under the gauge', ow.o ? `"${ow.shown.text}" at T ${ow.T.toFixed(2)} min after the touch, step ${ow.o.k}` : (ow.attached ? 'NO ONSET before her end' : 'NOT ATTACHED'),
      'attached; the line with the station and the clock ' + (ow.clock || '-'), ow.attached && !!ow.o && !ow.shown.hidden && ow.shown.text.includes(ow.clock) && ow.shown.text.includes(ow.o.where));
    row('  ... its title on this watch, handed over at the onset (D98\'s default): she is handed to the fall there', ow.o ? '"' + ow.shown.title + '" (handover ' + ow.handover + ')' : 'no onset', 'handover onset; the title ends "' + WATCH_SAYS + '"',
      !!ow.o && ow.handover === 'onset' && ow.shown.title.endsWith(WATCH_SAYS));
    row('  ... and the watch, past its onset, still has the model\'s own fingerprint (the reader writes nothing into her)', `page ${ow.fp} at step ${ow.k}`, `the same watch in the page with no reader at all: ${bare2}`, ow.fp === bare2);
    if (shots) await b.shot(path.join(shots, 'girder_onset_watch.png'));

    // ---- 3. a phone: the line fits in the readouts, inside the screen
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#scenario=titanic');
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen('sim.t >= 154 * 60', 'T 154 min on the phone');
    const sp = await settle();
    const fit = await b.ev(`(() => { const e = document.getElementById('girderGauge'), r = e.getBoundingClientRect(), ro = document.getElementById('readout').getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect(), t = document.getElementById('girderWhere');
      return { device: TitanicApp.device(), box: [r.left, r.top, r.right, r.bottom].map(Math.round), ro: [ro.left, ro.top, ro.right, ro.bottom].map(Math.round), stage: [st.left, st.top, st.right, st.bottom].map(Math.round), cut: t.scrollWidth > t.clientWidth + 1, over: e.scrollWidth > e.clientWidth + 1, vw: window.innerWidth, doc: document.documentElement.scrollWidth }; })()`);
    row('on a phone (390 x 780) the gauge\'s line fits in the readouts, inside the stage, nothing cut', `${fit.device}; "${sp.shown.value} ${sp.shown.where}" (${sp.shown.level}); line ${fit.box.join(',')} in readout ${fit.ro.join(',')}, stage ${fit.stage.join(',')}; cut ${fit.cut}`,
      'phone; inside both; no text cut; the page no wider than the screen', fit.device === 'phone' && fit.box[0] >= fit.ro[0] && fit.box[2] <= fit.ro[2] && fit.box[1] >= fit.ro[1] && fit.box[3] <= fit.ro[3] && fit.ro[2] <= fit.stage[2] && !fit.cut && !fit.over && fit.doc <= fit.vw);
    if (shots) await b.shot(path.join(shots, 'girder_phone.png'));
    // and the onset's line on the phone, once it shows
    await b.ev('TitanicApp.state.speed = 900; TitanicApp.state.playing = true');
    await holdWhen('TitanicApp.girder.onset() !== null || sim.foundered', 'the onset on the phone');
    await b.waitFor('TitanicApp.girder.onset() === null || !TitanicApp.girder.onsetShown().hidden', 5000, 'the mark on the phone');
    const fm = await b.ev(`(() => { const e = document.getElementById('girderOnset'), r = e.getBoundingClientRect(), ro = document.getElementById('readout').getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect();
      return { hidden: e.hidden, text: e.textContent, box: [r.left, r.top, r.right, r.bottom].map(Math.round), ro: [ro.left, ro.top, ro.right, ro.bottom].map(Math.round), stage: [st.left, st.top, st.right, st.bottom].map(Math.round), cut: e.scrollWidth > e.clientWidth + 1, vw: window.innerWidth, doc: document.documentElement.scrollWidth }; })()`);
    row('  on the phone the onset\'s line fits in the readouts, inside the stage, nothing cut', `"${fm.text}"; line ${fm.box.join(',')} in readout ${fm.ro.join(',')}, stage ${fm.stage.join(',')}; cut ${fm.cut}`,
      'shown; inside both; no text cut; the page no wider than the screen', !fm.hidden && fm.box[0] >= fm.ro[0] && fm.box[2] <= fm.ro[2] && fm.box[1] >= fm.ro[1] && fm.box[3] <= fm.ro[3] && fm.ro[2] <= fm.stage[2] && !fm.cut && fm.doc <= fm.vw);
    if (shots) await b.shot(path.join(shots, 'girder_onset_phone.png'));
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
