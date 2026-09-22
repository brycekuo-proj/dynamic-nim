import { lineBetween } from '../domain/RuleEngine.js';
export class Gesture {
  constructor(state, start, point, position) { Object.assign(this, { state, start, point, position }); this.axis = null; this.invalid = false; this.move = [start]; }
  update(point, cell) {
    const dx = point.x - this.point.x, dy = point.y - this.point.y;
    if (!this.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 22) this.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (cell === null || (this.axis && Math.abs(this.axis === 'x' ? dy : dx) > 24)) this.invalid = true;
    const move = cell === null ? [] : lineBetween(this.state, this.start, cell);
    if (!move.length) this.invalid = true;
    this.move = this.invalid ? [] : move;
    return this.move;
  }
}
