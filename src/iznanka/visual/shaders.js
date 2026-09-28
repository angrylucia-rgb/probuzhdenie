// GLSL «Изнанки». Центр — плазма (idx 0): живая складка пространства-времени.
// Миры — природные: иней, огни на воде, пламя, корона, туманность, поле, призма, свет.
// Переход всегда идёт через Изнанку: складка усиливается, мир искривляется и растворяется в ней.
// Новый мир = функция wXxx(p, t) + case в world() + пресет.
export const VERT = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const COMMON = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform vec2 uRes; uniform float uTime, uSeed;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * noise(p); p = M * p; a *= .5; } return s; }
// «дымная» ридж-шумовая структура: тонкие волокна, как у дыма и плазмы
float ridge(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ float n = 1. - abs(noise(p) * 2. - 1.); s += a * n * n * n; p = M * p; a *= .5; } return s; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec2 warp(vec2 p, float t){ return p + vec2(fbm(p * 1.3 + vec2(t * .05, 0.)), fbm(p * 1.3 + vec2(3.1, -t * .04))) - .5; }
vec3 hue(float h){ return .5 + .5 * cos(6.2831853 * (h + vec3(0., .33, .67))); }
`;

export const SCENE = COMMON + `
uniform sampler2D uPrev;
uniform int uA, uB, uGlowCount;
uniform float uMix, uBreath, uEnergy, uDensity, uDisp, uLow, uMid, uHigh, uPulse, uHold, uStill, uTrail, uIntro, uTimeA, uTimeB;
uniform vec2 uPtr;
uniform vec4 uMicro;          // малый разрыв внутри мира: x, y, фаза 0..1, сила
uniform float uGlowOpen[16];
uniform vec3 uGlowCol[16];

// ═══ ИЗНАНКА: живая складка пространства-времени ═══
// Тонкая светящаяся мембрана в объёме сферы, непрерывно изгибается и складывается.
// Там, где складка встаёт к нам ребром, свет копится — рождаются яркие рваные ленты с радужной каймой.
float h3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float fbm3(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 3; i++){ s += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= .5; } return s; }
mat3 rotXY(float a, float b){ float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
  return mat3(cb, 0., -sb, 0., 1., 0., sb, 0., cb) * mat3(1., 0., 0., 0., ca, sa, 0., -sa, ca); }

