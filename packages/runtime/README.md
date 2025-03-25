# Runtime

## What's inside?

- [`./src/modules`](./src/modules): Modules of your Runtime
- [`./src/index.ts`](./src/index.ts): Entry point of your Runtime, exports all modules as named exports

## Testing

```sh
pnpm test
```

### With proofs enabled

```sh
pnpm test:proofs-enabled
```

#### Known limitations

O1JS's current prover runs in wasm, which imposes a 4GB memory limit. When running tests with proofs enabled with extra large Runtimes, you may
start running into memory issues.

This may start occuring if your runtime approaches `5 * 2^16` constraints in terms of circuit size. We do not expect developers to run into this issue unless their Runtime contains a lot of recursive proof verification, or any other complex logic that requires a large circuit.

If you run into memmory issues, you may end up having to split up the compilation & testing of your Runtime into smaller chunks. This is possible by diving into how the internal Runtime compilation works - by splitting up Runtime modules into multiple ZkPrograms, which can then be compiled & tested independently.
