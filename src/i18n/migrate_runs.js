// v182: какие старые ключи-фрагменты больше не нужны: перевод по фразам даёт тот же результат.
// node migrate_runs.js → _drop.json (ключи к удалению) и отчёт о тех, что остаются (контекстный перевод)
const fs = require('fs'), { runs } = require('./runs.js');
const D = JSON.parse(fs.readFileSync(__dirname + '/en.json', 'utf8'));
const norm = s => s.replace(/[«“]/g, '"').replace(/[»”]/g, '"');
const drop = [], keep = [];
for (const [k, v] of Object.entries(D)){
  const r = runs(k); if (!r) continue;
  let out = '', last = 0, ok = true;
  for (const x of r){ let t = D[x.k]; if (t === undefined || x.k === k){ ok = false; break; } if (x.a) t = t.replace(/"/g, '&quot;'); out += k.slice(last, x.s) + t; last = x.e; }
  out += k.slice(last);
  if (ok && norm(out) === norm(v)) drop.push(k); else keep.push([k, v, ok ? out : null]);
}
fs.writeFileSync(__dirname + '/_drop.json', JSON.stringify(drop));
console.log('fragments', drop.length + keep.length, 'drop', drop.length, 'keep', keep.length);
keep.forEach(([k, v, o]) => console.log('KEEP', JSON.stringify(k).slice(0, 90), '\n   whole:', JSON.stringify(v).slice(0, 90), '\n   runs: ', JSON.stringify(o).slice(0, 90)));
