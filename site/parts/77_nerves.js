// NH15, the living ship's nervous system (docs/DESIGN_the_living_ship_v1_2026-11-23.md, part 5). A part of the viewer
// (site/app.js, "parts").
//
// The Systems tab gains her systems as a graph. Every node of core/readers/nerves.js (U0's NODES and EDGES, placed on a
// unit square as the chain runs) is coloured by its rule (RULES: green working; amber working short, or on a stand-by;
// red failed; grey not here, or not in use), with the reason in words and the model's time it took that state: T plus
// minutes after the touch on a watch, the ship's clock on a preset.
//   - Desktop first (D84): the graph, and under it, in words, the nodes not working (amber and red). On a phone, the list
//     of every node.
//   - A node pointed at, or focused, shows its full name, its reason and its time.
//   - A node that changes its state is marked for a few seconds of the page's clock (TitanicApp.after; QC C-3), with
//     what hangs on it.
//   - It reads the model and writes nothing: the rules are pure functions of the sim (tools/nerves_tests.js).
// The places, the short names and the colours are [appearance]; the states, reasons and times are the rules'.
(function () {
  'use strict';
  const A = window.TitanicApp, NV = window.TitanicNerves;
  if (!A || !NV || !NV.NODES || !NV.RULES) return;
  const pane = document.querySelector('[data-pane="systems"]');
  if (!pane) return;
  const S = A.state, NODES = NV.NODES, EDGES = NV.EDGES || [];
  const hm = (s) => { const m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };

  // the time a state began, as the page says it: T plus minutes after the touch on a watch, the ship's clock on a preset
  function timeText(t) {
    const sim = S.sim;
    if (t === null || t === undefined || !sim) return '';
    if (sim.night) {
      const t0 = sim.night.tTouch;
      if (!(t0 >= 0)) return A.clockOf(t) || '';
      const m = Math.round((t - t0) / 60);
      return 'T' + (m < 0 ? '-' : '+') + Math.abs(m);
    }
    return A.clockOf(t) || hm(t) + ' in';
  }
  // the short names on the graph [appearance]; the list and the caption give each node's own label
  const ROOMNO = (label) => { const m = /Boiler room (\d+)/.exec(label); return m ? m[1] : '?'; };
  const SHORT = { fans: 'Fans', steam: 'Steam', 'engine:port': 'Port engine', 'engine:starboard': 'Stbd engine', turbine: 'Turbine', steering: 'Steering',
    pumps: 'Pumps', dynamos: 'Dynamos', emergency: 'Emergency', 'screw:port': 'Port screw', 'screw:starboard': 'Stbd screw', 'screw:centre': 'Centre screw',
    rudder: 'Rudder', lights: 'Lights', doors: 'Doors', wireless: 'Wireless', morse: 'Morse lamp', phones: 'Telephones', boats: 'Boats' };
  const shortOf = (n) => (/^coal:/.test(n.id) ? 'Coal ' + ROOMNO(n.label) : (/^fires:/.test(n.id) ? 'Fires ' + ROOMNO(n.label) : (SHORT[n.id] || n.label)));

  // ------------------------------------------------------------------ the section, before "What depends on what"
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const sec = el('div', 'sec nv-sec'); sec.id = 'nvSec';
  const head = el('h3', null, 'Her nervous system');
  const lead = el('p', 'hint nv-lead', 'Each of her systems and what it hangs on, live: green working, amber working short or on a stand-by, red failed, grey not here. Point at one for its reason and when it began.');
  const SVG = 'http://www.w3.org/2000/svg', graph = document.createElementNS(SVG, 'svg');
  graph.setAttribute('class', 'nv-graph'); graph.id = 'nvGraph'; graph.setAttribute('role', 'img'); graph.setAttribute('aria-label', 'Her systems as a graph: each a dot coloured by its state, joined to what it hangs on');
  const cap = el('p', 'nv-cap'); cap.id = 'nvCap';
  const listCap = el('p', 'nv-listcap hint', 'Not working now:'); listCap.id = 'nvListCap';
  const list = el('ol', 'nv-list'); list.id = 'nvList';
  sec.append(head, lead, graph, cap, listCap, list);
  const chain = document.getElementById('sysChain'), before = chain && chain.closest ? chain.closest('.sec') : null;
  if (before && before.parentNode) before.parentNode.insertBefore(sec, before); else pane.insertBefore(sec, pane.firstChild);

  // the graph: the nodes at their places, the edges under them [appearance]
  const W = 352, H = 448, X = (x) => 26 + (W - 52) * x, Y = (y) => 14 + (H - 44) * y;
  graph.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  const svg = (tag, attrs) => { const e = document.createElementNS(SVG, tag); for (const a in attrs) e.setAttribute(a, attrs[a]); return e; };
  const byId = new Map(NODES.map(n => [n.id, n]));
  const edgeG = svg('g', { class: 'nv-edges' }), nodeG = svg('g', { class: 'nv-nodes' });
  graph.append(edgeG, nodeG);
  const edges = EDGES.filter(e => byId.has(e[0]) && byId.has(e[1])).map(([a, b]) => {
    const p = byId.get(a), q = byId.get(b), ln = svg('line', { x1: X(p.x), y1: Y(p.y), x2: X(q.x), y2: Y(q.y), class: 'nv-edge' });
    ln.dataset.from = a; ln.dataset.to = b; ln.dataset.state = 'grey'; edgeG.appendChild(ln);
    return { a, b, ln };
  });
  const nodes = NODES.map(n => {
    const g = svg('g', { class: 'nv-node', tabindex: '0', transform: 'translate(' + X(n.x).toFixed(1) + ' ' + Y(n.y).toFixed(1) + ')' });
    g.dataset.id = n.id; g.dataset.state = 'grey';
    const ring = svg('circle', { r: 9.5, class: 'nv-ring' }), dot = svg('circle', { r: 6, class: 'nv-dot' }), tx = svg('text', { y: 17, 'text-anchor': 'middle', class: 'nv-label' });
    tx.textContent = shortOf(n);
    const title = svg('title', {}); title.textContent = n.label;
    g.append(title, ring, dot, tx); nodeG.appendChild(g);
    const li = el('li', 'nv-item'); li.dataset.id = n.id; li.dataset.state = 'grey';
    const name = el('b', 'nv-name', n.label), why = el('span', 'nv-why'), when = el('span', 'nv-t');
    li.append(el('i'), name, why, when); list.appendChild(li);
    return { n, g, li, why, when, title };
  });

  // ------------------------------------------------------------------ the states: the rules on the page's own sim
  let now = {}, drawn = false, pointed = null, lastAt = -1e9;
  const CHANGE_MS = 2500;
  function capText(id) {
    const n = byId.get(id), s = now[id];
    if (!n || !s) return 'Point at a system for its reason and when it began.';
    const t = timeText(s.t);
    return n.label + ': ' + s.why + (t ? ' (' + t + ')' : '') + '.';
  }
  function draw() {
    const sim = S.sim; if (!sim) return;
    const st = NV.stateOf(sim), changed = [];
    nodes.forEach(it => {
      const s = st[it.n.id] || { state: 'grey', why: '', t: null }, was = now[it.n.id];
      if (drawn && was && was.state !== s.state) changed.push(it.n.id);
      if (it.g.dataset.state !== s.state) { it.g.dataset.state = s.state; it.li.dataset.state = s.state; }
      const t = timeText(s.t);
      if (it.why.textContent !== s.why) it.why.textContent = s.why;
      if (it.when.textContent !== t) it.when.textContent = t;
      it.title.textContent = it.n.label + ': ' + s.why + (t ? ' (' + t + ')' : '');
    });
    edges.forEach(e => { const s = st[e.a] ? st[e.a].state : 'grey'; if (e.ln.dataset.state !== s) e.ln.dataset.state = s; });
    now = st; drawn = true;
    const failing = NODES.filter(n => st[n.id] && (st[n.id].state === 'red' || st[n.id].state === 'amber')).length;
    listCap.textContent = failing ? 'Not working now (' + failing + '):' : 'Every system working, or not in use.';
    cap.textContent = capText(pointed);
    // a change of state marked for a while, with the edges out of it (the page's clock: QC C-3)
    for (const id of changed) {
      const it = nodes.find(x => x.n.id === id); it.g.classList.add('nv-changed');
      const outs = edges.filter(e => e.a === id); outs.forEach(e => e.ln.classList.add('nv-changed'));
      A.after(CHANGE_MS, () => { it.g.classList.remove('nv-changed'); outs.forEach(e => e.ln.classList.remove('nv-changed')); });
    }
  }
  function reset() {
    now = {}; drawn = false; pointed = null; lastAt = -1e9;
    nodes.forEach(it => { it.g.dataset.state = 'grey'; it.li.dataset.state = 'grey'; it.why.textContent = ''; it.when.textContent = ''; it.g.classList.remove('nv-changed'); });
    edges.forEach(e => { e.ln.dataset.state = 'grey'; e.ln.classList.remove('nv-changed'); });
    cap.textContent = capText(null);
  }
  A.on('reset', reset);
  // drawn while the tab shows, four times a second of the page's clock
  A.on('frame', (t) => {
    if (pane.hidden || !S.sim) return;
    if (t * 1000 - lastAt < 250) return;
    lastAt = t * 1000; draw();
  });
  // a node pointed at or focused: its full name, its reason and its time
  const point = (id) => { pointed = id; cap.textContent = capText(id); nodes.forEach(it => it.g.classList.toggle('nv-pointed', it.n.id === id)); };
  nodes.forEach(it => {
    it.g.addEventListener('mouseenter', () => point(it.n.id));
    it.g.addEventListener('focus', () => point(it.n.id));
    it.g.addEventListener('click', () => point(it.n.id));
  });
  graph.addEventListener('mouseleave', () => point(null));
  reset();

  // for the tests (tools/nerves_site_test.js) and for exploring: what each node shows now, and the page's way with a time
  A.nerves = {
    timeText, draw,
    shown: () => nodes.map(it => ({ id: it.n.id, state: it.g.dataset.state, item: it.li.dataset.state, why: it.why.textContent, t: it.when.textContent })),
    graphShown: () => { const r = graph.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(graph).display !== 'none'; },
    listShown: () => list.querySelectorAll('li').length > 0 && [...list.querySelectorAll('li')].some(li => li.getBoundingClientRect().height > 0),
  };
})();
