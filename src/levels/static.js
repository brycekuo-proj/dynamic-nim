import { defineLevel } from './LevelDefinition.js';
export const staticLevels = [
  defineLevel(1, 'REMOVE', ['#'], 'static', '點一下圓圈。拿走最後一顆就獲勝。', '最後一顆，屬於你。', { maxWinning: 1 }),
  defineLevel(2, 'LINE', ['##'], 'static', '沿著直線劃過圓圈，放開就移除。', '一次劃過整條線。', { maxWinning: 1 }),
  defineLevel(3, 'NIM', ['#...', '....', '##..', '....', '####'], 'static', '三條線，三個數量。不要只看總數。', '試著留下 1 / 2 / 3。那是一個平衡局面。', { maxWinning: 4 }),
  defineLevel(4, 'MIRROR', ['.##.', '....', '.#..', '....', '.##.'], 'static', '找出多出來的那一顆，留下相同的兩條線。', '拿走中間那顆。之後對手動一條，你就鏡像回應另一條。', { maxWinning: 1 }),
  defineLevel(5, 'BALANCE', ['###...', '......', '####..', '......', '######'], 'static', '選擇很多，平衡的入口卻很少。', '從最上排的一端移除一顆。Solver 已驗證這會留下 P-position；中間移除會分裂線段。', { maxWinning: 2 }),
];
