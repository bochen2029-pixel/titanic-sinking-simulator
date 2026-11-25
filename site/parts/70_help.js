// The calls for help, in the viewer. A part (site/app.js, "parts"); the model is core/readers/world.js.
//
//   - A panel in the Run tab: the wireless (working or silent, and why), who has answered and when she is expected,
//     the rockets left, and the three orders (the distress call, a rocket, the Morse lamp) as buttons sized for a phone.
//     Every figure on it is TitanicWorld.readouts(sim); the orders go into the watch's log through the page's one way to
//     give an order (TitanicApp.order, then core/night.js), so "Replay my watch" and a link replay them with the helm's.
//   - A rocket fired: a streak from the starboard socket, a burst of white stars at the height the reader says, its
//     light on the sea for a moment, and its report through the page's sound switch. [appearance: the streak, the stars,
//     the glow, their seconds of real time, the sound]
//   - A ship whose lights the reader puts in sight of her bridge: those lights on the horizon on her true bearing.
//     [appearance: drawn 4 km off, whatever her real distance; which lights and their colours]
// It reads the model and the reader and feeds nothing back. The words are this file's; the numbers are the model's.
(function () {
  'use strict';
  const A = window.TitanicApp, NT = window.TitanicNight, WD = window.TitanicWorld, C = window.TitanicCore, THREE = window.THREE;
  if (!A || !NT || !WD || !C) return;
  const S = A.state, DEG = Math.PI / 180, NMm = 1852;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const miles = (nm) => (nm === null || nm === undefined ? '–' : (nm < 9.5 ? nm.toFixed(1) : Math.round(nm).toLocaleString('en-US')));
  const sideWords = (rel) => { const a = Math.abs(rel), s = rel < 0 ? 'port' : 'starboard'; if (a < 6) return 'right ahead'; if (a > 174) return 'right astern'; return a < 45 ? 'on the ' + s + ' bow' : (a < 135 ? 'on the ' + s + ' beam' : 'on the ' + s + ' quarter'); };

  // ------------------------------------------------------------------ the panel
  const sec = el('div', 'sec help'); sec.id = 'helpSec'; sec.hidden = true;
  const head = el('h3', null, 'Help: the wireless, the rockets, the other ships');
  const pSet = el('p', 'help-set'); pSet.id = 'helpSet';
  const ul = el('ul', 'help-ships'); ul.id = 'helpShips';
  const pRk = el('p', 'help-rockets'); pRk.id = 'helpRockets';
  const row = el('div', 'help-orders');
  const bCall = el('button', 'btn', 'Send the distress call'); bCall.id = 'bHelpCall';
  const bRocket = el('button', 'btn', 'Fire a rocket'); bRocket.id = 'bHelpRocket';
  const bLamp = el('button', 'btn', 'Work the Morse lamp'); bLamp.id = 'bHelpLamp';
  row.append(bCall, bRocket, bLamp);
  const ol = el('ol', 'help-lines'); ol.id = 'helpLines';
  const hint = el('p', 'hint help-hint');
  hint.textContent = 'With no order of yours the bridge does as it did in 1912: the call ordered 25 minutes after the touch and sent at 47, the rockets from 66. '
    + 'The rockets and the ships\' lights are drawn for the eye; their times, places and bearings are the model\'s.';
  sec.append(head, pSet, ul, pRk, row, ol, hint);
  const watchSec = document.getElementById('watchSec');
  if (watchSec && watchSec.parentNode) watchSec.parentNode.insertBefore(sec, watchSec.nextSibling);

  // the panel's words for a readout (also the test's: tools/help_site_test.js compares them with TitanicWorld.readouts)
  function setWords(r) {
    const s = r.set, calling = r.call.firstT !== null;
    if (!s.working) return 'Wireless: silent: ' + s.why + '.';
    return 'Wireless: ' + (calling ? 'calling, ' : 'listening, ') + s.why + '; reach about ' + miles(s.reach) + ' miles.';
  }
  function known(sh) { return sh.told || sh.inSight || sh.state === 'alongside'; }
  function shipWords(sh) {
    if (!sh.told) return 'A steamer\'s lights ' + sideWords(sh.rel) + ', about ' + miles(sh.nm) + ' miles' + (sh.state === 'alongside' ? ': alongside.' : (sh.state === 'coming' || sh.state === 'ice' ? ', coming up.' : '.'));
    if (sh.state === 'alongside') return sh.name + ': alongside since ' + A.clockOf(S.sim.night.tTouch + 60 * sh.alongsideT) + '.';
    if (sh.state === 'stopped') return sh.name + ': stopped by the ice, ' + miles(sh.nm) + ' miles off.';
    if (sh.state === 'heard') return sh.name + ': answered, ' + miles(sh.nm) + ' miles off; getting under way.';
    return sh.name + ': coming, ' + miles(sh.nm) + ' miles off' + (sh.eta ? '; expected at ' + sh.eta : '; the ice lies between') + '.';
  }
  function rocketWords(r) {
    const k = r.rockets;
    if (!k.fired && !k.pending) return 'Rockets: ' + k.left + ' socket signals in the locker aft.';
    return 'Rockets: ' + k.fired + ' fired, ' + k.left + ' left' + (k.pending ? '; ' + k.pending + ' to go up' + (k.fetchedT !== null && r.T < k.fetchedT ? ', the box on its way from aft' : '') : '') + '.';
  }
  let lastRender = 0, linesShown = -1, toastLine = 0;
  function render(force) {
    const sim = S.sim, on = !!(S.night && sim && sim.world);
    sec.hidden = !on; if (!on) return;
    const now = performance.now(); if (!force && now - lastRender < 250) return; lastRender = now;
    const r = WD.readouts(sim);
    pSet.textContent = setWords(r); pSet.dataset.working = String(r.set.working); pSet.dataset.reach = String(Math.round(r.set.reach)); pSet.dataset.supply = r.set.supply;
    pSet.className = 'help-set ' + (r.set.working ? 'ok' : 'crit');
    ul.textContent = '';
    for (const sh of r.ships) {
      if (!known(sh)) continue;
      const li = el('li', null, shipWords(sh)); li.dataset.ship = sh.id; li.dataset.state = sh.state;
      if (sh.etaT !== null) li.dataset.eta = sh.etaT.toFixed(2);
      ul.appendChild(li);
    }
    if (!ul.firstChild) ul.appendChild(el('li', 'help-none', r.call.firstT === null ? 'No call has gone out.' : 'No answer yet.'));
    pRk.textContent = rocketWords(r); pRk.dataset.left = String(r.rockets.left); pRk.dataset.fired = String(r.rockets.fired);
    const W = sim.world, done = A.gone(sim);
    bCall.disabled = done || r.call.firstT !== null || r.call.by === 'player';
    bRocket.disabled = done || r.rockets.left - r.rockets.pending <= 0;
    bLamp.disabled = done || (sim.plant ? sim.plant.lights <= 0 : false);
    if (W.lines.length !== linesShown) {
      linesShown = W.lines.length; ol.textContent = '';
      for (const l of W.lines.slice(-6)) { const li = el('li', 'hl-' + l.kind); const b = el('b', null, (A.clockOf(l.t) || '') + ' '); li.append(b, document.createTextNode(l.text)); ol.appendChild(li); }
      // the answers that matter as they come: a toast for each new line from another ship, a ship's lights in sight, or
      // the set falling silent
      for (let i = toastLine; i < W.lines.length; i++) { const l = W.lines[i]; if (l.kind === 'in' || l.kind === 'seen' || l.kind === 'set') { A.toast(l.text, l.kind !== 'in'); } }
      toastLine = W.lines.length;
    }
  }
  // an order from the panel, through the page's one way to give an order (TitanicApp.order): a hand on the bridge ends the
  // scripted orders, as the wheel and the doors do, and the order goes into the watch's log
  function give(type, value, what) {
    const sim = S.sim; if (!S.night || !sim || !sim.night || !sim.world || A.gone(sim)) return false;
    if (A.primeAudio) A.primeAudio();
    const done = A.order(type, value);
    if (!done) A.toast(what + ': not carried out');
    render(true);
    return done;
  }
  bCall.addEventListener('click', () => give('help:call', 'cqd', 'The distress call'));       // TitanicWorld.call's order
  bRocket.addEventListener('click', () => give('help:rocket', 'socket', 'A rocket'));         // TitanicWorld.rocket's
  bLamp.addEventListener('click', () => give('help:lamp', 'cqd', 'The Morse lamp'));          // TitanicWorld.lamp's

  // ------------------------------------------------------------------ what it draws
  const scene3 = !!(THREE && A.earth && A.renderer);
  const fx = { rockets: [], drawn: 0, lights: new Map(), F: {} };
  // the socket's place on the earth and its height above the sea, from her pose now
  function socketAt(sim) {
    const m = sim.mo, x = WD.ROCKETS.socketX, yS = 0.5 * C.G.B + 0.3, c = Math.cos(m.psi), s = Math.sin(m.psi);
    const F = C.poseFrame(sim, sim.zO, sim.pitch, sim.roll, fx.F), z = C.worldZ(F, x, -yS, C.deckZ('Boat', x) + 1.0);
    return { X: m.X + x * c - yS * s, Y: m.Y + x * s + yS * c, Z: Math.max(1, z) };
  }
  const BURST = WD.ROCKETS.burstFt * 0.3048, RISE = 2.4, STARS = 48, LIFE = 8;   // [appearance: seconds of real time]
  // a soft round spot (a radial gradient), for the stars, the rising head and the pool of light on the sea [appearance]
  let spot = null;
  function spotTexture() {
    if (spot) return spot;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    spot = new THREE.CanvasTexture(cv); return spot;
  }
  const points = (n, color, size) => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, sizeAttenuation: false, map: spotTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    p.frustumCulled = false; return p;
  };
  function spawnRocket(sim) {
    const p = socketAt(sim), E0 = A.E0, g = new THREE.Group();
    g.position.set(p.X - E0.x, 0, p.Y - E0.y);
    const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, p.Z, 0), new THREE.Vector3(0, p.Z, 0)]),
      new THREE.LineBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.9, depthWrite: false }));
    trail.frustumCulled = false;
    const head = points(1, 0xfff0d0, 9);          // the shell going up, a spark at the head of its tail (Boxhall's "luminous tail")
    const dirs = [];
    for (let i = 0; i < STARS; i++) {           // over a sphere on a golden spiral, at speeds from 0.55 to 1: a filled burst, no random numbers
      const yv = 1 - 2 * (i + 0.5) / STARS, rr = Math.sqrt(1 - yv * yv), th = i * 2.399963, k = 0.55 + 0.45 * ((i * 0.618034) % 1);
      dirs.push([k * rr * Math.cos(th), k * yv, k * rr * Math.sin(th)]);
    }
    const stars = points(STARS, 0xffffff, 7);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(450, 48), new THREE.MeshBasicMaterial({ color: 0xe6eeff, map: spotTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.4;
    const light = new THREE.PointLight(0xe9f0ff, 0, 2500);
    // drawn after the sea (a transparent plane at render order 1 in site/app.js), as the page's track and smoke are
    for (const o of [trail, head, stars, glow]) o.renderOrder = 3;
    g.add(trail, head, stars, glow, light);
    A.earth.add(g);
    fx.rockets.push({ g, trail, head, stars, glow, light, dirs, z0: p.Z, t0: performance.now() / 1000, banged: false });
  }
  function report() {                           // the socket signal's report: a short roar of noise and a thump [appearance]
    if (!A.soundOn || !A.soundOn()) return;
    const ac = A.audio(); if (!ac) return;
    try {
      const t0 = ac.currentTime + 0.02, n = Math.floor(ac.sampleRate * 1.6), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      let x = 0x9e3779b9;                         // a fixed noise pattern (xorshift), the same each time
      for (let i = 0; i < n; i++) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; d[i] = ((x >>> 0) / 4294967296 * 2 - 1); }
      const src = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; lp.type = 'lowpass'; lp.frequency.value = 420;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.55, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
      src.connect(lp); lp.connect(g); g.connect(ac.destination); src.start(t0); src.stop(t0 + 1.6);
      const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(38, t0 + 0.35);
      og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      o.connect(og); og.connect(ac.destination); o.start(t0); o.stop(t0 + 0.5);
      fx.reports = (fx.reports || 0) + 1;
    } catch (e) { /* no sound */ }
  }
  function frameRockets(now) {
    for (let i = fx.rockets.length - 1; i >= 0; i--) {
      const r = fx.rockets[i], a = now - r.t0;
      if (a > LIFE) { A.earth.remove(r.g); for (const o of [r.trail, r.head, r.stars, r.glow]) { o.geometry.dispose(); o.material.dispose(); } fx.rockets.splice(i, 1); continue; }
      const up = Math.min(1, a / RISE), top = r.z0 + (BURST - r.z0) * (1 - (1 - up) * (1 - up));
      const tp = r.trail.geometry.attributes.position;
      tp.setXYZ(0, 0, Math.max(r.z0, top - 60), 0); tp.setXYZ(1, 0, top, 0); tp.needsUpdate = true;   // a luminous tail (Boxhall) [appearance]
      r.trail.material.opacity = a < RISE ? 0.9 : Math.max(0, 0.9 - (a - RISE) * 2);
      r.head.geometry.attributes.position.setXYZ(0, 0, top, 0); r.head.geometry.attributes.position.needsUpdate = true;
      r.head.material.opacity = a < RISE ? 1 : 0;
      if (a >= RISE) {
        if (!r.banged) { r.banged = true; report(); }
        const b = a - RISE, spread = 40 * (1 - Math.exp(-b * 3)), fall = 2.5 * b * b, sp = r.stars.geometry.attributes.position;
        for (let k = 0; k < r.dirs.length; k++) { const d = r.dirs[k]; sp.setXYZ(k, d[0] * spread, BURST + d[1] * spread - fall, d[2] * spread); }
        sp.needsUpdate = true;
        r.stars.material.opacity = Math.max(0, 1 - b / (LIFE - RISE));
        const flash = Math.exp(-b / 1.4);
        r.glow.material.opacity = 0.55 * flash; r.light.position.set(0, BURST, 0); r.light.intensity = 2.2 * flash;
      }
    }
  }
  // another ship's lights: white masthead lights, and the side lights her aspect shows [appearance: drawn 2.5 km off and
  // spread so that the eye can tell them apart; her true distance is in the panel]
  const DRAW = 2500, LIFT = 6;
  function lightsFor(id) {
    let L = fx.lights.get(id); if (L) return L;
    const g = new THREE.Group(), mk = (color, size) => { const p = points(1, color, size); p.material.opacity = 1; p.renderOrder = 3; return p; };
    const mast = mk(0xfff6e0, 8), mast2 = mk(0xfff6e0, 7), red = mk(0xff4a3a, 7), green = mk(0x48f08a, 7);
    mast.position.set(0, LIFT + 16, -3); mast2.position.set(0, LIFT + 10, 3); red.position.set(0, LIFT, -9); green.position.set(0, LIFT, 9);
    g.add(mast, mast2, red, green); g.visible = false; A.earth.add(g);
    L = { g, red, green }; fx.lights.set(id, L); return L;
  }
  function frameLights(sim, r) {
    const m = sim.mo, E0 = A.E0;
    for (const sh of r.ships) {
      const vis = !!sh.inSight && sh.state !== 'alongside';
      let L = fx.lights.get(sh.id);
      if (!vis) { if (L) L.g.visible = false; continue; }
      L = lightsFor(sh.id);
      const b = sh.brg * DEG;
      L.g.position.set(m.X + DRAW * Math.cos(b) - E0.x, 0, m.Y + DRAW * Math.sin(b) - E0.y);
      L.g.rotation.y = -b;                       // her side lights across the line of sight
      const coming = sh.state === 'coming' || sh.state === 'ice';
      L.green.visible = coming; L.red.visible = true;   // bow-on she shows both; lying stopped, her red (as Stone saw a red light)
      L.g.visible = true; L.brg = sh.brg; L.nm = sh.nm;
    }
  }
  function clearFx() {
    for (const r of fx.rockets) A.earth.remove(r.g);
    fx.rockets.length = 0; fx.drawn = 0;
    for (const L of fx.lights.values()) L.g.visible = false;
  }

  // ------------------------------------------------------------------ hooks
  A.on('reset', () => { clearFx(); linesShown = -1; toastLine = 0; lastRender = 0; const sim = S.sim; if (sim && sim.world) { fx.drawn = sim.world.rockets.fired; toastLine = sim.world.lines.length; } render(true); });
  A.on('frame', (t) => {
    const sim = S.sim;
    render(false);
    if (!scene3 || !S.night || !sim || !sim.world) return;
    const now = performance.now() / 1000, R = sim.world.rockets;
    while (fx.drawn < R.fired) { fx.drawn++; spawnRocket(sim); }
    frameRockets(now);
    frameLights(sim, WD.readouts(sim));
  });

  // for the tests (tools/help_site_test.js) and for exploring
  A.help = {
    render: () => render(true), setWords, shipWords, rocketWords, known,
    rockets: () => ({ drawn: fx.drawn, live: fx.rockets.length, reports: fx.reports || 0 }),
    lights: () => [...fx.lights.entries()].map(([id, L]) => ({ id, visible: L.g.visible, brg: L.brg, nm: L.nm,
      // where it is drawn, as a true bearing from her: the earth group's local x is north, z east (site/app.js)
      drawnBrg: (() => { const m = S.sim.mo, dx = L.g.position.x + A.E0.x - m.X, dy = L.g.position.z + A.E0.y - m.Y; let b = Math.atan2(dy, dx) / DEG; return b < 0 ? b + 360 : b; })() })),
    lightsDraw: DRAW,
  };
})();
