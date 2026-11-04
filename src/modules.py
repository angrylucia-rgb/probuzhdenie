#!/usr/bin/env python3
"""Исходник сайта — папка modules/: стили, разметка и основной скрипт, разрезанные по разделам.
Файлы склеиваются ПОДРЯД, в порядке имён (000-…, 010-…, 100-…), в base.html — один <script> с общей областью видимости.
Это не ES-модули: каждый файл — фрагмент одного скрипта, переменные общие (как и раньше в base.html).

  python3 modules.py build          — собрать base.html из modules/ (это же делает build3.py)
  python3 modules.py where "текст"  — в каком файле modules/ лежит фрагмент
  python3 modules.py check          — base.html совпадает со сборкой из modules/?

Править только modules/*. base.html — производный файл: build3.py пересобирает его и откажется работать,
если base.html правили вручную (новее модулей и отличается от сборки) — чтобы правка не потерялась.
"""
import os, sys, glob
H = os.path.dirname(os.path.abspath(__file__)); MOD = os.path.join(H, 'modules'); BASE = os.path.join(H, 'base.html')
def files(): return sorted(glob.glob(os.path.join(MOD, '[0-9][0-9][0-9]-*')))
def assemble(): return ''.join(open(f, encoding='utf-8').read() for f in files())
def build(strict=True):
    s = assemble()
    if strict and os.path.exists(BASE):
        old = open(BASE, encoding='utf-8').read()
        if old != s and os.path.getmtime(BASE) > max(os.path.getmtime(f) for f in files()):
            sys.exit('base.html правили вручную — правки потеряются. Перенесите их в modules/ (python3 modules.py where "…") и соберите снова.')
    open(BASE, 'w', encoding='utf-8').write(s); return s
def where(t):
    for f in files():
        s = open(f, encoding='utf-8').read(); i = s.find(t)
        while i >= 0: print(os.path.basename(f) + ':' + str(s.count('\n', 0, i) + 1)); i = s.find(t, i + 1)
if __name__ == '__main__':
    c = sys.argv[1] if len(sys.argv) > 1 else 'build'
    if c == 'build': s = build(); print('base.html', len(s), 'символов из', len(files()), 'файлов')
    elif c == 'where': where(sys.argv[2])
    elif c == 'check': same = os.path.exists(BASE) and open(BASE, encoding='utf-8').read() == assemble(); print('совпадает' if same else 'ОТЛИЧАЕТСЯ'); sys.exit(0 if same else 1)
