// «Изнанка» внутри Астролябии. Своё полотно WebGL2 поверх всей страницы и свой цикл кадров;
// создаётся при первом входе, между входами спит. Логика кадра — та же, что в самостоятельной v3 (main.js):
// ввод → разрыв реальности → сердце мира → звук и свет. Выход — двойное касание или Esc.
let canvas = null, hint = null, exitBtn = null, dimsBtn = null, vis = null, input = null, unbind = null, running = false, raf = 0, onExit = null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage = null; try { storage = localStorage; } catch (e) { /* нет хранилища */ }
const ws = createWorldState();
const director = createRuptureDirector({ reducedMotion: reduced });
const journey = createJourney(storage);
const audio = createAudioEngine();
let entered = false, fade = 0, fadeTarget = 1, intro = 1, seed = Math.random(), shown = 0;
let pulse = 0, flashes = [], timeA = 0, timeB = 0, arrivedAt = 0, closing = 0;
// время шейдера отсчитывается от входа, а не от загрузки страницы: при вкладке, открытой сутками, большое uTime
// съедало точность float в шуме плазмы — Изнанка чернела, хотя звук и отклик на курсор работали
let tBase = 0, lostAt = 0;
// курсор Изнанки: кольцо с заполнением при удержании и тихая подсказка
let izcur = null, izring = null, izlab = null, cx = -100, cy = -100, px = -100, py = -100, hasPtr = false, ptrT = 0, holdArc = 0, labA = 0, crossings = 0, overUi = false, labW = 0;
const coarse = matchMedia('(pointer: coarse)').matches;
const onPtr = (e) => { px = e.clientX; py = e.clientY; ptrT = performance.now() / 1000; if (!hasPtr) { cx = px; cy = py; } hasPtr = e.pointerType !== 'touch'; overUi = !!(e.target && e.target.closest && e.target.closest('.izexit,.izdims')); };
let micro = [0, 0, 0, 0], nextMicro = 20, flareReq = false, primed = false;
audio.onFlare(() => { flareReq = true; });
const ptrP = (x, y) => [(x - 0.5) * innerWidth / Math.min(innerWidth, innerHeight), (0.5 - y) * innerHeight / Math.min(innerWidth, innerHeight)];
function foldAmount(g) {
  return { call: 0.3 * g.p, crack: 0.3 + 0.7 * g.p, rift: 1, reassembly: 1 - g.p, settle: 0, idle: 0 }[g.phase];
}
function shake(t, g) {
  const a = (0.0035 + 0.007 * foldAmount(g) + 0.004 * pulse) * (reduced ? 0.2 : 1);
  const n = (f, ph) => Math.sin(t * f + ph);
  return [
    a * (n(13.1, 0) + 0.6 * n(23.7, 1.3) + 0.4 * n(7.3, 2.1)) / 2 + 0.006 * n(0.7, 0.4),
    a * (n(11.3, 0.7) + 0.6 * n(19.9, 2.4) + 0.4 * n(5.9, 0.2)) / 2 + 0.005 * n(0.53, 1.9),
    a * 0.6 * (n(9.7, 0.3) + 0.5 * n(17.1, 1.1)),
  ];
}
const ZERO8 = new Float32Array(8), ZERO3 = new Float32Array(3);
function applyWorld(id) { const s = WORLDS[id].state; ws.setTarget({ energy: s.energy, density: s.density, dispersion: s.dispersion }); }
applyWorld(HUB);

