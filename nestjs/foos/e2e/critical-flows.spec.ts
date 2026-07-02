import { test, expect } from '@playwright/test';

// Unique per run so the suite is repeatable against a shared dev database.
const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

test('app loads and shows the Leagues navigation', async ({ page }) => {
  await page.goto('/leagues');
  await expect(page.getByRole('link', { name: 'Leagues' })).toBeVisible();
});

test('register, log in, create a league, and see its season scoreboard', async ({
  page,
}) => {
  // Note: the ported email validation only accepts 2-3 char TLDs (faithful to
  // reSolve), so use .com rather than .test.
  const email = `e2e${stamp()}@foos.com`;
  const leagueName = `E2E League ${stamp()}`;

  // Register (AuthForm posts JSON to /api/auth/register, then navigates).
  await page.goto('/register');
  await page.fill('input[name="username"]', email);
  await page.fill('input[name="password"]', 'secret');
  await page.click('button[type="submit"]');

  // Landed on /leagues and recognised as logged in (httpOnly cookie -> /auth/me).
  await page.waitForURL('**/leagues');
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

  // Create a league.
  await page.goto('/leagues/create');
  await page.fill('input[type="text"]', leagueName);
  await page.getByRole('button', { name: 'Create League' }).click();

  // Back on the league list; open the new league.
  await page.waitForURL('**/leagues');
  const leagueLink = page.getByRole('link', { name: leagueName });
  await expect(leagueLink).toBeVisible();
  await leagueLink.click();

  // The LeagueCreation saga creates + starts the season asynchronously; the
  // view polls, so "Loading" resolves into the season Scoreboard within a few
  // seconds. (This exercises auth, the saga, and the view-model polling fix.)
  await expect(page.getByText('Scoreboard')).toBeVisible({ timeout: 20_000 });
});
