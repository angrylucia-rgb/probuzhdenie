// ===== сквозной путь: каждая станция — путешествие из слоёв; конец одного ведёт внутрь следующего =====
const GEN = i => [{ short:ST[i].short, kind:"g", st:i, name:ST[i].name, sub:ST[i].sub }];
// Станция VIII двухслойная: спираль ДНК, затем одна молекула из неё — и уже из атома этой
// молекулы вырастает станция «Атом» (пара ["g7","g8"] в ZOOM_PAIRS, без вспышки)
const DNA_LV = [
  { short:ST[7].short, kind:"g", st:7, name:ST[7].name, sub:ST[7].sub },
  { short:"Молекула", kind:"mol", st:7, name:"Молекула", sub:"Азотистое основание · буква кода",
    scale:"10⁻⁹ м", lead:"Ступенька спирали — это молекула из десятка атомов. Четыре такие буквы и составляют весь текст наследственности.",
    hint:"Листайте — вглубь, в один атом",
    sci:[["s","В ДНК четыре азотистых основания: аденин, гуанин, цитозин и тимин. Аденин всегда встаёт против тимина, гуанин — против цитозина"],
         ["s","Держатся пары на водородных связях: у пары А–Т их две, у Г–Ц три. Поэтому участки, богатые Г и Ц, расплетаются труднее"],
         ["s","Шаг спирали — 3,4 нанометра, в нём десять пар оснований; поперечник двойной спирали около 2 нанометров"],
         ["s","В теле около 37 триллионов клеток, и почти в каждой лежит один и тот же текст длиной около 3,1 млрд пар букв"],
         ["t","Модель на экране условная: все связи одной длины, кольца правильные. Это схема строения, а не расчёт молекулы"]],
    trad:["Веды — нама-рупа, имя и форма: у всякой вещи есть звучание и очертание",
          "Пифагорейцы — «всё есть число»: мир держится на счётных соотношениях",
          "Каббала — мир сотворён сочетаниями букв; смысл рождается из порядка знаков",
          "Закон Одного — разумная энергия принимает форму через закономерность, а не через случай"] }
];
// Станция IV двухслойная: сначала космическая паутина и сверхскопление Ланиакея с Местной группой —
// ступень шкалы между Вселенной (8,8·10²⁶ м) и Галактикой (10²¹ м), — затем сама галактика, которая
// вырастает из точки Млечного Пути (см. GL_K в сцене станции)
const GAL_LV = [
  { short:"Ланиакея", kind:"lan", st:3, name:"Ланиакея", sub:"Космическая паутина · Местная группа",
    scale:"≈5·10²⁴ м", lead:"Галактики не рассыпаны по Вселенной, а сплетены в сеть: нити, стены и узлы-скопления вокруг огромных пустот. Наш дом в этой сети — сверхскопление Ланиакея, а в нём, на одной из нитей, — Местная группа: Млечный Путь, Андромеда и десятки карликовых галактик.",
    hint:"Листайте — вглубь, к Млечному Пути",
    sci:[["s","Ланиакея — сверхскопление поперечником около 160 мегапарсек (≈520 млн световых лет), около 100 000 галактик и массой порядка 10¹⁷ масс Солнца. Его границы провели в 2014 году Тулли, Куртуа, Хоффман и Помаред по движению тысяч галактик"],
         ["s","Ланиакею определяет не плотность, а течение: внутри её границ галактики, помимо общего расширения, сносятся к одной области — Великому аттрактору. Золотые точки на экране показывают это течение"],
         ["s","Местная группа — более 80 галактик в объёме около 3 мегапарсек. Крупнейшие — Андромеда и Млечный Путь; рядом с нами — Большое и Малое Магеллановы облака"],
         ["s","Андромеда в 2,5 млн световых лет от нас и сближается с Млечным Путём примерно на 110 км/с"],
         ["h","Слияние с Андромедой долго считали неизбежным через 4–5 млрд лет; расчёт по данным «Хаббла» и Gaia (Савала и др., 2025) даёт около 50% вероятности в ближайшие 10 млрд лет"],
         ["h","Сеть галактик и сеть нейронов мозга статистически похожи по структуре (Вацца и Фелетти, 2020) — любопытное совпадение формы, а не связь между ними"],
         ["t","Масштабы на экране сжаты: в действительности Ланиакея больше Местной группы примерно в 50 раз, а расстояние до Андромеды — в 25 раз больше поперечника нашей галактики"]],
    trad:["Буддизм хуаянь — сеть Индры: в каждом узле бесконечной сети висит жемчужина, и в каждой отражаются все остальные",
          "Имя «Ланиакея» по-гавайски — «необъятные небеса»; его предложил преподаватель гавайского языка Нава‘а Наполеон в честь полинезийских мореходов, ходивших по звёздам",
          "Герметизм — «что вверху, то и внизу»: одна и та же форма сети повторяется на разных масштабах",
          "Закон Одного — всё сотворённое связано единым замыслом Логоса, и ни одна часть не существует отдельно"],
    prac:"Полный адрес: медленно назвать свой адрес до конца — улица, город, страна, Земля, Солнечная система, Рукав Ориона, Млечный Путь, Местная группа, Ланиакея — и на каждом шаге почувствовать, как расширяется «дом»." },
  { short:ST[3].short, kind:"g", st:3, name:ST[3].name, sub:ST[3].sub }
];
// Станция II двухслойная: узел первоимпульса, затем звук, ставший формой, — фигуры Хладни
const CYM_LV = { short:"Хладни", kind:"cym", st:1, name:"Звук и форма", sub:"Фигуры Хладни · вибрация, ставшая узором",
  scale:"пластина ≈ 0,3 м", hint:"Двигайте частоту — песок перестроится. Без касаний частота сама переходит к следующему резонансу",
  lead:"На металлическую пластину насыпан песок. Пластину заставляют звучать — и песок, подпрыгивая там, где металл колеблется, сползает туда, где он неподвижен. На каждой резонансной частоте возникает свой узор из линий покоя. Между резонансами пластина почти молчит, и песок узора не находит.",
  sci:[["s","Эрнст Хладни описал эти фигуры в 1787 году: он вёл смычком по краю посыпанной песком пластины. Опыт показывали Наполеону, и по его заказу Парижская академия объявила премию за теорию колебаний пластин — её в 1816 году получила Софи Жермен"],
       ["s","Линии, на которые собирается песок, — узловые: там пластина не движется. Чем выше частота, тем больше узловых линий и тем сложнее узор"],
       ["s","Скрипичные мастера по сей день смотрят на фигуры Хладни деки и спинки инструмента, подстраивая толщину дерева до нужных резонансов"],
       ["s","Слово «киматика» предложил Ханс Йенни в 1967 году; он снимал узоры в песке, порошках и жидкостях на разных частотах"],
       ["t","На экране — модель: моды квадратной пластины взяты в классическом приближении cos·cos ± cos·cos, частоты условно пропорциональны n² + m². У настоящей свободной пластины частоты и формы немного другие, но принцип тот же"],
       ["h","Популярные утверждения о «целебных частотах» (528 Гц и подобные) и о том, что звук «перестраивает» воду или ДНК, опытами не подтверждены. Узор Хладни — следствие резонанса пластины, а не особой силы звука"]],
  trad:["Нада-брахман — «мир есть звук»: в Упанишадах и нада-йоге творение начинается с вибрации, и первозвук ОМ содержит в себе все формы",
        "Евангелие от Иоанна — «В начале было Слово»; в Книге Бытия мир создаётся речью: «И сказал Бог…»",
        "Пифагорейцы — «музыка сфер»: числовые отношения струн и порядок космоса — одно и то же отношение",
        "Хазрат Инайят Хан, «Мистика звука» — всё проявленное есть вибрация разной плотности",
        "Честное пересечение: из всех этих образов лаборатория подтверждает один — что колебание при определённых частотах само выстраивает вещество в правильный узор"],
  prac:"Звучащий ОМ: на выдохе тянуть «О-О-М» на одной ноте, положив ладонь на грудь, затем на макушку. Заметить, где вибрация сильнее, а где тело «молчит», — как узловые линии на пластине." };
