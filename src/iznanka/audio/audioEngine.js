// Природный звук «Изнанки». У мира: дрон с чистым рядом обертонов и медленной пульсацией,
// текстура (ветер / вода / гул огня) и события (капли, треск, льдинки, вистлеры...).
// Переход: гул нарастает, выдохи пространства учащаются, затем глухой удар, давление в ушах и раскрытие.
import { computeBands, createOnset } from './analyser.js';
import { WORLDS } from '../worlds/presets.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function createAudioEngine() {
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
