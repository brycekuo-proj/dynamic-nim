import { stateId } from './GameState.js';
import { generateLegalMoves } from './MoveGenerator.js';
import { applyMove } from './TransformationSystem.js';
export class Solver {
  constructor() { this.table = new Map(); }
  solve(state) {
    const key = stateId(state);
    if (this.table.has(key)) return this.table.get(key);
    const moves = generateLegalMoves(state);
    if (!moves.length) {
      const result = Object.freeze({ winning: false, depth: 0, minDepth: 0, optimalMove: null });
      this.table.set(key, result); return result;
    }
    const children = moves.map(move => ({ move, result: this.solve(applyMove(state, move)) }));
    const winners = children.filter(c => !c.result.winning);
    const winning = winners.length > 0;
    // Winner minimizes plies; doomed opponent maximizes them. Stable enumeration breaks ties.
    const candidates = winning ? winners : children;
    let best = candidates[0];
    for (const candidate of candidates.slice(1)) {
      if (winning ? candidate.result.depth < best.result.depth : candidate.result.depth > best.result.depth) best = candidate;
    }
    const result = Object.freeze({ winning, depth: best.result.depth + 1, minDepth: Math.min(...children.map(c => c.result.minDepth)) + 1, optimalMove: Object.freeze([...best.move]) });
    this.table.set(key, result); return result;
  }
  analyze(state) {
    const moves = generateLegalMoves(state).map(move => {
      const next = applyMove(state, move), result = this.solve(next);
      return { move, nextId: stateId(next), winning: !result.winning, depth: result.depth + 1 };
    });
    return { ...this.solve(state), legalMoves: moves.length, winningMoves: moves.filter(m => m.winning), losingMoves: moves.filter(m => !m.winning), moves };
  }
  continuation(state) {
    const steps = [];
    while (state.mask) {
      const result = this.solve(state), next = applyMove(state, result.optimalMove);
      steps.push({ stateId: stateId(state), move: result.optimalMove, nextId: stateId(next), winning: result.winning });
      state = next;
    }
    return steps;
  }
}
