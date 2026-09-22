import { staticLevels } from './static.js';
import { gravityLevels } from './gravity.js';
export const levels = Object.freeze([...staticLevels, ...gravityLevels]);
