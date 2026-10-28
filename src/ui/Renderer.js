import { cellsOf, snapshot } from '../domain/GameState.js';
const NS = 'http://www.w3.org/2000/svg';
const CELL = 64, PAD = 24, LABEL = 30, CHIP = 54, CUP = 62;
// The tray hugs each level's grid; one board unit is shown at most this many CSS pixels,
// so small boards (1×1, 1×2) do not blow the donuts up to giant size.
const MAX_SCALE = 1.4;
const COLS = 'ABCDEFGH';
const ART = `${import.meta.env.BASE_URL}assets/candy/`;
// Every piece is the same pink donut, sitting in a chocolate paper cup: in Nim all
// pieces are shared and identical, so colour must never suggest ownership or value.
export const PIECE_URL = `${ART}donut.webp`;
const CUP_URL = `${ART}cup.webp`;
// Board coordinates match the printed puzzle book: letters are columns from the
// left, numbers are rows from the top (B3 = column 2, row 3).
export const cellName = (state, cell) => `${COLS[cell % state.width]}${Math.floor(cell / state.width) + 1}`;
export const moveName = (state, move) => [...move].sort((a, b) => a - b).map(c => cellName(state, c)).join('–');

export class Renderer {
  constructor(svg, reducedMotion, sound = null) { Object.assign(this, { svg, reducedMotion, sound }); this.animations = new Set(); this.token = 0; }
  geometry(state) {
    this.state = state;
    this.width = LABEL + state.width * CELL + PAD;
    this.height = LABEL + state.height * CELL + PAD;
    this.offsetX = LABEL + (this.width - LABEL - (state.width - 1) * CELL) / 2;
    this.offsetY = LABEL + (this.height - LABEL - (state.height - 1) * CELL) / 2;
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.svg.style.setProperty('--board-w', `${Math.round(this.width * MAX_SCALE)}px`);
    this.svg.style.setProperty('--board-aspect', (this.width / this.height).toFixed(4));
  }
  position(cell) { return { x: this.offsetX + cell % this.state.width * CELL, y: this.offsetY + Math.floor(cell / this.state.width) * CELL }; }
  element(tag, attrs) { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; }
  draw(state) {
    this.geometry(state); this.svg.replaceChildren(); this.svg.dataset.state = JSON.stringify(snapshot(state));
    const { width: w, height: h } = state;
    const left = this.offsetX - CELL / 2, top = this.offsetY - CELL / 2;
    const defs = this.element('defs', {});
    const blur = this.element('filter', { id: 'chip-shadow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    blur.append(this.element('feGaussianBlur', { stdDeviation: 2.6 }));
    defs.append(blur); this.svg.append(defs);
    // Biscuit tags carry the book's coordinates: letters on top, numbers on the left.
    const tag = (x, y, text) => {
      this.svg.append(this.element('rect', { x: x - 11, y: y - 11, width: 22, height: 22, rx: 7, class: 'label-chip' }));
      const t = this.element('text', { x, y: y + 5.5, class: 'coord', 'text-anchor': 'middle' });
      t.textContent = text; this.svg.append(t);
    };
    for (let c = 0; c < w; c++) tag(this.offsetX + c * CELL, top - 15, COLS[c]);
    for (let r = 0; r < h; r++) tag(left - 16, this.offsetY + r * CELL, String(r + 1));
    for (let cell = 0; cell < w * h; cell++) {
      const { x, y } = this.position(cell);
      this.svg.append(this.element('image', { x: x - CUP / 2, y: y - CUP / 2, width: CUP, height: CUP, href: CUP_URL, class: 'cup spot' }));
    }
    if (state.world === 'gravity') {
      const floorY = top + h * CELL + 4;
      this.svg.append(this.element('rect', { x: left - 10, y: floorY, width: w * CELL + 20, height: 12, rx: 4, class: 'ledge' }));
      this.svg.append(this.element('path', { d: `M${left - 6} ${floorY + 3}H${left + w * CELL + 6}`, class: 'ledge-shine' }));
    }
    for (const cell of cellsOf(state)) {
      const { x, y } = this.position(cell);
      const token = this.element('g', { class: 'token' });
      const shadow = this.element('ellipse', { cx: x + 1, cy: y + 7, rx: CHIP / 2 - 4, ry: CHIP / 2 - 9, class: 'chip-shadow', filter: 'url(#chip-shadow)' });
      const art = this.element('image', { x: x - CHIP / 2, y: y - CHIP / 2, width: CHIP, height: CHIP, class: 'chip', href: PIECE_URL, 'pointer-events': 'none' });
      const circle = this.element('circle', { cx: x, cy: y, r: 30, class: 'piece', 'data-cell': cell });
      const title = this.element('title', {}); title.textContent = cellName(state, cell);
      circle.append(title); token.append(shadow, art, circle); this.svg.append(token);
    }
  }
  select(move, actor = 'player') {
    let lifted = 0;
    this.svg.querySelectorAll('.piece').forEach(el => {
      const chosen = move.includes(Number(el.dataset.cell));
      el.classList.toggle('selected', chosen && actor !== 'ai');
      el.classList.toggle('ai-selected', chosen && actor === 'ai');
      if (chosen && !el.parentElement.classList.contains('lifted')) lifted++;
      el.parentElement.classList.toggle('lifted', chosen);
    });
    if (lifted && actor !== 'ai') this.sound?.play('pick', 0.35);
  }
  focus(cell) { this.svg.querySelectorAll('.piece').forEach(el => el.classList.toggle('keyboard-focus', Number(el.dataset.cell) === cell)); }
  async tween(el, frames, duration, delay = 0) {
    const animation = el.animate(frames, { duration: this.reducedMotion() ? 0 : duration, delay: this.reducedMotion() ? 0 : delay, fill: 'forwards', easing: 'cubic-bezier(.3,0,.6,1)' });
    this.animations.add(animation);
    try { await animation.finished; } catch { /* Cancelled by level restart/navigation. */ }
    this.animations.delete(animation);
  }
  pause(ms) { return new Promise(resolve => setTimeout(resolve, this.reducedMotion() ? 0 : ms)); }
  cancel() { this.token++; for (const animation of this.animations) animation.cancel(); this.animations.clear(); }
  async animate(before, move, result, actor) {
    const token = this.token;
    this.select(move, actor);
    if (actor === 'ai') { this.sound?.play('ai', 0.6); await this.pause(420); }
    if (token !== this.token) return;
    // Donuts are picked up and slide out of the box toward the player's or computer's side.
    this.sound?.play('take');
    const dir = actor === 'ai' ? -1 : 1;
    await Promise.all([...move].sort((a, b) => a - b).map((cell, i) => this.tween(
      this.svg.querySelector(`[data-cell="${cell}"]`).parentElement,
      [{ opacity: 1, transform: 'translate(0,-5px) scale(1.06)' }, { opacity: 0, transform: `translate(${dir * 46}px,${dir * 40}px) scale(1.12) rotate(${dir * 18}deg)` }],
      280, i * 45)));
    if (token !== this.token) return;
    this.draw(result.removed);
    const falls = result.falls.filter(f => f.from !== f.to);
    if (falls.length) {
      await Promise.all(falls.map(f => {
        const el = this.svg.querySelector(`[data-cell="${f.from}"]`).parentElement, a = this.position(f.from), b = this.position(f.to), d = b.y - a.y;
        return this.tween(el, [{ transform: 'translateY(0)' }, { transform: `translateY(${d}px)`, offset: 0.78 }, { transform: `translateY(${d - 7}px)`, offset: 0.89 }, { transform: `translateY(${d}px)` }], 560);
      }));
      if (token !== this.token) return;
      this.sound?.play('land');
    }
    this.draw(result.state);
  }
  point(event) { const p = new DOMPoint(event.clientX, event.clientY); return p.matrixTransform(this.svg.getScreenCTM().inverse()); }
  cellAt(point, requireHit = false) {
    const col = Math.round((point.x - this.offsetX) / CELL), row = Math.round((point.y - this.offsetY) / CELL);
    if (col < 0 || row < 0 || col >= this.state.width || row >= this.state.height) return null;
    const cell = row * this.state.width + col, p = this.position(cell);
    if (requireHit && Math.hypot(point.x - p.x, point.y - p.y) > 28) return null;
    return cell;
  }
}
