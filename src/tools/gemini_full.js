const W = ms => new Promise(r => setTimeout(r, ms));
await W(3000);
const btn = q => [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '').includes(q));
if(!/Pro/.test(btn('Выбор режима')?.getAttribute('aria-label')||'')){btn('Выбор режима').click(); await W(1200); [...document.querySelectorAll('[role=menuitem],[role=menuitemradio],[role=option]')].find(e=>/3\.1 Pro/.test(e.innerText))?.click(); await W(1500);}
const mode = btn('Выбор режима')?.getAttribute('aria-label');
btn('Загрузка и инструменты')?.click(); await W(1200);
const it = [...document.querySelectorAll('*')].find(e => e.textContent.trim() === 'Создание изображений' && e.children.length === 0);
(it?.closest('button,[role=menuitem],li') || it)?.click(); await W(1500);
btn('Соотношение сторон')?.click(); await W(1000);
[...document.querySelectorAll('[role=menuitemradio]')].find(e => e.textContent.trim() === '16:9')?.click(); await W(500);
window.__dl = () => [...document.querySelectorAll('button')].filter(b => (b.getAttribute('aria-label') || '').includes('Скачать изображение'));
window.__gen = async (prompt) => {
  const n0 = __dl().length;
  const ed = document.querySelector('rich-textarea .ql-editor, div[contenteditable="true"]');
  ed.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, prompt);
  await new Promise(r => setTimeout(r, 600));
  const send = document.querySelector('button[aria-label*="Отправить"], button.send-button');
  if (!send) return 'no send button';
  send.click(); const t0 = Date.now();
  while (Date.now() - t0 < 900000) {
    await new Promise(r => setTimeout(r, 1500));
    if (__dl().length > n0) { await new Promise(r => setTimeout(r, 3000)); __dl().at(-1).scrollIntoView(); __dl().at(-1).click(); return 'ok ' + Math.round((Date.now() - t0)/1000) + 's'; }
    if (/Лимит (обновится|сбросится)/.test(document.querySelector('main').innerText.slice(-400))) return 'limit';
  }
  return 'timeout';
};
window.__P={"ankyl": "Ankylosaurus, 7 m armored dinosaur, wide low body covered with bony plates and spikes, small horns at the back of the head, heavy bony club at the tail end, walking. Facing left. Exactly one single animal, no duplicate, no second ghost or transparent silhouette, no overlapping copy.", "sinos": "Sinosauropteryx prima, 1 m small theropod covered with simple filament feathers, ginger-orange with a pale belly, banded ringed tail and a dark \"bandit mask\" around the eyes, running. Facing right.", "ptera": "Pteranodon, wingspan 6–7 m, long backward-pointing head crest, long toothless pointed beak, short tail, membranous wings fully spread, flying. Facing left.", "repen": "Repenomamus robustus, 1 m badger-like early mammal, stocky, dark fur, strong jaws, walking. Facing left.", "spino": "Spinosaurus aegyptiacus, 14 m, tall sail on the back, long narrow crocodile-like snout with conical teeth, short hind legs, deep paddle-like tail, walking. Facing left.", "bwhale": "Blue whale (Balaenoptera musculus), long blue-grey mottled body, throat grooves, small dorsal fin, swimming. Facing left.", "octo": "Common octopus (Octopus vulgaris), arms spread naturally, resting. Facing right.", "nauti": "Chambered nautilus (Nautilus pompilius), coiled shell with brown-and-white stripes, tentacles, swimming. Facing left.", "coela": "West Indian Ocean coelacanth (Latimeria chalumnae), deep blue with white spots, fleshy lobed fins, three-lobed tail, swimming. Facing left.", "limul": "Atlantic horseshoe crab (Limulus polyphemus), horseshoe-shaped shell, long tail spine; view from above-side, crawling. Facing right.", "axolo": "Wild-type axolotl (Ambystoma mexicanum), dark olive mottled skin, feathery external gills, walking on the bottom. Facing left.", "bee": "Honey bee worker (Apis mellifera), flying, wings blurred, pollen baskets on hind legs. Magnified. Facing right.", "tardi": "Tardigrade, eight stubby legs with claws, plump segmented body, realistic natural translucent beige colour. Magnified. Facing left.", "ginkg": "Ginkgo biloba branch with fan-shaped two-lobed leaves (one leafy twig, not a whole tree), autumn yellow and green. Seen from the side, isolated as a single object.", "physa": "Slime mold Physarum polycephalum: a bright yellow branching network of veins forming a fan-shaped patch about 15 cm across, seen from above, isolated as a single object."};
window.__S="Generate an image. Scientific natural history illustration, photorealistic, highly detailed texture. New separate image, not a landscape. ";
window.__T=" Full body in strict side view (profile), nothing cropped. Soft even studio light from upper left. Isolated on a plain flat uniform light-grey background (#D9D9D9). No ground, no water, no shadow, no text, no frame, no other animals. Anatomically accurate according to current scientific knowledge.";
window.__T2=" Whole object visible, nothing cropped. Soft even studio light from upper left. Isolated on a plain flat uniform light-grey background (#D9D9D9). No ground, no shadow, no text, no frame, no animals. Scientifically accurate.";
window.__run=k=>{window.__res='run';__gen(__S+__P[k]+(['physa','ginkg'].includes(k)?__T2:__T)).then(r=>window.__res=r);return 'started '+k;};
[mode, [...document.querySelectorAll('button')].some(b=>/close Изображения/.test(b.innerText)), btn('Соотношение сторон')?.getAttribute('aria-label')]