FROM node:16.13.2-buster-slim as base
WORKDIR /app
COPY [".babelrc", "package.json", "config.*.js", "run.js", "./"]
RUN ["yarn", "install"]

FROM base as build
WORKDIR /app
COPY --from=base ["/app", "./"]
COPY . .
RUN ["yarn", "run", "build"]

FROM base as runtime
WORKDIR /app
ENV HOST=0.0.0.0
COPY "package.json" "."
COPY --from=base	["/app", "./"]
COPY --from=build ["/app/dist", "./dist"]
ENTRYPOINT [ "yarn", "run", "start" ]