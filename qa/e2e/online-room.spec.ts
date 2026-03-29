import { expect, test } from '@playwright/test';
import { createPrivateRoom, goToOnlineLobby, joinRoom } from './helpers';

test.describe('Online multiplayer room flow', () => {
  test('supports create, join, and start game across two players', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      await goToOnlineLobby(hostPage, `Host-${Date.now()}`);
      const roomCode = await createPrivateRoom(hostPage);

      await goToOnlineLobby(guestPage, `Guest-${Date.now()}`);
      await joinRoom(guestPage, roomCode);

      await expect(hostPage.getByText(/\(you\)/i)).toBeVisible();
      await expect(hostPage.getByText(/Players \(2\//i)).toBeVisible();
      await expect(guestPage.getByText(/Players \(2\//i)).toBeVisible();

      await hostPage.getByRole('button', { name: /^Start Game$/i }).click();
      await expect(hostPage.getByRole('button', { name: /Back/i })).toBeVisible();
      await expect(guestPage.getByRole('button', { name: /Back/i })).toBeVisible();
      await expect
        .poll(async () => {
          return (
            (await hostPage.getByRole('button', { name: /^Bid$/i }).count()) +
            (await hostPage.getByText(/Your Turn!|is thinking/i).count())
          );
        })
        .toBeGreaterThan(0);
      await expect
        .poll(async () => {
          return (
            (await guestPage.getByRole('button', { name: /^Bid$/i }).count()) +
            (await guestPage.getByText(/Your Turn!|is thinking/i).count())
          );
        })
        .toBeGreaterThan(0);
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});
