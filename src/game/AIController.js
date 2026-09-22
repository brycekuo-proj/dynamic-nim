export class AIController {
  constructor(solver) { this.solver = solver; }
  choose(state) {
    const result = this.solver.solve(state);
    // Solver selects fastest forced win or longest resistance. Its stable
    // row-major, singleton/horizontal/vertical ordering breaks every tie.
    return result.optimalMove ? [...result.optimalMove] : null;
  }
}
