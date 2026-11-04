/* ---------- Земля: погружение сквозь поля и недра (глубина 0–16) ---------- */
const EARTH = (() => {
  const RG = 10, SPAN = 60, PHI_ = (1 + Math.sqrt(5))/2;
  const root = new THREE.Group(); root.visible = false; mscene.add(root);
  const macro = new THREE.Group(); root.add(macro);
  const globe = new THREE.Group(); macro.add(globe);          // вращается вместе с планетой
  const cloudG = new THREE.Group(); macro.add(cloudG);
  const magG = new THREE.Group(); macro.add(magG); magG.rotation.z = .19;
  const desc = new THREE.Group(); root.add(desc);
  const ITEMS = [];
  function add(parent, o, f, opt){ parent.add(o); const it = Object.assign({ o, f, ms:[] }, opt || {}); o.traverse(q => { if (q.material) it.ms.push([q.material, q.material.opacity ?? 1]); }); ITEMS.push(it); return o; }
  const bw = (D, c, a = .85, b = .85) => smooth(c - a, c - a*.35, D)*(1 - smooth(c + b*.35, c + b, D));
  const warp = D => D - .8*Math.sin(TAU*D)/TAU;
  const GL = `
const vec3 SUN = vec3(-0.9186, 0.2297, 0.3215);
float landF(vec3 q){ return landT(q); }
float dryT(vec3 q);   // настоящие материки: поле суши из текстуры uLand (общая шапка шейдеров)
float landD(vec3 q){ float l = landF(q); float am = 0.16; vec3 r = q; for (int i = 0; i < 5; i++){ r = vec3(r.y*2.1 + 1.7, r.z*2.1 - 0.9, r.x*2.1 + 2.3); l += am*sin(r.x)*sin(r.y + 0.5*sin(r.z)); am *= 0.55; } return l; }
float h31(vec3 q){ return fract(sin(dot(q, vec3(12.9898, 78.233, 37.719)))*43758.5453); }
float vn(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0,0.0,0.0)), f.x), mix(h31(i + vec3(0.0,1.0,0.0)), h31(i + vec3(1.0,1.0,0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0,0.0,1.0)), h31(i + vec3(1.0,0.0,1.0)), f.x), mix(h31(i + vec3(0.0,1.0,1.0)), h31(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z); }
float fbm(vec3 x){ float v = 0.0; float am = 0.5; for (int i = 0; i < 5; i++){ v += am*vn(x); x = x*2.03 + vec3(1.7, 9.2, 3.1); am *= 0.5; } return v; }
float dryT(vec3 q){ vec3 n = normalize(q); float la = abs(asin(clamp(n.y, -1.0, 1.0)))*57.29578; return smoothstep(9.0, 17.0, la)*(1.0 - smoothstep(31.0, 40.0, la))*(0.45 + 0.55*fbm(n*5.0)); }   // пустыни субтропиков
float shadeK(vec3 nObj){ vec3 nw = normalize((modelMatrix*vec4(nObj, 0.0)).xyz); return smoothstep(-0.35, 0.3, dot(nw, SUN)); }
float fogK(vec3 q, float n0, float f0){ vec4 fv = modelViewMatrix*vec4(q, 1.0); float fz = -fv.z; return smoothstep(n0, n0 + 3.0, fz)*(1.0 - smoothstep(f0*0.55, f0, fz)); }
float nearK(vec3 q){ vec4 fv = modelViewMatrix*vec4(q, 1.0); return 1.0 - smoothstep(3.0, 40.0, -fv.z); }
`;
  const DE = `uniform float uShade; uniform float uRot; uniform float uK;\n` + GL;
  const UN = { uShade:{value:0}, uRot:{value:0} };
  function P(n, fill, chunk, size){ const o = pts(n, fill, chunk, size, DE); const u = o.material.uniforms; u.uShade = UN.uShade; u.uRot = UN.uRot; u.uK = {value:0}; return o; }
  const A = (arr, fill, chunk, size) => P(arr.length, (i, o) => { const v = arr[i]; o.p = [v[0], v[1], v[2]]; if (fill) fill(o, v, i); }, chunk, size);
  const RIMC = `vec3 nv = normalize(normalMatrix*aRnd); float rim = 1.0 - abs(nv.z);`;
  const FOG = `a *= fogK(p, 0.8, 74.0);`;
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
  const cross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
  const sc3 = (a, k) => [a[0]*k, a[1]*k, a[2]*k];
  const add3 = (a, b, k = 1) => [a[0] + b[0]*k, a[1] + b[1]*k, a[2] + b[2]*k];
  function slerp(a, b, t){ const d = Math.acos(clamp(a[0]*b[0] + a[1]*b[1] + a[2]*b[2], -1, 1)); if (d < 1e-5) return a.slice(); const s = Math.sin(d), k0 = Math.sin((1 - t)*d)/s, k1 = Math.sin(t*d)/s; return [a[0]*k0 + b[0]*k1, a[1]*k0 + b[1]*k1, a[2]*k0 + b[2]*k1]; }
  const angle = (a, b) => Math.acos(clamp(a[0]*b[0] + a[1]*b[1] + a[2]*b[2], -1, 1));
  // отрезки в набор точек: extra(t, dist) → доп. данные
  function seg(out, a, b, step, jit, tag){ const L = Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]); const n = Math.max(1, Math.round(L/step));
    for (let j = 0; j < n; j++){ const t = j/n; out.push([a[0] + (b[0]-a[0])*t + rn()*jit, a[1] + (b[1]-a[1])*t + rn()*jit, a[2] + (b[2]-a[2])*t + rn()*jit, t, tag]); } }
  const landJS = d => landAt(d);
  const hsh = (x, y) => { const s = Math.sin(x*127.1 + y*311.7)*43758.5453; return s - Math.floor(s); };
  const vn2 = (x, y) => { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f*f*(3 - 2*f), v = g*g*(3 - 2*g);
    return (hsh(i, j)*(1 - u) + hsh(i + 1, j)*u)*(1 - v) + (hsh(i, j + 1)*(1 - u) + hsh(i + 1, j + 1)*u)*v; };
  const fbm2 = (x, y) => { let s = 0, a = .5; for (let k = 0; k < 6; k++){ s += a*vn2(x, y); x = x*2.03 + 5.3; y = y*2.03 + 1.7; a *= .5; } return s; };
  function tangent(d){ const up = Math.abs(d[1]) < .9 ? [0, 1, 0] : [1, 0, 0]; const t1 = nrm(cross(up, d)); return [t1, cross(d, t1)]; }

  /* ===== МАКРО: планета и её поля ===== */
  // 0 · планета (тот же рисунок материков, что на кольце)
  add(globe, P(26000*Q, (i, o, n) => { const d = fib(i, n); o.p = sc3(d, RG); o.rnd = d; o.s = .8 + Math.random()*.3; },
    `vec3 q = aRnd*2.3; float land = landF(q); float Lm = step(0.18, land); float ice = iceT(q, land);
     vec3 ocean = mix(vec3(0.16,0.42,0.95), vec3(0.07,0.25,0.66), uK*smoothstep(0.18, -0.6, land));
     float dry = dryT(q);
     vec3 grn = mix(vec3(0.4,0.88,0.56), mix(vec3(0.3,0.7,0.36), vec3(0.88,0.72,0.42), dry), uK);
     col = mix(ocean, grn, Lm); col = mix(col, vec3(0.92,0.96,1.0), ice);
     a = mix(0.24, 1.0, max(Lm, ice))*(1.0 - 0.55*smoothstep(0.5, 1.0, uK));
     a *= mix(0.12, 1.0, smoothstep(-0.2, 0.3, normalize((modelViewMatrix*vec4(aRnd, 0.0)).xyz).z));   // обратная сторона не просвечивает
     s *= mix(0.9, 1.25, Lm);
     a *= mix(1.0, 0.16 + 0.84*shadeK(aRnd), uShade);`),
    D => 1 - smooth(6.12, 6.32, D), { macro:true, k:D => smooth(3.5, 5.6, D) });
  // лимб атмосферы
  add(macro, P(7000*Q, (i, o, n) => { const d = fib(i, n); o.p = sc3(d, RG*1.035); o.rnd = d; o.c = C(0x7fb6ff); o.s = .9; },
    `${RIMC} a = 0.55*rim*rim*rim; a *= mix(1.0, 0.3 + 0.7*shadeK(aRnd), uShade);`),
    D => 1 - smooth(6.1, 6.3, D), { macro:true });
  // детализированная шапка, обращённая к камере: фрактальный берег
  add(macro, P(36000*Q, (i, o) => { let d; do { d = dir(); } while (d[2] < .5); o.p = sc3(d, RG*1.002); o.rnd = d; o.s = .7 + Math.random()*.4; },
    `vec3 ug = aRnd; ug.xz = rot(-uRot)*ug.xz; vec3 q = ug*2.3; float land = landD(q);
     float Lm = smoothstep(0.16, 0.2, land); float ice = iceT(q, land);
     float dry = dryT(q);
     float relief = fbm(q*6.0);
     vec3 ocean = mix(vec3(0.12,0.4,0.9), vec3(0.05,0.2,0.6), smoothstep(0.16, -0.5, land));
     ocean = mix(ocean, vec3(0.35,0.85,0.95), smoothstep(0.05, 0.17, land)*(1.0 - Lm));
     vec3 grn = mix(vec3(0.25,0.62,0.3), vec3(0.9,0.74,0.44), dry)*(0.75 + 0.5*relief);
     col = mix(ocean, grn, Lm); col = mix(col, vec3(0.94,0.97,1.0), ice);
     a = mix(0.5, 1.0, max(Lm, ice))*(0.35 + 0.65*smoothstep(0.5, 0.75, aRnd.z));
     a *= mix(1.0, 0.14 + 0.86*shadeK(aRnd), uShade);`),
    D => smooth(4.6, 5.7, D)*(1 - smooth(6.1, 6.3, D)), { sz:() => 3.2 });

  // 0 · Гея: ореол и спираль Фибоначчи
  add(macro, P(5200*Q, (i, o) => { const d = dir(); const r = RG*(1.2 + Math.pow(Math.random(), 2.2)*.9); o.p = sc3(d, r); o.rnd = d; o.c = mixc(GOLD, CREAM, Math.random()*.6); o.s = .7 + Math.random()*.9; },
    `p *= 1.0 + 0.035*sin(uTime*0.45 + aSeed*6.2832); a = 0.3*(0.5 + 0.5*sin(uTime*0.8 + aSeed*40.0));`),
    D => 1 - smooth(.3, .9, D), { macro:true, g:2.4 });
  add(macro, P(4200*Q, (i, o, n) => { const r = RG*1.08 + RG*1.7*Math.sqrt(i/n), t = i*2.39996323; o.p = [Math.cos(t)*r, Math.sin(t)*r, -RG*.6]; o.rnd = [r, i/n, 0]; o.c = mixc(GOLD, CREAM, i/n*.5); o.s = .9 + (1 - i/n)*.6; },
    `p.xy = rot(uTime*0.025)*p.xy; float wv = 0.5 + 0.5*sin(uTime*1.1 - aRnd.x*0.45);
     a = (0.12 + 0.55*pow(wv, 3.0))*(1.0 - aRnd.y*0.6);`),
    D => 1 - smooth(.3, .9, D), { macro:true, g:2.4 });

  // 1 · гравитация: геоид, потоки к центру, эквипотенциали
  add(globe, P(9000*Q, (i, o, n) => { const d = fib(i, n);
      const g = .55*Math.sin(d[0]*3.1 + 1)*Math.cos(d[1]*2.7) + .35*Math.sin(d[2]*4.3 - d[0]*2.1) + .25*Math.cos(d[1]*5.3 + d[2]*3.3);
      o.p = sc3(d, RG*(1.05 + .08*g)); o.rnd = [d[0], d[1], d[2]];
      o.c = g > 0 ? mixc(C(0xffd27a), C(0xff5a4a), clamp(g, 0, 1)) : mixc(C(0x9fd8ff), C(0x3a5cff), clamp(-g, 0, 1)); o.s = .8; },
    `a = 0.42*(0.75 + 0.25*sin(uTime*0.9 + aSeed*20.0));`), D => bw(D, 1), { macro:true, g:2.4 });
  add(macro, P(2800*Q, (i, o) => { const d = dir(); o.p = d; o.rnd = d; o.c = C(0xc9b8ff); o.s = .9; },
    `float life = fract(aSeed + uTime*0.1); p = aRnd*mix(${(RG*3.4).toFixed(1)}, ${(RG*1.07).toFixed(2)}, pow(life, 0.7));
     a = 0.5*sin(life*3.1416);`), D => bw(D, 1, .85, .7), { macro:true, g:2.4 });
  add(macro, P(6*420, (i, o) => { const k = Math.floor(i/420), t = (i % 420)/420*TAU; o.p = [Math.cos(t), Math.sin(t), 0]; o.rnd = [k, t, 0]; o.c = C(0xb9a8ff); o.s = .8; },
    `float rr = ${(RG*1.2).toFixed(1)} + mod(aRnd.x*5.0 - uTime*1.1, 30.0);
     p = vec3(position.xy*rr, 0.0); a = 0.3*(1.0 - (rr - ${(RG*1.2).toFixed(1)})/30.0)*smoothstep(${(RG*1.2).toFixed(1)}, ${(RG*1.2 + 2).toFixed(1)}, rr);`),
    D => bw(D, 1), { macro:true, g:2.4 });

  // 2 · магнитосфера
  function magP(L, th, ph){
    const r = L*Math.sin(th)**2;
    let x = r*Math.sin(th)*Math.cos(ph), y = r*Math.cos(th), z = r*Math.sin(th)*Math.sin(ph);
    const rv = RG*(1 + (r - 1)*.28), k = rv/Math.max(r, 1e-3); x *= k; y *= k; z *= k;
    const xs = -x/rv;
    if (xs > 0){ const c = 1 - .3*xs*smooth(1.5, 6, L); x *= c; y *= 1 - .12*xs*smooth(1.5, 6, L); z *= c; }
    else { const st = -xs*smooth(2, 9, L); x *= 1 + 1.8*st; y *= 1 - .35*st; z *= 1 - .1*st; }
    return [x, y, z];
  }
  { const arr = [];
    [1.7, 2.3, 3.1, 4.2, 5.6, 7.4, 9.5].forEach((L, li) => { for (let q = 0; q < 12; q++){ const ph = q/12*TAU + li*.2, t0 = Math.asin(Math.sqrt(1/L)), n = Math.round(70*Q*(1 + L*.15));
      for (let j = 0; j <= n; j++){ const th = t0 + (Math.PI - 2*t0)*j/n, p = magP(L, th, ph); arr.push([p[0], p[1], p[2], j/n, L, ph]); } } });
    add(magG, A(arr, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = C(0x8fb0ff); o.s = .8; },
      `float fl = fract(aRnd.x*3.0 - uTime*0.12*(1.0 + 0.2*aRnd.y) + aRnd.z*0.3);
       a = (0.14 + 0.8*pow(fl, 8.0))*0.6; col = mix(vec3(0.42,0.56,1.0), vec3(0.75,0.95,1.0), fl);`), D => bw(D, 2), { macro:true, g:2.4 });
    // пояса Ван Аллена
    const belt = [];
    for (let i = 0; i < 9000*Q; i++){ const inner = i < 3000*Q, L = inner ? 1.3 + Math.random()*.6 : 3 + Math.random()*3; let th;
      do { th = Math.random()*Math.PI; } while (Math.abs(Math.PI/2 - th) > .6 || L*Math.sin(th)**2 < 1.05);
      const ph = Math.random()*TAU, p = magP(L, th, ph); belt.push([p[0], p[1], p[2], inner ? 1 : 0, ph]); }
    add(magG, A(belt, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = v[3] ? mixc(C(0xff8a4a), C(0xffc07a), Math.random()) : mixc(C(0x46c8ff), C(0x8a7dff), Math.random()); o.s = .7 + Math.random()*.6; },
      `a = 0.3*(0.6 + 0.4*sin(aRnd.y*6.0 - uTime*(aRnd.x > 0.5 ? 0.9 : -0.6)));`), D => bw(D, 2), { macro:true, g:2.4 });
    // солнечный ветер и ударная волна (Солнце слева)
    add(magG, P(3400*Q, (i, o) => { o.rnd = [Math.sqrt(Math.random())*34, Math.random()*TAU, Math.random()]; o.c = C(0xffcf80); o.s = .8; },
      `float xw = -80.0 + fract(aSeed + uTime*0.035*(0.8 + 0.4*aRnd.z))*160.0;
       float rr = sqrt(aRnd.x*aRnd.x + 30.0*max(0.0, xw + 34.0));
       p = vec3(xw, cos(aRnd.y)*rr, sin(aRnd.y)*rr);
       a = 0.3*smoothstep(-80.0, -62.0, xw)*(1.0 - smoothstep(40.0, 80.0, xw))*(0.6 + 0.9*smoothstep(-42.0, -32.0, xw)*(1.0 - smoothstep(-25.0, 5.0, xw)));`),
      D => bw(D, 2), { macro:true, g:2.4 });
    const shock = [];
    for (let i = 0; i < 2600*Q; i++){ const x = -34 + Math.pow(Math.random(), 1.6)*74, rr = Math.sqrt(30*(x + 34)), t = Math.random()*TAU; shock.push([x, Math.cos(t)*rr, Math.sin(t)*rr, x]); }
    for (let i = 0; i < 1600*Q; i++){ const x = -27 + Math.pow(Math.random(), 1.6)*67, rr = Math.sqrt(20*(x + 27)), t = Math.random()*TAU; shock.push([x, Math.cos(t)*rr, Math.sin(t)*rr, 99]); }
    add(magG, A(shock, (o, v) => { o.rnd = [v[3], 0, 0]; o.c = v[3] > 90 ? C(0x7aa8ff) : C(0xffe2b0); o.s = .8; },
      `a = aRnd.x > 90.0 ? 0.13 : 0.06 + 0.3*(1.0 - smoothstep(-34.0, 10.0, aRnd.x)); a *= 0.8 + 0.2*sin(uTime*1.3 + aSeed*30.0);`),
      D => bw(D, 2), { macro:true, g:2.4 });
    // полярные сияния
    const aur = [];
    for (let i = 0; i < 3600*Q; i++){ const north = i % 2, th = (north ? 0 : Math.PI) + (north ? 1 : -1)*(.32 + rn()*.035 + .02*Math.sin(i*.37)), ph = Math.random()*TAU, h = Math.random();
      const r = RG*(1.02 + h*.09); aur.push([r*Math.sin(th)*Math.cos(ph), r*Math.cos(th), r*Math.sin(th)*Math.sin(ph), h, ph]); }
    add(magG, A(aur, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = mixc(C(0x5dff9a), C(0xff4a7a), smooth(.45, 1, v[3])); o.s = .9; },
      `a = 0.75*(0.45 + 0.55*sin(uTime*1.7 + aRnd.y*9.0 + sin(uTime*0.6 + aRnd.y*4.0)))*(1.0 - aRnd.x*0.7);`),
      D => Math.max(bw(D, 2), .8*bw(D, 4)), { macro:true, g:2.4 });
  }
  // 3 · ноосфера: узлы, ветвящиеся дуги, огни ночной стороны, «оболочка мысли»
  { const nodes = [];
    for (let i = 0; i < 6000 && nodes.length < 110; i++){ const d = dir(); if (landJS(d) > .3 && Math.abs(d[1]*2.3) < 1.9) nodes.push(d); }
    const edges = new Set(), arcs = [];
    nodes.forEach((a, i) => { nodes.map((b, j) => [angle(a, b), j]).filter(q => q[1] !== i).sort((x, y) => x[0] - y[0]).slice(0, 2).forEach(([, j]) => edges.add(Math.min(i, j) + "_" + Math.max(i, j))); });
    for (let k = 0; k < 26; k++){ const i = Math.floor(Math.random()*nodes.length), j = Math.floor(Math.random()*nodes.length); if (i !== j && angle(nodes[i], nodes[j]) < 1.7) edges.add(Math.min(i, j) + "_" + Math.max(i, j)); }
    function arc(a, b, h0, h1, lift, lvl, seed){ const ang = angle(a, b), n = Math.max(6, Math.round(ang*RG/(.1/Math.sqrt(Q))));
      for (let j = 0; j <= n; j++){ const t = j/n, d = slerp(a, b, t), r = RG*(h0 + (h1 - h0)*t) + RG*lift*Math.sin(Math.PI*t); arcs.push([d[0]*r, d[1]*r, d[2]*r, t, seed, lvl]); } }
    function branch(from, fr, rad, lvl, seed){ if (lvl > 2) return;
      for (let q = 0; q < 2; q++){ const [t1, t2] = tangent(from); const an = Math.random()*TAU, dd = rad*(.5 + Math.random()*.5);
        const to = nrm(add3(from, add3(sc3(t1, Math.cos(an)*dd), t2, Math.sin(an)*dd)));
        const mid = slerp(from, to, .5);
        arc(from, to, fr, 1.008, .02*lvl, lvl, seed + q*.13);
        branch(mid, 1.008 + .01, rad*.5, lvl + 1, seed + q*.21); } }
    [...edges].forEach((e, k) => { const [i, j] = e.split("_").map(Number), ang = angle(nodes[i], nodes[j]);
      arc(nodes[i], nodes[j], 1.008, 1.008, .09*ang, 0, k*.37);
      branch(slerp(nodes[i], nodes[j], .5), 1.008 + .09*ang, .22, 1, k*.53); });
    add(globe, A(arcs, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = mixc(C(0xffc566), CREAM, v[5]*.3); o.s = v[5] ? .6 : .85; },
      `float pl = fract(aRnd.x*1.5 - uTime*0.25 + aRnd.y*7.0);
       a = (0.22 + 0.95*pow(pl, 10.0))*(1.0 - aRnd.z*0.3);
       col = mix(col, vec3(1.0,0.97,0.85), pow(pl, 10.0));`), D => bw(D, 3, .85, 1.0), { macro:true, g:2.4 });
    const lights = [];
    nodes.forEach(d => { const [t1, t2] = tangent(d); for (let q = 0; q < 70*Q; q++){ const g1 = gauss()*.035, g2 = gauss()*.035; lights.push(nrm(add3(d, add3(sc3(t1, g1), t2, g2)))); } });
    add(globe, A(lights.map(d => sc3(d, RG*1.004)), (o, v, i) => { o.rnd = lights[i]; o.c = mixc(C(0xffd27a), C(0xffffff), Math.random()*.4); o.s = .7; },
      `float nt = 1.0 - shadeK(aRnd); a = (0.12 + 0.9*nt)*(0.8 + 0.2*sin(uTime*3.0 + aSeed*60.0));`),
      D => Math.max(bw(D, 3, .85, 1.0), .45*smooth(3, 4, D)*(1 - smooth(6.1, 6.4, D))), { macro:true, g:2.4 });
    add(globe, A(nodes.flatMap(d => Array.from({length:14}, () => sc3(nrm(add3(d, dir(), .01)), RG*1.01))), o => { o.c = C(0xfff0c8); o.s = 1.2; },
      `a = 0.6 + 0.4*sin(uTime*1.4 + aSeed*20.0);`), D => bw(D, 3), { macro:true, g:2.4 });
    add(macro, P(5200*Q, (i, o, n) => { const d = fib(i, n); o.p = sc3(d, RG*1.24); o.rnd = d; o.c = mixc(GOLD, CREAM, .4); o.s = .8; },
      `${RIMC} a = (0.05 + 0.3*pow(0.5 + 0.5*sin(uTime*0.7 + dot(aRnd, vec3(5.0, 3.0, 4.0))*2.0), 6.0))*(0.4 + 0.6*rim);`),
      D => bw(D, 3), { macro:true, g:2.4 });
  }

  // 4 · ионосфера: стоячие волны резонатора, молнии, спрайты, токи ясной погоды
  add(macro, P(9000*Q, (i, o, n) => { const d = fib(i, n); o.p = sc3(d, RG*1.16); o.rnd = d; o.s = .85; },
    `vec3 u = aRnd; float m = mod(uTime*0.18, 3.0);
     float y1 = u.y; float y2 = 1.5*u.y*u.y - 0.5; float y3 = 2.0*u.x*(1.0 - u.y*u.y);
     float Y = y1*(1.0 - smoothstep(0.7, 1.0, m)) + y2*smoothstep(0.7, 1.0, m)*(1.0 - smoothstep(1.7, 2.0, m)) + y3*smoothstep(1.7, 2.0, m)*(1.0 - smoothstep(2.7, 3.0, m)) + y1*smoothstep(2.7, 3.0, m);
     float w = abs(Y*sin(uTime*2.4));
     ${RIMC} a = (0.05 + 0.55*w)*(0.3 + 0.7*rim);
     col = mix(vec3(0.3,0.9,0.85), vec3(0.7,0.5,1.0), w);`), D => bw(D, 4), { macro:true, g:2.4 });
  { const bolts = [], clouds = [], sprites = [];
    function bolt(a, b, depth, id, main){
      if (depth === 0){ seg(bolts, a, b, .03, 0, id); return; }
      const m = lerp3(a, b, .5), L = Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]); const off = dir();
      const mm = add3(m, off, L*.22);
      bolt(a, mm, depth - 1, id, main); bolt(mm, b, depth - 1, id, main);
      if (main && Math.random() < .45){ const dd = sc3(nrm(add3(sub(b, a), dir(), .9)), L*.45); bolt(mm, add3(mm, dd), depth - 2 > 0 ? depth - 2 : 0, id, false); }
    }
    const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
    for (let k = 0; k < 16; k++){
      let d; do { d = dir(); } while (Math.abs(d[1]) > .5);
      const top = sc3(d, RG*1.075), bot = sc3(d, RG*1.003);
      bolt(top, bot, 5, k, true);
      for (let q = 0; q < 90*Q; q++){ const g = [gauss(), gauss(), gauss()]; clouds.push([top[0] + g[0]*.35, top[1] + g[1]*.2, top[2] + g[2]*.35, k]); }
      if (k % 3 === 0){ const [t1, t2] = tangent(d); for (let q = 0; q < 160*Q; q++){ const h = Math.random(), sp = h*.35; const p = add3(add3(sc3(d, RG*(1.1 + h*.06)), t1, rn()*sp), t2, rn()*sp*.4); sprites.push([p[0], p[1], p[2], k, h]); } }
    }
    const FL = `float ph = uTime*(0.55 + fract(aRnd.y*7.31)*0.6) + aRnd.y*6.2832;
      float fl = pow(max(0.0, sin(ph)), 60.0) + 0.6*pow(max(0.0, sin(ph - 0.22)), 90.0);`;
    add(globe, A(bolts, (o, v) => { o.rnd = [v[3], v[4]/16, 0]; o.c = C(0xdcd8ff); o.s = .8; }, `${FL} a = 1.8*fl;`), D => bw(D, 4), { macro:true, g:2.4 });
    add(globe, A(clouds, (o, v) => { o.rnd = [0, v[3]/16, 0]; o.c = C(0x9a94c8); o.s = 1.1; }, `${FL} a = 0.1 + 0.9*fl;`), D => bw(D, 4), { macro:true, g:2.4 });
    add(globe, A(sprites, (o, v) => { o.rnd = [v[4], v[3]/16, 0]; o.c = mixc(C(0xff3a4a), C(0xff9a7a), v[4]); o.s = .8; },
      `float ph = uTime*(0.55 + fract(aRnd.y*7.31)*0.6) + aRnd.y*6.2832 - 0.45; float fl = pow(max(0.0, sin(ph)), 40.0); a = 1.4*fl;`), D => bw(D, 4), { macro:true, g:2.4 });
    add(macro, P(2400*Q, (i, o) => { const d = dir(); o.rnd = d; o.c = C(0x86a8ff); o.s = .7; },
      `float life = fract(aSeed + uTime*0.07); p = aRnd*mix(${(RG*1.15).toFixed(2)}, ${(RG*1.01).toFixed(2)}, life); a = 0.22*sin(life*3.1416);`),
      D => bw(D, 4), { macro:true, g:2.4 });
  }

  // 5 · сетка Земли: икосаэдр, додекаэдр, рекурсивное деление; «драконьи вены»
  { const PHI = (1 + Math.sqrt(5))/2, IV = [];
    [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI]].forEach(([a, b, c]) => { IV.push([a, b, c], [b, c, a], [c, a, b]); });
    const V = IV.map(nrm), F = [];
    const dl = (a, b) => Math.hypot(IV[a][0]-IV[b][0], IV[a][1]-IV[b][1], IV[a][2]-IV[b][2]);
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) if (Math.abs(dl(i, j) - 2) < .01 && Math.abs(dl(j, k) - 2) < .01 && Math.abs(dl(i, k) - 2) < .01) F.push([i, j, k]);
    const out = [], seen = new Set();
    const key = (a, b) => { const r = v => v.map(x => x.toFixed(3)).join(","); const s1 = r(a), s2 = r(b); return s1 < s2 ? s1 + "|" + s2 : s2 + "|" + s1; };
    function edge(a, b, lvl, seed){ const k = key(a, b); if (seen.has(k)) return; seen.add(k); const ang = angle(a, b), n = Math.max(3, Math.round(ang*RG/(.09/Math.sqrt(Q))));
      for (let j = 0; j <= n; j++){ const d = slerp(a, b, j/n); out.push([d[0]*RG*1.012, d[1]*RG*1.012, d[2]*RG*1.012, lvl, j/n, seed]); } }
    F.forEach(f => { const [A0, B0, C0] = f.map(i => IV[i]);
      [8, 4, 2, 1].forEach(nn => { const lvl = nn === 1 ? 0 : Math.log2(nn);
        const G = (i, j) => nrm(add3(add3(A0, sub3(B0, A0), i/nn), sub3(C0, A0), j/nn));
        for (let i = 0; i < nn; i++) for (let j = 0; j < nn - i; j++){ edge(G(i, j), G(i + 1, j), lvl, Math.random()); edge(G(i, j), G(i, j + 1), lvl, Math.random()); edge(G(i + 1, j), G(i, j + 1), lvl, Math.random()); } }); });
    function sub3(a, b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
    const FC = F.map(f => nrm(add3(add3(V[f[0]], V[f[1]]), V[f[2]])));
    F.forEach((f, i) => F.forEach((g, j) => { if (j > i && f.filter(x => g.includes(x)).length === 2) edge(FC[i], FC[j], .5, Math.random()); }));
    const LC = [C(0xffd27a), C(0x9ff0e0), C(0xf6ebcf), C(0xd6ac5e), C(0xb49cff)];
    add(globe, A(out, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = v[3] === .5 ? LC[1] : LC[Math.min(4, 2 + Math.round(v[3]) - (v[3] ? 1 : 2))]; o.s = v[3] < 1 ? 1.0 : .75 - v[3]*.08; },
      `float on = smoothstep(aRnd.x - 0.3, aRnd.x + 0.5, uK);
       float pulse = 0.55 + 0.45*sin(uTime*1.6 - aRnd.y*6.2832 + aRnd.z*20.0);
       a = on*pulse*(aRnd.x < 1.0 ? 0.95 : 0.8 - aRnd.x*0.16);`), D => bw(D, 5), { macro:true, k:D => 3.6*smooth(4.35, 5.02, D) });
    const nodes = [];
    V.forEach(d => { for (let q = 0; q < 30; q++) nodes.push([...sc3(nrm(add3(d, dir(), .012)), RG*1.015), 0]); });
    FC.forEach(d => { for (let q = 0; q < 16; q++) nodes.push([...sc3(nrm(add3(d, dir(), .01)), RG*1.015), 1]); });
    add(globe, A(nodes, (o, v) => { o.c = v[3] ? LC[1] : C(0xfff3d0); o.s = v[3] ? 1 : 1.4; }, `a = 0.7 + 0.3*sin(uTime*1.2 + aSeed*10.0);`), D => bw(D, 5), { macro:true, g:2.4 });
    const veins = [];
    for (let k = 0; k < 18; k++){ let d = dir(); const n = 170;
      for (let s = 0; s < n; s++){
        const v = [Math.sin(3*d[1] + 1.3) + Math.cos(2*d[2] + k), Math.sin(3*d[2]) + Math.cos(2*d[0] + .7), Math.sin(3*d[0] + k*.5) + Math.cos(2*d[1])];
        const dn = v[0]*d[0] + v[1]*d[1] + v[2]*d[2];
        const tv = nrm([v[0] - dn*d[0], v[1] - dn*d[1], v[2] - dn*d[2]]);
        for (let q = 0; q < 3; q++) veins.push([...sc3(nrm(add3(d, dir(), .004)), RG*1.008), s/n, k]);
        d = nrm(add3(d, tv, .012));
      } }
    add(globe, A(veins, (o, v) => { o.rnd = [v[3], v[4]/18, 0]; o.c = C(0x5dffb0); o.s = .8; },
      `float fl = fract(aRnd.x*2.5 - uTime*0.16 + aRnd.y*5.0); a = 0.12 + 0.85*pow(fl, 6.0);`), D => bw(D, 5), { macro:true, g:2.4 });
  }

  // 6 · атмосфера: слои, облака, циклоны-спирали
  [[1.025, 0xcfe6ff, .45], [1.055, 0xffb870, .35], [1.095, 0x7c9bff, .3], [1.15, 0xa78bff, .28]].forEach(([k, c, al]) =>
    add(macro, P(6500*Q, (i, o, n) => { const d = fib(i, n); o.p = sc3(d, RG*k); o.rnd = d; o.c = C(c); o.s = .8; },
      `${RIMC} a = ${al.toFixed(2)}*pow(rim, 2.5)*(0.3 + 0.7*shadeK(aRnd));`), D => bw(D, 6, .85, .45), { macro:true, g:2.4 }));
  add(cloudG, P(30000*Q, (i, o, n) => { const d = fib(i, n); o.p = sc3(d, RG*(1.016 + Math.random()*.008)); o.rnd = d; o.c = C(0xf2f6ff); o.s = .9 + Math.random()*.4; },
    `vec3 q = aRnd*3.2 + vec3(uTime*0.012, 0.0, 0.0);
     float cl = fbm(q) + 0.1*sin(aRnd.y*9.0);
     float band = 0.75 + 0.25*cos(aRnd.y*7.5);
     a = smoothstep(0.5, 0.7, cl*band + 0.08)*0.7;
     a *= mix(1.0, 0.08 + 0.92*shadeK(aRnd), uShade);`), D => smooth(4.7, 5.5, D)*(1 - smooth(6.3, 6.5, D)), { macro:true, g:.75 });
  { const cy = [];
    [[.35, .6], [-.3, 2.4], [.28, 4.3]].forEach(([lat, lon], ci) => {
      const d = [Math.cos(lat)*Math.cos(lon), Math.sin(lat), Math.cos(lat)*Math.sin(lon)], [t1, t2] = tangent(d), b = .256, sgn = lat > 0 ? 1 : -1;
      for (let arm = 0; arm < 3; arm++) for (let q = 0; q < 900*Q; q++){ const th = Math.random()*4*Math.PI, r = .012*Math.exp(b*th), an = sgn*th + arm*TAU/3, w = r*.25;
        const u = Math.cos(an)*r + rn()*w, v = Math.sin(an)*r + rn()*w;
        cy.push([...sc3(nrm(add3(add3(d, t1, u), t2, v)), RG*1.022), th, ci]); }
      for (let q = 0; q < 200*Q; q++){ const r = .012*Math.random(), an = Math.random()*TAU; cy.push([...sc3(nrm(add3(add3(d, t1, Math.cos(an)*r*2), t2, Math.sin(an)*r*2)), RG*1.022), 0, ci]); }
    });
    add(cloudG, A(cy, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = C(0xffffff); o.s = .9; },
      `a = 0.6*(0.55 + 0.45*sin(aRnd.x*3.0 + uTime*1.4))*(0.3 + 0.7*smoothstep(0.0, 1.5, aRnd.x)); a *= mix(1.0, 0.1 + 0.9*shadeK(normalize(position)), uShade);`),
      D => smooth(4.7, 5.5, D)*(1 - smooth(6.3, 6.5, D)), { macro:true, g:.75 });
  }
  /* ===== СПУСК: слои 6–15 пролетаются по оси −z ===== */
  const LAY = [];
  for (let L = 6; L <= 15; L++){ const g = new THREE.Group(); desc.add(g); LAY[L] = g; }
  const lf = L => { const f = D => smooth(L - 1.1, L - .6, D)*(1 - smooth(L + .55, L + .9, D)); f.amb = true; return f; };      // объём слоя
  const sf = L => D => smooth(L - .95, L - .45, D)*(1 - smooth(L + .12, L + .32, D));    // витрина слоя
  const amb = (n, ex, fill, chunk, size) => P(n, (i, o) => { o.p = [rn()*ex[0], rn()*ex[1], rn()*30]; if (fill) fill(o, i); }, chunk + FOG, size);
  function sheet(L, c1, c2, chunk, n){
    return add(LAY[L], P((n || 9000)*Q, (i, o) => { const r = 48*Math.sqrt(Math.random()), t = Math.random()*TAU; o.p = [Math.cos(t)*r, Math.sin(t)*r*.7, 30 + rn()*.3]; o.c = mixc(C(c1), C(c2), Math.random()); o.s = .9 + Math.random()*.5; },
      chunk + ` a *= 0.45 + 1.8*nearK(p); a *= fogK(p, 0.6, 80.0);`), D => smooth(L - 1.05, L - .75, D)*(1 - smooth(L - .5, L - .38, D)));
  }
  const SHOW = (L, z) => { const g = new THREE.Group(); g.position.z = z ?? -14; LAY[L].add(g); return g; };

  // 6→7 · облака и поверхность океана
  { const puffs = [];
    for (let k = 0; k < 70; k++){ const c = [rn()*34, rn()*18, rn()*28], r = 2 + Math.random()*5;
      for (let q = 0; q < 110*Q; q++){ const g = [gauss(), gauss()*.6, gauss()]; puffs.push([c[0] + g[0]*r, c[1] + g[1]*r, c[2] + g[2]*r]); } }
    add(LAY[6], A(puffs, o => { o.c = mixc(C(0xffffff), C(0xcfe0ff), Math.random()); o.s = 1.6 + Math.random()*1.4; },
      `a = 0.28*(0.8 + 0.2*sin(uTime*0.6 + aSeed*20.0)); ${FOG}`), D => smooth(6.04, 6.2, D)*(1 - smooth(6.44, 6.56, D)), { sz:() => 2.4, g:1.6 });
  }
  sheet(7, 0x4fb8ff, 0xd8f6ff,
    `p.z += 0.6*sin(position.x*0.35 + uTime*1.1)*sin(position.y*0.3 + uTime*0.8);
     float cst = pow(max(0.0, sin(position.x*0.9 + position.y*0.4 + uTime*1.5)*sin(position.y*0.8 - uTime)), 3.0);
     a = 0.22 + 0.9*cst; col = mix(col, vec3(0.95,1.0,1.0), cst);`, 12000);

  // 7 · океан: лучи, планктон, морской снег, биолюминесценция, наутилус
  { const g = LAY[7], rays = [];
    for (let k = 0; k < 48; k++){ const x = rn()*28, y = rn()*17, dx = rn()*.12, dy = rn()*.12 - .05, n = Math.round(200*Q);
      for (let j = 0; j < n; j++){ const t = j/n; rays.push([x + dx*t*60 + rn()*.15, y + dy*t*60 + rn()*.15, 30 - 60*t, k]); } }
    add(g, A(rays, (o, v) => { o.rnd = [v[3]/48, 0, 0]; o.c = C(0x8fe4ff); o.s = 1.1; },
      `float dz = (30.0 - position.z)/60.0; a = 0.5*(1.0 - dz*0.8)*(0.55 + 0.45*sin(uTime*0.9 + aRnd.x*60.0 + position.z*0.15)); ${FOG}`), lf(7));
    add(g, amb(5000*Q, [34, 20], o => { o.c = mixc(C(0x6dffc8), C(0x4ad0ff), Math.random()); o.s = .5 + Math.random()*.5; },
      `p += 0.35*vec3(sin(uTime*0.3 + aSeed*40.0), cos(uTime*0.25 + aSeed*30.0), 0.0); a = 0.42;`), lf(7));
    add(g, amb(3000*Q, [34, 20], o => { o.c = C(0xf0f4ff); o.s = .45; },
      `p.z = 30.0 - mod(30.0 - position.z + uTime*0.9, 60.0); p.x += sin(uTime*0.4 + aSeed*30.0)*0.3; a = 0.32;`), lf(7));
    add(g, amb(1600*Q, [32, 18], o => { o.p[2] = -Math.random()*30; o.c = mixc(C(0x3a7dff), C(0x5dffe0), Math.random()); o.s = .9; },
      `float fl = pow(max(0.0, sin(uTime*(0.6 + aRnd.y*0.4) + aSeed*50.0)), 24.0); a = 0.08 + 1.3*fl;`), lf(7));
    // наутилус — золотая спираль
    const nt = SHOW(7), sh = [], b = Math.log(PHI_)/(Math.PI/2), r0 = .028, TH = 5.4*Math.PI, R = th => r0*Math.exp(b*th);
    for (let th = 0; th < TH; ){ const r = R(th); const n = 2 + Math.round(r*1.2);
      for (let q = 0; q < n*Q + 1; q++){ const rr = r*(1 + rn()*.012); sh.push([Math.cos(th)*rr, Math.sin(th)*rr, rn()*.22*r, th, 0]); }
      th += .035/Math.max(.2, r); }
    for (let th = 2*Math.PI + .3; th < TH - .2; th += 2*Math.PI/13){ const ro = R(th), ri = R(th - 2*Math.PI);
      for (let q = 0; q < 26*Q*ro; q++){ const u = Math.random(), rr = ri + (ro - ri)*u, bend = Math.sin(u*Math.PI)*.18; sh.push([Math.cos(th - bend)*rr, Math.sin(th - bend)*rr, rn()*.15*ro, th, 1]); } }
    for (let q = 0; q < 2600*Q; q++){ const th = 2*Math.PI + Math.random()*(TH - 2*Math.PI), ro = R(th), ri = R(th - 2*Math.PI), rr = ri + (ro - ri)*Math.random(); sh.push([Math.cos(th)*rr, Math.sin(th)*rr, rn()*.25*rr, th, 2]); }
    for (let q = 0; q < 160; q++){ const th = TH - .02, a0 = Math.random(), r = R(th - 2*Math.PI) + (R(th) - R(th - 2*Math.PI))*a0; sh.push([Math.cos(th)*r, Math.sin(th)*r, rn()*.5, th, 3]); }
    const stripe = th => .5 + .5*Math.sin(th*6);
    const naut = A(sh, (o, v) => { o.rnd = [v[3], v[4], 0];
      o.c = v[4] === 1 ? C(0xffe6f2) : v[4] === 2 ? C(0xbfd8ff) : v[4] === 3 ? C(0xfff4d6) : (v[3] > TH - 2*Math.PI - 1 && stripe(v[3]) > .6 ? C(0xe0864a) : mixc(C(0xf6ebcf), C(0xd6ac5e), Math.random()*.6));
      o.s = v[4] === 2 ? .7 : 1.05; },
      `float wv = pow(0.5 + 0.5*sin(aRnd.x*1.2 - uTime*1.2), 4.0);
       a = (aRnd.y > 1.5 && aRnd.y < 2.5 ? 0.12 : 0.6) + 0.5*wv; if (aRnd.y > 2.5) a = 0.9;`);
    naut.scale.setScalar(.95); nt.add(naut); nt.rotation.x = -.35;
    add(nt, naut, sf(7));
    nt.userData.spin = .05;
    naut.position.set(-1.2, .6, 0);
  }

  // 7→8 · полночная зона
  sheet(8, 0x0f2a6a, 0x5da8ff, `a = 0.12 + 0.5*pow(max(0.0, sin(uTime*(0.4 + aSeed) + aSeed*80.0)), 20.0);`, 7000);
  // 8 · дно: рельеф, рифт, «чёрный курильщик», трубчатые черви, коралл
  { const g = LAY[8], fl = [], H = (x, z) => -7.5 + 3.2*fbm2(x*.11 + 3, z*.11) - 2.3*Math.exp(-((x - 3)**2)/3) + 1.5*Math.exp(-((x - 3)**2)/45);
    for (let i = 0; i < 18000*Q; i++){ const x = rn()*36, z = 14 - Math.random()*62, y = H(x, z), crack = Math.abs(x - 3 + .6*Math.sin(z*.3)) < .45 && fbm2(x*.8, z*.8) > .45 ? 1 : 0;
      fl.push([x, y, z, crack, (y + 9)/6]); }
    add(g, A(fl, (o, v) => { o.rnd = [v[3], clamp(v[4], 0, 1), 0]; o.c = v[3] ? C(0xff6a1a) : mixc(C(0x28406e), C(0x8aa0c0), clamp(v[4], 0, 1)); o.s = v[3] ? 1.2 : .9; },
      `a = aRnd.x > 0.5 ? 0.55 + 0.45*sin(uTime*2.0 + position.z*0.7) : 0.18 + 0.3*aRnd.y; ${FOG}`), lf(8));
    const sm = SHOW(8, 0); const bx = .5, bz = -17, by = H(bx, bz), top = by + 6.5, ch = [];
    for (let i = 0; i < 2800*Q; i++){ const h = Math.random(), r = (1.1 - .55*h)*(1 + .25*fbm2(h*8, i*.01)), t = Math.random()*TAU; ch.push([bx + Math.cos(t)*r, by + h*6.5, bz + Math.sin(t)*r, h]); }
    add(sm, A(ch, (o, v) => { o.rnd = [v[3], 0, 0]; o.c = mixc(C(0x4a3a36), C(0xff8a3a), smooth(.85, 1, v[3])); o.s = .9; }, `a = 0.35 + 0.5*smoothstep(0.85, 1.0, aRnd.x); ${FOG}`), sf(8));
    add(sm, P(4200*Q, (i, o) => { o.p = [bx, top, bz]; o.rnd = [Math.random()*TAU, Math.random(), Math.random()]; o.s = 1.3 + Math.random(); },
      `float life = fract(aSeed + uTime*0.1);
       float an = aRnd.x + life*5.0 + uTime*0.3;
       float rr = (0.3 + life*3.8)*aRnd.y;
       p = position + vec3(cos(an)*rr + sin(life*9.0 + aSeed*30.0)*life*1.2, life*16.0, sin(an)*rr);
       col = mix(vec3(1.0, 0.75, 0.4), vec3(0.28, 0.3, 0.42), smoothstep(0.0, 0.25, life));
       a = (1.0 - life)*0.55; ${FOG}`), sf(8));
    const worms = [];
    for (let k = 0; k < 26; k++){ const t = Math.random()*TAU, rr = 1.6 + Math.random()*2, x = bx + Math.cos(t)*rr, z = bz + Math.sin(t)*rr, y0 = H(x, z), h = 1 + Math.random()*1.4;
      for (let q = 0; q < 26; q++) worms.push([x + rn()*.04, y0 + h*q/26, z + rn()*.04, 0, k]);
      for (let q = 0; q < 14; q++) worms.push([x + rn()*.14, y0 + h + Math.random()*.25, z + rn()*.14, 1, k]); }
    add(sm, A(worms, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = v[3] ? C(0xff3350) : C(0xf2eee6); o.s = v[3] ? 1.1 : .7; },
      `p.x += sin(uTime*1.2 + aRnd.y)*0.05*(position.y + 9.0)*0.2; a = aRnd.x > 0.5 ? 0.85 : 0.45; ${FOG}`), sf(8));
    const cor = [], cx0 = 6.5, cz0 = -12, cy0 = H(cx0, cz0);
    (function br(p0, d, len, dep){ const p1 = add3(p0, d, len); seg(cor, p0, p1, .05, .02, dep);
      if (dep >= 6){ for (let q = 0; q < 6; q++) cor.push([p1[0] + rn()*.08, p1[1] + rn()*.08, p1[2] + rn()*.08, 1, 9]); return; }
      const nb = 2 + (Math.random() < .35 ? 1 : 0);
      for (let q = 0; q < nb; q++){ const nd = nrm(add3(d, dir(), .65)); nd[1] = Math.abs(nd[1]) + .2; br(p1, nrm(nd), len*.74, dep + 1); } })([cx0, cy0, cz0], [0, 1, 0], 2.1, 0);
    add(sm, A(cor, (o, v) => { o.rnd = [v[4] === 9 ? 1 : 0, (v[1] - cy0)/6, 0]; o.c = v[4] === 9 ? C(0xffb0e0) : mixc(C(0xff7a5a), C(0xffc07a), v[4]/6); o.s = v[4] === 9 ? 1.2 : .7; },
      `p.x += sin(uTime*0.6 + position.y)*0.08*aRnd.y; a = aRnd.x > 0.5 ? 0.6 + 0.4*sin(uTime*2.0 + aSeed*30.0) : 0.5; ${FOG}`), sf(8));
    add(g, amb(2200*Q, [34, 16], o => { o.c = mixc(C(0x3a6aff), C(0xffe08a), Math.random()*.3); o.s = .5; }, `p.y += sin(uTime*0.2 + aSeed*30.0)*0.4; a = 0.25;`), lf(8));
  }

  // 8→9 · под дном
  sheet(9, 0x6a4a2e, 0xc79a60, `float bd = 0.5 + 0.5*sin(position.y*1.6 + 0.8*sin(position.x*0.3)); a = 0.12 + 0.3*bd;`);
  // 9 · кора: пласты, кварцевая друза, золотые жилы, микробы глубинной биосферы
  { const g = LAY[9];
    [[16, 0xb5874a, 0xe0b878], [6, 0x3a3a44, 0x6c6c7a], [-24, 0x2e4a3a, 0x5c7a64]].forEach(([z, c1, c2]) =>
      add(g, P(4000*Q, (i, o) => { const r = 46*Math.sqrt(Math.random()), t = Math.random()*TAU; o.p = [Math.cos(t)*r, Math.sin(t)*r*.7, z + rn()*.6]; o.c = mixc(C(c1), C(c2), Math.random()); o.s = 1; },
        `a = (0.12 + 0.12*sin(position.y*1.5 + position.x*0.2))*(0.5 + 1.6*nearK(p)); ${FOG}`), lf(9)));
    const qz = SHOW(9), qa = [];
    for (let k = 0; k < 12; k++){
      const ax = nrm([rn()*.7, 1, .45 + rn()*.4]), [t1, t2] = tangent(ax), len = 2.4 + Math.random()*3.4, rad = .3 + Math.random()*.38, base = [rn()*1.4, -2.6 + rn()*.4, rn()*.8];
      const am = k % 4 === 0 ? 1 : 0;
      const hex = (h, rr) => Array.from({length:6}, (_, j) => add3(add3(add3(base, ax, h), t1, Math.cos(j*Math.PI/3)*rr), t2, Math.sin(j*Math.PI/3)*rr));
      const B = hex(0, rad), T = hex(len, rad), tip = add3(base, ax, len + rad*1.3);
      for (let j = 0; j < 6; j++){ seg(qa, B[j], T[j], .04, 0, am); seg(qa, T[j], T[(j + 1) % 6], .04, 0, am); seg(qa, T[j], tip, .04, 0, am); seg(qa, B[j], B[(j + 1) % 6], .05, 0, am); }
      for (let q = 0; q < 240*Q; q++){ const j = Math.floor(Math.random()*6), h = Math.random()*len, u = Math.random(); qa.push([...lerp3(add3(B[j], ax, h), add3(B[(j + 1) % 6], ax, h), u), 2, am]); }
    }
    add(qz, A(qa, (o, v) => { o.rnd = [v[3] === 2 ? 1 : 0, v[4], 0]; o.c = v[4] ? mixc(C(0xb07aff), C(0xe8d0ff), Math.random()*.4) : mixc(C(0xe8f0ff), C(0xfff6e8), Math.random()); o.s = v[3] === 2 ? .7 : 1; },
      `float sp = pow(max(0.0, sin(uTime*2.2 + aSeed*90.0)), 30.0);
       a = (aRnd.x > 0.5 ? 0.14 : 0.7)*(0.75 + 0.25*sin(uTime*1.5 + position.y*2.0)) + 1.2*sp; ${FOG}`), sf(9));
    qz.userData.spin = .08;
    const vein = [];
    (function crack(n){ for (let k = 0; k < n; k++){ const go = (p, d, len, dep) => { let q = p.slice(); const steps = Math.round(len/.3);
        for (let s = 0; s < steps; s++){ const nq = add3(q, nrm(add3(d, dir(), .5)), .3); seg(vein, q, nq, .05, .03, dep); q = nq;
          if (dep < 3 && Math.random() < .12) go(q, nrm(add3(d, dir(), 1.2)), len*.45, dep + 1); } };
        go([rn()*30, rn()*16, rn()*28], dir(), 9 + Math.random()*8, 0); } })(22);
    add(g, A(vein, (o, v) => { o.rnd = [v[4], 0, 0]; o.c = mixc(C(0xffd070), C(0xfff0b0), Math.random()*.4); o.s = 1 - v[4]*.15; },
      `a = (0.5 - aRnd.x*0.08)*(0.6 + 0.4*sin(uTime*1.3 + aSeed*20.0)); ${FOG}`), lf(9));
    add(g, A(vein.filter((_, i) => i % 4 === 0).map(v => [v[0] + rn()*.4, v[1] + rn()*.4, v[2] + rn()*.4]), o => { o.c = C(0x6dffb8); o.s = .5; },
      `a = 0.2 + 0.6*pow(max(0.0, sin(uTime*1.7 + aSeed*70.0)), 8.0); ${FOG}`), lf(9));
    add(g, amb(6500*Q, [36, 20], o => { o.c = mixc(C(0x7a5a40), C(0xb08a68), Math.random()); o.s = .6 + Math.random()*.5; }, `a = 0.2;`), lf(9));
  }

  // 9→10 · Мохо
  sheet(10, 0xff7a3a, 0xffc07a, `a = 0.16 + 0.55*pow(0.5 + 0.5*sin(length(position.xy)*0.6 - uTime*1.2), 6.0);`);
  // 10 · верхняя мантия: оливин, конвекционные валы, расплав
  { const g = LAY[10];
    const ol = SHOW(10), oa = [], sx = .95, sy = .6, Lh = 2.4, oc = [[sx, sy*.45], [sx*.55, sy], [-sx*.55, sy], [-sx, sy*.45], [-sx, -sy*.45], [-sx*.55, -sy], [sx*.55, -sy], [sx, -sy*.45]];
    const ring = (z, k) => oc.map(([x, y]) => [x*k, y*k, z]);
    const R0 = ring(-Lh, 1), R1 = ring(Lh, 1), E0 = ring(-Lh - .9, .35), E1 = ring(Lh + .9, .35);
    for (let j = 0; j < 8; j++){ const j2 = (j + 1) % 8; [[R0[j], R1[j]], [R0[j], R0[j2]], [R1[j], R1[j2]], [R0[j], E0[j]], [R1[j], E1[j]], [E0[j], E0[j2]], [E1[j], E1[j2]]].forEach(([a, b]) => seg(oa, a, b, .035, 0, 0));
      for (let q = 0; q < 160*Q; q++) oa.push([...lerp3(lerp3(R0[j], R1[j], Math.random()), lerp3(R0[j2], R1[j2], Math.random()), Math.random()), 0, 1]); }
    const olv = A(oa, (o, v) => { o.rnd = [v[4], 0, 0]; o.c = mixc(C(0x9dff5a), C(0xe0ff9a), Math.random()*.5); o.s = v[4] ? .7 : 1; },
      `a = (aRnd.x > 0.5 ? 0.16 : 0.75)*(0.7 + 0.3*sin(uTime*1.3 + position.z*1.5)) + pow(max(0.0, sin(uTime*2.0 + aSeed*80.0)), 30.0); ${FOG}`);
    olv.rotation.set(.5, .6, .2); ol.add(olv); add(ol, olv, sf(10)); ol.userData.spin = .07;
    add(g, P(14000*Q, (i, o) => { const k = i % 3; o.p = [-17 + k*16, 0, -12 + rn()*7]; o.rnd = [Math.random()*TAU, [2.2, 4, 5.8, 7.4][Math.floor(Math.random()*4)] + rn()*.2, k % 2 ? 1 : -1]; o.s = .8 + Math.random()*.5; },
      `float an = aRnd.x + uTime*0.16*aRnd.z*(3.0/(1.0 + aRnd.y*0.3));
       p.x = position.x + cos(an)*aRnd.y; p.y = sin(an)*aRnd.y*1.3;
       float hot = smoothstep(-0.3, 0.7, aRnd.z*cos(an));
       col = mix(vec3(0.5,0.8,0.35), vec3(1.0,0.55,0.18), hot); a = 0.3 + 0.35*hot; ${FOG}`), lf(10));
    add(g, amb(1600*Q, [34, 18], o => { o.c = mixc(C(0xff7a2a), C(0xffc060), Math.random()); o.s = 1; },
      `p.y = -18.0 + mod(position.y + 18.0 + uTime*0.8, 36.0); a = 0.5*sin(3.1416*(p.y + 18.0)/36.0);`), lf(10));
    add(g, amb(5000*Q, [36, 20], o => { o.c = mixc(C(0x4a6030), C(0x8aa050), Math.random()); o.s = .6; }, `a = 0.18;`), lf(10));
  }

  // 10→11 · 410 км
  sheet(11, 0x7acc4a, 0x3ab8e0, `a = 0.18 + 0.4*pow(0.5 + 0.5*sin(position.x*0.25 + position.y*0.2 + uTime*0.6), 4.0);`);
  // 11 · переходная зона: рингвудит и вода, погружающаяся плита
  { const g = LAY[11], rw = SHOW(11), ra = [], s = 3.2, VV = [[s,0,0],[-s,0,0],[0,s,0],[0,-s,0],[0,0,s],[0,0,-s]];
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (Math.abs(VV[i][0] + VV[j][0]) + Math.abs(VV[i][1] + VV[j][1]) + Math.abs(VV[i][2] + VV[j][2]) > .1) seg(ra, VV[i], VV[j], .03, 0, 0);
    for (let q = 0; q < 3000*Q; q++){ const u = [rn(), rn(), rn()], l1 = Math.abs(u[0]) + Math.abs(u[1]) + Math.abs(u[2]); ra.push([...sc3(u, s/l1*(q < 2000*Q ? 1 : Math.random()*.95)), 0, q < 2000*Q ? 1 : 2]); }
    const rng = A(ra, (o, v) => { o.rnd = [v[4], 0, 0]; o.c = v[4] === 2 ? C(0x2a4aff) : mixc(C(0x3a6aff), C(0x9ac8ff), Math.random()*.6); o.s = v[4] ? .75 : 1.05; },
      `a = aRnd.x > 1.5 ? 0.18 : aRnd.x > 0.5 ? 0.1 : 0.8; a += pow(max(0.0, sin(uTime*1.6 + aSeed*70.0)), 30.0); ${FOG}`);
    rw.add(rng); add(rw, rng, sf(11)); rw.userData.spin = .09;
    const wat = [];
    for (let k = 0; k < 46; k++){ const inside = k < 8, d = dir(), c = sc3(d, inside ? Math.random()*1.4 : 4.4 + Math.random()*3.2), [t1, t2] = tangent(nrm(add3(d, dir(), .5)));
      const h1 = add3(c, add3(sc3(t1, Math.cos(.91)), t2, Math.sin(.91)), .55), h2 = add3(c, add3(sc3(t1, Math.cos(.91)), t2, -Math.sin(.91)), .55);
      const sp = .6 + Math.random();
      for (let q = 0; q < 10; q++) wat.push([...add3(c, dir(), .09), 0, sp]);
      for (const h of [h1, h2]){ for (let q = 0; q < 5; q++) wat.push([...add3(h, dir(), .05), 1, sp]); for (let q = 1; q < 7; q++) wat.push([...lerp3(c, h, q/7), 2, sp]); } }
    const wm = A(wat, (o, v) => { o.rnd = [v[3] === 0 ? 0 : v[3] === 1 ? 1 : 2, v[4], 0]; o.c = v[3] === 0 ? C(0xff6a6a) : C(0xeaf6ff); o.s = v[3] === 0 ? 1.2 : v[3] === 1 ? .9 : .45; },
      `p.xz = rot(uTime*0.12*aRnd.y)*p.xz; a = aRnd.x > 1.5 ? 0.35 : 0.85; ${FOG}`);
    rw.add(wm); add(rw, wm, sf(11));
    const sl = [], sd = nrm([1, -.75, -1.1]), sw = nrm(cross(sd, [0, 0, 1]));
    for (let q = 0; q < 9000*Q; q++) sl.push([rn()*40, rn()*9, rn()*1.2]);
    add(g, A(sl, (o, v) => { o.rnd = [v[0], v[1], v[2]]; o.c = Math.random() < .08 ? C(0xffffff) : mixc(C(0x2a4a8a), C(0x6a8ac0), Math.random()); o.s = .9; },
      `float u = mod(aRnd.x + 40.0 + uTime*0.9, 80.0) - 40.0;
       vec3 sd = vec3(${sd.map(x => x.toFixed(3)).join(",")}); vec3 sw = vec3(${sw.map(x => x.toFixed(3)).join(",")}); vec3 sn = cross(sd, sw);
       p = vec3(5.0, 5.0, -20.0) + sd*u + sw*aRnd.y + sn*aRnd.z;
       a = 0.3*(1.0 - smoothstep(28.0, 40.0, abs(u))); ${FOG}`), lf(11));
    add(g, amb(5000*Q, [36, 20], o => { o.c = mixc(C(0x2a7a8a), C(0x5aa0c8), Math.random()); o.s = .6; }, `a = 0.18;`), lf(11));
    add(g, amb(900*Q, [34, 18], o => { o.c = C(0x9af0ff); o.s = .7; }, `a = 0.15 + 0.7*pow(max(0.0, sin(uTime*1.4 + aSeed*50.0)), 12.0);`), lf(11));
  }
  // 11→12 · 660 км
  sheet(12, 0x3a8aff, 0xff7a4a, `a = 0.16 + 0.45*pow(0.5 + 0.5*sin(position.y*0.3 - position.x*0.15 + uTime*0.7), 5.0);`);
  // 12 · нижняя мантия: бриджманит, плюм, LLSVP
  { const g = LAY[12], bg_ = SHOW(12), la = [], sp = 2.4, h = 1.2;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++){
      const c = [i*sp, j*sp, k*sp], tl = ((i + j + k) & 1 ? 1 : -1)*.14, ct = Math.cos(tl), st = Math.sin(tl);
      const OV = [[h,0,0],[-h,0,0],[0,h,0],[0,-h,0],[0,0,h],[0,0,-h]].map(([x, y, z]) => [c[0] + x*ct - y*st, c[1] + x*st + y*ct, c[2] + z]);
      for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) if ((a >> 1) !== (b >> 1)) seg(la, OV[a], OV[b], .06, 0, 0);
      for (let q = 0; q < 8; q++) la.push([...add3(c, dir(), .07), 0, 1]);
      if (i < 1 && j < 1 && k < 1) for (let q = 0; q < 10; q++) la.push([...add3([c[0] + sp/2, c[1] + sp/2, c[2] + sp/2], dir(), .12), 0, 2]); }
    const lat = A(la, (o, v) => { o.rnd = [v[4], 0, 0]; o.c = v[4] === 1 ? C(0xffffff) : v[4] === 2 ? C(0xc08aff) : mixc(C(0xff9a4a), C(0xffd08a), Math.random()*.5); o.s = v[4] ? 1.3 : .85; },
      `a = aRnd.x > 0.5 ? 0.9 : 0.5 + 0.3*sin(uTime*1.2 + position.x + position.y); ${FOG}`);
    lat.rotation.set(.45, .5, 0); bg_.add(lat); add(bg_, lat, sf(12)); bg_.userData.spin = .06;
    const pl = [], px0 = 17, pz0 = -26;
    for (let q = 0; q < 3200*Q; q++){ const t = Math.random()*TAU, r = .6 + Math.random()*1.1; pl.push([px0 + Math.cos(t)*r, -22 + Math.random()*28, pz0 + Math.sin(t)*r, 0, Math.random()*TAU]); }
    for (let q = 0; q < 4200*Q; q++) pl.push([px0, 8, pz0, 1, Math.random()*TAU]);
    add(g, A(pl, (o, v) => { o.rnd = [v[3], v[4], Math.random()*TAU]; o.c = mixc(C(0xff6a2a), C(0xffd070), Math.random()); o.s = 1; },
      `if (aRnd.x < 0.5){ p.y = -22.0 + mod(position.y + 22.0 + uTime*1.4, 28.0); a = 0.45*smoothstep(-22.0, -16.0, p.y); }
       else { float an = aRnd.z + uTime*0.5; float rr = 4.5 + 2.2*cos(an); p = position + vec3(cos(aRnd.y)*rr, 2.2*sin(an), sin(aRnd.y)*rr); a = 0.35; }
       ${FOG}`), lf(12));
    const bl = [];
    [[-24, -9, -44, 11], [25, -12, -38, 9]].forEach(([x, y, z, R], k) => { for (let q = 0; q < 5500*Q; q++){ const d = dir(), rr = R*Math.cbrt(Math.random())*(1 + .25*Math.sin(d[0]*4 + k)*Math.cos(d[1]*3)); bl.push([x + d[0]*rr*1.2, y + d[1]*rr*.6, z + d[2]*rr, k]); } });
    add(g, A(bl, (o, v) => { o.rnd = [v[3], 0, 0]; o.c = mixc(C(0x9a1a14), C(0xff5a3a), Math.random()*.4); o.s = 1.6; },
      `a = 0.12*(0.8 + 0.2*sin(uTime*0.4 + aRnd.x*3.0)); ${FOG}`), lf(12));
    add(g, amb(5200*Q, [36, 20], o => { o.c = mixc(C(0x6a2a1a), C(0xb05a3a), Math.random()); o.s = .6; }, `a = 0.2;`), lf(12));
  }

  // 12→13 · D″ и граница ядра
  sheet(13, 0xff6a1a, 0xffd07a, `float w = 0.5 + 0.5*sin(position.x*0.3 + uTime)*sin(position.y*0.35 - uTime*0.8); p.z += w*1.2; a = 0.25 + 0.7*pow(w, 3.0); col = mix(col, vec3(1.0,0.95,0.7), w*0.5);`, 12000);
  // 13 · внешнее ядро: колонны Тейлора, петли поля, жидкое железо
  { const g = LAY[13], tc = SHOW(13, -18), co = [];
    for (let k = 0; k < 7; k++){ const t = k/7*TAU, cx = Math.cos(t)*8, cz = Math.sin(t)*8, dirn = k % 2 ? 1 : -1;
      for (let q = 0; q < 2400*Q; q++){ const st = q % 4; co.push([cx, rn()*14, cz, st*TAU/4 + rn()*.06, (st % 2 ? 1.0 : 1.9) + rn()*.06, dirn]); } }
    add(tc, A(co, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = mixc(C(0xff7a1a), C(0xffe07a), Math.random()); o.s = 1.3; },
      `float yy = -14.0 + mod(position.y + 14.0 + uTime*1.2*aRnd.z, 28.0);
       float an = aRnd.x + position.y*0.55*aRnd.z + uTime*0.9*aRnd.z;
       p = vec3(position.x + cos(an)*aRnd.y, position.y, position.z + sin(an)*aRnd.y);
       a = 0.75*(0.5 + 0.5*sin(yy*0.8 - uTime*2.0))*(1.0 - smoothstep(10.0, 14.0, abs(position.y))); ${FOG}`), sf(13));
    const fl = [];
    for (let k = 0; k < 9; k++){ const t0 = Math.random()*TAU, R = 3 + Math.random()*5, y0 = rn()*7, q3 = 2 + Math.floor(Math.random()*3), n = 500*Q;
      for (let j = 0; j < n; j++){ const t = j/n*TAU; fl.push([Math.cos(t + t0)*(R + 1.1*Math.cos(q3*t)), y0 + 2*Math.sin(q3*t), Math.sin(t + t0)*(R + 1.1*Math.cos(q3*t)), j/n, k]); } }
    for (let k = 0; k < 6; k++){ const n = 900*Q, a0 = k/6*Math.PI, Rx = 15 + k*1.5;
      for (let j = 0; j < n; j++){ const t = j/n*TAU; const x = Math.cos(t)*Rx, y = Math.sin(t)*20; fl.push([x*Math.cos(a0), y, x*Math.sin(a0), j/n, 9 + k]); } }
    add(tc, A(fl, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = mixc(C(0x6a9aff), C(0xd0e4ff), Math.random()*.5); o.s = v[4] >= 9 ? .7 : .9; },
      `float fw = fract(aRnd.x*2.0 - uTime*0.2 + aRnd.y*0.37); a = (aRnd.y >= 9.0 ? 0.1 : 0.2) + 0.7*pow(fw, 8.0); ${FOG}`), sf(13));
    tc.userData.spin = .05;
    add(g, amb(9000*Q, [36, 20], o => { o.c = mixc(C(0xff5a10), C(0xffa040), Math.random()); o.s = .8; },
      `p += vec3(sin(position.y*0.2 + uTime*0.4), cos(position.x*0.2 + uTime*0.3), sin(position.x*0.15 + position.y*0.1 + uTime*0.2))*1.6; a = 0.26;`), lf(13));
  }

  // 13→14 · граница внутреннего ядра: иней дендритов
  { const fr = [];
    for (let k = 0; k < 40; k++){ const go = (p, an, len, dep) => { const q = [p[0] + Math.cos(an)*len, p[1] + Math.sin(an)*len, 0]; seg(fr, p, q, .08, .02, dep);
        if (dep < 3) for (const s of [-1, 1]) for (const f of [.35, .7]) go(lerp3(p, q, f), an + s*Math.PI/3, len*.38, dep + 1); };
      const r = 44*Math.sqrt(Math.random()), t = Math.random()*TAU; go([Math.cos(t)*r, Math.sin(t)*r*.7, 0], Math.random()*TAU, 3 + Math.random()*3, 0); }
    add(LAY[14], A(fr.map(v => [v[0], v[1], 30 + rn()*.2, v[4]]), (o, v) => { o.rnd = [v[3], 0, 0]; o.c = mixc(C(0xfff0c8), C(0xbfe0ff), v[3]/3); o.s = 1; },
      `a = (0.35 + 0.4*sin(uTime*1.5 + aSeed*20.0))*(0.45 + 1.8*nearK(p)); a *= fogK(p, 0.6, 80.0);`), D => smooth(13 - .05, 13.25, D)*(1 - smooth(13.5, 13.62, D)));
  }
  // 14 · внутреннее ядро: фрактальные дендриты железа, «самое внутреннее ядро»
  { const g = LAY[14], ic = SHOW(14, -16), dn = [];
    function arm(p, d, len, dep){ const q = add3(p, d, len); seg(dn, p, q, .045, .015, dep);
      if (dep >= 3) return; const [t1] = tangent(d);
      for (const f of [.28, .5, .72]) for (const s of [-1, 1]){ const nd = nrm(add3(sc3(d, .5), t1, s*.866)); arm(lerp3(p, q, f), nd, len*(.42 - f*.12), dep + 1); } }
    const ARMS = [...Array.from({length:6}, (_, k) => [Math.cos(k*Math.PI/3), Math.sin(k*Math.PI/3), 0]), [0, 0, 1], [0, 0, -1]];
    ARMS.forEach((d, k) => arm(sc3(d, 1.6), d, k < 6 ? 7 : 5, 0));
    const den = A(dn, (o, v) => { o.rnd = [v[4], 0, 0]; o.c = mixc(mixc(C(0xffd27a), C(0xffffff), v[4]/3), C(0xbfe8ff), v[4] === 3 ? .5 : 0); o.s = 1 - v[4]*.12; },
      `a = (0.7 - aRnd.x*0.1)*(0.6 + 0.4*sin(uTime*1.4 - length(position)*0.8)); a += pow(max(0.0, sin(uTime*2.0 + aSeed*90.0)), 30.0); ${FOG}`);
    const denG = new THREE.Group(); denG.rotation.set(.5, 0, .2); denG.add(den); ic.add(denG); add(denG, den, sf(14));
    const core = [];
    for (let q = 0; q < 2400*Q; q++){ const d = dir(); core.push([...sc3(d, 1.5*Math.cbrt(Math.random())), 0]); }
    for (let k = 0; k < 8; k++) for (let q = 0; q < 90; q++){ const t = q/90*TAU, a0 = k/8*Math.PI; core.push([Math.cos(t)*1.55*Math.cos(a0), Math.sin(t)*1.55, Math.cos(t)*1.55*Math.sin(a0), 1]); }
    const cm = A(core, (o, v) => { o.rnd = [v[3], 0, 0]; o.c = v[3] ? C(0xbfe0ff) : mixc(C(0xffffff), C(0xffe0a0), Math.random()); o.s = v[3] ? .7 : 1.1; },
      `a = aRnd.x > 0.5 ? 0.5 : 0.35 + 0.3*sin(uTime*2.0 + aSeed*10.0); ${FOG}`);
    const cG = new THREE.Group(); cG.rotation.set(.94, .3, 0); cG.add(cm); ic.add(cG); add(cG, cm, sf(14));
    const gl = glow(0xfff0c0, 6, .28); ic.add(gl); add(ic, gl, sf(14));
    ic.userData.osc = true; ic.userData.dg = denG; ic.userData.cg = cG;
    add(g, amb(5000*Q, [36, 20], o => { o.c = mixc(C(0xffe0a0), C(0xffffff), Math.random()); o.s = .7; },
      `a = 0.12 + 0.8*pow(max(0.0, sin(uTime*1.3 + aSeed*70.0)), 16.0);`), lf(14));
    add(g, amb(4000*Q, [36, 20], o => { o.c = C(0xffb050); o.s = 1.2; }, `a = 0.1;`), lf(14));
  }

  // 14→15 · решётка железа
  { const hx = [];
    for (let i = -22; i <= 22; i++) for (let j = -16; j <= 16; j++){ const x = (i + j*.5)*2.4, y = j*2.08; if (Math.hypot(x, y*1.2) < 46) for (let q = 0; q < 5; q++) hx.push([x + rn()*.12, y + rn()*.12, 30 + rn()*.1]); }
    add(LAY[15], A(hx, o => { o.c = mixc(C(0xffc070), C(0xfff0d0), Math.random()); o.s = 1; },
      `a = 0.35*(0.45 + 1.8*nearK(p)); a *= fogK(p, 0.6, 80.0);`), D => smooth(13.95, 14.25, D)*(1 - smooth(14.5, 14.62, D)));
  }
  // 15 · кристалл → атом → гем
  const L15 = {}; let softK = 0; let FLY = null;
  { const g = LAY[15], sh = SHOW(15), latG = new THREE.Group(), atomG = new THREE.Group(), hemeG = new THREE.Group(), rbcG = new THREE.Group();
    sh.add(latG); sh.add(atomG);
    const at = [], a0 = 2.4, cz = 1.96;
    for (let k = -1; k <= 1; k++) for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++){
      if (!k && !i && !j) continue;
      const B = k & 1 ? [a0/2, a0/(2*Math.sqrt(3))] : [0, 0], x = i*a0 + j*a0/2 + B[0], y = j*a0*Math.sqrt(3)/2 + B[1];
      if (Math.hypot(x, y) > 9) continue;
      at.push([x, y, k*cz, 1]); for (let q = 0; q < 34; q++){ const g3 = [gauss(), gauss(), gauss()]; at.push([x + g3[0]*.22, y + g3[1]*.22, k*cz + g3[2]*.22, 0]); } }
    const latP = A(at, (o, v) => { o.rnd = [v[3], 0, 0]; o.c = v[3] ? C(0xffffff) : mixc(C(0xffa040), C(0xffd890), Math.random()); o.s = v[3] ? 1.6 : .8; },
      `a = aRnd.x > 0.5 ? 0.9 : 0.35 + 0.15*sin(uTime*2.0 + aSeed*20.0); ${FOG}`);
    latG.add(latP); latG.rotation.set(.55, .35, 0);
    add(latG, latP, D => sf(15)(D)*(1 - .7*smooth(14.82, 15.02, D)) + .3*smooth(14.9, 15.1, D), { sz:() => L15.s || 1 });
    const ap = [];
    for (let q = 0; q < 56; q++){ const d = dir(); ap.push([...sc3(d, .14*Math.cbrt(Math.random())), 0, q < 26 ? 1 : 0, 0]); }
    [[.3, 2], [.55, 8], [.85, 14], [1.15, 2]].forEach(([r, ne], si) => {
      for (let e = 0; e < ne; e++){ const nv = dir(), ph = e/ne*TAU + si; for (let q = 0; q < 10; q++) ap.push([nv[0], nv[1], nv[2], 2, r, ph - q*.06, q]); }
      for (let q = 0; q < 260; q++) ap.push([...sc3(dir(), r*(1 + rn()*.06)), 3, si, 0]); });
    // uK — «расплывание»: 0 — электроны точками на окружностях (историческая картина Бора 1913),
    // 1 — то же самое размазано по оболочке, то есть облако вероятности, каким электрон и является.
    // В покое uK уже 0,45: орбиты читаются только как след, а не как проволочки с бусинами.
    const atP = A(ap, (o, v) => {
      if (v[3] === 2){ o.rnd = [v[4], v[5], v[6]]; o.seed = 2 + Math.random()*.9; o.c = C(0xbfe8ff); o.s = 1.4 - v[6]*.1; }
      else if (v[3] === 3){ o.rnd = [0, 0, 0]; o.seed = 3; o.c = C(0x7aa8ff); o.s = .6; }
      else { o.rnd = [0, 0, 0]; o.seed = v[4] ? 0 : 1; o.c = v[4] ? C(0xff6a5a) : C(0xf0f0ff); o.s = 1.2; } },
      `if (aSeed > 1.5 && aSeed < 2.95){
         vec3 nn = normalize(position); vec3 t1 = normalize(cross(abs(nn.y) < 0.9 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0), nn)); vec3 t2 = cross(nn, t1);
         float r1 = fract(aSeed*97.0), r2 = fract(aSeed*53.0), r3 = fract(aSeed*29.0);
         float an = aRnd.y + uTime*(2.2/aRnd.x) + uK*(r1 - 0.5)*6.28318;
         float rr = aRnd.x*(1.0 + uK*0.30*(r2 - 0.5)*2.0);
         p = (t1*cos(an) + t2*sin(an))*rr + nn*uK*aRnd.x*0.34*(r3 - 0.5)*2.0;
         a = (0.9 - aRnd.z*0.08)*(1.0 - 0.42*uK); s *= 1.0 - 0.30*uK;
         col = mix(col, vec3(0.44, 0.85, 1.0), uK*0.70);
       } else if (aSeed > 2.95){ a = 0.10 + 0.40*uK; s *= 1.0 + 0.5*uK; col = mix(col, vec3(0.37, 0.94, 0.75), uK*0.55); } else { p += 0.01*vec3(sin(uTime*9.0 + aSeed*50.0)); a = 0.95; }
       ${FOG}`);
    atomG.add(atP);
    add(atomG, atP, D => sf(15)(D) + smooth(14.8, 15.2, D), { sz:() => L15.as || 1, k: D => .45 + .55*smooth(15.1, 15.95, D) });
    // гем: порфириновое кольцо, Fe в центре, O₂
    const hm = [], atoms = [];
    const atomAt = (p, kind) => { atoms.push([p, kind]); };
    const bond = (a, b) => seg(hm, a, b, .07, 0, 9);
    const Npos = [], meso = [];
    for (let k = 0; k < 4; k++){ const al = k*Math.PI/2, n = [Math.cos(al)*2, Math.sin(al)*2, 0]; Npos.push(n); atomAt(n, "N");
      const cc = [Math.cos(al)*3.1, Math.sin(al)*3.1, 0], ring = [];
      for (let j = 0; j < 5; j++){ const t = al + Math.PI + j*TAU/5; ring.push([cc[0] + Math.cos(t)*1.12, cc[1] + Math.sin(t)*1.12, 0]); }
      for (let j = 1; j < 5; j++) atomAt(ring[j], "C");
      for (let j = 0; j < 5; j++) bond(ring[j], ring[(j + 1) % 5]);
      bond([0, 0, 0], n);
      for (const j of [2, 3]){ const out = nrm(sub3(ring[j], cc)), e = add3(ring[j], out, 1.25); bond(ring[j], e); atomAt(e, "C");
        if (k >= 2 && j === 2){ const e2 = add3(e, nrm(add3(out, [0, 0, 1], .6)), 1.2), o1 = add3(e2, [0, 0, 1], .9), o2 = add3(e2, out, .9); bond(e, e2); bond(e2, o1); bond(e2, o2); atomAt(e2, "C"); atomAt(o1, "O"); atomAt(o2, "O"); } }
      const m = [Math.cos(al + Math.PI/4)*3.45, Math.sin(al + Math.PI/4)*3.45, 0]; meso.push([m, ring[1], k]); atomAt(m, "C");
    }
    function sub3(a, b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
    // мезо-углерод связывает соседние пирролы
    for (let k = 0; k < 4; k++){ const al = k*Math.PI/2, al2 = al + Math.PI/2, m = meso[k][0];
      const r1 = [Math.cos(al)*3.1 + Math.cos(al + Math.PI - TAU/5)*1.12, Math.sin(al)*3.1 + Math.sin(al + Math.PI - TAU/5)*1.12, 0];
      const r2 = [Math.cos(al2)*3.1 + Math.cos(al2 + Math.PI + TAU/5)*1.12, Math.sin(al2)*3.1 + Math.sin(al2 + Math.PI + TAU/5)*1.12, 0];
      bond(m, r1); bond(m, r2); }
    const O1 = [.2, 0, 1.9], O2 = [.95, 0, 2.6]; bond([0, 0, 0], O1); bond(O1, O2); atomAt(O1, "O"); atomAt(O2, "O");
    const AC = { C:[C(0xd8dce8), .2, 12], N:[C(0x5a8aff), .22, 14], O:[C(0xff4a4a), .22, 14] };
    atoms.forEach(([p, k]) => { const [, r, n] = AC[k]; for (let q = 0; q < n; q++) hm.push([...add3(p, [gauss(), gauss(), gauss()], r*.5), 0, k]); });
    const hmP = A(hm, (o, v) => { o.rnd = [v[4] === 9 ? 1 : 0, 0, 0]; o.c = v[4] === 9 ? C(0xfff0d8) : AC[v[4]][0]; o.s = v[4] === 9 ? .6 : 1.2; },
      `a = aRnd.x > 0.5 ? 0.45 + 0.3*sin(uTime*2.0 - length(position.xy)*1.5) : 0.9; a *= 1.0 + uK*0.6; ${FOG}`);
    hemeG.add(hmP);
    // эритроциты вокруг
    const rb = [];
    for (let k = 0; k < 7; k++){ const t = k/7*TAU, R = 10 + (k % 2)*3.5, c = [Math.cos(t)*R, Math.sin(t)*R*.6, -3 + rn()*4], tilt = rn();
      for (let q = 0; q < 900*Q; q++){ const an = Math.random()*TAU, rr = Math.sqrt(Math.random())*2.8, zz = (rr > 1.2 ? .55 : .25)*(Math.random() < .5 ? 1 : -1)*(.6 + .4*rr/2.8);
        rb.push([c[0] + Math.cos(an)*rr, c[1] + Math.sin(an)*rr*Math.cos(tilt) + zz*Math.sin(tilt), c[2] + zz*Math.cos(tilt) - Math.sin(an)*rr*Math.sin(tilt), k]); } }
    const rbP = A(rb, (o, v) => { o.rnd = [v[3], 0, 0]; o.c = mixc(C(0xff2a3a), C(0xff7a70), Math.random()*.5); o.s = 1; },
      `p.xy = rot(uTime*0.06)*p.xy; a = 0.42; ${FOG}`);
    rbcG.add(rbP);
    L15.sh = sh; L15.lat = latG; L15.atom = atomG; L15.heme = hemeG; L15.hmP = hmP; L15.atoms = atoms; L15.rbc = rbcG; L15.rbP = rbP;
  }

  /* ===== ветка «Биосфера»: слой 7b — древо жизни, корни, грибница, хлорофилл и гем ===== */
  const BIO = new THREE.Group(); desc.add(BIO);
  const bvol = D => smooth(5.9, 6.4, D);
  const bshow = D => smooth(6.05, 6.55, D);
  // кроны и почва — плёнка на границе 6.5
  add(BIO, P(12000*Q, (i, o) => { const r = 48*Math.sqrt(Math.random()), t = Math.random()*TAU; o.p = [Math.cos(t)*r, Math.sin(t)*r*.7, 30 + rn()*.4]; o.c = mixc(C(0x2f8a3a), C(0xc9e86a), Math.random()); o.s = 1 + Math.random()*.6; },
    `float fl = pow(max(0.0, sin(position.x*0.7 + uTime*1.1)*sin(position.y*0.9 - uTime*0.7)), 4.0);
     a = 0.22 + 0.8*fl; col = mix(col, vec3(1.0, 0.95, 0.7), fl*0.7);
     a *= 0.45 + 1.8*nearK(p); a *= fogK(p, 0.6, 80.0);`), D => smooth(5.95, 6.25, D)*(1 - smooth(6.5, 6.62, D)));
  const SHB = new THREE.Group(); SHB.position.z = -18; BIO.add(SHB);
  const tree = [], leaves = [], roots = [], tips = [];
  function grow(out, p, d, len, dep, maxd, ratio, spread, up, tipOut){
    const q = add3(p, d, len); seg(out, p, q, .05, .012 + .02*Math.max(0, 3 - dep)/3, dep);
    if (dep >= maxd){ if (tipOut) tipOut.push(q); return; }
    const [t1, t2] = tangent(d), nb = 3, ph0 = Math.random()*TAU;
    for (let k = 0; k < nb; k++){
      const ph = ph0 + k*TAU/nb + rn()*.3, an = spread*(.8 + Math.random()*.4);
      let nd = add3(sc3(d, Math.cos(an)), add3(sc3(t1, Math.cos(ph)), t2, Math.sin(ph)), Math.sin(an));
      nd = nrm(add3(nd, [0, up, 0]));
      grow(out, q, nd, len*ratio*(.85 + Math.random()*.3), dep + 1, maxd, ratio, spread, up, tipOut);
    } }
  const crownTips = [];
  grow(tree, [.5, -4.6, 0], [0, 1, 0], 2.5, 0, 7, .7, .5, .18, crownTips);
  crownTips.forEach(t => { for (let q = 0; q < 3; q++) leaves.push([t[0] + rn()*.18, t[1] + rn()*.18, t[2] + rn()*.18]); });
  grow(roots, [.5, -4.6, 0], [0, -1, 0], 1.6, 0, 5, .66, .75, -.1, tips);
  const small = [[-12, -5, -14, 5], [13, -5, -18, 5], [-3, -5, -30, 5], [22, -5, -8, 4]];
  const bgT = [], bgTips = [];
  small.forEach(([x, y, z, dd]) => { grow(bgT, [x, y, z], [0, 1, 0], 1.9, 0, dd, .68, .55, .15, null); grow(bgT, [x, y, z], [0, -1, 0], 1.2, 0, 4, .66, .8, -.1, bgTips); });
  const TR_F = `p.x += sin(uTime*0.7 + position.y*0.4)*0.04*max(0.0, position.y + 4.6); p.z += cos(uTime*0.55 + position.y*0.3)*0.03*max(0.0, position.y + 4.6);`;
  add(SHB, A(tree, (o, v) => { o.rnd = [v[4], 0, 0]; o.c = mixc(C(0xb07a42), C(0x7fe08a), v[4]/7); o.s = 1.25 - v[4]*.08; },
    `${TR_F} a = (0.75 - aRnd.x*0.05)*(0.75 + 0.25*sin(uTime*1.3 - position.y*0.9)); ${FOG}`), bshow);
  add(SHB, A(leaves, o => { o.c = mixc(C(0x7dff8a), C(0xfff08a), Math.random()*.5); o.s = 1.2 + Math.random()*.6; },
    `${TR_F} a = 0.55 + 0.45*sin(uTime*1.7 + aSeed*30.0); ${FOG}`), bshow);
  add(SHB, A(roots, (o, v) => { o.rnd = [v[4], 0, 0]; o.c = mixc(C(0xb07a42), C(0xe0c89a), v[4]/5); o.s = 1 - v[4]*.1; },
    `a = 0.55 - aRnd.x*0.06; ${FOG}`), bshow);
  add(SHB, A(bgT, (o, v) => { o.rnd = [v[4], 0, 0]; o.c = mixc(C(0x8a6a3a), C(0x6fd08a), v[4]/5); o.s = .9; },
    `${TR_F} a = 0.4; ${FOG}`), bvol);
  // грибница: связи между кончиками корней всех деревьев, по ним бегут импульсы
  const myc = [], allTips = [...tips, ...bgTips];
  allTips.forEach((a, i) => { allTips.map((b, j) => [Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]), j]).filter(q => q[1] !== i).sort((x, y) => x[0] - y[0]).slice(0, 2).forEach(([dd, j], k) => {
    if (j < i && k === 0) return; const b = allTips[j], n = Math.max(4, Math.round(dd/.07)), mid = add3(lerp3(a, b, .5), [rn()*.4, -.3 - Math.random()*.4, rn()*.4]);
    for (let q = 0; q <= n; q++){ const t = q/n, p1 = lerp3(a, mid, t), p2 = lerp3(mid, b, t); myc.push([...lerp3(p1, p2, t), t, i*.37 + j*.11]); } }); });
  add(SHB, A(myc, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = C(0xcfe8ff); o.s = .6; },
    `float fw = fract(aRnd.x*1.5 - uTime*0.3 + aRnd.y); a = 0.12 + 0.8*pow(fw, 10.0); col = mix(col, vec3(0.6, 1.0, 0.85), pow(fw, 10.0)); ${FOG}`), bshow);
  add(SHB, P(5000*Q, (i, o) => { o.p = [rn()*26, -4.8 - Math.random()*.6 - Math.pow(Math.random(), 3)*5, 6 - Math.random()*30]; o.c = mixc(C(0x6a4a2a), C(0xa08060), Math.random()); o.s = .8; },
    `a = 0.22*(1.0 - smoothstep(-5.0, -10.5, position.y)); ${FOG}`), bvol);
  // хлорофилл (Mg) и гем (Fe): родственные молекулы
  const mol = (x, y, metal, tail) => {
    const g = new THREE.Group(); g.position.set(x, y, 7); g.scale.setScalar(.3); g.rotation.set(-.5, 0, .3); SHB.add(g);
    const pm = L15.hmP.material.clone(); pm.uniforms.uTime = U.time; pm.uniforms.uPR = U.pr; pm.uniforms.uShade = UN.uShade; pm.uniforms.uRot = UN.uRot;
    const m = new THREE.Points(L15.hmP.geometry, pm); m.frustumCulled = false; g.add(m);
    const cen = [];
    for (let q = 0; q < 40; q++) cen.push([gauss()*.16, gauss()*.16, gauss()*.16, 0]);
    if (tail) for (let q = 0; q < 200; q++){ const t = q/200; cen.push([4.5 + t*9, -3.6 - t*2 + Math.sin(t*20)*.3, Math.cos(t*20)*.3, 1]); }
    const c = A(cen, (o, v) => { o.c = v[3] ? C(0xd8dce8) : C(metal); o.s = v[3] ? .8 : 1.8; }, `a = 0.95; ${FOG}`);
    g.add(c); add(g, m, bshow, { sz:() => .9, g:1.3 }); add(g, c, bshow, { sz:() => .9 });
    g.userData.spin = .12;
    return g;
  };
  mol(-7.5, 3.4, 0xff8a3a, false);
  mol(9, 3.6, 0x6dff6a, true);
  // пыльца, споры, светлячки
  add(BIO, amb(3500*Q, [34, 20], o => { o.c = mixc(C(0xfff0a0), C(0x9dff9a), Math.random()); o.s = .7 + Math.random()*.6; },
    `p += vec3(sin(uTime*0.3 + aSeed*40.0), cos(uTime*0.23 + aSeed*30.0)*0.6 + 0.2*sin(uTime + aSeed*9.0), 0.0)*0.8;
     a = 0.15 + 0.7*pow(max(0.0, sin(uTime*1.1 + aSeed*60.0)), 6.0);`), bvol);
  SHB.userData.spin = .025;
  // метки слоёв для ветвления
  for (const it of ITEMS){ let q = it.o; it.L = -1; while (q){ if (q === BIO){ it.L = "bio"; break; } const k = LAY.indexOf(q); if (k >= 0){ it.L = k; break; } q = q.parent; } }

  /* ===== обновление ===== */
  const BND = [[6.25, "Облака · тропосфера"], [6.5, "Поверхность океана"], [7.5, "Полночная зона · глубже 1000 м"], [8.5, "Дно океана → осадки и базальт"], [9.5, "Граница Мохоровичича · 5–70 км"],
    [10.5, "410 км · оливин → вадслеит"], [11.5, "660 км · рингвудит → бриджманит"], [12.5, "Слой D″ · граница ядра · 2890 км"], [13.5, "Граница внутреннего ядра · 5150 км"], [14.5, "Кристаллическая решётка железа"]];
  const BND_BIO = [[6.25, "Облака · тропосфера"], [6.5, "Кроны и почва · живое вещество"]];
  const TNT_BIO = [[0, 0x0a0c20], [6, 0x0a1430], [6.5, 0x0c2a16], [7, 0x08200e], [8, 0x0a1a0c]].map(([d, h]) => [d, new THREE.Color(h)]);
  const TNT = [[0, 0x0a0c20], [6, 0x0a1430], [6.5, 0x07304a], [7.4, 0x041630], [8, 0x050c1e], [9, 0x1a1008], [10, 0x121808], [11, 0x061426], [12, 0x1e0806], [13, 0x2a0e02], [14, 0x221a0a], [15, 0x140b20], [16, 0x0a2b31]].map(([d, h]) => [d, new THREE.Color(h)]);
  const bgM = new THREE.ShaderMaterial({
    uniforms:{ uA:{value:0}, uTint:{value:new THREE.Color()}, uC:{value:new THREE.Vector2(.6, .5)}, uAsp:{value:1} },
    vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader:`uniform float uA; uniform vec3 uTint; uniform vec2 uC; uniform float uAsp; varying vec2 vUv;
      void main(){ vec2 q = vUv - uC; q.x *= uAsp; float r = length(q); vec3 c = mix(uTint*1.7, vec3(0.012, 0.016, 0.034), smoothstep(0.0, 1.0, r)); gl_FragColor = vec4(c, uA); }`,
    transparent:true, depthTest:false, depthWrite:false });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgM); bg.frustumCulled = false; bg.renderOrder = -99; root.add(bg);
  const DK = [54.3, 53, 52, 47, 43, 37, 25];
  function distAt(D){
    if (D >= 6) return 25 + (10.35 - 25)*Math.pow(smooth(6, 6.52, D), .7);
    const w = clamp(warp(Math.max(0, D)), 0, 6), i = Math.min(5, Math.floor(w)), f = w - i;
    return DK[i] + (DK[i + 1] - DK[i])*f;
  }
  let M = 0, lastT = 0;
  return {
    // мягкий переход «Железо → Атом»: атом продолжает расти, пока растворяется
    soft(k){ softK = k; },
    fly(q){ FLY = q; },
    boundary(D, bio){ let best = null, bd = 1; for (const [b, t] of (bio ? BND_BIO : BND)){ const d = Math.abs(D - b); if (d < bd){ bd = d; best = t; } } return { text:best, o:M*(1 - smooth(.07, .24, bd)) }; },
    update(D, hE, T, px, py, portrait, bio){
      const dt = Math.min(.05, Math.max(0, T - lastT)); lastT = T;
      M = smooth(.3, .95, hE);
      root.visible = M > .003;
      if (!root.visible){ bgM.uniforms.uA.value = 0; return 0; }
      bgM.uniforms.uA.value = M;
      const TT = bio ? TNT_BIO : TNT;
      let k = 0; while (k < TT.length - 2 && D > TT[k + 1][0]) k++;
      bgM.uniforms.uTint.value.copy(TT[k][1]).lerp(TT[k + 1][1], smooth(TT[k][0], TT[k + 1][0], D));
      bgM.uniforms.uC.value.set(portrait ? .5 : .62, portrait ? .72 : .5); bgM.uniforms.uAsp.value = W/H;
      // макро
      const pf = portrait ? 1.6 - .35*smooth(4, 6.3, D) : 1;
      const dist = distAt(D)*pf;
      macro.position.set(0, 0, -dist);
      macro.visible = D < 6.6;
      const rotY = T*.12; globe.rotation.y = rotY; cloudG.rotation.y = T*.135; UN.uRot.value = rotY;
      UN.uShade.value = smooth(.4, 1.6, D);
      const szM = dist*.055;
      // спуск
      desc.visible = D > 5.9;
      const wD = Math.min(warp(D), bio ? 7 : 15), zc = (wD - 7)*SPAN;
      for (let L = 6; L <= 15; L++){ LAY[L].position.z = -(L - 7)*SPAN + zc; LAY[L].visible = L === 6 || !bio; }
      BIO.position.z = zc; BIO.visible = !!bio;
      desc.rotation.z = Math.sin(T*.05)*.04;
      root.rotation.set(-py*.03, px*.05, 0);
      if (FLY) root.quaternion.premultiply(FLY);   // v183: полёт к Луне — мир Земли поворачивается, будто камера доворачивает на Луну
      // уровень 15 — бесконечное приближение
      const x15 = smooth(14.55, 15, D);
      L15.s = 1 + 4*x15; L15.lat.scale.setScalar(L15.s);
      L15.as = (.38 + .62*x15 + .15*smooth(15.2, 15.9, D))*(1 + softK*3.4); L15.atom.scale.setScalar(L15.as);
      desc.traverse(o => { if (o.userData.spin) o.rotation.y += dt*o.userData.spin; if (o.userData.osc){ o.userData.dg.rotation.y = .35*Math.sin(T*.14); o.userData.cg.rotation.y = -.5*Math.sin(T*.14 + .8); } });
      for (const it of ITEMS){
        if (bio ? it.L >= 7 : it.L === "bio"){ it.o.visible = false; continue; }
        const v = M*it.f(D), vis = v > .003; it.o.visible = vis; if (!vis) continue;
        const gn = it.g || (it.f.amb ? 1.5 : 1), sz = it.macro ? szM*(gn > 1.5 ? 1.35 : 1) : it.sz ? it.sz() : it.f.amb ? 2.1 : 1, kk = it.k ? it.k(D, T) : 0;
        for (const [m, b] of it.ms){ if (m.uniforms && m.uniforms.uOpacity){ m.uniforms.uOpacity.value = v*gn; m.uniforms.uSize.value = sz; if (m.uniforms.uK) m.uniforms.uK.value = kk; } else m.opacity = b*v; }
      }
      return M;
    }
  };



})();

