// node todo.js <блок|*> [макс_символов] — непереведённые строки блока (по объявлению верхнего уровня), с номерами
const fs = require('fs'), req = m => { try { return require(m); } catch(e){ return require('/tmp/claude-0/node_modules/' + m); } }, acorn = req('acorn');
const src = fs.readFileSync(__dirname + '/../base.html', 'utf8');
const si = src.indexOf('<script>'), se = src.lastIndexOf('</script>'); const js = src.slice(si + 8, se), off = si + 8;
const ast = acorn.parse(js, { ecmaVersion: 2022 });
let body = []; for (const n of ast.body){ const e = n.type === 'ExpressionStatement' && n.expression; const f = e && e.type === 'CallExpression' && e.callee;
  if (f && (f.type === 'ArrowFunctionExpression' || f.type === 'FunctionExpression')) body.push(...f.body.body); else body.push(n); }
const tops = body.map(n => { let name = n.type; if (n.type === 'VariableDeclaration') name = n.declarations.map(d => d.id.name || '?').join(','); else if (n.type === 'FunctionDeclaration') name = 'fn ' + n.id.name; else name = 'expr'; return { s: off + n.start, e: off + n.end, name }; });
const segs = JSON.parse(fs.readFileSync(__dirname + '/segments.json'));
let D = {}; try { D = JSON.parse(fs.readFileSync(__dirname + '/en.json')); } catch(e){}
const want = process.argv[2], lim = +(process.argv[3] || 1e9);
const blockOf = s => { if (s.at < off) return 'HTML'; const t = tops.find(t => t.s <= s.at && s.at <= t.e); return t ? t.name : '?'; };
const seen = new Set(), list = []; let chars = 0;
for (const s of segs){ if (D[s.k] !== undefined) continue; const b = blockOf(s);
  if (want === '*' ? false : want.startsWith('!') ? want.slice(1).split(',').includes(b) : !want.split(',').includes(b)) continue;
  // v182: у фрагмента с разметкой переводятся фразы (s.r), а не весь кусок вместе с тегами
  for (const k of s.r ? s.r.map(r => r.k) : [s.k]){ if (D[k] !== undefined || seen.has(k)) continue;
    if (chars + k.length > lim && list.length) break; seen.add(k); list.push(k); chars += k.length; } }
fs.writeFileSync(__dirname + '/_todo_map.json', JSON.stringify(list));
list.forEach((k, i) => console.log(i + '\t' + k.replace(/\n/g, '⏎')));
console.error('items', list.length, 'chars', chars);
