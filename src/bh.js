/* ---------- Чёрная дыра в центре Галактики (ветка станции IV) ----------
   Полноэкранный трассировщик лучей. Каждый пиксель — фотон, который мы пускаем из камеры назад во времени
   по световой геодезической Шварцшильда. Единицы: радиус Шварцшильда rs = 1, фотонная сфера 1,5,
   последняя устойчивая орбита (ISCO) 3. Уравнение фотона в декартовой форме: x'' = −1,5·h²·x / r⁵,
   h = |x × x'| сохраняется — это точная замена геодезической, а не «ньютонова» подделка.
   Что видно благодаря этому само собой, без рисования: тень, фотонное кольцо, верхняя и нижняя
   половины диска, загнутые над и под тенью, и вторичное изображение изнанки диска.
   Доплер: газ слева летит на нас и ярче, справа — от нас и краснее; плюс гравитационное покраснение.
   Рендерится в уменьшенную текстуру (дорого), на экран выводится квадом в mscene поверх сцены. */
const BH = (() => {
  const RIN = 2.6, ROUT = 15.0, RB = 24.0;
  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const FS = `
precision highp float;
uniform vec2 uOff; uniform float uTime, uGasT, uTan, uAsp, uHotA, uDark, uExp;
uniform vec3 uCam, uFwd, uRight, uUp, uHot;
varying vec2 vUv;
float h31(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0,0.0,0.0)), f.x), mix(h31(i + vec3(0.0,1.0,0.0)), h31(i + vec3(1.0,1.0,0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0,0.0,1.0)), h31(i + vec3(1.0,0.0,1.0)), f.x), mix(h31(i + vec3(0.0,1.0,1.0)), h31(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z); }
float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a*n3(p); p = p*2.07 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
float fbm2(vec3 p){ return 0.62*n3(p) + 0.38*n3(p*2.3 + vec3(4.1, 1.3, 7.7)); }
// цвет чёрного тела по трём длинам волн (формула Планка), нормированный по зелёному
vec3 planck(float T){ vec3 l = vec3(0.61, 0.55, 0.465); vec3 I = 1.0/(l*l*l*l*l*(exp(14388.0/(l*T)) - 1.0)); return I/max(I.g, 1e-9); }
// небо вокруг Стрельца A*: ядерное звёздное скопление — самое плотное звёздное поле Галактики — и пыль
vec3 sky(vec3 d){
  vec3 nG = normalize(vec3(0.28, 1.0, -0.2));
  float b = dot(d, nG);
  float band = exp(-b*b*9.0);
  float dust = fbm(d*5.0 + 3.0);
  vec3 col = vec3(0.10, 0.055, 0.035)*band*(0.25 + 0.75*smoothstep(0.42, 0.72, dust)) + vec3(0.012, 0.010, 0.014);
  for (int k = 0; k < 2; k++){
    float sc = k == 0 ? 60.0 : 150.0;
    vec3 q = d*sc, id = floor(q), f = fract(q) - 0.5;
    float h = h31(id + float(k)*17.0);
    float thr = k == 0 ? 0.90 - 0.10*band : 0.80 - 0.25*band;
    if (h > thr){
      vec3 o = vec3(h31(id + 1.3), h31(id + 2.7), h31(id + 5.1)) - 0.5;
      float dd = length(f - o*0.55);
      float br = exp(-dd*dd*(k == 0 ? 160.0 : 380.0))*(0.35 + 0.65*h31(id + 7.0))*(k == 0 ? 1.5 : 0.7);
      col += mix(vec3(1.0, 0.72, 0.52), vec3(0.78, 0.86, 1.0), h31(id + 9.0))*br;
    }
  }
  return col;
}
// узор газа: вытянутые вдоль орбиты волокна и сгустки. Угол подаётся через cos/sin — шва на φ = π нет
float gas(float r, float a, float s){
  vec3 q = vec3(cos(a)*2.6, sin(a)*2.6, log(r)*6.5 + s);
  q += (vec3(n3(q*0.8 + 7.0), n3(q*0.8 + 3.0), n3(q*0.8 + 11.0)) - 0.5)*1.5;   // завихрения
  float n = fbm(q);
  float fine = n3(vec3(cos(a)*11.0, sin(a)*11.0, log(r)*30.0 + s*1.7));
  return smoothstep(0.32, 0.80, n)*(0.5 + 0.5*fine);
}
float omega(float r){ return 1.35*sqrt(0.5/(r*r*r)); }   // кеплерова угловая скорость, ускоренная для глаза
// Дифференциальное вращение за минуту скрутило бы любой узор в тонкие кольца. Поэтому узор несут два
// слоя со сдвигом фазы на полпериода: каждый живёт один период и уступает место другому (flow map)
float gasFlow(float r, float phi, float s){
  const float P = 30.0;
  float f1 = fract(uGasT/P), f2 = fract(uGasT/P + 0.5), w1 = 1.0 - abs(2.0*f1 - 1.0);
  float om = omega(r);
  return gas(r, phi - om*f1*P, s)*w1 + gas(r, phi - om*f2*P, s + 5.3)*(1.0 - w1);
}
float prof(float r){ return pow(3.0/r, 0.75)*pow(max(1.0 - sqrt(RIN_/r), 0.0), 0.25)*2.1; }
vec4 disk(vec3 p, vec3 dir){
  float r = length(p.xz);
  if (r < RIN_ || r > ROUT_) return vec4(0.0);
  float phi = atan(p.z, p.x);
  float dens = gasFlow(r, phi, 0.0);
  float hot = uHotA*exp(-dot(p - uHot, p - uHot)/3.2);            // газ под курсором разогревается
  dens = min(1.0, dens*(1.0 + 0.5*hot) + 0.10*hot);
  float edge = smoothstep(RIN_, RIN_ + 0.7, r)*(1.0 - smoothstep(8.0, ROUT_, r));
  float v = min(sqrt(0.5/(r - 1.0)), 0.75);
  vec3 tang = normalize(vec3(-p.z, 0.0, p.x));
  float cosT = dot(tang, -normalize(dir));
  float g = sqrt(1.0 - 1.0/r)*sqrt(1.0 - v*v)/(1.0 - v*cosT);    // доплер + гравитационное покраснение
  float pr = prof(r);
  float Tk = clamp((2100.0 + 4000.0*pr)*g*(1.0 + 0.3*hot), 1500.0, 6900.0);
  float br = (0.45 + 1.9*pr*pr)*pow(g, 2.6)*(1.0 + 4.2*hot);
  float al = clamp(dens*1.35, 0.0, 0.96)*edge;
  // пыль: плотные холодные сгустки не светятся, а темнеют бурым — как прожилки в настоящем газе
  float dust = smoothstep(0.55, 0.82, n3(vec3(cos(phi - omega(r)*uGasT*0.5)*5.0, sin(phi - omega(r)*uGasT*0.5)*5.0, log(r)*14.0)))*(1.0 - 0.8*hot);
  vec3 c = mix(planck(Tk)*br, vec3(0.30, 0.15, 0.08)*br*0.35, dust*0.85);
  return vec4(c*al, al);
}
void main(){
  vec2 q = vUv*2.0 - 1.0 - uOff;
  vec3 dir = normalize(uFwd + q.x*uTan*uAsp*uRight + q.y*uTan*uUp);
  vec3 pos = uCam;
  vec3 acc = vec3(0.0); float trans = 1.0, hole = 0.0;
  // вне сферы RB лучи почти прямые: доводим их до неё сразу; те, что проходят мимо, лишь чуть отклоняем
  if (dot(pos, pos) > RB_*RB_){
    float tc = -dot(pos, dir); vec3 cp = pos + dir*tc; float b = length(cp);
    if (tc < 0.0 || b > RB_){
      dir = normalize(dir - cp/b*(2.0/max(b, 1.5)));
      gl_FragColor = vec4(sky(dir)*(1.0 - uDark), 1.0); return;
    }
    pos += dir*(tc - sqrt(RB_*RB_ - b*b));
  }
  vec3 hv = cross(pos, dir); float h2 = dot(hv, hv);
  for (int i = 0; i < 220; i++){
    float r2 = dot(pos, pos), r = sqrt(r2);
    if (r < 1.0){ hole = 1.0; break; }
    float dt = clamp(0.05*r, 0.02, 1.4);
    vec3 nd = dir - 1.5*h2*pos/(r2*r2*r)*dt;
    vec3 np = pos + nd*dt;
    if (pos.y*np.y < 0.0){
      vec3 hp = mix(pos, np, pos.y/(pos.y - np.y));
      vec4 dc = disk(hp, nd);
      acc += trans*dc.rgb; trans *= 1.0 - dc.a;
    }
    // объём: пушистые облака над и под диском — светятся слабо и заслоняют то, что за ними
    float rr = length(pos.xz);
    if (rr > 2.4 && rr < 16.0){
      float H = 0.05 + 0.055*rr, vy = pos.y/H, env = exp(-vy*vy);
      if (env > 0.03){
        float ph = atan(pos.z, pos.x) - omega(rr)*uGasT*0.35;
        float c = fbm2(vec3(cos(ph)*3.4, sin(ph)*3.4, log(rr)*5.0) + vec3(0.0, pos.y*2.2, 0.0));
        float hot = uHotA*exp(-dot(pos - uHot, pos - uHot)/4.0);
        float dens = env*smoothstep(0.42, 0.85, c)*(1.0 - smoothstep(9.0, 16.0, rr))*smoothstep(2.4, 3.4, rr);
        float pr = prof(max(rr, RIN_ + 0.01));
        float step_ = dt*length(nd);
        acc += trans*vec3(1.0, 0.58, 0.32)*dens*(0.10 + 0.55*pr*pr)*(1.0 + 5.0*hot)*step_;
        trans *= exp(-dens*0.9*step_);
      }
    }
    pos = np; dir = nd;
    if (trans < 0.01) break;
    if (r > RB_ + 1.0 && dot(pos, dir) > 0.0) break;
  }
  if (hole < 0.5) acc += trans*sky(normalize(dir));
  acc *= uExp;
  vec3 col = acc/(1.0 + 0.28*acc);
  gl_FragColor = vec4(col*(1.0 - uDark), 1.0);
}`.replace(/RIN_/g, RIN.toFixed(2)).replace(/ROUT_/g, ROUT.toFixed(2)).replace(/RB_/g, RB.toFixed(2));

  const U = { uOff:{value:new THREE.Vector2()}, uTime:{value:0}, uGasT:{value:0}, uTan:{value:.36}, uAsp:{value:1},
              uHotA:{value:0}, uDark:{value:0}, uExp:{value:1}, uCam:{value:new THREE.Vector3()}, uFwd:{value:new THREE.Vector3()},
              uRight:{value:new THREE.Vector3()}, uUp:{value:new THREE.Vector3()}, uHot:{value:new THREE.Vector3(9, 0, 0)} };
  const mat = new THREE.ShaderMaterial({ uniforms:U, vertexShader:VS, fragmentShader:FS, depthTest:false, depthWrite:false });
  const bscene = new THREE.Scene(), bcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bq = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); bq.frustumCulled = false; bscene.add(bq);
  // вывод: премультиплицированная альфа — яркое ложится поверх ядра галактики, тёмное гасит её не сразу
  const OU = { uTex:{value:null}, uVis:{value:0}, uCov:{value:0} };
  const out = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms:OU, vertexShader:VS,
    fragmentShader:`uniform sampler2D uTex; uniform float uVis, uCov; varying vec2 vUv;
      void main(){ vec3 c = texture2D(uTex, vUv).rgb; gl_FragColor = vec4(c*uVis, uCov); }`,
    transparent:true, depthTest:false, depthWrite:false, blending:THREE.CustomBlending,
    blendSrc:THREE.OneFactor, blendDst:THREE.OneMinusSrcAlphaFactor }));
  out.frustumCulled = false; out.renderOrder = 999; out.visible = false; mscene.add(out);

  let rt = null, rw = 0, rh = 0, scale = mobile ? .42 : .6, slow = 0, gasT = 0;
  const dbs = new THREE.Vector2();
  function ensureRT(){
    renderer.getDrawingBufferSize(dbs);
    const w = Math.max(64, Math.round(dbs.x*scale)), h = Math.max(64, Math.round(dbs.y*scale));
    if (rt && w === rw && h === rh) return;
    if (rt) rt.dispose();
    rw = w; rh = h;
    rt = new THREE.WebGLRenderTarget(w, h, { minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthBuffer:false });
    OU.uTex.value = rt.texture;
  }
  // камера: сферические координаты вокруг дыры, небольшой крен — диск ложится по диагонали кадра
  const cam = { pos:new THREE.Vector3(), fwd:new THREE.Vector3(), right:new THREE.Vector3(), up:new THREE.Vector3() };
  const Y = new THREE.Vector3(0, 1, 0), tq = new THREE.Vector3();
  function setCam(R, el, az, roll, aimDown){
    cam.pos.set(R*Math.cos(el)*Math.sin(az), R*Math.sin(el), R*Math.cos(el)*Math.cos(az));
    tq.set(0, -aimDown*R, 0);
    cam.fwd.copy(tq).sub(cam.pos).normalize();
    cam.right.crossVectors(cam.fwd, Y).normalize();
    cam.up.crossVectors(cam.right, cam.fwd).normalize();
    if (roll){ const c = Math.cos(roll), s = Math.sin(roll);
      tq.copy(cam.right).multiplyScalar(c).addScaledVector(cam.up, s);
      cam.up.multiplyScalar(c).addScaledVector(cam.right, -s); cam.right.copy(tq); }
  }
  // Тот же фотон на процессоре — для курсора: куда он упадёт на диске или уйдёт ли под горизонт.
  // Шаг и уравнение совпадают с шейдером, поэтому разогрев встаёт ровно под курсор — и на основном
  // изображении газа, и на его линзовых копиях над и под тенью
  const tp = new THREE.Vector3(), td = new THREE.Vector3(), tn = new THREE.Vector3(), th = new THREE.Vector3();
  function pick(qx, qy){
    td.copy(cam.fwd).addScaledVector(cam.right, qx*U.uTan.value*U.uAsp.value).addScaledVector(cam.up, qy*U.uTan.value).normalize();
    tp.copy(cam.pos);
    if (tp.lengthSq() > RB*RB){
      const tc = -tp.dot(td); th.copy(tp).addScaledVector(td, tc); const b = th.length();
      if (tc < 0 || b > RB) return { hole:false, hit:null };
      tp.addScaledVector(td, tc - Math.sqrt(RB*RB - b*b));
    }
    th.crossVectors(tp, td); const h2 = th.lengthSq();
    for (let i = 0; i < 400; i++){
      const r2 = tp.lengthSq(), r = Math.sqrt(r2);
      if (r < 1) return { hole:true, hit:null };
      const dt = clamp(.05*r, .02, 1.4), k = -1.5*h2/(r2*r2*r)*dt;
      td.addScaledVector(tp, k);
      tn.copy(tp).addScaledVector(td, dt);
      if (tp.y*tn.y < 0){
        const hp = tp.clone().lerp(tn, tp.y/(tp.y - tn.y)), rr = Math.hypot(hp.x, hp.z);
        if (rr > RIN && rr < ROUT) return { hole:false, hit:hp };
      }
      tp.copy(tn);
      if (r > RB + 1 && tp.dot(td) > 0) break;
    }
    return { hole:false, hit:null };
  }
  const hotT = new THREE.Vector3(9, 0, 0);
  let hoverHole = false;
  // o: { vis, cov, R, el, az, roll, aim, tan, dark, off:[x,y], ndc:[x,y], pointer, dt, T }
  function update(o){
    const on = o.vis > .003;
    out.visible = on;
    hoverHole = false;
    if (!on){ U.uHotA.value = 0; return { hole:false, disk:false, on:false }; }
    // адаптивное качество: долгие кадры подряд — снижаем разрешение трассировки
    slow = o.dt > .034 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 50 && scale > .3){ scale *= .82; slow = 0; }
    ensureRT();
    gasT += o.dt;
    setCam(o.R, o.el, o.az, o.roll, o.aim || 0);
    U.uCam.value.copy(cam.pos); U.uFwd.value.copy(cam.fwd); U.uRight.value.copy(cam.right); U.uUp.value.copy(cam.up);
    U.uTan.value = o.tan; U.uAsp.value = W/H; U.uOff.value.set(o.off[0], o.off[1]);
    U.uTime.value = o.T; U.uGasT.value = gasT; U.uDark.value = o.dark || 0;
    // вблизи диск заполняет весь кадр: как глаз и камера, прикрываем диафрагму, иначе кадр выгорает в белое
    U.uExp.value = .5 + .5*smooth(2.5, 16, o.R);
    let disk = false;
    if (o.pointer){
      const pk = pick(o.ndc[0] - o.off[0], o.ndc[1] - o.off[1]);
      hoverHole = pk.hole;
      if (pk.hit){ disk = true; hotT.copy(pk.hit); }
    }
    U.uHot.value.lerp(hotT, Math.min(1, o.dt*6));
    U.uHotA.value += ((disk ? 1 : 0) - U.uHotA.value)*Math.min(1, o.dt*(disk ? 1.6 : .9));
    OU.uVis.value = o.vis; OU.uCov.value = o.cov;
    const prevRT = renderer.getRenderTarget();
    renderer.setRenderTarget(rt); renderer.render(bscene, bcam); renderer.setRenderTarget(prevRT);
    return { hole:hoverHole, disk, on:true };
  }
  // касание на тач-экране: курсора нет, поэтому проверяем точку в момент касания
  const holeAt = (x, y) => pick(x - U.uOff.value.x, y - U.uOff.value.y).hole;
  const setScale = v => { scale = v; };
  return { update, holeAt, setScale, get hole(){ return hoverHole; } };
})();