// Станция X: волны и частицы, Стандартная модель (SM_LV), затем опыт с двумя щелями — интерактивный
const SLIT_LV = { short:"Две щели", kind:"slit", st:9, name:"Опыт с двумя щелями", sub:"Волна или частица · что значит «наблюдать»",
  scale:"щели ≈ 10⁻⁷ м", hint:"Включите детектор — и смотрите, что станет с полосами",
  lead:"Электроны выпускают по одному. Каждый оставляет на экране одну точку — как частица. Но точки складываются в полосы, будто каждый электрон прошёл сразу через обе щели и встретился сам с собой, как волна. Поставьте у щелей детектор, который отмечает, через какую щель прошёл электрон, — и полосы исчезнут.",
  sci:[["s","Опыт с одиночными электронами впервые поставили и сняли на плёнку Мерли, Миссироли и Поцци в Болонье в 1974 году (вместо щелей у них стояла электронная бипризма — эффект тот же). В 1989 году Тономура показал, как картина набирается из отдельных точек. Читатели журнала Physics World в 2002 году назвали этот опыт самым красивым в истории физики"],
       ["s","Интерферируют не только электроны: нейтроны, атомы, молекулы фуллерена C60 (Арндт и Цайлингер, 1999) и даже молекулы почти из 2000 атомов (2019)"],
       ["s","Полосы пропадают не потому, что кто-то смотрит, а потому, что путь электрона оставил след в приборе. Как только сведения о щели в принципе где-то записаны, волны от двух щелей перестают складываться — это называют декогеренцией. Сознание экспериментатора в этом не участвует"],
       ["h","Что происходит с электроном между источником и экраном, физика не решила: копенгагенская, многомировая интерпретации, теория Бома одинаково предсказывают результат опыта и расходятся только в толковании"],
       ["t","Модель на экране — расчёт волн от двух щелей: полосы стоят там, где волны гасят друг друга, и точки выпадают по той же формуле. Размеры условные: в настоящем опыте щели меньше микрометра, а полосы видны только под увеличением"]],
  trad:["Нильс Бор, автор принципа дополнительности (волна и частица — две взаимоисключающие и одинаково нужные стороны одного), в 1947 году поместил на свой герб знак инь-ян с девизом «Contraria sunt complementa» — противоположности дополняют друг друга",
        "Буддизм — взаимозависимое возникновение: у вещи нет свойств самих по себе, вне отношений. Созвучный образ: в квантовой физике свойство определяется во взаимодействии",
        "Упанишады — свидетель (сакши), который наблюдает, не вмешиваясь. Физика добавляет трезвое уточнение: прибор не может узнать путь частицы, не оставив в ней следа"],
  prac:"Два взгляда на дыхание: минуту просто следить за ним, ничего не меняя, затем минуту стараться «поймать» каждый вдох. Заметить, где кончается наблюдение и начинается вмешательство." };
