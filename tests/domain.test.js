import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, fromRows, cellsOf, stateId } from '../src/domain/GameState.js';
import { isLegalMove, removePieces, lineBetween } from '../src/domain/RuleEngine.js';
import { generateLegalMoves } from '../src/domain/MoveGenerator.js';
import { applyMove } from '../src/domain/TransformationSystem.js';
import { Solver } from '../src/domain/Solver.js';
import { nimAnalysis, straightRunGrundy } from '../src/domain/Nim.js';

test('rules allow horizontal, vertical and 45-degree lines while rejecting gaps, bends, duplicates and over-limit moves', () => {
  const s = fromRows(['###', '#.#']);
  for (const move of [[], [0, 0], [0, 4], [3, 5], [2, 3], [-1], [6]]) assert.equal(isLegalMove(s, move), false);
  for (const move of [[2, 1, 0], [0, 3], [5]]) assert.equal(isLegalMove(s, move), true);
  assert.deepEqual(lineBetween(s, 0, 2), [0, 1, 2]);
  assert.deepEqual(lineBetween(s, 3, 5), []);
  assert.throws(() => removePieces(s, [3, 5]));
  assert.equal(cellsOf(s).length, 5);
  const diagonals = fromRows(['#.#', '.#.', '#.#']);
  assert.equal(isLegalMove(diagonals, [0, 4, 8]), true);
  assert.equal(isLegalMove(diagonals, [2, 4, 6]), true);
  assert.deepEqual(lineBetween(diagonals, 0, 8), [0, 4, 8]);
  assert.deepEqual(lineBetween(diagonals, 2, 6), [2, 4, 6]);
  const long = fromRows(['####']);
  assert.equal(isLegalMove(long, [0, 1, 2, 3]), false);
  assert.deepEqual(lineBetween(long, 0, 3), []);
  assert(generateLegalMoves(long).every(move => move.length <= 3));
});
test('generator exactly matches independently enumerated valid subsets on all 3×2 boards', () => {
  for (let mask = 0; mask < 64; mask++) {
    const cells = Array.from({ length: 6 }, (_, i) => i).filter(i => mask & (1 << i));
    const s = createState(3, 2, cells), expected = [];
    for (let sub = 1; sub < 64; sub++) {
      const move = cells.filter(i => sub & (1 << i));
      if ((sub & mask) !== sub || move.length > 3) continue;
      const points = move.map(i => ({ row: Math.floor(i / 3), col: i % 3 }));
      const first = points[0], rows = points.map(p => p.row).sort((a,b)=>a-b), cols = points.map(p => p.col).sort((a,b)=>a-b);
      const consecutive = values => values.every((v,i) => !i || v === values[i-1] + 1);
      const row = points.every(p => p.row === first.row) && consecutive(cols);
      const col = points.every(p => p.col === first.col) && consecutive(rows);
      const diagDown = points.every(p => p.row - p.col === first.row - first.col) && consecutive(rows);
      const diagUp = points.every(p => p.row + p.col === first.row + first.col) && consecutive(rows);
      if (row || col || diagDown || diagUp) expected.push(move.join(','));
    }
    assert.deepEqual(generateLegalMoves(s).map(m => m.join(',')).sort(), expected.sort());
  }
});
test('solver agrees with independent brute-force oracle for all 3×2 static states', () => {
  const solver = new Solver(), memo = new Map();
  function oracle(mask) {
    if (!mask) return false;
    if (memo.has(mask)) return memo.get(mask);
    const options = [];
    for (let sub = mask; sub; sub = (sub - 1) & mask) {
      const move = Array.from({ length: 6 }, (_, i) => i).filter(i => sub & (1 << i));
      if (move.length > 3) continue;
      const points = move.map(i => ({ row: Math.floor(i / 3), col: i % 3 })), first = points[0];
      const rows = points.map(p => p.row).sort((a,b)=>a-b), cols = points.map(p => p.col).sort((a,b)=>a-b);
      const consecutive = values => values.every((v,i) => !i || v === values[i-1] + 1);
      const straight = (points.every(p => p.row === first.row) && consecutive(cols))
        || (points.every(p => p.col === first.col) && consecutive(rows))
        || (points.every(p => p.row - p.col === first.row - first.col) && consecutive(rows))
        || (points.every(p => p.row + p.col === first.row + first.col) && consecutive(rows));
      if (straight) options.push(mask ^ sub);
    }
    const win = options.some(next => !oracle(next)); memo.set(mask, win); return win;
  }
  for (let mask = 0; mask < 64; mask++) {
    const s = createState(3, 2, Array.from({ length: 6 }, (_, i) => i).filter(i => mask & (1 << i)));
    const result = solver.solve(s);
    assert.equal(result.winning, oracle(mask));
    if (mask) assert.equal(solver.continuation(s).length, result.depth);
  }
});
test('isolated runs of lengths 1–5 agree with solver and remain certified', () => {
  const solver = new Solver();
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) {
    const s = fromRows(['#'.repeat(a).padEnd(5, '.'), '.....', '#'.repeat(b).padEnd(5, '.')]);
    assert.equal(solver.solve(s).winning, nimAnalysis(s).xor !== 0);
    for (const move of generateLegalMoves(s)) {
      const next = applyMove(s, move);
      assert.equal(solver.solve(next).winning, nimAnalysis(next).xor !== 0);
    }
  }
});
test('state keys include rules and dimensions; invalid states rejected', () => {
  assert.notEqual(stateId(createState(2, 2, [0])), stateId(createState(2, 2, [0], 'gravity')));
  assert.notEqual(stateId(createState(2, 2, [0])), stateId(createState(4, 1, [0])));
  assert.throws(() => createState(2, 2, [0, 0]));
  assert.throws(() => fromRows(['#.', '#']));
});

