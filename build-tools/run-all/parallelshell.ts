import { spawn, ChildProcess } from 'child_process';
import originalSplit = require('split'); // tslint:disable-line no-require-imports
import chalk from 'chalk';
import * as path from 'path';

type PromiseFn<T> = () => Promise<T>;
type PromiseFnRunner = <T>(f: PromiseFn<T>) => Promise<T>;

const mkThroat = require('throat')(Promise) as ((limit: number) => PromiseFnRunner); // tslint:disable-line no-require-imports no-var-requires

const passThrough: PromiseFnRunner = f => f();

class Prefixer {
    constructor (private wspath: string) {}
    private currentName = '';
    prefixer = (basePath: string, pkg: string, line: string) => {
        let l = '';
        if (this.currentName !== pkg) { l += chalk.bold((this.currentName = pkg)) + '\n'; }
        l += ' | ' + this.processFilePaths(basePath, line);
        return l;
    }

    processFilePaths (basePath: string, line: string) {
        return line.replace(/(([^/\s'"*]+[/]){1,})([^/'"*]+)\.[0-9a-zA-Z]{1,6}/, m =>
      path.relative(this.wspath, path.resolve(basePath, m))
    );
    }
}

export interface ICmdOptions {
    rejectOnNonZeroExit: boolean;
    collectLogs: boolean;
    prefixer?: (basePath: string, pkg: string, line: string) => string;
    doneCriteria?: string;
    path: string;
}

interface IDefer<T> {
    promise: Promise<T>;
    resolve: (thenableOrResult?: T | PromiseLike<T> | undefined) => void;
    reject: (error?: any) => void;
}
function defer<T> () {
    let d: IDefer<T>;
    const promise = new Promise<T>((resolve, reject) => {
        d = { resolve, reject } as any;
    });
    d.promise = promise;
    return d;
}

const SPLIT_OPTIONS = { trailing: false };
const SPLIT_MAPPER = (x: string) => x;
const split = () => originalSplit(/\r?\n/, SPLIT_MAPPER, SPLIT_OPTIONS as any);

export class CmdProcess {
    cp!: ChildProcess;
    private _closed: IDefer<number>;
    private _finished: IDefer<void>;
    private _exitCode: IDefer<number>;

    get finished () {
        return this._finished.promise;
    }
    get closed () {
        return this._closed.promise;
    }
    get exitCode () {
        return this._exitCode.promise;
    }
    get exitError () {
        return this.exitCode.then(c => {
            if (c !== 0) { throw new Error('`' + this.cmd + '` failed with exit code ' + c); }
        });
    }

    doneCriteria?: RegExp;

    constructor (private cmd: string, private pkgName: string, private opts: ICmdOptions) {
        this.pkgName = pkgName;
        this.opts = opts;

        this._finished = defer<void>();
        this._exitCode = defer<number>();
        this._closed = defer<number>();

        if (this.opts.doneCriteria) { this.doneCriteria = new RegExp(this.opts.doneCriteria); }
    }

    start () {
        this._start(this.cmd);
        this.cp.once('close', code => {
            this._closed.resolve(code);
            this._exitCode.resolve(code);
        });

        this.cp.once('exit', code => this._exitCode.resolve(code));

        this.exitCode.then(code => {
            if (code > 0) {
                const msg = '`' + this.cmd + '` failed with exit code ' + code;
                console.error(msg);
                if (this.opts.rejectOnNonZeroExit) { return this._finished.reject(new Error(msg)); }
            }
            this._finished.resolve();
        });
    }

    private autoPrefix (line: string) {
        return this.opts.prefixer ? this.opts.prefixer(this.opts.path, this.pkgName, line) : line;
    }

    private _start (cmd: string) {
        let sh: string;
        let args: string[];

    // cross platform compatibility
        if (process.platform === 'win32') {
            sh = 'cmd';
            args = ['/c', cmd];
        } else {
            [sh, ...args] = cmd.split(' ');
      //sh = 'bash'
      //shFlag = '-c'
        }

        const stdOutBuffer: string[] = [];
        const stdErrBuffer: string[] = [];

        this.cmd = cmd;
        this.cp = spawn(sh, args, {
            cwd:
        this.opts.path ||
        ((process.versions.node < '8.0.0' ? process.cwd : process.cwd()) as string),
            env: Object.assign(process.env, { FORCE_COLOR: process.stdout.isTTY }),
            stdio:
        this.opts.collectLogs || this.opts.prefixer != null || this.opts.doneCriteria
          ? 'pipe'
          : 'inherit'
        });

        if (this.cp.stdout) {
            this.cp.stdout.pipe(split()).on('data', (line: string) => {
                if (this.opts.collectLogs) { stdOutBuffer.push(line); } else { console.log(this.autoPrefix(line)); /* tslint:disable-line no-console */ }
                if (this.doneCriteria && this.doneCriteria.test(line)) { this._finished.resolve(); }
            });
        }
        if (this.cp.stderr) {
            this.cp.stderr.pipe(split()).on('data', (line: string) => {
                if (this.opts.collectLogs) { stdErrBuffer.push(line); } else { console.error(this.autoPrefix(line)); }
                if (this.doneCriteria && this.doneCriteria.test(line)) { this._finished.resolve(); }
            });
        }
        if (this.opts.collectLogs) {
            this.closed.then(() => {
                console.log(stdOutBuffer.map(line => this.autoPrefix(line)).join('\n')); // tslint:disable-line no-console
                console.error(stdErrBuffer.map(line => this.autoPrefix(line)).join('\n'));
            });
        }
    }
}

import { IPkgJson, Dict } from './workspace';
import { uniq } from 'lodash';

export interface IGraphOptions {
    bin: string;
    fastExit: boolean;
    collectLogs: boolean;
    addPrefix: boolean;
    mode: 'parallel' | 'serial' | 'stages';
    recursive: boolean;
    doneCriteria: string | undefined;
    workspacePath: string;
    include: string[];
    exclude: string[];
    excludeMissing: boolean;
    showReport: boolean;
    run: boolean;
}

enum ResultSpecialValues {
  Pending = 'PENDING',
  Excluded = 'EXCLUDED',
  MissingScript = 'MISSING_SCRIPT'
}
type Result = number | ResultSpecialValues;

export class RunGraph {
    private procmap = new Map<string, Promise<any>>();
    children: CmdProcess[];
    finishedAll!: Promise<CmdProcess[]>;
    private jsonMap = new Map<string, IPkgJson>();
    private runList = new Set<string>();
    private resultMap = new Map<string, Result>();
    private throat: PromiseFnRunner = passThrough;
    prefixer = new Prefixer(this.opts.workspacePath).prefixer;

    constructor (
    public pkgJsons: IPkgJson[],
    public opts: IGraphOptions,
    public pkgPaths: Dict<string>
  ) {
        this.checkResultsAndReport = this.checkResultsAndReport.bind(this);
        this.closeAll = this.closeAll.bind(this);

        pkgJsons.forEach(j => this.jsonMap.set(j.name, j));
        this.children = [];
        if (this.opts.mode === 'serial') { this.throat = mkThroat(1); }
        if (this.opts.mode === 'stages') { this.throat = mkThroat(16); } // max 16 proc

        process.on('SIGINT', this.closeAll); // close all children on ctrl+c
    }

    private closeAll = () => {
        console.log('Stopping', this.children.length, 'active children'); // tslint:disable-line no-console
        this.children.forEach(ch => {
            ch.cp.removeAllListeners('close');
            ch.cp.removeAllListeners('exit');
            ch.cp.kill('SIGINT');
        });
    }

    private lookupOrRun (cmd: string, pkg: string): Promise<void> {
        let proc = this.procmap.get(pkg);
        if (proc == null) {
            proc = Promise.resolve().then(() => this.runOne(cmd, pkg));
            this.procmap.set(pkg, proc);
        }
        return proc;
    }

    private allDeps (pkg: IPkgJson) {
        const findMyDeps = uniq(
      Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}))
    ).filter(d => this.jsonMap.has(d) && (this.opts.recursive || this.runList.has(d)));
        return findMyDeps;
    }

