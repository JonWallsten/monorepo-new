import webpackMerge from 'webpack-merge';
import * as helpers from './helpers';
import commonConfig from './webpack.base';
import * as TerserPlugin from 'terser-webpack-plugin';

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
                    test: useSourcemaps ? /\.js$/ : () => false,
                    use: 'source-map-loader',
                    enforce: 'pre',
                    include: useSourcemaps ? helpers.includeSourceMaps : []
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

        devtool: useSourcemaps ? 'inline-source-map' : false,

        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: 5,
                        keep_classnames: true,
                        keep_fnames: true,
                        output: {
                            comments: false
                        },
                        sourceMap: useSourcemaps && {
                            url: 'inline'
                        },
                        mangle: {
                            reserved: [ 'process' ] // Preserve process.env in dist (needed for config based on runtime env in node scripts)
                        }
                    }
                })
            ]
        }
    });
};
