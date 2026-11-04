// Извлекает из base.html все строки с кириллицей: JS-литералы и шаблоны (acorn) + текст и атрибуты HTML вне <script>/<style>.
// Выход: i18n/segments.json — [{k: исходный текст (raw), t: тип, at: смещение в base.html, ctx: ближайший код}]
const fs = require('fs'), req = m => { try { return require(m); } catch(e){ return require('/tmp/claude-0/node_modules/' + m); } }, acorn = req('acorn'), walk = req('acorn-walk'); // npm i acorn acorn-walk
const src = fs.readFileSync(process.argv[2] || __dirname + '/../base.html', 'utf8');
const CY = /[А-Яа-яЁё]/;
const si = src.indexOf('<script>'), se = src.lastIndexOf('</script>');
const js = src.slice(si + 8, se), off = si + 8;
const ast = acorn.parse(js, { ecmaVersion: 2022, sourceType: 'script', allowHashBang: true });
const segs = [];
walk.full(ast, n => {
  if (n.type === 'Literal' && typeof n.value === 'string' && CY.test(n.value)) segs.push({ t: 'js', at: off + n.start + 1, end: off + n.end - 1, k: js.slice(n.start + 1, n.end - 1) });
  if (n.type === 'TemplateElement' && CY.test(n.value.raw) && !/gl_FragColor|gl_Position|uniform |varying |void main|\bvec[234]\b|\bfloat\s|smoothstep\(|uSharp/.test(n.value.raw)) segs.push({ t: 'tpl', at: off + n.start, end: off + n.end, k: n.value.raw });
});
// HTML вне скрипта и стилей
const html = src.slice(0, si);
const re = /<(script|style)[\s\S]*?<\/\1>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/g; let m;
while ((m = re.exec(html))){
  const s = m[0], at = m.index;
  if (s.startsWith('<script') || s.startsWith('<style') || s.startsWith('<!--')) continue;
  if (s[0] === '<'){ const ar = /\s(aria-label|title|alt|placeholder|content|data-tip)="([^"]*)"/g; let a;
    while ((a = ar.exec(s))) if (CY.test(a[2])) { const p = at + a.index + a[0].indexOf('"') + 1; segs.push({ t: 'attr', at: p, end: p + a[2].length, k: a[2] }); } }
  else if (CY.test(s)) { const lead = s.match(/^\s*/)[0].length, trail = s.match(/\s*$/)[0].length; segs.push({ t: 'html', at: at + lead, end: at + s.length - trail, k: s.slice(lead, s.length - trail) }); }
}
segs.sort((a, b) => a.at - b.at);
// v182: у фрагментов JS с разметкой — фразы-«прогоны» (см. runs.js): ключи, которые не ломаются от правок соседних тегов
const { runs } = require('./runs.js');
for (const s of segs) if (s.t === 'js' || s.t === 'tpl'){ const r = runs(s.k); if (r) s.r = r.map(x => ({ at: s.at + x.s, end: s.at + x.e, k: x.k, a: x.a })); }
fs.writeFileSync(process.argv[3] || __dirname + '/segments.json', JSON.stringify(segs));
const uniq = new Set(segs.map(s => s.k));
let chars = 0; uniq.forEach(k => chars += k.length);
const by = {}; segs.forEach(s => by[s.t] = (by[s.t] || 0) + 1);
console.log('segments', segs.length, 'unique', uniq.size, 'unique chars', chars, by, 'with runs', segs.filter(s => s.r).length);
