import json
t=open('template2.html').read()
import os
DATA_PATH=os.environ.get('DATA_JSON') or ('data.json' if os.path.exists('data.json') else '/home/claude/karta/data.json')
d=json.load(open(DATA_PATH))
ring=[{k:r[k] for k in ['n','name','sub','scale','trad','sci','prac','q','short','sc']} for r in d['ring']]
data=json.dumps({'ring':ring,'centers':d['centers'],'koshas':d['koshas'],'stages':d['stages']},ensure_ascii=False)
mask=open('mask.b64').read().strip()
libs=['shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/ShaderPass.js','postprocessing/UnrealBloomPass.js']
def scripts(threep, exp):
    return '\n'.join([f'<script src="{threep}"></script>']+[f'<script src="{exp}{l}"></script>' for l in libs])
import base64
def b64(f, mime): return f"data:{mime};base64," + base64.b64encode(open(f,'rb').read()).decode()
refimg={k: b64(f'ref/out/{k}.webp','image/webp') for k in ['mus','org','bone']}
refimg.update({k+'_d': b64(f'ref/out/{k}_d.png','image/png') for k in ['mus','org','bone']})
refimg['body']=b64('ref/out/body.webp','image/webp')
refimg.update({k+'_s': b64(f'ref/out/{k}_s.png','image/png') for k in ['mus','org','bone']})
refjs='const REFIMG = '+json.dumps(refimg)+';\nconst REGIONS = '+open('ref/out/regions.json').read()+';\n'+open('refs.js').read()
base=t.replace('__REFS__',refjs).replace('__ANAT__',open('anat.js').read()).replace('__MICRO__',open('micro.js').read()+'\n'+open('earth.js').read().replace('__PART2__',open('e2.js').read().replace('__PART3__',open('e3.js').read().replace('__PART4__',open('e4.js').read().replace('__PART5__',open('e5.js').read()))))+'\n'+open('abs.js').read()).replace('__ELV__',open('elv.js').read()).replace('__DATA__',data).replace('__MASK__',mask).replace('__BODYMETA__',open('ref/out/body_meta.json').read())
pub=base.replace('__SCRIPTS__',scripts('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/'))
open('astrolabia.html','w').write(pub)
prev=base.replace('requestAnimationFrame(t => { last = t; loop(t); });','window.__uv2s = (k, u, y) => { const R = stations[6].api.refs[k]; const w = R.pl.geometry.parameters.width; const v = new THREE.Vector3((u - .5)*w, (.5 - y)*w, 0); R.pl.localToWorld(v); v.project(camera); return [(v.x + 1)/2*innerWidth, (1 - v.y)/2*innerHeight]; }; window.__refS = k => { const R = stations[6].api.refs[k]; return JSON.stringify({s1:R.s1, s0:{id:R.s0.id,h:R.s0.h}, cur:[R.cur.x,R.cur.y], curT:[R.curT.x,R.curT.y]}); }; window.__refsReady = () => stations[6].api.refs.map(r => `${r.ready}:${r.fail}`); window.MICRO_DBG = MICRO; window.stations_dbg = stations[6].api.refs; window.EARTH_DBG = EARTH; window.MSC = mscene; window.__earth = () => openEarth(); window.__j = id => openJourney(id); window.__br = b => setBranch(b); window.__depth = v => { depthT = v; depth = v; lastDepthInput = performance.now() + 1e9; }; window.__dbg = () => ({depth, depthT, humanOpen, tr:!!tr, jId, jKind, jHist:jHist.join(","), pos, hoverI, pointerIn, travel, pos, target, diveT, ndc:[ndc.x,ndc.y], stNow:lastHoverI}); requestAnimationFrame(t => { last = t; loop(t); });').replace('__SCRIPTS__',scripts('node_modules/three/build/three.min.js','node_modules/three/examples/js/'))
open('preview.html','w').write('<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+prev+'</body></html>')

# ---- продакшн-сборка для хостинга: dist/ (полный HTML-документ, библиотеки локально) ----
import shutil
DIST = os.environ.get('DIST') or ('../dist' if os.path.isdir('../dist') and os.path.exists('../README.md') else 'dist')
os.makedirs(DIST + '/vendor/postprocessing', exist_ok=True); os.makedirs(DIST + '/vendor/shaders', exist_ok=True)
shutil.copy('node_modules/three/build/three.min.js', DIST + '/vendor/three.min.js')
for l in libs: shutil.copy('node_modules/three/examples/js/'+l, DIST + '/vendor/'+l)
head = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Пробуждение — интерактивная астролябия сознания: путь сквозь 12 станций от Абсолюта до квантового вакуума, где духовные учения встречаются с наукой.">
<meta name="theme-color" content="#05060C">
<meta property="og:title" content="Пробуждение · Астролябия сознания">
<meta property="og:description" content="Интерактивное погружение сквозь 12 станций: от Абсолюта — через Землю и Человека — к квантовому вакууму.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%2305060C'/%3E%3Ccircle cx='32' cy='32' r='22' fill='none' stroke='%23D6AC5E' stroke-width='2'/%3E%3Ccircle cx='32' cy='32' r='4' fill='%23D6AC5E'/%3E%3Cpath d='M32 6v52M6 32h52' stroke='%23D6AC5E' stroke-width='1' opacity='.5'/%3E%3C/svg%3E">
"""
body = base.replace('__SCRIPTS__', scripts('/vendor/three.min.js', '/vendor/'))
i = body.index('<style>')
page = head + body[:i] + body[i:body.index('</style>')+8] + "\n</head>\n<body>\n" + body[body.index('</style>')+8:] + "\n</body>\n</html>\n"
open(DIST + '/index.html','w').write(page)
open(DIST + '/vercel.json','w').write(json.dumps({"cleanUrls": True, "headers": [{"source": "/vendor/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]}]}, indent=2))