uniform float uFold;   // сила изгиба: растёт во время перехода
// Изолинии вихревого поля — изогнутые рваные молнии. Несколько слоёв глубины летят навстречу:
// каждый слой рождается в глубине, растёт, проносится мимо и тает — ощущение полёта сквозь пространство.
float lfield(vec2 p, float t){
  vec2 q = vec2(fbm(p + vec2(0., t * .11)), fbm(p + vec2(5.2, -t * .09)));
  vec2 r = vec2(fbm(p + 3. * q + vec2(1.7, 9.2) + t * .07), fbm(p + 3. * q + vec2(8.3, 2.8) - t * .06));
  return fbm(p + 2.2 * r) + (fbm(p * 7. + r * 4. + t * .5) - .5) * .02;   // мелкая рваность, как у разряда
}
vec3 plasma(vec2 p, float t){
  float T = t * (1. + .5 * uEnergy + .8 * uFold);
  float r2 = length(p);
  vec3 haze = vec3(.03, .024, .028) * smoothstep(.9, .2, r2) * (.6 + .4 * uBreath);
  vec3 acc = vec3(0.);
  const int L = 5;
  float speed = .09 + .05 * uEnergy + .25 * uFold;
  for (int i = 0; i < L; i++){
    float fi = float(i);
    float z = fract(fi / float(L) + t * speed);          // 0 — глубоко, 1 — пролетает мимо
    float sc = exp(mix(log(2.2), log(.4), z));           // слой растёт по мере приближения
    float fade = sin(3.14159 * z); fade *= fade * (1. - .5 * z);
    float id = floor(fi / float(L) + t * speed) * 7.13 + fi * 3.7;   // новый рисунок для каждого пролёта
    vec2 q = rot(T * (.12 + .05 * fi) + id + .9 / (r2 + .4)) * p * sc + vec2(id * 1.3, id * .7);
    float f = lfield(q, T + id);
    float w = (.006 + .004 * uEnergy + .004 * uPulse) * (1.25 - .85 * z);
    vec3 dd = vec3(-.003, 0., .003) * (1. + 1.5 * uDisp) * (1. - .75 * z);
    vec3 line = pow(w / (abs(vec3(f) - .5 + dd) + w * .35), vec3(1.8));
    float lit = smoothstep(.56, .78, fbm(q * .6 + id + T * .15) + .15 * uPulse + .15 * uFold);
    acc += line * lit * fade;
  }
  acc *= smoothstep(1.05, .15, r2) * 1.5;
  float lum = dot(acc, vec3(.33));
  // электрическая зернистость внутри лент и цветные искры, как в видео
  acc *= .8 + .4 * fbm(p * 18. + T * 2.);
  // мягкие радужные переливы вдоль лент вместо искр
  acc += hue(fbm(p * 6. + T * .3) * 2.) * smoothstep(.5, 1.5, lum) * .08;
  vec3 col = acc * vec3(1., .88, .9) * (.9 + .35 * uBreath);
  // открытые миры светятся по кругу в глубине
  for (int i = 0; i < 16; i++){
    if (i >= uGlowCount) break;
    float o = uGlowOpen[i]; if (o <= 0.) continue;
    float a = -1.5707963 + float(i) * 6.2831853 / float(uGlowCount);
    float dd = length(p - .42 * vec2(cos(a), -sin(a)));
    col += uGlowCol[i] * o * .0016 / (dd * dd + .005) * (.75 + .25 * sin(t * .6 + float(i) * 1.7));
  }
  return col + haze;
}

// Иней: кристаллы растут из центра радиальными дендритами
vec3 wFrost(vec2 p, float t){
  p /= 1. + .02 * uBreath;
  float r = length(p), a = atan(p.y, p.x);
  float w = fbm(p * 3. + 1.7);
  float veins = ridge(vec2(a * 5. + w * 1.5, log(r + .03) * 1.6 - t * .01));
  float rays = pow(abs(sin(a * 38. + w * 12. + fbm(vec2(r * 6., a * 2.)) * 5.)), 6.) * smoothstep(.04, .3, r);
  float fine = ridge(p * 16. + w * 3.);
  float front = .3 + min(uTimeB * .05, 1.3) + .2 * (fbm(vec2(a * 3., t * .02)) - .5);
  float grown = smoothstep(front + .06, front - .06, r);
  vec3 bright = mix(vec3(.95, .97, 1.), vec3(.42, .56, .78), smoothstep(0., .6, r));
  vec3 ice = mix(bright, vec3(.03, .07, .16), max(smoothstep(.4, .75, veins), rays * .8) * smoothstep(.02, .2, r));
  ice += vec3(.8, .9, 1.) * pow(fine, 4.) * .35;
  vec3 dark = vec3(.02, .05, .11) + vec3(.12, .2, .35) * (pow(fine, 3.) * .5 + smoothstep(.45, .9, veins) * .35);
  return mix(dark, ice, grown) * (.55 + .2 * uBreath);
}

