// RC1, a newcomer's first minute (site/index.template.html's "Start here" and the Run tab's order; the footer's early
// access mark), in a real browser (headless Edge or Chrome), with nothing beyond Node, on the page's virtual clock.
//   node tools/firstrun_site_test.js [dist]        (a browser suite: take a turn)
// On a desktop (1366 x 768) and on a phone upright (390 x 844, touch), it checks that
//   - the first screen (no address) opens on "Start here", the Run tab's first section, with "Take the watch" and "Watch
//     the 1912 orders", and Time next: its pace and the scrubber's bar within the panel's first screenful, unscrolled;
//   - "Take the watch" (a real click) opens the 1912 watch with the bridge the player's; "Start here" gives way, and on a
//     watch Time still stands above the watch's own section, its pace within the first screenful;
//   - RC2: a newcomer's quick "Hard to port" misses the berg: on this stage the Bridge gives way to the card, which says how
//     to have it again; the card, the line under the readouts and the Run tab say one verdict, kept from the ice's end while
//     she circles past the berg again (the live one moves);
//   - "Watch the 1912 orders" opens it on the 1912 orders; holed and still at her own pace, the notice at the ice's end
//     says where the clock runs faster; "the Evidence tab" opens the Evidence tab;
//   - the footer carries "Early access, a work in progress" with its three links: the User Guide, GitHub Issues, the source;
//   - on the phone the sheet opens on "Start here" from the Run tab, and "Take the watch" closes it on the Bridge;
//   - no error in the page's console.
'use strict';
const path = require('path');
const B = require('./cdp');
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const OPEN = { virtual: true };
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(96) + ' ' + String(value).padEnd(60) + ' ' + ref); }
const GUIDE = 'https://github.com/bochen2029-pixel/titanic-sinking-simulator/tree/main/docs/guide';
const ISSUES = 'https://github.com/bochen2029-pixel/titanic-sinking-simulator/issues';
const SOURCE = 'https://github.com/bochen2029-pixel/titanic-sinking-simulator';

