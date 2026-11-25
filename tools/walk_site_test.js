// The walk (site/parts/76_walk.js, W0 of docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_1_2026-11-20.md) in a real browser
// (headless Edge or Chrome), with nothing beyond Node, through the real controls: the Walk button, held keys, the pad.
//   node tools/walk_site_test.js [dist] [picture dir]     (the pictures: node tools/walk_site_test.js dist docs/evidence/walk)
// What is checked: the button enters the walk (the director stands down, the page's pace is held at 1); the walking keys
// move the walker and give the ship no order (A, S, D and the arrows are the Bridge's helm and telegraph otherwise); her
// side and a watertight bulkhead stop it, a shut door stops it and an open one lets it through; Q and E take it down and
// up a deck; the water at its feet is the core's own to a centimetre; the core's pockets (G7) drawn in their own places,
// never spread over their spaces; in the Night look her deck, the deck over it, her
// sides and the bulkheads are faintly lit (U0's look at guide 1.5 found the walk very dark there); her lights out are dark
// to the walker but for its lamp; at the founder flag the walk ends; Esc gives the page its pace back; a watch's
// fingerprint is the model's alone (the part feeds nothing back); on a phone the pad lies inside the stage with buttons
// 40 px tall, and a held button walks; no error in the console. The clock is stopped on exact steps (a part's 'step'
// hook) wherever a reading must land on one.
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
const pictures = [];
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(100) + ' ' + String(value).padEnd(70) + ' ' + ref); }
const KEY = { w: ['w', 'KeyW', 87], a: ['a', 'KeyA', 65], s: ['s', 'KeyS', 83], d: ['d', 'KeyD', 68], q: ['q', 'KeyQ', 81], e: ['e', 'KeyE', 69],
  shift: ['Shift', 'ShiftLeft', 16], esc: ['Escape', 'Escape', 27], up: ['ArrowUp', 'ArrowUp', 38], down: ['ArrowDown', 'ArrowDown', 40], left: ['ArrowLeft', 'ArrowLeft', 37], right: ['ArrowRight', 'ArrowRight', 39] };
const r2 = (v) => Math.round(v * 100) / 100;

