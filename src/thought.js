/* ---------- «Нить мысли» — река идей (подэтап 9а) ----------
   2D-река в SVG: верхний берег «Опыт», нижний «Измерение» (на узком экране — вертикально: время сверху вниз,
   «Опыт» слева). Ось времени нелинейная. Нити — влияние вдоль берега. Колесо/щипок — масштаб, перетаскивание — сдвиг. */
const CTH = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const box = $("chThought"), svg = $("thSvg"), cardEl = $("thCard"), scr = $("thScroll"), pnl = box.querySelector(".time-in");
  const F = TH_FIG.slice().sort((a, b) => a.y - b.y || (a.b < b.b ? -1 : 1)), BY = {};
  F.forEach((f, i) => { BY[f.id] = f; f.i = i; f.out = []; f.inn = []; });
  const TH = TH_THR.map(([a, b, n]) => ({ a: BY[a], b: BY[b], n }));
  TH.forEach(t => { t.a.out.push(t); t.b.inn.push(t); });
  F.forEach(f => f.br = []);
  const BR = TH_BR.map(r => ({ ...r, A: BY[r.a], B: BY[r.b] })).sort((x, y) => x.B.y - y.B.y || x.A.y - y.A.y);
  BR.forEach((r, i) => { r.i = i; r.A.br.push(r); r.B.br.push(r); });
  const MK = { full:'<svg class="th-ic" viewBox="-6 -6 12 12" aria-label="●"><circle r="4.6" fill="none" stroke="currentColor"/><circle r="2.8" fill="currentColor"/></svg>',
               half:'<svg class="th-ic" viewBox="-6 -6 12 12" aria-label="◐"><circle r="4.6" fill="none" stroke="currentColor"/><path d="M0 -2.8A2.8 2.8 0 0 1 0 2.8Z" fill="currentColor"/></svg>' };
  // короткие подписи на реке
  const SH = { bud:"Будда", dal:"Далай-лама", ram:"Рамана Махарши", ava:"Сеть Индры", dna:"Двойная спираль", dmn:"Сеть покоя мозга", med:"Медитация в лаборатории",
    lig:"LIGO", sol:"Вл. Соловьёв", eck:"Экхарт", cus:"Кузанский", tei:"Тейяр де Шарден", viv:"Вивекананда", iar:"Ибн Араби", hay:"Ибн аль-Хайсам", rum:"Руми",
    jun:"Юнг", jam:"У. Джеймс", far:"Фарадей и Максвелл", lem:"Леметр и Хаббл", bel:"Белл и Аспе", cmb:"Пензиас и Уилсон", bab:"Вавилон", ars:"Аристарх",
    lao:"Лао-цзы", zhu:"Чжуан-цзы", upa:"Упанишады", pat:"Патанджали", rig:"Ригведа", ich:"И-цзин", goe:"Гёте", sch:"Шопенгауэр", tsi:"Циолковский",
    chz:"Чижевский", ver:"Вернадский", flo:"Флоренский", fed:"Н. Фёдоров", lom:"Ломоносов", men:"Менделеев", pln:"Планк", shr:"Шрёдингер", hei:"Гейзенберг",
    mar:"Маргулис", rov:"Ровелли", pen:"Пенроуз", bom:"Бом", pau:"Паули", boh:"Бор", ein:"Эйнштейн", bol:"Больцман", dar:"Дарвин", dlt:"Дальтон", lei:"Лейбниц",
    new:"Ньютон", gal:"Галилей", kep:"Кеплер", cop:"Коперник", hip:"Гиппарх", era:"Эратосфен", spi:"Спиноза", bru:"Бруно", shn:"Шанкара", plo:"Плотин",
    nag:"Нагарджуна", luc:"Лукреций", epi:"Эпикур", ari:"Аристотель", pla:"Платон", dem:"Демокрит", par:"Парменид", her:"Гераклит", pyt:"Пифагор",
    anx:"Анаксимандр", zar:"Заратустра", abb:"Абботт", usp:"Успенский", hin:"Хинтон", mnk:"Минковский", kal:"Калуца", kle:"Клейн", yau:"Калаби и Яу" };
  // вес: крупные фигуры получают подпись первыми
  const BIG = new Set(["upa","bud","lao","pyt","pla","dem","her","nag","plo","cop","kep","gal","new","dar","ein","boh","shr","ver","sch","jun","dna","lem","rig","ari","spi","men","tsi"]);
  // короткие годы под подписью
  const YS = { bab:"VIII–IV вв. до н. э.", zar:"дата спорна", upa:"VIII–VI вв. до н. э.", rig:"XV–XII вв. до н. э.", ich:"IX–VIII вв. до н. э.", lao:"VI–IV вв. до н. э.",
    par:"≈ 515–450 до н. э.", bud:"V в. до н. э.", pat:"II в. до н. э. – IV в.", ava:"I–IV вв.", shn:"VIII в.", far:"1865", lem:"1927–1931", bel:"1964 · 1982",
    rov:"род. 1956", dmn:"2001", med:"с 2000-х", pen:"род. 1931", lig:"2015", dal:"род. 1935", plo:"204–270", pla:"428–348 до н. э." };
  F.forEach(f => { f.sh = SH[f.id] || f.nm; f.w = BIG.has(f.id) ? 2 : 1; f.ys = YS[f.id] || f.yr.split(/[;(]/)[0].trim(); });

  // ---- нелинейная ось: год → u ∈ [0, 1] ----
  const KN = [[-1500,0],[-800,.05],[-620,.08],[-250,.25],[0,.29],[1100,.36],[1450,.42],[1600,.50],[1800,.60],[1900,.68],[1960,.88],[2030,1]];
  const U = y => { if (y <= KN[0][0]) return 0; for (let k = 1; k < KN.length; k++) if (y <= KN[k][0]){ const [a, ua] = KN[k-1], [b, ub] = KN[k]; return ua + (ub - ua)*(y - a)/(b - a); } return 1; };
  const ERAS = [[-1500,-800,"Ведийская древность"],[-800,-200,"Осевое время"],[-200,500,"Античность"],[500,1450,"Средние века"],[1450,1600,"Возрождение"],[1600,1750,"Научная революция"],[1750,1900,"XVIII–XIX века"],[1900,1960,"Век физики"],[1960,2030,"Наше время"]];
  const TICKS = [-1500,-1000,-500,0,500,1000,1500,1600,1700,1800,1850,1900,1925,1950,1975,2000];
  const yrLab = (y, short) => y < 0 ? (short ? "−" + (-y) : (-y) + " до н. э.") : y === 0 ? (short ? "0" : "Рубеж эр") : String(y);

  // ---- состояние ----
  let open = false, built = false, vert = false, W = 0, H = 0;
  let v0 = -.02, v1 = 1.02;                 // видимый диапазон u
  let A = { s0: 0, s1: 1, c: 0, h0: 0, h1: 0 }; // область: вдоль оси s0..s1, поперёк — центр c, полуширины до краёв h0 (Опыт), h1 (Измерение)
  let sel = null, hov = null, selB = null, hovB = null;
  const CW = () => vert ? 13 : 15;            // полуширина русла
  const P = u => A.s0 + (A.s1 - A.s0)*(u - v0)/(v1 - v0);
  const IU = p => v0 + (p - A.s0)*(v1 - v0)/(A.s1 - A.s0);
  const pt = (s, o) => vert ? [A.c + o, s] : [s, A.c + o];   // s — вдоль времени, o — поперёк (минус — к «Опыту»)

  // ---- измерение текста ----
  const mctx = document.createElement("canvas").getContext("2d");
  const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let FD = "Georgia";
  const tw = (t, px) => { mctx.font = `${px}px ${FD}`; return mctx.measureText(t).width; };

  // ---- построение SVG ----
  const mk = (tag, attrs, par) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (par) par.appendChild(e); return e; };
  let gBr, gBrM, gEra, gTick, gRiv, gThr, gLead, gNode, riverRect, flows = [], eraEls = [], tickEls = [];
  function build(){
    built = true; FD = cssv("--display") || FD;
    svg.innerHTML = "";
    const defs = mk("defs", {}, svg);
    const lg = mk("linearGradient", { id:"thRiv", x1:"0", y1:"0", x2:"0", y2:"1" }, defs);
    mk("stop", { offset:"0", "stop-color":"#ffd9a0", "stop-opacity":".07" }, lg); mk("stop", { offset:".5", "stop-color":"#7fa8ff", "stop-opacity":".10" }, lg); mk("stop", { offset:"1", "stop-color":"#9fd8ff", "stop-opacity":".07" }, lg);
    const lgv = mk("linearGradient", { id:"thRivV", x1:"0", y1:"0", x2:"1", y2:"0" }, defs);
    mk("stop", { offset:"0", "stop-color":"#ffd9a0", "stop-opacity":".07" }, lgv); mk("stop", { offset:".5", "stop-color":"#7fa8ff", "stop-opacity":".10" }, lgv); mk("stop", { offset:"1", "stop-color":"#9fd8ff", "stop-opacity":".07" }, lgv);
    gEra = mk("g", { class:"th-eras" }, svg);
    gRiv = mk("g", { class:"th-riv" }, svg);
    riverRect = mk("rect", { class:"th-bed" }, gRiv);
    for (let k = 0; k < 3; k++) flows.push(mk("path", { class:"th-flow f" + k }, gRiv));
    gTick = mk("g", { class:"th-ticks" }, svg);
    gThr = mk("g", { class:"th-thr" }, svg);
    gBr = mk("g", { class:"th-brs" }, svg);
    gBrM = mk("g", { class:"th-brm" }, svg);
    gLead = mk("g", { class:"th-lead" }, svg);
    gNode = mk("g", { class:"th-nodes" }, svg);
    ERAS.forEach(e => { const g = mk("g", {}, gEra); eraEls.push({ e, ln: mk("path", { class:"th-era-l" }, g), tx: mk("text", { class:"th-era-t" }, g) }); eraEls[eraEls.length-1].tx.textContent = e[2]; });
    TICKS.forEach(y => { const g = mk("g", {}, gTick); tickEls.push({ y, ln: mk("line", {}, g), tx: mk("text", {}, g) }); });
    TH.forEach(t => { t.el = mk("path", { class:"th-th " + t.a.b }, gThr); });
    BR.forEach(r => {
      const g = r.g = mk("g", { class:"th-br " + r.k, "data-br": r.i }, gBr);
      r.hit = mk("path", { class:"th-br-hit" }, g);
      r.el = mk("path", { class:"th-br-l" }, g);
      r.mk = mk("g", { class:"th-br-m th-br " + r.k, "data-br": r.i }, gBrM);
      mk("circle", { r: 4.6, class:"th-br-c" }, r.mk);
      if (r.k === "full") mk("circle", { r: 2.6, class:"th-br-f" }, r.mk);
      else mk("path", { d:"M0 -2.6A2.6 2.6 0 0 1 0 2.6Z", class:"th-br-f" }, r.mk);
    });
    F.forEach(f => {
      f.ld = mk("line", { class:"th-ld " + f.b }, gLead);
      const g = f.g = mk("g", { class:"th-fig " + f.b + (f.w > 1 ? " big" : ""), "data-id": f.id, tabindex:"-1" }, gNode);
      f.hit = mk("rect", { class:"th-hit" }, g);
      f.dh = mk("circle", { r: 8, class:"th-hit" }, g);
      f.dot = mk("circle", { r: f.w > 1 ? 4.6 : 3.6, class:"th-dot" }, g);
      f.t1 = mk("text", { class:"th-nm" }, g); f.t1.textContent = f.sh;
      f.t2 = mk("text", { class:"th-yr" }, g); f.t2.textContent = f.ys;
    });
  }

  // ---- геометрия области ----
  function size(){
    const r = svg.getBoundingClientRect(); W = r.width; H = r.height;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    vert = W < 761;
    const pr = pnl.getBoundingClientRect();
    if (vert){
      const top = 64, bot = Math.min(H - 14, (box.classList.contains("tm-max") ? H : pr.top) - 10);
      A.s0 = top + 10; A.s1 = Math.max(top + 120, bot - 10); A.c = W/2 - 6; A.h0 = A.c - 6; A.h1 = W - A.c - 26;
    } else {
      const left = box.classList.contains("tm-max") ? pr.right + 30 : pr.right + 34, right = W - 30;
      A.s0 = left + 20; A.s1 = Math.max(left + 200, right - 20); A.c = 84 + (H - 84 - 30)/2 + 6; A.h0 = A.c - 108; A.h1 = H - 26 - A.c;
    }
    render();
  }

  // ---- раскладка подписей: дорожки, наружу от русла; приоритет — крупные ----
  function layout(){
    const cw = CW(), vis = F.filter(f => { const p = P(U(f.y)); f.p = p; return p > A.s0 - 30 && p < A.s1 + 30; });
    const lanes = { o: [], m: [] };
    const fs = vert ? 13.5 : 15.5, LH = vert ? 32 : 36, base = cw + (vert ? 16 : 24);
    const maxL = b => vert ? 1 : Math.max(1, Math.floor(((b === "o" ? A.h0 : A.h1) - base - 8)/LH));
    const order = vis.slice().sort((a, b) => (b.w - a.w) || (a === sel ? -1 : b === sel ? 1 : 0) || a.p - b.p);
    if (sel && vis.includes(sel)){ order.splice(order.indexOf(sel), 1); order.unshift(sel); }
    for (const f of F){ f.lane = -1; f.shift = undefined; }
    for (const f of order){
      mctx.font = `8.5px ${cssv("--mono") || "monospace"}`; const yw = mctx.measureText(f.ys).width*1.12;
      const w = Math.max(tw(f.sh, fs), yw, 40) + 10;
      if (vert){
        // вдоль оси: высота подписи; поперёк — ширина до края
        const lo = f.p - LH/2 + 2, hi = f.p + LH/2 - 2, L = lanes[f.b][0] || (lanes[f.b][0] = []);
        const room = (f.b === "o" ? A.h0 : A.h1) - base;
        if (w > room + 6) f.cut = true; else f.cut = false;
        if (!L.some(([a, b]) => lo < b && hi > a)){ L.push([lo, hi]); f.lane = 0; f.lo = lo; }
        else {
          // попробуем сдвиг до ±12 px
          for (const d of [10, -10, 16, -16]){ const a2 = lo + d, b2 = hi + d; if (!L.some(([a, b]) => a2 < b && b2 > a)){ L.push([a2, b2]); f.lane = 0; f.shift = d; break; } }
        }
        if (f.lane === 0 && f.shift === undefined) f.shift = 0;
      } else {
        const lo = f.p - w/2, hi = f.p + w/2;
        for (let k = 0; k < maxL(f.b); k++){
          const L = lanes[f.b][k] || (lanes[f.b][k] = []);
          if (!L.some(([a, b]) => lo < b + 6 && hi > a - 6)){ L.push([lo, hi]); f.lane = k; break; }
        }
      }
    }
    return { vis, base, LH, fs };
  }

  // ---- отрисовка ----
  function render(){
    if (!built || !W) return;
    const cw = CW();
    // русло
    const s0 = Math.max(A.s0 - 20, P(0)), s1 = Math.min(A.s1 + 20, P(1));
    if (vert){ riverRect.setAttribute("x", A.c - cw); riverRect.setAttribute("y", s0); riverRect.setAttribute("width", 2*cw); riverRect.setAttribute("height", Math.max(0, s1 - s0)); riverRect.setAttribute("fill", "url(#thRivV)"); }
    else { riverRect.setAttribute("x", s0); riverRect.setAttribute("y", A.c - cw); riverRect.setAttribute("width", Math.max(0, s1 - s0)); riverRect.setAttribute("height", 2*cw); riverRect.setAttribute("fill", "url(#thRiv)"); }
    flows.forEach((fl, k) => {
      let d = ""; const amp = cw*.42, off = (k - 1)*cw*.38, ph = k*1.9, n = 90;
      for (let i = 0; i <= n; i++){ const s = s0 + (s1 - s0)*i/n, o = off + amp*.35*Math.sin(s*.021 + ph) + amp*.18*Math.sin(s*.057 + ph*2); const [x, y] = pt(s, o); d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }
      fl.setAttribute("d", d);
    });
    // эпохи: на десктопе — линейка над «Опытом», на телефоне — вдоль правого края
    eraEls.forEach(({ e, ln, tx }) => {
      const a = P(U(e[0])), b = P(U(e[1])), lo = Math.max(a, A.s0 - 10), hi = Math.min(b, A.s1 + 10), on = hi - lo > 24;
      ln.style.display = tx.style.display = on ? "" : "none"; if (!on) return;
      if (vert){
        const x = W - 6;
        ln.setAttribute("d", `M${x-4} ${a+2}L${x} ${a+2}L${x} ${b-2}L${x-4} ${b-2}`);
        const m = (lo + hi)/2; tx.setAttribute("x", x - 8); tx.setAttribute("y", m); tx.setAttribute("transform", `rotate(-90 ${x - 8} ${m})`); tx.setAttribute("text-anchor", "middle");
        tx.style.display = (hi - lo > e[2].length*6.6 + 12) ? "" : "none";
      } else {
        const y = A.c - A.h0 - 12;
        ln.setAttribute("d", `M${a+2} ${y+5}L${a+2} ${y}L${b-2} ${y}L${b-2} ${y+5}`);
        tx.setAttribute("x", (lo + hi)/2); tx.setAttribute("y", y - 6); tx.setAttribute("text-anchor", "middle"); tx.removeAttribute("transform");
        tx.style.display = (hi - lo > e[2].length*6.6 + 10) ? "" : "none";
      }
    });
    // годы в русле
    let lastP = -1e9;
    tickEls.forEach(({ y, ln, tx }) => {
      const p = P(U(y)), on = p > A.s0 - 4 && p < A.s1 + 4 && p - lastP > (vert ? 34 : 64);
      ln.style.display = tx.style.display = on ? "" : "none"; if (!on) return; lastP = p;
      const [x1, y1] = pt(p, -cw), [x2, y2] = pt(p, -cw + 4), [x3, y3] = pt(p, cw - 4), [x4, y4] = pt(p, cw);
      ln.setAttribute("x1", x1); ln.setAttribute("y1", y1); ln.setAttribute("x2", x2); ln.setAttribute("y2", y2);
      ln.setAttribute("stroke-dasharray", "");
      tx.textContent = yrLab(y, vert);
      if (vert){ tx.setAttribute("x", A.c); tx.setAttribute("y", p + 3); tx.setAttribute("text-anchor", "middle"); }
      else { tx.setAttribute("x", p); tx.setAttribute("y", A.c + 3.5); tx.setAttribute("text-anchor", "middle"); }
    });
    // фигуры
    const { base, LH, fs } = layout(), node = cw + 5;
    F.forEach(f => {
      const vis = f.p > A.s0 - 30 && f.p < A.s1 + 30, sgn = f.b === "o" ? -1 : 1;
      f.g.style.display = f.ld.style.display = vis ? "" : "none"; if (!vis) return;
      const [nx, ny] = pt(f.p, sgn*node); f.nx = nx; f.ny = ny;
      f.dot.setAttribute("cx", nx); f.dot.setAttribute("cy", ny); f.dh.setAttribute("cx", nx); f.dh.setAttribute("cy", ny);
      const lab = f.lane >= 0 || f === sel || f === hov || (selB && (f === selB.A || f === selB.B));
      f.g.classList.toggle("nolab", !lab);
      let lx, ly, anc;
      if (vert){
        const sh = f.lane >= 0 ? (f.shift || 0) : 0;
        lx = A.c + sgn*(base); ly = f.p + sh; anc = sgn < 0 ? "end" : "start";
        const room = (sgn < 0 ? A.h0 : A.h1) - base;
        let t = f.sh; if (tw(t, fs) > room){ while (t.length > 3 && tw(t + "…", fs) > room) t = t.slice(0, -1); t += "…"; } f.t1.textContent = t;
        f.t1.setAttribute("x", lx); f.t1.setAttribute("y", ly - 1); f.t2.setAttribute("x", lx); f.t2.setAttribute("y", ly + 11);
        f.t1.setAttribute("text-anchor", anc); f.t2.setAttribute("text-anchor", anc);
        f.ld.setAttribute("x1", nx + sgn*4); f.ld.setAttribute("y1", ny); f.ld.setAttribute("x2", lx - sgn*3); f.ld.setAttribute("y2", ly - 4);
        const w = Math.min(tw(f.sh, fs), (sgn < 0 ? A.h0 : A.h1) - base) + 8;
        f.hit.setAttribute("x", sgn < 0 ? lx - w : lx - 4); f.hit.setAttribute("y", ly - 16); f.hit.setAttribute("width", w + 4); f.hit.setAttribute("height", 32);
      } else {
        f.t1.textContent = f.sh;
        const k = f.lane >= 0 ? f.lane : 0;
        const off = base + k*LH + 14;
        lx = f.p; ly = A.c + sgn*off; anc = "middle";
        // «Опыт» — подпись над точкой (имя сверху, годы под ним), «Измерение» — под точкой
        const yN = sgn < 0 ? ly - 4 : ly + 6, yY = sgn < 0 ? ly + 9 : ly + 19;
        f.t1.setAttribute("x", lx); f.t1.setAttribute("y", yN); f.t2.setAttribute("x", lx); f.t2.setAttribute("y", yY);
        f.t1.setAttribute("text-anchor", anc); f.t2.setAttribute("text-anchor", anc);
        const ey = sgn < 0 ? yY + 4 : yN - 13;
        f.ld.setAttribute("x1", nx); f.ld.setAttribute("y1", ny + sgn*4); f.ld.setAttribute("x2", lx); f.ld.setAttribute("y2", ey);
        const w = Math.max(tw(f.sh, fs), 30) + 10;
        f.hit.setAttribute("x", lx - w/2); f.hit.setAttribute("width", w);
        const ya = yN - 15, yb = yY + 4;
        f.hit.setAttribute("y", ya); f.hit.setAttribute("height", yb - ya);
      }
      f.ld.style.display = lab ? "" : "none";
    });
    // нити: дуга вдоль берега, наружу от русла
    TH.forEach(t => {
      const a = t.a, b = t.b, va = a.g.style.display !== "none", vb = b.g.style.display !== "none";
      if (!va && !vb){ t.el.style.display = "none"; return; }
      t.el.style.display = "";
      const sgn = a.b === "o" ? -1 : 1, pa = P(U(a.y)), pb = P(U(b.y)), d = Math.abs(pb - pa);
      const hgt = Math.min(base - 9, 6 + d*.06), [x1, y1] = pt(pa, sgn*(node + 3)), [x2, y2] = pt(pb, sgn*(node + 3)), [cx, cy] = pt((pa + pb)/2, sgn*(node + 3 + hgt*1.6));
      t.el.setAttribute("d", `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    });
    // мосты: S-дуга через русло от «Опыта» к «Измерению»
    BR.forEach(r => {
      const va = r.A.g.style.display !== "none", vb = r.B.g.style.display !== "none";
      if (!va && !vb){ r.g.style.display = r.mk.style.display = "none"; return; }
      r.g.style.display = r.mk.style.display = "";
      const pa = P(U(r.A.y)), pb = P(U(r.B.y)), q = node + 4, bend = cw*2.2 + Math.min(40, Math.abs(pb - pa)*.18);
      const [x1, y1] = pt(pa, -q), [c1x, c1y] = pt(pa, -q + bend), [c2x, c2y] = pt(pb, q - bend), [x2, y2] = pt(pb, q);
      const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      r.el.setAttribute("d", d); r.hit.setAttribute("d", d);
      const mx = (x1 + 3*c1x + 3*c2x + x2)/8, my = (y1 + 3*c1y + 3*c2y + y2)/8;
      r.mk.setAttribute("transform", `translate(${mx.toFixed(1)} ${my.toFixed(1)})`);
    });
    mark();
  }

  // ---- подсветка ----
  function mark(){
    const b = hovB || (hov ? null : selB), f = b ? null : (hov || sel);
    svg.classList.toggle("hl", !!(f || b));
    const rel = new Set(), relT = new Set(), relB = new Set();
    if (f){ rel.add(f); [...f.out, ...f.inn].forEach(t => { relT.add(t); rel.add(t.a); rel.add(t.b); }); f.br.forEach(r => { relB.add(r); rel.add(r.A); rel.add(r.B); }); }
    if (b){ relB.add(b); rel.add(b.A); rel.add(b.B); }
    BR.forEach(r => { for (const e of [r.g, r.mk]){ e.classList.toggle("on", relB.has(r)); e.classList.toggle("sel", r === selB); } });
    F.forEach(x => { x.g.classList.toggle("on", rel.has(x)); x.g.classList.toggle("me", x === f); x.g.classList.toggle("sel", x === sel); x.ld.classList.toggle("on", rel.has(x)); });
    TH.forEach(t => t.el.classList.toggle("on", relT.has(t)));
  }

  // ---- карточки ----
  // фигура → событие Космического календаря (точная дата), если такое событие есть
  const TH2EV = { rig:"veda", upa:"upan", pyt:"pyth", lao:"confu", bud:"buddha", pla:"socr", plo:"plotin", rum:"rumi", cop:"coper", gal:"galileo",
    new:"newton", dar:"darwin", men:"mendel", ein:"quant", pln:"quant", lem:"hubble", dna:"dna", lig:"ligo" };
  const evOf = f => { const id = TH2EV[f.id]; return id ? CHR_EV.find(e => e.id === id) : null; };
  const stName = go => {
    if (go.t === "tree") return "В Древе жизни";
    if (go.t === "bio") return go.sp ? "В Биосфере: " + BIO_SP[go.sp].ru : go.m != null ? "В Биосфере: «" + BIO_MECH[go.m].nm + "»" : go.b != null ? "В Биосфере: «" + BIO_BASICS[go.b].nm + "»" : go.bm != null ? "В Биосфере: «" + BIO_BIOMES[go.bm].nm + "»" : "В Биосфере";
    if (go.t === "dm") return "В Лестнице измерений: " + (go.n < 7 ? go.n + "D" : "эпилог") + (go.lens === "time" ? " · время" : "");
    const J = JOURNEYS[go.id]; if (!J) return "На кольцо";
    return "Станция: " + (J.title || ST[J.st].short);
  };
  const thrLine = (t, dir) => { const o = dir > 0 ? t.b : t.a; return `<li><button class="th-lnk" data-go="${o.id}" data-hover>${dir > 0 ? "→" : "←"} ${esc(o.sh)}</button> <span>— ${esc(t.n)}</span></li>`; };
  function intro(){
    const pick = ["upa","pyt","bud","dem","kep","dar","shr","ver"].map(id => BY[id]);
    return `<div class="tm-bar"><span class="mono eyebrow tm-cat">История идей · ${F.length} фигур</span></div>
      <h3>Нить мысли</h3>
      <p class="tm-lead">Два берега одной реки — опыт и измерение. Что люди увидели внутри себя и в созерцании мира — и что потом нашли с приборами в руках.</p>
      <div class="tm-art">
        <p><b class="th-o">Верхний берег — «Опыт»</b>: традиции, мистики, философы — от гимнов Ригведы до Раманы Махарши. <b class="th-m">Нижний берег — «Измерение»</b>: наблюдение, опыт, расчёт — от вавилонских табличек до гравитационных волн.</p>
        <p>Тонкие нити вдоль берегов — влияние: учитель и ученик, книга и читатель. Ось времени нелинейная: древность сжата, последние пятьсот лет растянуты, иначе Век физики не поместился бы.</p>
        <p><b>Мосты через реку</b> — там, где интуиция и измерение встретились. <span class="th-mk full">${MK.full}</span> — прямое влияние или предвосхищение: учёный сам опирался на идею или идея прямо совпала с открытием. <span class="th-mk half">${MK.half}</span> — созвучие формы: мысль похожа, но пришла другим путём или не доказана. В каждой карточке моста — честный разбор: чем это близко и чем отличается.</p>
      </div>
      <h4>С чего начать</h4>
      <ul class="tr-kids">${pick.map(f => `<li><button data-go="${f.id}" data-hover><i class="dotc th-dot-${f.b}"></i>${esc(f.sh)}<span class="mono">${esc(f.yr.split(/[;(]/)[0])}</span></button></li>`).join("")}</ul>
      <h4>Все мосты · ${BR.length}</h4>
      <ul class="list th-thl">${BR.map(r => brLine(r, null)).join("")}</ul>`;
  }
  const brLine = (r, f) => { const o = r.A === f ? r.B : r.A; return `<li><button class="th-lnk" data-br="${r.i}" data-hover><span class="th-mk ${r.k}">${MK[r.k]}</span> ${esc(f ? o.sh : r.A.sh + " → " + r.B.sh)}</button> <span>— ${esc(r.nm)}</span></li>`; };
  function brCard(r){
    const prv = BR[r.i - 1], nxt = BR[r.i + 1];
    return `<div class="tm-bar"><span class="mono eyebrow tm-cat">Мост · <span class="th-mk ${r.k}">${MK[r.k]}</span> ${esc(r.kn)}</span>
        <span class="tm-nav"><button id="thPrev" ${prv ? "" : "disabled"} aria-label="Предыдущий мост" data-hover>←</button><button id="thNext" ${nxt ? "" : "disabled"} aria-label="Следующий мост" data-hover>→</button></span></div>
      <h3>${esc(r.nm)}</h3>
      <p class="tm-ago2"><button class="th-lnk th-o" data-go="${r.A.id}" data-hover>${esc(r.A.sh)}</button> <span class="th-arr">⟶</span> <button class="th-lnk th-m" data-go="${r.B.id}" data-hover>${esc(r.B.sh)}</button></p>
      <div class="th-pair"><div><h4 class="th-o">Что увидела интуиция</h4><p>${esc(r.iu)}</p></div><div><h4 class="th-m">Что нашла наука</h4><p>${esc(r.sc)}</p></div></div>
      <h4>Насколько это близко</h4><p class="tm-pr th-cl">${esc(r.cl)}</p>
      <h4>Чем отличается</h4><p class="tm-pr th-cl">${esc(r.df)}</p>
      <div class="tr-inh th-why"><h4>Почему такая метка</h4><p>${esc(r.why)}</p></div>`;
  }
  function figCard(f){
    const prv = F[f.i - 1], nxt = F[f.i + 1];
    return `<div class="tm-bar"><span class="mono eyebrow tm-cat th-${f.b}">${f.b === "o" ? "Опыт" : "Измерение"} · ${esc(f.tg)}</span>
        <span class="tm-nav"><button id="thPrev" ${prv ? "" : "disabled"} aria-label="Раньше" data-hover>←</button><button id="thNext" ${nxt ? "" : "disabled"} aria-label="Позже" data-hover>→</button></span></div>
      <h3>${esc(f.nm)}</h3>
      <p class="tm-ago2">${esc(f.yr)} · ${esc(f.pl)}</p>
      <h4>Главная мысль — своими словами</h4>
      <p class="tm-lead">${esc(f.key)}</p>
      <div class="tm-art">${f.art.map(p => `<p>${esc(p)}</p>`).join("")}</div>
      ${f.br.length ? `<h4>Мосты через реку</h4><ul class="list th-thl">${f.br.map(r => brLine(r, f)).join("")}</ul>` : ""}
      ${f.inn.length || f.out.length ? `<h4>Нити</h4><ul class="list th-thl">${f.inn.map(t => thrLine(t, -1)).join("")}${f.out.map(t => thrLine(t, 1)).join("")}</ul>` : ""}
      <div class="tm-gos"><button class="btn tm-go" id="thSt" data-hover>${esc(stName(f.go))}</button><button class="btn tm-go" id="thCal" data-hover>${evOf(f) ? "В календаре: " + esc(evOf(f).nm) : "В Космическом календаре"}</button></div>`;
  }
  function card(){
    cardEl.innerHTML = selB ? brCard(selB) : sel ? figCard(sel) : intro();
    cardEl.classList.remove("swap"); void cardEl.offsetWidth; cardEl.classList.add("swap");
    scr.scrollTop = 0;
    cardEl.querySelectorAll("[data-go]").forEach(b => b.onclick = () => select(BY[b.dataset.go], true));
    cardEl.querySelectorAll("[data-br]").forEach(b => b.onclick = () => selectB(BR[+b.dataset.br], true));
    const pv = $("thPrev"), nx = $("thNext");
    if (pv) pv.onclick = () => step(-1); if (nx) nx.onclick = () => step(1);
    const st = $("thSt"); if (st) st.onclick = () => { const go = sel.go; close(); RT.go(go); };
    const cl = $("thCal"); if (cl) cl.onclick = () => { const ev = evOf(sel), ago = ev ? ev.ago : Math.max(1, 2026 - sel.y); close(); RT.go({ t:"cal", ago }); };
  }
  function select(f, pan){
    sel = f || null; hov = null; selB = null; hovB = null;
    if (sel) jrMark("fg", sel.id, sel.nm);
    if (sel){
      box.classList.remove("th-fold"); $("thFold").textContent = "▾ Свернуть";
      const u = U(sel.y), span = v1 - v0;
      if (pan && vert && span > .45) animTo(u - .16, u + .16);
      else if (pan && (u < v0 + span*.08 || u > v1 - span*.08)){ animTo(u - span/2, u + span/2); }
    }
    card(); size();
  }
  function selectB(r, pan){
    selB = r || null; sel = null; hov = hovB = null;
    if (selB) jrMark("br", selB.a + ">" + selB.b, selB.A.sh + " → " + selB.B.sh);
    if (selB){
      box.classList.remove("th-fold"); $("thFold").textContent = "▾ Свернуть";
      const ua = U(selB.A.y), ub = U(selB.B.y), lo = Math.min(ua, ub), hi = Math.max(ua, ub), span = v1 - v0;
      if (pan && (lo < v0 + span*.05 || hi > v1 - span*.05 || (vert && span > .45))){ const sp = Math.max(hi - lo + .08, vert ? .3 : span); animTo((lo + hi)/2 - sp/2, (lo + hi)/2 + sp/2); }
    }
    card(); size();
  }
  const step = d => {
    if (selB){ const r = BR[selB.i + d]; if (r) selectB(r, true); return; }
    const f = sel ? F[sel.i + d] : F[d > 0 ? 0 : F.length - 1]; if (f) select(f, true);
  };

  // ---- вид: плавный переход ----
  let an = 0;
  function clampV(a, b){
    let span = Math.min(1.06, Math.max(.025, b - a)); let c = (a + b)/2;
    c = Math.min(1.03 - span/2 + (span > 1 ? (span - 1)/2 : 0), Math.max(-.03 + span/2 - (span > 1 ? (span - 1)/2 : 0), c));
    if (span >= 1.04) c = .5;
    return [c - span/2, c + span/2];
  }
  function animTo(a, b){
    [a, b] = clampV(a, b); const fa = v0, fb = v1, t0 = performance.now(); cancelAnimationFrame(an);
    const fr = t => { const k = Math.min(1, (t - t0)/650), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2; v0 = fa + (a - fa)*e; v1 = fb + (b - fb)*e; render(); if (k < 1) an = requestAnimationFrame(fr); };
    an = requestAnimationFrame(fr);
  }
  function zoomAt(p, k){ const u = IU(p); let a = u - (u - v0)*k, b = u + (v1 - u)*k; [v0, v1] = clampV(a, b); render(); }

  // ---- ввод ----
  const axisOf = e => { const r = svg.getBoundingClientRect(); return vert ? e.clientY - r.top : e.clientX - r.left; };
  svg.addEventListener("wheel", e => { if (!open) return; e.preventDefault(); cancelAnimationFrame(an);
    const dz = e.ctrlKey ? e.deltaY*3 : e.deltaY;
    if (!vert && Math.abs(e.deltaX) > Math.abs(e.deltaY)){ const du = e.deltaX/(A.s1 - A.s0)*(v1 - v0); [v0, v1] = clampV(v0 + du, v1 + du); render(); return; }
    zoomAt(axisOf(e), Math.exp(dz*.0016)); }, { passive:false });
  const ptrs = new Map(); let drag = null, pinch = null, moved = false;
  svg.addEventListener("pointerdown", e => {
    if (!open) return; svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, e); cancelAnimationFrame(an);
    if (ptrs.size === 1){ drag = { a: axisOf(e), v0, v1 }; moved = false; }
    if (ptrs.size === 2){ const [p, q] = [...ptrs.values()]; pinch = { d: Math.abs(axisOf(p) - axisOf(q)) || 1, m: (axisOf(p) + axisOf(q))/2, v0, v1 }; drag = null; moved = true; }
  });
  svg.addEventListener("pointermove", e => {
    if (!open) return;
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, e);
    if (pinch && ptrs.size === 2){
      const [p, q] = [...ptrs.values()], d = Math.abs(axisOf(p) - axisOf(q)) || 1, k = pinch.d/d;
      const u = pinch.v0 + (pinch.m - A.s0)*(pinch.v1 - pinch.v0)/(A.s1 - A.s0);
      [v0, v1] = clampV(u - (u - pinch.v0)*k, u + (pinch.v1 - u)*k); render(); return;
    }
    if (drag){
      const dp = axisOf(e) - drag.a; if (Math.abs(dp) > 4) moved = true;
      if (moved){ const du = -dp/(A.s1 - A.s0)*(drag.v1 - drag.v0); [v0, v1] = clampV(drag.v0 + du, drag.v1 + du); render(); svg.classList.add("grab"); }
      return;
    }
    // наведение
    if (e.pointerType === "mouse"){
      const g = e.target.closest && e.target.closest(".th-fig"), gb = !g && e.target.closest && e.target.closest(".th-br");
      const f = g ? BY[g.dataset.id] : null, b = gb ? BR[+gb.dataset.br] : null;
      if (f !== hov || b !== hovB){ hov = f; hovB = b; mark(); render(); }
    }
  });
  const up = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (drag && !moved){ const tg = document.elementFromPoint(e.clientX, e.clientY) || e.target; const g = tg.closest && tg.closest(".th-fig"), gb = !g && tg.closest && tg.closest(".th-br"); if (g) select(BY[g.dataset.id], false); else if (gb) selectB(BR[+gb.dataset.br], false); }
    if (!ptrs.size){ drag = null; svg.classList.remove("grab"); }
  };
  svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
  svg.addEventListener("pointerleave", () => { if (hov || hovB){ hov = hovB = null; render(); } });
  addEventListener("keydown", e => {
    if (!open || (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA"))) return;
    if (e.key === "Escape"){ e.stopPropagation(); if (sel || selB){ select(null); } else close(); }
    else if (e.key === "ArrowRight" || e.key === "ArrowDown"){ e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp"){ e.preventDefault(); step(-1); }
    else if (e.key === "+" || e.key === "="){ zoomAt((A.s0 + A.s1)/2, .7); }
    else if (e.key === "-"){ zoomAt((A.s0 + A.s1)/2, 1.4); }
  }, true);

  // ---- открыть/закрыть ----
  function openT(){ if (open) return; if (!built) build(); open = thoughtOn = true; if (innerWidth < 761 && !sel){ box.classList.add("th-fold"); $("thFold").textContent = "▴ Карточка"; } card(); requestAnimationFrame(size); }
  function close(){ if (!open) return; open = thoughtOn = false; hov = hovB = null; box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); }
  addEventListener("resize", () => { if (open) size(); });
  const mxb = $("thMax");
  mxb.onclick = () => { const on = !box.classList.contains("tm-max"); box.classList.toggle("tm-max", on); mxb.setAttribute("aria-pressed", String(on)); mxb.textContent = on ? "⤡ Река" : "⤢ Читать"; requestAnimationFrame(size); };
  $("thHome").onclick = () => { animTo(-.02, 1.02); };
  $("thFold").onclick = () => { box.classList.toggle("th-fold"); $("thFold").textContent = box.classList.contains("th-fold") ? "▴ Карточка" : "▾ Свернуть"; requestAnimationFrame(size); };
  return { open: openT, close, get on(){ return open; }, select: id => select(BY[id] || null, true), bridge: i => selectB(BR[i] || null, true), bridgeBy: k => { const [a, b] = k.split(">"); const r = BR.find(x => x.a === a && x.b === b); if (r) selectB(r, true); }, figs: F, bridges: BR,
           dbg: { view: () => [v0, v1], sel: () => sel ? sel.id : selB ? "br:" + selB.a + ">" + selB.b : null, labeled: () => F.filter(f => f.g && f.g.style.display !== "none" && !f.g.classList.contains("nolab")).length, n: F.length } };
})();
const chThought = $("chThought");
function openThought(id){ closeCompass(); closeMine(); closeDims(); closeBio(); closeHuman(); closePath(); closeRef(); closeTime(); closeTree(); closeRouteList(); toggleMenu(false); surface(); chThought.classList.add("open"); chThought.setAttribute("aria-hidden", "false"); CTH.open(); if (id) CTH.select(id); $("thClose").focus({preventScroll:true}); }
function closeThought(){ CTH.close(); }
$("thClose").onclick = closeThought;
$("mThought").onclick = () => openThought();