    detectCycles () {
        const topLevelPkgs: { [name: string]: any } = {};
        for (const key of this.jsonMap.keys()) {
            topLevelPkgs[key] = '*';
        }
        const top = { name: '$', dependencies: topLevelPkgs };
        const self = this;
        function deepCycle (json: IPkgJson, pathLookup: string[]): string[] {
            const newPathLookup = pathLookup.concat([json.name]);
            const index = pathLookup.indexOf(json.name);
            if (index >= 0) {
                return newPathLookup.slice(index);
            }
            const currentDeps = Object.keys(json.dependencies || {}).concat(
        Object.keys(json.devDependencies || {})
      );
            for (const name of currentDeps) {
                const d = self.jsonMap.get(name);
                if (!d) { continue; }
                const result = deepCycle(d, newPathLookup);
                if (result.length) { return result; }
            }
            return [];
        }
        const res = deepCycle(top, []);
        return res;
    }

    private makeCmd (cmd: string, _pkg: string) {
        return `${this.opts.bin}${this.opts.run ? ' run' : ''} ${cmd}`;
    }

    private matchPackage (includeOrExcludeList, packageName) {
        // Loop trough each package specified in the include argument
        let match = false;
        includeOrExcludeList.forEach(includedOrExcludedPackage => {
            const regex = new RegExp(`^${includedOrExcludedPackage.replace('*', '.*')}$`); // Create a regex out if the included package to allow wildcards
            // If the included package matches the provided package name we have match.
            // Example match
            // include: ['web-app-*']
            // packageName: 'web-app-prime'
            if (regex.test(packageName)) {
                match = true;
            }
        });

        return match;
    }

