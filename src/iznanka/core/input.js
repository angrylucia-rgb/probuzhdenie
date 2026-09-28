// Трекер ввода: удержание, двойное касание, неподвижность (Qwen, 2-й круг; экспорт и отписка поправлены вручную)
export function createInputTracker({ stillnessSec = 240 } = {}) {
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

export function bindInput(el, tracker, onExit, now = () => performance.now() / 1000) {
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
