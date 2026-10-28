import { isLegalMove } from '../domain/RuleEngine.js';
import { transition } from '../domain/TransformationSystem.js';
import { snapshot } from '../domain/GameState.js';
import { nimAnalysis } from '../domain/Nim.js';
export class GameController {
  // levelSets/solvers hold one campaign and one solver per win condition; the
  // plain levels/solver pair is the normal ("last one wins") campaign.
  constructor({ levels, solver, save, renderer, onChange = () => {}, ai = null, levelSets = null, solvers = null }) {
    Object.assign(this, { levels, save, renderer, onChange, ai });
    this.levelSets = levelSets ?? { normal: levels };
    this.solvers = solvers ?? { normal: solver };
    this.epoch = 0;
  }
  get mode() { return this.level?.mode ?? 'normal'; }
  get solver() { return this.solvers[this.mode]; }
  // Level kinds: campaign (default), book, endless, daily, duo. In duo (pass-and-play)
  // two people share the device; the second person uses the 'ai' side internally.
  get kind() { return this.level?.book ? 'book' : this.level?.kind ?? 'campaign'; }
  get opponent() { return this.kind === 'duo' ? 'human' : 'ai'; }
  load(id) {
    if (!this.save.select(id)) return false;
    return this.start(this.levelSets[this.save.mode][id - 1]);
  }
  // Starts any level definition, including book puzzles that are not part of
  // the campaign and never touch saved progress.
  start(level) {
    this.epoch++;
    this.renderer.cancel();
    this.level = level; this.state = this.level.initial;
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
    // XOR certificates only describe normal play; misère is judged by the game tree alone.
    const nim = s => this.mode === 'normal' ? nimAnalysis(s) : null;
    this.history.push({ actor, initialState: snapshot(this.level.initial), before: snapshot(before), move: [...move], after: snapshot(this.state), beforeOutcome: this.solver.solve(before).winning ? 'N' : 'P', afterOutcome: this.solver.solve(this.state).winning ? 'N' : 'P', nimBefore: nim(before), nimAfter: nim(this.state) });
    if (!this.state.mask) {
      // Normal: whoever took the last piece wins. Misère: whoever took it loses.
      const other = actor === 'player' ? 'ai' : 'player';
      this.winner = this.mode === 'misere' ? other : actor; this.phase = 'ended';
      if (this.winner === 'player' && this.kind === 'campaign') this.save.complete(this.level.id);
      if (this.winner === 'player' && (this.kind === 'endless' || this.kind === 'daily')) this.save.recordPuzzle?.(this.level);
      this.emit(); return true;
    }
    this.turn = actor === 'player' ? 'ai' : 'player'; this.phase = 'ready'; this.emit();
    if (this.turn === 'ai' && this.ai && this.opponent === 'ai') {
      this.phase = 'thinking'; this.emit();
      await this.renderer.pause(420);
      if (epoch !== this.epoch) return false;
      const response = this.ai.choose(this.state, this.solver);
      this.phase = 'ready';
      return this.play(response, 'ai');
    }
    return true;
  }
}
