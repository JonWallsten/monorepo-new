import webpackMerge from 'webpack-merge';
import WriteFileWebpackPlugin from 'write-file-webpack-plugin';
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
                    test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
                    use: '@ngtools/webpack',
                    include: helpers.includeTS
                },
                /**
                 * Css loader support for *.css files (styles directory only)
                 * Loads external css styles into the DOM, supports HMR
                 *
                 */
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader'],
                    include: helpers.includeStyles
                },
                /**
                 * Less loader support for *.less files (styles directory only)
                 * Loads external less styles into the DOM, supports HMR
                 *
                 */
                {
                    test: /\.scss$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
                    include: helpers.includeStyles
                }
            ]

        },

        plugins: [
            oasProgressPlugin,

            // new CheckerPlugin(),

            new WriteFileWebpackPlugin({
                log: true,
                test: /(\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json)$/
            }),

            useSourcemaps && new EvalSourceMapDevToolPlugin({
                moduleFilenameTemplate: 'web-lib-angular-2://[resource-path]',
                exclude: /dist[\\\/]|\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