// Огни на воде: длинные огненные штрихи дрейфуют по тёмной воде
vec3 wWaterlights(vec2 p, float t){
  vec3 col = vec3(.01, .012, .03) + vec3(.02, .03, .07) * fbm(vec2(p.x * 2., p.y * 18. + t * .05));
  for (int l = 0; l < 3; l++){
    float fl = float(l), h = .07 - fl * .015;
    vec2 q = p + vec2(0., .006 * sin(p.x * 7. + t * .7 + fl));
    float row = floor(q.y / h), fy = fract(q.y / h) - .5;
    float sp = (.02 + .05 * hash(vec2(row, fl))) * (hash(vec2(row, 3. + fl)) > .5 ? 1. : -1.);
    float x = q.x * (1.2 + fl) + t * sp;
    float seg = floor(x), fx = fract(x);
    float on = step(.78 + .06 * fl, hash(vec2(seg, row + fl * 50.)));
    float len = .3 + .6 * hash(vec2(seg, row + 9.));
    float body = smoothstep(0., .05, fx) * smoothstep(len, len - .08, fx);
    float line = exp(-abs(fy) / (.025 + .01 * fl)) * body * on;
    float flick = .7 + .3 * sin(t * (2. + 3. * hash(vec2(seg, row))) + seg);
    vec3 c = l == 2 ? vec3(1., .75, .3) : mix(vec3(1., .2, .15), vec3(1., .5, .2), hash(vec2(row, seg)));
    col += c * line * flick * (l == 2 ? .6 : 1.2);
  }
  return col * (.6 + .3 * uBreath);
}

vec2 voro(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 g = vec2(x, y), o = vec2(hash(i + g), hash(i + g + 17.));
    float d = length(g + .5 + .4 * sin(uTime * .05 + 6.28 * o) - f);
    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return vec2(d1, d2);
}
// Пламя: янтарный лист тлеет, прогорает отверстиями с огненной кромкой; из центра бьют золотые волокна
vec3 wFlame(vec2 p, float t){
  float r = length(p), a = atan(p.y, p.x);
  float paper = fbm(p * 2.2 + t * .01);
  vec3 col = mix(vec3(.95, .68, .32), vec3(.42, .14, .02), smoothstep(.3, .75, paper + r * .4));
  float fib = pow(abs(sin(a * 90. + fbm(p * 5.) * 8.)), 18.) * smoothstep(.9, .05, r);
  col += vec3(1., .78, .35) * fib * .5;
  float d1 = voro(p * 2.2 + 7.).x + (fbm(p * 9.) - .5) * .16 + (fbm(p * 25.) - .5) * .04;
  float rr = .04 + .26 * (.5 + .5 * sin(t * .04 + fbm(p * .7) * 6.)) * smoothstep(.55, .72, fbm(p * .9 + 3.));
  float hole = smoothstep(rr, rr - .03, d1);
  float rim = exp(-abs(d1 - rr) / .014) * smoothstep(.04, .08, rr);
  col = mix(col, vec3(.03, .008, 0.), hole);
  col += vec3(1., .55, .15) * rim * 1.3;
  col += vec3(1., .85, .5) * .006 / (r * r + .003) * (.7 + .5 * uBreath);
  return col * (.5 + .25 * uBreath);
}

// Корона: дымчатая сфера, по краю — волокна силовых линий
vec3 wCorona(vec2 p, float t){
  float R0 = .3 + .008 * uBreath;
  float r = length(p), a = atan(p.y, p.x);
  vec3 col = vec3(0.);
  float smoke = ridge(warp(p * 3., t) * 2. + t * .02);
  col += vec3(.62, .64, .68) * pow(smoke, 1.6) * smoothstep(R0, R0 - .03, r) * (.35 + .65 * r / R0);
  float edge = r - R0 - (fbm(vec2(a * 6., t * .1)) - .5) * .02;
  col += vec3(.95, .96, 1.) * exp(-abs(edge) / .006) * .9;
  float wisp = ridge(vec2(a * 4. + fbm(p * 2. + t * .02) * 1.5, (r - R0) * 5. - t * .06));
  col += vec3(.85, .87, .92) * pow(wisp, 3.) * exp(-max(r - R0, 0.) / .13) * step(R0 - .02, r) * 1.4;
  return col * (.6 + .3 * uBreath);
}

