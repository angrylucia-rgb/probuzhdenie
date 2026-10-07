/* ---------- «Биосфера»: панорамы эпох (диорама вместо облака точек) ----------
   Пейзаж — несколько нарисованных слоёв на разной глубине (кодом на 2D-холсте; позже их заменят панорамы Люсии),
   земля, вода и разрез под водой — процедурные шейдеры; атмосфера — туман, лучи, споры, взвесь в воде.
   Существа (в bio.js) — рисунки или силуэты на своих местах, без перемещения, с микродвижением в шейдере.
   Объём даёт параллакс: камера чуть сдвигается за мышью / пальцем. Вся сцена — несколько плоскостей,
   поэтому она в десятки раз легче прежнего облака из 40 тысяч точек. */
const BIO_PANO = {
  carboniferous: {
    floor: -3.6, water: -3.62, shore: -0.6, cut: 5,
    sky: { top:[.05, .1, .1], mid:[.2, .3, .24], hor:[.58, .62, .42], sun:[1, .9, .62], sx:.66, sy:.5 },
    fog: [.34, .42, .35], ground: { a:[.11, .1, .06], b:[.19, .2, .1], moss:[.2, .3, .12] },
    waterCol: { top:[.16, .3, .24], deep:[.02, .07, .07] },
    bands: [
      { z:-46, seed:11, hz:.6, h:[.30, .52], n:46, kinds:["lep", "sig", "lep"], trunk:[.22, .27, .22], leaf:[.26, .36, .28], lod:0 },
      { z:-30, seed:23, hz:.4, h:[.34, .62], n:30, kinds:["lep", "sig", "cal"], trunk:[.24, .24, .18], leaf:[.24, .37, .22], lod:1 },
      { z:-18, seed:37, hz:.2, h:[.38, .76], n:18, kinds:["lep", "tf", "cal", "sig"], trunk:[.22, .19, .13], leaf:[.22, .38, .18], lod:2 },
      { z:-9, seed:51, hz:.05, h:[.55, .98], n:7, kinds:["lep", "cal", "tf"], trunk:[.18, .15, .1], leaf:[.2, .36, .16], lod:3 }
    ],
    clumps: [[-6.5, -2.6, 1.6], [6.2, -3.4, 1.9], [-2.4, -5.5, 1.3], [3.4, -1.4, 1.1], [-8.5, -4.5, 2], [8.8, -2, 1.7]],
    frame: true, fx: { spores: 260, shafts: true, mist: [-26, -14, -5], snow: 170 },
    // места существ: [код, x, y (для водных и летающих), z, высота, куда смотрит: 1 вправо / -1 влево]
    slots: [["arthr", -2.9, 0, -1.6, 2.6, 1], ["hylo", 1.2, 0, -.5, 1.3, -1], ["pulmo", 3.4, 0, -3.4, 1, -1], ["megan", 2.2, .4, -2.4, 1.5, -1],
      ["megan", -5.2, 2.6, -7, 1.2, 1], ["aqtet", -1.6, -4.85, 2.6, 2.1, 1], ["steth", 3.1, -5.15, 1.6, 1.5, -1]],
    camK: { y: -.8, look: -2.7, D: 13.5, Dp: 22 }
  }
};

