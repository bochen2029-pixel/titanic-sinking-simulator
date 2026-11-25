// The boats in the page (site/parts/50_boats.js over core/readers/people.js), in headless Edge or Chrome, with nothing
// beyond Node.
//   node tools/boats_site_test.js [dist] [screenshot dir] [--real]
// Checks that on the 1912 orders the page's count is the model's (the page's own reader, and the model run alone in the
// page; Node's run is printed beside it), that a boat drawn going down stands at the height the model gives her, that the
// watch's fingerprint in the page is the model's alone, that orders from the part's controls (real clicks on exact steps)
// are in the watch's log and "Replay my watch" gives the same boats, that the controls fit on a phone, that a damage
// preset shows no boats, and that nothing is logged as an error. And the page's seams (S2, Y8): on the 1912 orders a
// boats order after the ice makes the watch the player's and enables "Replay my watch", and asks for no new forecast (a
// rocket neither; a pump order does); the HUD's layout at 1400 x 860: the readouts one line each with the inflow in four
// and five figures, the boats' count one line, and the end card clear of it at the foundering. And the boats' numbers,
// drawn again in the page's face once it has loaded: the same pixels on two loads of the page.
// The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): each page is opened with clock=test,
// so only this suite's passes move it (tools/cdp.js's vrun and vframes, 1000/60 ms a pass), and a busy machine changes how
// long the suite takes, never what it sees. Every wait on the page's own frames runs its passes with the bound in its own
// time. Three stay on the wall clock, the page standing still meanwhile: the table of other watches (the page's worker),
// the labels' face (the font's loading), and the phone's Run sheet (a CSS transition). No row measures real time. --real
// runs it all on real time, as before C-3, for comparison.
'use strict';
const path = require('path');
const Br = require('./cdp');
const C = require('../core/core.js');
const N = require('../core/night.js');
const BP = require('../core/readers/people.js');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(72) + ' ' + ref); }
const COUNT = (r) => ({ away: r.boatsAway, inAway: r.inBoatsAway, empty: r.emptyAway, aboard: r.aboard, water: r.water });
const fmt = (n) => Math.round(n).toLocaleString('en-US');
// The HUD's layout as boxes (CSS pixels): each readout's label and value in lines of its own line height, whether one runs
// past its box or the readouts' edge; the readouts, the view buttons, the boats' count and the end card
const HUD = `(() => { const box = (e) => { if (!e || e.hidden || !e.offsetParent) return null; const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom].map(x => Math.round(x * 10) / 10); };
  const ro = document.getElementById('readout'), cs = getComputedStyle(ro), edge = ro.getBoundingClientRect().right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
  const lines = (e) => { const s = getComputedStyle(e), px = (p) => parseFloat(s[p]) || 0;
    return Math.round((e.getBoundingClientRect().height - px('paddingTop') - px('paddingBottom') - px('borderTopWidth') - px('borderBottomWidth')) / parseFloat(s.lineHeight) * 100) / 100; };
  const cells = [...ro.querySelectorAll('.stats > .stat')].filter(e => getComputedStyle(e).display !== 'none');
  const chip = document.getElementById('boatsChip');
  return { inflow: TitanicCore.readouts(TitanicApp.state.sim).inflowTpm, clock: TitanicApp.clockOf(TitanicApp.state.sim.t),
    cells: cells.map(e => { const k = e.querySelector('.k'), v = e.querySelector('.v'); return { k: k.textContent, v: v.textContent, kl: lines(k), vl: lines(v), over: k.scrollWidth > k.clientWidth + 0.5 || v.scrollWidth > v.clientWidth + 0.5, out: e.getBoundingClientRect().right > edge + 0.5 }; }),
    rows: new Set(cells.map(e => Math.round(e.getBoundingClientRect().top))).size,
    readout: box(ro), views: box(document.querySelector('#hud .views')), chip: box(chip), chipLines: chip && !chip.hidden ? lines(chip) : 0, card: box(document.getElementById('endCard')) }; })()`;
