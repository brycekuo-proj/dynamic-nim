import { fromRows } from '../domain/GameState.js';
import { CORE_MOVE_RULES } from '../domain/RuleEngine.js';
// mode: 'normal' (taking the last piece wins) or 'misere' (taking the last piece loses).
export function defineLevel(id, name, rows, world, lesson, hint, constraints = {}, { mode = 'normal' } = {}) {
  const initial = fromRows(rows, world);
  return Object.freeze({ id, name, rows: Object.freeze(rows), world, mode, lesson, hint, moveRules: CORE_MOVE_RULES, constraints: Object.freeze(constraints), initial });
}
