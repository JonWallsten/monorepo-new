import { join, resolve } from 'path';
import { includeBase, projectRootPath } from '../../../build-tools/helpers';
import { realpathSync } from 'fs';

const ROOT_PATH = resolve(__dirname, '..');
export const rootPath = (...paths: string[]): string => join(ROOT_PATH, ...paths);
export const realRootPath = (...paths: string[]) => realpathSync(rootPath(...paths));

export const include = [
    includeBase,
    rootPath('src')
];

export const includeTS = [
    ...include,
    rootPath('typings')
];

export const includeStyles = [
    rootPath('src', 'styles'),
    rootPath('node_modules/normalize.css'),
    projectRootPath('packages/web-lib-angular/src/styles'),
    projectRootPath('node_modules/@fortawesome/fontawesome-free')
];

export const includeSourceMaps = [
    ...include,
    projectRootPath('packages/web-lib-core/dist')
];
