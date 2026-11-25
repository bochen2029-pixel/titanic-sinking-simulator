// The stern gear, the wake and the lights, in a real browser (headless Edge or Chrome), with nothing beyond Node.
//   node tools/visuals_site_test.js [dist] [screenshot dir]
// Checks that what is drawn follows the model: each screw at the revolutions its shaft has turned and turning the
// right way, the rudder at the model's angle, the wake's arms at Kelvin's angle from her own path, the lights by the
// 1910 rules from sixteen bearings, and nothing of her own lights from her bridge; the core's pockets drawn where each
// stands (its free surface, its box among the columns, its fill on the damage diagram: G7); her ports dark once their
// sections' fuses blow, a lit port under the sea drawn dimmer (D97: G1's circuits), and her smoke as her fires raise
// steam (NH15 F7).
'use strict';
const path = require('path');
const B = require('./cdp');
const LR = require('./lights_record.js');           // her lights against the record: the window in one place (D90 (a))
const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
const rows = []; let fails = 0;
function row(what, value, ref, ok) { rows.push([what, value, ref, ok]); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + what.padEnd(88) + ' ' + String(value).padEnd(50) + ' ' + ref); }
const shot = (b, name) => shots ? b.shot(path.join(shots, name)) : null;

(async () => {
  const b = await B.launch({ dist });
  try {
    // ---- 1. the 1912 watch: the gear is there and turns with the shafts
    await b.open('#night=1912');
    await b.ev('TitanicApp.state.warp = 4');
    const parts = await b.ev(`(() => { const s = TitanicApp.stern; return { screws: s.screws.length, bossings: s.bossings.length, shafts: s.shafts.length, rudder: !!s.rudder }; })()`);
    row('the stern gear is drawn: three screws, the rudder, two bossings, three shafts', JSON.stringify(parts), '3, true, 2, 3', parts.screws === 3 && parts.rudder && parts.bossings === 2 && parts.shafts === 3);
    await b.waitFor('TitanicApp.state.sim.t >= 12', 60000, '12 s of the watch');
    const turn = await b.ev(`(() => {
      const A = TitanicApp, m = A.state.sim.mo, t = A.state.sim.t, rev = A.state.screwRev.slice(), n = [m.nP, m.nC, m.nS];
      const expect = n.map(x => x / 60 * t);
      // the water at the top of each disc, turned a little the way the shaft turns, through the screw's own transform
      // (the spin about x, then the holder, which mirrors the port screw): which way does it go, port or starboard?
      const dir = A.stern.screws.map((s, k) => {
        s.holder.updateMatrixWorld(true);
        const at = (eps) => new THREE.Vector3(0, s.geo.R, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), eps).applyMatrix4(s.holder.matrixWorld);
        return at(0.05 * Math.sign(n[k])).z - at(0).z;        // three's z is to starboard (the ship lies along x)
      });
      return { rev, expect, dir, n };
    })()`);
    const errRev = Math.max(...turn.rev.map((r, k) => Math.abs(r / turn.expect[k] - 1)));
    row('each screw has turned the revolutions of its shaft (steady at Full ahead, 12 s)', turn.rev.map(r => r.toFixed(2)).join(' / ') + ' rev', turn.expect.map(r => r.toFixed(2)).join(' / ') + ' (rpm x time), within 1 %', errRev < 0.01);
    row('going ahead the wing screws turn outward: the top of the port screw to port, the starboard to starboard', 'port ' + (turn.dir[0] < 0 ? 'to port' : 'to STARBOARD') + ', starboard ' + (turn.dir[2] > 0 ? 'to starboard' : 'to PORT'), 'outward turning (Halpern)', turn.dir[0] < 0 && turn.dir[2] > 0);
    // ---- 2. the arms of the wake at Kelvin's angle, measured on what the page drew, before the bells (a straight course)
    const kel = await b.ev(`(() => {
      const A = TitanicApp, w = A.wake.buf, V = TitanicVisuals, tNow = w.t[w.n - 1], arms = V.kelvinArms(w, tNow);   // at the last sample's time, where her bow is known
      const bow = V.pointAt(w, w.n - 1, V.WAKE.xBow), psi = w.psi[w.n - 1], d = [Math.cos(psi), Math.sin(psi)], ds = [-d[1], d[0]];
      let worst = 0, n = 0;
      for (const side of ['port', 'stbd']) for (const p of arms[side]) { const rx = p[0] - bow[0], ry = p[1] - bow[1], along = -(rx * d[0] + ry * d[1]), across = Math.abs(rx * ds[0] + ry * ds[1]); if (along < 60) continue; n++; worst = Math.max(worst, Math.abs(Math.atan2(across, along) * 180 / Math.PI - 19.4712)); }
      return { worst, n, ribbon: A.wake.ribbon.geometry.drawRange.count, samples: w.n };
    })()`);
    row('the wake\'s arms in the page, 60 m or more astern of her bow, at Kelvin\'s angle', kel.n + ' points, within ' + kel.worst.toFixed(3) + ' deg of 19.4712', 'arcsin(1/3) (abacus1:0e75f91371c0), within 0.5', kel.n >= 10 && kel.worst < 0.5);
    row('the white ribbon is laid from her stern as she goes', kel.samples + ' samples, ' + kel.ribbon / 12 + ' quads', 'a quad between each pair of samples', kel.samples > 20 && kel.ribbon === (kel.samples - 1) * 12);
    if (shots) { await b.ev("(() => { const c = TitanicApp.ctl; TitanicApp.setView('stern'); })()"); await B.sleep(2200); await shot(b, 'v3-screws.png'); await b.ev("TitanicApp.setView('astern')"); }
    // ---- 3. the rudder: hard to starboard from the Bridge, a real click; the blade at the model's angle, its trailing edge to starboard
    await b.waitFor('TitanicApp.state.sim.night.tBells >= 0', 60000, 'the bells');
    await b.click('bHardStbd');
    await b.waitFor('Math.abs(TitanicApp.state.sim.mo.del - 40 * Math.PI / 180) < 1e-9', 30000, 'the rudder hard over');
    const rud = await b.ev(`(() => { const A = TitanicApp, r = A.stern.rudder, m = A.state.sim.mo; r.updateMatrixWorld(true);
      const te = new THREE.Vector3(-3.5, 5, 0).applyMatrix4(r.matrixWorld), stock = new THREE.Vector3(0, 5, 0).applyMatrix4(r.matrixWorld);
      return { rot: r.rotation.y, del: m.del, teStbd: te.z - stock.z, order: m.delCmd }; })()`);
    row('hard to starboard: the drawn rudder at the model\'s angle, its trailing edge to starboard', (rud.rot * 180 / Math.PI).toFixed(3) + ' deg; edge ' + rud.teStbd.toFixed(2) + ' m to starboard', 'the model\'s ' + (rud.del * 180 / Math.PI).toFixed(3) + ' deg, exactly; edge to starboard', rud.rot === rud.del && rud.teStbd > 2);
    const ind = await b.ev(`(() => { const a = document.getElementById('helmActual'), o = document.getElementById('helmOrder'); return { ax: +a.getAttribute('x2'), ox: +o.getAttribute('x2') }; })()`);
    row('the rudder indicator on the Bridge shows the order and the rudder to starboard', 'order x ' + ind.ox.toFixed(1) + ', rudder x ' + ind.ax.toFixed(1), 'both needles right of centre', ind.ox > 20 && ind.ax > 20);
    // ---- 4. full astern: the wing screws slow, stop and turn the other way; their revolutions run back
    await b.click('bHardStbd');
    const tel = await b.ev(`(() => { const t = document.querySelector('#telegraph [data-order="full astern"]'); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    const gongs0 = await b.ev('TitanicApp.state.gongs');
    for (const type of ['mousePressed', 'mouseReleased']) await b.page.send('Input.dispatchMouseEvent', { type, x: tel.x, y: tel.y, button: 'left', clickCount: 1 });
    await B.sleep(400);
    const gongs1 = await b.ev('TitanicApp.state.gongs');
    row('the telegraph\'s gong on the engine order (V7)', (gongs1 - gongs0) + ' gong', '1 for 1 order', gongs1 - gongs0 === 1);
    // the wash: watched for the rest of the stop; its front must run forward of the wing screws
    await b.ev(`(() => { window.__washMax = 0; window.__washIv = setInterval(() => { const f = TitanicApp.washFx.front; window.__washMax = Math.max(window.__washMax, f[0], f[1]); }, 100); })()`);
    await b.waitFor('TitanicApp.state.sim.mo.nP < -20', 120000, 'the wing engines astern');
    const r0 = await b.ev('TitanicApp.state.screwRev.slice()'); await B.sleep(1500); const r1 = await b.ev('TitanicApp.state.screwRev.slice()');
    const ast = await b.ev(`(() => { const m = TitanicApp.state.sim.mo; return { nP: m.nP, nC: m.nC, nS: m.nS, turbine: m.turbine }; })()`);
    row('Full astern: the wing screws turn backwards, the centre screw is cut out', 'port ' + (r1[0] - r0[0]).toFixed(2) + ' rev, starboard ' + (r1[2] - r0[2]).toFixed(2) + ' rev in 1.5 s; turbine ' + (ast.turbine ? 'IN' : 'out') + ', centre ' + ast.nC.toFixed(0) + ' rpm', 'wing revolutions falling; turbine out (Wilding)', r1[0] < r0[0] && r1[2] < r0[2] && !ast.turbine);
    await b.waitFor('TitanicApp.state.sim.night.tClear >= 0', 180000, 'the end of the encounter');
    await b.ev('TitanicApp.state.speed = 10');
    await b.waitFor('TitanicApp.state.sim.mo.u < 1.0', 120000, 'her way nearly off');
    await B.sleep(1500);
    const washMax = await b.ev('(() => { clearInterval(window.__washIv); return window.__washMax; })()');
    row('Full astern: the wash creeps forward along her sides from the wing screws (V4)', 'up to ' + washMax.toFixed(0) + ' m ahead of them', 'forward of the screws; towards amidships (119.8 m) as she loses her way', washMax > 30);
    // ---- the engines and the turbine (V5): drawn at the shafts' own angles, paused so nothing moves between reads
    const eng = await b.ev(`(() => {
      const A = TitanicApp, S = A.state; S.playing = false; A.setView('quarter');
      return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
        const V = TitanicVisuals, E = V.ENGINE, set = A.engines.sets[1], th = (S.screwRev[2] - Math.floor(S.screwRev[2])) * 2 * Math.PI;
        let worst = 0;
        set.parts.forEach((p, k) => { const a = th + E.cranks[k] * Math.PI / 180; worst = Math.max(worst, Math.abs(p.web.rotation.x - a), Math.abs(p.piston.position.y - (E.zShaft + V.pistonLift(a) + E.pistonRod))); });
        // the port set turns the other way and is the starboard's mirror image (V8): its crank offsets negated
        const thp = (S.screwRev[0] - Math.floor(S.screwRev[0])) * 2 * Math.PI;
        let portSense = 0;
        A.engines.sets[0].parts.forEach((p, k) => { const a = -thp - E.cranks[k] * Math.PI / 180; portSense = Math.max(portSense, Math.abs(p.web.rotation.x - a), Math.abs(p.piston.position.y - (E.zShaft + V.pistonLift(a) + E.pistonRod))); });
        const thc = (S.screwRev[1] - Math.floor(S.screwRev[1])) * 2 * Math.PI;
        S.playing = true;
        res({ pistons: A.engines.sets.reduce((n, s) => n + s.parts.length, 0), worst, portSense, turbine: Math.abs(A.engines.rotor.rotation.x - thc), visible: A.engines.g.visible });
      })));
    })()`);
    row('the engines: eight pistons at their cranks\' angles, the starboard set with its shaft, the port set its mirror image (V5, V8)', eng.pistons + ' pistons; worst ' + eng.worst.toExponential(1) + '; port ' + eng.portSense.toExponential(1) + '; turbine ' + eng.turbine.toExponential(1), 'all at the shafts\' angles, to 1e-9', eng.pistons === 8 && eng.worst < 1e-9 && eng.portSense < 1e-9 && eng.turbine < 1e-9 && eng.visible);
    const snd = await b.ev(`(() => ({ beats: TitanicApp.state.beats, rev: Math.floor(TitanicApp.state.screwRev[2]), smoke: TitanicApp.smoke.count() }))()`);
    row('the engines\' beat once a revolution, and funnel smoke laid behind her (V7)', snd.beats + ' beats for ' + snd.rev + ' revolutions (and back); ' + snd.smoke + ' puffs', 'a beat for every revolution crossed; smoke from three funnels', snd.beats >= Math.abs(snd.rev) && snd.smoke > 100);
    // ---- 5. a screw too fast to draw honestly becomes a disc
    await b.ev("TitanicApp.state.speed = 240; TitanicApp.state.sim.mo.setP = TitanicApp.state.sim.mo.setS = 75;");
    await b.waitFor('TitanicApp.state.sim.mo.nP > 40', 120000, 'the engines ahead again');
    await B.sleep(600);
    const disc = await b.ev(`(() => { const s = TitanicApp.stern.screws; return s.map(x => ({ fade: x.fade, disc: x.disc.visible })); })()`);
    row('at 240x the wing screws turn hundreds of degrees a frame: their blades fade into discs', JSON.stringify(disc.map(d => d.fade.toFixed(2) + (d.disc ? '/disc' : ''))), 'wing screws faded, discs shown', disc[0].fade < 0.5 && disc[0].disc && disc[2].fade < 0.5 && disc[2].disc);
    await b.ev('TitanicApp.state.speed = 1');
    // ---- 6. the lights from sixteen bearings, 2 km off, and from her own bridge
    const bearings = [];
    for (let k = 0; k < 16; k++) bearings.push(-180 + 11.25 + 22.5 * k);
    const seen = await b.ev(`(async () => {
      const A = TitanicApp, c = A.ctl, S = A.state; S.follow = false; A.setView('quarter'); c.goal = null; c.r = 2000; c.phi = Math.PI / 2 - 0.02; c.target.set(0, 8, 0);
      const out = [];
      for (const b of ${JSON.stringify(bearings)}) {
        c.theta = (90 - b) * Math.PI / 180;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        out.push([b, A.navLights.filter(o => o.factor > 0.5).map(o => o.L.id).sort().join(',')]);
      }
      return out;
    })()`);
    const rule = (b) => { const a = Math.abs(b), s = []; if (a < 112.5) s.push('masthead'); if (b >= 0 && b < 112.5) s.push('starboard'); if (b <= 0 && b > -112.5) s.push('port'); if (a > 112.5) s.push('stern'); return s.sort().join(','); };
    const wrong = seen.filter(([b, s]) => s !== rule(b));
    row('the lights from sixteen bearings round her, 2 km off', wrong.length ? JSON.stringify(wrong) : 'all 16 as the 1910 rules', 'masthead 20 points; red and green 10 points each; stern 12 points', wrong.length === 0);
    if (shots) {
      await b.ev(`(async () => { const c = TitanicApp.ctl; c.r = 700; c.phi = Math.PI / 2 - 0.05; c.theta = (90 - 8) * Math.PI / 180; })()`); await B.sleep(1500); await shot(b, 'v3-lights-ahead.png');
    }
    await b.ev("TitanicApp.setView('bridge')"); await B.sleep(800);
    const own = await b.ev('TitanicApp.navLights.filter(o => o.factor > 0.01).map(o => o.L.id)');
    row('from her own bridge none of her lights shows', own.length ? own.join(', ') : 'none', 'none: the screens and arcs hide them', own.length === 0);
    await b.ev("TitanicApp.setView('quarter'); TitanicApp.state.lights = false;"); await B.sleep(500);
    const off = await b.ev('TitanicApp.navLights.filter(o => o.factor > 0).length');
    row('the Lights switch puts them all out', off + ' showing', '0', off === 0);
    await b.ev('TitanicApp.state.lights = true;');
    if (shots) { await b.ev(`(() => { const c = TitanicApp.ctl; TitanicApp.state.follow = true; TitanicApp.setView('plan'); c.goal = null; c.r = 1500; c.phi = 0.55; c.theta = -Math.PI / 2 + 0.3; c.tx = -400; })()`); await B.sleep(2500); await shot(b, 'v3-wake.png'); }
    // ---- 7. the damage presets: the gear drawn, still
    await b.open('#scenario=titanic');
    await b.waitFor(`/Founders/.test(document.getElementById('fcLine').textContent)`, 60000, 'the preset\'s forecast');
    const pre = await b.ev(`({ rev: TitanicApp.state.screwRev, fc: document.getElementById('fcLine').textContent, rud: TitanicApp.stern.rudder.rotation.y })`);
    row('the 1912 damage preset: forecast as before, the screws and rudder drawn and still', '"' + pre.fc + '"; revolutions ' + pre.rev.join(','), 'Founders at 2:25 am, 2 h 46 min after the damage (2:18 before D4, the calibration epoch landed with member C; 2:17 before G7, the forepeak held to its tank, and its refit; 2:16 before S1, the tiers above B deck and the staircases; 2:17 before the refit with the pumps, Y3); 0,0,0', /2:25 am, 2 h 46 min after the damage/.test(pre.fc) && pre.rev.every(r => r === 0) && pre.rud === 0);
    // ---- her lights go out as she rises (V6): the preset run at 900x
    const lit0 = await b.ev('({ ports: TitanicApp.ports.n, on: TitanicApp.ports.mat.uniforms.uOn.value })');
    await b.ev('TitanicApp.state.speed = 900');
    await b.waitFor('TitanicApp.state.lightsFailT > 0 || TitanicApp.state.sim.foundered', 120000, 'her lights failing or the end');
    await B.sleep(800);
    const lit = await b.ev(`({ t: TitanicApp.state.lightsFailT, why: TitanicApp.state.lightsFailWhy, on: TitanicApp.ports.mat.uniforms.uOn.value, nav: TitanicApp.navLights.filter(o => o.factor > 0).length })`);
    const clk = (mins) => { const h = Math.floor(mins / 60) % 24, mm = Math.floor(mins % 60); return (h % 12 || 12) + ':' + String(mm).padStart(2, '0') + ' am'; };
    row('her ports lit, then all her lights out as she rises (V6; the dynamos from core/systems.js)', lit0.ports + ' ports lit at first; out at ' + (lit.t > 0 ? clk(23 * 60 + 40 + lit.t / 60 - 24 * 60) + ' (' + lit.why + ')' : 'never') + '; ports ' + lit.on.toFixed(2) + ', nav lights ' + lit.nav, 'out ' + LR.said + '; then nothing lit', lit0.on === 1 && lit.t > 0 && LR.read(lit.t).ok && lit.on === 0 && lit.nav === 0);   // D90 (a): the window from tools/lights_record.js, one place
    // ---- 8. the parts' hooks (site/app.js, "parts"): a part sees every step, the frames and the moments of a run; one
    // that throws is dropped after its first call and reported once, and the page carries on
    await b.open('#night=1912');
    await b.ev(`(() => { const A = TitanicApp, H = window.__hooks = { steps: 0, frames: 0, events: [], resets: 0, bad: 0, k0: A.state.sim.night.k };
      A.on('step', () => { H.steps++; }); A.on('frame', (t, dt) => { if (t > 0 && dt >= 0) H.frames++; });
      A.on('event', (name) => { H.events.push(name); }); A.on('reset', () => { H.resets++; });
      A.on('frame', () => { H.bad++; throw new Error('a test part throws'); });
      A.state.warp = 4; })()`);
    await b.waitFor('TitanicApp.state.sim.night.tBells >= 0', 60000, 'the bells');
    await b.click('bHardPort');
    await B.sleep(600);
    const hk = await b.ev(`(() => { const A = TitanicApp, H = window.__hooks; A.state.playing = false; return { steps: H.steps, k: A.state.sim.night.k - H.k0, frames: H.frames, events: H.events.join(','), bad: H.bad }; })()`);
    const resets = await b.ev(`(() => { TitanicApp.loadScenario('four'); return window.__hooks.resets; })()`);
    const reports = b.errors.filter(e => /a viewer part failed/.test(String(e))).length;
    for (let i = b.errors.length - 1; i >= 0; i--) if (/a viewer part failed/.test(String(b.errors[i]))) b.errors.splice(i, 1);
    row('a part hooks every step, the frames and the moments of a run; one that throws is dropped and reported once', hk.steps + ' calls for ' + hk.k + ' steps; ' + hk.frames + ' frames; events ' + hk.events + '; the bad part called ' + hk.bad + ', reported ' + reports + '; resets ' + resets, 'a call a step; frames; bells and helm among the events; 1 call, 1 report; 1 reset', hk.k > 0 && hk.steps === hk.k && hk.frames > 5 && /bells/.test(hk.events) && /helm/.test(hk.events) && hk.bad === 1 && reports === 1 && resets === 1);
    // ---- 9. the core's pockets (W6's bunker, G7's tank: water it keeps apart from sim.vol, counted in their spaces by
    // C.spaceWater), drawn where each stands, never spread over its space (G7's adopters). Each gets:
    // - a free surface of its own while it fills (the X-ray look), at the core's own law for its level (pocketHead's);
    // - a box among the columns whose volume is its water;
    // - its own fill in its compartment on the damage diagram.
    // - its own level in the hull's X-ray tint, inside its walls, full ones too.
    // Nothing is drawn once it has given way. Twice on the 1912 preset, each on an exact step: a pocket part full, then
    // 1 h 40 min in. First the undamaged hull, where no pocket holds water: the tint has no pocket in it (its shader takes
    // the spaces' levels alone, as before G21's mend: the same pixels)
    await b.open('#scenario=blank');
    await B.sleep(600);
    const pk0 = await b.ev(`(() => { const s = TitanicApp.state.sim; return { tint: (TitanicApp.pocketsDrawn().tint || []).length, pockets: (s.pockets || []).length, water: (s.pockets || []).reduce((a, k) => a + k.vol, 0) }; })()`);
    row('with no pocket water (the undamaged hull) the hull\'s X-ray tint has no pocket in it: the spaces\' levels alone, as before',
      `${pk0.pockets} pockets holding ${pk0.water.toFixed(3)} m3; in the tint ${pk0.tint}`, 'no water; none', pk0.water <= 0.5 && pk0.tint === 0);
    await b.open('#scenario=titanic');
    const holdP = async (cond, what) => {
      await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } });
        A.state.speed = 900; A.state.playing = true; })()`);
      await b.waitFor('window.__held', 120000, what);
    };
    if (!(await b.ev('TitanicApp.state.cols'))) await b.click('bCols');
    const POCKETS = `(() => { const A = TitanicApp, C = TitanicCore, sim = A.state.sim, F = C.frameOf(sim), d = A.pocketsDrawn(), bad = [], seen = [];
      (sim.pockets || []).forEach((k, j) => {
        const holds = k.state === 0 && k.cap > 0, fill = k.z0 + (k.z1 - k.z0) * Math.min(1, k.vol / k.cap);
        const s = d.surfaces.find(p => p.j === j), c = d.columns.find(p => p.j === j), g = d.diagram.find(p => p.j === j);
        const filling = holds && k.vol > 0.5 && k.vol < k.cap * 0.998, wet = holds && k.vol > 1e-3;
        seen.push(k.name.replace(/ \\(.*\\)$/, '') + ' ' + Math.round(100 * Math.min(1, k.vol / k.cap)) + ' %' + (holds ? '' : ' (given way)'));
        if (filling !== !!s) bad.push(k.name + ': a free surface ' + (s ? 'drawn' : 'missing'));
        if (s && Math.abs(s.y - (C.worldZ(F, k.xc, k.yc, fill) - A.state.post)) > 1e-6) bad.push(k.name + ': its surface not at its level');
        if (s && !(Math.abs(s.y + A.state.post - sim._hEff[C.NN + j]) <= 0.05)) bad.push(k.name + ': its surface off the core head');
        if (wet !== !!c) bad.push(k.name + ': a box among the columns ' + (c ? 'drawn' : 'missing'));
        if (c && Math.abs(c.vol - Math.min(k.vol, k.cap)) > 1e-6 * k.cap) bad.push(k.name + ': its box holds ' + c.vol.toFixed(3) + ' m3, not ' + Math.min(k.vol, k.cap).toFixed(3));
        if (c && (c.x0 !== k.x0 || c.x1 !== k.x1 || c.side !== k.side)) bad.push(k.name + ': its box out of its place');
        if ((holds && k.vol > 0.5) !== !!g) bad.push(k.name + ': on the diagram ' + (g ? 'drawn' : 'missing'));
        // the X-ray tint (G21's last page item): inside its walls, its own level, full ones too
        const tn = (d.tint || []).find(p => p.j === j);
        if ((holds && k.vol > 0.5) !== !!tn) bad.push(k.name + ': in the X-ray tint ' + (tn ? 'drawn' : 'missing'));
        if (tn && Math.abs(tn.lev - (C.worldZ(F, k.xc, k.yc, fill) - A.state.post)) > 1e-6) bad.push(k.name + ': its tint not at its level');
        if (tn && (tn.x0 !== k.x0 || tn.x1 !== k.x1 || tn.z0 !== k.z0 || tn.z1 !== k.z1 || tn.side !== k.side)) bad.push(k.name + ': its tint out of its walls');
      });
      return { t: sim.t, seen, bad, n: d.surfaces.length + '/' + d.columns.length + '/' + d.diagram.length }; })()`;
    await holdP('(sim.pockets || []).some(k => k.state === 0 && k.vol > 0.2 * k.cap && k.vol < 0.8 * k.cap)', 'a pocket part full');
    await B.sleep(400);
    const pk1 = await b.ev(POCKETS);
    await holdP('sim.t >= 6000', '1 h 40 min into the run');
    await B.sleep(400);
    const pk2 = await b.ev(POCKETS);
    const pkBad = pk1.bad.concat(pk2.bad);
    row('the core\'s pockets drawn where each stands, never spread over its space (G7): a free surface of its own while it fills, a box among the columns holding its water, its own fill on the damage diagram; nothing once it has given way',
      `${Math.round(pk1.t / 60)} min: ${pk1.seen.join(', ')} (surfaces/boxes/fills ${pk1.n}); ${Math.round(pk2.t / 60)} min: ${pk2.seen.join(', ')} (${pk2.n})${pkBad.length ? '; ' + pkBad.join('; ') : ''}`,
      'each as the core holds it: its level to 1e-6 m and within 5 cm of the core\'s own head; its box\'s volume its water', !pkBad.length && pk1.seen.length > 0);
    // a hold as holdP's with a longer bound (a watch: the encounter on the warp, then the director's holds of the pace)
    const holdLong = async (cond, what) => {
      await b.ev(`(() => { const A = TitanicApp; window.__held = false; const f = A.on('step', (sim) => { if (${cond}) { A.state.playing = false; window.__held = true; A.off('step', f); } });
        A.state.speed = 900; A.state.playing = true; })()`);
      await b.waitFor('window.__held', 300000, what);
    };
    // ---- 10. D97 (the coordinator's ruling; U3's lights, version 2): a port is lit at the plant's level while its section's
    // circuit holds, and dark for good once its section's fuses blow (G1's circuits, core/readers/circuits.js), whatever
    // the sea outside it; a lit port under the sea is drawn dimmer and blue-green [appearance]. The 1912 preset run to
    // 2:10 am, her lights still burning:
    //   - the page's mark of each port held to this suite's own record of the circuits (Circuits.start and step on every
    //     step of the same run, each port's section by Circuits.sectionOf), mark and time;
    //   - a draw of the ports alone with the page's own material and pose into a target of their own: those out light no
    //     pixel; the lit ones above the sea are drawn warm, the lit ones under it dimmer and blue-green.
    await b.open('#scenario=titanic');
    // the suite's record from her start: its hooks first, then the run made again from t = 0 (as the cards do)
    await b.ev(`(() => { const A = TitanicApp, CI = TitanicCircuits, P = TitanicVisuals.portholes(), n = A.ports.n;
      A.state.playing = false;
      const H = window.__ports = { st: null, sec: P.map(p => CI.sectionOf(A.ship, p[0], p[1], p[2])), t0: null, out0: null, n: P.length };
      A.on('reset', (sim) => { H.st = CI.start(sim); H.t0 = sim.t; H.out0 = A.ports.outCount(); });
      A.on('step', (sim) => { if (H.st) CI.step(sim, H.st); });
      A.loadScenario('titanic'); A.state.playing = false; })()`);
    await holdP('sim.t >= 150 * 60', '2:10 am');
    await B.sleep(400);
    const pf = await b.ev(`(() => { const A = TitanicApp, C = TitanicCore, sim = A.state.sim, H = window.__ports, n = A.ports.n, pg = A.ports.pts.geometry, g = pg.attributes.position.array, o = pg.attributes.aOut.array, P = TitanicVisuals.portholes();
      const F = C.frameOf(sim), gone = [], up = [], under = []; let wrong = H.n === n ? 0 : 1, when = 0, secWrong = 0;
      for (let i = 0; i < n; i++) {
        const s = H.sec[i], want = s >= 0 ? H.st.sections[s].out : -1, out = o[i] > 0.5;
        if (A.ports.sectionOf(i) !== s) secWrong++;
        if (out !== (want >= 0)) wrong++;
        if (A.ports.outAt(i) !== want) when++;
        if (out) gone.push(i); else if (C.worldZ(F, P[i][0], P[i][1], P[i][2]) < 0) under.push(i); else up.push(i);
      }
      const W = 800, Hh = 400, R = A.renderer, rt = new THREE.WebGLRenderTarget(W, Hh), buf = new Uint8Array(W * Hh * 4);
      const cam = new THREE.PerspectiveCamera(40, W / Hh, 1, 5000); cam.position.set(0, 25, 520); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
      // the ports given, alone: how many pixels they light, and those pixels' red, green and blue summed
      const draw = (idx) => {
        const geo = new THREE.BufferGeometry(), p = new Float32Array(idx.length * 3), a = new Float32Array(idx.length);
        idx.forEach((i, j) => { p[j * 3] = g[i * 3]; p[j * 3 + 1] = g[i * 3 + 1]; p[j * 3 + 2] = g[i * 3 + 2]; a[j] = o[i]; });
        geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('aOut', new THREE.BufferAttribute(a, 1));
        const sc = new THREE.Scene(), her = new THREE.Group(); her.matrixAutoUpdate = false; her.matrix.copy(A.shipGroup.matrixWorld); sc.add(her);
        const pts = new THREE.Points(geo, A.ports.mat); pts.frustumCulled = false; her.add(pts);
        const was = R.getRenderTarget(), cc = R.getClearColor(new THREE.Color()), ca = R.getClearAlpha();
        R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(); R.render(sc, cam); R.readRenderTargetPixels(rt, 0, 0, W, Hh, buf);
        R.setRenderTarget(was); R.setClearColor(cc, ca); geo.dispose();
        const s = { k: 0, r: 0, g: 0, b: 0 };
        for (let q = 0; q < W * Hh; q++) if (buf[q * 4] + buf[q * 4 + 1] + buf[q * 4 + 2] > 6) { s.k++; s.r += buf[q * 4]; s.g += buf[q * 4 + 1]; s.b += buf[q * 4 + 2]; }
        return s;
      };
      const r = { clock: A.clockOf(sim.t), lights: sim.plant.lights, on: A.ports.mat.uniforms.uOn.value, n, out: gone.length, nUp: up.length, nUnder: under.length, sections: H.st.out, wrong, when, secWrong, t0: H.t0, out0: H.out0, gone: draw(gone), up: draw(up), under: draw(under) };
      rt.dispose(); return r; })()`);
    const mean = (s) => (s.k ? (s.r + s.g + s.b) / s.k : 0);
    row('D97: a port dark once its section\'s fuses blow (G1\'s circuits), whatever the sea outside it; a lit port under the sea drawn dimmer and blue-green',
      `${pf.clock}, her lights ${pf.lights} (ports at ${pf.on.toFixed(2)}): ${pf.sections} sections blown; ${pf.out} of ${pf.n} ports out, each on its section's record (${pf.when} at another time, ${pf.wrong} wrong, ${pf.secWrong} in another section; watched from ${pf.t0} s); drawn alone, the ${pf.out} out light ${pf.gone.k} pixels; the ${pf.nUp} lit above the sea ${pf.up.k} (red ${pf.up.r} against blue ${pf.up.b}, ${mean(pf.up).toFixed(0)} a pixel); the ${pf.nUnder} lit under it ${pf.under.k} (red ${pf.under.r} against blue ${pf.under.b}, ${mean(pf.under).toFixed(0)} a pixel)`,
      'every port on its section\'s record; none from those out; above warm; under dimmer and blue-green',
      pf.lights > 0 && pf.on > 0.99 && pf.out0 === 0 && pf.out > 50 && pf.nUnder > 20 && pf.wrong === 0 && pf.when === 0 && pf.secWrong === 0 &&
      pf.gone.k === 0 && pf.up.k > 50 && pf.up.r > pf.up.b && pf.under.k > 0 && pf.under.b > pf.under.r && mean(pf.under) < mean(pf.up));
    // ---- 11. NH15 F7: her smoke follows the plant. The 1912 watch with the 1912 orders (a real click on Auto), from its
    // start to an hour and a quarter after the touch: every puff the page lays, checked on its own step against the
    // plant's own figures (each funnel's share of the steam her fires raise: P.gen shared among her boiler rooms as their
    // lit furnaces burn, two rooms a funnel, the first funnel boiler rooms 6 and 5), the density it is drawn at, and none
    // from a funnel whose share has gone (boiler rooms 6 and 5 flood first: the first funnel falls silent while the others
    // smoke on)
    await b.open('#night=1912');
    await b.click('bAuto');
    await b.waitFor('TitanicApp.state.night.mode === "auto" && TitanicApp.state.sim.night.k < 20', 10000, 'the 1912 orders');
    await b.ev(`(() => { const A = TitanicApp, R = TitanicSystems.PLANT.rooms, L0 = A.smoke.latest();
      A.state.playing = false;
      const H = window.__smoke = { n: 0, worst: 0, bad: [], miss: 0, exp: new Map(), seen: L0 ? L0.t : null, quiet: [null, null, null] };
      const want = (sim) => { const P = sim.plant, d = [0, 0, 0]; let tot = 0; for (let k = 0; k < R.length; k++) { const v = R[k].lit * P.fires[k]; tot += v; d[k >> 1] += v; } return d.map(v => (tot > 0 ? P.gen * v / tot : 0)); };
      A.on('step', (sim) => {
        const L = A.smoke.latest(), dn = A.smoke.points.geometry.attributes.aDense.array;
        if (L && L.t !== H.seen) {
          H.seen = L.t; const e = H.exp.get(L.t);
          if (!e) H.miss++;
          else {
            H.n++;
            for (let j = 0; j < 3; j++) {
              H.worst = Math.max(H.worst, Math.abs(L.share[j] - e[j]));
              const should = e[j] >= A.smoke.MIN;
              if (L.sent[j] !== should && H.bad.length < 5) H.bad.push((should ? 'no puff from funnel ' : 'a puff from funnel ') + (j + 1) + ' at ' + L.t + ' s');
              if (L.sent[j] && dn[L.at[j]] !== Math.fround(Math.min(1.5, 3 * e[j])) && H.bad.length < 5) H.bad.push('funnel ' + (j + 1) + ' drawn at ' + dn[L.at[j]] + ' at ' + L.t + ' s');
              if (!should && H.quiet[j] === null) H.quiet[j] = L.t;
            }
          }
        }
        H.exp.set(sim.t, want(sim)); if (H.exp.size > 12) H.exp.delete(H.exp.keys().next().value);
      });
      if (A.reports && A.reports.slow()) A.reports.setSlow(false);
      A.state.warp = 6; })()`);
    await holdLong('sim.night.tTouch >= 0 && sim.t - sim.night.tTouch >= 75 * 60', 'an hour and a quarter after the touch');
    const sm = await b.ev(`(() => { const A = TitanicApp, s = A.state.sim, H = window.__smoke, L = A.smoke.latest(), E = s.plant.events, T = (t) => (t === null || t === undefined ? null : (t - s.night.tTouch) / 60);
      return { n: H.n, worst: H.worst, bad: H.bad, miss: H.miss, quiet: H.quiet.map(T), share: L.share, sent: L.sent, count: A.smoke.sent(), T: T(s.t), flood: [T(E.flood0), T(E.flood1)] }; })()`);
    row('NH15 F7: her smoke follows the plant: every puff at its funnel\'s share of the steam her fires raise, on its own step; none from a funnel whose share has gone',
      `${sm.n} puffs' steps checked to T ${sm.T.toFixed(1)} (worst ${sm.worst.toExponential(1)}, ${sm.miss} unmatched${sm.bad.length ? '; ' + sm.bad.join('; ') : ''}); the first funnel silent from T ${sm.quiet[0] === null ? 'never' : sm.quiet[0].toFixed(1)} (boiler rooms 6 and 5 flooded at T ${sm.flood.map(v => (v === null ? '-' : v.toFixed(1))).join(' and ')}); at T ${sm.T.toFixed(1)} the shares ${sm.share.map(v => v.toFixed(3)).join(', ')}; puffs by funnel ${sm.count.join(', ')}`,
      'each to 1e-12, none unmatched or wrong; the first funnel silent once its rooms have flooded, the other two smoking',
      sm.n > 4000 && sm.worst < 1e-12 && sm.miss === 0 && sm.bad.length === 0 && sm.flood[1] !== null && sm.quiet[0] !== null && sm.quiet[0] >= sm.flood[1] && !sm.sent[0] && sm.sent[1] && sm.sent[2]);
    row('no error in the page\'s console through all of it', b.errors.length ? b.errors.slice(0, 3).join(' | ') : 'none', 'none', b.errors.length === 0);
    console.log(fails ? `FAIL: ${fails} row(s)` : `PASS: all ${rows.length} rows`);
  } catch (e) {
    fails++; console.log('FAIL the test could not finish: ' + e.message); if (b.errors.length) console.log('page errors: ' + b.errors.slice(0, 5).join(' | '));
  } finally {
    await b.close();
    process.exit(fails ? 1 : 0);
  }
})();
