import { cellsOf, occupied } from './GameState.js';
import { CORE_DIRECTION_VECTORS, MAX_REMOVAL } from './RuleEngine.js';

export function generateLegalMoves(state) {
  const moves = [];
  for (const start of cellsOf(state)) {
    moves.push([start]);
    const startRow = Math.floor(start / state.width), startCol = start % state.width;
    for (const [dr, dc] of CORE_DIRECTION_VECTORS) {
      const move = [start];
      for (let distance = 1; distance < MAX_REMOVAL; distance++) {
        const row = startRow + dr * distance, col = startCol + dc * distance;
        if (row < 0 || col < 0 || row >= state.height || col >= state.width) break;
        const cell = row * state.width + col;
        if (!occupied(state, cell)) break;
        move.push(cell);
        moves.push([...move]);
      }
    }
  }
  return moves;
}
