/* ---------- загрузка ---------- */
const lring = $("lring"), lpct = $("lpct");
function progress(p){ lring.setAttribute("stroke-dashoffset", String(352*(1-p))); lpct.textContent = String(Math.round(p*100)).padStart(3,"0"); }
if (!window.THREE){ $("loader").classList.add("done"); $("nogl").style.display = "grid"; return; }
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas:$("gl"), antialias:!mobile, powerPreference:"high-performance"}); }
catch(e){ $("loader").classList.add("done"); $("nogl").style.display = "grid"; return; }
const PR = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
renderer.setPixelRatio(PR);
// v180: потеря контекста WebGL (сбой драйвера, сон ноутбука, нехватка памяти на телефоне). Без обработчика экран просто чернел.
// Показываем «Нужен WebGL» с пояснением; если браузер вернул контекст — перезагружаем страницу (отметки и журнал в localStorage сохранятся).
$("gl").addEventListener("webglcontextlost", e => { e.preventDefault(); const n = $("nogl"); if (n){ n.querySelector("p").textContent = "Видеокарта сбросила трёхмерную сцену. Страница перезапустится сама; если нет — обновите её."; n.style.display = "grid"; } }, false);
$("gl").addEventListener("webglcontextrestored", () => location.reload(), false);
renderer.setClearColor(0x05060c, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, 0.1, 3000);
const tscene = new THREE.Scene();
const tcam = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.1, 400);
