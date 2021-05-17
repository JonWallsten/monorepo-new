import { exec } from 'child_process';

const isWindows = process.platform === 'win32';

const command = isWindows ? 'taskkill /f /im node.exe' : 'killall node';

// Run any postinstall scripts in package.json
exec(command, (error, stdout, stderr) => {
    console.log(`${stdout}`); // eslint-disable-line no-console
    console.log(`${stderr}`); // eslint-disable-line no-console
    if (error !== null) {
        console.log(`ERROR: Could not run postinstall script: ${stderr}`); // eslint-disable-line no-console
        process.exit(1);
        return;
    }
    process.exit(0);
});