const JOURNEYS = {
  abs:{ st:0, kind:"a", levels:() => ALV, next:() => "g1" },
  g1:{ st:1, kind:"g", levels:() => [GEN(1)[0], CYM_LV], next:() => "g2" },
  g2:{ st:2, kind:"g", levels:() => GEN(2), next:() => "g3" },
  g3:{ st:3, kind:"g", levels:() => GAL_LV, start:1, next:() => galBranch === "bh" ? "bh" : "g4" },
  // ответвление станции IV: к центру Галактики, к чёрной дыре. Дальше пути по кольцу нет — только за горизонт
  bh:{ st:3, kind:"g", levels:() => BH_LV, next:() => "iz" },
  g4:{ st:4, kind:"g", levels:() => SUNLV, next:() => "earth" },
  // ответвления станции V: из Солнечной системы — к Луне и к Юпитеру с Европой; дальше путь ведёт на Землю
  moon:{ st:4, kind:"g", title:"Луна", levels:() => MOON_LV, next:() => "earth" },
  jup:{ st:4, kind:"g", title:"Юпитер и Европа", levels:() => JUP_LV, next:() => "earth" },
  earth:{ st:5, kind:"e", levels:() => earthBranch === "bio" ? [...ELV.slice(0, 7), ...BIO_LVS] : ELV, next:() => earthBranch === "bio" ? "human" : "g8", fork:6 },
  human:{ st:6, kind:"h", levels:() => HLV, next:() => "g7" },
  // ответвление станции VII: сон и изменённые состояния сознания (вход — с тонких тел и центров)
  dream:{ st:6, kind:"g", title:"Сон и сознание", levels:() => DREAM_LV, next:() => "g7" },
  g7:{ st:7, kind:"g", levels:() => DNA_LV, next:() => "g8" },
  g8:{ st:8, kind:"g", levels:() => ATOM_LV, next:() => "g9" },
  g9:{ st:9, kind:"g", levels:() => [GEN(9)[0], SM_LV, SLIT_LV], next:() => "g10" },
  g10:{ st:10, kind:"g", levels:() => GEN(10), next:() => "g11" },
  g11:{ st:11, kind:"g", levels:() => GEN(11), next:() => "abs" }
};
const JPREV = { abs:"g11", g1:"abs", g2:"g1", g3:"g2", g4:"g3", bh:"g3", moon:"g4", jup:"g4", dream:"human", earth:"g4", human:"earth", g7:"human", g8:"g7", g9:"g8", g10:"g9", g11:"g10" };
const jidOf = i => i === 0 ? "abs" : i === 5 ? "earth" : i === 6 ? "human" : "g" + i;
const jNextSt = () => JOURNEYS[JOURNEYS[jId].next()].st;
// имя следующей остановки: у ветки чёрной дыры «следующая» — не станция, а Изнанка
const jNextName = () => { const n = JOURNEYS[jId].next(); return n === "iz" ? "Изнанка" : n === "bh" ? "Чёрная дыра" : ST[JOURNEYS[n].st].short; };
const jPrevId = () => jHist.length ? jHist[jHist.length - 1] : JPREV[jId];
const FXC = ["#ffffff", "#ffe2a8", "#b9a6ff", "#a8b8ff", "#ffb35a", "#7fd0ff", "#ff9fcf", "#ff9fcf", "#8fe4ff", "#b49cff", "#9ff0e0", "#e6dcff"];
const lvlName = L => { const v = JL[L]; if (!v) return ""; return v.kind === "kosha" ? DATA.koshas[v.k].name : v.name; };
// шкала глубины
let dTop = 0, dBot = 0, dX = 96;
function drawDepth(){
  const sv = $("dsvg"), Hh = sv.clientHeight || 400, x = dX = Math.min(96, (sv.clientWidth || 104) - 8), f1 = v => v.toFixed(1);
  dTop = 16; dBot = Hh - 16;
  const yL = L => dTop + (dBot - dTop)*L/DMAX;
  const fade = y => smooth(dTop - 14, dTop + 26, y)*smooth(dBot + 14, dBot - 26, y);
  let h = "";
  for (let k = 0; k < 48; k++){ const a = dTop - 14 + (dBot - dTop + 28)*k/48, b = dTop - 14 + (dBot - dTop + 28)*(k+1)/48;
    h += `<line x1="${x}" y1="${f1(a)}" x2="${x}" y2="${f1(b)}" stroke="rgba(214,172,94,${(.5*fade((a+b)/2)).toFixed(3)})" stroke-width=".6"/>`; }
  for (let k = 0; k <= DMAX*6; k++){ if (k % 6 === 0) continue; const y = dTop + (dBot - dTop)*k/(DMAX*6);
    h += `<line x1="${x - (k % 4 === 0 ? 5 : 3)}" y1="${f1(y)}" x2="${x}" y2="${f1(y)}" stroke="rgba(214,172,94,${(.28*fade(y)).toFixed(3)})" stroke-width=".6"/>`; }
  const SEPS = jKind === "h" ? [4, 5, 9] : jKind === "e" ? (earthBranch === "bio" ? [6, 7] : [6, 7, 9, 13, 15]) : [];
  const fork = JOURNEYS[jId].fork;
  JL.forEach((v, L) => { const y = yL(L);
    h += `<line x1="${x - 9}" y1="${f1(y)}" x2="${x + 5}" y2="${f1(y)}" stroke="rgba(214,172,94,.75)" stroke-width=".9"/>`;
    h += `<text class="dl" data-l="${L}" x="${x - 14}" y="${f1(y + 3.5)}" text-anchor="end" tabindex="0" role="button">${v.short}${fork === L ? " ⑂" : ""}</text>`;
    if (SEPS.includes(L)) h += `<line x1="${x - 60}" y1="${f1((yL(L) + yL(L - 1))/2)}" x2="${x + 5}" y2="${f1((yL(L) + yL(L - 1))/2)}" stroke="rgba(214,172,94,.18)" stroke-width=".5" stroke-dasharray="1 3"/>`;
  });
  h += `<line x1="${x - 9}" y1="${f1(yL(DMAX))}" x2="${x + 5}" y2="${f1(yL(DMAX))}" stroke="rgba(255,150,205,.7)" stroke-width=".9"/><text class="dl loop" data-l="${DMAX}" x="${x - 14}" y="${f1(yL(DMAX) + 3.5)}" text-anchor="end" tabindex="0" role="button">↓ ${jNextName()}</text>`;
  h += `<g id="dMark"><path d="M0 -4 L4 0 L0 4 L-4 0Z" fill="#D6AC5E"/><circle r="7" fill="none" stroke="rgba(214,172,94,.35)" stroke-width=".5"/></g>`;
  sv.innerHTML = h;
  sv.querySelectorAll(".dl").forEach(el => { const go = () => { depthT = +el.dataset.l; lastDepthInput = performance.now(); el.blur(); };
    el.addEventListener("click", go); el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); go(); } }); });
}
function depthMark(){
  const mkr = $("dMark"); if (!mkr) return;
  mkr.setAttribute("transform", `translate(${dX} ${(dTop + (dBot - dTop)*Math.max(-.4, depth)/DMAX).toFixed(1)})`);
  const L = Math.round(depth);
  $("dsvg").querySelectorAll(".dl").forEach((el, k) => el.classList.toggle("on", k === L));
}
function listHTML(title, arr, marker){ return `<section><h3>${title}</h3><ul class="list">${arr.map(x => Array.isArray(x) ? `<li>${mk(x[0])}<span>${esc(x[1])}</span></li>` : `<li>${marker ? `<i class="mk ${marker}"></i>` : mk("t")}<span>${esc(x)}</span></li>`).join("")}</ul></section>`; }
function renderChakraDetail(){
  const box = $("hdChakra"); if (!box) return;
  if (hSel < 0){ box.innerHTML = `<p class="note">${mk("t")}<span>Выберите центр — камера подойдёт к нему.</span></p>`; return; }
  const c = DATA.centers[hSel];
  box.innerHTML = `<span class="mono" style="color:${c.c}">Центр ${c.k} из 7 · ${esc(c.ray)} луч</span>
    <p class="quote">«${esc(c.i)}»</p>
    <dl class="facts"><dt>Тема</dt><dd>${esc(c.theme)}</dd><dt>Тень</dt><dd>${esc(c.shadow)}</dd><dt>Стихия</dt><dd>${esc(c.el)} · биджа ${esc(c.bija)}</dd><dt>Тело</dt><dd>${esc(c.body)}</dd><dt>Даосизм</dt><dd>${esc(c.dt)}</dd><dt>Каббала</dt><dd>${esc(c.sef)}</dd><dt>Закон Одного</dt><dd>${esc(c.lo)}</dd><dt>Практика</dt><dd>${esc(c.prac)}</dd></dl>
    <p class="note">${mk("t")}<span>Чакры — модель внутреннего опыта; как анатомические органы наука их не находит. Но в этих зонах лежат крупные нервные сплетения, а практики дыхания и внимания измеримо влияют на нервную систему.</span></p>`;
  hdBody.querySelectorAll(".hlist button").forEach((b, k) => b.setAttribute("aria-current", String(k === hSel)));
}
// пульты опытов станций IX и X. Разметка — здесь, обработчики — в atomWire (после вставки в панель)
const fmtN = x => x >= 1e9 ? (x/1e9).toFixed(x >= 1e10 ? 0 : 1).replace(".", ",") + " млрд" : x >= 1e6 ? (x/1e6).toFixed(1).replace(".", ",") + " млн" : Math.round(x).toLocaleString("ru-RU");
function atomCtl(kind){
  const A = ATOM, elBtns = () => `<div class="slit-row">${Object.keys(ATOM_EL).map(k => `<button class="btn" data-el="${k}" aria-pressed="${A && A.el === k}" data-hover>${ATOM_EL[k].nm}</button>`).join("")}</div>`;
  if (kind === "orb") return elBtns() + `<p class="slit-n" id="atInfo"></p>`;
  if (kind === "nuc") return `<div class="slit-row">${[["nuc", "Ядро"], ["clock", "Часы распада"], ["forge", "Звёздная кузница"]].map(([m, t]) => `<button class="btn" data-am="${m}" aria-pressed="${A && A.mode === m}" data-hover>${t}</button>`).join("")}</div><div id="atMode" class="slit-ctl"></div>`;
  if (kind === "qrk") return `<div class="slit-row"><button class="btn" id="qPull" data-hover>Потянуть кварк</button><button class="btn" id="qPN" aria-pressed="${!A || A.pr}" data-hover>${!A || A.pr ? "Протон · uud" : "Нейтрон · udd"}</button></div><p class="slit-n" id="qR"></p>`;
  if (kind === "sm") return `<div class="sm-grid">${SM_P.map((p, k) => `<button class="sm-c sm-${p[5]}" style="grid-column:${k < 12 ? k % 3 + 1 : k < 16 ? 4 : 5};grid-row:${k < 12 ? Math.floor(k/3) + 1 : k < 16 ? k - 11 : 1}" data-sm="${k}" aria-pressed="${!!SM_STATE && SM_STATE.sel === k}" data-hover><b>${esc(p[0].replace("_", ""))}</b><span>${esc(p[2])}</span></button>`).join("")}</div><div id="smInfo"></div>`;
  return "";
}
function atomInfo(){
  const A = ATOM; if (!A) return;
  const E = ATOM_EL[A.el], ai = $("atInfo");
  hdBody.querySelectorAll("button[data-el]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.el === A.el)));
  if (ai) ai.innerHTML = `<span class="mono"><b>${esc(E.nm)}</b> · Z = ${E.Z} · ${esc(E.cfg)}</span><br>${esc(E.tx)}.`;
  hdBody.querySelectorAll("button[data-am]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.am === A.mode)));
  const am = $("atMode");
  if (am && am.dataset.m !== A.mode + A.el + A.iso){
    am.dataset.m = A.mode + A.el + A.iso;
    if (A.mode === "nuc") am.innerHTML = `<div class="slit-row">${Object.keys(ATOM_EL).map(k => `<button class="btn" data-el="${k}" aria-pressed="${A.el === k}" data-hover>${ATOM_EL[k].nm}</button>`).join("")}</div>
      <p class="slit-n">${esc(E.nm)}-${E.A}: ${E.Z} ${E.Z === 1 ? "протон" : E.Z < 5 ? "протона" : "протонов"}${E.N ? ` и ${E.N} нейтронов` : ", нейтронов нет"}. Протоны — красноватые, нейтроны — голубоватые; золотые искры — обмен сильного взаимодействия между соседями.</p>`;
    else if (A.mode === "clock"){ const I = A.ISO[A.iso];
      am.innerHTML = `<div class="slit-row">${A.ISO.map((x, k) => `<button class="btn" data-iso="${k}" aria-pressed="${k === A.iso}" data-hover>${esc(x.nm)}</button>`).join("")}<button class="btn" id="ckRe" data-hover>Сначала</button></div>
        <p class="slit-n">${esc(I.r)} · период полураспада ${fmtN(I.T)} ${I.u}. ${esc(I.use[0].toUpperCase() + I.use.slice(1))}.</p><p class="slit-n mono" id="ckR"></p>`;
    } else am.innerHTML = `<p class="slit-n">Слияние лёгких ядер поднимается по кривой к железу и выделяет энергию — так светят звёзды. Деление тяжёлых ядер скатывается к железу справа — так работают АЭС. Железо и никель лежат на вершине: из них энергию не получить ни синтезом, ни делением, поэтому, наработав железное ядро, массивная звезда гибнет.</p>`;
    atomWire();
  }
  const cr = $("ckR");
  if (cr && A.mode === "clock"){ const I = A.ISO[A.iso], n = A.left();
    cr.innerHTML = `Прошло <b>${A.ckT.toFixed(1).replace(".", ",")}</b> периода ≈ <b>${fmtN(A.ckT*I.T)}</b> ${I.u}<br>Осталось ядер: <b>${n}</b> из ${A.NCK} (${Math.round(100*n/A.NCK)} %; по закону — ${Math.round(100*Math.pow(2, -A.ckT))} %)`; }
  const qr = $("qR");
  if (qr) qr.innerHTML = `Попыток вытащить кварк: <b>${A.pulls}</b> · свободных кварков: <b>0</b> · родилось мезонов: <b>${A.mesons}</b>`;
  const qp = $("qPN"); if (qp){ qp.setAttribute("aria-pressed", String(A.pr)); qp.textContent = A.pr ? "Протон · uud" : "Нейтрон · udd"; }
}
function smInfo(){
  const S = SM_STATE, box = $("smInfo"); if (!box) return;
  hdBody.querySelectorAll("button[data-sm]").forEach(b => b.setAttribute("aria-pressed", String(!!S && S.sel === +b.dataset.sm)));
  if (!S || S.sel < 0){ box.innerHTML = `<p class="slit-n">Фиолетовые — кварки, зелёные — лептоны, оранжевые — переносчики сил, золотой — бозон Хиггса. Столбцы I, II, III — три поколения: каждое следующее тяжелее предыдущего. Светлые искры, пролетающие насквозь, — нейтрино от Солнца.</p>`; return; }
  const p = SM_P[S.sel], GN = { q:"кварк", l:"лептон", b:"переносчик силы", h:"скалярный бозон" };
  box.innerHTML = `<p class="slit-n"><span class="mono"><b>${esc(p[1])}</b> · ${GN[p[5]]} · масса ${esc(p[2])} · заряд ${esc(p[3])} · открыт в ${p[4]}</span><br>${esc(p[6])}.</p>`;
}
function atomWire(){
  const A = ATOM;
  hdBody.querySelectorAll("button[data-el]").forEach(b => b.onclick = () => { if (A) A.setEl(b.dataset.el); atomInfo(); });
  hdBody.querySelectorAll("button[data-am]").forEach(b => b.onclick = () => { if (A) A.setMode(b.dataset.am); atomInfo(); });
  hdBody.querySelectorAll("button[data-iso]").forEach(b => b.onclick = () => { if (A) A.setIso(+b.dataset.iso); atomInfo(); });
  const re = $("ckRe"); if (re) re.onclick = () => { if (A){ A.restart(); atomInfo(); } };
  const qp = $("qPull"); if (qp) qp.onclick = () => { if (A) A.pullGo(); };
  const pn = $("qPN"); if (pn) pn.onclick = () => { if (A){ A.pr = !A.pr; atomInfo(); } };
  hdBody.querySelectorAll("button[data-sm]").forEach(b => b.onclick = () => { if (SM_STATE) SM_STATE.set(SM_STATE.sel === +b.dataset.sm ? -1 : +b.dataset.sm); smInfo(); });
}
function renderLevel(L){
  shownLevel = L;
  const v = JL[L]; if (!v) return;
  jrMark("lv", jId + ":" + L, (JOURNEYS[jId].title || ST[jSt].short) + " · " + (v.kind === "kosha" ? DATA.koshas[v.k].name : (v.name || v.short || "")));
  // у веток станции свой заголовок: «Станция V · Юпитер и Европа», а не «… · Солнце»
  const stTag = `${ST[jSt].n} · ${JOURNEYS[jId].title || ST[jSt].short}`;
  $("hdEye").textContent = jKind === "g" ? `Станция ${stTag} · ${DATA.ring[jSt].scale}` : jKind === "e" || jKind === "a" ? `${stTag} · слой ${L + 1} из ${JL.length} · ${v.cat}${v.scale ? " · " + v.scale : ""}` : `${stTag} · слой ${L + 1} из ${JL.length} · ${L < 4 ? "тонкие тела" : L === 4 ? "энергетическая ось" : L < 9 ? "плотное тело" : "микромир · " + v.scale}`;
  let name, sub, h = "";
  if (jKind === "g" && jId === "g4"){
    const sp = solarPanel(L); name = sp.name; sub = sp.sub; hSel = -1; h = sp.html;
    $("hdEye").textContent = sp.eye;
    $("hdHint").textContent = SOLAR && SOLAR.sel >= 0 ? "Курсор оживляет поверхность" : L === 0 ? "Наведите на планету, нажмите — подлетим" : JHINT.g;
  } else if (jId === "bh"){
    name = v.name; sub = v.sub; hSel = -1;
    $("hdEye").textContent = `${stTag} · к центру · слой ${L + 1} из ${JL.length} · ${v.cat}`;
    $("hdHint").textContent = L < JL.length - 1 ? "Листайте — ближе к горизонту" : "Листайте дальше — за горизонт";
    h = `<p class="hd-lead">${esc(v.lead)}</p><p class="mono hd-scale">Масштаб ${esc(v.scale)}</p>` + (v.hint ? `<p class="mono hd-try">${esc(coarse ? v.hint.replace("Наведите на", "Коснитесь").replace("и нажмите", "") : v.hint)}</p>` : "")
      + listHTML("Наука", v.sci) + listHTML("Традиции и философия", v.trad) + `<section><h3>Параллель с человеком</h3><p class="hd-par">${esc(v.par)}</p></section>` + listHTML("Практики", v.prac, "d t")
      + `<p class="note">${mk("t")}<span>Чёрная дыра здесь не нарисована, а рассчитана: каждый пиксель — луч света, прослеженный по уравнениям Эйнштейна. Яркость диска завышена для глаза; традиции говорят о том же рубеже — о пустоте в центре — языком опыта.</span></p>`;
  } else if (jKind === "g" && v.kind === "cym"){
    name = v.name; sub = v.sub; hSel = -1;
    $("hdEye").textContent = `Станция ${stTag} · слой ${L + 1} из ${JL.length} · ${v.scale}`;
    $("hdHint").textContent = v.hint;
    const lf = f => (Math.log(f/CY_FMIN)/Math.log(CY_FMAX/CY_FMIN)*1000).toFixed(0);
    h = `<p class="hd-lead">${esc(v.lead)}</p>
      <section class="slit-ctl"><h3>Опыт</h3>
        <label class="cy-row"><span class="mono">Частота</span><input type="range" id="cyF" min="0" max="1000" step="1" value="${CYM ? lf(CYM.fT) : 500}" aria-label="Частота колебаний пластины"><b id="cyHz" class="mono">—</b></label>
        <p class="mono slit-n" id="cyMode">—</p>
        <div class="slit-row"><button class="btn" id="cyPrev" data-hover>← Резонанс</button><button class="btn" id="cyNext" data-hover>Резонанс →</button><button class="btn" id="cyShake" data-hover>Рассыпать песок</button><button class="btn" id="cyTone" aria-pressed="false" data-hover>Слышать тон</button></div>
      </section>`
      + listHTML("Наука", v.sci) + listHTML("Традиции", v.trad)
      + `<section><h3>Практика</h3><p class="hd-par">${esc(v.prac)}</p></section>`;
  } else if (jKind === "g" && v.kind === "slit"){
    name = v.name; sub = v.sub; hSel = -1;
    $("hdEye").textContent = `Станция ${stTag} · слой ${L + 1} из ${JL.length} · ${v.scale}`;
    $("hdHint").textContent = v.hint;
    const on = SLIT && SLIT.det;
    h = `<p class="hd-lead">${esc(v.lead)}</p>
      <section class="slit-ctl"><h3>Опыт</h3>
        <div class="slit-row"><button class="btn" id="slitDet" aria-pressed="${on}" data-hover>${on ? "Детектор включён — выключить" : "Включить детектор у щелей"}</button>
        <button class="btn" id="slitReset" data-hover>Очистить экран</button></div>
        <p class="mono slit-n">Электронов на экране: <b id="slitN">${SLIT ? SLIT.n : 0}</b></p></section>`
      + listHTML("Наука", v.sci) + listHTML("Традиции", v.trad)
      + `<section><h3>Практика</h3><p class="hd-par">${esc(v.prac)}</p></section>`;
  } else if (jKind === "g" && (v.kind === "orb" || v.kind === "nuc" || v.kind === "qrk" || v.kind === "sm")){
    // слои станций «Атом» и «Кванты» с опытами: пульт опыта, затем наука, традиции, параллель, практика
    name = v.name; sub = v.sub; hSel = -1;
    $("hdEye").textContent = `Станция ${stTag} · слой ${L + 1} из ${JL.length} · ${v.scale}`;
    $("hdHint").textContent = v.hint;
    h = `<p class="hd-lead">${esc(v.lead)}</p><p class="mono hd-scale">Масштаб ${esc(v.scale)}</p><section class="slit-ctl"><h3>Опыт</h3>${atomCtl(v.kind)}</section>`
      + listHTML("Наука", v.sci) + listHTML("Традиции", v.trad)
      + (v.par ? `<section><h3>Параллель с человеком</h3><p class="hd-par">${esc(v.par)}</p></section>` : "")
      + (v.prac ? `<section><h3>Практика</h3><p class="hd-par">${esc(v.prac)}</p></section>` : "")
      + (v.links ? `<section><h3>Связи</h3><div class="hd-fork">${v.links.map(([id, tx]) => `<button data-go="${id}" data-hover><b>${esc(tx)}</b></button>`).join("")}</div></section>` : "");
  } else if (jKind === "g" && (v.kind === "mol" || v.kind === "lan" || v.kind === "body" || v.kind === "dream")){
    name = v.name; sub = v.sub; hSel = -1;
    $("hdEye").textContent = `Станция ${stTag} · слой ${L + 1} из ${JL.length} · ${v.scale}`;
    $("hdHint").textContent = v.hint;
    const pl = v.planet ? PLN.find(x => x.k === v.planet) : null;
    h = `<p class="hd-lead">${esc(v.lead)}</p>` + (pl ? planetFacts(pl) : `<p class="mono hd-scale">${v.kind === "dream" ? "" : "Масштаб "}${esc(v.scale)}</p>`)
      + listHTML("Наука", v.sci) + listHTML("Традиции", v.trad)
      + (v.prac ? `<section><h3>Практика</h3><p class="hd-par">${esc(v.prac)}</p></section>` : "")
      + (pl ? `<p class="note">${mk("s")}<span>Голос планеты: ${esc(PLN_SND_TXT[pl.k])}. Это синтез по характеру сонификаций NASA, а не сама запись.</span></p>` : "");
  } else if (jKind === "g"){
    const r = DATA.ring[jSt]; name = r.name; sub = r.sub; hSel = -1;
    $("hdHint").textContent = JHINT.g;            // подсказка соседнего слоя (Ланиакея, Молекула) не должна залипать
    if (JL.length > 1) $("hdEye").textContent = `Станция ${stTag} · слой ${L + 1} из ${JL.length} · ${DATA.ring[jSt].scale}`;
    h = `<p class="hd-lead">${esc(LEDE[jSt])}</p>` + (jSt === 3 ? `<section class="hd-fork"><h3>Развилка пути</h3><button data-gb="sun" aria-pressed="${galBranch !== "bh"}" data-hover><b>Дальше по кольцу</b><span>Рукав Ориона → Солнце → Земля</span></button><button data-gb="bh" aria-pressed="${galBranch === "bh"}" data-hover><b>К центру — чёрная дыра</b><span>Стрелец A* → горизонт событий → Изнанка</span></button></section>` : "") + listHTML("Традиции", r.trad) + listHTML("Наука", r.sci) + `<section><h3>Практика</h3><p class="hd-par">${esc(r.prac)}</p></section><section><h3>Вопрос</h3><p class="quote" style="font:22px/1.3 var(--display);color:var(--brass);margin:0">${esc(r.q)}</p></section><button class="hd-open" id="hdOpen" data-hover>Таймер практики и дневник станции →</button>`;
  } else if (jKind === "a" && v.kind === "a0"){
    name = v.name; sub = v.sub; hSel = -1; h = "";
  } else if (jKind === "e" || jKind === "a"){
    name = v.name; sub = v.sub; hSel = -1;
    h = `<p class="hd-lead">${esc(v.lead)}</p><p class="mono hd-scale">Масштаб ${esc(v.scale)}</p>` + (v.hint ? `<p class="mono hd-try">${esc(v.hint)}</p>` : "") + (jKind === "e" && JOURNEYS.earth.fork === L ? `<section class="hd-fork"><h3>Развилка пути</h3><button data-br="litho" aria-pressed="${earthBranch === "litho"}" data-hover><b>Литосфера</b><span>Океан, кора, мантия, ядро, железо → станция «Атом»</span></button><button data-br="bio" aria-pressed="${earthBranch === "bio"}" data-hover><b>Биосфера</b><span>Древо жизни → «Человек» → «Клетка» → «Атом»</span></button></section>` : "") + (jKind === "e" && v.bsc != null ? bscPanel(v) : "") + listHTML("Наука", v.sci) + listHTML("Традиции и философия", v.trad) + `<section><h3>Параллель с человеком</h3><p class="hd-par">${esc(v.par)}</p></section>` + listHTML("Практики", v.prac, "d t")  + `<p class="note">${mk("t")}<span>${jKind === "a" ? "Суперсимметрия и великое объединение — теоретические модели; рождение пар и заряды — наблюдаемые факты. Традиции говорят о том же рубеже языком опыта." : "Традиционные и эзотерические «поля» — язык опыта и символа; физические поля измеряются приборами. На карте они показаны рядом, но различаются метками."}</span></p>`;
  } else if (v.kind === "kosha"){
    const k = DATA.koshas[v.k]; name = k.name; sub = k.ru;
    h = `<p class="hd-lead">${esc(k.what)}</p>
      <dl class="facts"><dt>Даосизм</dt><dd>${esc(k.tao)}</dd><dt>Закон Одного</dt><dd>${esc(k.lo)}</dd><dt>Запад</dt><dd>${esc(k.west)}</dd><dt>Наука</dt><dd>${mk(k.sci[0])} ${esc(k.sci[1])}</dd><dt>Практика</dt><dd>${esc(k.prac)}</dd></dl>
      <p class="note">${mk("t")}<span>В классической Веданте Аннамайя — внешняя оболочка, Анандамайя — самая внутренняя, ближе всего к Атману. На карте оболочки показаны как слои поля: чем тоньше тело, тем шире его свечение — поэтому путь идёт от тонкого к плотному.</span></p>`;
    hSel = -1;
  } else if (v.kind === "chakras"){
    name = v.name; sub = v.sub;
    h = `<ol class="hlist">${DATA.centers.map((c, i) => `<li><button data-i="${i}" aria-current="${i === hSel}" data-hover><span class="dotc" style="background:${c.c};box-shadow:0 0 12px ${c.c}"></span><span class="nm">${esc(c.name)}</span><span class="im">${esc(c.i)}</span></button></li>`).join("")}</ol>
      <div class="hdetail" id="hdChakra"></div>`;
  } else {
    name = v.name; sub = v.sub; hSel = -1;
    h = `<p class="hd-lead">${esc(v.lead)}</p>` + (v.kind === "micro" ? `<p class="mono hd-scale">Масштаб ${esc(v.scale)}</p>` : "") + (v.hint ? `<p class="mono hd-try">${esc(coarse ? (v.hintT || v.hint) : v.hint)}</p>` : "") + listHTML("Наука", v.sci) + listHTML("Традиции", v.trad) + listHTML("Практики", v.prac, "d t") + listHTML("Упражнения", v.ex, "d t") + `<p class="note">${mk("h")}<span>${PHYS_NOTE}</span></p>`;
  }
  // ответвление «Сон и сознание» — с тонких тел и центров
  if (jKind === "h" && L <= 4) h += `<section><h3>Ответвление</h3><div class="hd-fork"><button data-go="dream" data-hover><b>Сон и изменённые состояния</b><span>Засыпание · сновидения · осознанный сон · глубокий сон и турия</span></button></div></section>`;
  // «Лестница измерений» — с первого слоя «Абсолюта»: из точки-бинду
  if (jId === "abs" && L === 0) h += `<section><h3>Ответвление</h3><div class="hd-fork"><button data-dims="0" data-hover><b>Лестница измерений</b><span>Из точки — в линию, плоскость, пространство и дальше: 0D → 6D</span></button></div></section>`;
  // v174: со слоя «Океан» — три морских биома Биосферы (фото, существа, приборы)
  if (jKind === "e" && v && v.sea){
    const SB = [["reef", "Тёплое мелководье: кораллы, черепахи, манты, рыбы-клоуны"], ["ocean", "Синяя толща: тунцы, акулы, киты, альбатросы"], ["deep", "Тьма и давление: удильщики, кальмары, рифтии у горячих источников"]];
    const sea = `<section><h3>Морские биомы</h3><div class="hd-fork">` + SB.map(([id, tx]) => { const i = BIO_BIOMES.findIndex(b => b.id === id); return i < 0 ? "" : `<button data-sbm="${i}" data-hover><b>${esc(BIO_BIOMES[i].nm)}</b><span>${esc(tx)}</span></button>`; }).join("") + `</div></section>`;
    // сразу под масштабом, до науки — чтобы кнопки были видны без прокрутки
    const k = h.indexOf('<p class="mono hd-scale">'), e = k < 0 ? -1 : h.indexOf("</p>", k);
    h = e < 0 ? h + sea : h.slice(0, e + 4) + sea + h.slice(e + 4);
  }
  // v175: со слоя «Кора» — в «Пласты камня» Биосферы (колонна 20 эпох)
  if (jKind === "e" && v && v.strata){
    const st = `<section><h3>Летопись в камне</h3><div class="hd-fork"><button data-strata="1" data-hover><b>Пласты камня</b><span>20 слоёв осадочных пород — 4,5 млрд лет истории жизни: от раскалённого гадея до наших дней</span></button></div></section>`;
    const k = h.indexOf('<p class="mono hd-scale">'), e = k < 0 ? -1 : h.indexOf("</p>", k);
    h = e < 0 ? h + st : h.slice(0, e + 4) + st + h.slice(e + 4);
  }
  // голос станции
  { const lk = lvVoiceKey(jId, L), vi = lk ? LV_VOICE[lk] : VOICE_INFO[jSt]; if (vi) h += `<section class="hd-snd"><h3>Что вы слышите${lk ? " · голос слоя" : ""}</h3><p class="hd-par">${mk(vi.m)} <b>${esc(vi.h)}.</b> ${esc(vi.tx)}${$("sound").getAttribute("aria-pressed") === "true" ? "" : " <span class=\"hd-snd-off\">Включите «Музыку», чтобы услышать.</span>"}</p></section>`; }
  { const lk = lvVoiceKey(jId, L); Music.voice(lk ? "lv:" + (lk === "bh" ? "bh:0" : lk) : "st:" + jSt, false); }
  // «Нить мысли»: чьи идеи живут в этом месте кольца
  try {
    const ths = TH_FIG.filter(f => f.go.t === "j" && f.go.id === jId && (f.go.d || 0) === L).sort((a, b) => a.y - b.y);
    if (ths.length) h += `<section class="hd-th"><h3>Нить мысли · идеи этого места</h3><div class="hd-thl">${ths.map(f => `<button data-th="${f.id}" class="${f.b}" data-hover>${esc(f.nm)}</button>`).join("")}</div></section>`;
  } catch(e){}
  chars($("hdName"), name, 0); $("hdSub").textContent = sub;
  hdBody.innerHTML = h;
  hdBody.querySelectorAll("button[data-th]").forEach(b => b.onclick = () => openThought(b.dataset.th)); hdBody.scrollTop = 0;
  hdBody.querySelectorAll("button[data-dims]").forEach(b => b.onclick = () => openDims(+b.dataset.dims));
  hdBody.classList.remove("swap"); void hdBody.offsetWidth; hdBody.classList.add("swap");
  hdBody.querySelectorAll(".hlist button").forEach(b => b.onclick = () => { hSel = hSel === +b.dataset.i ? -1 : +b.dataset.i; stations[6].api.focus("c", hSel); renderChakraDetail(); });
  renderChakraDetail();
  if (jKind === "h") stations[6].api.focus("c", v.kind === "chakras" ? hSel : -1);
  hdBody.querySelectorAll(".hd-fork button[data-br]").forEach(b => b.onclick = () => setBranch(b.dataset.br, L));
  hdBody.querySelectorAll(".hd-fork button[data-gb]").forEach(b => b.onclick = () => {
    galBranch = b.dataset.gb; renderLevel(L); drawDepth(); depthMark();
    if (galBranch === "bh" && !tr && !zm) startTransit(1);           // к центру летим сразу
  });
  const ho = $("hdOpen"); if (ho) ho.onclick = () => openInterior(jSt);
  const cyF = $("cyF");
  if (cyF && CYM){
    const toF = v => CY_FMIN*Math.pow(CY_FMAX/CY_FMIN, v/1000), toV = f => Math.log(f/CY_FMIN)/Math.log(CY_FMAX/CY_FMIN)*1000;
    cyF.oninput = () => CYM.set(toF(+cyF.value));
    CYM.onState = s => { const hz = $("cyHz"), md = $("cyMode"); if (!hz) return;
      hz.textContent = s.f + " Гц";
      md.textContent = s.on ? `Резонанс: мода (${s.n}, ${s.m}) — песок собирается на линиях покоя` : "Между резонансами — пластина почти не колеблется, узора нет";
      if (document.activeElement !== cyF) cyF.value = toV(CYM.fT).toFixed(0); };
    $("cyPrev").onclick = () => CYM.next(-1); $("cyNext").onclick = () => CYM.next(1); $("cyShake").onclick = () => CYM.scatter();
    const tb = $("cyTone"); tb.setAttribute("aria-pressed", String(!!CYM.tone));
    tb.onclick = () => {
      if (CYM.tone){ CYM.tone.osc.stop(); CYM.tone.ctx.close(); CYM.tone = null; tb.setAttribute("aria-pressed", "false"); return; }
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      const ctx = new A(), osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = CYM.f; gain.gain.value = 0; osc.connect(gain).connect(ctx.destination); osc.start();
      CYM.tone = { ctx, osc, gain }; tb.setAttribute("aria-pressed", "true"); };
  }
  if (ATOM) ATOM.onTick = $("atInfo") || $("atMode") || $("qR") ? () => atomInfo() : null;
  atomWire(); atomInfo(); smInfo();
  const sd = $("slitDet");
  if (sd && SLIT){
    SLIT.onCount = n => { const e = $("slitN"); if (e) e.textContent = n; };
    sd.onclick = () => { SLIT.setDet(!SLIT.det); sd.setAttribute("aria-pressed", String(SLIT.det)); sd.textContent = SLIT.det ? "Детектор включён — выключить" : "Включить детектор у щелей"; };
    $("slitReset").onclick = () => SLIT.reset();
  }
  const sb = $("solBack"); if (sb) sb.onclick = () => solarSelect(-1);
  hdBody.querySelectorAll("#solList button").forEach(bt => bt.onclick = () => solarSelect(+bt.dataset.p));
  hdBody.querySelectorAll("button[data-go]").forEach(bt => bt.onclick = () => jGo(bt.dataset.go));
  hdBody.querySelectorAll("button[data-tree]").forEach(bt => bt.onclick = () => openTree());
  hdBody.querySelectorAll("button[data-biob]").forEach(bt => bt.onclick = () => { closeHuman(); openBio(); });
  hdBody.querySelectorAll("button[data-sbm]").forEach(bt => bt.onclick = () => RT.go({ t:"bio", bm:+bt.dataset.sbm }));
  hdBody.querySelectorAll("button[data-strata]").forEach(bt => bt.onclick = () => RT.go({ t:"bio" }));
  if (typeof BSC !== "undefined"){
    hdBody.querySelectorAll("button[data-bsctree]").forEach(bt => bt.onclick = () => BSC.setTol(!BSC.tol));
    hdBody.querySelectorAll("button[data-bscgo]").forEach(bt => bt.onclick = () => bt.dataset.bscgo === "strata" ? BSC.goStrata() : BSC.goHuman());
    hdBody.querySelectorAll("button[data-bscm]").forEach(bt => bt.onclick = () => bscMech(bt.dataset.bscm));
    BSC.setTol(BSC.tol); BSC.co2();
  }
  const up = $("hdUp"), dn = $("hdDown");
  up.disabled = false; dn.disabled = false;
  up.textContent = SOLAR && SOLAR.sel >= 0 && jId === "g4" ? "↑ Вся система"
                 : L > 0 ? `↑ ${lvlName(L - 1)}` : `↑ ${jPrevId() === "g4" && JOURNEYS[jId].title ? "Солнечная система" : ST[JOURNEYS[jPrevId()].st].short}`;
  dn.textContent = L < JL.length - 1 ? `${lvlName(L + 1)} ↓` : jId === "bh" ? "За горизонт ↓" : `Вглубь: ${jNextName()} ↓`;
}
// выбор тела на станции V: карточка + подлёт. Тот же вызов и на клик по планете, и на кнопки панели
function solarSelect(i){
  if (!SOLAR || SOLAR.sel === i) return;
  SOLAR.sel = i;
  Music.planet(i >= 0 ? PLN_SND[i === 8 ? "bel" : PLN[i].k] : null);
  if (i >= 0) Music.hover();
  renderLevel(Math.max(0, Math.round(depth)));
}
const solarOn = () => !!SOLAR && humanOpen && jKind === "g" && jId === "g4";
$("hdUp").onclick = () => { if (solarOn() && SOLAR.sel >= 0){ solarSelect(-1); return; } depthT = clamp(Math.round(depthT) - 1, -1, DMAX); lastDepthInput = performance.now(); };
$("hdDown").onclick = () => { if (solarOn() && SOLAR.sel >= 0) solarSelect(-1); depthT = clamp(Math.round(depthT) + 1, -1, DMAX); lastDepthInput = performance.now(); };

// слой «Биосфера» в фотореализме (bsc.js): дыхание леса, Древо жизни на кроне, развилка у корней
const BSC_BRANCH = `<section class="hd-fork"><h3>Ответвление</h3><button data-tree="1" data-hover><b>Древо жизни</b><span>4 млрд лет родства: от LUCA через растения, грибы и животных — к человеку</span></button><button data-biob="1" data-hover><b>Биосфера — учебник жизни</b><span>Пласты камня: 20 эпох и больше 140 существ, механизмы эволюции, основы биологии и биомы Земли</span></button></section>`;
function bscMech(x){ const [k, id] = x.split(":"), d = Math.round(Math.max(7, Math.min(10, depth))); closeHuman(); openBio(undefined, () => BIO.mechAt(id, k, { t:"bsc", d })); }
function bscPanel(v){
  let h = "";
  if (v.bsc === 0) h += `<section class="bsc-co2" id="bscCO2"><h3>Дыхание леса · сейчас</h3><div class="bsc-co2-bars"><span class="mono">фотосинтез</span><i><b class="bsc-co2-p"></b></i><span class="mono">дыхание</span><i><b class="bsc-co2-r"></b></i></div><p class="hd-par bsc-co2-t"></p><p class="mono hd-try">Двигайте «время суток» справа вверху</p></section>`
    + `<section class="hd-fork"><h3>Знание поверх материи</h3><button data-bsctree="1" aria-pressed="false" data-hover><b>Показать Древо жизни на кроне</b><span>Золотая схема родства на ветвях: бактерии, археи, эукариоты → растения, грибы, животные → человек (упрощено ◐)</span></button></section>`;
  if (v.bioFork) h += `<section class="hd-fork"><h3>Развилка пути</h3><button data-bscgo="strata" data-hover><b>Вниз в прошлое</b><span>Почва темнеет до камня, зажигается фонарь геолога — и 20 пластов: 4,5 млрд лет истории жизни</span></button><button data-bscgo="human" data-hover><b>Хлорофилл → гем — к Человеку</b><span>Магний меняется на железо: молекула света становится молекулой крови. Дальше — станция «Человек»</span></button></section>`;
  const HERE = [["mech:sex", "mech:symb", "basics:photo", "basics:cell"], ["mech:moth", "mech:coev", "mech:drift"], ["basics:pyr", "basics:cycle"], ["basics:cycle"]][v.bsc] || [];
  if (HERE.length) h += `<section class="hd-fork"><h3>⚙ Опыты здесь · журнал натуралиста</h3>${HERE.map(x => { const [k, id] = x.split(":"), M = (k === "basics" ? BIO_BASICS : BIO_MECH).find(m => m.id === id);
    return M ? `<button data-bscm="${x}" data-hover><b>${esc(M.nm)}</b><span>${esc(M.sub)}</span></button>` : ""; }).join("")}</section>`;
  if (v.bsc === 0 || v.bioFork) h += BSC_BRANCH;
  return h;
}
function setBranch(b, L){ earthBranch = b; if (jKind === "e"){ JL = JOURNEYS.earth.levels(); DMAX = JL.length; drawDepth(); renderLevel(L ?? Math.max(0, Math.round(depth))); depthMark(); } }
const JHINT = { h:"Листайте над фигурой — глубже", e:"Листайте над планетой — глубже", a:"Листайте или коснитесь света — глубже", g:"Листайте — вглубь, к следующей станции" };
function setJourney(id){
  if (SOLAR){ SOLAR.sel = -1; Music.planet(id === "jup" ? PLN_SND.jup : null); }   // в ветке Юпитера звучит его голос
  jId = id; const jj = JOURNEYS[id]; jKind = jj.kind; jSt = jj.st; JL = jj.levels(); DMAX = JL.length;
  chHuman.setAttribute("aria-label", "Погружение · " + ST[jSt].name);
  $("hdHint").textContent = id === "bh" ? "Листайте — ближе к горизонту" : JHINT[jKind];
}
function syncBtns(){ $("btnHuman").setAttribute("aria-pressed", String(humanOpen && jKind === "h")); $("btnEarth").setAttribute("aria-pressed", String(humanOpen && jKind === "e")); }
function openJourney(id){
  if (humanOpen && jId === id) return;
  if (tr || zm) return;
  if (humanOpen){ toggleMenu(false); flashTo(id, 0); return; }
  closeSide(); surface();
  jHist = [];
  setJourney(id); goTo(jSt);
  // прямой вход в главу — с её «лицевого» слоя: у Галактики это сам диск, а не Ланиакея над ним
  humanOpen = true; hSel = -1; depth = depthT = JOURNEYS[id].start || 0; shownLevel = -1;
  stations[6].api.focus("c", -1);
  chHuman.classList.add("open"); chHuman.setAttribute("aria-hidden","false"); syncBtns();
  requestAnimationFrame(() => { drawDepth(); renderLevel(Math.round(depth)); depthMark(); });
  if (kbUser) $("hBack").focus({preventScroll:true});
  Music.dive();
}
const openEarth = () => openJourney("earth"), openHuman = () => openJourney("human");
function closeHuman(){ if (!humanOpen) return; if (SOLAR){ SOLAR.sel = -1; Music.planet(null); } humanOpen = false; jHist = []; zoomEnd(); if (tr){ tr = null; $("loopFx").style.opacity = "0"; } chHuman.classList.remove("open"); chHuman.setAttribute("aria-hidden","true"); syncBtns(); stations[6].api.focus("c", -1); Music.om(false); Music.surface(); if (shown >= 0) Music.voice("st:" + shown, false); }
// переход вглубь следующей станции (dir = 1) или назад по пройденному пути (dir = −1)
// переход вглубь в ответвление (Луна, Юпитер) — как обычный шаг вперёд по пути, со вспышкой
// куда вернуться из ветки: глубина, на которой из неё ушли (иначе назад из Луны — сразу к ядру Земли)
const JRET = {};
function jGo(id){
  if (tr || zm || !JOURNEYS[id] || jId === id) return;
  JRET[jId] = Math.max(0, Math.round(depth));
  // выбор планеты не сбрасываем здесь: крупный план держится под вспышкой, сброс — при подмене (setJourney)
  flashTo(id, 1);
}
function startTransit(dir){
  const to = dir > 0 ? JOURNEYS[jId].next() : jPrevId();
  if (!to) return;
  if (to === "iz"){ bhDiveStart(); return; }
  // v183: Луна, открытая с Земли: назад со слоя «Луна» — обратным полётом на тот же слой Земли;
  // дальше с последнего слоя («↓ Земля») — тоже на тот слой Земли, с которого улетели (вспышкой: Луны в кадре уже нет)
  if (jId === "moon" && to === "earth" && jHist[jHist.length - 1] === "earth" && JRET.earth != null){ flashTo("earth", -1); return; }
  // для зум-пар вместо вспышки — натуральный пролёт камеры внутрь (см. ZOOM_PAIRS)
  if (zoomPair(jId, to)) startZoom(to, dir); else flashTo(to, dir);
}
// Пары станций, у которых переход сделан как «перетекание» одной абстракции в другую, а не смена кадра.
// Обе станции пары умеют растворяться в ОДНО И ТО ЖЕ общее состояние — изотропную сферу рассеянного света
// («первичное рассеяние»: недифференцированный свет до формы). Уходящая растворяется в ней, пока вспышка
// нарастает; приходящая собирается из неё, пока вспышка гаснет. Подмена станции приходится ровно на кадр,
// где обе фигуры выглядят одинаково, — поэтому шва не видно.
// Пара, у которой переход сделан растворением, а не сменой кадра: последний слой Земли — это уже
// атом железа, и станция «Атом» — тот же атом. Вспышке тут взяться неоткуда, картинка просто
// перетекает в себя же. Фон (звёзды и астролябия) на секунду гаснет — иначе было бы видно, как
// камера переезжает по кольцу на три станции, а это единственное, что в этом переходе разрывно.
const SOFT_PAIRS = [["earth", "g8"]];
const softPair = (a, b) => SOFT_PAIRS.some(p => (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b));
const SOFT_ST = 8;
function softEnd(){
  const st = stations[SOFT_ST];
  st.g.position.set(Math.sin(SOFT_ST/N*TAU)*R, 3.4, -Math.cos(SOFT_ST/N*TAU)*R);
  st.g.lookAt(0, 3.4, 0);
  zStar(0, 1);
}
const MORPH_PAIRS = [["g1", "g2"]];
const morphPair = (a, b) => MORPH_PAIRS.some(p => (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b));
// Станции, чьи системы частиц понимают uProg как «насколько я растворена» (0 — своя форма, 1 — общая сфера)
const MORPH_ST = new Set([1, 2]);
// Механизм намеренно не знает направления: каждая станция знает только степень собственного растворения,
// поэтому анимация работает одинаково в обе стороны — вперёд и назад по пути.
function stDissolve(i){
  if (!tr || !tr.morph || i !== jSt) return 0;
  return tr.jumped ? 1 - smooth(.62, 2.05, tr.t) : smooth(.02, .58, tr.t);
}
// станция «Атом» встречает тем элементом, из которого мы в неё пришли: из молекулы — углеродом,
// из ядра Земли — железом
function atomArrive(to){ if (to === "g8" && ATOM && (jId === "earth" || jId === "g7")) ATOM.setEl(jId === "earth" ? "Fe" : "C", true); }
function flashTo(to, dir){
  atomArrive(to);
  const soft = softPair(jId, to);
  // человек ↔ сон: одна станция, без вспышки — фигура сама рассыпается и собирается (dream.js)
  const dreamTr = (jId === "human" && to === "dream") || (jId === "dream" && to === "human");
  // v173: Триединство ↔ Первоимпульс — без вспышки: треугольник сам перестраивается в узел (и обратно)
  const triTr = (jId === "abs" && to === "g1") || (jId === "g1" && to === "abs");
  if (triTr && typeof ABS !== "undefined") ABS.noFlash();
  // v183: Земля ↔ Луна — полёт без вспышки (213-moon-flight.js): назад — только со слоя «Луна», где она в кадре
  const mf = (jId === "earth" && to === "moon" && dir > 0) || (jId === "moon" && to === "earth" && dir < 0 && depth < .5);
  tr = { t:0, dir, to, from:jId, jumped:false, morph: morphPair(jId, to), soft, dreamTr, tri: triTr, mf, d0: Math.min(0, depth),
         // глубина, на которой сцену Земли держат во время растворения. Назад мы приходим со стороны
         // «Атома», и depth там уже ушёл в минус — брать его нельзя, иначе Земля проступит глобусом
         eD: dir < 0 ? 15.2 : Math.min(Math.max(0, depth), 15.9), fe: dir > 0 ? 1 : 0, fg: dir > 0 ? 0 : 1, dip: 1 };
  if (mf) MF.begin();
  if (!soft && !dreamTr && !triTr && !mf){
    const c = FXC[JOURNEYS[to].st], fx = $("loopFx"), at = W < 760 ? "50% 28%" : "62% 50%";
    fx.style.background = to === "abs" ? "#fffdf8" : `radial-gradient(circle at ${at},rgba(255,250,240,.97),${c} 32%,rgba(20,18,40,.55) 70%,rgba(5,6,12,.35) 100%)`;
  }
  Music.portal(dir > 0);
}
function jumpRing(st, dir){
  const u = uOfStation(st), r = Math.round(pos < 0 ? 0 : pos); let v = r - mod(r, 14) + u;
  if (dir > 0 && v < r) v += 14; if (dir < 0 && v > r) v -= 14; if (v < 0) v += 14;
  pos = target = v; vel = 0; travel = false; lastInput = performance.now();
}
function transitTick(dt, now){
  if (!tr) return;
  tr.t += dt;
  const TJ = tr.mf ? MF.TJ(tr.dir) : tr.tri ? (tr.dir > 0 ? .2 : 1.85) : tr.dreamTr ? .05 : tr.soft ? .45 : .6;
  if (!tr.jumped && tr.t > TJ){
    tr.jumped = true;
    if (tr.dir > 0) jHist.push(jId); else if (tr.dir < 0) jHist.pop(); else jHist = [];
    // фиксируем момент входа в «Первоимпульс» — на нём строится анимация «рождения из точки»,
    // которая раскрывается ровно пока угасает вспышка перехода (см. ниже, lo). Только для прихода
    // из «Абсолюта»: при возврате из «Вселенной» работает морф-растворение (tr.morph), и две анимации
    // рождения не должны накладываться друг на друга
    if (tr.to === "g1" && !tr.morph) g1EmergeT0 = tr.tri ? -1 : T;
    setJourney(tr.to);
    // dir 0 — это прямой вход в главу (из меню или подлётом к Земле): начинать надо с первого слоя,
    // а не с последнего; назад (dir < 0) — наоборот, с последнего
    // назад из ветки (Луна, Юпитер) — на слой «Солнечная система», а не в ядро Солнца
    depth = depthT = tr.dir < 0 ? (tr.from === "moon" || tr.from === "jup" || tr.from === "dream" ? Math.min(DMAX - 1, JRET[tr.to] || 0) : DMAX - 1) : tr.dir > 0 ? 0 : (JOURNEYS[tr.to].start || 0);
    // полёт к Луне: она ещё вдали (слой 0 «на подходе»), дальше подлёт доводит глубину до 0 (MF.tick)
    if (tr.mf && tr.dir > 0){ depth = -MF.D_FAR; depthT = 0; }
    shownLevel = -1; hSel = -1; lastDepthInput = now;
    stations[6].api.focus("c", -1);
    jumpRing(jSt, tr.dir || 1);
    drawDepth(); renderLevel(Math.max(0, Math.round(depth))); depthMark(); syncBtns();
    if (tr.mf) MF.jumped();
    Music.end();
  }
  if (tr.soft){
    // после подмены обе картинки секунду живут одновременно и перетекают друг в друга
    const u = Math.max(0, tr.t - TJ), out = 1 - smooth(.30, 1.05, u), inn = smooth(.05, .98, u);
    tr.fe = tr.dir > 0 ? (tr.jumped ? out : 1) : (tr.jumped ? inn : 0);
    tr.fg = tr.dir > 0 ? (tr.jumped ? inn : 0) : (tr.jumped ? out : 1);
    tr.dip = 1 - .94*smooth(0, .28, tr.t)*(1 - smooth(1.6, 2.3, tr.t));
  }
  if (tr.mf) MF.tick();
  const lo = tr.soft || tr.dreamTr || tr.tri || tr.mf ? 0 : (tr.t < .6 ? smooth(0, .6, tr.t) : 1 - smooth(.75, 2.2, tr.t));
  $("loopFx").style.opacity = String(lo);
  if (tr.t > (tr.mf ? MF.DUR : tr.tri ? (tr.dir > 0 ? 3.1 : 2.1) : tr.dreamTr ? .4 : tr.soft ? 2.4 : 2.2)){ if (tr.soft) softEnd(); if (tr.mf) MF.end(); tr = null; $("loopFx").style.opacity = "0"; }
}