(async () => {
  let b = null;
  const errors = [];
  const open = async (w, h, phone) => {
    b = await B.launch({ dist });
    if (w) await b.page.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: phone ? 2 : 1, mobile: !!phone });
    if (phone) await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  };
  const close = async () => { if (!b) return; errors.push(...b.errors); await b.close(); b = null; };
  // a key held for ms (keyDown, wait, keyUp), as a person holds it; with more keys held together when given
  const hold = async (keys, ms) => {
    const ks = [].concat(keys).map(k => KEY[k]);
    for (const [key, code, vk] of ks) await b.page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk });
    await B.sleep(ms);
    for (const [key, code, vk] of ks.reverse()) await b.page.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
    await B.sleep(120);
  };
  const tap = (k) => hold(k, 40);
  // the clock stopped on the step where cond holds (a part's 'step' hook, in place before the clock runs on at speed)
  const holdWhen = async (cond, what, speed, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } });
      A.state.speed = ${speed || 900}; A.state.playing = true; })()`);
    await b.waitFor('window.__held', ms || 240000, what);
  };
  const W = `TitanicApp.walk.state()`;
  const frames = (n) => b.ev(`new Promise(r => { let k = ${n || 4}; const f = () => (--k > 0 ? requestAnimationFrame(f) : r(true)); requestAnimationFrame(f); })`);
  const rect = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.hidden || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })()`;
  const meets = (p, q) => !!(p && q && p[0] < q[2] - 0.5 && p[2] > q[0] + 0.5 && p[1] < q[3] - 0.5 && p[3] > q[1] + 0.5);
  const inside = (p, q) => !!(p && q && p[0] >= q[0] - 0.5 && p[1] >= q[1] - 0.5 && p[2] <= q[2] + 0.5 && p[3] <= q[3] + 0.5);
  // a picture of the page (the last notice gone first: a notice lasts 2.6 s, a big one 4.2), the clock as it stands
  const shot = async (name, what) => {
    if (!shots) return;
    for (let i = 0; i < 40 && await b.ev(`document.getElementById('toast').classList.contains('on')`); i++) await B.sleep(200);
    await B.sleep(400);                            // and its fade (0.25 s): the lights-out picture of 11-21 caught it half gone
    const p = path.join(shots, name), r = await b.page.send('Page.captureScreenshot', { format: 'png' }), buf = Buffer.from(r.data, 'base64');
    fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf);
    pictures.push([path.relative(path.join(__dirname, '..'), p).replace(/\\/g, '/'), what, buf.readUInt32BE(16), buf.readUInt32BE(20)]);
  };
  const LIT = `TitanicApp.walk.light()`;
  try {
    // ================================================================== 1. the 1912 watch: the button, the keys, the walls
    await open(1400, 860);
    await b.open('#night=1912');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 25');
    await holdWhen('sim.night.tClear >= 0', 'the end of the encounter', 1);
    await holdWhen('sim.night.k >= 1200', 'step 1200 (every scripted order given)', 60);
    await b.click('bDirector');
    const dir0 = await b.ev('TitanicApp.director.on()');
    await b.clickSel('[data-view="walk"]');
    await frames(6);
    const in0 = await b.ev(`({ walk: TitanicApp.walk.on(), view: TitanicApp.state.view, director: TitanicApp.director.on(), pad: ${rect('.walk-pad')}, s: ${W} })`);
    await b.ev('TitanicApp.state.speed = 60; TitanicApp.state.playing = true');
    await frames(10);
    const pace = await b.ev('TitanicApp.pace()');
    row('the Walk button (a real click) walks her: on E deck amidships, the director stood down, the page\'s pace held at 1', `walk ${in0.walk}, view ${in0.view}, ${in0.s.deck} deck at x ${r2(in0.s.x)}, y ${r2(in0.s.y)}; director ${dir0} -> ${in0.director}; pace ${pace} with the speed at 60; pad ${in0.pad ? 'shown' : 'hidden'}`,
      'walking, view walk, E deck; director on -> off; pace 1', in0.walk && in0.view === 'walk' && in0.s.deck === 'E' && dir0 === true && in0.director === false && pace === 1 && !!in0.pad);
    // the keys: forward, then every key the Bridge would take, while walking: the ship gets no order
    const before = await b.ev(`({ n: TitanicApp.state.sim.night.log.length, cmd: TitanicApp.state.sim.mo.delCmd, mode: TitanicApp.state.night.mode, s: ${W} })`);
    await hold('w', 900);
    const fw = await b.ev(W);
    for (const k of ['a', 'd', 's', 'left', 'right', 'up', 'down']) await tap(k);
    const after = await b.ev(`({ n: TitanicApp.state.sim.night.log.length, cmd: TitanicApp.state.sim.mo.delCmd, mode: TitanicApp.state.night.mode })`);
    row('W held walks her forward; A, S, D and the arrows, taken while walking, give the ship no order', `x ${r2(before.s.x)} -> ${r2(fw.x)} m after 0.9 s of W; the log ${before.n} -> ${after.n} orders, the rudder ordered ${r2(before.cmd)} -> ${r2(after.cmd)}, ${before.mode} -> ${after.mode}`,
      'forward by about 1.3 m (0.5 to 2); no order: the log, the rudder and the 1912 orders as they were', fw.x - before.s.x > 0.5 && fw.x - before.s.x < 2 && Math.abs(fw.y - before.s.y) < 1e-6 && after.n === before.n && after.cmd === before.cmd && after.mode === 'auto');
    // her side: placed 1.5 m off it, A (to port) held: stopped at her side
    await b.ev(`TitanicApp.walk.enter({ deck: 'E', x: 0, y: TitanicApp.walk.hbAt('E', 0) - 1.5, yaw: 0 })`);
    await hold('a', 1500);
    const side = await b.ev(`(() => { const s = ${W}; return { s, hb: TitanicApp.walk.hbAt('E', s.x) }; })()`);
    row('her side stops the walker (C.halfBreadth at the deck)', `y ${r2(side.s.y)} m against her side at ${r2(side.hb)} m; "${side.s.blocked}"`, `${r2(side.hb - 0.4)} m (her side less the walker's 0.4 m); "her side"`,
      Math.abs(side.s.y - (side.hb - 0.4)) < 0.02 && side.s.blocked === 'her side');
    // up and down a deck
    await tap('e'); const upD = (await b.ev(W)).deck; await tap('q'); const dnD = (await b.ev(W)).deck;
    row('E takes the walker up a deck and Q down again, at the same place [a stand-in for her stairs]', `E -> ${upD} -> ${dnD}`, 'E -> D -> E', upD === 'D' && dnD === 'E');
    // the Night look (its button, a real click): her deck, the deck over it, her sides and the bulkheads faintly lit; her
    // lights on, so every line at its strength. Amidships, looking forward along her centreline
    await b.ev(`TitanicApp.walk.enter({ deck: 'E', x: 0, y: 1, yaw: 0 })`);
    await b.click('bNight'); await frames(6);
    const nl = await b.ev(`({ L: ${LIT}, s: ${W}, view: TitanicApp.state.view, near: TitanicApp.camera.near })`);
    row('in the Night look the walk is lit (U0\'s look at guide 1.5 found it very dark): her deck, the deck over it, her sides and the bulkheads drawn faintly; her lights on, every line and surface at its strength',
      `night ${nl.L.night}; surfaces ${nl.L.fills.join(', ') || 'none'}; lines ${nl.L.line}, surfaces ${nl.L.fill}; still walking ${nl.view === 'walk' && nl.s.on}`,
      'on; deck, above, side, wall; 1, 1; walking', nl.L.night && ['deck', 'above', 'side', 'wall'].every(k => nl.L.fills.includes(k)) && nl.L.line === 1 && nl.L.fill === 1 && nl.view === 'walk' && nl.s.on);
    await shot('walk_night.png', 'the 1912 watch walked in the Night look, her lights on: E deck amidships looking forward, her deck, the deck over it, her sides and the bulkheads faintly lit [appearance]');
    await b.click('bXray'); await frames(4);
    const xl = await b.ev(LIT);
    row('  and in the X-ray look the lines alone, as before (her free surfaces seen through)', `night ${xl.night}; surfaces ${xl.fills.join(', ') || 'none'}`, 'off; none', !xl.night && xl.fills.length === 0);
    // the fingerprint: the clock stopped, the watch against the model alone in the page, at the same step
    await b.ev('TitanicApp.state.playing = false'); await frames(3);
    const wf = await b.ev('({ k: TitanicApp.state.sim.night.k, fp: TitanicNight.fingerprint(TitanicApp.state.sim) })');
    const bare = await b.ev(`(() => { const N = TitanicNight, s = N.create(TitanicCore.buildShip(), N.spec(1912), { auto: true }); while (s.night.k < ${wf.k}) N.step(s); return N.fingerprint(s); })()`);
    row('a watch walked through has the model\'s own fingerprint: the walk feeds nothing back', `walked ${wf.fp} at step ${wf.k}`, `the model alone in the page: ${bare}`, wf.fp === bare);
    // Esc leaves, and the page's pace is the player's again
    await b.ev('TitanicApp.state.playing = true');
    await tap('esc'); await frames(6);
    const out = await b.ev(`({ walk: TitanicApp.walk.on(), view: TitanicApp.state.view, pace: TitanicApp.pace(), pad: ${rect('.walk-pad')}, near: TitanicApp.camera.near })`);
    row('Esc leaves the walk: the Quarter view, the pad gone, the page\'s pace the player\'s again', `walk ${out.walk}, view ${out.view}, pace ${out.pace}, pad ${out.pad ? 'shown' : 'gone'}`, 'off, quarter, 60, gone', !out.walk && out.view === 'quarter' && out.pace === 60 && !out.pad);
    row('  the camera\'s near plane is the walker\'s own while walking and the page\'s after (QC C-9: the page had undone it every frame)', `walking ${nl.near} m; after ${out.near} m`, `${0.1} m; 0.5 m`, nl.near === 0.1 && out.near === 0.5);
    await close();

    // ================================================================== 2. the 1912 damage preset: water and doors
    await open(1400, 860);
    await b.open('#scenario=titanic');
    await holdWhen('sim.t >= 6000', '1 h 40 min into the run', 900);
    await b.clickSel('[data-view="walk"]');
    // the water at its feet: hold 2 on F deck, against the core's own level there, the clock stopped
    await b.ev(`TitanicApp.walk.enter({ deck: 'F', x: (TitanicCore.BULKHEADS[1].x + TitanicCore.BULKHEADS[2].x) / 2, y: 3, yaw: 0 })`);
    await frames(4);
    const wat = await b.ev(`(() => { const A = TitanicApp, C = TitanicCore, s = A.walk.state(), sim = A.state.sim, n = C.nodeIndex(C.zoneAt(s.x), s.y >= 0 ? 0 : 1, 0);
      const feet = C.worldZ(C.frameOf(sim), s.x, s.y, C.deckZ('F', s.x)), want = sim.vol[n] > 1e-3 ? Math.max(0, sim.level[n] - feet) : 0; return { s, want, n }; })()`);
    row('the water at the walker\'s feet is the core\'s own: its space\'s level less the deck in the world (hold 2, F deck, 1 h 40 min into the run)', `${wat.s.depth.toFixed(3)} m ("${wat.s.where}")`, `${wat.want.toFixed(3)} m (space ${wat.n}), to a centimetre; some water`,
      Math.abs(wat.s.depth - wat.want) < 0.01 && wat.want > 0.05);
    // the core's pockets (W6's bunker, G7's tank: water it keeps apart from sim.vol), drawn in their own places with the
    // spaces below E deck. Each holding pocket with water is drawn over its own footprint, as full as the core holds it: at
    // its top once full, else at the core's own level for it (sim._hEff, the core's last head for the pocket, against the
    // walk's from the pose now: to 5 cm). None is drawn from E deck up
    const pk = await b.ev(`(() => { const A = TitanicApp, C = TitanicCore, sim = A.state.sim, drawn = A.walk.pockets();
      const want = (sim.pockets || []).map((k, j) => ({ j, k })).filter(({ k }) => k.state === 0 && k.vol > 1e-3 && k.cap > 0), bad = [];
      for (const { j, k } of want) {
        const d = drawn.find(p => p.j === j), frac = Math.min(1, k.vol / k.cap);
        if (!d) { bad.push(k.name + ': not drawn'); continue; }
        if (d.x0 !== k.x0 || d.x1 !== k.x1 || d.side !== k.side || Math.abs(d.frac - frac) > 1e-12) bad.push(k.name + ': its place or fill');
        const top = k.deck ? C.deckZ(k.deck, 0.5 * (k.x0 + k.x1)) : k.z1;   // its top at its middle (G7's tank: the orlop's flat)
        if (frac >= 1 ? Math.abs(d.z - top) > 1e-9 : !(Math.abs(d.level - sim._hEff[C.NN + j]) <= 0.05)) bad.push(k.name + ': its height');
      }
      return { want: want.map(({ k }) => k.name + ' ' + Math.round(100 * Math.min(1, k.vol / k.cap)) + ' %'), drawn: drawn.length, bad, all: (sim.pockets || []).length }; })()`);
    await b.ev(`TitanicApp.walk.enter({ deck: 'E', x: 0, y: 2, yaw: 0 })`); await frames(4);
    const pkE = await b.ev('TitanicApp.walk.pockets().length');
    row('the core\'s pockets drawn in their own places with the spaces below E deck, never spread over their spaces (G7): each holding one with water over its footprint, as full as the core holds it; none from E deck up',
      `${pk.want.join(', ') || 'none with water'} (${pk.all} pockets); drawn ${pk.drawn}${pk.bad.length ? '; ' + pk.bad.join('; ') : ''}; from E deck ${pkE}`, 'each one with water drawn as the core holds it; none from E deck',
      pk.want.length > 0 && pk.drawn === pk.want.length && !pk.bad.length && pkE === 0);
    // just aft of the first watertight bulkhead from G aft with a door on F deck at the page's params (G itself until the
    // landing: D4's g11Doors 0 takes its F-deck door away, with E's, the deck plans showing neither), on its door's line
    // (dry there at this hour: forward, where the water is, a walker wades at a quarter of its pace): the doors shut
    // (closed from the bridge), then all opened (an order to the model: this session ends after it, so that the runs
    // below are the preset's own)
    const gb = await b.ev(`(() => { const w = TitanicApp.walk.wallsOn('F').find(q => q.i >= 6 && q.doors.length); return w ? { i: w.i, id: w.id, x: w.x, y: w.doors[0] } : null; })()`);
    if (!gb) throw new Error('no watertight bulkhead from G aft with a door on F deck');
    await b.ev(`TitanicApp.walk.enter({ deck: 'F', x: ${gb.x} - 2, y: ${gb.y}, yaw: 0 })`);
    await hold('w', 2500);
    const shut = await b.ev(`({ s: ${W}, bx: ${gb.x}, open: TitanicApp.state.sim.doorOpen[${gb.i}] })`);
    await b.clickSel('.tab[data-tab="doors"]'); await b.click('bDoorsOpen'); await frames(3);
    const opened = await b.ev(`TitanicApp.state.sim.doorOpen[${gb.i}]`);
    await hold('w', 1500);
    const thru = await b.ev(W);
    row('on F deck a watertight bulkhead stops the walker while its doors are shut, and lets it through its door once they are open (Bulkheads, "Open all"; the first from G aft with a door on F deck)', `bulkhead ${gb.id}: shut (${shut.open}): stopped at x ${r2(shut.s.x)} by "${shut.s.blocked}"; opened (${opened}): on to x ${r2(thru.x)}`,
      `stopped ${r2(shut.bx - 0.4)} m (bulkhead ${gb.id} at ${r2(shut.bx)} less 0.4); then past it`, shut.open === 0 && Math.abs(shut.s.x - (shut.bx - 0.4)) < 0.02 && new RegExp('^bulkhead ' + gb.id).test(shut.s.blocked) && opened === 1 && thru.x > shut.bx + 0.4);
    // C4 (params.g11Doors, the mainline's): the walk's walls have the doors the core has at the sim's params. With 0 the
    // three the deck plans do not show are gone (F deck in E and G, G deck in N) and no other door moves; with 1, every
    // door of BULKHEADS, as before. The walls asked for with the sim's own params, g11Doors set each way
    const gd = await b.ev(`(() => { const W = TitanicApp.walk, P = TitanicApp.state.sim.params, at = (g) => ({ params: Object.assign({}, P, { g11Doors: g }) });
      const doors = (g) => { const o = {}; for (const d of W.DECKS) for (const w of W.wallsOn(d, at(g))) if (w.doors.length) o[d + ':' + w.id] = w.doors.length; return o; };
      return { one: doors(1), zero: doors(0), now: doors(P.g11Doors === undefined ? 1 : P.g11Doors), core: !!TitanicCore.G11_NO_DOOR, param: P.g11Doors }; })()`);
    const gone = Object.keys(gd.one).filter(k => !(k in gd.zero)).sort(), moved = Object.keys(gd.zero).filter(k => gd.zero[k] !== gd.one[k]);
    // the page's sim as at its own g11Doors: 0 since the landing (D4's switches on), 1 before
    const own = gd.param === 0 ? gd.zero : gd.one;
    row('C4: the walk draws the doors the core has at its params: with g11Doors 0 those the deck plans do not show are gone (F deck in E and G, G deck in N), no other; with 1 every one; the page\'s sim as at its own',
      `gone at 0: ${gone.join(' ') || 'none'}; others changed: ${moved.length ? moved.join(' ') : 'none'}; the page's sim (g11Doors ${gd.param}) as at ${gd.param === 0 ? 0 : 1}: ${JSON.stringify(gd.now) === JSON.stringify(own)}`,
      'F:E F:G G:N; none; true', gd.core && gone.join(' ') === 'F:E F:G G:N' && moved.length === 0 && JSON.stringify(gd.now) === JSON.stringify(own));
    await close();

    // ================================================================== 3. the preset as it is: her lights out, her flag
    await open(1400, 860);
    await b.open('#scenario=titanic');
    // her lights out: dark to the walker
    await holdWhen('sim.plant && sim.plant.lights === 0', 'her lights out', 900);
    await b.clickSel('[data-view="walk"]'); await frames(4);
    const dk = await b.ev(W);
    row('her lights out (the plant\'s dynamos) are dark to the walker', `dark ${dk.dark}; "${dk.where}"`, 'dark; the line says so', dk.dark === true && /her lights are out/.test(dk.where));
    // the walker's lamp, in the Night look: full strength at the eye, down to LIGHT.out (lines) and LIGHT.fillOut
    // (surfaces) of it far off; the lamp where the eye is. On D deck 75 m abaft amidships, dry when her lights go (2:17 am:
    // 23 degrees by the head, 36 to port), looking aft. Looking forward the deck falls away at her trim and the picture was
    // black (B deck 30 m abaft, the place before: Z2's probe of five places, 2026-11-21)
    await b.ev(`TitanicApp.walk.enter({ deck: 'D', x: -75, y: 1, yaw: Math.PI, pitch: -0.25 })`);
    await b.click('bNight'); await frames(6);
    const lo = await b.ev(`(() => { const L = ${LIT}, s = ${W}, C = TitanicCore, e = [s.x, C.deckZ(s.deck, s.x) + TitanicApp.walk.WALK.eye, -s.y]; return { L, gap: Math.hypot(L.eye[0] - e[0], L.eye[1] - e[1], L.eye[2] - e[2]) }; })()`);
    const lampK = (floor, d) => floor + (1 - floor) * Math.exp(-d / lo.L.reach);
    row('  with them out the walker carries a lamp (Night look): full strength at the walker, falling off to 0.3 of it for the lines and 0.05 for her surfaces; the dark stays dark',
      `lines ${lo.L.line}, surfaces ${lo.L.fill}, reach ${lo.L.reach} m: at 5 m ${lampK(lo.L.line, 5).toFixed(2)} and ${lampK(lo.L.fill, 5).toFixed(2)}, at 50 m ${lampK(lo.L.line, 50).toFixed(2)} and ${lampK(lo.L.fill, 50).toFixed(2)}; the lamp ${lo.gap.toFixed(3)} m from the eye; surfaces drawn ${lo.L.fills.length}`,
      `${lo.L.LIGHT.out} and ${lo.L.LIGHT.fillOut}, reach ${lo.L.LIGHT.reach} m; the lamp at the eye; drawn`, lo.L.line === lo.L.LIGHT.out && lo.L.fill === lo.L.LIGHT.fillOut && lo.L.reach === lo.L.LIGHT.reach && lo.gap < 1e-3 && lo.L.fills.length >= 3);
    await shot('walk_night_dark.png', 'the 1912 preset walked in the Night look with her lights out (2:17 am, 23 degrees by the head, 36 to port): D deck 75 m abaft amidships, looking aft, the walker\'s lamp lighting the lines about it and the far deck dark, the sea\'s horizon tilted by her list [appearance]');
    await b.click('bXray'); await frames(3);
    await tap('esc');
    await holdWhen('sim.foundered', 'her foundering (no walk)', 900);
    const fT = await b.ev('TitanicApp.state.sim.founderT');
    await close();
    // the founder flag ends a walk: the same preset, the clock stopped 6 s before her flag, walked on at her own pace
    await open(1400, 860);
    await b.open('#scenario=titanic');
    await holdWhen(`sim.t >= ${fT - 6}`, '6 s before her flag', 900);
    await b.clickSel('[data-view="walk"]');
    await b.ev('TitanicApp.state.playing = true');
    await b.waitFor('TitanicApp.state.sim.foundered', 60000, 'her flag, walking');
    await frames(6);
    const end = await b.ev(`({ walk: TitanicApp.walk.on(), view: TitanicApp.state.view, toast: document.getElementById('toast').textContent })`);
    row('at the founder flag the walk ends (the fall is the deep\'s)', `walk ${end.walk}, view ${end.view}; "${end.toast}"`, 'off; quarter; the notice', !end.walk && end.view === 'quarter');
    await close();

    // ================================================================== 4. a phone: the pad inside the stage, a held button walks
    await open(390, 780, true);
    await b.open('#scenario=titanic');
    await holdWhen('sim.t >= 3000', '50 min into the run', 900);
    await b.clickSel('[data-view="walk"]'); await frames(6);
    const ph = await b.ev(`({ pad: ${rect('.walk-pad')}, stage: ${rect('#stage')}, ro: ${rect('#readout')}, btn: Math.min(...[...document.querySelectorAll('.walk-b')].map(e => e.getBoundingClientRect().height)), s: ${W}, device: TitanicApp.device(), toast: document.getElementById('toast').textContent })`);
    const fwd = await b.ev(`(() => { const r = document.querySelector('.walk-fwd').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
    await b.page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fwd[0], y: fwd[1] }] });
    await B.sleep(1000);
    await b.page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await B.sleep(150);
    const ph2 = await b.ev(W);
    row('on a phone (390 x 780, touch) the pad lies inside the stage, clear of the readouts, its buttons 40 px tall; the forward button held walks her', `${ph.device}; pad ${ph.pad ? ph.pad.map(Math.round).join(',') : 'none'} in ${ph.stage ? ph.stage.map(Math.round).join(',') : '-'}; buttons ${r2(ph.btn)} px; x ${r2(ph.s.x)} -> ${r2(ph2.x)} after 1 s held`,
      'phone; inside, clear; at least 40 px; forward', ph.device === 'phone' && inside(ph.pad, ph.stage) && !meets(ph.pad, ph.ro) && ph.btn >= 40 && ph2.x - ph.s.x > 0.5);
    // RC2 (the first ten minutes played cold): on the phone the walk's notice names the pad's buttons, not keys it has not got
    row('  on the phone the walk\'s notice names the pad\'s buttons, not the keyboard\'s keys', `"${ph.toast}"`, 'the arrows below, "Up a deck", "Leave"; no W A S D or Esc',
      /Hold the arrows below/.test(ph.toast) && /"Leave" leaves/.test(ph.toast) && !/W A S D|Esc/.test(ph.toast));
    await close();

    row('no error in the page\'s console through all of it (five sessions)', errors.length ? errors.slice(0, 3).join(' | ') : 'none', 'none', errors.length === 0);
    if (shots) row('two pictures taken (each to be looked at)', pictures.map(p => path.basename(p[0]) + ' ' + p[2] + 'x' + p[3]).join(', '), 'two, at most 1,400 px wide', pictures.length === 2 && pictures.every(p => p[2] <= 1400));
    if (shots && pictures.length) fs.writeFileSync(path.join(shots, 'PICTURES.txt'), pictures.map(p => p[0] + '\n  ' + p[1]).join('\n') + '\n');
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b && b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await close();
    process.exit(fails ? 1 : 0);
  }
})();
