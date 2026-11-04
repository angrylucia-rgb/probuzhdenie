/* ---------- за горизонт: погружение в чёрную дыру и вход в Изнанку ----------
   bhDv.t — секунды погружения. 0–4,6 с камера падает к горизонту (радиус по экспоненте, чтобы скорость
   падения воспринималась растущей), поле зрения расширяется, крен уходит. Тень заполняет кадр сама —
   это настоящая оптика: изнутри фотонной сферы тень занимает больше половины неба. С 4,2 с последние
   полоски света гаснут, в 4,6 с — полная темнота, и в ней проявляется плазма Изнанки. */
let bhDv = null, bhR = 34, izMusic = false, bhHotWas = false, bhBloomCut = 0;
const bhCanPoint = () => humanOpen && jId === "bh" && !tr && !zm && !bhDv && !menuOpen && hm > .9;
function izMusicOff(){ izMusic = $("sound").getAttribute("aria-pressed") === "true"; if (izMusic) Music.toggle(false); }
function izMusicBack(){ if (izMusic) Music.toggle(true); izMusic = false; }
function bhDiveStart(){
  if (bhDv || !(humanOpen && jId === "bh")) return;
  IZ.prime();                                           // звук Изнанки можно завести только внутри жеста
  bhDv = { t:0, R0: bhR, opened:false, done:false };
  depthT = depth = Math.min(depth, DMAX - 1);
  document.body.classList.add("bh-dive");
  Music.portal(true);
}
function bhReturn(){
  // выход из Изнанки — обратно к дыре, на первый слой ветки: Астролябия проступает под гаснущей плазмой
  document.body.classList.remove("bh-dive");
  bhDv = null; izMusicBack();
  galBranch = "bh"; openJourney("bh");
}
function izEnter(fromBH){
  IZ.prime();
  // v151: открытые главы (Биосфера, Древо, Календарь…) рисуют свои сцены в своих циклах кадров — под непрозрачной Изнанкой это двойная нагрузка на видеокарту. Закрываем их на входе.
  if (!fromBH){ toggleMenu(false); closeChapters(); izMusicOff(); IZ.open({ onExit: izMusicBack }); return; }
  izMusicOff();
  IZ.open({ fromBlack:true, onExit: bhReturn });
}
function bhTick(dt){
  if (!bhDv) return;
  bhDv.t += dt;
  if (!bhDv.opened && bhDv.t > 4.6){
    bhDv.opened = bhDv.done = true;
    // экран уже чёрный: тихо сворачиваем панель, чтобы после выхода вернуться к дыре с чистого листа.
    // Дальше Астролябия спит — пока полотно Изнанки непрозрачно, цикл кадров её не рисует
    humanOpen = false; jHist = []; hm = 0; chHuman.classList.remove("open"); chHuman.setAttribute("aria-hidden", "true"); syncBtns();
    izEnter(true);
  }
}

