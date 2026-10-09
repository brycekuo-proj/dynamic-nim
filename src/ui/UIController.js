import { cellsOf, stateId } from '../domain/GameState.js';
import { nimAnalysis } from '../domain/Nim.js';
import { describeMove } from '../domain/Move.js';
const $ = id => document.getElementById(id);
export class UIController {
  constructor(game, save, levels) {
    Object.assign(this, { game, save, levels }); this.math = false; this.chapterEpoch = 0;
    $('restart-button').onclick = () => this.restart();
    $('math-button').onclick = () => this.toggleMath();
    document.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) this.toggleMath(); });
    $('effects-button').onclick = () => { save.setEffects(!save.data.settings.effects); this.effects(); };
    $('hint-button').onclick = () => { $('hint').hidden = !$('hint').hidden; $('hint-button').setAttribute('aria-expanded', String(!$('hint').hidden)); };
    $('next-button').onclick = () => this.next();
    $('analyze-button').onclick = () => { $('analysis').hidden = !$('analysis').hidden; };
    $('levels-button').onclick = () => { this.menu(); $('level-dialog').showModal(); };
    $('close-levels').onclick = () => $('level-dialog').close();
    $('mission-track').replaceChildren(...levels.map((_, i) => {
      const pip = document.createElement('span'); pip.title = `關卡 ${String(i + 1).padStart(2, '0')}`;
      return pip;
    }));
    this.effects();
  }
  effects() { document.body.classList.toggle('effects-off', !this.save.data.settings.effects); $('effects-button').textContent = this.save.data.settings.effects ? 'CRT ON' : 'CRT OFF'; $('effects-button').setAttribute('aria-pressed', String(this.save.data.settings.effects)); }
  reset() {
    this.chapterEpoch++; $('chapter-transition').hidden = true;
    this.input?.cancel(); $('hint').hidden = true; $('hint-button').setAttribute('aria-expanded', 'false'); $('analysis').hidden = true;
  }
  load(id) { this.reset(); this.game.load(id); }
  loadBook(level) { this.reset(); this.game.start(level); }
  restart() { return this.game.level.book ? this.loadBook(this.game.level) : this.load(this.game.level.id); }
  async next() {
    const g = this.game;
    if (g.winner !== 'player') return this.restart();
    if (g.level.book) return this.load(this.save.data.currentLevel);
    if (g.level.id === 10) { this.menu(); $('level-dialog').showModal(); return; }
    if (g.level.id === 5) {
      const epoch = ++this.chapterEpoch;
      $('chapter-transition').hidden = false; $('next-button').disabled = true;
      await new Promise(resolve => setTimeout(resolve, 1800));
      if (epoch !== this.chapterEpoch) return;
    }
    this.load(g.level.id + 1);
  }
  toggleMath() { this.math = !this.math; $('math').hidden = !this.math; $('math-button').setAttribute('aria-pressed', String(this.math)); this.update(this.game); }
  menu() {
    $('level-list').replaceChildren(...this.levels.map(level => {
      const button = document.createElement('button');
      const unlocked = level.id <= this.save.data.highestUnlocked;
      button.textContent = `${String(level.id).padStart(2, '0')}  ${level.name}  ${this.save.data.completed.includes(level.id) ? '✓' : unlocked ? '→' : '· LOCKED'}`;
      button.disabled = !unlocked;
      button.className = ['level-tile', level.id === this.game.level.id ? 'current' : '', this.save.data.completed.includes(level.id) ? 'completed' : ''].filter(Boolean).join(' ');
      button.onclick = () => { $('level-dialog').close(); this.load(level.id); };
      return button;
    }));
  }
  update(g) {
    const l = g.level;
    $('level-number').textContent = l.book ? 'BK' : String(l.id).padStart(2, '0'); $('level-name').textContent = l.name;
    $('chapter').textContent = l.book ? `NIM PUZZLE BOOK / ${l.world === 'static' ? 'STATIC' : 'GRAVITY'}` : l.world === 'static' ? 'CHAPTER I / EQUILIBRIUM' : 'CHAPTER II / A SHIFT IN THE WORLD';
    $('world').textContent = l.world === 'static' ? 'STATIC ─' : 'GRAVITY ↓';
    $('lesson').textContent = l.lesson; $('hint').textContent = l.hint;
    $('progress').textContent = `${String(this.save.data.highestUnlocked).padStart(2, '0')} / 10`;
    $('mission-track').querySelectorAll('span').forEach((pip, index) => {
      const id = index + 1;
      pip.classList.toggle('unlocked', id <= this.save.data.highestUnlocked);
      pip.classList.toggle('completed', this.save.data.completed.includes(id));
    });
    document.querySelector('.mission-card .card-eyebrow span:last-child').textContent = `${String(this.save.data.completed.length).padStart(2, '0')} / 10`;
    $('piece-count').textContent = `${String(cellsOf(g.state).length).padStart(2, '0')} CIRCLES`;
    $('status').textContent = g.phase === 'ended' ? (g.winner === 'player' ? '● SIGNAL RESOLVED / 你獲勝' : '○ COMPUTER WINS / 再試一次') : g.phase === 'animating' ? (g.turn === 'ai' ? 'COMPUTER → REMOVE → TRANSFORM' : 'REMOVE → TRANSFORM') : g.turn === 'ai' ? '○ COMPUTER THINKING' : '● YOUR TURN / 輪到你';
    $('board').dataset.phase = g.phase; $('board').dataset.turn = g.turn; $('board').dataset.level = l.id;
    $('board').setAttribute('aria-disabled', String(g.phase !== 'ready' || g.turn !== 'player'));
    $('outcome').hidden = g.phase !== 'ended';
    $('outcome-text').textContent = l.book ? (g.winner === 'player' ? 'You solved it and beat the computer. / 你解開這一題，也擊敗了電腦。' : 'The computer took the last circle. Think again, then retry. / 電腦拿走了最後一顆。再想一次，重新挑戰。') : g.winner === 'player' ? (l.id === 10 ? '十個訊號已解開。下一個世界，仍等待你。' : l.id === 5 ? '平衡已建立。但世界即將改變。' : '你拿走了最後一顆。訊號已解開。') : '電腦拿走了最後一顆。重新開始，試著留下不同的局面。';
    $('next-button').textContent = g.winner !== 'player' ? '重新挑戰 ↺' : l.book ? '進入主線關卡 →' : l.id === 10 ? '返回關卡 →' : l.id === 5 ? '進入 GRAVITY ↓' : '下一關 →';
    $('next-button').disabled = false;
    if (!this.save.available) $('progress').textContent += ' · 暫存模式';
    if (this.math) {
      const a = g.solver.analyze(g.state), nim = nimAnalysis(g.state);
      $('math-data').textContent = [`LEVEL          ${l.id} / ${l.name}`, `STATE ID       ${stateId(g.state)}`, `PIECE COUNT    ${cellsOf(g.state).length}`, `TO MOVE        ${g.phase === 'ended' ? 'TERMINAL (no next turn)' : g.turn.toUpperCase()}`, `STATE          ${a.winning ? 'N / WINNING' : 'P / LOSING'}`, `LEGAL MOVES    ${a.legalMoves}`, `WINNING MOVES  ${a.winningMoves.length}`, `LOSING MOVES   ${a.losingMoves.length}`, `AI EVALUATION  ${a.winning ? 'Can force win as next player' : 'No forced win as next player'}`, `OPTIMAL        ${a.optimalMove ? describeMove(g.state, a.optimalMove) : '—'}`, `DEPTH          ${a.depth} plies (optimal adversarial)`, ...(nim ? [`HEAPS          ${nim.heaps.join(' / ') || '0'}`, `GRUNDY         ${nim.grundies.join(' / ') || '0'}`, `NIM SUM        ${nim.xor}`] : ['NIM SUM        N/A — game-tree evaluation']), `WINNING LINES  ${a.winningMoves.map(m => describeMove(g.state, m.move)).join(' ; ') || '—'}`].join('\n');
    }
    $('trace').replaceChildren(...g.history.map(entry => { const li = document.createElement('li'); li.textContent = `${entry.actor.toUpperCase()} ${describeMove(entry.before, entry.move)} · ${entry.beforeOutcome} → ${entry.afterOutcome}${entry.nimAfter ? ` · XOR ${entry.nimAfter.xor}` : ''}`; return li; }));
  }
}
