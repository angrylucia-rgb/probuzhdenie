/* ---------- «Компас пути» (новый блок, этап 3, подэтап 10а) ----------
   Шесть вопросов → «Ваш маршрут на сегодня»: точка входа, центр внимания, практика и маршрут из фрагментов.
   Это не тест: никаких баллов и «уровней». Маршрут собирается из библиотеки CP_FR по меткам:
   z — зона (cos космос, earth Земля и живое, body тело и дыхание, mind смысл и сознание, micro атомы и кванты),
   e — вход (know знание, img образ, prac практика, q вопрос), tr — традиции (sci, ind, chi, mys), o — место на кольце. */
const CP_FR = [
  // ---- космос ----
  { t:"j", id:"abs", d:0, o:0, z:["cos","mind"], e:["q","img"], h:"Абсолют", tx:"Начало кольца — то, что традиции называют Единым, а физика — до-пространственным. Здесь честнее всего задать вопрос, чем дать ответ." },
  { t:"j", id:"g1", d:1, o:1, z:["cos","micro"], e:["img","prac"], tr:["sci"], h:"Звук и форма", tx:"Пластина Хладни: звук сам рисует узоры из песка. Попробуйте менять частоту — и увидите, как вибрация становится формой." },
  { t:"cal", ago:13.8e9, o:2, z:["cos"], e:["know"], tr:["sci"], h:"Большой взрыв в календаре", tx:"13,8 млрд лет, сжатые в один год. 1 января — начало; всё, что вы знаете о людях, уместится в последние секунды 31 декабря." },
  { t:"j", id:"g2", d:0, o:2, z:["cos"], e:["img","know"], tr:["sci"], h:"Вселенная", tx:"Два триллиона галактик, космическая паутина, реликтовое излучение — остывший свет первых 380 тысяч лет." },
  { t:"j", id:"g3", d:0, o:3, z:["cos"], e:["img"], tr:["sci"], h:"Ланиакея", tx:"Наш «безмерный небесный дом» — сверхскопление из ста тысяч галактик, текущих к общему центру, словно реки к морю." },
  { t:"j", id:"bh", d:3, o:3, z:["cos","micro"], e:["img","q"], tr:["sci"], h:"Горизонт событий", tx:"Граница, из-за которой не возвращается даже свет. За ней на сайте начинается Изнанка — мир без слов." },
  { t:"j", id:"g4", d:1, o:4, z:["cos","earth"], e:["img","know"], h:"Солнце", tx:"Звезда, свет которой идёт из ядра к поверхности десятки тысяч лет — и восемь минут до ваших глаз." },
  { t:"j", id:"moon", d:3, o:4, z:["cos","earth"], e:["know"], h:"Фазы и календари", tx:"Луна дала людям первые календари — от лунных месяцев Вавилона до праздников, которые до сих пор считают по новолуниям." },
  { t:"j", id:"jup", d:3, o:4, z:["cos","earth"], e:["q","know"], tr:["sci"], h:"Океан под льдом Европы", tx:"Под ледяной корой спутника Юпитера — солёный океан, где воды больше, чем на Земле. Одно из главных мест поиска жизни." },
  { t:"th", br:"pyt>kep", o:4, z:["cos"], e:["know","q"], h:"Музыка сфер", tx:"Пифагор услышал число в созвучиях, Кеплер искал гармонию планет — и нашёл точный закон." },
  { t:"th", br:"bru>gal", o:3, z:["cos"], e:["q"], tr:["mys","sci"], h:"Бесчисленные солнца", tx:"Монах Бруно сказал, что звёзды — солнца. Телескоп Галилея показал бездну звёзд. Сегодня известны тысячи планет у других звёзд." },
  { t:"th", br:"rig>lem", o:2, z:["cos","mind"], e:["q"], tr:["ind"], h:"До начала", tx:"Ригведа спрашивала, что было до сущего и не-сущего. Космология говорит о горячем плотном начале — и тоже не знает, было ли «до»." },
  // ---- Земля и живое ----
  { t:"j", id:"earth", d:0, o:5, z:["earth","mind"], e:["img","q"], h:"Гея · Душа мира", tx:"Земля как живое целое — образ традиций и гипотеза Лавлока о саморегуляции планеты, с честными метками, что доказано." },
  { t:"j", id:"earth", d:4, o:5, z:["earth","body"], e:["know"], tr:["sci"], h:"Резонанс Шумана", tx:"Полость между Землёй и ионосферой звенит от молний на частоте около 7,8 Гц. Что известно о связи с ритмами мозга — и что нет." },
  { t:"j", id:"earth", d:7, br:"bio", o:5, z:["earth"], e:["know","img"], h:"Биосфера", tx:"Тонкая плёнка жизни, которая сделала атмосферу кислородной и горы — известняковыми. Отсюда — вход в Древо жизни." },
  { t:"tree", id:"luca", o:5, z:["earth","micro"], e:["know"], tr:["sci"], h:"Общий предок", tx:"LUCA — клетка, от которой произошли все живые существа: бактерии, грибы, деревья и вы." },
  { t:"tree", id:"sap", o:6, z:["earth","body"], e:["img","know"], tr:["sci"], h:"Путь к нам по Древу", tx:"Нажмите «Пройти путь»: одиннадцать шагов от общего предка к Homo sapiens — родословная длиной в 4 млрд лет." },
  { t:"cal", ago:5.38e8, o:5, z:["earth"], e:["know"], tr:["sci"], h:"Кембрийский взрыв", tx:"За несколько десятков миллионов лет появились почти все типы животных — глаза, панцири, хищники и жертвы." },
  { t:"th", br:"tei>ver", o:5, z:["earth","mind"], e:["q"], tr:["mys","sci"], h:"Ноосфера", tx:"Священник-палеонтолог и русский геохимик придумали одно слово для оболочки разума над биосферой — и наполнили его по-разному." },
  { t:"th", br:"anx>dar", o:5, z:["earth"], e:["know"], tr:["sci"], h:"Люди от рыб", tx:"Догадка Анаксимандра за 2400 лет до Дарвина — и чем догадка отличается от теории." },
  { t:"tree", id:"euk", o:7, z:["earth","micro"], e:["know"], tr:["sci"], h:"Клетка с ядром — союз", tx:"Ваши клетки родились из союза двух микробов: митохондрии — бывшие свободные бактерии." },
  { t:"th", id:"goe", o:5, z:["earth"], e:["img","prac"], h:"Гёте: смотреть на живое", tx:"Гёте учил смотреть на растение долго и любовно, пока не увидишь, как лист превращается в цветок. Попробуйте сегодня так посмотреть на одно растение." },
  { t:"j", id:"earth", d:3, o:5, z:["earth","mind"], e:["q"], h:"Ноосфера на кольце", tx:"Человечество стало геологической силой. Что это значит для каждого из нас?" },
  // ---- тело и дыхание ----
  { t:"j", id:"human", d:5, o:6, z:["body"], e:["img","know"], tr:["sci"], h:"Физическое тело", tx:"Тридцать семь триллионов клеток, работающих вместе. Отсюда можно погрузиться в мышцы, органы и скелет." },
  { t:"j", id:"human", d:4, o:6, z:["body","mind"], e:["img","prac"], tr:["ind"], h:"Семь центров", tx:"Карта йогической традиции рядом с анатомией: где сплетения нервов, железы — и где образ." },
  { t:"j", id:"human", d:3, o:6, z:["body"], e:["prac"], tr:["ind","chi"], h:"Тело дыхания", tx:"Пранамайя-коша — тело дыхания и энергии. В Китае ей созвучно ци; наука видит здесь дыхание, нервную систему и ритм сердца." },
  { t:"j", id:"human", d:10, o:6, z:["body","mind"], e:["know"], tr:["sci"], h:"Нейроны", tx:"86 миллиардов клеток, каждая с тысячами связей. Всё, что вы чувствуете сейчас, — их согласованная работа." },
  { t:"th", id:"pat", o:6, z:["body","mind"], e:["prac","q"], tr:["ind"], h:"Патанджали: успокоить ум", tx:"«Йога — успокоение колебаний ума». Асанам в сутрах посвящено всего несколько строк, а уму — почти всё остальное." },
  { t:"th", id:"lao", o:1, z:["body","cos"], e:["prac","q"], tr:["chi"], h:"Лао-цзы: мягкость воды", tx:"Мягкое побеждает твёрдое. Даосская линия ведёт к цигуну — практике дыхания и плавного движения." },
  { t:"th", br:"dal>med", o:6, z:["body","mind"], e:["know"], tr:["ind","sci"], h:"Монахи в лаборатории", tx:"Что наука действительно измерила в медитации — и где эффекты скромнее заголовков." },
  { t:"j", id:"human", d:11, o:6, z:["body","micro"], e:["img","know"], tr:["sci"], h:"Эритроциты", tx:"Каждую секунду ваш костный мозг делает около двух миллионов красных клеток крови. Каждая обходит тело примерно за минуту." },
  // ---- смысл и сознание ----
  { t:"j", id:"dream", d:0, o:6, z:["mind","body"], e:["know","img"], tr:["sci"], h:"Засыпание", tx:"Граница бодрствования и сна: гипнагогические образы, вздрагивания, смена ритмов мозга." },
  { t:"j", id:"dream", d:2, o:6, z:["mind"], e:["q","know"], h:"Осознанные сновидения", tx:"Знать во сне, что спишь, — подтверждено в лабораториях сигналами глаз. Тибетская йога сна знала это веками." },
  { t:"j", id:"dream", d:3, o:6, z:["mind"], e:["q","prac"], tr:["ind"], h:"Турия — четвёртое", tx:"Свидетель бодрствования, сна и глубокого сна. Мандукья-упанишада — и что об этом может сказать наука." },
  { t:"j", id:"human", d:0, o:6, z:["mind"], e:["q"], tr:["ind"], h:"Тело блаженства", tx:"Анандамайя-коша — самый тонкий слой человека в ведантийской карте. Помечено честно: это язык опыта, не анатомии." },
  { t:"th", id:"bud", o:6, z:["mind"], e:["q","prac"], tr:["ind"], h:"Будда", tx:"«Пробудившийся»: не вера, а метод — внимание к тому, как возникают ощущения, мысли и «я»." },
  { t:"th", id:"ram", o:6, z:["mind"], e:["q","prac"], tr:["ind"], h:"Рамана: «Кто я?»", tx:"Самый простой вопрос и самый трудный: спросите — и проследите, откуда приходит ответ." },
  { t:"th", id:"eck", o:0, z:["mind"], e:["q"], tr:["mys"], h:"Экхарт: тишина в основании души", tx:"Немецкий мистик XIV века о «пустыне божества» и отрешённости — там, где кончаются образы." },
  { t:"th", id:"rum", o:6, z:["mind"], e:["img","q"], tr:["mys"], h:"Руми", tx:"Любовь, растворяющая отдельность, и кружение как молитва. «Ты — весь океан в капле»." },
  { t:"th", br:"bud>dmn", o:6, z:["mind"], e:["know"], tr:["ind","sci"], h:"Нет постоянного «я»", tx:"Буддийская мысль и сеть пассивного режима мозга — созвучие, а не доказательство." },
  { t:"th", br:"upa>shr", o:9, z:["mind","micro"], e:["q"], tr:["ind"], h:"«Ты есть То»", tx:"Шрёдингер всю жизнь читал Упанишады. Что из этого — физика, а что — личная философия великого физика." },
  { t:"iz", o:11, z:["mind"], e:["img"], h:"Изнанка", tx:"Вторая сторона сайта: звук, цвет и движение без слов. Просто побудьте там." },
  { t:"th", id:"zhu", o:6, z:["mind"], e:["q"], tr:["chi"], h:"Бабочка Чжуан-цзы", tx:"Человек ли видел во сне бабочку — или бабочка видит сон, что она человек?" },
  { t:"j", id:"g11", d:0, o:11, z:["mind","micro"], e:["q"], h:"Пустота", tx:"Последняя станция кольца — и первая перед возвращением к Абсолюту. Пустота как полнота возможностей." },
  { t:"th", br:"jun>pau", o:6, z:["mind"], e:["q"], tr:["sci"], h:"Синхроничность", tx:"Юнг и Паули искали язык для связи психики и материи. Честно: это гипотеза, а не открытие." },
  // ---- атомы и кванты ----
  { t:"j", id:"g7", d:0, o:7, z:["micro","earth"], e:["img","know"], tr:["sci"], h:"Клетка и ДНК", tx:"Двойная спираль — текст из четырёх букв, общий для всего живого." },
  { t:"j", id:"g8", d:0, o:8, z:["micro"], e:["know","img"], tr:["sci"], h:"Атом", tx:"Почти пустота: если ядро — горошина, электроны носятся в пределах футбольного стадиона." },
  { t:"j", id:"g9", d:1, o:9, z:["micro"], e:["img","q"], tr:["sci"], h:"Опыт с двумя щелями", tx:"Включите детектор у щелей — и интерференция исчезнет. Самый странный опыт физики, который можно повторить своими руками." },
  { t:"j", id:"g10", d:0, o:10, z:["micro","cos"], e:["know","q"], tr:["sci"], h:"Квантовый вакуум", tx:"Пустота, которая не пуста: поля дрожат даже в отсутствие частиц. Эффект Казимира это подтверждает." },
  { t:"th", br:"dem>dlt", o:8, z:["micro"], e:["know"], tr:["sci"], h:"Атомы: от рассуждения к весам", tx:"Демокрит догадался — Дальтон взвесил. Две тысячи лет между идеей и измерением." },
  { t:"th", br:"lao>boh", o:9, z:["micro"], e:["q"], tr:["chi"], h:"Инь-ян и дополнительность", tx:"Почему Нильс Бор поместил даосский символ на свой герб." },
  { t:"th", br:"nag>rov", o:9, z:["micro","mind"], e:["q"], tr:["ind"], h:"Пустотность и кванты", tx:"Нагарджуна и реляционная квантовая механика: у вещей нет отдельной сущности — только отношения." },
  { t:"th", br:"ava>bel", o:9, z:["micro"], e:["q","know"], tr:["chi","ind"], h:"«Всё во всём» и запутанность", tx:"Сеть Индры и квантовая запутанность — где созвучие, а где начинается «квантовая мистика»." }
];
const CP_Q = [
  { k:"z", q:"Что сейчас тянет сильнее?", a:[["cos","Звёзды и космос"],["earth","Земля и живое"],["body","Тело и дыхание"],["mind","Смысл и сознание"],["micro","Малое: клетки, атомы, кванты"]] },
  { k:"e", q:"Как вам легче входить?", a:[["know","Через знание — понять, как устроено"],["img","Через образ и красоту"],["prac","Через практику — попробовать"],["q","Через вопрос — подумать"]] },
  { k:"t", q:"Сколько у вас времени?", a:[["3","3 минуты"],["15","15 минут"],["60","Целый вечер"]] },
  { k:"s", q:"Какое у вас сейчас состояние?", a:[["anx","Беспокойно"],["scat","Рассеянно"],["calm","Спокойно"],["cur","Любопытно"]] },
  { k:"tr", q:"Что вам ближе?", a:[["sci","Наука, без традиций"],["ind","Традиции Индии: йога, веданта, буддизм"],["chi","Китай: даосизм, цигун"],["mys","Христианская и суфийская мистика"],["all","Всё вместе"]] },
  { k:"snd", q:"Тишина или звук?", a:[["off","Тишина"],["on","Тихий звук"]] }
];
const CP = (() => {
  const box = $("chCompass"), body = $("cpBody");
  const ZN = { cos:"космос", earth:"Земля и живое", body:"тело и дыхание", mind:"смысл и сознание", micro:"малое" };
  const EN = { know:"через знание", img:"через образ", prac:"через практику", q:"через вопрос" };
  const NEXT = { cos:"earth", earth:"body", body:"mind", mind:"micro", micro:"cos" };
  const PST = { cos:2, earth:5, body:7, mind:9, micro:8 };            // станция для практики с таймером
  const PST_TR = { chi:{ cos:3, body:10, micro:10, mind:10 }, ind:{ cos:1, body:8, mind:0, micro:9 } };
  const CEN = { cos:6, earth:0, body:2, mind:5, micro:5 };            // центр внимания по зоне
  let A = {}, qi = -1, res = null, open = false;
  const ansN = (k, v) => { const q = CP_Q.find(x => x.k === k); const a = q && q.a.find(x => x[0] === v); return a ? a[1] : ""; };
  // ---- сборка маршрута ----
  function build(){
    const z = A.z || "mind", e = A.e || "know", tm = +(A.t || 15), st = A.s || "calm", tr = A.tr || "all";
    const pre = [];
    if (st === "anx") pre.push({ t:"path", h:"Сначала — дыхание", tx:"Пять минут дыхания сердца: вдох 5 секунд, выдох 5 секунд. Медленное ровное дыхание повышает вариабельность сердечного ритма и у многих людей снижает напряжение. Остальное подождёт." });
    else if (st === "scat") pre.push({ t:"path", h:"Собрать внимание", tx:"Десять дыханий сердца — вдох 5 секунд, выдох 5 секунд — с вниманием к движению живота. Этого достаточно, чтобы вернуться сюда." });
    const want = tm <= 3 ? 2 : tm <= 15 ? 5 : 8;
    const pract = tm >= 15 ? 1 : 0;
    const nFr = Math.max(1, want - pre.length - pract);
    const sc = CP_FR.map(f => {
      let s = Math.random()*1.6;
      if (f.z[0] === z) s += 5; else if (f.z.includes(z)) s += 3.5; else if (f.z.includes(NEXT[z])) s += 1;
      if (f.e.includes(e)) s += 2;
      const ft = f.tr || [];
      if (tr === "sci"){ if (ft.includes("sci")) s += 1.5; else if (ft.length) s -= 4; }
      else if (tr !== "all"){ if (ft.includes(tr)) s += 2.5; else if (ft.length && !ft.includes("sci")) s -= 1.2; }
      return [s, f];
    }).sort((a, b) => b[0] - a[0]);
    const pick = [], keys = new Set(); let nTh = 0;
    for (const [, f] of sc){
      if (pick.length >= nFr) break;
      const key = f.t + (f.id || "") + (f.d || "") + (f.br || "");
      if (keys.has(key)) continue;
      if (f.t === "th" && nTh >= Math.max(1, Math.ceil(nFr/2))) continue;
      keys.add(key); if (f.t === "th") nTh++; pick.push(f);
    }
    pick.sort((a, b) => a.o - b.o);
    const steps = [...pre, ...pick.map(f => ({ ...f }))];
    const pi = (PST_TR[tr] && PST_TR[tr][z] != null) ? PST_TR[tr][z] : PST[z];
    if (pract) steps.push({ t:"in", i: pi, h:`Практика станции «${ST[pi].short}»`, tx: ST[pi].prac + " Таймер — пять минут; ответ на вопрос станции можно записать в её дневник." });
    const c = st === "anx" ? 3 : st === "scat" ? 5 : CEN[z];
    res = { steps, c, pi, z, e, tm, tr, st };
    return res;
  }
  // ---- экраны ----
  const dots = () => `<div class="cp-dots">${CP_Q.map((q, i) => `<i class="${i < qi ? "done" : i === qi ? "on" : ""}"></i>`).join("")}</div>`;
  function screen(){
    if (qi < 0){
      body.innerHTML = `<span class="mono eyebrow">Компас пути</span><h2>С чего начать сегодня?</h2>
        <p class="lede">Шесть коротких вопросов — около минуты. Ответы соберут маршрут по сайту под ваш интерес, время и состояние.</p>
        <p class="cp-honest">Это не психологический тест и не оценка «уровня» — просто компас интереса на сегодня. Ответы остаются в этом браузере.</p>
        <div class="cp-nav"><button class="btn cp-go" id="cpStart" data-hover>Начать →</button></div>`;
      $("cpStart").onclick = () => { qi = 0; screen(); };
    } else if (qi < CP_Q.length){
      const q = CP_Q[qi];
      body.innerHTML = `${dots()}<span class="mono eyebrow">Вопрос ${qi + 1} из ${CP_Q.length}</span><h2>${esc(q.q)}</h2>
        <div class="cp-ans">${q.a.map(([v, t]) => `<button data-v="${v}" class="${A[q.k] === v ? "on" : ""}" data-hover>${esc(t)}</button>`).join("")}</div>
        <div class="cp-nav"><button class="tm-link" id="cpBack" data-hover>← Назад</button><button class="tm-link" id="cpSkip" data-hover>Пропустить →</button></div>`;
      body.querySelectorAll(".cp-ans button").forEach(b => b.onclick = () => { A[q.k] = b.dataset.v; b.classList.add("on"); setTimeout(() => { qi++; if (qi >= CP_Q.length) result(); else screen(); }, 180); });
      $("cpBack").onclick = () => { qi--; screen(); };
      $("cpSkip").onclick = () => { qi++; if (qi >= CP_Q.length) result(); else screen(); };
    }
    body.classList.remove("swap"); void body.offsetWidth; body.classList.add("swap");
    const f = body.querySelector(".cp-ans button, #cpStart"); if (f) f.focus({ preventScroll:true });
  }
  function result(){
    qi = CP_Q.length; build();
    const r = res, C = DATA.centers[r.c], P = ST[r.pi];
    const why = [ZN[r.z], EN[r.e], r.tm <= 3 ? "3 минуты" : r.tm <= 15 ? "15 минут" : "вечер", r.tr !== "all" ? ansN("tr", r.tr).split(",")[0].toLowerCase() : ""].filter(Boolean).join(" · ");
    const nm = s => s.t === "j" ? (JOURNEYS[s.id].title || ST[JOURNEYS[s.id].st].short) : s.t === "cal" ? "Календарь" : s.t === "tree" ? "Древо жизни" : s.t === "th" ? "Нить мысли" : s.t === "path" ? "Дыхание сердца" : s.t === "in" ? "Практика" : "Изнанка";
    body.innerHTML = `<span class="mono eyebrow">Компас пути · ${r.steps.length} ${r.steps.length < 5 ? "шага" : "шагов"}</span>
      <h2>Ваш маршрут на сегодня</h2>
      <p class="cp-why mono">${esc(why)}</p>
      <ol class="cp-steps">${r.steps.map(s => `<li><span class="mono">${esc(nm(s))}</span><b>${esc(s.h)}</b></li>`).join("")}</ol>
      <div class="cp-cards">
        <div class="cp-card"><span class="mono eyebrow">Центр внимания</span><h3>${esc(C.name)}</h3><p>${esc(C.theme)}</p><p class="cp-sm">${esc(C.prac)}</p><button class="tm-link" id="cpCen" data-hover>К семи центрам →</button></div>
        <div class="cp-card"><span class="mono eyebrow">Практика с таймером</span><h3>${esc(P.short)}</h3><p>${esc(P.prac)}</p><button class="tm-link" id="cpPr" data-hover>Открыть практику →</button></div>
      </div>
      <div class="cp-nav"><button class="tm-link" id="cpAgain" data-hover>↺ Пересобрать</button><button class="tm-link" id="cpRedo" data-hover>Ответить заново</button><button class="btn cp-go" id="cpGo" data-hover>Начать маршрут →</button></div>`;
    body.classList.remove("swap"); void body.offsetWidth; body.classList.add("swap");
    $("cpAgain").onclick = result;
    $("cpRedo").onclick = () => { A = {}; qi = 0; screen(); };
    $("cpCen").onclick = () => { close(); RT.go({ t:"j", id:"human", d:4 }); };
    $("cpPr").onclick = () => { close(); RT.go({ t:"in", i: r.pi }); };
    $("cpGo").onclick = () => {
      // звук — по ответу
      const sb = $("sound"), on = sb.getAttribute("aria-pressed") === "true";
      if (A.snd === "on" && !on) sb.click(); else if (A.snd === "off" && on) sb.click();
      save(r); close();
      RT.start({ id:"compass", nm:"Ваш маршрут", sub: why, steps: r.steps });
    };
    $("cpGo").focus({ preventScroll:true });
  }
  function save(r){
    try {
      const L = JSON.parse(localStorage.getItem("astro-compass") || "[]");
      L.unshift({ d: Date.now(), a: { ...A }, steps: r.steps.map(s => s.h) });
      localStorage.setItem("astro-compass", JSON.stringify(L.slice(0, 5)));
    } catch(e){}
  }
  function openC(){ closeChapters(); toggleMenu(false); surface(); open = compassOn = true; box.classList.add("open"); box.setAttribute("aria-hidden", "false"); A = {}; qi = -1; screen(); hideInvite(); }
  function close(){ if (!open) return; open = compassOn = false; box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); }
  $("cpClose").onclick = close;
  addEventListener("keydown", e => { if (open && e.key === "Escape"){ e.stopPropagation(); close(); } }, true);
  // ---- тихое приглашение при первом визите ----
  const inv = $("cpInvite");
  function hideInvite(){ inv.classList.remove("open"); inv.setAttribute("aria-hidden", "true"); }
  $("cpInvGo").onclick = () => { hideInvite(); openC(); };
  $("cpInvX").onclick = hideInvite;
  let seen = false; try { seen = !!localStorage.getItem("astro-compass-invite"); } catch(e){}
  if (!seen){
    const tryShow = () => {
      if (locked() || RT.on){ setTimeout(tryShow, 4000); return; }
      inv.classList.add("open"); inv.setAttribute("aria-hidden", "false");
      try { localStorage.setItem("astro-compass-invite", "1"); } catch(e){}
      setTimeout(hideInvite, 22000);
    };
    setTimeout(tryShow, 9000);
  }
  return { open: openC, close, get on(){ return open; }, dbg: { build: a => { A = { ...a }; return build().steps.map(s => s.h); }, res: () => res } };
})();
function openCompass(){ CP.open(); }
function closeCompass(){ CP.close(); }
$("mCompass").onclick = openCompass;
$("rtCompass").onclick = openCompass;
