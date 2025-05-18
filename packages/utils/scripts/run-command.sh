#!/bin/bash

export PROTOKIT_ENV=$1
shift
# Define array of packages to load env files from
PACKAGES=(
    "app-chain"
    "runtime"
    "protocol"
    "sequencer"
    "lightnet"
)

# Build the dotenvx arguments
DOTENV_ARGS=""


if [ -f ".env.$PROTOKIT_ENV" ]; then
    DOTENV_ARGS="-f .env.$PROTOKIT_ENV"
fi


for package in "${PACKAGES[@]}"; do
    ENV_FILE="../../packages/${package}/.env.default"
    if [ -f "$ENV_FILE" ]; then
        DOTENV_ARGS+=" -f $ENV_FILE"
    fi
done

for package in "${PACKAGES[@]}"; do
    ENV_FILE="../../packages/${package}/.env.${PROTOKIT_ENV}"
    if [ -f "$ENV_FILE" ]; then
        DOTENV_ARGS+=" -f $ENV_FILE"
    fi
done

if [ -z "$PROTOKIT_ENV" ]; then
    echo "Starting command $2 without a specified environment"
else
    echo "Starting command $2 in ${PROTOKIT_ENV} environment"
fi

echo "DOTENV_ARGS: ${DOTENV_ARGS}"

dotenvx run ${DOTENV_ARGS} \
  -- $@