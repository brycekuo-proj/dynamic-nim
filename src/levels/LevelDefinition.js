import { fromRows } from '../domain/GameState.js';
import { CORE_MOVE_RULES } from '../domain/RuleEngine.js';
export function defineLevel(id, name, rows, world, lesson, hint, constraints = {}) {
  const initial = fromRows(rows, world);
  return Object.freeze({ id, name, rows: Object.freeze(rows), world, lesson, hint, moveRules: CORE_MOVE_RULES, constraints: Object.freeze(constraints), initial });
}
