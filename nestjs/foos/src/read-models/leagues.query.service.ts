import { Inject, Injectable } from '@nestjs/common';
import type { PongoClient } from '@event-driven-io/pongo';
import { PONGO } from './pongo';
import type { LeagueDoc } from './read-model.types';

export interface LeagueView {
  id?: string;
  name?: string;
  slug?: string;
  owner?: string;
  admins?: string[];
  rating?: string;
  seasons?: { id: string; name: string }[];
  currentSeason?: string;
}

const toView = (doc: LeagueDoc): LeagueView => ({
  id: doc._id,
  name: doc.name,
  slug: doc.slug,
  owner: doc.owner,
  admins: doc.admins,
  rating: doc.rating,
  seasons: doc.seasons,
  currentSeason: doc.currentSeason,
});

/** Query side for the Leagues read-model — ports `leagues.resolvers.js`. */
@Injectable()
export class LeaguesQueryService {
  constructor(@Inject(PONGO) private readonly pongo: PongoClient) {}

  private get leagues() {
    return this.pongo.db().collection<LeagueDoc>('leagues');
  }

  async all(): Promise<LeagueView[]> {
    const docs = await this.leagues.find({});
    return docs
      .map(toView)
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }

  async getById(id: string): Promise<LeagueView | null> {
    const doc = await this.leagues.findOne({ _id: id });
    return doc ? toView(doc) : null;
  }

  async getBySlug(slug: string): Promise<LeagueView | null> {
    const doc = await this.leagues.findOne({ slug });
    return doc ? toView(doc) : null;
  }
}
