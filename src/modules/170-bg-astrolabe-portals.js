/* ---------- фон и затемнение ---------- */
const QUAD_V = `varying vec2 vUv; void main(){ vUv = position.xy*0.5 + 0.5; gl_Position = vec4(position.xy, 0.999, 1.0); }`;
const bgMat = new THREE.ShaderMaterial({
  uniforms:{ uTint:{value:new THREE.Color(TINT[0])}, uAspect:{value:1}, uC:{value:new THREE.Vector2(.58,.55)} },
  vertexShader: QUAD_V,
  fragmentShader: `uniform vec3 uTint; uniform float uAspect; uniform vec2 uC; varying vec2 vUv;
    void main(){ vec2 q = vUv - uC; q.x *= uAspect; float d = length(q);
      vec3 night = vec3(0.012, 0.014, 0.03);
      vec3 c = mix(night, uTint*1.2, 1.0 - smoothstep(0.0, 0.9, d));
      gl_FragColor = vec4(c, 1.0); }`,
  depthTest:false, depthWrite:false });
const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), bgMat); bgQuad.frustumCulled = false; bgQuad.renderOrder = -10; scene.add(bgQuad);
const fadeMat = new THREE.ShaderMaterial({ uniforms:{uA:{value:0}}, vertexShader: QUAD_V,
  fragmentShader:`uniform float uA; varying vec2 vUv; void main(){ gl_FragColor = vec4(0.012, 0.012, 0.03, uA); }`,
  transparent:true, depthTest:false, depthWrite:false });
const fadeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), fadeMat); fadeQuad.frustumCulled = false; fadeQuad.renderOrder = 999; scene.add(fadeQuad);

/* ---------- астролябия ---------- */
const R = 40, RC = 26.5;
const astro = new THREE.Group(); scene.add(astro);
function torus(r, tube, color, opacity){ const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 360), new THREE.MeshBasicMaterial({color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false})); m.rotation.x = Math.PI/2; return m; }
astro.add(torus(R, .05, 0xD6AC5E, .8), torus(R+2.6, .025, 0xD6AC5E, .45), torus(R-2.4, .02, 0xD6AC5E, .28), torus(R+7, .02, 0x8C7442, .3));
{ const a = [];
  for (let k = 0; k < 720; k++){ const th = (k/2)*Math.PI/180, major = k % 60 === 0, mid = k % 10 === 0;
    const r1 = R+2.6, r2 = major ? R+.3 : mid ? R+1.5 : R+2.15;
    a.push(Math.sin(th)*r1, 0, -Math.cos(th)*r1, Math.sin(th)*r2, 0, -Math.cos(th)*r2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(a,3));
  astro.add(new THREE.LineSegments(g, lineMat(0xD6AC5E, .45)));
  const b = [];
  for (let k = 0; k < 72; k++){ const th = k/72*TAU; b.push(Math.sin(th)*(R+2.6), 0, -Math.cos(th)*(R+2.6), Math.sin(th)*(R+7), 0, -Math.cos(th)*(R+7)); }
  const g2 = new THREE.BufferGeometry(); g2.setAttribute("position", new THREE.Float32BufferAttribute(b,3));
  astro.add(new THREE.LineSegments(g2, lineMat(0x8C7442, .2)));
}
const ecl = new THREE.Group(); ecl.rotation.z = 23.44*Math.PI/180; ecl.add(torus(R, .03, 0xB79BE0, .3)); astro.add(ecl);
const mer = torus(R, .02, 0xD6AC5E, .14); mer.rotation.set(0,0,0); astro.add(mer);
for (const h of [-14, 14]){ const l = new THREE.LineLoop(circleGeo(Math.sqrt(R*R-h*h), 240, 0, 0), new THREE.LineDashedMaterial({color:0x8C7442, dashSize:.6, gapSize:.9, transparent:true, opacity:.26})); l.rotation.x = Math.PI/2; l.position.y = h; l.computeLineDistances(); astro.add(l); }
{ const a = []; for (let k = 0; k < 12; k++){ const th = k/12*TAU; a.push(Math.sin(th)*3, 0, -Math.cos(th)*3, Math.sin(th)*(R-2.4), 0, -Math.cos(th)*(R-2.4)); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(a,3)); astro.add(new THREE.LineSegments(g, lineMat(0x8C7442, .16))); }
const alid = new THREE.Group(); astro.add(alid);
{ const m = new THREE.Mesh(new THREE.BoxGeometry(.25, .08, R*2 + 6), new THREE.MeshBasicMaterial({color:0xD6AC5E, transparent:true, opacity:.5, blending:THREE.AdditiveBlending, depthWrite:false})); alid.add(m);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.9, 2.4, 3), m.material); tip.rotation.x = -Math.PI/2; tip.position.z = -(R+4.2); alid.add(tip);
  alid.add(glow(0xD6AC5E, 5, .7)); }
