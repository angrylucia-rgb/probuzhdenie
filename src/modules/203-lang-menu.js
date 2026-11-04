/* ---------- язык сайта (v160): переключатель RU/EN в меню, память выбора, мягкая подсказка ---------- */
const LANGS = (() => {
  const other = SITE_LANG === "ru" ? "en" : "ru", KEY = "cosmo-lang";
  const altHref = () => LANG_ALT === "@ru" ? location.href.replace(/en\.html([?#].*)?$/, "index.html") : LANG_ALT;
  const get = () => { try { return localStorage.getItem(KEY); } catch(e){ return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch(e){} };
  // два переключателя: в верхней панели (#tLang) и в шапке меню «Станции»
  document.querySelectorAll(`.mp-lang a[data-l="${SITE_LANG}"], .tlang a[data-l="${SITE_LANG}"]`).forEach(a => a.setAttribute("aria-current", "page"));
  document.querySelectorAll(`.mp-lang a[data-l="${other}"], .tlang a[data-l="${other}"]`).forEach(a => { a.href = altHref(); a.addEventListener("click", () => { set(other); a.href = altHref().split("#")[0] + location.hash; }); });
  // на сайте (не в артефакте) запомненный выбор возвращает на свою версию при новом заходе
  const site = LANG_ALT.charAt(0) === "/", pref = get();
  let sameSite = false; try { sameSite = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch(e){}
  if (site && pref === other && !sameSite){ location.replace(altHref() + location.hash); return { lang:SITE_LANG }; }
  // подсказка один раз: язык браузера не совпадает с языком страницы и выбора ещё не было
  if (!pref){
    const nav = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""]).map(s => String(s).toLowerCase().slice(0, 2));
    const ruLike = nav.some(l => ["ru", "uk", "be", "kk"].includes(l));
    const want = SITE_LANG === "ru" ? !ruLike && nav[0] && nav[0] !== "ru" : ruLike && nav[0] !== "en";
    if (want) TERMS.after(() => setTimeout(() => {
      const t = document.createElement("div"); t.className = "lang-tip"; t.setAttribute("role", "note");
      t.innerHTML = SITE_LANG === "ru" ? `<span lang="en">This atlas is also in English</span><a lang="en" href="${altHref()}">English version →</a><button type="button" aria-label="Close" data-hover>×</button>` : `<span lang="ru">Есть русская версия атласа</span><a lang="ru" href="${altHref()}">Читать по-русски →</a><button type="button" aria-label="Закрыть" data-hover>×</button>`;
      document.body.appendChild(t); requestAnimationFrame(() => t.classList.add("on"));
      const bye = keep => { t.classList.remove("on"); setTimeout(() => t.remove(), 450); if (keep) set(SITE_LANG); };
      t.querySelector("a").addEventListener("click", e => { set(other); e.currentTarget.href = altHref().split("#")[0] + location.hash; });
      t.querySelector("button").addEventListener("click", () => bye(true));
      setTimeout(() => { if (t.isConnected) bye(false); }, 14000);
    }, 1500));
  }
  return { lang:SITE_LANG };
})();
function mpHere(){ if (typeof insideOpen !== "undefined" && insideOpen && diveSt >= 0) return diveSt; if (pos < -.5) return -1; const m = mod(Math.round(pos), 14); return m <= 6 ? m : m >= 8 && m <= 12 ? m - 1 : -1; }
function mpMarks(){ const db = jrLoad(), h = mpHere();
  list.querySelectorAll(".mp-st").forEach(li => { const i = +li.dataset.i; li.classList.toggle("seen", !!db.seen["st:" + i]); li.classList.toggle("here", i === h); });
  // v179: внутри погружения список слоёв текущей станции открыт сразу; открытые списки обновляют «вы здесь»
  const inJ = typeof humanOpen !== "undefined" && humanOpen;
  if (!mpMarks.cnt){ mpMarks.cnt = 1; list.querySelectorAll(".mp-st.haslv").forEach(li => { const n = mpLvGroups(+li.dataset.i).reduce((a, g) => a + g.items.length, 0), tg = li.querySelector(".mp-lvt"); if (n) tg.firstChild.textContent = tg.firstChild.textContent.replace(/\d+/, n); }); }
  list.querySelectorAll(".mp-st.haslv").forEach(li => { const i = +li.dataset.i, tg = li.querySelector(".mp-lvt");
    if (inJ && i === jSt && !li.classList.contains("lvo")){ li.classList.add("lvo"); tg.setAttribute("aria-expanded", "true"); tg.querySelector("span").textContent = "▴"; }
    if (li.classList.contains("lvo")) mpLvFill(i, li.querySelector(".mp-lvin")); });
  return h; }
// v158: «Разделы» — выпадающая колонка коротких входов в главы
const QK = (() => { const box = $("qk"), btn = $("qkBtn"), lst = $("qkList");
  const set = v => { box.classList.toggle("open", v); btn.setAttribute("aria-expanded", String(v)); if (v) setTimeout(() => lst.querySelector(".act").focus({ preventScroll: true }), 30); };
  btn.onclick = e => { e.stopPropagation(); set(!box.classList.contains("open")); };
  lst.addEventListener("click", () => set(false));
  document.addEventListener("pointerdown", e => { if (box.classList.contains("open") && !box.contains(e.target)) set(false); }, true);
  addEventListener("keydown", e => { if (!box.classList.contains("open")) return;
    if (e.key === "Escape"){ set(false); btn.focus(); e.stopPropagation(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp"){ const a = [...lst.querySelectorAll(".act")], k = a.indexOf(document.activeElement); a[(k + (e.key === "ArrowDown" ? 1 : a.length - 1)) % a.length].focus(); e.preventDefault(); e.stopPropagation(); } }, true);
  return { close: () => set(false) };
})();
// v157: кнопка «← Станции» видна, пока открыта любая глава; ведёт обратно в меню (глава остаётся под ним)
const toMenu = $("toMenu");
function syncToMenu(){ toMenu.hidden = menuOpen || !document.querySelector(".chapter.open"); }
toMenu.onclick = () => toggleMenu(true);
{ const mo = new MutationObserver(syncToMenu); document.querySelectorAll(".chapter").forEach(el => mo.observe(el, { attributes: true, attributeFilter: ["class"] })); }
let menuOpen = false;
function toggleMenu(on){ menuOpen = on; if (on) QK.close(); menu.classList.toggle("open", on); menu.setAttribute("aria-hidden", String(!on));
  if (on){ let h = -1; try { h = mpMarks(); } catch(e){} const f = h >= 0 ? list.querySelector(`.mp-st[data-i="${h}"] .mp-sb`) : $("mCompass"); menu.scrollTop = 0; if (f) setTimeout(() => { if (menuOpen) f.focus({ preventScroll: true }); }, 60); }   // меню ещё скрыто visibility в первый кадр — фокус после
  else { mpSpine.classList.remove("hl"); }
  syncToMenu(); }
// стрелки ↑/↓ — по пунктам меню в порядке чтения
menu.addEventListener("keydown", e => { if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const all = [...menu.querySelectorAll(".mp-srch, .mp-abs, .mp-sb, .mp-lvt, .mp-lvb, .mp-chip, .mp-it")].filter(x => x.offsetParent); const k = all.indexOf(document.activeElement);
  const n = all[Math.max(0, Math.min(all.length - 1, k + (e.key === "ArrowDown" ? 1 : -1)))]; if (n){ n.focus(); e.preventDefault(); } });
$("menuBtn").onclick = () => toggleMenu(true);
$("menuClose").onclick = () => toggleMenu(false);
$("mHuman").onclick = () => { toggleMenu(false); openHuman(); };
$("mEarth").onclick = () => { toggleMenu(false); openEarth(); };
$("mAbs").onclick = () => { toggleMenu(false); openJourney("abs"); };
$("mPath").onclick = () => { toggleMenu(false); openPath(); };

// погружение в станцию
const interior = $("interior"), inBody = $("inBody"), reticle = $("reticle"), reveal = $("reveal"), rlab = $("rlab");
let diveT = 0, diveGoal = 0, diveSt = -1, insideOpen = false, pendingDive = null, curSec = 0, timerId = null;
{ const tk = $("rticks"); for (let k = 0; k < 36; k++){ const a = k/36*TAU, big = k % 9 === 0, r1 = 96, r2 = big ? 91 : 94;
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line"); l.setAttribute("x1", Math.cos(a)*r1); l.setAttribute("y1", Math.sin(a)*r1); l.setAttribute("x2", Math.cos(a)*r2); l.setAttribute("y2", Math.sin(a)*r2); tk.appendChild(l); } }
const SECS = ["Традиции", "Наука", "Практика", "Вопрос"];
const arcPt = t => { const x0 = 16, y0 = 58, cx0 = 220, cy0 = -14, x1 = 424, y1 = 58; return [(1-t)*(1-t)*x0 + 2*(1-t)*t*cx0 + t*t*x1, (1-t)*(1-t)*y0 + 2*(1-t)*t*cy0 + t*t*y1]; };
const SEG_T = [.08, .36, .64, .92];
function drawArc(){
  const sv = $("inArc");
  const P0 = [16, 58], P1 = [220, -14], P2 = [424, 58];
  const der = tt => [2*(1-tt)*(P1[0]-P0[0]) + 2*tt*(P2[0]-P1[0]), 2*(1-tt)*(P1[1]-P0[1]) + 2*tt*(P2[1]-P1[1])];
  const fade = tt => smooth(0, .16, tt)*smooth(1, .84, tt);
  const f1 = v => v.toFixed(1);
  let h = "";
  // тонкая линия лимба, растворяющаяся к краям
  const NSEG = 80;
  for (let k = 0; k < NSEG; k++){ const a = arcPt(k/NSEG), b = arcPt((k+1)/NSEG), o = fade((k+.5)/NSEG);
    h += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="rgba(214,172,94,${(.55*o).toFixed(3)})" stroke-width=".6"/>`; }
  // перпендикулярные деления: мелкие наружу, крупные — на разделах, через линию
  const NT = 56;
  for (let k = 0; k <= NT; k++){
    const tt = k/NT, o = fade(tt); if (o < .02) continue;
    const [x, y] = arcPt(tt), [dx, dy] = der(tt), l = Math.hypot(dx, dy), nx = -dy/l, ny = dx/l;
    const mid = k % 7 === 0, len = mid ? 5 : 3;
    h += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - nx*len)}" y2="${f1(y - ny*len)}" stroke="rgba(214,172,94,${((mid ? .5 : .3)*o).toFixed(3)})" stroke-width=".6"/>`;
  }
  SEG_T.forEach(tt => { const [x, y] = arcPt(tt), [dx, dy] = der(tt), l = Math.hypot(dx, dy), nx = -dy/l, ny = dx/l, o = .35 + .65*fade(tt);
    h += `<line x1="${f1(x - nx*9)}" y1="${f1(y - ny*9)}" x2="${f1(x + nx*4)}" y2="${f1(y + ny*4)}" stroke="rgba(214,172,94,${o.toFixed(3)})" stroke-width=".9"/>`; });
  SEG_T.forEach((tt, k) => { const [x, y] = arcPt(tt); h += `<text class="seg-t" data-k="${k}" x="${f1(x)}" y="${f1(y + 17)}" text-anchor="middle" tabindex="0" role="button">${SECS[k]}</text>`; });
  h += `<g id="arcMark"><path d="M0 -3.5 L3.5 0 L0 3.5 L-3.5 0Z" fill="#D6AC5E"/><circle r="6" fill="none" stroke="rgba(214,172,94,.35)" stroke-width=".5"/></g>`;
  sv.innerHTML = h;
  sv.querySelectorAll(".seg-t").forEach(el => { const go = () => { const s = inBody.querySelectorAll(".sec")[+el.dataset.k]; inBody.scrollTo({top: s.offsetTop, behavior: reduce ? "auto" : "smooth"}); };
    el.addEventListener("click", () => { go(); el.blur(); }); el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); go(); } }); });
}
// вертикальная шкала прокрутки в стиле прямой шкалы астролябии
const vscale = $("vscale"), vsvg = $("vsvg"), vthumb = $("vthumb");
let vH = 0, vTh = 28;
function vGeom(){ const max = Math.max(1, inBody.scrollHeight - inBody.clientHeight); vH = vscale.clientHeight; vTh = Math.max(26, Math.min(vH*.35, vH*inBody.clientHeight/Math.max(1, inBody.scrollHeight))); return max; }
function drawVScale(){
  const max = vGeom(); if (!vH) return;
  const cx = 15, f1 = v => v.toFixed(1);
  const fade = y => smooth(0, vH*.1, y)*smooth(vH, vH*.9, y);
  let h = "";
  const NSEG = 40;
  for (let k = 0; k < NSEG; k++){ const y0 = k/NSEG*vH, y1 = (k+1)/NSEG*vH; h += `<line x1="${cx}" y1="${f1(y0)}" x2="${cx}" y2="${f1(y1)}" stroke="rgba(214,172,94,${(.5*fade((y0+y1)/2)).toFixed(3)})" stroke-width=".6"/>`; }
  for (let y = 0, k = 0; y <= vH; y += 8, k++){ const o = fade(y); if (o < .02) continue; const mid = k % 5 === 0;
    h += `<line x1="${cx - (mid ? 6 : 3.5)}" y1="${f1(y)}" x2="${cx}" y2="${f1(y)}" stroke="rgba(214,172,94,${((mid ? .45 : .25)*o).toFixed(3)})" stroke-width=".6"/>`; }
  inBody.querySelectorAll(".sec").forEach(s => { const y = Math.min(s.offsetTop, max)/max*(vH - vTh) + vTh/2, o = .4 + .6*fade(y);
    h += `<line x1="${cx - 11}" y1="${f1(y)}" x2="${cx + 7}" y2="${f1(y)}" stroke="rgba(214,172,94,${o.toFixed(3)})" stroke-width=".9"/>`; });
  vsvg.innerHTML = h;
  vthumb.style.height = vTh + "px";
}
function vThumbUpdate(){ const max = vGeom(); vthumb.style.transform = `translateY(${(inBody.scrollTop/max*(vH - vTh)).toFixed(1)}px)`; }
function vScrollTo(clientY, smoothly){ const r = vscale.getBoundingClientRect(), max = vGeom(); const p = clamp((clientY - r.top - vTh/2)/(vH - vTh), 0, 1); inBody.scrollTo({top: p*max, behavior: smoothly && !reduce ? "smooth" : "auto"}); }
vscale.addEventListener("pointerdown", e => { vscale.setPointerCapture(e.pointerId); vscale.classList.add("drag"); vScrollTo(e.clientY, true); });
vscale.addEventListener("pointermove", e => { if (vscale.classList.contains("drag")) vScrollTo(e.clientY, false); });
const vEnd = () => vscale.classList.remove("drag");
vscale.addEventListener("pointerup", vEnd); vscale.addEventListener("pointercancel", vEnd);
vscale.addEventListener("wheel", e => { inBody.scrollTop += e.deltaY; }, {passive:true});
addEventListener("resize", () => { if (insideOpen){ drawVScale(); vThumbUpdate(); } });
drawArc();
function arcUpdate(){
  const max = inBody.scrollHeight - inBody.clientHeight, p = max > 0 ? inBody.scrollTop/max : 0;
  const [x, y] = arcPt(SEG_T[0] + p*(SEG_T[3] - SEG_T[0]));
  const mkr = $("arcMark"); if (mkr) mkr.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  const secs = inBody.querySelectorAll(".sec"); let on = 0;
  secs.forEach((s, k) => { if (s.offsetTop - inBody.scrollTop < inBody.clientHeight*.5) on = k; if (s.offsetTop - inBody.scrollTop < inBody.clientHeight*.85) s.classList.add("seen"); });
  $("inArc").querySelectorAll(".seg-t").forEach((el, k) => el.classList.toggle("on", k === on));
  vThumbUpdate();
}
inBody.addEventListener("scroll", arcUpdate, {passive:true});
function fillInterior(i){
  const s = ST[i];
  $("inNum").textContent = `Станция ${s.n} из XII`;
  chars($("inName"), s.name, .5); $("inSub").textContent = s.sub; $("inScale").textContent = s.scale;
  const stagger = (h, k) => h.replace(/class="item"/g, () => `class="item" style="transition-delay:${(.08*(k++)).toFixed(2)}s"`);
  let journal = ""; try { journal = localStorage.getItem("astro-journal-" + i) || ""; } catch(e){}
  inBody.innerHTML = stagger(`
    <section class="sec"><h3><small>01</small>Традиции</h3>
      <ul class="list">${s.trad.map(x => `<li class="item">${mk("t")}<span>${esc(x)}</span></li>`).join("")}</ul></section>
    <section class="sec"><h3><small>02</small>Наука</h3>
      <ul class="list">${s.sci.map(([m, x]) => `<li class="item">${mk(m)}<span>${esc(x)}</span></li>`).join("")}</ul>
      <div class="legend item"><span>${mk("s")}установлено наукой</span><span>${mk("h")}гипотеза</span><span>${mk("t")}традиция или образ</span></div></section>
    <section class="sec"><h3><small>03</small>Практика</h3>
      <p class="item" style="margin:0;font-size:17px">${esc(s.prac)}</p>
      <div class="timer item"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="38" stroke="rgba(214,172,94,.18)"/><circle id="tRing" cx="42" cy="42" r="38" stroke="#D6AC5E" stroke-dasharray="238.8" stroke-dashoffset="0"/></svg>
        <div style="display:grid;gap:8px"><b id="tTime">05:00</b><button class="btn" id="tBtn" data-hover>Начать · 5 минут</button></div></div></section>
    <section class="sec"><h3><small>04</small>Вопрос</h3>
      <p class="bigq item">${esc(s.q)}</p>
      <label class="item mono" for="journal" style="color:var(--faint)">Ваш ответ — остаётся только в этом браузере</label>
      <textarea class="journal item" id="journal" placeholder="Запишите, что приходит…">${esc(journal)}</textarea>
      <span class="saved item" id="saved" aria-live="polite"></span></section>`, 0);
  inBody.scrollTop = 0;
  const jr = $("journal"); let jt;
  jr.addEventListener("input", () => { clearTimeout(jt); jt = setTimeout(() => { try { localStorage.setItem("astro-journal-" + i, jr.value); localStorage.setItem("astro-journal-t-" + i, String(Date.now())); $("saved").textContent = "Сохранено"; } catch(e){ $("saved").textContent = "Браузер не даёт сохранить"; } }, 500); });
  clearInterval(timerId); timerId = null;
  $("tBtn").onclick = () => {
    if (!timerId && !healthOk()) return healthAsk(() => $("tBtn").click());
    if (timerId){ clearInterval(timerId); timerId = null; $("tBtn").textContent = "Продолжить"; return; }
    let left = +($("tTime").dataset.left || 300); $("tBtn").textContent = "Пауза";
    timerId = setInterval(() => { left--; $("tTime").dataset.left = left;
      $("tTime").textContent = String(Math.floor(left/60)).padStart(2,"0") + ":" + String(left % 60).padStart(2,"0");
      $("tRing").setAttribute("stroke-dashoffset", String(238.8*(1 - left/300)));
      if (left <= 0){ clearInterval(timerId); timerId = null; $("tBtn").textContent = "Готово"; $("tTime").dataset.left = 300; Music.end(); jrPrac("in:" + i, "Практика станции «" + ST[i].short + "»"); } }, 1000);
  };
  const pi = (i + 11) % 12, ni = (i + 1) % 12;
  $("inPrev").textContent = `← ${ST[pi].n} · ${ST[pi].short}`; $("inNext").textContent = `${ST[ni].n} · ${ST[ni].short} →`;
  $("inPrev").onclick = () => travelDive(pi); $("inNext").onclick = () => travelDive(ni);
  requestAnimationFrame(() => { drawVScale(); arcUpdate(); });
  setTimeout(() => { drawVScale(); arcUpdate(); }, 600);
}
function dive(i){
  if (i < 0) return;
  toggleMenu(false); openJourney(jidOf(i));
}
function openInterior(i){
  if (i < 0) return;
  toggleMenu(false); closeChapters();
  diveSt = i; diveGoal = 1; insideOpen = true;
  if (diveT === 0) interior.style.clipPath = "circle(0px at 50% 50%)";
  fillInterior(i);
  interior.classList.add("open"); interior.setAttribute("aria-hidden", "false");
  Music.dive();
  if (kbUser) setTimeout(() => { if (insideOpen) $("surface").focus({preventScroll:true}); }, 1200);
}
function surface(){
  if (!insideOpen) return;
  insideOpen = false; diveGoal = 0; interior.setAttribute("aria-hidden", "true");
  clearInterval(timerId); timerId = null;
  Music.surface();
}
let kbUser = false;
addEventListener("keydown", () => { kbUser = true; }, true);
addEventListener("pointerdown", () => { kbUser = false; }, true);
function travelDive(j){ surface(); pendingDive = {i:j, moved:false, inner:true}; }
$("surface").onclick = surface;
$("enter").onclick = () => dive(shown);

// глава: человек — погружение по глубине
const chHuman = $("chHuman"), hdBody = $("hdBody"), ptip = $("ptip");
let humanOpen = false, hSel = -1, hm = 0, depth = 0, depthT = 0, lastDepthInput = 0, shownLevel = -1;
let DMAX = 15, jKind = "h", JL = null, jId = "human", jSt = 6, jHist = [], earthBranch = "litho", galBranch = "sun", tr = null;
// момент (по общему времени T), когда сцена «Первоимпульс» была впервые открыта переходом — от него считается
// анимация «рождения из точки», зеркальная коллапсу треугольника Триединства на выходе из «Абсолюта»
let g1EmergeT0 = -1;
const PHYS_NOTE = "Перед интенсивными нагрузками при хронических заболеваниях посоветуйтесь с врачом.";
const HLV = [
  { short:"Ананда", kind:"kosha", k:4 },
  { short:"Виджняна", kind:"kosha", k:3 },
  { short:"Мано", kind:"kosha", k:2 },
  { short:"Прана", kind:"kosha", k:1 },
  { short:"Центры", kind:"chakras", name:"Семь центров", sub:"Чакры · ось тонкого тела" },
  { short:"Тело", kind:"phys", name:"Физическое тело", sub:"Аннамайя-коша · тело из пищи",
    lead:"Энергия уплотнилась в материю. Аннамайя — «оболочка из пищи»: то, что мы едим, пьём и вдыхаем, становится телом.",
    sci:[["s","Тело взрослого — около 37 триллионов клеток"],["s","Вода составляет примерно 50–60% массы тела взрослого"],["s","Клетки обновляются с разной скоростью: эпителий кишечника — за несколько дней, эритроциты живут около 120 дней"],["s","Взрослым рекомендуют 7–9 часов сна: во сне восстанавливаются ткани и закрепляется память"]],
    trad:["Веданта — Аннамайя-коша, самая плотная из пяти оболочек","Даосизм — цзин, сущность, которую бережёт умеренность","Аюрведа — тело как равновесие трёх дош"],
    prac:["Осознанная еда: первые пять глотков — медленно, со вниманием ко вкусу","Сканирование тела перед сном — от стоп к макушке","Постоянный ритм дня: подъём и отбой в одно время"],
    ex:["Не меньше 150–300 минут умеренной активности в неделю — рекомендация ВОЗ","Ходьба 30 минут в день","Сурья Намаскар — 3–12 кругов утром","Ба Дуань Цзинь — «Восемь кусков парчи», 10–15 минут"] },
  { short:"Мышцы", kind:"phys", hint:"Наведите курсор на мышцу — её волокна засветятся", hintT:"Коснитесь мышцы — её волокна засветятся", name:"Мышечная система", sub:"Сила · движение · расслабление",
    lead:"Мышцы — двигатель воли. Каждое движение — сокращение миллионов волокон, а расслабление — навык, которому можно учиться.",
    sci:[["s","В теле более 600 скелетных мышц"],["s","Мышцы составляют около трети массы тела взрослого"],["s","Сокращение идёт за счёт скольжения нитей актина и миозина; энергию даёт АТФ"],["s","Работающие мышцы выделяют миокины — сигнальные вещества, влияющие на обмен веществ и другие органы"]],
    trad:["Йога — асана соединяет устойчивость и лёгкость (стхира и сукха)","Цигун и тайцзи — «мягкая сила»: движение без лишнего напряжения","Традиционная китайская медицина — «печень управляет сухожилиями»"],
    prac:["Прогрессивная мышечная релаксация: напрячь группу мышц на 5 секунд, отпустить на 20","Растяжка на выдохе, без рывков","Поиск лишнего напряжения: плечи, челюсть, лоб"],
    ex:["Силовые упражнения на все крупные группы мышц — 2 раза в неделю и чаще (ВОЗ)","Приседания, отжимания, планка — по 3 подхода","Асаны: Вирабхадрасана (воин), Уткатасана (стул), Навасана (лодка)","Тайцзи: медленные связки 10–20 минут"] },
  { short:"Органы", kind:"phys", hint:"Наведите на орган — он оживёт: лёгкие дышат, сердце бьётся", hintT:"Коснитесь органа — он оживёт: лёгкие дышат, сердце бьётся", name:"Внутренние органы", sub:"Ритмы · дыхание · пищеварение",
    lead:"Органы работают без нашего приказа, но слышат дыхание и внимание. Здесь тело говорит на языке ритмов.",
    sci:[["s","В покое сердце перекачивает около 5 литров крови в минуту"],["s","В стенках кишечника сотни миллионов нейронов — энтеральная нервная система, «второй мозг»"],["s","Бактериальных клеток в кишечнике примерно столько же, сколько клеток тела"],["s","Блуждающий нерв связывает мозг с сердцем, лёгкими и кишечником; медленное дыхание повышает вариабельность ритма сердца"]],
    trad:["Традиционная китайская медицина — пять пар органов связаны с пятью стихиями и эмоциями","Аюрведа — агни, пищеварительный огонь","Даосизм — практика «Улыбка внутренним органам»"],
    prac:["Диафрагмальное дыхание: живот поднимается на вдохе, 6 дыханий в минуту","«Улыбка внутренним органам»: пройти вниманием от сердца к почкам","Самомассаж живота по часовой стрелке"],
    ex:["Короткая прогулка после еды","Скрутка сидя — Ардха Матсиендрасана","Ба Дуань Цзинь: «Поддерживать небо двумя руками»","Бхрамари — «жужжащее» дыхание"] },
  { short:"Скелет", kind:"phys", hint:"Наведите на кость — под курсором откроется её внутреннее строение", hintT:"Коснитесь кости — откроется её внутреннее строение", name:"Скелет", sub:"Ось · опора · кроветворение",
    lead:"Скелет — ось и опора. Кость — живая ткань: она растёт, обновляется и отвечает на нагрузку.",
    sci:[["s","У взрослого человека 206 костей"],["s","Костная ткань постоянно перестраивается; скелет обновляется примерно за 10 лет"],["s","В красном костном мозге каждый день образуются сотни миллиардов клеток крови"],["s","Кости крепнут под нагрузкой — закон Вольфа"],["h","Кости выделяют гормон остеокальцин; его роль в обмене веществ у людей ещё изучается"]],
    trad:["Йога — Меру-данда: позвоночник как ось мира в теле","Даосизм — костный мозг хранит сущность цзин; практика «промывания костного мозга»","Цигун — «стояние столбом»: выстраивание тела по вертикали"],
    prac:["Медитация опоры: ощутить седалищные кости, позвоночник, макушку","Проверка осанки: уши над плечами, плечи над тазом","Визуализация света, поднимающегося по позвоночнику"],
    ex:["Ходьба и лёгкие прыжки укрепляют кости (при остеопорозе — только после консультации врача)","Тадасана — поза горы, 1–2 минуты","Чжань чжуан — стояние столбом, 5–20 минут","Силовые упражнения 2 раза в неделю"] },
  { short:"Ткани", kind:"micro", name:"Ткани", sub:"Костная · мышечная · соединительная", scale:"≈ 0,1–1 мм",
    lead:"Под увеличением кость — живой город: кольца остеонов, а в их центре каналы с сосудами и нервами. Рядом — мягкие ткани: мышечные волокна и соединительная ткань, которая связывает тело в одно целое.",
    sci:[["s","В теле четыре основных типа тканей: эпителиальная, соединительная, мышечная и нервная"],["s","Компактная кость сложена из остеонов — концентрических пластин вокруг канала с сосудами и нервами"],["s","Около 60–70% массы кости — минерал (гидроксиапатит), остальное — в основном коллаген и вода"],["s","Коллаген — самый распространённый белок тела: примерно четверть–треть всего белка"],["s","Поперечная исчерченность мышцы — это повторяющиеся саркомеры, сократительные единицы волокна"],["h","Фасция как единая сеть, передающая натяжение по «миофасциальным линиям», — популярная модель; доказательства пока частичные"]],
    trad:["Традиционная китайская медицина — «почки управляют костями и костным мозгом»","Цигун — «И Цзинь Цзин», канон изменения мышц и сухожилий","Йога — инь-йога: долгие мягкие удержания поз для связок и соединительной ткани"],
    prac:["Медленное потягивание после сна — во все стороны, как кошка","Внимание к опоре: ощутить вес костей и отпустить мышцы вокруг них","Самомассаж мягким мячом: медленно и без боли"],
    ex:["Ударная нагрузка — ходьба, лестница, лёгкие прыжки — поддерживает плотность костей","Силовые упражнения укрепляют и кости, и сухожилия","Инь-йога: 3–5 минут в позе — бабочка, дракон, гусеница","И Цзинь Цзин — 12 движений, 15–20 минут"] },
  { short:"Нейроны", kind:"micro", hint:"Наведите на нейрон — он разгорится и отправит импульс соседу", hintT:"Коснитесь нейрона — он разгорится и отправит импульс соседу", name:"Нейроны", sub:"Нервная ткань · связь · память", scale:"≈ 4–100 мкм (тело клетки)",
    lead:"В канале кости идёт нерв — мы следуем за ним. Нейроны говорят электрическими импульсами и химическими сигналами, и каждое переживание немного меняет узор их связей.",
    sci:[["s","В мозге человека около 86 миллиардов нейронов"],["s","По миелинизированным волокнам импульс бежит со скоростью до 100 м/с и более"],["s","Число синапсов в мозге оценивают примерно в 10¹⁴–10¹⁵"],["s","Нейропластичность: обучение и повторение меняют силу и число связей между нейронами"],["h","Регулярная медитация связана с изменениями в структуре и активности мозга; размер и устойчивость эффектов ещё уточняются"]],
    trad:["Йога — нади, тонкие каналы; во многих текстах их 72 000","Буддизм — ум тренируется, как тело; этот диалог продолжается в исследованиях Mind & Life","Даосизм — шэнь, дух, проявляется в ясности ума и блеске глаз"],
    prac:["Медитация сосредоточения: 10 минут внимания к дыханию; отвлеклись — мягко вернитесь","Каждый день учиться чему-то новому — языку, музыке, движению","Сон: во сне мозг закрепляет выученное"],
    ex:["Аэробные нагрузки повышают уровень BDNF — белка, поддерживающего нейроны и их связи","Равновесие: Врикшасана (дерево), стояние на одной ноге","Координация: жонглирование, танец, тайцзи","Нади Шодхана — попеременное дыхание ноздрями, 5–10 минут"] },
  { short:"Кровь", kind:"micro", hint:"Проведите курсором через поток — эритроциты обогнут его", hintT:"Коснитесь потока — эритроциты обогнут точку касания", name:"Эритроциты", sub:"Кровь · кислород · ритм", scale:"≈ 7–8 мкм",
    lead:"Рядом с нейронами — капилляр. Эритроциты — самые многочисленные клетки тела: они несут кислород к каждой клетке и помогают уносить углекислый газ. Ядра у них нет, поэтому дальше мы войдём в клетку стенки сосуда.",
    sci:[["s","Эритроциты — около 84% всех клеток тела по числу, примерно 25 триллионов"],["s","Эритроцит живёт около 120 дней; костный мозг выпускает миллионы новых каждую секунду"],["s","В одном эритроците около 270 миллионов молекул гемоглобина; каждая связывает до четырёх молекул кислорода"],["s","Диаметр — 7–8 мкм, но клетка гнётся и проходит через более узкие капилляры"],["s","У зрелых эритроцитов млекопитающих нет ни ядра, ни митохондрий"]],
    trad:["Библия — «душа тела в крови» (Левит 17:11)","Традиционная китайская медицина — «ци — полководец крови, кровь — мать ци»","Аюрведа — ракта, кровь, связана с огненной питтой"],
    prac:["Ощутить пульс в кончиках пальцев — 2 минуты внимания","Спокойное дыхание через нос, выдох длиннее вдоха","Потереть ладони и приложить к глазам — почувствовать тепло и ток крови"],
    ex:["Аэробная нагрузка умеренной интенсивности («можно говорить, но не петь») — 30–45 минут","Интервальная ходьба: 3 минуты быстро, 3 минуты спокойно","Випарита Карани — ноги на стене, 5 минут","Цигун «Встряхивание тела» — 3–5 минут"] },
  { short:"Клетка", kind:"micro", hint:"Наведите на органоид — он приблизится и раскроет детали", hintT:"Коснитесь органоида — он приблизится и раскроет детали", name:"Клетка", sub:"Единица жизни · целый мир внутри", scale:"≈ 10–30 мкм",
    lead:"Клетка стенки сосуда — целый мир: мембрана, ядро, митохондрии, фабрики белков и дороги транспорта. Каждая из десятков триллионов клеток тела живёт, дышит и обновляется.",
    sci:[["s","Тело состоит примерно из 30–37 триллионов клеток — оценки разнятся"],["s","Митохондрии производят большую часть АТФ — энергии клетки; у них своя ДНК, которая наследуется по материнской линии"],["s","Митохондрии произошли от древних бактерий, поселившихся внутри клетки, — теория эндосимбиоза"],["s","За сутки тело перерабатывает количество АТФ, сравнимое с собственной массой"],["s","Аутофагия — переработка клеткой собственных старых частей; за её механизмы вручена Нобелевская премия 2016 года"],["h","Голодание и нагрузки усиливают аутофагию у животных; данных о людях пока немного"]],
    trad:["Буддизм — «сеть Индры»: в каждой жемчужине отражаются все остальные","Герметизм — «что вверху, то и внизу»","Лейбниц — монады: каждая по-своему отражает всю Вселенную"],
    prac:["Созерцание: ощутить тело как сообщество живых клеток, а не как предмет","Благодарность телу перед сном — за работу, которую оно делает без нас","Постоянное время еды и сна: у каждой клетки есть свои часы"],
    ex:["Интервальные тренировки стимулируют образование новых митохондрий в мышцах","Прогулка 10–15 минут после еды","Капалабхати — 3 круга по 30 выдохов (не при беременности и повышенном давлении)","Сон 7–9 часов — время восстановления клеток"] },
  { short:"Ядро", kind:"micro", name:"Ядро", sub:"Хранилище генома · семя формы", scale:"≈ 5–10 мкм",
    lead:"Входим в ядро. Здесь хранится геном — около двух метров ДНК в шаре диаметром несколько микрометров. Нити хроматина занимают свои «территории», а гены включаются и выключаются, откликаясь на жизнь клетки.",
    sci:[["s","В ядре каждой клетки — около 2 метров ДНК"],["s","Геном человека — около 3 миллиардов пар оснований и примерно 20 000 генов, кодирующих белки"],["s","Белки кодируют лишь 1–2% ДНК; значительная часть остального участвует в регуляции генов"],["s","Ядро связано с цитоплазмой тысячами ядерных пор"],["s","Ядрышко собирает части рибосом — фабрик белка"],["h","Питание, стресс и нагрузки меняют эпигенетические метки; передаются ли такие изменения потомкам у людей — вопрос открытый"]],
    trad:["Даосизм — «преднебесная» сущность цзин, полученная от родителей","Веданта — Хираньягарбха, «золотой зародыш», из которого разворачивается мир","Санскрит — биджа, семя: в семени уже заложено всё дерево"],
    prac:["Медитация семени: внимание в центре груди, точка, из которой разворачивается форма","Осознанный отдых: 10 минут без стимулов","Дневник: какие привычки вы хотите «включить», а какие — «выключить»"],
    ex:["Регулярные нагрузки меняют активность генов в мышцах","Йога-нидра — 20 минут глубокого расслабления","Цигун «Шесть целительных звуков»","Прогулка на природе — от 20 минут"] },
  { short:"Хромосома", kind:"micro", name:"Хромосома", sub:"Спираль спиралей · путь к ДНК", scale:"≈ 1–10 мкм → 2 нм",
    lead:"Перед делением клетки хроматин сворачивается в хромосомы: спираль уложена в спираль, и так несколько раз. Раскрутите её — и увидите двойную спираль ДНК. Листайте дальше: путь замкнётся на станции VIII.",
    sci:[["s","У человека 46 хромосом — 23 пары"],["s","ДНК наматывается на белки-гистоны: получаются нуклеосомы, «бусины на нити»"],["s","Знакомая X-форма видна только во время деления клетки"],["s","Ширина двойной спирали ДНК — около 2 нм"],["s","На концах хромосом — теломеры; за открытие механизма их защиты вручена Нобелевская премия 2009 года"],["h","Некоторые исследования связывают медитацию и снижение стресса с активностью теломеразы; данные предварительные"]],
    trad:["Кадуцей — две змеи вокруг оси: древний образ, похожий на двойную спираль (метафора, а не научная связь)","Кундалини — спиральная сила, свернувшаяся у основания позвоночника","Уроборос — змей, кусающий свой хвост: конец пути становится началом"],
    prac:["Спиральное дыхание: на вдохе внимание поднимается по спирали вдоль позвоночника, на выдохе опускается","Созерцание спирали: раковина, галактика, ДНК — одна форма на разных масштабах","Вопрос в пути: что в моей жизни разворачивается из «семени»?"],
    ex:["Скрутки позвоночника — Паривритта Триконасана","Тайцзи: «шёлковая нить» — спиральные движения из центра","Медленная ходьба по спирали или лабиринту"] }
];
const ELV = [
  { short:"Гея", cat:"тонкое поле", name:"Гея · Душа мира", sub:"Планета как живое целое", scale:"вся планета",
    lead:"Начнём с самого широкого взгляда: Земля — единое целое. Древние называли её Матерью и Душой мира. Наука о системе Земли видит похожее: жизнь, воздух, вода и камень связаны обратными связями.",
    sci:[["s","Земле около 4,54 млрд лет"],["s","Кислород атмосферы почти целиком создан фотосинтезом: жизнь изменила планету"],["h","Гипотеза Геи (Лавлок и Маргулис, 1970-е): жизнь участвует в регуляции климата и состава воздуха. Степень этой «саморегуляции» спорна"],["s","В биосфере около 550 млрд тонн углерода; большая часть — в растениях"]],
    trad:["Платон, «Тимей» — космос как живое существо с душой (anima mundi)","Атхарваведа XII.1.12 — «Земля — мать, я — её сын»; богиня Бхуми (Притхви)","Анды — Пачамама; с 2008 года права природы закреплены в конституции Эквадора","Коги (Колумбия) — Алуна: мир мысли, в котором Земля сначала была задумана","Закон Одного — планета как сущность на своём пути; исцеление через любовь к планете"],
    par:"Анандамайя-коша — самая тонкая и широкая оболочка человека: целостность до всякого деления на части.",
    prac:["Созерцание Земли из космоса: увидеть шар целиком, а себя — точкой на нём","Благодарность Земле перед едой — одна фраза про себя"] },
  { short:"Гравитация", cat:"физическое поле", name:"Гравитация и геоид", sub:"Поле, у которого нет границы", scale:"без границы",
    lead:"Гравитация — самое дальнодействующее поле Земли: оно слабеет с расстоянием, но нигде не кончается. Оно держит Луну, воздух и океаны и задаёт само понятие «низа».",
    sci:[["s","Ускорение свободного падения — около 9,78 м/с² на экваторе и 9,83 м/с² на полюсах"],["s","Геоид — форма, которую принял бы океан под действием одной тяжести и вращения. Он отклоняется от эллипсоида примерно от −106 до +85 м"],["s","Спутники GRACE и GRACE-FO каждый месяц измеряют изменения гравитации: так следят за таянием льда и запасами подземных вод"],["s","Приливы поднимают не только океан, но и твёрдую кору — на десятки сантиметров"],["s","Земля сплюснута: экваториальный радиус больше полярного примерно на 21 км"]],
    trad:["Аристотель — «естественное место»: тяжёлое стремится к центру мира","Ньютон — всемирное тяготение; Эйнштейн — тяготение как искривление пространства-времени","«И цзин» — гексаграмма Кунь ☷: Земля принимает и несёт"],
    par:"Опора. Скелет держит форму вопреки тяжести, и тяжесть же делает форму возможной.",
    prac:["Чжань чжуан, «стояние столбом»: 5–10 минут отдавать вес земле через стопы","Медленная ходьба с вниманием к перекату стопы"] },
  { short:"Магнитосфера", cat:"физическое поле", name:"Магнитосфера", sub:"Щит планеты", scale:"≈10 радиусов Земли к Солнцу",
    lead:"Течения жидкого железа в ядре создают магнитное поле. Оно отклоняет солнечный ветер, удерживает частицы в радиационных поясах и зажигает полярные сияния.",
    sci:[["s","Поле создаёт геодинамо — конвекция жидкого железа во внешнем ядре"],["s","У поверхности индукция поля — примерно 25–65 мкТл"],["s","Со стороны Солнца граница магнитосферы лежит примерно в 10 радиусах Земли; хвост тянется дальше орбиты Луны"],["s","Радиационные пояса Ван Аллена открыты в 1958 году по данным спутника «Эксплорер-1»"],["s","Полярные сияния — свечение атомов кислорода (зелёное и красное) и азота при ударах частиц"],["s","Полюса меняются местами нерегулярно; последняя полная инверсия была около 780 тыс. лет назад"]],
    trad:["Китай — компас сначала служил геомантии и фэншуй и лишь потом навигации","Уильям Гильберт, «О магните» (1600): Земля — большой магнит","Саамы — к сиянию относились с осторожностью и уважением"],
    par:"Кожа и иммунитет: граница, которая отделяет своё от чужого и пропускает нужное.",
    prac:["Медитация щита: ощутить границу своего поля — спокойную, но ясную","Наблюдение неба: по индексу Kp узнать, когда видны сияния"] },
  { short:"Ноосфера", cat:"тонкое поле · философия", name:"Ноосфера", sub:"Сфера разума", scale:"поверхность и связи",
    lead:"Вернадский и Тейяр де Шарден назвали ноосферой новую оболочку планеты: мысль и труд человека стали силой, сравнимой с геологической. Её нити — дороги, города, связи и идеи.",
    sci:[["s","Вернадский развивал учение о ноосфере в 1920–1940-х годах: человечество — новая геологическая сила"],["s","Масса созданного человеком — бетона, металлов, пластика — около 2020 года сравнялась с массой всей живой биомассы (Nature, 2020)"],["s","В 2024 году антропоцен не утвердили как официальную геологическую эпоху, но термин широко используется"],["h","Проект «Глобальное сознание» ищет связь массовых событий с генераторами случайных чисел; большинство учёных считают результаты недоказанными"]],
    trad:["Тейяр де Шарден — ноосфера как шаг к «точке Омега»","Русский космизм (Фёдоров, Циолковский) — человек отвечает за Землю и космос","Буддизм — сеть Индры: каждая жемчужина отражает все остальные","Закон Одного — «социальная память»: общее сознание, к которому движется человечество"],
    par:"Ум человека — Мано- и Виджняна-майя-коши; ноосфера — ум планеты.",
    prac:["Информационная гигиена: час в день без новостей и ленты","Метта: пожелать блага всем существам планеты — 5 минут"] },
  { short:"Ионосфера", cat:"физическое поле", name:"Ионосфера · резонанс Шумана", sub:"Глобальная электрическая цепь", scale:"≈60–1000 км",
    lead:"Земля и ионосфера образуют гигантский электрический резонатор. Грозы по всей планете заряжают его и заставляют «звучать» на низких частотах.",
    sci:[["s","Молнии возбуждают в полости «Земля — ионосфера» резонансы Шумана — около 7,8, 14 и 20 Гц"],["s","Ионосфера заряжена примерно на 250 кВ относительно Земли; в ясную погоду у поверхности поле около 100 В/м"],["s","На Земле вспыхивает около 44 молний в секунду (±5) — данные спутника OTD"],["s","Над грозами возникают спрайты и «синие струи» — короткие разряды в верхней атмосфере"],["h","7,8 Гц близко к ритмам мозга, но прямое влияние резонанса Шумана на здоровье не доказано"]],
    trad:["Гаятри-мантра — Бхур, Бхувах, Свах: Земля, пространство между и небо","Перун, Зевс, Тор — громовержцы: молния соединяет небо и землю","Даосизм — ци Неба и ци Земли встречаются в человеке"],
    par:"Нервная система: импульсы бегут по цепи, как токи между грозами и ионосферой.",
    prac:["Резонансное дыхание: 6 дыханий в минуту, 5–10 минут","Прогулка после грозы: внимание к запаху, звукам и свежести воздуха"] },
  { short:"Сетка", cat:"тонкое поле · традиция", name:"Сетка Земли · линии силы", sub:"Священная география", hint:"Сетка делится сама на себя — как фрактал: 1 → 2 → 3 уровня", scale:"поверхность",
    lead:"Во многих традициях Землю пронизывают линии силы: «драконьи вены» фэншуй, песенные тропы аборигенов Австралии, лей-линии. Это язык священной географии, а не измеренные поля.",
    sci:[["s","Лей-линии описал Альфред Уоткинс (1921) как древние прямые пути между памятниками; «энергетический» смысл им придали эзотерики 1960-х"],["s","Статистика показывает: при большом числе памятников случайные «выравнивания» неизбежны"],["s","Сетки Хартмана и Карри приборами не обнаружены"],["s","Реальные линии силы Земли — границы литосферных плит, разломы и срединно-океанические хребты; вдоль них идут землетрясения и вулканы"],["h","Святилища часто стоят у источников, разломов и необычных пород — возможно, людей притягивали вода и особые ландшафты"],["s","Правильных многогранников — ровно пять; это доказано ещё в «Началах» Евклида"]],
    trad:["Фэншуй — лун май, «драконьи вены», по которым течёт ци земли","Аборигены Австралии — песенные линии: маршруты, «пропетые» предками","Платон, «Федон» — Земля сверху похожа на мяч из двенадцати кусков кожи","Платон, «Тимей» — пять правильных многогранников сопоставлены стихиям: тетраэдр — огонь, куб — земля, октаэдр — воздух, икосаэдр — вода, додекаэдр — пятая сущность, образ самого космоса","Икосаэдрические модели Беккера–Хейгенса и Гончарова–Морозова–Макарова — современные эзотерические гипотезы, не подтверждённые"],
    par:"Меридианы и нади — такие же «линии силы» тела в традиционных системах.",
    prac:["Паломничество: дойти до места силы пешком и в тишине","Найти на прогулке точку, где хочется остановиться, и провести там 10 минут"] },
  { short:"Атмосфера", cat:"оболочка · воздух", name:"Атмосфера", sub:"Дыхание планеты", scale:"0–≈100 км",
    lead:"Тонкая оболочка воздуха — лёгкие планеты. Её облака, вихри и береговые линии под ними повторяют свой узор на разных масштабах — это фракталы.",
    sci:[["s","Сухой воздух: азот ≈78%, кислород ≈21%, аргон ≈0,9%"],["s","Половина массы атмосферы лежит ниже ≈5,5 км"],["s","Озоновый слой (≈15–35 км) задерживает большую часть ультрафиолета и восстанавливается благодаря Монреальскому протоколу"],["s","Границу космоса условно проводят на высоте 100 км — линия Кармана"],["s","Контуры облаков фрактальны: их размерность около 1,35 (Лавджой, 1982)"],["s","Циклоны закручивает сила Кориолиса; их рукава близки к логарифмическим спиралям"]],
    trad:["Бытие 2:7 — «вдунул в лице его дыхание жизни»","Греция — пневма: дыхание, воздух и дух названы одним словом","Индия — Ваю, бог ветра, и прана","Даосизм — иероглиф ци изначально означал пар и воздух"],
    par:"Дыхание: кислород, которым мы дышим, выдохнули растения и планктон.",
    prac:["Дыхание 4–6: вдох на 4 счёта, выдох на 6 — 5 минут","Нади Шодхана — попеременное дыхание ноздрями"] },
  { short:"Океан", cat:"оболочка · вода", name:"Океан", sub:"Кровь планеты", scale:"0–≈11 км", sea:1,
    lead:"Мы пронырнули облака и поверхность воды. Океан держит тепло планеты и даёт половину её кислорода. Глубже 1000 метров царит тьма, но многие существа светятся сами.",
    sci:[["s","Океан покрывает ≈71% поверхности Земли; средняя глубина ≈3,7 км"],["s","Фитопланктон даёт около половины фотосинтеза планеты"],["s","Солнечный свет почти гаснет к 200 м; около трёх четвертей животных толщи воды умеют светиться"],["s","Бездна Челленджера в Марианском жёлобе — около 10,9 км"],["s","Океан поглотил около 90% избыточного тепла от глобального потепления"],["s","Раковина наутилуса близка к логарифмической спирали: каждая новая камера повторяет форму предыдущей"]],
    trad:["Бытие 1:2 — «Дух Божий носился над водою»","Индуизм — пахтанье Молочного океана: из глубин рождается амрита","Дао дэ цзин, 8 — «Высшее благо подобно воде»","Фалес — вода как первоначало всего"],
    par:"Кровь и лимфа: вода тела — внутренний океан, хотя плазма (≈0,9% соли) преснее моря (≈3,5%).",
    prac:["Созерцание воды: 5 минут смотреть на волны или поток","Спокойное плавание с долгим выдохом"] },
  { short:"Дно", cat:"оболочка · дно", name:"Дно океана", sub:"Жизнь без солнца", scale:"≈4–11 км под водой",
    lead:"Внизу — горы, рифты и «чёрные курильщики». У горячих источников живут сообщества, которые питаются химической энергией недр, а не светом.",
    sci:[["s","Срединно-океанические хребты — самая длинная горная система Земли, около 65 000 км"],["s","Гидротермальные источники открыты в 1977 году у Галапагосских островов; жизнь там держится на хемосинтезе"],["s","«Чёрные курильщики» выбрасывают воду с температурой до ≈400 °C"],["s","Детальной съёмкой покрыто лишь около четверти морского дна"],["h","Многие учёные считают, что жизнь могла зародиться у гидротермальных источников"]],
    trad:["Шумеры — Абзу, подземные воды, откуда исходит мудрость бога Энки","Бытие 7:11 — «разверзлись все источники великой бездны»","Индуизм — наги, хранители подводных сокровищ"],
    par:"Микробиом кишечника: жизнь в темноте, которая питается химией, а не светом.",
    prac:["Медитация глубины: с каждым выдохом опускаться ниже волн, к тишине"] },
  { short:"Кора", cat:"недра · камень", name:"Земная кора", sub:"Кости планеты", scale:"5–70 км", strata:1,
    lead:"Сквозь осадки и базальт мы входим в камень. Кора — тонкая скорлупа планеты, но в её трещинах живёт огромная глубинная биосфера, а узор разломов и жил повторяет себя на всех масштабах.",
    sci:[["s","Океаническая кора — 5–10 км, континентальная — в среднем 30–50 км, под горами до 70 км"],["s","Граница Мохоровичича открыта в 1909 году по сейсмическим волнам"],["s","Кольская сверхглубокая скважина — 12 262 м; на забое около 180 °C"],["s","Больше всего в коре кислорода (≈46%) и кремния (≈28%)"],["s","Глубинная биосфера содержит 15–23 млрд тонн углерода — в сотни раз больше, чем все люди (Deep Carbon Observatory, 2018)"],["s","Сети трещин, горные хребты и речные системы — фракталы"]],
    trad:["Бытие 2:7 — Адам сотворён из «адамы», земли","Каббала — Малхут, Царство: сфира, где свет становится материей","Йога — притхви-таттва, стихия земли, связана с Муладхарой","У-син — стихия Земля занимает центр и даёт устойчивость"],
    par:"Кости: кальций и кремний, опора и минеральная память тела.",
    prac:["Медитация горы: 10 минут сидеть неподвижно и устойчиво","Тадасана — поза горы, 1–2 минуты"] },
  { short:"Верх. мантия", cat:"недра · мантия", name:"Верхняя мантия", sub:"Твёрдое, которое течёт", scale:"до 410 км",
    lead:"Под Мохо начинается мантия — горячий зелёный перидотит. Она твёрдая, но за миллионы лет течёт медленными конвекционными валами и двигает материки.",
    sci:[["s","Мантия занимает ≈84% объёма Земли"],["s","Главный минерал верхней мантии — оливин; его ювелирная разновидность — хризолит"],["s","Мантия течёт со скоростью сантиметры в год; плиты движутся на 2–10 см в год — примерно как растут ногти"],["s","Астеносфера — ослабленный слой, по которому скользят литосферные плиты"]],
    trad:["Пураны — семь нижних миров: Атала, Витала, Сутала, Талатала, Махатала, Расатала, Патала","Греция — Тартар, бездна под землёй","Скандинавия — корни Иггдрасиля уходят в глубинные миры"],
    par:"Мышцы и фасции: медленное течение и тонус, которые удерживают форму.",
    prac:["Тайцзи: 10 минут медленного, непрерывного движения — течь, сохраняя форму"] },
  { short:"Переход. зона", cat:"недра · мантия", name:"Переходная зона", sub:"Скрытые воды", scale:"410–660 км",
    lead:"Под огромным давлением оливин перестраивается в синий рингвудит. Этот минерал может удерживать воду, и в нём найдены её следы — «океан», запертый в камне.",
    sci:[["s","На глубинах 410 и 660 км оливин перестраивается в более плотные структуры — вадслеит и рингвудит"],["s","В 2014 году в бразильском алмазе нашли рингвудит с ≈1,4% воды — первое прямое свидетельство воды в переходной зоне (Nature)"],["h","Если так увлажнена вся зона, воды в ней может быть сравнимо с мировым океаном; оценки сильно разнятся"],["s","Погружающиеся плиты (субдукция) уносят воду вглубь и порой застревают у границы 660 км"]],
    trad:["Египет — Нун, изначальные воды, окружающие мир","Бытие — «воды под твердью»","Даосизм — стихия Вода и почки хранят сущность цзин"],
    par:"Почки и межклеточная жидкость: скрытые воды тела, которые фильтруют и хранят.",
    prac:["Пить воду осознанно: первый глоток — медленно и с благодарностью"] },
  { short:"Ниж. мантия", cat:"недра · мантия", name:"Нижняя мантия", sub:"Самый распространённый минерал", scale:"660–2890 км",
    lead:"Здесь царит бриджманит. Из глубины поднимаются грибовидные плюмы, а у подножия мантии лежат два гигантских «материка» плотного вещества — возможно, осколки древней планеты.",
    sci:[["s","Бриджманит — самый распространённый минерал Земли; назван в 2014 году в честь Перси Бриджмена"],["s","Под Африкой и Тихим океаном лежат две огромные области с пониженной скоростью сейсмических волн — LLSVP"],["h","По модели Юаня и соавторов (Nature, 2023) LLSVP — остатки протопланеты Тейи, столкновение с которой создало Луну"],["s","Мантийные плюмы поднимают горячее вещество к горячим точкам — Гавайям, Исландии"],["s","Слой D″ — сложная граница между мантией и ядром"]],
    trad:["Алхимия — VITRIOL: «посети недра земли и, очищая, найдёшь сокровенный камень»","Индуизм — змей Шеша (Ананта), на котором покоятся миры"],
    par:"Внутренние органы: большие медленные потоки, от которых зависит жизнь всего тела.",
    prac:["VITRIOL как практика: вечерний дневник — что я нашёл в себе сегодня?"] },
  { short:"Внеш. ядро", cat:"недра · ядро", name:"Внешнее ядро", sub:"Сердце-динамо", scale:"2890–5150 км",
    lead:"Океан жидкого железа. Вращение Земли закручивает его течения в спиральные колонны, и так рождается магнитное поле планеты.",
    sci:[["s","Жидкое железо с никелем и лёгкими элементами; температура — несколько тысяч градусов"],["s","Конвекция и вращение закручивают потоки в колонны и спирали — так работает геодинамо"],["s","Железо составляет около трети массы всей Земли (≈32%)"],["s","Ядро заметил Олдем (1906); его глубину определил Гутенберг (1914)"],["s","Над Южной Атлантикой поле ослаблено — Южно-Атлантическая аномалия"]],
    trad:["Гефест и Вулкан — кузнецы в огненных недрах","Алхимия — железо связано с Марсом: воля и действие","Йога — Манипура: огонь в центре тела"],
    par:"Сердце: самый мощный поток тела и его самое сильное электромагнитное поле.",
    prac:["Внимание в центре груди: 12 спокойных дыханий","Цигун «Шесть целительных звуков» — звук сердца «хэ»"] },
  { short:"Внутр. ядро", cat:"недра · ядро", name:"Внутреннее ядро", sub:"Кристаллический центр", scale:"5150–6371 км",
    lead:"В центре — твёрдый железо-никелевый шар, горячий, как поверхность Солнца. Он растёт, кристаллизуясь из жидкости, а его вращение то опережает мантию, то отстаёт.",
    sci:[["s","Радиус ≈1220 км, давление ≈330–360 ГПа, температура порядка 5000–6000 °C"],["s","Внутреннее ядро открыла Инге Леманн в 1936 году"],["s","Внутри есть «самое внутреннее ядро» радиусом ≈650 км со своей анизотропией (Фам и Ткальчич, 2023)"],["s","Вращение ядра меняется: около 2010 года оно замедлилось и начало отставать от мантии (Nature, 2024)"],["s","Ядро медленно растёт: кристаллизация выделяет тепло, которое питает динамо"],["h","Кристаллическая структура железа в ядре (гексагональная или иная) ещё обсуждается"]],
    trad:["Веданта — Хираньягарбха, «золотой зародыш» в центре","Гора Меру — ось мира","Герметизм — «что вверху, то и внизу»: солнце в сердце планеты","Мифы о полой Земле и Агартхе — сейсмология показывает твёрдое ядро, а не пустоту"],
    par:"Неподвижный центр — Атман, вокруг которого всё вращается.",
    prac:["Медитация центра: внимание в нижнем дань тяне, 3 пальца ниже пупка"] },
  { short:"Железо", cat:"микромир · атом", name:"Железо: кристалл и атом", sub:"Сердце планеты в малом", scale:"≈0,25 нм → 0,1 нм",
    lead:"Приближаемся к железу: атомы уложены в решётку, у каждого 26 электронов. Кольца вначале — картина Бора 1913 года; ближе они расплываются в облако вероятности. Листайте дальше — внутрь атома, на станцию «Атом».",
    sci:[["s","Железо рождается в недрах массивных звёзд — Земля и мы сделаны из звёздного вещества"],["s","Ядро железа-56 — одно из самых прочно связанных; на железе заканчивается выгодный синтез в звёздах"],["s","Размер атома железа — около 0,25 нм, ядро в десятки тысяч раз меньше"],["s","Оболочки настоящие: у железа 2, 8, 14 и 2 электрона. Но электрон на них — не шарик на орбите, а стоячая волна: у неё есть только вероятность оказаться в данной точке"],["s","Планетарная модель Резерфорда и Бора (1911–1913) верно даёт лишь уровни энергии водорода. Электрон на классической орбите излучал бы и упал на ядро за доли наносекунды — атома бы просто не было"],["s","При обычных условиях железо кристаллизуется в объёмно-центрированную кубическую решётку, при огромных давлениях — в гексагональную"],["h","Какая структура у железа во внутреннем ядре — ещё обсуждается"]],
    trad:["Упанишады — «Ты есть То» (Tat tvam asi): одна суть в малом и великом","Алхимия — железо и Марс; «всё в одном»","Закон Одного — первыми сущностями этой планеты Ра называет воду, огонь, воздух и землю"],
    par:"В крови человека то же железо держит кислород — туда ведёт вторая ветка пути, через Биосферу.",
    prac:["Созерцание: ощутить в теле железо звёзд и планеты","Благодарность Земле — одним дыханием"] }
];

const BIO_LV = { short:"Крона", cat:"биосфера · свет", name:"Биосфера · крона", sub:"Живое вещество планеты: здесь свет становится веществом", scale:"от 1 нм до 60 м", bsc:0,
  hint:"Лупа — ведите по листьям · клик — нырок до молекулы · на ветке — гарпия · справа вверху — время суток",
  lead:"Из атмосферы — в крону сейбы, «мирового древа» майя. Здесь свет становится веществом: лист ловит фотон, расщепляет воду и строит сахар из углекислого газа. Этим светом в конце концов питается всё живое на суше.",
  sci:[["s","В живых организмах около 550 млрд т углерода; ≈ 80 % — в растениях, у животных — меньше 0,5 %, у людей — около 0,01 % (Бар-Он и соавт., 2018)"],["s","Сейба (Ceiba pentandra) поднимается на 60–70 м — выше полога леса; у основания — досковидные корни-контрфорсы"],["s","Фотосинтез: 6 CO₂ + 6 H₂O + свет → C₆H₁₂O₆ + 6 O₂. Кислород берётся из воды, а не из CO₂ — это показали опыты с изотопом ¹⁸O (1941)"],["s","Хлорофилл поглощает красный и синий свет, а зелёный отражает — поэтому лес зелёный"],["h","Около половины кислорода планеты дают не леса, а морской фитопланктон; оценки — от 50 до 80 %"]],
  trad:["Майя — сейба, мировое древо: корни в подземном мире Шибальбе, крона — в небесах","Вернадский — свет Солнца, превращённый в живое вещество","Каббала — Эц Хаим, Древо жизни","Скандинавия — ясень Иггдрасиль соединяет миры"],
  par:"Лёгкие — перевёрнутая крона: бронхи ветвятся, как сучья, а сотни миллионов альвеол, как листья, ведут газообмен — только наоборот: мы вдыхаем кислород, который выдохнул лес.",
  prac:["Дыхание с деревом: вдох — кислород, отданный листьями; выдох — углекислый газ, который они возьмут"] };
const BIO_LVS = [BIO_LV,
  { short:"Ствол", cat:"биосфера · на дереве", name:"Ствол · дом для жизни", sub:"Эпифиты, мхи и лишайники", scale:"от 10 мкм до 60 м", bsc:1,
    hint:"Лупа: бромелия и кора · клик — ближе · на стволе — белка",
    lead:"Ствол сейбы — вертикальный мир эпифитов: бромелий, орхидей, папоротников, мхов. Они не паразиты — просто поднялись к свету и пьют дождь. В розетке бромелии стоит лужица — крошечный пруд высоко над землёй.",
    sci:[["s","Лишайник — союз гриба и водоросли или цианобактерии: гриб даёт дом и воду, его партнёр — сахар от фотосинтеза"],["s","В воде одной бромелии живут десятки видов — от бактерий и личинок комаров до головастиков древесных лягушек"],["s","Эпифиты не берут сок у дерева: воду и минералы они получают из дождя, тумана и пыли"],["h","Тропические леса занимают около 6–7 % суши, но в них, по оценкам, живёт больше половины наземных видов"]],
    trad:["Вернадский — «живое вещество» как геологическая сила","Закон Одного — вторая плотность: растения и животные растут и тянутся к свету"],
    par:"Мы тоже «многоэтажны»: на коже и в кишечнике живут триллионы микробов — свой лес на нашем стволе.",
    prac:["Найти дерево и минуту рассматривать кору вблизи: мох, лишайник, муравьи"] },
  { short:"Подстилка", cat:"биосфера · круговорот", name:"Подстилка · круговорот", sub:"Где лист снова становится землёй", scale:"от 1 мкм до 1 м", bsc:2,
    hint:"Лупа: подстилка · клик — ближе · в листьях — жук",
    lead:"Секрет тропического леса: почва здесь бедная. Всё богатство — в живом и в тонком слое опавших листьев. Грибы и бактерии разбирают лист за месяцы, и корни тут же забирают освободившееся.",
    sci:[["s","Опавший лист в тропическом лесу разлагается за месяцы, в тайге — за годы"],["s","Красный цвет латеритной почвы — оксиды железа: ливни миллионы лет вымывали из почвы почти всё, кроме железа и алюминия"],["s","В грамме почвы — до миллиарда бактерий"],["s","Разложители дышат и возвращают углерод в воздух — так замыкается круговорот: свет → сахар → лист → почва → CO₂ → снова в лист"]],
    trad:["Экклезиаст 3:20 — «всё произошло из праха и всё возвратится в прах»","Китайская натурфилософия у-син — круговорот пяти стихий: дерево рождает огонь, огонь — землю, земля — металл, металл — воду, вода — дерево"],
    par:"В нашем кишечнике около 40 трлн бактерий — свой «почвенный» мир: они разбирают то, с чем не справляются наши ферменты.",
    prac:["Подержать в ладони горсть лесной земли и вдохнуть: запах «после дождя» — геосмин, его выделяют почвенные бактерии"] },
  { short:"Корни", cat:"биосфера · союз", name:"Корни · грибница", sub:"Под землёй — союз дерева и гриба", scale:"от 1 мкм до 10 м", bsc:3, bioFork:true,
    hint:"Лупа: кончик корня · клик — внутрь корня · в почве — червь",
    lead:"Корни держат великана и пьют воду, но тончайшую работу делает гриб: микориза приносит дереву фосфор и воду, а получает сахар. Ниже корней — камень, а в камне — время. Отсюда два пути.",
    sci:[["s","Микоризу образуют 80–90 % видов наземных растений; этому союзу больше 400 млн лет — его видно в окаменелостях Райни (Шотландия)"],["s","Воду корень берёт в основном кончиками с корневыми волосками; в сухой сезон сейба сбрасывает листья, чтобы не терять влагу"],["h","«Лесной интернет» — обмен веществами и сигналами между деревьями по общей грибнице: перенос показан в опытах, но его роль в природе, вероятно, преувеличена (Karst и соавт., 2023)"],["s","Хлорофилл и гем — родственные тетрапирролы: их строят одни и те же ферменты до общего предшественника — протопорфирина IX; в центре хлорофилла магний, в центре гема железо"]],
    trad:["Бхагавад-гита 15.1 — ашваттха: корни вверху, ветви внизу; кто знает это дерево, знает Веды","Скандинавия — у корней Иггдрасиля источник мудрости Мимира"],
    par:"Сосуды, бронхи и нейроны ветвятся, как корни и грибница. В крови железо гема держит кислород — туда ведёт путь «к Человеку».",
    prac:["Медитация «корни»: стоя, почувствовать стопы и представить, как от них в землю уходят корни; 10 медленных выдохов вниз"] }
];
const ALV = [
  { short:"Свет", kind:"a0", cat:"Единое", name:"Абсолют", sub:"Свет без масштаба", scale:"вне масштаба" },
  { short:"Двойственность", kind:"a1", cat:"полярность", name:"Двойственность", sub:"Конфликт полюсов · Вектор", scale:"до 10⁻³⁶ с после начала",
    lead:"Чистый свет собирается в точку, точка вытягивается в линию — ось напряжения. Единое впервые различает «это» и «то». Но двойственность не может длиться: полюса либо гасят друг друга, либо расходятся. Нужна третья опора.",
    sci:[["h","Суперсимметрия предсказывает для каждой частицы партнёра; её нарушение объяснило бы, почему партнёров не видно. На Большом адронном коллайдере их пока не нашли"],["h","В планковскую эпоху (≈10⁻⁴³ с) гравитация, по теории, отделилась от остальных сил, а к ≈10⁻³⁶ с распалось великое объединение — это модели, а не наблюдения"],["s","Энергия рождает пары «частица — античастица»: это многократно наблюдается в опытах"],["s","При встрече частица и античастица аннигилируют, превращаясь в энергию, — ровно то, к чему стремится нескомпенсированная пара"],["s","Электрический заряд бывает положительным и отрицательным; одноимённые заряды отталкиваются, разноимённые притягиваются"],["s","В ранней Вселенной на миллиард пар приходилась примерно одна лишняя частица материи — из этого остатка сделан наш мир"],["h","Почему материи оказалось больше, чем антиматерии, — один из главных открытых вопросов физики; ответ на него — на следующем слое"]],
    trad:["Даосизм — из Тайцзи рождаются Инь и Ян; «одно рождает два» (Дао дэ цзин, 42)","Санкхья — Пуруша (дух, свидетель) и Пракрити (природа, материя)","Кашмирский шиваизм — Шива и Шакти: сознание и его творящая сила","Веданта — первое различие на Наблюдателя и Наблюдаемое","Каббала — Хокма: нераздельная вспышка мудрости, чистая сила без формы, которая её держала бы"],
    par:"Вдох и выдох, два полушария, симпатическая и парасимпатическая системы — двойственность живёт в теле как ритм. Но ритм не застывает на одном полюсе: тело само ищет третье — равновесие.",
    prac:["Дыхание Инь–Ян: вдох — внимание вверх, выдох — вниз; 12 кругов","Созерцание: заметить, как ум делит мир на «я» и «не-я», и вернуться к тому, что замечает"] },
  { short:"Триединство", kind:"a2", cat:"третья сила", name:"Триединство", sub:"Третья точка · Плоскость", scale:"гипотеза бариогенезиса → ≈10⁻⁶ с",
    lead:"Третья точка — сама возможность формы: линия замыкается в равносторонний треугольник, простейшую фигуру, которая держит форму без опоры. Конфликт не снят — он впервые заключён в структуру, способную его нести.",
    sci:[["s","Андрей Сахаров (1967) показал: чтобы во Вселенной вообще осталось вещество, а не только вспышка взаимной аннигиляции, нужны сразу три условия — нарушение барионного числа, нарушение C- и CP-симметрии и отклонение от теплового равновесия"],["h","Какая именно комбинация условий сработала в реальной Вселенной, пока не известно — это одна из главных открытых задач физики частиц"],["s","Три кварка разных «цветовых» зарядов, удерживаемые сильным взаимодействием, образуют устойчивый протон; двух зарядов для этого недостаточно"],["s","Спустя ≈10⁻⁶ секунды после Большого взрыва кварки остывают настолько, что впервые связываются в протоны и нейтроны, — эпоха адронизации"],["h","В геометрии треугольник — простейшая жёсткая фигура: три связанные точки задают плоскость и держат форму без опоры, в отличие от двух"]],
    trad:["Дао дэ цзин, 42 — «два рождают три, а три рождают все вещи»: инь и ян сами по себе бесплодны, пока их взаимодействие («сплетающееся ци») не станет третьим","Каббала — Бина принимает нераздельную вспышку Хокмы и впервые даёт ей форму, «чрево, дающее облик духу»; вместе с Кетер и Хокмой она образует «сверхформальную» триаду — ещё до всех сфирот, включая Любовь (Хесед)","Гурджиев, Четвёртый путь — Закон трёх: утверждающая и отрицающая силы сами по себе бесплодны, событие происходит только с приходом третьей, примиряющей силы","Санкхья — сама материя (пракрити) по природе тройственна: саттва, раджас, тамас; пока эти три в равновесии, ничего не проявлено — творение начинается с нарушения их покоя","Пифагорейцы — тройка впервые «делает действительными возможности единицы»: три точки задают плоскость и треугольник, а не только направление"],
    par:"Треугольник — самая устойчивая конструкция: и в архитектуре, и в любых отношениях третья опора превращает конфликт в структуру, способную стоять сама. Но стоять — не значит быть наполненной: дальше путь ведёт к станции «Первоимпульс», туда, где это устойчивое «три» впервые называют Свободой, Любовью и Светом.",
    prac:["Найти в теле три точки опоры (например, две стопы и макушку) и почувствовать устойчивость","Созерцание: вспомнить недавний конфликт двух и поискать не компромисс, а третье — взгляд, в который входят оба"] }
];

JL = HLV;
