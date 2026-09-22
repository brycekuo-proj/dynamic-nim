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
  for (let i = 0; i < state.width * state.height; i++) {
    if (!occupied(state, i) || seen.has(i)) continue;
    const component = [], queue = [i];
    seen.add(i);
    while (queue.length) {
      const j = queue.pop(); component.push(j);
      for (const k of [j - state.width, j + state.width, ...(j % state.width ? [j - 1] : []), ...(j % state.width < state.width - 1 ? [j + 1] : [])]) {
        if (occupied(state, k) && !seen.has(k)) { seen.add(k); queue.push(k); }
      }
    }
    if (!component.every(j => Math.floor(j / state.width) === Math.floor(i / state.width)) && !component.every(j => j % state.width === i % state.width)) return null;
    heaps.push(component.length);
  }
  const grundies = heaps.map(straightRunGrundy);
  return { certificate: 'isolated-straight-lines-max3-v3', heaps, grundies, xor: grundies.reduce((a, b) => a ^ b, 0) };
}
