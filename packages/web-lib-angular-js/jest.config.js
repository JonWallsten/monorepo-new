module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.(ts|js|html)$': 'ts-jest'
    },
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
                require.resolve('./config/jest/InlineHtmlStripStylesTransformer')
            ]
        }
    }
};
