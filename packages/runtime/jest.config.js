/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // because we run tests from within ./packages/<package_name>/
  rootDir: "./",
  // preset: "ts-jest/presets/default-esm",
  // moduleDirectories: ["node_modules", "src", "test"],
  testPathIgnorePatterns: ["dist"],
  extensionsToTreatAsEsm: [".ts"],
  testTimeout: 30_000 * 100,
  // ensure tests are run sequentially, in case proofs are enabled
  // eslint-disable-next-line no-undef
  maxWorkers: process.env.PROOFS_ENABLED === "true" ? 1 : "100%",
  // setupFilesAfterEnv: ["jest-expect-message"],
  moduleNameMapper: {
    // "o1js/dist/(.*)": "<rootDir>/node_modules/o1js/dist/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    "^.+\\.ts?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
