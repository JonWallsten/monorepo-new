import webpackMerge from 'webpack-merge';
import { host, port } from './globals';
import * as helpers from './helpers';
import commonConfig from './webpack.base';

import { EvalSourceMapDevToolPlugin } from 'webpack';
import { oasProgressPlugin } from '../../../build-tools/plugins/progress';
import { WatchControllerPlugin } from '../../../build-tools/plugins/watch-controller';

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
export default () => {
    const ENV = process.env.ENV = process.env.NODE_ENV = 'development';

    return webpackMerge(commonConfig({ env: ENV }), {
        mode: ENV,
        output: {
            publicPath: '/' // note: do not use './', webpack-dev-server requires '/'
        },
        devtool: false, // handled by EvalSourceMapDevToolPlugin
        devServer: {
            host,
            port,
            hot: true,
            allowedHosts: 'all',
            static: {
                directory: helpers.rootPath('dist'),
                watch: {
                    aggregateTimeout: 300,
                    ignored: /\/node_modules\/[\\\/]packages[\\\/]web-(?:lib|app)-.*[\\\/]dist[\\\/]|\/\.cache\//
                },
            },
            client: {
                overlay: {
                    warnings: false,
                    errors: true
                }
            },
            devMiddleware: {
                writeToDisk: true
            },
            // Fix for getting appentries from prime
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:4000',
                'Access-Control-Expose-Headers': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            },
        } as any, // Fix until types are updated for 4.x.x.

        module: {

            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: '../tsconfig.build.json'
                    },
                    include: helpers.includeTS
                },
                /**
                 * To string and css loader support for *.css files (from Angular components)
                 * Returns file content as string
                 *
                 */
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader'],
                    include: helpers.includeStyles
                },

                /**
                 * To string and sass loader support for *.scss files (from Angular components)
                 * 'Returns compiled css content as string'
                 *
                 */
                {
                    test: /\.less$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader', 'less-loader'],
                    include: helpers.includeStyles
                }
            ]

        },

        cache: {
            type: 'filesystem',
            cacheDirectory: helpers.rootPath('.cache')
        },

        optimization: {
            moduleIds: 'natural'
        },

        plugins: [
            oasProgressPlugin('web-app-wui'),

            new WatchControllerPlugin(),

            new EvalSourceMapDevToolPlugin({
                moduleFilenameTemplate: 'web-app-wui://[resource-path]',
                exclude: /\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
