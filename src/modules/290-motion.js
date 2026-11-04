/* ---------- движение: 14 остановок (12 станций + 2 перехода) ---------- */
// остановки: 0–6 станции I–VII, 7 портал «Вовнутрь», 8–12 станции VIII–XII, 13 портал «Уроборос»
const stopOf = m => m <= 6 ? {st:m} : m === 7 ? {po:0} : m <= 12 ? {st:m-1} : {po:1};
const uOfStation = i => i <= 6 ? i : i + 1;
function ringS(u){ const cyc = Math.floor(u/14), m = u - cyc*14; let s;
  if (m <= 6) s = m; else if (m <= 8) s = 6 + (m-6)/2; else if (m <= 12) s = m - 1; else s = 11 + (m-12)/2;
  return cyc*12 + s; }
const bell = (x, c) => smooth(c - .85, c - .25, x)*(1 - smooth(c + .25, c + .85, x));

let target = -1, pos = -1, vel = 0, lastInput = 0, travel = false;
let coverT = 0, timeOn = false, treeOn = false, thoughtOn = false, compassOn = false, mineOn = false, dimsOn = false, bioOn = false, flyOn = false, atlOn = false;                                   // открыт «Космический календарь» (chrono.js)
const locked = () => timeOn || treeOn || thoughtOn || compassOn || mineOn || dimsOn || bioOn || flyOn || atlOn || menuOpen || humanOpen || pathOpen || insideOpen || diveT > .02 || IZ.active || !!bhDv;
function goTo(i){
  const u = uOfStation(i);
  if (pos < -.5) target = u;
  else { const r = Math.round(pos), d0 = mod(u - mod(r, 14), 14), d = d0 > 7 ? d0 - 14 : d0; target = r + d; }
  travel = true; lastInput = performance.now();
}
function nudge(d){ lastInput = performance.now(); travel = false; target = Math.max(-1, target + d); }
addEventListener("wheel", e => { if (locked()) return; e.preventDefault(); const k = e.deltaMode === 1 ? .04 : .0011; nudge(clamp(e.deltaY*k, -.6, .6)); }, {passive:false});
let ty = null;
addEventListener("touchstart", e => { if (locked()) return; ty = e.touches[0].clientY; }, {passive:true});
addEventListener("touchmove", e => { if (ty === null || locked()) return; const y = e.touches[0].clientY; nudge((ty - y)*.0042); ty = y; }, {passive:true});
addEventListener("touchend", () => { ty = null; });
addEventListener("keydown", e => {
  if (IZ.active || bhDv) return;                        // в Изнанке клавиатурой правит она сама (Esc — выход)
  if (e.key === "Escape"){ surface(); toggleMenu(false); closeChapters(); return; }
  if (humanOpen && !menuOpen && !(e.target.closest && e.target.closest("textarea"))){
    if (["ArrowDown","PageDown"].includes(e.key)){ e.preventDefault(); depthT = clamp(Math.round(depthT) + 1, -1, DMAX); lastDepthInput = performance.now(); return; }
    if (["ArrowUp","PageUp"].includes(e.key)){ e.preventDefault(); depthT = clamp(Math.round(depthT) - 1, -1, DMAX); lastDepthInput = performance.now(); return; }
  }
  if (locked()) return;
  const r = Math.round(target);
  if (["ArrowDown","ArrowRight","PageDown"].includes(e.key) || (e.key === " " && e.target === document.body)){ e.preventDefault(); target = target < -.5 ? 0 : r + 1; travel = true; lastInput = performance.now(); }
  if (["ArrowUp","ArrowLeft","PageUp"].includes(e.key)){ e.preventDefault(); target = Math.max(-1, r - 1); travel = true; lastInput = performance.now(); }
  if (e.key === "Home"){ target = -1; travel = true; }
});
$("begin").onclick = () => goTo(0);

const P = { pos:new THREE.Vector3(), tgt:new THREE.Vector3(), up:new THREE.Vector3() };
const OV = { pos:new THREE.Vector3(0, 122, .001), tgt:new THREE.Vector3(0,0,0), up:new THREE.Vector3(0,0,-1) };
const S0 = { pos:new THREE.Vector3(), tgt:new THREE.Vector3(), up:new THREE.Vector3(0,1,0) };
const HP = { pos:new THREE.Vector3(), tgt:new THREE.Vector3() };
let zAstro = 1;  // прозрачность астролябии: гаснет на пролёте (см. zoomTick)
let gSway = 0;   // боковое покачивание камеры в режиме станции; на полёте застывает (см. zoomTick)
function stationPose(s, o){ const th = s/N*TAU; o.pos.set(Math.sin(th)*RC, 4.3, -Math.cos(th)*RC); o.tgt.set(Math.sin(th)*R, 3.0, -Math.cos(th)*R); o.up.set(0,1,0); }
const right = new THREE.Vector3(), camUp = new THREE.Vector3(), fwd = new THREE.Vector3(), nIn = new THREE.Vector3();
const fitV = new THREE.Vector3();
// Во сколько раз уменьшить объект станции, чтобы он целиком попал в кадр. Центр объекта проецируем
// по-настоящему — это разом учитывает и сдвиг кадра (setViewOffset), и портретную раскладку, и параллакс,
// а габарит берём измеренный (SEXT). Аналитическая оценка тут не работает по той же причине, что и с
// орбитами Нептуна: перспектива на наклонённой к камере сцене растягивает ближнюю половину.
// Возвращает максимально допустимый inner.scale, при котором объект целиком помещается в кадр.
function stationFit(i){
  const e = typeof SEXT[i] === "function" ? SEXT[i]() : SEXT[i]; if (!e) return 99;
  const st = stations[i];
  const dist = camera.position.distanceTo(st.g.position);
  const hy = dist*Math.tan(fov*Math.PI/360), hx = hy*(W/H);
  fitV.copy(st.g.position).project(camera);
  // В портрете раскладка другая: объект живёт над текстовой панелью, сверху от него ничего нет,
  // а слева и справа он ничем не закрыт — иначе он вышел бы вдвое мельче, чем позволяет экран.
  const port = W < 760;
  const ky = (port ? Math.min(.99 - fitV.y, fitV.y - .10) : Math.min(FIT_Y - fitV.y, FIT_Y + fitV.y))*hy/e[1];
  const kx = (port ? Math.min(.97 - fitV.x, .97 + fitV.x) : Math.min(FIT_R - fitV.x, FIT_L + fitV.x))*hx/e[0];
  return Math.max(.1, Math.min(kx, ky));
}
let px = 0, py = 0, roll = 0, fov = 48, W = 0, H = 0, fy = 0, lastStop = -99;
function resize(){
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false); if (composer) composer.setSize(W, H);
  camera.aspect = W/H; camera.updateProjectionMatrix(); tcam.aspect = W/H; tcam.updateProjectionMatrix(); mcam.aspect = W/H; mcam.updateProjectionMatrix();
  bgMat.uniforms.uAspect.value = W/H;
}
addEventListener("resize", resize); resize();
const tintNow = new THREE.Color(TINT[0]);

