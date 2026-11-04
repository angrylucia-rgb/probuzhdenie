const IZ = (() => {
"use strict";
// Пресеты миров. Новый мир: запись здесь (idx = номер case в world() шейдера) + id в ORDER (core/journey.js).
// Звук по референсам: глубокий дрон 32–55 Гц с чистым натуральным рядом обертонов, медленная пульсация,
// природная текстура (ветер, вода, огонь, гул) и природные события. Корни миров — пентатоника C–D–E–G–A,
// поэтому в Свете все тона сливаются в один согласный аккорд.
const WORLDS = {
  // Изнанка: звук снят со спектра референса — плотный турбулентный гул 29–58 Гц (широкая стереобаза)
  // и воздушные «выдохи» 1–8 кГц, которые приходят вместе со вспышками плазмы
  iznanka:     { idx: 0, color: [1, .9, .88], rim: [1, .95, .9],  state: { energy: .5, density: .5, dispersion: .35 }, trail: .9,
    audio: { root: 29.3, cluster: [29.3, 32.7, 37.3, 43.9, 47, 57.9, 94, 247, 294], harm: [1, .35, .15], pulse: [2.5, .15], tex: 'rumble', texGain: .55, event: 'whoosh', rate: 1.6 } },
  frost:       { idx: 1, color: [.75, .88, 1], rim: [.8, .92, 1],  state: { energy: .2, density: .5, dispersion: .3 }, trail: .9,
    audio: { root: 32.70, harm: [1, .45, .3, .15, .08], pulse: [4, .15], tex: 'wind', texGain: .09, event: 'tinkle', rate: 3 } },
  waterlights: { idx: 2, color: [1, .35, .2], rim: [1, .5, .25],   state: { energy: .3, density: .5, dispersion: .2 }, trail: .95,
    audio: { root: 55.00, harm: [1, .5, .2], pulse: [6, .3], tex: 'water', texGain: .14, event: 'drop', rate: 2.5 } },
  flame:       { idx: 3, color: [1, .6, .25], rim: [1, .6, .2],    state: { energy: .55, density: .6, dispersion: .25 }, trail: .9,
    audio: { root: 49.00, harm: [1, .6, .35, .2], pulse: [.5, .2], tex: 'roar', texGain: .12, event: 'crackle', rate: .8 } },
  corona:      { idx: 4, color: [.9, .92, 1], rim: [.95, .95, 1],  state: { energy: .35, density: .7, dispersion: .2 }, trail: .92,
    audio: { root: 32.70, harm: [1, .7, .45, .3, .15], pulse: [.5, .35], tex: 'roar', texGain: .1, event: 'swell', rate: 9 } },
  nebula:      { idx: 5, color: [.7, .45, 1], rim: [.85, .6, 1],   state: { energy: .45, density: .6, dispersion: .35 }, trail: .94,
    audio: { root: 41.20, harm: [1, .5, .3, .2, .1], pulse: [2, .3], tex: 'wind', texGain: .06, event: 'shimmer', rate: 5 } },
  field:       { idx: 6, color: [.5, .45, 1], rim: [1, .5, .7],    state: { energy: .4, density: .6, dispersion: .3 }, trail: .93,
    audio: { root: 55.00, harm: [1, .4, .2], pulse: [2, .2], tex: 'wind', texGain: .05, event: 'whistler', rate: 6 } },
  prism:       { idx: 7, color: [1, 1, 1],    rim: [1, 1, 1],      state: { energy: .35, density: .4, dispersion: .8 }, trail: .9,
    audio: { root: 65.41, harm: [1, .5, .33, .25, .2, .16], pulse: [4, .1], tex: 'wind', texGain: .03, event: 'glass', rate: 3.5 } },
  light:       { idx: 8, color: [1, 1, 1],    rim: [1, .97, .9],   state: { energy: .2, density: .2, dispersion: .1 }, trail: .9,
    audio: { root: 32.70, harm: [1, .5, .3, .2], pulse: [4, .1], tex: 'wind', texGain: .02, event: 'chord', rate: 10 } },
  // Мандала: сакральная геометрия, золото и фиолет на чёрном — первым показывается новым посетителям
  mandala:     { idx: 9, color: [.85, .55, 1], rim: [1, .85, .5],  state: { energy: .4, density: .55, dispersion: .4 }, trail: .93,
    audio: { root: 36.71, harm: [1, .55, .4, .28, .18, .12], pulse: [3, .2], tex: 'wind', texGain: .07, event: 'shimmer', rate: 4.5 } },
};

// Процедурная генерация миров: тот же формат, что и рукописные пресеты в presets.js (WORLDS[id]),
// только собранный сидированным генератором вместо руки. Семейства — органические/физические явления:
// 1 growth (дендритный/кристаллический рост), 2 flow (турбулентная плазма/жидкость),
// 3 membrane (клеточная мембрана/прогорание), 4 pulse (биолюминесцентные волны),
// 5 web (сеть трещин/разрядов по всему кадру), 6 foam (колония клеток/пузырей), 7 ripple (интерференция волн
// от нескольких источников), 8 aurora (дрейфующие вертикальные занавесы). Восемь семейств — не совпадение:
// столько же, сколько у авторских миров первого круга, чтобы после него разнообразие не проседало.
// Соответствующие GLSL-функции — в visual/shaders.js (gGrowth/gFlow/.../gAurora, диспетчер worldGen).

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// h в градусах (0..360), s/l в 0..1 → [r,g,b] в 0..1 (тот же диапазон, что ждут uColA/uColB в шейдере)
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [r + m, g + m, b + m];
}

// один случайный бросок на несколько взвешенных исходов: pairs = [[значение, вес], ...]
function weighted(rand, pairs) {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let x = rand() * total;
  for (const [v, w] of pairs) { if (x < w) return v; x -= w; }
  return pairs[pairs.length - 1][0];
}
// имя не pick: audioEngine.js уже объявляет свой pick(arr) в этой же общей области после сборки
const pickOf = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const range = (rand, lo, hi) => lo + rand() * (hi - lo);

const ROOTS = [29.14, 32.70, 36.71, 41.20, 43.65, 49.00, 55.00, 61.74];
const OCTAVES = [0.5, 1, 2];

const FAMILY_PARAMS = {
  1(rand) { // growth: частота ветвления, изрезанность, скорость фронта, масштаб деформации, контраст прожилок
    return [range(rand, 8, 40), range(rand, 3, 16), range(rand, .015, .12), range(rand, 1.5, 5), range(rand, .3, 1), 0, 0, 0];
  },
  2(rand) { // flow: частота деформации, скорость, масштаб гребней, турбулентность, сила свечения
    return [range(rand, .8, 3), range(rand, .005, .05), range(rand, 1.5, 6), range(rand, .5, 2.5), range(rand, 0, 1), 0, 0, 0];
  },
  3(rand) { // membrane: масштаб клеток, радиус прогара, скорость пульсации, ширина кромки, частота волокон
    return [range(rand, 1.2, 4), range(rand, .02, .35), range(rand, 0, .06), range(rand, .008, .03), range(rand, 3, 12), 0, 0, 0];
  },
  4(rand) { // pulse: скорость кольца, ширина кольца, свечение центра, доля радужного дрейфа, доля заполнения
    return [range(rand, .02, .09), range(rand, .008, .03), range(rand, .005, .03), range(rand, 0, 1), range(rand, 0, 1), 0, 0, 0];
  },
  5(rand) { // web: масштаб ячеек, толщина линий, скорость дрейфа, яркость краёв, доля мелкого слоя
    return [range(rand, 2, 8), range(rand, .03, .15), range(rand, 0, 1.5), range(rand, .3, 1.2), range(rand, 0, .8), 0, 0, 0];
  },
  6(rand) { // foam: масштаб клеток, ширина стенки, скорость дрейфа, контраст заполнения, сила блика
    return [range(rand, 2, 7), range(rand, .03, .12), range(rand, 0, 1.2), range(rand, .3, 1), range(rand, 0, 1), 0, 0, 0];
  },
  7(rand) { // ripple: доля числа источников, частота колец, скорость, радиус затухания, контраст интерференции
    return [range(rand, 0, 1), range(rand, .5, 2.5), range(rand, .3, 2), range(rand, .15, .6), range(rand, .5, 1.5), 0, 0, 0];
  },
  8(rand) { // aurora: доля числа занавесов, частота волнистости, скорость дрейфа, ширина занавеса, частота мерцания
    return [range(rand, 0, 1), range(rand, .5, 3), range(rand, .3, 2), range(rand, .05, .25), range(rand, .3, 1.5), 0, 0, 0];
  },
};
const FAMILY_TEX = {
  1: (rand) => weighted(rand, [['wind', 70], ['rumble', 30]]),
  2: (rand) => weighted(rand, [['roar', 50], ['water', 50]]),
  3: (rand) => weighted(rand, [['roar', 80], ['rumble', 20]]),
  4: () => 'wind',
  5: (rand) => weighted(rand, [['rumble', 60], ['roar', 40]]),
  6: (rand) => weighted(rand, [['water', 60], ['wind', 40]]),
  7: () => 'water',
  8: (rand) => weighted(rand, [['wind', 70], ['water', 30]]),
};
const FAMILY_EVENT = {
  1: (rand) => pickOf(rand, ['tinkle', 'crackle']),
  2: (rand) => pickOf(rand, ['swell', 'whistler', 'shimmer']),
  3: (rand) => pickOf(rand, ['crackle', 'spark', 'drop']),
  4: (rand) => pickOf(rand, ['glass', 'shimmer', 'chord']),
  5: (rand) => pickOf(rand, ['spark', 'crackle', 'tinkle']),
  6: (rand) => pickOf(rand, ['drop', 'shimmer', 'glass']),
  7: (rand) => pickOf(rand, ['whistler', 'swell', 'chord']),
  8: (rand) => pickOf(rand, ['shimmer', 'chord', 'whistler']),
};

function generateWorld(seed) {
  const rand = typeof seed === 'number' ? mulberry32(seed) : Math.random;

  const family = weighted(rand, [[1, 14], [2, 14], [3, 11], [4, 11], [5, 12], [6, 12], [7, 13], [8, 13]]);
  const params = FAMILY_PARAMS[family](rand);

  // colA — светлый/поверхностный тон, colB — тёмный/контрастный: если случайно вышли слишком близко
  // по оттенку, разводим colB на случайный угол в другой части круга — органика бывает и неожиданных сочетаний
  let hueA = range(rand, 0, 360), hueB = range(rand, 0, 360);
  const dh = Math.min(Math.abs(hueA - hueB), 360 - Math.abs(hueA - hueB));
  if (dh < 20) hueB = (hueB + range(rand, 60, 300)) % 360;
  const colA = hsl2rgb(hueA, range(rand, .5, .95), range(rand, .45, .85));
  const colB = hsl2rgb(hueB, range(rand, .5, .95), range(rand, .3, .7));

  const root = pickOf(rand, ROOTS) * pickOf(rand, OCTAVES);
  const harm = [1];
  const n = 3 + Math.floor(rand() * 3); // 3..5 обертонов сверх основного тона
  for (let i = 0; i < n; i++) harm.push(Math.max(0.03, harm[i] * range(rand, .45, .8) + range(rand, -.05, .05)));

  return {
    gen: true,
    family,
    params,
    colA,
    colB,
    state: { energy: range(rand, .15, .6), density: range(rand, .3, .8), dispersion: range(rand, .1, .5) },
    trail: range(rand, .88, .96),
    audio: {
      root,
      harm,
      tex: FAMILY_TEX[family](rand),
      texGain: range(rand, .03, .15),
      event: FAMILY_EVENT[family](rand),
      rate: range(rand, .6, 6),
      pulse: [range(rand, .5, 6), range(rand, .1, .35)],
    },
  };
}

function createWorldState(initial = {}) {
  const defaults = {
    breath: 0,
    energy: 0.3,
    density: 0.3,
    dispersion: 0.2,
    tear: 0,
  };

  const current = { ...defaults, ...initial };
  const target = { ...defaults, ...initial };

  const clamp = (value) => Math.max(0, Math.min(1, value));

  const setTarget = (partial) => {
    Object.keys(partial).forEach((key) => {
      target[key] = clamp(partial[key]);
    });
  };

  const set = (partial) => {
    Object.keys(partial).forEach((key) => {
      current[key] = target[key] = clamp(partial[key]);
    });
  };

  const update = (dt, timeSec) => {
    const keys = ['energy', 'density', 'dispersion'];
    keys.forEach((key) => {
      current[key] += (target[key] - current[key]) * (1 - Math.exp(-1.5 * dt));
      current[key] = clamp(current[key]);
    });
    current.breath = target.breath = 0.5 - 0.5 * Math.cos(2 * Math.PI * timeSec / 10);
    target.tear = clamp(target.tear);
  };

  return { current, target, setTarget, set, update };
}

// Трекер ввода: удержание, двойное касание, неподвижность (Qwen, 2-й круг; экспорт и отписка поправлены вручную)
function createInputTracker({ stillnessSec = 240 } = {}) {
  let isDown = false, downT = 0, x = 0.5, y = 0.5, prevX, prevY, prevT, moveT = 0, speed = 0, lastEventT = 0, autoRefT = 0, lastShortUpT = -Infinity;

  function moveTo(nx, ny, t) {
    speed = prevT !== undefined && t > prevT ? Math.hypot(nx - prevX, ny - prevY) / (t - prevT) : 0;
    prevX = nx; prevY = ny; prevT = t; x = nx; y = ny; moveT = t;
  }
  function pointerDown(nx, ny, t) { isDown = true; downT = t; moveTo(nx, ny, t); lastEventT = t; autoRefT = t; }
  function pointerMove(nx, ny, t) { moveTo(nx, ny, t); lastEventT = t; autoRefT = t; }
  function pointerUp(t) {
    if (!isDown) return null;
    isDown = false; lastEventT = t; autoRefT = t;
    const short = t - downT < 0.25;
    if (short && downT - lastShortUpT <= 0.35) { lastShortUpT = -Infinity; return 'exit'; }
    lastShortUpT = short ? t : -Infinity;
    return null;
  }
  function update(t) {
    const holdTime = isDown ? t - downT : 0;
    let autoTrigger = false;
    if (t - autoRefT >= stillnessSec) { autoTrigger = true; autoRefT = t; }
    return {
      holding: isDown && holdTime >= 0.25, holdTime, x, y,
      speed: speed * Math.exp(-3 * Math.max(0, t - moveT)),
      stillFor: t - lastEventT, autoTrigger, down: isDown,
    };
  }
  return { pointerDown, pointerMove, pointerUp, update };
}

function bindInput(el, tracker, onExit, now = () => performance.now() / 1000) {
  const pos = (e) => { const r = el.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  const h = {
    pointerdown: (e) => tracker.pointerDown(...pos(e), now()),
    pointermove: (e) => tracker.pointerMove(...pos(e), now()),
    pointerup: () => { if (tracker.pointerUp(now()) === 'exit') onExit(); },
    pointercancel: () => tracker.pointerUp(now()),
  };
  const key = (e) => { if (e.key === 'Escape') onExit(); };
  for (const k in h) el.addEventListener(k, h[k]);
  window.addEventListener('keydown', key);
  el.style.touchAction = 'none';
  return () => { for (const k in h) el.removeEventListener(k, h[k]); window.removeEventListener('keydown', key); };
}

// Машина состояний разрыва реальности: зов → надрыв → разрыв → проявление → успокоение.
const NEXT = { crack: 'rift', rift: 'reassembly', reassembly: 'settle', settle: 'idle' };
const SHAPE = {
  idle: () => [0, 0],
  call: (p) => [0.25 * p * p, 0.15 * p],
  crack: (p) => [0.25 + 0.6 * p, 0.15 + 0.2 * p],
  rift: (p) => [1, 0.35 + 0.65 * p],
  reassembly: (p) => [1 - p, 1],
  settle: () => [0, 1],
};

function createRuptureDirector({ durations = { call: 2, crack: 1.2, rift: 0.4, reassembly: 1.4, settle: 4 }, reducedMotion = false } = {}) {
  let phase = 'idle', p = 0, from = 'iznanka', to = null, auto = false;

  function begin(target, opts = {}) {
    if (phase !== 'idle' && phase !== 'settle') return false;
    phase = 'call'; p = 0; to = target; auto = !!opts.auto;
    return true;
  }

  function update(dt, holding) {
    let event = null;
    if (phase === 'call') {
      p += ((holding || auto) ? 1 : -2) * dt / durations.call;
      if (p <= 0) { phase = 'idle'; p = 0; to = null; event = 'cancelled'; } else if (p >= 1) { phase = 'crack'; p = 0; }
    } else if (phase !== 'idle') {
      p += dt / durations[phase];
      if (p >= 1) {
        if (phase === 'crack') event = 'rift';
        if (phase === 'reassembly') { event = 'arrived'; from = to; }
        if (phase === 'settle') to = null;
        phase = NEXT[phase]; p = 0;
      }
    }
    p = Math.min(1, Math.max(0, p));
    const [tear, mix] = SHAPE[phase](p);
    return { phase, p, tear: reducedMotion ? tear * 0.15 : tear, mix, from, to, event };
  }

  return { begin, update, get state() { return { phase, p, from, to, auto }; } };
}

// Маршрут: Изнанка — центр. Любой переход из мира в мир идёт через неё.
// Первый круг: Изнанка → следующий неоткрытый мир → Изнанка → ... → Свет → Изнанка. Потом —
// каждое новое погружение рождает процедурный мир (worlds/generator.js), а не выбор среди тех же восьми:
// это ближе к самой идее Изнанки как непрерывно меняющейся реальности.

const HUB = 'iznanka';
const ORDER = ['mandala', 'frost', 'waterlights', 'flame', 'corona', 'nebula', 'field', 'prism'];
const KEY = 'iznanka.v2';
const GEN_CAP = 12; // не копим сгенерированные миры бесконечно за долгую сессию

function createJourney(storage) {
  let completed = false;
  const opened = new Set();
  try {
    const d = JSON.parse(storage.getItem(KEY));
    completed = d.completed === true;
    if (Array.isArray(d.opened)) d.opened.forEach((id) => opened.add(id));
  } catch { /* нет хранилища или битые данные */ }

  const angleOf = (id) => -Math.PI / 2 + ORDER.indexOf(id) * 2 * Math.PI / ORDER.length;

  const genIds = [];
  let genCounter = 0;
  function spawnGenerated() {
    const id = 'gen' + (++genCounter);
    WORLDS[id] = generateWorld();
    genIds.push(id);
    if (genIds.length > GEN_CAP) delete WORLDS[genIds.shift()];
    return id;
  }

  function next(current) {
    if (current !== HUB) return HUB;
    if (!completed) return ORDER.find((id) => !opened.has(id)) || 'light';
    return spawnGenerated();
  }

  function arrive(id) {
    if (ORDER.includes(id)) opened.add(id);
    if (id === 'light') completed = true;
    try { storage.setItem(KEY, JSON.stringify({ completed, opened: [...opened] })); } catch { /* приватный режим */ }
  }

  return { get completed() { return completed; }, get opened() { return opened; }, next, arrive, angleOf };
}

// Анализ спектра: три полосы + детектор атак (сгенерировано Qwen, возврат onset поправлен вручную)
function computeBands(freqData, sampleRate, fftSize) {
  const hz = sampleRate / fftSize;
  const b = [[0, 0], [0, 0], [0, 0]];
  for (let i = 0; i < freqData.length; i++) {
    const f = i * hz;
    const k = f >= 20 && f < 200 ? 0 : f >= 200 && f < 2000 ? 1 : f >= 2000 && f < 12000 ? 2 : -1;
    if (k >= 0) { b[k][0] += freqData[i]; b[k][1]++; }
  }
  const avg = ([s, c]) => (c ? s / c / 255 : 0);
  return { low: avg(b[0]), mid: avg(b[1]), high: avg(b[2]) };
}

function createOnset({ threshold = 0.12, smoothing = 0.9 } = {}) {
  let s = null;
  let armed = true;
  function update(v) {
    if (s === null) s = v;
    const d = v - s;
    let hit = false;
    if (armed && d > threshold) { hit = true; armed = false; } else if (d < threshold / 2) armed = true;
    s = s * smoothing + v * (1 - smoothing);
    return hit;
  }
  return { update };
}

// Природный звук «Изнанки». У мира: дрон с чистым рядом обертонов и медленной пульсацией,
// текстура (ветер / вода / гул огня) и события (капли, треск, льдинки, вистлеры...).
// Переход: гул нарастает, выдохи пространства учащаются, затем глухой удар, давление в ушах и раскрытие.

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function createAudioEngine() {
  let ctx, bus, lp, send, master, analyser, freq, white, brown, rumbleG, tearG, tearBp;
  const voices = new Map();
  const onset = createOnset({ threshold: 0.08 });
  let bands = { low: 0, mid: 0, high: 0 };

  function noiseBuf(kind) {
    const n = ctx.sampleRate * 6, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
    }
    return b;
  }
  function impulse(sec) {
    const n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    return b;
  }
  function loop(buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(ctx.currentTime, rnd(0, 5)); return s; }
  function filt(type, f, q = 0.7) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  function gain(v = 0) { const g = ctx.createGain(); g.gain.value = v; return g; }

  function build() {
    white = noiseBuf('white'); brown = noiseBuf('brown');
    bus = gain(1); lp = filt('lowpass', 18000, 0.5);
    const rev = ctx.createConvolver(); rev.buffer = impulse(6);
    send = gain(0.5);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3; comp.knee.value = 12; comp.attack.value = 0.05; comp.release.value = 0.5;
    master = gain(0);
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.6;
    freq = new Uint8Array(analyser.frequencyBinCount);
    bus.connect(lp).connect(comp); bus.connect(send).connect(rev).connect(comp);
    comp.connect(master).connect(ctx.destination); master.connect(analyser);
    // голоса разрыва: глухой гул земли и шорох рвущегося листа
    rumbleG = gain(0); loop(brown).connect(filt('lowpass', 120)).connect(rumbleG).connect(bus);
    tearBp = filt('bandpass', 900, 1.2); tearG = gain(0); loop(white).connect(tearBp).connect(tearG).connect(bus);
    master.gain.setTargetAtTime(1, ctx.currentTime, 1.5);
  }

  // ——— природные события ———
  function env(g, t, a, hold, r, peak) {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
  }
  function out(dest, pan = rnd(-0.8, 0.8)) { const g = gain(0), p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p).connect(dest); return g; }
  function osc(f, t, end, type = 'sine') { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(t); o.stop(end); return o; }
  function burst(t, dur, dest, f, q, peak) {
    const s = ctx.createBufferSource(); s.buffer = white; s.start(t, rnd(0, 5), dur + 0.05);
    const g = gain(0); s.connect(filt('bandpass', f, q)).connect(g).connect(dest); env(g, t, 0.001, 0, dur, peak);
  }
  function crackles(dest, n, span, lo, hi, peak) {
    const t0 = ctx.currentTime, g = out(dest); g.gain.value = 1;
    for (let i = 0; i < n; i++) burst(t0 + rnd(0, span), rnd(0.004, 0.02), g, rnd(lo, hi), rnd(1, 4), peak * rnd(0.2, 1));
  }
  let flare = () => {};
  const EVENTS = {
    // выдох пространства: шорох воздуха проносится мимо, плазма вспыхивает вместе с ним
    whoosh(dest) {
      const t0 = ctx.currentTime, n = 1 + Math.floor(rnd(0, 3.5));
      for (let i = 0; i < n; i++) {
        const t = t0 + i * rnd(0.06, 0.35), d = rnd(0.35, 1.1), g = out(dest), s = ctx.createBufferSource();
        s.buffer = white; s.start(t, rnd(0, 5), d + 0.3);
        const bp = filt('bandpass', 1500, 0.9), up = Math.random() < 0.5;
        bp.frequency.setValueAtTime(up ? rnd(900, 1800) : rnd(4000, 7000), t);
        bp.frequency.exponentialRampToValueAtTime(up ? rnd(4000, 7000) : rnd(900, 1800), t + d);
        s.connect(bp).connect(g); env(g, t, d * rnd(0.15, 0.4), 0, d * 0.7, rnd(0.05, 0.14));
        setTimeout(() => flare(), (t - t0) * 1000);
      }
      if (Math.random() < 0.08) { // редкое жужжание разряда
        const t = t0 + rnd(0, 0.5), g = out(dest), o = osc(rnd(140, 300), t, t + 1.2, 'sawtooth');
        o.connect(filt('bandpass', rnd(2500, 5000), 3)).connect(g); env(g, t, 0.05, 0.3, 0.6, 0.03);
      }
    },
    spark(dest, f0) {
      const t = ctx.currentTime; crackles(dest, 3, 0.2, 2000, 6000, 0.25);
      const g = out(dest, 0), o = osc(f0 * 2, t, t + 3); o.frequency.exponentialRampToValueAtTime(f0, t + 2.5); o.connect(g); env(g, t, 0.02, 0, 2.5, 0.12);
    },
    tinkle(dest) {
      const t0 = ctx.currentTime, n = 2 + Math.floor(rnd(0, 5));
      for (let i = 0; i < n; i++) { const t = t0 + rnd(0, 1.5), g = out(dest); osc(rnd(2200, 6500), t, t + 2).connect(g); env(g, t, 0.002, 0, rnd(0.6, 1.8), 0.025); }
      if (Math.random() < 0.3) crackles(dest, 6, 0.08, 3000, 9000, 0.3); // лёд трескается
    },
    drop(dest) {
      const t = ctx.currentTime, f = rnd(500, 1300), g = out(dest), o = osc(f, t, t + 0.2);
      o.frequency.exponentialRampToValueAtTime(f * rnd(1.6, 2.4), t + 0.06); o.connect(g); env(g, t, 0.003, 0, 0.12, 0.05);
    },
    crackle(dest) { crackles(dest, 5 + Math.floor(rnd(0, 18)), rnd(0.4, 1.6), 1500, 7000, 0.35); },
    swell(dest, f0) {
      const t = ctx.currentTime, s = ctx.createBufferSource(), g = out(dest, rnd(-0.3, 0.3)); s.buffer = brown; s.start(t, rnd(0, 5), 9);
      const f = filt('lowpass', 80, 1); f.frequency.setValueAtTime(80, t); f.frequency.linearRampToValueAtTime(400, t + 4); f.frequency.linearRampToValueAtTime(90, t + 8.5);
      s.connect(f).connect(g); env(g, t, 4, 0.5, 4, 0.35); osc(f0 * 3, t, t + 9).connect(g);
    },
    shimmer(dest, f0) {
      const t = ctx.currentTime, g = out(dest);
      [16, 20, 24, 30].forEach((m) => { osc(f0 * m, t, t + 8).connect(g); osc(f0 * m * 1.003, t, t + 8).connect(g); });
      env(g, t, 3, 1, 4, 0.008);
    },
    whistler(dest) {
      const t = ctx.currentTime, d = rnd(1.4, 2.6), g = out(dest), o = osc(rnd(4500, 7000), t, t + d + 0.1);
      o.frequency.exponentialRampToValueAtTime(rnd(600, 1000), t + d); o.connect(g); env(g, t, 0.05, 0, d, 0.025);
    },
    glass(dest, f0) {
      const t0 = ctx.currentTime;
      [8, 10, 12, 15, 16].forEach((m, i) => { if (Math.random() < 0.7) { const t = t0 + i * rnd(0.15, 0.4), g = out(dest); osc(f0 * m, t, t + 5).connect(g); env(g, t, 0.01, 0, rnd(2.5, 4.5), 0.03); } });
    },
    chord(dest) {
      const t = ctx.currentTime, g = out(dest, 0);
      [32.7, 36.71, 41.2, 49, 55, 65.41].forEach((f) => osc(f * 8, t, t + 13).connect(g));
      env(g, t, 4, 3, 5, 0.018);
    },
  };

  function makeVoice(id) {
    const P = WORLDS[id].audio, f0 = P.root;
    const vout = gain(0); vout.connect(bus);
    const drone = gain(0), pulse = gain(1), dlp = filt('lowpass', 300);
    drone.connect(pulse).connect(dlp).connect(vout);
    const oscs = P.harm.map((a, i) => {
      const o = ctx.createOscillator(); o.frequency.value = f0 * (i + 1); o.detune.value = rnd(-3, 3);
      const g = gain(a); o.connect(g).connect(drone); o.start(); return o;
    });
    // гул Изнанки: бурый шум сквозь резонансы на пиках референса, каналы не связаны — звук обнимает
    const cl = P.cluster ? gain(0) : null;
    if (cl) {
      const rs = loop(brown);
      P.cluster.forEach((f, i) => { const bp = filt('bandpass', f, f < 100 ? 7 : 4), g = gain(i < 6 ? 1.6 : 1.1); rs.connect(bp).connect(g).connect(cl); });
      rs.connect(filt('lowpass', 700, 0.6)).connect(gain(1.1)).connect(cl);
      cl.connect(vout);
    }
    // природная текстура
    const src = loop(P.tex === 'roar' || P.tex === 'rumble' ? brown : white);
    const tf = P.tex === 'roar' ? filt('lowpass', 260) : P.tex === 'water' ? filt('lowpass', 550, 0.9) : filt('bandpass', 700, 0.6);
    const tg = gain(0); src.connect(tf).connect(tg).connect(vout);
    let nextEvt = ctx.currentTime + rnd(1, 3), silentSince = null;
    return {
      update(ws, weight, time) {
        const now = ctx.currentTime;
        vout.gain.setTargetAtTime(weight, now, 0.5);
        drone.gain.setTargetAtTime(0.3 + 0.3 * ws.breath, now, 0.3);
        const [per, depth] = P.pulse, ph = (time % per) / per;
        pulse.gain.setTargetAtTime(1 - depth + depth * Math.exp(-ph * 5), now, 0.02);
        dlp.frequency.setTargetAtTime(160 + 400 * ws.breath + 250 * ws.energy, now, 0.3);
        // ветер порывами, вода накатами
        const gust = 0.5 + 0.3 * Math.sin(time * 0.23) + 0.2 * Math.sin(time * 0.61 + 1.3);
        tg.gain.setTargetAtTime((cl ? 0.1 : P.texGain) * (0.4 + ws.density) * gust, now, 0.4);
        if (cl) cl.gain.setTargetAtTime(P.texGain * (0.75 + 0.35 * ws.breath) * (0.8 + 0.3 * Math.sin(time * 0.37)), now, 0.3);
        if (P.tex === 'wind') tf.frequency.setTargetAtTime(400 + 900 * gust, now, 0.5);
        if (weight > 0.05 && now > nextEvt) { EVENTS[P.event](vout, f0, ws); nextEvt = now + P.rate * rnd(0.3, 1.7) / (0.5 + ws.energy); }
        silentSince = weight > 0.001 ? null : silentSince ?? now;
        return silentSince !== null && now - silentSince > 5;
      },
      stop() { oscs.forEach((o) => o.stop()); src.stop(); vout.disconnect(); },
    };
  }

  // разрыв: глухой удар, выдох воздуха
  function rift() {
    if (!ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = gain(0);
    o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.6);
    o.connect(g).connect(bus); o.start(t); o.stop(t + 4);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.6, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    const s = ctx.createBufferSource(), wg = gain(0), f = filt('lowpass', 3000, 0.8);
    s.buffer = white; s.start(t, 0, 3); f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(150, t + 2.5);
    s.connect(f).connect(wg).connect(send); env(wg, t, 0.02, 0, 2.6, 0.4);
  }

  let crackAcc = 0;
  function update(ws, g, time, dt = 0.016) {
    if (!ctx) return { ...bands, onset: false };
    const now = ctx.currentTime, T = g.tear, W = {};
    W[g.from] = 1 - g.mix; if (g.to) W[g.to] = (W[g.to] || 0) + g.mix;
    for (const id of Object.keys(W)) if (!voices.has(id) && WORLDS[id]) voices.set(id, makeVoice(id));
    for (const [id, v] of voices) if (v.update(ws, W[id] || 0, time)) { v.stop(); voices.delete(id); }
    // давление в ушах в момент разрыва — звук глохнет и медленно раскрывается
    const muffle = g.phase === 'rift' ? 1 : g.phase === 'reassembly' ? 1 - g.p : 0;
    lp.frequency.setTargetAtTime(250 + 17750 * Math.pow(1 - muffle, 2), now, g.phase === 'rift' ? 0.05 : 0.4);
    rumbleG.gain.setTargetAtTime(g.phase === 'call' || g.phase === 'crack' ? 0.5 * T + 0.1 * g.p : 0, now, 0.3);
    // шорох рвущегося листа: неровный, как настоящая бумага
    const tearing = 0;
    tearG.gain.setTargetAtTime(tearing * rnd(0.3, 1), now, 0.015);
    tearBp.frequency.setTargetAtTime(700 + 2500 * g.p, now, 0.1);
    // треск учащается к разрыву
    if (g.phase === 'call' || g.phase === 'crack') {
      // складка сгущается: выдохи пространства учащаются
      crackAcc += dt * (g.phase === 'crack' ? 1.5 + 4 * g.p : 0.6 * g.p);
      while (crackAcc > 1) { crackAcc -= 1; EVENTS.whoosh(bus); }
    }
    send.gain.setTargetAtTime(g.phase === 'reassembly' ? 0.9 : 0.5, now, 1);
    analyser.getByteFrequencyData(freq);
    bands = computeBands(freq, ctx.sampleRate, analyser.fftSize);
    return { ...bands, onset: onset.update(bands.high) };
  }

  return {
    async start() {
      if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); build(); }
      await ctx.resume();
    },
    suspend() { ctx?.suspend(); },
    resume() { ctx?.resume(); },
    fadeOut(sec = 1.5) { if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, sec / 3); },
    fadeIn() { if (ctx) master.gain.setTargetAtTime(1, ctx.currentTime, 1); },
    onFlare(cb) { flare = cb; },
    micro() { if (ctx) crackles(bus, 4, 0.3, 2000, 7000, 0.2); },
    update, rift,
  };
}

