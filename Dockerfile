# Build from the repository root: docker build -t orderflow-api .
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter @orderflow/api build
RUN pnpm --filter @orderflow/api deploy --prod /out

FROM node:22-alpine
ENV NODE_ENV=prod PORT=3000
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
COPY --from=build /app/apps/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
