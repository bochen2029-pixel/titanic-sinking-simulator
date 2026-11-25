// The boats (core/readers/people.js) in the viewer. A part (site/app.js, "parts").
//
//   - The twenty boats, each drawn where the model has her: on deck under her davits, swung out, going down the side at
//     the model's own height, pulling away to lie a few hundred metres off, floated off, or gone with the deck. Simple
//     shapes from the boats' sizes [read: the note 1.1]; their colours, the falls, the rowing away and where they lie
//     off, where a boat stands on deck before she is swung out, and the look of a boat floated off are [appearance].
//   - A small readout it builds itself (boats away of twenty, the people in them, the places that went empty), and the
//     three orders as controls: uncover the boats now; who may board on each side; how full a boat must be before she
//     is lowered. Each goes through the page's one way to give an order (TitanicApp.order: the watch taken over as by the
//     wheel, then TitanicNight.act), so it is in the log and replays, and "Replay my watch" keeps it.
//   - On a damage preset (no watch) it shows nothing.
// It reads the model's state and the reader's (sim.people), and feeds nothing back but the player's orders. It counts;
// it names nobody and draws no person. The numbers are the model's; the words are this file's.
(function () {
  'use strict';
  const A = window.TitanicApp, NT = window.TitanicNight, BP = window.TitanicPeople, C = window.TitanicCore, THREE = window.THREE;
  if (!A || !NT || !BP || !C || !THREE) return;
  const S = A.state, NB = BP.BOATS.length;
  const fmtInt = (v) => Math.round(v).toLocaleString('en-US');

  // ------------------------------------------------------------------ the shapes
  // length, beam, depth, m [read: the note 1.1: 30 ft x 9 ft 1 in x 4 ft; 25 ft 2 in x 7 ft 2 in x 3 ft; 27 ft 5 in x 8 ft x
  // 3 ft]: site/topsides.js's table (BOAT_DIM), which also draws them stowed on a damage preset, where this part draws none
  const TSD = window.TitanicTopsides;
  const DIM = TSD ? TSD.BOAT_DIM : { lifeboat: [9.14, 2.77, 1.22], cutter: [7.67, 2.18, 0.91], collapsible: [8.36, 2.44, 0.91], roof: [8.36, 2.44, 0.91] };
  const HEAD = 3.0;           // m: the davit head above the boat deck [appearance; the note's 3 m of fall at the boat deck]
  // collapsibles A and B folded on the officers' house's roof: 5.3 m out from her centre line, between funnel 1's casing
  // and the roof's edge [bet: docs/research/RESEARCH_topsides_dimensions_v1_2026-11-19.md, 3.2], on the roof site/topsides.js
  // draws there (ROOF_BOATS; 3.0 m out and 2.7 m over the deck without it, as before)
  const ROOF = { y: TSD ? TSD.ROOF_BOATS.y : 3.0 };
  const roofZ = (x, y) => (TSD ? TSD.roofUnder(x, y).z : C.deckZ('Boat', x) + 2.7);
  const OFF = 300, ROW = 0.5; // a boat away pulls off at about a knot (m/s) to lie 300 m off her side [appearance]
  const matHull = new THREE.MeshLambertMaterial({ color: 0xe9e4d8, side: THREE.DoubleSide });     // [appearance]
  const matCover = new THREE.MeshLambertMaterial({ color: 0x9c8a66, side: THREE.DoubleSide });    // canvas covers [appearance]
  const matFold = new THREE.MeshLambertMaterial({ color: 0xb5a37c });                              // a collapsible folded [appearance]
  const matRim = new THREE.LineBasicMaterial({ color: 0x3d4a57 });
  function hullGeo(L, B, D) {                     // the lower half of a sphere, stretched: keel at 0, gunwale at D
    const g = new THREE.SphereGeometry(1, 18, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    g.scale(L / 2, D, B / 2); g.translate(0, D, 0);
    return g;
  }
  function coverGeo(L, B, D) { const g = new THREE.CircleGeometry(1, 24); g.rotateX(-Math.PI / 2); g.scale(L / 2 * 0.97, 1, B / 2 * 0.97); g.translate(0, D, 0); return g; }
  function rimGeo(L, B, D) { const pts = []; for (let k = 0; k <= 32; k++) { const a = k / 32 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * L / 2, D, Math.sin(a) * B / 2)); } return new THREE.BufferGeometry().setFromPoints(pts); }
  // a boat's number on her label [appearance: the page's own face, IBM Plex Sans Condensed]
  const TAG_FONT = '600 22px "IBM Plex Sans Condensed", sans-serif';
  function drawTag(cv, text) {
    const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height);
    x.font = TAG_FONT; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 4; x.strokeStyle = 'rgba(4, 8, 14, 0.9)'; x.strokeText(text, 32, 17); x.fillStyle = '#f2efe6'; x.fillText(text, 32, 17);
  }
  function label(text) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 32;
    drawTag(cv, text);
    const tex = new THREE.CanvasTexture(cv);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
    s.scale.set(0.032, 0.016, 1); s.renderOrder = 9; s.userData.text = text;
    return s;
  }
  const rig = BP.BOATS.map((d) => {
    const [L, B, D] = DIM[d.type], g = new THREE.Group();
    const hull = new THREE.Mesh(hullGeo(L, B, D), matHull), cover = new THREE.Mesh(coverGeo(L, B, D), matCover), rim = new THREE.Line(rimGeo(L, B, D), matRim);
    const fold = d.type === 'collapsible' || d.type === 'roof' ? new THREE.Mesh(new THREE.BoxGeometry(L, 0.32, B), matFold) : null;
    if (fold) fold.position.y = 0.16;
    const tag = label(d.id); tag.position.y = D + 1.6;
    g.add(hull, cover, rim, tag); if (fold) g.add(fold);
    g.visible = false; g.name = 'boat ' + d.id;
    return { g, hull, cover, rim, fold, tag, L, B, D, parent: null };
  });
  // The numbers are drawn when the part loads, which is before the page's fonts have come: drawn then, they came out in the
  // face or in its fallback from one load of the page to the next. So they are drawn again once that face is loaded (the
  // page does the same for its own labels: site/app.js, near its end), and are the same on every load
  let tagsInFace = false;
  function redrawTags() { for (const r of rig) { drawTag(r.tag.material.map.image, r.tag.userData.text); r.tag.material.map.needsUpdate = true; } tagsInFace = true; }
  if (document.fonts && document.fonts.load) document.fonts.load(TAG_FONT, '0123456789ABCD').then(redrawTags, () => { /* the face could not be had: the fallback stays */ });
  // the falls of the boats going down: two lines a boat, from the davit heads to her ends [appearance]
  const fallsPos = new Float32Array(NB * 4 * 3), fallsGeo = new THREE.BufferGeometry();
  fallsGeo.setAttribute('position', new THREE.BufferAttribute(fallsPos, 3));
  const falls = new THREE.LineSegments(fallsGeo, new THREE.LineBasicMaterial({ color: 0xc9c2b0, transparent: true, opacity: 0.8 }));
  falls.frustumCulled = false; A.scene.add(falls);

  const v = new THREE.Vector3(), w = new THREE.Vector3(), fwd = new THREE.Vector3();
  function park(r, parent) { if (r.parent !== parent) { parent.add(r.g); r.parent = parent; } }
  // in the ship's frame (x forward, y to port, z up), on her deck or at her davits; the boat's length along hers
  function onShip(r, x, y, z, mode) {
    park(r, A.shipGroup);
    r.g.position.copy(A.SX(x, y, z)); r.g.rotation.set(0, 0, 0);
    r.cover.visible = mode === 'covered'; r.hull.visible = mode !== 'folded'; r.rim.visible = mode !== 'folded'; if (r.fold) r.fold.visible = mode === 'folded';
  }
  function show(r, how) { r.cover.visible = false; r.hull.visible = true; r.rim.visible = true; if (r.fold) r.fold.visible = false; r.hull.rotation.set(how === 'upturned' ? Math.PI : 0, 0, 0); r.rim.visible = how !== 'upturned'; }

  function place(i, b, sim) {
    const d = BP.BOATS[i], st = BP.STATION[i], r = rig[i], side = d.side === 'P' ? 1 : -1, deck = st.z;
    r.g.visible = b.state !== 'lost';
    if (!r.g.visible) return;
    r.tag.visible = b.state === 'lowering' || b.state === 'away' || b.state === 'floated';   // a number only once she leaves the deck
    if (b.state === 'covered' || b.state === 'cleared') {
      show(r, 'upright');
      if (d.type === 'cutter') onShip(r, st.x, side * (st.edge + BP.OUT), deck + 0.4, b.state);   // kept swung out at sea [read]
      else if (d.type === 'roof' && b.state === 'covered') onShip(r, d.stow.x, side * ROOF.y, roofZ(d.stow.x, side * ROOF.y), 'folded');   // on the officers' house's drawn roof
      else if (d.type === 'roof') onShip(r, d.stow.x, side * (st.edge - 2.6), deck, 'open');          // got down to the deck
      else if (d.type === 'collapsible') onShip(r, st.x, side * (st.edge - 2.6), deck, b.state === 'covered' ? 'folded' : 'open');   // abreast her cutter
      else onShip(r, st.x, side * (st.edge - 1.6), deck + 0.4, b.state);                               // inboard on her chocks
      r.hull.rotation.set(0, 0, 0);
      return;
    }
    if (b.state === 'swungOut' || b.state === 'loading') { show(r, 'upright'); onShip(r, st.x, side * (st.edge + BP.OUT), deck, 'open'); return; }
    if (b.state === 'lowering' && !(b.tWater >= 0)) {
      // plumb under her davit head, at the height the model gives her (her keel above the sea), level, along the ship
      show(r, 'upright'); park(r, A.scene);
      v.copy(A.SX(st.x, side * (st.edge + BP.OUT), deck + HEAD)).applyMatrix4(A.shipGroup.matrix);
      fwd.set(1, 0, 0).transformDirection(A.shipGroup.matrix);
      r.g.position.set(v.x, b.h - S.post, v.z); r.g.rotation.set(0, Math.atan2(-fwd.z, fwd.x), 0);
      return;
    }
    // afloat: away, or floated off; in the water where the model set her down, on the earth that moves under the ship
    const pl = b.place; if (!pl) { r.g.visible = false; return; }
    park(r, A.earth);
    let dist = 0, y = -0.35;
    if (b.state === 'away' || b.state === 'lowering') dist = b.tAway >= 0 ? Math.min(OFF, ROW * Math.max(0, sim.t - b.tAway)) : 0;
    show(r, d.id === 'B' && b.state === 'floated' ? 'upturned' : 'upright');
    if (b.state === 'floated') y = d.id === 'B' ? 0.25 : -(r.D - 0.12);           // B upside down, the others awash [read: the note 5]
    r.g.position.set(pl.X - A.E0.x + pl.dx * dist, y, pl.Y - A.E0.y + pl.dy * dist);
    r.g.rotation.set(0, Math.atan2(-pl.dy, pl.dx), 0);
  }
  function setFalls(P) {
    let n = 0;
    for (let i = 0; i < NB; i++) {
      const b = P.boats[i], r = rig[i], d = BP.BOATS[i], st = BP.STATION[i], side = d.side === 'P' ? 1 : -1;
      if (!(b.state === 'lowering' && !(b.tWater >= 0)) || !r.g.visible) continue;
      r.g.updateMatrixWorld(true);
      for (const e of [-1, 1]) {
        const ex = e * 0.38 * r.L;
        v.copy(A.SX(st.x + ex, side * (st.edge + BP.OUT), st.z + HEAD)).applyMatrix4(A.shipGroup.matrix);
        w.set(ex, r.D, 0); r.g.localToWorld(w);
        fallsPos.set([v.x, v.y, v.z, w.x, w.y, w.z], n * 6); n++;
      }
    }
    fallsGeo.setDrawRange(0, n * 2); fallsGeo.attributes.position.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the readout and the controls
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const stage = document.getElementById('stage');
  const chip = el('div', 'boats-chip'); chip.id = 'boatsChip'; chip.hidden = true; chip.setAttribute('role', 'status');
  // in the stage's stack (C-4), first: the end card stands under it. It is not one of the stage's musts, so it gives way
  // where they need its room, after the director's caption (turn 8d: on the narrow desktop after the ice it lay 13 px
  // over the notice); the Run tab keeps the boats' numbers
  if (!(A.slot && A.slot('stack', chip, { order: 1, last: true })) && stage) stage.appendChild(chip);
  const sec = el('div', 'sec boats'); sec.id = 'boatsSec'; sec.hidden = true;
  sec.appendChild(el('h3', null, 'The boats'));
  const stats = el('div', 'boats-stats'), stat = {};
  for (const [k, label] of [['away', 'Boats away'], ['in', 'In them'], ['empty', 'Places empty'], ['aboard', 'Still aboard'], ['water', 'In the water']]) {
    const s = el('div', 'stat'), kk = el('div', 'k', label), vv = el('div', 'v', '–'); vv.id = 'boatsStat_' + k; s.append(kk, vv); stats.appendChild(s); stat[k] = vv;
  }
  sec.appendChild(stats);
  const now = el('p', 'boats-now'); now.id = 'boatsNow'; sec.appendChild(now);
  const bUncover = el('button', 'btn', 'Uncover the boats now'); bUncover.id = 'boatsUncover';
  const rowU = el('div', 'row mt8'); rowU.appendChild(bUncover); sec.appendChild(rowU);
  function seg(id, aria, items, attr) {
    const s = el('div', 'seg wide'); s.id = id; s.setAttribute('role', 'group'); s.setAttribute('aria-label', aria);
    for (const [val, text] of items) { const b = el('button', null, text); b.dataset[attr] = String(val); b.setAttribute('aria-pressed', 'false'); s.appendChild(b); }
    return s;
  }
  const RULE_ITEMS = [['only', 'Women and children only'], ['first', 'Women and children first'], ['fill', 'Fill her']];
  const ctl = (title, s) => { const c = el('div', 'boats-ctl mt8'); c.append(el('span', 'boats-k', title), s); sec.appendChild(c); return s; };
  const segP = ctl('Who may board, port side', seg('boatsRuleP', 'Who may board on the port side', RULE_ITEMS, 'rule'));
  const segS = ctl('Who may board, starboard side', seg('boatsRuleS', 'Who may board on the starboard side', RULE_ITEMS, 'rule'));
  const segF = ctl('Lower a boat once she holds', seg('boatsFill', 'How full a boat must be before she is lowered', [[0.3, '30 % (the model\'s rule for the night)'], [0.5, 'Half'], [0.75, 'Three-quarters'], [1, 'Full']], 'fill'));
  const det = el('details', 'mt8'); det.appendChild(el('summary', null, 'Boat by boat'));
  const tw = el('div', 'tablewrap'), tbl = el('table'), thead = el('thead'), tbody = el('tbody'); tbody.id = 'boatsBody';
  const hr = el('tr'); for (const h of ['Boat', 'Side', 'Now', 'In her', 'Away']) hr.appendChild(el('th', h === 'In her' ? 'num' : null, h));
  thead.appendChild(hr); tbl.append(thead, tbody); tw.appendChild(tbl); det.appendChild(tw); sec.appendChild(det);
  sec.appendChild(el('p', 'hint mt8', 'A model of places and minutes, fitted to the launch record of 1912 (the re-examined times of Wormstedt, Fitch and Behe, and their numbers in the boats). How readily people came forward and the officers\' pace are fitted; the hands\' rates are the record\'s; the rest are named guesses. It counts; it names nobody. Read the numbers as estimates.'));
  const watchSec = document.getElementById('watchSec');
  if (watchSec && watchSec.parentNode) watchSec.parentNode.insertBefore(sec, watchSec.nextSibling);

  const WORDS = { covered: 'covered', cleared: 'cleared', swungOut: 'swung out', loading: 'loading', lowering: 'going down', away: 'away', floated: 'floated off', lost: 'gone with her' };
  const SIDE = { P: 'port', S: 'starboard' };
  function give(type, value, arg, said) {
    const sim = S.sim; if (!S.night || !sim || !sim.night || !sim.people) return false;
    const no = BP.why(sim, type, value, arg);
    if (no) { A.toast(no); sync(true); return false; }
    A.order(type, value, arg);                     // the page's own way: the watch is the player's from now (site/app.js)
    A.toast(said); sync(true);
    return true;
  }
  bUncover.addEventListener('click', () => give('boats:uncover', 'now', undefined, 'The order to uncover the boats: the hands strip the covers and clear the falls'));
  for (const [s, arg] of [[segP, 'port'], [segS, 'starboard']]) s.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const r = b.dataset.rule; give('boats:rule', r, arg, 'The ' + arg + ' side: ' + BP.RULE_WORDS[r]);
  }));
  segF.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const f = +b.dataset.fill; give('boats:fill', f, undefined, f >= 1 ? 'Lower no boat until she is full' : 'Lower a boat once she holds ' + Math.round(f * 100) + ' % of her places');
  }));

  let lastUi = 0, lastRows = '';
  function sync(force) {
    const sim = S.sim, P = sim && sim.people, on = !!(S.night && P);
    sec.hidden = !on; chip.hidden = !on || !(sim.night && sim.night.tTouch >= 0);   // the count on the stage from the touch on
    if (!on) return;
    const t = performance.now(); if (!force && t - lastUi < 200) return; lastUi = t;
    const c = P.count, w = sim.night;
    stat.away.textContent = c.boatsAway + ' of ' + NB; stat.in.textContent = fmtInt(c.inBoatsAway); stat.empty.textContent = fmtInt(c.emptyAway);
    stat.aboard.textContent = fmtInt(c.aboard); stat.water.textContent = fmtInt(c.water);
    // the count in segments, which a desktop keeps whole: there the line breaks only between them (50_boats.css)
    const segs = [c.boatsAway + ' of ' + NB + ' away', '· ' + fmtInt(c.inBoatsAway) + ' in them', '· ' + fmtInt(c.emptyAway) + ' places empty'];
    if (c.water) segs.push('· ' + fmtInt(c.water) + ' in the water');
    chip.textContent = '';
    chip.append(el('b', null, 'Boats '));
    segs.forEach((t, i) => { if (i) chip.append(document.createTextNode(' ')); chip.append(el('span', null, t)); });
    // what the officers are doing, in a line
    let line;
    if (P.over) line = 'She has gone. ' + fmtInt(c.inBoatsAway) + ' in the boats; ' + fmtInt(c.water) + ' in the water.';
    else if (P.uncoverT < 0) line = w.tTouch < 0 ? 'The boats are covered and griped in.' : (P.damaged ? 'The officers will order the boats uncovered ' + BP.T.uncoverAfter + ' minutes after the touch, as on the night.' : 'No water aboard: the boats stay covered.');
    else if (P.callT < 0) line = 'Uncovering since ' + (A.clockOf(P.uncoverT) || '') + (P.uncoverBy === 'order' ? ' (your order)' : '') + '. ' + (P.damaged ? 'The call to the boats ' + BP.T.call + ' minutes after the order.' : '');
    else line = P.parties.map(p => {
      const where = BP.GROUPS[p.g].name + ' boats', ids = p.slots.filter(i => i >= 0).map(i => BP.BOATS[i].id);
      return (p.side === 'P' ? 'Port' : 'Starboard') + ' party: ' + (p.walk > 0 ? 'moving to the ' + where : (ids.length ? 'loading ' + (ids.length > 1 ? 'boats ' + ids.join(' and ') : 'boat ' + ids[0]) : 'at the ' + where));
    }).join('. ') + '.';
    now.textContent = line;
    segP.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rule === P.rule.P)));
    segS.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rule === P.rule.S)));
    segF.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.fill === P.fill)));
    bUncover.textContent = P.uncoverT >= 0 ? 'Uncovered from ' + (A.clockOf(P.uncoverT) || '') : 'Uncover the boats now';
    // the table, only when something in it changed
    const key = P.boats.map(b => b.state + b.n).join(',');
    if (key !== lastRows) {
      lastRows = key; tbody.textContent = '';
      P.boats.forEach((b, i) => {
        const d = BP.BOATS[i], tr = el('tr');
        tr.append(el('td', null, d.id), el('td', null, SIDE[d.side]), el('td', null, WORDS[b.state]), el('td', 'num', String(b.n)), el('td', null, b.tAway >= 0 ? (A.clockOf(b.tAway) || '') : ''));
        tbody.appendChild(tr);
      });
    }
  }

  // ------------------------------------------------------------------ the hooks
  function hideAll() { for (const r of rig) r.g.visible = false; fallsGeo.setDrawRange(0, 0); }
  A.on('reset', () => { lastRows = ''; hideAll(); sync(true); });
  A.on('frame', () => {
    const sim = S.sim, P = sim && sim.people;
    if (!S.night || !P) { hideAll(); sync(false); return; }
    for (let i = 0; i < NB; i++) place(i, P.boats[i], sim);
    setFalls(P);
    sync(false);
  });

  // for the tests (tools/boats_site_test.js) and for exploring: each boat as drawn (her world position, from the scene
  // graph) beside the model's, and the readout's words
  A.boats = {
    drawn: () => rig.map((r, i) => { r.g.updateMatrixWorld(true); r.g.getWorldPosition(v); const P = S.sim && S.sim.people, b = P ? P.boats[i] : null;
      return { id: BP.BOATS[i].id, visible: r.g.visible, parent: r.parent === A.scene ? 'scene' : (r.parent === A.earth ? 'earth' : (r.parent === A.shipGroup ? 'ship' : null)), y: v.y, x: v.x, z: v.z, state: b ? b.state : null, h: b ? b.h : null }; }),
    chip: () => chip.textContent, stats: () => Object.fromEntries(Object.entries(stat).map(([k, e]) => [k, e.textContent])), sync: () => sync(true),
    // the labels: each boat's sprite (its canvas is material.map.image), the drawing, and whether they were drawn again in
    // the page's face once it had loaded
    tags: () => rig.map(r => r.tag), drawTag, tagsInFace: () => tagsInFace, TAG_FONT,
  };
})();
