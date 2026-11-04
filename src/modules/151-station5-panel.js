/* ---------- панель станции V ---------- */
const S_NUM = v => v.toString().replace(".", ",");
const S_YRS = a => { const y = Math.pow(a, 1.5);
  if (y < 1) return Math.round(y*365.25) + " земных суток";
  if (Math.abs(y - 1) < .05) return "1 земной год";
  const txt = S_NUM(y.toFixed(y < 100 ? 1 : 0)).replace(/,0$/, "");
  const n = Math.round(y), d10 = n % 10, d100 = n % 100;
  return txt + (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20) ? " земных года" : " земных лет"); };
const S_AU = a => S_NUM(a.toFixed(3)).replace(/0+$/, "").replace(/,$/, "");
const S_LIGHT = a => { const m = a*499/60;
  return m < 60 ? S_NUM(m.toFixed(m < 10 ? 1 : 0)) + " мин" : Math.floor(m/60) + " ч " + Math.round(m % 60) + " мин"; };

// орбита, год, радиус, свет — для карточки на обзоре и для слоя «Юпитер» ветки
function planetFacts(pl){
  return `<dl class="facts">
        <dt>Орбита</dt><dd>${S_AU(pl.a)} а.е. — ${Math.round(pl.a*149.6)} млн км от Солнца</dd>
        <dt>Год</dt><dd>${S_YRS(pl.a)}</dd>
        <dt>Радиус</dt><dd>${pl.rk.toLocaleString("ru-RU")} км — ${S_NUM((pl.rk/6371).toFixed(2))} земного</dd>
        <dt>Свет от Солнца</dt><dd>${S_LIGHT(pl.a)}</dd></dl>`;
}
// что показать в левой панели: карточку выбранного тела либо слой станции
function solarPanel(L){
  const sel = SOLAR ? SOLAR.sel : -1, tag = "Станция " + ST[4].n;
  if (sel >= 0){
    const pl = sel === 8 ? null : PLN[sel], key = pl ? pl.k : "bel";
    const nm = pl ? pl.nm : "Пояс астероидов", tx = PLN_TXT[key];
    const facts = pl ? planetFacts(pl) : "";
    return { eye:`${tag} · Солнечная система · ${nm}`, name:nm, sub:tx.sub,
      html:`<p class="hd-lead">${esc(tx.lead)}</p>${facts}`
        + listHTML("Наука", tx.sci) + listHTML("Традиции и эзотерика", tx.trad)
        + `<section><h3>Интересно</h3><p class="hd-par">${esc(tx.fun)}</p></section>`
        + `<p class="mono hd-try">Ведите курсором по планете — она откликнётся</p>`
        + `<p class="note">${mk("s")}<span>Голос планеты: ${esc(PLN_SND_TXT[key])}. Это синтез по характеру сонификаций NASA, а не сама запись.</span></p>`
        + (key === "ear" ? `<button class="hd-open" data-go="moon" data-hover>Луна — спутник Земли ↓</button>` : "")
        + `<button class="hd-open" id="solBack" data-hover>← Вернуться ко всей системе</button>` };
  }
  const v = SUNLV[L] || SUNLV[0];
  if (L >= 2){
    return { eye:`${tag} · Солнце · слой ${L + 1} из ${SUNLV.length} · ${v.scale}`, name:v.name, sub:v.sub,
      html:`<p class="hd-lead">${esc(v.lead)}</p><p class="mono hd-scale">${esc(v.scaleLabel || "Масштаб")} ${esc(v.scale)}</p>`
        + (v.hint ? `<p class="mono hd-try">${esc(v.hint)}</p>` : "")
        + listHTML("Наука", v.sci) + listHTML("Традиции и философия", v.trad)
        + `<section><h3>Параллель с человеком</h3><p class="hd-par">${esc(v.par)}</p></section>`
        + listHTML("Практики", v.prac, "d t") };
  }
  if (L >= 1){
    const r = DATA.ring[4];
    return { eye:`${tag} · Солнце · ${r.scale}`, name:r.name, sub:r.sub,
      html:`<p class="hd-lead">${esc(v.lead)}</p>` + listHTML("Традиции", r.trad) + listHTML("Наука", r.sci)
        + `<section><h3>Практика</h3><p class="hd-par">${esc(r.prac)}</p></section>`
        + `<section><h3>Вопрос</h3><p class="quote" style="font:22px/1.3 var(--display);color:var(--brass);margin:0">${esc(r.q)}</p></section>`
        + `<button class="hd-open" id="hdOpen" data-hover>Таймер практики и дневник станции →</button>` };
  }
  return { eye:`${tag} · Солнечная система · ${v.scale}`, name:v.name, sub:v.sub,
    html:`<p class="hd-lead">${esc(v.lead)}</p><p class="mono hd-try">${esc(v.hint)}</p>`
      + listHTML("Наука", v.sci) + listHTML("Традиции и философия", v.trad)
      + solarList()
      + `<section><h3>Практика</h3><p class="hd-par">${esc(v.prac)}</p></section>`
      + `<section><h3>Вопрос</h3><p class="quote" style="font:22px/1.3 var(--display);color:var(--brass);margin:0">${esc(v.q)}</p></section>` };
}

// Список тел в панели. Левая колонка перекрывает часть орбит, и планету, оказавшуюся под текстом,
// курсором не достать, — поэтому у каждой планеты есть и «текстовая» дверь
function solarList(){
  const row = (i, nm, col, im) => `<li><button data-p="${i}" data-hover><span class="dotc" style="background:${col};box-shadow:0 0 10px ${col}"></span><span class="nm">${nm}</span><span class="im">${im}</span></button></li>`;
  return `<section><h3>Тела системы</h3><ol class="hlist" id="solList">`
    + PLN.map((pl, i) => row(i, esc(pl.nm), "#" + pl.hal.toString(16).padStart(6, "0"),
        S_AU(pl.a) + " а.е. · " + S_YRS(pl.a))).join("")
    + row(8, "Пояс астероидов", "#8a7a62", "2,1–3,3 а.е. · Малдек")
    + `</ol></section>`
    + `<section><h3>Спутник Земли</h3><div class="hd-fork">`
    + `<button data-go="moon" data-hover><b>Луна</b><span>Рождение из удара · приливы · фазы и календари</span></button>`
    + `</div></section>`;
}

