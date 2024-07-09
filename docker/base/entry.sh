#!/bin/bash

if [[ ${DATABASE_URL} ]]; then
  echo "Migrating on ${DATABASE_URL}"
  cd packages/chain/node_modules/@proto-kit/persistance
  pnpm dlx prisma migrate deploy
  cd ../../../../..
fi
LOGGING_LEVEL=${LOGGING_LEVEL}
# We can't use start:headless here bcs that task hardcodes the .js file, we want it to be extensible
node --experimental-vm-modules --experimental-wasm-modules --experimental-wasm-threads --es-module-specifier-resolution=node $@