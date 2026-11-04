/* ---------- V · ответвления Солнечной системы: Луна, Юпитер и Европа --------------------------
   Две главы-ветки станции V (как «Чёрная дыра» у Галактики): путешествия "moon" и "jup", по четыре
   слоя. Сцены живут прямо в группе станции V рядом с системой и погружением в Солнце; пока открыта
   ветка, система орбит скрыта. Слой проявляется «издалека» (мельче и прозрачнее) и уходит «за
   камеру» (крупнее) — тот же язык полёта сквозь слои, что у Солнца.
   Освещение везде одно: Солнце справа-спереди (в системе станции +x вправо, +z к зрителю).        */

const B_SA = .25;                                  // азимут Солнца (uSolid): справа и чуть спереди — виден терминатор
const B_L = `normalize(vec3(0.8, 0.25, 0.6))`;     // то же направление — для собственных шейдеров

// Луна: моря, кратеры, лучевая система Тихо. Ось почти не крутим — Луна всегда повёрнута к Земле
// одной стороной, и «обратная сторона» здесь показана не была бы
const B_MOON = `vec3 q = position; q.xz = rot(uTime*0.025)*q.xz; vec3 nq = normalize(q);
  float mar = smoothstep(0.50, 0.66, fbm(nq*1.5 + vec3(2.0, 0.0, 1.0)));
  float cr = ridge(nq*6.5), fine = fbm(nq*13.0);
  col = mix(vec3(0.58,0.58,0.56), vec3(0.88,0.87,0.84), fine*0.65);
  col = mix(col, vec3(0.16,0.17,0.19), mar*0.92);
  col = mix(col, vec3(0.97,0.96,0.92), smoothstep(0.80, 0.95, cr)*0.55);
  vec3 ty = normalize(vec3(-0.15, -0.62, 0.77));
  // только возрастающий smoothstep: с edge0 > edge1 он не определён и на части видеокарт даёт ноль
  float tr = (1.0 - smoothstep(0.02, 0.10, length(nq - ty))) + smoothstep(0.75, 0.95, ridge(nq*16.0))*(1.0 - smoothstep(0.2, 0.75, length(nq - ty)))*0.6;
  col = mix(col, vec3(1.0,0.99,0.96), clamp(tr, 0.0, 1.0)*0.7);
  p = q;`;

// протоЗемля и Тейя: расплав
const B_MOLT = `vec3 q = position; q.xz = rot(uTime*0.2)*q.xz; vec3 nq = normalize(q);
  float f = fbm(nq*3.2 + vec3(0.0, uTime*0.15, 0.0));
  col = mix(vec3(0.40,0.07,0.02), vec3(1.0,0.62,0.18), f);
  night += 0.45 + 0.5*uProg;
  p = q;`;
const B_THEIA = `vec3 nq = normalize(position);
  col = mix(vec3(0.36,0.30,0.26), vec3(0.70,0.58,0.46), fbm(nq*3.0));`;

// Европа: лёд, сеть рыжих линий-разломов, области «хаоса»
const B_EUR = `vec3 q = position; q.xz = rot(uTime*0.03)*q.xz; vec3 nq = normalize(q);
  col = mix(vec3(0.78,0.75,0.69), vec3(0.97,0.96,0.94), fbm(nq*3.0));
  float ln = 0.0;
  for (int k = 0; k < 10; k++){
    float fk = float(k);
    vec3 ax = normalize(vec3(sin(fk*12.99 + 1.0), cos(fk*7.23 + 0.4), sin(fk*3.71 + 2.2)));
    float d = abs(dot(nq, ax) + 0.07*sin(dot(nq, ax.zxy)*8.0 + fk));
    ln = max(ln, (1.0 - smoothstep(0.0, 0.045, d))*smoothstep(0.30, 0.60, fbm(nq*2.2 + vec3(fk))));
  }
  col = mix(col, vec3(0.50,0.22,0.10), ln*0.95);
  col = mix(col, vec3(0.70,0.52,0.40), smoothstep(0.70, 0.82, fbm(nq*5.0 + vec3(7.0)))*0.35);
  p = q;`;

