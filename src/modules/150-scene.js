/* ---------- сцена ---------- */
const S_SUND = .104;                 // 2.5 · .104 = .26 — видимый радиус Солнца на обзоре
const S_KSUN = 1/S_SUND;             // на слое «Солнце» масштаб ровно компенсирует это сжатие,
                                     // и плотность частиц на подлёте оказывается натуральной
const S_KPL  = d => 1.6/d;           // во столько раз растёт система при подходе к планете
const S_BELT_R = S_ORB(2.7);
const DEG = Math.PI/180;
let SOLAR = null;

function kepler(M, e){ let E = M; for (let k = 0; k < 4; k++) E -= (E - e*Math.sin(E) - M)/(1 - e*Math.cos(E)); return E; }

// Шумовая библиотека для поверхностей планет. Объявляется один раз на материал (параметр decl
// у pts) и даёт fbm — им рисуются кратеры, полосы, вихри и пылевые поля
const S_DECL = `
// хеш без sin: у синуса от больших аргументов на слабых видеоядрах теряется точность,
// и весь шум вырождается в константу — поверхности становятся однотонными
float h31(vec3 p){ p = fract(p*0.3183099 + vec3(0.11, 0.17, 0.23)); p *= 17.0;
  return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float s = 0.0, a = 0.55; for (int k = 0; k < 3; k++){ s += a*vn(p); p *= 2.07; a *= 0.5; } return s/0.96; }
float ridge(vec3 p){ return 1.0 - abs(fbm(p)*2.0 - 1.0); }
`;

// общий хвост шейдера планеты: терминатор по азимуту Солнца (uSolid), собственное
// затухание (uSharp) и мягкая пульсация под курсором (uHov)
const S_TAIL = `
  float sa = uSolid;
  float lit = dot(normalize(position), vec3(cos(sa), 0.0, sin(sa)));
  a = (0.10 + 0.90*smoothstep(-0.25, 0.35, lit) + night)*(0.88 + 0.12*fract(aSeed*9.0))*0.33;
  a *= uSharp*(1.0 + uHov*(0.30 + 0.22*sin(uTime*2.4)));
  s *= 1.0 + uFocus*0.4;`;

