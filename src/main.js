import './style.css';
import { levels, levelSets } from './levels/index.js';
import { Solver } from './domain/Solver.js';
import { SaveStore } from './game/SaveStore.js';
import { AIController } from './game/AIController.js';
import { GameController } from './game/GameController.js';
import { Renderer } from './ui/Renderer.js';
import { InputController } from './ui/InputController.js';
import { UIController } from './ui/UIController.js';
import { Sound } from './ui/Sound.js';
import { parsePuzzle } from './game/PuzzleLink.js';
import { Ads } from './ads/Ads.js';
let storage;
try { storage = localStorage; } catch { /* Private/blocked storage: session-only progression. */ }
const save = new SaveStore(storage), solver = new Solver(), solvers = { normal: solver, misere: new Solver({ mode: 'misere' }) };
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const sound = new Sound(() => save.data.settings.sound);
const renderer = new Renderer(document.getElementById('board'), () => reduced.matches || !save.data.settings.effects, sound);
const game = new GameController({ levels, solver, save, renderer, ai: new AIController(solver), levelSets, solvers });
const ads = new Ads();
const ui = new UIController(game, save, levelSets, sound, ads);
game.onChange = g => ui.update(g);
ui.input = new InputController(renderer.svg, renderer, game);
const bookPuzzle = parsePuzzle(new URLSearchParams(location.search).get('p'));
if (bookPuzzle) ui.loadBook(bookPuzzle); else ui.load(save.progress.currentLevel);
void ads.start(); // no-op outside the Android app
