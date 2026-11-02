# Сборка английской версии из base.html: (1) структурные правки кода en_patch.json, (2) замена всех строк с кириллицей
# по словарю en.json (ключ — исходная строка как в коде). Выход: astrolabia_en.html (артефакт), preview_en.html, DIST/en/index.html.
import json, os, re, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(H)
def load(p, d): 
    try: return json.load(open(p, encoding='utf-8'))
    except FileNotFoundError: return d
def patched_base():
    b = open(os.path.join(SITE, 'base.html'), encoding='utf-8').read()
    for i, (a, c) in enumerate(load(os.path.join(H, 'en_patch.json'), [])):
        n = b.count(a)
        if n == 0: print('PATCH MISS', i, a[:80]); continue
        b = b.replace(a, c)
    return b
def esc(t, ctx, q):
    if ctx == 'js': return t if q not in t else t.replace('\\' + q, '\x00').replace(q, '\\' + q).replace('\x00', '\\' + q)
    if ctx == 'tpl': return t.replace('`', '\\`')
    if ctx == 'html': return t
    if ctx == 'attr': return t.replace('"', '&quot;')
    return t
def translate(b):
    tmp = os.path.join(H, '_tmp_patched.html'); open(tmp, 'w', encoding='utf-8').write(b)
    subprocess.run(['node', os.path.join(H, 'extract.js'), tmp, os.path.join(H, '_tmp_segs.json')], check=True, capture_output=True)
    segs = json.load(open(os.path.join(H, '_tmp_segs.json'), encoding='utf-8'))
    D = load(os.path.join(H, 'en.json'), {})
    out = []; last = 0; miss = {}
    for s in segs:
        t = D.get(s['k'])
        if t is None: miss[s['k']] = miss.get(s['k'], 0) + 1; continue
        q = b[s['at'] - 1] if s['t'] == 'js' else ''
        out.append(b[last:s['at']]); out.append(esc(t, s['t'], q)); last = s['end']
    out.append(b[last:]); return ''.join(out), miss, len(segs)
if __name__ == '__main__':
    b = patched_base()
    en, miss, n = translate(b)
    json.dump(sorted(miss), open(os.path.join(H, 'missing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('segments', n, 'missing unique', len(miss), 'missing chars', sum(len(k) for k in miss))
    open(os.path.join(H, 'base_en.html'), 'w', encoding='utf-8').write(en)
