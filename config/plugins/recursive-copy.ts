import rc from 'recursive-copy';
import { Stats } from 'fs';

type RcOptions = {
    overwrite?: boolean, // Whether to overwrite destination files
    expand?: boolean, // Whether to expand symbolic links
    dot?: boolean, // Whether to copy files beginning with a .
    junk?: boolean, // Whether to copy OS junk files (e.g. .DS_Store, Thumbs.db)
    filter?: Function | RegExp | string | string[], //  string, array	No	null	Filter function / regular expression / glob that determines which files to copy (uses maximatch)
    rename?: (filePath: string) => string, // Function that maps source paths to destination paths
    transform?: (src: string, dest: string, stats: Stats) => void, // Function that returns a transform stream used to modify file contents
    results?: boolean, // Whether to return an array of copy results
    concurrency?: number, // Maximum number of simultaneous copy operations
    debug?: boolean // Whether to log debug information
};

export type PluginOptions = {
    src: string,
    dest: string,
    filter?: Function | RegExp | string | string[],
    rename?: {
        from: RegExp | string,
        to: string
    }
};

export class RecursiveCopyPlugin {
    private name: string = 'recursive-copy';
    private options: PluginOptions[];

    constructor (options: PluginOptions[]) {
        this.options = options;
    }

    apply (compiler) {
        compiler.hooks.afterEmit.tap(this.name, (_compilation) => {
            const rcOptions: RcOptions = {
                overwrite: true
            };

            this.options.forEach((opt: PluginOptions) => {
                if (opt.filter) {
                    rcOptions.filter = opt.filter;
                }

                if (opt.rename) {
                    rcOptions.rename = (path) => {
                        if (opt.rename && opt.rename.from !== undefined && opt.rename.to !== undefined) {
                            return path.replace(opt.rename.from, opt.rename.to);
                        }
                        return path;
                    };
                }

                rc(opt.src, opt.dest, rcOptions, (error, _results) => {
                    if (error) {
                        console.error('[webpack: plugin/recursive-copy]', error); // tslint:disable-line no-console
                    }
                });
            });
        });
    }
}
