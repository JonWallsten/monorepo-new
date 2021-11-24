import { appendFileSync, existsSync, readFileSync, watch, writeFileSync } from 'fs';
import { packageRootPath, projectRootPath } from '../helpers';
import { yellow } from 'chalk';

type Dependency = {
    name: string;
    path: string;
};

export type Options = {
    debug?: boolean;
};

export class WatchControllerPlugin {
    private static buildFileName: string = '.webpack.build';
    private static watchFileName: string = '.webpack.watch';
    private static buildFile: string = packageRootPath(WatchControllerPlugin.buildFileName);
    private static watchFile: string = packageRootPath(WatchControllerPlugin.watchFileName);
    private initial: boolean = true;
    private packageName: string;
    private dependants: Dependency[] = [];
    private dependencies: Dependency[] = [];

    constructor (private options: Options = {}) {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('This plugin is only allowed for development. Did you set process.node.NODE_ENV to `development`?');
        }

        // Create new files if they don't exist already or empty it's content if it does
        writeFileSync(WatchControllerPlugin.watchFile, '', { encoding:'utf8', flag:'w' });
        writeFileSync(WatchControllerPlugin.buildFile, '', { encoding:'utf8', flag:'w' });

        const packagesIncludedInRun = process.env.includedPackages ? JSON.parse(process.env.includedPackages) as string[] : undefined;
        // Get a list of all packages in this monorepo
        const packages = (this.parsePackageJson(projectRootPath('./package.json')).packages as string[]);
        // Get the name for the current package so we can check for dependants
        this.packageName = this.getPackageName(packageRootPath('./package.json'));
        // Get dependecies for this packages
        const currentPackageInternalDependencies = this.getInternalDependecies(packageRootPath('./package.json'));
        // List of packages dependant on this package
        const dependants: Dependency[] = [];
        // List of packages we are dependent on
        const dependencies: Dependency[] = [];
        // List of dependencies for each package that we use to find packages dependant on us and our dependencies
        const internalDependencies: Record<string, string[]> = {};

        packages.forEach(path => {
            const packageJSONfile = projectRootPath(path, './package.json');
            const packageName = this.getPackageName(packageJSONfile);
            // If package is not included in this run we skip checking dependencies
            if (packagesIncludedInRun && !packagesIncludedInRun.includes(packageName)) {
                this.debugOutput('Package `'+ packageName + '` is not included in this run');
                return;
            }
            // Keep interal dependencies for each package so we can check the dependency tree
            internalDependencies[packageName] = this.getInternalDependecies(packageJSONfile);

            // Check if package is dependant on us and store it if that's the case
            if (internalDependencies[packageName].indexOf(this.packageName) !== -1) {
                dependants.push({ name: packageName, path: path });
            }

            // Check if we are dependent on the package and store it
            if (currentPackageInternalDependencies.indexOf(packageName) !== -1) {
                dependencies.push({ name: packageName, path: path });
            }
        });

        // Filter out any dependencies that is also dependent on our other depedencies
        this.dependencies = dependencies.filter(dependency => {
            // Check if any of our dependencies are dependant on each other, if that's the case we wait for that dependency to be built first
            return !dependencies.some((_dependency) => internalDependencies[_dependency.name].find(internalDependency => internalDependency === dependency.name));
        });

        // Check if the dependants are depandant on each other to build in stages
        this.dependants = dependants.filter(dependant => {
            // Check if any of our dependencies are also dependants, if that's the case we wait for that dependency to be built first
            return !internalDependencies[dependant.name].some((dependency) => dependants.find(_dependency => _dependency.name === dependency));
        });

        this.debugOutput('====================================');
        this.debugOutput('Dependencies:', internalDependencies[this.packageName].length ? internalDependencies[this.packageName] : 'None');
        this.debugOutput('Direct Dependencies:', this.dependencies.length ? this.dependencies.map(dependant => dependant.name) : 'None');
        this.debugOutput('Dependants:', this.dependants.length ? this.dependants.map(dependant => dependant.name) : 'None');
        this.debugOutput('====================================');

