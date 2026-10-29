import { test, expect } from '@playwright/test';
import { Solver } from '../../src/domain/Solver.js';
import { createState } from '../../src/domain/GameState.js';
const solver = new Solver();
const boardState = async page => JSON.parse(await page.locator('#board').getAttribute('data-state'));
async function tapCell(page, cell) {
  const target = page.locator(`[data-cell="${cell}"]`);
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
async function dragCells(page, cells) {
  await page.locator('#board').scrollIntoViewIfNeeded();
  const a = await page.locator(`[data-cell="${cells[0]}"]`).boundingBox(), b = await page.locator(`[data-cell="${cells.at(-1)}"]`).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 }); await page.mouse.up();
}
const ended = async page => (await page.locator('#board').getAttribute('data-phase')) === 'ended';
// Plays optimal moves for the player until the game ends (the computer answers in between).
async function solve(page) {
  for (let turn = 0; turn < 20 && !(await ended(page)); turn++) {
    await expect(page.locator('#board')).toHaveAttribute('data-turn', 'player', { timeout: 8000 });
    await expect(page.locator('#board')).toHaveAttribute('data-phase', /ready|ended/);
    if (await ended(page)) break;
    const raw = await boardState(page);
    await dragCells(page, solver.solve(createState(raw.width, raw.height, raw.cells, raw.world)).optimalMove);
    await expect.poll(async () => (await ended(page)) || ((await boardState(page)).id !== raw.id && (await page.locator('#board').getAttribute('data-turn')) === 'player' && (await page.locator('#board').getAttribute('data-phase')) === 'ready'), { timeout: 8000 }).toBe(true);
  }
}
async function openPlay(page, play) {
  await page.locator('#levels-button').click();
  await page.locator(`.play-tab[data-play="${play}"]`).click();
}

test('two players share one device and take turns until someone wins', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { if (!localStorage.getItem('dynamic-nim:v1')) localStorage.setItem('dynamic-nim:v1', JSON.stringify({ highestUnlocked: 1, currentLevel: 1, completed: [], settings: { effects: false, sound: false } })); });
  await page.goto('/');
  await openPlay(page, 'duo');
  await page.locator('[data-duo="small"]').click();
  await expect(page.locator('#level-name')).toHaveText('雙人對戰');
  await expect(page.locator('#hint-button')).toBeHidden();
  for (let turn = 0; turn < 20 && !(await ended(page)); turn++) {
    const who = turn % 2 === 0 ? 1 : 2;
    await expect(page.locator('#status')).toHaveText(`輪到玩家 ${who}`);
    await expect(page.locator('#board')).toHaveAttribute('aria-disabled', 'false');
    const before = await boardState(page);
    await tapCell(page, before.cells[0]);
    await expect.poll(async () => (await boardState(page)).id !== before.id || (await ended(page))).toBe(true);
    await expect(page.locator('#board')).toHaveAttribute('data-phase', /ready|ended/);
  }
  await expect(page.locator('#status')).toHaveText(/玩家 [12] 獲勝/);
  await expect(page.locator('#outcome-text')).toContainText('獲勝');
  await expect(page.locator('#next-button')).toHaveText('再來一局 ↺');
  // Two-player games never touch campaign progress.
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('dynamic-nim:v1'))).completed).toEqual([]);
  expect(errors).toEqual([]);
});

test('endless puzzles are solvable, count as solved and move on to the next one', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('dynamic-nim:v1')) localStorage.setItem('dynamic-nim:v1', JSON.stringify({ highestUnlocked: 1, currentLevel: 1, completed: [], settings: { effects: false, sound: false } })); });
  await page.goto('/');
  await openPlay(page, 'endless');
  await expect(page.locator('[data-endless="easy"] small')).toHaveText('已解 0 題');
  await page.locator('[data-endless="easy"]').click();
  await expect(page.locator('#level-number')).toHaveText('∞');
  await expect(page.locator('#level-name')).toHaveText('第 1 題');
  await page.locator('#hint-button').click();
  await expect(page.locator('#hint')).toContainText('必勝走法');
  await solve(page);
  await expect(page.locator('#status')).toHaveText('你獲勝');
  await expect(page.locator('#next-button')).toHaveText('下一題 →');
  await page.locator('#next-button').click();
  await expect(page.locator('#level-name')).toHaveText('第 2 題');
  await page.reload();
  await openPlay(page, 'endless');
  await expect(page.locator('[data-endless="easy"] small')).toHaveText('已解 1 題');
});

test('the daily puzzle is the same for everyone today and builds a streak', async ({ page, browser }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('dynamic-nim:v1')) localStorage.setItem('dynamic-nim:v1', JSON.stringify({ highestUnlocked: 1, currentLevel: 1, completed: [], settings: { effects: false, sound: false } })); });
  await page.goto('/');
  await openPlay(page, 'daily');
  await page.locator('#daily-button').click();
  await expect(page.locator('#level-number')).toHaveText('日');
  const first = await boardState(page);
  // A different visitor gets the same board.
  const other = await browser.newPage(); await other.goto('/');
  await other.locator('#levels-button').click(); await other.locator('.play-tab[data-play="daily"]').click(); await other.locator('#daily-button').click();
  expect((await boardState(other)).id).toBe(first.id); await other.close();
  await solve(page);
  await expect(page.locator('#outcome-text')).toContainText('今天的題目完成了');
  await page.locator('#next-button').click();
  await expect(page.locator('#daily-status')).toContainText('今天的題目已完成');
  await expect(page.locator('#daily-status')).toContainText('連續 1 天');
});

