/* ---------- условия использования (v164): плашка «Принимаю» и предупреждение перед практиками ---------- */
// Версия условий: при существенном изменении текста увеличить — плашка покажется снова
const TERMS_VER = "1.0";
const TERMS = (() => {
  const KEY = "cosmo-terms", get = () => { try { return localStorage.getItem(KEY); } catch(e){ return null; } };
  const waiters = []; let ok = get() === TERMS_VER;
  const done = () => { ok = true; try { localStorage.setItem(KEY, TERMS_VER); localStorage.setItem(KEY + "-at", new Date().toISOString()); } catch(e){} waiters.splice(0).forEach(f => f()); };
  const after = f => ok ? f() : waiters.push(f);
  if (!ok) setTimeout(() => {
    const t = document.createElement("div"); t.className = "terms-bar"; t.setAttribute("role", "dialog"); t.setAttribute("aria-label", "Условия использования");
    t.innerHTML = `<div>Пользуясь сайтом, вы принимаете <b>Пользовательское соглашение</b> и <b>отказ от ответственности</b>. Материалы — для ознакомления; практики не заменяют помощь врача. В некоторых разделах есть вспышки света. Сайт не собирает персональные данные. 12+</div><div class="tb-row"><button type="button" class="tb-ok" data-hover>Принимаю</button><button type="button" class="tb-read" data-hover>Читать условия</button></div>`;
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add("on"));
    t.querySelector(".tb-ok").onclick = () => { t.classList.remove("on"); setTimeout(() => t.remove(), 450); done(); };
    t.querySelector(".tb-read").onclick = () => openLegal("lg-terms");
  }, 2500);
  return { after, get ok(){ return ok; }, accept: done };
})();
function healthOk(){ try { return localStorage.getItem("cosmo-health") === "1"; } catch(e){ return false; } }
function healthAsk(go){
  if (document.querySelector(".hg")) return;
  const w = document.createElement("div"); w.className = "hg"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true");
  w.innerHTML = `<div class="hg-box"><h3>Перед практикой</h3><p>Практики на сайте — не лечение и не замена помощи врача или психотерапевта. Посоветуйтесь с врачом, если у вас:</p><ul><li>беременность, болезни сердца и сосудов, повышенное давление;</li><li>эпилепсия, болезни органов дыхания, недавние операции;</li><li>психические расстройства (психозы, биполярное расстройство, тяжёлая депрессия, ПТСР).</li></ul><p>Остановитесь при головокружении, боли, нехватке воздуха или страхе. Не выполняйте практики за рулём и в воде. Вы выполняете их добровольно и под свою ответственность.</p><div class="tb-row"><button type="button" class="tb-more" data-hover>Подробнее</button><button type="button" class="tb-no" data-hover>Отмена</button><button type="button" class="tb-ok" data-hover>Понимаю, начать</button></div></div>`;
  document.body.appendChild(w);
  const close = () => w.remove();
  w.querySelector(".tb-no").onclick = close;
  w.querySelector(".tb-more").onclick = () => { close(); openLegal("lg-disc"); };
  w.querySelector(".tb-ok").onclick = () => { try { localStorage.setItem("cosmo-health", "1"); } catch(e){} if (!TERMS.ok) TERMS.accept(); close(); go(); };
  w.addEventListener("click", e => { if (e.target === w) close(); });
  w.querySelector(".tb-ok").focus();
}

