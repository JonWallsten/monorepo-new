/**
 * Monkey patch examples
 */

import { MonkeyPatch } from '../build-tools/monkey-patch';

MonkeyPatch.patch('./node_modules/ng-packagr/lib/ng-package/options.di.d.ts', {
    type: 'single',
    source: 'watch?: boolean;',
    replacement: 'ignoredPaths?: (RegExp | string)[];',
    append: true
});

MonkeyPatch.patch('./node_modules/ng-packagr/lib/packagr.d.ts', {
    type: 'single',
    source: 'watch(): Observable<void>;',
    replacement: 'watch(ignoredPaths: (RegExp | string)[] = []): Observable<void>;'
});

MonkeyPatch.patch('./node_modules/ng-packagr/lib/ng-package/package.transform.js', {
    type: 'single',
    source: 'const watchTransformFactory = (project, _options, analyseSourcesTransform, entryPointTransform) => (source$) => {',
    replacement: 'const watchTransformFactory = (project, options, analyseSourcesTransform, entryPointTransform) => (source$) => {',
    identifier: 'patch-1'
});
MonkeyPatch.patch('./node_modules/ng-packagr/lib/ng-package/package.transform.js', {
    type: 'single',
    source: 'return file_watcher_1.createFileWatch(data.src, [data.dest]).pipe(operators_1.tap(fileChange => {',
    replacement: 'return file_watcher_1.createFileWatch(data.src, [data.dest, ...(options.ignoredPaths || [])]).pipe(operators_1.tap(fileChange => {',
    identifier: 'patch-2'
});

const replacement = `   watch(ignoredPaths = []) {
    this.providers.push(options_di_1.provideOptions({ watch: true, ignoredPaths }));
`;

MonkeyPatch.patch('./node_modules/ng-packagr/lib/packagr.js', {
    type: 'multiLine',
    lineStart: 90,
    lineEnd: 91,
    lineDetection: {
        lineNumber: 90,
        source: 'watch() {'
    },
    replacement
});