const meets = (a, b) => !!(a && b) && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];   // two boxes overlap
// The boats' numbers once the page's face (their font) has loaded: a hash of each label's pixels, all of them hashed into
// one, and whether each is what the part's own drawing gives now, in the loaded face, on a fresh canvas
const TAGS = `(async () => { const B = TitanicApp.boats; await document.fonts.load(B.TAG_FONT, '0123456789ABCD'); await document.fonts.ready;
  for (let i = 0; i < 100 && !B.tagsInFace(); i++) await new Promise(r => setTimeout(r, 50));
  const hash = (cv) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 2166136261; for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619); return (h >>> 0).toString(16).padStart(8, '0'); };
  const tags = B.tags(), mine = tags.map(s => hash(s.material.map.image));
  const fresh = tags.map(s => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 32; B.drawTag(cv, s.userData.text); return hash(cv); });
  let all = 2166136261; for (const h of mine) for (let i = 0; i < h.length; i++) all = Math.imul(all ^ h.charCodeAt(i), 16777619);
  return { face: document.fonts.check(B.TAG_FONT), redrawn: B.tagsInFace(), n: tags.length, all: (all >>> 0).toString(16).padStart(8, '0'), same: mine.every((h, i) => h === fresh[i]) }; })()`;
const oneLine = (h) => h.cells.length === 5 && h.cells.every(c => c.kl <= 1.2 && c.vl <= 1.2 && !c.over && !c.out) && !meets(h.readout, h.views);

