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
float landF(vec3 q){ return sin(q.x*2.2 + 1.3)*sin(q.y*2.6 + 0.4)*cos(q.z*1.8 - 0.7) + 0.35*sin(q.x*4.7 + q.z*3.9) + 0.25*sin(q.y*6.1 - q.x*2.3); }
float landD(vec3 q){ float l = landF(q); float am = 0.16; vec3 r = q; for (int i = 0; i < 5; i++){ r = vec3(r.y*2.1 + 1.7, r.z*2.1 - 0.9, r.x*2.1 + 2.3); l += am*sin(r.x)*sin(r.y + 0.5*sin(r.z)); am *= 0.55; } return l; }
float h31(vec3 q){ return fract(sin(dot(q, vec3(12.9898, 78.233, 37.719)))*43758.5453); }
float vn(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0,0.0,0.0)), f.x), mix(h31(i + vec3(0.0,1.0,0.0)), h31(i + vec3(1.0,1.0,0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0,0.0,1.0)), h31(i + vec3(1.0,0.0,1.0)), f.x), mix(h31(i + vec3(0.0,1.0,1.0)), h31(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z); }
float fbm(vec3 x){ float v = 0.0; float am = 0.5; for (int i = 0; i < 5; i++){ v += am*vn(x); x = x*2.03 + vec3(1.7, 9.2, 3.1); am *= 0.5; } return v; }
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
  const landJS = d => { const x = d[0]*2.3, y = d[1]*2.3, z = d[2]*2.3; return Math.sin(x*2.2 + 1.3)*Math.sin(y*2.6 + .4)*Math.cos(z*1.8 - .7) + .35*Math.sin(x*4.7 + z*3.9) + .25*Math.sin(y*6.1 - x*2.3); };
  const hsh = (x, y) => { const s = Math.sin(x*127.1 + y*311.7)*43758.5453; return s - Math.floor(s); };
  const vn2 = (x, y) => { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f*f*(3 - 2*f), v = g*g*(3 - 2*g);
    return (hsh(i, j)*(1 - u) + hsh(i + 1, j)*u)*(1 - v) + (hsh(i, j + 1)*(1 - u) + hsh(i + 1, j + 1)*u)*v; };
  const fbm2 = (x, y) => { let s = 0, a = .5; for (let k = 0; k < 6; k++){ s += a*vn2(x, y); x = x*2.03 + 5.3; y = y*2.03 + 1.7; a *= .5; } return s; };
  function tangent(d){ const up = Math.abs(d[1]) < .9 ? [0, 1, 0] : [1, 0, 0]; const t1 = nrm(cross(up, d)); return [t1, cross(d, t1)]; }

  /* ===== МАКРО: планета и её поля ===== */
  // 0 · планета (тот же рисунок материков, что на кольце)
  add(globe, P(26000*Q, (i, o, n) => { const d = fib(i, n); o.p = sc3(d, RG); o.rnd = d; o.s = .8 + Math.random()*.3; },
    `vec3 q = aRnd*2.3; float land = landF(q); float Lm = step(0.18, land); float ice = step(2.02, abs(q.y));
     vec3 ocean = mix(vec3(0.16,0.42,0.95), vec3(0.07,0.25,0.66), uK*smoothstep(0.18, -0.6, land));
     float dry = smoothstep(0.35, 0.95, 0.5 + 0.5*sin(q.x*3.1 + q.z*2.3) - abs(q.y)*0.2);
     vec3 grn = mix(vec3(0.4,0.88,0.56), mix(vec3(0.3,0.7,0.36), vec3(0.88,0.72,0.42), dry), uK);
     col = mix(ocean, grn, Lm); col = mix(col, vec3(0.92,0.96,1.0), ice);
     a = mix(0.32, 1.0, max(Lm, ice))*(1.0 - 0.55*smoothstep(0.5, 1.0, uK));
     a *= mix(1.0, 0.16 + 0.84*shadeK(aRnd), uShade);`),
    D => 1 - smooth(6.12, 6.32, D), { macro:true, k:D => smooth(3.5, 5.6, D) });
  // лимб атмосферы
  add(macro, P(7000*Q, (i, o, n) => { const d = fib(i, n); o.p = sc3(d, RG*1.035); o.rnd = d; o.c = C(0x7fb6ff); o.s = .9; },
    `${RIMC} a = 0.55*rim*rim*rim; a *= mix(1.0, 0.3 + 0.7*shadeK(aRnd), uShade);`),
    D => 1 - smooth(6.1, 6.3, D), { macro:true });
  // детализированная шапка, обращённая к камере: фрактальный берег
  add(macro, P(36000*Q, (i, o) => { let d; do { d = dir(); } while (d[2] < .5); o.p = sc3(d, RG*1.002); o.rnd = d; o.s = .7 + Math.random()*.4; },
    `vec3 ug = aRnd; ug.xz = rot(-uRot)*ug.xz; vec3 q = ug*2.3; float land = landD(q);
     float Lm = smoothstep(0.16, 0.2, land); float ice = step(2.02, abs(q.y));
     float dry = smoothstep(0.35, 0.95, 0.5 + 0.5*sin(q.x*3.1 + q.z*2.3) - abs(q.y)*0.2);
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
__PART2__
})();
