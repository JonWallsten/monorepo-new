import { readFileSync, writeFileSync, existsSync } from 'fs';

export type SingleLinePatch = {
    type: 'single';
    /** Single line source code to look for */
    source: string;
    /** Replacement line of source code */
    replacement: string;
    /** Prepend line before the source line instead of replacing it */
    prepend?: boolean;
    /** Append line before the source line instead of replacing it */
    append?: boolean;
    /** Custom identifier if we need to patch multiple places in the same file */
    identifier?: string;
};
type MultiLinePatchLineDetection = {
    lineNumber: number;
    source: string;
};

type MultiLineBasePatch = {
    /** Since source code changes you can add a detection line to check if the code seems to be intact  */
    lineDetection?: MultiLinePatchLineDetection;
    /** Replacement lines of source code */
    replacement: string;
    /** Custom identifier if we need to patch multiple places in the same file */
    identifier?: string;
};
export type MultiLineNumbersPatch = MultiLineBasePatch & {
    type: 'multiLine';
    /** Starting line number (1 is first) */
    lineStart: number;
    /** Ending line number */
    lineEnd: number;

};
export type MultiLineStringPatch = MultiLineBasePatch & {
    type: 'multiString';
    /** Starting line of code */
    sourceStart: string;
    /** Ending line of code */
    sourceEnd?: string;
    /** Use number of lines instead of sourceEnd */
    numberOfLines?: number;
};
type MultiLinePatch = MultiLineStringPatch | MultiLineNumbersPatch;

export type RegExpPatch = {
    type: 'regexp';
    /** Single line source code to look for */
    source: string | RegExp;
    /** Replacement line of source code */
    replacement: string | string[];
    /** Replace multiple instances */
    multiline?: boolean;
    /** Append the new line instead of replacing the old one */
    append?: boolean;
    /** RegExp flags */
    flags?: string;
    identifier?: string;
};

type Patch = SingleLinePatch | MultiLinePatch | RegExpPatch;

/**
 * Monkey patch files
 *
 * @export
 * @example
 * - Multi line replacement
 * const replacement = `function newFunction () {
 *       console.error(firstLine);
 *       console.error(lineToFind);
 *  };
 *  `;
 * MonkeyPatch.patch('./module.js', {
 *   type: 'multi',
 *   lineStart: 4,
 *   lineEnd: 7,
 *   replacement: replacement
 * });
 *
 * - Place a line of code before provided line and leave source line intact
 * MonkeyPatch.patch('./module.js', {
 *   type: 'single',
 *   source: 'const firstLine = \'\';',
 *   replacement: 'const beforeFirstLine = \'\';',
 *   before: true
 * });
 * - Place a line of code after provided line and leave source line intact
 * MonkeyPatch.patch('./module.js', {
 *   type: 'single',
 *   source: 'const firstLine = \'\';',
 *   replacement: 'const afterFirstLine = \'\';',
 *   after: true
 * });
 * - Replace source line
 * MonkeyPatch.patch('./module.js', {
 *   type: 'single',
 *   source: 'const firstLine = \'\';',
 *   replacement: 'const newFirstLine = \'\';'
 * });
 *
 * @class MonkeyPatch
 */
export class MonkeyPatch {
    private static patchIdentifierPrefix = '//-';
    private static defaultPatchIdentifier = 'patched';

