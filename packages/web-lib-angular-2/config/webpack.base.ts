import * as helpers from './helpers';

/**
 * Webpack Plugins
 */
import { AngularCompilerPlugin } from '@ngtools/webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { DefinePlugin } from 'webpack';
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
    //const envPrefix = isProd ? '.prod' : '';

    const config: any = { // Configuration
        entry: {
            index: './src/index.ts'
        },
        output: {
            path: helpers.rootPath('dist'),
            filename: '[name].js',
            libraryTarget: 'umd',
            globalObject: 'this'
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
            extensions: ['.ts', '.js', '.json', '.css', '.scss'],

            /**
             * An array of directory names to be resolved to the current directory
             */
            modules: [
                helpers.rootPath('src'),
                helpers.rootPath('node_modules'),
                projectRootPath('node_modules')
            ]
        },
        externals: /^(@angular\/.*|lodash|axios|@oas\/web-lib-core)$/i,

        /**
         * Options affecting the normal modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#module
         */
        module: {
            rules: [
                {
                    // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
                    // Removing this will cause deprecation warnings to appear.
                    test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
                    parser: { system: true }
                },
                {
                    test: /\.css$/,
                    use: ['to-string-loader', 'css-loader', 'postcss-loader'],
                    exclude: helpers.includeStyles
                },
                {
                    test: /\.scss$/,
                    use: ['to-string-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
                    exclude: helpers.includeStyles
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
                    loader: 'file-loader',
                    options: {
                        name: '[hash].[ext]',
                        outputPath: 'assets/images/',
                        publicPath: '', // Removes the default "./"
                        esModule: false
                    }
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'assets/fonts/',
                            publicPath: '', // Removes the default "./"
                            esModule: false
                        }
                    }]
                }
            ]

        },

        optimization: {
            //runtimeChunk: true,
            occurrenceOrder: true
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

            /**
             * Plugin: CopyWebpackPlugin
             * Description: Copy files and directories in webpack.
             *
             * Copies project static assets.
             *
             * See: https://www.npmjs.com/package/copy-webpack-plugin
             */

            new CopyWebpackPlugin([
                { from: 'src/assets', to: 'assets' }
            ]),

            new AngularCompilerPlugin({
                tsConfigPath: helpers.rootPath('tsconfig.build.json'),
                mainPath: helpers.rootPath('src/index.ts'),
                sourceMap: false
            }),

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