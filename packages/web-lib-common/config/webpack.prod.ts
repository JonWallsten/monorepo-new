import * as TerserPlugin from 'terser-webpack-plugin';
import webpackMerge from 'webpack-merge';
import * as helpers from './helpers';
import commonConfig from './webpack.base';

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

        devtool: useSourcemaps ? 'inline-source-map' : false,

        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: 2020 as TerserPlugin.TerserECMA,
                        mangle: false, // Do not mangle (avoid needing ng-annotate in legacy AngularJs)
                        compress: true,
                        keep_classnames: true,
                        keep_fnames: true,
                        output: {
                            comments: false
                        }
                    }
                })
            ]
        }
    });
};
