/**
 * Read-model (Pongo) document shapes. Pongo keys documents by `_id`.
 *
 * These are `type` aliases (not `interface`) so they satisfy Pongo's
 * `PongoDocument` index-signature constraint.
 */

export type PlayerDoc = {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  password?: string | null;
  currentRank?: number;
  isSuperuser?: boolean;
  defaultLeague?: { id?: string; slug?: string };
};

export type LeagueDoc = {
  _id?: string;
  name?: string;
  slug?: string;
  owner?: string;
  admins?: string[];
  rating?: string;
  seasons?: { id: string; name: string }[];
  currentSeason?: string;
  seasonCount?: number;
};

export type PlayerMatchesDoc = {
  _id?: string;
  matches?: string[];
};
