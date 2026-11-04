/* ---------- панорамы-картины Люсии: изображение + карта глубины (Depth Anything V2) ----------
   wl — линия воды (доля высоты сверху; null — суша); fx — эффекты поверх; slots — существа в координатах картинки:
   [код, u (0…1 слева), v (0…1 сверху: для наземных — ступни, для водных и летающих — центр), размер (доля высоты картинки), направление, сплющивание по высоте (необяз.: лежащие на дне — дикинсония)]. */
const BIO_PIMG = {
  hadean:{ wl:null, fx:["ember", "haze"], slots:[] },
  archean:{ wl:.36, fx:["plankton", "vent", "rays"], vent:[.79, .7], slots:[] },
  goe:{ wl:.32, fx:["bubbles", "rust", "rays"], slots:[] },
  boring:{ wl:.55, fx:["plankton", "rays"], slots:[] },
  snowball:{ wl:null, fx:["snow", "frost"], slots:[] },
  ediacaran:{ wl:.33, fx:["plankton", "rays"], scale:"Дно уходит к горизонту ≈ .55: размер ≈ длина·(v−.55)/.6; мелкая сприггина — у самого зрителя.",
    slots:[["kimb", .12, .86, .08, 1], ["charn", .28, .70, .17, 1], ["sprig", .40, .91, .055, 1], ["dick", .55, .66, .2, -1, .38], ["kimb", .66, .90, .09, -1], ["charn", .82, .66, .14, -1]] },
  cambrian:{ wl:.15, fx:["plankton", "rays"], scale:"v141, рисунки: масштаб по рябью песка и губкам у зрителя (≈ .6 высоты на метр у нижнего края). Мелочь в 2–5 см — в истинном размере; аномалокарис в открытой воде.",
    slots:[["haik", .14, .50, .03, 1], ["anom", .30, .38, .19, 1], ["trilo", .38, .82, .04, 1], ["pika", .45, .55, .05, 1], ["marr", .55, .91, .02, -1],
    ["wiwa", .60, .93, .03, -1], ["opab", .62, .60, .06, -1], ["hall", .78, .90, .02, -1], ["trilo", .90, .92, .06, -1]] },
  ordovician:{ wl:.24, fx:["plankton", "rays"], scale:"Белый песок уходит к ≈ .65, камера ≈ 1 м над дном: размер ≈ длина·(v−.65)/.8; пловцы — близко к зрителю.",
    slots:[["ortho", .18, .45, .12, 1], ["isot", .40, .88, .19, 1], ["sacab", .55, .50, .1, -1], ["trilo", .64, .92, .055, -1], ["trilo", .74, .89, .05, 1],
    ["astra", .82, .40, .065, -1], ["isot", .92, .79, .12, -1]] },
  silurian:{ wl:.64, fx:["plankton", "mist"], scale:"Под водой дно уходит к ≈ .7: размер ≈ длина·(v−.7)/.56 (по морским лилиям справа); птериготус — в открытой воде слева.",
    slots:[["ptery", .26, .78, .26, 1], ["euryp", .40, .91, .085, 1], ["guiyu", .52, .80, .07, 1], ["euryp", .66, .88, .065, -1], ["guiyu", .88, .74, .055, -1]] },
  devonian:{ wl:.62, fx:["plankton", "mist", "motes"], scale:"Берег у воды: ≈ .08 высоты на метр (по брёвнам); акантостега — в воде у поверхности (она водная); дунклеостей — в глубине.",
    slots:[["ichth", .28, .555, .12, 1], ["acan", .44, .655, .065, 1], ["tikt", .82, .565, .17, -1],
    ["clado", .18, .78, .20, 1], ["eusth", .38, .88, .19, 1], ["dunk", .64, .77, .36, -1], ["acan", .92, .70, .06, -1]] },
  carboniferous:{ wl:.67, fx:["spores", "mist", "plankton"], scale:"Ствол лепидодендрона у воды ≈ 1 м = .12 высоты; артроплевра чуть глубже в лесу; гилономус (20 см) — на берегу слева, в истинном размере (v141).",
    slots:[["hylo", .16, .595, .025, 1], ["megan", .30, .30, .1, 1], ["arthr", .50, .58, .18, 1], ["pulmo", .80, .615, .08, -1], ["megan", .88, .20, .08, -1],
    ["aqtet", .27, .85, .30, 1], ["steth", .62, .80, .14, -1]] },
  permian:{ wl:.5, fx:["dust", "haze"], scale:"Равнина уходит к ≈ .27, по араукариям ≈ 4 м на долю: размер ≈ длина·(v−.27)/4; геликоприон — в глубине оазиса.",
    slots:[["scut", .10, .42, .095, 1], ["dimet", .24, .44, .15, 1], ["estem", .40, .43, .12, -1], ["inos", .66, .355, .075, 1], ["edaph", .86, .46, .14, -1],
    ["meso", .25, .80, .13, 1], ["helic", .64, .68, .40, -1], ["meso", .88, .88, .15, -1]] },
  triassic:{ wl:.6, fx:["motes", "plankton", "rays"], scale:"Горизонт ≈ .41, камера ≈ 2.5 м: размер ≈ длина·(v−.41)/2.5; мелкие — в истинном размере (v137): тринаксодон 0,45 м, эораптор 1 м; морганукодона (10 см) на панораме нет — не виден; шонизавр — далеко в глубине.",
    slots:[["eudim", .15, .22, .08, 1], ["posto", .27, .515, .19, 1], ["coelo", .45, .52, .13, -1], ["lystr", .56, .52, .066, 1],
    ["herre", .72, .47, .11, -1], ["eorap", .82, .50, .04, -1], ["thrin", .92, .52, .02, -1],
    ["notho", .29, .80, .30, 1], ["shoni", .70, .70, .36, -1]] },   // под водой масштаб — по камням и кораллам у самого зрителя: прежние .2/.3 смотрелись игрушечными
  // ---- v137: масштаб по перспективе. Мел: горизонт ≈ .275, камера ≈ 3,8 м (по пальмам, магнолиям и папоротникам);
  //      метр на земле ≈ (v − .275)/3,8 высоты кадра; размер = длинная сторона рисунка × это число
  //      v138: 7-й элемент слота — доля дымки дали, hc — её цвет. v139: аргентинозавр — на ближнем берегу протоки (за ней, у горизонта, он читался великаном: дальние деревья там крошечные)
  cretaceous:{ ar:2752/1536, wl:.605, hc:[.66, .71, .74], fx:["motes", "plankton", "rays"], scale:"Горизонт ≈ .275, камера ≈ 3,8 м: метр ≈ (v−.275)/3,8. Аргентинозавр 32 м — на равнине перед протокой, чуть дальше трицератопса; мелкие (синозавроптерикс, репеномам, микрораптор на коряге) — в истинном размере.",
    slots:[["argen", .52, .335, .28, 1, null, .08], ["iguan", .12, .36, .22, 1, null, .08], ["spino", .92, .35, .28, -1, null, .1], ["ankyl", .27, .375, .17, 1, null, .05], ["trice", .63, .37, .21, -1, null, .06],
    ["trex", .80, .36, .25, -1, null, .08], ["quetz", .38, .40, .20, 1], ["veloc", .68, .46, .10, -1], ["sinos", .56, .50, .06, 1], ["repen", .36, .52, .06, 1],
    ["micro", .06, .455, .04, 1], ["ptera", .64, .12, .13, -1], ["mosa", .55, .78, .48, -1]] },
  now:{ ar:2752/1536, wl:.58, fx:["plankton", "rays", "motes"], scale:"Под водой масштаб — по морской траве (≈ 1 м) и горгонарии у зрителя; синий кит 25 м — в глубине. Пчелы на панораме нет: в истинном размере у деревьев её не видно.",
    slots:[["bwhale", .72, .665, .55, -1], ["coela", .30, .78, .26, -1], ["nauti", .60, .74, .06, -1], ["limul", .48, .86, .12, 1], ["octo", .86, .85, .22, 1]] },
  // ---- v142: панорамы кайнозоя (Nano Banana, 16:9). Масштаб — по соседним предметам: метр ≈ (v − горизонт)/высота камеры
  paleogene:{ ar:2752/1536, wl:.655, hc:[.74, .77, .79], fx:["motes", "mist", "plankton"], scale:"Горизонт суши ≈ .44, камера ≈ 2,2 м (по деревьям у кромки леса). Индрикотерий — у леса, амбулоцет и пакицет — на пляже, базилозавр — в открытой воде; пургаториус (15 см) не виден в истинном размере. v155: гасторнис — по росту 2 м (длинная сторона рисунка ≈ 2,8 м), титанобоа в кольцах ≈ 5 м поперёк (толщина тела ≈ 0,5 м).",
    slots:[["parac", .56, .48, .136, -1, null, .1], ["gasto", .70, .52, .10, -1, null, .05], ["hyrac", .44, .55, .03, 1], ["titan", .22, .565, .27, 1], ["pakic", .82, .57, .07, -1], ["ambul", .60, .58, .19, -1], ["basil", .55, .80, .6, -1]] },
  neogene:{ ar:2752/1536, wl:.59, hc:[.76, .72, .66], fx:["dust", "plankton", "rays"], scale:"Горизонт ≈ .38, камера ≈ 4 м (по акациям ≈ 10 м). Динотерий и австралопитеки — на берегу, мегалодон — в открытой воде.",
    slots:[["deino", .72, .50, .16, -1], ["austr", .55, .52, .04, 1], ["sahel", .50, .515, .04, 1], ["megal", .70, .76, .55, -1]] },
  pleistocene:{ ar:2752/1536, wl:null, hc:[.72, .76, .79], fx:["snow", "haze"], scale:"Горизонт ≈ .39, камера ≈ 4,5 м (по елям и пучкам травы у зрителя).",
    slots:[["diprot", .12, .60, .15, 1], ["glypt", .24, .66, .156, 1], ["megat", .36, .62, .24, 1], ["megac", .50, .575, .15, 1], ["mammo", .62, .62, .245, -1],
    ["rhino", .80, .66, .216, -1], ["smilo", .72, .76, .156, -1], ["neand", .52, .78, .143, 1], ["erect", .90, .74, .13, -1]] },
  holocene:{ ar:2752/1536, wl:null, hc:[.84, .74, .63], fx:["motes", "haze"], scale:"Горизонт ≈ .33, камера ≈ 8 м — вид с холма (по каменным оградам ≈ 0,8 м и домам). Пшеница — сами поля на картинке.",
    slots:[["dodo", .30, .80, .06, 1], ["thyla", .40, .86, .12, 1], ["sapie", .55, .74, .087, -1], ["dog", .61, .76, .054, -1], ["cow", .76, .70, .116, -1]] },
  // ---- атлас биомов (16:9, картинки Люсии v114): та же раскладка «ступни на земле / пловцы — центр» ----
  bm_rain:{ ar:2752/1536, wl:null, fx:["motes", "mist", "rays"], slots:[["jagua", .62, .86, .22, -1], ["howl", .16, .70, .12, 1], ["sloth", .70, .33, .08, -1], ["touca", .40, .30, .06, 1]] },
  bm_sav:{ ar:2752/1536, wl:null, fx:["dust", "haze"], slots:[["eleph", .22, .50, .34, 1], ["giraf", .74, .52, .36, -1], ["zebra", .54, .55, .2, -1], ["lion", .40, .62, .3, 1]] },
  bm_taiga:{ ar:2752/1536, wl:null, fx:["snow", "mist"], slots:[["moose", .30, .74, .22, 1], ["bear", .66, .80, .24, -1], ["lynx", .50, .88, .16, 1], ["capce", .86, .72, .07, -1]] },
  bm_tundra:{ ar:2752/1536, wl:null, fx:["haze"], slots:[["reind", .30, .52, .22, 1], ["afox", .62, .70, .18, -1], ["sowl", .78, .22, .08, -1], ["lemm", .12, .92, .06, 1]] },
  // Сахара (картинка Люсии, 15.10.2026): горизонт у подножия дюн ≈ 0,48, камера ≈ 1,6 м — размер ≈ длина × (v − 0,48)/1,6;
  // скорпион немного увеличен, иначе его не видно. Правая половина переднего плана — свободная равнина
  bm_desert:{ ar:2752/1536, wl:null, fx:["dust", "haze"], slots:[["camel", .60, .60, .23, -1], ["fenec", .43, .80, .12, 1], ["jerbo", .52, .89, .07, 1], ["scorp", .66, .93, .05, -1]] },
  bm_reef:{ ar:2752/1536, wl:.2, fx:["plankton", "rays"], slots:[["turtl", .32, .44, .2, 1], ["manta", .62, .32, .3, -1], ["clown", .82, .60, .05, -1], ["parro", .45, .62, .1, 1], ["octo", .58, .86, .12, -1]] },
  bm_ocean:{ ar:2752/1536, wl:.31, fx:["plankton", "rays"], slots:[["albat", .70, .18, .12, -1], ["bwhale", .42, .72, .55, 1], ["tuna", .74, .47, .12, -1], ["bshark", .16, .52, .17, 1], ["jelly", .88, .64, .07, -1]] },
  bm_deep:{ ar:2752/1536, wl:.005, fx:["plankton"], slots:[["riftia", .30, .86, .12, 1], ["angle", .62, .45, .08, -1], ["gsquid", .78, .34, .3, -1], ["dumbo", .45, .30, .07, 1], ["coela", .20, .55, .14, 1], ["nauti", .88, .62, .05, -1]] },
  jurassic:{ wl:.625, fx:["motes", "plankton", "rays"], scale:"Крупные динозавры — в одном масштабе (как будто на одном расстоянии); юрамайю (10 см) и анхиорниса (40 см) в истинном размере не видно — они только в карточках (v137).",
    slots:[["brach", .14, .53, .30, 1], ["diplo", .31, .525, .34, 1], ["stego", .45, .548, .14, -1], ["allo", .76, .53, .118, -1],
    ["rhamp", .47, .18, .09, 1], ["archx", .74, .3, .055, -1],
    ["ichsa", .18, .74, .20, 1], ["plesi", .48, .82, .27, 1], ["liopl", .78, .77, .42, -1]] }
};
const PIMG = (() => {
  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`;
  const FI = `uniform sampler2D uTex, uDep; uniform vec2 uPar; uniform vec4 uR; uniform float uA, uT, uWl, uK, uAR; varying vec2 vUv;
void main(){ vec2 q = (vUv - uR.xy)/uR.zw, qc = clamp(q, 0.0, 1.0); float outY = abs(q.y - qc.y)*uR.w/uR.z*uAR, outX = abs(q.x - qc.x)*uAR, out_ = max(outY, outX);
  float d = texture2D(uDep, qc).r; vec2 uv = qc - uPar*(d - 0.3)*uK;
  if (outX > 0.3){ gl_FragColor = vec4(0.02, 0.024, 0.047, uA); return; }
  if (outY > 0.002 && outX < 0.002){ uv = vec2(qc.x, clamp(qc.y, 0.004, 0.996)); vec3 e = vec3(0.0); for (int i = -4; i <= 4; i++) e += texture2D(uTex, vec2(uv.x + float(i)*0.03, uv.y + (uv.y > 0.5 ? -0.03 : 0.03))).rgb; e /= 9.0;
    gl_FragColor = vec4(mix(e*0.8, vec3(0.02, 0.024, 0.047), smoothstep(0.0, 0.055, out_)), uA); return; }
  if (uWl > 0.0 && uv.y < 1.0 - uWl){ float w = (1.0 - uWl - uv.y); uv.x += sin(uv.y*140.0 + uT*1.3)*0.00045*smoothstep(0.0, 0.05, w); uv.y += sin(uv.x*90.0 + uT*0.9)*0.0003*smoothstep(0.0, 0.05, w); }
  // v145 «живая панорама»: облака (самое дальнее — небо) чуть плывут; у кромки воды — рябь; ближняя зелень колышется
  float sky = smoothstep(0.03, 0.006, d)*step(0.45, uv.y);
  uv.x += sky*sin(uT*0.045 + uv.y*4.0)*0.0035;
  float surf = uWl > 0.0 ? smoothstep(0.0, 0.012, uv.y - (1.0 - uWl))*smoothstep(0.1, 0.0, uv.y - (1.0 - uWl)) : 0.0;
  uv.x += surf*sin(uv.y*420.0 - uT*1.6)*0.0007; uv.y += surf*sin(uv.x*160.0 + uT*1.1)*0.0004;
  vec3 c0 = texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb;
  float veg = smoothstep(0.02, 0.09, c0.g - max(c0.r*0.92, c0.b))*smoothstep(0.12, 0.45, d)*(1.0 - sky)*(uWl > 0.0 ? step(1.0 - uWl, uv.y) : 1.0);
  uv.x += veg*(sin(uT*1.15 + uv.x*23.0 + uv.y*11.0) + 0.5*sin(uT*2.3 + uv.y*57.0))*0.0009*d;
  vec3 c = texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb; c *= 0.97 + 0.03*sin(uT*0.35);
  c += surf*vec3(1.0, 0.97, 0.9)*pow(max(0.0, sin(uv.x*900.0 + uT*2.1)*sin(uv.y*700.0 - uT*1.4)), 12.0)*0.35*smoothstep(0.35, 0.8, dot(c, vec3(0.33)));   // блики на воде
  if (uWl > 0.0 && uv.y < 1.0 - uWl){ vec2 p = uv*vec2(26.0, 18.0); float k = abs(sin(p.x + sin(p.y*1.3 + uT*0.7)*1.6 + uT*0.4))*abs(sin(p.y*0.9 + sin(p.x*1.1 - uT*0.5)*1.4));
    c += vec3(0.75, 1.0, 0.95)*pow(1.0 - k, 6.0)*0.07*smoothstep(0.55, 0.0, (1.0 - uWl) - uv.y); }                                                       // каустика у поверхности
  // v171: боковые края — плавное размытие (диск из 16 выборок, радиус растёт к краю) и уход в темноту, без полос растяжения
  float ex = min(q.x, 1.0 - q.x)*uAR, bl = smoothstep(0.12, -0.04, ex);
  if (bl > 0.001){ float rad = 0.006 + 0.06*bl, rx = rad/uAR; vec2 bc = vec2(clamp(uv.x, rx + 0.002, 0.998 - rx), clamp(uv.y, 0.002, 0.998)); vec3 acc = vec3(0.0);
    for (int i = 0; i < 16; i++){ float fi = float(i), an = fi*2.39996 + uT*0.0, rr = sqrt((fi + 0.5)/16.0); acc += texture2D(uTex, clamp(bc + vec2(cos(an)*rx, sin(an)*rad)*rr, 0.001, 0.999)).rgb; }
    c = mix(c, acc/16.0, smoothstep(0.0, 0.55, bl)); c *= 1.0 - 0.22*smoothstep(0.07, -0.02, ex); }
  c = mix(c, vec3(0.02, 0.024, 0.047), smoothstep(0.0, 0.2, outX) + (1.0 - smoothstep(0.0, 0.2, outX))*smoothstep(0.0, 0.16, outY));
  gl_FragColor = vec4(c, uA); }`;
  const VP = `attribute float aS, aPh; uniform float uT, uPR, uK, uY0, uY1; varying float vA;
void main(){ vec3 p = position; float h = uY1 - uY0, t = 0.0;
  if (uK < 0.5){ p.x += sin(uT*0.21 + aPh*6.0)*0.5; p.y += sin(uT*0.29 + aPh*9.0)*0.3; }                         // пылинки, споры
  else if (uK < 1.5){ t = fract(aPh + uT*(0.05 + aS*0.05)); p.y = uY0 + t*h; p.x += sin(uT*1.7 + aPh*20.0)*0.05; }   // пузырьки вверх
  else if (uK < 2.5){ t = fract(aPh - uT*(0.03 + aS*0.03)); p.y = uY0 + t*h; p.x += sin(uT*0.5 + aPh*12.0)*0.35; }   // снег, ржавчина, «морской снег» вниз
  else { t = fract(aPh + uT*(0.03 + aS*0.04)); p.y = uY0 + t*h; p.x += sin(uT*0.8 + aPh*14.0)*0.25; }                // искры вверх
  vec4 mv = modelViewMatrix*vec4(p, 1.0); gl_PointSize = (1.4 + 2.4*aS)*uPR*(18.0/max(-mv.z, 1.0)); gl_Position = projectionMatrix*mv;
  vA = (uK > 2.5 ? (1.0 - t) : uK > 0.5 && uK < 2.5 ? smoothstep(0.0, 0.1, t)*smoothstep(1.0, 0.85, t) : 1.0)*(0.35 + 0.65*pow(0.5 + 0.5*sin(uT*(0.7 + aS) + aPh*30.0), 2.0)); }`;
  const FP = `uniform vec3 uC; uniform float uA; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d); if (r > 0.25) discard; gl_FragColor = vec4(uC, vA*uA*smoothstep(0.25, 0.0, r)); }`;
  const FM = `uniform float uA, uT, uK; uniform vec3 uC; varying vec2 vUv;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a*vn(p); p = p*2.03 + 17.1; a *= 0.5; } return s; }
