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
