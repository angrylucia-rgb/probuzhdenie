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
__PART3__
