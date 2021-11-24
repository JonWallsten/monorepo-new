import { Configuration, DefinePlugin } from 'webpack';
import * as helpers from './helpers';

/**
 * Webpack Plugins
 */
import { projectRootPath } from '../../../build-tools/helpers';

export interface IWebpackOptions {
    env?: string;
}

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
export default (options: IWebpackOptions) => {
    const isProd: boolean = options.env === 'production';

    const config: Configuration = {
        /**
         * The entry point for the bundle
         * Our Angular.js app
         *
         * See: http://webpack.github.io/docs/configuration.html#entry
         */
        entry: {
            'index': './src/index.ts'
        },
        output: {
            path: helpers.rootPath('dist'),
            filename: '[name].mjs',
            library: {
                type: 'module'
            },
            environment: {
                module: true,
                dynamicImport: true
            },
            globalObject: 'this'
        },
        experiments: {
            // futureDefaults: true, // Generates lots of warnings, only use for debugging
            backCompat: false,
            cacheUnaffected: true,
            outputModule: true
        },
        /**
         * Options affecting the resolving of modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#resolve
         */
        resolve: {
            /**
             * An array of extensions that should be used to resolve modules.
             *
             * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
             */
            extensions: ['.ts', '.js', '.mjs'],

            /**
             * An array of directory names to be resolved to the current directory
             */
            modules: [
                helpers.rootPath('src'),
                helpers.rootPath('node_modules'),
                projectRootPath('node_modules')
            ],
            fallback: {
                'process': require.resolve('process/browser')
            }
        },
        // When using external packages
        externals: /^(axios)$/i,

        externalsType: "module",

        /**
         * Add additional plugins to the compiler.
         *
         * See: http://webpack.github.io/docs/configuration.html#plugins
         */
        plugins: [
            /**
             * Plugin: DefinePlugin
             * Description: Define free variables.
             * Useful for having development builds with debug logging or adding global constants.
             *
             * Environment helpers
             *
             * See: https://webpack.js.org/plugins/define-plugin/#root
             */
            // NOTE: when adding more properties make sure you include them in typings/global.d.ts
            new DefinePlugin({
                IS_PROD: isProd,
                IS_DEV: !isProd
            }),
        ]
    };

    return config;
};
