/* ---------- «Лестница измерений» (подэтап 12а: 0D–3D) ----------
   Своя сцена Three.js на #dimCv. Объекты ступеней — n-кубы из потоков частиц: каждое новое измерение рождается
   движением (объект «протягивается» в новом направлении, след светится). Вершины задаются в R^N — движок сразу
   N-мерный (вращения в плоскостях, проекция), чтобы 4D–6D следующих итераций легли на него же.
   Линляндия и Флатландия: «стать жителем» — полоса-«сетчатка» внизу показывает мир глазами жителя. */
const DIMS = (() => {
  const box = $("chDims"), cvs = $("dimCv"), lab = $("dimLab"), cardEl = $("dmCard"), scr = $("dmScroll"), tin = box.querySelector(".time-in");
  const AXC = [0xffd88a, 0x7fd0ff, 0xb49cff, 0xff9f8a, 0x9ff0b0, 0xffb3d9].map(h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; });
  const AXN = ["x", "y", "z", "w", "v", "u"];
  let open = false, built = false, rend, scn, cam, raf = 0, last = 0, W3 = 0, H3 = 0, DPR3 = 1;
  let step = 0, ext = 1, extT = 1, extAuto = 0, idle = 0, dweller = false, sphereT = -1;
  let rotA = [0, 0, 0], camRY = 0, camRYT = 0, camTilt = 0, camTiltT = 0, drag = null, practiceTm = 0;
  // ---- n-куб: вершины (±1 по первым d осям) и рёбра ----
  function cube(d){
    const V = [], E = [];
    for (let m = 0; m < (1 << d); m++){ const v = new Array(6).fill(0); for (let a = 0; a < d; a++) v[a] = (m >> a) & 1 ? 1 : -1; V.push(v); }
    for (let i = 0; i < V.length; i++) for (let a = 0; a < d; a++){ const j = i ^ (1 << a); if (j > i) E.push([i, j, a]); }
    return { V, E };
  }
  // ---- буферы частиц ----
  const CAP = 15000, VCAP = 72, WCAP = 9000;
  let pE, pV, pW, glowB, beads = [];
  const mkBuf = (n, size, chunk) => { const p = pts(n, (i, o) => { o.p = [0, 0, 0]; o.rnd = [0, 0, 0]; o.s = size; }, chunk);
    const g = p.geometry; ["position", "aColor", "aRnd"].forEach(k => g.attributes[k].setUsage(THREE.DynamicDrawUsage)); return p; };
  function build(){
    built = true;
    rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
    scn = new THREE.Scene(); cam = new THREE.PerspectiveCamera(40, 1, .05, 200);
    pE = mkBuf(CAP, 1.45, `a = aRnd.x*uSharp*(0.7 + 0.3*sin(uTime*2.2 + aSeed*40.0)); s *= 0.9 + aRnd.y;`);
    pV = mkBuf(VCAP, 3.2, `a = aRnd.x*uSharp*(0.8 + 0.2*sin(uTime*1.6 + aSeed*20.0)); s *= 1.0 + aRnd.y;`);
    pW = mkBuf(WCAP, 1, `a = aRnd.x*uSharp; s *= 0.8 + aRnd.y;`);
    [pE, pV, pW].forEach(p => scn.add(p));
    glowB = glow(0xfff1d6, 1.6, 0); scn.add(glowB);
    for (let k = 0; k < 5; k++){ const g = glow([0xffd88a, 0x7fd0ff, 0xffffff, 0xb49cff, 0xff9f8a][k], .55, 0); scn.add(g); beads.push({ g, x: -4 + k*2, v: (k % 2 ? 1 : -1)*(.5 + Math.random()*.6) }); }
    initFlat();
  }
  // ---- Флатландия: фигуры в плоскости x-y ----
  let shapes = [];
  function initFlat(){
    shapes = [
      { n:3, x:-2.6, y:1.6, r:.6, a:0, vx:.35, vy:-.2, va:.3, c:[1, .62, .55] },
      { n:4, x:2.2, y:-1.4, r:.62, a:.3, vx:-.3, vy:.28, va:-.2, c:[.5, .82, 1] },
      { n:5, x:1.6, y:2.2, r:.6, a:0, vx:-.22, vy:-.32, va:.25, c:[.72, .62, 1] },
      { n:0, x:-1.8, y:-2.2, r:.55, a:0, vx:.3, vy:.3, va:0, c:[.62, 1, .7] }
    ];
  }
  const you = { x:0, y:-3.9, a:Math.PI/2 };                    // плоскатик-наблюдатель
  function fib(k, n){ const y = 1 - (k + .5)/n*2, r = Math.sqrt(1 - y*y), t = k*2.39996323; return [Math.cos(t)*r, y, Math.sin(t)*r]; }
  function polyPts(s){ const P = []; for (let k = 0; k < s.n; k++){ const t = s.a + k/s.n*TAU; P.push([s.x + Math.cos(t)*s.r, s.y + Math.sin(t)*s.r]); } return P; }
  // ---- запись в буферы ----
  let nE = 0, nV = 0, nW = 0;
  function put(p, i, x, y, z, c, a, s){ const P = p.geometry.attributes.position.array, C = p.geometry.attributes.aColor.array, R = p.geometry.attributes.aRnd.array;
    P[i*3] = x; P[i*3 + 1] = y; P[i*3 + 2] = z; C[i*3] = c[0]; C[i*3 + 1] = c[1]; C[i*3 + 2] = c[2]; R[i*3] = a; R[i*3 + 1] = s || 0; }
  function done(p, n, cap){ const R = p.geometry.attributes.aRnd.array; for (let i = n; i < cap; i++) R[i*3] = 0;
    ["position", "aColor", "aRnd"].forEach(k => p.geometry.attributes[k].needsUpdate = true); }
  // ---- вращения в плоскостях (пока 3D: XY, XZ, YZ) и проекция N → 3 ----
  function rot(v, i, j, t){ const c = Math.cos(t), s = Math.sin(t), a = v[i], b = v[j]; v[i] = a*c - b*s; v[j] = a*s + b*c; }
  function project(v){ return [v[0]*1.6, v[1]*1.6, v[2]*1.6]; }
  // ---- кадр ----
  function frame(now){
    raf = open ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(.1, (now - last)/1000 || 0); last = now; const T = now/1000;
    // протягивание: само, если человек не тянет 4 секунды
    if (ext < 1 && !drag){ idle += dt; if (idle > 4 && !extAuto) extAuto = 1; }
    if (extAuto){ extT = Math.min(1, extT + dt/1.8); }
    const was = ext; ext += (extT - ext)*Math.min(1, dt*6); if (Math.abs(extT - ext) < .002) ext = extT;
    if (was < .985 && ext >= .985){ Music.dim(step); hintSet(); const eb = $("dmExt"); if (eb && step) eb.textContent = "Протянуть заново"; }
    // камера
    camRY += (camRYT - camRY)*Math.min(1, dt*2.5); camTilt += (camTiltT - camTilt)*Math.min(1, dt*2.5);
    const port = W3 < 760, mx = box.classList.contains("tm-max");
    cam.setViewOffset(W3, H3, port ? 0 : -W3*(mx ? .25 : .17), port ? H3*.22 : 0, W3, H3);
    const D = step === 4 && lens4 === "time" ? (port ? 21 : 13.5) : port ? (step >= 5 ? 20.5 : step >= 2 ? 17.5 : 14) : (step === 2 ? 11.5 : step >= 5 ? 10.8 : 10);
    cam.position.set(Math.sin(camRY)*Math.cos(camTilt)*D, Math.sin(camTilt)*D, Math.cos(camRY)*Math.cos(camTilt)*D); cam.lookAt(0, 0, 0);
    // объект ступени
    nE = 0; nV = 0;
    if (step < 4) obj3(dt, T); else if (step === 4) obj4(dt, T); else if (step === 5) obj5(dt, T); else if (step === 6) obj6(dt, T); else obj7(dt, T);
    done(pE, nE, CAP); done(pV, nV, VCAP);
    world(dt, T);
    pE.material.uniforms.uSharp.value = pV.material.uniforms.uSharp.value = pW.material.uniforms.uSharp.value = 1;
    rend.render(scn, cam);
    overlay(T, port);
  }
  function obj3(dt, T){
    if (step >= 3 && !drag) { rotA[0] += dt*.11; rotA[1] += dt*.07; }
    const d = step, G = cube(d);
    const Vs = G.V.map(v => { const u = v.slice(); if (d > 0) u[d - 1] *= ext; if (d >= 3){ rot(u, 0, 2, rotA[0]); rot(u, 1, 2, rotA[1]*.6); rot(u, 0, 1, rotA[2]); } return project(u); });
    if (d === 0){ glowB.material.opacity = .9*(.75 + .25*Math.sin(T*1.7)); glowB.scale.setScalar(1.3 + .25*Math.sin(T*1.7)); glowB.position.set(0, 0, 0); }
    else glowB.material.opacity = 0;
    const dimO = (step === 1 || step === 2) && (dweller || sphereT >= 0) ? .3 : 1;
    for (const [i, j, a] of G.E){
      const A = Vs[i], B = Vs[j], L = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]); if (L < .01) continue;
      const K = Math.max(10, Math.round(L*34)), fresh = a === d - 1 && ext < .999;
      for (let k = 0; k < K && nE < CAP; k++){ const t = ((k + T*(fresh ? 2.2 : .7)*(a % 2 ? -1 : 1)*3) % K + K) % K/K;
        put(pE, nE++, A[0] + (B[0] - A[0])*t, A[1] + (B[1] - A[1])*t, A[2] + (B[2] - A[2])*t, AXC[a], (fresh ? 1 : .85)*dimO, fresh ? .5 : 0); }
    }
    Vs.forEach(p => { if (nV < VCAP) put(pV, nV++, p[0], p[1], p[2], [1, .95, .85], .95*dimO, 0); });
    // стрелка «+1 направление» — пока протягивание не закончено
    if (d > 0 && ext < .985){ const ax = d - 1, dir = [0, 0, 0]; dir[ax] = 1; const pulse = .5 + .5*Math.sin(T*4);
      for (let k = 0; k < 40 && nE < CAP; k++){ const t = k/40, len = 1.6*(1 + ext) + .4 + t*1.4;
        put(pE, nE++, dir[0]*len, dir[1]*len, dir[2]*len, AXC[ax], (.35 + .65*t)*(.5 + .5*pulse), .4); } }
  }
  // ======== 4D (12б): тень и 6 плоскостей, срез, развёртка Дали; опыты — гиперсфера, узел, перчатка ========
  let mode4 = "shadow", planes = [false, false, true, true, false, false], ang = [0, 0, 0, 0, 0, 0], dragA = [0, 0];
  const PL = [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3]], PLN = ["XY", "XZ", "YZ", "XW", "YW", "ZW"];
  let sliceW = 0, sliceUser = -1e9, fold = 0, foldT = 0, hyT = 0, knT = 0, glT = 0, glTh = 0, knPh = 0;
  const DW = 3.6, S4 = 1.1;
  const proj4 = (v, dw, sc) => { dw = dw || DW; sc = sc || S4; const f = dw/(dw - v[3]); return [v[0]*f*sc, v[1]*f*sc, v[2]*f*sc]; };
  const WCOL = w => mixc3([1, .86, .56], [1, .42, .78], clamp(Math.abs(w), 0, 1));
  function mixc3(a, b, t){ return [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t]; }
  function edge(A, B, col, al, spd, T, sz){ const L = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]); if (L < .01) return; const K = Math.max(8, Math.round(L*30));
    for (let k = 0; k < K && nE < CAP; k++){ const t = (((k + T*spd) % K) + K) % K/K; put(pE, nE++, A[0] + (B[0] - A[0])*t, A[1] + (B[1] - A[1])*t, A[2] + (B[2] - A[2])*t, col, al, sz || 0); } }
  const vert = (p, al) => { if (nV < VCAP) put(pV, nV++, p[0], p[1], p[2], [1, .95, .85], al, 0); };
  function rot4(v){ for (let k = 0; k < 6; k++) if (ang[k]) rot(v, PL[k][0], PL[k][1], ang[k]); rot(v, 0, 2, dragA[0]); rot(v, 1, 2, dragA[1]); return v; }
  const CELLC = [[1, .85, .54], [1, .62, .55], [1, .62, .55], [.5, .82, 1], [.5, .82, 1], [.72, .62, 1], [.72, .62, 1], [1, .45, .78]];
  // ======== линза «Время»: мировые трубки жизни ========
  let lens4 = "space", tView = "block", tNow = 35, tPlay = false, tTilt = false, tNowUser = 0;
  const A0 = -12, A1 = 84, TY = a => -3.2 + (a - A0)/(A1 - A0)*6.4;
  const kfp = K => a => { if (a <= K[0][0]) return [K[0][1], K[0][2]]; for (let i = 1; i < K.length; i++) if (a <= K[i][0]){ const p = K[i - 1], q = K[i], u = smooth(0, 1, (a - p[0])/(q[0] - p[0])); return [p[1] + (q[1] - p[1])*u, p[2] + (q[2] - p[2])*u]; } const L = K[K.length - 1]; return [L[1], L[2]]; };
  const TUBES = [
    { id:"me", nm:"человек", c:[1, .84, .5], a0:0, a1:84, p:kfp([[0, .05, .05], [6, .12, .1], [16.5, .2, .15], [21, -1.55, 1.25], [23.5, -1.5, 1.3], [27, 1.15, -.6], [84, 1.25, -.55]]) },
    { id:"mo", nm:"мать", c:[1, .55, .76], a0:-28, a1:76, p:kfp([[-12, -.9, .7], [-3, -.05, -.05], [0, .05, .05], [5, .38, -.18], [60, .42, -.22], [76, .42, -.22]]) },
    { id:"fa", nm:"отец", c:[.55, .78, 1], a0:-31, a1:71, p:kfp([[-12, 1.1, -.9], [-5, .3, -.35], [60, .32, -.4], [71, .32, -.4]]) },
    { id:"fr", nm:"друг", c:[.6, 1, .72], a0:-1, a1:84, p:kfp([[-1, -1.5, -1.1], [6, -1.2, -.9], [7.5, -.32, .32], [16.5, -.28, .36], [21, 2.0, -1.7], [84, 2.15, -1.85]]) },
    { id:"pa", nm:"партнёр", c:[.75, .62, 1], a0:-2, a1:84, p:kfp([[-2, 2.5, 1.7], [22, 2.1, 1.1], [27, 1.45, -.32], [84, 1.5, -.3]]) },
    { id:"ch", nm:"ребёнок", c:[1, .93, .7], a0:31, a1:84, p:kfp([[31, 1.32, -.46], [48, 1.36, -.48], [52, -.75, -1.75], [84, -.85, -1.85]]) }
  ];
  const T_EV = [[0, "me", "рождение"], [7.5, "fr", "школа и друг"], [18.8, "me", "переезд"], [27, "me", "встреча"], [31, "ch", "рождение ребёнка"], [50, "ch", "ребёнок уходит в свою жизнь"]];
  function tubePos(T0, a){ const q = T0.p(a), b = a - T0.a0, w = .035*Math.sin(a*2.1 + T0.a0); return [q[0]*.62 + w, q[1]*.62 + .035*Math.cos(a*1.7 + T0.a0)]; }
  function tubeR(T0, a){ const b = a - T0.a0; return (.05 + .11*smooth(0, 18, b))*(T0.a1 < A1 ? 1 - smooth(T0.a1 - 3, T0.a1, a)*.85 : 1); }
  // «сейчас» другого наблюдателя: наклонный срез — 9 лет на единицу x (наклон сильно преувеличен)
  function nowAt(x){ return tTilt ? tNow + x*9 : tNow; }
  function crossA(T0){ let a = tNow; for (let k = 0; k < 6; k++){ const p = tubePos(T0, clamp(a, T0.a0, T0.a1)); a = nowAt(p[0]); } return a; }
  function objTime(dt, T){
    if (tPlay){ tNow += dt*3.6; if (tNow >= 84){ tNow = 84; tPlay = false; const b = $("dmPlay"); if (b) b.textContent = "▶ Прожить"; } const r = $("dmNow"); if (r) r.value = tNow; const o = $("dmNowV"); if (o) o.textContent = Math.round(tNow) + " лет"; }
    for (const T0 of TUBES){
      const lo = Math.max(T0.a0, A0), ca = crossA(T0);
      const me = T0.id === "me", nR = me ? 10 : 7, al = me ? 1 : .42;
      if (tView !== "now"){ let a = lo, pp = tubePos(T0, a);
        while (a <= T0.a1 + 1e-6){
          if (tView === "grow" && a > nowAt(pp[0])) break;
          const r = tubeR(T0, a), y = TY(a);
          for (let k = 0; k < nR && nE < CAP; k++){ const t = k/nR*TAU + a*.35; put(pE, nE++, pp[0] + Math.cos(t)*r, y, pp[1] + Math.sin(t)*r, T0.c, al, me ? .45 : 0); }
          let da = .9, np = tubePos(T0, a + da); while (da > .12 && Math.hypot(np[0] - pp[0], np[1] - pp[1]) > .14){ da *= .5; np = tubePos(T0, a + da); }
          a += da; pp = np; } }
      if (ca >= T0.a0 && ca <= T0.a1 && ca >= A0){ const p = tubePos(T0, ca), r = tubeR(T0, ca) + .02, y = TY(ca);
        for (let k = 0; k < 22 && nE < CAP; k++){ const t = k/22*TAU + T*.6; put(pE, nE++, p[0] + Math.cos(t)*r, y, p[1] + Math.sin(t)*r, T0.c, 1, .9); }
        vert([p[0], y, p[1]], T0.id === "me" ? 1 : .7); }
    }
  }
  const AXP = [3.4, -3.0];
  function worldTime(dt, T){
    for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++){ const x = i*.3, z = j*.3; put(pW, nW++, x, TY(nowAt(x)), z, [.95, .9, .8], tView === "now" ? .2 : .11, 0); }
    for (let k = 0; k <= 64; k++){ const a = A0 + k/64*(A1 - A0); put(pW, nW++, AXP[0], TY(a), AXP[1], [.8, .78, .7], .35, 0); }
    if (tView !== "now") for (const [a, id] of T_EV){ if (tView === "grow" && a > tNow) continue; const T0 = TUBES.find(t => t.id === id), p = tubePos(T0, a); put(pW, nW++, p[0], TY(a), p[1], [1, 1, 1], .9, 1.4); }
  }
  function overlayTime(c, pb, cb, port, T){
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace";
    const x0 = port ? 16 : pb.right - cb.left + 40, yT = port ? 70 : 76, v = new THREE.Vector3();
    const P = (x, y, z) => { v.set(x, y, z).project(cam); return [(v.x + 1)/2*W3, (1 - v.y)/2*H3, v.z]; };
    c.font = "10px " + mono; c.textAlign = "left";
    const V = DIM_TIME.views.find(q => q[0] === tView);
    c.fillStyle = "rgba(5,6,12,.72)"; c.fillRect(x0 - 8, yT - 14, Math.min(W3 - x0 - 16, 470), port ? 40 : 44);
    c.fillStyle = "rgba(214,172,94,.92)"; c.fillText(V[1].toUpperCase() + (tTilt ? " · «СЕЙЧАС» ДРУГОГО НАБЛЮДАТЕЛЯ" : ""), x0, yT);
    c.fillStyle = "rgba(233,226,208,.6)"; c.fillText(("Сейчас: " + Math.round(tNow) + " лет · " + (port ? "вверх — время" : "вверх — время, пол — пространство (2 из 3 измерений)")).toUpperCase(), x0, yT + 16);
    // ось времени
    const xMin = port ? 0 : pb.right - cb.left + 10;
    for (const a of [0, 20, 40, 60, 80]){ const [x, y] = P(AXP[0], TY(a), AXP[1]); if (x < xMin) continue; c.fillStyle = "rgba(233,226,208,.5)"; c.fillText(a + " лет", x + 8, y + 3); }
    { const [x, y] = P(AXP[0], TY(A1) + .3, AXP[1]); if (x > xMin){ c.fillStyle = "rgba(214,172,94,.8)"; c.fillText("время ↑", x - 10, y); } }
    // события
    if (tView !== "now") for (const [a, id, nm] of T_EV){ if (tView === "grow" && a > tNow) continue; const T0 = TUBES.find(t => t.id === id), p = tubePos(T0, a), [x, y] = P(p[0], TY(a), p[1]); if (x < xMin) continue;
      c.fillStyle = "rgba(5,6,12,.6)"; const w = c.measureText(nm).width; c.fillRect(x + 7, y - 9, w + 6, 13); c.fillStyle = "rgba(255,240,215,.85)"; c.fillText(nm, x + 10, y + 1); }
    // легенда трубок
    let lx = x0, ly = port ? yT + 40 : H3 - 34; c.fillStyle = "rgba(5,6,12,.6)"; c.fillRect(x0 - 8, ly - 12, Math.min(W3 - x0 - 16, 470), 20);
    for (const T0 of TUBES){ const k = T0.c; c.fillStyle = `rgb(${k[0]*255|0},${k[1]*255|0},${k[2]*255|0})`; c.fillRect(lx, ly - 4, 12, 3); c.fillStyle = "rgba(233,226,208,.7)"; c.fillText(T0.nm, lx + 16, ly); lx += 22 + c.measureText(T0.nm).width + 10; if (lx > W3 - 60) break; }
  }
  function obj4(dt, T){
    glowB.material.opacity = 0;
    if (lens4 === "time"){ objTime(dt, T); return; }
    if (!drag){ for (let k = 0; k < 6; k++) if (planes[k]) ang[k] += dt*(k >= 3 ? .32 : .16); dragA[0] += dt*.035; }
    if (mode4 === "shadow" || mode4 === "slice"){
      const G = cube(4), sl = mode4 === "slice";
      const V4 = G.V.map(v => { const u = v.slice(); u[3] *= ext; if (sl){ rot(u, 0, 3, .62); rot(u, 1, 3, .5); rot(u, 2, 3, .4); } return rot4(u); });
      if (!sl){
        const Vs = V4.map(v => proj4(v));
        for (const [i, j, a] of G.E){ const fresh = a === 3 && ext < .999; edge(Vs[i], Vs[j], AXC[a], fresh ? 1 : .86, (fresh ? 6.6 : 2.1)*(a % 2 ? -1 : 1), T, fresh ? .5 : 0); }
        Vs.forEach(p => vert(p, .95));
        return;
      }
      if (performance.now() - sliceUser > 6000){ sliceW = 1.95*Math.sin(T*.28); const r = $("dmW"); if (r) r.value = sliceW; const o = $("dmWv"); if (o) o.textContent = sliceW.toFixed(2); }
      const P = {}, key = (i, j) => Math.min(i, j)*16 + Math.max(i, j), K = S4*1.15;
      for (const [i, j] of G.E){ const a = V4[i][3] - sliceW, b = V4[j][3] - sliceW; if (a*b < 0){ const t = a/(a - b); P[key(i, j)] = [0, 1, 2].map(k => (V4[i][k] + (V4[j][k] - V4[i][k])*t)*K); } }
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++){ const oth = [0, 1, 2, 3].filter(c => c !== a && c !== b);
        for (let m2 = 0; m2 < 4; m2++){ let m = 0; if (m2 & 1) m |= 1 << oth[0]; if (m2 & 2) m |= 1 << oth[1]; const A = 1 << a, B = 1 << b;
          const q = [[m, m | A], [m | A, m | A | B], [m | B, m | A | B], [m, m | B]].map(([i, j]) => P[key(i, j)]).filter(Boolean);
          if (q.length === 2) edge(q[0], q[1], [1, .9, .66], .95, 2.4, T, .3); } }
      Object.values(P).forEach(p => vert(p, .95));
      return;
    }
    if (mode4 === "net"){
      if (fold !== foldT) fold = foldT > fold ? Math.min(foldT, fold + dt/4.5) : Math.max(foldT, fold - dt/4.5);
      const th = fold*Math.PI/2, c = Math.cos(th), s = Math.sin(th), c2 = Math.cos(2*th), s2 = Math.sin(2*th);
      const sc = (1 - .3*(1 - fold))*(1 - .28*Math.sin(Math.PI*fold)), oy = (1 - fold)*.9;
      const cells = [];
      cells.push(m => [m & 1 ? 1 : -1, m & 2 ? 1 : -1, m & 4 ? 1 : -1, -1]);
      [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]].forEach(([ax, sg]) => cells.push(m => { const v = [m & 1 ? 1 : -1, m & 2 ? 1 : -1, m & 4 ? 1 : -1, 0]; const u = (m >> ax) & 1 ? 2 : 0; v[ax] = sg*(1 + u*c); v[3] = -1 + u*s; return v; }));
      cells.push(m => { const v = [m & 1 ? 1 : -1, m & 2 ? 1 : -1, m & 4 ? 1 : -1, 0]; const u = (m >> 1) & 1 ? 2 : 0; v[1] = -(1 + 2*c + u*c2); v[3] = -1 + 2*s + u*s2; return v; });
      const C3 = cube(3);
      cells.forEach((f, ci) => { const Vs = C3.V.map((_, m) => { const v = f(m); rot(v, 0, 2, dragA[0]); rot(v, 1, 2, dragA[1]); const p = proj4(v, 5.2, 1.08); return [p[0]*sc, (p[1] + oy)*sc, p[2]*sc]; });
        for (const [i, j] of C3.E) edge(Vs[i], Vs[j], CELLC[ci], .82, ci % 2 ? -1.6 : 1.6, T, 0);
        Vs.forEach(p => vert(p, .8)); });
      return;
    }
  }
  // ======== 5D (12в): шланг Калуцы — Клейна, пентеракт, возможности ========
  let mode5 = "penta", hoseZ = 0, hoseUser = -1e9, pl5 = [true, false, false, true, false], ang5 = [0, 0, 0, 0, 0];
  const PL5 = [[0, 3], [0, 4], [1, 4], [2, 4], [3, 4]], PL5N = ["XW", "XV", "YV", "ZV", "WV"];
  const ANTS = [{ w:0, c:[1, 1, 1], x:-3, nm:"0" }, { w:2.6, c:[1, .72, .4], x:0, nm:"+" }, { w:-2.6, c:[.5, .8, 1], x:3, nm:"−" }];
  ANTS.forEach(a => { a.ph = 0; a.tr = []; });
  const proj5 = v => { const f = 4.2/(4.2 - v[4]); return proj4([v[0]*f, v[1]*f, v[2]*f, v[3]*f], 3.6, .92); };
  let PS = null;
  function possInit(){ PS = { tip:[0, -2.2, 0], trail:[], alts:[], ghosts:[], t:0, offY:0, offT:0 }; possBranch(); }
  function possBranch(){ const P0 = PS.tip.slice(), base = Math.random()*TAU; PS.alts = [];
    for (let k = 0; k < 5; k++){ const th = base + k/5*TAU + (Math.random() - .5)*.5, rr = .7 + Math.random()*.5, P1 = [P0[0] + Math.cos(th)*rr, P0[1] + .85 + Math.random()*.3, P0[2] + Math.sin(th)*rr];
      PS.alts.push({ P0, P1, C:[P0[0] + Math.cos(th)*rr*.15, P0[1] + .55, P0[2] + Math.sin(th)*rr*.15], g:0 }); }
    PS.t = 0; }
  function possChoose(){ if (!PS || !PS.alts.length) return; const k = Math.floor(Math.random()*PS.alts.length), A = PS.alts[k];
    PS.trail.push(A); if (PS.trail.length > 7) PS.trail.shift();
    PS.alts.forEach((b, i) => { if (i !== k){ b.a = .5; PS.ghosts.push(b); } }); if (PS.ghosts.length > 40) PS.ghosts.splice(0, PS.ghosts.length - 40);
    PS.tip = A.P1.slice(); PS.offT = Math.min(0, -(PS.tip[1] - .6)); possBranch(); Music.chime(); }
  const qb = (b, t) => [0, 1, 2].map(i => (1 - t)*(1 - t)*b.P0[i] + 2*(1 - t)*t*b.C[i] + t*t*b.P1[i]);
  function obj5(dt, T){
    glowB.material.opacity = 0;
    if (mode5 === "penta"){
      if (!drag){ for (let k = 0; k < 5; k++) if (pl5[k]) ang5[k] += dt*.26; dragA[0] += dt*.035; }
      const G = cube(5);
      const Vs = G.V.map(v => { const u = v.slice(); u[4] *= ext; for (let k = 0; k < 5; k++) if (ang5[k]) rot(u, PL5[k][0], PL5[k][1], ang5[k]); rot(u, 0, 2, dragA[0]); rot(u, 1, 2, dragA[1]); return proj5(u); });
      for (const [i, j, a] of G.E){ const fresh = a === 4 && ext < .999; edge(Vs[i], Vs[j], AXC[a], fresh ? 1 : .7, (fresh ? 6 : 1.8)*(a % 2 ? -1 : 1), T, fresh ? .4 : 0); }
      Vs.forEach(p => vert(p, .85));
      return;
    }
    if (mode5 === "hose"){
      if (performance.now() - hoseUser > 7000){ hoseZ = .5 - .5*Math.cos(T*TAU/16); const r = $("dmZ"); if (r) r.value = hoseZ; }
      const z = hoseZ, s = Math.exp(z*Math.log(45)), R = Math.min(.011*s, .55), nR = Math.round(4 + 20*z);
      for (let k = 0; k < 68; k++){ const x = -6 + k*.18 + ((T*.15*s) % .18); for (let q = 0; q < nR && nE < CAP; q++){ const t = q/nR*TAU; put(pE, nE++, x, R*Math.cos(t), R*Math.sin(t), [1, .86, .56], .55 + .3*(1 - z), z > .4 ? .2 : .5); } }
      for (const A of ANTS){ A.x += dt*.55; if (A.x > 6) A.x -= 12; A.ph += dt*A.w;
        const p = [A.x, R*Math.cos(A.ph), R*Math.sin(A.ph)]; A.tr.push(p); if (A.tr.length > 46) A.tr.shift(); A.p = p;
        if (nV < VCAP) put(pV, nV++, p[0], p[1], p[2], A.c, 1, 1.2); }
      return;
    }
    if (mode5 === "poss"){
      if (!PS) possInit();
      PS.t += dt; PS.alts.forEach(b => b.g = Math.min(1, b.g + dt/1.8)); if (PS.t > 4.6 && !drag) possChoose();
      PS.offY += (PS.offT - PS.offY)*Math.min(1, dt*1.5);
      const oy = PS.offY, Y = p => [p[0], p[1] + oy, p[2]];
      PS.trail.forEach((b, i) => { for (let k = 0; k < 26 && nE < CAP; k++){ const p = Y(qb(b, k/25)); put(pE, nE++, p[0], p[1], p[2], [1, .86, .5], .5 + .5*(i + 1)/PS.trail.length, .5); } });
      PS.alts.forEach(b => { const n = Math.round(26*b.g); for (let k = 0; k < n && nE < CAP; k++){ const p = Y(qb(b, k/25)); put(pE, nE++, p[0], p[1], p[2], [.75, .7, 1], .55 + .3*Math.sin(T*3 + k*.4), .2); } });
      PS.ghosts.forEach(b => { b.a = Math.max(0, b.a - dt*.06); if (b.a <= 0) return; for (let k = 0; k < 26 && nE < CAP; k++){ const p = Y(qb(b, k/25)); put(pE, nE++, p[0], p[1], p[2], [.6, .6, .85], b.a*.5, 0); } });
      PS.ghosts = PS.ghosts.filter(b => b.a > 0);
      vert(Y(PS.tip), 1);
    }
  }
  function world5(dt, T){
    if (mode5 === "hose") for (const A of ANTS){ A.tr.forEach((p, i) => { if (nW < WCAP) put(pW, nW++, p[0], p[1], p[2], A.c, i/A.tr.length*.6, 0); }); }
  }
  function overlay5(c, pb, cb, port, T){
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace";
    const x0 = port ? 16 : pb.right - cb.left + 40, yT = port ? 70 : 76, wT = Math.min(W3 - x0 - 24, 460);
    c.font = "10px " + mono; c.textAlign = "left";
    const cap = (t, t2) => { c.fillStyle = "rgba(5,6,12,.72)"; c.fillRect(x0 - 8, yT - 14, wT + 16, t2 ? 40 : 22); c.fillStyle = "rgba(214,172,94,.92)"; c.fillText(t, x0, yT); if (t2){ c.fillStyle = "rgba(233,226,208,.6)"; c.fillText(t2, x0, yT + 16); } };
    if (mode5 === "penta"){ const on = PL5N.filter((_, k) => pl5[k]); cap("ПЕНТЕРАКТ · ТЕНЬ ТЕНИ: 5D → 4D → 3D", (on.length ? "ВРАЩЕНИЕ: " + on.join(" · ") : "ВРАЩЕНИЕ ВЫКЛЮЧЕНО")); 
      const y = port ? yT + 40 : H3 - 34; let x = x0; c.fillStyle = "rgba(5,6,12,.6)"; c.fillRect(x0 - 8, y - 12, 250, 20);
      ["x", "y", "z", "w", "v"].forEach((n, a) => { const k = AXC[a]; c.fillStyle = `rgb(${k[0]*255|0},${k[1]*255|0},${k[2]*255|0})`; c.fillRect(x, y - 4, 14, 3); c.fillText(n, x + 19, y); x += 44; }); return; }
    if (mode5 === "hose"){ const s = Math.exp(hoseZ*Math.log(45));
      cap(hoseZ < .25 ? "ИЗДАЛИ — ЛИНИЯ: ОДНО ИЗМЕРЕНИЕ" : hoseZ > .75 ? "ВБЛИЗИ — ТРУБКА: ВТОРОЕ ИЗМЕРЕНИЕ СВЁРНУТО В КРУГ" : "ПРИБЛИЖАЕМСЯ…", "УВЕЛИЧЕНИЕ ×" + Math.round(s) + " · В ТЕОРИИ КЛЕЙНА КРУГ ≈ 10⁻³⁰ СМ");
      if (hoseZ > .45){ const v = new THREE.Vector3(); for (const A of ANTS){ if (!A.p) continue; v.set(A.p[0], A.p[1], A.p[2]).project(cam); const x = (v.x + 1)/2*W3, y = (1 - v.y)/2*H3; if (x < (port ? 0 : pb.right - cb.left)) continue; c.fillStyle = "rgba(255,240,215,.9)"; c.fillText(A.nm === "0" ? "нейтральная" : "заряд " + A.nm, x + 10, y - 8); } }
      return; }
    if (mode5 === "poss") cap("ИЗ КАЖДОГО «СЕЙЧАС» РАСХОДЯТСЯ ПУТИ · ВЫБРАННЫЙ СВЕТИТСЯ", "○ ОБРАЗ УСПЕНСКОГО И БОРХЕСА — НЕ ФИЗИЧЕСКАЯ МОДЕЛЬ");
  }
  function tools5(){
    const M = [["penta", "Пентеракт"], ["hose", "Шланг"], ["poss", "Возможности"]];
    let h = `<div class="dm-row dm-modes" role="group" aria-label="Способы">${M.map(([k, n]) => `<button class="tm-tog" data-m5="${k}" aria-pressed="${mode5 === k}" data-hover>${n}</button>`).join("")}</div>`;
    if (mode5 === "penta") h += `<div class="dm-row"><button class="btn" id="dmExt" data-hover>${ext < .985 ? "Протянуть" : "Протянуть заново"}</button></div><div class="dm-row dm-pl" role="group" aria-label="Плоскости вращения">${PL5N.map((n, k) => `<button class="dm-chip${k ? " w" : ""}" data-p5="${k}" aria-pressed="${pl5[k]}" data-hover>${n}</button>`).join("")}</div>`;
    if (mode5 === "hose") h += `<label class="dm-row dm-sl"><span class="mono">ближе</span><input type="range" id="dmZ" min="0" max="1" step="0.005" value="${hoseZ}" aria-label="Приближение"></label>`;
    if (mode5 === "poss") h += `<div class="dm-row"><button class="btn" id="dmPick" data-hover>Выбрать сейчас</button></div>`;
    h += `<p class="dm-note">${esc(DIM5_MODE[mode5])}</p>`;
    $("dmTools").innerHTML = h;
    $("dmTools").querySelectorAll("[data-m5]").forEach(b => b.onclick = () => setMode5(b.dataset.m5));
    $("dmTools").querySelectorAll("[data-p5]").forEach(b => b.onclick = () => { const k = +b.dataset.p5; pl5[k] = !pl5[k]; b.setAttribute("aria-pressed", String(pl5[k])); if (pl5[k]) Music.plane(k + 1); });
    const eb = $("dmExt"); if (eb) eb.onclick = () => { ext = extT = 0; extAuto = 1; tools5(); hintSet(); };
    const zr = $("dmZ"); if (zr) zr.oninput = () => { hoseZ = +zr.value; hoseUser = performance.now(); };
    const pk = $("dmPick"); if (pk) pk.onclick = () => possChoose();
  }
  function setMode5(m){ mode5 = m; if (ext < 1) ext = extT = 1; if (m === "poss") possInit();
    [camRYT, camTiltT] = m === "hose" ? [.42, .22] : m === "poss" ? [.5, .18] : [.45, .28];
    tools5(); hintSet(); const nm = cardEl.querySelector(".dm-note-m"); if (nm) nm.textContent = DIM5_MODE[m]; }
  // ======== 6D (12г): гексеракт, Калаби — Яу (Хэнсон), «в каждой точке» ========
  let mode6 = "hexa", pl6 = [true, false, false, true, false, false], ang6 = [0, 0, 0, 0, 0, 0], strM = 3;
  const PL6 = [[0, 3], [0, 5], [1, 5], [2, 5], [3, 5], [4, 5]], PL6N = ["XW", "XU", "YU", "ZU", "WU", "VU"];
  const proj6 = v => { const f = 6/(6 - v[5]), q = proj5([v[0]*f, v[1]*f, v[2]*f, v[3]*f, v[4]*f]); return [q[0]*.6, q[1]*.6, q[2]*.6]; };
  // комплексная арифметика для построения Хэнсона: z1^5 + z2^5 = 1
  const cmul = (a, b) => [a[0]*b[0] - a[1]*b[1], a[0]*b[1] + a[1]*b[0]];
  const cpow = (a, p) => { const r = Math.hypot(a[0], a[1]); if (r < 1e-12) return [0, 0]; const t = Math.atan2(a[1], a[0]), R = Math.pow(r, p); return [R*Math.cos(t*p), R*Math.sin(t*p)]; };
  const CY_N = 5;
  function cyPt(k1, k2, x, y, al){
    const ch = Math.cosh(y), sh = Math.sinh(y), cz = [Math.cos(x)*ch, -Math.sin(x)*sh], sz = [Math.sin(x)*ch, Math.cos(x)*sh];
    const e1 = [Math.cos(TAU*k1/CY_N), Math.sin(TAU*k1/CY_N)], e2 = [Math.cos(TAU*k2/CY_N), Math.sin(TAU*k2/CY_N)];
    const z1 = cmul(e1, cpow(cz, 2/CY_N)), z2 = cmul(e2, cpow(sz, 2/CY_N));
    return [z1[0], z2[0], Math.cos(al)*z1[1] + Math.sin(al)*z2[1]]; }
  const cyCol = (k1, k2) => mixc3(mixc3([1, .84, .52], [.72, .6, 1], k1/4), [.5, .82, 1], k2/6);
  function cyDraw(cx, cy, cz, sc, al, gx, gy, alpha, rot0){
    const c0 = Math.cos(rot0), s0 = Math.sin(rot0);
    for (let k1 = 0; k1 < CY_N; k1++) for (let k2 = 0; k2 < CY_N; k2++){ const col = cyCol(k1, k2);
      for (let i = 0; i < gx; i++) for (let j = 0; j < gy; j++){ if (nW >= WCAP) return;
        const p = cyPt(k1, k2, (i + .5)/gx*Math.PI/2, -1 + (j + .5)/gy*2, al), x = p[0]*c0 - p[2]*s0, z = p[0]*s0 + p[2]*c0;
        put(pW, nW++, cx + x*sc, cy + p[1]*sc, cz + z*sc, col, alpha, .2); } } }
  function obj6(dt, T){
    glowB.material.opacity = 0;
    if (mode6 === "hexa"){
      if (!drag){ for (let k = 0; k < 6; k++) if (pl6[k]) ang6[k] += dt*.24; dragA[0] += dt*.035; }
      const G = cube(6);
      const Vs = G.V.map(v => { const u = v.slice(); u[5] *= ext; for (let k = 0; k < 6; k++) if (ang6[k]) rot(u, PL6[k][0], PL6[k][1], ang6[k]); rot(u, 0, 2, dragA[0]); rot(u, 1, 2, dragA[1]); return proj6(u); });
      for (const [i, j, a] of G.E){ const fresh = a === 5 && ext < .999; edge(Vs[i], Vs[j], AXC[a], fresh ? 1 : .6, (fresh ? 6 : 1.6)*(a % 2 ? -1 : 1), T, fresh ? .4 : 0); }
      Vs.forEach(p => vert(p, .75));
      return;
    }
    if (mode6 === "cy"){
      // струна: замкнутая петля бежит по лепестку, колебание с m узлами
      const al = Math.PI/4 + .6*Math.sin(T*.13), r0 = T*.08, c0 = Math.cos(r0), s0 = Math.sin(r0);
      const p = cyPt(0, 0, Math.PI/4 + .55*Math.sin(T*.37), .75*Math.sin(T*.23), al), sc = 1.55;
      const C = [(p[0]*c0 - p[2]*s0)*sc, p[1]*sc, (p[0]*s0 + p[2]*c0)*sc];
      for (let k = 0; k < 140 && nE < CAP; k++){ const th = k/140*TAU, r = .26*(1 + .32*Math.sin(strM*th - T*5)), q = [C[0] + Math.cos(th)*r, C[1] + Math.sin(th)*r*.9, C[2] + Math.sin(th)*r*.4];
        put(pE, nE++, q[0], q[1], q[2], [1, .97, .85], 1, .7); }
      vert(C, .9);
    }
  }
  function world6(dt, T){
    if (mode6 === "cy"){ cyDraw(0, 0, 0, 1.55, Math.PI/4 + .6*Math.sin(T*.13), 13, 15, .6, T*.08); return; }
    if (mode6 === "pts"){ let k = 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let m = 0; m < 2; m++){ k++; cyDraw((i - .5)*2.8, (j - .5)*2.6, (m - .5)*2.8, .62, Math.PI/4 + .6*Math.sin(T*.13 + k*.7), 6, 6, .6, T*.12 + k); }
      for (let i = -12; i <= 12; i++) put(pW, nW++, i*.26, -2.4, 0, [.7, .76, 1], .15, 0); }
  }
  // ======== эпилог: вся лестница, тающая размерность, клики мозга ========
  let mode7 = "all", meltM = 0, meltUser = -1e9, MELT = null, BR = null, brK = 2, brT = 0;
  function projN(v, d){ v = v.slice(); for (let k = d - 1; k >= 3; k--){ const D = 5 + k, f = D/(D - v[k]); for (let q = 0; q < k; q++) v[q] *= f; } return [v[0], v[1], v[2]]; }
  function meltInit(){ const ball = [], tree = [], N = 2600;
    for (let i = 0; i < N; i++){ let x, y, z; do { x = rn(); y = rn(); z = rn(); } while (x*x + y*y + z*z > 1); ball.push([x*2.3, y*2.3, z*2.3]); }
    const br = (p, d, L, dep) => { const n = Math.max(3, Math.round(L*26)); for (let k = 0; k < n && tree.length < N; k++){ const t = k/n; tree.push([p[0] + d[0]*L*t + rn()*.02, p[1] + d[1]*L*t + rn()*.02, p[2] + d[2]*L*t + rn()*.02]); }
      if (dep <= 0 || tree.length >= N) return; const e = [p[0] + d[0]*L, p[1] + d[1]*L, p[2] + d[2]*L];
      for (let c = 0; c < 3; c++){ const nd = dir(), m = [d[0]*.4 + nd[0]*.8, d[1]*.4 + nd[1]*.8, d[2]*.4 + nd[2]*.8], l = Math.hypot(m[0], m[1], m[2]); br(e, [m[0]/l, m[1]/l, m[2]/l], L*.6, dep - 1); } };
    for (let r = 0; r < 4; r++) br([0, 0, 0], dir(), 1.15, 5);
    while (tree.length < N) tree.push(tree[Math.floor(Math.random()*tree.length)].map(v => v + rn()*.03));
    MELT = { ball, tree }; }
  const dsCDT = s => 4.02 - 119/(54 + s);     // Амбьёрн — Юркевич — Лолл (2005): спектральная размерность от «времени диффузии» σ
  function brInit(){ const P = [], N = 64; for (let i = 0; i < N; i++){ const [x, y, z] = fib(i, N); P.push([x*2.3, y*2.3, z*2.3]); }
    const E = []; P.forEach((a, i) => { P.map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])]).filter(q => q[0] !== i).sort((u, v) => u[1] - v[1]).slice(0, 3).forEach(([j]) => { if (i < j) E.push([i, j]); }); });
    const c0 = Math.floor(Math.random()*N), order = P.map((b, j) => [j, Math.hypot(P[c0][0] - b[0], P[c0][1] - b[1], P[c0][2] - b[2])]).sort((u, v) => u[1] - v[1]).map(q => q[0]);
    BR = { P, E, order }; brK = 2; brT = 0; }
  function obj7(dt, T){
    glowB.material.opacity = 0;
    if (mode7 === "all"){
      for (let n = 0; n <= 6; n++){ const ang = -1.5 + n*.47, R = 2.6, cx = Math.sin(ang)*R, cz = Math.cos(ang)*R*.5, cy = -2.75 + n*.8, sc = n <= 3 ? .38 : .38/(1 + (n - 3)*.22);
        if (n === 0){ vert([cx, cy, cz], 1); continue; }
        const G = cube(n), Vs = G.V.map(v => { const u = v.slice(); for (let k = 1; k < n; k++) rot(u, k - 1, k, T*.22 + n*.3); if (n >= 2) rot(u, 0, 1, T*.15); const p = projN(u, n); return [cx + p[0]*sc, cy + p[1]*sc, cz + p[2]*sc]; });
        for (const [i, j, a] of G.E){ const A = Vs[i], B = Vs[j], L = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), K = Math.max(4, Math.round(L*24));
          for (let k = 0; k < K && nE < CAP; k++){ const t = (((k + T*1.4) % K) + K) % K/K; put(pE, nE++, A[0] + (B[0] - A[0])*t, A[1] + (B[1] - A[1])*t, A[2] + (B[2] - A[2])*t, AXC[a], .8, 0); } }
        if (n <= 3) Vs.forEach(p => vert(p, .7)); }
      return;
    }
    if (mode7 === "brain"){
      if (!BR) brInit();
      brT += dt; if (brT > 2.6){ brT = 0; brK++; if (brK > 12){ brK = 2; brInit(); } Music.chime(); }
      const rot0 = T*.07, c0 = Math.cos(rot0), s0 = Math.sin(rot0), R = p => [p[0]*c0 - p[2]*s0, p[1], p[0]*s0 + p[2]*c0];
      const PP = BR.P.map(R), cl = BR.order.slice(0, brK), inC = new Set(cl);
      for (const [i, j] of BR.E) edge(PP[i], PP[j], [.6, .7, 1], inC.has(i) && inC.has(j) ? .2 : .18, .8, T, 0);
      for (let a = 0; a < cl.length; a++) for (let b = a + 1; b < cl.length; b++) edge(PP[cl[a]], PP[cl[b]], [1, .86, .52], 1, 2.2, T, .4);
      PP.forEach((p, i) => { if (inC.has(i)) vert(p, 1); else for (let k = 0; k < 3 && nE < CAP; k++) put(pE, nE++, p[0], p[1], p[2], [.7, .78, 1], .7, 1); });
    }
  }
  function world7(dt, T){
    if (mode7 !== "melt") return;
    if (!MELT) meltInit();
    if (performance.now() - meltUser > 7000){ meltM = .5 - .5*Math.cos(T*TAU/18); const r = $("dmMelt"); if (r) r.value = meltM; }
    const m = smooth(0, 1, meltM), rot0 = T*.06, c0 = Math.cos(rot0), s0 = Math.sin(rot0);
    for (let i = 0; i < MELT.ball.length && nW < WCAP; i++){ const a = MELT.ball[i], b = MELT.tree[i], x = a[0] + (b[0] - a[0])*m, y = a[1] + (b[1] - a[1])*m, z = a[2] + (b[2] - a[2])*m;
      put(pW, nW++, x*c0 - z*s0, y, x*s0 + z*c0, mixc3([.6, .78, 1], [1, .84, .52], m), .6, .2); }
  }
  function capBox(c, x0, yT, wT, t, t2){ c.fillStyle = "rgba(5,6,12,.72)"; c.fillRect(x0 - 8, yT - 14, wT + 16, t2 ? 40 : 22); c.fillStyle = "rgba(214,172,94,.92)"; c.fillText(t, x0, yT); if (t2){ c.fillStyle = "rgba(233,226,208,.6)"; c.fillText(t2, x0, yT + 16); } }
  function overlay67(c, pb, cb, port, T){
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace";
    const x0 = port ? 16 : pb.right - cb.left + 40, yT = port ? 70 : 76, wT = Math.min(W3 - x0 - 24, 460), v = new THREE.Vector3();
    c.font = "10px " + mono; c.textAlign = "left";
    if (step === 6){
      if (mode6 === "hexa"){ const on = PL6N.filter((_, k) => pl6[k]); capBox(c, x0, yT, wT, "ГЕКСЕРАКТ · 6D → 5D → 4D → 3D", on.length ? "ВРАЩЕНИЕ: " + on.join(" · ") : "ВРАЩЕНИЕ ВЫКЛЮЧЕНО");
        const y = port ? yT + 40 : H3 - 34; let x = x0; c.fillStyle = "rgba(5,6,12,.6)"; c.fillRect(x0 - 8, y - 12, 290, 20);
        ["x", "y", "z", "w", "v", "u"].forEach((n, a) => { const k = AXC[a]; c.fillStyle = `rgb(${k[0]*255|0},${k[1]*255|0},${k[2]*255|0})`; c.fillRect(x, y - 4, 14, 3); c.fillText(n, x + 19, y); x += 44; }); return; }
      if (mode6 === "cy") capBox(c, x0, yT, wT, "СРЕЗ ФОРМЫ КАЛАБИ — ЯУ · z₁⁵ + z₂⁵ = 1 (ХЭНСОН)", "СТРУНА: " + strM + " ГОРБА — " + (port ? "СВОЯ ЧАСТИЦА" : "В ТЕОРИИ СТРУН ЭТО «СВОЯ» ЧАСТИЦА"));
      if (mode6 === "pts") capBox(c, x0, yT, wT, "ПРОСТРАНСТВО ПРИ УВЕЛИЧЕНИИ ~10³³ РАЗ (ПО ТЕОРИИ СТРУН)", "У КАЖДОЙ ТОЧКИ — СВОЯ СВЁРНУТАЯ ФОРМА");
      return;
    }
    if (mode7 === "all"){ capBox(c, x0, yT, wT, "ВСЯ ЛЕСТНИЦА: ОТ ТОЧКИ ДО ГЕКСЕРАКТА");
      for (let n = 0; n <= 6; n++){ const ang = -1.5 + n*.47, R = 2.6; v.set(Math.sin(ang)*R + .75, -2.75 + n*.8, Math.cos(ang)*R*.5).project(cam); const x = (v.x + 1)/2*W3, y = (1 - v.y)/2*H3;
        if (x < (port ? 0 : pb.right - cb.left)) continue; c.fillStyle = "rgba(255,236,200,.85)"; c.textAlign = "left"; c.fillText(n + "D", x, y + 3); }
      c.textAlign = "left"; return; }
    if (mode7 === "melt"){ const sg = 400*Math.pow(1 - meltM, 2), d = dsCDT(sg);
      capBox(c, x0, yT, wT, meltM < .3 ? "БОЛЬШИЕ МАСШТАБЫ: ГЛАДКОЕ ПРОСТРАНСТВО-ВРЕМЯ" : meltM > .7 ? "ПЛАНКОВСКИЕ МАСШТАБЫ: ВЕТВИСТАЯ СТРУКТУРА" : "РАЗМЕРНОСТЬ ТАЕТ…", "◐ СПЕКТРАЛЬНАЯ РАЗМЕРНОСТЬ ≈ " + d.toFixed(2));
      const gw = port ? 150 : 200, gh = port ? 80 : 110, gx = port ? W3 - gw - 16 : W3 - gw - 44, gy = port ? 140 : H3 - gh - 44;
      c.fillStyle = "rgba(5,6,12,.82)"; c.fillRect(gx - 10, gy - 22, gw + 20, gh + 42); c.strokeStyle = "rgba(214,172,94,.35)"; c.strokeRect(gx - 9.5, gy - 21.5, gw + 19, gh + 41);
      c.fillStyle = "rgba(214,172,94,.8)"; c.fillText("РАЗМЕРНОСТЬ ОТ МАСШТАБА", gx, gy - 8);
      const Y = dd => gy + gh - (dd - 1.5)/(4.3 - 1.5)*gh, X = s => gx + Math.sqrt(s/400)*gw;
      c.strokeStyle = "rgba(160,190,255,.25)"; [2, 3, 4].forEach(dd => { c.beginPath(); c.moveTo(gx, Y(dd)); c.lineTo(gx + gw, Y(dd)); c.stroke(); c.fillStyle = "rgba(233,226,208,.45)"; c.fillText(String(dd), gx - 9, Y(dd) + 3); });
      c.strokeStyle = "rgba(255,220,160,.9)"; c.beginPath(); for (let i = 0; i <= 60; i++){ const s = 400*Math.pow(i/60, 2), x = X(s), y = Y(dsCDT(s)); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(X(sg), Y(d), 3.5, 0, TAU); c.fill();
      c.fillStyle = "rgba(233,226,208,.5)"; c.fillText("мельче ←", gx, gy + gh + 13); c.textAlign = "right"; c.fillText("→ крупнее", gx + gw, gy + gh + 13); c.textAlign = "left"; return; }
    if (mode7 === "brain"){ capBox(c, x0, yT, wT, "КЛИКА ИЗ " + brK + " НЕЙРОНОВ — СИМПЛЕКС РАЗМЕРНОСТИ " + (brK - 1), brK === 2 ? "ОТРЕЗОК" : brK === 3 ? "ТРЕУГОЛЬНИК" : brK === 4 ? "ТЕТРАЭДР" : "КАЖДЫЙ СВЯЗАН С КАЖДЫМ · В МОДЕЛИ КОРЫ — ДО 12 НЕЙРОНОВ (11D)"); }
  }
  function toolsGen(modes, cur, attr, extra){
    let h = `<div class="dm-row dm-modes" role="group" aria-label="Способы">${modes.map(([k, n]) => `<button class="tm-tog" data-${attr}="${k}" aria-pressed="${cur === k}" data-hover>${n}</button>`).join("")}</div>` + extra;
    $("dmTools").innerHTML = h; }
  function tools6(){
    let ex = "";
    if (mode6 === "hexa") ex += `<div class="dm-row"><button class="btn" id="dmExt" data-hover>${ext < .985 ? "Протянуть" : "Протянуть заново"}</button></div><div class="dm-row dm-pl" role="group" aria-label="Плоскости вращения">${PL6N.map((n, k) => `<button class="dm-chip${k ? " w" : ""}" data-p6="${k}" aria-pressed="${pl6[k]}" data-hover>${n}</button>`).join("")}</div>`;
    if (mode6 === "cy") ex += `<div class="dm-row dm-pl" role="group" aria-label="Колебание струны"><span class="mono" style="font-size:9.5px;letter-spacing:.14em;color:var(--faint)">СТРУНА:</span>${[2, 3, 5, 8].map(m => `<button class="dm-chip" data-sm="${m}" aria-pressed="${strM === m}" data-hover>${m} горба</button>`).join("")}</div>`;
    ex += `<p class="dm-note">${esc(DIM6_MODE[mode6])}</p>`;
    toolsGen([["hexa", "Гексеракт"], ["cy", "Калаби — Яу"], ["pts", "В каждой точке"]], mode6, "m6", ex);
    $("dmTools").querySelectorAll("[data-m6]").forEach(b => b.onclick = () => setMode6(b.dataset.m6));
    $("dmTools").querySelectorAll("[data-p6]").forEach(b => b.onclick = () => { const k = +b.dataset.p6; pl6[k] = !pl6[k]; b.setAttribute("aria-pressed", String(pl6[k])); if (pl6[k]) Music.plane(Math.min(5, k)); });
    $("dmTools").querySelectorAll("[data-sm]").forEach(b => b.onclick = () => { strM = +b.dataset.sm; $("dmTools").querySelectorAll("[data-sm]").forEach(q => q.setAttribute("aria-pressed", String(+q.dataset.sm === strM))); Music.plane([2, 3, 5, 8].indexOf(strM) + 1); });
    const eb = $("dmExt"); if (eb) eb.onclick = () => { ext = extT = 0; extAuto = 1; tools6(); hintSet(); };
  }
  function setMode6(m){ mode6 = m; if (ext < 1) ext = extT = 1; [camRYT, camTiltT] = m === "pts" ? [.5, .3] : m === "cy" ? [.35, .25] : [.45, .28];
    tools6(); hintSet(); const nm = cardEl.querySelector(".dm-note-m"); if (nm) nm.textContent = DIM6_MODE[m]; }
  function tools7(){
    let ex = "";
    if (mode7 === "melt") ex += `<label class="dm-row dm-sl"><span class="mono">мельче</span><input type="range" id="dmMelt" min="0" max="1" step="0.005" value="${meltM}" aria-label="Масштаб: от больших к планковским"></label>`;
    ex += `<p class="dm-note">${esc(DIM7_MODE[mode7])}</p>`;
    toolsGen([["all", "Вся лестница"], ["melt", "Тающая размерность"], ["brain", "Клики мозга"]], mode7, "m7", ex);
    $("dmTools").querySelectorAll("[data-m7]").forEach(b => b.onclick = () => setMode7(b.dataset.m7));
    const mr = $("dmMelt"); if (mr) mr.oninput = () => { meltM = +mr.value; meltUser = performance.now(); };
  }
  function setMode7(m){ mode7 = m; if (m === "brain") brInit(); [camRYT, camTiltT] = m === "all" ? [.4, .22] : [.45, .25];
    tools7(); hintSet(); const nm = cardEl.querySelector(".dm-note-m"); if (nm) nm.textContent = DIM7_MODE[m]; }
  // ---- опыты 4D — точки в pW ----
  let KN = null, GLV = null;
  function knotInit(){ const N = 900, P = [];
    for (let i = 0; i < N; i++){ const t = i/N*TAU; P.push([Math.sin(t) + 2*Math.sin(2*t), Math.cos(t) - 2*Math.cos(2*t), -Math.sin(3*t)]); }
    let best = { d: 1e9 };
    for (let i = 0; i < N; i++) for (let j = i + 60; j < N; j++){ if (N - (j - i) < 60) continue; const d = (P[i][0] - P[j][0])**2 + (P[i][1] - P[j][1])**2; if (d < best.d) best = { d, i, j }; }
    const i1 = P[best.i][2] < P[best.j][2] ? best.i : best.j, i2 = i1 === best.i ? best.j : best.i;
    KN = { N, P, i1, i2, dz: P[i2][2] - P[i1][2] }; }
  function gloveInit(){ const G = [];
    const tube = (pt, r, n, push) => { for (let k = 0; k < n; k++){ const a = k/n*TAU; push([pt[0] + Math.cos(a)*r, pt[1], pt[2] + Math.sin(a)*r]); } };
    const add = p => G.push(p);
    for (let x = -.56; x <= .561; x += .07) for (let y = -.86; y <= .351; y += .07) add([x, y, 0]);
    for (let x = -.6; x <= .61; x += .05){ add([x, -.9, .05]); add([x, -.9, -.05]); }
    [[-.42, .9], [-.14, 1.08], [.14, 1.02], [.42, .78]].forEach(([fx, L]) => { for (let q = 0; q <= 30; q++){ const s = q/30, ph = s*1.3; tube([fx, .35 + L*Math.sin(ph)/1.3, L*(1 - Math.cos(ph))/1.3], .085, 9, add); } });
    for (let q = 0; q <= 26; q++){ const s = q/26, ph = s*1.15, L = .72; const along = L*Math.sin(ph)/1.15, up = L*(1 - Math.cos(ph))/1.15;
      const pc = [.55 + along*.82, -.42 + along*.57, up]; for (let k = 0; k < 9; k++){ const a = k/9*TAU; add([pc[0] - .57*Math.cos(a)*.095, pc[1] + .82*Math.cos(a)*.095, pc[2] + Math.sin(a)*.095]); } }
    GLV = G.map(p => [p[0]*1.45, p[1]*1.45 + .2, p[2]*1.45]); }
  function world4(dt, T){
    if (lens4 === "time"){ worldTime(dt, T); return; }
    if (mode4 === "hyper"){
      hyT += dt/13; if (hyT > 1) hyT = 0;
      const w0 = clamp(-2.9 + 6.2*hyT, -2.9, 2.9), R = 2.0;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) put(pW, nW++, i*1.3, j*1.3, k*1.3, [.7, .76, 1], .1, 0);
      if (Math.abs(w0) < R){ const r = Math.sqrt(R*R - w0*w0)*1.2, n = 1500;
        for (let k = 0; k < n; k++){ const [x, y, z] = fib(k, n); put(pW, nW++, x*r, y*r, z*r, [1, .9, .7], .9, .55); } }
      return;
    }
    if (mode4 === "knot"){
      if (!KN) knotInit();
      knT += dt/17; if (knT > 1) knT = 0; const ph = knT;
      const wA = smooth(.12, .25, ph)*(1 - smooth(.5, .6, ph)), zS = smooth(.27, .47, ph), mo = smooth(.66, .86, ph), fade = smooth(0, .03, ph)*(1 - smooth(.96, 1, ph));
      knPh = ph < .12 ? 0 : ph < .27 ? 1 : ph < .5 ? 2 : ph < .64 ? 3 : 4;
      const { N, P, i1, dz } = KN;
      for (let i = 0; i < N && nW < WCAP; i++){ let a = (i - i1)/N*TAU; a = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; const g = Math.exp(-((a/.3)**2)), p = P[i], t = i/N*TAU;
        const w = g*wA, z = p[2] + g*zS*2*dz;
        const q = [p[0]*.72*(1 - mo) + Math.cos(t)*2*mo, p[1]*.72*(1 - mo) + Math.sin(t)*2*mo, z*.72*(1 - mo)];
        put(pW, nW++, q[0], q[1], q[2], WCOL(w), fade, .7 + w*1.1); }
      return;
    }
    if (mode4 === "glove"){
      if (!GLV) gloveInit();
      glT += dt/12; if (glT > 1) glT = 0;
      glTh = glT < .12 ? 0 : glT < .45 ? smooth(.12, .45, glT)*Math.PI : glT < .62 ? Math.PI : Math.PI + smooth(.62, .95, glT)*Math.PI;
      const c = Math.cos(glTh), s = Math.sin(glTh);
      for (const p of GLV){ if (nW >= WCAP) break; const v = [p[0]*c, p[1], p[2], p[0]*s]; rot(v, 0, 2, dragA[0]*.3); const q = proj4(v); put(pW, nW++, q[0]/S4*1.1, q[1]/S4*1.1, q[2]/S4*1.1, WCOL(v[3]/1.2), .8, .5); }
    }
  }
  // ---- миры ступеней: Линляндия, Флатландия, сфера сквозь плоскость ----
  function world(dt, T){
    nW = 0;
    beads.forEach(b => b.g.material.opacity = 0);
    if (step === 1){
      for (let k = 0; k < 160; k++){ const x = -6 + k/159*12; put(pW, nW++, x, 0, 0, [1, .9, .7], .18, 0); }
      // бусины не могут обогнать друг друга: отскакивают
      beads.forEach(b => { b.x += b.v*dt; });
      beads.sort((a, b) => a.x - b.x);
      for (let k = 0; k < beads.length; k++){ const b = beads[k];
        if (b.x < -5.6){ b.x = -5.6; b.v = Math.abs(b.v); } if (b.x > 5.6){ b.x = 5.6; b.v = -Math.abs(b.v); }
        if (k > 0 && b.x - beads[k - 1].x < .5){ const t = b.v; b.v = beads[k - 1].v; beads[k - 1].v = t; b.x = beads[k - 1].x + .5; } }
      beads.forEach((b, k) => { b.g.position.set(b.x, 0, 0); b.g.material.opacity = dweller ? .9 : .32; b.g.scale.setScalar(dweller && k === 2 ? .85 : .55); });
    }
    if (step === 2){
      for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) put(pW, nW++, i*.5, j*.5, 0, [.75, .78, 1], .09, 0);
      const sa = dweller ? .95 : .38;
      shapes.forEach(s => { s.x += s.vx*dt; s.y += s.vy*dt; s.a += s.va*dt;
        if (Math.abs(s.x) > 4.4){ s.vx *= -1; s.x = Math.sign(s.x)*4.4; } if (s.y > 4.4){ s.vy = -Math.abs(s.vy); s.y = 4.4; } if (s.y < -2.8){ s.vy = Math.abs(s.vy); s.y = -2.8; }
        if (s.n){ const P = polyPts(s); for (let k = 0; k < s.n; k++){ const A = P[k], B = P[(k + 1) % s.n]; for (let q = 0; q < 14; q++){ const t = q/14; put(pW, nW++, A[0] + (B[0] - A[0])*t, A[1] + (B[1] - A[1])*t, 0, s.c, sa, .3); } } }
        else for (let q = 0; q < 40; q++){ const t = q/40*TAU; put(pW, nW++, s.x + Math.cos(t)*s.r, s.y + Math.sin(t)*s.r, 0, s.c, sa, .3); } });
      // наблюдатель — маленький треугольник; взгляд медленно поворачивается
      you.a = Math.PI/2 + Math.sin(T*.25)*.7;
      for (let k = 0; k < 3; k++){ const t = you.a + k/3*TAU, t2 = you.a + (k + 1)/3*TAU; for (let q = 0; q < 8; q++){ const u = q/8;
        put(pW, nW++, you.x + Math.cos(t)*.32*(1 - u) + Math.cos(t2)*.32*u, you.y + Math.sin(t)*.32*(1 - u) + Math.sin(t2)*.32*u, 0, [1, 1, 1], 1, .3); } }
      if (dweller) for (let k = 0; k < 24; k++){ const f = (k/23 - .5)*1.75 + you.a; put(pW, nW++, you.x + Math.cos(f)*1.2, you.y + Math.sin(f)*1.2, 0, [1, 1, 1], .35, 0); }
      // сфера сквозь плоскость
      if (sphereT >= 0){ sphereT += dt/10; if (sphereT > 1) sphereT = -1; }
      if (sphereT >= 0){ const R = 1.5, z = 3.4 - sphereT*6.8, cx = .8, cy = .2;
        for (let k = 0; k < 340; k++){ const [x, y, zz] = fib(k, 340); put(pW, nW++, cx + x*R, cy + y*R, z + zz*R, [1, .95, .8], .3, 0); }
        if (Math.abs(z) < R){ const r = Math.sqrt(R*R - z*z); for (let k = 0; k < 72; k++){ const t = k/72*TAU; put(pW, nW++, cx + Math.cos(t)*r, cy + Math.sin(t)*r, 0, [1, .92, .7], 1, .6); } } }
    }
    if (step === 4) world4(dt, T); else if (step === 5) world5(dt, T); else if (step === 6) world6(dt, T); else if (step === 7) world7(dt, T);
    done(pW, nW, WCAP);
  }
  // ---- «сетчатка» жителя (полоса внизу) и подписи осей ----
  const lc = lab.getContext("2d");
  function overlay(T, port){
    const c = lc; c.setTransform(DPR3, 0, 0, DPR3, 0, 0); c.clearRect(0, 0, W3, H3);
    const pb = tin.getBoundingClientRect(), cb = cvs.getBoundingClientRect();
    if (!port){ const pr = pb.right - cb.left, gw = pr + W3*.08, g = c.createLinearGradient(0, 0, gw, 0);
      g.addColorStop(0, "rgba(5,6,12,.94)"); g.addColorStop(clamp(pr/gw, 0, 1), "rgba(5,6,12,.85)"); g.addColorStop(1, "rgba(5,6,12,0)"); c.fillStyle = g; c.fillRect(0, 0, gw, H3); }
    // подписи осей у концов рёбер
    if (step === 4){ overlay4(c, pb, cb, port, T); return; }
    if (step === 5){ overlay5(c, pb, cb, port, T); return; }
    if (step >= 6){ overlay67(c, pb, cb, port, T); return; }
    if (step > 0){ const v = new THREE.Vector3(); c.font = "11px " + (getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace"); c.textAlign = "center";
      for (let a = 0; a < step; a++){ const u = [0, 0, 0, 0, 0, 0]; u[a] = a === step - 1 ? 1.25*ext + .35 : 1.6; if (step >= 3){ rot(u, 0, 2, rotA[0]); rot(u, 1, 2, rotA[1]*.6); }
        const p = project(u); v.set(p[0], p[1], p[2]).project(cam); if (v.z > 1) continue;
        const x = (v.x + 1)/2*W3, y = (1 - v.y)/2*H3; const k = AXC[a]; c.fillStyle = `rgba(${k[0]*255|0},${k[1]*255|0},${k[2]*255|0},.85)`; c.fillText(AXN[a], x, y); } }
    if (!dweller || (step !== 1 && step !== 2)) return;
    // полоса-сетчатка
    const x0 = port ? 16 : pb.right - cb.left + 40, w = Math.min(560, W3 - x0 - 30), y0 = 76, h = 18;
    c.fillStyle = "rgba(5,6,12,.85)"; c.fillRect(x0 - 8, y0 - 26, w + 16, h + 40);
    c.strokeStyle = "rgba(214,172,94,.4)"; c.strokeRect(x0 - .5, y0 - .5, w + 1, h + 1);
    c.font = "10px " + (getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace"); c.textAlign = "left"; c.fillStyle = "rgba(214,172,94,.8)";
    c.fillText(step === 1 ? "ТАК ВИДИТ ЖИТЕЛЬ ЛИНЛЯНДИИ — ТОЛЬКО ТОЧКИ СОСЕДЕЙ" : "ТАК ВИДИТ ПЛОСКАТИК — ВЕСЬ МИР В ОДНОЙ ЛИНИИ", x0, y0 - 10);
    if (step === 1){
      const me = beads.slice().sort((a, b) => a.x - b.x), k = 2, L = me[k - 1], R = me[k + 1];
      const dot = (b, xx) => { if (!b) return; const d = Math.abs(b.x - me[k].x), I = clamp(1.4/(d + .4), .15, 1), col = b.g.material.color;
        const g = c.createRadialGradient(xx, y0 + h/2, 0, xx, y0 + h/2, 14); g.addColorStop(0, `rgba(${col.r*255|0},${col.g*255|0},${col.b*255|0},${I})`); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(xx - 14, y0, 28, h); };
      dot(L, x0 + w*.25); dot(R, x0 + w*.75);
      c.fillStyle = "rgba(233,226,208,.45)"; c.textAlign = "center"; c.fillText("← сосед", x0 + w*.25, y0 + h + 12); c.fillText("сосед →", x0 + w*.75, y0 + h + 12);
      return;
    }
    // Флатландия: лучи из глаз наблюдателя — ближайшее пересечение, цвет и туман по расстоянию
    const N = Math.max(80, Math.floor(w/3)), F = 1.75;
    const circles = shapes.filter(s => !s.n).map(s => ({ x: s.x, y: s.y, r: s.r, c: s.c }));
    if (sphereT >= 0){ const R = 1.5, z = 3.4 - sphereT*6.8; if (Math.abs(z) < R) circles.push({ x: .8, y: .2, r: Math.sqrt(R*R - z*z), c: [1, .92, .7] }); }
    const segs = []; shapes.filter(s => s.n).forEach(s => { const P = polyPts(s); for (let k = 0; k < s.n; k++) segs.push([P[k], P[(k + 1) % s.n], s.c]); });
    for (let r = 0; r < N; r++){
      const f = you.a + F/2 - r/(N - 1)*F, dx = Math.cos(f), dy = Math.sin(f); let best = 1e9, col = null;
      for (const q of circles){ const ox = you.x - q.x, oy = you.y - q.y, b = ox*dx + oy*dy, cc = ox*ox + oy*oy - q.r*q.r, D = b*b - cc; if (D < 0) continue; const t = -b - Math.sqrt(D); if (t > .01 && t < best){ best = t; col = q.c; } }
      for (const [A, B, cl] of segs){ const ex = B[0] - A[0], ey = B[1] - A[1], den = dx*ey - dy*ex; if (Math.abs(den) < 1e-9) continue;
        const t = ((A[0] - you.x)*ey - (A[1] - you.y)*ex)/den, u = ((A[0] - you.x)*dy - (A[1] - you.y)*dx)/den; if (t > .01 && u >= 0 && u <= 1 && t < best){ best = t; col = cl; } }
      if (col){ const I = clamp(1.6/(best*.55 + .6), .12, 1); c.fillStyle = `rgba(${col[0]*255|0},${col[1]*255|0},${col[2]*255|0},${I})`; c.fillRect(x0 + r*w/N, y0, w/N + .6, h); }
    }
  }
  function overlay4(c, pb, cb, port, T){
    if (lens4 === "time"){ overlayTime(c, pb, cb, port, T); return; }
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace";
    const x0 = port ? 16 : pb.right - cb.left + 40, yT = port ? 70 : 76;
    c.textAlign = "left"; c.font = "10px " + mono;
    const back = (y, h, w) => { c.fillStyle = "rgba(5,6,12,.72)"; c.fillRect(x0 - 8, y - 14, (w || 420) + 16, h); };
    const capt = (t, y, col) => { c.fillStyle = col || "rgba(214,172,94,.9)"; c.fillText(t, x0, y); };
    const wLegend = y => { const g = c.createLinearGradient(x0, 0, x0 + 150, 0); g.addColorStop(0, "rgb(255,219,143)"); g.addColorStop(1, "rgb(255,107,199)");
      capt("ЦВЕТ — КООРДИНАТА W, ЧЕТВЁРТОЕ НАПРАВЛЕНИЕ", y, "rgba(233,226,208,.55)"); c.fillStyle = g; c.fillRect(x0, y + 8, 150, 4);
      c.fillStyle = "rgba(233,226,208,.55)"; c.fillText("0", x0, y + 26); c.textAlign = "right"; c.fillText("w", x0 + 150, y + 26); c.textAlign = "left"; };
    const wTxt = Math.min(W3 - x0 - 24, 440);
    if (mode4 === "shadow"){
      const y = port ? yT : H3 - 44; back(y, 40, 260);
      const on = PLN.filter((_, k) => planes[k]); capt(on.length ? "ВРАЩЕНИЕ: " + on.join(" · ") : "ВРАЩЕНИЕ ВЫКЛЮЧЕНО — ТЯНИТЕ МЫШЬЮ", y);
      let x = x0; ["x", "y", "z", "w"].forEach((n, a) => { const k = AXC[a]; c.fillStyle = `rgb(${k[0]*255|0},${k[1]*255|0},${k[2]*255|0})`; c.fillRect(x, y + 10, 16, 3); c.fillText(n, x + 21, y + 15); x += 46; });
      return;
    }
    if (mode4 === "slice"){ back(yT, 22, wTxt); capt(`СРЕЗ НАШИМ ПРОСТРАНСТВОМ · w = ${sliceW >= 0 ? "+" : "−"}${Math.abs(sliceW).toFixed(2)}`, yT); return; }
    if (mode4 === "net"){ back(yT, 22, wTxt); capt(fold < .02 ? "РАЗВЁРТКА: ВОСЕМЬ КУБОВ КРЕСТОМ, КАК У ДАЛИ" : fold > .98 ? "СЛОЖЕНО: ТЕССЕРАКТ — КУБ В КУБЕ" : "КУБЫ ПОВОРАЧИВАЮТСЯ В ЧЕТВЁРТОЕ НАПРАВЛЕНИЕ…", yT); return; }
    if (mode4 === "hyper"){
      const w0 = clamp(-2.9 + 6.2*hyT, -2.9, 2.9), R = 2.0, inn = Math.abs(w0) < R;
      back(yT, 22, wTxt); capt(!inn ? (w0 < 0 ? "ГИПЕРСФЕРА ЕЩЁ НЕ КОСНУЛАСЬ НАШЕГО МИРА" : "УШЛА — ДЛЯ НАС ЕЁ БОЛЬШЕ НЕТ") : "МЫ ВИДИМ ЛИШЬ СРЕЗ: ШАР РАДИУСОМ " + Math.sqrt(R*R - w0*w0).toFixed(2), yT);
      const iw = port ? 124 : 170, ih = port ? 96 : 130, ix = port ? W3 - iw - 12 : W3 - iw - 40, iy = port ? 92 : H3 - ih - 40, k = port ? 15 : 22, cx = ix + iw/2, cy = iy + ih/2 + 6;
      c.fillStyle = "rgba(5,6,12,.82)"; c.fillRect(ix, iy, iw, ih); c.strokeStyle = "rgba(214,172,94,.35)"; c.strokeRect(ix + .5, iy + .5, iw - 1, ih - 1);
      c.fillStyle = "rgba(214,172,94,.75)"; c.fillText("ВИД «СБОКУ» ИЗ 4D", ix + 8, iy + 14);
      c.save(); c.beginPath(); c.rect(ix, iy + 18, iw, ih - 18); c.clip();
      c.strokeStyle = "rgba(255,220,160,.8)"; c.beginPath(); c.arc(cx, cy - w0*k*-1, R*k, 0, TAU); c.stroke();
      c.strokeStyle = "rgba(160,190,255,.55)"; c.beginPath(); c.moveTo(ix + 6, cy); c.lineTo(ix + iw - 6, cy); c.stroke();
      if (inn){ const h = Math.sqrt(R*R - w0*w0)*k; c.strokeStyle = "rgba(255,230,170,1)"; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - h, cy); c.lineTo(cx + h, cy); c.stroke(); c.lineWidth = 1; }
      c.restore();
      c.fillStyle = "rgba(160,190,255,.7)"; c.fillText("наш мир", ix + 8, cy - 5); c.fillStyle = "rgba(233,226,208,.5)"; c.textAlign = "right"; c.fillText("w ↕", ix + iw - 8, iy + 14); c.textAlign = "left";
      return;
    }
    if (mode4 === "knot"){
      back(yT, 66, wTxt);
      capt(["1 · УЗЕЛ-ТРИЛИСТНИК: В 3D ЕГО НЕ РАЗВЯЗАТЬ", "2 · В ОДНОМ МЕСТЕ НИТЬ ПОДНИМАЕТСЯ В НАПРАВЛЕНИИ W", "3 · ПРОХОДИТ «СКВОЗЬ» ДРУГУЮ НИТЬ — В 4D ОНИ НЕ ВСТРЕЧАЮТСЯ", "4 · ОПУСКАЕТСЯ ОБРАТНО В НАШ МИР", "5 · УЗЛА НЕТ — ПРОСТАЯ ПЕТЛЯ, НИТЬ НЕ РАЗРЕЗАНА"][knPh], yT);
      wLegend(yT + 18);
      if (KN && knPh >= 1 && knPh <= 3){ const p = KN.P[KN.i2], v = new THREE.Vector3(p[0]*.72, p[1]*.72, p[2]*.72).project(cam);
        const x = (v.x + 1)/2*W3, y = (1 - v.y)/2*H3; c.setLineDash([3, 4]); c.strokeStyle = "rgba(255,150,210,.75)"; c.beginPath(); c.arc(x, y, 26 + 3*Math.sin(T*3), 0, TAU); c.stroke(); c.setLineDash([]); }
      return;
    }
    if (mode4 === "glove"){
      back(yT, 66, wTxt); const L = glTh < Math.PI/2 || glTh > 1.5*Math.PI;
      capt(Math.abs(Math.cos(glTh)) < .14 ? "НА МИГ ПЛОСКАЯ: ПЕРЧАТКА «СТОИТ РЕБРОМ» В 4D" : glTh > .05 && glTh < Math.PI - .05 || glTh > Math.PI + .05 && glTh < TAU - .05 ? "ПОВОРОТ В ПЛОСКОСТИ XW…" : L ? "ЛЕВАЯ ПЕРЧАТКА — БОЛЬШОЙ ПАЛЕЦ СПРАВА" : "ПРАВАЯ ПЕРЧАТКА — БОЛЬШОЙ ПАЛЕЦ СЛЕВА", yT);
      wLegend(yT + 18);
    }
  }
  // ---- карточка ----
  const hintEl = () => $("dmHint");
  function hintSet(){ const h = hintEl(); if (!h) return;
    h.textContent = step === 0 ? "Нажмите «Протянуть» — точка двинется и оставит след" : ext < .985 ? "Потяните мышью или пальцем в любую сторону — или нажмите «Протянуть»" : step === 7 ? "Режимы — сверху · тяните — поворот" : step === 6 ? (mode6 === "hexa" ? "Тяните — поворот · чипы — плоскости с шестым направлением u" : "Тяните — поворот") : step === 5 ? HINT5[mode5] : step === 4 ? (lens4 === "time" ? "Тяните — поворот · двигайте «сейчас» или нажмите «Прожить»" : HINT4[mode4]) : step >= 3 ? "Тяните — вращение куба" : "Тяните — поворот взгляда"; }
  const HINT4 = { shadow:"Тяните — поворот в 3D · чипы — вращение в плоскостях 4D", slice:"Двигайте ползунок w — наше пространство скользит сквозь тессеракт", net:"«Сложить в 4D» — крест Дали собирается в тессеракт · тяните — поворот",
    hyper:"Смотрите на вставку справа: так это выглядит «сбоку» из 4D", knot:"Опыт идёт сам, около 17 секунд · тяните — поворот", glove:"Опыт идёт сам, около 12 секунд · тяните — поворот" };
  const HINT5 = { penta:"Тяните — поворот · чипы — вращение в плоскостях с пятым направлением v", hose:"Двигайте «ближе» — линия раскрывается в трубку · тяните — поворот", poss:"Пути выбираются сами каждые несколько секунд · «Выбрать сейчас»" };
  function tools4(){
    const M = [["shadow", "Тень"], ["slice", "Срез"], ["net", "Развёртка"], ["hyper", "Гиперсфера"], ["knot", "Узел"], ["glove", "Перчатка"]];
    const lensRow = `<div class="dm-row dm-lens" role="group" aria-label="Линза"><span class="mono">Четвёртое измерение —</span><button class="tm-tog" data-lens="space" aria-pressed="${lens4 === "space"}" data-hover>направление w</button><button class="tm-tog" data-lens="time" aria-pressed="${lens4 === "time"}" data-hover>время</button></div>`;
    if (lens4 === "time"){
      let h = lensRow + `<div class="dm-row dm-modes" role="group" aria-label="Три взгляда на время">${DIM_TIME.views.map(([k, n]) => `<button class="tm-tog" data-tv="${k}" aria-pressed="${tView === k}" data-hover>${n}</button>`).join("")}</div>
        <label class="dm-row dm-sl"><span class="mono">сейчас</span><input type="range" id="dmNow" min="0" max="84" step="0.1" value="${tNow}" aria-label="Момент «сейчас», лет"><b class="mono" id="dmNowV">${Math.round(tNow)} лет</b></label>
        <div class="dm-row"><button class="btn" id="dmPlay" data-hover>${tPlay ? "❚❚ Пауза" : "▶ Прожить"}</button><button class="tm-tog" id="dmTilt" aria-pressed="${tTilt}" data-hover>«Сейчас» другого наблюдателя</button></div>
        <p class="dm-note">${esc(DIM_TIME.views.find(q => q[0] === tView)[2])}</p>`;
      $("dmTools").innerHTML = h; bindLens();
      $("dmTools").querySelectorAll("[data-tv]").forEach(b => b.onclick = () => { tView = b.dataset.tv; tools4(); const nm = cardEl.querySelector(".dm-note-m"); if (nm) nm.textContent = DIM_TIME.views.find(q => q[0] === tView)[2]; });
      const nr = $("dmNow"); nr.oninput = () => { tNow = +nr.value; tPlay = false; $("dmNowV").textContent = Math.round(tNow) + " лет"; $("dmPlay").textContent = "▶ Прожить"; };
      $("dmPlay").onclick = () => { tPlay = !tPlay; if (tPlay && tNow >= 83.9) tNow = 0; $("dmPlay").textContent = tPlay ? "❚❚ Пауза" : "▶ Прожить"; };
      $("dmTilt").onclick = () => { tTilt = !tTilt; $("dmTilt").setAttribute("aria-pressed", String(tTilt)); };
      return;
    }
    let h = lensRow + `<div class="dm-row"><button class="btn" id="dmExt" data-hover>${ext < .985 ? "Протянуть" : "Протянуть заново"}</button></div>
      <div class="dm-row dm-modes" role="group" aria-label="Способы и опыты">${M.map(([k, n], i) => `${i === 3 ? '<span class="dm-sep" aria-hidden="true"></span>' : ""}<button class="tm-tog" data-m4="${k}" aria-pressed="${mode4 === k}" data-hover>${n}</button>`).join("")}</div>`;
    if (mode4 === "shadow" || mode4 === "slice") h += `<div class="dm-row dm-pl" role="group" aria-label="Плоскости вращения">${PLN.map((n, k) => `<button class="dm-chip${k >= 3 ? " w" : ""}" data-pl="${k}" aria-pressed="${planes[k]}" data-hover>${n}</button>`).join("")}</div>`;
    if (mode4 === "slice") h += `<label class="dm-row dm-sl"><span class="mono">w</span><input type="range" id="dmW" min="-2.1" max="2.1" step="0.01" value="${sliceW}" aria-label="Положение среза по w"><b class="mono" id="dmWv">${sliceW.toFixed(2)}</b></label>`;
    if (mode4 === "net") h += `<div class="dm-row"><button class="btn" id="dmFold" data-hover>${foldT > .5 ? "Развернуть" : "Сложить в 4D"}</button><input type="range" id="dmFr" min="0" max="1" step="0.01" value="${fold}" aria-label="Насколько сложено"></div>`;
    h += `<p class="dm-note">${esc(DIM4_MODE[mode4])}</p>`;
    $("dmTools").innerHTML = h; bindLens();
    $("dmExt").onclick = () => { mode4 = "shadow"; ext = extT = 0; extAuto = 1; tools4(); hintSet(); };
    $("dmTools").querySelectorAll("[data-m4]").forEach(b => b.onclick = () => setMode4(b.dataset.m4));
    $("dmTools").querySelectorAll("[data-pl]").forEach(b => b.onclick = () => { const k = +b.dataset.pl; planes[k] = !planes[k]; b.setAttribute("aria-pressed", String(planes[k])); if (planes[k]) Music.plane(k); });
    const wr = $("dmW"); if (wr) wr.oninput = () => { sliceW = +wr.value; sliceUser = performance.now(); $("dmWv").textContent = sliceW.toFixed(2); };
    const fb = $("dmFold"); if (fb) fb.onclick = () => { foldT = foldT > .5 ? 0 : 1; fb.textContent = foldT > .5 ? "Развернуть" : "Сложить в 4D"; if (foldT) Music.dim(4); };
    const fr = $("dmFr"); if (fr) fr.oninput = () => { fold = foldT = +fr.value; };
  }
  function bindLens(){ $("dmTools").querySelectorAll("[data-lens]").forEach(b => b.onclick = () => setLens(b.dataset.lens)); }
  function setLens(l){ if (lens4 === l) return; lens4 = l; if (ext < 1) ext = extT = 1; Music.dim(4);
    if (l === "time"){ [camRYT, camTiltT] = [.62, .2]; jrMark("dm", "4t", "Пространство-время"); } else [camRYT, camTiltT] = [.45, .28];
    card(); }
  function setMode4(m){ mode4 = m; if (ext < 1){ ext = extT = 1; }
    if (m === "hyper") hyT = 0; if (m === "knot") knT = 0; if (m === "glove") glT = 0; if (m === "net"){ fold = foldT = 0; }
    if (m === "slice"){ planes = [false, false, false, false, false, false]; ang = [0, 0, 0, 0, 0, 0]; }
    [camRYT, camTiltT] = m === "knot" ? [.1, .32] : m === "glove" ? [.25, .12] : m === "net" ? [.5, .28] : [.45, .28];
    tools4(); hintSet(); const nm = cardEl.querySelector(".dm-note-m"); if (nm) nm.textContent = DIM4_MODE[m]; }
  function card(){
    const S = step === 4 && lens4 === "time" ? DIM_TIME : DIM_STEPS[step];
    $("dmLadder").innerHTML = DIM_STEPS.map(s => `<button data-dm="${s.n}" class="${s.n === step ? "on" : ""}" data-hover><b>${s.n < 7 ? s.n + "D" : "…"}</b><span>${esc(s.nm)}</span></button>`).join("")
      + DIM_LATER.map(s => `<button disabled title="Откроется в следующих обновлениях"><b>${s.n < 7 ? s.n + "D" : "…"}</b><span>${esc(s.nm)}</span></button>`).join("");
    $("dmLadder").querySelectorAll("[data-dm]").forEach(b => b.onclick = () => go(+b.dataset.dm));
    const tools = [`<button class="btn" id="dmExt" data-hover>${step === 0 ? "Протянуть →" : ext < .985 ? "Протянуть" : "Протянуть заново"}</button>`];
    if (step === 1 || step === 2) tools.push(`<button class="tm-tog" id="dmDw" aria-pressed="${dweller}" data-hover>Стать жителем</button>`);
    if (step === 2) tools.push(`<button class="tm-tog" id="dmSph" aria-pressed="${sphereT >= 0}" data-hover>Сфера сквозь плоскость</button>`);
    $("dmTools").innerHTML = tools.join("");
    if (step === 4) tools4(); else if (step === 5) tools5(); else if (step === 6) tools6(); else if (step === 7) tools7();
    cardEl.innerHTML = `<div class="tm-bar"><span class="mono eyebrow tm-cat">${S.n < 7 ? `Ступень ${S.n} · ${S.n}D` : "Эпилог лестницы"}</span>
        <span class="tm-nav"><button id="dmPrev" ${step ? "" : "disabled"} aria-label="Ниже" data-hover>←</button><button id="dmNext" ${step < DIM_STEPS.length - 1 ? "" : "disabled"} aria-label="Выше" data-hover>→</button></span></div>
      <h3>${esc(S.nm)}</h3><p class="tm-ago2">${esc(S.sub)}</p>
      <p class="tm-lead">${esc(S.lead)}</p>
      ${step === 4 ? `<p class="dm-note dm-note-m">${esc(lens4 === "time" ? DIM_TIME.views.find(q => q[0] === tView)[2] : DIM4_MODE[mode4])}</p>` : step >= 5 ? `<p class="dm-note dm-note-m">${esc(step === 5 ? DIM5_MODE[mode5] : step === 6 ? DIM6_MODE[mode6] : DIM7_MODE[mode7])}</p>` : ""}
      <h4>Как увидеть</h4><p class="tm-pr">${esc(S.see)}</p>
      ${step === 3 ? `<div class="dm-tetr" aria-label="Тетрактида: 1 + 2 + 3 + 4 = 10">${[1, 2, 3, 4].map(r => `<div>${"<i></i>".repeat(r)}</div>`).join("")}<span class="mono">1 + 2 + 3 + 4 = 10 · точка · линия · плоскость · тело</span></div>` : ""}
      ${S.views ? `<h4>Три взгляда на время</h4><ul class="list dm-views">${S.views.map(([k, n, tx]) => `<li>${mk("h")}<span><b>${esc(n)}.</b> ${esc(tx)}</span></li>`).join("")}</ul><p class="tm-pr dm-ask">А как чувствуете вы? Попробуйте каждый взгляд на сцене — какой отзывается, когда вы думаете о своей жизни?</p>` : ""}
      <h4>Наука</h4><ul class="list">${S.sci.map(([m, t]) => `<li>${mk(m)}<span>${esc(t)}</span></li>`).join("")}</ul>
      <h4>Традиции и философия</h4><ul class="list">${S.trad.map(t => `<li>${mk("t")}<span>${esc(t)}</span></li>`).join("")}</ul>
      ${S !== DIM_TIME ? `<h4>Линза традиций</h4><div class="dm-lens-box"><ul class="list">${DIM_LENS[step].map(([w, tx]) => `<li>${mk("t")}<span><b>${esc(w)}:</b> ${esc(tx)}</span></li>`).join("")}</ul><p class="dm-lens-note">Это соседство двух лестниц — геометрической и созерцательной, а не соответствие: «планы» и «миры» традиций — шкалы сознания, а не направления пространства.</p></div>` : ""}
      ${(() => { const fs = TH_FIG.filter(f => f.go && f.go.t === "dm" && f.go.n === step && (step !== 4 || (f.go.lens === "time") === (lens4 === "time"))); return fs.length ? `<h4>Нить мысли</h4><div class="hd-thl">${fs.map(f => `<button data-th="${f.id}" class="${f.b}" data-hover>${esc(f.nm)}</button>`).join("")}</div>` : ""; })()}
      <h4>Практика · ${S.prac.min} мин</h4><p class="tm-pr">${esc(S.prac.tx)}</p>
      <div class="tm-gos"><button class="btn tm-go" id="dmPr" data-hover>Начать · ${S.prac.min} мин</button><span class="mono dm-tm" id="dmTm"></span></div>`;
    cardEl.classList.remove("swap"); void cardEl.offsetWidth; cardEl.classList.add("swap"); scr.scrollTop = 0;
    $("dmPrev").onclick = () => go(step - 1); $("dmNext").onclick = () => go(step + 1);
    if (step < 4) $("dmExt").onclick = () => { if (step === 0){ go(1); return; } if (ext >= .985){ ext = extT = 0; extAuto = 1; } else extAuto = 1; card(); };
    const dw = $("dmDw"); if (dw) dw.onclick = () => { dweller = !dweller; dw.setAttribute("aria-pressed", String(dweller)); if (dweller){ camRYT = step === 2 ? .45 : 0; camTiltT = step === 2 ? .35 : 0; } };
    const sp = $("dmSph"); if (sp) sp.onclick = () => { sphereT = sphereT >= 0 ? -1 : 0; sp.setAttribute("aria-pressed", String(sphereT >= 0)); if (sphereT >= 0){ camRYT = .7; camTiltT = .2; } };
    $("dmPr").onclick = practice;
    cardEl.querySelectorAll("button[data-th]").forEach(b => b.onclick = () => openThought(b.dataset.th));
    hintSet();
  }
  function practice(){
    const S = step === 4 && lens4 === "time" ? DIM_TIME : DIM_STEPS[step], btn = $("dmPr"), out = $("dmTm");
    if (practiceTm){ clearInterval(practiceTm); practiceTm = 0; btn.textContent = `Начать · ${S.prac.min} мин`; out.textContent = ""; return; }
    let left = S.prac.min*60; btn.textContent = "Остановить";
    const tick = () => { out.textContent = `${String(Math.floor(left/60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
      if (left-- <= 0){ clearInterval(practiceTm); practiceTm = 0; btn.textContent = "Готово"; out.textContent = ""; Music.end(); jrPrac("dim:" + S.n + (S === DIM_TIME ? "t" : ""), S === DIM_TIME ? "Практика «Взгляд из вечности»" : "Практика ступени «" + S.nm + "»"); } };
    tick(); practiceTm = setInterval(tick, 1000);
  }
  // ---- переход по ступеням ----
  const CAMS = [[0, 0], [0, .05], [.35, .25], [.55, .32], [.45, .28], [.45, .28], [.45, .28], [.4, .22]];
  function go(n){
    n = clamp(n, 0, DIM_STEPS.length - 1); const up = n === step + 1;
    if (practiceTm){ clearInterval(practiceTm); practiceTm = 0; }
    if (n === 4 && up){ mode4 = "shadow"; lens4 = "space"; }
    if (n === 5 && up) mode5 = "penta";
    if (n === 6 && up) mode6 = "hexa";
    if (n === 7) mode7 = "all";
    step = n; dweller = false; sphereT = -1; idle = up ? 2.6 : 0; extAuto = 0;
    ext = extT = up && n < 7 ? 0 : 1;
    if (!up) Music.dim(step);
    [camRYT, camTiltT] = CAMS[n] || [.5, .3];
    jrMark("dm", n, DIM_STEPS[n].nm);
    card();
  }
  // ---- ввод: тянуть — протягивание, после — вращение; колесо — по ступеням ----
  cvs.addEventListener("pointerdown", e => { if (!open) return; cvs.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, e0: extT, r0: rotA.slice(), d0: dragA.slice(), c0: camRYT, t0: camTiltT }; idle = 0; });
  cvs.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (step === 6 && mode6 === "hexa"){ if (drag.e0 < .985){ extT = clamp(drag.e0 + Math.hypot(dx, dy)/220, 0, 1); extAuto = 0; return; } dragA[0] = drag.d0[0] + dx*.008; dragA[1] = drag.d0[1] + dy*.008; return; }
    if (step >= 6){ camRYT = drag.c0 + dx*.005; camTiltT = clamp(drag.t0 + dy*.003, -.5, .9); return; }
    if (step === 5){ if (mode5 === "penta" && drag.e0 < .985){ extT = clamp(drag.e0 + Math.hypot(dx, dy)/220, 0, 1); extAuto = 0; return; }
      if (mode5 === "penta"){ dragA[0] = drag.d0[0] + dx*.008; dragA[1] = drag.d0[1] + dy*.008; } else { camRYT = drag.c0 + dx*.005; camTiltT = clamp(drag.t0 + dy*.003, -.5, .9); } return; }
    if (step === 4 && lens4 === "time"){ camRYT = drag.c0 + dx*.005; camTiltT = clamp(drag.t0 + dy*.003, -.3, .9); return; }
    if (step === 4){ if (mode4 === "shadow" && drag.e0 < .985){ extT = clamp(drag.e0 + Math.hypot(dx, dy)/220, 0, 1); extAuto = 0; return; }
      if (mode4 === "shadow" || mode4 === "slice" || mode4 === "net"){ dragA[0] = drag.d0[0] + dx*.008; dragA[1] = drag.d0[1] + dy*.008; }
      else { camRYT = clamp(drag.c0 + dx*.004, -1.4, 1.4); camTiltT = clamp(drag.t0 + dy*.003, -.6, .9); } return; }
    if (step > 0 && drag.e0 < .985){ extT = clamp(drag.e0 + Math.hypot(dx, dy)/220, 0, 1); extAuto = 0; return; }
    if (step >= 3){ rotA[0] = drag.r0[0] + dx*.008; rotA[1] = drag.r0[1] + dy*.008; }
    else { camRYT = clamp(drag.c0 + dx*.004, -1.2, 1.2); camTiltT = clamp(drag.t0 + dy*.003, -.6, .9); } });
  const up = () => { if (drag && extT > .9 && extT < 1){ extAuto = 1; } drag = null; };
  cvs.addEventListener("pointerup", up); cvs.addEventListener("pointercancel", up);
  let wheelAt = 0;
  cvs.addEventListener("wheel", e => { if (!open) return; e.preventDefault(); const now = performance.now(); if (now - wheelAt < 700 || Math.abs(e.deltaY) < 8) return; wheelAt = now; go(step + (e.deltaY > 0 ? 1 : -1)); }, { passive:false });
  addEventListener("keydown", e => { if (!open || (e.target && e.target.tagName === "INPUT")) return;
    if (e.key === "Escape"){ e.stopPropagation(); close(); }
    else if (e.key === "ArrowRight" || e.key === "ArrowUp"){ e.preventDefault(); go(step + 1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown"){ e.preventDefault(); go(step - 1); } }, true);
  function size(){ DPR3 = Math.min(2, devicePixelRatio || 1); W3 = cvs.clientWidth; H3 = cvs.clientHeight;
    rend.setPixelRatio(DPR3); rend.setSize(W3, H3, false); lab.width = W3*DPR3; lab.height = H3*DPR3; cam.aspect = W3/Math.max(1, H3); cam.updateProjectionMatrix(); }
  function openD(n){ if (!built) build(); open = dimsOn = true; size(); if (n != null) go(n); else { card(); jrMark("dm", step, DIM_STEPS[step].nm); } if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); } }
  function close(){ if (!open) return; open = dimsOn = false; if (practiceTm){ clearInterval(practiceTm); practiceTm = 0; } box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); }
  addEventListener("resize", () => { if (open) size(); });
  const mxb = $("dmMax");
  mxb.onclick = () => { const on = !box.classList.contains("tm-max"); box.classList.toggle("tm-max", on); mxb.setAttribute("aria-pressed", String(on)); mxb.textContent = on ? "⤡ Сцена" : "⤢ Читать"; };
  return { open: openD, close, get on(){ return open; }, go, mode: m => { if (step === 4){ if (lens4 === "time") setLens("space"); setMode4(m); } else if (step === 5) setMode5(m); else if (step === 6) setMode6(m); else if (step === 7) setMode7(m); }, lens: setLens, dbg: { m6: () => mode6, setM6: m => setMode6(m), m7: () => mode7, setM7: m => setMode7(m), melt: v => { meltM = v; meltUser = performance.now(); }, m5: () => mode5, setM5: m => setMode5(m), hz: v => { hoseZ = v; hoseUser = performance.now(); }, lens: () => lens4, tNow: v => { if (v != null) tNow = v; return tNow; }, tView: v => { if (v) tView = v; return tView; }, tTilt: v => { tTilt = !!v; }, setKn: v => { knT = v; }, setGl: v => { glT = v; }, setHy: v => { hyT = v; }, m4: () => mode4, setM4: setMode4, fold: () => fold, slice: () => sliceW, knPh: () => knPh, glTh: () => glTh, step: () => step, ext: () => ext, dw: () => dweller, sph: () => sphereT } };
})();
const chDims = $("chDims");
function openDims(n){ closeChapters(); toggleMenu(false); surface(); chDims.classList.add("open"); chDims.setAttribute("aria-hidden", "false"); DIMS.open(n); $("dmClose").focus({ preventScroll:true }); }
function closeDims(){ DIMS.close(); }
$("dmClose").onclick = closeDims;
$("mDims").onclick = () => openDims();
