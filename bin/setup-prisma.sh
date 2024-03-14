#!/bin/bash

pnpm install --frozen-lockfile

# start prisma and redis docker services
# cd docker/persistance && docker compose up -d

# setup prisma stuff that resides within node_modules/, used by @proto-kit/persistance
cd node_modules/.pnpm/@proto-kit+persistance*/node_modules/@proto-kit/persistance
npm install

# create prisma migration files from latest schema and deploy database tables to postgres database
rm -rf prisma/migrations
DATABASE_URL="postgresql://admin:password@localhost:5432/protokit?schema=public" npx prisma migrate dev --name init

# generate prisma client
npm run prisma-generate

# clean up; only keep what is required for prisma
mv node_modules node_modules.tmp
mkdir node_modules
cp -a node_modules.tmp/@prisma ./node_modules/
cp -a node_modules.tmp/.prisma ./node_modules/
rm -rf ./node_modules.tmp/
