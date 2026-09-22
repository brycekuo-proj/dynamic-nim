import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, fromRows, cellsOf, stateId } from '../src/domain/GameState.js';
import { isLegalMove, removePieces, lineBetween } from '../src/domain/RuleEngine.js';
import { generateLegalMoves } from '../src/domain/MoveGenerator.js';
import { applyMove } from '../src/domain/TransformationSystem.js';
import { Solver } from '../src/domain/Solver.js';
import { nimAnalysis } from '../src/domain/Nim.js';

test('rules reject gaps, diagonals, duplicates, wrapping and empty moves', () => {
  const s = fromRows(['###', '#.#']);
  for (const move of [[], [0, 0], [0, 4], [3, 5], [2, 3], [-1], [6]]) assert.equal(isLegalMove(s, move), false);
  for (const move of [[2, 1, 0], [0, 3], [5]]) assert.equal(isLegalMove(s, move), true);
  assert.deepEqual(lineBetween(s, 0, 2), [0, 1, 2]);
  assert.deepEqual(lineBetween(s, 3, 5), []);
  assert.throws(() => removePieces(s, [3, 5]));
  assert.equal(cellsOf(s).length, 5);
});
test('generator exactly matches independently enumerated valid subsets on all 3×2 boards', () => {
  for (let mask = 0; mask < 64; mask++) {
    const cells = Array.from({ length: 6 }, (_, i) => i).filter(i => mask & (1 << i));
    const s = createState(3, 2, cells), expected = [];
    for (let sub = 1; sub < 64; sub++) {
      const move = cells.filter(i => sub & (1 << i));
      if ((sub & mask) !== sub) continue;
      const row = move.every(i => Math.floor(i / 3) === Math.floor(move[0] / 3));
      const col = move.every(i => i % 3 === move[0] % 3);
      if ((row && move.at(-1) - move[0] + 1 === move.length) || (col && (move.at(-1) - move[0]) / 3 + 1 === move.length)) expected.push(move.join(','));
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
    for (let a = 0; a < 6; a++) for (let b = a; b < 6; b++) {
      const sameRow = Math.floor(a / 3) === Math.floor(b / 3), sameCol = a % 3 === b % 3;
      if (!sameRow && !sameCol) continue;
      let selected = 0;
      for (let i = a; i <= b; i += sameRow ? 1 : 3) selected |= 1 << i;
      if ((mask & selected) === selected) options.push(mask ^ selected);
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
    assert.equal(solver.solve(s).winning, (a ^ b) !== 0);
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
        certificate: 'isolated-straight-lines-v2', heaps: [n], xor: n,
      });
    }
  }
  for (const rows of [['##', '#.'], ['###', '.#.'], ['.#.', '###', '.#.']]) {
    assert.equal(nimAnalysis(fromRows(rows)), null);
  }
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
