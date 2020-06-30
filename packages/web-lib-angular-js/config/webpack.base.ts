import { Configuration, DefinePlugin } from 'webpack';
import * as helpers from './helpers';

/**
 * Webpack Plugins
 */
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
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
    const useSourceMap = !isProd;

    const config: Configuration = {
        output: {
            path: helpers.rootPath('dist'),
            filename: '[name].js',
            libraryTarget: 'umd'
        },
        /**
         * The entry point for the bundle
         * Our Angular.js app
         *
         * See: http://webpack.github.io/docs/configuration.html#entry
         */
        entry: {
            'index': './src/index.ts',
            'legacy': './src/legacy.js'
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
            extensions: ['.ts', '.js', '.json', '.css', '.less'],

            /**
             * An array of directory names to be resolved to the current directory
             */
            modules: [
                helpers.rootPath('src'),
                helpers.rootPath('node_modules'),
                projectRootPath('node_modules')
            ]
        },

        externals: /^(angular|angular-diff-match-patch|angular-messages|angular-mocks|angular-sanitize|angular-translate|angular-ui-ace|angular-ui-bootstrap|angular-ui-router|ng-file-upload|ui-select|moment|moment-timezone|@oas\/web-lib-core|@oas\/web-lib-common)$/i,

        // optimization: {
        //     //runtimeChunk: true,
        //     occurrenceOrder: false,
        //     splitChunks: {
        //         cacheGroups: {
        //             vendors: {
        //                 test: /[\\/]node_modules[\\/]/,
        //                 name: 'vendor',
        //                 chunks: 'all'
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
                 */
                {
                    test: /\.ts$/,
                    loader: 'lodash-ts-imports-loader',
                    include: helpers.includeTS,
                    enforce: 'pre'
                },

                /**
                 * To string and css loader support for *.css files (from Angular components)
                 * Returns file content as string
                 *
                 */
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, `css-loader?sourceMap=${useSourceMap}`, `postcss-loader?sourceMap=${useSourceMap}`],
                    include: helpers.includeStyles
                },

                /**
                 * To string and sass loader support for *.scss files (from Angular components)
                 * Returns compiled css content as string
                 *
                 */
                {
                    test: /\.less$/,
                    use: [MiniCssExtractPlugin.loader, `css-loader?sourceMap=${useSourceMap}`, `postcss-loader?sourceMap=${useSourceMap}`, `less-loader?sourceMap=${useSourceMap}`],
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
                    use: 'html-loader',
                    include: helpers.include
                },

                /**
                 * File loader for supporting images, for example, in CSS files.
                 */
                {
                    test: /\.(jpg|png|gif)$/,
                    use: 'file-loader',
                    include: helpers.include
                },

                /**
                 * File loader for supporting fonts, for example, in CSS files.
                 */
                {
                    test: /\.(eot|woff2?|svg|ttf)([\?]?.*)$/,
                    use: 'file-loader',
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
             * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
             */
            // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
            new DefinePlugin({
                IS_PROD: isProd,
                IS_DEV: !isProd
            }),

            new MiniCssExtractPlugin({
                filename: '[name].css'
            }),

            /**
             * Plugin: CopyWebpackPlugin
             * Description: Copy files and directories in webpack.
             *
             * Copies project static assets.
             *
             * See: https://www.npmjs.com/package/copy-webpack-plugin
             */

            new CopyWebpackPlugin({
                patterns: [
                    { from: './src/css/_bootstrap-variables.less', to: './constants/bootstrap-variables.less' }
                ]
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
