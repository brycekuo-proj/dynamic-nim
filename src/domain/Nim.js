import { occupied } from './GameState.js';
// In a static world, disconnected straight runs form independent subgames.
// A run of length n has Grundy value n: tail removals reach every k < n;
// an internal removal leaves a,b with a+b < n and a XOR b <= a+b < n.
// Thus mex is n, even though splitting adds moves beyond classic Nim.
// XOR combines these values; the game-tree solver remains authoritative.
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
  return { certificate: 'isolated-straight-lines-v2', heaps, xor: heaps.reduce((a, b) => a ^ b, 0) };
}