test('arbitrary straight lengths are certified; bends, branches, crosses and gravity are not', () => {
  for (const n of [3, 4, 6, 16, 64]) {
    for (const rows of [['#'.repeat(n)], Array(n).fill('#')]) {
      assert.deepEqual(nimAnalysis(fromRows(rows)), {
        certificate: 'isolated-8-neighbor-straight-lines-max3-v4', heaps: [n], grundies: [straightRunGrundy(n)], xor: straightRunGrundy(n),
      });
    }
  }
  assert.deepEqual(nimAnalysis(fromRows(['#..', '.#.', '..#'])), {
    certificate: 'isolated-8-neighbor-straight-lines-max3-v4', heaps: [3], grundies: [straightRunGrundy(3)], xor: straightRunGrundy(3),
  });
  assert.deepEqual(nimAnalysis(fromRows(['..#', '.#.', '#..'])), {
    certificate: 'isolated-8-neighbor-straight-lines-max3-v4', heaps: [3], grundies: [straightRunGrundy(3)], xor: straightRunGrundy(3),
  });
  for (const rows of [['##', '#.'], ['###', '.#.'], ['.#.', '###', '.#.']]) assert.equal(nimAnalysis(fromRows(rows)), null);
  assert.equal(nimAnalysis(fromRows(['##'], 'gravity')), null);
});

test('all certified 3×3 boards and all length-8 run subsets match recursive Grundy and solver', () => {
  const solver = new Solver(), memo = new Map();
  function grundy(state) {
    const id = stateId(state);
    if (memo.has(id)) return memo.get(id);
    const options = new Set(generateLegalMoves(state).map(move => grundy(applyMove(state, move))));
    let value = 0;
    while (options.has(value)) value++;
    memo.set(id, value);
    return value;
  }
  for (const [width, height] of [[3, 3], [8, 1], [1, 8]]) {
    for (let mask = 0; mask < 2 ** (width * height); mask++) {
      const state = createState(width, height, Array.from({length: width * height}, (_, i) => i).filter(i => mask & (1 << i)));
      const nim = nimAnalysis(state);
      if (!nim) continue;
      assert.equal(nim.xor, grundy(state), stateId(state));
      assert.equal(solver.solve(state).winning, nim.xor !== 0);
      for (const move of generateLegalMoves(state)) {
        const next = applyMove(state, move), child = nimAnalysis(next);
        assert(child, 'straight-run certificate is closed under legal removal');
        assert.equal(child.xor, grundy(next));
        assert.equal(solver.solve(next).winning, child.xor !== 0);
      }
    }
  }
});
