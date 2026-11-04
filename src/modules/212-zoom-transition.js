/* ---------- переход-зум: натуральное приближение, без вспышки и подмены кадра ----------
   Для этих пар переход сделан как настоящий пролёт камеры внутрь: мы подлетаем к одной из точек
   уходящей сцены, и в этой точке нас ждёт следующая станция. Чтобы не было ни единого рывка, во время
   полёта ОБЕ станции пары стоят на одной и той же интерполированной точке кольца: объект остаётся в
   центре кадра, а фон (звёзды и астролябия) плавно проворачивается сам — ровно так, как это выглядело
   бы при настоящем пролёте. Камера в режиме погружения привязана к stations[jSt].g.position, поэтому
   отдельно вести её не нужно: она едет по той же интерполяции автоматически, и подмена путешествия
   посередине полёта не сдвигает картинку ни на пиксель.
   Параметр z — «насколько мы уже внутри» (0 — внешняя станция пары, 1 — внутренняя). Вперёд он растёт,
   назад убывает, а вся картинка — чистая функция от z, поэтому обратный ход получается сам собой. */
const ZOOM_PAIRS = [["g2", "g3"], ["g3", "g4"], ["g7", "g8"], ["g3", "bh"]];
const zoomPair = (a, b) => ZOOM_PAIRS.some(p => (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b));
let zm = null;
const ZDUR = 3.6, ZK = Math.log(20);
const ZBOOST = { 2: 1.05, 3: .55 };    // подъём яркости на вылете: только у «Вселенной» —
                               // её нити разлетаются и гаснут сами, а плотная галактика и без того ярка