let last = performance.now(), T = 0;
function loop(now){
  if (IZ.opaque || FILM.opaque){ last = now; requestAnimationFrame(loop); return; }
  const dt = Math.min(.05, (now - last)/1000); last = now; T += dt; U.time.value = T;
  if (now - lastInput > 420){
    if (target > -.5){ target += (Math.round(target) - target)*Math.min(1, dt*3); if (Math.abs(target - Math.round(target)) < 1e-3) target = Math.round(target) + 0; }
    else target += ((target < -.75 ? -1 : 0) - target)*Math.min(1, dt*3);
  }
  transitTick(dt, now);
  zoomTick(dt, now);
  bhTick(dt);
  if (tr && tr.soft){ zStar(0, tr.dip); zAstro = Math.min(zAstro, tr.dip); }
  if (zStarRel > 0 && !zm){ zStarRel = Math.max(0, zStarRel - dt); zStar(0, 1 - .85*smooth(0, .55, zStarRel/.9)); }
  gSway += (Math.sin(T*.12) - gSway)*(zm ? 0 : Math.min(1, dt*.8));
  if (!zm && zAstro < 1) zAstro = Math.min(1, zAstro + dt*.9);
  const prev = pos;
  pos += (target - pos)*(1 - Math.exp(-dt*(travel ? 2.2 : 3.2)));
  if (Math.abs(target - pos) < .002){ pos = target; travel = false; }
  vel += ((pos - prev)/Math.max(dt, 1e-3) - vel)*.15;

  const e = ease(clamp(pos + 1, 0, 1));
  const u = Math.max(0, pos), m = mod(u, 14);
  const s = ringS(u);
  const kA = bell(m, 7), kB = bell(m, 13), k = Math.max(kA, kB);
  hm += ((humanOpen ? 1 : 0) - hm)*Math.min(1, dt*1.6);
  const hE = ease(clamp(hm, 0, 1));
  if (humanOpen && now - lastDepthInput > 450) depthT += (Math.round(depthT) - depthT)*Math.min(1, dt*3);
  const slowT = jKind === "a" ? .45 : jKind === "g" ? .8 : jKind === "h" ? ((Math.min(depth, depthT) > 3.9 && Math.max(depth, depthT) < 5.1) || (Math.min(depth, depthT) > 7.9 && Math.max(depth, depthT) < 9.1) ? .5 : 1) : (Math.min(depth, depthT) > 5.9 && Math.max(depth, depthT) < 7.1 ? .55 : Math.min(depth, depthT) > 13.9 ? .7 : .85);
  depth += (depthT - depth)*(1 - Math.exp(-dt*2.2*slowT));
  if (Math.abs(depthT - depth) < .0005) depth = depthT;
  if (humanOpen && !tr && !zm && !bhDv && depthT > DMAX - .01 && depth > DMAX - .75) startTransit(1);
  if (humanOpen && !tr && !zm && !bhDv && depthT < -.99 && depth < -.25) startTransit(-1);
  const loopT = tr ? 0 : -1;
  const dPos = Math.max(0, depth);
  const hH = jKind === "h" ? hE : 0, hEa = jKind === "e" || jKind === "a" || jKind === "g" ? hE : 0;
  stations[6].api.look(jKind === "h" ? dPos : 0, hH, stations[6].vis);
  if (humanOpen){ const Lr = Math.round(depth); if (Lr >= 0 && Math.abs(depth - Lr) < .35 && Lr !== shownLevel && Lr < JL.length) renderLevel(Lr); depthMark(); }
  { const white = humanOpen && jKind === "a" && depth < .45 && hE > .05;
    if (white !== document.body.classList.contains("j-white")){ document.body.classList.toggle("j-white", white); Music.om(white); } }
  diveT = clamp(diveT + Math.sign(diveGoal - diveT)*dt/(reduce ? .45 : 1.7), 0, 1);
  const dE = ease(diveT), dB = Math.sin(diveT*Math.PI);
  if (diveT === 0 && !insideOpen && interior.classList.contains("open")){ interior.classList.remove("open"); }
  if (pendingDive){
    if (!pendingDive.moved && diveT < .4){ goTo(pendingDive.i); pendingDive.moved = true; }
    else if (pendingDive.moved && Math.abs(pos - target) < .03 && diveT === 0){ const j = pendingDive.i, inn = pendingDive.inner; pendingDive = null; inn ? openInterior(j) : dive(j); }
  }
  const uiHide = Math.max(hE, dE);

  // поза камеры
  stationPose(s, S0);
  if (pos < 0){
    P.pos.lerpVectors(OV.pos, S0.pos, e); P.pos.y += Math.sin(e*Math.PI)*6;
    P.tgt.lerpVectors(OV.tgt, S0.tgt, e); P.up.lerpVectors(OV.up, S0.up, e).normalize();
  } else { P.pos.copy(S0.pos); P.tgt.copy(S0.tgt); P.up.copy(S0.up); }
  if (hEa > .001){
    const g6 = stations[jSt].g.position;
    nIn.set(-g6.x, 0, -g6.z).normalize();
    const dist = jKind === "g" ? (W < 760 ? 10.5 : 7.6) : 12.5*(W < 760 ? 1.6 : 1)*(1 - .35*smooth(0, 1, hEa)*smooth(.2, 1, dPos));
    HP.tgt.set(g6.x, g6.y + .15, g6.z);
    HP.pos.copy(HP.tgt).addScaledVector(nIn, dist); HP.pos.y += .4;
    // Боковое покачивание камеры на время полёта замораживаем: при двадцатикратном увеличении даже
    // сорок пикселей увода точки схода ломают ощущение движения вперёд. Гасим не амплитуду (это был бы
    // рывок в самом начале полёта), а слежение за фазой — значение просто застывает там, где застало
    if (jKind === "g"){ tmpV.set(nIn.z, 0, -nIn.x); HP.pos.addScaledVector(tmpV, gSway*1.2*hEa); }
    // подлёт к планете: камера остаётся на месте и лишь доворачивается на выбранное тело — оно
    // становится точкой схода, и вся система разлетается мимо него радиально
    if (SOLAR && jKind === "g" && jId === "g4") HP.tgt.addScaledVector(SOLAR.aim, hEa);
    P.pos.lerp(HP.pos, hEa); P.tgt.lerp(HP.tgt, hEa);
  }
  if (hH > .001){
    const hE = hH;
    const g7 = stations[6].g.position;
    nIn.set(-g7.x, 0, -g7.z).normalize();
    const b4 = Math.max(0, 1 - Math.abs(depth - 4));
    const fyT = hSel >= 0 ? stations[6].api.y[hSel]*b4 + .15*(1 - b4) : .15;
    fy += (fyT - fy)*Math.min(1, dt*2.2);
    const dist = (12.5 - 4.8*smooth(0, 4, depth) + .7*smooth(5.3, 6, depth) + .4*smooth(4.4, 5.4, depth) - .4*smooth(5.5, 7, depth) + .3*smooth(7.3, 8, depth) - (hSel >= 0 ? 1.4*b4 : 0)) * (W < 760 ? 1.6 : 1) * (1 - .95*smooth(7.95, 8.42, depth));
    HP.tgt.set(g7.x, g7.y + fy, g7.z);
    const spK = smooth(7.9, 8.3, depth);
    if (spK > 0){ stations[6].api.spinePt(tmpV); HP.tgt.lerp(tmpV, spK); }
    HP.pos.copy(HP.tgt).addScaledVector(nIn, dist); HP.pos.y += .4;
    P.pos.lerp(HP.pos, hE); P.tgt.lerp(HP.tgt, hE);
  }
  if (dE > .001 && diveSt >= 0){
    const gp = stations[diveSt].g.position;
    tmpN.set(-gp.x, 0, -gp.z).normalize();
    const dist = W < 760 ? 10.5 : 7.6;
    HP.tgt.copy(gp); HP.pos.copy(gp).addScaledVector(tmpN, dist); HP.pos.y += .5;
    tmpV.set(tmpN.z, 0, -tmpN.x); HP.pos.addScaledVector(tmpV, Math.sin(T*.12)*1.4*dE);
    P.pos.lerp(HP.pos, dE); P.tgt.lerp(HP.tgt, dE);
  }
  if (!reduce && !coarse){ px += (nx - px)*.04; py += (ny - py)*.04; }
  MF.cam(P);   // v183: полёт к Луне — камера доворачивает на неё
  camera.position.copy(P.pos); camera.up.copy(P.up); camera.lookAt(P.tgt);
  camera.getWorldDirection(fwd); right.crossVectors(fwd, camera.up).normalize(); camUp.crossVectors(right, fwd).normalize();
  const par = e*(1 - Math.max(hE, dE)*.6);
  camera.position.addScaledVector(right, px*.9*par).addScaledVector(camUp, -py*.5*par);
  camera.lookAt(P.tgt);
  if (!reduce){ roll += (clamp(-vel*.1, -.12, .12) - roll)*.1; camera.rotateZ(roll*e); }
  const f = reduce ? 48 : 48 + clamp(Math.abs(vel)*6, 0, 14) + dB*24;
  if (Math.abs(f - fov) > .01){ fov += (f - fov)*.1; camera.fov = fov; }
  const portrait = W < 760;
  const vox = portrait ? 0 : -W*(.08*e*(1-uiHide) + .19*hE + .2*dE), voy = portrait ? H*(.17*e*(1-uiHide) + .29*hE + .3*dE) : 0;
  camera.setViewOffset(W, H, vox, voy, W, H);
  if (hE > .001){ mcam.setViewOffset(W, H, vox, voy, W, H); mcam.updateProjectionMatrix(); }
  camera.updateProjectionMatrix();
  bgMat.uniforms.uC.value.set(portrait ? .5 : .58 + .1*uiHide, portrait ? .62 + .12*uiHide : .55);
  camera.updateMatrixWorld();
  MF.draw();

  // наведение на объект станции
  const frac0 = Math.abs(pos - Math.round(pos));
  const stNow = pos < -.5 ? -1 : stopOf(mod(Math.round(pos), 14)).st;
  if (stNow !== lastHoverI){ lastHoverI = stNow === undefined ? -1 : stNow; atStationSince = T; }
  hoverI = -1;
  const canRing = !menuOpen && !humanOpen && !pathOpen && diveT === 0 && pos > -.5 && k < .05 && Math.abs(target - pos) < .05 && frac0 < .08 && stNow !== undefined;
  const canInside = insideOpen && diveT > .95;
  const testI = canInside ? diveSt : (canRing ? stNow : -1);
  const probe = pointerIn || tapPending || (armed >= 0 && now < armedUntil);
  if (testI >= 0 && probe){
    ray.setFromCamera(ndc, camera);
    const C = stations[testI].g.position;
    hitPlane.setFromNormalAndCoplanarPoint(tmpN.copy(camera.position).sub(C).normalize(), C);
    if (ray.ray.intersectPlane(hitPlane, hitP)){
      const HR = 4.8*stations[testI].inner.scale.x;
      if (hitP.distanceTo(C) < HR){ hoverI = testI; stations[testI].hit.copy(hitP); }
    }
  }
  if (tapPending){
    tapPending = false;
    if (hoverI >= 0 && !insideOpen){ if (armed === hoverI && now < armedUntil){ armed = -1; dive(hoverI); } else { armed = hoverI; armedUntil = now + 3500; } }
    else armed = -1;
  }
  if (armed >= 0 && now >= armedUntil) armed = -1;
  if (hoverI >= 0 && stations[hoverI].hov < .05 && !insideOpen) Music.hover();
  cur.classList.toggle("dive", (hoverI >= 0 && !insideOpen) || (bhCanPoint() && pointerIn && BH.hole));
  rlab.textContent = coarse ? "Коснитесь ещё раз" : "Погрузиться";
  // прямое взаимодействие курсора со станцией, в которую мы погружены через дневниковую панель (jKind==="g",
  // напр. «Первоимпульс»): обычный raycast-ховер (canRing) выше специально отключён на время humanOpen,
  // поэтому H.h там всегда оставался нулевым и фигура не реагировала на курсор, пока открыта её страница.
  // Реагируем на весь кадр, а не только на узкий «диск» станции — здесь фигура и так занимает весь экран.
  let jHovOn = false;
  if (jKind === "g" && hE > .5 && !menuOpen && (pointerIn || tapPending)){
    const stJ = stations[jSt];
    ray.setFromCamera(ndc, camera);
    hitPlane.setFromNormalAndCoplanarPoint(tmpN.copy(camera.position).sub(stJ.g.position).normalize(), stJ.g.position);
    if (ray.ray.intersectPlane(hitPlane, hitP)){ stJ.hit.copy(hitP); jHovOn = true; }
  }
  // станция V: наведение на планеты и точка курсора на шаре выбранной планеты
  if (SOLAR){
    const on = humanOpen && jKind === "g" && jId === "g4" && hE > .5 && !menuOpen && !tr && !zm
               && SOLAR.selE < .55 && SOLAR.sunE < .35;
    const pI = on && pointerIn ? SOLAR.pick(camera, ndc.x, ndc.y, W/H) : -1;
    SOLAR.hovI = pI;
    const B = SOLAR.bodies;
    for (let k = 0; k < B.length; k++){
      // у выбранной планеты курсор «работает» по всему кадру — мы к ней подлетели, она и есть кадр
      const want = SOLAR.sel === k ? (pointerIn && humanOpen && jId === "g4" ? 1 : 0) : (pI === k ? 1 : 0);
      B[k].hov += (want - B[k].hov)*Math.min(1, dt*4.5);
      if (B[k].hov < .003) B[k].hov = 0;
    }
    // подлёт к Земле доигран — уходим в главу «Погружение в Землю»
    if (SOLAR.goEarth){ SOLAR.goEarth = false; SOLAR.sel = -1; SOLAR.selE = 0; openJourney("earth"); }
    if (SOLAR.goJup){ SOLAR.goJup = false; jGo("jup"); }
    const hk = SOLAR.sel >= 0 && SOLAR.sel < 8 ? SOLAR.sel : (pI >= 0 && pI < 8 ? pI : -1);
    if (hk >= 0 && pointerIn){
      // пересечение луча с единичной сферой в собственных координатах планеты
      const bd = B[hk];
      ray.setFromCamera(ndc, camera);
      tmpV.copy(ray.ray.origin); bd.sph.worldToLocal(tmpV);
      tmpN.copy(ray.ray.origin).add(ray.ray.direction); bd.sph.worldToLocal(tmpN); tmpN.sub(tmpV).normalize();
      const bq = tmpV.dot(tmpN), cq = tmpV.lengthSq() - 1, disc = bq*bq - cq;
      if (disc >= 0) bd.cur.copy(tmpV).addScaledVector(tmpN, -bq - Math.sqrt(disc));
      else bd.cur.copy(tmpV).addScaledVector(tmpN, -bq).normalize();
    }
    cur.classList.toggle("part", pI >= 0);
    if (pI >= 0 && pI !== lastSolarHov) Music.hover();
    lastSolarHov = pI;
  }
  // наведение на мышцы, органы и кости
  {
    // Подсветку получает слой, ближайший по глубине. Прежнее строгое окно ±0,3 вокруг уровня
    // оставляло мёртвые зоны между уровнями: скелет уже виден на экране (он проявляется с 7,3),
    // а «рентген» под курсором ещё не включался — это и читалось как «просвечивание перестало работать».
    const act = humanOpen && jKind === "h" && loopT < 0 && hE > .9 && depth > 5.55 && depth < 8.95
      ? clamp(Math.round(depth) - 6, 0, 2) : -1;
    const probeH = act >= 0 && (pointerIn || humanTouch) && !menuOpen;
    if (probeH) ray.setFromCamera(ndc, camera);
    const diveK = hH*smooth(7.95, 8.3, dPos)*(1 - smooth(8.9, 9.2, dPos));
    // Пролёт «Скелет → Ткани» начинается уже на 7,95, а уровень «Скелет» стоит ровно на 8,0 — порог
    // в 0,003 отбирал управление линзой у курсора ровно в тот момент, когда читатель доходит до скелета.
    // Отдаём её автопогружению только когда пролёт действительно пошёл.
    const diveOn = diveK > .12;
    const hvR = stations[6].api.refTick(dt, ray, diveOn ? -1 : act, probeH && !diveOn, diveOn ? diveK : 0);
    const nOn = humanOpen && jKind === "h" && loopT < 0 && hE > .9 && Math.abs(depth - 10) < .3 && (pointerIn || humanTouch) && !menuOpen;
    const nnI = MICRO.pickNeuron(ndc.x, ndc.y, nOn);
    const mOn = humanOpen && jKind === "h" && loopT < 0 && hE > .9 && (pointerIn || humanTouch) && !menuOpen;
    MICRO.pointer(ndc.x, ndc.y, mOn && Math.abs(depth - 11) < .3, mOn && Math.abs(depth - 12) < .3);
    const hv = hvR || MICRO.cellHit() || (nnI >= 0 ? { kind:"neu", h:1, box:MICRO.neuronBox(), m:{ id:nnI, name:"Нейрон", desc:"Клетка разгорается, и импульс бежит по аксону к синапсу — там сигнал передаётся соседнему нейрону.", note:"по миелинизированным волокнам — до 100 м/с и быстрее; в синапсе сигнал передают молекулы-нейромедиаторы." } } : null);
    if (act < 0 && (depth < 9.7 || depth > 12.3)) humanTouch = false;
    cur.classList.toggle("part", !!hv && hv.h > .3);
    const tipK = hv ? hv.kind + hv.m.id : null;
    if (tipK !== tipId){
      tipId = tipK;
      if (hv){
        const m = hv.m, TYP = {long:"трубчатая", flat:"плоская", spongy:"губчатая"};
        ptip.querySelector(".pk").textContent = hv.kind === "mus" ? "Мышцы" : hv.kind === "org" ? "Органы" : hv.kind === "neu" ? "Нервная ткань" : hv.kind === "cell" ? "Строение клетки" : "Кость · " + TYP[m.type];
        ptip.querySelector("b").textContent = m.name;
        ptip.querySelector(".pd").textContent = m.desc;
        ptip.querySelector(".pn").innerHTML = `<i class="mk ${hv.kind === "bone" ? "s" : "d t"}"></i><span>${esc((hv.kind === "bone" ? "Строение: " : hv.kind === "neu" ? "Скорость: " : hv.kind === "cell" ? "Интересно: " : "Практика: ") + m.note)}</span>`;
      }
    }
    const tOp = hv ? clamp(hv.h*1.6, 0, 1) : 0;
    ptip.style.opacity = String(tOp);
    if (tOp > 0 && !portrait){
      const tw = ptip.offsetWidth, th = ptip.offsetHeight;
      let tx, tyy;
      if (hv.box){
        // подсказка рядом с элементом, но не поверх него
        const b = hv.box, gap = 26;
        tx = b.x + b.r + gap; tyy = b.y - th/2;
        if (tx + tw > W - 16){ tx = b.x - b.r - gap - tw; }
        if (tx < 16){ tx = clamp(b.x - tw/2, 16, W - tw - 16); tyy = b.y - b.r - gap - th; if (tyy < 70) tyy = b.y + b.r + gap; }
        else tyy = clamp(tyy, 70, H - th - 16);
      } else {
        tx = cx + 34; tyy = cy - th/2;
        if (tx + tw > W - 16) tx = cx - 34 - tw;
        tyy = clamp(tyy, 70, H - th - 16);
      }
      ptip.style.transform = `translate(${tx}px,${tyy}px)`;
    }
    ptip.classList.toggle("top", !!(portrait && hv && hv.box && hv.box.y > H*.22));
  }

  alid.rotation.y = -s/N*TAU;
  alid.visible = e < .98; if (alid.visible) alidMats.forEach(([mm, b]) => mm.opacity = b*(1 - e));
  for (let i = 0; i < N; i++){
    const st = stations[i];
    let d = Math.abs(mod(s - i, N)); d = Math.min(d, N - d);
    let v = 1 - smooth(1.4, 3.0, d);
    v = v*e + (1 - e);
    if (hE > .01 && i !== jSt) v *= 1 - hE*.8;
    // во время пролёта обе станции пары рисуются по своим правилам, а не по правилу «не текущая — тусклее»
    const zv = zoomVis(i);
    if (zv) v = zv.o;
    const mv = MF.vis(i); if (mv != null) v = mv;
    // мягкий переход: станция «Атом» держится в центре кадра и перетекает со сценой Земли
    // глобус станции «Земля» на время растворения убираем: обычно его закрывает собственный фон
    // сцены Земли, а на переходе этот фон приглушён — и глобус проступил бы поверх атома
    if (tr && tr.soft && i === 5) v = 0;
    const soft = tr && tr.soft && i === SOFT_ST;
    if (soft){
      v = Math.max(v, tr.fg);
      if (tr.jumped && tr.dir < 0){ st.g.position.copy(stations[jSt].g.position); st.g.lookAt(0, 3.4, 0); }
    }
    if (dE > .001 && i !== diveSt) v *= 1 - dE*.94;
    const jHovHere = jHovOn && jKind === "g" && i === jSt;
    st.hov += ((i === hoverI || jHovHere ? 1 : 0) - st.hov)*Math.min(1, dt*(i === hoverI || jHovHere ? 1.4 : .9));
    if (st.hov < .002) st.hov = 0;
    if (Math.abs(v - st.vis) > .001){
      st.vis = v; st.g.visible = v > .01;
      for (const [mm, b] of st.mats){ if (mm.uniforms) mm.uniforms.uOpacity.value = v; else mm.opacity = b*v; }
    }
    if (st.g.visible){
      const dv = i === diveSt ? dB : (jKind === "g" && i === jSt ? .35*hE : 0);
      if (st.hov > 0 || st.dv !== dv || st.hovWas){
        tmpV.copy(st.hit); st.inner.worldToLocal(tmpV);
        st.H.h = st.hov; st.H.x = tmpV.x/4; st.H.y = tmpV.y;
        for (const o of st.pts){ const un = o.material.uniforms; un.uHov.value = st.hov; un.uDive.value = dv; if (st.hov > 0){ tmpV.copy(st.hit); o.worldToLocal(tmpV); un.uCur.value.copy(tmpV); } }
        st.dv = dv; st.hovWas = st.hov > 0;
      }
      if (st.hov === 0) st.H.h = 0;
      st.H.v = v;
      if (i === 4){ st.H.sun = humanOpen && jKind === "g" && jId === "g4" ? clamp(depth, 0, 1) : 0;
                    st.H.depth = humanOpen && jKind === "g" && jId === "g4" ? Math.max(0, depth) : 0;
                    // ветки станции V: Луна, Юпитер и Европа — свои сцены в той же группе станции
                    st.H.body = humanOpen && (jId === "moon" || jId === "jup") ? jId : null;
                    st.H.bd = st.H.body ? (tr && tr.mf ? depth : Math.max(0, depth)) : 0; }   // на полёте к Луне слой 0 стоит «на подходе» (глубина < 0)
      // станция VIII двухслойная: 0 — спираль, 1 — одна молекула из неё
      // на пролёте «Молекула → Атом» станцию держим в состоянии молекулы: после подмены путешествия
      // jSt уже 8, и без этого спираль вернулась бы прямо посреди полёта
      // станция IV двухслойная: 0 — Ланиакея с Местной группой, 1 — сама галактика. На пролёте из
      // «Вселенной» приходим на слой Ланиакеи, на пролётах к Солнцу и к чёрной дыре — на диск
      if (i === 3) st.H.gl = zm && (zm.aSt === 3 || zm.bSt === 3) ? (zm.aSt === 2 ? 0 : 1)
                           : (humanOpen && jKind === "g" && jId === "g3" ? smooth(0, 1, depth) : 1);
      if (i === 3) st.H.jin = humanOpen && jKind === "g" && jId === "g3" ? hE : 0;   // внутри станции: камера ближе, точки крупнее — гасим, чтобы диск выглядел как на кольце
      if (i === 1) g1TriSync();
      if (i === 1) st.H.cym = humanOpen && jKind === "g" && jId === "g1" ? smooth(0, 1, depth) : (tr && tr.morph && (tr.to === "g1" || jId === "g1") ? 1 : 0);
      // ветка станции VII «Сон и сознание»: фигура ложится, над ней — сцена сна (dream.js)
      if (i === 6){ st.H.dr = humanOpen && jId === "dream"; st.H.drd = st.H.dr ? clamp(depth, 0, 3) : 0; }
      // станция X трёхслойная: 0 — волны, 1 — Стандартная модель, 2 — две щели
      if (i === 9){ const qd = humanOpen && jKind === "g" && jSt === 9 ? clamp(depth, 0, 2) : 0; st.H.sm = qd; st.H.slit = smooth(0, 1, qd - 1); }
      // станция IX трёхслойная: 0 — облако, 1 — ядро, 2 — нуклон. На пролёте «Молекула → Атом» — облако
      if (i === 8) st.H.at = zm && (zm.aSt === 8 || zm.bSt === 8) ? 0 : (humanOpen && jKind === "g" && jSt === 8 ? clamp(depth, 0, 2) : 0);
      if (i === 7) st.H.dna = zm && (zm.aSt === 7 || zm.bSt === 7) ? 1
                            : (humanOpen && jKind === "g" && jSt === 7 ? clamp(depth, 0, 1) : 0);
      // степень растворения в общую сферу (только у станций морф-пары; вне перехода всегда 0, поэтому
      // прерванный переход — например, закрытие панели — не оставляет станцию «застрявшей» растворённой)
      if (!zm && st.H.zs !== undefined){ st.H.zs = undefined; st.H.zc = false; }
      if (MORPH_ST.has(i)){
        const dsv = stDissolve(i);
        st.H.d = dsv;
        for (const o of st.pts) o.material.uniforms.uProg.value = dsv;
      }
      st.upd(T, st.H);
      // приходящая станция получает надбавку текущей станции с самого начала полёта — иначе в момент
      // подмены путешествия её масштаб скакнул бы на 30%
      // вписывание в кадр применяем только пока станция в фокусе: на кольце её вид не меняется,
      // а к моменту прилёта множитель уже тот же, что и в покое, — поэтому стыка не видно
      const foc = zv ? 1 : (jKind === "g" && i === jSt ? hE : (i === diveSt ? dE : (soft ? tr.fg : 0)));
      const base = 1 + .07*st.hov + (i === diveSt ? .4*dE : 0) + ((jKind === "g" && i === jSt) || zv || soft ? .3*hE : 0);
      const fitK = foc > .001 && SEXT[i] ? 1 + (Math.min(1, stationFit(i)/base) - 1)*foc : 1;
      st.fit = fitK;
      // на мягком переходе станция подрастает вместе с уходящим атомом Земли — размеры сходятся
      st.inner.scale.setScalar(base*fitK*(zv ? zv.s : 1)*(soft ? .45 + .55*tr.fg : 1));
      if (zv){
        // собственное вращение уходящей сцены на время полёта замораживаем: на двадцатикратном
        // увеличении оно раскачивает кадр так, что это читается как смена ракурса
        if (i === zm.aSt) st.inner.quaternion.copy(zm.qA);
        // По умолчанию обе станции масштабируются относительно своего центра — центр и есть
        // точка, куда смотрит камера, поэтому поток радиальный из середины кадра.
        // Если станция объявила `zoomFocus` (у галактики это место Солнца в рукаве), масштаб
        // идёт относительно ЭТОЙ точки. Чтобы в первом кадре ничего не дёрнулось, точка
        // приводится в центр не сразу: множитель fk нарастает с нуля за первые 22% полёта,
        // и это читается как «вид находит наше место и ныряет в него», а не как рывок. Ядро галактики
        // при этом уходит в сторону — мы и правда оставляем его позади, уходя на окраину диска.
        const zf = i === zm.aSt && st.upd.zoomFocus && !zm.bh ? st.upd.zoomFocus() : null;   // к дыре — строго в ядро
        // ВАЖНО: zf задан в собственных координатах сцены (плоскость диска), а inner.position
        // живёт в системе станции — смещение нужно повернуть, иначе точка уезжает не туда
        if (zf) st.inner.position.copy(zf).applyQuaternion(st.inner.quaternion)
                  .multiplyScalar(-st.inner.scale.x*smooth(.04, .40, zProg()));
        else st.inner.position.set(0, 0, 0);
        st.H.zs = zv.s; st.H.zc = zm.bh;
      }
      st.nm.material.opacity = .95*(1 - e);
      st.num.material.opacity = .95*v*(1 - (i === diveSt ? dE : 0));
    }
  }
  // порталы
  fadeMat.uniforms.uA.value = Math.max(k*.94, dE*.2);
  // Астролябия во время пролёта гаснет. Она близко к камере, а камера за полёт проезжает по кольцу
  // тридцать градусов — её дуги уезжают вбок гораздо заметнее, чем разлетаются звёзды, и кадр читается
  // как панорама, а не как движение вперёд. Звёзды на радиусе 260+ от такого проезда смещаются меньше
  // чем на полтора градуса, поэтому их гасить не нужно — они и несут поток
  astroFade((1 - dE*.85)*zAstro);
  const speed = 26 + clamp(Math.abs(vel), 0, 3)*40;
  updatePortal(0, kA, clamp((m - 6.1)/1.8, 0, 1), T, speed);
  updatePortal(1, kB, clamp((m - 12.1)/1.8, 0, 1), T, speed);
  // на глубине Триединства (jKind==="a", dPos≈2) яркие вершины и bloom с низким порогом раньше сливались
  // в одно расплывчатое «пятно»/«цветок» вместо чёткого треугольника — на этом отрезке приглушаем bloom
  const triBloomCut = jKind === "a" ? smooth(1.25, 1.9, dPos)*hEa : 0;
  if (bloom) bloom.strength = -.45*bhBloomCut + (mobile ? .65 : .8) + k*.45 + dB*.9 - dE*.3 - .38*hH*smooth(4.4, 5, dPos)*(1 - smooth(8.3, 9, dPos)) - .3*glowPeak - .12*(jKind === "e" ? hE : 0) - .4*triBloomCut;

  // цвет фона
  const sp = stopOf(Math.round(m) % 14);
  tintTarget.set(k > .5 ? PORTALS[kA > kB ? 0 : 1].tint : TINT[mod(Math.round(s), 12)]);
  // на мягком переходе фон меняется медленнее: иначе смена тона выдаёт подмену кадра
  tintNow.lerp(tintTarget, Math.min(1, dt*(tr && tr.soft ? .85 : 2))); bgMat.uniforms.uTint.value.copy(tintNow);

  // интерфейс
  const frac = Math.abs(pos - Math.round(pos));
  intro.style.opacity = String(clamp(1 - (pos + 1)*3, 0, 1));
  intro.style.visibility = pos > -.66 ? "hidden" : "visible";
  hint.style.opacity = pos < -.5 ? "0" : ".9";
  if (pos < -.5) showStation(-1);
  else if (frac < .35 && sp.st !== undefined) showStation(sp.st);
  const stopIdx = pos < -.5 ? -1 : mod(Math.round(pos), 14);
  if (stopIdx !== lastStop){ lastStop = stopIdx; }
  // пока открыта панель погружения, надпись портала не показываем: станция VIII стоит сразу
  // за порталом «Вовнутрь», и при входе из меню он проступал поверх её сцены
  showPortal(k > .03 && hE < .5 ? (kA > kB ? 0 : 1) : -1);
  if (k > .03){
    const pi = kA > kB ? 0 : 1, q = clamp((m - (pi ? 12.1 : 6.1))/1.8, 0, 1), PO = PORTALS[pi];
    portalEl.style.opacity = String(k);
    const ex = Math.round(PO.from + (PO.to - PO.from)*q);
    $("poScale").textContent = (pi === 1 && q > .96) ? "∞ · Единое" : pow10(ex) + " м";
  }
  stEl.style.opacity = pos < -.5 ? "0" : String((1 - smooth(.12, .42, frac))*(1 - k)*(1 - uiHide));
  stEl.style.visibility = uiHide > .98 ? "hidden" : "";
  $("foot").style.opacity = String(1 - uiHide*(dE > hE ? 1 : .85));
  gauge.style.opacity = String(1 - uiHide);
  $("shade").style.opacity = String(1 - uiHide);

  // прицел вокруг объекта и раскрытие окна из объекта
  const ri = hoverI >= 0 ? hoverI : (diveSt >= 0 && diveT > 0 ? diveSt : stNow);
  if (ri !== undefined && ri >= 0){
    const st = stations[ri], C = st.g.position;
    tmpV.copy(C).project(camera);
    const sx = (tmpV.x + 1)/2*W, sy = (1 - tmpV.y)/2*H;
    tmpN.copy(C).addScaledVector(camUp, 4.8*st.inner.scale.x).project(camera);
    const rad = Math.max(40, Math.hypot((tmpN.x + 1)/2*W - sx, (1 - tmpN.y)/2*H - sy));
    const idle = canRing && T - atStationSince > 3 && st.hov < .05 ? .14*(.5 - .5*Math.cos((T - atStationSince - 3)*.7)) : 0;
    const ro = .55*Math.max(st.hov*(1 - dE), idle)*(1 - uiHide*(insideOpen ? 0 : 1)) * (insideOpen ? .35 : 1);
    const rs = rad*(1 + .018*Math.sin(T*.6)*st.hov + .01*Math.sin(T*.7));
    reticle.style.opacity = String(ro);
    reticle.style.width = reticle.style.height = (rs*2) + "px";
    reticle.style.transform = `translate(${sx - rs}px,${sy - rs}px)`;
    rlab.style.opacity = coarse && st.hov > .3 && !insideOpen ? ".8" : "0";
    if (diveSt === ri && diveT > 0 && diveT < 1){
      const q = smooth(.28, 1, diveT), big = Math.hypot(W, H)*1.05, rr = rad*.9 + (big - rad*.9)*q;
      interior.style.clipPath = `circle(${rr}px at ${sx}px ${sy}px)`;
      reveal.style.opacity = String(Math.sin(q*Math.PI)*.9);
      reveal.style.width = reveal.style.height = (rr*2) + "px";
      reveal.style.transform = `translate(${sx - rr}px,${sy - rr}px)`;
    } else { if (diveT >= 1) interior.style.clipPath = "none"; reveal.style.opacity = "0"; }
  } else reticle.style.opacity = "0";
  miniAli.setAttribute("transform", `rotate(${mod(s, 12)/N*360})`);
  const sm = mod(s, 12), i0 = Math.floor(sm), i1 = (i0 + 1) % N, fr = sm - i0;
  gmark.style.top = gy(pos < -.5 ? 30 : EXP[i0] + (EXP[i1] - EXP[i0])*smooth(0, 1, fr)) + "%";
  // кольцо курсора догоняет точку одинаково быстро при любой частоте кадров (раньше — доля за кадр, и при
  // просадке до 30 кадров в секунду кольцо отставало вдвое сильнее)
  if (!coarse){ const kc = 1 - Math.exp(-dt*20); cx += (mx - cx)*kc; cy += (my - cy)*kc; cur.style.transform = `translate(${cx}px,${cy}px)`; }

  const Mh = hH > .001 ? MICRO.update(dPos, hH, T, px, py, portrait) : (MICRO.update(0, 0, T, px, py, portrait), 0);
  // на мягком переходе «Железо → Атом» сцена Земли не гаснет в один кадр: глубину замораживаем
  // на последнем слое, а видимость уводим плавно — ровно пока разгорается станция «Атом»
  const softTr = tr && tr.soft;
  const eHv = (jKind === "e" ? (softTr ? hE*tr.fe : hE) : (softTr ? tr.fe : 0))*MF.earthVis();
  const eDp = jKind === "e" ? dPos : (softTr ? tr.eD : dPos);
  EARTH.soft(softTr ? (tr.dir > 0 ? smooth(.10, 1.45, tr.t) : 1 - smooth(.30, 1.75, tr.t)) : 0);
  const Me = EARTH.update(eDp, eHv, T, px, py, portrait, earthBranch === "bio");
  // v173: на бесшовном переходе «Триединство ↔ Первоимпульс» треугольник Абсолюта держим на последнем слое
  // (даже при нулевой видимости он чуть «жив» — .28: так его геометрия считается каждый кадр и вершины узла знают, куда идти)
  // и плавно гасим (вперёд) или проявляем (назад) поверх станции II, пока её узел перестраивается
  const absTr = tr && tr.tri && ((tr.dir > 0 && tr.jumped) || (tr.dir < 0 && !tr.jumped));
  const Ma = ABS.update(absTr ? 2 : dPos, absTr ? .28 + .62*G1TRI.a : (jKind === "a" ? hE : 0), T, ndc.x, ndc.y, pointerIn && !menuOpen, portrait);
  if (jKind === "a" && ABS.takeFlash()) Music.triad();
  // чёрная дыра: на полёте из Галактики проступает из ядра, на своей ветке держится вместе с панелью
  let bV = 0, bC = 0, zIn = 1;
  if (zm && zm.bh){ const z = zProg(); zIn = z; bV = smooth(.30, .85, z); bC = smooth(.50, .96, z); }
  else if (bhDv && !bhDv.done){ bV = bC = 1; }
  else if (humanOpen && jId === "bh"){ bV = hE; bC = hE; }
  let bR = 34*Math.exp(-.48*clamp(dPos, 0, DMAX - 1))*Math.exp(2.6*(1 - zIn)), bEl = .14 - .018*clamp(dPos, 0, 3), bRoll = -.17, bTan = portrait ? .5 : .36, bDark = 0;
  if (bhDv){
    // до 4,2 с падаем от слоя «Горизонт» до трёх с половиной радиусов: здесь тень уже почти заполняет
    // широкий кадр, а свет неба и диска сжимается в кольцо у краёв. Последние полсекунды — сам горизонт,
    // проходим его в темноте. Поле зрения расширяется — падение ускоряется в ощущении, а не только в цифрах
    const p = smooth(0, 4.2, bhDv.t), pe = p*p*(1.7 - .7*p), q = smooth(4.2, 4.6, bhDv.t);
    const lr = Math.log(bhDv.R0) + (Math.log(3.4) - Math.log(bhDv.R0))*pe;
    bR = Math.exp(lr + (Math.log(1.015) - Math.log(3.4))*q);
    bEl = bEl*(1 - p) + .015*p; bRoll = bRoll*(1 - p) + (reduce ? 0 : .025*Math.sin(bhDv.t*7.3)*p*p); bTan += .42*p*p;
    bDark = smooth(4.0, 4.55, bhDv.t);
  } else bhR = bR;
  const bRes = BH.update({ vis:bV, cov:bC, R:bR, el:bEl + (coarse ? 0 : py*.02), az:(coarse ? 0 : px*.05), roll:bRoll, aim:0, tan:bTan, dark:bDark,
    off:[-2*vox/W, 2*voy/H], ndc:[ndc.x, ndc.y], pointer: pointerIn && bhCanPoint(), dt, T });
  bhBloomCut = bC;
  if (bRes.disk && !bhHotWas) Music.hover();
  bhHotWas = bRes.disk;
  mscene.visible = Mh > .003 || Me > .003 || Ma > .003 || (hH > .001) || bV > .003;
  const Mv = Math.max(Mh, Me, Ma, bC);
  { const mb = $("moonBtn"), on = humanOpen && jKind === "e" && dPos < 6.3 && !tr && !zm && !menuOpen && hE > .5;
    if (on !== mb.classList.contains("on")){ mb.classList.toggle("on", on); mb.tabIndex = on ? 0 : -1; } }
  { const eb = EARTH.boundary(dPos, earthBranch === "bio"), el = $("eBound"); if (eb.o > .01 && el.dataset.t !== eb.text){ el.dataset.t = eb.text; el.textContent = eb.text; } el.style.opacity = String(jKind === "e" && humanOpen && !(typeof BSC !== "undefined" && BSC.active) ? eb.o : 0); }
  scene.visible = Mv < .995;
  const bscOn = humanOpen && jKind === "e" && earthBranch === "bio" && !tr && !zm;
  if (typeof BSC !== "undefined") BSC.update({ on: bscOn, d: dPos, dt, mx, my, portrait });
  // полноэкранные главы целиком закрывают кольцо (фон 93–98 % непрозрачности с размытием): после того как
  // глава проявилась, кольцо под ней не рисуем — иначе видеокарта считает две сцены сразу, размытие фона
  // пересчитывается каждый кадр, и курсор с панорамой «тянутся». На закрытие флаг снимается сразу, и кольцо
  // снова рисуется ещё до того, как глава погаснет. Поиск полупрозрачный — под ним кольцо рисуется как обычно
  coverT = bioOn || flyOn || timeOn || treeOn || thoughtOn || dimsOn || compassOn || mineOn || pathOpen || refOpen || menuOpen
    || chRoutes.classList.contains("open") ? coverT + dt : 0;
  if (typeof BSC !== "undefined" && BSC.covers()){}
  else if (coverT > .9){}
  else if (composer) composer.render(dt);
  else { renderer.clear(); renderer.render(scene, camera); if (mscene.visible){ renderer.clearDepth(); renderer.render(mscene, mcam); } if (k > .01){ renderer.clearDepth(); renderer.render(tscene, tcam); } }
  requestAnimationFrame(loop);
}
