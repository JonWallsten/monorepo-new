import webpackMerge from 'webpack-merge';
import * as helpers from './helpers';
import commonConfig from './webpack.base';

/**
 * Webpack Plugins
 */
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as TerserPlugin from 'terser-webpack-plugin';
import { DefinePlugin } from 'webpack';

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
                            loader: 'ts-loader',
                            options: {
                                configFile: '../tsconfig.build.json'
                            }
                        }
                    ],
                    include: helpers.includeTS
                },
                {
                    test: useSourcemaps ? /\.js$/ : () => false,
                    use: 'source-map-loader',
                    enforce: 'pre',
                    include: useSourcemaps ? helpers.includeSourceMaps : []
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
                        ecma: 2020,
                        mangle: false, // Do not mangle (avoid needing ng-annotate in legacy AngularJs)
                        // mangle: {
                        //    reserved: [ 'process' ] // Preserve process.env in dist (needed for config based on runtime env in node scripts)
                        //}
                        compress: true,
                        keep_classnames: true,
                        keep_fnames: true,
                        output: {
                            comments: false
                        }
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
             * See: https://webpack.js.org/plugins/define-plugin/#root
             */
            // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
            new DefinePlugin({
                'process.env.NODE_ENV': '"production"'
            }),
            new MiniCssExtractPlugin({
                filename: '[name].[fullhash].css'
            })
        ]
    });
};