void main(){ float n = fbm(vec2(vUv.x*5.0 + uT*0.02*(1.0 + uK), vUv.y*3.0 + uK*5.0)); float b = smoothstep(0.0, 0.5, vUv.y)*smoothstep(1.0, 0.55, vUv.y);
  gl_FragColor = vec4(uC, smoothstep(0.42, 0.85, n)*b*0.4*uA); }`;
  const FR = `uniform float uA, uT; uniform vec3 uC; varying vec2 vUv;
void main(){ float x = vUv.x*7.0 - vUv.y*1.8; float s = pow(max(0.0, sin(x + sin(uT*0.11)*0.7)), 22.0) + 0.6*pow(max(0.0, sin(x*0.53 + 1.9 + sin(uT*0.07))), 26.0);
  gl_FragColor = vec4(uC, s*smoothstep(0.0, 0.45, vUv.y)*0.18*uA); }`;
  const FX = { ember:["E", [1, .55, .22]], dust:["D", [1, .85, .6]], motes:["D", [1, .95, .7]], spores:["D", [1, .9, .45]], snow:["S", [.95, .97, 1]], bubbles:["B", [.85, .97, 1]],
    plankton:["P", [.8, .95, .85]], rust:["R", [1, .55, .25]], vent:["V", [.9, .95, .9]], haze:["M", [.6, .35, .25]], mist:["M", [.75, .85, .75]], frost:["M", [.9, .95, 1]], rays:["Y", [.85, 1, .9]] };
  function build(id, base){
    const C = BIO_PIMG[id]; if (!C) return null;
    const grp = new THREE.Group(), disp = [], U = { uT:{ value:0 }, uA:{ value:0 }, uPR:{ value:Math.min(2, devicePixelRatio || 1) } };
    const st = { ok:false, dep:null, dw:0, dh:0, rect:null, par:new THREE.Vector2() };
    const mk = (vs, fs, uni, o) => { const m = new THREE.ShaderMaterial(Object.assign({ vertexShader: vs, fragmentShader: fs, uniforms: Object.assign({}, U, uni), transparent: true, depthWrite: false, depthTest: false }, o || {})); disp.push(m); return m; };
    const ld = new THREE.TextureLoader(), tI = ld.load(base + id + ".webp", () => { st.ok = true; amb(); }), tD = ld.load(base + id + "_d.webp");
    // v145: уменьшенная копия картинки 64 px — средний цвет вокруг существа (подстройка его света под окружение)
    function amb(){ try { const im = tI.image, w = 64, h = Math.max(8, Math.round(64*im.height/im.width)), c = document.createElement("canvas"); c.width = w; c.height = h;
      const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h); st.col = x.getImageData(0, 0, w, h).data; st.cw = w; st.ch = h; } catch (e){} }
    [tI, tD].forEach(t => { t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; disp.push(t); });
    const di = new Image(); di.onload = () => { const c = document.createElement("canvas"); c.width = di.naturalWidth; c.height = di.naturalHeight; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(di, 0, 0); st.dep = x.getImageData(0, 0, c.width, c.height).data; st.dw = c.width; st.dh = c.height; }; di.src = base + id + "_d.webp";
    const IU = { uTex:{ value:tI }, uDep:{ value:tD }, uPar:{ value:st.par }, uWl:{ value:C.wl || 0 }, uK:{ value:.022 }, uAR:{ value:C.ar || 3168/1344 }, uR:{ value:new THREE.Vector4(0, 0, 1, 1) } };
    const img = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mk(VS, FI, IU)); img.renderOrder = -20; grp.add(img); disp.push(img.geometry);
    const R = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; })(id.length*97);
    const fx = [];
    for (const f of C.fx){ const [k, col] = FX[f] || []; if (!k) continue;
      if (k === "M" || k === "Y"){ const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mk(VS, k === "M" ? FM : FR, { uC:{ value:new THREE.Vector3(...col) }, uK:{ value:fx.length } }, k === "Y" ? { blending: THREE.AdditiveBlending } : {})); m.renderOrder = k === "Y" ? -15 : 5; grp.add(m); disp.push(m.geometry); fx.push({ k, f, o:m }); continue; }
      const n = { E:260, D:180, S:420, B:260, P:220, R:300, V:160 }[k], P = new Float32Array(n*3), aS = new Float32Array(n), aPh = new Float32Array(n);
      for (let i = 0; i < n; i++){ aS[i] = R(); aPh[i] = R(); P[i*3] = R(); P[i*3 + 1] = R(); P[i*3 + 2] = R(); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P.slice(), 3)); g.setAttribute("aS", new THREE.BufferAttribute(aS, 1)); g.setAttribute("aPh", new THREE.BufferAttribute(aPh, 1)); disp.push(g);
      const kind = { D:0, P:0, B:1, V:1, S:2, R:2, E:3 }[k], o = new THREE.Points(g, mk(VP, FP, { uC:{ value:new THREE.Vector3(...col) }, uK:{ value:kind }, uY0:{ value:0 }, uY1:{ value:1 } }, { blending: THREE.AdditiveBlending }));
      o.frustumCulled = false; o.renderOrder = 6; grp.add(o); fx.push({ k, f, o, P }); }
    // глубина в точке картинки (u, v сверху) → 0…1, ближе = больше
    const depthAt = (u, v) => { if (!st.dep) return .5; const x = Math.min(st.dw - 1, Math.max(0, u*st.dw | 0)), y = Math.min(st.dh - 1, Math.max(0, v*st.dh | 0)); return st.dep[(y*st.dw + x)*4]/255; };
    // раскладка: картинка «вписывается с обрезкой» в область сцены (на телефоне — над карточкой), с запасом под параллакс
    // раскладка: плоскость закрывает весь экран; картинка — прямоугольник внутри неё. ПК: ширина ≈ ширина экрана, при открытом тексте
    // правый край прижат к краю экрана (левая часть уходит под текст), при свёрнутом — по центру; сверху и снизу — мягкое продолжение в темноту.
    // Телефон: картинка во всю высоту области сцены, палец водит её вбок. fold: 0 — текст открыт, 1 — свёрнут; left — правый край текста (доля ширины).
    function layout(cam, port, Z, pan, fold, left, tilt){
      const un = (x, y) => new THREE.Vector3(x, y, .5).unproject(cam).sub(cam.position).normalize();
      const at = (x, y) => { const d = un(x, y), t = (Z - cam.position.z)/d.z; return cam.position.clone().addScaledVector(d, t); };
      const a = at(-1, -1), b = at(1, 1), rw = b.x - a.x, rh = b.y - a.y, A = C.ar || 3168/1344;
      img.scale.set(rw*1.02, rh*1.02, 1); img.position.set((a.x + b.x)/2, (a.y + b.y)/2, Z);
      let W, H, cx, cy;
      if (port){ H = rh*(.48 + .26*fold); W = H*A; cx = (a.x + b.x)/2 + (W - rw)*.5*(pan || 0); cy = (b.y - rh*.235)*(1 - fold) + ((a.y + b.y)/2 + rh*.03)*fold; }
      else { // ПК: картинка крупно (чуть выше экрана), курсор водит по ней: у левого края виден левый край картины, у правого — правый
        H = rh*1.12; W = H*A; if (W < rw*1.15){ W = rw*1.15; H = W/A; }
        const L = a.x + rw*(left || 0)*(1 - fold), xl = L + W/2, xr = b.x - W/2, t = ((pan || 0) + 1)/2;
        cx = xl + (xr - xl)*t; cy = (a.y + b.y)/2 + (H - rh)*.5*(tilt || 0); }
      const pw = rw*1.02, ph = rh*1.02, px0 = img.position.x - pw/2, py0 = img.position.y - ph/2;
      IU.uR.value.set((cx - W/2 - px0)/pw, (cy - H/2 - py0)/ph, W/pw, H/ph);
      const r = st.rect = { x0: cx - W/2, y1: cy + H/2, W, H, Z };
      const wly = C.wl ? r.y1 - C.wl*H : r.y1 - H;
      for (const F of fx){
        if (F.k === "M" || F.k === "Y"){ const wet = F.k === "Y" && C.wl && C.wl < .5 || F.f === "rays" && C.wl;
          const y0 = F.k === "Y" ? (wet ? r.y1 - H : wly) : (C.wl ? wly : r.y1 - H*.95), y1 = F.k === "Y" ? (wet ? wly : r.y1) : y0 + H*(F.f === "haze" ? .55 : .3);
          F.o.scale.set(W, Math.abs(y1 - y0), 1); F.o.position.set(cx, (y0 + y1)/2, Z + .1); continue; }
        const wet = F.k === "B" || F.k === "P" && C.wl || F.k === "V" || F.k === "R" && C.wl, y0 = wet ? r.y1 - H : (C.wl ? wly : r.y1 - H), y1 = wet ? (C.wl ? wly : r.y1) : r.y1;
        const P = F.P, pos = F.o.geometry.attributes.position, A2 = pos.array, vx = C.vent;
        for (let i = 0; i < P.length/3; i++){ A2[i*3] = F.k === "V" && vx ? r.x0 + (vx[0] + (P[i*3] - .5)*.03)*W : r.x0 + P[i*3]*W; A2[i*3 + 1] = y0 + P[i*3 + 1]*(y1 - y0); A2[i*3 + 2] = Z + .3 + P[i*3 + 2]*2.5; }
        pos.needsUpdate = true; const u = F.o.material.uniforms; u.uY0.value = F.k === "V" && vx ? r.y1 - vx[1]*H : y0; u.uY1.value = y1; }
      return r;
    }
    grp.visible = false;
    // средний цвет окна картинки вокруг (u, v сверху), радиус — в долях ширины; null, пока картинка не загружена
    const colorAt = (u, v, rad) => { if (!st.col) return null; const w = st.cw, h = st.ch, cx = u*w, cy = v*h, rx = Math.max(1, rad*w), ry = Math.max(1, rad*w);
      let r = 0, g = 0, bl = 0, n = 0;
      for (let y = Math.max(0, cy - ry | 0); y <= Math.min(h - 1, cy + ry | 0); y++) for (let x = Math.max(0, cx - rx | 0); x <= Math.min(w - 1, cx + rx | 0); x++){ const i = (y*w + x)*4; r += st.col[i]; g += st.col[i + 1]; bl += st.col[i + 2]; n++; }
      return n ? [r/n/255, g/n/255, bl/n/255] : null; };
    return { grp, C, st, img: true, depthAt, colorAt, dep: tD, tex: tI, kPar: IU.uK, layout,
      toWorld(u, v){ const r = st.rect; return r ? [r.x0 + u*r.W, r.y1 - v*r.H] : [0, 0]; },
      shift(u, v){ const r = st.rect; if (!r) return [0, 0]; const d = depthAt(u, v); return [st.par.x*(d - .3)*IU.uK.value*r.W, st.par.y*(d - .3)*IU.uK.value*r.H]; },
      update(T, A, px, py){ U.uT.value = T; U.uA.value = A*(st.ok ? 1 : 0); st.par.set(px, py); grp.visible = U.uA.value > .004; },
      dispose(){ disp.forEach(d => d.dispose()); } };
  }
  return { build, has: id => !!BIO_PIMG[id] };
})();

// «Пласты камня»: фотореалистичная стена породы под фонарём, спуск по 20 пластам, раскол по слоям.
// Отдельный холст поверх сцены главы: где камень ушёл — холст прозрачен, и видна живая панорама эпохи (bio.js).
// Прототип и история решений — claude/plasty-fotoreal.md.
const STRATA = (() => {
"use strict";
let API = null;
function boot(box, BASE){
const AR = 1429/2560;               // высота картинки стены / ширина
const PA = 3168/1344;               // пропорции панорамы
// ---- пласты с картинками (сверху вниз) ----
const mk = (id, nm, age, rock, txt, o) => Object.assign({ id, nm, age, rock, txt, gloss:.3, grain:[120,110,100], soft:"none", dust:1 }, o || {});
const L = [
  mk("now", "Наше время", "с середины XX века", "Насыпной грунт: бетон, кирпич, стекло, асфальт, пластик, кости кур.",
    "Так выглядит слой, который оставляем мы. Геологи спорят, считать ли его новой эпохой — антропоценом: в 2024 году подкомиссия по стратиграфии четвертичного периода отклонила это предложение <span class=mk>●</span>. Но след уже в камне: кусок «пластигломерата» — расплавленный пластик, сросшийся с песком и галькой.",
    { gloss:.35, grain:[90,70,50], soft:"all", dust:2 }),
  mk("holocene", "Голоцен", "11,7 тыс. лет назад – наши дни", "Торф с корнями, серо-голубая озёрная глина, песок.",
    "Тёплое время после последнего оледенения <span class=mk>●</span>. В болотах растения не успевают сгнить и копятся торфом — примерно по миллиметру в год <span class=mk>◐</span>. Торф хранит пыльцу, по которой восстанавливают климат прошлого <span class=mk>●</span>.",
    { gloss:.5, grain:[70,52,36], soft:"all", dust:1.2 }),
  mk("pleistocene", "Плейстоцен", "2,58 млн – 11,7 тыс. лет назад", "Жёлтый лёсс, вечная мерзлота с линзами льда, ледниковая морена.",
    "Эпоха ледниковых периодов <span class=mk>●</span>. Ледник приносил валуны всех пород и бросал их вперемешку — так получилась морена <span class=mk>●</span>. Ветер с ледников надувал жёлтый лёсс <span class=mk>●</span>, а в мерзлоте до сих пор находят туши мамонтов <span class=mk>●</span>.",
    { gloss:.35, grain:[190,170,130], soft:"all", dust:2.2 }),
  mk("neogene", "Неоген", "23 – 2,58 млн лет назад", "Косослоистый песчаник, белый диатомит, прослой гальки.",
    "Косые слои — следы подводных дюн и течений <span class=mk>●</span>. Белый лёгкий диатомит сложен створками микроскопических водорослей-диатомей <span class=mk>●</span>. В неогене жил мегалодон, самая крупная хищная акула <span class=mk>●</span>.",
    { gloss:.15, grain:[215,190,140], dust:2 }),
  mk("paleogene", "Палеоген", "66 – 23 млн лет назад", "Тонкослоистый горючий сланец.",
    "Ил на дне бескислородного озера ложился тончайшими слоями <span class=mk>●</span>. В таком сланце карьера Мессель (Германия, ≈ 47 млн лет) сохранились ранние лошади и летучие мыши с контуром тела и даже содержимым желудка <span class=mk>●</span>.",
    { gloss:.5, grain:[80,72,62], soft:"shale", dust:.8 }),
  mk("cretaceous", "Мел", "145 – 66 млн лет назад", "Белый мел с рядами чёрных кремнёвых желваков.",
    "Мел — это микроскопические известковые щитки водорослей-кокколитофорид, миллионы лет оседавшие на дно тёплого моря <span class=mk>●</span>. Чёрные желваки — кремень: кремнезём скелетов губок, собравшийся в осадке <span class=mk>●</span>. Тонкая тёмная полоса сверху — граница мела и палеогена: глина с иридием от удара астероида 66 млн лет назад <span class=mk>●</span> (в Дувре её нет — она видна, например, в Стевнс-Клинт в Дании).",
    { gloss:.12, grain:[217,212,198], dust:2.5, pin:{ v:.125, t:"66,0 млн лет · иридиевая глина" } }),
  mk("jurassic", "Юра", "201 – 145 млн лет назад", "Голубой лейас: слои известняка и глинистого сланца.",
    "Ритм светлых известняков и тёмных сланцев отложился на дне тёплого мелкого моря <span class=mk>●</span>. В таких скалах у Лайм-Риджиса Мэри Эннинг в 1811–1812 годах откопала первый целый скелет ихтиозавра <span class=mk>●</span>. Под фонарём проступает его отпечаток — в сланцах Хольцмадена сохраняется даже контур тела <span class=mk>●</span>.",
    { gloss:.45, grain:[111,118,122], soft:"dark", dust:1, fos:{ u:.63, v:.56, w:.153, ha:.4, nm:"Ихтиозавр", what:"череп с кольцом костных пластин вокруг глаза · ≈ 45 см" } }),
  mk("triassic", "Триас", "252 – 201 млн лет назад", "Красные песчаники и аргиллиты с зелёными пятнами.",
    "Красный цвет — окисленное железо: осадки сохли на воздухе жаркой Пангеи <span class=mk>●</span>. Зелёные пятна — места, где железо восстановилось <span class=mk>●</span>. В триасе появились первые динозавры и млекопитающие <span class=mk>●</span>.",
    { gloss:.2, grain:[170,80,55], soft:"dark", dust:1.6 }),
  mk("permian", "Пермь", "299 – 252 млн лет назад", "Красный дюнный песчаник, гипс и каменная соль.",
    "Огромные косые слои — застывшие дюны пустыни <span class=mk>●</span>. Ниже соль и гипс: испарившееся мелкое море, как цехштейн Европы <span class=mk>●</span>. В конце перми случилось величайшее вымирание: исчезло около 80–90 % морских видов <span class=mk>◐</span>.",
    { gloss:.3, grain:[190,95,60], dust:1.8 }),
  mk("carboniferous", "Карбон", "359 – 299 млн лет назад", "Угольный пласт между сланцем и песчаником.",
    "Уголь — спрессованные остатки болотных лесов из гигантских плаунов и папоротников <span class=mk>●</span>. Чтобы получился метровый пласт, нужны были многие метры торфа <span class=mk>◐</span>. Под фонарём уголь блестит и раскалывается на кубики по трещинам кливажа.",
    { gloss:1.0, grain:[29,27,26], soft:"cube", dust:1.2 }),
  mk("devonian", "Девон", "419 – 359 млн лет назад", "Древний красный песчаник с галечным конгломератом.",
    "Галька и косые слои — русла рек на суше <span class=mk>●</span>. В таких породах Шотландии найдены панцирные и кистепёрые рыбы <span class=mk>●</span>; в девоне первые четвероногие вышли на сушу <span class=mk>●</span>.",
    { gloss:.2, grain:[140,70,55], dust:1.4 }),
  mk("silurian", "Силур", "443 – 419 млн лет назад", "Рифовый известняк с куполами строматопороидей.",
    "Купола и бугры — постройки губок-строматопороидей и кораллов тёплого мелкого моря <span class=mk>●</span>. В силуре на сушу вышли первые растения <span class=mk>●</span>.",
    { gloss:.15, grain:[160,158,150], dust:1.3 }),
  mk("ordovician", "Ордовик", "487 – 443 млн лет назад", "Красно-зелёный тонкослоистый известняк.",
    "В таком известняке Балтики полно прямых раковин ортоцерасов — родственников наутилуса <span class=mk>●</span>. В ордовике морская жизнь стремительно разнообразилась <span class=mk>●</span>, а закончился он одним из пяти великих вымираний <span class=mk>●</span>.",
    { gloss:.25, grain:[130,90,80], dust:1 }),
  mk("cambrian", "Кембрий", "539 – 487 млн лет назад", "Чёрный сланец, как в Бёрджес.",
    "Тонкий ил хоронил животных быстро и без кислорода — сохранились даже мягкие тела <span class=mk>●</span>. Сланцу Бёрджес в Канаде около 508 млн лет <span class=mk>●</span>.",
    { gloss:.55, grain:[60,60,62], soft:"shale", dust:.8 }),
  mk("ediacaran", "Эдиакарий", "635 – 539 млн лет назад", "Розовый кварцитовый песчаник с «кожей слона».",
    "Морщинистая поверхность — след бактериального ковра на дне <span class=mk>●</span>. На таких коврах жили первые крупные животные — дикинсонии <span class=mk>●</span>.",
    { gloss:.15, grain:[220,170,150], dust:1 }),
  mk("snowball", "Земля-снежок", "720 – 635 млн лет назад", "Тиллит — ледниковая мешанина — и светлая «шапка» доломита.",
    "Камни, упавшие с тающего льда, продавили слои ила под собой <span class=mk>●</span>. Светлый доломит сверху отложился сразу после оттаивания, в тёплом море <span class=mk>●</span>.",
    { gloss:.25, grain:[90,100,95], dust:1.2 }),
  mk("boring", "«Скучный миллиард»", "≈ 1,8 – 0,8 млрд лет назад", "Красный песчаник и доломит со строматолитами.",
    "Около миллиарда лет условия на Земле почти не менялись <span class=mk>◐</span>. Волнистые слои — строматолиты, постройки цианобактерий <span class=mk>●</span>.",
    { gloss:.15, grain:[170,110,95], dust:1.2 }),
  mk("goe", "Кислородное событие", "≈ 2,4 млрд лет назад", "Полосчатая железная руда: красная яшма и серый гематит.",
    "Кислород цианобактерий окислял растворённое в море железо, и оно оседало слоями <span class=mk>●</span>. Из таких пород добывают большую часть железной руды мира <span class=mk>●</span>.",
    { gloss:.8, grain:[140,70,70], dust:.7 }),
  mk("archean", "Архей", "4,0 – 2,5 млрд лет назад", "Подушечные лавы и полосчатый гнейс с жилами кварца.",
    "Подушки — лава, застывшая под водой <span class=mk>●</span>: такие есть в Гренландии, возрастом ≈ 3,7 млрд лет, значит, океаны уже были <span class=mk>●</span>.",
    { gloss:.5, grain:[70,80,70], dust:.6 }),
  mk("hadean", "Гадей", "4,57 – 4,0 млрд лет назад", "Древний метаморфизованный конгломерат с вытянутой кварцевой галькой.",
    "Пород гадея почти не осталось <span class=mk>●</span>. Древнейшие свидетели — кристаллики циркона ≈ 4,4 млрд лет в более молодой породе Джек-Хиллс (Австралия) <span class=mk>●</span>: по ним видно, что вода была уже тогда <span class=mk>◐</span>.",
    { gloss:.6, grain:[150,120,100], dust:.6 }),
];
// u, v — центр окаменелости в долях картинки стены, w — ширина в долях ширины, ha — высота/ширина.
// Сверено по самим картинкам (15.10.2026): прежде у всех стояло u = 0,62 «на глаз», и у девона и карбона зона
// наведения оказалась под окаменелостью
const FOS = {
  now:        { u:.615, v:.55, w:.10, ha:.78, nm:"Пластигломерат", what:"пластик, сплавленный с песком и галькой · ≈ 25 см" },
  holocene:   { u:.625, v:.495, w:.26, ha:.3, nm:"Рог благородного оленя", what:"сброшенный рог в торфе · ≈ 70 см" },
  pleistocene:{ u:.635, v:.565, w:.085, ha:.6, nm:"Зуб мамонта", what:"коренной зуб с пластинами эмали · ≈ 30 см" },
  neogene:    { u:.62, v:.415, w:.085, ha:.75, nm:"Зуб мегалодона", what:"самой крупной хищной акулы · ≈ 17 см" },
  paleogene:  { u:.615, v:.565, w:.23, ha:.62, nm:"Ранняя лошадь", what:"скелет с контуром тела, как в сланце Мессель · ≈ 60 см" },
  cretaceous: { u:.605, v:.51, w:.32, ha:.4, nm:"Мозазавр", what:"череп морского ящера · ≈ 90 см" },
  triassic:   { u:.625, v:.53, w:.095, ha:.62, nm:"Листрозавр", what:"череп с двумя бивнями · ≈ 25 см" },
  permian:    { u:.62, v:.375, w:.155, ha:.55, nm:"Диметродон", what:"череп хищного синапсида с зубами разной длины · ≈ 40 см" },
  carboniferous:{ u:.575, v:.45, w:.36, ha:.42, nm:"Лепидодендрон", what:"кора древовидного плауна с ромбическими рубцами листьев · ≈ 60 см" },
  devonian:   { u:.615, v:.46, w:.17, ha:.42, nm:"Коккостей", what:"панцирная рыба · ≈ 40 см" },
  // v142: окаменелости 12–20 (правки Люсии в Nano Banana, вписаны strata_work/fos9.py)
  silurian:   { u:0.622, v:0.566, w:0.241, ha:0.52, nm:"Ракоскорпионы", what:"три эвриптеруса на рифовом известняке · ≈ 20 см каждый" },
  ordovician: { u:0.62, v:0.562, w:0.126, ha:1.2, nm:"Изотел", what:"гигантский трилобит · ≈ 50 см" },
  cambrian:   { u:0.62, v:0.607, w:0.211, ha:0.49, nm:"Аномалокарис", what:"серебристая углеродная плёнка, как в сланцах Бёрджес · ≈ 40 см" },
  ediacaran:  { u:0.621, v:0.578, w:0.13, ha:0.67, nm:"Дикинсония", what:"отпечаток мягкого тела в песчанике · ≈ 40 см" },
  snowball:   { u:0.625, v:0.505, w:0.126, ha:0.82, nm:"Камень-«капля»", what:"валун, упавший с айсберга, прогнул слои ила · ≈ 35 см" },
  boring:     { u:0.618, v:0.671, w:0.209, ha:0.69, nm:"Строматолит", what:"купол из тысяч слоёв микробного мата · ≈ 50 см" },
  goe:        { u:0.626, v:0.551, w:0.136, ha:0.59, nm:"Строматолиты в яшме", what:"столбики из слоёв микробного мата в кремне · ≈ 35 см" },
  archean:    { u:0.609, v:0.495, w:0.06, ha:0.98, nm:"Конический строматолит", what:"в кремне между подушечными лавами · ≈ 25 см" },
  hadean:     { u:0.619, v:0.551, w:0.05, ha:1.0, nm:"Кристалл циркона", what:"древнейшие минералы Земли — до 4,4 млрд лет; на снимке крупнее, настоящий — доли миллиметра" },
};
const DIR3 = ["permian"];   // переделанные окаменелости
L.forEach(E => { if (FOS[E.id]) E.fos = FOS[E.id]; E.dir = BASE + (DIR3.includes(E.id) ? "v3/" : E.fos ? "v2/" : ""); });   // стены с вписанной окаменелостью — в v2
const PANOS = "archean boring cambrian carboniferous cretaceous devonian ediacaran goe hadean holocene jurassic neogene now ordovician paleogene permian pleistocene silurian snowball triassic".split(" ");
L.forEach(E => { E.pano = PANOS.includes(E.id); });
const ERAS = L.map(E => E.nm);
const READY = Object.fromEntries(L.map((E, i) => [i, i]));
const GAPS = {};
const NSL = 2048;                                // предел плит в карте

// ---- WebGL ----
const cv = document.createElement("canvas"), fx = document.createElement("canvas");
cv.id = "bioStrata"; fx.id = "bioStrataFx"; cv.className = fx.className = "bio-strata-cv"; cv.setAttribute("aria-hidden", "true"); fx.setAttribute("aria-hidden", "true");
const before = box.querySelector("#bioFold") || null; box.insertBefore(cv, before); box.insertBefore(fx, before);
const c2 = fx.getContext("2d");
const gl = cv.getContext("webgl", { antialias:false, alpha:true, premultipliedAlpha:true });
if (!gl){ cv.remove(); fx.remove(); return null; }
const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision highp float;
uniform vec2 uRes; uniform float uS, uOffX, uScroll, uBase, uN, uHs, uDay, uDpr;
uniform vec3 uLight; uniform vec3 uGl;
uniform sampler2D uC0, uC1, uC2, uH0, uH1, uH2, uF, uP, uId, uSt;
uniform vec4 uFos; uniform float uFosHa;
uniform float uMode, uT, uBack, uOpen, uAll;             // способ: 1 плиты, 2 эрозия; время; возврат в камень; доля открытого
uniform vec2 uO; uniform vec4 uReg;                 // начало (ширины стены); область карты плит
uniform vec4 uPan; uniform vec2 uPar;
const float AR = ${AR.toFixed(6)};
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*18731.73); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a*vnoise(p); p = p*2.03 + 7.1; a *= .5; } return s; }
float wave(float u, float k){ return .016*sin(u*7.3 + k*2.9) + .009*sin(u*19.1 + k*5.3) + .005*sin(u*47. + k); }
vec3 colS(float s, vec2 uv){ return s < .5 ? texture2D(uC0, uv).rgb : s < 1.5 ? texture2D(uC1, uv).rgb : texture2D(uC2, uv).rgb; }
float hS0(float s, vec2 uv){ return s < .5 ? texture2D(uH0, uv).r : s < 1.5 ? texture2D(uH1, uv).r : texture2D(uH2, uv).r; }
float glS(float s){ return s < .5 ? uGl.x : s < 1.5 ? uGl.y : uGl.z; }
vec2 fosUV(float li, vec2 uv){
  if (abs(li - uFos.x) > .5) return vec2(-1.);
  return vec2((uv.x - uFos.y)/uFos.w + .5, (uv.y - uFos.z)/(uFos.w*uFosHa/AR) + .5);   // uFos: слой, u, v, ширина
}
float fosM(vec2 f){ return (f.x < 0. || f.x > 1. || f.y < 0. || f.y > 1.) ? 0. : texture2D(uF, f).a; }
float hgt(float s, float li, vec2 uv){
  float h = hS0(s, uv);
  vec2 f = fosUV(li, uv); if (f.x >= 0.){ vec4 F = texture2D(uF, clamp(f, 0., 1.)); float m = fosM(f); h = mix(h, .64 + (F.r - .5)*.7, m*.9); }
  return h;
}
vec3 pano(vec2 px){
  vec2 q = (px - uPan.xy)/uPan.zw; q = clamp(q, 0., 1.);
  float d = texture2D(uP, vec2(q.x, .5 + clamp(q.y, .002, .998)*.5)).r; q -= uPar*(d - .3)*.02; q = clamp(q, .002, .998);
  return pow(texture2D(uP, vec2(q.x, q.y*.5)).rgb, vec3(2.2));
}
// карта плит: 0 — линия скола; иначе номер плиты; состояние: 1 — плита ушла со стены
float slabGone(vec2 w){
  vec2 iq = (w - uReg.xy)/uReg.zw;
  if (iq.x < 0. || iq.y < 0. || iq.x > 1. || iq.y > 1.) return 0.;
  vec4 c = texture2D(uId, iq); float id = floor(c.r*255. + .5) + floor(c.g*255. + .5)*256.;
  if (id < .5) return -1.;
  return texture2D(uSt, vec2((id + .5)/${NSL}., .5)).r;
}
// треснула ли плита (скоро упадёт): по ней видна линия скола
float slabCrk(vec2 w){
  vec2 iq = (w - uReg.xy)/uReg.zw;
  if (iq.x < 0. || iq.y < 0. || iq.x > 1. || iq.y > 1.) return 0.;
  vec4 c = texture2D(uId, iq); float id = floor(c.r*255. + .5) + floor(c.g*255. + .5)*256.;
  if (id < .5) return 0.;
  return texture2D(uSt, vec2((id + .5)/${NSL}., .5)).g;
}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float u = (px.x + uOffX)/uS, Y = uScroll + px.y/(uS*AR);
  float li = floor(Y);
  if (Y < li + wave(u, li)) li -= 1.;
  else if (Y >= li + 1. + wave(u, li + 1.)) li += 1.;
  li = clamp(li, 0., uN - 1.);
  float s = li - uBase;
  vec2 uv = vec2(u, Y - li);
  vec2 uvc = vec2(u, uv.y < 0. ? -uv.y : uv.y > 1. ? 2. - uv.y : uv.y); uvc.y = clamp(uvc.y, .002, .998);
  vec2 w = vec2(u, Y*AR);                         // координаты стены в её ширинах
  float pxw = 1./uS;                               // один пиксель экрана в ширинах стены
  float gone = 0., line = 0., occ = 0., lit = 0., sink = 0., dark = 0., haze = 0.;
  float dO = length(w - uO);
  if (uBack > 0.){
    // ---- назад в камень: осадок нарастает с краёв к окаменелости ----
    float h = hS0(s, uvc);
    float D = .42*fbm(w*16.) + .3*(1. - h) + .1*fbm(w*70.) + dO;
    float thr = -.1 + 1.7*pow(1. - uBack, 1.2);
    float e = (D - thr)/.06; gone = step(e, 0.);
    float ed = clamp(1. - e, 0., 1.)*(1. - gone); sink = ed*ed; dark = ed; occ = gone*clamp(1. + e*.6, 0., 1.)*.9;
  } else if (uMode > .5 && uMode < 1.5){
    // ---- раскол по слоям: плиты из карты ----
    float g0 = slabGone(w);
    float rc = .02 + .55*pow(uT, 1.3);             // фронт трещин
    if (g0 < -.5){                                 // на линии скола
      float n = 0., ck = 0.;                        // сколько рядом целых плит; треснула ли соседняя
      for (int k = 0; k < 6; k++){ float a = float(k)*1.0472; vec2 o = w + vec2(cos(a), sin(a))*5.*pxw; float g = slabGone(o); n += step(-.5, g)*(1. - step(.5, g)); ck = max(ck, slabCrk(o)); }
      gone = 1. - step(.5, n); line = (1. - gone)*ck;
    } else gone = step(.5, g0);
    float ng = 0., nr = 0.;
    for (int k = 0; k < 6; k++){ float a = float(k)*1.0472 + .4;
      vec2 o = vec2(cos(a), sin(a));
      ng += step(.5, slabGone(w + o*28.*pxw));      // рядом пролом — свет из него на камень
      float g9 = slabGone(w + o*9.*pxw); nr += step(-.5, g9)*(1. - step(.5, g9)); } // рядом целый камень — тень толщины стены на картине
    lit = ng/6.; occ = nr/6.;
    if (uAll > .5){ gone = 1.; occ = 0.; line = 0.; }
  } else if (uMode > 1.5){
    // ---- стереть временем: камень истирается по своему рельефу ----
    float h = hS0(s, uvc);
    float D = .42*fbm(w*16.) + .3*(1. - h) + .1*fbm(w*70.) + dO;
    float thr = .05 + 1.4*pow(uT/6., 1.1);
    float e = (D - thr)/.06;
    gone = step(e, 0.);
    float ed = clamp(1. - e, 0., 1.)*(1. - gone);
    sink = ed*ed; dark = ed;
    occ = gone*clamp(1. + e*.6, 0., 1.)*.9;        // у края пролома — тень от толщины
    lit = gone > .5 ? 0. : smoothstep(.35, 0., e*.06)*.5;
    haze = smoothstep(.16, 0., abs(D - thr))*fbm(w*7. + vec2(0., uT*.25))*step(.01, uT);
  }
  vec3 col;
  vec3 rockC;
  // ---- камень ----
  {
    vec3 alb = pow(colS(s, uvc), vec3(2.2));
    vec2 f = fosUV(li, uvc); float fm = 0.;
    if (f.x >= 0.){ fm = fosM(f); vec4 F = texture2D(uF, clamp(f, 0., 1.)); alb = mix(alb, alb*vec3(.34, .3, .26)*(.55 + 1.1*F.r), fm*.92); }
    float tx = 1./1280., ty = 1./714.;
    float h0 = hgt(s, li, uvc);
    float hl = hgt(s, li, uvc - vec2(tx, 0.)), hr2 = hgt(s, li, uvc + vec2(tx, 0.));
    float hu = hgt(s, li, uvc - vec2(0., ty)), hd = hgt(s, li, uvc + vec2(0., ty));
    float pxT = uS/1280.;
    float yb = Y - li, bd = min(abs(yb - wave(u, li)), abs(yb - 1. - wave(u, li + 1.)))*uS*AR;
    float groove = exp(-bd*bd/(2.*pow(uS*.0035, 2.)));
    h0 -= groove*.25; alb *= 1. - groove*.55;
    // линия скола: узкая тёмная щель с рваным краем
    float rough = .6 + .8*vnoise(w*900.);
    h0 -= line*.6*rough; alb *= 1. - line*.88;
    // эрозия: край проседает, светлеет свежим сколом и сыплется песком
    h0 -= sink*.7; alb = mix(alb, alb*.45, dark*.6);
    float sand = step(.8, hash(floor(px/1.6) + floor(uT*14.)))*dark;
    alb += vec3(.18, .16, .13)*sand*.5;
    vec3 N = normalize(vec3(-(hr2 - hl + sink*.0)*uHs/(2.*pxT), -(hd - hu)*uHs/(2.*pxT), 1.));
    vec3 P = vec3(px, h0*uHs);
    vec3 Lv = uLight - P; float dist = length(Lv); vec3 Ld = Lv/dist;
    float R = .5*max(uRes.x, uRes.y);
    float dxy = length(uLight.xy - px);
    float att = pow(clamp(1. - dxy/(R*1.15), 0., 1.), 1.7)*(1./(1. + dist*dist/(R*R*.55)));
    float sh = 1.; vec2 dir = normalize(uLight.xy - px + 1e-4); float lz = Ld.z/max(length(Ld.xy), 1e-3);
    for (int k = 1; k <= 7; k++){
      float st = float(k)*float(k)*1.6*pxT; vec2 pp = px + dir*st;
      vec2 uvk = vec2((pp.x + uOffX)/uS, (uScroll + pp.y/(uS*AR)) - li);
      float hk = hgt(s, li, clamp(uvk, .002, .998))*uHs; float rz = P.z + st*lz;
      sh = min(sh, clamp(1. - (hk - rz)/(uHs*.18), 0., 1.));
    }
    float diff = max(dot(N, Ld), 0.);
    vec3 Hh = normalize(Ld + vec3(0., 0., 1.));
    float lum = dot(alb, vec3(.3, .55, .15));
    float gm = glS(s)*(.25 + .75*(1. - smoothstep(.0, .25, lum)));
    float spec = pow(max(dot(N, Hh), 0.), 48.)*gm;
    vec3 lamp = vec3(1., .9, .74);
    float day = uDay*.3*exp(-max(Y, 0.)*5.);
    vec3 amb = vec3(.045, .041, .037) + vec3(.62, .66, .72)*day*(.55 + .45*N.y*-1.);
    // свет живого мира из пролома: мягкий, рассеянный, растёт с размером пролома
    vec3 sky = vec3(.95, .9, .78)*(lit*.55 + uOpen*.12);
    rockC = alb*(amb + sky + lamp*diff*att*1.9*sh) + lamp*spec*att*sh*1.4;
  }
  col = rockC/(1. + rockC*.55);
  vec2 sc = px/uRes - .5; col *= 1. - .45*dot(sc*vec2(1.1, 1.), sc*vec2(1.1, 1.));
  float a = 1. - gone;
  // камень — непрозрачный; в проломе — прозрачно, у края лёгкая тень толщины стены (premultiplied)
  gl_FragColor = vec4(pow(col, vec3(1./2.2))*a, a + gone*.7*occ*occ);
}`;
// плиты, падающие со стены: каждая грань освещена в JS (aK), лицевая грань несёт отпечаток окаменелости
const VSC = `attribute vec2 aP; attribute vec2 aT; attribute float aK; attribute float aSide; uniform vec2 uRes; varying vec2 vT; varying float vK, vSide;
void main(){ vT = aT; vK = aK; vSide = aSide; gl_Position = vec4(aP.x/uRes.x*2. - 1., 1. - aP.y/uRes.y*2., 0., 1.); }`;
const FSC = `precision mediump float; uniform sampler2D uTex, uF, uHt; uniform vec4 uFos; uniform float uFosHa, uHasF; varying vec2 vT; varying float vK, vSide;
const float AR = ${AR.toFixed(6)};
void main(){
  vec3 a = pow(texture2D(uTex, vT).rgb, vec3(2.2));
  if (uHasF > .5 && vSide < .5){ vec2 f = vec2((vT.x - uFos.y)/uFos.w + .5, (vT.y - uFos.z)/(uFos.w*uFosHa/AR) + .5);
    if (f.x > 0. && f.x < 1. && f.y > 0. && f.y < 1.){ vec4 F = texture2D(uF, f); a = mix(a, a*vec3(.34, .3, .26)*(.55 + 1.1*F.r), F.a*.92); } }
  if (vSide > .5) a = mix(a, vec3(dot(a, vec3(.33))), .35)*.8;     // свежий скол: тусклее, серее
  else { vec2 e = vec2(2./1280., 2./714.); float h = texture2D(uHt, vT).r;
    float hb = .25*(texture2D(uHt, vT + vec2(e.x, 0.)).r + texture2D(uHt, vT - vec2(e.x, 0.)).r + texture2D(uHt, vT + vec2(0., e.y)).r + texture2D(uHt, vT - vec2(0., e.y)).r);
    float gy = texture2D(uHt, vT - vec2(0., e.y)).r - texture2D(uHt, vT + vec2(0., e.y)).r;
    a *= clamp(.8 + (h - hb)*3. + gy*1.5, .35, 1.5); }               // рельеф той же породы, что на стене
  vec3 c = a*vK; c = c/(1. + c*.55); gl_FragColor = vec4(pow(c, vec3(1./2.2)), 1.); }`;
