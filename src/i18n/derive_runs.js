// v182, разовый перенос: из старых ключей-фрагментов с разметкой (en.json) выводит переводы фраз-«прогонов».
// RU и EN фрагменты разбираются одинаково (runs.js → skeleton); если их теги совпадают, фразы сопоставляются по порядку.
// node derive_runs.js → _derived.json (новые ключи-фразы); слить в en.json: python3 merge.py --json _derived.json
const fs = require('fs'), { runs, skeleton, CY } = require('./runs.js');
const D = JSON.parse(fs.readFileSync(__dirname + '/en.json', 'utf8'));
const add = {}, conflict = [], skip = []; let pairs = 0;
for (const [k, v] of Object.entries(D)){
  if (!runs(k)) continue;
  const a = skeleton(k), b = skeleton(v);
  if (a.sk !== b.sk || a.vals.length !== b.vals.length){ skip.push(k); continue; }
  a.vals.forEach((r, i) => { if (!CY.test(r)) return; pairs++; const e = b.vals[i];
    const have = D[r] !== undefined ? D[r] : add[r];
    if (have === undefined) add[r] = e; else if (have !== e) conflict.push([r, have, e]); });
}
console.log('fragments', Object.keys(D).filter(k => runs(k)).length, 'aligned pairs', pairs, 'new phrase keys', Object.keys(add).length, 'conflicts', conflict.length, 'not aligned', skip.length);
conflict.slice(0, 30).forEach(c => console.log('CONFLICT', JSON.stringify(c)));
skip.slice(0, 10).forEach(k => console.log('SKIP', JSON.stringify(k).slice(0, 160)));
fs.writeFileSync(__dirname + '/_derived.json', JSON.stringify(add));   // python3 -c слияние — см. README i18n
