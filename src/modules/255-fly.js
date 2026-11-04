/* ---------- v186: «Сколько лететь» — первая глава «Глубокого космоса» ----------
   Цель × транспорт → время пути. Полёт по логарифмическому туннелю: счётчики, линейка расстояний, на подлёте —
   сама цель. Режим «1 g»: корабль весь путь идёт с ускорением земной тяжести (половину пути разгон, половину
   торможение); два хода часов — на корабле и на Земле, и настоящие релятивистские эффекты неба:
   аберрация (звёзды сбегаются вперёд) и эффект Доплера (впереди голубеет, позади краснеет; на огромных
   скоростях впереди разгорается реликтовое излучение, сдвинутое в видимый свет).
   Числа ● — расчёт по средним расстояниям; ◐ — у расстояния большая погрешность или проект.
   Сцена — свой WebGL-контекст, создаётся при открытии главы и освобождается при закрытии.            */
const FLY_LY = 9.4607e12, FLY_C = 299792.458, FLY_YR = 3.15576e7, FLY_G = 9.81e-3;   // км, км/с, с, км/с²
const FLY_DEST = [
  { id:"moon", g:0, nm:"Луна", km:384400, kind:"body", map:"moon", col:0xe8e4da,
    note:"Среднее расстояние ●. «Аполлон-11» долетел за 3 суток." },
  { id:"mars", g:0, nm:"Марс", km:225e6, kind:"body", map:"mar", col:0xd06b3c,
    note:"Среднее расстояние ●: ближе всего — 55,8 млн км (2003), дальше всего — 401 млн км." },
  { id:"sun", g:0, nm:"Солнце", km:1.496e8, kind:"star", col:0xffe2a0, r:6,
    note:"Одна астрономическая единица ●. Свет идёт 8 минут 19 секунд." },
  { id:"jup", g:0, nm:"Юпитер", km:7.78e8, kind:"body", map:"jup", col:0xd8c0a0,
    note:"Среднее расстояние от Солнца ●; от Земли — от 588 до 968 млн км." },
  { id:"nep", g:0, nm:"Нептун", km:4.5e9, kind:"body", map:"nep", col:0x5a7bd8,
    note:"Около 30 астрономических единиц ●. «Вояджер-2» пролетел мимо в 1989 году." },
  { id:"voy", g:0, nm:"«Вояджер-1»", km:2.59e10, kind:"probe", col:0xffffff,
    note:"Самый далёкий аппарат людей ●: летит с 1977 года, 18 ноября 2026 года удалится от Земли на одни световые сутки." },
  { id:"oort", g:1, nm:"Облако Оорта", ly:1, kind:"oort", col:0x9fb6ff,
    note:"◐ Сфера ледяных тел от тысяч астрономических единиц до светового года и дальше; напрямую её не видели." },
  { id:"prox", g:1, nm:"Проксима Центавра", ly:4.2465, kind:"star", col:0xff7a4a, r:3,
    note:"Ближайшая звезда ●: красный карлик, у него есть планета в зоне, где возможна жидкая вода." },
  { id:"sir", g:1, nm:"Сириус", ly:8.6, kind:"star", col:0xcfe0ff, r:5,
    note:"Самая яркая звезда ночного неба ●. В Египте по его восходу вели календарь разлива Нила." },
  { id:"vega", g:1, nm:"Вега", ly:25, kind:"star", col:0xdfe8ff, r:5,
    note:"● 25 световых лет. Через 12 000 лет из-за прецессии земной оси снова станет Полярной звездой." },
  { id:"ple", g:1, nm:"Плеяды", ly:444, kind:"cluster", col:0xa8c4ff,
    note:"◐ Около 444 световых лет. У многих народов — «семь сестёр», на Руси — Стожары." },
  { id:"bet", g:1, nm:"Бетельгейзе", ly:550, kind:"star", col:0xff6a3a, r:9,
    note:"◐ От 400 до 650 световых лет. Красный сверхгигант; когда-нибудь вспыхнет сверхновой." },
  { id:"ori", g:1, nm:"Туманность Ориона", ly:1344, kind:"neb", col:0xff7ab0,
    note:"● Около 1 344 световых лет. Ближайшая большая колыбель звёзд, видна глазом в мече Ориона." },
  { id:"crab", g:1, nm:"Крабовидная туманность", ly:6500, kind:"crab", col:0xff9a5a,
    note:"◐ Около 6 500 световых лет. Остаток сверхновой, которую в 1054 году записали китайские астрономы; в центре — пульсар." },
  { id:"gc", g:2, nm:"Центр Галактики", ly:26670, kind:"core", col:0xffd59a,
    note:"● Около 26 700 световых лет. Там чёрная дыра Стрелец A* — 4 миллиона масс Солнца." },
  { id:"lmc", g:2, nm:"Большое Магелланово Облако", ly:1.6e5, kind:"irr", col:0xcfd8ff,
    note:"● Около 160 000 световых лет. Спутник нашей Галактики, виден в южном небе." },
  { id:"and", g:2, nm:"Галактика Андромеды", ly:2.5e6, kind:"spiral", inc:.24, pa:.62, col:0xffe9c8,
    note:"● Около 2,5 миллиона световых лет. Самый далёкий объект, видимый без телескопа." },
  { id:"q3c", g:2, nm:"Квазар 3C 273", ly:2.4e9, kind:"qso", col:0xcfe8ff,
    note:"◐ Свет шёл 2,4 миллиарда лет. Расширение Вселенной здесь не учтено — путь только по времени света." },
  { id:"edge", g:2, nm:"Край наблюдаемой Вселенной", ly:4.65e10, kind:"edge", col:0xffa060,
    note:"● Сейчас около 46,5 миллиарда световых лет. Долететь нельзя даже со скоростью света: Вселенная расширяется с ускорением." }
];
FLY_DEST.forEach(d => { if (d.ly) d.km = d.ly*FLY_LY; });
const FLY_GRP = ["Солнечная система", "Звёзды и туманности", "Галактики и дальше"];
const FLY_VEH = [
  { id:"walk", nm:"Пешком", kms:5/3600, note:"5 км/ч, без сна и отдыха." },
  { id:"car", nm:"Автомобиль", kms:100/3600, note:"100 км/ч без остановок." },
  { id:"jet", nm:"Самолёт", kms:900/3600, note:"900 км/ч — крейсерская скорость лайнера." },
  { id:"iss", nm:"Скорость МКС", kms:7.66, note:"● 7,66 км/с: станция облетает Землю 16 раз в сутки." },
  { id:"voy", nm:"«Вояджер-1»", kms:17, note:"● Около 17 км/с относительно Солнца — после гравитационных манёвров у Юпитера и Сатурна." },
  { id:"psp", nm:"Зонд Parker", kms:191.7, note:"● 191,7 км/с — рекорд скорости аппаратов людей, 24 декабря 2024 года у Солнца." },
  { id:"sail", nm:"Световой парус", beta:.2, note:"◐ Проект Breakthrough Starshot: граммовые зонды на парусах, разогнанные лазером до 20% скорости света." },
  { id:"light", nm:"Свет", beta:1, note:"● 299 792 км/с — быстрее не движется ничто." },
  { id:"g1", nm:"Корабль 1 g", acc:true, note:"Ускорение земной тяжести весь путь: половину пути разгон, половину — торможение. На борту привычный вес." }
];

