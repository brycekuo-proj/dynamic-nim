import { cellsOf, stateId } from '../domain/GameState.js';
import { nimAnalysis } from '../domain/Nim.js';
import { moveName, PIECE_URL } from './Renderer.js';
import { t, levelText, applyStatic, setLang, getLang, detectLang } from '../i18n.js';
import { generatePuzzle, generateDuoBoard, hashSeed, todayKey } from '../game/Generator.js';
import { isNative, shareText, requestReminderPermission, planReminders } from './Native.js';
const SITE = 'https://brycekuo-proj.github.io/dynamic-nim/';
const starText = n => '⭐'.repeat(n) + '☆'.repeat(3 - n);
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
export class UIController {
  // levelSets: one ten-level campaign per rule ('normal' = last one wins, 'misere' = last one loses).
  constructor(game, save, levelSets, sound = null, ads = null, music = null) {
    if (Array.isArray(levelSets)) levelSets = { normal: levelSets };
    Object.assign(this, { game, save, levelSets, sound, ads, music });
    this.math = false; this.chapterEpoch = 0; this.announced = null; this.panel = 'campaign';
    setLang(save.data.settings.lang ?? detectLang()); applyStatic();
    $('privacy-button').onclick = () => this.ads?.showPrivacyOptions();
    $('lang-button').onclick = () => this.setLanguage(getLang() === 'zh' ? 'en' : 'zh');
    $('sound-button').onclick = () => { save.setSound(!save.data.settings.sound); this.effects(); this.music?.apply(); this.sound?.play('click'); };
    $('music-button').onclick = () => { save.setMusic(!save.data.settings.music); this.effects(); this.music?.apply(); };
    $('menu-lang-button').onclick = () => this.setLanguage(getLang() === 'zh' ? 'en' : 'zh');
    document.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.id !== 'sound-button') this.sound?.play('click', 0.5); });
    $('restart-button').onclick = () => this.restart();
    $('math-button').onclick = () => this.toggleMath();
    document.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest('dialog')) this.toggleMath(); });
    $('effects-button').onclick = () => { save.setEffects(!save.data.settings.effects); this.effects(); };
    $('hint-button').onclick = () => {
      $('hint').hidden = !$('hint').hidden; $('hint-button').setAttribute('aria-expanded', String(!$('hint').hidden));
      if (!$('hint').hidden && this.game.phase !== 'ended') this.game.hintUsed = true; // opening the hint costs a star
    };
    $('share-button').onclick = () => this.shareDaily();
    $('daily-share').onclick = () => this.shareDaily();
    $('remind-prompt').onclick = () => { this.save.setReminder({ asked: true }); this.toggleReminder(true); };
    $('remind-button').onclick = () => this.toggleReminder(!this.save.data.settings.reminder.on);
    $('remind-time').onchange = e => { if (/^\d{2}:\d{2}$/.test(e.target.value)) { this.save.setReminder({ time: e.target.value }); this.planReminders(); } };
    $('board').addEventListener('pointerdown', () => { this.coachSeen = this.game.epoch; $('coach').hidden = true; });
    document.body.classList.toggle('native', isNative());
    $('next-button').onclick = () => this.next();
    $('analyze-button').onclick = () => { $('analysis').hidden = !$('analysis').hidden; };
    $('levels-button').onclick = () => this.openMenu();
    $('mode-chip').onclick = () => this.openMenu();
    for (const card of document.querySelectorAll('.mode-card')) card.onclick = () => this.setMode(card.dataset.mode);
    for (const tab of document.querySelectorAll('.play-tab')) tab.onclick = () => { this.panel = tab.dataset.play; this.menu(); };
    for (const b of document.querySelectorAll('[data-endless]')) b.onclick = () => { $('level-dialog').close(); this.startEndless(b.dataset.endless); };
    for (const b of document.querySelectorAll('[data-duo]')) b.onclick = () => { $('level-dialog').close(); this.startDuo(b.dataset.duo); };
    $('daily-button').onclick = () => { $('level-dialog').close(); this.startDaily(); };
    $('close-levels').onclick = () => $('level-dialog').close();
    $('mission-track').replaceChildren(...Array.from({ length: 10 }, () => document.createElement('span')));
    // Rules start open where there is room beside the board, folded on phones.
    try { $('rules').open = matchMedia('(min-width: 900px)').matches; } catch { /* no matchMedia */ }
    this.effects();
  }
  toast(text) {
    const el = $('toast'); el.textContent = text; el.hidden = false;
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }
  async shareDaily() {
    const mode = this.save.mode, d = this.save.data.daily[mode], date = todayKey();
    if (d.last !== date) return;
    const text = t('share.daily', {
      date: date.slice(5).replace('-', '/'), rule: t(mode === 'misere' ? 'rule.misere' : 'rule.normal'),
      stars: starText(d.lastStars || 1), tries: Math.max(1, d.tries.date === date ? d.tries.n : 1), streak: d.streak, url: SITE,
    });
    const result = await shareText(text);
    if (result === 'copied') this.toast(t('toast.copied')); else if (result === 'failed') this.toast(t('toast.failed'));
  }
  // Reminders: the next week of daily notifications, skipping today once it is solved.
  planReminders() {
    const r = this.save.data.settings.reminder, today = todayKey();
    const solvedToday = ['normal', 'misere'].some(m => this.save.data.daily[m].last === today);
    const streak = Math.max(this.save.data.daily.normal.streak, this.save.data.daily.misere.streak);
    return planReminders({ on: r.on, time: r.time, solvedToday, text: () => ({ title: t('remind.title'), body: streak ? t('remind.bodyStreak', { n: streak }) : t('remind.body') }) });
  }
  async toggleReminder(on) {
    if (on && !(await requestReminderPermission())) { this.save.setReminder({ on: false }); this.effects(); this.toast(t('remind.denied')); return; }
    this.save.setReminder({ on }); this.effects(); await this.planReminders();
    if (on) this.toast(t('remind.set', { time: this.save.data.settings.reminder.time }));
    if (this.game.level) this.update(this.game);
  }
  setLanguage(lang) {
    this.save.setLang(lang); setLang(lang); applyStatic(); this.effects(); void this.planReminders();
    if (this.game.level) this.update(this.game);
    if ($('level-dialog').open) this.menu();
  }
  effects() {
    const on = this.save.data.settings.effects;
    document.body.classList.toggle('effects-off', !on);
    $('effects-button').querySelector('.label').textContent = t(on ? 'btn.anim.on' : 'btn.anim.off');
    $('effects-button').setAttribute('aria-pressed', String(on));
    const sound = this.save.data.settings.sound;
    $('sound-button').querySelector('.label').textContent = t(sound ? 'btn.sound.on' : 'btn.sound.off');
    $('sound-button').setAttribute('aria-pressed', String(sound));
    const music = this.save.data.settings.music;
    $('music-button').querySelector('.label').textContent = t(music ? 'btn.music.on' : 'btn.music.off');
    $('music-button').setAttribute('aria-pressed', String(music));
    const reminder = this.save.data.settings.reminder;
    $('remind-button').querySelector('.label').textContent = t(reminder.on ? 'remind.on' : 'remind.off');
    $('remind-button').setAttribute('aria-pressed', String(reminder.on)); $('remind-time').value = reminder.time;
    for (const id of ['lang-button', 'menu-lang-button']) { $(id).textContent = t('lang.switch'); $(id).lang = getLang() === 'zh' ? 'en' : 'zh-Hant'; }
    const summary = $('rules').querySelector('summary');
    summary.dataset.open = t('rules.close'); summary.dataset.closed = t('rules.open');
  }
  // A one-off celebration: donuts burst out of the gift box.
  burst() {
    if (!this.save.data.settings.effects || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('burst'); box.replaceChildren();
    for (let i = 0; i < 16; i++) {
      const img = document.createElement('img');
      img.src = PIECE_URL; img.alt = '';
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
      // In two-player games somebody always wins, so always celebrate.
      // With music on, Gem Waltz's own win/lose stings play over the ducked loop.
      if (g.kind === 'daily' && g.winner === 'player') void this.planReminders(); // today is solved: skip today's reminder
      if (g.winner === 'player' || g.opponent === 'human') { if (!this.music?.sting('cleared')) this.sound?.play('win', 0.8); this.burst(); }
      else if (!this.music?.sting('gameover')) this.sound?.play('wrong', 0.8);
    } else if (verdict) this.sound?.play(verdict.ok ? 'right' : 'wrong', 0.7);
  }
  reset() {
    this.chapterEpoch++; $('chapter-transition').hidden = true;
    this.input?.cancel(); $('hint').hidden = true; $('hint-button').setAttribute('aria-expanded', 'false'); $('analysis').hidden = true;
  }
  get levels() { return this.levelSets[this.save.mode] ?? this.levelSets.normal; }
  openMenu() {
    const kind = this.game.kind;
    this.panel = kind === 'endless' || kind === 'daily' || kind === 'duo' ? kind : 'campaign';
    this.menu(); $('level-dialog').showModal();
  }
  // Switching the rule keeps each campaign's own progress. In the campaign it resumes
  // where that rule's campaign left off; other ways to play restart with the new rule.
  setMode(mode) {
    if (!this.levelSets[mode] || mode === this.save.mode) { this.menu(); return; }
    this.save.setMode(mode);
    const kind = this.game.kind, level = this.game.level;
    if (kind === 'endless') this.startEndless(level.difficulty);
    else if (kind === 'daily') this.startDaily();
    else if (kind === 'duo') this.startDuo(level.size);
    else this.load(this.save.progress.currentLevel);
    this.menu();
  }
  load(id) { this.reset(); this.game.load(id); }
  loadBook(level) { this.reset(); this.game.start(level); }
  startLevel(level) { this.reset(); this.game.start(level); }
  solverFor(mode) { return this.game.solvers[mode] ?? this.game.solvers.normal; }
  startEndless(difficulty) {
    const mode = this.save.mode, number = this.save.data.endless[mode][difficulty] + 1;
    const seed = hashSeed(`endless:${mode}:${difficulty}:${number}`);
    this.startLevel(generatePuzzle({ mode, difficulty, seed, number, kind: 'endless', solver: this.solverFor(mode) }));
  }
  startDaily() {
    const mode = this.save.mode, date = todayKey();
    this.save.dailyTry(mode, date);
    const level = generatePuzzle({ mode, difficulty: 'normal', seed: hashSeed(`daily:${mode}:${date}`), kind: 'daily', solver: this.solverFor(mode) });
    this.startLevel(Object.freeze({ ...level, date }));
  }
  startDuo(size) {
    const seed = Math.floor(Math.random() * 2 ** 31);
    this.startLevel(generateDuoBoard({ mode: this.save.mode, size, seed }));
  }
  restart() {
    const g = this.game, kind = g.kind;
    if (kind === 'campaign') return this.load(g.level.id);
    if (kind === 'daily') this.save.dailyTry(g.mode, g.level.date);
    return this.startLevel(g.level);
  }
  async next() {
    const g = this.game, kind = g.kind;
    if (kind === 'duo') return this.startDuo(g.level.size);
    if (g.winner !== 'player') return this.restart();
    if (kind === 'book') return this.load(this.save.progress.currentLevel);
    if (kind === 'endless') { await this.ads?.afterLevelWon(3); return this.startEndless(g.level.difficulty); }
    if (kind === 'daily') { this.panel = 'daily'; this.menu(); $('level-dialog').showModal(); return; }
    await this.ads?.afterLevelWon(g.level.id);
    if (g.level.id === 10) { this.panel = 'campaign'; this.menu(); $('level-dialog').showModal(); return; }
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
    const mode = this.save.mode;
    for (const card of document.querySelectorAll('.mode-card')) {
      const m = card.dataset.mode, p = m === 'misere' ? this.save.data.misere : this.save.data;
      card.setAttribute('aria-checked', String(m === mode));
      card.hidden = !this.levelSets[m];
      card.querySelector('.mode-progress').textContent = t('progress.count', { n: pad(p.completed.length) });
    }
    for (const tab of document.querySelectorAll('.play-tab')) tab.setAttribute('aria-selected', String(tab.dataset.play === this.panel));
    for (const panel of document.querySelectorAll('.play-panel')) panel.hidden = panel.dataset.panel !== this.panel;
    const daily = this.save.data.daily[mode], doneToday = daily.last === todayKey();
    $('daily-status').textContent = [doneToday ? t('daily.done') : '', daily.streak ? t('daily.streak', { n: daily.streak, best: daily.best }) : ''].filter(Boolean).join(' · ');
    $('daily-button').textContent = t(doneToday ? 'daily.again' : 'daily.start');
    $('daily-share').hidden = !doneToday;
    for (const b of document.querySelectorAll('[data-endless]')) b.querySelector('small').textContent = t('endless.solved', { n: this.save.data.endless[mode][b.dataset.endless] });
    $('level-list').replaceChildren(...this.levels.map(level => {
      const button = document.createElement('button');
      const unlocked = level.id <= this.save.progress.highestUnlocked;
      const done = this.save.progress.completed.includes(level.id);
      const stars = this.save.progress.stars[level.id] ?? 0;
      button.innerHTML = `<span class="tile-num">${pad(level.id)}</span><span class="tile-name"></span><span class="tile-state">${done ? (stars ? `<span class="tile-stars" aria-label="${t('stars.aria', { n: stars })}">${starText(stars)}</span>` : t('tile.done')) : unlocked ? '' : t('tile.locked')}</span>`;
      button.querySelector('.tile-name').textContent = level.name;
      button.disabled = !unlocked;
      const current = this.game.kind === 'campaign' && level.id === this.game.level?.id;
      button.className = ['level-tile', current ? 'current' : '', done ? 'completed' : '', level.world].filter(Boolean).join(' ');
      button.onclick = () => { $('level-dialog').close(); this.load(level.id); };
      return button;
    }));
  }
  // Names for the two sides: "you"/"computer", or "Player 1"/"Player 2" in pass-and-play.
  side(g, actor) { return g.opponent === 'human' ? t('who.p', { n: actor === 'player' ? 1 : 2 }) : t(actor === 'player' ? 'who.you' : 'who.ai'); }
  status(g) {
    if (g.opponent === 'human') {
      const n = (g.phase === 'ended' ? g.winner : g.turn) === 'player' ? 1 : 2;
      if (g.phase === 'ended') return t('status.pWon', { n });
      return t(g.phase === 'animating' ? 'status.pAnim' : 'status.pTurn', { n });
    }
    if (g.phase === 'ended') return t(g.winner === 'player' ? 'status.won' : 'status.lost');
    if (g.phase === 'animating') return t(g.turn === 'ai' ? 'status.aiAnim' : 'status.youAnim');
    return t(g.turn === 'ai' ? 'status.aiThink' : 'status.yourTurn');
  }
  // Book puzzles: say right after the first move whether it was the winning one.
  verdict(g) {
    const first = g.history[0];
    if (g.kind !== 'book' || !first || first.actor !== 'player') return null;
    const move = moveName(first.before, first.move);
    return first.afterOutcome === 'P' ? { ok: true, text: t('verdict.ok', { move }) } : { ok: false, text: t('verdict.bad', { move }) };
  }
  // First-play coach: an animated finger on the first campaign levels until they are won.
  coach(g) {
    const l = g.level, el = $('coach');
    const steps = { 'normal:1': { cells: null, key: 'coach.tap' }, 'normal:2': { cells: [0, 1], key: 'coach.swipe' }, 'misere:1': { cells: null, key: 'coach.tap' } };
    const step = g.kind === 'campaign' && steps[`${g.mode}:${l.id}`];
    const show = step && !this.save.progress.completed.includes(l.id) && g.phase === 'ready' && g.turn === 'player' && !g.history.length && this.coachSeen !== g.epoch;
    el.hidden = !show;
    if (!show) return;
    requestAnimationFrame(() => {
      const cells = step.cells ?? [cellsOf(g.state)[0]];
      const svg = $('board'), mat = el.parentElement.getBoundingClientRect(), box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      const at = cell => { const p = this.input?.renderer?.position(cell) ?? { x: 0, y: 0 }; return { x: box.left - mat.left + p.x / vb.width * box.width, y: box.top - mat.top + p.y / vb.height * box.height }; };
      const a = at(cells[0]), b = at(cells.at(-1));
      el.style.setProperty('--x', `${a.x}px`); el.style.setProperty('--y', `${a.y}px`);
      el.style.setProperty('--dx', `${b.x - a.x}px`); el.style.setProperty('--dy', `${b.y - a.y}px`);
      el.dataset.kind = cells.length > 1 ? 'swipe' : 'tap';
      el.querySelector('.coach-text').textContent = t(step.key);
    });
  }
  heading(g) {
    const l = g.level, kind = g.kind, world = t(`worldname.${l.world}`);
    switch (kind) {
      case 'book': return { num: t('num.book'), name: t('name.book', { n: l.puzzle }), eyebrow: t('eyebrow.book', { world }), lesson: t('lesson.book'), hint: t('hint.book') };
      case 'endless': case 'daily': {
        const hint = t('hint.generated', { n: l.winningCount, cell: l.hintMove.from, k: l.hintMove.size });
        return kind === 'endless'
          ? { num: t('num.endless'), name: t('name.endless', { n: l.number }), eyebrow: t('eyebrow.endless', { diff: t(`diff.${l.difficulty}`), world }), lesson: t('lesson.endless'), hint }
          : { num: t('num.daily'), name: t('name.daily', { date: l.date.slice(5).replace('-', '/') }), eyebrow: t('eyebrow.daily', { world }), lesson: t('lesson.daily'), hint };
      }
      case 'duo': return { num: t('num.duo'), name: t('name.duo'), eyebrow: t('eyebrow.duo', { world }), lesson: t('lesson.duo'), hint: '' };
      default: return { num: pad(l.id), name: l.name, eyebrow: t(l.world === 'static' ? 'eyebrow.ch1' : 'eyebrow.ch2'), ...levelText(l) };
    }
  }
  outcomeText(g) {
    const l = g.level, kind = g.kind, won = g.winner === 'player', mode = g.mode;
    if (kind === 'duo') {
      const w = g.winner === 'player' ? 1 : 2;
      return t(mode === 'misere' ? 'out.duo.misere' : 'out.duo.normal', { w, l: 3 - w });
    }
    if (kind === 'book') return won ? t('out.book.win', { n: l.puzzle }) : t('out.book.lose');
    if (kind === 'endless' || kind === 'daily') return won ? t(`out.${kind}.win`) : t(`out.gen.lose.${mode}`);
    if (!won) return t(`out.${mode}.lose`);
    return t(l.id === 10 ? `out.${mode}.win10` : l.id === 5 ? `out.${mode}.win5` : `out.${mode}.win`);
  }
  nextLabel(g) {
    const l = g.level, kind = g.kind;
    if (kind === 'duo') return t('next.duo');
    if (g.winner !== 'player') return t('next.retry');
    if (kind === 'book') return t('next.book');
    if (kind === 'endless') return t('next.endless');
    if (kind === 'daily') return t('next.daily');
    return t(l.id === 10 ? 'next.menu' : l.id === 5 ? 'next.ch2' : 'next.next');
  }
  update(g) {
    const l = g.level, h = this.heading(g), misere = g.mode === 'misere';
    $('level-number').textContent = h.num; $('level-name').textContent = h.name;
    $('chapter').textContent = h.eyebrow;
    $('mode-chip').textContent = `${t(misere ? 'rule.misere' : 'rule.normal')} ▾`;
    $('mode-chip').dataset.mode = g.mode;
    $('mode-chip').setAttribute('aria-label', t('chip.aria', { rule: t(misere ? 'rule.misere' : 'rule.normal') }));
    $('rule-win').innerHTML = t(misere ? 'rules.win.misere' : 'rules.win.normal');
    document.body.dataset.mode = g.mode; document.body.dataset.kind = g.kind;
    this.music?.setTrack(g.kind === 'duo' ? 'sunny' : 'waltz');
    $('world').textContent = t(`world.${l.world}`);
    $('world').dataset.world = l.world;
    $('lesson').textContent = h.lesson; $('hint').textContent = h.hint;
    $('hint-button').hidden = !h.hint;
    $('progress').textContent = `${pad(this.save.progress.highestUnlocked)} / 10`;
    $('mission-track').querySelectorAll('span').forEach((pip, index) => {
      const id = index + 1;
      pip.title = t('pip', { n: pad(id) });
      pip.classList.toggle('unlocked', id <= this.save.progress.highestUnlocked);
      pip.classList.toggle('completed', this.save.progress.completed.includes(id));
      pip.classList.toggle('current', g.kind === 'campaign' && id === l.id);
    });
    $('completed-count').textContent = t('progress.count', { n: pad(this.save.progress.completed.length) });
    $('piece-count').textContent = t('count', { n: cellsOf(g.state).length });
    $('status').textContent = this.status(g);
    $('status').dataset.turn = g.phase === 'ended' ? (g.opponent === 'human' ? 'won' : g.winner === 'player' ? 'won' : 'lost') : g.turn;
    $('board').dataset.phase = g.phase; $('board').dataset.turn = g.turn; $('board').dataset.level = l.id;
    const accepting = g.phase === 'ready' && (g.turn === 'player' || g.opponent === 'human');
    $('board').setAttribute('aria-disabled', String(!accepting));
    const verdict = this.verdict(g);
    $('verdict').hidden = !verdict;
    if (verdict) { $('verdict').textContent = verdict.text; $('verdict').dataset.ok = String(verdict.ok); }
    if (g.phase === 'ended' || (verdict && g.phase !== 'animating')) this.announce(g, verdict);
    // Keep the result card (and its next button) above the bottom ad banner.
    if (g.phase === 'ended') requestAnimationFrame(() => $('outcome').scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    $('outcome').hidden = g.phase !== 'ended';
    $('outcome').dataset.won = String(g.winner === 'player' || g.opponent === 'human');
    $('outcome-text').textContent = g.phase === 'ended' ? this.outcomeText(g) : '';
    $('next-button').textContent = this.nextLabel(g);
    const won = g.phase === 'ended' && g.winner === 'player' && g.opponent === 'ai';
    $('outcome-stars').hidden = !won;
    if (won) { $('outcome-stars').textContent = starText(g.stars); $('outcome-stars').setAttribute('aria-label', t('stars.aria', { n: g.stars })); }
    $('outcome-tip').hidden = !won;
    if (won) $('outcome-tip').textContent = t(g.stars === 1 ? 'stars.tip1' : g.stars === 2 ? 'stars.tip2' : 'stars.tip3');
    $('share-button').hidden = !(won && g.kind === 'daily');
    const r = this.save.data.settings.reminder;
    $('remind-prompt').hidden = !(won && g.kind === 'daily' && isNative() && !r.on && !r.asked);
    this.coach(g);
    $('next-button').disabled = false;
    if (!this.save.available) $('progress').textContent += t('storage.temp');
    if (this.math) {
      const a = g.solver.analyze(g.state), nim = g.mode === 'normal' ? nimAnalysis(g.state) : null;
      $('math-data').textContent = [`LEVEL          ${g.kind === 'campaign' ? `${l.id} / ${l.name}` : `${g.kind.toUpperCase()} / ${h.name}`}`, `RULE           ${misere ? 'LAST ONE LOSES (misère)' : 'LAST ONE WINS (normal)'}`, `STATE ID       ${stateId(g.state)}`, `PIECE COUNT    ${cellsOf(g.state).length}`, `TO MOVE        ${g.phase === 'ended' ? 'TERMINAL (no next turn)' : g.opponent === 'human' ? `PLAYER ${g.turn === 'player' ? 1 : 2}` : g.turn.toUpperCase()}`, `STATE          ${a.winning ? 'N / WINNING' : 'P / LOSING'}`, `LEGAL MOVES    ${a.legalMoves}`, `WINNING MOVES  ${a.winningMoves.length}`, `LOSING MOVES   ${a.losingMoves.length}`, `AI EVALUATION  ${a.winning ? 'Can force win as next player' : 'No forced win as next player'}`, `OPTIMAL        ${a.optimalMove ? moveName(g.state, a.optimalMove) : '—'}`, `DEPTH          ${a.depth} plies (optimal adversarial)`, ...(nim ? [`HEAPS          ${nim.heaps.join(' / ') || '0'}`, `GRUNDY         ${nim.grundies.join(' / ') || '0'}`, `NIM SUM        ${nim.xor}`] : [misere ? 'NIM SUM        N/A — misère (last one loses) game tree' : 'NIM SUM        N/A — game-tree evaluation']), `WINNING LINES  ${a.winningMoves.map(m => moveName(g.state, m.move)).join(' ; ') || '—'}`].join('\n');
    }
    $('trace').replaceChildren(...g.history.map(entry => { const li = document.createElement('li'); li.textContent = `${this.side(g, entry.actor)} ${moveName(entry.before, entry.move)} · ${entry.beforeOutcome} → ${entry.afterOutcome}${entry.nimAfter ? ` · XOR ${entry.nimAfter.xor}` : ''}`; return li; }));
  }
}
