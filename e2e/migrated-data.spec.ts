import { test, expect } from '@playwright/test';

/**
 * Read-only check against the migrated production data (foos_migrated). Confirms
 * a real migrated league renders its historical scoreboard in the browser —
 * i.e. the SeasonRanks fold + PlayerName lookups work over real event history.
 *
 * Run with the migrated config: `pnpm e2e:migrated` (requires the Phase 4
 * migration to have populated foos_migrated).
 */
test('a migrated league renders its historical scoreboard', async ({
  page,
  request,
}) => {
  // Discover a league whose *current* season has ranks (real match data).
  const leagues: Array<{ slug: string; name: string; currentSeason?: string }> =
    await (await request.get('/api/leagues')).json();

  let target: { slug: string; topName?: string } | null = null;
  for (const lg of leagues) {
    if (!lg.currentSeason) continue;
    const body = await (
      await request.get(`/api/seasons/${lg.currentSeason}/ranks`)
    ).json();
    const ranks: Array<{ id: string }> = body.ranks ?? [];
    if (ranks.length > 0) {
      const topPlayer = await (
        await request.get(`/api/players/${ranks[0].id}`)
      ).json();
      target = { slug: lg.slug, topName: topPlayer?.name };
      break;
    }
  }

  test.skip(
    !target,
    'No migrated league has ranks in its current season — run the Phase 4 migration first',
  );

  await page.goto(`/leagues/${target!.slug}`);
  await expect(page.getByText('Scoreboard')).toBeVisible({ timeout: 20_000 });

  // The top-ranked player's name should render in the scoreboard, proving the
  // ranks were folded from the migrated events and joined to the players
  // read-model.
  if (target!.topName) {
    await expect(page.getByText(target!.topName).first()).toBeVisible({
      timeout: 20_000,
    });
  }
});
