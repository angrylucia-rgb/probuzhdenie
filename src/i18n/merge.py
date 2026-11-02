# python3 merge.py <файл партии> — строки «номер<TAB>перевод» по _todo_map.json → en.json
import json, sys, os
H = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(H, '_todo_map.json'), encoding='utf-8'))
p = os.path.join(H, 'en.json'); D = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
n = 0; bad = []
for line in open(sys.argv[1], encoding='utf-8'):
    line = line.rstrip('\n')
    if not line.strip() or '\t' not in line: continue
    i, t = line.split('\t', 1); i = int(i)
    t = t.replace('⏎', '\n'); k = L[i]
    # плейсхолдеры и экранирование должны совпасть
    import re
    for pat in (r'\\.', r'\$\{', r'%s', r'<[a-z/][^>]*>'):
        if pat == r'<[a-z/][^>]*>':
            if len(re.findall(r'<[a-zA-Z/]', k)) != len(re.findall(r'<[a-zA-Z/]', t)): bad.append((i, 'tags'))
        elif len(re.findall(pat, k)) != len(re.findall(pat, t)): bad.append((i, pat))
    D[k] = t; n += 1
json.dump(D, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('merged', n, 'total', len(D), 'missing in batch', len(L) - n, 'warnings', bad[:20])
