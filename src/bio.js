/* ---------- «Биосфера» (13а: каркас) ----------
   Своя сцена Three.js на #bioCv. Навигация — «Пласты камня»: колонна справа, колесо/стрелки — вниз, вглубь времени.
   Пласт сначала показан как порода с окаменелостями; потом частицы «поднимаются» из камня и собираются в живых
   существ («окаменелость → жизнь»), вокруг проявляется среда эпохи (море, болотный лес).
   Существа строятся из масок силуэтов BIO_MASK (RLE): точки выбираются по маске, объём — по расстоянию до края. */
const BIO = (() => {
  const box = $("chBio"), sky = $("bioSky"), rcv = $("bioRock"), cvs = $("bioCv"), lab = $("bioLab"), cardEl = $("bioCard"), scr = $("bioScroll"), colEl = $("bioCol");
  const NE = BIO_ERAS.length;
  let open = false, built = false, rend, scn, cam, raf = 0, last = 0, W3 = 0, H3 = 0, DPR3 = 1, ctx2;
  let fc = 0, cmp = false, cmpK = null, cmpInfo = null, skyWas = -1, rockOff = 0, cur = -1, view = null, life = 0, lifeT = 0, lifeAt = 0, trn = null, hov = -1, sel = -1, ptr = { x: -1, y: -1, nx: 0, ny: 0, in: false };
  const smooth = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
  const hex3 = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const ERA_C = BIO_ERAS.map(e => hex3(e.col));

  // ---- маски → точки ----
  function decode(k){
    const [W, H, b64] = BIO_MASK[k], raw = atob(b64), M = new Uint8Array(W*H);
    let i = 0, p = 0, on = 0;
    while (i < raw.length){ let v = 0, s = 0, c; do { c = raw.charCodeAt(i++); v |= (c & 127) << s; s += 7; } while (c > 127);
      if (on) M.fill(1, p, p + v); p += v; on ^= 1; }
    return { W, H, M };
  }
  function dist(W, H, M){
    const D = new Float32Array(W*H); for (let i = 0; i < W*H; i++) D[i] = M[i] ? 1e3 : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : D[y*W + x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){ const i = y*W + x; if (M[i]) D[i] = Math.min(D[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.4, at(x + 1, y - 1) + 1.4); }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--){ const i = y*W + x; if (M[i]) D[i] = Math.min(D[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.4, at(x - 1, y + 1) + 1.4); }
    return D;
  }
  const POOL = 4200, SPC = {};
  function species(k){
    if (SPC[k]) return SPC[k];
    const S = BIO_SP[k] || { rot:0 }, { W, H, M } = decode(k), D = dist(W, H, M);
    const ins = [], edg = []; let dm = 1;
    for (let i = 0; i < W*H; i++){ if (!M[i]) continue; if (D[i] <= 1.5) edg.push(i); else ins.push(i); if (D[i] > dm) dm = D[i]; }
    const LM = new Float32Array(W*H), TM = new Float32Array(W*H), RR = 4;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){ let m = 0; for (let k = -RR; k <= RR; k++){ const xx = x + k; if (xx >= 0 && xx < W && D[y*W + xx] > m) m = D[y*W + xx]; } TM[y*W + x] = m; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){ let m = 0; for (let k = -RR; k <= RR; k++){ const yy = y + k; if (yy >= 0 && yy < H && TM[yy*W + x] > m) m = TM[yy*W + x]; } LM[y*W + x] = m; }
    const r = (S.rot || 0)*Math.PI/180, cr = Math.cos(r), sr = Math.sin(r);
    const th = new Float32Array(POOL), u = new Float32Array(POOL), v = new Float32Array(POOL), d = new Float32Array(POOL), e = new Uint8Array(POOL), sg = new Float32Array(POOL);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let j = 0; j < POOL; j++){
      const isE = edg.length && (Math.random() < .16 || !ins.length), L = isE ? edg : ins, idx = L[(Math.random()*L.length) | 0];
      const px = idx % W + Math.random() - W/2, py = -((idx/W | 0) + Math.random() - H/2);
      const rx = px*cr - py*sr, ry = px*sr + py*cr;
      u[j] = rx; v[j] = ry; d[j] = Math.pow(D[idx]/dm, .6); e[j] = isE ? 1 : 0; sg[j] = Math.random() < .5 ? -1 : 1; th[j] = 1 - smooth(2.2, 5.5, LM[idx]);
      x0 = Math.min(x0, rx); x1 = Math.max(x1, rx); y0 = Math.min(y0, ry); y1 = Math.max(y1, ry);
    }
    const cx = (x0 + x1)/2, cy = (y0 + y1)/2, sc = 1/Math.max(x1 - x0, y1 - y0, 1);
    for (let j = 0; j < POOL; j++){ u[j] = (u[j] - cx)*sc; v[j] = (v[j] - cy)*sc; }
    return SPC[k] = { u, v, d, e, sg, th, ar: (x1 - x0)/Math.max(1, y1 - y0), fill: (ins.length + edg.length)/(W*H) };
  }
  // миниатюра силуэта для карточек (золото на прозрачном)
  const THUMB = {};
  function thumb(k, w, h){
    const key = k + w + "x" + h; if (THUMB[key]) return THUMB[key];
    if (!BIO_MASK[k]){ const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
      x.strokeStyle = "rgba(214,172,94,.45)"; x.setLineDash([4, 4]); x.strokeRect(w*.3, h*.12, w*.4, h*.76); x.fillStyle = "rgba(214,172,94,.6)"; x.font = `${Math.round(h*.4)}px Forum, serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("?", w/2, h/2);
      return THUMB[key] = c.toDataURL(); }
    const { W, H, M } = decode(k), c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
    const S = BIO_SP[k] || {}, r = (S.rot || 0)*Math.PI/180, f = S.face === -1 ? -1 : 1;
    const t = document.createElement("canvas"); t.width = W; t.height = H; const tx = t.getContext("2d"), im = tx.createImageData(W, H);
    for (let i = 0; i < W*H; i++) if (M[i]){ im.data[i*4] = 255; im.data[i*4 + 1] = 214; im.data[i*4 + 2] = 150; im.data[i*4 + 3] = 255; }
    tx.putImageData(im, 0, 0);
    const bw = Math.abs(W*Math.cos(r)) + Math.abs(H*Math.sin(r)), bh = Math.abs(W*Math.sin(r)) + Math.abs(H*Math.cos(r)), sc = Math.min(w/bw, h/bh)*.92;
    x.translate(w/2, h/2); x.scale(sc*f, sc); x.rotate(-r); x.drawImage(t, -W/2, -H/2);
    return THUMB[key] = c.toDataURL();
  }

  // ---- шейдеры: вся анимация на видеокарте; процессор каждый кадр передаёт лишь несколько чисел на существо ----
  const CV = `attribute float aE; attribute float aDel; attribute float aSg; attribute float aR; attribute float aTh;
uniform float uT, uPR, uS, uF, uTilt, uLife, uAnim, uAl, uPlant, uAct, uPh, uFa, uHov;
uniform vec3 uC, uFos, uCol, uStone;
varying vec3 vColor; varying float vAlpha;
void main(){
  float u = position.x, v = position.y, d = position.z;
  float ca = cos(uFa), sa = sin(uFa);
  vec3 fp = vec3(uFos.x + (u*ca - v*sa)*uS*0.92, uFos.y + (u*sa + v*ca)*uS*0.92, uFos.z);
  float k = uLife <= 0.0 ? 0.0 : smoothstep(aDel, aDel + 0.45, uLife);
  vec3 p = fp, col = uStone; float a, sz = 1.0;
  if (k > 0.0){
    float lx = u*uS, ly = v*uS;
    if (uAnim > 0.5 && uAnim < 1.5) ly += 0.07*uS*sin(u*9.0 - uT*(2.0 + 3.0*uAct) + uPh)*(0.35 + abs(u))*(0.3 + 0.7*uAct);
    else if (uAnim > 1.5 && uAnim < 2.5) ly += aE*0.045*uS*sin(u*12.0 - uT*(1.5 + 2.5*uAct) + uPh) + 0.012*uS*sin(u*5.0 - uT*1.6 + uPh);
    else if (uAnim > 5.5) lx += 0.045*uS*(v + 0.5)*(v + 0.5)*sin(uT*0.45 + uPh) + 0.008*uS*(v + 0.5)*sin(uT*1.7 + u*4.0 + uPh);
    float br = 1.0 + 0.014*sin(uT*1.3 + uPh);
    vec2 q = vec2(lx*uF*br, ly*br);
    float ct = cos(uTilt), st = sin(uTilt); q = vec2(q.x*ct - q.y*st, q.x*st + q.y*ct);
    if (uAnim > 4.5 && uAnim < 5.5) q += (vec2(aR, fract(aR*7.13)) - 0.5)*0.022*uS*aTh;
    vec3 lp = vec3(uC.x + q.x, uC.y + q.y, uC.z + aSg*d*0.16*uS*(uPlant > 0.5 ? 0.5 : 1.0));
    p = mix(fp, lp, k); p.z += sin(3.14159*k)*0.9*(aSg*0.3 + 0.7);
    vec3 lc = uCol*(0.5 + 0.5*d + aE*0.25);
    col = mix(uStone, lc, k);
    a = (aE > 0.5 ? 0.75 : 0.55 + 0.35*d)*(uPlant > 0.5 ? 0.85 : 1.0)*(0.55 + 0.45*k) + (k < 1.0 ? sin(3.14159*k)*0.4 : 0.0);
    if (uAnim > 2.5 && uAnim < 4.5) a *= 1.0 + aTh*0.7*max(0.0, sin(uT*4.0 - u*26.0 + uPh))*(0.35 + 0.65*uAct);
    if (uAnim > 4.5 && uAnim < 5.5){ a *= mix(1.0, 0.55 + 0.75*abs(sin(uT*9.0 + aR*60.0 + u*8.0)), aTh); sz += aTh*0.2; col = mix(col, vec3(0.85, 0.97, 1.0), aTh*0.35*k); }
    a *= 0.88 + 0.12*sin(uT*2.0 + aR*40.0);
  } else a = aE > 0.5 ? 0.62 : 0.2 + 0.18*d;
  a *= uAl*(1.0 + uHov*0.35);
  vec4 mv = modelViewMatrix*vec4(p, 1.0); float dd = -mv.z;
  gl_PointSize = min(1.2*(0.8 + aE*0.25)*sz*uPR*(40.0/max(dd, 0.6)), 40.0*uPR);
  gl_Position = projectionMatrix*mv;
  vColor = col; vAlpha = a*smoothstep(0.3, 2.5, dd);
}`;
  const EV = `attribute vec3 aCol; attribute float aS; attribute float aPh; attribute float aTy; attribute float aSz;
uniform float uT, uPR, uA, uPort;
varying vec3 vColor; varying float vAlpha;
void main(){
  vec3 p = position; float a = 0.5, sz = aSz;
  if (aTy < 0.5){ p.y = mod(position.y + 3.6 - uT*0.08*(0.5 + aS), 10.0) - 3.6; p.x += sin(uT*0.3 + aPh)*0.15; a = 0.22 + 0.3*aS; }
  else if (aTy < 1.5){ float w = sin(uT*0.6 + aPh*1.7); a = 0.06 + 0.08*w*w + 0.05*(1.0 - aS); }
  else if (aTy < 2.5){ a = 0.32 + 0.3*aS; }
  else if (aTy < 3.5){ p.x += sin(uT*0.8 + aPh)*0.04*aS; a = 0.35 + 0.28*aS; }
  else if (aTy < 4.5){ a = 0.2 + 0.25*aS*(0.6 + 0.4*sin(uT*1.5 + aPh)); }
  else if (aTy < 5.5){ p.x += sin(uT*0.12 + aPh)*0.6; a = 0.07 + 0.08*aS; }
  else if (aTy < 6.5){ p.x += sin(uT*0.6 + aPh + p.y*0.8)*0.22*aS*aS; a = 0.3 + 0.3*aS; }
  else if (aTy < 7.5){ p.y += sin(uT*0.4 + aPh)*0.3; p.x += cos(uT*0.3 + aPh)*0.3; a = 0.3 + 0.5*max(0.0, sin(uT*1.6 + aPh*3.0)); }
  else if (aTy < 8.5){ float tr = mod(uT*(0.5 + 0.7*aS) + aPh*8.0, 8.0); p.y += tr; p.x += sin(uT*2.2 + aPh*5.0)*0.05; a = 0.55*(1.0 - smoothstep(5.5, 8.0, tr))*smoothstep(0.0, 0.3, tr); }
  else if (aTy < 9.5){ float tr = mod(uT*0.22*(0.6 + 0.6*aS) + aPh*5.0, 5.0); p.y += tr; p.x += (aS - 0.5)*tr*0.5 + sin(uT*0.5 + aPh)*0.1*tr; a = 0.32*(1.0 - tr/5.0)*smoothstep(0.0, 0.4, tr); sz *= 1.0 + tr*0.35; }
  else if (aTy < 10.5){ float tr = mod(uT*(0.35 + 0.5*aS) + aPh*6.0, 6.0); p.y += tr; p.x += sin(uT*1.3 + aPh*7.0)*0.25*tr/6.0; a = 0.8*(1.0 - tr/6.0)*(0.6 + 0.4*sin(uT*9.0 + aPh*40.0)); }
  else if (aTy < 12.5){ p.x += sin(uT*0.07 + aPh*1.3)*1.4 + sin(uT*0.3 + aPh)*0.05; p.y += cos(uT*0.05 + aPh*2.1)*0.9; a = 0.42*(0.6 + 0.4*aS); }
  else if (aTy < 13.5){ a = (0.3 + 0.5*aS)*(0.55 + 0.45*sin(uT*1.4 + position.x*0.9 + aPh)); }
  else { float t = mod(uT + aPh*9.0, 9.0); p += vec3(-1.0, -0.42, 0.0)*(t*7.0 - aS*0.9); a = t < 1.4 ? (1.0 - aS)*(1.0 - t/1.4) : 0.0; }
  a *= (0.78 + 0.22*sin(uT*1.3 + aPh*30.0))*uA*1.3;
  vec4 mv = modelViewMatrix*vec4(p, 1.0); float dd = -mv.z;
  gl_PointSize = min(2.1*sz*uPR*(40.0/max(dd, 0.6)), 40.0*uPR);
  gl_Position = projectionMatrix*mv;
  vec2 sc = gl_Position.xy/gl_Position.w;
  a *= uPort > 0.5 ? smoothstep(-0.2, 0.12, sc.y) : smoothstep(-0.4, -0.05, sc.x);
  vColor = aCol; vAlpha = a*smoothstep(0.3, 2.5, dd);
}`;
  const RV = `attribute float aG; attribute float aTh; attribute float aDr; attribute float aS;
uniform float uPR, uOff, uBy, uTr, uLife, uPort, uIA, uIB;
uniform vec3 uCA, uCB; uniform float uB0[${NE}]; uniform float uB1[${NE}]; uniform vec3 uBC[${NE}];
varying vec3 vColor; varying float vAlpha;
vec3 bandC(float y){ vec3 c = uBC[0]; for (int i = 0; i < ${NE}; i++){ if (y >= uB0[i] && y <= uB1[i]) c = uBC[i]; } if (y > uB1[${NE - 1}]) c = uBC[${NE - 1}]; return c; }
void main(){
  float y = mod(position.y + uOff + 7.2, 14.4) - 7.2;
  bool nw = uTr > 0.5 && y < uBy;
  vec3 ec = nw ? (uIB > 0.5 ? bandC(y) : uCB) : (uIA > 0.5 ? bandC(y) : uCA);
  float lam = 0.78 + 0.26*sin(y*6.3 + sin(y*1.7)*2.0) + 0.3*(aG - 0.5);
  vec3 c = mix(vec3(0.42, 0.38, 0.33), ec, 0.68)*lam;
  float a = (0.5 + 0.5*aG)*0.42;
  float k = smoothstep(aTh*0.7, aTh*0.7 + 0.3, uLife); a *= 1.0 - k; y -= k*aDr*2.2;
  if (uTr > 0.5 && abs(y - uBy) < 0.12) a *= 2.2;
  if (uPort < 0.5) a *= smoothstep(-7.5, -3.5, position.x);
  vec4 mv = modelViewMatrix*vec4(position.x, y, position.z, 1.0); float dd = -mv.z;
  gl_PointSize = min(1.9*(0.7 + aS)*uPR*(40.0/max(dd, 0.6)), 40.0*uPR);
  gl_Position = projectionMatrix*mv;
  vColor = c; vAlpha = a*smoothstep(0.3, 2.5, dd);
}`;
  const shMat = (vs, uni) => new THREE.ShaderMaterial({ uniforms: uni, vertexShader: vs, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  function geo(n, attrs){ const g = new THREE.BufferGeometry(); for (const k in attrs) g.setAttribute(k, new THREE.BufferAttribute(attrs[k], k === "position" ? 3 : 1)); return g; }
  const RCAP = 9000;
  let pR, pEnv = null, glowS, RU, EU;
  const v3 = c => new THREE.Vector3(c[0], c[1], c[2]);
  function build(){
    built = true;
    rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
    scn = new THREE.Scene(); cam = new THREE.PerspectiveCamera(40, 1, .05, 200);
    const P = new Float32Array(RCAP*3), G = new Float32Array(RCAP), TH = new Float32Array(RCAP), DR = new Float32Array(RCAP), SS = new Float32Array(RCAP);
    for (let i = 0; i < RCAP; i++){ P[i*3] = (Math.random()*2 - 1)*12; P[i*3 + 1] = (Math.random()*2 - 1)*7.2; P[i*3 + 2] = -.9 + Math.random()*.7 - Math.random()*Math.random()*1.2;
      G[i] = Math.random(); TH[i] = Math.random(); DR[i] = .3 + Math.random()*.9; SS[i] = Math.random()*.6; }
    RU = { uPR: U.pr, uOff:{ value:0 }, uBy:{ value:99 }, uTr:{ value:0 }, uLife:{ value:0 }, uPort:{ value:0 }, uIA:{ value:1 }, uIB:{ value:1 },
      uCA:{ value:v3(STONE) }, uCB:{ value:v3(STONE) }, uB0:{ value:BAND.map(b => b[0]) }, uB1:{ value:BAND.map(b => b[1]) }, uBC:{ value:ERA_C.map(v3) } };
    pR = new THREE.Points(geo(RCAP, { position:P, aG:G, aTh:TH, aDr:DR, aS:SS }), shMat(RV, RU)); pR.frustumCulled = false; scn.add(pR);
    EU = { uPR: U.pr, uT:{ value:0 }, uA:{ value:0 }, uPort:{ value:0 } };
    glowS = glow(0xffe2a8, 1, 0); scn.add(glowS);
    ctx2 = lab.getContext("2d");
  }
  // цвет породы: оттенок пласта, приглушённый в камень, со слойками и зерном
  const STONE = [.42, .38, .33];
  function rockCol(ei, y, g){
    const c = ERA_C[ei], lam = .78 + .26*Math.sin(y*6.3 + Math.sin(y*1.7)*2) + .3*(g - .5);
    const m = mixc(STONE, c, .68);
    return [m[0]*lam, m[1]*lam, m[2]*lam];
  }
  // ---- порода на 2D-холсте под сценой: цвет пласта, слойки, зерно; при спуске — новый пласт поднимается снизу ----
  const RTEX = {}; let rKey = "", rcx = null, rOp = -1;
  function rockPix(ctx, w, h, rowEra){
    const im = ctx.createImageData(w, h), D = im.data;
    let seed = 1; const rnd = () => (seed = (seed*16807) % 2147483647)/2147483647;
    const nz = new Float32Array(w*h); for (let i = 0; i < w*h; i++) nz[i] = rnd();
    for (let y = 0; y < h; y++){
      const ei = rowEra(y), c = ERA_C[ei], b = mixc(STONE, c, .55);
      for (let x = 0; x < w; x++){
        const wv = Math.sin(x*.0045 + y*.0012)*14 + Math.sin(x*.017)*3, yy = y + wv;
        let v = .25 + .045*Math.sin(yy*.19) + .025*Math.sin(yy*.53 + x*.002) + .07*(nz[y*w + x] - .5);
        const fr = (yy*.027) % 1; if (fr < .03) v *= .62; else if (fr < .055) v *= 1.12;
        const i = (y*w + x)*4; D[i] = b[0]*v*255; D[i + 1] = b[1]*v*255; D[i + 2] = b[2]*v*255; D[i + 3] = 255;
      }
    }
    ctx.putImageData(im, 0, 0);
  }
  function rockTex(e){
    const w = Math.max(2, Math.round(W3/1.5)), h = Math.max(2, Math.round(H3/1.5)), key = e + ":" + w + "x" + h;
    if (RTEX[key]) return RTEX[key];
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
    if (e >= 0) rockPix(x, w, h, () => e);
    else {
      const ys = BAND.map(b => [scr2(0, b[1], -.6)[1]/1.5, scr2(0, b[0], -.6)[1]/1.5]);
      rockPix(x, w, h, y => { for (let i = 0; i < NE; i++) if (y >= ys[i][0] && y < ys[i][1]) return i; return y < ys[NE - 1][0] ? NE - 1 : 0; });
      x.fillStyle = "rgba(255,236,200,.22)"; ys.forEach(([a]) => x.fillRect(0, Math.round(a), w, 1));
    }
    return RTEX[key] = c;
  }
  function drawRock(trT, op){
    if (!rcx) rcx = rcv.getContext("2d");
    const w = Math.round(W3/1.5), h = Math.round(H3/1.5);
    if (rcv.width !== w || rcv.height !== h){ rcv.width = w; rcv.height = h; rKey = ""; }
    if (trn){ const t = smooth(0, 1, trT), A = rockTex(trn.from), B = rockTex(trn.to);
      rcx.drawImage(A, 0, -t*h); rcx.drawImage(B, 0, h - t*h);
      const g = rcx.createLinearGradient(0, h - t*h - 10, 0, h - t*h + 10); g.addColorStop(0, "rgba(255,226,170,0)"); g.addColorStop(.5, "rgba(255,226,170,.55)"); g.addColorStop(1, "rgba(255,226,170,0)");
      rcx.fillStyle = g; rcx.fillRect(0, h - t*h - 10, w, 20); rKey = "";
    } else { const k = cur + ":" + w; if (k !== rKey){ rKey = k; rcx.drawImage(rockTex(cur), 0, 0); } }
    op = Math.round(op*100)/100; if (op !== rOp){ rOp = op; rcv.style.opacity = op; }
  }
  // срез «введения»: все пласты стопкой, сверху — сегодня
  const INTRO_Y0 = 6.6, INTRO_Y1 = -6.6;
  const W_ERA = BIO_ERAS.map(e => e.n <= 5 ? .55 : 1), W_SUM = W_ERA.reduce((a, b) => a + b, 0);
  const BAND = (() => { const B = []; let y = INTRO_Y0; for (let i = NE - 1; i >= 0; i--){ const h = (INTRO_Y0 - INTRO_Y1)*W_ERA[i]/W_SUM; B[i] = [y - h, y]; y -= h; } return B; })();
  const eraAtY = y => { for (let i = 0; i < NE; i++) if (y >= BAND[i][0] && y <= BAND[i][1]) return i; return y > INTRO_Y0 ? NE - 1 : 0; };

  // ---- сцена пласта: экземпляры существ ----
  let INST = [];
  const ANIM = { still:0, drift:0, eel:1, swim:2, crawl:3, walk:4, fly:5, sway:6 };
  const LANE = { drift:"water", eel:"water", swim:"water", crawl:"floor", walk:"floor", fly:"air" };
  function makeInst(e, custom, world){
    INST.forEach(I => { scn.remove(I.o); I.o.geometry.dispose(); I.o.material.dispose(); });
    const E = e >= 0 && !custom ? BIO_ERAS[e] : null; const L = custom || [];
    if (custom){}
    else if (e < 0){ // введение: несколько окаменелостей в своих пластах
      [["trilo", 6], ["anom", 6], ["megan", 10], ["lepid", 10], ["dimet", 11], ["trex", 14], ["ammon", 14], ["mammo", 17], ["dick", 5], ["ichsa", 13]].forEach(([k, i], j) => {
        if (!BIO_MASK[k]) return; const b = BAND[i], y = (b[0] + b[1])/2; L.push({ k, x: [-3.2, 1.6, -2.6, 3.4, .2, -1.4, 2.6, -3.6, 2.2, -.4][j % 10], y, z: -.35, h: Math.min(1.5, (b[1] - b[0])*1.7), v: 0, fossilOnly: true }); });
    } else if (E && BIO_SCENE[E.id]){
      BIO_SCENE[E.id].forEach(([k, x, y, h, z, v]) => L.push({ k, x, y, z, h, v }));
    } else if (E){ // не раскрытый пласт: пара окаменелостей эпохи из галереи силуэтов, если есть
      const ks = Object.keys(BIO_CREDITS).filter(k => BIO_ERA_OF[k] === E.id).slice(0, 3);
      ks.forEach((k, j) => L.push({ k, x: [-2.4, 1.8, 0][j], y: [.8, -1.4, 2.4][j], z: -.35, h: 1.8, v: 0, fossilOnly: true }));
    }
    for (let li = L.length - 1; li >= 0; li--) if (!BIO_MASK[L[li].k]) L.splice(li, 1);
    for (const I of L){
      const S = BIO_SP[I.k] || {}, sp = species(I.k), plant = !!S.plant, anim = S.anim || "still";
      if (((E && E.ready) || world) && !I.fossilOnly && (LANE[anim] === "floor" || anim === "sway" || anim === "still")) I.y = (BIO_FLOOR[E ? E.world : world] ?? -3.7) + I.h*.5*(sp.ar >= 1 ? 1/sp.ar : 1) - .06;
      const n = Math.min(POOL, Math.round(clamp((plant ? 500 : 800) + (plant ? 300 : 900)*I.h, 500, 4200)*(I.fossilOnly ? .6 : 1)));
      Object.assign(I, { sp, n, plant, anim, X: I.x, Y: I.y, Z: I.z, ph: Math.random()*TAU, fa: (Math.random() - .5)*.7, face: S.face || 1,
        lane: LANE[anim], spd: Math.max(.12, Math.abs(I.v)*.85), vx: 0, vy: 0, act: 0, tl: 0, st: "rest", tm: Math.random()*2.5, tx: I.x, ty: I.y });
      I.mv = !I.fossilOnly && !plant && !!I.lane && !!I.v;
      I.F = I.v ? Math.sign(I.v)*I.face : 1;
      const P = new Float32Array(n*3), aE = new Float32Array(n), aDel = new Float32Array(n), aSg = new Float32Array(n), aR = new Float32Array(n), aTh = new Float32Array(n);
      for (let j = 0; j < n; j++){ P[j*3] = sp.u[j]; P[j*3 + 1] = sp.v[j]; P[j*3 + 2] = sp.d[j]; aE[j] = sp.e[j]; aDel[j] = Math.random()*.45 + (sp.v[j] + .5)*.15; aSg[j] = sp.sg[j]; aR[j] = Math.random(); aTh[j] = sp.th[j]; }
      const stone = mixc(e >= 0 ? rockCol(e, I.y, .9) : rockCol(eraAtY(I.y), I.y, .9), [1, .95, .85], .45);
      I.U = { uPR: U.pr, uT:{ value:0 }, uS:{ value:I.h }, uF:{ value:I.F }, uTilt:{ value:0 }, uLife:{ value:0 }, uAnim:{ value:ANIM[anim] || 0 }, uAl:{ value:1 },
        uPlant:{ value:plant ? 1 : 0 }, uAct:{ value:0 }, uPh:{ value:I.ph }, uFa:{ value:I.fa }, uHov:{ value:0 },
        uC:{ value:new THREE.Vector3(I.x, I.y, I.z) }, uFos:{ value:new THREE.Vector3(I.x, I.y, -.32) }, uCol:{ value:v3(spCol(I.k)) }, uStone:{ value:v3(stone) } };
      I.o = new THREE.Points(geo(n, { position:P, aE, aDel, aSg, aR, aTh }), shMat(CV, I.U)); I.o.frustumCulled = false; scn.add(I.o);
    }
    return L;
  }
  const SPCOL = { anom:[1, .62, .42], opab:[1, .7, .58], hall:[1, .66, .74], pika:[.95, .9, .78], trilo:[1, .78, .48], marr:[.75, .85, 1], wiwa:[.92, .86, .5],
    haik:[.72, .88, .98], lepid:[.62, .82, .5], megan:[.55, .9, .95], arthr:[1, .66, .38], hylo:[.95, .78, .52], pulmo:[.92, .62, .44] };
  const spCol = k => SPCOL[k] || [1, .85, .6];

  // ---- режиссура: одновременно идут 2–3 существа, остальные отдыхают; пути — плавные дуги ----
  function target(I){
    I.tx = -4.6 + Math.random()*8.8;
    I.ty = I.lane === "floor" ? I.y : I.lane === "air" ? .4 + Math.random()*3.2 : clamp(I.y + (Math.random()*2 - 1)*1.4, -2.4, 3.6);
  }
  function direct(dt, T){
    const M = INST.filter(I => I.mv), MAX = M.length > 6 ? 3 : 2, S = INST[sel];
    let act = M.filter(I => I.st === "go").length;
    for (const I of M){
      I.tm -= dt;
      if (I === S){ if (I.st === "go") act--; I.st = "rest"; I.tm = 3; continue; }
      if (I.st === "go"){
        if (I.tm <= 0){ I.st = "rest"; I.tm = 4 + Math.random()*6; act--; }
        else if (Math.hypot(I.tx - I.X, I.ty - I.Y) < .35) target(I);
      } else if (I.tm <= 0 && act < MAX){ I.st = "go"; I.tm = 8 + Math.random()*7; target(I); act++; }
    }
    for (const I of M){
      const go = I.st === "go"; let vx = 0, vy = 0;
      if (go){ const dx = I.tx - I.X, dy = I.ty - I.Y, L = Math.hypot(dx, dy) || 1, sp = I.spd*Math.min(1, L/1.2 + .25);
        vx = dx/L*sp; vy = dy/L*sp; const w = Math.sin(T*.5 + I.ph)*.35*I.spd; if (I.lane !== "floor"){ vx += -dy/L*w; vy += dx/L*w; } }
      if (I === S){ vx = (clamp(I.X, -3.5, 3) - I.X)*.6; vy = I.lane === "floor" ? 0 : (clamp(I.Y, -2, 2.6) - I.Y)*.6; }
      const kk = Math.min(1, dt*(go ? 1.1 : 1.6));
      I.vx += (vx - I.vx)*kk; I.vy += (vy - I.vy)*kk;
      I.X += I.vx*dt; I.Y += I.vy*dt; if (I.lane === "floor") I.Y = I.y;
      I.Z += ((I === S ? I.z + 1.6 : I.z) - I.Z)*Math.min(1, dt*.8);
      I.act += (Math.min(1, Math.hypot(I.vx, I.vy)/I.spd) - I.act)*Math.min(1, dt*2);
      if (Math.abs(I.vx) > .04){ const ft = Math.sign(I.vx)*I.face; I.F += (ft - I.F)*Math.min(1, dt*2.6); }
      if (I.lane !== "floor"){ const tl = clamp(Math.atan2(I.vy, Math.abs(I.vx) + .08), -.45, .45)*Math.sign(I.F || 1)*.7; I.tl += (tl - I.tl)*Math.min(1, dt*2); }
    }
  }

  // ---- среда эпохи: точки один раз, движение — в шейдере. Типы: 0 оседает · 1 луч · 2 неподвижно · 3 колышется ·
  //      4 вода · 5 туман · 6 водоросль · 7 спора · 8 пузырёк · 9 дым/пар · 10 искра · 12 клетка · 13 мерцает · 14 метеор ----
  let envN = 0;
  const ENVSZ = { 0:1, 1:1.5, 2:1, 3:1, 4:1, 5:2.1, 6:1, 7:1.2, 8:.8, 9:1.4, 10:.9, 12:.9, 13:1.1, 14:1.3 };
  function makeEnv(world){
    if (pEnv){ scn.remove(pEnv); pEnv.geometry.dispose(); pEnv.material.dispose(); pEnv = null; }
    envN = 0; if (!world) return;
    const R = Math.random, L = [], FL = BIO_FLOOR[world] ?? -3.7;
    const add = (ty, x, y, z, s, ph, c, sz) => L.push([x, y, z, s, ph, ty, c, (sz || 1)*(ENVSZ[ty] || 1)]);
    const jit = (c, k) => { const f = 1 - k/2 + R()*k; return [c[0]*f, c[1]*f, c[2]*f]; };
    const snow = (n, c) => { for (let i = 0; i < n; i++) add(0, (R()*2 - 1)*10, -3.6 + R()*10, -7 + R()*8.5, R(), R()*TAU, c); };
    const rays = (k, c, n) => { for (let j = 0; j < k; j++){ const x0 = -6 + j*(13/k) + R(), sl = .18 + R()*.12; for (let i = 0; i < (n || 260); i++){ const t = R(); add(1, x0 + t*sl*9, 6.5 - t*9.5, -4 - R()*2 + (R() - .5)*.5, t, j, c); } } };
    const floor = (n, c, ty) => { for (let i = 0; i < n; i++){ const x = (R()*2 - 1)*11, z = -7 + R()*9; add(ty || 2, x, FL - .05 + .12*Math.sin(x*1.3 + z) + .15*Math.sin(x*.4 - z*.7) - R()*R()*.9, z, R(), R()*TAU, jit(c, .3)); } };
    const sponges = (k, c) => { for (let j = 0; j < k; j++){ const x = (R()*2 - 1)*7.5, z = -6 + R()*7, h = .5 + R()*1.1; for (let i = 0; i < 70; i++){ const t = R(), a = R()*TAU, r = .07 + t*.12; add(3, x + Math.cos(a)*r, FL + t*h, z + Math.sin(a)*r, t, j, c); } } };
    const weeds = (k, c, hm) => { for (let j = 0; j < k; j++){ const x = (R()*2 - 1)*8, z = -6 + R()*7, h = (hm || 2)*(.4 + R()*.6), ph = R()*TAU; for (let i = 0; i < 40; i++){ const t = i/39; add(6, x + Math.sin(t*3 + ph)*.08, FL + t*h, z, t, ph, jit(c, .2)); } } };
    const crinoids = (k, c) => { for (let j = 0; j < k; j++){ const x = (R()*2 - 1)*7.5, z = -6 + R()*6.5, h = .8 + R()*1.4, ph = R()*TAU;
      for (let i = 0; i < 30; i++){ const t = i/29; add(6, x, FL + t*h, z, t*.6, ph, c); }
      for (let a = 0; a < 7; a++){ const an = -1.2 + a*.4; for (let i = 0; i < 9; i++){ const t = i/8; add(6, x + Math.sin(an)*t*.45, FL + h + Math.cos(an)*t*.45 - t*t*.15, z, .6 + .4*t, ph, jit(c, .2)); } } } };
    const stroms = (k, c, top) => { for (let j = 0; j < k; j++){ const x = (R()*2 - 1)*8, z = -6.5 + R()*7.5, r = .4 + R()*.9, h = r*(.6 + R()*.5);
      for (let i = 0; i < 160; i++){ const a = R()*TAU, q = Math.sqrt(R()), y = h*Math.sqrt(Math.max(0, 1 - q*q)), lay = .55 + .35*Math.sin(y*28);
        add(q < .35 && top ? 13 : 2, x + Math.cos(a)*q*r, FL + y, z + Math.sin(a)*q*r*.6, R(), j, q < .35 && top ? top : [c[0]*lay, c[1]*lay, c[2]*lay]); } } };
    const vent = (x, z, c, pc) => { for (let i = 0; i < 120; i++){ const t = R(); add(2, x + (R() - .5)*.3*(1.2 - t), FL + t*1.8, z + (R() - .5)*.2, R(), 0, c); }
      for (let i = 0; i < 360; i++) add(9, x + (R() - .5)*.15, FL + 1.8, z, R(), R(), pc); };
    const bubbles = (n, c) => { for (let i = 0; i < n; i++) add(8, (R()*2 - 1)*8, FL + .2, -6 + R()*7, R(), R(), c); };
    if (world === "sea" || world === "reef" || world === "coast" || world === "shallow"){
      const deep = world === "reef" ? [.5, .85, .9] : world === "shallow" ? [.62, .86, .8] : [.55, .82, .95];
      snow(world === "shallow" ? 1800 : 2400, deep); rays(world === "shallow" ? 8 : 6, world === "shallow" ? [.85, .95, .85] : [.7, .9, 1]);
      floor(3400, world === "shallow" ? [.78, .72, .5] : [.86, .74, .5]);
      if (world === "sea") sponges(14, [.95, .7, .5]);
      if (world === "reef"){ sponges(10, [.95, .72, .55]); crinoids(14, [.95, .62, .66]); }
      if (world === "coast"){ weeds(18, [.55, .8, .55], 1.8); sponges(6, [.9, .7, .55]); }
      if (world === "shallow"){ weeds(34, [.55, .82, .5], 2.6); }
    } else if (world === "swamp"){
      for (let i = 0; i < 3200; i++){ const x = (R()*2 - 1)*11, z = -8 + R()*10; add(4, x, FL + .05 + .05*Math.sin(x*2 + z*1.3) - R()*R()*.6, z, R(), R()*TAU, [.32, .5, .48]); }
      for (let i = 0; i < 2200; i++) add(5, (R()*2 - 1)*11, FL + .1 + R()*R()*4.5, -8 + R()*8, R(), R()*TAU, [.55, .68, .58]);
      for (let k = 0; k < 26; k++){ const x = (R()*2 - 1)*8, z = -5 + R()*6.5, h = .5 + R()*.9, n = 3 + (R()*3 | 0);
        for (let f = 0; f < n; f++){ const a = (f/(n - 1 || 1) - .5)*2.2 + (R() - .5)*.3; for (let i = 0; i < 26; i++){ const t = i/25; add(3, x + Math.sin(a)*t*h*1.1, FL + .05 + Math.cos(a)*t*h - t*t*h*.35, z, t, k, [.5, .78, .42]); } } }
      for (let i = 0; i < 700; i++) add(7, (R()*2 - 1)*9, -3 + R()*8, -5 + R()*6, R(), R()*TAU, [1, .9, .55]);
    } else if (world === "hadean"){
      for (let i = 0; i < 3600; i++){ const x = (R()*2 - 1)*12, z = -12 + R()*14; add(2, x, -3.6 + .1*Math.sin(x*.9 + z*.7) - R()*R()*.4, z, R()*.6, 0, jit([.42, .2, .14], .5)); }
      for (let c = 0; c < 22; c++){ let x = (R()*2 - 1)*10, z = -11 + R()*12, a = R()*TAU; for (let i = 0; i < 70; i++){ a += (R() - .5)*.9; x += Math.cos(a)*.09; z += Math.sin(a)*.09; add(13, x, -3.55, z, R(), c, jit([1, .5, .16], .3), 1.1); } }
      for (let i = 0; i < 900; i++) add(10, (R()*2 - 1)*9, -3.5, -9 + R()*10, R(), R(), [1, .62, .25]);
      for (let i = 0; i < 700; i++) add(9, (R()*2 - 1)*9, -3.5, -9 + R()*9, R(), R(), [.55, .45, .42], 1.6);
      for (let m = 0; m < 5; m++){ const x0 = 2 + R()*9, y0 = 3 + R()*3, z0 = -9 - R()*4, ph = R(); for (let i = 0; i < 26; i++) add(14, x0, y0, z0, i/26, ph, [1, .8, .5]); }
      for (let i = 0; i < 2400; i++){ const a = R()*TAU, r = Math.sqrt(R())*2.1, x = Math.cos(a)*r, y = Math.sin(a)*r, d = .6 + .4*Math.sin(x*2.1 + y*1.3)*Math.sin(x*.9 - y*2.4); add(2, 2.6 + x, 3.4 + y, -9, .5 + .5*d, 0, [.95*d, .88*d, .78*d], 1.5); }
    } else if (world === "archean"){
      snow(1600, [.75, .7, .45]); rays(5, [1, .8, .55]); floor(3000, [.62, .5, .42]);
      stroms(16, [.72, .62, .5], [.45, .8, .55]); vent(-4.2, -3.5, [.32, .28, .26], [.4, .36, .34]); vent(3.6, -5.5, [.32, .28, .26], [.4, .36, .34]);
    } else if (world === "goe"){
      snow(800, [.7, .8, .7]); rays(5, [.95, .85, .65]); floor(2800, [.7, .38, .26]);
      for (let i = 0; i < 1800; i++) add(0, (R()*2 - 1)*10, -3.6 + R()*10, -7 + R()*8.5, R(), R()*TAU, jit([.95, .45, .2], .4));
      stroms(18, [.66, .5, .4], [.4, .85, .5]); bubbles(900, [.85, .97, 1]);
    } else if (world === "cells"){
      snow(1800, [.6, .85, .8]); rays(4, [.8, .95, .9], 200);
      for (let c = 0; c < 26; c++){ const x = (R()*2 - 1)*8, y = -2.6 + R()*6.2, z = -6 + R()*6.5, r = .22 + R()*.32, ph = R()*TAU, el = .7 + R()*.5;
        for (let i = 0; i < 46; i++){ const a = i/46*TAU; add(12, x + Math.cos(a)*r, y + Math.sin(a)*r*el, z, .8, ph, [.6, .9, .85]); }
        for (let i = 0; i < 14; i++){ const a = R()*TAU, q = R()*r*.28; add(12, x + r*.15 + Math.cos(a)*q, y + Math.sin(a)*q, z, 1, ph, [1, .8, .55]); }
        for (let i = 0; i < 6; i++){ const a = R()*TAU, q = r*(.4 + R()*.4); add(12, x + Math.cos(a)*q, y + Math.sin(a)*q*el, z, .6, ph, [.95, .55, .45]); } }
    } else if (world === "ice"){
      for (let i = 0; i < 5200; i++){ const x = (R()*2 - 1)*13, z = -13 + R()*14; add(2, x, -3.6 + .06*Math.sin(x*.7 + z*.4) - R()*R()*.3, z, .5 + R()*.5, 0, jit([.9, .95, 1], .2), 1.5); }
      for (let c = 0; c < 16; c++){ let x = (R()*2 - 1)*10, z = -12 + R()*13, a = R()*TAU; for (let i = 0; i < 60; i++){ a += (R() - .5)*.6; x += Math.cos(a)*.1; z += Math.sin(a)*.1; add(13, x, -3.55, z, R()*.6, c, [.45, .75, 1]); } }
      for (let r = 0; r < 6; r++){ const x0 = -10 + r*4 + R()*2, w = 1.5 + R()*2, h = .5 + R()*1.1; for (let i = 0; i < 160; i++){ const t = R()*2 - 1; add(2, x0 + t*w, -3.6 + h*(1 - t*t)*R(), -12.5 + R()*.6, R()*.6, 0, [.75, .85, .95]); } }
      for (let i = 0; i < 2200; i++) add(0, (R()*2 - 1)*10, -3.6 + R()*10, -7 + R()*8.5, R(), R()*TAU, [.95, .97, 1]);
    } else if (world === "mat"){
      snow(1800, [.6, .82, .85]); rays(5, [.75, .9, .95], 200); floor(2600, [.58, .62, .42]);
      for (let i = 0; i < 1600; i++){ const x = (R()*2 - 1)*10, z = -6.5 + R()*8; add(13, x, FL + .04 + .1*Math.sin(x*1.3 + z) + .12*Math.sin(x*.4 - z*.7), z, R()*.5, R()*TAU, [.5, .7, .45]); }
    } else if (world === "ocean"){
      snow(1600, [.6, .85, 1]); rays(9, [.75, .92, 1], 320);
      for (let i = 0; i < 1600; i++) add(13, (R()*2 - 1)*10, -2.5 + R()*8, -8 + R()*8, R()*.6, R()*TAU, jit([.5, .95, .8], .3), .8);
      for (let i = 0; i < 2600; i++) add(5, (R()*2 - 1)*12, -4 + R()*R()*6, -10 + R()*9, R(), R()*TAU, [.25, .5, .8]);
      for (let i = 0; i < 1500; i++){ const x = (R()*2 - 1)*12, z = -9 + R()*9; add(4, x, 6.2 + .1*Math.sin(x*1.4 + z), z, R(), R()*TAU, [.7, .9, 1]); }
      bubbles(500, [.85, .97, 1]);
    } else if (world === "deep"){
      for (let i = 0; i < 1400; i++) add(0, (R()*2 - 1)*10, -3.6 + R()*10, -7 + R()*8.5, R(), R()*TAU, [.55, .6, .65]);
      floor(2600, [.32, .34, .38]);
      for (let i = 0; i < 700; i++) add(13, (R()*2 - 1)*10, -3 + R()*8, -8 + R()*8, R(), R()*TAU, R() < .5 ? [.35, .75, 1] : [.4, 1, .75], .9);
      vent(-2.6, -3, [.3, .26, .26], [.5, .46, .46]); vent(3.6, -5, [.3, .26, .26], [.5, .46, .46]);
      for (let j = 0; j < 22; j++){ const x = -2.6 + (R() - .5)*3, z = -3 + R()*2, h = .3 + R()*.6, ph = R()*TAU;
        for (let i = 0; i < 14; i++){ const t = i/13; add(6, x, FL + t*h, z, t*.4, ph, t > .8 ? [1, .3, .3] : [.9, .9, .85]); } }
    } else if (["triassic", "forest", "meadow", "jungle", "savanna", "steppe", "field", "taiga", "tundra"].includes(world)){
      const W = { triassic:{ g:[.78, .5, .3], gr:[.65, .55, .3], n:0 }, forest:{ g:[.4, .42, .26], gr:[.38, .62, .32], n:900 }, meadow:{ g:[.42, .5, .28], gr:[.48, .72, .36], n:2200 },
        jungle:{ g:[.3, .34, .22], gr:[.34, .62, .3], n:1200 }, savanna:{ g:[.7, .58, .34], gr:[.86, .74, .42], n:2600 }, steppe:{ g:[.66, .66, .58], gr:[.78, .76, .58], n:2000 },
        field:{ g:[.55, .45, .3], gr:[.95, .8, .42], n:2600 }, taiga:{ g:[.82, .86, .9], gr:[.5, .56, .5], n:500 }, tundra:{ g:[.5, .48, .38], gr:[.72, .5, .36], n:2600 } }[world];
      const gy = (x, z) => FL + .15*Math.sin(x*.5 + z*.3) + .1*Math.sin(x*1.3 - z*.6) - .1;
      for (let i = 0; i < 3800; i++){ const x = (R()*2 - 1)*13, z = -13 + R()*14; add(2, x, gy(x, z) - R()*R()*.3, z, R()*.7, 0, jit(W.g, .35)); }
      for (let i = 0; i < W.n; i++){ const x = (R()*2 - 1)*11, z = -9 + R()*10, h = (world === "savanna" ? .7 : world === "field" ? .55 : world === "tundra" ? .14 : .35)*(.5 + R()), y0 = gy(x, z);
        for (let k = 0; k < 4; k++) add(3, x + k*.02*h, y0 + k/3*h, z, k/3, R()*TAU, jit(W.gr, .3)); }
      const tree = (kind, x, z, h, c, tc) => { const y0 = gy(x, z);
        for (let i = 0; i < 22; i++) add(2, x + (R() - .5)*.06*h, y0 + i/22*h*.75, z, .6, 0, tc || [.42, .3, .22]);
        if (kind === "cone"){ for (let i = 0; i < 160; i++){ const q = R(), w = (1 - q)*h*.26; add(3, x + (R()*2 - 1)*w, y0 + .25*h + q*h*.8, z + (R() - .5)*.3, q, x, jit(c, .3)); } }
        else if (kind === "ball"){ for (let i = 0; i < 200; i++){ const a = R()*TAU, b = Math.acos(2*R() - 1), r = h*.32*Math.cbrt(R()); add(3, x + Math.sin(b)*Math.cos(a)*r, y0 + h*.8 + Math.cos(b)*r*.8, z + Math.sin(b)*Math.sin(a)*r*.5, .5 + .5*R(), x, jit(c, .3)); } }
        else if (kind === "flat"){ for (let i = 0; i < 170; i++){ const a = R()*TAU, r = Math.sqrt(R())*h*.55; add(3, x + Math.cos(a)*r, y0 + h*.78 + (R() - .5)*h*.12 - r*r*.08/h, z + Math.sin(a)*r*.35, .7, x, jit(c, .3)); } }
        else if (kind === "palm"){ for (let f = 0; f < 8; f++){ const an = f/8*TAU; for (let i = 0; i < 18; i++){ const t = i/17; add(3, x + Math.cos(an)*t*h*.38, y0 + h*.78 + .25*h*t - .5*h*t*t*.6, z + Math.sin(an)*t*h*.2, .4 + .6*t, x, jit(c, .25)); } } }
        else if (kind === "cycad"){ for (let f = 0; f < 10; f++){ const an = f/10*TAU; for (let i = 0; i < 10; i++){ const t = i/9; add(3, x + Math.cos(an)*t*h*.5, y0 + h*.3 + t*h*.3 - t*t*h*.35, z + Math.sin(an)*t*h*.25, t, x, jit(c, .25)); } } } };
      const forest = (n, kinds, c, hmin, hmax, zmin, zmax) => { for (let t = 0; t < n; t++){ const x = (R()*2 - 1)*11, z = zmin + R()*(zmax - zmin); tree(kinds[(R()*kinds.length) | 0], x, z, hmin + R()*(hmax - hmin), c); } };
      if (world === "triassic"){ forest(10, ["cone"], [.42, .5, .3], 1.5, 3.2, -12, -5); forest(8, ["cycad"], [.5, .62, .32], .8, 1.4, -6, 0);
        for (let i = 0; i < 1500; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*3, -9 + R()*9, R(), R()*TAU, [.9, .62, .4]); }
      if (world === "forest"){ forest(18, ["cone"], [.3, .5, .3], 4, 8, -13, -6); forest(12, ["cycad"], [.42, .66, .34], .9, 1.8, -6, .5);
        for (let i = 0; i < 1800; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*4, -10 + R()*9, R(), R()*TAU, [.6, .72, .6]); }
      if (world === "meadow"){ forest(12, ["ball", "cone"], [.36, .6, .32], 2.5, 5, -12, -5);
        const FC = [[1, .55, .7], [1, .9, .4], [.9, .9, 1], [.8, .5, 1]];
        for (let i = 0; i < 900; i++){ const x = (R()*2 - 1)*10, z = -8 + R()*9; add(3, x, gy(x, z) + .3 + R()*.25, z, .8, R()*TAU, FC[(R()*4) | 0], 1.3); }
        for (let i = 0; i < 500; i++) add(7, (R()*2 - 1)*9, -3 + R()*4, -6 + R()*6, R(), R()*TAU, [1, .9, .5]); }
      if (world === "jungle"){ forest(22, ["ball", "palm", "ball"], [.3, .6, .3], 3, 7, -13, -3); forest(6, ["palm"], [.38, .66, .34], 2, 3.5, -3, .5);
        for (let i = 0; i < 2000; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*5, -10 + R()*9, R(), R()*TAU, [.55, .7, .58]);
        for (let i = 0; i < 400; i++) add(7, (R()*2 - 1)*9, -3 + R()*5, -6 + R()*6, R(), R()*TAU, [.8, 1, .55]); }
      if (world === "savanna"){ forest(9, ["flat"], [.5, .6, .3], 2, 3.2, -12, -3);
        for (let i = 0; i < 1200; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*2.5, -10 + R()*9, R(), R()*TAU, [.95, .8, .55]); }
      if (world === "steppe"){ for (let i = 0; i < 2600; i++){ const x = (R()*2 - 1)*14, t = R(); add(2, x, FL + .2 + t*(1.6 + .6*Math.sin(x*.4)), -14 + R()*.8, .4 + .6*t, 0, jit([.85, .92, 1], .15), 1.3); }
        for (let i = 0; i < 1600; i++) add(0, (R()*2 - 1)*10, -3.6 + R()*10, -7 + R()*8.5, R(), R()*TAU, [.95, .97, 1]);
        for (let i = 0; i < 1000; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*2, -10 + R()*9, R(), R()*TAU, [.85, .88, .9]); }
      if (world === "taiga"){ forest(30, ["cone"], [.18, .36, .26], 4, 8.5, -13, -4); forest(6, ["cone"], [.22, .4, .3], 2.5, 4, -4, .5);
        for (let i = 0; i < 2000; i++) add(0, (R()*2 - 1)*10, -3.6 + R()*10, -7 + R()*8.5, R(), R()*TAU, [.95, .97, 1]);
        for (let i = 0; i < 900; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*3, -10 + R()*9, R(), R()*TAU, [.8, .85, .9]); }
      if (world === "tundra"){ for (let i = 0; i < 2600; i++){ const x = (R()*2 - 1)*14, t = R(); add(2, x, FL + .2 + t*(1.4 + .7*Math.sin(x*.35 + 1)), -14 + R()*.8, .4 + .6*t, 0, jit(t > .6 ? [.92, .94, 1] : [.55, .58, .62], .15), 1.3); }
        for (let i = 0; i < 700; i++){ const x = (R()*2 - 1)*10, z = -9 + R()*10; add(3, x, gy(x, z) + .08 + R()*.12, z, .8, R()*TAU, R() < .5 ? [.95, .95, .9] : [.9, .4, .5], 1.1); }
        for (let i = 0; i < 1400; i++){ const x = (R()*2 - 1)*12, z = -12 + R()*12; add(13, x, gy(x, z) + .02, z, R()*.5, R()*TAU, [.55, .66, .45]); }
        for (let i = 0; i < 900; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*2.5, -10 + R()*9, R(), R()*TAU, [.82, .84, .92]); }
      if (world === "field"){ forest(8, ["ball"], [.36, .58, .32], 2.4, 4, -12, -7);
        for (let h = 0; h < 4; h++){ const x = -9 + h*5 + R()*2, z = -10 - R()*2, y0 = gy(x, z); for (let i = 0; i < 160; i++){ const u = R()*1.6 - .8, v = R()*1.1; add(2, x + u, y0 + v + (v > .8 ? -(Math.abs(u) - .8)*0 : 0) + (v > .8 ? (.8 - Math.abs(u))*.5 : 0), z, .6, 0, v > .8 ? [.7, .4, .3] : [.85, .78, .62]); } }
        for (let i = 0; i < 800; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*2.5, -10 + R()*9, R(), R()*TAU, [.9, .85, .7]); }
    } else if (world === "today"){
      snow(2200, [.6, .85, .95]); rays(7, [.75, .92, 1]); floor(3200, [.8, .74, .58]); sponges(10, [1, .6, .5]); crinoids(6, [.95, .5, .7]); weeds(14, [.5, .8, .6], 1.8);
    } else if (world === "desert"){
      for (let i = 0; i < 4200; i++){ const x = (R()*2 - 1)*13, z = -13 + R()*15; add(2, x, FL + .25*Math.sin(x*.5 + z*.3) + .15*Math.sin(x*1.3 - z*.6) - .1 - R()*R()*.3, z, R()*.8, 0, jit([.85, .45, .3], .35)); }
      for (let t = 0; t < 12; t++){ const x = (R()*2 - 1)*11, z = -12 + R()*6, h = 1.2 + R()*1.8, y0 = FL + .2 + .25*Math.sin(x*.5 + z*.3);
        for (let i = 0; i < 110; i++){ const q = R(), w = (1 - q)*h*.28; add(3, x + (R()*2 - 1)*w, y0 + .3 + q*h, z, q, t, jit([.4, .55, .35], .3)); }
        for (let i = 0; i < 16; i++) add(2, x, y0 + i/16*.4, z, .5, 0, [.45, .3, .22]); }
      for (let i = 0; i < 1600; i++) add(5, (R()*2 - 1)*11, FL + R()*R()*3.5, -9 + R()*9, R(), R()*TAU, [.9, .55, .38]);
    }
    const n = envN = Math.min(L.length, 11000), P = new Float32Array(n*3), C = new Float32Array(n*3), aS = new Float32Array(n), aPh = new Float32Array(n), aTy = new Float32Array(n), aSz = new Float32Array(n);
    for (let i = 0; i < n; i++){ const q = L[i]; P[i*3] = q[0]; P[i*3 + 1] = q[1]; P[i*3 + 2] = q[2]; aS[i] = q[3]; aPh[i] = q[4]; aTy[i] = q[5]; C[i*3] = q[6][0]; C[i*3 + 1] = q[6][1]; C[i*3 + 2] = q[6][2]; aSz[i] = q[7]; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("aCol", new THREE.BufferAttribute(C, 3));
    [["aS", aS], ["aPh", aPh], ["aTy", aTy], ["aSz", aSz]].forEach(([k, v]) => g.setAttribute(k, new THREE.BufferAttribute(v, 1)));
    pEnv = new THREE.Points(g, shMat(EV, EU)); pEnv.frustumCulled = false; scn.add(pEnv);
  }

  // ---- кадр ----
  function setEra(cu, fl, e){ if (e < 0) fl.value = 1; else { fl.value = 0; const c = ERA_C[e]; cu.value.set(c[0], c[1], c[2]); } }
  function frame(now){
    raf = open ? requestAnimationFrame(frame) : 0; fc++;
    const dt = Math.min(.1, (now - last)/1000 || 0); last = now; const T = now/1000;
    if (mechOn){ mechFrame(dt, T); return; }
    const port = W3 < 760, mx = box.classList.contains("tm-max");
    // переход «спуск сквозь пласты»
    let trT = 1;
    if (trn){ trn.t += dt/1.15; trT = trn.t; rockOff += dt/1.15*6; if (trn.t >= 1){ const was = trn; trn = null; arrive(was.to); trT = 1; } }
    // оживание
    if (lifeAt && now > lifeAt){ lifeAt = 0; lifeT = 1; hint(); }
    const lp = life; life += (lifeT - life)*Math.min(1, dt*(lifeT > life ? .9 : 1.6)); if (Math.abs(lifeT - life) < .003) life = lifeT;
    if (lp < .97 && life >= .97) hint();
    // камера: лёгкий параллакс за указателем
    ptr.nx += ((ptr.in ? ptr.x/W3*2 - 1 : 0) - ptr.nx)*Math.min(1, dt*2); ptr.ny += ((ptr.in ? ptr.y/H3*2 - 1 : 0) - ptr.ny)*Math.min(1, dt*2);
    cam.setViewOffset(W3, H3, port ? 0 : -W3*(mx ? .25 : .17), port ? H3*.24 : 0, W3, H3);
    const D = port ? 21 : 14;
    const intro = cur < 0 && !cmp && !bmOn; cam.position.set(ptr.nx*.35, -ptr.ny*.2 + (intro ? 0 : .2), D); cam.lookAt(0, intro ? 0 : .1, -2);
    // порода: зёрна (шейдер) и 2D-холст
    RU.uOff.value = rockOff; RU.uTr.value = trn ? 1 : 0; RU.uBy.value = trn ? -7.6 + trT*15.2 : 99;
    setEra(RU.uCA, RU.uIA, trn ? trn.from : cur); setEra(RU.uCB, RU.uIB, trn ? trn.to : cur);
    RU.uLife.value = !trn && cur >= 0 ? life : 0; RU.uPort.value = port ? 1 : 0; pR.visible = !cmp && !bmOn;
    drawRock(trT, cmp || bmOn ? 0 : trn || cur < 0 ? 1 : 1 - smooth(.05, .8, life));
    // среда
    const envA = cmp ? 0 : bmOn ? 1 : smooth(.25, 1, life)*(trn ? Math.max(0, 1 - trT*3) : 1);
    EU.uT.value = T; EU.uA.value = envA; EU.uPort.value = port ? 1 : 0; if (pEnv) pEnv.visible = envA > .01;
    // существа: режиссура на процессоре (несколько чисел), точки — в шейдере
    const instA = trn ? Math.max(0, 1 - trT*3.2) : 1, living = (cur >= 0 || bmOn) && !trn && !cmp;
    if (living && life > .6) direct(dt, T);
    if (cmp) life = lifeT = 1;
    for (let q = 0; q < INST.length; q++){
      const I = INST[q], u = I.U, lifeI = I.fossilOnly ? 0 : life;
      let Yb = I.Y;
      if (I.anim === "fly") Yb += Math.sin(T*1.1 + I.ph)*(I.st === "go" ? .08 : .2)*lifeI;
      else if (I.anim === "swim" || I.anim === "eel") Yb += Math.sin(T*.7 + I.ph)*.1*lifeI;
      else if (I.anim === "walk") Yb += .02*I.h*Math.abs(Math.sin(T*3.4 + I.ph))*I.act;
      u.uT.value = T; u.uLife.value = lifeI; u.uAl.value = instA; u.uHov.value = q === hov || q === sel ? 1 : 0;
      u.uC.value.set(I.X, Yb, I.Z); u.uF.value = I.F; u.uTilt.value = I.tl; u.uAct.value = I.act;
      I.o.visible = instA > .005;
      I.sx = I.X; I.sy = Yb;
    }
    // подсветка выбранного
    if (sel >= 0 && INST[sel] && life > .9 && !trn){ const I = INST[sel]; glowS.position.set(I.sx, I.sy, I.Z - .3); glowS.scale.setScalar(I.h*1.4); glowS.material.opacity += (.22 - glowS.material.opacity)*Math.min(1, dt*3); }
    else glowS.material.opacity *= Math.max(0, 1 - dt*4);
    const skyA = (envA*100 | 0)/100; if (skyA !== skyWas){ skyWas = skyA; sky.style.opacity = skyA; }
    rend.render(scn, cam);
    overlay(T);
  }
  // экранный прямоугольник существа (для наведения и подписи)
  const V3 = new THREE.Vector3();
  function scr2(x, y, z){ V3.set(x, y, z).project(cam); return [(V3.x + 1)/2*W3, (1 - V3.y)/2*H3]; }
  function pick(px, py){
    if (cmp || (cur < 0 && !bmOn) || trn || life < .8) return -1;
    let best = -1, bs = 1e9;
    INST.forEach((I, q) => { if (I.fossilOnly) return; const sp = I.sp, hw = (sp.ar >= 1 ? .5 : .5*sp.ar)*I.h, hh = (sp.ar >= 1 ? .5/sp.ar : .5)*I.h;
      const a = scr2(I.sx - hw, I.sy + hh, I.Z), b = scr2(I.sx + hw, I.sy - hh, I.Z);
      const x0 = Math.min(a[0], b[0]) - 6, x1 = Math.max(a[0], b[0]) + 6, y0 = Math.min(a[1], b[1]) - 6, y1 = Math.max(a[1], b[1]) + 6;
      if (px < x0 || px > x1 || py < y0 || py > y1) return;
      const area = (x1 - x0)*(y1 - y0)*(I.plant ? 6 : 1) - I.Z*1e3; if (area < bs){ bs = area; best = q; } });
    return best;
  }
  // очистка слоя подписей; два вызова — обход редкой ошибки ускоренного 2D-холста (первый clearRect после текста иногда теряется)
  function labClear(){ ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, lab.width, lab.height); ctx2.clearRect(0, 0, lab.width, lab.height); }
  function overlay(T){
    const c = ctx2; labClear(); c.setTransform(DPR3, 0, 0, DPR3, 0, 0);
    if (cmp){ cmpOverlay(c); return; }
    const q = hov >= 0 ? hov : -1; if (q < 0 || !INST[q] || trn) return;
    const I = INST[q], sp = I.sp, hh = (sp.ar >= 1 ? .5/sp.ar : .5)*I.h, p = scr2(I.sx, I.sy - hh - .12, I.Z), S = BIO_SP[I.k];
    c.font = "400 17px Forum, Georgia, serif"; c.textAlign = "center"; c.textBaseline = "top";
    c.lineJoin = "round"; c.lineWidth = 5; c.strokeStyle = "rgba(5,6,12,.85)"; c.strokeText(S.ru, p[0], p[1] + 4);
    c.fillStyle = "rgba(255,222,170,.92)"; c.fillText(S.ru, p[0], p[1] + 4);
    c.font = "10px 'JetBrains Mono', monospace"; c.fillStyle = "rgba(220,205,180,.55)"; c.fillText("нажмите — портрет", p[0], p[1] + 26);
  }

  // ---- колонна пластов ----
  function column(){
    colEl.innerHTML = BIO_ERAS.slice().reverse().map(E => { const i = E.n - 1;
      return `<button data-e="${i}" class="${i === cur && !cmp ? "on" : ""} ${E.ready ? "rd" : ""}" style="--c:${E.col};flex-grow:${W_ERA[i]}" aria-label="${esc(E.nm + ", " + E.t)}" data-hover><span>${esc(E.nm)}</span></button>`; }).join("");
    colEl.querySelectorAll("[data-e]").forEach(b => b.onclick = () => go(+b.dataset.e));
  }
  function hint(){
    const h = $("bioHint"); if (!h) return;
    h.textContent = mechOn ? (MK === "basics" ? "Живая схема · переключайте в карточке" : "Живая модель · меняйте условия в карточке") : bmOn ? "Биом сегодня · наведите на существо — имя · нажмите — портрет" : cmp ? "Сравнение размера · линейка внизу" : cur < 0 ? "Листайте вниз — вглубь времени · или выберите пласт в колонне справа"
      : !BIO_ERAS[cur].ready ? "Пласт ещё не раскрыт — листайте дальше вниз"
      : life < .5 ? "Окаменелости в породе… сейчас они оживут" : "Наведите на существо — имя · нажмите — портрет";
    const mb = $("bioMechB"), ab = $("bioBasB"), bb = $("bioBmB"), mm = mechOn && MK === "mech", ba = mechOn && MK === "basics";
    if (mb){ mb.textContent = mm ? "← К пластам" : "Механизмы эволюции"; mb.setAttribute("aria-pressed", String(mm)); }
    if (ab){ ab.textContent = ba ? "← К пластам" : "Основы биологии"; ab.setAttribute("aria-pressed", String(ba)); }
    if (bb){ bb.textContent = bmOn ? "← К пластам" : "Биомы Земли"; bb.setAttribute("aria-pressed", String(bmOn)); }
    const gb = $("bioGalB"); if (gb){ gb.textContent = gal.on ? "← К пластам" : "Галерея существ"; gb.setAttribute("aria-pressed", String(gal.on)); }
    const lb = $("bioLife"); if (lb){ lb.hidden = mechOn || cmp || bmOn || !(cur >= 0 && BIO_ERAS[cur].ready); lb.textContent = lifeT > .5 ? "Вернуть в камень" : "Оживить окаменелости"; lb.setAttribute("aria-pressed", String(lifeT > .5)); }
  }

  // ---- глобус эпохи: положение материков (BIO_PALEO), 2D-холст в карточке, ортографическая проекция ----
  const PALEO = {};
  function paleo(age){
    if (PALEO[age]) return PALEO[age];
    const raw = atob(BIO_PALEO[age]), M = new Uint8Array(360*180); let i = 0, p = 0, on = 0;
    while (i < raw.length){ let v = 0, s = 0, c; do { c = raw.charCodeAt(i++); v |= (c & 127) << s; s += 7; } while (c > 127); if (on) M.fill(1, p, p + v); p += v; on ^= 1; }
    const P = [];   // точки суши на сетке 1,5°, на сфере
    for (let la = -88.5; la < 90; la += 1.5){ const st = 1.5/Math.max(.2, Math.cos(la*Math.PI/180)); for (let lo = -180; lo < 180; lo += st){
      const yi = Math.min(179, Math.floor(la + 90)), xi = (Math.floor(lo + 180) + 360) % 360; if (!M[yi*360 + xi]) continue;
      const a = la*Math.PI/180, b = lo*Math.PI/180; P.push(Math.cos(a)*Math.cos(b), Math.sin(a), Math.cos(a)*Math.sin(b)); } }
    return PALEO[age] = new Float32Array(P);
  }
  let gRaf = 0, gRot = .6, gDrag = null;
  function globeStart(age, col){
    cancelAnimationFrame(gRaf); const cv = $("bioGlobe"); if (!cv) return;
    const P = paleo(age), d = Math.min(2, devicePixelRatio || 1), S = cv.clientWidth || 220; cv.width = cv.height = S*d; const x = cv.getContext("2d"); x.scale(d, d);
    const R = S*.44, c = S/2, cc = col.map(v => Math.round(v*255)), tilt = .35;
    cv.onpointerdown = e => { gDrag = { x: e.clientX, r: gRot }; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if (gDrag) gRot = gDrag.r + (e.clientX - gDrag.x)*.012; };
    cv.onpointerup = cv.onpointercancel = () => { gDrag = null; };
    let last = performance.now();
    const draw = now => {
      if (!open || !document.body.contains(cv)){ gRaf = 0; return; }
      const dt = Math.min(.1, (now - last)/1000); last = now; if (!gDrag) gRot += dt*.12;
      x.clearRect(0, 0, S, S);
      const g = x.createRadialGradient(c - R*.3, c - R*.35, R*.1, c, c, R); g.addColorStop(0, "rgba(40,70,110,.55)"); g.addColorStop(1, "rgba(8,14,30,.75)");
      x.fillStyle = g; x.beginPath(); x.arc(c, c, R, 0, TAU); x.fill(); x.strokeStyle = "rgba(214,172,94,.35)"; x.lineWidth = 1; x.stroke();
      const cr = Math.cos(gRot), sr = Math.sin(gRot), ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i < P.length; i += 3){
        let X = P[i]*cr - P[i + 2]*sr, Z = P[i]*sr + P[i + 2]*cr, Y = P[i + 1];
        const Y2 = Y*ct - Z*st, Z2 = Y*st + Z*ct; if (Z2 < 0) continue;
        const l = .35 + .65*Math.max(0, X*-.4 + Y2*.5 + Z2*.75);
        x.fillStyle = `rgba(${cc[0]},${cc[1]},${cc[2]},${(.35 + .65*l).toFixed(2)})`; x.fillRect(c + X*R - .9, c - Y2*R - .9, 1.8, 1.8);
      }
      gRaf = requestAnimationFrame(draw); };
    gRaf = requestAnimationFrame(draw);
  }
  function globeHTML(E){
    if (E.map == null) return E.n <= 3 ? `<h4>Материки</h4><p class="tm-pr bio-p">${mk("h")} Какими были материки так давно, почти неизвестно: от тех пород сохранились лишь обломки.</p>`
      : `<h4>Материки</h4><p class="tm-pr bio-p">${mk("h")} Для эпох старше миллиарда лет реконструкции материков очень неуверенны — разные модели расходятся, поэтому глобуса здесь нет.</p>`;
    return `<h4>Материки · ${E.map ? "≈ " + E.map + " млн лет назад" : "сегодня"}</h4><div class="bio-globe"><canvas id="bioGlobe" aria-label="Глобус: положение материков в эту эпоху"></canvas>
      <p class="bio-cr">${mk("h")} ${E.map > 320 ? `Древние материки и микроконтиненты по модели движения плит Merdith et al. 2021 (GPlates, EarthByte). Для эпох старше ≈ 540 млн лет положения особенно неуверенны; долгота условна — глобус можно вращать.` : `Нынешние очертания материков, перенесённые в их положение той эпохи по палеомагнитным полюсам вращения (открытый пакет PmagPy). Древние берега и мелкие моря не показаны; долготу палеомагнетизм не определяет — глобус можно вращать.`}</p></div>`;
  }

  // ======== 13г · галерея существ: фильтры, поиск, сравнение размера с человеком ========
  const SP_ERA = {}; BIO_ERAS.forEach((E, i) => (E.sp || []).forEach(k => { if (SP_ERA[k] == null) SP_ERA[k] = i; }));
  const GAL_ALL = Object.keys(BIO_SP).filter(k => SP_ERA[k] != null);
  const TPAR = {}; (typeof TREE_ROWS !== "undefined" ? TREE_ROWS : []).forEach(r => TPAR[r[0]] = r[1]);
  const anc = id => { const A = new Set(); let x = id, g = 0; while (x && g++ < 60){ A.add(x); x = TPAR[x]; } return A; };
  const GROUPS = [["people", "Люди и гоминины", A => A.has("hominin")], ["mam", "Звероящеры и млекопитающие", A => A.has("syn")], ["birds", "Птицы", A => A.has("birds")],
    ["rept", "Рептилии и динозавры", A => A.has("amn")], ["tetra", "Земноводные и первые четвероногие", A => A.has("tetra")], ["fish", "Рыбы и ранние позвоночные", A => A.has("chord")],
    ["inv", "Беспозвоночные", A => A.has("ani")], ["plant", "Растения", A => A.has("apl")], ["micro", "Микробы и другие", A => true]];
  const GRP = {}; GAL_ALL.forEach(k => { const A = anc(BIO_SP[k].tree); GRP[k] = (GROUPS.find(g => g[2](A)) || GROUPS[GROUPS.length - 1])[0]; });
  const INV_TAGS = [
    ["oxy", "Фотосинтез и кислород", "cyano cooks lepid ginkg wheat"], ["eyes", "Глаза", "anom opab trilo isot octo"],
    ["armor", "Броня и панцирь", "trilo isot wiwa sacab astra dunk scut ankyl glypt limul trice"], ["jaws", "Челюсти, зубы, клыки", "guiyu dunk clado helic dimet inos trex megal smilo liopl"],
    ["land", "Выход на сушу", "cooks tikt acan ichth eusth arthr pulmo hylo"], ["flight", "Полёт", "megan eudim rhamp ptera quetz archx micro bee"],
    ["feather", "Перья", "archx anchi sinos micro veloc gasto dodo"], ["giant", "Гигантизм", "megan arthr brach diplo argen parac bwhale megal shoni quetz titan mammo deino isot"],
    ["sea", "Возвращение в воду", "notho shoni ichsa plesi liopl mosa meso pakic ambul basil bwhale"], ["mam", "Путь к млекопитающим", "dimet edaph inos estem lystr thrin morga jurama repen purga"],
    ["human", "Прямохождение и культура", "sahel austr erect neand sapie"], ["dom", "Одомашнивание", "dog cow wheat"],
    ["living", "Живые ископаемые", "nauti coela limul ginkg"], ["tough", "Стойкость и регенерация", "tardi axolo lystr physa"], ["lost", "Исчезли из-за человека", "dodo thyla cow"]];
  const gal = { on: false, era: "all", grp: "all", inv: "all", q: "", sort: "time" };
  function galList(){
    const q = gal.q.trim().toLowerCase(), tag = INV_TAGS.find(t => t[0] === gal.inv);
    let L = GAL_ALL.filter(k => (gal.era === "all" || SP_ERA[k] === +gal.era) && (gal.grp === "all" || GRP[k] === gal.grp) && (!tag || tag[2].split(" ").includes(k))
      && (!q || BIO_SP[k].ru.toLowerCase().includes(q) || BIO_SP[k].lat.toLowerCase().includes(q)));
    L.sort((a, b) => gal.sort === "size" ? BIO_SP[b].len - BIO_SP[a].len : SP_ERA[a] - SP_ERA[b] || GAL_ALL.indexOf(a) - GAL_ALL.indexOf(b));
    return L;
  }
  function galCard(){
    const L = galList(), opt = (v, t, s) => `<option value="${v}" ${String(s) === String(v) ? "selected" : ""}>${esc(t)}</option>`;
    return `<div class="tm-bar"><span class="mono eyebrow tm-cat">Биосфера · галерея</span><span class="tm-nav"><button id="bioGalX" data-hover>← К пластам</button></span></div>
      <h3>Галерея существ</h3><p class="tm-ago2">${GAL_ALL.length} существ · 3,5 миллиарда лет жизни</p>
      <p class="tm-lead">Выберите существо — на сцене оно встанет рядом с человеком в настоящем масштабе.</p>
      <div class="bio-flt">
        <label><span class="mono">Эпоха</span><select id="bgEra">${opt("all", "Все эпохи", gal.era)}${BIO_ERAS.map((E, i) => E.sp && E.sp.length ? opt(i, E.nm, gal.era) : "").join("")}</select></label>
        <label><span class="mono">Группа</span><select id="bgGrp">${opt("all", "Все группы", gal.grp)}${GROUPS.filter(g => GAL_ALL.some(k => GRP[k] === g[0])).map(g => opt(g[0], g[1], gal.grp)).join("")}</select></label>
        <label><span class="mono">Изобретение</span><select id="bgInv">${opt("all", "Любое", gal.inv)}${INV_TAGS.map(t => opt(t[0], t[1], gal.inv)).join("")}</select></label>
        <label class="bio-q"><span class="mono">Поиск</span><input id="bgQ" type="search" placeholder="имя или латынь" value="${esc(gal.q)}" autocomplete="off"></label>
        <div class="bio-sort"><button class="tm-tog" data-sort="time" aria-pressed="${gal.sort === "time"}" data-hover>По времени</button><button class="tm-tog" data-sort="size" aria-pressed="${gal.sort === "size"}" data-hover>По размеру</button></div>
      </div>
      <p class="bio-gn mono">найдено: ${L.length}</p>
      <div class="bio-chips bio-grid">${L.map(k => `<button class="bio-sp${cmpK === k ? " on" : ""}" data-gk="${k}" data-hover><img src="${thumb(k, 84, 44)}" alt=""><span>${esc(BIO_SP[k].ru)}</span><i style="--c:${BIO_ERAS[SP_ERA[k]].col}">${esc(BIO_ERAS[SP_ERA[k]].nm)}</i></button>`).join("") || `<p class="tm-pr">Ничего не нашлось — попробуйте другой фильтр.</p>`}</div>
      <p class="bio-cr">${mk("h")} Размеры — по оценкам палеонтологов; у летающих указан размах крыльев, у растений — высота. Силуэты — PhyloPic.</p>`;
  }
  function galBind(){
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    on("bioGalX", () => galOff());
    [["bgEra", "era"], ["bgGrp", "grp"], ["bgInv", "inv"]].forEach(([id, key]) => { const el = $(id); if (el) el.onchange = () => { gal[key] = el.value; card(); }; });
    const qi = $("bgQ"); if (qi){ qi.oninput = () => { gal.q = qi.value; const p = qi.selectionStart; card(); const n = $("bgQ"); if (n){ n.focus(); try { n.setSelectionRange(p, p); } catch(e){} } }; }
    cardEl.querySelectorAll("[data-sort]").forEach(b => b.onclick = () => { gal.sort = b.dataset.sort; card(); });
    cardEl.querySelectorAll("[data-gk]").forEach(b => b.onclick = () => { compare(b.dataset.gk); view = b.dataset.gk; jrMark("bio", "sp:" + view, BIO_SP[view].ru); card(); });
  }
  // сцена сравнения: существо и человек в одном масштабе, линейка внизу
  let CMP_FLOOR = -3.3;
  function compare(k){
    cmpK = k; cmp = true; trn = null; sel = -1; hov = -1;
    const port = W3 < 760, S = BIO_SP[k], tiny = S.len < .05;
    CMP_FLOOR = port ? -1.0 : -3.3; const maxH = port ? 3.4 : 5.2, maxW = port ? 5.4 : 7.8;
    const sp = BIO_MASK[k] ? species(k) : null, ar = sp ? sp.ar : 1, arH = species("sapie").ar;
    // размеры в метрах → общий масштаб, чтобы пара поместилась и по высоте, и по ширине
    const hCm = tiny ? 0 : (S.dim || S.len), wCm = ar >= 1 ? hCm : hCm*ar, tCm = ar >= 1 ? hCm/ar : hCm;
    const wHm = 1.7*arH, gapM = .25*Math.max(1.7, hCm);
    let sc = Math.min(maxH/Math.max(1.7, tCm), maxW/Math.max(1e-6, wCm + gapM + wHm));
    let hC = tiny ? (port ? 1.8 : 2.4) : hCm*sc; const hH = 1.7*sc;
    const wC = ar >= 1 ? hC : hC*ar, wH = hH*arH, gap = tiny ? .5 : gapM*sc;
    const total = wC + gap + wH, x0 = -total/2 - (port ? .25 : .5);
    const L = [];
    if (sp) L.push({ k, x: x0 + wC/2, y: CMP_FLOOR + (ar >= 1 ? hC/ar : hC)/2, z: 0, h: hC, v: 0 });
    if (k !== "sapie") L.push({ k: "sapie", x: x0 + wC + gap + wH/2, y: CMP_FLOOR + hH/2, z: 0, h: hH, v: 0 });
    INST = makeInst(-1, L); INST.forEach(I => { I.F = I.k === "sapie" && k !== "sapie" ? -(I.face || 1) : (I.face || 1); });
    cmpInfo = { sc, tiny, mag: tiny ? hC/(S.len*sc) : 1, k };
    makeEnv(null); sky.dataset.w = ""; life = lifeT = 1; lifeAt = 0;
    Music.voice("bio:cells", false); column(); hint();
  }
  function cmpOverlay(c){
    if (!cmpInfo) return;
    const S = BIO_SP[cmpInfo.k], a = scr2(0, CMP_FLOOR, 0), b = scr2(1, CMP_FLOOR, 0), ppu = Math.abs(b[0] - a[0]), ppm = ppu*cmpInfo.sc;
    const steps = [.01, .05, .1, .5, 1, 2, 5, 10];
    let st = steps.find(v => v*ppm >= 50) || 10; const n = Math.max(1, Math.min(10, Math.floor(240/(st*ppm))));
    const y = a[1] + 18, xL = scr2(INST[0] ? INST[0].X - INST[0].h*.5 : -2, CMP_FLOOR, 0)[0];
    c.strokeStyle = "rgba(214,172,94,.7)"; c.fillStyle = "rgba(230,218,192,.75)"; c.lineWidth = 1; c.font = "10px 'JetBrains Mono', monospace"; c.textAlign = "center"; c.textBaseline = "top";
    c.beginPath(); c.moveTo(xL, y); c.lineTo(xL + n*st*ppm, y); for (let i = 0; i <= n; i++){ c.moveTo(xL + i*st*ppm, y - 4); c.lineTo(xL + i*st*ppm, y + 4); } c.stroke();
    const fmt = v => v >= 1 ? (v % 1 ? String(v).replace(".", ",") : v) + " м" : Math.round(v*100) + " см";
    c.fillText("0", xL, y + 7); c.fillText(fmt(st*n), xL + n*st*ppm, y + 7);
    c.font = "400 15px Forum, Georgia, serif"; c.textBaseline = "bottom";
    INST.forEach(I => { const hh = (I.sp.ar >= 1 ? .5/I.sp.ar : .5)*I.h, p = scr2(I.X, I.Y + hh + .12, 0), SS = BIO_SP[I.k];
      c.fillStyle = "rgba(255,222,170,.92)"; c.fillText(SS.ru, p[0], p[1]);
      c.font = "10px 'JetBrains Mono', monospace"; c.fillStyle = "rgba(220,205,180,.6)"; c.fillText(I.k === "sapie" && cmpInfo.k !== "sapie" ? "1,7 м" : SS.lenT, p[0], p[1] - 18); c.font = "400 15px Forum, Georgia, serif"; });
    if (cmpInfo.tiny){ c.font = "11px 'JetBrains Mono', monospace"; c.fillStyle = "rgba(160,200,255,.8)"; c.textBaseline = "top"; const p = scr2(INST[0].X, CMP_FLOOR, 0);
      c.fillText(`увеличено ≈ в ${Math.round(cmpInfo.mag).toLocaleString("ru-RU")} раз`, p[0], p[1] + 34); }
  }
  function galOn(k){ if (bmOn) bmLeave(); if (mechOn){ mechOn = false; mi = -1; box.classList.remove("bio-mech"); } gal.on = true; view = null; compare(k || cmpK || "anom"); card(); }
  function galOff(){ gal.on = false; cmp = false; cmpK = null; view = null; labClear(); arrive(cur); life = lifeT = cur >= 0 && BIO_ERAS[cur].ready ? 1 : 0; lifeAt = 0; column(); card(); }

  // ======== 13д · механизмы эволюции: опыты на 2D-холсте #bioSim ========
  const simC = $("bioSim"); let simG = null, mechOn = false, mi = -1, MSET = BIO_MECH, MK = "mech"; const MS = {};
  function mechState(i){ const M = MSET[i]; if (!MS[M.id]){ MS[M.id] = {}; M.init(MS[M.id]); } return MS[M.id]; }
  function simRect(){
    const port = W3 < 760, mx = box.classList.contains("tm-max"), r = box.querySelector(".time-in").getBoundingClientRect();
    if (port) return { x: 18, y: 78, w: W3 - 70, h: Math.max(120, r.top - 110) };
    const x0 = mx ? r.right + 50 : Math.max(r.right + 60, W3*.36);
    return { x: x0, y: 110, w: W3 - x0 - 90, h: H3 - 190 };
  }
  function mechFrame(dt, T){
    if (!simG) simG = simC.getContext("2d");
    const d = DPR3; if (simC.width !== Math.round(W3*d) || simC.height !== Math.round(H3*d)){ simC.width = Math.round(W3*d); simC.height = Math.round(H3*d); }
    simG.setTransform(1, 0, 0, 1, 0, 0); simG.clearRect(0, 0, simC.width, simC.height); simG.clearRect(0, 0, simC.width, simC.height); simG.setTransform(d, 0, 0, d, 0, 0);
    if (mi < 0) return;
    const M = MSET[mi], S = mechState(mi); M.step(S, Math.min(dt, .1)); M.draw(simG, simRect(), S, T);
  }
  function mechCard(){
    const B = MK === "basics", N = MSET.length;
    if (mi < 0) return `<div class="tm-bar"><span class="mono eyebrow tm-cat">Биосфера · ${B ? "основы" : "механизмы"}</span><span class="tm-nav"><button id="bioMechX" data-hover>← К пластам</button></span></div>
      <h3>${B ? "Основы биологии" : "Механизмы эволюции"}</h3><p class="tm-ago2">${N} ${B ? "тем" : "опытов"}</p>
      <p class="tm-lead">${B ? "Из чего сделано живое и как оно работает: клетка, гены, энергия, пищевые цепи и вечное движение атомов. Каждая тема — живая схема." : "Как из случайных изменений и отбора получается всё разнообразие жизни. Каждый опыт — маленькая живая модель: меняйте условия и смотрите, что происходит."}</p>
      <div class="bio-mlist">${MSET.map((M, i) => `<button data-mi="${i}" data-hover><b>${i + 1}</b><span><i>${esc(M.nm)}</i><small>${esc(M.sub)}</small></span></button>`).join("")}</div>
      <p class="bio-cr">${mk("h")} ${B ? "Схемы упрощены и не в масштабе; числа и факты — в каждой теме, с пометками надёжности." : "Модели упрощены: они показывают сам механизм, а не точные числа. Факты о природе — в каждом опыте."}</p>
      <div class="tm-gos"><button class="btn tm-go" id="bioMSwap" data-hover>${B ? "Механизмы эволюции →" : "Основы биологии →"}</button></div>`;
    const M = MSET[mi], S = mechState(mi);
    const ctl = M.ctl.map(c => c.t === "seg" ? `<div class="bio-seg">${c.o.map(([v, l]) => `<button class="tm-tog" data-mk="${c.k}" data-mv="${v}" aria-pressed="${String(S.p[c.k]) === String(v)}" data-hover>${esc(l)}</button>`).join("")}</div>`
      : c.t === "range" ? `<label class="bio-rng"><span class="mono">${esc(c.l)}</span><input type="range" data-mr="${c.k}" min="${c.min}" max="${c.max}" step="${c.step}" value="${S.p[c.k]}"><b>${(+S.p[c.k]).toFixed(2)}</b></label>`
      : `<button class="btn tm-go" data-mb="${c.k}" data-hover>${esc(c.l)}</button>`).join("");
    return `<div class="tm-bar"><span class="mono eyebrow tm-cat">${B ? "Основы · тема" : "Механизмы · опыт"} ${mi + 1} из ${N}</span><span class="tm-nav"><button id="bioMPrev" ${mi ? "" : "disabled"} aria-label="Предыдущий" data-hover>←</button><button id="bioMNext" ${mi < N - 1 ? "" : "disabled"} aria-label="Следующий" data-hover>→</button></span></div>
      <h3>${esc(M.nm)}</h3><p class="tm-ago2">${esc(M.sub)}</p><p class="tm-lead">${esc(M.lead)}</p>
      <div class="bio-mctl">${ctl}</div>
      <h4>Что происходит</h4><p class="tm-pr bio-p">${esc(M.how)}</p>
      <h4>В природе</h4><p class="tm-pr bio-p">${esc(M.nature)}</p>
      <h4>Наука</h4><ul class="list">${M.sci.map(([m, t]) => `<li>${mk(m)}<span>${esc(t)}</span></li>`).join("")}</ul>
      <div class="tm-gos"><button class="btn tm-go" id="bioMList" data-hover>← ${B ? "Все темы" : "Все опыты"}</button></div>`;
  }
  function mechBind(){
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    on("bioMechX", () => mechOff()); on("bioMList", () => { mi = -1; card(); });
    on("bioMPrev", () => { mi = Math.max(0, mi - 1); card(); }); on("bioMNext", () => { mi = Math.min(MSET.length - 1, mi + 1); card(); });
    on("bioMSwap", () => mechOn_(-1, MK === "basics" ? "mech" : "basics"));
    cardEl.querySelectorAll("[data-mi]").forEach(b => b.onclick = () => { mi = +b.dataset.mi; card(); });
    if (mi < 0) return;
    const M = MSET[mi], S = mechState(mi);
    cardEl.querySelectorAll("[data-mk]").forEach(b => b.onclick = () => { const c = M.ctl.find(c => c.k === b.dataset.mk), o = c.o.find(o => String(o[0]) === b.dataset.mv);
      S.p[c.k] = o[0]; if (M.on) M.on(S, c.k); cardEl.querySelectorAll(`[data-mk="${c.k}"]`).forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
    cardEl.querySelectorAll("[data-mr]").forEach(r => r.oninput = () => { S.p[r.dataset.mr] = +r.value; r.nextElementSibling.textContent = (+r.value).toFixed(2); });
    cardEl.querySelectorAll("[data-mb]").forEach(b => b.onclick = () => { const k = b.dataset.mb; if (k === "reset"){ M.init(S); } else if (k === "cellst"){ close(); if (typeof goTo === "function") goTo(7); } else if (M.on) M.on(S, k); });
  }
  function mechOn_(i, kind){ if (gal.on || cmp){ gal.on = false; cmp = false; cmpK = null; labClear(); } if (bmOn) bmLeave();
    MK = kind || "mech"; MSET = MK === "basics" ? BIO_BASICS : BIO_MECH;
    mechOn = true; mi = i == null ? -1 : i; view = null; box.classList.add("bio-mech"); Music.voice("bio:cells", false); hint(); card(); }
  function mechOff(){ mechOn = false; mi = -1; box.classList.remove("bio-mech"); arrive(cur); life = lifeT = cur >= 0 && BIO_ERAS[cur].ready ? 1 : 0; lifeAt = 0; column(); card(); }
  // ======== 13е · биомы Земли: та же WebGL-сцена, без породы ========
  let bmOn = false, bi = 0;
  function bmShow(i){ bi = clamp(i, 0, BIO_BIOMES.length - 1); const B = BIO_BIOMES[bi]; sel = -1; hov = -1; view = null;
    INST = makeInst(-1, (BIO_BSCENE[B.id] || []).map(([k, x, y, h, z, v]) => ({ k, x, y, z, h, v })), B.world);
    makeEnv(B.world); sky.dataset.w = B.world; life = lifeT = 1; lifeAt = 0;
    jrMark("bio", "biome:" + B.id, B.nm); Music.voice("bio:" + B.world, false); card(); }
  function bmOn_(i){ if (mechOn){ mechOn = false; mi = -1; box.classList.remove("bio-mech"); } if (gal.on || cmp){ gal.on = false; cmp = false; cmpK = null; labClear(); }
    trn = null; bmOn = true; box.classList.add("bio-bm"); column(); bmShow(i == null ? bi : i); }
  function bmLeave(){ bmOn = false; box.classList.remove("bio-bm"); }
  function bmOff(){ bmLeave(); view = null; sel = -1; arrive(cur); life = lifeT = cur >= 0 && BIO_ERAS[cur].ready ? 1 : 0; lifeAt = 0; column(); card(); }
  function bmBar(nm, f, txt, na){ return `<div class="bio-g${na ? " na" : ""}"><span class="mono">${nm}</span><div class="bio-gt">${na ? "" : `<i style="width:${(clamp(f, .02, 1)*100).toFixed(1)}%"></i>`}</div><span class="bio-gv">${mk(na ? "s" : "h")}${esc(txt)}</span></div>`; }
  function bmCard(){
    const B = BIO_BIOMES[bi], L = (BIO_BSCENE[B.id] || []).map(r => r[0]).filter(k => BIO_SP[k]);
    return `<div class="tm-bar"><span class="mono eyebrow tm-cat">Биомы Земли · ${bi + 1} из ${BIO_BIOMES.length}</span><span class="tm-nav"><button id="bioBPrev" ${bi ? "" : "disabled"} aria-label="Предыдущий биом" data-hover>←</button><button id="bioBNext" ${bi < BIO_BIOMES.length - 1 ? "" : "disabled"} aria-label="Следующий биом" data-hover>→</button></span></div>
      <div class="bio-chips bio-bms">${BIO_BIOMES.map((b, i) => `<button class="tm-tog" data-bm="${i}" aria-pressed="${i === bi}" data-hover>${esc(b.nm)}</button>`).join("")}</div>
      <h3>${esc(B.nm)}</h3><p class="tm-ago2">${esc(B.where)}</p><p class="tm-lead">${esc(B.lead)}</p>
      <div class="bio-gs" aria-label="Типичные условия биома">
        ${bmBar("°C", (B.t[0] + 20)/50, B.t[1])}${bmBar("осадки", B.p[0] == null ? 0 : B.p[0]/4000, B.p[0] == null ? "под водой — не важны" : B.p[1], B.p[0] == null)}${bmBar("жизнь", B.npp[0]/2500, B.npp[1] + (B.npp[0] > 20 ? " г/м² в год" : ""))}
        <p class="bio-gn mono">«жизнь» — продуктивность: сколько граммов сухого вещества создают за год растения и водоросли на квадратном метре</p></div>
      <h4>Кто живёт</h4><p class="tm-pr bio-p">${esc(B.who)}</p>
      ${L.length ? `<div class="bio-chips">${L.map(k => `<button class="bio-sp" data-sp="${k}" data-hover><img src="${thumb(k, 84, 44)}" alt=""><span>${esc(BIO_SP[k].ru)}</span></button>`).join("")}</div>` : ""}
      <h4>Удивительное</h4><p class="tm-pr bio-p">${esc(B.wow)}</p>
      <h4>Что ему грозит</h4><p class="tm-pr bio-p">${esc(B.threat)}</p>
      <h4>Наука</h4><ul class="list">${B.sci.map(([m, t]) => `<li>${mk(m)}<span>${esc(t)}</span></li>`).join("")}<li>${mk("h")}<span>Цифры приборов — типичные значения; внутри биома разброс большой</span></li></ul>
      <div class="tm-gos"><button class="btn tm-go" id="bioBmX" data-hover>← К пластам</button><button class="btn tm-go" id="bioBas2" data-hover>Основы биологии →</button></div>`;
  }
  function bmBind(){
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    on("bioBPrev", () => bmShow(bi - 1)); on("bioBNext", () => bmShow(bi + 1)); on("bioBmX", () => bmOff()); on("bioBas2", () => mechOn_(-1, "basics"));
    cardEl.querySelectorAll("[data-bm]").forEach(b => b.onclick = () => bmShow(+b.dataset.bm));
  }
  // ---- карточки ----
  const licShort = l => /zero/.test(l) ? "CC0" : /mark/.test(l) ? "общественное достояние" : /by\/([\d.]+)/.test(l) ? "CC BY " + l.match(/by\/([\d.]+)/)[1] : l;
  const credit = k => { const c = BIO_CREDITS[k]; return c ? `${c[0] ? esc(c[0]) + " · " : ""}${esc(licShort(c[1]))} · PhyloPic` : "PhyloPic"; };
  function gauge(nm, now, val, txt, m, max, lg){
    const f = x => lg ? Math.log10(Math.max(1, x))/Math.log10(max) : x/max;
    if (val == null) return `<div class="bio-g na"><span class="mono">${nm}</span><div class="bio-gt"><b style="left:${(clamp(f(now), 0, 1)*100).toFixed(1)}%" title="сегодня"></b></div><span class="bio-gv">${mk(m)}${esc(txt)}</span></div>`;
    return `<div class="bio-g"><span class="mono">${nm}</span><div class="bio-gt"><i style="width:${(clamp(f(val), .02, 1)*100).toFixed(1)}%"></i><b style="left:${(clamp(f(now), 0, 1)*100).toFixed(1)}%" title="сегодня"></b></div><span class="bio-gv">${mk(m)}${esc(txt)}</span></div>`;
  }
  function card(){
    const E = cur >= 0 ? BIO_ERAS[cur] : null;
    let h;
    if (mechOn){ h = mechCard(); if (mi >= 0) jrMark("bio", MK + ":" + MSET[mi].id, MSET[mi].nm); }
    else if (bmOn && !view){ h = bmCard(); }
    else if (gal.on && !view){ h = galCard(); }
    else if (view && BIO_SP[view]){ const S = BIO_SP[view], k = view;
      const mxL = Math.max(1.7, S.len), wH = 1.7/mxL*100, wS = S.len/mxL*100;
      const SE = BIO_ERAS[SP_ERA[k]];
      h = `<div class="tm-bar"><span class="mono eyebrow tm-cat">${esc(gal.on ? "Галерея" : bmOn ? BIO_BIOMES[bi].nm : E ? E.nm : "")} · портрет</span><span class="tm-nav"><button id="bioBack" data-hover>← ${esc(gal.on ? "Галерея" : bmOn ? BIO_BIOMES[bi].nm : E ? E.nm : "Назад")}</button></span></div>
        <img class="bio-port" src="${thumb(k, 520, 240)}" alt="Силуэт: ${esc(S.ru)}">
        <h3>${esc(S.ru)}</h3><p class="tm-ago2"><i>${esc(S.lat)}</i></p><p class="bio-grp mono">${esc(S.grp)}</p>
        <div class="bio-size" aria-label="Сравнение размера с человеком"><div><span>Человек · 1,7 м</span><i style="width:${Math.max(.6, wH).toFixed(2)}%"></i></div><div><span>${esc(S.ru)} · ${esc(S.lenT)}</span><i class="s" style="width:${Math.max(.6, wS).toFixed(2)}%"></i></div></div>
        <h4>${S.bio ? "Как приспособлен" : "Главное изобретение"}</h4><p class="tm-pr bio-p">${esc(S.inv)}</p>
        <h4>Удивительное</h4><p class="tm-pr bio-p">${esc(S.wow)}</p>
        <h4>${S.bio ? "Что ему грозит" : "Что досталось нам"}</h4><p class="tm-pr bio-p">${esc(S.legacy)}</p>
        <h4>Наука</h4><ul class="list">${S.sci.map(([m, t]) => `<li>${mk(m)}<span>${esc(t)}</span></li>`).join("")}<li>${mk("h")}<span>${S.bio ? "Цвета на сцене условные: силуэт показывает форму, а не окраску" : "Цвета на сцене — реконструкция: окраска этого существа неизвестна"}</span></li></ul>
        <div class="tm-gos">${gal.on ? (SE ? `<button class="btn tm-go" id="bioToEra" data-hover>В пласт «${esc(SE.nm)}» →</button>` : "") : bmOn ? "" : `<button class="btn tm-go" id="bioCmp" data-hover>Рядом с человеком →</button>`}${S.tree ? `<button class="btn tm-go" id="bioTree" data-hover>В Древе жизни →</button>` : ""}</div>
        <p class="bio-cr">Силуэт: ${credit(k)}</p>`;
    } else if (!E){
      h = `<div class="tm-bar"><span class="mono eyebrow tm-cat">Биосфера · учебник жизни</span><span class="tm-nav"><button id="bioDown" aria-label="Вниз, в прошлое" data-hover>↓</button></span></div>
        <h3>Пласты камня</h3><p class="tm-ago2">20 пластов · 4,5 миллиарда лет</p>
        <p class="tm-lead">Земля сама записала историю жизни — слоями породы. Чем глубже пласт, тем он древнее.</p>
        <div class="tm-art"><p>Спускайтесь вниз, сквозь колонну. В каждом пласте сначала виден камень с окаменелостями — так их находят палеонтологи. Потом частицы поднимаются из породы и собираются в живых существ, а вокруг проявляется их мир.</p></div>
        <div class="tm-gos"><button class="btn tm-go" id="bioGal" data-hover>Галерея существ · ${GAL_ALL.length} →</button><button class="btn tm-go" id="bioMech" data-hover>Механизмы эволюции · ${BIO_MECH.length} →</button><button class="btn tm-go" id="bioBas" data-hover>Основы биологии · ${BIO_BASICS.length} →</button><button class="btn tm-go" id="bioBm" data-hover>Биомы Земли · ${BIO_BIOMES.length} →</button></div>
        <h4>${BIO_ERAS.every(e => e.ready) ? "Пласты" : `Открыты сейчас · ${BIO_ERAS.filter(e => e.ready).length} из ${NE}`}</h4><div class="bio-chips">${BIO_ERAS.filter(e => e.ready).slice().reverse().map(e => `<button class="tm-tog" data-go="${e.n - 1}" data-hover>${esc(e.nm)}</button>`).join("")}</div>
        <p class="tm-pr">${BIO_ERAS.every(e => e.ready) ? "Открыты все пласты." : "Остальные пласты раскроются в следующих обновлениях; их породу уже можно пройти."} Чтобы пройти историю жизни по порядку, начните с самого дна — с гадея; чтобы идти от нас вглубь — листайте вниз.</p>
        <h4>Как читать</h4><ul class="list">
          <li>${mk("s")}<span>Цвета колонны — цвета Международной стратиграфической шкалы, по которой геологи всего мира раскрашивают карты.</span></li>
          <li>${mk("h")}<span>Толщина пластов не пропорциональна времени: древнейшие пласты сжаты, иначе они заняли бы почти всю колонну.</span></li>
          <li>${mk("h")}<span>На сцене существа не в масштабе — настоящий размер рядом с человеком показан в портрете.</span></li></ul>
        <h4>Наука</h4><ul class="list">
          <li>${mk("s")}<span>Принцип напластования: нижние слои отложились раньше верхних. Его сформулировал Николас Стено в 1669 году.</span></li>
          <li>${mk("s")}<span>Окаменелости — редкая удача: обычно сохраняются только раковины, кости и панцири. Мягкие тела — лишь в исключительных местах вроде сланцев Бёрджес.</span></li></ul>
        <p class="bio-cr">Силуэты существ — свободные научные рисунки PhyloPic; авторы указаны в портретах. Позже их заменят рисунки «Пробуждения».</p>`;
    } else if (!E.ready){
      h = `<div class="tm-bar"><span class="mono eyebrow tm-cat">Пласт ${E.n} из ${NE}</span><span class="tm-nav"><button id="bioUp" aria-label="Выше, ближе к нам" data-hover>↑</button><button id="bioDown" ${cur ? "" : "disabled"} aria-label="Ниже, в прошлое" data-hover>↓</button></span></div>
        <h3>${esc(E.nm)}</h3><p class="tm-ago2">${esc(E.t)}</p><p class="tm-lead">${esc(E.sub)}</p>
        <p class="tm-pr bio-soon">Этот пласт раскроется в следующих обновлениях. Пока можно пройти его породу и спуститься дальше.</p>`;
    } else {
      const G = E.gauges;
      h = `<div class="tm-bar"><span class="mono eyebrow tm-cat">Пласт ${E.n} из ${NE} · ${esc(E.era)}</span><span class="tm-nav"><button id="bioUp" aria-label="Выше, ближе к нам" data-hover>↑</button><button id="bioDown" ${cur ? "" : "disabled"} aria-label="Ниже, в прошлое" data-hover>↓</button></span></div>
        <h3>${esc(E.nm)}</h3><p class="tm-ago2">${esc(E.t)}</p>
        <p class="tm-lead">${esc(E.lead)}</p>
        <div class="bio-gs" aria-label="Приборы эпохи; метка — сегодня">
          ${gauge("O₂", 21, G.o2[0], G.o2[1], G.o2[2], 35)}${gauge("CO₂", 420, G.co2[0], G.co2[1], G.co2[2], 8000, true)}${gauge("°C", 15, G.t[0], G.t[1], G.t[2], 35)}
          <p class="bio-gn mono">светлая метка — сегодня: 21 % · ≈ 420 ppm · ≈ 15 °C</p></div>
        <div class="tm-art">${E.what.split("\n\n").map(p => `<p>${esc(p)}</p>`).join("")}</div>
        ${globeHTML(E)}
        ${E.sp.length ? `<h4>Кто жил</h4>` : ""}<div class="bio-chips">${E.sp.map(k => `<button class="bio-sp" data-sp="${k}" data-hover><img src="${thumb(k, 84, 44)}" alt=""><span>${esc(BIO_SP[k].ru)}</span></button>`).join("")}</div>
        <h4>Изобретение эпохи</h4><p class="tm-pr bio-p">${esc(E.inv)}</p>
        <h4>Что досталось нам</h4><p class="tm-pr bio-p">${esc(E.legacy)}</p>
        <h4>Наука</h4><ul class="list">${E.sci.map(([m, t]) => `<li>${mk(m)}<span>${esc(t)}</span></li>`).join("")}</ul>
        <div class="tm-gos"><button class="btn tm-go" id="bioCal" data-hover>В календаре →</button><button class="btn tm-go" id="bioTree" data-hover>В Древе жизни →</button></div>`;
    }
    cardEl.innerHTML = h;
    cardEl.classList.remove("swap"); void cardEl.offsetWidth; cardEl.classList.add("swap"); scr.scrollTop = 0;
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    on("bioUp", () => go(cur < NE - 1 ? cur + 1 : -1)); on("bioDown", () => go(cur < 0 ? NE - 1 : cur - 1));
    on("bioBack", () => { view = null; sel = -1; card(); });
    on("bioGal", () => galOn());
    on("bioMech", () => mechOn_());
    on("bioBas", () => mechOn_(-1, "basics")); on("bioBm", () => bmOn_(0));
    on("bioCmp", () => galOn(view));
    on("bioToEra", () => { const n = SP_ERA[view]; view = null; go(n); });
    if (gal.on && !view && !mechOn) galBind();
    if (mechOn) mechBind();
    if (bmOn && !view) bmBind();
    on("bioCal", () => { const y = E.cal; close(); openTime(); CHR.goAgo(y); });
    on("bioTree", () => { const id = view ? BIO_SP[view].tree : E.tree; close(); openTree(id); });
    cardEl.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(+b.dataset.go));
    cardEl.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => portrait(b.dataset.sp));
    if (E && E.ready && !view && E.map != null) globeStart(E.map, mixc(ERA_C[cur], [1, .86, .55], .55));
    hint();
  }
  function portrait(k, q){
    view = k; sel = q != null ? q : INST.findIndex(I => I.k === k && !I.fossilOnly);
    jrMark("bio", "sp:" + k, BIO_SP[k].ru); card();
  }
  // ---- переходы по пластам ----
  function go(n){
    if (mechOn){ mechOn = false; mi = -1; box.classList.remove("bio-mech"); }
    let wasCmp = false;
    if (gal.on || cmp || bmOn){ gal.on = false; cmp = false; cmpK = null; cur = -99; wasCmp = true; labClear(); bmLeave(); }
    n = clamp(n, -1, NE - 1); if (n === cur && !trn) { view = null; card(); return; }
    const from = wasCmp ? n : trn ? trn.to : cur;
    view = null; sel = -1; hov = -1;
    trn = { from, to: n, t: 0 }; lifeT = 0; lifeAt = 0;
    cur = n; column(); card();
  }
  function arrive(n){
    INST = makeInst(n); life = 0; lifeT = 0;
    const E = n >= 0 ? BIO_ERAS[n] : null;
    makeEnv(E && E.ready ? E.world : null); sky.dataset.w = E && E.ready ? E.world : "";
    if (E && E.ready) lifeAt = performance.now() + 1300;
    if (E) jrMark("bio", E.id, E.nm);
    Music.voice("bio:" + (E && E.ready ? E.world : "rock"), false);
    hint();
  }
  // ---- ввод ----
  cvs.addEventListener("pointermove", e => { const r = cvs.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = true;
    const q = pick(ptr.x, ptr.y); if (q !== hov){ hov = q; cvs.style.cursor = q >= 0 ? "pointer" : ""; } });
  cvs.addEventListener("pointerleave", () => { ptr.in = false; hov = -1; cvs.style.cursor = ""; });
  cvs.addEventListener("pointerdown", e => { const r = cvs.getBoundingClientRect(); const q = pick(e.clientX - r.left, e.clientY - r.top); if (q >= 0) portrait(INST[q].k, q); });
  let wheelAt = 0;
  cvs.addEventListener("wheel", e => { if (!open) return; e.preventDefault(); if (cmp || mechOn || bmOn) return; const now = performance.now(); if (now - wheelAt < 650 || Math.abs(e.deltaY) < 8) return; wheelAt = now;
    if (e.deltaY > 0){ if (cur !== 0) go(cur < 0 ? NE - 1 : cur - 1); } else if (cur >= 0) go(cur < NE - 1 ? cur + 1 : -1); }, { passive:false });
  let tY = null;
  cvs.addEventListener("touchstart", e => { tY = e.touches[0].clientY; }, { passive:true });
  cvs.addEventListener("touchend", e => { if (tY == null) return; const dy = tY - e.changedTouches[0].clientY; tY = null; if (Math.abs(dy) < 40 || cmp || mechOn || bmOn) return;
    if (dy > 0){ if (cur !== 0) go(cur < 0 ? NE - 1 : cur - 1); } else if (cur >= 0) go(cur < NE - 1 ? cur + 1 : -1); }, { passive:true });
  addEventListener("keydown", e => { if (!open || (e.target && e.target.tagName === "INPUT")) return;
    if (e.key === "Escape"){ e.stopPropagation(); if (mechOn){ if (mi >= 0){ mi = -1; card(); } else mechOff(); } else if (view){ view = null; sel = -1; card(); } else if (bmOn) bmOff(); else if (gal.on) galOff(); else close(); }
    else if (cmp || mechOn || bmOn) return;
    else if (e.key === "ArrowDown" || e.key === "PageDown"){ e.preventDefault(); if (cur !== 0) go(cur < 0 ? NE - 1 : cur - 1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp"){ e.preventDefault(); if (cur >= 0) go(cur < NE - 1 ? cur + 1 : -1); } }, true);
  function size(){ DPR3 = Math.min(2, devicePixelRatio || 1); W3 = cvs.clientWidth; H3 = cvs.clientHeight;
    rend.setPixelRatio(DPR3); rend.setSize(W3, H3, false); lab.width = W3*DPR3; lab.height = H3*DPR3; cam.aspect = W3/Math.max(1, H3); cam.updateProjectionMatrix(); }
  function openB(target){
    if (!built) build(); open = bioOn = true; size();
    if (target != null && target !== -2 && bmOn) bmLeave();
    const n = typeof target === "string" ? BIO_ERAS.findIndex(e => e.id === target) : target;
    if (n != null && n !== -2){ cur = n; trn = null; view = null; arrive(n); column(); card(); }
    else if (!INST.length && cur < 0){ arrive(-1); column(); card(); }
    else { column(); card(); }
    if (typeof target === "string" && BIO_SP[target]){ const E = BIO_ERAS.findIndex(e => e.sp && e.sp.includes(target)); if (E >= 0){ cur = E; arrive(E); column(); portrait(target); } }
    $("bioLife").onclick = () => { lifeT = lifeT > .5 ? 0 : 1; lifeAt = 0; hint(); };
    $("bioGalB").onclick = () => gal.on ? galOff() : galOn();
    $("bioMechB").onclick = () => mechOn && MK === "mech" ? mechOff() : mechOn_();
    $("bioBasB").onclick = () => mechOn && MK === "basics" ? mechOff() : mechOn_(-1, "basics");
    $("bioBmB").onclick = () => bmOn ? bmOff() : bmOn_();
    if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function close(){ if (!open) return; open = bioOn = false; if (typeof shown !== "undefined" && shown >= 0) Music.voice("st:" + shown, false); else Music.voice("", false); box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); }
  addEventListener("resize", () => { if (open) size(); });
  const mxb = $("bioMax");
  mxb.onclick = () => { const on = !box.classList.contains("tm-max"); box.classList.toggle("tm-max", on); mxb.setAttribute("aria-pressed", String(on)); mxb.textContent = on ? "⤡ Сцена" : "⤢ Читать"; };
  return { open: openB, close, get on(){ return open; }, go, portrait,
    gallery: k => galOn(k), mech: i => { mechOn_(i); }, basics: i => { mechOn_(i, "basics"); }, biome: i => { bmOn_(i); }, dbg: { fc: () => fc, gal: () => ({ on: gal.on, cmp, cmpK, n: galList().length, grp: GRP }), setGal: o => { Object.assign(gal, o); card(); }, env: () => envN, cur: () => cur, life: v => { if (v != null){ life = lifeT = v; lifeAt = 0; } return life; }, inst: () => INST.map(I => [I.k, I.n, +I.X.toFixed(2), I.st]), hov: () => hov, view: () => view, trn: () => !!trn,
      pickAt: (x, y) => pick(x, y), scr: k => { const I = INST.find(I => I.k === k && !I.fossilOnly); return I ? scr2(I.sx, I.sy, I.Z) : null; } } };
})();
const chBio = $("chBio");
function openBio(t){ closeChapters(); toggleMenu(false); surface(); chBio.classList.add("open"); chBio.setAttribute("aria-hidden", "false"); BIO.open(t); $("bioClose").focus({ preventScroll:true }); }
function closeBio(){ BIO.close(); }
$("bioClose").onclick = closeBio;
$("mBio").onclick = () => openBio();
// ---- 13ж · связи: из Древа и Календаря — в «Биосферу» ----
// начало каждого пласта, лет назад (порядок BIO_ERAS); событие на границе относим к пласту, который оно открывает,
// кроме вымираний — они закрывают свой пласт
const BIO_START = [4.57e9, 4.03e9, 2.5e9, 1.8e9, 7.17e8, 6.35e8, 5.388e8, 4.869e8, 4.431e8, 4.196e8, 3.589e8, 2.989e8, 2.519e8, 2.014e8, 1.431e8, 6.6e7, 2.3e7, 2.58e6, 11700, 75];
const BIO_EV_FIX = { perm:"permian", kpg:"cretaceous", trj:"triassic", petm:"paleogene", zancl:"neogene" };
function bioOfEvent(e){
  const id = BIO_EV_FIX[e.id]; if (id) return BIO_ERAS.find(E => E.id === id);
  if (!(e.ago > 0) || e.ago > 4.57e9) return null;
  let i = 0; for (let k = 0; k < BIO_START.length; k++) if (BIO_START[k] >= e.ago) i = k;
  return BIO_ERAS[i];
}
function bioOfTree(id){
  const E = BIO_ERAS.find(E => E.tree === id); if (E) return [E.id, "пласт «" + E.nm + "»"];
  const k = Object.keys(BIO_SP).find(k => BIO_SP[k].tree === id && !BIO_SP[k].bio); return k ? [k, "портрет «" + BIO_SP[k].ru + "»"] : null;
}
