import os, json, shutil
# Мастер-исходник — base.html (шаблон со всеми вписанными скриптами). Отдельные .js в src/ репозитория неполные.
libs=['shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/ShaderPass.js','postprocessing/UnrealBloomPass.js']
def scripts(threep, exp): return '\n'.join([f'<script src="{threep}"></script>']+[f'<script src="{exp}{l}"></script>' for l in libs])
ORIGIN = 'https://probuzhdenie-pied.vercel.app'  # при покупке домена — поменять здесь (и в vercel.json не нужно)
# Правообладатель и адрес для обращений — подставляются в «Правовую информацию», подвал меню и знак ©
OWNER = {'ru': 'Шатров Владимир Игоревич', 'en': 'Vladimir Igorevich Shatrov'}
MAIL = {'ru': '[e-mail для обращений]', 'en': '[contact e-mail]'}
GFONTS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Forum&family=Golos+Text:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap">'''
LEGAL_CSS = ':root{--night:#05060C;--ink:#EFE7D4;--muted:#A9A7BD;--faint:#6D6F90;--line:rgba(214,172,94,.28);--brass:#D6AC5E;--display:"Forum",Georgia,serif;--body:"Golos Text",system-ui,sans-serif;--mono:"JetBrains Mono",monospace}body{margin:0;background:var(--night);color:var(--ink);font:16px/1.6 var(--body)}main{max-width:800px;margin:0 auto;padding:48px 20px 80px}.back{font:500 11px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--brass);text-decoration:none}'
LEGAL_CSP = ('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'none\'; style-src \'self\' \'unsafe-inline\'; '
             'img-src \'self\' data:; font-src \'self\'; object-src \'none\'; base-uri \'self\'; form-action \'none\'">\n')
ASSET_DIRS = ('art/img', 'bsc', 'mbg', 'pano', 'strata', 'film', 'data', 'refimg')
def asset_version(root):
    import hashlib
    h = hashlib.sha1()
    for d in ASSET_DIRS:
        src = d if d == 'data' else os.path.join(root, d)   # data/bio.json берётся из исходников (в dist копируется позже)
        for dp, dn, fn in sorted(os.walk(src)):
            dn.sort()
            for f in sorted(fn):
                fp = os.path.join(dp, f); h.update(os.path.relpath(fp, src).encode()); h.update(open(fp, 'rb').read())
    return h.hexdigest()[:10]
def _re_assets(page, v):
    import re
    n = [0]
    def sub(m): n[0] += 1; return m.group(1) + 'v/' + v + '/' + m.group(2) + '/'
    out = re.sub(r'(["\'])(' + '|'.join(re.escape(d) for d in ASSET_DIRS) + r')/', sub, page)
    assert n[0] > 140, n[0]
    return out
def _ext_refimg(page, root):
    import re, base64
    m = re.search(r'const REFIMG = (\{.*?\});\n', page)
    d = json.loads(m.group(1)); os.makedirs(root + '/refimg', exist_ok=True); out = {}
    for k, v in d.items():
        mm = re.match(r'data:image/(webp|png);base64,(.*)', v, re.S); ext = mm.group(1)
        open(f'{root}/refimg/{k}.{ext}', 'wb').write(base64.b64decode(mm.group(2))); out[k] = f'refimg/{k}.{ext}'
    return page[:m.start(1)] + json.dumps(out) + page[m.end(1):]
def legal_page(base, lang):
    # статическая страница «Правовая информация» из того же <template id="tplLegal">, что и в приложении
    i = base.index('<template id="tplLegal">'); j = base.index('</template>', i)
    body = base[i + len('<template id="tplLegal">'):j]
    k = base.index('<style>'); css = base[k + 7:base.index('</style>', k)]
    lg = '\n'.join(l for l in css.split('\n') if l.startswith('.lg'))
    back = ('/en/', '← Back to the atlas', 'Legal information · Cosmolabe') if lang == 'en' else ('/', '← К атласу', 'Правовая информация · Космолябия')
    return (f'<!doctype html>\n<html lang="{lang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
            f'<title>{back[2]}</title>\n<meta name="robots" content="index,follow">\n' + LEGAL_CSP +
            f'<link rel="stylesheet" href="/fonts/fonts.css">\n'
            f'<style>{LEGAL_CSS}\n{lg}</style>\n</head>\n<body><main><a class="back" href="{back[0]}">{back[1]}</a>\n{body}\n</main></body>\n</html>\n')
