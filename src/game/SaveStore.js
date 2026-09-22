const KEY = 'dynamic-nim:v1';
const fresh = () => ({ highestUnlocked: 1, currentLevel: 1, completed: [], settings: { effects: true } });
const levelNumber = n => Number.isInteger(n) && n >= 1 && n <= 10;
export class SaveStore {
  constructor(storage) { this.storage = storage; this.available = true; this.data = this.load(); }
  load() {
    try {
      const raw = JSON.parse(this.storage?.getItem(KEY) ?? 'null');
      if (!raw || !levelNumber(raw.highestUnlocked) || !levelNumber(raw.currentLevel)) return fresh();
      return { highestUnlocked: raw.highestUnlocked, currentLevel: Math.min(raw.currentLevel, raw.highestUnlocked), completed: Array.isArray(raw.completed) ? [...new Set(raw.completed.filter(levelNumber))] : [], settings: { effects: raw.settings?.effects !== false } };
    } catch { this.available = false; return fresh(); }
  }
  persist() { try { if (!this.storage) throw new Error('No storage'); this.storage.setItem(KEY, JSON.stringify(this.data)); this.available = true; } catch { this.available = false; } }
  select(id) { if (!levelNumber(id) || id > this.data.highestUnlocked) return false; this.data.currentLevel = id; this.persist(); return true; }
  complete(id) {
    this.data.highestUnlocked = Math.max(this.data.highestUnlocked, Math.min(10, id + 1));
    if (!this.data.completed.includes(id)) this.data.completed.push(id);
    this.persist();
  }
  setEffects(enabled) { this.data.settings.effects = Boolean(enabled); this.persist(); }
}
