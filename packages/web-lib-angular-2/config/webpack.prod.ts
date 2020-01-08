
import webpackMerge from 'webpack-merge';
import * as helpers from './helpers';
import commonConfig from './webpack.base';

/**
 * Webpack Plugins
 */
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { DefinePlugin } from 'webpack';

export default () => {
    const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
    const useSourcemaps: boolean = process.env.USE_SOURCEMAPS !== undefined;

    return webpackMerge(commonConfig({ env: ENV }), {
        mode: ENV,
        module: {
            rules: [
                /**
                 * Compile components
                 */
                {
                    test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
                    use: '@ngtools/webpack',
                    include: helpers.includeTS
                },
                {
                    test: useSourcemaps ? /\.js$/ : () => false,
                    use: 'source-map-loader',
                    enforce: 'pre',
                    include: useSourcemaps ? helpers.includeSourceMaps : []
                },
                {
                    test: /\.css$/,
                    use: [
                        { loader: MiniCssExtractPlugin.loader },
                        'css-loader',
                        'postcss-loader'
                    ],
                    include: helpers.includeStyles
                },
                {
                    test: /\.scss$/,
                    use: [
                        { loader: MiniCssExtractPlugin.loader },
                        'css-loader',
                        'postcss-loader',
                        'sass-loader'
                    ],
                    include: helpers.includeStyles
                }
            ]
        },

        devtool: useSourcemaps && 'inline-source-map',

        optimization: {
            minimize: false
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
                'process.env.NODE_ENV': '"production"'
            }),
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: '[name].[hash].css'
            })
        ].filter(Boolean)
    });
};
