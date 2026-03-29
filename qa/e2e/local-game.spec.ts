import { expect, test } from '@playwright/test';
import { seedRandom, startLocalGame } from './helpers';

test.describe('Local gameplay journey', () => {
  test('lets a human start a local game and answer the current bid with a valid raise', async ({ page }) => {
    await seedRandom(page, [0.5, 0.2, 0.9, 0.1, 0.1, 0.1]);
    await startLocalGame(page, { playerCount: 2, startingDice: 1 });

    const bidButton = page.getByRole('button', { name: /^Bid$/i });
    await expect(bidButton).toBeVisible();
    await bidButton.click();

    await expect(page.getByText(/is thinking/i)).toBeVisible();
  });

  test('allows a Calza call to resolve the round', async ({ page }) => {
    await seedRandom(page, [0.5, 0.2, 0.1, 0.1, 0.1, 0.1]);
    await startLocalGame(page, { playerCount: 2, startingDice: 1, calzaEnabled: true });

    await expect(page.getByRole('button', { name: /^Calza$/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /^Calza$/i }).click();

    await expect
      .poll(async () => {
        return (
          (await page.getByRole('heading', { name: /Round Result|Game Over/i }).count()) +
          (await page.getByText(/gain a die|lose a die|wins/i).count())
        );
      })
      .toBeGreaterThan(0);
  });

  test('allows a Dudo call to resolve the round', async ({ page }) => {
    await seedRandom(page, [0.9, 0.2, 0.1, 0.1, 0.1, 0.1]);
    await startLocalGame(page, { playerCount: 2, startingDice: 1 });

    await expect(page.getByRole('button', { name: /^Dudo$/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /^Dudo$/i }).click();

    await expect
      .poll(async () => {
        return (
          (await page.getByRole('heading', { name: /Round Result|Game Over/i }).count()) +
          (await page.getByText(/gain a die|lose a die|wins/i).count())
        );
      })
      .toBeGreaterThan(0);
  });
});
