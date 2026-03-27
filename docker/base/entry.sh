#!/bin/bash

if [[ ${PROTOKIT_SHOULD_ATTEMPT_DB_MIGRATION} ]]; then
  echo "Migrating on ${DATABASE_URL}"
  cd packages/chain/node_modules/@proto-kit/persistance
  pnpx prisma@5.18.0 migrate deploy
  cd ../../../../..
fi

if [[ ${PROTOKIT_SHOULD_ATTEMPT_INDEXER_DB_MIGRATION} ]]; then
  echo "Migrating on ${INDEXER_DATABASE_URL}"
  cd packages/chain/node_modules/@proto-kit/indexer
  pnpx prisma@5.18.0 migrate deploy
  cd ../../../../..
fi

if [[ ${PROTOKIT_SHOULD_ATTEMPT_PROCESSOR_DB_MIGRATION} ]]; then
  echo "Migrating on ${PROCESSOR_DATABASE_URL}"
  cd packages/chain/src/core/processor
  pnpx prisma@5.18.0 migrate deploy
  cd ../../../../..
fi

cd /app
cd packages/chain

echo $@

# We can't use start:headless here bcs that task hardcodes the .js file, we want it to be extensible
node --loader ts-node/esm --experimental-vm-modules --experimental-wasm-modules --es-module-specifier-resolution=node --no-warnings $@
