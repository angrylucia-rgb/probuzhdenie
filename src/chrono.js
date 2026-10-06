/* ---------- Космический календарь (итерация 7) ----------
   Вторая ось карты — время. 13,8 млрд лет сжаты в один год (Карл Саган; даты — под Planck 2018).
   Астролябия времени: вложенные кольца — год → декабрь → 31 декабря → последний час → последняя минута
   → последняя секунда. Каждое следующее кольцо — это последнее деление предыдущего, развёрнутое на весь
   круг. Прокрутка s ∈ [0, 6]: целая часть — кольцо, дробная — ход стрелки по нему; у конца кольца камера
   «ныряет» во внутреннее (радиусы колец ∝ Q^(k − z)) — тот же зум, что и на кольце масштабов, но по времени. */
const CHR = (() => {
  const AGE = 13.8e9, YS = 365*86400;                       // возраст Вселенной, секунд в календарном году
  const MD = [31,28,31,30,31,30,31,31,30,31,30,31];
  const MON = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
  const MONG = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  // кольца: длительность S (календарные секунды), деления (границы в долях кольца), подписи
  const monB = [0]; MD.forEach(d => monB.push(monB[monB.length - 1] + d/365));
  const even = n => Array.from({length:n + 1}, (_, i) => i/n);
  const RINGS = [
    { S: YS,       B: monB,     lab: i => MON[i],                         every: 1, name: "Год",                unit: "1 месяц ≈ 1,1 млрд лет" },
    { S: 31*86400, B: even(31), lab: i => String(i + 1),                  every: 1, name: "Декабрь",            unit: "1 день ≈ 37,8 млн лет" },
    { S: 86400,    B: even(24), lab: i => String(i),                      every: 1, name: "31 декабря",         unit: "1 час ≈ 1,6 млн лет" },
    { S: 3600,     B: even(60), lab: i => "23:" + String(i).padStart(2, "0"), every: 5, name: "Последний час",  unit: "1 минута ≈ 26 тыс. лет" },
    { S: 60,       B: even(6),  lab: i => ":" + String(i*10).padStart(2, "0"), every: 1, edge: true, name: "Последняя минута", unit: "10 секунд ≈ 4400 лет" },
    { S: 10,       B: even(10), lab: i => ":5" + i,                       every: 1, edge: true, name: "Последние 10 секунд", unit: "1 секунда ≈ 440 лет" },
    { S: 1,        B: even(10), lab: i => "0," + i,                       every: 1, edge: true, name: "Последняя секунда",  unit: "0,1 секунды ≈ 44 года" },
    { S: .1,       B: even(10), lab: i => "0,9" + i,                      every: 1, edge: true, name: "Последняя десятая секунды", unit: "0,01 секунды ≈ 4,4 года" }
  ];
  const NR = RINGS.length, SMAX = NR, Q = .58;
  RINGS.forEach(R => R.A = YS - R.S);                        // кольцо кончается полуночью 31 декабря
  // время календаря по прокрутке: внутри кольца k стрелка идёт от его начала до начала последнего деления
  const ZF = .84;
  function timeOf(s){
    s = clamp(s, 0, SMAX); const k = Math.min(NR - 1, Math.floor(s)), f = s - k, R = RINGS[k];
    const span = k < NR - 1 ? R.S - RINGS[k + 1].S : R.S;
    // стрелка проходит всё кольцо за первые ZF доли прокрутки; остаток — пауза на границе, пока идёт зум.
    // Так кольцо не начинает расти, пока на нём остаются события (иначе они уезжали за край экрана)
    return R.A + (k < NR - 1 ? Math.min(1, f/ZF) : f)*span;
  }
  // зум: пока стрелка идёт по кольцу, радиусы стоят; когда она дошла до последнего деления — внутреннее кольцо вырастает до главного
  const zoomOf = s => { s = clamp(s, 0, SMAX); const k = Math.min(NR - 1, Math.floor(s)), f = s - k; return k + (k < NR - 1 ? smooth(ZF, 1, f) : 0); };
  // подписи даты и «лет назад»
  function dateStr(t, k){
    const day = Math.floor(t/86400); let m = 0, d = day; while (m < 11 && d >= MD[m]){ d -= MD[m]; m++; }
    const sec = t - day*86400, hh = Math.floor(sec/3600), mm = Math.floor((sec % 3600)/60), ss = sec % 60;
    const p2 = v => String(v).padStart(2, "0");
    const tm = k >= 7 ? `${p2(hh)}:${p2(mm)}:${p2(Math.floor(ss))},${String(Math.floor((ss % 1)*1000)).padStart(3, "0")}`
             : k >= 6 ? `${p2(hh)}:${p2(mm)}:${p2(Math.floor(ss))},${String(Math.floor((ss % 1)*100)).padStart(2, "0")}`
             : k >= 4 ? `${p2(hh)}:${p2(mm)}:${p2(Math.floor(ss))}`
             : k >= 2 ? `${p2(hh)}:${p2(mm)}:${p2(Math.floor(ss))}` : `${p2(hh)}:${p2(mm)}`;
    return { day: `${d + 1} ${MONG[m]}`, tm };
  }
  const nf = (v, dig) => v.toFixed(dig).replace(".", ",");
  function agoStr(t){
    const y = (YS - t)/YS*AGE;
    if (y < .5) return "сейчас";
    if (y >= 1e9) return `${nf(y/1e9, y >= 1e10 ? 1 : 2)} млрд лет назад`;
    if (y >= 1e6) return `${nf(y/1e6, y >= 1e7 ? 0 : 1)} млн лет назад`;
    if (y >= 1e4) return `${Math.round(y/1e3)} тыс. лет назад`;
    return `${Math.round(y).toLocaleString("ru-RU")} ${plural(Math.round(y), "год", "года", "лет")} назад`;
  }
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };

  // ---- события календаря (7б): ago — лет назад; st — путешествие, куда ведёт карточка; c — категория ----
  // Тексты коротко: суть и факты с метками доверия. Традиции и практики — подэтап 7в
  const CAT = { cos:["Космос","159,180,255"], ear:["Земля и жизнь","143,224,176"], hum:["Становление человека","255,182,120"], civ:["История","255,216,138"], spi:["Мысль, дух и наука","255,159,207"] };
  const CATK = ["cos","ear","hum","civ","spi"];
  const EV = CHR_EV.slice().sort((a, b) => b.ago - a.ago);   // события — в chrono_events.js
  // события жизни → узел Древа жизни (кнопка «В Древе жизни»)
  // событие → фигура «Нити мысли»
  const EV2TH = { veda:"rig", upan:"upa", pyth:"pyt", confu:"lao", buddha:"bud", socr:"pla", plotin:"plo", rumi:"rum", coper:"cop", galileo:"gal",
    newton:"new", darwin:"dar", mendel:"men", quant:"ein", hubble:"lem", dna:"dna", ligo:"lig" };
  const EV2TREE = { life:"luca", photo:"cyano", goe:"cyano", euk:"euk", boring:"euk", multi:"red", ediac:"edia", camb:"bil", burgess:"arth", land:"land",
    ordo:"trilo", jaws:"gnath", insect:"insect", forest:"vasc", tetra:"tetra", devon:"placo", carbon:"lyco", amniote:"amn", perm:"trilo", dino:"dino",
    mamm:"mam", trj:"archo", archae:"birds", flower:"angio", kpg:"dino", primate:"prim", whale:"whale", apes:"hom", homin:"hominin", ardi:"hominin",
    laetoli:"austr", tools:"austr", lucy:"austr", homo:"homo", erectus:"erect", fire:"homo", neand:"neand", sap:"sap", neandx:"neand", dog:"carn", agri:"grass" };
  const TREE_NAME = id => { const r = TREE_ROWS.find(x => x[0] === id); return r ? r[2].replace(" — общий предок", "") : id; };
  const STN = { g1:"Первоимпульс", g2:"Вселенная", g3:"Галактика", bh:"Чёрная дыра", g4:"Солнечная система", earth:"Земля", moon:"Луна", human:"Человек", g7:"Клетка", g8:"Атом", g9:"Кванты", g10:"Вакуум", abs:"Абсолют" };
  EV.forEach(e => { e.t = YS*(1 - e.ago/AGE); e.k = ringOfT(e.t); });
  function ringOfT(t){ for (let k = 0; k < NR - 1; k++) if (t < RINGS[k + 1].A) return k; return NR - 1; }
  // прокрутка, при которой стрелка стоит на моменте t (обратная к timeOf)
  function sOf(t){ const k = ringOfT(t), R = RINGS[k], span = k < NR - 1 ? R.S - RINGS[k + 1].S : R.S, u = clamp((t - R.A)/span, 0, 1); return k + (k < NR - 1 ? u*ZF : u); }
  const lastEv = t => { let r = null; for (const e of EV) if (e.t <= t + 1e-9) r = e; return r; };
  let hits = [], hovEv = null, ageY = 0;
  // ---- циклы традиций (7в): дуги на дорожках внутри колец; to < 0 — цикл продолжается в будущее ----
  const CYC = [
    { k:[0], tr:0, seg:[[8.64e9, 4.32e9, "ночь Брахмы", "120,132,205"], [4.32e9, 0, "день Брахмы — кальпа", "255,210,140"]],
      nm:"Сутки Брахмы", m:"t", tx:"Вишну-пурана, Сурья-сиддханта: день Брахмы — кальпа, тысяча махаюг, 4,32 млрд лет; ночь — столько же. На календаре день Брахмы начинается почти тогда же, когда собирается Земля. Это совпадение чисел, а не датировка: традиция не связывает кальпу с рождением планеты. Вся «жизнь Брахмы» — 311 трлн лет — в этот год не помещается." },
    { k:[2], tr:0, seg:[[3893128, 2165128, "Сатья", "255,222,150"], [2165128, 869128, "Трета", "214,220,232"], [869128, 5128, "Двапара", "205,150,100"], [5128, -1, "Кали", "160,160,182"]],
      nm:"Махаюга — четыре юги", m:"t", tx:"Махаюга — 4,32 млн лет: Сатья 1,728 млн, Трета 1,296 млн, Двапара 864 тыс., Кали 432 тыс. По традиционному счёту Кали-юга началась в 3102 г. до н. э. и продлится ещё больше 400 тыс. лет. У Гесиода похожая лестница убывания: золотой, серебряный, медный, героический и железный века. Даты юг — символическая хронология, а не геологическая." },
    { k:[4], tr:0, seg:[[25772, 0, "Великий год", "200,172,255"]],
      nm:"Великий, или Платонов, год", m:"s", tx:"Земная ось описывает конус за ≈ 25 800 лет — это прецессия, из-за которой точка весеннего равноденствия ползёт по зодиаку (измеряемый факт). Платон в «Тимее» говорил о «совершенном годе», когда все светила возвращаются на свои места; позже его связали с прецессией и «эрами» зодиака — это уже традиция. На календаре Великий год занимает почти всю последнюю минуту." },
    { k:[4, 5], tr:1, lp:.2, seg:[[5139, 14, "Длинный счёт майя", "140,222,200"]],
      nm:"Длинный счёт майя", m:"t", tx:"Эра в 13 бактунов — 1 872 000 дней, ≈ 5125 лет: от 11 августа 3114 г. до н. э. до 21 декабря 2012 года. Сам календарь реальный и точный; «конец света в 2012-м» — современный миф, для майя это была смена эры. Начало эры майя и начало Кали-юги разделяют всего 12 лет — независимое и любопытное совпадение." },
    { k:[4, 5], tr:2, lp:.8, seg:[[5128, -1, "Кали-юга", "160,160,182"]],
      nm:"Кали-юга", m:"t", tx:"Тёмный век: по традиции (Арьябхата, V в.) начался в 3102 г. до н. э. На последней минуте календаря его начало стоит рядом с появлением письменности." }
  ];
  const CYC_MORE = "Ещё: стоики ждали экпирозы — мирового огня и обновления; джайны видят время колесом из восходящей и нисходящей половин; в буддизме махакальпа длиннее, чем нужно, чтобы стереть каменную гору шёлковой тканью, касаясь её раз в сто лет.";
  let cycOn = false, cycA = 0;
  // ---- состояние и ввод ----
  let open = false, s = 0, sT = 0, play = false, raf = 0, last = 0;
  const cv = $("tcv"), cx2 = cv.getContext("2d");
  const tin = document.querySelector(".time-in");
  let W2 = 0, H2 = 0, DPR = 1;
  const dust = Array.from({length: 260}, () => [Math.random(), Math.random(), Math.random()]);
  function size(){ DPR = Math.min(2, devicePixelRatio || 1); W2 = cv.clientWidth; H2 = cv.clientHeight; cv.width = W2*DPR; cv.height = H2*DPR; }
  const setS = v => { sT = clamp(v, 0, SMAX); };
  cv.addEventListener("wheel", e => { e.preventDefault(); play = false; syncPlay(); const k = e.deltaMode === 1 ? .045 : .0013; setS(sT + clamp(e.deltaY*k, -.35, .35)); }, {passive:false});
  let tyy = null;
  cv.addEventListener("touchstart", e => { tyy = e.touches[0].clientY; }, {passive:true});
  cv.addEventListener("touchmove", e => { if (tyy === null) return; const y = e.touches[0].clientY; play = false; syncPlay(); setS(sT + (tyy - y)*.0035); tyy = y; }, {passive:true});
  cv.addEventListener("touchend", () => { tyy = null; });
  addEventListener("keydown", e => {
    if (!open) return;
    if (e.key === "Escape"){ close(); return; }
    if (e.target && e.target.id === "tmAge") return;
    if (["ArrowDown","ArrowRight","PageDown"].includes(e.key)){ e.preventDefault(); play = false; syncPlay(); setS(sT + .08); }
    if (["ArrowUp","ArrowLeft","PageUp"].includes(e.key)){ e.preventDefault(); play = false; syncPlay(); setS(sT - .08); }
    if (e.key === " "){ e.preventDefault(); togglePlay(); }
  });
  function syncPlay(){ const b = $("tmPlay"); b.textContent = play ? "Пауза" : (sT >= SMAX - 1e-3 ? "Прожить заново" : "Прожить год"); b.setAttribute("aria-pressed", String(play)); }
  function togglePlay(){ if (!play && sT >= SMAX - 1e-3) { s = sT = 0; } play = !play; syncPlay(); }
  $("tmPlay").onclick = togglePlay;
  $("tmReset").onclick = () => { play = false; syncPlay(); setS(0); };

  // ---- рисование ----
  const GOLD = "214,172,94", INK = "239,231,212";
  function ringR(k, z, Rm){ return Rm*Math.pow(Q, k - z); }
  function draw(T){
    const c = cx2; c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W2, H2);
    const port = W2 < 760;
    const mxOn = chTime.classList.contains("tm-max"), ox = port ? W2/2 : W2*(mxOn ? .75 : .65), oy = port ? H2*.24 : H2*.53;
    const Rm = port ? Math.min(W2*.34, H2*.175) : Math.min(H2*.37, W2*(mxOn ? .2 : .25));
    // звёздная пыль — медленно кружит вокруг оси календаря
    for (const [a, b, m] of dust){
      const an = a*TAU + T*.004*(1 + m), rr = Math.sqrt(b)*Math.hypot(W2, H2)*.62;
      const x = ox + Math.cos(an)*rr, y = oy + Math.sin(an)*rr;
      c.fillStyle = `rgba(${INK},${.08 + .25*m*m})`; c.fillRect(x, y, 1 + m, 1 + m);
    }
    const z = zoomOf(s), t = timeOf(s), ka = Math.min(NR - 1, Math.floor(clamp(s, 0, SMAX)));
    hits = []; const cur = lastEv(t); const LB = [];
    for (let k = 0; k < NR; k++){
      const r = ringR(k, z, Rm), rel = r/Rm;
      const al = smooth(.14, .34, rel)*(1 - smooth(1.22, 1.7, rel));
      if (al < .01) continue;
      const R = RINGS[k], N = R.B.length - 1, act = k === ka;
      const ang = u => -Math.PI/2 + u*TAU;
      // дорожки кольца
      c.lineWidth = 1; c.strokeStyle = `rgba(${GOLD},${.55*al})`;
      c.beginPath(); c.arc(ox, oy, r, 0, TAU); c.stroke();
      c.strokeStyle = `rgba(${GOLD},${.22*al})`;
      c.beginPath(); c.arc(ox, oy, r*.9, 0, TAU); c.stroke();
      // последнее деление — оно и развернётся во внутреннее кольцо
      if (k < NR - 1){
        const a0 = ang(R.B[N - 1]), a1 = ang(1);
        c.fillStyle = `rgba(${GOLD},${.13*al})`;
        c.beginPath(); c.arc(ox, oy, r, a0, a1); c.arc(ox, oy, r*.9, a1, a0, true); c.closePath(); c.fill();
        // выноска к внутреннему кольцу
        const ri = ringR(k + 1, z, Rm), top = ang(0);
        c.strokeStyle = `rgba(${GOLD},${.2*al})`; c.setLineDash([2, 4]);
        c.beginPath();
        c.moveTo(ox + Math.cos(a0)*r*.9, oy + Math.sin(a0)*r*.9); c.lineTo(ox + Math.cos(top)*ri, oy + Math.sin(top)*ri);
        c.moveTo(ox + Math.cos(a1)*r*.9, oy + Math.sin(a1)*r*.9); c.lineTo(ox + Math.cos(top)*ri, oy + Math.sin(top)*ri);
        c.stroke(); c.setLineDash([]);
      }
      // деления и мелкие засечки
      for (let i = 0; i <= N; i++){
        const a = ang(R.B[i]); c.strokeStyle = `rgba(${GOLD},${.6*al})`;
        c.beginPath(); c.moveTo(ox + Math.cos(a)*r*.9, oy + Math.sin(a)*r*.9); c.lineTo(ox + Math.cos(a)*r, oy + Math.sin(a)*r); c.stroke();
      }
      if (N <= 31){ for (let i = 0; i < N; i++) for (let j = 1; j < 4; j++){
        const a = ang(R.B[i] + (R.B[i + 1] - R.B[i])*j/4); c.strokeStyle = `rgba(${GOLD},${.25*al})`;
        c.beginPath(); c.moveTo(ox + Math.cos(a)*r*.965, oy + Math.sin(a)*r*.965); c.lineTo(ox + Math.cos(a)*r, oy + Math.sin(a)*r); c.stroke(); } }
      // подписи делений — только пока кольцо достаточно крупное
      const fs = clamp(r*(port ? .082 : .052), 0, port ? 11.5 : 15);
      if (fs >= 8.5){
        c.font = `400 ${fs.toFixed(1)}px Forum, Georgia, serif`; c.textAlign = "center"; c.textBaseline = "middle";
        for (let i = 0; i < N; i += R.every){
          const a = ang(R.every === 1 && !R.edge ? (R.B[i] + R.B[i + 1])/2 : R.B[i]);
          const lr = r*.9 - fs*1.15;
          c.fillStyle = `rgba(${i === N - 1 && k < NR - 1 ? "255,216,138" : INK},${(act ? .9 : .55)*al})`;
          c.fillText(R.lab(i), ox + Math.cos(a)*lr, oy + Math.sin(a)*lr);
        }
      }
      // имя кольца — над его верхней точкой
      if (fs >= 8.5 && rel > .5 && !act){
        c.font = `500 ${port ? 9 : 10}px "JetBrains Mono", monospace`; c.textAlign = "center";
        c.fillStyle = `rgba(${GOLD},${(act ? .95 : .5)*al})`;
        c.fillText(R.name.toUpperCase().split("").join(" "), ox, oy - r - 14);
      }
      // циклы традиций — дуги на внутренних дорожках
      if (cycA > .01) for (const C of CYC){ if (!C.k.includes(k)) continue;
        const rr = r*(.85 - C.tr*.055);
        for (const [fy, ty, nm, rgb] of C.seg){
          const u0 = clamp((YS*(1 - fy/AGE) - R.A)/R.S, 0, 1), u1 = ty < 0 ? 1 : clamp((YS*(1 - ty/AGE) - R.A)/R.S, 0, 1);
          if (u1 - u0 < 1e-4) continue;
          c.strokeStyle = `rgba(${rgb},${.8*al*cycA})`; c.lineWidth = port ? 2.5 : 3.2;
          c.beginPath(); c.arc(ox, oy, rr, ang(u0), ang(u1)); c.stroke(); c.lineWidth = 1;
          if (ty < 0){ const ae = ang(1), tx = ox + Math.cos(ae)*rr, tyy2 = oy + Math.sin(ae)*rr;   // стрелка: цикл идёт дальше, за «сейчас»
            c.fillStyle = `rgba(${rgb},${.9*al*cycA})`; c.beginPath(); c.moveTo(tx + 7, tyy2); c.lineTo(tx - 1, tyy2 - 4); c.lineTo(tx - 1, tyy2 + 4); c.closePath(); c.fill(); }
          if ((act || rel > .75) && (u1 - u0)*TAU*rr > 46 && fs >= 8.5){
            const am = ang(u0 + (C.lp !== undefined ? C.lp*(u1 - u0) : Math.min(.5*(u1 - u0), 40/(TAU*rr)))), lr = rr - (port ? 11 : 13);
            c.font = `400 ${port ? 10.5 : 12.5}px Forum, Georgia, serif`; c.textAlign = "center"; c.textBaseline = "middle";
            c.fillStyle = `rgba(${rgb},${al*cycA})`;
            c.fillText(nm, ox + Math.cos(am)*lr, oy + Math.sin(am)*lr);
          }
        }
      }
      // ваша жизнь — дуга на тех мелких кольцах, где она помещается
      if (k >= 5 && ageY > 0){
        const sec = ageY/AGE*YS;
        if (sec < R.S*.98){ const u0 = 1 - sec/R.S;
          c.strokeStyle = `rgba(255,159,207,${.9*al})`; c.lineWidth = 4;
          c.beginPath(); c.arc(ox, oy, r*.95, ang(u0), ang(1)); c.stroke(); c.lineWidth = 1;
          if (fs >= 8.5 && (act || rel > .7)) LB.push({ txt:`ваша жизнь · ${nf(sec, sec < .1 ? 3 : 2)} с`, a:ang((u0 + 1)/2), mr:r*.95, r, rgb:"255,190,225", al, pri:2, fsz:port ? 12 : 14, k }); }
      }
      // события этого кольца: метка на дорожке; подписи собираются в LB и раскладываются после колец
      { const evs = EV.filter(e => e.k === k), showL = (act || (rel > .7 && rel < 1.3)) && fs >= 8.5;
        for (const e of evs){
          const u = (e.t - R.A)/R.S, a = ang(u), mx = ox + Math.cos(a)*r*.95, my = oy + Math.sin(a)*r*.95;
          const [, rgb] = CAT[e.c], on = e === cur, hv = e === hovEv, rad = (on ? 5.5 : 4) + (hv ? 2 : 0);
          const g = c.createRadialGradient(mx, my, 0, mx, my, rad*3.2);
          g.addColorStop(0, `rgba(${rgb},${al})`); g.addColorStop(.35, `rgba(${rgb},${.45*al})`); g.addColorStop(1, `rgba(${rgb},0)`);
          c.fillStyle = g; c.beginPath(); c.arc(mx, my, rad*3.2, 0, TAU); c.fill();
          c.fillStyle = `rgba(255,250,240,${al})`; c.beginPath(); c.arc(mx, my, rad*.45, 0, TAU); c.fill();
          if (al > .3) hits.push([mx, my, e]);
          if (!showL && !hv) continue;
          if (port && !on && !hv) continue;
          LB.push({ txt:e.nm, a, mr:r*.95, r, rgb: on || hv ? "255,236,200" : rgb, al: on || hv ? al : .85*al, pri: hv ? 3 : on ? 2 : act ? 1 : 0, fsz: port ? 12 : 14.5, k, u });
        }
      }
      // стрелка: на активном кольце — линия с огоньком, на соседних — точка текущего времени
      if (t >= R.A - 1e-6){
        const u = clamp((t - R.A)/R.S, 0, 1), a = ang(u);
        const hx = ox + Math.cos(a)*r, hy = oy + Math.sin(a)*r;
        if (act){
          const gr = c.createLinearGradient(ox, oy, hx, hy); gr.addColorStop(0, `rgba(${GOLD},0)`); gr.addColorStop(1, `rgba(255,224,160,${.85*al})`);
          c.strokeStyle = gr; c.lineWidth = 1.4; c.beginPath(); c.moveTo(ox, oy); c.lineTo(hx, hy); c.stroke(); c.lineWidth = 1;
        }
        const g = c.createRadialGradient(hx, hy, 0, hx, hy, act ? 16 : 8);
        g.addColorStop(0, `rgba(255,240,205,${al})`); g.addColorStop(.3, `rgba(255,210,140,${.5*al})`); g.addColorStop(1, "rgba(255,200,120,0)");
        c.fillStyle = g; c.beginPath(); c.arc(hx, hy, act ? 16 : 8, 0, TAU); c.fill();
      }
    }
    // ---- раскладка подписей: по порядку на кольце; если место занято — сдвиг вдоль кольца (в сторону хода
    // времени, поэтому порядок сохраняется) с тонкой выноской к метке; не нашлось места — подпись пропускается
    // (её покажет наведение). Сначала кладём самые важные: под курсором, текущее событие
    { const placed = [], pad = 3;
      // панель с текстом — препятствие: подписи не заходят под неё
      { const pb = tin.getBoundingClientRect(), cb = cv.getBoundingClientRect();
        placed.push({ x0: pb.left - cb.left - 8, x1: pb.right - cb.left + 14, y0: pb.top - cb.top - 8, y1: pb.bottom - cb.top + 8 }); }
      const hit = b => b.x0 < 4 || b.x1 > W2 - 4 || b.y0 < 4 || placed.some(q => b.x0 < q.x1 + pad && b.x1 > q.x0 - pad && b.y0 < q.y1 + pad && b.y1 > q.y0 - pad);
      const order = LB.map((L, i) => i).sort((i, j) => (LB[j].pri - LB[i].pri) || (LB[i].k - LB[j].k) || ((LB[i].u || 0) - (LB[j].u || 0)));
      // важные — первыми, а внутри кольца — по ходу времени; чтобы сдвиги шли «вперёд», обычные подписи
      // одного кольца раскладываются строго по возрастанию угла
      for (const i of order){
        const L = LB[i]; c.font = `400 ${L.fsz}px Forum, Georgia, serif`;
        const w = c.measureText(L.txt).width, h = L.fsz + 2, ca = Math.cos(L.a), sa = Math.sin(L.a);
        const al2 = ca > .25 ? "left" : ca < -.25 ? "right" : "center";
        const gap = port ? 12 : 16, step = h*1.08, tx = -sa, ty = ca;
        let best = null;
        for (let j = 0; j < 9 && !best; j++){
          for (const sg of j ? [1] : [0]){
            const x = ox + ca*(L.r + gap) + tx*step*j*sg, y = oy + sa*(L.r + gap) + ty*step*j*sg;
            const x0 = al2 === "left" ? x : al2 === "right" ? x - w : x - w/2;
            const b = { x0, x1: x0 + w, y0: y - h/2, y1: y + h/2 };
            if (!hit(b)) best = { x, y, b, j };
            else if (j === 8 && L.pri >= 2){                // важная подпись ставится всегда — в пределах экрана
              const xb = ox + ca*(L.r + gap), y1 = oy + sa*(L.r + gap), x0b = al2 === "left" ? xb : al2 === "right" ? xb - w : xb - w/2;
              const x0c = clamp(x0b, 6, W2 - 6 - w), dx = x0c - x0b, x1 = xb + dx;
              best = { x: x1, y: y1, b: { x0: x0c, x1: x0c + w, y0: y1 - h/2, y1: y1 + h/2 }, j: dx ? 1 : 0 }; }
          }
        }
        if (!best) continue;
        placed.push(best.b);
        if (best.j > 0){ c.strokeStyle = `rgba(${L.rgb},${.35*L.al})`; c.beginPath();
          c.moveTo(ox + ca*(L.mr + 6), oy + sa*(L.mr + 6)); c.lineTo(best.x - (al2 === "left" ? 3 : al2 === "right" ? -3 : 0), best.y); c.stroke(); }
        c.textAlign = al2; c.textBaseline = "middle"; c.fillStyle = `rgba(${L.rgb},${L.al})`;
        c.fillText(L.txt, best.x, best.y);
      }
    }
    // под панелью слева — затемнение, чтобы вырастающие внешние кольца не спорили с текстом
    if (!port){ const pr = tin.getBoundingClientRect().right - cv.getBoundingClientRect().left, gw = pr + W2*.08, lg = c.createLinearGradient(0, 0, gw, 0); lg.addColorStop(0, "rgba(5,6,12,.94)"); lg.addColorStop(clamp(pr/gw, 0, 1), "rgba(5,6,12,.86)"); lg.addColorStop(1, "rgba(5,6,12,0)");
      c.fillStyle = lg; c.fillRect(0, 0, gw, H2); }
    else { const lg = c.createLinearGradient(0, H2*.42, 0, H2*.48); lg.addColorStop(0, "rgba(5,6,12,0)"); lg.addColorStop(1, "rgba(5,6,12,.92)"); c.fillStyle = lg; c.fillRect(0, H2*.42, W2, H2*.58); }
    // центр: роза астролябии
    const hub = c.createRadialGradient(ox, oy, 0, ox, oy, 26); hub.addColorStop(0, "rgba(255,232,180,.85)"); hub.addColorStop(.25, "rgba(214,172,94,.35)"); hub.addColorStop(1, "rgba(214,172,94,0)");
    c.fillStyle = hub; c.beginPath(); c.arc(ox, oy, 26, 0, TAU); c.fill();
    c.strokeStyle = `rgba(${GOLD},.35)`; c.beginPath();
    for (let i = 0; i < 8; i++){ const a = i*TAU/8, l = i % 2 ? 9 : 16; c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a)*l, oy + Math.sin(a)*l); } c.stroke();
  }
  // ---- панель ----
  let lastTxt = "";
  function panel(){
    const t = timeOf(s), k = Math.min(NR - 1, Math.floor(clamp(s, 0, SMAX))), d = dateStr(t, k);
    const txt = d.day + d.tm + k;
    if (txt === lastTxt) return; lastTxt = txt;
    $("tmDay").textContent = d.day; $("tmClock").textContent = d.tm;
    $("tmAgo").textContent = agoStr(t);
    $("tmRing").textContent = `Кольцо ${k + 1} из ${NR} · ${RINGS[k].name} · листайте`;
    $("tmUnit").textContent = RINGS[k].unit;
    $("tmBar").style.width = (clamp(s, 0, SMAX)/SMAX*100).toFixed(2) + "%";
    card(lastEv(t));
  }
  // карточка события: последнее, которое прошла стрелка
  let cardEv = null;
  function card(e){
    if (e === cardEv) return;
    // тихий тик, когда стрелка проходит событие вперёд (через общий модуль музыки — молчит, если она выключена)
    if (e && cardEv && EV.indexOf(e) > EV.indexOf(cardEv) && typeof Music !== "undefined" && Music.tick) Music.tick(CATK.indexOf(e.c));
    cardEv = e; const box = $("tmCard");
    if (!e){ box.innerHTML = ""; return; }
    jrMark("ev", e.id, e.nm);
    const d = dateStr(e.t, e.k), [cn, rgb] = CAT[e.c], idx = EV.indexOf(e);
    box.innerHTML = `<div class="tm-bar"><span class="mono tm-cat" style="color:rgb(${rgb})">${cn} · ${esc(d.day)}${e.k >= 2 ? " " + d.tm : ""}</span>
        <span class="tm-nav"><button data-nv="-1" ${idx <= 0 ? "disabled" : ""} aria-label="Предыдущее событие" data-hover>←</button><span class="mono" style="color:var(--faint);align-self:center;padding:0 4px">${idx + 1}/${EV.length}</span><button data-nv="1" ${idx >= EV.length - 1 ? "disabled" : ""} aria-label="Следующее событие" data-hover>→</button></span></div>
      <h3>${esc(e.nm)}</h3><p class="tm-ago2">${e.ago ? esc(agoStr(e.t)) : "сейчас"}</p><p class="tm-lead">${esc(e.lead)}</p>`
      + (e.art ? `<div class="tm-art">${e.art.split("\n\n").map(x => `<p>${esc(x)}</p>`).join("")}</div>` : "")
      + (e.sci && e.sci.length ? `<h4>Наука</h4><ul class="list">${e.sci.map(x => `<li>${mk(x[0])}<span>${esc(x[1])}</span></li>`).join("")}</ul>` : "")
      + (e.tr ? `<h4>Традиции</h4><ul class="list">${e.tr.map(x => `<li>${mk("t")}<span>${esc(x)}</span></li>`).join("")}</ul>` : "")
      + (e.pr ? `<h4>Практика</h4><p class="tm-pr">${esc(e.pr)}</p>` : "")
      + `<div class="tm-gos">` + (e.st ? `<button class="btn tm-go" data-st="${e.st}" data-hover>Станция «${STN[e.st] || e.st}» →</button>` : "")
      + (EV2TH[e.id] ? `<button class="btn tm-go tm-th" data-th="${EV2TH[e.id]}" data-hover>В Нити мысли: ${esc(TH_FIG.find(f => f.id === EV2TH[e.id]).nm)} →</button>` : "")
      + (EV2TREE[e.id] ? `<button class="btn tm-go tm-tree" data-tr="${EV2TREE[e.id]}" data-hover>В Древе жизни: ${esc(TREE_NAME(EV2TREE[e.id]))} →</button>` : "")
      + (() => { const b = (e.c === "ear" || e.c === "hum") && typeof bioOfEvent === "function" ? bioOfEvent(e) : null; return b ? `<button class="btn tm-go tm-bio" data-bio="${b.id}" data-hover>В Биосфере: пласт «${esc(b.nm)}» →</button>` : ""; })() + `</div>`;
    box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
    if (!cycOn) $("tmScroll").scrollTop = 0;
    const go = box.querySelector(".tm-go[data-st]"); if (go) go.onclick = () => { const id = go.dataset.st; close(); openJourney(id); };
    const gth = box.querySelector(".tm-th"); if (gth) gth.onclick = () => { const id = gth.dataset.th; close(); openThought(id); };
    const gb = box.querySelector(".tm-bio"); if (gb) gb.onclick = () => { const id = gb.dataset.bio; close(); openBio(id); };
    const gt = box.querySelector(".tm-tree"); if (gt) gt.onclick = () => { const id = gt.dataset.tr; close(); openTree(id); };
    box.querySelectorAll("[data-nv]").forEach(b => b.onclick = () => goEv(idx + +b.dataset.nv));
  }
  // перейти к событию по номеру: стрелка встаёт на него (как учебник — листать событие за событием)
  function goEv(i){ const e = EV[clamp(i, 0, EV.length - 1)]; if (!e) return; play = false; syncPlay(); setS(sOf(e.t) + 1e-7); }
  // режим чтения
  const mx = $("tmMax");
  mx.onclick = () => { const on = !chTime.classList.contains("tm-max"); chTime.classList.toggle("tm-max", on); mx.setAttribute("aria-pressed", String(on)); mx.textContent = on ? "⤡ Циферблат" : "⤢ Читать"; };
  // клик по метке — стрелка встаёт на событие; наведение подсвечивает
  const pick = (x, y) => { let best = null, bd = W2 < 760 ? 22 : 16; for (const [hx, hy, e] of hits){ const d = Math.hypot(hx - x, hy - y); if (d < bd){ bd = d; best = e; } } return best; };
  cv.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); hovEv = pick(e.clientX - r.left, e.clientY - r.top); cv.style.cursor = hovEv ? "pointer" : ""; });
  cv.addEventListener("click", e => { const r = cv.getBoundingClientRect(), ev = pick(e.clientX - r.left, e.clientY - r.top); if (!ev) return;
    play = false; syncPlay(); setS(sOf(ev.t) + 1e-6); if (typeof Music !== "undefined" && Music.hover) Music.hover(); });
  // переключатель слоя циклов и его пояснения в панели
  const cb = $("tmCycBtn"), cl = $("tmCyc");
  cl.innerHTML = `<h4>Циклы традиций</h4><p class="tm-pr">Циклическое время традиций, наложенное на линейную шкалу: сутки Брахмы — на кольце года, юги — на 31 декабря, Великий год, Длинный счёт майя и Кали-юга — на последней минуте и последних 10 секундах.</p><ul class="list">`
    + CYC.map(C => `<li>${mk(C.m)}<span><b>${esc(C.nm)}.</b> ${esc(C.tx)}</span></li>`).join("") + `</ul><p class="tm-pr">${esc(CYC_MORE)}</p>`;
  cb.onclick = () => { cycOn = !cycOn; cb.setAttribute("aria-pressed", String(cycOn)); cl.hidden = !cycOn; if (cycOn) cl.scrollIntoView({block:"nearest", behavior:"smooth"}); };
  // возраст: ничего не сохраняется — живёт, пока открыта страница
  const ageIn = $("tmAge");
  ageIn.addEventListener("input", () => { const v = parseFloat(ageIn.value.replace(",", ".")); ageY = v > 0 && v < 150 ? v : 0; ageOut(); });
  function ageOut(){ const o = $("tmAgeOut"); if (!ageY){ o.textContent = ""; $("tmAgeGo").hidden = true; return; }
    const sec = ageY/AGE*YS; o.textContent = `ваша жизнь — последние ${nf(sec, sec < .1 ? 3 : 2)} с года`; $("tmAgeGo").hidden = false; }
  $("tmAgeGo").onclick = () => { if (!ageY) return; play = false; syncPlay(); setS(sOf(YS - ageY/AGE*YS)); };
  function frame(now){
    raf = open ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(.1, (now - last)/1000 || 0); last = now;
    if (play){ sT = Math.min(SMAX, sT + dt/12); if (sT >= SMAX){ play = false; syncPlay(); } }
    s += (sT - s)*Math.min(1, dt*(play ? 12 : 5));
    cycA += ((cycOn ? 1 : 0) - cycA)*Math.min(1, dt*4);
    if (Math.abs(sT - s) < 1e-5) s = sT;
    draw(now/1000); panel();
  }
  function openT(){
    if (open) return; open = timeOn = true; size(); syncPlay(); lastTxt = "";
    if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function close(){ if (!open) return; open = timeOn = false; play = false; chTime.classList.remove("open"); chTime.setAttribute("aria-hidden", "true"); $("btnTime").setAttribute("aria-pressed", "false"); }
  addEventListener("resize", () => { if (open) size(); });
  return { open: openT, close, get on(){ return open; }, goAgo: y => { play = false; syncPlay(); s = sT = sOf(YS*(1 - clamp(y, 0, AGE)/AGE)) + 1e-7; }, dbg: { set: v => { s = sT = v; }, time: () => timeOf(s), ago: () => agoStr(timeOf(s)) } };
})();
const chTime = $("chTime");
function closeTime(){ CHR.close(); }
function openTime(){ closeHuman(); closePath(); closeRef(); closeTree(); closeThought(); closeCompass(); closeMine(); closeDims(); closeBio(); toggleMenu(false); surface(); chTime.classList.add("open"); chTime.setAttribute("aria-hidden", "false"); $("btnTime").setAttribute("aria-pressed", "true"); CHR.open(); $("timeClose").focus({preventScroll:true}); }
$("btnTime").onclick = () => CHR.on ? closeTime() : openTime();
$("timeClose").onclick = closeTime;
$("mTime").onclick = openTime;
