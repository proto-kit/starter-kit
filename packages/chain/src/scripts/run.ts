const script = await import(`./${process.argv[2]}`);
await script.default();
export {};
