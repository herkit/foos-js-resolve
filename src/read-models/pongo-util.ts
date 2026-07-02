import type { PongoCollection, PongoDocument } from '@event-driven-io/pongo';

/**
 * Insert-or-update by `_id`. Pongo's `updateOne` has no `upsert` option, so we
 * do it explicitly: `$set` when the document exists, otherwise `insertOne`.
 */
export const upsertById = async <T extends PongoDocument>(
  collection: PongoCollection<T>,
  id: string,
  set: Partial<T>,
): Promise<void> => {
  const filter = { _id: id } as Parameters<PongoCollection<T>['updateOne']>[0];
  const existing = await collection.findOne(filter);
  if (existing) {
    await collection.updateOne(filter, { $set: set });
  } else {
    await collection.insertOne({ _id: id, ...set } as Parameters<
      PongoCollection<T>['insertOne']
    >[0]);
  }
};
