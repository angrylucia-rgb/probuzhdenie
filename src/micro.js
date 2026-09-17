/* ---------- микромир: глубина 9–15 (ткани → нейроны → кровь → клетка → ядро → хромосома → ДНК) ---------- */
const mscene = new THREE.Scene();
const mcam = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, 0.05, 300);
const MICRO = (() => {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
  const add = (a, b, k) => [a[0] + b[0]*k, a[1] + b[1]*k, a[2] + b[2]*k];
  const VIG = (w, h) => `a *= 1.0 - smoothstep(0.6, 1.0, length(position.xy/vec2(${w.toFixed(2)}, ${h.toFixed(2)})));`;
  const RIM = (pw) => `vec3 nv = normalize(normalMatrix*aRnd); float rim = pow(1.0 - abs(nv.z), ${pw.toFixed(2)});`;
  const WOB = `p += vec3(sin(uTime*0.35 + position.y*1.3), cos(uTime*0.3 + position.x*1.1), sin(uTime*0.27 + position.x*0.7))*0.025;`;
  const fromArr = (arr, fill, chunk, size, decl) => pts(arr.length, (i, o) => { const v = arr[i]; o.p = [v[0], v[1], v[2]]; fill(o, v, i); }, chunk, size, decl);
  const NH = { nid:-1, ndc:null, box:null };
  const BH = { on:{value:0}, ro:{value:new THREE.Vector3()}, rd:{value:new THREE.Vector3(0, 0, -1)} };
  const BDECL = `uniform float uRon; uniform vec3 uRo; uniform vec3 uRd;\n`;
  const BAV = `\n vec3 wq = p - uRo; float tq = dot(wq, uRd); vec3 nq = wq - uRd*tq; float dq = length(nq);\n p += (dq > 1e-4 ? nq/dq : vec3(0.0))*uRon*(1.0 - smoothstep(0.0, 1.0, dq))*step(0.0, tq)*0.55;`;
  function along(path, step, per, jit){
    const out = []; let dist = 0;
    for (let i = 1; i < path.length; i++){
      const a = path[i-1], b = path[i], L = Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]);
      const n = Math.max(1, Math.round(L/step));
      for (let j = 0; j < n; j++){ const t = j/n; for (let q = 0; q < per; q++) out.push([a[0]+(b[0]-a[0])*t + rn()*jit, a[1]+(b[1]-a[1])*t + rn()*jit, a[2]+(b[2]-a[2])*t + rn()*jit, dist + L*t]); }
      dist += L;
    }
    return out;
  }
  // оболочка с подсветкой кромки (нормаль в aRnd)
  function shell(n, R, c, col, a0, a1, pw, size, extra){
    return pts(n, (i, o) => { const d = dir(); o.rnd = d; o.p = [c[0] + d[0]*R[0], c[1] + d[1]*R[1], c[2] + d[2]*R[2]]; o.c = col; o.s = size*(.7 + Math.random()*.6); },
      RIM(pw) + `a = ${a0.toFixed(3)} + ${a1.toFixed(3)}*rim; ${extra || ""}`);
  }

  /* 1 · ткани: кость (остеоны) | надкостница | мышца */
  function tissue(){
    const g = new THREE.Group();
    const OST = [[-1.9,-.1,.8],[-3.45,.4,.68],[-2.4,1.5,.6],[-.8,1.05,.6],[-2.95,-1.45,.66],[-1.35,-1.75,.62],[-3.95,1.95,.55],[-.55,-.6,.45],[-2.75,2.95,.56],[-1.2,2.65,.58],[-4.1,-2.85,.6],[-2.35,-3.1,.62],[-.75,-2.95,.55],[-4.5,-.95,.55],[-5.2,.9,.5],[-5.1,2.9,.5]];
    const inOst = (x, y) => OST.some(o => Math.hypot(x - o[0], y - o[1]) < o[2] + .05);
    const lam = [], lac = [], can = [], cnl = [];
    OST.forEach((o, k) => {
      const R = o[2], rc = .12, nr = 6;
      for (let j = 1; j <= nr; j++){
        const r = rc + (R - rc)*j/nr, m = Math.round(r*170*Q);
        for (let q = 0; q < m; q++){ const t = Math.random()*TAU, rr = r + rn()*.012; lam.push([o[0] + Math.cos(t)*rr, o[1] + Math.sin(t)*rr, rn()*.08, j, j === nr ? 1 : 0]); }
        if (j < nr) for (let q = 0; q < 2 + (j > 2 ? 2 : 0); q++){
          const t = Math.random()*TAU, r2 = rc + (R - rc)*(j + .5)/nr, cx = o[0] + Math.cos(t)*r2, cy = o[1] + Math.sin(t)*r2;
          for (let e = -3; e <= 3; e++) lac.push([cx - Math.sin(t)*e*.012, cy + Math.cos(t)*e*.012, 0]);
          for (let e = 0; e < 4; e++){ const s = (e < 2 ? 1 : -1)*(.02 + Math.random()*.06), tt = t + rn()*.25; cnl.push([cx + Math.cos(tt)*s, cy + Math.sin(tt)*s, 0]); }
        }
      }
      for (let q = 0; q < 26; q++) can.push([o[0], o[1], 0, Math.random()*TAU, .03 + Math.random()*.06, q < 5 ? 1 : 0, k === 0 ? 1 : 0]);
    });
    const lamC = [CREAM, mixc(GOLD, CREAM, .45)];
    g.add(fromArr(lam, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = v[4] ? GOLD : lamC[v[3] % 2]; o.s = .7 + Math.random()*.35; },
      `a = (0.55 + 0.25*sin(uTime*0.5 + aRnd.x*1.3 + position.x*2.0))*(1.0 + aRnd.y*0.8); ${VIG(6.4, 4.6)}`));
    g.add(fromArr(lac, o => { o.c = [1, .97, .9]; o.s = .8; }, `a = 0.5; ${VIG(6.4, 4.6)}`));
    g.add(fromArr(cnl, o => { o.c = CREAM; o.s = .35; }, `a = 0.35; ${VIG(6.4, 4.6)}`));
    g.add(fromArr(can, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = v[5] ? C(0xffd36a) : C(0xff4d5e); o.s = v[5] ? 1.1 : .8; o.seed = v[6]; },
      `float an = aRnd.x + uTime*(0.4 + aRnd.y*3.0)*(1.0 - aRnd.z);
       p.xy += vec2(cos(an), sin(an))*aRnd.y;
       a = aRnd.z > 0.5 ? 0.6 + 0.4*sin(uTime*2.0 + aRnd.x) : 0.7; a *= 1.0 + aSeed*0.6; ${VIG(6.4, 4.6)}`));
    // межостеонные пластины
    g.add(pts(2600*Q, (i, o) => { let x, y; do { x = -6 + Math.random()*6.1; y = rn()*4.6; } while (inOst(x, y)); o.p = [x, y, rn()*.08]; o.c = CREAM; o.s = .5; },
      `a = 0.24; ${VIG(6.4, 4.6)}`));
    // надкостница
    const peri = [];
    for (let f = 0; f < 18; f++){ const x0 = .22 + .55*f/18; for (let q = 0; q < 170*Q; q++){ const y = rn()*4.6; peri.push([x0 + .03*Math.sin(y*5 + f), y, rn()*.05]); } }
    g.add(fromArr(peri, o => { o.c = mixc(CREAM, C(0xffb0a8), .35); o.s = .5; }, `p.x += sin(uTime*0.5 + position.y*2.0)*0.012; a = 0.42; ${VIG(6.4, 4.6)}`));
    g.add(pts(14*14, (i, o) => { const k = Math.floor(i/14); o.p = [.3 + (k*.37) % .4, -4 + k*.62 + (i % 14 - 7)*.012, 0]; o.c = C(0xa99bff); o.s = .8; }, `a = 0.55; ${VIG(6.4, 4.6)}`));
    // мышечные волокна
    const mus = [], myo = [], endo = [];
    for (let b = 0; b < 9; b++){
      const yc = -4 + b*1.0;
      for (let q = 0; q < 1500*Q; q++) mus.push([.95 + Math.random()*5.4, yc + rn()*.4, rn()*.12, yc, b]);
      for (let q = 0; q < 3; q++){ const x = 1.4 + Math.random()*4.5, y = yc + (q % 2 ? .36 : -.36); for (let e = -5; e <= 5; e++) myo.push([x + e*.02, y + rn()*.012, 0]); }
      for (let q = 0; q < 700*Q; q++){ const x = .95 + Math.random()*5.4; endo.push([x, yc + .5 + .025*Math.sin(x*9 + b), 0]); }
    }
    g.add(fromArr(mus, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = C(0xff6f7d); o.s = .85; },
      `float xs = position.x - 0.95;
       float wv = 0.5 + 0.5*sin(uTime*0.7 - position.x*0.5 + aRnd.y);
       p.x = 0.95 + xs*(1.0 - 0.05*wv);
       float z = fract(xs*5.0);
       float band = smoothstep(0.08, 0.18, z)*(1.0 - smoothstep(0.55, 0.66, z));
       float zl = 1.0 - smoothstep(0.0, 0.04, abs(z - 0.82));
       float eg = abs(position.y - aRnd.x)/0.4;
       a = (0.14 + 0.5*band + 0.45*zl)*(0.55 + 0.45*(1.0 - smoothstep(0.7, 1.0, eg)))*(0.7 + 0.3*step(0.5, fract((position.y - aRnd.x)*16.0)));
       a *= 1.8; col = mix(col, vec3(1.0, 0.86, 0.82), zl*0.8);
       ${VIG(6.4, 4.6)}`));
    g.add(fromArr(myo, o => { o.c = C(0xb3a2ff); o.s = .75; }, `a = 0.6; ${VIG(6.4, 4.6)}`));
    g.add(fromArr(endo, o => { o.c = C(0xffe6de); o.s = .5; }, `a = 0.4; ${VIG(6.4, 4.6)}`));
    g.add(pts(260*Q, (i, o) => { o.p = [Math.random()*5.4, .5 + rn()*.05, 0]; o.c = C(0xff3b50); o.s = .9; },
      `p.x = 0.95 + mod(position.x + uTime*0.35, 5.4); a = 0.75; ${VIG(6.4, 4.6)}`));
    const fg = glow(0xffc070, 1.1, .45); fg.position.set(-1.9, -.1, 0); g.add(fg);
    return { g, f: V3(-1.9, -.1, 0), upd(){} };
  }

  /* 2 · нейроны */
  function neurons(){
    const g = new THREE.Group();
    const SOM = [[-3.3,1.7,-.6],[-.6,2.5,.7],[2.7,1.5,-.5],[-2.5,-1.6,.5],[.6,-.35,0],[3.8,-1.9,.4],[-5,-.4,-.9],[1.6,3.4,-1.2]];
    const bend = (d, amt) => { d[0] += rn()*amt; d[1] += rn()*amt; d[2] += rn()*amt*.5; const l = Math.hypot(d[0], d[1], d[2]); d[0] /= l; d[1] /= l; d[2] /= l; };
    const dend = [], axon = [], soma = [], myel = [], bout = [], AXL = [];
    // аксон каждого нейрона идёт к ближайшему соседу — сигнал видно целиком
    const TG = SOM.map((c, i) => { let b = -1, bd = 1e9; SOM.forEach((o, j) => { if (j === i) return; const d = Math.hypot(o[0] - c[0], o[1] - c[1], o[2] - c[2]); if (d > 1.8 && d < bd){ bd = d; b = j; } }); return b; });
    const NU = { uGlow:{value:new Float32Array(8)}, uFireN:{value:-1}, uFireP:{value:-10}, uFireA:{value:0}, uSyn:{value:0} };
    const NDECL = `uniform float uGlow[8]; uniform float uFireN; uniform float uFireP; uniform float uFireA; uniform float uSyn;\n`;
    const GL = `int ni = int(aRnd.y + 0.5); float gl = uGlow[ni]; float isF = 1.0 - step(0.5, abs(aRnd.y - uFireN));`;
    const ST = .05/Math.sqrt(Q);
    function branch(start, d0dir, len, depth, d0, nid, out, jit, ends){
      const path = [start.slice()], d = d0dir.slice(); let p = start.slice();
      const steps = Math.max(2, Math.round(len/.06));
      for (let i = 0; i < steps; i++){ bend(d, .35); p = add(p, d, .06); path.push(p); }
      along(path, ST, 2, jit).forEach(v => out.push([v[0], v[1], v[2], d0 + v[3], nid]));
      if (depth > 0) for (let k = 0; k < 2; k++){ const nd = d.slice(); bend(nd, 1.1); branch(p, nd, len*.66, depth - 1, d0 + len, nid, out, jit*.7, ends); }
      else if (ends) ends.push(p);
    }
    SOM.forEach((c, nid) => {
      for (let q = 0; q < 240*Q; q++){ const d = dir(), r = Math.pow(Math.random(), .5)*.2; soma.push([c[0] + d[0]*r*1.25, c[1] + d[1]*r, c[2] + d[2]*r, 0, nid]); }
      const nd = 4 + (nid % 3);
      for (let k = 0; k < nd; k++){ const a = k/nd*TAU + rn()*.4, d = nrm([Math.cos(a), Math.sin(a), rn()*.4]); branch(add(c, d, .16), d, .7 + Math.random()*.3, 2, 0, nid, dend, .018, null); }
      const tgt = SOM[TG[nid]], path = [c.slice()];
      let p = c.slice(), d = nrm([tgt[0] - c[0], tgt[1] - c[1], tgt[2] - c[2]]);
      const steps = Math.round(Math.hypot(tgt[0] - c[0], tgt[1] - c[1], tgt[2] - c[2])*.8/.06), L = steps*.06; AXL[nid] = L;
      bend(d, 1.4);
      for (let i = 0; i < steps; i++){ const to = nrm([tgt[0] - p[0], tgt[1] - p[1], tgt[2] - p[2]]); d = nrm(add(d, to, .12)); bend(d, .12); p = add(p, d, .06); path.push(p); }
      along(path, ST*.8, 2, .008).forEach(v => { axon.push([v[0], v[1], v[2], v[3], nid]); const m = v[3] % .5; if (v[3] > .3 && m > .08 && m < .44) for (let e = 0; e < 2; e++) myel.push([v[0] + rn()*.045, v[1] + rn()*.045, v[2] + rn()*.045, v[3], nid]); });
      const ends = [];
      for (let k = 0; k < 5; k++){ const d2 = d.slice(); bend(d2, 1.6); branch(p, d2, .22, 0, L, nid, axon, .006, ends); }
      ends.forEach(e => { for (let q = 0; q < 10; q++) bout.push([e[0] + rn()*.025, e[1] + rn()*.025, e[2] + rn()*.025, 0, nid]); });
    });
    g.add(fromArr(dend, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = C(0x9a86ff); o.s = .55; },
      `${WOB} ${GL} float ph = fract(aRnd.x*0.9 + uTime*(0.22 + gl*0.5) + aRnd.y*0.37);
       float pq = (ph - 0.5)*18.0; float pu = exp(-pq*pq);
       col = mix(col, vec3(0.85, 0.9, 1.0), pu); a = 0.26 + 0.7*pu;
       a *= 1.0 + gl*1.8; col = mix(col, vec3(0.95, 0.95, 1.0), gl*0.45);`, 1, NDECL));
    g.add(fromArr(axon, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = C(0x6fd8ff); o.s = .6; },
      `${WOB} ${GL} float ph = fract(aRnd.x*0.3 - uTime*0.17 + aRnd.y*0.37);
       float pq = (ph - 0.5)*30.0; float pu = exp(-pq*pq)*(1.0 - isF*uFireA*0.8);
       col = mix(col, vec3(1.0, 0.93, 0.72), pu); a = 0.3 + 1.3*pu; s *= 1.0 + pu*1.4;
       float fd = aRnd.x - uFireP;
       float head = isF*uFireA*exp(-fd*fd*45.0);
       float trail = isF*uFireA*(1.0 - step(0.0, fd))*exp(fd*2.6)*0.55;
       float sig = head + trail;
       col = mix(col, vec3(1.0, 0.96, 0.8), min(1.0, sig*1.4));
       a += head*3.6 + trail*1.4; s *= 1.0 + head*3.0 + trail*0.7;
       a *= 1.0 + gl*0.6;`, 1, NDECL));
    g.add(fromArr(myel, (o, v) => { o.rnd = [v[3], v[4], 0]; o.c = C(0xdff4ff); o.s = .55; },
      `${WOB} ${GL} float fd = aRnd.x - uFireP; a = 0.16 + isF*uFireA*exp(-fd*fd*30.0)*0.9;`, 1, NDECL));
    g.add(fromArr(soma, (o, v) => { o.rnd = [0, v[4], 0]; o.c = mixc(C(0xc8b8ff), [1, 1, 1], Math.random()*.5); o.s = 1.0; },
      `${WOB} ${GL} a = (0.45 + 0.25*sin(uTime*0.8 + aRnd.y*2.0))*(1.0 + gl*2.4); s *= 1.0 + gl*0.7; col = mix(col, vec3(1.0, 0.97, 0.9), gl*0.6);`, 1, NDECL));
    g.add(fromArr(bout, (o, v) => { o.rnd = [0, v[4], 0]; o.c = GOLD; o.s = 1.2; },
      `${WOB} ${GL} a = (0.45 + 0.45*sin(uTime*1.6 + aRnd.y*1.7 + position.x*3.0))*(1.0 + isF*uSyn*3.0); s *= 1.0 + isF*uSyn*1.2;`, 1, NDECL));
    const sprites = SOM.map(c => { const s = glow(0x9f8cff, 1.3, .3); s.position.set(c[0], c[1], c[2]); g.add(s); return s; });
    g.traverse(o => { if (o.isPoints && o.material.fragmentShader && o.material.vertexShader.indexOf("uGlow") >= 0) Object.assign(o.material.uniforms, NU); });
    const glowT = new Float32Array(8); let fireN = -1, fireT = 0, lastT = 0;
    // астроциты
    const ast = [];
    for (let k = 0; k < 16; k++){ const c = [rn()*5.5, rn()*3.8, rn()*1.2]; for (let r = 0; r < 7; r++){ const d = dir(); for (let q = 0; q < 8; q++) ast.push(add(c, d, q*.035 + rn()*.01)); } }
    g.add(fromArr(ast, o => { o.c = C(0x5fe0c0); o.s = .5; }, `${WOB} a = 0.22;`));
    // капилляр
    const cy = x => -2.35 + .22*x + .3*Math.sin(.6*x);
    const cap = [];
    for (let q = 0; q < 3200*Q; q++){ const x = rn()*6.6, t = Math.random()*TAU, sl = .22 + .18*Math.cos(.6*x), nn = nrm([-sl, 1, 0]); cap.push([x + nn[0]*Math.cos(t)*.22, cy(x) + nn[1]*Math.cos(t)*.22, Math.sin(t)*.22, t]); }
    g.add(fromArr(cap, (o, v) => { o.rnd = nrm([0, Math.cos(v[3]), Math.sin(v[3])]); o.c = C(0xff8d9a); o.s = .55; },
      RIM(2.0) + `a = (0.08 + 0.5*rim)*(1.0 - smoothstep(5.2, 6.6, abs(position.x)));`));
    g.add(pts(160*Q, (i, o) => { o.p = [Math.random()*13.2, rn()*.12, rn()*.12]; o.c = C(0xff3d55); o.s = 1.3; },
      `float x = mod(position.x + uTime*0.55, 13.2) - 6.6;
       p = vec3(x, -2.35 + 0.22*x + 0.3*sin(0.6*x) + position.y, position.z);
       a = 0.7*(1.0 - smoothstep(5.2, 6.6, abs(x)));`));
    const fx = 1.6;
    return { g, f: V3(fx, cy(fx), 0), som: SOM, upd(t, vis){
      g.rotation.y = Math.sin(t*.07)*.12;
      const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
      const hN = vis ? NH.nid : -1;
      glowT.fill(0);
      if (hN >= 0){
        if (fireN !== hN){ fireN = hN; fireT = t; }
        const Lx = AXL[hN], ph = ((t - fireT)*2.1) % (Lx + 2.6);
        NU.uFireN.value = hN; NU.uFireP.value = ph - .15;
        NU.uFireA.value += (1 - NU.uFireA.value)*Math.min(1, dt*6);
        glowT[hN] = 1;
        const arr = ph - Lx;
        const syn = arr > -.1 && arr < 1.4 ? Math.exp(-Math.pow((arr - .15)/.35, 2)) : 0;
        NU.uSyn.value = syn;
        glowT[TG[hN]] = Math.max(glowT[TG[hN]], arr > 0 ? Math.max(0, 1 - (arr - .3)/2.0)*.95 : 0);
      } else {
        NU.uFireA.value += (0 - NU.uFireA.value)*Math.min(1, dt*3);
        NU.uSyn.value *= Math.max(0, 1 - dt*4);
        if (NU.uFireA.value < .01) fireN = -1;
      }
      const G = NU.uGlow.value;
      for (let i = 0; i < 8; i++){
        G[i] += (glowT[i] - G[i])*Math.min(1, dt*(glowT[i] > G[i] ? 7 : 2.2));
        sprites[i].material.opacity = .3 + G[i]*.55;
        const sc = 1.3*(1 + G[i]*.9); sprites[i].scale.set(sc, sc, 1);
      }
    } };
  }

  /* 3 · кровь: сосуд и эритроциты */
  function blood(){
    const g = new THREE.Group(), v = new THREE.Group(); g.add(v);
    v.rotation.set(0, .3, .313);
    const R = 2.1, HL = 8.5;
    v.add(pts(9000*Q, (i, o) => { const th = Math.random()*TAU; o.p = [rn()*HL, th, rn()*.05]; o.rnd = [0, Math.cos(th), Math.sin(th)]; o.c = C(0xf09aaa); o.s = .55; },
      `float th = position.y; p = vec3(position.x, cos(th)*(${R.toFixed(2)} + position.z), sin(th)*(${R.toFixed(2)} + position.z));
       ${RIM(2.2)} a = (0.07 + 0.9*rim)*(1.0 - smoothstep(6.3, 8.5, position.x))*(1.0 - smoothstep(2.5, 4.5, -position.x));
       col = mix(col, vec3(1.0, 0.86, 0.86), rim*0.6);`));
    const NU = []; for (let k = 0; k < 18; k++) NU.push([rn()*6.5, Math.random()*TAU]);
    NU[0] = [.9, 1.15];
    v.add(pts(18*90, (i, o) => { const k = Math.floor(i/90), nn = NU[k]; const th = nn[1] + gauss()*.06; o.p = [nn[0] + gauss()*.22, th, .02]; o.rnd = [0, Math.cos(th), Math.sin(th)]; o.c = k === 0 ? C(0xc6b6ff) : C(0x9d8cff); o.s = .85; o.seed = k === 0 ? 1 : 0; },
      `float th = position.y; p = vec3(position.x, cos(th)*(${R.toFixed(2)} + position.z), sin(th)*(${R.toFixed(2)} + position.z));
       ${RIM(1.5)} a = (0.25 + 0.7*rim)*(1.0 + aSeed*0.8)*(1.0 - smoothstep(6.3, 8.5, position.x))*(1.0 - smoothstep(2.5, 4.5, -position.x));`));
    v.add(pts(1600*Q, (i, o) => { const r = Math.sqrt(Math.random())*1.9, t = Math.random()*TAU; o.p = [Math.random()*17, Math.cos(t)*r, Math.sin(t)*r]; o.c = C(0xffd0c8); o.s = .4; },
      `p.x = mod(position.x + uTime*0.9, 17.0) - 8.5; a = 0.22*(1.0 - smoothstep(6.3, 8.5, p.x))*(1.0 - smoothstep(2.5, 4.5, -p.x));` + BAV, 1, BDECL));
    v.add(pts(140*Q, (i, o) => { const r = Math.sqrt(Math.random())*1.7, t = Math.random()*TAU; o.p = [Math.random()*17, Math.cos(t)*r, Math.sin(t)*r]; o.c = GOLD; o.s = 1.0; },
      `p.x = mod(position.x + uTime*1.0, 17.0) - 8.5; a = 0.6*(1.0 - smoothstep(6.3, 8.5, p.x))*(1.0 - smoothstep(2.5, 4.5, -p.x));` + BAV, 1, BDECL));
    v.children.forEach(o => { if (o.isPoints && o.material.vertexShader.indexOf("uRon") >= 0) Object.assign(o.material.uniforms, { uRon:BH.on, uRo:BH.ro, uRd:BH.rd }); });
    // лейкоциты катятся по стенке
    v.add(pts(2*700, (i, o) => { const k = i < 700 ? 0 : 1, d = dir(), r = Math.cbrt(Math.random())*.42, lobe = Math.random() < .35;
        o.p = lobe ? [Math.cos(i)*.14 + d[0]*.08, Math.sin(i*1.7)*.12 + d[1]*.08, d[2]*.08] : d.map(x => x*r); o.rnd = [k*8.5, 0, 0]; o.c = lobe ? C(0xb49cff) : C(0xf2eeff); o.s = lobe ? .8 : .6; },
      `float x = mod(aRnd.x + uTime*0.22, 17.0) - 8.5; float rl = -uTime*0.22/0.45;
       vec3 q = position; q.xy = mat2(cos(rl), -sin(rl), sin(rl), cos(rl))*q.xy;
       p = q + vec3(x, -1.55, -0.6); a = 0.45*(1.0 - smoothstep(6.3, 8.5, x))*(1.0 - smoothstep(2.5, 4.5, -x));`));
    // эритроциты — двояковогнутые диски (форма Эванса–Фунга)
    const prof = [], NP = 18;
    const hz = r => .5*Math.sqrt(Math.max(0, 1 - r*r))*(.207 + 2.003*r*r - 1.123*r*r*r*r);
    for (let i = 0; i <= NP; i++){ const r = Math.sin(i/NP*Math.PI/2); prof.push(new THREE.Vector2(Math.max(r, 1e-3), hz(r) + (i === NP ? 0 : 0))); }
    for (let i = NP - 1; i >= 0; i--){ const r = Math.sin(i/NP*Math.PI/2); prof.push(new THREE.Vector2(Math.max(r, 1e-3), -hz(r))); }
    const rbcG = new THREE.LatheGeometry(prof, mobile ? 20 : 28);
    const rbcM = new THREE.ShaderMaterial({
      uniforms:{ uOp:{value:1} },
      vertexShader:`varying vec3 vN; varying float vPal;
void main(){ vec4 wp = vec4(position, 1.0); vec3 n = normal;
#ifdef USE_INSTANCING
  wp = instanceMatrix*wp; n = mat3(instanceMatrix)*n;
#endif
  vN = normalize(normalMatrix*n); vPal = 1.0 - smoothstep(0.0, 0.62, length(position.xz));
  gl_Position = projectionMatrix*modelViewMatrix*wp; }`,
      fragmentShader:`uniform float uOp; varying vec3 vN; varying float vPal;
void main(){ vec3 n = normalize(vN); float fr = pow(1.0 - abs(n.z), 2.2); float lam = 0.35 + 0.65*abs(n.z);
  vec3 col = vec3(0.6, 0.05, 0.1)*lam; col = mix(col, vec3(0.95, 0.36, 0.4), vPal*0.35);
  col += vec3(1.0, 0.42, 0.45)*fr*0.85;
  gl_FragColor = vec4(col, uOp); }`,
      transparent:true, depthWrite:true, side:THREE.DoubleSide });
    const NR = Math.round(70*Q);
    const rbc = new THREE.InstancedMesh(rbcG, rbcM, NR); rbc.frustumCulled = false; v.add(rbc);
    const RB = [];
    for (let i = 0; i < NR; i++){ const r = Math.sqrt(Math.random())*1.45, t = Math.random()*TAU;
      RB.push({ x0:Math.random()*17, y:Math.cos(t)*r, z:Math.sin(t)*r, v:.5 + 1.1*(1 - r*r/4), ax:new THREE.Vector3(rn(), rn(), rn()).normalize(), w:.2 + Math.random()*.5, ph:Math.random()*TAU,
        q0:new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()*TAU, Math.random()*TAU, 0)) }); }
    const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3(), wv = new THREE.Vector3(), tg = new THREE.Vector3();
    const f = V3(.9, R*Math.cos(1.15), R*Math.sin(1.15));
    RB.forEach(b => { b.off = new THREE.Vector3(); b.sp = 0; });
    let lastT = 0;
    return { g, f, fObj: v, v, upd(t, vis){
      if (!vis) return;
      const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
      const on = BH.on.value > .01, ro = BH.ro.value, rd = BH.rd.value;
      RB.forEach((b, i) => {
        const x = ((b.x0 + t*b.v) % 17) - 8.5, sc = .5*(1 - smooth(6.6, 8.4, x))*(1 - smooth(2.6, 4.4, -x));
        pp.set(x, b.y + Math.sin(t*.6 + b.ph)*.05, b.z);
        tg.set(0, 0, 0);
        if (on){
          wv.copy(pp).sub(ro); const tp = wv.dot(rd);
          wv.addScaledVector(rd, -tp); const d = wv.length(), RAD = 1.25;
          if (tp > 0 && d < RAD){ const k = 1 - d/RAD; if (d > 1e-4) wv.multiplyScalar(1/d); else wv.set(0, 1, 0); tg.copy(wv).multiplyScalar(1.05*k*k*BH.on.value); tg.x *= .35; }
        }
        b.off.lerp(tg, Math.min(1, dt*3.4));
        pp.add(b.off);
        const rr = Math.hypot(pp.y, pp.z); if (rr > 1.8){ pp.y *= 1.8/rr; pp.z *= 1.8/rr; }
        b.sp += b.off.length()*dt*2.2;
        qq.setFromAxisAngle(b.ax, t*b.w + b.ph + b.sp).multiply(b.q0); ss.setScalar(Math.max(sc, 1e-3));
        mm.compose(pp, qq, ss); rbc.setMatrixAt(i, mm);
      });
      rbc.instanceMatrix.needsUpdate = true;
    }, mats:[rbcM] };
  }

  /* 4 · клетка */
  function cell(){
    const g = new THREE.Group();
    const NUC = [.35, .15, 0], RN = 1.2, EL = [3.9, 3.1, 2.9];
    const inCell = (p, k) => (p[0]/EL[0])**2 + (p[1]/EL[1])**2 + (p[2]/EL[2])**2 < k;
    const dN = p => Math.hypot(p[0] - NUC[0], p[1] - NUC[1], p[2] - NUC[2]);
    // органоиды: у каждого свой центр, сила «приближения» при наведении и скрытый слой деталей
    const CU = { uCDim:{value:0} }, ELS = [];
    const EDECL = `uniform vec3 uEC; uniform float uEA; uniform float uES; uniform float uCDim;\n`;
    const ESUF = `\n p = uEC + (p - uEC)*(1.0 + uES*uEA); a *= (1.0 + uEA*0.7)*(1.0 - uCDim*(1.0 - uEA)*0.6); s *= 1.0 + uEA*0.35;`;
    const DSUF = `\n p = uEC + (p - uEC)*(1.0 + uES*uEA); a *= smoothstep(0.05, 0.7, uEA);`;
    function E(key, name, desc, note, c, r, es, pri, pickable){
      const e = { key, name, desc, note, c, r, pri:pri || 0, pick:pickable !== false, ea:{value:0}, uc:{value:V3(...c)}, es:{value:es}, objs:[], det:[], spr:[] };
      ELS.push(e); return e;
    }
    const cp = (e, n, fill, chunk, detail) => {
      const o = pts(n, fill, chunk + (detail ? DSUF : ESUF), 1, EDECL);
      Object.assign(o.material.uniforms, { uEC:e.uc, uEA:e.ea, uES:e.es, uCDim:CU.uCDim });
      (detail ? e.det : e.objs).push(o); if (detail) o.visible = false; g.add(o); return o;
    };
    const ca = (e, arr, fill, chunk, detail) => cp(e, arr.length, (i, o) => { const v = arr[i]; o.p = [v[0], v[1], v[2]]; fill(o, v, i); }, chunk, detail);
    const cs = (e, n, R, c, col, a0, a1, pw, size, extra, detail) => cp(e, n, (i, o) => { const d = dir(); o.rnd = d; o.p = [c[0] + d[0]*R[0], c[1] + d[1]*R[1], c[2] + d[2]*R[2]]; o.c = col; o.s = size*(.7 + Math.random()*.6); },
      RIM(pw) + `a = ${a0.toFixed(3)} + ${a1.toFixed(3)}*rim; ${extra || ""}`, detail);

    // мембрана
    const eM = E("mem", "Клеточная мембрана", "Двойной слой липидов толщиной 5–10 нм с белками-каналами: решает, что войдёт в клетку, а что выйдет.", "Жидкая мозаика — молекулы мембраны постоянно движутся.", [0,0,0], 3.5, .03, 0, false);
    const WAVE = `p += aRnd*0.06*sin(atan(aRnd.y, aRnd.x)*5.0 + uTime*0.3);`;
    cs(eM, 9000*Q, EL, [0,0,0], C(0x9ff0e0), .02, .7, 3.0, .8, WAVE);
    cs(eM, 320, EL.map(x => x*1.01), [0,0,0], C(0xffd98a), .1, .9, 1.5, 1.3, WAVE);
    cs(eM, 7000*Q, EL.map(x => x*.975), [0,0,0], C(0xc8fff0), .02, .8, 3.2, .7, WAVE, true);
    cp(eM, 900, (i, o) => { const d = dir(); o.rnd = d; const k = i % 3; o.p = [d[0]*EL[0]*(1.005 - k*.012), d[1]*EL[1]*(1.005 - k*.012), d[2]*EL[2]*(1.005 - k*.012)]; o.c = k === 1 ? C(0xfff2b0) : C(0x7ee0d0); o.s = 1.1; },
      RIM(1.3) + `a = 0.15 + 0.9*rim; ${WAVE}`, true);

    // цитоскелет и транспорт
    const CS = [-.8, 1.3, .3];
    const eK = E("cyto", "Цитоскелет", "Микротрубочки — рельсы клетки: по ним белки-моторы везут пузырьки и органоиды.", "Кинезин и динеин «шагают» по микротрубочкам, расходуя АТФ.", CS, 3, 0, 0, false);
    const mt = [], mot = [];
    for (let k = 0; k < 28; k++){ const d = dir(); let t = .1; while (inCell(add(CS, d, t), .92) && t < 6) t += .05;
      for (let s = .1; s < t; s += .06/Q) mt.push(add(CS, d, s));
      mot.push([CS[0], CS[1], CS[2], d[0]*t, d[1]*t, d[2]*t]); }
    ca(eK, mt, o => { o.c = C(0xcfefff); o.s = .45; }, `a = 0.13;`);
    ca(eK, mot, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = GOLD; o.s = 1.2; }, `float f = fract(uTime*0.06 + aSeed*7.0); p = position + aRnd*f; a = 0.8*sin(f*3.14159);`);
    ca(eK, mt, o => { o.c = C(0xe8f8ff); o.s = .6; }, `a = 0.4 + 0.3*sin(uTime*2.0 - length(position)*6.0);`, true);
    const mot2 = []; for (let k = 0; k < 4; k++) mot.forEach(m => mot2.push(m));
    ca(eK, mot2, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = GOLD; o.s = 1.4; }, `float f = fract(uTime*0.12 + aSeed*7.0); p = position + aRnd*f; a = 0.9*sin(f*3.14159);`, true);

    // ядро
    const eN = E("nuc", "Ядро", "Хранит ДНК и управляет жизнью клетки: здесь гены переписываются в РНК.", "Двойная оболочка ядра пронизана тысячами пор — через них идут РНК и белки.", NUC, RN*1.08, .16, 1);
    cs(eN, 3400*Q, [RN, RN, RN], NUC, C(0xa08cff), .04, .8, 2.5, .8);
    cs(eN, 2000*Q, [RN + .07, RN + .07, RN + .07], NUC, C(0xa08cff), .02, .5, 2.5, .7);
    cs(eN, 90, [RN + .035, RN + .035, RN + .035], NUC, C(0xeee6ff), .2, .9, 1.2, 1.5);
    const CH = []; for (let k = 0; k < 10; k++){ const d = dir(); CH.push(add(NUC, d, Math.random()*.7)); }
    cp(eN, 2400*Q, (i, o) => { const c = CH[i % 10]; o.p = [c[0] + gauss()*.2, c[1] + gauss()*.2, c[2] + gauss()*.2]; if (dN(o.p) > RN*.92) o.p = add(NUC, nrm([o.p[0]-NUC[0], o.p[1]-NUC[1], o.p[2]-NUC[2]]), RN*.9*Math.random()); o.c = C(0x7f8cff); o.s = .7; },
      `a = 0.22 + 0.1*sin(uTime + aSeed*30.0);`);
    // детали ядра: кольца пор и нити хроматина
    const por = [];
    for (let k = 0; k < 70; k++){ const d = dir(), e1 = nrm([-d[1], d[0], .001]), e2 = [d[1]*e1[2] - d[2]*e1[1], d[2]*e1[0] - d[0]*e1[2], d[0]*e1[1] - d[1]*e1[0]], c = add(NUC, d, RN + .04);
      for (let j = 0; j < 8; j++){ const a = j/8*TAU; por.push([...add(add(c, e1, Math.cos(a)*.05), e2, Math.sin(a)*.05), d]); } }
    ca(eN, por, (o, v) => { o.rnd = v[3]; o.c = C(0xf4f0ff); o.s = .75; }, RIM(1.0) + `a = 0.3 + 0.9*rim;`, true);
    const chr = [];
    for (let k = 0; k < 6; k++){ let p = add(NUC, dir(), .4), d = dir(); for (let i = 0; i < 260*Q; i++){ d = nrm(add(d, [rn(), rn(), rn()], .7)); if (dN(p) > RN*.8) d = nrm(add(d, [NUC[0]-p[0], NUC[1]-p[1], NUC[2]-p[2]], 1.2)); p = add(p, d, .03); chr.push([...p, k]); } }
    ca(eN, chr, (o, v) => { o.rnd = [v[3], 0, 0]; o.c = [C(0xb18cff), C(0x6fb0ff), C(0x7ee0d0)][v[3] % 3]; o.s = .7; }, `a = 0.55 + 0.25*sin(uTime*1.3 + aSeed*20.0);`, true);

    // ядрышко
    const NO = add(NUC, [.25, .3, .1], 1);
    const eO = E("nol", "Ядрышко", "Участок внутри ядра, где собираются части рибосом — будущих фабрик белка.", "У ядрышка нет своей мембраны: это плотное скопление РНК и белков.", NO, .3, .55, 3);
    cp(eO, 700*Q, (i, o) => { o.p = [NO[0] + gauss()*.14, NO[1] + gauss()*.14, NO[2] + gauss()*.14]; o.c = mixc(C(0xff6fb0), [1, .85, .95], Math.random()*.5); o.s = .9; }, `a = 0.6;`);
    const ng = glow(0xff6fb0, .9, .35); ng.position.set(...NO); g.add(ng); eO.spr.push([ng, .9, .35]);
    const FC = [0, 1, 2].map(() => add(NO, dir(), .08));
    cp(eO, 360, (i, o) => { const c = FC[i % 3]; o.p = [c[0] + gauss()*.03, c[1] + gauss()*.03, c[2] + gauss()*.03]; o.c = [1, .95, .98]; o.s = .9; }, `a = 0.9;`, true);
    cp(eO, 500, (i, o) => { const d = dir(), r = .16 + Math.random()*.06; o.p = add(NO, d, r); o.c = C(0xff9fd0); o.s = .6; }, `a = 0.55 + 0.3*sin(uTime*2.0 + aSeed*30.0);`, true);

    // шероховатая ЭПС + рибосомы
    const eR = E("er", "Шероховатая ЭПС", "Сеть мембранных каналов, усыпанных рибосомами: здесь собираются и складываются белки.", "Мембрана ЭПС переходит прямо в оболочку ядра.", NUC, RN + .9, .07, 0, false);
    const er = [], rib = [];
    while (er.length < 5200*Q){
      const L = Math.floor(Math.random()*4), d = dir();
      if (Math.sin(d[0]*4 + L)*Math.cos(d[1]*3.3 - L) + Math.sin(d[2]*5) < -.2) continue;
      const r = RN + .38 + L*.22 + .05*Math.sin(Math.atan2(d[1], d[0])*9 + d[2]*7 + L);
      const p = add(NUC, d, r); if (!inCell(p, .8)) continue;
      (Math.random() < .22 ? rib : er).push([p[0], p[1], p[2], d]);
    }
    ca(eR, er, (o, v) => { o.rnd = v[3]; o.c = C(0x6fd8ff); o.s = .6; }, RIM(1.6) + `a = 0.08 + 0.4*rim;`);
    ca(eR, rib, o => { o.c = C(0xfff2c8); o.s = .7; }, `a = 0.5;`);
    const poly = [];
    for (let k = 0; k < Math.min(rib.length, 150); k++){ const b = rib[k]; const d = b[3], e1 = nrm([-d[1], d[0], .001]), e2 = [d[1]*e1[2] - d[2]*e1[1], d[2]*e1[0] - d[0]*e1[2], d[0]*e1[1] - d[1]*e1[0]];
      for (let j = 0; j < 9; j++){ const a = j*.8, r = .02 + j*.007; poly.push(add(add(b, e1, Math.cos(a)*r), e2, Math.sin(a)*r)); } }
    ca(eR, poly, o => { o.c = C(0xfff6d8); o.s = .8; }, `a = 0.85;`, true);
    ca(eR, er, (o, v) => { const p = add(v, v[3], .05); o.p = p; o.rnd = v[3]; o.c = C(0x9fe8ff); o.s = .55; }, RIM(1.6) + `a = 0.1 + 0.55*rim;`, true);

    // аппарат Гольджи
    const G = [-1.95, -1.05, .5], ga = .6, gol = [];
    const GC = [G[0] + .25, G[1] - .45, G[2]];
    const eG = E("gol", "Аппарат Гольджи", "Стопка плоских мембранных цистерн: дорабатывает белки, сортирует их и упаковывает в пузырьки.", "Описан Камилло Гольджи в 1898 году.", GC, .75, .35, 1);
    const gp = (x, y, z) => [G[0] + x*Math.cos(ga) - y*Math.sin(ga), G[1] + x*Math.sin(ga) + y*Math.cos(ga), G[2] + z];
    for (let j = 0; j < 6; j++){ const span = .85 - j*.07;
      for (let q = 0; q < 300*Q; q++){ const ph = rn()*span, Ra = .8; gol.push(gp(Math.sin(ph)*Ra, Math.cos(ph)*Ra - Ra - j*.13 + rn()*.02, rn()*.28)); } }
    for (let k = 0; k < 18; k++){ const s = k % 2 ? 1 : -1, ph = s*(.95 + Math.random()*.3), j = Math.random()*5, c = gp(Math.sin(ph)*.8, Math.cos(ph)*.8 - .8 - j*.13, rn()*.2);
      for (let q = 0; q < 14; q++) gol.push([c[0] + rn()*.04, c[1] + rn()*.04, c[2] + rn()*.04]); }
    ca(eG, gol, o => { o.c = C(0xffc46a); o.s = .7; }, `a = 0.5 + 0.15*sin(uTime*0.7 + position.x*6.0);`);
    const ves = [];
    for (let k = 0; k < 40; k++){ const s = k % 2 ? 1 : -1, j = Math.random()*5, a = gp(s*.7, -.55 - j*.13, rn()*.2), d = nrm([rn(), rn(), rn()*.4]);
      for (let q = 0; q < 10; q++) ves.push([a[0] + rn()*.025, a[1] + rn()*.025, a[2] + rn()*.025, d[0]*1.3, d[1]*1.3, d[2]*1.3]); }
    ca(eG, ves, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = C(0xffe2a0); o.s = .8; o.seed = Math.floor(Math.random()*40)/40; },
      `float f = fract(uTime*0.18 + aSeed*3.0); p = position + aRnd*f; a = 0.9*sin(f*3.14159);`, true);
    const fen = []; for (let j = 0; j < 6; j++) for (let q = 0; q < 160; q++){ const ph = rn()*(.85 - j*.07); fen.push(gp(Math.sin(ph)*.8, Math.cos(ph)*.8 - .8 - j*.13, rn()*.3)); }
    ca(eG, fen, o => { o.c = [1, .92, .7]; o.s = .9; }, `a = 0.45 + 0.4*step(0.6, fract(position.z*12.0 + position.x*9.0));`, true);

    // митохондрии — каждая отдельно
    // митохондрии разнесены по кругу вокруг ядра (в стороне от Гольджи и центросомы), вытянуты по радиусу — не перекрываются
    const MANG = [-15, 25, 65, 100, 170, 255, 300];
    MANG.forEach((deg, mi) => {
      const an = deg*Math.PI/180, cr = [Math.cos(an), Math.sin(an)];
      const c = [NUC[0] + cr[0]*2.6, NUC[1] + cr[1]*2.02, (mi % 2 ? .35 : -.3)];
      const u = nrm([cr[0], cr[1], (mi % 3 - 1)*.25]), e1 = nrm([-u[1], u[0], 0]), e2 = [u[1]*e1[2] - u[2]*e1[1], u[2]*e1[0] - u[0]*e1[2], u[0]*e1[1] - u[1]*e1[0]];
      const L = .42 + (mi % 3)*.05, r = .17;
      const e = E("mit", "Митохондрия", "Энергетическая станция клетки: с помощью кислорода превращает питательные вещества в АТФ.", "Внутренняя мембрана сложена в складки-кристы; у митохондрий своя кольцевая ДНК.", c, L + .06, .42, 2);
      const surf = (t, ph, rr) => { const pr = Math.sqrt(Math.max(0, 1 - (Math.max(0, Math.abs(t) - (L - r))/r)**2)); const nn = [e1[0]*Math.cos(ph) + e2[0]*Math.sin(ph), e1[1]*Math.cos(ph) + e2[1]*Math.sin(ph), e1[2]*Math.cos(ph) + e2[2]*Math.sin(ph)]; return [...add(add(c, u, t), nn, rr*pr), nn]; };
      const mit = [], cri = [], inn = [], atp = [], dna = [], mg = [];
      for (let q = 0; q < 360*Q; q++) mit.push(surf(rn()*L, Math.random()*TAU, r));
      for (let q = 0; q < 300*Q; q++) inn.push(surf(rn()*L*.94, Math.random()*TAU, r*.8));
      for (let f = 0; f < 7; f++){ const tk = -L + .1 + (2*L - .2)*f/6;
        for (let q = 0; q < 34*Q; q++){ const s = rn(); cri.push(add(add(add(c, u, tk + .04*Math.sin(s*9)), e1, s*r*.8), e2, rn()*.05)); }
        for (let q = 0; q < 14; q++){ const s = rn(); atp.push(add(add(add(c, u, tk + .04*Math.sin(s*9) + .012), e1, s*r*.75), e2, rn()*.04)); } }
      for (let q = 0; q < 40; q++){ const a = q/40*TAU; dna.push(add(add(add(c, u, L*.35), e1, Math.cos(a)*.05), e2, Math.sin(a)*.05)); }
      for (let q = 0; q < 40; q++) mg.push(add(add(add(c, u, rn()*L*.8), e1, rn()*r*.5), e2, rn()*r*.5));
      ca(e, mit, (o, v) => { o.rnd = v[3]; o.c = C(0xff9a5c); o.s = .7; }, RIM(1.4) + `a = 0.15 + 0.6*rim;`);
      ca(e, cri, o => { o.c = C(0xffd08a); o.s = .6; }, `a = 0.35 + 0.35*step(0.92, fract(aSeed*13.0 + uTime*0.5));`);
      ca(e, inn, (o, v) => { o.rnd = v[3]; o.c = C(0xffc08a); o.s = .5; }, RIM(1.2) + `a = 0.1 + 0.6*rim;`, true);
      ca(e, atp, o => { o.c = [1, .98, .8]; o.s = .55; }, `a = 0.5 + 0.5*step(0.7, fract(aSeed*11.0 + uTime*1.3));`, true);
      ca(e, dna, o => { o.c = C(0x9fe8ff); o.s = .55; }, `a = 0.9;`, true);
      ca(e, mg, o => { o.c = C(0xfff0d0); o.s = .45; }, `p += vec3(sin(uTime + aSeed*20.0), cos(uTime*0.8 + aSeed*30.0), 0.0)*0.01; a = 0.6;`, true);
    });
    // лизосомы
    [5, 45, 82, 278, 322].forEach((deg, k) => { const an = deg*Math.PI/180, c = [NUC[0] + Math.cos(an)*3.0, NUC[1] + Math.sin(an)*2.4, (k % 2 ? -.25 : .3)];
      const e = E("lys", "Лизосома", "Пузырёк с пищеварительными ферментами: разбирает отслужившие части клетки и захваченные частицы.", "Внутри кислая среда — примерно pH 4,5–5.", c, .14, 1.2, 2);
      cs(e, 70, [.11, .11, .11], c, C(0xd07cff), .2, .8, 1.2, .8);
      cs(e, 110, [.105, .105, .105], c, C(0xf0c8ff), .25, .9, 1.0, .6, "", true);
      cp(e, 60, (i, o) => { const d = dir(); o.p = add(c, d, Math.random()*.08); o.c = C(0xffd0ff); o.s = .6; },
        `p += vec3(sin(uTime*1.7 + aSeed*30.0), cos(uTime*1.5 + aSeed*20.0), sin(uTime*1.3 + aSeed*9.0))*0.012; a = 0.8;`, true);
    });
    // центросома
    const eC = E("cen", "Центросома", "Центр сборки микротрубочек; перед делением клетки удваивается и строит веретено.", "Пара центриолей, каждая — цилиндр из девяти триплетов микротрубочек.", CS, .16, 3.2, 3);
    cp(eC, 40, (i, o) => { o.p = [CS[0] + (i < 20 ? .05 : -.05) + rn()*.02, CS[1] + rn()*.02, CS[2] + rn()*.05]; o.c = [1, .95, .8]; o.s = 1; }, `a = 0.8;`);
    const cen = [];
    [[1, 0, 0], [0, 1, 0]].forEach((ax, ci) => { const e1 = ci ? [1, 0, 0] : [0, 1, 0], e2 = [0, 0, 1], o0 = add(CS, ci ? [-.05, 0, 0] : [.05, 0, 0], 1);
      for (let tr = 0; tr < 9; tr++) for (let m = 0; m < 3; m++){ const a = tr/9*TAU + m*.12, rr = .045 - m*.008;
        for (let h = 0; h < 10; h++){ const t = (h/9 - .5)*.12; cen.push(add(add(add(o0, ax, t), e1, Math.cos(a)*rr), e2, Math.sin(a)*rr)); } } });
    ca(eC, cen, o => { o.c = [1, .96, .82]; o.s = .45; }, `a = 0.85;`, true);

    // цитоплазма (только приглушается)
    const eX = { ea:{value:0}, uc:{value:V3(0, 0, 0)}, es:{value:0}, objs:[], det:[] };
    cp(eX, 2200*Q, (i, o) => { let p; do { p = [rn()*3.8, rn()*3, rn()*2.8]; } while (!inCell(p, .9) || dN(p) < RN + .1); o.p = p; o.c = CREAM; o.s = .4; },
      `p += vec3(sin(uTime*0.2 + aSeed*30.0), cos(uTime*0.17 + aSeed*20.0), 0.0)*0.08; a = 0.14;`);

    const pc = new THREE.Vector3(), pr = new THREE.Vector3();
    const scr = (c, r) => { pc.set(c[0], c[1], c[2]).applyMatrix4(g.matrixWorld).project(mcam); pr.set(c[0] + r, c[1], c[2]).applyMatrix4(g.matrixWorld).project(mcam);
      const x = (pc.x + 1)/2*W, y = (1 - pc.y)/2*H; return [x, y, Math.hypot((pr.x + 1)/2*W - x, (1 - pr.y)/2*H - y)]; };
    let hovE = null, lastT = 0;
    return { g, f: V3(...NUC),
      dbg(){ return ELS.filter(e => e.pick).map(e => { const [x, y, r] = scr(e.c, e.r); return { key:e.key, x, y, r }; }); },
      pick(mx, my, on){
        const prev = hovE; hovE = null; if (!on) return null;
        let best = null, bs = -1e9;
        for (const e of ELS){ if (!e.pick) continue;
          const cur = e === prev;
          const [x, y, rp] = scr(e.c, e.r*(cur ? 1 + e.es.value*e.ea.value : 1));
          const d = Math.hypot(mx - x, my - y), lim = rp*(cur ? 1.2 : 1.0) + (e.pri >= 3 ? 2 : 6);
          if (d < lim){ const sc = e.pri*10 - d/lim + (cur ? 12 : 0); if (sc > bs){ bs = sc; best = e; } }
        }
        // удержание: текущий органоид остаётся выбранным, пока курсор рядом, если только не наведён более «внутренний» (ядрышко, центросома)
        if (prev && best !== prev && best && best.pri <= prev.pri){ const [x, y, rp] = scr(prev.c, prev.r*(1 + prev.es.value*prev.ea.value)); if (Math.hypot(mx - x, my - y) < rp*1.2 + 6) best = prev; }
        if (!best){
          const [nx, ny, nr] = scr(NUC, RN);
          const dn = Math.hypot(mx - nx, my - ny);
          if (dn > nr*1.05 && dn < nr*1.95) best = eR;
          else {
            const [cx, cy, rx] = scr([0,0,0], EL[0]); const ry = rx*EL[1]/EL[0];
            const ed = Math.hypot((mx - cx)/rx, (my - cy)/ry);
            if (ed > .88 && ed < 1.1) best = eM; else if (ed <= .88) best = eK;
          }
        }
        hovE = best;
        if (!best) return null;
        let box;
        if (best === eM || best === eK) box = { x:mx, y:my, r:34 };
        else if (best === eR){ const [x, y, r] = scr(NUC, RN + .9); box = { x, y, r }; }
        else { const [x, y, r] = scr(best.c, best.r*(1 + best.es.value)); box = { x, y, r:r + 6 }; }
        return { e:best, box };
      },
      upd(t, vis){
        g.rotation.y = Math.sin(t*.09)*.35; g.rotation.x = Math.sin(t*.07)*.12;
        const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
        const hv = vis ? hovE : null;
        CU.uCDim.value += ((hv ? 1 : 0) - CU.uCDim.value)*Math.min(1, dt*3);
        for (const e of ELS){
          const tg = e === hv ? 1 : 0, ea = e.ea;
          ea.value += (tg - ea.value)*Math.min(1, dt*(tg ? 3.2 : 2.4));
          if (ea.value < .002) ea.value = 0;
          const dv = ea.value > .01; for (const o of e.det) o.visible = dv;
          for (const [s, sz, op] of e.spr){ const k = 1 + e.es.value*ea.value; s.scale.set(sz*k, sz*k, 1); }
        }
      } };
  }

  /* 5 · ядро изнутри */
  function nucleus(){
    const g = new THREE.Group(), RE = [3.8, 3.4, 3.3];
    g.add(shell(9000*Q, RE, [0,0,0], C(0x9d8cff), .02, .65, 2.6, .8));
    g.add(shell(5000*Q, RE.map(x => x + .12), [0,0,0], C(0x9d8cff), .01, .35, 2.6, .7));
    const por = [];
    for (let k = 0; k < 120; k++){ const d = dir(), e1 = nrm([-d[1], d[0], .001]), e2 = [d[1]*e1[2] - d[2]*e1[1], d[2]*e1[0] - d[0]*e1[2], d[0]*e1[1] - d[1]*e1[0]], c = [d[0]*(RE[0] + .06), d[1]*(RE[1] + .06), d[2]*(RE[2] + .06)];
      for (let j = 0; j < 8; j++){ const a = j/8*TAU; por.push([...add(add(c, e1, Math.cos(a)*.11), e2, Math.sin(a)*.11), d]); }
      por.push([...c, d]); }
    g.add(fromArr(por, (o, v) => { o.rnd = v[3]; o.c = C(0xf0eaff); o.s = .8; }, RIM(1.2) + `a = 0.2 + 0.85*rim;`));
    const TER = [[-1.4,1.3,.4],[.2,1.9,-.6],[1.9,1.0,.2],[-2.1,-.4,-.3],[-.3,-.2,-1.1],[1.15,-.75,.6],[-1.0,-1.9,.5],[1.3,-2.0,-.8],[2.4,-.2,-1.0],[-.4,.9,1.2]];
    const TC = [C(0xb18cff), C(0x6fb0ff), C(0x7ee0d0), C(0xc79cff), C(0x8f9dff), null, C(0xa6b8ff), C(0xd59cff), C(0x78c8ff), C(0x9f8cff)];
    const FT = 5, chr = [];
    TER.forEach((c, tid) => {
      let p = add(c, dir(), .3), d = dir(); const n = Math.round((tid === FT ? 900 : 650)*Q);
      let dist = 0;
      for (let i = 0; i < n; i++){
        d = nrm(add(d, [rn(), rn(), rn()], .6));
        const off = [c[0] - p[0], c[1] - p[1], c[2] - p[2]], ol = Math.hypot(...off);
        if (ol > .85) d = nrm(add(d, off, .8/ol));
        p = add(p, d, .045); dist += .045;
        for (let q = 0; q < 2; q++) chr.push([p[0] + rn()*.015, p[1] + rn()*.015, p[2] + rn()*.015, dist, tid]);
      }
    });
    g.add(fromArr(chr, (o, v) => { const f = v[4] === FT; o.rnd = [v[3], v[4], f ? 1 : 0]; o.c = f ? mixc([.98,.38,.72], [.32,.86,.92], (Math.sin(v[3]*.9) + 1)/2) : TC[v[4]]; o.s = f ? .85 : .75; },
      `p += vec3(sin(uTime*0.5 + aRnd.x*2.0 + aRnd.y), cos(uTime*0.43 + aRnd.x*1.7), sin(uTime*0.37 + aRnd.x*1.3))*0.03;
       float sp = step(0.985, fract(sin(floor(uTime*0.7 + aSeed*7.0)*12.9898 + aSeed*78.233)*43758.5453));
       a = 0.36 + aRnd.z*0.3 + sp*1.2; col = mix(col, vec3(1.0, 0.95, 0.8), sp); s *= 1.0 + sp;`));
    const NO = [-.8, .6, .2];
    g.add(pts(1800*Q, (i, o) => { const r = i % 5 === 0 ? .12 : .36; o.p = [NO[0] + gauss()*r, NO[1] + gauss()*r, NO[2] + gauss()*r]; o.c = i % 5 === 0 ? C(0xffd0e8) : C(0xff6fb0); o.s = .8; },
      `p += aRnd*0.01*sin(uTime + aSeed*20.0); a = 0.45;`));
    const ng = glow(0xff6fb0, 1.8, .3); ng.position.set(...NO); g.add(ng);
    g.add(pts(2400*Q, (i, o) => { const d = dir(), r = Math.cbrt(Math.random())*3.1; o.p = d.map(x => x*r); o.c = CREAM; o.s = .4; },
      `p += vec3(sin(uTime*0.2 + aSeed*30.0), cos(uTime*0.17 + aSeed*20.0), 0.0)*0.06; a = 0.1;`));
    const fg = glow(0xff8fcf, 1.4, .3); fg.position.set(...TER[FT]); g.add(fg);
    return { g, f: V3(...TER[FT]), upd(t){ g.rotation.y = Math.sin(t*.08)*.3; g.rotation.x = Math.sin(t*.06)*.1; } };
  }

  /* 6 · метафазная хромосома — спираль спиралей */
  function chromosome(){
    const g = new THREE.Group(), tc = .36;
    const axis = (side, t) => {
      const top = [.62*side, 2.35], cm = [.17*side, .3], bot = [.8*side, -3.05];
      if (t < tc){ const u = t/tc; return [top[0] + (cm[0] - top[0])*u + Math.sin(u*Math.PI)*.1*side, top[1] + (cm[1] - top[1])*u]; }
      const u = (t - tc)/(1 - tc); return [cm[0] + (bot[0] - cm[0])*u + Math.sin(u*Math.PI)*.16*side, cm[1] + (bot[1] - cm[1])*u];
    };
    const hash = x => { const s = Math.sin(x*127.1)*43758.5453; return s - Math.floor(s); };
    const arr = [];
    [-1, 1].forEach(side => {
      for (let i = 0; i < 11000*Q; i++){
        const t = Math.random(), A = axis(side, t), B = axis(side, Math.min(1, t + .002)), T = nrm([B[0] - A[0], B[1] - A[1], 0]), N = [-T[1], T[0], 0];
        const endc = Math.sqrt(Math.max(0, 1 - (Math.max(0, .06 - Math.min(t, 1 - t))/.06)**2));
        const w = .36*(.5 + .5*smooth(0, .1, Math.abs(t - tc)))*(.25 + .75*endc);
        const halo = Math.random() < .22;
        let p;
        if (halo){ const a = Math.random()*TAU, r = w*(.9 + Math.random()*.45); p = [A[0] + N[0]*Math.cos(a)*r, A[1] + N[1]*Math.cos(a)*r, Math.sin(a)*r]; }
        else {
          const th1 = t*40*TAU, r1 = w*.72, th2 = th1*11, r2 = .07;
          const rad = [N[0]*Math.cos(th1), N[1]*Math.cos(th1), Math.sin(th1)];
          p = [A[0] + rad[0]*r1, A[1] + rad[1]*r1, rad[2]*r1];
          p = add(add(p, rad, r2*Math.cos(th2)), T, r2*Math.sin(th2));
          p = add(p, [rn(), rn(), rn()], .012);
        }
        const bandA = hash(Math.floor(t*24)) < .45 ? .35 : .85;
        const gold = t < .025 || t > .975 || Math.abs(t - tc) < .02;
        arr.push([p[0], p[1], p[2], t, halo ? 1 : 0, bandA, gold ? 1 : 0]);
      }
    });
    g.add(fromArr(arr, (o, v) => { o.rnd = [v[3], v[4], v[5]]; o.c = v[6] ? GOLD : mixc([.98, .38, .72], [.32, .86, .92], v[3]); o.s = v[4] ? .45 : .65; },
      `float sh = 0.55 + 0.45*sin(uTime*1.2 - aRnd.x*40.0);
       a = mix(aRnd.z*(0.6 + 0.4*sh), 0.1, aRnd.y);
       p += vec3(position.xy, 0.0)*sin(uTime*0.5 + aRnd.x*9.0)*0.006;`));
    // веретено деления
    const sp = [];
    [-1, 1].forEach(s => { for (let k = 0; k < 14; k++){ const pole = [6.8*s, .3 + rn()*.2, rn()*.3], st = [.2*s, .3 + (k - 7)*.03, (k % 3 - 1)*.15];
      for (let q = 0; q < 110*Q; q++){ const u = Math.random(); sp.push([st[0] + (pole[0] - st[0])*u, st[1] + (pole[1] - st[1])*u + Math.sin(u*Math.PI)*(k - 7)*.13, st[2] + (pole[2] - st[2])*u, u]); } } });
    g.add(fromArr(sp, (o, v) => { o.rnd = [v[3], 0, 0]; o.c = C(0x7ee0d0); o.s = .45; }, `a = 0.18*(1.0 - smoothstep(0.55, 1.0, aRnd.x)) + 0.25*step(0.96, fract(aRnd.x*6.0 - uTime*0.2));`));
    const kg = glow(0xffc070, .8, .6); kg.position.set(0, .3, 0); g.add(kg);
    const fa = axis(1, .72);
    return { g, f: V3(fa[0], fa[1], 0), upd(t){ g.rotation.y = Math.sin(t*.12)*.4; } };
  }

  /* 7 · двойная спираль — мост к станции VIII */
  function helix(){
    const g = new THREE.Group(), h = new THREE.Group(); g.add(h); h.rotation.z = .28;
    const hx = `float v = position.x; float y = (v - 0.5)*7.6; float ang = v*16.3 + uTime*0.35; float rr = 1.05;`;
    h.add(pts(3000*Q, (i, o) => { o.p = [Math.random(), i % 2, 0]; o.rnd = [rn()*.07, rn()*.07, rn()*.07]; o.s = .7 + Math.random()*.6; },
      hx + `ang += position.y*3.14159; p = vec3(cos(ang)*rr, y, sin(ang)*rr) + aRnd;
       col = position.y < 0.5 ? vec3(0.98,0.38,0.72) : vec3(0.32,0.86,0.92); a = 0.85;`));
    h.add(pts(64*22*Q, (i, o) => { const r = Math.floor(i/22); o.p = [(r + .5)/64, (i % 22)/21, 0]; o.c = GOLD; o.s = .5; },
      hx + `vec3 A = vec3(cos(ang)*rr, y, sin(ang)*rr); vec3 B = vec3(cos(ang + 3.14159)*rr, y, sin(ang + 3.14159)*rr); p = mix(A, B, position.y); a = 0.45;`));
    h.add(glow(0xd060a0, 7, .12));
    return { g, f: V3(0, 0, 0), upd(){} };
  }

  const SC = [tissue(), neurons(), blood(), cell(), nucleus(), chromosome(), helix()];
  // пролёт сквозь губчатое вещество позвонка (переход «Скелет → Ткани»)
  const TUN = (() => {
    const g = new THREE.Group(); mscene.add(g); g.visible = false;
    const nodes = [];
    for (let i = 0; i < 300; i++) nodes.push([rn()*6.5, rn()*4.6, -Math.random()*62]);
    const seg = [];
    nodes.forEach((a, i) => {
      const ds = nodes.map((b, j) => [Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] - a[2])*.7), j]).filter(q => q[1] !== i).sort((x, y) => x[0] - y[0]);
      for (let k = 0; k < 3; k++){ const j = ds[k][1]; if (j > i || k === 0) seg.push([a, nodes[j]]); }
    });
    const st = [];
    seg.forEach(([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.min(90, Math.round(L/(.09/Math.sqrt(Q))));
      const th = .06 + Math.random()*.08;
      for (let q = 0; q < n; q++){ const u = q/n, w = th*(1 + .8*Math.pow(Math.abs(u - .5)*2, 2)); st.push([a[0] + (b[0] - a[0])*u + rn()*w, a[1] + (b[1] - a[1])*u + rn()*w, a[2] + (b[2] - a[2])*u + rn()*w]); } });
    const fly = { value:0 };
    const tc = pts(st.length, (i, o) => { o.p = st[i]; o.c = mixc(CREAM, GOLD, Math.random()*.5); o.s = .9 + Math.random()*.8; },
      `p.z = position.z + uFly;
       a = 0.75*smoothstep(-62.0, -38.0, p.z)*(1.0 - smoothstep(-1.2, 0.3, p.z));
       col = mix(col, vec3(1.0, 0.95, 0.85), smoothstep(-8.0, -1.0, p.z)*0.5);`, 1, "uniform float uFly;\n");
    tc.material.uniforms.uFly = fly; g.add(tc);
    const mc = pts(5000*Q, (i, o) => { o.p = [rn()*7, rn()*5, -Math.random()*62]; o.c = mixc(C(0xff4d5e), C(0xffb070), Math.random()*.4); o.s = .5 + Math.random()*.6; },
      `p.z = position.z + uFly*0.97; p.xy += vec2(sin(uTime*0.6 + aSeed*30.0), cos(uTime*0.5 + aSeed*20.0))*0.05;
       a = 0.45*smoothstep(-62.0, -38.0, p.z)*(1.0 - smoothstep(-1.2, 0.3, p.z));`, 1, "uniform float uFly;\n");
    mc.material.uniforms.uFly = fly; g.add(mc);
    return { g, mats:[tc.material, mc.material], upd(D, hE, Z0){
      const o = hE*smooth(8.34, 8.5, D)*(1 - smooth(8.84, 9.05, D));
      g.visible = o > .003; if (!g.visible) return;
      fly.value = smooth(8.34, 9.0, D)*60;
      g.position.z = 0; g.scale.setScalar(Z0 < -12 ? .62 : 1);
      this.mats.forEach(m => { m.uniforms.uOpacity.value = o; m.uniforms.uSize.value = 1; });
    } };
  })();
  const LV = [9, 10, 11, 12, 13, 14, 15];
  const TINTS = [0x1c100c, 0x0d0b24, 0x1f070c, 0x061a1b, 0x0f0a24, 0x190a1c, 0x190a1c].map(h => new THREE.Color(h));
  const bgM = new THREE.ShaderMaterial({
    uniforms:{ uA:{value:0}, uTint:{value:new THREE.Color()}, uC:{value:new THREE.Vector2(.68, .5)}, uAsp:{value:1} },
    vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader:`uniform float uA; uniform vec3 uTint; uniform vec2 uC; uniform float uAsp; varying vec2 vUv;
      void main(){ vec2 d = vUv - uC; d.x *= uAsp; float r = length(d); vec3 c = mix(uTint*1.6, vec3(0.018, 0.022, 0.045), smoothstep(0.0, 0.9, r)); gl_FragColor = vec4(c, uA); }`,
    transparent:true, depthTest:false, depthWrite:false });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgM); bg.frustumCulled = false; bg.renderOrder = -100; mscene.add(bg);
  SC.forEach(sc => {
    sc.h = new THREE.Group(); sc.h.add(sc.g); mscene.add(sc.h); sc.h.visible = false;
    sc.pm = []; sc.om = [];
    sc.g.traverse(o => { if (!o.material) return; if (o.isPoints) sc.pm.push(o.material); else if (o.material.uniforms && o.material.uniforms.uOp) sc.om.push([o.material, 1, true]); else sc.om.push([o.material, o.material.opacity ?? 1, false]); });
    sc.fw = new THREE.Vector3();
  });
  const anchor = new THREE.Vector3(), tmp = new THREE.Vector3(), ZIN = [5, 5, 2.1/.22, 5, 5, 5, 5], pv = new THREE.Vector3();
  const rcM = new THREE.Raycaster(), nd = new THREE.Vector2(), inv = new THREE.Matrix4();
  let CHIT = null; const ekeys = new Map(); const ELKEY = e => { if (!ekeys.has(e)) ekeys.set(e, ekeys.size + 1); return ekeys.get(e); };
  return {
    somScreen(i){ const sc = SC[1]; sc.h.updateMatrixWorld(true); const c = sc.som[i]; pv.set(c[0], c[1], c[2]).applyMatrix4(sc.g.matrixWorld).project(mcam); return [(pv.x + 1)/2*W, (1 - pv.y)/2*H]; },
    // курсор в микромире: сосуд (11) и клетка (12)
    pointer(nx, ny, onBlood, onCell){
      const sb = SC[2];
      BH.on.value += ((onBlood && sb.h.visible ? 1 : 0) - BH.on.value)*.15;
      if (onBlood && sb.h.visible){
        sb.v.updateMatrixWorld(true);
        rcM.setFromCamera(nd.set(nx, ny), mcam);
        inv.copy(sb.v.matrixWorld).invert();
        const o = BH.ro.value.copy(rcM.ray.origin).applyMatrix4(inv);
        BH.rd.value.copy(rcM.ray.origin).add(rcM.ray.direction).applyMatrix4(inv).sub(o).normalize();
      }
      const sc = SC[3];
      CHIT = onCell && sc.h.visible ? sc.pick((nx + 1)/2*W, (1 - ny)/2*H, true) : (sc.pick(0, 0, false), null);
    },
    cellDbg(){ return SC[3].dbg(); },
    cellHit(){ const c = CHIT; if (!c) return null; return { kind:"cell", h:Math.max(.35, c.e.ea.value), box:c.box, m:{ id:ELKEY(c.e), name:c.e.name, desc:c.e.desc, note:c.e.note } }; },
    neuronBox(){ return NH.box; },
    pickNeuron(nx, ny, on){
      NH.nid = -1;
      if (!on) return -1;
      const sc = SC[1]; if (!sc.h.visible) return -1;
      sc.h.updateMatrixWorld(true);
      let best = -1, bd = 1e9;
      sc.som.forEach((c, i) => {
        pv.set(c[0], c[1], c[2]).applyMatrix4(sc.g.matrixWorld).project(mcam);
        const dx = (pv.x - nx)*W/2, dy = (pv.y - ny)*H/2, d = Math.hypot(dx, dy);
        if (d < bd){ bd = d; best = i; }
      });
      NH.nid = bd < Math.max(46, Math.min(W, H)*.05) ? best : -1;
      if (NH.nid >= 0){ const c = sc.som[NH.nid]; pv.set(c[0], c[1], c[2]).applyMatrix4(sc.g.matrixWorld).project(mcam); NH.box = { x:(pv.x + 1)/2*W, y:(1 - pv.y)/2*H, r:30 + 30*sc.h.scale.x }; } else NH.box = null;
      return NH.nid;
    },
    update(D, hE, T, px, py, portrait){
      const M = hE*smooth(8.4, 8.62, D);
      bgM.uniforms.uA.value = M;
      const ti = clamp(D - 9, 0, 6), i0 = Math.floor(ti), i1 = Math.min(6, i0 + 1);
      bgM.uniforms.uTint.value.copy(TINTS[i0]).lerp(TINTS[i1], smooth(0, 1, ti - i0));
      bgM.uniforms.uC.value.set(portrait ? .5 : .69, portrait ? .79 : .5); bgM.uniforms.uAsp.value = W/H;
      const Z0 = portrait ? -17 : -10;
      TUN.upd(D, hE, Z0);
      let any = M > .003;
      anchor.set(0, 0, 0);
      SC.forEach((sc, k) => {
        const L = LV[k], x = D - L;
        const inn = k === 0 ? smooth(8.66, 8.97, D) : smooth(L - .98, L - .45, D);
        const out = k === 6 ? 1 : 1 - smooth(.3, .82, x);
        const o = hE*inn*out, vis = o > .003;
        sc.h.visible = vis; any = any || vis;
        sc.upd(T, vis);
        const xc = clamp(x, -1.4, 1.1), s = Math.pow(xc < 0 ? ZIN[k] : ZIN[Math.min(6, k + 1)], xc);
        sc.g.updateMatrixWorld(true);
        tmp.copy(sc.f); if (sc.fObj) tmp.applyMatrix4(sc.fObj.matrix); tmp.applyMatrix4(sc.g.matrix);
        // сцена k: пока глубже не зашли — стоит в точке фокуса предыдущей; дальше её фокус уезжает в центр
        if (x >= 0){ const w = smooth(0, 1, x); sc.h.position.set(-tmp.x*s*w, -tmp.y*s*w, Z0); }
        else sc.h.position.set(anchor.x, anchor.y, Z0);
        anchor.set(sc.h.position.x + tmp.x*s, sc.h.position.y + tmp.y*s, 0);
        sc.h.scale.setScalar(s);
        sc.h.rotation.set(-py*.06, px*.1, 0);
        if (vis){
          for (const m of sc.pm){ m.uniforms.uOpacity.value = o; m.uniforms.uSize.value = s; }
          for (const [m, b, u] of sc.om){ if (u) m.uniforms.uOp.value = o; else m.opacity = b*o; }
        }
      });
      mscene.visible = any || TUN.g.visible;
      return M;
    }
  };
})();
