import { Inject, Injectable } from '@nestjs/common';
import type { PongoClient } from '@event-driven-io/pongo';
import { PONGO } from './pongo';
import type { PlayerDoc, PlayerMatchesDoc } from './read-model.types';

/** Public player shape (id, no password). */
export interface PlayerView {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  currentRank?: number;
  isSuperuser?: boolean;
  defaultLeague?: { id?: string; slug?: string };
}

const toView = (doc: PlayerDoc): PlayerView => ({
  id: doc._id,
  name: doc.name,
  email: doc.email,
  avatar: doc.avatar,
  currentRank: doc.currentRank,
  isSuperuser: doc.isSuperuser,
  defaultLeague: doc.defaultLeague,
});

const byName = (a: { name?: string }, b: { name?: string }): number =>
  (a.name ?? '').localeCompare(b.name ?? '');

/**
 * Query side for the Players read-model — ports the resolvers from
 * `common/read-models/players.resolvers.js`. `login` is deferred to Phase 3
 * (auth); `byEmailRaw` exists to support it and the email-change check.
 */
@Injectable()
export class PlayersQueryService {
  constructor(@Inject(PONGO) private readonly pongo: PongoClient) {}

  private get players() {
    return this.pongo.db().collection<PlayerDoc>('players');
  }

  async all(): Promise<PlayerView[]> {
    const docs = await this.players.find({});
    return docs.map(toView).sort(byName);
  }

  async allNames(): Promise<{ id?: string; name?: string }[]> {
    const docs = await this.players.find({});
    return docs.map((d) => ({ id: d._id, name: d.name })).sort(byName);
  }

  async getById(id: string): Promise<PlayerView | null> {
    const doc = await this.players.findOne({ _id: id });
    return doc ? toView(doc) : null;
  }

  async byEmail(email: string): Promise<PlayerView | null> {
    const doc = await this.players.findOne({ email });
    return doc ? toView(doc) : null;
  }

  /** Internal: full document incl. password hash (for auth/email-change checks). */
  byEmailRaw(email: string): Promise<PlayerDoc | null> {
    return this.players.findOne({ email });
  }

  autocomplete(): Promise<PlayerView[]> {
    // Original returned all players unfiltered; preserved.
    return this.all();
  }

  async matches(id: string): Promise<string[]> {
    const doc = await this.pongo
      .db()
      .collection<PlayerMatchesDoc>('player_matches')
      .findOne({ _id: id });
    return doc?.matches ?? [];
  }
}