    private packageIncluded (packageName) {
        return this.matchPackage(this.opts.include, packageName);
    }

    private packageExcluded (packageName) {
        return this.matchPackage(this.opts.exclude, packageName);
    }

    private runOne (cmd: string, pkg: string): Promise<void> {
        const p = this.jsonMap.get(pkg);
        if (p == null) { throw new Error('Unknown package: ' + pkg); }
        const myDeps = Promise.all(this.allDeps(p).map(d => this.lookupOrRun(cmd, d)));

        return myDeps.then(() => {
            this.resultMap.set(pkg, ResultSpecialValues.Pending);

            // Include and exclude are mutually exclusive
            if (this.opts.include.length > 0) {
                // If packages is not included we add it to exclude list
                if (!this.packageIncluded(pkg)) {
                    console.log(chalk.bold(pkg), 'in exclude list, skipping'); // tslint:disable-line no-console
                    this.resultMap.set(pkg, ResultSpecialValues.Excluded);
                    return Promise.resolve();
                }
            } else if (this.opts.exclude.length > 0) {
                if (this.packageExcluded(pkg)) {
                    console.log(chalk.bold(pkg), 'in exclude list, skipping'); // tslint:disable-line no-console
                    this.resultMap.set(pkg, ResultSpecialValues.Excluded);
                    return Promise.resolve();
                }
            }
            if (this.opts.excludeMissing && (!p || !p.scripts || !p.scripts[cmd])) {
                console.log(chalk.bold(pkg), 'has no ', cmd, 'script, skipping missing'); // tslint:disable-line no-console
                this.resultMap.set(pkg, ResultSpecialValues.MissingScript);
                return Promise.resolve();
            }
            const cmdLine = this.makeCmd(cmd, pkg);
            const child = new CmdProcess(cmdLine, pkg, {
                rejectOnNonZeroExit: this.opts.fastExit,
                collectLogs: this.opts.collectLogs,
                prefixer: this.opts.addPrefix ? this.prefixer : undefined,
                doneCriteria: this.opts.doneCriteria,
                path: this.pkgPaths[pkg]
            });
            child.exitCode.then(code => this.resultMap.set(pkg, code));
            this.children.push(child);

            let finished = this.throat(() => {
                child.start();
                return child.finished;
            });

            if (this.opts.mode === 'parallel') { finished = Promise.resolve(); }
            return finished;
        });
    }

