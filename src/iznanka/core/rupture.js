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

export function createRuptureDirector({ durations = { call: 2, crack: 1.2, rift: 0.4, reassembly: 1.4, settle: 4 }, reducedMotion = false } = {}) {
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
