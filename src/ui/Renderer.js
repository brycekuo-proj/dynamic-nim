import { cellsOf, snapshot } from '../domain/GameState.js';
const NS = 'http://www.w3.org/2000/svg';
const CELL = 64, PAD = 24, LABEL = 28, R = 25;
const COLS = 'ABCDEFGH';
// Board coordinates match the printed puzzle book: letters are columns from the
// left, numbers are rows from the top (B3 = column 2, row 3).
export const cellName = (state, cell) => `${COLS[cell % state.width]}${Math.floor(cell / state.width) + 1}`;
export const moveName = (state, move) => [...move].sort((a, b) => a - b).map(c => cellName(state, c)).join('–');

export class Renderer {
  constructor(svg, reducedMotion) { this.svg = svg; this.reducedMotion = reducedMotion; this.animations = new Set(); this.token = 0; }
  geometry(state) {
    this.state = state;
    this.width = LABEL + Math.max(4, state.width) * CELL + PAD;
    this.height = LABEL + Math.max(4, state.height) * CELL + PAD;
    this.offsetX = LABEL + (this.width - LABEL - (state.width - 1) * CELL) / 2;
    this.offsetY = LABEL + (this.height - LABEL - (state.height - 1) * CELL) / 2;
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
  }
  position(cell) { return { x: this.offsetX + cell % this.state.width * CELL, y: this.offsetY + Math.floor(cell / this.state.width) * CELL }; }
  element(tag, attrs) { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; }
  draw(state) {
    this.geometry(state); this.svg.replaceChildren(); this.svg.dataset.state = JSON.stringify(snapshot(state));
    const { width: w, height: h } = state;
    const left = this.offsetX - CELL / 2, top = this.offsetY - CELL / 2;
    this.svg.append(this.element('rect', { x: left, y: top, width: w * CELL, height: h * CELL, rx: 6, class: 'board-frame' }));
    for (let c = 0; c < w; c++) {
      const t = this.element('text', { x: this.offsetX + c * CELL, y: top - 12, class: 'coord', 'text-anchor': 'middle' });
      t.textContent = COLS[c]; this.svg.append(t);
    }
    for (let r = 0; r < h; r++) {
      const t = this.element('text', { x: left - 14, y: this.offsetY + r * CELL + 5, class: 'coord', 'text-anchor': 'middle' });
      t.textContent = String(r + 1); this.svg.append(t);
    }
    for (let cell = 0; cell < w * h; cell++) {
      const { x, y } = this.position(cell);
      this.svg.append(this.element('circle', { cx: x, cy: y, r: 2.6, class: 'cell-dot' }));
    }
    if (state.world === 'gravity') {
      const floorY = top + h * CELL;
      const ticks = [];
      for (let x = left + 4; x < left + w * CELL - 2; x += 12) ticks.push(`M${x} ${floorY + 3}l-8 9`);
      this.svg.append(this.element('path', { d: `M${left - 6} ${floorY}H${left + w * CELL + 6}`, class: 'floor' }));
      this.svg.append(this.element('path', { d: ticks.join(' '), class: 'floor-hatch' }));
    }
    for (const cell of cellsOf(state)) {
      const { x, y } = this.position(cell);
      const token = this.element('g', { class: 'token' });
      const circle = this.element('circle', { cx: x, cy: y, r: R, class: 'piece', 'data-cell': cell });
      const title = this.element('title', {}); title.textContent = cellName(state, cell);
      circle.append(title); token.append(circle); this.svg.append(token);
    }
  }
  select(move, actor = 'player') {
    this.svg.querySelectorAll('.piece').forEach(el => {
      const chosen = move.includes(Number(el.dataset.cell));
      el.classList.toggle('selected', chosen && actor !== 'ai');
      el.classList.toggle('ai-selected', chosen && actor === 'ai');
    });
  }
  focus(cell) { this.svg.querySelectorAll('.piece').forEach(el => el.classList.toggle('keyboard-focus', Number(el.dataset.cell) === cell)); }
  async tween(el, frames, duration) {
    const animation = el.animate(frames, { duration: this.reducedMotion() ? 0 : duration, fill: 'forwards', easing: 'cubic-bezier(.3,0,.6,1)' });
    this.animations.add(animation);
    try { await animation.finished; } catch { /* Cancelled by level restart/navigation. */ }
    this.animations.delete(animation);
  }
  pause(ms) { return new Promise(resolve => setTimeout(resolve, this.reducedMotion() ? 0 : ms)); }
  cancel() { this.token++; for (const animation of this.animations) animation.cancel(); this.animations.clear(); }
  // A pencil stroke through the removed circles, like crossing them out in the book.
  strike(move, actor) {
    const pts = [...move].sort((a, b) => a - b).map(c => this.position(c));
    const a = pts[0], b = pts.at(-1);
    const d = move.length === 1
      ? `M${a.x - R * 0.85} ${a.y + R * 0.85}L${a.x + R * 0.85} ${a.y - R * 0.85}`
      : (() => { const len = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / len, uy = (b.y - a.y) / len, e = R * 0.9;
        return `M${a.x - ux * e} ${a.y - uy * e}L${b.x + ux * e} ${b.y + uy * e}`; })();
    const path = this.element('path', { d, class: actor === 'ai' ? 'strike ai' : 'strike', pathLength: 100, 'stroke-dasharray': 100 });
    this.svg.append(path);
    return path;
  }
  async animate(before, move, result, actor) {
    const token = this.token;
    this.select(move, actor);
    if (actor === 'ai') await this.pause(420);
    if (token !== this.token) return;
    const line = this.strike(move, actor);
    await this.tween(line, [{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], 170);
    if (token !== this.token) return;
    await Promise.all([
      this.tween(line, [{ opacity: 1 }, { opacity: 0 }], 200),
      ...move.map(cell => this.tween(this.svg.querySelector(`[data-cell="${cell}"]`).parentElement, [{ opacity: 1 }, { opacity: 0 }], 200)),
    ]);
    if (token !== this.token) return;
    this.draw(result.removed);
    await Promise.all(result.falls.filter(f => f.from !== f.to).map(f => {
      const el = this.svg.querySelector(`[data-cell="${f.from}"]`).parentElement, a = this.position(f.from), b = this.position(f.to);
      return this.tween(el, [{ transform: 'translateY(0)' }, { transform: `translateY(${b.y - a.y}px)`, offset: 0.85 }, { transform: `translateY(${b.y - a.y - 4}px)`, offset: 0.93 }, { transform: `translateY(${b.y - a.y}px)` }], 560);
    }));
    if (token !== this.token) return;
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
