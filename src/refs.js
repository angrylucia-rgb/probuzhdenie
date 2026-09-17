/* ---------- анатомия по референсам: мышцы, органы, скелет с откликом на курсор ---------- */
const REF_FRAG = `
uniform sampler2D uTex; uniform sampler2D uDat; uniform sampler2D uSoft; uniform float uOp; uniform float uT; uniform float uKind;
uniform float uId0; uniform float uH0; uniform float uFx0; uniform vec3 uP0;
uniform float uId1; uniform float uH1; uniform float uFx1; uniform vec3 uP1;
uniform vec2 uCur; uniform vec2 uTx; uniform float uLens;
varying vec2 vUv;
const vec2 HEART = vec2(0.522, 0.585);
float idAt(vec2 p){ return floor(texture2D(uDat, p).r*25.5 + 0.5); }
bool eqf(float a, float b){ return abs(a - b) < 0.5; }
vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p)*43758.5453); }
float wedge(vec2 q){
  vec2 i = floor(q), f = fract(q); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 g = vec2(float(x), float(y)); vec2 r = g + hash2(i + g) - f; float d = dot(r, r);
    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2){ d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}
// мягкая маска области: плитка 4x4 в атласе, края размыты
float sm(float id, vec2 p){
  float k = id - 1.0; float col = mod(k, 4.0); float row = floor(k/4.0);
  p = clamp(p, vec2(0.004), vec2(0.996));
  return texture2D(uSoft, vec2((col + p.x)/4.0, (3.0 - row + p.y)/4.0)).r;
}
void apply(float id, float h, float fx, vec3 P, inout vec3 col, inout float al, inout float hit){
  if (h < 0.002 || id < 0.5) return;
  vec2 c = P.xy; float r = P.z; vec2 d = vUv - c; float L = length(d);
  float fall = 1.0 - smoothstep(r*1.2, r*2.6, L);
  float w0 = sm(id, vUv);
  vec2 dc = vUv - uCur;
  float near = exp(-dot(dc, dc)/(r*r*1.6 + 1e-5));
  if (uKind < 0.5){
    // мышцы: мягкое свечение волокон и лёгкое «набухание» мышцы
    vec2 uvs = c + d/(1.0 + 0.055*h*fall);
    float ws = sm(id, uvs);
    float wm = max(w0, ws);
    if (wm < 0.004) return;
    vec4 s = texture2D(uTex, uvs);
    vec3 bl = (texture2D(uTex, uvs + vec2(uTx.x*2.0, 0.0)).rgb + texture2D(uTex, uvs - vec2(uTx.x*2.0, 0.0)).rgb
             + texture2D(uTex, uvs + vec2(0.0, uTx.y*2.0)).rgb + texture2D(uTex, uvs - vec2(0.0, uTx.y*2.0)).rgb)*0.25;
    float det = max(dot(s.rgb - bl, vec3(0.333)), 0.0);
    float wave = 0.6 + 0.4*sin(length(uvs - uCur)*120.0 - uT*1.6);
    vec3 g = s.rgb*(1.0 + 0.28*h) + vec3(1.0, 0.56, 0.42)*h*(0.05 + det*4.2*wave)*(0.55 + 0.45*near);
    float a = smoothstep(0.0, 1.0, ws)*h;
    col = mix(col, g, a);
    al = mix(al, max(al, s.a), a);
    // мягкий ореол по краю — без линии
    col += vec3(1.0, 0.62, 0.45)*h*w0*(1.0 - w0)*0.45;
    hit = max(hit, wm*h);
    return;
  }
  if (uKind < 1.5){
    // органы: у каждого своё внутреннее движение, края мягкие
    vec2 uvs = vUv; float br = 0.5 - 0.5*cos(uT*0.785); float beat = 0.0;
    if (eqf(fx, 1.0)) uvs = c + vec2(d.x/(1.0 + 0.04*h*br*fall), d.y/(1.0 + 0.08*h*br*fall));
    else if (eqf(fx, 2.0)){ float ph = fract(uT*1.05); float b1 = (ph - 0.08)*16.0, b2 = (ph - 0.3)*16.0; beat = exp(-b1*b1) + 0.6*exp(-b2*b2); uvs = c + d/(1.0 + 0.07*h*beat*fall); }
    else if (eqf(fx, 3.0)) uvs = vUv + h*fall*0.0022*vec2(sin(vUv.x*180.0 - uT*1.9), cos(vUv.y*200.0 - uT*1.9));
    else if (eqf(fx, 8.0)) uvs = vUv - (d/(L + 1e-4))*h*fall*0.0024*sin(L*380.0 - uT*2.0) + h*fall*0.001*vec2(sin(vUv.y*300.0 + uT*1.3), cos(vUv.x*300.0 - uT));
    else if (eqf(fx, 5.0)) uvs = c + d/(1.0 + 0.03*h*(0.5 + 0.5*sin(uT*1.4))*fall) + h*fall*0.001*vec2(sin(vUv.y*220.0 + uT), cos(vUv.x*220.0 + uT*0.8));
    float ws = sm(id, uvs);
    float wm = max(w0, ws);
    if (wm < 0.004) return;
    vec4 s = texture2D(uTex, uvs);
    if (eqf(fx, 6.0)){
      float red = smoothstep(0.1, 0.28, s.r - max(s.g, s.b)); float blue = smoothstep(0.05, 0.18, s.b - s.r);
      float hd = length(vUv - HEART);
      float pa = pow(0.5 + 0.5*sin(hd*160.0 - uT*4.0), 10.0); float pv = pow(0.5 + 0.5*sin(hd*160.0 + uT*2.6), 10.0);
      col += h*w0*(red*(0.2 + pa*1.1)*vec3(1.0, 0.3, 0.3) + blue*(0.2 + pv*1.0)*vec3(0.35, 0.62, 1.0));
      hit = max(hit, h*w0*0.6);
      return;
    }
    vec3 g = s.rgb*(1.0 + 0.1*h);
    if (eqf(fx, 1.0)) g = s.rgb*(1.0 + 0.04*h*br);
    if (eqf(fx, 2.0)) g += vec3(1.0, 0.3, 0.28)*h*beat*0.28;
    if (eqf(fx, 4.0)){
      vec2 q = vUv*170.0; vec2 cl = floor(q);
      float rr = fract(sin(dot(cl + floor(uT*5.0), vec2(12.9898, 78.233)))*43758.5453);
      float sp = step(0.9, rr)*smoothstep(0.5, 0.0, length(fract(q) - 0.5));
      float wv = pow(0.5 + 0.5*sin(L*320.0 - uT*2.6), 6.0);
      g += vec3(0.55, 0.85, 1.0)*h*(sp*1.1 + wv*0.18);
    }
    if (eqf(fx, 7.0)) g += vec3(0.8, 0.95, 1.0)*h*pow(0.5 + 0.5*sin(vUv.y*260.0 + uT*2.4), 8.0)*0.6;
    g += vec3(0.8, 0.9, 1.0)*h*0.05*(0.5 + 0.5*near);
    float a = smoothstep(0.0, 1.0, ws)*h;
    col = mix(col, g, a);
    al = mix(al, max(al, s.a), a);
    col += vec3(0.7, 0.88, 1.0)*h*w0*(1.0 - w0)*0.4;
    hit = max(hit, wm*h);
    return;
  }
  // кости: мягкая «рентгеновская линза» вокруг курсора показывает внутреннее строение
  if (w0 < 0.004) return;
  vec4 D = texture2D(uDat, vUv); float dep = D.g; float sp = D.b;
  float lc = length(vUv - uCur);
  float m = (1.0 - smoothstep(uLens*0.3, uLens*1.15, lc))*h*smoothstep(0.0, 1.0, w0);
  vec3 bone = col;
  float tr = 1.0 - smoothstep(0.05, 0.16, wedge(vUv*72.0));
  float cortT = 1.0 - smoothstep(0.26, 0.46, dep);
  vec3 tubeC = mix(vec3(0.98, 0.78, 0.36)*0.75, bone*1.2, cortT) + vec3(1.0, 0.95, 0.85)*cortT*0.08*(0.5 + 0.5*sin(dep*100.0));
  float tubeA = mix(0.42, 1.0, cortT);
  float cortS = 1.0 - smoothstep(0.08, 0.24, dep);
  float solidS = max(tr, cortS);
  vec3 spC = mix(vec3(0.75, 0.18, 0.22), bone*1.25, solidS);
  float divA = smoothstep(0.1, 0.2, uLens);
  float spA = mix(mix(0.48, 0.92, divA), 1.0, solidS);
  vec3 ic = mix(tubeC, spC, sp); float ia = mix(tubeA, spA, sp);
  col = mix(bone*(1.0 + 0.14*h*w0), ic, m);
  col += vec3(0.75, 0.9, 1.0)*h*w0*exp(-lc*lc/(uLens*uLens*2.0))*0.06;
  al = al*mix(1.0, ia, m);
  hit = max(hit, w0*h);
}
void main(){
  vec4 base = texture2D(uTex, vUv);
  vec3 col = base.rgb; float al = base.a; float hit = 0.0;
  apply(uId0, uH0, uFx0, uP0, col, al, hit);
  apply(uId1, uH1, uFx1, uP1, col, al, hit);
  float hm = max(uH0, uH1);
  col *= 1.0 - 0.34*hm*(1.0 - clamp(hit*1.3, 0.0, 1.0));
  if (uKind < 0.5) col *= 0.8;
  else if (uKind < 1.5){
    float mx = max(col.r, max(col.g, col.b)), mn = min(col.r, min(col.g, col.b));
    float sat = (mx - mn)/max(mx, 1e-3);
    float shell = 1.0 - smoothstep(0.1, 0.28, sat);
    col *= mix(vec3(0.92), vec3(0.5, 0.56, 0.64), shell);
    col = col*1.25/(1.0 + 0.45*col);
  }
  else col *= 0.72;
  vec2 o = uTx*9.0;
  float ha = texture2D(uTex, vUv + vec2(o.x, 0.0)).a + texture2D(uTex, vUv - vec2(o.x, 0.0)).a
           + texture2D(uTex, vUv + vec2(0.0, o.y)).a + texture2D(uTex, vUv - vec2(0.0, o.y)).a
           + texture2D(uTex, vUv + o*0.7).a + texture2D(uTex, vUv - o*0.7).a
           + texture2D(uTex, vUv + vec2(o.x, -o.y)*0.7).a + texture2D(uTex, vUv + vec2(-o.x, o.y)*0.7).a;
  ha /= 8.0;
  vec3 hc = uKind < 0.5 ? vec3(1.0, 0.5, 0.4) : (uKind < 1.5 ? vec3(0.6, 0.85, 1.0) : vec3(1.0, 0.9, 0.7));
  float hA = (1.0 - al)*ha*0.16;
  float A = al + hA;
  vec3 C = (col*al + hc*hA)/max(A, 1e-4);
  A *= uOp;
  if (A < 0.003) discard;
  gl_FragColor = vec4(C, A);
}`;
function makeRefs(g, plx, SZ){
  const RSZ = SZ*1.2, TL = new THREE.TextureLoader();
  return ["mus", "org", "bone"].map((kind, ki) => {
    const mat = new THREE.ShaderMaterial({
      uniforms:{ uTex:{value:null}, uDat:{value:null}, uSoft:{value:null}, uOp:{value:0}, uT:U.time, uKind:{value:ki}, uLens:{value:.075},
        uId0:{value:0}, uH0:{value:0}, uFx0:{value:0}, uP0:{value:new THREE.Vector3(.5, .5, .1)},
        uId1:{value:0}, uH1:{value:0}, uFx1:{value:0}, uP1:{value:new THREE.Vector3(.5, .5, .1)},
        uCur:{value:new THREE.Vector2(-1, -1)}, uTx:{value:new THREE.Vector2(1/1024, 1/1024)} },
      vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
      fragmentShader:REF_FRAG, transparent:true, depthWrite:false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(RSZ, RSZ), mat);
    pl.position.set(plx, 0, .02*(ki + 2)); pl.renderOrder = ki + 2; pl.userData.self = true; pl.visible = false; g.add(pl);
    const byId = {}; REGIONS[kind].forEach(m => byId[m.id] = m);
    const R = { kind, pl, mat, byId, ids:null, W:0, ready:false, fail:false, n:0,
      s0:{key:-1, id:0, h:0, fx:0}, s1:{key:-1, id:0, h:0, fx:0}, cur:new THREE.Vector2(.5, .5), curT:new THREE.Vector2(.5, .5) };
    const done = () => { if (++R.n === 4) R.ready = true; };
    const fail = () => { R.fail = true; };
    TL.load(REFIMG[kind], t => { t.minFilter = THREE.LinearMipmapLinearFilter; mat.uniforms.uTex.value = t; done(); }, undefined, fail);
    TL.load(REFIMG[kind + "_s"], t => { t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; mat.uniforms.uSoft.value = t; done(); }, undefined, fail);
    TL.load(REFIMG[kind + "_d"], t => { t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; mat.uniforms.uDat.value = t; done(); }, undefined, fail);
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
        const x = c.getContext("2d"); x.drawImage(im, 0, 0);
        const d = x.getImageData(0, 0, im.width, im.height).data;
        R.W = im.width; R.ids = new Uint8Array(im.width*im.height);
        for (let i = 0; i < R.ids.length; i++) R.ids[i] = Math.round(d[i*4]/10);
        done();
      } catch(e){ fail(); }
    };
    im.onerror = fail; im.src = REFIMG[kind + "_d"];
    return R;
  });
}
// наведение: какая часть под курсором; два слота — уходящая и новая подсветка
const SPINE_UV = [0.513, 0.625];
function refsTick(refs, dt, rc, act, probe, dive){
  let out = null;
  dive = dive || 0;
  refs.forEach((R, ki) => {
    let key = -1, id = 0, part = null;
    const diving = ki === 2 && dive > .003 && R.ready;
    if (diving){
      // погружение в позвонок: «линза» сама раскрывается на поясничном позвонке и растёт
      if (!R.spine) R.spine = REGIONS.bone.find(m => m.key === "spine");
      id = R.spine.id; key = -99; part = [SPINE_UV[0], SPINE_UV[1], .05];
      R.curT.set(SPINE_UV[0], 1 - SPINE_UV[1]); R.cur.copy(R.curT);
    }
    else if (ki === act && probe && R.ready && R.pl.visible){
      const hit = rc.intersectObject(R.pl, false)[0];
      if (hit && hit.uv){
        const x = Math.floor(hit.uv.x*R.W), y = Math.floor((1 - hit.uv.y)*R.W);
        if (x >= 0 && y >= 0 && x < R.W && y < R.W) id = R.ids[y*R.W + x];
        R.curT.set(hit.uv.x, hit.uv.y);
        const m = id ? R.byId[id] : null;
        if (m){
          let bi = 0, bd = 9;
          m.parts.forEach((p, k) => { const d = Math.hypot(p[0] - hit.uv.x, p[1] - (1 - hit.uv.y)); if (d < bd){ bd = d; bi = k; } });
          part = m.parts[bi]; key = id*16 + bi;
        } else id = 0;
      }
    }
    if (key !== R.s1.key){
      if (R.s1.h >= R.s0.h) R.s0 = R.s1;
      R.s1 = { key, id, h:0, fx: id ? R.byId[id].fx : 0, part };
      if (R.s1.id && R.s0.h < .01) R.cur.copy(R.curT);
    }
    if (diving) R.s1.h = Math.min(1, dive*1.4);
    else R.s1.h += ((R.s1.id ? 1 : 0) - R.s1.h)*Math.min(1, dt*2.6);
    if (ki === 2) R.mat.uniforms.uLens.value = .075 + .2*dive*dive;
    R.s0.h += (0 - R.s0.h)*Math.min(1, dt*2.2);
    if (R.s0.h < .002) R.s0 = { key:-1, id:0, h:0, fx:0 };
    if (!diving) R.cur.lerp(R.curT, Math.min(1, dt*9));
    const u = R.mat.uniforms;
    [[R.s0, u.uId0, u.uH0, u.uFx0, u.uP0], [R.s1, u.uId1, u.uH1, u.uFx1, u.uP1]].forEach(([s, I, Hh, F, P]) => {
      I.value = s.id; Hh.value = s.h; F.value = s.fx || 0;
      if (s.part) P.value.set(s.part[0], 1 - s.part[1], s.part[2]);
    });
    u.uCur.value.copy(R.cur);
    if (ki === act && R.s1.id && !diving) out = { kind:R.kind, m:R.byId[R.s1.id], h:R.s1.h };
  });
  return out;
}

