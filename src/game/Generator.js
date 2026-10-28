import { createState, cellsOf, rowsOf } from '../domain/GameState.js';
import { gravityDown } from '../domain/TransformationSystem.js';
import { defineLevel } from '../levels/LevelDefinition.js';

// Seeded puzzles for endless play, the daily puzzle and two-player boards.
// Every endless/daily puzzle is checked by the solver for the chosen win rule: the
// player to move can force a win, with only a few winning first moves (fewer and
// deeper as the difficulty rises). The same seed always gives the same puzzle.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(text) {
  let h = 2166136261;
  for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Local calendar day, so the daily puzzle changes at the player's midnight.
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({ sizes: [[3, 3], [4, 3]], pieces: [4, 6], maxWinning: 3, minDepth: 2 }),
  normal: Object.freeze({ sizes: [[4, 3], [4, 4]], pieces: [6, 9], maxWinning: 2, minDepth: 4 }),
  hard: Object.freeze({ sizes: [[4, 4], [5, 4]], pieces: [8, 11], maxWinning: 1, minDepth: 6 }),
});
export const DUO_SIZES = Object.freeze({
  small: Object.freeze({ sizes: [[3, 3], [4, 3]], pieces: [5, 7] }),
  medium: Object.freeze({ sizes: [[4, 4]], pieces: [8, 11] }),
  large: Object.freeze({ sizes: [[5, 5], [5, 4]], pieces: [12, 15] }),
});

const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const between = (rand, [lo, hi]) => lo + Math.floor(rand() * (hi - lo + 1));

// A random board of the given size; gravity boards are returned already settled.
function randomBoard(rand, spec, world) {
  const [width, height] = pick(rand, spec.sizes);
  const count = Math.min(between(rand, spec.pieces), width * height - 1);
  const cells = new Set();
  while (cells.size < count) cells.add(Math.floor(rand() * width * height));
  let state = createState(width, height, [...cells], world);
  if (world === 'gravity') state = gravityDown(state).state;
  return trim(state);
}
// Drop empty edge rows and columns. Nothing can move into them (gravity only pulls
// down, and a settled board has no gaps under its pieces), so the game is unchanged.
function trim(state) {
  const cells = cellsOf(state);
  const rows = cells.map(c => Math.floor(c / state.width)), cols = cells.map(c => c % state.width);
  const top = Math.min(...rows), bottom = Math.max(...rows), left = Math.min(...cols), right = Math.max(...cols);
  const width = right - left + 1, height = bottom - top + 1;
  return createState(width, height, cells.map(c => (Math.floor(c / state.width) - top) * width + (c % state.width - left)), state.world);
}

const COLS = 'ABCDEFGH';
const cellName = (state, cell) => `${COLS[cell % state.width]}${Math.floor(cell / state.width) + 1}`;

// Text is produced by the UI from these fields so it can be translated.
function makeLevel(state, extra) {
  const level = defineLevel(1, extra.name ?? 'PUZZLE', rowsOf(state), state.world, '', '', {}, { mode: extra.mode });
  return Object.freeze({ ...level, ...extra, id: extra.number ?? 1 });
}

// Endless and daily puzzles. Constraints are relaxed step by step if a seed is unlucky,
// so generation always finishes quickly.
export function generatePuzzle({ mode = 'normal', difficulty = 'normal', seed = 1, solver, kind = 'endless', number = 1, world = null }) {
  const spec = DIFFICULTIES[difficulty];
  if (!spec || !solver) throw new Error('Unknown difficulty or missing solver');
  const rand = mulberry32(seed);
  const relax = [{}, { minDepth: spec.minDepth - 2 }, { minDepth: 2, maxWinning: spec.maxWinning + 1 }];
  for (const loosen of relax) {
    const maxWinning = loosen.maxWinning ?? spec.maxWinning, minDepth = loosen.minDepth ?? spec.minDepth;
    for (let attempt = 0; attempt < 400; attempt++) {
      const w = world ?? (rand() < 0.5 ? 'static' : 'gravity');
      const state = randomBoard(rand, spec, w);
      if (cellsOf(state).length < spec.pieces[0] - 1) continue;
      const a = solver.analyze(state);
      if (!a.winning || a.winningMoves.length > maxWinning || a.depth < minDepth) continue;
      const first = a.winningMoves[0];
      return makeLevel(state, {
        kind, mode, difficulty, number, seed,
        winningCount: a.winningMoves.length,
        hintMove: { size: first.move.length, from: cellName(state, Math.min(...first.move)) },
      });
    }
  }
  throw new Error('Could not generate a puzzle');
}

// Two-player boards: any random position (two people decide who is better).
export function generateDuoBoard({ mode = 'normal', size = 'medium', seed = 1 }) {
  const spec = DUO_SIZES[size];
  if (!spec) throw new Error('Unknown board size');
  const rand = mulberry32(seed);
  const world = rand() < 0.5 ? 'static' : 'gravity';
  let state = randomBoard(rand, spec, world);
  while (cellsOf(state).length < 2) state = randomBoard(rand, spec, world);
  return makeLevel(state, { kind: 'duo', mode, size, seed, number: 1 });
}