const alidMats = []; alid.traverse(o => { if (o.material && !alidMats.some(x => x[0] === o.material)) alidMats.push([o.material, o.material.opacity]); });
const astroMats = [];
let astroF = 1;
function astroFade(f){ if (Math.abs(f - astroF) < .002) return; astroF = f;
  if (!astroMats.length) astro.traverse(o => { if (o.material && !alidMats.some(x => x[0] === o.material) && !astroMats.some(x => x[0] === o.material)) astroMats.push([o.material, o.material.opacity ?? 1]); });
  for (const [m, b] of astroMats){ if (m.uniforms) m.uniforms.uOpacity.value = f; else m.opacity = b*f; } }
astro.add(pts(7000*Q, (i,o) => { o.p = [Math.random()*TAU, gauss()*.55, gauss()*.35]; o.c = mixc(GOLD, CREAM, Math.random()); o.s = .5 + Math.random()*.9; },
  `float ang = position.x + uTime*0.02*(0.6 + aSeed);
   float r = 40.0 + position.y;
   p = vec3(sin(ang)*r, position.z, -cos(ang)*r);
   a = 0.28 + 0.28*sin(uTime*2.0 + aSeed*30.0);`));
// Дальнее звёздное поле. uProg здесь — «поток»: на пролёте (см. zoomTick) звёзды разводятся от оси
// движения по закону sin(угла) — так выглядит параллакс при движении вперёд. Без него на экране
// двигался бы только сам объект, и мозг читал бы картинку как «объект растёт», а не «мы летим».
const bgStars = pts(9000*Q, (i,o) => { const d = dir(), r = 260 + Math.random()*500; o.p = d.map(v => v*r); o.c = mixc(C(0xbfc8ff), C(0xfff0d8), Math.random()); o.s = 14 + Math.random()*34*(Math.random() < .08 ? 2.2 : 1); },
  `if (abs(uProg) > 0.0005){
     float L = length(position);
     vec3 dp = position/L, ax = normalize(uCur);
     float c = clamp(dot(dp, ax), -1.0, 1.0);
     vec3 perp = dp - ax*c; float pl = length(perp);
     if (pl > 0.0001){
       float ang = acos(c);
       float na = clamp(ang + uProg*sin(ang), 0.02, 3.12);
       p = (ax*cos(na) + (perp/pl)*sin(na))*L;
     }
   }
   a = 0.35 + 0.65*abs(sin(uTime*0.25*(aSeed + 0.2) + aSeed*50.0));`);
scene.add(bgStars);

