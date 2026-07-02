/**
 * Maps a reSolve event `type` to the aggregate that owns it. The reSolve events
 * table has no `aggregateName` column — the type determines the aggregate, and
 * all events for a given `aggregateId` belong to the same aggregate. The Emmett
 * stream id follows the app convention `${aggregate}-${aggregateId}`.
 */
const TYPE_TO_AGGREGATE: Record<string, string> = {
  PLAYER_CREATED: 'player',
  PLAYER_DELETED: 'player',
  PLAYER_SET_DEFAULT_LEAGUE: 'player',
  PLAYER_WON_MATCH: 'player',
  PLAYER_LOST_MATCH: 'player',
  PLAYER_EMAIL_CHANGED: 'player',
  SINGLEMATCH_PLAYED: 'match',
  DOUBLEMATCH_PLAYED: 'match',
  SEASON_CREATED: 'season',
  SEASON_MATCH_REGISTERED: 'season',
  LEAGUE_CREATED: 'league',
  LEAGUE_PLAYER_ADDED: 'league',
  SEASON_STARTED: 'league',
};

export const aggregateFor = (type: string): string => {
  const aggregate = TYPE_TO_AGGREGATE[type];
  if (!aggregate) throw new Error(`Unknown event type: ${type}`);
  return aggregate;
};

export const streamIdFor = (type: string, aggregateId: string): string =>
  `${aggregateFor(type)}-${aggregateId}`;
