/* ---------- v190: «Масштабы» — «Размеры» и «Наш радиопузырь» (глубокий космос, этапы 4 и 5) ----------
   «Размеры»: один ползунок — от Луны до горизонта TON 618. Тела стоят в ряд, камера отъезжает; предыдущие
   остаются точками у края следующего. В углу — сколько пикселей занимает Земля.
   Координаты считаются на процессоре в километрах (double) и каждый кадр переводятся в единицы сцены
   относительно текущего тела — иначе точности float32 не хватило бы на 8 порядков.
   «Радиопузырь»: Галактика из частиц и сфера наших радиопередач радиусом ≈105 световых лет — меньше пикселя;
   ползунок приближает к Солнцу: внутри пузыря — тысячи звёзд и послания, которые ещё летят.        */
const SCL_RS = 695700;   // радиус Солнца, км
const SCL_SIZE = [
  { id:"moon", nm:"Луна", r:1737.1, kind:"body", map:"moon", note:"● 3 474 км в поперечнике — чуть меньше ширины Австралии." },
  { id:"earth", nm:"Земля", r:6371, kind:"body", map:"ear", note:"● Наш дом: 12 742 км в поперечнике. Свет облетел бы её по экватору за 0,13 секунды." },
  { id:"nep", nm:"Нептун", r:24622, kind:"body", map:"nep", note:"● Почти в 4 раза шире Земли: внутри поместилось бы около 57 Земель." },
  { id:"jup", nm:"Юпитер", r:69911, kind:"body", map:"jup", note:"● В 11 раз шире Земли, внутри — больше 1 300 Земель." },
  { id:"sun", nm:"Солнце", r:SCL_RS, kind:"star", col:0xffe6a8, gran:1, note:"● В 109 раз шире Земли: внутри поместилось бы 1,3 миллиона Земель." },
  { id:"sir", nm:"Сириус A", r:1.711*SCL_RS, kind:"star", col:0xdfe9ff, gran:.6, note:"● Самая яркая звезда ночного неба: в 1,7 раза шире Солнца и в 25 раз ярче." },
  { id:"arc", nm:"Арктур", r:25.4*SCL_RS, kind:"star", col:0xffb070, gran:1.6, note:"● Оранжевый гигант в 25 раз шире Солнца. ◐ Примерно таким станет и Солнце через 5 миллиардов лет." },
  { id:"ald", nm:"Альдебаран", r:45*SCL_RS, kind:"star", col:0xffa060, gran:1.8, note:"◐ Около 45 солнц в поперечнике — оранжевый «глаз Тельца»." },
  { id:"rig", nm:"Ригель", r:79*SCL_RS, kind:"star", col:0xc8d8ff, gran:.9, note:"◐ Голубой сверхгигант примерно в 80 раз шире Солнца и в сто тысяч раз ярче." },
  { id:"bet", nm:"Бетельгейзе", r:760*SCL_RS, kind:"star", col:0xff7a40, gran:3.2, note:"◐ Около 760 солнц: на месте Солнца она поглотила бы Меркурий, Венеру, Землю и Марс." },
  { id:"st2", nm:"Стивенсон 2-18", r:2150*SCL_RS, kind:"star", col:0xff6a38, gran:3.6, note:"◐ Одна из крупнейших известных звёзд: по одной из оценок, около 2 150 солнц — на месте Солнца она дотянулась бы до орбиты Сатурна. Оценка спорная, возможно, звезда заметно меньше." },
  { id:"orb", nm:"Орбита Нептуна", r:4.4983e9, kind:"orbit", note:"● Вся Солнечная система до Нептуна — 60 а. е. в поперечнике; свет пересекает её за 8 часов." },
  { id:"ton", nm:"Горизонт TON 618", r:1.18e11, kind:"hole", note:"◐ Горизонт событий одной из самых тяжёлых известных чёрных дыр — около 1 600 а. е. в поперечнике, в 26 раз шире орбиты Нептуна." }
];
// послания и передачи: год, цель, расстояние до цели (св. лет) — ● даты, ◐ расстояния
const SCL_MSG = [
  { y:1921, nm:"Первые регулярные радиопередачи", to:null, note:"◐ Начало 1920-х: радиовещание. Это край пузыря — около 105 световых лет." },
  { y:1936, nm:"Олимпиада в Берлине", to:null, note:"◐ Одна из первых телепередач — фронт этих волн сейчас примерно в 90 световых годах." },
  { y:1974, nm:"Послание «Аресибо»", to:"шаровое скопление M13", d:25000, note:"● 1 679 двоичных знаков: числа, ДНК, человек, Солнечная система. Летит к M13 — долетит примерно через 25 000 лет." },
  { y:1999, nm:"«Космический зов»", to:"несколько звёзд в 50–70 световых годах", d:57, note:"● Послания с радиотелескопа РТ-70 в Евпатории; ещё одно — в 2003 году. Первые дойдут до целей во второй половине XXI века ◐." },
  { y:2008, nm:"«Послание с Земли»", to:"звезда Глизе 581", d:20.4, note:"● 501 послание, написанное людьми, — к красному карлику с планетами. Дойдёт в начале 2029 года." },
  { y:2008, nm:"Песня «Across the Universe»", to:"Полярная звезда", d:433, note:"● NASA передало песню «Битлз» к Полярной звезде; ◐ долетит примерно через 430 лет." }
];

