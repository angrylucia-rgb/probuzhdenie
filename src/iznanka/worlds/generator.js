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

export function generateWorld(seed) {
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