// GLSL «Изнанки». Центр — плазма (idx 0): живая складка пространства-времени.
// Миры — природные: иней, огни на воде, пламя, корона, туманность, поле, призма, свет, мандала (сакральная геометрия).
// Переход всегда идёт через Изнанку: складка усиливается, мир искривляется и растворяется в ней.
// Новый мир = функция wXxx(p, t) + case в world() + пресет.
const VERT = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const COMMON = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform vec2 uRes; uniform float uTime, uSeed;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * noise(p); p = M * p; a *= .5; } return s; }
// «дымная» ридж-шумовая структура: тонкие волокна, как у дыма и плазмы
float ridge(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ float n = 1. - abs(noise(p) * 2. - 1.); s += a * n * n * n; p = M * p; a *= .5; } return s; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec2 warp(vec2 p, float t){ return p + vec2(fbm(p * 1.3 + vec2(t * .05, 0.)), fbm(p * 1.3 + vec2(3.1, -t * .04))) - .5; }
vec3 hue(float h){ return .5 + .5 * cos(6.2831853 * (h + vec3(0., .33, .67))); }
// защита от NaN/Inf: одна «битая» точка (pow от отрицательного, деление на 0 на конкретной видеокарте) через
// долгую выдержку и билинейную выборку за пару секунд расползается на весь кадр — экран чернеет навсегда.
// Проверка по битам экспоненты: isnan()/isinf() компиляторы ANGLE/HLSL вправе выбросить при оптимизации
bool bad(float x){ return (floatBitsToUint(x) & 0x7f800000u) == 0x7f800000u; }
vec3 fin(vec3 c){ return (bad(c.x) || bad(c.y) || bad(c.z)) ? vec3(0.) : c; }
`;

const SCENE = COMMON + `
uniform sampler2D uPrev;
uniform int uA, uB;
uniform float uMix, uBreath, uEnergy, uDensity, uDisp, uLow, uMid, uHigh, uPulse, uHold, uStill, uTrail, uIntro, uTimeA, uTimeB;
uniform vec2 uPtr;
uniform vec4 uMicro;          // малый разрыв внутри мира: x, y, фаза 0..1, сила