def build(base, art, prevf, lang):
    base = base.replace('__OWNER__', OWNER[lang]).replace('__MAIL__', MAIL[lang])
    pub=base.replace('__SCRIPTS__',scripts('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/'))
    if lang == 'en':  # en.html в артефакте — отдельная страница: ей нужен свой каркас документа
        i = pub.index('<style>'); j = pub.index('</style>') + 8
        pub = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + pub[:j] + '\n</head>\n<body>\n' + pub[j:] + '\n</body>\n</html>\n'
    open(art,'w').write(pub)
    prev=base.replace('__SCRIPTS__',scripts('vendor/three.min.js','vendor/'))
    prev=prev.replace('requestAnimationFrame(t => { last = t; loop(t); });','window.__uv2s = (k, u, y) => { const R = stations[6].api.refs[k]; const w = R.pl.geometry.parameters.width; const v = new THREE.Vector3((u - .5)*w, (.5 - y)*w, 0); R.pl.localToWorld(v); v.project(camera); return [(v.x + 1)/2*innerWidth, (1 - v.y)/2*innerHeight]; }; window.__refS = k => { const R = stations[6].api.refs[k]; return JSON.stringify({s1:R.s1, s0:{id:R.s0.id,h:R.s0.h}, cur:[R.cur.x,R.cur.y], curT:[R.curT.x,R.curT.y]}); }; window.__refsReady = () => stations[6].api.refs.map(r => `${r.ready}:${r.fail}`); window.MICRO_DBG = MICRO; window.stations_dbg = stations[6].api.refs; window.EARTH_DBG = EARTH; window.MSC = mscene; window.__SCENE = scene; window.ST_ALL = stations; window.__CAMERA = camera; window.__BG = bgStars; window.__SOL = () => SOLAR; window.__pv = () => Music.planetOn(); window.__fade = () => ({astroF, zAstro, gSway:+gSway.toFixed(3), zStarRel:+zStarRel.toFixed(2), dust: zDustG ? zDustG.visible : null}); window.__zm = () => zm ? {t:zm.t, z:zProg(), jumped:zm.jumped} : null; window.__zmSet = f => { window.__zh = f; }; (function hold(){ if (zm && window.__zh != null) zm.t = window.__zh*zm.dur*0.995; requestAnimationFrame(hold); })(); window.__startTransit = d => startTransit(d); window.__slit = () => SLIT; window.__thPh = v => { B_DBG_PH = v; }; window.__cam = () => ({p:[camera.position.x,camera.position.y,camera.position.z], q:[camera.quaternion.x,camera.quaternion.y,camera.quaternion.z,camera.quaternion.w], pos, jId, zm:!!zm, s3:(()=>{const v=new THREE.Vector3().copy(stations[3].g.position).project(camera);return [v.x,v.y];})()}); window.__int = i => openInterior(i); window.__data = () => ST; window.__earth = () => openEarth(); window.__j = id => openJourney(id); window.__time = () => openTime(); window.__tree = id => openTree(id); window.__rt = () => RT; window.__srch = () => SRCH; window.__cht = () => CHT; window.__th = id => openThought(id); window.__cth = () => CTH; window.__cp = () => CP; window.__mus = () => Music; window.__mine = () => openMine(); window.__dims = n => openDims(n); window.__dm = () => DIMS; window.__bio = t => openBio(t); window.__bi = () => BIO; window.__jr = () => jrLoad(); window.__jrp = (a, b) => jrPrac(a, b); window.__jl = () => Object.fromEntries(Object.keys(JOURNEYS).map(k => { try { return [k, JOURNEYS[k].levels().map(v => v ? (v.kind === "kosha" ? "kosha:" + DATA.koshas[v.k].name : (v.name || v.short || v.kind)) : null)]; } catch(e){ return [k, String(e)]; } })); window.__chr = () => CHR.dbg; window.__br = b => setBranch(b); window.__depth = v => { depthT = v; depth = v; lastDepthInput = performance.now() + 1e9; }; window.__dbg = () => ({DMAX, JLlen:JL&&JL.length, depth, depthT, humanOpen, tr:!!tr, jId, jKind, jHist:jHist.join(","), pos, hoverI, pointerIn, travel, pos, target, diveT, ndc:[ndc.x,ndc.y], stNow:lastHoverI}); requestAnimationFrame(t => { last = t; loop(t); });').replace('__SCRIPTS__',scripts('node_modules/three/build/three.min.js','node_modules/three/examples/js/'))
    prev=prev.replace('window.__int = ','window.__bh = () => ({dv: bhDv ? +bhDv.t.toFixed(2) : null, jId, hm:+hm.toFixed(2), open:humanOpen, iz:IZ.active, op:!!IZ.opaque, hole:BH.hole, zm: zm ? +zProg().toFixed(2) : null, gb:galBranch, depth:+depth.toFixed(2), cur:cur.className}); window.__bhGo = () => bhDiveStart(); window.__bhScale = v => BH.setScale(v); window.__curDbg = () => ({can: bhCanPoint(), pin: pointerIn, hole: BH.hole, menuOpen, tr: !!tr, hm, cls: cur.className}); window.__izOpen = () => izEnter(false); window.__izGen = () => IZ.debugGen(); window.__izState = () => IZ.debugState(); window.__int = ',1)
    prev=prev.replace('window.__int = ','window.__goTo = i => goTo(i); window.__at = () => ATOM; window.__sm = () => SM_STATE; window.__bsc = () => BSC; window.__BIO = () => BIO; window.__openBio = t => openBio(t); window.__rt = s => RT.go(s); window.__br = b => setBranch(b); window.__dep = d => { depth = depthT = d; lastDepthInput = performance.now(); }; window.__int = ',1)
    prev=prev.replace('get active() { return running; },','get active() { return running; }, debugGen(){ journey.arrive("light"); return director.begin(journey.next(director.state.from), { auto: true }); }, debugState(){ return { phase: director.state.phase, from: director.state.from, to: director.state.to, completed: journey.completed }; }, debugGoto(id){ return director.begin(id, { auto: true }); }, debugFast(id){ if (!director.begin(id, { auto: true })) return false; for (let i = 0; i < 300; i++) director.update(1, true); applyWorld(id); return true; },debugFamily(fam){ let id=null,g=null; for (let s=1;s<2000;s++){ g=generateWorld(s); if (g.family===fam){ id=\'dbgfam\'+fam+\'_\'+s; WORLDS[id]=g; break; } } if (!id) return false; return director.begin(id, { auto: true }); },')
    prev=prev.replace('window.__izState = () => IZ.debugState();','window.__izState = () => IZ.debugState(); window.__izGoto = id => IZ.debugGoto(id); window.__izFast = id => IZ.debugFast(id); window.__izFamily = f => IZ.debugFamily(f);')
    open(prevf,'w').write('<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+prev+'</body></html>')
    DIST=os.environ.get('DIST')
    if not DIST: return
    if lang == 'en':
        DIST = DIST + '/en'; os.makedirs(DIST, exist_ok=True)
        base = base.replace('LANG_ALT = "@ru"', 'LANG_ALT = "/"')
    else:
        base = base.replace('LANG_ALT = "en.html"', 'LANG_ALT = "/en/"')
    head = open('head.txt' if lang == 'ru' else 'i18n/head_en.txt').read().replace('__ORIGIN__', ORIGIN)
    body = base.replace('__SCRIPTS__', scripts('/vendor/three.min.js', '/vendor/'))
    # на сайте шрифты — свои (/fonts), без обращений к серверам Google: посетители не передают им IP-адрес
    assert GFONTS in body; body = body.replace(GFONTS, '<link rel="stylesheet" href="/fonts/fonts.css">')
    os.makedirs(DIST + '/legal', exist_ok=True); open(DIST + '/legal/index.html', 'w').write(legal_page(base, lang))
    i = body.index('<style>')
    page = head + body[:i] + body[i:body.index('</style>')+8] + "\n</head>\n<body>\n" + body[body.index('</style>')+8:] + "\n</body>\n</html>\n"
    # v167: адреса картинок, панорам, пластов, фильмов и данных получают версию: v/<хеш>/pano/… (на Vercel — rewrite на /pano/…).
    # Браузер хранит их год и не перезапрашивает; при любой замене файла хеш меняется и все адреса обновляются.
    # v180: текстуры станции «Человек» (REFIMG, ~760 КБ base64) на сайте — отдельными файлами refimg/<ключ>.webp|png:
    # страница легче на четверть, скрипт разбирается быстрее, картинки кэшируются на год. В артефакте остаются встроенными.
    page = _ext_refimg(page, os.path.dirname(DIST) if lang == 'en' else DIST)
    page = _re_assets(page, asset_version(os.path.dirname(DIST) if lang == 'en' else DIST))
    # v166: политика безопасности (CSP). Разрешён только наш встроенный скрипт (по его хешу) и файлы с нашего сервера:
    # чужой код, внедрённый в страницу, браузер не выполнит. Хеш считается при каждой сборке — рассинхрона нет.
    import hashlib, base64, re as _re
    hs = ["'sha256-" + base64.b64encode(hashlib.sha256(m.encode('utf-8')).digest()).decode() + "'" for m in _re.findall(r'<script>(.*?)</script>', page, _re.S)]
    assert hs, 'no inline script'
    csp = ("default-src 'self'; script-src 'self' " + ' '.join(hs) + "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
           "media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; worker-src 'self' blob:; "
           "object-src 'none'; base-uri 'self'; form-action 'none'")
    assert page.count('<meta charset="utf-8">') == 1
    page = page.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + csp + '">', 1)
    open(DIST + '/index.html','w').write(page)
    # данные, вынесенные из страницы (силуэты и материки «Биосферы»), — рядом с index.html
    import shutil
    if lang == 'en': return  # данные общие: /en/ берёт их из корня через <base href="/">
    os.makedirs(DIST + '/data', exist_ok=True)
    shutil.copy('data/bio.json', DIST + '/data/bio.json')
    # sitemap и robots с парами языков (hreflang); адрес — ORIGIN выше
    alt = ''.join(f'    <xhtml:link rel="alternate" hreflang="{h}" href="{ORIGIN}{u}"/>\n' for h, u in (('ru', '/'), ('en', '/en/'), ('x-default', '/')))
    open(DIST + '/sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + ''.join(f'  <url>\n    <loc>{ORIGIN}{u}</loc>\n{alt}  </url>\n' for u in ('/', '/en/')) + '</urlset>\n')
    # v166: поиск разрешён, сбор материалов для обучения ИИ — нет (как и в пользовательском соглашении)
    AI = ['GPTBot', 'CCBot', 'Google-Extended', 'anthropic-ai', 'ClaudeBot', 'Claude-Web', 'Applebot-Extended', 'Bytespider', 'meta-externalagent', 'FacebookBot', 'Diffbot', 'omgili', 'Amazonbot', 'cohere-ai', 'Timpibot', 'ImagesiftBot', 'img2dataset']
    open(DIST + '/robots.txt', 'w').write(''.join(f'User-agent: {a}\n' for a in AI) + 'Disallow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: ' + ORIGIN + '/sitemap.xml\n')


import subprocess
build(open('base.html').read(), 'astrolabia.html', 'preview.html', 'ru')
# английская версия: i18n/build_en.py → i18n/base_en.html (правки кода + словарь en.json)
subprocess.run(['python3', 'i18n/build_en.py'], check=True)
en = open('i18n/base_en.html').read().replace('«', '“').replace('»', '”')
build(en, 'astrolabia_en.html', 'preview_en.html', 'en')