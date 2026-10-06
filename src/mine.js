/* ---------- «Моя астролябия» (новый блок, этап 3, подэтап 10в) ----------
   Личная карта пройденного из журнала (jrLoad): кольцо станций — пройденные светятся, внутри — слои погружений,
   снаружи — практики за 28 дней; счётчики открытого; «Ещё не были»; лента «Мой путь» по дням; скачать и стереть.
   Всё хранится только в браузере читателя. Никаких очков и рейтингов — карта, а не соревнование. */
const MINE = (() => {
  const box = $("chMine"), body = $("mnBody");
  let open = false, confirmClear = false;
  const MON = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  const dayName = d => { const [y, m, dd] = d.split("-").map(Number); const t = jrDay(Date.now()), yst = jrDay(Date.now() - 864e5);
    return d === t ? "Сегодня" : d === yst ? "Вчера" : `${dd} ${MON[m - 1]}${y !== new Date().getFullYear() ? " " + y : ""}`; };
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return n + " " + (m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c); };
  // все слои погружений по станциям: [{key, name, st}]
  function allLayers(){
    const out = [];
    for (const id of Object.keys(JOURNEYS)){
      let L; try { L = JOURNEYS[id].levels(); } catch(e){ continue; }
      L.forEach((v, d) => { if (v) out.push({ key: id + ":" + d, st: JOURNEYS[id].st, id, d }); });
      if (id === "earth" && !L.includes(BIO_LV)) out.push({ key: "earth:7b", st: 5, id, d: 7, bio: true });
    }
    return out;
  }
  function stats(db){
    const S = db.seen, has = k => !!S[k], cnt = p => Object.keys(S).filter(k => k.startsWith(p)).length;
    const lay = allLayers();
    const layDone = lay.filter(l => has("lv:" + l.key)).length;
    const routes = ROUTES.filter(r => has("rtd:" + r.id)).length;
    const pracDays = new Set(db.prac.map(p => jrDay(p.t))).size;
    return { lay, rows: [
      ["Станции кольца", ST.filter((s, i) => has("st:" + i)).length, 12],
      ["Слои погружений", layDone, lay.length],
      ["События календаря", cnt("ev:"), CHR_EV.length],
      ["Группы Древа жизни", cnt("tr:"), TREE_ROWS.length],
      ["Фигуры «Нити мысли»", cnt("fg:"), TH_FIG.length],
      ["Мосты через реку", cnt("br:"), TH_BR.length],
      ["Пласты «Биосферы»", BIO_ERAS.filter(E => has("bio:" + E.id)).length, BIO_ERAS.length],
      ["Портреты существ", cnt("bio:sp:"), Object.keys(BIO_SP).length],
      ["Опыты, темы и биомы", cnt("bio:mech:") + cnt("bio:basics:") + cnt("bio:biome:"), BIO_MECH.length + BIO_BASICS.length + BIO_BIOMES.length],
      ["Ступени лестницы измерений", [0, 1, 2, 3, 4, 5, 6, 7].filter(n => has("dm:" + n)).length, 8],
      ["Маршруты пройдены до конца", routes, ROUTES.length]
    ], prac: db.prac.length, pracDays, days: Object.keys(db.days).length };
  }
  // ---- кольцо ----
  function ring(db, lay){
    const S = db.seen, C = 220, R = 148, NS = "";
    let h = `<svg viewBox="0 0 440 440" class="mn-ring" role="img" aria-label="Кольцо станций: пройденные светятся">`;
    h += `<circle cx="${C}" cy="${C}" r="${R}" class="mn-orb"/><circle cx="${C}" cy="${C}" r="${R - 40}" class="mn-orb2"/><circle cx="${C}" cy="${C}" r="196" class="mn-orb3"/>`;
    // практики за 28 дней — дуги снаружи, сегодня наверху, раньше — по часовой стрелке назад
    const pd = {}; db.prac.forEach(p => { const d = jrDay(p.t); pd[d] = (pd[d] || 0) + 1; });
    for (let k = 0; k < 28; k++){
      const d = jrDay(Date.now() - k*864e5), n = pd[d] || 0, a0 = (-90 - k*12.857 - 5)*Math.PI/180, a1 = (-90 - k*12.857 + 5)*Math.PI/180, r = 196;
      const x0 = C + Math.cos(a0)*r, y0 = C + Math.sin(a0)*r, x1 = C + Math.cos(a1)*r, y1 = C + Math.sin(a1)*r;
      h += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" class="mn-day${n ? " on" : ""}" style="${n ? `opacity:${Math.min(1, .45 + .2*n)}` : ""}"><title>${dayName(d)}: ${n ? plural(n, "практика", "практики", "практик") : "без практики"}</title></path>`;
    }
    for (let i = 0; i < 12; i++){
      const a = (-90 + i*30)*Math.PI/180, x = C + Math.cos(a)*R, y = C + Math.sin(a)*R;
      const mine = lay.filter(l => l.st === i), done = mine.filter(l => S["lv:" + l.key]).length, c = (S["st:" + i] || {}).c || 0;
      const k = Math.min(1, (c + done*.6)/6), col = FXC[i];
      // слои станции — точки на внутренней дуге
      mine.forEach((l, j) => {
        const row = Math.floor(j/8), col8 = j % 8, nRow = Math.min(8, mine.length - row*8);
        const da = (col8 - (nRow - 1)/2)*3.2, rr = R - 26 - row*9, aa = a + da*Math.PI/180;
        h += `<circle cx="${(C + Math.cos(aa)*rr).toFixed(1)}" cy="${(C + Math.sin(aa)*rr).toFixed(1)}" r="2.1" class="mn-lv${S["lv:" + l.key] ? " on" : ""}" style="${S["lv:" + l.key] ? `fill:${col}` : ""}"/>`;
      });
      h += `<g class="mn-st${c ? " on" : ""}" data-st="${i}" tabindex="0" role="button" aria-label="${esc(ST[i].name)}: ${c ? "посещена " + plural(c, "раз", "раза", "раз") : "ещё не посещена"}">`;
      if (c) h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(14 + 10*k).toFixed(1)}" fill="${col}" class="mn-halo" style="opacity:${(.12 + .3*k).toFixed(2)}"/>`;
      h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${c ? 7 + 3*k : 6}" class="mn-dot" style="${c ? `fill:${col};stroke:${col}` : ""}"/>`;
      const lx = C + Math.cos(a)*(R + 24), ly = C + Math.sin(a)*(R + 24) + 4;
      h += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${Math.abs(Math.cos(a)) < .3 ? "middle" : Math.cos(a) > 0 ? "start" : "end"}" class="mn-num">${ST[i].n}</text>`;
      h += `<title>${esc(ST[i].name)} — ${c ? plural(c, "посещение", "посещения", "посещений") : "ещё не были"} · слоёв ${done} из ${mine.length}</title></g>`;
    }
    h += `<text x="${C}" y="${C - 8}" text-anchor="middle" class="mn-c1">${Object.keys(db.days).length}</text><text x="${C}" y="${C + 14}" text-anchor="middle" class="mn-c2">${Object.keys(db.days).length === 1 ? "день" : "дней"} на пути</text>`;
    return h + "</svg>";
  }
  // ---- «Ещё не были» ----
  function nextUp(db){
    const S = db.seen, out = [], pick = a => a[Math.floor(Math.random()*a.length)];
    const st = ST.map((s, i) => i).filter(i => !S["st:" + i]);
    if (st.length){ const i = pick(st); out.push({ ty:"Станция", nm: ST[i].name, go: () => RT.go({ t:"j", id: jidOf(i), d:0 }) }); }
    const br = TH_BR.filter(b => !S["br:" + b.a + ">" + b.b]);
    if (br.length){ const b = pick(br); out.push({ ty:"Мост через реку", nm: b.nm, go: () => RT.go({ t:"th", br: b.a + ">" + b.b }) }); }
    const rt = ROUTES.filter(r => !S["rtd:" + r.id]);
    if (rt.length){ const r = pick(rt); out.push({ ty:"Маршрут", nm: r.nm, go: () => RT.start(r.id) }); }
    if (out.length < 3){ const ev = CHR_EV.filter(e => !S["ev:" + e.id]); if (ev.length){ const e = pick(ev); out.push({ ty:"Календарь", nm: e.nm, go: () => RT.go({ t:"cal", ago: e.ago }) }); } }
    if (out.length < 3){ const be = BIO_ERAS.filter(E => !S["bio:" + E.id]); if (be.length){ const E = pick(be); out.push({ ty:"Пласт «Биосферы»", nm: E.nm, go: () => RT.go({ t:"bio", e: E.id }) }); } }
    if (out.length < 3){ const tr = TREE_ROWS.filter(r => !S["tr:" + r[0]]); if (tr.length){ const r = pick(tr); out.push({ ty:"Древо жизни", nm: r[2], go: () => RT.go({ t:"tree", id: r[0] }) }); } }
    return out.slice(0, 3);
  }
  // ---- лента по дням ----
  function journalEntries(){
    const out = [];
    for (let i = 0; i < 12; i++){
      let tx = "", t = 0; try { tx = localStorage.getItem("astro-journal-" + i) || ""; t = +(localStorage.getItem("astro-journal-t-" + i) || 0); } catch(e){}
      if (tx.trim()) out.push({ i, tx: tx.trim(), t });
    }
    return out;
  }
  function compassRuns(){ try { return JSON.parse(localStorage.getItem("astro-compass") || "[]"); } catch(e){ return []; } }
  const KN = { st:["станция","станции","станций"], lv:["слой","слоя","слоёв"], ev:["событие","события","событий"], tr:["группа Древа","группы Древа","групп Древа"], fg:["фигура","фигуры","фигур"], br:["мост","моста","мостов"], bio:["страница «Биосферы»","страницы «Биосферы»","страниц «Биосферы»"] };
  function feed(db){
    const days = {}, add = (d, it) => (days[d] = days[d] || []).push(it);
    db.prac.forEach(p => add(jrDay(p.t), { t: p.t, h: `<span class="mn-ic">◎</span> ${esc(p.n)} — до конца` }));
    Object.entries(db.seen).forEach(([k, e]) => { if (k.startsWith("rtd:") && e.l) add(jrDay(e.l), { t: e.l, h: `<span class="mn-ic">✓</span> Маршрут «${esc(e.n)}» пройден` }); });
    compassRuns().forEach(c => add(jrDay(c.d), { t: c.d, h: `<span class="mn-ic">✧</span> Компас пути: ${esc(c.steps.slice(0, 3).join(" → "))}${c.steps.length > 3 ? " …" : ""}` }));
    const undated = [];
    journalEntries().forEach(j => { const it = { t: j.t, h: `<span class="mn-ic">✎</span> Дневник станции «${esc(ST[j.i].short)}»: <q>${esc(j.tx.length > 220 ? j.tx.slice(0, 220) + "…" : j.tx)}</q>` }; if (j.t) add(jrDay(j.t), it); else undated.push(it); });
    // открытое впервые — одной строкой на день
    const first = {}; Object.entries(db.seen).forEach(([k, e]) => { if (!e.f) return; const kind = k.split(":")[0]; if (!KN[kind]) return; const d = jrDay(e.f); (first[d] = first[d] || {})[kind] = (first[d][kind] || 0) + 1; });
    Object.entries(first).forEach(([d, m]) => add(d, { t: 0, h: `<span class="mn-ic">+</span> Открыто впервые: ${Object.entries(m).map(([kd, n]) => plural(n, ...KN[kd])).join(", ")}` }));
    const keys = Object.keys(days).sort().reverse().slice(0, 21);
    let h = keys.map(d => `<div class="mn-day-b"><h4>${dayName(d)}</h4><ul>${days[d].sort((a, b) => b.t - a.t).map(it => `<li>${it.h}</li>`).join("")}</ul></div>`).join("");
    if (undated.length) h += `<div class="mn-day-b"><h4>Записи дневника без даты</h4><ul>${undated.map(it => `<li>${it.h}</li>`).join("")}</ul></div>`;
    return h || `<p class="mn-empty">Здесь появится ваш путь: станции, практики, записи дневника, пройденные маршруты. Начните с любой станции — или с <button class="tm-link" id="mnCp" data-hover>Компаса пути</button>.</p>`;
  }
  // ---- текст для скачивания ----
  function exportText(db, st){
    const L = [`Моя астролябия · «Пробуждение» · ${dayName(jrDay(Date.now()))} (${jrDay(Date.now())})`, ""];
    L.push("ПРОЙДЕНО"); st.rows.forEach(([n, a, b]) => L.push(`  ${n}: ${a} из ${b}`)); L.push(`  Практики до конца: ${st.prac}, дней с практикой: ${st.pracDays}`, "");
    const j = journalEntries();
    if (j.length){ L.push("ДНЕВНИК СТАНЦИЙ"); j.forEach(e => { L.push(`  ${ST[e.i].n} · ${ST[e.i].name}${e.t ? " — " + jrDay(e.t) : ""}`, `  Вопрос: ${ST[e.i].q}`, ...e.tx.split("\n").map(x => "    " + x), ""); }); }
    if (db.prac.length){ L.push("ПРАКТИКИ"); db.prac.slice().reverse().forEach(p => L.push(`  ${jrDay(p.t)} — ${p.n}`)); L.push(""); }
    const done = Object.entries(db.seen).filter(([k]) => k.startsWith("rtd:"));
    if (done.length){ L.push("МАРШРУТЫ"); done.forEach(([k, e]) => L.push(`  ${e.n}${e.l ? " — " + jrDay(e.l) : ""}`)); L.push(""); }
    const fg = Object.entries(db.seen).filter(([k]) => k.startsWith("fg:") || k.startsWith("br:"));
    if (fg.length){ L.push("НИТЬ МЫСЛИ — ОТКРЫТЫЕ ФИГУРЫ И МОСТЫ"); L.push("  " + fg.map(([k, e]) => e.n).join(" · ")); L.push(""); }
    L.push("Хранится только в вашем браузере. Этот файл — ваша копия.");
    return L.join("\n");
  }
  async function download(db, st){
    const txt = exportText(db, st), fn = `moy-put-${jrDay(Date.now())}.txt`, msg = $("mnDlMsg");
    let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null; } catch(e){}
    if (dl){
      try { await dl.save({ filename: fn, data: txt }); msg.textContent = "Готово"; }
      catch(e){ msg.textContent = e && e.code === "declined" ? "Скачивание отменено" : "Скачать здесь не получилось"; }
      return;
    }
    try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type:"text/plain;charset=utf-8" })); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); msg.textContent = "Готово"; }
    catch(e){ msg.textContent = "Скачать здесь не получилось"; }
  }
  // ---- экран ----
  function render(){
    const db = jrLoad(), st = stats(db), nx = nextUp(db);
    body.innerHTML = `<span class="mono eyebrow">Моя астролябия</span><h2>Карта пройденного</h2>
      <p class="mn-priv">Хранится только в этом браузере и никуда не отправляется. Здесь нет очков и рейтингов — это карта, а не соревнование.</p>
      <div class="mn-top">
        <div class="mn-ringw">${ring(db, st.lay)}<p class="mono mn-leg"><i class="l1"></i>станции и слои <i class="l2"></i>практики за 28 дней</p></div>
        <div class="mn-side">
          <ul class="mn-stats">${st.rows.map(([n, a, b]) => `<li><span>${esc(n)}</span><b>${a}<small> из ${b}</small></b><i style="--w:${(b ? a/b*100 : 0).toFixed(1)}%"></i></li>`).join("")}
            <li class="mn-pr"><span>Практики до конца</span><b>${st.prac}<small>${st.pracDays ? " · " + plural(st.pracDays, "день", "дня", "дней") : ""}</small></b></li></ul>
          ${nx.length ? `<h4>Ещё не были</h4><div class="mn-next">${nx.map((x, k) => `<button data-nx="${k}" data-hover><span class="mono">${esc(x.ty)}</span><b>${esc(x.nm)}</b></button>`).join("")}</div>` : `<h4>Вы прошли всё</h4><p class="mn-sm">Каждое место можно проходить снова — по-новому.</p>`}
        </div>
      </div>
      <h3 class="mn-h3">Мой путь</h3>
      <div class="mn-feed">${feed(db)}</div>
      <div class="mn-foot"><button class="btn" id="mnDl" data-hover>Скачать мой путь</button><span class="mono mn-msg" id="mnDlMsg" aria-live="polite"></span>
        <span class="mn-clr">${confirmClear ? `Стереть всё пройденное и дневник? <button class="tm-link mn-yes" id="mnYes" data-hover>Да, стереть</button><button class="tm-link" id="mnNo" data-hover>Нет</button>` : `<button class="tm-link" id="mnClear" data-hover>Стереть всё</button>`}</span></div>`;
    body.querySelectorAll(".mn-st").forEach(g => { const go = () => { close(); RT.go({ t:"j", id: jidOf(+g.dataset.st), d:0 }); }; g.onclick = go; g.onkeydown = e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); go(); } }; });
    body.querySelectorAll("[data-nx]").forEach(b => b.onclick = () => { const x = nx[+b.dataset.nx]; close(); x.go(); });
    const cp = $("mnCp"); if (cp) cp.onclick = () => { close(); openCompass(); };
    $("mnDl").onclick = () => download(db, st);
    const cl = $("mnClear"); if (cl) cl.onclick = () => { confirmClear = true; render(); };
    const y = $("mnYes"); if (y) y.onclick = () => { jrClear(); confirmClear = false; render(); };
    const n = $("mnNo"); if (n) n.onclick = () => { confirmClear = false; render(); };
  }
  function openM(){ closeChapters(); toggleMenu(false); surface(); open = mineOn = true; confirmClear = false; box.classList.add("open"); box.setAttribute("aria-hidden", "false"); render(); box.scrollTop = 0; $("mnClose").focus({ preventScroll:true }); }
  function close(){ if (!open) return; open = mineOn = false; box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); }
  $("mnClose").onclick = close;
  addEventListener("keydown", e => { if (open && e.key === "Escape"){ e.stopPropagation(); close(); } }, true);
  return { open: openM, close, get on(){ return open; } };
})();
function openMine(){ MINE.open(); }
function closeMine(){ MINE.close(); }
$("mMine").onclick = openMine;
