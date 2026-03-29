import { expect, Page } from '@playwright/test';

type ProfileStats = {
  gamesPlayed: number;
  gamesWon: number;
  dudoCalls: number;
  successfulDudoCalls: number;
  timesCalledAgainst: number;
  successfulCallsAgainst: number;
};

function buildProfile(name: string): { name: string; photo: null; country: null; stats: ProfileStats } {
  return {
    name,
    photo: null,
    country: null,
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      dudoCalls: 0,
      successfulDudoCalls: 0,
      timesCalledAgainst: 0,
      successfulCallsAgainst: 0,
    },
  };
}

export async function seedRandom(page: Page, values: number[]): Promise<void> {
  await page.addInitScript((sequence: number[]) => {
    let index = 0;
    Math.random = () => sequence[Math.min(index++, sequence.length - 1)] ?? 0;
  }, values);
}

export async function seedProfile(page: Page, name: string): Promise<void> {
  await page.addInitScript((profile) => {
    localStorage.setItem('dudo-player-profile', JSON.stringify(profile));
  }, buildProfile(name));
}

export async function openLanding(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Dudo Dice/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Play vs Computer/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Play Online/i })).toBeVisible();
}

export async function setStepperValue(page: Page, label: string, target: number): Promise<void> {
  const controls = page.locator(`xpath=//label[normalize-space()="${label}"]/following-sibling::*[1]`).first();
  await expect(controls).toBeVisible();

  const readValue = async () =>
    controls.evaluate((node, labelText) => {
      const valueNode = [...node.querySelectorAll('*')]
        .find((element) => /^\d+$/.test(element.textContent?.trim() ?? ''));
      if (!valueNode) {
        throw new Error(`Could not find numeric value for "${labelText}"`);
      }
      return Number(valueNode.textContent);
    }, label);

  const buttons = controls.getByRole('button');
  let current = await readValue();
  let guard = 0;

  while (current !== target && guard < 20) {
    await buttons.nth(current < target ? 1 : 0).click();
    await page.waitForTimeout(75);
    current = await readValue();
    guard += 1;
  }

  if (current !== target) {
    throw new Error(`Failed to set "${label}" to ${target}; current=${current}`);
  }
}

export async function setOptionByLabel(page: Page, label: string, value: string): Promise<void> {
  await page.evaluate(({ labelText, optionText }) => {
    const labels = [...document.querySelectorAll('label')];
    const labelEl = labels.find((node) => node.textContent?.trim() === labelText);
    if (!labelEl) throw new Error(`Could not find option label "${labelText}"`);

    let section: HTMLElement | null = labelEl.parentElement;
    while (section && !section.querySelector('button')) {
      section = section.parentElement;
    }
    if (!section) throw new Error(`Could not find options container for "${labelText}"`);

    const button = [...section.querySelectorAll('button')]
      .find((node) => node.textContent?.trim().toLowerCase() === optionText.toLowerCase());

    if (!button) throw new Error(`Could not find option "${optionText}" for "${labelText}"`);
    (button as HTMLButtonElement).click();
  }, { labelText: label, optionText: value });

  await page.waitForTimeout(150);
}

export async function goToLocalSetup(page: Page): Promise<void> {
  await openLanding(page);
  await page.getByRole('button', { name: /Play vs Computer/i }).click();
  await expect(page.getByRole('heading', { name: /Dudo Dice/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Start Game$/i })).toBeVisible();
}

export async function startLocalGame(page: Page, options?: { playerCount?: number; startingDice?: number; calzaEnabled?: boolean }): Promise<void> {
  await goToLocalSetup(page);

  if (options?.playerCount !== undefined) {
    await setStepperValue(page, 'Players', options.playerCount);
  }

  if (options?.startingDice !== undefined) {
    await setStepperValue(page, 'Starting Dice', options.startingDice);
  }

  if (options?.calzaEnabled !== undefined) {
    await page.getByTitle('Advanced Settings').click();
    await expect(page.getByRole('heading', { name: /Advanced Rules/i })).toBeVisible();
    await setOptionByLabel(page, 'Calza', options.calzaEnabled ? 'On' : 'Off');
    await page.getByRole('button', { name: /^Done$/i }).click();
  }

  await page.getByRole('button', { name: /^Start Game$/i }).click();
  await expect(page.getByRole('button', { name: /Back/i })).toBeVisible();
}

export async function goToOnlineLobby(page: Page, profileName: string): Promise<void> {
  await seedProfile(page, profileName);
  await openLanding(page);
  await page.getByRole('button', { name: /Play Online/i }).click();
  await expect(page.getByRole('heading', { name: /Play Online/i })).toBeVisible();
  await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 15_000 });
}

export async function createPrivateRoom(page: Page): Promise<string> {
  await setOptionByLabel(page, 'Visibility', 'Private');
  const createRoomButton = page.getByRole('button', { name: /^Create Room$/i }).last();
  await expect(createRoomButton).toBeEnabled();
  await createRoomButton.click();
  await expect(page.getByRole('heading', { name: /Waiting Room/i })).toBeVisible();
  const roomCode = await page.locator('button[title="Click to copy"]').textContent();
  if (!roomCode) {
    throw new Error('Room code was not rendered');
  }
  return roomCode.trim();
}

export async function joinRoom(page: Page, roomCode: string): Promise<void> {
  await page.getByRole('button', { name: /Join Game/i }).click();
  await page.locator('input[placeholder="ABCD"]').fill(roomCode);
  const joinRoomButton = page.getByRole('button', { name: /^Join Room$/i }).last();
  await expect(joinRoomButton).toBeEnabled();
  await joinRoomButton.click();
  await expect(page.getByRole('heading', { name: /Waiting Room/i })).toBeVisible();
}

export async function getOverflow(page: Page): Promise<{ scrollWidth: number; viewportWidth: number; scrollHeight: number; viewportHeight: number }> {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }));
}
