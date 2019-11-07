module.exports = {
    roots: ['<rootDir>/src'],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
            stringifyContentPathRegex: '\\.html$',
            astTransformers:[
                require.resolve('./config/jest/InlineHtmlStripStylesTransformer')
            ]
        }
    },
    transform: {
        '^.+\\.(ts|js|html)$': 'ts-jest'
    },
    testRegex: '.*\\.spec\\.jest\\.(j|t)s$',
    moduleFileExtensions: ['ts', 'js', 'json', 'html']
};