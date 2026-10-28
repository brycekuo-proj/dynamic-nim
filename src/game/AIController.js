export class AIController {
  constructor(solver) { this.solver = solver; }
  // The caller passes the solver for the current win condition (normal or misère).
  choose(state, solver = this.solver) {
    const result = solver.solve(state);
    // Solver selects fastest forced win or longest resistance. Its stable
    // row-major, singleton/horizontal/vertical ordering breaks every tie.
    return result.optimalMove ? [...result.optimalMove] : null;
  }
}