// ═══ ИЗНАНКА: живая складка пространства-времени ═══
// Тонкая светящаяся мембрана в объёме сферы, непрерывно изгибается и складывается.
// Там, где складка встаёт к нам ребром, свет копится — рождаются яркие рваные ленты с радужной каймой.
float h3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float fbm3(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 3; i++){ s += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= .5; } return s; }
mat3 rotXY(float a, float b){ float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
  return mat3(cb, 0., -sb, 0., 1., 0., sb, 0., cb) * mat3(1., 0., 0., 0., ca, sa, 0., -sa, ca); }

uniform float uFold;   // сила изгиба: растёт во время перехода
// Изолинии вихревого поля — изогнутые рваные молнии. Несколько слоёв глубины летят навстречу:
// каждый слой рождается в глубине, растёт, проносится мимо и тает — ощущение полёта сквозь пространство.
float lfield(vec2 p, float t){
  vec2 q = vec2(fbm(p + vec2(0., t * .11)), fbm(p + vec2(5.2, -t * .09)));
  vec2 r = vec2(fbm(p + 3. * q + vec2(1.7, 9.2) + t * .07), fbm(p + 3. * q + vec2(8.3, 2.8) - t * .06));
  return fbm(p + 2.2 * r) + (fbm(p * 7. + r * 4. + t * .5) - .5) * .02;   // мелкая рваность, как у разряда
}
vec3 plasma(vec2 p, float t){
  float T = t * (1. + .5 * uEnergy + .8 * uFold);
  float r2 = length(p);
  vec3 haze = vec3(.03, .024, .028) * smoothstep(.9, .2, r2) * (.6 + .4 * uBreath);
  vec3 acc = vec3(0.);
  const int L = 5;
  float speed = .09 + .05 * uEnergy + .25 * uFold;
  for (int i = 0; i < L; i++){
    float fi = float(i);
    float z = fract(fi / float(L) + t * speed);          // 0 — глубоко, 1 — пролетает мимо
    float sc = exp(mix(log(2.2), log(.4), z));           // слой растёт по мере приближения
    float fade = sin(3.14159 * z); fade *= fade * (1. - .5 * z);
    float id = floor(fi / float(L) + t * speed) * 7.13 + fi * 3.7;   // новый рисунок для каждого пролёта
    vec2 q = rot(T * (.12 + .05 * fi) + id + .9 / (r2 + .4)) * p * sc + vec2(id * 1.3, id * .7);
    float f = lfield(q, T + id);
    float w = (.006 + .004 * uEnergy + .004 * uPulse) * (1.25 - .85 * z);
    vec3 dd = vec3(-.003, 0., .003) * (1. + 1.5 * uDisp) * (1. - .75 * z);
    vec3 line = pow(w / (abs(vec3(f) - .5 + dd) + w * .35), vec3(1.8));
    float lit = smoothstep(.56, .78, fbm(q * .6 + id + T * .15) + .15 * uPulse + .15 * uFold);
    acc += line * lit * fade;
  }
  acc *= smoothstep(1.05, .15, r2) * 1.5;
  float lum = dot(acc, vec3(.33));
  // электрическая зернистость внутри лент и цветные искры, как в видео
  acc *= .8 + .4 * fbm(p * 18. + T * 2.);
  // мягкие радужные переливы вдоль лент вместо искр
  acc += hue(fbm(p * 6. + T * .3) * 2.) * smoothstep(.5, 1.5, lum) * .08;
  vec3 col = acc * vec3(1., .88, .9) * (.9 + .35 * uBreath);
  return col + haze;
}