const S_CHUNK = {
// Меркурий: кратерное поле с валами и лучевыми системами, бассейн Калорис
mer:`float cr = ridge(nrm*4.2);
  float sm = fbm(nrm*1.8);
  col = mix(vec3(0.17,0.16,0.15), vec3(0.74,0.70,0.63), sm);
  col = mix(col, vec3(0.88,0.84,0.76), smoothstep(0.74, 0.93, cr));      // валы кратеров
  col = mix(col, vec3(0.20,0.19,0.18), smoothstep(0.30, 0.10, cr)*0.7);  // днища
  float cal = smoothstep(0.40, 0.10, length(nrm - normalize(vec3(0.72, 0.30, 0.62))));
  col = mix(col, vec3(0.52,0.49,0.47), cal*0.8);                         // бассейн Калорис
  float rays = smoothstep(0.66, 0.96, ridge(nrm*11.0))*smoothstep(0.55, 0.85, sm);
  col += vec3(0.30,0.28,0.24)*rays;
  float dd = length(position - uCur), w = uHov*exp(-dd*dd*7.0);
  col += vec3(0.95,0.86,0.64)*w*1.0*smoothstep(0.62, 0.92, cr);
  night += w*0.40*smoothstep(0.62, 0.92, cr);
  p *= 1.0 + w*0.035 + (cr - 0.5)*0.012;`,

// Венера: многослойные облачные вихри, полярный вихрь, курсор их раскручивает
ven:`float dd = length(position - uCur), w = uHov*exp(-dd*dd*5.0);
  vec3 q = position;
  q.xz = rot(uTime*0.10*(0.55 + 0.75*abs(lat)) + w*2.4)*q.xz;
  float cl = fbm(q*3.4 + vec3(0.0, uTime*0.05, 0.0));
  float st = fbm(q*8.0 - vec3(uTime*0.04, 0.0, 0.0));
  float band = 0.5 + 0.5*sin(q.y*9.0 + cl*5.0);
  col = mix(vec3(0.55,0.31,0.10), vec3(1.0,0.95,0.76), cl*0.65 + band*0.25 + st*0.15);
  float pol = smoothstep(0.72, 0.99, abs(lat));
  col = mix(col, vec3(0.86,0.74,0.50), pol*(0.4 + 0.5*sin(atan(q.z, q.x)*2.0 + uTime*0.5)));
  night += w*0.28;
  p = q;`,

// Земля: детальную станцию заменять не нужно — здесь короткий узнаваемый вид
ear:`float land = landT(nrm) - 0.18 + (fbm(nrm*6.0) - 0.5)*0.12;     // настоящие материки (поле суши uLand)
  float L = smoothstep(0.00, 0.06, land), ice = iceT(nrm, land + 0.18);
  col = mix(vec3(0.06,0.18,0.48), vec3(0.18,0.44,0.24), L);
  col = mix(col, vec3(0.16,0.36,0.18), L*smoothstep(0.3, 0.7, fbm(nrm*7.0)));
  col = mix(col, vec3(0.80,0.86,0.94), ice);
  float cl = fbm(nrm*3.1 + vec3(uTime*0.03, 0.0, 0.0));
  col = mix(col, vec3(0.82,0.86,0.92), smoothstep(0.55, 0.78, cl)*0.5);
  float dd = length(position - uCur), w = uHov*exp(-dd*dd*8.0);
  float dk = smoothstep(0.15, -0.45, dot(nrm, vec3(cos(uSolid), 0.0, sin(uSolid))));
  col = mix(col, vec3(1.0,0.78,0.38), w*L*dk*0.85);
  night += w*L*dk*1.3;`,

// Марс: Долины Маринера, Олимп, шапки, пыль поднимается под курсором
mar:`float sm = fbm(nrm*1.9), fine = fbm(nrm*5.5);
  col = mix(vec3(0.34,0.12,0.05), vec3(0.94,0.56,0.30), sm*0.75 + fine*0.25);
  float vm = smoothstep(0.10, 0.0, abs(lat + 0.12) - 0.02 - fbm(nrm*4.0)*0.03)
           * smoothstep(1.4, 0.4, abs(atan(nrm.z, nrm.x) + 1.0));
  col = mix(col, vec3(0.30,0.12,0.07), vm*0.85);                          // Долины Маринера
  float oly = smoothstep(0.17, 0.03, length(nrm - normalize(vec3(-0.55, 0.28, 0.79))));
  col = mix(col, vec3(0.96,0.70,0.48), oly*0.8);                          // Олимп
  col = mix(col, vec3(0.94,0.93,0.92), smoothstep(0.84, 0.94, abs(lat)));
  float dd = length(position - uCur), w = uHov*exp(-dd*dd*6.0);
  p += nrm*w*0.11*(0.5 + 0.5*sin(uTime*5.0 + aSeed*30.0));
  col = mix(col, vec3(0.96,0.76,0.50), w*0.8);
  night += w*0.32;`,

// Юпитер: турбулентные полосы, белые овалы, БКП с внутренним закручиванием
jup:`float spin = uTime*0.34*(1.0 - 0.55*abs(lat));
  vec3 cu = uCur; cu.xz = rot(-spin)*cu.xz;
  float dd = length(position - cu), w = uHov*exp(-dd*dd*5.0);
  vec3 q = position; q.xz = rot(spin + w*3.2)*q.xz;
  float turb = fbm(q*4.5 + vec3(0.0, uTime*0.02, 0.0));
  float band = sin(q.y*13.0 + sin(q.y*4.0)*1.5 + turb*0.7);
  col = mix(vec3(0.30,0.17,0.08), vec3(1.0,0.94,0.82), smoothstep(-0.65, 0.65, band));
  col = mix(col, vec3(0.78,0.55,0.32), turb*0.30);
  col = mix(col, vec3(0.82,0.62,0.40), smoothstep(0.55, 0.85, fbm(q*9.0))*0.5);
  float oval = smoothstep(0.86, 0.99, ridge(q*7.0 + vec3(3.0)))*smoothstep(0.55, 0.25, abs(q.y));
  col = mix(col, vec3(1.0,0.98,0.94), oval*0.8);                          // белые овалы
  float lo = atan(q.z, q.x);
  float sp = exp(-pow((q.y + 0.34)*7.0, 2.0) - pow(sin((lo - 1.1)*0.5)*3.4, 2.0));
  float swirl = 0.5 + 0.5*sin(lo*3.0 + q.y*18.0 + uTime*0.8);
  col = mix(col, mix(vec3(0.74,0.24,0.16), vec3(0.95,0.48,0.30), swirl), sp*0.95);
  night += w*0.30;
  p = q;`,

// Сатурн: полосы, шестиугольник на полюсе, тень колец на шаре
sat:`float spin = uTime*0.24;
  vec3 cu = uCur; cu.xz = rot(-spin)*cu.xz;
  float dd = length(position - cu), w = uHov*exp(-dd*dd*5.0);
  vec3 q = position; q.xz = rot(spin + w*2.0)*q.xz;
  float turb = fbm(q*5.5);
  float band = sin(q.y*11.0 + sin(q.y*3.0) + turb*0.55);
  col = mix(vec3(0.40,0.30,0.14), vec3(1.0,0.97,0.85), smoothstep(-0.75, 0.75, band));
  col = mix(col, vec3(0.86,0.78,0.58), smoothstep(0.6, 0.9, fbm(q*11.0))*0.35);
  float hx = smoothstep(0.88, 0.99, q.y)*(0.5 + 0.5*cos(atan(q.z, q.x)*6.0 + uTime*0.4));
  col = mix(col, vec3(0.58,0.76,0.96), hx*0.7);
  col *= 1.0 - 0.45*smoothstep(0.10, 0.02, abs(q.y + 0.06))*step(0.0, -q.z);   // тень колец
  night += w*0.28;
  p = q;`,

// Уран: бледные полосы поперёк лежащей оси, светлая полярная шапка
ura:`float spin = uTime*0.18;
  vec3 cu = uCur; cu.xz = rot(-spin)*cu.xz;
  float dd = length(position - cu), w = uHov*exp(-dd*dd*5.0);
  vec3 q = position; q.xz = rot(spin + w*1.8)*q.xz;
  float turb = fbm(q*4.0);
  float band = sin(q.y*8.0 + turb*0.6);
  col = mix(vec3(0.22,0.52,0.60), vec3(0.66,0.95,0.97), smoothstep(-0.9, 0.9, band));
  col = mix(col, vec3(0.80,0.98,1.0), smoothstep(0.62, 0.95, q.y)*0.45);   // полярная шапка
  night += w*0.30;
  p = q;`,

// Нептун: самые быстрые ветры, Тёмное пятно, яркие метановые облака
nep:`float spin = uTime*0.30*(1.0 - 0.5*abs(lat));
  vec3 cu = uCur; cu.xz = rot(-spin)*cu.xz;
  float dd = length(position - cu), w = uHov*exp(-dd*dd*5.0);
  vec3 q = position; q.xz = rot(spin + w*3.0)*q.xz;
  float turb = fbm(q*4.2 + vec3(uTime*0.03, 0.0, 0.0));
  float band = sin(q.y*9.0 + sin(q.y*2.5)*1.1 + turb*0.7);
  col = mix(vec3(0.05,0.10,0.42), vec3(0.42,0.66,1.0), smoothstep(-0.8, 0.8, band));
  float lo = atan(q.z, q.x);
  float sp = exp(-pow((q.y - 0.28)*8.0, 2.0) - pow(sin((lo + 0.7)*0.5)*3.2, 2.0));
  col = mix(col, vec3(0.04,0.07,0.24), sp*0.9);
  float meth = smoothstep(0.80, 0.97, ridge(q*8.0))*smoothstep(0.7, 0.2, abs(q.y - 0.25));
  col = mix(col, vec3(0.96,0.99,1.0), meth*0.85);                          // метановые перья
  night += w*0.30;
  p = q;`
};

