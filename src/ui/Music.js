// Background music: "Gem Waltz" for puzzles and the campaign, "Sunny Side Up" for
// two-player games, plus Gem Waltz's own short win/lose stings. Web Audio loops the
// tracks seamlessly and crossfades between them. Nothing loads or plays until the
// first user gesture, and the music pauses whenever the page or app is hidden.
const FILES = { waltz: 'gem-waltz.mp3', sunny: 'sunny-side-up.mp3', cleared: 'gem-waltz-cleared.mp3', gameover: 'gem-waltz-gameover.mp3' };
const LEVEL = 0.32, FADE = 0.8;

export class Music {
  constructor(enabled) {
    this.enabled = () => enabled();
    this.ctx = null; this.buffers = new Map(); this.want = 'waltz'; this.current = null; this.ducked = 0;
    this.base = `${import.meta.env?.BASE_URL ?? '/'}assets/music/`;
    const unlock = () => { this.unlock(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
    const pause = () => { try { this.ctx?.suspend(); } catch { /* ignore */ } };
    const resume = () => { try { if (!document.hidden) this.ctx?.resume(); } catch { /* ignore */ } };
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
    document.addEventListener('pause', pause); document.addEventListener('resume', resume); // Capacitor app lifecycle
  }
  unlock() {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain(); this.master.gain.value = 1; this.master.connect(this.ctx.destination);
      // Load the current track first so music starts quickly; the rest follow.
      const order = [this.want, ...Object.keys(FILES).filter(k => k !== this.want)];
      (async () => { for (const name of order) { await this.load(name); if (name === this.want) this.apply(); } })();
    } catch { this.ctx = null; }
  }
  async load(name) {
    if (this.buffers.has(name)) return;
    try {
      const res = await fetch(`${this.base}${FILES[name]}`);
      this.buffers.set(name, await this.ctx.decodeAudioData(await res.arrayBuffer()));
    } catch { /* missing or undecodable: that track stays silent */ }
  }
  setTrack(name) { if (FILES[name] && name !== this.want) { this.want = name; this.apply(); } }
  // Starts, switches or stops the loop to match the wanted track and the settings.
  apply() {
    if (!this.ctx) return;
    const want = this.enabled() ? this.want : null;
    if (this.current?.name === want) return;
    const now = this.ctx.currentTime;
    if (this.current) {
      const { gain, source } = this.current;
      gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); gain.gain.linearRampToValueAtTime(0, now + FADE);
      source.stop(now + FADE + 0.05); this.current = null;
    }
    const buffer = want && this.buffers.get(want);
    if (!buffer) return;
    if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume();
    const source = this.ctx.createBufferSource(), gain = this.ctx.createGain();
    source.buffer = buffer; source.loop = true;
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(LEVEL, now + FADE);
    source.connect(gain).connect(this.master); source.start(now);
    this.current = { name: want, source, gain };
  }
  // A one-shot sting over the ducked loop. Returns false when it cannot play,
  // so the caller can fall back to a sound effect.
  sting(name) {
    const buffer = this.ctx && this.enabled() && this.buffers.get(name);
    if (!buffer) return false;
    try {
      const now = this.ctx.currentTime, source = this.ctx.createBufferSource(), gain = this.ctx.createGain();
      source.buffer = buffer; gain.gain.value = 0.55; source.connect(gain).connect(this.ctx.destination); source.start(now);
      const g = this.master.gain, token = ++this.ducked;
      g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0.15, now + 0.2);
      g.setValueAtTime(0.15, now + buffer.duration); g.linearRampToValueAtTime(1, now + buffer.duration + 1.2);
      source.onended = () => { if (token === this.ducked) { /* fully restored by the scheduled ramp */ } };
      return true;
    } catch { return false; }
  }
}
