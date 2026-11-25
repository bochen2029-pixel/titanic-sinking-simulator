// Her wake computed (site/parts/25_wake.js on site/parts/24_wake_field.js) in a real browser (headless Edge or Chrome),
// with nothing beyond Node.
//   node tools/wake_site_test.js [dist] [screenshot dir]
// Checks that the part is on the page for a watch with its switch; that the field is up with her within seconds of a
// watch's start and the page's own drawn wake is then out of sight (the order marks stay); that the sea the page holds is
// the library's for her record (the same record played in Node); that the switch and the three looks do what they say;
// that a watch keeps the model's own fingerprint with the part running (it feeds nothing back); that time running too
// fast lets the field go, puts the drawn ribbon back, and the field is made again when it slows; what the part costs a
// frame; that on a phone it is off until asked for and its switch fits; and no error in the console.
// K4 (site/parts/26_wake_seams.js): its GLSL in place of the marked defaults in the Night look's sea and her hull's
// shaders; with the wake off the same pixels as the page's own defaults, in the three looks; with it on, her waterline and
// the night sea changed; the sea against her plating the library's. And a long watch at 8 times her pace, the field kept,
// whose record is cut back while the player is at work (joint gate 2 of 2026-11-20).
// With a screenshot dir: six pictures of it (the folder kept in the repository is docs/evidence/wake).
// It runs on real time, by design (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): it measures the wake part's real
// CPU budget. How soon the field is up with her, what the part costs a frame and a call, the field let go when time runs
// too fast and made again, and the long watch at 8 times her pace all turn on the part's work against the wall clock
// (BUDGET ms of a drawn frame, site/parts/25_wake.js). Under the page's virtual clock the part works its field only on the
// passes that draw, and then to the end (budget 0), so none of that would be measured. The rows that read no budget (the
// sea against the library's, the looks, K4's pixels, the fingerprint) stand on the same page and watch as those that do,
// and most of the suite's time is spent in the budget rows (the long watch alone is about two minutes), so it is not
// converted. It is not the real-time canary: that is tools/night_site_test.js.
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('./cdp');
const C = require('../core/core.js');
const N = require('../core/night.js');
const WF = require('../site/parts/24_wake_field.js');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(70) + ' ' + ref); }
// what the part may take [stated]: amortised under 10 % of a 60 Hz frame at her own pace; a call of its work under half
// a frame on average (its budget is 4 ms; a piece in hand is finished). The longest is reported: on a machine shared with
// other work one call in a hundred is held up by the scheduler
const FRAME = 1000 / 60, SHARE = 0.10, ONE = 0.5;
const KEYS = ['t', 'X', 'Y', 'psi', 'u', 'v', 'r', 'TP', 'TS', 'TC', 'nP', 'nS', 'nC', 'del'];

