#!/usr/bin/env python3
"""Локальный сервер для тестов: отдаёт dist/ так же, как Vercel.
- заголовки безопасности из dist/vercel.json (без upgrade-insecure-requests — на http он ломает загрузку);
- адреса /v/<хеш>/… переписываются в /… (как rewrite в vercel.json).
Запуск: python3 tests/server.py [папка dist] [порт]
"""
import http.server, json, functools, re, sys, os
D = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist'))
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8790
H = [(h['key'], h['value'].replace('; upgrade-insecure-requests', '')) for h in json.load(open(os.path.join(D, 'vercel.json')))['headers'][0]['headers']]
class R(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path): return super().translate_path(re.sub(r'^/v/[0-9a-f]+/', '/', path))
    def end_headers(self):
        for k, v in H: self.send_header(k, v)
        super().end_headers()
    def log_message(self, *a): pass
print('serving', D, 'on', PORT, flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(R, directory=D)).serve_forever()