const FLY = (() => {
  const box = $("chFly"); let cvs = $("flyCv");
  let open = false, built = false, raf = 0, last = 0, rend, scn, cam, stars, dust, cmb, tgt = null, tgtKind = "";
  let dI = 0, vI = 7, u = 0, uT = 0, flying = false, arr = 0;
  const EN = SITE_LANG === "en";
  // дробное число в русском — родительный единственного: «4,25 светового года», «13,9 часа» (f, по умолчанию b)
  const plu = (n, a, b, c, f) => { if (EN) return nf(Math.abs(n)) === "1" ? a : c; if (/,/.test(nf(n))) return f || b; n = Math.abs(Math.round(n)); const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
  // число словами + согласованное слово: «26 670 лет», «4,4 млрд лет», «38,7 раза»; согласуем с тем, что показано, а не с точным числом
  const num = w => +(EN ? w.replace(/[,\s]/g, "") : w.replace(/\s/g, "").replace(",", "."));
  const bp = (x, a, b, c, f) => { const w = big(x); return w + " " + (/ (млн|млрд|трлн)$/.test(w) ? c : plu(num(w), a, b, c, f)); };
  const nf = (x, d) => x.toLocaleString("ru-RU", { maximumSignificantDigits: d || 3 });
  const nfi = x => Math.round(x).toLocaleString("ru-RU");
  // крупные числа — словами: 4,4 млрд
  function big(x){ const a = Math.abs(x);
    if (a >= 1e12) return nf(x/1e12) + " трлн"; if (a >= 1e9) return nf(x/1e9) + " млрд"; if (a >= 1e6) return nf(x/1e6) + " млн";
    return a >= 1e4 ? nfi(Math.round(x/10)*10) : a >= 100 ? nfi(x) : nf(x); }
  // время (с) — в привычных единицах
  function fmtT(s){
    if (!isFinite(s)) return "—";
    if (s < 1e-3) return EN ? "no time at all" : "мгновенно";
    if (s < 60) return nf(s) + " " + plu(s, "секунда", "секунды", "секунд");
    if (s < 3600){ const t = Math.round(s), m = Math.floor(t/60), r = t % 60; return m + " " + plu(m, "минута", "минуты", "минут") + (r ? " " + r + " " + plu(r, "секунда", "секунды", "секунд") : ""); }
    if (s < 172800){ const h = s/3600; return nf(h) + " " + plu(h, "час", "часа", "часов"); }
    if (s < FLY_YR*2){ const d = s/86400; return nf(d) + " " + plu(d, "сутки", "суток", "суток"); }
    return bp(s/FLY_YR, "год", "года", "лет");
  }
  function fmtD(km){
    if (km < 1e6) return nfi(km) + " км";
    if (km < 1.5e12) return big(km) + " км";
    return bp(km/FLY_LY, "световой год", "световых года", "световых лет", "светового года");
  }
  // путь s (км) → время на Земле и на борту (с), скорость (β) и быстрота (η)
  function at(s, D, V){
    if (V.acc){
      const h = D/2, cs = FLY_C*FLY_C/FLY_G, ca = FLY_C/FLY_G;
      const half = x => { const g = 1 + x/cs, e = Math.acosh(g); return { T: ca*Math.sinh(e), tau: ca*e, eta: e }; };
      const H = half(h);
      if (s <= h){ const r = half(s); return { T: r.T, tau: r.tau, eta: r.eta }; }
      const r = half(D - s); return { T: 2*H.T - r.T, tau: 2*H.tau - r.tau, eta: r.eta };
    }
    const v = V.beta ? V.beta*FLY_C : V.kms, T = s/v;
    const g = V.beta ? 1/Math.sqrt(1 - Math.min(.999999, V.beta)**2) : 1;
    return { T, tau: V.beta === 1 ? 0 : T/g, eta: V.beta ? Math.atanh(Math.min(.9999, V.beta)) : 0 };
  }
  // событие «Космического календаря», ближайшее к моменту старта (лет назад)
  function evAt(y){ let best = null; for (const e of CHR_EV){ if (e.ago > 0 && e.ago <= y*1.2 && (!best || e.ago > best.ago)) best = e; } return best; }

  /* ---------- сцена ---------- */
  const BB = `vec3 bb(float T){ T = clamp(T, 1000.0, 40000.0)/100.0;
    float r = T <= 66.0 ? 1.0 : clamp(1.292936*pow(T - 60.0, -0.1332047), 0.0, 1.0);
    float g = T <= 66.0 ? clamp(0.3900816*log(T) - 0.6318414, 0.0, 1.0) : clamp(1.129891*pow(T - 60.0, -0.0755148), 0.0, 1.0);
    float b = T >= 66.0 ? 1.0 : (T <= 19.0 ? 0.0 : clamp(0.5432068*log(T - 10.0) - 1.1962541, 0.0, 1.0));
    return vec3(r, g, b); }`;
  const FRAGP = `varying vec3 vC; varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); float g = smoothstep(0.5, 0.0, r); g *= g; if (g*vA < 0.003) discard; gl_FragColor = vec4(vC, g*vA); }`;
  function starField(){
    const N = Math.round(7000*Q), P = new Float32Array(N*3), TT = new Float32Array(N), M = new Float32Array(N);
    for (let i = 0; i < N; i++){ const z = Math.random()*2 - 1, a = Math.random()*TAU, r = Math.sqrt(1 - z*z);
      P[i*3] = Math.cos(a)*r; P[i*3 + 1] = Math.sin(a)*r; P[i*3 + 2] = z;
      const k = Math.random(); TT[i] = k < .55 ? 3000 + Math.random()*2500 : k < .85 ? 5000 + Math.random()*2500 : 7500 + Math.random()*22000;
      M[i] = Math.pow(Math.random(), 4)*1.6 + .12; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("aT", new THREE.BufferAttribute(TT, 1)); g.setAttribute("aM", new THREE.BufferAttribute(M, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uEta: { value: 0 }, uPR: { value: 1 }, uOp: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aT; attribute float aM; uniform float uEta; uniform float uPR; uniform float uOp; varying vec3 vC; varying float vA; ${BB}
      void main(){
        vec3 n = normalize(position);
        float th = acos(clamp(-n.z, -1.0, 1.0));                 // угол до направления полёта (−z) в покое
        float th1 = 2.0*atan(exp(-uEta)*tan(th*0.5));            // аберрация через быстроту η: звёзды сбегаются вперёд
        float D = cosh(uEta) + sinh(uEta)*cos(th);               // доплеровский множитель
        vec2 xy = n.xy; float l = length(xy); vec2 dx = l > 1e-6 ? xy/l : vec2(1.0, 0.0);
        vec3 n1 = vec3(dx*sin(th1), -cos(th1));
        float Tp = aT*D;
        float band = smoothstep(800.0, 2600.0, Tp)/(1.0 + pow(Tp/45000.0, 1.6));   // видимая доля света
        vA = clamp(aM*min(pow(D, 2.5), 30.0)*band, 0.0, 2.5)*uOp;
        vC = bb(Tp);
        vec4 mv = modelViewMatrix*vec4(n1*100.0, 1.0);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = uPR*(1.1 + 2.4*aM)*clamp(0.8 + 0.18*log(1.0 + D), 0.7, 2.6);
      }`, fragmentShader: FRAGP });
    return new THREE.Points(g, m);
  }
  function dustTube(){
    const N = Math.round(1800*Q), P = new Float32Array(N*3);
    for (let i = 0; i < N; i++){ const a = Math.random()*TAU, r = 1.2 + Math.pow(Math.random(), .6)*9; P[i*3] = Math.cos(a)*r; P[i*3 + 1] = Math.sin(a)*r; P[i*3 + 2] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3));
    const m = new THREE.ShaderMaterial({ uniforms: { uF: { value: 0 }, uK: { value: 0 }, uPR: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uF; uniform float uK; uniform float uPR; varying vec3 vC; varying float vA;
      void main(){ float z = fract(position.z + uF); float zz = -70.0 + z*72.0;
        vec4 mv = modelViewMatrix*vec4(position.xy, zz, 1.0); gl_Position = projectionMatrix*mv;
        vA = uK*smoothstep(0.0, 0.25, z)*(1.0 - smoothstep(0.92, 1.0, z))*0.55; vC = vec3(0.75, 0.82, 1.0);
        gl_PointSize = uPR*clamp(40.0/max(1.0, -mv.z), 1.0, 6.0); }`, fragmentShader: FRAGP });
    const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
  }
  // облако точек для цели: fill(i, out[x,y,z,r,g,b,size]) ; uniform uA — проявление
  function cloud(n, fill, spin){
    n = Math.round(n*Q); const P = new Float32Array(n*3), C = new Float32Array(n*3), S = new Float32Array(n), o = [0, 0, 0, 1, 1, 1, 1];
    for (let i = 0; i < n; i++){ fill(i, o, n); P.set(o.slice(0, 3), i*3); C.set(o.slice(3, 6), i*3); S[i] = o[6]; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("aC", new THREE.BufferAttribute(C, 3)); g.setAttribute("aS", new THREE.BufferAttribute(S, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uPR: { value: 1 }, uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aC; attribute float aS; uniform float uA; uniform float uPR; uniform float uT; varying vec3 vC; varying float vA;
      void main(){ vec3 p = position; float a = uT*${(spin || 0).toFixed(3)}*(1.0/(0.3 + length(p.xz))); p.xz = mat2(cos(a), -sin(a), sin(a), cos(a))*p.xz;
        vec4 mv = modelViewMatrix*vec4(p, 1.0); gl_Position = projectionMatrix*mv; vC = aC; vA = uA*0.55;
        gl_PointSize = uPR*aS*clamp(60.0/max(1.0, -mv.z), 1.0, 9.0); }`, fragmentShader: FRAGP });
    return new THREE.Points(g, m);
  }
  const col3 = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const gs = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); };
  function makeTarget(d){
    const G = new THREE.Group(), add = o => { G.add(o); return o; }, c = col3(d.col || 0xffffff);
    G.userData.parts = [];
    const glowP = (hex, s, op) => { const g = add(glow(hex, s, op)); G.userData.parts.push([g, op]); return g; };
    if (d.kind === "body"){
      const tx = BMAP.get(d.map);
      if (tx){ const b = add(bodyMesh(d.map, tx)); b.scale.setScalar(3.2); b.material.uniforms.uSolid.value = 1.0; G.userData.mesh = b; }
      else glowP(d.col, 6, .9);
      glowP(d.col, 10, .12);
    } else if (d.kind === "star"){
      glowP(d.col, d.r*1.2, 1); glowP(d.col, d.r*2.6, .45); glowP(0xffffff, d.r*.7, 1); glowP(d.col, d.r*6, .12);
    } else if (d.kind === "probe"){
      glowP(0xffffff, .5, 1); glowP(0xffe2a0, 1.6, .3);
      G.add(cloud(400, (i, o) => { const a = Math.random()*TAU, r = .6 + Math.random()*.1; o.splice(0, 7, Math.cos(a)*r*.5 + 1.2, Math.sin(a)*r*.5 + .2, 0, .9, .85, .7, .5); }));
    } else if (d.kind === "oort"){
      G.add(cloud(5000, (i, o) => { const v = dir(), r = 4 + Math.random()*5; o.splice(0, 7, v[0]*r, v[1]*r, v[2]*r, .7, .8, 1, .45 + Math.random()*.5); }));
      glowP(0xffe2a0, .8, 1);
    } else if (d.kind === "cluster"){
      for (let k = 0; k < 9; k++){ const g = glowP(0xbcd2ff, 1.4 + Math.random()*1.6, .9); g.position.set(gs()*2.2, gs()*1.6, gs()*1.2); }
      G.add(cloud(2500, (i, o) => o.splice(0, 7, gs()*3, gs()*2.2, gs()*1.5, .45, .6, 1, .9)));
    } else if (d.kind === "neb"){
      // туманность Ориона: розовое свечение водорода (H-альфа) и бирюзовое — кислорода (O III), в центре звёзды Трапеции
      G.add(cloud(9000, (i, o) => { const x = gs()*3.2, y = gs()*2.4, z = gs()*1.2, r = Math.hypot(x, y);
        const t = Math.random() < Math.exp(-r*.5) ? [.45, .95, .9] : [1, .45, .62]; o.splice(0, 7, x + Math.sin(y*1.3)*.8, y, z, ...t.map(v => v*.6), 1.3 + Math.random()*2.2); }));   // крупные тусклые точки — мягкое свечение газа, а не россыпь
      for (let k = 0; k < 4; k++){ const g = glowP(0xe8f0ff, .9, 1); g.position.set((k % 2 - .5)*.6, ((k >> 1) - .5)*.5, .2); }
    } else if (d.kind === "crab"){
      G.add(cloud(7000, (i, o) => { const v = dir(), r = 1.6 + Math.random()*1.4, f = .7 + .3*Math.sin(v[0]*9 + v[1]*7);
        o.splice(0, 7, v[0]*r*1.3, v[1]*r, v[2]*r*.8, 1, .5*f, .25*f, .7 + Math.random()); }));
      G.add(cloud(3000, (i, o) => { const v = dir(), r = Math.random()*1.4; o.splice(0, 7, v[0]*r, v[1]*r, v[2]*r, .45, .65, 1, .9); }));
      G.userData.pulsar = glowP(0xffffff, 1.2, 1);
    } else if (d.kind === "spiral" || d.kind === "core" || d.kind === "irr"){
      const sp = d.kind === "spiral", irr = d.kind === "irr";
      // спираль: 45% — рукава (молодые голубые звёзды и розовые области водорода), 35% — диффузный диск, 20% — балдж (старые жёлтые)
      const gal = cloud(16000, (i, o) => {
        let x, y, z, cc, sz = .5 + Math.random()*.8;
        const k = Math.random();
        if (irr){ x = gs()*3.2; z = gs()*1.8; y = gs()*.6; cc = Math.random() < .3 ? [1, .55, .7] : [.75, .8, 1]; }
        else if (k < .2){ const r = Math.abs(gs())*(d.kind === "core" ? 1.6 : .9); const v = dir(); x = v[0]*r; y = v[1]*r*.7; z = v[2]*r; cc = [1, .84, .6]; sz += .3; }
        else if (k < .55){ const r = -Math.log(1 - Math.random()*.97)*1.6, a = Math.random()*TAU; x = Math.cos(a)*r; z = Math.sin(a)*r; y = gs()*.12; cc = [.95, .88, .78]; sz *= .7; }
        else { const arm = i % 2, r = .8 + Math.pow(Math.random(), .9)*5, a = arm*Math.PI + Math.log(r)*2.4 + gs()*.28;
          x = Math.cos(a)*r + gs()*.18; z = Math.sin(a)*r + gs()*.18; y = gs()*.08;
          cc = Math.random() < .12 ? [1, .45, .62] : [.68, .78, 1]; }
        o.splice(0, 7, x, y, z, ...cc, sz); }, irr ? 0 : .06);
      gal.rotation.x = d.inc != null ? d.inc : sp ? .35 : d.kind === "core" ? .25 : .5; if (sp) gal.rotation.z = d.pa != null ? d.pa : .6;
      G.add(gal); glowP(0xffe2b0, d.kind === "core" ? 3.2 : 1.6, 1); glowP(0xffd59a, d.kind === "core" ? 8 : 4, .3);
    } else if (d.kind === "qso"){
      glowP(0xffffff, 1.4, 1); glowP(0xcfe8ff, 5, .45); glowP(0xffe0c0, 11, .12);
      G.add(cloud(3000, (i, o) => { const s = (i % 2 ? 1 : -1), t = Math.pow(Math.random(), .7)*9; o.splice(0, 7, s*t, gs()*.08*(1 + t*.08), gs()*.08, .6, .75, 1, .9); }));
    } else if (d.kind === "edge"){
      // реликтовое излучение — стена первого света
      // пятна — как на карте «Планка»: перепады температуры в стотысячные доли; здесь — мягкая рябь, точки мелкие и тусклые
      G.add(cloud(14000, (i, o) => { const x = gs()*5.5, y = gs()*3.6, f = .5 + .5*Math.sin(x*1.9 + Math.sin(y*2.3)*2)*Math.cos(y*1.6 - x*.7); o.splice(0, 7, x, y, -4 + gs()*.4, .95, .5*f + .18, .24*f + .04, .5 + Math.random()*.7); }));
    }
    G.traverse(o => { if (o.isPoints && o.material.uniforms && o.material.uniforms.uPR) o.material.uniforms.uPR.value = Math.min(2, devicePixelRatio || 1); });
    return G;
  }
  function build(){
    built = true;
    rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: false, powerPreference: "high-performance" });
    rend.setClearColor(0x020309, 1);
    scn = new THREE.Scene(); cam = new THREE.PerspectiveCamera(60, 1, .05, 400);
    stars = starField(); scn.add(stars);
    dust = dustTube(); scn.add(dust);
    cmb = glow(0xff9050, 3, 0); cmb.position.set(0, 0, -40); scn.add(cmb);
    const pr = Math.min(2, devicePixelRatio || 1); stars.material.uniforms.uPR.value = pr; dust.material.uniforms.uPR.value = pr;
    cvs.addEventListener("webglcontextlost", e => { e.preventDefault(); }, false);
  }
  function teardown(){
    // освобождаем видеопамять и сам контекст: глава — гость, а не жилец
    if (!built) return;
    scn.traverse(o => { if (o.geometry && !o.isSprite) o.geometry.dispose(); if (o.material) o.material.dispose(); });   // текстуры (карты тел, GLOW) общие — их не трогаем
    rend.dispose(); rend.forceContextLoss(); rend = scn = cam = stars = dust = cmb = tgt = null; built = false; tgtKind = "";
    // у потерянного контекста холст повторно не оживить — ставим свежий
    const nc = cvs.cloneNode(false); cvs.replaceWith(nc); cvs = nc;
  }
  function size(){ const w = cvs.clientWidth || innerWidth, h = cvs.clientHeight || innerHeight; rend.setPixelRatio(Math.min(2, devicePixelRatio || 1)); rend.setSize(w, h, false);
    cam.aspect = w/h; const port = w < 760; cam.setViewOffset(w, h, port ? 0 : -w*.16, port ? h*.18 : 0, w, h); cam.updateProjectionMatrix(); if (lst.children.length) rulLab(); }

  /* ---------- интерфейс ---------- */
  const lst = $("flyDest"), vbox = $("flyVeh"), card = $("flyCard"), hud = $("flyHud"), rul = $("flyRul");
  const LO = 5, HI = 23.7, xOf = km => clamp((Math.log10(Math.max(km, 1e5)) - LO)/(HI - LO), 0, 1);
  function lists(){
    lst.innerHTML = FLY_GRP.map((g, gi) => `<div class="fl-g"><span class="mono fl-gh">${esc(g)}</span>${FLY_DEST.map((d, i) => d.g !== gi ? "" :
      `<button class="fl-d" data-i="${i}" data-hover><b>${esc(d.nm)}</b><span>${esc(fmtD(d.km))}</span></button>`).join("")}</div>`).join("");
    lst.querySelectorAll("[data-i]").forEach(b => b.onclick = () => pick(+b.dataset.i, vI, true));
    vbox.innerHTML = FLY_VEH.map((v, i) => `<button class="fl-v" data-v="${i}" aria-pressed="false" data-hover>${esc(v.nm)}</button>`).join("");
    vbox.querySelectorAll("[data-v]").forEach(b => b.onclick = () => pick(dI, +b.dataset.v, true));
    rul.innerHTML = `<i class="fl-rl"></i>` + FLY_DEST.map((d, i) => `<span class="fl-m${i % 2 ? " lo" : ""}" data-i="${i}" style="left:${(xOf(d.km)*100).toFixed(2)}%"><em></em><b>${esc(d.nm)}</b></span>`).join("") + `<span class="fl-ship" id="flyShip"></span>`;
  }
  // подписи шкалы: соседние ближе 22 px наползают друг на друга — прячем, оставляя цель и уже пройденные первыми
  function rulLab(){
    const W = rul.clientWidth; if (!W) return;
    const ms = [...rul.querySelectorAll(".fl-m")], x = ms.map(m => xOf(FLY_DEST[+m.dataset.i].km)*W);
    const pri = i => (+ms[i].dataset.i === dI ? 2 : 0) + (FLY_DEST[+ms[i].dataset.i].g === 2 ? .5 : 0);
    const ord = ms.map((m, i) => i).sort((a, b) => pri(b) - pri(a) || a - b), shown = [];
    ord.forEach(i => { const ok = shown.every(j => Math.abs(x[j] - x[i]) >= 22); ms[i].classList.toggle("nolab", !ok); if (ok) shown.push(i); });
  }
  function sync(){
    rul.querySelectorAll(".fl-m").forEach(m => m.classList.toggle("tgt", +m.dataset.i === dI)); rulLab();
    lst.querySelectorAll("[data-i]").forEach(b => b.classList.toggle("on", +b.dataset.i === dI));
    vbox.querySelectorAll("[data-v]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.v === vI)));
  }
  function result(){
    const D = FLY_DEST[dI], V = FLY_VEH[vI], R = at(D.km, D.km, V), y = R.T/FLY_YR;
    const edge = D.kind === "edge";
    let h = `<div class="tm-bar"><span class="mono eyebrow tm-cat">${esc(V.nm)} → ${esc(D.nm)}</span></div>
      <h3>${edge ? esc(EN ? "Unreachable" : "Не долететь") : esc(fmtT(R.T))}</h3>
      <p class="tm-ago2">${esc(fmtD(D.km))}</p>`;
    if (V.acc && !edge) h += `<div class="fl-clk"><div><span class="mono">${esc(EN ? "on board" : "на корабле")}</span><b>${esc(fmtT(R.tau))}</b></div><div><span class="mono">${esc(EN ? "on Earth" : "на Земле")}</span><b>${esc(fmtT(R.T))}</b></div></div>`;
    else if (V.beta === 1 && !edge) h += `<p class="tm-pr">${esc(EN ? "◐ For light itself no time passes on the way: a photon has no clock of its own." : "◐ Для самого света время в пути не идёт: у фотона нет собственных часов.")}</p>`;
    else if (V.beta && !edge) h += `<p class="tm-pr">${esc((EN ? "On board, time runs slower: " : "На борту время идёт медленнее: ") + fmtT(R.tau))}</p>`;
    if (edge) h += `<p class="tm-lead">${esc(EN ? "Even light that leaves today will never reach it: the expansion of the Universe carries the far regions away faster than light can close the gap. Light can still overtake only what is now closer than about 16 billion light years — the cosmic event horizon ●." : "Даже свет, вышедший сегодня, туда не дойдёт: расширение уносит дальние области быстрее, чем свет сокращает расстояние. Догнать можно только то, что сейчас ближе ≈16 млрд световых лет, — космологический горизонт событий ●.")}</p>`;
    else {
      // жизни, поколения, событие календаря
      if (y > 146) h += `<p class="tm-pr">${esc((EN ? "That is " : "Это ") + bp(y/73, "человеческая жизнь", "человеческие жизни", "человеческих жизней", "человеческой жизни") + " · " + bp(y/25, "поколение", "поколения", "поколений"))}</p>`;
      if (y > 13.8e9) h += `<p class="tm-lead">${esc(EN ? "Longer than the Universe has existed (13.8 billion years)." : "Дольше, чем существует Вселенная (13,8 млрд лет).")}</p>`;
      else { const e = y >= 8 ? evAt(y) : null;
        if (e) h += `<p class="tm-lead">${esc((EN ? "To arrive today, you would have had to leave " : "Чтобы прилететь сегодня, стартовать пришлось бы ") + fmtT(y*FLY_YR) + (EN ? " ago — around the time of: " : " назад — примерно тогда: "))}<button class="tm-link fl-ev" data-ago="${e.ago}" data-hover>${esc(e.nm)} →</button></p>`; }
      if (V.acc){ const eta = at(D.km/2, D.km, V).eta, mr = Math.exp(2*eta), g = Math.cosh(eta);
        h += `<p class="tm-pr">${esc((EN ? "Top speed at mid-way: γ = " : "На середине пути: γ = ") + big(g) + (EN ? " — the ship's clock runs that many times slower than Earth's." : " — во столько раз часы корабля идут медленнее земных."))}</p>
              <p class="tm-pr">${esc((EN ? "◐ Fuel: even an ideal photon rocket would need a fuel mass " : "◐ Топливо: даже идеальной фотонной ракете понадобилось бы топлива в ") + (EN ? big(mr - 1) + " times the ship's own mass." : bp(mr - 1, "раз", "раза", "раз") + " больше массы самого корабля."))}</p>`; }
    }
    h += `<h4>${esc(EN ? "Destination" : "Цель")}</h4><p class="tm-pr">${esc(D.note)}</p><h4>${esc(EN ? "Vehicle" : "Транспорт")}</h4><p class="tm-pr">${esc(V.note)}</p>`;
    card.innerHTML = h;
    const ev = card.querySelector(".fl-ev"); if (ev) ev.onclick = () => { navMark(); closeFly(); RT.go({ t:"cal", ago: +ev.dataset.ago }); };
  }
  function pick(d, v, user){
    dI = d; vI = v; sync(); result();
    const D = FLY_DEST[dI]; if (D.map) BMAP.want(D.map);
    if (user){ u = uT = 0; flying = false; arr = 0; hudSet(0); $("flyGo").textContent = EN ? "Fly ▶" : "Лететь ▶"; }
  }
  function hudSet(p){
    const D = FLY_DEST[dI], V = FLY_VEH[vI], L = Math.log(1 + D.km/1000), s = D.km*(Math.exp(p*L) - 1)/(Math.exp(L) - 1), R = at(s, D.km, V);
    const T = R.T, edge = D.kind === "edge";
    if (edge){
      // к краю путь обрывается на горизонте событий (≈16 млрд световых лет ●): дальше расширение уносит быстрее света
      const sc = Math.min(s, 1.6e10*FLY_LY);
      hud.querySelector(".fl-t1").textContent = EN ? "Unreachable" : "Не долететь";
      hud.querySelector(".fl-t2").textContent = EN ? "The expansion outruns any ship" : "Расширение обгоняет любой корабль";
      hud.querySelector(".fl-t3").textContent = (EN ? "Covered: " : "Пройдено: ") + fmtD(sc) + (sc < s ? (EN ? " — beyond lies the event horizon" : " — дальше горизонт событий") : (EN ? " of " : " из ") + fmtD(D.km));
      hud.querySelector(".fl-t4").textContent = "";
      const ship = $("flyShip"); if (ship) ship.style.left = (xOf(sc)*100).toFixed(2) + "%";
      rul.querySelectorAll(".fl-m").forEach(m => m.classList.toggle("past", FLY_DEST[+m.dataset.i].km <= sc*1.0001 && p > 0));
      hud.classList.toggle("edge", p > .98);
      return R;
    }
    hud.querySelector(".fl-t1").textContent = (EN ? "Time on the way: " : "Время в пути: ") + fmtT(T);
    hud.querySelector(".fl-t2").textContent = V.acc ? (EN ? "On board: " : "На борту: ") + fmtT(R.tau) : V.beta === 1 ? (EN ? "On board: no time" : "На борту: время не идёт") : "";
    hud.querySelector(".fl-t3").textContent = (EN ? "Covered: " : "Пройдено: ") + fmtD(s) + (EN ? " of " : " из ") + fmtD(D.km);
    const b = Math.tanh(R.eta), om = 2*Math.exp(-2*R.eta);   // 1 − β без потери точности
    hud.querySelector(".fl-t4").textContent = V.acc && R.eta > .01 ? "v = " + (b < .999 ? nf(b*100, 3) + "% c" : (EN ? "0." : "0,") + "9".repeat(Math.min(14, Math.floor(-Math.log10(om)))) + " c") + " · γ = " + big(Math.cosh(R.eta)) : "";
    const ship = $("flyShip"); if (ship) ship.style.left = (xOf(s)*100).toFixed(2) + "%";
    rul.querySelectorAll(".fl-m").forEach(m => m.classList.toggle("past", FLY_DEST[+m.dataset.i].km <= s*1.0001 && p > 0));
    hud.classList.toggle("edge", edge && p > .98);
    return R;
  }
  function go(){
    if (!flying && u >= 1){ u = uT = 0; arr = 0; }
    flying = true; uT = 1; $("flyGo").textContent = EN ? "Again ↺" : "Ещё раз ↺";
    try { Music.portal(true); } catch(e){}
    jrMark("fly", FLY_DEST[dI].id + ":" + FLY_VEH[vI].id, FLY_DEST[dI].nm);
  }
  $("flyGo").onclick = () => { if (flying && u < 1) { u = uT = 1; } else go(); };

  /* ---------- кадр ---------- */
  function frame(now){
    raf = open ? requestAnimationFrame(frame) : 0; if (!open) return;
    const dt = Math.min(.12, (now - last)/1000 || 0); last = now;   // на медленной видеокарте полёт не растягивается вдвое
    const D = FLY_DEST[dI], V = FLY_VEH[vI];
    if (flying && u < 1){ u = Math.min(1, u + dt/(V.acc ? 11 : 9)); if (u >= 1) flying = false; }
    const p = u < 1 ? .5 - .5*Math.cos(Math.PI*u) : 1;                   // мягкий старт и подлёт
    const R = hudSet(p);
    // цель: строится, когда выбрана; растёт на подлёте
    if (tgtKind !== D.id + (BMAP.has(D.map) ? "+" : "")){ if (tgt){ scn.remove(tgt); tgt.traverse(o => { if (o.geometry && !o.isSprite) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } tgt = makeTarget(D); tgt.position.set(0, 0, -18); scn.add(tgt); tgtKind = D.id + (BMAP.has(D.map) ? "+" : ""); }
    arr += ((p > .82 ? 1 : 0) - arr)*Math.min(1, dt*(p > .82 ? 1.2 : 4));
    const A = smooth(0, 1, arr);
    tgt.scale.setScalar(Math.exp((A - 1)*3.2)); tgt.rotation.y += dt*.05;
    tgt.traverse(o => { if (o.isPoints && o.material.uniforms.uA){ o.material.uniforms.uA.value = A; o.material.uniforms.uT.value = now/1000; } });
    for (const [g, op] of tgt.userData.parts) g.material.opacity = op*A;
    if (tgt.userData.mesh){ bodyA(tgt.userData.mesh, A); tgt.userData.mesh.material.uniforms.uSpin.value = now/1000*.05; }
    if (tgt.userData.pulsar) tgt.userData.pulsar.material.opacity = A*(.4 + .6*Math.max(0, Math.sin(now/1000*TAU*3)));   // ✧ мигание — замедленный пульсар (настоящий — 30 раз в секунду)
    // небо: аберрация и Доплер — только в режиме 1 g (и чуть-чуть у паруса); у остальных скоростей звёзды неподвижны
    const eta = V.acc ? R.eta : V.beta && V.beta < 1 && u > 0 && u < 1 ? R.eta : 0;
    stars.material.uniforms.uEta.value = Math.min(eta, 16);
    stars.rotation.z += dt*.004;
    // пыль туннеля — ощущение движения: её скорость от темпа роста логарифма пути
    const mv = flying ? 1 : 0; dust.material.uniforms.uK.value += (mv - dust.material.uniforms.uK.value)*Math.min(1, dt*2);
    dust.material.uniforms.uF.value += dt*(.35 + 1.4*Math.sin(Math.PI*u))*mv;
    // реликтовое излучение впереди: при Доплере e^η его 2,7 К становятся видимым светом
    const Tc = 2.725*Math.exp(Math.min(eta, 16)), vis = smooth(5.6, 7.4, eta);
    if (vis > .001){ const c = new THREE.Color(); const t = clamp(Tc, 1000, 40000)/100;
      c.setRGB(t <= 66 ? 1 : clamp(1.293*Math.pow(t - 60, -.1332), 0, 1), t <= 66 ? clamp(.39*Math.log(t) - .632, 0, 1) : clamp(1.13*Math.pow(t - 60, -.0755), 0, 1), t >= 66 ? 1 : t <= 19 ? 0 : clamp(.543*Math.log(t - 10) - 1.196, 0, 1));
      cmb.material.color.copy(c); }
    cmb.material.opacity = vis*.95; cmb.scale.setScalar(2.5 + 4*vis);
    rend.render(scn, cam);
  }
  function openF(d, v){
    if (!built) build();
    if (!lst.children.length) lists();
    open = flyOn = true; size();
    pick(d != null ? d : dI, v != null ? v : vI, true);
    if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function close(){ if (!open) return; open = flyOn = false; box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); setTimeout(() => { if (!open) teardown(); }, 900); }
  addEventListener("resize", () => { if (open) size(); });
  addEventListener("keydown", e => { if (open && e.key === "Escape"){ e.stopPropagation(); if (!chBack("fly")) closeFly(); } }, true);
  return { open: openF, close, get on(){ return open; }, get u(){ return u; }, get d(){ return FLY_DEST[dI].id; }, get v(){ return FLY_VEH[vI].id; },
           idx: id => FLY_DEST.findIndex(x => x.id === id), vdx: id => FLY_VEH.findIndex(x => x.id === id), go };
})();
const chFly = $("chFly");
function openFly(d, v){ chFrom("fly"); closeChapters(); toggleMenu(false); surface(); chFly.classList.add("open"); chFly.setAttribute("aria-hidden", "false");
  FLY.open(typeof d === "string" ? Math.max(0, FLY.idx(d)) : d, typeof v === "string" ? Math.max(0, FLY.vdx(v)) : v); $("flyClose").focus({ preventScroll:true }); }
function closeFly(){ FLY.close(); }
$("flyClose").onclick = () => { if (!chBack("fly")) closeFly(); };
$("mFly").onclick = () => openFly();
$("btnFly").onclick = () => FLY.on ? closeFly() : openFly();
