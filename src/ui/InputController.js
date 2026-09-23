import { occupied, cellsOf } from '../domain/GameState.js';
import { lineBetween } from '../domain/RuleEngine.js';
import { Gesture } from './Gesture.js';
export class InputController {
  constructor(svg, renderer, game) {
    Object.assign(this, { svg, renderer, game });
    this.pointer = null; this.gesture = null; this.anchor = null; this.cursor = 0;
    svg.addEventListener('pointerdown', e => this.down(e));
    svg.addEventListener('pointermove', e => this.move(e));
    svg.addEventListener('pointerup', e => this.up(e));
    svg.addEventListener('pointercancel', () => this.cancel());
    svg.addEventListener('lostpointercapture', () => this.cancel());
    svg.addEventListener('keydown', e => this.key(e));
    svg.addEventListener('blur', () => this.cancel());
  }
  get enabled() { return this.game.phase === 'ready' && this.game.turn === 'player'; }
  down(e) {
    if (this.pointer !== null) { this.cancel(); return; }
    if (!this.enabled || e.button !== 0 || !e.isPrimary) return;
    const point = this.renderer.point(e), cell = this.renderer.cellAt(point, true);
    if (cell === null || !occupied(this.game.state, cell)) return;
    e.preventDefault(); this.svg.focus({ preventScroll: true }); this.pointer = e.pointerId;
    this.svg.setPointerCapture(e.pointerId);
    this.gesture = new Gesture(this.game.state, cell, point); this.renderer.select([cell]);
  }
  move(e) {
    if (e.pointerId !== this.pointer || !this.gesture) return;
    const point = this.renderer.point(e);
    this.renderer.select(this.gesture.update(point, this.renderer.cellAt(point)));
  }
  up(e) {
    if (e.pointerId !== this.pointer || !this.gesture) return;
    const point = this.renderer.point(e), move = this.gesture.update(point, this.renderer.cellAt(point, true));
    this.cancel();
    if (this.enabled && move.length) void this.game.play(move);
  }
  cancel() {
    const pointer = this.pointer; this.pointer = null; this.gesture = null; this.anchor = null;
    if (pointer !== null && this.svg.hasPointerCapture(pointer)) this.svg.releasePointerCapture(pointer);
    this.renderer.select([]); this.renderer.focus(null);
  }
  key(e) {
    if (!this.enabled) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'e', 'z', 'c', ' ', 'Enter', 'Escape'].includes(key)) return;
    e.preventDefault();
    const s = this.game.state;
    if (this.cursor >= s.width * s.height) this.cursor = cellsOf(s)[0] ?? 0;
    const row = Math.floor(this.cursor / s.width), col = this.cursor % s.width;
    if (key === 'ArrowLeft' && col) this.cursor--;
    if (key === 'ArrowRight' && col < s.width - 1) this.cursor++;
    if (key === 'ArrowUp' && row) this.cursor -= s.width;
    if (key === 'ArrowDown' && row < s.height - 1) this.cursor += s.width;
    if (key === 'q' && row && col) this.cursor -= s.width + 1;
    if (key === 'e' && row && col < s.width - 1) this.cursor -= s.width - 1;
    if (key === 'z' && row < s.height - 1 && col) this.cursor += s.width - 1;
    if (key === 'c' && row < s.height - 1 && col < s.width - 1) this.cursor += s.width + 1;
    if (key === 'Escape') { this.cancel(); return; }
    if (key === ' ' && occupied(s, this.cursor)) this.anchor = this.cursor;
    const move = lineBetween(s, this.anchor ?? this.cursor, this.cursor);
    if (key === 'Enter') { this.cancel(); if (move.length) void this.game.play(move); return; }
    this.renderer.focus(this.cursor); this.renderer.select(this.anchor === null ? [] : move);
  }
}
