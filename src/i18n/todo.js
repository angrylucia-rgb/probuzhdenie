// node todo.js <блок|*> [макс_символов] — непереведённые строки блока (по объявлению верхнего уровня), с номерами
const fs = require('fs'), acorn = require('/tmp/claude-0/node_modules/acorn');
const src = fs.readFileSync('/home/claude/site/base.html', 'utf8');
const si = src.indexOf('<script>'), se = src.lastIndexOf('</script>'); const js = src.slice(si + 8, se), off = si + 8;
const ast = acorn.parse(js, { ecmaVersion: 2022 });
let body = []; for (const n of ast.body){ const e = n.type === 'ExpressionStatement' && n.expression; const f = e && e.type === 'CallExpression' && e.callee;
  if (f && (f.type === 'ArrowFunctionExpression' || f.type === 'FunctionExpression')) body.push(...f.body.body); else body.push(n); }
const tops = body.map(n => { let name = n.type; if (n.type === 'VariableDeclaration') name = n.declarations.map(d => d.id.name || '?').join(','); else if (n.type === 'FunctionDeclaration') name = 'fn ' + n.id.name; else name = 'expr'; return { s: off + n.start, e: off + n.end, name }; });
const segs = JSON.parse(fs.readFileSync('/home/claude/site/i18n/segments.json'));
let D = {}; try { D = JSON.parse(fs.readFileSync('/home/claude/site/i18n/en.json')); } catch(e){}
const want = process.argv[2], lim = +(process.argv[3] || 1e9);
const blockOf = s => { if (s.at < off) return 'HTML'; const t = tops.find(t => t.s <= s.at && s.at <= t.e); return t ? t.name : '?'; };
const seen = new Set(), list = []; let chars = 0;
for (const s of segs){ if (D[s.k] !== undefined || seen.has(s.k)) continue; const b = blockOf(s);
  if (want === '*' ? false : want.startsWith('!') ? want.slice(1).split(',').includes(b) : !want.split(',').includes(b)) continue;
  if (chars + s.k.length > lim && list.length) break; seen.add(s.k); list.push(s.k); chars += s.k.length; }
fs.writeFileSync('/home/claude/site/i18n/_todo_map.json', JSON.stringify(list));
list.forEach((k, i) => console.log(i + '\t' + k.replace(/\n/g, '⏎')));
console.error('items', list.length, 'chars', chars);
