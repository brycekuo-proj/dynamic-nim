import { defineLevel } from './LevelDefinition.js';
// "Last one loses" (misère) campaign. Same two chapters as the normal campaign,
// but every board was chosen with the misère solver: the player to move can win,
// there are only one or two winning first moves, and from level 3 on the move that
// would win under normal rules is usually the trap here.
const M = { mode: 'misere' };
export const misereLevels = [
  defineLevel(1, 'LEAVE ONE', ['##'], 'static', '新規則：拿到最後一顆的人輸。這次要讓電腦吃下最後一顆。', '只拿一顆。剩下那顆電腦非拿不可。', { maxWinning: 2 }, M),
  defineLevel(2, 'LONG BITE', ['####'], 'static', '一次可以拿 1–3 顆。四顆排成一排，你要拿幾顆？', '一口氣拿三顆，只留一顆給電腦。', { maxWinning: 2 }, M),
  defineLevel(3, 'SINGLE', ['#.', '..', '##'], 'static', '一條一顆、一條兩顆。平常會把兩邊拿成一樣多，這次不一樣。', '把下面兩顆一次拿光，只剩上面那一顆。', { maxWinning: 1, normalTrap: true }, M),
  defineLevel(4, 'THREE ALONE', ['#....', '.....', '#####'], 'static', '這盤在「拿最後一顆贏」是必輸的；規則反過來，就有一條路。', '從五顆那排正中間拿走三顆，留下三顆各自單獨的甜甜圈。', { maxWinning: 1, normalLoses: true }, M),
  defineLevel(5, 'EDGE', ['####.', '.....', '#####'], 'static', '兩條長線，選擇很多，安全的入口只有兩個。', '從五顆那排的最左或最右拿走一顆。', { maxWinning: 2, minDepth: 8 }, M),
  defineLevel(6, 'COLUMN', ['#..', '#..', '#.#'], 'gravity', '重力回來了：每一步之後，上面的甜甜圈會往下掉。', '把左邊那一整欄三顆一次拿光。', { maxWinning: 1, gravityMatters: true, normalTrap: true }, M),
  defineLevel(7, 'ONE IS ENOUGH', ['...', '.##', '###'], 'gravity', '可以拿三顆，不代表應該拿三顆。', '只拿左下角那一顆。', { maxWinning: 1, gravityMatters: true, normalTrap: true }, M),
  defineLevel(8, 'DROP', ['..##', '#.##', '#.##'], 'gravity', '先想好：拿走之後，誰會掉到哪裡。', '左邊那欄只拿一顆，讓另一顆掉下來補位。', { maxWinning: 2, gravityMatters: true, normalTrap: true, minDepth: 6 }, M),
  defineLevel(9, 'TRAP', ['#...', '##..', '###.', '####'], 'gravity', '階梯形的甜甜圈。一般規則的好棋，在這裡全是陷阱。', '只拿 C 欄的一顆（C3 或 C4）。', { maxWinning: 2, gravityMatters: true, normalTrap: true, minDepth: 6 }, M),
  defineLevel(10, 'LAST BITE', ['....', '.###', '####', '####'], 'gravity', '最後一關：十一顆、四十八種走法，只有一種能贏。', '把最右邊那一欄三顆一次拿光。', { maxWinning: 1, gravityMatters: true, normalTrap: true, minDepth: 6 }, M),
];