// Точки рисуются с аддитивным смешением и без глубины, поэтому сквозь шар просвечивает его обратная
// сторона: освещённая «изнанка» забивает терминатор, и фаза не читается. Гасим всё, что смотрит от зрителя
const B_FRONT = `a *= smoothstep(-0.08, 0.22, normalize((modelViewMatrix*vec4(normalize(position), 0.0)).xyz).z);`;

// Свет и отсечение считаются по ИТОГОВОМУ положению точки p, а не по исходному position: поверхность
// вращается (p = q), и с position терминатор крутился бы вместе с планетой, а отсечённая «изнанка»
// уезжала бы на лицевую сторону. (У общего S_TAIL свет берётся от position — для мелких планет обзора
// это незаметно, на крупном плане — сразу.)
const B_TAIL = `
  vec3 pn = normalize(p);
  float lit = dot(pn, vec3(cos(uSolid), 0.0, sin(uSolid)));
  a = (0.05 + 0.95*smoothstep(-0.18, 0.30, lit) + night)*(0.88 + 0.12*fract(aSeed*9.0))*0.33;
  a *= uSharp*(1.0 + uHov*(0.30 + 0.22*sin(uTime*2.4)));
  s *= 1.0 + uFocus*0.4;
  a *= smoothstep(-0.08, 0.22, normalize((modelViewMatrix*vec4(pn, 0.0)).xyz).z);`;

// шар из точек с джиттером (как планеты системы — иначе решётка Фибоначчи даёт муар)
function bSphere(n, R, chunk){
  const o = pts(n*Q, (i, o, nn) => {
      const v = fib(i, nn), j = .02;
      const x = v[0] + gauss()*j, y = v[1] + gauss()*j, z = v[2] + gauss()*j, L = Math.hypot(x, y, z) || 1;
      o.p = [x/L, y/L, z/L]; o.s = .7 + Math.random()*.55; },
    `vec3 nrm = normalize(position); float lat = nrm.y; float night = 0.0;
     ${chunk}
     ${B_TAIL}`, 1, S_DECL);
  o.scale.setScalar(R);
  // размер точки в пикселях не зависит от масштаба объекта: крупному шару нужны крупные точки,
  // иначе поверхность рассыпается на крапинки и ни морей, ни терминатора не видно
  const u = o.material.uniforms; u.uSolid.value = B_SA; u.uFocus.value = 1; u.uSize.value = clamp(R*.72*Math.sqrt(9000/n), .8, 2.2);
  return o;
}

