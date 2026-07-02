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

   Migrating into a **managed Postgres** (DigitalOcean, etc.) instead of local
   Docker? See [SSL / managed Postgres](#ssl--managed-postgres) below — a plain
   `?sslmode=require` URL fails with `SELF_SIGNED_CERT_IN_CHAIN`.

   After importing, the script seeds the `league-creation-saga` checkpoint to
   the log head so the app doesn't replay history (and re-start orphan seasons)
   on first boot.

## Reruns / cleaning the target

The import only **appends** — it never cleans the target. Running it twice
against the same store would duplicate every event, so the script refuses to run
when the target already has events:

```
Target already contains events. Rerunning would duplicate them. ...
```

To rerun, either point `EVENTSTORE_CONNECTION_STRING` at a fresh database, or set
`MIG_TRUNCATE=1` to wipe the target first (Emmett tables + the
`leagues`/`players`/`player_matches` read-models, and the global-position
sequence):

```bash
MIG_TRUNCATE=1 \
MIG_MYSQL_URL="mysql://root:root@localhost:3307/foos-events" \
EVENTSTORE_CONNECTION_STRING="postgresql://foos:foos@localhost:5432/foos_migrated" \
TS_NODE_TRANSPILE_ONLY=1 \
node -r ts-node/register migrate/import-resolve-events.ts
```

## SSL / managed Postgres

The target `EVENTSTORE_CONNECTION_STRING` is handed straight to `pg`. Recent
`pg-connection-string` (>=2.13, bundled with `pg` 8.x here) treats
`sslmode=require` — and `prefer`/`verify-ca` — as an alias for `verify-full`,
i.e. full CA-chain verification. Managed providers present a **self-signed CA**,
so a stock `...?sslmode=require` URL fails with:

```
Migration failed: Error: self-signed certificate in certificate chain
  code: 'SELF_SIGNED_CERT_IN_CHAIN'
```

Pick one on the **target** URL:

- **Quickest (one-off migration):** `?sslmode=no-verify` — still TLS-encrypted,
  just skips verifying the CA chain (`pg` sets `ssl.rejectUnauthorized=false`).

  ```bash
  EVENTSTORE_CONNECTION_STRING="postgresql://USER:PASS@db-xxx.ondigitalocean.com:25060/defaultdb?sslmode=no-verify"
  ```

- **Secure (verifies the CA):** download the `ca-certificate.crt` from the
  database's connection details and reference it:

  ```bash
  EVENTSTORE_CONNECTION_STRING="postgresql://USER:PASS@db-xxx.ondigitalocean.com:25060/defaultdb?sslmode=verify-full&sslrootcert=/abs/path/to/ca-certificate.crt"
  ```

Avoid `NODE_TLS_REJECT_UNAUTHORIZED=0`: it disables TLS verification for the
whole process (including the MySQL source connection), not just this URL.

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
