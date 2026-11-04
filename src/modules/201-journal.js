// ---------- журнал пройденного (новый блок, этап 3, подэтап 10б) ----------
// Тихо и только в этом браузере: что открыто (станции, слои, события календаря, группы Древа, фигуры и мосты,
// маршруты) — с числом посещений и датами; практики, доведённые до конца, — по дням. Читает «Моя астролябия».
// Функции объявлены через function: их зовут из любых модулей, в том числе во время загрузки.
var JR_DB = null, JR_T = 0;
function jrLoad(){
  if (JR_DB) return JR_DB;
  try { JR_DB = JSON.parse(localStorage.getItem("astro-log") || "null"); } catch(e){}
  if (!JR_DB || JR_DB.v !== 1) JR_DB = { v:1, seen:{}, prac:[], days:{} };
  try { JSON.parse(localStorage.getItem("astro-visited") || "[]").forEach(i => { const k = "st:" + i; if (!JR_DB.seen[k] && ST[i]) JR_DB.seen[k] = { n: ST[i].short, c:1, f:0, l:0 }; }); } catch(e){}
  return JR_DB;
}
function jrDay(t){ const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function jrSave(){ clearTimeout(JR_T); JR_T = setTimeout(() => { try { localStorage.setItem("astro-log", JSON.stringify(JR_DB)); } catch(e){} }, 400); }
function jrMark(kind, id, name){
  const db = jrLoad(), k = kind + ":" + id, now = Date.now(), e = db.seen[k];
  if (e){ if (now - e.l < 60000) return; e.c++; e.l = now; if (name) e.n = name; if (!e.f) e.f = now; }
  else db.seen[k] = { n: name || String(id), c:1, f: now, l: now };
  const d = jrDay(now); db.days[d] = (db.days[d] || 0) + 1;
  jrSave();
}
function jrPrac(id, name){
  const db = jrLoad(), now = Date.now();
  db.prac.push({ t: now, id, n: name }); if (db.prac.length > 400) db.prac.splice(0, db.prac.length - 400);
  const d = jrDay(now); db.days[d] = (db.days[d] || 0) + 1;
  jrSave();
}
function jrClear(){
  JR_DB = { v:1, seen:{}, prac:[], days:{} };
  try {
    const rm = []; for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k && k.startsWith("astro-") && k !== "astro-compass-invite") rm.push(k); }
    rm.forEach(k => localStorage.removeItem(k));
  } catch(e){}
  visited.clear();
}
const visited = new Set();
try { JSON.parse(localStorage.getItem("astro-visited") || "[]").forEach(v => visited.add(v)); } catch(e){}
let shown = -2, tintTarget = new THREE.Color(TINT[0]);
function showStation(i){
  if (i === shown) return; shown = i;
  if (i < 0){ stEl.hidden = true; count.hidden = true; return; }
  const s = ST[i];
  stEl.hidden = false; count.hidden = false;
  $("stNum").textContent = s.n;
  { const vi = VOICE_INFO[i]; $("stSnd").innerHTML = `<span class="mono">♪ Голос станции</span> ${mk(vi.m)} ${esc(vi.h)}`; }
  chars($("stName"), s.name, 0);
  refade($("stSub"), s.sub); refade($("stLede"), LEDE[i]); refade($("stScale"), s.scale);
  $("toHuman").hidden = i !== 6; $("toEarth").hidden = i !== 5; $("toBH").hidden = i !== 3; $("toDims").hidden = i !== 0;
  count.innerHTML = String(i+1).padStart(2,"0") + "<small>из 12</small>";
    Music.station(i); if (!humanOpen) Music.voice("st:" + i, true);
  visited.add(i); try { localStorage.setItem("astro-visited", JSON.stringify([...visited])); } catch(e){}
  jrMark("st", i, s.short);
  miniMarks();
}
let shownPortal = -1;
function showPortal(pi){
  if (pi === shownPortal) return; shownPortal = pi;
  if (pi < 0){ portalEl.hidden = true; return; }
  const P = PORTALS[pi]; portalEl.hidden = false;
  $("poEye").textContent = P.eye; chars($("poTitle"), P.title, .1); refade($("poText"), P.text);
  $("poNote").innerHTML = mk(P.note[0]) + "<span>" + esc(P.note[1]) + "</span>";
  Music.portal(pi === 1);
}

