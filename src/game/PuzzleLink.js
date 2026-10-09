import { defineLevel } from '../levels/LevelDefinition.js';

// Book puzzle links: ?p=<number>-<world>-<row>-<row>...
// world is "s" (static) or "g" (gravity); rows use "o" for a circle and "." for empty,
// top row first. Example: ?p=12-g-.o..-oo.o-oooo
// "#" is avoided because it would start the URL fragment.
const WORLD_CODES = Object.freeze({ s: 'static', g: 'gravity' });
const PATTERN = /^(\d{1,4})-([sg])-([o.]{1,8}(?:-[o.]{1,8}){0,7})$/;

export function encodePuzzle(number, rows, world) {
  const code = Object.keys(WORLD_CODES).find(key => WORLD_CODES[key] === world);
  if (!code) throw new Error(`Unsupported world: ${world}`);
  return `${number}-${code}-${rows.map(row => row.replace(/#/g, 'o')).join('-')}`;
}

export function parsePuzzle(param) {
  const match = PATTERN.exec(param ?? '');
  if (!match) return null;
  const number = Number(match[1]);
  const rows = match[3].split('-').map(row => row.replace(/o/g, '#'));
  if (!rows.some(row => row.includes('#'))) return null;
  try {
    const level = defineLevel(0, `BOOK #${number}`, rows, WORLD_CODES[match[2]],
      '輪到你。找出唯一的必勝步，再把這一局下完、贏過電腦。',
      '答案在書末。座標和書上一樣：字母是欄，數字是列。');
    return Object.freeze({ ...level, book: true, puzzle: number });
  } catch {
    return null;
  }
}