function prog(vs, fs){
  const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p;
}
const P1 = prog(VS, FS), P2 = prog(VSC, FSC);
const U1 = {}; ["uRes","uS","uOffX","uScroll","uBase","uN","uHs","uDay","uDpr","uLight","uGl","uC0","uC1","uC2","uH0","uH1","uH2","uF","uP","uId","uSt","uFos","uFosHa","uMode","uT","uBack","uOpen","uAll","uO","uReg","uPan","uPar"].forEach(k => U1[k] = gl.getUniformLocation(P1, k));
const U2 = {}; ["uRes","uTex","uF","uHt","uFos","uFosHa","uHasF"].forEach(k => U2[k] = gl.getUniformLocation(P2, k));
const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
const slabBuf = gl.createBuffer();
function tex(img, nearest){
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  const f = nearest ? gl.NEAREST : gl.LINEAR;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = src; });
const black = (() => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0])); return t; })();
// состояние плит: 512 × 1, R = 255 — плита ушла
const stData = new Uint8Array(NSL*4), stTex = (() => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, NSL, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, stData);
  [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST));
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE)); return t; })();
let idTex = black;

// ---- состояние ----
let W = 0, H = 0, DPR = 1, S = 1, offX = 0;
let cur = 0, scroll = 0, sFrom = 0, sTo = 0, sT = 1, sDur = 1.7;
const ptr = { x: 0, y: 0, tx: 0, ty: 0, seen: false, lastMove: 0 };
let crk = null;                 // { mode, t, O:[u,y], slabs, back, region }
let panoOn = false, panX = 0, panY = 0;
const puffs = [], grains = [], crumbs = [], motes = [];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let way = "slab", dbgPause = false;