const SCL = (() => {
  const box = $("chScl"); let cvs = $("sclCv");
  const EN = SITE_LANG === "en";
  let open = false, built = false, raf = 0, last = 0, rend, scn, cam, sky, md = "size", S = null, R = null, sv = 0, svT = 0, rv = 0, rvT = 0, playing = false;
  const FRAG = `varying vec3 vC; varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); float g = smoothstep(0.5, 0.0, r); g *= g; if (g*vA < 0.003) discard; gl_FragColor = vec4(vC, g*vA); }`;
  const gs = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); };
  function cloud(n, fill){
    n = Math.max(1, Math.round(n*Q)); const P = new Float32Array(n*3), C = new Float32Array(n*3), Sz = new Float32Array(n), o = [0, 0, 0, 1, 1, 1, 1];
    for (let i = 0; i < n; i++){ fill(i, o); P.set(o.slice(0, 3), i*3); C.set(o.slice(3, 6), i*3); Sz[i] = o[6]; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("aC", new THREE.BufferAttribute(C, 3)); g.setAttribute("aS", new THREE.BufferAttribute(Sz, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 1 }, uPR: { value: Math.min(2, devicePixelRatio || 1) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aC; attribute float aS; uniform float uA; uniform float uPR; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*mv; vC = aC; vA = uA*0.6; gl_PointSize = uPR*aS; }`, fragmentShader: FRAG });
    const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
  }
  const A = (o, a) => { o.material.uniforms && o.material.uniforms.uA ? o.material.uniforms.uA.value = a : o.material.opacity = a; };
  const sm = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
  // звезда: потемнение к краю, грануляция (у сверхгигантов — огромные ячейки), цвет по классу
  function starMesh(col, gran){
    const c = new THREE.Color(col);
    const m = new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Vector3(c.r, c.g, c.b) }, uG: { value: gran }, uT: U.time },
      vertexShader: `varying vec3 vN; varying vec3 vO; void main(){ vO = normalize(position); vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 uC; uniform float uG; uniform float uT; varying vec3 vN; varying vec3 vO; ${S_DECL}
        void main(){ float mu = max(dot(normalize(vN), vec3(0.0, 0.0, 1.0)), 0.0);
          float g = fbm(vO*(14.0/uG) + vec3(uT*0.03)) , g2 = fbm(vO*(40.0/uG) - vec3(uT*0.05));
          float k = 0.72 + 0.34*g + 0.12*g2;
          vec3 col = uC*k*(0.35 + 0.65*pow(mu, 0.55));
          gl_FragColor = vec4(col*1.05, 1.0); }` });
    const o = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), m);
    const h = glow(col, 3.2, .55); o.add(h); o.userData.halo = h; return o;
  }

  /* ---------- «Размеры» ---------- */
  function buildSize(){
    const g = new THREE.Group(), X = []; let x = 0;
    SCL_SIZE.forEach((o, i) => { if (i) x += SCL_SIZE[i - 1].r + o.r*1.18; X.push(x); });
    const objs = SCL_SIZE.map(o => {
      let m;
      if (o.kind === "body"){ const tx = o.map === "ear" ? null : BMAP.get(o.map); m = bodyMesh(o.map, tx); m.material.uniforms.uSolid.value = .9; bodyA(m, 1); m.userData.map = o.map; m.userData.has = !!tx || o.map === "ear"; }
      else if (o.kind === "star") m = starMesh(o.col, o.gran);
      else if (o.kind === "orbit"){ m = new THREE.Group();
        [[.387, 0x9a9a9a], [.723, 0xe6c89a], [1, 0x7fb4ff], [1.524, 0xd86a40], [5.2, 0xd8b890], [9.54, 0xe8d6a0], [19.2, 0x9fe0e8], [30.07, 0x6f8fff]].forEach(([a, c]) => {
          const pts = []; for (let k = 0; k <= 160; k++){ const t = k/160*TAU; pts.push(new THREE.Vector3(Math.cos(t)*a/30.07, Math.sin(t)*a/30.07*.35, 0)); }
          m.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .8 }))); });
        const sn = glow(0xffe2a0, .05, 1); m.add(sn); m.userData.sun = sn; }
      else { m = new THREE.Group(); const d = new THREE.Mesh(new THREE.CircleGeometry(1, 128), new THREE.MeshBasicMaterial({ color: 0x000000 })); d.renderOrder = 3; m.add(d);
        const ring = cloud(7000, (i, o) => { const a = Math.random()*TAU, r = 1.02 + Math.abs(gs())*.14 + Math.pow(Math.random(), 4)*.8, b = .55 + .45*Math.cos(a + 1.9);
          o.splice(0, 7, Math.cos(a)*r, Math.sin(a)*r, 0, 1, .5 + .35*b, .18 + .25*b, 1.2 + 2.4*b); }); ring.renderOrder = 2; m.add(ring); m.userData.ring = ring; }
      const dot = glow(o.kind === "star" ? o.col : 0xdfe8ff, .12, 1); g.add(dot);
      g.add(m); return { o, m, dot };
    });
    let cur = 0;
    return { g, get cur(){ return cur; }, upd(t, s, asp){
      const i = Math.min(SCL_SIZE.length - 2, Math.floor(s)), f = s - i, ff = f*f*(3 - 2*f);
      const Rc = Math.exp(Math.log(SCL_SIZE[i].r)*(1 - ff) + Math.log(SCL_SIZE[i + 1].r)*ff), Xc = X[i]*(1 - ff) + X[i + 1]*ff, u = Rc/(2.6*clamp(asp/1.3, .5, 1));   // на узком экране тело меньше
      cur = Math.round(s);
      objs.forEach(({ o, m, dot }, j) => {
        const r = o.r/u, px = (X[j] - Xc)/u, vis = r < 60 && Math.abs(px) - r < 30;
        m.visible = vis && r > .02; m.position.set(px, 0, 0); m.scale.setScalar(r);
        if (m.userData.halo) m.userData.halo.material.opacity = .55;
        if (m.userData.map && !m.userData.has && BMAP.has(m.userData.map)){ const tx = BMAP.get(m.userData.map); m.material.uniforms.uMap.value = tx; m.material.uniforms.uTx.value.set(1/tx.image.width, 1/tx.image.height); m.userData.has = true; }
        if (m.material && m.material.uniforms && m.material.uniforms.uSpin) m.material.uniforms.uSpin.value = t*(BODY_SPIN[o.map] || .05);
        if (m.userData.sun) m.userData.sun.scale.setScalar(.5/Math.max(r, 1e-6));   // Солнце в центре орбит — постоянного размера на экране
        // меньше пикселя — точка, чтобы тело не исчезало бесследно
        dot.visible = r <= .06 && Math.abs(px) < 30; dot.position.set(px, 0, 0); dot.scale.setScalar(.12);
      });
      return { u, Rc };
    } };
  }
  /* ---------- «Радиопузырь» ---------- */
  function buildRadio(){
    const g = new THREE.Group();
    // Галактика: Солнце в начале координат, центр — в 26 700 св. лет; единицы — световые годы
    const GX = -26700, gal = cloud(40000, (i, o) => {
      const k = Math.random(); let x, y, z, c;
      if (k < .18){ const r = Math.abs(gs())*3500, v = dir(); x = v[0]*r; y = v[1]*r*.55; z = v[2]*r; c = [1, .82, .6]; }
      else { const arm = i % 4, r = 2500 + Math.pow(Math.random(), .75)*48000, a = arm*Math.PI/2 + Math.log(r/2500)*2.1 + gs()*.3;
        x = Math.cos(a)*r + gs()*600; z = Math.sin(a)*r + gs()*600; y = gs()*(300 + r*.004); c = Math.random() < .3 ? [.7, .8, 1] : Math.random() < .08 ? [1, .5, .65] : [.95, .9, .8]; }
      o.splice(0, 7, x + GX, y, z, ...c, .8 + Math.random()*1.6); });
    g.add(gal);
    // ближние звёзды — в пределах 300 св. лет, ≈0,004 звезды на св. год³ ◐
    const loc = cloud(9000, (i, o) => { const v = dir(), r = Math.cbrt(Math.random())*300, w = Math.random(); o.splice(0, 7, v[0]*r, v[1]*r*.9, v[2]*r, w < .7 ? 1 : .85, w < .7 ? .7 + .2*w : .9, w < .7 ? .45 + .3*w : 1, 1.4 + Math.pow(Math.random(), 3)*2.6); });
    g.add(loc);
    // местный рукав Ориона — на промежуточных масштабах, иначе между Галактикой и пузырём пусто
    const arm = cloud(9000, (i, o) => { const x = gs()*2200, z = gs()*700 + x*.25, y = gs()*120, w = Math.random(); o.splice(0, 7, x, y, z, w < .75 ? 1 : .75, w < .75 ? .8 : .85, w < .75 ? .6 : 1, .8 + Math.random()*1.6); });
    g.add(arm);
    // яркие звёзды «Звезды рождения»: до кого наши передачи уже дошли (голубые) и до кого ещё нет (тёплые)
    const RB0 = NOWY() - 1921, named = FLY_BORN.map((b, i) => { const a = i*2.399963, zz = 1 - 2*((i + .5)/FLY_BORN.length), rr = Math.sqrt(1 - zz*zz);
      const s = glow(b.ly < RB0 ? 0x9fe6ff : 0xffd2a0, 1, 1); s.position.set(Math.cos(a)*rr*b.ly, zz*b.ly*.8, Math.sin(a)*rr*b.ly); g.add(s); return s; });
    // сам пузырь: светящаяся оболочка (френель)
    const bub = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uA: { value: 1 } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
      fragmentShader: `uniform float uA; varying vec3 vN; void main(){ float f = pow(1.0 - abs(vN.z), 2.6); gl_FragColor = vec4(vec3(0.45, 0.85, 1.0)*(0.05 + 0.9*f)*uA, 1.0); }` }));
    const RB = NOWY() - 1921; bub.scale.setScalar(RB); g.add(bub);
    const sun = glow(0xffe2a0, 1, 1); g.add(sun);
    // «Аресибо»: узкий луч к M13, пройдено ≈52 св. года
    const are = cloud(900, (i, o) => { const t = Math.random()*(NOWY() - 1974); o.splice(0, 7, t*.62, t*.55, t*.56, .7, 1, .8, 1.4); });
    g.add(are);
    // «вы здесь» — метка постоянного размера, когда пузырь меньше пикселя
    const here = glow(0x9fe6ff, 1, 0); g.add(here);
    let W = 1.2e5;
    return { g, get W(){ return W; }, upd(t, v){
      W = Math.exp(Math.log(1.2e5) + (Math.log(320) - Math.log(1.2e5))*v);   // поле зрения, св. лет
      const sc = 13/W; g.scale.setScalar(sc); g.rotation.x = .45 + .5*(1 - v); g.rotation.y = t*.01;
      A(gal, .9*(1 - .7*sm(.75, 1, v))); A(loc, 1.2*sm(.55, .9, v)); A(arm, sm(.25, .5, v)*(1 - .6*sm(.8, 1, v)));
      named.forEach(n => { n.scale.setScalar(.22/sc); A(n, sm(.7, .95, v)); }); bub.material.uniforms.uA.value = .35 + .65*sm(.5, .85, v); A(are, sm(.6, .9, v));
      sun.scale.setScalar((.35 + .2*Math.sin(t*2))/sc); here.scale.setScalar(1.1/sc*(1 + .15*Math.sin(t*3))); A(here, .8*(1 - sm(.3, .6, v)));
      return { W };
    } };
  }
  const NOWY = () => { const d = new Date(), y0 = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + (d - y0)/(FLY_YR*1000); };

  /* ---------- интерфейс ---------- */
  const tabs = $("sclModes"), list = $("sclList"), card = $("sclCard"), toy = $("sclToy");
  const f = () => FLY.fmt;
  const nfr = x => x.toLocaleString(EN ? "en-US" : "ru-RU", { maximumSignificantDigits: 3 });
  function kmLab(r){ return r < 1e7 ? Math.round(r*2).toLocaleString(EN ? "en-US" : "ru-RU") + (EN ? " km" : " км") : f().fmtD(r*2); }
  function sizeUI(){
    list.innerHTML = SCL_SIZE.map((o, i) => `<button class="at-c" data-i="${i}" data-hover><span class="mono">${String(i + 1).padStart(2, "0")}</span><b>${esc(o.nm)}</b></button>`).join("");
    list.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { svT = +b.dataset.i; playing = false; syncToy(); });
    toy.innerHTML = `<div class="at-tr"><span class="mono at-tl">${esc(EN ? "Size" : "Размер")}</span><input type="range" id="sclR" min="0" max="${(SCL_SIZE.length - 1)*100}" value="${Math.round(svT*100)}" aria-label="${esc(EN ? "Size" : "Размер")}"><button class="tm-link at-play" id="sclPlay" data-hover>▶</button></div>
      <p class="at-hint" id="sclHint"></p>`;
    $("sclR").oninput = e => { svT = +e.target.value/100; playing = false; syncPlay(); };
    $("sclPlay").onclick = () => { playing = !playing; if (playing && svT >= SCL_SIZE.length - 1.001) svT = sv = 0; syncPlay(); };
    sizeCard(Math.round(svT));
  }
  let shown = -1;
  function sizeCard(i){
    if (i === shown) return; shown = i; const o = SCL_SIZE[i], E = o.r/6371, Sn = o.r/SCL_RS;
    list.querySelectorAll("[data-i]").forEach(b => b.classList.toggle("on", +b.dataset.i === i));
    card.innerHTML = `<div class="tm-bar"><span class="mono eyebrow tm-cat">${esc(EN ? "Sizes" : "Размеры")} · ${i + 1}/${SCL_SIZE.length}</span></div>
      <h3>${esc(o.nm)}</h3><p class="tm-ago2">${esc((EN ? "across: " : "в поперечнике: ") + kmLab(o.r))}</p>
      <div class="at-facts"><div><span class="mono">${esc(EN ? "Earths across" : "земель в поперечнике")}</span><b>${esc(E < 1.5 ? nfr(E) : f().big(E))}</b></div>
        <div><span class="mono">${esc(EN ? "suns across" : "солнц в поперечнике")}</span><b>${esc(Sn < 1000 ? nfr(Sn) : f().big(Sn))}</b></div></div>
      <p class="tm-lead">${esc(o.note)}</p>
      <p class="tm-pr">${esc(EN ? "Drag the slider or press ▶: the camera pulls back, and each body becomes a dot at the edge of the next." : "Тяните ползунок или нажмите ▶: камера отъезжает, и каждое тело становится точкой у края следующего.")}</p>
      ${i === SCL_SIZE.length - 1 ? `<div class="tm-gos"><button class="btn tm-go scl-ton" data-hover>${esc(EN ? "TON 618 in the Atlas of wonders →" : "TON 618 в «Атласе чудес» →")}</button></div>` : ""}`;
    const b = card.querySelector(".scl-ton"); if (b) b.onclick = () => { navMark(); RT.go({ t:"atl", id:"ton" }); };
  }
  function radioUI(){
    list.innerHTML = "";
    toy.innerHTML = `<div class="at-tr"><span class="mono at-tl">${esc(EN ? "Zoom" : "Приближение")}</span><input type="range" id="sclR" min="0" max="1000" value="${Math.round(rvT*1000)}" aria-label="${esc(EN ? "Zoom" : "Приближение")}"><button class="tm-link at-play" id="sclPlay" data-hover>▶</button></div>
      <p class="at-hint" id="sclHint"></p>`;
    $("sclR").oninput = e => { rvT = +e.target.value/1000; playing = false; syncPlay(); };
    $("sclPlay").onclick = () => { playing = !playing; if (playing && rvT >= .999) rvT = rv = 0; syncPlay(); };
    const ny = NOWY(), RB = ny - 1921;
    const reach = FLY_BORN.filter(b => b.ly < RB).slice(-6).map(b => `${b.nm} — ${Math.floor(ny - b.ly)}`).join(EN ? "; " : "; ");
    card.innerHTML = `<div class="tm-bar"><span class="mono eyebrow tm-cat">${esc(EN ? "Our radio bubble" : "Наш радиопузырь")}</span></div>
      <h3>${esc(EN ? "About 105 light-years" : "Около 105 световых лет")}</h3><p class="tm-ago2">${esc(EN ? "how far our radio has travelled since the 1920s" : "столько прошли наши радиоволны с 1920-х")}</p>
      <p class="tm-lead">${esc(EN ? "Everything people have ever broadcast fits into a sphere about 105 light-years in radius ●. The Galaxy is a thousand times wider. On a picture of the whole Milky Way our bubble is a dot the size of a pixel." : "Всё, что люди когда-либо передавали по радио, умещается в шар радиусом около 105 световых лет ●. Галактика в тысячу раз шире. На снимке всего Млечного Пути наш пузырь — точка размером с пиксель.")}</p>
      <div class="at-facts"><div><span class="mono">${esc(EN ? "stars inside" : "звёзд внутри")}</span><b>${esc(EN ? "≈15,000 ◐" : "≈15 000 ◐")}</b></div><div><span class="mono">${esc(EN ? "share of the Galaxy" : "доля Галактики")}</span><b>${esc(EN ? "≈1/2,000,000 of its volume ◐" : "≈1/2 000 000 объёма ◐")}</b></div></div>
      <h4>${esc(EN ? "What is flying now" : "Что летит сейчас")}</h4>
      <ul class="list at-sci">${SCL_MSG.map(m => { const dd = ny - m.y; return `<li><span><b>${m.y} · ${esc(m.nm)}</b>${m.to ? esc((EN ? " → " : " → ") + m.to) : ""} — ${esc((EN ? "the wavefront is " : "фронт волн — в ") + nfr(dd) + (EN ? " light-years away" : " св. годах"))}${m.d ? esc(m.d > dd ? (EN ? ", it will arrive in " : ", дойдёт в ") + Math.round(m.y + m.d) + (EN ? "" : " году") : (EN ? ", already arrived" : ", уже дошло")) : ""}. ${esc(m.note)}</span></li>`; }).join("")}</ul>
      <h4>${esc(EN ? "Where our broadcasts are arriving today" : "Куда доходят наши передачи сегодня")}</h4>
      <p class="tm-pr">${esc((EN ? "The year whose broadcasts are reaching the star now: " : "Год, чьи передачи доходят до звезды сейчас: ") + reach + ".")}</p>
      <p class="tm-pr">${esc(EN ? "◐ And even this is generous: ordinary radio and television fade into the noise within a few light-years. Only the most powerful radars and deliberate messages could be noticed further away." : "◐ И даже это щедро: обычное радио и телевидение тонут в шуме уже через несколько световых лет. Дальше заметили бы разве что самые мощные радары и нарочно посланные сигналы.")}</p>
      <h4>${esc(EN ? "Silence" : "Тишина")}</h4>
      <p class="tm-pr">${esc(EN ? "So far no one has answered — the «Great Silence» (Fermi's paradox) ●. Perhaps no one is there; perhaps our voice is too quiet; perhaps it is too early. Our whole history is a ripple a hundred years thick on the surface of a vast quiet ocean." : "Пока никто не ответил — «Великое молчание» (парадокс Ферми) ●. Может быть, там никого нет; может быть, наш голос слишком тих; может быть, ещё рано. Вся наша история — рябь толщиной в сто лет на поверхности огромного тихого океана.")}</p>
      <h4>${esc(EN ? "Practice" : "Практика")}</h4>
      <p class="tm-pr">${esc(EN ? "A minute of silence. Turn off the sound, close your eyes and imagine your voice going out as a sphere: one second — beyond the Moon, a day — past Voyager, a hundred years — just here, among the nearest stars. And around it, silence." : "Минута тишины. Выключите звук, закройте глаза и представьте, как ваш голос расходится шаром: секунда — за Луну, сутки — за «Вояджер», сто лет — всего лишь сюда, к ближайшим звёздам. А вокруг — тишина.")}</p>
      <div class="tm-gos"><button class="btn tm-go scl-void" data-hover>${esc(EN ? "Towards the Absolute →" : "К станции «Абсолют» →")}</button></div>`;
    card.querySelector(".scl-void").onclick = () => { navMark(); RT.go({ t:"j", id:"abs", d:0 }); };
  }
  const syncPlay = () => { const p = $("sclPlay"); if (p) p.textContent = playing ? "❚❚" : "▶"; };
  const syncToy = () => { const r = $("sclR"); if (r) r.value = md === "size" ? Math.round(svT*100) : Math.round(rvT*1000); syncPlay(); };
  function setMode(m){
    md = m; shown = -1; playing = false;
    tabs.querySelectorAll("[data-m]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.m === m)));
    box.classList.toggle("scl-radio", m === "radio");
    if (m === "size") sizeUI(); else radioUI();
    if (built){ if (S) S.g.visible = m === "size"; if (R) R.g.visible = m === "radio"; }
    $("sclScroll").scrollTop = 0; jrMark("scl", m, m === "size" ? "Размеры" : "Радиопузырь");
  }
  tabs.querySelectorAll("[data-m]").forEach(b => b.onclick = () => setMode(b.dataset.m));

  /* ---------- сцена ---------- */
  function build(){
    built = true;
    rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: false, powerPreference: "high-performance" }); rend.setClearColor(0x020309, 1);
    scn = new THREE.Scene(); cam = new THREE.PerspectiveCamera(50, 1, .05, 4000);
    sky = cloud(2600, (i, o) => { const v = dir(), r = 900; o.splice(0, 7, v[0]*r, v[1]*r, v[2]*r, .85, .88, 1, .6 + Math.pow(Math.random(), 6)*2.4); }); scn.add(sky);
    S = buildSize(); S.g.position.z = -14; scn.add(S.g);
    R = buildRadio(); R.g.position.z = -14; scn.add(R.g);
    S.g.visible = md === "size"; R.g.visible = md === "radio";
    ["moon", "nep", "jup"].forEach(k => BMAP.want(k));
    cvs.addEventListener("webglcontextlost", e => { e.preventDefault(); }, false);
    cvs.addEventListener("wheel", e => { e.preventDefault(); const d = e.deltaY > 0 ? 1 : -1;
      if (md === "size") svT = clamp(svT + d*.25, 0, SCL_SIZE.length - 1); else rvT = clamp(rvT - d*.04, 0, 1); playing = false; syncToy(); }, { passive: false });
  }
  function teardown(){
    if (!built) return;
    scn.traverse(o => { if (o.geometry && !o.isSprite) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    rend.dispose(); rend.forceContextLoss(); rend = scn = cam = sky = S = R = null; built = false;
    const nc = cvs.cloneNode(false); cvs.replaceWith(nc); cvs = nc;
  }
  function size(){ const w = cvs.clientWidth || innerWidth, h = cvs.clientHeight || innerHeight; rend.setPixelRatio(Math.min(2, devicePixelRatio || 1)); rend.setSize(w, h, false);
    cam.aspect = w/h; const port = w < 760; cam.setViewOffset(w, h, port ? 0 : -w*.16, port ? h*.2 : 0, w, h); cam.updateProjectionMatrix(); }
  function frame(now){
    raf = open ? requestAnimationFrame(frame) : 0; if (!open) return;
    const dt = Math.min(.1, (now - last)/1000 || 0), t = now/1000; last = now;
    if (playing){ if (md === "size"){ svT = Math.min(SCL_SIZE.length - 1, svT + dt*.42); if (svT >= SCL_SIZE.length - 1) playing = false; }
      else { rvT = Math.min(1, rvT + dt/18); if (rvT >= 1) playing = false; } syncToy(); }
    sv += (svT - sv)*Math.min(1, dt*3); rv += (rvT - rv)*Math.min(1, dt*3);
    const hint = $("sclHint");
    if (md === "size"){ const r = S.upd(t, sv, cam.aspect); sizeCard(S.cur);
      // сколько пикселей занимает Земля: единица сцены на расстоянии 14 — столько-то пикселей
      const pxU = cvs.clientHeight/(2*14*Math.tan(25*Math.PI/180)), ep = 2*6371/r.u*pxU;
      if (hint) hint.textContent = (EN ? "The Earth on this screen: " : "Земля на этом экране: ") + (ep >= 10 ? Math.round(ep).toLocaleString(EN ? "en-US" : "ru-RU") : ep.toLocaleString(EN ? "en-US" : "ru-RU", { maximumSignificantDigits: 2 })) + (EN ? " px — you are here" : " пикс. — вы здесь"); }
    else { const r = R.upd(t, rv), pxU = cvs.clientHeight/(2*14*Math.tan(25*Math.PI/180)), bp = 2*(NOWY() - 1921)*13/r.W*pxU;
      if (hint) hint.textContent = (EN ? "Field of view " : "Поле зрения ") + f().fmtD(r.W*FLY_LY) + (EN ? " · the bubble on screen: " : " · пузырь на экране: ") + (bp >= 10 ? Math.round(bp).toLocaleString(EN ? "en-US" : "ru-RU") : bp.toLocaleString(EN ? "en-US" : "ru-RU", { maximumSignificantDigits: 2 })) + (EN ? " px" : " пикс."); }
    sky.rotation.y += dt*.002;
    rend.render(scn, cam);
  }
  function openS(m){
    if (!built) build();
    open = sclOn = true; size();
    setMode(m === "radio" ? "radio" : m === "size" ? "size" : md);
    if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function close(){ if (!open) return; open = sclOn = false; playing = false; box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); setTimeout(() => { if (!open) teardown(); }, 900); }
  addEventListener("resize", () => { if (open) size(); });
  addEventListener("keydown", e => { if (open && e.key === "Escape"){ e.stopPropagation(); if (!chBack("scl")) closeScl(); } }, true);
  return { open: openS, close, get on(){ return open; }, get m(){ return md; }, get s(){ return sv; } };
})();
const chScl = $("chScl");
function openScl(m){ chFrom("scl"); closeChapters(); toggleMenu(false); surface(); chScl.classList.add("open"); chScl.setAttribute("aria-hidden", "false");
  SCL.open(m); $("sclClose").focus({ preventScroll:true }); }
function closeScl(){ SCL.close(); }
$("sclClose").onclick = () => { if (!chBack("scl")) closeScl(); };
$("mSize").onclick = () => openScl("size");
$("mRadio").onclick = () => openScl("radio");
