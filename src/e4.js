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
  const L15 = {};
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
    const atP = A(ap, (o, v) => {
      if (v[3] === 2){ o.rnd = [v[4], v[5], v[6]]; o.seed = 2; o.c = C(0xbfe8ff); o.s = 1.4 - v[6]*.1; }
      else if (v[3] === 3){ o.rnd = [0, 0, 0]; o.seed = 3; o.c = C(0x7aa8ff); o.s = .6; }
      else { o.rnd = [0, 0, 0]; o.seed = v[4] ? 0 : 1; o.c = v[4] ? C(0xff6a5a) : C(0xf0f0ff); o.s = 1.2; } },
      `if (aSeed > 1.5 && aSeed < 2.5){
         vec3 nn = normalize(position); vec3 t1 = normalize(cross(abs(nn.y) < 0.9 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0), nn)); vec3 t2 = cross(nn, t1);
         float an = aRnd.y + uTime*(2.2/aRnd.x);
         p = (t1*cos(an) + t2*sin(an))*aRnd.x; a = 0.9 - aRnd.z*0.08;
       } else if (aSeed > 2.5){ a = 0.1; } else { p += 0.01*vec3(sin(uTime*9.0 + aSeed*50.0)); a = 0.95; }
       ${FOG}`);
    atomG.add(atP);
    add(atomG, atP, D => sf(15)(D) + smooth(14.8, 15.2, D), { sz:() => L15.as || 1 });
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

__PART5__
  /* ===== обновление ===== */
  const BND = [[6.25, "Облака · тропосфера"], [6.5, "Поверхность океана"], [7.5, "Полночная зона · глубже 1000 м"], [8.5, "Дно океана → осадки и базальт"], [9.5, "Граница Мохоровичича · 5–70 км"],
    [10.5, "410 км · оливин → вадслеит"], [11.5, "660 км · рингвудит → бриджманит"], [12.5, "Слой D″ · граница ядра · 2890 км"], [13.5, "Граница внутреннего ядра · 5150 км"], [14.5, "Кристаллическая решётка железа"]];
  const BND_BIO = [[6.25, "Облака · тропосфера"], [6.5, "Кроны и почва · живое вещество"]];
  const TNT_BIO = [[0, 0x0a0c20], [6, 0x0a1430], [6.5, 0x0c2a16], [7, 0x08200e], [8, 0x0a1a0c]].map(([d, h]) => [d, new THREE.Color(h)]);
  const TNT = [[0, 0x0a0c20], [6, 0x0a1430], [6.5, 0x07304a], [7.4, 0x041630], [8, 0x050c1e], [9, 0x1a1008], [10, 0x121808], [11, 0x061426], [12, 0x1e0806], [13, 0x2a0e02], [14, 0x221a0a], [15, 0x160a1c], [16, 0x1a0610]].map(([d, h]) => [d, new THREE.Color(h)]);
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
      // уровень 15 — бесконечное приближение
      const x15 = smooth(14.55, 15, D);
      L15.s = 1 + 4*x15; L15.lat.scale.setScalar(L15.s);
      L15.as = .38 + .62*x15 + .15*smooth(15.2, 15.9, D); L15.atom.scale.setScalar(L15.as);
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
