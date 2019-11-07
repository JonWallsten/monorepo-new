import webpackMerge from 'webpack-merge';
import { devServerUrl, host, port } from './globals';
import * as helpers from './helpers';
import commonConfig from './webpack.base';

import { HotModuleReplacementPlugin, NamedModulesPlugin, NoEmitOnErrorsPlugin, EvalSourceMapDevToolPlugin } from 'webpack';
import WriteFileWebpackPlugin from 'write-file-webpack-plugin';
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
        output: {
            publicPath: '/' // note: do not use './', webpack-dev-server requires '/'
        },
        devtool: false, // handled by EvalSourceMapDevToolPlugin
        watchOptions: {
            aggregateTimeout: 300,
            ignored: [
                helpers.rootPath('node_modules'),
                projectRootPath('node_modules')
            ]
        },

        devServer: {
            host,
            port,
            contentBase: helpers.rootPath('dist'),
            noInfo: true,
            hot: true,
            disableHostCheck: true,
            overlay: {
                warnings: true,
                errors: true
            },
            // Fix for getting appentries from prime
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:4000',
                'Access-Control-Expose-Headers': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Credentials': 'true'
            },
            // Refirects for init and log in dev mode
            proxy: {
                '/init': {
                    target: devServerUrl,
                    changeOrigin: true,
                    secure: false,
                    router: (req: any) => {
                        // Check if environment is passed. If not we add it. Missing environment key/value vauses init request to fail.
                        const path = /environment/.test(req.originalUrl) ? req.originalUrl : `${req.originalUrl}?environment=1`;
                        return devServerUrl + path;
                    }
                },
                '/log': {
                    target: devServerUrl,
                    secure: false,
                    onError: (_err: any, _req: any, res: any) => {
                        res.writeHead(200, {
                            'Content-Type': 'text/plain'
                        });
                        res.end('Logging not enabled on localhost');
                    }
                }
            }
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
                },
                /**
                 * To string and css loader support for *.css files (from Angular components)
                 * Returns file content as string
                 *
                 */
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader?sourceMap', 'postcss-loader?sourceMap'],
                    include: helpers.includeStyles

                },

                /**
                 * To string and sass loader support for *.scss files (from Angular components)
                 * Returns compiled css content as string
                 *
                 */
                {
                    test: /\.less$/,
                    use: ['style-loader', 'css-loader?sourceMap', 'postcss-loader?sourceMap', 'less-loader?sourceMap'],
                    include: helpers.includeStyles

                }
            ]

        },

        plugins: [
            oasProgressPlugin,

            new WriteFileWebpackPlugin({
                log: true,
                test: /(\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json)$/
            }),

            // enable HMR globally
            new HotModuleReplacementPlugin(),

            // prints more readable module names in the browser console on HMR updates
            new NamedModulesPlugin(),

            // do not emit compiled assets that include errors
            new NoEmitOnErrorsPlugin(),

            useSourcemaps && new EvalSourceMapDevToolPlugin({
                moduleFilenameTemplate: 'web-app-structure://[resource-path]',
                exclude: /dist[\\\/]|\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
