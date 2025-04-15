#!/bin/bash

PROTOKIT_ENV=$2

# Define array of packages to load env files from
PACKAGES=(
    "app-chain"
    "runtime"
    "protocol"
    "sequencer"
)

# Build the dotenvx arguments
DOTENV_ARGS=""

if [ -f ".env.$2" ]; then
    DOTENV_ARGS="-f .env.$2"
fi

for package in "${PACKAGES[@]}"; do
    ENV_FILE="../../packages/${package}/.env.${PROTOKIT_ENV}"
    if [ -f "$ENV_FILE" ]; then
        DOTENV_ARGS+=" -f $ENV_FILE"
    fi
done

if [ -z "$PROTOKIT_ENV" ]; then
    echo "Starting script $1 without a specified environment"
else
    echo "Starting script $1 in ${PROTOKIT_ENV} environment"
fi

dotenvx run ${DOTENV_ARGS} \
  -- node \
    --loader ts-node/esm \
    --experimental-vm-modules \
    --es-module-specifier-resolution=node \
    --experimental-wasm-modules \
    $PWD/scripts/$1.ts $@