(async () => {
  const b = await B.launch({ dist });
  const ev = b.ev;
  const holdWhen = async (cond, what, ms) => {
    await ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    await b.waitFor('window.__held', ms || 180000, what);
  };
  const st = () => ev(`(() => { const A = TitanicApp, o = A.wake, r = o.lines.geometry.drawRange; return Object.assign(A.wakeField.status(), { ribbon: o.ribbon.visible, bow: o.bow.visible, laid: o.ribbon.geometry.drawRange.count, lines: [r.start, r.count], marks: o.marks.length, pressed: document.getElementById('bWake').getAttribute('aria-pressed'), t: A.state.sim.t, kn: A.state.sim.mo.u / 0.514444, lineK: A.wakeField.near.material.uniforms.uK.value.z, fadeU: A.wakeField.near.material.uniforms.uFade.value }); })()`);
  // a picture of the stage alone (the panels out of the way, then back)
  const shot = async (name) => {
    if (!shots) return;
    await ev(`(() => { for (const e of document.querySelectorAll('#stage > *')) if (e.id !== 'gl') { e.dataset.was = e.style.visibility; e.style.visibility = 'hidden'; } })()`);
    await B.sleep(400);
    const r = await ev(`(() => { const c = document.getElementById('gl').getBoundingClientRect(); return { x: c.left, y: c.top, width: c.width, height: c.height }; })()`);
    const p = await b.page.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 } });
    fs.mkdirSync(shots, { recursive: true }); fs.writeFileSync(path.join(shots, name), Buffer.from(p.data, 'base64'));
    await ev(`(() => { for (const e of document.querySelectorAll('#stage > *')) if (e.id !== 'gl') e.style.visibility = e.dataset.was || ''; })()`);
  };
  const look = async (which) => {                    // 'xray' | 'solid' | 'night', through the page's own switches
    const night = await ev('!!(TitanicApp.nightScene && TitanicApp.nightScene.on)');
    if (which === 'night') { if (!night) await b.click('bNight'); }
    else { if (night) await b.click('bNight'); await B.sleep(250); if ((which === 'xray') !== await ev('TitanicApp.state.xray')) await b.click('bXray'); }
    await B.sleep(500);
  };
  const view = async (v, extra) => { await ev(`TitanicApp.setView(${JSON.stringify(v)})`); await B.sleep(900); if (extra) await ev(extra); await B.sleep(700); };
  const HIGH = 'TitanicApp.ctl.goal = null; TitanicApp.ctl.r = 850; TitanicApp.ctl.phi = 0.85;';
  try {
    // ---- 1. the 1912 watch on its orders: the part, its switch, the field up with her
    await b.open('#night=1912');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    const t0 = Date.now();
    const p0 = await ev(`(() => { const w = document.getElementById('bWake'), x = document.getElementById('bXray'); return { there: !!w && !!x && w.parentElement === x.parentElement, pressed: w && w.getAttribute('aria-pressed'), title: w ? w.title : '', api: !!TitanicApp.wakeField, lib: !!window.TitanicWakeField, device: TitanicApp.device() }; })()`);
    row('the part is on the page for a watch: its switch among the display switches, on (a desktop)', `"Wake" ${p0.there ? 'in the Display group' : 'missing'}, pressed ${p0.pressed}; ${p0.device}`, 'there, pressed, with a title that says what it is', p0.there && p0.pressed === 'true' && p0.api && p0.lib && /computed/.test(p0.title) && /white water/.test(p0.title));
    await ev('window.__frames = 0; TitanicApp.on("frame", () => { window.__frames++; })');
    await b.waitFor('TitanicApp.wakeField.W.caught && TitanicApp.wakeField.fade > 0.99', 90000, 'the field up with her');
    const up = (Date.now() - t0) / 1000, c0 = await ev('TitanicApp.wakeField.cost()');
    await ev('window.__f0 = window.__frames; window.__c0 = TitanicApp.wakeField.cost()');
    await holdWhen('sim.t >= 17', 't 17 s of the watch');
    await B.sleep(900);
    const s1 = await st(), c1 = await ev('({ c: TitanicApp.wakeField.cost(), c0: window.__c0, frames: window.__frames - window.__f0 })');
    row('the field is up with her soon after the watch starts (her footprints, then her last five minutes played in)', `${up.toFixed(1)} s of real time (footprints ${(c0.prepMs / 1000).toFixed(1)} s of work, ${c0.samples} samples ${(c0.ms / 1000).toFixed(1)} s); at her ${s1.t.toFixed(1)} s it shows fully (${s1.fade.toFixed(2)}), ${s1.behind} sample(s) behind`,
      'within 60 s [stated]; shown fully, up with her', up < 60 && s1.fade === 1 && s1.visible && s1.live && s1.behind === 0 && !s1.empty && s1.fadeU === 1);
    row('  the page\'s own drawn wake is out of sight while it shows: the ribbon and the bow wave hidden, Kelvin\'s lines gone, the order marks kept', `ribbon ${s1.ribbon ? 'shown' : 'hidden'} (still laid: ${s1.laid} indices), bow wave ${s1.bow ? 'shown' : 'hidden'}, lines drawn ${s1.lines[1]} vertices for ${s1.marks} mark(s)`,
      'hidden, hidden, two vertices a mark', !s1.ribbon && !s1.bow && s1.laid > 0 && s1.lines[1] === 2 * s1.marks && s1.theirsHidden);
    const fr = c1.frames, used = c1.c.ms - c1.c0.ms, calls = c1.c.calls - c1.c0.calls;
    row('what it costs at her own pace (from up with her to her 17th second, drawn)', `${used.toFixed(0)} ms in ${calls} calls over ${fr} frames: ${(used / fr).toFixed(2)} ms a frame, ${(used / calls).toFixed(2)} ms a call (the longest of the run ${c1.c.maxMs.toFixed(1)} ms)`,
      `under ${(100 * SHARE).toFixed(0)} % of a 60 Hz frame a frame (${(SHARE * FRAME).toFixed(2)} ms), a call on average under ${(100 * ONE).toFixed(0)} % of one (${(ONE * FRAME).toFixed(1)} ms) [stated]`, fr > 60 && used / fr < SHARE * FRAME && used / calls < ONE * FRAME);

    // ---- 2. the sea the page holds is the library's for her record
    const pg = await ev(`(() => { const F = TitanicWakeField, W = TitanicApp.wakeField.W, s = W.shown, c = Math.cos(s.psi), sn = Math.sin(s.psi), n = W.n, out = [];
      const at = (h, X0, Y0, dx, X, Y) => { const a = (X - X0) / dx, b = (Y - Y0) / dx; if (!(a >= 0 && b >= 0 && a < n - 1 && b < n - 1)) return 0; const a0 = Math.floor(a), b0 = Math.floor(b), fa = a - a0, fb = b - b0, o = a0 * n + b0; return h[o] * (1 - fa) * (1 - fb) + h[o + n] * fa * (1 - fb) + h[o + 1] * (1 - fa) * fb + h[o + n + 1] * fa * fb; };
      for (let x = -400; x <= 110; x += 15) for (let y = -150; y <= 150; y += 15) { const X = s.X + x * c - y * sn, Y = s.Y + x * sn + y * c; out.push(at(W.hNear, s.nearX0, s.nearY0, W.near.dx, X, Y) + at(W.hFar, s.farX0, s.farY0, W.far.dx, X, Y)); }
      return { shown: s, pts: out, sumB: W.sumB, sumW: W.sumW, rec: W.rec.map(q => [${KEYS.map(k => 'q.' + k).join(', ')}]), scale: F.scale(s.u) }; })()`);
    {
      const W2 = WF.createWake(); WF.work(W2, 0);
      for (const q of pg.rec) { if (q[0] > pg.shown.t + 1e-9) break; const o = {}; KEYS.forEach((k, i) => { o[k] = q[i]; }); WF.push(W2, o); }
      WF.work(W2, 0); WF.refresh(W2);
      const s = pg.shown, c = Math.cos(s.psi), sn = Math.sin(s.psi); let d2 = 0, s2 = 0, i = 0;
      for (let x = -400; x <= 110; x += 15) for (let y = -150; y <= 150; y += 15) { const X = s.X + x * c - y * sn, Y = s.Y + x * sn + y * c, q = WF.at(W2.near, W2.hNear, X, Y) + WF.at(W2.far, W2.hFar, X, Y), p = pg.pts[i++]; d2 += (p - q) * (p - q); s2 += q * q; }
      const rel = Math.sqrt(d2 / s2), rms = Math.sqrt(s2 / i);
      row('the sea the page holds is the library\'s for her record: the same ' + pg.rec.length + ' samples played in Node, the heights round her at ' + i + ' places', `differ by ${(100 * rel).toFixed(1)} % (rms, of an rms height of ${rms.toFixed(3)} m); white water ${pg.sumB.toFixed(0)} + ${pg.sumW.toFixed(0)} against ${W2.sumB.toFixed(0)} + ${W2.sumW.toFixed(0)}`,
        'within 3 % (the page plays them a piece a frame as they come, Node in one go); the white water within 15 %; the scale the library\'s (' + WF.scale(s.u).toFixed(4) + ')', rel < 0.03 && rms > 0.05 && Math.abs(pg.sumB / W2.sumB - 1) < 0.15 && Math.abs(pg.sumW / W2.sumW - 1) < 0.15 && pg.scale === WF.scale(s.u));
    }

    // ---- 3. the three looks and the switch, the clock stopped
    await look('solid'); await view('quarter', HIGH); const lSolid = await st(); await shot('wake-solid-straight-high.png');
    await view('plan'); await shot('wake-solid-straight-plan.png');
    await look('xray'); await view('astern'); const lX = await st(); await shot('wake-xray-straight-astern.png');
    await look('night'); await view('quarter'); const lN = await st(); await shot('wake-night-straight-quarter.png');
    row('the three looks: the solid sea, X-ray (with lines of equal height), Night', `${lSolid.look} (lines ${lSolid.lineK}), ${lX.look} (lines ${lX.lineK}), ${lN.look} (lines ${lN.lineK}); shown in each`, 'solid 0, xray over 0, night 0', lSolid.look === 'solid' && lSolid.lineK === 0 && lX.look === 'xray' && lX.lineK > 0 && lN.look === 'night' && lN.lineK === 0 && lSolid.visible && lX.visible && lN.visible);
    await look('xray');
    await b.click('bWake'); await B.sleep(500); const off = await st();
    await b.click('bWake'); await B.sleep(1800); const on = await st();
    row('the switch: off, the computed wake is gone and the page\'s drawn one is back; on, the other way about', `off: pressed ${off.pressed}, ours ${off.visible ? 'shown' : 'hidden'}, ribbon ${off.ribbon ? 'shown' : 'hidden'}, lines ${off.lines[1]} vertices; on: pressed ${on.pressed}, ours ${on.visible ? 'shown' : 'hidden'} (${on.fade.toFixed(2)}), ribbon ${on.ribbon ? 'shown' : 'hidden'}`,
      'off: false, hidden, shown, more than the marks\'; on: true, shown, hidden', off.pressed === 'false' && !off.visible && off.ribbon && off.lines[0] === 0 && off.lines[1] > 2 * off.marks && on.pressed === 'true' && on.visible && on.fade > 0.9 && !on.ribbon);

    // ---- 3b. K4: the wake in the Night look's sea and on her waterline (site/parts/26_wake_seams.js), the clock still
    // stopped. Each comparison is two pictures drawn inside one call to the page, so no frame of the page's own runs
    // between them: the stars, the swell and the clock are the same in both, and only what is tested differs.
    await b.waitFor('TitanicApp.wakeField.fade === 1', 10000, 'the wake shown again');
    const k4s = await ev('TitanicApp.wakeSeams ? TitanicApp.wakeSeams.status() : null');
    const DIFF = `(a, b) => { let n = 0, mx = 0; for (let i = 0; i < a.px.length; i += 4) { const d = Math.max(Math.abs(a.px[i] - b.px[i]), Math.abs(a.px[i + 1] - b.px[i + 1]), Math.abs(a.px[i + 2] - b.px[i + 2])); if (d > 0) { n++; if (d > mx) mx = d; } } return { n, mx, of: a.px.length / 4 }; }`;
    const neutral = {}, effect = {}, inst = {};
    for (const lk of ['solid', 'xray', 'night']) {
      await look(lk); await view('quarter', HIGH);
      inst[lk] = await ev('TitanicApp.wakeSeams.status()');
      // the wake off, the seams turned to nought as the part's next frame would (no frame runs inside this call): the
      // part's GLSL against the page's own defaults, put back for the moment
      neutral[lk] = await ev(`(() => { const S = TitanicApp.wakeSeams, F = TitanicApp.wakeField, d = ${DIFF}; const was = F.on, hs = S.u.seaSideX.value.w, ns = S.u.wakeS ? S.u.wakeS.value.w : 0;
        F.set(false); S.u.seaSideX.value.w = 0; if (S.u.wakeS) S.u.wakeS.value.w = 0;
        const a = S.grab(); S.uninstall(); const b = S.grab(); S.reinstall(); F.set(was); S.u.seaSideX.value.w = hs; if (S.u.wakeS) S.u.wakeS.value.w = ns; return d(a, b); })()`);
      await B.sleep(1500);                              // the wake back; the hulls' GLSL in place again on the page's next frame
      // the wake on: the seams' effect, against the same picture with them turned to nought
      effect[lk] = await ev(`(() => { const S = TitanicApp.wakeSeams, d = ${DIFF}, hs = S.u.seaSideX.value.w, ns = S.u.wakeS ? S.u.wakeS.value.w : 0;
        const a = S.grab(); S.u.seaSideX.value.w = 0; if (S.u.wakeS) S.u.wakeS.value.w = 0; const b = S.grab(); S.u.seaSideX.value.w = hs; if (S.u.wakeS) S.u.wakeS.value.w = ns; return Object.assign(d(a, b), { hs, ns }); })()`);
    }
    row('K4: the wake\'s GLSL is in place of the marked defaults: the Night look\'s sea, its stars\' and her ports\' reflections, and her hull in each look', `night ${k4s ? k4s.nightInstalled.join('/') : 'no part'}; hull: solid ${inst.solid.hullInstalled.join('/')}, X-ray ${inst.xray.hullInstalled.join('/')}, Night ${inst.night.hullInstalled.join('/')}`,
      'all three night materials; her hull\'s material in each look', !!k4s && k4s.night && k4s.hull && k4s.nightInstalled.length === 3 && k4s.nightInstalled.every(Boolean) && ['solid', 'xray', 'night'].every(k => inst[k].hullInstalled.length > 0 && inst[k].hullInstalled[0]));
    row('K4: neutral: with the wake off, the page with the wake\'s GLSL in place draws the same pixels as with the page\'s own defaults (solid, X-ray, Night)',
      ['solid', 'xray', 'night'].map(k => `${k} ${neutral[k].n} of ${neutral[k].of}`).join('; '), 'nought differ in each look (the mainline\'s condition 1)', ['solid', 'xray', 'night'].every(k => neutral[k].n === 0));
    row('K4: with the wake on, her waterline follows her own waves (solid, X-ray) and the night sea and the stars\' and her ports\' reflections bend with them (Night)',
      ['solid', 'xray', 'night'].map(k => `${k} ${effect[k].n} pixels differ (at most ${effect[k].mx})`).join('; '), 'some in each look, where the wake is', ['solid', 'xray', 'night'].every(k => effect[k].n > 50 && effect[k].hs > 0) && effect.night.ns > 0);
    const sides = await ev(`(() => { const S = TitanicApp.wakeSeams, W = TitanicApp.wakeField.W, a = S.sides(), b = Array.from(TitanicWakeField.alongside(W, S.N_SIDE)); let worst = 0, top = 0, at = 0; for (let i = 0; i < a.length; i++) { worst = Math.max(worst, Math.abs(a[i] - b[i])); if (a[i] > top) { top = a[i]; at = i >> 1; } } const h = W.hull; return { worst, top, abaft: h.xStem - (h.x0 + (h.x1 - h.x0) * (at + 0.5) / S.N_SIDE), kn: W.st.u / TitanicWakeField.KN }; })()`);
    row('K4: the sea against her plating that her hull reads is the library\'s for her record', `the same to ${sides.worst.toExponential(1)} m; her bow wave ${sides.top.toFixed(2)} m, ${sides.abaft.toFixed(0)} m abaft her stem, at ${sides.kn.toFixed(1)} kn`,
      'the same; the crest within 25 m of her stem', sides.worst < 1e-6 && sides.abaft >= 0 && sides.abaft < 25);
    await look('xray'); await view('profile'); await shot('wake-xray-waterline-profile.png');

    // ---- 4. through the ice on the 1912 orders: the model's own fingerprint, and the wake of a turn
    await ev('TitanicApp.state.warp = 4; TitanicApp.state.playing = true');
    await holdWhen('sim.night.tClear >= 0', 'the end of the encounter', 240000);
    await B.sleep(1500);
    const s4 = await st(), fp = await ev('({ fp: TitanicNight.fingerprint(TitanicApp.state.sim), k: TitanicApp.state.sim.night.k })');
    const bare = await ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${fp.k}) N.step(s); return N.fingerprint(s); })()`);
    const nodeFp = (() => { const s = N.create(C.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < fp.k) N.step(s); return N.fingerprint(s); })();
    row('the watch with the wake computed all the way has the model\'s own fingerprint: the part feeds nothing back', `page ${fp.fp} at step ${fp.k} (clear of the ice, ${s4.kn.toFixed(1)} kn; the field shown ${s4.fade.toFixed(2)}, ${s4.samples} samples)`, `the model alone in the page ${bare}; in Node ${nodeFp}${nodeFp === bare ? '' : ' (another engine\'s Math.pow: README)'}`, fp.fp === bare && s4.visible && s4.fade > 0.9);
    row('  the orders\' marks are still drawn across her wake, and nothing else of the page\'s lines', `${s4.marks} marks, ${s4.lines[1]} vertices drawn`, 'two vertices a mark, some marks', s4.marks > 0 && s4.lines[1] === 2 * s4.marks);
    await look('solid'); await view('quarter', HIGH); await shot('wake-solid-turn-high.png');
    await look('xray'); await view('astern'); await shot('wake-xray-turn-astern.png');

    // ---- 5. time running too fast to follow: the field let go, the drawn ribbon back; then made again
    await ev('TitanicApp.state.speed = 60; TitanicApp.state.playing = true');
    await b.waitFor('TitanicApp.wakeField.status().stale', 10000, 'the field let go');
    await b.waitFor('!TitanicApp.wakeField.status().visible', 5000, 'the computed wake faded out');
    const fast = await st();
    await ev('TitanicApp.state.speed = 1');
    await b.waitFor('TitanicApp.wakeField.W.caught && !TitanicApp.wakeField.W.stale && TitanicApp.wakeField.fade > 0.9', 90000, 'the field made again');
    const again = await st();
    row('time at 60 times her own (over ' + (await ev('TitanicApp.wakeField.PACE_MAX')) + '): the field is let go and the page\'s drawn ribbon stands in; at her own pace again it is made from her record', `fast: stale ${fast.stale}, ours ${fast.visible ? 'shown' : 'hidden'}, ribbon ${fast.ribbon ? 'shown' : 'hidden'}; again: at ${again.kn.toFixed(1)} kn shown ${again.fade.toFixed(2)}, ribbon ${again.ribbon ? 'shown' : 'hidden'}`,
      'let go, hidden, shown; then shown, hidden', fast.stale && !fast.visible && fast.ribbon && again.visible && !again.ribbon && !again.stale);

    // ---- 5b. a long watch at 8 times her pace, the field kept (not let go): her record passes twice what it keeps and is
    // cut back while the player is at work. Joint gate 2 of 2026-11-20 dropped the part here (systems_site); no page test
    // had run a watch this long with the field kept
    await b.open('#night=1912');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto"', 10000, 'the 1912 orders');
    await ev(`(() => { const A = TitanicApp, W = A.wakeField.W; window.__rec = { most: 0, cuts: 0, last: 0, calls0: W.cost.calls }; A.on('step', () => { const n = W.rec.length, r = window.__rec; if (n < r.last) r.cuts++; r.last = n; if (n > r.most) r.most = n; }); A.state.warp = 8; A.state.speed = 8; })()`);
    const tLong = Date.now();
    await b.waitFor('TitanicApp.state.sim.t >= 1000 || TitanicApp.state.sim.foundered', 420000, '1,000 s of her time at 8 times her pace');
    const lg = await ev(`(() => ({ t: TitanicApp.state.sim.t, rec: window.__rec, calls: TitanicApp.wakeField.W.cost.calls, keep: TitanicWakeField.CFG.keep }))()`);
    await B.sleep(1000);
    const lg2 = await ev('TitanicApp.wakeField.W.cost.calls');
    row('a long watch at 8 times her pace, the field kept: her record passes twice what it keeps and is cut back while the player is at work', `${lg.t.toFixed(0)} s of her time in ${((Date.now() - tLong) / 1000).toFixed(0)} s; cut back ${lg.rec.cuts} time(s), at most ${lg.rec.most} samples; the part's work calls ${lg.rec.calls0} -> ${lg.calls} -> ${lg2}`,
      `cut back at least once; never over ${2 * lg.keep} samples and a few (a cut waits for the sample being played); the part still at work; no error (the console row below)`, lg.rec.cuts >= 1 && lg.rec.most <= 2 * lg.keep + 64 && lg2 > lg.calls && b.errors.length === 0);

    // ---- 6. a phone: off until asked for, and the switch fits
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#night=1912');
    await B.sleep(1500);
    // on a phone the view and display switches are one strip that scrolls sideways (site/styles.css, .views): the switch is
    // brought into view as a thumb would bring it
    const ph = await ev(`(() => { const w = document.getElementById('bWake'); w.scrollIntoView({ inline: 'center', block: 'nearest' }); const r = w.getBoundingClientRect(), g = w.parentElement.getBoundingClientRect(), strip = w.closest('.views'); return { device: TitanicApp.device(), pressed: w.getAttribute('aria-pressed'), on: TitanicApp.wakeField.on, box: [r.left, r.top, r.right, r.bottom].map(Math.round), seg: [g.left, g.right].map(Math.round), strip: strip ? [strip.clientWidth, strip.scrollWidth] : null, vw: window.innerWidth, doc: document.documentElement.scrollWidth, ribbon: TitanicApp.wake.ribbon.visible }; })()`);
    await b.clickSel('#bWake'); await B.sleep(400);
    const phOn = await ev('({ pressed: document.getElementById("bWake").getAttribute("aria-pressed"), on: TitanicApp.wakeField.on })');
    row('on a phone (390 x 780) it is off until asked for; its switch is in the strip of switches with the others and comes into the screen; a tap turns it on', `${ph.device}; pressed ${ph.pressed}; the switch ${ph.box.join(',')} in its group ${ph.seg.join('..')}, the strip ${ph.strip ? ph.strip.join(' of ') : 'none'} px, screen ${ph.vw}, page ${ph.doc}; the drawn ribbon ${ph.ribbon ? 'shown' : 'hidden'}; after a tap pressed ${phOn.pressed}`,
      'phone; off; inside its group and, brought into view, the screen; the page no wider than the screen; then on', ph.device === 'phone' && ph.pressed === 'false' && !ph.on && ph.box[0] >= 0 && ph.box[2] <= ph.vw && ph.box[0] >= ph.seg[0] - 1 && ph.box[2] <= ph.seg[1] + 1 && ph.doc <= ph.vw && ph.ribbon && phOn.pressed === 'true' && phOn.on);
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).map(e => String(e).slice(0, 200)).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).map(x => String(x).slice(0, 300)).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
