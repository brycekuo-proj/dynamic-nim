const KEY = 'dynamic-nim:v1';
// Storage layout (kept compatible with older saves): the top-level progress fields are
// the normal "last one wins" campaign; `misere` holds the "last one loses" campaign;
// `mode` is the campaign the player last chose.
const freshProgress = () => ({ highestUnlocked: 1, currentLevel: 1, completed: [], stars: {} });
const freshEndless = () => ({ easy: 0, normal: 0, hard: 0 });   // puzzles solved per difficulty
// last solved day (YYYY-MM-DD), its stars, and how many tries a day took (for sharing)
const freshDaily = () => ({ last: '', streak: 0, best: 0, lastStars: 0, tries: { date: '', n: 0 } });
const freshExtras = () => ({ endless: { normal: freshEndless(), misere: freshEndless() }, daily: { normal: freshDaily(), misere: freshDaily() } });
const fresh = () => ({ ...freshProgress(), mode: 'normal', misere: freshProgress(), ...freshExtras(), settings: { effects: true, sound: true, music: true, lang: null, reminder: { on: false, time: '20:00', asked: false } } });
const count = n => Number.isInteger(n) && n >= 0 ? n : 0;
const readEndless = raw => ({ easy: count(raw?.easy), normal: count(raw?.normal), hard: count(raw?.hard) });
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const readDaily = raw => ({
  last: DAY.test(raw?.last ?? '') ? raw.last : '', streak: count(raw?.streak), best: count(raw?.best),
  lastStars: [1, 2, 3].includes(raw?.lastStars) ? raw.lastStars : 0,
  tries: { date: DAY.test(raw?.tries?.date ?? '') ? raw.tries.date : '', n: count(raw?.tries?.n) },
});
const dayBefore = key => { const d = new Date(`${key}T12:00:00`); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const levelNumber = n => Number.isInteger(n) && n >= 1 && n <= 10;
const readStars = raw => Object.fromEntries(Object.entries(raw && typeof raw === 'object' ? raw : {}).filter(([id, n]) => levelNumber(Number(id)) && [1, 2, 3].includes(n)));
const readProgress = raw => (raw && levelNumber(raw.highestUnlocked) && levelNumber(raw.currentLevel))
  ? { highestUnlocked: raw.highestUnlocked, currentLevel: Math.min(raw.currentLevel, raw.highestUnlocked), completed: Array.isArray(raw.completed) ? [...new Set(raw.completed.filter(levelNumber))] : [], stars: readStars(raw.stars) }
  : null;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export class SaveStore {
  constructor(storage) { this.storage = storage; this.available = true; this.data = this.load(); }
  load() {
    try {
      const raw = JSON.parse(this.storage?.getItem(KEY) ?? 'null');
      const normal = readProgress(raw);
      if (!normal) return fresh();
      return {
        ...normal, mode: raw.mode === 'misere' ? 'misere' : 'normal', misere: readProgress(raw.misere) ?? freshProgress(),
        endless: { normal: readEndless(raw.endless?.normal), misere: readEndless(raw.endless?.misere) },
        daily: { normal: readDaily(raw.daily?.normal), misere: readDaily(raw.daily?.misere) },
        settings: { effects: raw.settings?.effects !== false, sound: raw.settings?.sound !== false, music: raw.settings?.music !== false, lang: ['zh', 'en'].includes(raw.settings?.lang) ? raw.settings.lang : null,
          reminder: { on: raw.settings?.reminder?.on === true, time: TIME.test(raw.settings?.reminder?.time ?? '') ? raw.settings.reminder.time : '20:00', asked: raw.settings?.reminder?.asked === true } },
      };
    } catch { this.available = false; return fresh(); }
  }
  get mode() { return this.data.mode; }
  // Progress of the current campaign (the top-level fields for normal play).
  get progress() { return this.data.mode === 'misere' ? this.data.misere : this.data; }
  persist() { try { if (!this.storage) throw new Error('No storage'); this.storage.setItem(KEY, JSON.stringify(this.data)); this.available = true; } catch { this.available = false; } }
  setMode(mode) { if (mode !== 'normal' && mode !== 'misere') return false; this.data.mode = mode; this.persist(); return true; }
  select(id) { const p = this.progress; if (!levelNumber(id) || id > p.highestUnlocked) return false; p.currentLevel = id; this.persist(); return true; }
  complete(id, stars = 0) {
    const p = this.progress;
    if ([1, 2, 3].includes(stars)) p.stars[id] = Math.max(p.stars[id] ?? 0, stars);
    p.highestUnlocked = Math.max(p.highestUnlocked, Math.min(10, id + 1));
    if (!p.completed.includes(id)) p.completed.push(id);
    this.persist();
  }
  // Endless: remember the highest puzzle number solved. Daily: one solve per day builds a streak.
  recordPuzzle(level, { stars = 0 } = {}) {
    if (level.kind === 'endless') {
      const e = this.data.endless[level.mode];
      e[level.difficulty] = Math.max(e[level.difficulty], level.number);
    } else if (level.kind === 'daily') {
      const d = this.data.daily[level.mode];
      if (d.last === level.date) { d.lastStars = Math.max(d.lastStars, stars); this.persist(); return; }
      d.streak = d.last === dayBefore(level.date) ? d.streak + 1 : 1; d.lastStars = stars;
      d.best = Math.max(d.best, d.streak); d.last = level.date;
    } else return;
    this.persist();
  }
  // Counts daily attempts (the first start and every restart) for the share text.
  dailyTry(mode, date) {
    const t = this.data.daily[mode].tries;
    if (t.date !== date) { t.date = date; t.n = 0; }
    t.n++; this.persist(); return t.n;
  }
  setReminder(changes) { Object.assign(this.data.settings.reminder, changes); this.persist(); }
  setLang(lang) { this.data.settings.lang = ['zh', 'en'].includes(lang) ? lang : null; this.persist(); }
  setEffects(enabled) { this.data.settings.effects = Boolean(enabled); this.persist(); }
  setMusic(enabled) { this.data.settings.music = Boolean(enabled); this.persist(); }
  setSound(enabled) { this.data.settings.sound = Boolean(enabled); this.persist(); }
}
