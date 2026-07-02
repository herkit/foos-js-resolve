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
- **Source dump:** a production MySQL event-store dump is available locally at
  `./mysql/Dump20260701/` (gitignored — contains prod data). Use it to derive the real
  event-table schema and to build/test the exporter.
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
    SIGTERM/SIGINT. The saga reactor also uses a leased lock (`lock.timeoutSeconds: 10` +
    `retry` acquisition policy), so after a hard `taskkill /F` (SIGKILL) a restart steals the
    dead holder's stale lease and self-heals — no Postgres restart needed. (Added when a
    "Failed to acquire lock for processor 'league-creation-saga'" error surfaced on restart.)

- **Phase 2 — COMPLETE.** Read side implemented and verified against real Postgres:
  - **Read-model projections** (`src/read-models/*.projection.ts`) registered **inline**
    with the event store (`projections.inline([...])`), using free-hand `pongoProjection`
    (needed because they query the collection):
    - **Players** — folds `PLAYER_*` events; "first user is superuser" (global count),
      current rank, and consolidates the `PlayerName`/`PlayerSettings` view-models
      (name + default league) into the player document.
    - **Leagues** — slug generation with uniqueness; restored the (originally
      commented-out) `SEASON_STARTED` handler to fold in the `LeagueData` season list.
    - **PlayerMatches** — multi-stream projection into `player_matches` keyed by player.
  - **Query side** (`PongoModule` client + `*.query.service.ts` + `*.read.controller.ts`):
    `GET /players` (all/names/autocomplete/by-email/:id/:id/matches),
    `GET /leagues` (all/by-slug/:id). Responses expose `id` (not `_id`) and omit the
    password hash.
  - **emailChange** (`email-change.controller.ts`) ported from `api/emailChange.js`:
    read (is email taken?) + `changeEmail` command → 409 on conflict.
  - **Verified:** read-models populate from commands; superuser-first flag; slug +
    saga-driven season list on leagues; player match lists; emailChange 409/201.

  Notes/decisions:
  - `PlayerName`/`PlayerSettings`/`LeagueData` view-models were **folded into the
    Players/Leagues read-models** rather than kept as separate reactive view-models —
    simpler and they're pure projections of the same events. (Reactive WS delivery,
    like `SeasonRanks`, can be layered on later if the UI needs live pushes.)
  - Added `@event-driven-io/pongo` as a direct dep (was transitive; TS couldn't resolve).
  - Pongo gotchas: `updateOne` has no `upsert` option (use `upsertById` helper);
    `countDocuments` returns a **string** (coerce with `Number()`); docs must be `type`
    aliases (index-signature constraint).
  - Read-model projections are **inline**, so they only apply to events appended after
    registration — historical events need a rebuild (Phase 4 territory).
  - `login` resolver deferred to **Phase 3** (auth); `byEmailRaw` exists to support it.

- **Phase 3 — COMPLETE.** Auth ported and verified against real Postgres:
  - **JWT cookie** (`src/auth/`): stateless `signToken`/`verifyToken` (`jsonwebtoken`),
    httpOnly `jwt` cookie (name/maxAge from the original config), `cookie-parser` wired.
  - **`JwtCookieGuard`** verifies the cookie and populates `request.user`; `@CurrentActor`
    now reads it (the dev-header stand-in from phases 1-2 is gone). Guard is dependency-free
    so it drops onto any controller without module coupling. Applied to
    `POST /leagues/:id` and `DELETE /players/:id`.
  - **Local auth** (`AuthController`): `POST /auth/register` (email check → createPlayer →
    token), `POST /auth/login` (ports the `Players.login` resolver — added to
    `PlayersQueryService`), `POST /auth/logout`, `GET /auth/me`.
  - **Slack OAuth** (`SlackController`/`SlackStrategy` via `passport-slack-oauth2`) ported
    and wired **only when `SLACK_CLIENT_ID`/`SLACK_CLIENT_SECRET` are set** (logs "disabled"
    otherwise). Not exercised locally — needs real Slack credentials.
  - **Verified:** register/login set the cookie; `/auth/me` returns claims; wrong password
    401; logout clears the session; `POST /leagues` is 401 without a cookie and stamps
    `owner` from the JWT; `DELETE /players` enforces self/superuser (403 for others,
    200 for self).

  Notes/decisions:
  - Used `jsonwebtoken` + a stateless guard instead of `@nestjs/jwt`/`passport-jwt` — avoids
    a circular module dependency (AuthModule needs PlayerModule; guarded controllers would
    otherwise need AuthModule) and keeps the guard usable anywhere.
  - `superuser` claim is read from the (inline) Players read-model at register/login time.
  - Slack strategy env is read at module-eval time; set the vars as real environment
    variables (not only `.env`) to enable the routes.

- **Phase 4 — COMPLETE.** Data migration built and verified with exact parity against the
  production dump (`./mysql/Dump20260701/`, 2939 events):
  - **Exporter** (`nestjs/foos/migrate/`, run via ts-node — see `migrate/README.md`):
    reads the reSolve `events` table, maps each event `type` → aggregate/stream id
    (`stream-mapping.ts`), copies the payload verbatim, and appends to a fresh Emmett
    store. Because the store is created with the read-model projections **inline**, the
    replay rebuilds all read models; the saga is not started.
  - **Critical fix found during verification:** replay must be in **chronological order**
    (`timestamp`), NOT `(threadId, threadCounter)` — those are reSolve partition
    coordinates and don't reflect cross-aggregate order. Wrong order made 14
    `PLAYER_DELETED` events no-op (players 65 vs 51) and mis-assigned superuser.
  - Transforms: `PLAYER_DELETED` payload `null` → `{}`; `SEASON_MATCH_REGISTERED` carries
    the row `timestamp` into `data.timestamp`.
  - The `PLAYER_EMAIL_CHANGED` collision fix-up is a **no-op** for this dump — no
    email-change, single/double-match, or won/lost-match events were ever emitted (prod
    recorded matches only via `SEASON_MATCH_REGISTERED` on the season stream).
  - **Verified parity** (migrated vs original read-model): events 2939=2939,
    players 51=51, leagues 5=5, superuser 1=1 (Henrik Grotle). Migrated into the
    `foos_migrated` database.
  - **Managed-Postgres target (SSL):** the target URL goes straight to `pg`, and
    `pg-connection-string` (>=2.13) now treats `sslmode=require` as `verify-full`.
    Managed providers (DigitalOcean, etc.) use a self-signed CA, so `?sslmode=require`
    fails with `SELF_SIGNED_CERT_IN_CHAIN`. Use `?sslmode=no-verify` (quick) or
    `?sslmode=verify-full&sslrootcert=<ca-certificate.crt>` (secure). See
    `migrate/README.md` → "SSL / managed Postgres".

- **Phase 5 — COMPLETE (build + serving verified; browser QA pending).** Frontend cut over
  from the reSolve client SDK via a **compatibility shim**, built with **Vite**, served by Nest.
  - **API client** (`client/api/`): REST client + endpoint map (command/query/view-model →
    NestJS routes) under the `/api` prefix; cookie-credentialed.
  - **Redux store** (`client/store/`): plain redux with `jwt` + `readModels` + `viewModels`
    slices (replaces `createResolveStore`).
  - **Shim** (`client/resolve-compat/`): reimplements `@resolve-js/react-hooks`
    (`useQuery`/`useCommand`/`useViewModel`/`useStaticResolver`/`useClient`) and
    `@resolve-js/redux` (`useReduxReadModel`/`useReduxReadModelSelector`/`useReduxViewModel`/
    `createResolveStore`/`ResolveReduxProvider`/`internal`) against the new API. SeasonRanks is
    live over socket.io; other view-models fetch-on-connect.
  - **Vite** (`vite.config.mjs`) **aliases the two reSolve packages to the shim**, so component
    imports are unchanged. esbuild `jsx` loader handles the JSX-in-`.js` sources. Dev proxy
    forwards `/api` + `/socket.io` to the API. Build → `nestjs/foos/client-dist` (gitignored).
  - **Bootstrap**: `index.html` + `client/main.jsx` (react-dom render + redux Provider +
    BrowserRouter), replacing the reSolve SSR entry. `AuthForm`/`LoginInfo` now use `fetch`
    against `/api/auth/*` instead of native form POSTs.
  - **Nest**: global `/api` prefix (WS gateway unaffected) + `ServeStaticModule` serving the
    SPA with `/api` excluded from the SPA fallback.
  - **Verified:** `vite build` (472 modules) succeeds — the shim compiles against every
    component; served app returns the SPA at `/`, falls back to index.html for client routes
    (`/leagues`, `/players`), serves hashed assets + `static/` files, all `/api/*` endpoints
    respond, and the socket.io handshake works.
  - **Not yet verified:** in-browser React runtime (rendering, hook data flow, live scoreboard)
    — needs a real browser (Phase 6 E2E).

  Notes/decisions:
  - Frontend build deps (`vite`, `@vitejs/plugin-react`, `socket.io-client`, `jwt-decode`)
    were added to the **root** `package.json` and installed with `--ignore-scripts` to avoid
    rebuilding reSolve's native `better-sqlite3` (which fails under node-gyp here). The root
    `package-lock.json` may be out of sync as a result; a clean environment should
    `npm install` without the reSolve native deps.
  - Removed a dead `import { ConfigService } from 'aws-sdk'` in `SeasonHistoryChart` that would
    have bloated/broken the browser bundle.
  - reSolve SSR is dropped (client-side rendering only), as decided.

- **Phase 6 — IN PROGRESS (browser QA done; automated E2E added).** Manual browser testing
  surfaced and fixed a chain of real issues, then an automated suite was added:
  - **Blank page** — Vite couldn't parse JSX-in-`.js` (renamed client sources to `.jsx`,
    dropped the loader override) and `react-moment` crashed under Vite (replaced with a small
    `moment` component).
  - **Login not recognised** — the `jwt` cookie is httpOnly; the SPA now detects auth via
    `GET /auth/me` instead of reading the cookie.
  - **New league stuck on "Loading"** — the LeagueCreation reactor halted on a replayed
    `startSeason` (`IllegalStateError` stops the processor). Made it idempotent: swallow
    already-applied domain conflicts, and skip `createSeason` when the league already has a
    season (`LeagueService.getState`). The view-model shim now polls (change-detected) so the
    async season appears without a manual refresh.
  - **Automated E2E** (`nestjs/foos/e2e/`, Playwright): app loads; register → logged in →
    create league → season Scoreboard appears. Both pass against chromium. Run with
    `pnpm e2e` (Nest serves SPA + API; Postgres up; SPA + API built).
  - Note: the ported email validation only accepts 2-3 char TLDs (faithful to reSolve).

  Remaining before production cutover: run E2E against a copy of migrated prod data, add
  match-registration + live-scoreboard coverage, code-split the bundle, and reconcile the
  root lockfile / drop now-unused deps (react-moment, jwt-decode).