// шкала
const gauge = $("gauge"), gmark = $("gmark");
const GMAX = 30, GMIN = -38, gy = e => (GMAX - e)/(GMAX - GMIN)*100;
[["∞",30],[pow10(20),20],[pow10(10),10],[pow10(0),0],[pow10(-10),-10],[pow10(-20),-20],[pow10(-30),-30],["0",-38]].forEach(([t,e]) => { const d = document.createElement("span"); d.className = "tk"; d.style.top = gy(e) + "%"; d.textContent = t; gauge.appendChild(d); });

// мини-астролябия
const mini = $("mini"), SVGNS = "http://www.w3.org/2000/svg";
const sv = (tag, at, p) => { const e = document.createElementNS(SVGNS, tag); for (const k in at) e.setAttribute(k, at[k]); (p||mini).appendChild(e); return e; };
sv("circle", {r:58, fill:"none", stroke:"rgba(214,172,94,.35)"});
sv("circle", {r:30, fill:"none", stroke:"rgba(214,172,94,.15)"});
for (let k = 0; k < 72; k++){ const a = k/72*TAU, big = k % 6 === 0; sv("line", {x1:Math.sin(a)*58, y1:-Math.cos(a)*58, x2:Math.sin(a)*(big?52:55), y2:-Math.cos(a)*(big?52:55), stroke: big ? "#D6AC5E" : "rgba(214,172,94,.3)"}); }
for (const a of [6.5, 11.5].map(v => v/N*TAU)) sv("circle", {cx:Math.sin(a)*42, cy:-Math.cos(a)*42, r:2, fill:"none", stroke:"#B79BE0"});
const miniAli = sv("g", {});
sv("line", {x1:0, y1:28, x2:0, y2:-50, stroke:"#D6AC5E"}, miniAli);
sv("path", {d:"M-3 -46 L0 -52 L3 -46Z", fill:"#D6AC5E"}, miniAli);
sv("circle", {r:2.5, fill:"#D6AC5E"});
const miniNums = ST.map((s, i) => { const a = i/N*TAU; const t = sv("text", {x:Math.sin(a)*42, y:-Math.cos(a)*42, tabindex:"0", role:"button", "aria-label":`${s.n}. ${s.name}`, "data-hover":""}); t.textContent = s.n;
  t.addEventListener("click", () => goTo(i)); t.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); goTo(i); } }); return t; });
function miniMarks(){ miniNums.forEach((t, i) => t.setAttribute("class", i === shown ? "c" : visited.has(i) ? "v" : "")); }
miniMarks();

