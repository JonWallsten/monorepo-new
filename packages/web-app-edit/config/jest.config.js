module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.(ts|js|html)$': 'ts-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!@ngrx|angular2-ui-switch|ng-dynamic)',
        'dist/'
    ],
    moduleNameMapper: {
        '@oas/web-lib-core': '<rootDir>/../web-lib-core/dist',
        '@oas/web-lib-common': '<rootDir>/../web-lib-common/dist',
        '@oas/web-lib-angular': '<rootDir>/../web-lib-angular/dist',
    },
    modulePathIgnorePatterns: ['/dist/', '/node_modules/'],
    coveragePathIgnorePatterns : ['/dist/', '/node_modules/'],
    testRegex: '.*\\.unit-spec\\.ts$',
    moduleFileExtensions: ['ts', 'js', 'json', 'html'],
    cacheDirectory: '<rootDir>/.tmp/jest-cache',
    collectCoverage: false,
    coverageReporters: [
        'json',
        'lcov',
        'text',
        'text-summary'
    ],
    coverageDirectory: '<rootDir>/.tmp/coverage',
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    },
    globals: {
        'ts-jest': {
            stringifyContentPathRegex: '\\.html$',
            astTransformers:{
                after: [
                    '<rootDir>/config/jest/InlineHtmlStripStylesTransformer'
                ]
            },
            tsconfig: '<rootDir>/tsconfig.test.json'
        }
    },
    setupFilesAfterEnv: [
        '<rootDir>/config/jest.setup.ts'
    ]
};
