## Docker setup for starter-kit

This folder contains docker and docker-compose files to spin up protokit along with your custom code in multiple different modes

## Requirements

- docker `> 24.0`
- docker-compose `> 2.22.0`

## General

To run starter-kit as a docker-compose stack, two points of configuration are needed: 
The .env file for docker, and the src/environments for telling protokit how to run your appchain.

**Protokit Environments**

Since everything in protokit is modular and uses dependency injection on every level, protokit needs to know what modules to execute.

The application lives in the `runtime.ts` and `protocol.ts` files, where you can add you application's logic.

The third part is the sequencer, which is configured via the environments provided in the `environments` folder.
This is necessary because a worker instance has different modules configured in comparison to the sequencer or the API gateway.
They all work with the same runtime and protocol, but have different sequencer modules.

Environments are listed in `start.ts`, where you will also need to add any custom environment you choose to add.

But we provide a set of preconfigured environments that should suffice for most use-cases.

**The .env file**

The .env file under `docker/.env` controls the services that docker starts and their configuration.
In order to switch from any run mode to another, you'll have to do some adaptations to that file. 
See the different *Run Modes* below.

## Run Modes 

These run-modes are the first choice on how to run the starer-kit and can be configured more granularly using the below *Dependencies*.

### InMemory Development

This mode is for very early stages of development, where everything will run in-memory and in one process.
This is the easiest to restart when you made some changes to the code, but will also not persist any data.

`pnpm run dev --filter=chain`

### Local Development 

This is for local development when the runtime and protocol logic is already implemented and you are starting to build the UI and other peripheral services.

This mode will run your application locally, but will access needed services using docker. These can include a database or lightnet instance.

`.env`: 
```yaml
COMPOSE_PROFILES=<insert profiles according to your needed dependencies - remove '*'>
PROTOKIT_ENV=local
```

Start:

```bash
# Start dependencies
cd docker
docker-compose up -d
cd ..
pnpm run build --filter=chain
pnpm run start --filter=chain -- --environment local
```

TODO run dev

### Server Deployment

This mode additionally packs your application into a docker container and splits the normally monolithic sequencer 
into multiple services, each responsible for a subset of tasks, which makes the deployment scalable and fault-tolerant.

`.env`: `PROTOKIT_ENV=deployment`

! Not finished !

## Dependencies

### Database Persistance

`.env`: 
- `COMPOSE_PROFILES=db,...` 
- Configure `POSTGRES_*` variables
- Configure `DATABASE_URL` variable as a postgres connection string with the same values as before

`local/chain.config.ts`:
Replace `InMemoryDatabase` with `PrismaRedisDatabase`

`configurePartial`:
```
Database: {
  redis: {
    password: "password",
    host: "redis",
    port: 6379
  },
  prisma: {
    connection: {
      password: "password",
      username: "admin",
      db: {
        name: "protokit"
      },
      host: "postgres",
      port: 5432
    }
  }
}
```

Obviously, you should replace the passwords in this configuration and in the `.env` file with you own ones.

For local development:
Execute `pnpm run migrate`

### Workers

Enable the workers profile in your .env (`worker`).
Additionally, specify the `WORKER_CONFIG` to specify the configuration you want to execute

Then, go to your environment's chain.config.ts (most likely under `environments/local/chain.config.ts`) and configure following modules:
- Replace `LocalTaskQueue` by `BullQueue`
- Remove the `LocalTaskWorkerModule` module from the definition
- Adjust the `TaskQueue` config to point to your redis instance

For example:
```
TaskQueue: {
  redis: {
    host: "localhost",
    port: 6379,
    password: "password",
  }
}
```

#### Lighnet
Coming soon

#### Reverse Proxy (Traefik)
Coming soon

### Starting

## CLI Options

`environment`: Name of the environment you want to execute
`configuration`: Concrete appchain configuration you want to execute
`logLevel`: Overrides the loglevel used. Also configurable via the `LOGGING_LEVEL` environment variable.
`prune`: If set, prunes the database before startup, so that your chain is starting from a clean, genesis state.

## UI / Client

## Building framework from source

1. Make sure the framework is located under ../framework from the starter-kit's location
2. Adapt your starter-kit's package.json to use the file:// references to framework
3. Go into the framework folder, and build a docker image containing the sources with `docker build -f ./packages/deployment/docker/development-base/Dockerfile -t protokit-base .`

4. Comment out the first line of docker/base/Dockerfile to use protokit-base

## Running the proxy locally

<https://caddyserver.com/docs/running#local-https-with-docker>