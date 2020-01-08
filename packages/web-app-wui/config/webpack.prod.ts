import webpackMerge from 'webpack-merge';
import * as helpers from './helpers';
import commonConfig from './webpack.base';

/**
 * Webpack Plugins
 */
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { DefinePlugin, SourceMapDevToolPlugin } from 'webpack';

export default () => {
    const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
    const useSourcemaps: boolean = process.env.USE_SOURCEMAPS !== undefined;

    return webpackMerge(commonConfig({ env: ENV }), {
        mode: ENV,
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: 'ng-annotate-loader',
                            options: {
                                add: true,
                                single_quotes: true
                            }
                        },
                        {
                            loader: 'ts-loader',
                            options: {
                                configFile: '../tsconfig.build.json'
                            }
                        }
                    ],
                    include: helpers.includeTS
                },
                {
                    test: /\.js$/,
                    use: 'source-map-loader',
                    enforce: 'pre',
                    include: process.env.USE_SOURCEMAPS ? helpers.include : []
                },
                /**
                 * To string and css loader support for *.css files (from Angular components)
                 * Returns file content as string
                 *
                 */
                {
                    test: /\.css$/,
                    use: [
                        { loader: MiniCssExtractPlugin.loader },
                        'css-loader',
                        'postcss-loader'
                    ],
                    include: helpers.includeStyles
                },
                /**
                 * To string and sass loader support for *.less files (from Angular components)
                 * Returns compiled css content as string
                 *
                 */
                {
                    test: /\.less$/,
                    use: [
                        { loader: MiniCssExtractPlugin.loader },
                        'css-loader',
                        'postcss-loader',
                        'less-loader'
                    ],
                    include: helpers.includeStyles
                }
            ]

        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: 5,
                        keep_classnames: true,
                        keep_fnames: true
                    }
                })
            ]
        },
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
                'process.env.NODE_ENV': '"production"'
            }),
            new MiniCssExtractPlugin({
                filename: '[name].[hash].css',
                allChunks: true
            }),

            useSourcemaps && new SourceMapDevToolPlugin({
                moduleFilenameTemplate: 'web-app-wui://[resource-path]',
                exclude: /dist[\\\/]|\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
