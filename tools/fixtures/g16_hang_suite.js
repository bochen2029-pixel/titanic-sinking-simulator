// A suite that never ends, for tools/gate_deadline_tests.js (G16): the gate must kill it at its deadline and go on.
'use strict';
console.log('hanging on purpose (a fixture of tools/gate_deadline_tests.js)');
setInterval(() => {}, 1000);
