/* ---------- сцена погружения ---------- */
// Окно слоя: слой приходит мелким, вырастает и уходит за камеру. Для «оболочек» (2–5)
// ход масштаба мягкий — они стоят вокруг звезды; для спуска (6–11) он экспоненциальный,
// и это читается как настоящее движение внутрь.
const SUN_WIN = (k, d, macro) => {
  const x = d - k, ax = Math.abs(x);
  return { o: 1 - smooth(.42, .98, ax), s: macro ? 1 + x*.24 : Math.exp(x*.92) };
};

// Радиус, с которым слой построен (см. ниже), и общий радиус, к которому все слои приводятся:
// иначе слои, собранные в разных единицах, выходили бы в кадре разного размера.
const SUN_R0 = [0, 0, 2.55, 2.55, 2.30, 1.95, 1.05, 1.05, 1.05, 1.08, 1.05, 1.08];
const SUN_RT = 2.45;

function makeSunDive(parent){
  const G = new THREE.Group(); G.visible = false; parent.add(G);
  const LG = [], LM = [], UP = [], HOV = [];   // HOV — слои со своим ответом на курсор
  const lay = k => { if (!LG[k]){ const o = new THREE.Group(); o.visible = false; G.add(o); LG[k] = o; LM[k] = []; } return LG[k]; };
  const put = (k, o) => { lay(k).add(o); o.traverse(q => { if (q.material) LM[k].push(q.material); }); return o; };
  const P = (n, fill, chunk, size) => pts(Math.max(30, Math.round(n*Q)), fill, chunk, size);

  let hovFix = false;
  // общее ядро-свечение: держится во всех слоях и даёт непрерывность спуска
  const heart = glow(0xffb861, 2.2, 0); G.add(heart);

  /* 2 · гелиосфера: пузырь ветра с хвостом, поток изнутри наружу, метка «Вояджера» */
  put(2, P(5200, (i,o,n) => { const v = fib(i,n), tail = 1 + .62*Math.max(0, -v[0]);
      o.p = [v[0]*2.55*tail, v[1]*2.05, v[2]*2.05];
      o.c = mixc(C(0x4a86ff), C(0xa8d2ff), Math.random()); o.s = .5 + Math.random()*.8; },
    `float w = sin(position.y*2.6 + uTime*0.8) + cos(position.z*2.2 - uTime*0.6);
     p = position*(1.0 + w*0.016);
     a = (0.14 + 0.44*fract(aSeed*17.0))*uSharp;`));
  put(2, P(2400, (i,o) => { o.rnd = dir(); o.s = .45 + Math.random()*.8;
      o.c = mixc(C(0xffd9a0), C(0x9fd0ff), Math.random()); },
    `float life = fract(aSeed + uTime*0.12);
     p = aRnd*(0.22 + life*2.25);
     a = smoothstep(0.0, 0.06, life)*(1.0 - life)*0.7*uSharp;`));
  { const v = glow(0xdfe8ff, .30, 1); v.position.set(1.62, .62, .5); put(2, v); }

  /* 3 · тяжесть: эквипотенциали, падающие по ним крупицы и дальняя сфера Оорта */
  { const lm = lineMat(0xD6AC5E, .5);
    for (let k = 0; k < 6; k++){
      const r = .55 + k*.36, ring = new THREE.LineLoop(circleGeo(r, 120, 0, 0), lm.clone());
      ring.rotation.x = Math.PI/2 + (k % 2 ? .08 : -.08); ring.rotation.z = k*.21;
      put(3, ring); } }
  put(3, P(2600, (i,o) => { o.rnd = dir(); o.s = .5 + Math.random()*.9; o.c = mixc(C(0xffe0a8), C(0xffb060), Math.random()); },
    // падение внутрь: чем ближе к центру, тем быстрее — так и выглядит тяжесть
    `float life = fract(aSeed*1.7 - uTime*0.09);
     float r = 0.18 + life*life*2.5;
     p = aRnd*r;
     a = (1.0 - smoothstep(0.75, 1.0, life))*smoothstep(0.0, 0.10, life)*0.55*uSharp;`));
  put(3, P(3000, (i,o,n) => { const v = fib(i,n); o.p = v.map(q => q*2.52); o.c = C(0x9fb6d8); o.s = .4 + Math.random()*.4; },
    `p = position*(1.0 + 0.02*sin(uTime*0.4 + aSeed*30.0));
     a = (0.05 + 0.22*fract(aSeed*31.0))*uSharp;`));

  /* 4 · магнитное поле: петли диполя и волнистый токовый слой */
  { const seg = 90;
    for (let k = 0; k < 14; k++){
      const a0 = k/14*TAU, L0 = .75 + (k % 3)*.42, pts3 = [];
      for (let q = 0; q <= seg; q++){ const t = q/seg*Math.PI;
        const r = L0*Math.sin(t)*Math.sin(t)*2.0;
        pts3.push(Math.cos(a0)*r*.9, Math.cos(t)*(0.55 + L0*.55), Math.sin(a0)*r*.9); }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute("position", new THREE.Float32BufferAttribute(pts3, 3));
      put(4, new THREE.Line(gg, lineMat(0x7fb0ff, .42))); } }
  put(4, P(5200, (i,o) => { const r = .55 + Math.random()*1.95, a0 = Math.random()*TAU;
      o.p = [r, a0, 0]; o.c = mixc(C(0xffd28a), C(0x8fd0ff), Math.random()); o.s = .5 + Math.random()*.8; },
    // токовый слой: волна по азимуту, наклонённая к оси вращения — «юбка балерины»
    `float r = position.x, a0 = position.y + uTime*0.16;
     float h = sin(a0*2.0)*0.30*r + sin(a0 + uTime*0.1)*0.10*r;
     p = vec3(cos(a0)*r, h, sin(a0)*r);
     a = (0.18 + 0.45*fract(aSeed*13.0))*uSharp;`));

  /* 5 · корона: лучи-стримеры, петли над поверхностью и бегущий зонд */
  // стримеры: плазма вытянута вдоль магнитных лучей — у экватора длинные, у полюсов султаны
  { const RAYS = 48, PER = Math.max(10, Math.round(150*Q)), rd = [];
    for (let k = 0; k < RAYS; k++){ const v = dir(); rd.push([v, Math.abs(v[1]) < .45 ? 1 : .62]); }
    put(5, pts(RAYS*PER, (i,o) => {
        const k = Math.floor(i/PER), t = (i - k*PER)/(PER - 1), r = rd[k], v = r[0], L0 = r[1];
        const rr = .95 + t*L0*1.35, j = .028*(1 + t*3.2);
        o.p = [v[0]*rr + gauss()*j, v[1]*rr + gauss()*j, v[2]*rr + gauss()*j];
        o.rnd = [t, Math.random(), 0];
        o.c = mixc(C(0xfff2d2), C(0xff7a2a), t); o.s = (1.15 - t*.6)*(.7 + Math.random()*.6); },
      `float t = aRnd.x;
       float fl = 0.5 + 0.5*sin(uTime*1.1 - t*7.0 + aRnd.y*6.28318);
       a = (1.0 - t*0.85)*(0.22 + 0.6*fl)*uSharp;`)); }
  put(5, P(2400, (i,o) => { const a0 = Math.random()*TAU, la = (Math.random()*2 - 1)*.9;
      o.p = [a0, la, Math.random()]; o.c = mixc(C(0xffe9b0), C(0xff6a2a), Math.random()); o.s = .55 + Math.random()*.8; },
    // петли: плазма привязана к магнитной трубке и ходит по ней туда-обратно
    `float a0 = position.x, la = position.y, t = position.z;
     float u = fract(t + uTime*0.20)*3.14159;
     float h = 0.92 + sin(u)*0.42*(0.5 + 0.5*sin(a0*7.0));
     float lat = la + sin(u)*0.16*cos(a0*5.0);
     p = vec3(cos(a0)*cos(lat)*h, sin(lat)*h, sin(a0)*cos(lat)*h);
     a = (0.22 + 0.55*sin(u))*uSharp;`));
  { const pr = glow(0xffffff, .22, 1); put(5, pr); UP.push((t) => {
      const a0 = t*.35; pr.position.set(Math.cos(a0)*1.42, Math.sin(a0*.7)*.35, Math.sin(a0)*1.42); }); }

  /* 6 · хромосфера: миллионы спикул, бьющих вверх с поверхности. Курсор их не толкает и не мнёт
     (общий «толчок от курсора» этому слою не нужен — он отключается ниже через HOV, как и слоям
     7–9): под курсором струи просто бьют чаще и горят ярче — активность, а не искажение формы. */
  { const SP = 420, PER = Math.max(4, Math.round(16*Q)), bs = [];
    for (let k = 0; k < SP; k++) bs.push(fib(k, SP));
    HOV.push(put(6, pts(SP*PER, (i,o) => {
        const k = Math.floor(i/PER), t = (i - k*PER)/(PER - 1), v = bs[k];
        o.p = [v[0], v[1], v[2]]; o.rnd = [t, Math.random(), .3 + Math.random()*.9];
        o.c = mixc(C(0xff5f86), C(0xffd8b4), 1 - t); o.s = (1.05 - t*.45)*(.7 + Math.random()*.5); },
      `vec3 nrm = normalize(position);
       float t = aRnd.x;
       // Расстояние меряем по экрану (view-space xy) и только на ближней полусфере — так же, как
       // у фотосферы и конвекции: иначе «горячим» оказался бы круг по лимбу, а не место под курсором.
       vec4 mvq = modelViewMatrix*vec4(nrm, 1.0), mvc = modelViewMatrix*vec4(uCur, 1.0);
       float dd = length(mvq.xy - mvc.xy);
       float heat = uHov*exp(-dd*dd/0.12)*step(mvc.z, mvq.z);
       float life = fract(aRnd.y + uTime*(0.34 + heat*0.55));          // бьют чаще
       float up = sin(life*3.14159);
       p = nrm*(1.0 + t*(0.34 + heat*0.16)*aRnd.z*up);                 // чуть выше, не вбок
       col = mix(col, vec3(1.0, 0.95, 0.86), heat*0.55);               // горят ярче/белее
       a = up*(1.0 - t*0.6)*(0.85 + heat*1.1)*uSharp;
       s *= 1.0 + heat*0.5;`)).material); }
  HOV.push(put(6, P(3200, (i,o,n) => { const v = fib(i,n); o.p = v.map(q => q*.985); o.c = C(0xff9a70); o.s = .8 + Math.random()*.6; },
    `vec3 nrm = normalize(position);
     vec4 mvq = modelViewMatrix*vec4(nrm, 1.0), mvc = modelViewMatrix*vec4(uCur, 1.0);
     float dd = length(mvq.xy - mvc.xy);
     float heat = uHov*exp(-dd*dd/0.12)*step(mvc.z, mvq.z);
     col = mix(col, vec3(1.0, 0.92, 0.80), heat*0.5);
     a = (0.30 + 0.25*sin(uTime*1.6 + aSeed*22.0))*(1.0 + heat*0.7)*uSharp;`)).material);

  /* 7 · фотосфера: грануляция, пятна и пятно под курсором */
  HOV.push(put(7, P(14000, (i,o,n) => { const v = fib(i,n); o.p = v; o.s = .7 + Math.random()*.8; },
    // Курсор здесь не толкает шар, а делает то, что делает магнитное поле: тормозит конвекцию.
    // Под ним грануляция гаснет, проступают тень и полутень пятна, а по краю — светлые факелы.
    // Расстояние меряем ПО ЭКРАНУ (view-space xy) и только на ближней полусфере: точка попадания
    // курсора лежит в плоскости через центр, и сравнивать с ней трёхмерные расстояния нельзя —
    // «горячим» оказался бы круг по лимбу, а не место под курсором.
    `vec3 nrm = normalize(position);
     // Радиус шара в тех же единицах, в которых меряем расстояние: масштаб слоя гуляет от 2,2 до 2,7,
     // и пороги в абсолютных единицах давали то крошечное, то расплывшееся пятно.
     float vr = max(length((modelViewMatrix*vec4(1.0, 0.0, 0.0, 0.0)).xyz), 0.001);
     vec4 mvq = modelViewMatrix*vec4(nrm, 1.0), mvc = modelViewMatrix*vec4(uCur, 1.0);
     float dd = length(mvq.xy - mvc.xy)/vr;             // в долях радиуса
     float hv = step(mvc.z, mvq.z)*smoothstep(0.04, 0.40, uHov);
     // ВАЖНО: smoothstep с edge0 > edge1 по спецификации GLSL не определён и на части
     // реализаций возвращает ноль — пятна просто не появлялись. Пишем только возрастающий вид.
     float umb = hv*(1.0 - smoothstep(0.05, 0.15, dd));
     float pen = hv*(1.0 - smoothstep(0.13, 0.27, dd));
     float fac = hv*smoothstep(0.25, 0.31, dd)*(1.0 - smoothstep(0.31, 0.41, dd));
     float frz = max(umb, pen*0.6);
     float c = sin(nrm.x*17.0 + uTime*0.25)*sin(nrm.y*15.0 - uTime*0.21)*sin(nrm.z*19.0 + uTime*0.18);
     float cell = smoothstep(-0.25, 0.55, c);
     cell = mix(cell, 0.22, frz);                       // конвекция заторможена — гранул нет
     float s1 = 1.0 - smoothstep(0.10, 0.30, distance(nrm, normalize(vec3(0.55, 0.35, 0.75))));
     float s2 = 1.0 - smoothstep(0.07, 0.22, distance(nrm, normalize(vec3(-0.7, -0.2, 0.6))));
     float spot = clamp(s1 + s2 + umb + pen*0.75, 0.0, 1.0);
     p = nrm*(1.0 + cell*0.012 - spot*0.016);           // вильсоновская впадина: пятно вдавлено
     col = mix(vec3(1.0, 0.52, 0.16), vec3(1.0, 0.95, 0.72), cell);
     col = mix(col, vec3(0.30, 0.07, 0.02), spot*0.97);
     col += vec3(1.0, 0.92, 0.70)*fac*0.38;
     a = (0.30 + 0.62*cell)*(1.0 - spot*0.97)*(1.0 + fac*0.6)*uSharp;
     s *= (1.0 - spot*0.55)*(1.0 + fac*0.25);`)).material);

  /* 8 · конвекция: валы, поднимающие горячее и опускающие остывшее */
  HOV.push(put(8, P(12000, (i,o) => { const v = dir(), r = .42 + Math.pow(Math.random(), .6)*.58;
      o.p = [v[0]*r, v[1]*r, v[2]*r]; o.rnd = [Math.random(), rn(), rn()]; o.s = .6 + Math.random()*.9; },
    // Курсор не смещает шар: ячейки под ним просто закипают живее — забегают по фазе вперёд,
    // сильнее дрожат и ярче светятся. Расстояние — по экрану и только на ближней полусфере.
    `vec3 q = position; float rr = length(q); vec3 nrm = q/rr;
     float cellN = sin(nrm.x*7.0)*sin(nrm.y*6.0)*sin(nrm.z*7.5);
     float up = step(0.0, cellN);
     float life0 = fract(aRnd.x + uTime*0.10);
     float r0 = up > 0.5 ? mix(0.44, 1.05, life0) : mix(1.05, 0.44, life0);
     vec4 mvq = modelViewMatrix*vec4(nrm*r0, 1.0), mvc = modelViewMatrix*vec4(uCur, 1.0);
     float dd = length(mvq.xy - mvc.xy);
     float hot = uHov*exp(-dd*dd/0.20)*step(mvc.z, mvq.z);
     float life = fract(aRnd.x + uTime*0.10 + hot*0.30);
     float rmax = 1.05 + hot*0.10;
     float r = up > 0.5 ? mix(0.44, rmax, life) : mix(rmax, 0.44, life);
     p = nrm*r + vec3(aRnd.y, aRnd.z, 0.0)*(0.022 + hot*0.045);
     col = up > 0.5 ? mix(vec3(1.0, 0.96, 0.72), vec3(1.0, 0.48, 0.14), life)
                    : mix(vec3(0.72, 0.20, 0.05), vec3(0.42, 0.11, 0.03), life);
     a = sin(life*3.14159)*(up > 0.5 ? 0.80 : 0.45)*(1.0 + hot*0.85)*uSharp;
     s *= 1.0 + hot*0.45;`)).material);

  /* 9 · тахоклин: две встречные полосы вращения и сдвиг между ними */
  HOV.push(put(9, P(9000, (i,o,n) => { const v = fib(i,n), inner = i % 2 === 0;
      o.p = [v[0], v[1], v[2]]; o.rnd = [inner ? 0 : 1, Math.random(), 0];
      o.c = inner ? C(0xffc27a) : C(0x8fd8ff); o.s = .55 + Math.random()*.7; },
    // внутренняя оболочка вращается как целое, внешняя — быстрее на экваторе: между ними сдвиг.
    // Курсор не трогает объект целиком: под ним внешняя оболочка забегает вперёд и начинает бурлить,
    // внутренняя остаётся спокойной — сдвиг между ними от этого только заметнее.
    `vec3 nrm = normalize(position);
     float lat = asin(clamp(nrm.y, -1.0, 1.0));
     float outer = step(0.5, aRnd.x);
     float w = aRnd.x < 0.5 ? 0.30 : 0.30 + 0.55*cos(lat)*cos(lat);
     float r = aRnd.x < 0.5 ? 0.90 : 1.06;
     float a0 = atan(nrm.z, nrm.x) + uTime*w;
     vec3 q0 = vec3(cos(a0)*cos(lat)*r, sin(lat)*r, sin(a0)*cos(lat)*r);
     float vr = max(length((modelViewMatrix*vec4(1.0, 0.0, 0.0, 0.0)).xyz), 0.001);
     vec4 mvq = modelViewMatrix*vec4(q0, 1.0), mvc = modelViewMatrix*vec4(uCur, 1.0);
     float dd = length(mvq.xy - mvc.xy)/vr;             // в долях радиуса — масштаб слоя гуляет
     float boil = uHov*exp(-dd*dd/0.042)*step(mvc.z, mvq.z)*outer;
     a0 += boil*0.7;
     p = vec3(cos(a0)*cos(lat)*r, sin(lat)*r, sin(a0)*cos(lat)*r);
     p += vec3(sin(uTime*4.3 + aSeed*61.0), sin(uTime*3.7 + aSeed*37.0), sin(uTime*4.9 + aSeed*83.0))*boil*0.14;
     col = mix(col, vec3(0.86, 0.97, 1.0), boil*0.55);  // вскипевшее — белее и ярче соседей
     a = (0.30 + 0.40*fract(aSeed*19.0))*(1.0 + boil*2.9)*uSharp;
     s *= 1.0 + boil*1.8;`)).material);
  HOV.push(put(9, P(2600, (i,o) => { const la = (Math.random()*2 - 1)*1.2, a0 = Math.random()*TAU;
      o.p = [a0, la, Math.random()]; o.c = C(0xfff0c0); o.s = .5 + Math.random()*.6; },
    // вытягиваемые сдвигом силовые нити — здесь и заводится динамо
    `float a0 = position.x, lat = position.y, t = position.z;
     float sh = 0.55*cos(lat)*cos(lat);
     float ang = a0 + uTime*(0.30 + sh*t);
     float r = 0.98 + 0.04*sin(t*6.0);
     p = vec3(cos(ang)*cos(lat)*r, sin(lat)*r, sin(ang)*cos(lat)*r);
     a = (0.20 + 0.55*pow(t, 2.0))*uSharp;`)).material);

  /* 10 · лучистая зона: плотная почти неподвижная плазма и блуждающий фотон. Курсору здесь нечего
     толкать (общий «толчок» отключается ниже через HOV, как и слоям 6-9) — вместо смещения формы
     плазма под курсором просто слегка тускнеет, как и предложила Люсия: ближе к сути слоя
     (фотон поглощается и переизлучается, а не расталкивает вещество). */
  HOV.push(put(10, P(14000, (i,o) => { const v = dir(), r = Math.pow(Math.random(), .34);
      o.p = [v[0]*r, v[1]*r, v[2]*r]; o.c = mixc(C(0xffd9a0), C(0xff8c46), Math.random()); o.s = .5 + Math.random()*.7; },
    `p = position*(1.0 + 0.006*sin(uTime*3.0 + aSeed*70.0));
     // Экранное (view-space) расстояние до курсора, как у фотосферы/конвекции/тахоклина/хромосферы —
     // иначе «тёплым» окажется кольцо по лимбу, а не место под курсором.
     vec4 mvq = modelViewMatrix*vec4(p, 1.0), mvc = modelViewMatrix*vec4(uCur, 1.0);
     float dd = length(mvq.xy - mvc.xy);
     float heat = uHov*exp(-dd*dd/0.12)*step(mvc.z, mvq.z);
     // Общий шаблон (ниже, после этого чанка) сам добавляет засвет по НЕэкранному расстоянию до
     // курсора — у остальных HOV-слоёв он только усиливает их собственный эффект (там курсор делает
     // ярче), а здесь шёл бы прямо против тускнения. uPush уже обнулён (толчка не будет), но прибавку
     // к альфе и размеру гасим заранее тем же множителем, чтобы после неё получить ровно то, что нужно.
     vec3 dvG = p - uCur; float ddG = length(dvG);
     float infG = uHov*exp(-ddG*ddG/(uRad*uRad));
     a = (0.16 + 0.30*fract(aSeed*23.0))*uSharp*(1.0 - heat*0.55)/(1.0 + infG*1.4);
     s /= (1.0 + infG*0.6);`)).material);
  // Фотон и его след. Без следа это просто нервно прыгающая точка; со следом видно то, ради чего
  // слой и сделан, — запутанный путь, на который уходят тысячи лет. След пишется в кольцевой буфер
  // с постоянной частотой (иначе его длина зависела бы от кадров), а возраст точки считается
  // в шейдере от головы буфера, переданной в uProg.
  { const ph = glow(0xfff4dc, .24, 1); put(10, ph);
    const TN = 430, TR_DT = .033, HOP = .17;
    const tp3 = new Float32Array(TN*3), tsz = new Float32Array(TN), tsd = new Float32Array(TN), tcl = new Float32Array(TN*3);
    for (let i = 0; i < TN; i++){ tsd[i] = i/TN; tsz[i] = 0; tcl[i*3] = 1; tcl[i*3+1] = .86; tcl[i*3+2] = .55; }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(tp3, 3));
    tg.setAttribute("aColor", new THREE.BufferAttribute(tcl, 3));
    tg.setAttribute("aSize", new THREE.BufferAttribute(tsz, 1));
    tg.setAttribute("aSeed", new THREE.BufferAttribute(tsd, 1));
    tg.setAttribute("aRnd", new THREE.BufferAttribute(new Float32Array(TN*3), 3));
    const tm = pmat(`float age = fract(uProg - aSeed);
       col = mix(vec3(1.0, 1.0, 0.94), vec3(1.0, 0.62, 0.24), age);
       s *= 0.45 + 1.15*(1.0 - age)*(1.0 - age);
       a = aSize < 0.5 ? 0.0 : (1.0 - age)*(1.0 - age)*0.9*uSharp;`);
    const tp = new THREE.Points(tg, tm); tp.frustumCulled = false; HOV.push(put(10, tp).material);
    // Шаг фотона ограничивался по каждой оси отдельно (clamp по x, по y, по z в [-.92, .92]
    // независимо) — а не по длине вектора. У точки на углу куба (x=y=z=.92) длина получается
    // 0,92·√3 ≈ 1,59, то есть почти в полтора раза дальше плазменного облака (оно само нигде
    // не выходит за r=1): именно это и была «вторая светящаяся точка, которая порой выходит
    // за пределы сферы». Теперь ограничивается длина самого вектора смещения, не компоненты.
    const PH_RMAX = .92;
    let px2 = 0, py2 = 0, pz2 = 0, nx2 = 0, ny2 = 0, nz2 = 0, hop = 0, acc = 0, head = 0;
    UP.push((t, dt) => {
      hop -= dt;
      if (hop <= 0){ px2 = nx2; py2 = ny2; pz2 = nz2;
        const d3 = dir(), st2 = .12 + Math.random()*.16;
        let tx = px2 + d3[0]*st2, ty = py2 + d3[1]*st2, tz = pz2 + d3[2]*st2;
        const len = Math.sqrt(tx*tx + ty*ty + tz*tz);
        if (len > PH_RMAX){ const s2 = PH_RMAX/len; tx *= s2; ty *= s2; tz *= s2; }
        nx2 = tx; ny2 = ty; nz2 = tz;
        hop = HOP; }
      const k = 1 - hop/HOP;
      const x = px2 + (nx2 - px2)*k, y = py2 + (ny2 - py2)*k, z = pz2 + (nz2 - pz2)*k;
      ph.position.set(x, y, z);
      acc += dt;
      let wrote = false;
      while (acc >= TR_DT && head < 1e9){ acc -= TR_DT;
        tp3[head*3] = x; tp3[head*3+1] = y; tp3[head*3+2] = z; tsz[head] = 1.4;
        head = (head + 1) % TN; wrote = true; }
      if (wrote){ tg.attributes.position.needsUpdate = true; tg.attributes.aSize.needsUpdate = true;
        tm.uniforms.uProg.value = head/TN; } }); }

  /* 11 · ядро: протон-протонный цикл, разыгранный по шагам */
  const CORE = makeFusion(put, UP);
  // курсор не должен мять реакцию: точки ядра — тоже в HOV (толчок обнуляется, остаётся лишь лёгкая подсветка)
  LM[11].forEach(m => { if (m.uniforms && m.uniforms.uPush) HOV.push(m); });

  const api = {
    // d — глубина внутри станции V (1 — звезда целиком, 11 — ядро)
    update(d, vis, t, dt){
      // общий «толчок от курсора» этим слоям не нужен: у них свой ответ. uPush обнуляем, а uRad
      // сужаем, чтобы штатная подсветка не разгоралась по всему шару. Делается один раз — после
      // того как обход станции успел проставить свои PUSH/RAD.
      if (!hovFix){ hovFix = true;
        for (const m of HOV){ m.uniforms.uPush.value = 0; m.uniforms.uRad.value = .5; } }
      const on = d > 1.25 && vis > .002;
      G.visible = on;
      // Свечение ядра держит непрерывность спуска, но сквозь фотосферу и конвекцию светить не должно:
      // это непрозрачные слои, и светлая точка в центре читалась бы как дыра в шаре.
      heart.material.opacity = on ? vis*(.28*smooth(1.3, 2.6, d)*(1 - smooth(6.1, 7.0, d))
                                       + .22*smooth(8.8, 9.6, d)*(1 - smooth(10.4, 11.0, d))) : 0;
      heart.scale.setScalar(1.0 + 1.4*smooth(4.5, 7.5, d));
      if (!on){ for (let k = 2; k <= 11; k++) if (LG[k]) LG[k].visible = false; return 0; }
      let top = 0;
      for (let k = 2; k <= 11; k++){
        const g2 = LG[k]; if (!g2) continue;
        const w = SUN_WIN(k, d, k <= 5);
        const o = w.o*vis;
        g2.visible = o > .004;
        if (!g2.visible) continue;
        top = Math.max(top, o);
        g2.scale.setScalar(w.s*SUN_RT/SUN_R0[k]);
        for (const m of LM[k]){ if (m.uniforms && m.uniforms.uSharp) m.uniforms.uSharp.value = o; else m.opacity = (m.userData.b0 !== undefined ? m.userData.b0 : (m.userData.b0 = m.opacity))*o; }
      }
      CORE.active = d > 10.2;
      for (const f of UP) f(t, dt);
      G.rotation.y = t*.03;
      return top;
    },
    // габарит для вписывания в кадр: слои построены радиусом около 2,6
    ext(d){ const w = SUN_WIN(Math.min(11, Math.max(2, Math.round(d))), d, d <= 5.5);
            return SUN_RT*1.12*w.s; },
    group: G
  };
  return api;
}

