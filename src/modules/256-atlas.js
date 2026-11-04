/* ---------- v188: «Атлас чудес» — страницы объектов «Глубокого космоса», первая шестёрка ----------
   У каждой страницы своя сцена из частиц и своя «игрушка»: приглушить квазар, включить инфракрасный взгляд,
   услышать пульсар, взорвать Бетельгейзе, прокрутить столкновение с Андромедой, показать тёмную материю.
   Текст — как у слоёв станций: наука ●◐, традиции и мифы, параллель с человеком, практика.
   Сцена — свой WebGL-контекст на время главы (как «Сколько лететь»), освобождается при закрытии. */
const ATL_OBJ = [
  { id:"q3c", fly:"q3c", nm:"Квазар 3C 273", sub:"Самый яркий квазар неба — первый, который узнали", ly:2.4e9, size:"джет ≈200 000 световых лет ◐",
    sci:[
      "● В 1963 году Мартен Шмидт понял, что «звезда» 3C 273 удаляется от нас со скоростью около 47 000 км/с. Это не звезда, а ядро далёкой галактики — так открыли квазары.",
      "● Светит примерно в 4 триллиона раз ярче Солнца — как сотня таких галактик, как наша ◐. Его видно даже в любительский телескоп: звёздная величина около 12,9.",
      "◐ Источник света — газ, падающий на сверхмассивную чёрную дыру около миллиарда масс Солнца: диск вокруг неё раскалён до сотен тысяч градусов.",
      "● Из ядра бьёт струя-джет — частицы почти со скоростью света. Её длина ◐ около 200 000 световых лет, больше всего Млечного Пути."
    ],
    tr:"В «Бхагавадгите» Арджуна видит облик Вишну и говорит: если бы в небе разом взошли тысячи солнц, это было бы подобно сиянию Великой души. Квазар — почти буквально такой свет: тысячи миллиардов солнц в одной точке.",
    hum:"Яркое ядро прячет свою галактику, как сильное чувство заслоняет в нас всё остальное. Стоит его приглушить — и проступает целое.",
    pr:"Минута тихого света. Закройте глаза и представьте яркую точку перед собой. Не гасите её — просто мягко уменьшите яркость и заметьте, что всё это время было вокруг.",
    toy:{ kind:"range", lab:"Яркость квазара", hint:"Приглушите квазар — проступит галактика, которую он затмевает примерно в сто раз ◐" } },
  { id:"ori", fly:"ori", nm:"Туманность Ориона", sub:"M42 — ближайшая большая колыбель звёзд", ly:1344, size:"около 24 световых лет ●",
    sci:[
      "● Видна без телескопа: туманное пятнышко в «мече» Ориона, под тремя звёздами пояса.",
      "● В центре — Трапеция: четыре молодые горячие звезды. Их ультрафиолет заставляет газ светиться: розовое — водород (линия H-альфа, 656 нм), бирюзовое — кислород (O III, 501 нм).",
      "● «Хаббл» нашёл здесь протопланетные диски — проплиды: зародыши планетных систем, какой была наша 4,6 миллиарда лет назад.",
      "● Пыль прячет от глаза тысячи рождающихся звёзд. Инфракрасный свет проходит сквозь пыль — поэтому «Джеймс Уэбб» видит их ясно."
    ],
    tr:"◐ У майя-киче три звезды Ориона — Альнитак, Саиф и Ригель — три камня очага в центре мира, а туманность между ними — дым и огонь творения. Огонь в очаге рождает мир так же, как здесь рождаются звёзды.",
    hum:"◐ Солнце, вероятно, родилось в похожем звёздном скоплении. Атомы вашего тела когда-то были таким же светящимся газом.",
    pr:"Дыхание очага. На вдохе тепло собирается в центре груди, как свет в Трапеции. На выдохе оно мягко расходится и освещает всё вокруг. Шесть-восемь медленных дыханий.",
    toy:{ kind:"toggle", lab:"Инфракрасный взгляд", hint:"Включите инфракрасный — туман станет прозрачным, проступят рождающиеся звёзды ●" } },
  { id:"crab", fly:"crab", nm:"Крабовидная туманность", sub:"M1 — остаток сверхновой 1054 года и пульсар в её сердце", ly:6500, size:"около 11 световых лет ◐",
    sci:[
      "● 4 июля 1054 года китайские астрономы записали «звезду-гостью»: 23 дня её было видно даже днём, ночью — почти два года.",
      "● В центре — пульсар: нейтронная звезда размером с город (около 20 км), тяжелее Солнца. Она делает около 30 оборотов в секунду и посылает два луча, как маяк.",
      "● Голубое свечение — синхротронное: электроны, разогнанные пульсаром почти до скорости света, вьются в магнитном поле.",
      "● Туманность до сих пор разлетается — примерно 1 500 км/с."
    ],
    tr:"● В китайской «Истории Сун» вспышка названа «звездой-гостьей». ◐ В Чако-Каньоне (США) на скале нарисованы полумесяц, звезда и ладонь — возможно, предки пуэбло тоже видели эту сверхновую.",
    hum:"● Многие тяжёлые атомы нашего тела родились в звёздах и разлетелись по Галактике такими взрывами. Мы в буквальном смысле — пепел звёзд.",
    pr:"Слушать ритм. Включите звук пульсара и найдите свой пульс на запястье: около одного удара в секунду. За это время пульсар успевает обернуться 30 раз.",
    toy:{ kind:"sound", lab:"Слушать пульсар", hint:"● Пульсар Краба — 30 оборотов в секунду: каждый щелчок — луч, прошедший по Земле. Луч на экране замедлен" } },
  { id:"bet", fly:"bet", nm:"Бетельгейзе", sub:"Красный сверхгигант в плече Ориона — звезда накануне взрыва", ly:550, size:"радиус ◐ около 760 солнечных — почти до орбиты Юпитера",
    sci:[
      "● Одна из крупнейших звёзд, видимых глазом: на месте Солнца она поглотила бы Меркурий, Венеру, Землю и Марс ◐.",
      "● В конце 2019 – начале 2020 года случилось «Великое потускнение»: звезда ослабла примерно в 2,5–3 раза. Причина — выброс вещества и облако пыли, которое заслонило часть звезды.",
      "◐ В 2025 году телескоп Gemini North впервые увидел её маленький спутник; ему дали имя Сиварха.",
      "◐ Бетельгейзе взорвётся сверхновой — по оценкам, в ближайшие 100 000 лет. Её будет видно днём, а ночью она станет ярче полумесяца. Для Земли это не опасно ●: она слишком далеко."
    ],
    tr:"● Имя — от арабского «йад аль-джауза», «рука аль-Джаузы». У греков Орион — великан-охотник; Бетельгейзе — его плечо, Ригель — нога.",
    hum:"Перед концом звезда сбрасывает внешние оболочки — тысячи лет отпускает то, что было ею. Похоже на зрелость: отдать лишнее, чтобы осталось ядро.",
    pr:"Созерцание цвета. Зимним вечером найдите Орион: слева вверху — оранжевая Бетельгейзе, справа внизу — голубой Ригель. Смотрите на них по очереди полминуты и заметьте, как меняется ощущение.",
    toy:{ kind:"toggle", lab:"Взорвать", hint:"Небо Земли в ночь сверхновой ◐: Бетельгейзе ярче полумесяца — видна днём, ночью от неё тени" } },
  { id:"and", fly:"and", nm:"Галактика Андромеды", sub:"M31 — соседка, с которой мы, возможно, сольёмся", ly:2.5e6, size:"диск ◐ около 150 000 световых лет",
    sci:[
      "● В 1923 году Эдвин Хаббл нашёл в «туманности» Андромеды звёзды-цефеиды и измерил расстояние: она далеко за пределами Млечного Пути. Так стало ясно, что галактик много.",
      "◐ В ней около триллиона звёзд — больше, чем в нашей Галактике.",
      "● Андромеда приближается к нам — около 110 км/с.",
      "◐ Долго считалось, что столкновение неизбежно через ≈4,5 млрд лет. Расчёты 2025 года по данным Gaia и «Хаббла» дают примерно 50 на 50 за ближайшие 10 млрд лет. Здесь — сценарий, в котором встреча случится."
    ],
    tr:"● Первая запись — у персидского астронома ас-Суфи в «Книге неподвижных звёзд» (964 год): «маленькое облачко». Её видно без телескопа — самый далёкий объект, доступный глазу.",
    hum:"● При слиянии галактик звёзды почти не сталкиваются — между ними огромные расстояния. Встреча меняет форму обеих, но не разрушает их.",
    pr:"Осенним вечером, вдали от городских огней, найдите рядом с Кассиопеей бледное пятнышко. Свет, который войдёт в глаз, вышел, когда на Земле только появились первые люди рода Homo.",
    toy:{ kind:"range", lab:"Время", hint:"Прокрутите вперёд: первое сближение, хвосты из звёзд, слияние в одну эллиптическую галактику ◐" } },
  { id:"bul", fly:null, nm:"Скопление «Пуля»", sub:"1E 0657-56 — где тёмную материю увидели почти «напрямую»", ly:3.7e9, size:"несколько миллионов световых лет ◐",
    sci:[
      "● Два скопления галактик пролетели друг сквозь друга около 150 млн лет назад ◐. Меньшее похоже на пулю: перед ним — ударная волна в горячем газе.",
      "● Горячий газ (розовый — рентген, телескоп «Чандра») столкнулся и затормозился посередине. А галактики прошли насквозь почти без столкновений.",
      "● Массу измерили иначе — по тому, как она искривляет свет далёких галактик (гравитационное линзирование). Больше всего массы оказалось не там, где газ, а там, где галактики: синие облака.",
      "● Значит, основная масса скоплений — невидимое вещество, которое не светится и проходит сквозь само себя. Это одно из сильнейших свидетельств тёмной материи (2006)."
    ],
    tr:"«Смотрю на него и не вижу — и называю его невидимым», — сказано в «Дао дэ цзин» о Дао. Почти во всех традициях видимое держится на том, чего не видно.",
    hum:"Больше всего нас держит то, чего не видно: связи, смысл, внимание. Как тёмная материя — она не светится, но без неё не удержалась бы ни одна галактика.",
    pr:"Заметить невидимую опору. Сядьте и почувствуйте, как вас держит стул и пол, как воздух входит сам. Минуту просто замечайте то, что держит вас, не показываясь.",
    toy:{ kind:"toggle2", lab:"Показать тёмную материю", lab2:"Время удара", hint:"Розовое — горячий газ ●, синее — где на самом деле масса ●. Двигайте время: газ тормозит, а галактики и тёмная материя проходят насквозь" } }
];
ATL_OBJ.forEach(o => { o.km = o.ly*FLY_LY; });

