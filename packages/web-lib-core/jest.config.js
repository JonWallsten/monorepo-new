module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    testRegex: '.*\\.spec\\.jest\\.(j|t)s$',
    moduleFileExtensions: ['ts', 'js', 'json', 'html'],
    cacheDirectory: '.tmp/jest-cache',
    collectCoverage: true,
    coverageReporters: [
        'json',
        'lcov',
        'text',
        'text-summary'
    ],
    coverageDirectory: '.tmp/coverage',
    coverageThreshold: {
        global: {
            branches: 1,
            functions: 1,
            lines: 1,
            statements: 1
        }
    },
    globals: {}
};
