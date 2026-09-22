// Deterministic design workbench. No random generation is used in the shipped levels.
import { createState, cellsOf, rowsOf } from '../src/domain/GameState.js';
import { Solver } from '../src/domain/Solver.js';
import { transition } from '../src/domain/TransformationSystem.js';
import { generateLegalMoves } from '../src/domain/MoveGenerator.js';
const solver = new Solver();
const picks = { reform: [], predict: [], trap: [], boss: [] };
for (let mask = 1; mask < 4096; mask++) {
 const cells = Array.from({ length: 12 }, (_, i) => i).filter(i => mask & (1 << i));
 if (cells.length < 5 || cells.length > 10) continue;
 const s = createState(4, 3, cells, 'gravity'), a = solver.analyze(s);
 if (!a.winning || a.winningMoves.length > 2) continue;
 const opt = transition(s, a.optimalMove);
 const falls = opt.falls.some(f => f.from !== f.to);
 const newLine = generateLegalMoves(opt.state).some(m => m.length > 1 && !generateLegalMoves(opt.removed).some(old => old.join() === m.join()));
 const staticDisagrees = a.moves.some(m => m.winning !== !solver.solve(createState(s.width, s.height, cellsOf(transition(s,m.move).removed))).winning);
 const max = Math.max(...a.moves.map(m => m.move.length));
 const trap = a.losingMoves.find(m => m.move.length === max && max >= 3);
 const info = { rows: rowsOf(s), pieces: cells.length, legal: a.legalMoves, wins:a.winningMoves.length, depth:a.depth, optimal:a.optimalMove, next:rowsOf(opt.state), trap:trap?.move, staticDisagrees };
 if (falls && newLine && cells.length <= 6 && a.depth >= 3 && picks.reform.length < 8) picks.reform.push(info);
 if (falls && staticDisagrees && cells.length >= 6 && cells.length <= 7 && a.depth >= 5 && picks.predict.length < 8) picks.predict.push(info);
 if (falls && trap && staticDisagrees && cells.length >= 7 && a.optimalMove.length < max && a.depth >= 5 && picks.trap.length < 8) picks.trap.push(info);
 if (falls && newLine && staticDisagrees && cells.length >= 9 && a.depth >= 7 && picks.boss.length < 8) picks.boss.push(info);
}
console.log(JSON.stringify(picks,null,2));
