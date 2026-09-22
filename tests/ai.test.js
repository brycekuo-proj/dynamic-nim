import test from 'node:test';
import assert from 'node:assert/strict';
import { AIController } from '../src/game/AIController.js';
import { GameController } from '../src/game/GameController.js';
import { SaveStore } from '../src/game/SaveStore.js';
import { Solver } from '../src/domain/Solver.js';
import { generateLegalMoves } from '../src/domain/MoveGenerator.js';
import { isLegalMove } from '../src/domain/RuleEngine.js';
import { applyMove } from '../src/domain/TransformationSystem.js';
import { stateId } from '../src/domain/GameState.js';
import { levels } from '../src/levels/index.js';

test('AI is legal, deterministic and optimal throughout every reachable level state', () => {
  const solver = new Solver(), ai = new AIController(solver), seen = new Set();
  function visit(state) {
    if (seen.has(stateId(state))) return;
    seen.add(stateId(state));
    const result = solver.solve(state), move = ai.choose(state);
    assert.deepEqual(ai.choose(state), move);
    if (!state.mask) { assert.equal(move, null); return; }
    assert(isLegalMove(state, move));
    const child = solver.solve(applyMove(state, move));
    if (result.winning) assert.equal(child.winning, false);
    assert.equal(child.depth + 1, result.depth);
    for (const legal of generateLegalMoves(state)) visit(applyMove(state, legal));
  }
  levels.forEach(level => visit(level.initial));
  assert(seen.size > 8000);
});
test('full controller play wins all ten levels against perfect AI and unlocks L10', async () => {
  const solver = new Solver(), ai = new AIController(solver), save = new SaveStore({ getItem:()=>null, setItem() {} });
  const renderer = { draw() {}, cancel() {}, async animate() {}, async pause() {} };
  const game = new GameController({ levels, solver, save, renderer, ai });
  for (const level of levels) {
    assert(game.load(level.id));
    while (game.phase !== 'ended') {
      assert.equal(game.turn, 'player');
      await game.play(solver.solve(game.state).optimalMove);
    }
    assert.equal(game.winner, 'player');
    assert.equal(game.history.length, solver.solve(level.initial).depth);
    assert.equal(game.history.at(-1).actor, 'player');
  }
  assert.equal(save.data.highestUnlocked, 10); assert.equal(save.data.completed.length,10);
});
test('losing move lets AI win without awarding unlocks', async () => {
  const solver = new Solver(), save = new SaveStore({ getItem:()=>null, setItem() {} }); save.complete(1);
  const game = new GameController({ levels, solver, save, ai:new AIController(solver), renderer:{ draw(){},cancel(){},async animate(){},async pause(){} } });
  game.load(2); await game.play([0]);
  assert.equal(game.winner,'ai'); assert.equal(save.data.highestUnlocked,2); assert.equal(game.history.length,2);
});
test('restart while AI is thinking cancels its scheduled response', async () => {
  let resume;
  const solver = new Solver(), save = new SaveStore({ getItem:()=>null,setItem(){} }); save.complete(1);
  const game = new GameController({ levels, solver, save, ai:new AIController(solver), renderer:{ draw(){},cancel(){},async animate(){},pause:()=>new Promise(r=>{resume=r;}) } });
  game.load(2); const pending = game.play([0]);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(game.phase,'thinking'); game.load(2); resume(); await pending;
  assert.equal(game.turn,'player'); assert.equal(game.phase,'ready'); assert.equal(game.history.length,0);
});
