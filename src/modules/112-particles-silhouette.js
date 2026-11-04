
// поле суши настоящей Земли (1°): GPU — текстура uLand, CPU — landAt(); 0,5 — берег
const EARTH_LAND = (() => { const s = atob(EARTH_LAND_B64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; })();
const LAND_TEX = (() => { const t = new THREE.DataTexture(EARTH_LAND, 360, 180, THREE.LuminanceFormat, THREE.UnsignedByteType); t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
// то же правило, что в шейдере: направление → долгота/широта → значение поля (−0,82…1,18; берег — 0,18)
function landAt(d){ const l = Math.hypot(d[0], d[1], d[2]) || 1, lon = Math.atan2(d[0]/l, d[2]/l), lat = Math.asin(clamp(d[1]/l, -1, 1));
  const x = clamp(Math.floor((lon/TAU + .5)*360), 0, 359), y = clamp(Math.floor((lat/Math.PI + .5)*180), 0, 179); return (EARTH_LAND[y*360 + x]/255 - .5)*2 + .18; }
const U = { time:{value:0}, pr:{value:PR}, land:{value:LAND_TEX} };
// v184: карта поверхности тела (136-body-maps.js) — у каждого материала своя; по умолчанию серый пиксель
const MAP0 = (() => { const t = new THREE.DataTexture(new Uint8Array([128, 128, 0, 0]), 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType); t.needsUpdate = true; return t; })();

/* ---------- частицы ---------- */
const HEAD = `
uniform float uTime; uniform float uPR; uniform float uOpacity; uniform float uSize; uniform float uFocus; uniform float uSpeed; uniform float uProg;
attribute float aSeed; attribute vec3 aRnd; attribute vec3 aColor; attribute float aSize;
varying vec3 vColor; varying float vAlpha;
uniform vec3 uCur; uniform float uHov; uniform float uPush; uniform float uRad; uniform float uDive; uniform float uSharp; uniform float uSolid;
uniform sampler2D uLand; uniform sampler2D uMap;
float landT(vec3 q){ vec3 n = normalize(q); vec2 uv = vec2(atan(n.x, n.z)/6.2831853 + 0.5, asin(clamp(n.y, -1.0, 1.0))/3.1415927 + 0.5); return (texture2D(uLand, uv).r - 0.5)*2.0 + 0.18; }
vec4 mapT(vec3 q){ vec3 n = normalize(q); return texture2D(uMap, vec2(atan(n.x, n.z)/6.2831853 + 0.5, asin(clamp(n.y, -1.0, 1.0))/3.1415927 + 0.5)); }
float iceT(vec3 q, float land){ vec3 n = normalize(q); float la = asin(clamp(n.y, -1.0, 1.0))*57.29578, lo = atan(n.x, n.z)*57.29578;
  float grl = step(0.18, land)*step(59.5, la)*step(-74.0, lo)*step(lo, -11.0);
  return max(max(smoothstep(74.0, 78.0, la), smoothstep(-61.0, -65.0, la)), grl); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec3 hsv(float h){ return clamp(abs(mod(h*6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
`;
const FRAG = `varying vec3 vColor; varying float vAlpha;
void main(){ float r = length(gl_PointCoord - 0.5); float g = smoothstep(0.5, 0.0, r); g *= g; float al = g * vAlpha; if (al < 0.002) discard; gl_FragColor = vec4(vColor, al); }`;
function pmat(chunk, size, decl){
  return new THREE.ShaderMaterial({
    uniforms: { uTime:U.time, uPR:U.pr, uLand:U.land, uMap:{value:MAP0}, uOpacity:{value:1}, uSize:{value:size||1}, uFocus:{value:-1}, uSpeed:{value:1}, uProg:{value:0}, uCur:{value:new THREE.Vector3(999,999,999)}, uHov:{value:0}, uPush:{value:.5}, uRad:{value:2}, uDive:{value:0}, uSharp:{value:1}, uSolid:{value:0} },
    vertexShader: HEAD + (decl || "") + `void main(){
      vec3 p = position; vec3 col = aColor; float a = 1.0; float s = aSize;
      ${chunk}
      if (uHov > 0.001){
        vec3 dv = p - uCur; float dd = length(dv);
        float inf = uHov * exp(-dd*dd/(uRad*uRad));
        p += (dd > 0.0001 ? dv/dd : vec3(0.0)) * inf * uPush;
        a *= 1.0 + inf*1.4; s *= 1.0 + inf*0.6;
      }
      s *= 1.0 + uDive*0.7;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float d = -mv.z;
      gl_PointSize = min(s * uSize * uPR * (40.0 / max(d, 0.6)), 40.0 * uPR);
      gl_Position = projectionMatrix * mv;
      vColor = col;
      vAlpha = a * uOpacity * smoothstep(0.3, 2.5, d) * (0.4 + 0.6 * smoothstep(190.0, 30.0, d));
    }`,
    fragmentShader: FRAG, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  });
}
const rn = () => Math.random()*2-1;
function gauss(){ let u = 0, v = 0; while(!u) u = Math.random(); while(!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); }
function dir(){ const z = rn(), a = Math.random()*TAU, r = Math.sqrt(1-z*z); return [r*Math.cos(a), z, r*Math.sin(a)]; }
function fib(i, n){ const y = 1 - (i+.5)/n*2, r = Math.sqrt(1-y*y), a = i*2.39996323; return [Math.cos(a)*r, y, Math.sin(a)*r]; }
const C = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mixc = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
function pts(n, fill, chunk, size, decl){
  n = Math.max(1, Math.round(n));
  const P = new Float32Array(n*3), CO = new Float32Array(n*3), S = new Float32Array(n), SE = new Float32Array(n), R = new Float32Array(n*3);
  for (let i = 0; i < n; i++){
    const o = {p:[0,0,0], c:[1,1,1], s:1, seed:Math.random(), rnd:[rn(),rn(),rn()]};
    fill(i, o, n);
    P.set(o.p, i*3); CO.set(o.c, i*3); S[i] = o.s; SE[i] = o.seed; R.set(o.rnd, i*3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P,3));
  g.setAttribute("aColor", new THREE.BufferAttribute(CO,3));
  g.setAttribute("aSize", new THREE.BufferAttribute(S,1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(SE,1));
  g.setAttribute("aRnd", new THREE.BufferAttribute(R,3));
  const p = new THREE.Points(g, pmat(chunk, size, decl)); p.frustumCulled = false; return p;
}
const GLOW = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); const g = x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.18,"rgba(255,255,255,.55)"); g.addColorStop(.45,"rgba(255,255,255,.12)"); g.addColorStop(1,"rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); })();
function glow(color, size, opacity){ const m = new THREE.SpriteMaterial({map:GLOW, color, transparent:true, opacity:opacity??1, blending:THREE.AdditiveBlending, depthWrite:false}); const s = new THREE.Sprite(m); s.scale.set(size,size,1); return s; }
function circleGeo(r, seg, cx, cy){ const a = []; for (let i = 0; i < seg; i++){ const t = i/seg*TAU; a.push(cx + Math.cos(t)*r, cy + Math.sin(t)*r, 0); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(a,3)); return g; }
const lineMat = (color, opacity) => new THREE.LineBasicMaterial({color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false});
function label(text, font, color, h){
  const c = document.createElement("canvas"), x = c.getContext("2d");
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 24; c.width = w; c.height = 96;
  x.font = font; x.fillStyle = color; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, 50);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t, transparent:true, depthWrite:false, opacity:.95}));
  s.scale.set(h*w/96, h, 1); return s;
}
// подпись в 3D шрифтом основного текста (Forum), тёплым золотом и с тёмной подложкой: на ярких точках
// белые буквы без обводки сливаются (их ещё и добеливает bloom). Рисуется поверх всего (renderOrder);
// прозрачностью управляет сама сцена — потому userData.self (общий фейд станции её не трогает)
function haloLabel(txt, h, color){
  const c = document.createElement("canvas"), x = c.getContext("2d"), F = "400 50px Forum, Georgia, serif";
  x.font = F; const w = Math.ceil(x.measureText(txt).width) + 60; c.width = w; c.height = 96;
  x.font = F; x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round";
  x.shadowColor = "rgba(3,4,10,1)"; x.shadowBlur = 22;
  x.lineWidth = 14; x.strokeStyle = "rgba(5,6,12,.92)"; x.strokeText(txt, w/2, 52); x.strokeText(txt, w/2, 52);
  x.shadowBlur = 0; x.fillStyle = color || "#FFD88A"; x.fillText(txt, w/2, 52);
  const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false, depthTest:false, opacity:0}));
  s.scale.set(h*w/96, h, 1); s.renderOrder = 20; s.userData.self = true; return s;
}
const GOLD = C(0xD6AC5E), CREAM = C(0xF6EBCF);

