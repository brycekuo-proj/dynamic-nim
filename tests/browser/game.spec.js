import { test, expect } from '@playwright/test';
import { Solver } from '../../src/domain/Solver.js';
import { createState } from '../../src/domain/GameState.js';
import { levels } from '../../src/levels/index.js';
const solver = new Solver();
async function point(page, cell) {
  const box = await page.locator(`[data-cell="${cell}"]`).boundingBox();
  if (!box) throw new Error(`Missing circle ${cell}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function drag(page, cells) {
  const first = await point(page, cells[0]), last = await point(page, cells.at(-1));
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (touch && page.context().browser().browserType().name() === 'chromium') {
    // Real trusted touch events via Chromium's input protocol, not DOM synthesis.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...first, id: 1 }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: first.x + (last.x-first.x)*i/8, y: first.y + (last.y-first.y)*i/8, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(first.x, first.y); await page.mouse.down();
    await page.mouse.move(last.x, last.y, { steps: 8 }); await page.mouse.up();
  }
}
async function seed(page, id, effects = false) {
  await page.addInitScript(({ id, effects }) => localStorage.setItem('dynamic-nim:v1', JSON.stringify({ highestUnlocked: id, currentLevel: id, completed: [], settings: { effects } })), { id, effects });
  await page.goto('/');
}
async function ready(page) { await expect(page.locator('#board')).toHaveAttribute('data-phase','ready'); await expect(page.locator('#board')).toHaveAttribute('data-turn','player'); }
async function winLevel(page) {
  for (let turn = 0; turn < 14; turn++) {
    if (await page.locator('#board').getAttribute('data-phase') === 'ended') break;
    await ready(page);
    const raw = JSON.parse(await page.locator('#board').getAttribute('data-state'));
    const state = createState(raw.width,raw.height,raw.cells,raw.world), move = solver.solve(state).optimalMove;
    await drag(page,move);
    await expect.poll(async()=> (await page.locator('#board').getAttribute('data-phase')) === 'ended' || ((await page.locator('#board').getAttribute('data-phase')) === 'ready' && (await page.locator('#board').getAttribute('data-turn')) === 'player' && JSON.parse(await page.locator('#board').getAttribute('data-state')).id !== raw.id)).toBe(true);
  }
  await expect(page.locator('#status')).toContainText('你獲勝');
}
test('first two levels can be played and unlocks survive reload', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#level-name')).toHaveText('REMOVE');
  await drag(page,[0]); await expect(page.locator('#status')).toContainText('你獲勝');
  await page.locator('#next-button').click(); await expect(page.locator('#level-name')).toHaveText('LINE');
  await drag(page,[0,1]); await expect(page.locator('#status')).toContainText('你獲勝');
  await page.reload(); await expect(page.locator('#level-name')).toHaveText('LINE');
  await page.locator('#levels-button').click();
  await expect(page.locator('#level-list button').nth(2)).toBeEnabled();
  await expect(page.locator('#level-list button').nth(3)).toBeDisabled();
  expect(errors).toEqual([]);
});
test('Math mode is opt-in; CRT setting persists; touch tap works', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#math')).toBeHidden();
  await page.locator('#math-button').click();
  await expect(page.locator('#math-data')).toContainText('WINNING MOVES  1');
  await expect(page.locator('#math-data')).toContainText('NIM SUM        1');
  await page.locator('#effects-button').click(); await page.reload();
  await expect(page.locator('#effects-button')).toHaveText('CRT OFF');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const p = await point(page,0);
  if (await page.evaluate(()=>navigator.maxTouchPoints>0)) await page.touchscreen.tap(p.x,p.y); else await page.mouse.click(p.x,p.y);
  await expect(page.locator('#status')).toContainText('你獲勝');
});
test('play all ten levels through browser input against AI, including chapter transition', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const errors = []; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/'); await page.locator('#effects-button').click();
  for (const level of levels) {
    await expect(page.locator('#level-name')).toHaveText(level.name);
    await winLevel(page);
    if (level.id === 5) {
      await page.locator('#next-button').click();
      await expect(page.locator('#chapter-transition')).toBeVisible();
      await expect(page.locator('#chapter-transition')).toContainText('GRAVITY ↓');
    } else if (level.id < 10) await page.locator('#next-button').click();
  }
  const save = await page.evaluate(()=>JSON.parse(localStorage.getItem('dynamic-nim:v1')));
  expect(save.highestUnlocked).toBe(10); expect(save.completed).toHaveLength(10);
  await page.locator('#analyze-button').click(); await expect(page.locator('#trace li')).toHaveCount(9);
  await page.screenshot({ path:`artifacts/completed-${testInfo.project.name}.png`, fullPage:true });
  expect(errors).toEqual([]);
});
for (const { id, heaps, xor } of [
  { id: 3, heaps: '1 / 2 / 4', xor: 7 },
  { id: 5, heaps: '3 / 4 / 6', xor: 1 },
  ...[6, 7, 8, 9, 10].map(id => ({ id, xor: 'N/A' })),
]) {
  test(`L${id} Math mode reports the correct heaps and Nim sum`, async ({ page }) => {
    await seed(page, id); await page.locator('#math-button').click();
    await expect(page.locator('#math-data')).toContainText(`NIM SUM        ${xor}`);
    if (heaps) await expect(page.locator('#math-data')).toContainText(`HEAPS          ${heaps}`);
    else await expect(page.locator('#math-data')).not.toContainText('HEAPS');
    if (id === 5) await expect(page.locator('#math-data')).toContainText('LEGAL MOVES    30');
  });
}
test('invalid angle, gap, over-limit, bent drag and outside release cancel without a turn', async ({ page }) => {
  await seed(page,3);
  const original = await page.locator('#board').getAttribute('data-state');
  await drag(page,[0,9]); // not horizontal, vertical, or 45-degree diagonal
  await drag(page,[0,8]); // vertical gap
  await drag(page,[16,19]); // four contiguous circles exceeds the per-turn limit of three
  const first = await point(page,16), end = await point(page,19);
  await page.mouse.move(first.x,first.y); await page.mouse.down();
  await page.mouse.move(first.x+60,first.y-60); await page.mouse.move(end.x,end.y); await page.mouse.up();
  await page.mouse.move(first.x,first.y); await page.mouse.down(); await page.mouse.move(0,0); await page.mouse.up();
  await expect(page.locator('#board')).toHaveAttribute('data-state',original); await ready(page);
});
test('vertical and 45-degree diagonal drags are playable in the browser', async ({ page }) => {
  await seed(page,7);
  const diagonalBefore = await page.locator('#board').getAttribute('data-state');
  await drag(page,[3,6]);
  await expect.poll(async () => await page.locator('#board').getAttribute('data-state')).not.toBe(diagonalBefore);

  await seed(page,10);
  const verticalBefore = await page.locator('#board').getAttribute('data-state');
  await drag(page,[1,5]);
  await expect.poll(async () => await page.locator('#board').getAttribute('data-state')).not.toBe(verticalBefore);
});

test('losing move awards AI and allows retry without unlocking', async ({ page }) => {
  await seed(page,2); await drag(page,[0]); await expect(page.locator('#status')).toContainText('COMPUTER WINS');
  await expect(page.locator('#progress')).toContainText('02 / 10');
  await page.locator('#next-button').click(); await ready(page); await expect(page.locator('.piece')).toHaveCount(2);
});
test('restarting during AI delay leaves the new board intact', async ({ page }) => {
  await seed(page,2,true); await drag(page,[0]);
  await expect(page.locator('#board')).toHaveAttribute('data-turn','ai');
  await page.locator('#restart-button').click();
  await page.waitForTimeout(1300);
  await ready(page); await expect(page.locator('.piece')).toHaveCount(2);
});
test('gravity animates surviving circles and locks input until AI finishes', async ({ page }, testInfo) => {
  await seed(page,6,true);
  await page.screenshot({path:`artifacts/fall-${testInfo.project.name}.png`,fullPage:true});
  await drag(page,[7]);
  await expect(page.locator('#board')).toHaveAttribute('data-phase','animating');
  await expect.poll(()=>page.locator('#board').evaluate(svg=>svg.getAnimations({subtree:true}).some(a=>a.effect.getKeyframes().some(f=>f.transform?.includes('translateY'))))).toBe(true);
  await ready(page); await expect(page.locator('.piece')).toHaveCount(1);
  await page.locator('#math-button').click(); await expect(page.locator('#math-data')).toContainText('NIM SUM        N/A');
});
test('keyboard can remove a line; narrow and landscape layouts remain usable', async ({ page }) => {
  await seed(page,2); await page.locator('#board').focus();
  await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  await expect(page.locator('#status')).toContainText('你獲勝');
  for (const viewport of [{width:320,height:568},{width:844,height:390}]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#restart-button')).toBeVisible();
  }
});
test('pointer cancellation never commits a move and reduced motion is honored', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'}); await seed(page,2,true);
  const p = await point(page,0);
  await page.mouse.move(p.x,p.y); await page.mouse.down();
  await expect(page.locator('.selected')).toHaveCount(1);
  await page.locator('#board').dispatchEvent('pointercancel',{pointerId:1});
  await page.mouse.up(); await ready(page); await expect(page.locator('.piece')).toHaveCount(2);
  expect(await page.locator('.cursor').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
