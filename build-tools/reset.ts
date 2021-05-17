const packageName = 'rimraf';
const logPrefix = '[npm run reset] ERROR:';
const folders = [
    'packages/*/.tmp',
    'packages/*/dist',
    'packages/*/build',
    'packages/*/node_modules',
    'node_modules'
];

// Make sure rimraf exists
try {
    require(packageName); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
} catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
        console.error(logPrefix + 'You need rimraf ro run this script. Rimraf can be installed with "npm i rimraf".\n');
    } else {
        console.error(logPrefix + 'Cannot require rimraf.', err);
    }

    process.exit(1);
}

// Proceed with deleting folders
const rimraf = require(packageName); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
rimraf(`{${folders.join(',')}}`, (err) => {
    if (err) {
        console.error(logPrefix + 'While cleaning folders. ', err);
        process.exit(1);
    }
    process.exit(0);
});
