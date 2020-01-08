import { join, resolve } from 'path';
import { includeBase } from '../../../build-tools/helpers';
import { realpathSync } from 'fs';

const ROOT_PATH = resolve(__dirname, '..');
export const rootPath = (...paths: string[]): string => join(ROOT_PATH, ...paths);
export const realRootPath = (...paths: string[]) => realpathSync(rootPath(...paths));

export const include = [
    ...includeBase,
    rootPath('src'),
    rootPath('node_modules/bootstrap')
];
export const includeTS = [
    ...includeBase,
    rootPath('src'),
    rootPath('typings')
];
export const includeStyles = [
    rootPath('src')
];