    static patch (filename: string, patch: Patch) {
        // No file, nothing to patch
        if (!existsSync(filename)) {
            console.error('[MonkeyPatch] Unable to find file to patch');
            process.exit(1);
        }
        const fileContents = this.getFileContents(filename);
        const patchIdentifier = this.patchIdentifierPrefix + (patch.identifier || this.defaultPatchIdentifier);

        if (this.hasBeenPatched(fileContents, patchIdentifier)) {
            console.info('[MonkeyPatch] ' + filename + ' has already been patched'); // eslint-disable-line no-console
            return;
        }

        // Single line patch
        if (patch.type === 'single') {
            let replace = true;
            let sourceLineNumber = this.findLineNumberByCode(fileContents, patch.source);
            if (!sourceLineNumber) {
                console.error('[MonkeyPatch] Could not find source code. Please check ' + filename + ' and update the patch accordingly');
                process.exit(1);
            }
            // If we place it before or after we should not replace the source line
            if (patch.prepend) {
                replace = false;
            } else if (patch.append) {
                replace = false;
                // When placing after we need to increase one line
                sourceLineNumber += 1;
            }
            // Add the patched line after the source code line
            // Note: We need to subtract one because of 0-index
            fileContents.splice(sourceLineNumber - 1, replace ? 1 : 0, patch.replacement + patchIdentifier);
            // Write the new content to the file by joining all lines into a single string again.
            writeFileSync(filename, fileContents.join('\n'));
            // Log
            console.info('[MonkeyPatch] ' + filename + ' has been patched');
        } else if (patch.type === 'multiLine' || patch.type === 'multiString') {
            if (patch.lineDetection) {
                const sourceLineNumber = this.findLineNumberByCode(fileContents, patch.lineDetection.source);
                if (sourceLineNumber !== patch.lineDetection.lineNumber) {
                    const errorMessage = !sourceLineNumber ? 'The source code is no longer found.' : 'The source code is now found on line ' + sourceLineNumber + ' instead of line ' + patch.lineDetection.lineNumber + '.';
                    console.error('[MonkeyPatch] Source code seems to have changed since patch was created. '+ errorMessage +' Please check ' + filename + ' and update the patch accordingly.');
                    process.exit(1);
                }
            }
            if (patch.type === 'multiLine') {
                // Add the patched line after the source code line
                // Note: We need to subtract one because of 0-index
                fileContents.splice(patch.lineStart - 1, patch.lineEnd - patch.lineStart + 1, patch.replacement + patchIdentifier);
                // Write the new content to the file by joining all lines into a single string again.
                writeFileSync(filename, fileContents.join('\n'));
            } else if (patch.type === 'multiString') {
                // Find the line number for the provided source code
                const sourceStartLineNumber = this.findLineNumberByCode(fileContents, patch.sourceStart);
                if (!sourceStartLineNumber) {
                    console.error('[MonkeyPatch] Source start line could not be found in the provided file. Maybe the file has been updated?');
                    process.exit(1);
                }
                // Use the numberOfLines if provided or use the sourceEnd to find the correct line
                let numberOfLines: number = patch.numberOfLines || 0;
                if (patch.sourceEnd) {
                    const sourceEndLineNumber = this.findLineNumberByCode(fileContents, patch.sourceEnd);
                    if (!sourceEndLineNumber) {
                        console.error('[MonkeyPatch] Source end line could not be found in the provided file. Maybe the file has been updated?');
                        process.exit(1);
                    }
                    numberOfLines = sourceEndLineNumber - sourceStartLineNumber + 1;
                }
                // Make sure numberOfLines has been provided
                if (isNaN(numberOfLines) || numberOfLines <= 0) {
                    console.error('[MonkeyPatch] When using multiString patch you need to either provide a number of lines to replace or a line of source code to find.');
                    process.exit(1);
                }
                // We need to subtract one because of 0-index
                fileContents.splice(sourceStartLineNumber - 1, numberOfLines, patch.replacement + patchIdentifier);
                // Write the new content to the file by joining all lines into a single string again.
                writeFileSync(filename, fileContents.join('\n'));
            }
            // Log
            console.info('[MonkeyPatch] ' + filename + ' has been patched');
        } else if (patch.type === 'regexp') {
            const method = patch.multiline ? 'forEach' : 'some';
            const replacements = Array.isArray(patch.replacement) ? patch.replacement : [patch.replacement];
            const newFileContents = [];
            fileContents[method]((line: string) => {
                const sourceRegExp = new RegExp(patch.source, patch.flags || '');
                if (line.match(sourceRegExp)) {
                    // Keep the old line as well
                    if (patch.append) {
                        newFileContents.push(line);
                    }
                    replacements.forEach((replacement) => {
                        const replacedLine = line.replace(sourceRegExp, replacement);
                        // Push the modified line
                        newFileContents.push(replacedLine);
                    });
                } else {
                    newFileContents.push(line);
                }
            });
            // Push patchIndentifier so we know file has been patched
            newFileContents.push(patchIdentifier);

            // Add the patched line after the source code line
            // Write the new content to the file by joining all lines into a single string again.
            writeFileSync(filename, newFileContents.join('\n'));
        }
    }

    /**
     * Get content of a file
     *
     * @private
     * @static
     * @param {string} fileName
     * @returns {string[]}
     * @memberof MonkeyPatch
     */
    private static getFileContents (fileName: string): string[] {
        return readFileSync(fileName).toString().split('\n');
    }

    /**
     * Check if code has been patched already
     *
     * @private
     * @static
     * @param {string[]} content
     * @returns
     * @memberof MonkeyPatch
     */
    private static hasBeenPatched (content: string[], patchIdentifier: string) {
        return content.find(line => line.indexOf(patchIdentifier) !== -1);

    }

    /**
     * Find line number for the provided string
     *
     * @private
     * @static
     * @param {string[]} content
     * @param {string} sourceLine
     * @returns
     * @memberof MonkeyPatch
     */
    private static findLineNumberByCode (content: string[], sourceLine: string) {
        return content.findIndex(line => line.indexOf(sourceLine) !== -1) + 1;
    }
}
