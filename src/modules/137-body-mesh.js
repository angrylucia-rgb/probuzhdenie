/* ---------- v185: тело на своей странице — сплошной шар с картой поверхности ----------
   Плотный шар из частиц (v184) на настоящей видеокарте читался как редкая россыпь искр: точки мельче пикселя
   и сложение света съедали и цвет, и рисунок. Теперь на странице тела рисуется сплошной шар: карта BMAP
   читается в каждом пикселе, рельеф строится по высоте карты (нормаль считается заново под любое положение
   Солнца), свет — мягкий терминатор, у газовых гигантов и Венеры — светящийся край атмосферы.
   Поверх — лёгкая «зернистость» в духе сайта. Шар один, 13 тыс. вершин: это дешевле, чем 100 тыс. точек.
   Ось вращения — y; карта сдвигается по долготе (uSpin, рад) — поверхность вращается, свет стоит на месте. */
const BODY_COL = {
  // Луна: реголит, моря — базальт, лучи молодых кратеров светлее
  moon:`vec3 c = vec3(0.86,0.84,0.80)*(0.10 + 1.05*m.r);
        c *= mix(vec3(1.0), vec3(0.88,0.91,1.0), m.b*0.6);
        c += vec3(0.10)*m.a; rough = 1.0; bump = 2.6;`,
  mer:`vec3 c = mix(vec3(0.66,0.62,0.57), vec3(0.42,0.45,0.52), m.b)*(0.12 + 1.05*m.r);
        c += vec3(0.10,0.09,0.08)*m.a; rough = 1.0; bump = 2.8;`,
  mar:`vec3 c = mix(vec3(0.80,0.45,0.25), vec3(0.30,0.20,0.16), m.b)*(0.30 + 0.95*m.r);
        c = mix(c, vec3(0.97,0.96,0.95), m.a);
        rough = 0.6; bump = 2.0; atm = vec3(0.95,0.62,0.42)*0.35;`,
  jup:`vec3 c = mix(vec3(0.92,0.85,0.72), vec3(0.62,0.40,0.24), m.g);
        c = mix(c, vec3(0.80,0.34,0.20), m.b*0.9);
        c = mix(c, vec3(1.0,0.98,0.94), m.a*0.85);
        c = mix(c, vec3(0.55,0.60,0.68), smoothstep(0.72, 0.95, abs(ns.y))*0.6);
        c *= clamp(0.70 + 1.0*(m.r - 0.7), 0.35, 1.1);
        rough = 0.35; atm = vec3(0.95,0.85,0.70)*0.30;`,
  sat:`vec3 c = mix(vec3(0.98,0.93,0.78), vec3(0.76,0.62,0.38), m.g);
        c = mix(c, vec3(0.55,0.63,0.72), m.b);
        c = mix(c, vec3(1.0,0.97,0.88), m.a*0.6);
        c *= clamp(0.72 + 1.8*(m.r - 0.8), 0.3, 1.25);
        rough = 0.35; atm = vec3(0.98,0.90,0.70)*0.25;`,
  ura:`vec3 c = mix(vec3(0.30,0.58,0.64), vec3(0.58,0.82,0.86), clamp((m.r - 0.8)*4.0 + 0.5, 0.0, 1.0));
        c = mix(c, vec3(0.85,0.95,0.96), m.a*0.6);
        rough = 0.3; atm = vec3(0.50,0.85,0.90)*0.22;`,
  nep:`vec3 c = mix(vec3(0.10,0.22,0.70), vec3(0.42,0.66,1.0), clamp((m.r - 0.62)*4.0 + 0.5, 0.0, 1.0));
        c = mix(c, vec3(0.05,0.09,0.32), m.b*0.9);
        c = mix(c, vec3(0.96,0.99,1.0), m.a*0.85);
        rough = 0.3; atm = vec3(0.40,0.60,1.0)*0.45;`,
  eur:`vec3 c = vec3(0.94,0.93,0.90)*(0.30 + 0.85*m.r);
        c = mix(c, vec3(0.50,0.26,0.13), clamp(m.b*1.2, 0.0, 1.0));
        c = mix(c, vec3(0.72,0.54,0.42), m.a*0.6);
        rough = 0.8; bump = 2.2;`,
  // Венера — без карты: верхний ярус облаков, Y-образная тёмная полоса в ультрафиолете, полярные воротники
  ven:`float lo = atan(ns.x, ns.z), y = ns.y;
        float cl = fbm(ns*3.6 + vec3(uTime*0.02, 0.0, 0.0)), st = fbm(ns*9.0 + vec3(3.0));
        float yb = exp(-pow((abs(y) - 0.10 - 0.30*clamp(0.5 + 0.5*sin(lo), 0.0, 1.0))*6.0, 2.0))*smoothstep(-0.3, 0.6, sin(lo + 0.8));
        vec3 c = mix(vec3(1.0,0.95,0.78), vec3(0.78,0.58,0.30), cl*0.45 + yb*0.40 + st*0.10);
        c = mix(c, vec3(0.88,0.78,0.55), smoothstep(0.72, 0.95, abs(y))*0.45);
        rough = 0.25; atm = vec3(1.0,0.90,0.65)*0.55;`
};
const BODY_VS = `varying vec3 vObj; varying vec3 vNv; varying vec3 vPv;
void main(){ vObj = normalize(position); vNv = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position, 1.0); vPv = mv.xyz; gl_Position = projectionMatrix*mv; }`;
function bodyMesh(k, tex){
  const fs = `
uniform sampler2D uMap; uniform float uTime; uniform float uSolid; uniform float uSpin; uniform float uA; uniform vec2 uTx; uniform float uTurb;
varying vec3 vObj; varying vec3 vNv; varying vec3 vPv;
${S_DECL}
vec2 uvOf(vec3 n){ return vec2(atan(n.x, n.z)/6.2831853 + 0.5, asin(clamp(n.y, -1.0, 1.0))/3.1415927 + 0.5); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
void main(){
  // ns — точка поверхности в системе карты (повернута на uSpin), L — направление на Солнце в той же системе
  mat3 R = rotY(uSpin);
  vec3 ns = normalize(R*vObj), L = normalize(R*vec3(cos(uSolid), 0.0, sin(uSolid)));
  vec2 uv = uvOf(ns);
  // газовые гиганты: вихри на краях полос — слегка сбиваем широту и долготу шумом, иначе полосы как по линейке
  if (uTurb > 0.0){ uv.y += uTurb*0.010*(fbm(ns*vec3(5.0, 26.0, 5.0) + vec3(uTime*0.01, 0.0, 0.0)) - 0.5);
                    uv.x += uTurb*0.016*(fbm(ns*vec3(9.0, 40.0, 9.0) + vec3(7.0)) - 0.5); }
  vec4 m = texture2D(uMap, uv);
  // мелкая неоднородность альбедо: на крупном плане карта не должна быть плоской
  m.r *= 0.90 + 0.10*fbm(ns*14.0 + vec3(2.0)) + 0.08*(fbm(ns*48.0) - 0.5);
  float rough = 0.5, bump = 0.0; vec3 atm = vec3(0.0);
  ${BODY_COL[k]}
  // рельеф: наклон по высоте карты (G) на восток и на север
  vec3 n = ns;
  if (bump > 0.0){
    float cl = max(0.12, sqrt(1.0 - ns.y*ns.y));
    float gx = (texture2D(uMap, uv + vec2(uTx.x, 0.0)).g - texture2D(uMap, uv - vec2(uTx.x, 0.0)).g)/cl;
    float gy = texture2D(uMap, uv + vec2(0.0, uTx.y)).g - texture2D(uMap, uv - vec2(0.0, uTx.y)).g;
    vec3 E = normalize(vec3(ns.z, 0.0, -ns.x) + vec3(1e-5, 0.0, 0.0)), N = cross(ns, E);
    // мелкий рельеф сверх карты — шум: вблизи поверхность не гладкая
    float d1 = fbm(ns*60.0), d2 = fbm(ns*60.0 + E*0.02), d3 = fbm(ns*60.0 + N*0.02);
    n = normalize(ns - bump*(gx*E + gy*N) - 0.35*bump*((d2 - d1)*E + (d3 - d1)*N));
    c *= 0.92 + 0.16*d1;
  }
  float mu = dot(n, L), mu0 = dot(ns, L);
  // мягкий терминатор: у тел без воздуха свет почти не гаснет к краю (закон Ломмеля — Зеелигера)
  float lam = max(mu, 0.0), ls = lam/(lam + 0.35)*1.12;
  float lit = mix(lam, ls, rough)*smoothstep(-0.10, 0.06, mu0);
  vec3 col = c*(0.05 + 0.80*lit);   // экспозиция с запасом: свечение (bloom) сайта и так поднимает светлое
  // атмосфера: свечение у края освещённой стороны
  vec3 V = normalize(-vPv); float fr = pow(1.0 - max(dot(normalize(vNv), V), 0.0), 3.0);
  col += atm*fr*smoothstep(-0.3, 0.4, mu0)*1.4;
  // зернистость в духе частиц сайта
  col *= 0.94 + 0.12*h31(floor(gl_FragCoord.xyz*0.5) + vec3(uTime*0.0));
  gl_FragColor = vec4(col, uA);
}`;
  const W = tex && tex.image ? tex.image.width : 1024, H = tex && tex.image ? tex.image.height : 512;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex && tex !== true ? tex : MAP0 }, uTime: U.time, uSolid: { value: 0 }, uSpin: { value: 0 }, uA: { value: 0 }, uTurb: { value: BODY_TURB[k] || 0 }, uTx: { value: new THREE.Vector2(1/W, 1/H) } },
    vertexShader: BODY_VS, fragmentShader: fs, transparent: true, depthWrite: true
  });
  const o = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), mat);
  o.renderOrder = 2;
  return o;
}
// скорость вращения поверхности на странице тела (рад/с); у Юпитера и Нептуна — средняя
// прозрачность шара; глубину пишет только почти непрозрачный — иначе на проявлении он вырезал бы звёзды за собой
function bodyA(o, a){ o.material.uniforms.uA.value = a; o.material.depthWrite = a > .9; }
const BODY_TURB = { jup:1, sat:.6, ura:.3, nep:.6 };
const BODY_SPIN = { moon:0, mer:0, ven:.05, mar:.04, jup:.12, sat:.10, ura:.08, nep:.10, eur:.03 };