(async () => {
  const b = await Br.launch({ dist });
  // stop the page's clock on the first step where `cond` holds (page code on `sim`); see tools/night_site_test.js
  // The page runs on its own passes until then (vrun, the bound in its own time), or with --real on real time
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (REAL) await b.waitFor('window.__held', ms || 240000, what);
    else await b.vrun('window.__held', { maxMs: ms || 240000, held: false, what });
  };
  // a page expression waited for on the page's own passes (with --real, on real time); at once if it already holds
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  // the page let run for ms of its own time (with --real, of real time), as a sleep let it before
  const settle = (ms) => (REAL ? Br.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
  // a picture, drawn on a pass of its own under the virtual clock
  const picture = async (name) => { if (!shots) return; if (!REAL) await b.vframes(1, { render: true }); await b.shot(path.join(shots, name)); };
  const go = () => b.ev('TitanicApp.state.playing = true');
  const order = async (sel) => {                  // a real click; the order must reach the watch's log on this step
    const n0 = await b.ev('TitanicApp.state.sim.night.log.length');
    await b.clickSel(sel);
    await waitPage(`TitanicApp.state.sim.night.log.length > ${n0}`, 5000, 'the order from ' + sel + ' in the watch\'s log');
  };
  const ship = C.buildShip();
  try {
    // ---- 1. the 1912 orders, watched fast to the end. Its plunge (the inflow in five figures) and its foundering come after
    // the break's onset: since G12's cascade (D98) the default watch is handed over there, so this session runs the what-if
    // handed over at her flag (handover=flag: today's watch to the bit), and the model alone is made the same way
    await b.open('#night=1912&handover=flag', OPEN);
    const tags1 = await b.ev(TAGS);                          // the boats' labels on the first load of the page (row in 1b)
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 240');
    // a boat going down: the step held, a few frames drawn, then her drawn height against the model's
    await holdWhen('sim.people && sim.people.boats.some(x => x.state === "lowering" && !(x.tWater >= 0) && x.low > 3)', 'a boat going down');
    await settle(600);
    const low = await b.ev(`(() => { const d = TitanicApp.boats.drawn().filter(x => x.state === 'lowering' && x.parent === 'scene'); const s = TitanicApp.state.sim; return { k: s.night.k, T: (s.t - s.night.tTouch) / 60, post: TitanicApp.state.post, boats: d.map(x => ({ id: x.id, y: x.y, h: x.h, visible: x.visible })) }; })()`);
    const worst = low.boats.reduce((a, x) => Math.max(a, Math.abs(x.y - x.h)), 0);
    row('a boat drawn going down stands at the height the model gives her (her keel above the sea)', low.boats.map(x => x.id + ': drawn ' + x.y.toFixed(3) + ' m, model ' + x.h.toFixed(3) + ' m').join('; ') + ' (T ' + low.T.toFixed(1) + ')',
      'equal (within 1 mm); drawn in the scene, plumb', low.boats.length > 0 && low.boats.every(x => x.visible) && worst < 1e-3 && low.post === 0);
    if (shots) { await b.ev('TitanicApp.setView("quarter")'); await settle(2500); await picture('boats_lowering.png'); }
    await go();
    await b.ev('TitanicApp.state.speed = 900');
    // the readouts with the inflow in four figures, then five (the page's clock held on the first step of each, the HUD
    // read once it has redrawn), at 1400 x 860: each label and each value one line (they broke at four figures)
    await holdWhen('TitanicCore.readouts(sim).inflowTpm >= 1000', 'the inflow in four figures');
    await settle(500);
    const four = await b.ev(HUD);
    await picture('boats_hud_four_figures.png');
    await go();
    await holdWhen('TitanicCore.readouts(sim).inflowTpm >= 10000 || sim.foundered', 'the inflow in five figures');
    await settle(500);
    const five = await b.ev(HUD);
    await go();
    const said = (h) => h.cells.map(c => c.v).join(' | ') + ' (' + h.clock + ', ' + h.rows + ' row' + (h.rows > 1 ? 's' : '') + ')';
    row('the readouts with the inflow in four figures (held on its first step, 1400 x 860): every label and every value one line, none past its box or the readouts\' edge, clear of the view buttons',
      said(four) + '; the boats\' count ' + four.chipLines + ' line', 'each one line; the count one line (it broke at 360 px)', oneLine(four) && four.inflow >= 1000 && four.inflow < 10000 && four.rows === 1 && four.chipLines <= 1.2);
    row('  ... and in five figures (the plunge): each still one line; a value may go whole to a second row',
      said(five), 'each one line, none past its box or the edge', oneLine(five) && five.inflow >= 10000);
    await waitPage('TitanicApp.state.sim.foundered', 300000, 'the foundering');
    await settle(600);
    const end = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, r = TitanicPeople.readouts(s); A.boats.sync(); return { k: s.night.k, fp: TitanicNight.fingerprint(s), r: { boatsAway: r.boatsAway, inBoatsAway: r.inBoatsAway, emptyAway: r.emptyAway, aboard: r.aboard, water: r.water }, stats: A.boats.stats(), chip: A.boats.chip(), states: r.list.map(x => x.id + ':' + x.state + ':' + x.n).join(' ') }; })()`);
    // the end card and the boats' count at the right of the stage, under the view buttons: the card stands below the count,
    // whatever lines it has (the people in the water once she has gone make it two), and nothing there meets anything else
    await settle(400);                                       // the card is placed again on the layout's next passes
    const fin = await b.ev(HUD);
    await picture('boats_end_card_and_count.png');
    row('at the foundering (1400 x 860) the boats\' count and the end card do not overlap; the count is clear of the readouts and the view buttons',
      'count ' + JSON.stringify(fin.chip) + ' (' + fin.chipLines + ' lines); card ' + JSON.stringify(fin.card) + '; readouts ' + JSON.stringify(fin.readout) + '; view buttons ' + JSON.stringify(fin.views),
      'the card below the count; no two of them meet', !!fin.chip && !!fin.card && !meets(fin.chip, fin.card) && !meets(fin.chip, fin.readout) && !meets(fin.chip, fin.views) && !meets(fin.card, fin.views) && fin.card[1] >= fin.chip[3]);
    const words = { away: end.r.boatsAway + ' of 20', in: fmt(end.r.inBoatsAway), empty: fmt(end.r.emptyAway), aboard: fmt(end.r.aboard), water: fmt(end.r.water) };
    const shown = Object.keys(words).every(k => end.stats[k] === words[k]) && end.chip.indexOf(end.r.boatsAway + ' of 20 away · ' + fmt(end.r.inBoatsAway) + ' in them · ' + fmt(end.r.emptyAway) + ' places empty') >= 0;
    // the same watch by the model alone inside the page (the watch and its reader, no viewer, no frames), to the same step
    const alone = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true, handover: 'flag' }); while (s.night.k < ${end.k}) N.step(s); const r = TitanicPeople.readouts(s); return { r: { boatsAway: r.boatsAway, inBoatsAway: r.inBoatsAway, emptyAway: r.emptyAway, aboard: r.aboard, water: r.water }, states: r.list.map(x => x.id + ':' + x.state + ':' + x.n).join(' ') }; })()`);
    row('on the 1912 orders to the end, the page\'s count is the model\'s: what the part shows, and the model alone in the page', '"' + end.chip + '"; the model alone: ' + JSON.stringify(COUNT(alone.r)) + (alone.states === end.states ? ', every boat the same' : ', boats DIFFER'),
      JSON.stringify(COUNT(end.r)), shown && JSON.stringify(COUNT(alone.r)) === JSON.stringify(COUNT(end.r)) && alone.states === end.states);
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true, readers: false, handover: 'flag' }); while (s.night.k < ${end.k}) N.step(s); return N.fingerprint(s); })()`);
    row('the watch\'s fingerprint in the page is the model\'s alone (no reader, no viewer)', 'page ' + end.fp + ', the model alone in the page ' + bare, 'equal', end.fp === bare);
    // the same watch in Node: the same boats when the two engines' maths agree (README, the Math.pow caveat); information
    const sim = N.create(ship, N.spec(1912), { auto: true, handover: 'flag' }); while (sim.night.k < end.k) N.step(sim);
    const nodeR = BP.readouts(sim), nodeStates = nodeR.list.map(x => x.id + ':' + x.state + ':' + x.n).join(' ');
    console.log('     across engines: Node ' + JSON.stringify(COUNT(nodeR)) + ', fingerprint ' + N.fingerprint(sim) + (nodeStates === end.states && N.fingerprint(sim) === end.fp ? ': the same boats and bits' : ': ' + (nodeStates === end.states ? 'the same boats; the last bits differ' : 'the boats differ: the engines\' maths part somewhere')));
    if (shots) { await b.ev('TitanicApp.setView("plan")'); await settle(2500); await picture('boats_away.png'); }

    // ---- 1b. S2 and Y8 on the 1912 orders: an order from the part's controls after the ice (a real click on the held step
    // two minutes after the touch, when every scripted order has been given) makes the watch the player's, goes in the log
    // and enables "Replay my watch". The page's forecast is asked for after the model's own orders only: on that same step
    // a boat order and a rocket (help's panel) ask for none, a pump order (the Systems tab) for one; the page counts the
    // requests (state.fcAsked)
    await b.open('#night=1912', OPEN);
    const tags2 = await b.ev(TAGS);                          // and on the second
    row('the boats\' numbers are drawn again in the page\'s face once it has loaded: the same pixels on two loads of the page, and what the drawing gives in that face',
      `load 1: ${tags1.all}, load 2: ${tags2.all} (${tags1.n} labels); as drawn afresh in the face: ${tags1.same} and ${tags2.same}; the face loaded: ${tags1.face && tags2.face}`, 'equal; true and true; true (they came out in the face or its fallback, load by load)',
      tags1.n === 20 && tags1.all === tags2.all && tags1.same && tags2.same && tags1.redrawn && tags2.redrawn && tags1.face && tags2.face);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 60');
    const kT2 = await b.ev('Math.round(TitanicApp.state.sim.night.tTouch / 0.25)');
    await holdWhen(`sim.night.k >= ${kT2 + 480}`, 'two minutes after the touch');
    // the table of other watches, above the parts' sections in the Run tab, fills in from the page's worker whatever the
    // clock does: a click measured before a row came and made after it lands lower down (a rocket's was lost so, once).
    // These orders are not to be given twice, so the panel is let settle first. The table is the worker's, outside the
    // page's clock: waited for on the wall clock, the page standing still meanwhile
    await b.waitFor(`document.querySelectorAll('#winBody tr').length === 7`, 240000, 'the table of other watches');
    const at = `(() => { const A = TitanicApp, L = A.state.sim.night.log, o = L[L.length - 1]; return { k: A.state.sim.night.k, mode: A.state.night.mode, replay: !document.getElementById('bReplay').disabled, n: L.length, last: o ? [o.k, o.type, o.value, o.arg === undefined ? null : o.arg] : null, asked: A.state.fcAsked, over: A.state.night.over, script: !!A.state.sim.night.script }; })()`;
    const y0 = await b.ev(at);
    await order('#boatsUncover');
    const y1 = await b.ev(at);
    row('on the 1912 orders, a boats order after the ice (a real click on the held step two minutes after the touch) makes the watch the player\'s, is in the log, and enables "Replay my watch"',
      `mode ${y0.mode} -> ${y1.mode}; Replay ${y0.replay ? 'enabled' : 'disabled'} -> ${y1.replay ? 'enabled' : 'disabled'}; the log's last ${JSON.stringify(y1.last)} on step ${y1.k}`,
      'auto -> you; disabled -> enabled; boats:uncover now on the held step', y0.over && y0.mode === 'auto' && y0.script && !y0.replay && y1.mode === 'you' && !y1.script && y1.replay && y1.n === y0.n + 1 && y1.last[0] === y1.k && y1.last[1] === 'boats:uncover' && y1.last[2] === 'now');
    await order('#bHelpRocket');
    const y2 = await b.ev(at);
    await b.clickSel('.tab[data-tab="systems"]');
    await waitPage(`!!document.querySelector('#pumpRooms button[data-pwhich="all"]')`, 10000, 'a room to pump in the Systems tab');
    await order('#pumpRooms button[data-pwhich="all"]');
    const y3 = await b.ev(at);
    await b.clickSel('.tab[data-tab="run"]');
    row('after the ice the page asks for a new forecast after the model\'s own orders only: a boat order none, a rocket none, a pump order one (on the held step)',
      `requests: boat +${y1.asked - y0.asked}, rocket +${y2.asked - y1.asked} (${y2.last[1]}), pump +${y3.asked - y2.asked} (${y3.last[1]} ${y3.last[2]} ${y3.last[3]})`, '+0, +0, +1',
      y1.asked === y0.asked && y2.asked === y1.asked && y2.last[1] === 'help:rocket' && y3.asked === y2.asked + 1 && y3.last[1] === 'pump' && y3.k === y0.k);

    // ---- 2. orders from the part's controls, by real clicks on exact steps, and "Replay my watch"
    await b.open('#night=1912', OPEN);
    await b.ev('TitanicApp.state.warp = 6');
    await holdWhen('sim.night.tBells >= 0 && sim.t - sim.night.tBells >= 20.5 - 1e-9', 'the step of the helm order');
    await order('#bHardPort'); await go();
    await holdWhen('sim.night.tTouch >= 0', 'the touch'); await order('#bHardStbd'); await go();
    await holdWhen('sim.night.tTouch >= 0 && sim.mo.t >= sim.night.tTouch + 60', 'a minute after the touch'); await order('#telegraph button[data-order="stop"]'); await go();
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 240');
    const kT = await b.ev('Math.round(TitanicApp.state.sim.night.tTouch / 0.25)');
    await holdWhen(`sim.night.k >= ${kT + 480}`, 'two minutes after the touch'); await order('#boatsUncover'); await go();
    await holdWhen(`sim.night.k >= ${kT + 30 * 240}`, 'half an hour after the touch'); await order('#boatsRuleP button[data-rule="first"]'); await go();
    await holdWhen(`sim.night.k >= ${kT + 40 * 240}`, 'forty minutes after the touch'); await order('#boatsFill button[data-fill="0.5"]'); await go();
    await holdWhen(`sim.night.k >= ${kT + 80 * 240}`, 'eighty minutes after the touch');
    const mine = await b.ev(`(() => { const s = TitanicApp.state.sim, r = TitanicPeople.readouts(s); return { k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => [o.k, o.type, o.value, o.arg === undefined ? null : o.arg]), people: JSON.stringify(Object.assign({}, s.people, { obs: undefined })), count: COUNT_(r), rule: r.rule, fill: r.fill, uncover: r.uncoverBy }; function COUNT_(r) { return { away: r.boatsAway, inAway: r.inBoatsAway, aboard: r.aboard }; } })()`);
    const boatsOrders = mine.log.filter(o => String(o[1]).indexOf('boats:') === 0);
    row('orders from the part\'s controls (real clicks, each on its step) are in the watch\'s log', boatsOrders.map(o => o[1] + ' ' + o[2] + (o[3] ? ' ' + o[3] : '') + ' @' + o[0]).join('; '),
      'boats:uncover now; boats:rule first port; boats:fill 0.5, at their steps', boatsOrders.length === 3 && boatsOrders[0][1] === 'boats:uncover' && boatsOrders[0][0] === kT + 480 && boatsOrders[1][1] === 'boats:rule' && boatsOrders[1][2] === 'first' && boatsOrders[1][3] === 'port' && boatsOrders[2][1] === 'boats:fill' && boatsOrders[2][2] === 0.5 && mine.uncover === 'order' && mine.rule.port === 'first' && mine.fill === 0.5);
    if (shots) { await b.ev('TitanicApp.setView("quarter")'); await settle(2000); await picture('boats_orders.png'); }
    await b.click('bReplay');
    await waitPage('TitanicApp.state.sim.night.k < 20 && TitanicApp.state.night.mode === "replay"', 10000, 'the replay');
    await b.ev('TitanicApp.state.warp = 6');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the replay past the ice');
    await b.ev('TitanicApp.state.speed = 240');
    await holdWhen(`sim.night.k >= ${mine.k}`, 'the replay at the same step');
    const again = await b.ev(`(() => { const s = TitanicApp.state.sim; return { k: s.night.k, fp: TitanicNight.fingerprint(s), log: s.night.log.map(o => [o.k, o.type, o.value, o.arg === undefined ? null : o.arg]), people: JSON.stringify(Object.assign({}, s.people, { obs: undefined })) }; })()`);
    row('"Replay my watch" gives the same boats: the same log, the same reader\'s state, the same fingerprint', 'step ' + again.k + ': ' + (again.people === mine.people ? 'the same boats' : 'boats DIFFER') + '; ' + again.fp + ' (the watch ' + mine.fp + ')',
      'equal, to the bit', again.k === mine.k && again.fp === mine.fp && again.people === mine.people && JSON.stringify(again.log) === JSON.stringify(mine.log));
    // the same log in Node (information: two engines agree when their maths does, README)
    const logN = mine.log.map(o => ({ k: o[0], type: o[1], value: o[2], arg: o[3] === null ? undefined : o[3] }));
    const simR = N.replay(ship, N.spec(1912), logN, mine.k), rN = BP.readouts(simR), cN = { away: rN.boatsAway, inAway: rN.inBoatsAway, aboard: rN.aboard };
    console.log('     across engines: Node replaying the page\'s log: ' + JSON.stringify(cN) + (JSON.stringify(cN) === JSON.stringify(mine.count) ? ', the same count' : ', a different count (the page ' + JSON.stringify(mine.count) + ')'));

    // ---- 3. a damage preset: no boats
    await b.open('#scenario=titanic', OPEN);
    await settle(800);
    const pre = await b.ev(`({ sec: document.getElementById('boatsSec').hidden, chip: document.getElementById('boatsChip').hidden, drawn: TitanicApp.boats.drawn().filter(x => x.visible).length, people: !!TitanicApp.state.sim.people })`);
    row('on a damage preset (no watch) the part shows nothing', JSON.stringify(pre), 'hidden, hidden, no boat drawn, no reader', pre.sec && pre.chip && pre.drawn === 0 && !pre.people);

    // ---- 4. a phone: the controls fit (390 x 780, touch)
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('#night=1912', OPEN);
    await b.ev('TitanicApp.state.warp = 6');
    await b.clickSel('.tab[data-tab="run"]');
    await Br.sleep(600);                                     // the sheet slides in: a CSS transition, on real time either way
    // and under the virtual clock the page's passes besides: the boats' section is laid out on a pass, and a page just
    // opened has run none (slot 10, 2026-11-21: every control measured 0 px without them). With --real the sleep's own
    // frames did it, as before
    if (!REAL) await settle(600);
    const ph = await b.ev(`(() => { const sec = document.getElementById('boatsSec'); sec.scrollIntoView({ block: 'start' });
      const ctl = [document.getElementById('boatsUncover'), ...sec.querySelectorAll('.seg button')].map(e => e.getBoundingClientRect());
      const chip = document.getElementById('boatsChip').getBoundingClientRect(), stage = document.getElementById('stage').getBoundingClientRect();
      return { device: TitanicApp.device(), w: innerWidth, open: document.getElementById('panel').classList.contains('open'), n: ctl.length, minH: Math.round(Math.min(...ctl.map(r => r.height))), left: Math.round(Math.min(...ctl.map(r => r.left))), right: Math.round(Math.max(...ctl.map(r => r.right))), scrollW: document.documentElement.scrollWidth,
        chip: [chip.left, chip.top, chip.right, chip.bottom].map(Math.round), stage: [stage.left, stage.top, stage.right, stage.bottom].map(Math.round) }; })()`);
    await picture('boats_phone_panel.png');
    row('on a phone (390 x 780, touch) the boats\' controls fit: inside the screen\'s width, 40 px tall', `${ph.device}; ${ph.n} controls from x ${ph.left} to ${ph.right} of ${ph.w}; the smallest ${ph.minH} px; page width ${ph.scrollW}`,
      'phone; inside; at least 40 px; no sideways scroll', ph.device === 'phone' && ph.open && ph.n === 11 && ph.left >= 0 && ph.right <= ph.w && ph.minH >= 40 && ph.scrollW <= ph.w);
    await b.clickSel('#sheetClose'); await Br.sleep(500);   // the sheet slides out: a CSS transition, on real time
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter on the phone');
    const pc = await b.ev(`(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(), c = r('boatsChip'), s = r('stage'), br = r('bridge'), ro = r('readout'); return { chip: [c.left, c.top, c.right, c.bottom].map(Math.round), stage: [s.left, s.top, s.right, s.bottom].map(Math.round), bridge: [br.top, br.bottom].map(Math.round), readout: Math.round(ro.bottom), hidden: document.getElementById('boatsChip').hidden }; })()`);
    await picture('boats_phone_stage.png');
    const overlapBridge = !(pc.chip[3] <= pc.bridge[0] || pc.chip[1] >= pc.bridge[1]);
    row('  ... and the count on the stage lies inside it, clear of the Bridge and the readouts', `chip ${pc.chip.join(',')} in stage ${pc.stage.join(',')}; Bridge ${pc.bridge.join(' to ')}; readouts end ${pc.readout}`, 'inside; no overlap', !pc.hidden && pc.chip[0] >= pc.stage[0] && pc.chip[2] <= pc.stage[2] && pc.chip[1] >= pc.readout && !overlapBridge);
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
