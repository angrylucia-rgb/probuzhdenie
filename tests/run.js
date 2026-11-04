#!/usr/bin/env node
// Автотесты «Космолябии» — проверяют собранный сайт (dist/) в настоящем браузере (Playwright, Chromium).
//   node tests/run.js                 — все тесты
//   node tests/run.js smoke nav-hash  — выбранные (по началу имени)
// Переменные: DIST — папка сборки (по умолчанию ../dist рядом с tests/), PORT — порт сервера (8790).
// Перед каждым пушем: собрать dist (DIST=… python3 build3.py) и прогнать тесты. Любой FAIL — повод не пушить.
// Графика в тестах программная (SwiftShader): медленно, но одинаково на любой машине.
const { chromium, devices } = require('playwright');
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), crypto = require('crypto'), http = require('http');
const DIST = path.resolve(process.env.DIST || path.join(__dirname, '..', 'dist'));
const PORT = +(process.env.PORT || 8790), B = `http://127.0.0.1:${PORT}`;
const ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'];
const T = []; const test = (name, fn) => T.push({ name, fn });
const ok = (c, msg) => { if (!c) throw new Error(msg); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;

// страница с принятыми условиями и без подсказки о языке; собирает ошибки, нарушения CSP и ответы 4xx/5xx
async function page(opt = {}){
  const ctx = await browser.newContext(opt.device ? { ...devices[opt.device] } : { viewport: { width: 1200, height: 800 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('cosmo-terms', '1.0'); localStorage.setItem('cosmo-lang', 'x'); } catch(e){} });
  const p = await ctx.newPage(); p.errs = []; p.csp = []; p.fails = []; p.refimg = 0;
  p.on('pageerror', e => p.errs.push(e.message));
  p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) p.csp.push(m.text().slice(0, 200)); });
  p.on('response', r => { if (r.status() >= 400) p.fails.push(r.status() + ' ' + r.url()); if (/\/refimg\//.test(r.url()) && r.status() === 200) p.refimg++; });
  p.done = () => ctx.close();
  return p;
}
const ready = p => p.waitForFunction(() => document.getElementById('loader').classList.contains('done'), null, { timeout: 90000 });
const clean = p => { ok(!p.errs.length, 'ошибки JS: ' + p.errs.slice(0, 3).join(' | ')); ok(!p.csp.length, 'нарушения CSP: ' + p.csp.slice(0, 2).join(' | ')); ok(!p.fails.length, 'ответы с ошибкой: ' + p.fails.slice(0, 4).join(', ')); };
const st = p => p.evaluate(() => ({ h: location.hash, path: location.pathname,
  open: ['chHuman', 'chBio', 'chDims', 'chTime', 'chTree', 'chThought', 'chRef', 'chPath', 'chFly', 'chAtl'].filter(id => { const e = document.getElementById(id); return e && e.classList.contains('open'); }) }));
// ждать, пока условие на состоянии не выполнится (графика программная — сцены грузятся по-разному)
async function until(p, f, ms = 30000){ const t0 = Date.now(); let s; while (Date.now() - t0 < ms){ s = await st(p); if (f(s)) return s; await sleep(500); } return s; }

/* ---------- без браузера: файлы сборки ---------- */
test('assets', async () => {
  for (const f of ['index.html', 'en/index.html', 'legal/index.html', 'en/legal/index.html', 'robots.txt', 'sitemap.xml', 'vercel.json', 'data/bio.json']) ok(fs.existsSync(path.join(DIST, f)), 'нет файла ' + f);
  for (const f of ['index.html', 'en/index.html']){
    const s = fs.readFileSync(path.join(DIST, f), 'utf8'); let n = 0; const miss = [];
    for (const m of s.matchAll(/(["'])v\/[0-9a-f]{10}\/([^"'?#\s]+)\1/g)){ if (/\$\{|\+/.test(m[2])) continue; n++; if (!fs.existsSync(path.join(DIST, m[2]))) miss.push(m[2]); }
    ok(n > 100, f + ': мало адресов ресурсов (' + n + ')'); ok(!miss.length, f + ': нет файлов ' + miss.slice(0, 5).join(', '));
    // хеш встроенного скрипта в CSP совпадает со скриптом — иначе браузер его не запустит
    const sc = s.match(/<script>([\s\S]*?)<\/script>/), csp = s.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
    ok(sc && csp, f + ': нет скрипта или CSP');
    ok(csp[1].includes("'sha256-" + crypto.createHash('sha256').update(sc[1], 'utf8').digest('base64') + "'"), f + ': хеш скрипта не совпадает с CSP');
  }
  const L = fs.readFileSync(path.join(DIST, 'legal/index.html'), 'utf8'); ok(!/<script/i.test(L), 'на /legal/ есть скрипт');
});

/* ---------- загрузка: RU и EN ---------- */
for (const [name, url] of [['smoke-ru', '/'], ['smoke-en', '/en/']]) test(name, async () => {
  const p = await page(); const t0 = Date.now();
  await p.goto(B + url, { waitUntil: 'load', timeout: 120000 }); await ready(p); await sleep(4000);
  const lang = await p.evaluate(() => document.documentElement.lang); ok(lang === (url === '/' ? 'ru' : 'en'), 'язык страницы ' + lang);
  ok(p.refimg >= 10, 'текстуры станции «Человек» не загрузились (' + p.refimg + ')');
  clean(p); await p.done(); return 'загрузка ' + ((Date.now() - t0)/1000).toFixed(1) + ' с';
});

/* ---------- адреса мест (#/…) и «Назад» браузера ---------- */
test('nav-hash', async () => {
  const p = await page();
  await p.goto(B + '/#/j/earth/4'); await ready(p);
  let s = await until(p, s => s.open.includes('chHuman')); ok(s.open.includes('chHuman') && s.h === '#/j/earth/4', 'прямая ссылка на слой: ' + JSON.stringify(s));
  await p.evaluate(() => { location.hash = '#/bio?bm=2'; }); s = await until(p, s => s.open.includes('chBio')); ok(s.open.includes('chBio') && !s.open.includes('chHuman'), 'биом по адресу: ' + JSON.stringify(s));
  await p.goBack(); s = await until(p, s => s.open.includes('chHuman')); ok(s.open.includes('chHuman') && s.h === '#/j/earth/4', '«Назад» браузера: ' + JSON.stringify(s));
  await p.goForward(); s = await until(p, s => s.open.includes('chBio')); ok(s.open.includes('chBio'), '«Вперёд» браузера: ' + JSON.stringify(s));
  // смена слоя колесом — замена записи истории, а не новая
  await p.evaluate(() => { location.hash = '#/j/earth/3'; }); s = await until(p, s => s.open.includes('chHuman') && s.h === '#/j/earth/3');
  const n0 = await p.evaluate(() => history.length); await p.mouse.move(600, 400);
  for (let i = 0; i < 2; i++){ await p.mouse.wheel(0, 400); await sleep(600); }
  s = await until(p, s => s.h !== '#/j/earth/3', 8000); const n1 = await p.evaluate(() => history.length);
  ok(/^#\/j\/earth\/[45]$/.test(s.h) && n1 === n0, 'листание слоёв: ' + s.h + ', записей ' + n0 + '→' + n1);
  // мусорный адрес стирается, ошибок нет
  for (const bad of ['#/j/__proto__/1', '#/j/earth/999', '#/xx/1', '#/bio?e=constructor']){ await p.evaluate(h => { location.hash = h; }, bad); await sleep(1200); s = await st(p); ok(s.h === '', 'адрес ' + bad + ' не стёрт: ' + s.h); }
  clean(p); await p.done();
  // EN: путь /en/ сохраняется (на странице <base href="/">)
  const q = await page(); await q.goto(B + '/en/#/dm/3'); await ready(q);
  s = await until(q, s => s.open.includes('chDims')); ok(s.open.includes('chDims') && s.path === '/en/' && s.h === '#/dm/3', 'EN по адресу: ' + JSON.stringify(s));
  await q.evaluate(() => document.getElementById('dmClose').click()); s = await until(q, s => !s.open.length && s.h === '', 15000);
  ok(s.path === '/en/' && s.h === '', 'EN после закрытия: ' + JSON.stringify(s));
  clean(q); await q.done();
});

/* ---------- меню: списки слоёв станций ---------- */
test('menu-layers', async () => {
  const p = await page(); await p.goto(B + '/'); await ready(p); await sleep(1500);
  await p.evaluate(() => document.getElementById('menuBtn').click()); await sleep(1200);
  const n = await p.evaluate(() => document.querySelectorAll('.mp-lvt').length); ok(n >= 8, 'кнопок «слои» ' + n);
  await p.evaluate(() => document.querySelector('.mp-st[data-i="5"] .mp-lvt').click()); await sleep(600);
  const lv = await p.evaluate(() => document.querySelectorAll('.mp-st[data-i="5"] .mp-lvb').length); ok(lv >= 7, 'слоёв Земли в меню ' + lv);
  await p.evaluate(() => document.querySelectorAll('.mp-st[data-i="5"] .mp-lvb')[3].click());
  const s = await until(p, s => s.open.includes('chHuman') && /^#\/j\/earth\//.test(s.h)); ok(s.open.includes('chHuman') && s.h === '#/j/earth/3', 'переход к слою: ' + JSON.stringify(s));
  ok(await p.evaluate(() => !!document.getElementById('mpShare')), 'нет кнопки «Ссылка на это место»');
  clean(p); await p.done();
});

/* ---------- «Назад» в главе возвращает туда, откуда пришли ---------- */
test('chapter-back', async () => {
  const p = await page(); await p.goto(B + '/#/j/abs/0'); await ready(p); await until(p, s => s.open.includes('chHuman'));
  let d = -1;
  for (let i = 0; i < 8 && d < 0; i++){ await p.evaluate(i => { location.hash = '#/j/abs/' + i; }, i); await sleep(1500); if (await p.evaluate(() => !!document.querySelector('#chHuman.open button[data-dims]'))) d = i; }
  ok(d >= 0, 'на слоях Абсолюта нет кнопки «Лестница измерений»');
  await p.evaluate(() => document.querySelector('#chHuman.open button[data-dims]').click());
  let s = await until(p, s => s.open.includes('chDims')); ok(s.open.includes('chDims'), 'Лестница не открылась');
  const lbl = await p.evaluate(() => document.getElementById('dmClose').textContent); ok(/←/.test(lbl), 'кнопка главы: ' + lbl);
  await p.evaluate(() => document.getElementById('dmClose').click());
  s = await until(p, s => s.open.includes('chHuman')); ok(s.open.includes('chHuman') && s.h === '#/j/abs/' + d, '«Назад» из главы: ' + JSON.stringify(s));
  clean(p); await p.done();
});

/* ---------- полёт Земля ↔ Луна: без вспышки, обратно — на тот же слой ---------- */
test('moon-flight', async () => {
  const p = await page(); await p.goto(B + '/#/j/earth/2'); await ready(p);
  await p.waitForFunction(() => document.getElementById('moonBtn').classList.contains('on'), null, { timeout: 60000 });
  await p.evaluate(() => { window.__fx = 0; const fx = document.getElementById('loopFx'); (function f(){ window.__fx = Math.max(window.__fx, +getComputedStyle(fx).opacity || 0); requestAnimationFrame(f); })(); document.getElementById('moonBtn').click(); });
  let s = await until(p, s => s.h === '#/j/moon/0', 90000); ok(s.h === '#/j/moon/0', 'не долетели до Луны: ' + s.h);
  await p.waitForFunction(() => getComputedStyle(document.querySelector('.moonfly')).opacity === '0', null, { timeout: 60000 });
  await p.mouse.move(800, 400); for (let i = 0; i < 4; i++){ await p.mouse.wheel(0, -500); await sleep(300); }
  s = await until(p, s => s.h === '#/j/earth/2', 90000); ok(s.h === '#/j/earth/2', 'вернулись не на тот слой: ' + s.h);
  await p.waitForFunction(() => document.getElementById('moonBtn').classList.contains('on'), null, { timeout: 60000 });
  const fx = await p.evaluate(() => window.__fx); ok(fx < .05, 'была вспышка: ' + fx);
  clean(p); await p.done();
});

/* ---------- «Глубокий космос»: полёт (адрес, расчёт, смена цели), «Свет из прошлого», «Звезда рождения», выход; английская версия ---------- */
test('fly', async () => {
  const p = await page(); await p.goto(B + '/#/fly/prox?v=g1'); await ready(p);
  let s = await until(p, s => s.open.includes('chFly'), 60000); ok(s.open.includes('chFly'), 'глава не открылась по адресу: ' + JSON.stringify(s));
  await p.waitForFunction(() => document.getElementById('flyCard').innerText.length > 50, null, { timeout: 30000 });
  const card = await p.evaluate(() => document.getElementById('flyCard').innerText);
  ok(/Проксима/i.test(card) && /3,54 года/.test(card) && /5,87 года/.test(card), 'расчёт 1 g до Проксимы: ' + card.slice(0, 160));
  await p.evaluate(() => document.getElementById('flyGo').click());
  await p.waitForFunction(() => document.querySelector('#flyHud .fl-t1').textContent === 'Время в пути: 5,87 года', null, { timeout: 150000 });
  const t3 = await p.evaluate(() => document.querySelector('#flyHud .fl-t3').textContent); ok(/^Пройдено: 4,25 светового года из 4,25/.test(t3), 'итог полёта: ' + t3);
  await p.evaluate(() => [...document.querySelectorAll('#flyDest .fl-d')].find(b => /Андромеды/.test(b.textContent)).click());
  s = await until(p, s => s.h === '#/fly/and?v=g1', 15000); ok(s.h === '#/fly/and?v=g1', 'адрес после смены цели: ' + s.h);
  ok(/28,6 года/.test(await p.evaluate(() => document.getElementById('flyCard').innerText)), 'на борту до Андромеды не 28,6 года');
  // «Свет из прошлого»: Плеяды — 444 года, ≈1582 год; свет доходит «сегодня»
  await p.evaluate(() => [...document.querySelectorAll('#flyModes [data-m]')].find(b => b.dataset.m === 'sky').click());
  await p.evaluate(() => [...document.querySelectorAll('#flyDest .fl-d')].find(b => /Плеяды/.test(b.textContent)).click());
  s = await until(p, s => s.h === '#/sky/ple', 15000); ok(s.h === '#/sky/ple', 'адрес «Света из прошлого»: ' + s.h);
  const sk = await p.evaluate(() => document.getElementById('flyCard').innerText); ok(/444 года назад/.test(sk) && /Свет вышел: 158[23] год/.test(sk), 'карточка Плеяд: ' + sk.slice(0, 160));
  await p.evaluate(() => document.getElementById('flyGo').click());
  await p.waitForFunction(() => document.querySelector('#flyHud .fl-t1').textContent === 'Сегодня', null, { timeout: 120000 });
  // «Звезда рождения»: 1990 → Арктур (36,7 св. года)
  await p.evaluate(() => [...document.querySelectorAll('#flyModes [data-m]')].find(b => b.dataset.m === 'born').click());
  await p.fill('#flyBY', '1990'); await p.selectOption('#flyBM', '7'); await p.click('#flyBGo');
  await p.waitForFunction(() => /Арктур/.test(document.getElementById('flyCard').innerText), null, { timeout: 15000 });
  s = await until(p, s => s.h === '#/sky/born', 15000); ok(s.h === '#/sky/born', 'адрес «Звезды рождения»: ' + s.h);
  ok(!/1990/.test(await p.evaluate(() => location.href)), 'год рождения попал в адрес');
  await p.evaluate(() => document.getElementById('flyClose').click());
  s = await until(p, s => !s.open.includes('chFly') && !/fly|sky/.test(s.h), 15000); ok(!s.open.includes('chFly') && !/fly|sky/.test(s.h), 'выход из главы: ' + JSON.stringify(s));
  clean(p); await p.done();
  const e = await page(); await e.goto(B + '/en/#/fly/moon?v=car'); await ready(e);
  s = await until(e, s => s.open.includes('chFly'), 60000); ok(s.open.includes('chFly'), 'EN: глава не открылась');
  await e.waitForFunction(() => document.getElementById('flyCard').innerText.length > 50, null, { timeout: 30000 });
  const ce = await e.evaluate(() => document.getElementById('flyCard').innerText); ok(/160 days/.test(ce) && /384,400 km/.test(ce) && !/[А-яЁё]/.test(ce), 'EN карточка: ' + ce.slice(0, 160));
  clean(e); await e.done();
});

/* ---------- «Атлас чудес»: адрес страницы, смена объекта, игрушки, выход ---------- */
test('atlas', async () => {
  const p = await page(); await p.goto(B + '/#/atl/q3c'); await ready(p);
  let s = await until(p, s => s.open.includes('chAtl'), 60000); ok(s.open.includes('chAtl'), 'атлас не открылся по адресу');
  await p.waitForFunction(() => /Квазар 3C 273/.test(document.getElementById('atlCard').innerText) && document.querySelectorAll('#atlGrid .at-c').length === 12, null, { timeout: 30000 });
  await p.evaluate(() => document.querySelectorAll('#atlGrid .at-c')[1].click());
  s = await until(p, s => s.h === '#/atl/ori', 15000); ok(s.h === '#/atl/ori', 'адрес после выбора туманности: ' + s.h);
  await p.evaluate(() => document.getElementById('atlB').click());
  ok(await p.evaluate(() => document.getElementById('atlB').getAttribute('aria-pressed')) === 'true', 'инфракрасный не включился');
  await p.evaluate(() => document.querySelectorAll('#atlGrid .at-c')[2].click()); await p.evaluate(() => document.getElementById('atlB').click()); await sleep(1500);
  await p.evaluate(() => document.getElementById('atlB').click());   // звук пульсара — включить и выключить без ошибок
  await p.evaluate(() => document.querySelectorAll('#atlGrid .at-c')[4].click()); await sleep(1500);
  const t0 = await p.evaluate(() => document.getElementById('atlTv').textContent);
  await p.evaluate(() => { const r = document.getElementById('atlR'); r.value = 700; r.dispatchEvent(new Event('input')); });
  await p.waitForFunction(() => /^\+7 /.test(document.getElementById('atlTv').textContent), null, { timeout: 60000 });
  ok(/^\+0 /.test(t0), 'начало симуляции: ' + t0);
  // вторая шестёрка: поймать луч пульсара Паруса, линза под курсором, звук и контраст реликтового излучения
  await p.evaluate(() => document.querySelectorAll('#atlGrid .at-c')[8].click()); await sleep(1200);
  await p.evaluate(() => document.getElementById('atlB').click());
  ok(/из 1$/.test(await p.evaluate(() => document.getElementById('atlTv').textContent)), 'счёт «Поймать луч» не обновился');
  await p.evaluate(() => document.querySelectorAll('#atlGrid .at-c')[10].click()); await sleep(1200);
  await p.mouse.move(900, 380); await p.mouse.move(820, 420); await sleep(800);
  await p.evaluate(() => document.querySelectorAll('#atlGrid .at-c')[11].click()); await sleep(1200);
  await p.evaluate(() => { document.getElementById('atlB').click(); document.getElementById('atlB2').click(); }); await sleep(1500);
  await p.evaluate(() => document.getElementById('atlB2').click());
  s = await until(p, s => s.h === '#/atl/cmb', 15000); ok(s.h === '#/atl/cmb', 'адрес реликтового излучения: ' + s.h);
  await p.evaluate(() => document.getElementById('atlClose').click());
  s = await until(p, s => !s.open.includes('chAtl') && !/atl/.test(s.h), 15000); ok(!s.open.includes('chAtl') && !/atl/.test(s.h), 'выход из атласа: ' + JSON.stringify(s));
  clean(p); await p.done();
});

/* ---------- сбой видеокарты: сообщение и перезапуск ---------- */
test('context-loss', async () => {
  const p = await page(); await p.goto(B + '/'); await ready(p);
  let nav = 0; p.on('framenavigated', f => { if (f === p.mainFrame()) nav++; });
  const r = await p.evaluate(async () => { const c = document.getElementById('gl'), gl = c.getContext('webgl2') || c.getContext('webgl'), x = gl.getExtension('WEBGL_lose_context');
    x.loseContext(); await new Promise(r => setTimeout(r, 800)); const v = getComputedStyle(document.getElementById('nogl')).display; x.restoreContext(); return v; });
  for (let i = 0; i < 24 && !nav; i++) await sleep(500);   // перезапуск — после события webglcontextrestored, на программной графике до нескольких секунд
  ok(r === 'grid', 'сообщение не показано'); ok(nav >= 1, 'страница не перезапустилась');
  await p.done();
});

/* ---------- телефон: без горизонтальной прокрутки ---------- */
test('mobile', async () => {
  for (const [dev, url] of [['iPhone 13', '/'], ['iPhone SE', '/en/']]){
    const p = await page({ device: dev }); await p.goto(B + url + '#/j/earth/5'); await ready(p); await sleep(2500);
    let w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); ok(w[0] <= w[1], dev + ': ширина ' + w);
    await p.evaluate(() => document.getElementById('menuBtn').click()); await sleep(1200);
    w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); ok(w[0] <= w[1], dev + ' меню: ширина ' + w);
    clean(p); await p.done();
  }
});

/* ---------- запуск ---------- */
(async () => {
  ok(fs.existsSync(path.join(DIST, 'index.html')), 'нет сборки: ' + DIST);
  const srv = spawn('python3', [path.join(__dirname, 'server.py'), DIST, String(PORT)], { stdio: 'ignore' });
  const up = () => new Promise(r => http.get(B + '/robots.txt', res => { res.resume(); r(res.statusCode === 200); }).on('error', () => r(false)));
  for (let i = 0; i < 40 && !(await up()); i++) await sleep(250);
  browser = await chromium.launch({ args: ARGS });
  const want = process.argv.slice(2), run = T.filter(t => !want.length || want.some(w => t.name.startsWith(w)));
  let fail = 0; const t0 = Date.now();
  for (const t of run){
    const s = Date.now();
    try { const note = await Promise.race([t.fn(), sleep(240000).then(() => { throw new Error('тайм-аут 240 с'); })]);
      console.log(`PASS  ${t.name}  (${((Date.now() - s)/1000).toFixed(0)} с)${note ? '  ' + note : ''}`); }
    catch(e){ fail++; console.log(`FAIL  ${t.name}  — ${e.message}`); }
  }
  await browser.close(); srv.kill();
  console.log(`\n${run.length - fail} из ${run.length} прошли, ${((Date.now() - t0)/1000).toFixed(0)} с`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
