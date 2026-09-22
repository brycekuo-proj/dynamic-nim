import { cellsOf, snapshot } from '../domain/GameState.js';
const NS = 'http://www.w3.org/2000/svg';
export class Renderer {
  constructor(svg, reducedMotion) { this.svg = svg; this.reducedMotion = reducedMotion; this.animations = new Set(); this.token = 0; }
  geometry(state) {
    this.state = state; this.width = Math.max(4, state.width) * 64 + 64; this.height = Math.max(4, state.height) * 64 + 64;
    this.offsetX = (this.width - (state.width - 1) * 64) / 2;
    this.offsetY = (this.height - (state.height - 1) * 64) / 2;
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
  }
  position(cell) { return { x: this.offsetX + cell % this.state.width * 64, y: this.offsetY + Math.floor(cell / this.state.width) * 64 }; }
  element(tag, attrs) { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; }
  draw(state) {
    this.geometry(state); this.svg.replaceChildren(); this.svg.dataset.state = JSON.stringify(snapshot(state));
    for (let cell = 0; cell < state.width * state.height; cell++) {
      const { x, y } = this.position(cell);
      this.svg.append(this.element('path', { d: `M${x - 3} ${y}h6 M${x} ${y - 3}v6`, class: 'grid-mark' }));
    }
    for (const cell of cellsOf(state)) {
      const { x, y } = this.position(cell), circle = this.element('circle', { cx: x, cy: y, r: 19, class: 'piece', 'data-cell': cell });
      const title = this.element('title', {}); title.textContent = `第 ${Math.floor(cell / state.width) + 1} 列，第 ${cell % state.width + 1} 欄`; circle.append(title); this.svg.append(circle);
    }
    const floor = this.element('path', { d: `M32 ${this.height - 28}H${this.width - 32}`, class: state.world === 'gravity' ? 'floor active' : 'floor' }); this.svg.append(floor);
  }
  select(move, actor = 'player') {
    this.svg.querySelectorAll('.piece').forEach(el => { el.classList.toggle('selected', move.includes(Number(el.dataset.cell))); el.classList.toggle('ai-selected', actor === 'ai' && move.includes(Number(el.dataset.cell))); });
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
  async animate(before, move, result, actor) {
    const token = this.token;
    this.select(move, actor);
    if (actor === 'ai') await this.pause(420);
    if (token !== this.token) return;
    await Promise.all(move.map(cell => this.tween(this.svg.querySelector(`[data-cell="${cell}"]`), [{ opacity: 1 }, { opacity: 0 }], 180)));
    if (token !== this.token) return;
    this.draw(result.removed);
    await Promise.all(result.falls.filter(f => f.from !== f.to).map(f => {
      const el = this.svg.querySelector(`[data-cell="${f.from}"]`), a = this.position(f.from), b = this.position(f.to);
      return this.tween(el, [{ transform: 'translateY(0)' }, { transform: `translateY(${b.y - a.y}px)` }], 520);
    }));
    if (token !== this.token) return;
    this.draw(result.state);
  }
  point(event) { const p = new DOMPoint(event.clientX, event.clientY); return p.matrixTransform(this.svg.getScreenCTM().inverse()); }
  cellAt(point, requireHit = false) {
    const col = Math.round((point.x - this.offsetX) / 64), row = Math.round((point.y - this.offsetY) / 64);
    if (col < 0 || row < 0 || col >= this.state.width || row >= this.state.height) return null;
    const cell = row * this.state.width + col, p = this.position(cell);
    if (requireHit && Math.hypot(point.x - p.x, point.y - p.y) > 28) return null;
    return cell;
  }
}