test('English UI follows the browser language and can be switched', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' }), page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('Your turn');
  await expect(page.locator('#lesson')).toHaveText('Tap the donut. Take the last one to win.');
  await expect(page.locator('#mode-chip')).toContainText('Last one wins');
  await expect(page.locator('#restart-button')).toContainText('Restart');
  await page.locator('#lang-button').click();
  await expect(page.locator('#status')).toHaveText('輪到你');
  await page.reload();
  await expect(page.locator('#restart-button')).toContainText('重新開始');
  await page.locator('#lang-button').click();
  await page.locator('#levels-button').click();
  await expect(page.locator('.play-tab[data-play="endless"]')).toContainText('Endless');
  await context.close();
});

test('background music loads after the first tap, switches for two players and can be turned off', async ({ page }) => {
  await page.goto('/');
  const waltz = page.waitForRequest(/assets\/music\/gem-waltz\.mp3$/);
  await page.locator('#rules summary').click();
  await waltz;
  await page.locator('#levels-button').click();
  await expect(page.locator('#music-button')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#music-button')).toContainText('音樂 開');
  await page.locator('#music-button').click();
  await expect(page.locator('#music-button')).toContainText('音樂 關');
  await page.reload();
  await page.locator('#levels-button').click();
  await expect(page.locator('#music-button')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.footer .credit')).toContainText('Gem Waltz');
  const missing = []; page.on('response', r => { if (!r.ok()) missing.push(r.url()); });
  for (const f of ['gem-waltz.mp3', 'gem-waltz-cleared.mp3', 'gem-waltz-gameover.mp3', 'sunny-side-up.mp3']) {
    expect((await page.request.get(`/assets/music/${f}`)).ok()).toBe(true);
  }
  expect(missing).toEqual([]);
});

test('first levels show a tap/swipe coach; wins earn stars shown on the result card and in the level list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#coach')).toBeVisible();
  await expect(page.locator('#coach')).toHaveAttribute('data-kind', 'tap');
  await expect(page.locator('#coach .coach-text')).toHaveText('點一下甜甜圈');
  await tapCell(page, 0);
  await expect(page.locator('#status')).toHaveText('你獲勝');
  await expect(page.locator('#coach')).toBeHidden();
  await expect(page.locator('#outcome-stars')).toHaveText('⭐⭐⭐');
  await expect(page.locator('#outcome-tip')).toContainText('完美');
  await page.locator('#next-button').click();
  await expect(page.locator('#coach')).toHaveAttribute('data-kind', 'swipe');
  await page.locator('#hint-button').click();
  await dragCells(page, [0, 1]);
  await expect(page.locator('#outcome-stars')).toHaveText('⭐☆☆');
  await expect(page.locator('#outcome-tip')).toContainText('不開提示');
  await page.locator('#levels-button').click();
  await expect(page.locator('#level-list button').nth(0).locator('.tile-stars')).toHaveText('⭐⭐⭐');
  await expect(page.locator('#level-list button').nth(1).locator('.tile-stars')).toHaveText('⭐☆☆');
  await expect(page.locator('#remind-button')).toBeHidden(); // reminders are Android-only
});

test('a solved daily puzzle can be shared as text with stars, tries, streak and link', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('dynamic-nim:v1')) localStorage.setItem('dynamic-nim:v1', JSON.stringify({ highestUnlocked: 1, currentLevel: 1, completed: [], settings: { effects: false, sound: false } }));
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.__copied = text; } }, configurable: true });
  });
  await page.goto('/');
  await openPlay(page, 'daily');
  await page.locator('#daily-button').click();
  await page.locator('#restart-button').click(); // a second try
  await solve(page);
  await expect(page.locator('#share-button')).toBeVisible();
  await page.locator('#share-button').click();
  await expect(page.locator('#toast')).toContainText('已複製');
  const text = await page.evaluate(() => window.__copied);
  expect(text).toContain('Sweetie Nim 每日一題');
  expect(text).toContain('第 2 次挑戰解開');
  expect(text).toContain('連續 1 天');
  expect(text).toContain('⭐');
  expect(text).toContain('https://brycekuo-proj.github.io/dynamic-nim/');
  await page.locator('#next-button').click();
  await expect(page.locator('#daily-share')).toBeVisible();
});

test('the start screen shows on launch and Start reveals the game', async ({ page }) => {
  await page.goto('/?title');
  await expect(page.locator('#title-screen')).toBeVisible();
  await expect(page.locator('#start-button')).toHaveText('開始遊戲');
  const box = await page.locator('.title-frame').boundingBox(), vp = page.viewportSize();
  expect(box.height).toBeLessThanOrEqual(vp.height + 1); // the art is never cut off top or bottom
  await page.locator('#start-button').click({ force: true }); // it gently pulses
  await expect(page.locator('#title-screen')).toHaveCount(0);
  await expect(page.locator('#status')).toHaveText('輪到你');
  // A shared book-puzzle link skips straight to the puzzle.
  await page.goto('/?title&p=x');
  await expect(page.locator('#title-screen')).toBeVisible(); // malformed link: normal launch
  await page.goto('/?title&p=12-s-ooo');
  await expect(page.locator('#title-screen')).toHaveCount(0);
  await expect(page.locator('#board')).toBeVisible();
});
