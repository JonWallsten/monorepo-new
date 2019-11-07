import { writeDependenciesHash, defaultPackageJsonFileName, defaultPackageHashFileName } from './packageJsonHash';
import { readFileSync } from 'fs';
import { listPkgs } from './run-all/workspace';
import * as helpers from './helpers';
import { join } from 'path';

// Write a dependency hash file for root package.json
writeDependenciesHash(defaultPackageJsonFileName, defaultPackageHashFileName);

const pkgJsonPackages = JSON.parse(readFileSync(`./${defaultPackageJsonFileName}`, 'utf8')).packages;
const pkgs = listPkgs('./', pkgJsonPackages);

// Loop through each package and write a dependency hash file
Object.keys(pkgs).forEach((name: string) => {
    const path = pkgs[name].path;
    const packageHashFile = join(helpers.projectRootPath(path), defaultPackageHashFileName);
    const packageJsonFile = join(helpers.projectRootPath(path), defaultPackageJsonFileName);
    writeDependenciesHash(packageJsonFile, packageHashFile);
});
