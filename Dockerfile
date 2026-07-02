# syntax=docker/dockerfile:1

# Multi-stage build for the Foos app: NestJS API + Emmett (PostgreSQL) event
# store + the React SPA, all in one runtime. Vite builds the SPA into
# `client-dist`, which Nest serves via ServeStaticModule; `nest build` compiles
# the server into `dist`. Postgres is external (set EVENTSTORE_CONNECTION_STRING).
#
#   docker build -t foos .
#   docker run --rm -p 3000:3000 \
#     -e EVENTSTORE_CONNECTION_STRING="postgresql://user:pass@host:5432/foos" \
#     -e JWT_SECRET="<a strong secret>" \
#     foos

# ---- Base: Node 22 + pnpm (pinned to match pnpm-lock.yaml, lockfileVersion 9) ----
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

# ---- Install all deps (incl. dev) for the build; layer cached on the lockfile ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Build the SPA (vite -> client-dist) and the server (nest -> dist) ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# ---- Production-only deps for a lean runtime image ----
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ---- Runtime ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Nest resolves the SPA at `<dist>/../client-dist`, so `dist` and `client-dist`
# must sit side by side under /app. Run as the image's built-in non-root `node`.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/client-dist ./client-dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 3000

# Liveness: the API root (GET /api) returns 200 once Nest is listening.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
