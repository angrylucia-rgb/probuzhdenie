// Пресеты миров. Новый мир: запись здесь (idx = номер case в world() шейдера) + id в ORDER (core/journey.js).
// Звук по референсам: глубокий дрон 32–55 Гц с чистым натуральным рядом обертонов, медленная пульсация,
// природная текстура (ветер, вода, огонь, гул) и природные события. Корни миров — пентатоника C–D–E–G–A,
// поэтому в Свете все тона сливаются в один согласный аккорд.
export const WORLDS = {
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
};
