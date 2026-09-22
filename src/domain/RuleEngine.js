import { bit, occupied, withMask } from './GameState.js';
export const MAX_REMOVAL = 3;
export function isLegalMove(state, move) {
  if (!Array.isArray(move) || !move.length || move.length > MAX_REMOVAL || move.some(i => !Number.isInteger(i) || !occupied(state, i)) || new Set(move).size !== move.length) return false;
  const sorted = [...move].sort((a, b) => a - b);
  const horizontal = sorted.every(i => Math.floor(i / state.width) === Math.floor(sorted[0] / state.width));
  const vertical = sorted.every(i => i % state.width === sorted[0] % state.width);
  return (horizontal && sorted.every((i, n) => !n || i === sorted[n - 1] + 1)) || (vertical && sorted.every((i, n) => !n || i === sorted[n - 1] + state.width));
}
export function removePieces(state, move) {
  if (!isLegalMove(state, move)) throw new Error('Illegal move');
  return withMask(state, move.reduce((mask, i) => mask & ~bit(i), state.mask));
}
// Pointer and keyboard selection share these rules; gaps and diagonals return no move.
export function lineBetween(state, start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return [];
  const a = Math.min(start, end), b = Math.max(start, end);
  const step = Math.floor(a / state.width) === Math.floor(b / state.width) ? 1 : a % state.width === b % state.width ? state.width : 0;
  if (!step) return [];
  const move = [];
  for (let i = a; i <= b; i += step) move.push(i);
  return isLegalMove(state, move) ? move : [];
}
