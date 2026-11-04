/* ---------- постобработка ---------- */
let composer = null, bloom = null, glowPeak = 0;
const bloomHook = v => { glowPeak = v; };
if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass){
  try {
    composer = new THREE.EffectComposer(renderer);
    composer.setPixelRatio(PR);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const mpass = new THREE.RenderPass(mscene, mcam); mpass.clear = false; mpass.clearDepth = true; composer.addPass(mpass);
    const tp = new THREE.RenderPass(tscene, tcam); tp.clear = false; tp.clearDepth = true; composer.addPass(tp);
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), mobile ? .65 : .8, .55, .3);
    composer.addPass(bloom);
  } catch(e){ composer = null; bloom = null; }
}
if (!composer) renderer.autoClear = false;

/* ---------- сборка станций ---------- */
progress(.05); await frame();
try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]); } catch(e){}
const stations = [];
for (let i = 0; i < N; i++){
  const th = i/N*TAU;
  const g = new THREE.Group();
  g.position.set(Math.sin(th)*R, 3.4, -Math.cos(th)*R);
  g.lookAt(0, 3.4, 0);
  scene.add(g);
  const inner = new THREE.Group(); g.add(inner);
  const upd = BUILD[i](inner);
  const num = label(ST[i].n, "400 72px Forum, Georgia, serif", "#D6AC5E", 1.9); num.position.set(0, -5.4, 0); g.add(num);
  const nm = label(ST[i].short.toUpperCase(), "500 30px 'JetBrains Mono', monospace", "#A9A7BD", .72); nm.position.set(0, -6.7, 0); g.add(nm);
  const mats = [], pts_ = [];
  g.traverse(o => { if (o.material && o !== nm && o !== num && !o.userData.self) mats.push([o.material, o.material.opacity ?? 1]); if (o.isPoints){ pts_.push(o); o.material.uniforms.uPush.value = PUSH[i]; o.material.uniforms.uRad.value = RAD[i]; } });
  stations.push({g, inner, upd, mats, pts:pts_, vis:1, nm, num, api:upd.api, hov:0, hit:new THREE.Vector3(), H:{h:0, x:0, y:0}, dv:0, fit:1});
  progress(.1 + .8*(i+1)/N);
  await frame();
}
try { renderer.compile(scene, camera); renderer.compile(tscene, tcam); renderer.compile(mscene, mcam); } catch(e){}
progress(1);

