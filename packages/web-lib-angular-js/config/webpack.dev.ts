import webpackMerge from 'webpack-merge';
import * as helpers from './helpers';
import commonConfig from './webpack.base';

import { EvalSourceMapDevToolPlugin } from 'webpack';
import { projectRootPath } from '../../../build-tools/helpers';
import { oasProgressPlugin } from '../../../config/plugins/progress';

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
export default () => {
    const ENV = process.env.ENV = process.env.NODE_ENV = 'development';
    const useSourcemaps = !process.env.SKIP_SOURCEMAP;

    return webpackMerge(commonConfig({ env: ENV }), {
        mode: ENV,
        devtool: false, // handled by EvalSourceMapDevToolPlugin
        watchOptions: {
            aggregateTimeout: 300,
            ignored: [
                helpers.rootPath('node_modules'),
                projectRootPath('node_modules')
            ]
        },

        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: '../tsconfig.build.json'
                    },
                    include: helpers.includeTS
                }
            ]
        },

        plugins: [
            oasProgressPlugin,

            useSourcemaps && new EvalSourceMapDevToolPlugin({
                moduleFilenameTemplate: 'web-lib-angular-js://[resource-path]',
                exclude: /dist[\\\/]|\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
