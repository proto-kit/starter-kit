#!/bin/bash

# Check if first argument is provided
if [ -z "$1" ]; then
    echo "Error: First argument (env file) is required"
    exit 1
fi

# Define array of packages
PACKAGES=(
    "app-chain"
    "runtime"
    "protocol"
    "sequencer"
)

# Build the dotenvx arguments
DOTENV_ARGS=""

if [ -f ".env.$1" ]; then
    DOTENV_ARGS="-f .env.$1"
fi

for package in "${PACKAGES[@]}"; do
    ENV_FILE="../../packages/${package}/.env.${PROTOKIT_ENV}"
    if [ -f "$ENV_FILE" ]; then
        DOTENV_ARGS+=" -f $ENV_FILE"
    fi
done

echo "DOTENV_ARGS: $DOTENV_ARGS"

echo "Starting the sequencer in ${PROTOKIT_ENV} mode"

dotenvx run ${DOTENV_ARGS} \
  -- node \
    --loader ts-node/esm \
    --experimental-vm-modules \
    --es-module-specifier-resolution=node \
    --experimental-wasm-modules \
    ./scripts/start.ts start "$@"