function size(){
  DPR = Math.min(1.5, devicePixelRatio || 1); W = box.clientWidth || innerWidth; H = box.clientHeight || innerHeight;
  cv.width = W*DPR | 0; cv.height = H*DPR | 0; fx.width = W*DPR | 0; fx.height = H*DPR | 0;
  S = Math.max(W*1.1, H*.86/AR);
  if (!ptr.seen){ ptr.x = ptr.tx = W*.62; ptr.y = ptr.ty = H*.48; }
  sTo = targetScroll(cur); if (sT >= 1) scroll = sTo;
}
const vis = () => H/(S*AR);
const port = () => W < 760;
// на телефоне нижнюю половину закрывает текст — окаменелость поднимаем в верхнюю треть
const targetScroll = k => { if (k < 0) return -.02; const F = L[k].fos, c = port() ? (F ? k + F.v - vis()*.24 : k + .5 - vis()*.25) : k + .5 - vis()/2; return Math.max(-.02, Math.min(L.length - vis() + .02, c)); };
// координаты: стена (ширины) ↔ экран (px)
const toScr = (wu, wy) => [wu*S - offX, (wy/AR - scroll)*S*AR];

const $ = id => document.getElementById(id);
const cb = { fossil: null, opened: null, closed: null };
function go(k, now){
  if (crk){ crk = null; panoOn = false; trickles.length = 0; puffs.length = grains.length = debris.length = 0; }
  const kk = Math.max(-1, Math.min(L.length - 1, k)); ensure(Math.max(0, kk));
  cur = Math.max(0, kk); sFrom = scroll; sTo = targetScroll(kk); hover(-1, -1);
  if (now){ scroll = sTo; sT = 1; } else { sT = 0; sDur = Math.min(3.4, 1.5 + .12*Math.abs(sTo - sFrom)); }
}
// пласты грузятся по мере спуска: текущий и по одному соседу
const LOADS = {};
function load(E){ if (LOADS[E.id]) return LOADS[E.id];
  return LOADS[E.id] = Promise.all([loadImg(`${E.dir}${E.id}.webp`).then(i => { IMG[E.id] = i; TX[E.id] = tex(i); }), loadImg(`${E.dir}${E.id}_h.webp`).then(i => { IMG[E.id + "_h"] = i; TX[E.id + "_h"] = tex(i); })]); }
