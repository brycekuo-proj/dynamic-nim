import { bit, occupied, withMask } from './GameState.js';

export const MAX_REMOVAL = 3;
const coord = (state, i) => ({ row: Math.floor(i / state.width), col: i % state.width });
const consecutive = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.every((value, i) => i === 0 || value === sorted[i - 1] + 1);
};

export function isLegalMove(state, move) {
  if (!Array.isArray(move) || !move.length || move.length > MAX_REMOVAL || move.some(i => !Number.isInteger(i) || !occupied(state, i)) || new Set(move).size !== move.length) return false;
  if (move.length === 1) return true;
  const points = move.map(i => coord(state, i));
  const horizontal = points.every(p => p.row === points[0].row) && consecutive(points.map(p => p.col));
  const vertical = points.every(p => p.col === points[0].col) && consecutive(points.map(p => p.row));
  const diagonalDown = points.every(p => p.row - p.col === points[0].row - points[0].col) && consecutive(points.map(p => p.row));
  const diagonalUp = points.every(p => p.row + p.col === points[0].row + points[0].col) && consecutive(points.map(p => p.row));
  return horizontal || vertical || diagonalDown || diagonalUp;
}

export function removePieces(state, move) {
  if (!isLegalMove(state, move)) throw new Error('Illegal move');
  return withMask(state, move.reduce((mask, i) => mask & ~bit(i), state.mask));
}

// Pointer and keyboard selection share horizontal, vertical and both 45° diagonals.
export function lineBetween(state, start, end) {
  const size = state.width * state.height;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < 0 || start >= size || end >= size) return [];
  const a = coord(state, start), b = coord(state, end);
  const dr = b.row - a.row, dc = b.col - a.col;
  const distance = Math.max(Math.abs(dr), Math.abs(dc));
  if (distance && dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [];
  if (distance + 1 > MAX_REMOVAL) return [];
  const rowStep = Math.sign(dr), colStep = Math.sign(dc);
  const move = Array.from({ length: distance + 1 }, (_, n) => (a.row + n * rowStep) * state.width + a.col + n * colStep);
  return isLegalMove(state, move) ? move : [];
}
