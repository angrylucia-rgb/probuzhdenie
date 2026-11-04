/* ---------- v184: карты поверхностей тел Солнечной системы ----------
   Как у Земли (поле суши uLand), у Луны и планет теперь своя карта поверхности — по настоящей географии:
   моря и кратеры Луны, тёмные и светлые области Марса, полосы Юпитера и Сатурна, линии Европы и т. д.
   Карта — равнопромежуточная (долгота × широта, строки с юга на север, долгота 0 смотрит на +z, восток — на +x),
   её читает шейдер точек через mapT() (общая шапка частиц). Каналы: R — альбедо, G — рельеф в свете Солнца
   (128 — ровно), B и A — маски тела (моря, лучи, полярные шапки, облака…).
   Карту не хранят в странице: её строит код по каталогу деталей (широта, долгота, размер), и только когда
   впервые открывается страница самого тела. Готовая карта кэшируется до перезагрузки.
   Координаты деталей — по картам IAU/USGS (● — положение и размер; рисунок деталей — упрощённый).        */
const BMAP = (() => {
  const cache = {}, D2R = Math.PI/180;
  // шум: 3D value noise с хешем — тот же характер, что у fbm в шейдерах
  const hsh = (x, y, z) => { let h = (x*374761393 + y*668265263 + z*1440662683) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
  function vn(x, y, z){ const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z); let fx = x - ix, fy = y - iy, fz = z - iz;
    fx = fx*fx*(3 - 2*fx); fy = fy*fy*(3 - 2*fy); fz = fz*fz*(3 - 2*fz);
    const L = (a, b, t) => a + (b - a)*t;
    return L(L(L(hsh(ix, iy, iz), hsh(ix + 1, iy, iz), fx), L(hsh(ix, iy + 1, iz), hsh(ix + 1, iy + 1, iz), fx), fy),
             L(L(hsh(ix, iy, iz + 1), hsh(ix + 1, iy, iz + 1), fx), L(hsh(ix, iy + 1, iz + 1), hsh(ix + 1, iy + 1, iz + 1), fx), fy), fz); }
  function fbm(x, y, z, o){ let s = 0, a = .5, n = 0; for (let k = 0; k < o; k++){ s += a*vn(x, y, z); n += a; x *= 2.03; y *= 2.03; z *= 2.03; a *= .5; } return s/n; }
  // детерминированный генератор случайных чисел: карта одна и та же при каждом заходе
  function rng(seed){ let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; }

  function grid(w, h){
    const M = { w, h, A: new Float32Array(w*h), H: new Float32Array(w*h), B: new Float32Array(w*h), C: new Float32Array(w*h),
      cl: new Float32Array(h), sl: new Float32Array(h), co: new Float32Array(w), so: new Float32Array(w) };
    for (let y = 0; y < h; y++){ const la = ((y + .5)/h - .5)*Math.PI; M.cl[y] = Math.cos(la); M.sl[y] = Math.sin(la); }
    for (let x = 0; x < w; x++){ const lo = ((x + .5)/w - .5)*2*Math.PI; M.co[x] = Math.cos(lo); M.so[x] = Math.sin(lo); }
    return M;
  }
  // обход точек карты в пределах углового радиуса R (рад) от центра (широта, долгота — в градусах):
  // fn(индекс, t = расстояние/R, x, y)
  function each(M, lat, lon, R, fn){
    const { w, h } = M, la0 = lat*D2R, lo0 = lon*D2R, cx = Math.cos(la0)*Math.sin(lo0), cy = Math.sin(la0), cz = Math.cos(la0)*Math.cos(lo0), cR = Math.cos(R);
    const y0 = Math.max(0, Math.floor(((la0 - R)/Math.PI + .5)*h)), y1 = Math.min(h - 1, Math.ceil(((la0 + R)/Math.PI + .5)*h));
    for (let y = y0; y <= y1; y++){
      const cl = M.cl[y], sl = M.sl[y];
      let xs = 0, xe = w - 1;
      const far = Math.abs(((y + .5)/h - .5)*Math.PI) + R;
      if (far < Math.PI/2*.995){ const dl = Math.asin(Math.min(1, Math.sin(R)/Math.max(1e-6, cl))); const c = (lo0/(2*Math.PI) + .5)*w, hw = dl/(2*Math.PI)*w + 1; xs = Math.floor(c - hw); xe = Math.ceil(c + hw); }
      for (let xx = xs; xx <= xe; xx++){
        const x = ((xx % w) + w) % w, d = cl*M.so[x]*cx + sl*cy + cl*M.co[x]*cz;
        if (d <= cR) continue;
        fn(y*w + x, Math.acos(Math.min(1, d))/R, x, y);
      }
    }
  }
  // направление точки карты (для шума)
  const dirOf = (M, i) => { const x = i % M.w, y = (i/M.w) | 0; return [M.cl[y]*M.so[x], M.sl[y], M.cl[y]*M.co[x]]; };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
  // точка на большом круге: из центра (широта, долгота) по азимуту az на угол s (рад)
  function dest(lat, lon, az, s){ const la = lat*D2R, lo = lon*D2R;
    const la2 = Math.asin(Math.sin(la)*Math.cos(s) + Math.cos(la)*Math.sin(s)*Math.cos(az));
    const lo2 = lo + Math.atan2(Math.sin(az)*Math.sin(s)*Math.cos(la), Math.cos(s) - Math.sin(la)*Math.sin(la2));
    return [la2/D2R, lo2/D2R]; }
  // упаковка в текстуру: R — альбедо, G — рельеф, освещённый с востока (у Луны Солнце справа), B, A — маски
  function pack(M, shadeK, gData){
    const { w, h } = M, out = new Uint8Array(w*h*4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
      const i = y*w + x, e = y*w + (x + 1) % w, ww = y*w + (x - 1 + w) % w;
      const sh = shadeK ? Math.tanh(-(M.H[e] - M.H[ww])*shadeK/Math.max(.15, M.cl[y])) : 0;
      out[i*4] = Math.max(0, Math.min(255, M.A[i]*255)); out[i*4 + 1] = gData ? Math.max(0, Math.min(255, M.H[i]*255)) : 128 + sh*127;
      out[i*4 + 2] = Math.max(0, Math.min(255, M.B[i]*255)); out[i*4 + 3] = Math.max(0, Math.min(255, M.C[i]*255));
    }
    const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.needsUpdate = true;
    t.userData = { M };
    return t;
  }
  // кратер: чаша, вал, центральная горка у крупных, светлые выбросы у молодых; t — расстояние в радиусах
  function crater(M, lat, lon, R, o){
    const dep = o.dep ?? .9, rim = o.rim ?? .55, peak = R > .9*D2R ? .35 : 0, young = o.young || 0, floor = o.floor, ej = o.ej || 2.6;
    each(M, lat, lon, R*ej, (i, t) => {
      const u = t*ej;
      let dh = 0;
      if (u < 1) dh -= dep*(1 - u*u)*(floor !== undefined ? .55 : 1) - peak*Math.exp(-((u/.16)**2));
      dh += rim*Math.exp(-(((u - 1)/.13)**2));
      if (u > 1) dh += .18*rim*Math.exp(-(u - 1)*2.2);
      M.H[i] += dh*R*40;
      if (floor !== undefined && u < .86) M.A[i] += (floor - M.A[i])*sm(.86, .72, u);
      if (young){ const b = young*(u < 1.1 ? .6*sm(.6, 1.0, u) + .25 : Math.exp(-(u - 1.1)*1.6)*.85); M.A[i] += (1 - M.A[i])*b*.5; M.C[i] = Math.max(M.C[i], b); }
    });
  }
  function rays(M, lat, lon, R, L, n, amp, r){
    for (let k = 0; k < n; k++){
      const az = r()*2*Math.PI, len = L*(.35 + .65*r()), wd = R*(.25 + .35*r()), st = Math.max(wd*.7, .004);
      for (let s = R*1.2; s < len; s += st){
        const [la, lo] = dest(lat, lon, az, s), f = amp*Math.pow(1 - s/len, 1.3)*(.6 + .4*r());
        each(M, la, lo, wd*(1 + s/len), (i, t) => { const b = f*(1 - t*t); M.A[i] += (1 - M.A[i])*b*.55; M.C[i] = Math.max(M.C[i], b); });
      }
    }
  }

  /* ===== Луна ===== */
  // радиус Луны 1737 км: диаметр детали в км → угловой радиус в радианах
  const MR = D => D/2/1737*1.08;
  // моря: [широта, долгота (восток +), диаметр пятна км, альбедо]. Неправильные моря — несколькими пятнами
  const MARE = [
    [32.8, -15.6, 1100, .20], [38, -26, 520, .20], [26, -8, 420, .21],                    // Море Дождей
    [28.0, 17.5, 680, .235],                                                               // Море Ясности
    [8.5, 31.4, 680, .165], [15, 24, 330, .17], [3, 38, 380, .165], [-1, 28, 280, .17],   // Море Спокойствия
    [17.0, 59.1, 470, .19], [16.5, 54, 300, .19], [17.5, 64, 280, .19],                    // Море Кризисов
    [-7.8, 51.3, 560, .215], [-2, 56, 330, .215], [-15, 49, 330, .215],                    // Море Изобилия
    [-15.2, 35.5, 330, .205],                                                              // Море Нектара
    [-21.3, -16.6, 640, .235], [-15, -12, 300, .24],                                       // Море Облаков
    [-10.0, -23.1, 340, .225],                                                             // Море Познанное
    [-24.4, -38.6, 380, .205],                                                             // Море Влажности
    [7.5, -30.9, 470, .225],                                                               // Море Островов
    [13.3, 3.6, 240, .215], [2.4, 1.7, 300, .235], [10.9, -8.8, 280, .23],                // Море Паров, Залив Центральный, Залив Зноя
    [44.1, -31.5, 240, .21], [26.5, 0.4, 170, .235], [38, 29.2, 320, .245], [45, 27.2, 150, .24],   // Залив Радуги, Болото Гниения, Озеро Сновидений, Озеро Смерти
    [14.1, 45, 140, .25], [1.1, 65.1, 140, .2], [6.8, 68.4, 230, .205], [22.6, 67.7, 100, .2],      // Болото Сна, Море Пены, Море Волн, Море Змеи
    [13.3, 86.1, 400, .215], [1.3, 87.5, 360, .2], [56.8, 81.5, 260, .215], [-38.9, 93, 560, .25], // Краевое, Смита, Гумбольдта, Южное
    [-32, -28.2, 280, .235],                                                               // Болото Эпидемий
    // Океан Бурь
    [18.4, -57.4, 880, .195], [30, -54, 600, .2], [5, -50, 560, .2], [-2, -42, 430, .205], [40, -48, 480, .205], [12, -64, 560, .19], [26, -68, 430, .195], [-8, -55, 300, .205],
    // Море Холода — полоса вдоль 56° с.ш.
    [57, -42, 300, .25], [56, -28, 280, .255], [56, -12, 300, .255], [57, 4, 300, .26], [57, 20, 300, .26], [57, 34, 260, .26], [53, -52, 280, .245],
    [-19.4, -92.8, 330, .185], [27.3, 147.9, 270, .195], [-33.7, 163.5, 300, .235]           // Восточное, Москвы, Мечты (обратная сторона)
  ];
  // кратеры: [широта, долгота, диаметр км, тип]: r — молодой с лучами, b — яркий молодой, d — тёмное дно, n — обычный, o — старый
  const CRAT = [
    [-43.3, -11.2, 85, "r", 1400, 36], [9.6, -20.1, 93, "r", 800, 26], [8.1, -38, 32, "r", 520, 16], [23.7, -47.4, 40, "b", 260, 10],
    [16.1, 46.8, 28, "r", 560, 11], [-24.5, -63.7, 19, "r", 380, 9], [8.4, -77.6, 43, "r", 600, 12], [35.9, 102.8, 22, "r", 420, 18],
    [22.4, -163.1, 71, "r", 700, 16], [61.8, 50.3, 31, "r", 380, 9], [73.4, -10.1, 51, "r", 420, 10], [18.4, -113.5, 64, "r", 400, 10],
    [51.6, -9.4, 101, "d"], [-5.2, -68.6, 173, "d"], [-3.3, -74.6, 139, "d"], [53.6, 57, 123, "d"], [-20.4, 129.1, 185, "d"], [-49.6, -60.2, 84, "d"],
    [-58.4, -14.4, 231, "o"], [-50.5, -6.3, 194, "o"], [-49.6, -21.7, 145, "o"], [-44.4, -54.6, 206, "o"], [-66.5, -69.1, 301, "o"], [-32.5, -5.2, 256, "o"],
    [-9.3, -1.9, 154, "o"], [-13.4, -3.2, 108, "n"], [-18.2, -1.9, 96, "n"], [-11.2, 4.1, 129, "o"], [-5.1, 5.2, 138, "o"],
    [-11.4, 26.4, 100, "n"], [-13.2, 24, 98, "o"], [-18.1, 23.6, 99, "o"], [-29.7, 32.2, 88, "n"], [-8.9, 61, 132, "n"], [-25.1, 60.4, 177, "n"],
    [-16.3, 61.6, 131, "o"], [-36, 60.6, 125, "o"], [-45, 40, 190, "o"], [31.9, 29.9, 95, "n"], [46.7, 44.4, 87, "n"], [46.7, 39.1, 69, "n"],
    [50.2, 17.4, 87, "n"], [44.3, 16.3, 67, "n"], [29.7, -4, 81, "n"], [14.5, -11.3, 58, "n"], [-17.6, -40.1, 110, "n"], [-20.7, -22.2, 61, "n"],
    [3.3, -22.8, 42, "n"], [14.5, 9.1, 39, "b"], [16.3, 16, 26, "b"], [2.8, 17.3, 18, "b"], [63.5, -63, 142, "n"], [-27, 80.9, 207, "n"], [-51.8, -40, 180, "o"],
    [-32.5, 54.2, 74, "b"], [2.6, -128.7, 536, "o"], [-4, -157.4, 437, "o"], [-36.1, -151.8, 537, "o"], [5.4, 140.9, 313, "o"], [-20.2, 149.2, 265, "o"],
    [-5.9, 179.4, 93, "n"], [41.6, -118.1, 214, "o"], [58.7, -146.1, 345, "o"], [-56.7, 163.6, 312, "o"], [-75, 132.4, 312, "o"]
  ];
  // генератор карты — пошаговый (function*): строится кусками по ~10 мс между кадрами, без подвисания
  function* moon(){
    const M = grid(1024, 512), N = M.w*M.h, r = rng(1737), Nf = new Float32Array(N);
    for (let y = 0; y < M.h; y++){
      for (let x = 0; x < M.w; x++){ const i = y*M.w + x, dx = M.cl[y]*M.so[x], dy = M.sl[y], dz = M.cl[y]*M.co[x];
        const f = fbm(dx*3 + 5, dy*3, dz*3, 3); Nf[i] = fbm(dx*5 + 11, dy*5, dz*5, 2);
        M.A[i] = .60 + .36*(f - .5) + .05*(vn(dx*24, dy*24, dz*24) - .5); M.H[i] = .02*(Nf[i] - .5); }
      if (y % 24 === 23) yield;
    }
    // бассейн Южный полюс — Эйткен: обширная низина с чуть более тёмным дном (обратная сторона)
    each(M, -53, -169, 41*D2R, (i, t) => { const k = sm(1, .55, t); M.A[i] -= .09*k; M.H[i] -= .03*k; });
    // моря: альбедо и маска с неровным краем (соседние пятна сливаются в одно море)
    const mar = new Float32Array(N), malb = new Float32Array(N);
    for (const [la, lo, D, al] of MARE){ each(M, la, lo, MR(D)*1.75, (i, t) => {
      const e = t*1.5 + .9*(Nf[i] - .5) + .25*(M.A[i] - .6), k = sm(1.1, .78, e);
      if (k > mar[i]){ malb[i] = al; mar[i] = k; } }); yield; }
    for (let i = 0; i < N; i++){ const k = mar[i]; if (k <= 0) continue;
      M.A[i] += (malb[i] + .10*(Nf[i] - .5) + .2*(M.A[i] - .6) - M.A[i])*k; M.H[i] *= 1 - .7*k; M.B[i] = k; }
    yield;
    // хребты в морях: тонкие извилистые валы
    for (let k = 0; k < 70; k++){ const la = (r() - .5)*80, lo = (r() - .5)*170, i0 = ((la/180 + .5)*M.h | 0)*M.w + ((lo/360 + .5)*M.w | 0); if (mar[i0] < .6) continue;
      let a = r()*Math.PI*2, p = [la, lo]; for (let s = 0; s < 18; s++){ p = dest(p[0], p[1], a, .012); a += (r() - .5)*.7; each(M, p[0], p[1], .005, (i, t) => { M.H[i] += .004*(1 - t); }); } }
    // мелкие кратеры: степенное распределение размеров; на морях их втрое меньше — моря моложе
    for (let k = 0; k < 4200; k++){
      const z = r()*2 - 1, lo = (r() - .5)*360, la = Math.asin(z)/D2R;
      const Rr = Math.min(.07, .0018/Math.pow(r() + .012, .62))*(.7 + .6*r());
      const i0 = ((la/180 + .5)*M.h | 0)*M.w + ((lo/360 + .5)*M.w | 0);
      if (mar[i0] > .5 && r() > .3) continue;
      crater(M, la, lo, Rr, { dep: .5 + .6*r(), rim: .25 + .5*r(), young: r() < .06 ? .35 + .4*r() : 0, ej: 1.7 });
      if (k % 150 === 149) yield;
    }
    // именные кратеры и лучи
    for (const [la, lo, D, ty, L, n] of CRAT){
      const R = MR(D);
      crater(M, la, lo, R, ty === "d" ? { floor: .17, dep: .6, rim: .6 } : ty === "o" ? { dep: .3, rim: .22 } : ty === "r" || ty === "b" ? { dep: 1, rim: .8, young: ty === "b" ? .9 : .75 } : { dep: .8, rim: .55 });
      if (L) rays(M, la, lo, R, L/1737, n, ty === "b" ? .45 : .7, r);
      yield;
    }
    return pack(M, 3.2);
  }

  // общие шаги: шумовая основа (альбедо и рельеф) и россыпь кратеров со степенным распределением размеров
  function* base(M, a0, ka, kh, seed){
    for (let y = 0; y < M.h; y++){
      for (let x = 0; x < M.w; x++){ const i = y*M.w + x, dx = M.cl[y]*M.so[x], dy = M.sl[y], dz = M.cl[y]*M.co[x];
        M.A[i] = a0 + ka*(fbm(dx*3 + seed, dy*3, dz*3, 3) - .5) + .05*(vn(dx*22, dy*22 + seed, dz*22) - .5); M.H[i] = kh*(fbm(dx*8, dy*8 + seed, dz*8, 2) - .5); }
      if (y % 24 === 23) yield;
    }
  }
  function* scatter(M, r, n, rmin, rmax, skip){
    for (let k = 0; k < n; k++){
      const z = r()*2 - 1, lo = (r() - .5)*360, la = Math.asin(z)/D2R;
      const Rr = Math.min(rmax, rmin/Math.pow(r() + .012, .62))*(.7 + .6*r());
      if (skip && skip(la, lo, r)) continue;
      crater(M, la, lo, Rr, { dep: .5 + .6*r(), rim: .25 + .5*r(), young: r() < .05 ? .35 + .4*r() : 0, ej: 1.7 });
      if (k % 150 === 149) yield;
    }
  }
  // пятно с неровным краем: значение v в канал ch (A — альбедо, B, C — маски), k — сила
  function blob(M, ch, lat, lon, R, v, k = 1, rough = .6, sx = 1){
    each(M, lat, lon, R*1.6, (i, t) => { const [x, y, z] = dirOf(M, i);
      const e = t*1.6 + rough*(fbm(x*6 + lat, y*6, z*6 + lon, 3) - .5), f = sm(1.1, .75, e)*k;
      if (f > 0) M[ch][i] += (v - M[ch][i])*f; });
  }
  // цепь пятен вдоль пути — каньоны, полосы, линии
  function path(M, ch, pts, R, v, k){ for (let j = 0; j < pts.length - 1; j++){ const [a1, o1] = pts[j], [a2, o2] = pts[j + 1];
      for (let s = 0; s <= 1; s += .1) blob(M, ch, a1 + (a2 - a1)*s, o1 + (o2 - o1)*s, R, v, k, .3); } }

  /* ===== Меркурий (радиус 2440 км) ===== */
  const ME = D => D/2/2440;
  function* mer(){
    const M = grid(1024, 512), r = rng(2440);
    yield* base(M, .50, .28, .02, 3);
    // «синеватое» вещество низкой отражательной способности (LRM) и светлые гладкие равнины
    for (let k = 0; k < 14; k++) blob(M, "B", (r() - .5)*120, (r() - .5)*360, (8 + r()*14)*D2R, 1, .8);
    for (let i = 0; i < M.w*M.h; i++) M.A[i] -= .12*M.B[i];
    blob(M, "A", 30.5, 170.2, ME(1550), .62, .9, .4);                      // бассейн Калорис — светлые равнины внутри
    blob(M, "A", 60, 30, 18*D2R, .58, .6); blob(M, "A", 65, -60, 16*D2R, .58, .5);   // северные гладкие равнины
    yield;
    yield* scatter(M, r, 5200, .0016, .08);
    const NAM = [[30.5, 170.2, 1550, "o"], [27.6, 57.6, 290, "n"], [-20.8, -123.6, 630, "o"], [-16.3, -164.7, 390, "o"], [-33.2, 87.9, 715, "o"], [27.3, 119.1, 263, "n"],
      [13.7, -85, 213, "n"], [7.8, 169.4, 225, "n"], [57.8, 16.8, 95, "r", 1800, 26], [-33.9, 12.5, 80, "r", 900, 18], [-11.3, -31.5, 62, "b", 300, 10],
      [-32.3, -170.6, 75, "r", 700, 12], [37.1, -127.3, 52, "r", 600, 12], [-48, 26, 150, "n"], [43, -86, 240, "o"]];
    for (const [la, lo, D, ty, L, n] of NAM){ const R = ME(D);
      crater(M, la, lo, R, ty === "o" ? { dep: .3, rim: .25 } : ty === "n" ? { dep: .8, rim: .55 } : { dep: 1, rim: .8, young: .8 });
      if (L) rays(M, la, lo, R, L/2440, n, .65, r); yield; }
    return pack(M, 3.2);
  }

  /* ===== Марс (радиус 3390 км) ===== */
  const MA = D => D/2/3390;
  function* mar(){
    const M = grid(1024, 512), r = rng(3390);
    yield* base(M, .62, .22, .015, 7);
    // тёмные области (альбедо): [широта, долгота, размер км, сила]
    const DARK = [[8.4, 69.5, 1300, 1], [18, 66, 900, .9], [46.7, -22, 1500, .9], [40, -10, 900, .7], [-2, 0, 700, .9], [-3, -12, 600, .8], [-8, 20, 1100, .9], [-10, 40, 900, .8],
      [-25, -40, 1500, .8], [-18, -55, 700, .75], [-20, 105, 1400, .85], [-12, 120, 900, .7], [-25, 145, 1500, .85], [-20, 165, 900, .75], [-30, -150, 1400, .8], [-28, -170, 900, .7],
      [-26, -87, 420, .85], [46.7, 117.5, 1300, .45], [55, 85, 900, .5], [-60, 0, 1400, .45], [-58, 60, 1000, .45], [30, 20, 600, .5]];
    for (const [la, lo, D, k] of DARK){ blob(M, "B", la, lo, MA(D), 1, k, .9); }
    yield;
    for (let i = 0; i < M.w*M.h; i++) M.A[i] -= .34*M.B[i];
    // светлые: Эллада, Аргир, Аравия, Фарсида, Элизий
    for (const [la, lo, D, v] of [[-42.4, 70.5, 2000, .86], [-49.7, -42.8, 1500, .8], [20, 5, 1800, .74], [5, -110, 2600, .74], [25, 147, 900, .72]]) blob(M, "A", la, lo, MA(D), v, .8, .7);
    yield;
    // вулканы: купола с кальдерами
    for (const [la, lo, D, h] of [[18.65, -133.8, 620, 1.6], [11.8, -104.5, 350, 1], [0.8, -113.4, 375, 1], [-8.3, -120.1, 435, 1], [25, 147.2, 240, .7], [40.5, -109.6, 1000, .35]]){
      const R = MA(D); each(M, la, lo, R, (i, t) => { M.H[i] += h*R*.35*(1 - t*t) - h*R*.4*Math.exp(-((t/.14)**2)); M.A[i] += .06*(1 - t); }); }
    // Долины Маринера: цепочка вытянутых тёмных низин
    path(M, "B", [[-6.6, -101], [-8, -92], [-10, -80], [-12, -72], [-13.5, -64], [-12, -56], [-9, -48]], 1.4*D2R, 1, .9);
    each(M, -10, -75, 30*D2R, (i, t) => {}); // (зарезервировано)
    for (let i = 0; i < M.w*M.h; i++) M.A[i] -= .0*M.B[i];
    path(M, "H", [[-6.6, -101], [-8, -92], [-10, -80], [-12, -72], [-13.5, -64], [-12, -56], [-9, -48]], 1.2*D2R, -.03, .9);
    yield;
    // кратеры: южное нагорье изрыто, северные низменности гладкие
    yield* scatter(M, r, 3600, .0018, .06, (la, lo, rr) => la > 10 && rr() > .25);
    // полярные шапки: северная — летняя остаточная, южная — смещена к 45° з. д.
    each(M, 90, 0, 9*D2R, (i, t) => { M.C[i] = Math.max(M.C[i], sm(1, .7, t)); });
    each(M, -87, -45, 5*D2R, (i, t) => { M.C[i] = Math.max(M.C[i], sm(1, .6, t)); });
    return pack(M, 3);
  }

  /* ===== Газовые гиганты: полосы по широтам ===== */
  // профиль: [широта от, до, яркость, коричневость, рыжесть]; между зонами — плавные переходы и вихри
  function* bands(M, prof, turb, seed){
    const r = rng(seed);
    for (let y = 0; y < M.h; y++){
      const la = ((y + .5)/M.h - .5)*180;
      let b = prof[prof.length - 1];
      for (const p of prof) if (la >= p[0] && la < p[1]){ b = p; break; }
      for (let x = 0; x < M.w; x++){ const i = y*M.w + x, dx = M.cl[y]*M.so[x], dy = M.sl[y], dz = M.cl[y]*M.co[x];
        const tw = fbm(dx*4 + seed, dy*24, dz*4, 3), ed = fbm(dx*9, dy*9 + seed, dz*9, 2);
        // край полосы рвётся вихрями: широту сдвигаем шумом
        const la2 = la + turb*(tw - .5)*6;
        let q = b; for (const p of prof) if (la2 >= p[0] && la2 < p[1]){ q = p; break; }
        M.A[i] = q[2] + .10*(ed - .5); M.H[i] = q[3] + .12*(tw - .5); M.B[i] = q[4]; }
      if (y % 24 === 23) yield;
    }
  }
  const oval = (M, ch, lat, lon, rx, ry, v, k) => each(M, lat, lon, Math.max(rx, ry)*D2R, (i, t, x, y) => {
    const la = ((y + .5)/M.h - .5)*180, lo = ((x + .5)/M.w - .5)*360; let dl = lo - lon; dl -= 360*Math.round(dl/360);
    const e = Math.hypot(dl*Math.cos(la*D2R)/rx, (la - lat)/ry); if (e < 1) M[ch][i] += (v - M[ch][i])*k*sm(1, .55, e); });
  function* jup(){
    const M = grid(1024, 512);
    // ● широты полос — по наблюдениям «Вояджеров», «Кассини» и «Юноны» (планетографические)
    yield* bands(M, [[-90, -45, .55, .25, 0], [-45, -40, .62, .45, 0], [-40, -34, .80, .25, 0], [-34, -27, .55, .65, .1], [-27, -20, .88, .15, 0],
                     [-20, -7, .52, .85, .25], [-7, 7, .92, .12, .05], [7, 18, .50, .90, .2], [18, 24, .88, .18, 0], [24, 31, .58, .70, .1],
                     [31, 38, .82, .25, 0], [38, 43, .62, .5, 0], [43, 90, .55, .25, 0]], 1, 11);
    // Большое Красное Пятно: 22° ю. ш., ≈14° × 9° — и белые овалы в южной умеренной полосе
    oval(M, "B", -22.5, 40, 7, 4.6, 1, 1); oval(M, "A", -22.5, 40, 7, 4.6, .72, .8); oval(M, "H", -22.5, 40, 8.5, 5.6, .2, .7);
    for (const lo of [-100, -40, 120]) oval(M, "C", -33, lo, 3, 2, 1, 1);
    for (let k = 0; k < 14; k++) oval(M, "C", 9 + Math.sin(k)*1.5, -170 + k*25, 1.6, .9, .55, 1);   // фестоны у северного края экваториальной зоны
    return pack(M, 0, true);
  }
  function* sat(){
    const M = grid(1024, 512);
    yield* bands(M, [[-90, -60, .62, .35, .3], [-60, -40, .72, .5, .1], [-40, -20, .80, .55, 0], [-20, -8, .76, .6, 0], [-8, 8, .95, .35, 0],
                     [8, 20, .78, .62, 0], [20, 40, .84, .5, 0], [40, 60, .76, .45, .1], [60, 90, .66, .3, .45]], .45, 26);
    // шестиугольник у северного полюса (78° с. ш.): граница — правильный шестиугольник в полярной проекции
    each(M, 90, 0, 16*D2R, (i, t, x, y) => { const lo = ((x + .5)/M.w - .5)*2*Math.PI, cb = 90 - ((y + .5)/M.h - .5)*180;
      const hx = 12/(Math.cos(((lo + Math.PI/6) % (Math.PI/3) + Math.PI/3) % (Math.PI/3) - Math.PI/6)), k = sm(hx + .6, hx - .6, cb);
      M.B[i] += (.85 - M.B[i])*k; M.A[i] += (.6 - M.A[i])*k*.6; if (Math.abs(cb - hx) < .9) M.C[i] = .6; });
    return pack(M, 0, true);
  }
  function* ura(){
    const M = grid(512, 256);
    yield* bands(M, [[-90, -45, .96, .1, 0], [-45, -20, .86, .2, 0], [-20, 20, .82, .25, 0], [20, 45, .84, .2, 0], [45, 90, .92, .12, 0]], .3, 41);
    const r = rng(25362); for (let k = 0; k < 7; k++) oval(M, "C", 20 + r()*30, (r() - .5)*360, 2.5, 1.2, 1, 1);
    return pack(M, 0, true);
  }
  function* nep(){
    const M = grid(512, 256);
    yield* bands(M, [[-90, -60, .82, .2, 0], [-60, -45, .70, .45, 0], [-45, -25, .78, .35, 0], [-25, 25, .72, .4, 0], [25, 50, .78, .3, 0], [50, 90, .84, .2, 0]], .5, 49);
    // Большое Тёмное Пятно (снимки «Вояджера-2», 1989) со светлыми облаками-спутниками, «Скутер» и пятно D2
    oval(M, "B", -20, 0, 15, 7.5, 1, 1); oval(M, "C", -14, 4, 7, 1.6, 1, 1); oval(M, "C", -42, 60, 3, 1.5, 1, 1); oval(M, "B", -55, 120, 4, 2.5, 1, 1);
    const r = rng(24622); for (let k = 0; k < 10; k++) oval(M, "C", (r() - .5)*120, (r() - .5)*360, 4 + r()*8, .7, .7, 1);
    return pack(M, 0, true);
  }

  /* ===== Европа (радиус 1561 км) ===== */
  function* eur(){
    const M = grid(1024, 512), r = rng(1561);
    yield* base(M, .80, .16, .01, 17);
    // ведомое полушарие (центр 270° з. д. = 90° в. д.) темнее и рыжее — серу приносит магнитосфера Юпитера
    each(M, 0, 90, 80*D2R, (i, t) => { const k = sm(1, .2, t); M.A[i] -= .13*k; M.C[i] = Math.max(M.C[i], .5*k); });
    // линии: двойные хребты — дуги больших кругов, по большей части вытянутые к экватору
    for (let k = 0; k < 160; k++){
      let la = (r() - .5)*140, lo = (r() - .5)*360, az = (r() < .7 ? .4 + r()*.8 : r()*Math.PI) + (r() < .5 ? 0 : Math.PI);
      const L = .2 + r()*1.2, w = .004 + r()*.006, v = .55 + r()*.45;
      for (let s = 0; s < L; s += .008){ const [a, o] = dest(la, lo, az + .25*Math.sin(s*5 + k), s);
        each(M, a, o, w, (i, t) => { M.B[i] = Math.max(M.B[i], v*(1 - t*t)); M.H[i] += .004*(1 - t); }); }
      if (k % 10 === 9) yield;
    }
    // области хаоса (Конамара и др.): пятнистый рыжеватый лёд
    for (const [la, lo, D] of [[9.7, 86.3, 120], [-5, 100, 300], [20, 120, 260], [-30, 60, 220], [5, -160, 200]]) each(M, la, lo, D/2/1561*1.3, (i, t) => { const [x, y, z] = dirOf(M, i), f = sm(1, .5, t)*fbm(x*40, y*40, z*40, 2); M.C[i] = Math.max(M.C[i], f); M.A[i] -= .1*f; });
    // кратер Пуйл (25° ю. ш., 271° з. д.) с яркими лучами
    crater(M, -25.2, 88.6, 26/2/1561, { dep: 1, rim: .7, young: .9 }); rays(M, -25.2, 88.6, 13/1561, 1000/1561, 14, .8, r);
    return pack(M, 2.5);
  }

  const GEN = { moon, mer, mar, jup, sat, ura, nep, eur };
  // очередь построения: кусками по 10 мс в промежутках между кадрами
  const jobs = {}; let pumping = false;
  function pump(){
    if (pumping) return; pumping = true;
    const run = () => {
      const t0 = performance.now(), k = Object.keys(jobs)[0];
      if (k) while (performance.now() - t0 < 10){ const r = jobs[k].g.next(); if (r.done){ cache[k] = r.value; cache[k].userData.ms = performance.now() - jobs[k].t0; delete jobs[k]; break; } }
      if (Object.keys(jobs).length) setTimeout(run, 0); else pumping = false;
    };
    setTimeout(run, 0);
  }
  return {
    // начать строить карту (если её ещё нет); готовую вернёт get()
    want(k){ if (cache[k] || jobs[k] || !GEN[k]) return; jobs[k] = { g: GEN[k](), t0: performance.now() }; pump(); },
    get(k){ if (!cache[k]) this.want(k); return cache[k] || null; },
    // построить сразу, целиком (для проверки)
    now(k){ if (!cache[k] && GEN[k]){ const t0 = performance.now(), g = GEN[k](); let r; while (!(r = g.next()).done); cache[k] = r.value; cache[k].userData.ms = performance.now() - t0; delete jobs[k]; } return cache[k] || null; },
    has: k => !!cache[k],
    // альбедо карты в направлении [x, y, z] — для рисунков из частиц вне шейдера (значок Луны и её полёт)
    albedo(k, d){ const t = cache[k]; if (!t) return null; const M = t.userData.M, l = Math.hypot(d[0], d[1], d[2]) || 1;
      const lo = Math.atan2(d[0]/l, d[2]/l), la = Math.asin(Math.max(-1, Math.min(1, d[1]/l)));
      const x = Math.min(M.w - 1, Math.floor((lo/(2*Math.PI) + .5)*M.w)), y = Math.min(M.h - 1, Math.floor((la/Math.PI + .5)*M.h)); return M.A[y*M.w + x]; },
    _gen: GEN
  };
})();