function ensure(k){ for (let j = k - 1; j <= k + 2; j++) if (L[j]) load(L[j]); }

// ---- окаменелость ----
function fosScreen(){
  const E = L[cur]; if (!E.fos) return null; const F = E.fos;   // область наведения
  const [x, y] = toScr(F.u, (cur + F.v)*AR);
  return { x, y, w: F.w*S, h: F.w*(F.ha || .5)*S };
}
// ---- карта плит: слои по рельефу картинки, вертикальные трещины-отдельности ----
const IMG = {}, PIX = {};
function pix(id){ if (PIX[id]) return PIX[id];
  if (!IMG[id]) return { d: new Uint8ClampedArray(256*143*4).fill(128), Lm: new Float32Array(256*143).fill(128), med: 128 };   // ещё не загружен
  const c = document.createElement("canvas"); c.width = 256; c.height = 143; const x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(IMG[id], 0, 0, 256, 143); const d = x.getImageData(0, 0, 256, 143).data; const Lm = new Float32Array(256*143);
  for (let i = 0; i < Lm.length; i++) Lm[i] = d[i*4]*.3 + d[i*4 + 1]*.55 + d[i*4 + 2]*.15;
  const srt = [...Lm].sort((a, b) => a - b); return PIX[id] = { d, Lm, med: srt[srt.length >> 1] }; }
