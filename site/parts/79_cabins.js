// NH2, her rooms and when the water came (docs/BRAINSTORM_the_next_horizon_v1_2026-11-23.md, section 3; BACKLOG section
// 2k). A part of the viewer (site/app.js, "parts").
//
// The Damage tab gains her rooms. A room is picked by its number as the plans print it ("C 102", "#139") or by name ("the
// Turkish bath"), from R3's tables of her deck plans. The build makes them one asset (tools/build_site.js), fetched when
// the view first opens. For the room picked it says, by NH2's library (core/readers/cabins.js):
//   - When the water first came to each of its pieces, in the library's words: "water on C deck between bulkheads K and
//     L, port side, at 2:17 am". At level 0 a room's water is its slab's (a deck's space in one compartment, on one side),
//     never at one cabin's door; a stateroom in a block has its block's pieces and times.
//   - How deep the water stands over its deck there now.
// It marks the room on the damage diagram (TitanicApp.diagramMark) and offers the walk from there (TitanicApp.walk.enter).
// Where a list books people into the room (NH2's names: the Cave list of 1912, first class, row.people), the card names
// them as the list prints them, with the list's own caveat: who was booked there before she sailed, never who was there
// that night. A name that finds no room finds the people of that name the list books, each with its room (CB.named).
// Every run of her own hull is tracked from her start (not Olympic's, not Britannic's): each slab's first wet time, observed
// on her whole seconds, every fourth step, the same at any pace. The library's observe costs more than the model's own
// step, so every step would double the page's stepping at 900x. A time is at most 0.75 s after the step the slab was first
// wet (tools/cabins_site_test.js holds every slab to a record of every step's).
// It reads the model and feeds nothing back. The words are the library's and this file's; the figures are the model's.
(function () {
  'use strict';
  const A = window.TitanicApp, C = window.TitanicCore, CB = window.TitanicCabins;
  if (!A || !C || !CB) return;
  const pane = document.querySelector('[data-pane="damage"]');
  if (!pane) return;
  const S = A.state, EVERY = 4, OTHER_HULLS = ['hawke', 'britannic'];
  const hm = (s) => { const m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
  const WALKED = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];   // the walk's decks (site/parts/76_walk.js): not the orlop
  const UP = { orlop: 'G', G: 'F', F: 'E', E: 'D', D: 'C', C: 'B', B: 'A', A: 'Boat' };   // the deck over each, for the mark
  // the list's own caveat (data/rooms/occupants_1912.json, its source's gaps), beside every name it gives
  const CAVEAT = 'The list is a proof printed before she sailed: it gives the staterooms as booked, leaves out late bookings and some who sailed, and names some who did not. It says nothing of who was in a room that night.';
  const MAX_LINES = 8;

  // ------------------------------------------------------------------ the run's first wet times, slab by slab
  let tr = null, trSim = null, ended = false;
  const ours = () => OTHER_HULLS.indexOf(S.scen) < 0;
  const stepOf = (sim) => (sim.night ? sim.night.k : Math.round(sim.t / sim.params.dt));
  function reset(sim) {
    tr = null; trSim = null; ended = false;
    if (sim && ours()) { tr = CB.track(sim.ship); trSim = sim; CB.observe(tr, sim); }
    changed = true;
  }
  A.on('step', (sim) => {
    if (!tr || ended || sim !== trSim) return;
    const gone = A.gone(sim);
    if (stepOf(sim) % EVERY === 0 || gone) { CB.observe(tr, sim); changed = true; }
    if (gone) ended = true;                       // past the flag the model stands still (a watch's fall steps on)
  });

  // ------------------------------------------------------------------ her rooms' tables, fetched when the view opens
  // The page's one fetch, and of its own file: the build's asset beside the app (window.TitanicRoomsURL, a same-origin
  // path, 'self' in dist/_headers' connect-src and the app's own scheme in Titanic.exe). It is no network call: nothing is
  // fetched from anywhere else. Where it is missing or fails (a single-file build, an old cache), the section says so.
  // What came is kept (got: the address as fetched, its status and length), so that a suite sees the one fetch under the
  // page's scheme or the app's alike (the browser keeps no resource timing for the app's titanic://)
  let I = null, loading = null, loadErr = null, got = null;
  function load() {
    if (I || loading || loadErr) return;
    const url = window.TitanicRoomsURL;
    if (!url || !window.fetch) { loadErr = 'this build carries no tables of her rooms'; changed = true; return; }
    loading = fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); got = { url: r.url || url, status: r.status, bytes: 0 }; return r.text(); })
      .then(s => { got.bytes = s.length; return JSON.parse(s); })
      .then(T => { I = CB.index(T); loading = null; changed = true; if (q.value) find(); })
      .catch(e => { loadErr = 'her rooms\' tables could not be loaded (' + e.message + ')'; loading = null; changed = true; });
    changed = true;
  }

  // ------------------------------------------------------------------ the section, at the end of the Damage tab
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const sec = el('div', 'sec cb-sec'); sec.id = 'cbSec';
  const head = el('h3', null, 'Her rooms, and when the water came');
  const lead = el('p', 'hint cb-lead', 'A stateroom as her plans number it (C 102, #139), or a room by name (Turkish bath, Cafe Parisien). The water is the model\'s: at this level a room\'s water is its deck\'s in one compartment on one side, never at one cabin\'s door.');
  const q = el('input', 'cb-q'); q.type = 'search'; q.id = 'cbQuery'; q.placeholder = 'C 102, or a room by name'; q.autocomplete = 'off'; q.spellcheck = false; q.setAttribute('aria-label', 'A room of hers, by its number or its name');
  const hits = el('ol', 'cb-hits'); hits.id = 'cbHits';
  const status = el('p', 'hint cb-status'); status.id = 'cbStatus';
  const card = el('div', 'cb-card'); card.id = 'cbCard'; card.hidden = true;
  const title = el('div', 'cb-title'); title.id = 'cbTitle';
  const sub = el('div', 'cb-sub'); sub.id = 'cbSub';
  // NH2's names (the Cave list of 1912, first class: core/readers/cabins.js, row.people): who a list booked into the room,
  // with the list's own caveat; never who was there that night
  const folk = el('div', 'cb-people'); folk.id = 'cbPeople'; folk.hidden = true;
  const pieces = el('ol', 'cb-pieces'); pieces.id = 'cbPieces';
  const row2 = el('div', 'row mt6 cb-actions');
  const bWalk = el('button', 'btn', 'Walk from here'); bWalk.id = 'cbWalk'; bWalk.type = 'button';
  const bClear = el('button', 'btn', 'Clear'); bClear.id = 'cbClear'; bClear.type = 'button';
  row2.append(bWalk, bClear);
  card.append(title, sub, folk, pieces, row2);
  // RC2 (Bo's ruling on the red team's row 14, D130): the credit for her rooms, always shown with the section, in the same
  // words as the README and SOURCES.md
  const CREDIT = 'Her rooms\' positions and names were read from the deck plans drawn by Bruce Beveridge for Titanic: The Ship Magnificent (The History Press, 2008), as published by Encyclopedia Titanica. No drawing is reproduced, and any error in the tables is ours.';
  const credit = el('p', 'hint cb-credit', CREDIT); credit.id = 'cbCredit';
  sec.append(head, lead, q, hits, status, card, credit);
  pane.appendChild(sec);

  // ------------------------------------------------------------------ finding a room
  let shownHits = [], picked = null, pickedLabel = null;
  function find() {
    hits.textContent = ''; shownHits = []; hits.hidden = false;
    const text = q.value.trim();
    if (!text) { changed = true; return; }
    if (!I) { load(); changed = true; return; }
    const L = CB.lookup(I, text), out = [];
    if (L && L.row) out.push({ row: L.row, label: L.label });
    for (const r of CB.search(I, text, 8)) if (!out.some(o => o.row === r)) out.push({ row: r, label: null });
    // a name that finds no room: the people a list booked into her staterooms (NH2's names), each with the room it gives
    if (!out.length && !(L && L.label) && CB.named) for (const p of CB.named(I, text, 8)) out.push({ row: p.row, label: p.labels[0] || null, who: p });
    shownHits = out.slice(0, 8);
    shownHits.forEach((h, i) => {
      const words = h.who ? h.who.names.join('; ') + ': ' + (h.who.cabin || h.label) + ' (' + (h.row.name || h.row.kind) + ', ' + deckName(h.row.deck) + ')'
        : (h.label ? h.label + ' · ' : '') + (h.row.name || h.row.kind) + ' · ' + deckName(h.row.deck) + ' (' + h.row.id + ')';
      const li = el('li'), b = el('button', 'cb-hit' + (h.who ? ' cb-who' : ''), words);
      b.type = 'button'; b.dataset.id = h.row.id; b.addEventListener('click', () => pick(h.row, h.label));
      li.appendChild(b); hits.appendChild(li);
      if (i === 0) b.classList.add('first');
    });
    status.textContent = shownHits.length ? (shownHits[0].who ? 'No room by that name: the people of that name the Cave list (1912, first class) booked, each with the room it gives.' : '')
      : (L && L.label ? 'Her plans have no room ' + L.label + ' in R3\'s tables.' : 'No room of hers by that number or name, and no one by that name in the Cave list (first class).');
  }
  const deckName = (d) => (d === 'Boat' ? 'the Boat deck' : (d === 'orlop' ? 'the orlop' : d + ' deck'));
  q.addEventListener('input', find);
  q.addEventListener('focus', load);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && shownHits.length) { e.preventDefault(); pick(shownHits[0].row, shownHits[0].label); } });
  bClear.addEventListener('click', () => { picked = null; pickedLabel = null; A.diagramMark && A.diagramMark('cabins', null); card.hidden = true; changed = true; });
  bWalk.addEventListener('click', () => {
    const w = walkFrom(); if (!w || !A.walk) return;
    A.walk.enter({ deck: w.deck, x: w.x, y: w.y, yaw: 0 });
  });

  // the room picked: its card, its mark on the diagram
  function pick(row, label) {
    picked = row; pickedLabel = label || null;
    card.hidden = false;
    // RC2 (the first ten minutes played cold): the room picked, its card is what was wanted. The other matches stood above
    // it, eight at most, and pushed it out of sight on a laptop's panel and a phone's sheet ("C 22" and Enter seemed to do
    // nothing). They fold away until the box changes, and the card is brought into view (below, once it is drawn)
    hits.hidden = true;
    if (A.diagramMark) {
      const xs = Array.isArray(row.x) ? row.x : [row.x, row.x], x0 = Math.min(xs[0], xs[1]), x1 = Math.max(xs[0], xs[1]), xm = 0.5 * (x0 + x1);
      const z0 = C.deckZ(row.deck === 'orlop' ? 'orlop' : row.deck, xm), z1 = UP[row.deck] ? C.deckZ(UP[row.deck], xm) : z0 + 2.6;
      A.diagramMark('cabins', { x0, x1, z0, z1: Math.max(z1, z0 + 1), label: label || row.id });
    }
    changed = true; drawCard(true);
    try { card.scrollIntoView({ block: 'nearest' }); } catch (e) { /* an engine without it: the card stands where it is */ }
  }
  // where the walk starts: the room's place in its first piece the model has, on a deck the walk walks
  function walkFrom() {
    const sim = S.sim;
    if (!picked || !sim || !I || A.gone(sim) || WALKED.indexOf(picked.deck) < 0) return null;
    const d = CB.depth(I, sim, picked);
    return d.length ? { deck: picked.deck, x: d[0].x, y: d[0].y } : null;
  }

  // ------------------------------------------------------------------ the card
  let lastCard = -1e9;
  function drawCard(now) {
    const sim = S.sim;
    if (!picked || !sim) return;
    title.textContent = (pickedLabel ? pickedLabel + ' · ' : '') + (picked.name || picked.kind) + ' · ' + deckName(picked.deck);
    const others = picked.labels.filter(l => l !== pickedLabel);
    sub.textContent = 'R3\'s row ' + picked.id + (picked.beyond ? ' (beyond the model\'s spaces in part)' : '') + (others.length ? '; its block in the plans: ' + picked.labels.slice(0, 12).join(', ') + (picked.labels.length > 12 ? ' and ' + (picked.labels.length - 12) + ' more' : '') + ' (each has the block\'s pieces and times)' : '');
    // who a list booked into the room, its lines in the list's order (those under the number picked first), with the list's
    // caveat; nothing where no list names anyone here
    folk.textContent = '';
    const ppl = (picked.people || []).slice();
    if (pickedLabel) ppl.sort((a, b) => (b.labels.indexOf(pickedLabel) >= 0) - (a.labels.indexOf(pickedLabel) >= 0));
    folk.hidden = !ppl.length;
    if (ppl.length) {
      const byList = new Map();
      for (const p of ppl) { if (!byList.has(p.list)) byList.set(p.list, []); byList.get(p.list).push(p); }
      for (const [list, P] of byList) {
        folk.appendChild(el('div', 'cb-folk-head', 'Booked here in ' + (/Cave list/.test(list) ? 'the Cave list (1912, first class)' : list) + ':'));
        const ul = el('ul', 'cb-folk');
        P.slice(0, MAX_LINES).forEach((p) => { const li = el('li', 'cb-who', p.names.join('; ') + (p.cabin ? ' (' + p.cabin + ')' : '')); li.dataset.n = String(p.n); ul.appendChild(li); });
        if (P.length > MAX_LINES) ul.appendChild(el('li', 'cb-more', 'and ' + (P.length - MAX_LINES) + ' more of its lines here'));
        folk.appendChild(ul);
      }
      folk.appendChild(el('p', 'hint cb-caveat', CAVEAT));
    }
    pieces.textContent = '';
    const wet = tr ? CB.wetPieces(tr, picked) : picked.pieces.map(p => Object.assign({ deck: picked.deck, floor: picked.floor, t: null, step: null, outside: p.slab < 0 }, p));
    let deep = [];
    try { deep = CB.depth(I, sim, picked); } catch (e) { deep = []; }
    const gone = A.gone(sim);
    wet.forEach((p, j) => {
      const li = el('li', 'cb-piece'); li.dataset.slab = String(p.slab);
      if (p.outside) { li.textContent = 'A piece outside the model\'s spaces (its water is not the model\'s).'; li.dataset.state = 'outside'; pieces.appendChild(li); return; }
      const d = deep.find(x => x.slab === p.slab);
      const w = el('span', 'cb-words', p.t !== null ? CB.words(p, A.clockOf(p.t) || hm(p.t) + ' into the run') : 'Dry ' + CB.words(p).replace(/^water /, '') + (gone || ended ? ', to her end' : ', so far'));
      li.dataset.state = p.t !== null ? 'wet' : 'dry'; li.appendChild(w);
      if (d && p.t !== null) li.appendChild(el('span', 'cb-depth', d.full ? 'full to its deckhead now' : (d.depth > 0.005 ? d.depth.toFixed(2) + ' m over the deck there now' : 'no water standing over the deck there now')));
      pieces.appendChild(li);
    });
    if (!tr) pieces.appendChild(el('li', 'cb-piece', 'This run is not her own hull: her rooms are not tracked.'));
    const w = walkFrom();
    bWalk.disabled = !w; bWalk.title = w ? 'Walk ' + deckName(w.deck) + ' from this room' : (picked.deck === 'orlop' ? 'The walk does not go down to the orlop' : 'Not now: she has gone, or there is no run');
    lastCard = A.now ? A.now() : 0;
  }

  // ------------------------------------------------------------------ the page's passes
  let changed = true;
  A.on('reset', (sim) => { reset(sim); if (picked) drawCard(true); });
  // NH4, the scrubber: the run's first wet times so far, kept with each minute of it (plain data) and put back at a scrub
  if (A.keeper) A.keeper('cabins', {
    keep: () => ({ tr, ended }),
    scrub: (sim, s) => { tr = s.tr; ended = s.ended; trSim = tr ? sim : null; changed = true; if (picked) drawCard(true); },
  });
  A.on('frame', () => {
    if (pane.hidden) return;
    if (!I && !loading && !loadErr) load();
    status.textContent = loadErr ? 'Her rooms: ' + loadErr + '.' : (loading ? 'Loading her rooms...' : status.textContent.replace(/^Loading her rooms\.\.\.$/, ''));
    if (picked && changed && (!A.now || A.now() - lastCard >= 500)) { changed = false; drawCard(false); }
  });
  reset(S.sim);                                    // the page's first run began before this part was loaded (at t = 0)

  // for the tests (tools/cabins_site_test.js) and for exploring
  A.cabins = {
    ready: () => !!I, error: () => loadErr, index: () => I, fetched: () => (got ? Object.assign({}, got) : null),
    track: () => (tr ? { t: tr.t.slice(), step: tr.step.slice(), slabs: tr.slabs, calls: tr.calls } : null),
    picked: () => (picked ? { id: picked.id, label: pickedLabel, deck: picked.deck } : null),
    pick: (query) => { if (!I) return false; const L = CB.lookup(I, query); const row = L && L.row ? L.row : CB.find(I, query); if (!row) return false; pick(row, L && L.label); return true; },
    card: () => ({ hidden: card.hidden, title: title.textContent, sub: sub.textContent,
      people: folk.hidden ? [] : [...folk.querySelectorAll('.cb-who')].map(li => li.textContent), peopleHead: folk.hidden ? null : [...folk.querySelectorAll('.cb-folk-head')].map(d => d.textContent).join(' | '),
      caveat: folk.hidden || !folk.querySelector('.cb-caveat') ? null : folk.querySelector('.cb-caveat').textContent, pieces: [...pieces.querySelectorAll('.cb-piece')].map(li => ({ state: li.dataset.state || null, slab: li.dataset.slab === undefined ? null : +li.dataset.slab, words: (li.querySelector('.cb-words') || li).textContent, depth: li.querySelector('.cb-depth') ? li.querySelector('.cb-depth').textContent : null })), walk: !bWalk.disabled }),
    hits: () => shownHits.map(h => ({ id: h.row.id, label: h.label, who: h.who ? h.who.names.join('; ') : null })),
    CREDIT, credit: () => ({ text: credit.textContent, shown: credit.getClientRects().length > 0 }),
    walkFrom, draw: () => drawCard(true),
  };
})();
