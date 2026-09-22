export const moveId = move => [...move].sort((a, b) => a - b).join(',');
export const describeMove = (state, move) => move.map(i => `r${Math.floor(i / state.width) + 1}c${i % state.width + 1}`).join('–');
