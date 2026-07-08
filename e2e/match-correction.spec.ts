import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';

// Unique per run so the suite is repeatable against a shared dev database.
const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const uniqueEmail = () => `e2e${stamp()}@foos.com`;

async function registerViaUi(page: Page): Promise<void> {
  await page.goto('/register');
  await page.fill('input[name="username"]', uniqueEmail());
  await page.fill('input[name="password"]', 'secret');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/leagues');
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
}

async function createLeagueViaUi(page: Page, name: string): Promise<void> {
  await page.goto('/leagues/create');
  await page.fill('input[type="text"]', name);
  await page.getByRole('button', { name: 'Create League' }).click();
  await page.waitForURL('**/leagues');
}

const ranksOf = async (page: Page, season: string) =>
  (await page.request.get(`/api/seasons/${season}/ranks`)).json();

/**
 * Drives the correction UI end to end. The logged-in user is made a participant
 * of the match so the row's Edit control is offered (mirrors the server's
 * superuser-or-involved authorization), then the match is corrected (swap
 * sides) and finally voided — asserting the read-side each time.
 */
test('a participant can correct and then void a match from the scoreboard', async ({
  page,
}) => {
  await registerViaUi(page);

  // The logged-in principal (a player) — used as a match participant so Edit shows.
  const me: { id: string } = await (await page.request.get('/api/auth/me')).json();
  const opponent = randomUUID();
  await page.request.post(`/api/players/${opponent}`, {
    data: { name: `Opponent ${stamp()}`, email: uniqueEmail() },
  });

  const leagueName = `E2E Correct ${stamp()}`;
  await createLeagueViaUi(page, leagueName);
  await page.getByRole('link', { name: leagueName }).click();
  await expect(page.getByText('Scoreboard')).toBeVisible({ timeout: 20_000 });

  const leagues: Array<{ name: string; currentSeason?: string }> = await (
    await page.request.get('/api/leagues')
  ).json();
  const season = leagues.find((l) => l.name === leagueName)?.currentSeason;
  expect(season).toBeTruthy();

  await page.waitForTimeout(1500); // let the SeasonRanks socket subscribe

  const matchid = randomUUID();
  const res = await page.request.post(`/api/seasons/${season}/matches`, {
    data: { matchid, winners: [me.id], losers: [opponent] },
  });
  expect(res.ok()).toBeTruthy();

  // The live push renders the match row; because the user is a participant the
  // Edit control appears.
  const edit = page.getByRole('button', { name: 'Edit' }).first();
  await expect(edit).toBeVisible({ timeout: 20_000 });

  // --- Correct: swap winners/losers ---
  await edit.click();
  await expect(page.getByText('Correct match')).toBeVisible();
  await page.getByRole('button', { name: 'Swap winners / losers' }).click();
  await page.getByRole('button', { name: 'Save correction' }).click();
  await expect(page.getByText('Correct match')).toBeHidden();

  await expect
    .poll(async () => (await ranksOf(page, season!)).recentMatches[0])
    .toMatchObject({ matchid, winners: [opponent], losers: [me.id] });

  // --- Void ---
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await expect(page.getByText('Correct match')).toBeVisible();
  await page.getByRole('button', { name: 'Void match' }).click();
  await page.getByRole('button', { name: 'Void it?' }).click();
  await expect(page.getByText('Correct match')).toBeHidden();

  await expect
    .poll(async () => (await ranksOf(page, season!)).recentMatches.length)
    .toBe(0);
});
