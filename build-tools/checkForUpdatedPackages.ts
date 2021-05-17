import { readFileSync } from 'fs';
import * as helpers from './helpers';
import { listPkgs } from './run-all/workspace';
import { join } from 'path';
import { spawn } from 'child_process';
import { hasUpdatedPackages, defaultPackageJsonFileName, defaultPackageHashFileName } from './packageJsonHash';

const prune = process.env.IS_DEV ? 'npm run prune && ' : '';

let installCommand: string = '';
// Check if root package has updated packages
if (hasUpdatedPackages(helpers.projectRootPath(defaultPackageJsonFileName), helpers.projectRootPath(defaultPackageHashFileName))) {
    installCommand = prune + 'npm install && npm run symlink && npm run write-dependencies-hash && npm run ngcc';
}

const pkgJsonPackages = JSON.parse(readFileSync(`./${defaultPackageJsonFileName}`, 'utf8')).packages;
const pkgs = listPkgs('./', pkgJsonPackages);

// Loop through each packet and check if there are updated packages
Object.keys(pkgs).forEach((name: string) => {
    const path = pkgs[name].path;
    const packageHashFile = join(helpers.projectRootPath(path), defaultPackageHashFileName);
    const packageJsonFile = join(helpers.projectRootPath(path), defaultPackageJsonFileName);
    if (hasUpdatedPackages(packageJsonFile, packageHashFile)) {
        installCommand = prune + 'npm run full-install';
    }
});

// If an install command has been set we spawn a process
if (installCommand) {
    const installProcess = spawn(installCommand, [], { shell: true });
    console.debug('Auto-triggered NPM INSTALL: ', installCommand);
    installProcess.stdout.on('data', (data) => {
        console.log(data.toString('utf8')); // eslint-disable-line no-console
    });
    installProcess.stderr.on('data', (data) => {
        console.log(data.toString('utf8')); // eslint-disable-line no-console
    });

    installProcess.on('exit', (code) => {
        process.exit(code);
    });
} else {
    process.exit(0);
}