// уровень «Тело»: фотография медитирующего, энергия уплотнилась в материю
function makeBody(g, plx, SZ){
  const mat = new THREE.ShaderMaterial({
    uniforms:{ uTex:{value:null}, uOp:{value:0}, uRev:{value:1}, uT:U.time, uTx:{value:new THREE.Vector2(1/1024, 1/1024)} },
    vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader:`uniform sampler2D uTex; uniform float uOp; uniform float uRev; uniform float uT; uniform vec2 uTx; varying vec2 vUv;
      void main(){
        vec4 b = texture2D(uTex, vUv);
        vec3 col = b.rgb*0.8;
        col = col*1.2/(1.0 + 0.35*col);
        float sweep = pow(0.5 + 0.5*sin(vUv.y*34.0 - uT*0.9), 8.0);
        col += vec3(1.0, 0.86, 0.62)*sweep*0.05;
        vec2 o = uTx*10.0;
        float ha = (texture2D(uTex, vUv + vec2(o.x, 0.0)).a + texture2D(uTex, vUv - vec2(o.x, 0.0)).a
                  + texture2D(uTex, vUv + vec2(0.0, o.y)).a + texture2D(uTex, vUv - vec2(0.0, o.y)).a
                  + texture2D(uTex, vUv + o*0.7).a + texture2D(uTex, vUv - o*0.7).a
                  + texture2D(uTex, vUv + vec2(o.x, -o.y)*0.7).a + texture2D(uTex, vUv + vec2(-o.x, o.y)*0.7).a)/8.0;
        // проявление из света: зёрна материи появляются одно за другим (и распадаются обратно)
        vec2 q = vUv*46.0; vec2 qi = floor(q), qf = fract(q); qf = qf*qf*(3.0 - 2.0*qf);
        float h00 = fract(sin(dot(qi, vec2(12.9898, 78.233)))*43758.5453), h10 = fract(sin(dot(qi + vec2(1.0, 0.0), vec2(12.9898, 78.233)))*43758.5453);
        float h01 = fract(sin(dot(qi + vec2(0.0, 1.0), vec2(12.9898, 78.233)))*43758.5453), h11 = fract(sin(dot(qi + vec2(1.0, 1.0), vec2(12.9898, 78.233)))*43758.5453);
        float vn = mix(mix(h00, h10, qf.x), mix(h01, h11, qf.x), qf.y);
        float gr = fract(sin(dot(floor(vUv*700.0), vec2(39.3468, 11.1353)))*24634.6345);
        float n = mix(vn*0.7 + gr*0.3, 1.0 - vUv.y, 0.22);
        float x = uRev*1.2 - 0.1 - n;
        float rv = smoothstep(-0.06, 0.06, x);
        float eg = exp(-x*x*260.0);
        col += vec3(1.0, 0.9, 0.72)*((1.0 - uRev)*0.35 + eg*0.8);
        float al = b.a*max(rv, eg*0.7);
        float hA = (1.0 - al)*ha*(0.2 + 0.05*sin(uT*0.5))*uRev;
        float A = al + hA;
        vec3 C = (col*al + vec3(1.0, 0.8, 0.58)*hA)/max(A, 1e-4);
        A *= uOp;
        if (A < 0.003) discard;
        gl_FragColor = vec4(C, A);
      }`,
    transparent:true, depthWrite:false });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(SZ*1.2, SZ*1.2), mat);
  pl.position.set(plx, 0, .03); pl.renderOrder = 1.5; pl.userData.self = true; pl.visible = false; g.add(pl);
  const B = { pl, mat, ready:false };
  new THREE.TextureLoader().load(REFIMG.body, tx => { tx.minFilter = THREE.LinearMipmapLinearFilter; mat.uniforms.uTex.value = tx; B.ready = true; });
  return B;
}
