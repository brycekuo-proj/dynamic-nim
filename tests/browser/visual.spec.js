import { test, expect } from '@playwright/test';

test('Kenney CC0 token sprites and navigation render without missing assets', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('dynamic-nim:v1', JSON.stringify({
      highestUnlocked: 10, currentLevel: 10, completed: [], settings: { effects: true },
    }));
  });
  const missingAssets = [];
  page.on('response', response => {
    if (response.url().includes('/assets/kenney/') && !response.ok()) missingAssets.push(response.url());
  });
  await page.goto('/');
  await expect(page.locator('#board')).toHaveAttribute('data-level', '10');
  await expect(page.locator('#board .piece')).toHaveCount(10);
  await expect(page.locator('#board .token-art')).toHaveCount(10);
  await expect(page.locator('#mission-track span')).toHaveCount(10);
  await expect(page.locator('.board-topline img')).toHaveJSProperty('complete', true);
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
    const masthead = document.querySelector('.masthead').getBoundingClientRect();
    const banner = document.querySelector('.identity').getBoundingClientRect();
    return { width: innerWidth, boardTop: board.top, boardWidth: board.width,
      boardHeight: board.height, tokenWidth: token.width, mastheadHeight: masthead.height,
      bannerHeight: banner.height, overflow: document.documentElement.scrollWidth > innerWidth,
      sections: ['.mission-card','.mobile-rules','.toolbar','.game-headline','.board-topline'].map(s => {
        const r=document.querySelector(s).getBoundingClientRect();return {s,top:Math.round(r.top),height:Math.round(r.height)};
      }) };
  });
  console.log('Mobile compact-layout metrics:', JSON.stringify(metrics));
  expect(metrics.overflow).toBe(false);
  expect(metrics.mastheadHeight).toBeLessThan(43);
  expect(metrics.bannerHeight).toBeLessThan(55);
  expect(metrics.boardTop).toBeLessThan(295);
  expect(metrics.boardWidth).toBeGreaterThan(metrics.width - 40);
  expect(metrics.boardHeight).toBeGreaterThan(300);
  expect(metrics.tokenWidth).toBeGreaterThan(55);
});

test('mobile game rules remain accessible without obscuring the board', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'));
  await page.goto('/');
  const rules = page.locator('.mobile-rules');
  await expect(rules.locator('summary')).toBeVisible();
  await expect(rules).not.toHaveAttribute('open', '');
  await rules.locator('summary').click();
  await expect(rules).toHaveAttribute('open', '');
  await expect(rules).toContainText('45°');
  await expect(rules).toContainText('1–3');
  await expect(page.locator('#board')).toBeVisible();
});
