import { cellsOf, snapshot } from '../domain/GameState.js';
const NS = 'http://www.w3.org/2000/svg';
const ASSET_ROOT = `${import.meta.env.BASE_URL}assets/kenney/`;
export class Renderer {
  constructor(svg, reducedMotion) { this.svg = svg; this.reducedMotion = reducedMotion; this.animations = new Set(); this.token = 0; }
  geometry(state) {
    this.state = state; this.width = Math.max(4, state.width) * 64 + 24; this.height = Math.max(4, state.height) * 64 + 24;
    this.offsetX = (this.width - (state.width - 1) * 64) / 2;
    this.offsetY = (this.height - (state.height - 1) * 64) / 2;
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
  }
  position(cell) { return { x: this.offsetX + cell % this.state.width * 64, y: this.offsetY + Math.floor(cell / this.state.width) * 64 }; }
  element(tag, attrs) { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; }
  draw(state) {
    this.geometry(state); this.svg.replaceChildren(); this.svg.dataset.state = JSON.stringify(snapshot(state));
    this.svg.append(this.element('rect', { x: 18, y: 18, width: this.width - 36, height: this.height - 36, rx: 13, class: 'board-field' }));
    for (let cell = 0; cell < state.width * state.height; cell++) {
      const { x, y } = this.position(cell);
      this.svg.append(this.element('path', { d: `M${x - 3} ${y}h6 M${x} ${y - 3}v6`, class: 'grid-mark' }));
    }
    for (const cell of cellsOf(state)) {
      const { x, y } = this.position(cell);
      const token = this.element('g', { class: 'token' });
      const art = this.element('image', { x: x - 25, y: y - 25, width: 50, height: 50, class: 'token-art', href: `${ASSET_ROOT}chip-blue.png`, 'pointer-events': 'none' });
      const circle = this.element('circle', { cx: x, cy: y, r: 23, class: 'piece', 'data-cell': cell });
      const title = this.element('title', {}); title.textContent = `第 ${Math.floor(cell / state.width) + 1} 列，第 ${cell % state.width + 1} 欄`;
      circle.append(title); token.append(art, circle); this.svg.append(token);
    }
    const floor = this.element('path', { d: `M32 ${this.height - 28}H${this.width - 32}`, class: state.world === 'gravity' ? 'floor active' : 'floor' }); this.svg.append(floor);
  }
  select(move, actor = 'player') {
    this.svg.querySelectorAll('.piece').forEach(el => {
      const chosen = move.includes(Number(el.dataset.cell));
      const aiSelected = chosen && actor === 'ai';
      el.classList.toggle('selected', chosen);
      el.classList.toggle('ai-selected', aiSelected);
      el.parentElement.classList.toggle('is-selected', chosen && !aiSelected);
      el.parentElement.classList.toggle('is-ai-selected', aiSelected);
      el.parentElement.querySelector('.token-art').setAttribute('href', chosen ? `${ASSET_ROOT}chip-selected.png` : `${ASSET_ROOT}chip-blue.png`);
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
  async animate(before, move, result, actor) {
    const token = this.token;
    this.select(move, actor);
    if (actor === 'ai') await this.pause(420);
    if (token !== this.token) return;
    await Promise.all(move.map(cell => this.tween(this.svg.querySelector(`[data-cell="${cell}"]`).parentElement, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.72)' }], 180)));
    if (token !== this.token) return;
    this.draw(result.removed);
    await Promise.all(result.falls.filter(f => f.from !== f.to).map(f => {
      const el = this.svg.querySelector(`[data-cell="${f.from}"]`).parentElement, a = this.position(f.from), b = this.position(f.to);
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