function mount() {
  if (canvas) return true;
  canvas = document.createElement('canvas');
  canvas.className = 'izc'; canvas.setAttribute('aria-label', 'Изнанка');
  hint = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  hint.setAttribute('class', 'izhint'); hint.setAttribute('viewBox', '0 0 24 24'); hint.setAttribute('aria-hidden', 'true');
  hint.innerHTML = '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>';
  // ненавязчивый выход в углу: двойное касание и Esc не всем очевидны (а на мобильном Esc и вовсе нет)
  exitBtn = document.createElement('button');
  exitBtn.type = 'button'; exitBtn.className = 'izexit'; exitBtn.setAttribute('aria-label', 'Выйти из Изнанки');
  exitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  exitBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  // ступени выше нашего мира — отсюда, из «Изнанки», вход в «Лестницу измерений» (4D–6D)
  dimsBtn = document.createElement('button');
  dimsBtn.type = 'button'; dimsBtn.className = 'izdims'; dimsBtn.textContent = '4D · 5D · 6D →'; dimsBtn.setAttribute('aria-label', 'Высшие измерения: Лестница измерений');
  dimsBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); setTimeout(() => { try { openDims(4); } catch (er) {} }, 1300); });
  izcur = document.createElement('div'); izcur.className = 'izcur'; izcur.setAttribute('aria-hidden', 'true');
  izcur.innerHTML = '<svg viewBox="0 0 40 40" width="40" height="40"><circle class="r0" cx="20" cy="20" r="14"/><circle class="r1" cx="20" cy="20" r="14" pathLength="100" stroke-dasharray="0 100"/><circle class="c" cx="20" cy="20" r="1.6"/></svg>';
  izlab = document.createElement('div'); izlab.className = 'izlab' + (coarse ? ' tc' : ''); izlab.setAttribute('aria-live', 'polite');
  izring = izcur.querySelector('.r1');
  document.body.append(canvas, hint, exitBtn, dimsBtn, izcur, izlab);
  try { vis = createVisualEngine(canvas); } catch (e) { vis = null; }
  input = createInputTracker({ stillnessSec: 240 });
  canvas.addEventListener('pointerdown', enter);
  return !!vis;
}
// контекст WebGL потерян и браузер его не вернул (сон ноутбука, сброс драйвера, переключение видеокарты) —
// заводим новое полотно вместо того, чтобы ждать восстановления, которого может не быть
function rebuild() {
  const old = canvas, nc = document.createElement('canvas');
  nc.className = old.className; nc.setAttribute('aria-label', 'Изнанка'); nc.style.cssText = old.style.cssText; nc.style.transition = 'none';
  old.replaceWith(nc); canvas = nc;
  if (vis) vis.dispose();
  try { vis = createVisualEngine(canvas); } catch (e) { vis = null; }
  canvas.addEventListener('pointerdown', enter);
  if (unbind) { unbind(); unbind = bindInput(canvas, input, close); }
  lostAt = 0;
}
async function enter() {
  if (entered) return;
  entered = true; hint.classList.add('gone');
  try { await audio.start(); audio.fadeIn(); } catch (e) { /* без звука */ }
}
// звук можно завести только внутри жеста пользователя — поэтому Астролябия зовёт prime() прямо в клике,
// за несколько секунд до того, как Изнанка покажется. Контекст создаётся молча: голосов ещё нет
function prime() { if (primed) return; primed = true; audio.start().catch(() => { primed = false; }); }
function allowFlash(t) { flashes = flashes.filter((x) => t - x < 1); if (flashes.length >= 3) return false; flashes.push(t); return true; }