const ZFLOW = .34;              // насколько разводит звёзды за полёт (радиан на оси обзора)
const zAxis = new THREE.Vector3();
let zDust = null, zDustG = null, zStarRel = 0;
// фон во время полёта: поток по звёздам + затемнение к моменту прибытия (свет галактики забивает небо).
// Сброс потока делаем, пока фон погашен, — иначе звёзды в конце полёта дёрнулись бы обратно
function zStar(flow, op){ const u = bgStars.material.uniforms; u.uProg.value = flow; u.uOpacity.value = op; }
function zDustEnsure(){
  if (zDust) return;
  zDust = pts(2600*Q, (i, o) => {
      const a = Math.random()*TAU, L = .8 + Math.pow(Math.random(), .7)*9;
      o.p = [Math.cos(a)*L, Math.sin(a)*L, Math.random()];
      o.c = mixc(C(0x9fb6ff), C(0xfff2dc), Math.random()); o.s = 1.0 + Math.random()*2.2; },
    // трубка глубиной 24, а не 80: на восьмидесяти частицы висят слишком далеко, размер у них
    // обратно пропорционален расстоянию — и весь поток вырождался в невидимую пыль
    `float zz = fract(position.z - uProg);
     float dz = 1.0 + zz*24.0;
     p = vec3(position.x, position.y, -dz);
     a = smoothstep(0.0, 0.06, zz)*(1.0 - smoothstep(0.70, 1.0, zz));`);
  zDust.frustumCulled = false;
  zDustG = new THREE.Group(); zDustG.add(zDust); zDustG.visible = false; scene.add(zDustG);
}
function startZoom(to, dir){
  atomArrive(to);
  const pair = ZOOM_PAIRS.find(p => (p[0] === jId && p[1] === to) || (p[1] === jId && p[0] === to));
  const aSt = JOURNEYS[pair[0]].st, bSt = JOURNEYS[pair[1]].st;
  const thOf = st => Math.atan2(stations[st].g.position.x, -stations[st].g.position.z);
  let dth = thOf(bSt) - thOf(aSt);
  while (dth > Math.PI) dth -= TAU; while (dth < -Math.PI) dth += TAU;
  zDustEnsure();
  zm = { t:0, dir, to, aSt, bSt, inward: to === pair[1], jumped:false, thA: thOf(aSt), dth, bh: pair[1] === "bh",
         dur: ZDUR, qA: stations[aSt].inner.quaternion.clone(), push: 0 };
  zStarRel = 0;
  Music.portal(dir > 0);
}
const zProg = () => { const e = smooth(0, 1, clamp(zm.t/zm.dur, 0, 1)); return zm.inward ? e : 1 - e; };
// Картинка станции на полёте. Обе станции стоят в одной точке кольца и масштабируются относительно
// СВОЕГО ЦЕНТРА — а центр и есть точка, куда смотрит камера. Поэтому поток на экране строго радиальный
// из середины кадра: паутина расходится и уходит за все четыре края, галактика растёт из точки ровно
// там же. Раньше здесь была «наводка на узел» со сдвигом сцены вбок — именно она уводила паутину за
// край кадра одним движением и читалась как «объект уехал», а не «мы пролетели насквозь».
// Показатель экспоненты у обеих один, поэтому скорость приближения воспринимается постоянной.
function zoomVis(i){
  if (!zm) return null;
  const z = zProg();
  // уходящая станция: разлетаясь, облако размазывается по всё большему телесному углу и на середине
  // полёта гаснет само по себе — поэтому по мере расширения поднимаем яркость, иначе в середине
  // перехода кадр пустеет. Заодно это и физически верно: частицы, мимо которых мы летим, ближе
  const bo = ZBOOST[zm.aSt] || 0;
  if (i === zm.aSt) return { s: Math.exp(z*ZK), o: (1 + bo*smooth(0, .62, z))*(1 - smooth(.62, .96, z)) };
  if (i === zm.bSt) return { s: Math.exp((z - 1)*ZK), o: smooth(.02, .22, z) };
  return null;
}
function zoomEnd(){
  if (!zm) return;
  if (zDustG) zDustG.visible = false;
  zStar(0, .15); zStarRel = .9;
  for (const si of [zm.aSt, zm.bSt]){
    const st = stations[si];
    st.g.position.set(Math.sin(si/N*TAU)*R, 3.4, -Math.cos(si/N*TAU)*R);
    st.g.lookAt(0, 3.4, 0);
    st.inner.position.set(0, 0, 0);
  }
  zm = null;
}
const ZPUSH_MAX = 1.2;   // сколько секунд полёта максимум можно «докрутить» за секунду реального времени
function zoomTick(dt, now){
  if (!zm) return;
  const extra = Math.min(zm.push, dt*ZPUSH_MAX);
  zm.push -= extra;
  zm.t += dt + extra;
  const z = zProg();
  // подмена путешествия — когда приходящая станция уже заполнила кадр, а уходящая ушла за камеру.
  // Картинка в этот момент не меняется вообще: обе станции стоят на одной точке, камера следует за ней
  if (!zm.jumped && (zm.inward ? z > .55 : z < .45)){
    zm.jumped = true;
    if (zm.dir > 0) jHist.push(jId); else if (zm.dir < 0) jHist.pop(); else jHist = [];
    setJourney(zm.to);
    depth = depthT = zm.dir > 0 ? 0 : DMAX - 1;
    shownLevel = -1; hSel = -1; lastDepthInput = now;
    jumpRing(jSt, zm.dir || 1);
    drawDepth(); renderLevel(Math.round(depth)); depthMark(); syncBtns();
    Music.end();
  }
  if (zm.t > zm.dur){ zoomEnd(); return; }
  // поле пролёта: держим его у камеры и гоним навстречу. Полтора оборота за полёт — достаточно,
  // чтобы поток читался, но не превращался в «гиперпространство»
  if (zDustG){
    zDustG.visible = true;
    zDustG.position.copy(camera.position); zDustG.quaternion.copy(camera.quaternion);
    const u = zDust.material.uniforms;
    u.uProg.value = z*1.5;
    u.uOpacity.value = .85*smooth(0, .10, z)*(1 - smooth(.88, 1, z));
  }
  // zp — доля пройденного пути, всегда 0→1 в обе стороны. Знак потока зависит от направления:
  // летим внутрь — звёзды расходятся от оси, наружу — сходятся к ней
  const zp = zm.inward ? z : 1 - z;
  // ось потока — направление НА станцию, а не «вперёд по камере»: станция в кадре смещена вправо
  // (слева текстовая колонка), и точка схода потока обязана совпасть именно с ней
  zAxis.copy(stations[zm.aSt].g.position).sub(camera.position).normalize();
  bgStars.material.uniforms.uCur.value.copy(zAxis);
  zStar((zm.inward ? 1 : -1)*ZFLOW*smooth(0, .85, zp), 1 - .85*smooth(.62, 1, zp));
  zAstro = 1 - .98*smooth(0, .14, zp);
  // обе станции — на одной интерполированной точке кольца (по углу, чтобы радиус не проседал)
  const th = zm.thA + zm.dth*smooth(.22, .9, z);
  for (const si of [zm.aSt, zm.bSt]){
    const g = stations[si].g;
    g.position.set(Math.sin(th)*R, 3.4, -Math.cos(th)*R);
    g.lookAt(0, 3.4, 0);
  }
}
$("hBack").onclick = closeHuman;
$("btnHuman").onclick = () => humanOpen && jKind === "h" ? closeHuman() : openHuman();
$("btnEarth").onclick = () => humanOpen && jKind === "e" ? closeHuman() : openEarth();
$("toEarth").onclick = openEarth;
$("moonBtn").onclick = () => jGo("moon");   // с Земли — полёт (213-moon-flight.js), см. flashTo
// значок Луны — из частиц, как все объекты сайта: точки сферы, моря темнее, фаза — серп, свет справа.
// v183: рисунок вынесен в moonDots(): тот же рисунок крупно рисует полёт к Луне (213-moon-flight.js) —
// он начинается ровно со значка, поэтому подмена незаметна. warm 0…1 — тон тёплого света сцены Луны.
let moonDots = null;
(() => {
  const cv = $("moonCv"), c = cv.getContext("2d"), mb = $("moonBtn"), N = 2200, P = [];
  const MARIA = [[.35, .55, .42], [.2, -.1, .3], [-.25, .35, .28], [.05, .95, .22], [-.45, -.2, .2], [.6, -.35, .18]];   // [широта, долгота, радиус] морей
  for (let i = 0; i < N; i++){ const y = Math.random()*2 - 1, r = Math.sqrt(1 - y*y), t = Math.random()*6.2832, x = Math.cos(t)*r, z = Math.sin(t)*r;
    const lat = Math.asin(y), lon = Math.atan2(x, z); let alb = .9;
    for (const [la, lo, rr] of MARIA){ const d = Math.acos(clamp(Math.sin(lat)*Math.sin(la) + Math.cos(lat)*Math.cos(la)*Math.cos(lon - lo), -1, 1)); if (d < rr) alb = Math.min(alb, .45 + .45*(d/rr)**2); }
    P.push({ x, y, z, alb: alb*(.8 + .4*Math.random()), s: Math.random()*6.28, k: .6 + Math.random()*.8 }); }
  const HALO = Array.from({ length: 90 }, () => { const a = Math.random()*6.2832, r = 1.08 + Math.random()*.32; return [Math.cos(a)*r, Math.sin(a)*r, Math.random()*6.28]; });
  let hov = 0; mb.addEventListener("pointerenter", () => hov = 1); mb.addEventListener("pointerleave", () => hov = 0);
  let h = 0, last = 0;
  // R — радиус диска в пикселях холста; размеры точек и ореола пропорциональны R (у значка R = 0,4 ширины)
  moonDots = (c, cx, cy, R, t, h, warm = 0, al = 1) => {
    // крупно (полёт): точки мельче относительно диска, под ними — мягкая подложка с терминатором, без ореола
    const big = smooth(60, 200, R), a = t/1000*.08, ca = Math.cos(a), sa = Math.sin(a), u = R/48*(1 - .4*big), hw = 1 - warm;
    if (big > 0){ const f = big*al, gr = c.createLinearGradient(cx - R*.35, 0, cx + R, 0);
      gr.addColorStop(0, "rgba(60,34,22,0)"); gr.addColorStop(.3, `rgba(150,100,78,${.3*f})`); gr.addColorStop(1, `rgba(245,205,180,${.5*f})`);
      c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.fill(); }
    const g = c.createRadialGradient(cx, cy, R*.85, cx, cy, R*1.225); g.addColorStop(0, `rgba(235,226,200,${(.08 + .07*h)*al*hw})`); g.addColorStop(1, "rgba(235,226,200,0)"); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R*1.225, 0, 6.2832); c.fill();
    for (const [hx, hy, hs] of HALO){ const ah = (.12 + .1*Math.sin(t/1000*.9 + hs) + .1*h)*al*hw; if (ah <= 0) continue; c.fillStyle = `rgba(240,228,196,${ah})`; c.beginPath(); c.arc(cx + hx*R, cy + hy*R, R/60, 0, 6.2832); c.fill(); }
    const L = [.86, .18, .47];                                   // направление на Солнце — серп справа
    // тёплый тон — как Луна на слое станции: светлые точки персиковые, ободок у терминатора почти белый
    const cr = 245 + 10*warm, cg = 238 - 30*warm, cb = 220 - 45*warm;
    for (const p of P){ const x = p.x*ca + p.z*sa, z = -p.x*sa + p.z*ca, y = p.y; if (z < 0) continue;
      const lam = Math.max(0, x*L[0] + y*L[1] + z*L[2]), earth = .05, b = (lam*lam*.9 + earth)*p.alb*(.85 + .15*Math.sin(t/1000*1.3 + p.s))*(1 + .35*h);
      if (b < .03) continue;
      const lum = Math.min(1, b*1.25), rr = (.55 + .8*Math.min(1, b))*p.k*u;
      c.fillStyle = `rgba(${cr*lum + 10|0},${cg*lum + 8|0},${cb*lum + 6|0},${Math.min(1, .25 + b)*al})`;
      c.beginPath(); c.arc(cx + x*R, cy - y*R, rr, 0, 6.2832); c.fill(); }
  };
  moonDots.hov = () => h;
  (function draw(t){ requestAnimationFrame(draw);
    if (!mb.classList.contains("on")) return;
    const dt = Math.min(.1, (t - last)/1000 || 0); last = t; h += (hov - h)*Math.min(1, dt*4);
    const W = cv.width; c.clearRect(0, 0, W, W); moonDots(c, W/2, W/2, W*.4, t, h);
  })(0);
})();
// ветка «Чёрная дыра»: с кольца — сначала страница Галактики, затем сразу полёт к ядру
function openBH(){
  galBranch = "bh";
  if (humanOpen && jId === "bh") return;
  if (humanOpen && jId === "g3"){
    if (tr || zm) return;
    // со слоя Ланиакеи сначала спускаемся к диску галактики — в ядро летим уже из неё
    // ждём, пока диск действительно вырастет, а не фиксированное время: на медленной машине
    // таймер отпустил бы полёт посреди погружения, и диск дёрнулся бы к полному размеру
    depthT = 1; lastDepthInput = performance.now();
    // если читатель сам прокрутил обратно (depthT ушёл с 1) — полёт отменяется
    (function wait(){
      if (!humanOpen || jId !== "g3" || tr || zm || depthT < .99) return;
      if (depth > .97) startTransit(1); else setTimeout(wait, 120);
    })();
    return;
  }
  openJourney("g3");
  setTimeout(() => { if (humanOpen && jId === "g3" && !tr && !zm) startTransit(1); }, 1500);
}
$("toBH").onclick = openBH;
$("mBH").onclick = () => { toggleMenu(false); openBH(); };
$("btnIz").onclick = () => izEnter(false);
$("toHuman").onclick = openHuman;
$("toDims").onclick = () => openDims(0);
addEventListener("resize", () => { if (humanOpen){ drawDepth(); depthMark(); } });
addEventListener("wheel", e => {
  if (!humanOpen || menuOpen) return;
  const b = e.target.closest && e.target.closest("#hdBody");
  if (b){ const up = e.deltaY < 0; if (up ? b.scrollTop > 2 : b.scrollTop + b.clientHeight < b.scrollHeight - 2) return; }
  e.preventDefault();
  // пока идёт полёт или вспышка — колесо гонит саму анимацию перехода, а не глубину: иначе
  // непонятно, докручивать ли дальше, и станция ощущается «приклеенной»
  if (zm || tr){
    const dn = e.deltaMode === 1 ? e.deltaY*16 : e.deltaY;
    const step = clamp(Math.abs(dn)/100, .1, 1.2);
    if (zm){ if ((dn > 0) === zm.inward) zm.push = Math.min(zm.push + step*.25, 1.2); }   // только «по ходу» полёта
    else tr.t += Math.min(step*.25, .1);
    lastDepthInput = performance.now();
    return;
  }
  // шаг по глубине: у коротких путешествий (обобщённая станция — один слой) он крупнее,
  // иначе чтобы просто уйти со станции приходится накручивать ~8 щелчков
  if (solarOn() && SOLAR.sel >= 0){ solarSelect(-1); lastDepthInput = performance.now(); return; }
  const k = (e.deltaMode === 1 ? .05 : .0016)*(DMAX <= 2 ? 3.2 : 1.4);
  depthT = clamp(depthT + clamp(e.deltaY*k, -.45, .45), -1, DMAX); lastDepthInput = performance.now();
}, {passive:false});
let hty = null;
addEventListener("touchstart", e => { hty = humanOpen && !(e.target.closest && e.target.closest("#hdBody, button")) ? e.touches[0].clientY : null; }, {passive:true});
addEventListener("touchmove", e => { if (hty === null || !humanOpen) return; const y = e.touches[0].clientY; if (zm || tr){ const st_ = clamp(Math.abs(hty - y)/70, .05, 1)*.25; if (zm){ if (((hty - y) > 0) === zm.inward) zm.push = Math.min(zm.push + st_, 1.2); } else tr.t += Math.min(st_, .1); hty = y; lastDepthInput = performance.now(); return; } if (solarOn() && SOLAR.sel >= 0){ if (Math.abs(hty - y) > 18){ solarSelect(-1); hty = y; } lastDepthInput = performance.now(); return; }
  if (!tr && !zm) depthT = clamp(depthT + (hty - y)*.006, -1, DMAX); hty = y; lastDepthInput = performance.now(); }, {passive:true});

