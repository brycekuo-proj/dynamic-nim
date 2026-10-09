import { cellsOf, stateId } from '../domain/GameState.js';
import { nimAnalysis } from '../domain/Nim.js';
import { moveName, CHIP_COLORS } from './Renderer.js';
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
export class UIController {
  constructor(game, save, levels, sound = null) {
    Object.assign(this, { game, save, levels, sound }); this.math = false; this.chapterEpoch = 0; this.announced = null;
    $('sound-button').onclick = () => { save.setSound(!save.data.settings.sound); this.effects(); this.sound?.play('click'); };
    document.addEventListener('click', e => { if (e.target.closest('button') && e.target.closest('button').id !== 'sound-button') this.sound?.play('click', 0.5); });
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
      const pip = document.createElement('span'); pip.title = `關卡 ${pad(i + 1)}`;
      pip.dataset.color = CHIP_COLORS[i % CHIP_COLORS.length];
      return pip;
    }));
    // Rules start open where there is room beside the board, folded on phones.
    try { $('rules').open = matchMedia('(min-width: 900px)').matches; } catch { /* no matchMedia */ }
    this.effects();
  }
  effects() {
    const on = this.save.data.settings.effects;
    document.body.classList.toggle('effects-off', !on);
    $('effects-button').textContent = on ? '動畫 開' : '動畫 關';
    $('effects-button').setAttribute('aria-pressed', String(on));
    const sound = this.save.data.settings.sound;
    $('sound-button').textContent = sound ? '音效 開' : '音效 關';
    $('sound-button').setAttribute('aria-pressed', String(sound));
  }
  // A one-off celebration: Kenney chips burst out of the mat.
  burst() {
    if (!this.save.data.settings.effects || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('burst'); box.replaceChildren();
    const base = `${import.meta.env.BASE_URL}assets/kenney/`;
    for (let i = 0; i < 16; i++) {
      const img = document.createElement('img');
      img.src = `${base}chip-${CHIP_COLORS[i % CHIP_COLORS.length]}.png`; img.alt = '';
      box.append(img);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, dist = 140 + Math.random() * 160;
      const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
      img.animate([
        { transform: 'translate(-50%,-50%) scale(.4) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${Math.random() * 540 - 270}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy + 260}px)) scale(.9) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
      ], { duration: 1300 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
    }
    setTimeout(() => box.replaceChildren(), 2000);
  }
  // Sounds and the burst play once per finished game or first-move verdict.
  announce(g, verdict) {
    const key = g.phase === 'ended' ? `${g.epoch}:end` : `${g.epoch}:verdict`;
    if (this.announced?.has(key) && this.announced.epoch === g.epoch) return;
    if (this.announced?.epoch !== g.epoch) this.announced = Object.assign(new Set(), { epoch: g.epoch });
    this.announced.add(key);
    if (g.phase === 'ended') {
      if (g.winner === 'player') { this.sound?.play('win', 0.8); this.burst(); } else this.sound?.play('wrong', 0.8);
    } else if (verdict) this.sound?.play(verdict.ok ? 'right' : 'wrong', 0.7);
  }
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
      const done = this.save.data.completed.includes(level.id);
      button.innerHTML = `<span class="tile-num">${pad(level.id)}</span><span class="tile-name"></span><span class="tile-state">${done ? '完成' : unlocked ? '' : '未解鎖'}</span>`;
      button.querySelector('.tile-name').textContent = level.name;
      button.disabled = !unlocked;
      button.className = ['level-tile', level.id === this.game.level.id ? 'current' : '', done ? 'completed' : '', level.world].filter(Boolean).join(' ');
      button.onclick = () => { $('level-dialog').close(); this.load(level.id); };
      return button;
    }));
  }
  status(g) {
    if (g.phase === 'ended') return g.winner === 'player' ? '你獲勝' : '電腦獲勝';
    if (g.phase === 'animating') return g.turn === 'ai' ? '電腦正在拿走圓圈' : '拿走圓圈';
    return g.turn === 'ai' ? '電腦思考中' : '輪到你';
  }
  // Book puzzles: say right after the first move whether it was the winning one.
  verdict(g) {
    const first = g.history[0];
    if (!g.level.book || !first || first.actor !== 'player') return null;
    return first.afterOutcome === 'P'
      ? { ok: true, text: `第一步 ${moveName(first.before, first.move)} 正確。接下來每一步都要守住。` }
      : { ok: false, text: `第一步 ${moveName(first.before, first.move)} 不是正解：電腦現在有必勝走法。可以重新開始，或下完看看。` };
  }
  update(g) {
    const l = g.level;
    $('level-number').textContent = l.book ? '書' : pad(l.id); $('level-name').textContent = l.book ? `第 ${l.puzzle} 題` : l.name;
    $('chapter').textContent = l.book ? `謎題書 · ${l.world === 'static' ? '靜態' : '重力'}` : l.world === 'static' ? '第一章 · 靜態' : '第二章 · 重力';
    $('world').textContent = l.world === 'static' ? '靜態' : '↓ 重力';
    $('world').dataset.world = l.world;
    $('lesson').textContent = l.lesson; $('hint').textContent = l.hint;
    $('progress').textContent = `${pad(this.save.data.highestUnlocked)} / 10`;
    $('mission-track').querySelectorAll('span').forEach((pip, index) => {
      const id = index + 1;
      pip.classList.toggle('unlocked', id <= this.save.data.highestUnlocked);
      pip.classList.toggle('completed', this.save.data.completed.includes(id));
      pip.classList.toggle('current', !l.book && id === l.id);
    });
    $('completed-count').textContent = `${pad(this.save.data.completed.length)} / 10 完成`;
    $('piece-count').textContent = `剩 ${cellsOf(g.state).length} 顆`;
    $('status').textContent = this.status(g);
    $('status').dataset.turn = g.phase === 'ended' ? (g.winner === 'player' ? 'won' : 'lost') : g.turn;
    $('board').dataset.phase = g.phase; $('board').dataset.turn = g.turn; $('board').dataset.level = l.id;
    $('board').setAttribute('aria-disabled', String(g.phase !== 'ready' || g.turn !== 'player'));
    const verdict = this.verdict(g);
    $('verdict').hidden = !verdict;
    if (verdict) { $('verdict').textContent = verdict.text; $('verdict').dataset.ok = String(verdict.ok); }
    if (g.phase === 'ended' || (verdict && g.phase !== 'animating')) this.announce(g, verdict);
    $('outcome').hidden = g.phase !== 'ended';
    $('outcome-text').textContent = l.book
      ? (g.winner === 'player' ? `你解開第 ${l.puzzle} 題，也贏了電腦。` : '電腦拿走了最後一顆。回到書上再想一次。')
      : g.winner === 'player'
        ? (l.id === 10 ? '十關全破。重力也難不倒你。' : l.id === 5 ? '第一章完成。接下來，世界會開始往下掉。' : '你拿走了最後一顆。')
        : '電腦拿走了最後一顆。試著留下不同的局面。';
    $('next-button').textContent = g.winner !== 'player' ? '重新挑戰 ↺' : l.book ? '前往主線關卡 →' : l.id === 10 ? '選擇關卡 →' : l.id === 5 ? '進入第二章 ↓' : '下一關 →';
    $('next-button').disabled = false;
    if (!this.save.available) $('progress').textContent += ' · 暫存';
    if (this.math) {
      const a = g.solver.analyze(g.state), nim = nimAnalysis(g.state);
      $('math-data').textContent = [`LEVEL          ${l.id} / ${l.name}`, `STATE ID       ${stateId(g.state)}`, `PIECE COUNT    ${cellsOf(g.state).length}`, `TO MOVE        ${g.phase === 'ended' ? 'TERMINAL (no next turn)' : g.turn.toUpperCase()}`, `STATE          ${a.winning ? 'N / WINNING' : 'P / LOSING'}`, `LEGAL MOVES    ${a.legalMoves}`, `WINNING MOVES  ${a.winningMoves.length}`, `LOSING MOVES   ${a.losingMoves.length}`, `AI EVALUATION  ${a.winning ? 'Can force win as next player' : 'No forced win as next player'}`, `OPTIMAL        ${a.optimalMove ? moveName(g.state, a.optimalMove) : '—'}`, `DEPTH          ${a.depth} plies (optimal adversarial)`, ...(nim ? [`HEAPS          ${nim.heaps.join(' / ') || '0'}`, `GRUNDY         ${nim.grundies.join(' / ') || '0'}`, `NIM SUM        ${nim.xor}`] : ['NIM SUM        N/A — game-tree evaluation']), `WINNING LINES  ${a.winningMoves.map(m => moveName(g.state, m.move)).join(' ; ') || '—'}`].join('\n');
    }
    $('trace').replaceChildren(...g.history.map(entry => { const li = document.createElement('li'); li.textContent = `${entry.actor === 'player' ? '你' : '電腦'} ${moveName(entry.before, entry.move)} · ${entry.beforeOutcome} → ${entry.afterOutcome}${entry.nimAfter ? ` · XOR ${entry.nimAfter.xor}` : ''}`; return li; }));
  }
}
