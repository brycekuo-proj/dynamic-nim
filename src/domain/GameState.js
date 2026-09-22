export const WORLDS = Object.freeze(['static', 'gravity']);
export function createState(width, height, cells, world = 'static') {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 64 || !WORLDS.includes(world)) throw new Error('Invalid board dimensions/world');
  let mask = 0n;
  for (const cell of cells) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= width * height || (mask & bit(cell))) throw new Error('Invalid/duplicate cell');
    mask |= bit(cell);
  }
  return Object.freeze({ width, height, mask, world });
}
export const bit = cell => 1n << BigInt(cell);
export const occupied = (state, cell) => cell >= 0 && cell < state.width * state.height && Boolean(state.mask & bit(cell));
export function cellsOf(state) {
  const cells = [];
  for (let i = 0; i < state.width * state.height; i++) if (occupied(state, i)) cells.push(i);
  return cells;
}
export const stateId = s => `${s.world}:${s.width}x${s.height}:${s.mask.toString(16)}`;
export const withMask = (state, mask) => Object.freeze({ ...state, mask });
export const snapshot = s => ({ width: s.width, height: s.height, world: s.world, cells: cellsOf(s), id: stateId(s) });
export function fromRows(rows, world = 'static') {
  if (!rows.length || rows.some(row => row.length !== rows[0].length || /[^.#]/.test(row))) throw new Error('Invalid rows');
  return createState(rows[0].length, rows.length, [...rows.join('')].flatMap((c, i) => c === '#' ? [i] : []), world);
}
export function rowsOf(state) {
  return Array.from({ length: state.height }, (_, r) => Array.from({ length: state.width }, (_, c) => occupied(state, r * state.width + c) ? '#' : '.').join(''));
}
