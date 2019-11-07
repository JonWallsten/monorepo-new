import { join, resolve } from 'path';
import { includeBase, projectRootPath } from '../../../build-tools/helpers';
import { realpathSync } from 'fs';

const ROOT_PATH = resolve(__dirname, '..');
export const rootPath = (...paths: string[]): string => join(ROOT_PATH, ...paths);
export const realRootPath = (...paths: string[]) => realpathSync(rootPath(...paths));

export const include = [
    includeBase,
    rootPath('src'),
    rootPath('node_modules/ui-select'),
    projectRootPath('packages/web-lib-core/dist/'), // Since these are symlinks we need to resolve the real path
    projectRootPath('packages/web-lib-common/dist/'),
    projectRootPath('packages/web-lib-angular-js/dist/'),
    projectRootPath('node_modules/@fortawesome/fontawesome-free')
];

export const includeTS = [
    ...include,
    rootPath('typings')
];

export const includeStyles = [
    ...include,
    rootPath('node_modules/monaco-editor')
];
