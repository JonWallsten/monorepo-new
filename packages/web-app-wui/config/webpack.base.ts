import * as helpers from './helpers';

/**
 * Webpack Plugins
 */
// @ts-ignore
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration, DefinePlugin } from 'webpack';
import { projectRootPath } from '../../../build-tools/helpers';
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

export interface IWebpackOptions {
    env?: string;
}

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
export default (options: IWebpackOptions) => {
    const isProd = options.env === 'production';

    const config: Configuration = {
        entry: {
            main: [
                './src/lib/index.ts',
                './src/index.ts',
                './src/legacy.ts'
            ]
        },
        output: {
            path: helpers.rootPath('dist'),
            filename: isProd ? '[name].[chunkhash].js' : '[name].js',
            publicPath: './',
            clean: true
        },
        experiments: {
            // futureDefaults: true, // Generates lots of warnings, only use for debugging
            backCompat: false,
            cacheUnaffected: true
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
            ],
            alias: {
                '@oas/web-lib-core': projectRootPath('packages/web-lib-core/dist'),
                '@oas/web-lib-common': projectRootPath('packages/web-lib-common/dist')
            }
        },

        /**
         * Options affecting the normal modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#module
         */
        module: {

            rules: [
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
                        esModule: false,
                        sources: {
                            urlFilter: (_attribute, value, _resourcePath) => {
                                if (/worker-javascript.js$/.test(value)) {
                                    return false;
                                }

                                return true;
                            }
                        }
                    },
                    include: helpers.include
                },

                /**
                 * File loader for supporting images, for example, in CSS files.
                 */
                 {
                    test: /\.(jpg|png|gif)$/,
                    type: "asset/resource",
                    generator: {
                        filename: 'images/[name].[hash].[ext]'
                    },
                    include: helpers.include
                },

                /**
                 * File loader for supporting fonts, for example, in CSS files.
                 */
                {
                    test: /\.(eot|woff2?|svg|ttf)([\?]?.*)$/,
                    type: "asset/resource",
                    generator: {
                        filename: 'fonts/[name].[hash].[ext]'
                    },
                    include: helpers.includeFonts
                }

            ]
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /node_modules/,
                        chunks: 'initial',
                        name: 'vendor',
                        enforce: true
                    },
                    lib: {
                        test: /web-lib-/,
                        chunks: 'initial',
                        name: 'lib',
                        enforce: true
                    }
                }
            }
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

            new HtmlWebpackPlugin({
                template: helpers.rootPath('src/index.html'),
                filename: 'index.html',
                chunks: ['vendor', 'lib', 'legacy', 'main'],
                chunksSortMode: 'manual',
                inject: true
            }),

            new MonacoWebpackPlugin({
                languages : []
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
                    { from: './src/appentries.json', to: './appentries.json' },
                    { from: './src/favicon.png', to: './favicon.png' },
                    // Worker tries to require a module that ace creates in runtime, hence it can't be resolved when bundling, so we don't bother to minify it.
                    { from: '../../node_modules/ace-builds/src-noconflict/worker-javascript.js', to: 'worker-javascript.js' },
                    { from: '../../node_modules/ace-builds/src-noconflict/worker-xml.js', to: 'worker-xml.js' }
                ]
            })
        ]
    };

    return config;
};
