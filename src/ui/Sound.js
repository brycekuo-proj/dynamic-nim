// Short CC0 sound effects (Kenney Casino Audio / Interface Sounds / Music Jingles).
// Web Audio keeps latency low; everything fails silently where audio is unavailable,
// and nothing loads until the first user gesture (browser autoplay rules).
const FILES = {
  pick: ['chipsHandle3'],
  take: ['chipsCollide1', 'chipsCollide2', 'chipsCollide3'],
  land: ['chipLay1', 'chipLay2'],
  ai: ['chipsStack2'],
  click: ['click_002'],
  right: ['confirmation_002'],
  wrong: ['error_004'],
  win: ['jingles_HIT05'],
};

export class Sound {
  constructor(enabled) {
    this.enabled = () => enabled();
    this.ctx = null; this.buffers = new Map(); this.loading = null;
    this.base = `${import.meta.env?.BASE_URL ?? '/'}assets/sfx/`;
    const unlock = () => { this.unlock(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
  }
  unlock() {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      const names = [...new Set(Object.values(FILES).flat())];
      this.loading = Promise.all(names.map(async name => {
        try {
          const res = await fetch(`${this.base}${name}.mp3`);
          this.buffers.set(name, await this.ctx.decodeAudioData(await res.arrayBuffer()));
        } catch { /* missing or undecodable: that sound stays silent */ }
      }));
    } catch { this.ctx = null; }
  }
  play(kind, volume = 0.7) {
    if (!this.enabled() || !this.ctx) return;
    const list = FILES[kind]; if (!list) return;
    const buffer = this.buffers.get(list[Math.floor(Math.random() * list.length)]);
    if (!buffer) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const source = this.ctx.createBufferSource(), gain = this.ctx.createGain();
      gain.gain.value = volume; source.buffer = buffer;
      source.playbackRate.value = 0.94 + Math.random() * 0.12;
      source.connect(gain).connect(this.ctx.destination); source.start();
    } catch { /* ignore */ }
  }
}