// Иней: кристаллы растут из центра радиальными дендритами
vec3 wFrost(vec2 p, float t){
  p /= 1. + .02 * uBreath;
  float r = length(p), a = atan(p.y, p.x);
  float w = fbm(p * 3. + 1.7);
  float veins = ridge(vec2(a * 5. + w * 1.5, log(r + .03) * 1.6 - t * .01));
  float rays = pow(abs(sin(a * 38. + w * 12. + fbm(vec2(r * 6., a * 2.)) * 5.)), 6.) * smoothstep(.04, .3, r);
  float fine = ridge(p * 16. + w * 3.);
  float front = .3 + min(uTimeB * .05, 1.3) + .2 * (fbm(vec2(a * 3., t * .02)) - .5);
  float grown = smoothstep(front + .06, front - .06, r);
  vec3 bright = mix(vec3(.95, .97, 1.), vec3(.42, .56, .78), smoothstep(0., .6, r));
  vec3 ice = mix(bright, vec3(.03, .07, .16), max(smoothstep(.4, .75, veins), rays * .8) * smoothstep(.02, .2, r));
  ice += vec3(.8, .9, 1.) * pow(fine, 4.) * .35;
  vec3 dark = vec3(.02, .05, .11) + vec3(.12, .2, .35) * (pow(fine, 3.) * .5 + smoothstep(.45, .9, veins) * .35);
  return mix(dark, ice, grown) * (.55 + .2 * uBreath);
}

