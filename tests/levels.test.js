import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLevels } from '../scripts/validate.js';
import { levels } from '../src/levels/index.js';
import { Solver } from '../src/domain/Solver.js';
import { nimAnalysis } from '../src/domain/Nim.js';
import { applyMove } from '../src/domain/TransformationSystem.js';
import { CORE_MOVE_RULES } from '../src/domain/RuleEngine.js';
import { defineLevel } from '../src/levels/LevelDefinition.js';

test('every level meets its solver-verified teaching constraints', () => {
  const reports = validateLevels();
  assert.equal(reports.length, levels.length);
  for (const report of reports) assert.equal(report.legalMoves, report.winningCount + report.losingCount);
  assert.deepEqual(reports.map(report => report.nimSum), [1, 2, 7, 1, 1, ...Array(5).fill('N/A')]);
});
test('core move rules are global, immutable and inherited by current and future L1–L30 levels', () => {
  assert.equal(Object.isFrozen(CORE_MOVE_RULES), true);
  assert.deepEqual(CORE_MOVE_RULES.directionTypes, ['horizontal', 'vertical', 'diagonal-45']);
  assert.deepEqual(CORE_MOVE_RULES.diagonalSlopes, ['↘', '↙']);
  assert.equal(CORE_MOVE_RULES.maxRemoval, 3);
  assert.equal(CORE_MOVE_RULES.contiguous, true);
  assert.equal(CORE_MOVE_RULES.allowGaps, false);
  assert.deepEqual(CORE_MOVE_RULES.levelRange, { min: 1, max: 30 });
  for (const level of levels) assert.strictEqual(level.moveRules, CORE_MOVE_RULES);
  for (const id of [11, 15, 16, 25, 26, 30]) {
    const future = defineLevel(id, 'FUTURE', ['#'], 'static', '', '', { maxWinning: 1 });
    assert.strictEqual(future.moveRules, CORE_MOVE_RULES);
  }
});

test('solver governs openings; XOR is only exposed for certified states', () => {
  const solver = new Solver();
  for (const level of levels.filter(l => l.world === 'static')) {
    for (const candidate of solver.analyze(level.initial).winningMoves) {
      const next = applyMove(level.initial, candidate.move);
      assert.equal(solver.solve(next).winning, false);
      const nim = nimAnalysis(next); if (nim) assert.equal(nim.xor, 0);
    }
  }
  assert.equal(solver.analyze(levels[3].initial).winningMoves.length, 1);
  assert.deepEqual(nimAnalysis(levels[2].initial).heaps, [1, 2, 4]);
  assert.equal(nimAnalysis(levels[2].initial).xor, 7);
  assert.deepEqual(nimAnalysis(levels[4].initial).heaps, [3, 4, 6]);
  assert.equal(nimAnalysis(levels[4].initial).xor, 1);
  for (const level of levels.slice(5)) assert.equal(nimAnalysis(level.initial), null);
  assert.deepEqual(nimAnalysis(levels[3].initial).heaps, [2, 1, 2]);
});
