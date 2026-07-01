import { pongoProjection } from '@event-driven-io/emmett-postgresql';
import type { PlayerEvent } from '../player/player.events';
import type { MatchEvent } from '../match/match.events';
import type { PongoDb } from '@event-driven-io/pongo';
import type { PlayerMatchesDoc } from './read-model.types';
import { upsertById } from './pongo-util';

type HandledEvent = PlayerEvent | MatchEvent;

/**
 * PlayerMatches view-model — ported from
 * `common/view-models/player-matches.projection.js`.
 *
 * Genuinely multi-stream: a match event (on the Match stream) updates the match
 * lists of several players. Implemented as a free-hand projection into the
 * `player_matches` collection, keyed by player id.
 */
const appendMatch = async (
  db: PongoDb,
  playerId: string,
  matchId: string,
): Promise<void> => {
  const coll = db.collection<PlayerMatchesDoc>('player_matches');
  const doc = await coll.findOne({ _id: playerId });
  const matches = [...(doc?.matches ?? []), matchId];
  await upsertById(coll, playerId, { matches });
};

export const playerMatchesProjection = pongoProjection<HandledEvent>({
  name: 'player_matches',
  canHandle: [
    'PLAYER_CREATED',
    'PLAYER_DELETED',
    'SINGLEMATCH_PLAYED',
    'DOUBLEMATCH_PLAYED',
  ],
  handle: async (events, { pongo }) => {
    const db = pongo.db();
    const coll = db.collection<PlayerMatchesDoc>('player_matches');

    for (const event of events) {
      switch (event.type) {
        case 'PLAYER_CREATED': {
          const id = event.metadata.streamName.slice('player-'.length);
          await upsertById(coll, id, { matches: [] });
          break;
        }
        case 'PLAYER_DELETED':
          await coll.deleteOne({
            _id: event.metadata.streamName.slice('player-'.length),
          });
          break;
        case 'SINGLEMATCH_PLAYED': {
          const matchId = event.metadata.streamName.slice('match-'.length);
          await appendMatch(db, event.data.winner, matchId);
          await appendMatch(db, event.data.loser, matchId);
          break;
        }
        case 'DOUBLEMATCH_PLAYED': {
          const matchId = event.metadata.streamName.slice('match-'.length);
          const { winner1, winner2, loser1, loser2 } = event.data;
          for (const p of [winner1, winner2, loser1, loser2]) {
            await appendMatch(db, p, matchId);
          }
          break;
        }
      }
    }
  },
});
