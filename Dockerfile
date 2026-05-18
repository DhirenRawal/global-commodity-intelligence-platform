FROM node:24-slim AS app

WORKDIR /app

ENV NODE_ENV=production
ENV NPM_CONFIG_PRODUCTION=false

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig*.json .npmrc ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts

RUN corepack pnpm install --frozen-lockfile
RUN corepack pnpm run build

ENV PORT=23671
EXPOSE 23671

CMD ["corepack", "pnpm", "run", "start"]
