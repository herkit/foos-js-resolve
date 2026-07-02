import { pongoProjection } from '@event-driven-io/emmett-postgresql';
import slugify from 'slugify';
import type { LeagueEvent } from '../league/league.events';
import type { LeagueDoc } from './read-model.types';
import { upsertById } from './pongo-util';

const idFrom = (streamName: string): string =>
  streamName.slice('league-'.length);

/**
 * Leagues read-model — ported from `common/read-models/leagues.projection.js`,
 * with the (originally commented-out) `SEASON_STARTED` handler restored to fold
 * in the `LeagueData` view-model's season list.
 *
 * Free-hand projection because slug generation must query the collection for
 * uniqueness. Runs inline (same transaction as the append).
 */
export const leaguesProjection = pongoProjection<LeagueEvent>({
  name: 'leagues',
  canHandle: ['LEAGUE_CREATED', 'SEASON_STARTED'],
  handle: async (events, { pongo }) => {
    const leagues = pongo.db().collection<LeagueDoc>('leagues');

    for (const event of events) {
      const id = idFrom(event.metadata.streamName);

      if (event.type === 'LEAGUE_CREATED') {
        const { name, owner, rating } = event.data;
        const slugBase = slugify(name).toLowerCase();
        let slug = slugBase;
        let postfix = 0;
        while (await leagues.findOne({ slug })) {
          postfix += 1;
          slug = `${slugBase}-${postfix}`;
        }
        await upsertById(leagues, id, {
          name,
          slug,
          owner,
          admins: [owner],
          rating,
          seasons: [],
          seasonCount: 0,
        });
      } else if (event.type === 'SEASON_STARTED') {
        const league = await leagues.findOne({ _id: id });
        const seasonCount = (league?.seasonCount ?? 0) + 1;
        const seasons = [
          ...(league?.seasons ?? []),
          { id: event.data.seasonid, name: `Season ${seasonCount}` },
        ];
        await upsertById(leagues, id, {
          seasons,
          seasonCount,
          currentSeason: event.data.seasonid,
        });
      }
    }
  },
});