function open(opts = {}) {
  if (running) return;
  if (!mount()) { if (opts.onExit) opts.onExit(); return; }
  onExit = opts.onExit || null;
  running = true; closing = 0; fade = 0; fadeTarget = 1; shown = 0; tBase = performance.now() / 1000 - 3; lostAt = 0;
  if (vis && vis.lost) rebuild();
  vis?.reset();
  izcur.style.display = coarse ? 'none' : 'block'; izlab.style.display = 'block'; izlab.style.opacity = '0'; labA = 0; holdArc = 0;
  window.addEventListener('pointermove', onPtr, true); window.addEventListener('pointerdown', onPtr, true);
  // из-за горизонта приходим в полную темноту — полотно сразу непрозрачно, плазма проявляется из черноты;
  // из меню полотно само наплывает поверх Астролябии
  canvas.style.transition = opts.fromBlack ? 'none' : 'opacity 1.2s ease';
  canvas.style.display = 'block'; hint.style.display = 'block'; exitBtn.style.display = 'flex'; dimsBtn.style.display = 'block';
  if (opts.fromBlack) canvas.style.opacity = '1'; else requestAnimationFrame(() => { canvas.style.opacity = '1'; });
  unbind = bindInput(canvas, input, close);
  entered = false; intro = 1; hint.classList.remove('gone');
  if (primed) enter();
  let last = performance.now() / 1000;
  const frame = () => {
    if (!running) return;
    const t = performance.now() / 1000, dt = Math.min(0.1, t - last); last = t;
    step(t, dt);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}
function close() {
  if (!running || closing) return;
  closing = 1; fadeTarget = 0; audio.fadeOut();
  setTimeout(() => {
    // Астролябия возвращается под полотном, пока оно гаснет: так выход читается как всплытие, а не как смена страницы
    if (onExit) onExit();
    canvas.style.transition = 'opacity 1.1s ease'; canvas.style.opacity = '0';
    setTimeout(() => { running = false; cancelAnimationFrame(raf); canvas.style.display = 'none'; hint.style.display = 'none'; exitBtn.style.display = 'none'; dimsBtn.style.display = 'none'; izcur.style.display = 'none'; izlab.style.display = 'none'; window.removeEventListener('pointermove', onPtr, true); window.removeEventListener('pointerdown', onPtr, true); audio.suspend(); if (unbind) unbind(); unbind = null; }, 1150);
  }, 1500);
}
document.addEventListener('visibilitychange', () => { if (!running) return; document.hidden ? audio.suspend() : audio.resume(); });

function step(t, dt) {
  const inp = input.update(t);
  const cur = director.state.from;
  if (entered) {
    const idle = ['idle', 'settle'].includes(director.state.phase);
    if (idle && (inp.holding || inp.autoTrigger)) {
      const angle = Math.atan2(inp.y - 0.5, (inp.x - 0.5) * innerWidth / innerHeight);
      if (director.begin(journey.next(cur, angle), { auto: inp.autoTrigger })) seed = Math.random();
    }
    // после первого круга свободные (в т.ч. процедурные) миры тоже мягко отпускают в Изнанку при бездействии
    if ((cur === 'light' || journey.completed) && idle && t - arrivedAt > 30) director.begin(HUB, { auto: true });
  }
  const g = director.update(dt, inp.holding);
  if (g.event === 'rift') { audio.rift(); applyWorld(g.to); timeB = 0; }
  if (g.event === 'arrived') { journey.arrive(g.to); arrivedAt = t; timeA = timeB; if (!inp.autoTrigger) crossings++; }
  if (g.event === 'cancelled') applyWorld(g.from);
  ws.set({ tear: g.tear });
  ws.update(dt, t);
  const a = audio.update(ws.current, g, t, dt);
  if (entered && g.phase === 'idle' && cur !== HUB && t > nextMicro && micro[3] === 0) micro = [(Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 1.1, 0, 1];
  if (micro[3] > 0) { micro[2] += dt / 4; if (micro[2] >= 1) { micro = [0, 0, 0, 0]; nextMicro = t + 25 + Math.random() * 35; } }
  if (flareReq && allowFlash(t)) pulse = 1;
  flareReq = false;
  pulse *= Math.exp(-dt / 0.35);
  intro += ((entered ? 0 : 1) - intro) * Math.min(1, dt * 1.5);
  // проявление из черноты медленнее, чем в самостоятельной версии: глаз только что был в полной темноте
  fade += (fadeTarget - fade) * Math.min(1, dt * (fadeTarget > fade ? 0.55 : 1.2));
  shown = Math.min(1, shown + dt / 2.5);
  timeA += dt; timeB += dt;
  const A = g.from, B = g.to || g.from, s = ws.current;
  // индекс для рукописного world(id,...) в шейдере: у сгенерированных миров своего case нет —
  // 1 просто помечает «не Изнанка», реальный выбор идёт через uGen/uFamily ниже
  const wIdx = (id) => (id === HUB ? 0 : (WORLDS[id].idx ?? 1));
  // ровно один из A/B — не Изнанка (переход всегда идёт через хаб): это и есть «активный» мир кадра
  const activeId = A !== HUB ? A : (B !== HUB ? B : null);
  const activeW = activeId ? WORLDS[activeId] : null;
  const isGen = !!(activeW && activeW.gen);
  if (vis && vis.lost) { if (!lostAt) lostAt = t; else if (t - lostAt > 2) rebuild(); }
  cursorFx(t, dt, inp, g, cur);
  const T = (t - tBase) % 2400;
  vis?.render({
    uTime: T, uTimeA: timeA, uTimeB: timeB, uSeed: seed,
    uShake: shake(T, g),
    uFold: foldAmount(g) * (reduced ? 0.4 : 1) + 0.6 * (1 - shown) * (reduced ? 0.3 : 1), uMicro: micro,
    uA: wIdx(A), uB: wIdx(B), uMix: g.to ? g.mix : 0,
    uGen: isGen ? 1 : 0, uFamily: isGen ? activeW.family : 0,
    uP: isGen ? activeW.params : ZERO8, uColA: isGen ? activeW.colA : ZERO3, uColB: isGen ? activeW.colB : ZERO3,
    uBreath: s.breath, uEnergy: s.energy, uDensity: s.density, uDisp: s.dispersion,
    uLow: a.low, uMid: a.mid, uHigh: a.high, uPulse: pulse,
    uHold: Math.min(1, inp.holdTime / 2), uStill: Math.min(1, inp.stillFor / 25),
    uPtr: ptrP(inp.x, inp.y),
    uTrail: WORLDS[g.mix > 0.5 && g.to ? g.to : g.from].trail, uIntro: intro,
    uExposure: 1, uFade: fade,
  }, dt);
}
function cursorFx(t, dt, inp, g, cur) {
  const k = Math.min(1, dt * 18); cx += (px - cx) * k; cy += (py - cy) * k;
  const idle = ['idle', 'settle'].includes(g.phase);
  // кольцо заполняется, пока держат; во время разрыва остаётся полным и гаснет после прибытия
  const want = inp.down && entered ? Math.min(1, inp.holdTime / 2.2) : (!idle ? 1 : 0);
  holdArc += (want - holdArc) * Math.min(1, dt * (want > holdArc ? 10 : 2.5));
  if (!coarse && izcur) {
    izcur.style.transform = `translate(${cx}px, ${cy}px) scale(${overUi ? .55 : 1 + .15 * holdArc})`;
    izcur.style.opacity = hasPtr ? String(overUi ? .5 : .55 + .35 * holdArc) : '0';
    izring.setAttribute('stroke-dasharray', `${(holdArc * 100).toFixed(1)} 100`);
  }
  // подсказка — только когда курсор отдыхает: не мешает смотреть и не висит постоянно
  const rest = t - ptrT > 1.1 || coarse, still = !inp.down && idle && !overUi && t - arrivedAt > 2.5;
  const txt = !entered ? 'нажмите — звук и вход' : cur === HUB ? 'удерживайте — шагнуть в мир' : 'удерживайте — в другой мир';
  if (izlab.textContent !== txt) { izlab.textContent = txt; labW = 0; }
  if (!labW && labA > .01) labW = izlab.offsetWidth;
  const peak = crossings >= 3 ? .28 : .55, aim = (rest && still && (hasPtr || coarse)) ? peak : 0;
  labA += (aim - labA) * Math.min(1, dt * (aim > labA ? .9 : 4));
  izlab.style.opacity = labA.toFixed(3);
  if (!coarse) { const lw = labW || 220, lx = cx + 24 + lw > innerWidth - 12 ? cx - 24 - lw : cx + 24; izlab.style.transform = `translate(${lx}px, ${cy - 7}px)`; }
}
const IZAPI = {
  open, close, prime,
  get active() { return running; },
  // полотно полностью закрыло Астролябию — её можно не рисовать
  get opaque() { return running && !closing && canvas && canvas.style.opacity === '1' && getComputedStyle(canvas).opacity === '1'; },
};
