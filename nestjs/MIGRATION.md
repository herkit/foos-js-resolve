# reSolve → NestJS Migration Plan

This document tracks the migration of the abandoned **reSolve** (event-sourcing / CQRS)
application to a **NestJS** backend, keeping the existing React frontend.

## Decisions (locked in)

| Area | Decision |
|------|----------|
| **Persistence** | True event sourcing via **[Emmett](https://event-driven-io.github.io/emmett/)** (`@event-driven-io/emmett` + `@event-driven-io/emmett-postgresql`), backed by **PostgreSQL**. |
| **Frontend** | Keep the existing React/Redux SPA. Replace the `@resolve-js/react-hooks` / `@resolve-js/redux` client SDK with a thin client hitting new NestJS REST + WebSocket endpoints. |
| **Existing data** | Production MySQL event history **must be migrated**: export events → transform → replay into the Emmett store → rebuild read/view models. |

## Guiding principle

reSolve and Emmett share the same model — event streams + an `evolve`/reducer +
a `decide`/command function — so the **domain port is near-mechanical**. The real
work is the runtime glue reSolve provided for free: the HTTP/query API, reactive
view-models over WebSocket, sagas, auth, and the event-data migration.

## Source inventory (reSolve app)

- **Events**: `common/event-types.js` — 16 event types.
- **Aggregates (write side)**: `Player`, `Match`, `League`, `Season` — each an
  `*.commands.js` (validate → emit event) + `*.projection.js` (`Init` + event reducers).
- **Read-models (persisted, MySQL)**: `Players`, `Leagues` — `projection` + `resolvers`.
- **View-models (reactive, in-memory replay, streamed over WS)**: `PlayerMatches`,
  `PlayerName`, `PlayerSettings`, `LeagueData`, `SeasonRanks`
  (`SeasonRanks` holds the Elo / ranking logic).
- **Saga**: `LeagueCreation` (`LEAGUE_CREATED` → `createSeason`; `SEASON_CREATED` → `startSeason`).
- **Auth**: Passport local + Slack (`auth/`), JWT cookie, reSolve `module-auth`.
- **Custom API**: `api/emailChange.js`.
- **Frontend**: React 17 + Redux + reSolve SSR (`client/`), coupled via `useQuery`,
  `useCommand`, `useReduxViewModel` / `useViewModel`.
- **Config**: event store + read-models in **MySQL** (`config.prod.js`).

## Concept mapping

| reSolve concept | NestJS + Emmett target |
|---|---|
| `event-types.js` | `events/*.ts` — discriminated-union `Event<'TYPE', data>` types |
| Aggregate `*.commands.js` | Emmett `decide(command, state)` → event(s), wrapped in a Nest command handler/service |
| Aggregate `*.projection.js` | Emmett `evolve(state, event)` + `initialState()` |
| Read-model `projection` + `resolvers` | Emmett async **Pongo projection** → read collection + Nest query service/controller |
| View-model (reactive) | On-subscribe `aggregateStream` replay **or** async projection + **WebSocket gateway** push |
| Saga `LeagueCreation` | Emmett reactor / async subscription issuing follow-up commands |
| Auth (Passport local + Slack) | `@nestjs/passport` + `passport-local` + `passport-slack-oauth2`, JWT cookie guard |
| `api/emailChange.js` | Nest controller |
| Client SDK (`useQuery`/`useCommand`/`useViewModel`) | Thin hooks: `useQuery`→REST GET, `useCommand`→POST, `useViewModel`→WS |
| reSolve SSR runtime | Serve built SPA statically from Nest (`ServeStaticModule`); drop SSR |
| Event store + read store (MySQL) | PostgreSQL via Emmett; one-time event export/replay |

## Emmett API reference (verified, v0.42.x)

```ts
// Event
import type { Event } from '@event-driven-io/emmett';
type SeasonCreated = Event<'SEASON_CREATED', { leagueId: string; rating: string }>;

// State evolution (== reSolve projection)
const initialState = (): SeasonState => ({ matches: [] });
const evolve = (state: SeasonState, event: SeasonEvent): SeasonState => { /* switch on event.type */ };

// Decide (== reSolve command)
const decide = (command: SeasonCommand, state: SeasonState): SeasonEvent | SeasonEvent[] => { /* validate + return event(s) */ };

// Store + command handler
import { getPostgreSQLEventStore } from '@event-driven-io/emmett-postgresql';
import { CommandHandler } from '@event-driven-io/emmett';
const eventStore = getPostgreSQLEventStore(connectionString, { projections: projections.inline([...]) });
const handle = CommandHandler({ evolve, initialState });
await handle(eventStore, streamId, (state) => decide(command, state), { expectedStreamVersion });

// Read state for a view-model / query
const { state } = await eventStore.aggregateStream(streamId, { evolve, initialState });

// Read-model projection
import { pongoSingleStreamProjection } from '@event-driven-io/emmett-postgresql';
const playersProjection = pongoSingleStreamProjection({ canHandle: ['PLAYER_CREATED', ...], collectionName: 'players', evolve });
```

Stream naming convention: `streamId = \`${aggregateName}-${aggregateId}\``.

## Known issues to address during the port

1. **Duplicate event-type constant (bug):** in `common/event-types.js`,
   `PLAYER_EMAIL_CHANGED` is assigned `'PLAYER_SET_DEFAULT_LEAGUE'`. Both constants
   resolve to the same event-type string, so those events are indistinguishable on
   replay. Introduce a distinct `PLAYER_EMAIL_CHANGED` type and add a fix-up rule for
   any historical events during data migration.
2. **Secrets / PII store:** reSolve `module-auth` uses an encrypted secrets store
   (`secrets.db`). Emmett has no built-in equivalent. Confirm whether encrypted PII
   lives there and plan a replacement (or drop if unused).
3. **SSR:** the reactive view-models were server-rendered by reSolve. Keeping the SPA
   without SSR means client-side first paint; add REST fallbacks for initial view-model
   load. Full SSR parity is a larger, separate effort.

## Phased plan

### Phase 0 — Foundations & spike *(in progress)*
- Replace the `nestjs/foos` `@nestjs/cqrs`-only scaffold with Emmett wiring (keep Nest for DI/HTTP/WS).
- Postgres via docker-compose + a `getPostgreSQLEventStore` provider/module.
- Port one full vertical slice — **`Season`** — end to end: events → `evolve` → `decide`
  → command endpoint → `SeasonRanks` projection → reactive view-model over a WS gateway.
- This slice is the reference implementation every other aggregate follows.

### Phase 1 — Port the domain
- Events → TS discriminated unions.
- Per aggregate (`Player`, `Match`, `League`, `Season`): `projection.js`→`evolve`,
  `commands.js`→`decide` (carry all validation, incl. JWT checks in
  `deletePlayer` / `createLeague`).
- `LeagueCreation` saga → Emmett reactor.
- `SeasonRanks` Elo/ranking view-model ported verbatim into a projection.

### Phase 2 — Read side & API surface
- Read-models (`Players`, `Leagues`) as async projections + query resolvers behind REST controllers.
- View-models as WS subscriptions (+ REST fallback for initial load).
- Command controller: `POST /commands/:aggregate/:id/:type`.
- Port `emailChange` handler.

### Phase 3 — Auth
- `@nestjs/passport` local + Slack strategies, JWT cookie guard, register/login callbacks
  equivalent to `auth/`.

### Phase 4 — Data migration
- Inspect the real reSolve MySQL event table schema; write an exporter → transform to
  Emmett stream format (`streamId`, `type`, `data=payload`, `metadata.timestamp`, version)
  → load preserving order/timestamps → apply the `PLAYER_EMAIL_CHANGED` fix-up → replay
  projections to rebuild all read/view models. Validate counts vs. legacy read tables.

### Phase 5 — Frontend cutover
- Swap `@resolve-js/react-hooks` / `@resolve-js/redux` for thin hooks against the new API;
  wire WS view-models; serve the built SPA from Nest. Drop reSolve SSR.

### Phase 6 — Parity test & cutover
- Golden-master: replay a copy of prod events through both systems and diff read/view-model
  output. E2E on critical flows (create player, register match, live scoreboard).

## Progress log

- **Phase 0 — COMPLETE.** Emmett API verified against docs (v0.42.3). The `Season`
  vertical slice is implemented and verified end-to-end against a real Postgres:
  - `EventStoreModule` provides the Emmett PostgreSQL store (`emt_*` schema auto-provisions).
  - `Season` domain ported: `season.events.ts`, `season.aggregate.ts`
    (`evolve` + `decide`), `season-ranks.view.ts` (Elo/basic ranking view-model).
  - `SeasonService` (Emmett `CommandHandler` + `aggregateStream`), `SeasonController`
    (REST), `SeasonGateway` (live `SeasonRanks` over socket.io).
  - `EmmettExceptionFilter` maps domain errors (`IllegalStateError`, etc.) to 4xx.
  - Local infra: `nestjs/foos/docker-compose.yml` (Postgres 16) + `.env.example`.
  - **Verified:** create season → register matches → fold view-model (basic & elo);
    duplicate-match and same-player guards return 4xx with the domain message;
    WebSocket subscribe delivers an initial snapshot **and** a live push after a match
    (`test/ws-smoke.mjs`).

  Reference conventions established for the rest of the domain:
  - stream id = `` `${aggregate}-${id}` ``; event `type` = the reSolve event-type string;
    event payloads keep original field names; timestamps carried in `data.timestamp`.
  - reactive view-models use the **rebuild-on-subscribe** pattern (fold the stream via
    `aggregateStream`) + push on write — no separate stored projection needed for
    single-stream view-models.

  Minor follow-ups (non-blocking): Emmett's `IllegalStateError.errorCode` is `403`;
  consider mapping domain conflicts to `409`/`400` explicitly. `elo-rating` uses its
  library-default K-factor (matches original reSolve behaviour verbatim).

- **Phase 1 — COMPLETE.** Remaining aggregates and the saga ported and verified against
  real Postgres:
  - **Player** (`src/player/`): `createPlayer`, `deletePlayer` (actor authz),
    `setDefaultLeague`, `resetDefaultLeague`, `registerWin`, `registerLoss`, and a new
    `changeEmail`. `PLAYER_EMAIL_CHANGED` now has its own distinct type (bug fixed).
    Password hashing ported verbatim (`src/common/password.ts`).
  - **Match** (`src/match/`): `registerSingleMatch`, `registerDoubleMatch`.
  - **League** (`src/league/`): `createLeague` (actor authz), `startSeason`.
  - **LeagueCreation saga** (`src/sagas/`): durable Emmett reactor via
    `postgreSQLEventStoreConsumer` + `postgreSQLReactor` (per-processor checkpoint).
    `LEAGUE_CREATED → createSeason`; `SEASON_CREATED → startSeason`. Verified full chain:
    creating a league auto-creates a season and starts it on the league.
  - **Verified:** all command endpoints (201/200), validation guards (4xx w/ message),
    actor authorization on delete/create-league, and the saga chain end-to-end in the
    event store.

  Conventions/decisions added this phase:
  - **Auth** is expressed against an `Actor` (`src/common/actor.ts`); the domain stays
    pure. A `@CurrentActor()` decorator reads dev headers (`x-actor-id`,
    `x-actor-superuser`) as a stand-in — **Phase 3** replaces this with a real JWT guard.
  - Event `data` payload types must be `type` aliases, not `interface` (Emmett's
    `Event<T, Data>` requires an index-signature record).
  - BigInt JSON shim in `main.ts` (Emmett stream versions are BigInt; Express can't
    serialize them).
  - `app.enableShutdownHooks()` so the saga consumer releases its processor lock on
    SIGTERM/SIGINT. Hard `taskkill /F` (SIGKILL) leaves a stale lock until Postgres reaps
    the connection — dev workaround: `docker restart foos-postgres-1`.

- **Next: Phase 2** — read-models (`Players`, `Leagues`) as async Pongo projections +
  query resolvers/controllers; remaining view-models (`PlayerMatches`, `PlayerName`,
  `PlayerSettings`, `LeagueData`) as WS subscriptions/REST; port `emailChange` handler
  to call `PlayerService.changeEmail`.
