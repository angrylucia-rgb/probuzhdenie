/* ---------- интерфейс ---------- */
const stEl = $("st"), intro = $("intro"), count = $("count"), hint = $("hint"), portalEl = $("portal");
// v145: буквы поднимаются и на ходу «расшифровываются» — перебирают знаки и складываются в слово (≈ 0,5 с, только при смене заголовка)
const SCR_G = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ·∴∵◊○●◐";
function chars(el, text, base){
  el.innerHTML = ""; const all = [];
  text.split(" ").forEach((w, wi, arr) => {
    const wrap = document.createElement("span"); wrap.className = "chars";
    [...w].forEach((ch, k) => { const s = document.createElement("span"), dl = base + (wi*3 + k)*0.028; s.textContent = ch; s.style.animationDelay = dl + "s"; wrap.appendChild(s); all.push([s, ch, dl]); });
    el.appendChild(wrap); if (wi < arr.length - 1) el.appendChild(document.createTextNode(" "));
  });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !all.length) return;
  const t0 = performance.now(), tok = el._scr = {};
  (function step(now){ if (el._scr !== tok) return; const t = (now - t0)/1000; let busy = false;
    for (const [s, ch, dl] of all){ const end = dl + .38; if (t < end && ch.trim()){ busy = true; if (Math.random() < .5) s.textContent = SCR_G[Math.random()*SCR_G.length | 0]; } else if (s.textContent !== ch) s.textContent = ch; }
    if (busy) requestAnimationFrame(step); })(t0);
}
function refade(el, text){ el.textContent = text; el.classList.remove("fade"); void el.offsetWidth; el.classList.add("fade"); }
