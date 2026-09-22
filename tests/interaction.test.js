import test from 'node:test';
import assert from 'node:assert/strict';
import { fromRows } from '../src/domain/GameState.js';
import { Gesture } from '../src/ui/Gesture.js';
import { SaveStore } from '../src/game/SaveStore.js';
import { GameController } from '../src/game/GameController.js';
import { Solver } from '../src/domain/Solver.js';
import { levels } from '../src/levels/index.js';
const storage = () => { const data = new Map(); return { getItem: k => data.get(k), setItem: (k,v) => data.set(k,v) }; };
const renderer = { draw() {}, cancel() {}, async animate() {}, async pause() {} };
test('drag selects skipped intermediate circles but never crosses a gap or diagonal', () => {
  const s = fromRows(['###', '...', '#.#']);
  const straight = new Gesture(s, 0, {x:0,y:0});
  assert.deepEqual(straight.update({x:128,y:0},2), [0,1,2]);
  assert.deepEqual(straight.update({x:64,y:0},1), [0,1]);
  const gap = new Gesture(s, 6, {x:0,y:128});
  assert.deepEqual(gap.update({x:128,y:128},8), []);
  const diagonal = new Gesture(s,0,{x:0,y:0});
  assert.deepEqual(diagonal.update({x:128,y:128},8), []);
  assert.deepEqual(diagonal.update({x:0,y:0},0), []);
  assert.deepEqual(straight.update({x:300,y:0},null), []);
});
test('save persists progression, level and settings and tolerates corruption/blocked storage', () => {
  const mem = storage(), save = new SaveStore(mem);
  assert.equal(save.select(2),false); save.complete(1); save.select(2); save.setEffects(false);
  const restored = new SaveStore(mem); assert.equal(restored.data.currentLevel,2); assert.equal(restored.data.highestUnlocked,2); assert.equal(restored.data.settings.effects,false);
  const corrupt = new SaveStore({ getItem: () => '{broken' }); assert.equal(corrupt.data.currentLevel,1);
  const blocked = new SaveStore({ getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  blocked.complete(1); assert.equal(blocked.data.highestUnlocked,2); assert.equal(blocked.available,false);
});
test('controller applies final move once, awards last mover, and stores analysis history', async () => {
  const game = new GameController({ levels, solver: new Solver(), save:new SaveStore(storage()), renderer });
  game.load(1);
  const first = game.play([0]); assert.equal(await game.play([0]),false); await first;
  assert.equal(game.winner,'player'); assert.equal(game.save.data.highestUnlocked,2);
  assert.equal(game.history.length,1); assert.equal(game.history[0].afterOutcome,'P');
});
test('restarting during animation invalidates the old turn', async () => {
  let finish;
  const game = new GameController({ levels, solver:new Solver(), save:new SaveStore(storage()), renderer:{ ...renderer, animate:()=>new Promise(resolve=>{finish=resolve;}) } });
  game.load(1); const pending = game.play([0]); game.load(1); finish(); await pending;
  assert.equal(game.phase,'ready'); assert.equal(game.history.length,0); assert.equal(game.state.mask,1n);
});
