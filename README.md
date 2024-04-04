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

### Deployment

The example Docker Compose configuration includes a proxy with auto-SSL for the sequencer and UI.

1. Configure the DNS of your (sub)domains. Note: automated SSL certificate generation will fail without this.

2. Configure then start proxy, sequencer, and UI:

   ```sh
   cd apps/web
   # copy then edit .env to configure the URL of your sequencer
   cp env.example .env

   cd ../../docker
   # copy then edit .env to configure
   cp env.example .env

   # start proxy, sequencer, and UI
   docker compose up -d

   # to watch the logs
   docker compose logs -f
   ```

Optionally, the web app may be built (`pnpm run build`) and deployed separately from the sequencer with your preferred Next.js deployment method.
