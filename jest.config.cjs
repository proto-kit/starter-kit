/* eslint-disable no-undef */
/* eslint-disable import/unambiguous */
/* eslint-disable import/no-commonjs */
/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    // because we run tests from within ./packages/<package_name>/
    rootDir: './',
    moduleDirectories: ["node_modules", "src"],
    extensionsToTreatAsEsm: ['.ts'],
    testTimeout: 30_000,
    setupFilesAfterEnv: ["jest-expect-message"],
    moduleNameMapper: {
        '../../../node_modules/snarkyjs/dist/(.*)': '<rootDir>/node_modules/snarkyjs/dist/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        '^.+\\.ts?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
};
