import { defineLevel } from './LevelDefinition.js';
export const gravityLevels = [
  defineLevel(6, 'FALL', ['#.#', '...', '.#.'], 'gravity', '世界變了。每次移除後，圓圈都會向下掉。', '移除下方中間那顆，觀察兩側落下。', { maxWinning: 1, everyOpeningFalls: true }),
  defineLevel(7, 'REFORM', ['.###', '##..', '....'], 'gravity', '落下之後，原本分開的圓圈會排成新的直線。', '劃掉最上排右邊兩顆。觀察底部的新直線。', { maxWinning: 1, newLine: true, gravityMatters: true }),
  defineLevel(8, 'PREDICT', ['#.##', '###.', '....'], 'gravity', '先在腦中落下，再決定劃去哪一段。', '移除第二排右邊兩顆，留下兩組互不接觸的 2。', { maxWinning: 1, gravityMatters: true, minDepth: 5 }),
  defineLevel(9, 'TRAP', ['####', '#..#', '#...'], 'gravity', '一次拿最多，真的最好嗎？想想電腦會收到什麼。', '別劃掉整排。保留右上那顆，讓掉落後的兩欄一樣高。', { maxWinning: 2, trap: [0, 1, 2, 3], gravityMatters: true, minDepth: 5 }),
  defineLevel(10, 'GRAVITY TEST', ['####', '#.##', '#...', '#...'], 'gravity', '直線、平衡、落下。把下一個局面留給電腦。', '從右邊的一對水平圓圈開始。落下後是兩條等長、共用轉角的臂；用 Math 模式追蹤對應回應。', { maxWinning: 2, gravityMatters: true, newLine: true, minDepth: 7 }),
];
