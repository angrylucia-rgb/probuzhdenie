/* ---------- протон-протонный цикл --------------------------------------
   Шаги расписаны по времени и разыграны настоящими точками: четыре протона
   сходятся парами в дейтроны (в стороны уходят позитрон и нейтрино), каждый
   дейтрон ловит ещё протон и становится гелием-3 (наружу уходит гамма-квант),
   два гелия-3 сливаются в гелий-4 и отдают два протона обратно. Цикл 15 с.  */
function makeFusion(put, UP){
  const N = 36, SC = .62;                      // вся сцена реакции укладывается внутрь ядра
  const pos = new Float32Array(N*3), col = new Float32Array(N*3), siz = new Float32Array(N),
        sed = new Float32Array(N), rnd = new Float32Array(N*3);
  for (let i = 0; i < N; i++){ siz[i] = 4.2; sed[i] = Math.random(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(siz, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(sed, 1));
  geo.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 3));
  const mat = pmat(`a = aSize > 0.01 ? 0.98*uSharp : 0.0; s *= 1.9; { vec3 dvq = p - uCur; float ddq = length(dvq); float infq = uHov*exp(-ddq*ddq/(uRad*uRad)); a /= 1.0 + infq*1.4; s /= 1.0 + infq*0.6; }`);
  const P4 = new THREE.Points(geo, mat); P4.frustumCulled = false;

  // фон: горячая плотная плазма ядра
  const bg = pts(Math.max(60, Math.round(9000*Q)), (i,o) => { const v = dir(), r = Math.pow(Math.random(), .38);
      o.p = [v[0]*r*1.05, v[1]*r*1.05, v[2]*r*1.05];
      o.c = mixc(C(0xfff2d0), C(0xff9a3a), Math.random()); o.s = .5 + Math.random()*.7; },
    `p = position*(1.0 + 0.01*sin(uTime*4.0 + aSeed*80.0));
     a = (0.07 + 0.16*fract(aSeed*29.0))*uSharp; { vec3 dvq = p - uCur; float ddq = length(dvq); float infq = uHov*exp(-ddq*ddq/(uRad*uRad)); a /= 1.0 + infq*1.4; s /= 1.0 + infq*0.6; }`);
  put(11, bg); put(11, P4);

  // подписи: без них цепочка читается как танец точек, а с ними — как реакция
  const LF = "500 40px 'JetBrains Mono', ui-monospace, monospace";
  const mkL = (txt, c) => { const l = label(txt, LF, c || "#FFE9C4", .17); l.visible = false; put(11, l); return l; };
  const LB = { pL:mkL("p"), pL2:mkL("p"), dL:mkL("²H"), heL:mkL("³He"),
               pR:mkL("p"), pR2:mkL("p"), dR:mkL("²H"), heR:mkL("³He"),
               he4:mkL("⁴He", "#FFF6E2"), nu:mkL("ν", "#9FD4FF"), ga:mkL("γ", "#FFE98A"), po:mkL("e⁺", "#BFFFD8") };
  const LA = Object.keys(LB).map(k => LB[k]);
  const lset = (l, x, y, o) => { l.visible = o > .05; l.material.opacity = .95*o;
                                 l.position.set(x*SC, y*SC + .17, 0); };

  const PR = [1.0, .42, .14], NE = [.92, .95, 1.0], NU = [.45, .82, 1.0], GA = [1.0, .95, .5], PO = [.8, 1.0, .8];
  const S = { active:false };
  let T = 0;
  const set = (i, x, y, z, c, s) => { pos[i*3] = x*SC; pos[i*3+1] = y*SC; pos[i*3+2] = z*SC;
    col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2]; siz[i] = s; };
  const lerp = (a, b, k) => a + (b - a)*k;
  const CYC = 12;

  UP.push((t, dt) => {
    if (!S.active){
      for (let i = 0; i < N; i++) siz[i] = 0;
      for (const l of LA) l.visible = false;
      geo.attributes.aSize.needsUpdate = true; return;
    }
    T = (T + dt) % CYC;
    const u = T;
    for (let i = 0; i < N; i++) siz[i] = 0;
    for (const l of LA) l.visible = false;

    for (let br = 0; br < 2; br++){
      const sx = br ? 1 : -1, base = br*16, X = x => sx*x;
      const Lc = br ? LB.pR : LB.pL, Lc2 = br ? LB.pR2 : LB.pL2,
            Ld = br ? LB.dR : LB.dL, Lh = br ? LB.heR : LB.heL;
      // 1 · два протона сходятся
      if (u < 2.6){
        const k = smooth(0, 2.6, u);
        set(base+0, X(lerp(1.15, .26, k)), lerp(.58, .07, k), 0, PR, 4.4);
        set(base+1, X(lerp(1.02, .26, k)), lerp(-.60, -.07, k), 0, PR, 4.4);
        const fo = 1 - smooth(1.9, 2.55, u);
        lset(Lc, X(lerp(1.15, .26, k)), lerp(.58, .07, k), fo);
        lset(Lc2, X(lerp(1.02, .26, k)), lerp(-.60, -.07, k) - .34, fo);
      }
      // 2 · дейтрон; наружу уходят позитрон и нейтрино, подходит третий протон
      else if (u < 5.2){
        const fl = 1 - smooth(2.6, 3.15, u), out = smooth(2.7, 5.2, u), kp = smooth(3.2, 5.2, u);
        set(base+0, X(.26), .07, 0, PR, 4.4);
        set(base+1, X(.26), -.07, 0, NE, 4.4);
        if (fl > .02) set(base+2, X(.26), 0, 0, GA, 4 + 13*fl);
        set(base+3, X(.26 + out*1.0), .12 + out*.78, 0, PO, 3.0);
        set(base+4, X(.26 + out*1.5), -.10 - out*1.0, 0, NU, 2.6);
        set(base+5, X(lerp(1.3, .46, kp)), lerp(-.85, 0, kp), 0, PR, 4.4);
        lset(Ld, X(.26), .10, smooth(2.9, 3.4, u)*(1 - smooth(4.9, 5.2, u)));
        if (br === 0){ lset(LB.po, X(.26 + out*1.0), .12 + out*.78, out*(1 - smooth(.8, 1, out)));
                       lset(LB.nu, X(.26 + out*1.5), -.10 - out*1.0, out*(1 - smooth(.8, 1, out))); }
        lset(Lc, X(lerp(1.3, .46, kp)), lerp(-.85, 0, kp) - .34, 1 - smooth(.6, .95, kp));
      }
      // 3 · гелий-3 и гамма-квант
      else if (u < 8.0){
        const fl = 1 - smooth(5.2, 5.75, u), out = smooth(5.3, 8.0, u);
        set(base+0, X(.32), .10, 0, PR, 4.4);
        set(base+1, X(.24), -.10, 0, NE, 4.4);
        set(base+5, X(.44), .0, 0, PR, 4.4);
        if (fl > .02) set(base+2, X(.33), 0, 0, GA, 4 + 15*fl);
        set(base+6, X(.33 + out*.9), .14 + out*.95, 0, GA, 3.2);
        lset(Lh, X(.33), .12, smooth(5.5, 6.0, u)*(1 - smooth(7.7, 8.0, u)));
        if (br === 0) lset(LB.ga, X(.33 + out*.9), .14 + out*.95, out*(1 - smooth(.85, 1, out)));
      }
      // 4 · два гелия-3 сходятся
      else if (u < 9.8){
        const k = smooth(8.0, 9.7, u);
        set(base+0, X(lerp(.32, .10, k)), .10, 0, PR, 4.4);
        set(base+1, X(lerp(.24, .10, k)), -.10, 0, NE, 4.4);
        set(base+5, X(lerp(.44, .28, k)), 0, 0, PR, 4.4);
        lset(Lh, X(lerp(.36, .19, k)), .12, 1 - smooth(.7, 1, k));
      }
      // 5 · гелий-4 и два протона обратно
      else {
        const out = smooth(9.8, 12, u), fl = 1 - smooth(9.8, 10.4, u);
        set(base+0, X(.10), .10, 0, PR, 4.6);
        set(base+1, X(.10), -.10, 0, NE, 4.6);
        if (br === 0 && fl > .02) set(34, 0, 0, 0, GA, 5 + 20*fl);
        set(base+5, X(.30 + out*1.35), .28 + out*.75, 0, PR, 3.4);
        if (br === 0) lset(LB.he4, 0, .22, smooth(10.1, 10.6, u)*(1 - smooth(11.7, 12, u)));
        lset(Lc, X(.30 + out*1.35), .28 + out*.75, out*(1 - smooth(.85, 1, out)));
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
  });
  return S;
}

