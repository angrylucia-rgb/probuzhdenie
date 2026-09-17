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
__PART4__
