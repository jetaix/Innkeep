# Innkeep as one container: the app, its background sync and its SQLite file.
# Keep the database on a volume mounted at /data, or it is lost on every update.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# No install scripts: better-sqlite3 ships its compiled binary, so nothing has to be built here.
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev --ignore-scripts

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_PATH=/data/innkeep.db \
    PORT=3000
COPY --from=build /app/package.json /app/next.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
RUN mkdir /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0"]
