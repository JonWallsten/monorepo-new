// tslint:disable no-console
/**
 * Check branch name for illegal format and/or characters.
 */

import * as process from 'process';
import { exec } from 'child_process';

exec('git rev-parse --abbrev-ref HEAD', (err, stdout, _stderr) => {
    if (err) {
        console.error(`Error: ${err}`);
        process.exit(1);
        return;
    }

    if (stdout.match(/^[^a-zA-Z0-9\_\-]$/)) {
        console.error('Branch name has illegal characters. Allowed is: a-zA-Z0-9-_');
        process.exit(1);
        return;
    }

    if (stdout.match(/^MMT/) && !stdout.match(/^MMT1-\d{4,5}[-_].*\n?/)) {
        console.error('Branch name has wrong pattern. Allowed is: MMT1-12345-my_branch-name_2');
        process.exit(1);
        return;
    }

    if (stdout === 'master') {
        console.error('You are not allowed to push to the master bransch');
        process.exit(1);
    }

    if (stdout.toLowerCase().indexOf('hotfix') !== -1 && !stdout.match(/^hotfix\/[a-zA-Z0-9\_\-]+\-\d\d\d\d\-\d\d\-\d\d(\n)?$/)) {
        console.error('A hotfix branch has to be named hotfix/my-issue-ÅÅÅÅ-MM-DD');
        process.exit(1);
    }

    process.exit(0);
    return;
});
