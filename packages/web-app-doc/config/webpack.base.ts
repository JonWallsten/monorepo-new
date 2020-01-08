import * as helpers from './helpers';

/**
 * Webpack Plugins
 */
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration, DefinePlugin, optimize } from 'webpack';
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
    const isProd = options.env === 'production';

    const config: Configuration = {
        entry: {
            main: [
                './src/index.ts',
                './src/legacy.ts'
            ]
        },
        output: {
            path: helpers.rootPath('dist'),
            filename: isProd ? '[name].[chunkhash].js' : '[name].js',
            publicPath: './'
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
                '@oas/web-lib-common': projectRootPath('packages/web-lib-common/dist'),
                '@oas/web-lib-angular-js': projectRootPath('packages/web-lib-angular-js/dist')
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
                    use: 'html-loader',
                    include: helpers.include
                },

                /**
                 * File loader for supporting images, for example, in CSS files.
                 */
                {
                    test: /\.(jpg|png|gif)$/,
                    loader: 'file-loader',
                    options: {
                        name: '[hash].[ext]',
                        outputPath: 'images/',
                        publicPath: '',
                        esModule: false // Removes the default "./"
                    }
                },

                /**
                 * File loader for supporting fonts, for example, in CSS files.
                 */
                {
                    test: /\.(eot|woff2?|svg|ttf)([\?]?.*)$/,
                    loader: 'file-loader',
                    options: {
                        name: '[hash].[ext]',
                        outputPath: 'fonts/',
                        publicPath: '', // Removes the default "./"
                        esModule: false
                    }
                }

            ]
        },
        optimization: {
            occurrenceOrder: true,
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
             * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
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

            /**
             * Plugin: CopyWebpackPlugin
             * Description: Copy files and directories in webpack.
             *
             * Copies project static assets.
             *
             * See: https://www.npmjs.com/package/copy-webpack-plugin
             */

            new CopyWebpackPlugin([
                { from: './src/appentries.json', to: './appentries.json' },
                { from: './src/favicon.png', to: './favicon.png' }
            ]),

            // Could probably be removes once everything is TS
            new optimize.OccurrenceOrderPlugin(true),

            new CleanWebpackPlugin()

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
