import { lineBetween } from '../domain/RuleEngine.js';

const AXES = [
  { name: 'horizontal', x: 1, y: 0 },
  { name: 'vertical', x: 0, y: 1 },
  { name: 'diagonal-down', x: Math.SQRT1_2, y: Math.SQRT1_2 },
  { name: 'diagonal-up', x: Math.SQRT1_2, y: -Math.SQRT1_2 },
];
const deviation = (axis, dx, dy) => Math.abs(dx * axis.y - dy * axis.x);

export class Gesture {
  constructor(state, start, point, position) { Object.assign(this, { state, start, point, position }); this.axis = null; this.invalid = false; this.move = [start]; }
  update(point, cell) {
    const dx = point.x - this.point.x, dy = point.y - this.point.y;
    if (!this.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 22) {
      this.axis = AXES.reduce((best, axis) => deviation(axis, dx, dy) < deviation(best, dx, dy) ? axis : best, AXES[0]);
    }
    if (cell === null || (this.axis && deviation(this.axis, dx, dy) > 24)) this.invalid = true;
    if (this.invalid) { this.move = []; return this.move; }
    // Nearest-cell rounding can momentarily snap a true diagonal drag to an
    // adjacent orthogonal cell. Do not permanently poison the gesture; only
    // commit when the current cell forms a legal line from the anchor.
    this.move = lineBetween(this.state, this.start, cell);
    return this.move;
  }
}
