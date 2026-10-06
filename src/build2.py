import json
t=open('template2.html').read()
import os
DATA_PATH=os.environ.get('DATA_JSON') or ('data.json' if os.path.exists('data.json') else '/home/claude/karta/data.json')
d=json.load(open(DATA_PATH))
ring=[{k:r[k] for k in ['n','name','sub','scale','trad','sci','prac','q','short','sc']} for r in d['ring']]
data=json.dumps({'ring':ring,'centers':d['centers'],'koshas':d['koshas'],'stages':d['stages'],'principles':d['principles'],'rosetta':d['rosetta'],'sources':d['sources']},ensure_ascii=False)
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
# «Изнанка» (ES-модули v3) собирается в одну замкнутую область: import-строки убираются, export снимается
IZ_ORDER=['worlds/presets.js','worlds/generator.js','core/worldState.js','core/input.js','core/rupture.js','core/journey.js','audio/analyser.js','audio/audioEngine.js','visual/shaders.js','visual/visualEngine.js']
import re
def izsrc(f):
    src=open(f).read()
    src=re.sub(r'^import[^\n]*\n','',src,flags=re.M)
    return re.sub(r'^export (const|function|async function) ',r'\1 ',src,flags=re.M)
izjs='const IZ = (() => {\n"use strict";\n'+'\n'.join(izsrc('iznanka/'+f) for f in IZ_ORDER)+'\n'+izsrc('iz_main.js')+'\nreturn IZAPI;\n})();\n'
base=t.replace('__REFS__',refjs).replace('__ANAT__',open('anat.js').read()).replace('__MICRO__',open('micro.js').read()+'\n'+open('earth.js').read().replace('__PART2__',open('e2.js').read().replace('__PART3__',open('e3.js').read().replace('__PART4__',open('e4.js').read().replace('__PART5__',open('e5.js').read()))))+'\n'+open('abs.js').read()+'\n'+open('bh.js').read()+'\n'+izjs).replace('__ELV__',open('elv.js').read()).replace('__SOLAR__',open('solar.js').read().replace('__SUNDIVE__',open('sun.js').read()+'\n'+open('bodies.js').read()+'\n'+open('sleeper_data.js').read()+'\n'+open('dream.js').read())).replace('__CHRONO__',open('chrono_events.js').read()+'\n'+open('chrono.js').read()+'\n'+open('tree_info.js').read()+'\n'+open('tree.js').read()+'\n'+open('thought_data.js').read()+'\n'+open('thought.js').read()+'\n'+open('routes.js').read()+'\n'+open('search.js').read()+'\n'+open('compass.js').read()+'\n'+open('mine.js').read()+'\n'+open('dims_data.js').read()+'\n'+open('dims.js').read()+'\n'+open('bio_masks.js').read()+'\n'+open('bio_paleo.js').read()+'\n'+open('bio_data.js').read()+'\n'+open('bio_mech.js').read()+'\n'+open('bio_basics.js').read()+'\n'+open('bio.js').read()).replace('__EARTHLAND__',open('earth_land.js').read()).replace('__DATA__',data).replace('__MASK__',mask).replace('__BODYMETA__',open('ref/out/body_meta.json').read())
pub=base.replace('__SCRIPTS__',scripts('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/'))
open('astrolabia.html','w').write(pub)
prev=base.replace('requestAnimationFrame(t => { last = t; loop(t); });','window.__uv2s = (k, u, y) => { const R = stations[6].api.refs[k]; const w = R.pl.geometry.parameters.width; const v = new THREE.Vector3((u - .5)*w, (.5 - y)*w, 0); R.pl.localToWorld(v); v.project(camera); return [(v.x + 1)/2*innerWidth, (1 - v.y)/2*innerHeight]; }; window.__refS = k => { const R = stations[6].api.refs[k]; return JSON.stringify({s1:R.s1, s0:{id:R.s0.id,h:R.s0.h}, cur:[R.cur.x,R.cur.y], curT:[R.curT.x,R.curT.y]}); }; window.__refsReady = () => stations[6].api.refs.map(r => `${r.ready}:${r.fail}`); window.MICRO_DBG = MICRO; window.stations_dbg = stations[6].api.refs; window.EARTH_DBG = EARTH; window.MSC = mscene; window.__SCENE = scene; window.ST_ALL = stations; window.__CAMERA = camera; window.__BG = bgStars; window.__SOL = () => SOLAR; window.__pv = () => Music.planetOn(); window.__fade = () => ({astroF, zAstro, gSway:+gSway.toFixed(3), zStarRel:+zStarRel.toFixed(2), dust: zDustG ? zDustG.visible : null}); window.__zm = () => zm ? {t:zm.t, z:zProg(), jumped:zm.jumped} : null; window.__zmSet = f => { window.__zh = f; }; (function hold(){ if (zm && window.__zh != null) zm.t = window.__zh*zm.dur*0.995; requestAnimationFrame(hold); })(); window.__startTransit = d => startTransit(d); window.__slit = () => SLIT; window.__thPh = v => { B_DBG_PH = v; }; window.__cam = () => ({p:[camera.position.x,camera.position.y,camera.position.z], q:[camera.quaternion.x,camera.quaternion.y,camera.quaternion.z,camera.quaternion.w], pos, jId, zm:!!zm, s3:(()=>{const v=new THREE.Vector3().copy(stations[3].g.position).project(camera);return [v.x,v.y];})()}); window.__int = i => openInterior(i); window.__data = () => ST; window.__earth = () => openEarth(); window.__j = id => openJourney(id); window.__time = () => openTime(); window.__tree = id => openTree(id); window.__rt = () => RT; window.__srch = () => SRCH; window.__cht = () => CHT; window.__th = id => openThought(id); window.__cth = () => CTH; window.__cp = () => CP; window.__mus = () => Music; window.__mine = () => openMine(); window.__dims = n => openDims(n); window.__dm = () => DIMS; window.__bio = t => openBio(t); window.__bi = () => BIO; window.__jr = () => jrLoad(); window.__jrp = (a, b) => jrPrac(a, b); window.__jl = () => Object.fromEntries(Object.keys(JOURNEYS).map(k => { try { return [k, JOURNEYS[k].levels().map(v => v ? (v.kind === "kosha" ? "kosha:" + DATA.koshas[v.k].name : (v.name || v.short || v.kind)) : null)]; } catch(e){ return [k, String(e)]; } })); window.__chr = () => CHR.dbg; window.__br = b => setBranch(b); window.__depth = v => { depthT = v; depth = v; lastDepthInput = performance.now() + 1e9; }; window.__dbg = () => ({DMAX, JLlen:JL&&JL.length, depth, depthT, humanOpen, tr:!!tr, jId, jKind, jHist:jHist.join(","), pos, hoverI, pointerIn, travel, pos, target, diveT, ndc:[ndc.x,ndc.y], stNow:lastHoverI}); requestAnimationFrame(t => { last = t; loop(t); });').replace('__SCRIPTS__',scripts('node_modules/three/build/three.min.js','node_modules/three/examples/js/'))
prev=prev.replace('window.__int = ','window.__bh = () => ({dv: bhDv ? +bhDv.t.toFixed(2) : null, jId, hm:+hm.toFixed(2), open:humanOpen, iz:IZ.active, op:!!IZ.opaque, hole:BH.hole, zm: zm ? +zProg().toFixed(2) : null, gb:galBranch, depth:+depth.toFixed(2), cur:cur.className}); window.__bhGo = () => bhDiveStart(); window.__bhScale = v => BH.setScale(v); window.__curDbg = () => ({can: bhCanPoint(), pin: pointerIn, hole: BH.hole, menuOpen, tr: !!tr, hm, cls: cur.className}); window.__izOpen = () => izEnter(false); window.__izGen = () => IZ.debugGen(); window.__izState = () => IZ.debugState(); window.__int = ',1)
prev=prev.replace('get active() { return running; },','get active() { return running; }, debugGen(){ journey.arrive("light"); return director.begin(journey.next(director.state.from), { auto: true }); }, debugState(){ return { phase: director.state.phase, from: director.state.from, to: director.state.to, completed: journey.completed }; }, debugGoto(id){ return director.begin(id, { auto: true }); }, debugFast(id){ if (!director.begin(id, { auto: true })) return false; for (let i = 0; i < 300; i++) director.update(1, true); applyWorld(id); return true; },debugFamily(fam){ let id=null,g=null; for (let s=1;s<2000;s++){ g=generateWorld(s); if (g.family===fam){ id=\'dbgfam\'+fam+\'_\'+s; WORLDS[id]=g; break; } } if (!id) return false; return director.begin(id, { auto: true }); },')
prev=prev.replace('window.__izState = () => IZ.debugState();','window.__izState = () => IZ.debugState(); window.__izGoto = id => IZ.debugGoto(id); window.__izFast = id => IZ.debugFast(id); window.__izFamily = f => IZ.debugFamily(f);')
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
