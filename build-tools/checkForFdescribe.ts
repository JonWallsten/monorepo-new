import { exec } from 'child_process';
import { readFile } from 'fs';

let files: string[] = [];
let processed: number = 0;
let failed: boolean;

function fileProcessed (result: boolean) {
    processed++;
    failed = result || failed;

    // We're done
    if (processed === files.length) {
        process.exit(failed ? 1 : 0);
    }
}

// Get all changed files in the current repo
exec('git diff --name-only --cached', (error, stdout, stderr) => {
    // Something went wrong.
    if (error !== null) {
        console.error(`[checkForFdescribe] ERROR: git-diff failed: ${stderr}`);
        process.exit(1);
        return;
    }

    // Get all e2e files
    files = stdout.split('\n').filter(file => file.indexOf('e2e-spec.ts') !== -1);

    // Check if any of the files contains the forbidden fdescribe
    files.forEach((file) => {
        readFile(file, 'utf8', (_err: NodeJS.ErrnoException, data: string) => {
            let result = false;

            if (_err) {
                console.error(_err.message);
                return;
            }

            if (data.indexOf('fdescribe') !== -1) {
                console.error('[checkForFdescribe] ERROR: Unexpected "fdescribe" in', file);
                result = true;
            }

            fileProcessed(result);
        });
    });
});
