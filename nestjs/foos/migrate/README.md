# Phase 4 — reSolve → Emmett event migration

Migrates the production reSolve MySQL event store into a fresh Emmett
(PostgreSQL) event store, replaying inline read-model projections to rebuild all
read models. The saga is **not** started, so historical events are not re-acted
upon.

## Prerequisites

- The prod dump under `../../mysql/Dump20260701/` (gitignored — prod data).
- The app's Postgres running (see `../docker-compose.yml`).

## Steps

1. **Load the dump into a throwaway MySQL** (strips the multi-line `GTID_PURGED`
   statement and CRLline endings that break a fresh-server load):

   ```bash
   docker run -d --name foos-mysql-mig -e MYSQL_ROOT_PASSWORD=root -p 3307:3306 mysql:8
   # wait for readiness, then:
   tr -d '\r' < ../../mysql/Dump20260701/foos-events_events.sql \
     | sed '/SET @@GLOBAL.GTID_PURGED=/,/;$/d' \
     | docker exec -i foos-mysql-mig mysql -uroot -proot
   ```

2. **Create a fresh target database** and run the exporter:

   ```bash
   docker exec foos-postgres-1 psql -U foos -c "CREATE DATABASE foos_migrated;"

   MIG_MYSQL_URL="mysql://root:root@localhost:3307/foos-events" \
   EVENTSTORE_CONNECTION_STRING="postgresql://foos:foos@localhost:5432/foos_migrated" \
   TS_NODE_TRANSPILE_ONLY=1 \
   node -r ts-node/register migrate/import-resolve-events.ts
   ```

## Notes

- Events are replayed in **chronological order** (`timestamp`), not by
  `(threadId, threadCounter)` — those are reSolve partition coordinates and do
  NOT reflect cross-aggregate order. Wrong ordering causes `PLAYER_DELETED` to
  arrive before its `PLAYER_CREATED` (no-op delete) and mis-assigns the
  "first user is superuser" flag.
- `PLAYER_DELETED` payloads are JSON `null` → mapped to `{}`.
- `SEASON_MATCH_REGISTERED` carries the row `timestamp` into `data.timestamp`
  (SeasonRanks/PlayerMatches need it).
- The `PLAYER_EMAIL_CHANGED` type-collision fix-up is a **no-op** for this dump:
  no email-change events were ever emitted (and no single/double match or
  won/lost-match events exist — prod recorded matches only via
  `SEASON_MATCH_REGISTERED`).

## Verified parity (this dump)

| Metric     | Original read-model | Migrated |
|------------|---------------------|----------|
| events     | 2939                | 2939     |
| players    | 51                  | 51       |
| leagues    | 5                   | 5        |
| superuser  | 1 (Henrik Grotle)   | 1        |
