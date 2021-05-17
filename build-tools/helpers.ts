import { join, resolve, dirname, isAbsolute, sep } from 'path';
import { mkdirSync, existsSync } from 'fs';

const PROJECT_ROOT_PATH = resolve(__dirname, '..');
export const projectRootPath = (...args: string[]): string => join(PROJECT_ROOT_PATH, ...args);
export const packageRootPath = (...args: string[]): string => join(process.cwd(), ...args);

export const distFilesFilter = /[\\\/]packages[\\\/]web-(?:lib|app)-.*[\\\/]dist[\\\/]/;

export function ensureDirectoryExistence (filePath: string) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
        mkDirByPathSync(dir);
    }
}

export const includeBase = [
    projectRootPath('typings')
];

/**
 * Recursive mkDir
 */
function mkDirByPathSync (targetDir: string, { isRelativeToScript = false } = {}) {
    const initDir = isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(sep).reduce((parentDir: string, childDir: string) => {
        const curDir = resolve(baseDir, parentDir, childDir);
        try {
            mkdirSync(curDir);
        } catch (err) {
            if (err.code === 'EEXIST') { // curDir already exists!
                return curDir;
            }

            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }

            const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && curDir === resolve(targetDir)) {
                throw err; // Throw if it's just the last created dir.
            }
        }

        return curDir;
    }, initDir);
}
