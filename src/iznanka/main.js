// Сборка «Изнанки»: ввод -> разрыв реальности -> сердце мира -> звук и свет.
import { createWorldState } from './core/worldState.js';
import { createInputTracker, bindInput } from './core/input.js';
import { createRuptureDirector } from './core/rupture.js';
import { createJourney, HUB } from './core/journey.js';
import { createVisualEngine } from './visual/visualEngine.js';
import { createAudioEngine } from './audio/audioEngine.js';
import { WORLDS } from './worlds/presets.js';

const q = new URLSearchParams(location.search);
const canvas = document.getElementById('c');
const hint = document.getElementById('hint');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage = null; try { storage = localStorage; } catch { /* нет хранилища */ }

const ws = createWorldState();
const input = createInputTracker({ stillnessSec: Number(q.get('still')) || 240 });
const director = createRuptureDirector({ reducedMotion: reduced });
const journey = createJourney(storage);
const audio = createAudioEngine();
let vis;
try { vis = createVisualEngine(canvas); } catch { document.body.classList.add('nogl'); }

let entered = false, fade = 0, fadeTarget = 1, intro = 1, seed = Math.random();
let pulse = 0, flashes = [], timeA = 0, timeB = 0, arrivedAt = 0;
let micro = [0, 0, 0, 0], nextMicro = 20, flareReq = false;
audio.onFlare(() => { flareReq = true; });
const ptrP = (x, y) => [(x - 0.5) * innerWidth / Math.min(innerWidth, innerHeight), (0.5 - y) * innerHeight / Math.min(innerWidth, innerHeight)];
// дрожь камеры: мелкая быстрая вибрация + медленный дрейф; сильнее при вспышках и переходах
function shake(t, g, reduced) {
  const a = (0.0035 + 0.007 * foldAmount(g) + 0.004 * pulse) * (reduced ? 0.2 : 1);
  const n = (f, ph) => Math.sin(t * f + ph);
  return [
    a * (n(13.1, 0) + 0.6 * n(23.7, 1.3) + 0.4 * n(7.3, 2.1)) / 2 + 0.006 * n(0.7, 0.4),
    a * (n(11.3, 0.7) + 0.6 * n(19.9, 2.4) + 0.4 * n(5.9, 0.2)) / 2 + 0.005 * n(0.53, 1.9),
    a * 0.6 * (n(9.7, 0.3) + 0.5 * n(17.1, 1.1)),
  ];
}
// сила складки пространства по фазе перехода
function foldAmount(g) {
  return { call: 0.3 * g.p, crack: 0.3 + 0.7 * g.p, rift: 1, reassembly: 1 - g.p, settle: 0, idle: 0 }[g.phase];
}
function applyWorld(id) {
  const s = WORLDS[id].state;
  ws.setTarget({ energy: s.energy, density: s.density, dispersion: s.dispersion });
}
// отладка: ?w=plasma открывает мир сразу
const start = WORLDS[q.get('w')] ? q.get('w') : HUB;
if (start !== HUB) { director.begin(start, { auto: true }); for (let i = 0; i < 200; i++) director.update(1, true); }
applyWorld(start);

function exit() {
  fadeTarget = 0; audio.fadeOut();
  setTimeout(() => {
    const url = q.get('exit');
    if (url) location.href = url; else if (history.length > 1 && document.referrer) history.back();
    else { entered = false; intro = 1; fadeTarget = 1; hint.classList.remove('gone'); }
  }, 1600);
}

async function enter() {
  if (entered) return;
  entered = true; hint.classList.add('gone');
  try { await audio.start(); audio.fadeIn(); } catch { /* без звука */ }
}
canvas.addEventListener('pointerdown', enter);
bindInput(canvas, input, exit);
document.addEventListener('visibilitychange', () => (document.hidden ? audio.suspend() : audio.resume()));

// вспышки не чаще 3 в секунду (WCAG 2.3.1)
function allowFlash(t) { flashes = flashes.filter((x) => t - x < 1); if (flashes.length >= 3) return false; flashes.push(t); return true; }

let last = performance.now() / 1000;
function frame() {
  const t = performance.now() / 1000, dt = Math.min(0.1, t - last); last = t;
  const inp = input.update(t);
  const cur = director.state.from;

  if (entered) {
    const idle = ['idle', 'settle'].includes(director.state.phase);
    if (idle && (inp.holding || inp.autoTrigger)) {
      const angle = Math.atan2(inp.y - 0.5, (inp.x - 0.5) * innerWidth / innerHeight);
      const target = journey.next(cur, angle);
      if (director.begin(target, { auto: inp.autoTrigger })) seed = Math.random();
    }
    // Свет сам растворяется обратно в Пустоту
    if (cur === 'light' && idle && t - arrivedAt > 30) director.begin(HUB, { auto: true });
  }
  const g = director.update(dt, inp.holding);
  if (g.event === 'rift') { audio.rift(); applyWorld(g.to); timeB = 0; }
  if (g.event === 'arrived') { journey.arrive(g.to); arrivedAt = t; timeA = timeB; }
  if (g.event === 'cancelled') applyWorld(g.from);
  ws.set({ tear: q.has('tear') ? Number(q.get('tear')) : g.tear });
  ws.update(dt, t);
  const a = audio.update(ws.current, g, t, dt);
  // малые разрывы: реальность на миг истончается и затягивается
  if (entered && g.phase === 'idle' && cur !== HUB && t > nextMicro && micro[3] === 0) {
    micro = [(Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 1.1, 0, 1];
  }
  if (micro[3] > 0) { micro[2] += dt / 4; if (micro[2] >= 1) { micro = [0, 0, 0, 0]; nextMicro = t + 25 + Math.random() * 35; } }
  if (flareReq && allowFlash(t)) pulse = 1;
  flareReq = false;
  pulse *= Math.exp(-dt / 0.35);
  intro += ((entered ? 0 : 1) - intro) * Math.min(1, dt * 1.5);
  fade += (fadeTarget - fade) * Math.min(1, dt * 1.2);
  timeA += dt; timeB += dt;
  const A = g.from, B = g.to || g.from;
  const s = ws.current;
  const dbg = q.has('fold') && WORLDS[q.get('to')];
  const B2 = dbg ? q.get('to') : B;
  vis?.render({
    uTime: t, uTimeA: timeA, uTimeB: timeB, uSeed: seed,
    uShake: shake(t, g, reduced),
    uFold: dbg ? Number(q.get('fold')) : foldAmount(g) * (reduced ? 0.4 : 1), uMicro: micro,
    uA: WORLDS[A].idx, uB: WORLDS[B2].idx, uMix: dbg ? 0.5 : g.to ? g.mix : 0,
    uBreath: s.breath, uEnergy: s.energy, uDensity: s.density, uDisp: s.dispersion,
    uLow: a.low, uMid: a.mid, uHigh: a.high, uPulse: pulse,
    uHold: Math.min(1, inp.holdTime / 2), uStill: Math.min(1, inp.stillFor / 25),
    uPtr: ptrP(inp.x, inp.y),
    uTrail: WORLDS[g.mix > 0.5 && g.to ? g.to : g.from].trail, uIntro: intro,
    uExposure: 1, uFade: fade,
  }, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
