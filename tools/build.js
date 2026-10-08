// Inline the headless core, scenarios, validation data and the viewer into one artifact page.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const guard = (s, name) => { if (/<\/script/i.test(s)) throw new Error(name + ' contains </script'); return s; };
let html = read('web/template.html');
const val = JSON.parse(read('out/validation.json'));
html = html.replace('/*@@CORE@@*/', () => guard(read('core/core.js'), 'core'))
  .replace('/*@@SCEN@@*/', () => guard(read('core/scenarios.js'), 'scenarios'))
  .replace('/*@@VAL@@*/', () => JSON.stringify(val))
  .replace('/*@@APP@@*/', () => guard(read('web/app.js'), 'app'));
fs.writeFileSync(path.join(root, 'out/titanic.html'), html);
console.log('wrote out/titanic.html', (html.length / 1024).toFixed(0), 'KB');
