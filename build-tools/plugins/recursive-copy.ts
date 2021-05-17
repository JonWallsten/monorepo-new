import rc from 'recursive-copy';
import { Stats } from 'fs';
import { Stream } from 'stream';

type RcOptions = {
    /**
	 * Whether to overwrite destination files.
	 */
    overwrite?: boolean;
    /**
      * Whether to expand symbolic links.
      */
    expand?: boolean;
    /**
      * Whether to copy files beginning with a `.`
      */
    dot?: boolean;
    /**
      * Whether to copy OS junk files (e.g. `.DS_Store`, `Thumbs.db`).
      */
    junk?: boolean;
    /**
      * Filter function / regular expression / glob that determines which files to copy (uses maximatch).
      */
    filter?: string | string[] | RegExp | ((path: string) => boolean);
    /**
      * Function that maps source paths to destination paths.
      */
    rename?: (path: string) => string;
    /**
      * Function that returns a transform stream used to modify file contents.
      */
    transform?: (src: string, dest: string, stats: Stats) => Stream;
    /**
      * Whether to return an array of copy results.
      *
      * Defaults to true.
      */
    results?: boolean;
    /**
      * Maximum number of simultaneous copy operations.
      *
      * Defaults to 255.
      */
    concurrency?: number;
    /**
      * Whether to log debug information.
      */
    debug?: boolean;
};

export type PluginOptions = {
    src: string;
    dest: string;
    filter?: string | string[] | RegExp | ((path: string) => boolean);
    rename?: {
        from: RegExp | string;
        to: string;
    };
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

                rc(opt.src, opt.dest, rcOptions);
            });
        });
    }
}
