// Рендер: сцена (миры + разрыв + долгая выдержка) в ping-pong буфер, затем оптика (свечение, линза) на экран.
import { VERT, SCENE, POST } from './shaders.js';

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

export function createVisualEngine(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2');
  const half = !!gl.getExtension('EXT_color_buffer_float');
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  let scene = program(gl, SCENE), post = program(gl, POST);
  let ready = false, broken = false;
  // Если компиляция/линковка реально провалилась (не везде одинаковый драйвер/видеокарта —
  // SwiftShader и настольный GPU проверяют шейдер не одинаково строго), не даём этому уронить
  // весь кадр молча: раньше необработанное исключение здесь останавливало requestAnimationFrame
  // навсегда — картинка пропадала (чёрный фон), а звук и остальная логика шли себе дальше,
  // ничем не выдавая причину. Теперь ошибка попадает в консоль и рендер просто перестаёт
  // пытаться — остальной цикл (ввод, звук, переходы) не ломается.
  function pollReady() {
    if (ready) return true;
    if (broken) return false;
    // без расширения нет способа спросить драйвер «готово ли» без блокировки — тогда просто
    // завершаем на первом кадре (уже не в обработчике клика, а в rAF — почти всегда меньше одного кадра)
    const done = !parallel || (gl.getProgramParameter(scene.p, parallel.COMPLETION_STATUS_KHR) && gl.getProgramParameter(post.p, parallel.COMPLETION_STATUS_KHR));
    if (!done) return false;
    try {
      finalize(gl, scene); finalize(gl, post); ready = true;
    } catch (e) {
      console.error('[iznanka] shader compile/link failed:', e);
      broken = true;
    }
    return ready;
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
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); ready = false; broken = false; }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    scene = program(gl, SCENE); post = program(gl, POST);
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
  return { render, resize };
}
