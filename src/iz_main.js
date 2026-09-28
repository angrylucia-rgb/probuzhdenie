// «Изнанка» внутри Астролябии. Своё полотно WebGL2 поверх всей страницы и свой цикл кадров;
// создаётся при первом входе, между входами спит. Логика кадра — та же, что в самостоятельной v3 (main.js):
// ввод → разрыв реальности → сердце мира → звук и свет. Выход — двойное касание или Esc.
let canvas = null, hint = null, vis = null, input = null, unbind = null, running = false, raf = 0, onExit = null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage = null; try { storage = localStorage; } catch (e) { /* нет хранилища */ }
const ws = createWorldState();
const director = createRuptureDirector({ reducedMotion: reduced });
const journey = createJourney(storage);
const audio = createAudioEngine();
let entered = false, fade = 0, fadeTarget = 1, intro = 1, seed = Math.random(), shown = 0;
let pulse = 0, flashes = [], timeA = 0, timeB = 0, arrivedAt = 0, closing = 0;
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
const glowOpen = new Float32Array(16), glowCol = new Float32Array(48);
ORDER.forEach((id, i) => glowCol.set(WORLDS[id].color, i * 3));
function applyWorld(id) { const s = WORLDS[id].state; ws.setTarget({ energy: s.energy, density: s.density, dispersion: s.dispersion }); }
applyWorld(HUB);

function mount() {
  if (canvas) return true;
  canvas = document.createElement('canvas');
  canvas.className = 'izc'; canvas.setAttribute('aria-label', 'Изнанка');
  hint = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  hint.setAttribute('class', 'izhint'); hint.setAttribute('viewBox', '0 0 24 24'); hint.setAttribute('aria-hidden', 'true');
  hint.innerHTML = '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>';
  document.body.append(canvas, hint);
  try { vis = createVisualEngine(canvas); } catch (e) { vis = null; }
  input = createInputTracker({ stillnessSec: 240 });
  canvas.addEventListener('pointerdown', enter);
  return !!vis;
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
  running = true; closing = 0; fade = 0; fadeTarget = 1; shown = 0;
  // из-за горизонта приходим в полную темноту — полотно сразу непрозрачно, плазма проявляется из черноты;
  // из меню полотно само наплывает поверх Астролябии
  canvas.style.transition = opts.fromBlack ? 'none' : 'opacity 1.2s ease';
  canvas.style.display = 'block'; hint.style.display = 'block';
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
    setTimeout(() => { running = false; cancelAnimationFrame(raf); canvas.style.display = 'none'; hint.style.display = 'none'; audio.suspend(); if (unbind) unbind(); unbind = null; }, 1150);
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
    if (cur === 'light' && idle && t - arrivedAt > 30) director.begin(HUB, { auto: true });
  }
  const g = director.update(dt, inp.holding);
  if (g.event === 'rift') { audio.rift(); applyWorld(g.to); timeB = 0; }
  if (g.event === 'arrived') { journey.arrive(g.to); arrivedAt = t; timeA = timeB; }
  if (g.event === 'cancelled') applyWorld(g.from);
  ws.set({ tear: g.tear });
  ws.update(dt, t);
  const a = audio.update(ws.current, g, t, dt);
  if (entered && g.phase === 'idle' && cur !== HUB && t > nextMicro && micro[3] === 0) micro = [(Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 1.1, 0, 1];
  if (micro[3] > 0) { micro[2] += dt / 4; if (micro[2] >= 1) { micro = [0, 0, 0, 0]; nextMicro = t + 25 + Math.random() * 35; } }
  if (flareReq && allowFlash(t)) pulse = 1;
  flareReq = false;
  pulse *= Math.exp(-dt / 0.35);
  ORDER.forEach((id, i) => {
    const op = journey.completed && journey.opened.has(id) ? 0.5 : 0;
    const aimed = g.to === id ? 0.5 + g.p : 0;
    glowOpen[i] += (Math.max(op, aimed) - glowOpen[i]) * Math.min(1, dt * 2);
  });
  intro += ((entered ? 0 : 1) - intro) * Math.min(1, dt * 1.5);
  // проявление из черноты медленнее, чем в самостоятельной версии: глаз только что был в полной темноте
  fade += (fadeTarget - fade) * Math.min(1, dt * (fadeTarget > fade ? 0.55 : 1.2));
  shown = Math.min(1, shown + dt / 2.5);
  timeA += dt; timeB += dt;
  const A = g.from, B = g.to || g.from, s = ws.current;
  vis?.render({
    uTime: t, uTimeA: timeA, uTimeB: timeB, uSeed: seed,
    uShake: shake(t, g),
    uFold: foldAmount(g) * (reduced ? 0.4 : 1) + 0.6 * (1 - shown) * (reduced ? 0.3 : 1), uMicro: micro,
    uA: WORLDS[A].idx, uB: WORLDS[B].idx, uMix: g.to ? g.mix : 0,
    uBreath: s.breath, uEnergy: s.energy, uDensity: s.density, uDisp: s.dispersion,
    uLow: a.low, uMid: a.mid, uHigh: a.high, uPulse: pulse,
    uHold: Math.min(1, inp.holdTime / 2), uStill: Math.min(1, inp.stillFor / 25),
    uPtr: ptrP(inp.x, inp.y),
    uTrail: WORLDS[g.mix > 0.5 && g.to ? g.to : g.from].trail, uIntro: intro,
    uGlowCount: ORDER.length, uGlowOpen: glowOpen, uGlowCol: glowCol,
    uExposure: 1, uFade: fade,
  }, dt);
}
const IZAPI = {
  open, close, prime,
  get active() { return running; },
  // полотно полностью закрыло Астролябию — её можно не рисовать
  get opaque() { return running && !closing && canvas && canvas.style.opacity === '1' && getComputedStyle(canvas).opacity === '1'; },
};
