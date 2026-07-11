# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @observatory/api
COPY apps/api apps/api
# --legacy: fine here — @observatory/api has no injected workspace deps.
RUN pnpm --filter @observatory/api build \
  && pnpm --filter @observatory/api --prod deploy --legacy /out

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
EXPOSE 3001
CMD ["node", "dist/main.js"]
