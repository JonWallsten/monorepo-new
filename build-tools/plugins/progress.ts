import { ProgressPlugin } from 'webpack';
import { clearLine, cursorTo } from 'readline';

/**
 * A simple webpack progress plugin to improve performance, but still get some progress reports
 */
export const oasProgressPlugin = (appName: string) => new ProgressPlugin((percentage, _message, ..._args) => {
    if (percentage === 0) {
        process.stdout.write(`[${timestamp()}] \u001b[1mBuilding ${appName}\u001b[0m\n`);
    } else if (
        percentage > 0 &&
        percentage < 1 &&
        (percentage * 100) % 1 === 0
        && Boolean(false) // Disable this functionality
    ) {
        // This will only work when we´re only running one single build
        printProgressPercent(percentage);
    } else if (percentage === 1) {
        process.stdout.write(`\n[${timestamp()}] \u001b[1mFinished ${appName}\u001b[0m\n`);
    }
});

// Log progress percent on the same line
function printProgressPercent (percentage: number): void {
    // Clear the entire line
    clearLine(process.stdout, 0);
    // Move cursor to 0
    cursorTo(process.stdout, 0);
    // Print new percentage
    process.stdout.write(`[${timestamp()}] ${Math.round(100 * percentage)}%`);
}

function timestamp (): string {
    return new Date().toISOString().
        replace(/T/, ' '). // replace T with a space
        replace(/\..+/, ''); // delete the dot and everything after
}
