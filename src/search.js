/* ---------- Поиск (новый блок, этап 1) ----------
   Ctrl+K, «/» или кнопка-лупа. Индекс собирается в браузере при первом открытии: станции кольца, слои всех
   погружений, события Космического календаря, группы Древа жизни, маршруты и главы. Без сервера. */
const SRCH = (() => {
  const norm = s => String(s || "").toLowerCase().replace(/ё/g, "е");
  const flat = x => Array.isArray(x) ? x.map(y => Array.isArray(y) ? y[1] : y).join(" ") : (x || "");
  let IDX = null;
  function build(){
    IDX = [];
    const add = (type, nm, ctx, text, act) => IDX.push({ type, nm, ctx, text, n: norm(nm), t: norm(nm + " " + ctx + " " + text), act });
    // станции кольца
    ST.forEach((r, i) => add("Станция", r.name, `${r.n} · ${r.scale || ""}`, [r.sub, r.short, flat(r.trad), flat(r.sci), r.prac, r.q].join(" "), () => RT.go({ t:"j", id: jidOf(i), d: 0 })));
    // слои погружений
    const JT = { abs:"Абсолют", g1:"Первоимпульс", g3:"Галактика", bh:"Чёрная дыра", g4:"Солнечная система", moon:"Луна", jup:"Юпитер и Европа", earth:"Земля", human:"Человек", dream:"Сон и сознание", g7:"Клетка", g9:"Кванты" };
    for (const id of Object.keys(JT)){
      let L; try { L = JOURNEYS[id].levels(); } catch(e){ continue; }
      if (!L || L.length < 2) continue;
      L.forEach((v, d) => {
        if (!v) return;
        let nm = v.name || v.short, more = "";
        if (v.kind === "kosha" && DATA.koshas[v.k]){ const k = DATA.koshas[v.k]; nm = k.name; more = [k.ru, k.what, k.tao, k.west, k.prac].join(" "); }
        if (v.kind === "chakras") more = DATA.centers.map(c => c.name + " " + c.i).join(" ");
        add("Слой", nm, JT[id], [v.short, v.sub, v.cat, v.lead, v.par, flat(v.sci), flat(v.trad), flat(v.prac), flat(v.ex), more].join(" "), () => RT.go({ t:"j", id, d }));
      });
    }
    try { add("Слой", BIO_LV.name, "Земля · Биосфера", [BIO_LV.lead, flat(BIO_LV.sci), flat(BIO_LV.trad), BIO_LV.par].join(" "), () => RT.go({ t:"j", id:"earth", d:7, br:"bio" })); } catch(e){}
    // календарь
    CHR_EV.forEach(e => add("Календарь", e.nm, "Космический календарь", [e.lead, e.art, flat(e.sci), flat(e.tr), e.pr].join(" "), () => RT.go({ t:"cal", ago: e.ago })));
    // древо
    TREE_ROWS.forEach(([id, , nm]) => { const I = TREE_INFO[id] || {}; add("Древо", nm.replace(" — общий предок", ""), "Древо жизни", [I.lead, I.art, flat(I.sci), flat(I.tr), I.inh].join(" "), () => RT.go({ t:"tree", id })); });
    // биосфера
    try {
      add("Глава", "Биосфера", "учебник жизни · пласты камня", "эволюция палеонтология окаменелости эпохи существа динозавры биология", () => openBio());
      BIO_ERAS.forEach(E => add("Биосфера", E.nm, "пласт · " + E.t, [E.sub, E.lead, E.what, E.inv, E.legacy, flat(E.sci)].join(" "), () => RT.go({ t:"bio", e: E.id })));
      Object.keys(BIO_SP).forEach(k => { const S = BIO_SP[k]; add("Существо", S.ru, S.lat + " · " + S.grp, [S.inv, S.wow, S.legacy, flat(S.sci)].join(" "), () => RT.go({ t:"bio", sp: k })); });
      BIO_MECH.forEach((M, i) => add("Биосфера", M.nm, "механизм эволюции", [M.sub, M.lead, M.how, M.nature].join(" "), () => RT.go({ t:"bio", m: i })));
      BIO_BASICS.forEach((M, i) => add("Биосфера", M.nm, "основы биологии", [M.sub, M.lead, M.how, M.nature].join(" "), () => RT.go({ t:"bio", b: i })));
      BIO_BIOMES.forEach((B, i) => add("Биосфера", B.nm, "биом Земли", [B.where, B.lead, B.who, B.wow, B.threat].join(" "), () => RT.go({ t:"bio", bm: i })));
    } catch(e){}
    // нить мысли
    TH_FIG.forEach(f => add("Нить мысли", f.nm, f.yr, [f.tg, f.pl, f.key, f.art.join(" ")].join(" "), () => openThought(f.id)));
    // маршруты и главы
    ROUTES.forEach(r => add("Маршрут", r.nm, `${r.steps.length} шагов`, r.sub + " " + r.steps.map(s => s.h + " " + s.tx).join(" "), () => RT.start(r.id)));
    add("Глава", "Путь из восьми этапов", "дыхание сердца", "узнать почувствовать прожить осмыслить практика дыхание", () => RT.go({ t:"path" }));
    add("Глава", "Изнанка", "вторая часть сайта", "опыт без слов звук цвет движение миры", () => RT.go({ t:"iz" }));
    add("Глава", "Космический календарь", "13,8 млрд лет в одном году", "календарь Саган время история", () => openTime());
    add("Глава", "Древо жизни", "4 млрд лет родства", "эволюция родство филогения виды", () => openTree());
    add("Глава", "Моя астролябия", "личная карта", "пройдено посещено дневник практики мой путь история", () => openMine());
    add("Глава", "Компас пути", "минута вопросов", "с чего начать маршрут на сегодня интерес состояние время практика", () => openCompass());
    add("Глава", "Лестница измерений", "0D → 6D", "измерения размерность точка линия плоскость пространство куб тессеракт четвертое измерение флатландия линляндия абботт хинтон тетрактида", () => openDims());
    add("Измерение", "Пространство-время", "Лестница измерений · 4D", [DIM_TIME.lead, DIM_TIME.see, flat(DIM_TIME.sci), DIM_TIME.trad.join(" "), DIM_TIME.views.map(v => v[1] + " " + v[2]).join(" "), "мировая линия блочная вселенная время четвёртое измерение вечность"].join(" "), () => { openDims(4); DIMS.lens("time"); });
    DIM_STEPS.forEach(st => add("Измерение", st.n < 7 ? st.n + "D · " + st.nm : "Эпилог лестницы измерений", "Лестница измерений", [st.sub, st.lead, st.see, flat(st.sci), st.trad.join(" "), st.prac.tx].join(" "), () => openDims(st.n)));
    add("Глава", "Нить мысли", "история идей", "опыт измерение философы мистики учёные история науки река", () => openThought());
    [["guide","Как пользоваться"],["rosetta","Розеттский камень"],["principles","Десять принципов"],["sounds","Звуки кольца"],["sources","Источники"]].forEach(([tab, nm]) => add("Справочник", nm, "Справочник", nm, () => openRef(tab)));
  }
  // ---- поиск: все слова запроса должны встретиться; имя весит больше текста ----
  function find(q){
    const ws = norm(q).split(/[\s,.;:!?«»"()—–-]+/).filter(w => w.length > 1);
    if (!ws.length) return [];
    const out = [];
    for (const d of IDX){
      if (!ws.every(w => d.t.includes(w))) continue;
      let sc = 0;
      for (const w of ws){ if (d.n.startsWith(w)) sc += 100; else if (d.n.includes(w)) sc += 60; else sc += 10; }
      sc += { "Станция":8, "Маршрут":7, "Глава":6, "Слой":5, "Древо":4, "Календарь":4, "Нить мысли":4, "Измерение":5, "Биосфера":4, "Существо":3, "Справочник":2 }[d.type] || 0;
      out.push([sc, d]);
    }
    return out.sort((a, b) => b[0] - a[0]).slice(0, 40).map(x => x[1]);
  }
  function snippet(d, q){
    const ws = norm(q).split(/\s+/).filter(w => w.length > 1), t = norm(d.text);
    let i = -1; for (const w of ws){ i = t.indexOf(w); if (i >= 0) break; }
    if (i < 0) return esc(d.text.slice(0, 120)) + (d.text.length > 120 ? "…" : "");
    const a = Math.max(0, i - 50), raw = d.text.slice(a, a + 150);
    let h = esc(raw);
    for (const w of ws){ const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/е/g, "[её]"), "gi"); h = h.replace(re, m => `<mark>${m}</mark>`); }
    return (a ? "…" : "") + h + (a + 150 < d.text.length ? "…" : "");
  }
  // ---- интерфейс ----
  const box = $("srch"), inp = $("srchIn"), res = $("srchRes");
  let items = [], hi = 0, open = false;
  function show(){
    const q = inp.value.trim();
    if (!q){
      items = ROUTES.map(r => IDX.find(d => d.type === "Маршрут" && d.nm === r.nm));
      res.innerHTML = `<p class="mono sr-hint">Маршруты — или начните вводить: «митохондрии», «Будда», «чёрная дыра», «сон»…</p>` + list(items, "");
    } else {
      items = find(q);
      res.innerHTML = items.length ? list(items, q) : `<p class="sr-none">Ничего не нашлось. Попробуйте другое слово или его начало.</p>`;
    }
    hi = 0; mark();
    res.querySelectorAll("[data-i]").forEach(b => { b.onclick = () => pick(+b.dataset.i); b.onmouseenter = () => { hi = +b.dataset.i; mark(); }; });
  }
  const list = (arr, q) => arr.map((d, i) => `<button class="sr-it" data-i="${i}" data-hover><span class="mono sr-ty">${esc(d.type)}</span><b>${esc(d.nm)}</b><span class="sr-ctx">${esc(d.ctx)}</span>${q ? `<span class="sr-sn">${snippet(d, q)}</span>` : ""}</button>`).join("");
  function mark(){ res.querySelectorAll("[data-i]").forEach(b => b.classList.toggle("on", +b.dataset.i === hi)); const el = res.querySelector(`[data-i="${hi}"]`); if (el) el.scrollIntoView({ block:"nearest" }); }
  function pick(i){ const d = items[i]; if (!d) return; close(); d.act(); }
  function openS(){ if (!IDX) build(); open = true; toggleMenu(false); box.classList.add("open"); box.setAttribute("aria-hidden", "false"); inp.value = ""; show(); setTimeout(() => inp.focus(), 30); }
  function close(){ open = false; box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); inp.blur(); }
  let tmo = 0;
  inp.addEventListener("input", () => { clearTimeout(tmo); tmo = setTimeout(show, 90); });
  inp.addEventListener("keydown", e => {
    if (e.key === "ArrowDown"){ e.preventDefault(); hi = Math.min(items.length - 1, hi + 1); mark(); }
    else if (e.key === "ArrowUp"){ e.preventDefault(); hi = Math.max(0, hi - 1); mark(); }
    else if (e.key === "Enter"){ e.preventDefault(); pick(hi); }
    else if (e.key === "Escape"){ e.preventDefault(); close(); }
    e.stopPropagation();
  });
  box.addEventListener("click", e => { if (e.target === box) close(); });
  addEventListener("keydown", e => {
    if (open) return;
    const typing = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
    if ((e.key === "k" || e.key === "K" || e.key === "л" || e.key === "Л") && (e.ctrlKey || e.metaKey)){ e.preventDefault(); openS(); }
    else if (e.key === "/" && !typing && !IZ.active){ e.preventDefault(); openS(); }
  }, true);
  $("btnSearch").onclick = openS;
  return { open: openS, close, find: q => { if (!IDX) build(); return find(q).map(d => d.type + ": " + d.nm); } };
})();
