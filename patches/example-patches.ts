/**
 * Monkey patch examples
 */

import { MonkeyPatch } from '../build-tools/monkey-patch';

const replacement = `function multiLineFunction () {
    console.log('Log something');
    console.log('Log something else');
};`;

MonkeyPatch.patch('./module.js', {
    type: 'multiLine',
    lineStart: 4,
    lineEnd: 7,
    lineDetection: {
        lineNumber: 4,
        source: 'function functionToReplaceWithMultiLine () {1'
    },
    replacement: replacement
});

MonkeyPatch.patch('./module.js', {
    type: 'multiString',
    sourceStart: 'const firstLine = \'\';',
    sourceEnd: 'const secondLine = \'\';', // sourceEnd and numberOfLines are mutually exclusive
    numberOfLines: 5,
    replacement: replacement
});

MonkeyPatch.patch('./module.js', {
    type: 'single',
    source: 'const firstLine = \'\';',
    replacement: 'const beforeFirstLine = \'\';',
    prepend: true,
    identifier: 'customPatchIdentifier1'
});

MonkeyPatch.patch('./module.js', {
    type: 'single',
    source: 'const firstLine = \'\';',
    replacement: 'const afterFirstLine = \'\';',
    append: true,
    identifier: 'customPatchIdentifier2'
});

MonkeyPatch.patch('./module.js', {
    type: 'single',
    source: 'const firstLine = \'\';',
    replacement: 'const newFirstLine = \'\';',
    identifier: 'customPatchIdentifier3'
});
