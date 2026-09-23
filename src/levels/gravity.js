import { defineLevel } from './LevelDefinition.js';
export const gravityLevels = [
  defineLevel(6, 'FALL', ['#.#', '...', '.#.'], 'gravity', '世界變了。每次移除後，圓圈都會向下掉。', '移除下方中間那顆，觀察兩側落下。', { maxWinning: 1, everyOpeningFalls: true }),
  defineLevel(7, 'REFORM', ['.#.#', '.##.', '#...'], 'gravity', '斜線也是合法方向。移除後再看重力會把哪些圓圈重新排成線。', '沿 45° 斜線拿掉右上與中右兩顆，再觀察掉落後形成的新直線。', { maxWinning: 1, newLine: true, gravityMatters: true }),
  defineLevel(8, 'PREDICT', ['#.##', '.#.#', '#...'], 'gravity', '橫、直、斜都能刪。先在腦中完成移除與落下，再判斷下一局。', '右上往左下的 45° 兩顆是唯一必勝入口；先想它們掉落後的位置。', { maxWinning: 1, gravityMatters: true, minDepth: 5 }),
  defineLevel(9, 'TRAP', ['####', '#..#', '#...'], 'gravity', '一次拿滿 3 顆，真的最好嗎？同樣是三顆，位置會改變結果。', '別從最上排右側連拿三顆；那是陷阱。比較左側三顆移除後的掉落結果。', { maxWinning: 2, trap: [1, 2, 3], gravityMatters: true, minDepth: 5 }),
  defineLevel(10, 'GRAVITY TEST', ['####', '###.', '###.', '....'], 'gravity', '最多三顆。直線、平衡、落下，把真正的下一個局面留給電腦。', '試著移除第二欄相鄰的兩顆。重力會在底部形成四連線，但你仍不能一次拿完。', { maxWinning: 2, gravityMatters: true, newLine: true, minDepth: 7 }),
];
