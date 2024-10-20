# Protokit starter-kit

This repository is a monorepo aimed at kickstarting application chain development using the Protokit framework.
You can learn more about the Protokit framework at the [official documentation](protokit.dev), or at the official [Mina discord](https://discord.gg/minaprotocol).

## Quick start

**Prerequisites:**

- Node.js `v18.18` (we recommend using NVM)
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
            ├── processor // processor configuration (handlers, graphql resolvers, graphql server, ...)
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
pnpm env:development prisma:migrate
```

#### Pruning data

Persisted data is stored under `docker/data`, you can delete this folder in case you're experiencing issues with persistence and need to reset your environment setup entirely. 

However to prune data during development, you should use the `--pruneOnStartup` CLI option [documented here](#cli-options)

### Running the sequencer

Ensure you've successfully started the dockerized dependencies, generated and migrated all prisma schemas before running the sequencer (or indexer) in the development environment. In case of using the inmemory environment, you don't need to start the dockerized dependencies.

#### With live reload

> ⚠️ Be aware, the dev command will automatically restart your application when your sources change. 
> Please keep in mind that running the components below in `dev` mode (with live reload / watchersr) is advisable only when you're working on that specific component. In case you're experiencing issues with watches cross-triggering reload of different components, you can use the `start` command instead.

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

> You can also build/start the UI as well, instead of using `dev` command with live-reload.


### Running the indexer

⚠️ Indexer only runs with docker-enabled environments, therefore it is not available with the `inmemory` environment

```zsh
pnpm env:development indexer:start --filter=chain
```

Indexer's graphql is available at `http://localhost:8081/graphql`, unless your environment configuraton specifies otherwise.

### Running the processor

⚠️ Processor only runs with docker-enabled environments, therefore it is not available with the `inmemory` environment

```zsh
pnpm env:development processor:dev --filter=chain
```

Processor's graphql is available at `http://localhost:8082/graphql`, unless your environment configuraton specifies otherwise.

### CLI Options

- `logLevel`: Overrides the loglevel used. Also configurable via the `PROTOKIT_LOG_LEVEL` environment variable.
- `pruneOnStartup`: If set, prunes the database before startup, so that your chain is starting from a clean, genesis state. Alias for environment variable `PROTOKIT_PRUNE_ON_STARTUP`

In order to pass in those CLI option, add it at the end of your command like this

`pnpm env:inmemory dev --filter chain -- --logLevel DEBUG --pruneOnStartup`

## Historical data processing (processor)

Starter-kit ships with a preconfigured historical data processor using `@proto-kit/processor`. Example block & transactions handlers are available in `chain/src/processor/handlers/*`. Once the sequencer produces a block, it flows to the indexer for historical storage, and it's picked up by the processor via the indexer graphql API. The processor then runs the specified handlers in order to process the available block & transaction data into the user specified schema. Additionally the processor serves the processed data via a set of auto-generated graphql resolvers.

### Handling transactions

1. Define your database schema at `chain/src/processor/prisma/schema.prisma`
2. Generate the prisma client using `pnpm env:<your_environment_name> run processor:prisma:generate`
3. Generate your database migrations using `pnpm env:<your_environment_name> run processor:prisma:migrate:dev`
4. Write your handlers as shows in `chain/src/processor/handlers/**`
5. Run the processor using `pnpm env:<your_environment_name> run processor:dev` (sequencer & indexer should be running beforehand)

> Processor relies on the sequencer to produce blocks, and the indexer to access them

Once the processor starts, you can observe it query the indexer for blocks from the last processed block (starting at #0) and running the defined onBlock handler for each block.

Finally, you can query the processed data at the indexer's graphql API available at `http://localhost:8082/graphql` (depending on your environment configuration).

### GraphQL API

You can define which resolvers are available in `chain/src/processor/api/resolvers.ts`. By default all available resolvers generated based on your database schema file are used. You must configure additional middlewares, validations etc. yourself. The example configures a simple validation for the `take` argument for resolvers returning multiple entities at once.

## Deployments (sovereign environment)

When deploying to a server, you should push your code along with your forked starter-kit to some repository, 
then clone it on your remote server and execute it.

> Don't forget to run `pnpm env:sovereign docker:build` to build the required images.

```zsh
# start every component with docker
pnpm env:sovereign docker:up -d
```

UI will be accessible at `https://localhost` and GQL inspector will be available at `https://localhost/graphql` (sequencer), `https://localhost/indexer/graphql` (indexer) and `https://localhost/processor/graphql` (processor)

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