// Огни на воде: длинные огненные штрихи дрейфуют по тёмной воде
vec3 wWaterlights(vec2 p, float t){
  vec3 col = vec3(.01, .012, .03) + vec3(.02, .03, .07) * fbm(vec2(p.x * 2., p.y * 18. + t * .05));
  for (int l = 0; l < 3; l++){
    float fl = float(l), h = .07 - fl * .015;
    vec2 q = p + vec2(0., .006 * sin(p.x * 7. + t * .7 + fl));
    float row = floor(q.y / h), fy = fract(q.y / h) - .5;
    float sp = (.02 + .05 * hash(vec2(row, fl))) * (hash(vec2(row, 3. + fl)) > .5 ? 1. : -1.);
    float x = q.x * (1.2 + fl) + t * sp;
    float seg = floor(x), fx = fract(x);
    float on = step(.78 + .06 * fl, hash(vec2(seg, row + fl * 50.)));
    float len = .3 + .6 * hash(vec2(seg, row + 9.));
    float body = smoothstep(0., .05, fx) * smoothstep(len, len - .08, fx);
    float line = exp(-abs(fy) / (.025 + .01 * fl)) * body * on;
    float flick = .7 + .3 * sin(t * (2. + 3. * hash(vec2(seg, row))) + seg);
    vec3 c = l == 2 ? vec3(1., .75, .3) : mix(vec3(1., .2, .15), vec3(1., .5, .2), hash(vec2(row, seg)));
    col += c * line * flick * (l == 2 ? .6 : 1.2);
  }
  return col * (.6 + .3 * uBreath);
}

vec2 voro(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 g = vec2(x, y), o = vec2(hash(i + g), hash(i + g + 17.));
    float d = length(g + .5 + .4 * sin(uTime * .05 + 6.28 * o) - f);
    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return vec2(d1, d2);
}
// Пламя: янтарный лист тлеет, прогорает отверстиями с огненной кромкой; из центра бьют золотые волокна
vec3 wFlame(vec2 p, float t){
  float r = length(p), a = atan(p.y, p.x);
  float paper = fbm(p * 2.2 + t * .01);
  vec3 col = mix(vec3(.95, .68, .32), vec3(.42, .14, .02), smoothstep(.3, .75, paper + r * .4));
  float fib = pow(abs(sin(a * 90. + fbm(p * 5.) * 8.)), 18.) * smoothstep(.9, .05, r);
  col += vec3(1., .78, .35) * fib * .5;
  float d1 = voro(p * 2.2 + 7.).x + (fbm(p * 9.) - .5) * .16 + (fbm(p * 25.) - .5) * .04;
  float rr = .04 + .26 * (.5 + .5 * sin(t * .04 + fbm(p * .7) * 6.)) * smoothstep(.55, .72, fbm(p * .9 + 3.));
  float hole = smoothstep(rr, rr - .03, d1);
  float rim = exp(-abs(d1 - rr) / .014) * smoothstep(.04, .08, rr);
  col = mix(col, vec3(.03, .008, 0.), hole);
  col += vec3(1., .55, .15) * rim * 1.3;
  col += vec3(1., .85, .5) * .006 / (r * r + .003) * (.7 + .5 * uBreath);
  return col * (.5 + .25 * uBreath);
}

// Корона: дымчатая сфера, по краю — волокна силовых линий
vec3 wCorona(vec2 p, float t){
  float R0 = .3 + .008 * uBreath;
  float r = length(p), a = atan(p.y, p.x);
  vec3 col = vec3(0.);
  float smoke = ridge(warp(p * 3., t) * 2. + t * .02);
  col += vec3(.62, .64, .68) * pow(smoke, 1.6) * smoothstep(R0, R0 - .03, r) * (.35 + .65 * r / R0);
  float edge = r - R0 - (fbm(vec2(a * 6., t * .1)) - .5) * .02;
  col += vec3(.95, .96, 1.) * exp(-abs(edge) / .006) * .9;
  float wisp = ridge(vec2(a * 4. + fbm(p * 2. + t * .02) * 1.5, (r - R0) * 5. - t * .06));
  col += vec3(.85, .87, .92) * pow(wisp, 3.) * exp(-max(r - R0, 0.) / .13) * step(R0 - .02, r) * 1.4;
  return col * (.6 + .3 * uBreath);
}

// Туманность: фиолетовая плазма, светящееся ядро, ударное кольцо
vec3 wNebula(vec2 p, float t){
  float r = length(p), a = atan(p.y, p.x);
  vec2 q = warp(p * 1.2, t);
  float s1 = ridge(q * 2.4 + t * .02), s2 = ridge(q * 5. - t * .03);
  vec3 col = (vec3(.5, .28, 1.) * pow(s1, 2.) * .9 + vec3(1., .5, .9) * pow(s2, 3.) * .6) * smoothstep(1., .08, r);
  col += vec3(1., .82, 1.) * .012 / (r * r + .006) * (.6 + .4 * uBreath + .3 * uLow);
  float ph = fract(t * .045), ringR = ph * 1.1;
  col += vec3(.9, .7, 1.) * exp(-abs(r - ringR - (fbm(vec2(a * 3., t)) - .5) * .08) / .012) * (1. - ph) * .7;
  return col * (.6 + .3 * uBreath);
}

