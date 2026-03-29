import { expect, test } from '@playwright/test';
import { getOverflow, openLanding, seedRandom, startLocalGame } from './helpers';

test.describe('UI and responsive coverage', () => {
  test('loads the landing page logo and primary actions', async ({ page }) => {
    await openLanding(page);

    const logo = page.getByAltText(/Dudo Dice Logo/i);
    await expect(logo).toBeVisible();
    await expect(page.getByRole('button', { name: /Play vs Computer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Play Online/i })).toBeVisible();

    const resources = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
    );

    expect(resources.some((url) => /\.css(\?|$)/i.test(url))).toBeTruthy();
    expect(resources.some((url) => /\.js(\?|$)/i.test(url))).toBeTruthy();
  });

  test('keeps the landing page within the viewport', async ({ page }) => {
    await openLanding(page);
    const overflow = await getOverflow(page);
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  });

  test('renders the game board without horizontal overflow and with visible dice', async ({ page }) => {
    await seedRandom(page, [0.5, 0.2, 0.9, 0.1, 0.1, 0.1]);
    await startLocalGame(page, { playerCount: 2, startingDice: 1 });

    const overflow = await getOverflow(page);
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);

    const diceCount = await page.locator('div.bg-white.rounded').count();
    expect(diceCount).toBeGreaterThan(0);

    await expect(page.getByText(/x2|x10|x1/i).first()).toBeVisible();
  });

  test('keeps action buttons usable on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This check is only meaningful for the mobile project.');

    await seedRandom(page, [0.5, 0.2, 0.9, 0.1, 0.1, 0.1]);
    await startLocalGame(page, { playerCount: 2, startingDice: 1 });

    const bidButton = page.getByRole('button', { name: /^Bid$/i });
    const backButton = page.getByRole('button', { name: /Back/i }).first();

    const bidBox = await bidButton.boundingBox();
    const backBox = await backButton.boundingBox();

    expect(bidBox?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(backBox?.height ?? 0).toBeGreaterThanOrEqual(28);
  });
});