// меню
const menu = $("menu"), list = $("menuList");
// v156: меню — шкала масштабов. Станции сверху вниз, погружения веточками у своей станции, сквозные темы подсвечивают свой диапазон
const MP_BR = { 3: ["mBH"], 5: ["mEarth"], 6: ["mHuman"] };
// v179: число слоёв у станции вместе с ветками (для кнопки «слои · N»); сами списки — в mpLvGroups
const MP_LVN = [3, 2, 1, 6, 20, 20, 19, 2, 3, 3, 1, 1];   // уточняется при первом открытии меню (mpMarks)
function mpLvGroups(i){
  const J = id => { try { return JOURNEYS[id].levels(); } catch(e){ return []; } };
  const mk = (id, L, from, br) => L.map((v, k) => ({ id, d: (from || 0) + k, br, nm: v.short || v.name || "", full: v.name || v.short || "" }));
  if (i === 5){ const E = ELV; return [
    { items: mk("earth", E.slice(0, 7)) },
    { nm:"Литосфера — к ядру", items: mk("earth", E.slice(7), 7, "litho") },
    { nm:"Биосфера — сейба", items: mk("earth", BIO_LVS, 7, "bio") } ]; }
  const G = { 0:[["abs"]], 1:[["g1"]], 2:[["g2"]], 3:[["g3"], ["bh", "Центр Галактики"]], 4:[["g4"], ["moon", "Луна"], ["jup", "Юпитер и Европа"]],
              6:[["human"], ["dream", "Сон и сознание"]], 7:[["g7"]], 8:[["g8"]], 9:[["g9"]], 10:[["g10"]], 11:[["g11"]] }[i] || [];
  return G.map(([id, nm]) => ({ nm, items: mk(id, J(id)) }));
}
function mpLvFill(i, box){
  const G = mpLvGroups(i), cur = typeof humanOpen !== "undefined" && humanOpen ? { id: jId, d: Math.round(depth), br: earthBranch } : null;
  box.innerHTML = G.map(g => (g.nm ? `<h4>${esc(g.nm)}</h4>` : "") + `<div class="mp-lvl">` + g.items.map((it, k) => {
      const here = cur && cur.id === it.id && cur.d === it.d && (!it.br || it.br === cur.br);
      return `<button class="mp-lvb${here ? " here" : ""}" data-lid="${it.id}" data-ld="${it.d}"${it.br ? ` data-lbr="${it.br}"` : ""} title="${esc(it.full)}" data-hover><i>${(g.nm ? k + 1 : it.d + 1)}</i>${esc(it.nm)}</button>`; }).join("") + `</div>`).join("");
  box.querySelectorAll(".mp-lvb").forEach(b => b.onclick = e => { e.stopPropagation(); toggleMenu(false);
    const st = { t:"j", id: b.dataset.lid, d: +b.dataset.ld, now:true }; if (b.dataset.lbr) st.br = b.dataset.lbr; RT.go(st); });
}
ST.forEach((s, i) => { const li = document.createElement("li"); li.className = "mp-st"; li.dataset.i = i; li.style.setProperty("--i", i);
  li.innerHTML = `<button class="mp-sb" data-hover><span class="n">${s.n}</span><span class="t">${esc(s.name)}<small>${esc(s.sub || "")}</small></span><span class="s">${esc(s.sc)}</span></button>`;
  li.querySelector("button").onclick = () => { toggleMenu(false); closeChapters(); goTo(i); };
  if (MP_LVN[i] > 1){
    // v179: раскрывающийся список слоёв станции (строится при первом раскрытии — к этому моменту все слои уже объявлены)
    li.classList.add("haslv");
    const tg = document.createElement("button"); tg.className = "mp-lvt mono"; tg.type = "button"; tg.setAttribute("aria-expanded", "false"); tg.setAttribute("data-hover", "");
    tg.setAttribute("aria-label", "Слои станции «" + s.name + "»"); tg.innerHTML = `слои · ${MP_LVN[i]} <span aria-hidden="true">▾</span>`;
    const pn = document.createElement("div"); pn.className = "mp-lv"; pn.innerHTML = `<div class="mp-lvin"></div>`;
    tg.onclick = e => { e.stopPropagation(); const on = !li.classList.contains("lvo"); li.classList.toggle("lvo", on); tg.setAttribute("aria-expanded", String(on));
      tg.querySelector("span").textContent = on ? "▴" : "▾"; if (on) mpLvFill(i, pn.firstChild); };
    li.appendChild(tg); li.appendChild(pn);
  }
  if (MP_BR[i]){ const br = document.createElement("div"); br.className = "mp-br"; MP_BR[i].forEach(id => br.appendChild($(id))); li.appendChild(br); }
  list.appendChild(li); });
const mpSpine = menu.querySelector(".mp-spine");
const mpSpan = el => { const s = el.dataset.span; if (!s) return []; const out = []; s.split(",").forEach(p => { const [a, z] = p.split("-").map(Number); for (let k = a; k <= (isNaN(z) ? a : z); k++) out.push(k); }); return out; };
menu.querySelectorAll(".mp-it[data-span]").forEach(el => {
  const on = new Set(mpSpan(el)), rng = el.querySelector(".mp-rng");
  if (rng) rng.innerHTML = ST.map((_, k) => `<b class="${on.has(k) ? "on" : ""}" title="${esc(ST[k].name)}"></b>`).join("");
  const hl = v => { mpSpine.classList.toggle("hl", v); list.querySelectorAll(".mp-st").forEach(li => li.classList.toggle("on", v && on.has(+li.dataset.i))); };
  el.addEventListener("pointerenter", () => hl(true)); el.addEventListener("pointerleave", () => hl(false));
  el.addEventListener("focus", () => hl(true)); el.addEventListener("blur", () => hl(false));
});
$("mSrch").onclick = () => SRCH.open();

