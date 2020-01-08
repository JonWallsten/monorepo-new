import { Configuration, DefinePlugin } from 'webpack';
import * as helpers from './helpers';

/**
 * Webpack Plugins
 */
import { RecursiveCopyPlugin } from '../../../config/plugins/recursive-copy';
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
        output: {
            path: helpers.rootPath('dist'),
            filename: '[name].js',
            libraryTarget: 'umd',
            globalObject: 'this'
        },
        /**
         * The entry point for the bundle
         * Our Angular.js app
         *
         * See: http://webpack.github.io/docs/configuration.html#entry
         */
        entry: {
            'index': './src/index.ts'
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
            extensions: ['.ts', '.js'],

            /**
             * An array of directory names to be resolved to the current directory
             */
            modules: [
                helpers.rootPath('src'),
                helpers.rootPath('node_modules'),
                projectRootPath('node_modules')
            ]
        },

        externals: /^(moment-timezone|lodash|axios)$/i,

        // optimization: {
        //     occurrenceOrder: false,
        //     splitChunks: {
        //         cacheGroups: {
        //             vendor: {
        //                 test: /node_modules/,
        //                 chunks: 'initial',
        //                 name: 'vendor',
        //                 enforce: true
        //             }
        //         }
        //     }
        // },

        /**
         * Options affecting the normal modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#module
         */
        module: {

            rules: [
                /**
                 * Optimises lodash import to allow syntax "import { name } from 'lodash'" instead of
                 * import * as name from 'lodash/name'
                 *
                 */
                {
                    test: /\.ts$/,
                    loader: 'lodash-ts-imports-loader',
                    include: helpers.include,
                    enforce: 'pre'
                }
            ]

        },

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
             * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
             */
            // NOTE: when adding more properties make sure you include them in typings/global.d.ts
            new DefinePlugin({
                IS_PROD: isProd,
                IS_DEV: !isProd
            }),

            // Copy all d.ts files from the src since Typescript compiler doesn't include these in the output
            new RecursiveCopyPlugin([{
                src: helpers.rootPath('./src'),
                dest: helpers.rootPath('./dist'),
                filter: ['**/*.d.ts']
            }])
        ],

        /**
         * Include polyfills or mocks for various node stuff
         * Description: Node configuration
         *
         * See: https://webpack.github.io/docs/configuration.html#node
         */
        node: {
            global: true,
            crypto: 'empty',
            process: true,
            module: false,
            clearImmediate: false,
            setImmediate: false
        }
    };

    return config;
};