/* ---------- слои ветки «Чёрная дыра» (станция IV, ответвление к центру Галактики) ---------- */
const BH_LV = [
  { name:"Стрелец A*", sub:"Сердце Млечного Пути", short:"Центр", cat:"центр Галактики",
    scale:"27 000 св. лет от Солнца · 4,3 млн масс Солнца",
    hint:"Листайте — ближе к дыре. Наведите на газ — он разгорится",
    lead:"Мы летим к центру Галактики — сквозь пыль, которая прячет его от глаза, к самому плотному звёздному полю Млечного Пути. В середине — чёрная дыра в четыре с лишним миллиона масс Солнца. Её саму не видно: видно только то, что её тяжесть делает со светом и газом вокруг.",
    sci:[["s","Масса — 4,297 млн масс Солнца (коллаборация GRAVITY, 2023), расстояние — около 27 000 световых лет (8,28 кпк)"],
         ["s","Массу взвесили по орбитам звёзд. Звезда S2 обходит дыру за 16 лет и в перицентре проносится в 120 а.е. от неё со скоростью около 2,6% скорости света. За это открытие Райнхард Генцель и Андреа Гез получили Нобелевскую премию по физике 2020 года"],
         ["s","В 2018 году GRAVITY увидел в свете S2 гравитационное красное смещение, а позже — поворот её орбиты, предсказанный Шварцшильдом: общая теория относительности подтвердилась там, где её ещё никто не проверял"],
         ["s","Пыль ослабляет видимый свет из центра Галактики примерно в триллион раз — его изучают в инфракрасном, радио и рентгене"],
         ["s","Стрелец A* — удивительно тихая дыра: светит в десятки миллионов раз слабее, чем позволила бы её масса. Но она не спит: в 2025 году JWST увидел, что она непрерывно «пузырится» — несколько ярких вспышек в сутки и мерцание между ними"]],
    trad:["Закон Одного — у каждой галактики свой Логос; её спиральная энергия задаёт законы для солнц",
          "Каббала (Ари) — цимцум: Бесконечное «сжимается» и освобождает пустое место, в котором может возникнуть мир",
          "Индуизм — бинду: точка, из которой разворачивается вселенная и в которую она сворачивается",
          "Майя — тёмная щель Млечного Пути у Стрельца, по одной из реконструкций (Линда Шили), — «дорога в Шибальбу», подземный мир. Трактовка спорная"],
    par:"У человека тоже есть центр, которого не видно самого по себе: его узнают по тому, как вокруг него движется всё остальное — мысли, чувства, выборы.",
    prac:["Созерцание центра: 5 минут смотреть в одну точку мягким взглядом и замечать, как вокруг неё «кружится» периферия поля зрения",
          "Вопрос в пути: вокруг чего вращается моя жизнь?"] },
  { name:"Аккреционный поток", sub:"Газ на последних орбитах", short:"Газ", cat:"аккреция",
    scale:"от 3 до 15 радиусов горизонта",
    hint:"Наведите на облака газа — они разгорятся",
    lead:"Газ не падает в дыру напрямую: он кружит, трётся слоями, теряет вращение и по спирали опускается вниз. От трения он разогревается до миллионов градусов — чем ближе к центру, тем быстрее и горячее.",
    sci:[["s","Ближе трёх радиусов горизонта устойчивых орбит нет: здесь газ перестаёт кружить и срывается вниз (последняя устойчивая круговая орбита, ISCO)"],
         ["s","Одна сторона диска ярче другой: газ, летящий на нас со скоростью в доли скорости света, усиливает и «синит» свой свет, а улетающий — ослабляет и краснит (релятивистский эффект Доплера)"],
         ["s","У Стрельца A* нет тонкого яркого диска, как в этом кадре: там горячий, разреженный, толстый поток, который светится в основном в радио и рентгене. Мы показываем его ярче, чем он есть, — иначе глазу нечего было бы видеть"],
         ["s","В 2024 году EHT снял Стрелец A* в поляризованном свете: по краю тени идёт упорядоченное спиральное магнитное поле — такое же, как у дыры M87*"],
         ["s","Первое рассчитанное изображение чёрной дыры с диском сделал в 1979 году Жан-Пьер Люмине: компьютер посчитал лучи, а картинку он нарисовал вручную, точками"]],
    trad:["Дао дэ цзин, гл. 11 — тридцать спиц сходятся в одной ступице, но колесу служит пустота в её середине",
          "Суфизм — сама, кружение дервишей: движение вокруг незримого центра как путь к нему",
          "Индуизм и буддизм — сансара, круговорот, который затягивает, пока не найден центр"],
    par:"Внимание ведёт себя как газ: кружит вокруг того, что притягивает, разогревается от трения и светится ярче всего перед тем, как исчезнуть в главном.",
    prac:["Кружение по-суфийски: 3–5 минут медленного вращения вокруг своей оси, взгляд на ладонь; затем остановиться и постоять в тишине",
          "Цигун: круговые движения таза и рук вокруг нижнего даньтяня, 9 кругов в каждую сторону"] },
  { name:"Фотонное кольцо", sub:"Свет на орбите", short:"Кольцо", cat:"гравитационная линза",
    scale:"1,5 радиуса горизонта",
    hint:"Наведите на газ над тенью — это та же сторона диска, загнутая светом",
    lead:"Здесь сам свет может идти по кругу. Лучи, которые чуть не упали в дыру, огибают её и уходят к нам — поэтому видны и верх диска, и его низ, и даже обратная сторона, загнутая над тенью. Тонкая яркая нить по краю тени — свет, успевший обернуться вокруг дыры.",
    sci:[["s","На полутора радиусах горизонта лежит фотонная сфера: свет может кружить по ней, но неустойчиво, как шарик на вершине холма"],
         ["s","Тень дыры в 2,6 раза больше её горизонта. Для Стрельца A* это 52 микросекунды дуги — как пончик на Луне, если смотреть с Земли"],
         ["s","12 мая 2022 года коллаборация Event Horizon Telescope показала первый снимок тени Стрельца A* — радиотелескопы по всей Земле работали как один размером с планету"],
         ["s","Звёзды за дырой растягиваются в дуги и двоятся — это гравитационная линза, предсказанная Эйнштейном и видимая в скоплениях галактик"]],
    trad:["Индуизм — Шива Натараджа танцует в кольце пламени: огненный круг вокруг танца творения и растворения",
          "Уроборос — змей, кусающий свой хвост: путь, который возвращается к себе",
          "Неоплатонизм — всё истекает из Единого и возвращается в него по кругу (Плотин)"],
    par:"На краю большой перемены свет идёт по кругу: мы снова и снова возвращаемся к одному вопросу, пока не решимся — упасть внутрь или уйти.",
    prac:["Микрокосмическая орбита (даосизм): на вдохе внимание поднимается вдоль спины, на выдохе опускается по передней стороне тела, 9 кругов"] },
  { name:"Горизонт событий", sub:"Точка без возврата", short:"Горизонт", cat:"горизонт",
    scale:"12 млн км — радиус горизонта Стрельца A*",
    hint:"Наведите на черноту и нажмите — погрузиться",
    lead:"Граница, из-за которой не выходит ничего, даже свет. Но стены на ней нет: у такой огромной дыры приливные силы на горизонте почти не чувствуются, и пересекающий его не заметит ничего особенного. Просто все пути отсюда ведут внутрь.",
    sci:[["s","Радиус горизонта Стрельца A* — около 12 млн км: он поместился бы внутри орбиты Меркурия"],
         ["s","Под горизонтом в решении Шварцшильда направление к центру становится направлением времени: центр — уже не место впереди, а будущее, которого не избежать"],
         ["s","Горизонт сверхмассивной дыры пересекается незаметно: приливные силы там слабы. Растягивать в нить начинает гораздо глубже"],
         ["h","Излучение Хокинга: горизонт должен слабо светиться и медленно испарять дыру. Для Стрельца A* оно неизмеримо мало и пока не наблюдалось"],
         ["h","Что происходит с информацией о том, что упало, — открытый вопрос физики. Кротовые норы и «белые дыры» — решения уравнений, но не наблюдаемые объекты"]],
    trad:["Псевдо-Дионисий Ареопагит — «божественный мрак»: Бог познаётся не в свете, а в темноте, превосходящей свет",
          "Иоанн Креста — «тёмная ночь души»: отрезок пути, на котором гаснут привычные опоры",
          "Суфизм — фана: растворение «я» в Едином, после которого приходит бака — пребывание",
          "Буддизм — шуньята, пустотность: за формой нет отдельной сущности, и это не «ничто», а открытость"],
    par:"Точка невозврата есть и во внутреннем пути — когда увиденное уже нельзя не видеть. Снаружи это похоже на исчезновение, изнутри — на обычный шаг.",
    prac:["Выдох до конца и пауза без вдоха, 3–5 секунд: заметить, кто присутствует, когда нет ни вдоха, ни мысли",
          "Вопрос у порога: что я готов не брать с собой?"] }
];