// Туманность: фиолетовая плазма, светящееся ядро, ударное кольцо
vec3 wNebula(vec2 p, float t){
  float r = length(p), a = atan(p.y, p.x);
  vec2 q = warp(p * 1.2, t);
  float s1 = ridge(q * 2.4 + t * .02), s2 = ridge(q * 5. - t * .03);
  vec3 col = (vec3(.5, .28, 1.) * pow(s1, 2.) * .9 + vec3(1., .5, .9) * pow(s2, 3.) * .6) * smoothstep(1., .08, r);
  col += vec3(1., .82, 1.) * .012 / (r * r + .006) * (.6 + .4 * uBreath + .3 * uLow);
  float ph = fract(t * .045), ringR = ph * 1.1;
  col += vec3(.9, .7, 1.) * exp(-abs(r - ringR - (fbm(vec2(a * 3., t)) - .5) * .08) / .012) * (1. - ph) * .7;
  return col * (.6 + .3 * uBreath);
}

// Поле: два потока волокон — как силовые линии или струи дыма, синее с розовым и огнём
float fibers(vec2 p, float t, float k){
  float y = p.y + .35 * fbm(vec2(p.x * .9 + t * .03, k)) + .12 * sin(p.x * 2. + t * .08 + k);
  float f = ridge(vec2(p.x * 1.2 + t * .02, y * 14.) + k);
  return pow(f, 4.) * 1.8 * smoothstep(.3, .7, fbm(p * 1.2 + k + t * .02));
}
vec3 wField(vec2 p, float t){
  vec2 pa = rot(.45) * p, pb = rot(-.35) * p;
  float fa = fibers(pa, t, 1.), fb = fibers(pb, t * 1.2, 5.);
  vec3 ca = mix(vec3(.2, .4, 1.), vec3(.7, .3, 1.), smoothstep(-.6, .6, p.x));
  vec3 cb = mix(vec3(1., .3, .6), vec3(1., .55, .25), smoothstep(-.4, .6, p.x));
  vec3 col = ca * fa * 1.6 + cb * fb * 1.6;
  col += vec3(.25, .15, .45) * pow(ridge(warp(p * 1.5, t) * 2.), 3.) * .5;
  return col * smoothstep(1.2, .2, length(p)) * (.6 + .3 * uBreath);
}

// Призма: свет проходит сквозь стекло и расслаивается в радужные лучи
vec3 wPrism(vec2 p, float t){
  vec2 q = rot(-.95) * p;
  float d = .004 + .012 * uDisp;
  vec3 col;
  for (int k = 0; k < 3; k++){
    float u = q.x + (float(k) - 1.) * d;
    float s = pow(noise(vec2(u * 30., q.y * .5 - t * .12)), 6.) + .8 * pow(noise(vec2(u * 90. + 3., q.y * .3 - t * .2)), 8.);
    col[k] = s;
  }
  col = col * 2.2 * mix(vec3(.85, .92, 1.), vec3(1., .9, .7), noise(vec2(q.x * 3., t * .03))) + hue(q.x * 4. + t * .01) * pow(noise(vec2(q.x * 30., t * .05)), 6.) * .25;
  return col * smoothstep(.9, .1, abs(q.x + .1 * sin(t * .05))) * (.6 + .3 * uBreath);
}

vec3 wLight(vec2 p, float t){
  float r = length(p);
  float fill = smoothstep(0., 25., uTimeB);
  vec3 rings = mix(vec3(.55, .5, .45), hue(r * 2.5 - t * .05) * .5 + .5, .3);
  vec3 col = mix(rings * .4 * smoothstep(1.1, 0., r) + .05, vec3(1., .97, .93), fill * .5);
  col += vec3(1., .95, .9) * .02 / (r * r + .02) * (.3 + .2 * uBreath);
  return col * (.7 + .15 * uBreath);
}

