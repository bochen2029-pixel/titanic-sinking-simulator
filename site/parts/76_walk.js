// The walk (W0): her decks walked while she sinks, on the core's own water. A part of the viewer (site/app.js, "parts"),
// the first stage of docs/BRAINSTORM_rooms_and_a_walk_through_her_v1_1_2026-11-20.md (section 6.0).
//   Walking   a view of its own ('walk', the button at the end of the display row, beside Lights): an eye 1.7 m over a deck, in her frame, so her
//             heave, trim and list carry it; down is the world's, so as she trims the deck becomes a hill and the sea
//             tilts. W, A, S and D walk, the arrows turn and walk, Q and E go down and up a deck, Shift runs, Esc
//             leaves; a drag looks about. On a phone, the pad's buttons do the same.
//   Walls     her side (C.halfBreadth at the deck); her watertight bulkheads (C.BULKHEADS) on every deck below the deck
//             their top reaches, with their doors on that deck open to the walker only while the model has them open
//             (sim.doorOpen). E deck runs over most of their tops, so it is open fore and aft. A deck is walkable where
//             it is under her top deck there (C.deckTopAt) and inside her ends (C.xAft, C.xFwd).
//   Water     the core's own: each of its 64 spaces at its own level (sim.level, sim.vol), the levels the X-ray look's
//             free surfaces draw. The walker's space is the core's space at its place (zone, side, below or above E
//             deck); the water at its feet is that space's level less the deck's height there, in the world. The core's
//             pockets (W6's bunker, G7's tank: water it keeps apart from sim.vol, counted in their spaces by
//             C.spaceWater) are drawn in their own places, never spread over their spaces. Both lie below G deck, so they
//             never stand at the walker's feet.
//   Pace      held at 1 while walking (TitanicApp.holdPace), and given back on leaving; at the founder flag the walk
//             ends (the fall is the deep's, site/parts/75_deep.js).
// The page's three conflicts (the brainstorm's 6.1): the walking keys are taken in the capture phase while walking, so A,
// S, D and the arrows never reach the Bridge's helm and telegraph; the button is a view button ([data-view]), so the
// director stands down when it is pressed; the walls are drawn in a group of this part's own, posed by her matrix each
// frame, not under her group, so the fall's copier never copies them.
// Stand-ins, marked where they are made: a deck is open floor from wall to wall (no rooms yet: those are the brainstorm's
// R4); a key takes the walker up or down a deck at the same place (no stairs yet); a bulkhead's doors stand where the
// model gives none (one on the centreline, two at a third of her half-breadth either side). Everything drawn is
// [appearance]: the lines, the colours, the water's look, the light (her own, or the walker's lamp once hers are out; in
// the Night look her decks, sides and bulkheads faintly lit: LIGHT), the pad.
(function () {
  'use strict';
  const A = window.TitanicApp, C = window.TitanicCore, THREE = window.THREE;
  if (!A || !C || !A.state || !A.views || !A.shipGroup || typeof A.setView !== 'function') return;
  const S = A.state;
  const gl = !!(THREE && A.renderer && A.scene && A.camera);
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f1 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // =================================================================== the numbers
  const WALK = { eye: 1.7, r: 0.4, walk: 1.4, run: 3.2, turn: 1.5, look: 0.004, doorHalf: 0.6, fov: 70, near: 0.1, hold: 5 };   // m, m/s, rad/s [appearance: the pace of a walker]
  const WADE = { slow: 0.6, least: 0.25 };          // [appearance] water to the knees slows a walker: 1 - 0.6 x depth (m), not below a quarter
  const DECKS = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'Boat'];   // the decks walked, keel up (the orlop is holds and machinery)
  const COL = { deck: 0x8fd3c9, above: 0x4a6b78, wall: 0xe0b15a, open: 0x6fdc8c, shut: 0xff6b6b, water: 0x2f7fb8, side: 0xb9c6cc };   // [appearance]
  // the light the walker sees by [appearance] (U0's look at guide 1.5: in the Night look the walk was very dark). While
  // the dynamos run (the plant: sim.plant.lights) her own lights: every line at its strength and, in the Night look, her
  // deck, the deck over it, her sides and the bulkheads faintly lit (fills: each one's opacity). With her lights out a lamp
  // in the walker's hand: full strength at the walker, falling off over `reach` m to `out` of it for the lines and
  // `fillOut` for the surfaces, so the dark stays dark and the walker still sees where it goes
  const LIGHT = { reach: 14, out: 0.3, fillOut: 0.05, fills: { deck: 0.2, above: 0.09, side: 0.11, wall: 0.24 } };
  const START = { deck: 'E', x: 0, y: 2 };          // a walk begins on E deck amidships, beside her centreline [appearance: where]
  const POCKETS = 4;                                // the sheets kept for the core's pockets (two today: the bunker, the tank)

  // =================================================================== her decks and walls, from the core
  const dz = (d, x) => C.deckZ(d, x);
  const deckIndex = (d) => DECKS.indexOf(d);
  function within(d, x) {                         // is deck d there at x: under her top deck, inside her ends
    const z = dz(d, x);
    return z <= C.deckTopAt(x) + 0.05 && x > C.xAft(z + 0.9) + WALK.r && x < C.xFwd(z + 0.9) - WALK.r;
  }
  const hbAt = (d, x) => Math.max(0, C.halfBreadth(x, dz(d, x) + 0.9, A.ship && A.ship.hull) - 0.05);   // her inside, a little above the deck (the model's hull, its ends: D4)
  // a door the core has at the sim's params: the core's own test (core.js, rebuildConnections). C4: params.g11Doors 0
  // leaves out the three doors the deck plans do not show (C.G11_NO_DOOR: F deck in E and G, G deck in N); 1 keeps
  // every door of BULKHEADS, as before. A core without them keeps them all
  const hasDoor = (b, dk, sim) => { const P = sim && sim.params; return !(P && !P.g11Doors && C.G11_NO_DOOR && C.G11_NO_DOOR[b.id] === dk); };
  // the bulkheads standing on deck d: those whose top is above it; each with the doors the core has on d (at the sim's
  // params: the page's own sim unless one is given), placed as the stand-in says
  function wallsOn(d, sim) {
    const out = [], of = sim || S.sim;
    C.BULKHEADS.forEach((b, i) => {
      if (!(dz(d, b.x) < dz(b.top, b.x) - 0.05)) return;
      const n = b.doors.filter(([dk]) => dk === d && hasDoor(b, dk, of)).reduce((s, [, k]) => s + k, 0), hb = hbAt(d, b.x);
      const ys = n === 1 ? [0] : (n >= 2 ? [hb / 3, -hb / 3] : []);   // [stand-in] where the model gives no place
      out.push({ i, id: b.id, x: b.x, doors: ys });
    });
    return out;
  }
  // the core's space at a place: its zone, its side (0 port, y > 0), below (0) or above (1) E deck
  function spaceOf(d, x, y) {
    const layer = dz(d, x) >= dz('E', x) - 0.05 ? 1 : 0;
    return { zone: C.zoneAt(x), side: y >= 0 ? 0 : 1, layer, n: C.nodeIndex(C.zoneAt(x), y >= 0 ? 0 : 1, layer) };
  }

  // =================================================================== the walker
  const st = { on: false, sim: null, deck: START.deck, x: START.x, y: START.y, yaw: 0, pitch: 0, keys: new Set(), pad: new Set(),
    depth: 0, under: false, dark: false, blocked: '', space: null, walls: [], wallsDeck: null, steps: 0 };
  function place(d, x, y) {                       // onto deck d at (x, y), inside its walls
    st.deck = d; st.x = x; st.y = clamp(y, -hbAt(d, x) + WALK.r, hbAt(d, x) - WALK.r); st.blocked = '';
    st.walls = wallsOn(d); st.wallsDeck = d; built.deck = null;
  }
  function doorOpenAt(w, y) {                     // an open door of wall w that the walker at y fits through
    if (!S.sim || !S.sim.doorOpen || !S.sim.doorOpen[w.i]) return false;
    return w.doors.some(dy => Math.abs(y - dy) <= WALK.doorHalf);
  }
  // a step of (dx, dy) in her frame: the deck's ends, her side, and the walls with their doors
  function stepBy(dx, dy) {
    const d = st.deck; let x = st.x + dx, y = st.y + dy;
    st.blocked = '';
    if (!within(d, x)) { x = st.x; st.blocked = 'the deck ends'; }
    const hb = hbAt(d, x);
    if (Math.abs(y) > hb - WALK.r) { y = Math.sign(y) * Math.max(0, hb - WALK.r); if (!st.blocked) st.blocked = 'her side'; }
    for (const w of st.walls) {
      const a = st.x - w.x, b = x - w.x;
      const crosses = (a > 0) !== (b > 0) || Math.abs(b) < WALK.r;
      if (!crosses || Math.abs(a) < WALK.r - 1e-9) continue;   // already in its doorway: let it through
      if (doorOpenAt(w, y)) continue;
      x = w.x + Math.sign(a) * WALK.r; st.blocked = 'bulkhead ' + w.id + (w.doors.length ? (S.sim.doorOpen[w.i] ? '' : ' (its doors shut)') : '');
    }
    st.x = x; st.y = y;
  }
  function deckBy(k) {                            // [stand-in] up (k = 1) or down (-1) a deck at the same place
    const i = deckIndex(st.deck) + k;
    if (i < 0 || i >= DECKS.length || !within(DECKS[i], st.x)) { A.toast(k > 0 ? 'No deck above here' : 'No deck below here'); return false; }
    place(DECKS[i], st.x, st.y);
    return true;
  }

  // =================================================================== the core's water where the walker stands
  function water(sim) {
    const sp = spaceOf(st.deck, st.x, st.y), F = C.frameOf(sim), z = dz(st.deck, st.x);
    const feet = C.worldZ(F, st.x, st.y, z), eye = C.worldZ(F, st.x, st.y, z + WALK.eye);
    const wet = sim.vol[sp.n] > 1e-3, L = wet ? sim.level[sp.n] : -1e9;
    st.space = sp; st.depth = wet ? Math.max(0, L - feet) : 0; st.under = wet && L > eye;
    st.level = wet ? L : null; st.feet = feet;
  }

  // =================================================================== drawing [appearance]
  const built = { deck: null, group: null, lines: null, fills: null, doors: [], water: null };
  const SX = (x, y, z) => [x, z, -y];             // her frame to the page's (site/app.js: three.js takes (x, z, -y))
  // the lamp's uniforms, one object each for every line and surface: the eye in the walk's group (her frame, three's
  // axes), the reach, and the floor of strength far off for the lines and for the surfaces
  const LU = gl ? { eye: { value: new THREE.Vector3() }, reach: { value: LIGHT.reach }, line: { value: 1 }, fill: { value: 1 } } : null;
  if (gl) {
    built.group = new THREE.Group(); built.group.matrixAutoUpdate = false; built.group.visible = false;
    built.group.name = 'walk'; A.scene.add(built.group);
    const wm = new THREE.MeshBasicMaterial({ color: COL.water, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array((32 + POCKETS) * 6 * 3), 3));
    built.water = new THREE.Mesh(wg, wm); built.water.frustumCulled = false; built.group.add(built.water);
  }
  const LIT_VS = 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const LIT_FS = 'uniform vec3 uColor; uniform float uOpacity; uniform vec3 uEye; uniform float uReach; uniform float uFloor; varying vec3 vP;\n' +
    'void main(){ float k = uFloor + (1.0 - uFloor) * exp(-distance(vP, uEye) / uReach); gl_FragColor = vec4(uColor, uOpacity * k); }';
  function litMat(color, op, floor) {             // a colour at an opacity, as strong as the light where it is (LIGHT)
    return new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: op }, uEye: LU.eye, uReach: LU.reach, uFloor: floor },
      vertexShader: LIT_VS, fragmentShader: LIT_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  }
  function lineMat(color, op) { return litMat(color, op === undefined ? 0.9 : op, LU.line); }
  function buildDeck() {                          // the deck walked, the deck above, its walls and their doors
    const g = built.group, d = st.deck;
    for (const list of [built.lines, built.fills]) if (list) for (const o of list) { g.remove(o); o.geometry.dispose(); o.material.dispose(); }
    for (const o of built.doors) { g.remove(o.line); o.line.geometry.dispose(); o.line.material.dispose(); }
    built.lines = []; built.fills = []; built.doors = [];
    const up = DECKS[deckIndex(d) + 1];
    const floor = [], above = [], walls = [];
    const fill = { deck: [], above: [], side: [], wall: [] };   // the surfaces, as triangles (her frame, three's axes)
    const quad = (list, a, b, c, e) => list.push(...a, ...b, ...c, ...a, ...c, ...e);
    // the floor drawn a little over the deck, the deck over it a little under: where the page draws a deck of its own
    // (her hull's top, A deck's plate) in a solid look, lines in its very plane lose to it and the walk goes dark
    // (found on B deck in the lamp's picture, 2026-11-21) [appearance]
    const dzF = (dk, x) => dz(dk, x) + 0.03, dzU = (dk, x) => dz(dk, x) - 0.03;
    // the deck's edge, both sides, and a line across it every 5 m, and its centreline [appearance: the grid]
    let x0 = Infinity, x1 = -Infinity;
    for (let x = -140; x <= 140; x += 1) if (within(d, x)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    if (x0 < x1) {
      for (let x = x0; x < x1; x += 1) {
        const a = hbAt(d, x), b = hbAt(d, x + 1), z0 = dzF(d, x), z1 = dzF(d, x + 1);
        floor.push(...SX(x, a, z0), ...SX(x + 1, b, z1), ...SX(x, -a, z0), ...SX(x + 1, -b, z1));
        quad(fill.deck, SX(x, -a, z0), SX(x, a, z0), SX(x + 1, b, z1), SX(x + 1, -b, z1));
        if (up && within(up, x) && within(up, x + 1)) {   // a deck over it: its lines; and in the Night look its underside and her side between them
          const za = dzU(up, x), zb = dzU(up, x + 1);
          above.push(...SX(x, a, za), ...SX(x + 1, b, zb), ...SX(x, -a, za), ...SX(x + 1, -b, zb));
          quad(fill.above, SX(x, -a, za), SX(x, a, za), SX(x + 1, b, zb), SX(x + 1, -b, zb));
          for (const s of [1, -1]) quad(fill.side, SX(x, s * a, z0), SX(x + 1, s * b, z1), SX(x + 1, s * b, zb), SX(x, s * a, za));
        }
      }
      for (let x = Math.ceil(x0 / 5) * 5; x <= x1; x += 5) { const a = hbAt(d, x), z = dzF(d, x); floor.push(...SX(x, a, z), ...SX(x, -a, z)); }
      floor.push(...SX(x0, 0, dzF(d, x0)), ...SX(x1, 0, dzF(d, x1)));
    }
    // the bulkheads standing on this deck: from the deck to the deck above, with their doorways left open in the drawing
    for (const w of st.walls) {
      const hb = hbAt(d, w.x), z0 = dzF(d, w.x), z1 = up ? dzU(up, w.x) : z0 + 2.6;
      const cuts = w.doors.map(dy => [dy - WALK.doorHalf, dy + WALK.doorHalf]).sort((p, q) => p[0] - q[0]);
      let y = -hb;
      for (const [a, b] of cuts.concat([[hb, hb]])) {
        if (a > y) {
          walls.push(...SX(w.x, y, z0), ...SX(w.x, a, z0), ...SX(w.x, y, z1), ...SX(w.x, a, z1), ...SX(w.x, y, z0), ...SX(w.x, y, z1), ...SX(w.x, a, z0), ...SX(w.x, a, z1));
          quad(fill.wall, SX(w.x, y, z0), SX(w.x, a, z0), SX(w.x, a, z1), SX(w.x, y, z1));
        }
        y = Math.max(y, b);
      }
      for (const dy of w.doors) {                 // each door's frame, coloured by whether the model has it open
        const p = [...SX(w.x, dy - WALK.doorHalf, z0), ...SX(w.x, dy - WALK.doorHalf, z0 + 2), ...SX(w.x, dy + WALK.doorHalf, z0), ...SX(w.x, dy + WALK.doorHalf, z0 + 2), ...SX(w.x, dy - WALK.doorHalf, z0 + 2), ...SX(w.x, dy + WALK.doorHalf, z0 + 2)];
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
        const line = new THREE.LineSegments(geo, lineMat(COL.open)); line.frustumCulled = false; line.renderOrder = 3; g.add(line);
        built.doors.push({ line, w });
      }
    }
    for (const [pts, col, op] of [[floor, COL.deck, 0.85], [above, COL.above, 0.5], [walls, COL.wall, 0.9]]) {
      if (!pts.length) continue;
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const line = new THREE.LineSegments(geo, lineMat(col, op)); line.frustumCulled = false; line.renderOrder = 3; g.add(line); built.lines.push(line);
    }
    // the surfaces, under the lines: drawn in the Night look only (the X-ray look shows her free surfaces through them)
    for (const [k, col] of [['deck', COL.deck], ['above', COL.above], ['side', COL.side], ['wall', COL.wall]]) {
      if (!fill[k].length) continue;
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(fill[k], 3));
      const m = new THREE.Mesh(geo, litMat(col, LIGHT.fills[k], LU.fill)); m.frustumCulled = false; m.renderOrder = 2; m.userData.fill = k; m.visible = false; g.add(m); built.fills.push(m);
    }
    built.deck = d;
  }
  // the core's water in the spaces of the walker's layer: a level sheet in each, the world's level seen in her frame
  function drawWater(sim) {
    const pos = built.water.geometry.attributes.position, a = pos.array, F = C.frameOf(sim), ship = sim.ship;
    const layer = st.space ? st.space.layer : 0, d = st.deck;   // the spaces of the walker's layer, below or above E deck
    let i = 0;
    const zAt = (L, x, y) => (L - F.R20 * x - F.R21 * y - F.tz) / F.R22;   // her frame's z where the world's level L is
    for (let k = 0; k < 16; k++) {
      const Z = ship.zones[k], xa = Z.xa, xf = Z.xf;
      for (let side = 0; side < 2; side++) {
        const n = C.nodeIndex(k, side, layer), wet = sim.vol[n] > 1e-3;
        const s = side === 0 ? 1 : -1, hb = Math.max(hbAt(d, xa), hbAt(d, xf), hbAt(d, (xa + xf) / 2));
        const q = wet ? [[xa, 0], [xf, 0], [xf, s * hb], [xa, s * hb]].map(([x, y]) => SX(x, y, zAt(sim.level[n], x, y))) : null;
        const tri = q ? [q[0], q[1], q[2], q[0], q[2], q[3]] : null;
        for (let v = 0; v < 6; v++) { const p = tri ? tri[v] : [0, -1e4, 0]; a[i++] = p[0]; a[i++] = p[1]; a[i++] = p[2]; }
      }
    }
    // Each pocket's own water, in its own place: over its footprint (one side of her, or both), with the spaces below E
    // deck. While it fills, its level follows the core's own law for it (pocketHead's: from its floor up in proportion to
    // vol / cap, the world's level through its middle), held inside its box. Once full, it is at its top, never above
    // it: its over-fill stands for the sea's head over its top and has no place. A pocket that has given way has put its
    // water into its space [a mirror of core/core.js's pocketHead, drawn only]
    built.pk = [];
    const pks = layer === 0 && sim.pockets ? sim.pockets : [];
    for (let j = 0; j < POCKETS; j++) {
      const k = pks[j];
      let tri = null;
      if (k && k.state === 0 && k.vol > 1e-3 && k.cap > 0) {
        const frac = Math.min(1, k.vol / k.cap), full = frac >= 1, zf = k.z0 + (k.z1 - k.z0) * frac, L = C.worldZ(F, k.xc, k.yc, zf);
        const top = (x) => (k.deck ? C.deckZ(k.deck, x) : k.z1);   // its top: G7's tank's is the orlop's flat
        const zOf = (x, y) => (full ? top(x) : clamp(zAt(L, x, y), k.z0, top(x)));
        const hb = (x) => Math.max(0, C.halfBreadth(x, zf, A.ship && A.ship.hull) - 0.05);
        const ys = (x) => (k.side < 0 ? [-hb(x), hb(x)] : (k.side === 1 ? [-hb(x), 0] : [0, hb(x)]));   // side 1: starboard, y < 0
        const [a0, b0] = ys(k.x0), [a1, b1] = ys(k.x1);
        const q = [[k.x0, a0], [k.x1, a1], [k.x1, b1], [k.x0, b0]].map(([x, y]) => SX(x, y, zOf(x, y)));
        tri = [q[0], q[1], q[2], q[0], q[2], q[3]];
        built.pk.push({ name: k.name, j, x0: k.x0, x1: k.x1, side: k.side, frac, full, z: zOf(0.5 * (k.x0 + k.x1), k.yc), level: full ? null : L });
      }
      for (let v = 0; v < 6; v++) { const p = tri ? tri[v] : [0, -1e4, 0]; a[i++] = p[0]; a[i++] = p[1]; a[i++] = p[2]; }
    }
    pos.needsUpdate = true;
    built.water.visible = !S.xray;                // the X-ray look draws the same water itself (its free surfaces)
  }
  function draw(sim) {
    if (!gl) return;
    if (built.deck !== st.deck) buildDeck();
    A.shipGroup.updateMatrixWorld(); built.group.matrix.copy(A.shipGroup.matrixWorld); built.group.matrixWorldNeedsUpdate = true;
    for (const o of built.doors) o.line.material.uniforms.uColor.value.setHex(sim.doorOpen && sim.doorOpen[o.w.i] ? COL.open : COL.shut);
    // the light (LIGHT): her own while the dynamos run; else the walker's lamp at the eye
    LU.eye.value.fromArray(SX(st.x, st.y, dz(st.deck, st.x) + WALK.eye));
    LU.line.value = st.dark ? LIGHT.out : 1; LU.fill.value = st.dark ? LIGHT.fillOut : 1;
    const night = !!(A.nightScene && A.nightScene.on);
    for (const m of built.fills) m.visible = night;
    drawWater(sim);
  }

  // =================================================================== the pad, the notes [appearance]
  const stage = $('stage');
  const pad = el('div', 'walk-pad'); pad.hidden = true; pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', 'Walking');
  const where = el('div', 'walk-where'); pad.appendChild(where);
  const btns = el('div', 'walk-btns'); pad.appendChild(btns);
  const PAD = [['fwd', '▲', 'Walk forward'], ['left', '◀', 'Turn left'], ['back', '▼', 'Walk back'], ['right', '▶', 'Turn right'],
    ['down', 'Down a deck', 'Down a deck'], ['up', 'Up a deck', 'Up a deck'], ['leave', 'Leave', 'Leave the walk']];
  const padBtn = {};
  for (const [id, label, title] of PAD) {
    const b = el('button', 'walk-b walk-' + id, label); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.dataset.walk = id;
    btns.appendChild(b); padBtn[id] = b;
  }
  const veil = el('div', 'walk-veil'); veil.hidden = true;   // under water [appearance]
  // the veil over the whole stage (a modal layer: the eye under the water); the pad in the stage's aside (C-4), first,
  // above the director's caption: at the right above the Bridge or the damage diagram, the whole width on a phone
  if (stage) stage.appendChild(veil);
  if (!(A.slot && A.slot('aside', pad, { order: 1 })) && stage) stage.appendChild(pad);
  // held buttons walk and turn while held; the others act once
  const holdOf = { fwd: 'fwd', back: 'back', left: 'left', right: 'right' };
  btns.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-walk]'); if (!b) return; e.preventDefault();
    const id = b.dataset.walk;
    if (holdOf[id]) { st.pad.add(holdOf[id]); try { b.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } }
    else if (id === 'up') deckBy(1); else if (id === 'down') deckBy(-1); else if (id === 'leave') leave(true);
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btns.addEventListener(ev, (e) => { const b = e.target.closest('[data-walk]'); if (b && holdOf[b.dataset.walk]) st.pad.delete(holdOf[b.dataset.walk]); });
  function sayWhere() {
    const sp = st.space, k = sp ? sp.zone : C.zoneAt(st.x);
    const parts = [st.deck === 'Boat' ? 'Boat deck' : st.deck + ' deck', 'compartment ' + (k + 1) + ' of 16, ' + (st.y >= 0 ? 'port' : 'starboard')];
    parts.push(st.under ? 'under water' : (st.depth > 0.005 ? 'water ' + f1(st.depth) + ' m deep' : 'dry'));
    if (st.dark) parts.push('her lights are out');
    if (st.blocked) parts.push('stopped: ' + st.blocked);
    const t = parts.join(' · ');
    if (where.textContent !== t) where.textContent = t;
  }

  // =================================================================== the view, the keys, the drag
  // its near plane the walker's own (WALK.near): the page sets a view's near every frame (VIEWS: near; QC C-9 found the walk's
  // own setting undone by the page's each frame)
  A.views.walk = Object.assign({}, A.views.quarter, { look: true, fov: WALK.fov, keep: false, near: WALK.near });
  const eyeV = gl ? new THREE.Vector3() : null, dirV = gl ? new THREE.Vector3() : null, tmpV = gl ? new THREE.Vector3() : null;
  A.on('camera', (view) => {
    if (view !== 'walk' || !st.on || !gl) return false;
    const z = dz(st.deck, st.x) + WALK.eye, cam = A.camera;
    A.shipGroup.updateMatrixWorld();
    eyeV.fromArray(SX(st.x, st.y, z)).applyMatrix4(A.shipGroup.matrixWorld);
    dirV.fromArray(SX(Math.cos(st.yaw), Math.sin(st.yaw), 0)).transformDirection(A.shipGroup.matrixWorld);
    dirV.y = 0; if (dirV.lengthSq() < 1e-9) dirV.set(1, 0, 0); dirV.normalize();   // down is the world's: her heading, levelled
    const cp = Math.cos(st.pitch); dirV.multiplyScalar(cp); dirV.y = Math.sin(st.pitch);
    cam.up.set(0, 1, 0); cam.position.copy(eyeV); cam.lookAt(tmpV.copy(eyeV).add(dirV));
    return true;
  });
  const KEYS = { w: 'fwd', arrowup: 'fwd', s: 'back', arrowdown: 'back', a: 'strafeL', d: 'strafeR', arrowleft: 'left', arrowright: 'right', shift: 'run' };
  const walking = () => st.on && S.view === 'walk';
  // taken in the capture phase, before the page's own keys (the Bridge's helm and telegraph): walking gives no order
  window.addEventListener('keydown', (e) => {
    if (!walking()) return;
    const tag = (e.target && e.target.tagName) || '';
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
    const k = e.key.toLowerCase();
    if (KEYS[k]) st.keys.add(KEYS[k]);
    else if (k === 'q' || k === 'pagedown') { if (!e.repeat) deckBy(-1); }
    else if (k === 'e' || k === 'pageup') { if (!e.repeat) deckBy(1); }
    else if (k === 'escape') leave(true);
    else return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  window.addEventListener('keyup', (e) => {
    if (!st.on) return;
    const k = e.key.toLowerCase();
    if (KEYS[k]) { st.keys.delete(KEYS[k]); if (walking()) { e.preventDefault(); e.stopPropagation(); } }
  }, true);
  window.addEventListener('blur', () => { st.keys.clear(); st.pad.clear(); });
  const canvas = A.renderer ? A.renderer.domElement : null, ptr = new Map();
  if (canvas) {
    canvas.addEventListener('pointerdown', (e) => { if (walking()) ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    canvas.addEventListener('pointermove', (e) => {
      const p = ptr.get(e.pointerId); if (!p || !walking()) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      st.yaw -= dx * WALK.look; st.pitch = clamp(st.pitch - dy * WALK.look, -1.2, 1.2);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) canvas.addEventListener(ev, (e) => ptr.delete(e.pointerId));
  }

  // =================================================================== entering and leaving
  function enter(o) {
    if (!S.sim || A.gone(S.sim)) { A.toast('She has gone: there is no deck to walk'); return false; }
    o = o || {};
    const fresh = st.sim !== S.sim || o.deck !== undefined;
    st.on = true; st.sim = S.sim; st.keys.clear(); st.pad.clear();
    if (fresh) { st.yaw = o.yaw || 0; st.pitch = clamp(o.pitch || 0, -1.2, 1.2); place(o.deck || START.deck, o.x === undefined ? START.x : o.x, o.y === undefined ? START.y : o.y); }
    A.setView('walk');
    A.holdPace(WALK.hold, 'walk');                 // its own hold (C-4 step 3, QC C-7)
    pad.hidden = false; if (built.group) built.group.visible = true; if (stage) stage.classList.add('walk-on');
    bWalk.setAttribute('aria-pressed', 'true');
    // RC2 (the first ten minutes played cold): a phone has no keyboard, so there the notice names the pad's own buttons
    // (it gave the keys W A S D and Esc on a touch screen); a desktop keeps the keys, the pad beside them
    const touch = (A.device && A.device() === 'phone') || !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    A.toast('Walking her ' + (st.deck === 'Boat' ? 'Boat deck' : st.deck + ' deck') + ' at her own pace. ' + (touch
      ? 'Hold the arrows below to walk and turn; "Up a deck" and "Down a deck" climb, "Leave" leaves; drag to look about'
      : 'W A S D walk, the arrows turn, Q and E go down and up a deck, Shift runs, Esc leaves; drag to look about'));
    return true;
  }
  function leave(toQuarter) {
    if (!st.on) return;
    st.on = false; st.keys.clear(); st.pad.clear();
    A.holdPace(0, 'walk');
    pad.hidden = true; veil.hidden = true; if (built.group) built.group.visible = false; if (stage) stage.classList.remove('walk-on');
    bWalk.setAttribute('aria-pressed', 'false');
    if (toQuarter && S.view === 'walk') A.setView('quarter');
  }
  // the button, at the end of the display row (beside Lights), not in the row of views: that row is the bar's widest, and
  // a button there narrowed the readouts beside it (joint gate 4's boats_site: at 1400 x 860 their figures broke into two
  // rows). It is still a view button ([data-view]): pressing it stands the director down
  const anchor = document.getElementById('bLights') || document.querySelector('[data-view="boat"]') || document.querySelector('[data-view="bridge"]');
  const bWalk = el('button', null, 'Walk'); bWalk.type = 'button'; bWalk.dataset.view = 'walk'; bWalk.setAttribute('aria-pressed', 'false');
  bWalk.title = 'Walk her decks while she sinks, on the model\'s own water';
  if (!(A.addButton && A.addButton('display', bWalk, { after: '#bLights' })) && anchor) anchor.insertAdjacentElement('afterend', bWalk);   // C-4: the bar's
  bWalk.addEventListener('click', () => { if (walking()) leave(true); else enter(); });

  // =================================================================== each frame
  A.on('frame', (t, dt) => {
    if (!st.on) return;
    const sim = S.sim;
    if (S.view !== 'walk' || !sim || sim !== st.sim || A.gone(sim)) { const ended = A.gone(sim); leave(ended); if (ended) A.toast((A.broke(sim) ? 'She broke' : 'She has foundered') + ': the walk ends'); return; }
    A.holdPace(WALK.hold, 'walk');                // her own pace while walking, renewed every frame
    const h = Math.min(0.1, Math.max(0, dt || 0)), K = st.keys, P = st.pad;
    const turn = ((K.has('left') || P.has('left')) ? 1 : 0) - ((K.has('right') || P.has('right')) ? 1 : 0);
    st.yaw += turn * WALK.turn * h;
    const fwd = ((K.has('fwd') || P.has('fwd')) ? 1 : 0) - ((K.has('back') || P.has('back')) ? 1 : 0);
    const side = (K.has('strafeL') ? 1 : 0) - (K.has('strafeR') ? 1 : 0);
    if (fwd || side) {
      const v = (K.has('run') ? WALK.run : WALK.walk) * clamp(1 - WADE.slow * st.depth, WADE.least, 1) * h;
      const c = Math.cos(st.yaw), s = Math.sin(st.yaw), n = Math.hypot(fwd, side) || 1;
      stepBy(v * (fwd * c - side * s) / n, v * (fwd * s + side * c) / n);
      st.steps++;
    }
    st.dark = !!(sim.plant && sim.plant.lights === 0);
    water(sim);
    veil.hidden = !st.under;
    draw(sim);
    sayWhere();
  });
  A.on('reset', () => { if (st.on) leave(false); st.sim = null; });

  // for the tests (tools/walk_site_test.js) and for exploring: read-only in spirit
  A.walk = {
    on: () => st.on, enter, leave: () => leave(true), WALK, DECKS,
    state: () => ({ on: st.on, deck: st.deck, x: st.x, y: st.y, yaw: st.yaw, pitch: st.pitch, depth: st.depth, under: st.under, dark: st.dark,
      blocked: st.blocked, level: st.level === undefined ? null : st.level, feet: st.feet === undefined ? null : st.feet,
      space: st.space ? Object.assign({}, st.space) : null, walls: st.walls.map(w => ({ id: w.id, x: w.x, doors: w.doors.slice() })), where: where.textContent }),
    within, hbAt, wallsOn, spaceOf,
    // the core's pockets as last drawn (with the spaces below E deck): each one's place, how full, its sheet's height in
    // her frame at its middle, its world level while it fills
    pockets: () => (built.pk || []).map(p => Object.assign({}, p)),
    // the light the walker sees by (LIGHT): the Night look's surfaces drawn, the lines' and surfaces' strength far off
    // (1 with her lights; with them out, the lamp's floor), the lamp's reach, the eye it is at
    light: () => ({ night: !!(A.nightScene && A.nightScene.on), fills: (built.fills || []).filter(m => m.visible).map(m => m.userData.fill), line: LU ? LU.line.value : null,
      fill: LU ? LU.fill.value : null, reach: LU ? LU.reach.value : null, eye: LU ? LU.eye.value.toArray() : null, LIGHT }),
  };
})();
