import webpackMerge from 'webpack-merge';
import WriteFileWebpackPlugin from 'write-file-webpack-plugin';
import { devServerUrl, host, port } from './globals';
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

        //devtool: 'source-map',

        devServer: {
            host,
            port,
            contentBase: helpers.rootPath('dist'),
            noInfo: true,
            hot: true, // For some reason this is igonored by webpack-dev-server. So the flag --hot is needed in package.json.
            disableHostCheck: true,
            overlay: {
                warnings: false,
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
                    router: (req) => {
                        // Check if environment is passed. If not we add it. Missing environment key/value vauses init request to fail.
                        const path = /environment/.test(req.originalUrl) ? req.originalUrl : `${req.originalUrl}?environment=1`;
                        return devServerUrl + path;
                    }
                },
                '/log': {
                    target: devServerUrl,
                    secure: false,
                    onError: (_err, _req, res) => {
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

        plugins: [
            oasProgressPlugin,

            // new CheckerPlugin(),

            new WriteFileWebpackPlugin({
                log: true,
                test: /(\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json)$/
            }),

            useSourcemaps && new EvalSourceMapDevToolPlugin({
                moduleFilenameTemplate: 'web-app-edit://[resource-path]',
                exclude: /dist[\\\/]|\.html|\.css|\.less|\.woff|\.woff2|\.svg|\.ttf|\.eot|\.jpg|\.png|\.gif|\.json|node_modules/
            } as any)
        ].filter(Boolean)
    });
};
