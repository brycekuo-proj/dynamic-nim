const KEY = 'dynamic-nim:v1';
// Storage layout (kept compatible with older saves): the top-level progress fields are
// the normal "last one wins" campaign; `misere` holds the "last one loses" campaign;
// `mode` is the campaign the player last chose.
const freshProgress = () => ({ highestUnlocked: 1, currentLevel: 1, completed: [] });
const freshEndless = () => ({ easy: 0, normal: 0, hard: 0 });   // puzzles solved per difficulty
const freshDaily = () => ({ last: '', streak: 0, best: 0 });     // last solved day (YYYY-MM-DD)
const freshExtras = () => ({ endless: { normal: freshEndless(), misere: freshEndless() }, daily: { normal: freshDaily(), misere: freshDaily() } });
const fresh = () => ({ ...freshProgress(), mode: 'normal', misere: freshProgress(), ...freshExtras(), settings: { effects: true, sound: true, lang: null } });
const count = n => Number.isInteger(n) && n >= 0 ? n : 0;
const readEndless = raw => ({ easy: count(raw?.easy), normal: count(raw?.normal), hard: count(raw?.hard) });
const readDaily = raw => ({ last: /^\d{4}-\d{2}-\d{2}$/.test(raw?.last ?? '') ? raw.last : '', streak: count(raw?.streak), best: count(raw?.best) });
const dayBefore = key => { const d = new Date(`${key}T12:00:00`); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const levelNumber = n => Number.isInteger(n) && n >= 1 && n <= 10;
const readProgress = raw => (raw && levelNumber(raw.highestUnlocked) && levelNumber(raw.currentLevel))
  ? { highestUnlocked: raw.highestUnlocked, currentLevel: Math.min(raw.currentLevel, raw.highestUnlocked), completed: Array.isArray(raw.completed) ? [...new Set(raw.completed.filter(levelNumber))] : [] }
  : null;
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
        settings: { effects: raw.settings?.effects !== false, sound: raw.settings?.sound !== false, lang: ['zh', 'en'].includes(raw.settings?.lang) ? raw.settings.lang : null },
      };
    } catch { this.available = false; return fresh(); }
  }
  get mode() { return this.data.mode; }
  // Progress of the current campaign (the top-level fields for normal play).
  get progress() { return this.data.mode === 'misere' ? this.data.misere : this.data; }
  persist() { try { if (!this.storage) throw new Error('No storage'); this.storage.setItem(KEY, JSON.stringify(this.data)); this.available = true; } catch { this.available = false; } }
  setMode(mode) { if (mode !== 'normal' && mode !== 'misere') return false; this.data.mode = mode; this.persist(); return true; }
  select(id) { const p = this.progress; if (!levelNumber(id) || id > p.highestUnlocked) return false; p.currentLevel = id; this.persist(); return true; }
  complete(id) {
    const p = this.progress;
    p.highestUnlocked = Math.max(p.highestUnlocked, Math.min(10, id + 1));
    if (!p.completed.includes(id)) p.completed.push(id);
    this.persist();
  }
  // Endless: remember the highest puzzle number solved. Daily: one solve per day builds a streak.
  recordPuzzle(level) {
    if (level.kind === 'endless') {
      const e = this.data.endless[level.mode];
      e[level.difficulty] = Math.max(e[level.difficulty], level.number);
    } else if (level.kind === 'daily') {
      const d = this.data.daily[level.mode];
      if (d.last === level.date) return;
      d.streak = d.last === dayBefore(level.date) ? d.streak + 1 : 1;
      d.best = Math.max(d.best, d.streak); d.last = level.date;
    } else return;
    this.persist();
  }
  setLang(lang) { this.data.settings.lang = ['zh', 'en'].includes(lang) ? lang : null; this.persist(); }
  setEffects(enabled) { this.data.settings.effects = Boolean(enabled); this.persist(); }
  setSound(enabled) { this.data.settings.sound = Boolean(enabled); this.persist(); }
}
