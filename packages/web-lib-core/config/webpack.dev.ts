import webpackMerge from 'webpack-merge';
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
        devtool: false, // handled by EvalSourceMapDevToolPlugin
        watchOptions: {
            aggregateTimeout: 300,
            ignored: /\/node_modules\/|\/\.cache\//
        },

        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: '../tsconfig.build.json'
                    },
                    include: helpers.include
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
            oasProgressPlugin('web-lib-core'),

            new WatchControllerPlugin(),

            new EvalSourceMapDevToolPlugin({
                moduleFilenameTemplate: 'web-lib-core://[resource-path]',
                exclude: /\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
