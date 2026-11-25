// Her topsides (site/topsides.js, drawn by site/app.js) in a real browser (headless Edge or Chrome), with nothing beyond
// Node.   node tools/topsides_site_test.js [dist] [screenshot dir]        (about three minutes)
// It checks that the page draws the topsides from the one table (the smoke and the steam where the funnels' tops and
// pipes are; the crow's nest's eye where the drawn nest is; the davits' arms at the boats' stations); that they cost a
// few draw calls in either look (renderer.info, counted with the topsides shown and hidden); that the davits' arms swing
// out with the boats and a dome's glass goes when the model says the dome has given way (the viewer reading the model);
// that funnel 1 falls when the model's sea reaches its seat (G15) and stands again in a new run;
// that the drawing feeds nothing back (the 1912 orders watched with it have the model's own fingerprint); and that a
// phone keeps its frame rate with them. Every read that must land on a step stops the page's clock on that step first.
'use strict';
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const hold = async (b, cond, what, ms) => {
  await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
  await b.waitFor('window.__held', ms || 240000, what);
};
const frames = (b, n) => b.ev(`new Promise(r => { let k = ${n || 4}; const f = () => (--k > 0 ? requestAnimationFrame(f) : r(true)); requestAnimationFrame(f); })`);
// draw calls and triangles of one frame, with the topsides shown and hidden
const COUNT = `new Promise(r => requestAnimationFrame(() => { const A = TitanicApp, i = A.renderer.info.render, all = { calls: i.calls, tris: i.triangles };
  A.topsides.group.visible = false; requestAnimationFrame(() => { const j = A.renderer.info.render, off = { calls: j.calls, tris: j.triangles }; A.topsides.group.visible = true; requestAnimationFrame(() => r({ all, off })); }); }))`;
// the median time of n frames, ms (the page's own loop; the topsides shown or hidden)
const FRAMETIME = (n, shown) => `new Promise(r => { const A = TitanicApp; A.topsides.group.visible = ${shown}; const t = []; let last = performance.now();
  const f = (now) => { t.push(now - last); last = now; if (t.length < ${n}) requestAnimationFrame(f); else { A.topsides.group.visible = true; t.sort((a, b) => a - b); r(t[Math.floor(t.length / 2)]); } }; requestAnimationFrame(f); })`;

