import { cellsOf, bit, occupied, withMask } from './GameState.js';
import { removePieces } from './RuleEngine.js';
export function gravityDown(state) {
  let mask = 0n;
  const falls = [];
  // Bottom-to-top matching preserves piece ordering and gives the renderer exact trajectories.
  for (let col = 0; col < state.width; col++) {
    let targetRow = state.height - 1;
    for (let row = state.height - 1; row >= 0; row--) {
      const from = row * state.width + col;
      if (!occupied(state, from)) continue;
      const to = targetRow-- * state.width + col;
      mask |= bit(to); falls.push({ from, to });
    }
  }
  return { state: withMask(state, mask), falls };
}
const transformations = {
  static: state => ({ state, falls: cellsOf(state).map(cell => ({ from: cell, to: cell })) }),
  gravity: gravityDown,
};
export function transform(state) {
  const transformation = transformations[state.world];
  if (!transformation) throw new Error(`Unsupported world: ${state.world}`);
  return transformation(state);
}
export function transition(state, move) {
  const removed = removePieces(state, move);
  return { removed, ...transform(removed) };
}
export const applyMove = (state, move) => transition(state, move).state;
