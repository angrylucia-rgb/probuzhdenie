// v181: адреса мест. Где мы — пишется в адрес после «#»: #/j/earth/4 (слой станции), #/j/earth/9?br=litho (ветка),
// #/bio?bm=2 (биом), #/cal/66000000 (календарь), #/tree/<id>, #/th/<id>, #/dm/3, #/s/5 (станция на кольце), #/in/5 (текст станции).
// Ссылкой можно поделиться; кнопка «Назад» браузера и жест «назад» на телефоне ходят по местам, а не уводят с сайта.
// Новое место (другая глава, станция-погружение, кольцо) — новая запись истории; смена слоя или события внутри — замена записи.
// Адрес разбирается строго: только известные виды мест, ключи и значения из списков сайта — иначе адрес игнорируется.
const NAVH = (() => {
  const POS = { j:["id","d"], cal:["ago"], tree:["id"], th:["id"], dm:["n"], bio:[], path:[], s:["i"], po:["i"], in:["i"], ref:["tab"], compass:[], mine:[], routes:[], iz:[], fly:["d"], sky:["d"] };
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const ID = v => typeof v === "string" && /^[\w>.-]{1,48}$/.test(v) && !(v in Object.prototype);
  const INT = (v, a, b) => { const n = Number(v); return v !== "" && Number.isInteger(n) && n >= a && n <= b ? n : null; };
  let framed = true; try { framed = window.top !== window.self; } catch(e){}
  const tabs = () => [...document.querySelectorAll(".reftab[data-tab]")].map(b => b.dataset.tab);
  function here(){
    if (IZ.active) return { t:"iz" };
    if (CP.on) return { t:"compass" };
    if (MINE.on) return { t:"mine" };
    if (chRoutes.classList.contains("open")) return { t:"routes" };
    if (refOpen){ const b = document.querySelector(".reftab.on"); return { t:"ref", tab: b ? b.dataset.tab : "guide" }; }
    const o = navHere();
    if (o){ const r = {}; for (const k in o) if (k !== "k" && k !== "nm" && o[k] != null) r[k] = o[k];
      if (r.t === "cal") r.ago = Number(Math.max(0, r.ago).toPrecision(4));
      if (r.t === "j" && r.id === "earth" && r.d < 7) delete r.br;   // до развилки ветка не важна
      return r; }
    if (insideOpen && diveSt >= 0) return { t:"in", i: diveSt };
    const r = Math.round(target); if (r < 0) return null;
    const so = stopOf(mod(r, 14)); return so.st != null ? { t:"s", i: so.st } : { t:"po", i: so.po };
  }
  function enc(o){
    if (!o || !POS[o.t]) return "";
    const P = POS[o.t]; let h = "#/" + o.t, gap = false;
    for (const k of P){ if (o[k] == null){ gap = true; continue; } if (gap) break; h += "/" + encodeURIComponent(o[k]); }
    const q = Object.keys(o).filter(k => k !== "t" && o[k] != null && (!P.includes(k) || gap && h.split("/").length - 2 <= P.indexOf(k))).map(k => k + "=" + encodeURIComponent(o[k]));
    return q.length ? h + "?" + q.join("&") : h;
  }
  function check(o){
    const t = o.t, r = { t };
    if (t === "j"){
      if (!ID(o.id) || !own(JOURNEYS, o.id)) return null; r.id = o.id;
      if (o.br != null){ if (o.id !== "earth" || !["litho", "bio"].includes(o.br)) return null; r.br = o.br; }
      const n = o.id === "earth" ? (r.br === "bio" ? 7 + BIO_LVS.length : ELV.length) : JOURNEYS[o.id].levels().length;
      r.d = o.d == null ? (JOURNEYS[o.id].start || 0) : INT(o.d, 0, n - 1); if (r.d == null) return null;
      if (o.id === "earth" && r.d >= 7 && !r.br) r.br = "litho";
    }
    else if (t === "cal"){ const a = Number(o.ago); if (o.ago == null || o.ago === "" || !isFinite(a) || a < 0 || a > 2e10) return null; r.ago = a; }
    else if (t === "tree"){ if (o.id != null){ if (!ID(o.id)) return null; r.id = o.id; } }
    else if (t === "th"){ if (o.id != null){ if (!ID(o.id)) return null; r.id = o.id; } if (o.br != null){ if (!ID(o.br) || !o.br.includes(">")) return null; r.br = o.br; } }
    else if (t === "dm"){ r.n = INT(o.n, 0, DIM_STEPS.length - 1); if (r.n == null) return null; }
    else if (t === "bio"){
      if (o.bm != null){ r.bm = INT(o.bm, 0, BIO_BIOMES.length - 1); if (r.bm == null) return null; }
      else if (o.e != null){ if (!ID(o.e) || !BIO_ERAS.some(x => x.id === o.e)) return null; r.e = o.e; } }
    else if (t === "s" || t === "in"){ r.i = INT(o.i, 0, ST.length - 1); if (r.i == null) return null; }
    else if (t === "po"){ r.i = INT(o.i, 0, 1); if (r.i == null) return null; }
    else if (t === "ref"){ const tb = o.tab == null ? "guide" : o.tab; if (!tabs().includes(tb)) return null; r.tab = tb; }
    else if (t === "fly"){ if (o.d != null){ if (!ID(o.d) || FLY.idx(o.d) < 0) return null; r.d = o.d; } if (o.v != null){ if (!ID(o.v) || FLY.vdx(o.v) < 0) return null; r.v = o.v; } }
    else if (t === "sky"){ if (o.d != null){ if (!ID(o.d) || o.d !== "born" && FLY.idx(o.d) < 0) return null; r.d = o.d; } }
    else if (!["path", "compass", "mine", "routes", "iz"].includes(t)) return null;
    return r;
  }
  function dec(h){
    try {
      const m = /^#\/([a-z]{1,8})((?:\/[^/?#]*)*)\/?(?:\?([^#]*))?$/.exec(h || ""); if (!m || !own(POS, m[1])) return null;
      const P = POS[m[1]], o = { t: m[1] }, parts = m[2] ? m[2].split("/").slice(1) : [];
      if (parts.length > P.length) return null;
      parts.forEach((v, i) => { o[P[i]] = decodeURIComponent(v); });
      if (m[3]) for (const kv of m[3].split("&")){ const j = kv.indexOf("="), k = j < 0 ? kv : kv.slice(0, j); if (!/^[a-z]{1,4}$/.test(k) || own(o, k)) return null; o[k] = j < 0 ? "" : decodeURIComponent(kv.slice(j + 1)); }
      return check(o);
    } catch(e){ return null; }
  }
  const kind = h => { const m = /^#\/([a-z]+)(?:\/([^/?]*))?/.exec(h); if (!m) return "ring"; return m[1] === "s" || m[1] === "po" ? "ring" : m[1] === "j" ? "j/" + m[2] : m[1]; };
  let lastH = location.hash || "", cand = null, candN = 0, hold = 0, softNext = false;
  function write(h, push){
    const url = location.pathname + location.search + h;   // полный путь: на /en/ стоит <base href="/">, относительный «#…» увёл бы на русскую версию
    try { if (push && !framed) history.pushState({ cosmo: 1 }, "", url); else history.replaceState(history.state, "", url); } catch(e){}
  }
  function sync(force){
    if (!force && (performance.now() < hold || tr || zm || bhDv)) return;   // идёт переход
    const o = here();
    if (!force && (!o || o.t === "s" || o.t === "po") && (pendingDive || Math.abs(pos - target) > .03)) return;   // кольцо ещё крутится
    const h = enc(o);
    if (!force){ if (h !== cand){ cand = h; candN = 0; return; } if (++candN < 1) return; }   // место устоялось ≈0,7 с — без промежуточных кадров переходов
    if (h === lastH) return;
    const push = !softNext && kind(h) !== kind(lastH);
    softNext = false; lastH = h; write(h, push);
  }
  function apply(o){
    hold = performance.now() + 1500; softNext = true; cand = null;
    if (IZ.active){ dispatchEvent(new KeyboardEvent("keydown", { key:"Escape" })); return; }   // «Назад» в Изнанке — выход, как по Esc
    NAV_SKIP = true;
    if (!o || o.t !== "in") pendingDive = null;   // отложенный «нырок» к станции из прежнего места больше не нужен
    try {
      if (!o || o.t === "s" || o.t === "po"){
        surface(); toggleMenu(false); closeChapters();
        if (!o){ target = -1; travel = true; lastInput = performance.now(); }
        else if (o.t === "s") goTo(o.i);
        else { const u = o.i ? 13 : 7, r = Math.round(Math.max(0, pos)), d0 = mod(u - mod(r, 14), 14); target = r + (d0 > 7 ? d0 - 14 : d0); travel = true; lastInput = performance.now(); }
      }
      else if (o.t === "ref") openRef(o.tab);
      else if (o.t === "compass") openCompass();
      else if (o.t === "mine") openMine();
      else if (o.t === "routes") openRouteList();
      else if (o.t === "iz") RT.go({ t:"j", id:"bh", d:0, now:true });   // в Изнанку по ссылке не бросаем: вспышки — только по собственному шагу
      else RT.go(Object.assign({ now:true }, o));
    } catch(e){ console.warn("[nav]", e); }
    finally { NAV_SKIP = false; }
  }
  addEventListener("popstate", () => { if (location.hash === lastH) return; const o = dec(location.hash); lastH = o ? location.hash : ""; if (!o && location.hash) write("", false); apply(o); });
  // кнопка «Ссылка на это место» в шапке меню (в артефакте её нет: там адрес — внутренний адрес рамки)
  const sb = $("mpShare");
  if (framed){ if (sb) sb.remove(); }
  else if (sb) sb.onclick = async () => {
    sync(true); const url = location.href, lbl = sb.innerHTML;
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch(e){}
    if (!ok && navigator.share){ try { await navigator.share({ url, title: document.title }); return; } catch(e){ return; } }
    sb.textContent = ok ? "Скопировано ✓" : "Адрес — в строке браузера"; sb.classList.toggle("ok", ok);
    setTimeout(() => { sb.innerHTML = lbl; sb.classList.remove("ok"); }, 1800);
  };
  return {
    start(){
      const o = dec(location.hash);
      if (location.hash && !o){ write("", false); lastH = ""; }
      if (o) setTimeout(() => apply(o), 700);   // после заставки: станции уже построены
      setInterval(sync, 350);
    },
    dbg: { here, enc, dec, sync }
  };
})();
NAVH.start();
requestAnimationFrame(t => { last = t; loop(t); });
setTimeout(() => $("loader").classList.add("done"), 250);
})();
</script>
