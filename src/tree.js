/* ---------- Древо жизни (итерация 8) ----------
   Радиальное 3D-древо из светящихся точек: LUCA в центре, время по радиусу (нелинейная шкала по эрам,
   кайнозой — логарифмически), внешний край — сегодня. Пять массовых вымираний — концентрические срезы.
   Своя глава #chTree со своим WebGL-рендерером: рисуется только пока глава открыта.
   Узлы: [id, родитель, имя, начало (млн лет назад), конец (0 — живут сейчас), группа]. Даты — оценки
   молекулярных часов и окаменелостей; спорные помечаются в карточках (8б). */
const TREE_ROWS = [
  ["luca", null, "LUCA — общий предок", 4200, 0, "root"],
  ["bac", "luca", "Бактерии", 4000, 0, "bac"],
  ["cyano", "bac", "Цианобактерии", 3000, 0, "bac"],
  ["firm", "bac", "Фирмикуты", 3000, 0, "bac"],
  ["proteo", "bac", "Протеобактерии", 2700, 0, "bac"],
  ["actino", "bac", "Актинобактерии", 2700, 0, "bac"],
  ["arc", "luca", "Археи", 4000, 0, "arc"],
  ["meth", "arc", "Метаногены", 3500, 0, "arc"],
  ["halo", "arc", "Галоархеи", 2500, 0, "arc"],
  ["asg", "arc", "Асгардархеи", 2700, 0, "arc"],
  ["euk", "asg", "Эукариоты", 1800, 0, "pro"],
  ["amoe", "euk", "Амёбозои", 1500, 0, "pro"],
  ["sar", "euk", "SAR-группа", 1500, 0, "pro"],
  ["cil", "sar", "Инфузории", 1100, 0, "pro"],
  ["foram", "sar", "Фораминиферы", 600, 0, "pro"],
  ["diat", "sar", "Диатомовые водоросли", 240, 0, "pro"],
  ["apl", "euk", "Архепластиды", 1500, 0, "pla"],
  ["red", "apl", "Красные водоросли", 1200, 0, "pla"],
  ["green", "apl", "Зелёные водоросли", 1000, 0, "pla"],
  ["land", "green", "Наземные растения", 470, 0, "pla"],
  ["moss", "land", "Мхи и печёночники", 450, 0, "pla"],
  ["vasc", "land", "Сосудистые растения", 430, 0, "pla"],
  ["lyco", "vasc", "Плауны", 410, 0, "pla"],
  ["fern", "vasc", "Папоротники и хвощи", 390, 0, "pla"],
  ["seed", "vasc", "Семенные растения", 365, 0, "pla"],
  ["gymn", "seed", "Голосеменные", 320, 0, "pla"],
  ["angio", "seed", "Цветковые", 140, 0, "pla"],
  ["monoc", "angio", "Однодольные", 120, 0, "pla"],
  ["grass", "monoc", "Злаки", 70, 0, "pla"],
  ["eudi", "angio", "Двудольные", 125, 0, "pla"],
  ["opis", "euk", "Заднежгутиковые", 1300, 0, "pro"],
  ["fungi", "opis", "Грибы", 1000, 0, "fun"],
  ["chytr", "fungi", "Хитридиевые", 800, 0, "fun"],
  ["glom", "fungi", "Гломеромицеты", 500, 0, "fun"],
  ["asco", "fungi", "Аскомицеты", 500, 0, "fun"],
  ["basid", "fungi", "Базидиомицеты", 500, 0, "fun"],
  ["choano", "opis", "Хоанофлагелляты", 900, 0, "pro"],
  ["ani", "opis", "Животные", 800, 0, "ani"],
  ["spong", "ani", "Губки", 750, 0, "ani"],
  ["cten", "ani", "Гребневики", 750, 0, "ani"],
  ["edia", "ani", "Эдиакарская биота", 580, 539, "ani"],
  ["cnid", "ani", "Стрекающие", 650, 0, "ani"],
  ["bil", "ani", "Двусторонне-симметричные", 600, 0, "ani"],
  ["prot", "bil", "Первичноротые", 580, 0, "ani"],
  ["ecdy", "prot", "Линяющие", 560, 0, "ani"],
  ["nema", "ecdy", "Нематоды", 550, 0, "ani"],
  ["arth", "ecdy", "Членистоногие", 540, 0, "ani"],
  ["trilo", "arth", "Трилобиты", 521, 252, "ani"],
  ["chel", "arth", "Хелицеровые", 510, 0, "ani"],
  ["crust", "arth", "Ракообразные", 510, 0, "ani"],
  ["insect", "crust", "Насекомые", 440, 0, "ani"],
  ["beetle", "insect", "Жуки", 300, 0, "ani"],
  ["hymen", "insect", "Пчёлы, осы, муравьи", 280, 0, "ani"],
  ["lepid", "insect", "Бабочки", 210, 0, "ani"],
  ["loph", "prot", "Спиральные", 560, 0, "ani"],
  ["annel", "loph", "Кольчатые черви", 530, 0, "ani"],
  ["moll", "loph", "Моллюски", 540, 0, "ani"],
  ["ceph", "moll", "Головоногие", 500, 0, "ani"],
  ["ammon", "ceph", "Аммониты", 400, 66, "ani"],
  ["deut", "bil", "Вторичноротые", 580, 0, "ver"],
  ["echin", "deut", "Иглокожие", 530, 0, "ani"],
  ["chord", "deut", "Хордовые", 540, 0, "ver"],
  ["lanc", "chord", "Ланцетники", 520, 0, "ver"],
  ["tuni", "chord", "Оболочники", 520, 0, "ver"],
  ["vert", "chord", "Позвоночные", 520, 0, "ver"],
  ["agna", "vert", "Миноги и миксины", 500, 0, "ver"],
  ["gnath", "vert", "Челюстноротые", 450, 0, "ver"],
  ["placo", "gnath", "Панцирные рыбы", 430, 359, "ver"],
  ["chond", "gnath", "Хрящевые рыбы", 420, 0, "ver"],
  ["oste", "gnath", "Костные рыбы", 425, 0, "ver"],
  ["actin", "oste", "Лучепёрые рыбы", 420, 0, "ver"],
  ["sarc", "oste", "Лопастепёрые", 415, 0, "ver"],
  ["coel", "sarc", "Целаканты", 410, 0, "ver"],
  ["lung", "sarc", "Двоякодышащие", 400, 0, "ver"],
  ["tetra", "sarc", "Четвероногие", 380, 0, "ver"],
  ["amph", "tetra", "Земноводные", 350, 0, "ver"],
  ["amn", "tetra", "Амниоты", 315, 0, "ver"],
  ["saur", "amn", "Завропсиды", 312, 0, "ver"],
  ["turt", "saur", "Черепахи", 250, 0, "ver"],
  ["squam", "saur", "Ящерицы и змеи", 240, 0, "ver"],
  ["snake", "squam", "Змеи", 150, 0, "ver"],
  ["archo", "saur", "Архозавры", 250, 0, "ver"],
  ["croc", "archo", "Крокодилы", 235, 0, "ver"],
  ["ptero", "archo", "Птерозавры", 228, 66, "ver"],
  ["dino", "archo", "Динозавры", 233, 0, "ver"],
  ["ornith", "dino", "Птицетазовые", 205, 66, "ver"],
  ["sauro", "dino", "Завроподы", 215, 66, "ver"],
  ["thero", "dino", "Тероподы", 231, 0, "ver"],
  ["tyran", "thero", "Тираннозавриды", 170, 66, "ver"],
  ["birds", "thero", "Птицы", 150, 0, "ver"],
  ["syn", "amn", "Синапсиды", 312, 0, "ver"],
  ["pelyc", "syn", "Пеликозавры", 305, 255, "ver"],
  ["mam", "syn", "Млекопитающие", 210, 0, "ver"],
  ["monot", "mam", "Однопроходные", 180, 0, "ver"],
  ["mars", "mam", "Сумчатые", 160, 0, "ver"],
  ["plac", "mam", "Плацентарные", 100, 0, "ver"],
  ["afro", "plac", "Слоны и ламантины", 95, 0, "ver"],
  ["mammo", "afro", "Мамонты", 5, .004, "ver"],
  ["rod", "plac", "Грызуны и зайцеобразные", 85, 0, "ver"],
  ["bat", "plac", "Рукокрылые", 60, 0, "ver"],
  ["carn", "plac", "Хищные", 60, 0, "ver"],
  ["ungul", "plac", "Копытные", 65, 0, "ver"],
  ["whale", "ungul", "Китообразные", 50, 0, "ver"],
  ["prim", "plac", "Приматы", 66, 0, "ver"],
  ["lemur", "prim", "Лемуры и лори", 60, 0, "ver"],
  ["nwm", "prim", "Широконосые обезьяны", 40, 0, "ver"],
  ["cat", "prim", "Узконосые обезьяны", 40, 0, "ver"],
  ["owm", "cat", "Мартышковые", 25, 0, "ver"],
  ["hom", "cat", "Человекообразные", 25, 0, "ver"],
  ["gibbon", "hom", "Гиббоны", 18, 0, "ver"],
  ["orang", "hom", "Орангутаны", 14, 0, "ver"],
  ["goril", "hom", "Гориллы", 9, 0, "ver"],
  ["pan", "hom", "Шимпанзе и бонобо", 7, 0, "ver"],
  ["hominin", "hom", "Гоминины", 7, 0, "ver"],
  ["austr", "hominin", "Австралопитеки", 4.2, 1.9, "ver"],
  ["homo", "hominin", "Род Homo", 2.8, 0, "ver"],
  ["erect", "homo", "Человек прямоходящий", 2.0, .11, "ver"],
  ["neand", "homo", "Неандертальцы", .43, .04, "ver"],
  ["deni", "homo", "Денисовцы", .4, .03, "ver"],
  ["sap", "homo", "Человек разумный", .3, 0, "ver"]
];
// наша линия — от LUCA к человеку
const TREE_ERAS = [{ t:2500, nm:"протерозой · 2,5 млрд" }, { t:541, nm:"палеозой · 541 млн" }, { t:252, nm:"мезозой · 252 млн" }, { t:66, nm:"кайнозой · 66 млн" }];
const TREE_EXT = [{ t:445, nm:"† ордовикское вымирание", ext:true }, { t:372, nm:"† девонское", ext:true }, { t:252, nm:"† пермское", ext:true }, { t:201, nm:"† триасовое", ext:true }, { t:66, nm:"† мел-палеогеновое", ext:true }];
const TREE_PATH = ["luca","arc","asg","euk","opis","ani","bil","deut","chord","vert","gnath","oste","sarc","tetra","amn","syn","mam","plac","prim","cat","hom","hominin","homo","sap"];
const TREE_GRP = { root:["Общий предок","255,226,160"], bac:["Бактерии","92,214,190"], arc:["Археи","176,146,255"], pro:["Протисты","120,200,240"],
  pla:["Растения","130,222,120"], fun:["Грибы","236,172,112"], ani:["Беспозвоночные","255,150,200"], ver:["Позвоночные","255,206,130"] };