(async () => {
  const b = await B.launch({ dist, width: 1366, height: 768 });
  // where the Run tab's pieces stand in the panel, unscrolled: each one's top and bottom against the panel's own view
  const PANEL = `(() => { const p = document.getElementById('panel'); p.scrollTop = 0; const pr = p.getBoundingClientRect();
    const r = (el) => { if (!el) return null; const x = el.getBoundingClientRect(); return { top: Math.round(x.top - pr.top), bottom: Math.round(x.bottom - pr.top), shown: x.width > 0 && x.height > 0 }; };
    const run = document.querySelector('.pane[data-pane="run"]'), secs = run ? [...run.children].filter(e => e.classList.contains('sec') && !e.hidden) : [];
    const time = document.getElementById('speedSeg') ? document.getElementById('speedSeg').closest('.sec') : null;
    return { h: Math.round(pr.height), open: p.classList.contains('open'), device: document.documentElement.dataset.device,
      first: secs[0] ? (secs[0].id || (secs[0].querySelector('h3') || {}).textContent || '?') : null,
      start: r(document.getElementById('startHere')), startHidden: document.getElementById('startHere').hidden,
      speed: r(document.getElementById('speedSeg')), bar: r(document.getElementById('scrubBar')),
      timeBeforeWatch: !!(time && document.getElementById('watchSec') && (time.compareDocumentPosition(document.getElementById('watchSec')) & Node.DOCUMENT_POSITION_FOLLOWING)) }; })()`;
  const NIGHT = `(() => { const A = TitanicApp, n = A.state.night; return n ? { seed: n.seed, mode: n.mode, hash: location.hash, tab: document.querySelector('.tab[aria-selected="true"]').dataset.tab, bridge: !document.getElementById('bridge').hidden, toast: document.getElementById('toast').textContent } : null; })()`;
  // RC2 (the first ten minutes played cold): the Run tab's label and whether it beckons (a phone's first screen)
  const BECKON = `(() => { const t = document.querySelector('.tab[data-tab="run"]'); return { on: t.classList.contains('beckon'), label: t.textContent.trim() }; })()`;
  try {
    // ---- 1. a desktop, the first screen
    await b.open('', OPEN);
    await b.vframes(3);
    const d0 = await b.ev(PANEL), dk = await b.ev(BECKON);
    const foot = await b.ev(`(() => { const m = document.querySelector('.foot-meta'), e = document.getElementById('footEarly'); return { early: e ? e.textContent : null, links: m ? [...m.querySelectorAll('a')].map(a => [a.textContent, a.href]) : [] }; })()`);
    row('the first screen (a desktop): "Start here" heads the Run tab, its two buttons; Time next, its pace and the scrubber\'s bar in the panel\'s first screenful',
      `first "${d0.first}"; Start here ${d0.start ? d0.start.top + ' to ' + d0.start.bottom : 'NONE'}; the pace ${d0.speed ? d0.speed.top + ' to ' + d0.speed.bottom : 'NONE'}, the bar ${d0.bar ? d0.bar.top + ' to ' + d0.bar.bottom : 'NONE'} (the panel ${d0.h} px)`,
      'startHere first; both within the panel', d0.first === 'startHere' && !d0.startHidden && !!d0.speed && d0.speed.bottom <= d0.h && !!d0.bar && d0.bar.bottom <= d0.h && d0.timeBeforeWatch);
    row('the footer carries the early access mark, with the User Guide, GitHub Issues and the source',
      `"${foot.early}"; ${foot.links.map(l => l[0] + ' <' + l[1] + '>').join('; ')}`, 'the mark; the three links',
      foot.early === 'Early access, a work in progress' && foot.links.length === 3 && foot.links[0][1] === GUIDE && foot.links[1][1] === ISSUES && foot.links[2][1] === SOURCE && /Issues/.test(foot.links[1][0]));
    // ---- 2. "Take the watch" (a real click)
    await b.click('bStartWatch');
    await b.vframes(3);
    const w = await b.ev(NIGHT), d1 = await b.ev(PANEL);
    row('"Take the watch" (a real click) opens the 1912 watch, the bridge the player\'s; "Start here" gives way, Time stays above the watch\'s own section, its pace in the first screenful',
      `${w ? 'seed ' + w.seed + ', mode ' + w.mode + ', ' + w.hash + ', the Bridge ' + (w.bridge ? 'shown' : 'HIDDEN') : 'NO WATCH'}; Start here ${d1.startHidden ? 'hidden' : 'SHOWN'}; first "${d1.first}"; the pace ${d1.speed ? d1.speed.top + ' to ' + d1.speed.bottom : 'NONE'} (the panel ${d1.h} px)`,
      'seed 1912, you, #night=1912, the Bridge; hidden; the pace within the panel',
      !!w && w.seed === 1912 && w.mode === 'you' && w.hash === '#night=1912' && w.bridge && d1.startHidden && d1.timeBeforeWatch && !!d1.speed && d1.speed.bottom <= d1.h);
    // ---- 2b. RC2: a miss, as a newcomer's first instinct gives it ("Hard to port" a pass after the bells). The card, the
    // line under the readouts and the Run tab say the same verdict, kept from the ice's end while she circles past the berg
    // again with the helm left over (the live verdict moves: its side from where the ice is now, its gap the closest pass
    // so far). On this 1366 x 768 stage the Bridge gives way to the card, which says how to have it again; Close gives it back
    await b.ev('TitanicApp.state.warp = 6');
    await b.vrun('TitanicApp.state.sim.night.tBells >= 0', { maxMs: 600000, held: false, what: 'the bells' });
    await b.click('bHardPort');
    await b.vrun('TitanicApp.state.sim.night.tClear >= 0', { maxMs: 600000, held: false, what: 'the ice astern' });
    await b.vframes(2);
    const SAY = `(() => { const A = TitanicApp, s = A.state.sim, slot = document.querySelector('.slot[data-area="helm"]'), note = document.getElementById('endBridge');
      return { t: s.t, card: A.nightEnd.shown(), first: A.nightEnd.sentences()[0], line: document.getElementById('fcLine').textContent, tab: document.getElementById('watchText').textContent,
        live: TitanicNight.verdict(s), kind: TitanicNight.summary(s).kind, bridge: slot ? getComputedStyle(slot).display !== 'none' : null,
        note: note ? getComputedStyle(note).display !== 'none' : null, noteText: note ? note.textContent : null }; })()`;
    const m0 = await b.ev(SAY);
    await b.click('endClose');
    await b.vframes(2);
    const m1 = await b.ev(SAY);
    row('RC2, a miss on a 1366 x 768 stage: the Bridge gives way to the card, which says how to have it again; Close gives it back',
      `${m0.kind}: the card "${m0.card}", the Bridge ${m0.bridge ? 'SHOWN' : 'given way'}, its note ${m0.note ? '"' + m0.noteText + '"' : 'NOT SHOWN'}; closed: the Bridge ${m1.bridge ? 'back' : 'STILL GONE'}`,
      'miss; clear, given way, the note; back',
      m0.kind === 'miss' && m0.card === 'clear' && m0.bridge === false && m0.note === true && m0.noteText === 'Close this card to take the wheel and the telegraph again.' && m1.bridge === true);
    await b.ev('TitanicApp.state.speed = 240');
    const kept = [];
    for (const mins of [5, 10, 20, 30]) {
      await b.vrun(`TitanicApp.state.sim.t >= ${m0.t + mins * 60}`, { maxMs: 600000, held: false, what: mins + ' minutes after the ice' });
      kept.push(Object.assign({ mins }, await b.ev(SAY)));
    }
    const moved = kept.filter(x => x.live !== m0.line).map(x => x.mins), still = kept.every(x => x.line === m0.line && x.tab.indexOf(m0.line + '.') >= 0);
    row('RC2, a miss: the card, the line under the readouts and the Run tab say the same verdict, kept from the ice\'s end while she circles past the berg again',
      `at the ice's end "${m0.line}" (the card's first line "${m0.first}"); the line and the tab at 5, 10, 20, 30 min: ${still ? 'the same' : 'MOVED: ' + kept.map(x => x.mins + ' "' + x.line + '"').join('; ')}; the live verdict moved at ${moved.length ? moved.join(', ') + ' min ("' + kept.find(x => x.live !== m0.line).live + '")' : 'NONE (not shown)'}`,
      'the same at every check; the live one moved at least once',
      m0.first === m0.line + '.' && m0.tab.indexOf(m0.line + '.') >= 0 && still && moved.length > 0);
    // ---- 3. back to the preset: "Watch the 1912 orders", and "the Evidence tab"
    await b.ev(`TitanicApp.loadScenario('titanic')`);
    await b.vframes(2);
    const back = await b.ev(PANEL);
    await b.click('bStartAuto');
    await b.vframes(3);
    const a = await b.ev(NIGHT);
    // holed and still at her own pace, the notice at the ice's end says where the clock runs faster
    await b.ev('TitanicApp.state.warp = 6');
    await b.vrun('TitanicApp.state.sim.night.tClear >= 0', { maxMs: 600000, held: false, what: 'the ice astern' });
    const cl = await b.ev(`({ toast: document.getElementById('toast').textContent, speed: TitanicApp.state.speed, holed: TitanicApp.state.sim.openings.length, verdict: TitanicNight.verdict(TitanicApp.state.sim), tab: document.getElementById('watchText').textContent })`);
    // RC2 (the first ten minutes played cold): the notice is the verdict's first clause and then the pointer, short enough
    // to be read in the 4.2 s a big notice stands; the whole verdict stays in the Run tab
    const first = cl.verdict.split(', ')[0];
    row('holed on the 1912 orders and still at her own pace: the notice at the ice\'s end is her opening and where the clock runs faster; the whole verdict in the Run tab',
      `"${cl.toast}" (the pace ${cl.speed}x, ${cl.holed} openings; ${cl.toast.length} characters); the Run tab ${cl.tab.indexOf(cl.verdict) >= 0 ? 'has' : 'LACKS'} "${cl.verdict}"`, '"Holed: ... side. Run the clock faster under Time, on the Run tab, to see what the water does"; has it',
      cl.speed === 1 && cl.holed > 0 && /^Holed: /.test(cl.toast) && cl.toast === first + '. Run the clock faster under Time, on the Run tab, to see what the water does' && cl.tab.indexOf(cl.verdict) >= 0);
    await b.ev(`TitanicApp.loadScenario('titanic')`);
    await b.vframes(2);
    await b.click('bStartAbout');
    await b.vframes(2);
    const ev = await b.ev(`document.querySelector('.tab[aria-selected="true"]').dataset.tab`);
    row('"Start here" again on a preset; "Watch the 1912 orders" opens the watch on the 1912 orders; "the Evidence tab" opens the Evidence tab',
      `Start here ${back.startHidden ? 'HIDDEN' : 'shown'}; ${a ? 'mode ' + a.mode + ', "' + a.toast + '"' : 'NO WATCH'}; the tab ${ev}`,
      'shown; auto; evidence', !back.startHidden && !!a && a.mode === 'auto' && a.seed === 1912 && /1912 orders are on the bridge/.test(a.toast) && ev === 'evidence');
    // ---- 4. a phone upright: the sheet opens on "Start here"; "Take the watch" closes it on the Bridge
    await b.page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await b.page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.open('', OPEN);
    await b.vframes(3);
    const p0 = await b.ev(PANEL), pk0 = await b.ev(BECKON);
    await b.clickSel('.tabs .tab[data-tab="run"]');
    await b.vframes(2);
    // The sheet opens over 0.22 s of real time: a CSS transition on its height, which the page's virtual clock does
    // not move. Wait until its height stands still. A click aimed inside a sheet that is still opening lands where
    // the button was (join 23's pre-check: the sheet read 485 px of its 625, and "Take the watch" was missed).
    await b.waitFor(`(() => { const p = document.getElementById('panel'), h = Math.round(p.getBoundingClientRect().height); const still = p.classList.contains('open') && window.__sheetH === h; window.__sheetH = h; return still; })()`, 4000, 'the sheet to stand open');
    const p1 = await b.ev(PANEL), pk1 = await b.ev(BECKON);
    row('RC2, a phone\'s first screen says where to begin: the Run tab reads "Start" and beckons until it is first opened, then "Run"; a desktop\'s never does',
      `the phone at first: ${pk0.on ? 'beckons' : 'DOES NOT BECKON'}, "${pk0.label}"; opened: ${pk1.on ? 'STILL BECKONS' : 'still'}, "${pk1.label}"; the desktop: ${dk.on ? 'BECKONS' : 'still'}, "${dk.label}"`,
      'beckons, "Start"; still, "Run"; still, "Run"', pk0.on && pk0.label === 'Start' && !pk1.on && pk1.label === 'Run' && !dk.on && dk.label === 'Run');
    await b.click('bStartWatch');
    await b.vframes(3);
    const pw = await b.ev(NIGHT), p2 = await b.ev(`({ open: document.getElementById('panel').classList.contains('open') })`);
    row('a phone upright: the Run tab opens the sheet on "Start here", its buttons in view; "Take the watch" opens the watch and closes the sheet on the Bridge',
      `device ${p0.device}; the sheet ${p0.open ? 'OPEN' : 'closed'} at first, then ${p1.open ? 'open' : 'CLOSED'}, first "${p1.first}", Start here ${p1.start ? p1.start.top + ' to ' + p1.start.bottom : 'NONE'} (the sheet ${p1.h} px); then ${pw ? 'mode ' + pw.mode + ', the Bridge ' + (pw.bridge ? 'shown' : 'HIDDEN') : 'NO WATCH'}, the sheet ${p2.open ? 'OPEN' : 'closed'}`,
      'phone; closed, open, startHere within the sheet; you, the Bridge, closed',
      p0.device === 'phone' && !p0.open && p1.open && p1.first === 'startHere' && !!p1.start && p1.start.bottom <= p1.h && !!pw && pw.mode === 'you' && pw.bridge && !p2.open);
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
