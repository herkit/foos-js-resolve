import type { Event } from '@event-driven-io/emmett';

/** Match stream events — ported from `common/event-types.js`. */
export type SingleMatchPlayed = Event<
  'SINGLEMATCH_PLAYED',
  { winner: string; loser: string; season: string }
>;

export type DoubleMatchPlayed = Event<
  'DOUBLEMATCH_PLAYED',
  {
    winner1: string;
    winner2: string;
    loser1: string;
    loser2: string;
    season: string;
  }
>;

export type MatchEvent = SingleMatchPlayed | DoubleMatchPlayed;
