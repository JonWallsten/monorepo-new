import { execSync, exec } from 'child_process';
import { relative, normalize, resolve } from 'path';
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};
let files: string[] = [];
const projectRoot = resolve(__dirname, '..');
const packageRoot = process.cwd();
const relativePath = relative(projectRoot, packageRoot);
// Match packages/[appname]/src|test|tests/**/*.js|ts
const matchPackageFiles = `^${escapeRegExp(relativePath)}[\\\\\\\/](?:src|tests?)[\\\\\\\/].*\.ts$`;

try {
    const buffer = execSync('git diff --name-only --cached --diff-filter=AM').toString();

    files = buffer.split(/\r?\n/)
        .filter(file => {
            const regExp = new RegExp(matchPackageFiles);
            return normalize(file.trim()).match(regExp);
        })
        .map(file => {
            return './' + relative(relativePath, normalize(file));
        });
} catch (error) {
    // Something went wrong. Exit process with error.
    console.error('[lint-stages-files] Error running command');
    process.exit(1);
}

if (files.length) {
    let filesCmdString = files.join(' ');
    // If we have a lot of files we don't test specific files but all the files
    if (filesCmdString.length > 4096) {
        filesCmdString = '';
    }

    exec('eslint --fix ' + filesCmdString, (error: any, stdout: string, stderr: string) => {
        // If error is found we print it and exit with error
        if (error) {
            console.error(stderr);
            console.error(stdout);
            process.exit(1);
        }
        // Lint went fine. Exit with no error
        process.exit(0);
    });
} else {
    // No files to lint, clean exit
    process.exit(0);
}
