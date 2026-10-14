// ---- Слой «Биосфера» в фотореализме: вертикальный разрез «от кроны до камня» (сейба) ----
// Своё полотно WebGL1 под панелью погружения. Картинка — одна (день), плюс закат и ночь той же раскладки;
// карта maps.webp: R — глубина (Depth Anything), G — листва (качается), B — небо. Лупа натуралиста, нырок сквозь масштабы,
// солнце (день → закат → ночь), золотая схема Древа жизни на кроне. Шейдер маленький: на D3D11 собирается мгновенно.
const BSC = (() => {
  const BASE = "bsc/", AR = 2752/1536;
  const HOT = [
    { id:"leaf", u:.70, v:.105, r:.075, lv:0, chain:[
      { img:"lens_leaf_1", m:"basics:photo", t:"Лист на просвет", s:"≈ 5 см", tx:"Пальчатый лист сейбы. Жилки — водопровод и опора: вода поднимается сюда из почвы на 60 м вверх, её тянет испарение с листьев ●" },
      { img:"lens_leaf_2", t:"Устьица", s:"≈ 300 мкм", tx:"На изнанке листа — сотни устьиц на квадратный миллиметр. Две клетки-замыкающие открывают щель: внутрь входит CO₂, наружу уходят вода и кислород ●" },
      { img:"lens_leaf_3", m:"basics:cell", t:"Клетки с хлоропластами", s:"≈ 60 мкм", tx:"Столбчатые клетки листа набиты зелёными хлоропластами — по 20–100 в каждой ●" },
      { img:"lens_leaf_4", m:"mech:symb", t:"Хлоропласт", s:"≈ 5 мкм", tx:"Стопки мембран-тилакоидов — граны. В них хлорофилл ловит свет. Хлоропласт — потомок цианобактерии, которая больше миллиарда лет назад поселилась внутри клетки ●" },
      { img:"chl", mol:1, t:"Хлорофилл a", s:"≈ 1,5 нм", tx:"C₅₅H₇₂MgN₄O₅. В центре кольца — атом магния (зелёный), длинный хвост держит молекулу в мембране. Модель по атомам из PubChem ●", alt:{ img:"heme", t:"Гем", s:"≈ 1 нм", tx:"C₃₄H₃₂FeN₄O₄. То же порфириновое кольцо, но в центре железо (оранжевое) — оно держит кислород в гемоглобине вашей крови ●" } } ] },
    { id:"brom", u:.555, v:.415, r:.05, lv:1, chain:[
      { img:"lens_bromeliad", m:"mech:drift", t:"Бромелия: пруд на дереве", s:"≈ 15 см", tx:"В розетке листьев собирается дождь. В этой чашке живут личинки, головастики, бактерии — целая экосистема на высоте десятков метров ●" } ] },
    { id:"bark", u:.515, v:.49, r:.04, lv:1, chain:[
      { img:"lens_bark", m:"mech:moth", t:"Кора: мох и лишайники", s:"≈ 3 см", tx:"Серые и оранжевые корочки — лишайники, союз гриба и водоросли. Подушки мха держат воду, как губка ●" } ] },
    { id:"litter", u:.46, v:.676, r:.05, lv:2, chain:[
      { img:"lens_litter", m:"basics:cycle", t:"Подстилка", s:"≈ 3 см", tx:"Белые нити — гифы грибов: они растворяют лист снаружи ферментами. Рядом ногохвостка и клещ — тоже разложители ●" } ] },
    { id:"root", u:.60, v:.745, r:.05, lv:3, chain:[
      { img:"lens_root", t:"Кончик корня", s:"≈ 5 мм", tx:"Корневые волоски и тонкие белые нити грибов уходят в красную глину ●" },
      { img:"lens_myco", t:"Микориза внутри корня", s:"≈ 100 мкм", tx:"Окрашенный срез корня: внутри клеток — ветвистые арбускулы гриба, здесь дерево и гриб меняют сахар на фосфор. Круглые пузырьки — запасы гриба ●" } ] },
    { id:"down", u:.53, v:.955, r:.05, lv:3, act:"strata", t:"Вниз по корню — в Эпохи" }
  ];
  // золотая схема родства на ветвях кроны (u, v) — упрощено ◐
  const TOL = [
    { p:[[.515,.655],[.515,.42],[.515,.19]], l:"LUCA — общий предок · ≈ 4 млрд лет", at:[.535,.40], a:"start" },
    { p:[[.515,.19],[.42,.172],[.30,.158],[.16,.15]], l:"Бактерии", at:[.16,.138], a:"start" },
    { p:[[.515,.195],[.60,.205],[.70,.21],[.78,.212]], l:"Археи", at:[.70,.236], a:"middle" },
    { p:[[.60,.205],[.585,.16],[.57,.125]], l:"Эукариоты · ≈ 2 млрд лет", at:[.574,.168], a:"end" },
    { p:[[.57,.125],[.62,.095],[.67,.065],[.70,.045]], l:"Растения", at:[.665,.036], a:"middle" },
    { p:[[.57,.125],[.54,.095]], l:"", at:[0,0] },
    { p:[[.54,.095],[.49,.07],[.45,.05]], l:"Грибы", at:[.44,.045], a:"end" },
    { p:[[.54,.095],[.555,.06],[.56,.035]], l:"Животные", at:[.566,.072], a:"start" }
  ];
  let cv = null, gl = null, P = null, U = {}, built = false, failed = false, loaded = 0, loading = false;
  const T = {}, L = {};
  let A = 0, aim = 0, holdBlack = 0, dark = 0, darkAim = 0, sun = 0, sunAim = 0, sway = 0, vcS = -1, mob = false;
  let px = -1e4, py = -1e4, over = false, lastMove = 0, spd = 0, lensA = 0, hot = null, hotMix = 0, lensImg = null, lensImgPrev = null;
  let rect = [0, 0, 1, 1], free = [0, 0, 1, 1], W = 1, H = 1, DPR = 1, lv = 0;
  let dive = null, tolOn = false, tolA = 0;
  let ov, sunEl, lab, dv;
  const cb = { toStrata: () => { closeHuman(); openBio("now"); }, toHuman: () => { depthT = DMAX; lastDepthInput = performance.now(); } };
  const VS = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }";
  const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uD, uS, uN, uM, uL, uA, uB;
uniform vec2 uRes, uPar; uniform vec4 uRect, uLens, uDive, uDz; uniform float uT, uSun, uSway, uLensMix, uHasL, uDark, uMolA, uMolB, uDiveMix;
vec3 img(vec2 uv){ vec2 q = clamp(uv, vec2(.001), vec2(.999)); vec3 d = texture2D(uD, q).rgb, s = texture2D(uS, q).rgb, n = texture2D(uN, q).rgb;
  return uSun < .5 ? mix(d, s, uSun*2.) : mix(s, n, uSun*2. - 1.); }
vec2 warp(vec2 uv){ vec4 m = texture2D(uM, clamp(uv, vec2(.001), vec2(.999)));
  uv += uPar*(m.r - .45)*vec2(.010, .004);
  float w = m.g*uSway; uv.x += w*(sin(uT*1.3 + uv.y*42. + uv.x*13.)*.0011 + sin(uT*2.7 + uv.y*95.)*.0004); uv.y += w*sin(uT*1.6 + uv.x*55.)*.0005;
  uv.x += m.b*sin(uT*.07 + uv.y*3.)*.006;
  return uv; }
vec3 dsamp(sampler2D t, vec2 q, float mol){ vec4 c = texture2D(t, clamp(q, vec2(.0), vec2(1.)));
  float inb = step(0., q.x)*step(q.x, 1.)*step(0., q.y)*step(q.y, 1.);
  vec3 bg = vec3(.024, .027, .04)*(1.3 - .6*length(q - .5));
  return mol > .5 ? mix(bg, c.rgb, c.a*inb) : mix(bg, c.rgb, inb); }
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv0 = (px - uRect.xy)/uRect.zw, uv = warp(uv0);
  vec3 c = img(uv);
  float day = 1. - smoothstep(.05, .55, uSun);
  float ray = (sin(uv.x*26. - uv.y*14. + uT*.25)*.5 + .5)*(sin(uv.x*9. - uv.y*5. - uT*.17)*.5 + .5);
  c += day*vec3(1., .96, .85)*ray*ray*.07*smoothstep(.04, .14, uv.y)*(1. - smoothstep(.36, .62, uv.y))*(1. - texture2D(uM, clamp(uv, .001, .999)).b);
  float edge = smoothstep(-.02, .02, uv0.x)*smoothstep(1.02, .98, uv0.x);
  c *= .06 + .94*edge;
  c *= 1. - .5*(1. - smoothstep(0., 130.*uRes.y/900., px.y));
  c *= 1. - .55*smoothstep(.90, 1., uv0.y);
  if (uLens.z > 0.){
    vec2 q = (px - uLens.xy)/uLens.z; float r = length(q);
    if (r < 1.06){
      vec2 cu = (uLens.xy - uRect.xy)/uRect.zw;
      vec2 mu = cu + q*(1. - .12*r*r)*uLens.z/uRect.zw/2.4;
      vec3 lc = img(mu);
      if (uHasL > .5){ vec2 lq = .5 + q*.5*(1. - .1*r*r); lc = mix(lc, texture2D(uL, lq).rgb, uLensMix); }
      lc *= 1. - .28*pow(r, 5.);
      float e = smoothstep(1., .965, r);
      c = mix(c*.92, lc, e*uLens.w);
      c += vec3(1., .9, .72)*smoothstep(.035, .0, abs(r - .985))*.55*uLens.w;
      c *= 1. - .25*smoothstep(1.06, .99, r)*(1. - e)*uLens.w;
    }
  }
  if (uDive.z > 0.){
    float dd = length(px - uDive.xy), e = smoothstep(uDive.z, uDive.z - 3., dd);
    if (e > 0.){
      vec2 q = (px - uDive.xy)/uDive.w;
      vec3 a = dsamp(uA, .5 + q/uDz.x, uMolA), b = dsamp(uB, .5 + q/uDz.y, uMolB);
      vec3 dc = mix(a, b, uDiveMix);
      dc *= 1. - .35*smoothstep(.5, 1., dd/uDive.z);
      c = mix(c, dc, e);
      c += vec3(1., .88, .66)*smoothstep(2.5, 0., abs(dd - uDive.z))*.5*(1. - smoothstep(.97, 1., uDive.z/max(uRes.x, uRes.y)));
    }
  }
  c *= 1. - uDark;
  gl_FragColor = vec4(c, 1.);
}`;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
  function mkTex(im, mip){
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (mip){ gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return t;
  }
  const load = (src) => new Promise((ok, no) => { const im = new Image(); im.decoding = "async"; im.onload = () => ok(im); im.onerror = no; im.src = src; });
  function build(){
    if (built) return !failed; built = true;
    cv = document.createElement("canvas"); cv.className = "bsc-cv"; cv.setAttribute("aria-hidden", "true");
    gl = cv.getContext("webgl", { alpha:false, antialias:false, premultipliedAlpha:false, powerPreference:"high-performance" });
    if (!gl){ failed = true; return false; }
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error("[bsc]", gl.getShaderInfoLog(o)); return o; };
    P = gl.createProgram(); gl.attachShader(P, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(P, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(P);
    if (!gl.getProgramParameter(P, gl.LINK_STATUS)){ console.error("[bsc] link", gl.getProgramInfoLog(P)); failed = true; return false; }
    gl.useProgram(P);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(P, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["uD", "uS", "uN", "uM", "uL", "uA", "uB", "uRes", "uPar", "uRect", "uLens", "uDive", "uDz", "uT", "uSun", "uSway", "uLensMix", "uHasL", "uDark", "uMolA", "uMolB", "uDiveMix"].forEach(n => U[n] = gl.getUniformLocation(P, n));
    ["uD", "uS", "uN", "uM", "uL", "uA", "uB"].forEach((n, i) => gl.uniform1i(U[n], i));
    cv.addEventListener("webglcontextlost", e => { e.preventDefault(); failed = true; });
    ui();
    document.body.append(cv, ov, sunEl, lab, dv);
    return true;
  }
  function blank(){ const c = document.createElement("canvas"); c.width = c.height = 2; const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, 2, 2); return c; }
  function preload(){
    if (loading || !build() || failed) return; loading = true;
    mob = matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    const sfx = mob ? "_m" : "";
    const b0 = blank(); ["d", "s", "n", "m", "l", "a", "b"].forEach(k => T[k] = mkTex(b0, false));
    Promise.all([load(BASE + "master" + sfx + ".webp"), load(BASE + "maps.webp")]).then(([d, m]) => { T.d = mkTex(d, false); T.s = T.d; T.n = T.d; T.m = mkTex(m, false); loaded = 1;
      return Promise.all([load(BASE + "sunset" + sfx + ".webp"), load(BASE + "night" + sfx + ".webp")]); })
      .then(([s, n]) => { T.s = mkTex(s, false); T.n = mkTex(n, false); loaded = 2; sunEl.classList.add("ok"); })
      .catch(e => console.warn("[bsc] load", e));
  }
  function lensTex(name){
    if (L[name]) return L[name].t;
    L[name] = { t:null }; load(BASE + name + ".webp").then(im => { L[name].t = mkTex(im, true); }).catch(() => {});
    return null;
  }
  // ---- интерфейс поверх полотна ----
  function ui(){
    ov = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ov.setAttribute("class", "bsc-ov"); ov.setAttribute("viewBox", "0 0 1000 " + Math.round(1000*AR));
    const Y = v => (v*1000*AR).toFixed(1), X = u => (u*1000).toFixed(1);
    let s = `<g class="bsc-tol">`;
    TOL.forEach((b, i) => { s += `<path d="M${b.p.map(q => X(q[0]) + " " + Y(q[1])).join(" L")}" pathLength="1" style="--i:${i}"/>`; if (b.l) s += `<text x="${X(b.at[0])}" y="${Y(b.at[1])}" text-anchor="${b.a}" style="--i:${i}">${b.l}</text>`; });
    s += `<circle class="bsc-tol-h" cx="${X(.56)}" cy="${Y(.035)}" r="6"/><text class="bsc-tol-hl" x="${X(.548)}" y="${Y(.031)}" text-anchor="end">Человек · 300 тыс. лет</text></g>`;
    HOT.forEach(h => { s += `<circle class="bsc-hs" data-h="${h.id}" cx="${X(h.u)}" cy="${Y(h.v)}" r="${(h.r*1000*.45).toFixed(1)}"/>`; });
    s += `<text class="bsc-down" x="${X(.53)}" y="${Y(.93)}" text-anchor="middle">↓ вниз по корню — в Эпохи</text>`;
    ov.innerHTML = s;
    sunEl = document.createElement("div"); sunEl.className = "bsc-sun";
    sunEl.innerHTML = `<span class="mono">☀ время суток</span><input type="range" min="0" max="100" value="0" aria-label="Время суток: день, закат, ночь"><span class="mono bsc-sun-l"><i>день</i><i>закат</i><i>ночь</i></span>`;
    const rg = sunEl.querySelector("input");
    rg.addEventListener("input", () => { sunAim = rg.value/100; co2(); });
    sunEl.querySelectorAll("i").forEach((el, k) => el.onclick = () => { rg.value = k*50; sunAim = k*.5; co2(); });
    lab = document.createElement("div"); lab.className = "bsc-lab"; lab.setAttribute("aria-hidden", "true");
    dv = document.createElement("div"); dv.className = "bsc-dive"; dv.setAttribute("role", "dialog"); dv.setAttribute("aria-label", "Нырок сквозь масштабы");
    dv.innerHTML = `<div class="bsc-dv-h"><span class="mono bsc-dv-s"></span><b class="bsc-dv-t"></b></div><p class="bsc-dv-x"></p><div class="bsc-dv-b"><button data-a="up" data-hover>↑ крупнее</button><button data-a="dn" data-hover>глубже ↓</button><button data-a="mol" data-hover>Mg → Fe: гем крови</button><button data-a="mech" data-hover>⚙ опыт</button><button data-a="x" data-hover>✕ закрыть</button></div>`;
    dv.querySelectorAll("button").forEach(bt => bt.onclick = e => { e.stopPropagation(); const a = bt.dataset.a; if (a === "up") step(-1); else if (a === "dn") step(1); else if (a === "x") closeDive(); else if (a === "mol") morph(); else if (a === "mech"){ const it = dive.h.chain[dive.i]; if (it.m){ closeDive(); bscMech(it.m); } } });
    cv.addEventListener("pointermove", e => { const t = performance.now(); spd = Math.min(1, spd + Math.hypot(e.clientX - px, e.clientY - py)/180); px = e.clientX; py = e.clientY; over = true; lastMove = t; });
    cv.addEventListener("pointerleave", () => { over = false; });
    cv.addEventListener("pointerdown", e => { px = e.clientX; py = e.clientY; over = e.pointerType !== "touch"; });
    cv.addEventListener("click", e => { if (dive){ if (!dive.closing && dive.t >= 1) step(1); return; } px = e.clientX; py = e.clientY; const h = hitAt(px, py, e.pointerType === "touch" || mob ? 46 : 0); if (h) act(h, true); });
    addEventListener("wheel", e => { if (!dive || dive.closing) return; e.preventDefault(); e.stopImmediatePropagation(); const t = performance.now(); if (t - (dive.wl || 0) < 650) return; dive.wl = t; step(e.deltaY > 0 ? 1 : -1); }, { capture:true, passive:false });
    addEventListener("keydown", e => { if (dive && e.key === "Escape"){ e.stopImmediatePropagation(); closeDive(); } }, true);
  }
  function co2(){
    const el = document.getElementById("bscCO2"); if (!el) return;
    const s = sunAim, ph = Math.max(0, 1 - s*1.6), rs = .32;
    const tx = s < .25 ? "День: фотосинтез сильнее дыхания — лес поглощает CO₂ и выдыхает кислород ●" : s < .75 ? "Закат: света меньше, фотосинтез затихает — вдох и выдох леса почти уравновешены ●" : "Ночь: фотосинтеза нет, лес только дышит — отдаёт CO₂ и забирает кислород ●";
    el.querySelector(".bsc-co2-t").textContent = tx;
    el.querySelector(".bsc-co2-p").style.width = (ph*100).toFixed(0) + "%";
    el.querySelector(".bsc-co2-r").style.width = (rs*100).toFixed(0) + "%";
  }
  function hitAt(x, y, extra){
    let best = null, bd = 1e9;
    for (const h of HOT){ if (h.lv > lv + .6 || h.lv < lv - 1.6) continue;
      const sx = rect[0] + h.u*rect[2], sy = rect[1] + h.v*rect[3], r = h.r*rect[2] + (extra || 0), d = Math.hypot(x - sx, y - sy);
      if (d < r && d < bd){ bd = d; best = h; } }
    return best;
  }
  function act(h){
    if (h.act === "strata"){ goStrata(); return; }
    openDive(h, 0);
  }
  // ---- нырок ----
  function openDive(h, i){
    const it = h.chain[i];
    h.chain.forEach(c => { lensTex(c.img); if (c.alt) lensTex(c.alt.img); });
    const cx = over ? px : free[0] + free[2]/2, cy = over ? py : free[1] + free[3]/2;
    dive = { h, i, prev:i, t:1, o:0, oa:1, cx, cy, molB:false, mt:0, closing:false, dir:0 };
    lab.classList.remove("on"); fill(); dv.classList.add("on"); document.body.classList.add("bsc-diving");
  }
  function closeDive(){ if (!dive) return; dive.closing = true; dive.oa = 0; dv.classList.remove("on"); document.body.classList.remove("bsc-diving"); }
  function step(k){
    if (!dive || dive.closing) return;
    const n = dive.h.chain.length, j = dive.i + k;
    if (j < 0 || j >= n){ if (j < 0) closeDive(); return; }
    dive.prev = dive.i; dive.i = j; dive.t = 0; dive.dir = k; dive.molB = false; dive.mt = 0; fill();
  }
  function morph(){ if (!dive) return; dive.molB = !dive.molB; fill(); }
  function fill(){
    const it = dive.h.chain[dive.i], c = dive.molB && it.alt ? it.alt : it, n = dive.h.chain.length;
    dv.querySelector(".bsc-dv-s").textContent = `${dive.i + 1} / ${n} · ${c.s}`;
    dv.querySelector(".bsc-dv-t").textContent = c.t; dv.querySelector(".bsc-dv-x").textContent = c.tx;
    dv.querySelector('[data-a="up"]').disabled = false;
    dv.querySelector('[data-a="dn"]').style.display = dive.i < n - 1 ? "" : "none";
    const me = dv.querySelector('[data-a="mech"]'), mm = it.m ? it.m.split(":") : null, MM = mm ? (mm[0] === "basics" ? BIO_BASICS : BIO_MECH).find(x => x.id === mm[1]) : null;
    me.style.display = MM ? "" : "none"; if (MM) me.textContent = "⚙ опыт: " + MM.nm.toLowerCase();
    const mb = dv.querySelector('[data-a="mol"]'); mb.style.display = it.alt ? "" : "none"; mb.textContent = dive.molB ? "Fe → Mg: снова хлорофилл" : "Mg → Fe: гем крови";
    dv.querySelector('[data-a="up"]').textContent = dive.i > 0 ? "↑ крупнее" : "↑ к дереву";
  }
  function goStrata(){
    if (holdBlack) return;
    darkAim = 1; holdBlack = performance.now() + 2600;
    setTimeout(() => { if (cb.toStrata) cb.toStrata(); }, 1150);
  }
  function goHuman(){
    const h = HOT[0]; openDive(h, h.chain.length - 1);
    setTimeout(() => { if (dive && dive.h === h){ dive.molB = true; fill(); } }, 900);
    setTimeout(() => { closeDive(); if (cb.toHuman) cb.toHuman(); }, 4200);
  }
  function setTol(on){ tolOn = on; if (ov) ov.classList.toggle("tol", on); document.querySelectorAll("[data-bsctree]").forEach(b => { b.setAttribute("aria-pressed", String(on)); b.querySelector("b").textContent = on ? "Скрыть Древо жизни" : "Показать Древо жизни на кроне"; }); }
  // ---- кадр ----
  function vcAt(d, hf, hi){
    const top = .5*hf/hi, bot = 1 - .5*hf/hi, K = [[7, top], [8, .45], [9, .70], [10, bot]];
    if (d <= 7) return top; if (d >= 10) return bot;
    for (let i = 0; i < 3; i++){ const [a, va] = K[i], [b, vb] = K[i + 1]; if (d <= b){ const t = sm(0, 1, (d - a)/(b - a)); return Math.min(bot, Math.max(top, va + (vb - va)*t)); } }
    return bot;
  }
  function update(o){
    const now = performance.now();
    aim = o.on ? sm(6.3, 6.95, o.d) : 0;
    if (!o.on && !holdBlack && A < .002 && !dive){ if (cv && cv.style.display !== "none"){ cv.style.display = "none"; ov.style.display = "none"; sunEl.classList.remove("on"); lab.classList.remove("on"); } A = 0; return; }
    if (o.on && o.d > 5.4) preload();
    if (!built || failed) return;
    if (holdBlack && now > holdBlack){ holdBlack = 0; darkAim = 0; dark = 0; A = 0; vcS = -1; }
    const dt = Math.min(.05, o.dt || .016);
    A += ((holdBlack ? 1 : aim) - A)*Math.min(1, dt*(aim > A ? 3.2 : 5));
    if (!loaded) A = Math.min(A, .001);
    if (cv.style.display !== "block"){ cv.style.display = "block"; ov.style.display = "block"; }
    cv.style.opacity = A.toFixed(3); ov.style.opacity = (A*(dive ? 0 : 1)).toFixed(3);
    sunEl.classList.toggle("on", A > .6 && loaded > 1 && !dive && o.d > 6.8 && o.d < 9.6);
    W = innerWidth; H = innerHeight; mob = o.portrait || W <= 760;
    DPR = Math.min(1.5, devicePixelRatio || 1);
    const cw = Math.round(W*DPR), ch = Math.round(H*DPR); if (cv.width !== cw || cv.height !== ch){ cv.width = cw; cv.height = ch; }
    lv = Math.max(0, Math.min(3, o.d - 7));
    // место для картины: справа от панели (ПК) или над ней (телефон)
    let x0, Wi, xc, yc, hf;
    if (!mob){ const pw = Math.min(640, W*.5); free = [pw, 0, W - pw, H]; xc = pw + (W - pw)/2; Wi = Math.max((W - pw)*1.3, (xc - .55*pw)/.515); yc = H/2; hf = H; }
    else { free = [0, 0, W, H*.42]; xc = W/2; Wi = W*1.12; yc = H*.21; hf = H*.42; }
    const Hi = Wi*AR, vc = vcAt(o.d, hf, Hi);
    vcS = vcS < 0 ? vc : vcS + (vc - vcS)*Math.min(1, dt*6);
    const pxn = o.mx/W - .5, pyn = o.my/H - .5;
    x0 = xc - .515*Wi - (mob ? 0 : pxn*18); const y0 = yc - vcS*Hi - (mob ? 0 : pyn*10);
    rect = [x0, y0, Wi, Hi];
    ov.style.width = Wi + "px"; ov.style.height = Hi + "px"; ov.style.transform = `translate(${x0.toFixed(1)}px,${y0.toFixed(1)}px)`;
    tolA += ((tolOn && !dive ? 1 : 0) - tolA)*Math.min(1, dt*3);
    sun += (sunAim - sun)*Math.min(1, dt*2.2);
    spd *= Math.exp(-dt*1.6); sway = .35 + spd*1.8;
    dark += (darkAim - dark)*Math.min(1, dt*2.6);
    // лупа
    const lensOn = over && !mob && !dive && A > .5 && px > free[0] && now - lastMove < 6000;
    lensA += ((lensOn ? 1 : 0) - lensA)*Math.min(1, dt*8);
    document.body.classList.toggle("bsc-lens", lensA > .3);
    const h = lensOn ? hitAt(px, py, 30) : null;
    if (h !== hot){ hot = h; if (h && h.chain) h.chain.forEach(c => { lensTex(c.img); if (c.alt) lensTex(c.alt.img); }); }
    const img0 = hot && hot.chain ? hot.chain[0].img : null;
    if (img0){ lensImg = img0; lensTex(img0); }
    hotMix += (((img0 && L[img0] && L[img0].t) ? 1 : 0) - hotMix)*Math.min(1, dt*6);
    if (lensA > .02){
      const tl = hot ? (hot.act ? hot.t + " · клик" : hot.chain[0].t + (hot.chain.length > 1 ? " · клик — глубже" : " · клик — ближе")) : "";
      if (lab.textContent !== tl) lab.textContent = tl;
      lab.classList.toggle("on", !!tl && lensA > .5);
      lab.style.transform = `translate(${px.toFixed(0)}px,${(py + 104).toFixed(0)}px)`;
    } else lab.classList.remove("on");
    if (!ov._hs) ov._hs = [...ov.querySelectorAll(".bsc-hs")].map(c => [c, HOT.find(h => h.id === c.dataset.h)]);
    ov._hs.forEach(([c, h]) => { const sy = rect[1] + h.v*rect[3], sx = rect[0] + h.u*rect[2], vis = sy > free[1] + 20 && sy < free[1] + free[3] - 20 && sx > free[0] + 10 && Math.abs(h.lv - lv) < 1.3 && !tolA;
      c.classList.toggle("hot", !!hot && h === hot); c.classList.toggle("off", !vis); });
    ov.style.setProperty("--tol", tolA.toFixed(3));
    // нырок
    let dz = [1, 1], dmix = 0, dA = null, dB = null, molA = 0, molB = 0, dr = 0, dcx = 0, dcy = 0, dsz = 1;
    if (dive){
      dive.o += (dive.oa - dive.o)*Math.min(1, dt*(dive.oa ? 3.4 : 4.5));
      if (dive.closing && dive.o < .01){ dive = null; }
      else {
        dive.t = Math.min(1, dive.t + dt/1.15);
        const it = dive.h.chain[dive.i], pv = dive.h.chain[dive.prev];
        dcx = free[0] + free[2]/2; dcy = free[1] + free[3]/2;
        const big = Math.hypot(free[2], free[3])*.56, e = sm(0, 1, dive.o);
        const cx = dive.cx + (dcx - dive.cx)*e, cy = dive.cy + (dcy - dive.cy)*e; dcx = cx; dcy = cy;
        const r0 = dive.closing ? 0 : 90; dr = r0 + (big - r0)*e; dsz = Math.max(free[2], free[3])*.92;
        const q = sm(0, 1, dive.t), z = 5.5;
        const tA = dive.t < 1 && dive.prev !== dive.i ? pv : it;
        dive.mt += ((dive.molB ? 1 : 0) - dive.mt)*Math.min(1, dt*1.8);
        if (dive.t < 1 && dive.prev !== dive.i){
          const fwd = dive.dir > 0;
          dA = L[pv.img] && L[pv.img].t; dB = L[it.img] && L[it.img].t; molA = pv.mol ? 1 : 0; molB = it.mol ? 1 : 0;
          dz = fwd ? [1 + (z - 1)*q*q, 1/z + (1 - 1/z)*q] : [1 - (1 - 1/z)*q, z - (z - 1)*Math.sqrt(q)];
          dmix = sm(.25, .85, dive.t);
        } else {
          const alt = it.alt; dA = L[it.img] && L[it.img].t; molA = it.mol ? 1 : 0;
          if (alt){ dB = L[alt.img] && L[alt.img].t; molB = 1; dmix = dive.mt; dz = [1 + .15*dive.mt, 1.15 - .15*dive.mt]; }
          else { dB = dA; molB = molA; dmix = 0; dz = [1 + .03*Math.sin(now/2600), 1]; }
        }
        dz[0] *= 1 + .02*(1 - e);
      }
    }
    // отрисовка
    gl.viewport(0, 0, cw, ch);
    const bind = (i, t) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t || T.l); };
    bind(0, T.d); bind(1, T.s); bind(2, T.n); bind(3, T.m);
    const lt = lensImg && L[lensImg] && L[lensImg].t;
    bind(4, lt); bind(5, dA || T.l); bind(6, dB || dA || T.l);
    const k = DPR;
    gl.uniform2f(U.uRes, cw, ch); gl.uniform2f(U.uPar, mob ? 0 : pxn*2, mob ? 0 : pyn*2);
    gl.uniform4f(U.uRect, rect[0]*k, rect[1]*k, rect[2]*k, rect[3]*k);
    gl.uniform4f(U.uLens, px*k, py*k, lensA > .01 ? 92*k : 0, lensA);
    gl.uniform1f(U.uLensMix, hot ? hotMix : 0); gl.uniform1f(U.uHasL, lt ? 1 : 0);
    gl.uniform4f(U.uDive, dcx*k, dcy*k, dive ? dr*k : 0, dsz*k); gl.uniform4f(U.uDz, dz[0], dz[1], 0, 0);
    gl.uniform1f(U.uDiveMix, dmix); gl.uniform1f(U.uMolA, molA); gl.uniform1f(U.uMolB, molB);
    gl.uniform1f(U.uT, now/1000 % 600); gl.uniform1f(U.uSun, sun); gl.uniform1f(U.uSway, sway); gl.uniform1f(U.uDark, dark);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return {
    update, preload, cb, goStrata, goHuman, setTol, co2,
    get tol(){ return tolOn; },
    covers(){ return A > .995 && !failed; },
    get active(){ return A > .02; },
    dbg: { sun: v => { sunAim = v; }, dive: (id, i) => { const h = HOT.find(x => x.id === id); if (h) openDive(h, i || 0); }, step, at: (x, y) => { px = x; py = y; over = true; lastMove = performance.now(); }, st: () => ({ A, loaded, lv, hot: hot && hot.id, dive: dive && { i: dive.i, t: dive.t, o: dive.o }, rect }) }
  };
})();
