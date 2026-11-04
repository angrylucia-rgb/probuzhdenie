/* ---------- v183: полёт Земля ↔ Луна без вспышки ----------
   Туда (клик по Луне на «космических» слоях Земли):
     1) камера доворачивает и подаётся к Луне; Земля уходит из кадра и гаснет, астролябия гаснет, звёзды тускнеют;
        Луна — тот же рисунок из частиц, что и значок (moonDots), — растёт из значка и выходит к центру кадра;
     2) подмена путешествия под рисунком: Луна слоя 0 стоит «на подходе» (глубина −D_FAR — мельче и прозрачна);
        подлёт доводит глубину до 0, настоящая Луна проявляется ровно там, где рисунок, а рисунок тает.
   Обратно (листать вверх со слоя «Луна»): то же в обратном порядке — Луна отдаляется, рисунок подхватывает её,
   после подмены камера разворачивается от Луны к Земле, Земля проявляется на том слое, с которого улетели,
   а Луна уменьшается обратно в значок. Обе половины — чистые функции от времени перехода tr.t, поэтому
   ход назад зеркален ходу вперёд. Переход живёт внутри обычного tr (tr.mf): ввод на время полёта заблокирован так же. */
const MF = (() => {
  const TJF = 1.75, TJR = 1.0, DUR = 2.9, D_FAR = .62;
  const cv = document.createElement("canvas"); cv.className = "moonfly"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const c = cv.getContext("2d");
  const S = { icon:null, h:0, d:null, qF:null, q:new THREE.Quaternion(), cJ:null, last:null, on:false };
  const QI = new THREE.Quaternion(), qi = new THREE.Quaternion(), qc = new THREE.Quaternion();
  const v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), rt = new THREE.Vector3();
  // фаза перехода: e — «насколько мы уже у Луны» на стороне Земли (0 — обычный кадр Земли), q — подлёт на стороне Луны (1 — слой 0)
  function ph(){
    const t = tr.t, f = tr.dir > 0;
    if (!tr.jumped) return f ? { e: smooth(0, TJF, t) } : { q: 1 - smooth(0, TJR, t) };
    return f ? { q: smooth(TJF, DUR, t) } : { e: 1 - smooth(TJR, DUR, t) };
  }
  const scr = (p, o) => { v4.copy(p).project(camera); o.x = (v4.x + 1)*W/2; o.y = (1 - v4.y)*H/2; return o; };
  // где настоящая Луна слоя 0 на экране сейчас
  function real(){
    if (!SOLAR || !SOLAR.moonPt) return null;
    const R = SOLAR.moonPt(v3), a = scr(v3, {});
    rt.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    const b = scr(v3.addScaledVector(rt, R), {});
    return { x: a.x, y: a.y, r: Math.hypot(b.x - a.x, b.y - a.y) };
  }
  // радиус Луны у подмены, пока настоящая ещё не видна: та же оптика, что у камеры станции (расстояние, поле зрения)
  const rEst = () => 2.3*Math.exp(-D_FAR*.85)/(W < 760 ? 10.5 : 7.6)/Math.tan(fov*Math.PI/360)*H/2;
  const lerp = (a, b, k) => a + (b - a)*k;
  return {
    TJ: dir => dir > 0 ? TJF : TJR, DUR, D_FAR,
    begin(){
      const r = $("moonCv").getBoundingClientRect();
      S.icon = { x: r.left + r.width/2, y: r.top + r.height/2, r: Math.max(8, r.width*.4) };
      S.h = moonDots && moonDots.hov ? moonDots.hov() : 0; S.d = null; S.cJ = null; S.last = null;
      document.body.classList.add("mf-on");
    },
    jumped(){ S.cJ = S.last; S.d = null; },
    tick(){
      const p = ph(), now = performance.now();
      if (p.q !== undefined){
        const top = tr.dir > 0 ? 0 : tr.d0;
        depth = depthT = -D_FAR + (top + D_FAR)*p.q; lastDepthInput = now;
        zAstro = smooth(.35, 1, p.q); zStar(0, .45 + .55*smooth(.2, 1, p.q));
      } else { zAstro = 1 - smooth(0, .5, p.e); zStar(0, 1 - .55*smooth(.35, 1, p.e)); }
    },
    // сторона Земли. Сцена Земли рисуется своей камерой mcam (в начале координат, смотрит вдоль −z), поэтому
    // «доворот камеры к Луне» — это поворот всего мира Земли q: направление на значок Луны d переходит в точку,
    // где Луна будет на своём слое (c). Земля при этом уходит из кадра в обратную сторону — вниз и влево.
    // Основная камера (звёзды, астролябия) доворачивает на тот же угол, чтобы фон плыл вместе с Землёй.
    cam(P){
      if (!tr || !tr.mf) return;
      const p = ph(); if (p.e === undefined){ EARTH.fly(null); return; }
      if (!S.d){
        const ndc = (x, y) => v3.set(x/W*2 - 1, 1 - y/H*2, .5).unproject(mcam).normalize();
        S.d = ndc(S.icon.x, S.icon.y).clone();
        const t = S.cJ || (W < 760 ? { x: W/2, y: H*.21 } : { x: W*.69, y: H/2 });   // туда — где Луна встанет на слое 0
        S.qF = new THREE.Quaternion().setFromUnitVectors(S.d, ndc(t.x, t.y).clone());
      }
      S.q.copy(QI).slerp(S.qF, p.e); EARTH.fly(S.q);
      // основная камера: мир повёрнут на q — значит, камера повёрнута на q⁻¹ в своей системе
      camera.position.copy(P.pos); camera.up.copy(P.up); camera.lookAt(P.tgt);
      qi.copy(S.q).invert(); qc.copy(camera.quaternion).multiply(qi);
      const L = P.tgt.distanceTo(P.pos);
      P.tgt.copy(P.pos).addScaledVector(v4.set(0, 0, -1).applyQuaternion(qc), L);
      P.up.copy(v4.set(0, 1, 0).applyQuaternion(qc));
    },
    earthVis(){ if (!tr || !tr.mf) return 1; const p = ph(); return p.e === undefined ? 0 : 1 - smooth(.3, .9, p.e); },
    // прозрачность станций на полёте: Земля гаснет, пока мы отворачиваемся к Луне
    vis(i){ if (!tr || !tr.mf || i !== 5) return null; const p = ph(); return p.e === undefined ? null : 1 - smooth(.25, .85, p.e); },
    draw(){
      if (!tr || !tr.mf){ if (S.on){ c.clearRect(0, 0, cv.width, cv.height); cv.style.opacity = "0"; S.on = false; } return; }
      const d = Math.min(2, devicePixelRatio || 1), cw = Math.round(W*d), ch = Math.round(H*d);
      if (cv.width !== cw || cv.height !== ch){ cv.width = cw; cv.height = ch; }
      c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, H);
      if (!S.on){ cv.style.opacity = "1"; S.on = true; }
      const p = ph(); let x, y, r, al, warm;
      if (p.e !== undefined){
        if (!S.d) return;
        // Луна — в направлении q·d мира Земли: тот же поворот, что уводит Землю
        v4.copy(S.d).applyQuaternion(S.q).multiplyScalar(10).project(mcam);
        const rJ = S.cJ ? S.cJ.r : rEst(), r0 = S.icon.r;
        x = (v4.x + 1)*W/2; y = (1 - v4.y)*H/2;
        r = r0*Math.exp(Math.log(rJ/r0)*Math.pow(p.e, 1.5)); al = 1; warm = .7*p.e;
      } else {
        const m = real(); if (!m) return;
        const k = S.cJ && tr.dir > 0 ? smooth(0, .3, p.q) : 1;   // туда: от точки подмены — к настоящей Луне
        x = lerp(S.cJ ? S.cJ.x : m.x, m.x, k); y = lerp(S.cJ ? S.cJ.y : m.y, m.y, k); r = lerp(S.cJ ? S.cJ.r : m.r, m.r, k);
        // настоящая Луна проявляется как 1 − smooth(.22, .62, |глубина|) — рисунок гаснет ровно навстречу
        al = smooth(.22, .62, Math.abs(depth)); warm = .7 + .3*p.q;
      }
      S.last = { x, y, r };
      if (al > .003) moonDots(c, x, y, r, performance.now(), S.h*(1 - (p.e ?? 1 - p.q)), warm, al);
    },
    end(){ EARTH.fly(null); setTimeout(() => document.body.classList.remove("mf-on"), 160); },
    dbg: { real, S }
  };
})();
