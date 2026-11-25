// C-4 step 3 (Z2, 2026-11-21; docs/DESIGN_page_layout_authority_v1_1_2026-11-21.md, section 4.3): the claims, in a real
// browser (headless Edge or Chrome), on the page's virtual clock (QC C-3: clock=test; tools/cdp.js's vrun).
//   node tools/claims_site_test.js [dist]
// What a part changes of the page's it claims (TitanicApp.claim(key, owner, value, rank), claims(key)), never saves and
// gives back; each key has one rule. On the 1912 orders after the ice it checks:
//   - the player-first rule (look.xray): the player's choice unless claimed; between claims the highest rank's value,
//     between equal ranks the earlier; with every claim let go, in either order, the player's choice again;
//   - the player's input while a claim stands is the later choice: each claimant is told ('overruled'), and decides;
//   - the 'any' rule (the marks of the damage): hidden while any claim stands, released in either order;
//   - C-7: a hold of the page's pace is its owner's (holdPace(s, owner)): the reports' release does not end the
//     director's hold, nor the other way round, nor an anonymous release a named one; the director's own hold (a cut)
//     outlives another's release;
//   - the bridge's view ("As the bridge knew it") claims X-ray and the columns off while it is on: the player's columns
//     are let go to them and the view stays; the player's X-ray ends the view;
//   - every pair of the looks that claim (the Night look, the bridge's view, the walk), each pair turned on and off in
//     both orders, with X-ray on and off at the start: the page as it started (QC_C's S3, its first step).
'use strict';
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(64) + ' ' + ref); }
const WARP = 6, SPEED = 240;