// Поле: два потока волокон — как силовые линии или струи дыма, синее с розовым и огнём
float fibers(vec2 p, float t, float k){
  float y = p.y + .35 * fbm(vec2(p.x * .9 + t * .03, k)) + .12 * sin(p.x * 2. + t * .08 + k);
  float f = ridge(vec2(p.x * 1.2 + t * .02, y * 14.) + k);
  return pow(f, 4.) * 1.8 * smoothstep(.3, .7, fbm(p * 1.2 + k + t * .02));
}
vec3 wField(vec2 p, float t){
  vec2 pa = rot(.45) * p, pb = rot(-.35) * p;
  float fa = fibers(pa, t, 1.), fb = fibers(pb, t * 1.2, 5.);
  vec3 ca = mix(vec3(.2, .4, 1.), vec3(.7, .3, 1.), smoothstep(-.6, .6, p.x));
  vec3 cb = mix(vec3(1., .3, .6), vec3(1., .55, .25), smoothstep(-.4, .6, p.x));
  vec3 col = ca * fa * 1.6 + cb * fb * 1.6;
  col += vec3(.25, .15, .45) * pow(ridge(warp(p * 1.5, t) * 2.), 3.) * .5;
  return col * smoothstep(1.2, .2, length(p)) * (.6 + .3 * uBreath);
}

// Призма: свет проходит сквозь стекло и расслаивается в радужные лучи
vec3 wPrism(vec2 p, float t){
  vec2 q = rot(-.95) * p;
  float d = .004 + .012 * uDisp;
  vec3 col;
  for (int k = 0; k < 3; k++){
    float u = q.x + (float(k) - 1.) * d;
    float s = pow(noise(vec2(u * 30., q.y * .5 - t * .12)), 6.) + .8 * pow(noise(vec2(u * 90. + 3., q.y * .3 - t * .2)), 8.);
    col[k] = s;
  }
  col = col * 2.2 * mix(vec3(.85, .92, 1.), vec3(1., .9, .7), noise(vec2(q.x * 3., t * .03))) + hue(q.x * 4. + t * .01) * pow(noise(vec2(q.x * 30., t * .05)), 6.) * .25;
  return col * smoothstep(.9, .1, abs(q.x + .1 * sin(t * .05))) * (.6 + .3 * uBreath);
}

vec3 wLight(vec2 p, float t){
  float r = length(p);
  float fill = smoothstep(0., 25., uTimeB);
  vec3 rings = mix(vec3(.55, .5, .45), hue(r * 2.5 - t * .05) * .5 + .5, .3);
  vec3 col = mix(rings * .4 * smoothstep(1.1, 0., r) + .05, vec3(1., .97, .93), fill * .5);
  col += vec3(1., .95, .9) * .02 / (r * r + .02) * (.3 + .2 * uBreath);
  return col * (.7 + .15 * uBreath);
}

// Мандала: дышащая сакральная геометрия. Два кольца лепестков вращаются навстречу друг другу
// (муаровая глубина без реального 3D), поверх — тонкая кружевная резьба и самоцветные блики
// по логарифмической спирали. Всё держится на тех же fbm/ridge/voro, что и остальные миры.
vec3 wMandala(vec2 p, float t){
  float r = length(p), a = atan(p.y, p.x);
  const float N = 8.;
  const float seg = 6.2831853 / N;

  float aA = a + t * .025, wA = abs(mod(aA, seg) - seg * .5);
  float aB = a - t * .05 + seg * .5, wB = abs(mod(aB, seg) - seg * .5);

  float petalA = exp(-wA * 5.5);
  float ringA = fract(r * 6. - t * .05 - petalA * .6);
  float bandA = exp(-abs(ringA - .5) * 7.) * smoothstep(1., .1, r);

  float petalB = exp(-wB * 7.);
  float ringB = fract(r * 9. + t * .07 - petalB * .5);
  float bandB = exp(-abs(ringB - .5) * 8.) * smoothstep(.85, .1, r) * .8;

  // тонкая кружевная резьба в свёрнутых координатах клина
  vec2 kp = vec2(cos(wA), sin(wA)) * r;
  float lace = ridge(kp * 9. + t * .015) * smoothstep(.9, .05, r);

  // самоцветы по логарифмической спирали внутри каждого клина
  vec2 gp = vec2(a * N / 6.2831853, log(r + .05) * 2.6 - t * .04);
  float gem = smoothstep(.09, 0., voro(gp * 3.).x) * smoothstep(1., .1, r);

  vec3 base = mix(vec3(.05, .02, .1), vec3(.18, .06, .3), smoothstep(1., 0., r));
  vec3 gold = vec3(1., .82, .45), violet = vec3(.55, .35, 1.), white = vec3(1., .97, .9);

  vec3 col = base;
  col += violet * bandA * 1.1;
  col += gold * bandB;
  col += mix(gold, white, .5) * lace * .5;
  col += white * gem * 1.4;
  col += mix(gold, white, .6) * .01 / (r * r + .012) * (.6 + .4 * uBreath);   // дышащее сердце
  col += hue(r * 2. - t * .03) * (bandA + bandB) * .12;                       // едва уловимая радуга по кромке лепестков

  return col * (.55 + .3 * uBreath);
}

// Один мир на программу: шейдер собирается вариантами (WID — номер авторского мира, GEN — семейство
// процедурного). Единый шейдер со всеми мирами, вызванными дважды, на D3D11 (ANGLE/FXC, Windows) компилировался
// больше минуты — всё это время Изнанка была чёрной при живом звуке. Вариант — меньше секунды
vec3 world(int id, vec2 p, float t){
#if WID == 1
  return wFrost(p, t);
#elif WID == 2
  return wWaterlights(p, t);
#elif WID == 3
  return wFlame(p, t);
#elif WID == 4
  return wCorona(p, t);
#elif WID == 5
  return wNebula(p, t);
#elif WID == 6
  return wField(p, t);
#elif WID == 7
  return wPrism(p, t);
#elif WID == 8
  return wLight(p, t);
#elif WID == 9
  return wMandala(p, t);
#else
  return vec3(0.);
#endif
}

// ═══ Процедурные миры: органические/физические семейства (генерируются на JS-стороне, worlds/generator.js) ═══
// Параметры uP[8] и два цвета (uColA/uColB) задают конкретный экземпляр внутри семейства — тот же
// набор примитивов (fbm/ridge/voro/hue/warp), что и у восьми авторских миров выше, но без зашитых чисел.
uniform int uGen, uFamily; uniform float uP[8]; uniform vec3 uColA, uColB;