const PANO = (() => {
  const TAU2 = Math.PI*2;
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; };
  const rgb = (c, k, a) => `rgba(${Math.round(Math.min(1, c[0]*(k || 1))*255)},${Math.round(Math.min(1, c[1]*(k || 1))*255)},${Math.round(Math.min(1, c[2]*(k || 1))*255)},${a == null ? 1 : a})`;
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
  const cv = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };

  // ---- растения карбона ----
  function leafTuft(g, x, y, r, col, R, n, up){
    g.strokeStyle = col; g.lineCap = "round";
    for (let i = 0; i < n; i++){ const a = (up ? -Math.PI/2 : 0) + (R() - .5)*(up ? 2.6 : TAU2), l = r*(.6 + R()*.5), droop = r*.35;
      g.lineWidth = Math.max(.6, r*.06); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a)*l*.6, y + Math.sin(a)*l*.6, x + Math.cos(a)*l, y + Math.sin(a)*l + droop); g.stroke(); }
  }
  function trunk(g, x, base, H, w0, w1, col, lit, lod, R, scars){
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w0/2, base); g.bezierCurveTo(x - w0*.45, base - H*.4, x - w1*.6, base - H*.8, x - w1/2, base - H); g.lineTo(x + w1/2, base - H); g.bezierCurveTo(x + w1*.6, base - H*.8, x + w0*.45, base - H*.4, x + w0/2, base); g.closePath(); g.fill();
    // корни-стигмарии расходятся у основания
    g.beginPath(); g.moveTo(x - w0*1.3, base); g.quadraticCurveTo(x - w0*.4, base - w0*.5, x, base - w0*.9); g.quadraticCurveTo(x + w0*.4, base - w0*.5, x + w0*1.3, base); g.fill();
    if (lod >= 1){ g.fillStyle = lit; g.beginPath(); g.moveTo(x + w0*.2, base); g.lineTo(x + w0*.48, base); g.lineTo(x + w1*.48, base - H); g.lineTo(x + w1*.15, base - H); g.fill(); }
    if (lod >= 2 && scars){ g.strokeStyle = "rgba(0,0,0,.22)"; g.lineWidth = Math.max(.5, w0*.035);
      const st = Math.max(4, w0*.28); for (let yy = base - st; yy > base - H*.97; yy -= st){ const t = (base - yy)/H, ww = w0 + (w1 - w0)*t;
        for (let k = -2; k <= 2; k++){ const cx = x + (k + ((yy/st | 0) % 2)*.5)*ww*.22; if (Math.abs(cx - x) > ww*.45) continue; g.beginPath(); g.moveTo(cx, yy - st*.45); g.lineTo(cx + ww*.08, yy); g.lineTo(cx, yy + st*.45); g.lineTo(cx - ww*.08, yy); g.closePath(); g.stroke(); } } }
  }
  function branch(g, x, y, a, l, w, d, col, leaf, R, lod){
    const x2 = x + Math.cos(a)*l, y2 = y + Math.sin(a)*l;
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a)*l*.5 + (R() - .5)*l*.2, y + Math.sin(a)*l*.5, x2, y2); g.stroke();
    if (d <= 0){ leafTuft(g, x2, y2, l*1.1, leaf, R, lod >= 2 ? 16 : 8, false); return; }
    const sp = .32 + R()*.18; branch(g, x2, y2, a - sp, l*.78, w*.7, d - 1, col, leaf, R, lod); branch(g, x2, y2, a + sp, l*.78, w*.7, d - 1, col, leaf, R, lod);
  }
  function tree(g, kind, x, base, H, P, R, k){
    const tc = rgb(P.trunk, k), lit = rgb(mix3(P.trunk, [.75, .7, .45], .25), k), lc = rgb(P.leaf, k*(.85 + R()*.3), .9), lod = P.lod;
    if (kind === "lep"){ const w0 = H*(.04 + R()*.025), w1 = w0*.55; trunk(g, x, base, H*.78, w0, w1, tc, lit, lod, R, true);
      branch(g, x, base - H*.78, -Math.PI/2 + (R() - .5)*.2, H*.1, w1*.9, lod >= 2 ? 4 : 3, tc, lc, R, lod); }
    else if (kind === "sig"){ const w0 = H*.05, w1 = w0*.8; trunk(g, x, base, H*.86, w0, w1, tc, lit, lod, R, lod >= 2);
      const top = base - H*.86; branch(g, x, top, -Math.PI/2 - .25, H*.05, w1*.7, 0, tc, lc, R, lod); branch(g, x, top, -Math.PI/2 + .25, H*.05, w1*.7, 0, tc, lc, R, lod); leafTuft(g, x, top, H*.13, lc, R, lod >= 2 ? 34 : 16, true); }
    else if (kind === "cal"){ const w0 = H*.022, nodes = 9 + (R()*5 | 0), seg = H/nodes; g.strokeStyle = tc; g.lineCap = "butt";
      for (let i = 0; i < nodes; i++){ const y0 = base - i*seg, t = i/nodes, ww = w0*(1 - t*.6); g.lineWidth = ww; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - seg + 1); g.stroke();
        if (i > 1){ g.strokeStyle = lc; g.lineWidth = Math.max(.6, ww*.18); const ln = seg*(.9 - t*.4); for (let j = 0; j < (lod >= 2 ? 12 : 6); j++){ const a = j/(lod >= 2 ? 12 : 6)*Math.PI; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + Math.cos(a)*ln, y0 - Math.sin(a)*ln*.35 + ln*.25); g.stroke(); g.beginPath(); g.moveTo(x, y0); g.lineTo(x - Math.cos(a)*ln, y0 - Math.sin(a)*ln*.35 + ln*.25); g.stroke(); } g.strokeStyle = tc; }
        if (lod >= 2){ g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x - ww/2, y0 - seg); g.lineTo(x + ww/2, y0 - seg); g.stroke(); g.strokeStyle = tc; } } }
    else { // древовидный папоротник (псарониус)
      const w0 = H*.04; trunk(g, x, base, H*.72, w0, w0*.7, tc, lit, lod, R, false); const tx = x, ty = base - H*.72;
      for (let f = 0; f < 11; f++){ const a = -Math.PI/2 + (f/10 - .5)*3.2 + (R() - .5)*.2, L = H*(.26 + R()*.1); g.strokeStyle = lc; g.lineWidth = Math.max(1, w0*.18);
        const ex = tx + Math.cos(a)*L, ey = ty + Math.sin(a)*L*.55 + L*.45, mx = tx + Math.cos(a)*L*.55, my = ty + Math.sin(a)*L*.55 - L*.15;
        g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
        if (lod >= 1){ g.lineWidth = Math.max(.6, w0*.08); for (let i = 1; i < 14; i++){ const t = i/14, px = (1 - t)*(1 - t)*tx + 2*(1 - t)*t*mx + t*t*ex, py = (1 - t)*(1 - t)*ty + 2*(1 - t)*t*my + t*t*ey, pl = L*.12*(1 - t*.7);
          g.beginPath(); g.moveTo(px, py); g.lineTo(px + pl*.5, py + pl); g.moveTo(px, py); g.lineTo(px - pl*.5, py + pl); g.stroke(); } } } }
  }
  function fern(g, x, base, H, col, R, n){
    g.strokeStyle = col; g.lineCap = "round";
    for (let f = 0; f < n; f++){ const a = -Math.PI/2 + (f/(n - 1) - .5)*2.6 + (R() - .5)*.25, L = H*(.6 + R()*.45), ex = x + Math.cos(a)*L, ey = base + Math.sin(a)*L*.7 + L*.35, mx = x + Math.cos(a)*L*.5, my = base + Math.sin(a)*L*.7 - L*.1;
      g.lineWidth = Math.max(1, H*.012); g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(mx, my, ex, ey); g.stroke(); g.lineWidth = Math.max(.7, H*.007);
      for (let i = 1; i < 22; i++){ const t = i/22, px = (1 - t)*(1 - t)*x + 2*(1 - t)*t*mx + t*t*ex, py = (1 - t)*(1 - t)*base + 2*(1 - t)*t*my + t*t*ey, pl = L*.11*Math.sin(Math.PI*Math.min(1, t*1.15));
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + pl*.7, py + pl*.6); g.moveTo(px, py); g.lineTo(px - pl*.7, py + pl*.6); g.stroke(); } }
  }
  // ---- холсты слоёв ----
  function paintBand(P, S){
    const W = 2048, H = 900, [c, g] = cv(W, H), R = rng(P.seed), base = H - 6;
    const items = []; for (let i = 0; i < P.n; i++) items.push({ x: (i + .2 + R()*.6)/P.n*W, k: P.kinds[(R()*P.kinds.length) | 0], h: (P.h[0] + R()*(P.h[1] - P.h[0]))*H, b: base - R()*H*.03 });
    items.sort((a, b) => a.h - b.h);
    for (const t of items) tree(g, t.k, t.x, t.b, t.h, P, R, .8 + R()*.35);
    // подлесок у основания
    const lc = rgb(P.leaf, .8, .95); for (let i = 0; i < P.n*3; i++) fern(g, R()*W, base + 4, H*(.04 + R()*.05)*(1 + P.lod*.25), lc, R, 7);
    // воздушная перспектива: дымка поверх, гуще у земли
    g.globalCompositeOperation = "source-atop";
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rgb(S.fog, 1, P.hz*.85)); gr.addColorStop(.7, rgb(S.fog, 1, P.hz)); gr.addColorStop(1, rgb(S.fog, 1, Math.min(1, P.hz + .25)));
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over";
    return c;
  }
  function paintSky(S){
    const W = 1024, H = 512, [c, g] = cv(W, H), K = S.sky;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rgb(K.top)); gr.addColorStop(.45, rgb(K.mid)); gr.addColorStop(.78, rgb(K.hor)); gr.addColorStop(1, rgb(mix3(K.hor, S.fog, .5)));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const sx = K.sx*W, sy = K.sy*H, s1 = g.createRadialGradient(sx, sy, 0, sx, sy, H*.75); s1.addColorStop(0, rgb(K.sun, 1, .75)); s1.addColorStop(.08, rgb(K.sun, 1, .4)); s1.addColorStop(.4, rgb(K.sun, 1, .12)); s1.addColorStop(1, rgb(K.sun, 1, 0));
    g.fillStyle = s1; g.fillRect(0, 0, W, H);
    const R = rng(7); for (let i = 0; i < 26; i++){ const y = H*(.25 + R()*.5), x = R()*W, rw = W*(.15 + R()*.3), rh = H*(.02 + R()*.04); const cg = g.createRadialGradient(x, y, 0, x, y, rw);
      cg.addColorStop(0, rgb(mix3(K.hor, [1, 1, 1], .2), 1, .1 + R()*.08)); cg.addColorStop(1, rgb(K.hor, 1, 0)); g.save(); g.translate(x, y); g.scale(1, rh/rw); g.translate(-x, -y); g.fillStyle = cg; g.fillRect(x - rw, y - rw, rw*2, rw*2); g.restore(); }
    return c;
  }
  function paintClump(S, seed, dark){
    const W = 512, H = 384, [c, g] = cv(W, H), R = rng(seed), col = dark ? "rgba(10,14,8,.96)" : rgb(mix3(S.ground.moss, [.3, .5, .2], .4), 1, .95);
    for (let i = 0; i < 4; i++) fern(g, W*(.3 + R()*.4), H - 2, H*(.55 + R()*.3), col, R, 9);
    if (!dark){ g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(255,240,170,.08)"; g.fillRect(W*.5, 0, W*.5, H); }
    return c;
  }
  function paintFrame(seed){
    const W = 1024, H = 1024, [c, g] = cv(W, H), R = rng(seed);
    for (let i = 0; i < 5; i++) fern(g, W*(.05 + R()*.25), H + 10, H*(.6 + R()*.35), "rgba(6,9,6,.97)", R, 6);
    g.strokeStyle = "rgba(8,10,7,.97)"; for (let i = 0; i < 3; i++){ const x = W*(.02 + R()*.18), nodes = 12; let y = H; for (let n = 0; n < nodes; n++){ g.lineWidth = 14 - n*.6; g.beginPath(); g.moveTo(x + n*1.5, y); g.lineTo(x + n*1.5 + 1, y - 70); g.stroke(); y -= 72;
      g.lineWidth = 2.2; for (let j = 0; j < 9; j++){ const a = j/9*Math.PI; g.beginPath(); g.moveTo(x + n*1.5, y); g.lineTo(x + n*1.5 + Math.cos(a)*60, y + 18 - Math.sin(a)*14); g.stroke(); } } }
    return c;
  }
  const NOISE = `float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a*vn(p); p = p*2.03 + 17.1; a *= 0.5; } return s; }`;
  const VB = `uniform float uT, uSway, uPh; varying vec2 vUv; varying float vD; varying vec3 vW;
void main(){ vUv = uv; vec3 p = position; float k = uv.y*uv.y; p.x += sin(uT*0.55 + uPh + position.x*0.13)*uSway*k + sin(uT*1.3 + position.x*0.7 + uPh)*uSway*0.25*k;
  vec4 w = modelMatrix*vec4(p, 1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
  const FB = `uniform sampler2D uTex; uniform float uA, uHaze, uK; uniform vec3 uFog; varying vec2 vUv; varying float vD;
void main(){ vec4 c = texture2D(uTex, vUv); float a = c.a*uA; if (a < 0.01) discard; vec3 col = mix(c.rgb*uK, uFog, uHaze); gl_FragColor = vec4(col, a); }`;
  const FG = NOISE + `uniform float uA, uT; uniform vec3 uFog, uGa, uGb, uMoss, uSky; uniform float uShore; varying vec3 vW; varying float vD;
void main(){ vec2 p = vW.xz; float n = fbm(p*0.35), m = fbm(p*0.9 + 5.0), q = fbm(p*0.18 + 9.0);
  if (vW.z > uShore + (n - 0.5)*2.4 + (fbm(p*1.7) - 0.5)*0.6) discard;
  vec3 col = mix(uGa, uGb, smoothstep(0.35, 0.7, n)); col = mix(col, uMoss, smoothstep(0.55, 0.78, m)*0.8);
  float pud = smoothstep(0.62, 0.66, q); vec3 wc = mix(uSky*0.75, uSky*1.05, 0.5 + 0.5*sin(vW.x*3.0 + uT*0.8 + n*8.0)); col = mix(col, wc, pud*0.85);
  col *= 0.85 + 0.3*fbm(p*4.0); float f = 1.0 - exp(-vD*0.028); col = mix(col, uFog, clamp(f, 0.0, 0.92));
  gl_FragColor = vec4(col, uA); }`;
  const FW = NOISE + `uniform float uA, uT; uniform vec3 uFog, uSky, uWt, uSun; varying vec3 vW; varying float vD;
void main(){ vec2 p = vW.xz; float r = fbm(vec2(p.x*0.9 + uT*0.12, p.y*2.2 - uT*0.18)), r2 = fbm(vec2(p.x*2.4 - uT*0.2, p.y*4.0));
  vec3 col = mix(uWt*0.55, uSky*0.75, 0.25 + 0.3*r); col *= 0.75 + 0.5*smoothstep(-0.5, -6.0, vW.z); float sp = smoothstep(0.72, 0.8, r2)*smoothstep(-2.0, 4.0, vW.x)*0.6; col += uSun*sp*0.35;
  float f = 1.0 - exp(-vD*0.018); col = mix(col, uFog, clamp(f, 0.0, 0.6)); gl_FragColor = vec4(col, 0.95*uA); }`;
  // подводная задняя стена и передний «разрез» (стекло аквариума)
  const FU = NOISE + `uniform float uA, uT, uTop; uniform vec3 uWt, uWd, uSun; varying vec3 vW; varying vec2 vUv;
void main(){ float d = clamp((uTop - vW.y)/3.2, 0.0, 1.0); vec3 col = mix(uWt, uWd, pow(d, 0.7));
  float cau = pow(abs(sin(vW.x*2.3 + fbm(vW.xy*1.4 + uT*0.25)*6.0 + uT*0.4)), 12.0)*(1.0 - d); col += uSun*cau*0.12;
  float roots = smoothstep(0.52, 0.5, abs(fract(vW.x*0.55 + fbm(vec2(vW.x*0.7, vW.y*0.6))*1.6) - 0.5)*2.0)*smoothstep(1.6, 0.2, uTop - vW.y)*0.0;
  float sed = smoothstep(uTop - 2.4, uTop - 3.0, vW.y); col = mix(col, vec3(0.09, 0.08, 0.05), sed*(0.6 + 0.4*fbm(vW.xy*3.0)));
  gl_FragColor = vec4(col, uA); }`;
  const FC = NOISE + `uniform float uA, uT, uTop; uniform vec3 uWt, uSun; varying vec3 vW;
void main(){ float d = clamp((uTop - vW.y)/3.0, 0.0, 1.0);
  float shaft = pow(max(0.0, sin(vW.x*0.8 + vW.y*0.35 + fbm(vec2(vW.x*0.3, uT*0.05))*3.0)), 18.0)*(1.0 - d)*0.5;
  float line = smoothstep(0.08, 0.0, uTop - vW.y);
  vec3 col = mix(uWt*1.2, uWt*0.35, d) + uSun*shaft*0.25 + vec3(0.7, 0.85, 0.75)*line*0.5;
  float a = (0.18 + 0.4*d + shaft*0.4 + line*0.5)*uA; gl_FragColor = vec4(col, a); }`;
  const FM = NOISE + `uniform float uA, uT, uK; uniform vec3 uFog; varying vec3 vW; varying vec2 vUv;
void main(){ float n = fbm(vec2(vW.x*0.12 + uT*0.03*uK, vW.y*0.35 + uK*7.0)), b = smoothstep(1.0, 0.0, vUv.y)*smoothstep(0.0, 0.12, vUv.y);
  float a = smoothstep(0.35, 0.8, n)*b*0.55*uA*(0.55 + uK*0.2); gl_FragColor = vec4(uFog*1.08, a); }`;
  const FS = `uniform float uA, uT; uniform vec3 uSun; varying vec3 vW; varying vec2 vUv;
void main(){ float s = pow(max(0.0, sin(vW.x*0.45 - vW.y*0.32 + sin(uT*0.07)*0.6)), 26.0) + 0.6*pow(max(0.0, sin(vW.x*0.21 - vW.y*0.16 + 1.7)), 30.0);
  float a = s*smoothstep(0.0, 0.6, vUv.y)*smoothstep(1.0, 0.7, vUv.y)*0.16*uA; gl_FragColor = vec4(uSun, a); }`;
  const VP = `attribute float aS, aPh; uniform float uT, uPR, uWet; varying float vA;
void main(){ vec3 p = position; p.x += sin(uT*0.23 + aPh*6.0)*0.6; p.y += sin(uT*0.31 + aPh*9.0)*0.35 - (uWet > 0.5 ? mod(uT*0.05 + aPh, 1.0)*0.6 : 0.0); p.z += cos(uT*0.19 + aPh*4.0)*0.4;
  vec4 mv = modelViewMatrix*vec4(p, 1.0); gl_PointSize = (uWet > 0.5 ? 2.0 : 3.2)*(0.6 + aS)*uPR*(18.0/max(-mv.z, 1.0)); gl_Position = projectionMatrix*mv;
  vA = uWet > 0.5 ? 0.35 + 0.3*aS : (0.35 + 0.65*pow(0.5 + 0.5*sin(uT*(0.8 + aS*1.7) + aPh*30.0), 3.0)); }`;
  const FP = `uniform vec3 uC; uniform float uA; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d); if (r > 0.25) discard; gl_FragColor = vec4(uC, vA*uA*smoothstep(0.25, 0.0, r)); }`;

  function build(id, cam){
    const S = BIO_PANO[id]; if (!S) return null;
    const grp = new THREE.Group(), U = { uT:{ value:0 }, uA:{ value:0 }, uPR:{ value:Math.min(2, devicePixelRatio || 1) } }, V3 = c => new THREE.Vector3(c[0], c[1], c[2]);
    const fogV = { value:V3(S.fog) }, sun = { value:V3(S.sky.sun) }, wt = { value:V3(S.waterCol.top) }, wd = { value:V3(S.waterCol.deep) }, skyR = { value:V3(mix3(S.sky.hor, S.sky.mid, .3)) };
    const disp = [];
    const mat = (vs, fs, uni, o) => { const m = new THREE.ShaderMaterial(Object.assign({ vertexShader: vs, fragmentShader: fs, uniforms: Object.assign({}, U, uni), transparent: true, depthWrite: false }, o || {})); disp.push(m); return m; };
    const tex = c => { const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; disp.push(t); return t; };
    const plane = (w, h, sx, sy) => { const g = new THREE.PlaneGeometry(w, h, sx || 1, sy || 1); disp.push(g); return g; };
    const VS = `varying vec2 vUv; varying float vD; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
    const CZ = 16, wid = z => 2*Math.tan(20*Math.PI/180)*(CZ - z)*2.6 + 14;
    // небо
    const sky = new THREE.Mesh(plane(wid(-90), wid(-90)*.5), mat(VS, FB, { uTex:{ value:tex(paintSky(S)) }, uHaze:{ value:0 }, uFog:fogV, uK:{ value:1 } }));
    sky.position.set(0, 14, -90); sky.renderOrder = -10; grp.add(sky);
    // земля и вода
    const gm = new THREE.Mesh(plane(220, 140), mat(VS, FG, { uFog:fogV, uGa:{ value:V3(S.ground.a) }, uGb:{ value:V3(S.ground.b) }, uMoss:{ value:V3(S.ground.moss) }, uSky:skyR, uShore:{ value:S.shore } }, { depthWrite: true, transparent: true }));
    gm.rotation.x = -Math.PI/2; gm.position.set(0, S.floor, S.shore + 1.8 - 70); gm.renderOrder = -8; grp.add(gm);
    if (S.water != null){
      const wl = S.cut - S.shore + 4, wm = new THREE.Mesh(plane(220, wl), mat(VS, FW, { uFog:fogV, uSky:skyR, uWt:wt, uSun:sun }, { depthWrite: true }));
      wm.rotation.x = -Math.PI/2; wm.position.set(0, S.water, S.cut - wl/2); wm.renderOrder = -9; grp.add(wm);
      const back = new THREE.Mesh(plane(220, 12), mat(VS, FU, { uTop:{ value:S.water }, uWt:wt, uWd:wd, uSun:sun }, { depthWrite: true }));
      back.position.set(0, S.water - 6, S.shore - .2); back.renderOrder = -7; grp.add(back);
      const cut = new THREE.Mesh(plane(220, 12), mat(VS, FC, { uTop:{ value:S.water }, uWt:wt, uSun:sun }));
      cut.position.set(0, S.water - 6, S.cut); cut.renderOrder = 900; grp.add(cut);
    }
    // полосы леса: стоят на земле на своей глубине
    S.bands.forEach((P, i) => { const w = wid(P.z), h = w*900/2048, m = new THREE.Mesh(plane(w, h, 24, 6), mat(VB, FB, { uTex:{ value:tex(paintBand(P, S)) }, uHaze:{ value:0 }, uFog:fogV, uK:{ value:1 }, uSway:{ value:.06 + i*.05 }, uPh:{ value:i*1.7 } }));
      m.position.set(0, S.floor - .25 + h/2 - h*6/900, P.z); m.renderOrder = -6 + i*.1 + (P.z + 60)*.01; grp.add(m); });
    // кусты папоротников у берега
    const ct = tex(paintClump(S, 99, false));
    S.clumps.forEach(([x, z, s], i) => { const m = new THREE.Mesh(plane(s*1.33, s, 8, 4), mat(VB, FB, { uTex:{ value:ct }, uHaze:{ value:Math.min(.5, Math.max(0, -z*.02)) }, uFog:fogV, uK:{ value:.9 + (i % 3)*.08 }, uSway:{ value:.08 }, uPh:{ value:i } }));
      m.position.set(x, S.floor + s/2 - .05, z); m.scale.x = i % 2 ? -1 : 1; m.renderOrder = 1000 + z*10; grp.add(m); });
    // тёмная рамка из листьев на переднем плане
    if (S.frame){ const ft = tex(paintFrame(5)); [-1, 1].forEach(sd => { const m = new THREE.Mesh(plane(6.5, 6.5, 8, 8), mat(VB, FB, { uTex:{ value:ft }, uHaze:{ value:0 }, uFog:fogV, uK:{ value:1 }, uSway:{ value:.12 }, uPh:{ value:sd } }));
      m.position.set(sd*7.6, S.floor - .4, 8.5); m.scale.x = sd < 0 ? 1 : -1; m.renderOrder = 1500; grp.add(m); }); }
    // туман, лучи
    (S.fx.mist || []).forEach((z, i) => { const m = new THREE.Mesh(plane(wid(z), 7), mat(VS, FM, { uFog:fogV, uK:{ value:i } })); m.position.set(0, S.floor + 2.6, z); m.renderOrder = -5.5 + (z + 60)*.012 + (z > -12 ? 1100 : 0); grp.add(m); });
    if (S.fx.shafts){ const m = new THREE.Mesh(plane(60, 22), mat(VS, FS, { uSun:sun }, { blending: THREE.AdditiveBlending })); m.position.set(4, 4, -15); m.renderOrder = -5; grp.add(m); }
    // споры-светлячки над болотом и взвесь в воде
    const pts = (n, wet, c) => { const P = new Float32Array(n*3), aS = new Float32Array(n), aPh = new Float32Array(n), R = rng(wet ? 3 : 4);
      for (let i = 0; i < n; i++){ P[i*3] = (R()*2 - 1)*13; P[i*3 + 1] = wet ? S.water - .2 - R()*2.6 : S.floor + .2 + R()*5.5; P[i*3 + 2] = wet ? S.shore + .3 + R()*(S.cut - S.shore - .5) : -12 + R()*13; aS[i] = R(); aPh[i] = R(); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("aS", new THREE.BufferAttribute(aS, 1)); g.setAttribute("aPh", new THREE.BufferAttribute(aPh, 1)); disp.push(g);
      const p = new THREE.Points(g, mat(VP, FP, { uC:{ value:V3(c) }, uWet:{ value:wet ? 1 : 0 } }, { blending: THREE.AdditiveBlending })); p.frustumCulled = false; p.renderOrder = wet ? 880 : 1200; grp.add(p); };
    if (S.fx.spores) pts(S.fx.spores, false, [1, .9, .45]);
    if (S.fx.snow && S.water != null) pts(S.fx.snow, true, [.75, .9, .8]);
    grp.visible = false;
    return { grp, S, update(T, A){ U.uT.value = T; U.uA.value = A; grp.visible = A > .004; }, dispose(){ disp.forEach(d => d.dispose()); } };
  }
  return { build, has: id => !!BIO_PANO[id] };
})();

