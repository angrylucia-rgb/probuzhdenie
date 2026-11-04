/* ---------- музыка ---------- */
const Music = (() => {
  let ac = null, master, bus, pad = [], timer = null, on = false, root = NOTES[0], deg = 3, padGate = null, om = null, omOn = false, omTimer = null;
  const PENTA = [0,2,4,7,9,12,14,16];
  function impulse(sec, decay){ const len = Math.floor(ac.sampleRate*sec), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++){ const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1)*Math.pow(1 - i/len, decay); } return b; }
  function init(){
    const A = window.AudioContext || window.webkitAudioContext; ac = new A();
    master = ac.createGain(); master.gain.value = 0;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ac.destination);
    const rev = ac.createConvolver(); rev.buffer = impulse(5.5, 2.4);
    const wet = ac.createGain(); wet.gain.value = .6; const dry = ac.createGain(); dry.gain.value = .55;
    rev.connect(wet); wet.connect(master); dry.connect(master);
    bus = ac.createGain(); bus.connect(rev); bus.connect(dry);
    const padBus = ac.createGain(); padBus.gain.value = .13;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 850; lp.Q.value = .8;
    const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = .045; lfoG.gain.value = 320; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
    const sw = ac.createOscillator(), swG = ac.createGain(); sw.frequency.value = .1; swG.gain.value = .045; sw.connect(swG); swG.connect(padBus.gain); sw.start();
    padGate = ac.createGain(); padGate.gain.value = omOn ? 0 : 1;
    padBus.connect(lp); lp.connect(padGate); padGate.connect(bus);
    [1, 1.5, 2, 3].forEach((r, k) => [-7, 7].forEach(det => {
      const o = ac.createOscillator(); o.type = k === 0 ? "sine" : "triangle"; o.detune.value = det; o.frequency.value = root*r;
      const g = ac.createGain(); g.gain.value = [.26,.13,.08,.035][k]; o.connect(g); g.connect(padBus); o.start(); pad.push([o, r]); }));
  }
  function setRoot(f){ root = f; const t = ac.currentTime; pad.forEach(([o, r]) => o.frequency.setTargetAtTime(f*r, t, 1.4)); }
  function bell(freq, t, vel){
    const o = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
    o.frequency.value = freq; m.frequency.value = freq*3.5;
    mg.gain.setValueAtTime(freq*1.1*vel, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.8);
    m.connect(mg); mg.connect(o.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.14*vel, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + 4.8);
    o.connect(g); g.connect(bus); o.start(t); m.start(t); o.stop(t + 5); m.stop(t + 5);
  }
  function bowl(freq, t, vol){ [1, 2.76, 5.4].forEach((p, k) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = freq*p; o.detune.value = (Math.random()-.5)*10;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime([.13,.05,.02][k]*(vol||1), t + .04); g.gain.exponentialRampToValueAtTime(.0001, t + 8 - k*1.8);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 8.2); }); }
  function whoosh(t, rise){ const len = Math.floor(ac.sampleRate*3.2), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random()*2-1;
    const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 2.5;
    f.frequency.setValueAtTime(rise ? 180 : 2600, t); f.frequency.exponentialRampToValueAtTime(rise ? 2600 : 180, t + 2.8);
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.09, t + 1.1); g.gain.exponentialRampToValueAtTime(.0001, t + 3.1);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + 3.2); }
  // протяжный «Ом»: пила 136,1 Гц через форманты «А → У», затем гудение «М»
  function omInit(){
    const g = ac.createGain(); g.gain.value = 0; g.connect(bus);
    const f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), lpm = ac.createBiquadFilter();
    f1.type = f2.type = "bandpass"; f1.Q.value = 7; f2.Q.value = 9; lpm.type = "lowpass"; lpm.frequency.value = 320; lpm.Q.value = .7;
    const g1 = ac.createGain(), g2 = ac.createGain(), gm = ac.createGain(), gs = ac.createGain();
    g1.gain.value = g2.gain.value = gm.gain.value = gs.gain.value = 0;
    [0, 7, -5].forEach(det => { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = 136.1; o.detune.value = det; o.connect(f1); o.connect(f2); o.connect(lpm); o.start(); });
    const sub = ac.createOscillator(); sub.frequency.value = 68.05; sub.connect(gs); sub.start();
    f1.connect(g1); f2.connect(g2); lpm.connect(gm); [g1, g2, gm, gs].forEach(x => x.connect(g));
    om = { g, f1, f2, g1, g2, gm, gs };
  }
  function omCycle(){
    if (!on || !omOn) return;
    const t = ac.currentTime + .05, { g, f1, f2, g1, g2, gm, gs } = om;
    [g.gain, f1.frequency, f2.frequency, g1.gain, g2.gain, gm.gain, gs.gain].forEach(a => a.cancelScheduledValues(t));
    g.gain.setTargetAtTime(.22, t, 1.2);
    f1.frequency.setValueAtTime(700, t); f2.frequency.setValueAtTime(1120, t);
    f1.frequency.setTargetAtTime(420, t + 2.2, .9); f2.frequency.setTargetAtTime(780, t + 2.2, .9);
    g1.gain.setTargetAtTime(.9, t, .6); g2.gain.setTargetAtTime(.32, t, .6);
    g1.gain.setTargetAtTime(0, t + 5.4, .9); g2.gain.setTargetAtTime(0, t + 5.2, .7);
    gm.gain.setTargetAtTime(0, t, .2); gm.gain.setTargetAtTime(.7, t + 5.1, .9);
    gs.gain.setTargetAtTime(.35, t, 1.5);
    g.gain.setTargetAtTime(0, t + 10.4, 1.1);
    omTimer = setTimeout(omCycle, 13600);
  }
  function omSet(v){
    omOn = v; if (!ac) return;
    clearTimeout(omTimer);
    const t = ac.currentTime;
    padGate.gain.setTargetAtTime(v ? 0 : 1, t, v ? .8 : 1.6);
    if (v && on){ if (!om) omInit(); omCycle(); }
    else if (om){ om.g.gain.cancelScheduledValues(t); om.g.gain.setTargetAtTime(0, t, .9); }
  }
  function tick(){
    if (!on) return;
    if (omOn){ timer = setTimeout(tick, 2000); return; }
    const t = ac.currentTime + .05;
    deg = clamp(deg + [-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)], 0, PENTA.length - 1);
    const f = root*2*Math.pow(2, PENTA[deg]/12);
    bell(f, t, .55 + Math.random()*.4);
    if (Math.random() < .3) bell(root*2*Math.pow(2, PENTA[Math.max(0, deg - 2)]/12), t + .8 + Math.random()*.4, .4);
    if (Math.random() < .12) bell(f*2, t + 1.9, .25);
    timer = setTimeout(tick, 1700 + Math.random()*2300);
  }
  /* ---- голос планеты ----------------------------------------------------
     Адаптация того, как звучат сонификации плазменных волн и радиоизлучения: свистящие атмосферики
     Юпитера и Нептуна (Вояджеры, Юнона), шелест и щелчки колец Сатурна (Кассини), низкий гул
     ионосферы Венеры (Паркер), ветер Марса (InSight), хоровые волны Земли. Это синтез по характеру
     записей, а не сами записи: несколько строк кода вместо мегабайт звука, и зацикливается без шва */
  let pvc = null, pvTimer = null, nbuf = null;
  function noiseBuf(){ if (nbuf) return nbuf;
    const len = ac.sampleRate*3, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let v = 0; for (let i = 0; i < len; i++){ v = v*.94 + (Math.random()*2 - 1)*.06; d[i] = v*3.2; }
    nbuf = b; return b; }
  function glide(t, f0, f1, dur, vol, type){
    if (!pvc) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur*.14);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(pvc.g); o.start(t); o.stop(t + dur + .05); }
  function planetStop(){
    if (pvTimer){ clearTimeout(pvTimer); pvTimer = null; }
    if (!pvc) return;
    const c = pvc, t = ac.currentTime; pvc = null;
    c.g.gain.cancelScheduledValues(t); c.g.gain.setTargetAtTime(.0001, t, .45);
    setTimeout(() => { c.nodes.forEach(n => { try { n.stop(); } catch(e){} }); try { c.g.disconnect(); } catch(e){} }, 2600); }
  function planetStart(c){
    planetStop();
    const t = ac.currentTime, g = ac.createGain(); g.gain.value = .0001; g.connect(bus);
    const nodes = [];
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = c.cut; lp.Q.value = c.q; lp.connect(g);
    c.parts.forEach((r, k) => { const o = ac.createOscillator(); o.type = c.wave;
      o.frequency.value = root*c.base*r; o.detune.value = (k - .5)*c.det;
      const og = ac.createGain(); og.gain.value = c.lvl/(k + 1);
      o.connect(og); og.connect(lp); o.start(t); nodes.push(o); });
    if (c.noise){
      const src = ac.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = c.nf; bp.Q.value = c.nq;
      const ng = ac.createGain(); ng.gain.value = c.noise;
      src.connect(bp); bp.connect(ng); ng.connect(g); src.start(t); nodes.push(src);
      const lfo = ac.createOscillator(); lfo.frequency.value = c.nlfo;
      const la = ac.createGain(); la.gain.value = c.nf*c.nsw;
      lfo.connect(la); la.connect(bp.frequency); lfo.start(t); nodes.push(lfo); }
    g.gain.exponentialRampToValueAtTime(c.vol, t + 1.7);
    pvc = { g, nodes, c };
    const f0 = root*c.base;
    const fire = () => {
      if (!pvc){ return; }
      if (on && !omOn){
        const tt = ac.currentTime + .05;
        if (c.ev === "whistle") glide(tt, f0*(6 + Math.random()*4), f0*(1.1 + Math.random()), .9 + Math.random()*.8, .10);
        else if (c.ev === "chirp") glide(tt, f0*1.4, f0*(5 + Math.random()*3), .45 + Math.random()*.3, .075);
        else if (c.ev === "bell") bell(f0*(3 + Math.floor(Math.random()*3)), tt, .20);
        else if (c.ev === "click") for (let k = 0; k < 3; k++) bell(f0*(6 + Math.random()*6), tt + k*.11*Math.random(), .06);
        else if (c.ev === "gust") glide(tt, f0*.95, f0*.55, 2.2, .09, "triangle"); }
      pvTimer = setTimeout(fire, c.every*1000*(.6 + Math.random()*.9)); };
    pvTimer = setTimeout(fire, 900); }

  /* ---- голоса станций (новый блок, этап 4, подэтап 11а) ------------------------------------------
     У каждой станции — тихий фон из настоящих чисел (● / ◐) или честный символ (○) и короткая фраза
     при прибытии. Фоны перетекают друг в друга; играют поверх пэда и колокольчиков. Тоники — по кругу
     квинт (NOTES). Всё — синтез: несколько генераторов на станцию, без звуковых файлов. */
  let vcur = null, vkey = "", vPend = 0, clickBuf = null;
  const VVOL = .9;
  function vOsc(f, type, g, dest, det){ const o = ac.createOscillator(); o.type = type || "sine"; o.frequency.value = f; if (det) o.detune.value = det;
    const gg = ac.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(dest); o.start(); return { o, g: gg }; }
  function vNoise(dest, g, type, freq, q){ const s = ac.createBufferSource(); s.buffer = noiseBuf(); s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type || "lowpass"; f.frequency.value = freq || 800; f.Q.value = q || .7;
    const gg = ac.createGain(); gg.gain.value = g; s.connect(f); f.connect(gg); gg.connect(dest); s.start(); return { s, f, g: gg }; }
  function vLfo(param, rate, depth){ const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(param); l.start(); return l; }
  function vGlide(t, f0, f1, dur, vol, type, dest, expo){
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type || "sine";
    o.frequency.setValueAtTime(f0, t); if (expo) o.frequency.exponentialRampToValueAtTime(f1, t + dur); else o.frequency.linearRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.08, dur*.2)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest || bus); o.start(t); o.stop(t + dur + .05); }
  function vClick(t, vol, dest, pan){
    if (!clickBuf){ const n = Math.floor(ac.sampleRate*.012); clickBuf = ac.createBuffer(1, n, ac.sampleRate); const d = clickBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 6); }
    const s = ac.createBufferSource(); s.buffer = clickBuf; const f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1800;
    const g = ac.createGain(); g.gain.value = vol; const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
    s.connect(f); f.connect(g); if (p){ p.pan.value = pan || 0; g.connect(p); p.connect(dest || bus); } else g.connect(dest || bus); s.start(t); }
  function vThump(t, f, vol, dest){ const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f*1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + .06);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + .22);
    o.connect(g); g.connect(dest || bus); o.start(t); o.stop(t + .25); }
  // фоны: (k — тоника станции, out — выход фона) → { stop() }
  const BED = {
    // II · пластина Хладни: тон резонанса и медленные биения соседней моды
    1: (k, out) => { const a = [vOsc(k*4, "sine", .045, out), vOsc(k*4*1.0035, "sine", .035, out), vOsc(k*4*2.3, "sine", .01, out)]; return { stop: () => a.forEach(x => x.o.stop()) }; },
    // III · «звук Большого взрыва»: пики реликтового излучения ℓ ≈ 220 : 540 : 810 → 1 : 2,45 : 3,68, медленно сползают вниз, как в сонификации Уиттла
    2: (k, out) => { const n = vNoise(out, .09, "lowpass", 240), r = [1, 2.45, 3.68], a = r.map((x, j) => vOsc(k/2*x, "sine", [.05, .028, .018][j], out, (Math.random() - .5)*8));
      let up = true; const iv = setInterval(() => { const t = ac.currentTime; a.forEach((x, j) => x.o.frequency.setTargetAtTime(k/2*r[j]*(up ? .94 : 1), t, 9)); up = !up; }, 20000);
      return { stop: () => { clearInterval(iv); n.s.stop(); a.forEach(x => x.o.stop()); } }; },
    // IV · Галактика: искры сканируют небо слева направо — по мотивам сонификации центра Галактики (Chandra)
    3: (k, out) => { const d = vOsc(k, "sine", .015, out); const p = ac.createStereoPanner ? ac.createStereoPanner() : null; if (p) p.connect(out);
      const t0 = ac.currentTime; const iv = setInterval(() => { if (Math.random() < .55){ const t = ac.currentTime + .02, ph = ((t - t0)/12) % 1;
        if (p) p.pan.setValueAtTime(ph*2 - 1, t); vGlide(t, k*4*Math.pow(2, PENTA[Math.floor(Math.random()*PENTA.length)]/12), k*4*Math.pow(2, PENTA[Math.floor(Math.random()*PENTA.length)]/12)*1.002, .9, .03 + Math.random()*.03, "sine", p || out); } }, 320);
      return { stop: () => { clearInterval(iv); d.o.stop(); } }; },
    // V · Солнце: пятиминутные колебания (≈ 3 мГц, шаг мод ≈ 135 мкГц), ускоренные так, что центр лёг на тонику: гул с биениями
    4: (k, out) => { const sp = k/.0033, a = []; for (let j = -4; j <= 4; j++) a.push(vOsc((.0033 + j*.000135)*sp, "sine", .006 + Math.random()*.012, out));
      const n = vNoise(out, .025, "lowpass", 180); return { stop: () => { a.forEach(x => x.o.stop()); n.s.stop(); } }; },
    // VI · Земля: шумановский резонанс 7,83 Гц как пульс тона; вистлеры и «утренний хор» — естественное радио Земли в звуковом диапазоне
    5: (k, out) => { const am = ac.createGain(); am.gain.value = .5; am.connect(out); const o = vOsc(k, "sine", .05, am); const l = vLfo(am.gain, 7.83, .45);
      const iv = setInterval(() => { const t = ac.currentTime + .05, r = Math.random();
        if (r < .35) vGlide(t, 5200, 1300, 1.1 + Math.random()*.5, .018, "sine", out, true);
        else if (r < .55) for (let j = 0; j < 4; j++) vGlide(t + j*.17, 1700 + Math.random()*300, 3000 + Math.random()*600, .22, .008, "sine", out, true); }, 3200);
      return { stop: () => { clearInterval(iv); o.o.stop(); l.stop(); } }; },
    // VII · Человек: сердце ≈ 60 ударов в минуту и дыхание 6 раз в минуту (0,1 Гц) — ритм практики «дыхание сердца»
    6: (k, out) => { const br = ac.createGain(); br.gain.value = .5; br.connect(out); const n = vNoise(br, .05, "bandpass", 700, .9); const l = vLfo(br.gain, .1, .5);
      const iv = setInterval(() => { const t = ac.currentTime + .05; vThump(t, 52, .13, out); vThump(t + .28, 45, .08, out); }, 1000);
      return { stop: () => { clearInterval(iv); n.s.stop(); l.stop(); } }; },
    // VIII · Клетка: тонкий гул ≈ 1,6 кГц — колебания стенки дрожжевой клетки (Gimzewski, 2004, спорно) и стеклянный тон
    7: (k, out) => { const tr = ac.createGain(); tr.gain.value = .6; tr.connect(out); const o = vOsc(k*2, "triangle", .03, tr); const l = vLfo(tr.gain, 4, .25);
      const y = vOsc(1600, "sine", .0035, out); const l2 = vLfo(y.g.gain, .3, .002);
      return { stop: () => { o.o.stop(); l.stop(); y.o.stop(); l2.stop(); } }; },
    // IX · Атом: серия Бальмера водорода — 656,3 / 486,1 / 434,0 / 410,2 нм → частоты 1 : 1,350 : 1,512 : 1,600
    8: (k, out) => { const a = BALMER.map((x, j) => vOsc(k*2*x, "sine", [.035, .022, .016, .012][j], out, (Math.random() - .5)*4)); return { stop: () => a.forEach(x => x.o.stop()) }; },
    // X · Кванты: щелчки детектора в случайные моменты (процесс Пуассона, в среднем ~1,7 в секунду)
    9: (k, out) => { const d = vOsc(k*2, "sine", .008, out); let tm = 0, live = true;
      const next = () => { if (!live) return; vClick(ac.currentTime + .02, .07 + Math.random()*.05, out, Math.random()*1.6 - .8); tm = setTimeout(next, -Math.log(1 - Math.random())*600); }; next();
      return { stop: () => { live = false; clearTimeout(tm); d.o.stop(); } }; },
    // XI · Вакуум: шум с плывущим фильтром — символ флуктуаций (○)
    10: (k, out) => { const n = vNoise(out, .04, "bandpass", 900, .6); const l = vLfo(n.f.frequency, .03, 700); return { stop: () => { n.s.stop(); l.stop(); } }; }
  };
  // ---- голоса ключевых слоёв (11б): ключ "jId:L" (для чёрной дыры — вся ветка) ----
  const LBED = {
    // ядро Солнца: g-моды — колебания самой глубины с периодами в часы; надёжно не обнаружены (◐)
    "g4:11": (k, out) => { const am = ac.createGain(); am.gain.value = .5; am.connect(out); const a = [vOsc(k/4, "sine", .09, am), vOsc(k/4*1.5, "sine", .03, am)]; const l = vLfo(am.gain, .25, .4);
      const n = vNoise(out, .05, "lowpass", 90); return { stop: () => { a.forEach(x => x.o.stop()); l.stop(); n.s.stop(); } }; },
    // магнитосфера: «хор» — волны в радиационных поясах (Van Allen Probes) звучат прямо в звуковом диапазоне
    "earth:2": (k, out) => { const iv = setInterval(() => { const t = ac.currentTime + .03; for (let j = 0; j < 3 + Math.floor(Math.random()*4); j++) vGlide(t + j*(.12 + Math.random()*.1), 1500 + Math.random()*500, 2800 + Math.random()*900, .2 + Math.random()*.1, .012, "sine", out, true); }, 900);
      const n = vNoise(out, .02, "bandpass", 2200, 1.2); return { stop: () => { clearInterval(iv); n.s.stop(); } }; },
    // ионосфера: шумановские резонансы 7,83 · 14,3 · 20,8 · 27,3 · 33,8 Гц, поднятые на 4 октавы (×16) — аккорд с настоящими отношениями
    "earth:4": (k, out) => { const a = [7.83, 14.3, 20.8, 27.3, 33.8].map((f, j) => vOsc(f*16, "sine", [.04, .028, .02, .014, .01][j], out, (Math.random() - .5)*6));
      const l = vLfo(out.gain, 7.83, .12); return { stop: () => { a.forEach(x => x.o.stop()); l.stop(); } }; },
    // чёрная дыра: волны давления в скоплении Персея — си-бемоль на 57 октав ниже до первой октавы; подняты обратно (B♭3 ≈ 233 Гц)
    "bh": (k, out) => { const f = 233.08, am = ac.createGain(); am.gain.value = .5; am.connect(out); const a = [vOsc(f/2, "sine", .07, am), vOsc(f, "sine", .04, am, 4), vOsc(f*1.5, "sine", .015, am, -5)];
      const l = vLfo(am.gain, .18, .45); const n = vNoise(out, .04, "lowpass", 140); return { stop: () => { a.forEach(x => x.o.stop()); l.stop(); n.s.stop(); } }; },
    // Луна · приливы: два прилива в сутки — период 12 ч 25 мин, сжатый до 12,4 секунды
    "moon:2": (k, out) => { const sw = ac.createGain(); sw.gain.value = .5; sw.connect(out); const n = vNoise(sw, .08, "lowpass", 420); const l = vLfo(sw.gain, 1/12.4, .5);
      return { stop: () => { n.s.stop(); l.stop(); } }; },
    // Юпитер: декаметровое радиоизлучение — свисты и шорохи, которые слышали «Вояджеры» и «Юнона»
    "jup:0": (k, out) => { const n = vNoise(out, .03, "bandpass", 1200, 1.5); const iv = setInterval(() => { const t = ac.currentTime + .03; if (Math.random() < .6) vGlide(t, 900 + Math.random()*1800, 400 + Math.random()*600, .5 + Math.random()*.8, .016, "sine", out, true); }, 700);
      return { stop: () => { clearInterval(iv); n.s.stop(); } }; },
    // Человек · органы: сердце крупным планом — 60 ударов в минуту, «тук-тук» клапанов
    "human:7": (k, out) => { const iv = setInterval(() => { const t = ac.currentTime + .05; vThump(t, 48, .2, out); vThump(t + .3, 40, .13, out); }, 1000); return { stop: () => clearInterval(iv) }; },
    // нейроны: потенциалы действия как щелчки — так нейрофизиологи слушают клетки через динамик (Хьюбел и Визел)
    "human:10": (k, out) => { let live = true, tm = 0; const burst = () => { if (!live) return; const t = ac.currentTime + .02, n = Math.random() < .3 ? 4 + Math.floor(Math.random()*8) : 1;
        for (let j = 0; j < n; j++) vClick(t + j*(.012 + Math.random()*.02), .05 + Math.random()*.04, out, Math.random()*1.2 - .6); tm = setTimeout(burst, -Math.log(1 - Math.random())*260); }; burst();
      return { stop: () => { live = false; clearTimeout(tm); } }; },
    // молекула: колебания воды — валентные 3657 и 3756 см⁻¹, деформационное 1595 см⁻¹ (≈ 10¹⁴ Гц), опущенные на ~40 октав
    "g7:1": (k, out) => { const a = [1595, 3657, 3756].map((w, j) => vOsc(k*2*w/1595, "sine", [.04, .022, .016][j], out)); return { stop: () => a.forEach(x => x.o.stop()) }; },
    // опыт с двумя щелями: каждый щелчок — частица на экране; высота — место попадания, выпавшее по картине интерференции
    // ядро: счётчик Гейгера — распады в случайные моменты (процесс Пуассона), изредка — пачкой от космических лучей
    "g8:1": (k, out) => { let live = true, tm = 0; const d = vOsc(k, "sine", .006, out);
      const next = () => { if (!live) return; const t = ac.currentTime + .02; vClick(t, .09 + Math.random()*.05, out, Math.random()*1.4 - .7);
        tm = setTimeout(next, -Math.log(1 - Math.random())*420); }; next();
      return { stop: () => { live = false; clearTimeout(tm); d.o.stop(); } }; },
    "g9:2": (k, out) => { let live = true, tm = 0; const P = x => Math.pow(Math.cos(x*9.4), 2)*Math.pow(Math.sin(x*3.1 + 1e-6)/(x*3.1 + 1e-6), 2);
      const drop = () => { if (!live) return; let x; do { x = Math.random()*2 - 1; } while (Math.random() > P(x)); const t = ac.currentTime + .02;
        vGlide(t, k*4*Math.pow(2, x*1.2), k*4*Math.pow(2, x*1.2), .18, .03, "sine", out); vClick(t, .04, out, x*.9); tm = setTimeout(drop, -Math.log(1 - Math.random())*380); }; drop();
      return { stop: () => { live = false; clearTimeout(tm); } }; },
    // сон · засыпание: альфа 10 Гц медленно сменяется тетой 6 Гц — ритм пульсации тона
    "dream:0": (k, out) => { const am = ac.createGain(); am.gain.value = .5; am.connect(out); const o = vOsc(k, "sine", .045, am); const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 10; lg.gain.value = .4; l.connect(lg); lg.connect(am.gain); l.start();
      let a = true; const iv = setInterval(() => { l.frequency.setTargetAtTime(a ? 6 : 10, ac.currentTime, 3); a = !a; }, 9000); return { stop: () => { clearInterval(iv); o.o.stop(); l.stop(); } }; },
    // сон · быстрый сон: неровные всплески образов, глаза движутся под веками
    "dream:1": (k, out) => { const d = vOsc(k, "sine", .02, out); const iv = setInterval(() => { if (Math.random() < .5){ const t = ac.currentTime + .03; bell(k*2*Math.pow(2, PENTA[Math.floor(Math.random()*PENTA.length)]/12), t, .1); } }, 650);
      return { stop: () => { clearInterval(iv); d.o.stop(); } }; },
    // сон · глубокий: дельта-волны ≈ 1 Гц — медленное дыхание тишины
    "dream:3": (k, out) => { const am = ac.createGain(); am.gain.value = .5; am.connect(out); const a = [vOsc(k/2, "sine", .07, am), vOsc(k, "sine", .02, am)]; const l = vLfo(am.gain, 1, .45);
      return { stop: () => { a.forEach(x => x.o.stop()); l.stop(); } }; }
  };
  LBED["dream:2"] = LBED["dream:1"];
  // ---- «Биосфера»: тихие фоны эпох (ключ "bio:<среда>"), всё — синтез ----
  function vSwell(out, g, f, rate){ const sw = ac.createGain(); sw.gain.value = .5; sw.connect(out); const n = vNoise(sw, g, "lowpass", f); const l = vLfo(sw.gain, rate || .09, .45); return { stop: () => { n.s.stop(); l.stop(); } }; }
  function vEvery(ms, fn){ let live = true, tm = 0; const go = () => { if (!live) return; if (on && !omOn) fn(ac.currentTime + .03); tm = setTimeout(go, ms*(.5 + Math.random())); }; tm = setTimeout(go, ms*.5); return () => { live = false; clearTimeout(tm); }; }
  const BIOBED = {
    rock: (k, out) => { const n = vNoise(out, .05, "lowpass", 110), d = vOsc(k/4, "sine", .03, out); return { stop: () => { n.s.stop(); d.o.stop(); } }; },
    hadean: (k, out) => { const n = vNoise(out, .09, "lowpass", 90), d = vOsc(k/4, "sawtooth", .006, out), c = vEvery(700, t => { for (let j = 0; j < 2 + Math.floor(Math.random()*4); j++) vClick(t + j*.05*Math.random(), .03 + Math.random()*.03, out, Math.random()*1.6 - .8); });
      const m = vEvery(9000, t => vGlide(t, 1400, 300, 1.4, .02, "sine", out, true)); return { stop: () => { n.s.stop(); d.o.stop(); c(); m(); } }; },
    archean: (k, out) => { const s = vSwell(out, .07, 320), d = vOsc(k/2, "sine", .02, out), b = vEvery(2600, t => { for (let j = 0; j < 3; j++) vGlide(t + j*.15, 90 + Math.random()*40, 60, .4, .03, "sine", out); }); return { stop: () => { s.stop(); d.o.stop(); b(); } }; },
    goe: (k, out) => { const s = vSwell(out, .06, 360), d = vOsc(k/2, "sine", .018, out), b = vEvery(450, t => vGlide(t, 500 + Math.random()*500, 1100 + Math.random()*900, .12, .012, "sine", out, true)); return { stop: () => { s.stop(); d.o.stop(); b(); } }; },
    cells: (k, out) => { const a = [vOsc(k*2, "sine", .016, out, -4), vOsc(k*3, "sine", .01, out, 5)], s = vSwell(out, .03, 500, .05), b = vEvery(3800, t => bell(k*4*Math.pow(2, PENTA[Math.floor(Math.random()*5)]/12), t, .05)); return { stop: () => { a.forEach(x => x.o.stop()); s.stop(); b(); } }; },
    ice: (k, out) => { const w = vNoise(out, .07, "bandpass", 700, 1.4), l = vLfo(w.f.frequency, .06, 450), c = vEvery(7000, t => { vGlide(t, 140, 70, 1.2, .03, "triangle", out, true); vClick(t, .03, out, 0); }); return { stop: () => { w.s.stop(); l.stop(); c(); } }; },
    mat: (k, out) => { const s = vSwell(out, .05, 280, .06), d = vOsc(k/2, "sine", .02, out), b = vEvery(5200, t => bell(k*2, t, .05)); return { stop: () => { s.stop(); d.o.stop(); b(); } }; },
    sea: (k, out) => { const s = vSwell(out, .07, 420), b = vEvery(1600, t => { if (Math.random() < .5) vClick(t, .02, out, Math.random()*1.4 - .7); else vGlide(t, 300, 700, .18, .01, "sine", out, true); }); return { stop: () => { s.stop(); b(); } }; },
    swamp: (k, out) => { const w = vNoise(out, .04, "bandpass", 1600, .8), z = vEvery(11000, t => {   // далёкий гул крыльев меганевры — тихо и редко const o = ac.createOscillator(), g = ac.createGain(), am = ac.createOscillator(), ag = ac.createGain(); o.type = "triangle"; o.frequency.value = 120 + Math.random()*40; am.frequency.value = 28; ag.gain.value = .0012; am.connect(ag); ag.connect(g.gain);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.0025, t + .9); g.gain.exponentialRampToValueAtTime(.0001, t + 2.6); const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 600; o.connect(f); f.connect(g); g.connect(out); o.start(t); am.start(t); o.stop(t + 2.7); am.stop(t + 2.7); });
      const d = vEvery(2200, t => vGlide(t, 1800, 900, .08, .012, "sine", out, true)); return { stop: () => { w.s.stop(); z(); d(); } }; },
    desert: (k, out) => { const w = vNoise(out, .06, "bandpass", 900, .7), l = vLfo(w.f.frequency, .07, 600), l2 = vLfo(w.g.gain, .11, .03); return { stop: () => { w.s.stop(); l.stop(); l2.stop(); } }; }
  };
  ["reef", "coast", "shallow", "today"].forEach(w => BIOBED[w] = BIOBED.sea);
  ["triassic", "savanna", "steppe", "field"].forEach(w => BIOBED[w] = BIOBED.desert);
  BIOBED.forest = BIOBED.jungle = (k, out) => { const w = vNoise(out, .035, "bandpass", 1400, .7), l = vLfo(w.f.frequency, .05, 500), c = vEvery(1800, t => { for (let j = 0; j < 3; j++) vGlide(t + j*.09, 3200 + Math.random()*800, 2600 + Math.random()*600, .06, .006, "sine", out); }); return { stop: () => { w.s.stop(); l.stop(); c(); } }; };
  BIOBED.taiga = BIOBED.forest; BIOBED.tundra = BIOBED.ice; BIOBED.ocean = BIOBED.sea;
  BIOBED.deep = (k, out) => { const n = vNoise(out, .05, "lowpass", 70), d = vOsc(k/4, "sine", .022, out), p = vEvery(4200, t => { if (Math.random() < .6) bell(k*4*Math.pow(2, PENTA[Math.floor(Math.random()*PENTA.length)]/12), t, .05); else vGlide(t, 900, 400, 1.6, .008, "sine", out, true); });
    return { stop: () => { n.s.stop(); d.o.stop(); p(); } }; };
  BIOBED.meadow = (k, out) => { const w = vNoise(out, .03, "bandpass", 900, .7), b = vEvery(2600, t => { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = "sawtooth"; o.frequency.value = 220 + Math.random()*40; f.type = "bandpass"; f.frequency.value = 1100;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.006, t + .4); g.gain.exponentialRampToValueAtTime(.0001, t + 1.8); o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + 1.9); }); return { stop: () => { w.s.stop(); b(); } }; };

  // фразы при прибытии
  const PHR = {
    1: (k, t) => vGlide(t, k*2, k*4, 1.6, .05, "triangle"),
    2: (k, t) => { vGlide(t, k*16, k, 5, .025, "sawtooth"); vGlide(t + .2, k*12, k*.75, 5.2, .02, "triangle"); },
    3: (k, t) => { for (let j = 0; j < 10; j++) bell(k*4*Math.pow(2, PENTA[j % PENTA.length]/12), t + j*.11, .22); },
    4: (k, t) => bowl(k/2, t, 1.1),
    5: (k, t) => vGlide(t, 5600, 1200, 1.6, .045, "sine", bus, true),
    6: (k, t) => { for (let j = 0; j < 3; j++){ vThump(t + j*1, 52, .22); vThump(t + j*1 + .28, 45, .14); } },
    7: (k, t) => { const C = "ATGGCCATTGTAATGGGCCGCTGAAAGGGT"; for (let j = 0; j < C.length; j++){ const d = "ACGT".indexOf(C[j]) + (j % 3 === 2 ? 2 : 0); bell(k*2*Math.pow(2, PENTA[d]/12), t + j*.16, .16); } },
    8: (k, t) => { BALMER.forEach((x, j) => bell(k*2*x, t + j*.35, .32)); BALMER.forEach(x => bell(k*2*x, t + 1.8, .2)); },
    9: (k, t) => { for (let j = 0; j < 9; j++) vClick(t + Math.random()*1.4, .12, bus, Math.random()*1.6 - .8); },
    10: (k, t) => { const n = vNoise(bus, .0001, "bandpass", 600, .6); n.g.gain.exponentialRampToValueAtTime(.06, t + 1.2); n.g.gain.exponentialRampToValueAtTime(.0001, t + 3.5); n.f.frequency.exponentialRampToValueAtTime(2400, t + 3.5); setTimeout(() => n.s.stop(), 4000); },
    11: (k, t) => bell(k*2, t, .25)
  };
  function vStart(key){
    const parts = key.split(":"), kind = parts[0];
    const out = ac.createGain(); out.gain.value = .0001;
    let mf = null; if (kind === "bio"){ mf = ac.createBiquadFilter(); mf.type = "lowpass"; mf.frequency.value = 16000; mf.Q.value = .5; out.connect(mf); mf.connect(bus); } else out.connect(bus);   // v145: курсор под водой — звук глохнет
    let b = null;
    if (kind === "bio"){ b = BIOBED[parts[1]] ? BIOBED[parts[1]](root, out) : null; }
    else if (kind === "lv"){ const lk = parts[1] === "bh" ? "bh" : parts[1] + ":" + parts[2], J = JOURNEYS[parts[1]], k = NOTES[J ? J.st : 0]; b = LBED[lk] ? LBED[lk](k, out) : null; }
    else { const i = +parts[1], k = NOTES[i] || root; b = BED[i] ? BED[i](k, out) : null; }
    out.gain.setTargetAtTime(VVOL, ac.currentTime + .1, 1.2);
    return { key, out, b, mf };
  }
  function vStop(v){ if (!v) return; const t = ac.currentTime; v.out.gain.cancelScheduledValues(t); v.out.gain.setTargetAtTime(.0001, t, .9); setTimeout(() => { try { v.b && v.b.stop(); } catch(e){} v.out.disconnect(); }, 4500); }
  function voiceSet(key, phrase){
    if (!ac || !on || omOn){ if (vcur){ vStop(vcur); vcur = null; } vkey = key; return; }
    if (key === (vcur && vcur.key)) return;
    vStop(vcur); vcur = key ? vStart(key) : null; vkey = key;
    const ps = String(key).split(":"), i = +ps[1];
    if (phrase && ps[0] === "st" && PHR[i]) PHR[i](NOTES[i], ac.currentTime + 1.1);
  }
  return {
    planet(c){ if (!ac) return; if (!c || !on || omOn){ planetStop(); return; } planetStart(c); },
    planetOn(){ return !!pvc; },
    toggle(v){ if (!ac) init(); on = v; clearTimeout(timer); if (!v) planetStop();
      if (v){ ac.resume(); master.gain.setTargetAtTime(.85, ac.currentTime, 1.4); if (omOn) omSet(true); else bowl(root, ac.currentTime + .15); timer = setTimeout(tick, 1800); const k = vkey; vcur = null; if (k) voiceSet(k, false); }
      else { master.gain.setTargetAtTime(0, ac.currentTime, .5); clearTimeout(omTimer); if (vcur){ vStop(vcur); vcur = null; } } },
    om(v){ if (v !== omOn){ omSet(v); if (ac){ const k = vkey; if (v){ if (vcur){ vStop(vcur); vcur = null; } } else if (k) voiceSet(k, false); } } },
    station(i){ if (!ac){ root = NOTES[i]; return; } setRoot(NOTES[i]); if (on && !omOn) bowl(NOTES[i], ac.currentTime + .05, .9); },
    // голос места: key — "st:i"; смена с паузой 0,3 с, чтобы быстрый пролёт по кольцу не дёргал звук
    voice(key, phrase){ clearTimeout(vPend); vkey = key; vPend = setTimeout(() => voiceSet(key, phrase), 300); },
    voiceKey(){ return vcur ? vcur.key : ""; },
    vtest(i){ clearTimeout(vPend); voiceSet("st:" + i, true); },
    // «Послушать» из Справочника: включает музыку и сразу ставит нужный голос (с фразой станции)
    preview(key){ const sb = $("sound"); if (sb.getAttribute("aria-pressed") !== "true") sb.click(); clearTimeout(vPend); if (vcur && vcur.key === key){ vStop(vcur); vcur = null; } voiceSet(key, true); },
    portal(rise){ if (ac && on && !omOn) whoosh(ac.currentTime + .05, rise); },
    // v145: под водой (k = 1) фон эпохи глухой, над водой (0) — открытый
    muffle(k){ if (!ac || !vcur || !vcur.mf) return; vcur.mf.frequency.setTargetAtTime(k ? 520 : 16000, ac.currentTime, k ? .12 : .25); },
    // v145: раскол камня — серия сухих щелчков и хруста, низкий удар в конце
    crack(){ if (!ac || !on || omOn) return; const t0 = ac.currentTime + .02, len = Math.floor(ac.sampleRate*.35), nb = ac.createBuffer(1, len, ac.sampleRate), d = nb.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/len, 3);
      for (let j = 0; j < 6; j++){ const t = t0 + j*(.09 + Math.random()*.16), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        s.buffer = nb; f.type = "bandpass"; f.frequency.value = 900 + Math.random()*2200; f.Q.value = 1.4; g.gain.value = .22*(1 - j*.1); s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + .4); }
      const o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(70, t0 + .7); o.frequency.exponentialRampToValueAtTime(38, t0 + 1.5);
      og.gain.setValueAtTime(.0001, t0 + .7); og.gain.exponentialRampToValueAtTime(.18, t0 + .74); og.gain.exponentialRampToValueAtTime(.0001, t0 + 1.8); o.connect(og); og.connect(bus); o.start(t0 + .7); o.stop(t0 + 1.9); },
    chime(){ if (ac && on && !omOn) bell(root*4, ac.currentTime + .02, .35); },
    tick(k){ if (ac && on && !omOn && ac.currentTime - (this._tk || -9) > .22){ this._tk = ac.currentTime; bell(root*2*Math.pow(2, PENTA[clamp(k, 0, 4) + 2]/12), ac.currentTime + .02, .14); } },
    hover(){ if (ac && on && !omOn && ac.currentTime - (this._h || -9) > 3){ this._h = ac.currentTime; bell(root*3, ac.currentTime + .02, .18); } },
    dive(){ if (ac && on && !omOn){ whoosh(ac.currentTime + .02, true); bowl(root*2, ac.currentTime + 1.1, .8); } },
    surface(){ if (ac && on && !omOn) whoosh(ac.currentTime + .02, false); },
    end(){ if (ac && on && !omOn) bowl(root, ac.currentTime + .02, 1.2); },
    // «аккорд измерений»: каждая ступень добавляет голос — 1 · квинта · терция · септима · нона · ундецима (○ музыкальный образ)
    dim(n){ if (!ac || !on || omOn) return; const t = ac.currentTime + .03;
      if (!n){ bell(root*4, t, .3); return; }
      [1, 1.5, 1.25, 1.875, 2.25, 2.667, 3].slice(0, n + 1).forEach((r, k) => bowl(root*r, t + k*.13, .75 - k*.06)); },
    // вращение в новой плоскости слегка сдвигает тон: XY XZ YZ — ступени трезвучия, XW YW ZW — выше, «новое направление»
    plane(k){ if (!ac || !on || omOn) return; bell(root*2*[1, 1.25, 1.5, 1.875, 2.25, 2.5][k], ac.currentTime + .02, .28); },
    // катарсис: диссонанс двойственности разрешается в чистое мажорное трезвучие (хрусталь/чаша)
    triad(){ if (!ac || !on) return; const t = ac.currentTime + .03; const f = root*2;
      bowl(f, t, 1.1); bowl(f*1.25, t + .09, .85); bowl(f*1.5, t + .18, .95); bell(f*2, t + .3, .5); }
  };
})();

