import { test, expect } from '@playwright/test';

test('game-night board renders chips, coordinates, fonts and decorations without missing assets', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('dynamic-nim:v1', JSON.stringify({
      highestUnlocked: 10, currentLevel: 10, completed: [1, 2, 3, 4, 5, 6, 7, 8, 9], settings: { effects: true },
    }));
  });
  const missingAssets = [];
  page.on('response', response => { if (!response.ok()) missingAssets.push(response.url()); });
  await page.goto('/');
  await expect(page.locator('#board')).toHaveAttribute('data-level', '10');
  await expect(page.locator('#board .piece')).toHaveCount(10);
  await expect(page.locator('#board .chip')).toHaveCount(10);
  await expect(page.locator('#board .coord')).toHaveCount(8);
  await expect(page.locator('#board .ledge')).toHaveCount(1);
  for (const img of await page.locator('#board .chip').all()) expect(await img.getAttribute('href')).toMatch(/assets\/kenney\/chip-(red|blue|green|black|whiteblue)\.png$/);
  await expect(page.locator('#mission-track span')).toHaveCount(10);
  await expect(page.locator('#mission-track span.completed')).toHaveCount(9);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('700 16px Poppins'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px Huninn', '籌碼'))).toBe(true);
  expect(await page.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(missingAssets).toEqual([]);
  await page.screenshot({ path: `artifacts/visual-${testInfo.project.name}.png`, fullPage: true });
});

test('mobile first screen prioritizes a large playable board', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'));
  await page.goto('/');
  const metrics = await page.evaluate(() => {
    const board = document.querySelector('#board').getBoundingClientRect();
    const token = document.querySelector('.piece').getBoundingClientRect();
    const topbar = document.querySelector('.topbar').getBoundingClientRect();
    return { width: innerWidth, height: innerHeight, boardTop: board.top, boardBottom: board.bottom, boardWidth: board.width,
      boardHeight: board.height, tokenWidth: token.width, topbarHeight: topbar.height,
      overflow: document.documentElement.scrollWidth > innerWidth };
  });
  console.log('Mobile layout metrics:', JSON.stringify(metrics));
  expect(metrics.overflow).toBe(false);
  expect(metrics.topbarHeight).toBeLessThan(90);
  expect(metrics.boardTop).toBeLessThan(260);
  expect(metrics.boardBottom).toBeLessThan(metrics.height);
  expect(metrics.boardWidth).toBeGreaterThan(metrics.width - 44);
  expect(metrics.boardHeight).toBeGreaterThan(300);
  expect(metrics.tokenWidth).toBeGreaterThan(55);
});

test('rules fold on phones and stay readable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'));
  await page.goto('/');
  const rules = page.locator('#rules');
  await expect(rules).not.toHaveAttribute('open', '');
  await rules.locator('summary').click();
  await expect(rules).toHaveAttribute('open', '');
  await expect(rules).toContainText('45°');
  await expect(rules).toContainText('1–3');
  await expect(page.locator('#board')).toBeVisible();
});
