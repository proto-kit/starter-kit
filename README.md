# Protokit starter-kit

This repository is a monorepo aimed at kickstarting application chain development using the Protokit framework.

## Quick start

The monorepo contains 1 package and 1 app:

- `packages/chain` contains everything related to your app-chain
- `apps/web` contains a demo UI that connects to your locally hosted app-chain sequencer

**Prerequisites:**

- Node.js v18
- pnpm
- nvm

For running with persistance / deploying on a server
- docker (tested with >= v24)
- docker-compose (tested with >= v2.22.0)

### Setup

```zsh
git clone https://github.com/proto-kit/starter-kit my-chain
cd my-chain

# ensures you have the right node.js version
nvm use
pnpm install
```

### Environments

The starter-kit offers different environments to run you appchain.
You can use those environments to configure the mode of operation for your appchain depending on which stage of development you are in.

The starter kit comes with a set of pre-configured environments:
- `inmemory`: Runs everything in-memory without persisting the data. Useful for early stages of runtime development.
- `development`: Runs the sequencer locally and persists all state in databases running in docker. 
- `sovereign`: Runs your appchain fully in docker (except the UI) for testnet deployments without settlement.

Every command you execute should follow this pattern:

`pnpm env:<environment> <command>`

This makes sure that everything is set correctly and our tooling knows which environment you want to use.

### Running the sequencer & UI in-memory

```zsh
# starts both UI and sequencer locally
pnpm env:inmemory dev

# starts UI only
pnpm env:inmemory dev --filter web
# starts sequencer only
pnpm env:inmemory dev --filter chain
```

> Be aware, the dev command will automatically restart your application when your sources change. 
> If you don't want that, you can alternatively use `pnpm run build` and `pnpm run start`

Navigate to `localhost:3000` to see the example UI, or to `localhost:8080/graphql` to see the GQL interface of the locally running sequencer.

### Running tests
```zsh
# run and watch tests for the `chain` package
pnpm run test --filter=chain -- --watchAll
```

### Running with persistence

```zsh
# start databases
pnpm env:development docker:up -d
# migrate schema to database
pnpm env:development migrate

# build & start sequencer
pnpm build --filter=chain
pnpm env:development start --filter=chain

# Watch sequencer for local filesystem changes
# Be aware: Flags like --prune won't work with 'dev'
pnpm env:development dev --filter=chain

# Start the UI
pnpm env:development dev --filter web
```

### Deploying to a server

When deploying to a server, you should push your code along with your forked starter-kit to some repository, 
then clone it on your remote server and execute it.

```zsh
# start every component with docker
pnpm env:sovereign docker:up -d
```

#### Configuration

Go to `docker/proxy/Caddyfile` and replace the `*` matcher with your domain.
```
yourdomain.com {
    ...
}
```

In most cases, you will need to change the `NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL` property in the `.env` file to the domain your graphql endpoint is running in.
By default, the graphql endpoint is running on the same domain as your UI with the `/graphql` suffix.

#### Running sovereign chain locally

The caddy reverse-proxy automatically uses https for all connections, use this guide to remove certificate errors when accessing localhost sites

<https://caddyserver.com/docs/running#local-https-with-docker>