/* ---------- панорамы-картины Люсии: изображение + карта глубины (Depth Anything V2) ----------
   wl — линия воды (доля высоты сверху; null — суша); fx — эффекты поверх; slots — существа в координатах картинки:
   [код, u (0…1 слева), v (0…1 сверху: для наземных — ступни, для водных и летающих — центр), размер (доля высоты картинки), направление]. */
const BIO_PIMG = {
  hadean:{ wl:null, fx:["ember", "haze"], slots:[] },
  archean:{ wl:.36, fx:["plankton", "vent", "rays"], vent:[.79, .7], slots:[] },
  goe:{ wl:.32, fx:["bubbles", "rust", "rays"], slots:[] },
  boring:{ wl:.55, fx:["plankton", "rays"], slots:[] },
  snowball:{ wl:null, fx:["snow", "frost"], slots:[] },
  ediacaran:{ wl:.33, fx:["plankton", "rays"], slots:[["charn", 0.74, .8, 0.24, 1], ["dick", 0.64, .9, 0.12, 1], ["kimb", 0.56, .93, 0.08, -1], ["sprig", 0.83, .91, 0.08, -1]] },
  cambrian:{ wl:.15, fx:["plankton", "rays"], slots:[["anom", 0.52, .44, 0.22, 1], ["opab", 0.67, .56, 0.11, -1], ["pika", 0.47, .64, 0.11, 1], ["marr", 0.58, .72, 0.07, 1], ["haik", 0.74, .36, 0.08, -1],
    ["hall", 0.62, .88, 0.08, 1], ["trilo", 0.75, .9, 0.09, -1], ["wiwa", 0.85, .93, 0.08, -1]] },
  ordovician:{ wl:.24, fx:["plankton", "rays"], slots:[["ortho", 0.49, .43, 0.22, 1], ["astra", 0.60, .34, 0.08, -1], ["sacab", 0.69, .56, 0.11, -1], ["isot", 0.64, .9, 0.11, 1], ["trilo", 0.54, .92, 0.08, -1]] },
  silurian:{ wl:.64, fx:["plankton", "mist"], slots:[["guiyu", 0.52, .8, 0.11, 1], ["euryp", 0.62, .87, 0.12, -1], ["ptery", 0.74, .78, 0.21, -1]] },
  devonian:{ wl:.62, fx:["plankton", "mist", "motes"], slots:[["ichth", 0.54, .585, 0.11, 1], ["tikt", 0.64, .615, 0.11, -1], ["acan", 0.74, .6, 0.09, -1],
    ["eusth", 0.55, .86, 0.11, 1], ["clado", 0.67, .76, 0.11, -1], ["dunk", 0.80, .83, 0.20, -1]] },
  carboniferous:{ wl:.67, fx:["spores", "mist", "plankton"], slots:[["megan", 0.68, .3, 0.15, -1], ["megan", 0.79, .17, 0.11, 1], ["pulmo", 0.60, .645, 0.07, 1], ["arthr", 0.66, .64, 0.12, 1],
    ["hylo", 0.76, .645, 0.08, -1], ["aqtet", 0.57, .86, 0.12, 1], ["steth", 0.78, .82, 0.11, -1]] },
  permian:{ wl:.5, fx:["dust", "haze"], slots:[["estem", 0.47, .445, 0.1, 1], ["inos", 0.53, .465, 0.13, 1], ["dimet", 0.6, .45, 0.13, -1], ["edaph", 0.78, .485, 0.11, -1], ["scut", 0.85, .5, 0.11, -1],
    ["meso", 0.54, .8, 0.11, 1], ["helic", 0.68, .74, 0.15, -1]] },
  triassic:{ wl:.6, fx:["motes", "plankton", "rays"], slots:[["posto", 0.51, .535, 0.12, 1], ["coelo", 0.60, .515, 0.11, 1], ["lystr", 0.68, .52, 0.11, -1], ["thrin", 0.74, .55, 0.07, -1], ["morga", 0.77, .56, 0.07, -1],
    ["eorap", 0.80, .51, 0.09, -1], ["herre", 0.85, .53, 0.12, -1], ["eudim", 0.66, .2, 0.11, 1], ["notho", 0.56, .8, 0.15, 1], ["shoni", 0.75, .78, 0.24, -1]] },
  jurassic:{ wl:.61, fx:["motes", "plankton", "rays"], scale:"Крупные динозавры — в одном масштабе (как будто на одном расстоянии); мелкие юрамайя и анхиорнис — на ветках у самого зрителя.",
    slots:[["brach", .13, .525, .30, 1], ["diplo", .3, .522, .34, 1], ["stego", .42, .545, .125, -1], ["allo", .82, .548, .118, -1],
    ["rhamp", .47, .18, .09, 1], ["archx", .74, .3, .055, -1], ["jurama", .55, .6, .1, 1], ["anchi", .92, .582, .13, -1],
    ["ichsa", .2, .74, .12, 1], ["plesi", .52, .8, .18, 1], ["liopl", .8, .77, .32, -1]] }
};
const PIMG = (() => {
  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`;
  const FI = `uniform sampler2D uTex, uDep; uniform vec2 uPar; uniform vec4 uR; uniform float uA, uT, uWl, uK; varying vec2 vUv;
void main(){ vec2 q = (vUv - uR.xy)/uR.zw, qc = clamp(q, 0.0, 1.0); float out_ = max(abs(q.y - qc.y)*uR.w/uR.z*2.357, abs(q.x - qc.x)*2.357);
  float d = texture2D(uDep, qc).r; vec2 uv = qc - uPar*(d - 0.3)*uK;
  if (out_ > 0.002){ uv = vec2(qc.x, clamp(qc.y, 0.004, 0.996)); vec3 e = vec3(0.0); for (int i = -4; i <= 4; i++) e += texture2D(uTex, vec2(uv.x + float(i)*0.03, uv.y + (uv.y > 0.5 ? -0.03 : 0.03))).rgb; e /= 9.0;
    gl_FragColor = vec4(mix(e*0.8, vec3(0.02, 0.024, 0.047), smoothstep(0.0, 0.055, out_)), uA); return; }
  if (uWl > 0.0 && uv.y < 1.0 - uWl){ float w = (1.0 - uWl - uv.y); uv.x += sin(uv.y*140.0 + uT*1.3)*0.00045*smoothstep(0.0, 0.05, w); uv.y += sin(uv.x*90.0 + uT*0.9)*0.0003*smoothstep(0.0, 0.05, w); }
  vec3 c = texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb; c *= 0.97 + 0.03*sin(uT*0.35);
  c = mix(c, vec3(0.02, 0.024, 0.047), smoothstep(0.0, 0.16, out_));
  gl_FragColor = vec4(c, uA); }`;
  const VP = `attribute float aS, aPh; uniform float uT, uPR, uK, uY0, uY1; varying float vA;
void main(){ vec3 p = position; float h = uY1 - uY0, t = 0.0;
  if (uK < 0.5){ p.x += sin(uT*0.21 + aPh*6.0)*0.5; p.y += sin(uT*0.29 + aPh*9.0)*0.3; }                         // пылинки, споры
  else if (uK < 1.5){ t = fract(aPh + uT*(0.05 + aS*0.05)); p.y = uY0 + t*h; p.x += sin(uT*1.7 + aPh*20.0)*0.05; }   // пузырьки вверх
  else if (uK < 2.5){ t = fract(aPh - uT*(0.03 + aS*0.03)); p.y = uY0 + t*h; p.x += sin(uT*0.5 + aPh*12.0)*0.35; }   // снег, ржавчина, «морской снег» вниз
  else { t = fract(aPh + uT*(0.03 + aS*0.04)); p.y = uY0 + t*h; p.x += sin(uT*0.8 + aPh*14.0)*0.25; }                // искры вверх
  vec4 mv = modelViewMatrix*vec4(p, 1.0); gl_PointSize = (1.4 + 2.4*aS)*uPR*(18.0/max(-mv.z, 1.0)); gl_Position = projectionMatrix*mv;
  vA = (uK > 2.5 ? (1.0 - t) : uK > 0.5 && uK < 2.5 ? smoothstep(0.0, 0.1, t)*smoothstep(1.0, 0.85, t) : 1.0)*(0.35 + 0.65*pow(0.5 + 0.5*sin(uT*(0.7 + aS) + aPh*30.0), 2.0)); }`;
  const FP = `uniform vec3 uC; uniform float uA; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d); if (r > 0.25) discard; gl_FragColor = vec4(uC, vA*uA*smoothstep(0.25, 0.0, r)); }`;
  const FM = `uniform float uA, uT, uK; uniform vec3 uC; varying vec2 vUv;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a*vn(p); p = p*2.03 + 17.1; a *= 0.5; } return s; }