let B_DBG_PH = null;   // для проверки: зафиксировать фазу сцены «Тейя» (только preview)
const makeBodyDive = g => {
  const root = new THREE.Group(); root.visible = false; g.add(root);
  const PT = [], SP = [];                       // все точки и все спрайты/линии — для общего затухания
  const P = o => { PT.push(o); return o; }, Sp = (o, base) => { o.userData.self = true; o.userData.b = base ?? o.material.opacity; SP.push(o); return o; };
  const L = (txt, x, y, z, h) => { const l = haloLabel(txt, h || .5); l.position.set(x, y, z); l.userData.b = .92; SP.push(l); return l; };
  const layer = () => { const G = new THREE.Group(); G.visible = false; root.add(G); return G; };

  /* ===== Луна ===== */
  // 0 · Луна целиком, вдали — Земля
  const m0 = layer();
  const moon0 = P(bSphere(17000, 2.3, B_MOON)); m0.add(moon0);
  const earthFar = Sp(glow(0x5aa8ff, 1.3, .8)); earthFar.position.set(-5.2, 2.6, -7); m0.add(earthFar);

  // 1 · Тейя: столкновение, диск обломков, сборка Луны. Цикл 16 с, фаза — в uProg
  const m1 = layer();
  const proto = P(bSphere(5000, 1.5, B_MOLT)); m1.add(proto);
  const theia = P(bSphere(1600, .8, B_THEIA)); m1.add(theia);
  const IMP = [1.25, .55, .55];
  const flash = Sp(glow(0xffd9a0, 3.2, 0), .95); flash.position.set(IMP[0]*1.05, IMP[1]*1.05, IMP[2]*1.05); m1.add(flash);
  const disk = new THREE.Group(); m1.add(disk);
  const debris = P(pts(3200*Q, (i, o) => { const v = dir(); o.p = [v[0]*.32, v[1]*.32, v[2]*.32];
      o.rnd = [Math.random()*TAU, 2.2 + Math.pow(Math.random(), .7)*2.0, (Math.random() - .5)*.12];
      o.c = mixc(C(0xffb060), C(0xfff0d0), Math.random()); o.s = .5 + Math.random()*.7; },
    `float ph = uProg;
     vec3 imp = vec3(${IMP.map(v => v.toFixed(2)).join(",")});
     float s1 = smoothstep(0.30, 0.55, ph), s2 = smoothstep(0.62, 0.92, ph);
     float ang = aRnd.x + uTime*0.9/aRnd.y;
     // диск виден наклонно: его плоскость задаём прямо в формуле (группу не наклоняем — иначе точка удара
     // в системе диска уехала бы от точки удара на протоЗемле)
     vec3 ring = vec3(cos(ang)*aRnd.y, sin(ang)*aRnd.y*0.36 + aRnd.z, sin(ang)*aRnd.y);
     float ma = uTime*0.9/3.4 + 0.6;
     vec3 moonP = vec3(cos(ma)*3.4, sin(ma)*3.4*0.36, sin(ma)*3.4) + position;
     p = mix(mix(imp, ring, s1), moonP, s2);
     col = mix(col, vec3(0.78,0.78,0.80), s2);
     a = uSharp*step(0.30, ph)*(1.0 - smoothstep(0.94, 1.0, ph))*mix(0.6, 0.16, s2);   // собравшись, облако не выгорает в белое`));
  disk.add(debris);

  // 2 · Приливы: горбы океана тянутся к Луне и чуть опережают её; Луна повёрнута к Земле одной стороной
  const m2 = layer();
  const sys2 = new THREE.Group(); sys2.rotation.x = .62; m2.add(sys2);
  const earth2 = P(bSphere(12000, 1.3, S_CHUNK.ear)); sys2.add(earth2);
  const W_M = .32;                                      // угловая скорость Луны на слое (рад/с)
  const bulge = P(pts(4200*Q, (i, o, n) => { o.p = fib(i, n); o.c = C(0x4fa0ff); o.s = .55; },
    `vec3 n = normalize(position);
     float ba = uTime*${W_M.toFixed(2)} + 0.21;                // горб опережает Луну
     vec3 b = vec3(cos(ba), 0.0, sin(ba));
     float c = dot(n, b);
     p = n*1.42*(1.0 + 0.26*c*c);
     a = (0.06 + 0.16*c*c)*uSharp;`));
  sys2.add(bulge);
  const orb2 = Sp(new THREE.LineLoop(circleGeo(4.0, 120, 0, 0), lineMat(0x9fb0e8, .3))); orb2.rotation.x = Math.PI/2; sys2.add(orb2);
  const moon2 = new THREE.Group(); sys2.add(moon2);
  const moon2s = P(bSphere(2200, .5, B_MOON)); moon2.add(moon2s);
  const face = Sp(glow(0xffd88a, .32, .9)); moon2.add(face);
  // тихая подсказка снизу; цифра «3,8 см в год» уже есть в описании слоя — на сцене её не дублируем
  { const l = haloLabel("Земля и её приливные горбы", .27, "#E6DAC0"); l.position.set(0, -2.3, 0); l.userData.b = .5; SP.push(l); m2.add(l); }

  // 3 · Фазы: восемь видов Луны по кругу, как их видно с Земли; подсвечена текущая
  const m3 = layer();
  const RP = 2.7, ph3 = P(pts(8*1300*Q, (i, o, n) => { const k = Math.floor(i/(n/8)), v = dir();
      o.p = [v[0]*.42, v[1]*.42, v[2]*.42]; o.rnd = [k, 0, 0]; o.s = .7 + Math.random()*.5; o.c = C(0xe9e6de); },
    `float k = aRnd.x;
     float th = 1.5708 - k*0.7854;                      // по часовой от верха
     vec3 cen = vec3(cos(th)*${RP.toFixed(2)}, sin(th)*${RP.toFixed(2)}, 0.0);
     float phi = k*0.7854;                               // фазовый угол: 0 — новолуние, π — полнолуние
     vec3 Ld = vec3(sin(phi), 0.0, -cos(phi));
     vec3 n = normalize(position);
     float lit = smoothstep(-0.05, 0.15, dot(n, Ld));
     float cur = mod(floor(uTime/1.6), 8.0);
     float on = 1.0 - step(0.5, abs(k - cur));
     p = cen + position*(1.0 + 0.25*on);
     a = (0.04 + 0.62*lit)*uSharp*(0.75 + 0.5*on);
     ${B_FRONT}`));
  m3.add(ph3);
  const earth3 = Sp(glow(0x5aa8ff, .9, .8)); m3.add(earth3);
  m3.add(L("Новолуние", 0, RP + .78, 0, .42), L("Полнолуние", 0, -RP - .78, 0, .42), L("29,5 суток", 0, -.62, 0, .46));

  /* ===== Юпитер и Европа ===== */
  // 0 · Юпитер и галилеевы спутники в резонансе 1 : 2 : 4
  const j0 = layer();
  const jup0 = P(bSphere(15000, 2.0, S_CHUNK.jup)); j0.add(jup0);
  const gal = new THREE.Group(); gal.rotation.x = .2; j0.add(gal);
  const GM = [["Ио", 2.75, 4.5, 0xffe08a, .34], ["Европа", 3.35, 9, 0xf2ece0, .3], ["Ганимед", 4.1, 18, 0xc9bfae, .4], ["Каллисто", 4.95, 42, 0x9a8f80, .36]]
    .map(([nm, r, T, c, s], k) => { const sp = Sp(glow(c, s, .95)); gal.add(sp); const lb = L(nm, 0, 0, 0, .34); gal.add(lb);
      return { sp, lb, r, T, a0:k*1.7 }; });

  // 1 · Щит системы: кометы на пролётных и захваченных орбитах, «Шумейкер—Леви 9» падает на планету
  const j1 = layer();
  const jup1 = P(bSphere(3000, .75, S_CHUNK.jup)); j1.add(jup1);
  const NCm = Math.round(46*Q), TRL = 9;
  const comets = P(pts(NCm*TRL, (i, o) => {
      const c = Math.floor(i/TRL), k = i % TRL, rs = c*7.31;
      const cap = c % 6 === 0;                              // каждая шестая — захвачена на эллипс
      const e = cap ? .45 + .3*((rs*.37) % 1) : 1.15 + 1.4*((rs*.53) % 1), qq = .95 + 1.6*((rs*.71) % 1);
      o.p = [(((rs*.19) % 1) - .5)*1.4, 0, 0];
      o.rnd = [e, qq*(1 + e), ((rs*.83) % 1)*TAU];
      o.seed = ((rs*.29) % 1) - k*.0045;
      o.c = k ? mixc(C(0x9fd0ff), C(0x4a6fb0), k/TRL) : C(0xf4fbff); o.s = (k ? 1.0 - k*.08 : 1.4); },
    `float e = aRnd.x, pp = aRnd.y, om = aRnd.z, tl = position.x;
     float u = fract(uTime*0.035 + aSeed);
     float f;
     if (e < 1.0) f = u*6.2832;
     else { float fm = acos(-1.0/e)*0.93; float x = u*2.0 - 1.0; f = fm*sign(x)*pow(abs(x), 0.62); }
     float r = pp/(1.0 + e*cos(f));
     float an = f + om;
     p = vec3(cos(an)*r, sin(an)*r*cos(tl), sin(an)*r*sin(tl));
     a = uSharp*0.75*(1.0 - smoothstep(5.2, 7.0, r))*(e < 1.0 ? 1.0 : smoothstep(0.0, 0.06, u)*(1.0 - smoothstep(0.94, 1.0, u)));`));
  j1.add(comets);
  const SL0 = new THREE.Vector3(-5.2, 3.6, 1.0), SLN = 21;
  const sl9 = P(pts(SLN, (i, o) => { o.p = [0, 0, 0]; o.rnd = [i, 0, 0]; o.c = C(0xfff4dc); o.s = 1.25; },
    `float u = fract(uTime*0.07);
     float k = aRnd.x, uk = clamp((u - k*0.012)/0.55, 0.0, 1.0);
     vec3 a0 = vec3(${SL0.x.toFixed(2)}, ${SL0.y.toFixed(2)}, ${SL0.z.toFixed(2)});
     vec3 b0 = normalize(a0)*0.72;
     p = mix(a0, b0, uk*uk) + vec3(k*0.045, -k*0.02, 0.0)*(1.0 - uk);
     a = uSharp*step(u, 0.55 + k*0.012)*0.9;`));
  j1.add(sl9);
  const hit = Sp(glow(0xffe3b0, 1.1, 0), .9); hit.position.copy(SL0).normalize().multiplyScalar(.8); j1.add(hit);
  j1.add(L("Комета Шумейкеров — Леви 9, 1994", -3.0, 4.15, 1.0, .4));

  // 2 · Европа, ледяная оболочка, гипотетический шлейф
  const j2 = layer();
  const eur = P(bSphere(17000, 2.15, B_EUR)); j2.add(eur);
  const PLU = new THREE.Vector3(1.45, 1.55, .25).normalize();
  const plume = P(pts(900*Q, (i, o) => { o.rnd = [rn(), rn(), Math.random()]; o.c = C(0xdff2ff); o.s = .5 + Math.random()*.5; },
    `float life = fract(uTime*0.18 + aSeed);
     vec3 base = vec3(${PLU.x.toFixed(3)}, ${PLU.y.toFixed(3)}, ${PLU.z.toFixed(3)});
     vec3 side = normalize(cross(base, vec3(0.0, 0.0, 1.0))), up2 = cross(side, base);
     p = base*(2.15 + life*1.5) + (side*aRnd.x + up2*aRnd.y)*life*0.42;
     a = uSharp*0.35*(1.0 - life)*smoothstep(0.0, 0.08, life);`));
  j2.add(plume);
  j2.add(L("Шлейф? — не подтверждён", PLU.x*3.7 - .2, PLU.y*3.7 + .25, PLU.z*3.7, .4));

  // 3 · Разрез: железное ядро, каменная мантия, океан, лёд. Толщины слоёв сильно преувеличены
  const j3 = layer();
  const R_ICE = 2.42, R_OC = 2.12, R_MA = 1.55, R_CO = .62;
  const slice = P(pts(16000*Q, (i, o) => { const r = Math.sqrt(Math.random())*R_ICE, th = Math.random()*TAU;
      o.p = [Math.cos(th)*r, Math.sin(th)*r, (Math.random() - .5)*.05]; o.rnd = [r, th, Math.random()];
      o.c = r < R_CO ? mixc(C(0x8f939e), C(0xc8ccd6), Math.random()) : r < R_MA ? mixc(C(0x5c4130), C(0x9a7454), Math.random())
          : r < R_OC ? mixc(C(0x154a9a), C(0x3f86d8), Math.random()) : mixc(C(0xcfe6f5), C(0xffffff), Math.random());
      o.s = .55 + Math.random()*.5; },
    `float r = aRnd.x, th = aRnd.y;
     float oc = step(${R_MA.toFixed(2)}, r)*(1.0 - step(${R_OC.toFixed(2)}, r));
     th += oc*uTime*0.035*(fract(aSeed*7.0) > 0.5 ? 1.0 : -1.0);   // медленные течения
     float rr = r + oc*0.03*sin(uTime*0.7 + aSeed*20.0);
     p = vec3(cos(th)*rr, sin(th)*rr, position.z);
     a = uSharp*(oc > 0.5 ? 0.55 : (r > ${R_OC.toFixed(2)} ? 0.45 : 0.6));`));
  j3.add(slice);
  const NV = 7;
  const vents = P(pts(1400*Q, (i, o) => { const k = i % NV; o.rnd = [(k + .3)/NV*TAU + .35, rn()*.05, Math.random()]; o.s = .55 + Math.random()*.6; },
    `float life = fract(uTime*0.22 + aSeed);
     float th = aRnd.x + aRnd.y*(1.0 + life*3.0);
     float r = ${R_MA.toFixed(2)} + life*(${(R_OC - R_MA - .04).toFixed(2)});
     p = vec3(cos(th)*r, sin(th)*r, 0.02);
     col = mix(vec3(1.0,0.62,0.30), vec3(0.55,0.80,1.0), life);
     a = uSharp*0.6*(1.0 - life);`));
  j3.add(vents);
  const rim = Sp(new THREE.LineLoop(circleGeo(R_ICE, 160, 0, 0), lineMat(0xcfe6f5, .5))); j3.add(rim);
  // подписи — столбиком по вертикальному радиусу, внутри своих слоёв: справа их срезал бы край кадра
  j3.add(L("Лёд ≈ 30 км", 0, (R_OC + R_ICE)/2, .05, .36), L("Океан ≈ 100 км", 0, (R_MA + R_OC)/2, .05, .4),
         L("Каменная мантия", 0, (R_CO + R_MA)/2, .05, .4), L("Железное ядро", 0, -.05, .05, .36));

  const LAYERS = { moon:[m0, m1, m2, m3], jup:[j0, j1, j2, j3] };
  const EXT = { moon:[[2.6, 2.6], [4.0, 2.4], [4.4, 3.0], [3.4, 3.6]], jup:[[5.2, 2.4], [5.4, 4.2], [3.4, 4.0], [2.9, 2.8]] };
  let cur = null, curD = 0, theiaPh = 0;
  const tv = new THREE.Vector3();

  return {
    ext(){ if (!cur) return null;
      const E = EXT[cur], k = clamp(Math.round(curD), 0, E.length - 1); return E[k]; },
    update(kind, d, vis, t, dt){
      root.visible = !!kind && vis > .003;
      cur = kind; curD = d;
      if (!root.visible){ for (const G of [...LAYERS.moon, ...LAYERS.jup]) G.visible = false; return; }
      for (const o of PT){ const u = o.material.uniforms; u.uPush.value = 0; }
      // окно слоя: приходит мелким и прозрачным, уходит крупным — «пролетаем сквозь»
      for (const key of ["moon", "jup"]) LAYERS[key].forEach((G, k) => {
        const x = key === kind ? d - k : 9, w = 1 - smooth(.22, .62, Math.abs(x));
        G.visible = w > .004; if (!G.visible) return;
        G.scale.setScalar(Math.exp(clamp(x, -1, 1)*.85));
        G.userData.w = w*vis;
        G.traverse(o => {
          if (o.isPoints) o.material.uniforms.uSharp.value = G.userData.w;
          else if (o.userData.b !== undefined) o.material.opacity = o.userData.b*G.userData.w;
        });
      });
      if (kind === "moon"){
        // Тейя: цикл 16 с — подлёт (0…0,3), удар, диск обломков, сборка Луны, пауза
        theiaPh = B_DBG_PH !== null ? B_DBG_PH : (t/16) % 1;
        for (const o of [proto, debris]) o.material.uniforms.uProg.value = theiaPh;
        const ap = Math.min(1, theiaPh/.3);
        theia.visible = theiaPh < .305;
        theia.position.set(6.2 + (IMP[0] - 6.2)*ap*ap, 2.4 + (IMP[1] - 2.4)*ap*ap, -1.5 + (IMP[2] + .4 + 1.5)*ap*ap);
        const fl = Math.exp(-Math.pow((theiaPh - .31)*22, 2));
        flash.material.opacity = .95*fl*(m1.userData.w || 0); flash.scale.setScalar(2.2 + 3.5*fl);
        // приливы: Луна по орбите, метка лицевой стороны всегда к Земле
        const ma = t*W_M; moon2.position.set(Math.cos(ma)*4.0, 0, Math.sin(ma)*4.0);
        face.position.set(-Math.cos(ma)*.52, 0, -Math.sin(ma)*.52);
      }
      if (kind === "jup"){
        for (const m of GM){ const a = m.a0 + t*TAU/m.T, x = Math.cos(a)*m.r, z = Math.sin(a)*m.r;
          m.sp.position.set(x, 0, z); m.lb.position.set(x, -.42, z);
          // спутник за диском планеты не виден — и подпись его тоже (подписи рисуются поверх всего)
          m.sp.visible = m.lb.visible = !(z < 0 && Math.abs(x) < 2.1); }
        // вспышки ударов: фрагменты падают по очереди
        const u = (t*.07) % 1; let fl = 0;
        for (let k = 0; k < SLN; k++){ const du = u - (.55 + k*.012); if (du > 0) fl = Math.max(fl, Math.exp(-du*55)); }
        hit.material.opacity = .9*fl*(j1.userData.w || 0); hit.scale.setScalar(.8 + 1.6*fl);
      }
    }
  };
};