        // Watch build file and check if all dependencies are built
        // Note: If the package doesn't have any dependencies we don't need to watch the file
        if (this.dependencies.length) {
            watch(WatchControllerPlugin.buildFile, (_eventType, _filename) => {
                this.debugOutput('Build file changed for ' + this.packageName);
                const rebuild = this.checkIfAllDependeciesAreBuilt();
                // If all dependencies are built we trigger our watch file to rebuild our package
                if (rebuild) {
                    this.triggerRebuild();
                }
            });
        }
    }

    // Define `apply` as its prototype method which is supplied with compiler as its argument
    apply (compiler: any) {
        // We only allow this plugin to run under development
        if (process.env.NODE_ENV !== 'development') {
            return;
        }

        compiler.hooks.watchRun.tap('WatchControllerPlugin', (compilation: any) => {
            this.buildStart();

            if (this.options.debug) {
                const changedFilesList = compilation.modifiedFiles ? Array.from(compilation.modifiedFiles.values()) : [];
                if (changedFilesList.length) {
                    const changedFiles = changedFilesList.length > 20 ? changedFilesList.slice(0, 20) + '\n...' : changedFilesList;
                    if (changedFiles.length) {
                        this.debugOutput('====================================');
                        this.debugOutput('Changes files:', changedFiles);
                        this.debugOutput('====================================');
                    }
                }
            }
        });

        // Add our watch file to the fileDependency tree so we can trigger rebuilds by changing it
        compiler.hooks.emit.tap('WatchControllerPlugin', (compilation: any): void => {
            // Add file to fileDependencies to so webpack can watch it for changes
            if (!compilation.fileDependencies.has(WatchControllerPlugin.watchFile)) {
                this.debugOutput('Adding watch file for ' + this.packageName);
                compilation.fileDependencies.add(WatchControllerPlugin.watchFile);
            }
        });

        // When compilation is done we trigger rebuilds for our dependants
        compiler.hooks.done.tap('WatchControllerPlugin', (_stats: any): void => {
            if (this.initial) {
                this.initial = false;
                return;
            }
            this.buildDone();
        });
    }

    /**
     * Return the path to the watch file
     *
     * @readonly
     * @memberof WatchControllerPlugin
     */
    getWatchFile (): string {
        return WatchControllerPlugin.watchFile;
    }

    /**
     * Return the path to the build file
     *
     * @readonly
     * @memberof WatchControllerPlugin
     */
    getBuildFile (): string {
        return WatchControllerPlugin.buildFile;
    }

    /**
     * Called when a build is done
     *
     * @private
     * @memberof WatchControllerPlugin
     */
    private buildStart (): void {
        this.dependants.forEach((dependant) => {
            this.removeBuildInfo(dependant);
        });
    }

    /**
     * Called when a build is done
     *
     * @private
     * @memberof WatchControllerPlugin
     */
    private buildDone (): void {
        this.dependants.forEach((dependant) => {
            this.writeBuildInfo(dependant);
        });
    }

    /**
     * Trigger builds externally if a package is not using webpack
     *
     * @static
     * @memberof WatchControllerPlugin
     */
    public buildDoneExternal (): void {
        this.dependants.forEach((dependant) => {
            this.writeBuildInfo(dependant);
        });
    }

    /**
     * Add our package name to the build file for each dependant to signal that we are done with the build
     *
     * @private
     * @param {Dependency} dependant
     * @returns
     * @memberof WatchControllerPlugin
     */
    private writeBuildInfo (dependant: Dependency) {
        const buildFile = projectRootPath(dependant.path, WatchControllerPlugin.buildFileName);
        // If file doesn't exist yet we don't need to write to it
        if (!existsSync(buildFile)) {
            return;
        }
        // Mark this build as finnished
        appendFileSync(buildFile, this.packageName + '\n');

        this.debugOutput('Added build information for "' + this.packageName + '" in "'+ buildFile.replace(projectRootPath(), '') + '"');
    }

    /**
     * Remove our package name from the build file for each dependant to singal that we are no longer done with the build
     *
     * @private
     * @param {Dependency} dependant
     * @returns
     * @memberof WatchControllerPlugin
     */
    private removeBuildInfo (dependant: Dependency) {
        const buildFile = projectRootPath(dependant.path, WatchControllerPlugin.buildFileName);
        // If file doesn't exist yet we don't need to write to it
        if (!existsSync(buildFile)) {
            return;
        }
        // Remove file from build
        let contents = readFileSync(buildFile, 'utf-8');
        this.debugOutput('Current content:', contents);
        // Remove the app from the build file since we're rebuilding
        const pattern = new RegExp(`${this.packageName}[\r]?\n`);
        // Check if pattern is part of the file before replacing it
        if (contents.match(pattern)) {
            contents = contents.replace(new RegExp(`${this.packageName}[\r]?\n`), '');
            this.debugOutput('New content:', contents);
            // Write the new content
            writeFileSync(buildFile, contents);
            this.debugOutput('Removed build information for "' + this.packageName + '" in ' + buildFile.replace(projectRootPath(), '') + '"');
        } else {
            this.debugOutput('Removing build information unnecessary for "' + this.packageName + '" in "' + buildFile.replace(projectRootPath(), '') + '"');
        }
    }

    /**
     * Trigger rebuild for dependants
     *
     * @private
     * @memberof WatchControllerPlugin
     */
    private triggerRebuild (): void {
        // Trigger rebuild for each dependant
        this.debugOutput('Trigger rebuild for ' + this.packageName);
        // Clear build file
        writeFileSync(WatchControllerPlugin.buildFile, '');
        // Add current date to watch file to trigger a rebuild
        writeFileSync(WatchControllerPlugin.watchFile, Date.now().toString());
    }

    /**
     * Check if all dependencies are built before starting a build
     *
     * @private
     * @returns {boolean}
     * @memberof WatchControllerPlugin
     */
    private checkIfAllDependeciesAreBuilt (): boolean {
        const buildFile = readFileSync(WatchControllerPlugin.buildFile, 'utf8');
        return !!this.dependencies.length && this.dependencies.every(dependency => buildFile.includes(dependency.name));
    }

    /**
     * Get internal dependencies for provided package.json file
     *
     * @private
     * @param {string} packageJSONFile
     * @returns {string[]}
     * @memberof WatchControllerPlugin
     */
    private getInternalDependecies (packageJSONFile: string): string[] {
        const internalDeps = Object.keys(this.parsePackageJson(packageJSONFile).internalDependencies as Record<string, string> || {});
        const internalDevDeps = Object.keys(this.parsePackageJson(packageJSONFile).internalDevDependencies as Record<string, string> || {});

        return [
            ...internalDeps,
            ...internalDevDeps
        ];
    }

    /**
     * Get package name for provided package.json file
     *
     * @private
     * @param {string} packageJSONFile
     * @returns {string}
     * @memberof WatchControllerPlugin
     */
    private getPackageName (packageJSONFile: string): string {
        return this.parsePackageJson(packageJSONFile).name as string;
    }

    /**
     * Parse provided package.json file
     *
     * @private
     * @param {*} packageJSONFile
     * @returns {Record<string, any>}
     * @memberof WatchControllerPlugin
     */
    private parsePackageJson (packageJSONFile: string): Record<string, any> {
        return JSON.parse(readFileSync(packageJSONFile, 'utf8'));
    }

    /**
     * Output debug info with a nice yellowish color
     *
     * @private
     * @param {...any[]} args
     * @memberof WatchControllerPlugin
     */
    private debugOutput (...args: any[]) {
        if (!this.options.debug) {
            return;
        }

        args.forEach((argument) => {
            if (typeof argument === 'string') {
                console.debug(yellow('[WatchController]['+this.packageName+'] ' + argument));
            } else if (Array.isArray(argument)) {
                console.debug(yellow('[WatchController]['+this.packageName+'] ' + argument.join('\n[WatchController]['+this.packageName+'] ')));
            } else {
                console.debug(argument);
            }
        });
    }
}