const CHT = (() => {
  // ---- данные: дерево, веса, раскладка ----
  const NODES = TREE_ROWS.map(([id, p, nm, t0, t1, g]) => ({ id, p, nm, t0, t1, g, ch: [] }));
  const BY = {}; NODES.forEach(n => BY[n.id] = n);
  NODES.forEach(n => { if (n.p) BY[n.p].ch.push(n); });
  const PATH = new Set(TREE_PATH);
  // нелинейная шкала: архей → протерозой → палеозой → мезозой участками линейно, кайнозой — логарифмически
  const RAD = t => t >= 2500 ? .04 + (4200 - t)/1700*.16
                : t >= 541 ? .2 + (2500 - t)/1959*.2
                : t >= 252 ? .4 + (541 - t)/289*.2
                : t >= 66 ? .6 + (252 - t)/186*.18
                : .78 + .22*(1 - Math.log(1 + t)/Math.log(67));
  // угловые доли: каждый лист получает вес (бактериям и археям — больше, чтобы детальность наших ветвей
  // не выдавала себя за важность), узел — среднее по детям
  const LW = { bac:3.2, arc:3.2, pro:1.8, pla:1.4, fun:1.6, ani:1.1, ver:1, root:1 };
  const root = BY.luca;
  (function weigh(n){ n.w = n.ch.length ? n.ch.reduce((s, c) => s + weigh(c), 0) : LW[n.g]; return n.w; })(root);
  (function place(n, a0, a1){ n.a0 = a0; n.a1 = a1; let a = a0;
    for (const c of n.ch){ const span = (a1 - a0)*c.w/n.w; place(c, a, a + span); a += span; }
    n.a = n.ch.length ? (n.ch[0].a + n.ch[n.ch.length - 1].a)/2 : (a0 + a1)/2;
    n.r = RAD(n.t0); n.re = n.ch.length ? null : RAD(n.t1); })(root, 0, Math.PI*2);
  root.r = 0;
  const RS = 6;                                            // радиус древа в единицах сцены
  const P = (a, r) => [Math.cos(a)*r*RS, Math.sin(a)*r*RS];

  // ---- сцена ----
  const cvs = $("treeCv"), lab = $("treeLab"), lc = lab.getContext("2d");
  let rend = null, scn, cam, grp, ptsB, ptsN, built = false;
  let open = false, raf = 0, last = 0, W3 = 0, H3 = 0, DPR3 = 1;
  let rotY = 0, tilt = .95, dist = 16, distT = 16, tgt = new THREE.Vector3(), tgtT = new THREE.Vector3(), auto = true, sel = root, hov = null;
  const tmp = new THREE.Vector3();
  function build(){
    rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
    rend.setClearColor(0x000000, 0);
    scn = new THREE.Scene(); cam = new THREE.PerspectiveCamera(42, 1, .05, 200);
    grp = new THREE.Group(); grp.rotation.x = -Math.PI/2; scn.add(grp);
    // ветви: дуга на радиусе родителя + радиальный стебель к ребёнку; листья тянутся к краю (или к вымиранию)
    const seg = [];                                         // [x, y, z, group, path, nodeIdx]
    const step = .022;
    const addArc = (r, a0, a1, n, path) => { const L = Math.abs(a1 - a0)*r*RS, m = Math.max(2, Math.ceil(L/step));
      for (let i = 0; i <= m; i++){ const a = a0 + (a1 - a0)*i/m, [x, y] = P(a, r); seg.push([x, y, n, path]); } };
    const addRad = (a, r0, r1, n, path) => { const L = Math.abs(r1 - r0)*RS, m = Math.max(2, Math.ceil(L/step));
      for (let i = 0; i <= m; i++){ const [x, y] = P(a, r0 + (r1 - r0)*i/m); seg.push([x, y, n, path]); } };
    NODES.forEach((n, ni) => {
      n.i = ni;
      if (n.p){ const p = BY[n.p], onPath = PATH.has(n.id) && PATH.has(p.id);
        addArc(p.r, p.a, n.a, ni, onPath); addRad(n.a, p.r, n.r, ni, onPath); }
      if (!n.ch.length) addRad(n.a, n.r, n.re, ni, false);
    });
    NODES.forEach(n => { const [x, y] = P(n.a, n.r); n.pos = new THREE.Vector3(x, y, 0); });
    ptsB = pts(seg.length, (i, o) => { const [x, y, ni, path] = seg[i], n = NODES[ni];
        o.p = [x, y, (Math.random() - .5)*.05]; o.c = C(0xffffff); const rgb = (path ? "255,232,170" : TREE_GRP[n.g][1]).split(",").map(v => +v/255);
        o.c = rgb; o.s = path ? 1.35 : .8 + Math.random()*.25; o.rnd = [path ? 1 : 0, 1, ni]; },
      `float tw = 0.75 + 0.25*sin(uTime*2.0 + aSeed*40.0);
       a = (0.55 + 0.45*aRnd.x)*tw*(0.18 + 0.82*aRnd.y)*uSharp;
       s *= 0.7 + 0.5*aRnd.y;`, 1);
    ptsB.geometry.attributes.aRnd.setUsage(THREE.DynamicDrawUsage);
    ptsN = pts(NODES.length, (i, o) => { const n = NODES[i]; o.p = [n.pos.x, n.pos.y, 0];
        o.c = (PATH.has(n.id) ? "255,236,190" : TREE_GRP[n.g][1]).split(",").map(v => +v/255); o.s = n === root ? 6 : PATH.has(n.id) ? 3.2 : 2.4; o.rnd = [0, 1, i]; },
      `a = (0.6 + 0.4*sin(uTime*1.3 + aSeed*20.0))*(0.25 + 0.75*aRnd.y)*uSharp; s *= 1.0 + 0.8*aRnd.x;`, 1);
    ptsN.geometry.attributes.aRnd.setUsage(THREE.DynamicDrawUsage);
    grp.add(ptsB); grp.add(ptsN);
    // кольца эр и срезы пяти вымираний
    const ring = (t, rgb, al, dash) => { const r = RAD(t), m = Math.ceil(TAU*r*RS/.03);
      const g = pts(m, (i, o) => { const a = i/m*TAU; const [x, y] = P(a, r); o.p = [x, y, 0]; o.c = rgb; o.s = .7; o.rnd = [dash && (i % 6 < 3) ? 0 : 1, 0, 0]; },
        `a = ${al.toFixed(2)}*aRnd.x*uSharp;`, 1); grp.add(g); };
    TREE_ERAS.forEach(e => ring(e.t, [.84, .67, .37], .3, false));
    TREE_EXT.forEach(e => ring(e.t, [1, .42, .4], .85, true));
    built = true;
  }
  // ---- выделение: узел и его потомки яркие, остальное приглушено ----
  function isDesc(n, a){ while (n){ if (n === a) return true; n = n.p ? BY[n.p] : null; } return false; }
  function applyFocus(){
    const ra = ptsB.geometry.attributes.aRnd, na = ptsN.geometry.attributes.aRnd;
    const lit = NODES.map(n => sel === root || isDesc(n, sel) || isDesc(sel, n));
    for (let i = 0; i < ra.count; i++) ra.array[i*3 + 1] = lit[ra.array[i*3 + 2]] ? 1 : 0;
    for (let i = 0; i < na.count; i++){ na.array[i*3 + 1] = lit[i] ? 1 : 0; na.array[i*3] = NODES[i] === sel ? 1 : 0; }
    ra.needsUpdate = na.needsUpdate = true;
  }
  function select(n){
    sel = n; applyFocus(); auto = false;
    tgtT.copy(n === root ? new THREE.Vector3() : n.pos).applyEuler(grp.rotation);
    // чем глубже узел (ближе к краю) и мельче его ветвь — тем ближе камера
    const span = (n.a1 - n.a0);
    distT = n === root ? 16 : clamp(2.2 + span*6 + (1 - n.r)*3, 2, 13);
    card(n);
  }
  // ---- карточка (8а: родословная, даты, ветви) ----
  const ago = t => t >= 1000 ? `${String((t/1000).toFixed(t >= 10000 ? 0 : 1)).replace(".", ",")} млрд лет назад` : t >= 1 ? `${String(Math.round(t))} млн лет назад` : t > 0 ? `${Math.round(t*1000)} тыс. лет назад` : "сейчас";
  function card(n){
    const g = TREE_GRP[n.g], chain = []; for (let q = n; q; q = q.p ? BY[q.p] : null) chain.unshift(q);
    const box = $("trCard");
    box.innerHTML = `<span class="mono tm-cat" style="color:rgb(${g[1]})">${esc(g[0])}${PATH.has(n.id) ? " · наша линия" : ""}</span>
      <h3>${esc(n.nm)}${n.t1 > 0 ? " †" : ""}</h3>
      <p class="tm-ago2">${n === root ? "≈ 4,2 млрд лет назад (оценка по геномам)" : "Появились ≈ " + ago(n.t0) + (n.t1 > 0 ? " · вымерли ≈ " + ago(n.t1) : "")}</p>
      <nav class="tr-chain" aria-label="Родословная">${chain.map(q => `<button data-n="${q.id}" ${q === n ? 'aria-current="true"' : ""} data-hover>${esc(q.nm.replace(" — общий предок", ""))}</button>`).join("<i>›</i>")}</nav>`
      + (n.ch.length ? `<h4>Ветви</h4><ul class="tr-kids">${n.ch.map(c => `<li><button data-n="${c.id}" data-hover><span class="dotc" style="background:rgb(${TREE_GRP[c.g][1]})"></span>${esc(c.nm)}${c.t1 > 0 ? " †" : ""}<span class="mono">${esc(ago(c.t0))}</span></button></li>`).join("")}</ul>` : "")
      + `<p class="note">${mk("t")}<span>Даты расхождений — оценки по окаменелостям и молекулярным часам. Подробность ветвей на древе — не мера важности: основное разнообразие жизни — у бактерий и архей.</span></p>`;
    box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
    box.querySelectorAll("[data-n]").forEach(b => b.onclick = () => select(BY[b.dataset.n]));
    $("trScroll").scrollTop = 0;
  }
  // ---- ввод ----
  let drag = null, moved = 0;
  cvs.addEventListener("pointerdown", e => { drag = [e.clientX, e.clientY]; moved = 0; cvs.setPointerCapture(e.pointerId); });
  cvs.addEventListener("pointermove", e => {
    const r = cvs.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (drag){ const dx = e.clientX - drag[0], dy = e.clientY - drag[1]; moved += Math.abs(dx) + Math.abs(dy);
      rotY -= dx*.005; tilt = clamp(tilt + dy*.004, .12, 1.45); drag = [e.clientX, e.clientY]; auto = false; }
    hov = pick(x, y); cvs.style.cursor = hov ? "pointer" : drag ? "grabbing" : "grab";
  });
  cvs.addEventListener("pointerup", e => { const r = cvs.getBoundingClientRect(); if (moved < 6){ const n = pick(e.clientX - r.left, e.clientY - r.top); if (n) select(n); } drag = null; });
  cvs.addEventListener("wheel", e => { e.preventDefault(); const k = e.deltaMode === 1 ? .06 : .0016; distT = clamp(distT*Math.exp(e.deltaY*k), 2.2, 22); }, {passive:false});
  addEventListener("keydown", e => { if (!open) return; if (e.key === "Escape") close();
    if (e.key === "Backspace" && sel.p){ e.preventDefault(); select(BY[sel.p]); } });
  let scr = [];                                               // экранные координаты узлов этого кадра
  function pick(x, y){ let best = null, bd = W3 < 760 ? 22 : 14; for (const [sx, sy, n] of scr){ const d = Math.hypot(sx - x, sy - y); if (d < bd){ bd = d; best = n; } } return best; }
  function size(){ DPR3 = Math.min(2, devicePixelRatio || 1); W3 = cvs.clientWidth; H3 = cvs.clientHeight;
    rend.setPixelRatio(DPR3); rend.setSize(W3, H3, false); lab.width = W3*DPR3; lab.height = H3*DPR3;
    cam.aspect = W3/H3; cam.updateProjectionMatrix(); }
  // ---- кадр ----
  const tin = document.querySelector("#chTree .time-in");
  function frame(now){
    raf = open ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(.1, (now - last)/1000 || 0); last = now;
    if (auto) rotY += dt*.03;
    dist += (distT - dist)*Math.min(1, dt*3); tgt.lerp(tgtT, Math.min(1, dt*3));
    const port = W3 < 760, mxOn = chTree.classList.contains("tm-max");
    // центр кадра правее панели (на телефоне — выше неё): сдвигаем окно камеры
    cam.setViewOffset(W3, H3, port ? 0 : -W3*(mxOn ? .25 : .16), port ? H3*.24 : 0, W3, H3);
    const dE = dist*(port ? 1.75 : 1);                         // в портрете кадр уже — отходим дальше
    cam.position.set(tgt.x + Math.sin(rotY)*Math.cos(tilt)*dE, tgt.y + Math.sin(tilt)*dE, tgt.z + Math.cos(rotY)*Math.cos(tilt)*dE);
    cam.lookAt(tgt);
    ptsB.material.uniforms.uSharp.value = ptsN.material.uniforms.uSharp.value = 1;
    rend.render(scn, cam);
    labels(port);
  }
  // подписи: узлы на экране, без наложений; важные — первыми (выбранный, наведённый, наша линия, крупные ветви)
  function labels(port){
    const c = lc; c.setTransform(DPR3, 0, 0, DPR3, 0, 0); c.clearRect(0, 0, W3, H3);
    // затемнение под панелью — чтобы ветви не спорили с текстом
    { const pb = tin.getBoundingClientRect(), cb = cvs.getBoundingClientRect();
      if (!port){ const pr = pb.right - cb.left, gw = pr + W3*.08, g = c.createLinearGradient(0, 0, gw, 0);
        g.addColorStop(0, "rgba(5,6,12,.94)"); g.addColorStop(clamp(pr/gw, 0, 1), "rgba(5,6,12,.86)"); g.addColorStop(1, "rgba(5,6,12,0)"); c.fillStyle = g; c.fillRect(0, 0, gw, H3); }
      else { const y0 = pb.top - cb.top - 40, g = c.createLinearGradient(0, y0, 0, y0 + 40); g.addColorStop(0, "rgba(5,6,12,0)"); g.addColorStop(1, "rgba(5,6,12,.93)"); c.fillStyle = g; c.fillRect(0, y0, W3, H3 - y0); } }
    scr = []; const L = [];
    grp.updateMatrixWorld();
    for (const n of NODES){
      tmp.copy(n.pos).applyMatrix4(grp.matrixWorld).project(cam);
      if (tmp.z > 1) continue;
      const x = (tmp.x + 1)/2*W3, y = (1 - tmp.y)/2*H3;
      if (x < -20 || x > W3 + 20 || y < -20 || y > H3 + 20) continue;
      scr.push([x, y, n]);
      const lit = sel === root || isDesc(n, sel) || isDesc(sel, n);
      const pri = n === hov ? 5 : n === sel ? 4 : !lit ? -1 : (sel !== root && BY[n.p] === sel) ? 3 : PATH.has(n.id) ? 2 : (n.a1 - n.a0) > .35 ? 1 : 0;
      if (pri < 0 || (port && pri < 3)) continue;
      L.push({ n, x, y, pri });
    }
    // ещё и эры со срезами: подписи у верхнего края кольца
    L.sort((a, b) => b.pri - a.pri);
    const placed = [], pb = tin.getBoundingClientRect(), cb = cvs.getBoundingClientRect();
    placed.push({ x0: pb.left - cb.left - 8, x1: pb.right - cb.left + 12, y0: pb.top - cb.top - 8, y1: pb.bottom - cb.top + 8 });
    const hit = b => b.x0 < 4 || b.x1 > W3 - 4 || b.y0 < 4 || b.y1 > H3 - 4 || placed.some(q => b.x0 < q.x1 + 3 && b.x1 > q.x0 - 3 && b.y0 < q.y1 + 3 && b.y1 > q.y0 - 3);
    for (const l of L){
      const fs = l.pri >= 4 ? (port ? 14 : 16) : port ? 12 : 13.5; c.font = `400 ${fs}px Forum, Georgia, serif`;
      const t = l.n.nm.replace(" — общий предок", "") + (l.n.t1 > 0 ? " †" : ""), w = c.measureText(t).width, h = fs + 2;
      let best = null;
      for (const [dx, dy] of [[10, 0], [-10 - w, 0], [-w/2, -14], [-w/2, 14], [10, -14], [10, 14], [-10 - w, -14], [-10 - w, 14]]){
        const b = { x0: l.x + dx, x1: l.x + dx + w, y0: l.y + dy - h/2, y1: l.y + dy + h/2 }; if (!hit(b)){ best = b; break; } }
      if (!best && l.pri >= 4){ const x0 = clamp(l.x + 10, 6, W3 - 6 - w); best = { x0, x1: x0 + w, y0: l.y - h/2, y1: l.y + h/2 }; }
      if (!best) continue;
      placed.push(best);
      const rgb = l.pri >= 4 ? "255,240,210" : PATH.has(l.n.id) ? "255,226,160" : TREE_GRP[l.n.g][1];
      c.fillStyle = `rgba(5,6,12,.55)`; c.fillRect(best.x0 - 3, best.y0, best.x1 - best.x0 + 6, h);
      c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = `rgba(${rgb},${l.pri >= 1 ? .95 : .75})`;
      c.fillText(t, best.x0, (best.y0 + best.y1)/2);
    }
    // подписи колец: эры и вымирания — на дальней стороне кольца, если там свободно
    c.font = `500 ${port ? 9 : 10}px "JetBrains Mono", monospace`;
    for (const e of [...TREE_ERAS, ...TREE_EXT]){
      tmp.set(0, RAD(e.t)*RS, 0).applyMatrix4(grp.matrixWorld).project(cam);   // точка кольца на «12 часов» в плоскости древа
      const x = (tmp.x + 1)/2*W3, y = (1 - tmp.y)/2*H3, w = c.measureText(e.nm).width;
      const b = { x0: x - w/2, x1: x + w/2, y0: y - 7, y1: y + 7 }; if (tmp.z > 1 || hit(b)) continue; placed.push(b);
      c.textAlign = "center"; c.fillStyle = e.ext ? "rgba(255,140,130,.85)" : "rgba(214,172,94,.75)"; c.fillText(e.nm.toUpperCase(), x, y);
    }
  }
  function openT(){ if (open) return; if (!built) build(); open = treeOn = true; size(); applyFocus(); card(sel); if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); } }
  function close(){ if (!open) return; open = treeOn = false; chTree.classList.remove("open"); chTree.setAttribute("aria-hidden", "true"); $("btnTree").setAttribute("aria-pressed", "false"); }
  addEventListener("resize", () => { if (open) size(); });
  const mxb = $("trMax");
  mxb.onclick = () => { const on = !chTree.classList.contains("tm-max"); chTree.classList.toggle("tm-max", on); mxb.setAttribute("aria-pressed", String(on)); mxb.textContent = on ? "⤡ Древо" : "⤢ Читать"; };
  $("trHome").onclick = () => { select(root); distT = 16; tilt = .95; auto = true; };
  return { open: openT, close, get on(){ return open; }, select: id => BY[id] && select(BY[id]), nodes: NODES, dbg: { sel: () => sel.id, n: NODES.length } };
})();
const chTree = $("chTree");
function openTree(id){ closeHuman(); closePath(); closeRef(); closeTime(); toggleMenu(false); surface(); chTree.classList.add("open"); chTree.setAttribute("aria-hidden", "false"); $("btnTree").setAttribute("aria-pressed", "true"); CHT.open(); if (id) CHT.select(id); $("treeClose").focus({preventScroll:true}); }
function closeTree(){ CHT.close(); }
$("btnTree").onclick = () => CHT.on ? closeTree() : openTree();
$("treeClose").onclick = closeTree;
$("mTree").onclick = () => openTree();
