import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle, generateDuoBoard, DIFFICULTIES, hashSeed, todayKey } from '../src/game/Generator.js';
import { Solver } from '../src/domain/Solver.js';
import { cellsOf } from '../src/domain/GameState.js';
import { gravityDown } from '../src/domain/TransformationSystem.js';
import { SaveStore } from '../src/game/SaveStore.js';
import { KEYS, LEVEL_TEXT_EN } from '../src/i18n.js';
import { levelSets } from '../src/levels/index.js';

test('generated puzzles are deterministic, winnable for the player and as tight as their difficulty', () => {
  for (const mode of ['normal', 'misere']) {
    const solver = new Solver({ mode });
    for (const difficulty of Object.keys(DIFFICULTIES)) {
      for (let n = 1; n <= 8; n++) {
        const seed = hashSeed(`endless:${mode}:${difficulty}:${n}`);
        const a = generatePuzzle({ mode, difficulty, seed, solver, number: n });
        const b = generatePuzzle({ mode, difficulty, seed, solver: new Solver({ mode }), number: n });
        assert.deepEqual(a.rows, b.rows, 'same seed, same puzzle');
        const analysis = solver.analyze(a.initial);
        assert(analysis.winning, `${mode}/${difficulty}/${n}: the player must have a forced win`);
        assert(analysis.winningMoves.length <= DIFFICULTIES[difficulty].maxWinning + 1);
        assert.equal(a.winningCount, analysis.winningMoves.length);
        assert.equal(a.mode, mode); assert.equal(a.kind, 'endless');
        if (a.world === 'gravity') assert.equal(gravityDown(a.initial).state.mask, a.initial.mask, 'gravity boards start settled');
      }
    }
  }
});

test('two-player boards come in three sizes with enough pieces', () => {
  for (const size of ['small', 'medium', 'large']) for (let seed = 1; seed < 20; seed++) {
    const board = generateDuoBoard({ size, seed });
    assert.equal(board.kind, 'duo'); assert(cellsOf(board.initial).length >= 2);
  }
  assert(cellsOf(generateDuoBoard({ size: 'large', seed: 3 }).initial).length > cellsOf(generateDuoBoard({ size: 'small', seed: 3 }).initial).length);
});

test('endless progress and the daily streak are saved per rule', () => {
  const map = new Map(), storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) };
  const save = new SaveStore(storage);
  save.recordPuzzle({ kind: 'endless', mode: 'misere', difficulty: 'hard', number: 3 });
  save.recordPuzzle({ kind: 'endless', mode: 'misere', difficulty: 'hard', number: 2 });
  save.recordPuzzle({ kind: 'daily', mode: 'normal', date: '2026-10-27' });
  save.recordPuzzle({ kind: 'daily', mode: 'normal', date: '2026-10-28' });
  save.recordPuzzle({ kind: 'daily', mode: 'normal', date: '2026-10-28' });
  const restored = new SaveStore(storage);
  assert.equal(restored.data.endless.misere.hard, 3); assert.equal(restored.data.endless.normal.hard, 0);
  assert.deepEqual(restored.data.daily.normal, { last: '2026-10-28', streak: 2, best: 2 });
  save.recordPuzzle({ kind: 'daily', mode: 'normal', date: '2026-10-31' });
  assert.equal(save.data.daily.normal.streak, 1); assert.equal(save.data.daily.normal.best, 2);
  // Older saves without these fields still load.
  map.set('dynamic-nim:v1', JSON.stringify({ highestUnlocked: 3, currentLevel: 2, completed: [1, 2], settings: { effects: true } }));
  const old = new SaveStore(storage);
  assert.equal(old.data.endless.normal.easy, 0); assert.equal(old.data.settings.lang, null); assert.equal(old.data.settings.music, true); assert.equal(old.progress.currentLevel, 2);
  assert.match(todayKey(new Date(2026, 0, 5)), /^2026-01-05$/);
});

test('every Chinese text has an English version, including all twenty level lessons and hints', () => {
  assert.deepEqual([...KEYS.en].sort(), [...KEYS.zh].sort());
  for (const mode of ['normal', 'misere']) for (const level of levelSets[mode]) {
    const en = LEVEL_TEXT_EN[`${mode}:${level.id}`];
    assert(en && en[0] && en[1], `missing English text for ${mode}:${level.id}`);
  }
});
