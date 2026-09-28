// Анализ спектра: три полосы + детектор атак (сгенерировано Qwen, возврат onset поправлен вручную)
export function computeBands(freqData, sampleRate, fftSize) {
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

export function createOnset({ threshold = 0.12, smoothing = 0.9 } = {}) {
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
