module.exports = {
    preset: 'jest-preset-angular',
    transformIgnorePatterns: [
        'node_modules/(?!.*\\.mjs$)',
        'web-lib-angular/(?!.*\\.mjs$)'
    ],
    moduleNameMapper: {
        '@oas/web-lib-core': '<rootDir>/../web-lib-core/dist',
        '@oas/web-lib-common': '<rootDir>/../web-lib-common/dist',
        '@oas/web-lib-angular': '<rootDir>/../web-lib-angular/dist',
    },
    testRegex: '.*\\.unit-spec\\.ts$',
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.test.json'
        }
    },
    setupFilesAfterEnv: ['<rootDir>/config/jest.setup.ts']
  };