/* ---------- порталы-переходы ---------- */
const PORTAL_LABELS = [
  ["10⁰ м · тело", "10⁻¹ м · органы", "10⁻² м · ткани", "10⁻³ м · капилляры", "10⁻⁴ м · клетка", "10⁻⁵ м · ядро", "10⁻⁶ м · хромосомы"],
  ["10⁻³⁵ м · планковская длина", "10⁻¹⁸ м · кварки", "10⁻¹⁰ м · атомы", "10⁰ м · человек", "10¹³ м · Солнечная система", "10²¹ м · галактики", "10²⁶ м · Вселенная"]
];
const portals = [
  { c1:C(0x6fe0c0), c2:C(0xff7fc0), twist:.06, end:0xff7fc8, lines:0x9ff0dc },
  { c1:C(0x9a6bff), c2:C(0xffcf7a), twist:.35, end:0xfff0c8, lines:0xD6AC5E }
].map((cfg, pi) => {
  const grp = new THREE.Group(); grp.visible = false; tscene.add(grp);
  const flow = pts(9000*Q, (i,o) => { const r = 2.4 + Math.pow(Math.random(), .6)*8; o.p = [Math.random()*TAU, r, Math.random()*220]; o.c = mixc(cfg.c1, cfg.c2, Math.random()); o.s = .7 + Math.random()*1.6; },
    `float ang = position.x + uTime*${cfg.twist.toFixed(3)} + position.z*${(cfg.twist*0.05).toFixed(4)};
     float z = mod(position.z + uTime*uSpeed, 220.0);
     p = vec3(cos(ang)*position.y, sin(ang)*position.y, -220.0 + z);
     a = smoothstep(-220.0, -140.0, p.z) * (1.0 - smoothstep(-5.0, 0.0, p.z));
     col = mix(col, vec3(1.0), smoothstep(-40.0, -3.0, p.z)*0.5);
     s *= 1.0 + smoothstep(-30.0, 0.0, p.z)*0.6;`);
  grp.add(flow);
  const dust = pts(3000*Q, (i,o) => { o.p = [rn()*30, rn()*20, -Math.random()*200]; o.c = CREAM; o.s = .5; },
    `float z = mod(position.z + uTime*uSpeed*0.4, 200.0) - 200.0; p = vec3(position.x, position.y, z); a = 0.25*smoothstep(-200.0, -120.0, z)*(1.0 - smoothstep(-8.0, 0.0, z));`);
  grp.add(dust);
  const rings = PORTAL_LABELS[pi].map((txt, k) => {
    const rg = new THREE.Group();
    const lm = lineMat(cfg.lines, .6);
    rg.add(new THREE.LineLoop(circleGeo(6.8, 160, 0, 0), lm));
    const ticks = []; for (let j = 0; j < 36; j++){ const a = j/36*TAU, r2 = j % 3 === 0 ? 6.1 : 6.5; ticks.push(Math.cos(a)*6.8, Math.sin(a)*6.8, 0, Math.cos(a)*r2, Math.sin(a)*r2, 0); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(ticks,3));
    rg.add(new THREE.LineSegments(tg, lm));
    const lb = label(txt, "500 34px 'JetBrains Mono', monospace", "#EFE7D4", 1.05); lb.position.set(0, -8.2, 0); rg.add(lb);
    grp.add(rg);
    return { rg, lm, lb };
  });
  const end = glow(cfg.end, 10, 1); grp.add(end);
  let snake = null;
  if (pi === 1){ // уроборос — кольцо-змей в конце
    snake = pts(3000*Q, (i,o) => { o.p = [Math.random()*TAU, rn(), 0]; o.s = .8 + Math.random(); },
      `float u = position.x + uTime*0.4;
       float th = 1.0 - fract(position.x/6.28318);
       p = vec3(cos(u)*5.0, sin(u)*5.0, 0.0) + vec3(cos(u), sin(u), 0.0)*position.y*0.35*th + vec3(0.0, 0.0, position.y*0.35*th);
       col = mix(vec3(0.98,0.8,0.45), vec3(0.62,0.42,1.0), th);
       a = 0.35 + 0.65*th;`);
    grp.add(snake);
  }
  const mats = []; grp.traverse(o => { if (o.material) mats.push([o.material, o.material.opacity ?? 1]); });
  return { grp, flow, dust, rings, end, snake, mats };
});
function updatePortal(pi, k, q, T, speed){
  const P = portals[pi];
  P.grp.visible = k > .01;
  if (!P.grp.visible) return;
  for (const [m, b] of P.mats){ if (m.uniforms){ m.uniforms.uOpacity.value = k; m.uniforms.uSpeed.value = speed; } else m.opacity = b*k; }
  const n = P.rings.length, gap = 30, travel = n*gap + 30;
  P.rings.forEach((r, i) => {
    const z = -(i+1)*gap - 8 + q*travel;
    r.rg.position.z = z;
    r.rg.rotation.z = (pi ? 1 : -1)*(T*.05 + i*.3);
    const f = smooth(-200, -110, z)*(1 - smooth(-10, -2, z));
    r.rg.visible = f > .01 && z < -1;
    r.lm.opacity = .6*k*f; r.lb.material.opacity = .95*k*f;
  });
  const ez = -160 + q*150; P.end.position.z = ez; const es = 8 + q*30; P.end.scale.set(es, es, 1); P.end.material.opacity = k*(.4 + .6*q);
  if (P.snake){ P.snake.position.z = -120 + q*110; P.snake.rotation.z = T*.2; P.snake.material.uniforms.uOpacity.value = k*smooth(.1, .5, q); }
  tcam.rotation.z = pi ? T*.08 : Math.sin(T*.3)*.05;
}

