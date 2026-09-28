export function createWorldState(initial = {}) {
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
