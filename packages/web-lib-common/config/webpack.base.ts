import { Configuration, DefinePlugin } from 'webpack';
import * as helpers from './helpers';

/**
 * Webpack Plugins
 */
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
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
        // When using external packages
        externals: /^(@oas\/web-lib-core)$/i,
        externalsType: "module",

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
            extensions: ['.ts', '.js', '.mjs', '.json'],

            /**
             * An array of directory names to be resolved to the current directory
             */
            modules: [
                helpers.rootPath('src'),
                helpers.rootPath('node_modules'),
                projectRootPath('node_modules')
            ]
        },

        /**
         * Options affecting the normal modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#module
         */
        module: {

            rules: [
                /**
                 * To string and css loader support for *.css files (from Angular components)
                 * Returns file content as string
                 *
                 */
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
                    include: helpers.includeStyles
                },

                /**
                 * To string and sass loader support for *.scss files (from Angular components)
                 * Returns compiled css content as string
                 *
                 */
                {
                    test: /\.less$/,
                    use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'less-loader'],
                    include: helpers.includeStyles
                },

                /**
                 * Raw loader support for *.html
                 * Returns file content as string
                 *
                 * See: https://github.com/webpack/raw-loader
                 */
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                    options: {
                        minimize: false,
                        esModule: false
                    },
                    include: helpers.include
                },

                /**
                 * File loader for supporting images, for example, in CSS files.
                 */
                 {
                    test: /\.(jpg|png|gif)$/,
                    type: "asset/resource",
                    include: helpers.include
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
             * See: https://webpack.js.org/plugins/define-plugin/#root
             */
            // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
            new DefinePlugin({
                IS_PROD: isProd,
                IS_DEV: !isProd
            }),

            new MiniCssExtractPlugin({
                filename: '[name].css'
            }),
        ]
    };

    return config;
};
