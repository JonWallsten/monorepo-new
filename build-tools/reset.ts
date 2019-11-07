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
    require(packageName); // tslint:disable-line no-var-requires
} catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
        console.error(logPrefix + 'You need rimraf ro run this script. Rimraf can be installed with "npm i rimraf".\n');
    } else {
        console.error(logPrefix + 'Cannot require rimraf.', err);
    }

    process.exit(1);
}

// Proceed with deleting folders
const rimraf = require(packageName); // tslint:disable-line no-var-requires
rimraf(`{${folders.join(',')}}`, (err) => {
    if (err) {
        process.exit(1);
        console.error(logPrefix + 'While cleaning folders. ', err);
        return;
    }
    process.exit(0);
});
