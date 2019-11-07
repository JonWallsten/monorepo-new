import { existsSync, readFileSync, writeFileSync } from 'fs';
import nodeObjectHash from 'node-object-hash';

export const defaultPackageHashFileName = '.packages.hash';
export const defaultPackageJsonFileName = 'package.json';

type HashObject = {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
    optionalDependencies: Record<string, string>;
};

export function hasUpdatedPackages (packageJsonFile: string, hashFile: string): boolean {
    let hash = '';
    if (existsSync(hashFile)) {
        hash = readFileSync(hashFile, 'utf8');
    }

    const newHash = createDependenciesHash(packageJsonFile);

    // If the hash differs from the last hash something has been updated
    if (newHash !== hash) {
        writeFileSync(hashFile, newHash, 'utf8');
        return true;
    }

    return false;
}

export function createDependenciesHash (packageJsonFile: string) {

    const packageJSON = JSON.parse(readFileSync(packageJsonFile, 'utf8'));
    const packages: HashObject = {
        dependencies: packageJSON.dependencies || {},
        devDependencies: packageJSON.devDependencies || {},
        peerDependencies: packageJSON.peerDependencies || {},
        optionalDependencies: packageJSON.optionalDependencies || {}
    };

    // Create a hash for all dependencies and their version
    return nodeObjectHash({ sort: false }).hash(packages);


}

export function writeDependenciesHash (packageJsonFile: string, hashFile: string) {

    const hash = createDependenciesHash(packageJsonFile);

    writeFileSync(hashFile, hash, 'utf8');
}