const lumMed = id => pix(id).med;
const pAt = (id, u, v) => { const P = pix(id), x = Math.max(0, Math.min(255, u*256 | 0)), y = Math.max(0, Math.min(142, v*143 | 0)); return y*256 + x; };
function lum(id, cu, cv){ const P = pix(id); let s = 0, n = 0; for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++){ s += P.Lm[pAt(id, cu + i*.008, cv + j*.01)]; n++; } return s/n; }
function avgRgb(id, cu, cv){ const P = pix(id), k = pAt(id, cu, cv)*4; return [P.d[k], P.d[k + 1], P.d[k + 2]]; }
function bedding(id){
  // где в картинке границы слоёв: строки с самым сильным перепадом рельефа
  const im = IMG[id + "_h"], c = document.createElement("canvas"); c.width = 320; c.height = 179;
  const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0, 320, 179); const d = x.getImageData(0, 0, 320, 179).data;
  const prof = new Float32Array(179);
  for (let y = 1; y < 178; y++){ let s = 0; for (let i = 0; i < 320; i++){ s += Math.abs(d[((y + 1)*320 + i)*4] - d[((y - 1)*320 + i)*4]); } prof[y] = s/320; }
  const sm = prof.map((v, i) => (prof[i - 1] || v)*.25 + v*.5 + (prof[i + 1] || v)*.25);
  const sorted = [...sm].sort((a, b) => a - b), thr = sorted[(sorted.length*.62) | 0], peaks = [];
  for (let y = 3; y < 176; y++) if (sm[y] > thr && sm[y] >= sm[y - 1] && sm[y] >= sm[y + 1] && sm[y] >= sm[y - 2] && sm[y] >= sm[y + 2]){
    if (!peaks.length || y - peaks[peaks.length - 1] > 7) peaks.push(y); }
  return peaks.map(y => y/179);
}
function buildSlabs(){
  const E = L[cur], F0 = E.fos || { u:.62, v:.5 }, O = [F0.u, (cur + F0.v)*AR];
  // область: весь экран с запасом
  const x0 = offX/S - .04, x1 = (offX + W)/S + .04, y0 = scroll*AR - .04, y1 = (scroll + vis())*AR + .04;
  // границы слоёв: из рельефа картинки в своём пласте, в соседних — через 3,5–6 % ширины
  const beds = bedding(E.id).map(v => (cur + v)*AR);
  const ys = [y0]; let y = y0;
  while (y < y1){ const nb = beds.find(b => b > y + .022 && b < y + .09); y = nb != null ? nb : y + .035 + Math.random()*.03; ys.push(Math.min(y, y1 + .02)); }
  const slabs = [];
  for (let r = 0; r < ys.length - 1; r++){
    const ya = ys[r], yb = ys[r + 1], bh = yb - ya;
    // вертикальные трещины: ломаные из трёх точек, наклон и изгиб случайны
    const js = []; let x = x0 - Math.random()*.05;
    while (x < x1 + .05){ const sl = (Math.random() - .5)*bh*.6, mid = (Math.random() - .5)*bh*.35; js.push([[x + sl/2, ya], [x + mid, (ya + yb)/2 + (Math.random() - .5)*bh*.3], [x - sl/2, yb]]); x += Math.max(.035, bh*(1.3 + Math.random()*2.6)); }
    js.push([[x, ya], [x, (ya + yb)/2], [x, yb]]);                 // последняя трещина — за правым краем области, чтобы ряд был закрыт
    for (let k = 1; k < js.length; k++) for (let q = 0; q < 3; q++) js[k][q][0] = Math.max(js[k][q][0], js[k - 1][q][0] + .012);   // соседние трещины не пересекаются
    for (let k = 0; k < js.length - 1; k++){
      const a = js[k], b = js[k + 1];
      const poly = [a[0], b[0], b[1], b[2], a[2], a[1]];
      const cx = poly.reduce((s, p) => s + p[0], 0)/6, cy = poly.reduce((s, p) => s + p[1], 0)/6;
      const lay = L[Math.max(0, Math.min(L.length - 1, Math.floor(cy/AR)))];
      const soft = lay.soft === "all" || lay.soft === "shale" || ((lay.soft === "dark" || lay.soft === "cube") && lum(lay.id, cx, cy/AR - Math.floor(cy/AR), poly) < lumMed(lay.id)*.93);
      if (!soft){ slabs.push({ poly, cx, cy, d: Math.hypot(cx - O[0], cy - O[1]), th: bh*(.35 + Math.random()*.25), r: Math.random() }); continue; }
      // мягкая порода: сланец — тонкие чешуи, уголь — кубики по кливажу, грунт — комья
      const kind = lay.soft === "dark" || lay.soft === "shale" ? "flake" : lay.soft === "cube" ? "cube" : "lump";
      const wq = Math.hypot(b[0][0] - a[0][0], b[0][1] - a[0][1]);
      const rows = kind === "flake" ? 2 + (Math.random()*2 | 0) : kind === "cube" ? Math.max(1, Math.round(bh/.022)) : 2;
      const cols = kind === "flake" ? Math.max(2, Math.round(wq/(bh*.7))) : Math.max(2, Math.round(wq/(bh/rows)));
      const G = [];
      for (let i = 0; i <= rows; i++){ G.push([]); for (let j = 0; j <= cols; j++){
        const t = i/rows, u = j/cols, top = [a[0][0] + (b[0][0] - a[0][0])*u, a[0][1] + (b[0][1] - a[0][1])*u], bot = [a[2][0] + (b[2][0] - a[2][0])*u, a[2][1] + (b[2][1] - a[2][1])*u];
        let px = top[0] + (bot[0] - top[0])*t, py = top[1] + (bot[1] - top[1])*t;
        if (i > 0 && i < rows) py += (Math.random() - .5)*bh/rows*.35;
        if (j > 0 && j < cols) px += (Math.random() - .5)*wq/cols*(kind === "cube" ? .15 : .45);
        G[i].push([px, py]); } }
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++){
        const pp = [G[i][j], G[i][j + 1], G[i + 1][j + 1], G[i + 1][j]];
        const qx = pp.reduce((s, p) => s + p[0], 0)/4, qy = pp.reduce((s, p) => s + p[1], 0)/4;
        slabs.push({ poly: pp, cx: qx, cy: qy, d: Math.hypot(qx - O[0], qy - O[1]), th: (bh/rows)*(kind === "cube" ? .9 : .45)*(.7 + Math.random()*.5), r: Math.random(), soft: kind });
      }
    }
  }
  const dmax = Math.max(...slabs.map(s => s.d));
  slabs.length = Math.min(slabs.length, NSL - 1);
  slabs.forEach((s, i) => { s.id = i + 1;
    // порядок: сначала плита с окаменелостью, дальше волна наружу; дальние идут чаще
    s.td = .7 + 3.1*Math.pow(s.d/dmax, .75) + s.r*.35*(.4 + s.d/dmax);
    s.alpha = 2.5 + Math.random()*4;                   // как быстро опрокидывается
    s.slide = s.cy > O[1] + .05 && Math.random() < .5; // нижние чаще сползают, чем опрокидываются
    s.vx = (s.cx - O[0])*(120 + Math.random()*160)*(1/Math.max(.05, s.d)); s.vz = 70 + Math.random()*150; s.roll = (Math.random() - .5)*2.2;
    s.layer = Math.max(0, Math.min(L.length - 1, Math.floor(s.cy/AR)));
    if (s.soft){ s.alpha = .5 + Math.random()*1.5; s.slide = Math.random() < .7; s.roll = (Math.random() - .5)*7; s.vx *= .5; s.vz *= .6; s.td += (Math.random() - .3)*.25; }
    s.rgb = avgRgb(L[s.layer].id, s.cx, s.cy/AR - s.layer);
    s.state = 0; });
  // растр номеров плит: заливка цветом-номером, края — чёрной линией скола
  const rw = x1 - x0, rh = y1 - y0, MW = 1600, MH = Math.round(MW*rh/rw);
  const c = document.createElement("canvas"); c.width = MW; c.height = MH; const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#000"; g.fillRect(0, 0, MW, MH);
  const mx = p => [(p[0] - x0)/rw*MW, (p[1] - y0)/rh*MH];
  for (const s of slabs){ g.fillStyle = `rgb(${s.id % 256},${s.id >> 8},${(s.id*37 + 11) % 256})`; g.beginPath(); s.poly.forEach((p, i) => { const [X, Y] = mx(p); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill(); }
  g.strokeStyle = "#000"; g.lineWidth = 2.4; g.lineJoin = "round";
  for (const s of slabs){ g.beginPath(); s.poly.forEach((p, i) => { const [X, Y] = mx(p); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.stroke(); }
  // сглаженные края заливки дают «чужие» номера — по контрольному синему каналу превращаем их в линию скола
  const im = g.getImageData(0, 0, MW, MH), D = im.data;
  for (let i = 0; i < D.length; i += 4){ const id = D[i] + D[i + 1]*256; if (id === 0 || D[i + 2] !== (id*37 + 11) % 256 || id > slabs.length){ D[i] = D[i + 1] = D[i + 2] = 0; } }
  g.putImageData(im, 0, 0);
  if (idTex !== black) gl.deleteTexture(idTex);
  idTex = tex(c, true);
  stData.fill(0); gl.bindTexture(gl.TEXTURE_2D, stTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NSL, 1, gl.RGBA, gl.UNSIGNED_BYTE, stData);
  return { slabs, region: [x0, y0, rw, rh], O };
}
const CRACK_DUR = 2.5;
function breakRock(){
  const E = L[cur]; if (crk || !TX[E.id]) return false;
  const F0 = E.fos || { u:.62, v:.5 }, O = [F0.u, (cur + F0.v)*AR];
  crk = { mode: "slab", t: 0, back: 0, O, slabs: [], region: [0, 0, 1, 1] };
  Object.assign(crk, buildSlabs());
  // v147: раскол и его пыль укладываются в 2,5 с — естественная длительность (~5 с) сжимается одним множителем времени
  crk.lastT = Math.max(...crk.slabs.map(s => s.td)) + .4; crk.sp = Math.max(1, (crk.lastT + .6)/CRACK_DUR);
  const [fx_, fy_] = toScr(O[0], O[1]); ptr.tx = fx_; ptr.ty = fy_; hover(-1, -1);
  return true;
}
function closePano(){
  if (!crk){ crk = { mode: "slab", t: 99, back: .0001, O: [.62, (cur + .5)*AR], slabs: [], region: [0, 0, 1, 1] }; }
  else if (crk.back) return;
  crk.back = .0001; panoOn = false; trickles.length = 0;
}

// ---- плиты в 3D ----
// камера перед стеной; z — к зрителю. Плита: лицевой многоугольник на стене + толщина в глубину.
function project(x, y, z){ const D = Math.max(W, H)*1.25, f = D/Math.max(40, D - z); return [W/2 + (x - W/2)*f, H/2 + (y - H/2)*f]; }
function slabMesh(s, tau, out){
  const n = s.poly.length;
  // точки на экране в момент отрыва (z = 0 — лицевая грань стены)
  const P = s.poly.map(p => toScr(p[0], p[1]));
  const by = Math.max(...P.map(p => p[1])), px = P.reduce((a, p) => a + p[0], 0)/n, py = P.reduce((a, p) => a + p[1], 0)/n;
  const th = s.th*S;
  let th0 = 0, jit = 0;
  th0 = s.slide ? .25*s.alpha*tau*tau*.25 : .5*s.alpha*tau*tau;
  const free = Math.max(0, tau - (s.slide ? .05 : .32));
  const dy = .5*4200*free*free, dz = s.vz*free + (tau > 0 ? 30*tau : 0), dx = s.vx*free;
  const roll = s.roll*free;
  const cr = Math.cos(roll), sr = Math.sin(roll), ct = Math.cos(th0), st = Math.sin(th0);
  const jx = (Math.random() - .5)*jit, jy = (Math.random() - .5)*jit;
  const T = (x, y, z) => {                                   // поворот вокруг нижней кромки, затем крен и падение
    let yy = y - by, zz = z; const y2 = yy*ct + zz*st, z2 = -yy*st + zz*ct; yy = y2; zz = z2;   // верх плиты уходит к зрителю
    let xx = x - px, yy2 = yy + by - py; const x3 = xx*cr - yy2*sr, y3 = xx*sr + yy2*cr;
    return [x3 + px + dx + jx, y3 + py + dy + jy, zz + dz]; };
  const F = P.map(p => T(p[0], p[1], 0)), B = P.map(p => T(p[0], p[1], -th));
  const uvs = s.poly.map(p => [p[0], p[1]/AR - s.layer]);
  const lamp = [ptr.x, ptr.y, Math.max(W, H)*.24], R = .5*Math.max(W, H);
  const cam = [W/2, H/2, Math.max(W, H)*1.25];
  const shade = (A, Bv, C) => {                              // освещение грани фонарём + свет из пролома
    const u = [Bv[0] - A[0], Bv[1] - A[1], Bv[2] - A[2]], v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    let nx = u[1]*v[2] - u[2]*v[1], ny = u[2]*v[0] - u[0]*v[2], nz = u[0]*v[1] - u[1]*v[0]; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const c = [(A[0] + Bv[0] + C[0])/3, (A[1] + Bv[1] + C[1])/3, (A[2] + Bv[2] + C[2])/3];
    const vis = (cam[0] - c[0])*nx + (cam[1] - c[1])*ny + (cam[2] - c[2])*nz;
    if (vis < 0){ nx = -nx; ny = -ny; nz = -nz; }
    let lx = lamp[0] - c[0], ly = lamp[1] - c[1], lz = lamp[2] - c[2]; const ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;
    const dxy = Math.hypot(lamp[0] - c[0], lamp[1] - c[1]);
    const att = Math.pow(Math.max(0, 1 - dxy/(R*1.15)), 1.7)/(1 + ll*ll/(R*R*.55));
    const diff = Math.max(0, nx*lx + ny*ly + nz*lz);
    return { k: .05 + diff*att*1.7 + (crk ? crk.open : 0)*.16*(.5 + .5*Math.max(0, -ny)), vis };
  };
  const tri = (a, b, c, ta, tb, tc, k, side) => { const A = project(...a), Bp = project(...b), C = project(...c);
    out.push(A[0], A[1], ta[0], ta[1], k, side, Bp[0], Bp[1], tb[0], tb[1], k, side, C[0], C[1], tc[0], tc[1], k, side); };
  const fc = F.reduce((a, p) => [a[0] + p[0]/n, a[1] + p[1]/n, a[2] + p[2]/n], [0, 0, 0]);
  const bc = B.reduce((a, p) => [a[0] + p[0]/n, a[1] + p[1]/n, a[2] + p[2]/n], [0, 0, 0]);
  const tcen = uvs.reduce((a, p) => [a[0] + p[0]/n, a[1] + p[1]/n], [0, 0]);
  const faces = [];
  // боковые грани — свежий скол, текстура сдвинута вглубь слоя
  const dv = s.th/AR;
  for (let i = 0; i < n; i++){ const j = (i + 1) % n, sh = shade(F[i], F[j], B[j]);
    const zc = (F[i][2] + F[j][2] + B[i][2] + B[j][2])/4;
    faces.push({ z: zc, draw: o => { tri(F[i], F[j], B[j], uvs[i], uvs[j], [uvs[j][0], uvs[j][1] + dv], sh.k*.8, 1); tri(F[i], B[j], B[i], uvs[i], [uvs[j][0], uvs[j][1] + dv], [uvs[i][0], uvs[i][1] + dv], sh.k*.8, 1); } }); }
  const shF = shade(F[0], F[1], F[2]), shB = shade(B[0], B[2], B[1]);
  faces.push({ z: bc[2], draw: () => { for (let i = 0; i < n; i++){ const j = (i + 1) % n; tri(bc, B[i], B[j], tcen, uvs[i], uvs[j], shB.k*.7, 1); } } });
  faces.push({ z: fc[2], draw: () => { for (let i = 0; i < n; i++){ const j = (i + 1) % n; tri(fc, F[i], F[j], tcen, uvs[i], uvs[j], shF.k, 0); } } });
  faces.sort((a, b) => a.z - b.z).forEach(f => f.draw());
  return { y: Math.min(...F.map(p => project(...p)[1])), z: fc[2], sx: px + dx, sy: by + dy };
}
function drawSlabs(list){
  // дальние — первыми
  list.sort((a, b) => (a.zs || 0) - (b.zs || 0));
  gl.useProgram(P2); gl.uniform2f(U2.uRes, W, H);
  const aP = gl.getAttribLocation(P2, "aP"), aT = gl.getAttribLocation(P2, "aT"), aK = gl.getAttribLocation(P2, "aK"), aS = gl.getAttribLocation(P2, "aSide");
  gl.bindBuffer(gl.ARRAY_BUFFER, slabBuf);
  [aP, aT, aK, aS].forEach(a => gl.enableVertexAttribArray(a));
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(aT, 2, gl.FLOAT, false, 24, 8);
  gl.vertexAttribPointer(aK, 1, gl.FLOAT, false, 24, 16); gl.vertexAttribPointer(aS, 1, gl.FLOAT, false, 24, 20);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, black); gl.uniform1i(U2.uF, 1);
  gl.uniform4f(U2.uFos, -10, 0, 0, 1); gl.uniform1f(U2.uFosHa, .5);
  for (const s of list){
    const d = []; const r = slabMesh(s, crk.t - s.td, d); s.zs = r.z; s.out = r.y > H + 40 || r.z > Math.max(W, H)*1.25*.8;
    if (s.out) continue;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.DYNAMIC_DRAW);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, TX[L[s.layer].id]); gl.uniform1i(U2.uTex, 0);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, TX[L[s.layer].id + "_h"]); gl.uniform1i(U2.uHt, 2);
    gl.uniform1f(U2.uHasF, 0);
    gl.drawArrays(gl.TRIANGLES, 0, d.length/6);
  }
  [aP, aT, aK, aS].forEach(a => gl.disableVertexAttribArray(a));
}

