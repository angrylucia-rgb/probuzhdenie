/* ---------- 12 станций ---------- */
// ===== Ланиакея: данные облака (черновик — Qwen по ТЗ; узлы, рёбра, нити и поток переписаны на ревью) =====
// Координаты в единицах слоя: Местная группа в начале координат, Млечный Путь ровно в [0,0,0]
// (его рисует сама галактика станции IV — крошечной, издали), всё остальное — вокруг.
function buildLaniaData(Q){
  const GA = [4.4, -1.7, -2.6];
  const add3 = (a, b, k) => [a[0] + b[0]*k, a[1] + b[1]*k, a[2] + b[2]*k];
  const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const NODES = [
    { p:[-3.6, 1.5, 0.6], r:.34, n:520 },     // скопление Девы
    { p:GA, r:.48, n:760 },                    // Великий аттрактор
    { p:[1.9, -3.3, 1.4], r:.22, n:220 }       // скопление Печи
  ];
  // малые узлы — по всему объёму, а не по одной оболочке (на оболочке паутина читалась контуром);
  // ближе 2,4 к Местной группе узлов нет — вокруг неё в реальности тоже разреженный Местный лист
  // и в проекции на экран (плоскость xy — слой стоит к зрителю лицом) узлы не заходят за Местную
  // группу: иначе дальние скопления ложились бы ровно позади Млечного Пути и прятали его
  for (let k = 0; k < 26; k++){
    const f = fib(k, 26); let p;
    do { const R = 2.4 + 4.2*Math.random(); p = [f[0]*R + rn()*.4, f[1]*R + rn()*.4, f[2]*R + rn()*.4]; }
    while (Math.hypot(p[0], p[1]) < 1.8);
    NODES.push({ p, r:.1 + .1*Math.random(), n:70 });
  }
  const O = { p:[0, 0, 0] };                     // Местная группа — виртуальный узел, частиц у него нет
  // рёбра: каждый узел — к двум ближайшим; плюс Местный лист → Дева → Аттрактор и Печь → Аттрактор
  const E = [], seen = new Set();
  const edge = (a, b) => { const k = a < b ? a + "-" + b : b + "-" + a; if (a !== b && !seen.has(k)){ seen.add(k); E.push([a, b]); } };
  const P = i => i < 0 ? O.p : NODES[i].p;
  NODES.forEach((nd, i) => NODES.map((m, j) => [j, dist3(nd.p, m.p)]).filter(x => x[0] !== i)
    .sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(x => edge(i, x[0])));
  edge(-1, 0); edge(0, 1); edge(2, 1);
  // каждое ребро — квадратичная кривая Безье с контрольной точкой, отведённой от середины
  const curves = E.map(([a, b]) => {
    const A = P(a), B = P(b), len = dist3(A, B), off = dir();
    return { A, B, len, M:add3([(A[0] + B[0])/2, (A[1] + B[1])/2, (A[2] + B[2])/2], off, len*.18) };
  });
  const onCurve = (cv, u) => {
    const a = (1 - u)*(1 - u), b = 2*u*(1 - u), c = u*u;
    const p = [a*cv.A[0] + b*cv.M[0] + c*cv.B[0], a*cv.A[1] + b*cv.M[1] + c*cv.B[1], a*cv.A[2] + b*cv.M[2] + c*cv.B[2]];
    return add3(p, dir(), Math.abs(gauss())*.09*(.6 + 3.2*u*(1 - u)));   // нить толще к середине
  };

  const web = [];
  for (const nd of NODES) for (let i = 0; i < Math.round(nd.n*Q); i++)
    web.push({ p:[nd.p[0] + gauss()*nd.r*.6, nd.p[1] + gauss()*nd.r*.6, nd.p[2] + gauss()*nd.r*.6],
               c:mixc(C(0xfff1d8), C(0xc8d4ff), Math.random()*.6), s:.7 + Math.random(), rnd:[1, rn(), rn()] });
  for (const cv of curves) for (let i = 0, n = Math.round(150*Q*cv.len/3); i < n; i++)
    web.push({ p:onCurve(cv, Math.random()), c:mixc(C(0x8fb0ff), C(0xf4f0ff), Math.random()),
               s:.45 + Math.random()*.75, rnd:[.35 + .4*Math.random(), rn(), rn()] });
  // стены: между узлом и двумя его соседями — слабое «полотно» галактик, из-за него сеть читается
  // объёмной, а пустоты между стенами — настоящими пустотами
  for (let i = 0; i < NODES.length; i++){
    const nb = NODES.map((m, j) => [j, dist3(NODES[i].p, m.p)]).filter(x => x[0] !== i).sort((a, b) => a[1] - b[1]);
    const A = NODES[i].p, B = NODES[nb[0][0]].p, Cc = NODES[nb[1][0]].p;
    for (let k = 0; k < Math.round(70*Q); k++){
      let u = Math.random(), v = Math.random(); if (u + v > 1){ u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;
      web.push({ p:add3([A[0]*w + B[0]*u + Cc[0]*v, A[1]*w + B[1]*u + Cc[1]*v, A[2]*w + B[2]*u + Cc[2]*v], dir(), .06*Math.random()),
                 c:mixc(C(0x7f96d8), C(0xcfd8ff), Math.random()), s:.35 + .4*Math.random(), rnd:[.16, rn(), rn()] });
    }
  }
  for (let i = 0; i < Math.round(900*Q); i++)
    web.push({ p:add3([0, 0, 0], dir(), 6.5*Math.cbrt(Math.random())), c:mixc(C(0x7f96d8), C(0xdfe6ff), Math.random()),
               s:.3 + .4*Math.random(), rnd:[.12, rn(), rn()] });

  // поток: точки на нитях, каждая со своим направлением к Великому аттрактору (длина сноса 0,7)
  const flow = [];
  for (let i = 0; i < Math.round(1600*Q); i++){
    const p = onCurve(curves[Math.floor(Math.random()*curves.length)], Math.random());
    const d = [GA[0] - p[0], GA[1] - p[1], GA[2] - p[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
    flow.push({ p, s:1.1 + Math.random()*.7, seed:Math.random(), rnd:[d[0]/L*.7, d[1]/L*.7, d[2]/L*.7] });
  }

  const lg = [];
  const Bc = [.68, .15, -.28];
  for (let i = 0; i < Math.round(70*Q); i++)
    lg.push({ p:[Bc[0] + gauss()*.75, Bc[1] + gauss()*.45, Bc[2] + gauss()*.6], c:mixc(C(0xd8e0ff), C(0xffe9c8), Math.random()),
              s:.5 + Math.random()*.7, rnd:[0, rn(), rn()] });
  const clump = (c0, sg, n) => { for (let i = 0; i < Math.round(n*Q); i++)
    lg.push({ p:[c0[0] + gauss()*sg, c0[1] + gauss()*sg, c0[2] + gauss()*sg], c:C(0xe6ecff), s:.5 + Math.random()*.5, rnd:[0, rn(), rn()] }); };
  clump([.42, -.2, .16], .05, 90);    // Большое Магелланово облако
  clump([.5, -.33, .05], .035, 55);   // Малое Магелланово облако

  const disc = (n, R, pw, core) => { const a = [];
    for (let i = 0; i < Math.round(n*Q); i++){
      const r = R*.05 + Math.pow(Math.random(), pw)*R, arm = Math.random() < .5 ? 0 : 1;
      const ang = arm*Math.PI + 2.2*Math.log(r + .08) + gauss()*.35;
      a.push({ p:[Math.cos(ang)*r, gauss()*.012, Math.sin(ang)*r],
               c:r < core ? C(0xffe0b0) : mixc(C(0xf6f2ff), C(0x9fb8ff), Math.min(1, (r - core)/(R*.7))),
               s:.35 + Math.random()*.6, rnd:[r, rn(), rn()] });
    }
    return a; };
  return { web, flow, lg, m31:disc(1100, .5, 1.6, .1), m33:disc(260, .15, 1.5, .03), GA, VIRGO:NODES[0].p };
}
const fromRec = (a, chunk, size) => pts(a.length, (i, o) => { const r = a[i]; o.p = r.p; o.c = r.c; o.s = r.s; o.rnd = r.rnd; }, chunk, size);
