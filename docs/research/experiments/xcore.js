// Builds an EXPERIMENTAL copy of core/core.js with four "seams" for a manoeuvring layer.
// The repo's core is never modified: the patched text is written to the folder given as outDir.
//
// Seams (all neutral by default, so the patched core must equal the original bit for bit):
//   S.hx[c]  external piezometric head (m) at a sea-side connection: Cp * U^2 / 2g, wave elevation, ...
//   S.cm[c]  multiplier on the discharge coefficient of an orifice (grazing-flow loss), default 1
//   sim.xFz, sim.xMth, sim.xMph  external heave force (N), pitch and roll moments (N m), default 0
//
// Usage from another script: const X = require('./xcore.js').build(repoRoot, outDir)  -> the patched module
const fs = require('fs');
const path = require('path');

function replaceOnce(src, find, repl, label) {
  const n = src.split(find).length - 1;
  if (n !== 1) throw new Error('patch "' + label + '": expected exactly 1 match, found ' + n);
  return src.replace(find, () => repl);
}

function build(repoRoot, outDir) {
  let s = fs.readFileSync(path.join(repoRoot, 'core', 'core.js'), 'utf8');
  s = replaceOnce(s, 'tOn: new Float64Array(cap),',
    'tOn: new Float64Array(cap), hx: new Float64Array(cap), cm: new Float64Array(cap).fill(1),', 'store');
  s = replaceOnce(s, 'const ha = a < 0 ? 0 : hEff[a], hbv = hEff[b];',
    'const ha = a < 0 ? S.hx[c] : hEff[a], hbv = hEff[b];', 'sea head');
  s = replaceOnce(s, 'if (d !== 0) q = S.coef[c] * S.area[c] * SQ2G * d / Math.sqrt(Math.max(Math.abs(d), 0.01));',
    'if (d !== 0) q = S.coef[c] * S.area[c] * SQ2G * d / Math.sqrt(Math.max(Math.abs(d), 0.01)) * S.cm[c];', 'orifice cd');
  s = replaceOnce(s, 'const hs = src < 0 ? 0 : hEff[src];', 'const hs = src < 0 ? S.hx[c] : hEff[src];', 'limiter src');
  s = replaceOnce(s, 'const hd = dst < 0 ? 0 : hEff[dst];', 'const hd = dst < 0 ? S.hx[c] : hEff[dst];', 'limiter dst');
  s = replaceOnce(s, 'const az = (L.Fz - sim.cDz', 'const az = (L.Fz + sim.xFz - sim.cDz', 'heave');
  s = replaceOnce(s, 'const ath = (L.Mth - sim.cDth', 'const ath = (L.Mth + sim.xMth - sim.cDth', 'pitch');
  s = replaceOnce(s, 'const aph = (L.Mph - sim.cDph', 'const aph = (L.Mph + sim.xMph - sim.cDph', 'roll');
  s = replaceOnce(s, 'vz: 0, wth: 0, wph: 0,\n    };', 'vz: 0, wth: 0, wph: 0, xFz: 0, xMth: 0, xMph: 0,\n    };', 'sim fields');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'core_x.js');
  fs.writeFileSync(out, s);
  delete require.cache[require.resolve(out)];
  return require(out);
}
module.exports = { build };