const ATL = (() => {
  const box = $("chAtl"); let cvs = $("atlCv");
  const EN = SITE_LANG === "en";
  let open = false, built = false, raf = 0, last = 0, rend, scn, cam, world, sky, cur = null, oI = 0, toyV = 1, toyB = 0, toyT = 1, toyTo = 1, seen = 0;
  let drag = null, yaw = 0, pitch = 0, yawT = 0, pitchT = 0, zoom = 1, zoomT = 1;
  const FRAG = `varying vec3 vC; varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); float g = smoothstep(0.5, 0.0, r); g *= g; if (g*vA < 0.003) discard; gl_FragColor = vec4(vC, g*vA); }`;
  const gs = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); };
  const col3 = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  // облако точек: fill(i, o) пишет в o = [x, y, z, r, g, b, размер]; spin — дифференциальное вращение в шейдере (как у галактик)
  function cloud(n, fill, spin, dyn){
    n = Math.max(1, Math.round(n*Q)); const P = new Float32Array(n*3), C = new Float32Array(n*3), S = new Float32Array(n), o = [0, 0, 0, 1, 1, 1, 1];
    for (let i = 0; i < n; i++){ fill(i, o, n); P[i*3] = o[0]; P[i*3 + 1] = o[1]; P[i*3 + 2] = o[2]; C[i*3] = o[3]; C[i*3 + 1] = o[4]; C[i*3 + 2] = o[5]; S[i] = o[6]; }
    const g = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(P, 3); if (dyn) pa.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", pa); g.setAttribute("aC", new THREE.BufferAttribute(C, 3)); g.setAttribute("aS", new THREE.BufferAttribute(S, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 1 }, uPR: { value: Math.min(2, devicePixelRatio || 1) }, uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aC; attribute float aS; uniform float uA; uniform float uPR; uniform float uT; varying vec3 vC; varying float vA;
      void main(){ vec3 p = position; float a = uT*${(spin || 0).toFixed(3)}/(0.3 + length(p.xz)); p.xz = mat2(cos(a), -sin(a), sin(a), cos(a))*p.xz;
        vec4 mv = modelViewMatrix*vec4(p, 1.0); gl_Position = projectionMatrix*mv; vC = aC; vA = uA*0.6;
        gl_PointSize = uPR*aS*clamp(60.0/max(1.0, -mv.z), 0.8, 10.0); }`, fragmentShader: FRAG });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.userData.P = P; pts.userData.n = n; return pts;
  }
  const A = (o, a) => { o.material.uniforms ? o.material.uniforms.uA.value = a : o.material.opacity = a; };
  const sm = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };

  /* ---------- сцены: build() → { g, upd(t, dt, v, b) } ---------- */
  const SCENE = {
    // квазар: тусклая эллиптическая галактика-хозяйка, раскалённый диск, односторонний джет с узлами
    q3c(){
      const g = new THREE.Group();
      const host = cloud(9000, (i, o) => { const r = Math.pow(Math.random(), 1.6)*5.5, v = dir(); o.splice(0, 7, v[0]*r*1.2, v[1]*r*.8, v[2]*r, 1, .82, .6, .7 + Math.random()*.8); }); g.add(host);
      const disk = cloud(2500, (i, o) => { const r = .25 + Math.pow(Math.random(), .7)*1.1, a = Math.random()*TAU, w = 1 - r/1.4; o.splice(0, 7, Math.cos(a)*r, gs()*.03, Math.sin(a)*r, .7 + .3*w, .8 + .2*w, 1, .6 + .8*w); }, .9); disk.rotation.x = .5; g.add(disk);
      const jet = cloud(3000, (i, o) => { const t = Math.pow(Math.random(), .8), x = .5 + t*9, k = Math.sin(t*38)*.5 + .5, w = .05 + t*.35; o.splice(0, 7, x, gs()*w*.6 + t*1.2, gs()*w*.6, .55 + .4*k, .7 + .25*k, 1, .5 + 1.2*k*(1 - t*.5)); });
      jet.rotation.z = .25; g.add(jet);
      const core = glow(0xffffff, 3, 1), halo = glow(0xcfe4ff, 14, .6), spike = glow(0xe8f0ff, 40, .25); g.add(core, halo, spike);
      return { g, upd(t, dt, v){
        // v — яркость квазара. Экспозиция под самое яркое: пока квазар горит, хозяйка не видна
        const q = Math.max(.02, v); A(host, clamp(.06/q, 0, 1)*.9); A(core, .3 + .7*q); A(halo, .6*q); A(spike, .25*q*q); A(disk, .25 + .75*q); A(jet, .3 + .5*q);
        disk.material.uniforms.uT.value = t; } };
    },
    // туманность Ориона: розовый водород, бирюзовый кислород в центре, тёмные прожилки; в инфракрасном — протозвёзды
    ori(){
      const g = new THREE.Group();
      const n3 = (x, y, z) => Math.sin(x*1.3 + Math.sin(y*1.7)*1.4)*Math.cos(y*1.1 - z*.8) + .5*Math.sin(x*2.9 - y*2.3 + z);
      const gas = cloud(16000, (i, o) => {
        let x = gs()*4, y = gs()*3.2, z = gs()*1.4 - Math.hypot(x, y)*.25; const r = Math.hypot(x, y), f = n3(x, y, z);
        if (f < -.55 && Math.random() < .8){ x *= 1.3; y *= 1.3; }   // тёмные прожилки — там, где пыль
        const oiii = Math.random() < Math.exp(-r*.45)*.9, c = oiii ? [.35, .9, .85] : [1, .38, .55], k = .45 + .3*(f + 1)/2;
        o.splice(0, 7, x, y, z, c[0]*k*.7, c[1]*k*.7, c[2]*k*.7, 3 + Math.random()*5); });   // крупные тусклые точки — сплошное свечение газа
      g.add(gas);
      const trap = [[-.18, .1], [.15, .16], [.05, -.14], [-.06, -.02]].map(([x, y]) => { const s = glow(0xeaf2ff, 1.1, 1); s.position.set(x, y, .4); g.add(s); return s; });
      const tg = glow(0xcfe8ff, 5, .4); tg.position.z = .3; g.add(tg);
      const ir = cloud(700, (i, o) => { const x = gs()*2.6, y = gs()*2.1, w = Math.random(); o.splice(0, 7, x, y, gs()*.6, 1, .75 + .25*w, .55 + .4*w, .9 + Math.pow(Math.random(), 3)*3); }); g.add(ir);
      const prop = cloud(60, (i, o) => { const a = Math.random()*TAU, r = .3 + Math.random()*1.2; o.splice(0, 7, Math.cos(a)*r, Math.sin(a)*r*.8, .5, 1, .7, .4, 2.2); }); g.add(prop);
      let k = 0;
      return { g, upd(t, dt, v, b){ k += ((b ? 1 : 0) - k)*Math.min(1, dt*1.6);
        A(gas, .6*(1 - .85*k)); A(ir, 1.4*k); A(prop, .25 + .75*k); A(tg, .4*(1 - .5*k)); } };
    },
    // Краб: волокна по оболочке, голубое синхротронное сияние, пульсар с двумя лучами
    crab(){
      const g = new THREE.Group();
      const fil = cloud(9000, (i, o) => { const v = dir(), s = Math.sin(v[0]*7 + v[1]*5)*Math.cos(v[2]*6 - v[0]*3), r = 2.3 + .35*s + Math.random()*.25; const keep = Math.abs(s) > .35 || Math.random() < .25;
        const R = keep ? r : r*.6; o.splice(0, 7, v[0]*R*1.35, v[1]*R, v[2]*R*.9, 1, .42 + .2*Math.random(), .2, keep ? .8 + Math.random() : .4); }); g.add(fil);
      const syn = cloud(6000, (i, o) => { const v = dir(), r = Math.pow(Math.random(), .6)*2; o.splice(0, 7, v[0]*r*1.3, v[1]*r, v[2]*r*.85, .45, .6, 1, .9 + Math.random()*.9); }); g.add(syn);
      const psr = glow(0xffffff, .9, 1), ps2 = glow(0xbcd8ff, 3, .5); g.add(psr, ps2);
      const beams = new THREE.Group(); g.add(beams);
      const beam = cloud(1600, (i, o) => { const s = i % 2 ? 1 : -1, t = Math.pow(Math.random(), .7)*5.5, w = t*.06; o.splice(0, 7, gs()*w, s*t, gs()*w, .75, .85, 1, 1.2*(1 - t/6.5) + .2); });
      beams.add(beam); beams.rotation.z = .5;
      return { g, upd(t, dt){ beams.rotation.y = t*TAU*.5; const f = Math.max(0, Math.cos(t*TAU*.5))**8; A(psr, .6 + .4*f); A(ps2, .3 + .4*f); A(beam, .7); } };
    },
    // Бетельгейзе: огромная красная звезда с конвективными ячейками, пыльная оболочка, спутник; «взрыв» — небо Ориона
    bet(){
      const g = new THREE.Group(), star = new THREE.Group(); g.add(star);
      const cell = (v) => { const a = Math.sin(v[0]*4.1 + Math.sin(v[1]*3.3)*2)*Math.cos(v[2]*3.7 - v[0]*2.1); return .5 + .5*a; };
      const surf = cloud(14000, (i, o) => { const v = dir(), c = cell(v), r = 3 + gs()*.04; o.splice(0, 7, v[0]*r, v[1]*r, v[2]*r, 1, .22 + .32*c, .08 + .12*c, .8 + 1.4*c); }, .05); star.add(surf);
      const dust = cloud(4000, (i, o) => { const v = dir(), r = 3.3 + Math.pow(Math.random(), 2)*5; o.splice(0, 7, v[0]*r, v[1]*r, v[2]*r, .6, .32, .2, .5 + Math.random()*.6); }); star.add(dust);
      const sg = glow(0xff7040, 12, .45); star.add(sg);
      const comp = glow(0xdfe8ff, .7, 1); star.add(comp);
      // небо Земли: Орион (прямое восхождение, склонение, звёздная величина)
      const sky2 = new THREE.Group(); g.add(sky2);
      const OR = [["bet", 5.92, 7.4, .5, 0xffa060], ["rig", 5.24, -8.2, .13, 0xbcd2ff], ["bel", 5.42, 6.35, 1.6, 0xcfe0ff], ["sai", 5.80, -9.67, 2.1, 0xcfe0ff],
                  ["aln", 5.68, -1.94, 1.8, 0xcfe0ff], ["alm", 5.60, -1.20, 1.7, 0xcfe0ff], ["min", 5.53, -.30, 2.2, 0xcfe0ff], ["mei", 5.59, 9.93, 3.4, 0xcfe0ff]];
      const os = {}; OR.forEach(([k, ra, de, m, c]) => { const s = glow(c, 1.6*Math.pow(10, -.12*m), 1); s.position.set(-(ra - 5.6)*15*.32, de*.32, 0); sky2.add(s); os[k] = s; });
      const field = cloud(1500, (i, o) => o.splice(0, 7, (Math.random() - .5)*22, (Math.random() - .5)*14, -1, .8, .85, 1, .3 + Math.random()*.6)); sky2.add(field);
      const sn = glow(0xeaf2ff, 1, 0), snh = glow(0xcfe0ff, 1, 0); sn.position.copy(os.bet.position); snh.position.copy(os.bet.position); sky2.add(sn, snh);
      let k = 0;
      return { g, upd(t, dt, v, b){ k += ((b ? 1 : 0) - k)*Math.min(1, dt*.9);
        const pulse = 1 + .025*Math.sin(t*.9); star.scale.setScalar(pulse*(1 - .7*sm(0, .5, k))); comp.position.set(Math.cos(t*.25)*4.4, .5, Math.sin(t*.25)*4.4);
        [surf, dust].forEach(o => A(o, 1 - sm(0, .5, k))); A(sg, .45*(1 - sm(0, .5, k))); A(comp, 1 - sm(0, .5, k));
        const s2 = sm(.3, .8, k); sky2.children.forEach(c => { if (c !== sn && c !== snh) A(c, s2*(c === field ? .8 : 1)); });
        const f = sm(.55, 1, k); A(os.bet, s2*(1 - f)); A(sn, f); A(snh, f*.55); sn.scale.setScalar(.5 + 2.6*f); snh.scale.setScalar(1 + 12*f); } };
    },
    // Андромеда и Млечный Путь: ограниченная задача трёх тел (две массы + пробные звёзды), трение для слияния
    and(){
      const g = new THREE.Group(), N1 = Math.round(3400*Q), N2 = Math.round(2800*Q), N = N1 + N2;
      const pts = cloud(N, (i, o) => { const a = i < N1; o.splice(0, 7, 0, 0, 0, ...(a ? [1, .84, .62] : [.7, .8, 1]), .9 + Math.random()*.8); }, 0, true); g.add(pts);
      const P = pts.userData.P, Vv = new Float32Array(N*3), G1 = glow(0xffe6c0, 2.4, .9), G2 = glow(0xdfe8ff, 2, .9); g.add(G1, G2);
      const M1 = 1.5, M2 = 1, eps = .35, R1 = 4.2, R2 = 3.4;
      let S = null, tNow = 0;
      const n1 = new THREE.Vector3(.25, 1, .1).normalize(), n2 = new THREE.Vector3(-.5, .8, .35).normalize();
      function disk(i0, i1, c, v, M, R, nrm){
        const e1 = new THREE.Vector3(1, 0, 0).cross(nrm).normalize(), e2 = nrm.clone().cross(e1);
        for (let i = i0; i < i1; i++){ const r = .4 + Math.pow(Math.random(), .9)*R, a = Math.random()*TAU, vc = Math.sqrt(M*r*r/Math.pow(r*r + eps*eps, 1.5));
          const p = e1.clone().multiplyScalar(Math.cos(a)*r).add(e2.clone().multiplyScalar(Math.sin(a)*r)).add(nrm.clone().multiplyScalar(gs()*.06));
          const w = e1.clone().multiplyScalar(-Math.sin(a)*vc).add(e2.clone().multiplyScalar(Math.cos(a)*vc));
          P[i*3] = c[0] + p.x; P[i*3 + 1] = c[1] + p.y; P[i*3 + 2] = c[2] + p.z; Vv[i*3] = v[0] + w.x; Vv[i*3 + 1] = v[1] + w.y; Vv[i*3 + 2] = v[2] + w.z; }
      }
      function reset(){
        const c1 = [-3.4, 0, -1.4], c2 = [5.1, 1.1, 2.1], v1 = [.17, 0, .035], v2 = [-.255, -.03, -.15];   // центр масс — в начале координат
        S = { c1, c2, v1, v2 }; tNow = 0; disk(0, N1, c1, v1, M1, R1, n1); disk(N1, N, c2, v2, M2, R2, n2);
      }
      reset();
      const DT = .05, T_END = 10, STEPS = 520;   // 520 шагов = 10 млрд лет
      function step(){
        const { c1, c2, v1, v2 } = S, dx = c2[0] - c1[0], dy = c2[1] - c1[1], dz = c2[2] - c1[2], d2 = dx*dx + dy*dy + dz*dz + eps*eps, d3 = Math.pow(d2, 1.5);
        // динамическое трение: при сближении центры теряют относительную скорость — так галактики и сливаются
        const fr = .022*Math.exp(-Math.sqrt(d2)/2.5), rv = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        for (let k = 0; k < 3; k++){ const d = [dx, dy, dz][k]; v1[k] += (M2*d/d3 + fr*rv[k]*M2/(M1 + M2))*DT; v2[k] += (-M1*d/d3 - fr*rv[k]*M1/(M1 + M2))*DT; }
        for (let k = 0; k < 3; k++){ c1[k] += v1[k]*DT; c2[k] += v2[k]*DT; }
        for (let i = 0; i < N; i++){ const j = i*3; let ax = 0, ay = 0, az = 0;
          for (const [c, M] of [[c1, M1], [c2, M2]]){ const x = c[0] - P[j], y = c[1] - P[j + 1], z = c[2] - P[j + 2], q = x*x + y*y + z*z + eps*eps, f = M/(q*Math.sqrt(q)); ax += x*f; ay += y*f; az += z*f; }
          Vv[j] += ax*DT; Vv[j + 1] += ay*DT; Vv[j + 2] += az*DT; P[j] += Vv[j]*DT; P[j + 1] += Vv[j + 1]*DT; P[j + 2] += Vv[j + 2]*DT; }
        tNow += T_END/STEPS;
      }
      return { g, get t(){ return tNow; }, upd(t, dt, v){
        const want = v*T_END; let cap = 14; if (want < tNow - 1e-6){ reset(); cap = STEPS; }   // назад — пересчёт с начала сразу до нужного момента
        let n = 0; while (tNow < want - 1e-6 && n++ < cap) step();
        pts.geometry.attributes.position.needsUpdate = true; G1.position.fromArray(S.c1); G2.position.fromArray(S.c2);
        const dd = Math.hypot(S.c1[0] - S.c2[0], S.c1[1] - S.c2[1], S.c1[2] - S.c2[2]); A(G2, .9*sm(.6, 2.5, dd)); G1.scale.setScalar(2.4 + 1.6*(1 - sm(.6, 2.5, dd))); } };
    },
    // «Пуля»: галактики и тёмная материя проходят насквозь, горячий газ тормозит посередине и вытягивается в ударную волну
    bul(){
      const g = new THREE.Group();
      const mk = (n, sx, col, sz) => cloud(n, (i, o) => o.splice(0, 7, gs()*sx, gs()*sx*.8, gs()*sx*.7, ...col, sz()), 0, false);
      const galA = mk(500, 1.6, [1, .92, .75], () => .8 + Math.random()*1.2), galB = mk(260, .9, [1, .92, .75], () => .8 + Math.random()*1.2);
      const dmA = mk(4000, 2.2, [.25, .45, 1], () => 1.6 + Math.random()*2), dmB = mk(2400, 1.3, [.25, .45, 1], () => 1.6 + Math.random()*2);
      const gasA = mk(4000, 1.8, [1, .35, .62], () => 1.4 + Math.random()*1.8);
      // газ «пули» — конус: острый нос впереди (ударная волна), хвост позади
      const gasB = cloud(2600, (i, o) => { const t = Math.random(), x = 1.2 - t*2.6, w = .25 + t*1.1; o.splice(0, 7, x, gs()*w*.6, gs()*w*.5, 1, .38, .65, 1.4 + Math.random()*1.6); });
      const shock = cloud(1200, (i, o) => { const a = (Math.random() - .5)*2.2, r = 1.6; o.splice(0, 7, r*Math.cos(a)*.55 + .9, r*Math.sin(a), gs()*.3, 1, .7, .85, .9); });
      g.add(dmA, dmB, gasA, gasB, shock, galA, galB);
      let k = 0;
      return { g, upd(t, dt, v, b){
        k += ((b ? 1 : 0) - k)*Math.min(1, dt*2);
        const tau = v*2 - 1;   // −1 — до удара, 0 — встреча, 1 — сейчас
        const xA = -2*tau - .5, xB = 4.2*tau, after = Math.max(0, tau);
        const gA = tau < 0 ? xA : -.5 - 2*tau*.25, gB = tau < 0 ? xB : xB*.38;
        galA.position.x = dmA.position.x = xA; galB.position.x = dmB.position.x = xB; gasA.position.x = gA; gasB.position.x = gB; shock.position.x = gB + .2;
        gasB.scale.set(1 + .5*after, 1 - .2*after, 1); A(shock, .7*sm(.05, .5, tau)); A(gasA, .55); A(gasB, .65); A(dmA, .55*k); A(dmB, .55*k); A(galA, 1); A(galB, 1); } };
    }
  };

  /* ---------- интерфейс ---------- */
  const grid = $("atlGrid"), card = $("atlCard"), toy = $("atlToy");
  const fm = () => FLY.fmt;
  function cards(){
    grid.innerHTML = ATL_OBJ.map((o, i) => `<button class="at-c" data-i="${i}" data-hover><span class="mono">${String(i + 1).padStart(2, "0")}</span><b>${esc(o.nm)}</b></button>`).join("");
    grid.querySelectorAll("[data-i]").forEach(b => b.onclick = () => pick(+b.dataset.i));
  }
  function page(){
    const o = ATL_OBJ[oI], f = fm(), voy = o.km/17;   // «Вояджер-1», ≈17 км/с
    let h = `<div class="tm-bar"><span class="mono eyebrow tm-cat">${esc(EN ? "Atlas of wonders" : "Атлас чудес")} · ${oI + 1}/${ATL_OBJ.length}</span></div>
      <h3>${esc(o.nm)}</h3><p class="tm-ago2">${esc(o.sub)}</p>
      <div class="at-facts"><div><span class="mono">${esc(EN ? "distance" : "расстояние")}</span><b>${esc(f.fmtD(o.km))}</b></div><div><span class="mono">${esc(EN ? "size" : "размер")}</span><b>${esc(o.size)}</b></div>
        <div><span class="mono">${esc(EN ? "by Voyager" : "на «Вояджере»")}</span><b>${esc(f.fmtT(voy))}</b></div><div><span class="mono">${esc(EN ? "the light travelled" : "свет шёл")}</span><b>${esc(f.agoT(o.ly))}</b></div></div>
      <h4>${esc(EN ? "Science" : "Наука")}</h4><ul class="list at-sci">${o.sci.map(x => `<li><span>${esc(x)}</span></li>`).join("")}</ul>
      <h4>${esc(EN ? "Traditions and myths" : "Традиции и мифы")}</h4><p class="tm-pr">${esc(o.tr)}</p>
      <h4>${esc(EN ? "A parallel with the human being" : "Параллель с человеком")}</h4><p class="tm-pr">${esc(o.hum)}</p>
      <h4>${esc(EN ? "Practice" : "Практика")}</h4><p class="tm-pr">${esc(o.pr)}</p>
      <div class="tm-gos">${o.fly ? `<button class="btn tm-go at-sky" data-hover>${esc(EN ? "What the light saw →" : "Что видел свет →")}</button><button class="btn tm-go at-fly" data-hover>${esc(EN ? "How long to fly →" : "Сколько лететь →")}</button>` : ""}
        <button class="btn tm-go at-next" data-hover>${esc(EN ? "Next wonder →" : "Следующее чудо →")}</button></div>`;
    card.innerHTML = h; $("atlScroll").scrollTop = 0;
    const s = card.querySelector(".at-sky"); if (s) s.onclick = () => { navMark(); RT.go({ t:"sky", d: o.fly }); };
    const fl = card.querySelector(".at-fly"); if (fl) fl.onclick = () => { navMark(); RT.go({ t:"fly", d: o.fly, v:"g1" }); };
    card.querySelector(".at-next").onclick = () => pick((oI + 1) % ATL_OBJ.length);
  }
  // игрушка: ползунок, переключатель, звук
  let audio = null;
  function toyUI(){
    const o = ATL_OBJ[oI], t = o.toy; let h = `<span class="mono at-tl">${esc(t.lab)}</span>`;
    if (t.kind === "range") h += `<input type="range" id="atlR" min="0" max="1000" value="${o.id === "and" ? 0 : 1000}" aria-label="${esc(t.lab)}">${o.id === "and" ? `<button class="tm-link at-play" id="atlPlay" data-hover>▶</button><span class="mono at-tv" id="atlTv"></span>` : ""}`;
    else if (t.kind === "toggle" || t.kind === "sound") h = `<button class="btn at-tb" id="atlB" aria-pressed="false" data-hover>${esc(t.lab)}</button>`;
    else if (t.kind === "toggle2") h = `<button class="btn at-tb" id="atlB" aria-pressed="false" data-hover>${esc(t.lab)}</button><span class="mono at-tl">${esc(t.lab2)}</span><input type="range" id="atlR" min="0" max="1000" value="1000" aria-label="${esc(t.lab2)}">`;
    toy.innerHTML = `<div class="at-tr">${h}</div><p class="at-hint">${esc(t.hint)}</p>`;
    const r = $("atlR"); toyT = toyV = r ? +r.value/1000 : 1; toyB = 0;
    if (r) r.oninput = () => { toyT = +r.value/1000; playing = false; syncPlay(); };
    const b = $("atlB"); if (b) b.onclick = () => { toyB = toyB ? 0 : 1; b.setAttribute("aria-pressed", String(!!toyB));
      if (t.kind === "sound") toyB ? pulsarOn() : pulsarOff();
      if (o.id === "bet") b.textContent = toyB ? (EN ? "Back to the star" : "Вернуться к звезде") : t.lab; };
    const pl = $("atlPlay"); if (pl) pl.onclick = () => { playing = !playing; if (playing && toyT >= .999){ toyT = 0; r.value = 0; } syncPlay(); };
  }
  let playing = false; const syncPlay = () => { const pl = $("atlPlay"); if (pl) pl.textContent = playing ? "❚❚" : "▶"; };
  // звук пульсара Краба: щелчок каждые 33,7 мс (29,6 оборота в секунду ●) — короткий шумовой импульс, петля в 1 с
  function pulsarOn(){
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ac = new AC(), sr = ac.sampleRate, buf = ac.createBuffer(1, sr, sr), d = buf.getChannelData(0), P = sr/29.6;
      for (let k = 0; k*P < sr; k++){ const i0 = Math.round(k*P); for (let j = 0; j < sr*.004 && i0 + j < sr; j++) d[i0 + j] += (Math.random()*2 - 1)*Math.exp(-j/(sr*.0007)); }
      const src = ac.createBufferSource(), gn = ac.createGain(), lp = ac.createBiquadFilter(); src.buffer = buf; src.loop = true; lp.type = "lowpass"; lp.frequency.value = 2400; gn.gain.value = .0001;
      src.connect(lp); lp.connect(gn); gn.connect(ac.destination); src.start(); gn.gain.exponentialRampToValueAtTime(.35, ac.currentTime + .4);
      audio = { ac, src, gn };
    } catch(e){ audio = null; }
  }
  function pulsarOff(){ if (!audio) return; const a = audio; audio = null; try { a.gn.gain.exponentialRampToValueAtTime(.0001, a.ac.currentTime + .25); setTimeout(() => { try { a.src.stop(); a.ac.close(); } catch(e){} }, 350); } catch(e){} }
  function hudAnd(){
    const tv = $("atlTv"); if (!tv || !cur || cur.t == null) return; const t = cur.t;
    tv.textContent = "+" + (t < .05 ? "0" : t.toLocaleString(EN ? "en-US" : "ru-RU", { maximumFractionDigits: 1 })) + (EN ? " bn yr" : " млрд лет") + " · " + (t < 3.5 ? (EN ? "approaching" : "сближение") : t < 5 ? (EN ? "first pass ◐" : "первое касание ◐") : t < 6.5 ? (EN ? "tidal tails" : "приливные хвосты") : (EN ? "one elliptical galaxy" : "одна эллиптическая галактика"));
  }
  function pick(i){
    oI = i; grid.querySelectorAll("[data-i]").forEach(b => b.classList.toggle("on", +b.dataset.i === oI));
    pulsarOff(); playing = false;
    page(); toyUI(); syncPlay();
    if (built){ if (cur){ world.remove(cur.g); cur.g.traverse(o => { if (o.geometry && !o.isSprite) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
      cur = SCENE[ATL_OBJ[oI].id](); world.add(cur.g); yaw = yawT = ATL_OBJ[oI].id === "bet" ? 0 : .3; pitch = pitchT = .15; zoom = zoomT = ATL_OBJ[oI].id === "and" ? 1.45 : 1; }
    jrMark("atl", ATL_OBJ[oI].id, ATL_OBJ[oI].nm);
  }
  /* ---------- сцена ---------- */
  function build(){
    built = true;
    rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: false, powerPreference: "high-performance" }); rend.setClearColor(0x020309, 1);
    scn = new THREE.Scene(); cam = new THREE.PerspectiveCamera(50, 1, .05, 400); world = new THREE.Group(); world.position.z = -16; scn.add(world);
    sky = cloud(2600, (i, o) => { const v = dir(), r = 120; o.splice(0, 7, v[0]*r, v[1]*r, v[2]*r, .85, .88, 1, .5 + Math.pow(Math.random(), 6)*2.5); }); scn.add(sky);
    cvs.addEventListener("webglcontextlost", e => { e.preventDefault(); }, false);
    cvs.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, a: yawT, b: pitchT }; try { cvs.setPointerCapture(e.pointerId); } catch(_){} });
    cvs.addEventListener("pointermove", e => { if (!drag) return; yawT = drag.a + (e.clientX - drag.x)*.006; pitchT = clamp(drag.b + (e.clientY - drag.y)*.004, -1.2, 1.2); });
    cvs.addEventListener("pointerup", () => { drag = null; }); cvs.addEventListener("pointercancel", () => { drag = null; });
    cvs.addEventListener("wheel", e => { e.preventDefault(); zoomT = clamp(zoomT*Math.exp(e.deltaY*.0012), .45, 2.2); }, { passive: false });
  }
  function teardown(){
    if (!built) return; pulsarOff();
    scn.traverse(o => { if (o.geometry && !o.isSprite) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    rend.dispose(); rend.forceContextLoss(); rend = scn = cam = world = sky = cur = null; built = false;
    const nc = cvs.cloneNode(false); cvs.replaceWith(nc); cvs = nc;
  }
  function size(){ const w = cvs.clientWidth || innerWidth, h = cvs.clientHeight || innerHeight; rend.setPixelRatio(Math.min(2, devicePixelRatio || 1)); rend.setSize(w, h, false);
    cam.aspect = w/h; const port = w < 760; cam.setViewOffset(w, h, port ? 0 : -w*.16, port ? h*.2 : 0, w, h); cam.updateProjectionMatrix(); }
  function frame(now){
    raf = open ? requestAnimationFrame(frame) : 0; if (!open) return;
    const dt = Math.min(.1, (now - last)/1000 || 0), t = now/1000; last = now;
    if (playing){ toyT = Math.min(1, toyT + dt/22); const r = $("atlR"); if (r) r.value = Math.round(toyT*1000); if (toyT >= 1){ playing = false; syncPlay(); } }
    if (ATL_OBJ[oI].id === "and") toyV = toyT; else toyV += (toyT - toyV)*Math.min(1, dt*3);   // у симуляции — без сглаживания: шаг назад пересчитывает с начала
    if (!drag) yawT += dt*.03;
    yaw += (yawT - yaw)*Math.min(1, dt*4); pitch += (pitchT - pitch)*Math.min(1, dt*4); zoom += (zoomT - zoom)*Math.min(1, dt*4);
    const flat = ATL_OBJ[oI].id === "bet" && toyB;   // небо Земли — без вращения
    world.rotation.set(flat ? 0 : pitch, flat ? 0 : yaw, 0); world.position.z = -16*zoom;
    if (cur){ cur.upd(t, dt, toyV, toyB); cur.g.traverse(o => { if (o.isPoints && o.material.uniforms && o.material.uniforms.uT && o !== sky) o.material.uniforms.uT.value = t; }); }
    if (ATL_OBJ[oI].id === "and") hudAnd();
    sky.rotation.y += dt*.002;
    rend.render(scn, cam);
  }
  function openA(i){
    if (!built) build();
    if (!grid.children.length) cards();
    open = atlOn = true; size();
    pick(i != null && i >= 0 ? i : oI);
    if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function close(){ if (!open) return; open = atlOn = false; pulsarOff(); box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); setTimeout(() => { if (!open) teardown(); }, 900); }
  addEventListener("resize", () => { if (open) size(); });
  addEventListener("keydown", e => { if (open && e.key === "Escape"){ e.stopPropagation(); if (!chBack("atl")) closeAtl(); } }, true);
  return { open: openA, close, get on(){ return open; }, get id(){ return ATL_OBJ[oI].id; }, idx: id => ATL_OBJ.findIndex(o => o.id === id), get v(){ return toyV; } };
})();
const chAtl = $("chAtl");
function openAtl(id){ chFrom("atl"); closeChapters(); toggleMenu(false); surface(); chAtl.classList.add("open"); chAtl.setAttribute("aria-hidden", "false");
  ATL.open(typeof id === "string" ? ATL.idx(id) : id); $("atlClose").focus({ preventScroll:true }); }
function closeAtl(){ ATL.close(); }
$("atlClose").onclick = () => { if (!chBack("atl")) closeAtl(); };
$("mAtl").onclick = () => openAtl();
