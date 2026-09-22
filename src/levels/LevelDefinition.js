import { fromRows } from '../domain/GameState.js';
export function defineLevel(id, name, rows, world, lesson, hint, constraints = {}) {
  const initial = fromRows(rows, world);
  return Object.freeze({ id, name, rows: Object.freeze(rows), world, lesson, hint, constraints: Object.freeze(constraints), initial });
}
