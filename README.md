# Protokit starter-kit

This repository is a monorepo aimed at kickstarting application chain development using the Protokit framework.

Upstream: https://github.com/proto-kit/starter-kit

This is intended to be an experimental short-lived fork with the following changes:

- fixes and features to support build and deploy
- custom protokit run script to workaround cli ui mem leak
- add chain startup script with example
- add docker files and compose scripts including traefik proxy for auto-SSL
- add ability to set public Protokit URL

## Deployment Quick start

### Config

#### traefik proxy

```sh
cd docker/proxy
cp env.example .env
# edit .env
```

#### protokit chain

```sh
cd docker/chain
cp env.example .env
# edit .env, set DOMAIN for SSL cert
```

#### web app

```sh
cd apps/web
cp env.example .env

# edit .env, set protokit URL
```

### Run

#### traefik proxy

```sh
cd docker/proxy
docker compose up -d
```

#### protokit chain

```sh
cd docker/chain
docker compose up -d
```

## Development Quick start

The monorepo contains 1 package and 1 app:

- `packages/chain` contains everything related to your app-chain
- `apps/web` contains a demo UI that connects to your locally hosted app-chain sequencer

**Prerequisites:**

- Node.js v18
- pnpm
- nvm

> If you're on windows, please use Docker until we find a more suitable solution to running the `@proto-kit/cli`.
> Run the following command and then proceed to "Running the sequencer & UI":
>
> `docker run -it --rm -p 3000:3000 -p 8080:8080 -v %cd%:/starter-kit -w /starter-kit gplane/pnpm:node18 bash`

### Setup

```zsh
git clone https://github.com/proto-kit/starter-kit my-chain
cd my-chain

# ensures you have the right node.js version
nvm use
pnpm install
```

### Running the sequencer & UI

```zsh
# starts both UI and sequencer locally
pnpm dev

# starts UI only
pnpm dev -- --filter web
# starts sequencer only
pnpm dev -- --filter chain
```

### Running tests

```zsh
# run and watch tests for the `chain` package
pnpm run test --filter=chain -- --watchAll
```

Navigate to `localhost:3000` to see the example UI, or to `localhost:8080/graphql` to see the GQL interface of the locally running sequencer.
