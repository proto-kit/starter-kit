#!/bin/bash

if [[ ${DATABASE_URL} ]]; then
  echo "Migrating on ${DATABASE_URL}"
  cd packages/chain/node_modules/@proto-kit/persistance
  pnpm dlx prisma migrate deploy
  cd ../../../../..
fi
LOGGING-LEVEL=${LOGGING_LEVEL}
node --experimental-vm-modules --experimental-wasm-modules --experimental-wasm-threads --es-module-specifier-resolution=node $@