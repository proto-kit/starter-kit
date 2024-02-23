FROM node:18-buster

ENV PNPM_HOME="/pnpm"

ENV PATH="$PNPM_HOME:$PATH"

COPY ../../ /src
WORKDIR /src

RUN corepack enable
RUN corepack prepare pnpm@8.15.3 --activate

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
