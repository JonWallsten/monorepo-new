module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.(ts|js|html)$': 'ts-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!@ngrx|angular2-ui-switch|ng-dynamic)'
    ],
    testRegex: '.*\\.spec\\.jest\\.(j|t)s$',
    moduleFileExtensions: ['ts', 'js', 'json', 'html'],
    cacheDirectory: '<rootDir>/.tmp/jest-cache',
    collectCoverage: true,
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
            astTransformers:[
                require.resolve('./jest/InlineHtmlStripStylesTransformer')
            ]
        }
    },
    setupFilesAfterEnv: [
        '<rootDir>/config/jest.setup.ts'
    ]
    // Do we need this?
    // snapshotSerializers: [
    //     'jest-preset-angular/AngularSnapshotSerializer.js',
    //     'jest-preset-angular/HTMLCommentSerializer.js'
    // ]
};
