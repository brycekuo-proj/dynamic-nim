import { staticLevels } from './static.js';
import { gravityLevels } from './gravity.js';
import { misereLevels } from './misere.js';
export const levels = Object.freeze([...staticLevels, ...gravityLevels]);
// One ten-level campaign per win condition; both use ids 1–10.
export const levelSets = Object.freeze({ normal: levels, misere: Object.freeze([...misereLevels]) });