(async () => {
  const b = await B.launch({ dist });
  try {
    // ---- 1. one table: smoke, steam, the nest's eye, the arms at the stations
    await b.open('#scenario=titanic');
    await b.ev('TitanicApp.state.playing = false');
    await frames(b, 4);
    const one = await b.ev(`(() => { const A = TitanicApp, T = TitanicTopsides.built(), eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const arms = A.topsides.armBoats, BP = TitanicPeople, m = new THREE.Matrix4(), p = new THREE.Vector3();
      const off = arms.filter((a, k) => { const st = BP.STATION[a.i], d = TitanicTopsides.davitsOf(st.x); return !d || Math.abs((d.fwd + d.aft) / 2 - st.x) > 0.01; }).length;
      return { smoke: eq(A.smoke.funnels, T.smoke), steam: eq(A.steam.pipes, T.steam), n: T.smoke.length, nest: A.nightScene ? [A.nightScene.NEST.x, A.nightScene.NEST.z, T.nest.eye.x, T.nest.eye.z] : null,
        arms: arms.length, armsOff: off, masthead: TitanicVisuals.LIGHTS.find(l => l.id === 'masthead').at[0], deckhouses: A.deckhouses.length,
        emissive: A.deckhouses.every(f => f.material && f.material.emissive), kinds: [...new Set(A.deckhouses.map(f => f.userData.kind))].join(',') }; })()`);
    row('the page draws from the one table: smoke and steam at the funnels\' tops and pipes, the crow\'s nest\'s eye at the drawn nest',
      `smoke ${one.smoke ? 'the same' : 'DIFFERENT'} (${one.n} funnels), steam ${one.steam ? 'the same' : 'DIFFERENT'}; eye (${one.nest[0].toFixed(2)}, ${one.nest[1].toFixed(2)}) against (${one.nest[2].toFixed(2)}, ${one.nest[3].toFixed(2)})`,
      'equal (site/topsides.js built())', one.smoke && one.steam && one.n === 3 && one.nest && one.nest[0] === one.nest[2] && one.nest[1] === one.nest[3]);
    row('  the davits\' arms, two to each boat under davits, at the people reader\'s stations; every face has an emissive (the Night look)', `${one.arms} arms, ${one.armsOff} off; ${one.deckhouses} faces (${one.kinds}); emissive on all ${one.emissive}`, '32 arms, 0 off; all',
      one.arms === 32 && one.armsOff === 0 && one.emissive);
    // T1: the hull as the page builds it, open under the counter abaft the stern post (three local: x, z, -y)
    const kn = await b.ev(`(() => { const A = TitanicApp, TS = TitanicTopsides, S = TS.STERN, out = { n: 0, aft: 0, below: 0, low: Infinity };
      const geos = []; A.hull.traverse(o => { if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) geos.push(o.geometry); });
      const g = geos[0], p = g.attributes.position.array; out.n = p.length / 3;
      for (let i = 0; i < p.length; i += 3) { const x = p[i], z = p[i + 1]; if (x < S.post - 0.03) { out.aft++; const k = TS.knuckleZ(x); if (z < k - 0.05) out.below++; out.low = Math.min(out.low, z - k); } }
      return out; })()`);
    row('her hull mesh open under the counter where the profile has it (T1): no vertex abaft the stern post below the knuckle', `${kn.below} of ${kn.aft} vertices abaft the post below it (lowest ${kn.low.toFixed(2)} m from it); ${kn.n} in all`, '0 (site/topsides.js knuckleZ)', kn.aft > 100 && kn.below === 0);
    const pre = await b.ev(`(() => { const A = TitanicApp, s = A.topsides.stowed, parts = A.boats ? A.boats.drawn().filter(d => d.visible).length : -1;
      return { shown: s.group.visible, n: s.open.count + s.folded.count, open: s.open.count, folded: s.folded.count, parts }; })()`);
    row('on the damage preset (no watch) her twenty boats are drawn stowed as at 11:40 pm, and the boats part draws none', `${pre.n} drawn (${pre.open} under davits, ${pre.folded} folded), shown ${pre.shown}; the part's ${pre.parts}`, '20, shown; the part 0', pre.shown && pre.n === 20 && pre.open === 16 && pre.folded === 4 && pre.parts === 0);

    // ---- 2. what they cost: draw calls and triangles in the quarter view, X-ray and solid
    await b.ev("TitanicApp.setView('quarter')"); await frames(b, 30);
    const cx = await b.ev(COUNT);
    await b.click('bXray'); await frames(b, 6);
    const cs = await b.ev(COUNT);
    await b.click('bXray'); await frames(b, 4);
    row('her topsides cost a few draw calls in either look (renderer.info; the five boxes, four funnels and two masts before them: 26 X-ray, 16 solid)',
      `X-ray ${cx.all.calls - cx.off.calls} calls, ${cx.all.tris - cx.off.tris} triangles; solid ${cs.all.calls - cs.off.calls} calls, ${cs.all.tris - cs.off.tris} triangles (of ${cx.all.calls} and ${cs.all.calls} in all)`,
      'at most 15 over the old: 41 and 31', cx.all.calls - cx.off.calls <= 41 && cs.all.calls - cs.off.calls <= 31);

    // ---- 3. the arms swing out with the boats; the viewer reads, the model is not touched (the 1912 orders)
    const ARMS = `(() => { const A = TitanicApp, P = A.state.sim.people, arms = A.topsides.armBoats, m = new THREE.Matrix4();
      const head = (k) => { A.topsides.arms.getMatrixAt(k, m); const h = new THREE.Vector3(0, 3.0, 0).applyMatrix4(m); return Math.abs(h.z); };   // |y| of the arm's upper end, ship frame
      let outOk = 0, inOk = 0, nOut = 0, nIn = 0;
      arms.forEach((a, k) => { const b = P.boats[a.i], out = TitanicTopsides.armsOut(a.type, b.state), e = TitanicTopsides.deckEdge(TitanicPeople.STATION[a.i].x), y = head(k);
        if (out) { nOut++; if (y > e) outOk++; } else { nIn++; if (y < e) inOk++; } });
      return { nOut, outOk, nIn, inOk }; })()`;
    await b.open('#night=1912');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 40', 10000, 'the 1912 orders');
    await hold(b, 'sim.t >= 3', 'the watch under way');
    await frames(b, 4);
    const sw0 = await b.ev(ARMS);
    const onw = await b.ev(`(() => { const A = TitanicApp; return { shown: A.topsides.stowed.group.visible, parts: A.boats.drawn().filter(d => d.visible).length }; })()`);
    row('  on a watch none of those: the boats part draws hers (never a boat twice)', `the topsides' boats shown ${onw.shown}; the part's ${onw.parts} drawn`, 'false; 20', !onw.shown && onw.parts === 20);
    await b.ev('TitanicApp.state.warp = 6; TitanicApp.state.playing = true');
    await b.waitFor('TitanicApp.state.sim.night.tClear >= 0', 240000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 600');
    await hold(b, `sim.people && sim.people.boats.some(x => x.state === 'lowering' || x.state === 'away')`, 'a boat going down');
    await frames(b, 4);
    const sw = await b.ev(ARMS);
    row('the davits\' arms in over the deck under the covered boats and out for the cutters, then out with the boats swung out (sim.people)', `under way: ${sw0.outOk} of ${sw0.nOut} out, ${sw0.inOk} of ${sw0.nIn} in; a boat going down: ${sw.outOk} of ${sw.nOut} out, ${sw.inOk} of ${sw.nIn} in`,
      'the cutters\' 4 out and 28 in; then every one as its boat', sw0.nOut === 4 && sw0.outOk === 4 && sw0.nIn === 28 && sw0.inOk === 28 && sw.nOut > 4 && sw.outOk === sw.nOut && sw.inOk === sw.nIn);
    const w = await b.ev(`(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s) }; })()`);
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${w.k}) N.step(s); return N.fingerprint(s); })()`);
    row('the drawing feeds nothing back: the 1912 orders watched with it have the model\'s own fingerprint', `page ${w.fp}, model alone ${bare} (step ${w.k})`, 'equal, bit for bit', w.fp === bare);

    // ---- 4. a dome's glass gone when the model says the dome has given way: the 1912 damage preset to the end
    await b.open('#scenario=titanic');
    await b.ev('TitanicApp.state.speed = 900');
    await hold(b, `(TitanicCore.stairState ? TitanicCore.stairState(sim) : []).some(o => o.dome && o.state === 2) || sim.foundered`, 'a dome giving way, or the end', 300000);
    await frames(b, 4);
    const dm = await b.ev(`(() => { const A = TitanicApp, st = TitanicCore.stairState ? TitanicCore.stairState(A.state.sim) : [], g = A.topsides.glass, ix = g.geometry.index.array;
      return A.topsides.domes.map(d => { const s = st.find(o => o.id === d.id), broken = !!(s && s.state === 2); let zeros = 0; for (let i = d.t0 * 3; i < d.t1 * 3; i++) if (ix[i] === 0) zeros++;
        return { id: d.id, broken, empty: zeros === (d.t1 - d.t0) * 3, drawn: d.broken }; }); })()`);
    if (shots) { await b.ev(`(() => { const A = TitanicApp; A.setView('quarter'); return true; })()`); await frames(b, 40); await b.shot(path.join(shots, 'dome-given-way.png')); }
    row('a dome\'s glass is gone once the model says it has given way (C.stairState), the other\'s stays', dm.map(d => `${d.id}: ${d.broken ? 'given way' : 'holding'}, glass ${d.empty ? 'gone' : 'drawn'}`).join('; '), 'gone exactly where given way',
      dm.length > 0 && dm.some(d => d.broken) && dm.every(d => d.broken === d.empty && d.broken === d.drawn));

    // ---- 4b. funnel 1 at the surface (G15; Z1's note q23, B.6): it stands until the model's sea reaches its seat's
    // forward edge, then falls (its triangles and lines out of her sets, a group of its own falling) and is gone 12 s of
    // her time later; a new run stands it again. Its triangles never use the bucket's vertex 0, so a zeroed index is an
    // emptied one
    const F1 = `(() => { const A = TitanicApp, P = A.topsides.built.parts.funnels[0].at, f = A.topsides.faces, s = A.topsides.one.state();
      let tri = 0, zero = 0; for (const k of ['buff', 'cap']) { const a = f[k].geometry.index.array; for (const [p, q] of P[k]) for (let t = 3 * p; t < 3 * q; t++) { tri++; if (a[t] === 0) zero++; } }
      return { s, tri, zero, wz: TitanicCore.worldZ(TitanicCore.frameOf(A.state.sim), s.seat[0], s.seat[1], s.seat[2]), t: A.state.sim.t, foundered: A.state.sim.foundered }; })()`;
    const wetAt = (h) => `(() => { const s = TitanicApp.topsides.one.state().seat; return TitanicCore.worldZ(TitanicCore.frameOf(sim), s[0], s[1], s[2]) <= ${h}; })() || sim.foundered`;
    await b.open('#scenario=titanic');
    await b.ev('TitanicApp.state.speed = 900');
    await hold(b, wetAt(1.0), 'the sea a metre under funnel 1\'s seat', 300000); await frames(b, 3);
    const g0 = await b.ev(F1);
    await hold(b, wetAt(0), 'the sea at funnel 1\'s seat', 120000); await frames(b, 3);
    const g1 = await b.ev(F1);
    await hold(b, `sim.t >= ${g1.s.fell === null ? 1e9 : g1.s.fell} + 13 || sim.foundered`, '13 s on', 120000); await frames(b, 3);
    const g2 = await b.ev(F1);
    await b.open('#scenario=titanic'); await b.ev('TitanicApp.state.playing = false'); await frames(b, 4);
    const g3 = await b.ev(F1);
    row('G15: funnel 1 stands until the model\'s sea reaches its seat, then falls on that step (its triangles out of her sets, a group of its own falling)',
      `a metre short: fell ${g0.s.fell}, ${g0.zero} of ${g0.tri} indices zero (sea ${g0.wz.toFixed(2)} m from the seat); at the seat (t ${g1.t} s): fell ${g1.s.fell}, gone ${g1.s.gone}, falling ${g1.s.falling}, ${g1.zero} of ${g1.tri} zero; foundered then ${g1.foundered}`,
      'standing, none zero; fell at that step, gone, falling, all zero; before her flag',
      g0.s.fell === null && g0.zero === 0 && g1.s.fell === g1.t && g1.s.gone && g1.s.falling && g1.zero === g1.tri && g1.tri > 0 && !g1.foundered);
    row('  out of sight 13 s of her time later; a new run stands it again', `13 s on: falling ${g2.s.falling}, gone ${g2.s.gone}; a new run: fell ${g3.s.fell}, ${g3.zero} of ${g3.tri} zero`, 'false, true; null, none zero',
      !g2.s.falling && g2.s.gone && g3.s.fell === null && !g3.s.gone && g3.zero === 0);

    // ---- 5. a phone: the frame time with her topsides and without (SwiftShader's numbers: compared, not absolute)
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#scenario=titanic');
    await b.ev('TitanicApp.state.playing = false; TitanicApp.setView("quarter")'); await frames(b, 40);
    const tOn = await b.ev(FRAMETIME(90, true)), tOff = await b.ev(FRAMETIME(90, false)), tOn2 = await b.ev(FRAMETIME(90, true));
    const pc = await b.ev(COUNT);
    if (shots) await b.shot(path.join(shots, 'phone-quarter.png'));
    const on = Math.min(tOn, tOn2);
    row('a phone (390 x 780, touch) keeps its frame rate with her topsides: the median frame, shown against hidden', `${on.toFixed(1)} ms against ${tOff.toFixed(1)} ms; ${pc.all.calls} draw calls (${pc.all.calls - pc.off.calls} hers), ${pc.all.tris} triangles`, 'within 25 % or 4 ms',
      on <= tOff * 1.25 || on - tOff <= 4);
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
