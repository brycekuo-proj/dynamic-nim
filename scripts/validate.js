import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { levels } from '../src/levels/index.js';
import { Solver } from '../src/domain/Solver.js';
import { snapshot, rowsOf, createState, cellsOf } from '../src/domain/GameState.js';
import { generateLegalMoves } from '../src/domain/MoveGenerator.js';
import { describeMove } from '../src/domain/Move.js';
import { nimAnalysis } from '../src/domain/Nim.js';
import { applyMove, transition } from '../src/domain/TransformationSystem.js';
import { CORE_MOVE_RULES } from '../src/domain/RuleEngine.js';
export function validateLevels(input = levels) {
  const solver = new Solver();
  return input.map(level => {
    assert.strictEqual(level.moveRules, CORE_MOVE_RULES, `L${level.id}: level must inherit the global L1–L30 move rules`);
    assert(level.id >= CORE_MOVE_RULES.levelRange.min && level.id <= CORE_MOVE_RULES.levelRange.max, `L${level.id}: level id is outside the supported L1–L30 range`);
    const state = level.initial, a = solver.analyze(state), nim = nimAnalysis(state);
    assert(a.winning, `L${level.id}: initial state must be N`);
    assert(a.winningMoves.length <= level.constraints.maxWinning, `L${level.id}: too many winning choices`);
    if (nim) assert.equal(a.winning, nim.xor !== 0);
    const constraints = level.constraints;
    const optimalTransition = transition(state, a.optimalMove);
    if (constraints.minDepth) assert(a.depth >= constraints.minDepth, `L${level.id}: strategy too shallow`);
    if (constraints.everyOpeningFalls) for (const candidate of a.moves) assert(transition(state, candidate.move).falls.some(f => f.from !== f.to), 'FALL must visibly fall on every opening');
    if (constraints.newLine) {
      const before = new Set(generateLegalMoves(optimalTransition.removed).map(m => m.join(',')));
      assert(generateLegalMoves(optimalTransition.state).some(m => m.length > 1 && !before.has(m.join(','))), `L${level.id}: no new line formed`);
    }
    let gravityWitness = null;
    if (constraints.gravityMatters) {
      gravityWitness = a.moves.find(candidate => {
        const removed = transition(state, candidate.move).removed;
        const staticState = createState(state.width, state.height, cellsOf(removed), 'static');
        return candidate.winning !== !solver.solve(staticState).winning;
      });
      assert(gravityWitness, `L${level.id}: gravity did not change any opening evaluation`);
    }
    let trapProof = null;
    if (constraints.trap) {
      const trap = a.losingMoves.find(m => m.move.join(',') === constraints.trap.join(','));
      assert(trap, 'TRAP must lose against perfect AI');
      assert.equal(trap.move.length, Math.max(...a.moves.map(m => m.move.length)), 'TRAP must be a largest removal');
      const after = applyMove(state, trap.move), response = solver.solve(after).optimalMove;
      assert.equal(solver.solve(applyMove(after, response)).winning, false);
      trapProof = { move: trap.move, after: snapshot(after), aiResponse: response, aiSendsTo: snapshot(applyMove(after, response)) };
    }
    // Every possible AI reply to the chosen P-position has a verified response.
    const replyCertificate = generateLegalMoves(optimalTransition.state).map(aiMove => {
      const afterAI = applyMove(optimalTransition.state, aiMove);
      const playerMove = solver.solve(afterAI).optimalMove;
      assert(solver.solve(afterAI).winning, 'P-position must have only N successors');
      const afterPlayer = applyMove(afterAI, playerMove);
      assert.equal(solver.solve(afterPlayer).winning, false);
      return { aiMove, afterAI: snapshot(afterAI), playerMove, afterPlayer: snapshot(afterPlayer) };
    });
    const continuation = solver.continuation(state);
    assert.equal(continuation.length, a.depth);
    let replay = state;
    for (const step of continuation) replay = applyMove(replay, step.move);
    assert.equal(replay.mask, 0n);
    return { level: level.id, name: level.name, world: level.world, moveRules: level.moveRules, initial: snapshot(state), rows: rowsOf(state), outcome: 'N / winning', nim, nimSum: nim ? nim.xor : 'N/A', gravityWitness, trapProof, legalMoves: a.legalMoves, winningCount: a.winningMoves.length, losingCount: a.losingMoves.length, winningMoves: a.winningMoves, losingMoves: a.losingMoves, optimalFirstMove: a.optimalMove, optimalLabel: describeMove(state, a.optimalMove), solutionDepth: a.depth, minimumTerminalDepth: a.minDepth, replyCertificate, continuation };
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = validateLevels();
  writeFileSync('artifacts/level-validation.json', JSON.stringify({ depthDefinition: 'Plies: winner minimizes, loser maximizes; stable move order breaks ties. Minimum terminal depth ignores optimal play. No probabilistic expected depth.', levels: report }, null, 2) + '\n');
  console.table(report.map(r => ({ Level: `L${r.level} ${r.name}`, Initial: r.rows.join('/'), State: r.outcome, Legal: r.legalMoves, Winning: r.winningCount, Losing: r.losingCount, NimSum: r.nimSum, First: r.optimalLabel, Depth: r.solutionDepth, Min: r.minimumTerminalDepth })));
  console.log('All level constraints passed. Full move lists and continuations: artifacts/level-validation.json');
}
