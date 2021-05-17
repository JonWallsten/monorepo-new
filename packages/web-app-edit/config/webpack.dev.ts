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
        //stats: 'verbose',
        devServer: {
            host,
            port,
            contentBase: helpers.rootPath('dist'),
            noInfo: true,
            // stats: 'verbose',
            hot: true, // For some reason this is igonored by webpack-dev-server. So the flag --hot is needed in package.json.
            disableHostCheck: true,
            writeToDisk: true,
            overlay: {
                warnings: false,
                errors: true
            },
            watchOptions: {
                aggregateTimeout: 300,
                ignored: /\/node_modules\/|web-lib-angular\/src|[\\\/]packages[\\\/]web-(?:lib|app)-.*[\\\/]dist[\\\/]|\$\$_lazy_route_resource|\/\.cache\//
            },
            // Fix for getting appentries from prime
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:4000',
                'Access-Control-Expose-Headers': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            }
        },

        module: {

            rules: [
                {
                    test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
                    use: '@ngtools/webpack',
                    include: helpers.includeTS
                },
                {
                    test: /\.js$/,
                    use: 'source-map-loader',
                    enforce: 'pre',
                    include: helpers.includeSourceMaps
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
                 * Scss loader support for *.scss files (styles directory only)
                 * Loads external scss styles into the DOM, supports HMR
                 *
                 */
                {
                    test: /\.scss$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
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
            oasProgressPlugin('web-app-edit'),

            new WatchControllerPlugin(),

            new EvalSourceMapDevToolPlugin({
                moduleFilenameTemplate: (info: any) => {
                    // Match sourcemaps from Angular library
                    if (info.resourcePath.match(/ng:[\\\/]{2}/)) {
                        return info.resourcePath.replace(/ng:[\\\/]{2}@oas[\\\/]web-lib-angular[\\\/]/, 'web-lib-angular://./src/');
                    }
                    return `web-app-edit://${info.resourcePath}`;
                },
                exclude: /\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
