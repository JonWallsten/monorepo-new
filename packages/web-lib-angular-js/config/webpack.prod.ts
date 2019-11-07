import webpackMerge from 'webpack-merge';
import * as helpers from './helpers';
import commonConfig from './webpack.base';
import { SourceMapDevToolPlugin } from 'webpack';

/**
 * Webpack Plugins
 */


export default () => {
    const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
    const useSourcemaps: boolean = process.env.USE_SOURCEMAPS !== undefined;

    return webpackMerge(commonConfig({ env: ENV }), {
        mode: ENV,

        module: {

            rules: [
                /**
                 *
                 *
                 */
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

                // Even though we only have TS-files, our vendors might have JS, so this is still needed.
                {
                    test: /\.js$/,
                    loader: 'ng-annotate-loader',
                    options: {
                        add: true,
                        single_quotes: true
                    },
                    include: helpers.includeTS
                }

            ]

        },

        /**
         * Add additional plugins to the compiler.
         *
         * See: http://webpack.github.io/docs/configuration.html#plugins
         */
        plugins: [
            useSourcemaps && new SourceMapDevToolPlugin({
                moduleFilenameTemplate: 'web-lib-angular-js://[resource-path]',
                exclude: /dist[\\\/]|\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
