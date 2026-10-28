const KEY = 'dynamic-nim:v1';
// Storage layout (kept compatible with older saves): the top-level progress fields are
// the normal "last one wins" campaign; `misere` holds the "last one loses" campaign;
// `mode` is the campaign the player last chose.
const freshProgress = () => ({ highestUnlocked: 1, currentLevel: 1, completed: [] });
const fresh = () => ({ ...freshProgress(), mode: 'normal', misere: freshProgress(), settings: { effects: true, sound: true } });
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
      return { ...normal, mode: raw.mode === 'misere' ? 'misere' : 'normal', misere: readProgress(raw.misere) ?? freshProgress(), settings: { effects: raw.settings?.effects !== false, sound: raw.settings?.sound !== false } };
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
  setEffects(enabled) { this.data.settings.effects = Boolean(enabled); this.persist(); }
  setSound(enabled) { this.data.settings.sound = Boolean(enabled); this.persist(); }
}