    private checkResultsAndReport (cmd: string, pkgs: string[]) {
        const pkgsInError: string[] = [];
        const pkgsSuccessful: string[] = [];
        const pkgsPending: string[] = [];
        const pkgsSkipped: string[] = [];
        const pkgsMissingScript: string[] = [];

        this.resultMap.forEach((result, pkg) => {
            switch (result) {
            case ResultSpecialValues.Excluded:
                pkgsSkipped.push(pkg);
                break;

            case ResultSpecialValues.MissingScript:
                pkgsMissingScript.push(pkg);
                break;

            case ResultSpecialValues.Pending:
                pkgsPending.push(pkg);
                break;

            case 0:
                pkgsSuccessful.push(pkg);
                break;

            default:
                pkgsInError.push(pkg);
                break;
            }
        });

        if (this.opts.showReport) {
            const formatPkgs = (pgks: string[]): string => pgks.join(', ');
            const pkgsNotStarted = pkgs.filter(pkg => !this.resultMap.has(pkg));

            console.log(chalk.bold('\nReport:')); // tslint:disable-line no-console

            if (pkgsInError.length) {
                console.log(// tslint:disable-line no-console
          chalk.red(
            `  ${pkgsInError.length} packages finished \`${cmd}\` with error: ${formatPkgs(
              pkgsInError
            )}`
          )
        );
            }
            if (pkgsSuccessful.length) {
                console.log(// tslint:disable-line no-console
          chalk.green(
            `  ${pkgsSuccessful.length} packages finished \`${cmd}\` successfully: ${formatPkgs(
              pkgsSuccessful
            )}`
          )
        );
            }
            if (pkgsPending.length) {
                console.log(// tslint:disable-line no-console
          chalk.white(
            `  ${pkgsPending.length} packages have been cancelled running \`${cmd}\`: ${formatPkgs(
              pkgsPending
            )}`
          )
        );
            }
            if (pkgsNotStarted.length) {
                console.log(// tslint:disable-line no-console
          chalk.white(
            `  ${pkgsNotStarted.length} packages have not started running \`${cmd}\`: ${formatPkgs(
              pkgsNotStarted
            )}`
          )
        );
            }
            if (pkgsMissingScript.length) {
                console.log(// tslint:disable-line no-console
          chalk.gray(
            `  ${pkgsMissingScript.length} packages are missing script \`${cmd}\`: ${formatPkgs(
              pkgsMissingScript
            )}`
          )
        );
            }
            if (pkgsSkipped.length) {
                console.log(// tslint:disable-line no-console
          chalk.gray(
            `  ${pkgsSkipped.length} packages have been skipped: ${formatPkgs(pkgsSkipped)}`
          )
        );
            }

            console.log(); // tslint:disable-line no-console
        }

        return pkgsInError.length > 0;
    }

    run (cmd: string, pkgs: string[] = this.pkgJsons.map(p => p.name)) {
        this.runList = new Set(pkgs);
        return Promise.all(pkgs.map(pkg => this.lookupOrRun(cmd, pkg)))
      .then(() => Promise.all(this.children.map(c => c.exitError)))
      .catch(_err => this.opts.fastExit && this.closeAll())
      .then(() => this.checkResultsAndReport(cmd, pkgs));
    }
}
