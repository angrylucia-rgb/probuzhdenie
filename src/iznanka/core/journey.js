// Маршрут: Изнанка — центр. Любой переход из мира в мир идёт через неё.
// Первый круг: Изнанка → следующий неоткрытый мир → Изнанка → ... → Свет → Изнанка. Потом свободно.
export const HUB = 'iznanka';
export const ORDER = ['frost', 'waterlights', 'flame', 'corona', 'nebula', 'field', 'prism'];
const KEY = 'iznanka.v2';

export function createJourney(storage) {
  let completed = false;
  const opened = new Set();
  try {
    const d = JSON.parse(storage.getItem(KEY));
    completed = d.completed === true;
    if (Array.isArray(d.opened)) d.opened.forEach((id) => opened.add(id));
  } catch { /* нет хранилища или битые данные */ }

  const angleOf = (id) => -Math.PI / 2 + ORDER.indexOf(id) * 2 * Math.PI / ORDER.length;
  const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

  function next(current, angle) {
    if (current !== HUB) return HUB;
    if (!completed) return ORDER.find((id) => !opened.has(id)) || 'light';
    if (typeof angle !== 'number') return ORDER[0];
    return ORDER.reduce((best, id) => (Math.abs(wrap(angleOf(id) - angle)) < Math.abs(wrap(angleOf(best) - angle)) ? id : best));
  }

  function arrive(id) {
    if (ORDER.includes(id)) opened.add(id);
    if (id === 'light') completed = true;
    try { storage.setItem(KEY, JSON.stringify({ completed, opened: [...opened] })); } catch { /* приватный режим */ }
  }

  return { get completed() { return completed; }, get opened() { return opened; }, next, arrive, angleOf };
}
