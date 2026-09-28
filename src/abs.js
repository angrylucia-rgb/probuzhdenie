/* ---------- Абсолют: чистый свет → двойственность → триединство (глубина 0–2) ---------- */
const ABS = (() => {
  const root = new THREE.Group(); root.visible = false; mscene.add(root);
  const U = { uA:{value:0}, uD:{value:0}, uT:{value:0}, uM:{value:new THREE.Vector2(.5, .5)}, uHov:{value:0}, uAsp:{value:1}, uC:{value:new THREE.Vector2(.5, .5)}, uL:{value:.42}, uPx:{value:0}, uRot:{value:0}, uFlash:{value:0}, uShiftQ:{value:0}, uRcQ:{value:.15}, uCollapse:{value:0} };
  const mat = new THREE.ShaderMaterial({
    uniforms:U,
    vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader:`
uniform float uA, uD, uT, uHov, uAsp, uL, uPx, uRot, uFlash, uShiftQ, uRcQ, uCollapse; uniform vec2 uM, uC; varying vec2 vUv;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float segd(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa,ba)/max(dot(ba,ba),1e-6), 0.0, 1.0); return length(pa - ba*h); }
void main(){
  vec2 q = (vUv - uC)*vec2(uAsp, 1.0);
  vec2 m = (uM - uC)*vec2(uAsp, 1.0);
  float s = clamp(uD, 0.0, 1.0);
  // 0 · абсолютный свет: едва заметное дыхание и рябь от курсора
  float dm = length(q - m);
  float breath = 0.5 + 0.5*sin(uT*0.55);
  float ripple = sin(dm*38.0 - uT*2.2)*exp(-dm*5.5)*uHov;
  float glowC = exp(-dm*dm*9.0)*uHov;
  vec3 white = vec3(1.0, 0.995, 0.985) - 0.022*breath*(1.0 - exp(-length(q)*1.2)) + 0.012*ripple + vec3(0.0, 0.004, 0.012)*glowC;
  white -= 0.004*h21(vUv*vec2(913.0, 577.0) + fract(uT));
  // 1 · свёртка света в точку
  float a = smoothstep(0.0, 0.45, s);
  float R = mix(2.6, 0.0, pow(a, 0.5));
  float soft = mix(0.35, 0.004, a);
  float r = length(q);
  // после того как свет схлопнулся в точку и точка вытянулась в линию, сама точка больше не нужна:
  // без этого она остаётся висеть маленьким ярким пятном в центре сцены (левее треугольника — там,
  // где начало координат, до сдвига фигуры вправо от текстовой панели) на всех глубинах ниже
  float ptFade = 1.0 - smoothstep(0.45, 0.72, s);
  float disk = (1.0 - smoothstep(R, R + soft, r))*ptFade;
  // 2 · точка растягивается в линию — ось напряжения
  float b = smoothstep(0.38, 0.7, s);
  float L = uL*b;
  vec2 cq = vec2(clamp(q.x, -L, L), 0.0);
  float ds = length(q - cq);
  float shimmer = 0.75 + 0.25*sin(q.x*60.0 - uT*6.0)*sin(q.x*23.0 + uT*3.1);
  float line = exp(-ds*mix(90.0, 160.0, b))*shimmer*smoothstep(0.35, 0.5, s) + exp(-r*r*mix(4000.0, 900.0, b))*smoothstep(0.3, 0.45, s);
  float halo = exp(-ds*14.0)*0.18*smoothstep(0.35, 0.6, s);
  // 3 · предельное напряжение: двойственность как конфликт, ищущий разрешения
  float u2 = clamp(uD - 1.0, 0.0, 1.0);
  float te = smoothstep(0.0, 0.35, u2);
  float triT = smoothstep(0.35, 1.0, u2);
  float c = smoothstep(0.62, 1.0, s);
  vec2 s1 = vec2(-L, 0.0), s2 = vec2(L, 0.0);
  float shake = te*0.012*sin(uT*46.0 + q.x*24.0);
  vec2 qw = vec2(q.x, q.y + shake);
  float k = mix(74.0, 92.0, te), w = uT*1.1;
  float r1 = length(qw - s1), r2 = length(qw - s2), r3 = length(qw - m);
  float wv = cos(k*r1 - w) + cos(k*r2 - w) + 0.6*uHov*cos(k*r3 - w*1.4)*exp(-r3*3.0);
  float I = wv*wv/4.0;
  float side = smoothstep(-0.012, 0.012, qw.y);
  float rr = length(qw);
  float fade = exp(-rr*1.5)*(0.35 + 0.65*smoothstep(0.0, 0.08, abs(qw.y)));
  vec3 up = vec3(1.0, 0.86, 0.55)*pow(I, 1.8)*0.55 + vec3(0.05, 0.03, 0.0);
  vec3 dn = mix(vec3(0.26, 0.36, 0.85), vec3(0.015, 0.02, 0.07), pow(I, 0.7))*0.5;
  // конфликт нарастает (te), затем разрешается: интерференция гаснет по мере сборки треугольника
  vec3 pol = mix(dn, up, side)*fade*c*(1.0 + te*0.3)*(1.0 - smoothstep(0.15, 0.75, triT));
  // 4 · катарсис и триединство: линия стягивается и замыкается в равносторонний треугольник фиксированного,
  // безопасного для экрана размера (Rc — радиус описанной окружности, не зависит от длины оси L*1.73,
  // которая раньше уводила вершину за верхний край кадра). Обе тройки точек — «ось» и «треугольник» —
  // центрированы в нуле, поэтому центроид не сдвигается за весь переход и вращать фигуру можно без сноса.
  float Rc = uRcQ;
  vec2 A1 = vec2(-L, 0.0), A2 = vec2(L, 0.0), A3 = vec2(0.0, 0.0);
  vec2 T3 = vec2(0.0, Rc), T2 = vec2(Rc*0.8660254, -Rc*0.5), T1 = vec2(-Rc*0.8660254, -Rc*0.5);
  vec2 p1 = mix(A1, T1, triT), p2 = mix(A2, T2, triT), p3 = mix(A3, T3, triT);
  // текстовая панель слева непрозрачна почти на всю свою ширину (градиент гаснет только у самого края) —
  // без сдвига треугольник частично уходит под неё и левый угол/узел пропадает. Сдвигаем сцену вправо
  // ДО поворота, чтобы вращение оставалось вокруг собственного центра фигуры, а не съезжало по орбите.
  float shiftX = uShiftQ*triT;
  vec2 qc = q - vec2(shiftX, 0.0);
  // uRot уже приходит из JS умноженным на triT — при triT=0 поворот нулевой, поэтому ось не «зависает»
  // повёрнутой из прошлого посещения слоя (это и было причиной артефакта при возврате)
  float cs = cos(-uRot), sn = sin(-uRot);
  vec2 qr = vec2(qc.x*cs - qc.y*sn, qc.x*sn + qc.y*cs);
  qr.y *= 1.0 - m.y*0.12*triT; qr.x *= 1.0 + m.x*0.08*triT;
  float sharpTri = mix(90.0, 190.0, smoothstep(0.0, 1.0, triT));
  float eBase = exp(-segd(qr, p1, p2)*sharpTri);
  float eL = exp(-segd(qr, p2, p3)*sharpTri)*triT;
  float eR = exp(-segd(qr, p3, p1)*sharpTri)*triT;
  float shimmer2 = 0.8 + 0.2*sin(qr.x*50.0 - uT*5.0);
  vec3 triCol = vec3(0.93, 0.97, 1.0);
  vec3 tri = triCol*(eBase + eL + eR)*shimmer2;
  float dApex = length(qr - p3);
  // uFlash приходит из JS уже как одноразовый затухающий импульс — не переигрывается при возврате назад.
  // Раньше здесь была ещё и постоянная добавка triT*0.35 — она держала вершину «пересвеченной» всё время,
  // пока фигура собрана, и вместе с узлами (nodes) и толстым bloom-постпроцессом сливала три угла в одно
  // мутное «облако»/«цветок» вместо чёткого треугольника — убираем, оставляя вспышку только одноразовой.
  vec3 spark = vec3(1.0, 1.0, 1.0)*(exp(-dApex*dApex*260.0)*uFlash*1.3);
  float fill = exp(-length(qr)*1.2)*0.22*triT*(1.0 - uFlash*0.5);
  vec3 harmony = triCol*fill;
  // узлы — три точки концентрации энергии на углах, проявляются по мере сборки фигуры. Радиус сужен,
  // а яркость снижена — по той же причине (см. spark выше): это самая частая причина «размытого блина»
  // вместо треугольника на ярких/широких экранах, где bloom особенно агрессивно растягивает пятна.
  float dN1 = length(qr - p1), dN2 = length(qr - p2), dN3 = length(qr - p3);
  vec3 nodes = triCol*(exp(-dN1*dN1*260.0) + exp(-dN2*dN2*260.0) + exp(-dN3*dN3*260.0))*triT*triT*0.5;
  // взаимодействие с курсором: узлы «просыпаются» и разгораются при приближении курсора к вершине,
  // а грани чуть светлеют по всей длине при наведении — фигура ощутимо и живо реагирует на присутствие курсора.
  // курсор переводим в ту же систему координат, что и qr (сдвиг + поворот), иначе близость к вершинам
  // считалась бы неверно при повороте/сборке фигуры
  vec2 mc2 = m - vec2(shiftX, 0.0);
  vec2 mr = vec2(mc2.x*cs - mc2.y*sn, mc2.x*sn + mc2.y*cs);
  float pd1 = length(mr - p1), pd2 = length(mr - p2), pd3 = length(mr - p3);
  // КРИТИЧНО: близость курсора к вершине (pd1..pd3) зависит только от положения курсора, а не от
  // координаты пикселя — поэтому её нельзя прибавлять напрямую: так она поднимала яркость ВСЕГО кадра
  // разом, bloom подхватывал весь экран, и фигура тонула в белом пятне (и мерцала, если добавить пульс).
  // Правильно — умножать на собственную пространственную маску той самой вершины: разгорается только она.
  float wake1 = exp(-pd1*pd1*90.0)*exp(-dN1*dN1*260.0);
  float wake2 = exp(-pd2*pd2*90.0)*exp(-dN2*dN2*260.0);
  float wake3 = exp(-pd3*pd3*90.0)*exp(-dN3*dN3*260.0);
  // грани светлеют тоже локально — в ореоле вокруг самого курсора, а не по всей фигуре
  vec2 dmr = qr - mr;
  float nearCur = exp(-dot(dmr, dmr)*14.0)*uHov*triT;
  vec3 cursorFx = triCol*((wake1 + wake2 + wake3)*uHov*triT*0.9 + (eBase + eL + eR)*nearCur*0.22);
  // свёртка фигуры в точку — визуальный «коллапс» перед перерождением в Первоимпульс на следующей глубине:
  // вся плотность треугольника стягивается в единый ослепительный центр, из которого затем «рождается»
  // новая форма (см. Station II) — зримая и смысловая нить, соединяющая две абстракции в одно движение
  vec3 collapseCore = vec3(1.0, 0.98, 0.94)*exp(-dot(qc, qc)*160.0)*uCollapse*(1.6 + 0.4*sin(uT*14.0));
  // ось-вектор двойственности гаснет, как только линия начинает стягиваться в треугольник —
  // иначе она так и остаётся видна поверх/под фигурой (что и было следующей жалобой)
  float axisFade = 1.0 - smoothstep(0.05, 0.35, triT);
  // мягкий потолок яркости фигуры: до 0.9 всё линейно (привычный чёткий вид не меняется), выше —
  // плавное сжатие. Рёбра, узлы, заливка и отклик на курсор больше не могут сложиться в пересвет,
  // который bloom растягивает в белое пятно. collapseCore намеренно остаётся вне потолка — вспышка
  // коллапса при переходе должна быть ослепительной.
  vec3 fig = tri + spark + harmony + nodes + cursorFx;
  vec3 over = max(fig - 0.9, 0.0);
  fig = min(fig, vec3(0.9)) + over/(1.0 + over*1.8);
  vec3 dark = pol + vec3(1.0, 0.97, 0.9)*(line + halo)*axisFade + fig + collapseCore;
  vec3 col = mix(dark, white, disk);
  col += vec3(1.0, 0.97, 0.9)*exp(-max(r - R, 0.0)*mix(3.0, 60.0, a))*(1.0 - disk)*(1.0 - b*0.7)*step(0.001, a)*0.8*ptFade;
  gl_FragColor = vec4(col, uA);
}`,
    transparent:true, depthTest:false, depthWrite:false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false; quad.renderOrder = -97; root.add(quad);
  // пары частиц: материя вверх, антиматерия вниз — затем, обретя третью точку, ложатся на орбиту треугольника
  const pairs = pts(2600*Q, (i, o) => { o.p = [rn(), 0, 0]; o.rnd = [i % 2 ? 1 : -1, Math.random(), Math.random()]; o.c = i % 2 ? C(0xffe0a0) : C(0x8fa8ff); o.s = .7 + Math.random()*.9; },
    `float life = fract(aRnd.y + uTime*(0.05 + aRnd.z*0.05));
     vec3 flight = vec3(position.x*uProg, aRnd.x*(0.04 + life*life*3.4), (aRnd.z - 0.5)*0.6);
     flight.x += sin(life*9.0 + aSeed*40.0)*life*0.35;
     float aFlight = 0.85*sin(life*3.1416)*smoothstep(0.0, 0.08, life);
     float orbT = smoothstep(0.15, 0.85, uFocus);
     float per = fract(aSeed*2.7 + uTime*0.05 + aRnd.y*0.5);
     // та же геометрия, что и во фрагментном шейдере (ABS): два набора точек — «ось» и «треугольник»
     // фиксированного экранно-безопасного радиуса uSharp — каждый центрирован в нуле, поэтому
     // при вращении (uSpeed) центр орбиты не сносит и вершина не уходит за край кадра
     vec2 pA1 = vec2(-uProg, 0.0), pA2 = vec2(uProg, 0.0), pA3 = vec2(0.0, 0.0);
     vec2 pT3 = vec2(0.0, uSharp), pT2 = vec2(uSharp*0.8660254, -uSharp*0.5), pT1 = vec2(-uSharp*0.8660254, -uSharp*0.5);
     vec2 pp1 = mix(pA1, pT1, uFocus), pp2 = mix(pA2, pT2, uFocus), pp3 = mix(pA3, pT3, uFocus);
     vec2 ep; float seg3 = per*3.0;
     if (seg3 < 1.0) ep = mix(pp1, pp2, seg3);
     else if (seg3 < 2.0) ep = mix(pp2, pp3, seg3 - 1.0);
     else ep = mix(pp3, pp1, seg3 - 2.0);
     // uSpeed уже приходит из JS умноженным на triT — при uFocus≈0 поворот нулевой
     float cs = cos(uSpeed), sn = sin(uSpeed);
     vec2 epr = vec2(ep.x*cs - ep.y*sn, ep.x*sn + ep.y*cs);
     epr += epr*0.08*(aRnd.z - 0.5);
     // тот же сдвиг вправо от текстовой панели, что и во фрагментном шейдере ABS — прибавляется
     // ПОСЛЕ поворота, чтобы вращение оставалось вокруг собственного центра фигуры. uPush здесь не связан
     // с общим hover-push механикой колец (у этой системы частиц нет своего родителя в st.pts), поэтому
     // безопасно переиспользован под независимый от радиуса (uSharp) динамический сдвиг фигуры
     epr.x += uPush*uFocus;
     vec3 orbit = vec3(epr.x, epr.y, (aRnd.z - 0.5)*0.3);
     float aOrbit = 0.55 + 0.45*sin(per*18.85 + uTime*2.2);
     p = mix(flight, orbit, orbT);
     a = mix(aFlight, aOrbit*0.75, orbT);
     col = mix(col, vec3(1.0, 0.93, 0.78), orbT*0.6);`);
  const pg = new THREE.Group(); pg.add(pairs); root.add(pg);
  const cam = new THREE.Vector3();
  let lastT = 0, rotA = 0, curU = 0, flashArmed = true, flashE = 0, flashPending = false;
  return {
    update(D, hE, T, nx, ny, hov, portrait){
      const M = smooth(.25, .9, hE);
      root.visible = M > .003;
      if (!root.visible) return 0;
      U.uA.value = M; U.uD.value = D; U.uT.value = T; U.uAsp.value = W/H;
      U.uM.value.lerp(new THREE.Vector2((nx + 1)/2, (ny + 1)/2), .08);
      U.uHov.value += ((hov ? 1 : 0) - U.uHov.value)*.05;
      // центр сцены: туда, куда mcam проецирует точку (0,0,−10)
      cam.set(0, 0, -10).project(mcam);
      const cx = (cam.x + 1)/2, cy = (cam.y + 1)/2;
      U.uC.value.set(cx + (.5 - cx)*(1 - smooth(.3, .8, D)), cy + (.5 - cy)*(1 - smooth(.3, .8, D)));
      U.uL.value = portrait ? .3 : .42;
      const u2 = clamp(D - 1, 0, 1);
      curU = u2;
      const triT = smooth(.35, 1, u2), stableT = smooth(.85, 1, u2);
      const dt = Math.min(.05, Math.max(0, T - lastT)); lastT = T;
      // коллапс в точку: срабатывает только при переходе ВПЕРЁД, из Триединства — в Первоимпульс,
      // и синхронизирован с фазами общего механизма перехода (tr.t): фигура схлопывается ровно за то же
      // время, что и вспышка перехода нарастает до полной непрозрачности (см. transitTick в template2.html) —
      // так коллапс всегда успевает завершиться ДО того, как вспышка полностью скроет экран
      const collapsing = typeof tr !== "undefined" && tr && tr.dir > 0 && !tr.jumped && jId === "abs" && tr.to === "g1";
      const collapseT = collapsing ? smooth(0.05, 0.58, tr.t) : 0;
      rotA += dt*0.11*stableT*(1 + collapseT*5);
      U.uRot.value = rotA*triT;
      // безопасная зона фигуры: панель слева зафиксирована в CSS на min(640px, 100%), поэтому центр и
      // радиус треугольника считаем от РЕАЛЬНЫХ W/H текущего окна, а не от констант, подобранных под один
      // тестовый экран — иначе на широких мониторах фигура снова уезжает мимо безопасной зоны
      const panelPx = portrait ? 0 : Math.min(640, W);
      const marginPx = 26;
      const safeLeftPx = panelPx + marginPx;
      const safeRightPx = W - marginPx;
      const safeWidthPx = Math.max(100, safeRightPx - safeLeftPx);
      const centerPx = (safeLeftPx + safeRightPx)/2;
      const RcQ = Math.min(U.uL.value*0.55, (safeWidthPx/H)/1.9)*(1 - collapseT);
      const shiftQ = (centerPx/H) - U.uC.value.x*U.uAsp.value;
      U.uRcQ.value = RcQ; U.uShiftQ.value = shiftQ; U.uCollapse.value = collapseT;
      // рождение третьего — одноразовая вспышка на проходе ВПЕРЁД через порог;
      // при возврате назад она просто гаснет по времени и не зажигается снова (раньше вспышка была завязана
      // на глубину напрямую и переигрывалась при любом пересечении порога — отсюда был глюк при возврате)
      if (flashArmed && u2 > .4){ flashE = 1; flashArmed = false; flashPending = true; }
      else if (u2 < .25){ flashArmed = true; }
      flashE *= Math.exp(-dt*3.2);
      U.uFlash.value = flashE;
      pg.position.set(0, 0, -10);
      const Lw = U.uL.value*2*10*Math.tan(24*Math.PI/180);
      const worldPerQ = Lw/U.uL.value;
      const pm = pairs.material.uniforms;
      pm.uProg.value = Lw; pm.uOpacity.value = M*smooth(.7, 1, D);
      pm.uFocus.value = triT; pm.uSpeed.value = rotA*triT;
      // радиус (uSharp) и сдвиг (uPush) теперь независимы: раньше единый uSharp совмещал обе роли и не
      // мог одновременно быть верным размером фигуры и верным смещением от текстовой панели на любом окне
      pm.uSharp.value = RcQ*worldPerQ; pm.uPush.value = shiftQ*worldPerQ;
      // лёгкое «оживление» частиц при наведении курсора — тот же приём, что и на кольцевых станциях.
      // Держим слабым: uHov здесь — просто «курсор в окне», и сильный буст читался как мерцание фигуры
      pm.uDive.value = U.uHov.value*0.25;
      pairs.visible = pm.uOpacity.value > .003;
      return M;
    },
    getU(){ return curU; },
    takeFlash(){ const f = flashPending; flashPending = false; return f; }
  };
})();
