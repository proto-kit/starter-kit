FROM node:18

ENV PNPM_HOME="/pnpm"

ENV PATH="$PNPM_HOME:$PATH"

COPY ../ /src
WORKDIR /src

RUN corepack enable
RUN corepack prepare pnpm@8.15.6 --activate

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# this may be omitted if only running sequencer and not UI
RUN pnpm run build