// ---- ввод: координаты в главе; колесо и стрелки обрабатывает сама глава ----
const rel = e => { const r = box.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
const onUI = e => e.target && e.target.closest && e.target.closest(".time-in,.bio-col,button,a,input,.bio-fold");
box.addEventListener("pointermove", e => { if (!active) return; const [x, y] = rel(e); ptr.tx = x; ptr.ty = y; ptr.seen = true; ptr.lastMove = performance.now(); hover(onUI(e) ? -1 : x, y); });
box.addEventListener("pointerdown", e => { if (!active || onUI(e)) return; const [x, y] = rel(e); ptr.tx = x; ptr.ty = y; ptr.seen = true; ptr.lastMove = performance.now();
  if (onFossil(x, y) && cb.fossil){ e.stopPropagation(); cb.fossil(); } }, true);
addEventListener("resize", () => { if (active) size(); });
function onFossil(x, y){
  if (crk) return false; const r = fosScreen(); if (!r) return false;
  const dx = (x - r.x)/(r.w*.5), dy = (y - r.y)/(r.h*.5); return dx*dx + dy*dy < .8;
}
const hov = document.createElement("div"); hov.className = "bio-strata-hov"; box.insertBefore(hov, before);
function hover(x, y){
  const on = x >= 0 && onFossil(x, y);
  box.classList.toggle("bio-strata-pt", on);
  if (on){ const E = L[cur]; hov.innerHTML = `<b>${E.fos.nm}</b> · ${E.fos.what}<br>нажмите, чтобы оживить`; hov.style.left = x + "px"; hov.style.top = y + "px"; }
  hov.style.opacity = on ? 1 : 0;
}

// ---- метки на стене ----
const pins = document.createElement("div"); pins.className = "bio-strata-pins"; box.insertBefore(pins, before);
function drawPins(){
  let html = "";
  if (!crk && active) L.forEach((E, k) => {
    if (E.pin){ const y = (k + E.pin.v - scroll)*S*AR; if (y > 20 && y < H - 20) html += `<div class="pin" style="top:${y - 7}px">${E.pin.t}</div>`; }
    if (GAPS[k]){ const y = (k - scroll)*S*AR; if (y > 30 && y < (W < 720 ? H*.55 : H - 30)) html += `<div class="gap" style="top:${y + 8}px">↓ ${GAPS[k]}</div>`; }
  });
  if (html !== pins._h){ pins.innerHTML = html; pins._h = html; }
}

// ---- пыль и крошка: мягкие клубы (готовые спрайты), песчинки ----
const puffSpr = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  // клуб из нескольких смещённых пятен — не ровный круг
  for (let i = 0; i < 9; i++){ const x = 64 + (Math.random() - .5)*46, y = 64 + (Math.random() - .5)*46, r = 22 + Math.random()*26;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.22)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  return c; })();
