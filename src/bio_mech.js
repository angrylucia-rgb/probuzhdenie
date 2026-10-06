/* ---------- «Биосфера» 13д: механизмы эволюции — девять опытов на 2D-холсте #bioSim ----------
   Каждый опыт: тексты карточки, элементы управления (ctl), init(S), step(S, dt), draw(g, R, S, T).
   R — прямоугольник сцены (справа от панели на компьютере, сверху на телефоне). Модели упрощены (◐), но
   устроены честно: отбор, наследование с шумом, случайный дрейф — без подгонки результата. */
const BIO_MECH = (() => {
  const rnd = Math.random, gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); };
  const GOLD = "255,214,150", BLUE = "140,200,255", ROSE = "255,150,170", GREEN = "150,230,160", DIM = "214,172,94";
  function dot(g, x, y, r, c, a){ g.fillStyle = `rgba(${c},${a == null ? 1 : a})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  function txt(g, s, x, y, c, size, al){ g.font = `${size || 11}px 'JetBrains Mono', monospace`; g.fillStyle = `rgba(${c || "220,205,180"},${al == null ? .75 : al})`; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText(s, x, y); }
  function title(g, s, x, y){ g.font = "400 16px Forum, Georgia, serif"; g.fillStyle = "rgba(255,222,170,.9)"; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText(s, x, y); }
  // график: серии [{v:[...], c, lab}], ось y от y0 до y1
  function chart(g, R, ser, y0, y1, ylab, xmax, xlab){
    g.strokeStyle = `rgba(${DIM},.35)`; g.lineWidth = 1; g.beginPath(); g.moveTo(R.x, R.y); g.lineTo(R.x, R.y + R.h); g.lineTo(R.x + R.w, R.y + R.h); g.stroke();
    txt(g, ylab, R.x + 4, R.y + 10, DIM, 10, .8); if (xlab) { g.textAlign = "right"; txt(g, "", 0, 0); g.font = "10px 'JetBrains Mono', monospace"; g.fillStyle = `rgba(${DIM},.7)`; g.textAlign = "right"; g.fillText(xlab, R.x + R.w, R.y + R.h + 13); g.textAlign = "left"; }
    for (const s of ser){ if (!s.v.length) continue; g.strokeStyle = `rgba(${s.c},${s.a || .9})`; g.lineWidth = s.w || 1.6; g.beginPath();
      s.v.forEach((v, i) => { const x = R.x + i/Math.max(1, (xmax || s.v.length) - 1)*R.w, y = R.y + R.h - clamp((v - y0)/(y1 - y0), 0, 1)*R.h; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
  }
  const split = (R, f) => [{ x: R.x, y: R.y, w: R.w*f - 12, h: R.h }, { x: R.x + R.w*f + 12, y: R.y + 18, w: R.w*(1 - f) - 12, h: R.h - 46 }];
  const vsplit = (R, f) => [{ x: R.x, y: R.y, w: R.w, h: R.h*f - 10 }, { x: R.x + 8, y: R.y + R.h*f + 14, w: R.w - 16, h: R.h*(1 - f) - 34 }];
  const lay = (R, f) => R.w > R.h*1.15 ? split(R, f) : vsplit(R, f);

  // маски силуэтов → точки (для опыта «конвергенция»)
  function maskPts(k, n){
    const m = BIO_MASK[k]; if (!m) return [];
    const [W, H, b64] = m, raw = atob(b64), M = new Uint8Array(W*H); let i = 0, p = 0, on = 0;
    while (i < raw.length){ let v = 0, s = 0, c; do { c = raw.charCodeAt(i++); v |= (c & 127) << s; s += 7; } while (c > 127); if (on) M.fill(1, p, p + v); p += v; on ^= 1; }
    const S = BIO_SP[k] || {}, r = (S.rot || 0)*Math.PI/180, f = S.face === -1 ? -1 : 1, cr = Math.cos(r), sr = Math.sin(r), P = [];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let t = 0; t < n*40 && P.length < n; t++){ const q = (rnd()*W*H) | 0; if (!M[q]) continue; const x = q % W - W/2 + rnd(), y = (q/W | 0) - H/2 + rnd();
      const X = (x*cr + y*sr)*f, Y = -x*sr + y*cr; P.push([X, Y]); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
    const sc = 1/Math.max(x1 - x0, y1 - y0, 1), cx = (x0 + x1)/2, cy = (y0 + y1)/2;
    return P.map(([x, y]) => [(x - cx)*sc, (y - cy)*sc]);
  }

  return [
  // ———————————————————— 1 · естественный отбор
  { id:"moth", nm:"Естественный отбор", sub:"Берёзовая пяденица и копоть на коре",
    lead:"На светлой коре птицы легче замечают тёмных бабочек, на закопчённой — светлых. Смените кору и посмотрите, как за десятки поколений меняется окраска популяции.",
    how:"Каждое поколение птицы съедают часть бабочек: заметных — чаще. Выжившие откладывают яйца, и потомки похожи на родителей. Редкая мутация иногда даёт бабочку другого цвета. Никто не «старается» потемнеть — просто тёмные чаще доживают до размножения.",
    nature:"Первую тёмную пяденицу записали в Манчестере в 1848 году, а к концу XIX века в промышленных районах тёмных стало подавляющее большинство. Когда воздух очистили, светлые снова вернулись.",
    sci:[["s","Мутация — «прыгающий ген» в гене cortex, возникшая около 1819 года (2016)"],["s","Опыт Майеруса (2001–2007, опубликован в 2012): птицы чаще склёвывают заметных бабочек"],["h","Доли выживания в модели упрощены"]],
    ctl:[{ t:"seg", k:"bark", o:[["clean", "Чистая кора"], ["soot", "Закопчённая кора"]] }, { t:"btn", k:"reset", l:"Сначала" }],
    init(S){ S.p = S.p || { bark:"clean" }; S.N = 140; S.m = []; for (let i = 0; i < S.N; i++) S.m.push({ x: rnd(), y: rnd(), d: rnd() < .02, a: rnd()*TAU }); S.hist = [S.m.filter(m => m.d).length/S.N]; S.t = 0; S.gen = 0; S.eaten = []; },
    step(S, dt){ S.t += dt; S.eaten = S.eaten.filter(e => (e.l -= dt) > 0);
      if (S.t > 1.1){ S.t = 0; S.gen++;
        const soot = S.p.bark === "soot", surv = S.m.filter(m => { const vis = soot ? !m.d : m.d, ok = rnd() < (vis ? .55 : .85); if (!ok) S.eaten.push({ x: m.x, y: m.y, d: m.d, l: 1 }); return ok; });
        const kids = []; while (kids.length < S.N && surv.length){ const p = surv[(rnd()*surv.length) | 0]; let d = p.d; if (rnd() < .006) d = !d; kids.push({ x: rnd(), y: rnd(), d, a: rnd()*TAU }); }
        S.m = kids; S.hist.push(S.m.filter(m => m.d).length/S.N); if (S.hist.length > 80) S.hist.shift(); } },
    draw(g, R, S, T){ const [A, B] = lay(R, .55), soot = S.p.bark === "soot";
      // кора
      for (let i = 0; i < 900; i++){ const u = (i*0.6180339)%1, v = ((i*0.7548776)%1); const x = A.x + u*A.w, y = A.y + v*A.h, l = soot ? .18 + .1*Math.sin(i) : .62 + .2*Math.sin(i*1.7);
        g.fillStyle = `rgba(${soot ? "70,64,58" : "205,200,182"},${l})`; g.fillRect(x, y, 3 + (i % 3), 2); }
      g.strokeStyle = `rgba(${DIM},.3)`; g.strokeRect(A.x, A.y, A.w, A.h);
      const ms = clamp(Math.sqrt(A.w*A.h/(S.N*900)), .45, 1);
      for (const m of S.m){ const x = A.x + 10 + m.x*(A.w - 20), y = A.y + 10 + m.y*(A.h - 20), c = m.d ? "40,36,34" : "236,228,206";
        g.save(); g.translate(x, y); g.rotate(m.a); g.scale(ms, ms); g.fillStyle = `rgb(${c})`; g.beginPath(); g.ellipse(-4, 0, 5, 3, -.4, 0, TAU); g.ellipse(4, 0, 5, 3, .4, 0, TAU); g.fill();
        g.strokeStyle = m.d ? "rgba(255,214,150,.35)" : "rgba(40,30,20,.25)"; g.lineWidth = .7; g.stroke(); g.restore(); }
      for (const e of S.eaten){ const x = A.x + 10 + e.x*(A.w - 20), y = A.y + 10 + e.y*(A.h - 20); dot(g, x, y, 8*(1.4 - e.l), ROSE, .5*e.l); }
      title(g, `Поколение ${S.gen}`, A.x, A.y - 8);
      chart(g, B, [{ v: S.hist, c: GOLD }], 0, 1, "доля тёмных", 80, "поколения →");
      txt(g, `${Math.round(S.hist[S.hist.length - 1]*100)} % тёмных`, B.x + 4, B.y + 26, GOLD, 12, .95); } },

  // ———————————————————— 2 · дрейф генов
  { id:"drift", nm:"Дрейф генов", sub:"Случай решает в маленьких популяциях",
    lead:"Восемь одинаковых популяций, никакого отбора: два варианта гена одинаково хороши. Сравните, что случай делает с маленькой и с большой популяцией.",
    how:"Каждое поколение — это случайная выборка генов родителей. В маленькой популяции частота варианта гуляет сильно и рано или поздно один из вариантов исчезает совсем. В большой она почти не меняется — случайности уравновешивают друг друга.",
    nature:"Северные морские слоны в 1890-х годах сократились, по оценкам, до двух-трёх десятков животных. Сегодня их больше двухсот тысяч, но генетическое разнообразие у них очень низкое — след «бутылочного горлышка».",
    sci:[["s","Модель Райта — Фишера: основа популяционной генетики"],["s","Эффект основателя: у амишей Пенсильвании редкий синдром Эллиса — ван Кревельда встречается намного чаще обычного"],["h","Численность морских слонов в 1890-х — оценка"]],
    ctl:[{ t:"seg", k:"N", o:[[10, "10 особей"], [50, "50"], [250, "250"], [1000, "1000"]] }, { t:"btn", k:"reset", l:"Заново" }],
    init(S){ S.p = S.p || { N:10 }; S.L = []; for (let j = 0; j < 8; j++) S.L.push([.5]); S.t = 0; },
    step(S, dt){ S.t += dt; while (S.t > .12){ S.t -= .12; if (S.L[0].length >= 160) return; const N = +S.p.N;
      for (const L of S.L){ const p = L[L.length - 1]; let k = 0; for (let i = 0; i < 2*N; i++) if (rnd() < p) k++; L.push(k/(2*N)); } } },
    draw(g, R, S){ const [A, B] = lay(R, .42), N = +S.p.N, p = S.L[0][S.L[0].length - 1], show = Math.min(2*N, 200), cols = Math.ceil(Math.sqrt(show*1.6)), cs = Math.min(A.w/cols, 22);
      title(g, `Популяция 1 · ${N} особей`, A.x, A.y - 8);
      for (let i = 0; i < show; i++){ const x = A.x + (i % cols + .5)*cs, y = A.y + 12 + ((i/cols) | 0)*cs; dot(g, x, y, Math.max(1.5, cs*.32), i < Math.round(p*show) ? GOLD : BLUE, .9); }
      const C = ["255,214,150", "140,200,255", "255,150,170", "150,230,160", "200,160,255", "255,190,110", "120,230,230", "240,240,200"];
      chart(g, B, S.L.map((v, j) => ({ v, c: C[j], w: 1.3 })), 0, 1, "частота варианта", 160, "поколения →");
      const fixed = S.L.filter(L => { const q = L[L.length - 1]; return q === 0 || q === 1; }).length;
      txt(g, `потерян или закреплён: ${fixed} из 8`, B.x + 4, B.y + 26, GOLD, 12, .95); } },

  // ———————————————————— 3 · половой отбор
  { id:"sex", nm:"Половой отбор", sub:"Длинный хвост: и украшение, и обуза",
    lead:"Самки выбирают самцов с длинными хвостами, а хищники легче ловят таких самцов. Передвиньте две силы и посмотрите, где установится длина хвоста.",
    how:"Каждое поколение часть самцов гибнет: чем длиннее хвост, тем чаще. Выжившие спариваются тем чаще, чем длиннее у них хвост. Сыновья наследуют длину хвоста отца с небольшим разбросом. Хвост растёт, пока выгода у самок не уравновесит опасность.",
    nature:"В 1982 году Мальте Андерссон удлинил хвосты самцам длиннохвостого бархатного ткача в Кении — и они привлекли больше самок, чем самцы с укороченными хвостами. Дарвин признавался, что вид павлиньего пера его мучил — пока он не понял роль выбора самок.",
    sci:[["s","Теорию полового отбора Дарвин изложил в книге 1871 года «Происхождение человека и половой отбор»"],["s","Опыт Андерссона с длиннохвостыми ткачами (1982)"],["h","Модель: выживание падает с длиной хвоста, успех у самок — растёт"]],
    ctl:[{ t:"range", k:"pref", l:"Выбор самок", min:0, max:2, step:.05 }, { t:"range", k:"cost", l:"Опасность хищников", min:.2, max:2, step:.05 }, { t:"btn", k:"reset", l:"Сначала" }],
    init(S){ S.p = S.p || { pref:1, cost:.8 }; S.m = []; for (let i = 0; i < 120; i++) S.m.push(Math.max(.1, 1 + gauss()*.12)); S.hist = [1]; S.t = 0; S.gen = 0; },
    step(S, dt){ S.t += dt; if (S.t < .5) return; S.t = 0; S.gen++;
      const c = +S.p.cost, pr = +S.p.pref, surv = S.m.filter(t => rnd() < Math.exp(-c*.35*t*t)); if (!surv.length) surv.push(1);
      const w = surv.map(t => Math.exp(pr*t)), W = w.reduce((a, b) => a + b, 0), kids = [];
      while (kids.length < 120){ let r = rnd()*W, i = 0; while (r > w[i] && i < w.length - 1){ r -= w[i]; i++; } kids.push(Math.max(.1, surv[i] + gauss()*.06)); }
      S.m = kids; const mean = kids.reduce((a, b) => a + b, 0)/kids.length; S.hist.push(mean); if (S.hist.length > 120) S.hist.shift(); },
    draw(g, R, S, T){ const [A, B] = lay(R, .5), mean = S.hist[S.hist.length - 1];
      title(g, `Средняя длина хвоста · ${mean.toFixed(2)}`, A.x, A.y - 8);
      const cols = 10; S.m.slice(0, 60).forEach((t, i) => { const x = A.x + (i % cols + .5)*A.w/cols, y = A.y + 20 + ((i/cols) | 0)*A.h/6.4;
        dot(g, x, y, 3.2, GOLD, .95); const L = t*A.h/8; for (let k = 0; k < 7; k++){ const a = Math.PI/2 + (k - 3)*.13 + Math.sin(T*2 + i)*.03; g.strokeStyle = `rgba(${k % 2 ? BLUE : GREEN},.6)`; g.lineWidth = 1;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a)*L*.5, y + Math.sin(a)*L); g.stroke(); } });
      chart(g, B, [{ v: S.hist, c: GOLD }], 0, 3, "средняя длина хвоста", 120, "поколения →"); } },

  // ———————————————————— 4 · симбиогенез
  { id:"symb", nm:"Симбиогенез", sub:"Как клетка стала сложной",
    lead:"Сложная клетка — это союз. Шаг за шагом посмотрите, как крупная клетка-архея приютила бактерию, а потом водоросль — цианобактерию.",
    how:"По теории симбиогенеза одна клетка поглотила другую, но не переварила. Бактерия осталась жить внутри, делилась вместе с хозяином и стала митохондрией. Позже у предков растений так же поселилась цианобактерия — она стала хлоропластом.",
    nature:"Митохондрии и хлоропласты до сих пор похожи на бактерии: у них свои кольцевые ДНК, свои рибосомы и деление пополам. Ближайшие живые родственники клетки-хозяина — асгард-археи, найденные в 2015 году.",
    sci:[["s","Теорию в современном виде развила Линн Маргулис (1967)"],["s","У митохондрий и хлоропластов — собственная кольцевая ДНК"],["s","Асгард-археи — ближайшая к эукариотам группа архей"],["h","Порядок событий (что появилось раньше — ядро или митохондрия) — спорен"]],
    ctl:[{ t:"seg", k:"st", o:[[0, "1 · Встреча"], [1, "2 · Поглощение"], [2, "3 · Митохондрии"], [3, "4 · Ядро"], [4, "5 · Хлоропласт"]] }],
    init(S){ S.p = S.p || { st:0 }; S.k = 0; },
    step(S, dt){ S.k += (+S.p.st - S.k)*Math.min(1, dt*1.2); },
    draw(g, R, S, T){ const cx = R.x + R.w*.5, cy = R.y + R.h*.5, Rr = Math.min(R.w, R.h)*.3, k = S.k;
      // хозяин
      g.strokeStyle = `rgba(${GOLD},.75)`; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 80; i++){ const a = i/80*TAU, r = Rr*(1 + .05*Math.sin(a*7 + T)); i ? g.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r) : g.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r); } g.stroke();
      g.fillStyle = `rgba(${GOLD},.05)`; g.fill();
      // бактерии: снаружи → внутри → делятся
      const inside = clamp(k, 0, 1), nM = k < 1.5 ? 1 : 4;
      for (let i = 0; i < nM; i++){ const a = i/nM*TAU + T*.2, rIn = Rr*(.45 + .1*i/nM), out = [cx + Rr*1.6, cy - Rr*.4], inn = [cx + Math.cos(a)*rIn, cy + Math.sin(a)*rIn*.8];
        const x = out[0] + (inn[0] - out[0])*(i ? 1 : inside), y = out[1] + (inn[1] - out[1])*(i ? 1 : inside);
        g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = `rgba(${ROSE},.9)`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 0, 14, 7, 0, 0, TAU); g.stroke();
        if (k > 1.5){ g.beginPath(); for (let j = -10; j <= 10; j += 4){ g.moveTo(j, -5); g.lineTo(j + 2, 5); } g.stroke(); } g.restore(); }
      if (k < 1){ for (let i = 0; i < 3; i++){ const x = cx + Rr*(1.5 + .3*i) + Math.sin(T + i)*6, y = cy + Rr*(.3*i - .1) + Math.cos(T*1.3 + i)*6; g.strokeStyle = `rgba(${ROSE},.5)`; g.beginPath(); g.ellipse(x, y, 12, 6, T*.3 + i, 0, TAU); g.stroke(); } }
      // ядро
      const nu = clamp(k - 2, 0, 1); if (nu > 0){ g.strokeStyle = `rgba(${BLUE},${.8*nu})`; g.lineWidth = 2; g.beginPath(); g.arc(cx - Rr*.1, cy, Rr*.28*nu, 0, TAU); g.stroke(); for (let i = 0; i < 40*nu; i++){ const a = i*2.4, r = Rr*.2*Math.sqrt((i % 13)/13); dot(g, cx - Rr*.1 + Math.cos(a)*r, cy + Math.sin(a)*r, 1.2, BLUE, .7*nu); } }
      // хлоропласт
      const ch = clamp(k - 3, 0, 1); if (ch > 0){ const out = [cx - Rr*1.7, cy + Rr*.6], inn = [cx + Rr*.25, cy + Rr*.45], x = out[0] + (inn[0] - out[0])*ch, y = out[1] + (inn[1] - out[1])*ch;
        g.fillStyle = `rgba(${GREEN},.25)`; g.strokeStyle = `rgba(${GREEN},.9)`; g.beginPath(); g.ellipse(x, y, 18, 10, .5, 0, TAU); g.fill(); g.stroke(); for (let j = -2; j <= 2; j++){ g.beginPath(); g.moveTo(x - 12, y + j*3); g.lineTo(x + 12, y + j*3); g.stroke(); } }
      const L = ["Крупная клетка-архея и свободные бактерии", "Архея поглощает бактерию — но не переваривает", "Бактерии живут и делятся внутри: это митохондрии", "Мембраны складываются вокруг ДНК: появляется ядро", "У предков растений поселяется цианобактерия — хлоропласт"];
      title(g, L[Math.round(clamp(k, 0, 4))], R.x, R.y + 4); } },

  // ———————————————————— 5 · конвергенция
  { id:"conv", nm:"Конвергенция", sub:"Разные предки — одинаковые решения",
    lead:"Неродственные животные, живущие похожей жизнью, приходят к похожей форме. Совместите силуэты и сравните.",
    how:"Законы физики одни для всех: в воде выгодна обтекаемая «торпеда», в воздухе — крыло. Отбор у разных групп независимо приводит к похожим решениям. Но внутри они устроены по-разному: у ихтиозавра — кости рептилии, у акулы — хрящ.",
    nature:"Активный полёт изобретали минимум четыре раза: насекомые, птерозавры, птицы и летучие мыши. Сумчатый волк Тасмании внешне очень похож на волка, хотя их общий предок жил больше 160 млн лет назад.",
    sci:[["s","Полёт появлялся независимо у насекомых, птерозавров, птиц и летучих мышей"],["s","Глаза-камеры независимо возникли у позвоночных и головоногих"],["h","Силуэты на сцене — из галереи, в масштабе не совпадают"]],
    ctl:[{ t:"seg", k:"pair", o:[["sea", "Ихтиозавр и акула"], ["wolf", "Сумчатый волк и собака"], ["fly", "Три крыла"]] }, { t:"seg", k:"ov", o:[[0, "Рядом"], [1, "Наложить"]] }],
    init(S){ S.p = S.p || { pair:"sea", ov:0 }; S.cache = S.cache || {}; S.o = 0; },
    step(S, dt){ S.o += (+S.p.ov - S.o)*Math.min(1, dt*2); },
    draw(g, R, S, T){ const set = { sea:[["ichsa", BLUE, "ихтиозавр · рептилия"], ["clado", GOLD, "акула · хрящевая рыба"]], wolf:[["thyla", ROSE, "сумчатый волк"], ["dog", GOLD, "собака · плацентарное"]], fly:[["megan", GREEN, "насекомое"], ["ptera", ROSE, "птерозавр"], ["archx", GOLD, "птица"]] }[S.p.pair];
      const n = set.length, w = R.w/n, sz = Math.min(w*.9, R.h*.7);
      set.forEach(([k, c, lab], i) => { const P = S.cache[k] || (S.cache[k] = maskPts(k, 1800)), cx0 = R.x + w*(i + .5), cx = cx0 + (R.x + R.w/2 - cx0)*S.o, cy = R.y + R.h*.5;
        for (const [x, y] of P) dot(g, cx + x*sz, cy + y*sz, 1.1, c, .55 - .15*S.o);
        g.font = "11px 'JetBrains Mono', monospace"; g.fillStyle = `rgba(${c},.9)`; g.textAlign = "center"; g.fillText(lab, cx0 + (R.x + R.w/2 - cx0)*S.o, cy + sz*.5 + 16 + i*14*S.o); g.textAlign = "left"; }); } },

  // ———————————————————— 6 · вьюрки Дарвина
  { id:"finch", nm:"Вьюрки Дарвина", sub:"Засуха и толщина клюва",
    lead:"Средний земляной вьюрок с острова Дафне-Майор. В засуху остаются только крупные твёрдые семена — их раскалывают птицы с толстым клювом.",
    how:"Каждый год часть птиц погибает. В обычный год выживание почти не зависит от клюва. В засуху выживают в основном птицы с толстым клювом. Птенцы наследуют клюв родителей — и среднее значение в следующем поколении сдвигается.",
    nature:"Питер и Розмари Грант изучали вьюрков на Дафне-Майор с 1973 года. После засухи 1977 года выжила лишь малая часть птиц, а клюв у следующего поколения стал в среднем примерно на 4 % толще. Эволюцию увидели почти в реальном времени.",
    sci:[["s","Наблюдения Грантов на Дафне-Майор — больше 40 лет"],["s","После засухи 1977 года средний размер клюва вырос примерно на 4 %"],["s","В засуху 2004 года из-за конкуренции с крупными вьюрками отбор шёл в обратную сторону"],["h","Числа в модели упрощены"]],
    ctl:[{ t:"seg", k:"yr", o:[["norm", "Обычный год"], ["dry", "Засуха"]] }, { t:"btn", k:"next", l:"Прожить год →" }, { t:"btn", k:"reset", l:"Сначала" }],
    init(S){ S.p = S.p || { yr:"norm" }; S.b = []; for (let i = 0; i < 400; i++) S.b.push(9.4 + gauss()*.55); S.hist = [9.4]; S.year = 0; S.last = null; },
    on(S, k){ if (k !== "next") return; S.year++; const dry = S.p.yr === "dry", m0 = S.b.reduce((a, b) => a + b, 0)/S.b.length;
      const surv = S.b.filter(d => rnd() < (dry ? .12 + .8/(1 + Math.exp(-(d - 10)*3.2)) : .8)); if (surv.length < 4) surv.push(...S.b.slice(0, 4));
      const kids = []; while (kids.length < 400){ const a = surv[(rnd()*surv.length) | 0], b = surv[(rnd()*surv.length) | 0]; kids.push(m0 + .8*((a + b)/2 - m0) + gauss()*.3); }
      S.last = { n: surv.length, dry }; S.b = kids; S.hist.push(kids.reduce((a, b) => a + b, 0)/kids.length); },
    step(){},
    draw(g, R, S){ const [A, B] = lay(R, .55), bins = 24, lo = 7.5, hi = 12, H = new Array(bins).fill(0);
      for (const d of S.b){ const i = Math.floor((d - lo)/(hi - lo)*bins); if (i >= 0 && i < bins) H[i]++; }
      const mx = Math.max(...H), bw = A.w/bins, mean = S.hist[S.hist.length - 1];
      H.forEach((h, i) => { const hh = h/mx*(A.h - 40); for (let k = 0; k < h/4; k++) dot(g, A.x + (i + .5)*bw + (rnd() - .5)*bw*.5, A.y + A.h - 20 - k/(h/4)*hh, 1.4, GOLD, .7); });
      const xm = A.x + (mean - lo)/(hi - lo)*A.w; g.strokeStyle = `rgba(${BLUE},.9)`; g.beginPath(); g.moveTo(xm, A.y + 10); g.lineTo(xm, A.y + A.h - 18); g.stroke();
      txt(g, `${lo} мм`, A.x, A.y + A.h - 2, DIM, 10); g.textAlign = "right"; g.font = "10px 'JetBrains Mono', monospace"; g.fillText(`${hi} мм`, A.x + A.w, A.y + A.h - 2); g.textAlign = "left";
      title(g, `Год ${S.year} · средний клюв ${mean.toFixed(2)} мм`, A.x, A.y - 8);
      if (S.last) txt(g, `${S.last.dry ? "засуха" : "обычный год"}: выжило ${Math.round(S.last.n/4)} % птиц`, A.x, A.y + 8, S.last.dry ? ROSE : GREEN, 11, .9);
      chart(g, B, [{ v: S.hist, c: BLUE }], 8.8, 11, "средняя толщина клюва, мм", Math.max(10, S.hist.length), "годы →"); } },

  // ———————————————————— 7 · коэволюция
  { id:"coev", nm:"Коэволюция", sub:"Цветок и бабочка тянут друг друга",
    lead:"Нектар спрятан на дне длинного шпорца орхидеи. Бабочка с длинным хоботком достаёт его, а цветок опыляется, только если бабочке приходится прижаться к нему головой.",
    how:"Цветки с шпорцем длиннее хоботка выигрывают: бабочка глубже погружает голову и уносит пыльцу. Бабочки с более длинным хоботком выигрывают: им достаётся больше нектара. Так обе длины растут — гонка, в которой ни один не может остановиться.",
    nature:"В 1862 году Дарвин увидел мадагаскарскую орхидею со шпорцем длиной 20–35 см и предсказал бабочку с таким же хоботком. Её описали лишь в 1903 году — и назвали praedicta, «предсказанная».",
    sci:[["s","Предсказание Дарвина — 1862, бабочка описана в 1903 году"],["s","Шпорец Angraecum sesquipedale — 20–35 см"],["h","Модель: две средние длины с наследственным разбросом"]],
    ctl:[{ t:"btn", k:"run", l:"Пуск / пауза" }, { t:"btn", k:"reset", l:"Сначала" }],
    init(S){ S.f = 3; S.m = 3; S.hf = [3]; S.hm = [3]; S.t = 0; S.run = true; },
    on(S, k){ if (k === "run") S.run = !S.run; },
    step(S, dt){ if (!S.run || S.f > 34) return; S.t += dt; if (S.t < .25) return; S.t = 0;
      const f = S.f + gauss()*.3, m = S.m + gauss()*.3;
      S.f += .18*Math.max(0, (S.m + .6) - S.f) + .04 + gauss()*.03; S.m += .18*Math.max(0, (S.f + .3) - S.m) + .03 + gauss()*.03;
      S.hf.push(S.f); S.hm.push(S.m); },
    draw(g, R, S, T){ const [A, B] = lay(R, .5), sc = (A.h - 40)/36, cx = A.x + A.w*.42, top = A.y + 20;
      // цветок: лепестки и шпорец вниз
      for (let k = 0; k < 6; k++){ const a = k/6*TAU + .3; g.fillStyle = "rgba(240,236,220,.85)"; g.beginPath(); g.ellipse(cx + Math.cos(a)*16, top + 14 + Math.sin(a)*16, 16, 6, a, 0, TAU); g.fill(); }
      g.strokeStyle = "rgba(170,220,150,.9)"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, top + 14); g.lineTo(cx, top + 14 + S.f*sc); g.stroke();
      dot(g, cx, top + 14 + S.f*sc, 4, GOLD, .9);
      // бабочка: тело справа сверху, хоботок
      const bx = cx + 44 + Math.sin(T*3)*1.5, by = top + 4; g.fillStyle = "rgba(200,180,150,.9)"; g.beginPath(); g.ellipse(bx + 14, by, 14, 5, 0, 0, TAU); g.fill();
      for (const s of [-1, 1]){ g.fillStyle = "rgba(170,150,120,.7)"; g.beginPath(); g.ellipse(bx + 12, by + s*12, 13, 9, s*.5 + Math.sin(T*14)*.2, 0, TAU); g.fill(); }
      g.strokeStyle = `rgba(${ROSE},.9)`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(cx + 10, by, cx + 2, top + 18); g.lineTo(cx + 2, top + 14 + S.m*sc*.98); g.stroke();
      txt(g, `шпорец ${S.f.toFixed(1)} см`, cx + 12, top + 14 + S.f*sc, GREEN, 11, .95); txt(g, `хоботок ${S.m.toFixed(1)} см`, bx + 30, by + 4, ROSE, 11, .95);
      chart(g, B, [{ v: S.hf, c: GREEN }, { v: S.hm, c: ROSE }], 0, 36, "длина, см", Math.max(40, S.hf.length), "поколения →"); } },

  // ———————————————————— 8 · вымирание и радиация
  { id:"rad", nm:"Вымирание и радиация", sub:"Что происходит после катастрофы",
    lead:"Ветви жизни ветвятся и обрываются. Нажмите «Астероид» — три четверти ветвей погибнут. Посмотрите, как выжившие быстро займут освободившиеся места.",
    how:"В спокойное время новые виды появляются примерно так же часто, как исчезают старые. Катастрофа резко обрывает большинство ветвей. Выжившим больше не мешают конкуренты, и они быстро дают множество новых видов — это адаптивная радиация.",
    nature:"После падения астероида 66 млн лет назад исчезло около 75 % видов. Млекопитающие и птицы, жившие до этого в тени динозавров, за несколько миллионов лет разошлись по всем освободившимся нишам.",
    sci:[["s","«Большая пятёрка» массовых вымираний: ордовик, девон, пермь, триас, мел"],["s","Подавляющее большинство когда-либо живших видов вымерло"],["h","Модель: случайное рождение и вымирание ветвей; после катастрофы рождение временно ускоряется"]],
    ctl:[{ t:"btn", k:"boom", l:"☄ Астероид" }, { t:"btn", k:"reset", l:"Сначала" }],
    init(S){ S.L = [{ y: .5, t0: 0, t1: null, p: -1 }]; S.t = 0; S.boost = 0; S.hist = []; S.marks = []; },
    on(S, k){ if (k !== "boom") return; const alive = S.L.filter(l => l.t1 == null); alive.forEach(l => { if (rnd() < .75) l.t1 = S.t; }); if (!S.L.some(l => l.t1 == null) && alive.length) alive[0].t1 = null; S.boost = 1; S.marks.push(S.t); },
    step(S, dt){ dt *= 3; S.t += dt*.6; S.boost = Math.max(0, S.boost - dt*.12); const alive = S.L.filter(l => l.t1 == null), n = alive.length, K = 60;
      const b = (.5 + 1.6*S.boost)*Math.max(.05, 1 - n/K) + .12, d = .12;
      for (const l of alive){ if (rnd() < b*dt*.6 && S.L.length < 900){ S.L.push({ y: clamp(l.y + (rnd() - .5)*.16, .02, .98), t0: S.t, t1: null, p: S.L.indexOf(l) }); }
        if (rnd() < d*dt*.6 && n > 1) l.t1 = S.t; }
      S.hist.push(S.L.filter(l => l.t1 == null).length); if (S.hist.length > 600) S.hist.shift(); },
    draw(g, R, S){ const [A, B] = lay(R, .62), span = 40, t0 = Math.max(0, S.t - span), X = t => A.x + (t - t0)/span*A.w;
      for (const l of S.L){ const a = Math.max(l.t0, t0), e = l.t1 == null ? S.t : l.t1; if (e < t0) continue; const y = A.y + l.y*A.h;
        g.strokeStyle = l.t1 == null ? `rgba(${GOLD},.8)` : `rgba(${DIM},.3)`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(a), y); g.lineTo(X(e), y); g.stroke();
        if (l.p >= 0 && l.t0 >= t0){ const py = A.y + S.L[l.p].y*A.h; g.beginPath(); g.moveTo(X(l.t0), py); g.lineTo(X(l.t0), y); g.stroke(); } }
      for (const m of S.marks) if (m > t0){ g.strokeStyle = `rgba(${ROSE},.6)`; g.beginPath(); g.moveTo(X(m), A.y); g.lineTo(X(m), A.y + A.h); g.stroke(); }
      title(g, `Живых ветвей: ${S.hist[S.hist.length - 1] || 1}`, A.x, A.y - 8);
      chart(g, B, [{ v: S.hist, c: GOLD }], 0, 80, "число видов", 600, "время →"); } },

  // ———————————————————— 9 · Красная Королева
  { id:"queen", nm:"Красная Королева", sub:"Бежать, чтобы оставаться на месте",
    lead:"Зайцы и рыси. Чем больше зайцев, тем больше рысей; чем больше рысей, тем меньше зайцев — и численности качаются. Включите гонку вооружений: обе стороны ускоряются, но никто не выигрывает.",
    how:"Хищники и жертвы связаны: рост одних ведёт к росту других, а затем к спаду — получаются циклы. В гонке вооружений жертвы бегают всё быстрее, хищники тоже, но доля пойманных почти не меняется. Чтобы просто удержаться, приходится всё время меняться.",
    nature:"Записи о шкурах, которые Компания Гудзонова залива скупала больше ста лет, показывают циклы численности зайцев-беляков и канадских рысей с периодом около 10 лет. Название гипотезы Ли Ван Вален в 1973 году взял из сказки Льюиса Кэрролла.",
    sci:[["s","Гипотеза Красной Королевы — Ли Ван Вален, 1973"],["s","Циклы зайца и рыси по данным Компании Гудзонова залива — около 10 лет"],["h","Модель: уравнения Лотки — Вольтерры с гонкой скоростей"]],
    ctl:[{ t:"seg", k:"race", o:[[0, "Без гонки"], [1, "Гонка вооружений"]] }, { t:"btn", k:"reset", l:"Сначала" }],
    init(S){ S.p = S.p || { race:0 }; S.h = 40; S.l = 9; S.vh = 1; S.vl = 1; S.Hh = []; S.Hl = []; S.dots = []; for (let i = 0; i < 160; i++) S.dots.push({ x: rnd(), y: rnd(), a: rnd()*TAU, pred: i < 40 }); },
    step(S, dt){ const k = Math.min(dt, .05)*3; for (let s = 0; s < 8; s++){ const catchR = .02*S.vl/S.vh;
        S.h += (.55*S.h - catchR*S.h*S.l)*k/8; S.l += (.4*catchR*S.h*S.l - .4*S.l)*k/8; S.h = clamp(S.h, .5, 400); S.l = clamp(S.l, .3, 200); }
      if (+S.p.race){ S.vh += dt*.05; S.vl += dt*.05; }
      S.Hh.push(S.h); S.Hl.push(S.l); if (S.Hh.length > 500){ S.Hh.shift(); S.Hl.shift(); }
      for (const d of S.dots){ d.a += (rnd() - .5)*.6; const v = (d.pred ? .05*S.vl : .06*S.vh)*dt; d.x = (d.x + Math.cos(d.a)*v + 1) % 1; d.y = (d.y + Math.sin(d.a)*v + 1) % 1; } },
    draw(g, R, S){ const [A, B] = lay(R, .5), nh = Math.min(120, Math.round(S.h)), nl = Math.min(40, Math.round(S.l));
      let ih = 0, il = 0; for (const d of S.dots){ if (d.pred){ if (il++ >= nl) continue; dot(g, A.x + d.x*A.w, A.y + d.y*A.h, 3.2, ROSE, .9); } else { if (ih++ >= nh) continue; dot(g, A.x + d.x*A.w, A.y + d.y*A.h, 2, GOLD, .85); } }
      g.strokeStyle = `rgba(${DIM},.25)`; g.strokeRect(A.x, A.y, A.w, A.h);
      title(g, `Зайцы ${Math.round(S.h)} · рыси ${Math.round(S.l)}${+S.p.race ? ` · скорость ×${S.vh.toFixed(1)}` : ""}`, A.x, A.y - 8);
      chart(g, B, [{ v: S.Hh, c: GOLD }, { v: S.Hl.map(v => v*3), c: ROSE }], 0, 160, "зайцы · рыси ×3", 500, "время →"); } }
  ];
})();
