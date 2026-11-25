// The ship's plant in a real browser (headless Edge or Chrome), through the page's own controls, with nothing beyond Node.
//   node tools/systems_site_test.js [dist] [screenshot dir] [--real]
// Checks that the Systems tab shows what core/systems.js holds, and that its orders (draw the fires, the coal in her
// bunkers) cascade as they do in Node: the fires out -> the steam down -> the engines, then the lights, then the rudder.
// Y6: an order to the pumps from its Pumps section goes in the watch's log, the forecast after it is the watch run on, and
// "Replay my watch" gives the same pumped night.
// And a pump order on a room before the water reaches it (a watch lists every room an order can draw from, dry or not):
// three minutes after the touch, every pump on boiler rooms 4 and 5, as Y6's what-if gives them in Node; the watch founders
// at the time the model alone gives for the same orders in the page's engine, to the bit, and within 5 s of Node's (the two
// engines part in the last bits: backlog X1).
// The page's clock is virtual (QC C-3, docs/DESIGN_virtual_clock_v1_1_2026-11-21.md): each page is opened with clock=test,
// so only this suite's passes move it (tools/cdp.js's vrun and vframes, 1000/60 ms a pass), and a busy machine changes how
// long the suite takes, never what it sees. Every wait on the page's own frames runs its passes with the bound in its own
// time; the wait for the forecast, which a worker computes outside the page's clock, stays on the wall clock. No row here
// measures real time. --real runs it all on real time, as before C-3 (about four minutes), for comparison.
'use strict';
const path = require('path');
const B = require('./cdp');
const C = require('../core/core.js');
const N = require('../core/night.js');
const REAL = process.argv.includes('--real'), argv = process.argv.slice(2).filter(a => a !== '--real');
const dist = path.resolve(argv[0] || path.join(__dirname, '..', 'dist'));
const shots = argv[1] ? path.resolve(argv[1]) : null;
const OPEN = { virtual: !REAL };                   // each page opened with its clock virtual (clock=test), unless --real
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }
const chain = `[...document.querySelectorAll('#sysChain li')].map(li => [li.dataset.k, li.className, li.lastElementChild.textContent])`;
const clk = (mins) => { const h = Math.floor(mins / 60) % 24, mm = Math.floor(mins % 60); return (h % 12 || 12) + ':' + String(mm).padStart(2, '0') + ' am'; };

