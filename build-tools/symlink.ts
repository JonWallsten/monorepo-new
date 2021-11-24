import { copyFile, readFileSync, existsSync, symlink } from 'fs';
import * as rimraf from 'rimraf';
import * as copy from 'ncp';
import { listPkgs } from './run-all/workspace';
import * as helpers from './helpers';
import * as yargs from 'yargs';
import { replaceInFile } from 'replace-in-file';

type SymLink = {
    name: string;
    origin?: string;
    target?: string;
    copy?: boolean;
    type: 'file' | 'dir' | 'bin' | 'module';
    pattern?: string;
};

const argv = yargs.parseSync();
const isWindows = process.platform === 'win32';

// Create symlinks for each package
const symlinks: SymLink[] = JSON.parse(readFileSync(__dirname + '/symlinks.json', 'utf8'));
const pkgJsonPackages = JSON.parse(readFileSync('./package.json', 'utf8')).packages;

const pkgs = listPkgs('./', pkgJsonPackages);

// Loop through each packet and create symlinks
Object.keys(pkgs).forEach((name: string) => {
    const path = pkgs[name].path;
    symlinks.forEach(link => {
        let origin: string;
        let target: string;

        if (link.type === 'bin') {
            origin = helpers.projectRootPath('node_modules', '.bin', link.name);
            origin = isWindows ? origin + '.cmd' :origin;
            target = helpers.projectRootPath(path, 'node_modules', '.bin', link.name);
            target = isWindows ? target + '.cmd' :target;
        } else if (link.type === 'module') {
            origin = helpers.projectRootPath('node_modules', link.name);
            target = helpers.projectRootPath(path, 'node_modules', link.name);
        } else {
            origin = helpers.projectRootPath(link.origin);
            target = helpers.projectRootPath(path, link.target);
        }

        if (link.pattern && !target.match(new RegExp(link.pattern))) {
            console.info('No match for (' + link.pattern + ':' + target);
            return;
        }

        if (existsSync(origin) && (!existsSync(target) || argv.force)) {
            // Make sure target directory exists
            helpers.ensureDirectoryExistence(target);
            if (link.type === 'bin' && (link.copy || isWindows)) {
                copyFile(origin, target, (err) => {
                    if (err) {
                        console.error('[postinstall] Could not copy bin file. Error: ', err, '\nOrigin: ' + origin, '\nTarget: ' + target);
                        process.exit(1);
                    }
                    // Update relative path in module's bin file
                    if (link.type === 'bin') {
                        replaceInFile({
                            files: target,
                            from: /\.\.(\\|\/)/g,
                            to: isWindows ? '..\\'.repeat(4) + 'node_modules\\' : '..\/'.repeat(4) + 'node_modules/'
                        }, (error) => {
                            if (error) {
                                console.error('[postinstall] relative path could not be updated. Error:', error);
                                process.exit(1);
                            }
                        });
                    }
                });
            } else {
                if (existsSync(target) && argv.force && link.type === 'bin') {
                    rimraf.sync(target);
                }

                // Windows doesn't handle symlinks that well, so we copy the file instead
                if (!link.copy && !isWindows) {
                    symlink(origin, target, link.type === 'module' ? 'dir' : 'file', (err) => {
                        if (err) {
                            console.error(`[postinstall] Could not symlink ${link.type}. Error: `, err);
                            process.exit(1);
                        }
                        console.info(`[postinstall] ${origin} -> ${target}`);
                    });
                } else if (link.copy || isWindows) {
                    // If a module already exists we skip copy
                    if (link.type === 'module' && existsSync(target)) {
                        return;
                    }
                    copy(origin, target, (err) => {
                        if (err) {
                            console.info(`[postinstall] Could not copy ${link.type}. Error: ${err}`);
                            process.exit(1);
                        }
                    });
                }
            }
        }
    });
});