(async () => {
  const b = await B.launch({ dist });
  try {
    const until = async (cond, what, ms) => {
      await b.ev(`(() => { const A = TitanicApp; window.__held = false; const sim = A.state.sim;
        if (sim && (${cond})) { window.__held = true; return; }
        const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); A.state.playing = true; })()`);
      await b.vrun('window.__held', { maxMs: ms || 600000, held: false, what });
    };
    const clickUntil = async (sel, cond, what) => {
      for (let n = 1; ; n++) {
        await b.clickSel(sel);
        if ((await b.vrun(cond, { maxMs: 1000, held: false })).done) return n;
        if (n >= 5) throw new Error('the page\'s time ran out waiting for ' + what);
      }
    };
    // the page's flags the looks touch
    const FLAGS = `(() => { const A = TitanicApp, S = A.state, m = A.marks.claims();
      return { xray: S.xray, xc: S.xrayChoice, cols: S.cols, cc: S.colsChoice, night: !!(A.nightScene && A.nightScene.on), view: A.reports.view(), walk: A.walk.on(), sview: S.view,
        marks: m.openings.join('+') + '/' + m.dents.join('+'), lx: A.claims('look.xray').map(c => c.owner).join('+'), lc: A.claims('look.cols').map(c => c.owner).join('+'),
        holes: A.marks.openings.visible, dents: A.marks.dents.visible, hull: A.hull.material.uuid, bx: document.getElementById('bXray').getAttribute('aria-pressed'), pace: A.pace() }; })()`;
    const flags = () => b.ev(FLAGS);
    const same = (a, c) => JSON.stringify(a) === JSON.stringify(c);
    const diff = (a, c) => Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(c[k])).map(k => `${k} ${a[k]} -> ${c[k]}`).join('; ');

    await b.open('#night=1912', { virtual: true });
    await b.click('bAuto');
    await b.vrun('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', { maxMs: 2000, held: false, what: 'the 1912 orders' });
    await b.ev(`TitanicApp.state.warp = ${WARP}`);
    await until('sim.night.tClear >= 0', 'the end of the encounter');
    if (await b.ev('!!(document.getElementById("rpSlow") && document.getElementById("rpSlow").checked)')) await clickUntil('#rpSlow', '!document.getElementById("rpSlow").checked', 'the reports\' slowing off');
    await clickUntil(`#speedSeg [data-speed="${SPEED}"]`, `TitanicApp.state.speed === ${SPEED}`, 'the pace at ' + SPEED + 'x');
    await clickUntil('[data-view="quarter"]', 'TitanicApp.state.view === "quarter"', 'the Quarter view');
    await b.ev('TitanicApp.state.playing = true'); await b.vframes(3);
    const f0 = await flags();

    // ---- 1. the player-first rule, with ranks, released in both orders
    const seq = await b.ev(`(() => { const A = TitanicApp, S = A.state, out = [];
      const at = () => out.push(S.xray + '/' + document.getElementById('bXray').getAttribute('aria-pressed') + '/' + A.claims('look.xray').map(c => c.owner + ':' + c.value + ':' + c.rank).join('+'));
      at(); A.claim('look.xray', 't1', false); at(); A.claim('look.xray', 't2', true); at(); A.claim('look.xray', 't2', true, 1); at();
      A.claim('look.xray', 't2', null); at(); A.claim('look.xray', 't1', null); at();
      A.claim('look.xray', 't1', false); A.claim('look.xray', 't2', true, 1); A.claim('look.xray', 't1', null); at(); A.claim('look.xray', 't2', null); at();
      return { out, choice: S.xrayChoice }; })()`);
    const wantSeq = ['true/true/', 'false/false/t1:false:0', 'false/false/t1:false:0+t2:true:0', 'true/true/t1:false:0+t2:true:1', 'false/false/t1:false:0', 'true/true/', 'true/true/t2:true:1', 'true/true/'];
    row('the player-first rule (look.xray): the player\'s choice unless claimed; between claims the higher rank, between equal ranks the earlier; all let go, in either order: the choice again',
      seq.out.join(' | '), wantSeq.join(' | '), same(seq.out, wantSeq) && seq.choice === true);

    // ---- 2. the player's input while a claim stands: the claimant told, and it decides
    const o1 = await b.ev(`(() => { const A = TitanicApp; window.__over = []; window.__keep = true;
      window.__ovf = A.on('event', (n, d) => { if (n !== 'overruled' || d.owner !== 't9') return; window.__over.push(d.key + ':' + d.owner); if (!window.__keep) A.claim(d.key, d.owner, null); });
      A.claim('look.xray', 't9', false); return A.state.xray; })()`);
    await b.click('bXray'); await b.vframes(2);
    const o2 = await b.ev(`({ xray: TitanicApp.state.xray, choice: TitanicApp.state.xrayChoice, over: window.__over.slice(), claims: TitanicApp.claims('look.xray').map(c => c.owner) })`);
    await b.ev(`(() => { window.__keep = false; TitanicApp.claim('look.xray', 't9', null); TitanicApp.claim('look.xray', 't9', false); window.__over = []; })()`);
    await b.click('bXray'); await b.vframes(2);
    const o3 = await b.ev(`(() => { const A = TitanicApp, r = { xray: A.state.xray, over: window.__over.slice(), claims: A.claims('look.xray').map(c => c.owner) }; A.off('event', window.__ovf); return r; })()`);
    row('the player\'s X-ray while a claim stands is the later choice: the claimant is told (\'overruled\') and decides: kept, X-ray stays as claimed; let go, the player\'s X-ray at once',
      `claimed: X-ray ${o1}; the click, the claim kept: X-ray ${o2.xray}, the choice ${o2.choice}, told ${o2.over.join(',') || 'nobody'}, claims ${o2.claims.join('+') || 'none'}; the click, let go: X-ray ${o3.xray}, told ${o3.over.join(',') || 'nobody'}, claims ${o3.claims.join('+') || 'none'}`,
      'false; false, true, look.xray:t9, t9; true, look.xray:t9, none',
      o1 === false && o2.xray === false && o2.choice === true && o2.over.join() === 'look.xray:t9' && o2.claims.join() === 't9' && o3.xray === true && o3.over.join() === 'look.xray:t9' && o3.claims.length === 0);

    // ---- 3. the 'any' rule: the marks of the damage hidden while any claim stands
    const mk = await b.ev(`(() => { const A = TitanicApp, M = A.marks, out = [], at = () => { A.test.frame(1000 / 60); out.push((M.openings.visible ? 'shown' : 'hidden') + ':' + M.claims().openings.join('+')); };
      at(); M.claim('openings', 'm1', true); at(); M.claim('openings', 'm2', true); at(); M.claim('openings', 'm1', false); at(); M.claim('openings', 'm2', false); at();
      M.claim('openings', 'm1', true); M.claim('openings', 'm2', true); M.claim('openings', 'm2', false); at(); M.claim('openings', 'm1', false); at();
      return out; })()`);
    const wantMk = ['shown:', 'hidden:m1', 'hidden:m1+m2', 'hidden:m2', 'shown:', 'hidden:m1', 'shown:'];
    row('the \'any\' rule (the marks of the damage): hidden while any claim stands, shown again only when the last goes, in either order',
      mk.join(' | '), wantMk.join(' | '), same(mk, wantMk));

    // ---- 4. C-7: each owner's hold its own
    const c7 = await b.ev(`(() => { const A = TitanicApp, out = [], at = () => out.push(A.pace());
      at(); A.holdPace(30, 'director'); at(); A.holdPace(10, 'reports'); at(); A.holdPace(0, 'reports'); at(); A.holdPace(0, 'director'); at();
      A.holdPace(10, 'reports'); A.holdPace(30, 'director'); A.holdPace(0, 'director'); at(); A.holdPace(0, 'reports'); at();
      A.holdPace(30, 'walk'); A.holdPace(0); at(); A.holdPace(0, 'walk'); at();
      return out; })()`);
    const wantC7 = [SPEED, 1, 1, 1, SPEED, 1, SPEED, 1, SPEED];
    row('QC C-7: a hold of the page\'s pace is its owner\'s: the reports\' release does not end the director\'s, nor the director\'s the reports\', nor an anonymous release a named one',
      c7.join(', '), wantC7.join(', '), same(c7, wantC7));
    // the director's own hold, from a real cut, outlives an anonymous release (before C-7 the parts held anonymously)
    await b.click('bDirector'); await b.vframes(2);
    const d1 = await b.ev(`(() => { const A = TitanicApp, c = A.director.cuts(), last = c[c.length - 1] || null; const before = A.pace(); A.holdPace(0); A.holdPace(0, 'reports'); return { on: A.director.on(), cut: last ? last.trigger + ' to ' + last.view + ', hold ' + last.hold : 'none', hold: last ? last.hold : 0, before, after: A.pace() }; })()`);
    await b.click('bDirector'); await b.vframes(2);
    const d2 = await b.ev('({ on: TitanicApp.director.on(), pace: TitanicApp.pace() })');
    row('  ... the director\'s own hold (its cut on being turned on) is its own: an anonymous release and the reports\' leave it; turned off, the player\'s pace again',
      `director ${d1.on}, cut ${d1.cut}; the pace ${d1.before} -> ${d1.after} after the releases; turned off: ${d2.on}, the pace ${d2.pace}`,
      `true, a cut with a hold; 1 -> 1; false, ${SPEED}`, d1.on && d1.hold > 0 && d1.before === 1 && d1.after === 1 && !d2.on && d2.pace === SPEED);

    // ---- 5. the bridge's view: X-ray and the columns claimed off while on; the player's columns let go to them, the
    // view staying; the player's X-ray ends the view
    const g0 = await flags();
    await b.clickSel('#rpView'); await b.vframes(3);
    const g1 = await flags();
    await b.click('bCols'); await b.vframes(3);
    const g2 = await flags();
    await b.click('bXray'); await b.vframes(3);
    const g3 = await flags();
    await b.click('bCols'); await b.vframes(3);
    const g4 = await flags();
    row('the bridge\'s view claims X-ray and the columns off while on; the player\'s columns are let go to them and the view stays; the player\'s X-ray ends the view',
      `before: X-ray ${g0.xray}, columns ${g0.cols}; the view on: ${g1.view}, X-ray ${g1.xray} (${g1.lx}), columns ${g1.cols} (${g1.lc}); columns clicked: view ${g2.view}, columns ${g2.cols} (${g2.lc || 'no claim'}); X-ray clicked: view ${g3.view}, X-ray ${g3.xray}, columns ${g3.cols}; columns clicked again: ${g4.cols}`,
      'true, false; true, false (bridge), false (bridge); true, true (no claim); false, true, true; false',
      g0.xray && !g0.cols && g1.view && !g1.xray && g1.lx === 'bridge' && !g1.cols && g1.lc === 'bridge' && g2.view && g2.cols && g2.lc === '' && !g3.view && g3.xray && g3.cols && g3.lx === '' && !g4.cols && same(g4, g0));

    // ---- 5b. the rank rule on the hull's material (material.hull: the Night look's): a claimed material stays however
    // often the look is applied again; let go, the look's own; the pieces' (material.pieces: pieceLook, the deep's lamp)
    const MAT = `(() => { const A = TitanicApp, H = A.hull, mat = A.nightScene.hullMat; return H.material === mat ? 'claimed' : (A.state.xray ? 'xray' : 'solid'); })()`;
    const h0 = await b.ev(MAT);
    await b.ev('TitanicApp.claim("material.hull", "t1", TitanicApp.nightScene.hullMat)');
    const h1 = await b.ev(MAT);
    await b.click('bXray'); await b.vframes(2);    // the look applied again (X-ray off) under the claim
    const h2 = await b.ev(MAT);
    await b.ev('TitanicApp.claim("material.hull", "t1", null)');
    const h3 = await b.ev(MAT);
    await b.click('bXray'); await b.vframes(2);
    const h4 = await b.ev(MAT);
    const pl = await b.ev(`(() => { const A = TitanicApp, mat = A.nightScene.hullMat, out = []; A.pieceLook(mat); out.push(A.claims('material.pieces').map(c => c.owner + ':' + (c.value === mat)).join('+')); A.pieceLook(null); out.push(A.claims('material.pieces').length); return out; })()`);
    row('the rank rule on the hull\'s material: a claimed material stays when the look is applied again; let go, the look\'s own; the pieces\' (pieceLook) a claim of the deep\'s',
      `${h0}; claimed: ${h1}; X-ray off under it: ${h2}; let go: ${h3}; X-ray on: ${h4}; pieceLook: ${pl[0]}, then ${pl[1]} claims`,
      'xray; claimed; claimed; solid; xray; deep:true, then 0', h0 === 'xray' && h1 === 'claimed' && h2 === 'claimed' && h3 === 'solid' && h4 === 'xray' && pl[0] === 'deep:true' && pl[1] === 0);

    // ---- 6. every pair of the looks that claim, on and off in both orders, from X-ray on and from X-ray off
    const LOOKS = {
      night: { sel: '#bNight', is: '!!(TitanicApp.nightScene && TitanicApp.nightScene.on)' },
      view: { sel: '#rpView', is: 'TitanicApp.reports.view()' },
      walk: { sel: 'button[data-view="walk"]', is: 'TitanicApp.walk.on()' },
    };
    const turn = async (k, on) => { const L = LOOKS[k]; if ((await b.ev(L.is)) !== on) { await b.clickSel(L.sel); await b.vframes(3); } };
    const bad = [];
    let runs = 0;
    // from the Quarter view: the walk, left, goes back to it (its own rule, the camera's pose being no claim yet: D78's
    // decision 7), and the director's row above left the page where its cut had put it (11c's first run: Profile)
    await clickUntil('[data-view="quarter"]', 'TitanicApp.state.view === "quarter"', 'the Quarter view');
    for (const xr of [true, false]) {
      if ((await b.ev('TitanicApp.state.xray')) !== xr) { await b.click('bXray'); await b.vframes(2); }
      const s0 = await flags();
      for (const [a, c] of [['night', 'view'], ['night', 'walk'], ['view', 'walk']]) {
        for (const order of [[c, a], [a, c]]) {
          await turn(a, true); await turn(c, true);
          await turn(order[0], false); await turn(order[1], false);
          const s1 = await flags(); runs++;
          if (!same(s1, s0)) bad.push(`X-ray ${xr}: ${a} on, ${c} on, ${order[0]} off, ${order[1]} off: ${diff(s0, s1)}`);
        }
      }
    }
    if ((await b.ev('TitanicApp.state.xray')) !== f0.xray) { await b.click('bXray'); await b.vframes(2); }
    row('every pair of the looks that claim (Night, the bridge\'s view, the walk), each turned on and off in both orders, with X-ray on and off: the page as it started',
      bad.length ? bad.slice(0, 3).join(' || ') : `${runs} runs, each ending as it began (X-ray, its choice, the columns, the looks, the view, the claims, the marks, the hull's material, the pace)`,
      `${runs || 12} runs, each as it began`, runs === 12 && bad.length === 0);

    const errs = b.errors ? b.errors.filter(x => !/favicon/i.test(x)) : [];
    row('no error in the page', errs.length ? errs.slice(0, 3).join(' | ') : 'none', 'none', errs.length === 0);
  } catch (err) {
    console.error(err && err.stack || err);
    fails++;
  } finally {
    await b.close();
  }
  console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  process.exitCode = fails ? 1 : 0;
})();
