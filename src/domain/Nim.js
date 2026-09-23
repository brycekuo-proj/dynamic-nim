import { occupied } from './GameState.js';
import { MAX_REMOVAL } from './RuleEngine.js';

// In a static world, disconnected straight runs form independent subgames.
// With the global removal cap, a run may still split into two independent runs.
// Its Sprague-Grundy value is therefore computed by mex over every legal
// contiguous removal of 1..MAX_REMOVAL circles. XOR combines run values;
// the full game-tree solver remains authoritative.
const grundyMemo = [0];
export function straightRunGrundy(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error('Run length must be a non-negative integer');
  for (let size = grundyMemo.length; size <= n; size++) {
    const options = new Set();
    for (let removed = 1; removed <= Math.min(MAX_REMOVAL, size); removed++) {
      for (let left = 0; left <= size - removed; left++) {
        const right = size - removed - left;
        options.add(straightRunGrundy(left) ^ straightRunGrundy(right));
      }
    }
    let mex = 0;
    while (options.has(mex)) mex++;
    grundyMemo[size] = mex;
  }
  return grundyMemo[n];
}
export function nimAnalysis(state) {
  if (state.world !== 'static') return null;
  const seen = new Set(), heaps = [];
  const coord = i => ({ row: Math.floor(i / state.width), col: i % state.width });
  for (let i = 0; i < state.width * state.height; i++) {
    if (!occupied(state, i) || seen.has(i)) continue;
    const component = [], queue = [i];
    seen.add(i);
    while (queue.length) {
      const j = queue.pop(); component.push(j);
      const { row, col } = coord(j);
      for (const dr of [-1, 0, 1]) for (const dc of [-1, 0, 1]) {
        if (!dr && !dc) continue;
        const r = row + dr, c = col + dc;
        if (r < 0 || c < 0 || r >= state.height || c >= state.width) continue;
        const k = r * state.width + c;
        if (occupied(state, k) && !seen.has(k)) { seen.add(k); queue.push(k); }
      }
    }
    const points = component.map(coord), first = points[0];
    const straight = points.every(p => p.row === first.row)
      || points.every(p => p.col === first.col)
      || points.every(p => p.row - p.col === first.row - first.col)
      || points.every(p => p.row + p.col === first.row + first.col);
    if (!straight) return null;
    heaps.push(component.length);
  }
  const grundies = heaps.map(straightRunGrundy);
  return { certificate: 'isolated-8-neighbor-straight-lines-max3-v4', heaps, grundies, xor: grundies.reduce((a, b) => a ^ b, 0) };
}
