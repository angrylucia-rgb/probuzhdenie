/* ---------- Абсолют: чистый свет → первичное разделение (глубина 0–2) ---------- */
const ABS = (() => {
  const root = new THREE.Group(); root.visible = false; mscene.add(root);
  const U = { uA:{value:0}, uD:{value:0}, uT:{value:0}, uM:{value:new THREE.Vector2(.5, .5)}, uHov:{value:0}, uAsp:{value:1}, uC:{value:new THREE.Vector2(.5, .5)}, uL:{value:.42}, uPx:{value:0} };
  const mat = new THREE.ShaderMaterial({
    uniforms:U,
    vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader:`
uniform float uA, uD, uT, uHov, uAsp, uL, uPx; uniform vec2 uM, uC; varying vec2 vUv;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
void main(){
  vec2 q = (vUv - uC)*vec2(uAsp, 1.0);
  vec2 m = (uM - uC)*vec2(uAsp, 1.0);
  float s = clamp(uD, 0.0, 1.0);
  // 0 · абсолютный свет: едва заметное дыхание и рябь от курсора
  float dm = length(q - m);
  float breath = 0.5 + 0.5*sin(uT*0.55);
  float ripple = sin(dm*38.0 - uT*2.2)*exp(-dm*5.5)*uHov;
  float glowC = exp(-dm*dm*9.0)*uHov;
  vec3 white = vec3(1.0, 0.995, 0.985) - 0.022*breath*(1.0 - exp(-length(q)*1.2)) + 0.012*ripple + vec3(0.0, 0.004, 0.012)*glowC;
  white -= 0.004*h21(vUv*vec2(913.0, 577.0) + fract(uT));
  // 1 · свёртка света в точку
  float a = smoothstep(0.0, 0.45, s);
  float R = mix(2.6, 0.0, pow(a, 0.5));
  float soft = mix(0.35, 0.004, a);
  float r = length(q);
  float disk = 1.0 - smoothstep(R, R + soft, r);
  // 2 · точка растягивается в линию — ось напряжения
  float b = smoothstep(0.38, 0.7, s);
  float L = uL*b;
  vec2 cq = vec2(clamp(q.x, -L, L), 0.0);
  float ds = length(q - cq);
  float shimmer = 0.75 + 0.25*sin(q.x*60.0 - uT*6.0)*sin(q.x*23.0 + uT*3.1);
  float line = exp(-ds*mix(90.0, 160.0, b))*shimmer*smoothstep(0.35, 0.5, s) + exp(-r*r*mix(4000.0, 900.0, b))*smoothstep(0.3, 0.45, s);
  float halo = exp(-ds*14.0)*0.18*smoothstep(0.35, 0.6, s);
  // 3 · поляризация: две контрастные интерференции
  float c = smoothstep(0.62, 1.0, s);
  vec2 s1 = vec2(-L, 0.0), s2 = vec2(L, 0.0);
  float k = 74.0, w = uT*1.1;
  float r1 = length(q - s1), r2 = length(q - s2), r3 = length(q - m);
  float wv = cos(k*r1 - w) + cos(k*r2 - w) + 0.6*uHov*cos(k*r3 - w*1.4)*exp(-r3*3.0);
  float I = wv*wv/4.0;
  float side = smoothstep(-0.012, 0.012, q.y);
  float fade = exp(-r*1.5)*(0.35 + 0.65*smoothstep(0.0, 0.08, abs(q.y)));
  vec3 up = vec3(1.0, 0.86, 0.55)*pow(I, 1.8)*0.55 + vec3(0.05, 0.03, 0.0);
  vec3 dn = mix(vec3(0.26, 0.36, 0.85), vec3(0.015, 0.02, 0.07), pow(I, 0.7))*0.5;
  vec3 pol = mix(dn, up, side)*fade*c;
  vec3 dark = pol + vec3(1.0, 0.97, 0.9)*(line + halo);
  vec3 col = mix(dark, white, disk);
  col += vec3(1.0, 0.97, 0.9)*exp(-max(r - R, 0.0)*mix(3.0, 60.0, a))*(1.0 - disk)*(1.0 - b*0.7)*step(0.001, a)*0.8;
  gl_FragColor = vec4(col, uA);
}`,
    transparent:true, depthTest:false, depthWrite:false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false; quad.renderOrder = -97; root.add(quad);
  // пары частиц: материя вверх, антиматерия вниз
  const pairs = pts(2600*Q, (i, o) => { o.p = [rn(), 0, 0]; o.rnd = [i % 2 ? 1 : -1, Math.random(), Math.random()]; o.c = i % 2 ? C(0xffe0a0) : C(0x8fa8ff); o.s = .7 + Math.random()*.9; },
    `float life = fract(aRnd.y + uTime*(0.05 + aRnd.z*0.05));
     p = vec3(position.x*uProg, aRnd.x*(0.04 + life*life*3.4), (aRnd.z - 0.5)*0.6);
     p.x += sin(life*9.0 + aSeed*40.0)*life*0.35;
     a = 0.85*sin(life*3.1416)*smoothstep(0.0, 0.08, life);`);
  const pg = new THREE.Group(); pg.add(pairs); root.add(pg);
  const cam = new THREE.Vector3();
  return {
    update(D, hE, T, nx, ny, hov, portrait){
      const M = smooth(.25, .9, hE);
      root.visible = M > .003;
      if (!root.visible) return 0;
      U.uA.value = M; U.uD.value = D; U.uT.value = T; U.uAsp.value = W/H;
      U.uM.value.lerp(new THREE.Vector2((nx + 1)/2, (ny + 1)/2), .08);
      U.uHov.value += ((hov ? 1 : 0) - U.uHov.value)*.05;
      // центр сцены: туда, куда mcam проецирует точку (0,0,−10)
      cam.set(0, 0, -10).project(mcam);
      const cx = (cam.x + 1)/2, cy = (cam.y + 1)/2;
      U.uC.value.set(cx + (.5 - cx)*(1 - smooth(.3, .8, D)), cy + (.5 - cy)*(1 - smooth(.3, .8, D)));
      U.uL.value = portrait ? .3 : .42;
      pg.position.set(0, 0, -10);
      const Lw = U.uL.value*2*10*Math.tan(24*Math.PI/180);
      const pm = pairs.material.uniforms;
      pm.uProg.value = Lw; pm.uOpacity.value = M*smooth(.7, 1, D)*(1 - smooth(1.4, 1.9, D));
      pairs.visible = pm.uOpacity.value > .003;
      return M;
    }
  };
})();
