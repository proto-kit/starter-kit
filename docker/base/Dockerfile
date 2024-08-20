# For regular deployment
#FROM node:18

# For locally built and imported framework references
# Make sure you build the base-image first
# FROM protokit-base:latest
FROM node:22

WORKDIR /app

COPY package.json .
COPY pnpm-workspace.yaml .
COPY pnpm-lock.yaml .
COPY turbo.json .

COPY ./packages/chain/package.json ./packages/chain/package.json
COPY ./apps/web/package.json ./apps/web/package.json

RUN corepack enable pnpm

COPY ./tsconfig.json .
COPY ./packages/chain/tsconfig.json ./packages/chain/tsconfig.json
COPY ./apps/web/tsconfig.json ./apps/web/tsconfig.json

RUN pnpm install --frozen-lockfile

RUN apt update && apt install dos2unix && apt clean

COPY ./packages ./packages

RUN pnpm build --filter=chain

COPY ./docker/base/entry.sh ./entry.sh
RUN dos2unix ./entry.sh
RUN chmod +x ./entry.sh

# Migrate + execute
ENTRYPOINT ["./entry.sh"]