// глава: путь
const chPath = $("chPath"); let pathOpen = false;
$("stages").innerHTML = DATA.stages.map((s, k) => `
  <article class="stage">
    <div class="no" aria-hidden="true">${s.n}</div>
    <div><h3>${esc(s.name)}</h3><div class="meta">${esc(s.sub)}<br>Станции: ${esc(s.st)}<br>Срок: ${esc(s.time)}</div>
      <button class="go" data-k="${k}" data-hover>${k === 4 ? "Открыть карту человека →" : "Перейти на станцию →"}</button></div>
    <dl><dt>Узнать</dt><dd>${esc(s.know)}</dd><dt>Почувствовать</dt><dd>${esc(s.prac)}</dd><dt>Прожить</dt><dd>${esc(s.life)}</dd><dt>Осмыслить</dt><dd class="qq">${esc(s.q)}</dd></dl>
  </article>`).join("");
$("stages").querySelectorAll(".go").forEach(b => b.onclick = () => { const k = +b.dataset.k; closePath(); if (k === 4) openHuman(); else pendingDive = {i:STAGE_ST[k], moved:false}; });
function openPath(){ chFrom("path"); closeChapters(); toggleMenu(false); surface(); pathOpen = true; chPath.classList.add("open"); chPath.setAttribute("aria-hidden","false"); $("btnPath").setAttribute("aria-pressed","true"); $("pathClose").focus(); }
function closePath(){ if (!pathOpen) return; pathOpen = false; chPath.classList.remove("open"); chPath.setAttribute("aria-hidden","true"); $("btnPath").setAttribute("aria-pressed","false"); }
$("pathClose").onclick = () => { if (!chBack("path")) closePath(); };
$("btnPath").onclick = () => pathOpen ? closePath() : openPath();
function closeSide(){ closePath(); closeRef(); closeTime(); closeTree(); closeThought(); closeCompass(); closeMine(); closeDims(); closeBio(); closeRouteList(); }   // все главы, кроме погружения
function closeChapters(){ closeHuman(); closeSide(); }