// v185: подробные тела страниц — сплошные шары с картой (137-body-mesh.js); здесь только какие карты им нужны
const HD_MAP = { mer:"mer", mar:"mar", jup:"jup", sat:"sat", ura:"ura", nep:"nep", eur:"eur" };

// у Земли своя станция, поэтому её шар подробнее делать незачем; остальным даём много частиц
const S_DENSE = { ear:3200 };

const SOLAR_BUILD = g => {
  const tilt = new THREE.Group();
  tilt.rotation.x = -Math.PI/2 + .60; tilt.rotation.z = .12;   // плоскость эклиптики наклонена к нам
  g.add(tilt);
  const sys = new THREE.Group(); tilt.add(sys);
  const DIVE = makeSunDive(g);            // слои 2…11: от гелиосферы до ядра
  const BODY = makeBodyDive(g);           // ветки: Луна, Юпитер и Европа (bodies.js)

  /* --- Солнце: своя геометрия натурального размера в группе, сжатой в 1/K раз,
         чтобы на подходе плотность частиц оказалась ровно естественной --- */
  const sunG = new THREE.Group(); sunG.scale.setScalar(S_SUND); sys.add(sunG);
  sunG.add(pts(6500*Q, (i,o,n) => { o.p = fib(i,n).map(v => v*2.5); o.s = .8 + Math.random()*.8; },
    `vec3 q = p;
     float n = sin(q.x*3.1 + uTime*0.9)*sin(q.y*2.7 - uTime*0.7)*sin(q.z*3.3 + uTime*0.5);
     p = q*(1.0 + n*0.05);
     col = mix(vec3(1.0,0.38,0.1), vec3(1.0,0.88,0.5), n*0.5 + 0.5);
     a = 0.75*uSharp;`));
  sunG.add(pts(2600*Q, (i,o) => { o.rnd = dir(); o.s = .5 + Math.random(); },
    // корона укорочена и приглушена на обзоре: в полную величину она накрывала орбиты
    // Меркурия и Венеры, и внутренние планеты тонули в её свете. Разгорается на подлёте (uFocus)
    `float life = fract(aSeed + uTime*0.05);
     p = aRnd*(2.55 + life*life*2.4);
     a = (1.0 - life)*0.55*uSharp*(0.30 + 0.70*uFocus);
     col = mix(vec3(1.0,0.78,0.4), vec3(1.0,0.32,0.12), life);`));
  const sunHalo = glow(0xff6a2a, 5.6, .16), sunCore = glow(0xffb347, 3.0, .55);
  sunG.add(sunHalo, sunCore);

  /* --- пояс астероидов: угол считается в шейдере, у каждого камня свой период --- */
  const belt = pts(1500*Q, (i,o) => {
      const aa = 2.06 + Math.pow(Math.random(), .8)*1.26;
      o.p = [S_ORB(aa), Math.random()*TAU, TAU/S_PER(aa)];
      o.c = mixc(C(0x8a7a62), C(0xd8c6a4), Math.random()); o.s = .30 + Math.random()*.55; },
    `float ang = position.y + uTime*position.z;
     p = vec3(cos(ang)*position.x, aRnd.y*0.035*position.x, sin(ang)*position.x);
     a = (0.10 + 0.16*fract(aSeed*17.0))*uSharp*(1.0 + uHov*0.8);`);
  sys.add(belt);

  /* --- орбиты и планеты --- */
  const orbMat = [], bodies = [];
  PLN.forEach((pl, idx) => {
    const orbG = new THREE.Group();
    orbG.rotation.y = pl.M0*.6; orbG.rotation.x = pl.inc*2*DEG;
    sys.add(orbG);

    const seg = 180, arr = new Float32Array(seg*3), b = pl.R*Math.sqrt(1 - pl.e*pl.e);
    for (let i = 0; i < seg; i++){ const E = i/seg*TAU;
      arr[i*3] = pl.R*(Math.cos(E) - pl.e); arr[i*3+2] = b*Math.sin(E); }
    const og = new THREE.BufferGeometry(); og.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const om = lineMat(0x9fb0e8, .16);
    const line = new THREE.LineLoop(og, om); orbG.add(line); orbMat.push(om);

    const pg = new THREE.Group(); pg.scale.setScalar(pl.d); orbG.add(pg);
    // Точки Фибоначчи ложатся идеальной спиральной решёткой: на крупном плане она проступает
    // муаром и съедает всю поверхность. Сбиваем её джиттером примерно в половину шага решётки
    const sph = pts((S_DENSE[pl.k] || 7000)*Q, (i,o,n) => {
        const v = fib(i, n), j = .020;
        const x = v[0] + gauss()*j, y = v[1] + gauss()*j, z = v[2] + gauss()*j;
        const L = Math.hypot(x, y, z) || 1;
        o.p = [x/L, y/L, z/L]; o.s = .70 + Math.random()*.55; },
      `vec3 nrm = normalize(position);
       float lat = nrm.y;
       float night = 0.0;
       ${S_CHUNK[pl.k]}
       ${S_TAIL}`, 1, S_DECL);
    pg.add(sph);
    const core = glow(pl.hal, 1.9, .55), halo = glow(pl.hal, 3.4, .20);
    pg.add(core, halo);

    let rings = null;
    if (pl.k === "sat" || pl.k === "ura"){
      const inR = pl.k === "sat" ? 1.30 : 1.55, ouR = pl.k === "sat" ? 2.30 : 1.95;
      rings = pts((pl.k === "sat" ? 2200 : 700)*Q, (i,o) => {
          const rr = inR + Math.pow(Math.random(), .8)*(ouR - inR);
          o.p = [rr, Math.random()*TAU, 0];
          o.c = pl.k === "sat" ? mixc(C(0xd9c9a4), C(0xfff4dc), Math.random()) : C(0x8ec6cf);
          o.s = .5 + Math.random()*.8; },
        `float ang = position.y + uTime*0.16/position.x;
         float gap = smoothstep(1.86, 1.90, position.x)*(1.0 - smoothstep(1.98, 2.02, position.x));
         p = vec3(cos(ang)*position.x, aRnd.y*0.006, sin(ang)*position.x);
         a = (0.42 + 0.34*fract(aSeed*11.0))*(1.0 - gap*0.92)*uSharp*(1.0 + uHov*0.5);`);
      pg.add(rings);
    }
    bodies.push({ pl, orbG, pg, sph, core, halo, rings, line, om, hov:0,
                  cur:new THREE.Vector3(9, 9, 9) });
  });

  /* --- Луна: точка рядом с Землёй; клик по ней — в ветку «Луна» (своего подлёта у неё нет) --- */
  const earthB = bodies[2], MOON_R = .24;
  const moonSp = glow(0xf2efe6, .11, .95); earthB.orbG.add(moonSp);
  const moonLb = haloLabel("Луна", .09); earthB.orbG.add(moonLb);
  let moonA = 0, moonHov = 0;

  /* --- состояние подхода --- */
  const st = { sel:-1, selE:0, sunE:0, aim:new THREE.Vector3(), hovI:-1,
               beltP:new THREE.Vector3(), beltA:0, probe:null, pointer:false, vis:1 };
  // Видимый полугабарит станции для вписывания в кадр (см. SEXT/stationFit в шаблоне).
  // На обзоре системы возвращаем null — там работает собственный fitCalc по проекции орбит.
  // На слое «Солнце» габарит звезды линеен по общему масштабу: измерено по кадру, 1,11 и 1,01
  // на единицу произведения sys.scale × tilt.scale.
  st.ext = () => {
    if (st.body) return BODY.ext();
    if (st.dv > 1.35){ const r = DIVE.ext(st.dv); return [r, r]; }
    if (st.sunE < .02 || st.sel >= 0) return null;
    const k = st.wScale*st.fit; return [0.82*k, 0.75*k]; };
  const F = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), sunW = new THREE.Vector3();
  const qP = new THREE.Quaternion(), qA = new THREE.Quaternion(), AXZ = new THREE.Vector3(0, 0, 1);
  const nd = new THREE.Vector3();

  // экранное попадание: сравниваем NDC курсора с проекцией центра тела
  function ndcOf(v3, cam){ nd.copy(v3).project(cam); return nd; }
  // всё считаем в «единицах высоты кадра»: x домножаем на соотношение сторон, тогда
  // порог попадания — честный круг, а не эллипс
  function pick(cam, ndx, ndy, aspect){
    if (moonSp.visible && moonSp.material.opacity > .05){
      moonSp.getWorldPosition(tmpA); const c = ndcOf(tmpA, cam);
      if (c.z <= 1 && Math.hypot((ndx - c.x)*aspect, ndy - c.y) < .042) return 10;
    }
    let best = -1, bestD = 1e9;
    for (let i = 0; i < bodies.length; i++){
      const bd = bodies[i];
      bd.pg.getWorldPosition(tmpA);
      const c = ndcOf(tmpA, cam); if (c.z > 1) continue;
      const cx = c.x, cy = c.y;
      cam.getWorldDirection(tmpB); tmpB.crossVectors(tmpB, cam.up).normalize();
      tmpB.multiplyScalar(bd.pl.d*st.wScale*(g.parent ? g.parent.scale.x : 1)).add(tmpA);
      const e = ndcOf(tmpB, cam);
      const rr = Math.max(Math.hypot((e.x - cx)*aspect, e.y - cy)*1.9, .042);
      const dd = Math.hypot((ndx - cx)*aspect, ndy - cy);
      if (dd < rr && dd < bestD){ bestD = dd; best = i; }
    }
    if (best >= 0) return best;
    // пояс: ищем ближайшую к курсору точку кольца
    let bd2 = 1e9, ba = 0;
    for (let k = 0; k < 48; k++){
      const ang = k/48*TAU;
      tmpA.set(Math.cos(ang)*S_BELT_R, 0, Math.sin(ang)*S_BELT_R);
      sys.localToWorld(tmpA);
      const c = ndcOf(tmpA, cam); if (c.z > 1) continue;
      const dd = Math.hypot((ndx - c.x)*aspect, ndy - c.y);
      if (dd < bd2){ bd2 = dd; ba = ang; }
    }
    if (bd2 < .030){ st.beltA = ba; return 8; }
    // Солнце: клик по нему уводит на слой «Солнце» (см. обработчик), поэтому оно тоже цель
    tmpA.set(0, 0, 0); sys.localToWorld(tmpA);
    const cs = ndcOf(tmpA, cam);
    if (cs.z <= 1 && Math.hypot((ndx - cs.x)*aspect, ndy - cs.y) < .050) return 9;
    return -1;
  }

  st.wScale = 1;
  let lt = 0, T0 = 0, tiltZ = .12, tiltX = -Math.PI/2 + .60, fitK = 1;
  const fitV = new THREE.Vector3(), fitC = new THREE.Vector3();
  // Вписывание в кадр. Аналитическая оценка («радиус × косинус наклона») врёт: плоскость наклонена
  // к камере, перспектива сдвигает проекцию эллипса вверх и растягивает ближнюю половину. Поэтому
  // берём НАСТОЯЩИЙ габарит проекции внешней орбиты и правим масштаб относительно центра станции.
  // Пересчёт идёт только в состоянии покоя: на подлёте и на межстанционном полёте масштаб раздут
  const FIT_M = .93;
  function fitLim(c, v){ const d = v - c; return Math.abs(d) < 1e-4 ? 9 : (d > 0 ? (FIT_M - c)/d : (-FIT_M - c)/d); }
  function fitCalc(){
    fitC.set(0, 0, 0); g.getWorldPosition(fitC); fitC.project(camera);
    let k = 9;
    for (let i = 0; i < 24; i++){
      const E = i/24*TAU;
      fitV.set(Math.cos(E)*S_RMAX, 0, Math.sin(E)*S_RMAX);
      sys.localToWorld(fitV); fitV.project(camera);
      if (fitV.z > 1) return fitK;                       // точка за камерой — оценке верить нельзя
      k = Math.min(k, fitLim(fitC.x, fitV.x), fitLim(fitC.y, fitV.y));
    }
    return clamp(fitK*k, .3, 1.35);
  }
  const upd = (t, H) => {
    const dt = Math.min(.05, Math.max(0, t - lt)); lt = t; T0 += dt;
    st.vis = H && H.v !== undefined ? H.v : 1;
    const solid = (H && H.sun) || 0;
    st.sunE += (solid - st.sunE)*Math.min(1, dt*3.2);
    // глубина внутри станции: 0 — вся система, 1 — звезда целиком, дальше слои погружения
    st.dv = Math.max(0, (H && H.depth) || 0);
    // ветка (Луна / Юпитер): система орбит не показывается, выбор планеты сброшен
    st.body = (H && H.body) || null;
    if (st.body){ st.sel = -1; st.selE = 0; }
    // Система орбит и сама звезда (планеты-спрайты + кольца их орбит, группа tilt) держатся
    // только пока мы ещё в гелиосфере (её масштаб — десятки–сотни а.е., тот же порядок, что и
    // у самих орбит, так что видеть их вместе осмысленно). Дальше, в «Тяжести» (масштаб уже
    // ≈10¹⁶ м — световой год, Облако Оорта), яркие точки-планеты рядом с кольцами эквипотенциала
    // читались как «планеты вращаются ЗА пределами Облака Оорта» — то есть ровно наоборот
    // настоящего масштаба (Люсия заметила). Планеты должны полностью исчезнуть ещё ДО того,
    // как «Тяжесть» наберёт полную силу (её окно видимости в SUN_WIN открывается с d≈2,58).
    // Было: 5,15–6,25, затем 4,3–5,4 — оба варианта держали систему вплоть до короны и ничего
    // не решали для «Тяжести»: на d=3 (пик «Тяжести») она была видна ещё на 100%.
    const sysOut = smooth(2.2, 2.9, st.dv);
    // подлёт к Земле — это вход в главу «Погружение в Землю»: у планеты уже есть своя станция
    if (st.sel === 2 && st.selE > .96) st.goEarth = true;
    // подлёт к Юпитеру — вход в ветку «Юпитер и Европа»: её первый слой и есть карточка планеты
    if (st.sel === 4 && st.selE > .96) st.goJup = true;
    const selOn = st.sel >= 0 ? 1 : 0;
    st.selE += (selOn - st.selE)*Math.min(1, dt*(selOn ? 2.2 : 2.8));
    if (st.selE < .002) st.selE = 0;

    // положения планет по Кеплеру
    for (const bd of bodies){
      const pl = bd.pl;
      const M = pl.M0 + TAU*T0/pl.T, E = kepler(M, pl.e);
      bd.pg.position.set(pl.R*(Math.cos(E) - pl.e), 0, pl.R*Math.sqrt(1 - pl.e*pl.e)*Math.sin(E));
    }
    st.beltP.set(Math.cos(st.beltA)*S_BELT_R, 0, Math.sin(st.beltA)*S_BELT_R);

    // фокус и масштаб: и Солнце, и планета — один механизм
    let K = 1;
    if (st.sel >= 0){
      if (st.sel === 8){ F.copy(st.beltP); K = 3.4; }
      else { const bd = bodies[st.sel]; F.copy(bd.pg.position).applyEuler(bd.orbG.rotation); K = S_KPL(bd.pl.d); }
      K = Math.exp(Math.log(K)*st.selE);
    } else { F.set(0, 0, 0); K = Math.exp(Math.log(S_KSUN)*st.sunE);
      // на слоях-оболочках звезда отступает в центр, иначе её ореол съедает и пузырь, и поле
      K /= 1 + 3.1*smooth(1.05, 2.25, st.dv); }
    sys.scale.setScalar(K); st.wScale = K;
    sys.position.copy(F).multiplyScalar(1 - K);       // масштабируем ОТНОСИТЕЛЬНО точки фокуса

    // наводка камеры на ту же точку — она остаётся неподвижной, всё прочее летит мимо
    tmpA.copy(F); tilt.localToWorld(tmpA);
    g.getWorldPosition(tmpB);
    st.aim.copy(tmpA).sub(tmpB).multiplyScalar(smooth(0, .85, st.selE));

    if (!(H && H.zs !== undefined) && st.selE < .02 && st.sunE < .02){ const f = fitCalc(); fitK += (f - fitK)*Math.min(1, dt*2.0); }
    tilt.visible = sysOut < .99 && !st.body;
    BODY.update(st.body, (H && H.bd) || 0, H && H.v !== undefined ? H.v : 1, t, dt);
    if (tilt.visible) st.vis *= 1 - sysOut;
    DIVE.update(st.dv, st.vis0 = (H && H.v !== undefined ? H.v : 1), t, dt);
    tilt.scale.setScalar(fitK); st.fit = fitK;
    // лёгкий наклон всей системы к курсору
    if (H){ tiltZ += (.12 + H.x*.10*H.h - tiltZ)*.02; tiltX += (-Math.PI/2 + .60 - H.y*.10*H.h - tiltX)*.02;
            tilt.rotation.z = tiltZ; tilt.rotation.x = tiltX; }

    // затухания
    // На прилёте из Галактики (zoom) система приходит из точки: сначала одна звезда, затем
    // проявляются орбиты и пояс — иначе в первом же кадре полёта в кадре висит готовая схема
    const born = H && H.zs !== undefined ? smooth(.10, .50, H.zs) : 1;
    // на ВЫЛЕТЕ (обратный зум к Галактике) сцена растягивается в двадцать раз. Спрайты нельзя
    // растягивать вместе с ней: ореол Солнца залил бы весь кадр белым. Держим их постоянного
    // размера в мире и гасим по мере разлёта
    const zsv = H && H.zs !== undefined ? H.zs : 1;
    const spK = 1/Math.max(1, zsv), spO = 1 - smooth(2, 8, zsv);
    const away = smooth(.12, .70, st.selE);                    // всё, кроме выбранного
    const orbF = (1 - Math.max(away, smooth(.10, .55, st.sunE)))*st.vis;
    for (const om of orbMat) om.opacity = .16*orbF*born;
    belt.material.uniforms.uSharp.value = (st.sel === 8 ? 1 + 2.0*st.selE : 1 - away)*born;
    belt.material.uniforms.uPush.value = .25;
    for (const o of sunG.children) if (o.material.uniforms){ o.material.uniforms.uSharp.value = 1 - away;
                                                             o.material.uniforms.uFocus.value = st.sunE; }
    sunHalo.material.opacity = .16*st.vis*(1 - away)*spO; sunCore.material.opacity = .55*st.vis*(1 - away)*spO;
    sunHalo.scale.setScalar(5.6*spK); sunCore.scale.setScalar(3.0*spK);

    sunW.set(0, 0, 0); sys.localToWorld(sunW);
    for (let i = 0; i < bodies.length; i++){
      const bd = bodies[i], on = st.sel === i;
      const f = on ? 1 : 1 - away;
      const hv = bd.hov, ap = on ? st.selE : 0;
      const u = bd.sph.material.uniforms;
      // На обзоре шар из частиц не рисуем совсем: 820 точек на диске в два десятка пикселей
      // складываются в выжженное белое пятно, и планета теряет и цвет, и размер. Там планету
      // держат два спрайта, а поверхность проявляется по мере подлёта
      const dtl = smooth(.05, .35, ap);
      u.uSize.value = .44 + .38*ap;   // подобрано так, чтобы точки перекрывались примерно вдвое:
                                      // тогда рисунок читается как поверхность, а не как крапинки
      u.uSharp.value = f*dtl*born; u.uHov.value = hv; u.uFocus.value = ap;
      u.uPush.value = .10; u.uRad.value = .5;
      u.uCur.value.copy(bd.cur);          // точка курсора на шаре — ставим ПОСЛЕ общего цикла станции,
                                          // иначе её каждый кадр затирал бы общий ховер станции
      if (bd.rings){ const ru = bd.rings.material.uniforms;
                     ru.uSize.value = .38 + .7*ap; ru.uSharp.value = f*(.30 + .70*dtl);
                     ru.uHov.value = hv; ru.uPush.value = 0; ru.uRad.value = .5; }
      // Ось планеты. Плоскость эклиптики наклонена к зрителю почти плашмя, и без этой поправки
      // мы смотрели бы каждой планете в полюс: широтные полосы сворачивались бы в концентрические
      // кольца вокруг центра диска и читались как шум. Отменяем наклон родителя и ставим planet'е
      // её настоящий наклон оси — отсюда и полосы поперёк, и Уран, лежащий на боку
      bd.orbG.getWorldQuaternion(qP).invert();
      qA.setFromAxisAngle(AXZ, bd.pl.ax*DEG);
      bd.pg.quaternion.copy(qP).multiply(qA);
      // азимут Солнца в системе координат планеты — отсюда терминатор
      tmpA.copy(sunW); bd.sph.worldToLocal(tmpA);
      u.uSolid.value = Math.atan2(tmpA.z, tmpA.x);
      // ядро гаснет по мере подлёта: вблизи планету рисуют частицы, а не спрайт
      const puls = 1 + hv*(.35 + .25*Math.sin(T0*2.6));
      bd.core.material.opacity = .55*st.vis*f*born*spO*(1 - smooth(.22, .60, ap))*puls;
      bd.halo.material.opacity = .20*st.vis*f*born*spO*(1 - smooth(.15, .55, ap))*puls;
      bd.halo.scale.setScalar(3.4*(1 + hv*.55)*spK);
      bd.core.scale.setScalar(1.9*(1 + hv*.30)*spK);
      bd.pg.scale.setScalar(bd.pl.d*(1 + hv*.34));   // сама планета тоже подрастает под курсором
      bd.om.opacity = .16*orbF*(1 + hv*1.6);
      // v184–185: подробная поверхность — только на подлёте к этой планете (её страница); карта строится заранее, при наведении
      const k = bd.pl.k;
      if (BODY_COL[k] && (hv > .3 || on) && HD_MAP[k]) BMAP.want(HD_MAP[k]);
      const hdk = on ? smooth(.25, .8, ap) : 0;
      if (hdk > 0 && !bd.hd && BODY_COL[k]){ const tx = HD_MAP[k] ? BMAP.get(HD_MAP[k]) : true;
        if (tx){ bd.hd = bodyMesh(k, tx); bd.pg.add(bd.hd); bd.hdK = 0; } }
      if (bd.hd){
        bd.hdK += ((hdk > 0 ? 1 : 0) - bd.hdK)*Math.min(1, dt*2.5);
        const x = Math.min(bd.hdK, hdk), hu = bd.hd.material.uniforms;
        bd.hd.visible = x > .003;
        bodyA(bd.hd, f*born*x*st.vis); hu.uSolid.value = u.uSolid.value; hu.uSpin.value = T0*(BODY_SPIN[k] || 0);
        u.uSharp.value *= 1 - x; bd.sph.visible = x < .997;
        bd.core.material.opacity *= 1 - x; bd.halo.material.opacity *= 1 - x;
      }
    }
    // Луна обходит Землю (условно), гаснет вместе с прочими телами
    // под курсором Луна замирает — иначе в маленькую движущуюся точку трудно попасть
    moonA += dt*TAU/9*(1 - moonHov);
    moonSp.position.copy(earthB.pg.position).add(tmpA.set(Math.cos(moonA)*MOON_R, 0, Math.sin(moonA)*MOON_R));
    moonHov += ((st.hovI === 10 ? 1 : 0) - moonHov)*Math.min(1, dt*5);
    const mf = (st.sel === 2 ? 1 : 1 - away)*born*spO*st.vis;
    moonSp.material.opacity = .95*mf; moonSp.scale.setScalar(.11*(1 + .8*moonHov)*spK);
    moonLb.position.copy(moonSp.position).add(tmpA.set(0, .085, 0)); moonLb.material.opacity = .95*mf*moonHov;
    moonSp.visible = moonLb.visible = mf > .01 && !st.body;
  };

  st.moonSp = moonSp;
  st.moonPt = v => BODY.moonPt(v);
  upd.api = st;
  st.pick = pick;
  st.bodies = bodies;
  st.sys = sys;
  SOLAR = st;
  return upd;
};

