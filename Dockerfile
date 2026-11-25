# Innkeep as one container: the app, its background sync and its SQLite file.
# Keep the database on a volume mounted at /data, or it is lost on every update.
FROM node:22-slim AS build
WORKDIR /app
RUN npm install --global bun@1.4.4
COPY package.json bun.lock ./
COPY web/package.json web/bun.lock ./web/
# No install scripts: the database driver ships its compiled binary, so nothing has to be built here.
RUN bun install --frozen-lockfile --ignore-scripts && cd web && bun install --frozen-lockfile --ignore-scripts
COPY . .
# The server is built into one file; of everything installed, only the database driver is needed to run it.
RUN cd web && bun run build \
  && cd .. && rm -rf node_modules web/node_modules \
  && version=$(node -p "require('./package.json').dependencies['@libsql/client']") \
  && mkdir run && cd run && npm init -y >/dev/null \
  && npm install --omit=dev --no-audit --no-fund "@libsql/client@$version"

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    DATABASE_PATH=/data/innkeep.db \
    PORT=3000
COPY --from=build /app/run/node_modules ./node_modules
COPY --from=build /app/web/dist ./web/dist
COPY --from=build /app/web/dist-server ./web/dist-server
RUN mkdir /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
CMD ["node", "web/dist-server/serve.js"]