// growth — дендритный/кристаллический/коралловый рост (родня Инея): uP 0 частота ветвления, 1 изрезанность,
// 2 скорость фронта роста, 3 масштаб шума деформации, 4 контраст прожилок
vec3 gGrowth(vec2 p, float t){
  float r = length(p), a = atan(p.y, p.x);
  float w = fbm(p * uP[3] + 1.7);
  float veins = ridge(vec2(a * uP[0] * .1 + w * 1.5, log(r + .03) * 1.6 - t * .01));
  float rays = pow(abs(sin(a * uP[0] + w * uP[1] + fbm(vec2(r * 6., a * 2.)) * 5.)), 6.) * smoothstep(.04, .3, r);
  float fine = ridge(p * 16. + w * 3.);
  float front = .3 + min(t * uP[2], 1.3) + .2 * (fbm(vec2(a * 3., t * .02)) - .5);
  float grown = smoothstep(front + .06, front - .06, r);
  vec3 bright = mix(mix(uColA, vec3(1.), .3), uColB, smoothstep(0., .6, r));
  vec3 ice = mix(bright, uColB * .12, max(smoothstep(.4, .75, veins), rays * .8) * smoothstep(.02, .2, r) * uP[4]);
  ice += uColA * pow(fine, 4.) * .35;
  vec3 dark = uColB * .1 + uColA * .12 * (pow(fine, 3.) * .5 + smoothstep(.45, .9, veins) * .35);
  return mix(dark, ice, grown);
}
// flow — турбулентная плазма/газ/жидкость (родня Туманности/Короны): uP 0 частота деформации, 1 скорость,
// 2 масштаб гребней, 3 турбулентность верхнего слоя, 4 сила центрального свечения
vec3 gFlow(vec2 p, float t){
  float r = length(p);
  vec2 q = warp(p * uP[0], t * (uP[1] * 20.));
  float s1 = ridge(q * uP[2] + t * .02), s2 = ridge(q * uP[2] * 2.1 - t * .03 * uP[3]);
  vec3 col = (uColA * pow(s1, 2.) * .9 + uColB * pow(s2, 3.) * .6 * uP[3]) * smoothstep(1., .08, r);
  col += mix(uColA, uColB, .5) * .012 * uP[4] / (r * r + .006);
  return col;
}
// membrane — клеточная/органическая мембрана, прогорание или растрескивание (родня Пламени): uP 0 масштаб
// клеток, 1 базовый радиус прогара, 2 скорость пульсации прогара, 3 ширина светящейся кромки, 4 частота волокон
vec3 gMembrane(vec2 p, float t){
  float r = length(p), a = atan(p.y, p.x);
  float paper = fbm(p * uP[0] + t * .01);
  vec3 col = mix(uColA, uColB * .4, smoothstep(.3, .75, paper + r * .4));
  float fib = pow(abs(sin(a * uP[4] * 10. + fbm(p * 5.) * 8.)), 18.) * smoothstep(.9, .05, r);
  col += mix(uColA, vec3(1.), .4) * fib * .5;
  float d1 = voro(p * uP[0] + 7.).x + (fbm(p * 9.) - .5) * .16;
  float rr = uP[1] + .2 * (.5 + .5 * sin(t * uP[2] + fbm(p * .7) * 6.));
  float hole = smoothstep(rr, rr - .03, d1);
  float rim = exp(-abs(d1 - rr) / uP[3]) * smoothstep(.04, .08, rr);
  col = mix(col, uColB * .05, hole);
  col += mix(uColA, uColB, .3) * rim * 1.3;
  return col;
}
// pulse — биолюминесцентные волны и кольца (родня Света): uP 0 скорость кольца, 1 ширина кольца,
// 2 сила центрального свечения, 3 доля радужного дрейфа оттенка, 4 доля заполнения
vec3 gPulse(vec2 p, float t){
  float r = length(p);
  float fill = smoothstep(0., 25., t) * uP[4];
  vec3 rings = mix(uColA * .4, hue(r * 2.5 - t * uP[0] * 5. + uP[3]) * .5 + .5, uP[3]);
  vec3 col = mix(rings * .4 * smoothstep(1.1, 0., r) + .05, mix(uColA, uColB, .5), fill * .5);
  float ph = fract(t * uP[0]), ringR = ph * 1.1;
  col += uColB * exp(-abs(r - ringR) / uP[1]) * (1. - ph) * .7;
  col += mix(uColA, uColB, .5) * uP[2] / (r * r + .02);
  return col;
}
// web — сеть трещин/электрических разрядов по всему кадру, не только у центра (родня Инея, но не радиальная):
// uP 0 масштаб ячеек, 1 толщина линий, 2 скорость дрейфа сети, 3 яркость свечения краёв, 4 доля второго, более мелкого слоя
vec3 gWeb(vec2 p, float t){
  vec2 q = p * uP[0] + vec2(t * uP[2] * .04, -t * uP[2] * .025);
  vec2 v = voro(q);
  float lines = exp(-(v.y - v.x) / uP[1]);
  vec2 v2 = voro(q * 2.3 + 11.);
  float lines2 = exp(-(v2.y - v2.x) / (uP[1] * .55)) * uP[4];
  float e = min(1., lines + lines2);
  vec3 col = mix(uColA * .07, uColB, e);
  col += mix(uColA, vec3(1.), .5) * (pow(lines, 2.) + pow(lines2, 2.)) * uP[3];
  return col;
}
// foam — колония клеток/пузырей на весь кадр, со светящимися стенками (родня Мембраны, но без одной дыры):
// uP 0 масштаб клеток, 1 ширина стенки, 2 скорость дрейфа, 3 контраст заполнения, 4 сила блика в центре клетки
vec3 gFoam(vec2 p, float t){
  vec2 q = p * uP[0] + vec2(sin(t * uP[2] * .05) * .35, cos(t * uP[2] * .04) * .35);
  vec2 v = voro(q);
  float wall = smoothstep(uP[1] * 1.6, 0., v.y - v.x);
  float bulge = smoothstep(.5, 0., v.x);
  vec3 col = mix(uColA * .15, mix(uColA, uColB, .5), bulge * uP[3]);
  col += mix(uColB, vec3(1.), .4) * wall;
  col += uColA * pow(bulge, 6.) * uP[4];
  return col;
}
// ripple — расходящиеся кольца от нескольких источников, как капли в пруду (родня Пульса, но многоцентровая):
// uP 0 доля числа источников (2..4), 1 частота колец, 2 скорость, 3 радиус затухания к краю, 4 яркость колец
vec3 gRipple(vec2 p, float t){
  vec3 col = vec3(0.); int N = 2 + int(uP[0] * 2.);
  for (int i = 0; i < 4; i++){
    if (i >= N) break;
    float fi = float(i);
    vec2 c = .45 * vec2(cos(fi * 2.4 + 1.), sin(fi * 3.1 + 2.));
    float d = length(p - c);
    float ph = fract(d * uP[1] * 2.5 - t * uP[2] * .6);
    float ring = exp(-abs(ph - .5) * 6.) * exp(-d * 1.1);
    col += mix(uColA, uColB, fract(fi * .5)) * ring;
  }
  col *= uP[4];
  col += mix(uColA, uColB, .5) * .01 / (dot(p, p) + .03);
  col *= smoothstep(1.3, uP[3], length(p));
  return col;
}
// aurora — вертикальные светящиеся занавесы, колышутся и дрейфуют вбок (родня Поля, но однонаправленная):
// uP 0 доля числа занавесов (2..4), 1 частота волнистости, 2 скорость дрейфа, 3 ширина занавеса, 4 частота мерцания
float curtain(vec2 p, float t, float k, float freq, float width){
  float x = p.x + .5 * sin(p.y * freq * 3. + t * .06 + k) + .2 * (fbm(vec2(p.y * .6 + k, t * .02)) - .5);
  return exp(-abs(x) / width);
}
vec3 gAurora(vec2 p, float t){
  vec3 col = vec3(0.); int N = 2 + int(uP[0] * 3.);
  for (int i = 0; i < 5; i++){
    if (i >= N) break;
    float fi = float(i), k = fi * 3.7;
    float band = curtain(p - vec2((fi - float(N - 1) * .5) * .5, 0.), t * uP[2], k, uP[1], uP[3]);
    float flick = .6 + .4 * sin(t * (1. + fi * .3) * uP[4] * 2. + fbm(vec2(p.y * 2. + k, t * .1)) * 4.);
    vec3 c = mix(uColA, uColB, fract(fi * .37));
    col += c * band * flick;
  }
  col *= smoothstep(0., .3, p.y + .9) * smoothstep(1.1, .2, length(p));
  return col;
}
vec3 worldGen(vec2 p, float t){
  vec3 c = vec3(0.);
#if GEN == 1
  c = gGrowth(p, t);
#elif GEN == 2
  c = gFlow(p, t);
#elif GEN == 3
  c = gMembrane(p, t);
#elif GEN == 4
  c = gPulse(p, t);
#elif GEN == 5
  c = gWeb(p, t);
#elif GEN == 6
  c = gFoam(p, t);
#elif GEN == 7
  c = gRipple(p, t);
#elif GEN == 8
  c = gAurora(p, t);
#endif
  return c * (.55 + .25 * uBreath);
}

// кривизна: мир закручивается и дышит вокруг центра, когда складка проходит сквозь него
vec2 bend(vec2 p, float amt, float t){
  float r = length(p);
  p = rot(amt * 1.4 * exp(-r * 1.8)) * p;
  return p * (1. + amt * .12 * sin(r * 9. - t * 2.5));
}

uniform vec3 uShake;   // дрожь камеры: сдвиг x, y и поворот

