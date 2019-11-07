import { join, resolve, dirname, isAbsolute, sep } from 'path';
import { mkdirSync, existsSync } from 'fs';

const PROJECT_ROOT_PATH = resolve(__dirname, '..');
export const projectRootPath = (...args): string => join(PROJECT_ROOT_PATH, ...args);

export function ensureDirectoryExistence (filePath) {
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
function mkDirByPathSync (targetDir, { isRelativeToScript = false } = {}) {
    const initDir = isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(sep).reduce((parentDir, childDir) => {
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
