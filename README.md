# Protokit starter-kit

This repository is a monorepo aimed at kickstarting application chain development using the Protokit framework.
You can learn more about the Protokit framework at the [official documentation](protokit.dev), or at the official [Mina discord](https://discord.gg/minaprotocol).

## Quick start

**Prerequisites:**

- Node.js `v18` (we recommend using NVM)
- pnpm `v9.8.0`
- nvm
- (optional) For running with persistance / deploying on a server
    - docker `>= 24.0`
    - docker-compose `>= 2.22.0`

**Run the following commands to get started:**
```zsh
# clone the repository
git clone https://github.com/proto-kit/starter-kit my-chain
cd my-chain

# ensures you have the right node.js version
nvm use
# install dependencies
pnpm install
# starts both the UI and the sequencer (file watcher / live reload enabled)
pnpm env:inmemory dev
```
Visit http://localhost:3000 to view the example UI, or http://localhost:8080/graphql to explore the sequencer's GraphQL APIs.

### Structural overview

The starter kit contains the following files and folders:
```
├── apps
│   └── web // example UI that connects to the app-chain's sequencer
│       ├── components // display components
│       ├── containers // smart components ("containers")
│       └── lib
│           └── stores // data stores for interacting with the app-chain's sequencer
│           
├── docker
│   └── data // mounted as a volume for the docker containers
│
└── packages
    └── chain
        ├── src // source files for various app-chain modules
        │   ├── app-chain // app-chain modules (signers, queries, ...)
        │   ├── environments // app-chain environments (inmemory, development, ...)
        │   ├── indexer // indexer configuration (graphql server, storage services, ...)
        │   ├── protocol // protocol modules (transaction fees, ...)
        │   ├── runtime // runtime modules (your app-chain's business logic, such as balances)
        │   │   └── modules 
        │   │       └── balances.ts // built-in example runtime module for Balances, with a faucet
        │   ├── sequencer // sequencer modules (graphql server, mempool, block production, ...)
        └── test // tests for various app-chain components
            └── runtime
                └── modules
                    └── balances.test.ts

```

## Environments

The starter-kit offers different environments to run you appchain.
You can use those environments to configure the mode of operation for your appchain depending on which stage of development you are in.

The starter kit comes with a set of pre-configured environments:
- `inmemory`: Runs everything in-memory without persisting the data. Useful for early stages of runtime development.
- `development`: Runs the sequencer locally and persists all state in databases running in docker. 
- `sovereign`: Runs your appchain fully in docker (including the UI) for testnet deployments without settlement or bridging.

Every command you execute should follow this pattern:

```
pnpm env:<environment> <command>
```

> This makes sure that everything is set correctly and our tooling knows which environment you want to use.

### Environment files

Each environment comes with a set of environment variables specified in `.env`. This allows for configuration for the Protokit app-chain stack.

To learn more about what configuration options are available, check out any of the available env files at `packages/chain/src/environments/<environment>/.env`

## Development workflow

### Running tests

```zsh
# run and watch tests for the `chain` package
pnpm env:inmemory run test --filter=chain -- --watchAll
```

### (Optional) Running the containerized dependencies

> This step isn't required if you're using the `inmemory` environment.

```
# run dockerized dependencies in the background
pnpm env:development docker:up -d

# generate prisma clients
pnpm env:development prisma:generate

# migrate database schemas
pnpm env:development sequencer:prisma:migrate
```

#### Pruning data

Persisted data is stored under `docker/data`, you can delete this folder in case you're experiencing issues with persistence and need to reset your environment setup entirely. 

However to prune data during development, you should use the `--pruneOnStartup` CLI option [documented here](#cli-options)

### Running the sequencer

Ensure you've successfully started the dockerized dependencies, generated and migrated all prisma schemas before running the sequencer (or indexer) in the development environment. In case of using the inmemory environment, you don't need to start the dockerized dependencies.

#### With live reload

> ⚠️ Be aware, the dev command will automatically restart your application when your sources change. 

```zsh
pnpm env:development sequencer:dev --filter=chain
```

#### Without live reload

```zsh
pnpm env:development build --filter=chain
pnpm env:development sequencer:start --filter=chain
```

### Running the UI

```zsh
pnpm env:development dev --filter=web
```

> You can also build & start the UI as well, instead of using `dev` command with live-reload.

### Running the indexer

⚠️ Indexer only runs with docker-enabled environments, therefore it is not available with the `inmemory` environment

```zsh
pnpm env:development indexer:dev --filter=chain
```

Indexer's graphql is available at `http://localhost:8081/graphql`, unless your environment configuraton specifies otherwise.

### CLI Options

- `logLevel`: Overrides the loglevel used. Also configurable via the `PROTOKIT_LOG_LEVEL` environment variable.
- `pruneOnStartup`: If set, prunes the database before startup, so that your chain is starting from a clean, genesis state. Alias for environment variable `PROTOKIT_PRUNE_ON_STARTUP`

In order to pass in those CLI option, add it at the end of your command like this

`pnpm env:inmemory dev --filter chain -- --logLevel DEBUG --pruneOnStartup`

## Deployments (sovereign environment)

When deploying to a server, you should push your code along with your forked starter-kit to some repository, 
then clone it on your remote server and execute it.

```zsh
# start every component with docker
pnpm env:sovereign docker:up -d
```

UI will be accessible at `https://localhost` and GQL inspector will be available at `https://localhost/graphql` (sequencer) and at `https://localhost/indexer/graphql` (indexer).

### Configuration

Go to `docker/proxy/Caddyfile` and replace the `*` matcher with your domain.
```
yourdomain.com {
    ...
}
```

> HTTPS is handled automatically by Caddy, you can (learn more about automatic https here.)[https://caddyserver.com/docs/automatic-https]

In most cases, you will need to change the `NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL` property in the `.env` file to the domain your graphql endpoint is running in.
By default, the graphql endpoint is running on the same domain as your UI with the `/graphql` suffix.

### Running sovereign chain locally

The caddy reverse-proxy automatically uses https for all connections, use this guide to remove certificate errors when accessing localhost sites

<https://caddyserver.com/docs/running#local-https-with-docker>


## Building the framework from source

1. Make sure the framework is located under ../framework from the starter-kit's location
2. Adapt your starter-kit's package.json to use the file:// references to framework
3. Go into the framework folder, and build a docker image containing the sources with `docker build -f ./packages/deployment/docker/development-base/Dockerfile -t protokit-base .`

4. Comment out the first line of docker/base/Dockerfile to use protokit-base