import test from 'node:test';
import assert from 'node:assert/strict';
import { encodePuzzle, parsePuzzle } from '../src/game/PuzzleLink.js';
import { rowsOf } from '../src/domain/GameState.js';
import { CORE_MOVE_RULES } from '../src/domain/RuleEngine.js';

test('book puzzle links round-trip rows, world and number', () => {
  const rows = ['.#..', '##.#', '####'];
  const code = encodePuzzle(12, rows, 'gravity');
  assert.equal(code, '12-g-.o..-oo.o-oooo');
  const level = parsePuzzle(code);
  assert.equal(level.book, true);
  assert.equal(level.puzzle, 12);
  assert.equal(level.world, 'gravity');
  assert.deepEqual(rowsOf(level.initial), rows);
  assert.strictEqual(level.moveRules, CORE_MOVE_RULES);
});

test('malformed or empty book links are rejected', () => {
  for (const bad of [null, '', '1-x-oo', '1-s-', '1-s-oo-ooo', '1-s-....', 'a-s-oo', '1-s-o#o', '1-s-ooooooooo']) {
    assert.equal(parsePuzzle(bad), null, String(bad));
  }
});
