// Generates puzzle-book positions with the game's own rules and solver.
// Every puzzle: the player to move has exactly ONE winning move.
// Usage: node scripts/book-puzzles.js [seed] > puzzles.json
import { createState, rowsOf, stateId, withMask } from '../src/domain/GameState.js';
import { Solver } from '../src/domain/Solver.js';
import { encodePuzzle } from '../src/game/PuzzleLink.js';

export const BOOK_URL = 'https://brycekuo-proj.github.io/dynamic-nim/';

export const BOOK_LEVELS = [
  { level: 1, name: 'Small Boards', world: 'static', sizes: [[3, 3], [4, 3], [3, 4]], balls: [4, 6], depth: [3, 5], count: 20 },
  { level: 2, name: 'Bends and Branches', world: 'static', sizes: [[4, 4]], balls: [6, 8], depth: [5, 7], count: 20 },
  { level: 3, name: 'Crowded Boards', world: 'static', sizes: [[5, 4], [4, 5], [5, 5]], balls: [8, 11], depth: [7, 99], count: 20 },
  { level: 4, name: 'First Falls', world: 'gravity', sizes: [[4, 3], [3, 4], [4, 4]], balls: [5, 7], depth: [3, 99], count: 20 },
  { level: 5, name: 'Predict the Fall', world: 'gravity', sizes: [[4, 4], [5, 4]], balls: [7, 10], depth: [5, 99], count: 20 },
];

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const COLS = 'ABCDEFGH';
export const cellName = (width, cell) => `${COLS[cell % width]}${Math.floor(cell / width) + 1}`;

function mirrorKey(rows) {
  const a = rows.join('/'), b = rows.map(r => [...r].reverse().join('')).join('/');
  return a < b ? a : b;
}

export function generateBook(seed = 2026) {
  const rand = mulberry32(seed);
  const pick = list => list[Math.floor(rand() * list.length)];
  const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const solvers = { static: new Solver(), gravity: new Solver() };
  const seen = new Set();
  const puzzles = [];
  for (const spec of BOOK_LEVELS) {
    let made = 0, tries = 0;
    while (made < spec.count) {
      if (++tries > 200000) throw new Error(`Could not fill level ${spec.level}`);
      const [width, height] = pick(spec.sizes);
      const n = int(...spec.balls);
      const cells = [];
      while (cells.length < n) { const c = int(0, width * height - 1); if (!cells.includes(c)) cells.push(c); }
      // Like the game's own gravity levels, a start may have floating circles;
      // gravity only acts after a move.
      const state = createState(width, height, cells, spec.world);
      const rows = rowsOf(state);
      // Every row and column must be used so the drawn board has no empty margin.
      if (rows.some(r => !r.includes('#')) || [...Array(width).keys()].some(c => rows.every(r => r[c] === '.'))) continue;
      const key = `${spec.world}:${mirrorKey(rows)}`;
      if (seen.has(key)) continue;
      const solver = solvers[spec.world];
      const analysis = solver.analyze(state);
      if (analysis.winningMoves.length !== 1) continue;
      const [win] = analysis.winningMoves;
      if (win.depth < spec.depth[0] || win.depth > spec.depth[1]) continue;
      if (analysis.legalMoves < n + 2) continue;
      seen.add(key);
      made++;
      const id = puzzles.length + 1;
      const move = [...win.move].sort((a, b) => a - b);
      puzzles.push({
        id, level: spec.level, levelName: spec.name, world: spec.world, width, height, rows,
        stateId: stateId(state), legalMoves: analysis.legalMoves, depth: win.depth,
        answer: move, answerLabel: move.map(c => cellName(width, c)).join('–'),
        link: `${BOOK_URL}?p=${encodePuzzle(id, rows, spec.world)}`,
      });
    }
  }
  return puzzles;
}

export function staticLineValues(max = 8) {
  // Grundy values of one straight line under the 1–3 removal rule.
  const g = [0];
  for (let n = 1; n <= max; n++) {
    const options = new Set();
    for (let r = 1; r <= Math.min(3, n); r++) for (let left = 0; left <= n - r; left++) options.add(g[left] ^ g[n - r - left]);
    let mex = 0; while (options.has(mex)) mex++;
    g.push(mex);
  }
  return g;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const seed = Number(process.argv[2] ?? 2026);
  process.stdout.write(JSON.stringify({ seed, url: BOOK_URL, lineValues: staticLineValues(8), puzzles: generateBook(seed) }, null, 1));
}
