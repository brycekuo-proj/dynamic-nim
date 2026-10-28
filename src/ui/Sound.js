// Candy-shop sound effects, synthesized with Web Audio (no audio files): soft
// "boop"s, a bubbly "pop" with a sugar-crunch for taking donuts, a "plop" for
// landing, and a little music-box jingle for a win. Everything fails silently
// where audio is unavailable, and nothing starts until the first user gesture.

// note name → frequency, for the jingles
const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };

export class Sound {
  constructor(enabled) {
    this.enabled = () => enabled();
    this.ctx = null; this.noise = null;
    const unlock = () => { this.unlock(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
  }
  unlock() {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      // Half a second of white noise, reused for every crunch.
      const length = Math.floor(this.ctx.sampleRate * 0.5);
      this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } catch { this.ctx = null; }
  }
  // One pitched blip: frequency glides from f0 to f1 under a quick attack/decay envelope.
  tone(at, { f0, f1 = f0, dur, type = 'sine', gain = 0.3 }) {
    const c = this.ctx, osc = c.createOscillator(), g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(f1, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + Math.min(0.012, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(this.out);
    osc.start(at); osc.stop(at + dur + 0.02);
  }
  // A short band-passed noise burst: the "crunch" of sugar sprinkles.
  crunch(at, { dur = 0.07, freq = 3200, gain = 0.18 }) {
    const c = this.ctx, src = c.createBufferSource(), filter = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noise; filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = 1.2;
    g.gain.setValueAtTime(gain, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filter).connect(g).connect(this.out);
    src.start(at, Math.random() * 0.3, dur + 0.02);
  }
  play(kind, volume = 0.7) {
    if (!this.enabled() || !this.ctx) return;
    try {
      const c = this.ctx;
      if (c.state === 'suspended') c.resume();
      this.out = c.createGain(); this.out.gain.value = volume; this.out.connect(c.destination);
      const now = c.currentTime + 0.005, wobble = 0.95 + Math.random() * 0.1;
      switch (kind) {
        case 'click': this.tone(now, { f0: 1400 * wobble, f1: 1000, dur: 0.045, type: 'triangle', gain: 0.12 }); break;
        case 'pick': this.tone(now, { f0: 520 * wobble, f1: 820 * wobble, dur: 0.09, gain: 0.22 }); break;
        case 'take':
          this.tone(now, { f0: 950 * wobble, f1: 260, dur: 0.12, gain: 0.3 });
          this.crunch(now + 0.02, { dur: 0.06, freq: 3500 });
          this.crunch(now + 0.07, { dur: 0.05, freq: 2600, gain: 0.12 });
          break;
        case 'land': this.tone(now, { f0: 300 * wobble, f1: 140, dur: 0.14, gain: 0.28 }); break;
        case 'ai':
          this.tone(now, { f0: NOTE.E5, dur: 0.1, type: 'triangle', gain: 0.16 });
          this.tone(now + 0.09, { f0: NOTE.A5, dur: 0.12, type: 'triangle', gain: 0.16 });
          break;
        case 'right': [NOTE.C6, NOTE.E6, NOTE.G6].forEach((f, i) => this.tone(now + i * 0.07, { f0: f, dur: 0.14, type: 'triangle', gain: 0.18 })); break;
        case 'wrong':
          this.tone(now, { f0: 420, f1: 360, dur: 0.16, type: 'triangle', gain: 0.2 });
          this.tone(now + 0.15, { f0: 330, f1: 250, dur: 0.24, type: 'triangle', gain: 0.2 });
          break;
        case 'win':
          [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) => this.tone(now + i * 0.09, { f0: f, dur: 0.22, type: 'triangle', gain: 0.18 }));
          [NOTE.G6, NOTE.C7, NOTE.E6, NOTE.C7].forEach((f, i) => this.tone(now + 0.5 + i * 0.07, { f0: f, dur: 0.12, gain: 0.08 }));
          break;
        default: break;
      }
    } catch { /* ignore */ }
  }
}
