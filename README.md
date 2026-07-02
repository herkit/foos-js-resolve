# Foos

Foosball league app — a NestJS backend (event sourcing with
[Emmett](https://event-driven-io.github.io/emmett/) on PostgreSQL) and a React
SPA, **served as a single runtime**: `node dist/main.js` serves the API under
`/api` and the built SPA at `/`.

Migrated from an abandoned reSolve app — see [MIGRATION.md](./MIGRATION.md).

## Layout

```
src/          NestJS backend (aggregates, read-models, sagas, auth, gateway)
web/          React SPA sources (Vite; client/, index.html, static/)
migrate/      one-time reSolve MySQL -> Emmett event exporter
e2e/          Playwright end-to-end tests
client-dist/  built SPA (gitignored; produced by `pnpm build:web`)
```

## Prerequisites

- Node 20+, [pnpm](https://pnpm.io), Docker (for PostgreSQL)

## Setup

```bash
pnpm install
docker compose up -d          # PostgreSQL on :5432 (foos/foos)
```

## Develop

Two processes with hot reload (SPA proxies /api + /socket.io to the API):

```bash
pnpm start:dev                # NestJS API on :3000 (watch)
pnpm dev:web                  # Vite dev server on :5173  -> open this
```

## Build & run (single runtime)

```bash
pnpm build                    # build:web (SPA) then build:server (Nest)
pnpm start                    # node dist/main.js -> http://localhost:3000
```

Config via env (see `.env.example`): `EVENTSTORE_CONNECTION_STRING`, `PORT`,
`JWT_SECRET`, and `SLACK_CLIENT_ID`/`SLACK_CLIENT_SECRET` (optional).

## Test

```bash
pnpm test                     # backend unit tests (jest)
pnpm e2e                      # Playwright critical flows (writable DB)
pnpm e2e:migrated             # read-only checks vs migrated data (foos_migrated)
```

## Data migration

See [migrate/README.md](./migrate/README.md) to import a reSolve MySQL event
dump into a fresh Emmett store.
