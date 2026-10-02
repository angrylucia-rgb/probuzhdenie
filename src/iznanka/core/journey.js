// Маршрут: Изнанка — центр. Любой переход из мира в мир идёт через неё.
// Первый круг: Изнанка → следующий неоткрытый мир → Изнанка → ... → Свет → Изнанка. Потом —
// каждое новое погружение рождает процедурный мир (worlds/generator.js), а не выбор среди тех же восьми:
// это ближе к самой идее Изнанки как непрерывно меняющейся реальности.
import { WORLDS } from '../worlds/presets.js';
import { generateWorld } from '../worlds/generator.js';

export const HUB = 'iznanka';
export const ORDER = ['mandala', 'frost', 'waterlights', 'flame', 'corona', 'nebula', 'field', 'prism'];
const KEY = 'iznanka.v2';
const GEN_CAP = 12; // не копим сгенерированные миры бесконечно за долгую сессию

export function createJourney(storage) {
  let completed = false;
  const opened = new Set();
  try {
    const d = JSON.parse(storage.getItem(KEY));
    completed = d.completed === true;
    if (Array.isArray(d.opened)) d.opened.forEach((id) => opened.add(id));
  } catch { /* нет хранилища или битые данные */ }

  const angleOf = (id) => -Math.PI / 2 + ORDER.indexOf(id) * 2 * Math.PI / ORDER.length;

  const genIds = [];
  let genCounter = 0;
  function spawnGenerated() {
    const id = 'gen' + (++genCounter);
    WORLDS[id] = generateWorld();
    genIds.push(id);
    if (genIds.length > GEN_CAP) delete WORLDS[genIds.shift()];
    return id;
  }

  function next(current) {
    if (current !== HUB) return HUB;
    if (!completed) return ORDER.find((id) => !opened.has(id)) || 'light';
    return spawnGenerated();
  }

  function arrive(id) {
    if (ORDER.includes(id)) opened.add(id);
    if (id === 'light') completed = true;
    try { storage.setItem(KEY, JSON.stringify({ completed, opened: [...opened] })); } catch { /* приватный режим */ }
  }

  return { get completed() { return completed; }, get opened() { return opened; }, next, arrive, angleOf };
}
