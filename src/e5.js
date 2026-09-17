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
