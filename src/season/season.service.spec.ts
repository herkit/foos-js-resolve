import { getInMemoryEventStore, type EventStore } from '@event-driven-io/emmett';
import { LeagueService } from '../league/league.service';
import { SeasonService } from './season.service';

/**
 * End-to-end check of the "new season inherits its league's rating method" rule,
 * driven through a real in-memory Emmett event store shared by both services.
 */
describe('SeasonService.createSeason rating inheritance', () => {
  let store: EventStore;
  let leagues: LeagueService;
  let seasons: SeasonService;

  beforeEach(() => {
    store = getInMemoryEventStore();
    leagues = new LeagueService(store);
    seasons = new SeasonService(store, leagues);
  });

  const createLeague = (id: string, rating?: string) =>
    leagues.createLeague(id, { name: `League ${id}`, rating }, { id: 'admin' });

  it("inherits the parent league's rating when none is supplied", async () => {
    await createLeague('league-basic', 'basic');

    const ranks = await seasons.createSeason('season-1', {
      leagueid: 'league-basic',
    });

    expect(ranks.rating).toBe('basic');
  });

  it("inherits the league's default rating ('elo') when the league did not pick one", async () => {
    await createLeague('league-default');

    const ranks = await seasons.createSeason('season-2', {
      leagueid: 'league-default',
    });

    expect(ranks.rating).toBe('elo');
  });

  it('respects an explicitly supplied rating over the league default', async () => {
    await createLeague('league-basic-2', 'basic');

    const ranks = await seasons.createSeason('season-3', {
      leagueid: 'league-basic-2',
      rating: 'elo',
    });

    expect(ranks.rating).toBe('elo');
  });
});
