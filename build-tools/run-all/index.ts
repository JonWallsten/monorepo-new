#!/usr/bin/env node

/**
 * Tool for running command in npm packages.
 */

import * as fs from 'fs';
import * as yargs from 'yargs';
import * as _ from 'lodash';
import { red } from 'chalk';

import { RunGraph } from './parallelshell';
import { listPkgs } from './workspace';

const argv = yargs
    .wrap(yargs.terminalWidth() - 1)
    .updateStrings({
        'Options:': 'Other Options:'
    })
    .usage('$0 <command> [<package> [package] ...] [options]')
    .array('package')
// Note: these examples are chained here as they do not show up otherwise
// when the required positional <command> is not specified
    .example('$0 clean', 'Runs "npm run clean" in each of the packages in parallel')
    .example(
        '$0 build app -r --stages',
        'Runs "npm run build" in app and all of its dependencies in stages, moving up the dependency tree'
    )
    .example(
        '$0 watch --stages --done-criteria="Finished"',
        'Runs "npm run watch" in each of the packages in stages, continuing when the process outputs "Finished"'
    )
    .example('$0 test --exclude-missing', 'Runs "npm run test" in all packages that have such a script')

    .group(['parallel', 'stages', 'serial'], 'Mode (choose one):')
    .options({
        parallel: {
            describe: 'Fully parallel mode (default)',
            type: 'boolean'
        },
        stages: {
            describe: 'Run in stages: start with packages that have no deps',
            type: 'boolean'
        },
        serial: {
            describe: 'Same as "stages" but with no parallelism at the stage level',
            type: 'boolean'
        }
    })
    .group('recursive', 'Individual Package Options:')
    .options({
        recursive: {
            alias: 'r',
            describe: 'Execute the same script on all of its dependencies, too',
            type: 'boolean'
        }
    })
    .group(
        [
            'fast-exit',
            'collect-logs',
            'no-prefix',
            'bin',
            'done-criteria',
            'include',
            'exclude',
            'exclude-missing',
            'report',
            'no-run'
        ],
        'Misc Options:'
    )
    .options({
        'fast-exit': {
            describe: 'If at least one script exits with code > 0, abort',
            type: 'boolean'
        },
        'collect-logs': {
            describe: 'Collect per-package output and print it at the end of each script',
            type: 'boolean'
        },
        'no-prefix': {
            describe: "Don't prefix output",
            type: 'boolean'
        },
        bin: {
            default: 'npm',
            describe: 'The program to pass the command to',
            type: 'string'
        },
        'done-criteria': {
            describe: 'Consider a process "done" when an output line matches the specified RegExp',
            type: 'string'
        },
        include: {
            type: 'string',
            array: true,
            describe: 'Only run the command for these packages'
        },
        exclude: {
            type: 'string',
            array: true,
            describe: 'Skip running the command for that package'
        },
        'exclude-missing': {
            describe: 'Skip packages which lack the specified command in the scripts section of their package.json',
            type: 'boolean'
        },
        report: {
            describe: 'Show an execution report once the command has finished in each package',
            type: 'boolean'
        },
        'no-run': {
            describe: "Don't add run to the command",
            type: 'boolean'
        },
        prod: {
            describe: "Specify that we're running in prod env",
            type: 'boolean'
        },
        dev: {
            describe: "Specify that we're running in dev env",
            type: 'boolean'
        }
    }).parseSync();

const bin = argv.bin as string || 'npm';

let mode: string;
if (argv.stages) {
    mode = 'stages';
} else if (argv.serial) {
    mode = 'serial';
} else {
    mode = 'parallel';
}

// should we run the command on all the dependencies, too?
const recursive: boolean = !!argv.recursive || !!argv.r || false;
const fastExit: boolean = !!argv.fastExit || false;
const run: boolean = argv.run !== undefined ? !!argv.run : true;
const collectLogs: boolean = !!argv.collectLogs || false;
const addPrefix: boolean = !!argv.prefix === undefined ? false : true;
const doneCriteria: string = argv.doneCriteria as string;
const exclude: string[] =
  (argv.exclude && (Array.isArray(argv.exclude) ? argv.exclude : [argv.exclude])) || [];
const include: string[] =
  (argv.include && (Array.isArray(argv.include) ? argv.include : [argv.include])) || [];

const excludeMissing = !!argv.excludeMissing || false;

const showReport: boolean = !!argv.report || false;

const cmd = argv._[0] as string;

if (!cmd) {
    yargs.showHelp();
    process.exit(1);
}

const pkgJsonPackages = JSON.parse(fs.readFileSync('./package.json', 'utf8')).packages;

const packagesGlobs = pkgJsonPackages || ['packages/*'];

const pkgs = listPkgs('./', packagesGlobs);
const pkgPaths = _.mapValues(_.keyBy(pkgs, p => p.json.name), v => v.path);

const pkgJsons = _.map(pkgs, pkg => pkg.json);

const runner = new RunGraph(
    pkgJsons,
    {
        bin,
        fastExit,
        collectLogs,
        addPrefix,
        mode: mode as any,
        recursive,
        doneCriteria,
        include,
        exclude,
        excludeMissing,
        showReport,
        workspacePath: process.cwd(),
        run,
        dev: argv.dev !== undefined,
        prod: argv.prod !== undefined
    },
    pkgPaths
);

const cycle = runner.detectCycles();
if (cycle.length > 0) {
    console.error('\nERROR: Dependency cycle detected:\n', ' ', cycle.join(' <- '), '\n');
    process.exit(1);
}

const runlist = argv._.slice(1) as string[];
runner.run(cmd, runlist.length > 0 ? runlist : undefined).then(hadError => {
    if (hadError && fastExit) {
        console.error(red('Aborted execution due to previous error'));
    }
    process.exit(hadError ? 1 : 0);
});