/* ---------- маска силуэта ---------- */
const HM = (() => {
  const raw = atob(MASK), M = new Uint8Array(MS*MS);
  for (let i = 0; i < MS*MS; i++) M[i] = (raw.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  const D = new Float32Array(MS*MS);
  for (let i = 0; i < MS*MS; i++) D[i] = M[i] ? 1e3 : 0;
  const at = (x,y) => (x < 0 || y < 0 || x >= MS || y >= MS) ? 0 : D[y*MS + x];
  for (let y = 0; y < MS; y++) for (let x = 0; x < MS; x++){ const i = y*MS + x; if (M[i]) D[i] = Math.min(D[i], at(x-1,y)+1, at(x,y-1)+1, at(x-1,y-1)+1.4, at(x+1,y-1)+1.4); }
  for (let y = MS-1; y >= 0; y--) for (let x = MS-1; x >= 0; x--){ const i = y*MS + x; if (M[i]) D[i] = Math.min(D[i], at(x+1,y)+1, at(x,y+1)+1, at(x+1,y+1)+1.4, at(x-1,y+1)+1.4); }
  const inside = [], edge = [];
  for (let i = 0; i < MS*MS; i++){ if (!M[i]) continue; (D[i] <= 1.5 ? edge : inside).push(i); }
  const K = 5.6/MS, cx = BODYMETA.cx410*MS/410, cy = 205*MS/410;
  const toW = (px, py) => [(px - cx)*K, (cy - py)*K];
  const chakraY = BODYMETA.chakra.map(py => toW(0, py*MS/410)[1]);
  // размытая маска + толщина → текстура для мягкого края и течения частиц
  let F = new Float32Array(MS*MS); for (let i = 0; i < MS*MS; i++) F[i] = M[i];
  const blur = (src, dx, dy, r) => { const out = new Float32Array(MS*MS);
    for (let y = 0; y < MS; y++) for (let x = 0; x < MS; x++){ let s = 0, c = 0;
      for (let k = -r; k <= r; k++){ const xx = x + k*dx, yy = y + k*dy; if (xx < 0 || yy < 0 || xx >= MS || yy >= MS){ c++; continue; } s += src[yy*MS + xx]; c++; }
      out[y*MS + x] = s/c; } return out; };
  for (let k = 0; k < 2; k++){ F = blur(F, 1, 0, 3); F = blur(F, 0, 1, 3); }
  const tex = new Uint8Array(MS*MS*4);
  for (let i = 0; i < MS*MS; i++){ tex[i*4] = Math.round(F[i]*255); tex[i*4+1] = Math.round(Math.min(D[i], 16)/16*255); tex[i*4+3] = 255; }
  const field = new THREE.DataTexture(tex, MS, MS, THREE.RGBAFormat);
  field.magFilter = THREE.LinearFilter; field.minFilter = THREE.LinearFilter; field.needsUpdate = true;
  // маска для обрезки анатомических рисунков
  const maskC = document.createElement("canvas"); maskC.width = maskC.height = MS;
  { const mc = maskC.getContext("2d"), id = mc.createImageData(MS, MS);
    for (let i = 0; i < MS*MS; i++){ const v = F[i]; id.data[i*4+3] = Math.round(255*Math.min(1, Math.max(0, (v - .3)/.4))); }
    mc.putImageData(id, 0, 0); }
  return {D, F, inside, edge, toW, chakraY, field, K, cx, cy, maskC};
})();

// Анатомические слои в координатах силуэта (410×410), поза медитации. Рисуются процедурно, в стиле гравюры.
const ANAT = (() => {
  const CX = 212, M = x => 2*CX - x;
  const both = (fn) => { fn(1); fn(-1); };            // s = 1 — левая сторона кадра, -1 — зеркало
  const X = (s, x) => s > 0 ? x : M(x);
  function line(c, pts, w, col, glow){
    c.save(); c.lineWidth = w; c.strokeStyle = col; c.lineCap = "round"; c.lineJoin = "round";
    if (glow){ c.shadowColor = glow; c.shadowBlur = 6; }
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.restore();
  }
  function bone(c, a, b, w){
    const col = "rgba(246,236,214,.95)", glow = "rgba(255,240,210,.9)";
    line(c, [a, b], w, "rgba(246,236,214,.55)", glow);
    line(c, [a, b], w*.35, col);
    c.save(); c.fillStyle = "rgba(246,236,214,.8)"; c.shadowColor = glow; c.shadowBlur = 5;
    c.beginPath(); c.arc(a[0], a[1], w*.75, 0, 7); c.arc(b[0], b[1], w*.75, 0, 7); c.fill(); c.restore();
  }
  function fibers(c, cx, cy, rx, ry, rot, opt){
    opt = opt || {};
    c.save(); c.translate(cx, cy); c.rotate(rot);
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    g.addColorStop(0, opt.core || "rgba(226,104,86,.72)"); g.addColorStop(1, opt.edge || "rgba(150,48,44,.55)");
    c.fillStyle = g; c.fill(); c.clip();
    c.strokeStyle = opt.fib || "rgba(255,190,170,.55)"; c.lineWidth = .45;
    const n = opt.n || Math.max(5, Math.round(ry*1.2));
    for (let i = 0; i <= n; i++){ const y = -ry + 2*ry*i/n; c.beginPath(); c.moveTo(-rx*1.1, y); c.quadraticCurveTo(0, y + ry*.18*Math.sin(i), rx*1.1, y); c.stroke(); }
    c.restore();
    c.save(); c.translate(cx, cy); c.rotate(rot); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
    c.strokeStyle = "rgba(255,210,190,.45)"; c.lineWidth = .6; c.stroke(); c.restore();
  }
  function tendon(c, cx, cy, rx, ry, rot){ c.save(); c.translate(cx, cy); c.rotate(rot); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
    c.fillStyle = "rgba(244,228,200,.7)"; c.shadowColor = "rgba(255,240,215,.8)"; c.shadowBlur = 4; c.fill(); c.restore(); }
  const ang = (a, b) => Math.atan2(b[1]-a[1], b[0]-a[0]);
  const mid = (a, b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
  const len = (a, b) => Math.hypot(b[0]-a[0], b[1]-a[1]);
  // опорные точки позы (левая сторона кадра)
  const J = {
    shoulder:[152,146], elbow:[127,258], wrist:[182,312], hand:[204,320],
    hip:[190,318], knee:[80,364], ankle:[262,394], toe:[288,390]
  };

  function skeleton(c){
    // череп
    c.save(); c.shadowColor = "rgba(255,240,210,.9)"; c.shadowBlur = 6;
    c.fillStyle = "rgba(240,230,210,.18)"; c.strokeStyle = "rgba(246,236,214,.95)"; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(CX, 38, 26, 31, 0, 0, Math.PI*2); c.fill(); c.stroke();
    c.lineWidth = .9;
    c.beginPath(); c.ellipse(CX-10, 44, 6.5, 5.5, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(CX+10, 44, 6.5, 5.5, 0, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(CX, 50); c.lineTo(CX-3, 58); c.lineTo(CX+3, 58); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(CX-20, 56); c.quadraticCurveTo(CX-17, 80, CX, 82); c.quadraticCurveTo(CX+17, 80, CX+20, 56); c.stroke();
    c.beginPath(); for (let i = -3; i <= 3; i++){ c.moveTo(CX + i*3, 64); c.lineTo(CX + i*3, 69); } c.stroke();
    c.restore();
    // позвоночник
    c.save(); c.fillStyle = "rgba(246,236,214,.85)"; c.shadowColor = "rgba(255,240,210,.8)"; c.shadowBlur = 4;
    for (let y = 88; y < 124; y += 6) { c.beginPath(); c.roundRect ? c.roundRect(CX-4, y, 8, 4, 1.5) : c.rect(CX-4, y, 8, 4); c.fill(); }
    for (let y = 128; y < 242; y += 7) { c.beginPath(); c.roundRect ? c.roundRect(CX-5, y, 10, 4.5, 1.5) : c.rect(CX-5, y, 10, 4.5); c.fill(); }
    for (let y = 244; y < 290; y += 9) { c.beginPath(); c.roundRect ? c.roundRect(CX-7, y, 14, 6.5, 2) : c.rect(CX-7, y, 14, 6.5); c.fill(); }
    c.restore();
    // грудина и рёбра
    line(c, [[CX, 136], [CX, 196]], 4, "rgba(246,236,214,.8)", "rgba(255,240,210,.8)");
    for (let i = 0; i < 10; i++){
      const y0 = 134 + i*9.6, w = 26 + 20*Math.sin(Math.PI*(i+2.2)/12.5), front = i < 7;
      both(s => {
        c.save(); c.strokeStyle = "rgba(246,236,214,.8)"; c.lineWidth = 1.3; c.shadowColor = "rgba(255,240,210,.7)"; c.shadowBlur = 4;
        c.beginPath(); c.moveTo(X(s, CX-5), y0);
        c.bezierCurveTo(X(s, CX - w*.7), y0 - 5, X(s, CX - w - 3), y0 + 2, X(s, CX - w + 1), y0 + 14);
        if (front) c.bezierCurveTo(X(s, CX - w + 4), y0 + 22, X(s, CX - w*.45), y0 + 22 + i*.8, X(s, CX - 4), y0 + 16 + i*1.4);
        c.stroke(); c.restore();
      });
    }
    // ключицы, лопатки
    both(s => {
      line(c, [[X(s, CX-4), 128], [X(s, 186), 124], [X(s, 160), 134]], 2.2, "rgba(246,236,214,.9)", "rgba(255,240,210,.8)");
      c.save(); c.strokeStyle = "rgba(246,236,214,.3)"; c.lineWidth = .8; c.beginPath();
      c.moveTo(X(s, 164), 138); c.lineTo(X(s, 186), 146); c.lineTo(X(s, 176), 196); c.closePath(); c.stroke(); c.restore();
    });
    // таз
    c.save(); c.strokeStyle = "rgba(246,236,214,.9)"; c.fillStyle = "rgba(240,230,210,.14)"; c.lineWidth = 1.3; c.shadowColor = "rgba(255,240,210,.8)"; c.shadowBlur = 5;
    both(s => { c.beginPath(); c.moveTo(X(s, CX-8), 286); c.bezierCurveTo(X(s, 186), 268, X(s, 160), 272, X(s, 160), 290);
      c.bezierCurveTo(X(s, 160), 306, X(s, 176), 316, X(s, 192), 322); c.lineTo(X(s, CX-6), 324); c.stroke(); c.fill();
      c.beginPath(); c.ellipse(X(s, 197), 314, 5, 6, 0, 0, 7); c.stroke(); });
    c.beginPath(); c.moveTo(CX-8, 286); c.lineTo(CX+8, 286); c.lineTo(CX, 314); c.closePath(); c.stroke();
    c.restore();
    // руки и ноги
    both(s => {
      const P = k => [X(s, J[k][0]), J[k][1]];
      bone(c, P("shoulder"), P("elbow"), 4.2);
      const e = P("elbow"), w = P("wrist");
      bone(c, [e[0] + 2*s, e[1] + 3], w, 2.6); bone(c, [e[0] - 1*s, e[1] + 6], [w[0] - 3*s, w[1] + 4], 2.2);
      for (let f = 0; f < 4; f++) line(c, [w, [X(s, J.hand[0] + f*2), J.hand[1] - 4 + f*3]], .9, "rgba(246,236,214,.85)", "rgba(255,240,210,.7)");
      bone(c, P("hip"), P("knee"), 5.5);
      const k = P("knee");
      c.save(); c.strokeStyle = "rgba(246,236,214,.95)"; c.lineWidth = 1.2; c.shadowColor = "rgba(255,240,210,.9)"; c.shadowBlur = 5; c.beginPath(); c.arc(k[0] + 4*s, k[1] - 3, 4.5, 0, 7); c.stroke(); c.restore();
      const a = P("ankle");
      bone(c, [k[0] + 5*s, k[1] + 4], a, 4); bone(c, [k[0] + 3*s, k[1] + 9], [a[0] - 4*s, a[1] + 5], 2);
      for (let f = 0; f < 5; f++) line(c, [a, [X(s, J.toe[0] + f*1.5), J.toe[1] - 5 + f*2.5]], .9, "rgba(246,236,214,.85)", "rgba(255,240,210,.7)");
    });
  }

  function muscles(c){
    // основа: всё тело — мышечная ткань, волокна сверху вниз (обрежется по силуэту)
    c.save(); c.fillStyle = "rgba(120,38,36,.62)"; c.fillRect(0, 0, 410, 410);
    c.strokeStyle = "rgba(210,110,96,.22)"; c.lineWidth = .5;
    for (let x = 0; x < 410; x += 2.2){ c.beginPath(); c.moveTo(x, 0); for (let y = 0; y <= 410; y += 20) c.lineTo(x + Math.sin(y*.05 + x*.3)*1.2, y); c.stroke(); }
    c.restore();
    // голова и шея
    fibers(c, CX, 34, 25, 28, 0, {core:"rgba(200,96,84,.45)", edge:"rgba(120,44,40,.4)", n:14});
    both(s => { fibers(c, X(s, 199), 64, 6, 11, s*.2, {n:6}); fibers(c, X(s, 200), 106, 5, 24, -s*.38, {n:8}); });
    // трапеция, дельты, грудные
    both(s => {
      fibers(c, X(s, 184), 128, 26, 7, s*.22, {n:5});
      fibers(c, X(s, 160), 152, 14, 21, -s*.25, {n:9});
      fibers(c, X(s, 190), 164, 25, 18, s*.22, {n:12});
      fibers(c, X(s, 174), 204, 7, 14, s*.1, {n:6});
      fibers(c, X(s, 180), 244, 12, 32, s*.12, {n:10});
    });
    // пресс
    for (let r = 0; r < 4; r++) both(s => fibers(c, X(s, 204), 196 + r*23, 7.5, 10.5, 0, {n:6}));
    line(c, [[CX, 180], [CX, 290]], 2, "rgba(244,228,200,.75)", "rgba(255,240,215,.7)");
    for (let r = 0; r < 3; r++) line(c, [[CX-15, 208 + r*23], [CX+15, 208 + r*23]], 1.2, "rgba(244,228,200,.6)");
    // руки
    both(s => {
      const P = k => [X(s, J[k][0]), J[k][1]];
      const sh = P("shoulder"), el = P("elbow"), wr = P("wrist");
      const m1 = mid(sh, el), m2 = mid(el, wr);
      fibers(c, m1[0], m1[1] + 4, len(sh, el)*.5, 12, ang(sh, el), {n:9});
      fibers(c, m2[0], m2[1], len(el, wr)*.52, 10, ang(el, wr), {n:8});
      tendon(c, wr[0], wr[1], 7, 3.5, ang(el, wr));
      // ноги
      const hp = P("hip"), kn = P("knee"), an = P("ankle");
      const t1 = mid(hp, kn), t2 = mid(kn, an);
      fibers(c, t1[0], t1[1] + 2, len(hp, kn)*.52, 19, ang(hp, kn), {n:16});
      fibers(c, t1[0] + 4*s, t1[1] + 12, len(hp, kn)*.42, 7, ang(hp, kn) + s*.05, {n:6, core:"rgba(236,120,100,.7)"});
      tendon(c, kn[0] + 4*s, kn[1] - 2, 9, 7, 0);
      fibers(c, t2[0], t2[1] + 2, len(kn, an)*.48, 12, ang(kn, an), {n:9});
      tendon(c, an[0], an[1], 6, 4, ang(kn, an));
    });
  }

  function organs(c){
    const soft = (fn, col, glow) => { c.save(); c.fillStyle = col; c.shadowColor = glow || col; c.shadowBlur = 8; c.beginPath(); fn(); c.fill(); c.restore(); };
    // мозг
    soft(() => c.ellipse(CX, 30, 22, 19, 0, 0, 7), "rgba(236,176,196,.75)");
    c.save(); c.strokeStyle = "rgba(255,220,230,.55)"; c.lineWidth = .7;
    for (let i = 0; i < 9; i++){ c.beginPath(); const y = 17 + i*3.2; for (let x = CX-19; x <= CX+19; x += 2) c.lineTo(x, y + Math.sin(x*.9 + i)*1.4); c.stroke(); }
    line(c, [[CX, 12], [CX, 48]], .8, "rgba(120,60,80,.8)"); c.restore();
    // трахея
    line(c, [[CX, 98], [CX, 150]], 5, "rgba(236,222,200,.7)");
    for (let y = 100; y < 150; y += 4) line(c, [[CX-3, y], [CX+3, y]], .6, "rgba(255,245,230,.8)");
    // лёгкие
    both(s => {
      soft(() => { c.moveTo(X(s, CX-6), 142); c.bezierCurveTo(X(s, 170), 136, X(s, 164), 170, X(s, 166), 214);
        c.bezierCurveTo(X(s, 176), 226, X(s, 198), 222, X(s, CX - (s > 0 ? 6 : 16)), 214); c.closePath(); }, "rgba(240,150,164,.6)");
      c.save(); c.fillStyle = "rgba(255,210,220,.45)"; for (let i = 0; i < 60; i++){ const x = X(s, 172 + (i*37 % 34)), y = 150 + (i*53 % 64); c.beginPath(); c.arc(x, y, .9, 0, 7); c.fill(); } c.restore();
    });
    // сердце (у человека слева — справа в кадре)
    soft(() => { const x = CX + 8, y = 186; c.moveTo(x, y + 18); c.bezierCurveTo(x - 20, y + 6, x - 14, y - 12, x - 2, y - 6); c.bezierCurveTo(x + 8, y - 16, x + 20, y - 4, x + 12, y + 8); c.closePath(); }, "rgba(222,52,64,.92)", "rgba(255,60,70,.9)");
    line(c, [[CX + 4, 176], [CX + 2, 164], [CX + 12, 160], [CX + 16, 170]], 2.4, "rgba(222,70,80,.9)");
    // диафрагма
    c.save(); c.strokeStyle = "rgba(255,210,190,.35)"; c.lineWidth = 1; c.beginPath(); c.moveTo(166, 222); c.quadraticCurveTo(CX, 204, 258, 222); c.stroke(); c.restore();
    // печень, желудок, селезёнка, поджелудочная
    soft(() => { c.moveTo(168, 226); c.bezierCurveTo(190, 216, 218, 218, 226, 226); c.bezierCurveTo(222, 240, 206, 250, 180, 250); c.bezierCurveTo(170, 246, 166, 236, 168, 226); }, "rgba(150,58,50,.9)", "rgba(190,80,60,.7)");
    soft(() => c.ellipse(240, 238, 15, 10, -.45, 0, 7), "rgba(232,140,120,.85)");
    soft(() => c.ellipse(257, 232, 5, 8, .3, 0, 7), "rgba(160,70,90,.8)");
    soft(() => c.ellipse(224, 252, 13, 3, -.1, 0, 7), "rgba(240,190,140,.8)");
    // почки (глубже, бледнее)
    both(s => soft(() => c.ellipse(X(s, 194), 258, 5, 9, s*.2, 0, 7), "rgba(170,70,70,.45)"));
    // толстый кишечник
    c.save(); c.strokeStyle = "rgba(232,200,120,.85)"; c.lineWidth = 8; c.lineCap = "round"; c.shadowColor = "rgba(240,210,130,.6)"; c.shadowBlur = 6;
    c.beginPath(); c.moveTo(186, 302); c.lineTo(182, 262); c.quadraticCurveTo(212, 254, 244, 262); c.lineTo(242, 300); c.quadraticCurveTo(228, 306, 218, 304); c.stroke();
    c.strokeStyle = "rgba(160,120,60,.55)"; c.lineWidth = .7; c.shadowBlur = 0;
    for (let i = 0; i < 16; i++){ const y = 266 + i*2.3; c.beginPath(); c.moveTo(178, y); c.lineTo(186, y); c.moveTo(238, y); c.lineTo(246, y); c.stroke(); }
    c.restore();
    // тонкий кишечник
    c.save(); c.strokeStyle = "rgba(242,156,146,.85)"; c.lineWidth = 3.2; c.lineCap = "round"; c.shadowColor = "rgba(255,170,160,.6)"; c.shadowBlur = 4;
    for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++){
      const cx = 197 + (r % 2 ? 3 - q : q)*10, cy = 273 + r*10;
      c.beginPath(); c.arc(cx, cy, 4.3, (q + r)*1.3, (q + r)*1.3 + Math.PI*1.75); c.stroke();
    }
    c.restore();
    soft(() => c.ellipse(CX, 308, 7, 5, 0, 0, 7), "rgba(236,200,160,.6)");
  }

  function paint(kind, c){ c.save(); if (kind === "bone") skeleton(c); else if (kind === "mus") muscles(c); else organs(c); c.restore(); }
  return { paint };
})();