function tinted(rgb){ const k = rgb.join(","); if (tinted[k]) return tinted[k]; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  g.drawImage(puffSpr, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = `rgb(${k})`; g.fillRect(0, 0, 128, 128); return tinted[k] = c; }
const debris = [], trickles = [];
function emitDust(x, y, w, rgb, n, chips){
  if (puffs.length > 160) n = Math.min(n, 1); if (grains.length > 900) return;
  for (let i = 0; i < n; i++) puffs.push({ x: x + (Math.random() - .5)*w, y: y + (Math.random() - .5)*w*.3, vx: (Math.random() - .5)*50, vy: 6 + Math.random()*30, r: 12 + Math.random()*22, gr: 16 + Math.random()*34, a: .55 + Math.random()*.45, life: 1, rgb, rot: Math.random()*6 });
  for (let i = 0; i < n*6; i++) grains.push({ x: x + (Math.random() - .5)*w, y: y + (Math.random() - .5)*8, vx: (Math.random() - .5)*110, vy: -Math.random()*80, r: .7 + Math.random()*1.8, rgb, life: 1 });
  for (let i = 0; i < (chips || 0); i++){ const sz = 2 + Math.random()*6, nv = 4 + (Math.random()*2 | 0), sh = [];
    for (let k = 0; k < nv; k++){ const a = k/nv*6.283 + Math.random()*.8, r = sz*(.5 + Math.random()*.6); sh.push([Math.cos(a)*r, Math.sin(a)*r*(.5 + Math.random()*.6)]); }
    if (debris.length < 320) debris.push({ x: x + (Math.random() - .5)*w, y: y - Math.random()*12, vx: (Math.random() - .5)*160, vy: -40 - Math.random()*140, rot: Math.random()*6, vr: (Math.random() - .5)*14, sh, rgb, k: .7 + Math.random()*.5, life: 1 }); }
}
for (let i = 0; i < 46; i++) motes.push({ x: Math.random(), y: Math.random(), r: .5 + Math.random()*1.2, ph: Math.random()*7 });
let crumbAt = 0;
function effects(dt, now){
  c2.setTransform(DPR, 0, 0, DPR, 0, 0); c2.clearRect(0, 0, W, H);
  const R = .5*Math.max(W, H), open = crk ? crk.open : 0;
  // после падения последней плиты пыль и осыпь затухают быстрее и через 2 с исчезают
  const after = crk && crk.lastT != null ? crk.t - crk.lastT : -1;
  const fade = after > 0 ? 1 + after*2 : 1;
  if (after > 2){ puffs.length = 0; grains.length = 0; debris.length = 0; trickles.length = 0; }
  // клубы пыли: медленно растут и оседают; освещены фонарём и светом из пролома
  for (let i = puffs.length - 1; i >= 0; i--){ const p = puffs[i]; p.life -= dt*.62*fade; if (p.life <= 0){ puffs.splice(i, 1); continue; }
    p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= .98; p.vy *= .985; p.r += p.gr*dt;
    const lit = Math.min(1, .2 + Math.max(0, 1 - Math.hypot(p.x - ptr.x, p.y - ptr.y)/(R*.9)) + open*.35);
    c2.globalAlpha = Math.min(1, p.a*Math.pow(p.life, .8)*lit*.8); const s = p.r*2.4;
    c2.save(); c2.translate(p.x, p.y); c2.rotate(p.rot); c2.drawImage(tinted(p.rgb), -s/2, -s/2, s, s); c2.restore(); }
  c2.globalAlpha = 1;
  // песчинки
  for (let i = grains.length - 1; i >= 0; i--){ const g = grains[i]; g.vy += 1600*dt; g.x += g.vx*dt; g.y += g.vy*dt; g.life -= dt*1.1*fade;
    if (g.y > H + 10 || g.life <= 0){ grains.splice(i, 1); continue; }
    const lit = Math.min(1, .3 + Math.max(0, 1 - Math.hypot(g.x - ptr.x, g.y - ptr.y)/(R*.7)) + open*.6);
    c2.fillStyle = `rgba(${g.rgb.map(v => Math.min(255, v*(.5 + lit*.9)) | 0).join(",")},${g.life})`; c2.fillRect(g.x, g.y, g.r, g.r*1.6); }
  // обломки: мелкие острые кусочки той же породы, кувыркаются
  for (let i = debris.length - 1; i >= 0; i--){ const d = debris[i]; d.vy += 2600*dt; d.x += d.vx*dt; d.y += d.vy*dt; d.rot += d.vr*dt;
    if (d.y > H + 20){ debris.splice(i, 1); continue; }
    const lit = Math.min(1.3, .25 + Math.max(0, 1 - Math.hypot(d.x - ptr.x, d.y - ptr.y)/(R*.8))*1.1 + open*.55)*d.k*(.75 + .25*Math.cos(d.rot*1.7));
    c2.fillStyle = `rgb(${d.rgb.map(v => Math.min(255, v*lit) | 0).join(",")})`;
    c2.beginPath(); const cr = Math.cos(d.rot), sr = Math.sin(d.rot); d.sh.forEach(([x, y], k) => { const X = d.x + x*cr - y*sr, Y = d.y + x*sr + y*cr; k ? c2.lineTo(X, Y) : c2.moveTo(X, Y); }); c2.closePath(); c2.fill(); }
  // ручейки песка с обломанных кромок
  for (let i = trickles.length - 1; i >= 0; i--){ const t = trickles[i]; t.t += dt*fade; if (t.t > t.dur){ trickles.splice(i, 1); continue; }
    const rate = 70*(1 - t.t/t.dur)*dt, n = (rate | 0) + (Math.random() < rate % 1 ? 1 : 0);
    for (let k = 0; k < n; k++) grains.push({ x: t.x0 + Math.random()*(t.x1 - t.x0), y: t.y + Math.random()*3, vx: (Math.random() - .5)*14, vy: Math.random()*30, r: .6 + Math.random()*1.3, rgb: t.rgb, life: 1 });
    if (Math.random() < dt*2.5) puffs.push({ x: t.x0 + Math.random()*(t.x1 - t.x0), y: t.y + 10, vx: (Math.random() - .5)*20, vy: 15, r: 8, gr: 22, a: .4, life: 1, rgb: t.rgb, rot: Math.random()*6 }); }
  // пыль в луче фонаря (только в темноте камня)
  if (!panoOn) for (const d of motes){
    d.x += (Math.sin(now*.0002 + d.ph)*.00006 + .00002)*dt*60; d.y += (Math.cos(now*.00017 + d.ph*1.3)*.00005 + .00003)*dt*60;
    if (d.x > 1) d.x -= 1; if (d.y > 1) d.y -= 1; if (d.x < 0) d.x += 1;
    const X = d.x*W, Y = d.y*H, a = Math.max(0, 1 - Math.hypot(X - ptr.x, Y - ptr.y)/(R*.55))**2*.45*(1 - open);
    if (a > .01){ c2.fillStyle = `rgba(255,236,200,${a})`; c2.beginPath(); c2.arc(X, Y, d.r, 0, 7); c2.fill(); } }
  // крошка из-под фонаря, если он задержался
  const still = ptr.seen && now - ptr.lastMove > 1400 && now - ptr.lastMove < 4000 && !crk;
  if (still && now - crumbAt > 140){ crumbAt = now; crumbs.push({ x: ptr.x + (Math.random() - .5)*60, y: ptr.y - 10 + (Math.random() - .5)*30, vy: 0, vx: (Math.random() - .5)*12, r: .8 + Math.random()*1.8, rgb: L[cur].grain, life: 1 }); }
  for (let i = crumbs.length - 1; i >= 0; i--){ const g = crumbs[i]; g.vy += 900*dt; g.x += g.vx*dt; g.y += g.vy*dt; g.life -= dt*.6;
    if (g.y > H + 10 || g.life <= 0){ crumbs.splice(i, 1); continue; }
    const lit = Math.max(.15, 1 - Math.hypot(g.x - ptr.x, g.y - ptr.y)/(R*.6));
    c2.fillStyle = `rgba(${g.rgb.join(",")},${g.life*lit})`; c2.fillRect(g.x, g.y, g.r, g.r); }
}

// ---- кадр ----
let TX = {}, TXT = {}, fosHa = .5, last = performance.now(), t0 = performance.now();
const ease = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
function frame(now){
  const dt = Math.min(.05, (now - last)/1000); last = now; const T = (now - t0)/1000;
  if (sT < 1){ sT = Math.min(1, sT + dt/(reduce ? .2 : sDur)); scroll = sFrom + (sTo - sFrom)*ease(sT); } else scroll = sTo;
  const idle = !ptr.seen || now - ptr.lastMove > 6000;
  if (idle && !crk){ ptr.tx = W*(.58 + .2*Math.sin(T*.23)); ptr.ty = H*(.48 + .22*Math.sin(T*.31 + 1)); }
  const k = 1 - Math.exp(-dt*(idle ? 1.2 : 9)); ptr.x += (ptr.tx - ptr.x)*k; ptr.y += (ptr.ty - ptr.y)*k;
  if (!crk){ const ox = (S - W)*(.5 + .5*((ptr.x/W)*2 - 1)*.8); offX += (ox - offX)*(1 - Math.exp(-dt*1.5)); }   // во время раскола стена неподвижна
  if (crk && !dbgPause) step(dt);
  if (!active){ raf = 0; return; }
  const pk = 1 - Math.exp(-dt*2); panX += ((ptr.x/W)*2 - 1 - panX)*pk; panY += ((ptr.y/H)*2 - 1 - panY)*pk;
  render();
  effects(dt*(crk && !crk.back ? Math.max(crk.sp || 1, 1) : 1), now);
  drawPins();
  raf = requestAnimationFrame(frame);
}
function step(dt){
  const c = crk, sp = Math.max(c.sp || 1, reduce ? 2.5 : 1);
  if (c.back){                                       // назад в камень: камень проступает поверх картины
    c.back = Math.min(1, c.back + dt/2.4);
    if (c.back >= 1){ crk = null; if (cb.closed) cb.closed(); }
    return;
  }
  c.t += dt*sp;
  if (c.mode === "slab"){
    let changed = false, gone = 0;
    for (const s of c.slabs){
      if (!s.crk && c.t > s.td - (s.soft ? .35 : .6)){ s.crk = 1; changed = true; }
      if (s.crk && s.crk < 255){ s.crk = Math.min(255, s.crk + dt*sp*600); stData[s.id*4 + 1] = s.crk | 0; changed = true; }   // трещина проступает
      if (!s.state && c.t > s.td){ s.state = 1; stData[s.id*4] = 255; changed = true; }      // плита отделилась
      if (s.state === 1 && c.t > s.td + .12){ s.state = 2; const [x, y] = toScr(s.cx, s.cy); const P = s.poly.map(p => toScr(p[0], p[1]));
        const xs = P.map(p => p[0]), ys = P.map(p => p[1]), w = Math.max(...xs) - Math.min(...xs), dk = L[s.layer].dust || 1;
        const area = w*(Math.max(...ys) - Math.min(...ys))/(W*H), n = Math.min(4, Math.round((s.soft ? .4 : 1.6)*dk*(.5 + Math.random()) + area*120));
        emitDust(x, Math.max(...ys), w, L[s.layer].grain, n, s.soft ? 1 + (Math.random()*3 | 0) : 3 + (Math.random()*5 | 0));
        emitDust(x, Math.min(...ys), w, L[s.layer].grain, Math.round(n*.5), 0);
        // из обнажившейся кромки над плитой ещё сыплется песок
        trickles.push({ x0: Math.min(...xs), x1: Math.max(...xs), y: Math.min(...ys), t: 0, dur: .5 + Math.random()*.6, rgb: s.rgb || L[s.layer].grain }); }
      if (s.state) gone++;
    }
    if (changed){ gl.bindTexture(gl.TEXTURE_2D, stTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NSL, 1, gl.RGBA, gl.UNSIGNED_BYTE, stData); }
    c.open = gone/Math.max(1, c.slabs.length);
    const lastT = c.lastT != null ? c.lastT : (c.lastT = Math.max(...c.slabs.map(s => s.td)) + .4);   // +0,4 с — плита долетает до края экрана
    if (!panoOn && c.t > lastT + .6){ panoOn = true; if (cb.opened) cb.opened(); }
  } else {
    c.open = Math.min(1, Math.max(0, (c.t - .6)/5.2));
    // песок с кромки: точки на примерной окружности фронта
    const thr = .05 + 1.4*Math.pow(c.t/6, 1.1), rf = thr - .4;
    if (rf > 0 && c.t < 6.2){ const n = 6; for (let i = 0; i < n; i++){ const a = Math.random()*6.283, r = rf + (Math.random() - .5)*.05;
      const [x, y] = toScr(c.O[0] + Math.cos(a)*r, c.O[1] + Math.sin(a)*r);
      if (x > -20 && x < W + 20 && y > -20 && y < H + 20){ grains.push({ x, y, vx: (Math.random() - .5)*30, vy: Math.random()*20, r: .7 + Math.random()*1.6, rgb: L[cur].grain, life: 1 });
        if (Math.random() < .08) emitDust(x, y, 10, L[cur].grain, 1); } } }
    if (!panoOn && c.t > 6.3){ panoOn = true; if (cb.opened) cb.opened(); }
  }
}
function render(){
  gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(P1);
  const base = Math.max(0, Math.min(L.length - 1, Math.floor(scroll - .05)));
  for (let j = 0; j < 3; j++){
    const E = L[base + j];
    gl.activeTexture(gl.TEXTURE0 + j); gl.bindTexture(gl.TEXTURE_2D, E ? (TX[E.id] || TXT[E.id] || black) : black); gl.uniform1i(U1["uC" + j], j);   // пока не загружен — миниатюра
    gl.activeTexture(gl.TEXTURE3 + j); gl.bindTexture(gl.TEXTURE_2D, E && TX[E.id + "_h"] ? TX[E.id + "_h"] : black); gl.uniform1i(U1["uH" + j], 3 + j);
  }
  gl.uniform3f(U1.uGl, ...[0, 1, 2].map(j => L[base + j] ? L[base + j].gloss : 0));
  gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, black); gl.uniform1i(U1.uF, 6);
  gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, black); gl.uniform1i(U1.uP, 7);
  gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, idTex); gl.uniform1i(U1.uId, 8);
  gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, stTex); gl.uniform1i(U1.uSt, 9);
  gl.uniform2f(U1.uRes, cv.width, cv.height);
  gl.uniform1f(U1.uS, S*DPR); gl.uniform1f(U1.uOffX, offX*DPR); gl.uniform1f(U1.uScroll, scroll); gl.uniform1f(U1.uBase, base); gl.uniform1f(U1.uN, L.length);
  gl.uniform1f(U1.uHs, S*DPR*.016); gl.uniform1f(U1.uDay, 1); gl.uniform1f(U1.uDpr, DPR);
  gl.uniform3f(U1.uLight, ptr.x*DPR, ptr.y*DPR, Math.max(W, H)*.24*DPR);
  gl.uniform4f(U1.uFos, -10, 0, 0, 1); gl.uniform1f(U1.uFosHa, .5);
  const c = crk;
  gl.uniform1f(U1.uMode, c ? (c.mode === "slab" ? 1 : 2) : 0); gl.uniform1f(U1.uT, c ? c.t : 0);
  gl.uniform1f(U1.uBack, c ? c.back : 0); gl.uniform1f(U1.uAll, c && panoOn && !c.back ? 1 : 0); gl.uniform1f(U1.uOpen, c ? (c.open || 0)*(1 - c.back) : 0);
  gl.uniform2f(U1.uO, c ? c.O[0] : 0, c ? c.O[1] : 0); gl.uniform4f(U1.uReg, ...(c ? c.region : [0, 0, 1, 1]));
  // панорама: по высоте экрана с запасом, сдвиг за курсором; пока проём мал — чуть крупнее (как будто дальше)
  const zoom = 1 + .1*(1 - (c ? (c.open || 0) : 0));
  const ph = H*1.12*zoom, pw = Math.max(ph*PA, W*1.1), ph2 = pw/PA;
  const px0 = (W - pw)/2 - panX*(pw - W)/2, py0 = (H - ph2)/2 - panY*(ph2 - H)/2;
  gl.uniform4f(U1.uPan, px0*DPR, py0*DPR, pw*DPR, ph2*DPR); gl.uniform2f(U1.uPar, panX, panY);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad); const ap = gl.getAttribLocation(P1, "p"); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(ap);
  if (c && c.mode === "slab" && !c.back){ const act = c.slabs.filter(s => s.state && !s.out); if (act.length) drawSlabs(act); }
}

// ---- загрузка и связь с главой ----
let active = false, raf = 0;
size();
L.forEach(E => loadImg(`${BASE}th/${E.id}.webp`).then(i => { TXT[E.id] = tex(i); }));
function show(v){
  if (v === active) return;
  active = v; cv.style.display = fx.style.display = v ? "" : "none"; if (!v){ hov.style.opacity = 0; pins.innerHTML = pins._h = ""; box.classList.remove("bio-strata-pt"); }
  if (v){ size(); ensure(Math.max(0, cur)); last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }   // v143: при входе сразу грузим текущий пласт (раньше — только после прокрутки, и стена оставалась мутной миниатюрой)
}
cv.style.display = fx.style.display = "none";
return {
  cb, show, go,                                       // go(k): k — номер пласта сверху (0 — наше время), −1 — поверхность
  revive: () => breakRock(), back: () => closePano(),
  get active(){ return active; },
  get busy(){ return !!crk && (!panoOn || crk.back > 0); },
  get left(){ if (!crk || crk.back || panoOn || crk.lastT == null) return 0; return Math.max(0, (crk.lastT + .6 - crk.t)/Math.max(crk.sp || 1, reduce ? 2.5 : 1)); },   // v147: сколько секунд осталось до конца раскола   // раскол идёт или камень возвращается
  get open(){ return panoOn; },
  covers: () => active && !crk,                       // стена закрывает всю сцену — её можно не рисовать
  hasFossil: k => !!(L[k] && L[k].fos),
  dbg: { st: () => ({ cur, scroll, t: crk && crk.t, panoOn, active }), pause: v => { dbgPause = v; }, light: (x, y) => { ptr.tx = ptr.x = x; ptr.ty = ptr.y = y; ptr.seen = true; ptr.lastMove = performance.now(); },
    adv: sec => { let k = 0; for (let t = 0; t < sec; t += .033){ if (crk) step(.033); if (++k % 4 === 0) effects(.132, performance.now()); } } }
};
}
return { init(box, base){ if (API === null) API = boot(box, base || "strata/") || false; return API || null; } };
})();

