/* ---------- «Биосфера» (13а: каркас) ----------
   Своя сцена Three.js на #bioCv. Навигация — «Пласты камня»: колонна справа, колесо/стрелки — вниз, вглубь времени.
   Пласт сначала показан как порода с окаменелостями; потом частицы «поднимаются» из камня и собираются в живых
   существ («окаменелость → жизнь»), вокруг проявляется среда эпохи (море, болотный лес).
   Существа строятся из масок силуэтов BIO_MASK (RLE): точки выбираются по маске, объём — по расстоянию до края. */
/* ---------- v153: фильм эпохи ----------
   Только видео, без надписей. Первый и последний кадр совпадают с панорамой эпохи, поэтому вход и выход — растворение.
   Пока фильм на экране, сцены сайта не рисуются (FILM.opaque), музыка сайта молчит. */
const BIO_FILM = {
  cretaceous: { poster: "film/cretaceous_poster.webp", src: [
    ["film/cretaceous_1080_av1.mp4", 'video/mp4; codecs="av01.0.08M.10"', "av1"],
    ["film/cretaceous_1080_h264.mp4", 'video/mp4; codecs="avc1.640032"', "hd"],
    ["film/cretaceous_720_h264.mp4", 'video/mp4; codecs="avc1.64001f"', "sd"] ] }
};
const FILM = (() => {
  const box = $("film"), v = $("filmV"), snd = $("filmS"), bar = $("filmBar"), prog = $("filmP");
  let on = false, shownAt = 0, list = [], li = 0, idleT = 0, musWas = false, onClose = null, closing = 0;
  const small = () => Math.min(screen.width, screen.height)*(devicePixelRatio || 1) < 900 || (navigator.connection && navigator.connection.saveData);
  async function pick(F){
    let L = F.src.filter(([, t]) => v.canPlayType(t) !== "");
    if (L.some(s => s[2] === "av1") && navigator.mediaCapabilities){
      try { const r = await navigator.mediaCapabilities.decodingInfo({ type: "file", video: { contentType: 'video/mp4; codecs="av01.0.08M.10"', width: 1920, height: 1080, bitrate: 2500000, framerate: 24 } });
        if ((!r.supported || !r.powerEfficient) && L.some(s => s[2] !== "av1")) L = L.filter(s => s[2] !== "av1"); } catch(e){}   // без аппаратного AV1 — H.264, если он есть
    }
    if (small()) L.sort((a, b) => (a[2] === "sd" ? -1 : 0) - (b[2] === "sd" ? -1 : 0));
    return L.map(s => s[0]);
  }
  function next(){ if (li >= list.length){ close(); return; } v.src = list[li++]; v.load(); v.play().catch(() => {}); }
  v.addEventListener("error", () => { if (on) next(); });
  v.addEventListener("timeupdate", () => { if (v.duration) prog.style.width = (v.currentTime/v.duration*100).toFixed(2) + "%"; });
  v.addEventListener("ended", () => close());
  function wake(){ box.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => { if (on && !v.paused) box.classList.add("idle"); }, 2200); }
  async function open(id, cb){
    const F = BIO_FILM[id]; if (!F || on) return;
    on = true; onClose = cb || null; clearTimeout(closing);
    musWas = $("sound").getAttribute("aria-pressed") === "true"; if (musWas) Music.toggle(false);
    v.poster = F.poster; v.muted = false; snd.setAttribute("aria-pressed", "true"); prog.style.width = "0";
    box.setAttribute("aria-hidden", "false"); box.classList.add("on"); shownAt = performance.now(); wake();
    list = await pick(F); li = 0; next();
    setTimeout(() => $("filmX").focus({ preventScroll: true }), 50);
  }
  function close(){
    if (!on) return; on = false; box.classList.remove("on", "idle"); box.setAttribute("aria-hidden", "true");
    v.pause();
    closing = setTimeout(() => { v.removeAttribute("src"); v.load(); }, 950);   // освобождаем память декодера после растворения
    if (musWas) Music.toggle(true); musWas = false;
    if (onClose) onClose();
  }
  $("filmX").onclick = close;
  snd.onclick = () => { v.muted = !v.muted; snd.setAttribute("aria-pressed", String(!v.muted)); };
  v.addEventListener("click", () => { if (v.paused) v.play().catch(() => {}); else v.pause(); wake(); });
  bar.addEventListener("click", e => { const r = bar.getBoundingClientRect(); if (v.duration) v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left)/r.width))*v.duration; wake(); });
  box.addEventListener("pointermove", wake);
  v.addEventListener("pause", () => box.classList.remove("idle"));
  addEventListener("keydown", e => {
    if (!on) return;
    if (e.key === "Escape"){ close(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === " " || e.key === "k"){ if (v.paused) v.play().catch(() => {}); else v.pause(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === "m"){ snd.click(); e.stopPropagation(); }
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft"){ if (v.duration) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + (e.key === "ArrowRight" ? 5 : -5))); e.preventDefault(); e.stopPropagation(); }
    else if (e.key !== "Tab") e.stopPropagation();
    wake();
  }, true);
  addEventListener("wheel", e => { if (on) e.stopPropagation(); }, { capture: true, passive: true });
  return {
    open, close, has: id => !!BIO_FILM[id],
    get on(){ return on; },
    // полотно уже закрыло сайт — сцены можно не рисовать
    get opaque(){ return on && performance.now() - shownAt > 950; }
  };
})();

