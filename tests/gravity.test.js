import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, fromRows, cellsOf, rowsOf } from '../src/domain/GameState.js';
import { gravityDown, applyMove } from '../src/domain/TransformationSystem.js';
import { Solver } from '../src/domain/Solver.js';
import { generateLegalMoves } from '../src/domain/MoveGenerator.js';

test('gravity preserves column counts, stable order, determinism and idempotence on all 3×3 states', () => {
  for (let mask = 0; mask < 512; mask++) {
    const cells = Array.from({ length: 9 }, (_, i) => i).filter(i => mask & (1 << i)), s = createState(3, 3, cells, 'gravity');
    const a = gravityDown(s), b = gravityDown(s);
    assert.deepEqual(a, b);
    assert.deepEqual(gravityDown(a.state).state, a.state);
    assert.equal(cellsOf(a.state).length, cells.length);
    for (let col = 0; col < 3; col++) {
      const n = cells.filter(i => i % 3 === col).length;
      assert.deepEqual(cellsOf(a.state).filter(i => i % 3 === col), Array.from({ length: n }, (_, j) => (3 - n + j) * 3 + col));
      const falls = a.falls.filter(f => f.from % 3 === col);
      assert(falls.every((f, i) => !i || f.from < falls[i - 1].from && f.to < falls[i - 1].to));
    }
    assert.equal(s.mask, BigInt(mask));
  }
});
test('gravity happens after removal and creates new horizontal moves', () => {
  const s = fromRows(['#..', '.#.', '..#'], 'gravity');
  assert.deepEqual(rowsOf(applyMove(s, [0])), ['...', '...', '.##']);
  assert(generateLegalMoves(applyMove(s, [0])).some(m => m.join(',') === '7,8'));
});
test('gravity solver agrees with independent bitmask oracle on all 3×3 states', () => {
  const cache = new Map();
  function oracle(mask) {
    if (!mask) return false;
    if (cache.has(mask)) return cache.get(mask);
    const children = [];
    for (let a = 0; a < 9; a++) for (let b = a; b < 9; b++) {
      const row = Math.floor(a / 3) === Math.floor(b / 3), col = a % 3 === b % 3;
      if (!row && !col) continue;
      let cut = 0;
      for (let i = a; i <= b; i += row ? 1 : 3) cut |= 1 << i;
      if ((mask & cut) !== cut) continue;
      const remaining = mask ^ cut;
      let fallen = 0;
      for (let c = 0; c < 3; c++) {
        let count = 0;
        for (let r = 0; r < 3; r++) if (remaining & (1 << (r * 3 + c))) count++;
        for (let r = 3 - count; r < 3; r++) fallen |= 1 << (r * 3 + c);
      }
      children.push(fallen);
    }
    const win = children.some(next => !oracle(next)); cache.set(mask, win); return win;
  }
  const solver = new Solver();
  for (let mask = 0; mask < 512; mask++) {
    const s = createState(3, 3, Array.from({ length: 9 }, (_, i) => i).filter(i => mask & (1 << i)), 'gravity');
    assert.equal(solver.solve(s).winning, oracle(mask), `mask ${mask}`);
  }
});
test('one-column boards enumerate every contiguous vertical move exactly once', () => {
  const s = fromRows(['#', '#', '#'], 'gravity');
  assert.equal(generateLegalMoves(s).length, 6);
  assert.equal(new Set(generateLegalMoves(s).map(m => m.join(','))).size, 6);
});
