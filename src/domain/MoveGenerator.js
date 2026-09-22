import { cellsOf, occupied } from './GameState.js';
import { MAX_REMOVAL } from './RuleEngine.js';
export function generateLegalMoves(state) {
  const moves = [];
  for (const start of cellsOf(state)) {
    moves.push([start]);
    for (const horizontal of [true, false]) {
      const step = horizontal ? 1 : state.width;
      const move = [start];
      for (let i = start + step; i < state.width * state.height; i += step) {
        if (horizontal && Math.floor(i / state.width) !== Math.floor(start / state.width)) break;
        if (!occupied(state, i)) break;
        move.push(i);
        moves.push([...move]);
        if (move.length >= MAX_REMOVAL) break;
      }
    }
  }
  return moves;
}
