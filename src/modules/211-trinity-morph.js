/* ---------- v173: «Триединство ↔ Первоимпульс» без вспышки ----------
   Вперёд: подмена станции почти сразу (0,2 с), но экран ещё целиком закрыт треугольником Абсолюта. Частицы узла
   станции II в этот момент лежат на гранях треугольника — ровно там же, где он нарисован на экране (вершины
   переводятся из пикселей в плоскость узла лучом из камеры). Треугольник Абсолюта и его серый фон гаснут,
   под ними остаётся тот же треугольник из частиц, и он раскрывается в узел: три петли вытягиваются из трёх углов,
   угловые узлы стекаются в три искры. Назад — то же в обратном порядке, подмена — когда треугольник уже собран
   и Абсолют проявился поверх. */
const G1TRI = { m:0, a:0, v:[new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] };
const G1RC = new THREE.Raycaster(), G1PL = new THREE.Plane(), G1N = new THREE.Vector3(), G1O = new THREE.Vector3(), G1Q = new THREE.Quaternion(), G1HIT = new THREE.Vector3();
function g1TriSync(){
  G1TRI.m = 0; G1TRI.a = 0;
  if (!tr || !tr.tri || typeof ABS === "undefined") return;
  if (tr.dir > 0){ const u = Math.max(0, tr.t - .2); G1TRI.m = tr.jumped ? 1 - smooth(.8, 2.75, u) : 1; G1TRI.a = tr.jumped ? 1 - smooth(.08, 1.0, u) : 1; }
  else { G1TRI.m = tr.jumped ? 0 : smooth(.05, 1.3, tr.t); G1TRI.a = tr.jumped ? 0 : smooth(1.05, 1.8, tr.t); }
  if (G1TRI.m <= 0) return;
  const inner = stations[1].inner, px = ABS.triPx();
  inner.updateWorldMatrix(true, false); inner.getWorldPosition(G1O); inner.getWorldQuaternion(G1Q);
  G1N.set(0, 0, 1).applyQuaternion(G1Q); G1PL.setFromNormalAndCoplanarPoint(G1N, G1O);
  const pv = px.map(([x, y]) => { G1RC.setFromCamera({ x: x/W*2 - 1, y: 1 - y/H*2 }, camera); return G1RC.ray.intersectPlane(G1PL, G1HIT) ? inner.worldToLocal(G1HIT.clone()) : null; });
  if (pv.some(v => !v)) return;
  // первая вершина — ближайшая к оси x узла (там его первая петля), остальные — против часовой стрелки
  const ang = v => Math.atan2(v.y, v.x), TA = 2*Math.PI;
  let i0 = 0; pv.forEach((v, i) => { if (Math.abs(ang(v)) < Math.abs(ang(pv[i0]))) i0 = i; });
  const a0 = ang(pv[i0]), rest = pv.filter((_, i) => i !== i0).sort((p, q) => ((ang(p) - a0 + TA) % TA) - ((ang(q) - a0 + TA) % TA));
  G1TRI.v[0].copy(pv[i0]); G1TRI.v[1].copy(rest[0]); G1TRI.v[2].copy(rest[1]);
}
