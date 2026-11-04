// v182: «прогоны» — фразы внутри фрагмента с разметкой. Ключ перевода — сама фраза без окружающих тегов.
// Фрагмент JS-шаблона вроде `" data-hover>← Назад</button></span></div>⏎ <img class="bio-port" ` раньше был ключом целиком:
// любая правка соседней разметки ломала перевод. Теперь из него берутся фразы «← Назад» (текст) и значения
// title/aria-label/alt/placeholder/data-tip — их и ищем в словаре. Строчные теги (<b>, <i>, <a>, <br>…) фразу не рвут.
// Если во фрагменте кириллица стоит там, где разбор не уверен (внутри тега, в экранированном атрибуте), runs() вернёт null —
// тогда фрагмент переводится целиком, как раньше.
const INLINE = new Set(['b', 'i', 'em', 'strong', 'u', 'sup', 'sub', 'br', 'small', 'abbr', 'code', 'q', 's', 'mark', 'wbr', 'a', 'nobr']);
const ATTRS = /\s(title|aria-label|alt|placeholder|data-tip|content)="([^"]*)"/g;
const CY = /[А-Яа-яЁё]/;
const hasMarkup = k => /<\/?[a-zA-Z]/.test(k) || tailEnd(k) >= 0;
// фрагмент начинается внутри тега: `" data-hover>…`, `>…` — до первого «>» нет «<», и это похоже на хвост тега
function tailEnd(k){ const lt = k.indexOf('<'), gt = k.indexOf('>'); if (gt < 0 || (lt >= 0 && lt < gt)) return -1;
  const pre = k.slice(0, gt), bare = pre.replace(ATTRS, ''); return /^\s*$/.test(pre) || /["=]/.test(pre) && !CY.test(bare) ? gt : -1; }
// куски: {tag:true, s, e, name} — структурный тег; {tag:false, s, e} — текст вместе со строчными тегами
function pieces(k){
  const out = [], te = tailEnd(k); let i = 0;
  if (te >= 0){ out.push({ tag:true, s:0, e:te + 1, name:'' }); i = te + 1; }
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)[^>]*>?/g; re.lastIndex = i; let m, txt = -1;
  const flush = e => { if (txt >= 0 && e > txt) out.push({ tag:false, s:txt, e }); txt = -1; };
  while ((m = re.exec(k))){
    const nm = (m[2] || '').toLowerCase();
    if (m.index > i && txt < 0) txt = i;
    if (nm && INLINE.has(nm) && m[0].endsWith('>')){ if (txt < 0) txt = m.index; i = re.lastIndex; continue; }
    flush(m.index); out.push({ tag:true, s:m.index, e:m.index + m[0].length, name:nm }); i = re.lastIndex;
  }
  if (i < k.length && txt < 0) txt = i; flush(k.length);
  return out;
}
const trimR = (k, s, e) => { while (s < e && /\s/.test(k[s])) s++; while (e > s && /\s/.test(k[e - 1])) e--; return [s, e]; };
// прогоны с кириллицей: [{s, e, k, a}] (a — значение атрибута) или null, если разбор не уверен
function runs(k){
  if (!hasMarkup(k)) return null;
  const out = [];
  for (const p of pieces(k)){
    const t = k.slice(p.s, p.e);
    if (!p.tag){ if (!CY.test(t)) continue; if (/>|="/.test(t.replace(/<[^>]*>/g, ''))) return null; /* «>» или =" вне тега — разбор не уверен */ const [s, e] = trimR(k, p.s, p.e); out.push({ s, e, k: k.slice(s, e), a:false }); continue; }
    let rest = t; ATTRS.lastIndex = 0; let a;
    while ((a = ATTRS.exec(t))){ if (!CY.test(a[2])) continue; const s = p.s + a.index + a[0].indexOf('"') + 1; out.push({ s, e: s + a[2].length, k: a[2], a:true }); rest = rest.replace(a[0], ''); }
    if (CY.test(rest)) return null;   // кириллица внутри тега вне известных атрибутов
  }
  return out.length ? out : null;
}
// для выравнивания RU ↔ EN: скелет (теги без переводимых атрибутов) и все фразы по порядку, независимо от языка
function skeleton(k){
  const sk = [], vals = [];
  for (const p of pieces(k)){
    const t = k.slice(p.s, p.e);
    if (!p.tag){ const v = t.trim(); if (v){ sk.push('T'); vals.push(v); } continue; }
    ATTRS.lastIndex = 0; let a, tt = t;
    while ((a = ATTRS.exec(t))){ sk.push('A:' + a[1]); vals.push(a[2]); tt = tt.replace(a[0], ' ' + a[1] + '=""'); }
    sk.push(tt.replace(/\s+/g, ' '));
  }
  return { sk: sk.join('|'), vals };
}
module.exports = { runs, skeleton, hasMarkup, CY };
