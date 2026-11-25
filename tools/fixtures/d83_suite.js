// A stand-in for a browser suite, for tools/gate_pairs_tests.js (D83); it starts no browser. It prints its start and end
// times (volatile lines, "~ "), takes about a second and a half, and prints the same rows every run. With "vary" it also
// says whether another stand-in was running beside it halfway through, so that its paired output differs from its lone one.
//   node tools/fixtures/d83_suite.js <label> [vary]
'use strict';
const fs = require('fs');
const path = require('path');
const label = process.argv[2] || 'x', vary = process.argv[3] === 'vary';
const dir = path.join(process.env.TITANIC_OUT || path.join(__dirname, '..', '..', 'out', 'gate'), 'd83');
fs.mkdirSync(dir, { recursive: true });
const me = path.join(dir, label + '.run');
fs.writeFileSync(me, String(process.pid));
console.log('~ start ' + Date.now());
let beside = false;
setTimeout(() => { beside = fs.readdirSync(dir).some(f => f.endsWith('.run') && f !== label + '.run'); }, 750);
setTimeout(() => {
  for (let i = 1; i <= 3; i++) console.log('PASS row ' + i + ' of the stand-in ' + label);
  if (vary) console.log(beside ? 'another stand-in ran beside it' : 'no other stand-in ran beside it');
  console.log('~ end ' + Date.now());
  try { fs.unlinkSync(me); } catch (e) { /* gone already */ }
  console.log('PASS: the stand-in ' + label);
}, 1500);
