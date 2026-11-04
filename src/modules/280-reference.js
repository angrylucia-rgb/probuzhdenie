/* ---------- Справочник ---------- */
const REF_GUIDE = `
  <h2>Как пользоваться Астролябией</h2>
  <p class="lede">Короткая инструкция — если вы впервые открыли сайт.</p>
  <div class="gsec"><h3>Кольцо станций</h3><p>Латунное кольцо из двенадцати станций — путь от Абсолюта (I) через космос, Землю и человека обратно к Пустоте (XII). Листайте колесом мыши, свайпайте на телефоне или используйте стрелки — камера идёт вдоль кольца от станции к станции.</p></div>
  <div class="gsec"><h3>Погружение в станцию</h3><p>Наведите на объект станции и нажмите «Погрузиться в станцию» (или просто кликните по объекту) — откроется панель с традицией, наукой и практикой. Внутри можно пролистать разделы, включить таймер практики и записать мысль в дневник.</p></div>
  <div class="gsec"><h3>Четыре слоя каждой станции</h3><p><b>Традиция</b> — что говорят учения; <b>Наука</b> — что установлено, а что лишь гипотеза; <b>Практика</b> — упражнение с таймером; <b>Символ</b> — образ, звук, цвет.</p></div>
  <div class="gsec"><h3>Маркеры доверия</h3><div class="legend"><span>${mk("s")}установлено наукой</span><span>${mk("h")}гипотеза, исследуется</span><span>${mk("t")}традиция или образ</span></div><p>Они защищают от смешения веры и факта: одно и то же утверждение не всегда стоит на одном основании.</p></div>
  <div class="gsec"><h3>Главы меню</h3><p>Кнопка «Станции» открывает список всех двенадцати. В меню выше — главы со своим погружением: «Человек» (тонкие тела → центры → тело → органы → клетка → ДНК), «Земля» (поля → атмосфера → океан → ядро планеты), «Путь из восьми этапов» (с дыхательной практикой) и ответвление «К центру Галактики» — чёрная дыра и переход в Изнанку.</p></div>
  <div class="gsec"><h3>Звук</h3><p>Кнопка «Музыка» включает тихий фоновый звук станции — у каждой свой тон.</p></div>
  <div class="gsec"><h3>Этот раздел</h3><p>Вкладки выше — Розеттский камень (как разные традиции называют одно и то же), десять сквозных принципов карты и список источников.</p></div>
`;
function renderPrinciplesHTML(){
  return `<h2>Десять принципов, на которых стоит карта</h2><p class="lede">Сквозные идеи, которые повторяются во всех станциях на разных языках — традиций и науки.</p>
  <div class="pr-grid">${DATA.principles.map(p => `
    <article class="pr"><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p>
    <div class="tr">${mk("t")}<span>${esc(p.trad)}</span></div>
    <ul>${p.sci.map(([m,t]) => `<li>${mk(m)}<span>${esc(t)}</span></li>`).join("")}</ul></article>`).join("")}</div>`;
}
function renderRosettaHTML(){
  const RT = DATA.rosetta;
  return `<h2>Как называют одно и то же</h2><p class="lede">Одиннадцать традиций и наука — одним и тем же рядом уровней, их словами.</p>
  <div class="rscroll"><table class="rtable">
  <thead><tr><th scope="col">Уровень</th>${RT.cols.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
  <tbody>${RT.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}
function renderSourcesHTML(){
  return `<h2>Источники</h2><p class="lede">Традиции приведены как свидетельства человеческого опыта, наука — с пометкой степени уверенности.</p>
  <ul class="src-list">${DATA.sources.map(s => `<li>${s.u ? `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a>` : esc(s.t)}</li>`).join("")}</ul>`;
}
const REF = { guide: REF_GUIDE, rosetta: null, principles: null, sources: null };
const chRef = $("chRef"), refBody = $("refBody"); let refOpen = false;
function renderSoundsHTML(){
  const row = (key, vi, tag) => `<li class="snd-it"><button class="snd-play" data-snd="${key}" aria-label="Послушать: ${esc(vi.h)}" data-hover>▶</button><div><span class="mono">${tag}</span><b>${esc(vi.h)}</b> ${mk(vi.m)}<p>${esc(vi.tx)}</p></div></li>`;
  const ly = Object.entries(LV_VOICE).filter(([k]) => k !== "dream:2").map(([k, vi]) => { const [j, L] = k === "bh" ? ["bh", 0] : k.split(":"), J = JOURNEYS[j];
    const nm = (J.title || ST[J.st].short) + (k === "bh" ? " · ветка" : " · слой " + (+L + 1)); return row("lv:" + (k === "bh" ? "bh:0" : k), vi, nm); }).join("");
  return `<section class="ref-sec"><h2>Звуки кольца</h2>
    <p class="lede">У каждой станции — свой тихий голос. Где можно, он собран из настоящих чисел: спектров, частот, ритмов, перенесённых в слышимый диапазон (${mk("s")}). Где это синтез по мотивам чужих сонификаций — ${mk("h")}. Где числа нет — честный символ (${mk("t")}). Голоса звучат поверх фоновой музыки, когда включена кнопка «Музыка», и перетекают друг в друга, пока вы идёте по кольцу.</p>
    <h3>Станции</h3><ul class="snd-list">${ST.map((st, i) => row("st:" + i, VOICE_INFO[i], st.n + " · " + st.short)).join("")}</ul>
    <h3>Голоса слоёв</h3><ul class="snd-list">${ly}</ul>
    <h3>Аккорд измерений</h3>
    <p>В «Лестнице измерений» каждая ступень добавляет к аккорду голос: точка — тихий колокольчик, линия — основной тон и квинта, плоскость — терция, пространство — септима, дальше — нона и ундецима. Это музыкальный образ ${mk("t")}, а не физика: так слышно, как мир «наполняется» направлениями.</p>
    <ul class="snd-list">${["Точка", "Линия", "Плоскость", "Пространство", "Тессеракт", "Свёрнутое измерение", "Калаби — Яу"].map((nm, n) => `<li class="snd-it"><button class="snd-play" data-dim="${n}" aria-label="Послушать аккорд ступени ${n}D" data-hover>▶</button><div><span class="mono">${n}D</span><b>${esc(nm)}</b><p>${n ? (n + 1) + " голос" + (n + 1 < 5 ? "а" : "ов") + " аккорда" : "одинокий колокольчик"}</p></div></li>`).join("")}</ul>
    <h3>Почему тональности идут по кругу квинт</h3>
    <p>Каждой станции дана своя тоника: C, G, D, A, E, B, F♯, C♯, G♯, D♯, A♯, F — каждая следующая на квинту выше. Соседние станции созвучны, и путь по кольцу звучит как модуляция, которая на «Абсолюте» возвращается к началу. ${mk("t")} Это музыкальный выбор, а не физика.</p>
    <p>Честная деталь: двенадцать «чистых» квинт (3 : 2) не замыкают круг. (3/2)¹² ≈ 129,75, а семь октав — ровно 128; лишние ≈ 23 цента называют пифагоровой коммой. ${mk("s")} Чтобы круг сомкнулся, современный строй делит октаву на 12 равных шагов — так звучит и это кольцо.</p>
    <h3>Мифы о частотах — бережно</h3>
    <ul class="snd-myth">
      <li><b>«432 Гц — природный строй, 440 Гц вреден».</b> ${mk("t")} Высота «ля» веками гуляла примерно от 400 до 460 Гц; Верди в 1880-х выступал за строй около 432 Гц, а 440 Гц договорились считать стандартом в XX веке (ISO 16, 1975). Разница — около трети полутона. Надёжных данных, что 432 Гц особым образом влияет на тело или «резонирует со Вселенной», нет: есть лишь маленькие пилотные работы. Строй — договорённость, а не закон природы.</li>
      <li><b>«У каждой чакры своя частота в герцах».</b> ${mk("t")} В классических тантрических текстах центрам сопоставлены звуки — биджа-слоги ЛАМ, ВАМ, РАМ, ЯМ, ХАМ, ОМ, — а не частоты: сама мера «герц» появилась в XIX–XX веках. Списки «частот чакр» — современные авторские схемы, у разных авторов разные.</li>
      <li><b>«Сольфеджио 528 Гц чинит ДНК».</b> ${mk("t")} Набор «частот сольфеджио» придуман в 1990-х (Дж. Пулео, Л. Горовиц). Средневековые слоги ут-ре-ми (Гвидо д’Ареццо, XI век) означали ступени, а не герцы — абсолютной высоты тогда не измеряли. Рецензированных данных о «ремонте ДНК» звуком нет.</li>
      <li><b>«Резонанс Шумана растёт, и мы вместе с ним».</b> ${mk("t")} Основная частота держится около 7,8 Гц и чуть колеблется вместе с ионосферой. То, что она близка к альфа-ритму мозга (8–12 Гц), — красивое совпадение ${mk("h")}, а не доказанная связь.</li>
    </ul>
    <h3>Что в звуке действительно работает</h3>
    <ul class="snd-myth">
      <li>${mk("s")} Медленное дыхание около 6 раз в минуту повышает вариабельность сердечного ритма — на этом построена практика «дыхание сердца».</li>
      <li>${mk("s")} Гудение с закрытым ртом («ммм», как в конце ОМ) примерно в 15 раз повышает оксид азота в носовых пазухах (Вайцберг и Лундберг, 2002).</li>
      <li>${mk("s")} Музыка снижает тревогу, например перед операцией: эффект умеренный, но повторяется в мета-анализах.</li>
      <li>${mk("s")} Тишина тоже звук: двухминутные паузы между музыкой успокаивали дыхание и пульс сильнее самой расслабляющей музыки (Бернарди и соавт., 2006).</li>
    </ul></section>`;
}
// правовая информация (v164): текст — в <template id="tplLegal">; список авторов силуэтов — из BIO_CREDITS
function renderLegalHTML(){ const t = document.getElementById("tplLegal"); return t ? t.innerHTML : ""; }
function legalWire(root){
  const ul = root.querySelector("#lgCredits");
  if (ul && typeof BIO_CREDITS !== "undefined") ul.innerHTML = Object.values(BIO_CREDITS).map(c => `<li><i>${esc(c[2] || "")}</i> — ${esc(c[0] || "автор не указан")} · <a href="https://creativecommons.org/${esc(c[1])}/" target="_blank" rel="noopener">${esc(/zero/.test(c[1]) ? "CC0" : /mark/.test(c[1]) ? "общественное достояние" : "CC BY " + ((c[1].match(/by\/([\d.]+)/) || [])[1] || ""))}</a></li>`).join("");
  root.querySelectorAll('.lg-toc a, .lg a[href^="#lg-"]').forEach(a => a.addEventListener("click", e => { const el = root.querySelector(a.getAttribute("href")); if (el){ e.preventDefault(); el.scrollIntoView({ behavior:"smooth", block:"start" }); } }));
}
function openLegal(sec){ openRef("legal"); if (sec) setTimeout(() => { const el = document.getElementById(sec); if (el) el.scrollIntoView({ block:"start" }); }, 60); }
function renderRefTab(tab){
  if (tab === "rosetta" && !REF.rosetta) REF.rosetta = renderRosettaHTML();
  if (tab === "principles" && !REF.principles) REF.principles = renderPrinciplesHTML();
  if (tab === "sources" && !REF.sources) REF.sources = renderSourcesHTML();
  if (tab === "sounds") REF.sounds = renderSoundsHTML();
  if (tab === "legal") REF.legal = renderLegalHTML();
  refBody.innerHTML = REF[tab];
  if (tab === "legal") legalWire(refBody);
  if (tab === "sounds") refBody.querySelectorAll("[data-dim]").forEach(b => b.onclick = () => { const sb = $("sound"); if (sb.getAttribute("aria-pressed") !== "true") sb.click(); setTimeout(() => Music.dim(+b.dataset.dim), 350); });
  if (tab === "sounds") refBody.querySelectorAll("[data-snd]").forEach(b => b.onclick = () => { refBody.querySelectorAll("[data-snd]").forEach(x => x.classList.toggle("on", x === b)); Music.preview(b.dataset.snd); });
  document.querySelectorAll(".reftab").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
}
function openRef(tab){ closeChapters(); toggleMenu(false); surface(); refOpen = true; chRef.classList.add("open"); chRef.setAttribute("aria-hidden","false"); renderRefTab(tab || "guide"); $("refClose").focus(); }
function closeRef(){ if (!refOpen) return; refOpen = false; chRef.classList.remove("open"); chRef.setAttribute("aria-hidden","true"); }
$("mRef").onclick = () => { toggleMenu(false); openRef("guide"); };
$("mLegal").onclick = () => { toggleMenu(false); openLegal(); };
$("mTerms").onclick = () => { toggleMenu(false); openLegal("lg-terms"); };
$("mPriv").onclick = () => { toggleMenu(false); openLegal("lg-priv"); };
$("refClose").onclick = closeRef;
document.querySelectorAll(".reftab").forEach(b => b.onclick = () => renderRefTab(b.dataset.tab));

// дыхание
(function(){
  const orb = $("orb"), ph = $("phase"), cnt = $("cnt"), btn = $("breathBtn");
  let timer = null, n = 0, inhale = false;
  function tick(){
    inhale = !inhale;
    if (inhale){ n++; if (n > 30){ stop(); ph.textContent = "Готово"; jrPrac("breath", "Дыхание сердца"); return; } Music.chime(); }
    orb.classList.toggle("in", inhale); ph.textContent = inhale ? "Вдох" : "Выдох"; cnt.textContent = `${n} из 30 дыханий`;
  }
  function stop(){ clearInterval(timer); timer = null; orb.classList.remove("in"); btn.textContent = "Начать 5 минут"; inhale = false; }
  btn.onclick = () => { if (!timer && !healthOk()) return healthAsk(() => btn.click()); if (timer){ stop(); ph.textContent = "Пауза"; return; } n = 0; btn.textContent = "Остановить"; tick(); timer = setInterval(tick, 5000); };
})();

// музыка
$("sound").onclick = () => { const b = $("sound"), v = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(v)); b.classList.toggle("on", v); Music.toggle(v); };

// курсор
const cur = $("cur"), dot = $("dot"); let mx = innerWidth/2, my = innerHeight/2, cx = mx, cy = my, nx = 0, ny = 0;
const ndc = new THREE.Vector2(), ray = new THREE.Raycaster(), hitPlane = new THREE.Plane(), hitP = new THREE.Vector3(), tmpN = new THREE.Vector3(), tmpV = new THREE.Vector3();
let humanTouch = false, tipId = null, lastSolarHov = -1;
let pointerIn = false, tapPending = false, armed = -1, armedUntil = 0, hoverI = -1, lastHoverI = -1, atStationSince = 0;
const glc = $("gl");
addEventListener("pointermove", e => { pointerIn = e.target === glc && e.pointerType !== "touch"; ndc.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1); });
document.addEventListener("pointerleave", () => { pointerIn = false; });
glc.addEventListener("pointerdown", e => { ndc.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1); glc._down = [e.clientX, e.clientY, e.pointerType]; });
glc.addEventListener("pointerup", e => { const d = glc._down; if (!d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 10) return;
  if (bhCanPoint() && (d[2] === "touch" ? BH.holeAt(ndc.x, ndc.y) : BH.hole)){ bhDiveStart(); return; }
  if (humanOpen && jKind === "a" && depthT < .5 && !tr){ depthT = 1; lastDepthInput = performance.now(); return; }
  if (solarOn() && !tr && !zm && !menuOpen){
    const pi = SOLAR.selE < .55 && SOLAR.sunE < .35 ? SOLAR.pick(camera, ndc.x, ndc.y, innerWidth/innerHeight) : -1;
    if (pi === 9){ solarSelect(-1); depthT = 1; lastDepthInput = performance.now(); return; }   // к Солнцу — на слой «Солнце»
    if (pi === 10){ jGo("moon"); return; }                                                     // Луна — сразу в её ветку
    if (pi >= 0){ solarSelect(SOLAR.sel === pi ? -1 : pi); return; }
    if (SOLAR.sel >= 0){ solarSelect(-1); return; }
  }
  if (d[2] === "touch"){ tapPending = true; if (humanOpen) humanTouch = true; } else if (hoverI >= 0 && !insideOpen) dive(hoverI); });
addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; nx = mx/innerWidth*2 - 1; ny = my/innerHeight*2 - 1; dot.style.transform = `translate(${mx}px,${my}px)`; });
document.addEventListener("pointerover", e => { cur.classList.toggle("big", !!e.target.closest("button,[data-hover],.seg-t,textarea")); });
cur.dataset.label = "Погрузиться";

