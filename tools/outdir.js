// Where the tools write their tables: out/, or the folder named by TITANIC_OUT. tools/gate.js sets TITANIC_OUT, so that
// checking never rewrites a tracked table; `node tools/gate.js --write` copies the fresh ones over when that is meant.
//   const outFile = require('./outdir');  fs.writeFileSync(outFile('night_window_1912.txt'), text);
'use strict';
const fs = require('fs');
const path = require('path');
const dir = process.env.TITANIC_OUT ? path.resolve(process.env.TITANIC_OUT) : path.join(__dirname, '..', 'out');
if (process.env.TITANIC_OUT) fs.mkdirSync(dir, { recursive: true });
module.exports = (name) => path.join(dir, name);
