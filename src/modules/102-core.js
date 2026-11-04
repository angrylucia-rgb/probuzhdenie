// v164: силуэт для облака частиц построен по собственному рисунку Люсии (REFIMG.body), а не по стороннему силуэту
const MASK = "AAAAAAAAAAAAAfgAAAAAAAAAAAAAAAAAAAAAAAAAf/AAAAAAAAAAAAAAAAAAAAAAAAAf/4AAAAAAAAAAAAAAAAAAAAAAAAP//gAAAAAAAAAAAAAAAAAAAAAAAP//8AAAAAAAAAAAAAAAAAAAAAAAD///gAAAAAAAAAAAAAAAAAAAAAAB///4AAAAAAAAAAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAAAAAAAAAAAAA////gAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAAAAAAAAAAAAAAH///+AAAAAAAAAAAAAAAAAAAAAAB////gAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAAAAAAAAAAAAAAH///+AAAAAAAAAAAAAAAAAAAAAAB////gAAAAAAAAAAAAAAAAAAAAAA////6AAAAAAAAAAAAAAAAAAAAAAf////gAAAAAAAAAAAAAAAAAAAAAH////4AAAAAAAAAAAAAAAAAAAAAB////+AAAAAAAAAAAAAAAAAAAAAAf////gAAAAAAAAAAAAAAAAAAAAAD////wAAAAAAAAAAAAAAAAAAAAAA////8AAAAAAAAAAAAAAAAAAAAAAP////AAAAAAAAAAAAAAAAAAAAAAB////gAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAAAAAAAAAAAAAAB///4AAAAAAAAAAAAAAAAAAAAAAAP//+AAAAAAAAAAAAAAAAAAAAAAAD///gAAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAAAAAAAAAAAAAAP//8AAAAAAAAAAAAAAAAAAAAAAAD///AAAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAAAAAAAAAAAAAAP//8AAAAAAAAAAAAAAAAAAAAAAAD///AAAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAAAAAAAAAAAAAAP//8AAAAAAAAAAAAAAAAAAAAAAAD///AAAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAAAAAAAAAAAAAAP//+AAAAAAAAAAAAAAAAAAAAAAAH///wAAAAAAAAAAAAAAAAAAAAAAH///+AAAAAAAAAAAAAAAAAAAAAAD////4AAAAAAAAAAAAAAAAAAAAAD/////gAAAAAAAAAAAAAAAAAAAAH/////+AAAAAAAAAAAAAAAAAAAAH//////8AAAAAAAAAAAAAAAAAAAH///////wAAAAAAAAAAAAAAAAAAH////////AAAAAAAAAAAAAAAAAAH////////+AAAAAAAAAAAAAAAAAP/////////4AAAAAAAAAAAAAAAAP//////////gAAAAAAAAAAAAAAAH//////////8AAAAAAAAAAAAAAAD///////////gAAAAAAAAAAAAAAB///////////4AAAAAAAAAAAAAAAf///////////AAAAAAAAAAAAAAAP///////////wAAAAAAAAAAAAAAD///////////8AAAAAAAAAAAAAAA////////////gAAAAAAAAAAAAAAf///////////4AAAAAAAAAAAAAAH///////////+AAAAAAAAAAAAAAB////////////wAAAAAAAAAAAAAAf///////////8AAAAAAAAAAAAAAP////////////AAAAAAAAAAAAAAD////////////wAAAAAAAAAAAAAA////////////8AAAAAAAAAAAAAAP////////////AAAAAAAAAAAAAAD////////////wAAAAAAAAAAAAAA////////////8AAAAAAAAAAAAAAP////////////AAAAAAAAAAAAAAD////////////wAAAAAAAAAAAAAA////////////8AAAAAAAAAAAAAAH////////////AAAAAAAAAAAAAAB////////////wAAAAAAAAAAAAAA////////////8AAAAAAAAAAAAAAP////////////AAAAAAAAAAAAAAD////////////wAAAAAAAAAAAAAA////////////+AAAAAAAAAAAAAAP////////////gAAAAAAAAAAAAAH////////////4AAAAAAAAAAAAAB////////////+AAAAAAAAAAAAAAf////////////gAAAAAAAAAAAAAH////////////4AAAAAAAAAAAAAB////////////+AAAAAAAAAAAAAAf////////////gAAAAAAAAAAAAAH////////////4AAAAAAAAAAAAAB////////////+AAAAAAAAAAAAAAf/7///////8//gAAAAAAAAAAAAAH/+////////P/4AAAAAAAAAAAAAB//n///////z/+AAAAAAAAAAAAAAf/x///////4//gAAAAAAAAAAAAAH/8f//////+P/4AAAAAAAAAAAAAB//D///////j//AAAAAAAAAAAAAAf/w///////4f/wAAAAAAAAAAAAAH/8P//////+H/8AAAAAAAAAAAAAD/+D///////B//AAAAAAAAAAAAAA//g///////wf/wAAAAAAAAAAAAAP/4P//////8H/+AAAAAAAAAAAAAH/+B///////A//gAAAAAAAAAAAAB//gf//////wP/8AAAAAAAAAAAAA//4H//////8D//AAAAAAAAAAAAAP/+B///////A//wAAAAAAAAAAAAD//gf//////wP/+AAAAAAAAAAAAA//4H//////8D//gAAAAAAAAAAAAf/+B///////A//4AAAAAAAAAAAAH//Af//////wP/+AAAAAAAAAAAAB//wH//////8D//gAAAAAAAAAAAAf/8B///////A//8AAAAAAAAAAAAH//A///////wH//AAAAAAAAAAAAB//wP//////+B//wAAAAAAAAAAAA//4D///////gf/8AAAAAAAAAAAAP/+A///////4H//AAAAAAAAAAAAD//gP//////+A//wAAAAAAAAAAAA//4D///////gP/8AAAAAAAAAAAAP/8A///////4D//AAAAAAAAAAAAD//AP//////+A//wAAAAAAAAAAAA//wD///////gH/+AAAAAAAAAAAAP/8A///////4B//gAAAAAAAAAAAD/+AP//////+Af/4AAAAAAAAAAAA//gH///////gD/+AAAAAAAAAAAAP/4B///////8A//gAAAAAAAAAAAD/8Af///////AP/4AAAAAAAAAAAA//AP///////wB/+AAAAAAAAAAAAP/wD///////+Af/gAAAAAAAAAAAD/4B////////gD/4AAAAAAAAAAAB/+Af///////4A/+AAAAAAAAAAAAf/AH////////AP/gAAAAAAAAAAAH/wH////////4B/4AAAAAAAAAAAB//////////////+AAAAAAAAAAAAf//////////////gAAAAAAAAAAAf///////////////AAAAAAAAAAA/////////////////AAAAAAAAAB/////////////////+AAAAAAAAD//////////////////4AAAAAAAH///////////////////wAAAAAAH////////////////////gAAAAAH////////////////////+AAAAAH/////////////////////4AAAAH//////////////////////AAAAD//////////////////////4AAAB///////////////////////AAAA///////////////////////4AAAP///////////////////////AAAH///////////////////////wAAB///////////////////////8AAAf///////////////////////gAAP///////////////////////4AAD///////////////////////+AAA////////////////////////gAAP///////////////////////4AAD///////////////////////+AAA////////////////////////gAAH///////////////////////4AAB///////////////////////8AAAf///////////////////////AAAD///////////////////////wAAAf////////w/////////////4AAAD////////AB////////////8AAAAf//////+AAD///////////8AAAAB//////4AAAP//////////8AAAAAD////+AAAAAf/////////8AAAAAAAAAAAAAAAAA/////////wAAAAAAAAAAAAAAAAAAAAP////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", MS = 164;
const BODYMETA = {"cx410": 206.59, "chakra": [342.8, 296.8, 223.0, 173.8, 108.2, 36.1, 4.9]};
const ST = DATA.ring;
const LEDE = [
 "Всё начинается с Единого. У Него нет формы, масштаба и имени.",
 "Единое различает себя: свобода — любовь — свет. Из этой тройки рождается всё.",
 "Пространство всех возможностей. Видимое вещество — лишь около пяти процентов.",
 "Спираль из сотен миллиардов звёзд. Каждое солнце — фокус общего разума.",
 "Звезда-кузница: углерод и железо твоего тела родились в таком огне.",
 "Живая планета учится у огня, воды и ветра. Здесь начинается рост к свету.",
 "Середина всех масштабов. Здесь нисхождение становится восхождением.",
 "Тридцать семь триллионов клеток — вселенная внутри тебя.",
 "Ядро в сто тысяч раз меньше атома. Электрон — облако вероятности, а не планета.",
 "Частица — волна поля. Запутанные частицы связаны, пока их не потревожит среда.",
 "Пустота, которая кипит: поля колеблются даже в полном покое.",
 "Форма есть пустота, пустота есть форма. Отсюда — обратно в Единое."
];
const PORTALS = [
 { eye:"Переход · макрокосм → микрокосм", title:"Вовнутрь",
   text:"Человек — середина масштабов. Дальше путь идёт не вовне, а внутрь: сквозь органы, ткани и клетки — к молекуле жизни.",
   note:["s","Каждый шаг — в десять раз меньше предыдущего"], from:0, to:-6, tint:"#1c0f2c" },
 { eye:"Переход · микрокосм → макрокосм", title:"Уроборос",
   text:"На планковском масштабе мельчайшее встречается с рождением Вселенной. Змей кусает свой хвост — и круг возвращается к Единому.",
   note:["h","Космический уроборос — образ Примака и Абрамс; квантовая гравитация пока не построена"], from:-35, to:27, tint:"#2a1f0c" }
];
const TINT = ["#3a2c12","#2a1b3e","#0f1a3c","#17153d","#3c1a0a","#0a2635","#12291f","#321028","#0a2b31","#201138","#0a1328","#0a0910"];
const EXP = [30,28,26.9,21,9.1,7.1,0.2,-5,-10,-18,-34.8,-38];
// тоники станций — по кругу квинт: C G D A E B F♯ C♯ G♯ D♯ A♯ F; кольцо замыкается на «Абсолюте» (выбор музыкальный, ○)
const NOTES = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5].map(s => 130.81*Math.pow(2, (s >= 7 ? s - 12 : s)/12));
// что звучит на станции: метка достоверности и короткое объяснение (панель станции, панель погружения, «Звуки кольца»)
const VOICE_INFO = [
  { m:"t", h:"Тишина и Ом", tx:"Тишина и слог Ом. Это символ, а не звук «из данных»: у Абсолюта нет частоты." },
  { m:"s", h:"Тон пластины Хладни", tx:"Тон резонирующей пластины и медленные биения соседней моды — та самая вибрация, что рисует узоры из песка." },
  { m:"s", h:"«Звук Большого взрыва»", tx:"Шум и нисходящий аккорд с отношениями частот 1 : 2,45 : 3,68 — как у пиков реликтового излучения (ℓ ≈ 220, 540, 810), поднятых примерно на 50 октав. По мотивам сонификации Марка Уиттла." },
  { m:"h", h:"Искры центра Галактики", tx:"Искры сканируют небо слева направо: яркость → громкость, высота → тон. Синтез по мотивам сонификации центра Галактики (NASA Chandra, 2020), а не сама запись." },
  { m:"s", h:"Гул колеблющегося Солнца", tx:"Девять близких тонов с биениями — пятиминутные колебания Солнца (≈ 3 мГц, шаг мод ≈ 135 мкГц), ускоренные примерно в 40 000 раз. Так звучит гелиосейсмология (SOHO)." },
  { m:"s", h:"Радио Земли и пульс Шумана", tx:"Свисты-вистлеры и «утренний хор» — естественное радиоизлучение Земли, которое лежит прямо в звуковом диапазоне. Тон пульсирует с частотой шумановского резонанса 7,83 Гц." },
  { m:"s", h:"Сердце и дыхание", tx:"Удары сердца около 60 в минуту и волна дыхания 6 раз в минуту (0,1 Гц) — ритм практики «дыхание сердца», при котором растёт вариабельность сердечного ритма." },
  { m:"h", h:"Гул клетки и мотив кодонов", tx:"Тонкий гул около 1,6 кГц — так колебалась стенка дрожжевой клетки в опыте Гимжевски (2004; одно исследование, спорное). Мелодия при прибытии — кодоны ДНК, переведённые в ноты; правило перевода произвольное (○)." },
  { m:"s", h:"Аккорд водорода", tx:"Четыре линии серии Бальмера — 656,3; 486,1; 434,0 и 410,2 нм. Отношения их частот 1 : 1,350 : 1,512 : 1,600 перенесены в слышимый аккорд." },
  { m:"s", h:"Щелчки детектора", tx:"Щелчки в случайные моменты, как у счётчика частиц: по закону Пуассона, в среднем около двух в секунду. Предсказать следующий нельзя — можно только вероятность." },
  { m:"t", h:"Шум вакуума", tx:"Шум с плывущим фильтром — символ квантовых флуктуаций. Настоящие флуктуации вакуума не слышны." },
  { m:"t", h:"Почти тишина", tx:"Один далёкий удар колокола. Пустота — не звук, а пространство, в котором звук возможен." }
];
// голоса ключевых слоёв: jId:L → метка, заголовок и пояснение (для чёрной дыры — вся ветка, ключ "bh")
const LV_VOICE = {
  "g4:11": { m:"h", h:"Гул ядра Солнца", tx:"Очень низкий пульсирующий гул — образ g-мод, колебаний самой глубины Солнца с периодами в часы. Их ищут десятилетиями, и надёжно они не обнаружены." },
  "earth:2": { m:"s", h:"Хор магнитосферы", tx:"Восходящие чириканья — «хоровые» волны в радиационных поясах Земли. Зонды Van Allen записали их, и они лежат прямо в звуковом диапазоне: здесь — синтез по их характеру." },
  "earth:4": { m:"s", h:"Аккорд Шумана", tx:"Пять шумановских резонансов — 7,83 · 14,3 · 20,8 · 27,3 · 33,8 Гц — подняты на 4 октавы и звучат аккордом с настоящими отношениями; основной резонанс остаётся пульсом." },
  "bh": { m:"s", h:"Си-бемоль чёрной дыры", tx:"Волны давления, которые чёрная дыра в скоплении галактик Персея гонит через горячий газ, — это си-бемоль на 57 октав ниже до первой октавы (Chandra, 2003). Здесь он поднят обратно. Честно: это голос другой чёрной дыры, не Стрельца A*." },
  "moon:2": { m:"s", h:"Дыхание приливов", tx:"Два прилива в сутки: период 12 часов 25 минут сжат до 12,4 секунды — шум волны нарастает и отступает." },
  "jup:0": { m:"h", h:"Радиоголос Юпитера", tx:"Свисты и шорохи — по характеру декаметрового радиоизлучения Юпитера, которое записывали «Вояджеры» и «Юнона». Синтез по мотивам, не сама запись." },
  "human:7": { m:"s", h:"Сердце крупным планом", tx:"Около 60 ударов в минуту: «тук» — закрываются клапаны между предсердиями и желудочками, «тук» — клапаны аорты и лёгочной артерии." },
  "human:10": { m:"s", h:"Щелчки нейронов", tx:"Потенциалы действия, пропущенные через динамик, звучат щелчками и очередями — так нейрофизиологи со времён Хьюбела и Визела слушают отдельные клетки." },
  "g7:1": { m:"s", h:"Колебания воды", tx:"Три собственных колебания молекулы воды — 1595, 3657 и 3756 см⁻¹ (около 10¹⁴ Гц) — опущены примерно на 40 октав и звучат аккордом с настоящими отношениями." },
  "g8:1": { m:"s", h:"Счётчик Гейгера", tx:"Каждый щелчок — один распад: моменты случайны, предсказать следующий нельзя, но в среднем их число постоянно. Так звучит радиоактивность в природе — например, калий-40 в граните или в нашем теле." },
  "g9:2": { m:"s", h:"Частицы падают на экран", tx:"Каждый щелчок — одна частица; высота тона — место попадания, выпавшее случайно, но по картине интерференции. Со временем слышно, что одни высоты повторяются чаще — это полосы." },
  "dream:0": { m:"s", h:"Альфа уступает тете", tx:"Тон пульсирует то с частотой альфа-ритма (10 Гц), то тета-ритма (6 Гц) — так меняется ЭЭГ при засыпании." },
  "dream:1": { m:"t", h:"Всплески образов", tx:"Неровные тихие звоны — образ быстрого сна, когда мозг активен почти как днём, а тело неподвижно." },
  "dream:2": { m:"t", h:"Всплески образов", tx:"Неровные тихие звоны — образ быстрого сна, в котором вспыхнула ясность." },
  "dream:3": { m:"s", h:"Дельта-волны", tx:"Медленная пульсация около 1 раза в секунду — дельта-ритм глубокого сна." }
};
const lvVoiceKey = (jid, L) => jid === "bh" ? "bh" : LV_VOICE[jid + ":" + L] ? jid + ":" + L : null;
// серия Бальмера водорода: Hα 656,3, Hβ 486,1, Hγ 434,0, Hδ 410,2 нм → отношения частот
const BALMER = [656.3, 486.1, 434.0, 410.2].map(l => 656.3/l);
const STAGE_ST = [6,0,1,3,6,7,10,0];
// сила и радиус отклика частиц на курсор: + отталкивание, − притяжение (атом «схлопывается» при наблюдении)
const PUSH = [.6,.5,.45,.45,.7,.35,-.3,.55,-1.2,.15,.8,-.6];
const RAD  = [2.2,2.0,2.2,2.4,2.0,1.8,1.4,1.6,2.8,2.2,2.0,2.2];
// Видимый габарит объекта станции при inner.scale = 1: [полуширина, полувысота] в мировых единицах,
// измерено по кадру вместе с ореолом bloom и подписями. Объекты рисовались крупнее кадра (камера в
// режиме погружения стоит в 7,6 — это ±3,4 по вертикали), поэтому вылезали за края экрана.
// null — станции со своей посадкой в кадр: I (полноэкранный шейдер), V (свой fitCalc), VI и VII (своя сцена).
const SEXT = [null, [5.8,6.1], [6.6,5.4], [9.3,7.3], null, null, null, [9.1,9.4], [7.8,6.8], [6.4,5.5], [7.5,7.4], [7.7,6.6]];
// Станция V многослойная, и её габарит зависит от слоя: обзор системы вписывает себя сам
// (свой fitCalc по настоящей проекции орбит), а на слое «Солнце» и глубже вписывать нужно звезду.
// станция VII в ветке «Сон и сознание»: облако сна, спящий и монитор под ним
SEXT[6] = () => jId === "dream" ? (W < 760 ? [3.9, 4.6] : [3.9, 3.85]) : null;
SEXT[4] = () => (typeof SOLAR !== "undefined" && SOLAR && SOLAR.ext) ? SOLAR.ext() : null;
const FIT_Y = .80, FIT_R = .93, FIT_L = .44;   // допустимые границы в NDC: по высоте, справа, слева
const TAU = Math.PI*2, N = 12, NS_STOPS = 14;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const mobile = innerWidth < 760;
const Q = mobile ? 0.5 : 1;
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const smooth = (a,b,x) => { const t = clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
const ease = x => x<.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2;
const mod = (a,n) => ((a % n) + n) % n;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SUP = {"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻"};
const pow10 = n => "10" + String(n).split("").map(c => SUP[c]||c).join("");
const frame = () => new Promise(r => requestAnimationFrame(r));
// Степени. В шрифтах сайта есть только ¹ ² ³ (они из Latin-1), а ⁴…⁹, ⁰, ⁻ браузер добирает из запасного
// шрифта — другой высоты и толщины, и показатель «пляшет»: 10²⁴ выглядит как две разные цифры. Поэтому
// любые надстрочные символы в тексте страницы переписываются в <sup> с обычными цифрами ТОГО ЖЕ шрифта
// (в SVG — в <tspan> со сдвигом). Делает это наблюдатель за DOM, так что правило работает для любого
// текста — из данных, из шаблонов, из textContent — без правки каждого места отдельно
(() => {
  const RE = /([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+)/, MAP = {"⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9","⁻":"−","⁺":"+"};
  const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "SUP", "tspan", "TITLE"]);
  const fix = tn => {
    const s = tn.nodeValue, par = tn.parentNode;
    if (!s || !par || SKIP.has(par.nodeName) || !RE.test(s)) return;
    const svg = par.namespaceURI === "http://www.w3.org/2000/svg", frag = document.createDocumentFragment();
    s.split(RE).forEach((part, k) => {
      if (!part) return;
      if (k % 2 === 0){ frag.appendChild(document.createTextNode(part)); return; }
      const digits = [...part].map(c => MAP[c]).join("");
      let el;
      if (svg){ el = document.createElementNS("http://www.w3.org/2000/svg", "tspan"); el.setAttribute("baseline-shift", "super"); el.setAttribute("font-size", "70%"); }
      else { el = document.createElement("sup"); el.className = "pw"; }
      el.textContent = digits; frag.appendChild(el);
    });
    par.replaceChild(frag, tn);
  };
  const walk = root => {
    if (root.nodeType === 3){ fix(root); return; }
    if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) if (RE.test(n.nodeValue)) list.push(n);
    list.forEach(fix);
  };
  walk(document.body);
  new MutationObserver(ms => { for (const m of ms){
    if (m.type === "characterData") fix(m.target);
    else m.addedNodes.forEach(walk);
  } }).observe(document.body, { childList:true, subtree:true, characterData:true });
})();
const mk = m => `<i class="mk ${m}" role="img" aria-label="${{s:"установлено",h:"гипотеза",t:"традиция"}[m]}"></i>`;