void main(){
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / min(uRes.x, uRes.y);
  p = rot(uShake.z) * p + uShake.xy;
  bool needPl = uA == 0 || (uB == 0 && uMix > .001) || uFold > .001 || uMicro.w > 0.;
  vec3 pl = needPl ? plasma(p, uTime) : vec3(0.);
  vec2 pw = bend(p, uFold, uTime);
  // активный мир кадра один (переход всегда идёт через Изнанку) — считаем его один раз
  bool aw = uA != 0, bw = uB != 0;
  vec3 W = vec3(0.);
  if ((aw && uMix < .999) || (bw && uMix > .001)){ float tw = aw ? uTimeA : uTimeB; W = uGen == 1 ? worldGen(pw, tw) : world(aw ? uA : uB, pw, tw); }
  vec3 col = uMix < .999 ? (aw ? W : pl) : vec3(0.);
  if (uMix > .001){
    // новая реальность проступает сквозь складки
    float n = fbm(p * 2.2 + uSeed * 7.) - .25 * dot(pl, vec3(.33));
    float m = smoothstep(n - .12, n + .12, uMix * 1.3 - .15);
    vec3 cb = bw ? W : pl;
    col = mix(col, cb, uMix > .999 ? 1. : m);
  }
  // во время перехода плазма проходит сквозь любой мир
  if (uA != 0 && uB != 0) col += pl * uFold;
  else col += pl * uFold * .5 * (1. - abs(uMix * 2. - 1.));
  // малая складка: в мире на миг проявляется изнанка и угасает
  if (uMicro.w > 0.){
    float life = sin(3.14159 * uMicro.z) * uMicro.w;
    float d = length(p - uMicro.xy);
    col = mix(col, pl * 1.4, smoothstep(.28, .02, d + (fbm(p * 5. + uSeed) - .5) * .15) * life);
  }
  col *= 1. + .25 * uPulse;
  col += vec3(1., .95, .9) * uIntro * .0012 / (dot(p, p) + .0006) * (.75 + .25 * sin(uTime * 1.8));
  // долгая выдержка: прошлый кадр тает и чуть стекает, как в видео
  vec2 c = vUv - .5;
  vec3 prev = fin(texture(uPrev, .5 + rot(.0012 * (1. + uEnergy)) * c * (1. - .002 * uBreath) + vec2(0., .0015)).rgb);
  col = max(fin(col), prev * uTrail);
  outColor = vec4(clamp(col, 0., 6.), 1.);
}`;

// вариант сцены: hub — только Изнанка; w1…w9 — авторские миры; g1…g8 — семейства процедурных
function sceneVariant(key) {
  const wid = key[0] === 'w' ? +key.slice(1) : 0, gen = key[0] === 'g' ? +key.slice(1) : 0;
  return SCENE.replace('#version 300 es\n', `#version 300 es\n#define WID ${wid}\n#define GEN ${gen}\n`);
}
const VARIANTS = ['w9', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'];

const POST = COMMON + `
uniform sampler2D uTex;
uniform float uDisp, uExposure, uFade, uFold, uPulse;
void main(){
  vec2 uv = vUv, c = uv - .5;
  // на пике разрыва кадр слегка стягивается к центру и расслаивается по цвету сильнее обычного —
  // так переход между мирами читается как настоящее искривление, а не просто наплыв
  vec2 uv2 = .5 + c * (1. - uFold * .045);
  vec2 d = c * (.003 + .004 * uDisp + .015 * uFold);
  vec3 col = fin(vec3(texture(uTex, uv2 + d).r, texture(uTex, uv2).g, texture(uTex, uv2 - d).b));
  // свечение: базовая мягкая дымка, как раньше, плюс отдельная добавка на подлинно ярких точках —
  // так блум не «замыливает» тёмные миры целиком, но горящие места получают настоящее кино-сияние
  vec3 b = vec3(0.); float ar = uRes.y / uRes.x;
  for (int i = 0; i < 8; i++){
    float a = float(i) * .785 + .3;
    vec2 o = vec2(cos(a) * ar, sin(a));
    vec3 s1 = texture(uTex, uv2 + o * .012).rgb, s2 = texture(uTex, uv2 + o * .032).rgb;
    float w1 = smoothstep(.35, 1.15, dot(s1, vec3(.33))), w2 = smoothstep(.35, 1.15, dot(s2, vec3(.33)));
    b += s1 * (1. + w1 * 1.8) + s2 * (1. + w2 * 1.8);
  }
  col += fin(b) / 16. * .55;
  col = 1. - exp(-col * 1.25 * uExposure);
  // лёгкая киношная раскладка тона: тени чуть холоднее, света чуть теплее
  float lum = dot(col, vec3(.33));
  col = mix(col * vec3(.94, .97, 1.05), col * vec3(1.06, 1.01, .93), smoothstep(.12, .85, lum));
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.) - .5) * .012;
  col *= smoothstep(1.25, .35, length(c * vec2(uRes.x / uRes.y, 1.))) * (1. + .1 * uPulse);
  outColor = vec4(max(col, 0.) * uFade, 1.);
}`;

// Рендер: сцена (миры + разрыв + долгая выдержка) в ping-pong буфер, затем оптика (свечение, линза) на экран.

// Компиляция/линковка запускаются сразу (это ставит задачу драйверу, само по себе не блокирует),
// а проверка статуса и выборка uniform-локаций — только когда драйвер действительно готов (finalize).
// Так первый вход в Изнанку не подвешивает клик: на реальных GPU-драйверах (в отличие от SwiftShader)
// компиляция большого разветвлённого шейдера может занимать заметное время — раньше это ожидание
// стояло прямо в mount(), синхронно, внутри обработчика клика.
function program(gl, fs) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const p = gl.createProgram();
  const vs = sh(gl.VERTEX_SHADER, VERT), fsh = sh(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, vs); gl.attachShader(p, fsh);
  gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
  return { p, vs, fsh, loc: null };
}
function finalize(gl, prog) {
  if (!gl.getShaderParameter(prog.vs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(prog.vs));
  if (!gl.getShaderParameter(prog.fsh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(prog.fsh));
  if (!gl.getProgramParameter(prog.p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog.p));
  const loc = {};
  const n = gl.getProgramParameter(prog.p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(prog.p, i); const name = u.name.replace('[0]', ''); loc[name] = { at: gl.getUniformLocation(prog.p, u.name), type: u.type, size: u.size }; }
  prog.loc = loc;
}

function createVisualEngine(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2');
  const half = !!gl.getExtension('EXT_color_buffer_float');
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  // Сцена — набор небольших программ-вариантов (Изнанка + один мир), а не одна огромная: см. shaders.js.
  // Первой собирается чистая Изнанка (≈ 0,6 с даже на встроенной Intel под D3D11), остальные — в фоне по очереди.
  let post, progs = {}, queue = [], broken = false;
  function boot() {
    post = program(gl, POST); progs = {}; broken = false;
    progs.h = Object.assign(program(gl, sceneVariant('h')), { st: 0 });
    queue = VARIANTS.slice();
  }
  boot();
  // st: 0 — компилируется, 1 — готова, −1 — не собралась
  function check(pr) {
    if (pr.st) return pr.st;
    if (parallel && !gl.getProgramParameter(pr.p, parallel.COMPLETION_STATUS_KHR)) return 0;
    try { finalize(gl, pr); pr.st = 1; } catch (e) { console.error('[iznanka] shader variant failed:', e); pr.st = -1; }
    return pr.st;
  }
  function want(key) {
    if (!progs[key]) { progs[key] = Object.assign(program(gl, sceneVariant(key)), { st: 0 }); queue = queue.filter((k) => k !== key); }
    return progs[key];
  }
  // фоновая сборка: по одной программе за раз и только с расширением параллельной компиляции —
  // без него каждая сборка блокирует кадр, тогда варианты собираются лишь по требованию
  function pump() {
    if (!parallel || !queue.length) return;
    for (const k in progs) if (!progs[k].st) return;
    want(queue[0]);
  }
  let postOk = false;
  function pollReady() {
    if (broken) return false;
    if (!postOk) {
      if (parallel && !gl.getProgramParameter(post.p, parallel.COMPLETION_STATUS_KHR)) return false;
      try { finalize(gl, post); postOk = true; } catch (e) { console.error('[iznanka] shader compile/link failed:', e); broken = true; return false; }
    }
    const h = check(progs.h);
    if (h < 0) broken = true;
    return h === 1;
  }
  function initGeometry() {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }
  initGeometry();
  // Потеря контекста WebGL (сон ноутбука, смена видеокарты, сброс драйвера по таймауту) тоже даёт
  // ровно такую же картину — чёрный экран при живом звуке. Такой сброс почти всегда временный:
  // браузер сам уведомляет о восстановлении, и тогда пересоздаём программы, геометрию и буферы заново
  // (все GL-объекты из потерянного контекста недействительны, даже если сам `gl` — тот же JS-объект).
  let lost = false;
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); postOk = false; broken = false; lost = true; console.warn('[iznanka] webgl context lost'); }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    postOk = false; boot();
    initGeometry();
    w = 0; h = 0; targets = []; resize();
  }, false);

  let targets = [], w = 0, h = 0, scale = matchMedia('(pointer: coarse)').matches ? 0.5 : 0.7, ping = 0;
  function makeTarget() {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, half ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb };
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const cw = Math.round(innerWidth * dpr), ch = Math.round(innerHeight * dpr);
    canvas.width = cw; canvas.height = ch;
    const nw = Math.max(64, Math.round(cw * scale)), nh = Math.max(64, Math.round(ch * scale));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    targets.forEach((t) => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); });
    targets = [makeTarget(), makeTarget()];
  }
  resize(); addEventListener('resize', resize);

  function set(prog, u) {
    for (const k in u) {
      const l = prog.loc[k]; if (!l) continue;
      const v = u[k];
      if (l.type === gl.INT || l.type === gl.SAMPLER_2D) gl.uniform1i(l.at, v);
      else if (l.type === gl.FLOAT) l.size > 1 ? gl.uniform1fv(l.at, v) : gl.uniform1f(l.at, v);
      else if (l.type === gl.FLOAT_VEC2) gl.uniform2fv(l.at, v);
      else if (l.type === gl.FLOAT_VEC3) gl.uniform3fv(l.at, v);
      else if (l.type === gl.FLOAT_VEC4) gl.uniform4fv(l.at, v);
    }
  }

  // адаптивное качество: если кадр долгий — снижаем разрешение сцены
  let slow = 0;
  function adapt(dt) {
    slow = dt > 0.045 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 90 && scale > 0.3) { scale *= 0.8; slow = 0; w = 0; resize(); }
  }

  function render(u, dt) {
    // пока шейдер ещё компилируется на драйвере — просто не рисуем кадр; канвас и так чёрный
    // (CSS-фон .izc), поэтому пауза читается как продолжение затемнения при входе, а не как зависание
    if (!pollReady()) return;
    pump();
    // какой мир в кадре: тот из A/B, что не Изнанка; пока его вариант собирается — показываем чистую Изнанку
    const aw = u.uA !== 0, bw = u.uB !== 0, key = !aw && !bw ? 'h' : u.uGen ? 'g' + u.uFamily : 'w' + (aw ? u.uA : u.uB);
    let scene = progs.h;
    if (key !== 'h') { const pr = want(key); if (check(pr) === 1) scene = pr; else u = { ...u, uA: 0, uB: 0, uMix: 0 }; }
    adapt(dt);
    const src = targets[ping], dst = targets[1 - ping];
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.viewport(0, 0, w, h);
    gl.useProgram(scene.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.tex);
    set(scene, { ...u, uPrev: 0, uRes: [w, h] });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(post.p);
    gl.bindTexture(gl.TEXTURE_2D, dst.tex);
    set(post, { ...u, uTex: 0, uRes: [canvas.width, canvas.height] });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ping = 1 - ping;
  }
  // чистый лист: долгая выдержка тянет прошлые кадры через ping-pong, поэтому при каждом входе буферы обнуляются
  function reset() {
    if (lost) return;
    targets.forEach((t) => { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  function dispose() { removeEventListener('resize', resize); }
  // заранее собрать мир, в который вот-вот пойдём
  function prefetch(key) { if (key && key !== 'h' && !lost) want(key); }
  return { render, resize, reset, dispose, prefetch, get lost() { return lost; }, get broken() { return broken; } };
}

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

return IZAPI;
})();


