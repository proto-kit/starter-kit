# FROM node:18-alpine AS base
## Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
#RUN apk add --no-cache libc6-compat

# For locally built and imported framework references
# Make sure you build the base-image first
FROM protokit-base:latest AS base

# Install dependencies only when needed
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL
ENV NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL=$NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL

# Install dependencies based on the preferred package manager

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY ./packages/chain/package.json ./packages/chain/package.json
COPY ./apps/web/package.json ./apps/web/package.json

RUN corepack enable pnpm

COPY ./tsconfig.json .
COPY ./packages/chain/tsconfig.json ./packages/chain/tsconfig.json
COPY ./apps/web/tsconfig.json ./apps/web/tsconfig.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY ./packages ./packages
COPY ./apps ./apps

RUN pnpm run build --filter=web

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD node ./apps/web/server.js