vec3 world(int id, vec2 p, float t){
  if (id == 1) return wFrost(p, t);
  if (id == 2) return wWaterlights(p, t);
  if (id == 3) return wFlame(p, t);
  if (id == 4) return wCorona(p, t);
  if (id == 5) return wNebula(p, t);
  if (id == 6) return wField(p, t);
  if (id == 7) return wPrism(p, t);
  if (id == 8) return wLight(p, t);
  return vec3(0.);
}

// кривизна: мир закручивается и дышит вокруг центра, когда складка проходит сквозь него
vec2 bend(vec2 p, float amt, float t){
  float r = length(p);
  p = rot(amt * 1.4 * exp(-r * 1.8)) * p;
  return p * (1. + amt * .12 * sin(r * 9. - t * 2.5));
}

uniform vec3 uShake;   // дрожь камеры: сдвиг x, y и поворот

void main(){
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / min(uRes.x, uRes.y);
  p = rot(uShake.z) * p + uShake.xy;
  bool needPl = uA == 0 || (uB == 0 && uMix > .001) || uFold > .001 || uMicro.w > 0.;
  vec3 pl = needPl ? plasma(p, uTime) : vec3(0.);
  vec2 pw = bend(p, uFold, uTime);
  vec3 col = uMix < .999 ? (uA == 0 ? pl : world(uA, pw, uTimeA)) : vec3(0.);
  if (uMix > .001){
    // новая реальность проступает сквозь складки
    float n = fbm(p * 2.2 + uSeed * 7.) - .25 * dot(pl, vec3(.33));
    float m = smoothstep(n - .12, n + .12, uMix * 1.3 - .15);
    vec3 cb = uB == 0 ? pl : world(uB, pw, uTimeB);
    col = mix(col, cb, uMix > .999 ? 1. : m);
  }
  // во время перехода плазма проходит сквозь любой мир
  if (uA != 0 && uB != 0) col += pl * uFold;
  else col += pl * uFold * .5 * (1. - abs(uMix * 2. - 1.));
  // малая складка: в мире на миг проявляется изнанка и угасает
  if (uMicro.w > 0.){
    float life = sin(3.14159 * uMicro.z) * uMicro.w;
    float d = length(p - uMicro.xy);
    col = mix(col, pl * 1.4, smoothstep(.28, .02, d + (fbm(p * 5. + uSeed) - .5) * .15) * life);
  }
  col *= 1. + .25 * uPulse;
  col += vec3(1., .95, .9) * uIntro * .0012 / (dot(p, p) + .0006) * (.75 + .25 * sin(uTime * 1.8));
  // долгая выдержка: прошлый кадр тает и чуть стекает, как в видео
  vec2 c = vUv - .5;
  vec3 prev = texture(uPrev, .5 + rot(.0012 * (1. + uEnergy)) * c * (1. - .002 * uBreath) + vec2(0., .0015)).rgb;
  col = max(col, prev * uTrail);
  outColor = vec4(min(col, vec3(6.)), 1.);
}`;

export const POST = COMMON + `
uniform sampler2D uTex;
uniform float uDisp, uExposure, uFade;
void main(){
  vec2 uv = vUv, c = uv - .5;
  // оптика: лёгкая хроматическая кайма к краям кадра, как у линзы
  vec2 d = c * (.003 + .004 * uDisp);
  vec3 col = vec3(texture(uTex, uv + d).r, texture(uTex, uv).g, texture(uTex, uv - d).b);
  vec3 b = vec3(0.); float ar = uRes.y / uRes.x;
  for (int i = 0; i < 8; i++){
    float a = float(i) * .785 + .3;
    vec2 o = vec2(cos(a) * ar, sin(a));
    b += texture(uTex, uv + o * .012).rgb + texture(uTex, uv + o * .032).rgb;
  }
  col += b / 16. * .55;
  col = 1. - exp(-col * 1.25 * uExposure);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.) - .5) * .012;
  col *= smoothstep(1.25, .35, length(c * vec2(uRes.x / uRes.y, 1.)));
  outColor = vec4(max(col, 0.) * uFade, 1.);
}`;