void main(){ float n = fbm(vec2(vUv.x*5.0 + uT*0.02*(1.0 + uK), vUv.y*3.0 + uK*5.0)); float b = smoothstep(0.0, 0.5, vUv.y)*smoothstep(1.0, 0.55, vUv.y);
  gl_FragColor = vec4(uC, smoothstep(0.42, 0.85, n)*b*0.4*uA); }`;
  const FR = `uniform float uA, uT; uniform vec3 uC; varying vec2 vUv;
void main(){ float x = vUv.x*7.0 - vUv.y*1.8; float s = pow(max(0.0, sin(x + sin(uT*0.11)*0.7)), 22.0) + 0.6*pow(max(0.0, sin(x*0.53 + 1.9 + sin(uT*0.07))), 26.0);
  gl_FragColor = vec4(uC, s*smoothstep(0.0, 0.45, vUv.y)*0.18*uA); }`;
  const FX = { ember:["E", [1, .55, .22]], dust:["D", [1, .85, .6]], motes:["D", [1, .95, .7]], spores:["D", [1, .9, .45]], snow:["S", [.95, .97, 1]], bubbles:["B", [.85, .97, 1]],
    plankton:["P", [.8, .95, .85]], rust:["R", [1, .55, .25]], vent:["V", [.9, .95, .9]], haze:["M", [.6, .35, .25]], mist:["M", [.75, .85, .75]], frost:["M", [.9, .95, 1]], rays:["Y", [.85, 1, .9]] };
  function build(id, base){
    const C = BIO_PIMG[id]; if (!C) return null;
    const grp = new THREE.Group(), disp = [], U = { uT:{ value:0 }, uA:{ value:0 }, uPR:{ value:Math.min(2, devicePixelRatio || 1) } };
    const st = { ok:false, dep:null, dw:0, dh:0, rect:null, par:new THREE.Vector2() };
    const mk = (vs, fs, uni, o) => { const m = new THREE.ShaderMaterial(Object.assign({ vertexShader: vs, fragmentShader: fs, uniforms: Object.assign({}, U, uni), transparent: true, depthWrite: false, depthTest: false }, o || {})); disp.push(m); return m; };
    const ld = new THREE.TextureLoader(), tI = ld.load(base + id + ".webp", () => { st.ok = true; }), tD = ld.load(base + id + "_d.webp");
    [tI, tD].forEach(t => { t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; disp.push(t); });
    const di = new Image(); di.onload = () => { const c = document.createElement("canvas"); c.width = di.naturalWidth; c.height = di.naturalHeight; const x = c.getContext("2d"); x.drawImage(di, 0, 0); st.dep = x.getImageData(0, 0, c.width, c.height).data; st.dw = c.width; st.dh = c.height; }; di.src = base + id + "_d.webp";
    const IU = { uTex:{ value:tI }, uDep:{ value:tD }, uPar:{ value:st.par }, uWl:{ value:C.wl || 0 }, uK:{ value:.022 }, uR:{ value:new THREE.Vector4(0, 0, 1, 1) } };
    const img = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mk(VS, FI, IU)); img.renderOrder = -20; grp.add(img); disp.push(img.geometry);
    const R = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; })(id.length*97);
    const fx = [];
    for (const f of C.fx){ const [k, col] = FX[f] || []; if (!k) continue;
      if (k === "M" || k === "Y"){ const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mk(VS, k === "M" ? FM : FR, { uC:{ value:new THREE.Vector3(...col) }, uK:{ value:fx.length } }, k === "Y" ? { blending: THREE.AdditiveBlending } : {})); m.renderOrder = k === "Y" ? -15 : 5; grp.add(m); disp.push(m.geometry); fx.push({ k, f, o:m }); continue; }
      const n = { E:260, D:180, S:420, B:260, P:220, R:300, V:160 }[k], P = new Float32Array(n*3), aS = new Float32Array(n), aPh = new Float32Array(n);
      for (let i = 0; i < n; i++){ aS[i] = R(); aPh[i] = R(); P[i*3] = R(); P[i*3 + 1] = R(); P[i*3 + 2] = R(); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P.slice(), 3)); g.setAttribute("aS", new THREE.BufferAttribute(aS, 1)); g.setAttribute("aPh", new THREE.BufferAttribute(aPh, 1)); disp.push(g);
      const kind = { D:0, P:0, B:1, V:1, S:2, R:2, E:3 }[k], o = new THREE.Points(g, mk(VP, FP, { uC:{ value:new THREE.Vector3(...col) }, uK:{ value:kind }, uY0:{ value:0 }, uY1:{ value:1 } }, { blending: THREE.AdditiveBlending }));
      o.frustumCulled = false; o.renderOrder = 6; grp.add(o); fx.push({ k, f, o, P }); }
    // глубина в точке картинки (u, v сверху) → 0…1, ближе = больше
    const depthAt = (u, v) => { if (!st.dep) return .5; const x = Math.min(st.dw - 1, Math.max(0, u*st.dw | 0)), y = Math.min(st.dh - 1, Math.max(0, v*st.dh | 0)); return st.dep[(y*st.dw + x)*4]/255; };
    // раскладка: картинка «вписывается с обрезкой» в область сцены (на телефоне — над карточкой), с запасом под параллакс
    // раскладка: плоскость закрывает весь экран; картинка — прямоугольник внутри неё. ПК: ширина ≈ ширина экрана, при открытом тексте
    // правый край прижат к краю экрана (левая часть уходит под текст), при свёрнутом — по центру; сверху и снизу — мягкое продолжение в темноту.
    // Телефон: картинка во всю высоту области сцены, палец водит её вбок. fold: 0 — текст открыт, 1 — свёрнут; left — правый край текста (доля ширины).
    function layout(cam, port, Z, pan, fold, left, tilt){
      const un = (x, y) => new THREE.Vector3(x, y, .5).unproject(cam).sub(cam.position).normalize();
      const at = (x, y) => { const d = un(x, y), t = (Z - cam.position.z)/d.z; return cam.position.clone().addScaledVector(d, t); };
      const a = at(-1, -1), b = at(1, 1), rw = b.x - a.x, rh = b.y - a.y, A = 3168/1344;
      img.scale.set(rw*1.02, rh*1.02, 1); img.position.set((a.x + b.x)/2, (a.y + b.y)/2, Z);
      let W, H, cx, cy;
      if (port){ H = rh*(.48 + .26*fold); W = H*A; cx = (a.x + b.x)/2 + (W - rw)*.5*(pan || 0); cy = (b.y - rh*.235)*(1 - fold) + ((a.y + b.y)/2 + rh*.03)*fold; }
      else { // ПК: картинка крупно (чуть выше экрана), курсор водит по ней: у левого края виден левый край картины, у правого — правый
        H = rh*1.12; W = H*A; if (W < rw*1.15){ W = rw*1.15; H = W/A; }
        const L = a.x + rw*(left || 0)*(1 - fold), xl = L + W/2, xr = b.x - W/2, t = ((pan || 0) + 1)/2;
        cx = xl + (xr - xl)*t; cy = (a.y + b.y)/2 + (H - rh)*.5*(tilt || 0); }
      const pw = rw*1.02, ph = rh*1.02, px0 = img.position.x - pw/2, py0 = img.position.y - ph/2;
      IU.uR.value.set((cx - W/2 - px0)/pw, (cy - H/2 - py0)/ph, W/pw, H/ph);
      const r = st.rect = { x0: cx - W/2, y1: cy + H/2, W, H, Z };
      const wly = C.wl ? r.y1 - C.wl*H : r.y1 - H;
      for (const F of fx){
        if (F.k === "M" || F.k === "Y"){ const wet = F.k === "Y" && C.wl && C.wl < .5 || F.f === "rays" && C.wl;
          const y0 = F.k === "Y" ? (wet ? r.y1 - H : wly) : (C.wl ? wly : r.y1 - H*.95), y1 = F.k === "Y" ? (wet ? wly : r.y1) : y0 + H*(F.f === "haze" ? .55 : .3);
          F.o.scale.set(W, Math.abs(y1 - y0), 1); F.o.position.set(cx, (y0 + y1)/2, Z + .1); continue; }
        const wet = F.k === "B" || F.k === "P" && C.wl || F.k === "V" || F.k === "R" && C.wl, y0 = wet ? r.y1 - H : (C.wl ? wly : r.y1 - H), y1 = wet ? (C.wl ? wly : r.y1) : r.y1;
        const P = F.P, pos = F.o.geometry.attributes.position, A2 = pos.array, vx = C.vent;
        for (let i = 0; i < P.length/3; i++){ A2[i*3] = F.k === "V" && vx ? r.x0 + (vx[0] + (P[i*3] - .5)*.03)*W : r.x0 + P[i*3]*W; A2[i*3 + 1] = y0 + P[i*3 + 1]*(y1 - y0); A2[i*3 + 2] = Z + .3 + P[i*3 + 2]*2.5; }
        pos.needsUpdate = true; const u = F.o.material.uniforms; u.uY0.value = F.k === "V" && vx ? r.y1 - vx[1]*H : y0; u.uY1.value = y1; }
      return r;
    }
    grp.visible = false;
    return { grp, C, st, img: true, depthAt, layout,
      toWorld(u, v){ const r = st.rect; return r ? [r.x0 + u*r.W, r.y1 - v*r.H] : [0, 0]; },
      shift(u, v){ const r = st.rect; if (!r) return [0, 0]; const d = depthAt(u, v); return [st.par.x*(d - .3)*IU.uK.value*r.W, st.par.y*(d - .3)*IU.uK.value*r.H]; },
      update(T, A, px, py){ U.uT.value = T; U.uA.value = A*(st.ok ? 1 : 0); st.par.set(px, py); grp.visible = U.uA.value > .004; },
      dispose(){ disp.forEach(d => d.dispose()); } };
  }
  return { build, has: id => !!BIO_PIMG[id] };
})();
