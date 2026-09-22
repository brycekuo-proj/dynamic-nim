import { isLegalMove } from '../domain/RuleEngine.js';
import { transition } from '../domain/TransformationSystem.js';
import { snapshot } from '../domain/GameState.js';
import { nimAnalysis } from '../domain/Nim.js';
export class GameController {
  constructor({ levels, solver, save, renderer, onChange = () => {}, ai = null }) {
    Object.assign(this, { levels, solver, save, renderer, onChange, ai });
    this.epoch = 0;
  }
  load(id) {
    if (!this.save.select(id)) return false;
    this.epoch++;
    this.renderer.cancel();
    this.level = this.levels[id - 1]; this.state = this.level.initial;
    this.turn = 'player'; this.phase = 'ready'; this.winner = null; this.history = [];
    this.renderer.draw(this.state); this.emit(); return true;
  }
  emit() { this.onChange(this); }
  async play(move, actor = 'player') {
    if (this.phase !== 'ready' || actor !== this.turn || !isLegalMove(this.state, move)) return false;
    const epoch = this.epoch, before = this.state, result = transition(before, move);
    this.phase = 'animating'; this.emit();
    await this.renderer.animate(before, move, result, actor);
    if (epoch !== this.epoch) return false;
    this.state = result.state;
    this.history.push({ actor, initialState: snapshot(this.level.initial), before: snapshot(before), move: [...move], after: snapshot(this.state), beforeOutcome: this.solver.solve(before).winning ? 'N' : 'P', afterOutcome: this.solver.solve(this.state).winning ? 'N' : 'P', nimBefore: nimAnalysis(before), nimAfter: nimAnalysis(this.state) });
    if (!this.state.mask) {
      this.winner = actor; this.phase = 'ended';
      if (actor === 'player') this.save.complete(this.level.id);
      this.emit(); return true;
    }
    this.turn = actor === 'player' ? 'ai' : 'player'; this.phase = 'ready'; this.emit();
    if (this.turn === 'ai' && this.ai) {
      this.phase = 'thinking'; this.emit();
      await this.renderer.pause(420);
      if (epoch !== this.epoch) return false;
      const response = this.ai.choose(this.state);
      this.phase = 'ready';
      return this.play(response, 'ai');
    }
    return true;
  }
}
