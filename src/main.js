import './style.css';
import { levels } from './levels/index.js';
import { Solver } from './domain/Solver.js';
import { SaveStore } from './game/SaveStore.js';
import { AIController } from './game/AIController.js';
import { GameController } from './game/GameController.js';
import { Renderer } from './ui/Renderer.js';
import { InputController } from './ui/InputController.js';
import { UIController } from './ui/UIController.js';
let storage;
try { storage = localStorage; } catch { /* Private/blocked storage: session-only progression. */ }
const save = new SaveStore(storage), solver = new Solver();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const renderer = new Renderer(document.getElementById('board'), () => reduced.matches || !save.data.settings.effects);
const game = new GameController({ levels, solver, save, renderer, ai: new AIController(solver) });
const ui = new UIController(game, save, levels);
game.onChange = g => ui.update(g);
ui.input = new InputController(renderer.svg, renderer, game);
ui.load(save.data.currentLevel);