(async () => {
  const b = await B.launch({ dist });
  // the page's clock stopped on the first step where cond holds (tools/night_site_test.js). Since Z3 a watch steps on past
  // the flag (her fall, a reader of the night), so its step at her foundering is read with the clock stopped on that step.
  // The page runs on its own passes until then (vrun, the bound in its own time), or with --real on real time
  const holdWhen = async (cond, what, ms) => {
    await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } }); })()`);
    if (REAL) await b.waitFor('window.__held', ms || 240000, what);
    else await b.vrun('window.__held', { maxMs: ms || 240000, held: false, what });
  };
  // a page expression waited for on the page's own passes (with --real, on real time); at once if it already holds
  const waitPage = (cond, ms, what) => (REAL ? b.waitFor(cond, ms, what) : b.vrun(cond, { maxMs: ms, held: false, what }));
  // the page let run for ms of its own time (with --real, of real time), as a sleep let it before
  const settle = (ms) => (REAL ? B.sleep(ms) : b.vrun(null, { maxMs: ms, held: false }));
  // a picture, drawn on a pass of its own under the virtual clock
  const picture = async (name) => { if (!shots) return; if (!REAL) await b.vframes(1, { render: true }); await b.shot(path.join(shots, name)); };
  try {
    // ---- 1. the 1912 watch, intact at Full ahead: the tab opened with a real click shows every system working
    await b.open('#night=1912', OPEN);
    await b.clickSel('.tab[data-tab="systems"]');
    await settle(600);
    const c0 = await b.ev(chain);
    row('the Systems tab (a real click): eleven systems, all working on the intact ship at Full ahead, the pumps idle', c0.map(r => r[0] + ':' + (r[1] || 'idle')).join(' '), 'ten ok (the doors all shut at the tank top); the pumps idle, no water to pump', c0.length === 11 && c0.every(r => r[0] === 'pumps' ? r[1] === '' : r[1] === 'ok'));
    const rooms0 = await b.ev(`[...document.querySelectorAll('#sysRooms tr')].map(tr => tr.cells[2].textContent)`);
    const steam0 = await b.ev(`document.getElementById('gSteam').textContent`);
    row('six boiler rooms: five burning, room 1 cold; the Bridge shows the steam under the revolutions', rooms0.join(', ') + '; "' + steam0 + '"', 'burning x5, cold; "215 psi"', rooms0.length === 6 && rooms0.slice(0, 5).every(s => s === 'burning') && rooms0[5] === 'cold' && steam0 === '215 psi');
    await picture('v4-systems-intact.png');

    // ---- 2. every fire drawn at Full ahead (a real click): the steam goes, and with it the engines, the lights, the rudder
    await b.ev('TitanicApp.state.warp = 25; TitanicApp.state.speed = 25');
    await b.click('bDrawAll');
    const logged = await b.ev('(() => { const L = TitanicApp.state.sim.night.log; const o = L[L.length - 1]; return o ? o.type + ' + "':'" + ' + o.value : "none"; })()');
    row('the order to draw every fire goes in the watch\'s log with the helm and telegraph orders', logged, 'fires:-1', logged === 'fires:-1');
    await waitPage('TitanicApp.plant().nMax < 74.5', 120000, 'the engines short of steam');
    await waitPage(`/short$/.test(document.getElementById('gSteam').textContent) || TitanicApp.plant().nMax <= 0`, 5000, 'the Bridge to show it (it refreshes eight times a second)');
    await settle(300);
    const short = await b.ev(`({ s: document.getElementById('gSteam').textContent, cls: document.getElementById('gSteam').className, eng: ${chain}.find(r => r[0] === 'engines') })`);
    row('the steam falling: the Bridge says the engines are short of it, and the Systems tab', '"' + short.s + '" (' + short.cls + '); engines: ' + short.eng[1] + ', "' + short.eng[2] + '"', '"... psi · short", warn; warn', /psi · short$/.test(short.s) && /warn/.test(short.cls) && short.eng[1] === 'warn');
    await waitPage('TitanicApp.state.sim.mo.plant.steer === false || TitanicApp.state.sim.foundered', 240000, 'the steering gear without steam');
    await settle(500);
    const end = await b.ev(`(() => { const A = TitanicApp, sim = A.state.sim, E = sim.plant.events, m = sim.mo; return { slow: E.slow, dark: E.dark, steer: E.steer, nMax: m.plant.nMax[0], rpm: m.nP, kn: Math.hypot(m.u, m.v) / TitanicMotion.KN, why: A.state.lightsFailWhy, on: A.ports.mat.uniforms.uOn.value, del: m.del, chain: ${chain} }; })()`);
    const at = (t) => (t === undefined ? 'never' : (t / 60).toFixed(1) + ' min');
    row('then, as the pressure falls through their needs: the engines stop, her lights go out, the steering gear stops', 'short ' + at(end.slow) + ', dark ' + at(end.dark) + ', steering ' + at(end.steer) + '; ' + end.rpm.toFixed(1) + ' rpm, ' + end.kn.toFixed(1) + ' kn; lights "' + end.why + '", ports ' + end.on.toFixed(2),
      'in that order; engines 0; lights out for want of steam', end.slow < end.dark && end.dark < end.steer && end.nMax === 0 && end.rpm === 0 && end.on === 0 && end.why === 'no steam for the dynamos');
    row('the Systems tab at the end: no steam, no engines, no lights, no steering', end.chain.filter(r => r[1] === 'crit').map(r => r[0]).join(' '), 'fires steam engines steering dynamos red', ['fires', 'steam', 'engines', 'steering', 'dynamos'].every(k => end.chain.find(r => r[0] === k)[1] === 'crit'));
    await b.click('bHardPort');
    await settle(1500);
    const del2 = await b.ev('TitanicApp.state.sim.mo.del');
    row('hard to port on the Bridge (a real click) with no steam for the steering engines: the rudder stays', (end.del * 180 / Math.PI).toFixed(2) + ' -> ' + (del2 * 180 / Math.PI).toFixed(2) + ' deg', 'unchanged', del2 === end.del);
    // Y2: in the dark, door D raised by hand (a real click in the Bulkheads tab), then the bridge's switch: no current
    await b.clickSel('.tab[data-tab="doors"]');
    await waitPage(`!!document.querySelector('#bhBody tr[data-b="3"] button.chip')`, 5000, 'the bulkhead table');
    await b.clickSel('#bhBody tr[data-b="3"] button.chip');
    await b.click('bDoorsClose');
    await settle(400);
    const dr = await b.ev(`(() => { const sim = TitanicApp.state.sim, L = sim.night.log; return { log: L.slice(-2).map(o => o.type + ':' + o.value + (o.arg !== undefined ? ':' + o.arg : '')).join(' '), open: sim.doorOpen[3], fall: sim.doorFall[3], power: sim.plant.power }; })()`);
    await b.clickSel('.tab[data-tab="systems"]');
    await settle(400);
    const dch = (await b.ev(chain)).find(r => r[0] === 'doors');
    row('in the dark, door D raised by hand and the bridge\'s switch (real clicks): both orders logged; no current, D stays open', dr.log + '; D ' + (dr.open ? 'open' : 'shut') + (dr.fall >= 0 ? ' (falling)' : '') + '; doors ' + dch[1] + ', "' + dch[2] + '"', 'door:3:true doors:bridge; D open; doors crit', dr.log === 'door:3:true doors:bridge' && dr.open === 1 && dr.fall < 0 && !dr.power && dch[1] === 'crit');
    await picture('v4-systems-no-steam.png');

    // ---- 3. coal for fifteen minutes (the Systems tab's option, then Restart this watch): she runs out, and slows
    await b.clickSel('#coalSeg button[data-coal="15m"]');
    await b.clickSel('.tab[data-tab="run"]');               // Restart is on the Run tab
    await b.ev('TitanicApp.state.warp = 1');                 // the new watch at her own pace while it is read
    await b.click('bReset');
    await waitPage('TitanicApp.state.sim.t < 5 && !!TitanicApp.plant()', 20000, 'the new watch');
    await b.clickSel('.tab[data-tab="systems"]');
    await settle(500);
    const coal0 = await b.ev(`({ coal: TitanicApp.plant().coal, t: TitanicApp.state.sim.t, perDay: TitanicSystems.PLANT.coalPerDayFull, row: ${chain}.find(r => r[0] === 'coal') })`);
    const coalAt0 = coal0.coal + coal0.t * coal0.perDay / 86400;   // what she began with: less a burn at full firing since the restart
    row('fifteen minutes of coal at full firing: the Systems tab warns', coalAt0.toFixed(2) + ' t at the restart; "' + coal0.row[2] + '" (' + coal0.row[1] + ')', (coal0.perDay / 96).toFixed(2) + ' t (' + coal0.perDay + ' t a day at full firing); warn', Math.abs(coalAt0 - coal0.perDay / 96) < 0.02 && coal0.row[1] === 'warn');
    await b.ev('TitanicApp.state.warp = 40; TitanicApp.state.speed = 40');
    await waitPage('TitanicApp.plant().nMax < 74.5 || TitanicApp.state.sim.foundered', 240000, 'the engines short of steam');
    const run = await b.ev(`(() => { const sim = TitanicApp.state.sim, E = sim.plant.events, m = sim.mo; return { coal: E.coal0, slow: E.slow, kn: Math.hypot(m.u, m.v) / TitanicMotion.KN, t: sim.t }; })()`);
    row('the bunkers empty after about 15 min of full firing; the fires burn down; then the engines are short of steam', 'empty at ' + at(run.coal) + ', short at ' + at(run.slow), 'empty 15 to 17 min (22.5 kn asks 95 % of full firing); short after it', run.coal / 60 > 15 && run.coal / 60 < 17 && run.slow > run.coal);

    // ---- 4. the damage preset: every fire drawn at once (a real click), so the steam fails long before the plunge
    await b.clickSel('#coalSeg button[data-coal="loaded"]');
    await b.open('#scenario=titanic', OPEN);
    await b.clickSel('.tab[data-tab="systems"]');
    await settle(400);
    await b.clickSel('#sysRooms button[data-room="0"]');
    await settle(300);
    const one = await b.ev(`document.querySelector('#sysRooms tr').cells[2].textContent`);
    row('a room\'s Draw button (a real click): boiler room 6 has its fires drawn', '"' + one + '"', '"being drawn, ..."', /^being drawn/.test(one));
    await b.click('bDrawAll');
    await b.ev('TitanicApp.state.speed = 900');
    await waitPage('TitanicApp.state.lightsFailT > 0 || TitanicApp.state.sim.foundered', 120000, 'her lights failing or the end');
    const pre = await b.ev('({ t: TitanicApp.state.lightsFailT, why: TitanicApp.state.lightsFailWhy })');
    const mins = 23 * 60 + 40 + pre.t / 60;
    row('the 1912 damage with every fire drawn: dark for want of steam, long before the plunge', (pre.t > 0 ? clk(mins) : 'never') + ' (' + pre.why + ')', 'about 1:27 am (20 min to draw the fires, then the auxiliaries\' steam runs down), not 2:16', pre.t > 0 && mins - 24 * 60 > 80 && mins - 24 * 60 < 95 && pre.why === 'no steam for the dynamos');
    // ---- 5. blowing off (Y1): the 1912 orders (a real click, which also wakes the sound); once the engines stop, the safety
    // valves lift: steam laid at the escape pipes and the roar sounding
    await b.open('#night=1912', OPEN);
    await b.click('bAuto');
    await b.ev('TitanicApp.state.warp = 25; TitanicApp.state.speed = 25');
    await waitPage('TitanicApp.plant().blow > 0.25', 120000, 'the safety valves lifting');
    await settle(1500);
    const bo = await b.ev(`({ blow: TitanicApp.plant().blow, steam: TitanicApp.steam.count(), roar: TitanicApp.roarLevel(), t: TitanicApp.state.sim.t - TitanicApp.state.sim.night.tTouch })`);
    row('after Stop on the 1912 orders the safety valves lift: steam at the escape pipes, and the roar', 'blowing off ' + (100 * bo.blow).toFixed(0) + ' % of full steam ' + bo.t.toFixed(0) + ' s after the touch; ' + bo.steam + ' puffs; roar gain ' + bo.roar.toFixed(3), 'puffs laid and a roar above zero ("blew off steam loudly through the first hour")', bo.steam > 0 && bo.roar > 0);
    // ---- 6. the pumps (Y3): on the same watch the engineers put boiler room 5's own pump on it some minutes after the touch
    await waitPage('TitanicApp.state.sim.t - TitanicApp.state.sim.night.tTouch > 420', 120000, 'seven minutes after the touch');
    await b.clickSel('.tab[data-tab="systems"]');
    await settle(600);
    const pu = await b.ev(`(() => { const r = ${chain}.find(r => r[0] === 'pumps'), P = TitanicSystems.readouts(TitanicApp.state.sim).pumps; return { cls: r[1], text: r[2], running: P.running, labels: P.list.filter(e => !e.off && TitanicApp.state.sim.t >= e.t0).map(e => e.label) }; })()`);
    row('seven minutes after the touch the engineers have boiler room 5\'s pump at work; the Systems tab says so', pu.cls + ', "' + pu.text + '"; at work: ' + pu.labels.join('; '), 'ok, "1 at work, ... t a minute"; boiler room 5\'s ballast-and-bilge pump', pu.cls === 'ok' && pu.running >= 1 && /at work/.test(pu.text) && pu.labels.some(l => /Boiler room 5/.test(l)));
    // ---- 7. the pumps, the player's part (Y6): on the same watch, by a real click in the Systems tab's Pumps section, every
    // pump that can reach boiler room 5 put on it: the order in the watch's log; the tab shows it; the forecast printed after
    // it is what the watch, run on, does; "Replay my watch" (a real click) gives the same night
    await b.ev('TitanicApp.state.warp = 1; TitanicApp.state.speed = 1');
    await waitPage(`!!document.querySelector('#pumpRooms .proom[data-proom="5"] button[data-pwhich="all"]')`, 10000, 'boiler room 5 in the Pumps section');
    const seq0 = await b.ev('TitanicApp.state.fcSeq');
    await b.clickSel('#pumpRooms .proom[data-proom="5"] button[data-pwhich="all"]');
    await settle(600);
    const po = await b.ev(`(() => { const L = TitanicApp.state.sim.night.log, o = L[L.length - 1]; return { o, mode: TitanicApp.state.night.mode }; })()`);
    row('the order from the Systems tab (a real click: every pump that can reach boiler room 5) is in the watch\'s log', po.o.type + ':' + po.o.value + ':' + po.o.arg + (po.o.refused ? ' refused: ' + po.o.refused : '') + ' at step ' + po.o.k + '; mode ' + po.mode, 'pump:5:all at its step; mode you (the player has taken over from the 1912 orders)', po.o.type === 'pump' && po.o.value === 5 && po.o.arg === 'all' && !po.o.refused && po.mode === 'you');
    const tab = await b.ev(`(() => { const d = (k) => document.querySelector('#pumpRooms .proom[data-proom="' + k + '"]'); return { lines: [...d(5).querySelectorAll('li')].map(li => li.firstChild.textContent), hold: d(1) ? d(1).textContent : '', who: document.getElementById('pumpWho').textContent, chain: ${chain}.find(r => r[0] === 'pumps'), back: !document.getElementById('bPumpsBack').disabled }; })()`);
    if (shots) { await b.ev(`document.getElementById('pumpSec').scrollIntoView({ block: 'start' })`); await settle(300); await picture('v4-systems-pumps.png'); }
    row('the tab shows it: boiler room 4\'s pump led to boiler room 5 through the main, being rigged; you have the pumps; the holds\' valves lost', tab.lines.join(' | ') + '; "' + tab.who + '"; pumps: "' + tab.chain[2] + '"',
      '"... through the main, 117 t/h: at work in 30 min"; "You have the pumps"; "on your orders"; No. 1 hold: the firemen\'s passage', tab.lines.some(l => /^Boiler room 4's ash-ejector pump, through the main, 117 t\/h: at work in (29|30) min$/.test(l)) && /^You have the pumps/.test(tab.who) && /being rigged.*on your orders$/.test(tab.chain[2]) && tab.back && /firemen's passage/.test(tab.hold));
    // the forecast is a worker's, outside the page's clock: waited for on the wall clock, the page standing still meanwhile.
    // Since G12's cascade (D98) the watch is handed over at the break's onset by default: the forecast says when she
    // breaks, and the watch, run on, breaks then (the cascade's "the forecast equals the watch to its end")
    await b.waitFor(`TitanicApp.state.forecast && TitanicApp.state.forecast.seq > ${seq0} && /Breaks at/.test(document.getElementById('fcLine').textContent)`, 180000, 'the forecast after the order');
    const fc = await b.ev(`(() => { const f = TitanicApp.state.forecast; return { t: f.over && !f.foundered ? f.overT : null, by: f.by, line: document.getElementById('fcLine').textContent }; })()`);
    await b.ev('TitanicApp.state.speed = 900');
    await holdWhen('TitanicApp.gone(sim)', 'the watch to her end (the break\'s onset)', 300000);
    const endOf = `(() => { const A = TitanicApp, s = A.state.sim; return { t: A.goneT(s), broke: A.broke(s), tt: s.night.tTouch, fp: TitanicNight.fingerprint(s), k: s.night.k, pumped: s.pumped, n: s.night.log.length, sched: JSON.stringify(s.pumpSched.map(e => [e.zone, e.room, e.q, e.t0, e.off, e.tOff])) }; })()`;
    const fin = await b.ev(endOf);
    const mm = (t) => ((t - fin.tt) / 60).toFixed(2) + ' min';
    row('the forecast printed after the order ("' + fc.line.replace(/^Forecast:\s*/, '') + '") is what the watch, run on, does', 'forecast: she breaks at ' + (fc.t === null ? '-' : fc.t.toFixed(2)) + ' s (from the ' + fc.by + '); the watch ' + (fin.broke ? 'breaks' : 'DOES NOT BREAK') + ' at ' + fin.t.toFixed(2) + ' s', 'equal: the watch run on, its plant, its pumps and the order with it, to the break\'s onset', fc.by === 'watch' && fin.broke && fc.t === fin.t);
    await b.clickSel('.tab[data-tab="run"]');                // "Replay my watch" is on the Run tab
    await b.click('bReplay');
    await waitPage('TitanicApp.state.night.mode === "replay" && TitanicApp.state.sim.night.k < 50', 15000, 'the replay');
    await b.ev('TitanicApp.state.warp = 25; TitanicApp.state.speed = 900');
    await holdWhen('TitanicApp.gone(sim)', 'the replay to her end (the break\'s onset)', 300000);
    const rp = await b.ev(endOf);
    row('"Replay my watch" (a real click) gives the same pumped night', 'replay: ' + (rp.broke ? 'breaks ' : 'DOES NOT BREAK ') + mm(rp.t) + ' after the touch, ' + rp.fp + ' at step ' + rp.k + ', ' + rp.n + ' orders; the same pumps: ' + (rp.sched === fin.sched), 'the watch: ' + mm(fin.t) + ', ' + fin.fp + ' at step ' + fin.k + ', ' + fin.n + ' orders',
      rp.broke && rp.t === fin.t && rp.fp === fin.fp && rp.k === fin.k && rp.n === fin.n && rp.sched === fin.sched && rp.pumped === fin.pumped);
    // ---- 8. pumps put on a room before the water reaches it. On a watch the Pumps section lists every room an order can
    // draw from, a dry one too (in a quieter form); it listed only rooms with water or pumps on them, so three minutes after
    // the touch boiler room 4 had no controls and the page could not give Y6's what-if. Here it does, by real clicks with
    // the page's clock stopped on the step tools/systems_tests.js gives them on in Node (the first at or past the touch and
    // 180 s): every pump that can reach boiler room 4, then boiler room 5, on the 1912 orders; then her foundering, against
    // Node's for the same orders (Y6's founder: the what-if handed over at her flag, handover=flag, since G12's cascade, D98,
    // made the default watch's end the break's onset; the model alone and Node are made the same way)
    const pumpClick = async (k) => {                 // a real click on a room's "Every pump that can reach it", seen in the log
      const n0 = await b.ev('TitanicApp.state.sim.night.log.length');
      await b.clickSel(`#pumpRooms .proom[data-proom="${k}"] button[data-pwhich="all"]`);
      await waitPage(`TitanicApp.state.sim.night.log.length > ${n0}`, 5000, 'the order on room ' + k + ' in the log');
    };
    await b.open('#night=1912&handover=flag', OPEN);
    await b.click('bAuto');
    await waitPage('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev('TitanicApp.state.warp = 25');
    await waitPage('TitanicApp.state.sim.night.tClear >= 0', 120000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 25');
    await holdWhen('sim.night.tTouch >= 0 && sim.t >= sim.night.tTouch + 180', 'three minutes after the touch');
    await b.clickSel('.tab[data-tab="systems"]');
    await waitPage(`!!document.querySelector('#pumpRooms .proom[data-proom="6"] button[data-pwhich="all"]')`, 10000, 'boiler room 4 in the Pumps section');
    const br4 = await b.ev(`(() => { const d = document.querySelector('#pumpRooms .proom[data-proom="6"]'); return { dry: d.classList.contains('dry'), head: d.querySelector('.kv').textContent, water: TitanicSystems.readouts(TitanicApp.state.sim).pumps.rooms.some(r => r.k === 6), k: TitanicApp.state.sim.night.k }; })()`);
    if (shots) { await b.ev(`document.getElementById('pumpSec').scrollIntoView({ block: 'start' })`); await settle(300); await picture('v4-systems-pumps-dry-room.png'); }
    await pumpClick(6);
    await pumpClick(5);
    const given = await b.ev(`TitanicApp.state.sim.night.log.slice(-2).map(o => [o.k, o.type, o.value, o.arg, o.refused || null])`);
    await b.ev('TitanicApp.state.speed = 900; TitanicApp.state.playing = true');
    await holdWhen('sim.foundered', 'her foundering', 300000);
    const sank = await b.ev(`(() => { const s = TitanicApp.state.sim; return { t: s.founderT, tt: s.night.tTouch, k: s.night.k, fp: TitanicNight.fingerprint(s) }; })()`);
    // the same orders on the same step given by the model alone, in the page (no viewer, no reader): the same engine, so
    // the same bits; and in Node, as tools/systems_tests.js gives them (Y6's what-if). Two engines part in the last bits
    // (README, Math.pow; backlog X1) and a night of 9,600 s carries that into seconds: with no order at all the 1912 watch
    // founders at 9,492.5 s in Node and 9,493.75 s in this page's engine (2026-11-18). So Node's time is held to 5 s
    const RUN = `(() => { const NN = TitanicNight, w = NN.create(TitanicCore.buildShip(), NN.spec(1912), { auto: true, readers: false, handover: 'flag' });
      while (!w.foundered && (w.night.tTouch < 0 || w.t < w.night.tTouch + 180)) NN.step(w);
      const k = w.night.k, a = NN.pump(w, 6, 'all'), c = NN.pump(w, 5, 'all'); NN.sink(w);
      return { k, ok: !!(a.ok && c.ok), t: w.founderT, tt: w.night.tTouch, kEnd: w.night.k, fp: NN.fingerprint(w) }; })()`;
    const alone = await b.ev(RUN);
    const nw = N.create(C.buildShip(), N.spec(1912), { auto: true, handover: 'flag' });
    while (!nw.foundered && (nw.night.tTouch < 0 || nw.t < nw.night.tTouch + 180)) N.step(nw);
    const kNode = nw.night.k, ra = N.pump(nw, 6, 'all'), rb = N.pump(nw, 5, 'all');
    N.sink(nw);
    const after = (t, tt) => ((t - tt) / 60).toFixed(2) + ' min';
    row('three minutes after the touch on the 1912 orders, boiler room 4 still dry is listed with its orders; every pump on it and on boiler room 5 from the page (real clicks, the clock on the step): she founders at the time the model gives for the same orders',
      `boiler room 4 ${br4.dry ? 'dry' : 'NOT DRY'} ("${br4.head}"; in the plant's own list: ${br4.water}); ${given.map(o => o[1] + ':' + o[2] + ':' + o[3] + (o[4] ? ' refused' : '') + '@' + o[0]).join(' ')}; the page founders ${after(sank.t, sank.tt)} after the touch (${sank.t} s, ${sank.fp} at step ${sank.k})`,
      `the model alone in the page, the same orders at step ${alone.k}: ${after(alone.t, alone.tt)} (${alone.t} s, ${alone.fp} at step ${alone.kEnd}), to the bit; Node: ${after(nw.founderT, nw.night.tTouch)} (${nw.founderT} s; Y6's 159.40, and 157.21 with no order), within 5 s across the two engines`,
      br4.dry && !br4.water && given.length === 2 && given[0][0] === alone.k && given[1][0] === alone.k && given[0][1] === 'pump' && given[0][2] === 6 && given[0][3] === 'all' && !given[0][4] && given[1][2] === 5 && given[1][3] === 'all' && !given[1][4] &&
      alone.ok && sank.t === alone.t && sank.k === alone.kEnd && sank.fp === alone.fp && kNode === alone.k && ra.ok && rb.ok && nw.foundered && Math.abs(sank.t - nw.founderT) <= 5);
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
